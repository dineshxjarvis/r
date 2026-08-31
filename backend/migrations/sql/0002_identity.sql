-- 0002_identity.sql — L0 foundation: tenancy, organisations, people,
-- principals, credentials, sessions, physical hierarchy, positions,
-- appointments, regulator authority, mandates, jurisdiction, policy.
-- Implements foundation-data-model.md + identity-authority-model.md.
--
-- Six questions kept separate, never collapsed into a role enum:
--   who authenticated (principal/session) · which human (person) ·
--   associated with whom (affiliation) · which position (appointment→post) ·
--   where (jurisdiction_assignment) · what (capability via mandate/policy).

-- === state machines (closed, additive) ===
CREATE TYPE tenant_status        AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE org_status           AS ENUM ('ACTIVE', 'SUSPENDED', 'DISSOLVED');
CREATE TYPE person_status        AS ENUM ('ACTIVE', 'INACTIVE', 'MERGED', 'DECEASED');
CREATE TYPE principal_kind       AS ENUM ('HUMAN', 'SERVICE');
CREATE TYPE principal_status     AS ENUM ('ACTIVE', 'SUSPENDED', 'LOCKED', 'DISABLED');
CREATE TYPE assurance_level      AS ENUM ('PASSWORD', 'MFA', 'PASSKEY', 'STEP_UP');
CREATE TYPE mine_status          AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED', 'ABANDONED');
CREATE TYPE mine_type            AS ENUM ('OPENCAST', 'UNDERGROUND', 'MIXED');
CREATE TYPE gassiness_class      AS ENUM ('DEGREE_I', 'DEGREE_II', 'DEGREE_III', 'NOT_APPLICABLE');
CREATE TYPE holder_policy        AS ENUM ('SINGLE_HOLDER', 'MULTI_HOLDER');
CREATE TYPE post_status          AS ENUM ('ACTIVE', 'INACTIVE', 'ABOLISHED');
CREATE TYPE appointment_mode     AS ENUM ('REGULAR', 'ACTING', 'ADDITIONAL_CHARGE');
CREATE TYPE risk_class           AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- system-wide severity vocabulary, reused by defects/findings/signals
CREATE TYPE severity             AS ENUM ('MINOR', 'SIGNIFICANT', 'SEVERE');

-- === tenancy and organisations ===

CREATE TABLE tenant (
  id           TEXT PRIMARY KEY,
  code         TEXT NOT NULL UNIQUE,
  name         TEXT NOT NULL,
  status       tenant_status NOT NULL DEFAULT 'ACTIVE',
  data_region  TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- A legal/administrative body: operator, ministry, regulator, contractor.
-- tenant_id NULL = platform-registered (a regulator or ministry is not a
-- member of any tenant). organization_kind is reference data (enum_registry:
-- 'organization_kind'), not a PG enum.
CREATE TABLE organization (
  id                 TEXT PRIMARY KEY,
  tenant_id          TEXT REFERENCES tenant(id),
  code               TEXT NOT NULL,
  legal_name         TEXT NOT NULL,
  organization_kind  TEXT NOT NULL,        -- 'OPERATOR' | 'REGULATOR' | 'MINISTRY' | 'CONTRACTOR' | ...
  registration_ref   TEXT,
  status             org_status NOT NULL DEFAULT 'ACTIVE',
  succeeds_id        TEXT REFERENCES organization(id),  -- post-merger/rename successor;
                                                        -- history is never laundered by a rename
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code)
);
CREATE INDEX organization_tenant_idx ON organization (tenant_id);

-- Recursive: subsidiary, area, directorate, regional office, project office.
-- Never forces operator → subsidiary → area on operators that don't use it.
CREATE TABLE organization_unit (
  id               TEXT PRIMARY KEY,
  organization_id  TEXT NOT NULL REFERENCES organization(id),
  parent_unit_id   TEXT REFERENCES organization_unit(id),
  unit_kind        TEXT NOT NULL,          -- reference data: 'SUBSIDIARY' | 'AREA' | 'ZONE' | ...
  code             TEXT NOT NULL,
  name             TEXT NOT NULL,
  valid_from       TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, code),
  CHECK (valid_until IS NULL OR valid_until > valid_from),
  CHECK (parent_unit_id IS DISTINCT FROM id)
);
CREATE INDEX org_unit_parent_idx ON organization_unit (parent_unit_id);

-- === identity and authentication ===

-- A human. No employment type, role, tenant or login status — those live on
-- relationships (affiliation/appointment) and on principal.
CREATE TABLE person (
  id              TEXT PRIMARY KEY,
  display_name    TEXT NOT NULL,
  primary_email   TEXT,                    -- mutable contact data, never an identity key
  phone           TEXT,
  status          person_status NOT NULL DEFAULT 'ACTIVE',
  merged_into_id  TEXT REFERENCES person(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((status = 'MERGED') = (merged_into_id IS NOT NULL))
);

-- Authenticating subject. credential_version invalidates all sessions on bump.
CREATE TABLE principal (
  id                     TEXT PRIMARY KEY,
  kind                   principal_kind NOT NULL,
  person_id              TEXT REFERENCES person(id),
  status                 principal_status NOT NULL DEFAULT 'ACTIVE',
  credential_version     INTEGER NOT NULL DEFAULT 1,
  last_authenticated_at  TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((kind = 'HUMAN') = (person_id IS NOT NULL))
);
CREATE UNIQUE INDEX principal_person_unique ON principal (person_id)
  WHERE person_id IS NOT NULL AND status <> 'DISABLED';

CREATE TABLE password_authenticator (
  principal_id   TEXT PRIMARY KEY REFERENCES principal(id),
  password_hash  TEXT NOT NULL,            -- argon2id
  parameters     JSONB NOT NULL DEFAULT '{}'::jsonb,
  changed_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at     TIMESTAMPTZ
);

-- Keyed by (issuer, subject), never email.
CREATE TABLE oidc_identity (
  id            TEXT PRIMARY KEY,
  principal_id  TEXT NOT NULL REFERENCES principal(id),
  issuer        TEXT NOT NULL,
  subject       TEXT NOT NULL,
  linked_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at    TIMESTAMPTZ,
  UNIQUE (issuer, subject)
);
CREATE INDEX oidc_principal_idx ON oidc_identity (principal_id);

CREATE TABLE passkey_credential (
  id             TEXT PRIMARY KEY,
  principal_id   TEXT NOT NULL REFERENCES principal(id),
  credential_id  TEXT NOT NULL UNIQUE,     -- WebAuthn credential ID, base64url
  public_key     BYTEA NOT NULL,
  sign_count     BIGINT NOT NULL DEFAULT 0,
  transports     TEXT[],
  label          TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at     TIMESTAMPTZ
);
CREATE INDEX passkey_principal_idx ON passkey_credential (principal_id);

-- Server-side session state. The cookie carries only the opaque ID; we store
-- its hash. Selected context is navigation only — no grants live here.
CREATE TABLE session (
  id_hash                 TEXT PRIMARY KEY,      -- sha256 of the opaque cookie value
  principal_id            TEXT NOT NULL REFERENCES principal(id),
  credential_version      INTEGER NOT NULL,      -- must equal principal.credential_version
  assurance_level         assurance_level NOT NULL,
  authenticated_at        TIMESTAMPTZ NOT NULL,
  issued_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  idle_expires_at         TIMESTAMPTZ NOT NULL,
  absolute_expires_at     TIMESTAMPTZ NOT NULL,
  selected_tenant_id      TEXT REFERENCES tenant(id),
  selected_resource_type  TEXT,
  selected_resource_id    TEXT,
  csrf_secret_hash        TEXT NOT NULL,
  device_fingerprint      TEXT,
  ip_address              INET,
  user_agent              TEXT,
  revoked_at              TIMESTAMPTZ,
  revocation_reason       TEXT
);
CREATE INDEX session_principal_idx ON session (principal_id) WHERE revoked_at IS NULL;
CREATE INDEX session_expiry_idx ON session (absolute_expires_at) WHERE revoked_at IS NULL;

-- Time-bounded person↔organisation relationship: employee, contractor
-- worker, regulator officer, consultant, secondee. Concurrent rows allowed.
CREATE TABLE affiliation (
  id                    TEXT PRIMARY KEY,
  person_id             TEXT NOT NULL REFERENCES person(id),
  organization_id       TEXT NOT NULL REFERENCES organization(id),
  organization_unit_id  TEXT REFERENCES organization_unit(id),
  affiliation_kind      TEXT NOT NULL,     -- reference data: 'EMPLOYEE' | 'CONTRACTOR_WORKER' | 'REGULATOR_OFFICER' | ...
  external_reference    TEXT,              -- employee no., service id
  valid_from            TIMESTAMPTZ NOT NULL,
  valid_until           TIMESTAMPTZ,
  revoked_at            TIMESTAMPTZ,
  superseded_by_id      TEXT REFERENCES affiliation(id),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);
CREATE INDEX affiliation_person_idx ON affiliation (person_id);
CREATE INDEX affiliation_org_idx ON affiliation (organization_id);

-- === physical hierarchy: mine → subunit → asset ===
-- Separate from the administrative hierarchy; asset_responsibility (deferred
-- to v0.02) links organisation units to physical assets.

-- mine carries the applicability dimensions the obligation engine evaluates:
-- mine_type / gassiness_class / production_scale_tpa / headcount.
CREATE TABLE mine (
  id                    TEXT PRIMARY KEY,
  tenant_id             TEXT NOT NULL REFERENCES tenant(id),
  code                  TEXT NOT NULL,
  name                  TEXT NOT NULL,
  mine_type             mine_type NOT NULL,
  gassiness_class       gassiness_class NOT NULL DEFAULT 'NOT_APPLICABLE',
  production_scale_tpa  NUMERIC(14,2),
  headcount             INTEGER,
  lease_ref             TEXT,
  state_code            TEXT,               -- ISO 3166-2:IN, jurisdiction selector input
  status                mine_status NOT NULL DEFAULT 'ACTIVE',
  location              geography(Point, 4326),
  boundary              geography(MultiPolygon, 4326),  -- convenience copy; the governed
                        -- lease/geofence truth is governed_geometry_version (0006)
  row_version           INTEGER NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);
CREATE INDEX mine_location_gix ON mine USING GIST (location);
CREATE INDEX mine_boundary_gix ON mine USING GIST (boundary);

CREATE TABLE subunit (
  id            TEXT PRIMARY KEY,
  tenant_id     TEXT NOT NULL REFERENCES tenant(id),
  mine_id       TEXT NOT NULL REFERENCES mine(id),
  code          TEXT NOT NULL,
  name          TEXT NOT NULL,
  subunit_kind  TEXT NOT NULL,             -- reference data: 'BENCH' | 'PANEL' | 'DISTRICT' | 'DUMP' | ...
  status        TEXT NOT NULL DEFAULT 'ACTIVE',
  location      geography(Point, 4326),
  footprint     geography(MultiPolygon, 4326),
  row_version   INTEGER NOT NULL DEFAULT 1,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mine_id, code)
);
CREATE INDEX subunit_location_gix ON subunit USING GIST (location);

CREATE TABLE asset (
  id           TEXT PRIMARY KEY,
  tenant_id    TEXT NOT NULL REFERENCES tenant(id),
  mine_id      TEXT NOT NULL REFERENCES mine(id),
  subunit_id   TEXT REFERENCES subunit(id),
  code         TEXT,
  name         TEXT NOT NULL,
  asset_kind   TEXT NOT NULL,              -- reference data: 'HAUL_ROAD' | 'BERM' | 'PUMP' | 'SENSOR' | ...
  status       TEXT NOT NULL DEFAULT 'ACTIVE',
  location     geography(Point, 4326),
  row_version  INTEGER NOT NULL DEFAULT 1,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX asset_mine_idx ON asset (mine_id);
CREATE INDEX asset_location_gix ON asset USING GIST (location);

-- === positions and appointments ===

CREATE TABLE position_template (
  id                      TEXT PRIMARY KEY,
  owning_organization_id  TEXT REFERENCES organization(id),  -- NULL = platform catalogue
  code                    TEXT NOT NULL UNIQUE,   -- 'MINE_MANAGER', 'SAFETY_OFFICER', 'INSPECTOR_OF_MINES'
  title                   TEXT NOT NULL,
  description             TEXT,
  statutory               BOOLEAN NOT NULL DEFAULT false,
  default_holder_policy   holder_policy NOT NULL DEFAULT 'SINGLE_HOLDER',
  active                  BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Concrete position. Several posts may share template and scope — there is
-- deliberately NO unique (template, scope) constraint (multiple inspectors
-- coexist). Scope is polymorphic (mine/tenant/organization_unit/authority_unit);
-- referential integrity is enforced by the application + FGA projector, per
-- foundation-data-model.md's explicit shape.
CREATE TABLE post (
  id                    TEXT PRIMARY KEY,
  organization_id       TEXT NOT NULL REFERENCES organization(id),
  organization_unit_id  TEXT REFERENCES organization_unit(id),
  position_template_id  TEXT NOT NULL REFERENCES position_template(id),
  holder_policy         holder_policy NOT NULL,
  scope_resource_type   TEXT,               -- 'mine' | 'tenant' | 'organization_unit' | 'authority_unit' | NULL
  scope_resource_id     TEXT,
  status                post_status NOT NULL DEFAULT 'ACTIVE',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((scope_resource_type IS NULL) = (scope_resource_id IS NULL))
);
CREATE INDEX post_scope_idx ON post (scope_resource_type, scope_resource_id);
CREATE INDEX post_org_idx ON post (organization_id);

-- Person holds a post for a bounded window under a source instrument.
-- holder_policy is denormalised from post at insert (trigger below) so the
-- single-holder overlap exclusion can be a table-local constraint.
CREATE TABLE appointment (
  id                            TEXT PRIMARY KEY,
  person_id                     TEXT NOT NULL REFERENCES person(id),
  post_id                       TEXT NOT NULL REFERENCES post(id),
  affiliation_id                TEXT REFERENCES affiliation(id),
  mode                          appointment_mode NOT NULL DEFAULT 'REGULAR',
  holder_policy                 holder_policy NOT NULL,   -- copied from post, immutable
  valid_from                    TIMESTAMPTZ NOT NULL,
  valid_until                   TIMESTAMPTZ NOT NULL,
  source_instrument_document_id TEXT,                     -- FK → document added in 0003
  appointed_by_appointment_id   TEXT REFERENCES appointment(id),
  revoked_at                    TIMESTAMPTZ,
  revoked_by_principal_id       TEXT REFERENCES principal(id),
  revoke_reason                 TEXT,
  superseded_by_id              TEXT REFERENCES appointment(id),
  row_version                   INTEGER NOT NULL DEFAULT 1,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until > valid_from)
);
-- Transactional single-holder occupancy: overlap of live appointments on one
-- single-holder post is rejected by the database, not the app.
ALTER TABLE appointment ADD CONSTRAINT single_holder_no_overlap
  EXCLUDE USING gist (
    post_id WITH =,
    tstzrange(valid_from, valid_until) WITH &&
  ) WHERE (holder_policy = 'SINGLE_HOLDER' AND revoked_at IS NULL AND superseded_by_id IS NULL);
CREATE INDEX appointment_person_idx ON appointment (person_id);
CREATE INDEX appointment_post_live_idx ON appointment (post_id, valid_until)
  WHERE revoked_at IS NULL AND superseded_by_id IS NULL;

CREATE OR REPLACE FUNCTION appointment_copy_holder_policy() RETURNS trigger AS $$
BEGIN
  SELECT p.holder_policy INTO STRICT NEW.holder_policy FROM post p WHERE p.id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER appointment_holder_policy BEFORE INSERT ON appointment
  FOR EACH ROW EXECUTE FUNCTION appointment_copy_holder_policy();

-- Derived, never stored: lapsing depends on wall-clock time.
CREATE VIEW appointment_status AS
SELECT a.*,
  CASE
    WHEN a.revoked_at IS NOT NULL       THEN 'REVOKED'
    WHEN a.superseded_by_id IS NOT NULL THEN 'SUPERSEDED'
    WHEN a.valid_until <= now()         THEN 'LAPSED'
    WHEN a.valid_from  >  now()         THEN 'PENDING'
    ELSE 'ACTIVE'
  END AS status
FROM appointment a;

-- === capabilities, regulator authority, mandates, jurisdiction ===

-- A capability names an action ('evidence.verify', 'finding.close_regulatory'),
-- never a title. Reference data, seeded + grown as rows.
CREATE TABLE capability (
  id                 TEXT PRIMARY KEY,
  code               TEXT NOT NULL UNIQUE,
  description        TEXT NOT NULL,
  risk_class         risk_class NOT NULL DEFAULT 'LOW',
  required_assurance assurance_level NOT NULL DEFAULT 'PASSWORD',
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE regulatory_authority (
  id               TEXT PRIMARY KEY,
  organization_id  TEXT NOT NULL REFERENCES organization(id),
  code             TEXT NOT NULL UNIQUE,     -- 'DGMS' | 'MOEFCC' | 'CPCB' | ...
  name             TEXT NOT NULL,
  active           BOOLEAN NOT NULL DEFAULT true,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE authority_unit (
  id                       TEXT PRIMARY KEY,
  regulatory_authority_id  TEXT NOT NULL REFERENCES regulatory_authority(id),
  parent_unit_id           TEXT REFERENCES authority_unit(id),
  unit_kind                TEXT NOT NULL,   -- reference data: 'HEADQUARTERS' | 'ZONE' | 'REGION' | 'STATE_OFFICE'
  code                     TEXT NOT NULL,
  name                     TEXT NOT NULL,
  valid_from               TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (regulatory_authority_id, code)
);

CREATE TABLE mandate (
  id                       TEXT PRIMARY KEY,
  regulatory_authority_id  TEXT NOT NULL REFERENCES regulatory_authority(id),
  code                     TEXT NOT NULL,
  name                     TEXT NOT NULL,
  description              TEXT,
  active                   BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (regulatory_authority_id, code)
);

CREATE TABLE mandate_capability (
  mandate_id     TEXT NOT NULL REFERENCES mandate(id),
  capability_id  TEXT NOT NULL REFERENCES capability(id),
  PRIMARY KEY (mandate_id, capability_id)
);

-- Grants a mandate to a specific regulator appointment. The authority name
-- alone grants nothing; the instrument does.
CREATE TABLE mandate_assignment (
  id                            TEXT PRIMARY KEY,
  appointment_id                TEXT NOT NULL REFERENCES appointment(id),
  mandate_id                    TEXT NOT NULL REFERENCES mandate(id),
  valid_from                    TIMESTAMPTZ NOT NULL,
  valid_until                   TIMESTAMPTZ NOT NULL,
  source_instrument_document_id TEXT,                     -- FK → document added in 0003
  revoked_at                    TIMESTAMPTZ,
  superseded_by_id              TEXT REFERENCES mandate_assignment(id),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until > valid_from)
);
CREATE INDEX mandate_assignment_appt_idx ON mandate_assignment (appointment_id);

-- Limits mandate coverage: explicit mine set, tenant portfolio, organisation
-- unit, state/geography, authority region. Superseded on redistricting,
-- never deleted. selector_payload follows a versioned schema per selector_type.
CREATE TABLE jurisdiction_assignment (
  id                            TEXT PRIMARY KEY,
  appointment_id                TEXT NOT NULL REFERENCES appointment(id),
  mandate_assignment_id         TEXT REFERENCES mandate_assignment(id),
  selector_type                 TEXT NOT NULL,   -- 'MINE_SET' | 'TENANT' | 'ORGANIZATION_UNIT' | 'STATE' | 'GEOGRAPHY' | 'PLATFORM_PORTFOLIO'
  selector_schema_version       INTEGER NOT NULL DEFAULT 1,
  selector_payload              JSONB NOT NULL,
  valid_from                    TIMESTAMPTZ NOT NULL,
  valid_until                   TIMESTAMPTZ NOT NULL,
  source_instrument_document_id TEXT,                     -- FK → document added in 0003
  revoked_at                    TIMESTAMPTZ,
  superseded_by_id              TEXT REFERENCES jurisdiction_assignment(id),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until > valid_from)
);
CREATE INDEX jurisdiction_appt_idx ON jurisdiction_assignment (appointment_id);

-- === policy and provenance ===

-- Organisational capabilities granted by holding a position.
CREATE TABLE position_capability_policy (
  id                        TEXT PRIMARY KEY,
  position_template_id      TEXT NOT NULL REFERENCES position_template(id),
  capability_id             TEXT NOT NULL REFERENCES capability(id),
  resource_relation         TEXT NOT NULL,          -- FGA relation the capability maps to at the post's scope
  conditions_schema_version INTEGER NOT NULL DEFAULT 1,
  conditions                JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (position_template_id, capability_id)
);

-- Who may close what: resource type + severity/category → required capability
-- + separation-of-duties rule.
CREATE TABLE resource_closure_policy (
  id                      TEXT PRIMARY KEY,
  resource_type           TEXT NOT NULL,            -- 'finding' | 'capa' | 'obligation_instance'
  category                TEXT NOT NULL,            -- severity band or issuance class, e.g. 'SEVERE', 'REGULATOR_ISSUED'
  issuing_authority_id    TEXT REFERENCES regulatory_authority(id),
  required_capability_id  TEXT NOT NULL REFERENCES capability(id),
  separation_policy       JSONB NOT NULL DEFAULT '{}'::jsonb,  -- {"verifier_not": ["submitted_by","assigned_to"]}
  valid_from              TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until             TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX closure_policy_idx ON resource_closure_policy (resource_type, category);

-- Persisted high-risk authorization decisions: which appointment/mandate
-- actually authorised the act.
CREATE TABLE authorization_decision (
  id                               TEXT PRIMARY KEY,
  principal_id                     TEXT NOT NULL REFERENCES principal(id),
  acting_person_id                 TEXT REFERENCES person(id),
  action                           TEXT NOT NULL,
  resource_type                    TEXT NOT NULL,
  resource_id                      TEXT NOT NULL,
  decision                         TEXT NOT NULL,   -- 'ALLOW' | 'DENY' | 'CONCEAL'
  policy_version                   TEXT,
  supporting_appointment_id        TEXT REFERENCES appointment(id),
  supporting_mandate_assignment_id TEXT REFERENCES mandate_assignment(id),
  supporting_jurisdiction_id       TEXT REFERENCES jurisdiction_assignment(id),
  effective_scope                  JSONB,
  reason_code                      TEXT,
  decided_at                       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX authz_decision_resource_idx ON authorization_decision (resource_type, resource_id);

-- Deliberate, loudly-logged, read-only emergency access. Expiry hard-capped
-- at 2h by generated column; relation allowlisted to viewer relations so
-- granting closure/signing authority is structurally impossible.
CREATE TABLE break_glass_grant (
  id                       TEXT PRIMARY KEY,
  tenant_id                TEXT REFERENCES tenant(id),
  granted_by_principal_id  TEXT NOT NULL REFERENCES principal(id),
  granted_to_principal_id  TEXT NOT NULL REFERENCES principal(id),
  relation                 TEXT NOT NULL,
  object_type              TEXT NOT NULL,
  object_id                TEXT NOT NULL,
  reason                   TEXT NOT NULL,
  granted_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at               TIMESTAMPTZ NOT NULL,
  CHECK (relation IN ('viewer', 'internal_viewer', 'published_viewer'))
);
CREATE INDEX break_glass_expiry_idx ON break_glass_grant (expires_at);

-- Expiry is fixed at exactly granted_at + 2h, enforced at insert — the
-- caller cannot choose it (timestamptz arithmetic is not immutable, so this
-- is a trigger rather than a generated column).
CREATE OR REPLACE FUNCTION break_glass_fix_expiry() RETURNS trigger AS $$
BEGIN
  NEW.expires_at := NEW.granted_at + interval '2 hours';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER break_glass_expiry BEFORE INSERT ON break_glass_grant
  FOR EACH ROW EXECUTE FUNCTION break_glass_fix_expiry();

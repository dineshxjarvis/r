# Strata — Data Model

> **Foundation correction in progress:** The identity, tenancy, organisation, appointment, regulator, jurisdiction, session, and authorization definitions in §1 are superseded by [`identity-authority-model.md`](identity-authority-model.md) and [`foundation-data-model.md`](foundation-data-model.md). The SQL in this file is a legacy design exploration and is **not an executable migration contract**. Domains §2–§6 must be remapped to the corrected foundation before implementation. In particular, do not implement `person_type`, generic `INSPECTOR`, `region.authority TEXT`, one-operator-per-deployment assumptions, `app.operator_id`, unconditional contractor membership tuples, or unique `(role_key, scope)` posts.

> Implementation schema and migrations belong in the database package once the corrected domain mapping is approved. This document will remain descriptive; executable migrations and generated schema documentation will become canonical for physical DDL.

> **Audit replacement:** The generic trigger/hash-chain material in §6 is also non-executable legacy exploration. The canonical logical audit, access, checkpoint, reconstruction and release-evidence model is [`audit-history-data-model.md`](audit-history-data-model.md); production persistence uses explicit domain transaction code as required by [`../features/platform/production-hardening-spec.md`](../features/platform/production-hardening-spec.md).

Concrete relational schema translating the feature specs' entities into Postgres tables. This doc does not redefine domain rules — every state/vocabulary here cites the feature spec that owns it. If a spec and this doc disagree, the spec wins; fix this doc in the same change.

Built domain-by-domain in the dependency order set by `docs/presentation/feasibility-and-roadmap.md §3`. This file currently covers **Domain 1: Identity, Mine Hierarchy & Appointments**. Later domains append new `##` sections below, in the same order as `docs/api-specs/`.

## 0. Conventions (apply to every table in every domain)

- **IDs**: `TEXT PRIMARY KEY`, format `<prefix>_<ULID>` (26-char Crockford-base32, time-sortable), generated application-side at insert. Prefix = table name abbreviation (`op_`, `mine_`, `person_`, `appt_`, ...).
- **Timestamps**: `created_at TIMESTAMPTZ NOT NULL DEFAULT now()`, `updated_at TIMESTAMPTZ NOT NULL DEFAULT now()` maintained by one shared trigger (`set_updated_at()`). All business timestamps are `TIMESTAMPTZ` (RFC 3339 / UTC on the wire).
- **No hard deletes** on domain entities — lifecycle/status columns instead, per the architecture principle that original state stays traceable. `DELETE` is reserved for genuinely wrong data entered in error before anything referenced it.
- **Enums**: native Postgres `ENUM` types named after the spec vocabulary (e.g. `appointment_instrument_type`), not free-text `CHECK`s — these vocabularies are each a feature spec's single source of truth and shouldn't drift silently.
- **Tenant column**: every operator-scoped table carries `operator_id` directly (denormalized from its parent chain, set once at insert, immutable — a mine never changes operator). This is what makes row-level-security policies a flat `operator_id = current_setting('app.operator_id')` check instead of a recursive join, matching `architecture-and-flows.md §13`'s "tenant row-level security as second barrier." Tables that are *not* operator-scoped (platform-global posts, regulator `region`) omit it or allow it `NULL`, noted per-table.
- **PostGIS**: `mine`/`subunit`/`asset` carry `geography(Point,4326)` / `geography(Polygon,4326)` columns for the GIS domain (BF-13) to consume later — populated `NULL` until surveyed, not required at onboarding.

```sql
CREATE EXTENSION IF NOT EXISTS postgis;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 0.5 Storage Architecture (cross-cutting — read before any domain below)

Translates `technical-design.md §5`'s canonical storage model (PG / OBJ / REL / SEARCH / CACHE) into concrete tech. Six stores, each owns exactly one kind of truth — no store is ever the only place *and* an unreliable place for the same fact.

| Store | Owns | Consistency | Rebuildable from canonical state? |
|---|---|---|---|
| **PostgreSQL** (relational) | Domain/business state — every table in this doc | ACID; every write lands with its audit event + outbox row in one transaction | No — this **is** canonical |
| **PostGIS** (extension, same instance) | Spatial columns/queries | Same transaction as the row it's a column of | No — same table, not a separate store |
| **pgvector** (extension, same instance) | Embedding similarity | Own tables, same instance | Yes — always re-embeddable from source text/entity; never the sole record of anything |
| **S3-compatible object storage** | Immutable original bytes (documents, evidence media) | Two-phase: verify before the Postgres row is allowed to exist | No — content-addressed originals are canonical for bytes |
| **Redis** | Dashboard/read-model cache, rate limits, sessions | Eventually consistent, fed by outbox | Yes — always |
| **OpenFGA** | Authorization relationship tuples | Written via the same outbox pattern, sourced from `appointment`/`contractor_engagement` | No directly, but effectively yes — Postgres's appointment/engagement rows are the real source of truth; OpenFGA tuples are a derived index over them, same as Redis is for dashboards |

### PostGIS

Same Postgres instance, not a separate store — spatial writes are in the same transaction as the domain row. Two types used throughout: `geography(Point,4326)` for point locations (enables accuracy-aware proximity queries via `ST_DWithin`), `geography(Polygon,4326)` for lease boundaries and geofences. Every geography column gets a `GIST` index:

```sql
CREATE INDEX mine_location_gix ON mine USING GIST (location);
CREATE INDEX mine_boundary_gix ON mine USING GIST (boundary);
CREATE INDEX subunit_location_gix ON subunit USING GIST (location);
CREATE INDEX asset_location_gix ON asset USING GIST (location);
```

Used now (Domain 1): mine/subunit/asset location + lease boundary. Used in Domain 4 (field evidence): capture-point-vs-geofence `ST_DWithin` distance check that drives the `DISTANCE_MISMATCH` verdict (`field-capture-spec.md §3.2`) — the exact flagship "closure blocked" demo moment. Used later (BF-13, GIS domain, deferred): 3D/volumetric layers build on the same columns.

### pgvector

Same instance, `vector(N)` columns live in dedicated `<entity>_embedding` tables — **never** a column bolted onto the entity table itself, so the embedding model/version can change without migrating (or ever touching) the entity table:

```sql
CREATE EXTENSION IF NOT EXISTS vector;

-- pattern shown here; concrete embedding tables are created alongside their
-- source table in each domain (document_segment_embedding lands in §2, once
-- document_segment exists to reference)
CREATE TABLE example_entity_embedding (
  id            TEXT PRIMARY KEY,
  entity_id     TEXT NOT NULL, -- FK -> the entity table this embeds
  model_version TEXT NOT NULL,
  embedding     vector(1536),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX example_entity_embedding_hnsw ON example_entity_embedding
  USING hnsw (embedding vector_cosine_ops);
```

Three concrete uses, each tied to a spec that already calls for the capability without naming the mechanism:
- **Extraction grounding & clause search** (Domain 2, `extraction-spec.md`'s `ground()` check and `pipeline-spec.md`'s clause segments) — semantic retrieval over document segments.
- **Cross-mine/duplicate obligation detection** (Domain 2/3, `register-extensions-spec.md §4.1` cross-mine diffing, statutory conflict detection) — similarity narrows candidates; the actual conflict/duplicate verdict stays a human or rule decision, embeddings never decide alone.
- **Defect entity resolution candidate generation** (Domain 3, `defect-spec.md` "many observations → one defect") — embeddings surface *candidate* matches for a new observation against open defects; **never auto-merge** — the spec is explicit a human always confirms, embeddings only narrow what the human sees.

`hnsw` index from the start (not `ivfflat`) — index build cost is irrelevant at prototype row counts and this avoids a reindex migration later. Production scale-out to a dedicated vector store, if row counts ever justify it, swaps the query implementation behind the same interface — not a prototype concern.

### S3-compatible object storage

Immutable original bytes only — **never** business metadata, which stays in Postgres as a pointer (`content_hash`, `storage_bucket`, `storage_key`, `byte_size`, `content_type`). Content-addressed: object key is `sha256:<hash>` of the bytes, so identical content dedupes automatically and any tamper is a hash mismatch, not a trust decision — this is the concrete mechanism behind `identity-governance-spec.md`'s hash-chaining and `pipeline-spec.md`'s "original bytes never change" principle.

Two buckets (adapted from the public/private split you used in klyz):
- **`strata-originals`** — private, immutable, one object per uploaded document / captured evidence file. Access only via short-TTL presigned GET, gated by the same ReBAC check as the owning `document`/`evidence` row (never a public URL). Nothing here is ever regenerated or overwritten — a correction is a new version + `superseded_by`, not an edit.
- **`strata-derived`** — private, regenerable: OCR text layers, thumbnails, rendered PDF pages, generated manifests. Safe to delete and recompute from `strata-originals`; never authoritative, never referenced by anything that needs tamper-evidence.

No public bucket in the prototype — a public transparency view is explicitly deferred (Tier 2), so there's no third bucket until that's actually being built.

**Two-phase write, in order — never skip the middle step:**
1. Client requests a presigned `PUT` — permission-checked first, against the same `UPLOAD_PERMISSION`/`can_capture` rules already defined in `pipeline-spec.md §3.1` / `field-capture-spec.md §9`.
2. Client uploads directly to S3.
3. Server confirms via `HEAD` + hash verification against the client-claimed hash.
4. **Only after (3) succeeds** does the server insert/publish the Postgres row pointing at that object.

This ordering is load-bearing: a Postgres row must never exist pointing at bytes that didn't verify, and the bytes aren't "the record" until Postgres says so. Matches the append-only-audit principle (`technical-design.md §6`) that every material transaction writes domain change + audit + outbox atomically — the object write happens *before* that transaction, never inside or after it.

### Redis

Read-model cache only — dashboard metric projections (Domain 5), rate-limit counters, session state. Every cached value must be rebuildable from Postgres canonical state plus outbox replay; if a value can't be rebuilt that way, it doesn't belong in Redis. Detailed further when Domain 5 (dashboards) is designed — noted here only to complete the storage map.

### OpenFGA

Already established in `authorization-spec.md` and Domain 1 above — repeated here only for the map: stores *only* authorization tuples, never business objects (`technical-design.md §5`). Postgres is the real source of truth for *who holds what*; OpenFGA is a derived, query-optimized index over that fact, conceptually the same role Redis plays for dashboards. The Postgres-row → OpenFGA-tuple mapping is not always 1:1 — five cases worth naming, so the outbox worker's logic doesn't have to be reverse-engineered from the DSL later:

| Postgres row | OpenFGA tuple(s) written | Conditioned? |
|---|---|---|
| `appointment` created | one tuple, `person → role_key → post's scope object` | Yes — `valid_appointment(valid_from, valid_until)` |
| `contractor_membership` created | one tuple, `contractor_org → member → person` | **No** — unconditioned even though the Postgres row has `valid_from`/`valid_until` (§1.2) |
| `contractor_engagement` created | **two** tuples — `mine → engaged_contractor → contractor_org` and `mine → historic_contractor → contractor_org` | First: yes (`active_engagement`). Second: **no**, written once, never removed (§1.2) |
| `region_mine_coverage` created/deleted | one tuple, `region → covers → mine` | No |
| `break_glass_grant` created | one tuple, `person → relation → object` | Yes — same `valid_appointment` condition shape, `valid_from=granted_at`, `valid_until=expires_at` |

`obligation_instance`'s `is_draft` marker (`authorization-spec.md §3`) is the one OpenFGA-only concept with no Postgres column at all — see `data-model.md §2.6` for why it turns out to be inert in this project's actual flow.

---

## 1. Legacy Identity, Mine Hierarchy & Appointments — superseded

Do not build this section. It is retained temporarily only to trace dependent Domain 2–6 fields during migration. Its replacement concepts and invariants are in [`identity-authority-model.md`](identity-authority-model.md). Any endpoint or feature linking to this section must be migrated before implementation.

Implements: `identity-governance-spec.md` (appointments, signatures), `authorization-spec.md` (roles, ReBAC type model), `architecture-and-flows.md §13` (tenant hierarchy), `extraction-spec.md §7` (applicability dimensions — surfaced here as mine columns).

### 1.1 Entities

| Table | Purpose | Key fields |
|---|---|---|
| `operator` | Tenant root (a coal operator, e.g. SECL) | `id`, `name`, `registration_ref`, `status` |
| `subsidiary` | Operator subdivision | `id`, `operator_id`→operator, `name`, `code` |
| `area` | Subsidiary subdivision | `id`, `subsidiary_id`→subsidiary, `operator_id`, `name`, `code` |
| `mine` | The compliance unit; carries applicability dimensions | `id`, `area_id`→area, `operator_id`, `name`, `code`, `mine_type`, `gassiness_class`, `production_scale_tpa`, `headcount`, `lease_ref`, `location`, `boundary`, `status` |
| `subunit` | Bench / panel / district within a mine | `id`, `mine_id`→mine, `operator_id`, `name`, `code`, `subunit_type`, `location` |
| `asset` | Equipment, sensor, structure | `id`, `mine_id`→mine, `subunit_id`→subunit (nullable), `operator_id`, `name`, `asset_type`, `location` |
| `region` | Regulator jurisdiction (DGMS zone) — **not** operator-scoped | `id`, `name`, `code`, `authority` |
| `region_mine_coverage` | Which mines a region actually covers (inspector jurisdiction) | `id`, `region_id`→region, `mine_id`→mine |
| `person` | Any identifiable human — employee, contractor worker, regulator | `id`, `full_name`, `person_type`, `employee_ref`, `contact_email`, `contact_phone`, `account_status` |
| `user_account` | Login account, 0..1 per person | `id`, `person_id`→person (unique), `status`, `last_login_at` |
| `auth_credential` | One row per credential a user has (password, DSC, passkey, ...) | `id`, `user_account_id`→user_account, `credential_type`, `credential_ref`, `issued_at`, `expires_at`, `revoked_at` |
| `contractor_org` | A contracting company — not operator-scoped, engages with many operators | `id`, `name`, `registration_ref`, `status` |
| `contractor_membership` | Which persons belong to which contractor org, over time | `id`, `person_id`→person, `contractor_org_id`→contractor_org, `valid_from`, `valid_until` |
| `contractor_engagement` | A contractor org actively engaged at a mine | `id`, `contractor_org_id`→contractor_org, `mine_id`→mine, `operator_id`, `engaged_from`, `engaged_until`, `contract_doc_id`, `revoked_at`, `revoked_by`, `revoke_reason` |
| `post` | A role position at one scope (Manager of Gevra OCP, Area GM of Korba, ...) | `id`, `role_key`, `scope_level`, `title`, one of `mine_id`/`area_id`/`subsidiary_id`/`operator_id`/`region_id` |
| `appointment` | Person holds a post for a bounded window | `id`, `person_id`→person, `post_id`→post, `operator_id`, `valid_from`, `valid_until`, `instrument_type`, `instrument_doc_id`, `appointed_by`, `superseded_by`, `revoked_at`, `revoked_by`, `revoke_reason` |
| `role_escalation_chain` | Where responsibility goes when a post is vacant — default + per-operator override | `id`, `operator_id` (nullable = default), `role_key`, `scope_level`, `next_role_key`, `next_scope_level` |
| `break_glass_grant` | Deliberate, loudly-logged emergency access, hard-capped at 2h | `id`, `granted_by`, `granted_to`, `relation`, `object_type`/`object_id`, `reason`, `granted_at`, `expires_at` (generated, always `granted_at + 2h`) |

**Why `person` carries no `operator_id`**: identity itself isn't tenant-owned — a DGMS inspector or a contractor worker who later moves to a different operator's mine is still the same person. Tenant scoping lives on the *relationship* (`appointment`, `contractor_membership`, `contractor_engagement`), not the identity.

**Why `auth_credential` is its own table, not columns on `user_account`**: a person can legitimately hold more than one live credential at once (password + DSC + passkey per `identity-governance-spec.md §3`). Folding these into `user_account` would mean either repeating columns per credential type or losing the ability to have several — a repeating-group violation of 3NF. One row per credential avoids both.

**Why `post` uses five nullable scope FKs instead of one polymorphic `(scope_type, scope_id)` pair**: a generic polymorphic reference can't be enforced by a real foreign key in Postgres — you lose referential integrity exactly where it matters most (a post pointing at a deleted mine). Five nullable FKs with a `CHECK` keeps every reference real and lets each parent table's own FK constraints do their job.

### 1.2 DDL

```sql
CREATE TYPE org_status AS ENUM ('ACTIVE', 'SUSPENDED');
CREATE TYPE mine_status AS ENUM ('ACTIVE', 'SUSPENDED', 'CLOSED');
CREATE TYPE mine_type AS ENUM ('OPENCAST', 'UNDERGROUND', 'MIXED');
CREATE TYPE gassiness_class AS ENUM ('DEGREE_I', 'DEGREE_II', 'DEGREE_III', 'NOT_APPLICABLE');
CREATE TYPE subunit_type AS ENUM ('BENCH', 'PANEL', 'DISTRICT', 'DUMP', 'OTHER');
CREATE TYPE person_type AS ENUM ('EMPLOYEE', 'CONTRACTOR_WORKER', 'REGULATOR', 'EXTERNAL');
CREATE TYPE account_status AS ENUM ('ACTIVE', 'SUSPENDED', 'DEPARTED');
CREATE TYPE credential_type AS ENUM ('PASSWORD_HASH', 'GOOGLE_OAUTH', 'DSC_CLASS3', 'AADHAAR_ESIGN', 'FIDO2_PASSKEY');
CREATE TYPE contractor_org_status AS ENUM ('ACTIVE', 'BLACKLISTED', 'INACTIVE');
CREATE TYPE role_key AS ENUM (
  'MANAGER', 'SAFETY_OFFICER', 'ENV_OFFICER', 'AREA_GM', 'ISO_OFFICER',
  'CORPORATE_SAFETY', 'DIRECTOR_TECHNICAL', 'PLATFORM_ADMIN', 'INSPECTOR'
);
CREATE TYPE scope_level AS ENUM ('MINE', 'AREA', 'SUBSIDIARY', 'OPERATOR', 'REGION', 'GLOBAL');
CREATE TYPE instrument_type AS ENUM ('FORM_2D', 'POSTING_ORDER', 'DGMS_ALLOCATION', 'CONTRACT', 'INTERNAL');

-- 1. operator (tenant root)
CREATE TABLE operator (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  registration_ref  TEXT,
  status            org_status NOT NULL DEFAULT 'ACTIVE',
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. subsidiary
CREATE TABLE subsidiary (
  id            TEXT PRIMARY KEY,
  operator_id   TEXT NOT NULL REFERENCES operator(id),
  name          TEXT NOT NULL,
  code          TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operator_id, code)
);

-- 3. area
CREATE TABLE area (
  id              TEXT PRIMARY KEY,
  subsidiary_id   TEXT NOT NULL REFERENCES subsidiary(id),
  operator_id     TEXT NOT NULL REFERENCES operator(id), -- denormalized
  name            TEXT NOT NULL,
  code            TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (subsidiary_id, code)
);

-- 4. mine — also the applicability-dimension surface (extraction-spec.md §7)
CREATE TABLE mine (
  id                    TEXT PRIMARY KEY,
  area_id               TEXT NOT NULL REFERENCES area(id),
  operator_id           TEXT NOT NULL REFERENCES operator(id), -- denormalized
  name                  TEXT NOT NULL,
  code                  TEXT NOT NULL,
  mine_type             mine_type NOT NULL,
  gassiness_class       gassiness_class NOT NULL DEFAULT 'NOT_APPLICABLE',
  production_scale_tpa  NUMERIC,
  headcount             INTEGER,
  lease_ref             TEXT,
  location              geography(Point, 4326),
  boundary              geography(Polygon, 4326),
  status                mine_status NOT NULL DEFAULT 'ACTIVE',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (area_id, code)
);

-- 5. subunit
CREATE TABLE subunit (
  id            TEXT PRIMARY KEY,
  mine_id       TEXT NOT NULL REFERENCES mine(id),
  operator_id   TEXT NOT NULL REFERENCES operator(id), -- denormalized
  name          TEXT NOT NULL,
  code          TEXT NOT NULL,
  subunit_type  subunit_type NOT NULL,
  location      geography(Point, 4326),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (mine_id, code)
);

-- 6. asset
CREATE TABLE asset (
  id            TEXT PRIMARY KEY,
  mine_id       TEXT NOT NULL REFERENCES mine(id),
  subunit_id    TEXT REFERENCES subunit(id),
  operator_id   TEXT NOT NULL REFERENCES operator(id), -- denormalized
  name          TEXT NOT NULL,
  asset_type    TEXT NOT NULL,
  location      geography(Point, 4326),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. region — regulator jurisdiction, deliberately not operator-scoped
CREATE TABLE region (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT NOT NULL UNIQUE,
  authority   TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7b. region_mine_coverage — which mines an inspector's region actually covers
-- (authorization-spec.md §1.3/§3: `region.covers: [mine]`). Missing from the first pass of this
-- domain — DGMS jurisdiction was unrepresentable without it. Unconditioned in ReBAC (no time-bound
-- clause on `covers`), so plain current-state membership; redistricting is DELETE + INSERT (same
-- pattern the spec itself uses for area reparenting, §11), not a versioned history table.
CREATE TABLE region_mine_coverage (
  id         TEXT PRIMARY KEY,
  region_id  TEXT NOT NULL REFERENCES region(id),
  mine_id    TEXT NOT NULL REFERENCES mine(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (region_id, mine_id)
);

-- 8. person — identity, not tenant-scoped
CREATE TABLE person (
  id              TEXT PRIMARY KEY,
  full_name       TEXT NOT NULL,
  person_type     person_type NOT NULL,
  employee_ref    TEXT,
  contact_email   TEXT,
  contact_phone   TEXT,
  account_status  account_status NOT NULL DEFAULT 'ACTIVE',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. user_account — 0..1 per person
CREATE TABLE user_account (
  id              TEXT PRIMARY KEY,
  person_id       TEXT NOT NULL UNIQUE REFERENCES person(id),
  status          org_status NOT NULL DEFAULT 'ACTIVE',
  last_login_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. auth_credential — many per user_account
CREATE TABLE auth_credential (
  id                TEXT PRIMARY KEY,
  user_account_id   TEXT NOT NULL REFERENCES user_account(id),
  credential_type   credential_type NOT NULL,
  credential_ref    TEXT NOT NULL, -- hash, external subject id, or key reference
  issued_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at        TIMESTAMPTZ,
  revoked_at        TIMESTAMPTZ
);

-- 11. contractor_org — not operator-scoped
CREATE TABLE contractor_org (
  id                TEXT PRIMARY KEY,
  name              TEXT NOT NULL,
  registration_ref  TEXT,
  status            contractor_org_status NOT NULL DEFAULT 'ACTIVE',
  succeeds_id       TEXT REFERENCES contractor_org(id), -- set when this org is a post-merger/rename
                                                          -- successor, so safety history isn't
                                                          -- laundered by a rename (authorization-spec.md §11)
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. contractor_membership — person's org affiliation over time
-- NOTE: authorization-spec.md's `contractor_org.member` relation is UNCONDITIONED ([user], no
-- valid_appointment-style clause) — unlike appointment, membership doesn't expire in ReBAC terms.
-- valid_from/valid_until below are kept for Postgres-side reporting only; the outbox writes the
-- OpenFGA `member` tuple without a condition attached, regardless of these dates.
CREATE TABLE contractor_membership (
  id                  TEXT PRIMARY KEY,
  person_id           TEXT NOT NULL REFERENCES person(id),
  contractor_org_id   TEXT NOT NULL REFERENCES contractor_org(id),
  valid_from          TIMESTAMPTZ NOT NULL,
  valid_until         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until IS NULL OR valid_until > valid_from)
);

-- 13. contractor_engagement — org active at a mine (ReBAC active_engagement source)
-- NOTE: this one Postgres row drives TWO OpenFGA tuples, per authorization-spec.md §9.1's resolved
-- decision ("yes for read, no for write" after an engagement ends):
--   mine:X engaged_contractor  contractor_org:Y   WITH condition active_engagement(engaged_from, engaged_until)
--   mine:X historic_contractor contractor_org:Y   UNCONDITIONED, written once at creation, never removed
-- `engaged_contractor` gates capture/upload (write); `historic_contractor` gates read of past findings,
-- so a contractor's safety record stays visible after the engagement that produced it ends.
CREATE TABLE contractor_engagement (
  id                  TEXT PRIMARY KEY,
  contractor_org_id   TEXT NOT NULL REFERENCES contractor_org(id),
  mine_id             TEXT NOT NULL REFERENCES mine(id),
  operator_id         TEXT NOT NULL REFERENCES operator(id), -- denormalized from mine
  engaged_from        TIMESTAMPTZ NOT NULL,
  engaged_until       TIMESTAMPTZ NOT NULL,
  contract_doc_id     TEXT REFERENCES document(id),
  revoked_at          TIMESTAMPTZ,
  revoked_by          TEXT REFERENCES person(id),
  revoke_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (engaged_until > engaged_from)
);

-- 14. post — role position at exactly one scope
CREATE TABLE post (
  id              TEXT PRIMARY KEY,
  role_key        role_key NOT NULL,
  scope_level     scope_level NOT NULL,
  title           TEXT NOT NULL,
  mine_id         TEXT REFERENCES mine(id),
  area_id         TEXT REFERENCES area(id),
  subsidiary_id   TEXT REFERENCES subsidiary(id),
  operator_id     TEXT REFERENCES operator(id),
  region_id       TEXT REFERENCES region(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (scope_level = 'MINE'       AND mine_id IS NOT NULL       AND area_id IS NULL AND subsidiary_id IS NULL AND operator_id IS NULL AND region_id IS NULL) OR
    (scope_level = 'AREA'       AND area_id IS NOT NULL       AND mine_id IS NULL AND subsidiary_id IS NULL AND operator_id IS NULL AND region_id IS NULL) OR
    (scope_level = 'SUBSIDIARY' AND subsidiary_id IS NOT NULL AND mine_id IS NULL AND area_id IS NULL       AND operator_id IS NULL AND region_id IS NULL) OR
    (scope_level = 'OPERATOR'   AND operator_id IS NOT NULL   AND mine_id IS NULL AND area_id IS NULL       AND subsidiary_id IS NULL AND region_id IS NULL) OR
    (scope_level = 'REGION'     AND region_id IS NOT NULL     AND mine_id IS NULL AND area_id IS NULL       AND subsidiary_id IS NULL AND operator_id IS NULL) OR
    (scope_level = 'GLOBAL'     AND mine_id IS NULL AND area_id IS NULL AND subsidiary_id IS NULL AND operator_id IS NULL AND region_id IS NULL)
  )
);
-- one post per (role, scope instance) — five partial unique indexes, one per scope column
CREATE UNIQUE INDEX post_unique_mine ON post (role_key, mine_id) WHERE mine_id IS NOT NULL;
CREATE UNIQUE INDEX post_unique_area ON post (role_key, area_id) WHERE area_id IS NOT NULL;
CREATE UNIQUE INDEX post_unique_subsidiary ON post (role_key, subsidiary_id) WHERE subsidiary_id IS NOT NULL;
CREATE UNIQUE INDEX post_unique_operator ON post (role_key, operator_id) WHERE operator_id IS NOT NULL;
CREATE UNIQUE INDEX post_unique_region ON post (role_key, region_id) WHERE region_id IS NOT NULL;

-- 15. appointment — person holds post for a bounded window
CREATE TABLE appointment (
  id                  TEXT PRIMARY KEY,
  person_id           TEXT NOT NULL REFERENCES person(id),
  post_id             TEXT NOT NULL REFERENCES post(id),
  operator_id         TEXT REFERENCES operator(id), -- NULL only for GLOBAL-scope posts
  valid_from          TIMESTAMPTZ NOT NULL,
  valid_until         TIMESTAMPTZ NOT NULL,
  instrument_type     instrument_type NOT NULL,
  instrument_doc_id   TEXT REFERENCES document(id),
  appointed_by        TEXT REFERENCES person(id),
  superseded_by       TEXT REFERENCES appointment(id),
  revoked_at          TIMESTAMPTZ,
  revoked_by          TEXT REFERENCES person(id),
  revoke_reason       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until > valid_from)
);
-- "Two conflicting statutory appointments at one mine — Postgres constraint rejects. The graph
-- will not stop you writing contradictory tuples, so the constraint must live in the database"
-- (identity-governance-spec.md §2.4/§9, test 9) — belt-and-braces alongside the app-layer 422
-- check in appointments.md, not a substitute for it. Requires btree_gist, declared below —
-- same near-first-use placement as the pgvector extension in §0.5, not centralized in §0.
-- Excludes revoked/superseded rows: those no longer claim the post, only a live holder can conflict.
CREATE EXTENSION IF NOT EXISTS btree_gist;
ALTER TABLE appointment ADD CONSTRAINT no_overlapping_appointments_per_post
  EXCLUDE USING gist (
    post_id WITH =,
    tstzrange(valid_from, valid_until) WITH &&
  ) WHERE (revoked_at IS NULL AND superseded_by IS NULL);
CREATE INDEX appointment_person_idx ON appointment (person_id);
CREATE INDEX appointment_post_active_idx ON appointment (post_id, valid_until) WHERE revoked_at IS NULL;

-- spatial indexes (see §0.5 Storage Architecture)
CREATE INDEX mine_location_gix ON mine USING GIST (location);
CREATE INDEX mine_boundary_gix ON mine USING GIST (boundary);
CREATE INDEX subunit_location_gix ON subunit USING GIST (location);
CREATE INDEX asset_location_gix ON asset USING GIST (location);

-- 16. role_escalation_chain — hybrid default + per-operator override
CREATE TABLE role_escalation_chain (
  id                TEXT PRIMARY KEY,
  operator_id       TEXT REFERENCES operator(id), -- NULL = system default
  role_key          role_key NOT NULL,
  scope_level       scope_level NOT NULL,
  next_role_key     role_key NOT NULL,
  next_scope_level  scope_level NOT NULL
);
CREATE UNIQUE INDEX escalation_default_unique ON role_escalation_chain (role_key, scope_level) WHERE operator_id IS NULL;
CREATE UNIQUE INDEX escalation_override_unique ON role_escalation_chain (operator_id, role_key, scope_level) WHERE operator_id IS NOT NULL;

-- 17. break_glass_grant — deliberate, loudly-logged emergency access (authorization-spec.md §11).
-- Never a permanent bypass: expiry is fixed at exactly 2h, enforced at insert, not left to the caller.
CREATE TABLE break_glass_grant (
  id           TEXT PRIMARY KEY,
  operator_id  TEXT REFERENCES operator(id),
  granted_by   TEXT NOT NULL REFERENCES person(id), -- must hold platform_admin, checked at the API layer
  granted_to   TEXT NOT NULL REFERENCES person(id),
  relation     TEXT NOT NULL, -- e.g. 'internal_viewer' — read-only, see CHECK below
  object_type  TEXT NOT NULL,
  object_id    TEXT NOT NULL,
  reason       TEXT NOT NULL,
  granted_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ GENERATED ALWAYS AS (granted_at + interval '2 hours') STORED,
  -- "Break-glass never grants closure authority... exactly the abuse this system exists to make
  -- impossible" (identity-governance-spec.md §7.3, test 23) — this was previously an unconstrained
  -- TEXT column whose own example was 'manager', which cascades into close_significant/can_sign.
  -- Allowlist read-only relations only, so granting closure/signing authority is structurally
  -- impossible to insert, not merely a policy someone has to remember to check.
  CHECK (relation IN ('internal_viewer', 'viewer', 'published_viewer'))
);
-- Legacy correction: PostgreSQL partial-index predicates cannot depend on now().
-- Use a normal index; the query supplies `expires_at > statement_timestamp()`.
CREATE INDEX break_glass_expiry_idx ON break_glass_grant (expires_at);

-- updated_at triggers (repeat per table — omitted here for brevity, same function for all)
```

Row-level security (applied once `app.operator_id` is set per request session):

```sql
ALTER TABLE mine ENABLE ROW LEVEL SECURITY;
CREATE POLICY mine_tenant_isolation ON mine
  USING (operator_id = current_setting('app.operator_id', true));
-- same pattern repeats on every operator_id-bearing table in every domain
```

### 1.3 Appointment status (derived, never stored)

`identity-governance-spec.md` requires `status` to be "derived, not human-editable past `valid_until`" — since lapsing depends on wall-clock time, it can't be a stored/generated column (`now()` isn't immutable). Exposed as a view; the same logic is what gets passed to OpenFGA as the condition context on every `Check()`.

```sql
CREATE VIEW appointment_status AS
SELECT *,
  CASE
    WHEN revoked_at IS NOT NULL THEN 'REVOKED'
    WHEN superseded_by IS NOT NULL THEN 'SUPERSEDED'
    WHEN valid_until < now() THEN 'LAPSED'
    WHEN valid_from > now() THEN 'PENDING'
    ELSE 'ACTIVE'
  END AS status
FROM appointment;
```

| From | Event | To |
|---|---|---|
| — | `appointment` row inserted, `valid_from` in future | `PENDING` |
| `PENDING` | `valid_from` reached | `ACTIVE` |
| `ACTIVE` | `valid_until` reached | `LAPSED` |
| `ACTIVE`/`PENDING` | `revoked_at` set | `REVOKED` (terminal) |
| `ACTIVE`/`PENDING` | new appointment supersedes this one, `superseded_by` set | `SUPERSEDED` (terminal) |

**Enforcement decision**: appointment expiry is enforced via **OpenFGA time-bound conditions**, not a nightly revocation job. `valid_from`/`valid_until` are passed as condition context on the OpenFGA tuple written at appointment creation (no tuple deletion needed at expiry — the condition evaluator checks current time on every `Check()`). A nightly job would leave a same-day gap between an appointment lapsing and access actually being revoked — unacceptable given the flagship demo moment is exactly "permission denied the instant an appointment expires" (`architecture-and-flows.md §12`).

`contractor_engagement` status derives the same way (`ACTIVE`/`LAPSED`/`REVOKED`, no `SUPERSEDED` — engagements don't supersede each other), same view pattern, omitted for brevity.

### 1.4 Escalation resolution

When a post has no `ACTIVE` appointment, responsibility (for both notification delivery per `workflow-spec.md`'s `resolve(post)` and obligation ownership per Domain 3) walks `role_escalation_chain` up the hierarchy rather than stalling:

```
resolve_responsible(role_key, scope_level, scope_id):
  post = find post WHERE role_key, scope_level, scope_id
  holder = appointment_status WHERE post_id = post.id AND status = 'ACTIVE'
  if holder exists: return holder.person_id

  chain = role_escalation_chain WHERE operator_id = :op AND role_key, scope_level     -- override first
       OR role_escalation_chain WHERE operator_id IS NULL AND role_key, scope_level   -- else default
  if chain not found:
    raise UNMANNED_POST_FINDING at (role_key, scope_level, scope_id)  -- chain exhausted, terminal

  next_scope_id = walk scope hierarchy from scope_id up to chain.next_scope_level
  return resolve_responsible(chain.next_role_key, chain.next_scope_level, next_scope_id)
```

Seed defaults for `role_escalation_chain` (system-wide, `operator_id NULL`) — proposed, flag if your real org chart differs:

| Vacant | Escalates to |
|---|---|
| `MANAGER`@MINE | `AREA_GM`@AREA |
| `SAFETY_OFFICER`@MINE | `AREA_GM`@AREA |
| `ENV_OFFICER`@MINE | `AREA_GM`@AREA |
| `AREA_GM`@AREA | `CORPORATE_SAFETY`@SUBSIDIARY |
| `ISO_OFFICER`@AREA | `CORPORATE_SAFETY`@SUBSIDIARY |
| `CORPORATE_SAFETY`@SUBSIDIARY | `DIRECTOR_TECHNICAL`@SUBSIDIARY |
| `DIRECTOR_TECHNICAL`@SUBSIDIARY | `PLATFORM_ADMIN`@GLOBAL |

`PLATFORM_ADMIN`@GLOBAL has no further escalation — chain always terminates there, guaranteeing `resolve_responsible` never loops forever. An operator can override any single hop via a `role_escalation_chain` row with its own `operator_id` set; unoverridden hops keep falling through to the default.

### 1.5 Config surface (BF-2 — "onboard a mine = configuration, not development")

No schema change is needed per mine. Onboarding a new mine is exactly:

1. Insert one `mine` row — `mine_type`, `gassiness_class`, `production_scale_tpa`, `headcount` are the same dimensions `extraction-spec.md §7`'s applicability engine already checks obligations against (`MINE_TYPE`/`THRESHOLD`/`GASSINESS`/`NAMED_MINES`), so filling these in is what makes the right obligation set apply automatically — no per-mine code path.
2. Insert `subunit`/`asset` rows for its physical layout.
3. Insert `post` rows for its fixed statutory role set (`MANAGER`, `SAFETY_OFFICER`, `ENV_OFFICER` at minimum — always exactly these three at `MINE` scope, enforced by the partial unique indexes above).
4. Insert `appointment` rows for whoever currently holds each post.

A config UI is a thin form over steps 1–4; nothing here requires a migration or new table per mine.

### 1.6 Migration ordering note

`appointment.instrument_doc_id` and `contractor_engagement.contract_doc_id` reference `document(id)` (§2), which is defined *after* this section in the doc's presentation order but must exist *before* these two FK constraints are applied in an actual migration. Concretely: run the Domain 1 migration without those two FK constraints (or with the columns as plain `TEXT`), then the Domain 2 migration creating `document`, then a small follow-up migration that adds the two `FOREIGN KEY` constraints. Presentation order here follows the flow-discussion sequence (identity → documents → ...); migration order follows dependency order, which isn't always the same thing whenever two domains reference each other.

---

## 2. Document Pipeline, Extraction & Obligation Register

Implements: `pipeline-spec.md` (9-stage document lifecycle), `extraction-spec.md` (6 extractors + Addenda A1–A6), `obligation-register-spec.md` (obligation definitions, materialisation, reconciliation), `register-extensions-spec.md` (applicability, negative evidence, diffing, conflict detection, change-impact, load forecasting). This is Lane A of the two-lane architecture (`solution-context.md §7`) — the document-to-obligation vertical slice, the demo centerpiece.

Two decisions made in flow discussion, both binding on this schema:
- **Recall-first extraction triage** — low surfacing threshold; a missed obligation that's never proposed is invisible and unrecoverable, a false positive costs one reviewer click. Nothing auto-publishes regardless of confidence (`extraction-spec.md §14`'s explicit out-of-scope: no auto-acceptance above threshold).
- **Per-stage job tracking** — `document_processing_job` gets one row per pipeline-stage attempt, not a single status field, so a stuck document is diagnosable (which stage, which error, how many retries) rather than just "processing" forever.

### 2.1 Entities

| Table | Purpose | Key fields |
|---|---|---|
| `document` | One uploaded file through its full lifecycle | `id`, `operator_id`, `mine_id`→mine, `doc_class`, `content_hash`, `storage_bucket`/`storage_key`, `status`, `uploaded_by`, `superseded_by`, `version` |
| `document_processing_job` | One row per pipeline-stage attempt (OCR/classify/segment/extract) | `id`, `document_id`→document, `stage`, `attempt_number`, `status`, `error_message`, `retry_count`, `started_at`, `finished_at` |
| `document_segment` | One clause/section of a document, Akoma Ntoso-referenced | `id`, `document_id`→document, `segment_ref`, `sequence_no`, `text`, `page_no`, `bbox` |
| `document_segment_embedding` | pgvector embedding of a segment (§0.5 pattern, concrete here) | `id`, `segment_id`→document_segment, `model_version`, `embedding` |
| `extraction` | One AI-proposed record (any of the 6 extractor types) from one segment | `id`, `document_id`, `segment_id`→document_segment, `extractor`, `extraction_type`, `payload`, `anchor`, `confidence`, `status`, `reviewed_by` |
| `extraction_triage_config` | Confidence thresholds per extractor type — default + operator override | `id`, `operator_id` (nullable=default), `extraction_type`, `surface_threshold`, `review_priority_threshold` |
| `obligation` | Canonical legal obligation definition (one per clause, or one per clause-group via `shared_obligation_id`) | `id`, `operator_id`, `source_document_id`, `source_segment_id`, `shared_obligation_id`, `deontic`, `owner_role`, `periodicity`, `due_rule_kind`, `source_scope`, `superseded_by`, `version` |
| `obligation_applicability_rule` | One dimension-check that gates which mines an obligation applies to | `id`, `obligation_id`→obligation, `kind`, `detail` |
| `obligation_instance` | One dated, per-mine materialisation of an obligation | `id`, `obligation_id`, `mine_id`, `period_start`/`period_end`/`due_on`, `status`, `reconciliation`, `finding_id` |
| `obligation_evidence_link` | Join: which evidence items were cited against which instance, with per-item verdict | `id`, `obligation_instance_id`→obligation_instance, `evidence_id`, `match_outcome` |
| `nil_return` | A declared "not applicable this period" claim, only where `obligation.nil_permitted` | `id`, `obligation_instance_id`→obligation_instance, `declared_by`, `statement`, `status` |
| `obligation_conflict` | A detected contradiction between two obligations | `id`, `operator_id`, `conflict_type`, `obligation_a_id`, `obligation_b_id`, `status` |

**Why `extraction.payload` and `obligation.due_rule_detail` are `JSONB`, breaking from the rest of this doc's "no free-text, native enums" rule**: these two fields are genuinely polymorphic — an `OBLIGATION`-type extraction's payload shape has nothing in common with a `CONTRACTOR`-type extraction's payload, and a `FIXED_DATES` due-rule's detail (a date list) has nothing in common with an `OFFSET_FROM_EVENT` due-rule's detail (an anchor event name + day offset). Modeling this as one column per possible shape across every type would mean dozens of always-mostly-null columns; a variant-typed JSONB column with `extraction_type`/`due_rule_kind` as the discriminator is the standard, correctly-normalized way to handle a genuine tagged union in Postgres — the discriminator enum stays a real column so `WHERE extraction_type = 'OBLIGATION'` doesn't need to inspect JSON to filter.

**Cross-mine dedup (`shared_obligation_id`)**: one legal instrument (an EC letter covering a whole project) can yield one legal obligation that applies to several mines. All `obligation` rows produced from that same clause across mines share one `shared_obligation_id` (a ULID assigned at first extraction, reused when a reviewer explicitly links a later extraction to the same underlying clause) — this is what `register-extensions-spec.md`'s cross-mine diffing and dedup rollup group by. Per-mine applicability is still resolved independently through `obligation_applicability_rule` — sharing an id doesn't mean sharing an applicability outcome.

**Deferred, not built now**: `obligation_template` cross-*operator* sharing (`feasibility-and-roadmap.md §8`'s "shared but versioned obligation templates" is explicitly a roadmap/scalability item, not a P0 prototype need for a one-operator-deep build). Every `obligation` row here belongs to exactly one `operator_id`; add a template layer above this only if a second operator tenant is actually being onboarded.

### 2.2 DDL

```sql
CREATE TYPE doc_class AS ENUM (
  'EC_COMPLIANCE_REPORT', 'INSPECTION_REPORT', 'ACCIDENT_NOTICE',
  'CONTRACTOR_DOC', 'EVIDENCE', 'REGULATOR_ISSUANCE'
);
CREATE TYPE document_status AS ENUM (
  'UPLOADED', 'PROCESSING', 'NEEDS_REVIEW', 'PUBLISHED', 'SIGNED',
  'FAILED', 'REJECTED', 'QUARANTINED', 'SUPERSEDED', 'WITHDRAWN'
);
CREATE TYPE pipeline_stage AS ENUM ('OCR', 'CLASSIFY', 'SEGMENT', 'EXTRACT');
CREATE TYPE job_status AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');
CREATE TYPE extraction_type AS ENUM (
  'OBLIGATION', 'CLAIMED_STATUS', 'OBSERVATION', 'INCIDENT', 'CONTRACTOR', 'EVIDENCE'
);
CREATE TYPE extraction_status AS ENUM (
  'PROPOSED', 'ACCEPTED', 'EDITED', 'REJECTED', 'SPLIT', 'MERGED', 'MARKED_NOT_APPLICABLE'
);
CREATE TYPE deontic AS ENUM ('OBLIGATION', 'PROHIBITION', 'PERMISSION', 'RECOMMENDATION');
CREATE TYPE obligation_owner_role AS ENUM (
  'MANAGER', 'SAFETY_OFFICER', 'ENV_OFFICER', 'CONTRACTOR', 'UNASSIGNED'
); -- values conceptually aligned with post.role_key (§1), kept as a distinct type: an
   -- obligation's owner_role is a claim about who *should* be responsible, resolved to
   -- an actual post/appointment at materialisation time, not a direct FK to post.
CREATE TYPE periodicity AS ENUM (
  'ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SIX_MONTHLY', 'ANNUAL', 'CONTINUOUS'
);
CREATE TYPE due_rule_kind AS ENUM (
  'END_OF_PERIOD', 'FIXED_DATES', 'OFFSET_FROM_PERIOD_END', 'OFFSET_FROM_EVENT',
  'CONTINUOUS', 'ON_DEMAND', 'UNRESOLVED'
);
CREATE TYPE obligation_source_scope AS ENUM ('PROJECT', 'MINE', 'LEASE');
CREATE TYPE applicability_kind AS ENUM (
  'ALWAYS', 'MINE_TYPE', 'THRESHOLD', 'GASSINESS', 'NAMED_MINES', 'UNRESOLVED'
);
CREATE TYPE instance_status AS ENUM (
  'UPCOMING', 'DUE', 'SUBMITTED', 'SATISFIED', 'EVIDENCE_MISMATCH',
  'OVERDUE', 'ESCALATED', 'NOT_APPLICABLE', 'WAIVED'
);
CREATE TYPE reconciliation_verdict AS ENUM (
  'AGREED', 'CLAIMED_UNSUPPORTED', 'UNREPORTED', 'GAP', 'DISPUTED_APPLICABILITY', 'EVIDENCE_MISSING'
);
CREATE TYPE evidence_match_outcome AS ENUM ('SATISFIES', 'PARTIALLY_SATISFIES', 'DOES_NOT_SATISFY');
CREATE TYPE nil_return_status AS ENUM ('ACTIVE', 'CONTRADICTED');
CREATE TYPE conflict_type AS ENUM (
  'CONFLICTING_LIMIT', 'CONFLICTING_DEADLINE', 'CONFLICTING_FREQUENCY',
  'DUPLICATE_SUBMISSION', 'RESOURCE_COLLISION'
);
CREATE TYPE conflict_status AS ENUM ('OPEN', 'RESOLVED', 'ACCEPTED_AS_INTENDED');
CREATE TYPE severity AS ENUM ('MINOR', 'SIGNIFICANT', 'SEVERE'); -- system-wide vocabulary, reused verbatim
  -- by the defect/finding/CAPA domain (§3) and the authorisation closure ladder (§1) — introduced here
  -- because obligation-register-spec.md's escalation trigger ("severity=SEVERE") needs it first

-- 1. document
CREATE TABLE document (
  id                TEXT PRIMARY KEY,
  operator_id       TEXT NOT NULL REFERENCES operator(id), -- denormalized
  mine_id           TEXT NOT NULL REFERENCES mine(id),      -- primary filing context (at_mine)
  doc_class         doc_class NOT NULL,
  issuing_authority TEXT, -- e.g. 'MoEFCC', 'DGMS' — set when doc_class = REGULATOR_ISSUANCE
  contractor_org_id TEXT REFERENCES contractor_org(id), -- set only for doc_class = CONTRACTOR_DOC;
    -- backs the OpenFGA `document.owner_org` relation (authorization-spec.md's document type,
    -- merged from pipeline-spec.md §3.1) — was missing entirely before, `owner_org` had no column to sync from
  title             TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  content_hash      TEXT NOT NULL, -- sha256, matches S3 object key (§0.5)
  storage_bucket    TEXT NOT NULL,
  storage_key       TEXT NOT NULL,
  byte_size         BIGINT NOT NULL,
  content_type      TEXT NOT NULL,
  status            document_status NOT NULL DEFAULT 'UPLOADED',
  uploaded_by       TEXT NOT NULL REFERENCES person(id),
  version           INTEGER NOT NULL DEFAULT 1,
  superseded_by     TEXT REFERENCES document(id),
  published_at      TIMESTAMPTZ,
  published_by      TEXT REFERENCES person(id),
  signed_at         TIMESTAMPTZ,
  signed_by         TEXT REFERENCES person(id),
  signature_ref     TEXT, -- manifest reference, identity-governance-spec.md §3
  withdrawn_at      TIMESTAMPTZ,
  withdrawn_by      TEXT REFERENCES person(id),
  withdraw_reason   TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_hash) -- identical bytes dedupe at the row level too, not just in S3
);
CREATE INDEX document_mine_idx ON document (mine_id);
CREATE INDEX document_status_idx ON document (status);

-- 2. document_processing_job — one row per pipeline-stage attempt
CREATE TABLE document_processing_job (
  id              TEXT PRIMARY KEY,
  document_id     TEXT NOT NULL REFERENCES document(id),
  stage           pipeline_stage NOT NULL,
  attempt_number  INTEGER NOT NULL DEFAULT 1,
  status          job_status NOT NULL DEFAULT 'QUEUED',
  error_message   TEXT,
  retry_count     INTEGER NOT NULL DEFAULT 0,
  worker_ref      TEXT,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX processing_job_document_idx ON document_processing_job (document_id, stage, attempt_number);

-- 3. document_segment
CREATE TABLE document_segment (
  id            TEXT PRIMARY KEY,
  document_id   TEXT NOT NULL REFERENCES document(id),
  segment_ref   TEXT NOT NULL, -- Akoma Ntoso identifier, e.g. /akn/in/act/ec/.../main#cond_17__b
  sequence_no   INTEGER NOT NULL,
  text          TEXT NOT NULL,
  page_no       INTEGER,
  bbox          JSONB, -- layout anchor {x, y, width, height} for the reviewer UI
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, segment_ref)
);

-- 4. document_segment_embedding (pgvector — concrete instance of the §0.5 pattern)
CREATE TABLE document_segment_embedding (
  id            TEXT PRIMARY KEY,
  segment_id    TEXT NOT NULL REFERENCES document_segment(id),
  model_version TEXT NOT NULL,
  embedding     vector(1536),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX document_segment_embedding_hnsw ON document_segment_embedding
  USING hnsw (embedding vector_cosine_ops);

-- 5. extraction
CREATE TABLE extraction (
  id                TEXT PRIMARY KEY,
  document_id       TEXT NOT NULL REFERENCES document(id),
  segment_id        TEXT NOT NULL REFERENCES document_segment(id),
  extractor         TEXT NOT NULL, -- versioned, e.g. 'obligation@v3'
  extraction_type   extraction_type NOT NULL,
  payload           JSONB NOT NULL, -- type-specific shape, discriminated by extraction_type
  anchor            TEXT NOT NULL, -- fuzzy-match target text within the segment, ground()'s input
  field_anchors     JSONB,         -- per-field anchor spans within payload
  confidence        NUMERIC(4,3) NOT NULL,
  field_confidence  JSONB,
  status            extraction_status NOT NULL DEFAULT 'PROPOSED',
  reviewed_by       TEXT REFERENCES person(id),
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT,
  split_from_id     TEXT REFERENCES extraction(id), -- set on a child row created by SPLIT
  merged_into_id    TEXT REFERENCES extraction(id), -- set on a row whose status becomes MERGED
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (confidence >= 0 AND confidence <= 1),
  CHECK (status <> 'SPLIT'  OR merged_into_id IS NULL),
  CHECK (status <> 'MERGED' OR merged_into_id IS NOT NULL)
);
CREATE INDEX extraction_document_idx ON extraction (document_id, status);
CREATE INDEX extraction_type_idx ON extraction (extraction_type, status);

-- 6. extraction_triage_config — hybrid default + operator override, same pattern as role_escalation_chain (§1)
CREATE TABLE extraction_triage_config (
  id                       TEXT PRIMARY KEY,
  operator_id              TEXT REFERENCES operator(id), -- NULL = system default
  extraction_type          extraction_type NOT NULL,
  surface_threshold        NUMERIC(4,3) NOT NULL, -- below this, don't even propose
  review_priority_threshold NUMERIC(4,3) NOT NULL -- below this, flag as high-priority review
);
CREATE UNIQUE INDEX triage_config_default_unique ON extraction_triage_config (extraction_type) WHERE operator_id IS NULL;
CREATE UNIQUE INDEX triage_config_override_unique ON extraction_triage_config (operator_id, extraction_type) WHERE operator_id IS NOT NULL;
-- seed, recall-first (flow discussion decision): surface_threshold intentionally low —
-- a false positive costs one reviewer click, a never-proposed obligation is unrecoverable
INSERT INTO extraction_triage_config (id, operator_id, extraction_type, surface_threshold, review_priority_threshold)
VALUES
  ('triageconf_obligation', NULL, 'OBLIGATION', 0.30, 0.60),
  ('triageconf_claimed_status', NULL, 'CLAIMED_STATUS', 0.30, 0.60),
  ('triageconf_observation', NULL, 'OBSERVATION', 0.30, 0.60),
  ('triageconf_incident', NULL, 'INCIDENT', 0.30, 0.60),
  ('triageconf_contractor', NULL, 'CONTRACTOR', 0.30, 0.60),
  ('triageconf_evidence', NULL, 'EVIDENCE', 0.30, 0.60);

-- 7. obligation — canonical definition
CREATE TABLE obligation (
  id                   TEXT PRIMARY KEY,
  operator_id          TEXT NOT NULL REFERENCES operator(id),
  source_document_id   TEXT NOT NULL REFERENCES document(id),
  source_segment_id    TEXT NOT NULL REFERENCES document_segment(id),
  source_extraction_id TEXT NOT NULL REFERENCES extraction(id),
  shared_obligation_id TEXT NOT NULL, -- ULID, shared across mines for one legal instrument's obligation
  clause_ref           TEXT NOT NULL, -- human-citable, = source_segment.segment_ref at creation time
  deontic              deontic NOT NULL,
  title                TEXT NOT NULL,
  summary              TEXT,
  owner_role           obligation_owner_role NOT NULL DEFAULT 'UNASSIGNED',
  periodicity          periodicity NOT NULL,
  due_rule_kind        due_rule_kind NOT NULL,
  due_rule_detail      JSONB,       -- kind-specific: {offset_days}, {fixed_dates:[...]}, {anchor_event}, ...
  grace_period_days    INTEGER NOT NULL DEFAULT 0,
  source_scope         obligation_source_scope NOT NULL,
  anchor_event         TEXT,        -- for OFFSET_FROM_EVENT due rule / escalation triggers
  severity             severity NOT NULL DEFAULT 'SIGNIFICANT', -- grades escalation trigger strength
  nil_permitted        BOOLEAN NOT NULL DEFAULT false,
  active               BOOLEAN NOT NULL DEFAULT true,
  version              INTEGER NOT NULL DEFAULT 1,
  superseded_by        TEXT REFERENCES obligation(id),
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX obligation_shared_idx ON obligation (shared_obligation_id);
CREATE INDEX obligation_operator_idx ON obligation (operator_id, active);

-- 8. obligation_applicability_rule — AND'd per obligation
CREATE TABLE obligation_applicability_rule (
  id             TEXT PRIMARY KEY,
  obligation_id  TEXT NOT NULL REFERENCES obligation(id),
  kind           applicability_kind NOT NULL,
  detail         JSONB, -- {mine_type:'OPENCAST'} | {min_production_tpa:1000000} | {mine_ids:[...]} | null for ALWAYS/UNRESOLVED
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX applicability_obligation_idx ON obligation_applicability_rule (obligation_id);

-- 9. obligation_instance — dated, per-mine materialisation
CREATE TABLE obligation_instance (
  id               TEXT PRIMARY KEY,
  obligation_id    TEXT NOT NULL REFERENCES obligation(id),
  mine_id          TEXT NOT NULL REFERENCES mine(id),
  operator_id      TEXT NOT NULL REFERENCES operator(id), -- denormalized
  period_start     DATE NOT NULL,
  period_end       DATE NOT NULL,
  due_on           DATE NOT NULL,
  status           instance_status NOT NULL DEFAULT 'UPCOMING',
  status_reason    TEXT, -- required (app-enforced) when status IN (NOT_APPLICABLE, WAIVED)
  reconciliation   reconciliation_verdict, -- NULL until a compliance report is processed
  submitted_by     TEXT REFERENCES person(id),
  submitted_at     TIMESTAMPTZ,
  verified_by      TEXT REFERENCES person(id),
  verified_at      TIMESTAMPTZ,
  finding_id       TEXT, -- FK -> finding(id), added when Domain 3 lands (ESCALATED junction)
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (obligation_id, mine_id, period_start),
  CHECK (verified_by IS NULL OR submitted_by IS NULL OR verified_by <> submitted_by)
);
CREATE INDEX instance_mine_status_idx ON obligation_instance (mine_id, status);
CREATE INDEX instance_due_idx ON obligation_instance (due_on) WHERE status IN ('UPCOMING', 'DUE', 'OVERDUE');

-- 10. obligation_evidence_link
CREATE TABLE obligation_evidence_link (
  id                     TEXT PRIMARY KEY,
  obligation_instance_id TEXT NOT NULL REFERENCES obligation_instance(id),
  evidence_id            TEXT NOT NULL, -- FK -> evidence(id), added when Domain 4 lands
  match_outcome          evidence_match_outcome NOT NULL,
  linked_by              TEXT NOT NULL REFERENCES person(id),
  linked_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX evidence_link_instance_idx ON obligation_evidence_link (obligation_instance_id);

-- 11. nil_return — only where obligation.nil_permitted
CREATE TABLE nil_return (
  id                     TEXT PRIMARY KEY,
  obligation_instance_id TEXT NOT NULL REFERENCES obligation_instance(id),
  declared_by            TEXT NOT NULL REFERENCES person(id),
  declared_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  statement              TEXT NOT NULL,
  contradicted_by_ref    TEXT, -- evidence/observation id that contradicted this claim
  status                 nil_return_status NOT NULL DEFAULT 'ACTIVE'
);
CREATE INDEX nil_return_instance_idx ON nil_return (obligation_instance_id);

-- 12. obligation_conflict
CREATE TABLE obligation_conflict (
  id               TEXT PRIMARY KEY,
  operator_id      TEXT NOT NULL REFERENCES operator(id),
  conflict_type    conflict_type NOT NULL,
  obligation_a_id  TEXT NOT NULL REFERENCES obligation(id),
  obligation_b_id  TEXT NOT NULL REFERENCES obligation(id),
  detail           JSONB,
  status           conflict_status NOT NULL DEFAULT 'OPEN',
  detected_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_by      TEXT REFERENCES person(id),
  resolved_at      TIMESTAMPTZ,
  resolution_note  TEXT,
  CHECK (obligation_a_id <> obligation_b_id)
);
CREATE INDEX conflict_operator_idx ON obligation_conflict (operator_id, status);
```

### 2.3 Document status transitions

| From | Event | To |
|---|---|---|
| — | Upload confirmed (§0.5 two-phase write completes) | `UPLOADED` |
| `UPLOADED` | Pipeline picks it up | `PROCESSING` |
| `PROCESSING` | OCR/classify/segment/extract all succeed, ≥1 extraction proposed | `NEEDS_REVIEW` |
| `PROCESSING` | Any stage's `document_processing_job` exhausts retries | `FAILED` |
| `NEEDS_REVIEW` | `can_publish` role publishes reviewed extractions | `PUBLISHED` |
| `NEEDS_REVIEW` | Reviewer rejects the whole document (wrong file, unreadable) | `REJECTED` |
| `PUBLISHED` | `can_sign` role attaches a signed manifest | `SIGNED` |
| any non-terminal | Automated integrity/malware check fails | `QUARANTINED` |
| `PUBLISHED`/`SIGNED` | A newer version uploaded and linked | `SUPERSEDED` |
| `PUBLISHED`/`NEEDS_REVIEW` | `can_withdraw` role withdraws it | `WITHDRAWN` |

### 2.4 Extraction → obligation → instance, end to end

```
extraction (status=PROPOSED, extraction_type=OBLIGATION)
  → reviewer ACCEPT|EDIT  → extraction.status=ACCEPTED|EDITED, reviewed_by/at set
  → publish               → obligation row created (or new version if amending: superseded_by set on old row)
                           → obligation_applicability_rule rows created from the extraction payload's applicability dimensions
                           → materialise() runs: for every mine where the applicability rules AND together true,
                             INSERT obligation_instance (status=UPCOMING, due_on computed from due_rule_kind/detail)
```

`materialise()` reads `obligation_applicability_rule` and evaluates each `kind` against the target `mine` row directly (`MINE_TYPE`→`mine.mine_type`, `THRESHOLD`→`mine.production_scale_tpa`, `GASSINESS`→`mine.gassiness_class`, `NAMED_MINES`→`mine.id IN detail.mine_ids`) — this is exactly why those columns were added to `mine` in Domain 1, not deferred. An `UNRESOLVED` applicability rule blocks materialisation entirely for that obligation and instead raises a triage item — per `register-extensions-spec.md`, "a wrong obligation is worse than a missing one," so it never silently defaults to `ALWAYS`.

Reconciliation (`obligation_instance.reconciliation`) is set independently, whenever an `EC_COMPLIANCE_REPORT` document's `CLAIMED_STATUS` extractions are published — matches the claimed status against the instance's actual evidence-linked state (`obligation_evidence_link.match_outcome`) to produce one of the six reconciliation verdicts. It never mutates `status` — a `CLAIMED_UNSUPPORTED` instance can simultaneously be `OVERDUE`.

### 2.5 Forward references

`obligation_instance.finding_id` → `finding(id)`, `obligation_evidence_link.evidence_id` → `evidence(id)`: both added as real FK constraints once Domains 3 and 4 land, same migration-ordering approach as §1.6.

### 2.6 `is_draft` — confirmed inert in this flow

`authorization-spec.md §3` defines `obligation_instance.is_draft: [user:*]` ("marker; absent once published") to gate `viewer`/`published_viewer`. In this project's actual flow (§2.4), `materialise()` only ever runs *after* an `obligation` is published — no `obligation_instance` row is ever created in a draft state to begin with, so the marker would always be absent and the relation is inert, not wrong. Documented explicitly rather than silently ignored, so a future reader doesn't wonder whether it was missed: it wasn't, it just never fires given how `materialise()` is sequenced here. If a future "preview materialisation" feature is ever added (showing a reviewer what instances *would* be created before publishing), that's exactly the point where this marker would start doing real work.

---

## 3. Defect, Finding & CAPA (Lane B)

Implements: `defect-spec.md`. Lane B of the two-lane architecture — the reactive/inspection side, joined to Lane A (Domain 2) at exactly one point: an `ESCALATED` `obligation_instance` creates or links a `finding` directly, with no `defect` in between.

Flow-discussion decision: **recurrence reopens the same `defect` row** rather than spawning a new one linked by a pointer — one row per physical condition, `first_observed_on` never resets, `recurrence_count` tracks repeats. Chosen because ageing and CAPA history need to read as one continuous record for a single condition, and the dashboard's "recurring failure themes" aggregation wants one row to group against, not a chain to walk.

### 3.1 Entities

| Table | Purpose | Key fields |
|---|---|---|
| `observation` | A raw sighting — from field entry, document extraction, or an escalated obligation instance | `id`, `mine_id`, `source_type`, `source_extraction_id`/`source_instance_id`, `raised_severity`, `normalised_severity`, `matched_defect_id`, `match_decision` |
| `defect` | A physical condition, many observations resolve to one | `id`, `mine_id`, `status`, `first_observed_on`, `recurrence_count`, `current_severity` |
| `defect_ageing_band_config` | Ageing-band day thresholds per severity — default + operator override | `id`, `operator_id` (nullable=default), `severity`, `low_max_days`, `medium_max_days`, `high_max_days` |
| `finding` | A confirmed breach of a specific requirement | `id`, `defect_id` (nullable), `obligation_instance_id` (nullable), `requirement_id` (mandatory), `severity`, `raised_by_regulator`, `responsible_org_id`, `status` |
| `capa` | Corrective + preventive action against one finding | `id`, `finding_id`, `corrective_action`, `preventive_action`, `status`, `submitted_by`, `verified_by` |

**Why a `defect` can exist with zero findings**: `defect-spec.md`'s flow explicitly allows "requirement breached? → no/unknown → defect remains operational (terminal, no finding)" — a real physical condition that isn't (yet, or ever) a formal compliance breach is still worth tracking. `defect` and `finding` are deliberately separate tables, not one row with a nullable "is this a finding" flag, because a defect's lifecycle (ageing, recurrence) is independent of whether it ever produces a finding.

**Why `finding` has two nullable origin FKs (`defect_id`, `obligation_instance_id`) instead of one**: a finding can arise from the field/inspection side (has a `defect_id`, may or may not also cite the instance it violates) or purely from an overdue obligation escalating administratively (has an `obligation_instance_id`, no physical defect was ever sighted). Both can be set at once — a physically-observed defect that also happens to breach a specific due obligation. At least one must be set (enforced by `CHECK`); `requirement_id` is separately mandatory always, since "which rule was broken" is never optional even when "was there a physical defect" is.

**`responsible_org_id`** reuses Domain 1's `contractor_org` — `NULL` means the operator itself is responsible, a set value means a specific engaged contractor is. This is the field `field-capture-spec.md` and this spec both assume exists ahead of the full contractor-register domain (BF-14) being built.

### 3.2 DDL

```sql
CREATE TYPE observation_source_type AS ENUM ('FIELD_ENTRY', 'DOCUMENT_EXTRACTION', 'ESCALATED_INSTANCE');
CREATE TYPE match_decision AS ENUM ('PENDING', 'MATCHED_EXISTING', 'NEW_DEFECT');
CREATE TYPE defect_status AS ENUM ('OPEN', 'UNDER_ACTION', 'CLOSED', 'RECURRED');
CREATE TYPE finding_status AS ENUM ('OPEN', 'CAPA_ASSIGNED', 'PENDING_VERIFICATION', 'CLOSED', 'REOPENED');
CREATE TYPE capa_status AS ENUM ('OPEN', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED_CLOSED', 'REOPENED');

-- 1. observation
CREATE TABLE observation (
  id                   TEXT PRIMARY KEY,
  operator_id          TEXT NOT NULL REFERENCES operator(id), -- denormalized
  mine_id              TEXT NOT NULL REFERENCES mine(id),
  source_type          observation_source_type NOT NULL,
  source_extraction_id TEXT REFERENCES extraction(id),         -- set iff source_type = DOCUMENT_EXTRACTION
  source_instance_id   TEXT REFERENCES obligation_instance(id),-- set iff source_type = ESCALATED_INSTANCE
  reported_by          TEXT REFERENCES person(id),              -- set for FIELD_ENTRY
  raised_by_regulator  BOOLEAN NOT NULL DEFAULT false,
  at_asset_id          TEXT REFERENCES asset(id),
  at_subunit_id        TEXT REFERENCES subunit(id),
  description          TEXT NOT NULL,
  raised_severity      severity NOT NULL,
  normalised_severity  severity NOT NULL,
  observed_at          TIMESTAMPTZ NOT NULL,
  matched_defect_id    TEXT REFERENCES defect(id),
  match_decision       match_decision NOT NULL DEFAULT 'PENDING',
  match_decision_by    TEXT REFERENCES person(id),
  match_decision_at    TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (source_type = 'DOCUMENT_EXTRACTION' AND source_extraction_id IS NOT NULL AND source_instance_id IS NULL) OR
    (source_type = 'ESCALATED_INSTANCE'  AND source_instance_id IS NOT NULL AND source_extraction_id IS NULL) OR
    (source_type = 'FIELD_ENTRY'         AND source_extraction_id IS NULL AND source_instance_id IS NULL)
  ),
  CHECK (match_decision = 'PENDING' OR matched_defect_id IS NOT NULL) -- a decision always resolves to some defect
);
CREATE INDEX observation_mine_idx ON observation (mine_id, match_decision);
CREATE INDEX observation_defect_idx ON observation (matched_defect_id);

-- 2. defect
CREATE TABLE defect (
  id                TEXT PRIMARY KEY,
  operator_id       TEXT NOT NULL REFERENCES operator(id), -- denormalized
  mine_id           TEXT NOT NULL REFERENCES mine(id),
  at_asset_id       TEXT REFERENCES asset(id),
  at_subunit_id     TEXT REFERENCES subunit(id),
  title             TEXT NOT NULL,
  description       TEXT NOT NULL,
  status            defect_status NOT NULL DEFAULT 'OPEN',
  current_severity  severity NOT NULL,
  first_observed_on DATE NOT NULL, -- immutable ageing anchor, never updated on recurrence
  recurrence_count  INTEGER NOT NULL DEFAULT 0,
  last_recurred_at  TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX defect_mine_status_idx ON defect (mine_id, status);
CREATE INDEX defect_ageing_idx ON defect (first_observed_on) WHERE status IN ('OPEN', 'UNDER_ACTION', 'RECURRED');

-- 3. defect_ageing_band_config — hybrid default + operator override, same pattern as §1/§2
CREATE TABLE defect_ageing_band_config (
  id               TEXT PRIMARY KEY,
  operator_id      TEXT REFERENCES operator(id), -- NULL = system default
  severity         severity NOT NULL,
  low_max_days     INTEGER NOT NULL, -- age <= this => LOW
  medium_max_days  INTEGER NOT NULL, -- age <= this => MEDIUM, else HIGH up to high_max_days
  high_max_days    INTEGER NOT NULL  -- age > this => CRITICAL
);
CREATE UNIQUE INDEX ageing_config_default_unique ON defect_ageing_band_config (severity) WHERE operator_id IS NULL;
CREATE UNIQUE INDEX ageing_config_override_unique ON defect_ageing_band_config (operator_id, severity) WHERE operator_id IS NOT NULL;
-- seed defaults, same bands across severities to start; override per-operator to make SEVERE age into CRITICAL faster
INSERT INTO defect_ageing_band_config (id, operator_id, severity, low_max_days, medium_max_days, high_max_days) VALUES
  ('ageing_minor', NULL, 'MINOR', 7, 15, 30),
  ('ageing_significant', NULL, 'SIGNIFICANT', 7, 15, 30),
  ('ageing_severe', NULL, 'SEVERE', 7, 15, 30);

-- 4. finding
CREATE TABLE finding (
  id                    TEXT PRIMARY KEY,
  operator_id           TEXT NOT NULL REFERENCES operator(id), -- denormalized
  defect_id             TEXT REFERENCES defect(id),
  obligation_instance_id TEXT REFERENCES obligation_instance(id),
  requirement_id        TEXT NOT NULL REFERENCES obligation(id), -- which rule was broken, always required
  severity              severity NOT NULL,
  raised_by             TEXT REFERENCES person(id),
  raised_by_regulator   BOOLEAN NOT NULL DEFAULT false,
  raised_by_region_id   TEXT REFERENCES region(id), -- backs OpenFGA `finding.raised_by_regulator: [region]`
    -- (authorization-spec.md §3) — the boolean alone can't sync that tuple, there was no region to point at
  responsible_org_id    TEXT REFERENCES contractor_org(id), -- NULL = operator itself responsible
  status                finding_status NOT NULL DEFAULT 'OPEN',
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (defect_id IS NOT NULL OR obligation_instance_id IS NOT NULL),
  CHECK (raised_by_regulator = (raised_by_region_id IS NOT NULL))
);
CREATE INDEX finding_defect_idx ON finding (defect_id);
CREATE INDEX finding_instance_idx ON finding (obligation_instance_id);
CREATE INDEX finding_operator_status_idx ON finding (operator_id, status);

-- 5. capa
CREATE TABLE capa (
  id                TEXT PRIMARY KEY,
  finding_id        TEXT NOT NULL REFERENCES finding(id),
  corrective_action TEXT NOT NULL,
  preventive_action TEXT NOT NULL,
  assigned_to       TEXT REFERENCES person(id),
  assigned_at       TIMESTAMPTZ,
  due_on            DATE,
  status            capa_status NOT NULL DEFAULT 'OPEN',
  submitted_by      TEXT REFERENCES person(id),
  submitted_at      TIMESTAMPTZ,
  verified_by       TEXT REFERENCES person(id),
  verified_at       TIMESTAMPTZ,
  rejection_reason  TEXT, -- set on SUBMITTED -> REOPENED
  -- deadline extension is a first-class audited act, never a bare UPDATE to due_on
  -- (defect-spec.md §7.3) — repeated extensions are a risk-engine signal, same
  -- counter+last-event shape as defect.recurrence_count/last_recurred_at
  extension_count       INTEGER NOT NULL DEFAULT 0,
  last_extension_reason TEXT,
  last_extended_at      TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (verified_by IS NULL OR submitted_by IS NULL OR verified_by <> submitted_by), -- no self-verification
  CHECK (verified_by IS NULL OR assigned_to IS NULL OR verified_by <> assigned_to)    -- verifier != assignee too
);
CREATE INDEX capa_finding_idx ON capa (finding_id);
CREATE INDEX capa_status_idx ON capa (status);
```

### 3.3 Defect status transitions (recurrence-as-reopen)

| From | Event | To |
|---|---|---|
| — | First observation matched/confirmed as new | `OPEN` |
| `OPEN` | A CAPA is assigned against a finding on this defect | `UNDER_ACTION` |
| `UNDER_ACTION` | All findings on this defect reach `CLOSED` | `CLOSED` |
| `CLOSED` | A new observation matches this defect again | `RECURRED` (`recurrence_count += 1`, `last_recurred_at = now()`, `first_observed_on` untouched) |
| `RECURRED` | Same as `OPEN`/`UNDER_ACTION` behavior from here — functions identically to a reopened defect |

Ageing band for a defect = `now() - first_observed_on` compared against `defect_ageing_band_config` for its `current_severity` (override row if the operator has one, else the default row) — computed at query time, not stored, so a config change immediately reflects on every dashboard without a backfill.

### 3.4 Finding → CAPA closure (no self-verification, no shortcuts)

```
finding (status=OPEN)
  → capa created (status=OPEN, corrective_action + preventive_action both required) → finding.status=CAPA_ASSIGNED
  → capa.status: OPEN → IN_PROGRESS → SUBMITTED (submitted_by set, ≥1 evidence row with for_capa_id=this capa's id)
      SUBMITTED → verifier reviews evidence:
        reject  → REOPENED (rejection_reason set, back to IN_PROGRESS effectively)
        accept  → VERIFIED_CLOSED (verified_by set, verified_by ≠ submitted_by ≠ assigned_to enforced by CHECK)
  → once every capa on a finding is VERIFIED_CLOSED → finding.status = CLOSED
  → once every finding on a defect is CLOSED → defect.status = CLOSED (§3.3)
```

Closure evidence is looked up as `evidence WHERE for_capa_id = capa.id` (Domain 4, `data-model.md §4.1`) — not a single FK on `capa` pointing at one evidence row. That direction flip matters for ReBAC: `authorization-spec.md §3`'s `evidence.for_capa` relation is what lets OpenFGA derive `evidence.viewer` by walking *from* the evidence *to* the CAPA, which only works if evidence carries the pointer. A `capa.closure_evidence_id` column (the original design here) pointed the wrong way for that walk and is a many-to-one lookup, not a many-to-many join, matching that closing a CAPA can cite more than one evidence item (photo + a lab report, say). Closure *authority* (who is allowed to move `capa.status` to `VERIFIED_CLOSED` at all) reuses Domain 1's `PERMISSION_BY_SEVERITY` ReBAC check keyed on `finding.severity` — not re-derived here, per `defect-spec.md`'s explicit "not restated" rule pointing at `authorization-spec.md §7`.

### 3.5 Escalation and risk scoring — deferred, not new tables here

Defect/finding escalation is condition-triggered the same way Domain 2's obligation escalation is (ageing band crossing into `CRITICAL`, `recurrence_count` past a threshold, `severity=SEVERE`) — evaluated at query/notification time against `defect_ageing_band_config` and `Domain 1`'s `resolve_responsible()`, not a separately stored escalation-state machine. Risk scoring (`defect-spec.md §11`, referenced by the dashboard spec) is explicitly analytics territory — deferred to whichever pass builds Domain 5 (dashboards), since it reads across everything built so far rather than owning new source-of-truth entities.

### 3.6 Forward references

None owned by `capa` itself anymore — its evidence link is `evidence.for_capa_id` (Domain 4), a column on `evidence`, not on `capa`. `finding.responsible_org_id` → `contractor_org` is already a real FK (Domain 1 exists first). No `capa`-side forward reference remains.

### 3.7 Flagged: audit trail / outbox not yet built

Every domain so far (`appointment`/`post` changes in §1, `obligation`/`extraction` publish in §2, `finding`/`capa` transitions here) needs the append-only, hash-chained `audit_event` table and the transactional outbox pattern that `identity-governance-spec.md §4` and `technical-design.md §6` both require — "every material transaction writes domain change + audit event + outbox event atomically." This wasn't built alongside any domain yet because it's uniform cross-cutting infrastructure, not domain-specific data — the same shape applies identically to every table above. `evidence`'s own hash chain (§4) is a narrower, evidence-specific mechanism and doesn't substitute for this. Still proposing to do the general audit/outbox pass as one pass after Domain 5 (dashboards, which reads through the outbox projections this pattern produces) rather than retrofitting it domain-by-domain — flag now if you'd rather have it before Domain 5.

---

## 4. Field Evidence & Closure Block

Implements: `field-capture-spec.md`. This is the flagship demo mechanism — "submit closure evidence captured away from the target, show the explainable `DISTANCE_MISMATCH`, show the blocked closure" (`feasibility-and-roadmap.md §4`, steps 7–8).

Mobile stack decision from flow discussion: **PowerSync Flutter SDK** — same Postgres-backed sync-bucket model the architecture docs already named for the (now-replaced) Kotlin client, so the offline-first design (local commit before network write, client-generated stable IDs, chunked resumable upload) carries over unchanged; only the client SDK swaps.

### 4.1 Design choices made resolving this domain's schema

- **`evidence.verdict` is never mutated, including on override.** A manager overriding a `SUSPECT` verdict doesn't rewrite history — it's a separate signed action recorded on the verification attempt (§4.1.3), so the original system judgment stays intact for audit. Matches the same "original bytes/record never change" principle `document` already follows.
- **Verdict (capture trustworthiness) and geofence/distance checking (usage-time fitness) are two different judgments, not one column.** `evidence.verdict` (`VERIFIED`/`PLAUSIBLE`/`UNVERIFIED`/`SUSPECT`) is intrinsic to the capture itself — device integrity, mock-location flag, clock consistency, chain integrity — computed once at sync time. Whether a *specific* piece of evidence is close enough to a *specific* target asset depends on what it's being used to close, so that's evaluated per attempt, not baked into the evidence row.
- **One `evidence_verification_attempt` table serves both Lane A and Lane B closure**, not two near-duplicate tables — an obligation-instance verification (`SUBMITTED`→`SATISFIED`/`EVIDENCE_MISMATCH`, Domain 2) and a CAPA closure (`SUBMITTED`→`VERIFIED_CLOSED`/`REOPENED`, Domain 3) are the same shape of event: someone attempts to verify evidence against a target, gets accepted or blocked with a specific reason. Polymorphic target via two nullable FKs + `CHECK`, same pattern as `post` in Domain 1.
- **No `device` registry table for the prototype** — `device_id` is a client-supplied stable string, the hash chain is simply "previous evidence row from this same `device_id`." A full device-registry/attestation-management table is a production hardening concern, not needed to prove the mechanism.

### 4.2 Entities

| Table | Purpose | Key fields |
|---|---|---|
| `evidence` | One captured record (photo/video/audio/form), intrinsic trust verdict, capture-time primary target | `id` (client-generated), `mine_id`, `capture_path`, `verdict`, `for_instance_id`/`for_capa_id`/`for_defect_id` (≤1 set), `prev_hash`, `device_id`, `location`, `captured_at_wall`/`_monotonic_ns`, `verified_window_start`/`_end` |
| `evidence_verification_attempt` | One attempt to use a piece of evidence to close a CAPA or verify an obligation instance | `id`, `capa_id`/`obligation_instance_id` (exactly one), `evidence_id`, `distance_m`, `within_geofence`, `outcome`, `override_by` |
| `attendance_record` | Worker presence at a mine for a shift, capture-backed (BF-15, minimal) | `id`, `person_id`, `contractor_org_id`, `shift_date`, `check_in_evidence_id`/`check_out_evidence_id`, `capture_method` |

### 4.3 DDL

```sql
CREATE TYPE capture_path AS ENUM ('DIRECT', 'IMPORTED');
CREATE TYPE media_type AS ENUM ('PHOTO', 'VIDEO', 'AUDIO', 'FORM_ONLY');
CREATE TYPE evidence_verdict AS ENUM ('VERIFIED', 'PLAUSIBLE', 'UNVERIFIED', 'SUSPECT');
CREATE TYPE verification_outcome AS ENUM (
  'ACCEPTED', 'ACCEPTED_WITH_OVERRIDE',
  'BLOCKED_SUSPECT_EVIDENCE', 'BLOCKED_ALL_UNVERIFIED', 'BLOCKED_DISTANCE_MISMATCH',
  'BLOCKED_METADATA_TAMPERED', 'BLOCKED_SELF_VERIFICATION', 'REJECTED_OTHER'
);
CREATE TYPE attendance_capture_method AS ENUM ('GEOFENCED_PHOTO', 'RFID_CAP_LAMP', 'MANUAL_ENTRY');

-- 1. evidence — id is CLIENT-GENERATED (ULID) so offline capture -> sync is an idempotent upsert
CREATE TABLE evidence (
  id                        TEXT PRIMARY KEY,
  operator_id               TEXT NOT NULL REFERENCES operator(id), -- denormalized
  mine_id                   TEXT NOT NULL REFERENCES mine(id),
  captured_by               TEXT NOT NULL REFERENCES person(id),
  appointment_ref           TEXT REFERENCES appointment(id), -- snapshot of capture authority held at capture time
  -- capture-time primary target — authorization-spec.md §3's evidence.for_instance/for_capa/for_defect
  -- relations, which OpenFGA walks FROM evidence to derive evidence.viewer. At most one set: what this
  -- evidence was captured FOR (NULL if captured standalone, linked later during review). This is distinct
  -- from obligation_evidence_link (§2), which tracks the fuller many-to-many set of evidence actually
  -- considered when verifying an instance, each with its own match_outcome — for_instance_id is narrower
  -- and capture-time, obligation_evidence_link is broader and verification-time.
  for_instance_id           TEXT REFERENCES obligation_instance(id),
  for_capa_id               TEXT REFERENCES capa(id),
  for_defect_id             TEXT REFERENCES defect(id),
  capture_path              capture_path NOT NULL,
  media_type                media_type NOT NULL,
  -- S3 pointer, same shape as document (§0.5/§2)
  content_hash              TEXT NOT NULL,
  storage_bucket            TEXT NOT NULL,
  storage_key               TEXT NOT NULL,
  byte_size                 BIGINT NOT NULL,
  content_type              TEXT NOT NULL,
  client_schema_version     INTEGER NOT NULL, -- the offline client's local record schema at capture
    -- time, not the server's — "schema version travels with each queued record" (technical-design.md
    -- §7), so a server that's rolled forward can still interpret a record queued by an older app build
  -- hash chain, per capturing device
  device_id                 TEXT NOT NULL,
  chain_sequence            INTEGER NOT NULL,
  prev_hash                 TEXT, -- NULL only for a device's very first evidence row
  device_integrity_verdict  JSONB, -- raw Play Integrity (or equivalent) attestation response
  -- location
  location                  geography(Point, 4326),
  location_accuracy_m       NUMERIC,
  location_provider         TEXT,
  satellites_used           INTEGER,
  constellations            TEXT[],
  is_mock_location          BOOLEAN NOT NULL DEFAULT false,
  -- time: three clocks
  captured_at_wall          TIMESTAMPTZ NOT NULL,       -- untrusted, device wall clock
  captured_at_monotonic_ns  BIGINT,                     -- trusted within one boot
  verified_window_start     TIMESTAMPTZ,                -- offline capture -> interval, not an instant
  verified_window_end       TIMESTAMPTZ,
  server_received_at        TIMESTAMPTZ,                -- authoritative anchor, set on sync
  -- outcome
  verdict                   evidence_verdict NOT NULL,
  verdict_reasons           JSONB NOT NULL DEFAULT '[]', -- array of reason codes/details
  at_asset_id                TEXT REFERENCES asset(id),
  at_subunit_id               TEXT REFERENCES subunit(id),
  synced_at                 TIMESTAMPTZ,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_id, chain_sequence),
  CHECK (capture_path = 'DIRECT' OR verdict != 'VERIFIED'), -- IMPORTED can never reach VERIFIED (spec: capped at UNVERIFIED)
  CHECK (num_nonnulls(for_instance_id, for_capa_id, for_defect_id) <= 1)
);
CREATE INDEX evidence_mine_idx ON evidence (mine_id);
CREATE INDEX evidence_captured_by_idx ON evidence (captured_by);
CREATE INDEX evidence_location_gix ON evidence USING GIST (location);
CREATE INDEX evidence_for_instance_idx ON evidence (for_instance_id) WHERE for_instance_id IS NOT NULL;
CREATE INDEX evidence_for_capa_idx ON evidence (for_capa_id) WHERE for_capa_id IS NOT NULL;
CREATE INDEX evidence_for_defect_idx ON evidence (for_defect_id) WHERE for_defect_id IS NOT NULL;

-- 2. evidence_verification_attempt — one shape for both Lane A and Lane B closure
CREATE TABLE evidence_verification_attempt (
  id                     TEXT PRIMARY KEY,
  operator_id            TEXT NOT NULL REFERENCES operator(id), -- denormalized
  capa_id                TEXT REFERENCES capa(id),
  obligation_instance_id TEXT REFERENCES obligation_instance(id),
  evidence_id            TEXT NOT NULL REFERENCES evidence(id),
  attempted_by           TEXT NOT NULL REFERENCES person(id),
  attempted_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  distance_m             NUMERIC,       -- ST_Distance(evidence.location, target's location), if a target exists
  geofence_radius_m      NUMERIC,       -- the policy radius checked against
  within_geofence        BOOLEAN,
  outcome                verification_outcome NOT NULL,
  reason_detail          JSONB,
  override_by            TEXT REFERENCES person(id), -- set only on ACCEPTED_WITH_OVERRIDE, requires can_override_verdict
  override_reason        TEXT,
  override_signature_ref TEXT, -- DSC/eSign manifest ref, identity-governance-spec.md §3 pattern
  CHECK (num_nonnulls(capa_id, obligation_instance_id) = 1),
  CHECK ((outcome = 'ACCEPTED_WITH_OVERRIDE') = (override_by IS NOT NULL))
);
CREATE INDEX verification_capa_idx ON evidence_verification_attempt (capa_id);
CREATE INDEX verification_instance_idx ON evidence_verification_attempt (obligation_instance_id);
CREATE INDEX verification_evidence_idx ON evidence_verification_attempt (evidence_id);

-- 3. attendance_record — BF-15 minimal, RFID slot present but simulated (real reader hardware is roadmap)
CREATE TABLE attendance_record (
  id                    TEXT PRIMARY KEY,
  operator_id           TEXT NOT NULL REFERENCES operator(id), -- denormalized
  mine_id               TEXT NOT NULL REFERENCES mine(id),
  person_id             TEXT NOT NULL REFERENCES person(id),
  contractor_org_id     TEXT REFERENCES contractor_org(id), -- snapshot: which org they were with at check-in
  shift_date            DATE NOT NULL,
  capture_method        attendance_capture_method NOT NULL,
  check_in_evidence_id  TEXT REFERENCES evidence(id),
  check_in_at           TIMESTAMPTZ,
  check_out_evidence_id TEXT REFERENCES evidence(id),
  check_out_at          TIMESTAMPTZ,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (person_id, mine_id, shift_date)
);
CREATE INDEX attendance_mine_date_idx ON attendance_record (mine_id, shift_date);
```

### 4.4 `can_close_with()` — closure gate, evaluated from `evidence_verification_attempt`

```
can_close_with(capa_id | obligation_instance_id):
  linked = evidence WHERE for_capa_id = capa_id  -- or: evidence joined via obligation_evidence_link, for an instance
  if any linked evidence.verdict = SUSPECT AND no ACCEPTED_WITH_OVERRIDE attempt exists for it:
    return BLOCKED_SUSPECT_EVIDENCE
  if every linked evidence.verdict = UNVERIFIED:
    return BLOCKED_ALL_UNVERIFIED   -- UNVERIFIED evidence alone can never satisfy closure
  geofence_check = ST_DWithin(evidence.location, target.location, geofence_radius_m)
  if not geofence_check:
    return BLOCKED_DISTANCE_MISMATCH
  return ACCEPTED
```

Every call — blocked or accepted — writes one `evidence_verification_attempt` row. This is what makes the demo's "submit evidence captured away from target → blocked, explainable" moment a real stored record rather than a live-only computation: the blocked attempt and the later successful one are both permanently queryable, exactly the "drill from a dashboard metric to the exact record and evidence" acceptance criterion (`feasibility-and-roadmap.md §4` step 10).

### 4.5 Forward references resolved

`evidence.for_instance_id`/`for_capa_id`/`for_defect_id` needed no `ALTER TABLE` — `obligation_instance`, `capa`, `defect` are all defined in earlier domains, so `evidence` (Domain 4) references them directly at creation (§4.3). The one remaining forward reference from earlier domains is `obligation_evidence_link.evidence_id` → `evidence(id)` (§2), resolved now the same way §1.6 handled it:

```sql
ALTER TABLE obligation_evidence_link ADD CONSTRAINT fk_evidence_link_evidence FOREIGN KEY (evidence_id) REFERENCES evidence(id);
ALTER TABLE evidence ADD COLUMN sync_error TEXT; -- set if a sync attempt failed after the row reached the server;
  -- fully-offline queue depth (never yet phoned home) is client-local telemetry PowerSync reports itself, not
  -- a Postgres-tracked state — there is no server row to point at until the client has synced at least once
```

### 4.6 Backfill: notification & approval (`workflow-spec.md`, BF-8)

Not one of the original 5 domains, but Domain 5's dashboard reads these directly, so building them here rather than inventing dashboard data with no source. Minimal — the addressing/escalation logic (`resolve(post)`) is entirely Domain 1's `resolve_responsible()`; these two tables are just the records that mechanism writes to.

```sql
CREATE TYPE notification_channel AS ENUM ('IN_APP', 'PUSH', 'SMS', 'EMAIL', 'DIGEST');
CREATE TYPE notification_status AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'ACKNOWLEDGED', 'ACTIONED', 'FAILED');
CREATE TYPE approval_decision AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'RETURNED');

-- subject_type/subject_ref are a deliberate exception to this doc's "no untyped polymorphic refs" rule
-- (§1.13's reasoning against it) — a notification/approval subject can be any of ~6 tables, and unlike `post`
-- these rows are disposable delivery/decision records, not canonical domain state; losing FK enforcement here
-- doesn't risk the kind of silent data-integrity gap it would on a business entity like `post`.
CREATE TABLE notification (
  id                  TEXT PRIMARY KEY,
  operator_id         TEXT NOT NULL REFERENCES operator(id), -- denormalized
  target_post_id      TEXT NOT NULL REFERENCES post(id),
  resolved_person_id  TEXT REFERENCES person(id), -- NULL if escalation chain exhausted (unmanned-post finding raised instead)
  delivered_to_delegate_id TEXT REFERENCES person(id), -- set iff resolve(post) hit step 2 (workflow-spec.md
    -- §2.1): no current holder, a registered notification_delegate stood in instead of escalating.
    -- resolved_person_id stays the actual delegate in this case too — this column exists only to mark
    -- "delivered on behalf of an unmanned post", per test 4: delegate "gains no permission"
  subject_type        TEXT NOT NULL, -- 'OBLIGATION_INSTANCE' | 'FINDING' | 'CAPA' | 'DEFECT' | 'APPOINTMENT_LAPSE'
    -- | 'UNMANNED_POST' | 'FLAGGED_EXTRACTION'
  subject_ref         TEXT NOT NULL,
  severity            severity NOT NULL,
  channel             notification_channel NOT NULL,
  status               notification_status NOT NULL DEFAULT 'QUEUED',
  requires_ack        BOOLEAN NOT NULL DEFAULT false,
  queued_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at             TIMESTAMPTZ,
  delivered_at        TIMESTAMPTZ,
  acknowledged_at     TIMESTAMPTZ,
  actioned_at         TIMESTAMPTZ,
  failed_at           TIMESTAMPTZ,
  failure_reason      TEXT
);
CREATE INDEX notification_person_status_idx ON notification (resolved_person_id, status);
CREATE INDEX notification_subject_idx ON notification (subject_type, subject_ref);

CREATE TABLE approval (
  id                TEXT PRIMARY KEY,
  operator_id       TEXT NOT NULL REFERENCES operator(id), -- denormalized
  subject_type      TEXT NOT NULL,
  subject_ref       TEXT NOT NULL,
  required_post_id  TEXT NOT NULL REFERENCES post(id),
  decision          approval_decision NOT NULL DEFAULT 'PENDING',
  decided_by        TEXT REFERENCES person(id),
  decided_at        TIMESTAMPTZ,
  appointment_ref   TEXT REFERENCES appointment(id), -- which appointment authorised the decision
  reason            TEXT,
  signature_ref     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX approval_post_decision_idx ON approval (required_post_id, decision);

-- notification_delegate — receipt only, never authority (workflow-spec.md §2.2). Post-scoped, not
-- person-to-person: at resolution time the post may already be vacant, so "who delegates" is anchored
-- to the post, registered by whoever held it or an admin acting on the vacant post's behalf.
-- resolve(post) checks this BEFORE escalating upward, once no current appointment holder exists.
CREATE TABLE notification_delegate (
  id            TEXT PRIMARY KEY,
  post_id       TEXT NOT NULL REFERENCES post(id),
  delegate_id   TEXT NOT NULL REFERENCES person(id),
  registered_by TEXT NOT NULL REFERENCES person(id),
  valid_from    TIMESTAMPTZ NOT NULL,
  valid_until   TIMESTAMPTZ NOT NULL,
  reason        TEXT NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until > valid_from)
);
CREATE INDEX notification_delegate_post_idx ON notification_delegate (post_id, valid_until);
```

---

## 5. Dashboard Drill-Down

Implements: `dashboard-spec.md`. Not new domain logic — a read model over everything built in §1–§4.6, governed by one rule: **"every number is a link, not a claim."**

### 5.1 `metric_manifest` — append-only, created on drill-down/export/report, not every refresh

```sql
CREATE TYPE dashboard_freshness AS ENUM ('LIVE', 'DELAYED', 'OFFLINE_GAPS', 'SNAPSHOT');

CREATE TABLE metric_manifest (
  id                          TEXT PRIMARY KEY,
  operator_id                 TEXT REFERENCES operator(id), -- NULL for a Ministry/portfolio cross-operator view
  metric_key                  TEXT NOT NULL,     -- e.g. 'verified_compliance_rate'
  metric_version              INTEGER NOT NULL,
  viewer_id                   TEXT NOT NULL REFERENCES person(id),
  viewer_requested_scope      JSONB NOT NULL,     -- what the viewer asked for
  effective_authorised_scope  JSONB NOT NULL,     -- what ReBAC actually clipped it to
  period_start                DATE NOT NULL,
  period_end                  DATE NOT NULL,
  as_of                       TIMESTAMPTZ,        -- NULL = operational/live mode; set = time-travel mode (Identity Spec §5)
  filters                     JSONB,
  numerator_value             NUMERIC,
  denominator_value           NUMERIC,            -- NULL for a plain count metric (e.g. overdue_load has no denominator)
  numerator_record_refs       JSONB NOT NULL DEFAULT '[]',
  denominator_record_refs     JSONB NOT NULL DEFAULT '[]',
  excluded_record_refs        JSONB NOT NULL DEFAULT '[]', -- [{ref, reason}, ...]
  source_watermarks           JSONB NOT NULL,     -- per-source last-processed-event pointer
  freshness                   dashboard_freshness NOT NULL,
  computed_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX manifest_viewer_idx ON metric_manifest (viewer_id, computed_at DESC);
CREATE INDEX manifest_metric_idx ON metric_manifest (metric_key, operator_id);
```

Every row here is permanent, not a cache — it's what makes "drill from a Ministry dashboard metric to the exact record, evidence, and source clause" (`feasibility-and-roadmap.md §4` step 10) a provable historical fact rather than a live-only computation that can't be reproduced if challenged later. Live dashboard tiles run the underlying query directly (cheap at prototype scale); a `metric_manifest` row is only written the moment a viewer actually drills in, exports, or the number enters a report.

### 5.2 The four compliance measures — exact formulas, `obligation_instance`-only, no new tables

```sql
-- eligible = due in period, excluding NOT_APPLICABLE and validly WAIVED
CREATE OR REPLACE FUNCTION eligible_instances(p_mine_id TEXT, p_period_end DATE)
RETURNS SETOF obligation_instance AS $$
  SELECT * FROM obligation_instance
  WHERE mine_id = p_mine_id AND due_on <= p_period_end
    AND status NOT IN ('NOT_APPLICABLE', 'WAIVED');
$$ LANGUAGE sql STABLE;

-- verified_compliance_rate = SATISFIED / eligible;  NULL (rendered '—') when eligible = 0, never 0% or 100%
CREATE OR REPLACE FUNCTION verified_compliance_rate(p_mine_id TEXT, p_period_end DATE)
RETURNS NUMERIC AS $$
  SELECT CASE WHEN COUNT(*) = 0 THEN NULL
    ELSE COUNT(*) FILTER (WHERE status = 'SATISFIED')::NUMERIC / COUNT(*) END
  FROM eligible_instances(p_mine_id, p_period_end);
$$ LANGUAGE sql STABLE;

-- submission_rate = (SUBMITTED + SATISFIED + EVIDENCE_MISMATCH) / eligible
CREATE OR REPLACE FUNCTION submission_rate(p_mine_id TEXT, p_period_end DATE)
RETURNS NUMERIC AS $$
  SELECT CASE WHEN COUNT(*) = 0 THEN NULL
    ELSE COUNT(*) FILTER (WHERE status IN ('SUBMITTED','SATISFIED','EVIDENCE_MISMATCH'))::NUMERIC / COUNT(*) END
  FROM eligible_instances(p_mine_id, p_period_end);
$$ LANGUAGE sql STABLE;

-- overdue_load = plain count, no denominator, never expressed as a rate
CREATE OR REPLACE FUNCTION overdue_load(p_mine_id TEXT, p_period_end DATE)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM eligible_instances(p_mine_id, p_period_end) WHERE status IN ('OVERDUE', 'ESCALATED');
$$ LANGUAGE sql STABLE;

-- unsupported_claim_load = plain count of CLAIMED_UNSUPPORTED reconciliation verdicts
CREATE OR REPLACE FUNCTION unsupported_claim_load(p_mine_id TEXT, p_period_end DATE)
RETURNS BIGINT AS $$
  SELECT COUNT(*) FROM obligation_instance
  WHERE mine_id = p_mine_id AND due_on <= p_period_end AND reconciliation = 'CLAIMED_UNSUPPORTED';
$$ LANGUAGE sql STABLE;
```

`NULL` (rendered `—` in UI, never `0%`/`100%`) is the correct zero-denominator answer — matches `dashboard-spec.md §2.3`'s explicit distinction between "no eligible instances" and "zero compliance." `DATA INCOMPLETE` and `NOT APPLICABLE`/hidden-for-unauthorised are UI-layer states over the same query, not separate stored values.

### 5.3 Required personal-queue summaries — all queries, no new tables

| Summary | Query |
|---|---|
| Due today | `obligation_instance` where `status IN ('UPCOMING','DUE')` and `due_on = current_date`, owner resolved via `resolve_responsible(obligation.owner_role, ...)` = viewer |
| Overdue on me | same resolution, `status IN ('OVERDUE','ESCALATED')` |
| Awaiting my verification | `obligation_instance.status='SUBMITTED'` or `capa.status='SUBMITTED'`, where viewer is a valid verifier per `PERMISSION_BY_SEVERITY` (Domain 1) and not the submitter |
| Awaiting my approval | `approval` where `decision='PENDING'` and `required_post_id` resolves to viewer |
| Pending sync | `evidence` where `synced_at IS NULL` — server-visible partial-sync state only; full offline queue depth is client-local (PowerSync), not server-queryable |
| Sync failures | `evidence` where `sync_error IS NOT NULL` |

### 5.4 Mine-level breakdowns — grouped queries over §1–§4 tables

Open findings by severity/age-band/category/regulator-flag → `finding` joined to `defect` (for age-band, via `defect_ageing_band_config`, §3.3) grouped by `severity`, `raised_by_regulator`. CAPA load buckets → `capa` grouped by `status`. Obligation calendar → `obligation_instance` grouped by `due_on`. Recurrence dimensions → `defect.recurrence_count` distribution. Process integrity, delivery health → `notification`/`approval` (§4.6) aggregate status. Data freshness → `metric_manifest.freshness` for the mine's most recent manifests. None of these need a new table — they're the same discipline as §5.2, applied per breakdown instead of per headline measure.

### 5.5 Corporate/portfolio altitude

Same functions as §5.2, called per-mine and aggregated, or with `p_mine_id` generalized to a mine-set from `effective_authorised_scope` — cross-mine and cross-operator (Ministry) comparison is a `GROUP BY mine_id` / `GROUP BY operator_id` over the same eligible-instance query, not a different data path. "Altitude" (personal/mine/portfolio) is determined by the viewer's `post`/`role_key` (Domain 1), not a stored dashboard-config table — there's nothing here for a person to configure, so nothing to persist.

---

## 6. Cross-Cutting: Audit Trail & Outbox

Implements: `identity-governance-spec.md §4` (hash-chained audit), `§5` (time-travel), `§6` (purpose-logged regulator access); `technical-design.md §6` (every material transaction writes domain change + audit event + outbox event atomically). Applies retroactively to every table in §1–§5 — this is why it's last, not first: it needed the full set of domain tables to exist before "apply the same trigger to all of them" meant anything concrete. No forward-reference problem, though — nothing in §1–§5 has an FK pointing at these tables, so this migration can run any time after they exist.

### 6.1 Design choices

- **One hash chain per operator, not one global chain.** Each tenant's audit trail is independently verifiable/exportable without exposing or depending on other tenants' events — consistent with the RLS/tenant-isolation discipline every other domain follows. Platform-level events (not tied to one operator) form their own chain with `operator_id IS NULL`.
- **`audit_event` (writes) is separate from `access_log` (reads).** A regulator reading a published record isn't a state change and has no before/after to chain — but `identity-governance-spec.md §6` still requires it logged with a purpose. Hash-chaining is the tamper-evidence mechanism for *changes*; reads just need an append-only "who looked at what, why, when."
- **`action`/`object_type` are open `TEXT`, not enums** — unlike every domain-specific vocabulary elsewhere in this doc, the audit action vocabulary grows with every future domain (a new table means new `<table>.created`/`<table>.updated` actions) and a hardcoded enum would need a migration on every addition, defeating the point of a uniform cross-cutting mechanism.
- **Generic trigger, not per-domain audit code.** One `emit_audit_and_outbox()` function attached to every table, rather than hand-writing an audit insert in application code for each of the ~35 tables above — a write that forgets to log itself is exactly the failure mode this mechanism exists to make impossible.

### 6.2 DDL

```sql
CREATE TYPE regulator_purpose AS ENUM (
  'ROUTINE_INSPECTION', 'ACCIDENT_ENQUIRY', 'COMPLAINT_FOLLOWUP', 'PERIODIC_RETURN_REVIEW', 'COURT_OF_INQUIRY'
);

-- 1. audit_event — hash-chained per operator (operator_id NULL = platform-level chain)
CREATE TABLE audit_event (
  id                    TEXT PRIMARY KEY,
  operator_id           TEXT REFERENCES operator(id),
  sequence_no           BIGINT NOT NULL,
  occurred_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  actor_person_id       TEXT REFERENCES person(id),      -- NULL for system/scheduled-job-initiated events
  actor_appointment_id  TEXT REFERENCES appointment(id), -- which appointment authorised the action, if any
  action                TEXT NOT NULL,  -- e.g. 'obligation.published', 'capa.updated' — open vocabulary, see §6.1
  object_type           TEXT NOT NULL,
  object_id             TEXT NOT NULL,
  before                JSONB,
  after                 JSONB,
  reason                TEXT,
  purpose               regulator_purpose,
  source                TEXT NOT NULL,  -- 'api' | 'worker:<name>' | 'scheduled_job:<name>'
  prev_hash             TEXT,           -- NULL only for sequence_no = 1 in this operator's chain
  hash                  TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (operator_id, sequence_no)
);
CREATE INDEX audit_object_idx ON audit_event (object_type, object_id);
CREATE INDEX audit_operator_time_idx ON audit_event (operator_id, occurred_at);

-- chain-append trigger: computes sequence_no/prev_hash/hash atomically, serialized per operator via row lock
CREATE OR REPLACE FUNCTION audit_chain_append() RETURNS trigger AS $$
DECLARE
  last_hash TEXT;
  last_seq  BIGINT;
BEGIN
  SELECT hash, sequence_no INTO last_hash, last_seq
  FROM audit_event
  WHERE operator_id IS NOT DISTINCT FROM NEW.operator_id
  ORDER BY sequence_no DESC LIMIT 1
  FOR UPDATE;

  NEW.sequence_no := COALESCE(last_seq, 0) + 1;
  NEW.prev_hash := last_hash;
  NEW.hash := encode(sha256(convert_to(
    COALESCE(NEW.prev_hash, '') || NEW.id || NEW.action || NEW.object_type || NEW.object_id ||
    COALESCE(NEW.before::text, '') || COALESCE(NEW.after::text, '') || NEW.occurred_at::text,
    'UTF8'
  )), 'hex');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_event_chain BEFORE INSERT ON audit_event
  FOR EACH ROW EXECUTE FUNCTION audit_chain_append();

-- 2. outbox_event — durable, at-least-once, consumers idempotent on id
CREATE TABLE outbox_event (
  id                TEXT PRIMARY KEY,
  aggregate_type    TEXT NOT NULL,
  aggregate_id      TEXT NOT NULL,
  event_type        TEXT NOT NULL,
  payload           JSONB NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at      TIMESTAMPTZ,
  publish_attempts  INTEGER NOT NULL DEFAULT 0,
  last_error        TEXT
);
CREATE INDEX outbox_unpublished_idx ON outbox_event (created_at) WHERE published_at IS NULL;

-- 3. access_log — regulator purpose-logged reads (append-only, not hash-chained — see §6.1)
CREATE TABLE access_log (
  id               TEXT PRIMARY KEY,
  operator_id      TEXT REFERENCES operator(id),
  actor_person_id  TEXT NOT NULL REFERENCES person(id),
  purpose          regulator_purpose NOT NULL,
  object_type      TEXT NOT NULL,
  object_id        TEXT NOT NULL,
  granted          BOOLEAN NOT NULL, -- authorization-spec.md §8's regulator_read() wrapper already passes
    -- granted=allowed into its audit write ("log denials too") — this column was missing, every row
    -- was silently assumed granted with nowhere for a denied attempt to go
  accessed_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX access_log_object_idx ON access_log (object_type, object_id);
CREATE INDEX access_log_denied_idx ON access_log (actor_person_id, accessed_at) WHERE granted = false;

-- generic emit trigger, attached to every table in §1–§5 (and every future domain table)
CREATE OR REPLACE FUNCTION emit_audit_and_outbox() RETURNS trigger AS $$
DECLARE
  v_operator_id TEXT;
BEGIN
  v_operator_id := COALESCE(NEW.operator_id, OLD.operator_id); -- NULL-safe on the handful of not-operator-scoped tables

  INSERT INTO audit_event (id, operator_id, actor_person_id, actor_appointment_id, action, object_type, object_id, before, after, source)
  VALUES (
    generate_ulid('audit'), -- app-side ID generation convention, §0
    v_operator_id,
    NULLIF(current_setting('app.actor_person_id', true), ''),
    NULLIF(current_setting('app.actor_appointment_id', true), ''),
    TG_TABLE_NAME || '.' || lower(TG_OP),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    CASE WHEN TG_OP IN ('DELETE','UPDATE') THEN to_jsonb(OLD) END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) END,
    NULLIF(current_setting('app.request_source', true), '')
  );

  INSERT INTO outbox_event (id, aggregate_type, aggregate_id, event_type, payload)
  VALUES (
    generate_ulid('outbox'),
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id),
    TG_TABLE_NAME || '.' || lower(TG_OP),
    jsonb_build_object('before', to_jsonb(OLD), 'after', to_jsonb(NEW))
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- wired up in a final migration, once every domain table exists — one line per table, e.g.:
CREATE TRIGGER audit_outbox AFTER INSERT OR UPDATE ON appointment
  FOR EACH ROW EXECUTE FUNCTION emit_audit_and_outbox();
-- ... repeated identically for every table in §1–§5 (omitted here for brevity, same convention as
-- set_updated_at() in §0 — one shared function, attached everywhere the same way)
```

`current_setting('app.actor_person_id', true)` / `app.actor_appointment_id` / `app.request_source` are session variables the API layer sets at the start of each request (`SET LOCAL app.actor_person_id = '...'`) — this is how the trigger knows *who* is acting without every single `INSERT`/`UPDATE` statement having to pass it explicitly.

### 6.3 Time-travel (`as_of`) — replay, not snapshot

Matches `identity-governance-spec.md §5.3`'s explicit framing: reconstruction is a replay of audit events, never a stored point-in-time snapshot.

```sql
CREATE OR REPLACE FUNCTION state_as_of(p_object_type TEXT, p_object_id TEXT, p_as_of TIMESTAMPTZ)
RETURNS JSONB AS $$
  SELECT after FROM audit_event
  WHERE object_type = p_object_type AND object_id = p_object_id AND occurred_at <= p_as_of
  ORDER BY occurred_at DESC, sequence_no DESC LIMIT 1;
$$ LANGUAGE sql STABLE;
```

This is what backs `metric_manifest.as_of` (§5.1) — an as-of dashboard query calls `state_as_of()` per relevant object instead of querying the live table directly, reconstructing exactly what was true at that moment from the chain rather than trusting a cache that may have since diverged.

### 6.4 What this closes out

Every forward-reference and deferral flagged in §1–§5 is now resolved:
- BF-10 (append-only audit trail, P0) — done via `audit_event`.
- `dashboard-spec.md`'s `as_of` time-travel mode (§5.1) — done via `state_as_of()`.
- `identity-governance-spec.md §6` regulator purpose-logged access — done via `access_log`.
- The "connects facts to people" mechanism implied but not built in §4.6 (`notification` rows didn't have a clear trigger source before) — now: a worker consumes `outbox_event` rows, evaluates workflow rules, and creates `notification` rows from them. §4.6's tables are the *output* of that consumption, not written directly by application code.

The data model is now complete across all 5 domains plus this cross-cutting layer.

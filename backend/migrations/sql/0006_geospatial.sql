-- 0006_geospatial.sql — governed geometry versions, spatial layers, policies,
-- evaluations, map compositions. Implements the v0.01 slice of
-- geospatial-data-model.md: sources/imports/topology/surface models are
-- v0.02+ (mine boundaries and geofences are seeded through migration data,
-- not an import pipeline).
--
-- Invariants kept here:
--   * a published geometry version is immutable; change = new version +
--     supersession, never UPDATE of the geometry;
--   * evaluation outcomes are never rewritten — re-evaluation/override append;
--   * every evaluation names its exact target version, policy version,
--     algorithm and transformation.

CREATE TYPE geometry_kind            AS ENUM ('POINT', 'LINE', 'POLYGON', 'MULTIPOLYGON');
CREATE TYPE spatial_layer_class     AS ENUM ('LEGAL', 'APPROVED_PLAN', 'OPERATIONAL', 'ENVIRONMENTAL', 'SAFETY');
CREATE TYPE geometry_version_status AS ENUM ('DRAFT', 'UNDER_REVIEW', 'PUBLISHED', 'SUPERSEDED', 'WITHDRAWN');
CREATE TYPE spatial_eval_outcome    AS ENUM ('WITHIN', 'OUTSIDE', 'INTERSECTS', 'INDETERMINATE', 'ERROR');
CREATE TYPE composition_status      AS ENUM ('DRAFT', 'PUBLISHED', 'SUPERSEDED', 'WITHDRAWN');

-- CRS catalogue — platform reference data, not tenant-scoped.
CREATE TABLE spatial_reference_system_profile (
  id               TEXT PRIMARY KEY,
  code             TEXT NOT NULL UNIQUE,     -- 'EPSG:4326', 'EPSG:32644', ...
  name             TEXT NOT NULL,
  srid             INTEGER NOT NULL,
  axis_order       TEXT NOT NULL DEFAULT 'LON_LAT',
  unit             TEXT NOT NULL DEFAULT 'DEGREE',
  vertical_datum   TEXT,
  area_of_use      TEXT,
  valid_from       TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until      TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stable layer identity: geometry kind, purpose, classification, style.
-- Legal, approved-plan, operational, environmental and safety geometries use
-- distinct layer classes — never merged.
CREATE TABLE spatial_layer_definition (
  id                  TEXT PRIMARY KEY,
  tenant_id           TEXT REFERENCES tenant(id),   -- NULL = platform layer catalogue
  code                TEXT NOT NULL,
  name                TEXT NOT NULL,
  geometry_kind       geometry_kind NOT NULL,
  layer_class         spatial_layer_class NOT NULL,
  purpose             TEXT NOT NULL,                -- 'LEASE_BOUNDARY' | 'GEOFENCE' | 'HAUL_ROAD' | ...
  classification      TEXT NOT NULL DEFAULT 'INTERNAL',  -- authorization class applied before query/tile/export
  allowed_dimensions  TEXT NOT NULL DEFAULT '2D',
  schema_version      INTEGER NOT NULL DEFAULT 1,
  style               JSONB NOT NULL DEFAULT '{}'::jsonb,
  active              BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code)
);

-- Stable purpose-specific geometry identity for one target.
CREATE TABLE governed_geometry (
  id                    TEXT PRIMARY KEY,
  tenant_id             TEXT NOT NULL REFERENCES tenant(id),
  layer_definition_id   TEXT NOT NULL REFERENCES spatial_layer_definition(id),
  purpose               TEXT NOT NULL,
  target_type           TEXT NOT NULL,       -- 'MINE' | 'SUBUNIT' | 'ASSET'
  mine_id               TEXT NOT NULL REFERENCES mine(id),
  subunit_id            TEXT REFERENCES subunit(id),
  asset_id              TEXT REFERENCES asset(id),
  code                  TEXT,
  name                  TEXT NOT NULL,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (target_type = 'MINE'    AND subunit_id IS NULL     AND asset_id IS NULL) OR
    (target_type = 'SUBUNIT' AND subunit_id IS NOT NULL AND asset_id IS NULL) OR
    (target_type = 'ASSET'   AND asset_id   IS NOT NULL)
  )
);
CREATE INDEX governed_geometry_mine_idx ON governed_geometry (mine_id);
CREATE INDEX governed_geometry_layer_idx ON governed_geometry (layer_definition_id);

-- Immutable version: source geometry as received + normalized WGS84 copy,
-- CRS/transformation, accuracy/method, effective interval, publication.
CREATE TABLE governed_geometry_version (
  id                        TEXT PRIMARY KEY,
  governed_geometry_id      TEXT NOT NULL REFERENCES governed_geometry(id),
  version_no                INTEGER NOT NULL,
  source_geometry           JSONB NOT NULL,      -- verbatim as received (GeoJSON + declared CRS)
  source_srs_profile_id     TEXT REFERENCES spatial_reference_system_profile(id),
  transformation_ref        TEXT,                -- mandatory when source and normalized differ
  normalized_geometry       geography NOT NULL,  -- canonical WGS84 (any subtype per layer kind)
  dimensionality            TEXT NOT NULL DEFAULT '2D',
  accuracy_m                NUMERIC(10,2),
  capture_method            TEXT,                -- 'DGPS_SURVEY' | 'DIGITIZED' | 'IMPORTED' | 'SEEDED'
  effective_from            TIMESTAMPTZ NOT NULL,
  effective_until           TIMESTAMPTZ,
  status                    geometry_version_status NOT NULL DEFAULT 'DRAFT',
  published_at              TIMESTAMPTZ,
  published_by_appointment_id TEXT REFERENCES appointment(id),  -- reviewer authority
  superseded_by_id          TEXT REFERENCES governed_geometry_version(id),
  withdrawn_at              TIMESTAMPTZ,
  withdraw_reason           TEXT,
  source_document_id        TEXT REFERENCES document(id),
  row_version               INTEGER NOT NULL DEFAULT 1,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (governed_geometry_id, version_no),
  CHECK (status <> 'PUBLISHED' OR published_at IS NOT NULL)
);
CREATE INDEX ggv_geometry_gix ON governed_geometry_version USING GIST (normalized_geometry);
-- published versions of one geometry cannot overlap in effective time
ALTER TABLE governed_geometry_version ADD CONSTRAINT ggv_no_published_overlap
  EXCLUDE USING gist (
    governed_geometry_id WITH =,
    tstzrange(effective_from, effective_until) WITH &&
  ) WHERE (status = 'PUBLISHED');

-- Purpose/target-kind predicate + tolerance rules the closure gate evaluates
-- against (geofence radius, boundary semantics, override policy).
CREATE TABLE spatial_policy_version (
  id               TEXT PRIMARY KEY,
  code             TEXT NOT NULL,
  version_no       INTEGER NOT NULL,
  purpose          TEXT NOT NULL,             -- 'EVIDENCE_GEOFENCE' | 'LEASE_CONTAINMENT' | ...
  target_kind      TEXT NOT NULL,
  predicate        TEXT NOT NULL,             -- 'ST_DWithin' | 'ST_Within' | 'ST_Intersects'
  tolerance_m      NUMERIC(10,2),
  accuracy_rule    JSONB NOT NULL DEFAULT '{}'::jsonb,
  vertical_rule    JSONB,
  override_policy  JSONB NOT NULL DEFAULT '{}'::jsonb,
  effective_from   TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code, version_no)
);

-- Immutable evaluation record: subject vs a target geometry version under a
-- policy version. Re-evaluation appends a new row; override appends below.
CREATE TABLE spatial_evaluation (
  id                          TEXT PRIMARY KEY,
  tenant_id                   TEXT NOT NULL REFERENCES tenant(id),
  subject_type                TEXT NOT NULL,     -- 'evidence' | 'observation' | ...
  subject_id                  TEXT NOT NULL,
  target_geometry_version_id  TEXT NOT NULL REFERENCES governed_geometry_version(id),
  policy_version_id           TEXT NOT NULL REFERENCES spatial_policy_version(id),
  analysis_srid               INTEGER NOT NULL DEFAULT 4326,
  transformation_ref          TEXT,
  algorithm                   TEXT NOT NULL,
  outcome                     spatial_eval_outcome NOT NULL,
  distance_m                  NUMERIC(12,2),
  measured_values             JSONB NOT NULL DEFAULT '{}'::jsonb,
  uncertainty_m               NUMERIC(10,2),
  evaluated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX spatial_eval_subject_idx ON spatial_evaluation (subject_type, subject_id);
CREATE INDEX spatial_eval_target_idx ON spatial_evaluation (target_geometry_version_id);

ALTER TABLE evidence_verification_attempt ADD CONSTRAINT verification_spatial_eval_fk
  FOREIGN KEY (spatial_evaluation_id) REFERENCES spatial_evaluation(id);

CREATE TABLE spatial_evaluation_override (
  id                      TEXT PRIMARY KEY,
  evaluation_id           TEXT NOT NULL REFERENCES spatial_evaluation(id),
  decision                TEXT NOT NULL,        -- 'APPROVED' | 'REJECTED' | 'WITHDRAWN'
  decided_by_person_id    TEXT NOT NULL REFERENCES person(id),
  decided_by_appointment_id TEXT REFERENCES appointment(id),
  reason                  TEXT NOT NULL,
  scope                   JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence_id             TEXT REFERENCES evidence(id),
  decided_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- The mine map: a versioned set of layer-version references + style +
-- projection. Features ride GET /map-compositions/{id}?expand=features.
CREATE TABLE map_composition_version (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT NOT NULL REFERENCES tenant(id),
  code           TEXT NOT NULL,
  version_no     INTEGER NOT NULL,
  title          TEXT NOT NULL,
  mine_id        TEXT REFERENCES mine(id),     -- NULL = portfolio composition
  layer_manifest JSONB NOT NULL,               -- [{layer_definition_id, geometry_version_ids | 'current', filters}]
  filters        JSONB NOT NULL DEFAULT '{}'::jsonb,
  as_of          TIMESTAMPTZ,                  -- temporal composition
  style          JSONB NOT NULL DEFAULT '{}'::jsonb,
  projection     TEXT NOT NULL DEFAULT 'EPSG:3857',
  status         composition_status NOT NULL DEFAULT 'DRAFT',
  published_at   TIMESTAMPTZ,
  row_version    INTEGER NOT NULL DEFAULT 1,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, code, version_no)
);
CREATE INDEX map_composition_mine_idx ON map_composition_version (mine_id);

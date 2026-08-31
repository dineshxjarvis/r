-- 0005_defects_evidence.sql — observation → defect → finding → CAPA pipeline
-- plus offline field evidence with per-device hash chain and the closure gate.
-- Backs: CAPA management, photo + observation, geo-tagged inspection,
-- offline sync, and the DISTANCE_MISMATCH closure block.
--
-- Order inside this file matters: defect ← observation, finding, capa,
-- then evidence (references capa/defect/obligation_instance), then the
-- verification attempts, then the deferred FKs from 0003/0004.

CREATE TYPE observation_source_type AS ENUM ('FIELD_ENTRY', 'INSPECTION_RESPONSE', 'DOCUMENT_EXTRACTION', 'ESCALATED_INSTANCE');
CREATE TYPE match_decision          AS ENUM ('PENDING', 'MATCHED_EXISTING', 'NEW_DEFECT');
CREATE TYPE defect_status           AS ENUM ('OPEN', 'UNDER_ACTION', 'CLOSED', 'RECURRED');
CREATE TYPE finding_status          AS ENUM ('OPEN', 'CAPA_ASSIGNED', 'PENDING_VERIFICATION', 'CLOSED', 'REOPENED');
CREATE TYPE capa_status             AS ENUM ('OPEN', 'IN_PROGRESS', 'SUBMITTED', 'VERIFIED_CLOSED', 'REOPENED');
CREATE TYPE capture_path            AS ENUM ('DIRECT', 'IMPORTED');
CREATE TYPE evidence_media_type     AS ENUM ('PHOTO', 'VIDEO', 'AUDIO', 'FORM_ONLY');
CREATE TYPE evidence_verdict        AS ENUM ('VERIFIED', 'PLAUSIBLE', 'UNVERIFIED', 'SUSPECT');
CREATE TYPE verification_outcome    AS ENUM (
  'ACCEPTED', 'ACCEPTED_WITH_OVERRIDE',
  'BLOCKED_SUSPECT_EVIDENCE', 'BLOCKED_ALL_UNVERIFIED', 'BLOCKED_DISTANCE_MISMATCH',
  'BLOCKED_METADATA_TAMPERED', 'BLOCKED_SELF_VERIFICATION', 'REJECTED_OTHER'
);

-- ---------------------------------------------------------------------------
-- Defect: one physical condition; many observations resolve to one row.
-- Recurrence reopens the SAME row — first_observed_on is the immutable
-- ageing anchor, never reset.
-- ---------------------------------------------------------------------------
CREATE TABLE defect (
  id                 TEXT PRIMARY KEY,
  tenant_id          TEXT NOT NULL REFERENCES tenant(id),
  mine_id            TEXT NOT NULL REFERENCES mine(id),
  at_subunit_id      TEXT REFERENCES subunit(id),
  at_asset_id        TEXT REFERENCES asset(id),
  title              TEXT NOT NULL,
  description        TEXT NOT NULL,
  status             defect_status NOT NULL DEFAULT 'OPEN',
  current_severity   severity NOT NULL,
  first_observed_on  DATE NOT NULL,
  recurrence_count   INTEGER NOT NULL DEFAULT 0,
  last_recurred_at   TIMESTAMPTZ,
  row_version        INTEGER NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX defect_mine_status_idx ON defect (mine_id, status);
CREATE INDEX defect_ageing_idx ON defect (first_observed_on)
  WHERE status IN ('OPEN', 'UNDER_ACTION', 'RECURRED');

-- Ageing-band thresholds per severity — platform default (tenant NULL) +
-- per-tenant override. Band computed at query time so a config change
-- reflects immediately, no backfill.
CREATE TABLE defect_ageing_band_config (
  id               TEXT PRIMARY KEY,
  tenant_id        TEXT REFERENCES tenant(id),
  severity         severity NOT NULL,
  low_max_days     INTEGER NOT NULL,
  medium_max_days  INTEGER NOT NULL,
  high_max_days    INTEGER NOT NULL,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (low_max_days < medium_max_days AND medium_max_days < high_max_days)
);
CREATE UNIQUE INDEX ageing_default_unique ON defect_ageing_band_config (severity) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX ageing_override_unique ON defect_ageing_band_config (tenant_id, severity) WHERE tenant_id IS NOT NULL;

INSERT INTO defect_ageing_band_config (id, tenant_id, severity, low_max_days, medium_max_days, high_max_days) VALUES
  ('dabc_01J0000000000000000000AG01', NULL, 'MINOR',       7, 15, 30),
  ('dabc_01J0000000000000000000AG02', NULL, 'SIGNIFICANT', 7, 15, 30),
  ('dabc_01J0000000000000000000AG03', NULL, 'SEVERE',      5, 10, 20);

-- ---------------------------------------------------------------------------
-- Observation: a raw sighting from field entry, an inspection response, a
-- document extraction, or an escalated obligation instance. A human always
-- confirms defect matching; embeddings only narrow candidates.
-- id is client-generated for offline capture.
-- ---------------------------------------------------------------------------
CREATE TABLE observation (
  id                       TEXT PRIMARY KEY,     -- client-generated ULID for FIELD_ENTRY
  tenant_id                TEXT NOT NULL REFERENCES tenant(id),
  mine_id                  TEXT NOT NULL REFERENCES mine(id),
  source_type              observation_source_type NOT NULL,
  source_extraction_id     TEXT REFERENCES extraction(id),
  source_instance_id       TEXT REFERENCES obligation_instance(id),
  inspection_id            TEXT REFERENCES inspection(id),
  inspection_visit_id      TEXT REFERENCES inspection_visit(id),
  inspection_response_id   TEXT REFERENCES inspection_response(id),
  reported_by_person_id    TEXT REFERENCES person(id),
  reporting_appointment_id TEXT REFERENCES appointment(id),  -- immutable authority provenance
  issuing_authority_id     TEXT REFERENCES regulatory_authority(id),  -- set when raised by a regulator
  at_subunit_id            TEXT REFERENCES subunit(id),
  at_asset_id              TEXT REFERENCES asset(id),
  description              TEXT NOT NULL,
  raised_severity          severity NOT NULL,
  normalised_severity      severity NOT NULL,
  observed_at              TIMESTAMPTZ NOT NULL,
  location                 geography(Point, 4326),
  matched_defect_id        TEXT REFERENCES defect(id),
  match_decision           match_decision NOT NULL DEFAULT 'PENDING',
  match_decision_by_person_id TEXT REFERENCES person(id),
  match_decision_at        TIMESTAMPTZ,
  row_version              INTEGER NOT NULL DEFAULT 1,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (source_type = 'DOCUMENT_EXTRACTION'  AND source_extraction_id IS NOT NULL) OR
    (source_type = 'ESCALATED_INSTANCE'   AND source_instance_id   IS NOT NULL) OR
    (source_type = 'INSPECTION_RESPONSE'  AND inspection_response_id IS NOT NULL) OR
    (source_type = 'FIELD_ENTRY'          AND source_extraction_id IS NULL AND source_instance_id IS NULL)
  ),
  CHECK (match_decision = 'PENDING' OR matched_defect_id IS NOT NULL)
);
CREATE INDEX observation_mine_idx ON observation (mine_id, match_decision);
CREATE INDEX observation_defect_idx ON observation (matched_defect_id);
CREATE INDEX observation_inspection_idx ON observation (inspection_id);
CREATE INDEX observation_location_gix ON observation USING GIST (location);

-- Candidate generation for "many observations → one defect" — similarity
-- narrows candidates, never auto-merges.
CREATE TABLE observation_embedding (
  id              TEXT PRIMARY KEY,
  observation_id  TEXT NOT NULL REFERENCES observation(id),
  model_version   TEXT NOT NULL,
  embedding       vector(1536) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (observation_id, model_version)
);
CREATE INDEX observation_embedding_hnsw ON observation_embedding
  USING hnsw (embedding vector_cosine_ops);

-- ---------------------------------------------------------------------------
-- Finding: a confirmed breach of a specific requirement. Two nullable origin
-- FKs (physical defect / escalated instance); at least one set. Which rule
-- was broken is never optional. Regulator-issued findings carry structured
-- issuing provenance — never a boolean.
-- ---------------------------------------------------------------------------
CREATE TABLE finding (
  id                         TEXT PRIMARY KEY,
  tenant_id                  TEXT NOT NULL REFERENCES tenant(id),
  mine_id                    TEXT NOT NULL REFERENCES mine(id),
  defect_id                  TEXT REFERENCES defect(id),
  obligation_instance_id     TEXT REFERENCES obligation_instance(id),
  requirement_obligation_id  TEXT NOT NULL REFERENCES obligation(id),
  severity                   severity NOT NULL,
  raised_by_person_id        TEXT REFERENCES person(id),
  issuing_authority_id       TEXT REFERENCES regulatory_authority(id),
  issuing_authority_unit_id  TEXT REFERENCES authority_unit(id),
  issuing_appointment_id     TEXT REFERENCES appointment(id),
  responsible_organization_id TEXT REFERENCES organization(id),  -- NULL = operator itself
  status                     finding_status NOT NULL DEFAULT 'OPEN',
  row_version                INTEGER NOT NULL DEFAULT 1,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (defect_id IS NOT NULL OR obligation_instance_id IS NOT NULL)
);
CREATE INDEX finding_defect_idx ON finding (defect_id);
CREATE INDEX finding_instance_idx ON finding (obligation_instance_id);
CREATE INDEX finding_tenant_status_idx ON finding (tenant_id, status);
CREATE INDEX finding_mine_idx ON finding (mine_id, status);

ALTER TABLE obligation_instance ADD CONSTRAINT instance_finding_fk
  FOREIGN KEY (finding_id) REFERENCES finding(id);

-- ---------------------------------------------------------------------------
-- CAPA: corrective + preventive action against one finding. Deadline
-- extension is a first-class audited act (counter + last event), never a
-- bare UPDATE to due_on. No self-verification, enforced in the table.
-- ---------------------------------------------------------------------------
CREATE TABLE capa (
  id                     TEXT PRIMARY KEY,
  tenant_id              TEXT NOT NULL REFERENCES tenant(id),
  finding_id             TEXT NOT NULL REFERENCES finding(id),
  mine_id                TEXT NOT NULL REFERENCES mine(id),
  corrective_action      TEXT NOT NULL,
  preventive_action      TEXT NOT NULL,
  assigned_to_person_id  TEXT REFERENCES person(id),
  assigned_at            TIMESTAMPTZ,
  due_on                 DATE,
  status                 capa_status NOT NULL DEFAULT 'OPEN',
  submitted_by_person_id TEXT REFERENCES person(id),
  submitted_at           TIMESTAMPTZ,
  verified_by_person_id  TEXT REFERENCES person(id),
  verified_at            TIMESTAMPTZ,
  rejection_reason       TEXT,
  extension_count        INTEGER NOT NULL DEFAULT 0,
  last_extension_reason  TEXT,
  last_extended_at       TIMESTAMPTZ,
  row_version            INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (verified_by_person_id IS NULL OR submitted_by_person_id IS NULL
         OR verified_by_person_id <> submitted_by_person_id),
  CHECK (verified_by_person_id IS NULL OR assigned_to_person_id IS NULL
         OR verified_by_person_id <> assigned_to_person_id)
);
CREATE INDEX capa_finding_idx ON capa (finding_id);
CREATE INDEX capa_tenant_status_idx ON capa (tenant_id, status);
CREATE INDEX capa_assignee_idx ON capa (assigned_to_person_id, status);
CREATE INDEX capa_due_idx ON capa (due_on) WHERE status IN ('OPEN', 'IN_PROGRESS', 'REOPENED');

-- ---------------------------------------------------------------------------
-- Evidence: one captured record. ID IS CLIENT-GENERATED (offline capture →
-- sync is an idempotent upsert; never reassigned server-side).
-- verdict = intrinsic capture trustworthiness, computed once at sync,
-- never mutated — an override is a separate verification-attempt record.
-- Per-device hash chain: (device_id, chain_sequence) unique, prev_hash links.
-- ---------------------------------------------------------------------------
CREATE TABLE evidence (
  id                        TEXT PRIMARY KEY,          -- client-generated ULID
  tenant_id                 TEXT NOT NULL REFERENCES tenant(id),
  mine_id                   TEXT NOT NULL REFERENCES mine(id),
  captured_by_person_id     TEXT NOT NULL REFERENCES person(id),
  capture_appointment_id    TEXT REFERENCES appointment(id),  -- authority held at capture time
  -- capture-time primary target (≤1). The broader verification-time set is
  -- obligation_evidence_link / evidence_verification_attempt.
  for_instance_id           TEXT REFERENCES obligation_instance(id),
  for_capa_id               TEXT REFERENCES capa(id),
  for_defect_id             TEXT REFERENCES defect(id),
  for_observation_id        TEXT REFERENCES observation(id),
  capture_path              capture_path NOT NULL,
  media_type                evidence_media_type NOT NULL,
  -- content-addressed object pointer
  content_hash              TEXT NOT NULL,
  storage_bucket            TEXT NOT NULL,
  storage_key               TEXT NOT NULL,
  byte_size                 BIGINT NOT NULL,
  content_type              TEXT NOT NULL,
  client_schema_version     INTEGER NOT NULL DEFAULT 1,  -- offline client's record schema at capture
  -- per-device hash chain
  device_id                 TEXT NOT NULL,
  chain_sequence            INTEGER NOT NULL,
  prev_hash                 TEXT,                      -- NULL only for a device's first row
  device_integrity_verdict  JSONB,                     -- raw attestation response
  -- location
  location                  geography(Point, 4326),
  location_accuracy_m       NUMERIC(8,2),
  location_provider         TEXT,
  satellites_used           INTEGER,
  constellations            TEXT[],
  is_mock_location          BOOLEAN NOT NULL DEFAULT false,
  -- three clocks
  captured_at_wall          TIMESTAMPTZ NOT NULL,      -- untrusted device wall clock
  captured_at_monotonic_ns  BIGINT,                    -- trusted within one boot
  verified_window_start     TIMESTAMPTZ,               -- offline capture → interval, not instant
  verified_window_end       TIMESTAMPTZ,
  server_received_at        TIMESTAMPTZ,               -- authoritative anchor, set on sync
  -- intrinsic outcome
  verdict                   evidence_verdict NOT NULL,
  verdict_reasons           JSONB NOT NULL DEFAULT '[]'::jsonb,
  at_subunit_id             TEXT REFERENCES subunit(id),
  at_asset_id               TEXT REFERENCES asset(id),
  synced_at                 TIMESTAMPTZ,
  sync_error                TEXT,
  row_version               INTEGER NOT NULL DEFAULT 1,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (device_id, chain_sequence),
  CHECK (capture_path = 'DIRECT' OR verdict <> 'VERIFIED'),  -- IMPORTED caps at UNVERIFIED
  CHECK (num_nonnulls(for_instance_id, for_capa_id, for_defect_id, for_observation_id) <= 1)
);
CREATE INDEX evidence_mine_idx ON evidence (mine_id);
CREATE INDEX evidence_captured_by_idx ON evidence (captured_by_person_id);
CREATE INDEX evidence_location_gix ON evidence USING GIST (location);
CREATE INDEX evidence_for_capa_idx ON evidence (for_capa_id) WHERE for_capa_id IS NOT NULL;
CREATE INDEX evidence_for_instance_idx ON evidence (for_instance_id) WHERE for_instance_id IS NOT NULL;
CREATE INDEX evidence_pending_sync_idx ON evidence (tenant_id) WHERE synced_at IS NULL;

-- One attempt to use evidence to close a CAPA or verify an instance — every
-- call, blocked or accepted, writes one row. The blocked DISTANCE_MISMATCH
-- and the later success are both permanently queryable.
CREATE TABLE evidence_verification_attempt (
  id                      TEXT PRIMARY KEY,
  tenant_id               TEXT NOT NULL REFERENCES tenant(id),
  capa_id                 TEXT REFERENCES capa(id),
  obligation_instance_id  TEXT REFERENCES obligation_instance(id),
  evidence_id             TEXT NOT NULL REFERENCES evidence(id),
  attempted_by_person_id  TEXT NOT NULL REFERENCES person(id),
  attempted_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  spatial_evaluation_id   TEXT,            -- FK → spatial_evaluation added in 0006
  distance_m              NUMERIC(10,2),
  geofence_radius_m       NUMERIC(10,2),
  within_geofence         BOOLEAN,
  outcome                 verification_outcome NOT NULL,
  reason_detail           JSONB,
  override_by_person_id   TEXT REFERENCES person(id),
  override_appointment_id TEXT REFERENCES appointment(id),
  override_reason         TEXT,
  CHECK (num_nonnulls(capa_id, obligation_instance_id) = 1),
  CHECK ((outcome = 'ACCEPTED_WITH_OVERRIDE') = (override_by_person_id IS NOT NULL))
);
CREATE INDEX verification_capa_idx ON evidence_verification_attempt (capa_id);
CREATE INDEX verification_instance_idx ON evidence_verification_attempt (obligation_instance_id);
CREATE INDEX verification_evidence_idx ON evidence_verification_attempt (evidence_id);

-- Deferred evidence FKs from 0003/0004:
ALTER TABLE obligation_evidence_link ADD CONSTRAINT evidence_link_evidence_fk
  FOREIGN KEY (evidence_id) REFERENCES evidence(id);
ALTER TABLE inspection_visit_attendance ADD CONSTRAINT visit_attendance_evidence_fk
  FOREIGN KEY (evidence_id) REFERENCES evidence(id);
ALTER TABLE inspection_access_event ADD CONSTRAINT access_event_evidence_fk
  FOREIGN KEY (evidence_id) REFERENCES evidence(id);
ALTER TABLE inspection_response_evidence ADD CONSTRAINT response_evidence_evidence_fk
  FOREIGN KEY (evidence_id) REFERENCES evidence(id);

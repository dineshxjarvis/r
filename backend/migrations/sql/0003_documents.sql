-- 0003_documents.sql — document pipeline, extraction, obligation register.
-- Backs: compliance tracking + regulatory change impact intelligence.
-- Lane A: document → OCR → segments → extractions → obligations →
-- per-mine obligation_instances → conflicts.
--
-- Recall-first triage: surface threshold low, nothing auto-publishes.
-- Original bytes are content-addressed in object storage; the row exists
-- only after hash verification (two-phase upload via `upload`).

CREATE TYPE upload_purpose     AS ENUM ('DOCUMENT_ORIGINAL', 'EVIDENCE_CAPTURE');
CREATE TYPE upload_status      AS ENUM ('PENDING', 'VERIFIED', 'FAILED', 'CONSUMED', 'EXPIRED');
CREATE TYPE doc_class          AS ENUM (
  'REGULATOR_ISSUANCE', 'EC_COMPLIANCE_REPORT', 'INSPECTION_REPORT',
  'ACCIDENT_NOTICE', 'CONTRACTOR_DOC', 'APPOINTMENT_INSTRUMENT', 'OTHER'
);
CREATE TYPE document_status    AS ENUM (
  'UPLOADED', 'PROCESSING', 'NEEDS_REVIEW', 'PUBLISHED', 'SIGNED',
  'FAILED', 'REJECTED', 'QUARANTINED', 'SUPERSEDED', 'WITHDRAWN'
);
CREATE TYPE pipeline_stage     AS ENUM ('OCR', 'CLASSIFY', 'SEGMENT', 'EXTRACT');
CREATE TYPE job_status         AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED');
CREATE TYPE extraction_type    AS ENUM ('OBLIGATION', 'CLAIMED_STATUS', 'OBSERVATION', 'INCIDENT', 'CONTRACTOR', 'EVIDENCE');
CREATE TYPE extraction_status  AS ENUM ('PROPOSED', 'ACCEPTED', 'EDITED', 'REJECTED', 'SPLIT', 'MERGED', 'MARKED_NOT_APPLICABLE');
CREATE TYPE deontic            AS ENUM ('OBLIGATION', 'PROHIBITION', 'PERMISSION', 'RECOMMENDATION');
CREATE TYPE periodicity        AS ENUM ('ONE_TIME', 'MONTHLY', 'QUARTERLY', 'SIX_MONTHLY', 'ANNUAL', 'CONTINUOUS');
CREATE TYPE due_rule_kind      AS ENUM ('END_OF_PERIOD', 'FIXED_DATES', 'OFFSET_FROM_PERIOD_END', 'OFFSET_FROM_EVENT', 'CONTINUOUS', 'ON_DEMAND', 'UNRESOLVED');
CREATE TYPE obligation_source_scope AS ENUM ('PROJECT', 'MINE', 'LEASE');
CREATE TYPE applicability_kind AS ENUM ('ALWAYS', 'MINE_TYPE', 'THRESHOLD', 'GASSINESS', 'NAMED_MINES', 'UNRESOLVED');
CREATE TYPE instance_status    AS ENUM ('UPCOMING', 'DUE', 'SUBMITTED', 'SATISFIED', 'EVIDENCE_MISMATCH', 'OVERDUE', 'ESCALATED', 'NOT_APPLICABLE', 'WAIVED');
CREATE TYPE reconciliation_verdict AS ENUM ('AGREED', 'CLAIMED_UNSUPPORTED', 'UNREPORTED', 'GAP', 'DISPUTED_APPLICABILITY', 'EVIDENCE_MISSING');
CREATE TYPE evidence_match_outcome AS ENUM ('SATISFIES', 'PARTIALLY_SATISFIES', 'DOES_NOT_SATISFY');
CREATE TYPE nil_return_status  AS ENUM ('ACTIVE', 'CONTRADICTED');
CREATE TYPE conflict_type      AS ENUM ('CONFLICTING_LIMIT', 'CONFLICTING_DEADLINE', 'CONFLICTING_FREQUENCY', 'DUPLICATE_SUBMISSION', 'RESOURCE_COLLISION');
CREATE TYPE conflict_status    AS ENUM ('OPEN', 'RESOLVED', 'ACCEPTED_AS_INTENDED');

-- ---------------------------------------------------------------------------
-- Two-phase upload staging. POST /uploads (purpose-discriminated) issues a
-- presigned PUT; the row is VERIFIED only after HEAD + hash check; the
-- consuming document/evidence row marks it CONSUMED.
-- ---------------------------------------------------------------------------
CREATE TABLE upload (
  id                        TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL REFERENCES tenant(id),
  purpose                   upload_purpose NOT NULL,
  requested_by_principal_id TEXT NOT NULL REFERENCES principal(id),
  claimed_sha256            TEXT NOT NULL,
  byte_size                 BIGINT,
  content_type              TEXT NOT NULL,
  storage_bucket            TEXT NOT NULL,
  storage_key               TEXT NOT NULL,
  status                    upload_status NOT NULL DEFAULT 'PENDING',
  verified_at               TIMESTAMPTZ,
  consumed_by_type          TEXT,           -- 'document' | 'evidence'
  consumed_by_id            TEXT,
  failure_reason            TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at                TIMESTAMPTZ NOT NULL
);
CREATE INDEX upload_pending_idx ON upload (expires_at) WHERE status = 'PENDING';

-- ---------------------------------------------------------------------------
-- Document: one uploaded file through its full lifecycle. A new version is a
-- new row + superseded_by_id — original bytes never change.
-- mine_id NULL = tenant-wide instrument (e.g. a project-level EC letter).
-- ---------------------------------------------------------------------------
CREATE TABLE document (
  id                         TEXT PRIMARY KEY,
  tenant_id                  TEXT NOT NULL REFERENCES tenant(id),
  mine_id                    TEXT REFERENCES mine(id),
  doc_class                  doc_class NOT NULL,
  title                      TEXT NOT NULL,
  original_filename          TEXT NOT NULL,
  issuing_authority_id       TEXT REFERENCES regulatory_authority(id),
  issuing_authority_unit_id  TEXT REFERENCES authority_unit(id),
  owner_organization_id      TEXT REFERENCES organization(id),  -- contractor docs etc.
  content_hash               TEXT NOT NULL,        -- sha256, = object key in storage
  storage_bucket             TEXT NOT NULL,
  storage_key                TEXT NOT NULL,
  byte_size                  BIGINT NOT NULL,
  content_type               TEXT NOT NULL,
  status                     document_status NOT NULL DEFAULT 'UPLOADED',
  uploaded_by_principal_id   TEXT NOT NULL REFERENCES principal(id),
  version_no                 INTEGER NOT NULL DEFAULT 1,
  superseded_by_id           TEXT REFERENCES document(id),
  published_at               TIMESTAMPTZ,
  published_by_principal_id  TEXT REFERENCES principal(id),
  withdrawn_at               TIMESTAMPTZ,
  withdrawn_by_principal_id  TEXT REFERENCES principal(id),
  withdraw_reason            TEXT,
  row_version                INTEGER NOT NULL DEFAULT 1,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, content_hash)          -- identical bytes dedupe per tenant
);
CREATE INDEX document_mine_idx ON document (mine_id);
CREATE INDEX document_status_idx ON document (tenant_id, status);

-- Deferred FKs from 0002 (documents didn't exist yet):
ALTER TABLE appointment ADD CONSTRAINT appointment_instrument_fk
  FOREIGN KEY (source_instrument_document_id) REFERENCES document(id);
ALTER TABLE mandate_assignment ADD CONSTRAINT mandate_assignment_instrument_fk
  FOREIGN KEY (source_instrument_document_id) REFERENCES document(id);
ALTER TABLE jurisdiction_assignment ADD CONSTRAINT jurisdiction_instrument_fk
  FOREIGN KEY (source_instrument_document_id) REFERENCES document(id);

-- One row per pipeline-stage attempt — a stuck document is diagnosable
-- (which stage, which error, how many attempts), never just "processing".
CREATE TABLE document_processing_job (
  id              TEXT PRIMARY KEY,
  document_id     TEXT NOT NULL REFERENCES document(id),
  stage           pipeline_stage NOT NULL,
  attempt_number  INTEGER NOT NULL DEFAULT 1,
  status          job_status NOT NULL DEFAULT 'QUEUED',
  operation_id    TEXT REFERENCES operation(id),
  error_message   TEXT,
  worker_ref      TEXT,
  started_at      TIMESTAMPTZ,
  finished_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, stage, attempt_number)
);

-- One clause/section, Akoma Ntoso-referenced. Immutable once created.
CREATE TABLE document_segment (
  id           TEXT PRIMARY KEY,
  document_id  TEXT NOT NULL REFERENCES document(id),
  segment_ref  TEXT NOT NULL,               -- e.g. /akn/in/act/ec/.../main#cond_17__b
  sequence_no  INTEGER NOT NULL,
  text         TEXT NOT NULL,
  text_hash    TEXT NOT NULL,               -- sha256 of text — grounding anchor for AI proposals
  page_no      INTEGER,
  bbox         JSONB,                       -- {x, y, width, height} for the reviewer UI
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (document_id, segment_ref)
);
CREATE INDEX document_segment_doc_idx ON document_segment (document_id, sequence_no);

-- Embeddings live in a side table so the model/version can change without
-- touching the entity table. Semantic retrieval for grounding + clause diff.
CREATE TABLE document_segment_embedding (
  id             TEXT PRIMARY KEY,
  segment_id     TEXT NOT NULL REFERENCES document_segment(id),
  model_version  TEXT NOT NULL,
  embedding      vector(1536) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (segment_id, model_version)
);
CREATE INDEX document_segment_embedding_hnsw ON document_segment_embedding
  USING hnsw (embedding vector_cosine_ops);

-- One AI-proposed record from one segment. Never auto-published; a human
-- accepts/edits/rejects. ai_run_id (FK added in 0008) names the governed run
-- that produced it — an AI output must name its own provenance.
CREATE TABLE extraction (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT NOT NULL REFERENCES tenant(id),
  document_id       TEXT NOT NULL REFERENCES document(id),
  segment_id        TEXT NOT NULL REFERENCES document_segment(id),
  extractor         TEXT NOT NULL,           -- versioned, e.g. 'obligation@v3'
  extraction_type   extraction_type NOT NULL,
  payload           JSONB NOT NULL,          -- tagged union discriminated by extraction_type
  anchor            TEXT NOT NULL,           -- fuzzy-match target text within the segment
  field_anchors     JSONB,
  confidence        NUMERIC(4,3) NOT NULL CHECK (confidence >= 0 AND confidence <= 1),
  field_confidence  JSONB,
  ai_run_id         TEXT,                    -- FK → ai_run added in 0008
  status            extraction_status NOT NULL DEFAULT 'PROPOSED',
  reviewed_by_person_id TEXT REFERENCES person(id),
  reviewed_at       TIMESTAMPTZ,
  review_note       TEXT,
  split_from_id     TEXT REFERENCES extraction(id),
  merged_into_id    TEXT REFERENCES extraction(id),
  row_version       INTEGER NOT NULL DEFAULT 1,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (status <> 'MERGED' OR merged_into_id IS NOT NULL)
);
CREATE INDEX extraction_document_idx ON extraction (document_id, status);
CREATE INDEX extraction_review_idx ON extraction (tenant_id, extraction_type, status);

-- Confidence thresholds per extractor type — platform default (tenant NULL)
-- + per-tenant override. Recall-first: surface low, review-priority higher.
CREATE TABLE extraction_triage_config (
  id                        TEXT PRIMARY KEY,
  tenant_id                 TEXT REFERENCES tenant(id),
  extraction_type           extraction_type NOT NULL,
  surface_threshold         NUMERIC(4,3) NOT NULL,
  review_priority_threshold NUMERIC(4,3) NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX triage_default_unique ON extraction_triage_config (extraction_type) WHERE tenant_id IS NULL;
CREATE UNIQUE INDEX triage_override_unique ON extraction_triage_config (tenant_id, extraction_type) WHERE tenant_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Obligation register
-- ---------------------------------------------------------------------------

-- Canonical legal obligation definition. One legal clause across mines
-- shares shared_obligation_id (cross-mine dedup/diff group). Amendment =
-- new row + superseded_by_id.
CREATE TABLE obligation (
  id                        TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL REFERENCES tenant(id),
  source_document_id        TEXT NOT NULL REFERENCES document(id),
  source_segment_id         TEXT NOT NULL REFERENCES document_segment(id),
  source_extraction_id      TEXT REFERENCES extraction(id),   -- NULL for manually-entered obligations
  shared_obligation_id      TEXT NOT NULL,
  clause_ref                TEXT NOT NULL,
  deontic                   deontic NOT NULL,
  title                     TEXT NOT NULL,
  summary                   TEXT,
  owner_position_template_id TEXT REFERENCES position_template(id),  -- who *should* own it;
                            -- resolved to an actual post/appointment at materialisation
  periodicity               periodicity NOT NULL,
  due_rule_kind             due_rule_kind NOT NULL,
  due_rule_detail           JSONB,           -- tagged union by due_rule_kind
  grace_period_days         INTEGER NOT NULL DEFAULT 0,
  source_scope              obligation_source_scope NOT NULL,
  anchor_event              TEXT,
  severity                  severity NOT NULL DEFAULT 'SIGNIFICANT',
  nil_permitted             BOOLEAN NOT NULL DEFAULT false,
  active                    BOOLEAN NOT NULL DEFAULT true,
  version_no                INTEGER NOT NULL DEFAULT 1,
  superseded_by_id          TEXT REFERENCES obligation(id),
  published_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_by_principal_id TEXT REFERENCES principal(id),
  row_version               INTEGER NOT NULL DEFAULT 1,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX obligation_shared_idx ON obligation (shared_obligation_id);
CREATE INDEX obligation_tenant_idx ON obligation (tenant_id, active);

-- AND'd per obligation. UNRESOLVED blocks materialisation and raises triage —
-- never silently defaults to ALWAYS ("a wrong obligation is worse than a
-- missing one").
CREATE TABLE obligation_applicability_rule (
  id             TEXT PRIMARY KEY,
  obligation_id  TEXT NOT NULL REFERENCES obligation(id),
  kind           applicability_kind NOT NULL,
  detail         JSONB,        -- {mine_type} | {min_production_tpa} | {gassiness} | {mine_ids:[...]}
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX applicability_obligation_idx ON obligation_applicability_rule (obligation_id);

-- Dated, per-mine materialisation. finding_id FK added in 0005.
CREATE TABLE obligation_instance (
  id                     TEXT PRIMARY KEY,
  tenant_id              TEXT NOT NULL REFERENCES tenant(id),
  obligation_id          TEXT NOT NULL REFERENCES obligation(id),
  mine_id                TEXT NOT NULL REFERENCES mine(id),
  period_start           DATE NOT NULL,
  period_end             DATE NOT NULL,
  due_on                 DATE NOT NULL,
  status                 instance_status NOT NULL DEFAULT 'UPCOMING',
  status_reason          TEXT,             -- app-required for NOT_APPLICABLE / WAIVED
  reconciliation         reconciliation_verdict,   -- set independently of status
  submitted_by_person_id TEXT REFERENCES person(id),
  submitted_at           TIMESTAMPTZ,
  verified_by_person_id  TEXT REFERENCES person(id),
  verified_at            TIMESTAMPTZ,
  finding_id             TEXT,             -- FK → finding added in 0005 (ESCALATED junction)
  row_version            INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (obligation_id, mine_id, period_start),
  CHECK (period_end >= period_start),
  CHECK (verified_by_person_id IS NULL OR submitted_by_person_id IS NULL
         OR verified_by_person_id <> submitted_by_person_id)   -- no self-verification
);
CREATE INDEX instance_mine_status_idx ON obligation_instance (mine_id, status);
CREATE INDEX instance_due_idx ON obligation_instance (due_on)
  WHERE status IN ('UPCOMING', 'DUE', 'OVERDUE');

-- Many-to-many: evidence actually considered when verifying an instance,
-- each with its own verdict. evidence_id FK added in 0005.
CREATE TABLE obligation_evidence_link (
  id                      TEXT PRIMARY KEY,
  obligation_instance_id  TEXT NOT NULL REFERENCES obligation_instance(id),
  evidence_id             TEXT NOT NULL,
  match_outcome           evidence_match_outcome NOT NULL,
  linked_by_person_id     TEXT NOT NULL REFERENCES person(id),
  linked_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (obligation_instance_id, evidence_id)
);

-- "Not applicable this period" claim, only where obligation.nil_permitted.
CREATE TABLE nil_return (
  id                      TEXT PRIMARY KEY,
  obligation_instance_id  TEXT NOT NULL REFERENCES obligation_instance(id),
  declared_by_person_id   TEXT NOT NULL REFERENCES person(id),
  declared_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  statement               TEXT NOT NULL,
  status                  nil_return_status NOT NULL DEFAULT 'ACTIVE',
  contradicted_by_type    TEXT,             -- 'evidence' | 'observation'
  contradicted_by_id      TEXT
);
CREATE INDEX nil_return_instance_idx ON nil_return (obligation_instance_id);

-- Detected contradiction between two obligations (regulatory change impact).
CREATE TABLE obligation_conflict (
  id                     TEXT PRIMARY KEY,
  tenant_id              TEXT NOT NULL REFERENCES tenant(id),
  conflict_type          conflict_type NOT NULL,
  obligation_a_id        TEXT NOT NULL REFERENCES obligation(id),
  obligation_b_id        TEXT NOT NULL REFERENCES obligation(id),
  detail                 JSONB,
  detected_by_run_id     TEXT,              -- FK → ai_run added in 0008
  status                 conflict_status NOT NULL DEFAULT 'OPEN',
  detected_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_by_person_id  TEXT REFERENCES person(id),
  resolved_at            TIMESTAMPTZ,
  resolution_note        TEXT,
  row_version            INTEGER NOT NULL DEFAULT 1,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (obligation_a_id <> obligation_b_id)
);
CREATE INDEX conflict_tenant_idx ON obligation_conflict (tenant_id, status);

-- Recall-first seed thresholds (platform defaults).
INSERT INTO extraction_triage_config (id, tenant_id, extraction_type, surface_threshold, review_priority_threshold) VALUES
  ('etc_01J0000000000000000000TR01', NULL, 'OBLIGATION',     0.30, 0.60),
  ('etc_01J0000000000000000000TR02', NULL, 'CLAIMED_STATUS', 0.30, 0.60),
  ('etc_01J0000000000000000000TR03', NULL, 'OBSERVATION',    0.30, 0.60),
  ('etc_01J0000000000000000000TR04', NULL, 'INCIDENT',       0.30, 0.60),
  ('etc_01J0000000000000000000TR05', NULL, 'CONTRACTOR',     0.30, 0.60),
  ('etc_01J0000000000000000000TR06', NULL, 'EVIDENCE',       0.30, 0.60);

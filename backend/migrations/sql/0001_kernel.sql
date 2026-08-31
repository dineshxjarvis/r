-- 0001_kernel.sql — extensions, shared functions, and the kernel tables every
-- domain commits through: idempotency, operations, audit streams, outbox/inbox.
--
-- Conventions (apply to every file in this directory):
--   * IDs are TEXT PRIMARY KEY, format <prefix>_<26-char Crockford ULID>,
--     generated application-side (client-side for evidence). Never sequential.
--   * Every tenant-owned row carries an immutable tenant_id. Platform
--     catalogues (capability, spatial_reference_system_profile, ...) omit it.
--   * row_version INTEGER is the envelope `version` — bumped by the
--     application on every write, checked against expected_version/If-Match.
--   * created_at/updated_at TIMESTAMPTZ; updated_at maintained by
--     set_updated_at() attached in 0009_triggers_rls.sql.
--   * No hard deletes on domain entities: revoked_at / superseded_by_id /
--     status columns instead. DELETE is reserved for data entered in error
--     before anything referenced it.
--   * State machines are native enums (closed, additive via ALTER TYPE).
--     Taxonomies/reference vocabularies (org kinds, affiliation kinds,
--     capabilities, mandates) are reference data — rows, not enums.
--   * Audit + outbox rows are written EXPLICITLY by domain transaction code,
--     never by generic triggers (audit-history-data-model.md).

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS btree_gist;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- Enum registry — backs GET /enums and GET /enums/{name}. Human labels,
-- ordering, colours and deprecations for every open vocabulary. Machine
-- values themselves stay in the columns; this is presentation + governance.
-- ---------------------------------------------------------------------------
CREATE TABLE enum_registry (
  id           TEXT PRIMARY KEY,
  enum_name    TEXT NOT NULL,             -- e.g. 'severity', 'doc_class'
  value        TEXT NOT NULL,             -- SCREAMING_SNAKE
  label        TEXT NOT NULL,
  label_i18n   JSONB NOT NULL DEFAULT '{}'::jsonb,  -- BCP-47 keyed
  ordering     INTEGER NOT NULL DEFAULT 0,
  color        TEXT,
  deprecated   BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (enum_name, value)
);

-- ---------------------------------------------------------------------------
-- Idempotency — required on every /actions call and create.
-- Key scoped to (principal, route, target) for 24h; replay returns the
-- stored response with Idempotency-Replayed: true.
-- ---------------------------------------------------------------------------
CREATE TABLE idempotency_key (
  id               TEXT PRIMARY KEY,
  principal_id     TEXT NOT NULL,
  route            TEXT NOT NULL,
  target           TEXT NOT NULL DEFAULT '',   -- resource id or '' for collection routes
  idem_key         TEXT NOT NULL,
  request_hash     TEXT NOT NULL,              -- sha256 of the canonicalised body; a replay
                                               -- with a different body is a 422, not a replay
  response_status  INTEGER,
  response_body    JSONB,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at       TIMESTAMPTZ NOT NULL,
  UNIQUE (principal_id, route, target, idem_key)
);
CREATE INDEX idempotency_expiry_idx ON idempotency_key (expires_at);

-- ---------------------------------------------------------------------------
-- Operations — GET /operations/{id}, the single async-status route for the
-- whole platform (extraction jobs, index rebuilds, exports, sync batches).
-- ---------------------------------------------------------------------------
CREATE TYPE operation_status AS ENUM ('QUEUED', 'RUNNING', 'SUCCEEDED', 'FAILED', 'CANCELLED');

CREATE TABLE operation (
  id                       TEXT PRIMARY KEY,
  tenant_id                TEXT,                          -- NULL for platform-level operations
  kind                     TEXT NOT NULL,                 -- 'document.extract' | 'evidence.sync' | ...
  target_type              TEXT,
  target_id                TEXT,
  status                   operation_status NOT NULL DEFAULT 'QUEUED',
  progress_completed       INTEGER NOT NULL DEFAULT 0,
  progress_total           INTEGER,
  result                   JSONB,
  error                    JSONB,
  created_by_principal_id  TEXT NOT NULL,
  started_at               TIMESTAMPTZ,
  estimated_completion_at  TIMESTAMPTZ,
  finished_at              TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX operation_target_idx ON operation (target_type, target_id);
CREATE INDEX operation_open_idx ON operation (status, created_at) WHERE status IN ('QUEUED', 'RUNNING');

-- ---------------------------------------------------------------------------
-- Audit streams. One hash chain per stream: 'tenant:<tenant_id>' or
-- 'platform'. audit_stream_head is the lockable head row — the chain
-- append locks THIS row, never "the latest event", because an empty chain
-- has nothing to lock (foundation-data-model.md).
-- ---------------------------------------------------------------------------
CREATE TABLE audit_stream_head (
  stream_key     TEXT PRIMARY KEY,          -- 'tenant:ten_01...' | 'platform'
  last_sequence  BIGINT NOT NULL DEFAULT 0,
  last_hash      TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Immutable, typed domain change record. Written explicitly in the same
-- transaction as the domain state change and the outbox row.
-- Backs GET /{collection}/{id}/history and GET /audit-events.
CREATE TABLE domain_audit_event (
  id                        TEXT PRIMARY KEY,
  stream_key                TEXT NOT NULL REFERENCES audit_stream_head(stream_key),
  sequence_no               BIGINT NOT NULL,
  schema_version            INTEGER NOT NULL DEFAULT 1,
  tenant_id                 TEXT,                     -- NULL on the platform stream
  occurred_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_at              TIMESTAMPTZ,              -- business time when it differs (offline sync)
  actor_principal_id        TEXT,                     -- NULL for system/worker actions
  actor_person_id           TEXT,
  acting_appointment_id     TEXT,                     -- the authority exercised, not just the human
  acting_mandate_assignment_id TEXT,
  action                    TEXT NOT NULL,            -- 'capa.VERIFY', 'obligation.published' — open vocabulary
  object_type               TEXT NOT NULL,
  object_id                 TEXT NOT NULL,
  transition_from           TEXT,
  transition_to             TEXT,
  changes                   JSONB,                    -- [{field, from, to}]
  before                    JSONB,
  after                     JSONB,
  reason                    TEXT,                     -- verbatim from the action envelope
  request_id                TEXT,
  trace_id                  TEXT,
  correlation_id            TEXT,
  causation_id              TEXT,
  source                    TEXT NOT NULL DEFAULT 'api',  -- 'api' | 'worker:<name>' | 'migration:<rev>'
  prev_hash                 TEXT,                     -- NULL only at sequence_no = 1
  hash                      TEXT NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (stream_key, sequence_no)
);
CREATE INDEX audit_object_idx ON domain_audit_event (object_type, object_id, sequence_no);
CREATE INDEX audit_tenant_time_idx ON domain_audit_event (tenant_id, occurred_at);

-- Authentication/session/credential/denial/break-glass events. Own durable
-- append path — these can occur without a domain transaction.
CREATE TABLE security_event (
  id             TEXT PRIMARY KEY,
  tenant_id      TEXT,
  principal_id   TEXT,
  event_type     TEXT NOT NULL,             -- 'login.success' | 'login.failure' | 'session.revoked' | ...
  detail         JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address     INET,
  user_agent     TEXT,
  occurred_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX security_event_principal_idx ON security_event (principal_id, occurred_at);

-- Purpose-logged reads of sensitive records/projections. Append-only, not
-- hash-chained: a read has no before/after. Logs denials too (granted=false).
CREATE TABLE access_event (
  id               TEXT PRIMARY KEY,
  tenant_id        TEXT,
  principal_id     TEXT NOT NULL,
  person_id        TEXT,
  purpose          TEXT,                    -- required for regulator reads; open vocabulary
  object_type      TEXT NOT NULL,
  object_id        TEXT,
  fields           TEXT[],
  requested_scope  JSONB,
  effective_scope  JSONB,                   -- what authorization actually clipped it to
  granted          BOOLEAN NOT NULL,
  occurred_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX access_event_object_idx ON access_event (object_type, object_id);
CREATE INDEX access_event_actor_idx ON access_event (principal_id, occurred_at);

-- ---------------------------------------------------------------------------
-- Transactional outbox + consumer-side inbox. At-least-once publication;
-- consumers dedupe on message id and advance checkpoints only after durable
-- processing. FGA projector, notifier, dashboard projector and signal
-- emitter all consume from here.
-- ---------------------------------------------------------------------------
CREATE TABLE outbox_message (
  id                TEXT PRIMARY KEY,
  tenant_id         TEXT,
  aggregate_type    TEXT NOT NULL,
  aggregate_id      TEXT NOT NULL,
  aggregate_seq     BIGINT NOT NULL DEFAULT 1,      -- per-aggregate ordering
  event_type        TEXT NOT NULL,                  -- 'capa.verified', 'appointment.created', ...
  schema_version    INTEGER NOT NULL DEFAULT 1,
  payload           JSONB NOT NULL,
  audit_event_id    TEXT REFERENCES domain_audit_event(id),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  available_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at      TIMESTAMPTZ,
  publish_attempts  INTEGER NOT NULL DEFAULT 0,
  last_error        TEXT
);
CREATE INDEX outbox_unpublished_idx ON outbox_message (available_at) WHERE published_at IS NULL;
CREATE INDEX outbox_aggregate_idx ON outbox_message (aggregate_type, aggregate_id, aggregate_seq);

CREATE TABLE inbox_message (
  consumer      TEXT NOT NULL,               -- 'fga_projector' | 'notifier' | ...
  message_id    TEXT NOT NULL,               -- outbox_message.id
  dedup_hash    TEXT,
  received_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at  TIMESTAMPTZ,
  status        TEXT NOT NULL DEFAULT 'RECEIVED',  -- RECEIVED | PROCESSED | FAILED | SKIPPED
  error         TEXT,
  PRIMARY KEY (consumer, message_id)
);

CREATE TABLE consumer_checkpoint (
  consumer         TEXT NOT NULL,
  partition_key    TEXT NOT NULL DEFAULT '*',
  last_sequence    BIGINT NOT NULL DEFAULT 0,
  watermark        TIMESTAMPTZ,
  lease_owner      TEXT,
  lease_expires_at TIMESTAMPTZ,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (consumer, partition_key)
);

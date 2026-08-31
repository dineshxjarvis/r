-- 0008_analytics.sql — AI governance chain + signals. Implements the v0.01
-- slice of analytics-ai-data-model.md. The chain is NOT deferred:
--   ai_use_case_version → ai_model_version + ai_prompt_template_version +
--   ai_provider_profile → ai_deployment → ai_run → signal_instance.
-- Without it an AI output cannot name its own provenance.
-- Deferred to v0.02+: datasets, features, evaluation harness, drift
-- monitoring, incidents, red-teaming.
--
-- L4 rules enforced by shape:
--   * a run/output/signal is immutable and never overwrites an L2 fact;
--   * a signal cannot execute a domain decision — humans respond through
--     the domain's own actions; signal_review records the disposition;
--   * dismissed signals remain auditable (state, never DELETE).

CREATE TYPE ai_risk_tier          AS ENUM ('MINIMAL', 'LIMITED', 'HIGH', 'UNACCEPTABLE');
CREATE TYPE ai_decision_influence AS ENUM ('ADVISORY', 'GATED_ASSIST', 'AUTOMATION_FORBIDDEN');
CREATE TYPE ai_lifecycle_status   AS ENUM ('DRAFT', 'APPROVED', 'ACTIVE', 'SUSPENDED', 'RETIRED');
CREATE TYPE ai_run_status         AS ENUM ('RUNNING', 'SUCCEEDED', 'FAILED', 'TIMED_OUT', 'CANCELLED');
CREATE TYPE signal_state          AS ENUM ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED', 'EXPIRED', 'SUPERSEDED');
CREATE TYPE signal_disposition    AS ENUM ('CONFIRMED_USEFUL', 'ACTED_ON', 'NOT_USEFUL', 'INCORRECT', 'DUPLICATE');

-- === governance chain ===

CREATE TABLE ai_use_case (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,      -- 'RISK_DETECTION' | 'CAPA_EFFECTIVENESS' | 'REG_CHANGE_IMPACT' | 'OBLIGATION_EXTRACTION'
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_use_case_version (
  id                  TEXT PRIMARY KEY,
  use_case_id         TEXT NOT NULL REFERENCES ai_use_case(id),
  version_no          INTEGER NOT NULL,
  purpose             TEXT NOT NULL,
  decision_influence  ai_decision_influence NOT NULL DEFAULT 'ADVISORY',
  affected_actors     TEXT[],
  risk_tier           ai_risk_tier NOT NULL,
  intended_use        TEXT NOT NULL,
  excluded_use        TEXT NOT NULL,
  human_workflow      TEXT NOT NULL,      -- who reviews, how disagreement is handled
  fallback            TEXT NOT NULL,      -- behaviour when the AI path is unavailable
  status              ai_lifecycle_status NOT NULL DEFAULT 'DRAFT',
  approved_at         TIMESTAMPTZ,
  approved_by_person_id TEXT REFERENCES person(id),
  effective_from      TIMESTAMPTZ,
  effective_until     TIMESTAMPTZ,
  row_version         INTEGER NOT NULL DEFAULT 1,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (use_case_id, version_no)
);

-- Provider terms are governance facts: retention, training use, residency.
CREATE TABLE ai_provider_profile (
  id                       TEXT PRIMARY KEY,
  code                     TEXT NOT NULL UNIQUE,
  name                     TEXT NOT NULL,
  provider                 TEXT NOT NULL,   -- 'google' | 'groq' | 'self_hosted' | ...
  deployment               TEXT NOT NULL DEFAULT 'API',
  data_retention_terms     JSONB NOT NULL DEFAULT '{}'::jsonb,
  approved_classifications TEXT[] NOT NULL DEFAULT '{}',
  active                   BOOLEAN NOT NULL DEFAULT true,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ai_model (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  model_type  TEXT NOT NULL,               -- 'RULE' | 'CLASSICAL_ML' | 'GENERATIVE' | 'THIRD_PARTY'
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Substitution = new version, never an in-place swap.
CREATE TABLE ai_model_version (
  id                   TEXT PRIMARY KEY,
  ai_model_id          TEXT NOT NULL REFERENCES ai_model(id),
  version_no           INTEGER NOT NULL,
  provider_profile_id  TEXT REFERENCES ai_provider_profile(id),
  provider_model_id    TEXT,               -- e.g. 'gemini-2.5-pro'; NULL for rule engines
  algorithm            TEXT,
  config               JSONB NOT NULL DEFAULT '{}'::jsonb,
  training_manifest    JSONB,
  license              TEXT,
  content_hash         TEXT,               -- immutable artifact/config hash
  status               ai_lifecycle_status NOT NULL DEFAULT 'DRAFT',
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (ai_model_id, version_no)
);

CREATE TABLE ai_prompt_template_version (
  id               TEXT PRIMARY KEY,
  code             TEXT NOT NULL,
  version_no       INTEGER NOT NULL,
  system_template  TEXT,
  user_template    TEXT NOT NULL,
  tools            JSONB NOT NULL DEFAULT '[]'::jsonb,
  retrieval_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  output_schema    JSONB,
  safety_controls  JSONB NOT NULL DEFAULT '{}'::jsonb,
  content_hash     TEXT NOT NULL,
  status           ai_lifecycle_status NOT NULL DEFAULT 'DRAFT',
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code, version_no)
);

-- Binds approved use case + model + prompt + provider into one runnable unit.
CREATE TABLE ai_deployment (
  id                          TEXT PRIMARY KEY,
  code                        TEXT NOT NULL UNIQUE,
  use_case_version_id         TEXT NOT NULL REFERENCES ai_use_case_version(id),
  model_version_id            TEXT NOT NULL REFERENCES ai_model_version(id),
  prompt_template_version_id  TEXT REFERENCES ai_prompt_template_version(id),
  provider_profile_id         TEXT REFERENCES ai_provider_profile(id),
  environment                 TEXT NOT NULL DEFAULT 'production',
  traffic_mode                TEXT NOT NULL DEFAULT 'FULL',   -- 'SHADOW' | 'CANARY' | 'FULL'
  thresholds                  JSONB NOT NULL DEFAULT '{}'::jsonb,
  fallback                    TEXT,
  status                      ai_lifecycle_status NOT NULL DEFAULT 'DRAFT',
  activated_at                TIMESTAMPTZ,
  retired_at                  TIMESTAMPTZ,
  row_version                 INTEGER NOT NULL DEFAULT 1,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === run lineage ===

-- Every production run binds one approved deployment; input/output manifests
-- carry the record refs and hashes it was grounded in.
CREATE TABLE ai_run (
  id                          TEXT PRIMARY KEY,
  tenant_id                   TEXT REFERENCES tenant(id),    -- NULL for platform-level runs
  deployment_id               TEXT NOT NULL REFERENCES ai_deployment(id),
  use_case_version_id         TEXT NOT NULL REFERENCES ai_use_case_version(id),
  model_version_id            TEXT NOT NULL REFERENCES ai_model_version(id),
  prompt_template_version_id  TEXT REFERENCES ai_prompt_template_version(id),
  status                      ai_run_status NOT NULL DEFAULT 'RUNNING',
  started_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at                 TIMESTAMPTZ,
  input_manifest              JSONB NOT NULL DEFAULT '{}'::jsonb,   -- [{object, id, content_hash}]
  output_manifest             JSONB,
  warnings                    JSONB NOT NULL DEFAULT '[]'::jsonb,
  cost                        JSONB,          -- {input_tokens, output_tokens, amount: {value, currency}}
  trace_id                    TEXT,
  error                       JSONB,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_run_deployment_idx ON ai_run (deployment_id, started_at DESC);
CREATE INDEX ai_run_tenant_idx ON ai_run (tenant_id, started_at DESC);

ALTER TABLE extraction ADD CONSTRAINT extraction_ai_run_fk
  FOREIGN KEY (ai_run_id) REFERENCES ai_run(id);
ALTER TABLE obligation_conflict ADD CONSTRAINT conflict_ai_run_fk
  FOREIGN KEY (detected_by_run_id) REFERENCES ai_run(id);

-- === signals ===

CREATE TABLE signal_definition (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,       -- 'DEFECT_RISK' | 'CAPA_INEFFECTIVE' | 'REG_CHANGE_IMPACT'
  name        TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Versioned trigger semantics: eligible population, rule/model, thresholds,
-- recipients, suppression/dedup, expected human response.
CREATE TABLE signal_definition_version (
  id                    TEXT PRIMARY KEY,
  signal_definition_id  TEXT NOT NULL REFERENCES signal_definition(id),
  version_no            INTEGER NOT NULL,
  eligible_population   JSONB NOT NULL,     -- filter over defects/findings/instances/capas
  trigger_rule          JSONB NOT NULL,     -- deterministic scoring rule; the LLM writes the explanation, not the score
  deployment_id         TEXT REFERENCES ai_deployment(id),  -- explanation/generative path, if any
  semantics             TEXT NOT NULL,
  threshold             JSONB NOT NULL DEFAULT '{}'::jsonb,
  severity_map          JSONB NOT NULL DEFAULT '{}'::jsonb,
  recipients            JSONB NOT NULL DEFAULT '{}'::jsonb,  -- post/position-template routing
  suppression           JSONB NOT NULL DEFAULT '{}'::jsonb,  -- dedup window etc.
  response_contract     JSONB NOT NULL DEFAULT '{}'::jsonb,
  status                ai_lifecycle_status NOT NULL DEFAULT 'DRAFT',
  effective_from        TIMESTAMPTZ,
  effective_until       TIMESTAMPTZ,
  row_version           INTEGER NOT NULL DEFAULT 1,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (signal_definition_id, version_no)
);

-- Immutable emitted signal. Carries its definition version, the run that
-- produced it, and the exact records behind it. Lifecycle is additive:
-- dismissal is a state, the row never disappears.
CREATE TABLE signal_instance (
  id                            TEXT PRIMARY KEY,
  tenant_id                     TEXT NOT NULL REFERENCES tenant(id),
  signal_definition_version_id  TEXT NOT NULL REFERENCES signal_definition_version(id),
  ai_run_id                     TEXT REFERENCES ai_run(id),
  subject_type                  TEXT NOT NULL,    -- 'defect' | 'finding' | 'capa' | 'obligation_instance' | 'mine'
  subject_id                    TEXT NOT NULL,
  mine_id                       TEXT REFERENCES mine(id),
  window_start                  TIMESTAMPTZ,
  window_end                    TIMESTAMPTZ,
  score                         NUMERIC(6,3),
  category                      TEXT,
  severity                      severity NOT NULL DEFAULT 'SIGNIFICANT',
  explanation                   TEXT,             -- LLM-written narrative; score stays deterministic
  grounding_refs                JSONB NOT NULL DEFAULT '[]'::jsonb,  -- [{object, id, content_hash}]
  state                         signal_state NOT NULL DEFAULT 'ACTIVE',
  expires_at                    TIMESTAMPTZ,
  superseded_by_id              TEXT REFERENCES signal_instance(id),
  row_version                   INTEGER NOT NULL DEFAULT 1,
  emitted_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX signal_subject_idx ON signal_instance (subject_type, subject_id);
CREATE INDEX signal_tenant_state_idx ON signal_instance (tenant_id, state);
CREATE INDEX signal_mine_idx ON signal_instance (mine_id, state);
-- suppression/dedup guard: one live signal per (definition version, subject)
CREATE UNIQUE INDEX signal_live_dedup ON signal_instance
  (signal_definition_version_id, subject_type, subject_id)
  WHERE state IN ('ACTIVE', 'ACKNOWLEDGED');

-- Authorized recipient projection + delivery/ack state.
CREATE TABLE signal_delivery (
  id                   TEXT PRIMARY KEY,
  signal_instance_id   TEXT NOT NULL REFERENCES signal_instance(id),
  recipient_person_id  TEXT NOT NULL REFERENCES person(id),
  notification_id      TEXT REFERENCES notification(id),
  delivered_at         TIMESTAMPTZ,
  acknowledged_at      TIMESTAMPTZ,
  revoked_at           TIMESTAMPTZ,
  UNIQUE (signal_instance_id, recipient_person_id)
);

-- Human disposition — the feedback loop for signal quality. Links to the
-- domain decision it influenced (declared, never inferred causality).
CREATE TABLE signal_review (
  id                       TEXT PRIMARY KEY,
  signal_instance_id       TEXT NOT NULL REFERENCES signal_instance(id),
  reviewer_person_id       TEXT NOT NULL REFERENCES person(id),
  reviewer_appointment_id  TEXT REFERENCES appointment(id),
  disposition              signal_disposition NOT NULL,
  reason                   TEXT,
  domain_link_type         TEXT,             -- 'capa' | 'finding' | 'inspection' | ...
  domain_link_id           TEXT,
  reviewed_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX signal_review_signal_idx ON signal_review (signal_instance_id);

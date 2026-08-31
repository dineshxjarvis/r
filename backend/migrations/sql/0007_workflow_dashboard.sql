-- 0007_workflow_dashboard.sql — notifications, delegates, metric versions,
-- metric manifests. Workflow rows are written by the outbox notifier worker,
-- never directly by request handlers.
--
-- Dashboard rule: "every number is a link, not a claim" — a metric_manifest
-- row is written the moment a viewer drills in / exports / a number enters a
-- report, and is permanent. Live tiles run the underlying query directly.

CREATE TYPE notification_channel AS ENUM ('IN_APP', 'PUSH', 'SMS', 'EMAIL', 'DIGEST');
CREATE TYPE notification_status  AS ENUM ('QUEUED', 'SENT', 'DELIVERED', 'ACKNOWLEDGED', 'ACTIONED', 'FAILED');
CREATE TYPE dashboard_freshness  AS ENUM ('LIVE', 'DELAYED', 'OFFLINE_GAPS', 'SNAPSHOT');

-- Addressed to a post, resolved to a person (or a registered delegate when
-- the post is unmanned — receipt only, the delegate gains no permission).
-- subject_(type, ref) is deliberately an untyped pair: delivery records are
-- disposable, not canonical domain state.
CREATE TABLE notification (
  id                        TEXT PRIMARY KEY,
  tenant_id                 TEXT NOT NULL REFERENCES tenant(id),
  target_post_id            TEXT REFERENCES post(id),
  resolved_person_id        TEXT REFERENCES person(id),   -- NULL = escalation chain exhausted
  delivered_to_delegate_id  TEXT REFERENCES person(id),   -- marks "delivered on behalf of unmanned post"
  subject_type              TEXT NOT NULL,   -- 'OBLIGATION_INSTANCE' | 'FINDING' | 'CAPA' | 'DEFECT' |
                                             -- 'INSPECTION_ASSIGNMENT' | 'SIGNAL' | 'APPOINTMENT_LAPSE' | ...
  subject_ref               TEXT NOT NULL,
  severity                  severity NOT NULL DEFAULT 'SIGNIFICANT',
  title                     TEXT NOT NULL,
  body                      TEXT,
  channel                   notification_channel NOT NULL DEFAULT 'IN_APP',
  status                    notification_status NOT NULL DEFAULT 'QUEUED',
  requires_ack              BOOLEAN NOT NULL DEFAULT false,
  queued_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at                   TIMESTAMPTZ,
  delivered_at              TIMESTAMPTZ,
  acknowledged_at           TIMESTAMPTZ,
  actioned_at               TIMESTAMPTZ,
  failed_at                 TIMESTAMPTZ,
  failure_reason            TEXT,
  row_version               INTEGER NOT NULL DEFAULT 1
);
CREATE INDEX notification_person_idx ON notification (resolved_person_id, status);
CREATE INDEX notification_subject_idx ON notification (subject_type, subject_ref);
CREATE INDEX notification_queued_idx ON notification (queued_at) WHERE status = 'QUEUED';

-- Post-scoped (the post may already be vacant at resolution time).
-- Receipt only — never authority.
CREATE TABLE notification_delegate (
  id                       TEXT PRIMARY KEY,
  tenant_id                TEXT NOT NULL REFERENCES tenant(id),
  post_id                  TEXT NOT NULL REFERENCES post(id),
  delegate_person_id       TEXT NOT NULL REFERENCES person(id),
  registered_by_person_id  TEXT NOT NULL REFERENCES person(id),
  valid_from               TIMESTAMPTZ NOT NULL,
  valid_until              TIMESTAMPTZ NOT NULL,
  reason                   TEXT NOT NULL,
  revoked_at               TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (valid_until > valid_from)
);
CREATE INDEX notification_delegate_post_idx ON notification_delegate (post_id, valid_until);

-- Versioned metric definitions — what 'verified_compliance_rate@3' meant is
-- itself a historical fact (CAPA effectiveness metrics live here too).
CREATE TABLE metric_version (
  id               TEXT PRIMARY KEY,
  metric_key       TEXT NOT NULL,            -- 'verified_compliance_rate' | 'capa_effectiveness' | ...
  version_no       INTEGER NOT NULL,
  title            TEXT NOT NULL,
  definition       JSONB NOT NULL,           -- formula, numerator/denominator semantics, exclusions
  owner            TEXT,
  effective_from   TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until  TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (metric_key, version_no)
);

-- Append-only proof of what a viewer was shown: value + the exact record
-- refs behind numerator/denominator + what authorization clipped.
-- NULL numerator/denominator distinction matters: zero-denominator renders
-- '—', never 0% or 100%.
CREATE TABLE metric_manifest (
  id                          TEXT PRIMARY KEY,
  tenant_id                   TEXT REFERENCES tenant(id),  -- NULL = ministry/portfolio cross-tenant view
  metric_key                  TEXT NOT NULL,
  metric_version_no           INTEGER NOT NULL,
  viewer_principal_id         TEXT NOT NULL REFERENCES principal(id),
  viewer_requested_scope      JSONB NOT NULL,
  effective_authorised_scope  JSONB NOT NULL,
  period_start                DATE NOT NULL,
  period_end                  DATE NOT NULL,
  as_of                       TIMESTAMPTZ,     -- NULL = live mode; set = time-travel reconstruction
  filters                     JSONB,
  numerator_value             NUMERIC,
  denominator_value           NUMERIC,
  numerator_record_refs       JSONB NOT NULL DEFAULT '[]'::jsonb,
  denominator_record_refs     JSONB NOT NULL DEFAULT '[]'::jsonb,
  excluded_record_refs        JSONB NOT NULL DEFAULT '[]'::jsonb,   -- [{ref, reason}]
  source_watermarks           JSONB NOT NULL DEFAULT '{}'::jsonb,   -- per-source last-processed pointer
  freshness                   dashboard_freshness NOT NULL,
  computed_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX manifest_viewer_idx ON metric_manifest (viewer_principal_id, computed_at DESC);
CREATE INDEX manifest_metric_idx ON metric_manifest (metric_key, tenant_id);

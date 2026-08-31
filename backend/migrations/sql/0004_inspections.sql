-- 0004_inspections.sql — inspection catalogue, lifecycle, assignment,
-- visits, checklist, reports, decisions. Implements inspection-data-model.md.
-- Backs: inspection management (web) + assigned/geo-tagged inspection (mobile).
--
-- evidence_id columns here are plain TEXT until 0005 creates `evidence`;
-- the FKs are added at the end of 0005.

CREATE TYPE inspection_origin        AS ENUM ('INTERNAL', 'REGULATORY', 'THIRD_PARTY', 'RECEIVED_NOTICE');
CREATE TYPE inspection_status        AS ENUM (
  'DRAFT', 'PLANNED', 'ASSIGNED', 'IN_PROGRESS', 'FIELDWORK_COMPLETE',
  'REPORT_PENDING', 'ISSUED', 'CLOSED', 'CANCELLED'
);
CREATE TYPE assignment_version_status AS ENUM ('PROPOSED', 'ACTIVE', 'REPLACED', 'REJECTED');
CREATE TYPE assignment_member_status  AS ENUM ('OFFERED', 'ACCEPTED', 'DECLINED', 'WITHDRAWN', 'REMOVED');
CREATE TYPE participation_role        AS ENUM ('LEAD', 'MEMBER', 'OBSERVER', 'TECHNICAL_EXPERT', 'WORKMEN_REPRESENTATIVE');
CREATE TYPE visit_status              AS ENUM ('PLANNED', 'IN_PROGRESS', 'COMPLETED', 'POSTPONED', 'CANCELLED');
CREATE TYPE checklist_response_value  AS ENUM ('COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE', 'NOT_INSPECTED');
CREATE TYPE inspection_report_kind    AS ENUM ('PRELIMINARY', 'FINAL', 'VIOLATION_NOTICE', 'ADVISORY');
CREATE TYPE inspection_report_status  AS ENUM ('DRAFT', 'UNDER_REVIEW', 'ISSUED', 'SUPERSEDED', 'WITHDRAWN');
CREATE TYPE inspection_relation_type  AS ENUM ('FOLLOW_UP', 'REINSPECTION', 'APPEAL_REVIEW', 'SUPERSEDES', 'CASE_MEMBER');
CREATE TYPE inspection_decision_type  AS ENUM ('ASSIGNMENT_APPROVAL', 'START', 'CANCELLATION', 'ISSUE', 'REOPEN', 'CLOSURE');

-- === catalogue ===

CREATE TABLE inspection_type (
  id          TEXT PRIMARY KEY,
  code        TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE checklist_template_version (
  id            TEXT PRIMARY KEY,
  code          TEXT NOT NULL,
  version_no    INTEGER NOT NULL,
  title         TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'DRAFT',   -- DRAFT | PUBLISHED | RETIRED
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (code, version_no)
);

CREATE TABLE inspection_competency (
  id                  TEXT PRIMARY KEY,
  code                TEXT NOT NULL UNIQUE,
  name                TEXT NOT NULL,
  verification_policy JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE checklist_template_item (
  id                       TEXT PRIMARY KEY,
  template_version_id      TEXT NOT NULL REFERENCES checklist_template_version(id),
  sequence_no              INTEGER NOT NULL,
  text                     TEXT NOT NULL,
  guidance                 TEXT,
  mandatory                BOOLEAN NOT NULL DEFAULT true,
  required_competency_id   TEXT REFERENCES inspection_competency(id),
  response_schema          JSONB,           -- measurement/unit expectations, if any
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (template_version_id, sequence_no)
);

-- Freezes behaviour: which origins may use it, which regulator mandate it
-- requires, which checklist template it instantiates, closure/report policy.
CREATE TABLE inspection_type_version (
  id                            TEXT PRIMARY KEY,
  inspection_type_id            TEXT NOT NULL REFERENCES inspection_type(id),
  version_no                    INTEGER NOT NULL,
  allowed_origins               inspection_origin[] NOT NULL,
  required_mandate_id           TEXT REFERENCES mandate(id),
  checklist_template_version_id TEXT REFERENCES checklist_template_version(id),
  workflow_policy               JSONB NOT NULL DEFAULT '{}'::jsonb,
  report_policy                 JSONB NOT NULL DEFAULT '{}'::jsonb,
  closure_policy                JSONB NOT NULL DEFAULT '{}'::jsonb,
  effective_from                TIMESTAMPTZ NOT NULL DEFAULT now(),
  effective_until               TIMESTAMPTZ,
  created_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspection_type_id, version_no)
);

CREATE TABLE inspection_type_competency (
  id                          TEXT PRIMARY KEY,
  inspection_type_version_id  TEXT NOT NULL REFERENCES inspection_type_version(id),
  competency_id               TEXT NOT NULL REFERENCES inspection_competency(id),
  participation_role          participation_role NOT NULL,
  minimum_count               INTEGER NOT NULL DEFAULT 1,
  mandatory                   BOOLEAN NOT NULL DEFAULT true,
  UNIQUE (inspection_type_version_id, competency_id, participation_role)
);

-- === inspection ===

-- Regulatory origin requires structured authority/mandate/jurisdiction once
-- confirmed; non-regulatory origin cannot carry regulatory provenance.
-- RECEIVED_NOTICE stores the claimed issuer separately until confirmed.
CREATE TABLE inspection (
  id                                TEXT PRIMARY KEY,
  tenant_id                         TEXT NOT NULL REFERENCES tenant(id),
  inspection_type_version_id        TEXT NOT NULL REFERENCES inspection_type_version(id),
  origin                            inspection_origin NOT NULL,
  creation_mode                     TEXT NOT NULL DEFAULT 'PLANNED',  -- 'PLANNED' | 'AD_HOC' | 'FROM_NOTICE'
  status                            inspection_status NOT NULL DEFAULT 'DRAFT',
  title                             TEXT NOT NULL,
  purpose_code                      TEXT,
  purpose_detail                    TEXT,
  scheduled_from                    TIMESTAMPTZ,
  scheduled_until                   TIMESTAMPTZ,
  started_at                        TIMESTAMPTZ,
  fieldwork_completed_at            TIMESTAMPTZ,
  issued_at                         TIMESTAMPTZ,
  closed_at                         TIMESTAMPTZ,
  lead_assignment_member_id         TEXT,       -- FK added below after member table exists
  issuing_authority_id              TEXT REFERENCES regulatory_authority(id),
  issuing_authority_unit_id         TEXT REFERENCES authority_unit(id),
  supporting_mandate_assignment_id  TEXT REFERENCES mandate_assignment(id),
  jurisdiction_assignment_id        TEXT REFERENCES jurisdiction_assignment(id),
  source_instrument_document_id     TEXT REFERENCES document(id),
  claimed_issuer                    TEXT,       -- RECEIVED_NOTICE: unconfirmed issuer text
  regulatory_case_id                TEXT,       -- regulatory-cases domain is v0.02+; opaque ref, no FK yet
  created_by_principal_id           TEXT NOT NULL REFERENCES principal(id),
  row_version                       INTEGER NOT NULL DEFAULT 1,
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (origin IN ('REGULATORY', 'RECEIVED_NOTICE') OR
         (issuing_authority_id IS NULL AND supporting_mandate_assignment_id IS NULL))
);
CREATE INDEX inspection_tenant_status_idx ON inspection (tenant_id, status);
CREATE INDEX inspection_schedule_idx ON inspection (scheduled_from);

-- Real FKs per selected target variant; every target belongs to the
-- inspection's tenant (enforced app-side + RLS).
CREATE TABLE inspection_target (
  id             TEXT PRIMARY KEY,
  inspection_id  TEXT NOT NULL REFERENCES inspection(id),
  target_type    TEXT NOT NULL,             -- 'MINE' | 'SUBUNIT' | 'ASSET'
  mine_id        TEXT NOT NULL REFERENCES mine(id),
  subunit_id     TEXT REFERENCES subunit(id),
  asset_id       TEXT REFERENCES asset(id),
  purpose        TEXT,
  valid_from     TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until    TIMESTAMPTZ,
  CHECK (
    (target_type = 'MINE'    AND subunit_id IS NULL     AND asset_id IS NULL) OR
    (target_type = 'SUBUNIT' AND subunit_id IS NOT NULL AND asset_id IS NULL) OR
    (target_type = 'ASSET'   AND asset_id   IS NOT NULL)
  )
);
CREATE INDEX inspection_target_mine_idx ON inspection_target (mine_id);
CREATE INDEX inspection_target_inspection_idx ON inspection_target (inspection_id);

-- === assignment (versioned team composition; acceptance recorded) ===

CREATE TABLE inspection_assignment_version (
  id                          TEXT PRIMARY KEY,
  inspection_id               TEXT NOT NULL REFERENCES inspection(id),
  version_no                  INTEGER NOT NULL,
  status                      assignment_version_status NOT NULL DEFAULT 'PROPOSED',
  proposed_by_appointment_id  TEXT REFERENCES appointment(id),
  decided_by_appointment_id   TEXT REFERENCES appointment(id),
  effective_from              TIMESTAMPTZ,
  replaced_by_id              TEXT REFERENCES inspection_assignment_version(id),
  reason                      TEXT,
  created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspection_id, version_no)
);
-- exactly one ACTIVE assignment version per inspection
CREATE UNIQUE INDEX assignment_active_unique ON inspection_assignment_version (inspection_id)
  WHERE status = 'ACTIVE';

CREATE TABLE inspection_assignment_member (
  id                     TEXT PRIMARY KEY,
  assignment_version_id  TEXT NOT NULL REFERENCES inspection_assignment_version(id),
  person_id              TEXT NOT NULL REFERENCES person(id),
  appointment_id         TEXT REFERENCES appointment(id),
  affiliation_id         TEXT REFERENCES affiliation(id),
  participation_role     participation_role NOT NULL,
  assignment_status      assignment_member_status NOT NULL DEFAULT 'OFFERED',
  offered_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  responded_at           TIMESTAMPTZ,
  accepted_at            TIMESTAMPTZ,
  withdrawn_at           TIMESTAMPTZ,
  response_reason        TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_version_id, person_id)
);
-- one LEAD per assignment version (co-leads need explicit type policy + a
-- second version row modelling, kept strict by default)
CREATE UNIQUE INDEX assignment_lead_unique ON inspection_assignment_member (assignment_version_id)
  WHERE participation_role = 'LEAD' AND assignment_status NOT IN ('DECLINED', 'WITHDRAWN', 'REMOVED');

ALTER TABLE inspection ADD CONSTRAINT inspection_lead_member_fk
  FOREIGN KEY (lead_assignment_member_id) REFERENCES inspection_assignment_member(id);

CREATE TABLE assignment_competency (
  id                         TEXT PRIMARY KEY,
  assignment_member_id       TEXT NOT NULL REFERENCES inspection_assignment_member(id),
  competency_id              TEXT NOT NULL REFERENCES inspection_competency(id),
  credential_reference       TEXT,
  verified_at                TIMESTAMPTZ,
  verified_by_appointment_id TEXT REFERENCES appointment(id),
  UNIQUE (assignment_member_id, competency_id)
);

-- === visits, attendance, access ===

CREATE TABLE inspection_visit (
  id                   TEXT PRIMARY KEY,
  inspection_id        TEXT NOT NULL REFERENCES inspection(id),
  visit_number         INTEGER NOT NULL,
  status               visit_status NOT NULL DEFAULT 'PLANNED',
  planned_from         TIMESTAMPTZ,
  planned_until        TIMESTAMPTZ,
  actual_started_at    TIMESTAMPTZ,
  actual_ended_at      TIMESTAMPTZ,
  postponement_reason  TEXT,
  cancellation_reason  TEXT,
  row_version          INTEGER NOT NULL DEFAULT 1,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspection_id, visit_number)
);

CREATE TABLE inspection_visit_target (
  visit_id              TEXT NOT NULL REFERENCES inspection_visit(id),
  inspection_target_id  TEXT NOT NULL REFERENCES inspection_target(id),
  PRIMARY KEY (visit_id, inspection_target_id)
);

-- No-show or refusal never fabricates attendance.
CREATE TABLE inspection_visit_attendance (
  id                    TEXT PRIMARY KEY,
  visit_id              TEXT NOT NULL REFERENCES inspection_visit(id),
  assignment_member_id  TEXT REFERENCES inspection_assignment_member(id),
  person_id             TEXT NOT NULL REFERENCES person(id),
  attendance_role       TEXT NOT NULL,       -- 'INSPECTOR' | 'ESCORT' | 'WITNESS' | ...
  check_in_at           TIMESTAMPTZ,
  check_out_at          TIMESTAMPTZ,
  no_show               BOOLEAN NOT NULL DEFAULT false,
  no_show_reason        TEXT,
  evidence_id           TEXT,                -- FK added in 0005
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX visit_attendance_visit_idx ON inspection_visit_attendance (visit_id);

-- Entry granted/refused, obstruction, emergency access, exit.
CREATE TABLE inspection_access_event (
  id                       TEXT PRIMARY KEY,
  visit_id                 TEXT NOT NULL REFERENCES inspection_visit(id),
  event_type               TEXT NOT NULL,    -- 'ENTRY_GRANTED' | 'ENTRY_REFUSED' | 'OBSTRUCTION' | 'EMERGENCY_ACCESS' | 'EXIT'
  occurred_at              TIMESTAMPTZ NOT NULL,
  recorded_by_principal_id TEXT NOT NULL REFERENCES principal(id),
  details                  JSONB,
  evidence_id              TEXT,             -- FK added in 0005
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- === checklist instance (frozen from the template at start) ===

CREATE TABLE inspection_checklist_instance (
  id                   TEXT PRIMARY KEY,
  inspection_id        TEXT NOT NULL REFERENCES inspection(id),
  template_version_id  TEXT NOT NULL REFERENCES checklist_template_version(id),
  frozen_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (inspection_id)
);

CREATE TABLE inspection_checklist_item (
  id                      TEXT PRIMARY KEY,
  instance_id             TEXT NOT NULL REFERENCES inspection_checklist_instance(id),
  source_item_version_id  TEXT NOT NULL REFERENCES checklist_template_item(id),
  sequence_no             INTEGER NOT NULL,
  mandatory               BOOLEAN NOT NULL DEFAULT true,
  required_competency_id  TEXT REFERENCES inspection_competency(id),
  UNIQUE (instance_id, sequence_no)
);

-- NOT_APPLICABLE / NOT_INSPECTED require a reason. Offline-created: id is a
-- client ULID, idempotent on sync.
CREATE TABLE inspection_response (
  id                                TEXT PRIMARY KEY,   -- client-generated for offline capture
  checklist_item_id                 TEXT NOT NULL REFERENCES inspection_checklist_item(id),
  visit_id                          TEXT REFERENCES inspection_visit(id),
  response                          checklist_response_value NOT NULL,
  measurement                       JSONB,              -- typed scalar {value, unit}
  reason                            TEXT,
  responded_by_assignment_member_id TEXT NOT NULL REFERENCES inspection_assignment_member(id),
  responded_at                      TIMESTAMPTZ NOT NULL,
  row_version                       INTEGER NOT NULL DEFAULT 1,
  created_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                        TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (response NOT IN ('NOT_APPLICABLE', 'NOT_INSPECTED') OR reason IS NOT NULL)
);
CREATE INDEX inspection_response_item_idx ON inspection_response (checklist_item_id);

CREATE TABLE inspection_response_evidence (
  response_id  TEXT NOT NULL REFERENCES inspection_response(id),
  evidence_id  TEXT NOT NULL,               -- FK added in 0005
  PRIMARY KEY (response_id, evidence_id)
);

-- === reports, relations, decisions ===

CREATE TABLE inspection_report (
  id                                 TEXT PRIMARY KEY,
  inspection_id                      TEXT NOT NULL REFERENCES inspection(id),
  report_kind                        inspection_report_kind NOT NULL,
  document_id                        TEXT REFERENCES document(id),
  status                             inspection_report_status NOT NULL DEFAULT 'DRAFT',
  prepared_by_assignment_member_id   TEXT REFERENCES inspection_assignment_member(id),
  reviewed_by_appointment_id         TEXT REFERENCES appointment(id),
  issued_by_appointment_id           TEXT REFERENCES appointment(id),
  issued_at                          TIMESTAMPTZ,
  supersedes_report_id               TEXT REFERENCES inspection_report(id),
  row_version                        INTEGER NOT NULL DEFAULT 1,
  created_at                         TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at                         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX inspection_report_inspection_idx ON inspection_report (inspection_id, status);

CREATE TABLE inspection_relation (
  id                         TEXT PRIMARY KEY,
  from_inspection_id         TEXT NOT NULL REFERENCES inspection(id),
  to_inspection_id           TEXT NOT NULL REFERENCES inspection(id),
  relation_type              inspection_relation_type NOT NULL,
  created_by_appointment_id  TEXT REFERENCES appointment(id),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (from_inspection_id, to_inspection_id, relation_type),
  CHECK (from_inspection_id <> to_inspection_id)
);

-- Append-only decision record: assignment approval, cancellation, issue,
-- reopen, closure. Closure never deletes observations or substitutes for
-- finding/CAPA closure.
CREATE TABLE inspection_decision (
  id                               TEXT PRIMARY KEY,
  inspection_id                    TEXT NOT NULL REFERENCES inspection(id),
  decision_type                    inspection_decision_type NOT NULL,
  outcome                          TEXT NOT NULL,
  decided_by_principal_id          TEXT NOT NULL REFERENCES principal(id),
  supporting_appointment_id        TEXT REFERENCES appointment(id),
  supporting_mandate_assignment_id TEXT REFERENCES mandate_assignment(id),
  policy_version                   TEXT,
  reason                           TEXT,
  decided_at                       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX inspection_decision_inspection_idx ON inspection_decision (inspection_id, decided_at);

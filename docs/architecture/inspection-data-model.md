# Strata — Inspection Relational Model

This is the logical relational contract for [`inspection-spec.md`](../features/inspections/inspection-spec.md). Executable migrations must implement its constraints and concurrency tests.

## Catalogue

- `inspection_type(id, code, name, active)` identifies a logical type.
- `inspection_type_version(id, inspection_type_id, version, allowed_origins, required_mandate_id, checklist_template_version_id, workflow_policy_id, report_policy_id, closure_policy_id, effective_from, effective_until)` freezes behaviour.
- `inspection_competency(id, code, name, verification_policy)` is reference data.
- `inspection_type_competency(inspection_type_version_id, competency_id, participation_role, minimum_count, mandatory)` defines team requirements.

## Inspection and targets

`inspection(id, tenant_id, inspection_type_version_id, origin, creation_mode, status, title, purpose_code, purpose_detail, scheduled_from, scheduled_until, started_at, fieldwork_completed_at, issued_at, closed_at, lead_assignment_id nullable, issuing_authority_id nullable, issuing_authority_unit_id nullable, supporting_mandate_assignment_id nullable, jurisdiction_assignment_id nullable, source_instrument_document_id nullable, regulatory_case_id nullable, created_by_principal_id, row_version, created_at, updated_at)`.

Rules:

- Regulatory origin requires structured authority, mandate, and jurisdiction once confirmed.
- Non-regulatory origin cannot carry regulatory issuing provenance.
- `RECEIVED_NOTICE` begins unconfirmed and stores claimed issuer separately from confirmed authority fields.
- Transition timestamps are server-controlled and append audit/outbox events.

`inspection_target(id, inspection_id, target_type, mine_id, subunit_id nullable, asset_id nullable, purpose, valid_from, valid_until)` uses real foreign keys for the selected target variant. Every target belongs to the inspection tenant. Multi-mine targets require type-version permission.

## Request, planning, and assignment

- `inspection_request(id, tenant_id nullable, requested_origin, requested_type_id, requested_by_principal_id, request_source, source_document_id nullable, priority, reason, desired_window, status, triage_decision, triaged_by_appointment_id, created_at)` preserves intake before an inspection exists.
- `inspection_assignment_version(id, inspection_id, version, status, proposed_by_appointment_id, decided_by_appointment_id, effective_from, replaced_by_id nullable, reason, created_at)` versions team composition.
- `inspection_assignment_member(id, assignment_version_id, person_id, appointment_id nullable, affiliation_id nullable, participation_role, assignment_status, offered_at, responded_at, accepted_at, withdrawn_at, response_reason)` records acceptance rather than assuming availability.
- `assignment_competency(id, assignment_member_id, competency_id, credential_reference_id nullable, verified_at, verified_by_appointment_id)` proves coverage.
- `inspection_handover(id, inspection_id, outgoing_member_id, incoming_member_id, effective_at, reason, open_item_snapshot, evidence_sync_snapshot, safety_briefing_acknowledged_at, authorised_by_appointment_id)` preserves midstream replacement.

The active assignment version is unique per inspection. `lead_assignment_id` references an accepted active member. Start is transactionally blocked until mandatory roles and competencies are satisfied.

## Visits and participation

- `inspection_visit(id, inspection_id, visit_number, status, planned_from, planned_until, actual_started_at, actual_ended_at, postponement_reason, cancellation_reason, row_version)`.
- `inspection_visit_target(visit_id, inspection_target_id)`.
- `inspection_visit_attendance(id, visit_id, assignment_member_id nullable, person_id, attendance_role, check_in_at, check_out_at, no_show, no_show_reason, evidence_id nullable)`.
- `inspection_access_event(id, visit_id, event_type, occurred_at, recorded_by_principal_id, details, evidence_id nullable)` records entry granted/refused, obstruction, emergency access, and exit.

One inspection can span multiple visits. No-show or refusal never fabricates attendance or completion.

## Checklist and observations

- `inspection_checklist_instance(id, inspection_id, template_version_id, frozen_at)`.
- `inspection_checklist_item(id, instance_id, source_item_version_id, sequence, mandatory, required_competency_id nullable)`.
- `inspection_response(id, checklist_item_id, visit_id nullable, response, measurement, reason, responded_by_assignment_member_id, responded_at, row_version)`.
- `inspection_response_evidence(response_id, evidence_id)`.

Response is `COMPLIANT`, `NON_COMPLIANT`, `NOT_APPLICABLE`, or `NOT_INSPECTED`; the latter two require reason. Observation carries nullable `inspection_id`, `inspection_visit_id`, and `inspection_response_id`, plus immutable actor and authority provenance.

## Reports, relations, and closure

- `inspection_report(id, inspection_id, report_kind, document_version_id, status, prepared_by_assignment_member_id, reviewed_by_appointment_id nullable, issued_by_appointment_id nullable, issued_at nullable, supersedes_report_id nullable)`.
- `inspection_relation(id, from_inspection_id, to_inspection_id, relation_type, created_by_appointment_id, created_at)` supports `FOLLOW_UP`, `REINSPECTION`, `APPEAL_REVIEW`, `SUPERSEDES`, and `CASE_MEMBER`.
- `inspection_decision(id, inspection_id, decision_type, outcome, decided_by_principal_id, supporting_appointment_id, supporting_mandate_assignment_id nullable, policy_version, reason, signature_event_id nullable, decided_at)` records assignment approval, cancellation, issue, reopen, and closure.

Reports and decisions are append-only/superseded. Closure never deletes observations or replaces finding/CAPA closure.

## Indexes and constraints

- Unique `(inspection_id, visit_number)` and `(inspection_type_id, version)`.
- Unique active assignment version per inspection.
- One active lead member per assignment version unless type policy explicitly permits co-leads.
- Exclusion constraints prevent overlapping active assignment intervals for the same person where availability policy requires it; approved exceptions are explicit.
- Foreign-key tenant consistency is enforced by composite keys or deferred constraint triggers.
- Index target mine/status/schedule, assignment person/status, authority/status, report status, and overdue transition timestamps.
- Offline-created response/evidence/observation IDs are idempotent and globally unique.

## Migration completion criteria

The inspection schema is complete when internal, regulatory, third-party, received-notice, follow-up, multi-visit, reassignment, handover, refusal/no-show, report supersession, and independent closure paths all pass transactional and authorization tests.

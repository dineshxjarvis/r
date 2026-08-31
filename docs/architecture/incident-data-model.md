# Strata — Incident and Emergency Logical Data Model

## 1. Authority and conventions

This is the logical relational contract for the [incident specification](../features/incidents/incident-and-emergency-spec.md). The foundation identity/authority model owns people, posts, appointments, mandates, jurisdictions, tenants, mines and assets. Attendance owns muster records; evidence owns evidence objects; defects own findings/CAPAs.

UUIDv7 identifiers, UTC timestamps and immutable tenant/resource ownership apply. Occurrence time, device/source time, receipt time and record time are separate. Material correction uses supersession or compensating records, never destructive update.

## 2. Core intake and incident

- `incident_report(id, tenant_id, mine_id, client_report_id, intake_channel, reporter_person_id nullable, reporter_visibility, asserted_occurred_at, occurred_time_lower, occurred_time_upper, received_at, summary, source_system, source_reference, linked_incident_id nullable, disposition, disposition_reason, created_by_principal_id)`
- `incident(id, tenant_id, mine_id, reference_no, confirmed_occurred_at nullable, location_resource_type, location_resource_id nullable, geometry_version_id nullable, summary, operational_severity, status, emergency_state, notification_state, investigation_state, learning_state, created_at, completed_at nullable, version)`
- `incident_report_link(id, report_id, incident_id, link_kind, decided_by_appointment_id, decided_at, reason)` supports merge/link/split provenance; a report is never deleted.
- `incident_classification(id, incident_id, classification_kind, taxonomy_term_id, asserted_value, effective_value, rule_version_id nullable, decided_by_appointment_id, decided_at, supersedes_id nullable, reason)` stores multiple facets rather than one incident-type enum.

Unique `(source_system, source_reference)` when present and `(tenant_id, client_report_id)` for offline idempotency prevent replay without collapsing independent reports.

## 3. Emergency command and containment

- `emergency_activation(id, incident_id, emergency_plan_version_id, declared_at, declared_by_appointment_id, area_snapshot, state, controlled_at nullable, demobilized_at nullable)`
- `command_assignment(id, emergency_activation_id, commander_appointment_id, assumed_at, relieved_at nullable, source_route_resolution_id, handover_note, supersedes_id nullable)`; exclusion prevents overlapping active commanders unless plan policy explicitly allows unified command.
- `incident_scene_control(id, incident_id, zone_or_geometry_ref, controlled_from, released_at nullable, controlled_by_appointment_id, released_by_appointment_id nullable, reason, hold_state)`
- `containment_action(id, incident_id, target_type, target_id, instruction, priority, assigned_post_id, status, started_at nullable, completed_at nullable, transferred_capa_id nullable, version)`
- `containment_action_event(id, containment_action_id, event_type, occurred_at, actor_appointment_id, reason, evidence_id nullable)`

## 4. People, casualties and muster links

- `incident_person(id, incident_id, person_id nullable, external_person_snapshot, involvement_kind, contractor_organization_id nullable, shift_id nullable, identity_confidence, created_at)`
- `casualty_update(id, incident_person_id, consequence_kind, effective_at, recorded_at, recorded_by_appointment_id, work_capacity_effect, medical_source_reference nullable, supersedes_id nullable)`
- `incident_muster_link(id, incident_id, muster_session_id, linked_at, linked_by_appointment_id)` references attendance-owned muster.
- `family_contact_task(id, incident_person_id, responsible_post_id, verified_contact_source, state, created_at, completed_at nullable)` and `family_contact_attempt(id, task_id, attempted_at, actor_appointment_id, channel, outcome, confirmation_reference, restricted_note)` govern next-of-kin communication separately from statutory notice.

Names and sensitive fields use field-level classification and projection policy. Anonymous/unknown casualties can be reconciled later without rewriting original reports.

## 5. Rule catalogue and notification obligations

- `incident_notification_rule(id, rule_key, governing_instrument_id, rule_version, effective_from, effective_until nullable, applicability_schema_version, applicability_expression, recipient_authority_id nullable, recipient_kind, deadline_rule, immediate_intimation_rule nullable, form_template_id nullable, channel_policy_id, required_capability_id, required_assurance, follow_up_trigger, status, published_by_appointment_id, published_at)`
- `incident_rule_evaluation(id, incident_id, rule_id, evaluated_at, facts_snapshot_hash, result, explanation, evaluator_kind, reviewed_by_appointment_id nullable, supersedes_id nullable)`
- `incident_notification_obligation(id, incident_id, rule_evaluation_id, recipient_authority_id nullable, recipient_snapshot, due_at, state, prepared_payload_hash nullable, form_template_version nullable, signer_appointment_id nullable, signed_at nullable, acknowledgement_id nullable, version)`
- `incident_notification_attempt(id, obligation_id, channel, attempted_at, attempted_by_principal_id, adapter_id nullable, payload_hash, transport_state, transport_reference, failure_code nullable, next_retry_at nullable)`
- `incident_notification_acknowledgement(id, obligation_id, received_at, source, external_reference, acknowledgement_kind, payload_hash nullable, recorded_by_principal_id, verified_at nullable)`
- `incident_classification_override(id, incident_id, prior_result, proposed_result, reason, proposed_by_appointment_id, reviewed_by_appointment_id nullable, decision, decided_at nullable)`

Rule publication requires legal/safety governance. Runtime users cannot edit an effective rule while evaluating an incident. Rules are superseded with non-overlapping effective intervals.

## 6. Investigation and learning

- `incident_investigation(id, incident_id, investigation_kind, terms_of_reference, commissioned_by_appointment_id, commissioned_at, due_at, state, issued_report_document_id nullable, issued_at nullable, version)`
- `investigation_member(id, investigation_id, person_id, appointment_id nullable, participation_role, joined_at, left_at nullable, conflict_declaration, recused_at nullable)`
- `investigation_evidence_manifest(id, investigation_id, manifest_version, evidence_refs, manifest_hash, frozen_at, frozen_by_appointment_id)`
- `investigation_conclusion(id, investigation_id, conclusion_kind, taxonomy_term_id nullable, narrative, confidence, source_refs, approved_in_report_version)`
- `incident_action_link(id, incident_id, investigation_id nullable, containment_action_id nullable, observation_id nullable, defect_id nullable, finding_id nullable, capa_id nullable, link_kind, linked_at)`
- `safety_lesson(id, incident_id, issued_report_version, audience_selector, lesson_content, published_at, published_by_appointment_id, supersedes_id nullable)`

Exactly one target is populated on each `incident_action_link`. External domain deletion is prohibited while a link exists; domain retirement preserves reference.

## 7. Derived state and closure

`incident_completion_projection` derives emergency, muster, notification, investigation, containment and learning gates. It is rebuildable and cannot be updated directly. `incident.complete` locks the incident, re-evaluates every gate transactionally and rejects if any critical exception is unowned.

Long-term CAPAs may remain open after operational/statutory incident completion. `learning_state` remains `OPEN` until required linked actions close, preserving the distinction on dashboards.

## 8. Audit, events and constraints

The incident transaction writes domain state, `domain_audit_event` and outbox atomically. Events include report received, incident confirmed, emergency activated/controlled, commander changed, casualty updated, notification obligation created/due/sent/acknowledged/rejected, investigation issued, containment transferred and completion gate changed.

Required constraints/tests:

1. Offline client/source idempotency does not merge independent reporters.
2. Incident/report tenant and mine agree.
3. Notification rule effective intervals do not overlap for the same key/context.
4. Obligation retains the rule evaluation and facts snapshot that created it.
5. Transport attempt cannot directly set `ACKNOWLEDGED`.
6. Classification downgrade requires a different authorized reviewer when policy requires.
7. Command assignment cannot point to expired appointment at assumption time.
8. Scene release cannot violate active evidence/legal hold without authorized resolution.
9. Original casualty/report/classification rows remain after correction.
10. Completion gate reads current referenced states under transaction/concurrency control.
11. Family-contact details are excluded from ordinary incident and notification projections.
12. Degraded-operation records carry device signature, continuity-policy version and reconciliation status; prohibited high-risk actions cannot use that path.

## 9. Operability records

- `emergency_contact_route(id, mine_id nullable, authority_id nullable, purpose, effective_from, effective_until nullable, channel, destination_ciphertext, source_instrument, verified_at, next_review_at, status)`
- `emergency_contact_test(id, route_id, tested_at, test_kind, result, latency_ms nullable, failure_reason nullable, performed_by_principal_id)`
- `degraded_emergency_record(id, tenant_id, mine_id, device_id, local_sequence, command_kind, payload, occurred_time_bounds, actor_claim, witness_claim nullable, device_signature, continuity_policy_version, received_at nullable, reconciliation_state, reconciled_by_appointment_id nullable)`

Contact destinations are encrypted/restricted. Uniqueness on `(device_id, local_sequence)` makes replay idempotent. Only continuity-policy allowlisted commands can be accepted from degraded records.

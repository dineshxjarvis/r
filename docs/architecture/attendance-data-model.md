# Attendance, Presence and Muster — Logical Data Model

Read with the [attendance specification](../features/attendance/presence-and-attendance-spec.md), [contractor eligibility model](contractor-data-model.md), [incident model](incident-data-model.md) and the future governed GIS model. This model replaces the legacy one-pair `attendance_record` design.

## 1. Shift and expected population

- `shift`: mine, operational calendar, start/end instants, timezone, cross-midnight rule and lifecycle.
- `shift_roster_version`: immutable mine/operator or contractor submission with submitter authority and supersession.
- `shift_roster_entry`: person, affiliation/direct employer, contractor engagement/package, work kind, expected zones, shift responsibility and eligibility-decision snapshot.
- `shift_validation`: mine-side accept/reject/conditional decision per roster entry with reasons.

## 2. Credentials and checkpoints

- `attendance_credential`: opaque external credential reference, kind, issuer/device trust class and state; no raw biometric template.
- `credential_assignment`: person, credential, validity, source and general or shift-specific scope.
- `credential_issue_return`: shift-specific cap-lamp/tag issue/return event and responsible appointment.
- `checkpoint`: governed mine/zone/topology node, direction semantics and effective geometry reference.
- `checkpoint_device`: checkpoint, trust/configuration version, health state, clock policy and public key.
- `device_health_interval`: online/degraded/offline/calibration/clock state and evidence.

## 3. Immutable observations and projections

- `presence_event`: person, shift, event kind, checkpoint/zone, server and device times, sequence, credential assignment, device/evidence, actor/witness, source trust and contractor/package snapshot.
- `device_ingest_batch`: signed source envelope, sequence range, receipt, duplicate/replay and reconciliation state.
- `presence_transition_evaluation`: prior state, event, topology/policy version, outcome and anomaly reasons.
- `presence_projection`: rebuildable last-confirmed/inferred/stale/conflicted/unknown state with source time, coverage and version.
- `attendance_session_projection`: rebuildable work interval interpretation; never the source record.
- `attendance_exception`: missing/unexpected/impossible/duplicate/stale/device/eligibility/credential/close exception with severity and owner route.
- `attendance_correction`: proposed compensating interpretation referencing immutable events, impact manifest and approval lifecycle.

## 4. Shift reconciliation and register

- `shift_reconciliation`: roster/event/eligibility/device-coverage manifest, open exceptions, decision and version.
- `attendance_register_generation`: exact event/correction/policy cut, template version, hash, generated time and state.
- `attendance_register_attestation`: signer appointment/authority, signature, timestamp and print/copy acknowledgement.
- `attendance_export_delivery`: payroll/contractor-billing consumer, manifest, delivery state and acknowledgement; never canonical attendance.

## 5. Emergency muster

- `muster_session`: incident, mine, opened-at event cut, inclusion policy/version, state and commanding context.
- `muster_expected_person`: person, last-confirmed presence, source/freshness/confidence, exposure class and immutable inclusion reason.
- `muster_response`: person, response kind, observation source, checkpoint/location, responder/witness, time and supersession link.
- `muster_person_projection`: `EXPECTED`, `CONFIRMED_SAFE`, `POTENTIALLY_EXPOSED`, `RESCUED_OR_EVACUATED`, `MEDICAL_TRANSFER`, `UNRESOLVED` with latest evidence.
- `muster_handover`: unresolved person, receiving response/rescue authority and acknowledgement.

## 6. Required constraints

1. Presence events are append-only; correction never updates or deletes an event.
2. Device events are idempotent on device plus boot/session plus monotonically increasing sequence; hash-identical retries return the original result and altered reuse is rejected.
3. Device time is never silently substituted for server time; uncertainty and clock status are retained.
4. A credential assignment cannot overlap for two people in the same usable scope unless explicitly quarantined as a conflict.
5. Every event snapshots person, direct employer, package and eligibility reference as known then; later changes do not rewrite it.
6. Multiple `BELOWGROUND_ENTRY`/`SURFACE_RETURN` pairs per person/shift are permitted and ordered.
7. Projection transitions use effective topology and policy versions and are fully rebuildable.
8. Missing device coverage produces `UNKNOWN`/exception, never inferred absence or safety.
9. Manual events require current recording authority, reason, witness/source and offline/online assurance.
10. Correction proposer cannot approve the same material correction.
11. Register generation cannot reach `READY_TO_ATTEST` with unaccepted critical exceptions.
12. An attested register is immutable; later corrections create a new superseding generation and preserve both.
13. Muster opening freezes an expected-person input cut but permits append-only responses and governed additions.
14. `CONFIRMED_SAFE` requires a muster response under policy and does not mutate pre-incident presence.
15. Muster cannot close with unresolved people unless each has an acknowledged formal handover/escalation permitted by policy.
16. Biometric match references are opaque; biometric templates and diagnostic/medical data are not stored here.

## 7. Key lifecycles

```text
shift: PLANNED → ROSTER_OPEN → ACTIVE → RECONCILING → CLOSED
                                      ↘ EMERGENCY_ACTIVE
correction: PROPOSED → UNDER_REVIEW → APPROVED | REJECTED | WITHDRAWN
register: DRAFT → READY_TO_ATTEST → ATTESTED → SUPERSEDED
muster: OPEN → ACTIVE → RECONCILING → CLOSED
```

All material transitions write audit and outbox events atomically. Projection lag is visible and cannot be presented as current state.

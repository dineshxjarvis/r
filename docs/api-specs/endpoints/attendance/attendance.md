# Attendance — shifts, credentials, presence, reconciliation, register, and muster

Domain rules: [`../../../features/attendance/presence-and-attendance-spec.md`](../../../features/attendance/presence-and-attendance-spec.md). Relational contract: [`../../../architecture/attendance-data-model.md`](../../../architecture/attendance-data-model.md). Conventions: [`../../README.md`](../../README.md).

This model replaces the legacy one-pair `attendance_record` design ([`../evidence/attendance.md`](../evidence/attendance.md) is withdrawn). CMR 2017 Reg. 40(3) requires recording **every** belowground transition within a shift, so presence is an **append-only event stream** and everything readable — sessions, the presence board, the register — is a rebuildable projection over it.

**Missing device coverage produces `UNKNOWN`, never inferred absence and never inferred safety.** That single rule is why this domain can be trusted during an emergency.

## Routes

| Route | Purpose |
|---|---|
| `GET /shifts` · `POST /shifts` · `GET /shifts/{id}` · `POST /shifts/{id}/actions` | Shift lifecycle and reconciliation |
| `GET /shift-roster-versions` · `POST /shift-roster-versions` · `POST /shift-roster-versions/{id}/actions` | Immutable roster submissions and mine-side validation |
| `GET /attendance-credentials` · `POST /attendance-credentials` · `POST /attendance-credentials/{id}/actions` | Opaque credential references |
| `GET /credential-assignments` · `POST /credential-assignments` · `POST /credential-assignments/{id}/actions` | Issue and return, general or shift-scoped |
| `GET /checkpoint-devices?view=topology` · `GET /checkpoint-devices` · `POST /checkpoint-devices` · `POST /checkpoint-devices/{id}/actions` | Checkpoint topology and device health |
| `POST /presence-events` · `GET /presence-events` | Append-only ingestion, device batch or manual |
| `GET /presence-events?view=presence` | Current state per person, with freshness |
| `GET /presence-events?view=sessions` | Rebuildable work-interval interpretation |
| `GET /attendance-exceptions` · `POST /attendance-exceptions/{id}/actions` | The queue that must be cleared before a register |
| `GET /attendance-corrections` · `POST /attendance-corrections` · `POST /attendance-corrections/{id}/actions` | Compensating interpretation, never an edit |
| `GET /attendance-registers` · `POST /attendance-registers` · `POST /attendance-registers/{id}/actions` | Statutory generation and attestation |
| `GET /muster-sessions` · `POST /muster-sessions` · `GET /muster-sessions/{id}` · `POST /muster-sessions/{id}/actions` | Emergency roll call |

The former `/checkpoints` collection is `GET /checkpoint-devices?view=topology`. It returns checkpoint nodes with their attached device references; the default view remains the device inventory.

The presence board is `GET /presence-events?view=presence&filter[shift_id]=…`. Per-person presence is the same view filtered by `person_id`; interpreted work intervals use `view=sessions`. Both are rebuildable projections over the same event stream and share freshness, authorization, and pagination semantics.

---

## POST /shifts · POST /shift-roster-versions

**Auth:** `attendance.shift.manage` on the mine; roster submission additionally accepts a contractor party with a current engagement.

### Request — shift

```json
{
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "operational_calendar_code": "THREE_SHIFT_CONTINUOUS",
  "shift_code": "B",
  "shift_date": "2026-10-05",
  "starts_at": "2026-10-05T08:00:00Z",
  "ends_at": "2026-10-05T16:00:00Z",
  "timezone": "Asia/Kolkata",
  "cross_midnight_rule": "ATTRIBUTE_TO_START_DATE",
  "extensions": {}
}
```

### Request — roster version

```json
{
  "shift_id": "shft_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "submitter_kind": "CONTRACTOR",
  "submitting_organization_id": "org_01HZX5E6F7G8H9J0K1T2M3N400",
  "entries": [
    {
      "person_id": "per_01HZYA0B1C2D3E4F5G6H7J8K90",
      "affiliation_id": "aff_01HZY2B3C4D5E6F7G8H9J0K1T0",
      "direct_employer_organization_id": "org_01HZY3C4D5E6F7G8H9J0K1T2M0",
      "contractor_engagement_id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300",
      "contractor_package_id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0",
      "work_kind": "OVERBURDEN_REMOVAL",
      "expected_zones": [{ "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0" }],
      "shift_responsibility": "HEMM_OPERATOR",
      "exposure_class": "SURFACE"
    }
  ],
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Roster version 2 submitted; 1 of 412 entries flagged",
  "data": {
    "id": "srv_01HZY4D5E6F7G8H9J0K1T2M3N0",
    "object": "shift_roster_version",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "SUBMITTED",
    "available_actions": ["VALIDATE", "SUPERSEDE"],
    "shift": { "type": "shift", "id": "shft_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "Gevra OCP, B shift, 2026-10-05" },
    "version_number": 2,
    "submitter_kind": "CONTRACTOR",
    "submitting_organization": { "type": "organization", "id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Acme Mining Services Pvt Ltd" },
    "submitted_by": { "type": "person", "id": "per_01HZYK9T0M1N203P4Q5R6S7T80", "display": "M. Naik" },
    "submitted_by_appointment_id": "app_01HZY5E6F7G8H9J0K1T2M3N400",
    "submitted_at": "2026-10-04T18:00:00Z",
    "entry_count": 412,
    "supersedes_id": "srv_01HZY6F7G8H9J0K1T2M3N405P0",
    "immutable": true,
    "eligibility_snapshot_summary": { "eligible": 411, "not_eligible": 1, "not_evaluated": 0 },
    "flagged_entries": [
      { "person_id": "per_01HZYA0B1C2D3E4F5G6H7J8K90", "eligibility_decision_id": "celd_01HZYD3E4F5G6H7J8K9T0M1N20", "result": "NOT_ELIGIBLE", "blocking_reasons": [{ "code": "REQUIREMENT_EXPIRED", "requirement_display": "Site safety induction" }] }
    ],
    "validation": null,
    "created_at": "2026-10-04T18:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/shift-roster-versions/srv_01HZY4D5E6F7G8H9J0K1T2M3N0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-04T18:00:00Z", "effects": [ { "object": "notification", "count": 2, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

Each entry snapshots its **eligibility decision reference as known at submission**. A later requirement expiry does not rewrite this roster; it produces an exception at the gate instead.

`VALIDATE` records the mine-side accept, reject, or conditional decision **per entry**, with reasons.

---

## POST /presence-events

**Auth:** the checkpoint-device service principal for batches; `attendance.record_manual` for manual events, which additionally require a reason, a witness or source, and offline/online assurance.

Idempotent on `(device_id, boot_session_id, sequence_no)`. A **hash-identical retry returns the original result**; the same sequence with altered content is rejected as a replay.

### Request — device batch

```json
{
  "source": "DEVICE_BATCH",
  "ingest_batch": {
    "device_id": "ckdv_01HZY7G8H9J0K1T2M3N405P6Q0",
    "boot_session_id": "boot_01HZY8H9J0K1T2M3N405P6Q7R0",
    "sequence_from": 884120,
    "sequence_to": 884122,
    "envelope_signature": "ed25519:9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "device_clock_status": "SYNCHRONISED",
    "device_clock_offset_ms": 84
  },
  "events": [
    { "sequence_no": 884120, "person_ref": { "kind": "CREDENTIAL", "credential_assignment_id": "cras_01HZY9J0K1T2M3N405P6Q7R8S0" }, "event_kind": "BELOWGROUND_ENTRY", "checkpoint_id": "ckpt_01HZYA0B1C2D3E4F5G6H7J8K90", "device_time": "2026-10-05T08:12:41Z" },
    { "sequence_no": 884121, "person_ref": { "kind": "CREDENTIAL", "credential_assignment_id": "cras_01HZYB1C2D3E4F5G6H7J8K9T00" }, "event_kind": "BELOWGROUND_ENTRY", "checkpoint_id": "ckpt_01HZYA0B1C2D3E4F5G6H7J8K90", "device_time": "2026-10-05T08:12:47Z" },
    { "sequence_no": 884122, "person_ref": { "kind": "CREDENTIAL", "credential_assignment_id": "cras_01HZY9J0K1T2M3N405P6Q7R8S0" }, "event_kind": "SURFACE_RETURN", "checkpoint_id": "ckpt_01HZYA0B1C2D3E4F5G6H7J8K90", "device_time": "2026-10-05T10:40:02Z" }
  ]
}
```

### Request — manual event

```json
{
  "source": "MANUAL",
  "events": [
    {
      "person_id": "per_01HZYC2D3E4F5G6H7J8K9T0M10",
      "shift_id": "shft_01HZY1A2B3C4D5E6F7G8H9J0K0",
      "event_kind": "SURFACE_RETURN",
      "checkpoint_id": "ckpt_01HZYA0B1C2D3E4F5G6H7J8K90",
      "occurred_at": "2026-10-05T14:20:00Z",
      "reason": "Cap-lamp tag failed to read at the portal reader; return witnessed by the shift overman",
      "witness": { "person_id": "per_01HZYD3E4F5G6H7J8K9T0M1N20", "appointment_id": "app_01HZYE4F5G6H7J8K9T0M1N2030" },
      "assurance_mode": "ONLINE",
      "evidence_id": "ev_01HZYF5G6H7J8K9T0M1N203P40"
    }
  ]
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "3 events ingested",
  "data": {
    "batch": {
      "id": "dgib_01HZYG6H7J8K9T0M1N203P4Q50",
      "object": "device_ingest_batch",
      "device_id": "ckdv_01HZY7G8H9J0K1T2M3N405P6Q0",
      "boot_session_id": "boot_01HZY8H9J0K1T2M3N405P6Q7R0",
      "sequence_from": 884120,
      "sequence_to": 884122,
      "received_at": "2026-10-05T10:41:14Z",
      "signature_valid": true,
      "duplicate_count": 0,
      "replay_rejected_count": 0,
      "reconciliation_state": "RECONCILED",
      "gap_detected": false
    },
    "requested": 3,
    "created": 3,
    "replayed": 0,
    "failed": 0,
    "results": [
      {
        "sequence_no": 884120,
        "status": 201,
        "id": "pev_01HZYH7J8K9T0M1N203P4Q5R60",
        "object": "presence_event",
        "person": { "type": "person", "id": "per_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "[restricted]" },
        "shift_id": "shft_01HZY1A2B3C4D5E6F7G8H9J0K0",
        "event_kind": "BELOWGROUND_ENTRY",
        "checkpoint": { "type": "checkpoint", "id": "ckpt_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "No. 2 incline portal" },
        "zone": { "type": "mine_subunit", "id": "sub_01HZYJ8K9T0M1N203P4Q5R6S70", "display": "Seam III district" },
        "device_time": "2026-10-05T08:12:41Z",
        "server_time": "2026-10-05T08:12:41.912Z",
        "time_used_for_projection": "SERVER",
        "device_clock_status": "SYNCHRONISED",
        "device_clock_offset_ms": 84,
        "time_uncertainty_ms": 500,
        "sequence_no": 884120,
        "credential_assignment_id": "cras_01HZY9J0K1T2M3N405P6Q7R8S0",
        "source_trust": "DEVICE_ATTESTED",
        "actor": null,
        "witness": null,
        "snapshot": {
          "direct_employer_organization_id": "org_01HZY3C4D5E6F7G8H9J0K1T2M0",
          "contractor_engagement_id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300",
          "contractor_package_id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0",
          "eligibility_decision_id": "celd_01HZYK9T0M1N203P4Q5R6S7T80",
          "captured_at": "2026-10-05T08:12:41.912Z"
        },
        "append_only": true,
        "links": { "self": "/api/v1/presence-events/pev_01HZYH7J8K9T0M1N203P4Q5R60" }
      },
      { "sequence_no": 884121, "status": 201, "id": "pev_01HZYT0M1N203P4Q5R6S7T8V90", "event_kind": "BELOWGROUND_ENTRY", "server_time": "2026-10-05T08:12:47.310Z" },
      { "sequence_no": 884122, "status": 201, "id": "pev_01HZYM1N203P4Q5R6S7T8V9V00", "event_kind": "SURFACE_RETURN", "server_time": "2026-10-05T10:40:02.554Z" }
    ],
    "transition_evaluations": [
      { "event_id": "pev_01HZYH7J8K9T0M1N203P4Q5R60", "prior_state": "SURFACE", "outcome": "VALID", "new_state": "BELOWGROUND", "topology_version": 7, "policy_version": 4, "anomaly_reasons": [] },
      { "event_id": "pev_01HZYM1N203P4Q5R6S7T8V9V00", "prior_state": "BELOWGROUND", "outcome": "VALID", "new_state": "SURFACE", "topology_version": 7, "policy_version": 4, "anomaly_reasons": [] }
    ]
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-05T10:41:14Z", "effects": [ { "object": "presence_projection", "count": 2, "change": "REBUILT" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

**Device time is never silently substituted for server time.** Both are stored, `time_used_for_projection` says which drove the state machine, and `device_clock_status` plus `time_uncertainty_ms` travel with the event.

**Multiple entry/return pairs per person per shift are permitted and ordered** — the whole reason the legacy design was withdrawn.

### Response — 207, impossible transition

```json
{
  "success": true,
  "message": "3 of 4 events ingested; 1 anomaly recorded",
  "data": {
    "requested": 4,
    "created": 4,
    "replayed": 0,
    "failed": 0,
    "transition_evaluations": [
      {
        "event_id": "pev_01HZYN203P4Q5R6S7T8V9V0W10",
        "prior_state": "BELOWGROUND",
        "outcome": "ANOMALOUS",
        "new_state": "CONFLICTED",
        "topology_version": 7,
        "policy_version": 4,
        "anomaly_reasons": [
          { "code": "IMPOSSIBLE_TRANSIT_TIME", "detail": "Portal-to-portal transit of 42 s against a topology minimum of 11 min", "severity": "HIGH" }
        ],
        "exception_id": "aexc_01HZY03P4Q5R6S7T8V9V0W1X20"
      }
    ]
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-05T11:00:00Z", "effects": [ { "object": "attendance_exception", "id": "aexc_01HZY03P4Q5R6S7T8V9V0W1X20", "change": "CREATED" }, { "object": "notification", "count": 2, "change": "CREATED" } ] }
}
```

The event is **still stored**. An impossible transition is a fact about the data, and deleting it would destroy the only evidence that a credential was probably shared.

---

## GET /presence-events?view=presence

**Auth:** `attendance.read` on the mine; person-level detail is purpose-limited.

Filters: `shift_id`, `person_id`, `mine_id`, `state`, `filter[freshness]=STALE`, `filter[zone.id]`, `as_of`.

```json
{
  "success": true,
  "data": [
    {
      "id": "pprj_01HZYP4Q5R6S7T8V9V0W1X2Y30",
      "object": "presence_projection",
      "version": 14,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "BELOWGROUND",
      "person": { "type": "person", "id": "per_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "[restricted]" },
      "shift": { "type": "shift", "id": "shft_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "Gevra OCP, B shift, 2026-10-05" },
      "current_zone": { "type": "mine_subunit", "id": "sub_01HZYJ8K9T0M1N203P4Q5R6S70", "display": "Seam III district" },
      "confidence": "CONFIRMED",
      "source_event_id": "pev_01HZYH7J8K9T0M1N203P4Q5R60",
      "source_time": "2026-10-05T08:12:41.912Z",
      "freshness": "CURRENT",
      "staleness": "PT2H14M",
      "coverage": { "checkpoint_coverage_percent": "100.0", "degraded_devices": [] },
      "projection_version": 14,
      "projection_lag": "PT0.4S",
      "links": { "self": "/api/v1/presence-events/projections/pprj_01HZYP4Q5R6S7T8V9V0W1X2Y30", "events": "/api/v1/presence-events?filter[person_id]=per_01HZYA0B1C2D3E4F5G6H7J8K90&filter[shift_id]=shft_01HZY1A2B3C4D5E6F7G8H9J0K0" }
    },
    {
      "id": "pprj_01HZYQ5R6S7T8V9V0W1X2Y3Z40",
      "object": "presence_projection",
      "version": 3,
      "state": "UNKNOWN",
      "person": { "type": "person", "id": "per_01HZYR6S7T8V9V0W1X2Y3Z4A50", "display": "[restricted]" },
      "shift": { "type": "shift", "id": "shft_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "Gevra OCP, B shift, 2026-10-05" },
      "current_zone": null,
      "confidence": "UNKNOWN",
      "source_event_id": "pev_01HZYS7T8V9V0W1X2Y3Z4A5B60",
      "source_time": "2026-10-05T08:04:00Z",
      "freshness": "STALE",
      "staleness": "PT6H22M",
      "coverage": { "checkpoint_coverage_percent": "62.5", "degraded_devices": [{ "device_id": "ckdv_01HZYT8V9V0W1X2Y3Z4A5B6C70", "state": "OFFLINE", "since": "2026-10-05T09:14:00Z" }] },
      "unknown_reason": "DEVICE_COVERAGE_GAP",
      "projection_version": 3,
      "projection_lag": "PT0.4S",
      "links": { "self": "/api/v1/presence-events/projections/pprj_01HZYQ5R6S7T8V9V0W1X2Y3Z40" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 412, "total_pages": 21, "has_next": true, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-05T10:26:00Z", "projection_lag": "PT0.4S", "projection_rebuilt_at": "2026-10-05T10:25:59.6Z" }
}
```

`projection_lag` is on **every** response. Projection lag is visible and can never be presented as current state — a board showing 412 people as of four minutes ago must say so, especially during an evacuation.

The second row is the important one. A person with a coverage gap is `UNKNOWN` with `unknown_reason`, not `SURFACE`. The system never infers that somebody got out.

---

## POST /attendance-corrections · actions

**Auth:** `attendance.correction.propose`; approval needs `attendance.correction.approve` and **must be a different person** for a material correction.

A correction is a **compensating interpretation referencing immutable events**. It never updates or deletes a presence event.

```json
{
  "shift_id": "shft_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "person_id": "per_01HZYR6S7T8V9V0W1X2Y3Z4A50",
  "correction_kind": "INFER_SURFACE_RETURN",
  "references_event_ids": ["pev_01HZYS7T8V9V0W1X2Y3Z4A5B60"],
  "proposed_interpretation": { "event_kind": "SURFACE_RETURN", "occurred_at": "2026-10-05T14:05:00Z", "checkpoint_id": "ckpt_01HZYA0B1C2D3E4F5G6H7J8K90", "basis": "Cap-lamp returned to the lamp room at 14:07 per the issue/return log; portal reader was offline from 09:14" },
  "reason": "Portal reader ckdv_01HZYT8V9V0W1X2Y3Z4A5B6C70 was offline for the second half of the shift; return corroborated by the lamp-room return record and the overman's shift log",
  "supporting_evidence_ids": ["ev_01HZYV9V0W1X2Y3Z4A5B6C7D80"],
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Correction proposed; awaiting independent approval",
  "data": {
    "id": "acor_01HZYV0W1X2Y3Z4A5B6C7D8E90",
    "object": "attendance_correction",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PROPOSED",
    "available_actions": ["APPROVE", "REJECT", "WITHDRAW"],
    "shift": { "type": "shift", "id": "shft_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "Gevra OCP, B shift, 2026-10-05" },
    "person": { "type": "person", "id": "per_01HZYR6S7T8V9V0W1X2Y3Z4A50", "display": "[restricted]" },
    "correction_kind": "INFER_SURFACE_RETURN",
    "references_event_ids": ["pev_01HZYS7T8V9V0W1X2Y3Z4A5B60"],
    "proposed_interpretation": { "event_kind": "SURFACE_RETURN", "occurred_at": "2026-10-05T14:05:00Z", "checkpoint_id": "ckpt_01HZYA0B1C2D3E4F5G6H7J8K90", "basis": "Cap-lamp returned to the lamp room at 14:07 per the issue/return log; portal reader was offline from 09:14" },
    "reason": "Portal reader ckdv_01HZYT8V9V0W1X2Y3Z4A5B6C70 was offline for the second half of the shift; return corroborated by the lamp-room return record and the overman's shift log",
    "impact_manifest": {
      "affected_projections": ["pprj_01HZYQ5R6S7T8V9V0W1X2Y3Z40"],
      "affected_sessions": ["asess_01HZYW1X2Y3Z4A5B6C7D8E9F00"],
      "affected_exceptions": ["aexc_01HZYX2Y3Z4A5B6C7D8E9F0G10"],
      "affected_register_generations": [],
      "belowground_duration_change": { "from": "PT6H22M_UNBOUNDED", "to": "PT6H01M" },
      "manifest_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3"
    },
    "material": true,
    "separation_policy": { "rule": "APPROVER_NOT_PROPOSER", "applies_because": "material = true" },
    "proposed_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "proposed_at": "2026-10-05T16:30:00Z",
    "decision": null,
    "events_modified": false,
    "created_at": "2026-10-05T16:30:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/attendance-corrections/acor_01HZYV0W1X2Y3Z4A5B6C7D8E90" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-05T16:30:00Z", "effects": [ { "object": "approval_request", "count": 1, "change": "CREATED" } ] }
}
```

`events_modified: false` appears on every correction, always false. `impact_manifest` states exactly what the correction would change **before** anyone approves it.

---

## POST /attendance-registers · actions

**Auth:** `attendance.register.generate`; attestation needs `attendance.register.attest` with the required signing assurance.

```json
{
  "shift_id": "shft_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "template_version": "CMR_2017_REG40_FORM_B_v2",
  "cut": { "events_through": "2026-10-05T18:00:00Z", "corrections_through": "2026-10-05T17:45:00Z", "policy_version": 4, "topology_version": 7 },
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Register generated; 1 critical exception blocks attestation",
  "data": {
    "id": "areg_01HZYY3Z4A5B6C7D8E9F0G1H20",
    "object": "attendance_register_generation",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "DRAFT",
    "available_actions": ["REGENERATE", "DISCARD"],
    "shift": { "type": "shift", "id": "shft_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "Gevra OCP, B shift, 2026-10-05" },
    "template_version": "CMR_2017_REG40_FORM_B_v2",
    "cut": { "events_through": "2026-10-05T18:00:00Z", "corrections_through": "2026-10-05T17:45:00Z", "policy_version": 4, "topology_version": 7 },
    "row_count": 412,
    "belowground_person_count": 188,
    "transition_count": 431,
    "generation_hash": "sha256:7d1a9c4e2f6b830d5ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c",
    "generated_at": "2026-10-05T18:05:00Z",
    "generated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "blocking_exceptions": [
      { "id": "aexc_01HZYX2Y3Z4A5B6C7D8E9F0G10", "kind": "MISSING_SURFACE_RETURN", "severity": "CRITICAL", "person_id": "per_01HZYR6S7T8V9V0W1X2Y3Z4A50", "state": "OPEN", "owner_post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0" }
    ],
    "ready_to_attest": false,
    "supersedes_id": null,
    "attestation": null,
    "created_at": "2026-10-05T18:05:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/attendance-registers/areg_01HZYY3Z4A5B6C7D8E9F0G1H20" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-05T18:05:00Z" }
}
```

A register **cannot reach `READY_TO_ATTEST` with unaccepted critical exceptions**. A person who went below ground and has no recorded return is not a formatting problem.

### ATTEST

```json
{
  "action": "ATTEST",
  "expected_version": 3,
  "payload": { "signing_identity_id": "sign_01HZY8H9J0K1T2M3N405P6Q7R0", "print_copy_acknowledged": true, "print_copy_reference": "GEV/REG40/2026-10-05/B" },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Register attested",
  "data": {
    "id": "areg_01HZYY3Z4A5B6C7D8E9F0G1H20",
    "object": "attendance_register_generation",
    "version": 4,
    "state": "ATTESTED",
    "ready_to_attest": true,
    "immutable": true,
    "attestation": {
      "id": "arat_01HZYZ4A5B6C7D8E9F0G1H2130",
      "signer": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
      "signer_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
      "signer_post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
      "signature_event_id": "sig_01HZZ0A5B6C7D8E9F0G1H213J0",
      "signed_at": "2026-10-05T19:00:00Z",
      "print_copy_acknowledged": true,
      "print_copy_reference": "GEV/REG40/2026-10-05/B"
    },
    "available_actions": []
  },
  "meta": {
    "action": "ATTEST",
    "transition": { "from": "READY_TO_ATTEST", "to": "ATTESTED" },
    "effects": [ { "object": "attendance_register_attestation", "id": "arat_01HZYZ4A5B6C7D8E9F0G1H2130", "change": "CREATED" }, { "object": "signature_event", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-10-05T19:00:00Z"
  }
}
```

An attested register is **immutable**. A later correction produces a **new superseding generation**, and both remain readable — the register as attested that evening, and the corrected one, each with its own hash.

Payroll and contractor-billing exports are `attendance_export_delivery` records. They are **never canonical attendance**.

---

## POST /muster-sessions · actions

**Auth:** `emergency.muster.manage`, or created automatically by an emergency activation ([`../incidents/incidents.md`](../incidents/incidents.md)).

Opening a muster **freezes an expected-person input cut** while permitting append-only responses and governed additions.

```json
{
  "incident_id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "inclusion_policy": { "policy_code": "BELOWGROUND_PLUS_AFFECTED_ZONE", "policy_version": 3, "affected_zones": [{ "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0" }], "include_stale_presence": true, "include_unknown_presence": true },
  "commanding_context": { "emergency_activation_id": "emac_01HZZK9T0M1N203P4Q5R6S7T80", "commander_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0" },
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Muster opened; 412 expected persons",
  "data": {
    "id": "mus_01HZZC2D3E4F5G6H7J8K9T0M10",
    "object": "muster_session",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["RECORD_RESPONSE", "ADD_PERSON", "HANDOVER", "CLOSE"],
    "incident": { "type": "incident", "id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0", "display": "INC-2026-0417" },
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "opened_at": "2026-09-14T03:54:00Z",
    "event_cut_at": "2026-09-14T03:53:58Z",
    "inclusion_policy": { "policy_code": "BELOWGROUND_PLUS_AFFECTED_ZONE", "policy_version": 3, "include_stale_presence": true, "include_unknown_presence": true },
    "commanding_context": { "emergency_activation_id": "emac_01HZZK9T0M1N203P4Q5R6S7T80", "commander_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0" },
    "expected_person_count": 412,
    "tally": { "EXPECTED": 412, "CONFIRMED_SAFE": 0, "POTENTIALLY_EXPOSED": 0, "RESCUED_OR_EVACUATED": 0, "MEDICAL_TRANSFER": 0, "UNRESOLVED": 0 },
    "inclusion_breakdown": [
      { "reason": "BELOWGROUND_AT_CUT", "count": 188 },
      { "reason": "IN_AFFECTED_ZONE_AT_CUT", "count": 194 },
      { "reason": "PRESENCE_STALE", "count": 24 },
      { "reason": "PRESENCE_UNKNOWN", "count": 6 }
    ],
    "closed_at": null,
    "created_at": "2026-09-14T03:54:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/muster-sessions/mus_01HZZC2D3E4F5G6H7J8K9T0M10" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T03:54:00Z", "effects": [ { "object": "muster_expected_person", "count": 412, "change": "CREATED" }, { "object": "notification", "count": 412, "change": "CREATED" } ] }
}
```

The 24 stale and 6 unknown people are **included by policy**. An evacuation roll call that only lists people the sensors are confident about is the exact failure this design exists to prevent.

### RECORD_RESPONSE

```json
{
  "action": "RECORD_RESPONSE",
  "expected_version": 8,
  "payload": {
    "responses": [
      { "person_id": "per_01HZYA0B1C2D3E4F5G6H7J8K90", "response_kind": "CONFIRMED_SAFE", "observation_source": "ASSEMBLY_POINT_ROLL_CALL", "checkpoint_id": "ckpt_01HZZ1B6C7D8E9F0G1H213J4K0", "responder_appointment_id": "app_01HZYE4F5G6H7J8K9T0M1N2030", "occurred_at": "2026-09-14T04:12:00Z" },
      { "person_id": "per_01HZYR6S7T8V9V0W1X2Y3Z4A50", "response_kind": "MEDICAL_TRANSFER", "observation_source": "FIRST_AID_POST", "responder_appointment_id": "app_01HZZ2C7D8E9F0G1H213J4K5T0", "witness_person_id": "per_01HZZ3D8E9F0G1H213J4K5T6M0", "occurred_at": "2026-09-14T04:20:00Z", "detail": "Transferred to AIIMS Bilaspur, ambulance CG04-AB-1142" }
    ]
  }
}
```

```json
{
  "success": true,
  "message": "2 responses recorded",
  "data": {
    "id": "mus_01HZZC2D3E4F5G6H7J8K9T0M10",
    "object": "muster_session",
    "version": 9,
    "state": "ACTIVE",
    "tally": { "EXPECTED": 6, "CONFIRMED_SAFE": 401, "POTENTIALLY_EXPOSED": 2, "RESCUED_OR_EVACUATED": 2, "MEDICAL_TRANSFER": 1, "UNRESOLVED": 0 },
    "unresolved_person_count": 6,
    "responses_recorded": 2,
    "pre_incident_presence_mutated": false,
    "available_actions": ["RECORD_RESPONSE", "ADD_PERSON", "HANDOVER", "CLOSE"]
  },
  "meta": {
    "action": "RECORD_RESPONSE",
    "transition": null,
    "effects": [ { "object": "muster_response", "count": 2, "change": "CREATED" }, { "object": "muster_person_projection", "count": 2, "change": "REBUILT" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T04:20:00Z"
  }
}
```

`CONFIRMED_SAFE` requires a **muster response under policy** — a card reader at the surface portal is not a roll call — and **does not mutate pre-incident presence**. `pre_incident_presence_mutated: false` is stated on every response batch.

### CLOSE — 409 unresolved people

```json
{
  "success": false,
  "message": "Muster cannot close with unresolved people and no acknowledged handover",
  "error": {
    "code": "INVALID_STATE",
    "details": {
      "unresolved_person_count": 6,
      "unresolved": [
        { "person_id": "per_01HZZ4E9F0G1H213J4K5T6M7N0", "state": "UNRESOLVED", "last_known_presence": { "state": "UNKNOWN", "source_time": "2026-09-14T02:40:00Z", "staleness": "PT1H14M", "reason": "DEVICE_COVERAGE_GAP" }, "handover": null }
      ],
      "policy": { "policy_code": "BELOWGROUND_PLUS_AFFECTED_ZONE", "policy_version": 3, "close_with_unresolved_permitted": true, "requires_acknowledged_handover": true },
      "resolution": "Record an acknowledged handover to the rescue or response authority for each unresolved person"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

A muster **cannot close with unresolved people** unless each has an acknowledged formal handover or escalation that policy permits. "We stopped counting" is not a close condition.

---

## Invariants

- Presence events are append-only. A correction is a compensating interpretation and never updates or deletes an event.
- Device events are idempotent on device, boot session, and monotonic sequence; an identical retry returns the original, an altered reuse is rejected.
- Device time is never silently substituted for server time; uncertainty and clock status are retained.
- A credential assignment cannot overlap for two people in the same usable scope unless explicitly quarantined as a conflict.
- Every event snapshots person, direct employer, package, and eligibility reference as known then; later changes never rewrite it.
- Multiple belowground entry/return pairs per person per shift are permitted and ordered.
- Projections use effective topology and policy versions, are fully rebuildable, and always report their lag.
- Missing device coverage produces `UNKNOWN` or an exception, never inferred absence and never inferred safety.
- Manual events require current recording authority, a reason, a witness or source, and an assurance mode.
- A material correction's proposer cannot approve it.
- A register cannot reach `READY_TO_ATTEST` with unaccepted critical exceptions, and an attested register is immutable and superseded rather than edited.
- Payroll and billing exports are deliveries, never canonical attendance.
- Muster opening freezes an expected-person cut; responses stay append-only, `CONFIRMED_SAFE` needs a real response, and closing needs every unresolved person handed over.
- Biometric match references are opaque. No biometric template and no diagnostic or medical data is stored here.

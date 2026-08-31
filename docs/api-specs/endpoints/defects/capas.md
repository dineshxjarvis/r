# Defects — CAPAs and the closure gate

Table: `capa` (`data-model.md §3`). ReBAC: `capa` type — `viewer: assigned_to or viewer from for_finding`, `can_update: assigned_to` (`authorization-spec.md §3`). Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/defect-management/defect-spec.md`](../../../features/defect-management/defect-spec.md).

There is **no `POST /capas`** at the root — every CAPA is created inline by `POST /findings` or by `action: "ADD_CAPA"` on a finding ([`findings.md`](findings.md)). This file is the lifecycle only.

**Verification authority is not a fixed relation.** `PERMISSION_BY_SEVERITY` (`defect-spec.md §8`) picks `close_minor` / `close_significant` / `close_severe` from `finding.severity`, `Check()`'d against the finding directly via `capa.for_finding` — the same three-rung ladder that governs closing the finding itself, since verifying the last CAPA is what closes it (`data-model.md §3.4`).

## Routes

| Route | Purpose |
|---|---|
| `GET /capas` · `GET /capas/{id}` · `GET /capas/{id}/history` | Register and single read |
| `POST /capas/{id}/actions` | Assign, submit, verify, reject, extend, reassign |
| `POST /capas/actions` | Bulk over a filter |

---

## GET /capas/{id}

**Auth:** `finding.read` on the parent finding, or assignee self-read under CAPA party policy.

Query: `expand=finding,defect,evidence,verification_attempts,assignee`, `as_of`.

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "object": "capa",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "OPEN",
    "available_actions": ["ASSIGN", "EXTEND_DEADLINE"],
    "finding": { "type": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "display": "Absence of haul road edge protection" },
    "defect": { "type": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "display": "Safety berm missing, east haul road" },
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "corrective_action": "Reinstate 40m of missing berm along east haul road edge to 1.5m height",
    "preventive_action": "Add berm integrity check to the daily haul road inspection checklist",
    "corrective_action_i18n": { "en": "Reinstate 40m of missing berm along east haul road edge to 1.5m height", "hi": "पूर्वी हॉल रोड किनारे 40 मीटर बर्म को 1.5 मीटर ऊँचाई तक पुनर्स्थापित करें" },
    "assigned_to": null,
    "assigned_to_organization_id": null,
    "assigned_by": null,
    "assigned_at": null,
    "due_on": "2026-09-13",
    "original_due_on": "2026-09-13",
    "days_to_due": 14,
    "overdue": false,
    "status": "OPEN",
    "submitted_by": null,
    "submitted_at": null,
    "verified_by": null,
    "verified_at": null,
    "rejection_reason": null,
    "extension_count": 0,
    "last_extension_reason": null,
    "last_extended_at": null,
    "verification_policy": {
      "required_capability": "finding.close_severe",
      "resolved_from": "PERMISSION_BY_SEVERITY(finding.severity = SEVERE)",
      "required_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
      "required_assurance": "PASSKEY",
      "separation_policy": "VERIFIER_NOT_SUBMITTER_NOT_ASSIGNEE",
      "operator_may_verify": false,
      "policy_version": 5
    },
    "evidence_summary": { "linked": 0, "verified": 0, "suspect": 0, "unverified": 0 },
    "counts": { "verification_attempts": 0 },
    "created_at": "2026-08-30T09:50:00Z",
    "created_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "updated_at": "2026-08-30T09:50:00Z",
    "updated_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "extensions": {},
    "links": {
      "self": "/api/v1/capas/capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "history": "/api/v1/capas/capa_01HZZAAB1C2D3E4F5G6H7J8K90/history",
      "evidence": "/api/v1/evidence?filter[for_capa_id]=capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "verification_attempts": "/api/v1/evidence?view=verification_attempts&filter[capa_id]=capa_01HZZAAB1C2D3E4F5G6H7J8K90"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:52:00Z" }
}
```

`verification_policy.resolved_from` names the severity rung that produced the requirement, so an assignee can see *why* their manager cannot sign this one off before they submit and wait.

---

## GET /capas

**Auth:** results clipped to CAPAs covered by `finding.read` or assignee self-read.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[finding_id]` · `filter[defect_id]` · `filter[mine_id]` | | |
| `filter[assigned_to]` | `per_01H…` | "My open CAPAs" |
| `filter[assigned_to_organization_id]` | `org_01H…` | A contractor's queue |
| `filter[status]` | `OPEN,IN_PROGRESS,SUBMITTED,REOPENED` | |
| `filter[severity]` | `SEVERE` | Via the parent finding |
| `filter[due_on][lte]` | `2026-09-30` | |
| `filter[overdue]` | `true` | |
| `filter[overdue_days][gte]` | `14` | Ageing buckets |
| `filter[extension_count][gte]` | `2` | The repeated-extension risk view |
| `filter[is_regulatory]` | `true` | Via the parent finding |
| `sort` | `due_on`, `-extension_count`, `-severity` | |
| `view` | `view=my_open_capas` | |
| `group_by` + `metrics` | `group_by=assigned_to_organization_id,status&metrics=count` | Contractor performance without a bespoke route |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "object": "capa",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "OPEN",
      "finding": { "type": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "display": "Absence of haul road edge protection" },
      "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "corrective_action": "Reinstate 40m of missing berm along east haul road edge to 1.5m height",
      "status": "OPEN",
      "severity": "SEVERE",
      "due_on": "2026-09-13",
      "overdue": false,
      "assigned_to": null,
      "extension_count": 0,
      "links": { "self": "/api/v1/capas/capa_01HZZAAB1C2D3E4F5G6H7J8K90" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:53:00Z" }
}
```

---

## POST /capas/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `ASSIGN` | `capa.assign` on the parent finding | optional | required | `OPEN` or `REOPENED` | `status = IN_PROGRESS` |
| `REASSIGN` | `capa.assign` | **required** | required | `IN_PROGRESS`, `SUBMITTED`, `REOPENED` | New assignee; submission state cleared if resubmission is required |
| `SUBMIT` | `capa.update` — normally the current assignee or responsible organisation | optional | required | `IN_PROGRESS` or `REOPENED`, ≥1 linked evidence row | `status = SUBMITTED`; parent finding → `PENDING_VERIFICATION` |
| `VERIFY` | `capa.verify` resolved by `PERMISSION_BY_SEVERITY` on the parent finding | required on override and on reject | required | `SUBMITTED`, verifier ≠ submitter ≠ assignee, gate passes | `VERIFIED_CLOSED` or `REOPENED`; may cascade finding and defect closure |
| `EXTEND_DEADLINE` | `capa.extend_deadline` under the parent finding's policy | **required** | required | not `VERIFIED_CLOSED` | New `due_on`, `extension_count++` |

### ASSIGN

```json
{
  "action": "ASSIGN",
  "expected_version": 1,
  "payload": { "assigned_to": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "assigned_to_organization_id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "notify": true }
}
```

The assignee must be an eligible current person or party for that finding — a lapsed contractor worker or an expired appointment is `422 UNPROCESSABLE` with the failing link named.

```json
{
  "success": true,
  "message": "CAPA assigned",
  "data": {
    "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "object": "capa",
    "version": 2,
    "state": "IN_PROGRESS",
    "status": "IN_PROGRESS",
    "assigned_to": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "assigned_to_organization_id": "org_01HZX5E6F7G8H9J0K1T2M3N400",
    "assigned_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "assigned_at": "2026-08-30T09:55:00Z",
    "available_actions": ["SUBMIT", "REASSIGN", "EXTEND_DEADLINE"]
  },
  "meta": {
    "action": "ASSIGN",
    "transition": { "from": "OPEN", "to": "IN_PROGRESS" },
    "effects": [
      { "object": "notification", "count": 2, "change": "CREATED" },
      { "object": "outbox_event", "count": 1, "change": "CREATED", "note": "OpenFGA assigned_to tuple" },
      { "object": "audit_event", "id": "aud_01HZZV9V0W1X2Y3Z4A5B6C7D80", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T09:55:00Z"
  }
}
```

### SUBMIT

*"The assignee says it is done"* (`defect-spec.md §7.2`). Requires ≥1 evidence row with `for_capa_id` equal to this CAPA (`data-model.md §3.4`). Evidence itself is created through the [`evidence/`](../evidence/evidence.md) domain; this call only checks it exists and flips status.

```json
{
  "action": "SUBMIT",
  "expected_version": 2,
  "payload": { "completion_note": "Berm reinstated to 1.6m along the full 40m; four geotagged photos and the survey trace attached" }
}
```

```json
{
  "success": true,
  "message": "Submitted for verification",
  "data": {
    "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "object": "capa",
    "version": 3,
    "state": "SUBMITTED",
    "status": "SUBMITTED",
    "submitted_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "submitted_at": "2026-08-30T14:20:00Z",
    "evidence_summary": { "linked": 5, "verified": 4, "suspect": 0, "unverified": 1 },
    "available_actions": []
  },
  "meta": {
    "action": "SUBMIT",
    "transition": { "from": "IN_PROGRESS", "to": "SUBMITTED" },
    "effects": [
      { "object": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "change": "STATE", "to": "PENDING_VERIFICATION" },
      { "object": "notification", "count": 3, "change": "CREATED", "note": "Verification queued to holders of finding.close_severe at this authority" },
      { "object": "audit_event", "id": "aud_01HZZV0W1X2Y3Z4A5B6C7D8E90", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T14:20:00Z"
  }
}
```

Errors: `409 INVALID_STATE` when not `IN_PROGRESS`/`REOPENED`; `422 UNPROCESSABLE` when no evidence row exists with `for_capa_id` equal to this CAPA, with `details.required: "At least one evidence row linked to this CAPA"`.

### VERIFY

**Two gates, not one.** `can_close_with()` ([`../evidence/verification-attempts.md`](../evidence/verification-attempts.md)) runs **first, automatically, before any human decision is honoured.** This is the flagship mechanism (`feasibility-and-roadmap.md §4`: *submit closure evidence captured away from the target, show the explainable `DISTANCE_MISMATCH`, show the blocked closure*).

Every call to this action — whichever outcome — writes one `evidence_verification_attempt` row (`data-model.md §4.3`), so a blocked attempt is a permanent, drillable record rather than a transient error toast.

```text
1. Server evaluates can_close_with(capa_id) against evidence WHERE for_capa_id = capa_id.
2. If the result is anything other than ACCEPTED or ACCEPTED_WITH_OVERRIDE, the request stops.
   payload.decision is never read. Response is 422 with the specific blocked code.
3. Only once the gate passes does the caller's decision (ACCEPT / REJECT) apply.
```

#### Accept

```json
{
  "action": "VERIFY",
  "expected_version": 3,
  "payload": { "decision": "ACCEPT", "verification_note": "Berm height and continuity confirmed against survey trace and four geotagged photos" },
  "supporting_authority": {
    "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
    "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
    "delegation_id": null,
    "break_glass_grant_id": null
  }
}
```

```json
{
  "success": true,
  "message": "CAPA verified and closed",
  "data": {
    "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "object": "capa",
    "version": 4,
    "state": "VERIFIED_CLOSED",
    "status": "VERIFIED_CLOSED",
    "verified_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "verified_at": "2026-08-30T15:00:00Z",
    "available_actions": []
  },
  "included": {
    "evidence_verification_attempt:va_01HZZBBC2D3E4F5G6H7J8K9T00": {
      "id": "va_01HZZBBC2D3E4F5G6H7J8K9T00",
      "object": "evidence_verification_attempt",
      "capa_id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "outcome": "ACCEPTED",
      "gate_results": [
        { "gate": "DISTANCE", "passed": true, "distance_m": "3.2", "threshold_m": "50.0", "evidence_id": "ev_01HZZN203P4Q5R6S7T8V9V0W10" },
        { "gate": "GEOFENCE", "passed": true, "within_geofence": true },
        { "gate": "VERIFIED_COUNT", "passed": true, "verified": 4, "required": 1 },
        { "gate": "METADATA_INTEGRITY", "passed": true, "hash_chain_valid": true },
        { "gate": "MOCK_LOCATION", "passed": true }
      ],
      "attempted_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
      "attempted_at": "2026-08-30T15:00:00Z",
      "override_by": null,
      "override_reason": null
    }
  },
  "meta": {
    "action": "VERIFY",
    "transition": { "from": "SUBMITTED", "to": "VERIFIED_CLOSED" },
    "effects": [
      { "object": "evidence_verification_attempt", "id": "va_01HZZBBC2D3E4F5G6H7J8K9T00", "change": "CREATED" },
      { "object": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "change": "STATE", "to": "CLOSED", "note": "Every CAPA on this finding is now VERIFIED_CLOSED" },
      { "object": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "change": "STATE", "to": "CLOSED", "note": "Every finding on this defect is now CLOSED" },
      { "object": "authorization_decision", "id": "azd_01HZZW1X2Y3Z4A5B6C7D8E9F00", "change": "CREATED" },
      { "object": "notification", "count": 5, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZX2Y3Z4A5B6C7D8E9F0G10", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T15:00:00Z"
  }
}
```

#### Reject

A human judgment call — *the evidence is usable but does not actually show the fix* — distinct from the gate blocking outright, which means *the evidence is not usable at all*. Both remain possible after the gate passes.

```json
{
  "action": "VERIFY",
  "expected_version": 3,
  "reason": "East section still shows a 2m gap in the repaired berm; the photo set does not cover the full 40m",
  "payload": { "decision": "REJECT", "rejection_detail": { "uncovered_extent_m": "2.0", "requested_evidence": ["Continuous photo run of the full 40m", "Survey trace with chainage marks"] } }
}
```

```json
{
  "success": true,
  "message": "CAPA rejected and reopened",
  "data": {
    "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "object": "capa",
    "version": 4,
    "state": "REOPENED",
    "status": "REOPENED",
    "rejection_reason": "East section still shows a 2m gap in the repaired berm; the photo set does not cover the full 40m",
    "submitted_by": null,
    "submitted_at": null,
    "available_actions": ["SUBMIT", "REASSIGN", "EXTEND_DEADLINE"]
  },
  "included": {
    "evidence_verification_attempt:va_01HZZBBC2D3E4F5G6H7J8K9T00": {
      "id": "va_01HZZBBC2D3E4F5G6H7J8K9T00",
      "object": "evidence_verification_attempt",
      "outcome": "ACCEPTED",
      "gate_results": [
        { "gate": "DISTANCE", "passed": true, "distance_m": "3.2", "threshold_m": "50.0" },
        { "gate": "GEOFENCE", "passed": true, "within_geofence": true },
        { "gate": "VERIFIED_COUNT", "passed": true, "verified": 4, "required": 1 },
        { "gate": "METADATA_INTEGRITY", "passed": true },
        { "gate": "MOCK_LOCATION", "passed": true }
      ],
      "human_decision": "REJECT",
      "attempted_at": "2026-08-30T15:00:00Z"
    }
  },
  "meta": {
    "action": "VERIFY",
    "transition": { "from": "SUBMITTED", "to": "REOPENED" },
    "effects": [
      { "object": "evidence_verification_attempt", "id": "va_01HZZBBC2D3E4F5G6H7J8K9T00", "change": "CREATED" },
      { "object": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "change": "STATE", "to": "CAPA_ASSIGNED" },
      { "object": "notification", "count": 2, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZY3Z4A5B6C7D8E9F0G1H20", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T15:00:00Z"
  }
}
```

The attempt row records `outcome: "ACCEPTED"` **and** `human_decision: "REJECT"` — the gate passed, the human still said no. Collapsing those two into one field would lose exactly the distinction the mechanism exists to make.

#### Override

Permitted **only** when the gate blocked on `BLOCKED_SUSPECT_EVIDENCE`, and only for a principal holding `can_override_verdict` (`manager` at the evidence's mine).

```json
{
  "action": "VERIFY",
  "expected_version": 3,
  "reason": "Device flagged mock-location due to a known GPS drift bug on this handset build; cross-checked against the worker's RFID cap-lamp log for the same timestamps",
  "payload": {
    "decision": "ACCEPT",
    "override": {
      "gate_code": "BLOCKED_SUSPECT_EVIDENCE",
      "corroborating_references": [
        { "type": "attendance_event", "id": "att_01HZZ45E6F7G8H9J0K1T2M3N40" },
        { "type": "device_incident", "id": "dinc_01HZZZ4A5B6C7D8E9F0G1H2130" }
      ]
    }
  },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "CAPA verified with override",
  "data": {
    "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "object": "capa",
    "version": 4,
    "state": "VERIFIED_CLOSED",
    "status": "VERIFIED_CLOSED",
    "verified_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "verified_at": "2026-08-30T15:10:00Z",
    "closed_with_override": true,
    "available_actions": []
  },
  "included": {
    "evidence_verification_attempt:va_01HZZ0B5C6D7E8F9G0H112J3K0": {
      "id": "va_01HZZ0B5C6D7E8F9G0H112J3K0",
      "object": "evidence_verification_attempt",
      "outcome": "ACCEPTED_WITH_OVERRIDE",
      "gate_results": [
        { "gate": "DISTANCE", "passed": true, "distance_m": "3.2", "threshold_m": "50.0" },
        { "gate": "GEOFENCE", "passed": true, "within_geofence": true },
        { "gate": "VERIFIED_COUNT", "passed": true, "verified": 3, "required": 1 },
        { "gate": "METADATA_INTEGRITY", "passed": true },
        { "gate": "MOCK_LOCATION", "passed": false, "evidence_id": "ev_01HZZN203P4Q5R6S7T8V9V0W10", "overridden": true }
      ],
      "override_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
      "override_reason": "Device flagged mock-location due to a known GPS drift bug on this handset build; cross-checked against the worker's RFID cap-lamp log for the same timestamps",
      "corroborating_references": [
        { "type": "attendance_event", "id": "att_01HZZ45E6F7G8H9J0K1T2M3N40" },
        { "type": "device_incident", "id": "dinc_01HZZZ4A5B6C7D8E9F0G1H2130" }
      ],
      "attempted_at": "2026-08-30T15:10:00Z"
    }
  },
  "meta": {
    "action": "VERIFY",
    "transition": { "from": "SUBMITTED", "to": "VERIFIED_CLOSED" },
    "effects": [
      { "object": "evidence_verification_attempt", "id": "va_01HZZ0B5C6D7E8F9G0H112J3K0", "change": "CREATED", "note": "outcome ACCEPTED_WITH_OVERRIDE" },
      { "object": "security_event", "id": "sec_01HZZ1C6D7E8F9G0H112J3K4T0", "change": "CREATED", "note": "Override loudly logged, same discipline as break-glass access" },
      { "object": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "change": "STATE", "to": "CLOSED" },
      { "object": "notification", "count": 6, "change": "CREATED", "note": "Override notified to the mine manager's superior and the compliance lead" },
      { "object": "audit_event", "id": "aud_01HZZ2D7E8F9G0H112J3K4T5M0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T15:10:00Z"
  }
}
```

#### VERIFY — 422 gate blocked

```json
{
  "success": false,
  "message": "Closure evidence was captured 1.84 km from the target",
  "error": {
    "code": "BLOCKED_DISTANCE_MISMATCH",
    "details": {
      "verification_attempt_id": "va_01HZZ3E8F9G0H112J3K4T5M6N0",
      "gate_results": [
        { "gate": "DISTANCE", "passed": false, "distance_m": "1840.2", "threshold_m": "50.0", "evidence_id": "ev_01HZZ4F9G0H112J3K4T5M6N700", "target": { "type": "asset", "id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0", "display": "HR-12 North haul road segment" } },
        { "gate": "GEOFENCE", "passed": false, "within_geofence": false, "evidence_id": "ev_01HZZ4F9G0H112J3K4T5M6N700" }
      ],
      "overridable": false,
      "overridable_reason": "DISTANCE is a physical fact, not a trust judgment. can_override_verdict applies only to evidence.verdict, never to distance.",
      "resolution": "Capture closure evidence at the repaired section and resubmit"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

The blocked attempt is still persisted. `GET /evidence?view=verification_attempts&filter[capa_id]=…` shows it, so "we tried to close this three times from the wrong place" is a visible pattern rather than three dismissed toasts.

### Gate codes

| Code | Condition | Overridable |
|---|---|---|
| `BLOCKED_DISTANCE_MISMATCH` | Captured `location` falls outside the target's geofence radius | **No** — a physical fact, not a trust judgment |
| `BLOCKED_ALL_UNVERIFIED` | Every linked evidence row has `verdict = UNVERIFIED` | No |
| `BLOCKED_SUSPECT_EVIDENCE` | ≥1 linked evidence row is `verdict = SUSPECT` and no override supplied | **Yes**, only by `can_override_verdict` |
| `BLOCKED_METADATA_TAMPERED` | Hash-chain or device-integrity check failed on linked evidence | No |

Other errors: `409 INVALID_STATE` when not `SUBMITTED`; `422 UNPROCESSABLE` when the caller is `submitted_by` or `assigned_to` (no self-verification); `400 VALIDATION_ERROR` when `decision: "REJECT"` carries no `reason`.

### EXTEND_DEADLINE

Extension is a signed, audited decision — never a plain field update.

```json
{
  "action": "EXTEND_DEADLINE",
  "expected_version": 2,
  "reason": "Spare parts for the guard rail fabrication are on a 2-week supplier lead time, documented in procurement ticket PR-4471",
  "payload": { "new_due_on": "2026-09-27", "supporting_document_id": "doc_01HZZ5G0H112J3K4T5M6N708P0" },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Deadline extended to 2026-09-27",
  "data": {
    "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "object": "capa",
    "version": 3,
    "state": "IN_PROGRESS",
    "due_on": "2026-09-27",
    "original_due_on": "2026-09-13",
    "extension_count": 1,
    "last_extension_reason": "Spare parts for the guard rail fabrication are on a 2-week supplier lead time, documented in procurement ticket PR-4471",
    "last_extended_at": "2026-09-10T10:00:00Z",
    "extension_history": [
      { "from_due_on": "2026-09-13", "to_due_on": "2026-09-27", "reason": "Spare parts for the guard rail fabrication are on a 2-week supplier lead time, documented in procurement ticket PR-4471", "extended_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" }, "extended_at": "2026-09-10T10:00:00Z", "supporting_document_id": "doc_01HZZ5G0H112J3K4T5M6N708P0" }
    ],
    "available_actions": ["SUBMIT", "REASSIGN", "EXTEND_DEADLINE"]
  },
  "meta": {
    "action": "EXTEND_DEADLINE",
    "transition": null,
    "effects": [
      { "object": "authorization_decision", "id": "azd_01HZZ6H112J3K4T5M6N708P9Q0", "change": "CREATED" },
      { "object": "notification", "count": 3, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ712J3K4T5M6N708P9Q0R0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-10T10:00:00Z"
  }
}
```

Errors: `400 VALIDATION_ERROR` when `reason` is missing or `new_due_on <= due_on`; `409 INVALID_STATE` when `status` is `VERIFIED_CLOSED` — nothing to extend on a closed CAPA.

Repeated extensions on one CAPA are a **named risk-engine input** (`defect-spec.md §7.3`). `extension_count` and `original_due_on` are exposed on every read specifically so the dashboard can surface them, rather than the pattern being buried in the audit trail.

---

## POST /capas/actions

Bulk `ASSIGN`, `REASSIGN`, and `EXTEND_DEADLINE` over a filter, per-target authorization, `207` on mixed outcomes.

```json
{
  "action": "ASSIGN",
  "filter": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "status": "OPEN", "severity": "MINOR" },
  "payload": { "assigned_to": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0" },
  "reason": "Minor haul-road CAPAs consolidated under the road maintenance supervisor after the roster change",
  "atomic": false
}
```

```json
{
  "success": true,
  "message": "7 of 8 assigned",
  "data": {
    "requested": 8,
    "succeeded": 7,
    "failed": 1,
    "results": [
      { "id": "capa_01HZZ8J3K4T5M6N708P9Q0R1S0", "status": 200, "version": 2, "state": "IN_PROGRESS" },
      { "id": "capa_01HZZ9K4T5M6N708P9Q0R1S2T0", "status": 200, "version": 2, "state": "IN_PROGRESS" },
      { "id": "capa_01HZZAT5M6N708P9Q0R1S2T3V0", "status": 422, "error": { "code": "UNPROCESSABLE", "message": "Assignee has no current engagement covering this finding's responsible organisation" } }
    ]
  },
  "meta": { "action": "ASSIGN", "effects": [ { "object": "notification", "count": 14, "change": "CREATED" }, { "object": "audit_event", "count": 7, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-09-10T10:05:00Z" }
}
```

Bulk `VERIFY` is refused with `400 VALIDATION_ERROR`. A closure gate that can be cleared for a hundred CAPAs in one click is not a gate.

---

## Invariants

- No root `POST /capas`. Every CAPA is created with its finding, or added to one explicitly.
- Verification authority is resolved by severity through `PERMISSION_BY_SEVERITY`, not by a fixed relation, and the resolution is returned on every read.
- The evidence gate runs before the human decision, always, and writes an attempt row whichever way it goes.
- `DISTANCE` and metadata-integrity failures are never overridable — only a trust judgment on `evidence.verdict` is.
- Every override is loudly logged with a `security_event`, its reason, and its corroborating references, exactly like break-glass access.
- Extension is an audited decision with a stored history and a preserved `original_due_on`; the deadline can move but the record of it moving cannot.

# Workflow — approval requests and decisions

Table: `approval` (`data-model.md §4.6`). No dedicated ReBAC type — resolved via `required_post_id` (whoever currently holds that post, per `resolve_responsible()`) or `internal_viewer` at the subject's mine. Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/workflow-spec.md`](../../../features/workflow-spec.md).

**Scope note.** `authorization-spec.md §12` explicitly places multi-signature approval chains ("two signatures for SEVERE closure") **out of scope** for this build — *workflow, not authorisation; different component; roadmap*. Nothing in `documents/` or `defects/` currently creates an `approval` row as an automatic side effect. The table exists because `dashboard-spec.md`'s "awaiting my approval" summary reads it (`data-model.md §5.3`). `POST /approvals` is a general-purpose manual request: the generic mechanism is built, and no specific business trigger is wired to it yet.

## Routes

| Route | Purpose |
|---|---|
| `GET /approvals` · `POST /approvals` | Request and queue |
| `GET /approvals/{id}` · `POST /approvals/{id}/actions` · `GET /approvals/{id}/history` | Decision |
| `POST /approvals/actions` | Bulk decision over a filter |

---

## POST /approvals

**Auth:** `approval.request` on the subject. The requested decision policy determines the concrete required post and capability — the requester names what it wants approved, not who is entitled to approve it.

`Idempotency-Key` required.

### Request

```json
{
  "subject": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90" },
  "approval_type": "CAPA_CLOSURE_SIGNOFF",
  "required_post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0",
  "requested_reason": "SEVERE-linked CAPA; area office sign-off requested before the regional inspector's verification visit",
  "due_at": "2026-09-05T00:00:00Z",
  "supporting_references": [
    { "type": "evidence", "id": "ev_01HZZDD2E3F4G5H6J7K8T9M0N1" },
    { "type": "evidence_verification_attempt", "id": "va_01HZZBBC2D3E4F5G6H7J8K9T00" }
  ],
  "extensions": {}
}
```

`required_post_id` is optional. When omitted, the server resolves the eligible post from the approval policy for `approval_type` at the subject's scope, and returns what it resolved.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Approval requested",
  "data": {
    "id": "appr_01HZZMM9N0P1Q2R3S4T5V6V7W0",
    "object": "approval",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PENDING",
    "available_actions": ["DECIDE", "WITHDRAW", "REASSIGN"],
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "subject": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Reinstate 40m berm, east haul road" },
    "subject_type": "CAPA",
    "subject_ref": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "approval_type": "CAPA_CLOSURE_SIGNOFF",
    "required_post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
    "required_capability": "approval.decide",
    "resolved_from_policy": { "policy_id": "apol_01HZZSS5V6V7W8X9Y0Z1A2B3C0", "policy_version": 2 },
    "current_eligible_holders": [
      { "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" }, "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0" }
    ],
    "requested_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "requested_via_appointment_id": "app_01HZY3B4C5D6E7F8G9H0J1K2T0",
    "requested_reason": "SEVERE-linked CAPA; area office sign-off requested before the regional inspector's verification visit",
    "supporting_references": [
      { "type": "evidence", "id": "ev_01HZZDD2E3F4G5H6J7K8T9M0N1", "display": "Reinstated berm, chainage 1.22 km" },
      { "type": "evidence_verification_attempt", "id": "va_01HZZBBC2D3E4F5G6H7J8K9T00", "display": "ACCEPTED, 3.2 m from target" }
    ],
    "decision": "PENDING",
    "decided_by": null,
    "decided_at": null,
    "decided_via_appointment_id": null,
    "reason": null,
    "signature_id": null,
    "due_at": "2026-09-05T00:00:00Z",
    "overdue": false,
    "withdrawn_at": null,
    "created_at": "2026-08-30T10:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "updated_at": "2026-08-30T10:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "extensions": {},
    "links": {
      "self": "/api/v1/approvals/appr_01HZZMM9N0P1Q2R3S4T5V6V7W0",
      "history": "/api/v1/approvals/appr_01HZZMM9N0P1Q2R3S4T5V6V7W0/history",
      "subject": "/api/v1/capas/capa_01HZZAAB1C2D3E4F5G6H7J8K90"
    }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T10:00:00Z",
    "effects": [
      { "object": "notification", "count": 1, "change": "CREATED", "note": "Routed to current holders of the required post" },
      { "object": "audit_event", "id": "aud_01HZZTT6V7W8X9Y0Z1A2B3C4D0", "change": "CREATED" }
    ]
  }
}
```

`current_eligible_holders` is resolved **at read time**, not stored. If the post falls vacant tomorrow, the approval does not silently become undecidable-but-looking-fine — the array empties and the responsibility route escalates.

### Response — 422 no eligible holder

```json
{
  "success": false,
  "message": "No current holder of the required post; approval cannot be routed",
  "error": {
    "code": "UNPROCESSABLE",
    "details": {
      "required_post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0",
      "required_post_display": "Mine Manager, Gevra OCP",
      "vacant_since": "2026-08-11T00:00:00Z",
      "unmanned_responsibility_id": "unm_01HZZA1B2C3D4E5F6G7H8J9K00",
      "resolution": "Fill the post, or request approval at a post the policy also recognises. Escalation notifies; it does not substitute an approver."
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## GET /approvals/{id} · GET /approvals

**Auth:** current eligible holder read, requester read, or `approval.read` on the subject. The list defaults to approvals the caller may actually decide; broader filters require `approval.read` on the subject resources.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[decision]` | `PENDING` | Default `PENDING` |
| `filter[subject_type]` | `CAPA,FINDING,POSITION_CAPABILITY_POLICY` | |
| `filter[subject_ref]` | `capa_01H…` | |
| `filter[approval_type]` | `CAPA_CLOSURE_SIGNOFF` | |
| `filter[required_post_id]` | `post_01H…` | |
| `filter[requested_by]` | `per_01H…` | |
| `filter[decidable_by_me]` | `true` | The "awaiting my approval" tile |
| `filter[due_at][lte]` | `2026-09-05T00:00:00Z` | |
| `filter[overdue]` | `true` | |
| `filter[unroutable]` | `true` | Pending, with no current eligible holder — the queue nobody can clear |
| `sort` | `due_at`, `-created_at` | |
| `view` | `view=awaiting_my_approval` | |
| `group_by` + `metrics` | `group_by=approval_type,decision&metrics=count` | |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "appr_01HZZMM9N0P1Q2R3S4T5V6V7W0",
      "object": "approval",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "PENDING",
      "subject": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Reinstate 40m berm, east haul road" },
      "subject_type": "CAPA",
      "subject_ref": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "approval_type": "CAPA_CLOSURE_SIGNOFF",
      "required_post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
      "decision": "PENDING",
      "requested_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
      "due_at": "2026-09-05T00:00:00Z",
      "overdue": false,
      "decidable_by_me": true,
      "created_at": "2026-08-30T10:00:00Z",
      "links": { "self": "/api/v1/approvals/appr_01HZZMM9N0P1Q2R3S4T5V6V7W0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T10:05:00Z" }
}
```

---

## POST /approvals/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `DECIDE` | `approval.decide` on this approval, supported by a **current** appointment to an eligible post at decision time | required on `REJECTED`/`RETURNED` | required | `decision = PENDING` | Records the decision, the appointment relied on, and any signature |
| `WITHDRAW` | requester, or `approval.request` on the subject | **required** | required | `decision = PENDING` | `decision = WITHDRAWN` |
| `REASSIGN` | `approval.route` on the subject | **required** | required | `decision = PENDING` | Moves to a different eligible post under the same policy |

**Notification delegation never satisfies `approval.decide`.** A delegate can see the request and cannot decide it, and the `403` says so.

### DECIDE — approved

```json
{
  "action": "DECIDE",
  "expected_version": 1,
  "payload": {
    "decision": "APPROVED",
    "reason": "Corrective action and evidence reviewed; sufficient for SEVERE-linked CAPA sign-off",
    "signature_id": "sig_01HZZVV7W8X9Y0Z1A2B3C4D5E0"
  },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Approved",
  "data": {
    "id": "appr_01HZZMM9N0P1Q2R3S4T5V6V7W0",
    "object": "approval",
    "version": 2,
    "state": "APPROVED",
    "decision": "APPROVED",
    "decided_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "decided_at": "2026-08-30T10:30:00Z",
    "decided_via_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "decided_via_post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
    "reason": "Corrective action and evidence reviewed; sufficient for SEVERE-linked CAPA sign-off",
    "signature_id": "sig_01HZZVV7W8X9Y0Z1A2B3C4D5E0",
    "assurance_at_decision": "PASSWORD",
    "available_actions": []
  },
  "meta": {
    "action": "DECIDE",
    "transition": { "from": "PENDING", "to": "APPROVED" },
    "effects": [
      { "object": "authorization_decision", "id": "azd_01HZZVV8X9Y0Z1A2B3C4D5E6F0", "change": "CREATED" },
      { "object": "notification", "count": 2, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZWW9Y0Z1A2B3C4D5E6F7G0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T10:30:00Z"
  }
}
```

`decided_via_appointment_id` is validated against the authenticated principal at decision time and persisted. The record says *which office* decided, not merely which human — which is the part that still means something after that person transfers.

### DECIDE — returned

`RETURNED` sends the request back for rework without a hard reject. It is a **distinct outcome**, not a synonym for `REJECTED`.

```json
{
  "action": "DECIDE",
  "expected_version": 1,
  "reason": "Photo set does not cover the western 12m of the repaired section; resubmit with continuous coverage",
  "payload": { "decision": "RETURNED", "requested_changes": ["Continuous photo run of the full 40m", "Survey trace with chainage marks"] }
}
```

```json
{
  "success": true,
  "message": "Returned for rework",
  "data": {
    "id": "appr_01HZZMM9N0P1Q2R3S4T5V6V7W0",
    "object": "approval",
    "version": 2,
    "state": "RETURNED",
    "decision": "RETURNED",
    "decided_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "decided_at": "2026-08-30T10:35:00Z",
    "decided_via_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "reason": "Photo set does not cover the western 12m of the repaired section; resubmit with continuous coverage",
    "requested_changes": ["Continuous photo run of the full 40m", "Survey trace with chainage marks"],
    "signature_id": null,
    "available_actions": []
  },
  "meta": {
    "action": "DECIDE",
    "transition": { "from": "PENDING", "to": "RETURNED" },
    "effects": [
      { "object": "notification", "count": 1, "change": "CREATED", "note": "Requester notified with the requested changes" },
      { "object": "audit_event", "id": "aud_01HZZXX0Z1A2B3C4D5E6F7G8H0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T10:35:00Z"
  }
}
```

### DECIDE — 403 delegate attempt

```json
{
  "success": false,
  "message": "A notification delegate cannot decide an approval",
  "error": {
    "code": "FORBIDDEN",
    "details": {
      "required_capability": "approval.decide",
      "caller_relationship": "NOTIFICATION_DELEGATE",
      "delegate_id": "nd_01HZZVV6W7X8Y9Z0A1B2C3D4E0",
      "grants_domain_capability": false,
      "resolution": "Delegation conveys receipt and acknowledgement only. The approval must be decided by a current holder of the required post."
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### Errors

| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `decision` is `REJECTED`/`RETURNED` with no `reason` |
| 409 | `INVALID_STATE` | `decision` is not currently `PENDING` |
| 403 | `FORBIDDEN` | Caller holds no current appointment to an eligible post, or is acting as a delegate |
| 403 | `ASSURANCE_REQUIRED` | The approval policy requires stronger or more recent authentication |
| 422 | `UNPROCESSABLE` | Caller is `requested_by` and the policy forbids self-approval |

---

## POST /approvals/actions

Bulk `DECIDE` over a filter, per-target authorization, `207` on mixed outcomes. Permitted only where the approval policy for that `approval_type` sets `bulk_decidable: true`; policies that require a signature per decision refuse it with `400 VALIDATION_ERROR`.

```json
{
  "action": "DECIDE",
  "filter": { "approval_type": "ROUTINE_ROSTER_CHANGE", "decision": "PENDING", "required_post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0" },
  "payload": { "decision": "APPROVED", "reason": "Routine roster changes reviewed in the 30 August shift meeting" },
  "atomic": false
}
```

```json
{
  "success": true,
  "message": "9 of 10 approved",
  "data": {
    "requested": 10,
    "succeeded": 9,
    "failed": 1,
    "results": [
      { "id": "appr_01HZZYY1A2B3C4D5E6F7G8H9J0", "status": 200, "version": 2, "state": "APPROVED" },
      { "id": "appr_01HZZZZ2B3C4D5E6F7G8H9J0K0", "status": 422, "error": { "code": "UNPROCESSABLE", "message": "Caller is requested_by; self-approval is forbidden by policy apol_01HZZSS5V6V7W8X9Y0Z1A2B3C0" } }
    ]
  },
  "meta": { "action": "DECIDE", "effects": [ { "object": "authorization_decision", "count": 9, "change": "CREATED" }, { "object": "audit_event", "count": 9, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-08-30T10:40:00Z" }
}
```

---

## Invariants

- An approval is decided by a **current holder of an eligible post**, validated at decision time — never by a stored role or a cached capability.
- Notification delegation never satisfies `approval.decide`, and the denial names the delegation rather than hiding behind a generic `403`.
- `RETURNED` is a distinct outcome from `REJECTED` and carries the requested changes.
- Eligible holders are resolved at read time, so a vacancy makes an unroutable approval visible instead of silently stalled.
- Every decision persists the appointment relied on, the assurance at decision, and any signature.
- Multi-signature chains remain out of scope for this build; this is a single-decision mechanism and says so.

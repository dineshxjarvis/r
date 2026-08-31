# Documents — obligation conflicts

Table: `obligation_conflict` (`data-model.md §2`). Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/compliance/register-extensions-spec.md`](../../../features/compliance/register-extensions-spec.md) §5.

A **review queue only**. Conflict detection *"writes only to a review queue — never to live obligations."* Nothing here edits an `obligation`; a real fix is an amendment through the normal extraction/publish path ([`documents.md`](documents.md), [`extractions.md`](extractions.md)), like any other correction.

**Auth note.** No ReBAC type of its own, same shape as `obligation`. Resolved via `can_publish` on *either* side's `source_document_id` — matching the spec's own caution that *"a wrongly-resolved statutory conflict is a legal exposure"*. That is the same authority bar as publishing a document into the register in the first place, not plain `internal_viewer`.

## Routes

| Route | Purpose |
|---|---|
| `GET /obligation-conflicts` · `GET /obligation-conflicts/{id}` | The queue |
| `POST /obligation-conflicts/{id}/actions` | Resolve, accept as intended, reassign |
| `POST /obligation-conflicts/actions` | Bulk disposition of a filtered set |

---

## GET /obligation-conflicts

**Auth:** results clipped to conflicts where the caller holds `document.publish` or `obligation.configure` on at least one side.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[status]` | `OPEN` | Default `OPEN` |
| `filter[conflict_type]` | `CONFLICTING_LIMIT` | `CONFLICTING_LIMIT` · `CONFLICTING_DEADLINE` · `CONFLICTING_FREQUENCY` · `DUPLICATE_SUBMISSION` · `RESOURCE_COLLISION` |
| `filter[obligation_id]` | `obl_01H…` | Matches either side |
| `filter[mine_id]` | `mine_01H…` | Conflicts affecting a mine |
| `filter[severity]` | `HIGH` | Derived from the stricter side |
| `filter[detected_at][gte]` | `2026-08-01T00:00:00Z` | |
| `sort` | `-detected_at`, `-severity` | |
| `group_by` + `metrics` | `group_by=conflict_type&metrics=count` | |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "conf_01HZZ01A2B3C4D5E6F7G8H9J00",
      "object": "obligation_conflict",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "OPEN",
      "available_actions": ["RESOLVE", "ACCEPT_AS_INTENDED", "REASSIGN"],
      "conflict_type": "CONFLICTING_LIMIT",
      "severity": "HIGH",
      "obligation_a": { "type": "obligation", "id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00", "display": "Ambient dust limit — EC 2019 condition 9" },
      "obligation_b": { "type": "obligation", "id": "obl_01HZYV9Z8Y7X6W5V4V3T2S1R00", "display": "Ambient dust limit — CPCB consent 2024 condition 4" },
      "affected_mines": [{ "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" }],
      "detected_at": "2026-08-30T02:00:00Z",
      "detector": "conflict-scan@v2",
      "links": { "self": "/api/v1/obligation-conflicts/conf_01HZZ01A2B3C4D5E6F7G8H9J00" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:44:00Z" }
}
```

---

## GET /obligation-conflicts/{id}

**Auth:** the same clipping policy as the list.

### Response — 200 OK, `?expand=obligation_a,obligation_b`

```json
{
  "success": true,
  "data": {
    "id": "conf_01HZZ01A2B3C4D5E6F7G8H9J00",
    "object": "obligation_conflict",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "OPEN",
    "available_actions": ["RESOLVE", "ACCEPT_AS_INTENDED", "REASSIGN"],
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "conflict_type": "CONFLICTING_LIMIT",
    "severity": "HIGH",
    "obligation_a": { "type": "obligation", "id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00", "display": "Ambient dust limit — EC 2019 condition 9" },
    "obligation_b": { "type": "obligation", "id": "obl_01HZYV9Z8Y7X6W5V4V3T2S1R00", "display": "Ambient dust limit — CPCB consent 2024 condition 4" },
    "affected_mines": [{ "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" }],
    "detail": {
      "parameter": "dust_limit",
      "obligation_a_value": { "value": "150", "unit": "MICROGRAM_PER_CUBIC_METRE" },
      "obligation_b_value": { "value": "100", "unit": "MICROGRAM_PER_CUBIC_METRE" },
      "stricter_side": "B",
      "later_instrument": "B",
      "later_instrument_basis": "obligation_b.source_document.published_at 2024-11-02 > obligation_a.source_document.published_at 2019-06-14",
      "note": "Obligation B is both the later instrument and the stricter limit — likely supersedes. Not applied automatically."
    },
    "detected_at": "2026-08-30T02:00:00Z",
    "detector": "conflict-scan@v2",
    "detection_run_id": "op_01HZZT0M1N203P4Q5R6S7T8V90",
    "assigned_to_post_id": null,
    "resolved_by": null,
    "resolved_at": null,
    "resolution_note": null,
    "resolution_reference": null,
    "created_at": "2026-08-30T02:00:00Z",
    "created_by": { "type": "principal", "id": "prn_01HZZM1N203P4Q5R6S7T8V9V00", "display": "strata-conflict-scanner" },
    "updated_at": "2026-08-30T02:00:00Z",
    "updated_by": { "type": "principal", "id": "prn_01HZZM1N203P4Q5R6S7T8V9V00", "display": "strata-conflict-scanner" },
    "extensions": {},
    "links": { "self": "/api/v1/obligation-conflicts/conf_01HZZ01A2B3C4D5E6F7G8H9J00", "history": "/api/v1/obligation-conflicts/conf_01HZZ01A2B3C4D5E6F7G8H9J00/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:44:00Z" }
}
```

`detail.stricter_side`, `later_instrument`, and `note` state the supersession basis **without applying it**. Supersession and strictness rules are *stated, not applied*; the reviewer decides, and the response says so explicitly so no client mistakes the hint for a decision.

---

## POST /obligation-conflicts/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `RESOLVE` | `document.publish` or `obligation.configure` on every affected side | **required** | required | `OPEN` | `state = RESOLVED` |
| `ACCEPT_AS_INTENDED` | same | **required** | required | `OPEN` | `state = ACCEPTED_AS_INTENDED`; suppressed from future detection runs |
| `REASSIGN` | `obligation.configure` on either side | **required** | required | `OPEN` | Routes the queue item to another post |

`reason` is always required, whichever action — a conflict closed without a stated basis is exactly the legal exposure this queue exists to prevent.

### Request — RESOLVE

```json
{
  "action": "RESOLVE",
  "expected_version": 1,
  "reason": "Obligation A amended by corrigendum; dust limit now 100 on both instruments — no live contradiction remains",
  "payload": {
    "resolution_reference": { "type": "extraction", "id": "ext_01HZYT9V8V7W6X5Y4Z3A2B1C00" },
    "prevailing_obligation_id": "obl_01HZYV9Z8Y7X6W5V4V3T2S1R00"
  }
}
```

`prevailing_obligation_id` is **documentation of the reviewer's finding**, not an instruction — the register is only changed by publishing the amendment named in `resolution_reference`.

### Response — 200 OK

```json
{
  "success": true,
  "message": "Conflict resolved",
  "data": {
    "id": "conf_01HZZ01A2B3C4D5E6F7G8H9J00",
    "object": "obligation_conflict",
    "version": 2,
    "state": "RESOLVED",
    "resolved_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "resolved_at": "2026-08-30T11:45:00Z",
    "resolution_note": "Obligation A amended by corrigendum; dust limit now 100 on both instruments — no live contradiction remains",
    "resolution_reference": { "type": "extraction", "id": "ext_01HZYT9V8V7W6X5Y4Z3A2B1C00" },
    "prevailing_obligation_id": "obl_01HZYV9Z8Y7X6W5V4V3T2S1R00",
    "available_actions": []
  },
  "meta": {
    "action": "RESOLVE",
    "transition": { "from": "OPEN", "to": "RESOLVED" },
    "effects": [ { "object": "audit_event", "id": "aud_01HZZN203P4Q5R6S7T8V9V0W10", "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:45:00Z"
  }
}
```

### Request — ACCEPT_AS_INTENDED

For the case in `register-extensions-spec.md §5`'s own example — a frequency mismatch that is *not* a legal conflict but was worth surfacing once. Marking it stops it being re-reported on every detection run without pretending either obligation changed.

```json
{
  "action": "ACCEPT_AS_INTENDED",
  "expected_version": 1,
  "reason": "EC requires quarterly reporting, CPCB consent requires monthly. Both bind; monthly satisfies quarterly. Not a contradiction.",
  "payload": { "suppress_until": "2028-04-01T00:00:00Z", "suppress_scope": "SAME_OBLIGATION_PAIR" }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Accepted as intended; suppressed from detection until 2028-04-01",
  "data": {
    "id": "conf_01HZZ0P3Q4R5S6T7V8V9W0X1Y0",
    "object": "obligation_conflict",
    "version": 2,
    "state": "ACCEPTED_AS_INTENDED",
    "resolved_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "resolved_at": "2026-08-30T11:46:00Z",
    "resolution_note": "EC requires quarterly reporting, CPCB consent requires monthly. Both bind; monthly satisfies quarterly. Not a contradiction.",
    "suppression": { "until": "2028-04-01T00:00:00Z", "scope": "SAME_OBLIGATION_PAIR" },
    "available_actions": []
  },
  "meta": {
    "action": "ACCEPT_AS_INTENDED",
    "transition": { "from": "OPEN", "to": "ACCEPTED_AS_INTENDED" },
    "effects": [
      { "object": "conflict_suppression", "id": "csup_01HZZ03P4Q5R6S7T8V9V0W1X20", "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZP4Q5R6S7T8V9V0W1X2Y30", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:46:00Z"
  }
}
```

Suppression is **bounded**. It expires, so a pair accepted as intended today is re-surfaced for review once either instrument could plausibly have changed, rather than being silenced forever by one decision.

### Errors

| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `reason` missing or empty — required for every action |
| 409 | `INVALID_STATE` | `state` is not `OPEN` |
| 409 | `VERSION_CONFLICT` | Another reviewer disposed of it first |
| 403 | `FORBIDDEN` | `document.publish`/`obligation.configure` not held on the affected side |

---

## POST /obligation-conflicts/actions

Bulk disposition of a filtered set, per-target authorization, `207` on mixed outcomes.

```json
{
  "action": "ACCEPT_AS_INTENDED",
  "filter": { "conflict_type": "CONFLICTING_FREQUENCY", "status": "OPEN", "detected_at": { "gte": "2026-08-01T00:00:00Z" } },
  "reason": "Frequency mismatches between EC and consent conditions reviewed in batch — stricter cadence satisfies the looser one in every case checked",
  "payload": { "suppress_until": "2027-04-01T00:00:00Z", "suppress_scope": "SAME_OBLIGATION_PAIR" },
  "atomic": false
}
```

```json
{
  "success": true,
  "message": "8 of 9 accepted as intended",
  "data": {
    "requested": 9,
    "succeeded": 8,
    "failed": 1,
    "results": [
      { "id": "conf_01HZZQ5R6S7T8V9V0W1X2Y3Z40", "status": 200, "version": 2, "state": "ACCEPTED_AS_INTENDED" },
      { "id": "conf_01HZZR6S7T8V9V0W1X2Y3Z4A50", "status": 403, "error": { "code": "FORBIDDEN", "message": "document.publish not held on either source document" } }
    ]
  },
  "meta": { "action": "ACCEPT_AS_INTENDED", "effects": [ { "object": "conflict_suppression", "count": 8, "change": "CREATED" }, { "object": "audit_event", "count": 8, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-08-30T11:48:00Z" }
}
```

Bulk `RESOLVE` is refused with `400 VALIDATION_ERROR` — resolution names a specific amendment per conflict, and a batch cannot supply one.

---

## Invariants

- Detection writes only to this queue. It never edits a live obligation, and never applies supersession or strictness on its own.
- Supersession hints are stated with their basis and marked as not applied.
- Every disposition requires a reason, and `RESOLVE` requires the reference to the amendment that actually fixed it.
- `ACCEPT_AS_INTENDED` suppression is bounded in time and scope, never permanent silence.

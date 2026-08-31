# Documents — obligation register and instances

Tables: `obligation`, `obligation_applicability_rule`, `obligation_instance`, `obligation_evidence_link`, `nil_return` (`data-model.md §2`). Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/compliance/obligation-register-spec.md`](../../../features/compliance/obligation-register-spec.md), [`register-extensions-spec.md`](../../../features/compliance/register-extensions-spec.md).

**There is no create or edit route for `obligation`.** The register is the materialised read side of the document pipeline ([`documents.md`](documents.md), [`extractions.md`](extractions.md)), never independently editable. An amendment is a new extraction, accepted with `amends_obligation_id`, published like anything else.

**Auth note.** `obligation` has no ReBAC type of its own (`authorization-spec.md §3` models only `obligation_instance`), and it is not cleanly mine-scoped since one obligation can apply to several mines through `obligation_applicability_rule`. It is resolved in the app layer via `source_document_id` → `document.viewer` / `published_viewer`.

## Routes

| Route | Purpose |
|---|---|
| `GET /obligations` · `GET /obligations/{id}` · `POST /obligations/{id}/actions` | Register reads and applicability resolution |
| `GET /obligations?view=applicability_rules` | Rule reads across obligations |
| `GET /obligation-instances` · `GET /obligation-instances/{id}` · `GET /obligation-instances/{id}/history` | Period instances |
| `POST /obligation-instances/{id}/actions` | Submit, verify, not-applicable, waive, NIL return, reopen |
| `POST /obligation-instances/actions` | Bulk over a filtered set |

`GET /obligations/{id}/applicability-rules` is `GET /obligations?view=applicability_rules&filter[obligation_id]=obl_01H…`, or `GET /obligations/{id}?expand=applicability_rules`.

---

## GET /obligations/{id}

**Auth:** `obligation.read` on this requirement, derived from source and applicability plus projection policy.

### Response — 200 OK, `?expand=applicability_rules,source_segment`

```json
{
  "success": true,
  "data": {
    "id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00",
    "object": "obligation",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["RESOLVE_APPLICABILITY"],
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "source_document": { "type": "document", "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "display": "EC amendment — Gevra OCP capacity expansion" },
    "source_segment_id": "seg_01HZZA0B1C2D3E4F5G6H7J8K90",
    "source_extraction_id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00",
    "shared_obligation_id": "shobl_01HZYV1W2X3Y4Z5A6B7C8D9E00",
    "clause_ref": "/akn/in/act/ec/2019/secl-gevra/main#cond_17__b",
    "deontic": "OBLIGATION",
    "title": "Plantation over 40 hectares",
    "title_i18n": { "en": "Plantation over 40 hectares", "hi": "40 हेक्टेयर में वृक्षारोपण" },
    "summary": null,
    "owner_role": "ENV_OFFICER",
    "responsible_post_id": "post_01HZY6E7F8G9H0J1K2T3M4N500",
    "periodicity": "ANNUAL",
    "due_rule_kind": "OFFSET_FROM_PERIOD_END",
    "due_rule_detail": { "offset_days": 30 },
    "grace_period_days": 0,
    "source_scope": "MINE",
    "severity": "SIGNIFICANT",
    "parameters": [{ "name": "plantation_area", "value": "40", "unit": "HECTARE", "comparator": "GTE" }],
    "evidence_requirements": [
      { "kind": "GEOTAGGED_PHOTO", "min_count": 4, "must_be_within_geofence": true },
      { "kind": "SURVEY_REPORT", "min_count": 1, "must_be_signed": true }
    ],
    "nil_permitted": false,
    "active": true,
    "register_version": 1,
    "superseded_by": null,
    "supersedes": null,
    "applicability_rules": [
      { "id": "oar_01HZYW1X2Y3Z4A5B6C7D8E9F00", "object": "obligation_applicability_rule", "kind": "ALWAYS", "detail": null, "state": "RESOLVED" }
    ],
    "counts": { "instances": 6, "open_instances": 2, "applicable_mines": 2 },
    "created_at": "2026-08-30T11:10:00Z",
    "created_by": { "type": "principal", "id": "prn_01HZZB1C2D3E4F5G6H7J8K9T00", "display": "strata-publication-worker" },
    "updated_at": "2026-08-30T11:10:00Z",
    "updated_by": { "type": "principal", "id": "prn_01HZZB1C2D3E4F5G6H7J8K9T00", "display": "strata-publication-worker" },
    "extensions": {},
    "links": {
      "self": "/api/v1/obligations/obl_01HZYV1V2W3X4Y5Z6A7B8C9D00",
      "instances": "/api/v1/obligation-instances?filter[obligation_id]=obl_01HZYV1V2W3X4Y5Z6A7B8C9D00",
      "source_clause": "/api/v1/documents/segments/seg_01HZZA0B1C2D3E4F5G6H7J8K90"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:12:00Z" }
}
```

`shared_obligation_id` groups the per-mine obligations that came from one legal instrument, so a national rule is one row per binding target without duplicating the instrument itself.

---

## GET /obligations

**Auth:** results clipped to requirements covered by `obligation.read`. Shared national requirements are **not** duplicated per tenant merely for authorization.

Filters: `shared_obligation_id`, `active` (default `true`), `owner_role`, `responsible_post_id`, `periodicity`, `severity`, `source_document_id`, `filter[applicable_mine_id]`, `filter[applicability_rules.state]=UNRESOLVED`, `q`, `as_of`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00",
      "object": "obligation",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "ACTIVE",
      "title": "Plantation over 40 hectares",
      "shared_obligation_id": "shobl_01HZYV1W2X3Y4Z5A6B7C8D9E00",
      "clause_ref": "/akn/in/act/ec/2019/secl-gevra/main#cond_17__b",
      "owner_role": "ENV_OFFICER",
      "periodicity": "ANNUAL",
      "severity": "SIGNIFICANT",
      "source_document": { "type": "document", "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "display": "EC amendment — Gevra OCP capacity expansion" },
      "active": true,
      "counts": { "instances": 6, "open_instances": 2, "applicable_mines": 2 },
      "links": { "self": "/api/v1/obligations/obl_01HZYV1V2W3X4Y5Z6A7B8C9D00" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 214, "total_pages": 11, "has_next": true, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:12:00Z" }
}
```

---

## POST /obligations/{id}/actions

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `RESOLVE_APPLICABILITY` | `obligation.configure` on all affected targets, plus `document.publish` where source republication is involved | **required** | required | named rule is `UNRESOLVED` | Re-runs `materialise()`; creates the instances that were blocked |

### Request

```json
{
  "action": "RESOLVE_APPLICABILITY",
  "expected_version": 1,
  "reason": "Threshold confirmed against the sanctioned mine plan — condition binds only above 1 Mtpa",
  "payload": {
    "applicability_rule_id": "oar_01HZYW1X2Y3Z4A5B6C7D8E9F00",
    "kind": "THRESHOLD",
    "detail": { "parameter": "production_tpa", "comparator": "GTE", "value": "1000000", "unit": "TONNE_PER_YEAR" },
    "evidence_document_id": "doc_01HZZT0M1N203P4Q5R6S7T8V90"
  }
}
```

Callable only on a rule currently `kind = UNRESOLVED`. Resolving to `UNRESOLVED` again is `422 UNPROCESSABLE` — that is not a resolution. The system never defaults an unresolved rule to `ALWAYS` on its own: *a wrong obligation is worse than a missing one* (`register-extensions-spec.md`).

### Response — 200 OK

```json
{
  "success": true,
  "message": "Applicability resolved; 3 instances materialised",
  "data": {
    "id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00",
    "object": "obligation",
    "version": 2,
    "state": "ACTIVE",
    "applicability_rules": [
      { "id": "oar_01HZYW1X2Y3Z4A5B6C7D8E9F00", "object": "obligation_applicability_rule", "kind": "THRESHOLD", "detail": { "parameter": "production_tpa", "comparator": "GTE", "value": "1000000", "unit": "TONNE_PER_YEAR" }, "state": "RESOLVED", "resolved_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" }, "resolved_at": "2026-08-30T11:15:00Z" }
    ],
    "counts": { "instances": 9, "open_instances": 5, "applicable_mines": 3 }
  },
  "meta": {
    "action": "RESOLVE_APPLICABILITY",
    "transition": null,
    "materialisation_summary": { "instances_created": 3, "instances_blocked": 0, "mines_now_in_scope": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "mine_01HZYB1C2D3E4F5G6H7J8K9T00", "mine_01HZYT0M1N203P4Q5R6S7T8V90"] },
    "effects": [
      { "object": "obligation_instance", "count": 3, "change": "CREATED" },
      { "object": "notification", "count": 3, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ01A2B3C4D5E6F7G8H9J00", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:15:00Z"
  }
}
```

---

## GET /obligation-instances/{id}

**Auth:** `obligation.read` on this instance through its mine, responsible party, and projection policy.

### Response — 200 OK, `?expand=obligation,evidence_links,nil_return`

```json
{
  "success": true,
  "data": {
    "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
    "object": "obligation_instance",
    "version": 3,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "SUBMITTED",
    "available_actions": ["VERIFY", "REJECT_SUBMISSION"],
    "obligation": { "type": "obligation", "id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00", "display": "Plantation over 40 hectares" },
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "responsible_post": { "type": "post", "id": "post_01HZY6E7F8G9H0J1K2T3M4N500", "display": "Environment Officer, Gevra OCP" },
    "period": { "from": "2026-04-01", "to": "2027-04-01", "bounds": "[)" },
    "period_start": "2026-04-01",
    "period_end": "2027-03-31",
    "due_on": "2027-04-30",
    "grace_until": "2027-04-30",
    "days_to_due": 243,
    "status": "SUBMITTED",
    "status_reason": null,
    "reconciliation": null,
    "reconciliation_note": null,
    "submitted_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "submitted_at": "2026-08-30T11:20:00Z",
    "verified_by": null,
    "verified_at": null,
    "finding_id": null,
    "evidence_links": [
      { "id": "oel_01HZZ12B3C4D5E6F7G8H9J0K10", "evidence_id": "ev_01HZYY1Z2A3B4C5D6E7F8G9H00", "match_outcome": null, "linked_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" }, "linked_at": "2026-08-30T11:20:00Z" }
    ],
    "nil_return": null,
    "evidence_requirement_status": [
      { "kind": "GEOTAGGED_PHOTO", "required": 4, "linked": 1, "satisfied": false },
      { "kind": "SURVEY_REPORT", "required": 1, "linked": 0, "satisfied": false }
    ],
    "created_at": "2026-08-30T11:10:05Z",
    "created_by": { "type": "principal", "id": "prn_01HZZB1C2D3E4F5G6H7J8K9T00", "display": "strata-publication-worker" },
    "updated_at": "2026-08-30T11:20:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/obligation-instances/oi_01HZYX1Y2Z3A4B5C6D7E8F9G00", "history": "/api/v1/obligation-instances/oi_01HZYX1Y2Z3A4B5C6D7E8F9G00/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:22:00Z" }
}
```

`evidence_requirement_status` is computed against the obligation's `evidence_requirements`, so the responsible officer sees what is still missing before submitting rather than after being rejected.

---

## GET /obligation-instances

**Auth:** results clipped to instances covered by `obligation.read`. Request mine/tenant filters only narrow the authorised set.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[mine_id]` | `mine_01H…` | |
| `filter[obligation_id]` · `filter[shared_obligation_id]` | | |
| `filter[status]` | `DUE,OVERDUE` | |
| `filter[reconciliation]` | `MISMATCH` | |
| `filter[due_on][lte]` · `[gte]` | `2027-04-30` | |
| `filter[responsible_post_id]` · `filter[assigned_to]` | | "My register" |
| `filter[severity]` | `SEVERE` | Via the parent obligation |
| `filter[has_nil_return]` | `true` | |
| `filter[overdue_days][gte]` | `30` | Ageing buckets |
| `view` | `view=my_due_register` | |
| `group_by` + `metrics` | `group_by=mine_id,status&metrics=count` | Compliance posture, no bespoke route |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
      "object": "obligation_instance",
      "version": 3,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "SUBMITTED",
      "obligation": { "type": "obligation", "id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00", "display": "Plantation over 40 hectares" },
      "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "period_start": "2026-04-01",
      "period_end": "2027-03-31",
      "due_on": "2027-04-30",
      "status": "SUBMITTED",
      "reconciliation": null,
      "severity": "SIGNIFICANT",
      "links": { "self": "/api/v1/obligation-instances/oi_01HZYX1Y2Z3A4B5C6D7E8F9G00" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:22:00Z" }
}
```

### Aggregate — `?group_by=mine_id,status&metrics=count`

```json
{
  "success": true,
  "data": [
    { "key": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "status": "OVERDUE" }, "metrics": { "count": 4 } },
    { "key": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "status": "DUE" }, "metrics": { "count": 11 } },
    { "key": { "mine_id": "mine_01HZYB1C2D3E4F5G6H7J8K9T00", "status": "OVERDUE" }, "metrics": { "count": 1 } }
  ],
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:22:00Z", "grouped_by": ["mine_id", "status"], "metrics": ["count"] }
}
```

---

## POST /obligation-instances/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Result |
|---|---|---|---|---|---|
| `SUBMIT` | `obligation.submit_evidence` | optional | required | `UPCOMING`, `DUE`, or `OVERDUE` | `SUBMITTED` |
| `VERIFY` | `obligation.verify` under the instance verification policy | optional | required | `SUBMITTED`, verifier ≠ submitter, closure gate passes | `SATISFIED` or `EVIDENCE_MISMATCH` |
| `REJECT_SUBMISSION` | `obligation.verify` | **required** | required | `SUBMITTED` | back to `DUE`/`OVERDUE` |
| `MARK_NOT_APPLICABLE` | `obligation.mark_not_applicable` | **required** | required | any open status | `NOT_APPLICABLE` |
| `WAIVE` | `obligation.waive` under the waiver policy | **required** | required | any open status | `WAIVED` (this period only) |
| `SUBMIT_NIL_RETURN` | `obligation.submit_nil_return` | optional | required | open status, `obligation.nil_permitted = true` | `SUBMITTED` with a `nil_return` |
| `LINK_EVIDENCE` | `obligation.submit_evidence` | optional | required | any open status | adds `obligation_evidence_link` rows |
| `REOPEN` | `obligation.reopen` | **required** | required | `SATISFIED`, `WAIVED`, or `NOT_APPLICABLE` | back to `DUE`/`OVERDUE` |

### SUBMIT

*"The mine says it is done"* (`obligation-register-spec.md §4.2`). Evidence rows themselves are created through the [`evidence/`](../evidence/evidence.md) domain; this only joins existing ones.

```json
{
  "action": "SUBMIT",
  "expected_version": 2,
  "payload": {
    "evidence_ids": ["ev_01HZYY1Z2A3B4C5D6E7F8G9H00", "ev_01HZZ23C4D5E6F7G8H9J0K1T20"],
    "submission_note": "Plantation completed across blocks A and C; survival survey attached"
  }
}
```

```json
{
  "success": true,
  "message": "Submitted for verification",
  "data": {
    "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
    "object": "obligation_instance",
    "version": 3,
    "state": "SUBMITTED",
    "status": "SUBMITTED",
    "submitted_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "submitted_at": "2026-08-30T11:20:00Z",
    "evidence_requirement_status": [
      { "kind": "GEOTAGGED_PHOTO", "required": 4, "linked": 4, "satisfied": true },
      { "kind": "SURVEY_REPORT", "required": 1, "linked": 1, "satisfied": true }
    ],
    "available_actions": []
  },
  "meta": {
    "action": "SUBMIT",
    "transition": { "from": "DUE", "to": "SUBMITTED" },
    "effects": [
      { "object": "obligation_evidence_link", "count": 2, "change": "CREATED", "note": "match_outcome left null — submission attaches evidence, it does not judge it" },
      { "object": "notification", "count": 1, "change": "CREATED", "note": "Verification queued to the independent verifier post" },
      { "object": "audit_event", "id": "aud_01HZZ34D5E6F7G8H9J0K1T2M30", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:20:00Z"
  }
}
```

Contractor submission additionally requires a current affiliation, a live engagement, and recorded responsibility.

### VERIFY

*"Someone independent agrees"* (`obligation-register-spec.md §4.2`) — internal peer review only. There is no regulator path here: a regulator's levers on an instance are reading it (`published_viewer`) and raising a `finding` if it disagrees ([`../defects/findings.md`](../defects/findings.md)).

**Two gates, in order.** `can_close_with()` (`evidence/verification-attempts.md`) runs **first** against evidence joined through `obligation_evidence_link` — not `for_instance_id` alone, because reconciliation-time evidence is the fuller linked set (`data-model.md §4.2`). A blocked gate stops the call before `outcome` is read. Same shape and same override rules as `POST /capas/{id}/actions` `VERIFY`.

```json
{
  "action": "VERIFY",
  "expected_version": 3,
  "payload": {
    "outcome": "SATISFIED",
    "evidence_links": [
      { "evidence_id": "ev_01HZYY1Z2A3B4C5D6E7F8G9H00", "match_outcome": "SATISFIES" },
      { "evidence_id": "ev_01HZZ23C4D5E6F7G8H9J0K1T20", "match_outcome": "PARTIALLY_SATISFIES" }
    ],
    "verification_note": "Photo set geofence-verified; survey report signed by the range officer"
  },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

`outcome` is `SATISFIED` or `EVIDENCE_MISMATCH` — the only two a verifier may set directly, and only once the gate has passed.

**Override form**, permitted only on `BLOCKED_SUSPECT_EVIDENCE` and only for a principal holding `can_override_verdict`:

```json
{
  "action": "VERIFY",
  "expected_version": 3,
  "reason": "Device flagged mock-location due to a known GPS drift bug on that handset build; cross-checked against the RFID gate log for the same timestamps",
  "payload": {
    "outcome": "SATISFIED",
    "evidence_links": [{ "evidence_id": "ev_01HZYY1Z2A3B4C5D6E7F8G9H00", "match_outcome": "SATISFIES" }],
    "override": { "gate_code": "BLOCKED_SUSPECT_EVIDENCE", "corroborating_reference": { "type": "attendance_event", "id": "att_01HZZ45E6F7G8H9J0K1T2M3N40" } }
  }
}
```

```json
{
  "success": true,
  "message": "Obligation instance satisfied",
  "data": {
    "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
    "object": "obligation_instance",
    "version": 4,
    "state": "SATISFIED",
    "status": "SATISFIED",
    "verified_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "verified_at": "2026-08-30T11:35:00Z",
    "available_actions": ["REOPEN"]
  },
  "included": {
    "evidence_verification_attempt:va_01HZZCCD3E4F5G6H7J8K9T0M10": {
      "id": "va_01HZZCCD3E4F5G6H7J8K9T0M10",
      "object": "evidence_verification_attempt",
      "outcome": "ACCEPTED",
      "gate_results": [
        { "gate": "DISTANCE", "passed": true, "distance_m": "5.8", "threshold_m": "50.0" },
        { "gate": "GEOFENCE", "passed": true, "within_geofence": true },
        { "gate": "VERIFIED_COUNT", "passed": true, "verified": 4, "required": 4 },
        { "gate": "METADATA_INTEGRITY", "passed": true },
        { "gate": "MOCK_LOCATION", "passed": true }
      ],
      "attempted_at": "2026-08-30T11:35:00Z"
    }
  },
  "meta": {
    "action": "VERIFY",
    "transition": { "from": "SUBMITTED", "to": "SATISFIED" },
    "effects": [
      { "object": "evidence_verification_attempt", "id": "va_01HZZCCD3E4F5G6H7J8K9T0M10", "change": "CREATED" },
      { "object": "obligation_evidence_link", "count": 2, "change": "UPDATED", "note": "match_outcome recorded" },
      { "object": "notification", "count": 2, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ56F7G8H9J0K1T2M3N4050", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:35:00Z"
  }
}
```

### VERIFY — 422 gate blocked

```json
{
  "success": false,
  "message": "Evidence does not satisfy the closure gate",
  "error": {
    "code": "BLOCKED_DISTANCE_MISMATCH",
    "details": {
      "gate_results": [
        { "gate": "DISTANCE", "passed": false, "distance_m": "1840.2", "threshold_m": "50.0", "evidence_id": "ev_01HZYY1Z2A3B4C5D6E7F8G9H00" },
        { "gate": "GEOFENCE", "passed": false, "within_geofence": false, "evidence_id": "ev_01HZYY1Z2A3B4C5D6E7F8G9H00" }
      ],
      "overridable": false,
      "verification_attempt_id": "va_01HZZ67G8H9J0K1T2M3N405P60",
      "resolution": "Capture evidence within the plantation block geofence, or reject the submission"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

Gate codes: `BLOCKED_DISTANCE_MISMATCH`, `BLOCKED_ALL_UNVERIFIED`, `BLOCKED_SUSPECT_EVIDENCE`, `BLOCKED_METADATA_TAMPERED`. Only `BLOCKED_SUSPECT_EVIDENCE` is overridable, and only by `can_override_verdict`. Every attempt — passed, blocked, or overridden — writes an `evidence_verification_attempt` row; see [`../evidence/verification-attempts.md`](../evidence/verification-attempts.md).

Self-verification is `422 UNPROCESSABLE` with `details.reason: "verified_by = submitted_by"`.

### MARK_NOT_APPLICABLE

```json
{
  "action": "MARK_NOT_APPLICABLE",
  "expected_version": 2,
  "reason": "Mine plan confirms no underground workings — this is an opencast-only condition erroneously materialised",
  "payload": { "evidence_document_id": "doc_01HZZ78H9J0K1T2M3N405P6Q70", "propagate_to_future_periods": true },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

`reason` is mandatory, never a silent default. The action persists the supporting appointment, the reason, the evidence, and the policy version; ordinary read authority is insufficient.

```json
{
  "success": true,
  "message": "Marked not applicable",
  "data": {
    "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
    "object": "obligation_instance",
    "version": 3,
    "state": "NOT_APPLICABLE",
    "status": "NOT_APPLICABLE",
    "status_reason": "Mine plan confirms no underground workings — this is an opencast-only condition erroneously materialised",
    "available_actions": ["REOPEN"]
  },
  "meta": {
    "action": "MARK_NOT_APPLICABLE",
    "transition": { "from": "DUE", "to": "NOT_APPLICABLE" },
    "effects": [
      { "object": "obligation_instance", "count": 2, "change": "STATE", "to": "NOT_APPLICABLE", "note": "Future periods, because propagate_to_future_periods was true" },
      { "object": "authorization_decision", "id": "azd_01HZZ89J0K1T2M3N405P6Q7R80", "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ9A0B1C2D3E4F5G6H7J8K0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:38:00Z"
  }
}
```

### WAIVE

Bounded to **this period only**. The underlying obligation still binds next period; `active` on `obligation` is untouched. The waiver policy names eligible posts and capabilities, required evidence, assurance, maximum duration, and whether regulator concurrence is needed.

```json
{
  "action": "WAIVE",
  "expected_version": 2,
  "reason": "Monsoon access road washout — plantation window physically unreachable this period; subsidiary-level exception approved under GOV-2026-104",
  "payload": {
    "waiver_reference": "GOV-2026-104",
    "evidence_document_id": "doc_01HZZA0B1C2D3E4F5G6H7J8K90",
    "regulator_concurrence": { "required": true, "document_id": "doc_01HZZB1C2D3E4F5G6H7J8K9T00", "authority_id": "auth_01HZXD4E5F6G7H8J9K0T1M2N30" }
  },
  "supporting_authority": { "appointment_id": "app_01HZZC2D3E4F5G6H7J8K9T0M10", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Waived for this period",
  "data": {
    "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
    "object": "obligation_instance",
    "version": 3,
    "state": "WAIVED",
    "status": "WAIVED",
    "status_reason": "Monsoon access road washout — plantation window physically unreachable this period; subsidiary-level exception approved under GOV-2026-104",
    "waiver": { "reference": "GOV-2026-104", "granted_by": { "type": "person", "id": "per_01HZZD3E4F5G6H7J8K9T0M1N20", "display": "K. Bhagat" }, "granted_at": "2026-08-30T11:40:00Z", "applies_to_period": { "from": "2026-04-01", "to": "2027-04-01", "bounds": "[)" }, "regulator_concurrence_document_id": "doc_01HZZB1C2D3E4F5G6H7J8K9T00" },
    "available_actions": ["REOPEN"]
  },
  "meta": {
    "action": "WAIVE",
    "transition": { "from": "OVERDUE", "to": "WAIVED" },
    "effects": [
      { "object": "authorization_decision", "id": "azd_01HZZE4F5G6H7J8K9T0M1N2030", "change": "CREATED" },
      { "object": "notification", "count": 3, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZF5G6H7J8K9T0M1N203P40", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:40:00Z"
  }
}
```

### SUBMIT_NIL_RETURN

Only callable when the versioned requirement permits NIL and the attestation policy passes.

```json
{
  "action": "SUBMIT_NIL_RETURN",
  "expected_version": 2,
  "payload": { "statement": "No reportable incidents this period", "attestation": { "signing_identity_id": "sign_01HZY8H9J0K1T2M3N405P6Q7R0", "payload_hash": "sha256:2b5c…" } }
}
```

```json
{
  "success": true,
  "message": "NIL return declared",
  "data": {
    "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
    "object": "obligation_instance",
    "version": 3,
    "state": "SUBMITTED",
    "status": "SUBMITTED",
    "submitted_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "submitted_at": "2026-08-30T11:40:00Z",
    "available_actions": []
  },
  "included": {
    "nil_return:nr_01HZYZ1A2B3C4D5E6F7G8H9J00": {
      "id": "nr_01HZYZ1A2B3C4D5E6F7G8H9J00",
      "object": "nil_return",
      "version": 1,
      "state": "ACTIVE",
      "obligation_instance_id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
      "declared_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
      "declared_at": "2026-08-30T11:40:00Z",
      "statement": "No reportable incidents this period",
      "signature_event_id": "sig_01HZZG6H7J8K9T0M1N203P4Q50",
      "contradicted_by_ref": null
    }
  },
  "meta": {
    "action": "SUBMIT_NIL_RETURN",
    "transition": { "from": "DUE", "to": "SUBMITTED" },
    "effects": [ { "object": "nil_return", "id": "nr_01HZYZ1A2B3C4D5E6F7G8H9J00", "change": "CREATED" }, { "object": "signature_event", "id": "sig_01HZZG6H7J8K9T0M1N203P4Q50", "change": "CREATED" }, { "object": "audit_event", "id": "aud_01HZZH7J8K9T0M1N203P4Q5R60", "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:40:00Z"
  }
}
```

Errors: `422 UNPROCESSABLE` when the parent obligation's `nil_permitted` is `false` — silence means *unknown* here, not *zero*. A register that cannot represent a NIL will show a clean site as non-compliant (`obligation-register-spec.md`).

A contradicting evidence or observation record later sets `nil_return.state = CONTRADICTED` with `contradicted_by_ref` pointing at it. That transition happens where the contradicting record is created — in the defect or evidence domain — never through this route.

---

## POST /obligation-instances/actions

Bulk over a filtered set, per-target authorization, `207` on mixed outcomes.

```json
{
  "action": "MARK_NOT_APPLICABLE",
  "filter": { "obligation_id": "obl_01HZZ18K9T0M1N203P4Q5R6S70", "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "status": "DUE" },
  "reason": "Opencast mine; the whole underground-ventilation condition set was materialised in error and is being corrected at source",
  "payload": { "evidence_document_id": "doc_01HZZ78H9J0K1T2M3N405P6Q70" },
  "atomic": false
}
```

```json
{
  "success": true,
  "message": "11 of 12 marked not applicable",
  "data": {
    "requested": 12,
    "succeeded": 11,
    "failed": 1,
    "results": [
      { "id": "oi_01HZZJ9T0M1N203P4Q5R6S7T80", "status": 200, "version": 2, "state": "NOT_APPLICABLE" },
      { "id": "oi_01HZZK0M1N203P4Q5R6S7T8V90", "status": 409, "error": { "code": "INVALID_STATE", "message": "Already SATISFIED" } }
    ]
  },
  "meta": { "action": "MARK_NOT_APPLICABLE", "effects": [ { "object": "audit_event", "count": 11, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-08-30T11:45:00Z" }
}
```

`VERIFY` is refused in bulk with `400 VALIDATION_ERROR` — a closure gate that can be cleared for a hundred instances in one click is not a gate.

---

## Invariants

- The register is materialised from published documents. There is no manual create or edit path for an obligation.
- An unresolved applicability rule blocks materialisation and is reported; it never defaults to `ALWAYS`.
- Verification requires a different person from submission, and passes the evidence gate before the outcome is read.
- A waiver binds one period only and never touches the parent obligation.
- A NIL return is an explicit positive declaration. Absence of filing is *unreported*, not *nil*.
- Every override of a closure gate is recorded with its reason, its corroborating reference, and the attempt it overrode.

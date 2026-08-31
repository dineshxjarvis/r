# Dashboard — measures, queues, and metric manifests

Read model only. Every value here is a query over `data-model.md §1–§4.6`, never a second copy of state (`dashboard-spec.md §1`: *it does not own a second copy of compliance state*). No dedicated ReBAC type — every endpoint clips results via `ListObjects` on `internal_viewer`/`published_viewer`, then filters in Postgres, the same pattern as `GET /mines` and `GET /obligation-instances`.

Operator and Ministry portfolio reads use authorised tenant/resource sets from [`../../../architecture/identity-authority-model.md`](../../../architecture/identity-authority-model.md). **Requested scope is always intersected with effective scope**, and both are returned.

Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/dashboard-spec.md`](../../../features/dashboard-spec.md).

> **Every number is a link, not a claim.** Every measure returns `numerator_record_refs` / `denominator_record_refs` so the UI drills straight to the underlying rows, and `freshness` so a stale value is never presented as live without saying so.

## Routes

| Route | Purpose |
|---|---|
| `GET /dashboard?view=measures` | The four compliance measures at any scope |
| `GET /dashboard?view=personal_queue` | The caller's own resolved work |
| `GET /metric-manifests` · `POST /metric-manifests` · `GET /metric-manifests/{id}` | Frozen, reproducible metric records |

`GET /dashboard/mine-summary`, `GET /dashboard/portfolio`, and the former projection-specific dashboard paths are gone. A mine summary is `GET /dashboard?view=measures&scope_type=MINE&scope_id=…&breakdowns=…`; a portfolio is the same call at `ORGANIZATION_UNIT`/`TENANT`/`PORTFOLIO` scope with `group_by=mine`. The personal queue is `GET /dashboard?view=personal_queue`. Both views share one authorization-clipped dashboard read model while retaining separately registered response schemas.

Domain-specific counts (defects by ageing band, CAPAs by status, findings by severity) are **not** here at all — they are `group_by` + `metrics` on the owning collection, which keeps the number and the drill-down on the same endpoint.

---

## GET /dashboard?view=measures

**Auth:** `portfolio.read` for organisation/tenant/portfolio scopes, or the appropriate compliance-read capability for a single mine. Regulator views require mandate, jurisdiction, purpose, and the published projection.

The four compliance measures (`data-model.md §5.2`), computed **live**. `metric_manifest` is written only on drill-down or export, not on every call here.

### Query params

| Param | Example | Notes |
|---|---|---|
| `scope_type` | `MINE` · `ORGANIZATION_UNIT` · `TENANT` · `PORTFOLIO` | Required |
| `scope_id` | `mine_01H…` | Required |
| `period_end` | `2026-08-30` | Required |
| `period_start` | `2026-04-01` | Defaults to the financial year containing `period_end` |
| `as_of` | `2026-06-15T00:00:00Z` | Time-travel mode; resolves through the temporal projection instead of live tables |
| `group_by` | `mine`, `organization_unit`, `owner_role`, `severity` | Splits the same measures across the authorised set |
| `breakdowns` | `notification_health,approval_backlog,obligation_calendar` | Optional extra blocks |
| `include_refs` | `true` | Inline the record refs; off by default because the arrays are large |
| `sort` | `attention` (default), `-verified_compliance_rate`, `-overdue_load` | |

### Response — 200 OK, single mine

```json
{
  "success": true,
  "data": {
    "scope": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "period": { "from": "2026-04-01", "to": "2026-08-30", "bounds": "[]" },
    "period_end": "2026-08-30",
    "as_of": null,
    "measures": {
      "eligible_count": 42,
      "verified_compliance_rate": "0.762",
      "submission_rate": "0.881",
      "overdue_load": 5,
      "unsupported_claim_load": 2
    },
    "measure_detail": {
      "verified_compliance_rate": {
        "metric_key": "verified_compliance_rate",
        "metric_version": 1,
        "numerator_value": 32,
        "denominator_value": 42,
        "excluded_count": 3,
        "exclusion_reasons": { "WAIVED": 2, "NOT_APPLICABLE": 1 },
        "drilldown": "/api/v1/obligation-instances?filter[mine_id]=mine_01HZY7A8B9C0D1E2F3G4H5J6K0&filter[status]=SATISFIED&filter[period_end]=2027-03-31"
      },
      "submission_rate": {
        "metric_key": "submission_rate",
        "metric_version": 1,
        "numerator_value": 37,
        "denominator_value": 42,
        "excluded_count": 3,
        "drilldown": "/api/v1/obligation-instances?filter[mine_id]=mine_01HZY7A8B9C0D1E2F3G4H5J6K0&filter[status]=SUBMITTED,SATISFIED"
      },
      "overdue_load": {
        "metric_key": "overdue_load",
        "metric_version": 1,
        "value": 5,
        "drilldown": "/api/v1/obligation-instances?filter[mine_id]=mine_01HZY7A8B9C0D1E2F3G4H5J6K0&filter[status]=OVERDUE"
      },
      "unsupported_claim_load": {
        "metric_key": "unsupported_claim_load",
        "metric_version": 1,
        "value": 2,
        "drilldown": "/api/v1/obligation-instances?filter[mine_id]=mine_01HZY7A8B9C0D1E2F3G4H5J6K0&filter[status]=SUBMITTED&filter[evidence_sufficient]=false"
      }
    },
    "scope_resolution": {
      "requested": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
      "effective": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"], "count": 1 },
      "clipped": false
    },
    "freshness": "LIVE",
    "source_watermarks": { "obligation_instance": "2026-08-30T11:58:00Z", "evidence": "2026-08-30T11:57:40Z", "capa": "2026-08-30T11:58:00Z" },
    "computed_at": "2026-08-30T12:00:00Z"
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T12:00:00Z", "as_of": null }
}
```

`verified_compliance_rate` and `submission_rate` render **`null`** (the UI shows `—`) when `eligible_count = 0` — never `0%` and never `100%` (`data-model.md §5.2`). A site with nothing due is not perfectly compliant and is not totally failing; it is *not measured*, and the API says so rather than inventing a number.

`overdue_load` and `unsupported_claim_load` are plain counts, **never** expressed as a rate. Five overdue obligations is five, not 12%.

### Response — 200 OK, portfolio with `?group_by=mine`

```json
{
  "success": true,
  "data": {
    "scope": { "type": "organization_unit", "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0", "display": "Korba Area" },
    "period": { "from": "2026-04-01", "to": "2026-08-30", "bounds": "[]" },
    "period_end": "2026-08-30",
    "as_of": null,
    "grouped_by": "mine",
    "groups": [
      {
        "key": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
        "measures": { "eligible_count": 42, "verified_compliance_rate": "0.762", "submission_rate": "0.881", "overdue_load": 5, "unsupported_claim_load": 2 },
        "attention_rank": 1
      },
      {
        "key": { "type": "mine", "id": "mine_01HZYB1C2D3E4F5G6H7J8K9T00", "display": "Dipka OCP" },
        "measures": { "eligible_count": 38, "verified_compliance_rate": "0.842", "submission_rate": "0.921", "overdue_load": 2, "unsupported_claim_load": 0 },
        "attention_rank": 2
      },
      {
        "key": { "type": "mine", "id": "mine_01HZYT0M1N203P4Q5R6S7T8V90", "display": "Kusmunda OCP" },
        "measures": { "eligible_count": 0, "verified_compliance_rate": null, "submission_rate": null, "overdue_load": 0, "unsupported_claim_load": 0 },
        "attention_rank": null,
        "note": "No eligible obligations in this period; rates are not computed"
      }
    ],
    "rollup": { "eligible_count": 80, "verified_compliance_rate": "0.800", "submission_rate": "0.900", "overdue_load": 7, "unsupported_claim_load": 2 },
    "scope_resolution": {
      "requested": { "type": "organization_unit", "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0", "recursive": true },
      "effective": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "mine_01HZYB1C2D3E4F5G6H7J8K9T00", "mine_01HZYT0M1N203P4Q5R6S7T8V90"], "count": 3 },
      "clipped": true,
      "clipped_count": 2,
      "clip_basis": "portfolio.read via jur_01HZYC2D3E4F5G6H7J8K9T0M10"
    },
    "freshness": "LIVE",
    "source_watermarks": { "obligation_instance": "2026-08-30T11:58:00Z" },
    "computed_at": "2026-08-30T12:00:00Z"
  },
  "warnings": [
    { "code": "PARTIAL_SCOPE", "message": "2 mines in the requested unit are outside your authorised set and are excluded from every figure above", "details": { "requested_mine_count": 5, "effective_mine_count": 3 } }
  ],
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T12:00:00Z" }
}
```

Groups are sorted by **attention order** — worst rate and highest overdue load first. *Decision support, not a league table* (`data-model.md §5.4`): `attention_rank` exists so the worst site is at the top, and it is `null` where nothing is measured, so an unmeasured mine never appears as either the best or the worst performer.

Cross-tenant Ministry results retain tenant boundaries and record effective scope. A clipped portfolio says so loudly in `warnings` — a rollup silently computed over three of five mines is the single most dangerous number this API could return.

### Response — 200 OK, `?as_of=2026-06-15T00:00:00Z`

```json
{
  "success": true,
  "data": {
    "scope": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "period_end": "2026-06-15",
    "as_of": "2026-06-15T00:00:00Z",
    "measures": { "eligible_count": 39, "verified_compliance_rate": "0.641", "submission_rate": "0.769", "overdue_load": 9, "unsupported_claim_load": 4 },
    "scope_resolution": {
      "requested": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
      "effective": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"], "count": 1 },
      "clipped": false,
      "authorization_evaluated_at": "2026-06-15T00:00:00Z"
    },
    "freshness": "HISTORICAL",
    "temporal_basis": { "method": "state_as_of replay", "projection_version": 2 },
    "computed_at": "2026-08-30T12:01:00Z"
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T12:01:00Z", "as_of": "2026-06-15T00:00:00Z" }
}
```

Time travel replays state **and** authorization at that instant. A mine that entered the caller's portfolio in July does not retroactively appear in June's figure.

### Errors

| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Missing or unsupported `scope_type`/`scope_id` |
| 400 | `UNKNOWN_PARAMETER` | Unrecognised `breakdowns` value |
| 403 | `FORBIDDEN` | No `portfolio.read` at the requested scope |
| 422 | `UNPROCESSABLE` | `as_of` earlier than the temporal projection's retention horizon; `details.earliest_supported_as_of` given |

---

## GET /dashboard?view=personal_queue

**Auth:** the authenticated principal's own resolved queue. Supervisory views use domain list capabilities (`GET /capas?filter[assigned_to]=…`) and **never impersonate another person's queue**.

Query: `filter[mine_id]`, `filter[section]` to fetch one block, `limit_per_section` (default 10).

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "resolved_via_appointments": [
      { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" } }
    ],
    "sections": {
      "due_today": {
        "count": 1,
        "items": [
          { "type": "obligation_instance", "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00", "display": "Plantation over 40 hectares", "due_on": "2026-08-30", "severity": "SIGNIFICANT", "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" }, "links": { "self": "/api/v1/obligation-instances/oi_01HZYX1Y2Z3A4B5C6D7E8F9G00" } }
        ],
        "more": "/api/v1/obligation-instances?filter[responsible_person_id]=per_01HZY9K0M1N2P3Q4R5S6T7V8V0&filter[due_on]=2026-08-30"
      },
      "overdue_on_me": { "count": 0, "items": [], "more": null },
      "awaiting_my_verification": {
        "count": 1,
        "items": [
          { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Reinstate 40m berm, east haul road", "submitted_at": "2026-08-30T14:20:00Z", "severity": "SEVERE", "required_capability": "finding.close_severe", "links": { "self": "/api/v1/capas/capa_01HZZAAB1C2D3E4F5G6H7J8K90" } }
        ],
        "more": "/api/v1/capas?filter[status]=SUBMITTED&filter[verifiable_by_me]=true"
      },
      "awaiting_my_approval": { "count": 0, "items": [], "more": "/api/v1/approvals?filter[decidable_by_me]=true" },
      "unacknowledged_notifications": {
        "count": 2,
        "items": [
          { "type": "notification", "id": "notif_01HZZTT8M9N0P1Q2R3S4T5V6V0", "display": "Plantation obligation due in 14 days", "severity": "SIGNIFICANT", "ack_due_at": "2026-08-31T00:05:00Z", "links": { "self": "/api/v1/notifications/notif_01HZZTT8M9N0P1Q2R3S4T5V6V0" } }
        ],
        "more": "/api/v1/notifications?filter[unacknowledged]=true"
      },
      "pending_sync": { "count": 0, "items": [], "more": null },
      "sync_failures": { "count": 0, "items": [], "more": null }
    },
    "totals": { "actionable": 4, "overdue": 0 },
    "freshness": "LIVE",
    "computed_at": "2026-08-30T14:25:00Z"
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T14:25:00Z" }
}
```

`awaiting_my_verification` is resolved server-side against `PERMISSION_BY_SEVERITY` (`data-model.md §5.3`). Only items the caller is **actually eligible to verify** appear — not every open submission at their mine. A queue that shows work you cannot do is worse than an empty one.

Every section carries a `more` link to the underlying collection with the exact filter that produced it. The queue is a shortcut into the domain collections, never a separate store.

---

## POST /metric-manifests

**Auth:** the same capability and effective-resource calculation as the metric being recorded. The server **recomputes** effective scope rather than trusting the submitted JSON.

Written the moment a viewer actually drills in, exports, or a number enters a report — **not** on every dashboard refresh (`data-model.md §5.1`). The client calls this right after `GET /dashboard?view=measures` with the same query, to freeze it as a permanent, reproducible record.

### Request

```json
{
  "metric_key": "verified_compliance_rate",
  "metric_version": 1,
  "viewer_requested_scope": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
  "period_start": "2026-04-01",
  "period_end": "2026-08-30",
  "as_of": null,
  "filters": null,
  "reason": "Included in the Q2 area compliance review pack",
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Metric frozen",
  "data": {
    "id": "mm_01HZZNN0P1Q2R3S4T5V6V7W8X0",
    "object": "metric_manifest",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "FROZEN",
    "available_actions": [],
    "metric_key": "verified_compliance_rate",
    "metric_version": 1,
    "viewer": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "viewer_requested_scope": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
    "effective_authorised_scope": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"], "count": 1 },
    "scope_was_clipped": false,
    "period_start": "2026-04-01",
    "period_end": "2026-08-30",
    "as_of": null,
    "filters": null,
    "numerator_value": 32,
    "denominator_value": 42,
    "value": "0.762",
    "numerator_record_refs": ["oi_01HZYX1Y2Z3A4B5C6D7E8F9G00", "oi_01HZZ0T5V6V7W8X9Y0Z1A2B3C0", "oi_01HZZ1V6V7W8X9Y0Z1A2B3C4D0"],
    "denominator_record_refs": ["oi_01HZYX1Y2Z3A4B5C6D7E8F9G00", "oi_01HZZ0T5V6V7W8X9Y0Z1A2B3C0", "oi_01HZZ1V6V7W8X9Y0Z1A2B3C4D0", "oi_01HZZ2V7W8X9Y0Z1A2B3C4D5E0"],
    "excluded_record_refs": [
      { "ref": "oi_01HZZ001Q2R3S4T5V6V7W8X9Y0", "reason": "WAIVED" },
      { "ref": "oi_01HZZ3W8X9Y0Z1A2B3C4D5E6F0", "reason": "NOT_APPLICABLE" }
    ],
    "record_ref_truncated": false,
    "source_watermarks": { "obligation_instance": "2026-08-30T11:58:00Z", "evidence": "2026-08-30T11:57:40Z" },
    "freshness": "LIVE",
    "reason": "Included in the Q2 area compliance review pack",
    "computed_at": "2026-08-30T12:00:00Z",
    "created_at": "2026-08-30T12:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "extensions": {},
    "links": { "self": "/api/v1/metric-manifests/mm_01HZZNN0P1Q2R3S4T5V6V7W8X0", "drilldown": "/api/v1/obligation-instances?filter[id][in]=oi_01HZYX1Y2Z3A4B5C6D7E8F9G00,oi_01HZZ0T5V6V7W8X9Y0Z1A2B3C0,oi_01HZZ1V6V7W8X9Y0Z1A2B3C4D0" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T12:00:00Z",
    "effects": [ { "object": "audit_event", "id": "aud_01HZZ4X9Y0Z1A2B3C4D5E6F7G0", "change": "CREATED" } ]
  }
}
```

`viewer_requested_scope` and `effective_authorised_scope` can differ. When a caller's request was clipped by ReBAC, **both** are recorded, so it is later provable *why* a number came out the way it did — not merely what it was. That is the difference between a defensible figure and an unexplainable one.

`record_ref_truncated` is `true` when the ref arrays exceeded the storage cap; the manifest then stores a deterministic query in `links.drilldown` plus a hash of the full ref set, so reproducibility survives without unbounded rows.

A manifest is immutable. It has no actions and no `PATCH` — re-running the metric produces a **new** manifest, and the two can be compared.

---

## GET /metric-manifests · GET /metric-manifests/{id}

**Auth:** creator self-read, or `portfolio.read`/`audit.read` covering the manifest's effective scope. Broader queries require that capability over **every** effective scope returned.

Filters: `metric_key`, `viewer_id`, `filter[scope.type]` + `filter[scope.id]`, `filter[period_end]`, `filter[computed_at][gte]`, `filter[scope_was_clipped]=true`, `filter[as_of][not_null]`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "mm_01HZZNN0P1Q2R3S4T5V6V7W8X0",
      "object": "metric_manifest",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "FROZEN",
      "metric_key": "verified_compliance_rate",
      "metric_version": 1,
      "viewer": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
      "viewer_requested_scope": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
      "effective_authorised_scope": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"], "count": 1 },
      "scope_was_clipped": false,
      "period_end": "2026-08-30",
      "numerator_value": 32,
      "denominator_value": 42,
      "value": "0.762",
      "freshness": "LIVE",
      "computed_at": "2026-08-30T12:00:00Z",
      "links": { "self": "/api/v1/metric-manifests/mm_01HZZNN0P1Q2R3S4T5V6V7W8X0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T12:05:00Z" }
}
```

---

## Invariants

- The dashboard owns no state. Every figure is a query over the domain tables, and every figure links back to them.
- A rate over an empty denominator is `null`, never `0` and never `1`.
- Counts are counts. `overdue_load` is never rendered as a percentage.
- Requested and effective scope are both returned, and a clipped result warns rather than quietly shrinking.
- `as_of` replays authorization as well as state.
- A metric manifest is immutable and records the exact record refs, watermarks, exclusions, and scope clipping behind one number.
- The personal queue shows only work the caller can actually do, resolved against the live severity ladder.

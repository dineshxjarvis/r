# Defects — observations

Table: `observation` (`data-model.md §3`). No dedicated ReBAC type — resolved in the app layer via `mine_id`, the same pattern as `extraction` and `asset`. Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/defect-management/defect-spec.md`](../../../features/defect-management/defect-spec.md).

Every observation is either resolved to a defect or explicitly dismissed (`defect-spec.md §2.3`). **Nothing here is deletable.**

Inspection-origin observations are created through the inspection domain ([`../inspections/inspections.md`](../inspections/inspections.md)) and carry immutable inspection, visit, checklist-response, actor, and authority provenance. This generic route cannot manufacture regulatory provenance, and a request that tries is `403 FORBIDDEN`.

## Routes

| Route | Purpose |
|---|---|
| `GET /observations` · `POST /observations` | Field intake and queue |
| `GET /observations/{id}` · `POST /observations/{id}/actions` · `GET /observations/{id}/history` | Read and decide |
| `POST /observations/actions` | Bulk decision over a filter |

`GET /observations/{id}/candidate-matches` is `GET /observations/{id}?expand=candidate_matches`. `POST /observations/{id}/match-decision` is `action: "DECIDE_MATCH"`.

---

## POST /observations

**Auth:** `observation.raise` on `mine_id`. Contractor callers additionally require a current affiliation, a live engagement, and the permitted capability on that engagement. Only `source_type: "FIELD_ENTRY"` is directly postable; every other source is a trusted system side effect.

`Idempotency-Key` required. Offline clients may also supply `client_id` for sync idempotence.

### Request

```json
{
  "client_id": "cobs_9c1a4b2e7d05f83b6a2e9d7c",
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "at_subunit_id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0",
  "at_asset_id": null,
  "description": "Safety berm missing along 40m of east haul road edge, drop of approx 3m",
  "description_i18n": { "en": "Safety berm missing along 40m of east haul road edge, drop of approx 3m", "hi": "पूर्वी हॉल रोड किनारे 40 मीटर तक सुरक्षा बर्म गायब, लगभग 3 मीटर की गिरावट" },
  "hazard_category": "HAUL_ROAD",
  "raised_severity": "SIGNIFICANT",
  "observed_at": "2026-08-30T09:15:00Z",
  "location": {
    "geometry": { "type": "Point", "coordinates": [82.4820, 22.3299], "srid": 4326 },
    "accuracy_m": "4.2",
    "altitude_m": "298.4",
    "source": "DEVICE_GNSS",
    "captured_at": "2026-08-30T09:15:00Z",
    "mock_location_flag": false,
    "provider": "fused"
  },
  "evidence_ids": ["ev_01HZYY1Z2A3B4C5D6E7F8G9H00"],
  "related_obligation_instance_id": null,
  "device": { "device_id": "dev_01HZZ0A1B2C3D4E5F6G7H8J9K0", "platform": "ANDROID", "app_version": "1.4.0", "clock_skew_ms": 42 },
  "extensions": {}
}
```

`location.source` must be `DEVICE_GNSS` or another device-captured provider — *captured, never typed* (`field-capture-spec.md §9`, `defect-spec.md §2.3`). A hand-entered coordinate (`source: "MANUAL"`) is **rejected**, not merely flagged.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Observation recorded; awaiting match decision",
  "data": {
    "id": "obs_01HZZ11B2C3D4E5F6G7H8J9K00",
    "object": "observation",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PENDING",
    "available_actions": ["DECIDE_MATCH", "DISMISS"],
    "client_id": "cobs_9c1a4b2e7d05f83b6a2e9d7c",
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "at_subunit": { "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "display": "Main Pit" },
    "at_asset": null,
    "source_type": "FIELD_ENTRY",
    "inspection_id": null,
    "inspection_visit_id": null,
    "inspection_response_id": null,
    "reported_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "reported_via_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "reported_by_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0",
    "issuing_authority_id": null,
    "description": "Safety berm missing along 40m of east haul road edge, drop of approx 3m",
    "description_i18n": { "en": "Safety berm missing along 40m of east haul road edge, drop of approx 3m", "hi": "पूर्वी हॉल रोड किनारे 40 मीटर तक सुरक्षा बर्म गायब, लगभग 3 मीटर की गिरावट" },
    "hazard_category": "HAUL_ROAD",
    "raised_severity": "SIGNIFICANT",
    "normalised_severity": "SIGNIFICANT",
    "normalisation_basis": { "vocabulary_version": 4, "rule": "FIELD_ENTRY severity map, no downgrade applied" },
    "observed_at": "2026-08-30T09:15:00Z",
    "location": {
      "geometry": { "type": "Point", "coordinates": [82.4820, 22.3299], "srid": 4326 },
      "accuracy_m": "4.2",
      "altitude_m": "298.4",
      "source": "DEVICE_GNSS",
      "captured_at": "2026-08-30T09:15:00Z",
      "mock_location_flag": false,
      "within_mine_geofence": true,
      "distance_to_asset_m": null
    },
    "evidence_ids": ["ev_01HZYY1Z2A3B4C5D6E7F8G9H00"],
    "matched_defect_id": null,
    "match_decision": "PENDING",
    "match_decision_by": null,
    "match_decision_at": null,
    "dismissed_reason": null,
    "created_at": "2026-08-30T09:16:00Z",
    "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "updated_at": "2026-08-30T09:16:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/observations/obs_01HZZ11B2C3D4E5F6G7H8J9K00", "history": "/api/v1/observations/obs_01HZZ11B2C3D4E5F6G7H8J9K00/history" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T09:16:00Z",
    "effects": [
      { "object": "notification", "count": 1, "change": "CREATED", "note": "Match decision queued to the observation.match holder at this mine" },
      { "object": "audit_event", "id": "aud_01HZZ0B1C2D3E4F5G6H7J8K9T0", "change": "CREATED" }
    ]
  }
}
```

`normalised_severity` is server-computed from `raised_severity` at intake using `defect-spec.md §2.2`'s vocabulary map. `raised_severity` is kept verbatim beside it and **never overwritten**, and `normalisation_basis` names the vocabulary version so a later map change is explainable rather than retroactive.

### Errors

| Status | Code | Condition |
|---|---|---|
| 400 | `VALIDATION_ERROR` | `location` missing, or `location.source` is not a device-captured provider |
| 403 | `FORBIDDEN` | `source_type` other than `FIELD_ENTRY` supplied, or `issuing_authority_id` supplied |
| 409 | `CONFLICT` | `client_id` already recorded for this principal — returns the original observation |
| 422 | `UNPROCESSABLE` | `at_subunit_id`/`at_asset_id` does not belong to `mine_id` |

---

## GET /observations/{id}

**Auth:** `defect.read` on the observation's mine, using the internal or published projection policy.

Query: `expand=candidate_matches,evidence,matched_defect,inspection`, `as_of`.

### Response — 200 OK, `?expand=candidate_matches`

pgvector-scored candidates against defects at the same mine (`defect-spec.md §3.2`: asset proximity, spatial distance, hazard category, embedding text similarity, time proximity — **combined, never any one alone**). This is a ranked proposal list. It **never auto-merges**; `DECIDE_MATCH` is what a human actually confirms (`defect-spec.md §3.3`).

```json
{
  "success": true,
  "data": {
    "id": "obs_01HZZ11B2C3D4E5F6G7H8J9K00",
    "object": "observation",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PENDING",
    "available_actions": ["DECIDE_MATCH", "DISMISS"],
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "source_type": "FIELD_ENTRY",
    "description": "Safety berm missing along 40m of east haul road edge, drop of approx 3m",
    "hazard_category": "HAUL_ROAD",
    "raised_severity": "SIGNIFICANT",
    "normalised_severity": "SIGNIFICANT",
    "observed_at": "2026-08-30T09:15:00Z",
    "match_decision": "PENDING",
    "matched_defect_id": null,
    "candidate_matches": [
      {
        "defect": { "type": "defect", "id": "def_01HZZ22C3D4E5F6G7H8J9K0T10", "display": "Safety berm degraded, east haul road" },
        "defect_status": "CLOSED",
        "score": 0.94,
        "rank": 1,
        "signals": {
          "asset_proximity": 0.98,
          "spatial_distance_m": "12.4",
          "hazard_category_match": true,
          "text_similarity": 0.89,
          "days_apart": 41
        },
        "resolver_version": "defect-resolver@v4",
        "note": "Matched defect is CLOSED — this is a recurrence candidate, not a merge candidate (defect-spec.md §3.2)"
      },
      {
        "defect": { "type": "defect", "id": "def_01HZZ33D4E5F6G7H8J9K0T1M20", "display": "Edge protection incomplete, west ramp" },
        "defect_status": "OPEN",
        "score": 0.41,
        "rank": 2,
        "signals": { "asset_proximity": 0.22, "spatial_distance_m": "1840.7", "hazard_category_match": true, "text_similarity": 0.63, "days_apart": 3 },
        "resolver_version": "defect-resolver@v4",
        "note": null
      }
    ],
    "links": { "self": "/api/v1/observations/obs_01HZZ11B2C3D4E5F6G7H8J9K00" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:20:00Z" }
}
```

---

## GET /observations

**Auth:** results clipped to mines covered by `defect.read`. The published regulator projection additionally requires mandate, jurisdiction, and a declared purpose.

Filters: `mine_id`, `match_decision` (`PENDING` · `MATCHED_EXISTING` · `NEW_DEFECT` · `DISMISSED`), `source_type` (`FIELD_ENTRY` · `DOCUMENT_EXTRACTION` · `ESCALATED_INSTANCE` · `INSPECTION`), `hazard_category`, `normalised_severity`, `reported_by`, `matched_defect_id`, `filter[observed_at][gte]`, `filter[geo.near]`, `q`, `as_of`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "obs_01HZZ11B2C3D4E5F6G7H8J9K00",
      "object": "observation",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "PENDING",
      "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "source_type": "FIELD_ENTRY",
      "description": "Safety berm missing along 40m of east haul road edge, drop of approx 3m",
      "hazard_category": "HAUL_ROAD",
      "normalised_severity": "SIGNIFICANT",
      "match_decision": "PENDING",
      "observed_at": "2026-08-30T09:15:00Z",
      "reported_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
      "links": { "self": "/api/v1/observations/obs_01HZZ11B2C3D4E5F6G7H8J9K00" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:22:00Z" }
}
```

---

## POST /observations/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `DECIDE_MATCH` | `observation.match` on the mine | optional | required | `match_decision = PENDING` | Creates or reopens a defect, links the observation, captures a resolver training signal |
| `DISMISS` | `observation.match` | **required** | required | `match_decision = PENDING` | `match_decision = DISMISSED`; the row survives — nothing here is deletable |
| `REOPEN_DECISION` | `observation.match` plus `defect.merge_split` | **required** | required | already decided | Undoes a wrong match decision and returns to `PENDING`, keeping both records |

`observation.match` is a **decision capability**, not implied by read access.

### DECIDE_MATCH — new defect

```json
{
  "action": "DECIDE_MATCH",
  "expected_version": 1,
  "payload": {
    "decision": "NEW_DEFECT",
    "defect": {
      "title": "Safety berm missing, east haul road",
      "title_i18n": { "en": "Safety berm missing, east haul road" },
      "hazard_category": "HAUL_ROAD",
      "at_asset_id": null,
      "at_subunit_id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0"
    },
    "rejected_candidate_ids": ["def_01HZZ22C3D4E5F6G7H8J9K0T10"],
    "decision_note": "Berm gap is 1.2km from the previously closed defect; different segment"
  }
}
```

```json
{
  "success": true,
  "message": "New defect opened from observation",
  "data": {
    "id": "obs_01HZZ11B2C3D4E5F6G7H8J9K00",
    "object": "observation",
    "version": 2,
    "state": "NEW_DEFECT",
    "match_decision": "NEW_DEFECT",
    "matched_defect_id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
    "match_decision_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "match_decision_at": "2026-08-30T09:40:00Z",
    "available_actions": ["REOPEN_DECISION"]
  },
  "included": {
    "defect:def_01HZZ44E5F6G7H8J9K0T1M2N30": {
      "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
      "object": "defect",
      "version": 1,
      "state": "OPEN",
      "title": "Safety berm missing, east haul road",
      "hazard_category": "HAUL_ROAD",
      "current_severity": "SIGNIFICANT",
      "first_observed_on": "2026-08-30",
      "recurrence_count": 0,
      "ageing_days": 0,
      "ageing_band": "LOW"
    }
  },
  "meta": {
    "action": "DECIDE_MATCH",
    "transition": { "from": "PENDING", "to": "NEW_DEFECT" },
    "effects": [
      { "object": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "change": "CREATED" },
      { "object": "resolver_training_signal", "id": "rts_01HZZ1C2D3E4F5G6H7J8K9T0M0", "change": "CREATED", "note": "Rejected candidate recorded as a negative example" },
      { "object": "notification", "count": 2, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ2D3E4F5G6H7J8K9T0M1N0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T09:40:00Z"
  }
}
```

### DECIDE_MATCH — matched to a CLOSED defect (recurrence)

```json
{
  "action": "DECIDE_MATCH",
  "expected_version": 1,
  "payload": { "decision": "MATCHED_EXISTING", "matched_defect_id": "def_01HZZ22C3D4E5F6G7H8J9K0T10", "decision_note": "Same 40m segment as the March defect; repair did not hold" }
}
```

```json
{
  "success": true,
  "message": "Matched to existing defect; recurrence recorded",
  "data": {
    "id": "obs_01HZZ11B2C3D4E5F6G7H8J9K00",
    "object": "observation",
    "version": 2,
    "state": "MATCHED_EXISTING",
    "match_decision": "MATCHED_EXISTING",
    "matched_defect_id": "def_01HZZ22C3D4E5F6G7H8J9K0T10",
    "match_decision_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "match_decision_at": "2026-08-30T09:41:00Z",
    "available_actions": ["REOPEN_DECISION"]
  },
  "included": {
    "defect:def_01HZZ22C3D4E5F6G7H8J9K0T10": {
      "id": "def_01HZZ22C3D4E5F6G7H8J9K0T10",
      "object": "defect",
      "version": 6,
      "state": "RECURRED",
      "title": "Safety berm degraded, east haul road",
      "current_severity": "SIGNIFICANT",
      "first_observed_on": "2026-03-12",
      "recurrence_count": 1,
      "last_recurred_at": "2026-08-30T09:41:00Z",
      "ageing_days": 171,
      "ageing_band": "CRITICAL"
    }
  },
  "meta": {
    "action": "DECIDE_MATCH",
    "transition": { "from": "PENDING", "to": "MATCHED_EXISTING" },
    "effects": [
      { "object": "defect", "id": "def_01HZZ22C3D4E5F6G7H8J9K0T10", "change": "STATE", "to": "RECURRED" },
      { "object": "resolver_training_signal", "id": "rts_01HZZ3E4F5G6H7J8K9T0M1N200", "change": "CREATED", "note": "Confirmed positive example, score 0.94" },
      { "object": "notification", "count": 3, "change": "CREATED", "note": "Recurrence escalates to the mine manager" },
      { "object": "audit_event", "id": "aud_01HZZ4F5G6H7J8K9T0M1N203P0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T09:41:00Z"
  }
}
```

`first_observed_on` is untouched at `2026-03-12`. That is the whole point of recurrence-as-reopen (`data-model.md §3.3`) — the ageing clock keeps running from the first sighting, so a repeatedly "fixed" hazard cannot reset its way out of a critical band.

### DISMISS

```json
{
  "action": "DISMISS",
  "expected_version": 1,
  "reason": "Duplicate of obs_01HZZ5G6H7J8K9T0M1N203P4Q0 filed 6 minutes earlier by the same crew",
  "payload": { "dismiss_reason_code": "DUPLICATE_REPORT", "duplicate_of_observation_id": "obs_01HZZ5G6H7J8K9T0M1N203P4Q0" }
}
```

```json
{
  "success": true,
  "message": "Observation dismissed",
  "data": {
    "id": "obs_01HZZ11B2C3D4E5F6G7H8J9K00",
    "object": "observation",
    "version": 2,
    "state": "DISMISSED",
    "match_decision": "DISMISSED",
    "dismissed_reason": "Duplicate of obs_01HZZ5G6H7J8K9T0M1N203P4Q0 filed 6 minutes earlier by the same crew",
    "match_decision_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "match_decision_at": "2026-08-30T09:42:00Z",
    "available_actions": ["REOPEN_DECISION"]
  },
  "meta": {
    "action": "DISMISS",
    "transition": { "from": "PENDING", "to": "DISMISSED" },
    "effects": [ { "object": "audit_event", "id": "aud_01HZZ6H7J8K9T0M1N203P4Q5R0", "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T09:42:00Z"
  }
}
```

### Errors

| Status | Code | Condition |
|---|---|---|
| 409 | `INVALID_STATE` | `match_decision` is not `PENDING` |
| 422 | `UNPROCESSABLE` | `matched_defect_id` belongs to a different `mine_id` — recurrence and merge never cross mines (`defect-spec.md §14`) |
| 400 | `VALIDATION_ERROR` | `decision: "MATCHED_EXISTING"` without `matched_defect_id`, or `NEW_DEFECT` without `defect.title` |

---

## POST /observations/actions

Bulk `DISMISS` over a filter, per-target authorization, `207` on mixed outcomes. Bulk `DECIDE_MATCH` is refused with `400 VALIDATION_ERROR` — a match decision names one defect per observation, and the resolver's whole design premise is that a human confirms each one.

```json
{
  "action": "DISMISS",
  "targets": ["obs_01HZZ7J8K9T0M1N203P4Q5R6S0", "obs_01HZZ8K9T0M1N203P4Q5R6S7T0"],
  "reason": "Training-mode submissions from the induction session on 2026-08-28, not real observations",
  "payload": { "dismiss_reason_code": "TEST_DATA" },
  "atomic": false
}
```

```json
{
  "success": true,
  "message": "2 of 2 dismissed",
  "data": {
    "requested": 2,
    "succeeded": 2,
    "failed": 0,
    "results": [
      { "id": "obs_01HZZ7J8K9T0M1N203P4Q5R6S0", "status": 200, "version": 2, "state": "DISMISSED" },
      { "id": "obs_01HZZ8K9T0M1N203P4Q5R6S7T0", "status": 200, "version": 2, "state": "DISMISSED" }
    ]
  },
  "meta": { "action": "DISMISS", "effects": [ { "object": "audit_event", "count": 2, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-08-30T09:45:00Z" }
}
```

---

## Invariants

- Location is device-captured or the request is rejected. A typed coordinate never enters the record.
- `raised_severity` is preserved verbatim; `normalised_severity` sits beside it with its vocabulary version.
- Candidate matching is a ranked proposal. Nothing auto-merges, at any score.
- Recurrence never resets `first_observed_on`, so the ageing clock survives a failed repair.
- Cross-mine matching and merging is out of scope and refused at the API.
- Every observation ends resolved or explicitly dismissed. None is deleted.

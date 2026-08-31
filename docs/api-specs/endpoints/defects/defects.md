# Defects — the physical problem record

Table: `defect` (`data-model.md §3`). ReBAC: `defect.viewer` / `can_merge_or_split: internal_viewer from at_mine` (`authorization-spec.md §3`). Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/defect-management/defect-spec.md`](../../../features/defect-management/defect-spec.md).

A defect is **the thing that is wrong**, distinct from the observations that reported it and the findings raised against it. There is no `POST /defects` — a defect is created only by a human match decision on an observation ([`observations.md`](observations.md), `action: "DECIDE_MATCH"`) or by a split.

## Routes

| Route | Purpose |
|---|---|
| `GET /defects` · `GET /defects/{id}` · `GET /defects/{id}/history` | Register and single read |
| `PATCH /defects/{id}` | Title/description/category correction |
| `POST /defects/{id}/actions` | Merge, split, reclassify severity, close, reopen |
| `POST /defects/actions` | Bulk over a filter |

`GET /defects/{id}/observations` is `GET /observations?filter[matched_defect_id]=def_01H…`. `GET /defects/{id}/findings` is `GET /findings?filter[defect_id]=def_01H…`. Both are also `expand` paths on the single read.

---

## GET /defects/{id}

**Auth:** `defect.read` on this defect through its mine and projection policy.

Query: `expand=observations,findings,capas,at_asset,evidence_summary`, `as_of`.

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
    "object": "defect",
    "version": 3,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "UNDER_ACTION",
    "available_actions": ["MERGE", "SPLIT", "RECLASSIFY_SEVERITY"],
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "at_subunit": { "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "display": "Main Pit" },
    "at_asset": { "type": "asset", "id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0", "display": "HR-12 North haul road segment" },
    "title": "Safety berm missing, east haul road",
    "title_i18n": { "en": "Safety berm missing, east haul road", "hi": "सुरक्षा बर्म गायब, पूर्वी हॉल रोड" },
    "description": "Safety berm missing along 40m of east haul road edge, drop of approx 3m",
    "hazard_category": "HAUL_ROAD",
    "status": "UNDER_ACTION",
    "current_severity": "SIGNIFICANT",
    "severity_history": [
      { "severity": "SIGNIFICANT", "set_at": "2026-08-30T09:40:00Z", "set_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" }, "basis": "OBSERVATION_NORMALISED" }
    ],
    "first_observed_on": "2026-08-30",
    "recurrence_count": 0,
    "last_recurred_at": null,
    "ageing_days": 14,
    "ageing_band": "MEDIUM",
    "ageing_band_config_version": 3,
    "merged_into_id": null,
    "split_from_id": null,
    "counts": { "observations": 2, "findings": 1, "open_capas": 1, "evidence": 5 },
    "open_finding_severity_max": "SIGNIFICANT",
    "earliest_capa_due_on": "2026-09-13",
    "created_at": "2026-08-30T09:40:00Z",
    "created_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "updated_at": "2026-09-13T10:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": {
      "self": "/api/v1/defects/def_01HZZ44E5F6G7H8J9K0T1M2N30",
      "history": "/api/v1/defects/def_01HZZ44E5F6G7H8J9K0T1M2N30/history",
      "observations": "/api/v1/observations?filter[matched_defect_id]=def_01HZZ44E5F6G7H8J9K0T1M2N30",
      "findings": "/api/v1/findings?filter[defect_id]=def_01HZZ44E5F6G7H8J9K0T1M2N30"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-13T10:05:00Z", "as_of": null }
}
```

`ageing_days` and `ageing_band` are **computed at read time** from `now() - first_observed_on` against `defect_ageing_band_config` for `current_severity` (`data-model.md §3.3`). Never stored, so a config change takes effect immediately with no backfill — and `ageing_band_config_version` tells you which thresholds produced this band, so yesterday's dashboard screenshot is still explainable.

### Response — 200 OK, `?expand=observations,findings`

```json
{
  "success": true,
  "data": {
    "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
    "object": "defect",
    "version": 3,
    "state": "UNDER_ACTION",
    "title": "Safety berm missing, east haul road",
    "current_severity": "SIGNIFICANT",
    "first_observed_on": "2026-08-30",
    "ageing_days": 14,
    "ageing_band": "MEDIUM",
    "observations": [
      { "id": "obs_01HZZ11B2C3D4E5F6G7H8J9K00", "object": "observation", "source_type": "FIELD_ENTRY", "raised_severity": "SIGNIFICANT", "normalised_severity": "SIGNIFICANT", "observed_at": "2026-08-30T09:15:00Z", "match_decision": "NEW_DEFECT", "reported_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" } },
      { "id": "obs_01HZZ9T0M1N203P4Q5R6S7T8V0", "object": "observation", "source_type": "INSPECTION", "raised_severity": "SEVERE", "normalised_severity": "SEVERE", "observed_at": "2026-09-07T07:40:00Z", "match_decision": "MATCHED_EXISTING", "reported_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" } }
    ],
    "findings": [
      { "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "object": "finding", "requirement_id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00", "severity": "SIGNIFICANT", "status": "CAPA_ASSIGNED", "issuing_authority_id": null, "raised_at": "2026-08-30T09:50:00Z" }
    ],
    "links": { "self": "/api/v1/defects/def_01HZZ44E5F6G7H8J9K0T1M2N30" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-13T10:05:00Z" }
}
```

The observation list is the **full history** — every observation ever matched to this defect, across every recurrence.

---

## GET /defects

**Auth:** results clipped to resources covered by `defect.read`.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[mine_id]` · `filter[at_subunit_id]` · `filter[at_asset_id]` | | |
| `filter[status]` | `OPEN,UNDER_ACTION,RECURRED` | |
| `filter[current_severity]` | `SEVERE` | |
| `filter[hazard_category]` | `HAUL_ROAD` | |
| `filter[ageing_band]` | `HIGH,CRITICAL` | Computed filter, evaluated server-side against the live config |
| `filter[ageing_days][gte]` | `30` | |
| `filter[recurrence_count][gte]` | `1` | The repeat-offender view |
| `filter[first_observed_on][lte]` | `2026-06-30` | |
| `filter[has_open_finding]` | `true` | |
| `filter[geo.near]` | `82.48,22.33,500m` | |
| `q` | `q=berm haul` | Title, description, and matched observation text |
| `sort` | `-ageing_days`, `-current_severity`, `-recurrence_count` | |
| `view` | `view=critical_ageing` | |
| `group_by` + `metrics` | `group_by=mine_id,ageing_band&metrics=count` | The ageing heat map, with no bespoke route |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
      "object": "defect",
      "version": 3,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "UNDER_ACTION",
      "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "title": "Safety berm missing, east haul road",
      "hazard_category": "HAUL_ROAD",
      "status": "UNDER_ACTION",
      "current_severity": "SIGNIFICANT",
      "first_observed_on": "2026-08-30",
      "ageing_days": 14,
      "ageing_band": "MEDIUM",
      "recurrence_count": 0,
      "counts": { "observations": 2, "findings": 1, "open_capas": 1 },
      "earliest_capa_due_on": "2026-09-13",
      "links": { "self": "/api/v1/defects/def_01HZZ44E5F6G7H8J9K0T1M2N30" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 47, "total_pages": 3, "has_next": true, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-13T10:06:00Z" }
}
```

### Aggregate — `?group_by=mine_id,ageing_band&metrics=count`

```json
{
  "success": true,
  "data": [
    { "key": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "ageing_band": "CRITICAL" }, "metrics": { "count": 3 } },
    { "key": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "ageing_band": "HIGH" }, "metrics": { "count": 8 } },
    { "key": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "ageing_band": "MEDIUM" }, "metrics": { "count": 21 } },
    { "key": { "mine_id": "mine_01HZYB1C2D3E4F5G6H7J8K9T00", "ageing_band": "CRITICAL" }, "metrics": { "count": 1 } }
  ],
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-13T10:06:00Z", "grouped_by": ["mine_id", "ageing_band"], "metrics": ["count"], "ageing_band_config_version": 3 }
}
```

Ageing bands are **configurable per severity**, and `meta.ageing_band_config_version` accompanies every aggregate. Without it, a dashboard comparing two months could silently compare two different definitions of "critical" — the false-equivalence risk `defect-spec.md` calls out.

---

## PATCH /defects/{id}

**Auth:** `defect.update` on the mine. Requires `expected_version` or `If-Match`. Only descriptive fields; status, severity, ageing, and lineage are action-driven.

### Request

```json
{
  "expected_version": 3,
  "title": "Safety berm missing, east haul road (chainage 1.2–1.24 km)",
  "description": "Safety berm missing along 40m of east haul road edge between chainage 1.20 and 1.24 km; drop of approximately 3m to the spoil bench.",
  "hazard_category": "HAUL_ROAD",
  "at_asset_id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0"
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Defect updated",
  "data": {
    "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
    "object": "defect",
    "version": 4,
    "title": "Safety berm missing, east haul road (chainage 1.2–1.24 km)",
    "description": "Safety berm missing along 40m of east haul road edge between chainage 1.20 and 1.24 km; drop of approximately 3m to the spoil bench.",
    "at_asset": { "type": "asset", "id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0", "display": "HR-12 North haul road segment" },
    "updated_at": "2026-09-13T10:10:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" }
  },
  "meta": { "action": "PATCH", "effects": [ { "object": "audit_event", "id": "aud_01HZZA0M1N203P4Q5R6S7T8V90", "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-09-13T10:10:00Z" }
}
```

---

## POST /defects/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `MERGE` | `defect.merge_split` on every source and target | **required** | required | all `OPEN`/`UNDER_ACTION`/`RECURRED`, same mine | Repoints observations and findings to the survivor; sources become `MERGED` |
| `SPLIT` | `defect.merge_split` on the source and all children | **required** | required | not `CLOSED` | Creates ≥2 children inheriting `first_observed_on`; original becomes `SPLIT` |
| `RECLASSIFY_SEVERITY` | `defect.reclassify_severity` on the mine | **required** | required | not `CLOSED` | Appends to `severity_history`; recomputes `ageing_band` |
| `CLOSE` | derived, not directly callable | — | — | every finding `CLOSED` | Set by the finding/CAPA closure cascade |
| `REOPEN` | `defect.reopen` | **required** | required | `CLOSED` | Back to `OPEN`; `first_observed_on` untouched |

Merge and split are **never automatic**. These routes only ever execute a human's confirmed decision, whatever confidence a candidate match carried.

### MERGE

```json
{
  "action": "MERGE",
  "expected_version": 4,
  "reason": "Duplicate reports of the same berm gap, filed independently by the A and B shift crews within 40 minutes",
  "payload": {
    "merge_defect_ids": ["def_01HZZ66G7H8J9K0T1M2N304P50"],
    "survivor_fields": { "title": "Safety berm missing, east haul road (chainage 1.2–1.24 km)", "current_severity": "SIGNIFICANT" }
  }
}
```

```json
{
  "success": true,
  "message": "1 defect merged into survivor",
  "data": {
    "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
    "object": "defect",
    "version": 5,
    "state": "UNDER_ACTION",
    "title": "Safety berm missing, east haul road (chainage 1.2–1.24 km)",
    "current_severity": "SIGNIFICANT",
    "first_observed_on": "2026-08-30",
    "recurrence_count": 0,
    "counts": { "observations": 4, "findings": 2, "open_capas": 2, "evidence": 9 },
    "merged_defect_ids": ["def_01HZZ66G7H8J9K0T1M2N304P50"],
    "available_actions": ["SPLIT", "RECLASSIFY_SEVERITY"]
  },
  "included": {
    "defect:def_01HZZ66G7H8J9K0T1M2N304P50": { "id": "def_01HZZ66G7H8J9K0T1M2N304P50", "object": "defect", "version": 3, "state": "MERGED", "merged_into_id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "available_actions": [] }
  },
  "meta": {
    "action": "MERGE",
    "transition": null,
    "effects": [
      { "object": "defect", "count": 1, "change": "STATE", "to": "MERGED" },
      { "object": "observation", "count": 2, "change": "REPOINTED", "note": "matched_defect_id moved to the survivor" },
      { "object": "finding", "count": 1, "change": "REPOINTED", "note": "defect_id moved to the survivor" },
      { "object": "resolver_training_signal", "id": "rts_01HZZB1N203P4Q5R6S7T8V9V00", "change": "CREATED", "note": "Human-confirmed merge, fed back to defect-resolver@v4" },
      { "object": "audit_event", "id": "aud_01HZZC203P4Q5R6S7T8V9V0W10", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-13T10:15:00Z"
  }
}
```

Errors: `400 VALIDATION_ERROR` when `merge_defect_ids` is empty, includes this defect's own id, or `reason` is missing; `422 UNPROCESSABLE` when a listed defect belongs to a different `mine_id` — cross-mine merge is explicitly out of scope (`defect-spec.md §14`).

### SPLIT

One defect is actually two — a single observation that bundled two distinct hazards.

```json
{
  "action": "SPLIT",
  "expected_version": 5,
  "reason": "Original observation text bundled a berm gap and a separate drainage blockage; they need different CAPAs and different owners",
  "payload": {
    "children": [
      { "title": "Safety berm missing, east haul road", "hazard_category": "HAUL_ROAD", "current_severity": "SIGNIFICANT", "at_asset_id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0", "carry_observation_ids": ["obs_01HZZ11B2C3D4E5F6G7H8J9K00"], "carry_finding_ids": ["find_01HZZ55F6G7H8J9K0T1M2N3040"] },
      { "title": "Drainage blocked, east haul road", "hazard_category": "WATER", "current_severity": "MINOR", "at_asset_id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0", "carry_observation_ids": ["obs_01HZZ9T0M1N203P4Q5R6S7T8V0"], "carry_finding_ids": [] }
    ]
  }
}
```

```json
{
  "success": true,
  "message": "Defect split into 2",
  "data": {
    "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
    "object": "defect",
    "version": 6,
    "state": "SPLIT",
    "split_child_ids": ["def_01HZZ77H8J9K0T1M2N304P5Q60", "def_01HZZ88J9K0T1M2N304P5Q6R70"],
    "available_actions": []
  },
  "included": {
    "defect:def_01HZZ77H8J9K0T1M2N304P5Q60": {
      "id": "def_01HZZ77H8J9K0T1M2N304P5Q60",
      "object": "defect",
      "version": 1,
      "state": "UNDER_ACTION",
      "title": "Safety berm missing, east haul road",
      "hazard_category": "HAUL_ROAD",
      "current_severity": "SIGNIFICANT",
      "first_observed_on": "2026-08-30",
      "ageing_days": 14,
      "ageing_band": "MEDIUM",
      "split_from_id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
      "counts": { "observations": 1, "findings": 1, "open_capas": 1 }
    },
    "defect:def_01HZZ88J9K0T1M2N304P5Q6R70": {
      "id": "def_01HZZ88J9K0T1M2N304P5Q6R70",
      "object": "defect",
      "version": 1,
      "state": "OPEN",
      "title": "Drainage blocked, east haul road",
      "hazard_category": "WATER",
      "current_severity": "MINOR",
      "first_observed_on": "2026-08-30",
      "ageing_days": 14,
      "ageing_band": "LOW",
      "split_from_id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
      "counts": { "observations": 1, "findings": 0, "open_capas": 0 }
    }
  },
  "meta": {
    "action": "SPLIT",
    "transition": { "from": "UNDER_ACTION", "to": "SPLIT" },
    "effects": [
      { "object": "defect", "count": 2, "change": "CREATED" },
      { "object": "observation", "count": 2, "change": "REPOINTED" },
      { "object": "finding", "count": 1, "change": "REPOINTED" },
      { "object": "resolver_training_signal", "id": "rts_01HZZD3P4Q5R6S7T8V9V0W1X20", "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZE4Q5R6S7T8V9V0W1X2Y30", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-13T10:20:00Z"
  }
}
```

Both children inherit the parent's `first_observed_on` — neither resets. *Whichever half is fixed first closes the other* is not a shared clock reset (`defect-spec.md §4`), and the two children age from the day the hazard was actually first seen.

Errors: `400 VALIDATION_ERROR` with fewer than 2 `children` or a missing `reason`; `422 UNPROCESSABLE` when a `carry_observation_ids` or `carry_finding_ids` entry does not belong to this defect, or when any observation or finding would be left unassigned.

### RECLASSIFY_SEVERITY

```json
{
  "action": "RECLASSIFY_SEVERITY",
  "expected_version": 6,
  "reason": "Post-inspection reassessment: the drop is 3m onto an active bench, not a spoil face; upgraded per DGMS observation of 2026-09-07",
  "payload": { "new_severity": "SEVERE", "basis": "INSPECTION_REASSESSMENT", "source_observation_id": "obs_01HZZ9T0M1N203P4Q5R6S7T8V0" }
}
```

```json
{
  "success": true,
  "message": "Severity reclassified to SEVERE",
  "data": {
    "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30",
    "object": "defect",
    "version": 7,
    "state": "UNDER_ACTION",
    "current_severity": "SEVERE",
    "severity_history": [
      { "severity": "SIGNIFICANT", "set_at": "2026-08-30T09:40:00Z", "set_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" }, "basis": "OBSERVATION_NORMALISED" },
      { "severity": "SEVERE", "set_at": "2026-09-13T10:25:00Z", "set_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" }, "basis": "INSPECTION_REASSESSMENT", "reason": "Post-inspection reassessment: the drop is 3m onto an active bench, not a spoil face; upgraded per DGMS observation of 2026-09-07" }
    ],
    "ageing_days": 14,
    "ageing_band": "CRITICAL",
    "available_actions": ["MERGE", "SPLIT", "RECLASSIFY_SEVERITY"]
  },
  "meta": {
    "action": "RECLASSIFY_SEVERITY",
    "transition": null,
    "effects": [
      { "object": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "change": "AGEING_BAND", "to": "CRITICAL", "note": "Same age, stricter band thresholds at SEVERE" },
      { "object": "notification", "count": 4, "change": "CREATED", "note": "Severity escalation routed per responsibility route" },
      { "object": "audit_event", "id": "aud_01HZZF5R6S7T8V9V0W1X2Y3Z40", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-13T10:25:00Z"
  }
}
```

Reclassification does not change `ageing_days` — it changes which band those days fall into, because the thresholds are per severity. The response shows both, so the jump from `MEDIUM` to `CRITICAL` at the same age is legible rather than alarming.

---

## POST /defects/actions

Bulk `RECLASSIFY_SEVERITY` and `REOPEN` over a filter, per-target authorization, `207` on mixed outcomes. Bulk `MERGE` and `SPLIT` are refused with `400 VALIDATION_ERROR` — both name specific per-defect payloads, and a batch version would be an unreviewed lineage rewrite.

```json
{
  "action": "REOPEN",
  "filter": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "status": "CLOSED", "hazard_category": "HAUL_ROAD", "first_observed_on": { "gte": "2026-01-01" } },
  "reason": "Haul road audit of 2026-09-12 found the berm reinstatement across the whole east section was cosmetic; all related closures are being reopened for re-verification",
  "atomic": false
}
```

```json
{
  "success": true,
  "message": "5 of 6 reopened",
  "data": {
    "requested": 6,
    "succeeded": 5,
    "failed": 1,
    "results": [
      { "id": "def_01HZZG6S7T8V9V0W1X2Y3Z4A50", "status": 200, "version": 9, "state": "OPEN" },
      { "id": "def_01HZZH7T8V9V0W1X2Y3Z4A5B60", "status": 200, "version": 4, "state": "OPEN" },
      { "id": "def_01HZZ18V9V0W1X2Y3Z4A5B6C70", "status": 403, "error": { "code": "FORBIDDEN", "message": "defect.reopen not held at this mine" } }
    ]
  },
  "meta": { "action": "REOPEN", "effects": [ { "object": "audit_event", "count": 5, "change": "CREATED" }, { "object": "notification", "count": 5, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-09-13T10:30:00Z" }
}
```

---

## Invariants

- There is no direct defect create. A defect exists because a human matched an observation to it, or split one.
- Merge and split are human decisions only, never automatic at any resolver confidence.
- Neither merge, split, nor recurrence resets `first_observed_on`. The ageing clock is the one thing a workflow cannot launder.
- `ageing_band` is computed live and always accompanied by its config version, so a threshold change is visible rather than silently rewriting history.
- `CLOSE` is a cascade result, not a directly callable action — a defect closes because its findings closed, which happened because their CAPAs were verified.
- Cross-mine merge is refused at the API, not merely discouraged.

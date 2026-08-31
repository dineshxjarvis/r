# Evidence — verification attempts

Table: `evidence_verification_attempt` (`data-model.md §4`). Conventions: [`../../README.md`](../../README.md).

**Read-only.** Every row is written as a side effect of `action: "VERIFY"` on a CAPA ([`../defects/capas.md`](../defects/capas.md)) or on an obligation instance ([`../documents/obligations.md`](../documents/obligations.md)). Nothing is created directly through this prefix.

This is the permanent, drillable record behind the flagship *blocked closure, explainable* moment (`feasibility-and-roadmap.md §4` step 10). Every attempt — accepted, rejected, blocked, or overridden — is queryable here. A blocked closure is not an error toast that vanishes; it is a row that a regulator can find six months later.

No dedicated ReBAC type — resolved via whichever target is set: `capa_id` → `capa.viewer`, `obligation_instance_id` → `obligation_instance.viewer`.

## Routes

| Route | Purpose |
|---|---|
| `GET /evidence?view=verification_attempts` · `GET /evidence/verification-attempts/{id}` | The attempt ledger and single attempt record |

No `POST`, no `PATCH`, no actions. An append-only judicial record with a write route would not be one.

---

## GET /evidence/verification-attempts/{id}

**Auth:** `evidence.read_internal` or a permitted published projection on the target. Decision-authority fields (`attempted_by`, `override_by`, `authorization_decision_id`) may additionally require `audit.read`.

### Response — 200 OK, accepted attempt

```json
{
  "success": true,
  "data": {
    "id": "va_01HZZBBC2D3E4F5G6H7J8K9T00",
    "object": "evidence_verification_attempt",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACCEPTED",
    "available_actions": [],
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "target": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Reinstate 40m berm, east haul road" },
    "capa_id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "obligation_instance_id": null,
    "evidence_ids": ["ev_01HZZDD2E3F4G5H6J7K8T9M0N1", "ev_01HZZKK7T8M9N0P1Q2R3S4T5V0"],
    "outcome": "ACCEPTED",
    "human_decision": "ACCEPT",
    "gate_results": [
      { "gate": "DISTANCE", "passed": true, "evidence_id": "ev_01HZZDD2E3F4G5H6J7K8T9M0N1", "distance_m": "3.2", "threshold_m": "50.0", "target_location": { "type": "Point", "coordinates": [82.4815, 22.3305], "srid": 4326 }, "evidence_location": { "type": "Point", "coordinates": [82.4817, 22.3300], "srid": 4326 } },
      { "gate": "GEOFENCE", "passed": true, "evidence_id": "ev_01HZZDD2E3F4G5H6J7K8T9M0N1", "within_geofence": true, "geofence_radius_m": 50 },
      { "gate": "VERIFIED_COUNT", "passed": true, "verified": 2, "suspect": 0, "unverified": 0, "required": 1 },
      { "gate": "METADATA_INTEGRITY", "passed": true, "hash_chain_valid": true, "device_integrity": "MEETS_DEVICE_INTEGRITY" },
      { "gate": "MOCK_LOCATION", "passed": true, "flagged_count": 0 }
    ],
    "distance_m": "3.2",
    "geofence_radius_m": 50,
    "within_geofence": true,
    "reason_detail": null,
    "attempted_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "attempted_via_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "attempted_at": "2026-08-30T15:00:00Z",
    "capability_exercised": "finding.close_severe",
    "authorization_decision_id": "azd_01HZZW1X2Y3Z4A5B6C7D8E9F00",
    "policy_version": 5,
    "gate_engine_version": "can_close_with@v3",
    "override_by": null,
    "override_reason": null,
    "corroborating_references": [],
    "created_at": "2026-08-30T15:00:00Z",
    "extensions": {},
    "links": {
      "self": "/api/v1/evidence/verification-attempts/va_01HZZBBC2D3E4F5G6H7J8K9T00",
      "target": "/api/v1/capas/capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "evidence": "/api/v1/evidence?filter[for_capa_id]=capa_01HZZAAB1C2D3E4F5G6H7J8K90"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:02:00Z" }
}
```

### Response — 200 OK, blocked attempt (the demo moment)

```json
{
  "success": true,
  "data": {
    "id": "va_01HZZEE3F4G5H6J7K8T9M0N1P2",
    "object": "evidence_verification_attempt",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "BLOCKED_DISTANCE_MISMATCH",
    "available_actions": [],
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "target": { "type": "capa", "id": "capa_01HZZFFF4G5H6J7K8T9M0N1P20", "display": "Repair conveyor guard, CHP" },
    "capa_id": "capa_01HZZFFF4G5H6J7K8T9M0N1P20",
    "obligation_instance_id": null,
    "evidence_ids": ["ev_01HZZGG4H5J6K7T8M9N0P1Q2R0"],
    "outcome": "BLOCKED_DISTANCE_MISMATCH",
    "human_decision": null,
    "gate_results": [
      {
        "gate": "DISTANCE",
        "passed": false,
        "evidence_id": "ev_01HZZGG4H5J6K7T8M9N0P1Q2R0",
        "distance_m": "4820.6",
        "threshold_m": "50.0",
        "target": { "type": "asset", "id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0", "display": "CHP conveyor CV-04" },
        "target_location": { "type": "Point", "coordinates": [82.4815, 22.3305], "srid": 4326 },
        "evidence_location": { "type": "Point", "coordinates": [82.4201, 22.2891], "srid": 4326 },
        "explanation": "Closure evidence was captured 4.82 km from the conveyor it claims to show."
      },
      { "gate": "GEOFENCE", "passed": false, "evidence_id": "ev_01HZZGG4H5J6K7T8M9N0P1Q2R0", "within_geofence": false, "geofence_radius_m": 50 },
      { "gate": "VERIFIED_COUNT", "passed": true, "verified": 1, "suspect": 0, "unverified": 0, "required": 1 },
      { "gate": "METADATA_INTEGRITY", "passed": true, "hash_chain_valid": true },
      { "gate": "MOCK_LOCATION", "passed": true, "flagged_count": 0 }
    ],
    "distance_m": "4820.6",
    "geofence_radius_m": 50,
    "within_geofence": false,
    "reason_detail": {
      "blocking_gate": "DISTANCE",
      "overridable": false,
      "overridable_reason": "DISTANCE is a physical measurement, not a trust judgment. can_override_verdict applies only to evidence.verdict.",
      "resolution": "Capture closure evidence at the conveyor and resubmit the CAPA"
    },
    "attempted_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "attempted_via_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "attempted_at": "2026-08-30T15:05:00Z",
    "capability_exercised": "finding.close_significant",
    "authorization_decision_id": "azd_01HZZTT8M9N0P1Q2R3S4T5V6W0",
    "policy_version": 5,
    "gate_engine_version": "can_close_with@v3",
    "override_by": null,
    "override_reason": null,
    "corroborating_references": [],
    "created_at": "2026-08-30T15:05:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/evidence/verification-attempts/va_01HZZEE3F4G5H6J7K8T9M0N1P2", "target": "/api/v1/capas/capa_01HZZFFF4G5H6J7K8T9M0N1P20" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:06:00Z" }
}
```

Every gate is reported, not only the failing one. A reader sees that the metadata was fine, the device was fine, and the photo was simply taken 4.82 km away — which is a different and far more useful statement than "closure failed".

### Response — 200 OK, overridden attempt

```json
{
  "success": true,
  "data": {
    "id": "va_01HZZ0B5C6D7E8F9G0H112J3K0",
    "object": "evidence_verification_attempt",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACCEPTED_WITH_OVERRIDE",
    "target": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Reinstate 40m berm, east haul road" },
    "capa_id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "obligation_instance_id": null,
    "evidence_ids": ["ev_01HZZEE3F4G5H6J7K8T9M0N1P2"],
    "outcome": "ACCEPTED_WITH_OVERRIDE",
    "human_decision": "ACCEPT",
    "gate_results": [
      { "gate": "DISTANCE", "passed": true, "distance_m": "3.2", "threshold_m": "50.0" },
      { "gate": "GEOFENCE", "passed": true, "within_geofence": true },
      { "gate": "VERIFIED_COUNT", "passed": true, "verified": 3, "suspect": 1, "unverified": 0, "required": 1 },
      { "gate": "METADATA_INTEGRITY", "passed": true, "hash_chain_valid": true },
      { "gate": "MOCK_LOCATION", "passed": false, "flagged_count": 1, "evidence_id": "ev_01HZZEE3F4G5H6J7K8T9M0N1P2", "overridden": true }
    ],
    "distance_m": "3.2",
    "within_geofence": true,
    "reason_detail": { "blocking_gate": "MOCK_LOCATION", "overridable": true, "override_capability": "can_override_verdict" },
    "attempted_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "attempted_at": "2026-08-30T15:10:00Z",
    "capability_exercised": "finding.close_severe",
    "authorization_decision_id": "azd_01HZZMM9N0P1Q2R3S4T5V6V7X0",
    "policy_version": 5,
    "gate_engine_version": "can_close_with@v3",
    "override_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "override_reason": "Device flagged mock-location due to a known GPS drift bug on this handset build; cross-checked against the worker's RFID cap-lamp log for the same timestamps",
    "corroborating_references": [
      { "type": "attendance_event", "id": "att_01HZZ45E6F7G8H9J0K1T2M3N40", "display": "RFID cap-lamp read, 14:09 IST" },
      { "type": "device_incident", "id": "dinc_01HZZZ4A5B6C7D8E9F0G1H2130", "display": "Known GPS drift, Pixel 7 build TQ3A.230901" }
    ],
    "security_event_id": "sec_01HZZ1C6D7E8F9G0H112J3K4T0",
    "created_at": "2026-08-30T15:10:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/evidence/verification-attempts/va_01HZZ0B5C6D7E8F9G0H112J3K0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:12:00Z" }
}
```

The failing gate stays in `gate_results` marked `overridden: true`. An override never rewrites what it overrode, and it always carries a `security_event_id` — the same discipline as break-glass access (`authorization-spec.md §11`).

---

## GET /evidence?view=verification_attempts

**Auth:** results clipped to target records covered by the corresponding evidence-read capability.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[capa_id]` · `filter[obligation_instance_id]` | | |
| `filter[mine_id]` | `mine_01H…` | |
| `filter[outcome]` | `BLOCKED_DISTANCE_MISMATCH,BLOCKED_SUSPECT_EVIDENCE` | |
| `filter[blocked]` | `true` | Any `BLOCKED_*` outcome |
| `filter[overridden]` | `true` | The override review queue |
| `filter[attempted_by]` | `per_01H…` | |
| `filter[attempted_at][gte]` | `2026-08-01T00:00:00Z` | |
| `filter[distance_m][gte]` | `1000` | Far-away closure attempts |
| `filter[evidence_id]` | `ev_01H…` | Every attempt that relied on one piece of evidence |
| `sort` | `-attempted_at`, `-distance_m` | |
| `group_by` + `metrics` | `group_by=outcome,mine_id&metrics=count` | |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "va_01HZZEE3F4G5H6J7K8T9M0N1P2",
      "object": "evidence_verification_attempt",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "BLOCKED_DISTANCE_MISMATCH",
      "target": { "type": "capa", "id": "capa_01HZZFFF4G5H6J7K8T9M0N1P20", "display": "Repair conveyor guard, CHP" },
      "outcome": "BLOCKED_DISTANCE_MISMATCH",
      "distance_m": "4820.6",
      "within_geofence": false,
      "attempted_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
      "attempted_at": "2026-08-30T15:05:00Z",
      "override_by": null,
      "links": { "self": "/api/v1/evidence/verification-attempts/va_01HZZEE3F4G5H6J7K8T9M0N1P2" }
    },
    {
      "id": "va_01HZZBBC2D3E4F5G6H7J8K9T00",
      "object": "evidence_verification_attempt",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "ACCEPTED",
      "target": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Reinstate 40m berm, east haul road" },
      "outcome": "ACCEPTED",
      "distance_m": "3.2",
      "within_geofence": true,
      "attempted_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
      "attempted_at": "2026-08-30T15:00:00Z",
      "override_by": null,
      "links": { "self": "/api/v1/evidence/verification-attempts/va_01HZZBBC2D3E4F5G6H7J8K9T00" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 2, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:15:00Z" }
}
```

This is the exact collection a dashboard tile's drill-down resolves to — *every number is a link, not a claim*.

### Aggregate — `?group_by=outcome&metrics=count&filter[attempted_at][gte]=2026-08-01T00:00:00Z`

```json
{
  "success": true,
  "data": [
    { "key": { "outcome": "ACCEPTED" }, "metrics": { "count": 412 } },
    { "key": { "outcome": "ACCEPTED_WITH_OVERRIDE" }, "metrics": { "count": 7 } },
    { "key": { "outcome": "BLOCKED_DISTANCE_MISMATCH" }, "metrics": { "count": 23 } },
    { "key": { "outcome": "BLOCKED_ALL_UNVERIFIED" }, "metrics": { "count": 4 } },
    { "key": { "outcome": "BLOCKED_SUSPECT_EVIDENCE" }, "metrics": { "count": 11 } },
    { "key": { "outcome": "BLOCKED_METADATA_TAMPERED" }, "metrics": { "count": 1 } }
  ],
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:15:00Z", "grouped_by": ["outcome"], "metrics": ["count"], "gate_engine_version": "can_close_with@v3" }
}
```

Seven overrides against 412 clean closures is a governance signal. Twenty-three distance blocks at one mine is an operational one. Both are one query, and neither needs a bespoke report route.

---

## Invariants

- Write-only through verification actions; this prefix has no create, update, or delete.
- Every attempt is persisted, whichever outcome. A blocked closure is a permanent record, not a dismissed toast.
- All gates are reported, not just the failing one.
- `DISTANCE` and `METADATA_INTEGRITY` are never overridable. Only a trust judgment on `evidence.verdict` is.
- Every override carries its reason, its corroborating references, and a `security_event_id`.
- `gate_engine_version` and `policy_version` accompany every row, so an attempt from last year is still explainable under the rules that judged it.

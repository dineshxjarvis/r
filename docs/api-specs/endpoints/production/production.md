# Production — material events, measurement, dispatch, stock, and approved facts

Domain rules: [`../../../features/production/production-dispatch-stock-spec.md`](../../../features/production/production-dispatch-stock-spec.md). Relational contract: [`../../../architecture/production-data-model.md`](../../../architecture/production-data-model.md). Conventions: [`../../README.md`](../../README.md).

Canonical quantities are **decimal metric tonnes with an explicit basis**, always as `{ "value": "…", "unit": "…", "basis": "…" }`. There is no float anywhere in this domain. Gross/tare/net arithmetic and every unit conversion use versioned decimal rules, and the version travels with the number.

A measurement is never deleted. `TEST`, `CALIBRATION`, `DUPLICATE`, and `VOIDED_WITH_REASON` are **classifications**, and a classified-out measurement stays on the record while never entering an approved manifest.

## Routes

| Route | Purpose |
|---|---|
| `GET /material-events?view=catalog&filter[type]=MATERIAL,ACCOUNTING_BOUNDARY,STOCK_LOCATION,MEASUREMENT_DEVICE` | Typed, effective-dated production catalogue |
| `GET /device-calibrations` · `POST /device-calibrations` | Calibration record |
| `GET /production-source-policies` · `POST /production-source-policies` · `POST /production-source-policies/{id}/actions` | Which source wins, and when |
| `GET /material-events?view=lots` · `GET /material-events/lots/{id}` | Lot lineage projection |
| `GET /material-events` · `POST /material-events` · `GET /material-events/{id}` · `POST /material-events/{id}/actions` | Extraction, transfer, rehandling, loss |
| `GET /quantity-measurements` · `POST /quantity-measurements` · `POST /quantity-measurements/{id}/actions` | Weighbridge, survey, belt scale, declaration |
| `GET /processing-runs` · `POST /processing-runs` · `POST /processing-runs/{id}/actions` | Wash, crush, screen |
| `GET /dispatch-consignments` · `POST /dispatch-consignments` · `GET /dispatch-consignments/{id}` · `POST /dispatch-consignments/{id}/actions` | Consignment and vehicle legs |
| `GET /stock-snapshots` · `POST /stock-snapshots` | Book (derived) and physical (surveyed) |
| `GET /stock-adjustments` · `POST /stock-adjustments` · `POST /stock-adjustments/{id}/actions` | Proposed, then approved by someone else |
| `GET /production-discrepancies` · `POST /production-discrepancies/{id}/actions` | The queue that must not be silently closed |
| `GET /production-periods` · `POST /production-periods` · `POST /production-periods/{id}/actions` | Open, cut off, approve, publish, reopen |
| `GET /production-periods?view=approved_facts` | The published, reproducible numbers |
| `GET /external-fact-mirrors` · `POST /external-fact-mirrors/{id}/actions` | What we told other systems, and whether it matched |

The former `/material-definitions`, `/material-accounting-boundaries`, `/stock-locations`, `/measurement-devices`, and intermediate `/production-catalog` lists are the `catalog` view of `/material-events`. They share production-read authorization, temporal reads, pagination, and the common fields `code`, `name`, `valid_period`, and `provenance`; type-specific fields remain sparse fields. Unknown types are `400 UNKNOWN_FILTER_VALUE`. Calibration records stay separate because they have an independent lifecycle.

Vehicle legs, classifications, releases, decisions, transitions, and reopens are all `action` values. `GET /production-periods/{id}/facts` is `GET /production-periods?view=approved_facts&filter[id]=…`.

---

## POST /material-events

**Auth:** `production.record_event` on the accounting boundary. A contractor caller additionally needs a current affiliation, a live engagement, and the permitted capability.

Idempotent on `(tenant_id, client_event_id)`. `Idempotency-Key` also accepted.

### Request — extraction

```json
{
  "client_event_id": "cevt_9c1a4b2e7d05f83b6a2e9d7c",
  "accounting_boundary_id": "mab_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "event_kind": "EXTRACTION",
  "occurred_from": "2026-09-14T06:00:00Z",
  "occurred_to": "2026-09-14T14:00:00Z",
  "source_location_id": null,
  "destination_location_id": "stl_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "operating_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0",
  "contractor_engagement_id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300",
  "lots": [
    {
      "direction": "OUT",
      "material_definition_id": "matd_01HZY3C4D5E6F7G8H9J0K1T2M0",
      "origin_mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
      "origin_kind": "FACE",
      "origin_ref": "PIT-1/BENCH-4/PANEL-B",
      "quantity_measurement_id": "qm_01HZY4D5E6F7G8H9J0K1T2M3N0"
    }
  ],
  "evidence_ids": ["ev_01HZY5E6F7G8H9J0K1T2M3N400"],
  "extensions": {}
}
```

### Request — internal transfer

```json
{
  "client_event_id": "cevt_7d1a9c4e2f6b830d5ae91f4c",
  "accounting_boundary_id": "mab_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "event_kind": "INTERNAL_TRANSFER",
  "occurred_from": "2026-09-14T14:10:00Z",
  "occurred_to": "2026-09-14T14:10:00Z",
  "source_location_id": "stl_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "destination_location_id": "stl_01HZY6F7G8H9J0K1T2M3N405P0",
  "lots": [
    { "direction": "OUT", "lot_id": "lot_01HZY7G8H9J0K1T2M3N405P6Q0", "quantity_measurement_id": "qm_01HZY8H9J0K1T2M3N405P6Q7R0", "lineage_fraction": "1.000000" },
    { "direction": "IN", "lot_id": "lot_01HZY7G8H9J0K1T2M3N405P6Q0", "quantity_measurement_id": "qm_01HZY8H9J0K1T2M3N405P6Q7R0", "lineage_fraction": "1.000000" }
  ],
  "extensions": {}
}
```

An internal transfer **must** have both source and destination, and must net to zero across the mine boundary. Rehandling can never create origin quantity — a `REHANDLING` event whose `OUT` exceeds the lot's remaining balance is `422 UNPROCESSABLE`.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Material event recorded",
  "data": {
    "id": "mevt_01HZY9J0K1T2M3N405P6Q7R8S0",
    "object": "material_event",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "RECORDED",
    "available_actions": ["VOID", "SUPERSEDE"],
    "client_event_id": "cevt_9c1a4b2e7d05f83b6a2e9d7c",
    "accounting_boundary": { "type": "material_accounting_boundary", "id": "mab_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "Gevra OCP production boundary" },
    "event_kind": "EXTRACTION",
    "occurred_from": "2026-09-14T06:00:00Z",
    "occurred_to": "2026-09-14T14:00:00Z",
    "recorded_at": "2026-09-14T14:06:00Z",
    "source_location": null,
    "destination_location": { "type": "stock_location", "id": "stl_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "ROM stockpile A" },
    "operating_organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "contractor_engagement": { "type": "contractor_engagement", "id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300", "display": "SECL/KRB/OB-REMOVAL/2026/17" },
    "legal_owner": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "lots": [
      {
        "id": "mevl_01HZYA0B1C2D3E4F5G6H7J8K90",
        "direction": "OUT",
        "lot": { "type": "material_lot", "id": "lot_01HZYB1C2D3E4F5G6H7J8K9T00", "display": "ROM coal, PIT-1/BENCH-4/PANEL-B, 2026-09-14" },
        "material_definition": { "type": "material_definition", "id": "matd_01HZY3C4D5E6F7G8H9J0K1T2M0", "display": "ROM coal, G8 grade" },
        "quantity": { "value": "4218.640", "unit": "TONNE", "basis": "AIR_DRIED" },
        "quantity_measurement_id": "qm_01HZY4D5E6F7G8H9J0K1T2M3N0",
        "lineage_fraction": null,
        "origin_mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
        "origin_kind": "FACE",
        "origin_ref": "PIT-1/BENCH-4/PANEL-B"
      }
    ],
    "net_across_boundary": { "value": "4218.640", "unit": "TONNE", "basis": "AIR_DRIED" },
    "conversion_policy_version": 4,
    "evidence_ids": ["ev_01HZY5E6F7G8H9J0K1T2M3N400"],
    "status": "RECORDED",
    "included_in_period_id": "prdp_01HZYC2D3E4F5G6H7J8K9T0M10",
    "created_at": "2026-09-14T14:06:00Z",
    "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "updated_at": "2026-09-14T14:06:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/material-events/mevt_01HZY9J0K1T2M3N405P6Q7R8S0", "history": "/api/v1/material-events/mevt_01HZY9J0K1T2M3N405P6Q7R8S0/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T14:06:00Z", "effects": [ { "object": "material_lot", "count": 1, "change": "CREATED" }, { "object": "stock_book_snapshot", "count": 1, "change": "INVALIDATED", "note": "Book projection will rebuild for stl_01HZY2B3C4D5E6F7G8H9J0K1T0" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

`contractor_engagement` and `operating_organization` describe **who did the work**. `legal_owner` is derived from the tenant and mine and is not settable — a contractor operating a face never becomes the owner of what came out of it.

A **shared facility** event (`accounting_boundary.boundary_kind = FACILITY`) retains per-lot `origin_mine` allocation lineage. No fabricated owning mine is ever required.

---

## POST /quantity-measurements

**Auth:** `production.record_measurement` on the boundary, or a trusted adapter principal for device ingestion. Idempotent on `(tenant_id, source_system, source_record_id)`.

### Request

```json
{
  "source_kind": "WEIGHBRIDGE",
  "source_system": "SECL_WB_GEVRA",
  "source_record_id": "WB/2026/09/14/118442",
  "device_id": "mdev_01HZYD3E4F5G6H7J8K9T0M1N20",
  "observed_value": "4218.640",
  "observed_unit": "TONNE",
  "basis": "AIR_DRIED",
  "uncertainty": { "value": "2.110", "unit": "TONNE", "kind": "EXPANDED_K2" },
  "device_time": "2026-09-14T14:02:41Z",
  "moisture_percent": "8.40",
  "evidence_id": "ev_01HZY5E6F7G8H9J0K1T2M3N400",
  "classification": "OPERATIONAL",
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Measurement recorded",
  "data": {
    "id": "qm_01HZY4D5E6F7G8H9J0K1T2M3N0",
    "object": "quantity_measurement",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "OPERATIONAL",
    "available_actions": ["CLASSIFY", "SUPERSEDE"],
    "source_kind": "WEIGHBRIDGE",
    "source_system": "SECL_WB_GEVRA",
    "source_record_id": "WB/2026/09/14/118442",
    "device": { "type": "measurement_device", "id": "mdev_01HZYD3E4F5G6H7J8K9T0M1N20", "display": "Weighbridge WB-2, Gevra pit-head" },
    "observed": { "value": "4218.640", "unit": "TONNE", "basis": "AIR_DRIED" },
    "normalized": { "value": "4218.640", "unit": "TONNE", "basis": "AIR_DRIED" },
    "conversion_policy_version": 4,
    "uncertainty": { "value": "2.110", "unit": "TONNE", "kind": "EXPANDED_K2" },
    "moisture_percent": "8.40",
    "device_time": "2026-09-14T14:02:41Z",
    "received_at": "2026-09-14T14:03:05Z",
    "time_confidence": "DEVICE_SYNCHRONISED",
    "clock_skew_ms": 340,
    "calibration": { "id": "dcal_01HZYE4F5G6H7J8K9T0M1N2030", "valid_from": "2026-07-01T00:00:00Z", "valid_until": "2027-01-01T00:00:00Z", "result": "PASS", "tolerance": { "value": "0.50", "unit": "PERCENT" }, "within_interval": true },
    "classification": "OPERATIONAL",
    "classification_reason": null,
    "supersedes_id": null,
    "superseded_by_id": null,
    "evidence_id": "ev_01HZY5E6F7G8H9J0K1T2M3N400",
    "used_in": { "material_event_ids": ["mevt_01HZY9J0K1T2M3N405P6Q7R8S0"], "dispatch_leg_ids": [] },
    "created_at": "2026-09-14T14:03:05Z",
    "extensions": {},
    "links": { "self": "/api/v1/quantity-measurements/qm_01HZY4D5E6F7G8H9J0K1T2M3N0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T14:03:05Z" }
}
```

### Response — 201 Created, outside calibration

```json
{
  "success": true,
  "message": "Measurement recorded; device outside its calibration interval, discrepancy opened",
  "data": {
    "id": "qm_01HZYF5G6H7J8K9T0M1N203P40",
    "object": "quantity_measurement",
    "version": 1,
    "state": "OPERATIONAL",
    "device": { "type": "measurement_device", "id": "mdev_01HZYG6H7J8K9T0M1N203P4Q50", "display": "Belt scale BS-1, CHP" },
    "observed": { "value": "1180.220", "unit": "TONNE", "basis": "AS_RECEIVED" },
    "normalized": { "value": "1094.912", "unit": "TONNE", "basis": "AIR_DRIED" },
    "conversion_policy_version": 4,
    "calibration": { "id": "dcal_01HZYH7J8K9T0M1N203P4Q5R60", "valid_from": "2025-08-01T00:00:00Z", "valid_until": "2026-08-01T00:00:00Z", "result": "PASS", "within_interval": false, "days_overdue": 44 },
    "classification": "OPERATIONAL",
    "discrepancy_id": "pdis_01HZYJ8K9T0M1N203P4Q5R6S70",
    "available_actions": ["CLASSIFY", "SUPERSEDE"]
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-09-14T14:10:00Z",
    "effects": [ { "object": "production_discrepancy", "id": "pdis_01HZYJ8K9T0M1N203P4Q5R6S70", "change": "CREATED", "note": "DEVICE_OUT_OF_CALIBRATION" }, { "object": "notification", "count": 3, "change": "CREATED" } ]
  }
}
```

The measurement is **kept**, not rejected. Refusing it would lose the only record of what the belt actually said; opening a discrepancy makes the doubt explicit and owned.

### Action — CLASSIFY

```json
{
  "action": "CLASSIFY",
  "expected_version": 1,
  "reason": "Duplicate ticket printed after a printer jam; the same load already recorded as WB/2026/09/14/118442",
  "payload": { "classification": "DUPLICATE", "duplicate_of_measurement_id": "qm_01HZY4D5E6F7G8H9J0K1T2M3N0" }
}
```

```json
{
  "success": true,
  "message": "Measurement classified as DUPLICATE",
  "data": {
    "id": "qm_01HZYK9T0M1N203P4Q5R6S7T80",
    "object": "quantity_measurement",
    "version": 2,
    "state": "DUPLICATE",
    "classification": "DUPLICATE",
    "classification_reason": "Duplicate ticket printed after a printer jam; the same load already recorded as WB/2026/09/14/118442",
    "classified_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "classified_at": "2026-09-14T15:00:00Z",
    "excluded_from_manifests": true,
    "available_actions": ["CLASSIFY"]
  },
  "meta": {
    "action": "CLASSIFY",
    "transition": { "from": "OPERATIONAL", "to": "DUPLICATE" },
    "effects": [ { "object": "stock_book_snapshot", "count": 1, "change": "INVALIDATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T15:00:00Z"
  }
}
```

`TEST`, `CALIBRATION`, `DUPLICATE`, and `VOIDED_WITH_REASON` measurements **never enter an approved manifest** — and they are never deleted either.

---

## POST /dispatch-consignments · actions

**Auth:** `dispatch.create` on the mine; `dispatch.release` to release, with the authorising appointment recorded.

### Request

```json
{
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "consignment_ref": "SECL/GEV/RAKE/2026/09/0441",
  "mode": "RAIL",
  "consignee_ref": { "system": "CIL_FSA", "value": "NTPC-KORBA-STPS", "display": "NTPC Korba STPS" },
  "destination_ref": { "system": "IR_STATION", "value": "KRBA", "display": "Korba goods yard" },
  "material_definition_id": "matd_01HZY3C4D5E6F7G8H9J0K1T2M0",
  "net_derivation_mode": "GROSS_MINUS_TARE",
  "extensions": {}
}
```

### Action — ADD_VEHICLE_LEG

```json
{
  "action": "ADD_VEHICLE_LEG",
  "expected_version": 1,
  "payload": {
    "vehicle_or_wagon_ref": "BOXNHL 31241578",
    "carrier_organization_id": "org_01HZYT0M1N203P4Q5R6S7T8V90",
    "gross_measurement_id": "qm_01HZYM1N203P4Q5R6S7T8V9V00",
    "tare_measurement_id": "qm_01HZYN203P4Q5R6S7T8V9V0W10",
    "anpr_ref": null,
    "tracking_trip_ref": "FOIS/2026/09/RAKE/88214",
    "gate_out_at": null
  }
}
```

```json
{
  "success": true,
  "message": "Vehicle leg added",
  "data": {
    "id": "dcon_01HZY03P4Q5R6S7T8V9V0W1X20",
    "object": "dispatch_consignment",
    "version": 2,
    "state": "LOADING",
    "consignment_ref": "SECL/GEV/RAKE/2026/09/0441",
    "mode": "RAIL",
    "net_derivation_mode": "GROSS_MINUS_TARE",
    "legs": [
      {
        "id": "dleg_01HZYP4Q5R6S7T8V9V0W1X2Y30",
        "vehicle_or_wagon_ref": "BOXNHL 31241578",
        "carrier_organization": { "type": "organization", "id": "org_01HZYT0M1N203P4Q5R6S7T8V90", "display": "Indian Railways" },
        "gross": { "value": "88.420", "unit": "TONNE", "basis": "AS_RECEIVED", "measurement_id": "qm_01HZYM1N203P4Q5R6S7T8V9V00" },
        "tare": { "value": "22.100", "unit": "TONNE", "basis": "AS_RECEIVED", "measurement_id": "qm_01HZYN203P4Q5R6S7T8V9V0W10" },
        "net": { "value": "66.320", "unit": "TONNE", "basis": "AS_RECEIVED", "derivation": "GROSS_MINUS_TARE", "conversion_policy_version": 4 },
        "tracking_trip_ref": "FOIS/2026/09/RAKE/88214",
        "gate_out_at": null
      }
    ],
    "total_net": { "value": "66.320", "unit": "TONNE", "basis": "AS_RECEIVED" },
    "total_net_normalized": { "value": "61.523", "unit": "TONNE", "basis": "AIR_DRIED" },
    "available_actions": ["ADD_VEHICLE_LEG", "RELEASE", "CANCEL"]
  },
  "meta": {
    "action": "ADD_VEHICLE_LEG",
    "transition": null,
    "effects": [ { "object": "dispatch_vehicle_leg", "id": "dleg_01HZYP4Q5R6S7T8V9V0W1X2Y30", "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T16:00:00Z"
  }
}
```

Net is **derived** with an explicit method and version. Direct net measurement is permitted only under an approved mode policy, and the response names which applied. One measurement cannot count in two active consignments — a second use returns `409 CONFLICT` with `details.already_used_in` unless an explicit apportionment is supplied.

### Action — RELEASE

```json
{
  "action": "RELEASE",
  "expected_version": 4,
  "payload": { "released_at": "2026-09-14T18:30:00Z", "gate_out_confirmed": true },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Consignment released",
  "data": {
    "id": "dcon_01HZY03P4Q5R6S7T8V9V0W1X20",
    "object": "dispatch_consignment",
    "version": 5,
    "state": "RELEASED",
    "status": "RELEASED",
    "authorized_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "authorized_by_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "authorized_at": "2026-09-14T18:30:00Z",
    "released_at": "2026-09-14T18:30:00Z",
    "leg_count": 58,
    "total_net": { "value": "3846.560", "unit": "TONNE", "basis": "AS_RECEIVED" },
    "available_actions": []
  },
  "meta": {
    "action": "RELEASE",
    "transition": { "from": "LOADING", "to": "RELEASED" },
    "effects": [
      { "object": "material_event", "count": 1, "change": "CREATED", "note": "DISPATCH event debiting the loading stock location" },
      { "object": "stock_book_snapshot", "count": 1, "change": "INVALIDATED" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T18:30:00Z"
  }
}
```

---

## GET /stock-snapshots · POST /stock-snapshots

**Auth:** `production.read_stock` to read; `production.record_survey` to submit a physical snapshot.

Book snapshots are **derived and rebuildable**. They are never written by a client and never overwritten by a physical snapshot.

### Request — physical survey

```json
{
  "snapshot_kind": "PHYSICAL",
  "location_id": "stl_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "material_definition_id": "matd_01HZY3C4D5E6F7G8H9J0K1T2M0",
  "surveyed_at": "2026-09-30T11:00:00Z",
  "method": "UAV_PHOTOGRAMMETRY",
  "geometry_version_id": "gv_01HZYQ5R6S7T8V9V0W1X2Y3Z40",
  "volume": { "value": "184220.000", "unit": "CUBIC_METRE" },
  "density_assumption": { "value": "0.880", "unit": "TONNE_PER_CUBIC_METRE", "source": "SECL density study 2024, ROM G8" },
  "moisture_basis": "AS_RECEIVED",
  "measured_quantity": { "value": "162113.600", "unit": "TONNE", "basis": "AS_RECEIVED" },
  "uncertainty": { "value": "3242.270", "unit": "TONNE", "kind": "EXPANDED_K2" },
  "survey_team_ref": "SECL Survey Wing / Korba, party 3",
  "evidence_ids": ["ev_01HZYR6S7T8V9V0W1X2Y3Z4A50"],
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Physical snapshot recorded; variance computed",
  "data": {
    "id": "pssn_01HZYS7T8V9V0W1X2Y3Z4A5B60",
    "object": "physical_stock_snapshot",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "RECORDED",
    "available_actions": ["APPROVE"],
    "location": { "type": "stock_location", "id": "stl_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "ROM stockpile A" },
    "material_definition": { "type": "material_definition", "id": "matd_01HZY3C4D5E6F7G8H9J0K1T2M0", "display": "ROM coal, G8 grade" },
    "surveyed_at": "2026-09-30T11:00:00Z",
    "method": "UAV_PHOTOGRAMMETRY",
    "geometry_version_id": "gv_01HZYQ5R6S7T8V9V0W1X2Y3Z40",
    "volume": { "value": "184220.000", "unit": "CUBIC_METRE" },
    "density_assumption": { "value": "0.880", "unit": "TONNE_PER_CUBIC_METRE", "source": "SECL density study 2024, ROM G8" },
    "measured_quantity": { "value": "162113.600", "unit": "TONNE", "basis": "AS_RECEIVED" },
    "uncertainty": { "value": "3242.270", "unit": "TONNE", "kind": "EXPANDED_K2" },
    "evidence_manifest_hash": "sha256:6f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "approved_by_appointment_id": null,
    "variance": {
      "id": "svar_01HZYT8V9V0W1X2Y3Z4A5B6C70",
      "book_snapshot_id": "bssn_01HZYV9V0W1X2Y3Z4A5B6C7D80",
      "book_quantity": { "value": "168940.220", "unit": "TONNE", "basis": "AS_RECEIVED" },
      "physical_quantity": { "value": "162113.600", "unit": "TONNE", "basis": "AS_RECEIVED" },
      "variance_quantity": { "value": "-6826.620", "unit": "TONNE", "basis": "AS_RECEIVED" },
      "variance_percent": "-4.041",
      "tolerance_policy_version": 6,
      "tolerance_percent": "2.500",
      "within_tolerance": false,
      "state": "OPEN",
      "discrepancy_id": "pdis_01HZYV0W1X2Y3Z4A5B6C7D8E90"
    },
    "created_at": "2026-09-30T12:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/stock-snapshots/pssn_01HZYS7T8V9V0W1X2Y3Z4A5B60" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-30T12:00:00Z", "effects": [ { "object": "stock_variance", "id": "svar_01HZYT8V9V0W1X2Y3Z4A5B6C70", "change": "CREATED" }, { "object": "production_discrepancy", "id": "pdis_01HZYV0W1X2Y3Z4A5B6C7D8E90", "change": "CREATED" }, { "object": "notification", "count": 4, "change": "CREATED" } ] }
}
```

A 4% variance does not silently adjust the book. It opens a discrepancy with an owner and a deadline, and any correction is an explicit `stock_adjustment` that somebody else approved.

---

## POST /stock-adjustments · actions

**Auth:** `production.adjustment.propose`; approval requires `production.adjustment.approve` and **must be a different person** under policy.

```json
{
  "accounting_boundary_id": "mab_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "location_id": "stl_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "material_definition_id": "matd_01HZY3C4D5E6F7G8H9J0K1T2M0",
  "quantity": { "value": "-6826.620", "unit": "TONNE", "basis": "AS_RECEIVED" },
  "cause_code": "SURVEY_RECONCILIATION",
  "reason": "September UAV survey against book; loss attributed to compaction, moisture change, and belt-scale drift between 1 and 14 September",
  "effective_period_id": "prdp_01HZYC2D3E4F5G6H7J8K9T0M10",
  "evidence_ids": ["ev_01HZYR6S7T8V9V0W1X2Y3Z4A50"],
  "linked_discrepancy_id": "pdis_01HZYV0W1X2Y3Z4A5B6C7D8E90",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Adjustment proposed; awaiting independent approval",
  "data": {
    "id": "sadj_01HZYW1X2Y3Z4A5B6C7D8E9F00",
    "object": "stock_adjustment",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PROPOSED",
    "available_actions": ["APPROVE", "REJECT", "WITHDRAW"],
    "location": { "type": "stock_location", "id": "stl_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "ROM stockpile A" },
    "quantity": { "value": "-6826.620", "unit": "TONNE", "basis": "AS_RECEIVED" },
    "cause_code": "SURVEY_RECONCILIATION",
    "reason": "September UAV survey against book; loss attributed to compaction, moisture change, and belt-scale drift between 1 and 14 September",
    "proposed_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "proposed_by_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "approved_by_appointment_id": null,
    "effective_period": { "type": "production_period", "id": "prdp_01HZYC2D3E4F5G6H7J8K9T0M10", "display": "September 2026" },
    "evidence_manifest_hash": "sha256:6f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "linked_discrepancy_id": "pdis_01HZYV0W1X2Y3Z4A5B6C7D8E90",
    "separation_policy": { "rule": "APPROVER_NOT_PROPOSER", "policy_version": 6 },
    "created_at": "2026-09-30T14:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/stock-adjustments/sadj_01HZYW1X2Y3Z4A5B6C7D8E9F00" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-30T14:00:00Z", "effects": [ { "object": "approval_request", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 2, "change": "CREATED" } ] }
}
```

Self-approval is `422 UNPROCESSABLE` with `details.rule: "APPROVER_NOT_PROPOSER"`.

---

## POST /production-periods/{id}/actions

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `CUT_OFF` | `production.period.manage` | optional | required | Sets `cutoff_at`; later events need governed handling |
| `APPROVE` | `production.period.approve` | **required** | required | **Locks the period row**, rechecks unresolved blockers, mints approved facts |
| `PUBLISH` | `production.period.publish` | optional | required | Facts become externally consumable |
| `REOPEN` | `production.period.reopen` | **required** | required | Locks and re-checks; supersedes affected facts rather than editing them |

### APPROVE

```json
{
  "action": "APPROVE",
  "expected_version": 7,
  "reason": "All discrepancies resolved; survey adjustment approved; belt-scale recalibrated and re-verified",
  "payload": { "fact_kinds": ["ROM_PRODUCTION", "DISPATCH", "CLOSING_STOCK", "PROCESSING_YIELD"] },
  "supporting_authority": { "appointment_id": "app_01HZYX2Y3Z4A5B6C7D8E9F0G10", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Period approved; 14 facts minted",
  "data": {
    "id": "prdp_01HZYC2D3E4F5G6H7J8K9T0M10",
    "object": "production_period",
    "version": 8,
    "state": "APPROVED",
    "period_kind": "MONTH",
    "starts_at": "2026-09-01T00:00:00Z",
    "ends_at": "2026-10-01T00:00:00Z",
    "cutoff_at": "2026-10-03T18:30:00Z",
    "approved_by": { "type": "person", "id": "per_01HZYY3Z4A5B6C7D8E9F0G1H20", "display": "V. Rao" },
    "approved_by_appointment_id": "app_01HZYX2Y3Z4A5B6C7D8E9F0G10",
    "approved_at": "2026-10-04T10:00:00Z",
    "published_at": null,
    "blocker_check": { "open_discrepancies": 0, "unapproved_adjustments": 0, "uncalibrated_device_measurements": 0, "unresolved_variances": 0, "checked_at": "2026-10-04T10:00:00Z" },
    "available_actions": ["PUBLISH", "REOPEN"]
  },
  "included": {
    "approved_production_fact:apf_01HZYZ4A5B6C7D8E9F0G1H2130": {
      "id": "apf_01HZYZ4A5B6C7D8E9F0G1H2130",
      "object": "approved_production_fact",
      "period_id": "prdp_01HZYC2D3E4F5G6H7J8K9T0M10",
      "fact_kind": "ROM_PRODUCTION",
      "dimensions": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "material_definition_id": "matd_01HZY3C4D5E6F7G8H9J0K1T2M0" },
      "value": { "value": "5842118.400", "unit": "TONNE", "basis": "AIR_DRIED" },
      "source_policy_id": "psp_01HZZ0A5B6C7D8E9F0G1H213J0",
      "event_manifest_hash": "sha256:1a4f9c2e7b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8",
      "event_count": 1184,
      "fact_version": 1,
      "supersedes_id": null,
      "approved_at": "2026-10-04T10:00:00Z"
    }
  },
  "meta": {
    "action": "APPROVE",
    "transition": { "from": "CUT_OFF", "to": "APPROVED" },
    "effects": [
      { "object": "approved_production_fact", "count": 14, "change": "CREATED" },
      { "object": "stock_book_snapshot", "count": 6, "change": "FROZEN" },
      { "object": "outbox_event", "count": 14, "change": "CREATED" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-10-04T10:00:00Z"
  }
}
```

`event_manifest_hash` is what makes an aggregate **exactly reproducible**. Re-running the same manifest six months later must yield the same tonne, to the kilogram, or something has been tampered with.

### APPROVE — 409 unresolved blockers

```json
{
  "success": false,
  "message": "Period cannot be approved with unresolved blockers",
  "error": {
    "code": "INVALID_STATE",
    "details": {
      "blocker_check": { "open_discrepancies": 2, "unapproved_adjustments": 1, "uncalibrated_device_measurements": 41, "unresolved_variances": 1 },
      "blocking_references": [
        { "type": "production_discrepancy", "id": "pdis_01HZYJ8K9T0M1N203P4Q5R6S70", "display": "Belt scale BS-1 out of calibration", "owner_post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "due_at": "2026-10-02T00:00:00Z", "overdue": true },
        { "type": "stock_adjustment", "id": "sadj_01HZYW1X2Y3Z4A5B6C7D8E9F00", "display": "Survey reconciliation, −6826.620 t", "state": "PROPOSED" }
      ]
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### REOPEN

A published period accepts late data **only** through reopen with superseding facts, or a governed next-period adjustment. There is no third way.

```json
{
  "action": "REOPEN",
  "expected_version": 9,
  "reason": "Weighbridge WB-2 audit found a 0.8% under-read between 8 and 22 September; 214 measurements superseded",
  "payload": { "affected_fact_kinds": ["ROM_PRODUCTION", "DISPATCH"], "expected_resupersede_count": 6 },
  "supporting_authority": { "appointment_id": "app_01HZYX2Y3Z4A5B6C7D8E9F0G10", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Period reopened; 6 facts marked for supersession",
  "data": {
    "id": "prdp_01HZYC2D3E4F5G6H7J8K9T0M10",
    "object": "production_period",
    "version": 10,
    "state": "REOPENED",
    "reopened_at": "2026-11-12T09:00:00Z",
    "reopen_reason": "Weighbridge WB-2 audit found a 0.8% under-read between 8 and 22 September; 214 measurements superseded",
    "facts_pending_supersession": ["apf_01HZYZ4A5B6C7D8E9F0G1H2130", "apf_01HZZ1B6C7D8E9F0G1H213J4K0"],
    "available_actions": ["APPROVE"]
  },
  "meta": {
    "action": "REOPEN",
    "transition": { "from": "PUBLISHED", "to": "REOPENED" },
    "effects": [
      { "object": "approved_production_fact", "count": 6, "change": "MARKED_FOR_SUPERSESSION", "note": "Existing facts remain readable and never change value" },
      { "object": "external_fact_mirror", "count": 4, "change": "FLAGGED", "note": "Downstream systems hold a superseded value" },
      { "object": "notification", "count": 9, "change": "CREATED" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-11-12T09:00:00Z"
  }
}
```

An approved fact is **never updated in place**. It is superseded, with both versions readable, so a report filed in October and a corrected one filed in November are each explainable against what was known at the time.

---

## GET /external-fact-mirrors

**Auth:** `production.read_facts` plus integration read.

What was submitted to an external system, and whether the acknowledgement matched. A mirror **cannot mutate an approved fact** — a mismatch opens a discrepancy instead.

```json
{
  "success": true,
  "data": [
    {
      "id": "efm_01HZZ2C7D8E9F0G1H213J4K5T0",
      "object": "external_fact_mirror",
      "version": 2,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "MISMATCH",
      "approved_fact": { "type": "approved_production_fact", "id": "apf_01HZYZ4A5B6C7D8E9F0G1H2130", "display": "ROM production, Gevra, September 2026" },
      "external_system": "CIL_MIS",
      "external_record_ref": "MIS/PROD/2026/09/GEV",
      "our_value": { "value": "5842118.400", "unit": "TONNE", "basis": "AIR_DRIED" },
      "submitted_value": { "value": "5842118.400", "unit": "TONNE", "basis": "AIR_DRIED" },
      "external_value": { "value": "5841902.000", "unit": "TONNE", "basis": "AIR_DRIED" },
      "difference": { "value": "216.400", "unit": "TONNE" },
      "status": "MISMATCH",
      "acknowledgement_ref": "MIS-ACK-2026-09-114",
      "compared_at": "2026-10-06T02:00:00Z",
      "discrepancy_id": "pdis_01HZZ3D8E9F0G1H213J4K5T6M0",
      "links": { "self": "/api/v1/external-fact-mirrors/efm_01HZZ2C7D8E9F0G1H213J4K5T0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-06T08:00:00Z" }
}
```

---

## POST /production-discrepancies/{id}/actions — RESOLVE

**Auth:** `production.discrepancy.resolve`; the reviewer must differ from the proposer where policy requires.

```json
{
  "action": "RESOLVE",
  "expected_version": 3,
  "reason": "Belt scale recalibrated 2 October and re-verified against the weighbridge; affected measurements reclassified and the survey basis adopted for the period",
  "payload": {
    "disposition": "ADOPT_ALTERNATIVE_BASIS",
    "chosen_basis": "SURVEY",
    "adjustment_id": "sadj_01HZYW1X2Y3Z4A5B6C7D8E9F00",
    "assertions_considered": ["dasr_01HZZ4E9F0G1H213J4K5T6M7N0", "dasr_01HZZ5F0G1H213J4K5T6M7N800"]
  },
  "supporting_authority": { "appointment_id": "app_01HZYX2Y3Z4A5B6C7D8E9F0G10", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Discrepancy resolved",
  "data": {
    "id": "pdis_01HZYV0W1X2Y3Z4A5B6C7D8E90",
    "object": "production_discrepancy",
    "version": 4,
    "state": "RESOLVED",
    "kind": "STOCK_VARIANCE_OUT_OF_TOLERANCE",
    "severity": "HIGH",
    "owner_post": { "type": "post", "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "display": "Safety Officer, Gevra OCP" },
    "opened_at": "2026-09-30T12:00:00Z",
    "due_at": "2026-10-07T00:00:00Z",
    "resolved_at": "2026-10-03T15:00:00Z",
    "decision": {
      "id": "ddec_01HZZ6G1H213J4K5T6M7N809P0",
      "disposition": "ADOPT_ALTERNATIVE_BASIS",
      "chosen_basis": "SURVEY",
      "adjustment_id": "sadj_01HZYW1X2Y3Z4A5B6C7D8E9F00",
      "proposed_by_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
      "reviewed_by_appointment_id": "app_01HZYX2Y3Z4A5B6C7D8E9F0G10",
      "reason": "Belt scale recalibrated 2 October and re-verified against the weighbridge; affected measurements reclassified and the survey basis adopted for the period",
      "decided_at": "2026-10-03T15:00:00Z"
    },
    "available_actions": []
  },
  "meta": {
    "action": "RESOLVE",
    "transition": { "from": "OPEN", "to": "RESOLVED" },
    "effects": [ { "object": "discrepancy_decision", "id": "ddec_01HZZ6G1H213J4K5T6M7N809P0", "change": "CREATED" }, { "object": "stock_variance", "count": 1, "change": "STATE", "to": "RESOLVED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-10-03T15:00:00Z"
  }
}
```

Every competing assertion is retained in `discrepancy_assertion` — the belt said one number, the weighbridge another, the survey a third. The decision records **which basis was chosen and why**, not merely the winner.

---

## Invariants

- Quantities are decimal with an explicit unit and basis. No float, ever, and every conversion carries its policy version.
- Internal transfers net to zero across the mine boundary; rehandling cannot create origin quantity.
- Test, calibration, duplicate, and voided measurements never enter an approved manifest, and are never deleted.
- A device measurement taken outside its calibration interval is kept and opens a discrepancy.
- The book snapshot is derived and rebuildable, and is never overwritten by a physical snapshot.
- An adjustment's approver must differ from its proposer.
- Contractor engagement and operating organisation never replace the legal owner derived from tenant and mine.
- A published period accepts late data only through reopen with superseding facts, or a governed next-period adjustment.
- An external mirror can never mutate an approved fact; a mismatch opens a discrepancy.
- Shared-facility events retain origin-mine allocation lineage and never require a fabricated owning mine.

# Environment — programmes, limits, samples, observations, evaluation, and release

Domain rules: [`../../../features/environment/environmental-monitoring-spec.md`](../../../features/environment/environmental-monitoring-spec.md). Relational contract: [`../../../architecture/environment-data-model.md`](../../../architecture/environment-data-model.md). Conventions: [`../../README.md`](../../README.md).

Every value carries a **unit, a basis, and a statistic**, and every conversion carries its rule version. There is no float arithmetic in this domain. A `<LOD` or `<LOQ` result is **never** converted to zero — the qualifier travels with the number, and an evaluation that would need it silently dropped is refused instead.

## Routes

| Route | Purpose |
|---|---|
| `GET /monitoring-programs?view=catalog&filter[type]=PARAMETER,METHOD,LABORATORY` | Typed, effective-dated catalogue with accreditation scope |
| `GET /monitoring-points` · `POST /monitoring-points` · `POST /monitoring-points/{id}/actions` | Where measurement happens, versioned by geometry |
| `GET /monitoring-programs` · `POST /monitoring-programs` · `POST /monitoring-programs/{id}/actions` | What must be measured, how often |
| `GET /environmental-limit-bindings` · `POST /environmental-limit-bindings` · `POST /environmental-limit-bindings/{id}/actions` | A source condition turned into a comparable rule |
| `GET /environment-instruments` · `POST /environment-instruments` · `POST /environment-instruments/{id}/actions` | Continuous devices; calibration, fault, clock change |
| `POST /environment-observations` · `GET /environment-observations` | Immutable raw ingestion |
| `GET /environment-validated-results` · `POST /environment-validated-results` · `POST /environment-validated-results/{id}/actions` | Window validation and correction |
| `GET /environment-samples` · `POST /environment-samples` · `POST /environment-samples/{id}/actions` | Collection and chain of custody |
| `GET /lab-analyses` · `POST /lab-analyses` · `POST /lab-analyses/{id}/actions` | Analysis, results, corrections |
| `GET /environment-evaluations` · `POST /environment-evaluations` · `POST /environment-evaluations/{id}/actions` | Result against binding |
| `GET /environment-exceedance-cases` · `POST /environment-exceedance-cases/{id}/actions` | The response a breach requires |
| `GET /environment-monitoring-periods` · `POST /environment-monitoring-periods` · `POST /environment-monitoring-periods/{id}/actions` | Approve and release a period |

The former `/environment-parameters`, `/environment-methods`, `/laboratories`, and intermediate `/environment-catalog` lists are the `catalog` view of `/monitoring-programs`. They share monitoring-configuration authorization, effective dating, pagination, and the common fields `code`, `name`, `valid_period`, and `provenance`; type-specific fields remain sparse fields. A caller may request one or several types. Unknown types are `400 UNKNOWN_FILTER_VALUE`.

Coverage is not a route. It is `GET /environment-validated-results?group_by=monitoring_point_id,parameter_id&metrics=count,coverage` — the number and the rows behind it on one endpoint.

---

## POST /environmental-limit-bindings

**Auth:** `environment.binding.propose`; publication needs `environment.binding.publish`. A binding is how a clause in an EC or a consent becomes something a measurement can be compared against.

### Request

```json
{
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "source_document_version_id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300",
  "source_anchor": "cond_9__a",
  "obligation_id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00",
  "parameter_id": "eprm_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "matrix_kind": "AMBIENT_AIR",
  "point_selector": { "kind": "POINT_KIND", "value": "AAQ_BOUNDARY", "include_point_ids": [], "exclude_point_ids": [] },
  "eligible_method_ids": ["emth_01HZY2B3C4D5E6F7G8H9J0K1T0"],
  "unit": "MICROGRAM_PER_CUBIC_METRE",
  "basis": "AMBIENT",
  "statistic": "ARITHMETIC_MEAN",
  "averaging_rule": { "window": "P1D", "min_coverage_percent": "75.0", "alignment": "CALENDAR_DAY", "timezone": "Asia/Kolkata" },
  "comparison_operator": "LTE",
  "threshold_low": null,
  "threshold_high": "100.000",
  "applicability_expression": { "all": [{ "field": "mine.mine_profile_code", "op": "eq", "value": "OPENCAST" }] },
  "exceedance_rule": { "kind": "SINGLE_WINDOW", "consecutive_windows": 1 },
  "response_policy_id": "erpol_01HZY3C4D5E6F7G8H9J0K1T2M0",
  "effective_from": "2026-10-01T00:00:00Z",
  "effective_until": null,
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Limit binding proposed",
  "data": {
    "id": "elb_01HZY4D5E6F7G8H9J0K1T2M3N0",
    "object": "environmental_limit_binding",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PROPOSED",
    "available_actions": ["PUBLISH", "AMEND", "WITHDRAW"],
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "source_document_version": { "type": "document_version", "id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300", "display": "EC amendment 2026, condition 9(a)" },
    "source_anchor": "cond_9__a",
    "source_text": "Ambient PM10 at the lease boundary shall not exceed 100 µg/m³ as a 24-hour arithmetic mean.",
    "obligation": { "type": "obligation", "id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00", "display": "Ambient air quality — PM10 boundary limit" },
    "parameter": { "type": "environment_parameter", "id": "eprm_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "PM10", "canonical_unit": "MICROGRAM_PER_CUBIC_METRE" },
    "matrix_kind": "AMBIENT_AIR",
    "point_selector": { "kind": "POINT_KIND", "value": "AAQ_BOUNDARY", "resolved_point_count": 4, "resolved_point_ids": ["mpt_01HZY5E6F7G8H9J0K1T2M3N400", "mpt_01HZY6F7G8H9J0K1T2M3N405P0", "mpt_01HZY7G8H9J0K1T2M3N405P6Q0", "mpt_01HZY8H9J0K1T2M3N405P6Q7R0"] },
    "eligible_methods": [{ "type": "environment_method", "id": "emth_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "IS 5182 Part 23, gravimetric PM10" }],
    "unit": "MICROGRAM_PER_CUBIC_METRE",
    "basis": "AMBIENT",
    "statistic": "ARITHMETIC_MEAN",
    "averaging_rule": { "window": "P1D", "min_coverage_percent": "75.0", "alignment": "CALENDAR_DAY", "timezone": "Asia/Kolkata" },
    "comparison_operator": "LTE",
    "threshold_low": null,
    "threshold_high": "100.000",
    "applicability_expression": { "all": [{ "field": "mine.mine_profile_code", "op": "eq", "value": "OPENCAST" }] },
    "exceedance_rule": { "kind": "SINGLE_WINDOW", "consecutive_windows": 1 },
    "response_policy_id": "erpol_01HZY3C4D5E6F7G8H9J0K1T2M0",
    "effective_from": "2026-10-01T00:00:00Z",
    "effective_until": null,
    "supersedes_id": "elb_01HZY9J0K1T2M3N405P6Q7R8S0",
    "proposed_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "proposed_by_appointment_id": "app_01HZY3B4C5D6E7F8G9H0J1K2T0",
    "published_by_appointment_id": null,
    "created_at": "2026-09-20T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/environmental-limit-bindings/elb_01HZY4D5E6F7G8H9J0K1T2M3N0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-20T10:00:00Z" }
}
```

### PUBLISH — 422 overlapping interval

Published binding intervals **must not overlap** for the same source condition and context.

```json
{
  "success": false,
  "message": "A published binding already covers this condition and context over the requested interval",
  "error": {
    "code": "UNPROCESSABLE",
    "details": {
      "conflicting_binding_id": "elb_01HZY9J0K1T2M3N405P6Q7R8S0",
      "conflicting_interval": { "from": "2024-04-01T00:00:00Z", "to": null },
      "requested_interval": { "from": "2026-10-01T00:00:00Z", "to": null },
      "resolution": "Set supersedes_id and the server will close the prior interval at effective_from, or amend the requested interval"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## POST /environment-samples · custody

**Auth:** `environment.sample.collect`. Idempotent on `(tenant_id, client_sample_id)` for offline field capture.

```json
{
  "client_sample_id": "csmp_9c1a4b2e7d05f83b6a2e9d7c",
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "monitoring_point_id": "mpt_01HZY5E6F7G8H9J0K1T2M3N400",
  "parameter_or_panel": { "kind": "PANEL", "panel_code": "EFFLUENT_GENERAL", "parameter_ids": ["eprm_01HZYA0B1C2D3E4F5G6H7J8K90", "eprm_01HZYB1C2D3E4F5G6H7J8K9T00"] },
  "collected_from": "2026-09-21T06:40:00Z",
  "collected_to": "2026-09-21T06:55:00Z",
  "container": { "type": "HDPE_1L", "count": 2, "lot_ref": "CNT/2026/4412" },
  "preservative": { "code": "HNO3", "volume_ml": "2" },
  "field_conditions": { "temperature_c": "28.4", "ph_field": "7.42", "flow_lps": "14.8", "weather": "Clear" },
  "seal_id": "SEAL-2026-091142",
  "evidence_ids": ["ev_01HZYC2D3E4F5G6H7J8K9T0M10"],
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Sample collected",
  "data": {
    "id": "esmp_01HZYD3E4F5G6H7J8K9T0M1N20",
    "object": "environment_sample",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COLLECTED",
    "available_actions": ["RECORD_CUSTODY_EVENT", "VOID"],
    "client_sample_id": "csmp_9c1a4b2e7d05f83b6a2e9d7c",
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "monitoring_point": { "type": "monitoring_point", "id": "mpt_01HZY5E6F7G8H9J0K1T2M3N400", "display": "ETP outfall, east boundary", "geometry_version_id": "gv_01HZYE4F5G6H7J8K9T0M1N2030" },
    "parameter_or_panel": { "kind": "PANEL", "panel_code": "EFFLUENT_GENERAL", "parameter_ids": ["eprm_01HZYA0B1C2D3E4F5G6H7J8K90", "eprm_01HZYB1C2D3E4F5G6H7J8K9T00"] },
    "collected_from": "2026-09-21T06:40:00Z",
    "collected_to": "2026-09-21T06:55:00Z",
    "sampler": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "sampler_appointment_id": "app_01HZY3B4C5D6E7F8G9H0J1K2T0",
    "container": { "type": "HDPE_1L", "count": 2, "lot_ref": "CNT/2026/4412" },
    "preservative": { "code": "HNO3", "volume_ml": "2" },
    "field_conditions": { "temperature_c": "28.4", "ph_field": "7.42", "flow_lps": "14.8", "weather": "Clear" },
    "seal_id": "SEAL-2026-091142",
    "custody_events": [
      { "id": "scus_01HZYF5G6H7J8K9T0M1N203P40", "sequence_no": 1, "event_kind": "COLLECTED", "occurred_at": "2026-09-21T06:55:00Z", "from_party": null, "to_party": { "kind": "APPOINTMENT", "ref": "app_01HZY3B4C5D6E7F8G9H0J1K2T0", "display": "P. Xess, Environment Officer" }, "seal_condition": "INTACT", "temperature": { "value": "6.2", "unit": "CELSIUS" } }
    ],
    "custody_contiguous": true,
    "custody_break_count": 0,
    "created_at": "2026-09-21T06:56:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/environment-samples/esmp_01HZYD3E4F5G6H7J8K9T0M1N20" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-21T06:56:00Z" }
}
```

### Action — RECORD_CUSTODY_EVENT

```json
{
  "action": "RECORD_CUSTODY_EVENT",
  "expected_version": 2,
  "payload": {
    "sequence_no": 3,
    "event_kind": "RECEIVED_BY_LAB",
    "occurred_at": "2026-09-21T15:20:00Z",
    "from_party": { "kind": "EXTERNAL", "ref": "courier:BLUEDART/8841221", "display": "Blue Dart" },
    "to_party": { "kind": "LABORATORY", "ref": "lab_01HZYG6H7J8K9T0M1N203P4Q50", "display": "Envirocare Labs, Nagpur" },
    "seal_condition": "INTACT",
    "temperature": { "value": "8.9", "unit": "CELSIUS" },
    "evidence_id": "ev_01HZYH7J8K9T0M1N203P4Q5R60"
  }
}
```

A **custody sequence must be contiguous**. A gap does not fail the write — it records a break, visibly:

```json
{
  "success": true,
  "message": "Custody event recorded; a sequence gap is present",
  "data": {
    "id": "esmp_01HZYD3E4F5G6H7J8K9T0M1N20",
    "object": "environment_sample",
    "version": 3,
    "state": "AT_LABORATORY",
    "custody_events": [
      { "sequence_no": 1, "event_kind": "COLLECTED", "occurred_at": "2026-09-21T06:55:00Z", "seal_condition": "INTACT" },
      { "sequence_no": 3, "event_kind": "RECEIVED_BY_LAB", "occurred_at": "2026-09-21T15:20:00Z", "seal_condition": "INTACT", "temperature": { "value": "8.9", "unit": "CELSIUS" } }
    ],
    "custody_contiguous": false,
    "custody_break_count": 1,
    "custody_breaks": [{ "missing_sequence_no": 2, "between": ["COLLECTED", "RECEIVED_BY_LAB"], "gap_duration": "PT8H25M", "quality_impact": "QUALIFIES_USABILITY" }],
    "available_actions": ["RECORD_CUSTODY_EVENT", "VOID"]
  },
  "meta": {
    "action": "RECORD_CUSTODY_EVENT",
    "transition": { "from": "IN_TRANSIT", "to": "AT_LABORATORY" },
    "effects": [ { "object": "sample_custody_event", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 2, "change": "CREATED", "note": "Custody gap flagged to the environment officer" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-21T15:22:00Z"
  }
}
```

Custody and scope gates **qualify usability; they never delete results.** A sample with a custody break still produces a result — the result simply carries the qualification, and a regulator can see both.

---

## POST /lab-analyses · results

**Auth:** `environment.lab.record`, or a trusted laboratory adapter principal. **Laboratory scope and method validity are checked at analysis time**, not at report time.

```json
{
  "sample_id": "esmp_01HZYD3E4F5G6H7J8K9T0M1N20",
  "laboratory_id": "lab_01HZYG6H7J8K9T0M1N203P4Q50",
  "method_id": "emth_01HZYJ8K9T0M1N203P4Q5R6S70",
  "batch_ref": "ENVC/2026/09/B-2214",
  "started_at": "2026-09-22T04:00:00Z",
  "completed_at": "2026-09-23T11:00:00Z",
  "analyst_ref": "ENVC/ANL/0912",
  "qc_summary": { "blank_pass": true, "spike_recovery_percent": "98.2", "duplicate_rpd_percent": "1.8", "ccv_pass": true },
  "results": [
    { "parameter_id": "eprm_01HZYA0B1C2D3E4F5G6H7J8K90", "reported_value": "18.400", "qualifier": null, "unit": "MILLIGRAM_PER_LITRE", "basis": "AS_RECEIVED", "detection_limit": "0.500", "quantification_limit": "1.500", "quality_state": "ACCEPTED" },
    { "parameter_id": "eprm_01HZYB1C2D3E4F5G6H7J8K9T00", "reported_value": null, "qualifier": "LESS_THAN_LOQ", "unit": "MILLIGRAM_PER_LITRE", "basis": "AS_RECEIVED", "detection_limit": "0.002", "quantification_limit": "0.010", "quality_state": "ACCEPTED" }
  ],
  "certificate_document_id": "doc_01HZYK9T0M1N203P4Q5R6S7T80",
  "authorized_signatory_ref": "ENVC/SIG/Dr. M. Pillai",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Analysis recorded with 2 results",
  "data": {
    "id": "elab_01HZYT0M1N203P4Q5R6S7T8V90",
    "object": "lab_analysis",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED",
    "available_actions": ["CORRECT_RESULT", "EVALUATE"],
    "sample": { "type": "environment_sample", "id": "esmp_01HZYD3E4F5G6H7J8K9T0M1N20", "display": "ETP outfall, 21 September 2026" },
    "laboratory": { "type": "laboratory", "id": "lab_01HZYG6H7J8K9T0M1N203P4Q50", "display": "Envirocare Labs, Nagpur" },
    "laboratory_scope_check": { "in_scope": true, "accreditation_reference": "NABL/TC/8841", "scope_valid_from": "2025-04-01T00:00:00Z", "scope_valid_until": "2027-03-31T00:00:00Z", "checked_at": "2026-09-23T11:05:00Z" },
    "method": { "type": "environment_method", "id": "emth_01HZYJ8K9T0M1N203P4Q5R6S70", "display": "APHA 5220 D, COD closed reflux" },
    "batch_ref": "ENVC/2026/09/B-2214",
    "started_at": "2026-09-22T04:00:00Z",
    "completed_at": "2026-09-23T11:00:00Z",
    "qc_summary": { "blank_pass": true, "spike_recovery_percent": "98.2", "duplicate_rpd_percent": "1.8", "ccv_pass": true },
    "results": [
      {
        "id": "elre_01HZYM1N203P4Q5R6S7T8V9V00",
        "object": "environment_lab_result",
        "parameter": { "type": "environment_parameter", "id": "eprm_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "COD" },
        "reported_value": "18.400",
        "qualifier": null,
        "unit": "MILLIGRAM_PER_LITRE",
        "basis": "AS_RECEIVED",
        "detection_limit": "0.500",
        "quantification_limit": "1.500",
        "quality_state": "ACCEPTED",
        "usability_qualifications": [{ "code": "CUSTODY_SEQUENCE_GAP", "detail": "Missing custody event 2 between collection and lab receipt", "impact": "ADVISORY" }],
        "certificate_document_id": "doc_01HZYK9T0M1N203P4Q5R6S7T80",
        "issued_at": "2026-09-23T11:00:00Z",
        "supersedes_id": null
      },
      {
        "id": "elre_01HZYN203P4Q5R6S7T8V9V0W10",
        "object": "environment_lab_result",
        "parameter": { "type": "environment_parameter", "id": "eprm_01HZYB1C2D3E4F5G6H7J8K9T00", "display": "Total mercury" },
        "reported_value": null,
        "qualifier": "LESS_THAN_LOQ",
        "unit": "MILLIGRAM_PER_LITRE",
        "basis": "AS_RECEIVED",
        "detection_limit": "0.002",
        "quantification_limit": "0.010",
        "quality_state": "ACCEPTED",
        "value_semantics_note": "Below the limit of quantification. This is not zero and must not be treated as zero in any aggregate.",
        "certificate_document_id": "doc_01HZYK9T0M1N203P4Q5R6S7T80",
        "issued_at": "2026-09-23T11:00:00Z",
        "supersedes_id": null
      }
    ],
    "created_at": "2026-09-23T11:05:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/lab-analyses/elab_01HZYT0M1N203P4Q5R6S7T8V90" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-23T11:05:00Z", "effects": [ { "object": "environment_lab_result", "count": 2, "change": "CREATED" }, { "object": "environment_evaluation", "count": 2, "change": "QUEUED" } ] }
}
```

If the laboratory's accreditation scope does not cover the parameter/method at `started_at`, the analysis is still recorded and every result carries `usability_qualifications: [{ "code": "LAB_OUT_OF_SCOPE", "impact": "BLOCKS_COMPLIANCE_USE" }]`. Refusing the write would erase the fact that an out-of-scope analysis happened.

---

## POST /environment-observations

**Auth:** trusted instrument adapter principal, or `environment.observation.ingest`. Idempotent on `(instrument_id, source_record_id)`; sequence numbers drive gap detection.

**Raw observations are immutable.** Validation produces a separate `environment_validated_result`; the raw stream is never edited.

```json
{
  "instrument_id": "einst_01HZY03P4Q5R6S7T8V9V0W1X20",
  "observations": [
    { "source_record_id": "CAAQMS/2026-09-21T00:00:00Z", "parameter_id": "eprm_01HZY1A2B3C4D5E6F7G8H9J0K0", "observed_at": "2026-09-21T00:00:00Z", "raw_value": "82.400", "raw_unit": "MICROGRAM_PER_CUBIC_METRE", "device_quality_flags": [], "sequence_no": 411882 },
    { "source_record_id": "CAAQMS/2026-09-21T00:15:00Z", "parameter_id": "eprm_01HZY1A2B3C4D5E6F7G8H9J0K0", "observed_at": "2026-09-21T00:15:00Z", "raw_value": "0.000", "raw_unit": "MICROGRAM_PER_CUBIC_METRE", "device_quality_flags": ["ZERO_SPAN_IN_PROGRESS"], "sequence_no": 411883 }
  ]
}
```

```json
{
  "success": true,
  "message": "2 observations ingested",
  "data": {
    "requested": 2,
    "created": 2,
    "replayed": 0,
    "failed": 0,
    "results": [
      { "source_record_id": "CAAQMS/2026-09-21T00:00:00Z", "status": 201, "id": "eobs_01HZYP4Q5R6S7T8V9V0W1X2Y30", "raw_payload_hash": "sha256:9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6", "received_at": "2026-09-21T00:00:42Z", "sequence_no": 411882 },
      { "source_record_id": "CAAQMS/2026-09-21T00:15:00Z", "status": 201, "id": "eobs_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "raw_payload_hash": "sha256:7d1a9c4e2f6b830d5ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c", "received_at": "2026-09-21T00:15:38Z", "sequence_no": 411883, "device_quality_flags": ["ZERO_SPAN_IN_PROGRESS"] }
    ],
    "sequence_check": { "expected_next": 411884, "gaps_detected": [], "last_sequence_no": 411883 }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-21T00:15:38Z" }
}
```

### Instrument event — calibration failure

```json
{
  "action": "RECORD_EVENT",
  "expected_version": 4,
  "reason": "Zero/span check failed at 09:00; span drift −14.2%",
  "payload": {
    "event_kind": "CALIBRATION_FAILED",
    "occurred_at": "2026-09-21T09:00:00Z",
    "configuration_hash": "sha256:4c1e9a7f2b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8",
    "details": { "span_drift_percent": "-14.2", "tolerance_percent": "5.0", "last_passing_check_at": "2026-09-14T09:00:00Z" },
    "evidence_id": "ev_01HZYR6S7T8V9V0W1X2Y3Z4A50"
  }
}
```

```json
{
  "success": true,
  "message": "Calibration failure recorded; 672 observations flagged over the affected interval",
  "data": {
    "id": "einst_01HZY03P4Q5R6S7T8V9V0W1X20",
    "object": "environment_instrument",
    "version": 5,
    "state": "FAULT",
    "status": "FAULT",
    "last_event": { "id": "eiev_01HZYS7T8V9V0W1X2Y3Z4A5B60", "event_kind": "CALIBRATION_FAILED", "occurred_at": "2026-09-21T09:00:00Z" },
    "affected_observation_interval": { "from": "2026-09-14T09:00:00Z", "to": "2026-09-21T09:00:00Z", "observation_count": 672, "note": "Interval spans from the last passing check to the failure" },
    "available_actions": ["RECORD_EVENT", "RETIRE"]
  },
  "meta": {
    "action": "RECORD_EVENT",
    "transition": { "from": "OPERATIONAL", "to": "FAULT" },
    "effects": [
      { "object": "environment_validated_result", "count": 7, "change": "QUALITY_STATE", "to": "SUSPECT", "note": "Daily windows overlapping the affected interval" },
      { "object": "production_discrepancy", "count": 0, "change": "NONE" },
      { "object": "notification", "count": 4, "change": "CREATED" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-21T09:05:00Z"
  }
}
```

A calibration failure **identifies the affected observation interval** — from the last passing check to the failure — rather than merely marking the device bad from now on. Everything measured in between is suspect, and the system says which.

---

## POST /environment-evaluations

**Auth:** `environment.evaluate`, or the system evaluator principal.

```json
{
  "result_ref": { "type": "environment_validated_result", "id": "evr_01HZYT8V9V0W1X2Y3Z4A5B6C70" },
  "limit_binding_id": "elb_01HZY4D5E6F7G8H9J0K1T2M3N0",
  "extensions": {}
}
```

### Response — 201 Created, exceedance

```json
{
  "success": true,
  "message": "Evaluation complete: EXCEEDANCE",
  "data": {
    "id": "eeval_01HZYV9V0W1X2Y3Z4A5B6C7D80",
    "object": "environment_evaluation",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "EXCEEDANCE",
    "available_actions": ["REVIEW", "SUPERSEDE"],
    "result": { "type": "environment_validated_result", "id": "evr_01HZYT8V9V0W1X2Y3Z4A5B6C70", "display": "PM10 daily mean, AAQ-3, 2026-09-21" },
    "limit_binding": { "type": "environmental_limit_binding", "id": "elb_01HZY4D5E6F7G8H9J0K1T2M3N0", "display": "PM10 boundary limit, EC condition 9(a)" },
    "evaluated_at": "2026-09-22T02:00:00Z",
    "compatibility_result": {
      "compatible": true,
      "parameter_match": true,
      "matrix_match": true,
      "method_eligible": true,
      "binding_effective_for_interval": true,
      "applicability_satisfied": true,
      "coverage_sufficient": true
    },
    "measured": { "value": "118.400", "unit": "MICROGRAM_PER_CUBIC_METRE", "basis": "AMBIENT", "statistic": "ARITHMETIC_MEAN", "interval_start": "2026-09-21T00:00:00Z", "interval_end": "2026-09-22T00:00:00Z", "coverage_percent": "91.7" },
    "threshold": { "operator": "LTE", "value": "100.000", "unit": "MICROGRAM_PER_CUBIC_METRE" },
    "outcome": "EXCEEDANCE",
    "exceedance_magnitude": { "value": "18.400", "unit": "MICROGRAM_PER_CUBIC_METRE", "percent_over": "18.400" },
    "explanation": "Daily arithmetic mean of 118.4 µg/m³ at AAQ-3 exceeds the 100 µg/m³ limit in EC condition 9(a). Coverage 91.7% is above the 75% minimum. No unit conversion was required.",
    "conversion_version": 4,
    "coverage_policy_version": 2,
    "exceedance_case_id": "eexc_01HZYV0W1X2Y3Z4A5B6C7D8E90",
    "reviewed_by_appointment_id": null,
    "supersedes_id": null,
    "created_at": "2026-09-22T02:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/environment-evaluations/eeval_01HZYV9V0W1X2Y3Z4A5B6C7D80" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-22T02:00:00Z", "effects": [ { "object": "environment_exceedance_case", "id": "eexc_01HZYV0W1X2Y3Z4A5B6C7D8E90", "change": "CREATED" }, { "object": "notification", "count": 6, "change": "CREATED" } ] }
}
```

### Response — 200 OK, insufficient coverage

```json
{
  "success": true,
  "message": "Evaluation complete: INDETERMINATE_INSUFFICIENT_COVERAGE",
  "data": {
    "id": "eeval_01HZYW1X2Y3Z4A5B6C7D8E9F00",
    "object": "environment_evaluation",
    "version": 1,
    "state": "INDETERMINATE",
    "compatibility_result": { "compatible": true, "parameter_match": true, "matrix_match": true, "method_eligible": true, "binding_effective_for_interval": true, "applicability_satisfied": true, "coverage_sufficient": false },
    "measured": { "value": "64.200", "unit": "MICROGRAM_PER_CUBIC_METRE", "basis": "AMBIENT", "statistic": "ARITHMETIC_MEAN", "interval_start": "2026-09-21T00:00:00Z", "interval_end": "2026-09-22T00:00:00Z", "coverage_percent": "58.3" },
    "threshold": { "operator": "LTE", "value": "100.000", "unit": "MICROGRAM_PER_CUBIC_METRE" },
    "outcome": "INDETERMINATE_INSUFFICIENT_COVERAGE",
    "explanation": "Coverage 58.3% is below the 75% minimum in the binding's averaging rule. The measured mean of 64.2 µg/m³ is below the threshold but cannot be reported as WITHIN_LIMIT.",
    "coverage_policy_version": 2,
    "exceedance_case_id": null,
    "available_actions": ["REVIEW", "SUPERSEDE"]
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-22T02:00:00Z" }
}
```

**Coverage below policy cannot produce `WITHIN_LIMIT`** — even when the number looks fine. A day the monitor was off for ten hours is not a compliant day; it is an unmeasured one, and the outcome vocabulary keeps them apart.

### Response — 422 incompatible

```json
{
  "success": false,
  "message": "Result and binding are not comparable",
  "error": {
    "code": "UNPROCESSABLE",
    "details": {
      "compatibility_result": { "compatible": false, "parameter_match": false, "matrix_match": true, "method_eligible": true },
      "result_parameter": { "id": "eprm_01HZYX2Y3Z4A5B6C7D8E9F0G10", "display": "PM2.5" },
      "binding_parameter": { "id": "eprm_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "PM10" },
      "resolution": "Supply an explicit compatible-parameter mapping, or evaluate against a PM2.5 binding"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## POST /environment-exceedance-cases/{id}/actions

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `REVIEW` | `environment.case.review` | **required** | required | Confirms, downgrades, or dismisses the exceedance with a stated basis |
| `RECORD_EVENT` | `environment.case.update` | **required** | required | Investigation, mitigation, or notification step |
| `LINK` | `environment.case.update` | **required** | required | Links an incident, finding, or CAPA |
| `COMPLETE` | `environment.case.complete` | **required** | required | Closes the case; **does not close** the linked incident, finding, or CAPA |

```json
{
  "action": "COMPLETE",
  "expected_version": 6,
  "reason": "Source identified as the unpaved section of the west approach road during a dry spell; water sprinkling frequency doubled and a CAPA raised for permanent surfacing",
  "payload": { "root_cause_code": "FUGITIVE_DUST_UNPAVED_ROAD", "mitigation_summary": "Sprinkler frequency increased from 4 to 8 passes per shift; surfacing CAPA raised" }
}
```

```json
{
  "success": true,
  "message": "Exceedance case completed; linked CAPA remains open",
  "data": {
    "id": "eexc_01HZYV0W1X2Y3Z4A5B6C7D8E90",
    "object": "environment_exceedance_case",
    "version": 7,
    "state": "COMPLETED",
    "severity": "SIGNIFICANT",
    "owner_post": { "type": "post", "id": "post_01HZY6E7F8G9H0J1K2T3M4N500", "display": "Environment Officer, Gevra OCP" },
    "due_at": "2026-09-29T00:00:00Z",
    "completed_at": "2026-09-27T14:00:00Z",
    "response_policy_version": 3,
    "linked": {
      "incident_id": null,
      "finding_id": "find_01HZYY3Z4A5B6C7D8E9F0G1H20",
      "capa_id": "capa_01HZYZ4A5B6C7D8E9F0G1H2130",
      "capa_state": "IN_PROGRESS",
      "note": "Case completion does not close the linked finding or CAPA; each closes under its own authority"
    },
    "available_actions": []
  },
  "meta": {
    "action": "COMPLETE",
    "transition": { "from": "UNDER_INVESTIGATION", "to": "COMPLETED" },
    "effects": [ { "object": "environment_case_event", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 3, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-27T14:00:00Z"
  }
}
```

**Case completion cannot close an incident, finding, or CAPA automatically.** Each closes under its own authority and its own evidence gate.

---

## POST /environment-monitoring-periods/{id}/actions

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `APPROVE` | `environment.period.approve` | **required** | required | Builds and hashes the period manifest |
| `RELEASE` | `environment.period.release` | optional | required | Makes the manifest externally consumable |
| `REOPEN` | `environment.period.reopen` | **required** | required | Supersedes the manifest; nothing is deleted |

```json
{
  "action": "APPROVE",
  "expected_version": 4,
  "reason": "All exceedance cases reviewed; one instrument fault interval excluded with reason; coverage above policy at every point",
  "supporting_authority": { "appointment_id": "app_01HZY3B4C5D6E7F8G9H0J1K2T0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Monitoring period approved",
  "data": {
    "id": "empd_01HZZ0A5B6C7D8E9F0G1H213J0",
    "object": "environment_monitoring_period",
    "version": 5,
    "state": "APPROVED",
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "period_kind": "MONTH",
    "starts_at": "2026-09-01T00:00:00Z",
    "ends_at": "2026-10-01T00:00:00Z",
    "approved_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "approved_by_appointment_id": "app_01HZY3B4C5D6E7F8G9H0J1K2T0",
    "released_at": null,
    "manifest": {
      "id": "epmf_01HZZ1B6C7D8E9F0G1H213J4K0",
      "manifest_version": 1,
      "program_versions": [{ "program_id": "empg_01HZZ2C7D8E9F0G1H213J4K5T0", "version": 4 }],
      "binding_versions": [{ "binding_id": "elb_01HZY4D5E6F7G8H9J0K1T2M3N0", "effective_from": "2026-10-01T00:00:00Z" }, { "binding_id": "elb_01HZY9J0K1T2M3N405P6Q7R8S0", "effective_from": "2024-04-01T00:00:00Z" }],
      "included_result_count": 1184,
      "excluded_result_reasons": [
        { "reason": "INSTRUMENT_FAULT_INTERVAL", "count": 672, "detail": "AAQ-3 span drift, 14–21 September" },
        { "reason": "CUSTODY_BREAK_BLOCKING", "count": 2, "detail": "Two effluent samples with unresolved custody gaps" }
      ],
      "coverage_summary": [
        { "monitoring_point_id": "mpt_01HZY5E6F7G8H9J0K1T2M3N400", "parameter_id": "eprm_01HZY1A2B3C4D5E6F7G8H9J0K0", "required_windows": 30, "valid_windows": 29, "coverage_percent": "96.7", "meets_policy": true },
        { "monitoring_point_id": "mpt_01HZY6F7G8H9J0K1T2M3N405P0", "parameter_id": "eprm_01HZY1A2B3C4D5E6F7G8H9J0K0", "required_windows": 30, "valid_windows": 23, "coverage_percent": "76.7", "meets_policy": true }
      ],
      "evaluation_count": 1184,
      "exceedance_count": 3,
      "open_case_ids": [],
      "manifest_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
      "created_at": "2026-10-05T10:00:00Z"
    },
    "available_actions": ["RELEASE", "REOPEN"]
  },
  "meta": {
    "action": "APPROVE",
    "transition": { "from": "OPEN", "to": "APPROVED" },
    "effects": [ { "object": "environment_period_manifest", "id": "epmf_01HZZ1B6C7D8E9F0G1H213J4K0", "change": "CREATED" }, { "object": "outbox_event", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-10-05T10:00:00Z"
  }
}
```

`excluded_result_reasons` is the honest half of the manifest. A period that quietly reported only its good days would be worse than no report.

A correction after approval **supersedes** the result, its evaluation, and the period manifest, without deleting any of them. `REOPEN` produces manifest version 2 and both remain readable.

---

## Invariants

- Values carry unit, basis, and statistic; conversions carry their rule version; there is no float arithmetic.
- A `<LOD`/`<LOQ` qualifier is never converted to zero, and any aggregate that would need it to be is refused.
- A result cannot be evaluated against a different parameter or matrix without an explicit compatible mapping.
- A binding must be effective for the result's interval and applicable to its context; published intervals never overlap for the same condition.
- Coverage below policy can never produce `WITHIN_LIMIT`.
- Laboratory scope and method validity are checked at analysis time, and a failure qualifies the result rather than deleting it.
- Custody sequence gaps stay visible and qualify usability.
- A calibration failure names the affected observation interval, not just the device's current state.
- Corrections supersede results, evaluations, and manifests. Nothing is deleted.
- Case completion never closes a linked incident, finding, or CAPA.
- A monitoring point keeps the geometry version used historically, so an old result still points at where the monitor actually was.
- An external mirror can never mutate an approved period or its results.

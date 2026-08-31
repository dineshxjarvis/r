# Geospatial — sources, assertions, governed geometry, topology, evaluation, and delivery

Domain rules: [`../../../features/geospatial/geospatial-governance-spec.md`](../../../features/geospatial/geospatial-governance-spec.md). Relational contract: [`../../../architecture/geospatial-data-model.md`](../../../architecture/geospatial-data-model.md). Conventions: [`../../README.md`](../../README.md).

Every geometry on the wire is GeoJSON with an explicit `srid`. Every published version carries **geometry kind, purpose, target, source, CRS and datum, dimensionality, accuracy and method, effective interval, and reviewer authority** — a geometry with any of those missing cannot be published, because "where is the boundary" is a legal question and an unattributed answer is worthless.

An **unknown or ambiguous CRS, axis order, horizontal datum, or required vertical datum blocks publication.** Guessing is how a lease boundary ends up 200 metres from where the lease actually is.

## Routes

| Route | Purpose |
|---|---|
| `GET /spatial-sources?view=reference_systems` · `GET /spatial-sources` · `POST /spatial-sources` | Reference-system catalogue and source trust classes |
| `GET /spatial-source-policies` · `POST /spatial-source-policies` · `POST /spatial-source-policies/{id}/actions` | Precedence, composition, reviewer rule |
| `GET /spatial-layers` · `POST /spatial-layers` · `POST /spatial-layers/{id}/actions` | Layer identity and classification |
| `GET /spatial-imports` · `POST /spatial-imports` · `POST /spatial-imports/{id}/actions` | Sealed artefact ingestion |
| `GET /spatial-assertions` · `POST /spatial-assertions/{id}/actions` | What a source claims |
| `POST /governed-geometries` · `GET /governed-geometries/{id}` | Stable geometry identity; the collection read moves to the current-version view |
| `GET /governed-geometry-versions` · `POST /governed-geometry-versions` · `POST /governed-geometry-versions/{id}/actions` | Immutable published versions |
| `GET /spatial-resolutions` · `POST /spatial-resolutions` | Competing assertions, chosen result |
| `GET /spatial-topologies` · `POST /spatial-topologies` · `POST /spatial-topologies/{id}/actions` | Nodes and directed edges |
| `GET /surface-models` · `POST /surface-models` · `POST /surface-models/{id}/actions` | DTM, DSM, point cloud, raster |
| `GET /spatial-derived-products` · `POST /spatial-derived-products` · `POST /spatial-derived-products/{id}/actions` | Buffers, differences, cut/fill — never automatically authoritative |
| `GET /spatial-evaluations` · `POST /spatial-evaluations` · `POST /spatial-evaluations/{id}/actions` | Is this point inside that boundary |
| `GET /map-compositions` · `POST /map-compositions` · `POST /map-compositions/{id}/actions` | Composed views and offline packages |

`GET /governed-geometries` is replaced by `GET /governed-geometry-versions?view=current`, returning one governed current version with its stable identity reference. Creating or reading a specific stable identity remains separate from publishing a version.

`GET /map-compositions/{id}/features` is `GET /governed-geometry-versions?filter[composition_id]=…`. `GET /spatial/health` is `GET /spatial-topologies?group_by=state&metrics=count` plus `GET /governed-geometry-versions?filter[withdrawn]=true`.

---

## POST /spatial-imports

**Auth:** `spatial.import` on the target scope.

```json
{
  "spatial_source_id": "ssrc_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "spatial_layer_id": "slyr_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
  "artifact": { "document_id": "doc_01HZY3C4D5E6F7G8H9J0K1T2M0", "sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6", "byte_size": 8412094, "filename": "Gevra_lease_2026_revision.dxf" },
  "declared_format": "DXF",
  "declared_crs": { "authority": "EPSG", "code": 32644, "display": "WGS 84 / UTM zone 44N" },
  "declared_axis_order": "EASTING_NORTHING",
  "declared_vertical_datum": null,
  "source_time": "2026-08-11T00:00:00Z",
  "manifest": { "expected_feature_count": 1, "expected_geometry_kind": "POLYGON" },
  "extensions": {}
}
```

### Response — 202 Accepted

```json
{
  "success": true,
  "message": "Import accepted; parsing and validation queued",
  "data": {
    "operation": {
      "id": "op_01HZY4D5E6F7G8H9J0K1T2M3N0",
      "object": "operation",
      "status": "RUNNING",
      "kind": "spatial.import",
      "target": { "type": "spatial_import", "id": "simp_01HZY5E6F7G8H9J0K1T2M3N400" },
      "stages": ["PARSE", "CRS_CHECK", "STRUCTURAL_VALIDATION", "LOCALITY_CHECK", "TOPOLOGY_CHECK", "ACCURACY_CHECK"],
      "progress": { "completed": 1, "total": 6, "percent": 17 },
      "started_at": "2026-09-01T10:00:02Z",
      "estimated_completion_at": "2026-09-01T10:01:20Z",
      "links": { "self": "/api/v1/operations/op_01HZY4D5E6F7G8H9J0K1T2M3N0" }
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-01T10:00:02Z" }
}
```

### GET /spatial-imports/{id} — validation failed

```json
{
  "success": true,
  "data": {
    "id": "simp_01HZY5E6F7G8H9J0K1T2M3N400",
    "object": "spatial_import",
    "version": 3,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "VALIDATION_FAILED",
    "available_actions": ["QUARANTINE", "REVIEW", "RESUBMIT"],
    "spatial_source": { "type": "spatial_source", "id": "ssrc_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "SECL Survey Wing, Korba" },
    "spatial_layer": { "type": "spatial_layer_definition", "id": "slyr_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "Mining lease boundary (legal)" },
    "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "artifact": { "document_id": "doc_01HZY3C4D5E6F7G8H9J0K1T2M0", "sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6", "byte_size": 8412094, "filename": "Gevra_lease_2026_revision.dxf", "sealed": true },
    "declared_format": "DXF",
    "declared_crs": { "authority": "EPSG", "code": 32644, "display": "WGS 84 / UTM zone 44N" },
    "detected_crs": { "authority": null, "code": null, "display": "Not declared in file header", "confidence": "UNKNOWN" },
    "declared_axis_order": "EASTING_NORTHING",
    "declared_vertical_datum": null,
    "source_time": "2026-08-11T00:00:00Z",
    "received_at": "2026-09-01T10:00:00Z",
    "manifest": { "expected_feature_count": 1, "expected_geometry_kind": "POLYGON", "parsed_feature_count": 1, "omitted_feature_count": 0 },
    "validation_results": [
      { "check": "PARSE", "outcome": "PASS", "detail": "1 polygon, 1184 vertices" },
      { "check": "CRS_CHECK", "outcome": "FAIL", "severity": "BLOCKING", "detail": "File header carries no CRS. Declared EPSG:32644 places the polygon 214 km from the mine's registered location, which is inconsistent with EPSG:32644 easting/northing ordering.", "suggested_crs": [{ "authority": "EPSG", "code": 32644, "axis_order": "NORTHING_EASTING", "residual_offset_m": "3.2", "confidence": "HIGH" }] },
      { "check": "STRUCTURAL_VALIDATION", "outcome": "WARN", "severity": "ADVISORY", "detail": "2 self-intersections at vertices 411 and 903", "proposed_repairs": [{ "kind": "SNAP_AND_DISSOLVE", "tolerance_m": "0.05", "affected_vertices": [411, 903] }] },
      { "check": "LOCALITY_CHECK", "outcome": "FAIL", "severity": "BLOCKING", "detail": "Centroid falls 214 km from the mine's registered location" },
      { "check": "TOPOLOGY_CHECK", "outcome": "SKIPPED", "detail": "Blocked by CRS_CHECK" },
      { "check": "ACCURACY_CHECK", "outcome": "SKIPPED", "detail": "Blocked by CRS_CHECK" }
    ],
    "publication_blocked": true,
    "publication_blocked_reasons": ["AMBIGUOUS_AXIS_ORDER", "LOCALITY_MISMATCH"],
    "assertion_count": 0,
    "created_at": "2026-09-01T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/spatial-imports/simp_01HZY5E6F7G8H9J0K1T2M3N400", "operation": "/api/v1/operations/op_01HZY4D5E6F7G8H9J0K1T2M3N0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-01T10:02:00Z" }
}
```

The validator does not guess and quietly proceed. It states the ambiguity, offers a ranked interpretation with a residual, and **blocks publication** until a reviewer decides.

**A proposed repair creates a reviewed derivative and never replaces the source assertion.** The self-intersections stay in the source; the repair is a separate, attributed act.

---

## POST /governed-geometry-versions

**Auth:** `spatial.publish` on the layer and target, under the layer's reviewer rule.

```json
{
  "governed_geometry_id": "ggeo_01HZY6F7G8H9J0K1T2M3N405P0",
  "source_assertion_ids": ["sass_01HZY7G8H9J0K1T2M3N405P6Q0"],
  "source_geometry": { "type": "Polygon", "coordinates": [[[344182.44, 2471104.21], [351884.10, 2471104.21], [351884.10, 2476620.88], [344182.44, 2476620.88], [344182.44, 2471104.21]]], "srid": 32644 },
  "source_crs": { "authority": "EPSG", "code": 32644, "axis_order": "NORTHING_EASTING" },
  "normalized_geometry": { "type": "Polygon", "coordinates": [[[82.5600, 22.3500], [82.6300, 22.3500], [82.6300, 22.4000], [82.5600, 22.4000], [82.5600, 22.3500]]], "srid": 4326 },
  "transformation": { "id": "strf_01HZY8H9J0K1T2M3N405P6Q7R0", "method": "EPSG:16044 inverse, no datum shift required", "version": 3 },
  "dimensionality": "XY",
  "vertical_datum": null,
  "accuracy": { "horizontal_ce90_m": "0.35", "vertical_le90_m": null, "method": "DGPS static, 6 control points", "survey_date": "2026-08-11" },
  "effective_from": "2026-09-01T00:00:00Z",
  "effective_until": null,
  "supersedes_version_id": "ggev_01HZY9J0K1T2M3N405P6Q7R8S0",
  "reviewer_evidence_manifest_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Geometry version published",
  "data": {
    "id": "ggev_01HZYA0B1C2D3E4F5G6H7J8K90",
    "object": "governed_geometry_version",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PUBLISHED",
    "available_actions": ["WITHDRAW", "SUPERSEDE"],
    "governed_geometry": { "type": "governed_geometry", "id": "ggeo_01HZY6F7G8H9J0K1T2M3N405P0", "display": "Gevra OCP mining lease boundary" },
    "spatial_layer": { "type": "spatial_layer_definition", "id": "slyr_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "Mining lease boundary (legal)", "layer_kind": "LEGAL", "classification": "RESTRICTED" },
    "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "purpose": "LEASE_BOUNDARY_LEGAL",
    "geometry_kind": "POLYGON",
    "source_geometry": { "type": "Polygon", "coordinates": [[[344182.44, 2471104.21], [351884.10, 2471104.21], [351884.10, 2476620.88], [344182.44, 2476620.88], [344182.44, 2471104.21]]], "srid": 32644 },
    "source_crs": { "authority": "EPSG", "code": 32644, "axis_order": "NORTHING_EASTING", "display": "WGS 84 / UTM zone 44N" },
    "normalized_geometry": { "type": "Polygon", "coordinates": [[[82.5600, 22.3500], [82.6300, 22.3500], [82.6300, 22.4000], [82.5600, 22.4000], [82.5600, 22.3500]]], "srid": 4326 },
    "normalized_crs": { "authority": "EPSG", "code": 4326, "axis_order": "LONGITUDE_LATITUDE", "display": "WGS 84" },
    "transformation": { "id": "strf_01HZY8H9J0K1T2M3N405P6Q7R0", "method": "EPSG:16044 inverse, no datum shift required", "version": 3, "required_because": "source_crs differs from normalized_crs" },
    "both_geometries_immutable": true,
    "dimensionality": "XY",
    "vertical_datum": null,
    "accuracy": { "horizontal_ce90_m": "0.35", "vertical_le90_m": null, "method": "DGPS static, 6 control points", "survey_date": "2026-08-11" },
    "area": { "value": "3448.500", "unit": "HECTARE", "computed_in_crs": "EPSG:32644" },
    "source_assertions": [{ "type": "spatial_source_assertion", "id": "sass_01HZY7G8H9J0K1T2M3N405P6Q0", "display": "SECL Survey Wing lease revision, 2026-08-11" }],
    "effective_from": "2026-09-01T00:00:00Z",
    "effective_until": null,
    "supersedes_version_id": "ggev_01HZY9J0K1T2M3N405P6Q7R8S0",
    "superseded_by_version_id": null,
    "withdrawn_at": null,
    "published_by": { "type": "person", "id": "per_01HZYB1C2D3E4F5G6H7J8K9T00", "display": "T. Oraon" },
    "published_by_appointment_id": "app_01HZYC2D3E4F5G6H7J8K9T0M10",
    "reviewer_evidence_manifest_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
    "downstream_reference_count": 0,
    "created_at": "2026-09-01T11:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/governed-geometry-versions/ggev_01HZYA0B1C2D3E4F5G6H7J8K90" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-01T11:00:00Z", "effects": [ { "object": "governed_geometry_version", "id": "ggev_01HZY9J0K1T2M3N405P6Q7R8S0", "change": "STATE", "to": "SUPERSEDED" }, { "object": "outbox_event", "count": 1, "change": "CREATED", "note": "Downstream impact: attendance geofences, environment monitoring points" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

**Source geometry and normalised geometry are both immutable**, and the transformation is mandatory whenever they differ. A dispute about where the boundary is can always go back to the numbers the surveyor actually recorded.

### 422 — overlapping precedence key

```json
{
  "success": false,
  "message": "A published version already covers this precedence key over the requested interval",
  "error": {
    "code": "UNPROCESSABLE",
    "details": {
      "precedence_key": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0:LEASE_BOUNDARY_LEGAL",
      "conflicting_version_id": "ggev_01HZYD3E4F5G6H7J8K9T0M1N20",
      "conflicting_interval": { "from": "2026-04-01T00:00:00Z", "to": null },
      "resolution": "Set supersedes_version_id so the prior interval closes at effective_from"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### 422 — vertical datum required

```json
{
  "success": false,
  "message": "This layer requires a vertical datum",
  "error": {
    "code": "UNPROCESSABLE",
    "details": {
      "layer_kind": "OPERATIONAL",
      "purpose": "BENCH_CREST_3D",
      "dimensionality_supplied": "XY",
      "dimensionality_required": "XYZ",
      "vertical_datum_supplied": null,
      "vertical_datum_required": true,
      "reason": "Height-dependent decisions cannot be made against an undefined vertical reference"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### WITHDRAW

```json
{
  "action": "WITHDRAW",
  "expected_version": 1,
  "reason": "Survey control point CP-4 found to be disturbed; the 11 August revision is unreliable and is withdrawn pending re-survey",
  "payload": { "revert_to_version_id": "ggev_01HZY9J0K1T2M3N405P6Q7R8S0" },
  "supporting_authority": { "appointment_id": "app_01HZYC2D3E4F5G6H7J8K9T0M10", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Version withdrawn; 3 downstream domains notified",
  "data": {
    "id": "ggev_01HZYA0B1C2D3E4F5G6H7J8K90",
    "object": "governed_geometry_version",
    "version": 2,
    "state": "WITHDRAWN",
    "withdrawn_at": "2026-09-18T09:00:00Z",
    "withdrawal_reason": "Survey control point CP-4 found to be disturbed; the 11 August revision is unreliable and is withdrawn pending re-survey",
    "historical_references_preserved": true,
    "downstream_impact": [
      { "domain": "attendance", "object": "checkpoint", "count": 4, "impact": "GEOFENCE_REVERTED" },
      { "domain": "environment", "object": "monitoring_point", "count": 6, "impact": "GEOMETRY_VERSION_PINNED", "note": "Historical results keep the version they were evaluated against" },
      { "domain": "production", "object": "physical_stock_snapshot", "count": 2, "impact": "REVIEW_REQUIRED" }
    ],
    "available_actions": []
  },
  "meta": {
    "action": "WITHDRAW",
    "transition": { "from": "PUBLISHED", "to": "WITHDRAWN" },
    "effects": [
      { "object": "governed_geometry_version", "id": "ggev_01HZY9J0K1T2M3N405P6Q7R8S0", "change": "STATE", "to": "PUBLISHED", "note": "Prior version reinstated as current" },
      { "object": "outbox_event", "count": 3, "change": "CREATED", "note": "Downstream impact events" },
      { "object": "notification", "count": 7, "change": "CREATED" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-18T09:00:00Z"
  }
}
```

**Withdrawal preserves historical references and emits downstream impact events.** An environment result evaluated last month against the withdrawn boundary keeps pointing at the version it actually used — the past does not silently change shape.

Deletes are prohibited under active domain reference or legal hold. Retirement is supersession or withdrawal, always.

---

## POST /spatial-evaluations

**Auth:** `spatial.evaluate` on the subject's scope.

```json
{
  "subject": { "kind": "POINT", "geometry": { "type": "Point", "coordinates": [82.4817, 22.3300], "srid": 4326 }, "accuracy_m": "3.5", "source_ref": { "type": "evidence", "id": "ev_01HZZDD2E3F4G5H6J7K8T9M0N0" } },
  "target_geometry_version_id": "ggev_01HZYA0B1C2D3E4F5G6H7J8K90",
  "spatial_policy_id": "spol_01HZYE4F5G6H7J8K9T0M1N2030",
  "purpose": "EVIDENCE_WITHIN_LEASE",
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Evaluation complete: INSIDE",
  "data": {
    "id": "sevl_01HZYF5G6H7J8K9T0M1N203P40",
    "object": "spatial_evaluation",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED",
    "available_actions": ["RE_EVALUATE", "REQUEST_OVERRIDE"],
    "subject": { "kind": "POINT", "geometry": { "type": "Point", "coordinates": [82.4817, 22.3300], "srid": 4326 }, "accuracy_m": "3.5", "source_ref": { "type": "evidence", "id": "ev_01HZZDD2E3F4G5H6J7K8T9M0N0" } },
    "target_geometry_version": { "type": "governed_geometry_version", "id": "ggev_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "Gevra OCP mining lease boundary, effective 2026-09-01" },
    "spatial_policy": { "type": "spatial_policy_version", "id": "spol_01HZYE4F5G6H7J8K9T0M1N2030", "display": "Evidence-within-lease, v2", "version": 2 },
    "purpose": "EVIDENCE_WITHIN_LEASE",
    "analysis_crs": { "authority": "EPSG", "code": 32644, "display": "WGS 84 / UTM zone 44N", "reason": "Planar CRS required for metric distance" },
    "transformation_versions": [{ "from": "EPSG:4326", "to": "EPSG:32644", "method": "EPSG:16044", "version": 3 }],
    "algorithm": { "name": "ST_Contains with boundary semantics", "version": "postgis-3.4", "boundary_semantics": "BOUNDARY_IS_INSIDE" },
    "outcome": "INSIDE",
    "values": { "distance_to_boundary_m": "418.220", "nearest_boundary_segment": "W_EDGE", "inside_by_margin_m": "418.220" },
    "uncertainty": { "subject_accuracy_m": "3.5", "target_accuracy_ce90_m": "0.35", "combined_uncertainty_m": "3.52", "tolerance_m": "5.0", "outcome_robust_to_uncertainty": true },
    "provenance": { "evaluated_at": "2026-09-14T14:12:31Z", "evaluated_by_principal_id": "prn_01HZZB1C2D3E4F5G6H7J8K9T00", "policy_version": 2, "target_version_effective_from": "2026-09-01T00:00:00Z" },
    "immutable": true,
    "re_evaluations": [],
    "overrides": [],
    "created_at": "2026-09-14T14:12:31Z",
    "extensions": {},
    "links": { "self": "/api/v1/spatial-evaluations/sevl_01HZYF5G6H7J8K9T0M1N203P40" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T14:12:31Z" }
}
```

### Response — 201 Created, indeterminate

```json
{
  "success": true,
  "message": "Evaluation complete: INDETERMINATE",
  "data": {
    "id": "sevl_01HZYG6H7J8K9T0M1N203P4Q50",
    "object": "spatial_evaluation",
    "version": 1,
    "state": "INDETERMINATE",
    "outcome": "INDETERMINATE",
    "values": { "distance_to_boundary_m": "2.140", "nearest_boundary_segment": "N_EDGE", "nominal_result": "INSIDE" },
    "uncertainty": { "subject_accuracy_m": "8.2", "target_accuracy_ce90_m": "0.35", "combined_uncertainty_m": "8.21", "tolerance_m": "5.0", "outcome_robust_to_uncertainty": false },
    "indeterminate_reason": "The point lies 2.14 m inside the boundary with combined positional uncertainty of 8.21 m. INSIDE and OUTSIDE are both consistent with the observation.",
    "available_actions": ["RE_EVALUATE", "REQUEST_OVERRIDE"]
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T14:14:00Z" }
}
```

An outcome inside the combined uncertainty band is `INDETERMINATE`, **not** a coin-flip `INSIDE`. Downstream gates treat it as unresolved rather than as a pass.

**An evaluation outcome can never be rewritten.** `RE_EVALUATE` and `REQUEST_OVERRIDE` append linked records:

```json
{
  "action": "REQUEST_OVERRIDE",
  "expected_version": 1,
  "reason": "Surveyed on foot with a total station on 16 September; the working face is 11 m inside the boundary. The handset fix was degraded by highwall multipath.",
  "payload": { "proposed_outcome": "INSIDE", "scope": "THIS_EVALUATION_ONLY", "evidence_ids": ["ev_01HZYH7J8K9T0M1N203P4Q5R60"] }
}
```

```json
{
  "success": true,
  "message": "Override requested",
  "data": {
    "id": "sevo_01HZYJ8K9T0M1N203P4Q5R6S70",
    "object": "spatial_evaluation_override",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "REQUESTED",
    "available_actions": ["APPROVE", "REJECT", "WITHDRAW"],
    "evaluation": { "type": "spatial_evaluation", "id": "sevl_01HZYG6H7J8K9T0M1N203P4Q50", "display": "INDETERMINATE, 2.14 m inside, ±8.21 m" },
    "original_outcome": "INDETERMINATE",
    "proposed_outcome": "INSIDE",
    "scope": "THIS_EVALUATION_ONLY",
    "reason": "Surveyed on foot with a total station on 16 September; the working face is 11 m inside the boundary. The handset fix was degraded by highwall multipath.",
    "evidence_ids": ["ev_01HZYH7J8K9T0M1N203P4Q5R60"],
    "override_policy": { "policy_id": "spol_01HZYE4F5G6H7J8K9T0M1N2030", "overrides_permitted": true, "required_capability": "spatial.evaluation.override", "required_evidence_kinds": ["SURVEY_RECORD"] },
    "original_evaluation_mutated": false,
    "created_at": "2026-09-16T11:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/spatial-evaluation-overrides/sevo_01HZYJ8K9T0M1N203P4Q5R6S70" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-16T11:00:00Z", "effects": [ { "object": "approval_request", "count": 1, "change": "CREATED" } ] }
}
```

---

## POST /spatial-topologies

**Auth:** `spatial.topology.publish`. Edges must reference existing nodes **in the same published version** and pass configured connectivity checks.

```json
{
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "network_type": "UNDERGROUND_TRAVELLING_ROUTE",
  "crs": { "authority": "EPSG", "code": 32644 },
  "vertical_datum": "EGM2008",
  "effective_from": "2026-10-01T00:00:00Z",
  "nodes": [
    { "local_ref": "N1", "node_kind": "SHAFT", "reference": { "type": "asset", "id": "ast_01HZYK9T0M1N203P4Q5R6S7T80" }, "position": { "type": "Point", "coordinates": [344900.10, 2473118.40, 284.20], "srid": 32644 }, "uncertainty_m": "0.4" },
    { "local_ref": "N2", "node_kind": "DISTRICT", "reference": { "type": "mine_subunit", "id": "sub_01HZYJ8K9T0M1N203P4Q5R6S70" }, "position": { "type": "Point", "coordinates": [345412.88, 2473840.11, 118.60], "srid": 32644 }, "uncertainty_m": "1.2" }
  ],
  "edges": [
    { "from_local_ref": "N1", "to_local_ref": "N2", "directed": false, "geometry": { "type": "LineString", "coordinates": [[344900.10, 2473118.40, 284.20], [345120.00, 2473500.00, 201.00], [345412.88, 2473840.11, 118.60]], "srid": 32644 }, "level": "SEAM_III", "section": "MAIN_INCLINE", "travel_restriction": null, "confidence": "SURVEYED", "nominal_travel_time": "PT11M" }
  ],
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Topology version published: 2 nodes, 1 edge",
  "data": {
    "id": "stop_01HZYT0M1N203P4Q5R6S7T8V90",
    "object": "spatial_topology_version",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PUBLISHED",
    "available_actions": ["SUPERSEDE", "WITHDRAW"],
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "network_type": "UNDERGROUND_TRAVELLING_ROUTE",
    "topology_version_number": 7,
    "crs": { "authority": "EPSG", "code": 32644 },
    "vertical_datum": "EGM2008",
    "effective_from": "2026-10-01T00:00:00Z",
    "effective_until": null,
    "node_count": 2,
    "edge_count": 1,
    "connectivity_checks": [
      { "check": "ALL_EDGES_REFERENCE_EXISTING_NODES", "outcome": "PASS" },
      { "check": "NO_ORPHAN_NODES", "outcome": "PASS" },
      { "check": "ALL_DISTRICTS_REACHABLE_FROM_A_SHAFT", "outcome": "PASS" },
      { "check": "NO_ZERO_LENGTH_EDGES", "outcome": "PASS" },
      { "check": "TRAVEL_TIME_PLAUSIBLE", "outcome": "PASS", "detail": "Min transit N1→N2 11 min at 1.2 m/s over 792 m" }
    ],
    "used_by": [{ "domain": "attendance", "purpose": "PRESENCE_TRANSITION_VALIDATION", "note": "Minimum transit times drive impossible-transition detection" }],
    "published_by_appointment_id": "app_01HZYC2D3E4F5G6H7J8K9T0M10",
    "created_at": "2026-09-25T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/spatial-topologies/stop_01HZYT0M1N203P4Q5R6S7T8V90" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-25T10:00:00Z", "effects": [ { "object": "outbox_event", "count": 1, "change": "CREATED", "note": "Attendance transition validation picks up topology version 7" } ] }
}
```

---

## POST /map-compositions/{id}/actions — CREATE_OFFLINE_PACKAGE

**Auth:** `spatial.export` plus read on **every** layer in the composition. **Restricted-layer authorization is applied before feature query, tile generation, and export** — not after, and not only in the UI.

```json
{
  "action": "CREATE_OFFLINE_PACKAGE",
  "expected_version": 2,
  "payload": { "generalization": "ZOOM_10_TO_18", "expires_at": "2026-10-20T00:00:00Z", "purpose": "FIELD_INSPECTION" }
}
```

```json
{
  "success": true,
  "message": "Offline package generated; 2 layers omitted by authorization",
  "data": {
    "id": "stpk_01HZYM1N203P4Q5R6S7T8V9V00",
    "object": "spatial_tile_package",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "READY",
    "available_actions": ["DOWNLOAD", "REVOKE"],
    "map_composition": { "type": "map_composition_version", "id": "mcmp_01HZYN203P4Q5R6S7T8V9V0W10", "display": "Gevra field inspection map v4" },
    "authorized_scope": {
      "included_layers": [
        { "layer_id": "slyr_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "Mining lease boundary (legal)", "version_id": "ggev_01HZYA0B1C2D3E4F5G6H7J8K90" },
        { "layer_id": "slyr_01HZY03P4Q5R6S7T8V9V0W1X20", "display": "Haul road network", "version_id": "ggev_01HZYP4Q5R6S7T8V9V0W1X2Y30" }
      ],
      "omitted_layers": [
        { "layer_id": "slyr_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "display": "Blast design zones", "reason": "CLASSIFICATION_RESTRICTED", "required_capability": "spatial.read_restricted_blast" },
        { "layer_id": "slyr_01HZYR6S7T8V9V0W1X2Y3Z4A50", "display": "Adjacent lessee boundaries", "reason": "OUT_OF_TENANT_SCOPE" }
      ]
    },
    "generalization": "ZOOM_10_TO_18",
    "as_of": "2026-10-06T00:00:00Z",
    "byte_size": 41288302,
    "package_hash": "sha256:7d1a9c4e2f6b830d5ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c",
    "expires_at": "2026-10-20T00:00:00Z",
    "download_state": "NOT_DOWNLOADED",
    "download_count": 0,
    "purpose": "FIELD_INSPECTION",
    "created_at": "2026-10-06T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/spatial-tile-packages/stpk_01HZYM1N203P4Q5R6S7T8V9V00" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-06T09:00:00Z", "effects": [ { "object": "access_event", "count": 1, "change": "CREATED", "note": "Export is purpose-logged" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

Omitted layers are **named with their reason**. A field officer who takes an offline map underground must know what is missing from it, not discover the gap at the face.

---

## Invariants

- Every published version carries geometry kind, purpose, target, source, CRS and datum, dimensionality, accuracy and method, effective interval, and reviewer authority.
- Source and normalised geometry are both immutable, and the transformation version is mandatory when they differ.
- Unknown or ambiguous CRS, axis order, horizontal datum, or required vertical datum blocks publication.
- Published versions for the same precedence key never overlap ambiguously.
- Geometry repair creates a reviewed derivative and never replaces the source assertion.
- Legal, approved-plan, operational, environmental, and safety geometries use distinct layer kinds and are never conflated.
- Height-dependent decisions require compatible vertical datums and stated uncertainty.
- An evaluation retains exact target, subject, policy, algorithm, and transformation versions, and its outcome is never rewritten — re-evaluations and overrides append.
- An outcome within the combined uncertainty band is `INDETERMINATE`, never a guessed pass.
- Topology edges reference nodes in the same published version and pass connectivity checks.
- Restricted-layer authorization is applied before feature query, tile generation, and export.
- A derived product cannot be promoted to governed geometry without review and publication.
- Withdrawal preserves historical references and emits downstream impact events; deletes are prohibited under active reference or legal hold.
- Bulk import and publication are manifest-bound, so partial failure or omission is visible.

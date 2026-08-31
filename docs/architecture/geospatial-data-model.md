# Geospatial Governance — Logical Data Model

Read with the [geospatial specification](../features/geospatial/geospatial-governance-spec.md). Foundation owns mine/assets; documents own source artifacts; operational domains reference immutable spatial versions/evaluations.

## 1. Catalogue and sources

- `spatial_reference_system_profile`: source CRS, datum, axis/unit, vertical datum, area/epoch validity and approved transformations.
- `spatial_source`: authority/organization/system/survey, trust class and external identifier.
- `spatial_source_policy_version`: geometry kind/purpose selector, precedence/composition/reviewer rule and effective interval.
- `spatial_layer_definition`: stable layer identity, geometry kind, owner, classification, allowed dimensions and schema/style versions.

## 2. Import, assertions and publication

- `spatial_import`: sealed artifact/manifest, source, declared format/CRS, received time and lifecycle.
- `spatial_source_assertion`: imported feature identity, source geometry/attributes, target reference, source/effective times and lineage.
- `spatial_validation_result`: structural/CRS/locality/topology/accuracy checks and proposed repairs.
- `spatial_review`: assertion/set decision, reviewer authority, reason and evidence manifest.
- `governed_geometry`: stable purpose-specific geometry identity and target.
- `governed_geometry_version`: immutable source and normalized geometry, dimensions, CRS/transformation, accuracy/method, effective interval, publication and supersession.
- `spatial_resolution`: competing assertions, chosen/composed result and purpose-specific rationale.

## 3. Topology and derived products

- `spatial_topology_version`: mine/network type, CRS/datum, effective interval and publication.
- `topology_node`: shaft/outlet/junction/checkpoint/district reference, position and uncertainty.
- `topology_edge`: directed connectivity, geometry, level/section, travel restriction and confidence.
- `surface_model_version`: DTM/DSM/point cloud/raster reference, resolution, vertical datum, controls, accuracy and coverage.
- `spatial_derived_product`: buffer, difference, cluster, cut/fill or other output with exact input/algorithm manifest; never automatically authoritative.

## 4. Evaluation and delivery

- `spatial_policy_version`: purpose, target kind, predicate/boundary semantics, tolerance/accuracy/vertical rules and override policy.
- `spatial_evaluation`: subject, target geometry version, policy, analysis CRS/transformation, algorithm, outcome, values, uncertainty and provenance.
- `spatial_evaluation_override`: original result, decision, authority, reason, scope and evidence.
- `map_composition_version`: layer versions, filters, as-of time, styles and projection.
- `spatial_tile_package`: composition, authorized scope, generalization, expiry, hash and download/audit state.

## 5. Constraints

1. Every published version has geometry kind, purpose, target, source, CRS/datum, dimensionality, accuracy/method, effective time and reviewer authority.
2. Source geometry and normalized geometry are both immutable; transformation/version is mandatory when they differ.
3. Unknown/ambiguous CRS, axis order, horizontal datum or required vertical datum blocks publication.
4. Published versions for the same precedence key cannot overlap ambiguously.
5. Geometry repair creates a reviewed derivative and never replaces the source assertion.
6. Legal, approved-plan, operational, environmental and safety geometries use distinct layer kinds.
7. 3D/height decisions require compatible vertical datums and uncertainty.
8. Evaluation retains exact target/subject/policy/algorithm/transformation versions.
9. Evaluation outcome cannot be rewritten; re-evaluation/override appends linked records.
10. Topology edges reference existing nodes in the same published version and pass configured connectivity checks.
11. Restricted layer authorization is applied before feature query, tile generation and export.
12. A derived product cannot be promoted to governed geometry without review/publication.
13. Withdrawal preserves historical references and emits downstream impact events.
14. Deletes are prohibited under active domain reference or legal hold; retirement uses supersession/withdrawal.
15. Bulk import/publication is manifest-bound so partial failure/omission is visible.

## 6. State transitions

```text
import/assertion: RECEIVED → PARSED → UNDER_REVIEW → APPROVED → PUBLISHED
                              ↘ VALIDATION_FAILED | QUARANTINED
published version → SUPERSEDED | WITHDRAWN
evaluation: CREATED → COMPLETED | INDETERMINATE | ERROR
override: REQUESTED → APPROVED | REJECTED | WITHDRAWN
```

Canonical geometry lives in a spatially enabled relational store; large rasters/point clouds remain immutable objects with indexed footprints/metadata. Cached tiles/search indexes are disposable projections.

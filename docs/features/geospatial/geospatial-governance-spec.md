# Strata — Geospatial Governance and Spatial Decision Specification

## 1. Purpose and boundary

This specification owns `CAP-18` and PS §4.16. Read it before changing mine/asset geometry, lease or approved-plan boundaries, monitoring points, geofences, underground topology, field-location verification, spatial clustering, survey/drone imports or map publication.

GIS owns governed spatial assertions, reviewed geometry versions, layer semantics, topology and reproducible spatial evaluations. It does not own legal instruments, mine/asset identity, captured evidence, monitoring results, attendance events, production quantities, incidents or findings. A map is a projection; it never becomes the source merely because it is visually convincing.

## 2. Never say “the mine boundary” without a kind

| Geometry kind | Meaning and likely source | Must not prove |
|---|---|---|
| Coal/block boundary | Binding coordinates in allocation/vesting context | Mining lease or current working permission |
| Leasehold boundary | Area granted by competent authority for mining/related activity | Surface rights, forest or EC permission |
| Approved mining-plan geometry | Approved pits, benches, dumps, infrastructure or phase | Current as-built position |
| EC/forest/consent geometry | Approval-specific area or monitoring condition | Lease title or safety permission |
| Land/surface-right parcel | Ownership/acquisition/possession context | Mineral/operational authority |
| Active working/operational zone | Current operator-controlled area | Statutory approval by itself |
| Safety/restricted/exclusion zone | Effective operational or statutory constraint | Exact hazard state outside its validity |
| Environmental monitoring point | Approved/representative sampling location | Entire mine compliance |
| Underground district/topology | Surveyed levels, roads, shafts, junctions and connectivity | GNSS-precise continuous worker location |

Consumers request a named layer/geometry purpose. The system rejects ambiguous “inside mine” decisions.

## 3. Official ecosystem and source posture

- Ministry of Coal describes CMSMS as a web GIS for detecting unauthorized mining with geofenced complaints and routes cases to nodal officers: [CMSMS SOP page](https://coal.gov.in/public-information/sop) and [official overview](https://coal.gov.in/sites/default/files/2024-08/08-08-2024b-wn.pdf).
- The Ministry's land portal distinguishes binding coal-block coordinates from leasehold boundaries: [CLAMP FAQ](https://www.clamp.coal.gov.in/faqs).
- Survey of India publishes Open Series data in WGS 84/UTM and provides GCP/CORS and vertical-datum services: [Online Maps Portal](https://onlinemaps.surveyofindia.gov.in/AboutPortal.aspx).

These are source candidates, not a universal precedence rule. The authority responsible for each geometry kind publishes an effective `spatial_source_policy`. CMSMS/NCoG, SWCS, an approved plan, a lease order, a certified survey and a drone model may legitimately disagree because they describe different purposes or dates.

## 4. Actors and accountability

| Function | Responsibility |
|---|---|
| Mine surveyor / authorized survey team | Produces controlled surveys, control-point and accuracy metadata |
| GIS/data steward | Ingests, validates schema/CRS/topology and manages lineage; cannot confer legal authority |
| Mine Manager/plan owner | Accepts operational geometry for the stated purpose |
| Legal/land/mining-plan/environment owner | Reviews authority-issued geometry within professional scope |
| Safety/ventilation/operations authority | Publishes time-bounded restricted zones/topology constraints within authority |
| Field user/inspector | Captures observations; cannot edit target geometry to make evidence pass |
| Independent reviewer | Reviews high-consequence geometry/evaluation or disputed change |
| Authorized regulator/Ministry user | Reads/publishes only under mandate/jurisdiction |

Titles resolve through posts/appointments. Import permission, review, publication, restricted-layer access and evaluation override are separate capabilities.

## 5. Spatial assertion to publication lifecycle

```text
source acquired → bytes/metadata sealed → CRS/datum/units identified
→ geometry parsed and structurally validated → source assertion retained
→ comparison/difference/accuracy review → purpose-specific approval
→ immutable geometry version published effective from/to
→ consumers evaluate against explicit version/policy
→ amendment/supersession preserves historical evaluations
```

States: `RECEIVED`, `PARSED`, `VALIDATION_FAILED`, `UNDER_REVIEW`, `APPROVED`, `PUBLISHED`, `SUPERSEDED`, `WITHDRAWN`, `QUARANTINED`. Publication requires source document/reference, geometry kind, target, CRS, horizontal/vertical datum, dimensionality, scale/resolution/accuracy, method, valid/effective interval and reviewer authority. Unknown CRS or datum cannot be guessed.

Competing assertions remain visible. A reviewed `spatial_resolution` selects one or composes a purpose-specific version and records why; it never deletes alternatives.

## 6. Coordinate, height, dimensionality and uncertainty rules

- Preserve source coordinates and CRS exactly; store a normalized analysis geometry plus transformation/version used.
- WGS 84 longitude/latitude is an exchange/display form, not automatically the best measurement CRS.
- Distance/area/volume uses an approved projected/local mine CRS appropriate to location and scale.
- Horizontal datum, vertical datum, geoid/model and height type are explicit. Ellipsoidal height is not silently treated as mine reduced level or orthometric height.
- Geometry records dimensionality: 2D, 2.5D surface, 3D solid/network. A 2D polygon cannot prove vertical containment underground.
- Point fixes carry horizontal and vertical accuracy. Survey products carry scale/resolution, control points, method, RMSE/uncertainty and certification.
- Transformations outside their valid area/epoch or with missing grids fail visibly.

CartoDEM/base maps may support regional visualization or screening. Statutory volumetrics and precise engineering decisions require fit-for-purpose controlled survey/drone/LiDAR evidence and accountable approval.

## 7. Geometry and topology validation

Validation includes format/size/security scan, CRS existence, finite coordinates, valid rings, self-intersection, orientation, duplicate vertices, empty/sliver geometry, expected locality, scale/area sanity, Z continuity and topology rules. Polygon repair is proposed and compared; never silently applied.

Underground networks model nodes, directed edges, level/section/district, effective connectivity, travel restriction, ventilation/escape semantics where authorized, and surveyed confidence. A checkpoint maps to a topology node/edge. Inference may state `between pit-head and district junction`; it must not invent an exact point.

## 8. Spatial evaluation

An evaluation binds:

- subject observation/geometry and its accuracy;
- target geometry/version and purpose;
- effective spatial policy/tolerance;
- analysis CRS/transformation;
- algorithm/library version;
- result, distances/overlap and uncertainty; and
- evaluated time and actor/system provenance.

Outcomes are `WITHIN`, `OUTSIDE`, `INTERSECTS`, `INDETERMINATE`, `NOT_COMPARABLE` and `ERROR`. Boundary semantics (`covers`, `contains`, buffer, vertical interval) are policy fields, not developer guesses.

For an uncertain point and target:

```text
entire accuracy region within allowed geometry → WITHIN
entire accuracy region outside allowed geometry → OUTSIDE
accuracy region crosses boundary → INDETERMINATE
```

A geofence result is evidence fitness for a stated use, not proof that work occurred, permission existed or a legal breach happened. High-consequence override requires independent authority, reason/evidence and preserves the original evaluation.

## 9. Layers, maps and access

A `spatial_layer_definition` declares geometry kind, purpose, classification, allowed consumers, style/schema, owner and source policy. Layer versions are effective-dated. A `map_composition` is a saved projection of named layer versions, filters and as-of time; it has no authority of its own.

Restricted layers can include underground plans, explosive/storage locations, critical infrastructure, worker traces or sensitive ecology. Responses apply geometry generalization, attribute redaction, scale/zoom limits, watermark/export controls and purpose logging. Authorization filters features before tiles/exports are generated; hiding a layer in the UI is not security.

Public/base tiles never receive internal query identifiers or secrets. Offline map packages are encrypted, scope/time bounded, revocable where possible and audit downloaded packages.

## 10. Change, alerting and failure handling

- New geometry never retroactively changes an old evaluation; consumers may request an explicit re-evaluation creating a linked result.
- Effective overlap/gap or unexpected area/centroid change creates review, not last-write-wins.
- External feed unavailable: show last successful version/freshness and do not label it current.
- Tile service unavailable: domain records and spatial evaluation continue against canonical geometry; use approved cached basemap.
- Import partially fails: quarantine whole publication set or explicitly publish accepted members under one manifest; never silently omit.
- Device location spoof/poor accuracy: field evidence retains intrinsic verdict; spatial evaluation becomes indeterminate/outside as policy dictates.
- Emergency restricted zone publication prioritizes safety, records authority/time/source and requires post-event reconciliation; it cannot amend legal lease geometry.
- Source withdrawal/correction: preserve withdrawn version and downstream impact list.

## 11. Downstream contracts

- Field evidence receives versioned target and evaluation, not a mutable asset radius.
- Attendance receives checkpoint/topology versions and bounded inference.
- Environment stores monitoring-point geometry version and comparability impacts after relocation.
- Production stores stock/working survey version, method and uncertainty; GIS does not calculate approved quantity.
- Incidents/inspections/findings store captured location and referenced geometry version.
- Analytics clusters only comparable coordinates/resolution/time windows and exposes coverage; a heatmap is not a finding.
- Reporting binds exact published geometry/source manifests; integration reconciles external versions.

## 12. Capabilities

| Capability | Target |
|---|---|
| `spatial.source.configure`, `spatial.source.read` | source policy/source |
| `spatial.import.create`, `spatial.import.review` | import/assertion set |
| `spatial.geometry.publish`, `spatial.geometry.withdraw` | geometry/version |
| `spatial.layer.configure`, `spatial.layer.read`, `spatial.layer.read_restricted` | layer/scope |
| `spatial.topology.manage`, `spatial.topology.read` | topology/mine |
| `spatial.evaluate`, `spatial.evaluation.read`, `spatial.evaluation.override` | evaluation/subject/target |
| `spatial.map.compose`, `spatial.export` | composition/layer set |

## 13. Acceptance scenarios

1. Lease and coal-block polygons coexist without synonymy.
2. Unknown CRS/datum import is quarantined, never assumed WGS 84.
3. Source and normalized geometries plus transformation remain reconstructable.
4. A low-accuracy fix crossing a boundary returns `INDETERMINATE`.
5. Moving a boundary does not alter a prior closure evaluation.
6. A 2D polygon cannot confirm underground vertical containment.
7. Self-intersection repair requires review and retains original bytes/geometry.
8. Emergency exclusion zone expires without changing the lease.
9. Restricted underground tiles are authorization-filtered before rendering/export.
10. Tile outage does not disable canonical evaluation.
11. Survey/drone volume reports method, controls and uncertainty; GIS does not assert production quantity.
12. Competing source geometries remain visible with purpose-specific resolution.

## 14. Non-goals

- Replacing CMSMS/NCoG, Survey of India, certified surveyors or approval authorities.
- Treating consumer GPS, satellite basemaps or CartoDEM as survey-grade.
- Universal 100 m geofence or one CRS for every calculation.
- Continuous exact underground tracking.
- Automatic legal violation, mine-plan deviation or land-title conclusion from intersection alone.

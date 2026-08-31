# Wave 7 — Geospatial Governance Whole-System Gap Audit

## A. Outcome and boundary

Outcome: provide purpose-specific, authoritative, versioned and uncertainty-bearing spatial context/evaluations for mine governance. GIS owns geometry governance/evaluation, not legal instruments, observations, compliance conclusions or operational facts.

## B. Real-world actor/accountability map

Authorized surveyor/team produces; GIS steward ingests/validates; land/legal/mining-plan/environment/safety owners review within scope; Mine Manager accepts operational use; field users capture but cannot move targets; independent reviewer handles consequential changes/overrides; authorities act by mandate/jurisdiction.

## C. Authoritative records and ownership

Source artifact/assertion, reviewed governed geometry version, topology, source/spatial policy and evaluation are distinct. Tiles/maps/clusters are projections. Large raster/point-cloud bytes are immutable objects; footprints/metadata and governed vectors are relational spatial records.

## D. Lifecycle and handoff trace

```text
source/controlled survey → sealed import → CRS/datum/geometry validation
→ competing assertion comparison → purpose-specific review/publication
→ versioned evaluation → consumer record → amendment/impact/re-evaluation
```

## E. Physical/device/offline model

Consumer GNSS has accuracy/spoof/sky-view limits; underground location is topology/checkpoint based. Drone/LiDAR/DTM accuracy and vertical datum are explicit. Offline maps are encrypted/scope-bound; tile outage does not stop canonical evaluation.

## F. Authority and separation-of-duties matrix

Importer cannot self-publish high-consequence geometry. Field submitter cannot edit target geofence. GIS administrator cannot decide land title/legal breach. Restricted-layer read, publish and evaluation override are separate. Regulatory authority is constrained by mandate/jurisdiction.

## G. Failure, abuse and recovery scenarios

Tested: wrong/unknown CRS, axis swap, missing vertical datum, self-intersection, partial shapefile, stale CMSMS feed, conflicting lease/plan survey, boundary amendment, low-accuracy fix, spoofed GPS, 2D/3D mismatch, topology disconnect, tile outage, unauthorized export, geometry moved to make evidence pass and historic re-evaluation.

## H. Upstream/downstream dependency impacts

Upstream: identity/mine/assets, documents, external sources and certified surveys. Downstream: evidence/CAPA, attendance/muster, inspections/incidents, environment, production, reports, dashboard/search/analytics and integrations. Every consumer retains geometry/evaluation version and freshness.

## I. Gap register

### GAP-07-001

- **Gap:** lease, block, plan, land, approval, operational and safety geometries were conflated as “mine boundary”.
- **Impact:** wrong polygon could authorize work or allege violation.
- **Resolution:** governed geometry-kind/layer catalogue and purpose-specific queries.
- **Status:** `RESOLVED`.

### GAP-07-002

- **Gap:** no source assertion, precedence/composition, review or competing-source lifecycle.
- **Impact:** last import silently becomes truth.
- **Resolution:** effective source policy, retained assertions, reviewed spatial resolution and immutable publication.
- **Status:** `RESOLVED`.

### GAP-07-003

- **Gap:** CRS, axis, datum, vertical reference, dimensionality and transformation were implicit.
- **Impact:** shifted boundaries, wrong heights/areas/volumes and false underground containment.
- **Resolution:** mandatory reference profiles, source/normalized copies and transformation provenance.
- **Status:** `RESOLVED`.

### GAP-07-004

- **Gap:** geometry validation/repair and bulk-import partial failure were undefined.
- **Impact:** malformed or omitted features could be published invisibly.
- **Resolution:** manifest-bound validation, quarantine and reviewed derivative repair.
- **Status:** `RESOLVED`.

### GAP-07-005

- **Gap:** geofence evaluation used boolean distance without accuracy, boundary or version semantics.
- **Impact:** uncertain fixes become false green/red decisions and later geometry rewrites history.
- **Resolution:** six-outcome immutable evaluations with uncertainty, policy and exact input versions.
- **Status:** `RESOLVED`.

### GAP-07-006

- **Gap:** underground topology and 3D/vertical limits lacked canonical representation.
- **Impact:** system invents precise GPS-like locations or compares incompatible heights.
- **Resolution:** versioned node/edge topology, dimensionality and vertical-datum compatibility gates.
- **Status:** `RESOLVED`.

### GAP-07-007

- **Gap:** restricted geometry could leak through tiles, bbox counts, exports or offline packages.
- **Impact:** worker/critical-infrastructure/ecology/security exposure.
- **Resolution:** pre-render authorization, generalization/redaction, purpose logging and bounded encrypted packages.
- **Status:** `RESOLVED`.

### GAP-07-008

- **Gap:** concrete authoritative source/accuracy/refresh policy and CMSMS/NCoG/SWCS interfaces require agency/operator agreements.
- **Impact:** design cannot claim current statutory geometry nationally.
- **Resolution:** policy/adapter/freshness boundary fixed; catalogue and feeds remain onboarding/Wave 12 dependencies.
- **Status:** `ACCEPTED_RISK`.

## J. Decisions requiring human approval

1. Each land/lease/plan/environment/safety owner approves source policy and publication authority.
2. Survey/GIS authority approves CRS, datum, transformation, accuracy and topology criteria.
3. Security/privacy owners approve layer classification, generalization/export and retention.
4. Integration owners approve feeds, identifiers, refresh/reconciliation and outage posture.

## K. Canonical documents that must change

Feature, logical model, API/indexes, authorization, glossary, capability/inventory, decisions, field-evidence boundary and tracker.

## L. Exit verdict

**Pre-design verdict: FAIL.** PostGIS fragments and visualization prose lacked spatial authority, versioning, uncertainty and restricted-layer controls.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-07-001 through 007 are resolved. GAP-07-008 remains an explicit onboarding/Wave 12 dependency.

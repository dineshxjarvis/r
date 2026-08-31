# Wave 6 — Attendance, Presence and Muster Whole-System Gap Audit

## A. Outcome and boundary

Outcome: record work attendance, checkpoint-bounded presence and emergency accounting without pretending any one proves the others. Attendance owns observations/registers/muster responses; contractor owns eligibility, GIS owns geometry/topology, incident owns emergency command, payroll/billing consume approved exports.

## B. Real-world actor/accountability map

Mine Manager is accountable; Attendance Clerk is operational custodian; shift official validates roster/exceptions; lamp-room attendant binds/returns credentials; contractor supervisor submits its roster; device administrator maintains readers; muster coordinator accounts for people; rescue/incident command receives unresolved handovers; regulator reads under mandate/jurisdiction.

## C. Authoritative records and ownership

Immutable presence events and corrections are canonical observations. Attendance/presence/muster boards are rebuildable projections. Contractor eligibility is referenced, not copied as authority. Device/GIS/incident states remain their owners' records. Generated registers freeze exact source cuts.

## D. Lifecycle and handoff trace

```text
shift/roster → contractor eligibility → mine validation → credential issue
→ repeated checkpoint observations → exceptions/corrections → reconciliation
→ register/attestation/export
incident activation → expected-person cut → responses/search/handovers → muster close
```

## E. Physical/device/offline model

Surface may use approved biometric/card/geofence sources. Underground uses intrinsically safe approved credential/readers and topology checkpoints, not phone GPS. Prototype hardware emits production-shaped events but is labelled uncertified. Signed batches use boot/session plus sequence; offline emergency/manual records retain trusted-time bounds and reconcile.

## F. Authority and separation-of-duties matrix

Contractor roster requires mine validation. Device admin cannot create attendance. Credential issuer cannot approve a dispute they caused. Correction proposer cannot approve. Muster operator cannot erase expected people. Payroll cannot mutate presence. Regulatory reads remain purpose-logged and privacy-filtered.

## G. Failure, abuse and recovery scenarios

Tested: repeat underground trips, missing return, dead reader, clock drift, replay, duplicated/swapped tag, biometric no-match, unrostered entry, eligibility expiry mid-shift, offline gate, cross-midnight shift, post-attestation correction, emergency during outage, omitted person, contradictory safe report, unresolved handover and payroll disagreement.

## H. Upstream/downstream dependency impacts

Upstream: identity, contractor eligibility, GIS checkpoints/topology, device trust. Downstream: incidents/rescue, contractor exposure, payroll/billing, inspections, dashboards, analytics, reports and audit. Wave 7 must provide governed geometry; Wave 15 must implement physical audit/history controls.

## I. Gap register

### GAP-06-001

- **Gap:** legacy one-pair-per-day attendance cannot represent repeated belowground movements.
- **Impact:** statutory/safety history and muster population are wrong.
- **Resolution:** append-only multi-transition presence event stream.
- **Status:** `RESOLVED`.

### GAP-06-002

- **Gap:** device identity, replay, clock uncertainty, health and coverage lacked executable semantics.
- **Impact:** forged/duplicated readings or outages can look authoritative.
- **Resolution:** signed sequence batches, device-health intervals, trusted-time fields and coverage exceptions.
- **Status:** `RESOLVED`.

### GAP-06-003

- **Gap:** attendance, access eligibility and productive work could be conflated.
- **Impact:** badge punch might authorize unsafe work or prove wages/output falsely.
- **Resolution:** explicit owner boundaries and immutable eligibility snapshot/reference.
- **Status:** `RESOLVED`.

### GAP-06-004

- **Gap:** correction and post-register amendment lifecycle was incomplete.
- **Impact:** silent edits destroy statutory and payroll reproducibility.
- **Resolution:** compensating corrections, independent approval and superseding register generations.
- **Status:** `RESOLVED`.

### GAP-06-005

- **Gap:** muster expected population, omitted people, contradictory responses and unresolved closure were undefined.
- **Impact:** missing/stale people could be treated as safe.
- **Resolution:** frozen inclusion cut, additive people, append-only responses, uncertainty states and acknowledged handover gate.
- **Status:** `RESOLVED`.

### GAP-06-006

- **Gap:** worker privacy and biometric handling were not an explicit access/retention matrix.
- **Impact:** continuous surveillance, biometric leakage or unnecessary cross-mine worker exposure.
- **Resolution:** no raw templates, purpose-specific projections, aggregate portfolio views, self-access/correction and policy retention.
- **Status:** `RESOLVED`.

### GAP-06-007

- **Gap:** offline/device failure could either block emergency work or allow unlimited stale admission.
- **Impact:** unsafe denial or uncontrolled access.
- **Resolution:** bounded signed offline decisions, witnessed continuity records and mandatory reconciliation.
- **Status:** `RESOLVED`.

### GAP-06-008

- **Gap:** exact approved electronic attendance method, device certification/topology, retention schedule and statutory template depend on DGMS/operator approval.
- **Impact:** software design cannot claim paperless or intrinsically safe production deployment.
- **Resolution:** adapter/model boundary and printable attested register fixed; deployment approval remains external.
- **Status:** `ACCEPTED_RISK`.

## J. Decisions requiring human approval

1. DGMS/operator safety authority approves device, topology, electronic-register and fallback policy.
2. Privacy/worker-relations owners approve purposes, projections, biometric boundary and retention.
3. Mine authority approves exception severity, reconciliation and register templates.
4. Incident/rescue owner approves muster inclusion, response and handover policy.

## K. Canonical documents that must change

Feature, logical model, API/indexes, legacy API quarantine, authorization, glossary, capability map, decisions and tracker.

## L. Exit verdict

**Pre-design verdict: FAIL.** The feature described correct intent, but the only endpoint contract still encoded one daily pair and no executable muster.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-06-001 through 007 are resolved. GAP-06-008 remains a named deployment approval dependency.

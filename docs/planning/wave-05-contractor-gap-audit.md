# Wave 5 — Contractor Compliance Whole-System Gap Audit

## A. Outcome and boundary

Outcome: prove which contractor supply-chain entity may perform which work at which mine, with which workers/assets, under which current requirements, while preserving principal-employer oversight and cross-mine history. Identity, documents, attendance, incidents, inspections, CAPA, production and procurement retain their own records.

## B. Real-world actor/accountability map

Principal Employer/representative → contract owner/engineer-in-charge → contractor compliance administrator → specialist verifier → security/access operator; contractor authorized representative → supervisor → worker; subcontractors remain distinct. Labour/DGMS authorities act through mandate and jurisdiction. Vacancies route to approved alternates and are surfaced; they do not create self-approval.

## C. Authoritative records and ownership

Identity owns organizations/people/affiliations; contractor domain owns engagement package, requirement instance, eligibility and performance projection; documents own artifacts; source operational domains own events/findings. External licences remain authority-owned mirrors. Procurement owns money and award decisions.

## D. Lifecycle and handoff trace

```text
due diligence → engagement → work package → disclosed subcontract approval
→ roster/asset assignment → requirements selected → evidence independently reviewed
→ eligibility → gate/shift decision → continuous expiry/suspension monitoring
→ source-domain attribution/performance → dispute/decision → demobilization
```

Failure in the middle creates an explicit hold, exception or safe-withdrawal path; it never manufactures eligibility.

## E. Physical/device/offline model

Gate systems consume short-lived signed decisions. Offline allow-lists expire at the earliest credential/policy boundary and all admissions reconcile. A badge proves credential possession, not work eligibility. Attendance proves observed presence, not permission.

## F. Authority and separation-of-duties matrix

Contractor submits; operator/specialist verifies. Package proposer does not approve. Exception requester does not approve. Security enforces but cannot waive. A contractor cannot inspect unrelated mine compliance or decide an attribution dispute in its own favour.

## G. Failure, abuse and recovery scenarios

Tested: expired training, forged evidence, licence revocation, worker-count threshold crossing, duplicate identity, hidden subcontractor, headcount breach, asset/operator mismatch, engagement expiry mid-shift, verifier vacancy, gate/network outage, retroactive amendment, disputed incident attribution, cross-mine blacklist misuse and denominator-free risk ranking.

## H. Upstream/downstream dependency impacts

Upstream: identity, documents, obligation policy, mines/GIS zones. Downstream: attendance/access, inspections, incidents, CAPA, production attribution, dashboards, analytics, reports and external adapters. Wave 6 consumes eligibility but owns presence. Wave 13 may score governed facts but cannot decide access/debarment.

## I. Gap register

### GAP-05-001

- **Gap:** engagement was treated as sufficient contractor compliance.
- **Impact:** a commercially active contractor could work without package-specific legal/safety eligibility.
- **Resolution:** separate engagement, package, requirement and eligibility lifecycles.
- **Status:** `RESOLVED`.

### GAP-05-002

- **Gap:** no first-class work package, hazard/zone scope, headcount ceiling or subcontract chain.
- **Impact:** applicable requirements and responsibility cannot be selected defensibly.
- **Resolution:** scoped packages and acyclic approved subcontract relationships.
- **Status:** `RESOLVED`.

### GAP-05-003

- **Gap:** uploaded/parsed document could be mistaken for a valid credential.
- **Impact:** expired, forged, revoked or wrong-scope evidence could permit work.
- **Resolution:** independent requirement instances, issuer mirrors and authorized review.
- **Status:** `RESOLVED`.

### GAP-05-004

- **Gap:** blocking credentials and override authority were undefined.
- **Impact:** unsafe blanket denial or arbitrary local bypass.
- **Resolution:** effective policy classes `HARD_STOP`, `CONTROLLED_EXCEPTION`, `WARN_ONLY`, `INFORMATIONAL`; bounded independent exceptions.
- **Status:** `RESOLVED`.

### GAP-05-005

- **Gap:** worker, vehicle/equipment and operator eligibility were conflated.
- **Impact:** one valid subject could incorrectly authorize the others.
- **Resolution:** separate subject requirements plus joint purpose evaluation.
- **Status:** `RESOLVED`.

### GAP-05-006

- **Gap:** attendance/access and contractor eligibility boundaries were unclear.
- **Impact:** badge/attendance might be treated as permission, and expiry could rewrite presence.
- **Resolution:** contractor decides eligibility; access enforces; attendance records physical events and mid-shift withdrawal.
- **Status:** `RESOLVED`.

### GAP-05-007

- **Gap:** cross-domain attribution and contractor history lacked snapshots, disputes, denominators and provenance.
- **Impact:** later contract changes rewrite blame and raw counts create unfair rankings.
- **Resolution:** immutable attribution snapshots, dispute cases and manifest-backed exposure-normalized measures.
- **Status:** `RESOLVED`.

### GAP-05-008

- **Gap:** exact legally approved requirement catalogue, portal verification interfaces and transition rules vary by jurisdiction/operator.
- **Impact:** architecture cannot alone declare a licence/medical/training/wage rule legally complete.
- **Resolution:** effective policy and external-mirror boundary fixed; Ministry/operator legal, labour and safety owners must publish catalogue and adapters during onboarding/Wave 12.
- **Status:** `ACCEPTED_RISK`.

## J. Decisions requiring human approval

1. Legal/labour/safety owners approve policy contents, blocking classification and effective dates.
2. Privacy/HR owners approve worker-data purposes, retention, dispute and adverse-decision safeguards.
3. Operator approves named package, verification and exception authorities.
4. Integration owner approves trusted issuer sources and freshness.

## K. Canonical documents that must change

Feature, logical model, API, authorization capabilities, glossary, indexes, capability map, decisions and production tracker.

## L. Exit verdict

**Pre-design verdict: FAIL.** Identity-only contractor records could not prove safe/legal work eligibility.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-05-001 through 007 are resolved. GAP-05-008 remains an explicit deployment/Wave 12 dependency rather than a hard-coded legal claim.

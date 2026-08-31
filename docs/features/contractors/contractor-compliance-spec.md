# Strata — Contractor Compliance Register Specification

## 1. Purpose and boundary

This specification owns `CAP-05` and PS §4.5. Read it before changing contractor onboarding, work packages, subcontracting, workforce eligibility, access gating, credential expiry, contractor performance, or principal-employer oversight.

The domain answers four different questions:

| Question | Canonical answer |
|---|---|
| Who is commercially engaged to do what, where and when? | Engagement and work package |
| What requirements apply to that organisation, package, worker, vehicle or operator? | Effective requirement policy and requirement instances |
| May this subject start or continue this work now? | Purpose-specific eligibility decision with reasons |
| What is the contractor's governed history? | Versioned performance projection backed by source records |

Identity owns organizations, people, affiliations and authentication. Documents own files and extraction. Attendance owns observed presence. Incidents, inspections, findings/CAPA and production own their records. Procurement owns tender, price, invoice and payment decisions. Contractor compliance references those records and owns eligibility, requirement fulfilment, exceptions and the compliance history projection; it does not copy or rewrite their source state.

## 2. Legal and operating basis

The Occupational Safety, Health and Working Conditions Code took effect on 21 November 2025. The Ministry's compliance handbook describes establishment registration, contractor licensing for applicable contract labour, principal-employer welfare and wage fallback duties, inter-State migrant-worker duties and additional mine duties. The production configuration must therefore be effective-dated by jurisdiction and work context; it must not hard-code an old Act, form number or worker-count threshold.

Official references:

- [Ministry compliance handbook](https://www.labour.gov.in/static/uploads/2026/02/83978455025732b99b0165def80ab171.pdf?v=20260609051130)
- [Ministry announcement implementing the labour codes](https://labour.gov.in/sites/default/files/pib2209767.pdf)
- [DGMS statutes and notifications](https://www.dgms.gov.in/UserView/index?mid=1655)
- [Shram Suvidha Portal](https://registration.shramsuvidha.gov.in/Users/stateintegration_acts/goa)

These sources inform architecture; the Ministry/operator legal owner still publishes the exact applicable requirement catalogue and transition dates.

## 3. Accountability and actors

Titles map to posts and capabilities; they are not cookie enums.

| Function | Responsibility |
|---|---|
| Principal Employer / authorized representative | Accountable operator-side oversight; acts on contractor wage/welfare default and statutory exceptions |
| Contract owner / engineer-in-charge | Defines package scope, locations, dates, headcount and deliverables; sponsors engagement changes |
| Contractor compliance administrator | Collects records, maps requirements and monitors expiry; cannot approve their own evidence |
| Safety/medical/training authority | Verifies domain credentials within professional authority |
| Security/access-control operator | Enforces an eligibility decision at a gate; cannot declare compliance |
| Contractor authorized representative | Maintains its organization, workforce roster and submissions; cannot approve its own compliance |
| Contractor supervisor | Confirms workers assigned to a package/shift and receives exceptions |
| Worker | Views own eligibility/reasons and supplies permitted personal evidence |
| Independent verifier/auditor | Verifies assigned evidence without engagement-management power |
| Authorized labour/DGMS officer | Reads or acts only under mandate and jurisdiction |

One person may hold several functions, but policy must preserve prohibited combinations for the same decision.

## 4. Engagement and supply-chain structure

```text
contractor organization → engagement → one or more work packages
                                      → approved subcontract relationships
work package → mine/asset/zones + work kinds + validity + headcount ceiling
             → accountable operator post + contractor representative
             → applicable requirement policy versions
person → contractor affiliation → package assignment → work eligibility
```

An engagement proves a commercial/operational relationship, not compliance. A package defines the actual work context needed to select requirements. Subcontractors are first-class organizations with a disclosed, approved edge to the parent package; they are never flattened into the prime contractor. The prime relationship and direct employer remain visible on every worker snapshot.

Engagement states are `DRAFT`, `UNDER_REVIEW`, `APPROVED`, `ACTIVE`, `SUSPENDED`, `EXPIRED`, `TERMINATED` and `CLOSED`. Package states are independent because one package may be suspended while another continues. Retroactive start/end changes require an approved correction and never rewrite historical decisions.

## 5. Requirement policy

An effective `contractor_requirement_policy` selects requirements using:

- jurisdiction, mine and operator policy;
- organization/engagement/package/worker/vehicle/equipment/operator subject;
- work kind, zone and hazard class;
- workforce count and worker category, including inter-State migrant context where applicable;
- date/time and governing-instrument version; and
- dependencies such as medical fitness, vocational training, competency, licence, insurance or equipment certification.

Each selected `contractor_requirement_instance` records source anchor, subject, validity rule, issuer/verifier rule, blocking severity, grace/override policy and evidence references. States are `MISSING`, `SUBMITTED`, `UNDER_REVIEW`, `VALID`, `EXPIRING`, `EXPIRED`, `REJECTED`, `SUSPENDED`, `NOT_APPLICABLE` and `SUPERSEDED`.

Uploading a document only creates evidence. Extraction may propose identifiers and dates. Only an authorized review can make an instance `VALID`; external issuer status or revocation can invalidate it later.

## 6. Eligibility, access and continuation

Eligibility is a time-bound decision for one subject, package, work kind, zone and purpose:

```text
identity/affiliation current
∩ engagement and package active
∩ package assignment current
∩ applicable blocking requirements valid
∩ headcount and subcontract approval valid
∩ no effective suspension/debarment/access hold
∩ requested work/zone within scope
= ELIGIBLE | INELIGIBLE | CONDITIONAL | UNKNOWN
```

The result contains evaluated policy/version, inputs, reason codes, expiry horizon and freshness. `UNKNOWN` fails closed for safety-critical entry. A cached gate decision has a short policy-defined validity and cannot outlive any input credential.

Blocking classes:

- `HARD_STOP`: denied immediately; no local override, for example revoked identity, prohibited work or safety-critical expired competency.
- `CONTROLLED_EXCEPTION`: normally denied, but a named independent authority may grant a bounded exception with compensating controls.
- `WARN_ONLY`: work may continue while an alert/escalation runs.
- `INFORMATIONAL`: recorded without access effect.

An exception states subject, exact requirement, package/zone/work limits, start/end, justification, compensating control, approver authority and review state. It cannot cover legal prohibitions or exceed the approver's authority. Contractor self-approval and indefinite waivers are forbidden.

Mid-shift expiry does not silently erase presence. It creates an access/continuation exception routed to the shift official and responsible operator post. Immediate-danger or legally prohibited work stops; other cases follow the effective safe-withdrawal policy. Attendance records the physical exit.

## 7. Worker and asset onboarding

```text
organization due diligence → engagement approved → package activated
→ workforce/asset roster submitted → identity duplicate check
→ requirements materialized → evidence reviewed
→ eligibility evaluated → access credential enabled
→ attendance/operations continuously checked → expiry/suspension response
→ demobilization → credential return/access revocation → final reconciliation
```

Worker records must preserve the direct employer, prime contractor, package, trade/work kind, skill/competency, medical/training validity, permitted zones and privacy classification. Shared workers across contracts receive separate assignments; evidence may be reused only when issuer, scope, policy and consent permit it.

Vehicles/equipment and their operators are separately eligible. A valid vehicle does not qualify an untrained operator, and a qualified operator does not validate an expired inspection/insurance/equipment certificate.

## 8. Cross-domain attribution and history

Source domains attach immutable `contractor_engagement_id`, `work_package_id`, `direct_employer_org_id` and, where justified, responsible-party links at event time. Later organizational changes do not rewrite attribution.

The contractor history projection includes verified counts and rates for inspections, findings, CAPA timeliness/recurrence, incidents/exposure, attendance exceptions, production discrepancies and compliance requirements. Every metric states period, denominator, mine/package coverage, freshness and source manifest. Raw totals are not compared without exposure denominators. A risk score is an explainable signal, never automatic debarment, award rejection or legal guilt.

Disputed attribution creates a case with both parties' assertions, evidence and an authorized decision. The original source record remains owned by its domain.

## 9. Alerts, failures and recovery

- Alert horizons are policy-driven; expiry reminders go to contractor representative and operator custodian.
- External portal unavailable: retain submission intent and evidence; do not claim licence validity without a trusted source or approved manual verification.
- Duplicate person across contractors: hold affected assignments for identity review without merging people automatically.
- Contractor/worker changes employer: close old affiliation/assignment; preserve history and issue a new decision.
- Undisclosed subcontractor or over-headcount roster: block affected package entry and escalate.
- Licence suspended/revoked: recompute affected organization, packages, workers and cached gate decisions.
- Verifier absent: route to an authorized alternate; no self-approval fallback.
- Network/gate outage: use a signed, minimal cached allow-list only within freshness policy; record all offline admissions for reconciliation.
- False or altered evidence: quarantine, preserve provenance, open a finding/security review and recompute eligibility.

## 10. Privacy, retention and worker fairness

Medical diagnosis, biometrics, bank/wage data, government identifiers and migrant-worker details are restricted projections. Eligibility consumers receive reason codes such as `MEDICAL_FITNESS_NOT_CURRENT`, not diagnosis. Contractor management cannot browse unrelated worker data. Workers can view their own decision and correction/dispute route.

Retention follows effective legal, employment, safety, contract and litigation schedules. Legal holds suspend disposal. Cross-mine history exposes governed organizational performance, not a portable blacklist of individual workers. Adverse commercial or employment decisions require human review, stated evidence, contestability and purpose-logged access.

## 11. Required capabilities

| Capability | Target |
|---|---|
| `contractor.engagement.manage`, `contractor.engagement.read` | engagement/target |
| `contractor.package.create`, `contractor.package.approve`, `contractor.package.suspend` | package |
| `contractor.subcontract.propose`, `contractor.subcontract.approve` | subcontract edge/package |
| `contractor.roster.submit`, `contractor.roster.review` | package/roster |
| `contractor.requirement.configure`, `contractor.requirement.submit`, `contractor.requirement.verify` | policy/instance |
| `contractor.eligibility.evaluate`, `contractor.eligibility.read` | subject/package |
| `contractor.exception.request`, `contractor.exception.approve`, `contractor.exception.revoke` | exception |
| `contractor.attribution.dispute`, `contractor.attribution.decide` | attribution case |
| `contractor.performance.read` | organization/authorized portfolio |

## 12. Acceptance scenarios

1. Active engagement with an expired safety-critical training returns `INELIGIBLE`.
2. A contractor upload remains `SUBMITTED` until independent verification.
3. A valid prime contractor cannot hide an unapproved subcontractor.
4. Worker, vehicle and operator eligibility are evaluated separately and jointly at access time.
5. Licence revocation invalidates affected cached decisions and routes safe withdrawal.
6. A controlled exception is bounded and cannot override a legal prohibition.
7. A package expiry mid-shift creates a continuation exception; it does not alter attendance.
8. Same person submitted by two contractors is held for review, not duplicated or auto-merged.
9. A contractor sees its own workforce and cases, not mine-wide compliance.
10. Cross-mine performance shows denominators, provenance and disputed attribution.
11. Offline admission expires at the earliest input expiry and reconciles on reconnect.
12. Historical decisions reproduce the policy and credential versions used at that time.

## 13. Non-goals

- Procurement tendering, bid scoring, invoices, payroll or payment execution.
- Replacing Shram Suvidha, DGMS or other authority systems.
- Storing raw biometric templates or full medical diagnoses in the register.
- Automatically debarring contractors or ranking individual workers with AI.
- Treating a document, attendance event or commercial contract as proof of eligibility by itself.

# Wave 2 — Incident and Emergency Pre-Design Gap Audit

## A. Outcome and boundary

**Outcome:** every accident, dangerous occurrence, near miss and emergency is reported without delay, people are accounted for and protected, required authorities receive provable notice on time, the event is investigated without destroying evidence, and corrective/preventive learning reaches every affected mine.

Incident management owns the event, casualty/impact record, emergency activation, muster linkage, statutory-notification obligation, investigation and lessons. It references but does not own attendance events, evidence objects, inspections, defects/findings, CAPAs, medical records, authority identity, external submissions or GIS geometry.

An observation reports a condition. A defect identifies a problem. A finding concludes that a requirement was breached. An incident records an event that happened. One incident may produce all three linked records without becoming any of them.

## B. Real-world actor/accountability map

| Responsibility | Existing/required position | Accountability boundary |
|---|---|---|
| Immediately raise alarm/report | Any person; reporter may be identified, assisted or protected | Reporting does not require classification authority |
| First response and area control | Shift official/emergency-plan designee | Acts immediately; does not wait for app workflow |
| Mine-level accountability | Mine Manager | Ensures response, notice, investigation and unresolved actions are governed |
| Emergency command | Incident Commander designated by the approved emergency plan | Operational command during activation; assumption/handover is timestamped |
| Rescue operations | Rescue/emergency team authority named by plan | Owns rescue actions, not incident classification |
| Presence accounting | Muster Coordinator using attendance/presence inputs | Records confirmed safe/unresolved; does not rewrite attendance |
| Medical/casualty facts | Authorized medical/first-aid role | Supplies minimum necessary facts; clinical record remains separately governed |
| Classification/notification preparation | Safety Officer or notified incident coordinator | Applies versioned rule catalogue; cannot suppress a triggered notice |
| Statutory sign/send | Owner/Agent/Manager or other authority allowed by governing instrument | Supporting appointment and signature retained |
| Investigation | Manager, Safety Officer or constituted enquiry committee as applicable | Membership, conflicts, evidence access and report issue are explicit |
| Regulatory receipt/enquiry | DGMS or other competent authority under mandate/jurisdiction | External acknowledgement and authority actions are mirrored, not fabricated |
| CAPA execution/verification | Defect/CAPA domain actors | Incident cannot close preventive learning by status edit |

Vacancy or absence resolves through the approved emergency plan and responsibility routes. A missing digital assignee never delays alarm, rescue, scene control or mandatory notice.

## C. Authoritative records and ownership

| Record | Owner | Classification |
|---|---|---|
| Incident and occurrence facts | Incident domain | Source |
| Emergency activation/command handover | Incident domain | Source |
| Muster session | Attendance/presence domain, incident-linked | Source referenced by incident |
| Evidence bytes/verdict | Evidence domain | Source referenced by incident |
| Casualty association and reportable particulars | Incident domain | Source; sensitive clinical detail excluded |
| Statutory notification rule | Governed compliance/rule catalogue | Versioned source selected by event time/context |
| Notification case/attempt/acknowledgement | Incident domain + integration transport facts | Source/mirror with provenance |
| Investigation and conclusions | Incident domain | Source |
| Defect/finding/CAPA | Defect management | Source linked from incident |
| Search/dashboard/AI result | Read-model domains | Projection only |

## D. Lifecycle and handoff trace

```text
event/alarm → provisional incident → immediate triage and emergency activation
→ scene control + rescue + muster + casualty updates
→ reportability classification → notification obligations generated
→ signed notices sent → receipt/acknowledgement reconciled
→ investigation commissioned → evidence frozen/collected → report issued
→ findings/CAPAs/lessons linked → actions verified
→ operational, statutory and learning closure gates evaluated separately
```

No single `CLOSED` transition may imply that response ended, authority acknowledged, investigation completed and CAPAs were verified.

## E. Physical/device/offline model

- Alarm and emergency procedures work without Strata, power or network.
- Offline reports use client-generated IDs and trusted-time bounds; sync never resets occurrence time.
- Shared emergency terminals require identified acting person or witnessed assisted entry.
- Underground location uses last-confirmed checkpoint/topology with confidence, not GPS fiction.
- Device/sensor alarms are unconfirmed signals until linked to an incident; lack of human confirmation does not silently discard them.
- Emergency evidence supports response and investigation but capture must never endanger rescue.

## F. Authority and separation-of-duties matrix

- Anyone in scope may report; anonymous/protected intake may be allowed by policy.
- Only authorized posts classify statutory reportability, but every override from “reportable” to “not reportable” requires independent review and reason.
- Notification signing requires current supported authority and assurance.
- Investigation members declare conflicts; implicated actors cannot approve the final investigation alone.
- Operator users cannot record a regulator acknowledgement or close a regulator-owned enquiry.
- Emergency command grants only emergency-plan actions, not generic compliance closure.

## G. Failure, abuse and recovery scenarios

| Scenario | Required safe result |
|---|---|
| Manager unavailable | Acting/additional-charge or emergency-plan route activates; response/notice clock continues |
| Reporter offline | Local ID and capture time preserved; emergency contact path shown; later sync deduplicates |
| Duplicate phone/app/sensor reports | Retain reports and link them to one incident after authorized review |
| Severity understated | Rule triggers, casualty/dangerous-occurrence facts and independent review can raise classification |
| Reportable changed to non-reportable | Reason, authority and second review mandatory; prior state retained |
| External portal unavailable | Notice remains due; approved alternate channel used; retry/reconciliation visible |
| Email/API sent, no acknowledgement | State remains sent/pending acknowledgement—not filed/accepted |
| Muster data stale | Show unknowns and reader coverage gaps; never treat missing data as safe |
| Evidence arrives after scene release | Preserve provenance and label collection context; do not backdate |
| Emergency interrupts inspection | Inspection is suspended/handed over; incident owns emergency lifecycle |
| Person dies after initial injury notice | Generate the newly applicable death-notification obligation |
| Contractor pressures non-reporting | Protected intake, immutable history and independent escalation remain available |

## H. Upstream/downstream dependency impacts

- Presence supplies “expected/last seen/confirmed safe,” with freshness and uncertainty.
- GIS supplies versioned location and emergency topology.
- Inspections may discover historical incidents or be triggered after one.
- Incident can create observations/defects/findings, but containment starts immediately.
- Workflow routes alerts; incident owns emergency/notification state.
- Reporting later generates governed forms from incident snapshots.
- Analytics consumes classified facts only with lineage and never predicts away reporting duties.
- Contractor domain receives attributable safety events only after governed association.

## I. Gap register

### GAP-02-001

Class: `OWN`  
Claim: No canonical incident domain exists; observations risk absorbing occurred events.  
Evidence: PS §4.2/§4.4 and tracker C-008 versus current feature index.  
Failure consequence: emergency, casualty, notification and investigation state are lost.  
Required decision or fix: create incident feature, logical model and API owner.  
Accountable decision owner: product/architecture.  
Canonical destination: `features/incidents/`, `architecture/incident-data-model.md`, `api-specs/endpoints/incidents/`.  
Blocking wave/date: Wave 2.  
Status: `RESOLVED`

### GAP-02-002

Class: `FLOW`  
Claim: Immediate containment can be delayed until defect/finding/CAPA classification.  
Evidence: tracker C-013 and finding-driven CAPA flow.  
Failure consequence: an active hazard remains exposed while governance catches up.  
Required decision or fix: incident-owned emergency/containment action begins before formal finding/CAPA.  
Accountable decision owner: safety domain owner.  
Canonical destination: incident and defect specifications.  
Blocking wave/date: Wave 2.  
Status: `RESOLVED`

### GAP-02-003

Class: `REQ`  
Claim: Statutory categories, recipients, forms and clocks can change by governing instrument.  
Evidence: CMR 2017 Form 4-A/4-B/4-C material and later central Form VI notification rules.  
Failure consequence: late, wrong or legally obsolete notice.  
Required decision or fix: effective-dated notification-rule catalogue with legal review/publication.  
Accountable decision owner: Ministry legal/safety policy owner.  
Canonical destination: incident feature/data model.  
Blocking wave/date: production rule publication, not core design.  
Status: `BLOCKED`

### GAP-02-004

Class: `AUTH`  
Claim: Reporter, responder, commander, notifier, investigator and regulator are not distinct capabilities.  
Evidence: current authorization catalogue has no incident capabilities.  
Failure consequence: response can be blocked or excessive authority granted.  
Required decision or fix: add target-specific incident/emergency capabilities and separation tests.  
Accountable decision owner: access-control owner.  
Canonical destination: authorization specification.  
Blocking wave/date: Wave 2.  
Status: `RESOLVED`

### GAP-02-005

Class: `DATA`  
Claim: Attendance/muster and incident casualty state lack a stable boundary.  
Evidence: CAP-06 foundation and no incident model.  
Failure consequence: missing workers can be declared safe or duplicated as casualties.  
Required decision or fix: incident references muster; presence owns muster observations and incident owns casualty/event consequence.  
Accountable decision owner: incident/attendance domain owners.  
Canonical destination: both feature specs and incident model.  
Blocking wave/date: Wave 2.  
Status: `ACCEPTED_RISK`

### GAP-02-006

Class: `OPERABILITY`  
Claim: External notice send, receipt and acceptance are conflated.  
Evidence: existing generic workflow delivery model and external DGMS portal/channel dependency.  
Failure consequence: system claims legal notice occurred when only transport succeeded.  
Required decision or fix: channel attempt, delivery proof and authority acknowledgement are separate records/states.  
Accountable decision owner: incident/integration owners.  
Canonical destination: incident feature/API and Wave 12 adapter contract.  
Blocking wave/date: Wave 2 logical design; Wave 12 transport.  
Status: `RESOLVED`

### GAP-02-007

Class: `FLOW`  
Claim: One closure state would conflate response, notification, investigation and preventive learning.  
Evidence: no current incident lifecycle.  
Failure consequence: incidents disappear while statutory or safety work remains open.  
Required decision or fix: independent closure gates and derived overall status.  
Accountable decision owner: incident owner.  
Canonical destination: incident feature/data model/API.  
Blocking wave/date: Wave 2.  
Status: `RESOLVED`

## J. Decisions requiring human approval

1. Ministry legal owner must publish which instrument/rule version applies for each occurrence date and establishment context; software cannot decide legal transition policy from publication dates alone.
2. Operator emergency plans must map the local command, rescue, muster and alternate-notification posts without changing the canonical capabilities.
3. Privacy owner must approve protected/anonymous reporting visibility and casualty-data projections.

## K. Canonical documents that must change

- Incident feature specification, logical data model, endpoint contract and notification matrix.
- Authorization catalogue and defect/attendance boundary language.
- Feature/capability indexes, decision record and production tracker.

### Official-source verification used in this wave

- [Coal Mines Regulations, 2017](https://www.dgms.gov.in/writereaddata/UploadFile/CoalMinesRegulation2017.pdf) — duties, occurrence reporting context and approved emergency response/evacuation plan activation.
- [Forms under Coal Mines Regulations, 2017](https://www.dgms.gov.in/writereaddata/UploadFile/FORMSCMR2017_03072024.pdf) — Form 4-A accident/dangerous-occurrence notice, Form 4-B casualty particulars and Form 4-C return-to-duty particulars.
- [DGMS circular catalogue](https://www.dgms.gov.in/UserView/index?mid=1648) — identifies the online accident-intimation/notice module and channel guidance as integration inputs.
- [Occupational Safety, Health and Working Conditions central notification dated 31 December 2025](https://www.dgms.gov.in/writereaddata/UploadFile/Occupentationlnotification_31122025.pdf) — newer Form VI and notification predicates/clocks requiring an approved transition decision rather than software inference.
- [Mines Rescue Rules, 1985](https://www.dgms.gov.in/writereaddata/UploadFile/Mines%20Rescue%20Rules%2C%201985.pdf) — rescue-station/room accident-notice context and rescue-domain boundary.

## L. Exit verdict

**Pre-design: FAIL — expected.** Seven material gaps were recorded before drafting.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-02-001, 002, 004, 006 and 007 are resolved in the canonical feature/model/API and authorization documents. GAP-02-005 is an accepted cross-wave risk: incident consumes a confidence-bearing muster contract, but Wave 6 must deliver the executable presence model/API before production. GAP-02-003 is explicitly blocked on Ministry legal/safety governance publishing the effective rule contents and transition policy; the architecture fails safe by versioning rules and never inventing applicability.

The post-design pass additionally challenged degraded authorization, next-of-kin communication, emergency-contact freshness, privacy/retention and emergency-plan activation. These are now covered by constrained continuity records, governed human contact tasks, effective-dated/tested routes, classification/legal hold policy, and the owner/agent/manager/principal-official activation basis. No additional unrecorded Wave 2 gap remains.

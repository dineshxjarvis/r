# Strata — Incident and Emergency Management Specification

## 1. Purpose and boundary

This specification owns incident and emergency behaviour for `CAP-04` and the incident portions of PS §4.2, §4.4, §4.5, §4.10–§4.14 and §4.16. It governs accidents, dangerous occurrences, near misses, emergency activations, casualty associations, statutory-notification obligations, investigations and safety lessons.

It does not replace approved emergency plans, rescue procedures or external statutory portals. When Strata is unavailable, physical alarm, rescue and notification procedures continue; the system reconciles records afterward.

## 2. Canonical distinctions

| Concept | Meaning | Owner |
|---|---|---|
| Hazard report | Condition with potential for harm; nothing necessarily happened | Observation/defect domain |
| Near miss | Unplanned event with no realized injury/damage but credible harmful potential | Incident domain |
| Dangerous occurrence | Event meeting an effective statutory/reporting rule, whether or not injury occurred | Incident domain classification |
| Accident | Event producing injury, death, damage or other governed consequence | Incident domain |
| Emergency | Operational response activation requiring command/resources; may begin before classification | Incident domain |
| Casualty | Person affected and reportable consequence details | Incident domain; clinical chart external |
| Containment | Immediate action to remove/isolate danger | Incident domain until handed to defect/CAPA |
| Investigation | Governed enquiry into causes and learning | Incident domain |

A single event may be an accident, dangerous occurrence and emergency simultaneously. These are facets/classifications, not mutually exclusive enum values.

## 3. Accountability and command

The owner, agent and Mine Manager remain the accountable mine authorities within the applicable instrument. The Mine Manager is the primary accountable operational authority for ensuring response, required notice, investigation and follow-through. The approved emergency response and evacuation plan maps concrete posts for first response, incident command, rescue, muster, medical coordination and notification. Strata resolves current appointments at action time and records command assumption/handover.

Any person may raise an alarm or report an event without needing classification authority. Emergency actions never wait for digital assignment, complete identity, evidence upload or reportability decision.

CMR 2017 requires the approved emergency action plan to be put into operation by the owner, agent and manager and, in their absence, the principal official present at the surface. Strata therefore records the activating appointment and route basis. If the normal commander/manager is absent, the approved route resolves an acting/additional-charge or plan-designated post, including that principal-official fallback. A vacancy is a critical routing failure surfaced to the next accountable post; it does not stop response or statutory clocks.

## 4. Intake paths and deduplication

An incident may start from:

- direct alarm or worker/supervisor report;
- offline mobile report;
- control-room or emergency-call entry;
- attendance/muster anomaly;
- sensor/device/ICCC signal;
- inspection discovery, including a historical event;
- external authority notice;
- contractor report;
- imported legacy record; or
- protected/anonymous report allowed by policy.

Every intake creates an immutable `incident_report` with its own source, reporter visibility, asserted occurrence time, recorded time and evidence. Reports are never discarded because another report appears similar. Authorized triage may link several reports to one incident or split a report across events; the original remains traceable.

## 5. Parallel lifecycles

### 5.1 Incident record

```text
PROVISIONAL → CONFIRMED → UNDER_INVESTIGATION → LEARNING_OPEN → COMPLETE
     └──────→ DUPLICATE_LINKED | OUT_OF_SCOPE
```

`COMPLETE` is derived only when all applicable closure gates pass. Duplicate/out-of-scope dispositions require authority, reason and retained source report.

### 5.2 Emergency response

```text
NOT_ACTIVATED | ACTIVATED → STABILIZING → CONTROLLED → DEMOBILIZED
```

Activation records commander, plan/version, declared area and time. `CONTROLLED` means immediate danger is controlled, not that people are accounted for or investigation is complete. Command handover is append-only and cannot create a gap without an acting commander.

### 5.3 Muster

Attendance owns `muster_session`/responses. Incident references the active session and derives counts for `EXPECTED`, `CONFIRMED_SAFE`, `POTENTIALLY_EXPOSED`, `RESCUED_OR_EVACUATED`, `MEDICAL_TRANSFER`, and `UNRESOLVED` using governed mappings. Unknown/stale presence never becomes safe by default.

### 5.4 Statutory notification

```text
NOT_EVALUATED → EVALUATION_REQUIRED → OBLIGATION_GENERATED
→ PREPARED → SIGNED → SEND_ATTEMPTED → DELIVERED
→ ACKNOWLEDGED | REJECTED/REQUIRES_CORRECTION
```

One incident may generate several obligations for different recipients, forms, channels and deadlines. `DELIVERED` is transport proof; `ACKNOWLEDGED` is receiving-authority proof. Alternative-channel use, retries and reconciliation remain visible.

### 5.5 Investigation

```text
NOT_REQUIRED | REQUIRED → COMMISSIONED → EVIDENCE_COLLECTION
→ ANALYSIS → DRAFT_REVIEW → ISSUED → ACTIONS_OPEN → COMPLETE
```

Investigation membership, terms of reference, conflicts, scene release, evidence set, findings and issued report are versioned. Implicated people may provide evidence but cannot solely approve the final report.

## 6. Classification and versioned notification rules

Do not hard-code `fatal`, `serious`, `dangerous`, form names or clocks into application branching. Use an effective-dated, legally reviewed `incident_notification_rule` catalogue containing:

- governing instrument/version and authority;
- effective interval and establishment/mineral/work context;
- predicate over event, consequence and later developments;
- recipient/authority and required channel sequence;
- immediate intimation and formal-notice deadlines;
- form/template version and required fields;
- signature/assurance requirement;
- follow-up triggers, such as later death or return to duty; and
- publication/review provenance.

The rule version is selected using occurrence time and approved transition policy. Later casualty facts may generate a new obligation without rewriting the original classification. Human reviewers see which facts triggered each rule and may escalate classification. A downgrade or `NOT_REPORTABLE` determination requires reason, supporting appointment and independent review under configured policy.

Current official materials must be treated as source input, not embedded assumptions: CMR 2017 materials include accident/dangerous-occurrence notice and casualty/return-to-duty forms, while newer central rules may introduce different forms and clocks. Ministry legal/safety governance must publish the applicable transition policy.

## 7. Immediate response and containment

Emergency and containment actions are first-class records with owner, priority, target area/asset, instruction, started/completed times, status and evidence. They may be created before a defect, requirement-linked finding or CAPA exists.

When stable:

- unresolved hazardous conditions become observations/defects;
- confirmed breaches become findings;
- longer corrective/preventive work becomes CAPA; and
- the containment-to-CAPA handoff retains responsibility and evidence.

Incident completion cannot cancel or silently close linked CAPAs. Conversely, CAPA creation cannot delay immediate containment.

## 8. Casualty and sensitive information

The incident record stores the minimum necessary identity association, involvement, injury consequence category, work-loss/return-to-duty milestones and notification fields. Detailed diagnosis/treatment stays in the authorized medical source and is referenced only when legally necessary.

Family/next-of-kin notification is a governed welfare communication distinct from statutory notification. It records the responsible post, verified contact source, attempt/channel/time, successful-contact confirmation and restricted notes. It must never expose a death through an automated push/SMS before the approved human communication process. Public, workforce, operator, Ministry and regulator projections are separate. Names and medical details do not appear in portfolio metrics by default.

### 8.1 Classification, retention and legal hold

| Data | Default classification | Retention rule |
|---|---|---|
| Alarm and operational response | Restricted operational safety | Approved safety-record schedule |
| Casualty identity/consequence | Highly restricted personal/medical | Statutory/claims schedule; minimum necessary projection |
| Protected reporter identity | Highly restricted | Protected-intake schedule and access-purpose log |
| Signed notice/acknowledgement | Statutory record | Governing-instrument/records schedule |
| Investigation evidence/report | Restricted legal/safety | Investigation and litigation schedule |
| Published lesson/aggregate | Governed published | Publication/version schedule |

Exact periods are effective-dated policy data approved by records/legal owners, not code constants. Investigation, litigation, compensation, regulatory or preservation holds suspend disposal. Disposal is audited and never removes referenced audit facts or hashes required to prove prior action.

## 9. Evidence, scene and chain of custody

- Response takes priority over evidence capture.
- Scene-control records define access/release, not an assumption that the scene is unchanged.
- Each evidence reference records collector, collection context, time confidence, device/source and custody transfer.
- Sensor/CCTV exports retain source-system ID and extraction window/hash.
- Late or offline evidence remains admissible for review with its uncertainty; it is never backdated.
- Investigation report issuance freezes an exact evidence manifest while allowing later supplemental versions.

## 10. External notification and reconciliation

Strata prepares and tracks notices but does not claim legal receipt from HTTP/email success alone. For every obligation it stores:

1. prepared payload/template version and source snapshot;
2. signer and supporting authority;
3. each channel attempt and transport evidence;
4. external reference/acknowledgement when received;
5. rejection/correction correspondence; and
6. reconciliation owner and next attempt.

When the primary portal is unavailable, the rule/continuity policy selects an approved alternate channel. A human remains accountable for unresolved notices. Wave 12 owns concrete adapters; this domain owns business state.

Recipient routes and emergency contacts are effective-dated governed configuration with authority source, verification time, next-review time, approved alternates and health/test results. An expired or unverified route raises an operability exception before an incident; runtime delivery failure invokes the approved alternate and accountable human escalation.

### 10.1 Degraded digital operation

Physical alarms, emergency-plan activation and rescue never depend on Strata authorization availability. Approved emergency terminals may queue a continuity record signed by a device and identified/witnessed actor, constrained to alarm, activation, command assumption, containment and muster operations. On recovery, the server revalidates identity/appointment where possible, reconciles the record, preserves any authority uncertainty and requires review.

Degraded mode cannot sign statutory notices, downgrade reportability, release a held scene, issue an investigation or complete an incident. Those actions require online current authority or the legally approved external/manual process followed by reconciliation.

## 11. Notifications and escalation matrix

| Trigger | Immediate recipients | Acknowledgement/escalation | Owner |
|---|---|---|---|
| Any credible incident report | Shift official + Safety Officer | Unacknowledged high-risk report escalates immediately to Mine Manager route | Incident |
| Emergency activated | Commander, Mine Manager route, control/rescue/muster posts | Each critical role accepts or vacancy fallback activates | Incident/workflow |
| Potentially exposed/unresolved person | Commander, muster and rescue leads | Repeats/escalates until resolved or formally transferred | Presence/incident |
| Fatal/serious/reportable predicate | Mine Manager + notification coordinator/signing route | Deadline timer independent of app delivery | Incident |
| Statutory notice due soon/overdue | Signer, Mine Manager, next accountable post | No silent suppression/digest for critical deadline | Incident/workflow |
| External rejection/no acknowledgement | Notification coordinator + signer | Retry/alternate-channel and escalation policy | Incident/integration |
| Family/next-of-kin communication required | Authorized welfare liaison + Mine Manager route | Human confirmation required; channel failure escalates without exposing details broadly | Incident |
| Scene released | Investigator/response leads | Conflicting holds require explicit resolution | Incident |
| Investigation action issued | Named action owners | Deadline/risk escalation through CAPA/workflow | Defect/CAPA |
| Safety lesson published | Affected mine/role cohort | Receipt/assessment campaign as configured | Incident/compliance |

Contact-directory absence or channel failure creates a critical operational exception. It never marks notification complete.

## 12. Authorization capabilities

| Capability | Target |
|---|---|
| `incident.report`, `incident.report_protected` | mine/location/platform intake |
| `incident.triage`, `incident.classify` | report/incident |
| `incident.read_operational`, `incident.read_sensitive`, `incident.read_published` | incident/projection |
| `emergency.activate`, `emergency.command`, `emergency.handover`, `emergency.demobilize` | incident/emergency activation |
| `incident.containment.assign`, `incident.containment.update` | containment action |
| `incident.casualty.record`, `incident.casualty.verify` | casualty association |
| `incident.notification.prepare`, `incident.notification.sign`, `incident.notification.send` | notification obligation |
| `incident.notification.reconcile`, `incident.notification.override_classification` | notification/classification decision |
| `incident.investigation.commission`, `incident.investigation.conduct`, `incident.investigation.issue` | investigation |
| `incident.scene.control`, `incident.scene.release` | scene/incident |
| `incident.complete` | incident closure gates |

Targets, supporting appointment/mandate/jurisdiction, assurance, purpose and separation policy are evaluated at action time. Emergency command does not grant notification signing, investigation issue or finding closure automatically.

## 13. Closure gates

Overall `COMPLETE` requires:

- emergency response demobilized or explicitly not activated;
- every active muster session closed with unresolved people formally transferred/escalated;
- every applicable notification obligation acknowledged, lawfully waived/not-applicable, or held in an explicitly governed unresolved external state;
- required investigation issued and its actions transferred to named owners;
- all immediate containment complete or transferred to open CAPA/controlled work;
- casualty milestones/reconciliation complete to the required stage; and
- no unowned critical exception.

Completion does not mean every linked long-term CAPA is closed. The incident retains an `LEARNING_OPEN` projection until all required preventive actions finish, and dashboards show both states.

## 14. Failure and abuse controls

- Duplicate reports link without deletion.
- Offline reports preserve asserted versus trusted time and idempotent client ID.
- Classification downgrade requires independent review.
- Notification deadlines use server/governed time and continue during assignment vacancy.
- External outage triggers alternate-channel/reconciliation policy.
- Command cannot be handed to a vacant/expired appointment.
- Muster never infers safe from no event.
- Scene/evidence changes remain append-only and custody-visible.
- Contractor/manager cannot suppress a protected report through local role authority.
- Dashboard zero incidents requires feed coverage; absent feed displays `DATA_INCOMPLETE`.
- Degraded emergency records are constrained, device-signed, reconciled and never silently upgraded into high-risk legal decisions.
- Emergency recipient/contact routes are tested before use and expose expiry/failure.

## 15. Acceptance criteria

1. One accident reported by phone, mobile and sensor becomes three retained reports linked to one incident.
2. Rescue starts before reporter identity or statutory classification is complete.
3. Manager absence resolves a current acting route without pausing notification clocks.
4. A no-injury event can trigger a dangerous-occurrence rule.
5. Later death creates the applicable follow-up obligation without rewriting initial notice history.
6. Portal transport success without authority acknowledgement remains pending acknowledgement.
7. An offline report syncs idempotently with original occurrence-time uncertainty.
8. A stale RFID trace leaves a worker unresolved, not safe.
9. Containment starts before finding/CAPA and later hands off without losing ownership.
10. Classification downgrade by the classifier alone is denied.
11. Investigation issuer with a declared disqualifying conflict is denied.
12. Incident cannot complete with an unowned critical exception.
13. Dashboard distinguishes operational control, statutory state and learning/CAPA state.
14. Every statutory output identifies rule/template version and exact source snapshot.

## 16. Non-goals

- Replacing physical alarms, emergency plans, rescue command or medical systems.
- Encoding unreviewed legal interpretations as application constants.
- Autonomous AI classification of reportability or root cause.
- Claiming statutory receipt without competent-authority evidence.
- Treating incident count as comparable without exposure and feed-coverage context.

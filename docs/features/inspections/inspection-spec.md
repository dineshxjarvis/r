# Strata — Inspection Specification

## 1. Purpose and boundary

This is the canonical specification for planning, registering, conducting, issuing, and following up inspections. Read it before changing inspection schedules, participants, checklists, inspection reports, inspection-origin observations, or regulator inspection authority.

An inspection is a governed activity, not a finding container and not merely an uploaded report:

```text
inspection
  → visit/session
  → checklist responses and field records
  → observations
  → defects where physical conditions exist
  → findings where a requirement is breached
  → CAPA and verification
```

Observations, defects, findings, and CAPAs retain their own lifecycles. An inspection does not automatically turn every observation into a compliance breach.

## 2. Origins and creation modes

The legal workflow is authority-specific. The Mines Act allows the Chief Inspector to authorise or restrict named/classes of inspectors and declare their local area or mine group, and permits an inspector to inspect with assistants; it also obliges the owner, agent, and manager to provide reasonable facilities. MoEFCC's published CCR procedure separately uses Regional Office forwarding, site visit/report submission, approval, and e-signing. Therefore Strata models assignment, team participation, review, approval, and issue as configurable stages rather than assuming one universal hierarchy. Sources: [Mines Act, 1952 §§5–9](https://labour.gov.in/sites/default/files/The-Mines-Act-1952.pdf), [MoEFCC CCR SOP](https://parivesh.nic.in/publicdocument/UPLOAD_OM_NOTIFICATION/IA_DOCS/1002_25012026043343.pdf).

| Origin | Meaning | Who may create authoritative record |
|---|---|---|
| `INTERNAL` | Operator's own inspection, audit, or review | Principal with `inspection.create_internal` on target |
| `REGULATORY` | Inspection conducted under a statutory/regulatory authority | Current authority appointment with matching mandate and jurisdiction |
| `THIRD_PARTY` | ISO auditor, laboratory, insurer, consultant, or contracted assessor | Principal covered by approved third-party assignment/engagement |

Creation mode is separate:

| Mode | Meaning |
|---|---|
| `SCHEDULED` | Planned before fieldwork |
| `AD_HOC` | Initiated without prior schedule |
| `INCIDENT_TRIGGERED` | Created because of an accident, dangerous occurrence, complaint, or risk trigger |
| `FOLLOW_UP` | Reinspection or verification of prior inspection outcomes |
| `RECEIVED_NOTICE` | Receiving organisation registers an external notice before the issuing authority participates in Strata |

`RECEIVED_NOTICE` is never treated as authority-confirmed merely because an operator typed the authority name.

## 3. Inspection types

`inspection_type` is versioned reference data, not a hard-coded enum. It defines:

- origin types allowed;
- purpose/category;
- applicable mine profiles;
- required checklist template/version;
- scheduling constraints;
- required participant roles;
- report and signature policy;
- observation/finding issuance rules;
- closure/follow-up policy; and
- required authority mandate for regulatory use.

Examples include monthly mine safety inspection, environmental compliance inspection, DGMS safety inspection, EC compliance monitoring, pollution-control inspection, contractor safety audit, incident enquiry, and ISO audit.

## 4. Core record

An inspection records:

| Field | Rule |
|---|---|
| `tenant_id`, `mine_id` | Derived from target mine and immutable |
| `inspection_type_version_id` | Required and frozen when scheduled/started |
| `origin`, `creation_mode` | Required |
| `status` | State machine in §8 |
| `title`, `purpose_code`, `purpose_detail` | Purpose code controlled; detail required where policy says |
| `scheduled_from`, `scheduled_until` | Required for scheduled inspections |
| `started_at`, `fieldwork_completed_at`, `issued_at`, `closed_at` | Server-controlled transition timestamps |
| `lead_appointment_id` | Required before fieldwork; validated at action time |
| `issuing_authority_id`, `issuing_authority_unit_id` | Required only for regulatory origin |
| `supporting_mandate_assignment_id`, `jurisdiction_assignment_id` | Required for confirmed regulatory origin |
| `source_instrument_document_id` | Required by inspection policy and for received notices |
| `regulatory_case_id` | Optional grouping for enforcement/enquiry case |
| `created_by_principal_id` | Always server-derived |

An inspection may initially target several related mines only when its type explicitly permits a multi-mine campaign. Field visits, observations, and findings always retain their exact mine.

## 5. Participants and authority

Participants are separate rows because several people and organisations may attend one inspection.

Participation roles include `LEAD`, `INSPECTOR`, `TECHNICAL_EXPERT`, `OBSERVER`, `MINE_REPRESENTATIVE`, `WITNESS`, and `AUDITEE_COORDINATOR`. These describe participation in this inspection; they grant no global capability.

Each participant records person, organisation, appointment/affiliation where applicable, invitation/acceptance state, attendance interval, and who added them.

Rules:

- The lead must have `inspection.conduct` at fieldwork start.
- Regulatory lead and inspectors must have the correct current authority appointment, mandate, and jurisdiction.
- Mine representatives do not gain regulator permissions by participating.
- Notification delegates cannot conduct, issue, or close an inspection.
- Participant authority is checked again for every legal action; validity at scheduling time is insufficient.
- Replacing a lead creates an audited assignment change and does not rewrite prior actions.

## 6. Creation flows

### 6.1 Internal

The caller needs `inspection.create_internal` on every target mine. The server validates the inspection type, checklist applicability, proposed lead, schedule, and participant eligibility. It creates the inspection, target rows, participants, checklist instance, responsibility tasks, and audit/outbox events atomically.

Internal creation cannot specify a regulatory issuer or later issue regulator findings.

### 6.2 Regulatory

The caller needs `inspection.create_regulatory`, supported by:

```text
current authority affiliation where required
∩ current appointment
∩ current inspection mandate
∩ current jurisdiction covering every target
```

The server derives and persists the authority, appointment, mandate, jurisdiction, policy version, and decision time. A client reference is validated evidence, never the grant itself.

Operators cannot create authority-confirmed inspections on a regulator's behalf.

### 6.3 Third party

The caller needs `inspection.create_third_party` plus a current audit assignment or engagement covering the target and inspection type. The governing policy states whether the third party may issue findings, only propose findings, or only provide observations/report evidence.

### 6.4 Received notice

An authorised receiving user needs `inspection.register_received_notice`. Required fields include the original notice document, claimed issuing authority, target, schedule where known, and sender reference.

The record starts `AWAITING_AUTHORITY_CONFIRMATION`. It may generate preparation tasks but cannot:

- assign a regulator appointment;
- claim mandate/jurisdiction validation;
- issue regulator findings;
- mark an authority report issued; or
- grant regulator access.

An authorised regulator may claim/confirm it. Confirmation links the authority records without deleting the receiver's original registration and records any discrepancies.

## 7. Assignment team and handoffs

An inspection team is assembled through an `inspection_assignment` version, not by editing participant rows ad hoc. The assignment records lead, supporting inspectors, specialists, competencies required/satisfied, availability evidence, decision maker, effective time, and reason.

The normal responsibility flow is:

```text
request/intake
  → planning decision
  → team assignment and acceptance
  → field inspection
  → mine response where required
  → authorised review and report issue
  → corrective action
  → independent verification/follow-up
  → closure by the stored closure policy
```

Who starts and ends depends on origin:

| Origin | May initiate | May authorise team | May issue report | May close |
|---|---|---|---|---|
| Internal | Mine/organisation holder of `inspection.create_internal` | Holder of `inspection.assign_team` at target | `inspection.issue_internal` policy | Internal closure/follow-up policy |
| Regulatory | Authority intake/planner or empowered inspector with `inspection.create_regulatory` | Authority holder of `inspection.assign_team` | Authority reviewer with `inspection.issue_regulatory` and required signature | Issuing authority capability under stored closure policy |
| Third party | Commissioning organisation or assigned third party | Commissioning policy owner | Third party or commissioning reviewer as contract states | Governing organisation/authority; never assumed from report author |
| Received notice | Receiving user registers only | Issuing authority after claim | Issuing authority | Issuing authority policy |

The “Inspection Manager” and “Assignment Manager” in a UI are work functions backed by capabilities and concrete posts. They are not universal statutory roles.

### 7.1 Assignment states

```text
PROPOSED → OFFERED → ACCEPTED → ACTIVE → COMPLETED
                    ↘ DECLINED
ACTIVE → REPLACED | WITHDRAWN
```

Fieldwork cannot start until the required lead accepts and every mandatory competency is covered. Supporting participants may accept independently. Regulatory assignments recheck appointment, mandate, jurisdiction, conflict-of-interest, and availability at acceptance and start.

### 7.2 Breaks in the middle

| Failure | System response |
|---|---|
| Planner unavailable | Responsibility route notifies next eligible planning post; no authority is transferred implicitly |
| Proposed member declines/no response | Assignment remains incomplete; planner replaces or explicitly proceeds only if competency coverage remains valid |
| Lead absent before start | Start blocked; authorised coordinator appoints replacement through a new assignment version |
| Lead becomes unavailable during fieldwork | Active visit pauses or an eligible acting lead accepts a handover; completed actions retain original actor provenance |
| Appointment/mandate/jurisdiction expires | Next protected action denies; assign replacement or issue formal authority extension |
| Team member loses connectivity | Offline records remain attributed to that member and sync later; another member may continue only within their own authority |
| Conflict of interest discovered | Member recused, their unissued conclusions quarantined for independent review, evidence retained |
| Mine representative absent | Record no-show; regulator may proceed if governing law/policy permits, but system never fabricates acknowledgement |
| Mine refuses access/cooperation | Record refusal with evidence and escalate to authority workflow; do not mark inspection cancelled/completed |
| Specialist missing | Checklist items needing that competency become `NOT_INSPECTED`; fieldwork completion follows inspection-type policy |
| Reviewer unavailable | Report remains under review and escalates to another eligible review post; inspector cannot self-promote |
| Verifier is assignee/report author | Separation policy denies; assign independent verifier |
| Issuing authority changes jurisdiction mid-case | Existing acts retain provenance; future acts use valid successor assignment or explicit case transfer |
| Deadline passes | Inspection/report/action becomes overdue and escalates; state is not silently auto-completed |

### 7.3 Handover record

Every mid-inspection replacement creates `inspection_handover` with outgoing/incoming assignment, effective timestamp, reason, open checklist items, evidence sync state, unresolved observations, safety briefing acknowledgement, and authorising appointment. Handover never rewrites who performed earlier acts.

## 8. Visits, checklist, and evidence

An inspection may have one or more `inspection_visit` rows for postponed, split, underground/surface, or multi-day fieldwork. Each visit records planned/actual interval, exact targets, attendance, status, and cancellation/postponement reason.

Checklist instances freeze the template version. Responses support `COMPLIANT`, `NON_COMPLIANT`, `NOT_APPLICABLE`, `NOT_INSPECTED`, and structured measurements. `NOT_APPLICABLE` and `NOT_INSPECTED` require reason and are never silently excluded from inspection quality metrics.

Responses link evidence and may create observations. Risk-aware ordering may change presentation order but never remove mandatory checklist items.

Offline clients use stable client-generated IDs and sync visits, responses, observations, and evidence idempotently. Legal transitions such as report issue occur online after synchronization/reconciliation.

## 9. Lifecycle

```text
DRAFT
  → SCHEDULED
  → IN_PROGRESS
  → FIELDWORK_COMPLETE
  → REPORT_UNDER_REVIEW
  → ISSUED
  → CLOSED
```

Additional states:

- `AWAITING_AUTHORITY_CONFIRMATION` for received notices;
- `POSTPONED` with a rescheduled visit;
- `CANCELLED` with authority and reason;
- `REOPENED` only through a governed review/appeal decision.

Rules:

- `DRAFT → SCHEDULED`: targets, type version, lead, checklist, and schedule valid.
- `SCHEDULED → IN_PROGRESS`: eligible lead starts a visit; authority rechecked.
- `IN_PROGRESS → FIELDWORK_COMPLETE`: all active visits ended and mandatory items addressed or explicitly not inspected.
- `FIELDWORK_COMPLETE → REPORT_UNDER_REVIEW`: report version generated/attached and observations reconciled.
- `REPORT_UNDER_REVIEW → ISSUED`: required review/signatures pass. Receiving operator cannot issue regulatory report.
- `ISSUED → CLOSED`: required findings/CAPAs/follow-up policy satisfied; regulatory closure uses issuing-authority policy.
- Cancellation never deletes visits, responses, evidence, or observations already recorded.

## 10. Observations, defects, and findings

Inspection observations inherit immutable provenance:

- inspection and visit IDs;
- checklist response where applicable;
- origin and target mine;
- observing person and appointment;
- issuing authority/unit for regulatory inspections;
- source report/version after issuance; and
- capture time/location/evidence.

An observation remains a raw statement. Human triage may dismiss it with reason, match it to an existing defect, or create a new defect.

A finding additionally requires a breached requirement. For a regulatory inspection, structured issuing provenance and the regulator closure policy derive from the confirmed inspection; the client never sends a boolean regulator flag.

Draft inspection observations are not automatically formal regulator findings. Issuance policy determines when proposed findings become authoritative.

## 11. Reports, issuance, and follow-up

`inspection_report` points to an immutable document version and records report type, review state, issuer, signature events, and issued timestamp. Corrections create a superseding version.

Follow-ups are new inspections linked through `inspection_relation` with `FOLLOW_UP`, `REINSPECTION`, `APPEAL_REVIEW`, or `SUPERSEDES`. The original inspection remains immutable historical evidence.

A follow-up may verify remediation without closing the original authority's findings unless its current mandate and the stored closure policy permit that action.

## 12. Cancellation, postponement, and no-show

- Cancellation requires `inspection.cancel`, reason, effective time, and policy-specific authority.
- Regulatory cancellation after notice may require the issuing authority; operator users may request but not enact it.
- Postponement creates/revises visit schedule without overwriting the original planned interval.
- Participant no-show is recorded per visit. Regulatory no-show does not let the operator mark fieldwork complete.
- Offline field records received after cancellation remain preserved and flagged for review.

## 13. Read projections and privacy

- `inspection.read_internal` exposes governed internal preparation, drafts, and evidence.
- `inspection.read_published` exposes issued/published regulator projection within mandate/jurisdiction.
- Third-party participants see only assigned inspection material and permitted records.
- Mine representatives may see notices and issued findings but not regulator deliberation drafts.
- Regulator reads are purpose-logged.
- Participant contact and security-sensitive mine information are separately redacted.

## 14. Metrics

Track scheduled/completed/issued inspections, overdue fieldwork/reports, coverage of mandatory items, `NOT_INSPECTED` rate, observations by disposition, findings by authority/category, repeat findings, follow-up timeliness, participant no-show, and suspicious zero-finding patterns.

Never score inspectors solely by finding count; that creates an incentive to over-report. Inspection quality metrics must retain denominator, exclusions, source records, and policy version.

## 15. Required tests

1. Mine officer creates internal inspection at authorised mine: allow.
2. Same officer labels it regulatory: deny.
3. DGMS officer with safety mandate and coverage creates regulatory inspection: allow.
4. Same DGMS officer creates EC monitoring inspection: deny mandate mismatch.
5. Correct authority but uncovered mine: deny.
6. Received notice creates unconfirmed record and preparation tasks but no regulator authority.
7. Regulator confirms matching notice; original registration remains audited.
8. Two inspectors participate; neither inherits the other's mandate.
9. Appointment expires between scheduling and start: start denies.
10. Multi-day visit retains separate attendance and evidence intervals.
11. Mandatory checklist item omitted: fieldwork completion denies.
12. `NOT_INSPECTED` with reason succeeds and appears in metrics.
13. Internal observation becomes defect but cannot become regulator-issued finding.
14. Regulatory finding inherits authority provenance from confirmed inspection.
15. Operator attempts to issue regulatory report: deny.
16. Operator attempts to close regulator finding: deny.
17. Follow-up is a new linked inspection; original remains unchanged.
18. Cancellation retains synchronized field evidence.
19. Third party outside engagement dates: deny.
20. Workspace cookie names authorised mine while target inspection belongs elsewhere: deny.

21. Proposed lead declines: inspection cannot start until a valid replacement accepts.
22. Lead appointment expires during fieldwork: further lead actions deny; handover preserves prior actions.
23. Specialist drops out: affected mandatory items block completion or become reasoned `NOT_INSPECTED` according to type policy.
24. Reviewer is unavailable: report escalates but inspector does not inherit issue authority.
25. Mine refuses entry: refusal is recorded/escalated, not converted into cancellation.
26. Conflict-of-interest recusal retains evidence and quarantines unissued conclusions.
27. Assignment change leaves earlier evidence signed by its actual captor.
28. Authority case transfer changes future closure eligibility without rewriting issuer provenance.

## 16. Prototype boundary

Prototype the full conceptual path with one internal safety inspection, one confirmed DGMS-style regulatory inspection, one received-notice flow, one third-party audit, and one follow-up. External authority data may be synthetic and clearly labelled. Do not simulate regulator authority by giving an operator account a regulator role.

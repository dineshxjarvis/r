# Strata — Applications, Clearances and Regulatory Cases Specification

## 1. Purpose and boundary

This specification owns `CAP-19` and the unified-portal application/case scope. Read it before changing approval discovery, application preparation, clearance tracking, deficiency/query exchange, hearings/consultations, decisions, renewals, amendments, appeals or external case synchronization.

The domain owns a governed service catalogue, applicant application, authority case, correspondence/rounds, milestones, decision mirror and resulting permission/clearance instrument reference. Documents own artifacts; reporting owns signed filing packages; workflow owns delivery; integrations own transport; obligations own post-decision duties; the legally competent authority owns the decision.

## 2. Unified front door without fake authority

Every effective `regulatory_service_version` declares one execution mode:

| Mode | Meaning |
|---|---|
| `NATIVE` | Strata is formally authorized to run the complete workflow and authoritative decision record |
| `FEDERATED_API` | Strata prepares/transmits/synchronizes; external authority system remains authoritative |
| `FEDERATED_REDIRECT` | Strata guides and deep-links; applicant acts in external portal and status is reconciled |
| `ASSISTED_MANUAL` | Strata prepares/tracks a governed manual/hybrid process with receipt evidence |
| `INFORMATION_ONLY` | Guidance/checklist only; no claim of submission or status synchronization |

Mode is set by legal/integration authority, not product ambition. A Ministry-of-Coal-owned service may become native through approved migration. EC/FC/WL, labour, DGMS, state pollution, groundwater and other authority services remain federated unless formally delegated.

## 3. Official service landscape

The Ministry of Coal describes SWCS as a gateway mapping clearances across central/state authorities, with live mining-plan, PRIMS, mine/seam-opening and exploration workflows and NSWS/PARIVESH integration. NSWS provides Know Your Approvals, application tracking, document reuse, renewal and query management. Because services, routes and legal requirements change, discovery and lifecycle are effective-dated.

Official references:

- [Ministry of Coal SWCS service and integration description](https://www.coal.gov.in/nominated-authority/single-window-system)
- [Ministry of Coal 2025–26 annual-report SWCS/NSWS integration summary](https://coal.gov.in/sites/default/files/2026-02/chap20AnnualReport2026en.pdf)
- [National Single Window System](https://www.nsws.gov.in/)
- [PARIVESH proposal tracking](https://cpc.parivesh.nic.in/)

Public material is informative; the responsible Ministry/authority must approve exact service applicability, forms, stages, timelines, fees and transitions.

## 4. Service catalogue and approval discovery

A service version defines:

- responsible/granting authority and participating offices;
- legal source, purpose, subject/project/mine/activity applicability;
- execution mode and authoritative system;
- prerequisite/dependency rules and parallel/sequence semantics;
- application schema, document/report requirements and reusable data mappings;
- applicant/signatory/representative authority;
- stages, milestone clocks, pause/resume rules and allowed actions;
- fees/payment-reference requirements without owning payment;
- submission/signature/channel/receipt profile;
- query, site visit, hearing/public consultation and response rules;
- decision types, validity, conditions, renewal/amendment/transfer/surrender/appeal routes;
- publication/privacy and external identifier/status mappings; and
- effective/transition policy.

Discovery produces an explained `approval_assessment`, not legal advice or an application. Each included/excluded/unknown service has rule/version, input facts, reason and confidence. Unknown facts remain `UNRESOLVED` and route to review. The assessment may be frozen into a project plan; later catalogue changes create impact, never silently rewrite filed cases.

## 5. Application, submission and authority case

```text
service discovered/selected → application draft → applicant team/representative
→ prerequisite and document readiness → validation/review → signer attestation
→ reporting-owned filing package → submission/receipt
→ authority case created or external case correlated
→ scrutiny/query/site visit/hearing/consultation rounds
→ recommendation/decision → issued instrument and conditions
→ renewal/amendment/transfer/surrender/appeal or post-decision compliance
```

An `application` is the applicant's governed proposal. A `regulatory_case` is the authority's processing context. In native mode, both exist with explicit ownership; in federated mode, case state is an external mirror with provenance/freshness. Receipt does not imply case admission; case admission does not imply approval.

Application states: `DRAFT`, `PREPARING`, `VALIDATION_FAILED`, `READY_FOR_REVIEW`, `READY_TO_SIGN`, `ATTESTED`, `READY_TO_SUBMIT`, `SUBMITTED`, `WITHDRAWN`, `SUPERSEDED`.

Case states are configured by service but normalize to: `NOT_CREATED`, `RECEIVED`, `ADMITTED`, `UNDER_SCRUTINY`, `IN_APPLICANT_RESPONSE`, `SITE_REVIEW`, `HEARING_OR_CONSULTATION`, `UNDER_DECISION`, `DECIDED`, `RETURNED`, `REJECTED`, `CLOSED`, `WITHDRAWN`, `UNKNOWN_EXTERNAL_STATE`. External raw status is always retained.

## 6. Participants, representation and authority

| Function | Responsibility |
|---|---|
| Project proponent/applicant organization | Owns application claims and response obligations |
| Authorized applicant representative | Prepares/submits within a current representation grant |
| Applicant subject-matter owner | Supplies/reviews land, environment, mining, safety or finance inputs |
| Nodal/coordinating officer | Tracks cross-service dependencies; cannot issue another authority's approval |
| Receiving/scrutiny officer | Admits/checks completeness under current assignment |
| Technical appraiser/committee member | Records review participation, conflicts and recommendation |
| Site/hearing/consultation officer | Records governed event and evidence |
| Competent decision authority | Signs/causes issuance under mandate/jurisdiction |
| Registry/dispatch officer | Issues/dispatches decision artifact; cannot change decision |
| Integration/reconciliation operator | Resolves external mismatches; cannot manufacture status |

Applicant and authority workspaces are separate projections. An applicant cannot see internal deliberative notes unless published/disclosed. An authority participant cannot act outside current case assignment/mandate. Committee membership, quorum, recusal and recommendation are case-specific records, not global roles.

## 7. Requirements, reusable data and documents

Each `application_requirement_instance` records definition/version, applicability, state, source, artifact/report/data reference, reviewer and reuse decision. Reuse means the same immutable artifact/data version is intentionally referenced; it is not copied or assumed current. Reused material is revalidated for service, subject, issue date, expiry, classification and consent.

Applicant fields bind to canonical organization/mine/person/GIS/reporting data where permitted. Manual assertions carry authority, reason and evidence. A later source change opens an impact item; it does not mutate submitted content.

Sensitive personal identifiers prohibited by a receiving portal are blocked/redacted per effective profile. Applicant draft visibility is limited to its team and authorized advisors; external authorities see only submitted/published content and their case records.

## 8. Queries, observations and response rounds

A regulator query/deficiency is an immutable authority-issued communication with items, source authority, issue time, response deadline and receipt. Items may request clarification, correction, data or documents. Applicant acknowledgement and substantive response are separate.

```text
query issued → delivered/acknowledged → response draft → validation/signature
→ response package submitted → receiver receipt → item accepted/returned/further query
```

Each round is numbered/versioned. Partial responses keep unresolved items open. Deadline extension records request, decision, authority and revised clock; it never overwrites the original due time. Duplicate/imported communications are correlated, not silently merged. Informal email/meeting statements become official only through a governed record/evidence route defined by service policy.

## 9. Site visits, meetings, hearings and public consultation

The service version enables required event kinds and participant rules. Each event has notice, schedule, venue/location, agenda, authority, attendance, conflict/recusal, submissions, minutes, evidence and outcome. Inspection owns inspection fieldwork when the event is an inspection; the case references its issued result. Public consultation/third-party submissions require publication/redaction and representation rules; this domain does not invent them universally.

Adjournment/reschedule retains prior notices and reasons. Absence does not auto-decide unless governing policy says so. A committee recommendation is not the competent authority's final decision.

## 10. Decision, instrument and conditions

A decision records exact case/input manifest, authority/quorum, outcome, reasons, conditions, effective date and signature/issuance evidence. Outcomes include `APPROVED`, `APPROVED_WITH_CONDITIONS`, `RETURNED`, `REJECTED`, `PARTIALLY_APPROVED`, `WITHDRAWN`, or service-specific mapped values.

The issued permission/clearance is an immutable `regulatory_instrument` linked to its authority-issued document and decision. Validity, capacity/scope, geometry, conditions, transferability and status are versioned. Document intelligence may propose conditions; authorized compliance review publishes obligations. Approval status alone does not auto-publish extracted obligations.

Federated mode stores a `decision_mirror` and source evidence; it does not pretend Strata issued the decision. Conflicting portal/document statuses create reconciliation.

## 11. Renewal, amendment, transfer, surrender, suspension and appeal

These are related cases, not status edits:

- renewal references the existing instrument and preserves original validity;
- amendment identifies exact requested scope and produces a new instrument/version if granted;
- transfer/change of proponent preserves old/new parties and effective authority decision;
- surrender/closure records request and authority confirmation separately;
- suspension/revocation is authority-issued and may trigger immediate downstream access/obligation impacts; and
- appeal/review is a separate case before the competent forum linked to challenged decision, grounds, stay and outcome.

An appeal does not suspend a decision unless a recorded stay/order says so. A portal's “approved” badge cannot erase later suspension/revocation.

## 12. Milestones, clocks and stuck cases

Every milestone has legal/service basis, start event, due target/SLA, pause/resume events, accountable post, current owner, external/internal classification and proof of completion. Dashboard duration distinguishes authority processing, applicant response and paused time. SLA breach is not automatically illegality.

No case may be stuck without a visible owner/recovery path. Vacant authority posts, unaccepted assignment, missing external state, overdue query response, integration outage and dependency block create explicit exceptions and escalation. Notifications do not change case state.

## 13. Failure and recovery

- Catalogue changes mid-draft: retain version and explicitly migrate or continue under transition policy.
- Service abolished/reassigned: prevent new use after effective date; preserve/migrate pending cases by approved transition.
- Portal timeout after submit: `OUTCOME_UNKNOWN`, reconcile before retry.
- External ID collision/mismatch: quarantine correlation; no merge by fuzzy name alone.
- Authority returns package: retain original, create response/correction round.
- Applicant representative expires: drafts remain; submit/sign denied until current authority.
- Case officer transfers: task re-resolves; previous actions remain attributed.
- Committee lacks quorum/conflict discovered: recommendation cannot finalize; record recusal/rehearing route.
- Decision document and portal disagree: show conflict and reconcile with authority; do not select latest blindly.
- External system unavailable: show last-known state/freshness and permitted manual fallback only.
- Decision revoked after downstream obligations/access: emit impact; consumers act under their policies.

## 14. Privacy, transparency and retention

Application drafts, trade/financial information, personal identifiers, restricted GIS, deliberative notes, public submissions and issued decisions have distinct classifications. External/public views expose only authorized published fields/artifacts. Authority access is purpose-logged; broad cross-tenant search does not follow from one case assignment.

Applicants can inspect their submitted content, communications, receipts and published decisions, and contest incorrect mirrors. Internal deliberation disclosure follows authority policy/law, not a product-wide rule. Full case/decision/signature/correspondence history follows statutory/records schedules and legal holds.

## 15. Capabilities

| Capability | Target |
|---|---|
| `regulatory.service.configure`, `regulatory.service.publish`, `regulatory.service.read` | service/version |
| `regulatory.assessment.run`, `regulatory.assessment.review` | project/assessment |
| `application.create`, `application.prepare`, `application.review`, `application.submit`, `application.withdraw` | application |
| `application.requirement.submit`, `application.requirement.review` | requirement instance |
| `regulatory.case.create_native`, `regulatory.case.register_external`, `regulatory.case.read` | case |
| `regulatory.case.assign`, `regulatory.case.admit`, `regulatory.case.transition` | case/stage |
| `regulatory.query.issue`, `regulatory.query.respond`, `regulatory.query.decide` | query/round |
| `regulatory.event.manage`, `regulatory.recommendation.record` | event/case |
| `regulatory.decision.record_native`, `regulatory.decision.mirror`, `regulatory.instrument.issue` | case/decision/instrument |
| `regulatory.case.reconcile`, `regulatory.case.correct_external` | external mirror/case |

## 16. Acceptance scenarios

1. Same project receives an explained applicable/unknown/not-applicable service assessment.
2. EC remains federated even while a formally migrated Ministry service is native.
3. Service abolition affects future applications without rewriting pending/history.
4. Applicant reuses a document only after service/scope/validity/privacy checks.
5. Submission receipt does not imply case admission or approval.
6. External timeout reconciles before retry.
7. Multi-item query accepts some responses while others remain open.
8. Officer transfer does not grant successor authority retroactively.
9. Committee recommendation with missing quorum cannot become final decision.
10. Portal “approved” and a later revocation document show conflict until reconciled.
11. Appeal does not suspend the original decision without a stay.
12. Approval conditions enter document/compliance review before obligation publication.

## 17. Non-goals

- Unilaterally replacing external ministries, state authorities, NSWS or PARIVESH.
- Treating KYA/approval discovery as legal advice or guaranteed completeness.
- One universal application lifecycle, checklist, fee, SLA or authority hierarchy.
- Payment processing, land-title adjudication or autonomous approval.
- AI issuing queries, recommendations or decisions without authorized human action.

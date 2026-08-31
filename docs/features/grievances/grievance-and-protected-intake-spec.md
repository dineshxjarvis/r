# Strata — Grievance, Complaint and Protected Intake Specification

## 1. Purpose and authority boundary

This specification owns `CAP-09` and PS §4.8: low-barrier intake, classification, routing, deadlines, complainant status, escalation and aggregate pattern visibility for workers, contractors and communities.

Strata is a unified front door and governed workbench. It does not silently replace CPGRAMS, an Internal/Local Committee under the POSH Act, CVC/PIDPI, an industrial-dispute forum, police/courts or another authority. Each effective case-type policy declares whether Strata is the authoritative case system, mirrors an external case, assists a handoff, or only supplies channel guidance.

Official design inputs:

- [DARPG comprehensive public-grievance guidance](https://darpg.gov.in/sites/default/files/2024-08-01.pdf) describes CPGRAMS as the common public platform, nodal/grievance officers, a 21-day target, interim reply, feedback and appeal.
- The [Ministry of Coal Public Grievance Cell](https://www.coal.gov.in/index.php/public-information/public-grievance-cell) describes Ministry, PSU, staff and public-grievance machinery and referral to concerned coal companies.
- [CIL public-grievance material](https://www.coal.gov.in/sites/default/files/2021-01/Section_Wise_06072023.pdf) describes CPGRAMS receipt, nodal/dealing officers, competent-authority approval and quality review.
- [India Code’s POSH Act record](https://www.indiacode.nic.in/handle/123456789/17057) identifies the special committee, inquiry and confidentiality regime.
- [CVC PIDPI handling material](https://portal.cvc.gov.in/content/documents/chp_pidpi_complaints.pdf) requires protected identity handling, designated-authority processing and attention to victimisation.

Published procedures are source inputs. Effective, legally reviewed policies—not hard-coded labels or durations—decide the applicable route.

## 2. Canonical distinctions

| Concept | Meaning | Owner |
|---|---|---|
| Intake | Immutable assertion received through any channel | Grievance |
| Grievance case | Governed redress lifecycle derived from one or more intakes | Grievance |
| Service request/query | Information or routine service need, not automatically a grievance | Owning service; grievance retains referral |
| Safety report | Hazard/event needing immediate safety response | Observation/incident, linked from intake |
| Allegation | Unverified assertion requiring protected assessment | Grievance/specialized authority |
| Finding | Authorized conclusion after inspection/investigation | Inspection/defect/specialized authority |
| Redress action | Action addressing the complainant’s issue | Grievance coordinates; action domain owns execution |
| Disposition | Reasoned case outcome | Authorized grievance/specialized authority |
| Feedback | Complainant’s response to disposition | Grievance |
| Appeal/review | Separate challenge to a disposition | Grievance or authoritative external channel |

Complaint content is not proof. “Anonymous” means Strata did not collect verified identity; it is not a promise that identity can never be inferred or lawfully obtained. “Protected” means identity is separated and available only under an approved purpose and break-glass policy.

## 3. Case-type and execution policy

An effective `grievance_case_type_version` defines audience, subject/category, applicability, authoritative system, execution mode, intake requirements, identity options, confidentiality class, routing policy, clocks, escalation, response/appeal rules, external channel and retention.

Execution modes are:

- `NATIVE`: Strata owns the case lifecycle under approved authority;
- `FEDERATED_API`: external system is authoritative; Strata submits and reconciles;
- `FEDERATED_REDIRECT`: user is handed to the official channel and may later link its reference;
- `ASSISTED_HANDOFF`: authorized staff record consented/manual delivery and proof; or
- `INFORMATION_ONLY`: Strata explains the route and stores no case content.

At minimum, policy must distinguish public grievance, employee/staff grievance, contractor/work-condition grievance, community/environment/land-related concern, consumer/service complaint, safety concern, corruption/vigilance disclosure, POSH matter, industrial dispute, emergency/crime and out-of-scope correspondence. Policy may route a category away from Strata before sensitive narrative is collected.

## 4. Intake channels and low-barrier access

Supported channels may include authenticated web, public web form, assisted kiosk/help desk, telephone/control-room transcription, email/letter scan, inspector/field-worker offline capture, CPGRAMS/external import and referral from inspection/incident/community engagement. A dedicated complainant/grievance-handler mobile experience is `TBD`.

Every attempt receives a receipt or safe handoff confirmation. Intake must support English/Hindi, accessibility, save/resume where identity permits, minimal required fields, safe-contact preference and “unsafe to contact” windows. An assisted-intake officer records that they transcribed—not authored—the assertion and reads it back or records why confirmation was impossible.

Emergency or imminent-harm content shows immediate physical/emergency channels and creates the safety handoff without waiting for ordinary triage. Lack of login, mine identifier, evidence, precise category or literacy cannot block a credible intake.

Bot/spam controls must not expose whether a named person/case exists or force vulnerable reporters to disclose excess identity.

## 5. Identity, contact and confidentiality

Identity modes are `IDENTIFIED_VERIFIED`, `IDENTIFIED_UNVERIFIED`, `PSEUDONYMOUS`, `ANONYMOUS` and `ASSISTED_WITHHELD`. Identity and safe-contact data live in a separately encrypted vault; operational cases use an opaque reporter reference.

Reporter visibility is independently classified as `STANDARD`, `RESTRICTED`, `PROTECTED` or `SPECIAL_REGIME`. The accused/subject, local manager, contractor and ordinary case handler never receive protected identity merely because they can act on the underlying issue. Disclosure requires an effective lawful basis, capability, purpose, reason, step-up authentication, independent approval where policy requires, and an immutable access receipt.

The user sees an honest warning before submission: what is collected, who can see it, official-channel consequences, contact risks and limits of anonymity. Contact messages use neutral text and do not reveal category or allegations on shared devices.

## 6. Intake, case and route lifecycles

```text
RECEIVED → SAFETY_SCREENED → TRIAGED → CASE_LINKED | REFERRED | REJECTED_WITH_REASON
```

Original intake is immutable. Corrections are additive statements. Similarity may suggest duplicates but a human links/splits them; repeated reports remain countable and traceable.

```text
OPEN → ACKNOWLEDGED → ASSIGNED → UNDER_EXAMINATION
     → ACTION_REQUIRED → RESPONSE_DRAFTED → QUALITY_REVIEW
     → DISPOSED → FEEDBACK_PENDING → CLOSED
                  └───────────────→ APPEALED/REOPENED
```

Special/external case types may expose only safe mapped states. `DISPOSED` means a reasoned outcome was issued; it does not mean accepted by complainant, corrective work verified, external authority accepted it or appeal exhausted.

## 7. Triage and routing

Triage determines case type/policy version, urgency, harm/safety signal, confidentiality, alleged subject, affected scope, authoritative channel, related records and apparent conflict. Automated classification may recommend only; it cannot disclose, reject, dispose, select an implicated handler or decide credibility.

Routing resolves current posts/appointments, mandate, jurisdiction, workload, language and conflict constraints. A person named in or reporting to the implicated chain cannot triage, investigate, quality-review or close where the policy declares a conflict. Vacancy, absence, non-acceptance or appointment expiry invokes a preconfigured alternate and escalates to the nodal/oversight route; clocks continue.

Transfers preserve the original receipt, clock, reason, from/to authority, accepted-at time and responsibility. A transfer is not completion. Misroute correction never makes the complainant refile.

## 8. Parallel safety, investigation and corrective work

A grievance may spawn/link:

- an incident/emergency for an occurred event or imminent response;
- an observation/defect for a hazardous condition;
- an inspection request/inspection for independent verification;
- a finding/CAPA after authorized conclusion;
- an environment, contractor, attendance, regulatory or service case; and
- a protected specialized-case reference with only permitted metadata.

These records retain independent lifecycles. A grievance may be disposed with a justified referral/interim outcome while long remediation continues only if policy permits and the response exposes the outstanding action safely. It must not claim the hazard or breach is corrected until the owning domain verifies it. Conversely, unresolved specialized confidential proceedings must not leak through grievance status.

## 9. Actions, responses, disposition and appeal

Redress actions have owner post, due rule/version, dependency, state, progress evidence and verification requirement. Case notes distinguish complainant-visible communication, internal analysis, legally privileged/restricted material and external correspondence.

A final response includes the understood issue, jurisdiction, action/examination performed, reasoned outcome, outstanding safe-to-disclose work, evidence/reference where permitted, disposition code, date, feedback route and appeal/review instructions. Generic “action taken” is not sufficient.

Quality review checks completeness, language, unsupported claims, confidentiality, linked-action truth and route compliance. The dealing officer cannot be sole quality reviewer when policy requires competent-authority/GRC approval. Appeal creates a new review record linked to the frozen disposition; it does not overwrite history. Reviewer independence and higher/alternate route come from policy.

## 10. Clocks, reminders and escalation

Each case materializes effective acknowledgement, initial-assessment, transfer-acceptance, interim-response, final-response and appeal clocks. Pause/extension grounds are explicit, bounded and visible where policy permits. Waiting on another department does not silently stop time.

Escalation targets the accountable post and then configured nodal/appellate/oversight posts. Notification delivery failure does not satisfy escalation. Dashboards distinguish overdue acknowledgement, unaccepted transfer, inactive handler, response overdue, appeal overdue and redress action overdue.

## 11. Reporter status and communications

Receipt access uses authenticated account or a high-entropy reference plus separately delivered secret/OTP. Public status never reveals reporter identity, accused person, handler identity, exact sensitive location, attachments or special-regime category.

Status events are projection-policy based: received, routed safely, under examination, information requested, interim reply, disposed, feedback/appeal available and closed. Requests for information are versioned, scoped and accessible; partial responses do not erase outstanding questions. Failure of a contact channel retains the message and attempts and invokes safe alternate policy.

## 12. Retaliation, safeguarding and special regimes

A reporter may raise a separate victimisation/retaliation concern linked through a protected reference. It receives independent ownership, urgency assessment, protective-action tracking and oversight; it is never assigned solely to the alleged retaliator’s chain. Employment/contract/access changes correlated by analytics are review signals, not automatic accusations.

POSH, PIDPI/vigilance, child/vulnerable-person, imminent crime and other specialized regimes use dedicated policy, authority, projections and retention. General dashboards show at most approved aggregates. General handlers receive a safe handoff state, not narrative or identities. Strata must not advertise PIDPI/POSH compliance until the competent owner approves the exact channel and workflow.

## 13. Authorization capabilities

| Capability | Target |
|---|---|
| `grievance.intake.submit`, `grievance.intake.assist`, `grievance.intake.protected` | channel/scope |
| `grievance.triage`, `grievance.route`, `grievance.transfer.accept` | intake/case |
| `grievance.read_operational`, `grievance.read_sensitive`, `grievance.read_reporter_identity` | case/projection/vault reference |
| `grievance.case.assign`, `grievance.case.examine` | case |
| `grievance.action.assign`, `grievance.action.update`, `grievance.action.verify` | action |
| `grievance.response.prepare`, `grievance.response.review`, `grievance.dispose` | case/disposition |
| `grievance.feedback.submit`, `grievance.appeal.submit`, `grievance.appeal.decide` | disposition/appeal |
| `grievance.retaliation.report`, `grievance.safeguard.manage` | protected concern |
| `grievance.external.reconcile` | external reference/mirror |
| `grievance.policy.configure`, `grievance.policy.publish`, `grievance.audit` | policy/authorized scope |

Case access never implies reporter-identity access. Identity access never implies disposition authority. Configuration, operational handling, quality review, appeal and audit are separable.

## 14. Privacy, records and analytics

Narrative, identity/contact, allegations, subject identity, attachments, internal notes, special-regime references and public metrics have separate classifications. Exact retention, legal holds, erasure/anonymization and archival are effective policy; original evidentiary assertions are not silently edited.

Aggregate dashboards use minimum cohort thresholds, suppression, controlled dimensions and no free-text snippets. Repeat-pattern detection clusters issues, sites, assets, contractors or processes only within authorized data and exposes provenance/confidence. It must not rank complainants, infer credibility, expose small groups or automatically punish a person/contractor.

Search indexes only approved projections. Protected identity/narrative is excluded by default; deletion/reclassification uses the search tombstone contract.

## 15. Degraded operation and abuse controls

Paper, telephone, kiosk and external statutory routes continue when Strata is unavailable. On recovery, authorized staff reconcile the original received time, channel proof and uncertainty; they do not backdate system receipt. Offline clients cannot reveal prior protected cases or cache protected identities.

Rate limits, malware scanning, attachment quarantine, content warnings and staff safety controls apply. Threatening/abusive content may be restricted, but a legitimate issue within it is still triaged. Duplicate, malicious or out-of-scope disposition requires reason and review; it never deletes the intake or labels a complainant globally.

## 16. Closure gates and acceptance scenarios

A case closes only when route/jurisdiction is resolved, required actions have a lawful state, a reviewed disposition is delivered or approved delivery failure is handled, feedback/appeal window is represented, protected links remain protected and all external references are reconciled to the permitted extent.

The implementation must prove:

1. anonymous worker safety report triggers immediate safety work without identity;
2. contractor reports employer retaliation and the employer cannot view or own it;
3. POSH text is stopped before general routing and handed to the approved committee channel;
4. CPGRAMS duplicate import links without double disposal or clock loss;
5. implicated Mine Manager is excluded and alternate route accepts within clock;
6. transfer is unaccepted/handler leaves and vacancy escalation preserves ownership;
7. complainant loses phone, recovers safely and no case facts leak through lookup;
8. defect remains open after grievance response without falsely claiming correction;
9. appeal freezes original disposition and uses an independent route;
10. dashboards suppress small protected cohorts and search reveals no protected terms; and
11. outage intake reconciles original receipt/acknowledgement evidence without backdating.

## 17. Non-goals and production dependencies

This wave does not certify a POSH/PIDPI/industrial-dispute workflow, replace CPGRAMS, decide criminality, adjudicate employment rights, or define every operator’s grievance hierarchy. Ministry/operator legal, vigilance, HR/industrial-relations, POSH, privacy and records owners must publish the effective case-type catalogue, authoritative channels, appointments, clocks, disclosure rules and retention. Wave 12 owns live adapters; Waves 14/15 own localized/accessibility testing and executable security/NFR controls.

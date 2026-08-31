# Strata — Cross-Role Accountability and Flow Audit

> **Status:** temporary adversarial audit; findings are not canonical product authority.
> **Reviewed on:** 2026-08-30.
> **Verdict:** `FAIL — REMEDIATION REQUIRED`.
>
> Use this document to decide repairs. Move accepted resolutions into canonical feature,
> identity, data, decision and API documents, then retire or archive this audit.

## A. Outcome and boundary

The required outcome is not “every user has a role.” It is:

> For every mine activity, Strata can prove which human acted, through which organisation
> and concrete appointment, under which mandate and jurisdiction, on which resource, at
> what time; who remained operationally and legally accountable; who received the handoff;
> and how the chain recovered when a person, post, device, network or authority failed.

This pass covers people and authority across attendance, inspections, field work,
incidents, corrective action, environment, production, contractor work, reporting and
platform administration. It tests internal, contractor, third-party, Ministry and external
regulatory actors. It does not decide the legal effect of draft legislation.

### Evidence status

- **Confirmed current:** an official source describes the currently operating body or
  states that an instrument has commenced.
- **Published transition/draft:** useful for future-proofing, but not treated as settled
  production authority until the final instrument and commencement are verified.
- **Design inference:** a Strata control derived from the real workflow; not a claim that
  the named post exists in legislation.

The legal baseline is itself a blocking gap. DGMS says the OSH&WC Code, 2020 came into
force on 21 November 2025 and subsumed the Mines Act, 1952. DGMS also lists the 2026 coal
mine regulations as **draft**. Therefore existing Strata claims based solely on the Mines
Act/CMR 2017 must be validated against the commenced Code, final rules, saved/transitional
provisions and the eventual final coal regulations. Sources: [DGMS OSH&WC awareness
bulletin](https://www.dgms.gov.in/writereaddata/UploadFile/dgms_bulletin_07012026.pdf),
[DGMS Gazette notifications](https://www.dgms.gov.in/UserView/index?mid=1655),
[published draft coal regulations](https://www.labour.gov.in/static/uploads/2026/02/d51db283b0fe4f322348f7232a8e221c.pdf).

## B. Real-world actor and accountability map

### B.1 Never use one flat role list

One person can simultaneously be an employee, hold a statutory mine post, serve on an
internal inspection team and participate as the lead in one inspection. Those are four
different relationships:

```text
person
  → principal/session                    who authenticated
  → affiliation                          relationship to an organisation
  → post + time-bounded appointment      position held
  → mandate                              legal/administrative purpose
  → jurisdiction                         resources/geography covered
  → case/inspection assignment           job in this particular activity
  → capability decision                  verb allowed on this target now
```

A cookie proves only the principal. “Inspector,” “manager,” “worker,” “regulator,” a
selected mine, an email domain, a uniform or an RFID tag proves none of the remaining
links.

### B.2 Role families the system must distinguish

| Family | Examples | What Strata must represent |
|---|---|---|
| Work subject | direct worker, contractor worker, apprentice/trainee, visitor, driver, consultant, rescue member | Person identity, employer/affiliation, engagement, eligibility, shift/work package and presence; a login is optional |
| Front-line supervision | face/section/shift official, overman, sirdar, mate, competent person, contractor supervisor | Concrete appointment or governed duty assignment, crew/work area, shift interval and handover |
| Mine statutory/operating authority | owner, agent, manager, acting manager, assistant manager, safety officer, ventilation/survey/electrical/mechanical posts | Appointment instrument, qualification where required, mine scope, validity, duties and substitute route |
| Attendance and access operation | register keeper, attendance clerk, gate/checkpoint operator, lamp-room attendant, mine-side roster validator, muster operator | Observation/custody function only; device administration, record correction and legal attestation remain separate |
| Worker representation | Workmen's Inspector, safety committee member, union/worker representative | Representative appointment/nomination and inspection/complaint access; never confused with DGMS authority |
| Internal assurance | Safety Officer, Pit Safety Committee member, internal safety organisation, inter-unit/inter-area audit team, check auditor | Scheme/cadence, commissioning body, team assignment, independence, report issuer and internal closure policy |
| External mine-safety authority | DGMS Chief/Regional Inspector-cum-Facilitator and mining, electrical, mechanical, occupational-health or other specialist officers | DGMS authority, zone/region/unit, actual post/appointment, specialist mandate, notified jurisdiction and case assignment |
| Environmental authority | MoEFCC Regional Office head, assigned RO official/scientist, CPCB/SPCB authorised officer or laboratory role | Separate authority and unit, EC/consent-specific mandate, project/mine jurisdiction and authority-specific review/issue flow |
| Coal/production authority | Ministry of Coal portfolio official, Coal Controller/field-office official | Separate Ministry/CCO organisations and mandates for production, quality, conservation, statistics or permission functions |
| Labour/social-security authority | applicable central/state labour Inspector-cum-Facilitator, CMPFO official | Instrument-specific mandate and establishment/jurisdiction; not inherited from mine-safety access |
| Third-party assurance | accredited laboratory sampler/analyst, ISO auditor, insurer, consultant, technical expert | Engagement/accreditation scope, allowed evidence/report actions, expiry and commissioning organisation |
| Platform operation | identity registrar, appointment registrar, policy publisher, integration operator, device administrator, security/audit reviewer, support agent | Technical capabilities with no automatic business, statutory, inspection, correction or closure authority |

DGMS is a Ministry of Labour & Employment mine-safety regulator with headquarters,
specialist disciplines, eight zones and multiple regions; its published jurisdiction is
geographic and changes over time. “External inspector” is therefore unusable as an
authorization identity. Sources: [DGMS role and organisation](https://www.dgms.gov.in/UserView?LangID=1&mid=1261),
[DGMS organisation structure](https://dgms.gov.in/writereaddata/Content/Organisation_Structure_DGMS.pdf),
[DGMS zone/region jurisdiction instruction](https://dgms.gov.in/writereaddata/UploadFile/DGInstruction2_2023.pdf).

The Coal Controller's Organisation is a separate Ministry of Coal subordinate office with
its own statutory functions and field offices. It is not a DGMS unit and its officials must
not receive mine-safety powers through a generic regulator role. Source: [Ministry of Coal —
agencies under the Ministry](https://www.coal.gov.in/index.php/about-us/agencies-under-ministry).

### B.3 Who owns attendance at the end of the day?

The answer has layers, not one new “Attendance Manager”:

| Question | Responsible actor | Boundary |
|---|---|---|
| Who presents identity/presence? | Worker or other entrant | Cannot approve the resulting record |
| Who supplies a contractor crew roster? | Contractor's authorised supervisor/representative | Source for its workforce, not final mine acceptance |
| Who validates that the person may work at this mine/shift? | Mine-side roster/shift authority under local appointment policy | Uses engagement, training, medical and work-order eligibility |
| Who keeps the attendance record and reports missing officials? | Attendance Clerk/register keeper | Operational custodian; does not become mine manager or payroll owner |
| Who supervises the crew during the shift? | Concrete official in charge of that shift/section | “Shift official” must resolve to an actual appointed post |
| Who handles critical exceptions and assures the mine system? | Mine Manager, with recorded acting arrangement if absent | Operationally accountable at mine level |
| Who must provide resources and remains higher-level accountable? | Owner and agent under the applicable instrument | Appointment of a manager does not erase their duties |
| Who turns approved attendance into wages/billing? | Payroll/contract administration | Consumer only; cannot rewrite presence evidence |
| Who accounts for people in an emergency? | Incident commander plus appointed muster/rescue functions | Muster is a safety projection, not attendance correction |

The published 2026 draft coal regulations explicitly retain an Attendance Clerk and say
the clerk remains at the attendance cabin/outlet, prevents unauthorised entry and reports
an unrecorded official/competent person to the manager, assistant manager or official in
charge of the shift. This supports the operating design but remains **draft evidence** until
the final instrument is verified. The commenced Code places duties on owner, agent,
manager and supervisory officials; the final production responsibility matrix needs legal
review against current saved/final provisions. Source: [published draft coal regulations,
regulation 53](https://www.labour.gov.in/static/uploads/2026/02/dde0e6667243665c258b52d2c36db66a.pdf).

### B.4 “Inspector” must mean two different things in two places

1. **Appointment identity:** who gives the person authority in the real world. Example:
   `DGMS → Central Zone → Dhanbad Region 2 → concrete DDMS/Director post → appointment`.
2. **Inspection participation:** what the person does in one team. Example: `LEAD`,
   `FIELD_EXAMINER`, `TECHNICAL_EXPERT`, `OBSERVER`, `MINE_REPRESENTATIVE`.

The participation label never grants authority. A DGMS electrical specialist and a MoEFCC
RO scientist can both be field examiners, but their organisations, mandates, jurisdictions,
records and closure powers remain different. A Workmen's Inspector may inspect on behalf
of workers but is neither an external regulator nor automatically the lead of an operator
audit. DGMS material confirms distinct mining, electrical and mechanical Workmen's
Inspector categories and their worker-representative purpose. Source: [DGMS compiled
circulars — Workmen's Inspector orientation](https://www.dgms.gov.in/writereaddata/UploadFile/CIRCULARSNew_19092025.pdf).

## C. Authoritative records and ownership

| Record | Authoritative owner | Must snapshot |
|---|---|---|
| Human identity | Identity domain | Person linkage and proofing provenance; no role |
| Affiliation | Identity/organisation domain | Employer/authority/contractor relationship and effective interval |
| Post and appointment | Identity-authority domain | Organisation/unit, concrete post, appointment instrument, mode and validity |
| Mandate and jurisdiction | Identity-authority domain | Instrument, capability family, selector, effective time and supersession |
| Shift duty assignment | Workforce/attendance domain | Actual post, mine/section, crew, shift and relieving handover |
| Inspection assignment version | Inspection domain | Lead/support/specialists, eligibility checks, acceptances and authoriser |
| Visit attendance | Inspection domain | Who actually attended and interval; invitation is not attendance |
| Presence event | Attendance domain | Sensor/witness observation, identity binding, source confidence and time |
| Inspection evidence | Evidence domain | Capturer and authority context; report ownership remains with inspection |
| Issued inspection report | Inspection domain | Issuer authority/unit, approving and signing appointments, immutable version |
| Finding | Defect/finding domain | Issuing provenance and stored closure policy |
| CAPA | CAPA domain | Action owner, verifier, deadlines, evidence and separation checks |

No team member, affiliation, post or jurisdiction may be copied into a domain as mutable
text. Legal acts retain immutable references/snapshots so a transfer tomorrow does not
rewrite who was empowered yesterday.

## D. Lifecycle and handoff trace

### D.1 Attendance and shift chain

```text
HR/contractor affiliation + engagement + qualifications
  → contractor/direct-workforce roster submission
  → mine-side eligibility validation
  → concrete shift/section official assignment
  → credential issue and entry observations
  → attendance clerk monitors exceptions
  → shift official receives and acts on operational exceptions
  → exit/surface-return/lamp-return reconciliation
  → independent correction review where needed
  → manager/authorised statutory attestation
  → immutable export to payroll, billing and safety reporting
```

A roster upload is not mine acceptance; a reader event is not eligibility; an exit without
a belowground return is not safety; a payroll export is not a statutory register.

### D.2 Internal inspection chain

```text
versioned internal scheme/cadence or risk trigger
  → accountable internal commissioning post/body
  → planner creates assignment version
  → eligible lead and required disciplines accept
  → mine/section contact acknowledges logistics
  → visits and evidence
  → report authoring
  → independent review under scheme policy
  → internal issuer signs/issues
  → mine response and CAPA
  → independent verification or check audit
  → internal closure owner under stored policy
```

“Internal” is not one inspection type. A Safety Officer's routine inspection, Workmen's
Inspector report, Pit Safety Committee inspection, inter-area audit and check audit have
different commissioning bodies, independence expectations and recipients.

### D.3 DGMS/external mine-safety chain

```text
authority programme, complaint, event or empowered officer trigger
  → authority intake/planning under current jurisdiction
  → authority assignment (lead + assistants/specialists)
  → notice or unannounced visit as applicable
  → operator facility/contact handoff without control of regulator team
  → field acts under each officer's own authority
  → authority review/issue route
  → operator acknowledgement/response
  → CAPA/evidence
  → authority-authorised verification/follow-up
  → closure, continuation or enforcement under stored authority policy
```

An operator may register a received notice, but cannot manufacture a DGMS inspection,
appoint a DGMS officer, confirm jurisdiction, issue the report or close its findings.

### D.4 MoEFCC CCR chain proves workflows cannot be universal

The official CCR procedure uses project-proponent submission, receipt by the Regional
Office head, forwarding to an RO official, site visit/report generation, approval by the RO
head, return-to-official, and e-sign/publication by the RO official. Strata's generic
“lead → reviewer → issuer” can represent this only if the inspection type carries a
versioned stage policy and distinct assignment/review/signing posts. Source: [MoEFCC CCR
SOP, especially pp. 24–47](https://parivesh.nic.in/publicdocument/UPLOAD_OM_NOTIFICATION/IA_DOCS/1002_25012026043343.pdf).

### D.5 Joint and multi-authority visit

A shared visit does not create a shared legal authority:

```text
joint visit container
  ├─ DGMS authority workstream → DGMS observations/report/findings/closure
  ├─ SPCB authority workstream → consent/pollution records and its issue route
  ├─ MoEFCC workstream         → EC monitoring/CCR route
  └─ operator internal stream → internal observations and CAPA
```

Evidence may be referenced across workstreams when disclosure permits. Conclusions,
signatures, mandates and closure policies may not be merged into “joint regulator.”

## E. Physical, device and offline model

| Break | Safe visible state | Recovery owner |
|---|---|---|
| Worker has no phone/account | Assisted capture against person and witnessed identity; never create a shared login | Attendance Clerk/authorised field assistant |
| RFID lent or swapped | Conflicted credential; retain events; require independent identity resolution | Attendance Clerk + shift authority |
| Biometric no-match | No false absence; fallback observation and exception | Attendance Clerk under mine policy |
| Reader offline or clock wrong | Coverage gap/uncertain time, not inferred presence | Device operator repairs; attendance owner reconciles people |
| Underground network absent | Locally durable signed events; no legal issue/closure offline | Capturer syncs; domain owner reconciles |
| Shared device | Per-action user re-authentication/quick switch and device provenance | Device custodian + each actor |
| Inspector arrives unannounced | Verify credentials/authority through approved fallback; record arrival/refusal separately | Mine contact and issuing authority liaison |
| Team member offline | Their records remain theirs; another member cannot use their authority | Assignment owner after sync/handover |
| Emergency interrupts inspection | Preserve inspection state, activate incident/muster command, formally suspend visit | Incident commander and inspection lead |

## F. Authority and separation-of-duties matrix

| Action | Performer | Approver/issuer | Forbidden shortcut |
|---|---|---|---|
| Create internal inspection | Eligible internal planner/initiator | Scheme policy | Job title string in client request |
| Create confirmed regulatory inspection | Authority intake/empowered officer | Authority policy | Operator selecting “regulatory” |
| Assign team | Concrete assignment authority | Acceptance by each required member | Adding participants grants power |
| Conduct fieldwork | Each participant under own authority | Lead coordinates only | Lead's mandate covering everybody |
| Submit contractor roster | Contractor representative | Mine-side validator | Contractor self-acceptance |
| Record attendance fallback | Attendance Clerk/authorised recorder | Material correction reviewer | Device admin fabricating presence |
| Attest attendance register | Policy-authorised statutory post | Signature/assurance policy | Payroll attestation |
| Propose finding | Field examiner/author | Reviewer under origin policy | Observation auto-becoming breach |
| Issue regulatory finding/report | Issuing-authority appointment | Required review/signature route | Mine Manager or platform admin |
| Perform CAPA | Named action owner/team | Separate verifier | Same person through two accounts |
| Close authority-issued finding | Stored issuing-authority closure route | Current eligible appointment | Generic regulator or operator closure |
| Change role/mandate/jurisdiction | Appointment/authority registrar under source instrument | Four-eyes/high-risk approval | Tenant admin self-granting authority |

Separation must compare the underlying person, not principal IDs. Delegation of inbox
receipt does not delegate inspection, signing, verification or closure authority.

## G. Failure, abuse and recovery scenarios

1. **Post vacant:** route work to the next eligible post, but block protected action until a
   lawful acting/additional-charge appointment exists.
2. **Manager absent:** record written acting authority, qualification, interval and required
   notice. Never let an emergency dropdown mint authority. Published 2026 draft limits are
   design input only until the final instrument is verified.
3. **Multiple holders:** allow only for a multi-holder post. Many inspectors means many
   concrete appointments, not users sharing one post.
4. **Additional charge:** every act resolves the supporting appointment; conflicts and
   workload remain visible.
5. **Transfer at noon:** earlier acts retain old provenance; later acts deny or use the
   successor.
6. **Conflict mid-inspection:** recuse; quarantine unissued conclusions for independent
   review; retain raw evidence.
7. **Lead disappears/offline:** pause legal completion; safety response takes precedence;
   an eligible replacement accepts a scoped handover.
8. **Specialist missing:** affected items are `NOT_INSPECTED`, never silently compliant.
9. **Mine refuses access:** record refusal and evidence; authority decides escalation. Do
   not convert refusal into cancellation.
10. **Mine representative absent:** record no-show; authority policy decides whether work
    proceeds.
11. **External authority has no account:** register an unconfirmed received mirror; only a
    verified authority claim confirms provenance.
12. **Joint authorities disagree:** issue parallel conclusions; one authority cannot close
    another's finding.
13. **Contractor swaps crew:** roster becomes stale; revalidate. RFID cannot cure expired
    engagement, training or medical eligibility.
14. **Duplicate person:** quarantine; do not automatically merge attendance, medical, wage
    or incident histories.
15. **Credential sharing:** detect impossible sequences and investigate; audit alone does
    not prevent harm.
16. **Cross-midnight/re-entry:** preserve multiple entry/return pairs and operational-day
    rules.
17. **Attendance Clerk absent:** require named relief/additional charge and handover of open
    exceptions; a reader cannot substitute for the clerk.
18. **Supervisor suppresses worker report:** protected intake bypasses implicated chain and
    restricts retaliatory access.
19. **Reviewer leaves:** keep work pending and visible; successor uses their own appointment
    without rewriting authorship.
20. **Platform admin impersonates business authority:** deny; support cannot inspect,
    attest, issue or close.
21. **Law/jurisdiction changes:** effective-dated versions decide new acts; old acts remain
    reconstructable.

## H. Upstream and downstream impacts

- Attendance feeds muster, but stale/unknown presence stays uncertainty.
- Contractor affiliation, engagement, medical/training eligibility and work package are
  prerequisites; attendance cannot repair missing eligibility.
- Inspection authority provenance flows into reports, findings, CAPA and closure. Losing
  it makes downstream enforcement unauthorised.
- Production/environment facts may be inspected by different authorities; read access
  does not imply issue or correction authority.
- Dashboards label origin, authority, publication state, freshness and coverage.
- Search/GIS scope is clipped to source-domain authority; an index or map never broadens
  jurisdiction.
- AI may prioritize or flag; it cannot create appointments, confirm breaches, approve
  attendance, issue reports or close findings.

## I. Gap register

| ID | Class | Claim and failure consequence | Required fix and canonical destination | Owner | Status |
|---|---|---|---|---|---|
| ROLE-GAP-001 | REQ | Legal rationale cites the Mines Act/CMR 2017 as current despite 2025 OSH&WC commencement | Commission current-law transition review; version instruments and saved provisions in context, attendance, inspection and obligation docs | Legal/domain owner | `OPEN-BLOCKING` |
| ROLE-GAP-002 | AUTH | No governed seed/catalogue contract defines authorities, units and mandates | Add effective-dated catalogue governance/import provenance to identity model/spec/API | Identity + legal owners | `OPEN` |
| ROLE-GAP-003 | AUTH | Appointment source exists, but issuer eligibility, qualification validation and government verification are incomplete | Define appointment proofing, registrar/reviewer separation, revalidation and revocation | Identity governance | `OPEN` |
| ROLE-GAP-004 | VOC | `INSPECTOR` remains a participation role and broad UI persona, inviting authority confusion | Rename/display as `FIELD_EXAMINER` or mechanically enforce participation-only semantics; always show authority/unit/post/mandate | Inspection + UX owners | `OPEN` |
| ROLE-GAP-005 | SCOPE | Workmen's Inspector is absent and can be confused with DGMS/internal management | Add worker-representative appointment and bounded participation/access | Safety + identity owners | `OPEN` |
| ROLE-GAP-006 | SCOPE | “Field worker” collapses people with different eligibility/privacy | Add worker/entrant relationship taxonomy and persona projections without role enums | Workforce + UX owners | `OPEN` |
| ROLE-GAP-007 | OWN | Attendance understates owner/agent accountability | Correct layered accountability after legal review; do not invent Attendance Manager | Attendance + legal owners | `OPEN-BLOCKING` |
| ROLE-GAP-008 | AUTH | “Official in charge of shift” is prose, not a canonical duty assignment | Add effective shift/section duty assignment linked to a qualified appointment | Attendance + identity owners | `OPEN` |
| ROLE-GAP-009 | FLOW | Clerk relief, multiple outlets and open-exception handover are absent | Model coverage per outlet/shift, relief acceptance and uncovered-window alarms | Attendance owner | `OPEN` |
| ROLE-GAP-010 | FLOW | Internal inspections collapse schemes with different bodies/cadences/independence | Add versioned internal schemes and governance-body/team assignments | Inspection + safety owners | `OPEN` |
| ROLE-GAP-011 | AUTH | Joint multi-authority visits lack issuer boundaries | Add joint container with separate authority workstreams/reports/findings/closure | Inspection owner | `OPEN` |
| ROLE-GAP-012 | FLOW | Authority stages are prose, not versioned executable policy | Add stage versions, eligible-post rules, query loops and signature requirements | Inspection + workflow owners | `OPEN` |
| ROLE-GAP-013 | FLOW | Received-notice confirmation lacks identity-proofing and disputed-claim flow | Define verified onboarding, claim challenge and duplicate matching | Identity + inspection owners | `OPEN` |
| ROLE-GAP-014 | DATA | Invitation/acceptance can be mistaken for visit attendance | Require per-visit arrival/departure evidence and no-show state | Inspection owner | `OPEN` |
| ROLE-GAP-015 | AUTH | Separation can be bypassed through two principals/concurrent posts | Compare underlying person and conflict policy on consequential actions | Authorization owner | `OPEN` |
| ROLE-GAP-016 | FLOW | Subcontractor/principal-contractor accountability is ambiguous | Model subcontract chain and named management/control persons | Contractor owner | `OPEN` |
| ROLE-GAP-017 | SCOPE | Visitors, drivers, government teams and rescue personnel may be absent from roster/muster | Add entrant categories, sponsor/escort, temporary access and muster inclusion | Attendance + incident owners | `OPEN` |
| ROLE-GAP-018 | OPERABILITY | Responsibility route vacancy/acknowledgement/health is not proven | Add route health, vacancy alarms, drills and accountable route owner | Workflow + identity owners | `OPEN` |
| ROLE-GAP-019 | AUTH | Technical administrators can become de facto superusers | Add negative capability matrix and privileged-access tests | Security owner | `OPEN` |
| ROLE-GAP-020 | FLOW | No cross-domain matrix says who finally closes, attests, accepts or receives | Add terminal-outcome authority matrix to capability map and feature specs | Product + domain owners | `OPEN` |
| ROLE-GAP-021 | OPERABILITY | No recurring legal/authority catalogue revalidation process | Define effective-dated update, dual control, impact preview and replay | Legal + identity operations | `OPEN` |
| ROLE-GAP-022 | DATA | Legacy data model still contains implementable-looking `INSPECTOR`, `person_type` and region SQL | Quarantine superseded SQL and add forbidden-term checks for canonical contracts | Architecture owner | `OPEN` |

## J. Decisions requiring human approval

1. Who reviews the current instruments/saved provisions governing coal-mine attendance and
   inspections after 21 November 2025?
2. Should inspection participation become `FIELD_EXAMINER`, or remain `INSPECTOR` with a
   mechanically enforced non-authority contract?
3. Which authorities are phase-one integrations versus catalogue-only/received-notice
   support: DGMS, MoEFCC, CPCB/SPCB, CCO, labour, state mining and district bodies?
4. Which internal inspection schemes ship first, and who owns each at mine, area,
   subsidiary and corporate level?
5. Are Workmen's Inspectors first-production personas or assisted/no-login participants?
6. Which post may attest attendance under the confirmed current instrument, and which
   corrections require higher or independent review?

## K. Canonical documents that must change

| Priority | Documents | Required resolution |
|---|---|---|
| P0 | context, attendance and inspection specs | Correct legal baseline; distinguish confirmed and transitional provisions |
| P0 | identity model, foundation model and identity governance | Catalogue governance, appointment proofing, qualification and person-level separation |
| P0 | attendance spec/model/API | Shift duty, clerk coverage/relief, layered accountability and non-worker entrants |
| P0 | inspection spec/model/API | Inspector classification, worker representation, internal schemes, joint workstreams and stage versions |
| P1 | contractor spec/model/API | Subcontracting and named management/control chain |
| P1 | incident spec/model/API | Visitor/external-team/rescue muster and implicated-command bypass |
| P1 | capability map, dashboard, search and UX | Terminal-owner matrix and authority-labelled projections |
| P1 | legacy data model/repository checks | Remove implementable legacy authority from build path |

## L. Exit verdict

`FAIL — REMEDIATION REQUIRED`.

The architectural direction—person, affiliation, post, appointment, mandate,
jurisdiction and participation as separate concepts—is correct. The system still breaks at
current-law transition, authority catalogue trust, actual shift duty, clerk relief, worker
representation, internal inspection schemes, joint authorities, external identity proofing,
non-account entrants and final outcome ownership.

Exit requires every gap to be resolved canonically, accepted as a named risk with owner
and date, or blocked by an explicit external decision. Tests must prove absence, transfer,
conflict, offline operation, joint authority, contractor substitution and legal-version
change.

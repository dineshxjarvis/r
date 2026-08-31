# Strata — Production Design Tracker

## 1. Purpose and operating rule

This is the temporary control document for the production-design programme. Read and update it at the start and end of every wave. It tracks coverage, dependencies, conflicts, unresolved decisions, and evidence of completion; it does not replace the canonical requirement, decision, feature, architecture, data-model, or API documents.

Prototype scope is deliberately excluded from prioritisation here. A production capability is designed completely first; implementation slicing happens elsewhere.

### Status vocabulary

| Status | Meaning |
|---|---|
| `NOT_STARTED` | No active design work |
| `DISCOVERY` | Sources, actors and boundaries being gathered |
| `GRILLING` | Material choices and edge cases under review |
| `DRAFTING` | Canonical documents being written |
| `CONFLICT_REVIEW` | Cross-document and cross-domain validation underway |
| `BLOCKED` | Cannot continue without a named decision/dependency |
| `COMPLETE` | Exit gate passed and all findings resolved/deferred explicitly |

`COMPLETE` means design-complete, not implemented.

## 2. Mandatory workflow for every wave

### Entry gate

Before drafting:

1. Run the pre-design pass from [`whole-system-gap-audit-prompt.md`](whole-system-gap-audit-prompt.md).
2. Name the requirement sections and success criteria served.
3. Read every canonical dependency and adjacent domain.
4. Search all docs for the proposed vocabulary and overlapping ownership.
5. List actors, authorities, source systems, records and outputs.
6. Record inherited open conflicts from §6.
7. Confirm the domain boundary and explicitly excluded responsibilities.

Entry is complete only when every relevant requirement has a proposed owner and every overlapping canonical document is listed in the wave row.

### Design gate

Every wave must define:

- terminology and domain boundary;
- actors, authority and separation of duties;
- creation/intake paths;
- lifecycle/state transitions;
- ownership and responsibility routing;
- relational model and constraints;
- API/resource ownership;
- events, audit and side effects;
- documents/evidence and provenance;
- offline/concurrency/idempotency behaviour where relevant;
- integration and reconciliation behaviour;
- privacy, classification, retention and legal hold;
- search, dashboards and statutory outputs;
- failure, recovery, cancellation, correction and appeal;
- edge-case tests; and
- explicit non-goals.

### Conflict gate

Before marking a wave complete, run the adversarial post-design pass from [`whole-system-gap-audit-prompt.md`](whole-system-gap-audit-prompt.md) and test all seven cross-document conflict classes:

| Class | Question |
|---|---|
| `REQ` | Does the design contradict or omit the official problem statement/approved PRD? |
| `OWN` | Do two domains claim the same source of truth, state transition or endpoint? |
| `VOC` | Does one concept have competing names or one name mean different things? |
| `AUTH` | Can one document grant an action another denies, or bypass mandate/jurisdiction/separation? |
| `DATA` | Do cardinality, tenant, temporal, identifier, provenance or deletion rules disagree? |
| `FLOW` | Do creation, handoff, failure, correction, closure or integration states disagree? |
| `SCOPE` | Is production behaviour accidentally constrained by prototype, demo, vendor or one-operator assumptions? |

For every class:

1. Run repository searches for old and new vocabulary.
2. Compare requirements, decisions, feature spec, architecture, data model and APIs.
3. Exercise the new domain against every upstream/downstream boundary.
4. Add every real issue to §6; never hide it in prose.
5. Resolve it, create an explicit decision, or assign a blocking owner and dependency.

Conflict review passes only when the wave has no unrecorded contradiction and every recorded conflict is `RESOLVED`, `ACCEPTED_RISK`, or an explicit blocker.

The whole-system audit may additionally classify `PHYSICAL` and `OPERABILITY` gaps. These are tracked with the same severity as cross-document conflicts even though they do not necessarily begin as contradictions between documents.

### Exit gate

A wave is `COMPLETE` only when:

- canonical feature, data and API owners exist;
- requirement rows in §5 point to those owners;
- authorization capabilities have named targets;
- downstream integrations and events are mapped;
- edge cases and recovery paths are testable;
- changed documents pass relative-link and formatting checks;
- obsolete canonical vocabulary searches return clean or only intentionally quarantined history;
- §4, §5, §6 and §7 are updated; and
- durable decisions are copied to `docs/decisions/architecture-decisions.md`.

## 3. Production wave register

| Wave | Domain/output | Status | Depends on | Canonical deliverables | Conflict review |
|---:|---|---|---|---|---|
| 1 | Planning baseline and traceability | `COMPLETE` | Official PS, corrected foundation | [`production-capability-map.md`](../product/production-capability-map.md), [`domain-glossary.md`](../product/domain-glossary.md), [`domain-dependency-map.md`](../architecture/domain-dependency-map.md) | Conflict classes audited across Waves 1–15; Ministry tenant/legal decisions remain explicit blockers |
| 2 | Incident and emergency management | `COMPLETE` | Identity, inspection, evidence, workflow, presence/muster | [Feature](../features/incidents/incident-and-emergency-spec.md), [model](../architecture/incident-data-model.md), [API](../api-specs/endpoints/incidents/incidents.md), [gap audit](wave-02-incident-gap-audit.md) | Conditional pass: legal rule contents blocked externally; muster implementation deferred to Wave 6 |
| 3 | Production, dispatch and stock | `COMPLETE` | Mine/assets, identity, evidence | [Feature](../features/production/production-dispatch-stock-spec.md), [model](../architecture/production-data-model.md), [API](../api-specs/endpoints/production/production.md), [gap audit](wave-03-production-gap-audit.md) | Conditional pass: onboarding source policies remain operator-governed |
| 4 | Environmental monitoring | `COMPLETE` | Obligations, documents, GIS foundations | [Feature](../features/environment/environmental-monitoring-spec.md), [model](../architecture/environment-data-model.md), [API](../api-specs/endpoints/environment/environment.md), [gap audit](wave-04-environment-gap-audit.md) | Conditional pass: external report/adapters remain Waves 8/12 |
| 5 | Contractor compliance register | `COMPLETE` | Organisation, affiliation, engagement, documents | [Feature](../features/contractors/contractor-compliance-spec.md), [model](../architecture/contractor-data-model.md), [API](../api-specs/endpoints/contractors/compliance.md), [gap audit](wave-05-contractor-gap-audit.md) | Conditional pass: legal catalogue/adapters remain onboarding/Wave 12 |
| 6 | Attendance and presence | `COMPLETE` | Contractor workers, mine zones, devices | [Feature](../features/attendance/presence-and-attendance-spec.md), [model](../architecture/attendance-data-model.md), [API](../api-specs/endpoints/attendance/attendance.md), [gap audit](wave-06-attendance-gap-audit.md) | Conditional pass: device/register deployment approval remains |
| 7 | GIS and spatial governance | `COMPLETE` | Mine/assets, inspection, environment, evidence | [Feature](../features/geospatial/geospatial-governance-spec.md), [model](../architecture/geospatial-data-model.md), [API](../api-specs/endpoints/geospatial/geospatial.md), [gap audit](wave-07-geospatial-gap-audit.md) | Conditional pass: agency feeds/source catalogue remain onboarding/Wave 12 |
| 8 | Statutory reports and returns | `COMPLETE` | Operational source domains, documents, signing | [Feature](../features/reporting/statutory-reporting-spec.md), [model](../architecture/reporting-data-model.md), [API](../api-specs/endpoints/reporting/reporting.md), [gap audit](wave-08-reporting-gap-audit.md) | Conditional pass: authority profiles/live adapters remain Wave 12/onboarding |
| 9 | Applications, clearances and regulatory cases | `COMPLETE` | Documents, workflow, reports, integrations | [Feature](../features/regulatory-cases/application-and-case-spec.md), [model](../architecture/regulatory-case-data-model.md), [API](../api-specs/endpoints/regulatory-cases/cases.md), [gap audit](wave-09-regulatory-case-gap-audit.md) | Conditional pass: approved service catalogue/live adapters remain onboarding/Wave 12 |
| 10 | Authorization-aware search | `COMPLETE` | All searchable domains, identity | [Feature](../features/search/authorization-aware-search-spec.md), [model](../architecture/search-data-model.md), [API](../api-specs/endpoints/search/search.md), [gap audit](wave-10-search-gap-audit.md) | Conditional pass: engine, relevance corpus and English/Hindi tuning remain Waves 14/15 |
| 11 | Grievances and complaints | `COMPLETE` | Identity/privacy, workflow, inspection/incident | [Feature](../features/grievances/grievance-and-protected-intake-spec.md), [model](../architecture/grievance-data-model.md), [API](../api-specs/endpoints/grievances/grievances.md), [gap audit](wave-11-grievance-gap-audit.md) | Conditional pass: approved case catalogue and live external adapters remain authority/onboarding/Wave 12 dependencies |
| 12 | Integration platform | `COMPLETE` | Stable source domains | [Feature](../features/integrations/integration-platform-spec.md), [model](../architecture/integration-data-model.md), [API](../api-specs/endpoints/integrations/integrations.md), [gap audit](wave-12-integration-gap-audit.md) | Conditional pass: real authority schemas/access/conformance and production infrastructure remain onboarding/Wave 15 |
| 13 | Analytics and AI governance | `COMPLETE` | Production/environment/incident/attendance/contractor facts | [Feature](../features/analytics/analytics-and-ai-governance-spec.md), [model](../architecture/analytics-ai-data-model.md), [API](../api-specs/endpoints/analytics/analytics-ai.md), [gap audit](wave-13-analytics-ai-gap-audit.md) | Conditional pass: representative data/labels/thresholds and production models require Ministry approval and Waves 14/15 validation |
| 14 | Localization, accessibility and assisted use | `COMPLETE` | Stable user journeys and terminology | [Feature](../features/experience/localization-accessibility-assisted-use-spec.md), [model](../architecture/experience-data-model.md), [API](../api-specs/endpoints/experience/experience.md), [gap audit](wave-14-experience-gap-audit.md) | Conditional pass: approved Hindi corpus/user research/STQC and executable production evidence remain Wave 15 |
| 15 | Cross-domain production hardening | `COMPLETE` | Waves 1–14 | [Feature](../features/platform/production-hardening-spec.md), [audit/history model](../architecture/audit-history-data-model.md), [API](../api-specs/endpoints/platform/platform-operations.md), [gap audit](wave-15-production-hardening-gap-audit.md) | Conditional design pass: executable implementation, authority inputs, measured objectives and certification remain launch gates |

## 4. Completed foundation work that waves inherit

| Capability | Canonical owner | Status | Known follow-up |
|---|---|---|---|
| Identity, sessions, organisations and tenancy | `architecture/identity-authority-model.md` | Designed | Remove remaining obsolete presentation/product wording |
| Foundation relational entities | `architecture/foundation-data-model.md` | Designed | Produce executable migrations during hardening |
| Capability/mandate/jurisdiction authorization | `features/access-control/authorization-spec.md` | Designed | Production OpenFGA/policy bundle and tests |
| Inspections and assignment teams | `features/inspections/inspection-spec.md` | Designed | Dashboard/report/search integration in later waves |
| Inspection relational model | `architecture/inspection-data-model.md` | Designed | Executable migrations and concurrency tests |
| Inspection APIs | `api-specs/endpoints/inspections/inspections.md` | Designed | Promote to OpenAPI during hardening |
| Obligations and document intelligence | Existing compliance/document specs | Designed with conflicts | Remap legacy physical DDL and shared national requirements |
| Observation, defect, finding and CAPA | `features/defect-management/defect-spec.md` | Designed with conflicts | Finish structured regulator terminology sweep |
| Workflow and dashboard | Existing feature specs | Designed with conflicts | Replace obsolete role/hierarchy vocabulary |

## 5. Requirement coverage ledger

Status is design coverage, not implementation.

| PS section | Required capability | Production owner | Status | Gap/wave |
|---|---|---|---|---|
| §4.1 | Compliance obligation register | Compliance specs (`CAP-01`) | `DESIGNED` | Approved legal catalogue and executable implementation remain onboarding/release work |
| §4.2 | Inspections, observations and incident distinction | Inspection + defect + incident specs | `DESIGNED` | Later GIS/dashboard/report integrations |
| §4.3 | Corrective actions | Defect/CAPA spec | `DESIGNED` | Executable state/evidence/concurrency tests remain release work |
| §4.4 | Offline field reporting | Field-capture + inspection + incident specs | `DESIGNED` | Inspector/field-worker mobile implementation, device/security testing and legal deployment remain |
| §4.5 | Contractor management | Contractor compliance (`CAP-05`) + identity contractor APIs | `DESIGNED` | Exact legal policy catalogue and issuer adapters remain onboarding/Wave 12 |
| §4.6 | Attendance and presence | Attendance/presence/muster (`CAP-06`) | `DESIGNED` | Approved device topology, electronic-register policy and rollout remain deployment work |
| §4.7 | Production/environment reporting | Production (`CAP-07`) + environment (`CAP-08`) specs | `DESIGNED` | Statutory report generation/transport remain Waves 8/12 |
| §4.8 | Grievances | Grievance/protected-intake (`CAP-09`) | `DESIGNED` | Approved Ministry/operator/special-regime policies and adapters remain onboarding/Wave 12 |
| §4.9 | Document digitisation and search | Documents (`CAP-10`) + authorization-aware search (`CAP-11`) | `DESIGNED` | Production engine, relevance corpus and English/Hindi tuning remain Waves 14/15 |
| §4.10 | Analytics/risk/anomaly | Analytics/AI governance (`CAP-12`) | `DESIGNED` | Representative production use cases/data/labels/thresholds/models remain Ministry approval/Waves 14/15 |
| §4.11 | Three-altitude dashboards | Dashboard spec (`CAP-13`) | `DESIGNED` | Source-domain metrics completed in later waves |
| §4.12 | Workflow/escalation | Workflow spec (`CAP-14`) | `DESIGNED` | Domain-specific routes/timers completed in later waves |
| §4.13 | Statutory reports | Reporting (`CAP-15`) | `DESIGNED` | Approved authority schemas/signature profiles/live adapters remain Wave 12/onboarding |
| §4.14 | Audit trail | Audit/history (`CAP-16`) | `DESIGNED` | Executable persistence/checkpoint/reconstruction implementation and verification remain release work |
| §4.15 | Access and multi-site scope | Corrected foundation (`CAP-17`) | `DESIGNED` | Final tenant policy remains a deployment-governance decision |
| §4.16 | GIS/spatial view | Geospatial governance (`CAP-18`) | `DESIGNED` | Production source feeds, certified surveys and deployment catalogue remain |
| Expected solution | Central dashboards | Dashboard + analytics/read-model contracts | `DESIGNED` | Executable projections, SLO/capacity and release testing remain |
| Expected solution | AI/anomaly/predictive alerts | Analytics/AI governance plus source-domain facts | `DESIGNED` | No accident-prediction claim; production evaluation/model deployment remains Waves 14/15 |
| Expected solution | Mobile inspections/observations/attendance/incidents | Inspector/field-worker app plus incident/attendance/field specs | `DESIGNED` | Dedicated app scope limited by D57; implementation/device/legal deployment remain |
| Expected solution | Alerts/reminders/escalation/approvals/reports | Workflow, reporting, integration and hardening designed | `DESIGNED` | Authority-specific deployment/testing remains implementation/onboarding |
| Expected solution | GIS/OCR/secure audit | OCR, GIS and typed audit/history designed | `DESIGNED` | Executable security/audit verification remains release work |

## 6. Conflict register

Do not delete resolved rows. They prevent old designs from returning.

| ID | Class | Conflict | Evidence | Impact | Resolution/owner | Status |
|---|---|---|---|---|---|---|
| C-001 | `SCOPE` | Product/prototype docs used a fixed Ministry→operator→subsidiary→area hierarchy; foundation separates tenant, organisation units and physical assets | PRD FR-2 vs identity model | Fake hierarchy layers and incorrect RLS | PRD now uses the canonical separated model | `RESOLVED` |
| C-002 | `AUTH` | Product docs used regulator-region scope instead of authority+mandate+temporal jurisdiction | PRD FR-2 | DGMS/MoEFCC authority conflation | PRD and glossary migrated to mandate/jurisdiction | `RESOLVED` |
| C-003 | `VOC` | Active normative files used CoalGuard while canonical product name is Strata | Feature, product and solution-context headings | Searchability and stakeholder confusion | Active normative naming migrated to Strata | `RESOLVED` |
| C-004 | `SCOPE` | Production plan was polluted by prototype tiers, demo constraints and one-operator assumptions | Prototype scope and legacy data model | Required domains appear optional or impossible to scale | Production capability map is authoritative; prototype scope is explicitly non-authoritative for production ownership | `RESOLVED` |
| C-005 | `DATA` | Legacy `data-model.md` remains non-executable and contradicts corrected foundation | Quarantine banner and old `operator_id`, region, role fields | Implementer may build wrong schema | Quarantine retained; canonical logical models override it; executable replacement assigned to Wave 15 | `ACCEPTED_RISK` |
| C-006 | `AUTH` | Defect/dashboard/workflow prose retained regulator-raised booleans and role-shaped closure/escalation terms | Feature specifications | Conflicts with structured issuer/capability policy | Normative feature prose migrated to authority-issued plus capability/mandate/jurisdiction | `RESOLVED` |
| C-007 | `FLOW` | Corrective-action requirements need timers while defect spec emphasized only condition triggers | PS §4.3/§4.12 vs defect spec | Overdue actions may not escalate predictably | Reminder, missed-deadline and risk-condition rules are now separate trigger kinds | `RESOLVED` |
| C-008 | `OWN` | Incident/near-miss had no domain; observations risked absorbing occurred events | PS §4.2/§4.4 | Wrong lifecycle, reporting and emergency response | Incident domain now owns events/emergency/notice/investigation and links observations/findings | `RESOLVED` |
| C-009 | `DATA` | Document/obligation legacy schema forced mine/operator ownership, conflicting with national rules and multi-context filings | Legacy data model vs document API/foundation | Duplicate laws, fake mine linkage, broken cross-tenant applicability | Reporting now separates shared definition/version from subject/period filing obligation; canonical logical model overrides legacy layout | `RESOLVED` |
| C-010 | `FLOW` | Regulator surface was described as read-only while integrated authorities need active operations | PS §4.15, dashboard and inspection specs | Excessive write access or blocked regulator work | Separate monitoring view from capability-governed participating-authority workspace | `RESOLVED` |
| C-011 | `SCOPE` | Mobile platform/persona language implied broader role coverage than currently planned | PRD FR-6, workflow, presentation and technical design | Team could build or promise manager/contractor/applicant/regulator mobile pages without a decision | Flutter/Android field app is currently scoped to inspectors and field workers; every other mobile persona/page is explicitly TBD and uses responsive web meanwhile | `RESOLVED` |
| C-012 | `REQ` | Search is deferred although PS §4.9 requires full-content document search | Product inventory/prototype scope vs official PS | OCR output not practically discoverable | Wave 10 specifies authorized full-content/OCR search, provenance and freshness | `RESOLVED` |
| C-013 | `FLOW` | Severe observations could await defect/finding classification before containment | PS §4.3 vs finding-only CAPA flow | Immediate hazard response delayed | Incident-owned containment precedes classification and hands long-term work to CAPA | `RESOLVED` |
| C-014 | `DATA` | Legacy attendance API represents one check-in/out pair but PS requires zone presence and reconciliation | Legacy API vs PS §4.6 | Cannot support underground transitions, muster or reconciliation | Canonical event model/API now replace it; legacy file explicitly superseded | `RESOLVED` |
| C-015 | `DATA` | Audit time-travel/hash-chain legacy DDL is known unsafe | Quarantined data model §§6 | Historical dashboard/legal verification unreliable | Canonical typed transactional audit/access/checkpoint/reconstruction model supersedes legacy §6; executable implementation remains release gate | `RESOLVED` |
| C-016 | `REQ` | Official incident-notification instruments can differ in forms, predicates, recipients and clocks across legal transition | CMR 2017 forms vs newer central notification rules | Hard-coded notice may be late or legally wrong | Effective-dated rule architecture complete; Ministry legal/safety owner must publish applicable contents/transition | `BLOCKED` |
| C-017 | `DATA` | Incident muster consumed presence semantics whose executable multi-transition schema/API was deferred | Incident spec vs Wave 6 attendance status | Emergency roster could not be production-complete | Wave 6 now specifies event, inclusion, response, handover and closure contracts | `RESOLVED` |
| C-018 | `DATA` | Concrete production source precedence varies by operator, event, device health and reporting context | PRIMS, ERP, weighbridge, survey and manual sources | A universal winner would hide valid disagreement | Versioned source-policy architecture fixed; each onboarding must approve its matrix before publication | `ACCEPTED_RISK` |
| C-019 | `FLOW` | Integration prose allowed live sensors to auto-fulfil obligations | Integration landscape vs compliance verification rules | Invalid or partial telemetry could claim legal satisfaction | Sensor supplies evidence/evaluation only; obligation verification remains obligation-owned | `RESOLVED` |
| C-020 | `FLOW` | Environment release-ready data depends on statutory report and external adapter domains | Environment vs Waves 8/12 | Cannot yet prove PARIVESH/CPCB/SPCB submission/acceptance | Wave 8 report/package lifecycle is complete; live adapter/authority-profile execution remains Wave 12 | `ACCEPTED_RISK` |
| C-021 | `AUTH` | Active contractor engagement could be mistaken for work eligibility | Identity contractor API vs PS §4.5/safety requirements | Unqualified worker or asset could receive access | Separate effective requirement and purpose-specific eligibility decision introduced | `RESOLVED` |
| C-022 | `REQ` | Exact labour/safety credential catalogue and issuer verification vary by transition, jurisdiction and operator | 2025 labour-code commencement, 2026 rules/DGMS/operator policy | Hard-coded thresholds/forms may become legally wrong | Effective-dated policy fixed; catalogue needs legal owner and adapters remain Wave 12/onboarding | `ACCEPTED_RISK` |
| C-023 | `PRIV` | Attendance design lacked an explicit purpose/projection boundary for named movement and biometric results | Attendance vs dashboards/payroll/contractor/regulator consumers | Excessive surveillance and worker-data exposure | No raw templates; purpose-specific projections, self-dispute, aggregate portfolio and retention boundary specified | `RESOLVED` |
| C-024 | `REQ` | Electronic register method, certified underground devices/topology and retention require authority/operator approval | Attendance software vs physical/legal deployment | Prototype could be misrepresented as approved paperless mine infrastructure | Production-shaped adapter and printable register fixed; approval remains deployment dependency | `ACCEPTED_RISK` |
| C-025 | `DATA` | Existing PostGIS fragments treated lease/asset geometry as simple mutable columns and geofence policy as an asset radius | Legacy data/field/defect docs vs spatial governance | Wrong boundary, CRS or later edit could decide closure and rewrite history | Governed kinds/versions and immutable policy-bound evaluations now canonical; old radius prose corrected | `RESOLVED` |
| C-026 | `REQ` | Concrete authoritative source/accuracy/refresh rules and agency interfaces are unavailable as one national contract | CMSMS/NCoG/SWCS, approval documents and operator surveys | Strata cannot claim every displayed boundary is current statutory truth | Source-policy/freshness/reconciliation architecture fixed; onboarding and Wave 12 own feeds/catalogue | `ACCEPTED_RISK` |
| C-027 | `FLOW` | Generated, signed, transmitted, acknowledged, accepted and compliance-verified reporting states were not canonically separated | PS/report fragments vs integration/compliance | Technical delivery could be shown as legal compliance | Independent evidence-bearing report, attempt, receipt, authority and obligation-verification lifecycles defined | `RESOLVED` |
| C-028 | `REQ` | Existing document prose hard-coded Class 3 DSC for every statutory submission although authority mechanisms differ | Pipeline spec vs published PARIVESH e-authentication/CCA mechanisms | Valid portal flow could be blocked or wrong signature claimed | Effective report/channel signature profile replaces universal mechanism; pipeline prose corrected | `RESOLVED` |
| C-029 | `REQ` | Exact external report schemas, signature profiles, APIs and receipt/acceptance semantics are not uniformly available | PARIVESH/DGMS/Shram Suvidha/PRIMS and authority transitions | Architecture cannot prove live interoperable filing | Definition/channel boundary fixed; approved profiles and live adapters assigned to Wave 12/onboarding | `ACCEPTED_RISK` |
| C-030 | `SCOPE` | Unified-portal ambition and federation boundary lacked a service-by-service execution rule | D1 vs D2 and current SWCS/PARIVESH/NSWS landscape | UI could falsely imply Strata grants another authority's approval or never permit Ministry migration | Effective native/API/redirect/manual/information-only modes plus authoritative system/decision owner defined | `RESOLVED` |
| C-031 | `FLOW` | Application, submission, case admission, recommendation, decision and issued instrument had no canonical separation | Solution-context portal prose vs reporting/authority ownership | Applicant could see an uploaded proposal or recommendation as approved | Independent applicant/case/decision/instrument lifecycles and evidence gates specified | `RESOLVED` |
| C-032 | `REQ` | Exact national/state service catalogue, applicability, stages, roles, schemas, APIs and transitions require authority agreements | SWCS/NSWS/PARIVESH and changing 2025–26 policy | Architecture cannot promise complete discovery or live case processing | Effective catalogue/mode boundary fixed; authority onboarding/Wave 12 own approved contents/connectors | `ACCEPTED_RISK` |
| C-033 | `AUTH` | Page-level filtering could leak restricted records through totals, facets, suggestions, snippets, ranking and caches | Search surfaces vs capability/mandate/jurisdiction authorization | A user can infer protected cases, people or events without opening a document | Authorization now precedes every observable output and current authority is rechecked per returned object | `RESOLVED` |
| C-034 | `DATA` | Search lacked a canonical projection, freshness, revocation and deletion model | Document/OCR sources vs search and semantic stores | Stale or deleted content can remain discoverable or be mistaken for source truth | Versioned rebuildable projections, checkpoints, authorization revisions and cross-store tombstones specified | `RESOLVED` |
| C-035 | `SCOPE` | Exact engine, analyzer configuration, embedding deployment and relevance thresholds need corpus evaluation | English/Hindi, exact statutory terms and sensitive classifications | Premature vendor/configuration choice can harm recall, precision, privacy or portability | Architecture fixes contracts and lexical baseline; Waves 14/15 select and validate implementation against approved corpora | `ACCEPTED_RISK` |
| C-036 | `SCOPE` | Prototype solution prohibited grievance intake while official PS §4.8 requires low-barrier intake | Solution context §9.10 vs official requirement | Production portal would omit a mandatory capability and force users to understand fragmented channels | Prototype note superseded; governed intake plus per-type native/federated/specialized execution is canonical | `RESOLVED` |
| C-037 | `PRIV` | One general grievance queue could expose reporter identity, POSH/vigilance content or retaliation concerns to implicated management | Prototype linkage/general workflow vs specialized confidentiality | Confidentiality breach, retaliation and suppression | Reporter vault, early special-regime screening, independent protected routes and purpose-logged disclosure specified | `RESOLVED` |
| C-038 | `FLOW` | Receipt, referral, transfer, reply, disposition, remediation verification, feedback and appeal could collapse into “closed” | PS status/disposal language vs cross-domain truth | Forwarded or answered issue could falsely appear corrected and review history could be lost | Separate immutable lifecycles, accepted responsibility transfer, action truth and independent appeal specified | `RESOLVED` |
| C-039 | `REQ` | Exact grievance types, authority modes, routes, clocks, POSH/PIDPI handling, external schemas and retention require competent owners | CPGRAMS/Ministry/operator and specialized regimes | Architecture cannot certify universal legal workflow or live interoperability | Effective policy boundary fixed; legal/HR/vigilance/POSH/privacy owners approve contents; adapters remain Wave 12/onboarding | `ACCEPTED_RISK` |
| C-040 | `FLOW` | External transport success/portal status could directly mutate domain completion | Integration landscape and domain-specific adapter assumptions | False filing, clearance, grievance, attendance or compliance truth | Integration now owns evidence/translation only; domain validates canonical handoff and owns transitions | `RESOLVED` |
| C-041 | `DATA` | Timeout, retry, duplicate/out-of-order callback and external ID collision lacked shared semantics | Reporting/cases/IoT/external imports | Duplicate statutory action, overwritten status or wrong resource linkage | Outcome-unknown reconciliation, idempotency/hash, ordering and system+namespace mappings specified | `RESOLVED` |
| C-042 | `AUTH` | Connector credentials/operators could become broad domain or sensitive-payload access | Adapter configuration and operational recovery | Secret leakage, cross-tenant exposure and authority bypass | Vault references/workload identity, attempt-time grant validation and separated admin/payload/domain capabilities specified | `RESOLVED` |
| C-043 | `REQ` | Real schemas, credentials, network access, sandboxes, SLAs and sharing terms are not uniformly available | PARIVESH/CPGRAMS/DGMS/PRIMS/CPCB/operator/device systems | Design cannot claim live interoperability, capacity or authority acceptance | Provider-neutral contract complete; each deployment requires authority onboarding/conformance; infrastructure validation remains Wave 15 | `ACCEPTED_RISK` |
| C-044 | `VOC` | “AI” mixed OCR, extraction, matching, anomaly, risk, forecasting, search and generation without distinct authority/error boundaries | PRD/prototype/presentation claims | Accuracy or approval for one component could be incorrectly inherited by another | Component/use-case/decision-influence catalogue and version-specific governance specified | `RESOLVED` |
| C-045 | `FLOW` | Risk/anomaly outputs could be consumed as findings, fraud, causation, eligibility or enforcement truth | Dashboard/defect/contractor claims vs human-reviewed AI decision | Automation bias and unauthorized adverse action | Immutable advisory signals route to normal human/domain gates; anomaly semantics explicitly limited | `RESOLVED` |
| C-046 | `DATA` | AI lacked canonical point-in-time data/feature/label/model/prompt/provider/run lineage | Fragmented extraction/search/risk implementations | Leakage, irreproducible scores and unexplained historical influence | Manifest-bound lifecycle, source versions, explanations, review/contest and impact links specified | `RESOLVED` |
| C-047 | `REQ` | Representative real data, labels, harm thresholds, subgroup policy and approved production models are unavailable | Synthetic/prototype claims vs national multi-mine deployment | Design cannot claim predictive accuracy, fairness or production fitness | Governance/evaluation architecture fixed; Ministry/domain owners and Waves 14/15 must validate real use cases | `ACCEPTED_RISK` |
| C-048 | `DATA` | English/Hindi intent lacked locale-neutral semantics, source-linked translation and staleness | PRD/workflow vs legal/evidence/domain state | Translated strings could alter workflow meaning or show obsolete safety/legal content | Stable codes plus versioned terminology/source-linked reviewed translation/fallback specified | `RESOLVED` |
| C-049 | `REQ` | Accessibility existed as a checklist without build/journey/locale/assistive-technology evidence | Feature inventory/dashboard vs GIGW/WCAG | Automated scans could support a false accessibility claim while users cannot complete work | Critical-journey automated/manual/AT/user testing, defects/exceptions and scoped conformance specified | `RESOLVED` |
| C-050 | `AUTH` | Assisted/kiosk/voice use lacked separate helper identity, consent and consequential-action boundary | Low-barrier grievance/field workflows | Credential sharing, impersonation or coerced/unauthorized submission | Expiring purpose-bound assisted session, read-back/affirmation and separate representative authority specified | `RESOLVED` |
| C-051 | `REQ` | Approved Hindi corpus/terminology, disabled/low-literacy research, STQC assessment and production device/browser/AT evidence are unavailable | English/Hindi and accessibility promises | Design cannot claim complete linguistic quality or certified conformance | Governance/test contract fixed; content/research/certification and executable gates remain owners/Wave 15 | `ACCEPTED_RISK` |
| C-052 | `DATA` | Markdown SQL/API prose could be mistaken for physical/executable contracts | Legacy data model and endpoint documents | Obsolete schema, missing constraints/RLS and breaking consumer changes could ship | Artifact authority and package-owned migration/OpenAPI/event/policy CI gates specified | `RESOLVED` |
| C-053 | `OPERABILITY` | HA/all-mines/real-time promises lacked workload, SLI/SLO, capacity, degraded mode and recovery objectives | PRD/technical/presentation claims | No defensible sizing, procurement, alerting or availability/recovery claim | Scoped service objectives/capacity model plus load/failure/restore/DR evidence gates specified | `RESOLVED` |
| C-054 | `FLOW` | Migration/cutover could force legacy roles/status/IDs into canonical model without row disposition or parity | Legacy data model/source systems vs corrected foundation/domains | Silent loss, duplicate identity, false authority/compliance and premature retirement | Manifest-bound mapping/dry run/quarantine/reconciliation/cutover/rollback/hypercare/retirement gates specified | `RESOLVED` |
| C-055 | `REQ` | Authority governance, legal catalogues, live agreements, measured objectives, real AI/language/accessibility and executable artifacts require external/human execution | All accepted risks and Q-001/C-016 | Documentation cannot authorize/certify a production launch | Consolidated named launch gates; programme remains conditional until owners supply evidence | `BLOCKED` |

## 7. Decision and question queue

| ID | Needed by | Decision/question | Options to evaluate | Status |
|---|---:|---|---|---|
| Q-001 | 1 | What is the approved production organisational/tenant boundary beyond the current CIL default? | CIL tenant default; operator legal-entity tenants; formal exceptions | `OPEN` |
| Q-002 | 1 | What vocabulary replaces every legacy “regulator-raised” field in user-facing language? | Chosen: authority-issued generically; name the authority when known | `DECIDED` |
| Q-003 | 2 | Which incident categories and immediate statutory notification clocks are in scope per governing instrument? | Architecture decided: effective-dated legally reviewed catalogue; exact transition contents require Ministry legal owner | `PARTIALLY_DECIDED` |
| Q-004 | 3 | What source is authoritative for production, dispatch and stock when systems disagree? | Decided: no universal winner; preserve assertions and approve a reconciled fact under effective source policy | `DECIDED` |
| Q-005 | 4 | How are permit limits, averaging periods and laboratory corrections versioned? | Decided: effective limit bindings plus immutable superseding results/evaluations/manifests | `DECIDED` |
| Q-006 | 5 | Which contractor credentials block access immediately and who can override? | Architecture decided: hard-stop/controlled-exception/warn/informational policy; exact catalogue requires legal/safety publication | `PARTIALLY_DECIDED` |
| Q-007 | 6 | What attendance/movement data is legally necessary versus privacy-excessive? | Decided architecture: purpose-specific projections, no raw biometrics, minimized movement retention and aggregate portfolio default; exact durations need approved schedule | `PARTIALLY_DECIDED` |
| Q-008 | 7 | What sources are authoritative for lease, operational and restricted-zone geometry? | Architecture decided: no universal winner; purpose/kind-specific effective source policy preserving assertions; exact catalogue requires authority onboarding | `PARTIALLY_DECIDED` |
| Q-009 | 8 | What event constitutes statutory submission and how is acknowledgement proven? | Decided: qualifying submission event comes from effective channel policy; transport needs attempt proof, acknowledgement needs correlated receiver evidence, acceptance remains separate | `DECIDED` |
| Q-010 | 9 | Which workflows are native to Ministry of Coal and which remain federated to other authorities? | Architecture decided: effective service-specific execution mode and authoritative system; exact modes require Ministry/authority catalogue publication | `PARTIALLY_DECIDED` |
| Q-011 | 10 | Which search outputs are authorization-sensitive and what happens after access revocation? | Decided: every observable output is sensitive; query sessions bind authorization revision, returned objects use current checks, and stale/unavailable authority fails closed | `DECIDED` |
| Q-012 | 11 | Should Strata intake grievances or only link external cases, and who may see reporter identity? | Decided: low-barrier unified intake with case-specific authoritative execution; reporter identity is separately vaulted and disclosed only under explicit capability/purpose/policy | `DECIDED` |
| Q-013 | 12 | When is an external operation complete, and how is an ambiguous timeout retried? | Decided: transport/acknowledgement/remote terminal/domain truth are distinct; possible-send timeout is outcome-unknown and reconciled before any unsafe retry | `DECIDED` |
| Q-014 | 13 | Where does each AI component sit, and what may anomaly/risk outputs decide? | Decided: components have separate approved use cases; anomaly means unexpected under a comparator and all signals are advisory inputs to authorized human/domain decisions | `DECIDED` |
| Q-015 | 14 | What is the mobile persona boundary and how are language/accessibility/assistance proven? | Decided: mobile is planned only for inspectors/field workers and other pages are TBD; stable semantics + versioned translation, critical-journey evidence and consented separate helper identity govern experience | `DECIDED` |
| Q-016 | 15 | What evidence makes a release production-eligible, and does completing design mean launch-ready? | Decided: signed manifest plus executable contract/security/accessibility/load/restore/DR/migration/operational gates; design completion explicitly does not mean implementation, certification or authority approval | `DECIDED` |

## 8. Wave 1 execution record

```text
Wave: 1 — Planning baseline and traceability
Status: COMPLETE (baseline design; later wave reconciliation incorporated)
Started/updated: 2026-08-30
Requirements served: PS §4.1–§4.16 and all expected-solution bullets
Canonical dependencies read: official PS, PRD, solution context, decision record,
  identity/authority model, foundation model, authorization spec, feature/API indexes
Domain boundary: capability ownership, shared vocabulary, dependency direction and
  traceability rules; no operational domain lifecycle is invented here
Actors/authorities: Ministry portfolio users, tenant/operator users, mine staff,
  contractors, participating regulatory authorities, workers as governed subjects
Source records: official PS requirements, approved PRD requirements, canonical models
Outputs/consumers: every later feature, data, API, dashboard, report and integration wave
Decisions made: single authoritative owner per record; projections cannot become source;
  authority-issued vocabulary; monitoring and participating-authority surfaces separated
Open questions at Wave 1: Q-001 tenant governance; C-011 mobile scope (subsequently resolved in Wave 14)
Conflicts opened: none beyond C-001–C-015 during this pass
Conflicts resolved: C-001, C-002, C-003, C-004, C-006, C-007, C-010
Cross-domain scenarios tested: stale authority, workflow failure, late evidence,
  submission without acknowledgement, stale projections, source discrepancies,
  changed geometry and unavailable/versioned AI
Documents created/changed: capability map, glossary, dependency map, PRD, feature specs,
  decisions and indexes
Validation run/results: superseded by Wave 15 global validation across the complete design set
Exit-gate result: historical conflict review completed for C-011 in Wave 14; Q-001 remains open
Next dependency: approve Wave 1 conflict disposition, then begin Wave 2 incident design
```

Wave 1 process improvement: the inspection and attendance reviews showed that document-presence checks do not expose missing real-world custodians, statutory accountability, physical-device behaviour or emergency consumers. The mandatory whole-system gap audit now tests those dimensions for every wave.

## 9. Wave 2 execution record

```text
Wave: 2 — Incident and emergency management
Status: COMPLETE (design; external/deferred dependencies explicit)
Started/updated: 2026-08-30
Requirements served: PS §4.2, §4.4, §4.5, §4.10–§4.14, §4.16; CAP-04
Canonical dependencies read: official PS and official incident/emergency sources;
  identity/authorization, inspection, defect/CAPA, evidence, workflow, attendance/muster
Domain boundary: occurred events, emergency command/containment, casualties,
  statutory-notification obligations, investigation and learning; no ownership of
  attendance events, evidence bytes, defects/CAPAs, clinical charts or adapter transport
Actors/authorities: reporter, shift official, owner/agent/manager, principal official
  surface fallback, incident commander, rescue/muster/medical roles, safety officer,
  enquiry committee, statutory signer, DGMS/competent authorities, welfare liaison
Source records: reports/signals, approved emergency plan, presence/muster, evidence,
  effective notification rules and authority acknowledgements
Outputs/consumers: containment/CAPA, statutory reporting/integration, dashboards/search,
  GIS, contractor safety history, analytics and cross-mine safety lessons
Decisions made: parallel lifecycle gates; any-person reporting; response before
  classification; effective-dated legal rules; delivery != acknowledgement; constrained
  degraded operation; human next-of-kin contact; incident/presence ownership boundary
Open questions: exact legally approved incident rule catalogue/transition (C-016);
  executable muster implementation (C-017/Wave 6)
Conflicts opened: C-016, C-017
Conflicts resolved: C-008, C-013; GAP-02-001/002/004/006/007
Cross-domain scenarios tested: duplicate/offline reports, absent manager, emergency-plan
  fallback, stale muster, later death, portal outage, no acknowledgement, late evidence,
  interrupted inspection, classification suppression, device/auth outage, family contact
Pre-design gap-audit verdict: FAIL as expected; seven gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; one external blocker and one accepted
  cross-wave implementation risk remain explicit
Documents created/changed: incident feature, logical model, API, gap audit, authorization,
  defect/attendance boundaries, capability/index/decision/tracker records
Validation run/results: relative links passed across 78 Markdown files; diff check passed;
  audit sections/gaps, 21 API route groups and tracker dispositions verified
Exit-gate result: PASS with C-016 external blocker and C-017 accepted Wave 6 dependency
Next dependency: Wave 3 production/dispatch/stock; Wave 6 must implement muster contract
```

## 10. Wave 3 execution record

```text
Wave: 3 — Production, dispatch and stock
Status: COMPLETE (design; onboarding configuration dependency explicit)
Started/updated: 2026-08-30
Requirements served: PS §4.7 production portion, §4.10–§4.14; CAP-07
Canonical dependencies read: official PS, PRD, capability/dependency maps, identity,
  evidence, audit/workflow/integration landscape and official PRIMS/Coal Controller sources
Domain boundary: material events/lots, accounting boundaries, measurements, consignments,
  book/physical stock, discrepancies, periods and approved facts; no ERP/PRIMS firmware,
  laboratory result, GIS survey geometry, invoice/payment or statutory submission ownership
Actors/authorities: shift recorder, weighbridge operator, dispatch officer, stock/CHP post,
  surveyor, metrology role, reconciler, quality authority, Mine Manager/approver, MDO,
  operator/Ministry portfolio users
Source records: weighbridge and operational measurements, survey snapshots, ERP/PRIMS
  mirrors, VTS/ANPR corroboration, manual witnessed records, quality/sample references
Outputs/consumers: reporting, PRIMS/Coal Controller adapters, dashboards/search, GIS,
  environment, contractor attribution and analytics/anomaly signals
Decisions made: immutable assertions plus approved reconciled facts; no global source
  winner; lot lineage/mass balance; book != physical stock; versioned close/reopen;
  shared accounting boundaries; canonical metric tonne and explicit basis
Open questions: concrete source/tolerance matrix per operator onboarding (C-018)
Conflicts opened: C-018
Conflicts resolved: GAP-03-001 and GAP-03-003 through GAP-03-008
Cross-domain scenarios tested: duplicate/test loads, calibration expiry, ghost trip signals,
  processing yield, negative stock, stock loss/incident, late close data, PRIMS outage,
  MDO dispute, shared washery/siding, ambiguous units and incomplete feed
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; onboarding source policy accepted risk
Documents created/changed: feature, logical model, API, gap audit, authorization, glossary,
  indexes, capability map, decisions and tracker
Validation run/results: relative links passed across 82 Markdown files; diff check passed;
  eight gap dispositions, 20 API route groups and tracker traceability verified
Exit-gate result: PASS with C-018 onboarding dependency
Next dependency: Wave 4 environmental monitoring
```

## 11. Wave 4 execution record

```text
Wave: 4 — Environmental monitoring
Status: COMPLETE (design; reporting/adapter dependencies explicit)
Started/updated: 2026-08-30
Requirements served: PS §4.1, §4.7, §4.10–§4.14, §4.16; CAP-08
Canonical dependencies read: official PS, documents/extraction, obligation register,
  incident/CAPA, evidence, workflow, GIS/integration landscape and official
  PARIVESH/MoEFCC/CPCB sources
Domain boundary: monitoring programmes/points, samples/custody, instruments/raw and
  validated results, limit bindings, compatibility/evaluations, coverage/exceedance
  cases and release-ready period manifests; no source-condition, GIS geometry,
  incident/CAPA, legal conclusion, report generation or external transport ownership
Actors/authorities: Environment Officer/Cell, sampler, lab analyst/signatory,
  instrumentation technician, environmental reviewer/scientist, Mine Manager/project
  head, Head of Environment and authorized MoEFCC/CPCB/SPCB officers
Source records: EC/consent conditions, programmes/points, samples/custody/certificates,
  continuous telemetry/diagnostics/calibration, method/accreditation and context facts
Outputs/consumers: obligation evidence, incident/finding/CAPA, reporting/PARIVESH,
  dashboards/search, GIS, production context and analytics
Decisions made: reviewed effective limit binding; sampled vs continuous QA lifecycles;
  result != exceedance != legal conclusion; missing data != compliance; exact
  compatibility proof; immutable corrections; coverage-bearing period manifest
Open questions: concrete report templates/channels/authority acknowledgement in Waves 8/12
Conflicts opened: C-019, C-020
Conflicts resolved: C-019; GAP-04-001 through GAP-04-007
Cross-domain scenarios tested: amended condition, wrong unit/window/matrix, <LOQ,
  calibration/accreditation expiry, custody failure, sensor downtime/backfill,
  corrected lab result, moved point, acute release, CPCB discrepancy, PARIVESH outage
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; Waves 8/12 dependency accepted
Documents created/changed: feature, logical model, API, gap audit, authorization,
  compliance/integration boundary, glossary, capability/index, decisions and tracker
Validation run/results: relative links passed across 86 Markdown files; diff check passed;
  eight gap dispositions, 21 API route groups and tracker traceability verified
Exit-gate result: PASS with C-020 accepted downstream dependency
Next dependency: Wave 5 contractor compliance register
```

## 12. Wave 5 execution record

```text
Wave: 5 — Contractor compliance register
Status: COMPLETE (design; legal catalogue/adapter dependencies explicit)
Started/updated: 2026-08-30
Requirements served: PS §4.5, §4.6, §4.10–§4.15; CAP-05
Canonical dependencies read: official PS, identity/contractor APIs, documents,
  attendance, incidents, inspections/CAPA, authorization and official MoLE/DGMS sources
Domain boundary: engagement work packages, subcontracting, requirement selection/review,
  work eligibility, bounded exceptions, attribution disputes and performance projections;
  no identity, source-document, attendance, incident, CAPA, procurement or payroll ownership
Actors/authorities: Principal Employer representative, contract owner/engineer-in-charge,
  compliance administrator, specialist verifier, security operator, contractor representative,
  supervisor, worker, auditor and labour/DGMS authority under mandate/jurisdiction
Source records: identity/affiliation, engagement/contract, published requirement policy,
  governed evidence/issuer mirrors and source-domain incidents/findings/attendance/production
Outputs/consumers: gate/attendance eligibility, inspections, dashboards, analytics, reports,
  contractor history, safe withdrawal and external issuer adapters
Decisions made: engagement != eligibility; package/subcontract chain; evidence != validity;
  subject-specific evaluation; classified bounded exception; exposure-normalized history
Open questions: legally published credential catalogue, transition rules and issuer adapters
Conflicts opened: C-021, C-022
Conflicts resolved: C-021; GAP-05-001 through GAP-05-007
Cross-domain scenarios tested: expiry/revocation, forged evidence, hidden subcontractor,
  duplicate identity, worker/asset/operator mismatch, mid-shift expiry, gate outage,
  verifier vacancy, disputed attribution and unfair cross-mine ranking
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; onboarding/Wave 12 dependency accepted
Documents created/changed: feature, logical model, API, gap audit, authorization, glossary,
  indexes, capability map, decisions and tracker
Validation run/results: relative links passed across 90 Markdown files; diff check passed;
  eight gap dispositions, 24 API route groups and tracker traceability verified
Exit-gate result: PASS with C-022 accepted external/deployment dependency
Next dependency: Wave 6 attendance and presence executable model/API/privacy
```

## 13. Wave 6 execution record

```text
Wave: 6 — Attendance, presence and emergency muster
Status: COMPLETE (design; physical/legal deployment approval explicit)
Started/updated: 2026-08-30
Requirements served: PS §4.4–§4.6, §4.10–§4.16; CAP-06
Canonical dependencies read: official PS, attendance foundation, legacy API, identity,
  contractor eligibility, incident/muster, field capture, authorization and DGMS sources
Domain boundary: shifts/rosters, credentials, checkpoint/manual observations, projections,
  exceptions/corrections, reconciliation, registers and muster responses; no eligibility,
  GIS geometry, emergency command, payroll/billing or biometric-template ownership
Actors/authorities: Mine Manager, Attendance Clerk, shift official, lamp-room attendant,
  contractor supervisor, device administrator, muster coordinator, rescue/incident command,
  worker and authorized regulator
Source records: roster, contractor eligibility, credential assignment, signed device/manual
  observations, device health, GIS topology references and incident activation
Outputs/consumers: live presence/muster, attested register, payroll/billing export,
  contractor exposure, incident/rescue, dashboards, analytics and regulatory inspection
Decisions made: append-only multi-transition stream; observations != projections;
  no raw biometrics; signed sequence ingest; correction/supersession; muster uncertainty gate
Open questions: approved device/topology, electronic-register template and retention durations
Conflicts opened: C-023, C-024
Conflicts resolved: C-014, C-017, C-023; GAP-06-001 through GAP-06-007
Cross-domain scenarios tested: repeat underground trips, dead reader/replay/clock drift,
  swapped credential, eligibility expiry, cross-midnight shift, post-attestation correction,
  emergency outage, omitted person, contradictory response and unresolved handover
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; deployment approval dependency accepted
Documents created/changed: feature/privacy, logical model, API, legacy quarantine, gap audit,
  indexes, glossary, capability/inventory, decisions and tracker
Validation run/results: relative links passed across 93 Markdown files; diff check passed;
  eight gap dispositions, 30 API route groups and tracker traceability verified
Exit-gate result: PASS with C-024 accepted deployment dependency
Next dependency: Wave 7 governed GIS and spatial boundaries
```

## 14. Wave 7 execution record

```text
Wave: 7 — GIS and spatial governance
Status: COMPLETE (design; agency feed/source-catalogue dependency explicit)
Started/updated: 2026-08-30
Requirements served: PS §4.4, §4.6–§4.7, §4.10–§4.11, §4.14–§4.16; CAP-18
Canonical dependencies read: official PS, mine/assets, evidence/geofence, defects/CAPA,
  attendance/topology, environment, production, dependency map and official MoC/SoI sources
Domain boundary: source assertions, governed geometry/layers, CRS/datum/transformation,
  topology/surface models, immutable evaluations and authorized maps/exports; no legal
  instrument, mine identity, evidence, operational fact or compliance conclusion ownership
Actors/authorities: authorized surveyor/team, GIS steward, land/legal/mining-plan/environment/
  safety owners, Mine Manager, field user, independent reviewer and authorized authority user
Source records: CMSMS/NCoG/SWCS/authority documents, controlled survey/drone/LiDAR,
  Survey of India reference products and operator operational geometry
Outputs/consumers: field-evidence fitness, attendance topology, environment points,
  stock/working surveys, inspections/incidents, dashboards, reports and spatial analytics
Decisions made: no universal mine boundary; source assertions retained; purpose-specific
  publication; explicit CRS/datum/Z/uncertainty; immutable six-outcome evaluation;
  restricted-layer pre-render authorization
Open questions: approved per-kind source/accuracy/refresh catalogue and agency feed contracts
Conflicts opened: C-025, C-026
Conflicts resolved: C-025; GAP-07-001 through GAP-07-007
Cross-domain scenarios tested: wrong CRS/axis/datum, invalid/partial import, competing source,
  amendment, poor/spoofed fix, 2D/3D mismatch, topology gap, tile outage, export leak,
  target manipulation and historical re-evaluation
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; onboarding/Wave 12 dependency accepted
Documents created/changed: feature, logical model, API, gap audit, authorization, glossary,
  field/defect boundaries, indexes, capability/inventory, decisions and tracker
Validation run/results: relative links passed across 97 Markdown files; diff check passed;
  eight gap dispositions, 29 API route groups and tracker traceability verified
Exit-gate result: PASS with C-026 accepted external/deployment dependency
Next dependency: Wave 8 statutory reporting and signed source manifests
```

## 15. Wave 8 execution record

```text
Wave: 8 — Statutory reports, returns and filing packages
Status: COMPLETE (design; authority profile/live-adapter dependency explicit)
Started/updated: 2026-08-30
Requirements served: PS §4.1, §4.7, §4.12–§4.15; CAP-15
Canonical dependencies read: official PS, obligations/NIL, documents/signing, identity,
  production, environment, incidents, attendance, contractors, GIS, workflow/integration
  landscape and official PARIVESH/MoEFCC/CCA sources
Domain boundary: report definition/filing obligation, source compilation/manifest,
  validation/review, attestation, rendering/package, submission/receipt/authority status,
  correction and impact; no source-fact, obligation-verification, transport-adapter or
  receiving-authority decision ownership
Actors/authorities: report policy/legal owner, source custodian, preparer, reviewer,
  authorized signer, filing officer/adapter, integration operator, receiving authority
  and independent compliance verifier
Source records: obligation/definition, exact production/environment/incident/attendance/
  contractor/GIS/document versions, authority schemas and channel/signature profiles
Outputs/consumers: immutable report/package, filing attempts/receipts/status, compliance
  evidence, applications/cases, dashboards/search, analytics and audit
Decisions made: definition != filing; typed source manifest; missing != zero != NIL;
  review != attestation; profile-driven signature; transport != acknowledgement !=
  acceptance != compliance; immutable correction/impact chain
Open questions: approved per-authority schema, signature/e-authentication, channel,
  receipt/acceptance semantics, API access and credentials
Conflicts opened: C-027, C-028, C-029
Conflicts resolved: C-009, C-027, C-028; GAP-08-001 through GAP-08-007
Cross-domain scenarios tested: stale/missing source, false NIL, post-sign source change,
  expired/revoked signer, template migration, portal outage, timeout/duplicate retry,
  manual filing fraud, authority return/correction and unauthorized package read
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; Wave 12/onboarding dependency accepted
Documents created/changed: feature, logical model, API, gap audit, authorization, glossary,
  compliance/signature/integration boundaries, indexes, capability/inventory, decisions/tracker
Validation run/results: relative links passed across 101 Markdown files; diff check passed;
  eight gap dispositions, 29 API route groups and tracker traceability verified
Exit-gate result: PASS with C-029 accepted external integration dependency
Next dependency: Wave 9 applications, clearances and regulatory cases
```

## 16. Wave 9 execution record

```text
Wave: 9 — Applications, clearances and regulatory cases
Status: COMPLETE (design; approved catalogue/live-adapter dependency explicit)
Started/updated: 2026-08-30
Requirements served: unified portal/expected solution; PS §4.1, §4.9, §4.12–§4.15; CAP-19
Canonical dependencies read: official PS/solution context, D1/D2, identity/authority,
  documents, workflow, reporting, GIS, integration landscape and official MoC/NSWS/PARIVESH
Domain boundary: service catalogue/discovery, applicant application/requirements,
  authority case/assignment/milestones, queries/events/recommendations, decision/instrument,
  remedies and external reconciliation; no document, filing transport, payment, obligation
  publication or federated authority decision ownership
Actors/authorities: applicant/proponent and representative, subject owners, nodal officer,
  receiving/scrutiny/technical/site/hearing officers, committee, competent authority,
  registry/dispatch and integration reconciliation operator
Source records: service/legal catalogue, applicant/source documents/data, reporting package,
  external portal snapshots, authority correspondence/events/decision documents
Outputs/consumers: application/case status, issued instrument/conditions, obligations,
  inspections, environment/production/access, dashboards/search, analytics and audit
Decisions made: service-specific native/federated mode; application != case != decision !=
  instrument; explained discovery; case-specific assignment/quorum; immutable query rounds;
  related remedy cases; external raw state/freshness retained
Open questions: approved service catalogue contents, roles/stages/clocks, migration authority,
  API/schema/identifier mappings and production credentials
Conflicts opened: C-030, C-031, C-032
Conflicts resolved: C-030, C-031; GAP-09-001 through GAP-09-007
Cross-domain scenarios tested: abolished/reassigned service, incomplete discovery, expired
  representative, reused stale document, timeout/duplicate, ID collision, officer vacancy,
  partial query, missing quorum, portal/document conflict, revocation and appeal without stay
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; onboarding/Wave 12 dependency accepted
Documents created/changed: feature, logical model, API, gap audit, authorization, glossary,
  indexes, capability/inventory, decisions and tracker
Validation run/results: relative links passed across 105 Markdown files; diff check passed;
  eight gap dispositions, 37 API route groups and tracker traceability verified
Exit-gate result: PASS with C-032 accepted authority/integration dependency
Next dependency: Wave 10 authorization-aware search
```

## 17. Wave 10 execution record

```text
Wave: 10 — Authorization-aware search
Status: COMPLETE (design; engine/relevance/localization evaluation dependency explicit)
Started/updated: 2026-08-30
Requirements served: PS §4.9, §4.14–§4.15; CAP-11
Canonical dependencies read: official requirement/solution context, identity/authority,
  authorization, document extraction/pipeline, API conventions and domain dependency map
Domain boundary: rebuildable lexical/semantic projections, authorized discovery, within-document
  search, suggestions/related content, reproducible sessions, saved search/alerts/exports,
  projection operations and tombstone verification; no source-domain truth ownership
Actors/authorities: authorized portal/mobile users, saved-search owners/delegates, search
  operators, security/audit reviewers and source-domain owners
Source records: published domain objects and document/OCR versions with classification,
  authority revision, content anchors, provenance and deletion/revocation events
Outputs/consumers: authorized hits/snippets/highlights/facets/suggestions, result manifests,
  saved alerts/exports, projection health/failures and audit evidence
Decisions made: authorize before every observable output; recheck returned objects against
  current authority; fail closed on stale authority; index is a versioned projection;
  lexical retrieval is baseline and semantic retrieval is advisory/policy-gated
Open questions: production engine, approved analyzers/dictionaries, embedding deployment,
  relevance thresholds and representative English/Hindi evaluation corpus
Conflicts opened: C-033, C-034, C-035
Conflicts resolved: C-012, C-033, C-034; GAP-10-001 through GAP-10-007
Cross-domain scenarios tested: restricted-title/count inference, mandate expiry during paging,
  case reassignment, classification increase, partial indexing, OCR uncertainty, stale cache,
  source deletion, vector residue, export revocation and provider unavailability
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; implementation/evaluation dependency accepted
Documents created/changed: feature, logical model, API, gap audit, authorization, glossary,
  indexes, capability/inventory, decisions and tracker
Validation run/results: relative links passed across 109 Markdown files; diff check passed;
  12 audit sections, eight gap dispositions and 21 API route groups verified
Exit-gate result: PASS with C-035 accepted Waves 14/15 dependency
Next dependency: Wave 11 grievances and complaints
```

## 18. Wave 11 execution record

```text
Wave: 11 — Grievances and complaints
Status: COMPLETE (design; approved policy catalogue/live-adapter dependency explicit)
Started/updated: 2026-08-30
Requirements served: PS §4.8, §4.10–§4.15; CAP-09
Canonical dependencies read: official PS/solution context, identity/authority, authorization,
  workflow, incident, inspection, defect/CAPA, search and official DARPG/MoC/CIL/POSH/PIDPI sources
Domain boundary: low-barrier/protected intake, triage, conflict-aware route/assignment/transfer,
  case/action/response/disposition, reporter status, feedback/appeal, safeguarding,
  external reconciliation and privacy-safe patterns; no specialized authority impersonation
Actors/authorities: reporter/affected person/representative, assisted intake, nodal/triage and
  dealing officers, action owners, competent quality reviewer, appellate/specialized authority,
  reconciliation operator, privacy/records/security and auditor
Source records: immutable intake/statements/evidence, effective case/route/clock/projection policy,
  cross-domain business records and raw external events
Outputs/consumers: receipt/status, accountable case/actions, reviewed response/disposition,
  feedback/appeal, protection actions, external status and suppressed aggregate patterns
Decisions made: unified front door with per-case execution mode; reporter vault independent from
  operational case; accepted transfer/handover; immutable disposition/remediation/feedback/appeal;
  specialized early routing and no automated credibility/adverse decision
Open questions: approved case catalogue, post routes/clocks, exact POSH/PIDPI/industrial-relations
  boundary, disclosure/retention rules, CPGRAMS schemas/credentials and production adapters
Conflicts opened: C-036, C-037, C-038, C-039
Conflicts resolved: C-036, C-037, C-038; GAP-11-001 through GAP-11-007
Cross-domain scenarios tested: anonymous safety report, implicated manager, retaliation, special
  regime, duplicate external import, unaccepted transfer, officer vacancy, lost receipt/shared
  phone, partial response, false remediation, appeal, search leakage, small cohort and outage
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; authority/onboarding/Wave 12 dependency accepted
Documents created/changed: feature, logical model, API, gap audit, authorization, glossary,
  indexes, capability/inventory, solution-context conflict, decisions and tracker
Validation run/results: relative links passed across 113 Markdown files; diff check passed;
  12 audit sections, eight gap dispositions and 34 API route groups verified
Exit-gate result: PASS with C-039 accepted authority/integration dependency
Next dependency: Wave 12 integration platform
```

## 19. Wave 12 execution record

```text
Wave: 12 — Integration platform
Status: COMPLETE (design; live authority deployment and infrastructure dependency explicit)
Started/updated: 2026-08-30
Requirements served: expected unified integrations; PS §4.4, §4.7–§4.8, §4.13–§4.15; CAP-20
Canonical dependencies read: system landscape, domain dependency map, API conventions,
  reporting/regulatory/grievance/domain adapter boundaries and official GoI Open API/API Setu,
  CloudEvents, IETF HTTP/Problem Details and OpenTelemetry standards
Domain boundary: connector catalogue/version/approval/deployment, outbound/inbound transport,
  schemas/mappings/identifiers, credentials/consent, attempts/receipts/remote observations,
  polling/webhook/stream/bulk, reconciliation/dead letters and operations; no domain truth
Actors/authorities: domain/external owners, connector developer, security/privacy/legal approvers,
  deployment/credential/reconciliation operators, narrow service principals and auditors
Source records: immutable domain intents, external bytes/events/status, approved connector/schema/
  mapping/policy versions, credential references and operator evidence
Outputs/consumers: canonical domain handoffs, attempts/receipts/acknowledgements, mappings,
  reconciliation decisions, dead letters, checkpoints, health/SLO and audit
Decisions made: integration transports evidence while domains own meaning; outcome-unknown before
  unsafe retry; at-least-once plus dedup/reconciliation; namespaced identifiers; versioned
  connector semantics; vault references and separate operational/content authority
Open questions: provider schemas/semantics, credentials/network/sandboxes, sharing terms, SLAs,
  volume/capacity, alternate channels and production infrastructure per deployment
Conflicts opened: C-040, C-041, C-042, C-043
Conflicts resolved: C-040, C-041, C-042; GAP-12-001 through GAP-12-007
Cross-domain scenarios tested: timeout after commit, duplicate/out-of-order callback, ID collision,
  credential/consent expiry, HTML/200 error, schema drift, partial bulk, dead-letter replay,
  compromised connector, outage/manual continuity, telemetry gap and cross-tenant access
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; onboarding/Wave 15 dependency accepted
Documents created/changed: feature, logical model, API, gap audit, integration landscape,
  authorization, glossary, dependency/capability/inventory, indexes, decisions and tracker
Validation run/results: relative links passed across 117 Markdown files; diff check passed;
  12 audit sections, eight gap dispositions and 29 API route groups verified
Exit-gate result: PASS with C-043 accepted onboarding/Wave 15 dependency
Next dependency: Wave 13 analytics and AI governance
```

## 20. Wave 13 execution record

```text
Wave: 13 — Analytics and AI governance
Status: COMPLETE (design; representative data/model production-validation dependency explicit)
Started/updated: 2026-08-30
Requirements served: PS §4.10–§4.11 and expected AI/anomaly/predictive alerts; CAP-12/CAP-13
Canonical dependencies read: PRD/prototype/inventory, dashboard, defect/contractor/production/
  environment/incident/attendance/grievance/search/integration boundaries and IndiaAI/NIST guidance
Domain boundary: deterministic metrics/rules, anomaly/risk/forecast/recommendation, extraction/
  matching/semantic/generative use-case governance, data/features/labels, model/prompt/provider,
  evaluation/deployment/run/signal, review/contest, monitoring/drift/incident/retirement;
  no source fact, legal conclusion or autonomous adverse decision
Actors/authorities: domain/affected users, data/feature/label owners, developers/analysts,
  independent evaluators, privacy/security/legal/safety/model-risk approvers, operators,
  human and contest reviewers and auditors
Source records: approved versioned domain facts, manifests/features/labels, rules/models/prompts,
  authorized retrieval context, evaluations, reviewer outcomes and monitoring observations
Outputs/consumers: reproducible metrics, candidates, explained expiring signals, forecasts,
  recommendations/drafts, reviews/contests, drift and incident/retirement evidence
Decisions made: govern per use/decision influence; advisory immutable signals only; anomaly means
  unexpected not wrongdoing; point-in-time lineage; baseline/slice/harm/human release gates;
  authorization-aware grounded generation and no silent provider/model substitution
Open questions: approved production use cases, representative datasets/labels, harm/subgroup policy,
  operational thresholds, providers/models, localized evaluation and infrastructure capacity
Conflicts opened: C-044, C-045, C-046, C-047
Conflicts resolved: C-044, C-045, C-046; GAP-13-001 through GAP-13-007
Cross-domain scenarios tested: stale/missing source, temporal leakage, planned-shutdown anomaly,
  subgroup gap, upgrade, revoked access, prompt injection/hallucination, reviewer disagreement,
  provider outage, drift, incident suspension and reproducibility
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; Ministry/data/Waves 14–15 dependency accepted
Documents created/changed: feature, logical model, API, gap audit, authorization, glossary,
  capability/inventory, PRD/dashboard boundaries, indexes, decisions and tracker
Validation run/results: relative links passed across 121 Markdown files; diff check passed;
  12 audit sections, eight gap dispositions and 29 API route groups verified
Exit-gate result: PASS with C-047 accepted Ministry/data/Waves 14–15 dependency
Next dependency: Wave 14 localization, accessibility and assisted use
```

## 21. Wave 14 execution record

```text
Wave: 14 — Localization, accessibility and assisted use
Status: COMPLETE (design; content/research/STQC/production-evidence dependency explicit)
Started/updated: 2026-08-30
Requirements served: English/Hindi and multilingual roadmap, assisted/low-barrier access,
  GIGW/WCAG production quality; CAP-21; mobile scope clarification
Canonical dependencies read: PRD/workflow/dashboard/field/grievance/search/reporting/AI,
  architecture/mobile boundaries and official GIGW 3.0/WCAG 2.2/BHASHINI materials
Domain boundary: locales/terms/messages, source-linked translations/transcriptions,
  accessible derivatives/offline packs, web and inspector/field-worker mobile accessibility,
  assisted/kiosk/interpreter/voice sessions, testing/defects/exceptions/conformance;
  no business-state translation, source overwrite or other-role mobile commitment
Actors/authorities: users including disabled/low-literacy users, inspectors/field workers,
  assistants/interpreters/translators, domain/content/legal owners, testers/disabled-user
  participants, privacy/security and conformance authority
Source records: stable semantic values, source content/evidence, terminology/message versions,
  locale preference, translation/transcription/provider provenance and exact journey/build matrix
Outputs/consumers: accessible localized UI/content/documents, locale packs, assisted receipts,
  test/defect/retest/exception evidence and scoped conformance statements
Decisions made: inspectors/field workers only planned mobile users; others web/mobile TBD;
  locale-neutral semantics; immutable source-linked translation; GIGW 3.0 + WCAG 2.2 AA
  engineering target; conformance by evidence; assistance never shares user identity authority
Open questions: approved Hindi terminology/content, authoritative-language policies, user research,
  production browser/device/AT matrix, language providers and STQC/certification scope
Conflicts opened: C-048, C-049, C-050, C-051
Conflicts resolved: C-011, C-048, C-049, C-050; GAP-14-001 through GAP-14-007
Cross-domain scenarios tested: mid-form locale switch, stale legal translation, string/state bug,
  screen-reader/keyboard, TalkBack offline sync, reflow, Hindi IME/ID, helper abuse,
  low-confidence voice, colour-only map, provider outage, evidence derivative and mobile TBD route
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS; owners/STQC/Wave 15 dependency accepted
Documents created/changed: feature, logical model, API, gap audit, mobile scope, authorization,
  glossary, capability/inventory, PRD/workflow/dashboard/architecture, indexes, decisions/tracker
Validation run/results: relative links passed across 125 Markdown files; diff check passed;
  12 audit sections, eight gap dispositions and 25 API route groups verified
Exit-gate result: PASS with C-051 accepted content/research/STQC/Wave 15 dependency
Next dependency: Wave 15 cross-domain production hardening
```

## 22. Wave 15 execution record

```text
Wave: 15 — Cross-domain production hardening
Status: COMPLETE (design; production implementation/authority/certification explicitly incomplete)
Started/updated: 2026-08-30
Requirements served: PS §4.14 and every production NFR/trust boundary; CAP-16 plus
  implementation/release gates for CAP-01 through CAP-21
Canonical dependencies read: all wave deliverables, technical/legacy data model, authorization,
  dependency map, open/conflict ledger and official CERT-In/MeitY cloud+DR/OWASP standards
Domain boundary: artifact authority, environment/change/release, executable schema/API/event/
  policy gates, threat/security/privacy, typed audit/history, SLO/capacity, HA/backup/DR,
  observability/incidents, migration/cutover/retirement and operational readiness;
  no domain semantics or fabricated authority/approval
Actors/authorities: package/domain/data/API/event/policy owners, engineering/release/SRE/DBA,
  security/privacy/records/legal, migration/business/source owners, accessibility/model/
  integration approvers, incident command and audit
Source records: canonical contracts, signed artifacts/SBOM, migrations/schemas/policies/config,
  test/security/accessibility/load/restore/DR evidence, source snapshots and approvals
Outputs/consumers: release manifests/gates, audit/checkpoints/history, service objectives/capacity,
  restore/DR/incident evidence, migration dispositions/parity/cutover/retirement records
Decisions made: executable artifact authority; explicit transactional typed audit+outbox and
  independent checkpoints; scoped measured reliability; application-level restore/DR;
  manifest-bound migration reconciliation and evidence-gated progressive release/rollback
Open questions/blockers: Q-001 tenant governance, C-016 legal transition, real catalogues/
  connectors/workloads/SLO/RPO/RTO, implementation artifacts, security/STQC/model/language,
  source migration access and successful operational exercises
Conflicts opened: C-052, C-053, C-054, C-055
Conflicts resolved: C-015, C-052, C-053, C-054; GAP-15-001 through GAP-15-007 at design level
Cross-domain scenarios tested: migrations/RLS/concurrency, breaking contracts, revocation outage,
  audit tamper, restore reconciliation, dependency/zone/noisy tenant, secret compromise,
  malicious input, migration conflict, accessibility/security gate and rollback integrity
Pre-design gap-audit verdict: FAIL as expected; eight gaps recorded
Post-design adversarial verdict: CONDITIONAL PASS FOR DESIGN; external execution blocker explicit
Documents created/changed: hardening feature, audit/history model, platform API, gap audit,
  technical/legacy quarantine, authorization, glossary, capability/inventory, indexes,
  decisions and tracker
Validation run/results: relative links passed across 129 Markdown files; diff check passed;
  12 audit sections, eight gap dispositions and 24 API route groups verified;
  stale production capability/requirement coverage states reconciled
Exit-gate result: DESIGN PASS; NO PRODUCTION-LAUNCH CLAIM while C-055/Q-001/C-016 remain
Next dependency: implementation programme and authority/onboarding decisions, not another design wave
```

## 23. Per-wave update template

Copy this subsection beneath the active wave or into a linked working note. Do not mark the register row complete until every field is filled.

```text
Wave:
Status:
Started/updated:
Requirements served:
Canonical dependencies read:
Domain boundary:
Actors/authorities:
Source records:
Outputs/consumers:
Decisions made:
Open questions:
Conflicts opened:
Conflicts resolved:
Cross-domain scenarios tested:
Pre-design gap-audit verdict:
Post-design adversarial verdict:
Documents created/changed:
Validation run/results:
Exit-gate result:
Next dependency:
```

## 24. Programme completion condition

Production planning is complete only when every PS requirement row in §5 is `DESIGNED`, every wave is `COMPLETE`, every conflict is resolved or explicitly accepted by an identified decision owner, every durable decision is in the decision record, and every domain has canonical feature/data/API ownership plus cross-domain failure tests.

As of Wave 15, the design wave register is complete, but the programme is not production-launch ready: Q-001, C-016 and C-055 require Ministry/authority decisions and executable evidence. Accepted risks remain onboarding/release gates and must be assigned to named human owners before launch.

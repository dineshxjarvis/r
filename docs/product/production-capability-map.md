# Strata — Production Capability and Requirement Map

## 1. Purpose

This is the canonical production capability map for PS 26024. Read it before adding a feature, domain, API group, dashboard metric, integration, or delivery wave. It answers which required capability exists, which domain owns its authoritative state, which domains may consume it, and where design remains incomplete.

Prototype sequencing does not change ownership or make a production requirement optional. Detailed lifecycle rules remain in the linked feature and architecture specifications.

## 2. Ownership rules

- One domain owns each authoritative record and its lifecycle.
- A dashboard, search index, report, AI signal, or integration is a projection unless explicitly named as the source system.
- Workflow transports assignments, approvals, notifications, and timers; it does not own the business state that caused them.
- Evidence supports a claim; it does not by itself decide compliance.
- Identity answers who authenticated. Authorization decides whether that principal may act on the target now.
- External legal decision rights remain with the competent authority even when Strata provides the unified experience.

## 3. Capability map

| ID | PS source | Production capability | Authoritative domain | Primary records | Design state | Wave |
|---|---|---|---|---|---|---:|
| CAP-01 | §4.1 | Compliance obligation register | Compliance | obligation, applicability, due instance | Designed; approved legal catalogue/executable implementation pending | 1/8/15 |
| CAP-02 | §4.2 | Inspection planning and execution | Inspections | request, inspection, team, visit, checklist, report | Designed | Foundation |
| CAP-03 | §4.2–§4.3 | Observation, defect, finding and CAPA | Defect management | observation, defect, finding, CAPA, verification | Designed; executable implementation pending | 1/2/15 |
| CAP-04 | §4.2/§4.4 | Offline field capture, incidents and evidence | Incident + field operations/evidence | incident report, emergency, notification, capture package, evidence | Designed; mobile/device/legal deployment pending | 2/6/14/15 |
| CAP-05 | §4.5 | Contractor compliance | Contractor management | engagement, work package, requirement, eligibility, attribution, performance | Designed; legal catalogue/adapters pending | 5 complete |
| CAP-06 | §4.6 | Attendance, movement and muster | Attendance | presence event, shift, zone transition, reconciliation, register, muster | Designed; device/deployment approval pending | 6 complete |
| CAP-07 | §4.7 | Production, dispatch and stock | Production reporting | production fact, dispatch fact, stock balance, reconciliation | Designed; source onboarding/executable implementation pending | 3/12/15 |
| CAP-08 | §4.7 | Environmental monitoring | Environment | programme, limit binding, sample, result, evaluation, exceedance case | Designed with deployment dependencies | 4/8/12 |
| CAP-09 | §4.8 | Grievances and complaints | Grievance management | protected intake, case, action, disposition, feedback, appeal | Designed; authority catalogue/adapters pending | 11 complete |
| CAP-10 | §4.9 | Document digitisation | Documents | document, version, extraction, review, provenance | Designed | Foundation |
| CAP-11 | §4.9 | Authorization-aware search | Search | projection/checkpoint, authorized query, provenance, saved alert/export, tombstone | Designed; engine/relevance evaluation pending | 10 complete |
| CAP-12 | §4.10 | Analytics, anomaly and risk signals | Analytics/AI governance | use case, dataset/feature, model/evaluation, run, signal, explanation, feedback/contest | Designed; real model/data approval pending | 13 complete |
| CAP-13 | §4.11 | Three-altitude dashboards | Dashboard/read models | metric definition, manifest, projection | Designed; production metric/evaluation implementation pending | 1/13/15 |
| CAP-14 | §4.12 | Routing, approvals and escalation | Workflow | route, work item, approval, notification, timer | Designed; executable delivery/policy tests pending | 1/12/15 |
| CAP-15 | §4.13 | Statutory reports and returns | Reporting | definition, source binding, validation, attestation, package, filing status | Designed; adapters/profiles pending | 8 complete |
| CAP-16 | §4.14 | Audit and historical reconstruction | Audit/governance | typed domain/security/access event, checkpoint, reconstruction, verification | Designed; executable implementation pending | 15 complete design |
| CAP-17 | §4.15 | Identity, authority and multi-site access | Identity/access control | principal, affiliation, post, appointment, mandate, jurisdiction | Designed | Foundation |
| CAP-18 | §4.16 | GIS and spatial governance | Geospatial | source assertion, governed geometry, topology, layer/version, evaluation | Designed; agency feeds/onboarding pending | 7 complete |
| CAP-19 | Expected | Applications, clearances and regulatory cases | Regulatory case management | service/assessment, application, case, exchange, decision, instrument | Designed; service catalogue/adapters pending | 9 complete |
| CAP-20 | Expected | External-system exchange and reconciliation | Integration platform | connector/deployment, exchange/attempt, acknowledgement, mapping, reconciliation | Designed; live deployments require authority onboarding | 12 complete |
| CAP-21 | Cross-cutting | Localization, accessibility and assisted use | Experience platform | terminology/translation, locale pack, assisted session, accessibility evidence/conformance | Designed; content/research/certification pending | 14 complete |

## 4. Source-of-truth boundaries

| Information | Owner | Consumers | Must not become a second owner |
|---|---|---|---|
| Person, principal and current authority | Identity/access control | Every protected domain | Cookie, workspace, inspection team role |
| Mine and asset identity | Foundation/mine registry | Every operational domain | GIS layer, report template, adapter |
| Legal duty and applicability | Compliance | Inspections, reports, dashboards, AI | Unreviewed extracted text |
| Inspection execution and issued report | Inspections | Defects, reporting, dashboards | Generic workflow task |
| Physical problem identity | Defect management | Inspection, incident, CAPA, analytics | Individual observation |
| Event and emergency response | Incident management | Inspection, reporting, analytics | Observation or finding |
| Evidence bytes and integrity verdict | Evidence | Compliance, CAPA, incident, reporting | Domain attachment copies |
| Production/dispatch/stock facts | Production reporting | Reports, dashboards, analytics | Uploaded return or dashboard cache |
| Environmental facts and limits | Environment | Compliance, reports, dashboards, analytics | PDF text or sensor feed alone |
| Submission and authority acknowledgement | Reporting/cases | Compliance, dashboards, audit | Adapter transport success |
| Notification delivery and acknowledgement | Workflow | All initiating domains | Business completion state |
| Search result | Source domain named by result | Users and assistants | Search index |
| Metric or signal | Analytics/read model | Dashboards, alerts | Source-domain fact |
| External transport/mapping/reconciliation | Integration platform | Operational domains and operators | Domain business status or external payload shape |

## 5. End-to-end production chains

Every production capability must attach to at least one chain. A module that cannot name its input and accountable output is not integrated.

```text
authority source → document → reviewed obligation → applicable due instance
→ assigned work → evidence/filing → independent verification
→ accepted or corrective action → statutory output → portfolio decision
```

```text
inspection request/notice → authorised plan → accepted assignment team
→ visit/checklist/evidence → issued report → observation/incident/finding
→ containment/CAPA → verification → authority-appropriate closure
```

```text
operational source → validated fact → discrepancy reconciliation
→ statutory report binding → signature → submission
→ authority acknowledgement → obligation/reporting status
```

## 6. Traceability contract

All future canonical feature specifications must state the `CAP-*` IDs and PS sections served; records owned and referenced; upstream sources and downstream consumers; capabilities and targets; emitted/consumed events; dashboard/search/report/audit projections; and unresolved tracker conflicts or decisions.

A capability is `DESIGNED` only when feature behaviour, logical data ownership, authorization targets, APIs or explicit interface boundaries, failure recovery, and acceptance tests agree. A checkbox or presentation slide is insufficient.

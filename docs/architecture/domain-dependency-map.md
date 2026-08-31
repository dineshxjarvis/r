# Strata — Production Domain Dependency Map

## 1. Purpose

This map controls dependency direction and integration ownership. Read it before adding a cross-domain foreign key, synchronous call, event consumer, report binding, dashboard projection, search index, or AI feature.

## 2. Dependency layers

```text
L0  Identity, authority, tenant, organization, mine/asset registry
                         ↓
L1  Documents/evidence, workflow primitives, audit/event transport
                         ↓
L2  Compliance, inspections, incidents, defects/CAPA, contractors,
    attendance, production, environment, GIS, grievances, regulatory cases
                         ↓
L3  Integration transport/reconciliation and statutory reporting
                         ↓
L4  Search, dashboards, analytics/AI and assisted experiences
```

Dependencies normally point downward. L4 never becomes authoritative for L2 facts. Workflow may deliver a request back to L2, but the initiating domain owns whether business state changes.

## 3. Domain edges

| Provider | Consumer | Boundary contract | Failure posture |
|---|---|---|---|
| Identity/access | All domains | principal, decision, scope, supporting authority | Fail closed; never trust workspace/cookie claims |
| Mine/asset registry | Operational domains | stable resource ID and relationships | Reject retired target or preserve historical reference |
| Documents | Compliance/cases/reporting | immutable version, candidate, provenance | No legal fact without review |
| Evidence | Compliance/inspection/incident/CAPA | evidence reference and verdict | Preserve unsupported/unverified state |
| Workflow | Initiating domains | assignment, delivery, acknowledgement, timer | Retry delivery; domain state remains authoritative |
| Inspections | Defects/incidents/reporting | issued report, observations, event links | Partial work remains explicit and recoverable |
| Compliance | Inspections/reporting/analytics | published duty, applicability, due instance | Unresolved applicability is visible |
| Incident | Reporting/inspection/analytics | event, consequence, notification state | Emergency actions do not wait for classification |
| Operational fact domains | Reporting/analytics | validated facts, provenance, reconciliation | Disagreement becomes a discrepancy |
| GIS | Operational domains | versioned geometry and evaluation | Retain geometry/version used historically |
| Grievances | Incident/inspection/defect/action domains | immutable intake link, requested handoff and safe reporter projection | Safety work proceeds independently; grievance cannot forge remediation truth |
| Operational domains | Grievances | current linked-record/action projection and verification state | Missing/stale state is explicit; never copy a mutable closed flag |
| Reporting/cases | Compliance/dashboard | payload, signature, transport, acknowledgement | Transport success is not legal acceptance |
| Domain owners | Integration | immutable intent/canonical contract and allowed transition semantics | Domain commit survives transport failure |
| Integration | Domain owners | authenticated canonical event, source evidence, mapping/freshness | Domain validates idempotently; never accepts provider shape directly |
| Source domains | Search/dashboard/AI | outbox events and authorized projections | Expose freshness/data gaps |
| Analytics/AI | Workflow/humans | signal, explanation, lineage, version | Advisory until governed acceptance |

## 4. Cross-domain transaction rule

The command-owning domain commits its authoritative change, audit record, and outbox event atomically. Consumers are idempotent and checkpointed. Consumer failure does not roll back a valid source decision; it creates retry and freshness state. Distributed dual writes are prohibited.

Where an immediate decision needs another domain, use a narrow query contract with timeout and explicit unavailable behaviour. Do not copy mutable authority, compliance, or closure state merely to avoid failure handling.

## 5. Cycle breakers

- Workflow routes work; it does not mark initiating records complete automatically.
- Dashboards, search and AI consume projections; source domains never query them to validate facts.
- Reports bind versioned source facts; source domains do not depend on generated reports.
- Inspection may link an incident, but incident classification/emergency lifecycle remains incident-owned.
- CAPA may reference evidence, while evidence remains neutral about CAPA acceptance.
- Grievances coordinate redress and reporter communication; linked operational domains own incident, finding, action and verification truth.
- Integrations translate and reconcile; external payload shape does not become the internal domain model.
- Connector code depends on canonical domain contracts; domains do not import provider SDK/types into their models.

## 6. Required boundary tests

1. Authorization projection is stale after appointment revocation: current canonical facts deny.
2. Workflow delivery fails after source commit: delivery retries and source state remains visible.
3. Evidence syncs after target supersession: preserve and route; never silently reattach.
4. Submission has transport success but no authority acknowledgement: remain pending acknowledgement.
5. Search/dashboard lags: return freshness and do not claim completeness.
6. Two sources disagree on production: create discrepancy; never silently overwrite.
7. GIS boundary changes after capture: history retains the evaluated geometry/version.
8. AI is unavailable or version changes: core workflows continue and decisions retain lineage.
9. Grievance handler is implicated or leaves office: alternate route accepts responsibility while the original clock/history remains.
10. Grievance is disposed while linked remediation remains open: response shows permitted outstanding state and never claims verification.
11. Outbound timeout follows possible remote commit: reconcile before any unsafe retry.
12. Duplicate/out-of-order inbound event: retain evidence, deduplicate and apply only under source-version policy.

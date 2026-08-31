# Endpoint index

Conventions — envelope, query grammar, action envelope, status codes, pagination, idempotency, concurrency — are declared **once** in [`../README.md`](../README.md) and never repeated per file. 🔒 = session cookie required.

Read [`identity/foundation.md`](identity/foundation.md) first. It defines the resource ownership and the capability-resolution rule that every other file depends on.

## How to read a file

Every endpoint file has the same three parts:

1. **A route table.** Four core forms per resource: `GET /{collection}`, `GET /{collection}/{id}`, `POST /{collection}`, `POST /{collection}/{id}/actions`, plus `PATCH`, `/history`, and collection-level `/actions` where the domain permits them. Clustered interfaces use a registered `view` or `purpose` only when the contract-wide clustering rules permit it. Each table also lists the routes that **do not** exist and what replaced them.
2. **An action vocabulary table per resource.** Action name, required capability, whether `reason` is mandatory, whether `expected_version` is mandatory, the state precondition, and the declared effects.
3. **Exact request and response bodies.** Every field, every time — no "same shape as X" shorthand, even for plain CRUD, and including the error bodies that matter.

Each file closes with an **invariants** list: the rules the contract exists to hold, stated so a reviewer can check the implementation against them.

## Cross-domain reads that are not routes

| You want | It is |
|---|---|
| A sub-resource | `?expand=` on the parent, or the child collection filtered by the parent id |
| A "list by parent" endpoint | `GET /{child}?filter[parent_id]=…` |
| Anything as it stood on a past date | `?as_of=` on the resource |
| The change record for anything | `GET /{collection}/{id}/history` |
| An aggregate, summary, or count | `?group_by=…&metrics=…` on the owning collection |
| A saved server-side view | `?view=…`; `GET /views` lists them |
| Similar projections of one read model | One collection with a registered `?view=…` value |
| The same upload transport for different content purposes | `POST /uploads` with a registered `purpose` value |
| Async job status, anywhere | `GET /operations/{id}` |
| Field meanings, enum labels, permitted actions | `GET /schemas/{object}`, `GET /enums/{name}`, `GET /capabilities?resource=…` |

---

## `identity/` — the foundation

| File | Owns |
|---|---|
| [`identity/foundation.md`](identity/foundation.md) | Canonical resource, route, and action map; capability resolution; decision examples |
| [`identity/auth.md`](identity/auth.md) | Sessions, step-up, current principal, selected context |
| [`identity/people.md`](identity/people.md) | People, affiliations, principals, authenticators, signing identities |
| [`identity/organizations.md`](identity/organizations.md) | Tenants, organisations (operator, contractor, regulator, ministry), units, asset responsibility, regulatory authorities |
| [`identity/mines.md`](identity/mines.md) | Mines, subunits, assets |
| [`identity/posts.md`](identity/posts.md) | Position templates, capability policies, concrete posts |
| [`identity/appointments.md`](identity/appointments.md) | Appointments, mandates, mandate assignments, jurisdiction assignments |
| [`identity/contractors.md`](identity/contractors.md) | Contractor engagements and record-party historical access |
| [`identity/responsibility-routes.md`](identity/responsibility-routes.md) | Notification and work routing; never authority |

## `documents/` — `data-model.md §2`

| File | Owns |
|---|---|
| [`documents/documents.md`](documents/documents.md) | Blobs, documents, versions, filings, segments, and the `DOCUMENT_ORIGINAL` upload purpose |
| [`documents/extractions.md`](documents/extractions.md) | Extraction review: accept, edit, reject, not-applicable, split, merge, flag |
| [`documents/obligations.md`](documents/obligations.md) | Obligation register, applicability resolution, instance lifecycle, NIL returns |
| [`documents/obligation-conflicts.md`](documents/obligation-conflicts.md) | Conflict review queue; never edits a live obligation |

## `defects/` — `data-model.md §3`

| File | Owns |
|---|---|
| [`defects/observations.md`](defects/observations.md) | Field intake, candidate matching, match decision |
| [`defects/defects.md`](defects/defects.md) | The physical problem record, ageing, merge, split, reclassification |
| [`defects/findings.md`](defects/findings.md) | Findings, regulator provenance, frozen closure policy |
| [`defects/capas.md`](defects/capas.md) | CAPA lifecycle and the `can_close_with()` evidence gate |

## `evidence/` — `data-model.md §4`

| File | Owns |
|---|---|
| [`evidence/evidence.md`](evidence/evidence.md) | Offline-first capture, the `EVIDENCE_CAPTURE` upload purpose, sync, verdict, download, override |
| [`evidence/verification-attempts.md`](evidence/verification-attempts.md) | Read-only record of every closure attempt, blocked or accepted |
| [`evidence/attendance.md`](evidence/attendance.md) | **Withdrawn.** Superseded by `attendance/attendance.md`; retained as provenance with a migration map |

## `workflow/` — `data-model.md §4.6`

| File | Owns |
|---|---|
| [`workflow/notifications.md`](workflow/notifications.md) | Inbox, acknowledge versus action, receipt-only delegates |
| [`workflow/approvals.md`](workflow/approvals.md) | Approval requests and decisions by current post holders |

## `dashboard/` — `data-model.md §5`, `§6`

| File | Owns |
|---|---|
| [`dashboard/dashboard.md`](dashboard/dashboard.md) | The four compliance measures at any scope, personal queue, metric manifests |
| [`dashboard/audit.md`](dashboard/audit.md) | Audit events and the access log, including denied reads |

## Operational domains

| File | Owns |
|---|---|
| [`inspections/inspections.md`](inspections/inspections.md) | Intake, versioned team assignment, visits, checklist, report, issue, closure |
| [`incidents/incidents.md`](incidents/incidents.md) | Intake, classification, emergency command, containment, casualties, statutory notice, investigation, completion |
| [`production/production.md`](production/production.md) | Material events, measurement, dispatch, stock, discrepancies, approved facts |
| [`environment/environment.md`](environment/environment.md) | Programmes, limit bindings, samples and custody, instruments, evaluation, exceedance cases, period release |
| [`contractors/compliance.md`](contractors/compliance.md) | Work packages, subcontracts, requirements, eligibility, exceptions, access receipts, attribution, performance |
| [`attendance/attendance.md`](attendance/attendance.md) | Shifts, credentials, presence events, corrections, statutory register, emergency muster |
| [`geospatial/geospatial.md`](geospatial/geospatial.md) | Sources, imports, governed geometry versions, topology, surface models, evaluation, offline packages |
| [`reporting/reporting.md`](reporting/reporting.md) | Definitions, compilation, attestation, filing, receipts, authority status, corrections |
| [`regulatory-cases/cases.md`](regulatory-cases/cases.md) | Service discovery, applications, native and federated cases, decisions, instruments |
| [`search/search.md`](search/search.md) | Authorization-aware query, saved searches, alerts, exports, index control, tombstones |
| [`grievances/grievances.md`](grievances/grievances.md) | Protected intake, reporter vault separation, routing, redress, disposition, appeal, oversight |
| [`integrations/integrations.md`](integrations/integrations.md) | Connector governance, exchanges, ingress, mapping, dead letters, reconciliation, bulk |
| [`analytics/analytics-ai.md`](analytics/analytics-ai.md) | Metric and AI use-case governance, data, models, signals, monitoring, incidents |
| [`experience/experience.md`](experience/experience.md) | Locale, terminology, translation, assisted use, accessibility conformance |
| [`platform/platform-operations.md`](platform/platform-operations.md) | Release evidence, audit verification, retention, reliability, migration, cutover, operational incidents |

---

## Contract-wide rules worth knowing before you read any file

These recur in every domain, so they are stated once here and enforced in each file's invariants.

- **A claim needs its own evidence.** "We sent it", "they received it", and "they accepted it" are three separate states with three separate evidence requirements. Transport success never populates the third.
- **Nothing is deleted.** Revocation, supersession, withdrawal, tombstoning, and disposal-under-policy replace it. A correction appends and references what it corrects.
- **Derived state is derived.** Interval-based states (`affiliation`, `appointment`), ageing bands, coverage, and projections are computed at read time, and every projection reports its lag.
- **A gap is a gap.** Missing coverage produces `UNKNOWN` or `INDETERMINATE`, never an inferred pass. A rate over an empty denominator is `null`, never `0` or `1`.
- **Overrides are loud.** Every one carries a reason, a corroborating reference, a `security_event`, and the record of what it overrode.
- **Separation of duties is enforced, not advised.** Verifier ≠ submitter, approver ≠ proposer, reviewer ≠ author, and the denial names the rule.
- **Clipped results say so.** A partially authorized list warns and reports requested versus effective scope rather than returning a silently short answer.

# Endpoint consolidation audit

This audit covers every endpoint card under `endpoints/`. It favors filters, expansions, aggregates, named views, action values, and shared transport endpoints. It deliberately does not introduce generic domain routers or `kind` query parameters.

`Keep separate` means the records have a different lifecycle, authorization target, evidence meaning, transaction boundary, or retention rule. Similar names alone are not enough to merge them.

## Contract-wide defects corrected

- ULID is now the only identifier format. All 3,253 concrete examples use a 26-character Crockford Base32 suffix and exclude `I`, `L`, `O`, and `U`.
- The contract now distinguishes four core route forms from the three optional companions instead of calling all seven “four routes.”
- Shared upload initiation uses one `/uploads` transport with purpose-specific authorization and schemas.
- Every retired path has one canonical replacement; compatibility aliases are gateway concerns and must not become parallel application routers.
- A view may change projection shape only when the owning read model, authorization, freshness, and pagination semantics remain the same.

## Foundation and cross-cutting cards

| Card | Result |
|---|---|
| `README.md` | Shared replacement rules are centralized here; no runtime route. |
| `identity/foundation.md` | Keep the canonical identity resources separate; they are distinct authorization graph nodes. Parent-specific reads already use filters or expansion. |
| `identity/auth.md` | Already consolidated: every authentication method uses `POST /auth/sessions` with `method`; session revocation uses actions. Keep `/users/me` as the current-principal boundary. |
| `dashboard/audit.md` | Keep audit events and access logs separate because access logs include denied reads and have stricter disclosure policy. Temporal state already uses `as_of` and `/history`. |
| `evidence/attendance.md` | Withdrawn provenance only; no live routes to consolidate. |

## Identity

| Card | Result |
|---|---|
| `identity/people.md` | Keep people, affiliations, principals, authenticators, and signing identities separate; identity, employment interval, login, credential, and signature authority are different security objects. Nested reads already use filters/expansion. |
| `identity/organizations.md` | Keep tenants, organizations, units, responsibilities, and regulatory authority records separate; merging them would blur isolation and jurisdiction. Contractor organizations already use `filter[organization_type]`. |
| `identity/mines.md` | Keep mines, subunits, and assets separate because mine authority, spatial hierarchy, and maintainable assets have different policies. Parent lists already use filters. |
| `identity/posts.md` | Keep templates, capability policies, and posts separate so a reusable definition cannot be mistaken for a currently held authority. Current holders are an expansion/filter, not a route. |
| `identity/appointments.md` | Keep appointments, mandates, mandate assignments, and jurisdiction assignments separate; capability and coverage must remain independently auditable. Effective authority is an expansion. |
| `identity/contractors.md` | Contractor organizations are filtered organizations; record-party access is exposed as `GET /contractor-engagements?view=record_parties` while remaining a separate temporal grant schema. |
| `identity/responsibility-routes.md` | Already one collection with actions; no reduction available without merging routing with legal authority, which is forbidden. |

## Documents, defects, evidence, and workflow

| Card | Result |
|---|---|
| `documents/documents.md` | Applied shared `POST /uploads` with `purpose: DOCUMENT_ORIGINAL`; cross-document segments use `GET /documents?view=segments` and processing jobs use `/operations`. Documents and filings remain distinct facts. |
| `documents/extractions.md` | Already one review collection; all decisions and bulk decisions use actions. |
| `documents/obligations.md` | Applicability-rule reads use `GET /obligations?view=applicability_rules`. Definitions and period instances remain separate because a rule and due occurrence have different temporal meaning. |
| `documents/obligation-conflicts.md` | Already one queue with item and bulk actions; summaries use aggregation. |
| `defects/observations.md` | Already one collection; candidate matching is expansion and decisions are actions. |
| `defects/defects.md` | Already one collection; findings and observations are filtered child collections, while merge/split/reclassify/close are actions. |
| `defects/findings.md` | Already one collection; CAPAs are filtered children and lifecycle changes are actions. |
| `defects/capas.md` | Already one collection with bulk actions and evidence expansion. Verification attempts remain immutable evidence of closure gates. |
| `evidence/evidence.md` | Applied shared `POST /uploads` with `purpose: EVIDENCE_CAPTURE`; download URL issuance remains an audited action and offline sync remains an explicit idempotent transport exception. |
| `evidence/verification-attempts.md` | Exposed as `GET /evidence?view=verification_attempts` with nested item reads; the immutable attempt schema remains distinct from evidence objects. |
| `workflow/approvals.md` | Already one collection with item and bulk actions. |
| `workflow/notifications.md` | Keep notifications and receipt-only delegates separate; one is generated work, the other is routing configuration. Both already use actions. |

## Operational domains

| Card | Result |
|---|---|
| `attendance/attendance.md` | Applied presence/session views on `/presence-events` and topology on `/checkpoint-devices`. Keep corrections, registers, credentials, exceptions, and muster separate because they have different evidentiary and emergency roles. |
| `contractors/compliance.md` | Applied definition and attribution views on their owning policy/performance collections. Keep packages, assignments, eligibility decisions, exceptions, receipts, and disputes separate; these distinguish decision, gate act, responsibility, and challenge. |
| `inspections/inspections.md` | Applied inspection type/version views directly on `/inspections`. Requests, assignments, visits, responses, and reports remain separate workflow records; verb routes are already actions. |
| `incidents/incidents.md` | Keep report, confirmed incident, classification, emergency activation, containment, people, notice, investigation, and learning records separate; each proves a different safety or statutory fact. Commands already use actions. |
| `production/production.md` | Applied catalogue and lot views on material events plus approved-fact views on periods. Keep measurements, processing, dispatch, snapshots, adjustments, and discrepancies separate. |
| `environment/environment.md` | Applied the configuration catalogue as a monitoring-program view. Keep raw observations, validated results, samples, lab analyses, evaluations, exceedance cases, and released periods separate to preserve chain of custody and validation. |
| `geospatial/geospatial.md` | Applied current governed-geometry and reference-system views. Keep sources, assertions, resolutions, topology, models, derived products, evaluations, and compositions separate; authority and derivation provenance differ. Feature and health reads use filters/aggregates. |
| `reporting/reporting.md` | Applied `GET /report-definition-versions?view=current`. Keep obligation, compilation, validation, package, submission, reconciliation, and impact records separate; sent, received, and accepted cannot be merged. |
| `regulatory-cases/cases.md` | Applied current views over service and instrument version collections. Keep applications, cases, requirements, content versions, assignments, query rounds, events, recommendations, decisions, and reconciliation separate. |
| `grievances/grievances.md` | Applied current case-type versions and `GET /grievance-cases?view=oversight`; routing exceptions use filters and timeline uses history. Keep intake, protected receipt, case, transfer, identity-access receipt, response, disposition, appeal, and safeguarding records separate for privacy and independence. |

## Control planes and projections

| Card | Result |
|---|---|
| `dashboard/dashboard.md` | Applied `GET /dashboard?view=measures|personal_queue`; domain summaries remain aggregates on owning collections. |
| `search/search.md` | Search modes share `POST /search-sessions`; suggestions use `/search?view=suggestions` and alert runs use `/saved-searches?view=alert_runs`. Keep exports, index failures, and tombstones as durable control records. |
| `integrations/integrations.md` | Applied ingress and health views on `/integration-exchanges`. Keep systems, connector versions/deployments, attempts, mappings, dead letters, reconciliation, and transfer records separate. Ingress submission remains an explicit transport exception. |
| `analytics/analytics-ai.md` | Applied monitoring/run-lineage views on deployments and moved label assertion creation to a dataset action. Keep use-case, dataset, feature, model, prompt, provider, evaluation, signal, drift, and incident records separate for lineage and approval. |
| `experience/experience.md` | Applied the published view on translation candidates and moved locale discovery to `/enums/locale`. Keep terminology/message versions, translation jobs, staleness events, assisted sessions, transcriptions, derivatives, tests, defects, exceptions, and conformance statements separate. |
| `platform/platform-operations.md` | Applied retention-policy and migration-row views on their owning collections. Keep releases, gates, exceptions, deployments, audit verification, holds/disposal, recovery exercises, cutovers, and incidents separate because each is durable operational evidence. |

## Completion rule

The audit is complete when every endpoint card appears above, every removed route has one canonical replacement in the contract, and no consolidation combines records with different authorization targets or evidentiary claims.

# Strata — Presentation-Level Technical Requirements and Design

## 1. Technical objective

Build a secure, offline-capable, multi-tenant platform where canonical domain records, authorisation relationships, immutable source/evidence objects and dashboard projections remain distinct but connected through stable identifiers and audited events.

## 2. Architecture principles

1. Canonical domain state has one owner.
2. Original source/evidence bytes never change.
3. AI output is a proposal with provenance.
4. Authority is checked at action time.
5. Offline capture commits locally before network work.
6. Events/outbox connect write models to projections and integrations.
7. Missing/uncertain data remains explicit.
8. Prototype adapters may be simulated; interfaces remain replaceable.
9. Every material conclusion is traceable.
10. Security and tenancy use defence in depth.

## 3. Recommended prototype stack

Final choice should respect whatever package manifests the implementation repository adopts.

| Layer | Recommendation | Reason |
|---|---|---|
| Web | Modern typed web framework | Fast dashboard/review development |
| Mobile | Flutter + PowerSync SDK | Planned only for inspectors and field workers: offline/device/GNSS capture and Postgres-backed sync buckets (`data-model.md §4`); every other persona/page is TBD |
| API | Typed backend framework | Shared validation and OpenAPI generation later |
| Database | PostgreSQL + spatial extension | Transactions, RLS, GIS-ready records |
| Objects | S3-compatible storage | Immutable documents/evidence |
| Authorisation | OpenFGA-compatible relationship engine | Hierarchy, appointments, contractor/regulator scope |
| Jobs | Durable queue/workers | OCR, AI, notifications and integrations |
| Cache/read models | Redis or equivalent | Dashboard projection/performance |
| OCR | Layout-aware OCR adapter | Scans and provenance boxes |
| AI | Provider-independent server gateway | Gemini/Groq today, governed alternatives later |
| Maps | Web map library + spatial queries | Field points and mine geometry |

## 4. Domain boundaries

| Domain | Owns |
|---|---|
| Directory/configuration | People, posts, appointments, operators, mines, assets |
| Applications | Unified application/submission cases and external references |
| Documents | Original files, versions, processing and review |
| Obligations | Obligation definitions, applicability and instances |
| Defects | Observations, defects, findings, CAPAs and verification |
| Evidence | Captures, metadata, verdicts and bindings |
| Workflow | Rules, notifications, delivery, acknowledgement and approvals |
| Analytics | Versioned metrics, risk/recurrence/anomaly signals |
| Audit | Material events, purpose logs, integrity anchors and time travel |
| Integration | External identity mapping, adapters, cursors and reconciliation |

## 5. Canonical storage model

- PostgreSQL stores transactional metadata and domain state.
- Object storage stores immutable original documents/media by content hash.
- Relationship engine stores only authorisation relations, not full business objects.
- Search/vector index stores rebuildable discovery/similarity projections.
- Dashboard projections/cache are rebuildable from canonical events.

## 6. Reliability pattern

Every material transaction writes:

1. domain change;
2. audit event; and
3. outbox event

in one database transaction. Workers publish outbox events to downstream projections, notifications and integrations. Consumers are idempotent.

This prevents “record saved but alert lost” and “portal updated but dashboard never changed” classes of failure.

## 7. Offline design

- Local relational database stores assigned tasks, reference data and captures.
- Capture and media hash commit atomically to local storage.
- Outbox entries have stable client-generated IDs.
- Chunked/resumable media upload.
- Per-record server acknowledgement.
- Append-only evidence avoids edit conflicts.
- Business-record conflicts retain both versions and require deterministic merge/review.
- Schema version travels with each queued record.

## 8. Authorisation design

The canonical identity, session, tenancy, appointment, mandate, and jurisdiction model is [`identity-authority-model.md`](identity-authority-model.md). This section describes deployment mechanics only and must not redefine those concepts.

Authentication proves identity. ReBAC decides scope/action.

Authorisation input includes:

- actor;
- requested relation/action;
- target object;
- current time;
- appointment/engagement relationships; and
- application-owned state checks such as severity/status.

The application chooses the required permission based on domain state, then queries the relationship engine. Separation-of-duty checks compare actual actors in the application layer.

## 9. AI orchestration

Pipeline:

```text
validated input
→ redaction/minimisation
→ task-specific prompt/schema
→ provider call
→ JSON/schema validation
→ grounding/provenance validation
→ confidence/review priority
→ human review
```

Store:

- provider/model/version;
- prompt template version;
- input document/segment hashes;
- raw structured proposal;
- validation failures;
- reviewer corrections; and
- latency/token/cost metadata.

Provider fallback occurs only for supported task/schema equivalence. Exhausted quotas create queued/delayed states, not uncontrolled key cycling.

## 10. Integration transition pattern

Each adapter owns:

- external system and version;
- credentials/authorisation;
- external-to-Strata identity mapping;
- import/export schema mapping;
- cursor/watermark;
- idempotency key;
- reconciliation status;
- provenance and last successful sync; and
- dead-letter/manual recovery.

Native and federated cases look unified to the user but remain visibly distinguished for legal submission status.

## 11. Dashboard projection

Canonical events update read-optimised projections. Each rendered official/drilled metric can produce a manifest containing definition version, scope, time, numerator/denominator record references, exclusions and source watermarks.

Projection lag is visible. Errors never fall back to zero.

## 12. Security baseline

- Server-side secrets only
- TLS in transit and encryption at rest
- Tenant row-level security plus ReBAC
- Least-privilege service identities
- Malware/MIME validation for uploads
- Signed/expiring object access URLs
- Immutable/audited administrative actions
- Purpose logging and redaction for regulators
- Key management and rotation through approved secret store
- No sensitive document payload in push/SMS/email
- Backup restore tests and disaster-recovery objectives for production

## 13. Prototype versus production

| Concern | Prototype | Production |
|---|---|---|
| Availability | Single environment, recoverable | HA/multi-zone with defined SLOs |
| External systems | Mock/recorded adapters | Agreements, live APIs, reconciliation |
| Identity | Seeded accounts | Government/enterprise identity federation |
| Signatures | Simulated signed manifest | Approved DSC/eSign providers |
| Evidence | GPS/accuracy/direct capture | Attestation, raw GNSS, TSA and stronger keys |
| AI | Hosted provider APIs | Approved data boundary/local options |
| Scale | Three mines | All operators/mines, capacity-tested |
| Observability | Core logs/health | Central metrics/tracing/SIEM/SOC |

## 14. Technical proof points for the demo

- Original source hash and highlighted provenance anchor
- Validated AI structured output plus human correction
- Same permission query allowed before appointment expiry and denied after
- Offline capture visible before and after sync
- Location mismatch calculation and closure block
- Outbox-driven notification/dashboard update
- Dashboard metric drill-down to exact records
- Tenant/mine scope denial

## 15. Production hardening authority

The canonical production release, security, audit/history, SLO/capacity, backup/DR, migration and operational gates are [`../features/platform/production-hardening-spec.md`](../features/platform/production-hardening-spec.md). The canonical logical evidence model is [`audit-history-data-model.md`](audit-history-data-model.md). This presentation-level document must not be used to claim production eligibility.

## 16. Detailed implementation still required

- ~~API contracts~~ — done: `docs/api-specs/` (6 domains, 108 endpoints)
- ~~Full relational schema/data dictionary~~ — done: `docs/architecture/data-model.md`
- Infrastructure-as-code and isolated environments implementing the hardening contract
- Measured/approved capacity, SLO, RPO and RTO profiles
- Authority-specific integration deployments and conformance evidence
- Deployment-specific threat model, privacy assessment and security verification
- Executable test automation and release evidence
- Source-specific migration/cutover/rollback runbooks and rehearsals

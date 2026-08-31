# Strata — Cross-Domain Production Hardening and Release Specification

## 1. Purpose and boundary

This specification converts Waves 1–14 into enforceable production delivery, security, reliability, migration and operational gates. It owns no domain business meaning. A release is production-eligible only when executable artifacts and evidence implement the canonical feature/data/API contracts for its declared scope.

Security/reliability inputs include [CERT-In directions](https://cert-in.org.in/PDF/CERT-In_Directions_70B_28.04.2022.pdf), Government of India [cloud procurement guidance](https://meity.gov.in/writereaddata/files/Guidelines-Procurement_Cloud_Services.pdf) and [DR practices](https://meity.gov.in/writereaddata/files/DR%20Best%20Practices.pdf), [OWASP ASVS 5.0](https://owasp.org/www-project-application-security-verification-standard/) and applicable GIGW/privacy/security requirements. Exact Ministry hosting/control baselines and RPO/RTO are approved deployment policy, not guessed constants.

## 2. Artifact authority and repository contract

The authority chain is:

1. official/approved requirements and durable decisions;
2. canonical feature/logical/API contracts;
3. executable OpenAPI/AsyncAPI/event schemas, database migrations/policies and policy-as-code;
4. generated clients/schema docs/tests;
5. implementation;
6. presentation/prototype/legacy notes.

Executable artifacts must cite their canonical owner/version. Generated artifacts are never hand-edited. `architecture/data-model.md` is quarantined legacy exploration; it is not physical DDL. Each database package owns ordered immutable migrations plus generated current-schema documentation. Each API package owns OpenAPI and compatibility tests. Each event producer owns schema/version and consumer contract tests.

Repository root `AGENTS.md` defines cross-repo commands/ownership; package-level instructions define only narrower stack rules. CI is the mechanical source for required lint/type/test/security/schema gates.

## 3. Production environments and change control

Environments are isolated at account/project/network, data, secrets, identity, keys and observability levels. Production data/credentials never enter development or ordinary test. Synthetic/sanitized fixtures are labelled. Privileged production access is named, time-bounded, MFA/step-up, least privilege, ticket/purpose logged and reviewed.

Infrastructure/configuration is version-controlled and reviewed. Drift is detected; console changes are emergency-only, recorded and reconciled. Releases are immutable artifacts promoted by digest with provenance/SBOM/signature, approvals and rollback. Database/event/API/policy changes use expand-migrate-contract compatibility, not synchronized big-bang deployment.

## 4. Executable contract gates

### 4.1 Database

- migration applies from empty database and every supported prior release;
- constraints, foreign keys, uniqueness, temporal overlap, state transitions and append-only rules are tested;
- tenant RLS denies missing/wrong context and cross-tenant enumeration;
- concurrency tests cover assignment, verification, idempotency, sequence/checkpoint and closure;
- down/forward recovery is documented; destructive contraction waits for compatibility and backup/rollback proof;
- schema drift between migrations and deployed database blocks release.

### 4.2 HTTP/events/files

- OpenAPI validates request/response/errors/security/idempotency/concurrency/pagination;
- consumer/provider contract tests cover every supported integration version;
- backward compatibility detects removed/changed fields, enum narrowing and semantic changes;
- unknown fields/enums follow declared tolerant-reader behavior; breaking change requires new version/migration window;
- AsyncAPI/CloudEvents-compatible event envelope, schema registry, ordering/idempotency and replay fixtures are executable;
- files/templates carry schema/version/hash and row/field errors.

### 4.3 Authorization/policy

Every endpoint/job/event/tool maps to a capability and server-resolved target. Policy tests include allow, deny, concealment, tenant crossover, revoked/expired appointment, mandate/jurisdiction, purpose/assurance, separation, list filtering and degraded dependency. OpenFGA/read-model loss rebuilds from canonical relations; current high-risk checks fail closed.

## 5. Security engineering and threat model

Maintain versioned system/data-flow diagrams, asset/data classification, trust boundaries, actors, abuse cases and control ownership. Threat modelling covers browser/API/mobile/offline sync, file/OCR, object storage, authorization, webhooks/integrations, queues, GIS exports, search/vector, AI prompt/tools, admin/support and supply chain.

Minimum controls:

- phishing-resistant/approved MFA for privileged/high-risk acts and server-side session revocation;
- TLS, managed keys, encryption at rest, secret vault/workload identity and rotation;
- deny-by-default network/service egress, ingress allowlisting, WAF/rate/abuse controls and SSRF defense;
- parameterized queries/output encoding/CSRF/CORS/CSP/cookie protections;
- upload size/type/malware/quarantine and safe rendering;
- signed short-lived object URLs and field/projection redaction;
- dependency/container/IaC/secret/SAST checks plus risk-based DAST/manual penetration testing;
- mobile secure storage, certificate/network controls, release signing, tamper/root policy and remote session/data revocation;
- AI retrieval/tool isolation, prompt-injection/data-exfiltration tests; and
- vulnerability intake, severity/SLA, exception expiry, patch/emergency release and disclosure process.

No scan alone proves security. Critical/high exploitable findings block production unless the designated risk owner accepts a bounded exception with compensating control and expiry; legal prohibitions cannot be waived by engineering risk acceptance.

## 6. Audit, access and historical reconstruction

Each domain transaction writes domain change, domain audit event and outbox event atomically through explicit application/domain persistence—not one unsafe generic trigger over unlike schemas. Audit events contain event ID/type/schema, aggregate/tenant, actor principal/person, supporting appointment/mandate, purpose/assurance, occurred/recorded/committed time, command/correlation/causation, before/after or typed change reference, reason, source/device and integrity linkage.

Separate streams exist for:

- domain decision/change events;
- authentication/security/admin events;
- sensitive access/denial/break-glass events;
- integration/AI/operator evidence; and
- infrastructure/platform logs.

Audit is append-only through restricted writer paths; corrections append. Cryptographic chaining/checkpoints detect alteration but do not replace access control, backup or independent anchoring. Periodic signed checkpoints are stored in a separately administered/WORM-capable target. Verification identifies missing, duplicate, reordered or altered segments.

Historical/as-of projections rebuild from versioned domain events/snapshots plus effective policy/reference versions. They never reconstruct authorization merely from current state. Replay is deterministic or records why external/non-deterministic evidence prevents exact reproduction.

CERT-In-covered ICT logs use the approved India-resident retention baseline (including the applicable rolling 180-day direction) while domain/audit/records retention follows longer effective legal schedules. Sensitive logs are minimized/redacted and access-controlled; “log everything” is prohibited.

## 7. Privacy, retention and deletion

Maintain a data inventory mapping fields/objects/events/logs/embeddings/backups to purpose, owner, classification, residence, recipients, retention, legal hold and deletion/anonymization. Collection/telemetry is minimum necessary. Production debugging uses approved masked access and never copies arbitrary payloads to tickets/chat.

Deletion executes a manifest across canonical data where lawful, derived/search/vector/cache/analytics stores, integrations and future backups according to policy. Legal hold suspends disposal. Backup expiry is documented rather than mutating sealed media. Destruction produces proof without retaining erased sensitive content.

## 8. SLOs, capacity and performance

An approved service catalogue defines for each user/API/background/integration capability:

- availability and business hours/criticality;
- latency/throughput/queue-age/freshness SLI and percentile;
- error budget and owner;
- dependencies and degraded behavior;
- data-loss tolerance/RPO and restoration/RTO;
- alert threshold, runbook and communication; and
- capacity assumptions and growth horizon.

Do not publish universal numbers before workload and Ministry approval. Capacity model includes operators/mines/people, concurrent sessions, inspections/captures, media size/upload concurrency, attendance/device rate, sensor bursts, documents/OCR, search index/query, reports, notifications, integration quotas, AI tokens/jobs and retention growth.

Load/soak/spike/failover tests use privacy-safe representative distributions and prove tenant fairness/backpressure, not just average throughput. Critical safety/statutory work has reserved capacity and visible degradation. Caches/indexes/AI/integrations may degrade; authoritative reads/writes follow declared safe behavior and never replace unknown with zero/success.

## 9. Availability, backup and disaster recovery

Production removes single points of failure within the approved failure domain: multi-zone stateless services, managed database HA, durable queues, replicated/versioned object storage, redundant authorization/secret/observability paths and tested dependency fallbacks. Multi-region/DR topology follows approved residence, threat and cost policy.

Backup inventory covers PostgreSQL/PITR, immutable originals, configurations/IaC, keys/recovery material, schema/policy/model/locale/connector versions and audit checkpoints. Search/cache/OpenFGA projections rebuild from canonical sources but rebuild time is included in recovery.

Restore drills verify integrity, referential consistency, tenant isolation, object hashes, audit chains, outbox/inbox/checkpoints, RLS/policy, secrets/keys, application compatibility and reconciled external/queued/offline work. A backup job success is not a restore test. DR exercises measure actual RPO/RTO, decision authority, communications, failback and lessons; failed objectives block release/require risk action.

## 10. Observability and incident response

Use correlated metrics, logs and traces with service/version/environment/tenant-safe dimensions and OpenTelemetry-compatible semantics. Never put tokens, raw protected narratives, biometric/medical data or unrestricted payloads in telemetry. Alert on user/business symptoms, authorization failures, audit gaps, queue/freshness, integration unknown outcomes, AI suspension, capacity, backup/restore and security indicators.

Operational runbooks identify severity, owner/on-call, diagnosis, safe mitigation, continuity/manual route, stakeholder communication, evidence preservation, recovery and post-incident review. Security incidents follow approved CERT-In/nodal reporting procedures and clocks. Customer/domain impact is linked to affected records/exchanges/runs without changing their history.

## 11. Migration, reconciliation and cutover

For each legacy/source system:

1. inventory owner, authority, scope, identifiers, data quality, retention and freeze/change behavior;
2. map to canonical entities without forcing legacy role/hierarchy/status shape;
3. extract immutable source snapshot/hash and transformation version;
4. stage/quarantine, validate schema/referential/semantic/privacy rules;
5. resolve identities/external IDs, duplicates, conflicts and unknowns with accountable decisions;
6. dry-run repeatedly and compare counts, totals, samples, lifecycle distributions and record-level manifests;
7. run shadow/dual-read or controlled dual-entry only with a declared reconciliation owner;
8. obtain business/user/security/accessibility/integration sign-off;
9. cut over with freeze/delta/import/verification/rollback criteria;
10. observe hypercare, reconcile late/offline/external work; and
11. retire legacy only after measured parity, records/legal approval and recoverable archive/export.

Migration never rewrites source evidence or invents missing authority. Unknown/conflicted rows are visible and cannot silently default to compliant/active/approved. Rollback criteria are decided before cutover; irreversible destructive legacy shutdown requires separate approval.

## 12. Release and operational readiness gate

A release manifest binds code/container/mobile digests, SBOM/signatures, migrations, API/event/policy schemas, configuration, domain/catalogue/model/prompt/locale/connector versions, test evidence, known risks/exceptions, runbooks, rollback, capacity/SLO/DR scope and approvals.

Required evidence by affected scope:

- lint/type/unit/component/integration/end-to-end tests;
- database migration/RLS/concurrency/idempotency and property/state tests;
- API/event/provider-consumer compatibility;
- authorization/security/privacy/mobile/AI/integration tests;
- accessibility/localization critical-journey evidence;
- load/soak/failure/restore/DR evidence;
- migration/reconciliation/parity evidence; and
- operational dashboards/alerts/runbooks/on-call and change/rollback approval.

A change may be deployed progressively only within its approved blast radius. Failed mandatory gate, expired exception, unknown migration reconciliation or absent rollback blocks production. Emergency change records reason/authority, minimized scope and mandatory retrospective evidence.

## 13. Ownership and capabilities

| Capability | Target |
|---|---|
| `platform.release.prepare`, `platform.release.approve`, `platform.release.deploy`, `platform.release.rollback` | release/environment |
| `platform.schema.publish`, `platform.policy.publish`, `platform.configuration.manage` | schema/policy/config version |
| `platform.audit.read`, `platform.audit.verify`, `platform.audit.checkpoint` | audit scope/checkpoint |
| `platform.security.assess`, `platform.security.exception.approve`, `platform.incident.manage` | release/finding/incident |
| `platform.slo.configure`, `platform.capacity.test`, `platform.health.read` | service/environment |
| `platform.backup.operate`, `platform.restore.execute`, `platform.dr.exercise` | data set/environment/exercise |
| `platform.migration.configure`, `platform.migration.execute`, `platform.migration.reconcile`, `platform.cutover.approve` | source/run/cutover |

No platform capability grants domain decision, sensitive payload, tenant bypass or legal waiver. Production deployment and rollback require separation appropriate to risk.

## 14. Acceptance scenarios

The implementation/release process must prove:

1. empty and prior-version database migrations plus cross-tenant/RLS/concurrency denial;
2. API/event breaking change is detected before consumer failure;
3. appointment revocation propagates and high-risk action denies during projection outage;
4. audit mutation/gap/reorder is detected against independent checkpoint;
5. point-in-time restore meets approved RPO/RTO and reconciles queues/offline/external work;
6. zone/service/search/cache/AI/integration failure yields declared degradation, not false green/success;
7. tenant-noisy load cannot starve critical work or expose another tenant;
8. compromised secret rotates/revokes with traceable affected-use review;
9. malicious upload/webhook/prompt cannot escape quarantine/trust boundary;
10. migration duplicate/unknown/conflict blocks silent activation and remains reconcilable;
11. accessibility/security regression blocks release despite functional tests;
12. rollback/failback preserves domain/audit/outbox integrity; and
13. operator can trace one user-visible state through source, audit, outbox, projection, workflow/integration/AI and release versions.

## 15. Honest completion boundary

This specification completes the production hardening design, not implementation or certification. Production launch still requires executable migrations/OpenAPI/events/policies, approved tenant model, legal/catalogue contents, real connector agreements, measured workload/SLO/RPO/RTO, security/privacy/STQC assessment, representative AI/language evidence, migration source access and successful release/restore/DR tests.

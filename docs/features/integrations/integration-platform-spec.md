# Strata — Integration Platform Specification

## 1. Purpose and boundary

This specification owns the shared machinery for outbound commands, inbound events/files, polling, bulk exchange, external identity mapping, credentials, delivery evidence, reconciliation and connector operations across government, regulator, operator, device and notification systems.

Domains own business meaning and state. The integration platform translates, transports, observes and reconciles; it never marks an obligation satisfied, finding closed, clearance granted, grievance disposed, attendance valid or production fact approved.

Standards/design inputs include the Government of India [Open API policy](https://www.meity.gov.in/static/uploads/2024/03/Policy-Document.pdf), [API Setu access SOP](https://www.meity.gov.in/writereaddata/files/SOP%20for%20API.pdf), [CloudEvents](https://cloudevents.io/), HTTP semantics in [RFC 9110](https://www.rfc-editor.org/info/rfc9110/), [RFC 9457 Problem Details](https://www.rfc-editor.org/info/rfc9457/) and [OpenTelemetry semantic conventions](https://opentelemetry.io/docs/specs/semconv/). A receiving authority’s approved contract overrides generic transport preferences.

## 2. Canonical distinctions

| Concept | Meaning | Not equivalent to |
|---|---|---|
| System profile | Governed identity/ownership/classification of an external system | endpoint URL |
| Connector definition | Provider-neutral capability and canonical message contract | deployed credentials |
| Connector deployment | Environment/tenant/authority-specific endpoint, auth, network and policy | reusable connector code |
| Exchange | One business-correlated inbound/outbound intent | network attempt |
| Attempt | One concrete transport invocation | remote processing |
| Transport receipt | Evidence bytes/request reached an intermediary/endpoint | authority acknowledgement |
| Remote acknowledgement | Correlated receiver evidence of registration | accepted/approved business outcome |
| Remote status observation | What a source asserted at a point in time | Strata/domain truth |
| Reconciliation | Reasoned resolution of local/remote evidence and uncertainty | overwrite |
| Dead letter | Attempt/event requiring operator action after policy exhaustion | data deletion |
| Replay | Reprocessing the exact immutable input under controlled policy | editing payload |

## 3. Connector contract and lifecycle

Every connector definition declares:

- owning Strata domain and external authority/system owner;
- operations (`PUSH`, `PULL`, `POLL`, `WEBHOOK`, `STREAM`, `BULK_FILE`, `MANUAL_ASSISTED`);
- canonical request/event schemas and provider mappings;
- correlation, external identifier namespace and idempotency strategy;
- authentication/signature/network/data-classification policy;
- timeout, retry, rate-limit, circuit-breaker and concurrency policy;
- acknowledgement/status semantics and terminality mapping;
- reconciliation query/alternate channel;
- ordering, deletion/correction and historical replay behavior;
- SLO, freshness, retention, observability and runbook; and
- sandbox/conformance evidence and approval.

```text
DRAFT → TESTING → APPROVED → ACTIVE → DEPRECATED → RETIRED
                  └────────→ SUSPENDED → ACTIVE
```

Definitions and mappings are immutable after approval. A new schema/semantic/auth change produces a new version with compatibility assessment, shadow/canary plan and rollback. Deployments bind one approved version and environment; secrets are references to an approved vault, never values in configuration or logs.

## 4. Outbound exchange lifecycle

```text
REQUESTED → POLICY_VALIDATED → READY → ATTEMPTING
→ TRANSPORT_CONFIRMED → REMOTE_ACKNOWLEDGED → REMOTE_TERMINAL
                 └────→ OUTCOME_UNKNOWN → RECONCILING ────┘
→ SUCCEEDED | REJECTED | CANCELLED | MANUAL_INTERVENTION
```

The domain creates an immutable intent/payload manifest and expected business correlation. Integration validates connector/policy, maps the canonical payload and records exact bytes/hash. Each attempt records destination version, credential reference/version, request/response metadata, times, status and sanitized error.

HTTP 2xx, SMTP acceptance, file upload or queue publish can establish transport only. Remote acknowledgement and terminal status require contract-defined correlated evidence. A timeout after send becomes `OUTCOME_UNKNOWN`; do not blindly retry a non-idempotent operation. Query remote state using correlation/idempotency key, await callback, or route for human reconciliation first.

## 5. Inbound lifecycle

```text
RECEIVED → AUTHENTICATED → QUARANTINED/VALIDATED → NORMALIZED
→ CORRELATED → DOMAIN_ACCEPTED | DUPLICATE | REJECTED | UNMATCHED
```

Ingress stores raw bytes/object reference and transport metadata before interpretation, subject to data-minimization policy. Verify TLS/channel, source credential/signature, timestamp/nonce/replay window, content type/size, malware and schema. Normalization produces a canonical event plus mapping/version and does not destroy raw provenance.

Domain acceptance is an idempotent command/event handoff. Integration cannot bypass domain authorization/business validation. Callbacks may arrive before responses and events may be duplicated or out of order; correlation and per-subject sequence/version rules handle them. Unknown identifiers go to unmatched reconciliation, never a guessed mine/person/case.

## 6. Idempotency, ordering and concurrency

Every exchange has a stable Strata exchange ID. Where the receiver supports idempotency, send a stable key scoped to operation and remote namespace. Persist request hash; reuse of a key with different content is rejected. Where unsupported, use provider-specific natural keys plus preflight/status reconciliation and operator approval for ambiguous repeats.

Delivery is at least once unless a particular transport proves otherwise; consumers must deduplicate. “Exactly once” is not promised across independent systems. Ordering is scoped by declared subject/partition and remote version, not wall-clock arrival alone. Late valid events remain history and are applied only through domain correction/reconciliation policy.

## 7. Identity and reference mapping

External identifiers are stored as `(system_profile, namespace, identifier, validity)` with verified mapping to canonical resource and provenance. Never use a bare external ID globally. Mapping changes are superseding records requiring conflict review; historical exchanges retain the mapping version used.

Identity federation distinguishes external machine principal, human delegated authorization, consent/grant, organization/mine mapping and domain appointment. An external token or API consumer never becomes a Strata user/capability automatically.

## 8. Credentials, secrets and trust

Supported deployment profiles may use mTLS, OAuth 2.x client/delegated grants, signed requests, approved API keys, SFTP/PGP or authority portal credentials. Exact choice is provider policy.

- Secrets/private keys live in an approved vault/HSM with least privilege and workload identity.
- Configuration/logs contain only credential references/fingerprints.
- Rotation supports overlap, test, activation, rollback and revocation.
- Expiry/revocation alarms precede failure; use is audited by connector/operation.
- Delegated user grants record subject, scopes, consent/legal basis, expiry and revocation; background work stops when invalid.
- Production credentials never enter local/dev/test; sandboxes and synthetic fixtures are isolated.
- TLS/certificate validation fails closed; no “temporary” verification disable.

## 9. Retry, rate limit, circuit breaker and backpressure

Errors are classified: validation/permanent, authorization, rate-limit, transient remote, network/timeout, outcome-unknown, mapping/schema, security/quarantine and local capacity. Retry only classifications/operations declared safe, using bounded exponential backoff with jitter and receiver `Retry-After` where valid.

Rate limits are enforced per deployment/operation/tenant priority without key rotation to evade provider limits. Circuit breakers isolate unhealthy deployments and allow controlled probes. Queues have bounded capacity, age/priority policy and backpressure; critical statutory/emergency traffic has reserved capacity but does not starve recovery indefinitely. Expired work is not silently sent late: policy determines cancel, reconcile or accountable human alternate channel.

## 10. Reconciliation and manual intervention

Reconciliation compares immutable local intent/attempts with remote query/callback/file/receipt observations. It may conclude confirmed-not-created, registered, duplicate, rejected, terminal outcome, conflict or unresolved. It creates a recommendation/evidence package; the owning domain applies business transitions under its own authority.

Manual operations require capability, reason, ticket/work item, exact target, preview, separation for high-risk resend/remap/ignore, and immutable receipt. Operators may retry/replay/quarantine/resolve mapping; they cannot edit signed payload bytes, fabricate acknowledgements or directly change domain status.

## 11. Bulk files, polling, webhooks and streams

- **Bulk files:** manifest, source, period, schema, encoding, row count/hash, encryption/signature, staging validation, row-level disposition and restart checkpoint. Partial acceptance is explicit.
- **Polling:** watermark/cursor is per deployment/operation; overlap windows and dedup prevent missed boundary updates. Empty success and stale source are distinguishable.
- **Webhooks:** source verification, replay protection, immediate durable receipt, fast response and asynchronous processing. Secret rotation accepts bounded overlap.
- **Streams/devices:** device identity, sequence, event time/ingest time, clock confidence, health and gap detection. Telemetry creates assertions/evaluations, never automatic legal truth.
- **Assisted/manual portals:** freeze package, record authorized human, channel, screenshots/receipt/reference and later reconcile; automation does not bypass captcha/terms/access controls.

## 12. Security and data governance

Outbound allowlists prevent SSRF and DNS rebinding; private/internal metadata endpoints are blocked. Payloads and logs follow field classification, minimization, residency, encryption, retention and legal hold. Sensitive bodies/tokens are redacted from traces, errors and dead-letter dashboards. Attachments use malware/content checks and controlled object URLs.

Inbound source authentication is not authorization to mutate every domain. Each canonical handoff targets a narrow service principal capability and trusted deployment scope. Connector code cannot query arbitrary tenant data; source selection is server-side and manifest-bound.

## 13. Observability, SLO and health

Every exchange carries trace/exchange/correlation IDs across attempts without exposing secrets. Metrics include request/acceptance/terminal latency, queue age, retries, rate limits, circuit state, outcome-unknown age, unmatched mappings, schema drift, callback verification failures, credential expiry, reconciliation backlog, source freshness and domain handoff failures.

Health separates platform, deployment reachability, authentication, contract/schema, remote business availability and freshness. A green TCP/HTTP probe never claims end-to-end filing success. Audit records who configured, approved, deployed, replayed, remapped or disclosed data.

## 14. Authorization capabilities

| Capability | Target |
|---|---|
| `integration.system.configure`, `integration.connector.configure`, `integration.connector.approve` | system/connector version |
| `integration.deployment.configure`, `integration.deployment.activate`, `integration.deployment.suspend` | deployment |
| `integration.credential.bind`, `integration.credential.rotate` | deployment/credential reference |
| `integration.exchange.request`, `integration.exchange.read` | operation/business target/exchange |
| `integration.ingress.receive` | deployment/operation |
| `integration.reconcile`, `integration.mapping.resolve` | exchange/external identity |
| `integration.retry`, `integration.replay`, `integration.dead_letter.resolve` | attempt/event/dead letter |
| `integration.payload.read_sensitive`, `integration.audit`, `integration.health.read` | authorized scope |

Domain capability is still required to create an exchange intent or accept a canonical inbound fact. Platform administration grants no domain content access.

## 15. Acceptance and failure scenarios

The implementation must prove:

1. response timeout after remote commit reconciles without duplicate submission;
2. duplicate and out-of-order callbacks are retained but applied once/in correct version order;
3. same external ID in two systems/namespaces cannot collide;
4. credential expires during queue wait and payload is not sent with invalid authority;
5. revoked delegated consent stops polling/background access;
6. provider returns HTML/200 error and semantic validation rejects transport success;
7. schema adds/removes/changes field and drift quarantine prevents silent truncation;
8. partial bulk acceptance produces row dispositions and resumable checkpoint;
9. dead-letter replay uses exact bytes/mapping version and cannot edit source truth;
10. compromised connector is suspended/credential revoked without stopping unrelated deployments;
11. external outage invokes approved alternate/manual continuity with later reconciliation;
12. telemetry gap/stale source is visible and does not become “no incidents”; and
13. tenant/operator cannot inspect another tenant’s payload through integration operations.

## 16. Non-goals and dependencies

This wave does not claim live access to PARIVESH, CPGRAMS, DGMS/Shram Suvidha, PRIMS, CPCB, CMSMS/NCoG, operator ERP, banks/payment services or device vendors. Each integration requires owner-approved schema, credentials, network access, sandbox/conformance tests, lawful sharing basis and operational agreement. Wave 15 owns production infrastructure sizing, DR/security tests and executable contract suites.

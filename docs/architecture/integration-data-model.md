# Integration Platform Logical Data Model

This model implements the [integration platform specification](../features/integrations/integration-platform-spec.md). It is provider-neutral logical design, not executable DDL.

## 1. Catalogue and deployment

- `external_system_profile` — authority/owner, environments, classification, availability/support and identifier namespaces.
- `connector_definition` / `connector_version` — capability, direction, operations, canonical schemas, mappings, semantic acknowledgement, idempotency/ordering and lifecycle.
- `connector_approval` — domain/security/privacy/legal/operations review and evidence.
- `connector_deployment` — connector version, environment, endpoint/network policy, enabled operation and lifecycle.
- `connector_operation_policy` — timeout, retry, rate/concurrency, circuit, queue, reconciliation, alternate channel and SLO.
- `connector_credential_binding` — vault/HSM reference, auth method, fingerprint, scopes, effective interval and rotation state.
- `external_consent_grant` — external subject, scopes/purpose, evidence, expiry/revocation and refresh reference.

## 2. Schema and mapping

- `canonical_message_schema` / `provider_schema_version` — version/hash/media type and compatibility.
- `connector_mapping_version` — deterministic inbound/outbound mapping, defaults, lossy fields and test corpus.
- `mapping_execution` — exact versions/input/output hashes, warnings and disposition.
- `external_identifier` — system+namespace+identifier+validity.
- `external_resource_mapping` — external identifier to canonical resource, mapping status, provenance, reviewer and supersession.
- `schema_drift_event` — observed incompatibility, affected operation/sample hash and quarantine/decision.

## 3. Exchange and attempts

- `integration_exchange` — direction, operation, owning domain/target, correlation, idempotency key/hash, lifecycle, priority and policy versions.
- `exchange_payload_manifest` — canonical/source/rendered object versions, hashes, schema/mapping, classification and allowed destination.
- `integration_attempt` — attempt number, endpoint, credential binding, start/end, request/response metadata, transport verdict and sanitized problem.
- `transport_artifact` — request/response/receipt object reference, hash, content type, classification and retention.
- `remote_acknowledgement` — external reference/namespace, correlated proof and semantics/version.
- `remote_status_observation` — immutable raw/mapped state, source time, observed time, sequence/version, freshness and terminality assertion.
- `integration_exchange_event` — append-only lifecycle transition and authority.

## 4. Ingress and domain handoff

- `ingress_envelope` — raw object/hash, deployment, channel, received time, source network/signature/nonce and quarantine state.
- `ingress_validation` — auth, replay, malware, schema, size/type and policy verdicts.
- `canonical_inbound_event` — CloudEvents-compatible metadata, canonical body reference, mapping/provenance and correlation state.
- `inbox_deduplication` — deployment/operation/source event key, hash and first-seen disposition.
- `domain_handoff` — target domain/command/event, service capability, attempt, acceptance/rejection and domain reference.
- `unmatched_inbound_record` — missing/ambiguous mapping, safe summary, owner and deadline.

## 5. Polling, bulk and streaming

- `poll_subscription` / `poll_checkpoint` — operation/scope, cursor/watermark, overlap, last success/source freshness and lease.
- `bulk_transfer` / `bulk_manifest` — period/schema/hash/signature/encryption, expected rows and source proof.
- `bulk_row_disposition` — stable row key/hash, accepted/rejected/duplicate/unmatched and domain reference.
- `stream_partition_checkpoint` — device/topic partition, offset/sequence, gaps, event/ingest time and clock confidence.
- `webhook_endpoint_binding` — public endpoint identifier, verification method, secret versions and replay window.

## 6. Reconciliation and operations

- `reconciliation_case` — exchange/external identity, uncertainty/conflict type, evidence set, owner and state.
- `reconciliation_observation` / `reconciliation_decision` — immutable inputs, conclusion, recommendation, authority and domain handoff.
- `integration_dead_letter` — failed unit, immutable payload/version, reason, attempts, next action and retention.
- `operator_action` — preview, capability, reason/ticket, approver where required, exact action and outcome.
- `circuit_state_event` / `rate_limit_observation` — deployment/operation state and recovery evidence.
- `integration_health_snapshot` / `integration_slo_window` — platform/deployment/auth/schema/business/freshness measures.

## 7. Mandatory constraints

1. External endpoint/client scope never grants domain authority.
2. Connector definitions/mappings are immutable after approval; deployments bind exact versions.
3. Secret/token/private-key values never appear in database rows, payload manifests, logs or traces.
4. One idempotency key cannot bind different request hashes.
5. Bare external identifiers are never globally unique; system and namespace are required.
6. Original inbound/outbound bytes and source assertions are immutable; corrections append.
7. HTTP/file/queue success cannot create remote acknowledgement or business terminal state without declared evidence.
8. Timeout after possible send is outcome-unknown until reconciled; unsafe automatic retry is prohibited.
9. Domain handoff is idempotent and cannot bypass domain business/authorization gates.
10. Duplicate/out-of-order events remain auditable and do not overwrite newer source versions.
11. Manual replay/resend/remap references exact object/mapping/policy and requires reason; high-risk policy enforces approval.
12. Credential/consent is revalidated when an attempt begins, not only when queued.
13. Dead letters retain immutable failure input; operators cannot edit it into success.
14. Poll/stream checkpoint advances only after durable processing policy is satisfied.
15. Partial bulk success has row-level dispositions and cannot be represented as whole-file success.
16. Sensitive payload read is independent of connector operation/admin capability.
17. Retention/legal hold applies separately to payload, transport evidence, tokens, logs and audit.
18. Every mutation uses optimistic concurrency and command idempotency.

# Audit, Historical Reconstruction and Release Evidence Logical Model

This is the canonical logical replacement for the unsafe generic audit/hash-chain fragments in legacy [`data-model.md`](data-model.md). Physical migrations must implement/test this model; Markdown is not executable DDL.

## 1. Domain and security events

- `domain_audit_event` — immutable typed domain change/decision with schema version, aggregate, tenant, actor/authority, reason, correlation/causation/command, time tuple, change reference and integrity link.
- `security_event` — authentication/session/credential/authorization denial/break-glass/admin/security-control event.
- `access_event` — purpose-logged sensitive record/projection read/export/disclosure with requested/effective scope and fields.
- `audit_payload_object` — classified immutable before/after/change material stored by hash when inappropriate inline.
- `audit_stream_head` — stream/partition expected sequence and last accepted hash.
- `audit_checkpoint` — range/root/hash, signer/key/time and independently administered/WORM anchor receipt.
- `audit_verification_run` / `audit_verification_finding` — range, algorithm, missing/duplicate/order/hash result and disposition.

Audit events are written explicitly in the same transaction as domain state/outbox. Security/access events that occur without a domain transaction use their own durable append path. Application roles cannot update/delete audit rows.

## 2. Outbox, inbox and replay

- `outbox_message` — committed domain event, schema, aggregate sequence, destinations, availability and publication state.
- `outbox_delivery_attempt` — consumer/destination attempt and acknowledgement.
- `consumer_checkpoint` — consumer+partition sequence/watermark and lease.
- `inbox_message` — consumer dedup key/hash, receipt/process state and source envelope.
- `replay_run` — exact event range/schema/code/config, target isolated projection and comparison result.
- `projection_version` / `projection_checkpoint` — builder/version/source partitions/cuts, completeness/freshness and activation.

Publication is at least once; consumers are idempotent. Outbox publication state is operational metadata, not domain audit truth. Replays cannot republish external side effects without explicit sandbox/reconciliation policy.

## 3. Historical snapshots and reconstruction

- `snapshot_definition` — aggregate/projection, schema and cadence/trigger policy.
- `aggregate_snapshot` — aggregate version/event sequence, state object hash, source policy/reference versions and time.
- `historical_reconstruction_run` — requested as-of/known-at view, snapshot/event/policy cuts, code version, warnings and manifest.
- `historical_projection_manifest` — exact records/events/versions/exclusions and output hash.

Valid-time and recorded/known-time are preserved where domain semantics need bitemporal reconstruction. Late facts do not rewrite what the system knew earlier. Historical authorization/access is reconstructed from historical relationships plus record-specific policy—not granted simply because a user had past authority.

## 4. Retention, holds and disposal

- `retention_policy_version` — record/event/log/object class, jurisdiction/purpose, duration/trigger/action and approval.
- `legal_hold` / `legal_hold_scope` — authority, reason, effective interval and targeted records/classes.
- `disposal_run` / `disposal_manifest` — eligible population, exclusions/holds, canonical/derived/backup actions, approval and proof.
- `backup_catalog_entry` — sealed backup/version, coverage, encryption/key reference, residence, expiry and restore evidence.

## 5. Release, test and exception evidence

- `release_candidate` / `release_manifest` — artifact digests, SBOM/signatures, migrations, schemas/policies/config/catalogue/model/locale/connector versions and change set.
- `quality_gate_definition` / `quality_gate_result` — required-by scope/risk, command/tool/version, evidence and verdict.
- `risk_exception` — finding/control, impact, compensating control, owner, scope, expiry and non-waivable marker.
- `deployment_event` — environment, release, actor/approval, strategy, result and rollback link.
- `operational_readiness_review` — SLO/capacity/security/privacy/accessibility/DR/migration/runbook/on-call verdicts.

## 6. Reliability and recovery evidence

- `service_objective_version` — service/operation, SLI/query, target/window, error budget, owner and degraded behavior.
- `capacity_model_version` — workload dimensions/assumptions/growth/resource/limit and owner.
- `performance_test_run` — build/environment/scenario/distribution, results/bottleneck and verdict.
- `backup_run` / `restore_drill` / `dr_exercise` — coverage, fault/scenario, observed loss/time, integrity/reconciliation and actions.
- `operational_incident` / `incident_timeline_event` / `corrective_action` — severity, impact, response/communications/evidence/recovery/postmortem.

## 7. Migration and cutover

- `migration_source` / `migration_mapping_version` — source owner/snapshot/schema/authority, canonical mapping and transformations.
- `migration_run` / `migration_row_disposition` — input manifest/hash, output IDs, accepted/duplicate/conflict/quarantined/rejected and reasons.
- `migration_reconciliation` — count/total/distribution/sample/record proof, unresolved population and sign-offs.
- `cutover_plan` / `cutover_event` — freeze/delta/order, readiness, go/no-go authority, checkpoints, rollback and hypercare.
- `legacy_retirement_record` — parity/retention/archive/export/access evidence and irreversible shutdown approval.

## 8. Mandatory constraints

1. Audit/event IDs and partition sequences are unique; accepted events are insert-only.
2. Every material domain mutation references one audit and one outbox event committed atomically.
3. Actor principal/person and supporting authority are server-derived; system actions name workload identity.
4. Occurred/recorded/committed time and confidence are not collapsed.
5. Corrections/supersession append and reference prior event; no audit update/delete path exists.
6. Hash chains/checkpoints are partitioned, gap-detecting and independently anchored; chain alone is not authorization.
7. Sensitive payloads are classified/minimized and referenced by hash; ordinary telemetry excludes them.
8. Consumers deduplicate by stable message ID/hash and advance checkpoints only after durable processing.
9. Historical reconstruction binds event/snapshot/policy/code versions and exposes incompleteness.
10. Legal hold overrides disposal; backup expiry is handled by schedule, not mutable deletion promises.
11. Release result cannot be `APPROVED` while a mandatory gate fails or an exception is expired/non-waivable.
12. Risk exception scope/owner/expiry and compensating control are mandatory.
13. Restore/DR success requires application-level integrity/reconciliation, not infrastructure startup alone.
14. Migration unknown/conflict cannot default to active/compliant/approved or disappear from totals.
15. Cutover approval requires declared rollback point/criteria and unresolved reconciliation within threshold.
16. Legacy retirement requires measured parity, records/legal owner and recoverable archive/export.

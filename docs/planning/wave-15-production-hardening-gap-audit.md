# Wave 15 — Cross-Domain Production Hardening Gap Audit

## A. Outcome and boundary

Canonical designs have enforceable artifact, security, audit/history, SLO/capacity, backup/DR, migration and release gates. Design completion is distinct from implementation, certification and authority onboarding.

## B. Actors and accountability

Domain/data/API/event/policy owners; developers/reviewers; security/privacy/records/legal; release/SRE/DBA/backup/DR; migration/source/business owners; accessibility/model/integration approvers; incident commander/auditor. Platform authority grants no domain decision.

## C. Sources and outputs

Sources are canonical contracts, code/artifacts/SBOM, migrations/schemas/policies/config, tests/scans, workloads, backups, source snapshots and approvals. Outputs are release manifests/gates, audit/checkpoints/history, SLO/capacity/restore/DR evidence, migration dispositions/parity and operational incidents.

## D. Lifecycles and semantics

Release candidate/deployment/rollback, audit/outbox/checkpoint/reconstruction, finding/exception, backup/restore/DR, migration/reconciliation/cutover/retirement remain separate. Passing build or backup job is not production readiness or recoverability.

## E. Authorization and separation

Platform admin != tenant/content/domain authority; developer != sole deploy approver; backup operator != restore verifier; migrator != business parity approver; security tester != exception owner; emergency access/change is bounded and reviewed.

## F. Cross-domain consistency

Executable contracts implement canonical owners. Domain transaction + audit + outbox is atomic. Projections/replays never create external side effects. Every cross-domain state is traceable through correlation, versions and release.

## G. Failure and adversarial scenarios

Migration/RLS/concurrency, breaking schema, revocation outage, audit tamper/gap, restore reconciliation, zone/dependency failure, noisy tenant, secret compromise, malicious upload/webhook/prompt, migration conflicts, accessibility/security regression and rollback integrity were challenged.

## H. Operability and recovery

Measurable service catalogue, workload capacity, SLO/error budget, alerts/runbooks/on-call, multi-zone/DR, backup inventory, restore drills, incident response, progressive release/rollback and migration hypercare are specified. Exact targets need Ministry/workload approval.

## I. Gap dispositions

### GAP-15-001

- **Gap:** Markdown DDL/API prose could be mistaken for executable physical contracts.
- **Impact:** implementation drift, unsafe legacy schema and untested breaking changes.
- **Resolution:** explicit artifact authority, package-owned migrations/OpenAPI/events/policy and CI compatibility/constraint gates.
- **Status:** `RESOLVED_DESIGN`.

### GAP-15-002

- **Gap:** generic audit trigger/hash-chain design could not safely capture heterogeneous actor/tenant/change semantics or independent tamper evidence.
- **Impact:** incomplete/forgeable history and unsafe reconstruction.
- **Resolution:** explicit transactional typed domain audit/outbox, separate security/access streams and independent signed checkpoints.
- **Status:** `RESOLVED_DESIGN`.

### GAP-15-003

- **Gap:** security baseline lacked versioned threat/control verification, mobile/AI/integration/supply-chain and exception gates.
- **Impact:** scans may pass while exploitable cross-boundary paths remain.
- **Resolution:** threat model, ASVS-aligned evidence, layered tests, secret/data controls and bounded non-waivable-aware exceptions.
- **Status:** `RESOLVED_DESIGN`.

### GAP-15-004

- **Gap:** “HA/all mines” lacked workload dimensions, SLI/SLO, capacity/backpressure and degraded behavior.
- **Impact:** no sizing, procurement, alerting or truthful availability claim.
- **Resolution:** approved service catalogue/capacity model and load/soak/spike/failure gates; exact targets await owner/workload evidence.
- **Status:** `RESOLVED_DESIGN`.

### GAP-15-005

- **Gap:** backups/DR lacked coverage, restore integrity, queue/external/offline reconciliation and measured RPO/RTO.
- **Impact:** successful jobs could be unrestorable or produce inconsistent legal state.
- **Resolution:** complete backup inventory, isolated restore and DR/failback drills with application reconciliation.
- **Status:** `RESOLVED_DESIGN`.

### GAP-15-006

- **Gap:** legacy migration/cutover/retirement had no source manifests, row dispositions, parity or rollback gate.
- **Impact:** silent loss/defaulting, duplicate identity and irreversible premature retirement.
- **Resolution:** staged manifest-bound dry runs, conflict quarantine, measured reconciliation, sign-offs, rollback/hypercare and archive gate.
- **Status:** `RESOLVED_DESIGN`.

### GAP-15-007

- **Gap:** privacy/retention/deletion across logs, embeddings, projections, integrations, backups and legal holds was fragmented.
- **Impact:** over-retention, incomplete deletion or lost audit/legal evidence.
- **Resolution:** inventory/effective schedules/holds, cross-store disposal manifests and backup-expiry proof.
- **Status:** `RESOLVED_DESIGN`.

### GAP-15-008

- **Gap:** tenant governance, statutory catalogues, live authority agreements, workload/SLO/RPO/RTO, real AI/language/accessibility evidence and implementation artifacts require human/external execution.
- **Impact:** documentation alone cannot authorize or certify production launch.
- **Resolution:** named launch/onboarding gates; programme remains implementation/authority conditional after design waves.
- **Status:** `BLOCKED_EXTERNAL_EXECUTION`.

## J. Decisions requiring human approval

1. Ministry approves tenant/deployment governance, security/privacy/records controls, SLO/RPO/RTO and risk owners.
2. Legal/domain authorities publish effective statutory/service/credential/grievance/report policies.
3. External owners approve connectors/data sharing/sandboxes/semantics/SLAs.
4. Business/source/records owners approve migration parity/cutover/retirement.
5. Security/STQC/model/language owners approve production evidence in their scopes.

## K. Canonical documents that must change

Hardening feature, audit/history model, platform operations API/indexes, technical design, authorization, glossary, capability/inventory, decisions and tracker.

## L. Exit verdict

**Pre-design verdict: FAIL.** Architecture was broad, but executable authority, trustworthy audit, measurable reliability, restore and migration/release proof were incomplete.

**Post-design verdict: CONDITIONAL PASS FOR DESIGN.** GAP-15-001 through 007 have complete design controls. GAP-15-008 correctly prevents any claim that production implementation, certification or authority onboarding is finished.

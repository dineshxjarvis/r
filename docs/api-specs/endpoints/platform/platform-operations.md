# Platform — release evidence, audit verification, reliability, migration, and operational incidents

Domain rules: [`../../../features/platform/production-hardening-spec.md`](../../../features/platform/production-hardening-spec.md). Logical model: [`../../../architecture/audit-history-data-model.md`](../../../architecture/audit-history-data-model.md). Conventions: [`../../README.md`](../../README.md).

This is the control plane, and it makes claims that other domains rely on. Four it never overstates:

- **A release is not approved while a mandatory gate fails**, or while a risk exception is expired or non-waivable.
- **Restore and DR success require application-level integrity and reconciliation**, not infrastructure startup.
- **A hash chain is evidence of continuity, never authorization.** Verifying the chain proves nothing was silently removed; it proves nothing about whether an act was permitted.
- **Migration unknowns can never default to active, compliant, or approved**, and can never disappear from the totals.

## Routes

| Route | Purpose |
|---|---|
| `GET /release-candidates` · `POST /release-candidates` · `POST /release-candidates/{id}/actions` | Manifest, gates, approval |
| `GET /quality-gate-results` · `POST /quality-gate-results` | Command, tool version, evidence, verdict |
| `GET /risk-exceptions` · `POST /risk-exceptions` · `POST /risk-exceptions/{id}/actions` | Bounded, owned, expiring |
| `GET /deployments` · `POST /deployments` · `POST /deployments/{id}/actions` | Strategy, result, rollback |
| `GET /audit-checkpoints` · `POST /audit-checkpoints` · `GET /audit-verification-runs` · `POST /audit-verification-runs` | Chain anchoring and verification |
| `GET /historical-reconstructions` · `POST /historical-reconstructions` | Bitemporal replay with declared incompleteness |
| `GET /legal-holds?view=retention_policies` · `GET /legal-holds` · `POST /legal-holds` · `POST /legal-holds/{id}/actions` · `GET /disposal-runs` · `POST /disposal-runs` | Policy, holds, and disposal; hold beats disposal |
| `GET /security-assessments` · `POST /security-assessments` · `GET /security-findings` · `POST /security-findings/{id}/actions` | Findings and exceptions |
| `GET /service-objective-versions` · `POST /service-objective-versions` · `GET /capacity-test-runs` · `POST /capacity-test-runs` | SLO and capacity evidence |
| `GET /backup-runs` · `POST /backup-runs` · `GET /restore-drills` · `POST /restore-drills` · `GET /dr-exercises` · `POST /dr-exercises` | Recovery, proven not assumed |
| `GET /migration-runs` · `POST /migration-runs` · `POST /migration-runs/{id}/actions` · `GET /migration-runs?view=row_dispositions` | Row-level truth |
| `GET /cutover-plans` · `POST /cutover-plans` · `POST /cutover-plans/{id}/actions` | Go/no-go with a rollback point |
| `GET /operational-incidents` · `POST /operational-incidents` · `POST /operational-incidents/{id}/actions` | Platform incidents, distinct from mine incidents |

`GET /audit/events` and `GET /audit/aggregates/{type}/{id}/history` live in [`../dashboard/audit.md`](../dashboard/audit.md) and on each resource's own `/history`. `GET /platform-health` is `GET /service-objective-versions?expand=current_attainment`.

---

## POST /release-candidates/{id}/actions — APPROVE

**Auth:** `platform.release.approve`.

```json
{
  "action": "APPROVE",
  "expected_version": 8,
  "reason": "All 11 mandatory gates pass; the one open exception is in scope, owned, and unexpired",
  "supporting_authority": { "appointment_id": "app_01HZY1A2B3C4D5E6F7G8H9J0K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

### Response — 409, mandatory gate failing

```json
{
  "success": false,
  "message": "Release cannot be approved while a mandatory gate fails",
  "error": {
    "code": "INVALID_STATE",
    "details": {
      "release_candidate_id": "relc_01HZY2B3C4D5E6F7G8H9J0K1T0",
      "failing_mandatory_gates": [
        { "gate": "AUTHORIZATION_REGRESSION_SUITE", "required_by": "RISK_TIER_HIGH", "tool": "pytest", "tool_version": "8.4.1", "command": "pytest tests/authorization -q", "verdict": "FAIL", "detail": "3 of 1184 assertions failed: cross-tenant finding read returned 403 instead of 404", "evidence_ref": "s3://strata-gates/…" }
      ],
      "expired_exceptions": [
        { "id": "rexc_01HZY3C4D5E6F7G8H9J0K1T2M0", "finding": "Dependency CVE-2027-1188 in libxslt", "expired_on": "2027-03-01", "owner_post_id": "post_01HZY4D5E6F7G8H9J0K1T2M3N0" }
      ],
      "non_waivable_open": [
        { "id": "secf_01HZY5E6F7G8H9J0K1T2M3N400", "finding": "Session fixation on the step-up flow", "severity": "CRITICAL", "non_waivable": true, "note": "This control cannot be exception-waived at any risk tier." }
      ]
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

Three distinct blockers, each named with its own remedy. The `non_waivable` marker is the one that matters most: there is no approver anywhere who can sign past it.

### Response — 200 OK, approved

```json
{
  "success": true,
  "message": "Release candidate approved",
  "data": {
    "id": "relc_01HZY2B3C4D5E6F7G8H9J0K1T0",
    "object": "release_candidate",
    "version": 9,
    "tenant_id": null,
    "state": "APPROVED",
    "available_actions": ["DEPLOY", "SUPERSEDE"],
    "product_version": "1.5.0",
    "manifest": {
      "id": "relm_01HZY6F7G8H9J0K1T2M3N405P0",
      "artifacts": [
        { "name": "strata-api", "digest": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3", "signature_verified": true },
        { "name": "strata-web", "digest": "sha256:7d1a9c4e2f6b830d5ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c", "signature_verified": true }
      ],
      "sbom_ref": "s3://strata-sbom/1.5.0.spdx.json",
      "migrations": ["20270301_add_attendance_event_index", "20270305_backfill_defect_ageing_config"],
      "versions": { "schema_version": 214, "policy_catalogue_version": 17, "capability_catalogue_version": 17, "model_versions": ["aimv_01HZY5E6F7G8H9J0K1T2M3N400"], "locale_pack_versions": ["2027.03.1"], "connector_versions": ["cnvr_01HZY7G8H9J0K1T2M3N405P6Q0"] },
      "change_set_ref": "https://git.internal/strata/compare/1.4.2...1.5.0"
    },
    "gate_results": [
      { "gate": "UNIT_TESTS", "mandatory": true, "verdict": "PASS", "tool": "pytest", "tool_version": "8.4.1", "evidence_ref": "s3://strata-gates/…" },
      { "gate": "AUTHORIZATION_REGRESSION_SUITE", "mandatory": true, "verdict": "PASS", "tool": "pytest", "tool_version": "8.4.1", "evidence_ref": "s3://strata-gates/…" },
      { "gate": "RLS_ISOLATION_SUITE", "mandatory": true, "verdict": "PASS", "evidence_ref": "s3://strata-gates/…" },
      { "gate": "ACCESSIBILITY_CONFORMANCE", "mandatory": true, "verdict": "PASS", "evidence_ref": "cfst_01HZY03P4Q5R6S7T8V9V0W1X20" },
      { "gate": "DEPENDENCY_VULNERABILITY_SCAN", "mandatory": true, "verdict": "PASS_WITH_EXCEPTION", "exception_id": "rexc_01HZY8H9J0K1T2M3N405P6Q7R0" }
    ],
    "open_exceptions": [
      { "id": "rexc_01HZY8H9J0K1T2M3N405P6Q7R0", "finding": "Moderate CVE in an indirect PDF rendering dependency", "impact": "Denial of service on a malformed PDF; no data exposure", "compensating_control": "Rendering runs in an isolated worker with a 30 s timeout and no network egress", "owner_post_id": "post_01HZY4D5E6F7G8H9J0K1T2M3N0", "scope": "PDF rendering worker only", "expires_on": "2027-06-30", "non_waivable": false }
    ],
    "operational_readiness_review": { "slo": "PASS", "capacity": "PASS", "security": "PASS", "privacy": "PASS", "accessibility": "PASS_WITH_EXCEPTION", "dr": "PASS", "migration": "PASS", "runbook": "PASS", "on_call": "PASS" },
    "approved_by": { "type": "person", "id": "per_01HZY9J0K1T2M3N405P6Q7R8S0", "display": "V. Rao" },
    "approved_at": "2027-03-25T10:00:00Z",
    "created_at": "2027-03-20T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/release-candidates/relc_01HZY2B3C4D5E6F7G8H9J0K1T0" }
  },
  "meta": { "action": "APPROVE", "transition": { "from": "UNDER_REVIEW", "to": "APPROVED" }, "effects": [ { "object": "audit_event", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-03-25T10:00:00Z" }
}
```

Every risk exception carries **scope, owner, compensating control, and expiry**, all mandatory. An exception without an expiry is a permanent unowned risk wearing a form.

---

## POST /audit-verification-runs

**Auth:** `platform.audit.verify`.

**Hash chains are partitioned, gap-detecting, and independently anchored. The chain alone is not authorization.**

```json
{
  "stream": "domain_audit_event",
  "partition": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
  "range": { "from_sequence": 1, "to_sequence": 4182118 },
  "algorithm": "SHA256_MERKLE_V2",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Verification complete: 1 finding",
  "data": {
    "id": "avrn_01HZYA0B1C2D3E4F5G6H7J8K90",
    "object": "audit_verification_run",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED",
    "available_actions": [],
    "stream": "domain_audit_event",
    "partition": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "range": { "from_sequence": 1, "to_sequence": 4182118 },
    "algorithm": "SHA256_MERKLE_V2",
    "result": {
      "events_examined": 4182118,
      "missing_sequences": [],
      "duplicate_sequences": [],
      "out_of_order": [],
      "hash_mismatches": [],
      "chain_intact": true
    },
    "checkpoints_verified": [
      { "checkpoint_id": "audc_01HZYB1C2D3E4F5G6H7J8K9T00", "range": { "from_sequence": 1, "to_sequence": 1000000 }, "root_hash": "sha256:9f2c8b1a…", "signer_key_id": "kms://strata-audit/anchor#v3", "anchored_at": "2027-01-01T00:00:00Z", "anchor_receipt": { "authority": "WORM_ARCHIVE_INDEPENDENT", "receipt_ref": "worm://audit-anchor/2027-01-01/…", "independently_administered": true }, "verified": true }
    ],
    "findings": [
      { "id": "avfn_01HZYC2D3E4F5G6H7J8K9T0M10", "kind": "ANCHOR_OVERDUE", "severity": "MEDIUM", "detail": "The most recent checkpoint covers up to sequence 4000000. Sequences 4000001–4182118 are chain-intact but not yet independently anchored.", "disposition": "OPEN", "owner_post_id": "post_01HZYD3E4F5G6H7J8K9T0M1N20" }
    ],
    "chain_proves": "CONTINUITY_AND_NON_REMOVAL",
    "chain_does_not_prove": "AUTHORIZATION_OF_ANY_RECORDED_ACT",
    "completed_at": "2027-04-01T02:41:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/audit-verification-runs/avrn_01HZYA0B1C2D3E4F5G6H7J8K90" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-04-01T02:41:00Z" }
}
```

`chain_proves` and `chain_does_not_prove` are returned as fields. It is the single most misread piece of evidence in a system like this, and the API states the limit rather than leaving it to inference.

---

## POST /historical-reconstructions

**Auth:** `platform.history.reconstruct`.

**Valid time and known time are both preserved. Late facts never rewrite what the system knew earlier**, and **historical authorization is reconstructed from historical relationships**, not granted because someone once had authority.

```json
{
  "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
  "projection": "COMPLIANCE_POSTURE",
  "as_of": "2026-09-30T18:29:59Z",
  "known_at": "2026-10-05T00:00:00Z",
  "purpose": "Response to DGMS query on the September position as reported at the time",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Reconstruction complete with 2 declared incompleteness items",
  "data": {
    "id": "hrec_01HZYE4F5G6H7J8K9T0M1N2030",
    "object": "historical_reconstruction_run",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED",
    "available_actions": [],
    "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "projection": "COMPLIANCE_POSTURE",
    "as_of": "2026-09-30T18:29:59Z",
    "known_at": "2026-10-05T00:00:00Z",
    "bitemporal_note": "This is the position as it stood on 30 September, as it was known on 5 October. Facts recorded after 5 October are excluded even where they describe September.",
    "cuts": { "event_sequence_cut": 3841182, "snapshot_id": "agsn_01HZYF5G6H7J8K9T0M1N203P40", "policy_catalogue_version": 16, "capability_catalogue_version": 16, "code_version": "reconstruct-svc@3.1.0" },
    "historical_authorization": { "reconstructed_from": "HISTORICAL_RELATIONSHIPS_PLUS_RECORD_POLICY", "not_granted_by": "CURRENT_OR_PAST_AUTHORITY_ALONE", "note": "A person who held a portfolio in September does not thereby gain access to it today; this reconstruction shows what was visible then, to whoever is authorized to see it now." },
    "result": {
      "eligible_obligations": 118,
      "satisfied": 91,
      "overdue": 9,
      "verified_compliance_rate": "0.771",
      "open_findings": 14
    },
    "incompleteness": [
      { "kind": "LATE_ARRIVING_FACT_EXCLUDED", "detail": "One approved production fact superseding September output was recorded on 2026-11-12 and is excluded, because it was not known at 2026-10-05.", "affected_measure": "none", "reference": "apf_01HZZ0A5B6C7D8E9F0G1H213J0" },
      { "kind": "SNAPSHOT_GAP", "detail": "Attendance projection had no snapshot between 2026-09-14 and 2026-10-01; the reconstruction replayed 41,882 events instead, which is exact but slower.", "affected_measure": "none" }
    ],
    "manifest": { "id": "hpmf_01HZYG6H7J8K9T0M1N203P4Q50", "record_count": 118, "event_count": 41882, "exclusions": 1, "output_hash": "sha256:3c9e1a7f…" },
    "completed_at": "2027-04-02T10:14:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/historical-reconstructions/hrec_01HZYE4F5G6H7J8K9T0M1N2030" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-04-02T10:14:00Z" }
}
```

**Incompleteness is exposed, not smoothed over.** A reconstruction that silently filled the snapshot gap would be indistinguishable from one that did the work.

---

## POST /legal-holds · POST /disposal-runs

**Auth:** `platform.legal_hold.manage` and `platform.disposal.execute`.

**A legal hold overrides disposal. Destruction never deletes required audit proof, and backup expiry is handled by schedule, not by a mutable deletion promise.**

```json
{
  "success": true,
  "message": "Disposal run completed: 41,882 of 118,442 eligible records disposed",
  "data": {
    "id": "dspr_01HZYH7J8K9T0M1N203P4Q5R60",
    "object": "disposal_run",
    "version": 2,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED",
    "available_actions": [],
    "retention_policy_version": { "id": "rtpv_01HZYJ8K9T0M1N203P4Q5R6S70", "display": "Statutory IN 30-year retention, v4" },
    "eligible_population": { "record_class": "EVIDENCE_MEDIA", "count": 118442, "criteria": "captured_at older than the class retention period" },
    "exclusions": [
      { "reason": "LEGAL_HOLD", "count": 76318, "hold_ids": ["lhld_01HZYK9T0M1N203P4Q5R6S7T80"], "hold_reason": "NGT proceedings on the 2026 highwall slip; all Gevra evidence retained until further order" },
      { "reason": "REQUIRED_AUDIT_PROOF", "count": 242, "detail": "Content hashes and audit references are retained even where the media object is destroyed" }
    ],
    "actions_taken": [
      { "target": "CANONICAL_OBJECT", "count": 41882, "action": "DESTROYED", "proof_hash": "sha256:2b8c1e3f…" },
      { "target": "DERIVED_THUMBNAILS", "count": 41882, "action": "DESTROYED" },
      { "target": "SEARCH_PROJECTION", "count": 41882, "action": "TOMBSTONED", "verified": true },
      { "target": "BACKUP_COPIES", "count": 41882, "action": "SCHEDULED_EXPIRY", "expires_by": "2027-10-01", "note": "Backups expire on their own schedule. No mutable deletion promise is recorded against a sealed backup." }
    ],
    "audit_proof_retained": true,
    "approved_by": { "type": "person", "id": "per_01HZYT0M1N203P4Q5R6S7T8V90", "display": "K. Bhagat" },
    "manifest_hash": "sha256:7d1a9c4e…",
    "completed_at": "2027-04-05T03:12:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/disposal-runs/dspr_01HZYH7J8K9T0M1N203P4Q5R60" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-04-05T03:12:00Z", "effects": [ { "object": "search_tombstone", "count": 41882, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

Backups are **sealed**. Recording "we will delete it from backups" against an immutable archive would be a promise the system cannot keep, so the model records a scheduled expiry instead.

---

## POST /restore-drills · POST /dr-exercises

**Auth:** `platform.dr.execute`.

**Restore and DR success require application-level integrity and reconciliation, not infrastructure startup alone.**

```json
{
  "success": true,
  "message": "Restore drill completed: PASS with 1 action",
  "data": {
    "id": "rdrl_01HZYM1N203P4Q5R6S7T8V9V00",
    "object": "restore_drill",
    "version": 2,
    "tenant_id": null,
    "state": "COMPLETED",
    "available_actions": [],
    "backup_catalog_entry": { "id": "bkce_01HZYN203P4Q5R6S7T8V9V0W10", "sealed_at": "2027-03-31T18:30:00Z", "coverage": "FULL_CLUSTER", "encryption_key_ref": "kms://strata-backup/primary#v6", "residence": "IN", "expires_on": "2034-03-31" },
    "scenario": "Full-cluster restore into an isolated environment from the 31 March sealed backup",
    "infrastructure_result": { "started": true, "started_at": "2027-04-06T02:14:00Z", "duration": "PT41M" },
    "application_integrity": {
      "checks": [
        { "check": "AUDIT_CHAIN_CONTINUITY", "verdict": "PASS", "detail": "All partitions chain-intact to sequence 4182118" },
        { "check": "OUTBOX_CONSUMER_CHECKPOINT_CONSISTENCY", "verdict": "PASS" },
        { "check": "REFERENTIAL_INTEGRITY_SAMPLE", "verdict": "PASS", "sample_size": 100000 },
        { "check": "BLOB_MANIFEST_RECONCILIATION", "verdict": "FAIL", "detail": "412 evidence objects referenced in the database were absent from the restored object store", "action_id": "corr_01HZY03P4Q5R6S7T8V9V0W1X20" },
        { "check": "PROJECTION_REBUILD_EQUIVALENCE", "verdict": "PASS", "detail": "Dashboard measures for 2027-03-31 reproduce to the row" }
      ],
      "overall": "PASS_WITH_ACTION"
    },
    "observed_data_loss": { "rpo_target": "PT15M", "observed": "PT4M12S", "within_target": true },
    "observed_recovery_time": { "rto_target": "PT4H", "observed": "PT1H8M", "within_target": true },
    "verdict": "PASS_WITH_ACTION",
    "verdict_basis": "Infrastructure started and RPO/RTO were met, but blob reconciliation failed. Startup alone would not have been a pass.",
    "corrective_actions": [{ "id": "corr_01HZY03P4Q5R6S7T8V9V0W1X20", "detail": "Object-store lifecycle policy transitions evidence media to a class the backup job does not enumerate; fix the enumeration and re-drill", "owner_post_id": "post_01HZYD3E4F5G6H7J8K9T0M1N20", "due_on": "2027-05-15" }],
    "completed_at": "2027-04-06T03:30:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/restore-drills/rdrl_01HZYM1N203P4Q5R6S7T8V9V00" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-04-06T03:30:00Z", "effects": [ { "object": "corrective_action", "count": 1, "change": "CREATED" } ] }
}
```

`verdict_basis` says it plainly. The cluster came up in 41 minutes and 412 pieces of evidence were missing. Only one of those facts is a successful restore.

---

## POST /migration-runs · reconciliation

**Auth:** `platform.migration.execute`.

**A migration unknown or conflict can never default to active, compliant, or approved, and can never vanish from the totals.**

```json
{
  "success": true,
  "message": "Migration completed with 1,184 unresolved rows",
  "data": {
    "id": "mgrn_01HZYP4Q5R6S7T8V9V0W1X2Y30",
    "object": "migration_run",
    "version": 3,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED_WITH_UNRESOLVED",
    "available_actions": ["RECONCILE", "QUARANTINE_REMAINING"],
    "migration_source": { "id": "mgsr_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "display": "SECL legacy compliance register (Oracle)", "snapshot_taken_at": "2027-04-10T00:00:00Z", "records_legal_owner": "SECL Company Secretary" },
    "mapping_version": { "id": "mgmv_01HZYR6S7T8V9V0W1X2Y3Z4A50", "version": 7 },
    "input_manifest": { "row_count": 118442, "hash": "sha256:9f2c8b1a…" },
    "row_summary": { "input": 118442, "accepted": 114208, "duplicate": 1418, "conflict": 842, "quarantined": 342, "rejected": 1632, "unresolved_total": 1184, "accounted_for": 118442, "totals_reconcile": true },
    "unresolved_note": "1,184 rows are conflict or quarantined. None was defaulted to ACTIVE, COMPLIANT, or APPROVED, and every one is counted above.",
    "started_at": "2027-04-10T02:00:00Z",
    "completed_at": "2027-04-10T04:41:00Z",
    "reconciliation": null,
    "extensions": {},
    "links": { "self": "/api/v1/migration-runs/mgrn_01HZYP4Q5R6S7T8V9V0W1X2Y30", "row_dispositions": "/api/v1/migration-runs?view=row_dispositions&filter[run_id]=mgrn_01HZYP4Q5R6S7T8V9V0W1X2Y30" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-04-10T04:41:00Z" }
}
```

`totals_reconcile: true` is computed, not asserted: accepted + duplicate + conflict + quarantined + rejected must equal input, and the response would say `false` if it did not.

### RECONCILE

```json
{
  "success": true,
  "data": {
    "id": "mgrc_01HZYS7T8V9V0W1X2Y3Z4A5B60",
    "object": "migration_reconciliation",
    "version": 1,
    "state": "SIGNED_OFF",
    "migration_run_id": "mgrn_01HZYP4Q5R6S7T8V9V0W1X2Y30",
    "proofs": [
      { "kind": "COUNT", "source_value": 118442, "target_value": 114208, "difference": 4234, "explained_by": ["duplicate: 1418", "conflict: 842", "quarantined: 342", "rejected: 1632"], "verdict": "EXPLAINED" },
      { "kind": "TOTAL", "measure": "open_obligation_count", "source_value": 8841, "target_value": 8841, "verdict": "MATCH" },
      { "kind": "DISTRIBUTION", "measure": "obligations_by_owner_role", "max_cell_deviation_percent": "0.4", "threshold_percent": "1.0", "verdict": "WITHIN_THRESHOLD" },
      { "kind": "SAMPLE", "sample_size": 400, "field_level_matches": 399, "mismatches": [{ "row_key": "OBL/2019/4471", "field": "due_rule_detail", "source": "+30 days", "target": "+30 days from period end", "assessment": "SEMANTICALLY_EQUIVALENT" }], "verdict": "PASS" }
    ],
    "unresolved_population": { "count": 1184, "owner_post_id": "post_01HZYT8V9V0W1X2Y3Z4A5B6C70", "resolution_deadline": "2027-05-10", "within_cutover_threshold": true, "cutover_threshold": 2000 },
    "sign_offs": [
      { "function": "DOMAIN", "signer": { "type": "person", "id": "per_01HZYV9V0W1X2Y3Z4A5B6C7D80", "display": "P. Xess" }, "signed_at": "2027-04-12T10:00:00Z" },
      { "function": "RECORDS_LEGAL_OWNER", "signer": { "type": "person", "id": "per_01HZYV0W1X2Y3Z4A5B6C7D8E90", "display": "S. Devi" }, "signed_at": "2027-04-12T14:00:00Z" }
    ],
    "links": { "self": "/api/v1/migration-reconciliations/mgrc_01HZYS7T8V9V0W1X2Y3Z4A5B60" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-04-12T14:00:00Z" }
}
```

---

## POST /cutover-plans/{id}/actions — APPROVE

**Cutover approval requires a declared rollback point and criteria, and unresolved reconciliation within threshold.**

```json
{
  "success": true,
  "message": "Cutover approved",
  "data": {
    "id": "ctpl_01HZYW1X2Y3Z4A5B6C7D8E9F00",
    "object": "cutover_plan",
    "version": 4,
    "state": "APPROVED",
    "available_actions": ["EXECUTE", "CANCEL"],
    "freeze_window": { "from": "2027-05-15T18:30:00Z", "to": "2027-05-16T02:30:00Z" },
    "delta_migration": { "required": true, "source_cut": "2027-04-10T00:00:00Z", "expected_delta_rows": 4182 },
    "order": ["FREEZE_LEGACY", "DELTA_MIGRATE", "RECONCILE_DELTA", "SWITCH_DNS", "SMOKE", "UNFREEZE"],
    "readiness": { "operational_readiness_review_id": "orrv_01HZYX2Y3Z4A5B6C7D8E9F0G10", "verdict": "PASS" },
    "rollback": { "declared": true, "rollback_point": "Legacy Oracle remains authoritative and writable until UNFREEZE completes", "rollback_criteria": ["Delta reconciliation deviation above 1%", "Any smoke-test failure on an authorization path", "RTO exceeded by 30 minutes"], "rollback_tested_at": "2027-05-08T02:00:00Z" },
    "unresolved_reconciliation": { "count": 214, "threshold": 2000, "within_threshold": true },
    "go_no_go_authority": { "post_id": "post_01HZYY3Z4A5B6C7D8E9F0G1H20", "display": "Programme Director" },
    "hypercare": { "from": "2027-05-16T02:30:00Z", "to": "2027-05-30T00:00:00Z", "on_call_roster_ref": "roster_01HZYZ4A5B6C7D8E9F0G1H2130" },
    "approved_at": "2027-05-12T10:00:00Z",
    "links": { "self": "/api/v1/cutover-plans/ctpl_01HZYW1X2Y3Z4A5B6C7D8E9F00" }
  },
  "meta": { "action": "APPROVE", "transition": { "from": "READY", "to": "APPROVED" }, "effects": [ { "object": "audit_event", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-05-12T10:00:00Z" }
}
```

**Legacy retirement requires measured parity, a named records and legal owner, and a recoverable archive or export.** A `legacy_retirement_record` without all three cannot reach irreversible shutdown approval.

---

## POST /operational-incidents

**Auth:** `platform.incident.raise`. These are **platform** incidents — an outage, a data-integrity fault, a security event. They are distinct from mine incidents ([`../incidents/incidents.md`](../incidents/incidents.md)) and never merged with them.

```json
{
  "success": true,
  "data": {
    "id": "opin_01HZZ0A5B6C7D8E9F0G1H213J0",
    "object": "operational_incident",
    "version": 5,
    "tenant_id": null,
    "state": "RESOLVED",
    "available_actions": ["RECORD_EVENT", "CLOSE"],
    "severity": "SEV2",
    "title": "Attendance presence projection lag exceeded 30 minutes at four mines",
    "impact": { "affected_services": ["attendance-projection"], "affected_tenants": ["ten_01HZX1A2B3C4D5E6F7G8H9J0K0"], "affected_mines": 4, "user_impact": "Presence boards showed stale state during the B shift; no muster was active", "safety_impact_assessed": true, "safety_impact": "NONE_OBSERVED", "safety_impact_note": "No emergency muster was open during the degradation window. Had one been, the board's own projection_lag field would have shown the staleness." },
    "detection": { "source": "SLO_BURN_ALERT", "service_objective_version_id": "sovv_01HZZ1B6C7D8E9F0G1H213J4K0", "detected_at": "2027-04-18T14:12:00Z", "time_to_detect": "PT6M" },
    "timeline": [
      { "at": "2027-04-18T14:06:00Z", "event": "Projection consumer lease expired repeatedly under a lock-contention spike" },
      { "at": "2027-04-18T14:12:00Z", "event": "SLO burn alert fired" },
      { "at": "2027-04-18T14:31:00Z", "event": "Consumer concurrency reduced; lag recovering" },
      { "at": "2027-04-18T15:02:00Z", "event": "Lag under 60 s at all four mines" }
    ],
    "error_budget": { "service_objective_version_id": "sovv_01HZZ1B6C7D8E9F0G1H213J4K0", "budget_window": "P30D", "consumed_percent": "41.2", "remaining_percent": "58.8" },
    "communications": [{ "audience": "AFFECTED_TENANT_ADMINISTRATORS", "sent_at": "2027-04-18T14:40:00Z" }],
    "recovery": { "recovered_at": "2027-04-18T15:02:00Z", "time_to_recover": "PT56M", "data_loss": "NONE", "projection_rebuilt": true },
    "postmortem": { "document_id": "doc_01HZZ2C7D8E9F0G1H213J4K5T0", "published_at": "2027-04-22T10:00:00Z", "blameless": true },
    "corrective_actions": [
      { "id": "corr_01HZZ3D8E9F0G1H213J4K5T6M0", "detail": "Partition the presence projection consumer by mine so one mine's contention cannot stall three others", "owner_post_id": "post_01HZYD3E4F5G6H7J8K9T0M1N20", "due_on": "2027-06-15", "state": "OPEN" }
    ],
    "opened_at": "2027-04-18T14:12:00Z",
    "resolved_at": "2027-04-18T15:02:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/operational-incidents/opin_01HZZ0A5B6C7D8E9F0G1H213J0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-04-22T10:00:00Z" }
}
```

`safety_impact_assessed: true` is required on every platform incident. A compliance system's outage is not merely an availability number, and the record forces someone to say whether anybody was put at risk.

---

## Invariants

- Audit and event IDs and partition sequences are unique, and accepted events are insert-only.
- Every material domain mutation references one audit event and one outbox event, committed atomically.
- Actor principal, person, and supporting authority are server-derived; system actions name their workload identity.
- Occurred, recorded, and committed times, and their confidence, are never collapsed into one field.
- Corrections and supersessions append and reference the prior event. No audit update or delete path exists.
- Hash chains and checkpoints are partitioned, gap-detecting, and independently anchored — and the chain alone is never authorization.
- Sensitive payloads are classified, minimised, and referenced by hash; ordinary telemetry excludes them.
- Consumers deduplicate by stable message id or hash and advance checkpoints only after durable processing.
- Historical reconstruction binds event, snapshot, policy, and code versions, and exposes its incompleteness.
- A legal hold overrides disposal; backup expiry is a schedule, never a mutable deletion promise.
- A release cannot be approved while a mandatory gate fails or an exception is expired or non-waivable.
- Every risk exception has a mandatory scope, owner, expiry, and compensating control.
- Restore and DR success require application-level integrity and reconciliation, not infrastructure startup.
- A migration unknown or conflict never defaults to active, compliant, or approved, and never disappears from the totals.
- Cutover approval requires a declared rollback point and criteria, and unresolved reconciliation within threshold.
- Legacy retirement requires measured parity, a named records and legal owner, and a recoverable archive or export.

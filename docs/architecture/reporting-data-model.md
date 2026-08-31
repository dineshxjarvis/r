# Statutory Reporting — Logical Data Model

Read with the [reporting specification](../features/reporting/statutory-reporting-spec.md). Compliance owns duties/verification; source domains own facts; documents own artifacts; integration adapters own transport execution.

## 1. Definition and obligation

- `report_definition`: stable semantic report/return identity and receiving authority.
- `report_definition_version`: immutable source, applicability interface, period/schema, validation, signer, format/channel and correction policy.
- `report_field_definition`: semantic field/repeat group, type/unit/code/privacy and conditionality.
- `report_source_binding_rule`: target field, source domain/query/expression, temporal/aggregation/coverage/unit policy.
- `report_validation_rule`: structural/semantic/cross-domain/report/authority-schema rule and blocking/override class.
- `filing_obligation`: definition version, obligation instance, subject/mine, period, recipient and deadlines.

## 2. Compilation, validation and attestation

- `report_instance`: filing obligation, definition version, period, lifecycle and current compilation.
- `report_compilation`: compiler version, as-of cut, canonical content hash, source manifest and supersession.
- `report_field_value`: semantic field path, canonical typed value, display value and source/manual assertion.
- `report_source_manifest_entry`: source object/version/field, interval, transform/unit, coverage, freshness and hash.
- `report_validation_run` / `report_validation_result`: rule version, outcome, values, evidence and overrideability.
- `report_review`: accept/return with authority, reasons and expected compilation version.
- `report_attestation`: signer principal/person/appointment/mandate snapshot, consent, manifest/content hash, signature mechanism/value, certificate/status/timestamp evidence and order.

## 3. Package and filing

- `report_rendering`: compilation, template/renderer version, format, artifact/hash and deterministic-equivalence metadata.
- `filing_package`: exact renderings/attachments/attestations, canonical package manifest/hash and state.
- `filing_submission`: package, channel profile/version, idempotency/correlation, lifecycle and submitted actor/mode.
- `filing_attempt`: request/payload hash, start/end, transport result, remote/raw response artifact and retry relation.
- `filing_receipt`: receipt kind, authority/system, remote reference, received time, artifact/hash and correlation proof.
- `filing_authority_status`: acknowledged/accepted/returned/rejected/withdrawn state, effective time, reason and external evidence.
- `filing_reconciliation_case`: local/remote mismatch, owner, attempts and resolution.
- `filing_correction_link`: original/replacement filing, correction kind, authority reference and reason.
- `filing_impact_case`: changed source/definition/certificate/evidence and affected reports/filings.

## 4. Constraints

1. Published definition versions are immutable and effective periods cannot overlap ambiguously for one authority/profile key.
2. Every field value is typed and either source-bound or an authorized manual assertion with reason/evidence.
3. Frozen compilation references exact source versions; source updates never mutate it.
4. `READY_TO_ATTEST` requires all blocking validation results pass and permitted warning overrides be complete.
5. Attestation binds canonical content and source/package manifest hashes plus current signing authority.
6. Any content/package mutation invalidates readiness; existing attestation remains historical but cannot authorize the new package.
7. Private keys, PINs and portal passwords have no persistence fields.
8. NIL compilation requires explicit definition predicate, complete required coverage and no contradiction.
9. `TRANSMITTED` requires attempt evidence; `ACKNOWLEDGED` requires correlated receiver evidence; `ACCEPTED` requires authority status evidence where defined.
10. HTTP status, email sent or upload completion alone cannot populate authority acknowledgement.
11. Manual submission requires two distinct confirmations where configured and receipt/package hash.
12. Retry reuses idempotency/correlation policy and uncertain transport reconciles before resending.
13. Return/rejection/correction never deletes or updates the original filing/package.
14. Filing timeliness retains original obligation deadline and qualifying submission-event policy.
15. Obligation satisfaction is not a reporting state or column.
16. Every list/read applies source classification and recipient/purpose projection.

## 5. Lifecycles

```text
report: DRAFT → COMPILING → READY_FOR_REVIEW → READY_TO_ATTEST → ATTESTED
                    ↘ VALIDATION_FAILED      ↘ RETURNED
attested → SUPERSEDED

filing: READY_TO_SUBMIT → QUEUED → TRANSMITTING → TRANSMITTED
       → ACKNOWLEDGEMENT_PENDING → ACKNOWLEDGED → ACCEPTED | RETURNED | REJECTED
       → WITHDRAWN | SUPERSEDED
```

An attempt may be `SUCCEEDED`, `FAILED_RETRYABLE`, `FAILED_FINAL` or `OUTCOME_UNKNOWN`. Filing and attempt states are separate.

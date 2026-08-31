# Strata — Statutory Reports, Returns and Filing Packages Specification

## 1. Purpose and boundary

This specification owns `CAP-15` and PS §4.13. Read it before changing statutory report definitions, periodic returns, NIL returns, source binding, pre-submission validation, signatures, filing packages, corrections, submission status or acknowledgement.

Reporting owns report/return definitions, filing obligations, compiled report instances, source manifests, validation, attestation, rendered packages and filing lifecycle. Source domains own facts; compliance owns the duty and whether it was satisfied; documents own immutable artifacts; identity owns signing authority; integrations own external transport; receiving authorities own official acceptance/decision.

## 2. The six states users must never confuse

```text
GENERATED     content rendered locally
VALIDATED     required fields and cross-checks passed under a policy version
ATTESTED      authorized signer bound themselves to exact canonical content
TRANSMITTED   adapter/manual process sent the package
ACKNOWLEDGED  receiving system issued a correlated receipt/reference
ACCEPTED      authority accepted/registered the filing, where that state exists
```

None implies the next. A report may be transmitted and later returned. An accepted filing may still contain a legally false claim. Compliance verification remains separate.

## 3. Official operating context

PARIVESH's published six-monthly compliance flow includes reporting period, production/project details, condition-by-condition self-compliance, evidence, undertaking, e-authentication and submission. A January 2026 MoEFCC memorandum made its dedicated CCR module online-only from 1 March 2026 after a hybrid transition. CCA provides regulated DSC, eSign and time-stamping frameworks. Therefore channel, authentication/signature and acknowledgement rules must be effective-dated per filing type; Strata must not claim every authority uses one PDF, DSC class or API.

Official references:

- [PARIVESH six-monthly compliance flow](https://parivesh.nic.in/publicdocument/UPLOAD_OM_NOTIFICATION/IA_DOCS/Manual/1187428054%24299_OM_14_06_2022.pdf)
- [MoEFCC PARIVESH CCR memorandum, 19 January 2026](https://parivesh.nic.in/publicdocument/UPLOAD_OM_NOTIFICATION/IA_DOCS/1002_25012026043343.pdf)
- [CCA eSign service](https://cca.gov.in/eSign.html)
- [CCA PKI guidelines](https://cca.gov.in/guidelines.html)

## 4. Definition, filing obligation and template

A stable `report_definition` describes the semantic return, not one mine's filing. An immutable effective `report_definition_version` contains:

- governing instrument/source anchors, receiving authority and filing purpose;
- applicable subject/context and reporting-period/calendar rule;
- field/section/repeat-group schema, units, code lists and conditional requirements;
- source-binding rules and allowed manual assertions;
- NIL eligibility and contradiction predicates;
- validation/cross-report reconciliation rules;
- signer authority, assurance/signature mechanism and co-sign/order policy;
- rendering/package formats, attachments, file constraints and language;
- channel/adapter profile and acknowledgement/acceptance semantics; and
- amendment/correction/cancellation rules, deadlines and retention.

A `filing_obligation` binds that definition version to an obligation instance, mine/entity, period, recipient and due dates. National/shared definition is not duplicated per mine. Applicability selects filing obligations; the definition does not own mine applicability.

Templates are presentation/transport assets bound to semantic fields. A portal schema change creates a new version even if the visible form name stays unchanged. PDFs, XML/JSON, portal forms and CSV may be generated from the same canonical report content where policy permits.

## 5. Compilation and source manifest

```text
filing obligation opens → compiler resolves approved source bindings
→ source snapshots frozen → missing/conflicting inputs surfaced
→ preparer resolves permitted manual assertions → validation
→ reviewer accepts/returns → canonical content frozen
→ signer preview/consent → signature(s) → package generation
```

Every field value has `source_binding` provenance: source domain/object/version, field/expression, extraction/transformation policy, as-of/event interval, unit conversion, coverage and compiler version. Manual values require actor authority, reason and evidence and are visually distinct.

The `report_source_manifest` hashes exact source versions, canonical values, attachments, definition/validation/template versions and unresolved/accepted exceptions. Rendering is deterministic from canonical content plus template. Regeneration with the same manifest must produce equivalent canonical content; binary PDF equality is required only when the renderer contract guarantees it.

Late source changes do not silently alter a frozen report. An impact event identifies affected drafts, attestations and filings and routes amendment/correction review.

## 6. Validation and reconciliation

Validation has independent results:

- `STRUCTURAL`: types, cardinality, mandatory fields and package constraints;
- `SEMANTIC`: units, ranges, totals, periods and controlled codes;
- `SOURCE_COVERAGE`: complete/qualified/missing source evidence;
- `CROSS_FIELD`: internal arithmetic and conditional logic;
- `CROSS_DOMAIN`: incident/production/environment/attendance/contractor facts;
- `CROSS_REPORT`: prior period, related authority return or external mirror difference;
- `AUTHORITY_SCHEMA`: portal/template version compatibility; and
- `SIGNATURE_READY`: current signer route and mechanism requirements.

Results are `PASS`, `WARN`, `FAIL`, `NOT_APPLICABLE` or `UNAVAILABLE`. Only policy-declared warnings are overridable, with independent authority, reason and compensating evidence. Missing data is not zero. Differences create reconciliation items; they are never “fixed” by overwriting a source fact inside reporting.

## 7. NIL returns and declarations

NIL is a typed signed statement over a defined predicate, population, period and source cut—not a blank report or checkbox. Only a definition version with `nil_permitted` and exact NIL semantics permits it. The compiler tests contradiction rules against all declared source domains and coverage.

```text
NIL candidate + complete required source coverage + no contradiction
→ review → attestation → filing
```

Unknown/incomplete feeds cannot produce NIL. A later contradictory incident/fact opens a potential false-declaration finding and filing-impact case; it does not erase the signed statement.

## 8. Review, attestation and signature

Preparer, reviewer and signer are participation functions backed by current capabilities/posts. Statutory signature authority is evaluated at the instant of each signature against filing subject, definition, period, recipient, appointment/mandate/jurisdiction and assurance. Selected workspace and earlier approval do not grant signing power.

The signer sees human-readable canonical content, source coverage, warnings/exceptions, recipient, period and exact manifest hash before explicit consent. The system stores signature value, certificate chain/identity reference, certificate status evidence at signing, signature policy/mechanism, trusted timestamp where required and signer appointment/authority snapshot.

Signature mechanism is configured by the authority/channel profile—CCA DSC, eSign, portal e-authentication or another approved mechanism. Do not hard-code “Class 3 DSC for all statutory reports.” Private signing keys and PINs never enter Strata. Multiple/ordered signatures remain separate attestations; later package mutation invalidates readiness and requires new signatures.

## 9. Package and filing lifecycle

Report states: `DRAFT`, `COMPILING`, `VALIDATION_FAILED`, `READY_FOR_REVIEW`, `RETURNED`, `READY_TO_ATTEST`, `ATTESTING`, `ATTESTED`, `SUPERSEDED`, `CANCELLED`.

Filing states:

```text
READY_TO_SUBMIT → QUEUED → TRANSMITTING → TRANSMITTED
→ ACKNOWLEDGEMENT_PENDING → ACKNOWLEDGED
→ ACCEPTED | RETURNED | REJECTED | WITHDRAWN | SUPERSEDED
```

A channel may end at `ACKNOWLEDGED` if no separate acceptance status exists; the profile says so. Adapter receipts record request/correlation/idempotency, payload hash, remote reference and raw signed/hashed response. Email sent, HTTP 2xx, browser upload completion or manual courier dispatch are transport evidence only.

Manual filing requires two-person capture/confirmation of authority reference, channel, submitted time, package hash and receipt artifact. A later authority status is separately recorded or reconciled.

## 10. Return, correction, amendment and withdrawal

- Authority return/rejection preserves original package, reason, remote evidence and deadline consequences.
- A corrected filing creates a new report/filing linked to the original and the authority's correction/amendment semantics.
- Source fact correction remains in its source domain; reporting compiles the new version and shows the delta.
- Withdrawal/cancellation requires allowed policy, authority and external confirmation where applicable.
- A late filing never changes its original due time; timeliness is derived from accepted submission-event policy.
- Duplicate submissions are detected by authority/definition/subject/period/package/idempotency but never auto-deleted.

## 11. Ownership, roles and separation

| Action | Capability/authority | Separation |
|---|---|---|
| Configure/publish definition | Reporting policy owner + legal/authority review | Draft author cannot alone publish high-risk definition |
| Prepare/compile | `report.prepare` | Cannot make source facts true |
| Resolve source mapping | `report.source_map.resolve` | Source correction belongs to source owner |
| Review/return | `report.review` | Reviewer independent where policy requires |
| Override warning | `report.validation.override` | Never overrides non-overridable failure |
| Attest/sign | `report.attest` + current signing authority | Delegate/administrator cannot inherit signature authority |
| Submit/manual-confirm | `filing.submit` / `filing.record_manual` | Cannot invent authority acknowledgement |
| Record/reconcile authority status | adapter principal or `filing.reconcile` | Preserves external evidence |
| Correct/withdraw | `filing.correct` / `filing.withdraw` | Follows definition/channel policy |

## 12. Failure and recovery

- Source unavailable/stale: compilation records `UNAVAILABLE`/coverage failure; no zero/default.
- External portal down: queue before deadline, retain evidence; legal fallback channel only if effective profile permits it.
- Timeout after send: status `TRANSMISSION_UNKNOWN`; query/reconcile by idempotency/correlation before retry.
- Duplicate retry: remote/local idempotency prevents duplicate where supported; otherwise open reconciliation.
- Signer absent/vacant/expired: route to independently valid authorized post; do not transfer authority by delegation.
- Certificate revoked/expired after signing: retain validation-at-signing evidence and assess policy impact; never silently strip signature.
- Template changes mid-draft: retain old version; explicitly migrate/recompile or finish under allowed transition policy.
- Authority changes returned data: retain external snapshot and reconcile, never overwrite local source.
- Deadline passes during outage: preserve attempts/outage/fallback proof and mark timeliness honestly.

## 13. Privacy, classification and retention

Each field and attachment inherits source classification plus filing-purpose rules. Worker/medical/commercial/restricted GIS details use minimum-necessary recipient and internal projections. Report list/search does not expose contents merely because metadata is visible. Package downloads and authority reads are purpose-logged.

Definitions, manifests, canonical content, validation results, signatures, packages, attempts, receipts, authority statuses, corrections and source-impact records follow statutory/records schedules and legal holds. Secrets, portal passwords, signing PINs and private keys are never retained.

## 14. Acceptance scenarios

1. Same definition version produces filings for many mines without duplicating national semantics.
2. Missing source value remains missing and blocks where configured; it never becomes zero.
3. A NIL accident return is blocked when an incident exists or required feed coverage is incomplete.
4. A source value changes after freeze; signed content remains unchanged and an impact case opens.
5. Expired appointment denies signing even after review approval.
6. Portal e-authentication profile works without forcing a DSC-token assumption.
7. HTTP 200 without remote filing reference remains `ACKNOWLEDGEMENT_PENDING` or unknown.
8. Timeout after send reconciles before retry and does not silently duplicate.
9. Authority return creates a correction chain and preserves original filing/deadline.
10. Manual filing needs package hash, two-person confirmation and receipt evidence.
11. Regeneration identifies exact definition, source, validation, template and renderer versions.
12. Obligation verification consumes filing/acknowledgement evidence but remains compliance-owned.

## 15. Non-goals

- Replacing PARIVESH, Shram Suvidha, DGMS, PRIMS or another receiving authority's legal decision.
- One universal statutory form, signature mechanism, acknowledgement state or transport API.
- Correcting operational source data inside a report.
- Treating submission, acknowledgement or acceptance as verified compliance.
- AI-generated legal declarations or autonomous signature/submission.

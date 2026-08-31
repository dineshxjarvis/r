# Reporting — definitions, compilation, attestation, filing, and authority status

Domain rules: [`../../../features/reporting/statutory-reporting-spec.md`](../../../features/reporting/statutory-reporting-spec.md). Relational contract: [`../../../architecture/reporting-data-model.md`](../../../architecture/reporting-data-model.md). Conventions: [`../../README.md`](../../README.md).

Three claims that this domain keeps strictly apart:

| Claim | Evidence required |
|---|---|
| **We sent it** | A `filing_attempt` with a transport result |
| **They received it** | A correlated `filing_receipt` from the receiver |
| **They accepted it** | A `filing_authority_status` from the authority |

**An HTTP 200, a sent email, or a completed upload can never populate authority acknowledgement.** Most compliance failures in this space are an organisation believing claim one proves claim three.

**Obligation satisfaction is not a reporting state and not a column here.** A filed return does not close an obligation — [`../documents/obligations.md`](../documents/obligations.md) owns that, under its own verification gate.

## Routes

| Route | Purpose |
|---|---|
| `GET /report-definition-versions` · `POST /report-definition-versions` · `POST /report-definition-versions/{id}/actions` | Stable identity and immutable versioned form semantics; `?view=current` replaces the definition list |
| `GET /filing-obligations` · `POST /filing-obligations` · `POST /filing-obligations/{id}/actions` | What is due, to whom, by when |
| `GET /report-instances` · `POST /report-instances` · `GET /report-instances/{id}` · `POST /report-instances/{id}/actions` | Compile, validate, review, attest |
| `GET /report-compilations` · `POST /report-compilations/{id}/actions` | Frozen content and its source manifest |
| `GET /report-validation-results` · `POST /report-validation-results/{id}/actions` | Override a warning, never a blocker |
| `GET /filing-packages` · `POST /filing-packages` · `GET /filing-packages/{id}` | Renderings, attachments, attestations, one hash |
| `GET /filing-submissions` · `POST /filing-submissions` · `GET /filing-submissions/{id}` · `POST /filing-submissions/{id}/actions` | Transport, receipts, authority status, corrections |
| `GET /filing-reconciliation-cases` · `POST /filing-reconciliation-cases/{id}/actions` | Local versus remote mismatch |
| `GET /filing-impact-cases` · `POST /filing-impact-cases` · `POST /filing-impact-cases/{id}/actions` | What a late source change breaks |

`GET /report-definitions` is replaced by `GET /report-definition-versions?view=current`, which returns one effective version with its stable definition reference. Posting a version with no `definition_id` atomically establishes the stable definition and first version; later versions require `definition_id`.

`GET /reporting/health` is `GET /filing-submissions?group_by=state&metrics=count` plus `GET /filing-obligations?filter[overdue]=true`.

---

## POST /report-definition-versions

**Auth:** `reporting.definition.manage` on the receiving authority profile. **Published versions are immutable**, and effective periods cannot overlap ambiguously for one authority/profile key.

```json
{
  "report_definition_id": "rdef_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "version_label": "DGMS Form IV, 2026 revision",
  "source_instrument": { "instrument": "MINES_RULES_1955", "provision": "Rule 79", "authority_code": "DGMS", "document_version_id": "dv_01HZY2B3C4D5E6F7G8H9J0K1T0" },
  "applicability_interface": { "subject_kind": "MINE", "predicate": { "all": [{ "field": "mine.state", "op": "eq", "value": "OPERATIONAL" }] } },
  "period_rule": { "kind": "CALENDAR_QUARTER", "timezone": "Asia/Kolkata", "deadline_rule": { "offset_from_period_end": "P21D" } },
  "field_definitions": [
    { "path": "employment.belowground_average", "semantic_type": "COUNT", "unit": null, "required": true, "privacy_class": "INTERNAL", "conditionality": null },
    { "path": "production.rom_output", "semantic_type": "QUANTITY", "unit": "TONNE", "basis": "AIR_DRIED", "required": true, "privacy_class": "INTERNAL", "conditionality": null },
    { "path": "accidents.reportable[].date", "semantic_type": "DATE", "required": true, "repeat_group": "accidents.reportable", "privacy_class": "RESTRICTED" }
  ],
  "source_binding_rules": [
    { "target_field": "production.rom_output", "source_domain": "production", "source_query": "approved_production_fact", "selector": { "fact_kind": "ROM_PRODUCTION", "dimensions": { "mine_id": "$subject.mine_id" } }, "temporal_policy": "PERIOD_EXACT", "aggregation": "SUM", "coverage_policy": { "min_coverage_percent": "100.0", "on_shortfall": "BLOCK" }, "unit_policy": { "target_unit": "TONNE", "target_basis": "AIR_DRIED", "conversion_required": true } },
    { "target_field": "employment.belowground_average", "source_domain": "attendance", "source_query": "attendance_register_generation", "selector": { "state": "ATTESTED" }, "temporal_policy": "PERIOD_EXACT", "aggregation": "AVERAGE_PER_WORKING_DAY", "coverage_policy": { "min_coverage_percent": "95.0", "on_shortfall": "WARN" } }
  ],
  "validation_rules": [
    { "code": "PRODUCTION_NON_NEGATIVE", "rule_class": "STRUCTURAL", "blocking": true, "expression": "production.rom_output >= 0" },
    { "code": "ACCIDENT_COUNT_MATCHES_INCIDENT_DOMAIN", "rule_class": "CROSS_DOMAIN", "blocking": true, "expression": "count(accidents.reportable) == incidents.reportable_count(period)" },
    { "code": "EMPLOYMENT_COVERAGE", "rule_class": "SEMANTIC", "blocking": false, "overridable_by": "reporting.validation.override" }
  ],
  "signer_policy": { "required_capability": "reporting.attest", "required_post_kinds": ["MINE_MANAGER"], "required_assurance": "PASSKEY", "signature_mechanism": "DSC", "signer_count": 1 },
  "format_policy": { "formats": ["PDF_A2B", "XML"], "template_version": "DGMS_FORM_IV_v6" },
  "channel_policy": { "channels": ["AUTHORITY_PORTAL", "REGISTERED_POST"], "primary": "AUTHORITY_PORTAL" },
  "correction_policy": { "corrections_permitted": true, "correction_kinds": ["REVISED_RETURN", "SUPPLEMENTARY_RETURN"], "requires_authority_reference": true },
  "nil_predicate": { "permitted": true, "expression": "production.rom_output == 0 and count(accidents.reportable) == 0", "requires_complete_coverage": true },
  "effective_from": "2027-01-01T00:00:00Z",
  "effective_until": null,
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Definition version created",
  "data": {
    "id": "rdfv_01HZY3C4D5E6F7G8H9J0K1T2M0",
    "object": "report_definition_version",
    "version": 1,
    "tenant_id": null,
    "state": "DRAFT",
    "available_actions": ["PUBLISH", "WITHDRAW"],
    "report_definition": { "type": "report_definition", "id": "rdef_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "DGMS Form IV quarterly return" },
    "receiving_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
    "version_label": "DGMS Form IV, 2026 revision",
    "version_number": 6,
    "source_instrument": { "instrument": "MINES_RULES_1955", "provision": "Rule 79", "authority_code": "DGMS", "document_version_id": "dv_01HZY2B3C4D5E6F7G8H9J0K1T0" },
    "field_count": 3,
    "source_binding_rule_count": 2,
    "validation_rule_count": 3,
    "blocking_validation_rule_count": 2,
    "signer_policy": { "required_capability": "reporting.attest", "required_post_kinds": ["MINE_MANAGER"], "required_assurance": "PASSKEY", "signature_mechanism": "DSC", "signer_count": 1 },
    "nil_predicate": { "permitted": true, "expression": "production.rom_output == 0 and count(accidents.reportable) == 0", "requires_complete_coverage": true },
    "effective_from": "2027-01-01T00:00:00Z",
    "effective_until": null,
    "supersedes_version_id": "rdfv_01HZY4D5E6F7G8H9J0K1T2M3N0",
    "immutable_after_publication": true,
    "created_at": "2026-11-01T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/report-definition-versions/rdfv_01HZY3C4D5E6F7G8H9J0K1T2M0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-11-01T10:00:00Z" }
}
```

Note there is **no field for a portal password, a PIN, or a private key** anywhere in `signer_policy` or `channel_policy`. Those have no persistence fields in this model at all.

---

## POST /report-instances/{id}/actions — COMPILE

**Auth:** `reporting.compile` on the subject.

```json
{
  "action": "COMPILE",
  "expected_version": 1,
  "payload": { "as_of_cut": "2027-01-07T18:30:00Z", "compiler_version": "report-compiler@v9" }
}
```

```json
{
  "success": true,
  "message": "Compiled; 1 field blocked on source coverage",
  "data": {
    "id": "rins_01HZY5E6F7G8H9J0K1T2M3N400",
    "object": "report_instance",
    "version": 2,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "VALIDATION_FAILED",
    "available_actions": ["COMPILE", "ADD_MANUAL_VALUE", "RUN_VALIDATION"],
    "filing_obligation": { "type": "filing_obligation", "id": "fobl_01HZY6F7G8H9J0K1T2M3N405P0", "display": "DGMS Form IV, Gevra OCP, Q3 FY2026-27" },
    "report_definition_version": { "type": "report_definition_version", "id": "rdfv_01HZY3C4D5E6F7G8H9J0K1T2M0", "display": "DGMS Form IV v6" },
    "period": { "from": "2026-10-01", "to": "2027-01-01", "bounds": "[)" },
    "deadline_at": "2027-01-22T00:00:00Z",
    "current_compilation": {
      "id": "rcmp_01HZY7G8H9J0K1T2M3N405P6Q0",
      "object": "report_compilation",
      "compiler_version": "report-compiler@v9",
      "as_of_cut": "2027-01-07T18:30:00Z",
      "canonical_content_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
      "frozen": true,
      "supersedes_id": null,
      "field_values": [
        { "path": "production.rom_output", "canonical_value": { "value": "17842118.400", "unit": "TONNE", "basis": "AIR_DRIED" }, "display_value": "1,78,42,118.400 t", "assertion_kind": "SOURCE_BOUND", "source_manifest_entry_id": "rsme_01HZY8H9J0K1T2M3N405P6Q7R0" },
        { "path": "employment.belowground_average", "canonical_value": null, "display_value": null, "assertion_kind": "UNRESOLVED", "unresolved_reason": "SOURCE_COVERAGE_SHORTFALL" },
        { "path": "accidents.reportable[0].date", "canonical_value": "2026-11-18", "display_value": "18 November 2026", "assertion_kind": "SOURCE_BOUND", "source_manifest_entry_id": "rsme_01HZY9J0K1T2M3N405P6Q7R8S0" }
      ],
      "source_manifest": [
        { "id": "rsme_01HZY8H9J0K1T2M3N405P6Q7R0", "target_field": "production.rom_output", "source_object": "approved_production_fact", "source_ids": ["apf_01HZYA0B1C2D3E4F5G6H7J8K90", "apf_01HZYB1C2D3E4F5G6H7J8K9T00", "apf_01HZYC2D3E4F5G6H7J8K9T0M10"], "source_versions": [1, 1, 2], "interval": { "from": "2026-10-01", "to": "2027-01-01" }, "transform": "SUM", "unit_conversion": { "from_unit": "TONNE", "to_unit": "TONNE", "conversion_version": 4 }, "coverage_percent": "100.0", "freshness": "2027-01-05T10:00:00Z", "entry_hash": "sha256:7d1a9c4e…" },
        { "id": "rsme_01HZYD3E4F5G6H7J8K9T0M1N20", "target_field": "employment.belowground_average", "source_object": "attendance_register_generation", "source_ids": ["areg_01HZYY3Z4A5B6C7D8E9F0G1H20"], "interval": { "from": "2026-10-01", "to": "2027-01-01" }, "transform": "AVERAGE_PER_WORKING_DAY", "coverage_percent": "78.3", "coverage_required_percent": "95.0", "shortfall_action": "WARN", "freshness": "2027-01-06T02:00:00Z" }
      ]
    },
    "validation_summary": { "run_id": "rvrn_01HZYE4F5G6H7J8K9T0M1N2030", "blocking_failures": 1, "warnings": 1, "passed": 1 },
    "compilation_history": [{ "id": "rcmp_01HZY7G8H9J0K1T2M3N405P6Q0", "compiled_at": "2027-01-07T18:35:00Z", "superseded": false }],
    "created_at": "2027-01-02T00:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/report-instances/rins_01HZY5E6F7G8H9J0K1T2M3N400" }
  },
  "meta": {
    "action": "COMPILE",
    "transition": { "from": "DRAFT", "to": "VALIDATION_FAILED" },
    "effects": [ { "object": "report_compilation", "id": "rcmp_01HZY7G8H9J0K1T2M3N405P6Q0", "change": "CREATED" }, { "object": "report_validation_run", "id": "rvrn_01HZYE4F5G6H7J8K9T0M1N2030", "change": "CREATED" }, { "object": "notification", "count": 2, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2027-01-07T18:35:00Z"
  }
}
```

Every field value is **typed and either source-bound or an authorised manual assertion**. `employment.belowground_average` is `UNRESOLVED` rather than estimated — a compiler that fills a statutory return with a plausible guess is the worst possible feature.

A **frozen compilation references exact source versions**. Later production restatements never mutate it; they raise a `filing_impact_case` instead.

### ADD_MANUAL_VALUE

```json
{
  "action": "ADD_MANUAL_VALUE",
  "expected_version": 2,
  "reason": "Attendance registers for 21 days in October predate the reader installation and were kept on paper; belowground average taken from the attested paper registers",
  "payload": { "path": "employment.belowground_average", "canonical_value": 184, "evidence_ids": ["ev_01HZYF5G6H7J8K9T0M1N203P40"], "evidence_document_ids": ["doc_01HZYG6H7J8K9T0M1N203P4Q50"] },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Manual assertion recorded; new compilation created",
  "data": {
    "id": "rins_01HZY5E6F7G8H9J0K1T2M3N400",
    "object": "report_instance",
    "version": 3,
    "state": "READY_FOR_REVIEW",
    "current_compilation": {
      "id": "rcmp_01HZYH7J8K9T0M1N203P4Q5R60",
      "canonical_content_hash": "sha256:9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
      "supersedes_id": "rcmp_01HZY7G8H9J0K1T2M3N405P6Q0",
      "field_values": [
        { "path": "employment.belowground_average", "canonical_value": 184, "display_value": "184", "assertion_kind": "MANUAL", "manual_assertion": { "asserted_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" }, "asserted_by_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "reason": "Attendance registers for 21 days in October predate the reader installation and were kept on paper; belowground average taken from the attested paper registers", "evidence_ids": ["ev_01HZYF5G6H7J8K9T0M1N203P40"], "asserted_at": "2027-01-08T10:00:00Z" } }
      ]
    },
    "validation_summary": { "run_id": "rvrn_01HZYJ8K9T0M1N203P4Q5R6S70", "blocking_failures": 0, "warnings": 1, "passed": 2 },
    "available_actions": ["REVIEW", "COMPILE"]
  },
  "meta": {
    "action": "ADD_MANUAL_VALUE",
    "transition": { "from": "VALIDATION_FAILED", "to": "READY_FOR_REVIEW" },
    "effects": [ { "object": "report_compilation", "id": "rcmp_01HZYH7J8K9T0M1N203P4Q5R60", "change": "CREATED" }, { "object": "report_compilation", "id": "rcmp_01HZY7G8H9J0K1T2M3N405P6Q0", "change": "SUPERSEDED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2027-01-08T10:00:00Z"
  }
}
```

A manual value requires an authorised asserter, a reason, and evidence. It is never a plain field edit.

---

## POST /report-instances/{id}/actions — ATTEST

**Auth:** the definition's `signer_policy`, with the required assurance. `READY_TO_ATTEST` requires **all blocking validation results to pass** and every permitted warning override to be complete.

```json
{
  "action": "ATTEST",
  "expected_version": 5,
  "payload": {
    "compilation_id": "rcmp_01HZYH7J8K9T0M1N203P4Q5R60",
    "canonical_content_hash": "sha256:9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "source_manifest_hash": "sha256:1a4f9c2e7b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8",
    "signing_identity_id": "sign_01HZY8H9J0K1T2M3N405P6Q7R0",
    "consent_statement_accepted": true,
    "challenge_response": "chal_01HZYK9T0M1N203P4Q5R6S7T80",
    "provider_result_ref": "emudhra:txn:7f21c9a4-3b55-4d0e-9a2f-1c8b7d6e5f40"
  }
}
```

```json
{
  "success": true,
  "message": "Report attested",
  "data": {
    "id": "rins_01HZY5E6F7G8H9J0K1T2M3N400",
    "object": "report_instance",
    "version": 6,
    "state": "ATTESTED",
    "attestations": [
      {
        "id": "ratt_01HZYT0M1N203P4Q5R6S7T8V90",
        "order": 1,
        "signer": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
        "signer_principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
        "signer_appointment_snapshot": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "post_display": "Mine Manager, Gevra OCP", "valid_from": "2026-04-01T00:00:00Z", "valid_until": "2029-04-01T00:00:00Z", "captured_at": "2027-01-09T11:00:00Z" },
        "signer_mandate_snapshot": null,
        "consent_statement_accepted": true,
        "canonical_content_hash": "sha256:9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
        "source_manifest_hash": "sha256:1a4f9c2e7b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8",
        "signature_mechanism": "DSC",
        "signature_value_ref": "sig_01HZYM1N203P4Q5R6S7T8V9V00",
        "certificate_fingerprint_sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
        "certificate_status_at_signing": { "status": "VALID", "checked_via": "OCSP", "checked_at": "2027-01-09T11:00:02Z" },
        "timestamp_evidence": { "tsa": "TSA-NIC", "timestamp_token_ref": "tst_01HZYN203P4Q5R6S7T8V9V0W10", "timestamped_at": "2027-01-09T11:00:03Z" },
        "assurance_at_signing": "PASSKEY",
        "attested_at": "2027-01-09T11:00:00Z"
      }
    ],
    "attested_compilation_id": "rcmp_01HZYH7J8K9T0M1N203P4Q5R60",
    "readiness_invalidated": false,
    "available_actions": ["CREATE_PACKAGE", "SUPERSEDE"]
  },
  "meta": {
    "action": "ATTEST",
    "transition": { "from": "READY_TO_ATTEST", "to": "ATTESTED" },
    "effects": [ { "object": "report_attestation", "id": "ratt_01HZYT0M1N203P4Q5R6S7T8V90", "change": "CREATED" }, { "object": "signature_event", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2027-01-09T11:00:00Z"
  }
}
```

The attestation binds the **canonical content hash and the source manifest hash** plus the signer's authority as it stood at signing. Any content or package mutation invalidates readiness: the existing attestation remains historical and **cannot authorise the new package**.

---

## POST /filing-submissions · actions

**Auth:** `reporting.file` on the subject, with the channel's configured mode.

### Action vocabulary

| Action | `reason` | `expected_version` | Effects |
|---|---|---|---|
| `TRANSMIT` | optional | required | One `filing_attempt`; state → `TRANSMITTED` **only** with attempt evidence |
| `RECORD_RECEIPT` | optional | required | Correlated receiver evidence; state → `ACKNOWLEDGED` |
| `RECORD_AUTHORITY_STATUS` | **required** on rejection | required | `ACCEPTED`, `RETURNED`, `REJECTED`, or `WITHDRAWN` |
| `RECORD_MANUAL_CONFIRMATION` | **required** | required | Two distinct confirmations where configured, plus receipt and package hash |
| `RECONCILE` | **required** | required | Resolves a local/remote mismatch before any resend |
| `CORRECT` | **required** | required | New filing linked to the original; never a mutation |
| `WITHDRAW` | **required** | required | Authority-referenced withdrawal |

### TRANSMIT

```json
{
  "action": "TRANSMIT",
  "expected_version": 1,
  "payload": { "channel_profile_id": "chpf_01HZY03P4Q5R6S7T8V9V0W1X20", "idempotency_scope": "OBLIGATION_PERIOD", "correlation_id": "SECL-GEV-FORMIV-2026Q3" }
}
```

```json
{
  "success": true,
  "message": "Transmitted; awaiting acknowledgement",
  "data": {
    "id": "fsub_01HZYP4Q5R6S7T8V9V0W1X2Y30",
    "object": "filing_submission",
    "version": 2,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACKNOWLEDGEMENT_PENDING",
    "available_actions": ["RECORD_RECEIPT", "TRANSMIT", "RECONCILE"],
    "filing_package": { "type": "filing_package", "id": "fpkg_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "display": "DGMS Form IV, Gevra OCP, Q3 FY2026-27", "package_hash": "sha256:6f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6" },
    "channel_profile": { "type": "channel_profile", "id": "chpf_01HZY03P4Q5R6S7T8V9V0W1X20", "display": "DGMS authority portal", "version": 3 },
    "correlation_id": "SECL-GEV-FORMIV-2026Q3",
    "idempotency_scope": "OBLIGATION_PERIOD",
    "submitted_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "submitted_mode": "AUTOMATED",
    "attempts": [
      { "id": "fatt_01HZYR6S7T8V9V0W1X2Y3Z4A50", "attempt_number": 1, "request_payload_hash": "sha256:6f2c8b1a…", "started_at": "2027-01-09T12:00:00Z", "ended_at": "2027-01-09T12:00:04Z", "transport_result": "SUCCEEDED", "remote_reference": "DGMS-PORTAL-SUB-2027-000841", "raw_response_document_id": "doc_01HZYS7T8V9V0W1X2Y3Z4A5B60", "retry_of_attempt_id": null }
    ],
    "receipts": [],
    "authority_statuses": [],
    "claim_ladder": { "we_sent_it": true, "they_received_it": false, "they_accepted_it": false },
    "obligation_deadline_at": "2027-01-22T00:00:00Z",
    "timeliness": { "original_deadline_at": "2027-01-22T00:00:00Z", "qualifying_event_policy": "FIRST_ACKNOWLEDGED_RECEIPT", "qualifying_event_at": null, "on_time": null },
    "created_at": "2027-01-09T11:58:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/filing-submissions/fsub_01HZYP4Q5R6S7T8V9V0W1X2Y30" }
  },
  "meta": {
    "action": "TRANSMIT",
    "transition": { "from": "QUEUED", "to": "ACKNOWLEDGEMENT_PENDING" },
    "effects": [ { "object": "filing_attempt", "id": "fatt_01HZYR6S7T8V9V0W1X2Y3Z4A50", "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2027-01-09T12:00:04Z"
  }
}
```

`claim_ladder` is returned on every submission read. A transport success moved only the first rung. `timeliness.on_time` is `null` — the qualifying event has not happened yet, so timeliness is genuinely unknown rather than optimistically true.

### Attempt with unknown outcome

```json
{
  "success": true,
  "message": "Attempt outcome unknown; reconciliation required before any resend",
  "data": {
    "id": "fsub_01HZYP4Q5R6S7T8V9V0W1X2Y30",
    "object": "filing_submission",
    "version": 3,
    "state": "ACKNOWLEDGEMENT_PENDING",
    "attempts": [
      { "id": "fatt_01HZYT8V9V0W1X2Y3Z4A5B6C70", "attempt_number": 2, "started_at": "2027-01-09T12:30:00Z", "ended_at": "2027-01-09T12:30:31Z", "transport_result": "OUTCOME_UNKNOWN", "failure_detail": "Gateway timeout after the request body was fully sent; the portal may or may not have persisted the submission", "remote_reference": null, "retry_of_attempt_id": "fatt_01HZYR6S7T8V9V0W1X2Y3Z4A50" }
    ],
    "resend_blocked": true,
    "resend_blocked_reason": "An attempt with OUTCOME_UNKNOWN must reconcile against the authority before resending, to avoid a duplicate statutory filing",
    "available_actions": ["RECONCILE"]
  },
  "meta": {
    "action": "TRANSMIT",
    "transition": null,
    "effects": [ { "object": "filing_attempt", "count": 1, "change": "CREATED" }, { "object": "filing_reconciliation_case", "id": "frec_01HZYV9V0W1X2Y3Z4A5B6C7D80", "change": "CREATED" }, { "object": "notification", "count": 2, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2027-01-09T12:30:31Z"
  }
}
```

**Filing state and attempt state are separate**, and an uncertain transport reconciles before resending. Two identical statutory returns filed by a retry loop is its own compliance problem.

### RECORD_RECEIPT then RECORD_AUTHORITY_STATUS

```json
{
  "action": "RECORD_RECEIPT",
  "expected_version": 3,
  "payload": { "receipt_kind": "PORTAL_ACKNOWLEDGEMENT", "authority_system": "DGMS_PORTAL", "remote_reference": "DGMS-PORTAL-ACK-2027-001188", "received_at": "2027-01-09T12:41:00Z", "artifact_document_id": "doc_01HZYV0W1X2Y3Z4A5B6C7D8E90", "correlation_proof": { "kind": "PACKAGE_HASH_ECHO", "echoed_hash": "sha256:6f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6", "matches": true } }
}
```

```json
{
  "success": true,
  "message": "Receipt recorded; acknowledged",
  "data": {
    "id": "fsub_01HZYP4Q5R6S7T8V9V0W1X2Y30",
    "object": "filing_submission",
    "version": 4,
    "state": "ACKNOWLEDGED",
    "receipts": [
      { "id": "frcp_01HZYW1X2Y3Z4A5B6C7D8E9F00", "receipt_kind": "PORTAL_ACKNOWLEDGEMENT", "authority_system": "DGMS_PORTAL", "remote_reference": "DGMS-PORTAL-ACK-2027-001188", "received_at": "2027-01-09T12:41:00Z", "artifact_document_id": "doc_01HZYV0W1X2Y3Z4A5B6C7D8E90", "artifact_hash": "sha256:3c9e1a7f…", "correlation_proof": { "kind": "PACKAGE_HASH_ECHO", "matches": true } }
    ],
    "claim_ladder": { "we_sent_it": true, "they_received_it": true, "they_accepted_it": false },
    "timeliness": { "original_deadline_at": "2027-01-22T00:00:00Z", "qualifying_event_policy": "FIRST_ACKNOWLEDGED_RECEIPT", "qualifying_event_at": "2027-01-09T12:41:00Z", "on_time": true, "margin": "P12DT11H19M" },
    "available_actions": ["RECORD_AUTHORITY_STATUS", "CORRECT", "WITHDRAW"]
  },
  "meta": { "action": "RECORD_RECEIPT", "transition": { "from": "ACKNOWLEDGEMENT_PENDING", "to": "ACKNOWLEDGED" }, "effects": [ { "object": "filing_receipt", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-01-09T12:41:20Z" }
}
```

Timeliness is computed against the **original obligation deadline** and the definition's qualifying-event policy. A later correction never rewrites whether the original was on time.

### RECORD_AUTHORITY_STATUS — returned

```json
{
  "action": "RECORD_AUTHORITY_STATUS",
  "expected_version": 4,
  "reason": "DGMS returned the filing: accident annexure C omitted for the 18 November reportable injury",
  "payload": { "status": "RETURNED", "effective_at": "2027-01-15T00:00:00Z", "authority_reference": "DGMS/BSP/RET/2027/0044", "external_evidence_document_id": "doc_01HZYX2Y3Z4A5B6C7D8E9F0G10", "required_corrections": ["accidents.reportable[0].annexure_c"] }
}
```

```json
{
  "success": true,
  "message": "Authority status recorded: RETURNED",
  "data": {
    "id": "fsub_01HZYP4Q5R6S7T8V9V0W1X2Y30",
    "object": "filing_submission",
    "version": 5,
    "state": "RETURNED",
    "authority_statuses": [
      { "id": "fast_01HZYY3Z4A5B6C7D8E9F0G1H20", "status": "RETURNED", "effective_at": "2027-01-15T00:00:00Z", "authority_reference": "DGMS/BSP/RET/2027/0044", "reason": "Accident annexure C omitted for the 18 November reportable injury", "external_evidence_document_id": "doc_01HZYX2Y3Z4A5B6C7D8E9F0G10", "recorded_at": "2027-01-15T10:00:00Z" }
    ],
    "claim_ladder": { "we_sent_it": true, "they_received_it": true, "they_accepted_it": false },
    "original_preserved": true,
    "available_actions": ["CORRECT"]
  },
  "meta": { "action": "RECORD_AUTHORITY_STATUS", "transition": { "from": "ACKNOWLEDGED", "to": "RETURNED" }, "effects": [ { "object": "filing_authority_status", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 4, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-01-15T10:00:00Z" }
}
```

**A return, rejection, or correction never deletes or updates the original filing or package.** `CORRECT` creates a new filing with a `filing_correction_link` back to it.

---

## POST /filing-impact-cases

**Auth:** raised by the system when a source fact, definition version, certificate, or evidence item changes after a filing.

```json
{
  "success": true,
  "data": {
    "id": "fimp_01HZYZ4A5B6C7D8E9F0G1H2130",
    "object": "filing_impact_case",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "OPEN",
    "available_actions": ["ASSESS", "RESOLVE"],
    "trigger": { "kind": "SOURCE_FACT_SUPERSEDED", "object": "approved_production_fact", "id": "apf_01HZYA0B1C2D3E4F5G6H7J8K90", "superseded_by_id": "apf_01HZZ0A5B6C7D8E9F0G1H213J0", "delta": { "value": "-42118.400", "unit": "TONNE" } },
    "affected_reports": [
      { "report_instance_id": "rins_01HZY5E6F7G8H9J0K1T2M3N400", "display": "DGMS Form IV, Gevra OCP, Q3 FY2026-27", "state": "ATTESTED", "affected_fields": ["production.rom_output"] }
    ],
    "affected_filings": [
      { "filing_submission_id": "fsub_01HZYP4Q5R6S7T8V9V0W1X2Y30", "display": "DGMS portal, ACK 2027-001188", "state": "ACKNOWLEDGED", "authority_reference": "DGMS-PORTAL-ACK-2027-001188" }
    ],
    "owner_post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
    "assessment": null,
    "opened_at": "2027-02-14T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/filing-impact-cases/fimp_01HZYZ4A5B6C7D8E9F0G1H2130" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-02-14T09:05:00Z" }
}
```

A production restatement in February raises a case against a return filed in January. It does **not** silently change what was filed — someone has to decide whether a corrected return is owed.

---

## Invariants

- Published definition versions are immutable, and effective periods never overlap ambiguously for one authority/profile key.
- Every field value is typed and either source-bound or an authorised manual assertion with reason and evidence.
- A frozen compilation references exact source versions; later source updates never mutate it.
- `READY_TO_ATTEST` requires all blocking validation to pass and every permitted warning override to be complete.
- Attestation binds canonical content and source/package manifest hashes plus the signer's authority as it stood.
- Any content or package mutation invalidates readiness; the prior attestation stays historical and cannot authorise the new package.
- Private keys, PINs, and portal passwords have no persistence fields anywhere in this model.
- A NIL compilation requires an explicit definition predicate, complete required coverage, and no contradicting record.
- `TRANSMITTED` requires attempt evidence, `ACKNOWLEDGED` requires correlated receiver evidence, and `ACCEPTED` requires authority status evidence.
- HTTP status, a sent email, or a completed upload can never populate authority acknowledgement.
- Manual submission requires two distinct confirmations where configured, plus a receipt and the package hash.
- An uncertain transport reconciles before resending; retries reuse the idempotency and correlation policy.
- Return, rejection, and correction never delete or update the original filing or package.
- Timeliness retains the original obligation deadline and the qualifying-event policy.
- Obligation satisfaction is not a reporting state and not a column here.
- Every list and read applies source classification and recipient/purpose projection.

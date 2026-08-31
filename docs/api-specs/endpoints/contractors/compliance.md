# Contractors — work packages, requirements, eligibility, access, attribution, and performance

Domain rules: [`../../../features/contractors/contractor-compliance-spec.md`](../../../features/contractors/contractor-compliance-spec.md). Relational contract: [`../../../architecture/contractor-data-model.md`](../../../architecture/contractor-data-model.md). Identity contract: [`../identity/contractors.md`](../identity/contractors.md). Conventions: [`../../README.md`](../../README.md).

Identity entities are **referenced, never duplicated**. The contractor organisation, its worker affiliations, and the engagement itself live in the identity domain. This file owns what the operator needs on top: what work is authorised, what must be true before a person may do it, and who was actually responsible when something went wrong.

**A document is not compliance.** `VALID` requires an accepted review or a trusted external status under policy; the mere presence of an uploaded certificate is never sufficient.

## Routes

| Route | Purpose |
|---|---|
| `GET /contractor-work-packages` · `POST /contractor-work-packages` · `GET /contractor-work-packages/{id}` · `POST /contractor-work-packages/{id}/actions` | Authorised scope of work |
| `GET /subcontract-relationships` · `POST /subcontract-relationships` · `POST /subcontract-relationships/{id}/actions` | Disclosed, acyclic chain |
| `GET /package-assignments` · `POST /package-assignments` · `POST /package-assignments/{id}/actions` | People, vehicles, equipment on a package |
| `GET /contractor-roster-versions` · `POST /contractor-roster-versions` · `POST /contractor-roster-versions/{id}/actions` | Immutable submission manifests |
| `GET /contractor-requirement-policies?view=definitions` · `GET /contractor-requirement-policies` · `POST /contractor-requirement-policies` · `POST /contractor-requirement-policies/{id}/actions` | What is required, and of whom |
| `GET /contractor-requirement-instances` · `POST /contractor-requirement-instances/{id}/actions` | Submit, review, refresh |
| `GET /external-credential-mirrors` · `POST /external-credential-mirrors/{id}/actions` | Issuer-of-record status and freshness |
| `GET /contractor-eligibility-decisions` · `POST /contractor-eligibility-decisions` | Append-only decisions with reasons |
| `GET /contractor-exceptions` · `POST /contractor-exceptions` · `POST /contractor-exceptions/{id}/actions` | Controlled, bounded, revocable |
| `GET /access-decision-receipts` · `POST /access-decision-receipts` · `POST /access-decision-receipts/{id}/actions` | What the gate actually did, online or offline |
| `GET /contractor-performance-periods?view=attributions` · `GET /attribution-disputes` · `POST /attribution-disputes` · `POST /attribution-disputes/{id}/actions` | Who was responsible, and any challenge to that |
| `GET /contractor-performance-periods` · `POST /contractor-performance-periods/{id}/actions` | Published measures with denominators |

The former read-only `/contractor-requirement-definitions` collection is `GET /contractor-requirement-policies?view=definitions`. Policies retain definition references, while the view returns the deduplicated effective definition catalogue.

`POST /contractor-eligibility/evaluate` is `POST /contractor-eligibility-decisions` — evaluating **is** creating the decision, and it is append-only. `GET /contractors/{id}/performance` is `GET /contractor-performance-periods?filter[organization_id]=…`.

---

## POST /contractor-work-packages

**Auth:** `contractor.package.manage` on the engagement's target. `Idempotency-Key` required.

### Request

```json
{
  "engagement_id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300",
  "code": "OB-REM-PKG-03",
  "title": "Overburden removal, Main Pit benches 3–5",
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "zones": [{ "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0" }],
  "work_kinds": ["OVERBURDEN_REMOVAL", "HAUL_ROAD_MAINTENANCE"],
  "hazard_class": "HIGH",
  "headcount_ceiling": 450,
  "equipment_ceiling": { "DUMPER": 62, "EXCAVATOR": 9, "DOZER": 6 },
  "accountable_posts": [
    { "post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "role": "PRINCIPAL_EMPLOYER_REPRESENTATIVE" },
    { "post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "role": "SAFETY_OVERSIGHT" }
  ],
  "valid_from": "2026-10-01T00:00:00Z",
  "valid_until": "2027-03-31T00:00:00Z",
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Work package created",
  "data": {
    "id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0",
    "object": "contractor_work_package",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "DRAFT",
    "available_actions": ["SUBMIT_FOR_APPROVAL", "CANCEL"],
    "engagement": { "type": "contractor_engagement", "id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300", "display": "SECL/KRB/OB-REMOVAL/2026/17" },
    "contractor_organization": { "type": "organization", "id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Acme Mining Services Pvt Ltd" },
    "code": "OB-REM-PKG-03",
    "title": "Overburden removal, Main Pit benches 3–5",
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "zones": [{ "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "display": "Main Pit" }],
    "work_kinds": ["OVERBURDEN_REMOVAL", "HAUL_ROAD_MAINTENANCE"],
    "hazard_class": "HIGH",
    "headcount_ceiling": 450,
    "current_headcount": 0,
    "equipment_ceiling": { "DUMPER": 62, "EXCAVATOR": 9, "DOZER": 6 },
    "current_equipment": { "DUMPER": 0, "EXCAVATOR": 0, "DOZER": 0 },
    "accountable_posts": [
      { "post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" }, "role": "PRINCIPAL_EMPLOYER_REPRESENTATIVE" },
      { "post": { "type": "post", "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "display": "Safety Officer, Gevra OCP" }, "role": "SAFETY_OVERSIGHT" }
    ],
    "valid_from": "2026-10-01T00:00:00Z",
    "valid_until": "2027-03-31T00:00:00Z",
    "within_engagement_validity": true,
    "requirement_summary": { "total": 0, "valid": 0, "missing": 0, "expiring": 0, "blocking": 0 },
    "created_at": "2026-09-15T10:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "updated_at": "2026-09-15T10:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/contractor-work-packages/cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0", "assignments": "/api/v1/package-assignments?filter[package_id]=cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-15T10:00:00Z" }
}
```

Package validity **cannot extend beyond engagement validity** without a separately approved engagement amendment — `422 UNPROCESSABLE` with `details.engagement_valid_until`.

Actions: `SUBMIT_FOR_APPROVAL`, `APPROVE`, `REJECT`, `SUSPEND`, `RESUME`, `AMEND`, `CANCEL`, `CLOSE` — each reason-required except approval, each `expected_version`-required.

---

## POST /subcontract-relationships

**Auth:** `contractor.subcontract.disclose` for the prime; `contractor.subcontract.approve` for the operator decision.

```json
{
  "parent_package_id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "prime_organization_id": "org_01HZX5E6F7G8H9J0K1T2M3N400",
  "subcontractor_organization_id": "org_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "disclosed_scope": { "work_kinds": ["HAUL_ROAD_MAINTENANCE"], "zones": [{ "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0" }], "headcount_ceiling": 60 },
  "valid_from": "2026-10-15T00:00:00Z",
  "valid_until": "2027-03-31T00:00:00Z",
  "contract_document_id": "doc_01HZY3C4D5E6F7G8H9J0K1T2M0",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Subcontract disclosed; awaiting operator approval",
  "data": {
    "id": "csub_01HZY4D5E6F7G8H9J0K1T2M3N0",
    "object": "subcontract_relationship",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "DISCLOSED",
    "available_actions": ["APPROVE", "REJECT", "WITHDRAW"],
    "parent_package": { "type": "contractor_work_package", "id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "OB-REM-PKG-03" },
    "prime_organization": { "type": "organization", "id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Acme Mining Services Pvt Ltd" },
    "subcontractor_organization": { "type": "organization", "id": "org_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "Ratna Earthmovers" },
    "disclosed_scope": { "work_kinds": ["HAUL_ROAD_MAINTENANCE"], "zones": [{ "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "display": "Main Pit" }], "headcount_ceiling": 60 },
    "scope_check": { "within_parent_scope": true, "broadens_parent": false, "chain_acyclic": true, "chain_depth": 2, "chain": ["org_01HZX5E6F7G8H9J0K1T2M3N400", "org_01HZY2B3C4D5E6F7G8H9J0K1T0"] },
    "valid_from": "2026-10-15T00:00:00Z",
    "valid_until": "2027-03-31T00:00:00Z",
    "contract_document": { "type": "document", "id": "doc_01HZY3C4D5E6F7G8H9J0K1T2M0", "display": "Subcontract agreement, Ratna Earthmovers" },
    "created_at": "2026-10-01T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/subcontract-relationships/csub_01HZY4D5E6F7G8H9J0K1T2M3N0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-01T09:00:00Z" }
}
```

A subcontract chain must be **acyclic and disclosed**, and can never broaden its parent's scope. An attempt returns `422 UNPROCESSABLE` naming the widened dimension:

```json
{
  "success": false,
  "message": "Subcontract scope exceeds its parent package",
  "error": {
    "code": "UNPROCESSABLE",
    "details": {
      "violations": [
        { "dimension": "work_kinds", "parent": ["OVERBURDEN_REMOVAL", "HAUL_ROAD_MAINTENANCE"], "requested": ["HAUL_ROAD_MAINTENANCE", "BLASTING"], "excess": ["BLASTING"] },
        { "dimension": "headcount_ceiling", "parent": 450, "requested": 600, "excess": 150 }
      ]
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## POST /contractor-requirement-policies

**Auth:** `contractor.requirement_policy.manage`. **Policy versions are immutable after publication** and cannot overlap ambiguously for the same precedence key.

```json
{
  "requirement_definition_id": "crqd_01HZY5E6F7G8H9J0K1T2M3N400",
  "selector": { "subject_kind": "PERSON", "work_kinds": ["OVERBURDEN_REMOVAL", "HAUL_ROAD_MAINTENANCE"], "hazard_class_min": "MEDIUM", "mine_ids": [], "trade_codes": ["HEMM_OPERATOR"] },
  "precedence_key": "PERSON:HEMM_OPERATOR:MEDICAL_FITNESS",
  "source_instrument": { "instrument": "MINES_RULES_1955", "provision": "Rule 29B", "authority_code": "DGMS" },
  "blocking_rule": "HARD_STOP",
  "exception_rule": { "exceptions_allowed": false },
  "reviewer_authority": { "required_capability": "contractor.requirement.review_medical", "required_post_kinds": ["OCCUPATIONAL_HEALTH_OFFICER"] },
  "validity_rule": { "kind": "ISSUER_EXPIRY", "max_age": "P1Y", "expiring_warning": "P30D" },
  "external_source": { "issuer_system": "DGMS_PME_REGISTRY", "trust_level": "AUTHORITATIVE", "max_staleness": "P7D" },
  "effective_from": "2026-10-01T00:00:00Z",
  "effective_until": null,
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Requirement policy version created",
  "data": {
    "id": "crqp_01HZY6F7G8H9J0K1T2M3N405P0",
    "object": "contractor_requirement_policy_version",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "DRAFT",
    "available_actions": ["PUBLISH", "WITHDRAW"],
    "requirement_definition": { "type": "contractor_requirement_definition", "id": "crqd_01HZY5E6F7G8H9J0K1T2M3N400", "display": "Periodic medical examination (PME)" },
    "policy_version_number": 3,
    "selector": { "subject_kind": "PERSON", "work_kinds": ["OVERBURDEN_REMOVAL", "HAUL_ROAD_MAINTENANCE"], "hazard_class_min": "MEDIUM", "trade_codes": ["HEMM_OPERATOR"] },
    "precedence_key": "PERSON:HEMM_OPERATOR:MEDICAL_FITNESS",
    "source_instrument": { "instrument": "MINES_RULES_1955", "provision": "Rule 29B", "authority_code": "DGMS" },
    "blocking_rule": "HARD_STOP",
    "exception_rule": { "exceptions_allowed": false },
    "reviewer_authority": { "required_capability": "contractor.requirement.review_medical", "required_post_kinds": ["OCCUPATIONAL_HEALTH_OFFICER"] },
    "validity_rule": { "kind": "ISSUER_EXPIRY", "max_age": "P1Y", "expiring_warning": "P30D" },
    "external_source": { "issuer_system": "DGMS_PME_REGISTRY", "trust_level": "AUTHORITATIVE", "max_staleness": "P7D" },
    "effective_from": "2026-10-01T00:00:00Z",
    "effective_until": null,
    "supersedes_id": "crqp_01HZY7G8H9J0K1T2M3N405P6Q0",
    "estimated_affected_subjects": 418,
    "immutable_after_publication": true,
    "created_at": "2026-09-20T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/contractor-requirement-policies/crqp_01HZY6F7G8H9J0K1T2M3N405P0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-20T10:00:00Z" }
}
```

`blocking_rule: "HARD_STOP"` with `exceptions_allowed: false` means the exception route is closed at the **database and service invariant boundary**, not merely discouraged in a form. `POST /contractor-exceptions` against it is `422 UNPROCESSABLE`, not a request awaiting a brave approver.

---

## POST /contractor-requirement-instances/{id}/actions

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `SUBMIT` | contractor party with a current engagement | optional | required | `MISSING` → `SUBMITTED`; links evidence |
| `REVIEW` | the policy's `reviewer_authority` | **required** on reject | required | `UNDER_REVIEW` → `VALID` or `REJECTED` |
| `REFRESH_EXTERNAL` | `contractor.requirement.refresh` or the scheduled adapter | optional | required | Re-reads the issuer of record; updates the mirror |
| `SUSPEND` | `contractor.requirement.manage` | **required** | required | `VALID` → `SUSPENDED` |

**The review author can never be the submitting contractor actor for the same instance** — `422 UNPROCESSABLE` with `details.rule: "REVIEWER_NOT_SUBMITTER"`.

### SUBMIT

```json
{
  "action": "SUBMIT",
  "expected_version": 1,
  "payload": {
    "evidence_links": [
      { "kind": "DOCUMENT", "document_id": "doc_01HZY8H9J0K1T2M3N405P6Q7R0", "purpose": "PME_CERTIFICATE" }
    ],
    "asserted_fields": { "certificate_number": "PME/CG/2026/44182", "issued_on": "2026-06-14", "valid_until": "2027-06-13", "issuing_authority": "DGMS-approved medical practitioner, Bilaspur", "fitness_category": "FIT_FOR_HEMM_OPERATION" }
  }
}
```

```json
{
  "success": true,
  "message": "Requirement evidence submitted",
  "data": {
    "id": "crqi_01HZY9J0K1T2M3N405P6Q7R8S0",
    "object": "contractor_requirement_instance",
    "version": 2,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "SUBMITTED",
    "available_actions": ["REVIEW"],
    "requirement_definition": { "type": "contractor_requirement_definition", "id": "crqd_01HZY5E6F7G8H9J0K1T2M3N400", "display": "Periodic medical examination (PME)" },
    "policy_version": { "type": "contractor_requirement_policy_version", "id": "crqp_01HZY6F7G8H9J0K1T2M3N405P0", "display": "PME policy v3" },
    "subject": { "type": "person", "id": "per_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "[restricted]" },
    "package": { "type": "contractor_work_package", "id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "OB-REM-PKG-03" },
    "engagement_id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300",
    "status": "SUBMITTED",
    "valid_from": null,
    "valid_until": null,
    "evidence_links": [
      { "id": "crel_01HZYB1C2D3E4F5G6H7J8K9T00", "kind": "DOCUMENT", "document_id": "doc_01HZY8H9J0K1T2M3N405P6Q7R0", "purpose": "PME_CERTIFICATE", "asserted_fields": { "certificate_number": "PME/CG/2026/44182", "issued_on": "2026-06-14", "valid_until": "2027-06-13", "fitness_category": "FIT_FOR_HEMM_OPERATION" }, "linked_at": "2026-10-02T09:00:00Z" }
    ],
    "external_mirror": { "id": "ecrm_01HZYC2D3E4F5G6H7J8K9T0M10", "issuer_system": "DGMS_PME_REGISTRY", "issuer_identifier": "PME/CG/2026/44182", "observed_status": "ACTIVE", "checked_at": "2026-10-02T02:00:00Z", "staleness": "PT7H", "within_max_staleness": true, "trust_level": "AUTHORITATIVE" },
    "reviews": [],
    "document_presence_sufficient": false,
    "redacted_fields": ["subject.display"],
    "created_at": "2026-10-01T00:00:00Z",
    "updated_at": "2026-10-02T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/contractor-requirement-instances/crqi_01HZY9J0K1T2M3N405P6Q7R8S0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-02T09:00:00Z", "effects": [ { "object": "requirement_evidence_link", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 1, "change": "CREATED", "note": "Queued to the occupational health officer" } ] }
}
```

`document_presence_sufficient: false` is returned explicitly on every instance. Uploading a certificate advances the state to `SUBMITTED` and nothing more.

---

## POST /contractor-eligibility-decisions

**Auth:** `contractor.eligibility.evaluate`, or the access-gate service principal. Decisions are **append-only** — a re-evaluation is a new decision, never an edit.

```json
{
  "subject": { "type": "person", "id": "per_01HZYA0B1C2D3E4F5G6H7J8K90" },
  "package_id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "work_kind": "OVERBURDEN_REMOVAL",
  "zone": { "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0" },
  "purpose": "SHIFT_ENTRY",
  "evaluated_for": "2026-10-05T05:30:00Z",
  "extensions": {}
}
```

### Response — 201 Created, not eligible

```json
{
  "success": true,
  "message": "Eligibility decision: NOT_ELIGIBLE",
  "data": {
    "id": "celd_01HZYD3E4F5G6H7J8K9T0M1N20",
    "object": "contractor_eligibility_decision",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "NOT_ELIGIBLE",
    "available_actions": [],
    "subject": { "type": "person", "id": "per_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "[restricted]" },
    "package": { "type": "contractor_work_package", "id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "OB-REM-PKG-03" },
    "direct_employer": { "type": "organization", "id": "org_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "Ratna Earthmovers" },
    "work_kind": "OVERBURDEN_REMOVAL",
    "zone": { "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "display": "Main Pit" },
    "purpose": "SHIFT_ENTRY",
    "result": "NOT_ELIGIBLE",
    "evaluated_at": "2026-10-05T05:12:00Z",
    "valid_until": "2026-10-05T05:42:00Z",
    "valid_until_basis": "CACHE_CEILING_PT30M",
    "reasons": [
      { "code": "REQUIREMENT_EXPIRED", "requirement_definition_id": "crqd_01HZYE4F5G6H7J8K9T0M1N2030", "requirement_display": "Site safety induction", "severity": "BLOCKING", "detail": "Induction expired 2026-09-28", "remediation": "Complete the site induction refresher", "exception_permitted": true },
      { "code": "REQUIREMENT_VALID", "requirement_definition_id": "crqd_01HZY5E6F7G8H9J0K1T2M3N400", "requirement_display": "Periodic medical examination (PME)", "severity": "INFO", "detail": "Valid until 2027-06-13" },
      { "code": "EXTERNAL_STATUS_STALE", "requirement_definition_id": "crqd_01HZYF5G6H7J8K9T0M1N203P40", "requirement_display": "Vehicle fitness certificate", "severity": "ADVISORY", "detail": "Issuer last checked 9 days ago; policy max staleness is 7 days", "remediation": "Refresh the external credential mirror" }
    ],
    "blocking_reason_count": 1,
    "policy_manifest_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
    "input_manifest_hash": "sha256:7d1a9c4e2f6b830d5ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c",
    "policy_versions": [{ "policy_id": "crqp_01HZY6F7G8H9J0K1T2M3N405P0", "version": 3 }, { "policy_id": "crqp_01HZYG6H7J8K9T0M1N203P4Q50", "version": 2 }],
    "created_at": "2026-10-05T05:12:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/contractor-eligibility-decisions/celd_01HZYD3E4F5G6H7J8K9T0M1N20" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-05T05:12:00Z" }
}
```

`valid_until` is **no later than the earliest blocking input's expiry, or the cache ceiling, whichever comes first** — and `valid_until_basis` says which bound applied. A gate that caches an eligibility decision can never outlive the certificate it rested on.

Every reason carries a `remediation` and whether an exception is even permitted. A worker turned away at the gate should learn what to fix, not merely that they failed.

---

## POST /contractor-exceptions

**Auth:** `contractor.exception.request`; the decision needs the policy's exception approver authority.

```json
{
  "requirement_instance_id": "crqi_01HZYH7J8K9T0M1N203P4Q5R60",
  "requested_scope": { "subject": { "type": "person", "id": "per_01HZYA0B1C2D3E4F5G6H7J8K90" }, "package_id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0", "work_kinds": ["HAUL_ROAD_MAINTENANCE"], "zones": [{ "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0" }] },
  "justification": "Induction refresher scheduled 7 October; worker is a 4-year returning operator with a clean record and will work only under direct supervision until then",
  "compensating_controls": [
    { "code": "DIRECT_SUPERVISION", "detail": "Buddy-paired with a currently inducted operator for every shift", "verified_by_post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0" },
    { "code": "RESTRICTED_ZONE", "detail": "No work above bench 4" }
  ],
  "valid_from": "2026-10-05T00:00:00Z",
  "valid_until": "2026-10-07T23:59:59Z",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Exception requested",
  "data": {
    "id": "cexc_01HZYJ8K9T0M1N203P4Q5R6S70",
    "object": "contractor_exception",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "REQUESTED",
    "available_actions": ["APPROVE", "REJECT", "WITHDRAW"],
    "requirement_instance": { "type": "contractor_requirement_instance", "id": "crqi_01HZYH7J8K9T0M1N203P4Q5R60", "display": "Site safety induction — [restricted]" },
    "requirement_blocking_rule": "SOFT_STOP",
    "requested_scope": { "subject": { "type": "person", "id": "per_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "[restricted]" }, "package_id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0", "work_kinds": ["HAUL_ROAD_MAINTENANCE"], "zones": [{ "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "display": "Main Pit" }] },
    "justification": "Induction refresher scheduled 7 October; worker is a 4-year returning operator with a clean record and will work only under direct supervision until then",
    "compensating_controls": [
      { "code": "DIRECT_SUPERVISION", "detail": "Buddy-paired with a currently inducted operator for every shift", "verified_by_post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "verified": false },
      { "code": "RESTRICTED_ZONE", "detail": "No work above bench 4", "verified": false }
    ],
    "valid_from": "2026-10-05T00:00:00Z",
    "valid_until": "2026-10-07T23:59:59Z",
    "ceiling_checks": { "not_beyond_requirement": true, "not_beyond_package": true, "not_beyond_approver_authority": true, "not_beyond_compensating_control": true },
    "requested_by": { "type": "person", "id": "per_01HZYK9T0M1N203P4Q5R6S7T80", "display": "M. Naik" },
    "approvals": [],
    "revocations": [],
    "created_at": "2026-10-04T16:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/contractor-exceptions/cexc_01HZYJ8K9T0M1N203P4Q5R6S70" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-04T16:00:00Z", "effects": [ { "object": "approval_request", "count": 1, "change": "CREATED" } ] }
}
```

An exception **cannot outlive** its requirement, its package, its approver's authority, or its compensating control. `ceiling_checks` shows all four, and any `false` is `422 UNPROCESSABLE`.

Approvals and revocations are **immutable append-only lists**. An exception that was approved and later revoked shows both, in order, forever.

### Hard-stop refusal

```json
{
  "success": false,
  "message": "This requirement does not permit exceptions",
  "error": {
    "code": "UNPROCESSABLE",
    "details": {
      "requirement_definition_id": "crqd_01HZY5E6F7G8H9J0K1T2M3N400",
      "requirement_display": "Periodic medical examination (PME)",
      "blocking_rule": "HARD_STOP",
      "exceptions_allowed": false,
      "policy_version_id": "crqp_01HZY6F7G8H9J0K1T2M3N405P0",
      "source_instrument": { "instrument": "MINES_RULES_1955", "provision": "Rule 29B" },
      "resolution": "There is no approval path. The requirement must be satisfied."
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## POST /access-decision-receipts

**Auth:** the access-gate service principal, or `contractor.access.record` for manual entry.

The receipt records **what the gate actually did**, including when it was offline and had to decide on cached data.

```json
{
  "gate_ref": { "system": "SECL_TURNSTILE", "gate_id": "GEV-PITHEAD-03" },
  "eligibility_decision_id": "celd_01HZYD3E4F5G6H7J8K9T0M1N20",
  "subject": { "type": "person", "id": "per_01HZYA0B1C2D3E4F5G6H7J8K90" },
  "mode": "OFFLINE_CACHED",
  "outcome": "DENIED",
  "occurred_at": "2026-10-05T05:31:00Z",
  "cached_decision_age": "PT19M",
  "operator_override": null,
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Access decision receipt recorded",
  "data": {
    "id": "cadr_01HZYT0M1N203P4Q5R6S7T8V90",
    "object": "access_decision_receipt",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "RECORDED",
    "available_actions": ["RECONCILE"],
    "gate_ref": { "system": "SECL_TURNSTILE", "gate_id": "GEV-PITHEAD-03", "display": "Gevra pit-head turnstile 3" },
    "eligibility_decision": { "type": "contractor_eligibility_decision", "id": "celd_01HZYD3E4F5G6H7J8K9T0M1N20", "display": "NOT_ELIGIBLE, 1 blocking reason" },
    "subject": { "type": "person", "id": "per_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "[restricted]" },
    "mode": "OFFLINE_CACHED",
    "outcome": "DENIED",
    "occurred_at": "2026-10-05T05:31:00Z",
    "received_at": "2026-10-05T07:14:00Z",
    "cached_decision_age": "PT19M",
    "cached_decision_within_validity": true,
    "operator_override": null,
    "reconciliation_state": "PENDING",
    "reconciliation_result": null,
    "created_at": "2026-10-05T07:14:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/access-decision-receipts/cadr_01HZYT0M1N203P4Q5R6S7T8V90" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-10-05T07:14:00Z" }
}
```

`RECONCILE` re-evaluates the decision against what was actually true at `occurred_at`. A receipt where the gate **admitted** somebody an online evaluation would have refused is exactly the record a post-incident review needs, and reconciliation surfaces it rather than burying it.

---

## GET /contractor-performance-periods?view=attributions · POST /attribution-disputes

**Auth:** `contractor.attribution.read`; dispute needs `contractor.attribution.dispute` from a party to the attribution.

**Source-domain attribution references are immutable.** A dispute **appends a decision**; it never rewrites the finding, incident, or defect it points at.

```json
{
  "attribution_id": "catt_01HZYM1N203P4Q5R6S7T8V9V00",
  "asserted_by_organization_id": "org_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "assertion": "The haul road segment was under Acme's direct control on 18 September, not Ratna's; the subcontract for that segment began on 20 September",
  "counter_responsibility": { "engagement_id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300", "organization_id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "responsibility_kind": "DIRECT_EMPLOYER" },
  "evidence_ids": ["ev_01HZYN203P4Q5R6S7T8V9V0W10"],
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Attribution dispute raised",
  "data": {
    "id": "cadi_01HZY03P4Q5R6S7T8V9V0W1X20",
    "object": "attribution_dispute",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "RAISED",
    "available_actions": ["DECIDE", "WITHDRAW"],
    "attribution": {
      "id": "catt_01HZYM1N203P4Q5R6S7T8V9V00",
      "object": "contractor_attribution",
      "source_record": { "type": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "display": "Absence of haul road edge protection" },
      "engagement_id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300",
      "package_id": "cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0",
      "direct_employer": { "type": "organization", "id": "org_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "Ratna Earthmovers" },
      "responsibility_kind": "DIRECT_EMPLOYER",
      "recorded_at": "2026-09-18T11:20:00Z",
      "immutable": true
    },
    "asserted_by_organization": { "type": "organization", "id": "org_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "Ratna Earthmovers" },
    "assertion": "The haul road segment was under Acme's direct control on 18 September, not Ratna's; the subcontract for that segment began on 20 September",
    "counter_responsibility": { "engagement_id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300", "organization_id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "responsibility_kind": "DIRECT_EMPLOYER" },
    "evidence_ids": ["ev_01HZYN203P4Q5R6S7T8V9V0W10"],
    "decision": null,
    "created_at": "2026-09-25T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/attribution-disputes/cadi_01HZY03P4Q5R6S7T8V9V0W1X20" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-25T10:00:00Z" }
}
```

---

## POST /contractor-performance-periods/{id}/actions — PUBLISH

**Auth:** `contractor.performance.publish`.

```json
{
  "action": "PUBLISH",
  "expected_version": 3,
  "reason": "Q2 FY2026-27 contractor performance reviewed and approved by the area safety committee",
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Performance period published",
  "data": {
    "id": "cpfp_01HZYP4Q5R6S7T8V9V0W1X2Y30",
    "object": "contractor_performance_period",
    "version": 4,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PUBLISHED",
    "organization": { "type": "organization", "id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Acme Mining Services Pvt Ltd" },
    "scope": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"], "package_ids": ["cwpk_01HZY1A2B3C4D5E6F7G8H9J0K0"] },
    "period": { "from": "2026-07-01", "to": "2026-10-01", "bounds": "[)" },
    "exposure_denominators": [
      { "kind": "PERSON_SHIFTS", "value": "38412", "unit": "SHIFT", "coverage_percent": "99.2", "source": "attendance domain, reconciled" },
      { "kind": "MAN_HOURS", "value": "307296.00", "unit": "HOUR", "coverage_percent": "99.2" },
      { "kind": "EQUIPMENT_HOURS", "value": "61840.50", "unit": "HOUR", "coverage_percent": "94.7" }
    ],
    "measures": [
      { "metric_definition_id": "cmet_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "metric_version": 2, "display": "Reportable injury frequency rate", "numerator": "3", "denominator": "307296.00", "result": "0.976", "unit": "PER_MILLION_HOURS", "coverage_percent": "99.2", "denominator_semantics": "Man-hours from reconciled attendance, excluding surface administrative staff", "provenance_manifest_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3" },
      { "metric_definition_id": "cmet_01HZYR6S7T8V9V0W1X2Y3Z4A50", "metric_version": 1, "display": "Overdue CAPA rate", "numerator": "4", "denominator": "17", "result": "0.235", "unit": "RATIO", "coverage_percent": "100.0", "denominator_semantics": "CAPAs attributed to this organisation with a due date inside the period", "provenance_manifest_hash": "sha256:7d1a9c4e2f6b830d5ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c" },
      { "metric_definition_id": "cmet_01HZYS7T8V9V0W1X2Y3Z4A5B60", "metric_version": 1, "display": "Requirement validity rate at shift start", "numerator": null, "denominator": "0", "result": null, "unit": "RATIO", "coverage_percent": "0.0", "denominator_semantics": "Not computed: gate receipts were unavailable for 61 of 92 days", "not_computed_reason": "INSUFFICIENT_COVERAGE" }
    ],
    "source_manifest_hash": "sha256:9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "published_at": "2026-10-12T10:00:00Z",
    "available_actions": ["SUPERSEDE"],
    "sensitive_data_note": "Worker medical and personal evidence is referenced through purpose-limited projections and is never copied into performance records."
  },
  "meta": {
    "action": "PUBLISH",
    "transition": { "from": "APPROVED", "to": "PUBLISHED" },
    "effects": [ { "object": "outbox_event", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 4, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-10-12T10:00:00Z"
  }
}
```

A measure with insufficient coverage returns `result: null` and a `not_computed_reason`. It is never rendered as zero, and never quietly omitted from the list — a contractor whose gate data was missing for two months must not appear to have had a perfect quarter.

---

## Invariants

- Every work package belongs to exactly one engagement and one target mine context, and cannot outlive its engagement.
- A subcontract chain is disclosed and acyclic, and never broadens its parent's scope.
- An assignment's direct employer must have a current approved path to the package.
- Requirement policy versions are immutable after publication and never overlap ambiguously on a precedence key.
- The review author is never the submitting contractor actor for the same instance.
- `VALID` needs an accepted review or a trusted external status. Document presence alone is never sufficient.
- Eligibility decisions are append-only, and `valid_until` never outlives the earliest blocking input.
- A hard-stop requirement rejects exception creation at the invariant boundary; there is no approval path to find.
- An exception cannot outlive its requirement, package, approver authority, or compensating control.
- Attribution references are immutable; disputes append decisions rather than rewriting the source record.
- Performance measures always carry metric version, source manifest, coverage, and denominator semantics, and report `null` rather than a misleading zero.
- Organisation suspension or revocation emits recomputation work for every affected active decision.
- Historical engagement, affiliation, and requirement records stay addressable after access ends.
- Sensitive worker evidence is referenced through purpose-limited projections, never copied into performance records.

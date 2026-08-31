# Identity — contractor engagements

A contractor is an **organisation** with `kind_code: "CONTRACTOR"`, created and read through [`organizations.md`](organizations.md). Worker membership is an **affiliation**, created through [`people.md`](people.md). There is no separate contractor hierarchy and no unconditional membership tuple.

This file owns the one thing contractors add: the **engagement** — a time-bounded, capability-restricted licence for a contractor organisation to act on a specific mine or asset. Table: `contractor_engagement` (`foundation-data-model.md`), plus `record_party` for historical access.

Commercial work packages, eligibility rules, rosters, and performance are a different concern and live in [`../contractors/compliance.md`](../contractors/compliance.md).

## Routes

| Route | Purpose |
|---|---|
| `GET /contractor-engagements` · `POST /contractor-engagements` | Engagement register |
| `GET /contractor-engagements/{id}` · `PATCH /contractor-engagements/{id}` · `POST /contractor-engagements/{id}/actions` · `GET /contractor-engagements/{id}/history` | Engagement lifecycle |
| `GET /contractor-engagements?view=record_parties` | Historical record-specific party access |

`POST /contractor-organizations` is gone. `GET /contractor-organizations` is `GET /organizations?filter[kind_code]=CONTRACTOR`.

---

## POST /contractor-engagements

**Auth:** `contractor.engagement.manage` on the target mine/asset **and** on the tenant. `Idempotency-Key` required.

### Request

```json
{
  "contractor_organization_id": "org_01HZX5E6F7G8H9J0K1T2M3N400",
  "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
  "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
  "engagement_reference": "SECL/KRB/OB-REMOVAL/2026/17",
  "scope_of_work": "Overburden removal and haul road maintenance, Main Pit",
  "valid_from": "2026-09-01T00:00:00Z",
  "valid_until": "2027-03-31T00:00:00Z",
  "contract_document_id": "doc_01HZZ2C3D4E5F6G7H8J9K0T1M0",
  "permitted_capabilities": ["evidence.capture", "document.upload", "observation.create", "capa.submit"],
  "conditions": {
    "finding_responsibility_required": true,
    "worker_induction_required": true,
    "max_concurrent_workers": 450,
    "permitted_subunit_ids": ["sub_01HZY8B9C0D1E2F3G4H5J6K7T0"],
    "requires_daily_attendance_reconciliation": true
  },
  "principal_employer_post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0",
  "insurance": [
    { "kind": "WORKMEN_COMPENSATION", "policy_number": "WC/2026/889201", "insurer": "New India Assurance", "valid_until": "2027-03-31", "document_id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0" }
  ],
  "extensions": {}
}
```

`permitted_capabilities` may only **narrow** the tenant's contractor policy. Requesting a capability the tenant policy does not grant to contractors returns `422 UNPROCESSABLE` with the offending codes, not a silent drop.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Contractor engagement created",
  "data": {
    "id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300",
    "object": "contractor_engagement",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PENDING",
    "available_actions": ["ACTIVATE", "REVOKE", "AMEND"],
    "contractor_organization": { "type": "organization", "id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Acme Mining Services Pvt Ltd" },
    "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "engagement_reference": "SECL/KRB/OB-REMOVAL/2026/17",
    "scope_of_work": "Overburden removal and haul road maintenance, Main Pit",
    "valid_from": "2026-09-01T00:00:00Z",
    "valid_until": "2027-03-31T00:00:00Z",
    "derived_state": "PENDING",
    "contract_document": { "type": "document", "id": "doc_01HZZ2C3D4E5F6G7H8J9K0T1M0", "display": "Work order SECL/KRB/OB-REMOVAL/2026/17" },
    "permitted_capabilities": ["evidence.capture", "document.upload", "observation.create", "capa.submit"],
    "tenant_contractor_policy_version": 4,
    "conditions": {
      "finding_responsibility_required": true,
      "worker_induction_required": true,
      "max_concurrent_workers": 450,
      "permitted_subunit_ids": ["sub_01HZY8B9C0D1E2F3G4H5J6K7T0"],
      "requires_daily_attendance_reconciliation": true
    },
    "principal_employer_post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
    "insurance": [
      { "kind": "WORKMEN_COMPENSATION", "policy_number": "WC/2026/889201", "insurer": "New India Assurance", "valid_until": "2027-03-31", "document_id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "verification_status": "PENDING" }
    ],
    "counts": { "active_worker_affiliations": 0, "open_findings_attributed": 0 },
    "revoked_at": null,
    "revoke_reason": null,
    "created_at": "2026-08-25T09:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "updated_at": "2026-08-25T09:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": {
      "self": "/api/v1/contractor-engagements/ceng_01HZZ4E5F6G7H8J9K0T1M2N300",
      "history": "/api/v1/contractor-engagements/ceng_01HZZ4E5F6G7H8J9K0T1M2N300/history",
      "workers": "/api/v1/people?filter[organization_id]=org_01HZX5E6F7G8H9J0K1T2M3N400&filter[affiliation_kind]=CONTRACTOR_WORKER"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-25T09:00:00Z" }
}
```

Overlapping engagements are allowed for distinct contracts and are explicit in responses — the same contractor may hold two live packages at one mine, and collapsing them would lose the attribution that findings depend on.

An engagement is created `PENDING` and confers nothing until `ACTIVATE`, which verifies the insurance and induction preconditions.

---

## GET /contractor-engagements · GET /contractor-engagements/{id}

**Auth:** `contractor.engagement.read` on the target, a current member of the contractor organisation where policy permits, or a record-specific historical party.

Filters: `contractor_organization_id`, `filter[target.type]` + `filter[target.id]`, `tenant_id`, `state`, `filter[valid_until][lte]` (expiry sweep), `filter[permitted_capabilities]` (array-contains), `engagement_reference`, `as_of`, `q`.
Expansions: `expand=contractor_organization,contract_document,worker_summary,insurance_status`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300",
      "object": "contractor_engagement",
      "version": 3,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "ACTIVE",
      "contractor_organization": { "type": "organization", "id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Acme Mining Services Pvt Ltd" },
      "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "engagement_reference": "SECL/KRB/OB-REMOVAL/2026/17",
      "valid_from": "2026-09-01T00:00:00Z",
      "valid_until": "2027-03-31T00:00:00Z",
      "permitted_capabilities": ["evidence.capture", "document.upload", "observation.create", "capa.submit"],
      "counts": { "active_worker_affiliations": 418, "open_findings_attributed": 3 },
      "links": { "self": "/api/v1/contractor-engagements/ceng_01HZZ4E5F6G7H8J9K0T1M2N300" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T09:00:00Z" }
}
```

A contractor-organisation reader never receives the complete workforce roster from this response; that needs `identity.person.read` on the people collection, separately authorized.

---

## POST /contractor-engagements/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `ACTIVATE` | `contractor.engagement.manage` | optional | required | `PENDING`, insurance verified, induction policy satisfied | `state = ACTIVE`; issues derived access tuples |
| `SUSPEND` | `contractor.engagement.manage` | **required** | required | `ACTIVE` | Current access ends immediately; engagement survives for reinstatement |
| `RESUME` | `contractor.engagement.manage` | **required** | required | `SUSPENDED` | Restores access within the original interval |
| `AMEND` | `contractor.engagement.manage` | **required** | required | `ACTIVE` or `PENDING` | New version of capabilities/conditions; the previous version is retained |
| `EXTEND` | `contractor.engagement.manage` | **required** | required | `ACTIVE` | Moves `valid_until` forward; requires current insurance covering the new end |
| `REVOKE` | `contractor.engagement.manage` | **required** | required | any live state | Terminal. Current access ends at `effective_at`; `record_party` provenance is retained |

### Request — REVOKE

```json
{
  "action": "REVOKE",
  "expected_version": 3,
  "reason": "Contract terminated for repeated failure to close overdue CAPAs — notice SECL/KRB/TERM/2026/04",
  "effective_at": "2026-12-01T00:00:00Z",
  "payload": {
    "revoke_reason_code": "PERFORMANCE_DEFAULT",
    "notice_document_id": "doc_01HZZ5F6G7H8J9K0T1M2N304P0",
    "transfer_open_responsibilities_to_post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0"
  },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Contractor engagement revoked",
  "data": {
    "id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300",
    "object": "contractor_engagement",
    "version": 4,
    "state": "REVOKED",
    "valid_until": "2026-12-01T00:00:00Z",
    "revoked_at": "2026-12-01T00:00:00Z",
    "revoke_reason": "Contract terminated for repeated failure to close overdue CAPAs — notice SECL/KRB/TERM/2026/04",
    "available_actions": []
  },
  "meta": {
    "action": "REVOKE",
    "transition": { "from": "ACTIVE", "to": "REVOKED" },
    "effects": [
      { "object": "outbox_event", "count": 419, "change": "CREATED", "note": "Derived contractor access tuples removed for 418 workers plus the organisation" },
      { "object": "capa", "count": 3, "change": "REASSIGNED", "to": "post_01HZY4C5D6E7F8G9H0J1K2T3M0" },
      { "object": "record_party", "count": 3, "change": "RETAINED", "note": "Historical attribution preserved on the findings raised during the engagement" },
      { "object": "notification", "count": 6, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZC2D3E4F5G6H7J8K9T0M10", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-12-01T00:00:00Z"
  }
}
```

---

## GET /contractor-engagements?view=record_parties

**Auth:** `record.party.read` on the record, or a current member of the named organisation.

A contractor whose engagement has ended keeps access to **the specific records it was party to** — the findings raised against its work, the evidence it captured, the CAPAs it submitted — and to nothing else. That is `record_party`, and it is a narrow, per-record grant, never general mine access.

Filters: `filter[record.type]` + `filter[record.id]`, `organization_id`, `relationship`, `filter[effective_at][gte]`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "rpty_01HZZ6G7H8J9K0T1M2N304P5Q0",
      "object": "record_party",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "record": { "type": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "display": "Berm missing, east haul road" },
      "organization": { "type": "organization", "id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Acme Mining Services Pvt Ltd" },
      "relationship": "RESPONSIBLE_CONTRACTOR",
      "via_engagement": { "type": "contractor_engagement", "id": "ceng_01HZZ4E5F6G7H8J9K0T1M2N300", "display": "SECL/KRB/OB-REMOVAL/2026/17" },
      "effective_at": "2026-09-18T11:20:00Z",
      "grants": ["finding.read", "capa.submit", "evidence.read_own"],
      "links": { "self": "/api/v1/contractor-engagements/record-parties/rpty_01HZZ6G7H8J9K0T1M2N304P5Q0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 3, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-12-05T09:00:00Z" }
}
```

---

## Authorization formula

```text
current contractor capability = current worker affiliation
                              ∩ current engagement (ACTIVE, in interval)
                              ∩ engagement capability restriction
                              ∩ tenant contractor policy
                              ∩ target-specific responsibility policy
```

Expiry of **either** temporal relationship denies current access — an active engagement does not resurrect a lapsed worker affiliation, and a current worker gains nothing at a mine whose engagement has ended.

Historical access through `record_party` never becomes general mine access. It is scoped to the named record, the named grants, and nothing adjacent.

## Invariants

- No unconditional membership tuple is ever retained for an expired affiliation or engagement.
- `permitted_capabilities` is a narrowing filter over tenant policy, never an additive grant.
- Revoking an engagement reassigns open responsibilities rather than orphaning them, and the action names where they went.
- Attribution written during a live engagement survives its revocation; the finding still says who did the work.

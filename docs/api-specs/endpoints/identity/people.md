# Identity — people, principals, affiliations, and authenticators

Conventions in [`../../README.md`](../../README.md); resource ownership in [`foundation.md`](foundation.md). Tables: `person`, `principal`, `affiliation`, `password_authenticator`, `oidc_identity`, `passkey_credential`, `signing_identity` (`foundation-data-model.md`).

A person is a human record. It carries no employment type, no role, no tenant, and no login status. Those live in `affiliation`, `appointment`, and `principal` respectively, and the API refuses any request that tries to collapse them.

## Routes

| Route | Purpose |
|---|---|
| `GET /people` · `POST /people` | Register and search humans |
| `GET /people/{id}` · `PATCH /people/{id}` · `POST /people/{id}/actions` · `GET /people/{id}/history` | Profile lifecycle |
| `GET /affiliations` · `POST /affiliations` | Person-to-organisation intervals |
| `GET /affiliations/{id}` · `POST /affiliations/{id}/actions` · `GET /affiliations/{id}/history` | Interval lifecycle |
| `GET /principals` · `POST /principals` | Login/service identity |
| `GET /principals/{id}` · `POST /principals/{id}/actions` · `GET /principals/{id}/history` | Login lifecycle |
| `GET /authentication-methods` · `POST /authentication-methods` · `POST /authentication-methods/{id}/actions` | Credential bindings |
| `GET /signing-identities` · `POST /signing-identities` · `POST /signing-identities/{id}/actions` | DSC/eSign identity |

`GET /people/{id}/appointments` does not exist — it is `GET /appointments?filter[person_id]=per_01H…&as_of=…`. `GET /principals/{id}/sessions` does not exist — it is `GET /auth/sessions?filter[principal_id]=prn_01H…`. Sub-resource reads are always the parent filter on the child collection.

---

## POST /people

**Auth:** `identity.person.create` on the target organisation when `intended_organization_id` is supplied, otherwise platform identity administration. Creating a person grants no login and no authority.

`Idempotency-Key` required.

### Request

```json
{
  "display_name": "R. Kumar",
  "given_name": "Rakesh",
  "family_name": "Kumar",
  "display_name_i18n": { "en": "R. Kumar", "hi": "आर. कुमार" },
  "primary_email": "r.kumar@example.gov.in",
  "phone": "+91-98765-43210",
  "date_of_birth": "1981-06-14",
  "gender_code": "MALE",
  "locale_preference": "en-IN",
  "timezone": "Asia/Kolkata",
  "intended_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0",
  "external_references": [
    { "system": "HRMS", "value": "E1024", "issued_by_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0" },
    { "system": "DGMS_STATUTORY_REGISTER", "value": "MM/CG/2019/0447", "issued_by_organization_id": "org_01HZX9Z8Y7X6W5V4V3T2S1R0Q0" }
  ],
  "duplicate_resolution": { "acknowledged_candidate_ids": [], "confirm_distinct": false },
  "extensions": {}
}
```

`date_of_birth`, `gender_code`, and `phone` are optional and redacted on read unless the caller's purpose requires them. `external_references` is the join key to HRMS, statutory registers, biometric vendors, and contractor systems; it is a list because a person legitimately has several and new systems must not need a schema change.

### Response — 201 Created

`Location: /api/v1/people/per_01HZY9K0M1N2P3Q4R5S6T7V8V0`

```json
{
  "success": true,
  "message": "Person created",
  "data": {
    "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0",
    "object": "person",
    "version": 1,
    "tenant_id": null,
    "state": "ACTIVE",
    "available_actions": ["MERGE", "DEACTIVATE"],
    "display_name": "R. Kumar",
    "given_name": "Rakesh",
    "family_name": "Kumar",
    "display_name_i18n": { "en": "R. Kumar", "hi": "आर. कुमार" },
    "primary_email": "r.kumar@example.gov.in",
    "phone": "+91-98765-43210",
    "date_of_birth": "1981-06-14",
    "gender_code": "MALE",
    "locale_preference": "en-IN",
    "timezone": "Asia/Kolkata",
    "avatar_url": null,
    "external_references": [
      { "system": "HRMS", "value": "E1024", "issued_by_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0" },
      { "system": "DGMS_STATUTORY_REGISTER", "value": "MM/CG/2019/0447", "issued_by_organization_id": "org_01HZX9Z8Y7X6W5V4V3T2S1R0Q0" }
    ],
    "merged_into_id": null,
    "has_principal": false,
    "affiliation_count": 0,
    "appointment_count": 0,
    "redacted_fields": [],
    "created_at": "2026-08-30T09:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T09:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/people/per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "history": "/api/v1/people/per_01HZY9K0M1N2P3Q4R5S6T7V8V0/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:00:00Z" }
}
```

`redacted_fields` names every field the caller was not permitted to see, so a client never mistakes a withheld value for an empty one.

### Response — 409 Conflict (exact external-reference match)

```json
{
  "success": false,
  "message": "A person already holds this external reference",
  "error": {
    "code": "CONFLICT",
    "details": {
      "conflicting_field": "external_references[0]",
      "existing": { "type": "person", "id": "per_01HZY5F6G7H8J9K0T1M2N304P0", "display": "Rakesh Kumar" }
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### Response — 422 Possible duplicate

```json
{
  "success": false,
  "message": "Probable duplicate person; confirm or merge before creating",
  "error": {
    "code": "POSSIBLE_DUPLICATE",
    "details": {
      "candidates": [
        { "person": { "type": "person", "id": "per_01HZY5F6G7H8J9K0T1M2N304P0", "display": "Rakesh Kumar" }, "score": 0.93, "matched_on": ["family_name", "phone"] }
      ],
      "resolution": "Resubmit with duplicate_resolution.confirm_distinct = true, or acknowledge the candidate ids"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## GET /people/{id}

**Auth:** self, `identity.person.read` on this person, or authority derived through a governed shared record (a person named on a finding the caller may read). Contact fields not required by the caller's purpose are redacted and named in `redacted_fields`.

Query: `expand=principal,affiliations,appointments,signing_identities`, `as_of`, `fields[person]`.

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0",
    "object": "person",
    "version": 2,
    "state": "ACTIVE",
    "available_actions": ["MERGE", "DEACTIVATE"],
    "display_name": "R. Kumar",
    "given_name": "Rakesh",
    "family_name": "Kumar",
    "display_name_i18n": { "en": "R. Kumar", "hi": "आर. कुमार" },
    "primary_email": "r.kumar@example.gov.in",
    "phone": null,
    "date_of_birth": null,
    "gender_code": null,
    "locale_preference": "en-IN",
    "timezone": "Asia/Kolkata",
    "avatar_url": null,
    "external_references": [{ "system": "HRMS", "value": "E1024", "issued_by_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0" }],
    "merged_into_id": null,
    "has_principal": true,
    "affiliation_count": 1,
    "appointment_count": 1,
    "redacted_fields": ["phone", "date_of_birth", "gender_code"],
    "created_at": "2026-08-30T09:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T09:12:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/people/per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "history": "/api/v1/people/per_01HZY9K0M1N2P3Q4R5S6T7V8V0/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:12:44Z", "as_of": null }
}
```

---

## GET /people

**Auth:** results clipped to people readable through `identity.person.read`, shared governed records, or self. Filters only narrow that set.

### Query params

| Param | Example | Notes |
|---|---|---|
| `q` | `q=kumar` | Name, primary email, and external reference values |
| `filter[organization_id]` | `org_01H…` | Via current affiliation |
| `filter[organization_unit_id]` | `unit_01H…` | Includes descendants unless `filter[unit_recursive]=false` |
| `filter[affiliation_kind]` | `EMPLOYEE,CONTRACTOR_WORKER` | OR within field |
| `filter[state]` | `ACTIVE` | |
| `filter[has_principal]` | `false` | People with no login yet |
| `filter[external_reference.system]` + `filter[external_reference.value]` | `HRMS` / `E1024` | Exact lookup |
| `filter[post_id]` | `post_01H…` | Via current appointment |
| `as_of` | `2026-06-30T23:59:59Z` | Affiliation/appointment-derived filters evaluate at that instant |
| `sort` | `display_name`, `-created_at` | |
| `expand` | `affiliations,appointments` | |
| `group_by` + `metrics` | `group_by=affiliation_kind&metrics=count` | Turns this into a workforce composition report |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0",
      "object": "person",
      "version": 2,
      "state": "ACTIVE",
      "display_name": "R. Kumar",
      "primary_email": "r.kumar@example.gov.in",
      "has_principal": true,
      "affiliation_count": 1,
      "appointment_count": 1,
      "redacted_fields": ["phone"],
      "links": { "self": "/api/v1/people/per_01HZY9K0M1N2P3Q4R5S6T7V8V0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "warnings": [
    { "code": "PARTIAL_SCOPE", "message": "2 organisations excluded from this result by authorization", "details": { "requested_scope": ["org_01HZX2B3C4D5E6F7G8H9J0K1T0", "org_01HZX8Y7Z6A5B4C3D2E1F0G9H0"], "effective_scope": ["org_01HZX2B3C4D5E6F7G8H9J0K1T0"] } }
  ],
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:12:44Z" }
}
```

### Aggregate form — `?group_by=affiliation_kind&metrics=count`

```json
{
  "success": true,
  "data": [
    { "key": { "affiliation_kind": "EMPLOYEE" }, "metrics": { "count": 1842 } },
    { "key": { "affiliation_kind": "CONTRACTOR_WORKER" }, "metrics": { "count": 3117 } }
  ],
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:12:44Z", "grouped_by": ["affiliation_kind"], "metrics": ["count"] }
}
```

---

## PATCH /people/{id}

**Auth:** self for own contact/preference fields, `identity.person.update` otherwise. Requires `If-Match` or body `expected_version`.

### Request

```json
{
  "expected_version": 2,
  "phone": "+91-90000-11111",
  "locale_preference": "hi-IN",
  "external_references": [{ "system": "HRMS", "value": "E1024", "issued_by_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0" }]
}
```

`display_name`, `date_of_birth`, and statutory external references are edit-restricted; changing them requires `identity.person.update_identity` and writes a `security_event`.

### Response — 200 OK

```json
{
  "success": true,
  "message": "Person updated",
  "data": { "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "object": "person", "version": 3, "phone": "+91-90000-11111", "locale_preference": "hi-IN", "updated_at": "2026-08-30T09:30:00Z" },
  "meta": { "action": "PATCH", "effects": [ { "object": "audit_event", "id": "aud_01HZZ2B3C4D5E6F7G8H9J0K1T0", "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-08-30T09:30:00Z" }
}
```

---

## POST /people/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `MERGE` | `identity.person.merge` | required | required | both `ACTIVE` | Sets `merged_into_id` on the loser, repoints affiliations/appointments/records, `audit_event`, outbox reindex |
| `DEACTIVATE` | `identity.person.update` | required | required | `ACTIVE`, no active appointment | `state = INACTIVE`; refuses if a statutory post would be left unmanned |
| `REACTIVATE` | `identity.person.update` | required | required | `INACTIVE` | `state = ACTIVE` |

### Request — MERGE

```json
{
  "action": "MERGE",
  "expected_version": 3,
  "reason": "Duplicate created by HRMS import batch 2026-08",
  "payload": {
    "merge_from_person_id": "per_01HZY5F6G7H8J9K0T1M2N304P0",
    "keep_fields_from": "TARGET",
    "field_overrides": { "phone": "+91-90000-11111" }
  }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "People merged",
  "data": {
    "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0",
    "object": "person",
    "version": 4,
    "state": "ACTIVE",
    "affiliation_count": 3,
    "appointment_count": 2,
    "available_actions": ["DEACTIVATE"]
  },
  "meta": {
    "action": "MERGE",
    "transition": null,
    "effects": [
      { "object": "person", "id": "per_01HZY5F6G7H8J9K0T1M2N304P0", "change": "MERGED", "to": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0" },
      { "object": "affiliation", "count": 2, "change": "REPOINTED" },
      { "object": "appointment", "count": 1, "change": "REPOINTED" },
      { "object": "audit_event", "id": "aud_01HZZ3C4D5E6F7G8H9J0K1T2M0", "change": "CREATED" },
      { "object": "outbox_event", "count": 4, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T09:40:00Z"
  }
}
```

Merge is never a delete. The losing person row survives with `merged_into_id` set so historical records still resolve.

---

## POST /affiliations

**Auth:** `identity.affiliation.manage` on `organization_id`. Regulator affiliations require that authority's administrator; operator administrators cannot create them.

`Idempotency-Key` required.

### Request

```json
{
  "person_id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0",
  "organization_id": "org_01HZX9Z8Y7X6W5V4V3T2S1R0Q0",
  "organization_unit_id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0",
  "affiliation_kind": "OFFICER",
  "external_reference": "DGMS-EMP-123",
  "valid_from": "2026-04-01T00:00:00Z",
  "valid_until": "2029-04-01T00:00:00Z",
  "source_instrument_document_id": "doc_01HZY6G7H8J9K0T1M2N304P5Q0",
  "extensions": {}
}
```

Concurrent affiliations are allowed. `valid_until` may be `null` for open-ended employment; every regulator and contractor affiliation must be bounded.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Affiliation created",
  "data": {
    "id": "aff_01HZY3B4C5D6E7F8G9H0J1K2T0",
    "object": "affiliation",
    "version": 1,
    "tenant_id": null,
    "state": "ACTIVE",
    "available_actions": ["REVOKE", "SUPERSEDE"],
    "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "organization": { "type": "organization", "id": "org_01HZX9Z8Y7X6W5V4V3T2S1R0Q0", "display": "Directorate General of Mines Safety" },
    "organization_unit": { "type": "organization_unit", "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0", "display": "Bilaspur Region" },
    "affiliation_kind": "OFFICER",
    "external_reference": "DGMS-EMP-123",
    "valid_from": "2026-04-01T00:00:00Z",
    "valid_until": "2029-04-01T00:00:00Z",
    "revoked_at": null,
    "revoke_reason": null,
    "superseded_by_id": null,
    "source_instrument": { "type": "document", "id": "doc_01HZY6G7H8J9K0T1M2N304P5Q0", "display": "Posting order DGMS/BSP/2026/118" },
    "created_at": "2026-08-30T09:45:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T09:45:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/affiliations/aff_01HZY3B4C5D6E7F8G9H0J1K2T0", "history": "/api/v1/affiliations/aff_01HZY3B4C5D6E7F8G9H0J1K2T0/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:45:00Z" }
}
```

`state` is **derived** from `valid_from`/`valid_until`/`revoked_at` at read time: `PENDING`, `ACTIVE`, `EXPIRED`, `REVOKED`, or `SUPERSEDED`. It is never stored as an independently writable column, so no row can claim to be active past its interval.

---

## GET /affiliations

**Auth:** self, `identity.affiliation.read` on the organisation, or governed audit authority.

Filters: `person_id`, `organization_id`, `organization_unit_id`, `affiliation_kind`, `state`, `as_of`, `filter[valid_until][lte]` (for expiry sweeps).

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "aff_01HZY3B4C5D6E7F8G9H0J1K2T0",
      "object": "affiliation",
      "version": 1,
      "state": "ACTIVE",
      "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
      "organization": { "type": "organization", "id": "org_01HZX9Z8Y7X6W5V4V3T2S1R0Q0", "display": "Directorate General of Mines Safety" },
      "affiliation_kind": "OFFICER",
      "valid_from": "2026-04-01T00:00:00Z",
      "valid_until": "2029-04-01T00:00:00Z",
      "links": { "self": "/api/v1/affiliations/aff_01HZY3B4C5D6E7F8G9H0J1K2T0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:46:00Z" }
}
```

---

## POST /affiliations/{id}/actions

Clients cannot edit an interval in place. Every change is a revoke or a supersede so the historical record survives.

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `REVOKE` | `identity.affiliation.manage` on the organisation | required | required | `ACTIVE` or `PENDING` | `revoked_at`, invalidates derived authorization tuples, cascades to dependent appointments, `audit_event`, `outbox_event` |
| `SUPERSEDE` | `identity.affiliation.manage` | required | required | `ACTIVE` | Closes this interval and creates the successor in one transaction |
| `EXTEND` | `identity.affiliation.manage` | required | required | `ACTIVE` | Moves `valid_until` forward only; never backward |

### Request — REVOKE

```json
{
  "action": "REVOKE",
  "expected_version": 1,
  "reason": "Service ended on transfer to Nagpur region",
  "effective_at": "2027-02-01T00:00:00Z",
  "payload": { "revoke_reason_code": "TRANSFER", "source_instrument_document_id": "doc_01HZY7H8J9K0T1M2N304P5Q6R0" },
  "supporting_authority": { "appointment_id": "app_01HZX5E6F7G8H9J0K1T2M3N400", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Affiliation revoked",
  "data": {
    "id": "aff_01HZY3B4C5D6E7F8G9H0J1K2T0",
    "object": "affiliation",
    "version": 2,
    "state": "REVOKED",
    "valid_until": "2027-02-01T00:00:00Z",
    "revoked_at": "2027-02-01T00:00:00Z",
    "revoke_reason": "Service ended on transfer to Nagpur region",
    "available_actions": []
  },
  "meta": {
    "action": "REVOKE",
    "transition": { "from": "ACTIVE", "to": "REVOKED" },
    "effects": [
      { "object": "appointment", "count": 1, "change": "STATE", "to": "REVOKED", "note": "Appointments whose interval depended on this affiliation" },
      { "object": "outbox_event", "count": 2, "change": "CREATED", "note": "OpenFGA tuple invalidation" },
      { "object": "audit_event", "id": "aud_01HZZ4D5E6F7G8H9J0K1T2M3N0", "change": "CREATED" },
      { "object": "security_event", "id": "sec_01HZZ5E6F7G8H9J0K1T2M3N400", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T09:50:00Z"
  }
}
```

Existing sessions remain authenticated but lose the derived permissions immediately — revocation is not deferred to session expiry.

### Request — SUPERSEDE

```json
{
  "action": "SUPERSEDE",
  "expected_version": 2,
  "reason": "Re-designated to Korba Area on same employment",
  "effective_at": "2027-02-01T00:00:00Z",
  "payload": {
    "successor": {
      "organization_id": "org_01HZX9Z8Y7X6W5V4V3T2S1R0Q0",
      "organization_unit_id": "unit_01HZX6F7G8H9J0K1T2M3N405P0",
      "affiliation_kind": "OFFICER",
      "external_reference": "DGMS-EMP-123",
      "valid_until": "2030-04-01T00:00:00Z",
      "source_instrument_document_id": "doc_01HZY8J9K0T1M2N304P5Q6R7S0"
    }
  }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Affiliation superseded",
  "data": {
    "id": "aff_01HZY3B4C5D6E7F8G9H0J1K2T0",
    "object": "affiliation",
    "version": 3,
    "state": "SUPERSEDED",
    "valid_until": "2027-02-01T00:00:00Z",
    "superseded_by_id": "aff_01HZY4C5D6E7F8G9H0J1K2T3M0"
  },
  "included": {
    "affiliation:aff_01HZY4C5D6E7F8G9H0J1K2T3M0": {
      "id": "aff_01HZY4C5D6E7F8G9H0J1K2T3M0",
      "object": "affiliation",
      "version": 1,
      "state": "PENDING",
      "valid_from": "2027-02-01T00:00:00Z",
      "valid_until": "2030-04-01T00:00:00Z",
      "organization_unit": { "type": "organization_unit", "id": "unit_01HZX6F7G8H9J0K1T2M3N405P0", "display": "Korba Area" }
    }
  },
  "meta": {
    "action": "SUPERSEDE",
    "transition": { "from": "ACTIVE", "to": "SUPERSEDED" },
    "effects": [
      { "object": "affiliation", "id": "aff_01HZY4C5D6E7F8G9H0J1K2T3M0", "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ6F7G8H9J0K1T2M3N405P0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T09:52:00Z"
  }
}
```

---

## POST /principals

**Auth:** `identity.principal.manage` over the linked person's governing organisation. Service principals omit `person_id` and require an owning organisation, declared purpose, and expiry/review policy.

### Request — human

```json
{
  "kind": "HUMAN",
  "person_id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0",
  "status": "INVITED",
  "invitation": { "send_to": "r.kumar@example.gov.in", "expires_in": "P7D", "locale": "en-IN" },
  "extensions": {}
}
```

### Request — service

```json
{
  "kind": "SERVICE",
  "person_id": null,
  "status": "ACTIVE",
  "owning_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0",
  "service_name": "secl-hrms-sync",
  "declared_purpose": "Nightly affiliation reconciliation from SECL HRMS",
  "review_due_on": "2027-02-28",
  "expires_at": "2027-03-31T00:00:00Z",
  "allowed_source_cidrs": ["10.44.0.0/16"],
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Principal created",
  "data": {
    "id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
    "object": "principal",
    "version": 1,
    "state": "INVITED",
    "available_actions": ["ACTIVATE", "SUSPEND", "DISABLE", "RESEND_INVITATION"],
    "kind": "HUMAN",
    "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "owning_organization_id": null,
    "service_name": null,
    "declared_purpose": null,
    "credential_version": 1,
    "last_authenticated_at": null,
    "authentication_method_summary": { "PASSWORD": 0, "OIDC": 0, "PASSKEY": 0 },
    "review_due_on": null,
    "expires_at": null,
    "created_at": "2026-08-30T10:05:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T10:05:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/principals/prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0", "history": "/api/v1/principals/prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0/history" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T10:05:00Z",
    "effects": [ { "object": "notification", "count": 1, "change": "CREATED", "note": "Invitation email" } ]
  }
}
```

A service-principal create additionally returns a one-time secret, present in the response body once and never again:

```json
{ "data": { "id": "prn_01HZY1A2B3C4D5E6F7G8H9J0K0", "kind": "SERVICE", "bootstrap_secret": "sec_demo_9c1a4b2e7d05f83b6a2e9d7c4f1b8e30", "bootstrap_secret_expires_at": "2026-08-30T10:20:00Z" } }
```

---

## GET /principals · GET /principals/{id}

**Auth:** self, or `identity.principal.read` on the governing organisation.

Filters: `person_id`, `kind`, `state`, `owning_organization_id`, `filter[review_due_on][lte]`, `filter[last_authenticated_at][lt]` (dormant-account sweep).

### Response — 200 OK (single)

```json
{
  "success": true,
  "data": {
    "id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
    "object": "principal",
    "version": 5,
    "state": "ACTIVE",
    "available_actions": ["SUSPEND", "DISABLE", "FORCE_CREDENTIAL_ROTATION"],
    "kind": "HUMAN",
    "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "owning_organization_id": null,
    "service_name": null,
    "declared_purpose": null,
    "credential_version": 3,
    "last_authenticated_at": "2026-08-30T10:00:00Z",
    "authentication_method_summary": { "PASSWORD": 1, "OIDC": 1, "PASSKEY": 0 },
    "active_session_count": 2,
    "review_due_on": null,
    "expires_at": null,
    "suspended_reason": null,
    "created_at": "2026-08-30T10:05:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T10:30:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/principals/prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0", "sessions": "/api/v1/auth/sessions?filter[principal_id]=prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T10:31:00Z" }
}
```

---

## POST /principals/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `ACTIVATE` | `identity.principal.manage` | optional | required | `INVITED` or `SUSPENDED` | `state = ACTIVE` |
| `SUSPEND` | `identity.principal.manage` | **required** | required | `ACTIVE` | `credential_version++`, revokes all sessions, `security_event` |
| `DISABLE` | `identity.principal.manage` | **required** | required | any non-`DISABLED` | Terminal. `credential_version++`, revokes sessions and service secrets |
| `FORCE_CREDENTIAL_ROTATION` | `identity.principal.manage` or self | **required** | required | `ACTIVE` | `credential_version++`, revokes sessions, flags `must_complete: ["SET_PASSWORD"]` |
| `RESEND_INVITATION` | `identity.principal.manage` | optional | no | `INVITED` | New invitation notification |
| `ROTATE_SERVICE_SECRET` | `identity.principal.manage` | **required** | required | `ACTIVE`, `kind = SERVICE` | New one-time secret, old secret valid for `grace` |

### Request — SUSPEND

```json
{
  "action": "SUSPEND",
  "expected_version": 5,
  "reason": "Credential compromise reported by SOC ticket SEC-2026-0441",
  "payload": { "suspend_reason_code": "CREDENTIAL_COMPROMISE", "revoke_sessions": true, "notify_person": true }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Principal suspended",
  "data": {
    "id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
    "object": "principal",
    "version": 6,
    "state": "SUSPENDED",
    "credential_version": 4,
    "active_session_count": 0,
    "suspended_reason": "Credential compromise reported by SOC ticket SEC-2026-0441",
    "available_actions": ["ACTIVATE", "DISABLE"]
  },
  "meta": {
    "action": "SUSPEND",
    "transition": { "from": "ACTIVE", "to": "SUSPENDED" },
    "effects": [
      { "object": "session", "count": 2, "change": "REVOKED" },
      { "object": "security_event", "id": "sec_01HZZ7G8H9J0K1T2M3N405P6Q0", "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ8H9J0K1T2M3N405P6Q7R0", "change": "CREATED" },
      { "object": "notification", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T10:35:00Z"
  }
}
```

---

## POST /authentication-methods

**Auth:** self with recent authentication (`ASSURANCE_REQUIRED` otherwise), or `identity.principal.manage`. `type` discriminates; new types are additive.

### Request — password

```json
{
  "principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
  "type": "PASSWORD",
  "password": { "new_password": "client-supplied secret", "current_password": "client-supplied secret" }
}
```

### Request — OIDC

```json
{
  "principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
  "type": "OIDC",
  "oidc": { "issuer": "https://login.gov.in", "subject": "e2f4c9a1-7b30-4d55-9a0e-1c2b3d4e5f60" }
}
```

### Request — passkey

```json
{
  "principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
  "type": "PASSKEY",
  "passkey": {
    "credential_id": "AQIDBAUGBwgJCgsMDQ4PEA",
    "public_key": "pQECAyYgASFYIB...",
    "attestation_format": "packed",
    "authenticator_label": "Pixel 8 — work",
    "transports": ["internal", "hybrid"]
  }
}
```

Email is never a binding key for OIDC. Only a policy-compliant hash of a password is stored.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Authentication method registered",
  "data": {
    "id": "authm_01HZY7G8H9J0K1T2M3N405P6Q0",
    "object": "authentication_method",
    "version": 1,
    "state": "ACTIVE",
    "available_actions": ["REVOKE"],
    "principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
    "type": "OIDC",
    "label": "login.gov.in",
    "issuer": "https://login.gov.in",
    "subject_masked": "e2f4…5f60",
    "linked_at": "2026-08-30T10:40:00Z",
    "last_used_at": null,
    "revoked_at": null,
    "created_at": "2026-08-30T10:40:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/authentication-methods/authm_01HZY7G8H9J0K1T2M3N405P6Q0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T10:40:00Z" }
}
```

No verifier, subject, public key, or secret material is ever returned. `subject_masked` exists so an administrator can distinguish two OIDC bindings without the full subject leaking into logs.

---

## POST /authentication-methods/{id}/actions

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `REVOKE` | self with recent authentication, or `identity.principal.manage` | **required** | required | `revoked_at`; optionally revokes sessions; `security_event` |

Authentication methods are never hard-deleted — a revoked row is the audit trail for a lost device.

### Request

```json
{
  "action": "REVOKE",
  "expected_version": 1,
  "reason": "Device lost in transit",
  "payload": { "revoke_sessions": true, "revoke_reason_code": "DEVICE_LOST" }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Authentication method revoked",
  "data": {
    "id": "authm_01HZY7G8H9J0K1T2M3N405P6Q0",
    "object": "authentication_method",
    "version": 2,
    "state": "REVOKED",
    "revoked_at": "2026-08-30T10:45:00Z",
    "available_actions": []
  },
  "meta": {
    "action": "REVOKE",
    "transition": { "from": "ACTIVE", "to": "REVOKED" },
    "effects": [
      { "object": "session", "count": 1, "change": "REVOKED" },
      { "object": "security_event", "id": "sec_01HZZ9J0K1T2M3N405P6Q7R8S0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T10:45:00Z"
  }
}
```

### Response — 422 Unprocessable (last method)

```json
{
  "success": false,
  "message": "Cannot revoke the only remaining authentication method on an active principal",
  "error": { "code": "UNPROCESSABLE", "details": { "remaining_active_methods": 1, "resolution": "Register a replacement method first, or suspend the principal" } },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## POST /signing-identities · POST /signing-identities/{id}/actions

**Auth:** `identity.signing_identity.manage`, or self with high assurance. A signing identity belongs to a **person**, not a principal — the legal signatory is the human, and it survives a login being reissued.

### Request

```json
{
  "person_id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0",
  "provider": "EMUDHRA_DSC",
  "certificate_ref": "cert_serial:5f2a91c4e7",
  "certificate_subject_dn": "CN=Rakesh Kumar, O=SECL, C=IN",
  "certificate_fingerprint_sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
  "valid_from": "2026-01-01T00:00:00Z",
  "valid_until": "2029-01-01T00:00:00Z",
  "purposes": ["REPORT_ATTESTATION", "DOCUMENT_SIGNATURE"],
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Signing identity registered",
  "data": {
    "id": "sign_01HZY8H9J0K1T2M3N405P6Q7R0",
    "object": "signing_identity",
    "version": 1,
    "state": "ACTIVE",
    "available_actions": ["REVOKE"],
    "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "provider": "EMUDHRA_DSC",
    "certificate_ref": "cert_serial:5f2a91c4e7",
    "certificate_subject_dn": "CN=Rakesh Kumar, O=SECL, C=IN",
    "certificate_fingerprint_sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "valid_from": "2026-01-01T00:00:00Z",
    "valid_until": "2029-01-01T00:00:00Z",
    "purposes": ["REPORT_ATTESTATION", "DOCUMENT_SIGNATURE"],
    "revoked_at": null,
    "signature_count": 0,
    "created_at": "2026-08-30T10:50:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/signing-identities/sign_01HZY8H9J0K1T2M3N405P6Q7R0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T10:50:00Z" }
}
```

Actions: `REVOKE` (reason required, `expected_version` required) — signatures already produced remain valid and verifiable against the revoked certificate's recorded fingerprint and the revocation instant.

---

## Invariants

- No request accepts `person_type`, `role`, or `is_admin`. A person's powers are always the intersection of current affiliation, appointment, mandate, and jurisdiction.
- `state` on `affiliation` and `appointment` is derived from intervals at read time, never stored as an independently writable column.
- Revocation invalidates derived authorization projections synchronously; sessions stay authenticated but lose permissions in the same transaction.
- A revoked authenticator, affiliation, or appointment is never hard-deleted.
- Contact data is redacted by purpose, and every redaction is declared in `redacted_fields`.

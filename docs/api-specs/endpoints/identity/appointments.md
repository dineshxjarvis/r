# Identity — appointments, mandates, and jurisdictions

An appointment places a person in a post for an interval. A **mandate assignment** grants an authority's capability vocabulary to that appointment. A **jurisdiction assignment** bounds where it applies. Authority is the intersection of all three plus the underlying affiliation — never any one of them alone.

Every command validates current authority at server decision time and records the actor's supporting appointment. Tables: `appointment`, `mandate`, `mandate_capability`, `mandate_assignment`, `jurisdiction_assignment` (`foundation-data-model.md`).

## Routes

| Route | Purpose |
|---|---|
| `GET /appointments` · `POST /appointments` · `GET /appointments/{id}` · `POST /appointments/{id}/actions` · `GET /appointments/{id}/history` | Person-to-post authority intervals |
| `GET /mandates` · `POST /mandates` · `GET /mandates/{id}` · `POST /mandates/{id}/actions` | Authority capability vocabulary |
| `GET /mandate-assignments` · `POST /mandate-assignments` · `POST /mandate-assignments/{id}/actions` | Grant of a mandate to an appointment |
| `GET /jurisdiction-assignments` · `POST /jurisdiction-assignments` · `POST /jurisdiction-assignments/{id}/actions` | Time-bounded coverage |

`POST /appointments/{id}/mandates` and `POST /appointments/{id}/jurisdictions` do not exist — they are creates on `/mandate-assignments` and `/jurisdiction-assignments` with `appointment_id` in the body, so both grants are first-class, listable, filterable, and independently revocable.

`GET /appointments/{id}/effective-authority` does not exist — it is `GET /appointments/{id}?expand=effective_authority&as_of=…`.

---

## POST /appointments

**Auth:** `appointment.manage` on the target post. Regulatory posts require the governing authority's administrator; operator administrators cannot appoint regulator officers and receive `403 FORBIDDEN`. `Idempotency-Key` required.

### Request

```json
{
  "person_id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0",
  "post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0",
  "affiliation_id": "aff_01HZY3B4C5D6E7F8G9H0J1K2T0",
  "mode": "REGULAR",
  "valid_from": "2026-04-01T00:00:00Z",
  "valid_until": "2029-04-01T00:00:00Z",
  "source_instrument_document_id": "doc_01HZY6G7H8J9K0T1M2N304P5Q0",
  "qualification_evidence": [
    { "qualification_code": "DGMS_FIRST_CLASS_MANAGER_CERT", "certificate_number": "FC/2014/00871", "issued_on": "2014-07-19", "valid_until": "2034-07-18", "document_id": "doc_01HZYE4F5G6H7J8K9T0M1N2030" }
  ],
  "appointed_by_appointment_id": "app_01HZX5E6F7G8H9J0K1T2M3N400",
  "notify_appointee": true,
  "extensions": {}
}
```

The interval must fit inside any required affiliation. Eligibility declared on the position template is machine-checked against `qualification_evidence`; a missing mandatory qualification is `422 UNPROCESSABLE`, not a warning.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Appointment created",
  "data": {
    "id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "object": "appointment",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PENDING",
    "available_actions": ["REVOKE", "SUPERSEDE"],
    "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
    "position_template_code": "MINE_MANAGER",
    "statutory": true,
    "scope": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "affiliation": { "type": "affiliation", "id": "aff_01HZY3B4C5D6E7F8G9H0J1K2T0", "display": "SECL — Employee" },
    "mode": "REGULAR",
    "valid_from": "2026-04-01T00:00:00Z",
    "valid_until": "2029-04-01T00:00:00Z",
    "derived_state": "PENDING",
    "source_instrument": { "type": "document", "id": "doc_01HZY6G7H8J9K0T1M2N304P5Q0", "display": "Appointment order SECL/2026/AO/0117" },
    "qualification_evidence": [
      { "qualification_code": "DGMS_FIRST_CLASS_MANAGER_CERT", "certificate_number": "FC/2014/00871", "issued_on": "2014-07-19", "valid_until": "2034-07-18", "document_id": "doc_01HZYE4F5G6H7J8K9T0M1N2030", "verification_status": "VERIFIED" }
    ],
    "appointed_by": { "type": "appointment", "id": "app_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Area General Manager, Korba" },
    "revoked_at": null,
    "revoke_reason": null,
    "superseded_by_id": null,
    "mandate_assignment_count": 0,
    "jurisdiction_assignment_count": 0,
    "created_at": "2026-03-20T09:30:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-03-20T09:30:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/appointments/app_01HZY2A3B4C5D6E7F8G9H0J1K0", "history": "/api/v1/appointments/app_01HZY2A3B4C5D6E7F8G9H0J1K0/history" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-03-20T09:30:00Z",
    "effects": [
      { "object": "outbox_event", "count": 1, "change": "CREATED", "note": "OpenFGA appointment tuple, effective 2026-04-01" },
      { "object": "notification", "count": 1, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ8R9S0T1V2V3W4X5Y6Z7A0", "change": "CREATED" }
    ]
  }
}
```

`derived_state` is computed at read time from `valid_from`, `valid_until`, `revoked_at`, `superseded_by_id`, and the parent affiliation's own state: `PENDING`, `ACTIVE`, `EXPIRED`, `REVOKED`, `SUPERSEDED`, or `SUSPENDED_BY_AFFILIATION`. It is never a writable column, so a row can never claim authority its interval does not support.

### Response — 409 Appointment overlap

```json
{
  "success": false,
  "message": "Single-holder post already has an active appointment over this interval",
  "error": {
    "code": "APPOINTMENT_OVERLAP",
    "details": {
      "post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0",
      "holder_policy": "SINGLE_HOLDER",
      "conflicting": [
        { "type": "appointment", "id": "app_01HZYF5G6H7J8K9T0M1N203P40", "display": "P. Sahu", "valid_from": "2023-04-01T00:00:00Z", "valid_until": "2027-03-31T00:00:00Z" }
      ],
      "resolution": "Use action SUPERSEDE on the conflicting appointment, or change the post to MULTI_HOLDER"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

Overlap is rejected transactionally in the database for single-holder posts. Multi-holder posts allow overlap by design, and a person may hold several concurrent appointments to different posts.

---

## GET /appointments · GET /appointments/{id}

**Auth:** self, `appointment.read` on the post, or governed audit authority. Sensitive instrument data is redacted per projection and named in `redacted_fields`.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[person_id]` | `per_01H…` | "My appointments", or a person's service record |
| `filter[post_id]` · `filter[organization_unit_id]` | | |
| `filter[scope.type]` + `filter[scope.id]` | `mine` / `mine_01H…` | Who holds authority over this mine |
| `filter[state]` | `ACTIVE` | Derived state |
| `filter[mode]` | `ACTING,ADDITIONAL_CHARGE` | Temporary-cover report |
| `filter[statutory]` | `true` | |
| `filter[regulatory_authority_id]` | `auth_01H…` | Regulator officers only |
| `filter[valid_until][lte]` | `2026-12-31T00:00:00Z` | Expiry sweep |
| `filter[qualification_expiring_before]` | `2027-01-01` | Certificates lapsing before the appointment does |
| `as_of` | `2026-06-30T23:59:59Z` | Who held this post on that date |
| `expand` | `mandate_assignments,jurisdiction_assignments,effective_authority,person,post` | |

### Response — 200 OK, `?expand=effective_authority&as_of=2026-09-01T00:00:00Z`

```json
{
  "success": true,
  "data": {
    "id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "object": "appointment",
    "version": 4,
    "tenant_id": null,
    "state": "ACTIVE",
    "available_actions": ["REVOKE", "SUPERSEDE"],
    "person": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "post": { "type": "post", "id": "post_01HZYJ8K9T0M1N203P4Q5R6S70", "display": "Deputy Director of Mines Safety, Bilaspur" },
    "position_template_code": "DEPUTY_DIRECTOR_MINES_SAFETY",
    "statutory": true,
    "scope": { "type": "authority_unit", "id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20", "display": "Bilaspur Region" },
    "mode": "REGULAR",
    "valid_from": "2024-07-01T00:00:00Z",
    "valid_until": "2027-06-30T00:00:00Z",
    "derived_state": "ACTIVE",
    "mandate_assignment_count": 2,
    "jurisdiction_assignment_count": 1,
    "effective_authority": {
      "as_of": "2026-09-01T00:00:00Z",
      "authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS", "code": "DGMS" },
      "authority_unit": { "type": "authority_unit", "id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20", "display": "Bilaspur Region" },
      "mandates": [
        { "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00", "mandate_code": "MINE_SAFETY_INSPECTION", "valid_until": "2027-06-30T00:00:00Z", "capabilities": ["inspection.create_regulatory", "finding.raise", "finding.close_severe", "mine.read_published", "document.issue_direction"] },
        { "mandate_assignment_id": "mand_01HZYK9T0M1N203P4Q5R6S7T80", "mandate_code": "ACCIDENT_ENQUIRY", "valid_until": "2027-06-30T00:00:00Z", "capabilities": ["incident.investigate", "incident.read_any", "evidence.read_any"] }
      ],
      "jurisdictions": [
        {
          "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
          "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
          "selector_type": "MINE_SET",
          "selector_payload": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "mine_01HZYB1C2D3E4F5G6H7J8K9T00"] },
          "resolved_resource_count": 2,
          "valid_from": "2024-07-01T00:00:00Z",
          "valid_until": "2027-06-30T00:00:00Z"
        }
      ],
      "exclusions": [
        { "resource": { "type": "mine", "id": "mine_01HZYT0M1N203P4Q5R6S7T8V90", "display": "Kusmunda OCP" }, "reason": "RECUSAL", "recorded_at": "2026-02-11T00:00:00Z" }
      ],
      "resolved_capabilities": [
        { "capability_code": "finding.close_severe", "resources": { "type": "mine_set", "count": 2, "sample": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"] }, "via_mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00", "via_jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10", "required_assurance": "PASSKEY" }
      ],
      "policy_versions": { "capability_catalogue_version": 17, "conditions_schema_version": 3, "selector_schema_version": 2 }
    },
    "redacted_fields": [],
    "created_at": "2024-06-20T09:00:00Z",
    "updated_at": "2026-02-11T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/appointments/app_01HZYG6H7J8K9T0M1N203P4Q50" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:35:00Z", "as_of": "2026-09-01T00:00:00Z" }
}
```

`effective_authority` is **explanatory**. It never replaces authorization on a domain resource, and a client that caches it must still expect a `403` when the underlying grant lapses mid-session. It exists so an officer, an auditor, and a court can all see the same answer to "under what authority?" — including the exclusions, which is the part a naive capability list always loses.

---

## POST /appointments/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `REVOKE` | `appointment.manage` on the post; self-revocation only where policy permits resignation | **required** | required | `PENDING` or `ACTIVE` | `revoked_at`, invalidates derived tuples, cascades to dependent mandate/jurisdiction assignments, may raise an unmanned-required-post condition |
| `SUPERSEDE` | `appointment.manage` | **required** | required | `ACTIVE` | Closes this interval and creates the successor in one transaction |
| `EXTEND` | `appointment.manage` | **required** | required | `ACTIVE` | Moves `valid_until` forward only, within the parent affiliation |
| `CHANGE_MODE` | `appointment.manage` | **required** | required | `ACTIVE` | `ACTING` → `REGULAR` on confirmation of a substantive posting |
| `RECORD_EXCLUSION` | `appointment.manage` or self | **required** | required | `ACTIVE` | Records a recusal/conflict exclusion; narrows effective coverage without touching the jurisdiction grant |

### Request — REVOKE

```json
{
  "action": "REVOKE",
  "expected_version": 4,
  "reason": "Transfer to Nagpur region per order DGMS/EST/2027/044",
  "effective_at": "2027-01-15T10:00:00Z",
  "payload": { "revoke_reason_code": "TRANSFER", "source_instrument_document_id": "doc_01HZYM1N203P4Q5R6S7T8V9V00", "successor_appointment_id": null },
  "supporting_authority": { "appointment_id": "app_01HZYN203P4Q5R6S7T8V9V0W10", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Appointment revoked",
  "data": {
    "id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "object": "appointment",
    "version": 5,
    "state": "REVOKED",
    "valid_until": "2027-01-15T10:00:00Z",
    "revoked_at": "2027-01-15T10:00:00Z",
    "revoke_reason": "Transfer to Nagpur region per order DGMS/EST/2027/044",
    "available_actions": []
  },
  "meta": {
    "action": "REVOKE",
    "transition": { "from": "ACTIVE", "to": "REVOKED" },
    "effects": [
      { "object": "mandate_assignment", "count": 2, "change": "STATE", "to": "REVOKED" },
      { "object": "jurisdiction_assignment", "count": 1, "change": "STATE", "to": "REVOKED" },
      { "object": "post", "id": "post_01HZYJ8K9T0M1N203P4Q5R6S70", "change": "STATE", "to": "VACANT" },
      { "object": "notification", "count": 4, "change": "CREATED", "note": "Unmanned statutory post raised to the appointing authority" },
      { "object": "outbox_event", "count": 5, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ9S0T1V2V3W4X5Y6Z7A8B0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2027-01-15T10:00:00Z"
  }
}
```

### Request — SUPERSEDE

```json
{
  "action": "SUPERSEDE",
  "expected_version": 5,
  "reason": "Successor appointed on substantive posting",
  "effective_at": "2027-04-01T00:00:00Z",
  "payload": {
    "successor": {
      "person_id": "per_01HZYP3Q4R5S6T7V8V9W0X1Y20",
      "affiliation_id": "aff_01HZYQ4R5S6T7V8V9W0X1Y2Z30",
      "mode": "REGULAR",
      "valid_until": "2030-04-01T00:00:00Z",
      "source_instrument_document_id": "doc_01HZYR5S6T7V8V9W0X1Y2Z3A40",
      "qualification_evidence": [
        { "qualification_code": "DGMS_FIRST_CLASS_MANAGER_CERT", "certificate_number": "FC/2018/01442", "issued_on": "2018-05-04", "valid_until": "2038-05-03", "document_id": "doc_01HZYS6T7V8V9W0X1Y2Z3A4B50" }
      ],
      "carry_forward_mandates": true,
      "carry_forward_jurisdictions": true
    }
  }
}
```

One transaction closes the old authority interval, creates the new appointment, re-checks holder policy and eligibility, optionally re-issues the mandate and jurisdiction assignments against the new appointment, and writes audit/outbox records.

### Response — 200 OK

```json
{
  "success": true,
  "message": "Appointment superseded",
  "data": {
    "id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "object": "appointment",
    "version": 6,
    "state": "SUPERSEDED",
    "valid_until": "2027-04-01T00:00:00Z",
    "superseded_by_id": "app_01HZYT7V8V9W0X1Y2Z3A4B5C60"
  },
  "included": {
    "appointment:app_01HZYT7V8V9W0X1Y2Z3A4B5C60": {
      "id": "app_01HZYT7V8V9W0X1Y2Z3A4B5C60",
      "object": "appointment",
      "version": 1,
      "state": "PENDING",
      "person": { "type": "person", "id": "per_01HZYP3Q4R5S6T7V8V9W0X1Y20", "display": "S. Nayak" },
      "post": { "type": "post", "id": "post_01HZYJ8K9T0M1N203P4Q5R6S70", "display": "Deputy Director of Mines Safety, Bilaspur" },
      "mode": "REGULAR",
      "valid_from": "2027-04-01T00:00:00Z",
      "valid_until": "2030-04-01T00:00:00Z",
      "mandate_assignment_count": 2,
      "jurisdiction_assignment_count": 1
    }
  },
  "meta": {
    "action": "SUPERSEDE",
    "transition": { "from": "ACTIVE", "to": "SUPERSEDED" },
    "effects": [
      { "object": "appointment", "id": "app_01HZYT7V8V9W0X1Y2Z3A4B5C60", "change": "CREATED" },
      { "object": "mandate_assignment", "count": 2, "change": "CREATED", "note": "Carried forward to the successor" },
      { "object": "jurisdiction_assignment", "count": 1, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZA0B1C2D3E4F5G6H7J8K90", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2027-04-01T00:00:00Z"
  }
}
```

---

## POST /mandates

**Auth:** platform authority administration on the owning regulatory authority. A mandate is the authority's own capability vocabulary; an operator can read it and never write it.

### Request

```json
{
  "regulatory_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
  "code": "MINE_SAFETY_INSPECTION",
  "name": "Mine safety inspection and enforcement",
  "name_i18n": { "en": "Mine safety inspection and enforcement", "hi": "खान सुरक्षा निरीक्षण एवं प्रवर्तन" },
  "description": "Inspection, direction, prohibition and closure powers under the Mines Act 1952 and CMR 2017",
  "statutory_basis": [{ "instrument": "MINES_ACT_1952", "provision": "s. 22" }, { "instrument": "CMR_2017", "provision": "Reg. 3" }],
  "capability_codes": ["inspection.create_regulatory", "finding.raise", "finding.close_severe", "mine.read_published", "document.issue_direction", "mine.order_prohibition"],
  "active": true,
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Mandate created",
  "data": {
    "id": "mdt_01HZYV8V9W0X1Y2Z3A4B5C6D70",
    "object": "mandate",
    "version": 1,
    "tenant_id": null,
    "state": "ACTIVE",
    "available_actions": ["DEACTIVATE", "AMEND_CAPABILITIES"],
    "regulatory_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
    "code": "MINE_SAFETY_INSPECTION",
    "name": "Mine safety inspection and enforcement",
    "name_i18n": { "en": "Mine safety inspection and enforcement", "hi": "खान सुरक्षा निरीक्षण एवं प्रवर्तन" },
    "description": "Inspection, direction, prohibition and closure powers under the Mines Act 1952 and CMR 2017",
    "statutory_basis": [{ "instrument": "MINES_ACT_1952", "provision": "s. 22" }, { "instrument": "CMR_2017", "provision": "Reg. 3" }],
    "capabilities": [
      { "capability_code": "inspection.create_regulatory", "capability_id": "cap_01HZYV9W0X1Y2Z3A4B5C6D7E80", "risk_class": "ELEVATED", "required_assurance": "PASSWORD" },
      { "capability_code": "finding.close_severe", "capability_id": "cap_01HZYW0X1Y2Z3A4B5C6D7E8F90", "risk_class": "HIGH", "required_assurance": "PASSKEY" },
      { "capability_code": "mine.order_prohibition", "capability_id": "cap_01HZYX1Y2Z3A4B5C6D7E8F9G00", "risk_class": "HIGH", "required_assurance": "PASSKEY" }
    ],
    "assignment_count": 0,
    "created_at": "2026-08-30T09:40:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T09:40:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/mandates/mdt_01HZYV8V9W0X1Y2Z3A4B5C6D70" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:40:00Z" }
}
```

---

## POST /mandate-assignments

**Auth:** `regulatory_assignment.manage` on the mandate's regulatory authority. Non-regulatory organisational capabilities come from position policy ([`posts.md`](posts.md)) and never through this route.

### Request

```json
{
  "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
  "mandate_id": "mdt_01HZYV8V9W0X1Y2Z3A4B5C6D70",
  "valid_from": "2024-07-01T00:00:00Z",
  "valid_until": "2027-06-30T00:00:00Z",
  "source_instrument_document_id": "doc_01HZYY2Z3A4B5C6D7E8F9G0H10",
  "capability_restrictions": { "exclude_capability_codes": ["mine.order_prohibition"] },
  "extensions": {}
}
```

The interval must be contained by the appointment's. `capability_restrictions` may only **narrow** the mandate — an attempt to add a capability the mandate does not contain is `422 UNPROCESSABLE`.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Mandate assigned",
  "data": {
    "id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
    "object": "mandate_assignment",
    "version": 1,
    "tenant_id": null,
    "state": "ACTIVE",
    "available_actions": ["REVOKE", "SUPERSEDE"],
    "appointment": { "type": "appointment", "id": "app_01HZYG6H7J8K9T0M1N203P4Q50", "display": "A. Banerjee — Deputy Director, Bilaspur" },
    "mandate": { "type": "mandate", "id": "mdt_01HZYV8V9W0X1Y2Z3A4B5C6D70", "display": "Mine safety inspection and enforcement" },
    "mandate_code": "MINE_SAFETY_INSPECTION",
    "regulatory_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
    "valid_from": "2024-07-01T00:00:00Z",
    "valid_until": "2027-06-30T00:00:00Z",
    "capability_restrictions": { "exclude_capability_codes": ["mine.order_prohibition"] },
    "effective_capability_codes": ["inspection.create_regulatory", "finding.raise", "finding.close_severe", "mine.read_published", "document.issue_direction"],
    "revoked_at": null,
    "superseded_by_id": null,
    "source_instrument": { "type": "document", "id": "doc_01HZYY2Z3A4B5C6D7E8F9G0H10", "display": "Mandate order DGMS/HQ/2024/0912" },
    "created_at": "2024-06-25T09:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2024-06-25T09:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/mandate-assignments/mand_01HZYB1C2D3E4F5G6H7J8K9T00" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2024-06-25T09:00:00Z" }
}
```

Actions: `REVOKE`, `SUPERSEDE`, `AMEND_RESTRICTIONS` — all reason-required and `expected_version`-required.

---

## POST /jurisdiction-assignments

**Auth:** `regulatory_assignment.manage` on the appointment's authority.

### Request — mine set

```json
{
  "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
  "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
  "selector_type": "MINE_SET",
  "selector_payload": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "mine_01HZYB1C2D3E4F5G6H7J8K9T00"] },
  "valid_from": "2024-07-01T00:00:00Z",
  "valid_until": "2027-06-30T00:00:00Z",
  "source_instrument_document_id": "doc_01HZYZ3A4B5C6D7E8F9G0H1120",
  "extensions": {}
}
```

### Request — geography

```json
{
  "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
  "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
  "selector_type": "GEOGRAPHY",
  "selector_payload": {
    "geometry": { "type": "Polygon", "coordinates": [[[81.9, 21.8], [83.4, 21.8], [83.4, 23.1], [81.9, 23.1], [81.9, 21.8]]], "srid": 4326 },
    "include_mines_intersecting": true
  },
  "valid_from": "2024-07-01T00:00:00Z",
  "valid_until": "2027-06-30T00:00:00Z",
  "source_instrument_document_id": "doc_01HZYZ3A4B5C6D7E8F9G0H1120",
  "extensions": {}
}
```

Selector types include `MINE`, `MINE_SET`, `TENANT`, `ORGANIZATION_UNIT`, `STATE`, `GEOGRAPHY`, and `PLATFORM_PORTFOLIO`. Payloads are validated against the selector's versioned schema at `GET /schemas/jurisdiction_selector?selector_type=GEOGRAPHY`; a new selector type is registry data, not a new route.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Jurisdiction assigned",
  "data": {
    "id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
    "object": "jurisdiction_assignment",
    "version": 1,
    "tenant_id": null,
    "state": "ACTIVE",
    "available_actions": ["REVOKE", "SUPERSEDE"],
    "appointment": { "type": "appointment", "id": "app_01HZYG6H7J8K9T0M1N203P4Q50", "display": "A. Banerjee — Deputy Director, Bilaspur" },
    "mandate_assignment": { "type": "mandate_assignment", "id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00", "display": "MINE_SAFETY_INSPECTION" },
    "selector_type": "MINE_SET",
    "selector_payload": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "mine_01HZYB1C2D3E4F5G6H7J8K9T00"] },
    "selector_schema_version": 2,
    "resolved_resource_count": 2,
    "resolved_at": "2024-06-25T09:05:00Z",
    "valid_from": "2024-07-01T00:00:00Z",
    "valid_until": "2027-06-30T00:00:00Z",
    "revoked_at": null,
    "superseded_by_id": null,
    "source_instrument": { "type": "document", "id": "doc_01HZYZ3A4B5C6D7E8F9G0H1120", "display": "Jurisdiction order DGMS/HQ/2024/0913" },
    "created_at": "2024-06-25T09:05:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2024-06-25T09:05:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/jurisdiction-assignments/jur_01HZYC2D3E4F5G6H7J8K9T0M10", "resolved_resources": "/api/v1/mines?filter[jurisdiction_assignment_id]=jur_01HZYC2D3E4F5G6H7J8K9T0M10" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2024-06-25T09:05:00Z",
    "effects": [ { "object": "outbox_event", "count": 2, "change": "CREATED", "note": "OpenFGA coverage tuples" } ]
  }
}
```

Derived effective coverage may accelerate checks but is never canonical — `resolved_resource_count` is a materialised convenience, and the selector plus the resolution rules are the authority.

### Action — SUPERSEDE (redistricting)

```json
{
  "action": "SUPERSEDE",
  "expected_version": 1,
  "reason": "Redistricting: Kusmunda transferred to Korba sub-region w.e.f. 1 April 2027",
  "effective_at": "2027-04-01T00:00:00Z",
  "payload": {
    "successor": {
      "selector_type": "MINE_SET",
      "selector_payload": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"] },
      "valid_until": "2027-06-30T00:00:00Z",
      "source_instrument_document_id": "doc_01HZZ0A1B2C3D4E5F6G7H8J9K0"
    }
  }
}
```

Redistricting is **never** delete-and-reinsert. The superseded assignment survives so any past decision remains explainable against the coverage that existed when it was made.

### Response — 200 OK

```json
{
  "success": true,
  "message": "Jurisdiction superseded",
  "data": {
    "id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
    "object": "jurisdiction_assignment",
    "version": 2,
    "state": "SUPERSEDED",
    "valid_until": "2027-04-01T00:00:00Z",
    "superseded_by_id": "jur_01HZZ1B2C3D4E5F6G7H8J9K0T0"
  },
  "included": {
    "jurisdiction_assignment:jur_01HZZ1B2C3D4E5F6G7H8J9K0T0": {
      "id": "jur_01HZZ1B2C3D4E5F6G7H8J9K0T0",
      "object": "jurisdiction_assignment",
      "version": 1,
      "state": "PENDING",
      "selector_type": "MINE_SET",
      "selector_payload": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"] },
      "resolved_resource_count": 1,
      "valid_from": "2027-04-01T00:00:00Z",
      "valid_until": "2027-06-30T00:00:00Z"
    }
  },
  "meta": {
    "action": "SUPERSEDE",
    "transition": { "from": "ACTIVE", "to": "SUPERSEDED" },
    "effects": [
      { "object": "jurisdiction_assignment", "id": "jur_01HZZ1B2C3D4E5F6G7H8J9K0T0", "change": "CREATED" },
      { "object": "outbox_event", "count": 3, "change": "CREATED", "note": "Coverage tuple removal for Kusmunda, retention for Gevra" },
      { "object": "audit_event", "id": "aud_01HZZB1C2D3E4F5G6H7J8K9T00", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2027-04-01T00:00:00Z"
  }
}
```

---

## Invariants

- Authority = current affiliation ∩ current appointment ∩ current mandate assignment ∩ current jurisdiction assignment ∩ resource policy. Any lapsed link denies the action.
- Operators cannot create, amend, or revoke regulator appointments, mandates, or jurisdictions under any tenant-administration right.
- Single-holder overlap is rejected in the database, not merely in the service layer.
- Every temporal grant is revoked or superseded, never edited in place or deleted.
- `effective_authority` is explanatory output, never an authorization decision, and always names the policy and selector schema versions it was computed under.

# Identity — position templates and posts

A **position template** is a reusable definition ("Mine Manager"). A **post** is a concrete instance of it, owned by an organisation unit and scoped to a resource ("Mine Manager, Gevra OCP"). An **appointment** ([`appointments.md`](appointments.md)) puts a person into a post for an interval. Nothing here grants authority by itself.

Tables: `position_template`, `post`, `position_capability_policy` (`foundation-data-model.md`). Conventions: [`../../README.md`](../../README.md).

## Routes

| Route | Purpose |
|---|---|
| `GET /position-templates` · `POST /position-templates` · `GET /position-templates/{id}` · `PATCH /position-templates/{id}` · `POST /position-templates/{id}/actions` | Reusable definitions |
| `GET /posts` · `POST /posts` · `GET /posts/{id}` · `PATCH /posts/{id}` · `POST /posts/{id}/actions` · `GET /posts/{id}/history` | Concrete positions |
| `GET /position-capability-policies` · `POST /position-capability-policies` · `POST /position-capability-policies/{id}/actions` | Which capabilities a template confers |

`GET /posts/{id}/current-holders` does not exist — it is `GET /posts/{id}?expand=current_holders`, or `GET /appointments?filter[post_id]=post_01H…&filter[state]=ACTIVE` when the caller wants the appointment rows themselves. Both are plural, because multi-holder posts are real and the API must never silently pick one.

---

## POST /position-templates

**Auth:** `post.template.configure` on the owning organisation, or platform catalogue administration for reusable platform templates (`owning_organization_id: null`).

### Request

```json
{
  "owning_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0",
  "code": "MINE_SAFETY_OFFICER",
  "title": "Safety Officer",
  "title_i18n": { "en": "Safety Officer", "hi": "सुरक्षा अधिकारी" },
  "description": "Statutory safety officer under CMR 2017 Regulation 41",
  "statutory": true,
  "statutory_basis": [{ "instrument": "CMR_2017", "provision": "Reg. 41", "authority_code": "DGMS" }],
  "default_holder_policy": "MULTI_HOLDER",
  "applicable_scope_types": ["mine", "mine_subunit"],
  "eligibility": {
    "required_qualifications": [{ "code": "DGMS_SECOND_CLASS_MANAGER_CERT", "mandatory": true }],
    "minimum_experience": "P5Y",
    "required_medical_clearance": true
  },
  "vacancy_policy": { "max_vacant_duration": "P7D", "on_vacancy": "RAISE_UNMANNED_RESPONSIBILITY" },
  "active": true,
  "extensions": {}
}
```

`eligibility` is declarative and machine-checked when an appointment is attempted; it is not merely documentation. `statutory_basis` is a list because one position frequently answers to more than one instrument.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Position template created",
  "data": {
    "id": "ptpl_01HZY2B3C4D5E6F7G8H9J0K1T0",
    "object": "position_template",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["DEACTIVATE", "ATTACH_CAPABILITY_POLICY"],
    "owning_organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "code": "MINE_SAFETY_OFFICER",
    "title": "Safety Officer",
    "title_i18n": { "en": "Safety Officer", "hi": "सुरक्षा अधिकारी" },
    "description": "Statutory safety officer under CMR 2017 Regulation 41",
    "statutory": true,
    "statutory_basis": [{ "instrument": "CMR_2017", "provision": "Reg. 41", "authority_code": "DGMS" }],
    "default_holder_policy": "MULTI_HOLDER",
    "applicable_scope_types": ["mine", "mine_subunit"],
    "eligibility": {
      "required_qualifications": [{ "code": "DGMS_SECOND_CLASS_MANAGER_CERT", "mandatory": true }],
      "minimum_experience": "P5Y",
      "required_medical_clearance": true
    },
    "vacancy_policy": { "max_vacant_duration": "P7D", "on_vacancy": "RAISE_UNMANNED_RESPONSIBILITY" },
    "capability_policy_count": 0,
    "instantiated_post_count": 0,
    "created_at": "2026-08-30T09:10:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T09:10:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/position-templates/ptpl_01HZY2B3C4D5E6F7G8H9J0K1T0", "posts": "/api/v1/posts?filter[position_template_id]=ptpl_01HZY2B3C4D5E6F7G8H9J0K1T0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:10:00Z" }
}
```

Capability policy assignment is a separate governed action — creating a template confers nothing until `POST /position-capability-policies` runs.

---

## POST /position-capability-policies

**Auth:** `post.capability_policy.configure` on the owning organisation. This is the highest-privilege write in the identity domain: it decides what an entire class of position may do.

### Request

```json
{
  "position_template_id": "ptpl_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "grants": [
    { "capability_code": "finding.raise", "resource_relation": "SCOPED_RESOURCE", "conditions": {} },
    { "capability_code": "finding.close_minor", "resource_relation": "SCOPED_RESOURCE", "conditions": { "max_severity": "MINOR", "requires_evidence": true } },
    { "capability_code": "capa.assign", "resource_relation": "SCOPED_RESOURCE_AND_DESCENDANTS", "conditions": {} },
    { "capability_code": "evidence.verify", "resource_relation": "SCOPED_RESOURCE", "conditions": { "separation_of_duties": "NOT_SUBMITTER" } }
  ],
  "conditions_schema_version": 3,
  "valid_from": "2026-09-01T00:00:00Z",
  "valid_until": null,
  "approval_reference": "GOV-2026-88",
  "extensions": {}
}
```

`resource_relation` says **where** the capability applies relative to the post's scope, so one policy row covers a mine and everything under it without enumerating assets.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Capability policy attached",
  "data": {
    "id": "pcp_01HZY3C4D5E6F7G8H9J0K1T2M0",
    "object": "position_capability_policy",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PENDING",
    "available_actions": ["ACTIVATE", "SUPERSEDE"],
    "position_template": { "type": "position_template", "id": "ptpl_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "Safety Officer" },
    "grants": [
      { "capability_code": "finding.raise", "capability_id": "cap_01HZY4D5E6F7G8H9J0K1T2M3N0", "risk_class": "STANDARD", "required_assurance": "PASSWORD", "resource_relation": "SCOPED_RESOURCE", "conditions": {} },
      { "capability_code": "finding.close_minor", "capability_id": "cap_01HZY5E6F7G8H9J0K1T2M3N400", "risk_class": "ELEVATED", "required_assurance": "PASSWORD", "resource_relation": "SCOPED_RESOURCE", "conditions": { "max_severity": "MINOR", "requires_evidence": true } },
      { "capability_code": "capa.assign", "capability_id": "cap_01HZY6F7G8H9J0K1T2M3N405P0", "risk_class": "STANDARD", "required_assurance": "PASSWORD", "resource_relation": "SCOPED_RESOURCE_AND_DESCENDANTS", "conditions": {} },
      { "capability_code": "evidence.verify", "capability_id": "cap_01HZY7G8H9J0K1T2M3N405P6Q0", "risk_class": "ELEVATED", "required_assurance": "PASSWORD", "resource_relation": "SCOPED_RESOURCE", "conditions": { "separation_of_duties": "NOT_SUBMITTER" } }
    ],
    "conditions_schema_version": 3,
    "valid_from": "2026-09-01T00:00:00Z",
    "valid_until": null,
    "approval_reference": "GOV-2026-88",
    "affected_post_count": 322,
    "affected_appointment_count": 401,
    "created_at": "2026-08-30T09:15:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T09:15:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/position-capability-policies/pcp_01HZY3C4D5E6F7G8H9J0K1T2M0" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T09:15:00Z",
    "effects": [ { "object": "approval_request", "id": "apr_01HZY8H9J0K1T2M3N405P6Q7R0", "change": "CREATED", "note": "Capability policy requires second-party approval before ACTIVATE" } ]
  }
}
```

A policy is created `PENDING` and confers nothing until `ACTIVATE`, which requires a distinct approver. `affected_post_count` and `affected_appointment_count` are returned before activation so the approver can see the blast radius.

Actions: `ACTIVATE` (reason required, distinct approver enforced), `SUPERSEDE` (creates the next version), `REVOKE` (reason required, immediately invalidates derived tuples).

---

## POST /posts

**Auth:** `post.configure` on the organisation unit **and** on the scoped resource.

### Request

```json
{
  "organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0",
  "organization_unit_id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0",
  "position_template_id": "ptpl_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "holder_policy": "MULTI_HOLDER",
  "scope": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
  "title_override": "Safety Officer — Night Shift",
  "required": true,
  "reports_to_post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0",
  "extensions": {}
}
```

More than one post may use the same template and scope — a mine legitimately has three safety officers on different shifts, and there is no unique `(template, scope)` constraint to fight.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Post created",
  "data": {
    "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0",
    "object": "post",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "VACANT",
    "available_actions": ["RETIRE"],
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "organization_unit": { "type": "organization_unit", "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0", "display": "Korba Area" },
    "position_template": { "type": "position_template", "id": "ptpl_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "Safety Officer" },
    "position_template_code": "MINE_SAFETY_OFFICER",
    "statutory": true,
    "holder_policy": "MULTI_HOLDER",
    "scope": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "title": "Safety Officer — Night Shift",
    "title_override": "Safety Officer — Night Shift",
    "required": true,
    "reports_to_post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
    "current_holder_count": 0,
    "vacant": true,
    "vacant_since": "2026-08-30T09:20:00Z",
    "vacancy_breach": false,
    "created_at": "2026-08-30T09:20:00Z",
    "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "updated_at": "2026-08-30T09:20:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/posts/post_01HZY5D6E7F8G9H0J1K2T3M4N0", "appointments": "/api/v1/appointments?filter[post_id]=post_01HZY5D6E7F8G9H0J1K2T3M4N0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:20:00Z" }
}
```

Required mine posts may instead be instantiated atomically by mine onboarding and returned in that response — see [`mines.md`](mines.md).

---

## GET /posts · GET /posts/{id}

**Auth:** results clipped to posts readable through organisation/resource governance or a self appointment.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[organization_id]` · `filter[organization_unit_id]` | | Add `filter[unit_recursive]=true` for the subtree |
| `filter[position_template_id]` · `filter[position_template_code]` | `MINE_SAFETY_OFFICER` | |
| `filter[scope.type]` + `filter[scope.id]` | `mine` / `mine_01H…` | |
| `filter[holder_policy]` | `SINGLE_HOLDER` | |
| `filter[state]` | `FILLED,VACANT,RETIRED` | |
| `filter[vacant]` | `true` | Vacancy sweep |
| `filter[vacancy_breach]` | `true` | Vacant beyond the template's `max_vacant_duration` — the statutory-gap report |
| `filter[statutory]` | `true` | |
| `filter[person_id]` | `per_01H…` | Posts this person currently holds |
| `as_of` | `2026-06-30T23:59:59Z` | Vacancy and holders evaluated then |
| `expand` | `current_holders,position_template,reports_to_post` | |

### Response — 200 OK, `?expand=current_holders`

```json
{
  "success": true,
  "data": [
    {
      "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0",
      "object": "post",
      "version": 3,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "FILLED",
      "position_template_code": "MINE_SAFETY_OFFICER",
      "statutory": true,
      "holder_policy": "MULTI_HOLDER",
      "scope": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "title": "Safety Officer — Night Shift",
      "required": true,
      "current_holder_count": 2,
      "vacant": false,
      "vacant_since": null,
      "vacancy_breach": false,
      "current_holders": [
        { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" }, "mode": "REGULAR", "valid_from": "2026-04-01T00:00:00Z", "valid_until": "2029-04-01T00:00:00Z", "derived_state": "ACTIVE" },
        { "appointment_id": "app_01HZY3B4C5D6E7F8G9H0J1K2T0", "person": { "type": "person", "id": "per_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "M. Toppo" }, "mode": "ACTING", "valid_from": "2026-08-01T00:00:00Z", "valid_until": "2026-10-31T00:00:00Z", "derived_state": "ACTIVE" }
      ],
      "links": { "self": "/api/v1/posts/post_01HZY5D6E7F8G9H0J1K2T3M4N0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:25:00Z", "as_of": null }
}
```

`current_holders` returns zero, one, or several appointments according to holder policy. It does **not** silently resolve an escalation target — that is [`responsibility-routes.md`](responsibility-routes.md), and it is a different question with a different answer.

### Vacancy sweep — `?filter[vacancy_breach]=true&filter[statutory]=true`

```json
{
  "success": true,
  "data": [
    {
      "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0",
      "object": "post",
      "state": "VACANT",
      "position_template_code": "MINE_MANAGER",
      "statutory": true,
      "scope": { "type": "mine", "id": "mine_01HZYB1C2D3E4F5G6H7J8K9T00", "display": "Dipka OCP" },
      "vacant": true,
      "vacant_since": "2026-08-11T00:00:00Z",
      "vacancy_breach": true,
      "vacancy_breach_days": 19,
      "max_vacant_duration": "P7D",
      "links": { "self": "/api/v1/posts/post_01HZY4C5D6E7F8G9H0J1K2T3M0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:26:00Z" }
}
```

One filter combination replaces what would otherwise be a bespoke "unmanned statutory posts" report endpoint.

---

## POST /posts/{id}/actions

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `RETIRE` | `post.configure` | **required** | required | no active appointments, no unresolved responsibilities | `state = RETIRED`; refuses with `422` and `details.blocking_references` otherwise |
| `REINSTATE` | `post.configure` | **required** | required | `RETIRED` | `state = VACANT` |
| `CHANGE_HOLDER_POLICY` | `post.configure` | **required** | required | `SINGLE_HOLDER` → `MULTI_HOLDER` freely; the reverse only with ≤1 active appointment | Rewrites the overlap constraint |
| `REASSIGN_UNIT` | `post.configure` on both units | **required** | required | any | Moves administrative ownership; scope is unchanged |

### Request — RETIRE

```json
{
  "action": "RETIRE",
  "expected_version": 3,
  "reason": "Night shift discontinued from 1 October 2026 per office order SECL/2026/OO/301",
  "effective_at": "2026-10-01T00:00:00Z",
  "payload": { "source_instrument_document_id": "doc_01HZYC2D3E4F5G6H7J8K9T0M10", "transfer_responsibilities_to_post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0" }
}
```

### Response — 422 Blocked

```json
{
  "success": false,
  "message": "Statutory post with active appointments and unresolved responsibilities cannot be retired",
  "error": {
    "code": "UNPROCESSABLE",
    "details": {
      "blocking_references": [
        { "type": "appointment", "id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "display": "R. Kumar, valid to 2029-04-01", "reason": "ACTIVE_APPOINTMENT" },
        { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Berm reinstatement, due 2026-09-13", "reason": "OPEN_RESPONSIBILITY" },
        { "type": "responsibility_route", "id": "rrt_01HZYD3E4F5G6H7J8K9T0M1N20", "display": "capa.assign route step 1", "reason": "ROUTE_TARGET" }
      ],
      "resolution": "Revoke or supersede the appointments, reassign the open responsibilities, and update the routes that target this post"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Post retired",
  "data": { "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "object": "post", "version": 4, "state": "RETIRED", "retired_at": "2026-10-01T00:00:00Z", "available_actions": ["REINSTATE"] },
  "meta": {
    "action": "RETIRE",
    "transition": { "from": "VACANT", "to": "RETIRED" },
    "effects": [
      { "object": "responsibility_route", "count": 1, "change": "VERSIONED", "note": "Route steps repointed to the transfer target" },
      { "object": "outbox_event", "count": 2, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ7Q8R9S0T1V2V3W4X5Y6Z0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-10-01T00:00:00Z"
  }
}
```

---

## Invariants

- A post confers capabilities only through an **active** `position_capability_policy` on its template, and only while an appointment is current.
- A capability policy is created `PENDING` and needs a distinct approver to `ACTIVATE`; self-approval is refused with `422 UNPROCESSABLE`.
- Multi-holder posts are first class. No endpoint resolves a post to a single person implicitly.
- Vacancy is derived, not stored, and `vacancy_breach` is computed against the template's `max_vacant_duration`.
- Retiring a post never orphans an open responsibility or a routing target; the action refuses and names what blocks it.

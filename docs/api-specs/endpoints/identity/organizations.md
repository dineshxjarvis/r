# Identity — tenants, organisations, organisation units, and asset responsibility

An operator is an **organisation**; a tenant is a separate **isolation boundary**. CIL may be one tenant with SECL and its areas as units; another tenant may use a completely different shape. Nothing in this contract forces `operator → subsidiary → area`.

Tables: `tenant`, `organization`, `organization_unit`, `asset_responsibility`, `regulatory_authority`, `authority_unit` (`foundation-data-model.md`). Conventions: [`../../README.md`](../../README.md).

## Routes

| Route | Purpose |
|---|---|
| `GET /tenants` · `POST /tenants` · `GET /tenants/{id}` · `PATCH /tenants/{id}` · `POST /tenants/{id}/actions` | Isolation boundary |
| `GET /organizations` · `POST /organizations` · `GET /organizations/{id}` · `PATCH /organizations/{id}` · `POST /organizations/{id}/actions` | Legal/administrative bodies, **including contractors and regulators** |
| `GET /organization-units` · `POST /organization-units` · `GET /organization-units/{id}` · `PATCH /organization-units/{id}` · `POST /organization-units/{id}/actions` | Recursive hierarchy |
| `GET /asset-responsibilities` · `POST /asset-responsibilities` · `POST /asset-responsibilities/{id}/actions` | Unit-to-physical-asset link |
| `GET /regulatory-authorities` · `POST /regulatory-authorities` · `GET /regulatory-authorities/{id}` · `POST /regulatory-authorities/{id}/actions` | DGMS, MoEFCC, CPCB/SPCB, DMG |
| `GET /authority-units` · `POST /authority-units` · `POST /authority-units/{id}/actions` | Headquarters/zone/region/state office |

`POST /organizations/{id}/units` does not exist — it is `POST /organization-units` with `organization_id` in the body. `POST /contractor-organizations` does not exist — a contractor is `POST /organizations` with `kind_code: "CONTRACTOR"`, and the contractor register is `GET /organizations?filter[kind_code]=CONTRACTOR`. One organisation table, one route set, no parallel hierarchy to keep in sync.

---

## POST /tenants

**Auth:** `tenant.create` on platform. Normally bootstrap/governance only. `Idempotency-Key` required.

### Request

```json
{
  "code": "CIL",
  "name": "Coal India Limited",
  "name_i18n": { "en": "Coal India Limited", "hi": "कोल इंडिया लिमिटेड" },
  "data_region": "IN",
  "default_locale": "en-IN",
  "default_timezone": "Asia/Kolkata",
  "retention_policy_code": "STATUTORY_IN_30Y",
  "contact": { "primary_email": "compliance@coalindia.in", "phone": "+91-33-2324-8000", "postal_address": "Coal Bhawan, Premises No. 04-MAR, Plot No. AF-III, Rajarhat, Kolkata 700156" },
  "extensions": {}
}
```

`data_region` pins where this tenant's rows and blobs may physically reside; it is immutable after creation because moving it is a migration, not an update.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Tenant created",
  "data": {
    "id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "object": "tenant",
    "version": 1,
    "state": "ACTIVE",
    "available_actions": ["SUSPEND", "ARCHIVE"],
    "code": "CIL",
    "name": "Coal India Limited",
    "name_i18n": { "en": "Coal India Limited", "hi": "कोल इंडिया लिमिटेड" },
    "data_region": "IN",
    "default_locale": "en-IN",
    "default_timezone": "Asia/Kolkata",
    "retention_policy_code": "STATUTORY_IN_30Y",
    "contact": { "primary_email": "compliance@coalindia.in", "phone": "+91-33-2324-8000", "postal_address": "Coal Bhawan, Premises No. 04-MAR, Plot No. AF-III, Rajarhat, Kolkata 700156" },
    "counts": { "organizations": 0, "mines": 0, "active_principals": 0 },
    "created_at": "2026-08-30T08:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T08:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/tenants/ten_01HZX1A2B3C4D5E6F7G8H9J0K0", "history": "/api/v1/tenants/ten_01HZX1A2B3C4D5E6F7G8H9J0K0/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T08:00:00Z" }
}
```

Code conflict returns `409 CONFLICT` with `details.existing`. A replay with the same `Idempotency-Key` returns the original `201` body plus `Idempotency-Replayed: true`.

---

## GET /tenants · GET /tenants/{id}

**Auth:** `tenant.read` on the tenant, or a portfolio assignment covering it. Results are clipped to that set; filters only narrow it. Cross-tenant portfolio queries record requested versus effective scope in `warnings` and in the access log.

Filters: `code`, `state`, `data_region`, `q`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "object": "tenant",
      "version": 4,
      "state": "ACTIVE",
      "code": "CIL",
      "name": "Coal India Limited",
      "data_region": "IN",
      "counts": { "organizations": 9, "mines": 322, "active_principals": 41208 },
      "links": { "self": "/api/v1/tenants/ten_01HZX1A2B3C4D5E6F7G8H9J0K0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "warnings": [
    { "code": "PARTIAL_SCOPE", "message": "Portfolio covers 1 of 3 requested tenants", "details": { "requested_scope": ["ten_01HZX1A2B3C4D5E6F7G8H9J0K0", "ten_01HZX2B3C4D5E6F7G8H9J0K1T0", "ten_01HZX3C4D5E6F7G8H9J0K1T2M0"], "effective_scope": ["ten_01HZX1A2B3C4D5E6F7G8H9J0K0"] } }
  ],
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T08:05:00Z" }
}
```

---

## POST /tenants/{id}/actions

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `SUSPEND` | `tenant.manage` on platform | **required** | required | `ACTIVE` | Blocks all non-read traffic for the tenant; sessions stay but writes return `403`; `security_event` |
| `RESUME` | `tenant.manage` | **required** | required | `SUSPENDED` | Restores writes |
| `ARCHIVE` | `tenant.manage` | **required** | required | `SUSPENDED` | Terminal; freezes data under the retention policy, revokes all principals |

### Request

```json
{ "action": "SUSPEND", "expected_version": 4, "reason": "Contract lapsed pending renewal — approved by governance minute GOV-2026-77", "payload": { "notify_tenant_administrators": true } }
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Tenant suspended",
  "data": { "id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0", "object": "tenant", "version": 5, "state": "SUSPENDED", "available_actions": ["RESUME", "ARCHIVE"] },
  "meta": {
    "action": "SUSPEND",
    "transition": { "from": "ACTIVE", "to": "SUSPENDED" },
    "effects": [
      { "object": "security_event", "id": "sec_01HZZ1K2T3M4N506P7Q8R9S0T0", "change": "CREATED" },
      { "object": "notification", "count": 6, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T08:10:00Z"
  }
}
```

---

## POST /organizations

**Auth:** `organization.create` on platform for platform bodies, or on `tenant_id` for tenant organisations. `Idempotency-Key` required.

### Request — operating company

```json
{
  "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
  "kind_code": "OPERATING_COMPANY",
  "code": "SECL",
  "legal_name": "South Eastern Coalfields Limited",
  "legal_name_i18n": { "en": "South Eastern Coalfields Limited", "hi": "साउथ ईस्टर्न कोलफील्ड्स लिमिटेड" },
  "parent_organization_id": "org_01HZX7G8H9J0K1T2M3N405P6Q0",
  "registrations": [
    { "system": "CIN", "value": "U10102CT1985GOI003161" },
    { "system": "GSTIN", "value": "22AABCS7362A1Z5" },
    { "system": "PAN", "value": "AABCS7362A" }
  ],
  "registered_address": { "line1": "Seepat Road", "city": "Bilaspur", "state_code": "IN-CG", "postal_code": "495006", "country_code": "IN" },
  "contact": { "primary_email": "cs@secl.gov.in", "phone": "+91-7752-246000" },
  "extensions": {}
}
```

### Request — contractor

```json
{
  "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
  "kind_code": "CONTRACTOR",
  "code": "ACME",
  "legal_name": "Acme Mining Services Pvt Ltd",
  "parent_organization_id": null,
  "registrations": [
    { "system": "CIN", "value": "U14100MH2009PTC188720" },
    { "system": "GSTIN", "value": "27AACCA1234K1Z9" },
    { "system": "PF_ESTABLISHMENT", "value": "MH/BAN/0044718" },
    { "system": "CONTRACT_LABOUR_LICENCE", "value": "CLL/CG/2026/0912" }
  ],
  "registered_address": { "line1": "Plot 14, MIDC Chinchwad", "city": "Pune", "state_code": "IN-MH", "postal_code": "411019", "country_code": "IN" },
  "contact": { "primary_email": "ops@acmemining.in", "phone": "+91-20-2745-1100" },
  "extensions": {}
}
```

### Request — regulator (platform body)

```json
{
  "tenant_id": null,
  "kind_code": "REGULATORY_AUTHORITY",
  "code": "DGMS",
  "legal_name": "Directorate General of Mines Safety",
  "parent_organization_id": "org_01HZX8H9J0K1T2M3N405P6Q7R0",
  "registrations": [],
  "registered_address": { "line1": "Hirapur", "city": "Dhanbad", "state_code": "IN-JH", "postal_code": "826001", "country_code": "IN" },
  "contact": { "primary_email": "dgms@nic.in", "phone": "+91-326-2221001" },
  "extensions": {}
}
```

`tenant_id` is nullable **only** for platform bodies such as the Ministry and regulatory authorities. A tenant organisation with `tenant_id: null` is refused with `422 UNPROCESSABLE`.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Organisation created",
  "data": {
    "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0",
    "object": "organization",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["SUSPEND", "DEACTIVATE"],
    "kind_code": "OPERATING_COMPANY",
    "code": "SECL",
    "legal_name": "South Eastern Coalfields Limited",
    "legal_name_i18n": { "en": "South Eastern Coalfields Limited", "hi": "साउथ ईस्टर्न कोलफील्ड्स लिमिटेड" },
    "parent_organization": { "type": "organization", "id": "org_01HZX7G8H9J0K1T2M3N405P6Q0", "display": "Coal India Limited" },
    "registrations": [
      { "system": "CIN", "value": "U10102CT1985GOI003161" },
      { "system": "GSTIN", "value": "22AABCS7362A1Z5" },
      { "system": "PAN", "value": "AABCS7362A" }
    ],
    "registered_address": { "line1": "Seepat Road", "city": "Bilaspur", "state_code": "IN-CG", "postal_code": "495006", "country_code": "IN" },
    "contact": { "primary_email": "cs@secl.gov.in", "phone": "+91-7752-246000" },
    "regulatory_authority_id": null,
    "counts": { "units": 0, "active_affiliations": 0, "responsible_mines": 0 },
    "created_at": "2026-08-30T08:15:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T08:15:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/organizations/org_01HZX2B3C4D5E6F7G8H9J0K1T0", "units": "/api/v1/organization-units?filter[organization_id]=org_01HZX2B3C4D5E6F7G8H9J0K1T0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T08:15:00Z" }
}
```

---

## GET /organizations · GET /organizations/{id}

**Auth:** `organization.read` on the organisation, inherited governed visibility, or portfolio/jurisdiction policy. The response carries legal identity and unit counts, never the full membership roster — that needs `identity.person.read` through `GET /people?filter[organization_id]=…`.

Filters: `tenant_id`, `kind_code`, `parent_organization_id`, `state`, `q`, `filter[registrations.system]` + `filter[registrations.value]`, `filter[ancestor_organization_id]` (whole subtree in one query).
Expansions: `expand=parent_organization,units,regulatory_authority`.

### Response — 200 OK (list, contractor register)

```json
{
  "success": true,
  "data": [
    {
      "id": "org_01HZX5E6F7G8H9J0K1T2M3N400",
      "object": "organization",
      "version": 3,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "ACTIVE",
      "kind_code": "CONTRACTOR",
      "code": "ACME",
      "legal_name": "Acme Mining Services Pvt Ltd",
      "registrations": [{ "system": "CIN", "value": "U14100MH2009PTC188720" }, { "system": "CONTRACT_LABOUR_LICENCE", "value": "CLL/CG/2026/0912" }],
      "counts": { "units": 2, "active_affiliations": 418, "responsible_mines": 0 },
      "links": { "self": "/api/v1/organizations/org_01HZX5E6F7G8H9J0K1T2M3N400" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 37, "total_pages": 2, "has_next": true, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T08:20:00Z" }
}
```

---

## POST /organization-units

**Auth:** `organization.unit.configure` on the organisation or on `parent_unit_id`.

### Request

```json
{
  "organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0",
  "parent_unit_id": "unit_01HZX3C4D5E6F7G8H9J0K1T2M0",
  "unit_kind_code": "AREA",
  "code": "KORBA",
  "name": "Korba Area",
  "name_i18n": { "en": "Korba Area", "hi": "कोरबा क्षेत्र" },
  "valid_from": "2026-04-01T00:00:00Z",
  "valid_until": null,
  "contact": { "primary_email": "gm.korba@secl.gov.in", "phone": "+91-7759-222100" },
  "extensions": {}
}
```

Parent must belong to the same organisation. A cycle attempt returns `422 UNPROCESSABLE` with `details.cycle_path`.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Organisation unit created",
  "data": {
    "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0",
    "object": "organization_unit",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["MOVE", "CLOSE"],
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "parent_unit": { "type": "organization_unit", "id": "unit_01HZX3C4D5E6F7G8H9J0K1T2M0", "display": "SECL Headquarters" },
    "unit_kind_code": "AREA",
    "code": "KORBA",
    "name": "Korba Area",
    "name_i18n": { "en": "Korba Area", "hi": "कोरबा क्षेत्र" },
    "path": ["unit_01HZX3C4D5E6F7G8H9J0K1T2M0", "unit_01HZX4D5E6F7G8H9J0K1T2M3N0"],
    "depth": 2,
    "child_count": 0,
    "valid_from": "2026-04-01T00:00:00Z",
    "valid_until": null,
    "contact": { "primary_email": "gm.korba@secl.gov.in", "phone": "+91-7759-222100" },
    "counts": { "posts": 0, "responsible_mines": 0, "active_affiliations": 0 },
    "created_at": "2026-08-30T08:25:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T08:25:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/organization-units/unit_01HZX4D5E6F7G8H9J0K1T2M3N0", "children": "/api/v1/organization-units?filter[parent_unit_id]=unit_01HZX4D5E6F7G8H9J0K1T2M3N0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T08:25:00Z" }
}
```

`path` and `depth` are materialised so a client can render a tree from one flat list without recursive fetching. `GET /organization-units?filter[ancestor_unit_id]=unit_01H…` returns the whole subtree in one page-able call.

---

## POST /organization-units/{id}/actions

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `MOVE` | `organization.unit.configure` on both old and new parent | **required** | required | Re-parents; recomputes `path`/`depth` for the whole subtree; rejects cycles; `audit_event` per moved node |
| `CLOSE` | `organization.unit.configure` | **required** | required | Sets `valid_until`; refuses while active posts, appointments, or asset responsibilities remain, listing them in `details.blocking_references` |
| `REOPEN` | `organization.unit.configure` | **required** | required | Clears `valid_until` |

### Request — MOVE

```json
{
  "action": "MOVE",
  "expected_version": 1,
  "reason": "Korba Area transferred to newly formed Central Zone per office order SECL/2026/OO/214",
  "effective_at": "2026-10-01T00:00:00Z",
  "payload": { "new_parent_unit_id": "unit_01HZX9J0K1T2M3N405P6Q7R8S0", "source_instrument_document_id": "doc_01HZY9K0T1M2N304P5Q6R7S8T0" }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Organisation unit moved",
  "data": {
    "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0",
    "object": "organization_unit",
    "version": 2,
    "parent_unit": { "type": "organization_unit", "id": "unit_01HZX9J0K1T2M3N405P6Q7R8S0", "display": "Central Zone" },
    "path": ["unit_01HZX3C4D5E6F7G8H9J0K1T2M0", "unit_01HZX9J0K1T2M3N405P6Q7R8S0", "unit_01HZX4D5E6F7G8H9J0K1T2M3N0"],
    "depth": 3
  },
  "meta": {
    "action": "MOVE",
    "transition": null,
    "effects": [
      { "object": "organization_unit", "count": 14, "change": "PATH_RECOMPUTED" },
      { "object": "outbox_event", "count": 14, "change": "CREATED", "note": "OpenFGA parent tuple rewrite" },
      { "object": "audit_event", "id": "aud_01HZZ2T3M4N506P7Q8R9S0T1V0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T08:30:00Z"
  }
}
```

---

## POST /asset-responsibilities

**Auth:** `organization.unit.configure` on the unit **and** `mine.configure` on the target. This is the join between the administrative hierarchy and the physical one; neither side owns it alone.

### Request

```json
{
  "organization_unit_id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0",
  "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
  "responsibility_kind": "OPERATES",
  "valid_from": "2026-04-01T00:00:00Z",
  "valid_until": null,
  "source_instrument_document_id": "doc_01HZYA0B1C2D3E4F5G6H7J8K90",
  "extensions": {}
}
```

`target` is a reference object because the same table links units to mines **and** to individual assets; exactly one target is set and the server validates tenant consistency. Cross-tenant responsibility requires an explicit platform policy and returns `403 FORBIDDEN` without it.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Asset responsibility created",
  "data": {
    "id": "aresp_01HZX6F7G8H9J0K1T2M3N405P0",
    "object": "asset_responsibility",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["REVOKE", "SUPERSEDE"],
    "organization_unit": { "type": "organization_unit", "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0", "display": "Korba Area" },
    "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "responsibility_kind": "OPERATES",
    "valid_from": "2026-04-01T00:00:00Z",
    "valid_until": null,
    "revoked_at": null,
    "source_instrument": { "type": "document", "id": "doc_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "Area allocation order SECL/2026/AA/09" },
    "created_at": "2026-08-30T08:35:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T08:35:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/asset-responsibilities/aresp_01HZX6F7G8H9J0K1T2M3N405P0" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T08:35:00Z",
    "effects": [ { "object": "outbox_event", "count": 1, "change": "CREATED", "note": "OpenFGA mine→unit tuple" } ]
  }
}
```

Actions: `REVOKE` and `SUPERSEDE`, both reason-required and `expected_version`-required. Responsibility is never rewritten in place — a mine changing area must remain reconstructible for any past date.

---

## POST /regulatory-authorities · POST /authority-units

**Auth:** platform authority administration. Operators can never create or modify these; `403 FORBIDDEN` regardless of tenant administration rights.

### Request — regulatory authority

```json
{
  "organization_id": "org_01HZX9Z8Y7X6W5V4V3T2S1R0Q0",
  "code": "DGMS",
  "name": "Directorate General of Mines Safety",
  "name_i18n": { "en": "Directorate General of Mines Safety", "hi": "खान सुरक्षा महानिदेशालय" },
  "governing_statutes": ["MINES_ACT_1952", "MINES_RULES_1955", "CMR_2017", "MMR_1961"],
  "default_jurisdiction_selector_types": ["MINE_SET", "STATE", "GEOGRAPHY"],
  "active": true,
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Regulatory authority created",
  "data": {
    "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
    "object": "regulatory_authority",
    "version": 1,
    "tenant_id": null,
    "state": "ACTIVE",
    "available_actions": ["DEACTIVATE"],
    "organization": { "type": "organization", "id": "org_01HZX9Z8Y7X6W5V4V3T2S1R0Q0", "display": "Directorate General of Mines Safety" },
    "code": "DGMS",
    "name": "Directorate General of Mines Safety",
    "name_i18n": { "en": "Directorate General of Mines Safety", "hi": "खान सुरक्षा महानिदेशालय" },
    "governing_statutes": ["MINES_ACT_1952", "MINES_RULES_1955", "CMR_2017", "MMR_1961"],
    "default_jurisdiction_selector_types": ["MINE_SET", "STATE", "GEOGRAPHY"],
    "counts": { "units": 0, "mandates": 0, "active_appointments": 0 },
    "created_at": "2026-08-30T08:40:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T08:40:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/regulatory-authorities/auth_01HZXA1B2C3D4E5F6G7H8J9K00" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T08:40:00Z" }
}
```

### Request — authority unit

```json
{
  "regulatory_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
  "parent_unit_id": "aunit_01HZXB2C3D4E5F6G7H8J9K0T10",
  "unit_kind": "REGION",
  "code": "BSP",
  "name": "Bilaspur Region",
  "office_address": { "line1": "Ring Road No. 1", "city": "Bilaspur", "state_code": "IN-CG", "postal_code": "495001", "country_code": "IN" },
  "valid_from": "2020-04-01T00:00:00Z",
  "valid_until": null,
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Authority unit created",
  "data": {
    "id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20",
    "object": "authority_unit",
    "version": 1,
    "tenant_id": null,
    "state": "ACTIVE",
    "available_actions": ["CLOSE"],
    "regulatory_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
    "parent_unit": { "type": "authority_unit", "id": "aunit_01HZXB2C3D4E5F6G7H8J9K0T10", "display": "DGMS Headquarters" },
    "unit_kind": "REGION",
    "code": "BSP",
    "name": "Bilaspur Region",
    "path": ["aunit_01HZXB2C3D4E5F6G7H8J9K0T10", "aunit_01HZXC3D4E5F6G7H8J9K0T1M20"],
    "depth": 2,
    "office_address": { "line1": "Ring Road No. 1", "city": "Bilaspur", "state_code": "IN-CG", "postal_code": "495001", "country_code": "IN" },
    "valid_from": "2020-04-01T00:00:00Z",
    "valid_until": null,
    "created_at": "2026-08-30T08:45:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T08:45:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": { "self": "/api/v1/authority-units/aunit_01HZXC3D4E5F6G7H8J9K0T1M20" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T08:45:00Z" }
}
```

An authority unit carries **no mine coverage of its own**. Coverage is always a `jurisdiction_assignment` on an appointment — see [`appointments.md`](appointments.md).

---

## Invariants

- A tenant is an isolation boundary, never an organisation kind. `kind_code` on `organization` carries the operator/contractor/regulator/ministry distinction.
- `organization_unit` is recursive and unconstrained in shape; no endpoint assumes three levels.
- `asset_responsibility` is the only link from administrative hierarchy to physical assets, and it is temporal.
- Regulatory authorities and their units are platform data with `tenant_id: null`; a tenant administrator can read them and can never write them.
- Every hierarchy change is a `MOVE`/`SUPERSEDE` action with a reason, never a silent `PATCH` of a parent pointer.

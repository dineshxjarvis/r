# Identity — mines, subunits, and assets

The physical hierarchy (`mine → subunit → asset`) is separate from the organisational one. Every endpoint derives `tenant_id` from the target and never from the request. Tables: `mine`, `mine_subunit`, `asset` (`foundation-data-model.md`, `data-model.md §1`). Conventions: [`../../README.md`](../../README.md).

## Routes

| Route | Purpose |
|---|---|
| `GET /mines` · `POST /mines` · `GET /mines/{id}` · `PATCH /mines/{id}` · `POST /mines/{id}/actions` · `GET /mines/{id}/history` | Mine onboarding and configuration |
| `GET /subunits` · `POST /subunits` · `GET /subunits/{id}` · `PATCH /subunits/{id}` · `POST /subunits/{id}/actions` | Pits, benches, panels, districts, seams |
| `GET /assets` · `POST /assets` · `GET /assets/{id}` · `PATCH /assets/{id}` · `POST /assets/{id}/actions` | Haul roads, fans, winders, plants, points |

`GET /mines/{id}/subunits` does not exist — it is `GET /subunits?filter[mine_id]=mine_01H…`, or `GET /mines/{id}?expand=subunits` when the caller wants both in one round trip. `GET /mines/{id}/assets` is `GET /assets?filter[mine_id]=mine_01H…`. Asset IDs never bypass the mine authorization decision regardless of which route reaches them.

---

## POST /mines

**Auth:** `mine.create` on `tenant_id`; if `operating_unit_id` is supplied, also `organization.unit.configure` on that unit. `Idempotency-Key` required — onboarding is transactional and expensive to repeat.

### Request

```json
{
  "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
  "operating_unit_id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0",
  "code": "GEVRA-OCP",
  "name": "Gevra Open Cast Project",
  "name_i18n": { "en": "Gevra Open Cast Project", "hi": "गेवरा खुली खदान परियोजना" },
  "mine_profile_code": "OPENCAST",
  "minerals": ["COAL"],
  "statutory_identifiers": [
    { "system": "DGMS_MINE_CODE", "value": "CG/BSP/OC/0117" },
    { "system": "MOEFCC_EC_FILE", "value": "J-11015/122/2008-IA.II(M)" },
    { "system": "IBM_REGISTRATION", "value": "IBM/1289/2011" }
  ],
  "location": { "type": "Point", "coordinates": [82.5921, 22.3721], "srid": 4326 },
  "lease_boundary": { "type": "Polygon", "coordinates": [[[82.560, 22.350], [82.630, 22.350], [82.630, 22.400], [82.560, 22.400], [82.560, 22.350]]], "srid": 4326 },
  "geofence": { "type": "Polygon", "coordinates": [[[82.565, 22.355], [82.625, 22.355], [82.625, 22.395], [82.565, 22.395], [82.565, 22.355]]], "srid": 4326 },
  "lease": {
    "lease_reference": "ML/CG/2011/0042",
    "granted_on": "2011-03-18",
    "valid_until": "2041-03-17",
    "lease_area": { "value": "3448.500", "unit": "HECTARE" }
  },
  "rated_capacity": { "value": "70000000.000", "unit": "TONNE_PER_YEAR" },
  "commissioned_on": "1981-04-01",
  "regulatory_coverage": [
    { "regulatory_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "authority_unit_id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20" },
    { "regulatory_authority_id": "auth_01HZXD4E5F6G7H8J9K0T1M2N30", "authority_unit_id": "aunit_01HZXE5F6G7H8J9K0T1M2N3040" }
  ],
  "operating_shift_pattern_code": "THREE_SHIFT_CONTINUOUS",
  "required_position_template_ids": [
    "ptpl_01HZY1A2B3C4D5E6F7G8H9J0K0",
    "ptpl_01HZY2B3C4D5E6F7G8H9J0K1T0",
    "ptpl_01HZY3C4D5E6F7G8H9J0K1T2M0"
  ],
  "extensions": {}
}
```

`regulatory_coverage` is a **declaration** of which authorities the mine expects to answer to. It is not an authority grant — a named officer still needs an appointment, mandate, and jurisdiction assignment before reading anything.

### Response — 201 Created

`Location: /api/v1/mines/mine_01HZY7A8B9C0D1E2F3G4H5J6K0`

```json
{
  "success": true,
  "message": "Mine created with 3 required posts",
  "data": {
    "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
    "object": "mine",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PRE_OPERATIONAL",
    "available_actions": ["COMMISSION", "ARCHIVE"],
    "code": "GEVRA-OCP",
    "name": "Gevra Open Cast Project",
    "name_i18n": { "en": "Gevra Open Cast Project", "hi": "गेवरा खुली खदान परियोजना" },
    "mine_profile_code": "OPENCAST",
    "minerals": ["COAL"],
    "statutory_identifiers": [
      { "system": "DGMS_MINE_CODE", "value": "CG/BSP/OC/0117" },
      { "system": "MOEFCC_EC_FILE", "value": "J-11015/122/2008-IA.II(M)" },
      { "system": "IBM_REGISTRATION", "value": "IBM/1289/2011" }
    ],
    "operating_unit": { "type": "organization_unit", "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0", "display": "Korba Area" },
    "location": { "type": "Point", "coordinates": [82.5921, 22.3721], "srid": 4326 },
    "lease_boundary": { "type": "Polygon", "coordinates": [[[82.560, 22.350], [82.630, 22.350], [82.630, 22.400], [82.560, 22.400], [82.560, 22.350]]], "srid": 4326 },
    "geofence": { "type": "Polygon", "coordinates": [[[82.565, 22.355], [82.625, 22.355], [82.625, 22.395], [82.565, 22.395], [82.565, 22.355]]], "srid": 4326 },
    "lease": { "lease_reference": "ML/CG/2011/0042", "granted_on": "2011-03-18", "valid_until": "2041-03-17", "lease_area": { "value": "3448.500", "unit": "HECTARE" } },
    "rated_capacity": { "value": "70000000.000", "unit": "TONNE_PER_YEAR" },
    "commissioned_on": "1981-04-01",
    "regulatory_coverage": [
      { "regulatory_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" }, "authority_unit": { "type": "authority_unit", "id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20", "display": "Bilaspur Region" } },
      { "regulatory_authority": { "type": "regulatory_authority", "id": "auth_01HZXD4E5F6G7H8J9K0T1M2N30", "display": "MoEFCC" }, "authority_unit": { "type": "authority_unit", "id": "aunit_01HZXE5F6G7H8J9K0T1M2N3040", "display": "Regional Office Nagpur" } }
    ],
    "operating_shift_pattern_code": "THREE_SHIFT_CONTINUOUS",
    "counts": { "subunits": 0, "assets": 0, "open_findings": 0, "overdue_capas": 0 },
    "projection": "INTERNAL",
    "redacted_fields": [],
    "created_at": "2026-08-30T08:50:00Z",
    "created_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "updated_at": "2026-08-30T08:50:00Z",
    "updated_by": { "type": "person", "id": "per_01HZX0A1B2C3D4E5F6G7H8J9K0", "display": "S. Devi" },
    "extensions": {},
    "links": {
      "self": "/api/v1/mines/mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
      "history": "/api/v1/mines/mine_01HZY7A8B9C0D1E2F3G4H5J6K0/history",
      "subunits": "/api/v1/subunits?filter[mine_id]=mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
      "assets": "/api/v1/assets?filter[mine_id]=mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
      "posts": "/api/v1/posts?filter[scope.type]=mine&filter[scope.id]=mine_01HZY7A8B9C0D1E2F3G4H5J6K0"
    }
  },
  "included": {
    "asset_responsibility:aresp_01HZX6F7G8H9J0K1T2M3N405P0": {
      "id": "aresp_01HZX6F7G8H9J0K1T2M3N405P0",
      "object": "asset_responsibility",
      "organization_unit": { "type": "organization_unit", "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0", "display": "Korba Area" },
      "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "responsibility_kind": "OPERATES",
      "valid_from": "2026-08-30T08:50:00Z"
    },
    "post:post_01HZY4C5D6E7F8G9H0J1K2T3M0": { "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "object": "post", "position_template_code": "MINE_MANAGER", "statutory": true, "holder_policy": "SINGLE_HOLDER", "state": "VACANT" },
    "post:post_01HZY5D6E7F8G9H0J1K2T3M4N0": { "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "object": "post", "position_template_code": "SAFETY_OFFICER", "statutory": true, "holder_policy": "MULTI_HOLDER", "state": "VACANT" },
    "post:post_01HZY6E7F8G9H0J1K2T3M4N500": { "id": "post_01HZY6E7F8G9H0J1K2T3M4N500", "object": "post", "position_template_code": "ENVIRONMENT_OFFICER", "statutory": false, "holder_policy": "SINGLE_HOLDER", "state": "VACANT" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T08:50:00Z",
    "effects": [
      { "object": "asset_responsibility", "id": "aresp_01HZX6F7G8H9J0K1T2M3N405P0", "change": "CREATED" },
      { "object": "post", "count": 3, "change": "CREATED" },
      { "object": "outbox_event", "count": 5, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ3M4N506P7Q8R9S0T1V2V0", "change": "CREATED" }
    ]
  }
}
```

Onboarding instantiates the required posts **transactionally** and returns all of them under `included`. It creates **no appointments** — a newly onboarded mine is legitimately unmanned until an appointing authority acts, and the API must not paper over that.

---

## GET /mines/{id}

**Auth:** `mine.read_internal` for internal state, or `mine.read_published` for the regulator/publication boundary. Regulator access additionally requires a mandate **and** a jurisdiction assignment covering this mine. The response projection follows the granted capability and is named in `projection`.

Query: `expand=subunits,assets,operating_unit,current_post_holders,compliance_summary`, `as_of`, `fields[mine]`.

### Response — 200 OK, `projection: "PUBLISHED"` (regulator read)

```json
{
  "success": true,
  "data": {
    "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
    "object": "mine",
    "version": 12,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "OPERATIONAL",
    "available_actions": [],
    "code": "GEVRA-OCP",
    "name": "Gevra Open Cast Project",
    "mine_profile_code": "OPENCAST",
    "minerals": ["COAL"],
    "statutory_identifiers": [{ "system": "DGMS_MINE_CODE", "value": "CG/BSP/OC/0117" }],
    "operating_unit": { "type": "organization_unit", "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0", "display": "Korba Area" },
    "location": { "type": "Point", "coordinates": [82.5921, 22.3721], "srid": 4326 },
    "lease_boundary": null,
    "geofence": null,
    "lease": { "lease_reference": "ML/CG/2011/0042", "granted_on": "2011-03-18", "valid_until": "2041-03-17", "lease_area": { "value": "3448.500", "unit": "HECTARE" } },
    "rated_capacity": { "value": "70000000.000", "unit": "TONNE_PER_YEAR" },
    "commissioned_on": "1981-04-01",
    "counts": { "subunits": 6, "assets": 214, "open_findings": 11, "overdue_capas": 2 },
    "projection": "PUBLISHED",
    "redacted_fields": ["lease_boundary", "geofence", "extensions"],
    "created_at": "2026-08-30T08:50:00Z",
    "updated_at": "2026-09-14T06:20:00Z",
    "links": { "self": "/api/v1/mines/mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-09-14T09:00:00Z",
    "as_of": null,
    "authority_basis": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00", "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10" }
  }
}
```

A regulator read is purpose-logged: it writes an `access_event` naming the resource, the mandate, and the jurisdiction relied on. `meta.authority_basis` returns that same triple so the officer can see, and later defend, which authority they read under.

---

## GET /mines

**Auth:** results clipped to resources covered by `mine.read_internal`, `mine.read_published`, or `portfolio.read`. Request filters only narrow the authorised set; they never enlarge it. Cross-tenant results record requested versus effective scope.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[tenant_id]` | `ten_01H…` | |
| `filter[organization_unit_id]` | `unit_01H…` | Via current `asset_responsibility`; add `filter[unit_recursive]=true` for the subtree |
| `filter[mine_profile_code]` | `OPENCAST,UNDERGROUND` | |
| `filter[state]` | `OPERATIONAL` | |
| `filter[minerals]` | `COAL` | Array-contains |
| `filter[statutory_identifiers.value]` | `CG/BSP/OC/0117` | Exact regulator lookup |
| `filter[regulatory_authority_id]` | `auth_01H…` | Mines declaring coverage by this authority |
| `filter[open_findings][gte]` | `1` | Derived counter, usable as a filter |
| `filter[geo.within]` | `{"type":"Polygon",…}` | GeoJSON, or `filter[geo.near]=82.59,22.37,50km` |
| `q` | `q=gevra` | Name, code, statutory identifiers |
| `as_of` | `2026-03-31T18:29:59Z` | Responsibility and coverage evaluated then |
| `view` | `view=my_portfolio` | Server-owned named projection |
| `group_by` + `metrics` | `group_by=organization_unit_id&metrics=count,sum(rated_capacity.value)` | |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
      "object": "mine",
      "version": 12,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "OPERATIONAL",
      "code": "GEVRA-OCP",
      "name": "Gevra Open Cast Project",
      "mine_profile_code": "OPENCAST",
      "operating_unit": { "type": "organization_unit", "id": "unit_01HZX4D5E6F7G8H9J0K1T2M3N0", "display": "Korba Area" },
      "location": { "type": "Point", "coordinates": [82.5921, 22.3721], "srid": 4326 },
      "counts": { "subunits": 6, "assets": 214, "open_findings": 11, "overdue_capas": 2 },
      "projection": "INTERNAL",
      "links": { "self": "/api/v1/mines/mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 322, "total_pages": 17, "has_next": true, "has_prev": false },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-09-14T09:05:00Z",
    "scope": { "requested": { "tenant_ids": ["ten_01HZX1A2B3C4D5E6F7G8H9J0K0"] }, "effective": { "mine_count": 322, "basis": "portfolio.read via jur_01HZYC2D3E4F5G6H7J8K9T0M10" } }
  }
}
```

---

## PATCH /mines/{id}

**Auth:** `mine.configure` on the mine. Requires `If-Match` or `expected_version`. `tenant_id`, `code`, and statutory identifiers are immutable through this route — changing a statutory identifier is a governed action, not an edit.

### Request

```json
{
  "expected_version": 12,
  "name": "Gevra Open Cast Expansion Project",
  "rated_capacity": { "value": "82500000.000", "unit": "TONNE_PER_YEAR" },
  "geofence": { "type": "Polygon", "coordinates": [[[82.560, 22.352], [82.628, 22.352], [82.628, 22.398], [82.560, 22.398], [82.560, 22.352]]], "srid": 4326 },
  "operating_shift_pattern_code": "THREE_SHIFT_CONTINUOUS",
  "extensions": { "cil.secl.legacy_ref": "SECL/KRB/GEV/001" }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Mine updated",
  "data": {
    "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
    "object": "mine",
    "version": 13,
    "name": "Gevra Open Cast Expansion Project",
    "rated_capacity": { "value": "82500000.000", "unit": "TONNE_PER_YEAR" },
    "geofence": { "type": "Polygon", "coordinates": [[[82.560, 22.352], [82.628, 22.352], [82.628, 22.398], [82.560, 22.398], [82.560, 22.352]]], "srid": 4326 },
    "extensions": { "cil.secl.legacy_ref": "SECL/KRB/GEV/001" },
    "updated_at": "2026-09-14T09:10:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" }
  },
  "meta": {
    "action": "PATCH",
    "effects": [
      { "object": "audit_event", "id": "aud_01HZZ4N506P7Q8R9S0T1V2V3W0", "change": "CREATED" },
      { "object": "outbox_event", "count": 1, "change": "CREATED", "note": "Geofence change republished to attendance and geospatial consumers" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T09:10:00Z"
  }
}
```

### Response — 409 Version conflict

```json
{
  "success": false,
  "message": "Mine was modified by another actor",
  "error": { "code": "VERSION_CONFLICT", "details": { "current_version": 14, "supplied_version": 12, "changed_fields": ["rated_capacity"] } },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## POST /mines/{id}/actions

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `COMMISSION` | `mine.configure` | **required** | required | `PRE_OPERATIONAL` | `state = OPERATIONAL`; refuses while a statutory post is vacant, listing them |
| `SUSPEND_OPERATIONS` | `mine.configure` | **required** | required | `OPERATIONAL` | `state = SUSPENDED`; obligations keep accruing |
| `RESUME_OPERATIONS` | `mine.configure` | **required** | required | `SUSPENDED` | `state = OPERATIONAL` |
| `ABANDON` | `mine.abandon` | **required** | required | `SUSPENDED` | `state = ABANDONED`; triggers closure-plan obligations |
| `TRANSFER_OPERATING_UNIT` | `mine.configure` + `organization.unit.configure` on both units | **required** | required | any | Supersedes `asset_responsibility`, rewrites derived tuples |
| `UPDATE_STATUTORY_IDENTIFIER` | `mine.configure_statutory` | **required** | required | any | Appends a new identifier version; never overwrites |

### Request — COMMISSION

```json
{
  "action": "COMMISSION",
  "expected_version": 1,
  "reason": "All statutory posts filled and DGMS permission received",
  "effective_at": "2026-09-01T00:00:00Z",
  "payload": { "permission_document_id": "doc_01HZYD3E4F5G6H7J8K9T0M1N20" },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Mine commissioned",
  "data": { "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "object": "mine", "version": 2, "state": "OPERATIONAL", "available_actions": ["SUSPEND_OPERATIONS", "TRANSFER_OPERATING_UNIT", "UPDATE_STATUTORY_IDENTIFIER"] },
  "meta": {
    "action": "COMMISSION",
    "transition": { "from": "PRE_OPERATIONAL", "to": "OPERATIONAL" },
    "effects": [
      { "object": "obligation_instance", "count": 41, "change": "MATERIALIZED", "note": "Recurring statutory obligations begin accruing" },
      { "object": "audit_event", "id": "aud_01HZZ506P7Q8R9S0T1V2V3W4X0", "change": "CREATED" },
      { "object": "outbox_event", "count": 3, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-01T00:00:00Z"
  }
}
```

### Response — 422 Blocked by vacancy

```json
{
  "success": false,
  "message": "Cannot commission a mine with vacant statutory posts",
  "error": {
    "code": "UNPROCESSABLE",
    "details": {
      "blocking_references": [
        { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP", "reason": "VACANT", "statutory": true }
      ]
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## POST /subunits

**Auth:** `mine.configure` on the mine. `tenant_id` is derived from the mine, never accepted from the client.

### Request

```json
{
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "parent_subunit_id": null,
  "kind_code": "PIT",
  "code": "PIT-1",
  "name": "Main Pit",
  "name_i18n": { "en": "Main Pit", "hi": "मुख्य गड्ढा" },
  "geometry": { "type": "Polygon", "coordinates": [[[82.580, 22.365], [82.605, 22.365], [82.605, 22.385], [82.580, 22.385], [82.580, 22.365]]], "srid": 4326 },
  "elevation_range_m": { "from": "180.0", "to": "310.0" },
  "operational_status": "ACTIVE",
  "extensions": {}
}
```

Subunits are recursive (`parent_subunit_id`) so a pit can contain benches and a district can contain panels without a new table or a new route.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Subunit created",
  "data": {
    "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0",
    "object": "mine_subunit",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["CLOSE", "MOVE"],
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "parent_subunit": null,
    "kind_code": "PIT",
    "code": "PIT-1",
    "name": "Main Pit",
    "name_i18n": { "en": "Main Pit", "hi": "मुख्य गड्ढा" },
    "path": ["sub_01HZY8B9C0D1E2F3G4H5J6K7T0"],
    "depth": 1,
    "geometry": { "type": "Polygon", "coordinates": [[[82.580, 22.365], [82.605, 22.365], [82.605, 22.385], [82.580, 22.385], [82.580, 22.365]]], "srid": 4326 },
    "elevation_range_m": { "from": "180.0", "to": "310.0" },
    "operational_status": "ACTIVE",
    "counts": { "children": 0, "assets": 0 },
    "created_at": "2026-08-30T09:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "updated_at": "2026-08-30T09:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/subunits/sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "assets": "/api/v1/assets?filter[subunit_id]=sub_01HZY8B9C0D1E2F3G4H5J6K7T0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:00:00Z" }
}
```

---

## GET /subunits · GET /subunits/{id}

**Auth:** resolved through the owning mine using the same internal/published projection policy. A subunit is never independently readable.

Filters: `mine_id`, `parent_subunit_id`, `ancestor_subunit_id`, `kind_code`, `operational_status`, `filter[geo.within]`, `as_of`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0",
      "object": "mine_subunit",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "ACTIVE",
      "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "kind_code": "PIT",
      "code": "PIT-1",
      "name": "Main Pit",
      "path": ["sub_01HZY8B9C0D1E2F3G4H5J6K7T0"],
      "depth": 1,
      "operational_status": "ACTIVE",
      "counts": { "children": 3, "assets": 41 },
      "links": { "self": "/api/v1/subunits/sub_01HZY8B9C0D1E2F3G4H5J6K7T0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 6, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:02:00Z" }
}
```

---

## POST /assets

**Auth:** `mine.configure` on the mine. If `subunit_id` is supplied it must belong to this mine, else `422 UNPROCESSABLE`.

### Request

```json
{
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "subunit_id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0",
  "asset_type_code": "HAUL_ROAD_SEGMENT",
  "code": "HR-12",
  "name": "North haul road segment",
  "name_i18n": { "en": "North haul road segment", "hi": "उत्तरी ढुलाई मार्ग खंड" },
  "location": { "type": "LineString", "coordinates": [[82.588, 22.372], [82.594, 22.379]], "srid": 4326 },
  "geofence_radius_m": 75,
  "criticality": "HIGH",
  "specifications": { "length_m": "820", "design_width_m": "24", "max_gradient_percent": "8", "berm_height_m": "1.5" },
  "identifiers": [{ "system": "SAP_EQUIPMENT", "value": "10004471" }],
  "commissioned_on": "2019-11-02",
  "responsible_post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0",
  "extensions": {}
}
```

`specifications` is an open, asset-type-scoped map validated against the JSON Schema at `GET /schemas/asset?asset_type_code=HAUL_ROAD_SEGMENT`. A new asset type ships as registry data — a fan, a winder, a stemming machine, a conveyor drive — with no API change.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Asset created",
  "data": {
    "id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0",
    "object": "asset",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "IN_SERVICE",
    "available_actions": ["TAKE_OUT_OF_SERVICE", "MOVE", "DECOMMISSION"],
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "subunit": { "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "display": "Main Pit" },
    "asset_type_code": "HAUL_ROAD_SEGMENT",
    "code": "HR-12",
    "name": "North haul road segment",
    "name_i18n": { "en": "North haul road segment", "hi": "उत्तरी ढुलाई मार्ग खंड" },
    "location": { "type": "LineString", "coordinates": [[82.588, 22.372], [82.594, 22.379]], "srid": 4326 },
    "geofence_radius_m": 75,
    "criticality": "HIGH",
    "specifications": { "length_m": "820", "design_width_m": "24", "max_gradient_percent": "8", "berm_height_m": "1.5" },
    "identifiers": [{ "system": "SAP_EQUIPMENT", "value": "10004471" }],
    "commissioned_on": "2019-11-02",
    "decommissioned_on": null,
    "responsible_post": { "type": "post", "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "display": "Safety Officer, Gevra OCP" },
    "counts": { "open_findings": 0, "open_defects": 0 },
    "created_at": "2026-08-30T09:05:00Z",
    "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "updated_at": "2026-08-30T09:05:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/assets/ast_01HZY9C0D1E2F3G4H5J6K7T8M0", "history": "/api/v1/assets/ast_01HZY9C0D1E2F3G4H5J6K7T8M0/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:05:00Z" }
}
```

---

## GET /assets · GET /assets/{id} · POST /assets/{id}/actions

**Auth:** `mine.read_internal` or `mine.read_published` on the owning mine, with projection-level redaction.

Filters: `mine_id`, `subunit_id`, `asset_type_code`, `criticality`, `state`, `responsible_post_id`, `filter[identifiers.value]`, `filter[geo.near]`, `filter[open_findings][gte]`, `q`, `as_of`.

Actions: `TAKE_OUT_OF_SERVICE`, `RETURN_TO_SERVICE`, `MOVE` (to another subunit), `DECOMMISSION`, `REASSIGN_RESPONSIBLE_POST` — each reason-required and `expected_version`-required, each writing an `audit_event`.

### Request — TAKE_OUT_OF_SERVICE

```json
{
  "action": "TAKE_OUT_OF_SERVICE",
  "expected_version": 1,
  "reason": "Berm reinstatement works; segment closed to haulage",
  "effective_at": "2026-09-15T06:00:00Z",
  "payload": { "expected_return_on": "2026-09-22", "related_finding_id": "find_01HZZ55F6G7H8J9K0T1M2N3040" }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Asset taken out of service",
  "data": {
    "id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0",
    "object": "asset",
    "version": 2,
    "state": "OUT_OF_SERVICE",
    "available_actions": ["RETURN_TO_SERVICE", "DECOMMISSION"]
  },
  "meta": {
    "action": "TAKE_OUT_OF_SERVICE",
    "transition": { "from": "IN_SERVICE", "to": "OUT_OF_SERVICE" },
    "effects": [
      { "object": "notification", "count": 2, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ6P7Q8R9S0T1V2V3W4X5Y0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-15T06:00:00Z"
  }
}
```

---

## Invariants

- `tenant_id` is always derived from the mine and never accepted from the client on subunits or assets.
- An asset ID never bypasses the owning mine's authorization decision.
- Statutory identifiers are append-only versions; the current one is the latest unrevoked entry.
- `specifications` is validated against a per-asset-type JSON Schema served from the registry, so new equipment classes need no contract change.
- Geofence and lease boundary are redacted from the published projection by default; regulator access to them requires an explicit capability, not merely a jurisdiction.

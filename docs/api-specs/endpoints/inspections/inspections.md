# Inspections — intake, planning, fieldwork, report, and closure

Domain rules: [`../../../features/inspections/inspection-spec.md`](../../../features/inspections/inspection-spec.md). Relational contract: [`../../../architecture/inspection-data-model.md`](../../../architecture/inspection-data-model.md). Conventions: [`../../README.md`](../../README.md).

An inspection is a **governed act with provenance**, not a form. Origin (`INTERNAL`, `REGULATORY`, `THIRD_PARTY`, `RECEIVED_NOTICE`) determines which authority fields are required, who may issue the report, and who may close it. A receiving operator can never issue or close a regulatory inspection, whatever tenant rights it holds.

## Routes

| Route | Purpose |
|---|---|
| `GET /inspections?view=type_versions` or `?view=current_types` | Frozen type catalogue and its currently effective projection |
| `GET /inspection-requests` · `POST /inspection-requests` · `GET /inspection-requests/{id}` · `POST /inspection-requests/{id}/actions` | Triageable demand, before an inspection exists |
| `GET /inspections` · `POST /inspections` · `GET /inspections/{id}` · `PATCH /inspections/{id}` · `POST /inspections/{id}/actions` · `GET /inspections/{id}/history` | The inspection itself |
| `GET /inspection-assignments` · `POST /inspection-assignments` · `POST /inspection-assignments/{id}/actions` | Versioned team composition |
| `GET /inspection-assignment-members` · `POST /inspection-assignment-members/{id}/actions` | Per-member acceptance |
| `GET /inspection-handovers` · `POST /inspection-handovers` | Midstream replacement |
| `GET /inspection-visits` · `POST /inspection-visits` · `GET /inspection-visits/{id}` · `POST /inspection-visits/{id}/actions` | Multi-visit fieldwork |
| `GET /inspection-responses` · `POST /inspection-responses` · `POST /inspection-responses/{id}/actions` | Checklist responses, offline-idempotent |
| `GET /inspection-reports` · `POST /inspection-reports` · `POST /inspection-reports/{id}/actions` | Prepare, review, issue, supersede |

`GET /inspection-types` and `/inspection-type-versions` are replaced by the `type_versions` and `current_types` views of `/inspections`. The current view returns one effective version per stable inspection-type identity; `type_versions` returns immutable history. Neither changes the inspection resource schema used by the default view.

Nine collections replace twenty verb routes. Observations are recorded through `action: "RECORD_OBSERVATION"` on a visit so inspection, visit, response, actor, and authority provenance are all derived server-side — `POST /observations` cannot manufacture regulatory provenance ([`../defects/observations.md`](../defects/observations.md)).

---

## POST /inspection-requests

**Auth:** `inspection.request` on the target, or an authenticated external intake policy. Creates **triageable demand**, not an inspection and not an authority grant.

### Request

```json
{
  "requested_origin": "REGULATORY",
  "requested_inspection_type_id": "itp_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "request_source": "RISK_TRIGGER",
  "targets": [{ "target_type": "MINE", "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }],
  "priority": "HIGH",
  "reason": "Three haul-road berm defects recurred within 60 days at the same chainage",
  "desired_window": { "from": "2026-09-05T00:00:00Z", "to": "2026-09-12T00:00:00Z" },
  "source_document_id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Inspection request created",
  "data": {
    "id": "ireq_01HZZ0A1B2C3D4E5F6G7H8J9K0",
    "object": "inspection_request",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PENDING_TRIAGE",
    "available_actions": ["TRIAGE"],
    "requested_origin": "REGULATORY",
    "requested_inspection_type": { "type": "inspection_type", "id": "itp_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "DGMS safety inspection" },
    "request_source": "RISK_TRIGGER",
    "requested_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "requested_by_principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
    "targets": [{ "target_type": "MINE", "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" } }],
    "priority": "HIGH",
    "reason": "Three haul-road berm defects recurred within 60 days at the same chainage",
    "desired_window": { "from": "2026-09-05T00:00:00Z", "to": "2026-09-12T00:00:00Z" },
    "source_document": { "type": "document", "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "display": "Recurrence report, August 2026" },
    "status": "PENDING_TRIAGE",
    "triage_decision": null,
    "triaged_by_appointment_id": null,
    "triaged_at": null,
    "created_inspection_id": null,
    "created_at": "2026-08-30T10:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "updated_at": "2026-08-30T10:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "extensions": {},
    "links": { "self": "/api/v1/inspection-requests/ireq_01HZZ0A1B2C3D4E5F6G7H8J9K0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T10:00:00Z", "effects": [ { "object": "notification", "count": 2, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

### POST /inspection-requests/{id}/actions — TRIAGE

**Auth:** `inspection.plan` on the applicable organisation or authority intake unit.

```json
{
  "action": "TRIAGE",
  "expected_version": 1,
  "reason": "Risk trigger validated against the recurrence record",
  "payload": {
    "decision": "ACCEPT",
    "inspection_type_version_id": "itv_01HZY2B3C4D5E6F7G8H9J0K1T0",
    "priority": "HIGH",
    "create_inspection": true,
    "scheduled_from": "2026-09-07T05:00:00Z",
    "scheduled_until": "2026-09-07T12:00:00Z"
  }
}
```

`decision` is `ACCEPT`, `REJECT`, or `DEFER`. `REJECT` and `DEFER` require `reason`; `DEFER` also requires `payload.defer_until`.

```json
{
  "success": true,
  "message": "Request accepted; draft inspection created",
  "data": {
    "id": "ireq_01HZZ0A1B2C3D4E5F6G7H8J9K0",
    "object": "inspection_request",
    "version": 2,
    "state": "ACCEPTED",
    "triage_decision": "ACCEPT",
    "triaged_by_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "triaged_at": "2026-08-30T10:30:00Z",
    "created_inspection_id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
    "available_actions": []
  },
  "included": {
    "inspection:insp_01HZZ1B2C3D4E5F6G7H8J9K0T0": { "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0", "object": "inspection", "version": 1, "state": "DRAFT", "origin": "REGULATORY", "title": "DGMS safety inspection — Gevra OCP", "scheduled_from": "2026-09-07T05:00:00Z", "scheduled_until": "2026-09-07T12:00:00Z" }
  },
  "meta": {
    "action": "TRIAGE",
    "transition": { "from": "PENDING_TRIAGE", "to": "ACCEPTED" },
    "effects": [ { "object": "inspection", "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0", "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T10:30:00Z"
  }
}
```

Accept may create a `DRAFT` inspection atomically. The request row survives either way — intake is preserved even when nothing was inspected.

---

## POST /inspections

**Auth:** origin-specific — `inspection.create_internal`, `inspection.create_regulatory`, `inspection.create_third_party`, or `inspection.register_received_notice` — on **every** target. `Idempotency-Key` required.

### Request — regulatory

```json
{
  "origin": "REGULATORY",
  "creation_mode": "SCHEDULED",
  "inspection_type_version_id": "itv_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "title": "DGMS safety inspection — Gevra OCP",
  "purpose_code": "ROUTINE_INSPECTION",
  "purpose_detail": "Half-yearly statutory inspection under Mines Act 1952 s. 22",
  "targets": [
    { "target_type": "MINE", "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "purpose": "PRIMARY" },
    { "target_type": "SUBUNIT", "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "subunit_id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "purpose": "FOCUS" }
  ],
  "scheduled_from": "2026-09-07T05:00:00Z",
  "scheduled_until": "2026-09-07T12:00:00Z",
  "issuing_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
  "issuing_authority_unit_id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20",
  "supporting_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
  "supporting_mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
  "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
  "source_instrument_document_id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
  "regulatory_case_id": null,
  "from_request_id": "ireq_01HZZ0A1B2C3D4E5F6G7H8J9K0",
  "extensions": {}
}
```

### Request — received notice

```json
{
  "origin": "RECEIVED_NOTICE",
  "creation_mode": "REGISTERED",
  "inspection_type_version_id": "itv_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "title": "DGMS inspection notice received 30 August 2026",
  "purpose_code": "ROUTINE_INSPECTION",
  "targets": [{ "target_type": "MINE", "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "purpose": "PRIMARY" }],
  "scheduled_from": "2026-09-07T05:00:00Z",
  "scheduled_until": "2026-09-07T12:00:00Z",
  "claimed_issuer": {
    "authority_name": "Directorate General of Mines Safety, Bilaspur Region",
    "authority_code_claimed": "DGMS",
    "officer_name_claimed": "A. Banerjee",
    "notice_reference": "DGMS/BSP/NOT/2026/0219",
    "notice_document_id": "doc_01HZZ2C3D4E5F6G7H8J9K0T1M0"
  },
  "extensions": {}
}
```

A received notice **begins unconfirmed**. `claimed_issuer` is stored separately from the confirmed authority fields, which stay `null` until `CONFIRM_AUTHORITY` succeeds. An operator registering a notice never gets to assert who issued it.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Inspection created",
  "data": {
    "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
    "object": "inspection",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "DRAFT",
    "available_actions": ["CANCEL"],
    "inspection_type_version": { "type": "inspection_type_version", "id": "itv_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "DGMS safety inspection v5" },
    "origin": "REGULATORY",
    "creation_mode": "SCHEDULED",
    "status": "DRAFT",
    "title": "DGMS safety inspection — Gevra OCP",
    "purpose_code": "ROUTINE_INSPECTION",
    "purpose_detail": "Half-yearly statutory inspection under Mines Act 1952 s. 22",
    "targets": [
      { "id": "itgt_01HZZ2C3D4E5F6G7H8J9K0T1M0", "target_type": "MINE", "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" }, "subunit": null, "asset": null, "purpose": "PRIMARY", "valid_from": "2026-09-07T05:00:00Z", "valid_until": "2026-09-07T12:00:00Z" },
      { "id": "itgt_01HZZ3D4E5F6G7H8J9K0T1M2N0", "target_type": "SUBUNIT", "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" }, "subunit": { "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "display": "Main Pit" }, "asset": null, "purpose": "FOCUS", "valid_from": "2026-09-07T05:00:00Z", "valid_until": "2026-09-07T12:00:00Z" }
    ],
    "scheduled_from": "2026-09-07T05:00:00Z",
    "scheduled_until": "2026-09-07T12:00:00Z",
    "started_at": null,
    "fieldwork_completed_at": null,
    "issued_at": null,
    "closed_at": null,
    "lead_assignment_member_id": null,
    "issuing_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
    "issuing_authority_unit": { "type": "authority_unit", "id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20", "display": "Bilaspur Region" },
    "supporting_mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
    "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
    "authority_confirmed": true,
    "claimed_issuer": null,
    "source_instrument": { "type": "document", "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "display": "Inspection programme DGMS/BSP/2026/H2" },
    "regulatory_case_id": null,
    "from_request_id": "ireq_01HZZ0A1B2C3D4E5F6G7H8J9K0",
    "closure_policy": { "policy_id": "icp_01HZZ4E5F6G7H8J9K0T1M2N300", "required_capability": "inspection.close", "required_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "operator_may_close": false, "requires_independent_verification": true, "policy_version": 3 },
    "counts": { "visits": 0, "responses": 0, "observations": 0, "findings": 0, "reports": 0 },
    "created_at": "2026-08-30T10:30:00Z",
    "created_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "updated_at": "2026-08-30T10:30:00Z",
    "updated_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "extensions": {},
    "links": {
      "self": "/api/v1/inspections/insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
      "history": "/api/v1/inspections/insp_01HZZ1B2C3D4E5F6G7H8J9K0T0/history",
      "visits": "/api/v1/inspection-visits?filter[inspection_id]=insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
      "assignments": "/api/v1/inspection-assignments?filter[inspection_id]=insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
      "reports": "/api/v1/inspection-reports?filter[inspection_id]=insp_01HZZ1B2C3D4E5F6G7H8J9K0T0"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T10:30:00Z", "effects": [ { "object": "inspection_checklist_instance", "count": 1, "change": "CREATED", "note": "Checklist template frozen at type-version" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

The server validates all supporting references against the principal. Errors: `403 MISSING_MANDATE`, `403 OUTSIDE_JURISDICTION`, `422 UNPROCESSABLE` when a non-regulatory origin carries regulatory issuing provenance, `422` when the type version's `allowed_origins` excludes the requested origin.

---

## GET /inspections · GET /inspections/{id}

**Auth:** `inspection.read_internal`, `inspection.read_published`, assigned-party read, or portfolio policy. Lists are clipped; filters only narrow.

Filters: `mine_id`, `origin`, `status`, `inspection_type_id`, `issuing_authority_id`, `assigned_person_id`, `lead_person_id`, `filter[scheduled_from][gte]`, `filter[overdue_closure]=true`, `filter[authority_confirmed]=false`, `regulatory_case_id`, `q`, `as_of`.
Expansions: `expand=targets,active_assignment,visits,responses,reports,checklist,findings`.

### Response — 200 OK, `?expand=active_assignment,checklist`

```json
{
  "success": true,
  "data": {
    "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
    "object": "inspection",
    "version": 6,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "FIELDWORK",
    "available_actions": ["COMPLETE_FIELDWORK", "CANCEL"],
    "origin": "REGULATORY",
    "status": "FIELDWORK",
    "title": "DGMS safety inspection — Gevra OCP",
    "scheduled_from": "2026-09-07T05:00:00Z",
    "scheduled_until": "2026-09-07T12:00:00Z",
    "started_at": "2026-09-07T05:12:00Z",
    "authority_confirmed": true,
    "issuing_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
    "lead_assignment_member_id": "iasm_01HZZ5F6G7H8J9K0T1M2N304P0",
    "active_assignment": {
      "id": "iasv_01HZZ6G7H8J9K0T1M2N304P5Q0",
      "object": "inspection_assignment_version",
      "version_number": 2,
      "status": "ACTIVE",
      "effective_from": "2026-09-05T00:00:00Z",
      "members": [
        { "id": "iasm_01HZZ5F6G7H8J9K0T1M2N304P0", "person": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" }, "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50", "participation_role": "LEAD", "assignment_status": "ACCEPTED", "accepted_at": "2026-09-05T09:14:00Z", "competencies_verified": true },
        { "id": "iasm_01HZZ7H8J9K0T1M2N304P5Q6R0", "person": { "type": "person", "id": "per_01HZZ8J9K0T1M2N304P5Q6R7S0", "display": "N. Ekka" }, "appointment_id": "app_01HZZ9K0T1M2N304P5Q6R7S8T0", "participation_role": "TECHNICAL_EXPERT", "assignment_status": "ACCEPTED", "accepted_at": "2026-09-05T10:02:00Z", "competencies_verified": true }
      ],
      "mandatory_roles_satisfied": true,
      "competency_gaps": []
    },
    "checklist": {
      "instance_id": "ichk_01HZZA0B1C2D3E4F5G6H7J8K90",
      "template_version_id": "ctv_01HZZB1C2D3E4F5G6H7J8K9T00",
      "frozen_at": "2026-08-30T10:30:00Z",
      "item_count": 47,
      "mandatory_item_count": 31,
      "responded_count": 22,
      "mandatory_responded_count": 14
    },
    "counts": { "visits": 1, "responses": 22, "observations": 4, "findings": 0, "reports": 0 },
    "links": { "self": "/api/v1/inspections/insp_01HZZ1B2C3D4E5F6G7H8J9K0T0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-07T08:00:00Z" }
}
```

---

## POST /inspections/{id}/actions

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `CONFIRM_AUTHORITY` | `inspection.confirm_regulatory_notice`, supported by the **claimed** authority's mandate and jurisdiction | optional | required | `origin = RECEIVED_NOTICE`, `authority_confirmed = false` | Converts claim to confirmed provenance; retains the original registration and any discrepancy |
| `COMPLETE_FIELDWORK` | `inspection.conduct` held by the accepted lead | optional | required | all visits `COMPLETED`/`CANCELLED`, completion policy satisfied | `fieldwork_completed_at` |
| `CANCEL` | `inspection.cancel` under origin/state policy | **required** | required | not `CLOSED` | `status = CANCELLED`; recorded visits and evidence remain |
| `CREATE_FOLLOW_UP` | origin-specific create capability **plus** authority over the parent | **required** | required | parent `ISSUED` or `CLOSED` | New linked inspection; the parent is never reopened or overwritten |
| `CLOSE` | `inspection.close` under the stored closure policy | **required** | required | report issued, required responses/findings/CAPAs/follow-ups resolved | `closed_at`; persists supporting appointment, mandate, and policy version |
| `REOPEN` | `inspection.reopen`, matching the closure authority | **required** | required | `CLOSED` | Back to `REPORTING`; new `inspection_decision` row |

### CONFIRM_AUTHORITY

```json
{
  "action": "CONFIRM_AUTHORITY",
  "expected_version": 2,
  "payload": {
    "issuing_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
    "issuing_authority_unit_id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20",
    "issuing_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "supporting_mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
    "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10"
  },
  "supporting_authority": { "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50", "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00", "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10", "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Authority confirmed",
  "data": {
    "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
    "object": "inspection",
    "version": 3,
    "state": "PLANNED",
    "authority_confirmed": true,
    "authority_confirmed_at": "2026-09-01T09:00:00Z",
    "issuing_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
    "issuing_authority_unit": { "type": "authority_unit", "id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20", "display": "Bilaspur Region" },
    "claimed_issuer": {
      "authority_name": "Directorate General of Mines Safety, Bilaspur Region",
      "officer_name_claimed": "A. Banerjee",
      "notice_reference": "DGMS/BSP/NOT/2026/0219",
      "registered_at": "2026-08-30T10:30:00Z"
    },
    "authority_discrepancies": [
      { "field": "officer_name", "claimed": "A. Banerjee", "confirmed": "A. Banerjee", "match": true },
      { "field": "notice_reference", "claimed": "DGMS/BSP/NOT/2026/0219", "confirmed": "DGMS/BSP/NOT/2026/0291", "match": false, "note": "Digit transposition in the received copy; confirmed reference prevails" }
    ],
    "available_actions": ["CANCEL"]
  },
  "meta": {
    "action": "CONFIRM_AUTHORITY",
    "transition": { "from": "AWAITING_CONFIRMATION", "to": "PLANNED" },
    "effects": [ { "object": "inspection_decision", "id": "idec_01HZZC2D3E4F5G6H7J8K9T0M10", "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-01T09:00:00Z"
  }
}
```

The original registration survives, and every discrepancy between claimed and confirmed is recorded rather than overwritten. What the mine was handed and what the authority actually issued are both facts, and they are occasionally different.

### CLOSE

```json
{
  "action": "CLOSE",
  "expected_version": 11,
  "reason": "All non-compliances issued, CAPAs verified, and the re-inspection of 12 October confirmed the berm reinstatement",
  "payload": {
    "verification_reference": { "type": "inspection", "id": "insp_01HZZD3E4F5G6H7J8K9T0M1N20" },
    "signature_id": "sig_01HZZE4F5G6H7J8K9T0M1N2030"
  },
  "supporting_authority": { "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50", "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00", "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10", "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Inspection closed",
  "data": {
    "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
    "object": "inspection",
    "version": 12,
    "state": "CLOSED",
    "status": "CLOSED",
    "closed_at": "2026-10-15T11:00:00Z",
    "closure_decision": {
      "decision_id": "idec_01HZZF5G6H7J8K9T0M1N203P40",
      "capability_exercised": "inspection.close",
      "supporting_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
      "supporting_mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
      "policy_version": 3,
      "independent_verification": { "type": "inspection", "id": "insp_01HZZD3E4F5G6H7J8K9T0M1N20", "display": "Re-inspection, 12 October 2026" },
      "signature_event_id": "sig_01HZZE4F5G6H7J8K9T0M1N2030"
    },
    "available_actions": ["REOPEN"]
  },
  "meta": {
    "action": "CLOSE",
    "transition": { "from": "REPORTING", "to": "CLOSED" },
    "effects": [ { "object": "inspection_decision", "id": "idec_01HZZF5G6H7J8K9T0M1N203P40", "change": "CREATED" }, { "object": "notification", "count": 5, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-10-15T11:00:00Z"
  }
}
```

### CLOSE — 409 preconditions unmet

```json
{
  "success": false,
  "message": "Closure preconditions are not satisfied",
  "error": {
    "code": "INVALID_STATE",
    "details": {
      "current_state": "REPORTING",
      "blocking_references": [
        { "type": "capa", "id": "capa_01HZZG6H7J8K9T0M1N203P4Q50", "display": "Reinstate 40m berm", "reason": "NOT_VERIFIED_CLOSED" },
        { "type": "inspection_checklist_item", "id": "ichi_01HZZH7J8K9T0M1N203P4Q5R60", "display": "Item 22 — ventilation survey record", "reason": "MANDATORY_UNANSWERED" },
        { "type": "inspection_access_event", "id": "iace_01HZZJ8K9T0M1N203P4Q5R6S70", "display": "Access refused, magazine area", "reason": "UNRESOLVED_ACCESS_REFUSAL" }
      ],
      "operator_may_close": false,
      "policy_version": 3
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## POST /inspection-assignments

**Auth:** `inspection.assign_team` on the inspection under its origin authority.

Team composition is **versioned**, never edited. Each proposal is a new version, and the active one is unique per inspection.

### Request

```json
{
  "inspection_id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
  "reason": "Initial assignment",
  "effective_from": "2026-09-05T00:00:00Z",
  "members": [
    { "person_id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50", "participation_role": "LEAD" },
    { "person_id": "per_01HZZ8J9K0T1M2N304P5Q6R7S0", "appointment_id": "app_01HZZ9K0T1M2N304P5Q6R7S8T0", "participation_role": "TECHNICAL_EXPERT" }
  ],
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Assignment proposed; awaiting member acceptance",
  "data": {
    "id": "iasv_01HZZ6G7H8J9K0T1M2N304P5Q0",
    "object": "inspection_assignment_version",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PROPOSED",
    "available_actions": ["SUPERSEDE", "WITHDRAW"],
    "inspection": { "type": "inspection", "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0", "display": "DGMS safety inspection — Gevra OCP" },
    "version_number": 1,
    "status": "PROPOSED",
    "proposed_by_appointment_id": "app_01HZZK9T0M1N203P4Q5R6S7T80",
    "decided_by_appointment_id": null,
    "effective_from": "2026-09-05T00:00:00Z",
    "replaced_by_id": null,
    "reason": "Initial assignment",
    "members": [
      { "id": "iasm_01HZZ5F6G7H8J9K0T1M2N304P0", "object": "inspection_assignment_member", "person": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" }, "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50", "affiliation_id": "aff_01HZY3B4C5D6E7F8G9H0J1K2T0", "participation_role": "LEAD", "assignment_status": "OFFERED", "offered_at": "2026-09-01T10:00:00Z", "responded_at": null, "accepted_at": null, "withdrawn_at": null, "response_reason": null, "competencies": [{ "competency_code": "MINE_SAFETY_INSPECTOR_L2", "verified": true, "credential_reference_id": "cred_01HZZT0M1N203P4Q5R6S7T8V90", "verified_at": "2024-07-01T00:00:00Z" }] },
      { "id": "iasm_01HZZ7H8J9K0T1M2N304P5Q6R0", "object": "inspection_assignment_member", "person": { "type": "person", "id": "per_01HZZ8J9K0T1M2N304P5Q6R7S0", "display": "N. Ekka" }, "appointment_id": "app_01HZZ9K0T1M2N304P5Q6R7S8T0", "affiliation_id": "aff_01HZZM1N203P4Q5R6S7T8V9V00", "participation_role": "TECHNICAL_EXPERT", "assignment_status": "OFFERED", "offered_at": "2026-09-01T10:00:00Z", "responded_at": null, "accepted_at": null, "withdrawn_at": null, "response_reason": null, "competencies": [{ "competency_code": "VENTILATION_SURVEY", "verified": false, "credential_reference_id": null, "verified_at": null }] }
    ],
    "diagnostics": {
      "mandatory_roles_satisfied": true,
      "competency_gaps": [
        { "competency_code": "VENTILATION_SURVEY", "required_minimum": 1, "verified_count": 0, "member_id": "iasm_01HZZ7H8J9K0T1M2N304P5Q6R0", "blocking_start": true }
      ],
      "availability_conflicts": [
        { "person_id": "per_01HZZ8J9K0T1M2N304P5Q6R7S0", "conflicting_inspection_id": "insp_01HZZN203P4Q5R6S7T8V9V0W10", "overlap": { "from": "2026-09-07T06:00:00Z", "to": "2026-09-07T10:00:00Z" }, "policy": "REQUIRES_EXCEPTION" }
      ]
    },
    "created_at": "2026-09-01T10:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZZ03P4Q5R6S7T8V9V0W1X20", "display": "K. Bhagat" },
    "updated_at": "2026-09-01T10:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZZ03P4Q5R6S7T8V9V0W1X20", "display": "K. Bhagat" },
    "extensions": {},
    "links": { "self": "/api/v1/inspection-assignments/iasv_01HZZ6G7H8J9K0T1M2N304P5Q0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-01T10:00:00Z", "effects": [ { "object": "notification", "count": 2, "change": "CREATED", "note": "Assignment offers" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

The response returns the proposal **plus diagnostics**. It does **not** activate members before acceptance, and `competency_gaps[].blocking_start: true` says up front that the visit cannot begin as composed.

---

## POST /inspection-assignment-members/{id}/actions

**Auth:** assigned person self-response.

| Action | `reason` | State precondition | Effects |
|---|---|---|---|
| `RESPOND` | required on `DECLINE` | `OFFERED` | Rechecks appointment, mandate, jurisdiction, competencies, conflicts, availability |
| `WITHDRAW` | **required** | `ACCEPTED` | Member leaves; inspection becomes unstartable until a valid version is active |

```json
{ "action": "RESPOND", "expected_version": 1, "payload": { "decision": "ACCEPT" } }
```

```json
{
  "success": true,
  "message": "Assignment accepted",
  "data": {
    "id": "iasm_01HZZ5F6G7H8J9K0T1M2N304P0",
    "object": "inspection_assignment_member",
    "version": 2,
    "state": "ACCEPTED",
    "assignment_status": "ACCEPTED",
    "responded_at": "2026-09-05T09:14:00Z",
    "accepted_at": "2026-09-05T09:14:00Z",
    "authority_recheck": {
      "appointment_current": true,
      "mandate_current": true,
      "jurisdiction_covers_targets": true,
      "competencies_verified": true,
      "conflicts": [],
      "checked_at": "2026-09-05T09:14:00Z"
    },
    "available_actions": ["WITHDRAW"]
  },
  "meta": {
    "action": "RESPOND",
    "transition": { "from": "OFFERED", "to": "ACCEPTED" },
    "effects": [
      { "object": "inspection_assignment_version", "id": "iasv_01HZZ6G7H8J9K0T1M2N304P5Q0", "change": "STATE", "to": "ACTIVE", "note": "All mandatory roles now accepted" },
      { "object": "inspection", "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0", "change": "lead_assignment_member_id", "to": "iasm_01HZZ5F6G7H8J9K0T1M2N304P0" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-05T09:14:00Z"
  }
}
```

Acceptance **rechecks everything** rather than trusting what was true at proposal time. A decline or an expiry leaves the inspection unstartable until a valid version is active — the system never quietly proceeds with an incomplete team.

---

## POST /inspection-handovers

**Auth:** `inspection.assign_team`; the incoming member must accept and qualify.

### Request

```json
{
  "inspection_id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
  "outgoing_member_id": "iasm_01HZZ7H8J9K0T1M2N304P5Q6R0",
  "incoming_person_id": "per_01HZZP4Q5R6S7T8V9V0W1X2Y30",
  "incoming_appointment_id": "app_01HZZQ5R6S7T8V9V0W1X2Y3Z40",
  "effective_at": "2026-09-07T09:00:00Z",
  "reason": "Outgoing member recalled to a fatality investigation at another mine",
  "open_item_snapshot_confirmed": true,
  "evidence_sync_confirmed": true,
  "safety_briefing_acknowledged": true,
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Handover recorded",
  "data": {
    "id": "ihov_01HZZR6S7T8V9V0W1X2Y3Z4A50",
    "object": "inspection_handover",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "EFFECTIVE",
    "available_actions": [],
    "inspection": { "type": "inspection", "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0", "display": "DGMS safety inspection — Gevra OCP" },
    "outgoing_member": { "id": "iasm_01HZZ7H8J9K0T1M2N304P5Q6R0", "person": { "type": "person", "id": "per_01HZZ8J9K0T1M2N304P5Q6R7S0", "display": "N. Ekka" }, "participation_role": "TECHNICAL_EXPERT" },
    "incoming_member": { "id": "iasm_01HZZS7T8V9V0W1X2Y3Z4A5B60", "person": { "type": "person", "id": "per_01HZZP4Q5R6S7T8V9V0W1X2Y30", "display": "D. Kujur" }, "participation_role": "TECHNICAL_EXPERT", "assignment_status": "ACCEPTED", "competencies_verified": true },
    "effective_at": "2026-09-07T09:00:00Z",
    "reason": "Outgoing member recalled to a fatality investigation at another mine",
    "open_item_snapshot": { "unanswered_mandatory_items": 9, "draft_observations": 2, "unsynced_evidence": 0, "snapshot_taken_at": "2026-09-07T09:00:00Z" },
    "evidence_sync_snapshot": { "pending_uploads": 0, "last_sync_at": "2026-09-07T08:58:00Z" },
    "safety_briefing_acknowledged_at": "2026-09-07T08:55:00Z",
    "authorised_by_appointment_id": "app_01HZZK9T0M1N203P4Q5R6S7T80",
    "created_at": "2026-09-07T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/inspection-handovers/ihov_01HZZR6S7T8V9V0W1X2Y3Z4A50" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-07T09:00:00Z", "effects": [ { "object": "inspection_assignment_version", "count": 1, "change": "CREATED", "note": "New version reflecting the substitution" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

Acts recorded before the handover retain their **original** provenance. The responses N. Ekka gave stay attributed to N. Ekka, forever.

---

## POST /inspection-visits · POST /inspection-visits/{id}/actions

**Auth:** `inspection.plan` to schedule; `inspection.conduct` held by an accepted active lead to start.

### Request — schedule

```json
{
  "inspection_id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
  "planned_from": "2026-09-07T05:00:00Z",
  "planned_until": "2026-09-07T12:00:00Z",
  "target_ids": ["itgt_01HZZ2C3D4E5F6G7H8J9K0T1M0", "itgt_01HZZ3D4E5F6G7H8J9K0T1M2N0"],
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Visit scheduled",
  "data": {
    "id": "ivis_01HZZT8V9V0W1X2Y3Z4A5B6C70",
    "object": "inspection_visit",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PLANNED",
    "available_actions": ["START", "POSTPONE", "CANCEL"],
    "inspection": { "type": "inspection", "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0", "display": "DGMS safety inspection — Gevra OCP" },
    "visit_number": 1,
    "status": "PLANNED",
    "planned_from": "2026-09-07T05:00:00Z",
    "planned_until": "2026-09-07T12:00:00Z",
    "actual_started_at": null,
    "actual_ended_at": null,
    "targets": [
      { "id": "itgt_01HZZ2C3D4E5F6G7H8J9K0T1M0", "target_type": "MINE", "display": "Gevra OCP" },
      { "id": "itgt_01HZZ3D4E5F6G7H8J9K0T1M2N0", "target_type": "SUBUNIT", "display": "Main Pit" }
    ],
    "attendance": [],
    "access_events": [],
    "postponement_reason": null,
    "cancellation_reason": null,
    "counts": { "responses": 0, "observations": 0, "access_events": 0 },
    "created_at": "2026-09-01T11:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/inspection-visits/ivis_01HZZT8V9V0W1X2Y3Z4A5B6C70" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-01T11:00:00Z" }
}
```

### Visit action vocabulary

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `START` | `inspection.conduct`, accepted active lead | optional | required | Rechecks full authority and mandatory team coverage |
| `RECORD_ATTENDANCE` | `inspection.conduct` | required on `no_show` | required | Attendance row; a no-show is never fabricated into presence |
| `RECORD_ACCESS_EVENT` | `inspection.record_access_event` — team or mine representative per event type | **required** on refusal/obstruction | required | Entry, refusal, obstruction, emergency access, or exit; **refusal escalates, it does not cancel** |
| `RECORD_OBSERVATION` | `inspection.record_observation` | optional | required | Observation with inspection/visit/response and authority provenance derived server-side |
| `COMPLETE` | `inspection.conduct`, accepted lead | optional | required | Checks attendance, sync state, mandatory coverage, unresolved refusals |
| `POSTPONE` | `inspection.plan` | **required** | required | New planned window; original retained |
| `CANCEL` | `inspection.plan` | **required** | required | Visit cancelled; recorded responses and evidence remain |

### START

```json
{ "action": "START", "expected_version": 1, "payload": { "actual_started_at": "2026-09-07T05:12:00Z" } }
```

```json
{
  "success": true,
  "message": "Visit started",
  "data": {
    "id": "ivis_01HZZT8V9V0W1X2Y3Z4A5B6C70",
    "object": "inspection_visit",
    "version": 2,
    "state": "IN_PROGRESS",
    "status": "IN_PROGRESS",
    "actual_started_at": "2026-09-07T05:12:00Z",
    "authority_recheck": { "lead_appointment_current": true, "mandate_current": true, "jurisdiction_covers_targets": true, "mandatory_roles_satisfied": true, "checked_at": "2026-09-07T05:12:00Z" },
    "available_actions": ["RECORD_ATTENDANCE", "RECORD_ACCESS_EVENT", "RECORD_OBSERVATION", "COMPLETE", "CANCEL"]
  },
  "meta": {
    "action": "START",
    "transition": { "from": "PLANNED", "to": "IN_PROGRESS" },
    "effects": [ { "object": "inspection", "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0", "change": "STATE", "to": "FIELDWORK" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-07T05:12:00Z"
  }
}
```

Start-time errors, each distinct: `409 TEAM_INCOMPLETE`, `403 APPOINTMENT_EXPIRED`, `403 MANDATE_MISMATCH`, `403 OUTSIDE_JURISDICTION`.

```json
{
  "success": false,
  "message": "Mandatory team coverage is not satisfied",
  "error": {
    "code": "TEAM_INCOMPLETE",
    "details": {
      "assignment_version_id": "iasv_01HZZ6G7H8J9K0T1M2N304P5Q0",
      "unsatisfied": [
        { "competency_code": "VENTILATION_SURVEY", "required_minimum": 1, "verified_count": 0, "participation_role": "TECHNICAL_EXPERT" }
      ],
      "unaccepted_members": [{ "member_id": "iasm_01HZZ7H8J9K0T1M2N304P5Q6R0", "person_display": "N. Ekka", "assignment_status": "OFFERED" }],
      "resolution": "Propose a new assignment version covering the gap, or record a governed exception"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### RECORD_ACCESS_EVENT — refusal

```json
{
  "action": "RECORD_ACCESS_EVENT",
  "expected_version": 3,
  "reason": "Site representative refused entry to the explosives magazine pending the magazine officer's arrival",
  "payload": {
    "event_type": "ACCESS_REFUSED",
    "occurred_at": "2026-09-07T07:20:00Z",
    "target_id": "itgt_01HZZ3D4E5F6G7H8J9K0T1M2N0",
    "details": { "refused_by_person_id": "per_01HZZV9V0W1X2Y3Z4A5B6C7D80", "stated_ground": "Magazine officer absent; keys unavailable" },
    "evidence_id": "ev_01HZZV0W1X2Y3Z4A5B6C7D8E90"
  }
}
```

```json
{
  "success": true,
  "message": "Access refusal recorded and escalated",
  "data": {
    "id": "ivis_01HZZT8V9V0W1X2Y3Z4A5B6C70",
    "object": "inspection_visit",
    "version": 4,
    "state": "IN_PROGRESS",
    "access_events": [
      { "id": "iace_01HZZJ8K9T0M1N203P4Q5R6S70", "event_type": "ACCESS_REFUSED", "occurred_at": "2026-09-07T07:20:00Z", "recorded_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" }, "details": { "refused_by_person_id": "per_01HZZV9V0W1X2Y3Z4A5B6C7D80", "stated_ground": "Magazine officer absent; keys unavailable" }, "evidence_id": "ev_01HZZV0W1X2Y3Z4A5B6C7D8E90", "resolved": false }
    ],
    "unresolved_access_refusals": 1,
    "available_actions": ["RECORD_ATTENDANCE", "RECORD_ACCESS_EVENT", "RECORD_OBSERVATION", "COMPLETE", "CANCEL"]
  },
  "meta": {
    "action": "RECORD_ACCESS_EVENT",
    "transition": null,
    "effects": [
      { "object": "notification", "count": 4, "change": "CREATED", "note": "Refusal escalated to the authority unit and the mine manager" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-07T07:21:00Z"
  }
}
```

**Refusal triggers escalation, not cancellation.** The visit continues, the refusal is on the record, and it blocks closure until resolved.

---

## POST /inspection-responses

**Auth:** `inspection.conduct`; the required competency is checked **per checklist item**. Offline-idempotent on the client-generated ID, and accepts a batch.

### Request

```json
{
  "responses": [
    {
      "id": "irsp_01HZZW1X2Y3Z4A5B6C7D8E9F00",
      "checklist_item_id": "ichi_01HZZX2Y3Z4A5B6C7D8E9F0G10",
      "visit_id": "ivis_01HZZT8V9V0W1X2Y3Z4A5B6C70",
      "response": "NON_COMPLIANT",
      "measurement": { "value": "0.0", "unit": "METRE", "parameter": "berm_height" },
      "reason": null,
      "note": "No berm present across 40m at chainage 1.20–1.24 km",
      "evidence_ids": ["ev_01HZZDD2E3F4G5H6J7K8T9M0N0"],
      "responded_at": "2026-09-07T07:40:00Z",
      "client_schema_version": 3
    },
    {
      "id": "irsp_01HZZY2Z3A4B5C6D7E8F9G0H10",
      "checklist_item_id": "ichi_01HZZH7J8K9T0M1N203P4Q5R60",
      "visit_id": "ivis_01HZZT8V9V0W1X2Y3Z4A5B6C70",
      "response": "NOT_INSPECTED",
      "measurement": null,
      "reason": "Access to the explosives magazine was refused; see access event iace_01HZZJ8K9T0M1N203P4Q5R6S70",
      "evidence_ids": [],
      "responded_at": "2026-09-07T07:45:00Z",
      "client_schema_version": 3
    }
  ]
}
```

`NOT_APPLICABLE` and `NOT_INSPECTED` **require** `reason`. A blank is `400 VALIDATION_ERROR`, because "we didn't look" without saying why is the gap this whole domain exists to close.

### Response — 200 OK

```json
{
  "success": true,
  "message": "2 responses recorded",
  "data": {
    "requested": 2,
    "created": 2,
    "replayed": 0,
    "failed": 0,
    "results": [
      {
        "id": "irsp_01HZZW1X2Y3Z4A5B6C7D8E9F00",
        "status": 201,
        "object": "inspection_response",
        "version": 1,
        "state": "RECORDED",
        "checklist_item": { "type": "inspection_checklist_item", "id": "ichi_01HZZX2Y3Z4A5B6C7D8E9F0G10", "display": "Item 14 — haul road edge protection" },
        "visit_id": "ivis_01HZZT8V9V0W1X2Y3Z4A5B6C70",
        "response": "NON_COMPLIANT",
        "measurement": { "value": "0.0", "unit": "METRE", "parameter": "berm_height" },
        "note": "No berm present across 40m at chainage 1.20–1.24 km",
        "evidence_ids": ["ev_01HZZDD2E3F4G5H6J7K8T9M0N0"],
        "responded_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
        "responded_by_assignment_member_id": "iasm_01HZZ5F6G7H8J9K0T1M2N304P0",
        "responded_at": "2026-09-07T07:40:00Z",
        "competency_satisfied": true,
        "links": { "self": "/api/v1/inspection-responses/irsp_01HZZW1X2Y3Z4A5B6C7D8E9F00" }
      },
      {
        "id": "irsp_01HZZY2Z3A4B5C6D7E8F9G0H10",
        "status": 201,
        "object": "inspection_response",
        "version": 1,
        "state": "RECORDED",
        "response": "NOT_INSPECTED",
        "reason": "Access to the explosives magazine was refused; see access event iace_01HZZJ8K9T0M1N203P4Q5R6S70",
        "linked_access_event_id": "iace_01HZZJ8K9T0M1N203P4Q5R6S70",
        "responded_at": "2026-09-07T07:45:00Z",
        "competency_satisfied": true,
        "links": { "self": "/api/v1/inspection-responses/irsp_01HZZY2Z3A4B5C6D7E8F9G0H10" }
      }
    ],
    "checklist_progress": { "item_count": 47, "responded_count": 23, "mandatory_item_count": 31, "mandatory_responded_count": 15 }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-07T07:46:00Z", "effects": [ { "object": "audit_event", "count": 2, "change": "CREATED" } ] }
}
```

Actions on a response: `AMEND` (reason required, keeps the superseded value in history) and `ATTACH_EVIDENCE`. A response is never silently overwritten.

---

## POST /inspection-reports · POST /inspection-reports/{id}/actions

**Auth:** `inspection.prepare_report` to create. A report **does not become issued here** — it links an immutable document version and records the preparer.

### Request

```json
{
  "inspection_id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0",
  "report_kind": "INSPECTION_REPORT",
  "document_version_id": "dv_01HZZZ3A4B5C6D7E8F9G0H1120",
  "supersedes_report_id": null,
  "proposed_findings": [
    { "origin_response_id": "irsp_01HZZW1X2Y3Z4A5B6C7D8E9F00", "requirement_id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00", "severity": "SEVERE", "title": "Absence of haul road edge protection", "capa": { "corrective_action": "Reinstate continuous berm to half tyre height along the full 40m", "preventive_action": "Weekly berm survey with photographic record", "due_on": "2026-09-14" } }
  ],
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Report prepared; awaiting review",
  "data": {
    "id": "irep_01HZZ0A4B5C6D7E8F9G0H112J0",
    "object": "inspection_report",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "DRAFT",
    "available_actions": ["REVIEW", "SUPERSEDE"],
    "inspection": { "type": "inspection", "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0", "display": "DGMS safety inspection — Gevra OCP" },
    "report_kind": "INSPECTION_REPORT",
    "document_version": { "type": "document_version", "id": "dv_01HZZZ3A4B5C6D7E8F9G0H1120", "display": "Inspection report, 7 September 2026", "sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6" },
    "status": "DRAFT",
    "prepared_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "prepared_by_assignment_member_id": "iasm_01HZZ5F6G7H8J9K0T1M2N304P0",
    "prepared_at": "2026-09-08T10:00:00Z",
    "reviewed_by_appointment_id": null,
    "reviewed_at": null,
    "issued_by_appointment_id": null,
    "issued_at": null,
    "supersedes_report_id": null,
    "superseded_by_report_id": null,
    "proposed_findings": [
      { "id": "ipf_01HZZ1B5C6D7E8F9G0H112J3K0", "origin_response_id": "irsp_01HZZW1X2Y3Z4A5B6C7D8E9F00", "requirement_id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00", "severity": "SEVERE", "title": "Absence of haul road edge protection", "status": "PROPOSED", "promoted_finding_id": null }
    ],
    "created_at": "2026-09-08T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/inspection-reports/irep_01HZZ0A4B5C6D7E8F9G0H112J0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-08T10:00:00Z" }
}
```

### Report action vocabulary

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `REVIEW` | `inspection.review_report` under origin policy and separation rules | **required** | required | Accept or reject; a reviewer cannot self-promote through team assignment |
| `ISSUE` | `inspection.issue_internal` / `inspection.issue_regulatory` / contract-defined third-party issue | optional | required | Promotes approved proposed findings with inherited provenance; records exact authorization evidence |
| `SUPERSEDE` | `inspection.prepare_report` | **required** | required | New report; the superseded one is retained |

### ISSUE

Regulatory issue requires the authority mandate, jurisdiction or case assignment, completed review, a signing identity, and the required assurance. **The receiving operator can never issue it.**

```json
{
  "action": "ISSUE",
  "expected_version": 3,
  "payload": { "signing_identity_id": "sign_01HZY8H9J0K1T2M3N405P6Q7R0", "issue_to_filings": [{ "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }, "purpose": "ISSUED_TO" }], "response_due_on": "2026-09-22" },
  "supporting_authority": { "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50", "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00", "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10", "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Report issued; 1 finding promoted",
  "data": {
    "id": "irep_01HZZ0A4B5C6D7E8F9G0H112J0",
    "object": "inspection_report",
    "version": 4,
    "state": "ISSUED",
    "status": "ISSUED",
    "issued_by_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "issued_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "issued_at": "2026-09-09T11:00:00Z",
    "proposed_findings": [
      { "id": "ipf_01HZZ1B5C6D7E8F9G0H112J3K0", "status": "PROMOTED", "promoted_finding_id": "find_01HZZ55F6G7H8J9K0T1M2N3040" }
    ],
    "issue_decision": {
      "decision_id": "idec_01HZZ2C6D7E8F9G0H112J3K4T0",
      "capability_exercised": "inspection.issue_regulatory",
      "supporting_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
      "supporting_mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
      "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
      "assurance_at_decision": "PASSKEY",
      "signature_event_id": "sig_01HZZ3D7E8F9G0H112J3K4T5M0",
      "policy_version": 3
    },
    "available_actions": ["SUPERSEDE"]
  },
  "meta": {
    "action": "ISSUE",
    "transition": { "from": "REVIEWED", "to": "ISSUED" },
    "effects": [
      { "object": "finding", "count": 1, "change": "CREATED", "note": "Promoted with inherited structured authority provenance" },
      { "object": "capa", "count": 1, "change": "CREATED" },
      { "object": "document_filing", "count": 1, "change": "CREATED" },
      { "object": "inspection", "id": "insp_01HZZ1B2C3D4E5F6G7H8J9K0T0", "change": "STATE", "to": "REPORTING" },
      { "object": "notification", "count": 7, "change": "CREATED" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-09T11:00:00Z"
  }
}
```

Issuance is where a proposed finding becomes a real one, carrying the issuing authority's structured provenance ([`../defects/findings.md`](../defects/findings.md)). Before issuance it binds nobody.

---

## Invariants

- Origin determines authority requirements. A non-regulatory inspection cannot carry regulatory issuing provenance, and a received notice's claim is never treated as confirmed.
- Team assignment is versioned and acceptance-based. Availability is never assumed, and start is transactionally blocked until mandatory roles and competencies are satisfied.
- Access refusal, obstruction, and no-show are recorded and escalated. None of them is ever converted into attendance or completion.
- `NOT_APPLICABLE` and `NOT_INSPECTED` require a reason.
- Reports and decisions are append-only or superseded; closure never deletes observations and never substitutes for finding or CAPA closure.
- A follow-up is a new linked inspection. The parent is never reopened or overwritten.
- The receiving operator cannot issue, cancel, or close a regulatory inspection, and the denial says so.

# Defects — findings and regulator provenance

Table: `finding` (`data-model.md §3.4`). Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/defect-management/defect-spec.md`](../../../features/defect-management/defect-spec.md).

A **finding** is the assertion that a requirement was breached. It is created with **at least one CAPA in the same transaction** — a finding with no assigned corrective action is a complaint, not a compliance record. Regulator provenance is structured: callers never submit `raised_by_regulator`, a role string, or a generic region.

## Routes

| Route | Purpose |
|---|---|
| `GET /findings` · `POST /findings` | Raise and search |
| `GET /findings/{id}` · `POST /findings/{id}/actions` · `GET /findings/{id}/history` | Lifecycle |
| `POST /findings/actions` | Bulk over a filter |

`GET /findings/{id}/capas` is `GET /capas?filter[finding_id]=find_01H…`, or `GET /findings/{id}?expand=capas`.

---

## POST /findings

The server derives mine, tenant, and requirement scope from the origin. `Idempotency-Key` required.

### Request — internal finding

**Auth:** `finding.raise_internal` on the target mine.

```json
{
  "origin": { "type": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30" },
  "requirement_id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00",
  "requirement_clause_ref": "/akn/in/act/cmr/2017/main#reg_106__2",
  "severity": "SIGNIFICANT",
  "title": "Haul road edge protection below CMR 2017 Reg. 106(2)",
  "description": "40m of the east haul road edge has no safety berm; regulation requires a continuous berm of at least half tyre height.",
  "responsible_organization_id": null,
  "due_on": "2026-09-13",
  "capa": {
    "corrective_action": "Reinstate 40m of missing berm along east haul road edge to 1.5m height",
    "preventive_action": "Add berm integrity check to the daily haul road inspection checklist",
    "assigned_to": null,
    "due_on": "2026-09-13"
  },
  "extensions": {}
}
```

### Request — regulatory finding

**Auth:** `finding.raise_regulatory` on the target mine, supported by a current regulator appointment, mandate assignment, and jurisdiction. The supplied identifiers are **validated and persisted; they do not grant authority.**

```json
{
  "origin": { "type": "observation", "id": "obs_01HZZ9T0M1N203P4Q5R6S7T8V0" },
  "requirement_id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00",
  "requirement_clause_ref": "/akn/in/act/cmr/2017/main#reg_106__2",
  "severity": "SEVERE",
  "title": "Absence of haul road edge protection",
  "description": "Inspection of 7 September 2026 found 40m of the east haul road without any berm, with an unprotected 3m drop onto an active bench.",
  "issuing_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
  "issuing_authority_unit_id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20",
  "issuing_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
  "supporting_mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
  "supporting_jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
  "source_instrument_document_id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
  "responsible_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0",
  "due_on": "2026-09-14",
  "capa": {
    "corrective_action": "Reinstate continuous berm to half tyre height along the full 40m section and cease haulage until complete",
    "preventive_action": "Weekly berm survey with photographic record submitted to the Regional Inspector",
    "assigned_to": null,
    "due_on": "2026-09-14"
  },
  "extensions": {}
}
```

For an observation belonging to a **confirmed** regulatory inspection, the authority, unit, appointment, mandate, jurisdiction, and report provenance are derived from that inspection and **cannot be overridden** — supplying conflicting values is `422 AUTHORITY_PROVENANCE_MISMATCH`. Direct regulatory findings outside an inspection use the explicit fields above.

### Response — 201 Created

`Location: /api/v1/findings/find_01HZZ55F6G7H8J9K0T1M2N3040`

```json
{
  "success": true,
  "message": "Finding raised with 1 CAPA",
  "data": {
    "id": "find_01HZZ55F6G7H8J9K0T1M2N3040",
    "object": "finding",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "CAPA_ASSIGNED",
    "available_actions": ["CLOSE", "ESCALATE_SEVERITY", "REASSIGN_RESPONSIBILITY"],
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "defect": { "type": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "display": "Safety berm missing, east haul road" },
    "origin": { "type": "observation", "id": "obs_01HZZ9T0M1N203P4Q5R6S7T8V0", "display": "DGMS inspection observation, 2026-09-07" },
    "requirement": { "type": "obligation", "id": "obl_01HZYV1V2W3X4Y5Z6A7B8C9D00", "display": "Haul road edge protection" },
    "requirement_clause_ref": "/akn/in/act/cmr/2017/main#reg_106__2",
    "title": "Absence of haul road edge protection",
    "description": "Inspection of 7 September 2026 found 40m of the east haul road without any berm, with an unprotected 3m drop onto an active bench.",
    "severity": "SEVERE",
    "status": "CAPA_ASSIGNED",
    "is_regulatory": true,
    "issuing_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
    "issuing_authority_unit": { "type": "authority_unit", "id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20", "display": "Bilaspur Region" },
    "issuing_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "issuing_person": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "raised_by_region_id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20",
    "source_instrument": { "type": "document", "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "display": "Inspection direction DGMS/BSP/DIR/2026/0441" },
    "responsible_organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "raised_at": "2026-09-07T11:20:00Z",
    "due_on": "2026-09-14",
    "closed_at": null,
    "closed_by": null,
    "closure_policy": {
      "policy_id": "rcp_01HZZJ8K9T0M1N203P4Q5R6S70",
      "required_capability": "finding.close_severe",
      "required_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
      "required_assurance": "PASSKEY",
      "separation_policy": "CLOSER_NOT_RAISER_NOT_SUBMITTER",
      "evidence_gate": "can_close_with",
      "operator_may_close": false,
      "policy_version": 5
    },
    "authorization_evidence": {
      "authorization_decision_id": "azd_01HZZK9T0M1N203P4Q5R6S7T80",
      "supporting_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
      "supporting_mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
      "supporting_jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
      "decided_at": "2026-09-07T11:20:00Z",
      "policy_version": 5
    },
    "counts": { "capas": 1, "open_capas": 1, "evidence": 0 },
    "created_at": "2026-09-07T11:20:00Z",
    "created_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "updated_at": "2026-09-07T11:20:00Z",
    "updated_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "extensions": {},
    "links": {
      "self": "/api/v1/findings/find_01HZZ55F6G7H8J9K0T1M2N3040",
      "history": "/api/v1/findings/find_01HZZ55F6G7H8J9K0T1M2N3040/history",
      "capas": "/api/v1/capas?filter[finding_id]=find_01HZZ55F6G7H8J9K0T1M2N3040"
    }
  },
  "included": {
    "capa:capa_01HZZAAB1C2D3E4F5G6H7J8K90": {
      "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "object": "capa",
      "version": 1,
      "state": "OPEN",
      "finding_id": "find_01HZZ55F6G7H8J9K0T1M2N3040",
      "corrective_action": "Reinstate continuous berm to half tyre height along the full 40m section and cease haulage until complete",
      "preventive_action": "Weekly berm survey with photographic record submitted to the Regional Inspector",
      "assigned_to": null,
      "due_on": "2026-09-14",
      "extension_count": 0
    }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-09-07T11:20:00Z",
    "effects": [
      { "object": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "change": "CREATED" },
      { "object": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "change": "STATE", "to": "UNDER_ACTION" },
      { "object": "authorization_decision", "id": "azd_01HZZK9T0M1N203P4Q5R6S7T80", "change": "CREATED" },
      { "object": "notification", "count": 5, "change": "CREATED" },
      { "object": "outbox_event", "count": 3, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZT0M1N203P4Q5R6S7T8V90", "change": "CREATED" }
    ]
  }
}
```

`closure_policy` is **captured at raise time and frozen onto the finding**. A later policy edit does not retroactively change who may close this one, and `operator_may_close: false` is returned as data so the operator's UI can say why the close button is absent rather than failing at the click.

### Errors

| Status | Code | Condition |
|---|---|---|
| 403 | `MISSING_MANDATE` | No current mandate assignment covers `finding.raise_regulatory` for the named appointment |
| 403 | `OUTSIDE_JURISDICTION` | The appointment's jurisdiction does not cover this mine at `raised_at` |
| 409 | `INVALID_ORIGIN_STATE` | Origin observation is `PENDING` or `DISMISSED`, or the origin defect is `MERGED`/`SPLIT` |
| 422 | `AUTHORITY_PROVENANCE_MISMATCH` | Supplied issuer fields contradict those derived from a confirmed inspection; `details.derived` and `details.supplied` show both |
| 422 | `UNPROCESSABLE` | `capa` missing — a finding cannot exist without at least one corrective action |

---

## GET /findings/{id}

**Auth:** `finding.read` on this finding. Internal users, responsible contractor parties, and regulators may receive **different projections**. A regulator read requires a declared purpose and valid jurisdiction unless a separately governed historical case assignment applies.

Query: `expand=capas,defect,origin,evidence,requirement`, `as_of`.

### Response — 200 OK, contractor projection

```json
{
  "success": true,
  "data": {
    "id": "find_01HZZ55F6G7H8J9K0T1M2N3040",
    "object": "finding",
    "version": 3,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PENDING_VERIFICATION",
    "available_actions": [],
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "title": "Absence of haul road edge protection",
    "description": "Inspection of 7 September 2026 found 40m of the east haul road without any berm, with an unprotected 3m drop onto an active bench.",
    "severity": "SEVERE",
    "status": "PENDING_VERIFICATION",
    "is_regulatory": true,
    "issuing_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
    "issuing_authority_unit": null,
    "issuing_appointment_id": null,
    "issuing_person": null,
    "responsible_organization": { "type": "organization", "id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Acme Mining Services Pvt Ltd" },
    "raised_at": "2026-09-07T11:20:00Z",
    "due_on": "2026-09-14",
    "counts": { "capas": 1, "open_capas": 1, "evidence": 4 },
    "projection": "RESPONSIBLE_PARTY",
    "redacted_fields": ["issuing_authority_unit", "issuing_appointment_id", "issuing_person", "authorization_evidence", "closure_policy", "source_instrument"],
    "links": { "self": "/api/v1/findings/find_01HZZ55F6G7H8J9K0T1M2N3040" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-10T08:00:00Z" }
}
```

The responsible contractor sees what it must act on and nothing about the individual officer who raised it. `redacted_fields` names every withheld field so the contractor's system does not mistake absence for emptiness.

---

## GET /findings

**Auth:** results clipped to `finding.read`.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[mine_id]` · `filter[defect_id]` · `filter[tenant_id]` | | |
| `filter[severity]` | `SEVERE` | |
| `filter[status]` | `OPEN,CAPA_ASSIGNED,PENDING_VERIFICATION` | |
| `filter[is_regulatory]` | `true` | Derived from `issuing_authority_id IS NOT NULL` — **never authorization data** |
| `filter[issuing_authority_id]` | `auth_01H…` | |
| `filter[responsible_organization_id]` | `org_01H…` | The contractor's own queue |
| `filter[origin.type]` | `observation,defect,inspection` | |
| `filter[due_on][lte]` | `2026-09-30` | |
| `filter[overdue]` | `true` | |
| `filter[raised_at][gte]` | `2026-04-01T00:00:00Z` | |
| `q` | `q=berm edge protection` | |
| `sort` | `-severity`, `due_on`, `-raised_at` | |
| `group_by` + `metrics` | `group_by=issuing_authority_id,severity&metrics=count` | |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "find_01HZZ55F6G7H8J9K0T1M2N3040",
      "object": "finding",
      "version": 3,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "PENDING_VERIFICATION",
      "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "defect": { "type": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "display": "Safety berm missing, east haul road" },
      "title": "Absence of haul road edge protection",
      "severity": "SEVERE",
      "status": "PENDING_VERIFICATION",
      "is_regulatory": true,
      "issuing_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
      "responsible_organization": { "type": "organization", "id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Acme Mining Services Pvt Ltd" },
      "raised_at": "2026-09-07T11:20:00Z",
      "due_on": "2026-09-14",
      "overdue": false,
      "counts": { "capas": 1, "open_capas": 1 },
      "links": { "self": "/api/v1/findings/find_01HZZ55F6G7H8J9K0T1M2N3040" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 11, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-10T08:05:00Z" }
}
```

---

## POST /findings/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `CLOSE` | `finding.close_internal`, or `finding.close_regulatory` from the **issuing authority** with current mandate and jurisdiction | **required** | required | every CAPA `VERIFIED_CLOSED` | `status = CLOSED`; may cascade the defect to `CLOSED` |
| `ADD_CAPA` | `capa.create` on the finding | **required** | required | not `CLOSED` | New CAPA under this finding |
| `ESCALATE_SEVERITY` | `finding.escalate` | **required** | required | not `CLOSED` | Raises severity; re-resolves the closure policy rung |
| `REASSIGN_RESPONSIBILITY` | `finding.reassign` | **required** | required | not `CLOSED` | Changes `responsible_organization_id` |
| `REOPEN` | `finding.reopen`, matching the closure authority | **required** | required | `CLOSED` | Back to `CAPA_ASSIGNED`; cascades the defect open |

**Operator capability can never close a regulator-issued finding.** The stored `closure_policy` decides, not the caller's tenant role.

### CLOSE

```json
{
  "action": "CLOSE",
  "expected_version": 3,
  "reason": "Berm reinstated to 1.6m across the full 40m; verified on site 2026-09-12 against photographic and survey evidence",
  "payload": {
    "decision": "CLOSE",
    "verification_attempt_ids": ["va_01HZZBBC2D3E4F5G6H7J8K9T00"],
    "signature_id": "sig_01HZZM1N203P4Q5R6S7T8V9V00",
    "closure_evidence_ids": ["ev_01HZZN203P4Q5R6S7T8V9V0W10", "ev_01HZZ03P4Q5R6S7T8V9V0W1X20"]
  },
  "supporting_authority": {
    "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
    "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
    "delegation_id": null,
    "break_glass_grant_id": null
  }
}
```

The server validates every supporting reference against the authenticated principal, the separation policy, the evidence gate, and the required assurance, then persists the exact decision evidence.

### Response — 200 OK

```json
{
  "success": true,
  "message": "Finding closed",
  "data": {
    "id": "find_01HZZ55F6G7H8J9K0T1M2N3040",
    "object": "finding",
    "version": 4,
    "state": "CLOSED",
    "status": "CLOSED",
    "closed_at": "2026-09-12T14:30:00Z",
    "closed_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "closure_decision": {
      "authorization_decision_id": "azd_01HZZP4Q5R6S7T8V9V0W1X2Y30",
      "capability_exercised": "finding.close_severe",
      "supporting_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
      "supporting_mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
      "supporting_jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10",
      "assurance_at_decision": "PASSKEY",
      "separation_check": "PASSED",
      "verification_attempt_ids": ["va_01HZZBBC2D3E4F5G6H7J8K9T00"],
      "signature_id": "sig_01HZZM1N203P4Q5R6S7T8V9V00",
      "policy_version": 5
    },
    "available_actions": ["REOPEN"]
  },
  "meta": {
    "action": "CLOSE",
    "transition": { "from": "PENDING_VERIFICATION", "to": "CLOSED" },
    "effects": [
      { "object": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "change": "STATE", "to": "CLOSED", "note": "Last open finding on this defect" },
      { "object": "authorization_decision", "id": "azd_01HZZP4Q5R6S7T8V9V0W1X2Y30", "change": "CREATED" },
      { "object": "notification", "count": 6, "change": "CREATED" },
      { "object": "outbox_event", "count": 4, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZQ5R6S7T8V9V0W1X2Y3Z40", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-12T14:30:00Z"
  }
}
```

### CLOSE — 403 wrong closure authority

```json
{
  "success": false,
  "message": "This finding can only be closed by its issuing authority",
  "error": {
    "code": "FORBIDDEN",
    "details": {
      "required_capability": "finding.close_severe",
      "required_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
      "required_authority_display": "DGMS",
      "caller_capabilities_at_target": ["finding.close_minor", "finding.close_significant"],
      "operator_may_close": false,
      "policy_version": 5,
      "resolution": "Submit the CAPA evidence and request closure from the issuing authority; the operator has no path to close this finding"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### CLOSE — 409 CAPAs still open

```json
{
  "success": false,
  "message": "Finding has unverified CAPAs",
  "error": {
    "code": "INVALID_STATE",
    "details": {
      "current_state": "CAPA_ASSIGNED",
      "blocking_references": [
        { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Reinstate 40m berm", "state": "SUBMITTED" }
      ],
      "resolution": "Verify each CAPA via POST /capas/{id}/actions before closing the finding"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### ESCALATE_SEVERITY

```json
{
  "action": "ESCALATE_SEVERITY",
  "expected_version": 3,
  "reason": "Second recurrence of the same berm failure within 60 days; escalated per the repeat-breach policy",
  "payload": { "new_severity": "SEVERE", "recompute_closure_policy": true }
}
```

```json
{
  "success": true,
  "message": "Severity escalated; closure policy re-resolved",
  "data": {
    "id": "find_01HZZ55F6G7H8J9K0T1M2N3040",
    "object": "finding",
    "version": 4,
    "state": "CAPA_ASSIGNED",
    "severity": "SEVERE",
    "closure_policy": {
      "policy_id": "rcp_01HZZJ8K9T0M1N203P4Q5R6S70",
      "required_capability": "finding.close_severe",
      "required_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
      "required_assurance": "PASSKEY",
      "separation_policy": "CLOSER_NOT_RAISER_NOT_SUBMITTER",
      "operator_may_close": false,
      "policy_version": 5,
      "previous_required_capability": "finding.close_significant"
    },
    "available_actions": ["ADD_CAPA", "REASSIGN_RESPONSIBILITY"]
  },
  "meta": {
    "action": "ESCALATE_SEVERITY",
    "transition": null,
    "effects": [
      { "object": "capa", "count": 1, "change": "VERIFICATION_AUTHORITY_CHANGED", "note": "PERMISSION_BY_SEVERITY now resolves to close_severe" },
      { "object": "notification", "count": 4, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZR6S7T8V9V0W1X2Y3Z4A50", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-10T09:00:00Z"
  }
}
```

Escalating severity moves the closure rung. `previous_required_capability` is returned so a person who could close it yesterday and cannot today is told why, rather than meeting a bare `403`.

---

## POST /findings/actions

Bulk `REASSIGN_RESPONSIBILITY` and `ESCALATE_SEVERITY` over a filter, per-target authorization, `207` on mixed outcomes. Bulk `CLOSE` is refused with `400 VALIDATION_ERROR` — closure names per-finding verification attempts and a signature, and a batch close is exactly the rubber stamp the evidence gate exists to prevent.

```json
{
  "action": "REASSIGN_RESPONSIBILITY",
  "filter": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "responsible_organization_id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "status": "CAPA_ASSIGNED" },
  "reason": "Acme engagement revoked 2026-12-01; open responsibilities transfer to the principal employer",
  "payload": { "new_responsible_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0" },
  "atomic": false
}
```

```json
{
  "success": true,
  "message": "3 of 3 reassigned",
  "data": {
    "requested": 3,
    "succeeded": 3,
    "failed": 0,
    "results": [
      { "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "status": 200, "version": 5, "state": "CAPA_ASSIGNED" },
      { "id": "find_01HZZS7T8V9V0W1X2Y3Z4A5B60", "status": 200, "version": 2, "state": "CAPA_ASSIGNED" },
      { "id": "find_01HZZT8V9V0W1X2Y3Z4A5B6C70", "status": 200, "version": 4, "state": "CAPA_ASSIGNED" }
    ]
  },
  "meta": { "action": "REASSIGN_RESPONSIBILITY", "effects": [ { "object": "capa", "count": 3, "change": "REASSIGNED" }, { "object": "notification", "count": 6, "change": "CREATED" }, { "object": "audit_event", "count": 3, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-12-01T00:00:00Z" }
}
```

---

## Invariants

- A finding is never created without at least one CAPA in the same transaction.
- Regulator provenance is structured foreign keys, validated against a live appointment, mandate, and jurisdiction — and persisting them grants nothing.
- The closure policy is frozen onto the finding at raise time; later policy edits never retroactively change who may close it.
- `is_regulatory` is a derived read filter and never an authorization input.
- An operator can never close a regulator-issued finding, and the `403` says so explicitly instead of hiding behind a generic denial.
- Every closure persists the exact authorization decision: capability, appointment, mandate, jurisdiction, assurance, separation result, evidence attempts, and policy version.

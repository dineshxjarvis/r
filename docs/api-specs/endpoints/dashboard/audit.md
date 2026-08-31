# Dashboard — audit events and access log

Tables: `audit_event`, `access_log` (`data-model.md §6`). `outbox_event` is internal and has **no read endpoint** — it is a delivery mechanism, not a domain record.

**Read-only throughout.** Every row is written by the domain transaction boundary (`emit_audit_and_outbox()`) or the regulator-read wrapper (`access_log`), never through this API.

**No dedicated ReBAC type** — `audit_event` and `access_log` are polymorphic over `object_type`. Authorization resolves through the referenced object's own viewer relation where the type is mine-scoped (`obligation_instance`, `defect`, `finding`, `capa`, `evidence`, `document`, …), and through an explicit platform audit capability for administrative/global types (`post`, `appointment`, `responsibility_route`, `organization`, …). **There is no bare administrator fallback.**

Actor principal/person, supporting appointment/mandate, tenant portfolio, and purpose follow [`../../../architecture/identity-authority-model.md`](../../../architecture/identity-authority-model.md). Conventions: [`../../README.md`](../../README.md).

## Routes

| Route | Purpose |
|---|---|
| `GET /audit-events` · `GET /audit-events/{id}` | The change record, cursor-paginated |
| `GET /access-log` · `GET /access-log/{id}` | Who read what, and who was refused |

`GET /audit-events/state-as-of` is gone. Temporal reads are the universal `?as_of=` on the resource itself — `GET /obligation-instances/{id}?as_of=2026-06-15T00:00:00Z` — and `GET /{collection}/{id}/history` gives the ordered change record for any resource. Both are declared once in [`../../README.md`](../../README.md) and work on every collection, so no domain needs its own time-travel route.

---

## GET /audit-events/{id}

**Auth:** `audit.read` on the referenced resource. Platform and security object types require an explicit platform audit capability.

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "id": "aud_01HZZPP1Q2R3S4T5V6V7W8X9Y0",
    "object": "audit_event",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "sequence_no": 4821,
    "occurred_at": "2026-08-30T15:00:00Z",
    "effective_at": "2026-08-30T15:00:00Z",
    "actor": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "actor_principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
    "acting_as": {
      "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
      "post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
      "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "SECL" },
      "mandate_assignment_id": null,
      "jurisdiction_assignment_id": null,
      "delegation_id": null,
      "break_glass_grant_id": null
    },
    "action": "capa.VERIFY",
    "resource": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Reinstate 40m berm, east haul road" },
    "object_type": "capa",
    "object_id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "transition": { "from": "SUBMITTED", "to": "VERIFIED_CLOSED" },
    "changes": [
      { "field": "status", "from": "SUBMITTED", "to": "VERIFIED_CLOSED" },
      { "field": "verified_by", "from": null, "to": "per_01HZY1B2C3D4E5F6G7H8J9K0M0" },
      { "field": "verified_at", "from": null, "to": "2026-08-30T15:00:00Z" }
    ],
    "before": { "status": "SUBMITTED", "verified_by": null, "verified_at": null },
    "after": { "status": "VERIFIED_CLOSED", "verified_by": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "verified_at": "2026-08-30T15:00:00Z" },
    "reason": null,
    "purpose": null,
    "source": "API",
    "request_id": "req_01HZZ5Y0Z1A2B3C4D5E6F7G8H0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "authorization_decision_id": "azd_01HZZW1X2Y3Z4A5B6C7D8E9F00",
    "policy_version": 5,
    "chain_id": "chain_ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "prev_hash": "sha256:7a6b5c4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8b7c6d5e4f3a2b1c0d9e8f7a6b",
    "hash": "sha256:1f2e3d4c5b6a7908f1e2d3c4b5a69708f1e2d3c4b5a69708f1e2d3c4b5a69701",
    "extensions": {},
    "links": {
      "self": "/api/v1/audit-events/aud_01HZZPP1Q2R3S4T5V6V7W8X9Y0",
      "resource": "/api/v1/capas/capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "prev": "/api/v1/audit-events?filter[chain_id]=chain_ten_01HZX1A2B3C4D5E6F7G8H9J0K0&filter[sequence_no]=4820"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:30:00Z" }
}
```

`acting_as` is the part that matters. "S. Minj verified this" is a fact about a person; *"the Mine Manager of Gevra OCP, under appointment app_01H…, verified this"* is a fact about an office, and it is still true after that person transfers.

`chain_id`, `prev_hash`, and `hash` form the tamper-evident chain. Verification is `platform/platform-operations.md`'s concern; this endpoint returns the links so any reader can check them independently.

---

## GET /audit-events

**Auth:** results clipped **per row** by `audit.read`. Cross-cutting queries require an explicit portfolio or platform audit capability and produce an effective resource set.

**Cursor-paginated** — an unbounded live-appended stream where page numbers are meaningless.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[object_type]` | `capa` | Required together with `object_id` unless the caller holds a platform audit capability |
| `filter[object_id]` | `capa_01H…` | |
| `filter[action]` | `capa.VERIFY,finding.CLOSE` | |
| `filter[actor_person_id]` | `per_01H…` | |
| `filter[acting_as.post_id]` | `post_01H…` | Everything done *by that office*, across whoever held it |
| `filter[mine_id]` | `mine_01H…` | |
| `filter[occurred_at][gte]` · `[lte]` | `2026-08-01T00:00:00Z` | |
| `filter[transition.to]` | `VERIFIED_CLOSED` | |
| `filter[has_override]` | `true` | |
| `filter[break_glass]` | `true` | Every act taken under emergency grant |
| `cursor` / `limit` | | Default `limit=20` |
| `group_by` + `metrics` | `group_by=action&metrics=count` | |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "aud_01HZZPP1Q2R3S4T5V6V7W8X9Y0",
      "object": "audit_event",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "sequence_no": 4821,
      "occurred_at": "2026-08-30T15:00:00Z",
      "action": "capa.VERIFY",
      "resource": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Reinstate 40m berm, east haul road" },
      "object_type": "capa",
      "object_id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "actor": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
      "acting_as": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" } },
      "transition": { "from": "SUBMITTED", "to": "VERIFIED_CLOSED" },
      "source": "API",
      "links": { "self": "/api/v1/audit-events/aud_01HZZPP1Q2R3S4T5V6V7W8X9Y0" }
    }
  ],
  "pagination": { "next_cursor": "eyJzIjo0ODIxLCJjIjoiY2hhaW5fdGVuXzAxSFpYMUEyQjNDNEQ1RTZGN0c4SDlKMEsifQ", "has_more": true },
  "warnings": [
    { "code": "PARTIAL_SCOPE", "message": "41 events in this window reference resources outside your audit scope and are omitted", "details": { "omitted_count": 41 } }
  ],
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:30:00Z" }
}
```

Omitted rows are **counted and reported**. A silently short audit trail is worse than no audit trail, because it reads as completeness.

---

## GET /access-log/{id}

**Auth:** actor self-read, `access_log.read` on the accessed resource, or an explicit platform audit capability. Mine accountability views redact regulator details beyond policy need.

### Response — 200 OK, granted

```json
{
  "success": true,
  "data": {
    "id": "al_01HZZQQ2R3S4T5V6V7W8X9Y0Z0",
    "object": "access_log",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "accessed_at": "2026-08-30T09:00:00Z",
    "actor": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "actor_principal_id": "prn_01HZZ6Z1A2B3C4D5E6F7G8H9J0",
    "actor_organization": { "type": "organization", "id": "org_01HZX9Z8Y7X6W5V4V3T2S1R0Q0", "display": "Directorate General of Mines Safety" },
    "acting_as": {
      "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
      "post": { "type": "post", "id": "post_01HZYJ8K9T0M1N203P4Q5R6S70", "display": "Deputy Director of Mines Safety, Bilaspur" },
      "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00",
      "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10"
    },
    "purpose": "ROUTINE_INSPECTION",
    "purpose_detail": "Pre-visit review ahead of the 7 September inspection",
    "resource": { "type": "obligation_instance", "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00", "display": "Plantation over 40 hectares — FY 2026-27" },
    "object_type": "obligation_instance",
    "object_id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "projection": "PUBLISHED",
    "granted": true,
    "denial_reason": null,
    "request_id": "req_01HZZ7A2B3C4D5E6F7G8H9J0K0",
    "trace_id": "9c1a4b2e7d05f83b6a2e9d7c4f1b8e30",
    "policy_version": 5,
    "extensions": {},
    "links": { "self": "/api/v1/access-log/al_01HZZQQ2R3S4T5V6V7W8X9Y0Z0", "resource": "/api/v1/obligation-instances/oi_01HZYX1Y2Z3A4B5C6D7E8F9G00" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:35:00Z" }
}
```

### Response — 200 OK, denied

```json
{
  "success": true,
  "data": {
    "id": "al_01HZZRR3S4T5V6V7W8X9Y0Z1A0",
    "object": "access_log",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "accessed_at": "2026-08-30T09:05:00Z",
    "actor": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "acting_as": { "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50", "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00", "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10" },
    "purpose": "ROUTINE_INSPECTION",
    "resource": { "type": "obligation_instance", "id": "oi_01HZZSS4T5V6V7W8X9Y0Z1A2B0" },
    "object_type": "obligation_instance",
    "object_id": "oi_01HZZSS4T5V6V7W8X9Y0Z1A2B0",
    "mine": { "type": "mine", "id": "mine_01HZYT0M1N203P4Q5R6S7T8V90", "display": "Kusmunda OCP" },
    "projection": null,
    "granted": false,
    "denial_reason": { "code": "OUTSIDE_JURISDICTION", "detail": "jur_01HZYC2D3E4F5G6H7J8K9T0M10 does not cover mine_01HZYT0M1N203P4Q5R6S7T8V90 at 2026-08-30T09:05:00Z", "http_status": 404 },
    "request_id": "req_01HZZ8B3C4D5E6F7G8H9J0K1T0",
    "policy_version": 5,
    "links": { "self": "/api/v1/access-log/al_01HZZRR3S4T5V6V7W8X9Y0Z1A0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:35:00Z" }
}
```

The denied row records `http_status: 404` — what the caller actually received, since a cross-scope object returns `NOT_FOUND` rather than `FORBIDDEN` — alongside the real reason, `OUTSIDE_JURISDICTION`. The caller learns nothing; the audit trail records everything. That gap is deliberate and is the whole point of the 404/403 conflation.

---

## GET /access-log

**Auth:** the same self / `access_log.read` / platform-audit policy, applied per row.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[object_type]` · `filter[object_id]` | `obligation_instance` / `oi_01H…` | |
| `filter[actor_person_id]` | `per_01H…` | |
| `filter[actor_organization_id]` | `org_01H…` | Every read by one authority |
| `filter[mine_id]` | `mine_01H…` | The mine's own accountability view |
| `filter[purpose]` | `ROUTINE_INSPECTION` | |
| `filter[granted]` | `false` | Denied attempts |
| `filter[accessed_at][gte]` · `[lte]` | `2026-08-01T00:00:00Z` | |
| `filter[denial_reason.code]` | `OUTSIDE_JURISDICTION` | |
| `cursor` / `limit` | | Cursor-paginated |
| `group_by` + `metrics` | `group_by=actor_person_id,granted&metrics=count` | The repeated-denial sweep |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "al_01HZZQQ2R3S4T5V6V7W8X9Y0Z0",
      "object": "access_log",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "accessed_at": "2026-08-30T09:00:00Z",
      "actor": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
      "purpose": "ROUTINE_INSPECTION",
      "object_type": "obligation_instance",
      "object_id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
      "granted": true,
      "links": { "self": "/api/v1/access-log/al_01HZZQQ2R3S4T5V6V7W8X9Y0Z0" }
    },
    {
      "id": "al_01HZZRR3S4T5V6V7W8X9Y0Z1A0",
      "object": "access_log",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "accessed_at": "2026-08-30T09:05:00Z",
      "actor": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
      "purpose": "ROUTINE_INSPECTION",
      "object_type": "obligation_instance",
      "object_id": "oi_01HZZSS4T5V6V7W8X9Y0Z1A2B0",
      "granted": false,
      "denial_reason": { "code": "OUTSIDE_JURISDICTION" },
      "links": { "self": "/api/v1/access-log/al_01HZZRR3S4T5V6V7W8X9Y0Z1A0" }
    }
  ],
  "pagination": { "next_cursor": "eyJ0IjoiMjAyNi0wOC0zMFQwOTowNTowMFoiLCJpIjoiYWxfMDFIWlpSUjNTNFQ1VTZWN1c4WDlZMFoxQSJ9", "has_more": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:40:00Z" }
}
```

### Aggregate — `?group_by=actor_person_id,granted&metrics=count&filter[granted]=false`

```json
{
  "success": true,
  "data": [
    { "key": { "actor_person_id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "granted": false }, "metrics": { "count": 47 } },
    { "key": { "actor_person_id": "per_01HZZ99K0T1M2N304P5Q6R7S80", "granted": false }, "metrics": { "count": 3 } }
  ],
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T15:40:00Z", "grouped_by": ["actor_person_id", "granted"], "metrics": ["count"] }
}
```

Forty-seven denials from one officer in a month is the query `access_log_denied_idx` (`data-model.md §6.2`) exists to make cheap — *a repeated denied access is more interesting than a granted one* (`authorization-spec.md §8`).

---

## Invariants

- Read-only. Audit and access rows are written by the domain transaction boundary, never through this API.
- Every audit row names the **office** as well as the person, and the authority relied on.
- Denied reads are logged with their real reason and the status the caller actually saw. The caller learns nothing; the record keeps everything.
- Clipped audit results report how many rows were omitted rather than appearing complete.
- Temporal reads live on the resource (`?as_of=`, `/history`), not on a bespoke audit route.
- `outbox_event` is never exposed. It is delivery plumbing, and reading it would invite treating it as a record.

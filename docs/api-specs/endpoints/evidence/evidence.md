# Evidence — offline-first capture, sync, and read

Table: `evidence` (`data-model.md §4`). ReBAC: `evidence` type — `can_capture: internal_viewer or contractor_capturer from at_mine`, `viewer: captured_by or viewer from for_instance/for_capa/for_defect`, `published_viewer: published_viewer from at_mine`, `can_override_verdict: manager from at_mine` (`authorization-spec.md §3`). Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/field-operations/field-capture-spec.md`](../../../features/field-operations/field-capture-spec.md).

Capture and read decisions use current capabilities, affiliation/engagement, target resource, and regulator mandate/jurisdiction from [`../../../architecture/identity-authority-model.md`](../../../architecture/identity-authority-model.md). A client-supplied `appointment_ref` is **evidence to validate, never authority by itself**.

**`id` is client-generated** (ULID, not server-assigned) — offline-first capture on the PowerSync Flutter client (`data-model.md §4`). This makes sync an idempotent upsert by design: a retried sync after a dropped connection is a no-op on the second attempt, not a duplicate row.

**`verdict` is always server-computed, never client-submitted.** A device claiming its own trustworthiness is exactly the thing this field exists not to trust.

## Routes

| Route | Purpose |
|---|---|
| `POST /uploads` with `purpose: "EVIDENCE_CAPTURE"` | Presigned targets for captured media bytes |
| `POST /evidence/sync` | Idempotent upsert of one or many captured records |
| `GET /evidence` · `GET /evidence/{id}` · `GET /evidence/{id}/history` | Read |
| `POST /evidence/{id}/actions` | Download URL, relink to a target, override verdict |

`GET /evidence/{id}/download-url` is `action: "REQUEST_DOWNLOAD_URL"` — a signed URL issue is an authorization decision with an access-log side effect, not a plain read.

---

## POST /uploads — `EVIDENCE_CAPTURE`

**Auth:** `evidence.capture` on the target mine. Contractor callers additionally require a current affiliation and an engagement permitting capture.

This is the evidence-purpose variant of the shared upload transport. `purpose` selects this request schema and capability check. It accepts a batch because a device coming back from a shift underground has a queue, not one file.

### Request

```json
{
  "purpose": "EVIDENCE_CAPTURE",
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "items": [
    { "client_ref": "1", "media_type": "PHOTO", "declared_content_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3", "byte_size": 3120940, "content_type": "image/jpeg" },
    { "client_ref": "2", "media_type": "VIDEO", "declared_content_hash": "sha256:7d1a9c4e2f6b830d5ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c", "byte_size": 41288302, "content_type": "video/mp4" }
  ]
}
```

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "client_ref": "1",
        "upload_token": "ut_01HZZCC1D2E3F4G5H6J7K8T9M0",
        "presigned_put_url": "https://s3.strata-originals.internal/sha256%3A2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3?X-Amz-Signature=…",
        "method": "PUT",
        "required_headers": { "Content-Type": "image/jpeg", "x-amz-checksum-sha256": "K4weP0pdbn+AkaKzxNXm96i5wNHi86S1xtfo+aCxwtM=" },
        "storage_bucket": "strata-originals",
        "storage_key": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
        "expires_at": "2026-08-30T12:15:00Z",
        "already_present": false
      },
      {
        "client_ref": "2",
        "upload_token": "ut_01HZZDD2E3F4G5H6J7K8T9M0N1",
        "presigned_put_url": null,
        "storage_bucket": "strata-originals",
        "storage_key": "sha256:7d1a9c4e2f6b830d5ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c",
        "expires_at": "2026-08-30T12:15:00Z",
        "already_present": true
      }
    ]
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T12:00:00Z" }
}
```

`already_present: true` means the bytes are already stored — the device skips the PUT and goes straight to sync with the token. On a genuinely offline device this call itself waits for connectivity; **capture happens locally regardless** (`field-capture-spec.md §9`), and only the upload needs a network.

---

## POST /evidence/sync

**Auth:** `evidence.capture` on the mine, **re-evaluated at sync time** — not at capture time, because a contractor's engagement may have ended in between. A contractor also needs a current affiliation, a current engagement permitting capture, and — when a CAPA or defect is named — a recorded responsible-party relationship to its finding. Standalone capture policy is explicit per engagement and never implies access to unrelated findings.

Idempotent upsert keyed on the client-generated `id`. Safe to retry indefinitely.

### Request

```json
{
  "records": [
    {
      "id": "ev_01HZZDD2E3F4G5H6J7K8T9M0N1",
      "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
      "client_schema_version": 3,
      "appointment_ref": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
      "for_capa_id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "for_instance_id": null,
      "for_defect_id": null,
      "capture_path": "DIRECT",
      "media_type": "PHOTO",
      "upload_token": "ut_01HZZCC1D2E3F4G5H6J7K8T9M0",
      "caption": "Reinstated berm, chainage 1.22 km, looking east",
      "caption_i18n": { "en": "Reinstated berm, chainage 1.22 km, looking east", "hi": "पुनर्स्थापित बर्म, चेनेज 1.22 किमी, पूर्व की ओर" },
      "device": {
        "device_id": "dev_pixel7_a1b2c3",
        "platform": "ANDROID",
        "os_version": "15",
        "app_version": "1.4.0",
        "model": "Pixel 7"
      },
      "chain_sequence": 412,
      "prev_hash": "sha256:9f8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e",
      "device_integrity_verdict": { "provider": "PLAY_INTEGRITY", "deviceIntegrity": "MEETS_DEVICE_INTEGRITY", "appIntegrity": "PLAY_RECOGNIZED", "evaluated_at": "2026-08-30T14:10:01Z" },
      "location": {
        "geometry": { "type": "Point", "coordinates": [82.4817, 22.3300], "srid": 4326 },
        "accuracy_m": "3.5",
        "altitude_m": "297.8",
        "provider": "gps",
        "satellites_used": 11,
        "constellations": ["GPS", "GLONASS", "NAVIC"],
        "is_mock_location": false
      },
      "captured_at_wall": "2026-08-30T14:10:00Z",
      "captured_at_monotonic_ns": 812345678901234,
      "at_asset_id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0",
      "at_subunit_id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0",
      "extensions": {}
    }
  ]
}
```

At most one of `for_instance_id` / `for_capa_id` / `for_defect_id` may be set — the capture-time primary target. All three may be `null` for standalone capture, linked later during review (`data-model.md §4.3` `CHECK`).

`client_schema_version` is the **offline app's own local record schema at capture time**, not the server's. It lets a server that has since rolled forward correctly interpret a record queued by an older app build. It is **never rejected for being old** (`field-capture-spec.md §7`: *version every record; server migrates on receipt, never rejects*) — an older version runs through a server-side migration before insert. Only a version **newer** than the server recognises is an error, because the server has nothing to migrate it down to.

### Response — 200 OK

```json
{
  "success": true,
  "message": "1 record synced",
  "data": {
    "requested": 1,
    "created": 1,
    "replayed": 0,
    "failed": 0,
    "results": [
      {
        "id": "ev_01HZZDD2E3F4G5H6J7K8T9M0N1",
        "status": 201,
        "object": "evidence",
        "version": 1,
        "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
        "state": "VERIFIED",
        "available_actions": ["REQUEST_DOWNLOAD_URL", "RELINK_TARGET"],
        "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
        "captured_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
        "captured_via_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
        "captured_by_organization_id": "org_01HZX5E6F7G8H9J0K1T2M3N400",
        "for_capa_id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
        "for_instance_id": null,
        "for_defect_id": null,
        "capture_path": "DIRECT",
        "media_type": "PHOTO",
        "caption": "Reinstated berm, chainage 1.22 km, looking east",
        "client_schema_version": 3,
        "server_schema_version": 4,
        "migrated_on_receipt": true,
        "content_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
        "byte_size": 3120940,
        "content_type": "image/jpeg",
        "device_id": "dev_pixel7_a1b2c3",
        "chain_sequence": 412,
        "chain_valid": true,
        "is_mock_location": false,
        "location": {
          "geometry": { "type": "Point", "coordinates": [82.4817, 22.3300], "srid": 4326 },
          "accuracy_m": "3.5",
          "provider": "gps",
          "satellites_used": 11,
          "within_mine_geofence": true,
          "distance_to_target_m": "3.2"
        },
        "captured_at_wall": "2026-08-30T14:10:00Z",
        "verified_window_start": "2026-08-30T14:09:52Z",
        "verified_window_end": "2026-08-30T14:10:08Z",
        "server_received_at": "2026-08-30T14:12:30Z",
        "at_asset_id": "ast_01HZY9C0D1E2F3G4H5J6K7T8M0",
        "at_subunit_id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0",
        "verdict": "VERIFIED",
        "verdict_reasons": [],
        "verdict_computed_at": "2026-08-30T14:12:30Z",
        "override_by": null,
        "override_reason": null,
        "synced_at": "2026-08-30T14:12:30Z",
        "created_at": "2026-08-30T14:12:30Z",
        "extensions": {},
        "links": { "self": "/api/v1/evidence/ev_01HZZDD2E3F4G5H6J7K8T9M0N1" }
      }
    ]
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T14:12:30Z",
    "effects": [ { "object": "audit_event", "count": 1, "change": "CREATED" } ]
  }
}
```

A retry of the same `id` returns `status: 200` with `replayed: 1` and the original row — not a duplicate, not an error.

`verdict` is computed server-side from:

| Input | Effect |
|---|---|
| `capture_path` | `IMPORTED` is capped below `VERIFIED` (`data-model.md §4.3` `CHECK`) |
| Hash-chain continuity | `prev_hash` must match this `device_id`'s last row; a break sets `chain_valid: false` |
| `device_integrity_verdict` | A failed attestation degrades the verdict |
| `is_mock_location` | Any mock-location flag degrades to `SUSPECT` |
| Offline-interval plausibility | `captured_at_wall` versus `server_received_at` against `captured_at_monotonic_ns` |

The plausibility check produces `verified_window_start` / `verified_window_end` rather than trusting a single instant — a device that was offline for six hours can prove *when it could have been*, not *exactly when it was*, and the record says so.

### Response — 200 OK, degraded verdict

```json
{
  "success": true,
  "message": "1 record synced with a degraded verdict",
  "data": {
    "requested": 1,
    "created": 1,
    "replayed": 0,
    "failed": 0,
    "results": [
      {
        "id": "ev_01HZZEE3F4G5H6J7K8T9M0N1P2",
        "status": 201,
        "object": "evidence",
        "version": 1,
        "state": "SUSPECT",
        "verdict": "SUSPECT",
        "verdict_reasons": [
          { "code": "MOCK_LOCATION_FLAGGED", "detail": "Device reported is_mock_location = true", "severity": "HIGH" },
          { "code": "CHAIN_SEQUENCE_GAP", "detail": "Expected chain_sequence 413 for dev_pixel7_a1b2c3, received 419", "severity": "MEDIUM" }
        ],
        "chain_valid": false,
        "is_mock_location": true,
        "verified_window_start": null,
        "verified_window_end": null,
        "available_actions": ["REQUEST_DOWNLOAD_URL", "RELINK_TARGET", "OVERRIDE_VERDICT"],
        "links": { "self": "/api/v1/evidence/ev_01HZZEE3F4G5H6J7K8T9M0N1P2" }
      }
    ]
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T14:14:00Z", "effects": [ { "object": "security_event", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

**Evidence is never rejected outright at sync time — only judged.** The row is created whatever the verdict. Rejection, if any, happens later at the closure gate ([`verification-attempts.md`](verification-attempts.md)), where it is a visible, drillable decision rather than a silently dropped upload.

### Errors

| Status | Code | Condition |
|---|---|---|
| 404 | `NOT_FOUND` | `upload_token` unknown, expired, or consumed |
| 409 | `CONFLICT` | Server-verified hash does not match the upload token's `declared_content_hash` |
| 409 | `CONFLICT` | `(device_id, chain_sequence)` already exists with a **different** `id` — a genuine chain collision. A retry with the same `id` is the idempotent case and returns `200`, not `409` |
| 422 | `UNPROCESSABLE` | More than one of `for_instance_id` / `for_capa_id` / `for_defect_id` set |
| 403 | `FORBIDDEN` | Contractor capturer with `for_capa_id`/`for_defect_id` set whose `contractor_org_id` is not the target finding's `responsible_organization_id` |
| 400 | `VALIDATION_ERROR` | `client_schema_version` **newer** than the server recognises — the only direction ever rejected |

Mixed batches return `207 MULTI_STATUS` with per-record `status` in `results`.

---

## GET /evidence/{id} · GET /evidence

**Auth:** captor self-read where policy permits, `evidence.read_internal` on the target, or `evidence.read_published` supported by a current regulator mandate and jurisdiction. Projection differs by capability, and regulator reads are purpose-logged.

Filters: `mine_id`, `captured_by`, `captured_by_organization_id`, `verdict`, `media_type`, `for_capa_id`, `for_instance_id`, `for_defect_id`, `device_id`, `at_asset_id`, `filter[captured_at_wall][gte]`, `filter[is_mock_location]`, `filter[chain_valid]=false`, `filter[geo.near]`, `as_of`.
Expansions: `expand=capa,obligation_instance,defect,captured_by,verification_attempts`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "ev_01HZZDD2E3F4G5H6J7K8T9M0N1",
      "object": "evidence",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "VERIFIED",
      "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "media_type": "PHOTO",
      "caption": "Reinstated berm, chainage 1.22 km, looking east",
      "verdict": "VERIFIED",
      "verdict_reasons": [],
      "captured_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
      "captured_at_wall": "2026-08-30T14:10:00Z",
      "verified_window_start": "2026-08-30T14:09:52Z",
      "verified_window_end": "2026-08-30T14:10:08Z",
      "for_capa_id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
      "content_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
      "location": { "geometry": { "type": "Point", "coordinates": [82.4817, 22.3300], "srid": 4326 }, "accuracy_m": "3.5", "within_mine_geofence": true, "distance_to_target_m": "3.2" },
      "links": { "self": "/api/v1/evidence/ev_01HZZDD2E3F4G5H6J7K8T9M0N1" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 5, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T14:20:00Z" }
}
```

---

## POST /evidence/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `REQUEST_DOWNLOAD_URL` | same decision and projection as read, re-evaluated | optional | no | Short-lived signed URL; `access_event` |
| `RELINK_TARGET` | `evidence.relink` on the mine and read on the new target | **required** | required | Moves a standalone capture onto a CAPA, instance, or defect |
| `OVERRIDE_VERDICT` | `can_override_verdict` (`manager from at_mine`) | **required** | required | Sets `override_by`/`override_reason`; `security_event` |

### REQUEST_DOWNLOAD_URL

```json
{ "action": "REQUEST_DOWNLOAD_URL", "payload": { "purpose": "REGULATORY_REVIEW", "variant": "ORIGINAL" } }
```

```json
{
  "success": true,
  "data": {
    "presigned_get_url": "https://s3.strata-originals.internal/sha256%3A2b8c1e3f…?X-Amz-Signature=…",
    "expires_at": "2026-08-30T12:30:00Z",
    "variant": "ORIGINAL",
    "content_type": "image/jpeg",
    "byte_size": 3120940,
    "content_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
    "bound_to_principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0"
  },
  "meta": {
    "action": "REQUEST_DOWNLOAD_URL",
    "effects": [ { "object": "access_event", "id": "acc_01HZZFF4G5H6J7K8T9M0N1P2Q0", "change": "CREATED", "note": "purpose=REGULATORY_REVIEW" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T12:15:00Z"
  }
}
```

`variant: "ORIGINAL"` returns the untouched bytes whose hash is on the record. `"DERIVED_THUMBNAIL"` and `"DERIVED_REDACTED"` return processed copies with their own hashes — a redacted copy is never presented as the original.

### RELINK_TARGET

```json
{
  "action": "RELINK_TARGET",
  "expected_version": 1,
  "reason": "Standalone capture from the 30 August walkover; matched to the berm CAPA during review",
  "payload": { "for_capa_id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "for_instance_id": null, "for_defect_id": null }
}
```

```json
{
  "success": true,
  "message": "Evidence relinked",
  "data": {
    "id": "ev_01HZZGG4H5J6K7T8M9N0P1Q2R0",
    "object": "evidence",
    "version": 2,
    "state": "VERIFIED",
    "for_capa_id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
    "for_instance_id": null,
    "for_defect_id": null,
    "location": { "geometry": { "type": "Point", "coordinates": [82.4817, 22.3300], "srid": 4326 }, "distance_to_target_m": "3.2", "within_mine_geofence": true },
    "available_actions": ["REQUEST_DOWNLOAD_URL", "RELINK_TARGET"]
  },
  "meta": {
    "action": "RELINK_TARGET",
    "transition": null,
    "effects": [
      { "object": "evidence", "id": "ev_01HZZGG4H5J6K7T8M9N0P1Q2R0", "change": "DISTANCE_RECOMPUTED", "note": "distance_to_target_m recalculated against the new target's location" },
      { "object": "audit_event", "id": "aud_01HZZHH5J6K7T8M9N0P1Q2R3S0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T16:00:00Z"
  }
}
```

Relinking recomputes `distance_to_target_m` against the new target. It does **not** recompute `verdict` — the device's trustworthiness at capture time is a fact about the capture, not about what the evidence was later used for.

### OVERRIDE_VERDICT

```json
{
  "action": "OVERRIDE_VERDICT",
  "expected_version": 1,
  "reason": "Known GPS drift bug on this handset build produced a false mock-location flag; corroborated against the RFID cap-lamp log for the same timestamps",
  "payload": { "new_verdict": "VERIFIED", "corroborating_references": [{ "type": "attendance_event", "id": "att_01HZZ45E6F7G8H9J0K1T2M3N40" }] }
}
```

```json
{
  "success": true,
  "message": "Verdict overridden",
  "data": {
    "id": "ev_01HZZEE3F4G5H6J7K8T9M0N1P2",
    "object": "evidence",
    "version": 2,
    "state": "VERIFIED",
    "verdict": "VERIFIED",
    "verdict_before_override": "SUSPECT",
    "verdict_reasons": [
      { "code": "MOCK_LOCATION_FLAGGED", "detail": "Device reported is_mock_location = true", "severity": "HIGH", "overridden": true }
    ],
    "override_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "override_reason": "Known GPS drift bug on this handset build produced a false mock-location flag; corroborated against the RFID cap-lamp log for the same timestamps",
    "override_at": "2026-08-30T16:10:00Z",
    "available_actions": ["REQUEST_DOWNLOAD_URL", "RELINK_TARGET"]
  },
  "meta": {
    "action": "OVERRIDE_VERDICT",
    "transition": { "from": "SUSPECT", "to": "VERIFIED" },
    "effects": [
      { "object": "security_event", "id": "sec_01HZZ115J6K7T8M9N0P1Q2R3T0", "change": "CREATED" },
      { "object": "notification", "count": 2, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZJJ6K7T8M9N0P1Q2R3S4V0", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T16:10:00Z"
  }
}
```

`verdict_before_override` survives forever, and the overridden reason stays in the list marked `overridden: true`. Nothing is erased — the original machine judgment and the human decision to set it aside are both permanently on the record.

An override never clears a **distance** failure. `distance_to_target_m` is a physical measurement, not a trust judgment, and `can_override_verdict` applies only to `verdict`.

---

## Invariants

- `id` is client-generated so sync is an idempotent upsert. A retry is never a duplicate.
- `verdict` is server-computed; a device's claim about itself is an input, never the answer.
- Evidence is never rejected at sync. It is stored with its verdict and judged at the closure gate.
- An older `client_schema_version` is migrated forward on receipt; only a newer one is refused.
- Offline plausibility yields a **window**, not a false instant.
- Overriding a verdict is loudly logged and preserves what it overrode. Distance can never be overridden.

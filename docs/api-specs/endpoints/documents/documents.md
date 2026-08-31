# Documents — blobs, documents, versions, filings, and publication

Immutable bytes (`document_blob`) are separated from logical documents (`document`), their versions (`document_version`), and their filing/applicability contexts (`document_filing`). One blob may support several document registrations without conflating tenant, mine, authority, or workflow state.

Tables: `document_blob`, `document`, `document_version`, `document_filing`, `document_segment`, `signature_event` (`data-model.md §2`). Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/document-intelligence/pipeline-spec.md`](../../../features/document-intelligence/pipeline-spec.md).

## Routes

| Route | Purpose |
|---|---|
| `POST /uploads` with `purpose: "DOCUMENT_ORIGINAL"` | Presigned upload target for immutable document bytes |
| `GET /documents` · `POST /documents` | Register and search documents |
| `GET /documents/{id}` · `PATCH /documents/{id}` · `POST /documents/{id}/actions` · `GET /documents/{id}/history` | Document lifecycle |
| `GET /documents?view=segments` | Extracted text/geometry segments across documents |
| `GET /document-filings` · `POST /document-filings` · `POST /document-filings/{id}/actions` | Add or withdraw a filing context after registration |

`GET /documents/{id}/processing-jobs` is gone — it is `GET /operations?filter[target.id]=doc_01H…`, the platform-wide async status collection. `GET /documents/{id}/segments` is `GET /documents/{id}?expand=segments` or `GET /documents?view=segments&filter[document_id]=doc_01H…`. `POST /documents/{id}/publish|sign|withdraw` are `action` values.

---

## POST /uploads — `DOCUMENT_ORIGINAL`

**Auth:** `document.upload` on the intended filing target, resolved server-side from `intended_filings`. `Idempotency-Key` required.

This is the document-purpose variant of the shared upload transport. `purpose` selects this request schema and capability check; it does not grant document access.

### Request

```json
{
  "purpose": "DOCUMENT_ORIGINAL",
  "content_type": "application/pdf",
  "byte_size": 4718592,
  "sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
  "filename": "EC_amendment_Gevra_2026.pdf",
  "intended_filings": [{ "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }, "purpose": "ISSUED_TO" }],
  "page_count_hint": 34,
  "client": { "platform": "WEB", "app_version": "1.4.0" }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Upload target issued",
  "data": {
    "upload_token": "upl_01HZZ0A1B2C3D4E5F6G7H8J9K0",
    "upload_url": "https://blob.strata.gov.in/staging/01HZZ0A1B2C3D4E5F6G7H8J9K?X-Amz-Signature=…",
    "method": "PUT",
    "required_headers": { "Content-Type": "application/pdf", "x-amz-checksum-sha256": "nyyLGk59BTa8gq+RTQ57M1ChxtnifrQIxaPR6fCyxKY=" },
    "expires_at": "2026-08-30T11:15:00Z",
    "max_byte_size": 4718592,
    "blob_reuse": { "reused": false, "existing_blob_id": null },
    "next": { "method": "POST", "url": "/api/v1/documents", "note": "Register the document with this upload_token after the PUT succeeds" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:00:00Z" }
}
```

When identical bytes already exist, `blob_reuse.reused` is `true` and `upload_url` is `null` — the client skips the PUT and registers directly with the token. Deduplication reuses **bytes only**; it never reuses another document's authorization, filings, or metadata.

---

## POST /documents

**Auth:** `document.upload` on every initial filing target. Regulator issuance additionally requires an appropriate authority mandate and jurisdiction covering each target. `Idempotency-Key` required.

### Request — operator upload

```json
{
  "upload_token": "upl_01HZZ0A1B2C3D4E5F6G7H8J9K0",
  "title": "Environmental Clearance amendment — Gevra OCP capacity expansion",
  "title_i18n": { "en": "Environmental Clearance amendment — Gevra OCP capacity expansion", "hi": "पर्यावरण स्वीकृति संशोधन — गेवरा ओसीपी क्षमता विस्तार" },
  "document_type_code": "ENVIRONMENTAL_CLEARANCE",
  "doc_class": "OPERATOR_UPLOAD",
  "language": "en",
  "document_date": "2026-08-14",
  "reference_number": "J-11015/122/2008-IA.II(M)",
  "filings": [{ "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }, "purpose": "APPLIES_TO" }],
  "issuer": null,
  "supersedes_document_version_id": "dv_01HZZ1B2C3D4E5F6G7H8J9K0T0",
  "processing": { "extract": true, "extractors": ["obligation@v3"], "ocr_language_hints": ["en", "hi"] },
  "extensions": {}
}
```

### Request — regulator issuance

```json
{
  "upload_token": "upl_01HZZ2C3D4E5F6G7H8J9K0T1M0",
  "title": "Inspection direction dated 30 August 2026",
  "document_type_code": "REGULATORY_DIRECTION",
  "doc_class": "REGULATOR_ISSUANCE",
  "language": "en",
  "document_date": "2026-08-30",
  "reference_number": "DGMS/BSP/DIR/2026/0441",
  "filings": [
    { "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }, "purpose": "ISSUED_TO" },
    { "target": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0" }, "purpose": "COPY_TO" }
  ],
  "issuer": {
    "regulatory_authority_id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00",
    "authority_unit_id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20",
    "issuing_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
    "issued_on": "2026-08-30",
    "response_due_on": "2026-09-14"
  },
  "supersedes_document_version_id": null,
  "processing": { "extract": true, "extractors": ["obligation@v3", "observation@v2"], "ocr_language_hints": ["en"] },
  "extensions": {}
}
```

The server verifies object hash and size, creates or reuses the immutable blob, creates document/version/filing rows, validates issuer authority against the named appointment's mandate and jurisdiction, and queues scanning/extraction — all atomically. `issuer` is omitted for non-authority documents; supplying it without the matching mandate is `403 FORBIDDEN`.

Supersession requires the same logical document or an explicit linkage policy. It is deliberately **not** restricted to one mine, because a document may have several filing contexts.

### Response — 201 Created

`Location: /api/v1/documents/doc_01HZZ3D4E5F6G7H8J9K0T1M2N0`

```json
{
  "success": true,
  "message": "Document registered; extraction queued",
  "data": {
    "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
    "object": "document",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PROCESSING",
    "available_actions": ["WITHDRAW"],
    "title": "Inspection direction dated 30 August 2026",
    "title_i18n": { "en": "Inspection direction dated 30 August 2026" },
    "document_type_code": "REGULATORY_DIRECTION",
    "doc_class": "REGULATOR_ISSUANCE",
    "language": "en",
    "document_date": "2026-08-30",
    "reference_number": "DGMS/BSP/DIR/2026/0441",
    "current_version": {
      "id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300",
      "object": "document_version",
      "version_number": 1,
      "blob_id": "blob_01HZZ5F6G7H8J9K0T1M2N304P0",
      "sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
      "byte_size": 4718592,
      "content_type": "application/pdf",
      "page_count": 3,
      "status": "PROCESSING",
      "scan_result": "PENDING",
      "created_at": "2026-08-30T11:05:00Z"
    },
    "filings": [
      { "id": "dfil_01HZZ6G7H8J9K0T1M2N304P5Q0", "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" }, "purpose": "ISSUED_TO", "state": "ACTIVE", "filed_at": "2026-08-30T11:05:00Z" },
      { "id": "dfil_01HZZ7H8J9K0T1M2N304P5Q6R0", "target": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "SECL" }, "purpose": "COPY_TO", "state": "ACTIVE", "filed_at": "2026-08-30T11:05:00Z" }
    ],
    "issuer": {
      "regulatory_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
      "authority_unit": { "type": "authority_unit", "id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20", "display": "Bilaspur Region" },
      "issuing_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
      "issuing_person": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
      "issued_on": "2026-08-30",
      "response_due_on": "2026-09-14",
      "authority_verified": true
    },
    "supersedes_document_version_id": null,
    "superseded_by_document_version_id": null,
    "contractor_org_id": null,
    "counts": { "versions": 1, "filings": 2, "segments": 0, "extractions": 0, "signatures": 0 },
    "published_at": null,
    "withdrawn_at": null,
    "created_at": "2026-08-30T11:05:00Z",
    "created_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "updated_at": "2026-08-30T11:05:00Z",
    "updated_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "extensions": {},
    "links": {
      "self": "/api/v1/documents/doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
      "history": "/api/v1/documents/doc_01HZZ3D4E5F6G7H8J9K0T1M2N0/history",
      "extractions": "/api/v1/extractions?filter[document_id]=doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
      "operations": "/api/v1/operations?filter[target.id]=doc_01HZZ3D4E5F6G7H8J9K0T1M2N0"
    }
  },
  "included": {
    "operation:op_01HZZ8J9K0T1M2N304P5Q6R7S0": {
      "id": "op_01HZZ8J9K0T1M2N304P5Q6R7S0",
      "object": "operation",
      "status": "QUEUED",
      "kind": "document.process",
      "target": { "type": "document", "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0" },
      "stages": ["VIRUS_SCAN", "OCR", "SEGMENT", "EXTRACT"],
      "progress": { "completed": 0, "total": 4, "percent": 0 },
      "links": { "self": "/api/v1/operations/op_01HZZ8J9K0T1M2N304P5Q6R7S0" }
    }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T11:05:00Z",
    "effects": [
      { "object": "document_blob", "id": "blob_01HZZ5F6G7H8J9K0T1M2N304P0", "change": "CREATED" },
      { "object": "document_version", "id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300", "change": "CREATED" },
      { "object": "document_filing", "count": 2, "change": "CREATED" },
      { "object": "operation", "id": "op_01HZZ8J9K0T1M2N304P5Q6R7S0", "change": "CREATED" },
      { "object": "notification", "count": 4, "change": "CREATED", "note": "Regulator issuance notified to the receiving mine's responsible posts" },
      { "object": "audit_event", "id": "aud_01HZZ9K0T1M2N304P5Q6R7S8T0", "change": "CREATED" }
    ]
  }
}
```

---

## GET /documents/{id}

**Auth:** `document.read_internal` or `document.read_published` on at least one filing context, uploader/party policy where applicable, and authority/jurisdiction rules for regulator access. The response includes **only authorised filings** — a document filed to three mines shows one filing to a caller authorised on one.

Query: `expand=segments,extractions,versions,signatures,operations`, `fields[document]`, `as_of`.

### Response — 200 OK, `?expand=segments`

```json
{
  "success": true,
  "data": {
    "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
    "object": "document",
    "version": 4,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "NEEDS_REVIEW",
    "available_actions": ["PUBLISH", "WITHDRAW", "REPROCESS"],
    "title": "Inspection direction dated 30 August 2026",
    "document_type_code": "REGULATORY_DIRECTION",
    "doc_class": "REGULATOR_ISSUANCE",
    "language": "en",
    "document_date": "2026-08-30",
    "reference_number": "DGMS/BSP/DIR/2026/0441",
    "current_version": {
      "id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300",
      "object": "document_version",
      "version_number": 1,
      "blob_id": "blob_01HZZ5F6G7H8J9K0T1M2N304P0",
      "sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
      "byte_size": 4718592,
      "content_type": "application/pdf",
      "page_count": 3,
      "status": "NEEDS_REVIEW",
      "scan_result": "CLEAN",
      "ocr_confidence": 0.972,
      "created_at": "2026-08-30T11:05:00Z"
    },
    "filings": [
      { "id": "dfil_01HZZ6G7H8J9K0T1M2N304P5Q0", "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" }, "purpose": "ISSUED_TO", "state": "ACTIVE", "filed_at": "2026-08-30T11:05:00Z" }
    ],
    "issuer": {
      "regulatory_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
      "authority_unit": { "type": "authority_unit", "id": "aunit_01HZXC3D4E5F6G7H8J9K0T1M20", "display": "Bilaspur Region" },
      "issuing_appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50",
      "issued_on": "2026-08-30",
      "response_due_on": "2026-09-14",
      "authority_verified": true
    },
    "segments": [
      {
        "id": "seg_01HZZA0B1C2D3E4F5G6H7J8K90",
        "object": "document_segment",
        "document_version_id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300",
        "sequence": 12,
        "page": 2,
        "anchor": "cond_17__b",
        "text": "The lessee shall undertake plantation over 40 hectares within the lease boundary and submit a survival report within 30 days of the close of each financial year.",
        "char_range": { "start": 18422, "end": 18581 },
        "bbox": { "page": 2, "x": 72.0, "y": 418.5, "width": 451.2, "height": 38.4, "unit": "PT" },
        "provenance_hash": "sha256:4c1e9a7f2b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8"
      }
    ],
    "supersedes_document_version_id": null,
    "superseded_by_document_version_id": null,
    "contractor_org_id": null,
    "counts": { "versions": 1, "filings": 1, "segments": 41, "extractions": 7, "signatures": 0 },
    "published_at": null,
    "withdrawn_at": null,
    "projection": "INTERNAL",
    "redacted_fields": [],
    "created_at": "2026-08-30T11:05:00Z",
    "created_by": { "type": "person", "id": "per_01HZYH7J8K9T0M1N203P4Q5R60", "display": "A. Banerjee" },
    "updated_at": "2026-08-30T11:09:00Z",
    "updated_by": { "type": "principal", "id": "prn_01HZZB1C2D3E4F5G6H7J8K9T00", "display": "strata-extraction-worker" },
    "extensions": {},
    "links": { "self": "/api/v1/documents/doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "download_url": "/api/v1/documents/doc_01HZZ3D4E5F6G7H8J9K0T1M2N0/actions" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:10:00Z", "as_of": null }
}
```

---

## GET /documents

**Auth:** results clipped to authorised filing targets. One document appears **once** even when several authorised filings match; the response reports the matching filing references so the client can explain why it appeared.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[filing.target.type]` + `filter[filing.target.id]` | `mine` / `mine_01H…` | |
| `filter[filing.purpose]` | `ISSUED_TO,APPLIES_TO` | |
| `filter[document_type_code]` | `REGULATORY_DIRECTION` | |
| `filter[doc_class]` | `REGULATOR_ISSUANCE` | |
| `filter[state]` | `NEEDS_REVIEW,PUBLISHED` | |
| `filter[issuer.regulatory_authority_id]` | `auth_01H…` | |
| `filter[document_date][gte]` · `[lte]` | `2026-04-01` | |
| `filter[response_due_on][lte]` | `2026-09-30` | Directions needing a reply |
| `filter[reference_number]` | `DGMS/BSP/DIR/2026/0441` | |
| `filter[sha256]` | `9f2c…` | Duplicate-bytes lookup |
| `q` | `q=plantation berm` | Full text over title, reference, and segment text |
| `sort` | `-document_date`, `-created_at` | |
| `group_by` + `metrics` | `group_by=document_type_code,state&metrics=count` | |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
      "object": "document",
      "version": 4,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "NEEDS_REVIEW",
      "title": "Inspection direction dated 30 August 2026",
      "document_type_code": "REGULATORY_DIRECTION",
      "doc_class": "REGULATOR_ISSUANCE",
      "document_date": "2026-08-30",
      "reference_number": "DGMS/BSP/DIR/2026/0441",
      "issuer": { "regulatory_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" } },
      "matched_filings": [
        { "id": "dfil_01HZZ6G7H8J9K0T1M2N304P5Q0", "target": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" }, "purpose": "ISSUED_TO" }
      ],
      "counts": { "extractions": 7, "segments": 41 },
      "links": { "self": "/api/v1/documents/doc_01HZZ3D4E5F6G7H8J9K0T1M2N0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:12:00Z" }
}
```

---

## POST /documents/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `REQUEST_DOWNLOAD_URL` | same projection decision as read, re-evaluated | optional | no | any readable state | `access_event`, purpose-logged where regulator policy requires |
| `PUBLISH` | `document.publish` on the relevant filings | optional | **required** | `NEEDS_REVIEW`, every extraction resolved | Materialises obligations, freezes the version, `outbox_event` |
| `SIGN` | `document.sign` under the filing's policy, recent assurance, valid signing identity | optional | **required** | `PUBLISHED` or policy-permitted | `signature_event`; original bytes untouched |
| `WITHDRAW` | `document.withdraw` under the issuing/owning workflow | **required** | **required** | not already `WITHDRAWN` | `withdrawn_at`, dependent obligation instances flagged |
| `REPROCESS` | `document.review` | **required** | required | `PROCESSING` failed, or `NEEDS_REVIEW` | New `operation`; existing reviewed extractions are preserved unless `discard_reviewed: true` |
| `ADD_VERSION` | `document.upload` on every filing | **required** | **required** | not `WITHDRAWN` | New `document_version` from a fresh `upload_token`; previous version retained |

### Request — REQUEST_DOWNLOAD_URL

```json
{
  "action": "REQUEST_DOWNLOAD_URL",
  "payload": { "document_version_id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300", "purpose": "REGULATORY_REVIEW", "disposition": "inline" }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "download_url": "https://blob.strata.gov.in/doc/01HZZ5F6G7H8J9K0L1M2N3O4P?X-Amz-Signature=…",
    "expires_at": "2026-08-30T11:20:00Z",
    "content_type": "application/pdf",
    "byte_size": 4718592,
    "sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "bound_to_principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
    "watermark": { "applied": true, "text": "A. Banerjee · DGMS · 2026-08-30T11:15Z" }
  },
  "meta": {
    "action": "REQUEST_DOWNLOAD_URL",
    "effects": [ { "object": "access_event", "id": "acc_01HZZC2D3E4F5G6H7J8K9T0M10", "change": "CREATED", "note": "purpose=REGULATORY_REVIEW" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:15:00Z"
  }
}
```

The URL is short-lived and bound to the current principal and blob. It is not a shareable link.

### Request — PUBLISH

```json
{
  "action": "PUBLISH",
  "expected_version": 4,
  "payload": {
    "document_version_id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300",
    "effective_from": "2026-09-01T00:00:00Z",
    "require_signature": false,
    "materialisation": { "dry_run": false, "period_horizon": "P2Y" }
  }
}
```

Requires `expected_version`, resolution of every extraction (`ACCEPTED`, `EDITED`, `REJECTED`, `MARKED_NOT_APPLICABLE`, `SPLIT`, or `MERGED` — never `PROPOSED`), and the filing's signature policy. Publication is immutable and materialises applicable obligations transactionally, outbox-driven.

### Response — 200 OK

```json
{
  "success": true,
  "message": "Document published; 3 obligations and 6 instances materialised",
  "data": {
    "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
    "object": "document",
    "version": 5,
    "state": "PUBLISHED",
    "published_at": "2026-08-30T11:25:00Z",
    "available_actions": ["REQUEST_DOWNLOAD_URL", "SIGN", "WITHDRAW", "ADD_VERSION"]
  },
  "meta": {
    "action": "PUBLISH",
    "transition": { "from": "NEEDS_REVIEW", "to": "PUBLISHED" },
    "materialisation_summary": {
      "obligations_created": 3,
      "obligations_superseded": 1,
      "instances_created": 6,
      "instances_blocked": 1,
      "blocked": [
        { "obligation_id": "obl_01HZZD3E4F5G6H7J8K9T0M1N20", "reason": "UNRESOLVED_APPLICABILITY", "applicability_rule_id": "oar_01HZZE4F5G6H7J8K9T0M1N2030", "resolution": "PATCH the rule via /obligations/{id}/actions RESOLVE_APPLICABILITY" }
      ],
      "conflicts_detected": 1
    },
    "effects": [
      { "object": "obligation", "count": 3, "change": "CREATED" },
      { "object": "obligation", "count": 1, "change": "SUPERSEDED" },
      { "object": "obligation_instance", "count": 6, "change": "CREATED" },
      { "object": "obligation_conflict", "count": 1, "change": "CREATED" },
      { "object": "notification", "count": 9, "change": "CREATED" },
      { "object": "outbox_event", "count": 11, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZF5G6H7J8K9T0M1N203P40", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:25:00Z"
  }
}
```

`instances_blocked` is returned rather than defaulted. An unresolved applicability rule never silently becomes `ALWAYS` — "a wrong obligation is worse than a missing one."

### Response — 409 Unresolved extractions

```json
{
  "success": false,
  "message": "Cannot publish while extractions remain unreviewed",
  "error": {
    "code": "INVALID_STATE",
    "details": {
      "current_state": "NEEDS_REVIEW",
      "unresolved_extraction_count": 2,
      "unresolved_extraction_ids": ["ext_01HZZG6H7J8K9T0M1N203P4Q50", "ext_01HZZH7J8K9T0M1N203P4Q5R60"],
      "resolution": "Resolve each via POST /extractions/{id}/actions"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### Request — SIGN

```json
{
  "action": "SIGN",
  "expected_version": 5,
  "payload": {
    "document_version_id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300",
    "signing_identity_id": "sign_01HZY8H9J0K1T2M3N405P6Q7R0",
    "payload_hash": "sha256:1a4f9c2e7b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8",
    "purpose": "ATTESTATION",
    "provider_result_ref": "emudhra:txn:7f21c9a4-3b55-4d0e-9a2f-1c8b7d6e5f40"
  }
}
```

The server **recomputes** the canonical payload hash and refuses a mismatch with `422 UNPROCESSABLE`. Signing produces a `signature_event`; it never mutates the original bytes.

### Response — 200 OK

```json
{
  "success": true,
  "message": "Document signed",
  "data": { "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "object": "document", "version": 6, "state": "PUBLISHED", "counts": { "signatures": 1 } },
  "included": {
    "signature_event:sig_01HZZJ8K9T0M1N203P4Q5R6S70": {
      "id": "sig_01HZZJ8K9T0M1N203P4Q5R6S70",
      "object": "signature_event",
      "signing_identity_id": "sign_01HZY8H9J0K1T2M3N405P6Q7R0",
      "signer": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
      "document_version_id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300",
      "payload_hash": "sha256:1a4f9c2e7b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8",
      "purpose": "ATTESTATION",
      "signed_at": "2026-08-30T11:30:00Z",
      "verification_result": "VALID",
      "certificate_fingerprint_sha256": "9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6"
    }
  },
  "meta": {
    "action": "SIGN",
    "effects": [ { "object": "signature_event", "id": "sig_01HZZJ8K9T0M1N203P4Q5R6S70", "change": "CREATED" }, { "object": "audit_event", "id": "aud_01HZZK9T0M1N203P4Q5R6S7T80", "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:30:00Z"
  }
}
```

### Request — WITHDRAW

```json
{
  "action": "WITHDRAW",
  "expected_version": 6,
  "reason": "Superseded by corrigendum DGMS/BSP/DIR/2026/0447 issued 2026-09-02",
  "effective_at": "2026-09-02T00:00:00Z",
  "payload": { "replacement_document_id": "doc_01HZZT0M1N203P4Q5R6S7T8V90", "obligation_instance_disposition": "SUSPEND" },
  "supporting_authority": { "appointment_id": "app_01HZYG6H7J8K9T0M1N203P4Q50", "mandate_assignment_id": "mand_01HZYB1C2D3E4F5G6H7J8K9T00", "jurisdiction_assignment_id": "jur_01HZYC2D3E4F5G6H7J8K9T0M10", "delegation_id": null, "break_glass_grant_id": null }
}
```

Regulator-issued records require the **issuing authority's** mandate. An operator cannot withdraw them and receives `403 FORBIDDEN` — the same rule that blocks operator publication of regulator issuance.

### Response — 200 OK

```json
{
  "success": true,
  "message": "Document withdrawn",
  "data": { "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "object": "document", "version": 7, "state": "WITHDRAWN", "withdrawn_at": "2026-09-02T00:00:00Z", "available_actions": [] },
  "meta": {
    "action": "WITHDRAW",
    "transition": { "from": "PUBLISHED", "to": "WITHDRAWN" },
    "effects": [
      { "object": "obligation_instance", "count": 6, "change": "STATE", "to": "SUSPENDED" },
      { "object": "obligation", "count": 3, "change": "STATE", "to": "INACTIVE" },
      { "object": "notification", "count": 9, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZM1N203P4Q5R6S7T8V9V00", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-02T00:00:00Z"
  }
}
```

---

## GET /documents?view=segments

**Auth:** `document.review` on the parent document's authorised filing, or a published-read projection that permits source clauses.

Filters: `document_id`, `document_version_id`, `page`, `anchor`, `q` (full text), `filter[has_extraction]`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "seg_01HZZA0B1C2D3E4F5G6H7J8K90",
      "object": "document_segment",
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "document_id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
      "document_version_id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300",
      "sequence": 12,
      "page": 2,
      "anchor": "cond_17__b",
      "text": "The lessee shall undertake plantation over 40 hectares within the lease boundary and submit a survival report within 30 days of the close of each financial year.",
      "text_i18n": { "en": "The lessee shall undertake plantation over 40 hectares…" },
      "char_range": { "start": 18422, "end": 18581 },
      "bbox": { "page": 2, "x": 72.0, "y": 418.5, "width": 451.2, "height": 38.4, "unit": "PT" },
      "ocr_confidence": 0.981,
      "provenance_hash": "sha256:4c1e9a7f2b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8",
      "extraction_ids": ["ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00"],
      "links": { "self": "/api/v1/documents/segments/seg_01HZZA0B1C2D3E4F5G6H7J8K90" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 41, "total_pages": 3, "has_next": true, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:12:00Z" }
}
```

---

## POST /document-filings

**Auth:** `document.upload` on the new target **and** `document.read_internal` on the document. Adding a filing context after registration — a direction later found to apply to a second mine — is a first-class act with its own audit trail, not a `PATCH` of an array.

### Request

```json
{
  "document_id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
  "target": { "type": "mine", "id": "mine_01HZYB1C2D3E4F5G6H7J8K9T00" },
  "purpose": "APPLIES_TO",
  "reason": "Cluster clearance covers Dipka; condition 17(b) binds both mines",
  "materialise_obligations": true
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Filing added; 3 obligation instances materialised for the new target",
  "data": {
    "id": "dfil_01HZZN203P4Q5R6S7T8V9V0W10",
    "object": "document_filing",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["WITHDRAW_FILING"],
    "document": { "type": "document", "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "display": "Inspection direction dated 30 August 2026" },
    "target": { "type": "mine", "id": "mine_01HZYB1C2D3E4F5G6H7J8K9T00", "display": "Dipka OCP" },
    "purpose": "APPLIES_TO",
    "filed_at": "2026-09-05T10:00:00Z",
    "withdrawn_at": null,
    "created_at": "2026-09-05T10:00:00Z",
    "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "updated_at": "2026-09-05T10:00:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/document-filings/dfil_01HZZN203P4Q5R6S7T8V9V0W10" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-09-05T10:00:00Z",
    "effects": [
      { "object": "obligation_instance", "count": 3, "change": "CREATED" },
      { "object": "notification", "count": 4, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZP3Q4R5S6T7V8V9W0X1Y20", "change": "CREATED" }
    ]
  }
}
```

Actions on a filing: `WITHDRAW_FILING` (reason and `expected_version` required) — ends applicability at a target without touching the document or its other filings.

---

## Document invariants

- Blob deduplication never merges document ownership, authorization, or filing context.
- Original bytes and published versions are immutable. A correction is a new version or a new document, never an edit.
- Authority identifiers are structured foreign keys (`regulatory_authority_id`, `authority_unit_id`, `issuing_appointment_id`), never free-text strings.
- A document may apply to zero, one, or many mines; a national rule needs no fake mine.
- Every read and write authorizes the particular filing and version, not just a blob hash.
- Regulator-issued documents cannot be published, edited, or withdrawn by the receiving operator; the issuing authority's workflow owns them.
- Publication is the only path from extraction to live obligation. No extraction becomes live on its own.

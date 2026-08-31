# Documents — extraction review

Table: `extraction` (`data-model.md §2`). No dedicated ReBAC type — an extraction is gated through its parent `document`'s relations, resolved in the app layer via `document_id`: `can_review` for everything below. Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/document-intelligence/extraction-spec.md`](../../../features/document-intelligence/extraction-spec.md), [`pipeline-spec.md`](../../../features/document-intelligence/pipeline-spec.md).

**Nothing here becomes live.** Every action below only changes `extraction.status`. Live obligations, observations, and incidents are created when the *document* publishes (`documents.md`, `action: "PUBLISH"`), which sweeps every `ACCEPTED`/`EDITED` extraction still attached to it. That split is what makes `pipeline-spec.md §3.7`'s rule hold exactly: *no extraction becomes live without a human confirming it* — reviewed one at a time, published as a batch.

## Routes

| Route | Purpose |
|---|---|
| `GET /extractions` · `GET /extractions/{id}` | Review queue and single read |
| `POST /extractions/{id}/actions` | Every review decision |
| `POST /extractions/actions` | Bulk review across a document or a filter |

`GET /documents/{id}/extractions` is `GET /extractions?filter[document_id]=doc_01H…`. Accept, edit, reject, mark-not-applicable, split, merge, and flag are all `action` values on one route.

---

## GET /extractions

**Auth:** `document.review` on an authorised filing of the parent document. Target tenant and filings are derived server-side.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[document_id]` | `doc_01H…` | The review queue for one document |
| `filter[status]` | `PROPOSED` | Default when reviewing |
| `filter[extraction_type]` | `OBLIGATION,OBSERVATION` | `OBLIGATION` · `CLAIMED_STATUS` · `OBSERVATION` · `INCIDENT` · `CONTRACTOR` · `EVIDENCE` |
| `filter[extractor]` | `obligation@v3` | Model/version that produced it |
| `filter[confidence][lt]` | `0.75` | Low-confidence triage |
| `filter[flagged]` | `true` | |
| `filter[reviewed_by]` | `per_01H…` | |
| `sort` | `confidence`, `-created_at` | Ascending confidence puts the risky ones first |
| `expand` | `segment,document,split_children` | |
| `group_by` + `metrics` | `group_by=status&metrics=count,avg(confidence)` | Review-progress summary without a bespoke route |

Low-confidence items are the caller's problem to order, not this endpoint's — `confidence` and `field_confidence` are returned raw so the review UI can sort them, per `pipeline-spec.md §3.7` ("low-confidence items sorted to the top").

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00",
      "object": "extraction",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "PROPOSED",
      "available_actions": ["ACCEPT", "EDIT", "REJECT", "MARK_NOT_APPLICABLE", "SPLIT", "MERGE"],
      "document_id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0",
      "document_version_id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300",
      "segment_id": "seg_01HZZA0B1C2D3E4F5G6H7J8K90",
      "extractor": "obligation@v3",
      "extractor_run_id": "op_01HZZ8J9K0T1M2N304P5Q6R7S0",
      "extraction_type": "OBLIGATION",
      "payload": {
        "deontic": "OBLIGATION",
        "title": "Plantation over 40 hectares",
        "title_i18n": { "en": "Plantation over 40 hectares" },
        "owner_role": "ENV_OFFICER",
        "periodicity": "ANNUAL",
        "due_rule_kind": "END_OF_PERIOD",
        "due_rule_detail": null,
        "grace_period_days": 0,
        "source_scope": "MINE",
        "severity": "SIGNIFICANT",
        "nil_permitted": false,
        "applicability": [{ "kind": "ALWAYS", "detail": null }],
        "parameters": [{ "name": "plantation_area", "value": "40", "unit": "HECTARE" }]
      },
      "anchor": "shall undertake plantation over 40 hectares within the lease boundary",
      "field_anchors": { "title": { "char_start": 18422, "char_end": 18460 }, "parameters[0].value": { "char_start": 18455, "char_end": 18457 } },
      "confidence": 0.740,
      "field_confidence": { "title": 0.91, "periodicity": 0.61, "due_rule_kind": 0.55, "parameters[0].value": 0.97 },
      "flagged": false,
      "flagged_by": null,
      "flagged_at": null,
      "flag_reason": null,
      "reviewed_by": null,
      "reviewed_at": null,
      "review_note": null,
      "split_from_id": null,
      "merged_into_id": null,
      "amends_obligation_id": null,
      "created_at": "2026-08-30T11:04:12Z",
      "created_by": { "type": "principal", "id": "prn_01HZZB1C2D3E4F5G6H7J8K9T00", "display": "strata-extraction-worker" },
      "updated_at": "2026-08-30T11:04:12Z",
      "updated_by": { "type": "principal", "id": "prn_01HZZB1C2D3E4F5G6H7J8K9T00", "display": "strata-extraction-worker" },
      "extensions": {},
      "links": { "self": "/api/v1/extractions/ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00", "segment": "/api/v1/documents/segments/seg_01HZZA0B1C2D3E4F5G6H7J8K90" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 7, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T11:06:00Z" }
}
```

`GET /extractions/{id}` returns exactly this object shape, singular, with `segment` expandable so the reviewer sees the source clause beside the proposal.

---

## POST /extractions/{id}/actions

### Action vocabulary

| Action | `payload` | `reason` | `expected_version` | State precondition | Result state |
|---|---|---|---|---|---|
| `ACCEPT` | optional `amends_obligation_id` | optional | required | `PROPOSED` | `ACCEPTED` |
| `EDIT` | `payload` + `review_note` | **required** (as `review_note`) | required | `PROPOSED`, `doc_class != REGULATOR_ISSUANCE` | `EDITED` |
| `REJECT` | `review_note` | **required** | required | `PROPOSED` | `REJECTED` |
| `MARK_NOT_APPLICABLE` | `review_note` | **required** | required | `PROPOSED` | `MARKED_NOT_APPLICABLE` |
| `SPLIT` | `payloads` (≥2) + `review_note` | **required** | required | `PROPOSED` | `SPLIT`, children `PROPOSED` |
| `MERGE` | `merge_extraction_ids` + `payload` + `review_note` | **required** | required | this and all listed `PROPOSED`, same `document_id` | survivor `ACCEPTED`, others `MERGED` |
| `FLAG` | `reason` | **required** | no | `doc_class = REGULATOR_ISSUANCE` | unchanged (`flagged = true`) |

**Auth for all:** `document.review` on the parent document, resolved through `document_id`.

### ACCEPT

```json
{
  "action": "ACCEPT",
  "expected_version": 1,
  "payload": { "amends_obligation_id": null }
}
```

`amends_obligation_id`, when set, must reference an existing `active = true` obligation. On the next `PUBLISH` of the parent document, the obligation created from this extraction sets `superseded_by` on the referenced one instead of creating an unrelated duplicate. Omit it for a genuinely new obligation.

```json
{
  "success": true,
  "message": "Extraction accepted",
  "data": {
    "id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00",
    "object": "extraction",
    "version": 2,
    "state": "ACCEPTED",
    "reviewed_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "reviewed_at": "2026-08-30T11:07:00Z",
    "amends_obligation_id": null,
    "available_actions": []
  },
  "meta": {
    "action": "ACCEPT",
    "transition": { "from": "PROPOSED", "to": "ACCEPTED" },
    "effects": [
      { "object": "audit_event", "id": "aud_01HZZQ4R5S6T7V8V9W0X1Y2Z30", "change": "CREATED" },
      { "object": "document", "id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "change": "REVIEW_PROGRESS", "to": "6 of 7 resolved" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:07:00Z"
  }
}
```

Errors: `409 INVALID_STATE` when not `PROPOSED`; `422 UNPROCESSABLE` when `amends_obligation_id` names an inactive obligation.

### EDIT

Editing content issued by a regulatory authority is blocked regardless of operator permission. The receiving operator may `FLAG` a suspected misread; it cannot rewrite it.

```json
{
  "action": "EDIT",
  "expected_version": 1,
  "reason": "corrected due_rule_kind — extractor guessed END_OF_PERIOD, condition text actually specifies +30 days",
  "payload": {
    "payload": {
      "deontic": "OBLIGATION",
      "title": "Plantation over 40 hectares within lease boundary",
      "owner_role": "ENV_OFFICER",
      "periodicity": "ANNUAL",
      "due_rule_kind": "OFFSET_FROM_PERIOD_END",
      "due_rule_detail": { "offset_days": 30 },
      "grace_period_days": 0,
      "source_scope": "MINE",
      "severity": "SIGNIFICANT",
      "nil_permitted": false,
      "applicability": [{ "kind": "ALWAYS", "detail": null }],
      "parameters": [{ "name": "plantation_area", "value": "40", "unit": "HECTARE" }]
    }
  }
}
```

`reason` is required, not optional — every correction is stored as a training example (`pipeline-spec.md §3.7`).

```json
{
  "success": true,
  "message": "Extraction edited",
  "data": {
    "id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00",
    "object": "extraction",
    "version": 2,
    "state": "EDITED",
    "payload": {
      "deontic": "OBLIGATION",
      "title": "Plantation over 40 hectares within lease boundary",
      "owner_role": "ENV_OFFICER",
      "periodicity": "ANNUAL",
      "due_rule_kind": "OFFSET_FROM_PERIOD_END",
      "due_rule_detail": { "offset_days": 30 },
      "grace_period_days": 0,
      "source_scope": "MINE",
      "severity": "SIGNIFICANT",
      "nil_permitted": false,
      "applicability": [{ "kind": "ALWAYS", "detail": null }],
      "parameters": [{ "name": "plantation_area", "value": "40", "unit": "HECTARE" }]
    },
    "changed_fields": ["title", "due_rule_kind", "due_rule_detail"],
    "reviewed_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "reviewed_at": "2026-08-30T11:07:30Z",
    "review_note": "corrected due_rule_kind — extractor guessed END_OF_PERIOD, condition text actually specifies +30 days",
    "available_actions": []
  },
  "meta": {
    "action": "EDIT",
    "transition": { "from": "PROPOSED", "to": "EDITED" },
    "effects": [
      { "object": "extraction_correction", "id": "ecor_01HZZR5S6T7V8V9W0X1Y2Z3A40", "change": "CREATED", "note": "Training example for obligation@v3" },
      { "object": "audit_event", "id": "aud_01HZZS6T7V8V9W0X1Y2Z3A4B50", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:07:30Z"
  }
}
```

Errors: `400 VALIDATION_ERROR` when `reason` is missing; `409 INVALID_STATE` when not `PROPOSED`; `403 FORBIDDEN` when the parent is `REGULATOR_ISSUANCE`, with `details.use_action: "FLAG"`.

### REJECT

```json
{ "action": "REJECT", "expected_version": 1, "reason": "misclassified — this is minutes text, not an obligation clause" }
```

```json
{
  "success": true,
  "message": "Extraction rejected",
  "data": {
    "id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00",
    "object": "extraction",
    "version": 2,
    "state": "REJECTED",
    "reviewed_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "reviewed_at": "2026-08-30T11:08:00Z",
    "review_note": "misclassified — this is minutes text, not an obligation clause",
    "available_actions": []
  },
  "meta": {
    "action": "REJECT",
    "transition": { "from": "PROPOSED", "to": "REJECTED" },
    "effects": [ { "object": "extraction_correction", "id": "ecor_01HZZT7V8V9W0X1Y2Z3A4B5C60", "change": "CREATED" }, { "object": "audit_event", "id": "aud_01HZZV8V9W0X1Y2Z3A4B5C6D70", "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:08:00Z"
  }
}
```

### MARK_NOT_APPLICABLE

Distinct from `REJECT` per `pipeline-spec.md §3.7`: the extraction is a real, correctly-read clause — it just does not bind *this* mine. An underground-ventilation condition surfaced from a shared cluster EC on an opencast mine is the canonical case.

```json
{ "action": "MARK_NOT_APPLICABLE", "expected_version": 1, "reason": "condition 12 (underground ventilation) does not apply — Gevra is opencast" }
```

```json
{
  "success": true,
  "message": "Extraction marked not applicable",
  "data": {
    "id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00",
    "object": "extraction",
    "version": 2,
    "state": "MARKED_NOT_APPLICABLE",
    "reviewed_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "reviewed_at": "2026-08-30T11:08:30Z",
    "review_note": "condition 12 (underground ventilation) does not apply — Gevra is opencast",
    "available_actions": []
  },
  "meta": {
    "action": "MARK_NOT_APPLICABLE",
    "transition": { "from": "PROPOSED", "to": "MARKED_NOT_APPLICABLE" },
    "effects": [ { "object": "audit_event", "id": "aud_01HZZV9W0X1Y2Z3A4B5C6D7E80", "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:08:30Z"
  }
}
```

### SPLIT

For a compound clause the decomposer read as one extraction but which is really N duties (`extraction-spec.md` test 2: "compound condition, three duties").

```json
{
  "action": "SPLIT",
  "expected_version": 1,
  "reason": "condition 17(b) bundles a plantation duty and a separate reporting duty",
  "payload": {
    "payloads": [
      { "deontic": "OBLIGATION", "title": "Plantation over 40 hectares", "owner_role": "ENV_OFFICER", "periodicity": "ANNUAL", "due_rule_kind": "END_OF_PERIOD", "source_scope": "MINE", "severity": "SIGNIFICANT", "applicability": [{ "kind": "ALWAYS", "detail": null }] },
      { "deontic": "OBLIGATION", "title": "Submit plantation survival report", "owner_role": "ENV_OFFICER", "periodicity": "ANNUAL", "due_rule_kind": "OFFSET_FROM_PERIOD_END", "due_rule_detail": { "offset_days": 15 }, "source_scope": "MINE", "severity": "MINOR", "applicability": [{ "kind": "ALWAYS", "detail": null }] }
    ]
  }
}
```

```json
{
  "success": true,
  "message": "Extraction split into 2 proposals",
  "data": {
    "id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00",
    "object": "extraction",
    "version": 2,
    "state": "SPLIT",
    "reviewed_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "reviewed_at": "2026-08-30T11:09:00Z",
    "review_note": "condition 17(b) bundles a plantation duty and a separate reporting duty",
    "split_child_ids": ["ext_01HZYR1S2T3V4V5W6X7Y8Z9A00", "ext_01HZYS1T2V3V4W5X6Y7Z8A9B00"],
    "available_actions": []
  },
  "included": {
    "extraction:ext_01HZYR1S2T3V4V5W6X7Y8Z9A00": {
      "id": "ext_01HZYR1S2T3V4V5W6X7Y8Z9A00",
      "object": "extraction",
      "version": 1,
      "state": "PROPOSED",
      "split_from_id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00",
      "segment_id": "seg_01HZZA0B1C2D3E4F5G6H7J8K90",
      "extraction_type": "OBLIGATION",
      "payload": { "deontic": "OBLIGATION", "title": "Plantation over 40 hectares", "owner_role": "ENV_OFFICER", "periodicity": "ANNUAL", "due_rule_kind": "END_OF_PERIOD", "source_scope": "MINE", "severity": "SIGNIFICANT", "applicability": [{ "kind": "ALWAYS", "detail": null }] },
      "confidence": null,
      "available_actions": ["ACCEPT", "EDIT", "REJECT", "MARK_NOT_APPLICABLE", "SPLIT", "MERGE"]
    },
    "extraction:ext_01HZYS1T2V3V4W5X6Y7Z8A9B00": {
      "id": "ext_01HZYS1T2V3V4W5X6Y7Z8A9B00",
      "object": "extraction",
      "version": 1,
      "state": "PROPOSED",
      "split_from_id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00",
      "segment_id": "seg_01HZZA0B1C2D3E4F5G6H7J8K90",
      "extraction_type": "OBLIGATION",
      "payload": { "deontic": "OBLIGATION", "title": "Submit plantation survival report", "owner_role": "ENV_OFFICER", "periodicity": "ANNUAL", "due_rule_kind": "OFFSET_FROM_PERIOD_END", "due_rule_detail": { "offset_days": 15 }, "source_scope": "MINE", "severity": "MINOR", "applicability": [{ "kind": "ALWAYS", "detail": null }] },
      "confidence": null,
      "available_actions": ["ACCEPT", "EDIT", "REJECT", "MARK_NOT_APPLICABLE", "SPLIT", "MERGE"]
    }
  },
  "meta": {
    "action": "SPLIT",
    "transition": { "from": "PROPOSED", "to": "SPLIT" },
    "effects": [ { "object": "extraction", "count": 2, "change": "CREATED" }, { "object": "audit_event", "id": "aud_01HZZW0X1Y2Z3A4B5C6D7E8F90", "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:09:00Z"
  }
}
```

Children are created `PROPOSED` and carry `confidence: null` — a human wrote them, so a model confidence would be a lie. Splitting does not accept; each child still needs its own decision.

Errors: `400 VALIDATION_ERROR` with fewer than 2 `payloads`; `409 INVALID_STATE` when not `PROPOSED`.

### MERGE

Inverse of split — the decomposer over-split one duty across several sentences (`extraction-spec.md` test 20). This extraction survives with the merged payload; those listed become `MERGED`, pointing at it.

```json
{
  "action": "MERGE",
  "expected_version": 1,
  "reason": "decomposer split one duty across two sentences of the same condition",
  "payload": {
    "merge_extraction_ids": ["ext_01HZYT1V2V3W4X5Y6Z7A8B9C00"],
    "payload": { "deontic": "OBLIGATION", "title": "Plantation over 40 hectares including survival monitoring", "owner_role": "ENV_OFFICER", "periodicity": "ANNUAL", "due_rule_kind": "END_OF_PERIOD", "source_scope": "MINE", "severity": "SIGNIFICANT", "applicability": [{ "kind": "ALWAYS", "detail": null }] }
  }
}
```

```json
{
  "success": true,
  "message": "1 extraction merged into survivor",
  "data": {
    "id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00",
    "object": "extraction",
    "version": 2,
    "state": "ACCEPTED",
    "payload": { "deontic": "OBLIGATION", "title": "Plantation over 40 hectares including survival monitoring", "owner_role": "ENV_OFFICER", "periodicity": "ANNUAL", "due_rule_kind": "END_OF_PERIOD", "source_scope": "MINE", "severity": "SIGNIFICANT", "applicability": [{ "kind": "ALWAYS", "detail": null }] },
    "reviewed_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "reviewed_at": "2026-08-30T11:09:30Z",
    "review_note": "decomposer split one duty across two sentences of the same condition",
    "merged_extraction_ids": ["ext_01HZYT1V2V3W4X5Y6Z7A8B9C00"],
    "available_actions": []
  },
  "included": {
    "extraction:ext_01HZYT1V2V3W4X5Y6Z7A8B9C00": { "id": "ext_01HZYT1V2V3W4X5Y6Z7A8B9C00", "object": "extraction", "version": 2, "state": "MERGED", "merged_into_id": "ext_01HZYQ1R2S3T4V5V6W7X8Y9Z00", "available_actions": [] }
  },
  "meta": {
    "action": "MERGE",
    "transition": { "from": "PROPOSED", "to": "ACCEPTED" },
    "effects": [
      { "object": "extraction", "count": 1, "change": "STATE", "to": "MERGED" },
      { "object": "extraction_correction", "id": "ecor_01HZZX1Y2Z3A4B5C6D7E8F9G00", "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZY2Z3A4B5C6D7E8F9G0H10", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:09:30Z"
  }
}
```

The survivor moves straight to `ACCEPTED` — merging *is* the review decision, so no separate accept follows.

Errors: `400 VALIDATION_ERROR` when `merge_extraction_ids` is empty or includes this extraction's own id; `409 INVALID_STATE` when this or any listed extraction is not `PROPOSED`; `422 UNPROCESSABLE` when a listed extraction belongs to a different `document_id`.

### FLAG

The receiving party's **only** correction path for authority-issued content.

```json
{
  "action": "FLAG",
  "reason": "extraction reads 'within 50 days' — source scan on page 2 looks like it actually says 'within 15 days', requesting regulator confirmation"
}
```

```json
{
  "success": true,
  "message": "Extraction flagged to the issuing authority",
  "data": {
    "id": "ext_01HZYT9V8V7W6X5Y4Z3A2B1C00",
    "object": "extraction",
    "version": 2,
    "state": "PROPOSED",
    "flagged": true,
    "flagged_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "flagged_at": "2026-08-30T12:10:00Z",
    "flag_reason": "extraction reads 'within 50 days' — source scan on page 2 looks like it actually says 'within 15 days', requesting regulator confirmation",
    "available_actions": ["ACCEPT", "MARK_NOT_APPLICABLE", "REJECT"]
  },
  "meta": {
    "action": "FLAG",
    "transition": null,
    "effects": [
      { "object": "notification", "count": 1, "change": "CREATED", "note": "Routed to current holders of posts in issuing_authority_unit_id whose mandates cover document-review resolution and whose jurisdiction covers an affected filing" },
      { "object": "audit_event", "id": "aud_01HZZZ3A4B5C6D7E8F9G0H1120", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T12:10:00Z"
  }
}
```

`state` is untouched — flagging does not accept, edit, or reject, it escalates. The extraction stays `PROPOSED` until the regulator or a later re-extraction resolves it.

If no eligible authority holder exists, the **authority-owned** responsibility route raises an unmanned responsibility. The operator cannot redirect that notification to its own staff.

Errors: `400 VALIDATION_ERROR` when `reason` is missing; `422 UNPROCESSABLE` when the parent `doc_class` is not `REGULATOR_ISSUANCE` — flagging exists for the case a mine cannot self-correct, and other document classes use `EDIT`.

---

## POST /extractions/actions

Bulk review across one document or one filter. Authorization is evaluated **per target**; a bulk call is never a scope escalation.

### Request

```json
{
  "action": "ACCEPT",
  "filter": { "document_id": "doc_01HZZ3D4E5F6G7H8J9K0T1M2N0", "status": "PROPOSED", "confidence": { "gte": 0.95 } },
  "reason": "Bulk accept of high-confidence proposals after spot-check of 5",
  "atomic": false
}
```

### Response — 207 Multi-Status

```json
{
  "success": true,
  "message": "4 of 5 accepted",
  "data": {
    "requested": 5,
    "succeeded": 4,
    "failed": 1,
    "results": [
      { "id": "ext_01HZYR1S2T3V4V5W6X7Y8Z9A00", "status": 200, "version": 2, "state": "ACCEPTED" },
      { "id": "ext_01HZYS1T2V3V4W5X6Y7Z8A9B00", "status": 200, "version": 2, "state": "ACCEPTED" },
      { "id": "ext_01HZYV2V3W4X5Y6Z7A8B9C0D10", "status": 200, "version": 2, "state": "ACCEPTED" },
      { "id": "ext_01HZYV3W4X5Y6Z7A8B9C0D1E20", "status": 200, "version": 2, "state": "ACCEPTED" },
      { "id": "ext_01HZYW4X5Y6Z7A8B9C0D1E2F30", "status": 409, "error": { "code": "INVALID_STATE", "message": "Already EDITED by another reviewer" } }
    ]
  },
  "meta": {
    "action": "ACCEPT",
    "effects": [ { "object": "audit_event", "count": 4, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T11:11:00Z"
  }
}
```

Bulk `EDIT`, `SPLIT`, and `MERGE` are refused with `400 VALIDATION_ERROR` — each needs a payload specific to one extraction, and a bulk version would only invite unreviewed rubber-stamping.

---

## Invariants

- An extraction never creates a live object. Only `PUBLISH` on the parent document does.
- Regulator-issued content is never editable by the receiving operator; `FLAG` is the whole correction path.
- Every `EDIT`, `REJECT`, `SPLIT`, and `MERGE` writes an `extraction_correction` training example with the reviewer's reason.
- `confidence` is `null` on any human-authored payload, never a fabricated score.
- Split children and merge survivors keep `segment_id` provenance, so every live obligation still points at the clause it came from.

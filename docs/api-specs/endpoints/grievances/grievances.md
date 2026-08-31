# Grievances — protected intake, routing, redress, disposition, appeal, and oversight

Domain rules: [`../../../features/grievances/grievance-and-protected-intake-spec.md`](../../../features/grievances/grievance-and-protected-intake-spec.md). Logical model: [`../../../architecture/grievance-data-model.md`](../../../architecture/grievance-data-model.md). Conventions: [`../../README.md`](../../README.md).

Two separations carry this whole domain:

- **The reporter's identity lives in a separate vault, not in the case.** Case rows, search projections, analytics, and ordinary logs never contain vault data. Reading identity is its own capability, its own purpose log, and its own receipt.
- **An allegation is not a finding.** A complaint never automatically creates a finding, a defect, or an adverse eligibility decision about anyone. Cross-domain records own their own truth; grievance stores links and safe projections, never a copied `closed` boolean.

## Routes

| Route | Purpose |
|---|---|
| `GET /grievance-case-type-versions` · `POST /grievance-case-type-versions` · `POST /grievance-case-type-versions/{id}/actions` | Immutable policy versions; `?view=current` replaces the case-type list |
| `POST /grievance-intakes` · `GET /grievance-intakes/{id}` · `POST /grievance-intakes/{id}/actions` | Low-barrier and assisted intake; append-only statements |
| `GET /grievance-receipts/{reference}` · `POST /grievance-receipts/{reference}/actions` | Reference-token status and recovery, privacy-safe and rate-limited |
| `GET /grievance-cases` · `GET /grievance-cases/{id}` · `POST /grievance-cases/{id}/actions` · `GET /grievance-cases/{id}/history` | Case lifecycle |
| `GET /grievance-assignments` · `POST /grievance-assignments` · `POST /grievance-assignments/{id}/actions` | Accountable owner post |
| `GET /grievance-transfers` · `POST /grievance-transfers` · `POST /grievance-transfers/{id}/actions` | Sent is not accepted |
| `GET /grievance-reporter-access-receipts` · `POST /grievance-reporter-access-receipts` | Every identity read, receipted |
| `GET /grievance-actions` · `POST /grievance-actions` · `POST /grievance-actions/{id}/actions` | Redress work and independent verification |
| `GET /grievance-information-requests` · `POST /grievance-information-requests` · `POST /grievance-information-requests/{id}/actions` | Immutable rounds |
| `GET /grievance-responses` · `POST /grievance-responses` · `POST /grievance-responses/{id}/actions` | Audience-specific, reviewed |
| `GET /grievance-dispositions` · `POST /grievance-dispositions` | Immutable outcome |
| `GET /grievance-feedback` · `POST /grievance-feedback` | Never mutates a disposition |
| `GET /grievance-appeals` · `POST /grievance-appeals` · `POST /grievance-appeals/{id}/actions` | Separate lifecycle, independent route |
| `GET /grievance-safeguarding-concerns` · `POST /grievance-safeguarding-concerns` · `POST /grievance-safeguarding-concerns/{id}/actions` | Retaliation and life-safety, separate owner |
| `GET /grievance-external-cases` · `POST /grievance-external-cases/{id}/actions` | Federated reconciliation |
| `GET /grievance-cases?view=oversight` | Suppressed, threshold-guarded oversight projection |

`GET /grievance-cases/{id}/timeline` is `GET /grievance-cases/{id}/history`. `GET /grievance-dashboards/aggregate` and the former `/grievance-aggregates` collection are `GET /grievance-cases?view=oversight`. `GET /grievance-routing/exceptions` is `GET /grievance-cases?filter[routing_exception]=true`.

`GET /grievance-case-types` is replaced by `GET /grievance-case-type-versions?view=current`, returning one effective policy version per stable case-type identity.

---

## POST /grievance-intakes

**Auth:** public or authenticated per the channel profile. Assisted intake requires `grievance.intake.assist` and records the assistant separately from the reporter.

**A client-supplied tenant, mine, or category never proves authority or route.** All three are hints, re-resolved server-side at triage.

### Request — low-barrier, anonymous

```json
{
  "channel_profile_id": "gchp_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "identity_mode": "ANONYMOUS",
  "language": "hi",
  "narrative": "पूर्वी हॉल रोड पर रात की पाली में डम्पर बिना हेडलाइट के चलाए जा रहे हैं और सुपरवाइज़र शिकायत सुनने से मना करते हैं।",
  "occurred_assertion": { "from": "2026-11-01T00:00:00Z", "to": "2026-12-10T00:00:00Z", "precision": "APPROXIMATE" },
  "scope_hints": { "mine_code_stated": "GEVRA", "area_stated": "east haul road", "category_stated": "SAFETY" },
  "attachments": [],
  "safe_contact": null,
  "extensions": {}
}
```

### Request — assisted, identified

```json
{
  "channel_profile_id": "gchp_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "identity_mode": "IDENTIFIED",
  "assisted_by": { "person_id": "per_01HZY3C4D5E6F7G8H9J0K1T2M0", "appointment_id": "app_01HZY4D5E6F7G8H9J0K1T2M3N0", "assistance_kind": "TELEPHONE_TRANSCRIPTION" },
  "language": "hi",
  "narrative": "Transcribed from a telephone call on 14 December 2026 at 11:20.",
  "reporter_identity": { "full_name": "…", "contact_phone": "…", "safe_contact_window": "18:00–21:00 IST", "safe_contact_channel": "SMS_ONLY", "consent_statement_read_back": true, "consent_recorded_at": "2026-12-14T11:26:00Z" },
  "occurred_assertion": { "from": "2026-12-12T22:00:00Z", "to": "2026-12-12T23:00:00Z", "precision": "STATED" },
  "scope_hints": { "mine_code_stated": "GEVRA", "category_stated": "HARASSMENT" },
  "read_back_confirmed": true,
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Grievance received",
  "data": {
    "id": "gint_01HZY5E6F7G8H9J0K1T2M3N400",
    "object": "grievance_intake",
    "version": 1,
    "tenant_id": null,
    "state": "RECEIVED",
    "available_actions": ["ADD_STATEMENT", "TRIAGE"],
    "receipt": {
      "reference": "GRV-7K3M-9QP2-4XR8",
      "reference_delivery": "DISPLAY_ONCE",
      "secret_stored": false,
      "secret_storage_note": "Only a hash of the reference secret is stored. It cannot be recovered, only re-issued to a registered safe contact.",
      "expires_at": "2027-12-14T00:00:00Z",
      "status_url": "/api/v1/grievance-receipts/GRV-7K3M-9QP2-4XR8"
    },
    "channel_profile": { "type": "grievance_channel_profile", "id": "gchp_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "Public web intake (anonymous permitted)" },
    "identity_mode": "ANONYMOUS",
    "reporter_ref": "grpt_01HZY6F7G8H9J0K1T2M3N405P0",
    "reporter_identity_present": false,
    "language": "hi",
    "narrative_reference": { "storage": "ENCRYPTED_AT_REST", "ciphertext_ref": "gnar_01HZY7G8H9J0K1T2M3N405P6Q0", "hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3", "in_search_projection": false },
    "received_at": "2026-12-14T11:30:00Z",
    "occurred_assertion": { "from": "2026-11-01T00:00:00Z", "to": "2026-12-10T00:00:00Z", "precision": "APPROXIMATE" },
    "scope_hints": { "mine_code_stated": "GEVRA", "area_stated": "east haul road", "category_stated": "SAFETY", "hints_are_not_authority": true },
    "resolved_scope": null,
    "safety_screen": { "state": "PASSED", "screened_at": "2026-12-14T11:30:02Z", "immediate_risk_detected": false, "escalated": false },
    "statements": [],
    "attachments": [],
    "case_links": [],
    "created_at": "2026-12-14T11:30:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/grievance-intakes/gint_01HZY5E6F7G8H9J0K1T2M3N400" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-12-14T11:30:00Z", "effects": [ { "object": "grievance_reporter_ref", "count": 1, "change": "CREATED" }, { "object": "grievance_receipt_credential", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 2, "change": "CREATED", "note": "Neutral routing notification; no narrative content" } ] }
}
```

The receipt reference is shown **once** and only a hash is stored. Recovery re-issues to a registered safe contact; there is no path that reveals the original secret, because a system that can recover it can also be compelled to.

`narrative_reference.in_search_projection: false` and `reporter_identity_present: false` are stated on every intake. The narrative is encrypted and excluded from search by default; the identity is not in this row at all.

### ADD_STATEMENT

Statements are **append-only** corrections, translations, transcriptions, and read-backs. They never overwrite the original.

```json
{
  "action": "ADD_STATEMENT",
  "expected_version": 1,
  "payload": { "statement_kind": "TRANSLATION", "language": "en", "content": "Dumpers are being run without headlights on the east haul road during the night shift, and supervisors refuse to hear complaints.", "author": { "kind": "ASSISTANT", "person_id": "per_01HZY3C4D5E6F7G8H9J0K1T2M0" }, "relates_to_statement_id": null }
}
```

```json
{
  "success": true,
  "message": "Statement added",
  "data": {
    "id": "gint_01HZY5E6F7G8H9J0K1T2M3N400",
    "object": "grievance_intake",
    "version": 2,
    "state": "RECEIVED",
    "statements": [
      { "id": "gsta_01HZY8H9J0K1T2M3N405P6Q7R0", "sequence": 1, "statement_kind": "TRANSLATION", "language": "en", "author": { "kind": "ASSISTANT", "person_id": "per_01HZY3C4D5E6F7G8H9J0K1T2M0", "display": "N. Ekka" }, "created_at": "2026-12-14T11:40:00Z", "relates_to_statement_id": null, "supersedes_nothing": true }
    ],
    "original_narrative_unchanged": true,
    "available_actions": ["ADD_STATEMENT", "TRIAGE"]
  },
  "meta": { "action": "ADD_STATEMENT", "transition": null, "effects": [ { "object": "grievance_intake_statement", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-12-14T11:40:00Z" }
}
```

---

## GET /grievance-receipts/{reference}

**Auth:** none beyond the reference token itself. **Rate-limited and privacy-safe.**

```json
{
  "success": true,
  "data": {
    "reference": "GRV-7K3M-9QP2-4XR8",
    "status": "UNDER_ASSESSMENT",
    "status_display": { "en": "Your complaint is being assessed.", "hi": "आपकी शिकायत का मूल्यांकन किया जा रहा है।" },
    "received_at": "2026-12-14T11:30:00Z",
    "last_updated_at": "2026-12-16T09:00:00Z",
    "expected_response_by": "2027-01-13T00:00:00Z",
    "actions_available_to_you": ["ADD_INFORMATION", "REQUEST_SAFE_CONTACT_UPDATE"],
    "case_reference": "GC-2026-004418",
    "handler_identity_disclosed": false,
    "narrative_echo": false,
    "note": "This page shows status only. It never echoes your complaint text, and it never reveals who is handling it."
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-12-16T14:00:00Z", "rate_limit": { "limit": 20, "remaining": 19, "resets_at": "2026-12-16T15:00:00Z" } }
}
```

The public projection **never echoes the narrative** and never names the handler. Both would turn a status page into a disclosure channel for anyone who obtained the reference.

---

## POST /grievance-cases/{id}/actions — reporter identity access

**Auth:** `grievance.reporter_identity.read`, which is **independent of case read**. Holding one never implies the other.

```json
{
  "action": "REVEAL_REPORTER_IDENTITY",
  "expected_version": 6,
  "reason": "The complainant must be contacted to arrange a safe interview; the allegation names a specific supervisor and cannot be investigated on the narrative alone.",
  "payload": { "fields_requested": ["safe_contact_channel", "safe_contact_window"], "purpose": "SAFE_CONTACT_ARRANGEMENT", "approval_id": "appr_01HZY9J0K1T2M3N405P6Q7R8S0" },
  "supporting_authority": { "appointment_id": "app_01HZYA0B1C2D3E4F5G6H7J8K90", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "2 of 4 requested fields revealed",
  "data": {
    "receipt": {
      "id": "grar_01HZYB1C2D3E4F5G6H7J8K9T00",
      "object": "grievance_reporter_access_receipt",
      "case_id": "gcas_01HZYC2D3E4F5G6H7J8K9T0M10",
      "actor": { "type": "person", "id": "per_01HZYD3E4F5G6H7J8K9T0M1N20", "display": "V. Rao" },
      "actor_appointment_id": "app_01HZYA0B1C2D3E4F5G6H7J8K90",
      "purpose": "SAFE_CONTACT_ARRANGEMENT",
      "reason": "The complainant must be contacted to arrange a safe interview; the allegation names a specific supervisor and cannot be investigated on the narrative alone.",
      "assurance_at_access": "PASSKEY",
      "approval_id": "appr_01HZY9J0K1T2M3N405P6Q7R8S0",
      "fields_requested": ["safe_contact_channel", "safe_contact_window", "full_name", "contact_phone"],
      "fields_revealed": ["safe_contact_channel", "safe_contact_window"],
      "fields_withheld": [
        { "field": "full_name", "reason": "NOT_REQUIRED_FOR_STATED_PURPOSE" },
        { "field": "contact_phone", "reason": "NOT_REQUIRED_FOR_STATED_PURPOSE", "note": "Use the safe contact channel" }
      ],
      "accessed_at": "2026-12-18T10:00:00Z"
    },
    "revealed": { "safe_contact_channel": "SMS_ONLY", "safe_contact_window": "18:00–21:00 IST" }
  },
  "meta": {
    "action": "REVEAL_REPORTER_IDENTITY",
    "transition": null,
    "effects": [
      { "object": "grievance_reporter_access_receipt", "id": "grar_01HZYB1C2D3E4F5G6H7J8K9T00", "change": "CREATED" },
      { "object": "access_event", "count": 1, "change": "CREATED" },
      { "object": "security_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-12-18T10:00:00Z"
  }
}
```

Minimum disclosure is enforced, not advised: two of four fields were revealed and the withheld ones say why. An `ANONYMOUS` intake has no vault entry to reveal, and **cannot be upgraded to identified without a new consented assertion from the reporter**.

---

## POST /grievance-transfers · actions

**Auth:** `grievance.transfer.send` on the source; acceptance needs `grievance.transfer.accept` on the destination.

**Transfer sent is not transfer accepted, and never closes the source responsibility silently.**

```json
{
  "success": true,
  "message": "Transfer sent; source responsibility retained until accepted",
  "data": {
    "id": "gtrf_01HZYE4F5G6H7J8K9T0M1N2030",
    "object": "grievance_transfer",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "SENT",
    "available_actions": ["ACCEPT", "REJECT", "RECALL"],
    "case": { "type": "grievance_case", "id": "gcas_01HZYC2D3E4F5G6H7J8K9T0M10", "display": "GC-2026-004418" },
    "from": { "authority_or_org": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "SECL" }, "post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0" },
    "to": { "authority_or_org": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" }, "post_id": "post_01HZYF5G6H7J8K9T0M1N203P40", "external_system": null },
    "reason": "Allegation concerns statutory safety non-compliance and falls outside the operator's own grievance remit",
    "sent_at": "2026-12-20T10:00:00Z",
    "accepted_at": null,
    "source_responsibility_released": false,
    "source_responsibility_note": "The originating post remains accountable, and its clock keeps running, until the destination accepts.",
    "clock_effect": { "source_clock_paused": false, "destination_clock_started": false, "note": "The destination clock starts on acceptance, not on dispatch" },
    "proof": { "delivery_reference": null, "acknowledgement_reference": null },
    "created_at": "2026-12-20T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/grievance-transfers/gtrf_01HZYE4F5G6H7J8K9T0M1N2030" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-12-20T10:00:00Z", "effects": [ { "object": "grievance_status_event", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 3, "change": "CREATED" } ] }
}
```

---

## GET /grievance-cases/{id}

**Auth:** `grievance.case.read`. Case read, reporter-identity read, disposition authority, and appeal authority are **four independent capabilities**.

```json
{
  "success": true,
  "data": {
    "id": "gcas_01HZYC2D3E4F5G6H7J8K9T0M10",
    "object": "grievance_case",
    "version": 11,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "UNDER_REDRESS",
    "available_actions": ["CREATE_ACTION", "REQUEST_INFORMATION", "DRAFT_RESPONSE", "TRANSFER"],
    "case_number": "GC-2026-004418",
    "case_type_version": { "type": "grievance_case_type_version", "id": "gctv_01HZYG6H7J8K9T0M1N203P4Q50", "display": "Workplace safety grievance, v3", "bound_at": "RECEIPT" },
    "execution_mode": "NATIVE",
    "authoritative_system": "STRATA",
    "status": "UNDER_REDRESS",
    "urgency": "HIGH",
    "confidentiality": "PROTECTED",
    "affected_resource": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "resolved_scope_basis": "Triage resolved GEVRA to mine_01HZY7A8B9C0D1E2F3G4H5J6K0 against the mine register; the stated code was a hint only",
    "owning_post": { "type": "post", "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "display": "Safety Officer, Gevra OCP" },
    "owner_accepted": true,
    "owner_accepted_at": "2026-12-16T09:00:00Z",
    "routing_exception": null,
    "reporter_ref": "grpt_01HZY6F7G8H9J0K1T2M3N405P0",
    "reporter_identity_present_in_this_row": false,
    "parties": [
      { "id": "gpty_01HZYH7J8K9T0M1N203P4Q5R60", "relationship": "SUBJECT_OF_ALLEGATION", "person_ref": "grpt_01HZYJ8K9T0M1N203P4Q5R6S70", "visibility": "HANDLER_ONLY", "allegation_is_not_finding": true, "note": "Named in the allegation. No finding, no adverse eligibility decision, and no record in any other domain has been created about this person." }
    ],
    "related_records": [
      { "id": "grel_01HZYK9T0M1N203P4Q5R6S7T80", "record": { "type": "observation", "id": "obs_01HZYT0M1N203P4Q5R6S7T8V90", "display": "Night-shift lighting observation, 2026-12-16" }, "relationship": "RAISED_FROM_THIS_GRIEVANCE", "visibility": "HANDLER_AND_OVERSIGHT", "owner_domain_state": { "state": "NEW_DEFECT", "read_from_owner_at": "2026-12-20T09:00:00Z", "not_copied": true } }
    ],
    "clocks": [
      { "rule": "ACKNOWLEDGEMENT", "started_at": "2026-12-14T11:30:00Z", "due_at": "2026-12-17T11:30:00Z", "completed_at": "2026-12-14T11:31:00Z", "state": "MET" },
      { "rule": "ASSESSMENT", "started_at": "2026-12-14T11:30:00Z", "due_at": "2026-12-24T11:30:00Z", "completed_at": "2026-12-16T09:00:00Z", "state": "MET" },
      { "rule": "DISPOSAL", "started_at": "2026-12-14T11:30:00Z", "due_at": "2027-01-13T11:30:00Z", "completed_at": null, "state": "RUNNING", "pauses": [{ "from": "2026-12-22T00:00:00Z", "to": "2026-12-28T00:00:00Z", "reason": "AWAITING_COMPLAINANT_INFORMATION", "authorised_by_appointment_id": "app_01HZYA0B1C2D3E4F5G6H7J8K90", "policy_permitted": true }], "effective_due_at": "2027-01-19T11:30:00Z" }
    ],
    "safeguarding_concerns": [{ "id": "gsfc_01HZYM1N203P4Q5R6S7T8V9V00", "kind": "RETALIATION_RISK", "state": "UNDER_PROTECTION", "separate_owner_post_id": "post_01HZYN203P4Q5R6S7T8V9V0W10", "visible_to_case_handler": false }],
    "counts": { "intakes": 1, "statements": 2, "actions": 2, "information_requests": 1, "responses": 0, "appeals": 0 },
    "created_at": "2026-12-16T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/grievance-cases/gcas_01HZYC2D3E4F5G6H7J8K9T0M10", "history": "/api/v1/grievance-cases/gcas_01HZYC2D3E4F5G6H7J8K9T0M10/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-12-20T14:00:00Z", "effects": [ { "object": "grievance_case_access_log", "count": 1, "change": "CREATED", "note": "Case access logged without copying the protected narrative into the log" } ] }
}
```

Four things this response is careful about:

- `allegation_is_not_finding: true` on the named subject, with an explicit note that nothing adverse was created about them anywhere.
- `owner_domain_state.not_copied: true` on the linked observation — the state is read from its owner at read time, never mirrored into a grievance column.
- The safeguarding concern has a **separate owner post** and `visible_to_case_handler: false`. A retaliation risk from the handler's own chain cannot be owned by that chain.
- A clock pause names its reason, its interval, its authorising appointment, and whether policy permits it.

---

## POST /grievance-actions/{id}/actions — VERIFY

**Auth:** `grievance.action.verify`. **A conflicted or implicated actor cannot satisfy a protected assignment or review gate.**

```json
{
  "action": "VERIFY",
  "expected_version": 3,
  "reason": "Attended the night shift on 2 January; all 14 dumpers had functioning headlights and the toolbox talk record confirms the briefing",
  "payload": { "verdict": "SATISFIED", "evidence_ids": ["ev_01HZY03P4Q5R6S7T8V9V0W1X20"], "evidence_manifest_hash": "sha256:9f2c8b1a…" },
  "supporting_authority": { "appointment_id": "app_01HZYP4Q5R6S7T8V9V0W1X2Y30", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Action verified",
  "data": {
    "id": "gact_01HZYQ5R6S7T8V9V0W1X2Y3Z40",
    "object": "grievance_action",
    "version": 4,
    "state": "VERIFIED",
    "instruction": "Restore and maintain headlights on all night-shift dumpers, and brief the shift on the reporting channel",
    "owner_post": { "type": "post", "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "display": "Safety Officer, Gevra OCP" },
    "owning_domain": "GRIEVANCE",
    "verification": {
      "id": "gavf_01HZYR6S7T8V9V0W1X2Y3Z4A50",
      "verdict": "SATISFIED",
      "verifier": { "type": "person", "id": "per_01HZYS7T8V9V0W1X2Y3Z4A5B60", "display": "K. Bhagat" },
      "verifier_appointment_id": "app_01HZYP4Q5R6S7T8V9V0W1X2Y30",
      "conflict_check": { "verifier_is_subject_of_allegation": false, "verifier_in_subject_reporting_line": false, "verifier_is_action_owner": false, "passed": true },
      "evidence_manifest_hash": "sha256:9f2c8b1a…",
      "verified_at": "2027-01-03T10:00:00Z"
    },
    "available_actions": []
  },
  "meta": { "action": "VERIFY", "transition": { "from": "COMPLETION_CLAIMED", "to": "VERIFIED" }, "effects": [ { "object": "grievance_action_verification", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-01-03T10:00:00Z" }
}
```

The conflict check is **returned as data**, itemised. A verifier in the subject's reporting line fails at `422 UNPROCESSABLE` with the failing clause named.

---

## POST /grievance-dispositions

**Auth:** `grievance.disposition.issue`, independent of case read and of appeal authority.

**A disposition is immutable.** Feedback, appeal, and reopen are separate records that never mutate it.

```json
{
  "success": true,
  "message": "Disposition issued",
  "data": {
    "id": "gdsp_01HZYT8V9V0W1X2Y3Z4A5B6C70",
    "object": "grievance_disposition",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ISSUED",
    "available_actions": [],
    "case": { "type": "grievance_case", "id": "gcas_01HZYC2D3E4F5G6H7J8K9T0M10", "display": "GC-2026-004418" },
    "frozen_response_version": { "id": "grsp_01HZYV9V0W1X2Y3Z4A5B6C7D80", "audience": "COMPLAINANT", "language": "hi", "version_number": 2, "content_hash": "sha256:1a4f9c2e…" },
    "disposition_code": "SUBSTANTIATED_REMEDIED",
    "issuing_authority": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "SECL" },
    "issuing_post": { "type": "post", "id": "post_01HZYV0W1X2Y3Z4A5B6C7D8E90", "display": "Area General Manager, Korba" },
    "issued_at": "2027-01-06T10:00:00Z",
    "delivery_evidence": { "communication_id": "gcom_01HZYW1X2Y3Z4A5B6C7D8E9F00", "channel": "SMS_ONLY", "template_version": "GRV_DISPOSITION_NEUTRAL_v3", "neutral_notification": true, "delivered_at": "2027-01-06T18:04:00Z", "receipt_proof": "SMS-DLR-8841221", "narrative_included": false },
    "appeal_policy": { "appeal_permitted": true, "appeal_window": "P30D", "appeal_deadline_at": "2027-02-05T10:00:00Z", "independent_route_post_id": "post_01HZYX2Y3Z4A5B6C7D8E9F0G10" },
    "immutable": true,
    "created_at": "2027-01-06T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/grievance-dispositions/gdsp_01HZYT8V9V0W1X2Y3Z4A5B6C70" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-01-06T10:00:00Z", "effects": [ { "object": "grievance_communication", "count": 1, "change": "CREATED" }, { "object": "grievance_status_event", "count": 1, "change": "CREATED" } ] }
}
```

The delivery is a **neutral notification** — `narrative_included: false`. An SMS that quotes the complaint back to a phone that may be shared is a disclosure, not a courtesy.

---

## GET /grievance-cases?view=oversight

**Auth:** `grievance.oversight.read`. **Small protected cohorts are suppressed**, and pattern signals can never expose reporter identity.

```json
{
  "success": true,
  "data": {
    "manifest": { "id": "gagm_01HZYY3Z4A5B6C7D8E9F0G1H20", "authorized_population": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "mine_01HZYB1C2D3E4F5G6H7J8K9T00"] }, "policy_version": 5, "source_checkpoint": "2027-01-31T23:59:59Z", "suppression_threshold": 5 },
    "dimensions": ["mine_id", "category", "disposition_code"],
    "rows": [
      { "key": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "category": "SAFETY", "disposition_code": "SUBSTANTIATED_REMEDIED" }, "count": 14, "suppressed": false },
      { "key": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "category": "SAFETY", "disposition_code": "NOT_SUBSTANTIATED" }, "count": 9, "suppressed": false },
      { "key": { "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "category": "HARASSMENT", "disposition_code": null }, "count": null, "suppressed": true, "suppression_reason": "COHORT_BELOW_THRESHOLD", "note": "Fewer than 5 protected-category cases in this cell. Publishing the count could identify the reporter." }
    ],
    "pattern_signals": [
      { "id": "gpsg_01HZYZ4A5B6C7D8E9F0G1H2130", "hypothesis": "Night-shift safety grievances cluster around the east haul road between November and January across two consecutive years", "method": "temporal-spatial-cluster@v2", "confidence": "MEDIUM", "provenance": { "case_count": 11, "min_cohort_satisfied": true }, "contains_reporter_identity": false, "reviewer_disposition": "UNDER_REVIEW" }
    ]
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-02-01T09:00:00Z" }
}
```

The suppressed cell states **why** it is suppressed. A dashboard that silently omits it teaches its readers that harassment complaints do not happen.

---

## Invariants

- A client-supplied tenant, mine, or category never proves authority or route.
- Intake and statements are append-only; linking, duplicate, and split decisions never erase them.
- Reporter vault data is never stored in case rows, search projections, analytics, or ordinary logs.
- `ANONYMOUS` can never be upgraded to identified without a new consented assertion from the reporter.
- Case read, reporter-identity read, disposition authority, and appeal authority are four independent capabilities.
- A conflicted or implicated actor cannot satisfy a protected assignment or review gate.
- Every active case has one accepted accountable owner post, or an explicit overdue routing exception.
- Transfer sent is not transfer accepted, and never closes the source responsibility silently.
- A disposition is immutable; feedback, appeal, and reopen are separate records.
- An allegation never creates a finding or an adverse eligibility decision automatically.
- Linked domain completion is read from its owner and version; grievance can never forge it.
- External submission, transport, acknowledgement, acceptance, and disposal are five distinct facts.
- A clock pause or extension requires an allowed reason, an interval, an authority, and an audit record.
- Public and reference-token status use a privacy-safe projection and are rate-limited.
- Small protected cohorts are suppressed, and pattern signals can never expose reporter identity.
- Search projections exclude the reporter vault and the protected narrative by default.
- A legal hold overrides retention disposal, and destruction never deletes required audit proof.
- Every lifecycle mutation uses optimistic concurrency, and every command and import is idempotent.

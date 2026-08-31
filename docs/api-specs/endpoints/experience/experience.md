# Experience — locale, terminology, translation, assisted use, and accessibility conformance

Domain rules: [`../../../features/experience/localization-accessibility-assisted-use-spec.md`](../../../features/experience/localization-accessibility-assisted-use-spec.md). Logical model: [`../../../architecture/experience-data-model.md`](../../../architecture/experience-data-model.md). Conventions: [`../../README.md`](../../README.md).

Two rules this domain exists to hold:

- **Business codes, capabilities, and statuses are locale-neutral.** A localized label is never a command input. `status: "SUBMITTED"` is the value; *"जमा किया गया"* is a rendering of it, and no endpoint accepts the rendering.
- **A user's locale preference never changes authorization, jurisdiction, a deadline, or legal applicability.** Reading the interface in Hindi does not move a statutory due date.

## Routes

| Route | Purpose |
|---|---|
| `GET /enums/locale` | Available locales, formats, and fallback chain through the shared registry |
| `GET /terminology-versions` · `POST /terminology-versions` · `POST /terminology-versions/{id}/actions` | Governed glossary |
| `GET /message-versions` · `POST /message-versions` | Locale-neutral keys and variables |
| `GET /translation-jobs` · `POST /translation-jobs` · `POST /translation-jobs/{id}/actions` | Route, candidate, review, publish |
| `GET /translation-candidates` · `POST /translation-candidates/{id}/actions` | Human and machine candidates |
| `GET /translation-candidates?view=published` · `GET /translation-staleness-events` · `POST /translation-staleness-events/{id}/actions` | Effective renderings and their decay |
| `GET /locale-packs` · `POST /locale-packs` · `POST /locale-packs/{id}/actions` | Atomic offline activation |
| `GET /assisted-sessions` · `POST /assisted-sessions` · `POST /assisted-sessions/{id}/actions` | Someone acting with a user, never as them |
| `GET /interpreter-assignments` · `POST /interpreter-assignments` | Language, confidentiality, conflict |
| `GET /transcriptions` · `POST /transcriptions` · `POST /transcriptions/{id}/actions` | Read-back and confirmation |
| `GET /accessible-derivatives` · `POST /accessible-derivatives` | Bound to an exact original |
| `GET /accessibility-test-runs` · `POST /accessibility-test-runs` | Build, journey, locale, platform, AT version |
| `GET /accessibility-defects` · `POST /accessibility-defects` · `POST /accessibility-defects/{id}/actions` | Remediation and retest |
| `GET /accessibility-exceptions` · `POST /accessibility-exceptions` · `POST /accessibility-exceptions/{id}/actions` | Equivalent access, expiring |
| `GET /conformance-statements` · `POST /conformance-statements` | Scope, tests, limitations, approval |

`PUT /people/me/locale-preference` is `PATCH /users/me` ([`../identity/auth.md`](../identity/auth.md)). `GET /content/{domain}/{id}/localized` is `Accept-Language` plus `?expand=localized` on the resource's own endpoint — localization is a projection concern, not a parallel API.

---

## POST /translation-jobs · candidates · publish

**Auth:** `experience.translation.request`; publication needs the route's declared reviewer authority. **High-risk publication enforces independent domain and legal review.**

### Request

```json
{
  "content_ref": {
    "source_domain": "documents",
    "source_object": { "type": "document_version", "id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300" },
    "source_field": "segments[cond_17__b].text",
    "source_locale": "en",
    "source_hash": "sha256:4c1e9a7f2b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8",
    "risk_class": "AUTHORITATIVE_LEGAL_TEXT"
  },
  "target_locale": "hi",
  "purpose": "OPERATOR_FIELD_COMPREHENSION",
  "route": "MACHINE_THEN_HUMAN_REVIEW",
  "glossary_version_id": "trmv_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "priority": "NORMAL",
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Translation job created",
  "data": {
    "id": "trjb_01HZY2B3C4D5E6F7G8H9J0K1T0",
    "object": "translation_job",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "AWAITING_CANDIDATE",
    "available_actions": ["ADD_CANDIDATE", "CANCEL"],
    "content_ref": { "source_domain": "documents", "source_object": { "type": "document_version", "id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300" }, "source_field": "segments[cond_17__b].text", "source_locale": "en", "source_hash": "sha256:4c1e9a7f…", "source_version_immutable": true, "risk_class": "AUTHORITATIVE_LEGAL_TEXT" },
    "target_locale": "hi",
    "purpose": "OPERATOR_FIELD_COMPREHENSION",
    "authoritative_or_convenience": "CONVENIENCE",
    "authoritative_note": "The English source remains the authoritative legal text. This Hindi rendering aids comprehension and is never the operative wording.",
    "route": "MACHINE_THEN_HUMAN_REVIEW",
    "required_reviews": ["TERMINOLOGY", "DOMAIN", "LEGAL"],
    "glossary_version": { "type": "terminology_version", "id": "trmv_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "Mining compliance glossary, v9" },
    "protected_content_check": { "redaction_applied": false, "authorized_for_provider": true, "checked_before_any_provider_call": true },
    "candidates": [],
    "created_at": "2027-03-01T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/translation-jobs/trjb_01HZY2B3C4D5E6F7G8H9J0K1T0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-03-01T10:00:00Z" }
}
```

`authoritative_or_convenience` is stated on every job. Conflating the two is how a translated condition ends up quoted in a dispute as though it were the instrument.

**Protected content is redacted or authorized before any translation, TTS, transcription, or provider call** — `checked_before_any_provider_call: true` records that the gate ran first, not after.

### ADD_CANDIDATE — machine

```json
{
  "action": "ADD_CANDIDATE",
  "expected_version": 1,
  "payload": {
    "producer": { "kind": "MACHINE", "provider_profile_id": "aipp_01HZY3C4D5E6F7G8H9J0K1T2M0", "model": "anuvaad-hi-3", "model_version": "3.2.1", "prompt_template_version_id": "aptv_01HZY4D5E6F7G8H9J0K1T2M3N0", "glossary_version_id": "trmv_01HZY1A2B3C4D5E6F7G8H9J0K0" },
    "text": "पट्टा सीमा के भीतर 40 हेक्टेयर में वृक्षारोपण किया जाएगा तथा प्रत्येक वित्तीय वर्ष की समाप्ति के 30 दिनों के भीतर उत्तरजीविता रिपोर्ट प्रस्तुत की जाएगी।",
    "confidence": 0.87,
    "warnings": [{ "code": "TERM_NOT_IN_GLOSSARY", "term": "survival report", "suggestion": "उत्तरजीविता रिपोर्ट", "note": "Glossary v9 has no approved Hindi term for this; the rendering is the model's" }]
  }
}
```

```json
{
  "success": true,
  "message": "Candidate recorded; awaiting 3 reviews",
  "data": {
    "id": "trjb_01HZY2B3C4D5E6F7G8H9J0K1T0",
    "object": "translation_job",
    "version": 2,
    "state": "UNDER_REVIEW",
    "candidates": [
      {
        "id": "trcd_01HZY5E6F7G8H9J0K1T2M3N400",
        "object": "translation_candidate",
        "producer": { "kind": "MACHINE", "provider_profile_id": "aipp_01HZY3C4D5E6F7G8H9J0K1T2M0", "model": "anuvaad-hi-3", "model_version": "3.2.1", "prompt_template_version_id": "aptv_01HZY4D5E6F7G8H9J0K1T2M3N0", "glossary_version_id": "trmv_01HZY1A2B3C4D5E6F7G8H9J0K0", "redaction_applied": false },
        "text": "पट्टा सीमा के भीतर 40 हेक्टेयर में वृक्षारोपण किया जाएगा तथा प्रत्येक वित्तीय वर्ष की समाप्ति के 30 दिनों के भीतर उत्तरजीविता रिपोर्ट प्रस्तुत की जाएगी।",
        "confidence": 0.87,
        "warnings": [{ "code": "TERM_NOT_IN_GLOSSARY", "term": "survival report", "suggestion": "उत्तरजीविता रिपोर्ट" }],
        "reviews": [],
        "publishable": false,
        "publishable_blocked_by": ["TERMINOLOGY", "DOMAIN", "LEGAL"],
        "created_at": "2027-03-01T10:04:00Z"
      }
    ],
    "available_actions": ["ADD_CANDIDATE", "REVIEW_CANDIDATE", "CANCEL"]
  },
  "meta": { "action": "ADD_CANDIDATE", "transition": { "from": "AWAITING_CANDIDATE", "to": "UNDER_REVIEW" }, "effects": [ { "object": "translation_candidate", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 3, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-03-01T10:04:00Z" }
}
```

Provider, model, model version, prompt template, glossary version, and redaction status are all recorded. "The machine translated it" is not a provenance record.

### PUBLISH

```json
{
  "success": true,
  "message": "Translation published",
  "data": {
    "id": "ptrn_01HZY6F7G8H9J0K1T2M3N405P0",
    "object": "published_translation",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "EFFECTIVE",
    "available_actions": ["SUPERSEDE", "WITHDRAW"],
    "source": { "domain": "documents", "object": { "type": "document_version", "id": "dv_01HZZ4E5F6G7H8J9K0T1M2N300" }, "field": "segments[cond_17__b].text", "locale": "en", "hash": "sha256:4c1e9a7f…" },
    "source_content_mutated": false,
    "target_locale": "hi",
    "candidate_id": "trcd_01HZY5E6F7G8H9J0K1T2M3N400",
    "text": "पट्टा सीमा के भीतर 40 हेक्टेयर में वृक्षारोपण किया जाएगा तथा प्रत्येक वित्तीय वर्ष की समाप्ति के 30 दिनों के भीतर उत्तरजीविता रिपोर्ट प्रस्तुत की जाएगी।",
    "reviews": [
      { "discipline": "TERMINOLOGY", "reviewer": { "type": "person", "id": "per_01HZY7G8H9J0K1T2M3N405P6Q0", "display": "N. Ekka" }, "fidelity": "PASS", "terminology": "PASS_WITH_GLOSSARY_ADDITION", "accessibility": "PASS", "reviewed_at": "2027-03-02T10:00:00Z" },
      { "discipline": "DOMAIN", "reviewer": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" }, "fidelity": "PASS", "reviewed_at": "2027-03-02T14:00:00Z" },
      { "discipline": "LEGAL", "reviewer": { "type": "person", "id": "per_01HZY8H9J0K1T2M3N405P6Q7R0", "display": "K. Bhagat" }, "fidelity": "PASS", "note": "Convenience rendering only; English source remains operative", "reviewed_at": "2027-03-03T09:00:00Z" }
    ],
    "authoritative_or_convenience": "CONVENIENCE",
    "effective_from": "2027-03-03T09:00:00Z",
    "effective_until": null,
    "stale": false,
    "created_at": "2027-03-03T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/translation-candidates/published/ptrn_01HZY6F7G8H9J0K1T2M3N405P0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-03-03T09:00:00Z", "effects": [ { "object": "terminology_entry", "count": 1, "change": "PROPOSED", "note": "Glossary addition proposed for 'survival report'" } ] }
}
```

`source_content_mutated: false`. A translation **binds an exact immutable source version and hash** and never overwrites the original content or evidence.

### Staleness

```json
{
  "success": true,
  "data": {
    "id": "trse_01HZY9J0K1T2M3N405P6Q7R8S0",
    "object": "translation_staleness_event",
    "version": 1,
    "state": "AWAITING_DISPOSITION",
    "available_actions": ["DISPOSE"],
    "source_change": { "object": { "type": "document_version", "id": "dv_01HZYA0B1C2D3E4F5G6H7J8K90" }, "supersedes": "dv_01HZZ4E5F6G7H8J9K0T1M2N300", "changed_at": "2027-05-14T00:00:00Z", "field": "segments[cond_17__b].text", "change_summary": "Condition amended: 40 ha becomes 55 ha and the reporting window becomes 15 days" },
    "affected": { "published_translations": ["ptrn_01HZY6F7G8H9J0K1T2M3N405P0"], "locale_packs": ["lcpk_01HZYB1C2D3E4F5G6H7J8K9T00"], "notification_templates": [] },
    "risk_class": "AUTHORITATIVE_LEGAL_TEXT",
    "policy_disposition": "BLOCK_UNTIL_REVIEWED",
    "policy_note": "A stale Hindi rendering of an amended statutory condition would tell a field officer the wrong number. It is withdrawn from display until re-reviewed, and the English source is shown instead.",
    "current_display_behaviour": "FALLBACK_TO_SOURCE_LOCALE",
    "detected_at": "2027-05-14T00:05:00Z",
    "links": { "self": "/api/v1/translation-staleness-events/trse_01HZY9J0K1T2M3N405P6Q7R8S0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-05-14T00:05:00Z", "effects": [ { "object": "published_translation", "count": 1, "change": "MARKED_STALE" }, { "object": "notification", "count": 3, "change": "CREATED" } ] }
}
```

A source change **marks translations stale**, and the **risk policy decides** fallback, block, or review. A high-risk rendering falls back to the source locale rather than continuing to show a number that is no longer true.

---

## POST /locale-packs/{id}/actions — PUBLISH

**Auth:** `experience.locale_pack.publish`.

**Locale pack activation is atomic and versioned. An offline client never silently mixes incompatible keys.**

```json
{
  "success": true,
  "message": "Locale pack published",
  "data": {
    "id": "lcpk_01HZYB1C2D3E4F5G6H7J8K9T00",
    "object": "locale_pack",
    "version": 3,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PUBLISHED",
    "available_actions": ["SUPERSEDE", "WITHDRAW"],
    "locale": "hi",
    "platform": "MOBILE_ANDROID",
    "pack_version": "2027.03.1",
    "manifest": {
      "id": "lpmf_01HZYC2D3E4F5G6H7J8K9T0M10",
      "message_count": 3841,
      "terminology_version_id": "trmv_01HZY1A2B3C4D5E6F7G8H9J0K0",
      "help_content_count": 118,
      "hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
      "excluded": [{ "key": "documents.condition.cond_17__b.text", "reason": "STALE_HIGH_RISK", "fallback": "SOURCE_LOCALE" }]
    },
    "offline_compatibility": { "min_app_version": "1.4.0", "max_app_version": null, "key_schema_version": 7, "mixing_with_other_pack_versions": "REFUSED", "mixing_note": "A client on key schema 6 rejects this pack outright rather than loading the subset it understands" },
    "activation": { "atomic": true, "activated_at": "2027-03-04T00:00:00Z", "supersedes_pack_version": "2027.02.2" },
    "expires_at": "2027-09-04T00:00:00Z",
    "created_at": "2027-03-04T00:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/locale-packs/lcpk_01HZYB1C2D3E4F5G6H7J8K9T00" }
  },
  "meta": { "action": "PUBLISH", "transition": { "from": "DRAFT", "to": "PUBLISHED" }, "effects": [ { "object": "outbox_event", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-03-04T00:00:00Z" }
}
```

The excluded stale key is **named in the manifest** with its fallback. A field device that cannot show the Hindi condition shows the English one and knows why.

---

## POST /assisted-sessions · actions

**Auth:** `experience.assist` for the assistant. **An assisted session cannot grant a capability, always expires, and the assistant never reuses the user's credential or OTP.**

```json
{
  "user_person_id": "per_01HZYD3E4F5G6H7J8K9T0M1N20",
  "assistant_appointment_id": "app_01HZYE4F5G6H7J8K9T0M1N2030",
  "purpose": "Assist a worker with limited literacy to submit a safety observation",
  "channel": "IN_PERSON_KIOSK",
  "locale": "hi",
  "consent": { "method": "VERBAL_READ_BACK_WITNESSED", "witness_person_id": "per_01HZYF5G6H7J8K9T0M1N203P40", "recorded_at": "2027-03-10T09:00:00Z" },
  "expires_in": "PT45M",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Assisted session opened",
  "data": {
    "id": "assn_01HZYG6H7J8K9T0M1N203P4Q50",
    "object": "assisted_session",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["RECORD_ACTION", "CLOSE"],
    "user": { "type": "person", "id": "per_01HZYD3E4F5G6H7J8K9T0M1N20", "display": "[restricted]" },
    "assistant": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "assistant_appointment_id": "app_01HZYE4F5G6H7J8K9T0M1N2030",
    "purpose": "Assist a worker with limited literacy to submit a safety observation",
    "channel": "IN_PERSON_KIOSK",
    "locale": "hi",
    "consent": { "method": "VERBAL_READ_BACK_WITNESSED", "witness": { "type": "person", "id": "per_01HZYF5G6H7J8K9T0M1N203P40", "display": "M. Toppo" }, "recorded_at": "2027-03-10T09:00:00Z" },
    "grants_capability": false,
    "grants_capability_note": "The assistant acts under their own authority. Nothing in this session grants them the user's capabilities, and no credential or OTP of the user is used.",
    "credential_reuse": "PROHIBITED",
    "effective_actor_for_writes": "ASSISTANT",
    "started_at": "2027-03-10T09:00:00Z",
    "expires_at": "2027-03-10T09:45:00Z",
    "closed_at": null,
    "action_receipts": [],
    "extensions": {},
    "links": { "self": "/api/v1/assisted-sessions/assn_01HZYG6H7J8K9T0M1N203P4Q50" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-03-10T09:00:00Z" }
}
```

### RECORD_ACTION — consequential act

```json
{
  "action": "RECORD_ACTION",
  "expected_version": 1,
  "payload": {
    "target": { "type": "observation", "id": "obs_01HZYH7J8K9T0M1N203P4Q5R60" },
    "domain_action": "CREATE",
    "consequential": true,
    "values_read_back": { "description": "पूर्वी हॉल रोड पर बर्म गायब है, लगभग 40 मीटर", "hazard_category": "HAUL_ROAD", "raised_severity": "SIGNIFICANT", "location": "मुख्य गड्ढा, चेनेज 1.22 किमी" },
    "user_affirmation": { "method": "VERBAL_AFFIRMATION_WITNESSED", "affirmed_at": "2027-03-10T09:12:00Z", "witness_person_id": "per_01HZYF5G6H7J8K9T0M1N203P40" },
    "representative_authority": null
  }
}
```

```json
{
  "success": true,
  "message": "Assisted action recorded",
  "data": {
    "id": "assn_01HZYG6H7J8K9T0M1N203P4Q50",
    "object": "assisted_session",
    "version": 2,
    "state": "ACTIVE",
    "action_receipts": [
      {
        "id": "asrc_01HZYJ8K9T0M1N203P4Q5R6S70",
        "target": { "type": "observation", "id": "obs_01HZYH7J8K9T0M1N203P4Q5R60", "display": "Berm missing, east haul road" },
        "domain_action": "CREATE",
        "consequential": true,
        "values_read_back": { "description": "पूर्वी हॉल रोड पर बर्म गायब है, लगभग 40 मीटर", "hazard_category": "HAUL_ROAD", "raised_severity": "SIGNIFICANT", "location": "मुख्य गड्ढा, चेनेज 1.22 किमी" },
        "read_back_locale": "hi",
        "user_affirmation": { "method": "VERBAL_AFFIRMATION_WITNESSED", "affirmed_at": "2027-03-10T09:12:00Z", "witness": { "type": "person", "id": "per_01HZYF5G6H7J8K9T0M1N203P40", "display": "M. Toppo" } },
        "representative_authority": null,
        "actor": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
        "outcome": "SUCCEEDED",
        "recorded_at": "2027-03-10T09:12:04Z"
      }
    ],
    "available_actions": ["RECORD_ACTION", "CLOSE"]
  },
  "meta": { "action": "RECORD_ACTION", "transition": null, "effects": [ { "object": "assisted_action_receipt", "count": 1, "change": "CREATED" }, { "object": "observation", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-03-10T09:12:04Z" }
}
```

**A consequential assisted act carries the user's affirmation or a valid representative authority.** Without one, `422 UNPROCESSABLE` names which was missing. The receipt records exactly what was read back, in which locale, and who witnessed it.

---

## POST /accessibility-test-runs · conformance

**Auth:** `experience.accessibility.test`; a conformance statement needs `experience.conformance.approve`.

**An automated scan alone can never create a conformance statement.**

```json
{
  "success": true,
  "data": {
    "id": "actr_01HZYK9T0M1N203P4Q5R6S7T80",
    "object": "accessibility_test_run",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED",
    "available_actions": [],
    "standard_profile": { "type": "accessibility_standard_profile", "id": "asp_01HZYT0M1N203P4Q5R6S7T8V90", "display": "GIGW 3.0 / WCAG 2.1 AA" },
    "build": { "product_version": "1.5.0", "build_ref": "web-1.5.0+build.4412", "commit": "a1b2c3d" },
    "journey": { "type": "critical_journey_version", "id": "cjv_01HZYM1N203P4Q5R6S7T8V9V00", "display": "Field worker raises an observation, v4", "persona": "FIELD_WORKER", "consequential_actions": ["observation.create"] },
    "locale": "hi",
    "platform": { "browser": "Chrome 141", "os": "Android 16", "device": "Pixel 7", "viewport": "412x915" },
    "assistive_technology": { "name": "TalkBack", "version": "16.2.1" },
    "method": "MANUAL_WITH_AT",
    "tester": { "type": "person", "id": "per_01HZYN203P4Q5R6S7T8V9V0W10", "display": "D. Kujur" },
    "assertions": [
      { "criterion": "WCAG-1.3.1", "component": "observation-form.severity-selector", "state": "DEFAULT", "result": "PASS", "source": "MANUAL", "evidence_ref": "s3://strata-a11y/…" },
      { "criterion": "WCAG-4.1.2", "component": "observation-form.location-capture", "state": "ERROR", "result": "FAIL", "source": "MANUAL", "evidence_ref": "s3://strata-a11y/…", "detail": "The GPS-required error is announced only as a colour change; TalkBack reads nothing when the capture fails." },
      { "criterion": "WCAG-1.4.3", "component": "observation-form.submit", "state": "DISABLED", "result": "PASS", "source": "AUTOMATED", "evidence_ref": "s3://strata-a11y/…" }
    ],
    "evidence_manifest_hash": "sha256:9f2c8b1a…",
    "automated_only": false,
    "completed_at": "2027-03-12T15:00:00Z",
    "links": { "self": "/api/v1/accessibility-test-runs/actr_01HZYK9T0M1N203P4Q5R6S7T80" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-03-12T15:00:00Z", "effects": [ { "object": "accessibility_defect", "count": 1, "change": "CREATED" } ] }
}
```

Test evidence binds **exact build, journey, locale, platform, and assistive-technology version**. "It passed on Chrome" is not evidence.

### Conformance statement

```json
{
  "success": true,
  "data": {
    "id": "cfst_01HZY03P4Q5R6S7T8V9V0W1X20",
    "object": "conformance_statement",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "APPROVED",
    "available_actions": ["SUPERSEDE"],
    "product_version": "1.5.0",
    "scope": { "surfaces": ["WEB", "MOBILE_ANDROID"], "journeys": ["cjv_01HZYM1N203P4Q5R6S7T8V9V00", "cjv_01HZYP4Q5R6S7T8V9V0W1X2Y30"], "locales": ["en", "hi"], "out_of_scope": ["MOBILE_IOS", "Regulator portal surfaces"] },
    "standard": { "profile_id": "asp_01HZYT0M1N203P4Q5R6S7T8V90", "display": "GIGW 3.0 / WCAG 2.1 AA", "level": "AA" },
    "statement_date": "2027-03-20",
    "test_runs": ["actr_01HZYK9T0M1N203P4Q5R6S7T80", "actr_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "actr_01HZYR6S7T8V9V0W1X2Y3Z4A50"],
    "automated_only": false,
    "manual_and_user_test_included": true,
    "limitations": [
      "One open Serious defect (a11y-2027-0114) affects the location-capture error announcement on Android with TalkBack. An exception with equivalent access is in force until 2027-05-31.",
      "iOS was not tested for this version and is out of scope.",
      "Hindi screen-reader testing used TalkBack only; NVDA and JAWS Hindi behaviour is untested."
    ],
    "open_defects": [{ "id": "adef_01HZYS7T8V9V0W1X2Y3Z4A5B60", "severity": "SERIOUS", "criterion": "WCAG-4.1.2", "exception_id": "aexc_01HZYT8V9V0W1X2Y3Z4A5B6C70", "equivalent_access": "A supervisor-assisted paper path is available at every pit-head kiosk", "remediation_deadline": "2027-05-31" }],
    "approved_by": { "type": "person", "id": "per_01HZY8H9J0K1T2M3N405P6Q7R0", "display": "K. Bhagat" },
    "approved_at": "2027-03-20T10:00:00Z",
    "links": { "self": "/api/v1/conformance-statements/cfst_01HZY03P4Q5R6S7T8V9V0W1X20" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-03-20T10:00:00Z" }
}
```

The `limitations` array is the honest part of a conformance statement, and it is required. An accessibility **exception expires and requires equivalent access plus a remediation owner** — both are shown against the open defect.

---

## Invariants

- Business codes, capabilities, and statuses are locale-neutral; a localized label is never a command input.
- A translation binds an exact immutable source version and hash, and never overwrites the original content or evidence.
- A source change marks translations stale, and the risk policy decides fallback, block, or review.
- Authoritative and convenience translation are explicitly distinguished on every job and published rendering.
- Machine provider, model, glossary, and prompt versions plus redaction status are always recorded.
- High-risk translation publication enforces independent domain and legal review.
- Original-script names and identifiers are preserved; a transliteration is an alias, never a replacement.
- A user's locale preference never changes authorization, jurisdiction, a deadline, or legal applicability.
- An assisted session cannot grant a capability, always expires, and the assistant never reuses the user's credential or OTP.
- A consequential assisted act carries the user's affirmation or a valid representative authority.
- An accessible derivative links its exact original and hash, and declares its transformation and limitations.
- An automated scan alone can never create a conformance statement.
- Test evidence binds exact build, journey, locale, platform, and assistive-technology version.
- Accessibility exceptions expire and require equivalent access plus a remediation owner.
- Locale pack activation is atomic and versioned; an offline client never silently mixes incompatible keys.
- Protected content is redacted or authorized before any translation, TTS, transcription, or provider call.
- Every mutation uses idempotency and optimistic concurrency, with append-only approval and audit history.

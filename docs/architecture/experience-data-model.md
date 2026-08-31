# Localization, Accessibility and Assisted Use Logical Data Model

This model implements the [experience specification](../features/experience/localization-accessibility-assisted-use-spec.md). It does not duplicate domain content or authority.

## 1. Locale and terminology

- `locale_definition` — BCP 47 code, script, formats, fallback and lifecycle.
- `person_locale_preference` — UI/content/channel preference and provenance; not authority.
- `terminology_entry` / `terminology_version` — stable semantic key, domain definition, context, prohibited synonyms, English/Hindi labels and review.
- `message_key` / `message_version` — locale-neutral key, variables/types, context and source owner.
- `localized_message` — locale rendering, glossary/source version, status, reviewer and effective interval.
- `locale_pack` / `locale_pack_manifest` — approved messages/terms/help, platform/version/hash, offline compatibility and expiry.

## 2. Content and translation

- `translatable_content_ref` — source domain/object/version/field, source locale, risk class and hash.
- `translation_job` — target locale, purpose, route, glossary, priority and lifecycle.
- `translation_candidate` — human/machine/provider/model, text/object ref, confidence and warnings.
- `translation_review` / `published_translation` — reviewer, fidelity/terminology/accessibility verdict, exact source/candidate and effective version.
- `translation_staleness_event` — source change, affected translations/packs/templates and disposition.
- `transcription_record` — original audio/text reference, language, candidate, timestamps/confidence, read-back and confirmation.
- `accessible_derivative` — original document/evidence version, derivative type/hash, transformation/provenance and limitations.

## 3. Assisted use

- `assisted_session` — user/reporter, assistant principal/appointment, purpose, channel, locale, consent method, start/expiry/closure.
- `assisted_action_receipt` — exact target/action, values read back/affirmed, actor, user confirmation and outcome.
- `interpreter_assignment` — person/service, languages, confidentiality/conflict, purpose and validity.
- `kiosk_session` — device/site, privacy mode, cleanup/print state and termination proof.
- `safe_contact_preference` — permitted locale/channel/time/neutral-message rules owned by relevant domain.

## 4. Accessibility governance and testing

- `accessibility_standard_profile` — GIGW/WCAG/version/level/platform scope and effective dates.
- `critical_journey_version` — surface/persona/locale/steps, consequential actions and required test matrix.
- `accessibility_test_run` — build/version, journey, locale, browser/device/AT, method, tester and evidence manifest.
- `accessibility_assertion` — criterion/component/state, result, evidence and automation/manual/user-test source.
- `accessibility_defect` — criterion, severity, affected users/journeys/locales, owner, remediation/retest.
- `accessibility_exception` — equivalent access, risk, approver, expiry and remediation deadline.
- `conformance_statement` — exact product version/scope/date/standard/tests/limitations and approval.

## 5. Mandatory constraints

1. Business codes/capabilities/statuses are locale-neutral; localized labels cannot be command inputs.
2. Translation binds exact immutable source version/hash and never overwrites original content/evidence.
3. Source change marks translations stale; risk policy decides fallback/block/review.
4. Authoritative and convenience translation are explicitly distinguished.
5. Machine provider/model/glossary/prompt versions and redaction are recorded.
6. High-risk translation publication enforces required independent/domain/legal review.
7. Original-script names/identifiers are preserved; transliteration is an alias.
8. User locale preference does not change authorization, jurisdiction, deadline or legal applicability.
9. Assisted session cannot grant capability and expires; assistant never reuses user credential/OTP.
10. Assisted consequential act carries user affirmation or valid representative authority.
11. Accessible derivative links exact original/hash and declares transformation/limitations.
12. Automated scan alone cannot create a conformance statement.
13. Test evidence binds exact build, journey, locale, platform and assistive-technology version.
14. Accessibility exceptions expire and require equivalent access plus remediation owner.
15. Locale pack activation is atomic/versioned; offline client never mixes incompatible keys silently.
16. Protected content is redacted/authorized before translation, TTS, transcription or provider calls.
17. Mobile journey records are limited to inspector/field-worker scope until an approved scope version expands it.
18. Every mutation uses idempotency/concurrency and append-only approval/audit history.

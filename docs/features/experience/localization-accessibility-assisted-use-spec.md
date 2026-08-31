# Strata — Localization, Accessibility and Assisted Use Specification

## 1. Purpose and scope

This specification owns `CAP-21` and cross-domain English/Hindi, accessibility, low-literacy and assisted-use behavior. It applies to the responsive web portal for all personas and the currently planned mobile app only for inspectors and field workers. Dedicated mobile pages for every other persona are `TBD`.

Production targets [GIGW 3.0](https://guidelines.india.gov.in/gigw3/) and its WCAG 2.1 Level AA baseline, while engineering to [WCAG 2.2 AA](https://www.w3.org/TR/WCAG22/) where it adds forward-compatible criteria. Certification/conformance is claimed only after applicable STQC/competent assessment, never from automated scans alone.

English and Hindi are the initial supported product locales. Other scheduled languages are roadmap additions using the same governed contract, not automatic machine-translation claims.

## 2. Canonical distinctions

| Concept | Meaning | Not equivalent to |
|---|---|---|
| Locale | Language/script/region/formats used for one presentation | user authority or geography |
| Canonical semantic value | Stable code/typed value used by APIs/workflows | translated label |
| Source-language content | Authored/versioned text from its owner | automatically English |
| Translation | Versioned rendering linked to exact source version | source truth rewrite |
| Authoritative legal text | Issued text/version designated by competent owner | convenient UI translation |
| Accessible name | Programmatic control identity for assistive technology | visual tooltip |
| Plain-language rendering | Simpler explanation preserving material meaning | legal replacement |
| Assisted action | User decision/capture performed with disclosed helper | helper’s independent decision |
| Interpretation | Human language mediation with provenance/confidentiality | machine translation |

## 3. Locale and terminology governance

APIs, event types, database codes, capability names, status machines and audit semantics remain locale-neutral stable identifiers. Display text comes from a versioned message/terminology catalogue. Never store translated status labels as business state or branch code on UI strings.

Each canonical term has domain owner, definition, prohibited synonyms, grammatical context, English/Hindi approved labels, abbreviation, screen-reader expansion and effective version. High-risk terms—finding, allegation, acknowledgement, acceptance, verified, disposed, waived, anonymous, regulator/authority—require domain/legal review. Search synonyms do not redefine legal equivalence.

User locale preference is independent of authored/evidence language. Every screen supports explicit language switch without losing route, form values, draft or authorization context. Locale fallback is field/message specific and visibly declared; mixed-language screens do not silently imply complete translation.

## 4. Content and translation lifecycle

```text
SOURCE_DRAFT → SOURCE_APPROVED → TRANSLATION_REQUESTED
→ MACHINE_CANDIDATE | HUMAN_DRAFT → REVIEWED → PUBLISHED
                                      └────→ REJECTED/SUPERSEDED
```

Translations bind exact source content/version, target locale, purpose, engine/model or translator, glossary version, reviewer, quality verdict and effective interval. A source change marks dependent translations `STALE`; high-risk content falls back to the approved source or blocks publication according to policy rather than showing obsolete translation.

Machine translation may draft low-risk help/UI content. Statutory text, directions, findings, consent, safety/emergency instructions, grievance disposition, legal notices, attestations and user-submitted evidence require policy-defined human/legal review. The UI identifies unofficial convenience translations and provides the authoritative source text/document.

User-authored content remains in original form. Transcription/translation is additive with confidence/reviewer/provenance; it never overwrites the statement or evidence. Quotes preserve source language and anchors.

## 5. Formatting, input and search

- Use Unicode throughout; normalize for comparison/search without changing stored originals.
- Use locale-aware dates, numbers and units for display while always showing unambiguous dates in high-risk contexts; APIs remain ISO/RFC formats.
- Preserve identifiers, mine codes, registration numbers, coordinates and statutory references exactly; never transliterate them as substitutes.
- Support Devanagari/Latin input, IME composition, copy/paste, voice candidate review and mixed-script names.
- Person/organization names store original script plus verified transliteration/aliases, not forced translation.
- Search records query locale/analyzer/transliteration expansion and distinguishes exact identifier, lexical translation and semantic candidates.
- PDFs/downloads expose language, reading order, embedded Unicode fonts, tags/headings/tables/alternatives and the source/translation status.

## 6. Web accessibility requirements

Every web journey must provide semantic landmarks/headings, meaningful page title, skip link, keyboard-only completion, visible/unobscured focus, logical order, programmatic name/role/state/error, sufficient contrast, zoom/reflow, target size, non-colour cues, reduced-motion behavior and no unexpected context change.

Forms provide persistent labels, instructions before input, correct autocomplete/input purpose, examples, required/optional state, inline+summary errors linked to fields, preserved valid values, review-before-submit for consequential actions and accessible recovery. Authentication cannot rely solely on memory puzzles, transcription or inaccessible CAPTCHA; provide an equivalent approved path.

Dynamic updates, sync, timers, toasts, validation and background jobs use appropriate live regions without noise. Modals trap/restore focus correctly. Tables have headers/captions and responsive alternatives; maps/charts provide textual/tabular equivalents and keyboard-accessible details. Evidence images require purpose-specific descriptions; decorative images are hidden.

Audio/video has accurate captions/transcripts and audio description where needed. No flashing/auto-playing critical content. Session timeout gives accessible warning/extension where security permits and preserves drafts safely.

## 7. Inspector and field-worker mobile accessibility

The Flutter/Android field app honors TalkBack, font scaling, display scaling, contrast/inversion, reduced motion, hardware/software keyboards, switch/external input and platform accessibility semantics. Touch targets, gestures and drag actions have alternatives. Camera/GNSS/audio controls explain permissions and provide approved manual/assisted fallbacks without fabricating evidence quality.

Offline queues expose saved/pending/sync-failed state through text and assistive semantics, not colour/icon alone. Locale packs, glossary, help and critical safety messages needed for assigned work are available offline with version/freshness. Sync conflict/error recovery preserves focus, entered data and original language.

This does not expand mobile scope: manager/corporate/contractor/applicant/grievance-handler/non-field-regulator app pages remain `TBD`.

## 8. Low-literacy and cognitive accessibility

Use task language, short sentences, one decision per step, progressive disclosure, examples, confirmation of irreversible acts, consistent help and recognizable icons paired with text. Do not hide legal meaning through oversimplification. A plain-language summary links to the complete authoritative content and identifies what it omits.

Users can pause/resume, review answers, correct without restarting and see “what happens next.” Avoid unexplained acronyms and numeric-only severity. Instructions never rely only on direction, colour, shape or sound. Critical timelines show date/time plus human-readable remaining time without replacing the exact deadline.

## 9. Assisted, kiosk, voice and interpreter use

An authorized assistant can help navigate/transcribe only through an explicit assisted session recording user, assistant principal/appointment, purpose, channel, consent/attestation, language, actions and expiry. The user reviews/affirms consequential content through an accessible method; the assistant cannot use the user’s cookie/OTP, sign, approve, withdraw or waive unless separately authorized as representative.

Kiosks protect shoulder-surfing, clear local/cache/print artifacts, support screen reader/headphones and end sessions visibly. Telephone/voice intake records spoken language, consent, transcription confidence, read-back/confirmation and safe-contact rules. Voice output does not speak protected details where others may hear.

Human interpreters/translators have confidentiality, conflict and purpose-limited access. Machine speech/translation always presents editable candidates; low confidence or high-risk content routes to human review. Biometric voice identity/emotion inference is out of scope.

## 10. Notifications and emergency communication

Preferred language/channel is a preference, not proof of comprehension or delivery. Message templates bind event semantics, locale, terminology and version. Critical messages keep exact subject/deadline/action and use plain language; Hindi and English may both be included under policy when recipient preference is unknown.

Translation unavailable/stale, font/render failure, SMS truncation or TTS failure is a delivery defect and invokes fallback/escalation. Acknowledgement means receipt/understanding action defined by workflow—not that a message was translated or sent. Emergency physical alarms/procedures never depend on app language services.

## 11. Accessibility and translation of evidence/legal acts

Signing/attestation binds the exact authoritative content hash and explicitly lists any convenience translations. A signer must be able to access the authoritative content in an accessible form; translation cannot silently change the signed payload. If accessible conversion would alter evidentiary form, provide a linked accessible derivative with provenance and retain the original.

Redaction is applied before translation, speech or external language-provider processing. Protected grievance, medical, biometric, identity and investigation content cannot leave approved boundaries merely to improve language access.

## 12. Testing and release gates

Automated lint/scans are necessary but insufficient. For every critical journey and both supported locales test:

- keyboard-only and visible focus;
- NVDA/Firefox or Chrome and a second approved desktop screen-reader/browser combination;
- TalkBack/Android for planned inspector/field-worker app journeys;
- 200%/400% zoom/reflow, text spacing, contrast/high-contrast, reduced motion;
- speech/IME/mixed-script input and long Hindi expansion;
- form errors, timeout, offline/sync conflict, notifications and downloads;
- captions/transcripts, maps/charts/tables and document reading order;
- low bandwidth/device, no language-provider and stale locale-pack fallback; and
- testing with disabled users and representative Hindi/low-literacy users.

Each defect records criterion, journey/component, locale/assistive tech, severity, evidence, owner and retest. Critical blockers prevent release; exceptions require bounded approval, equivalent access and deadline. Conformance statements name tested version/scope/date/standard and known limitations.

## 13. Authorization capabilities

| Capability | Target |
|---|---|
| `experience.locale.configure`, `experience.terminology.configure`, `experience.terminology.publish` | locale/term/version |
| `experience.content.translate`, `experience.translation.review`, `experience.translation.publish` | content/translation |
| `experience.assistance.start`, `experience.assistance.act`, `experience.interpreter.assign` | assisted session/target |
| `experience.accessibility.test`, `experience.accessibility.exception.approve` | release/journey/defect |
| `experience.locale_pack.publish`, `experience.audit` | locale pack/authorized scope |

Translation capability grants no source edit or business decision. Assistant/interpreter visibility is minimum-purpose and expires with the session.

## 14. Acceptance scenarios

The implementation must prove:

1. switching English/Hindi mid-form preserves values, errors, scope and draft;
2. stale Hindi legal text is blocked/labelled and authoritative source remains available;
3. translated status label cannot change API/workflow state;
4. screen-reader/keyboard user completes grievance intake and appeal;
5. TalkBack user completes assigned offline inspection capture and sync recovery;
6. 400% reflow retains actions/errors without two-dimensional scrolling except valid content;
7. Hindi IME/mixed-script name and exact statutory ID survive round trip/search;
8. assistant cannot see another case, steal OTP or sign for user;
9. voice/machine translation low confidence routes to confirmation/human review;
10. map/chart has equivalent data/action and never relies on colour;
11. provider outage uses approved source/fallback without blocking emergency/core work;
12. accessible derivative remains linked to original evidence/hash; and
13. other-role dedicated mobile route is absent/marked TBD rather than a broken implied page.

## 15. Non-goals and dependencies

This wave does not claim STQC/GIGW certification, support all 22 scheduled languages, guarantee machine translation of legal content, build a general voice biometric assistant or expand mobile beyond inspectors/field workers. Content/design/domain owners must approve Hindi terminology/translations and plain-language summaries. Wave 15 owns executable accessibility gates, production device/browser matrix, performance/security/DR and migration of legacy inaccessible content.

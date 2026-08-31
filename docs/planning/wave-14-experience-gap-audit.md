# Wave 14 — Localization, Accessibility and Assisted Use Gap Audit

## A. Outcome and boundary

English/Hindi users can perceive, understand, navigate and complete critical web journeys; inspectors/field workers can do so in the planned offline mobile app. Assisted users retain agency and audit. Other-role mobile pages remain TBD.

## B. Actors and accountability

User, disabled/low-literacy user, inspector/field worker, assistant, interpreter/translator, content/domain/legal owner, accessibility tester, product/design/engineering owner, privacy/security and conformance authority.

## C. Sources and outputs

Sources are stable semantic codes, source content/evidence, terminology/message catalogues, user preference, translations/transcriptions and build/journey definitions. Outputs are localized accessible UI/content/documents, locale packs, assisted receipts, defects/tests/exceptions and scoped conformance statements.

## D. Lifecycles and semantics

Source content, translation, transcription, accessible derivative, locale pack, assisted session, test/defect/exception and conformance remain separate. Translation never changes legal/business meaning or source evidence.

## E. Authorization and separation

Translator != source editor/decision maker; assistant != user/representative automatically; locale != authority; machine provider != publisher; automated scanner != conformance authority. Protected content is authorized/redacted before language services.

## F. Cross-domain consistency

Stable domain codes drive workflow/API/audit. Every domain supplies translatable content risk and accessible critical journeys. Search, notifications, reports, evidence, grievances, AI and offline mobile retain source/translation/version/provenance.

## G. Failure and adversarial scenarios

Mid-form switch, stale legal translation, string-as-state bug, keyboard/screen reader, TalkBack offline sync, 400% reflow, Hindi IME/mixed ID, assistant credential abuse, low-confidence voice, colour-only map, provider outage, derivative evidence and unplanned mobile route were challenged.

## H. Standards and testing

GIGW 3.0/WCAG 2.2 AA target, platform guidance, automated+manual+AT+disabled-user testing, locale/long-text/low-bandwidth/offline/provider-failure matrix and scoped honest conformance are specified.

## I. Gap dispositions

### GAP-14-001

- **Gap:** English/Hindi intent lacked locale-neutral codes, governed terms, translations and staleness.
- **Impact:** strings could alter workflow meaning or show obsolete legal/safety content.
- **Resolution:** versioned terminology/message/source-linked translation and risk-based fallback/publication.
- **Status:** `RESOLVED`.

### GAP-14-002

- **Gap:** accessibility was a checklist item without critical-journey/platform/assistive-tech release evidence.
- **Impact:** automated scans could falsely claim usable government service.
- **Resolution:** GIGW/WCAG profile, manual/AT/user test matrix, defects/retests/exceptions and scoped conformance.
- **Status:** `RESOLVED`.

### GAP-14-003

- **Gap:** legal/evidence translation could overwrite or be mistaken for authoritative source.
- **Impact:** altered signed meaning, evidence loss or unsafe action.
- **Resolution:** immutable source/hash, convenience/authority label, reviewed translation and accessible derivative provenance.
- **Status:** `RESOLVED`.

### GAP-14-004

- **Gap:** assisted/kiosk/voice use lacked agency, credential, confidentiality and action boundaries.
- **Impact:** helper impersonation, OTP theft, coerced action or protected disclosure.
- **Resolution:** consented expiring assisted sessions, separate authority, read-back/affirmation, interpreter controls and cleanup.
- **Status:** `RESOLVED`.

### GAP-14-005

- **Gap:** offline mobile locale/accessibility behavior and persona scope were ambiguous.
- **Impact:** inaccessible sync recovery or implied manager/contractor/applicant mobile commitments.
- **Resolution:** offline locale packs/TalkBack/error semantics for inspectors/field workers only; every other mobile page explicitly TBD.
- **Status:** `RESOLVED`.

### GAP-14-006

- **Gap:** search/notification/form/date/name/identifier handling could corrupt Hindi/mixed-script meaning.
- **Impact:** missed records, ambiguous deadlines and identity mismatch.
- **Resolution:** Unicode/original preservation, exact IDs, locale-aware display with canonical wire formats, analyzer/transliteration provenance.
- **Status:** `RESOLVED`.

### GAP-14-007

- **Gap:** machine translation/TTS/ASR could leak data or publish low-confidence output.
- **Impact:** confidentiality breach and harmful mistranslation.
- **Resolution:** approved provider/classification, redaction, model provenance, candidate-only output, confidence/human review and fallback.
- **Status:** `RESOLVED`.

### GAP-14-008

- **Gap:** approved Hindi corpus/terminology, disabled/low-literacy user research, STQC assessment and production device/browser/AT evidence do not yet exist.
- **Impact:** design cannot claim certified conformance or complete linguistic quality.
- **Resolution:** architecture/testing contract fixed; owners approve content/research, and Wave 15 implements gates/certification evidence.
- **Status:** `ACCEPTED_RISK`.

## J. Decisions requiring human approval

1. Domain/legal/content owners approve canonical terms, authoritative language, high-risk translation and plain-language content.
2. Accessibility/conformance owners approve standards profile, critical journeys, test matrix, exceptions and certification scope.
3. Privacy/security approve translation/speech providers, protected-content boundary and kiosk/assistance controls.
4. Product owners approve any future language or mobile-persona expansion as a versioned scope decision.

## K. Canonical documents that must change

Feature, logical model, API/indexes, mobile scope, authorization, glossary, capability/inventory, PRD/workflow/dashboard, decisions and tracker.

## L. Exit verdict

**Pre-design verdict: FAIL.** English/Hindi and accessibility were promises without governed content, assisted-use authority or release evidence; mobile persona scope was ambiguous.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-14-001 through 007 are resolved. GAP-14-008 remains an explicit content/research/STQC/Wave 15 dependency.

# Grievance and Protected Intake Logical Data Model

This model implements the invariants in the [grievance specification](../features/grievances/grievance-and-protected-intake-spec.md). It is logical, not executable DDL.

## 1. Policy and routing

- `grievance_case_type` — stable semantic type.
- `grievance_case_type_version` — effective interval, audience, applicability, execution mode, authoritative system, confidentiality, identity modes and publication proof.
- `grievance_clock_rule` — acknowledgement, assessment, transfer, interim, disposal and appeal clock definition.
- `grievance_route_policy` — primary/alternate posts, jurisdiction, language, conflict and escalation rules.
- `grievance_channel_profile` — web/kiosk/telephone/mail/external endpoint, assurance, consent and continuity behavior.
- `grievance_projection_policy` — reporter/handler/oversight/public fields, masking, cohort threshold and retention.

Published versions are immutable. A case binds the effective versions used at receipt/triage; later policy changes create explicit reevaluation rather than rewriting history.

## 2. Intake and reporter separation

- `grievance_intake` — immutable receipt, channel, received/occurred assertions, language, scope hints, narrative ciphertext/reference, source proof and safety-screen state.
- `grievance_intake_statement` — additive correction/translation/transcription/read-back with author, time and relationship to prior statement.
- `grievance_reporter_ref` — opaque case-facing reporter identifier and identity mode.
- `grievance_reporter_vault` — separately encrypted identity/contact/safe-contact data and verification provenance.
- `grievance_reporter_access_receipt` — actor, appointment, purpose, reason, assurance, approval, fields revealed and time.
- `grievance_attachment` — document/evidence reference, submitter assertion, malware/quarantine and classification.
- `grievance_receipt_credential` — hashed high-entropy reference/secret, delivery route, expiry/recovery and revocation; never stores plaintext secret.

## 3. Case and participation

- `grievance_case` — public-safe number, type/version, authoritative mode/system, status, urgency, confidentiality, affected resource, owning post, external reference and concurrency version.
- `grievance_case_intake_link` — many-to-many link/split/duplicate relation with human decision.
- `grievance_case_party` — complainant/affected/subject/witness/representative relationship with visibility; allegation is not a finding.
- `grievance_assignment` — post/appointment/team, function, accepted interval, source route and handover.
- `grievance_conflict_declaration` — actor/party relationship, declared/detected basis, decision and recusal/replacement.
- `grievance_transfer` — from/to authority/post/system, reason, sent/accepted times, proof and clock effect.
- `grievance_status_event` — append-only transition, reason, actor, authority, policy and visible projection.
- `grievance_note` — versioned classified note; complainant-visible and internal/legal notes are distinct kinds.

## 4. Triage, cross-domain work and redress

- `grievance_triage_assessment` — policy candidates, urgency/harm, confidentiality, jurisdiction, automation recommendation and human decision.
- `grievance_related_record` — typed link to incident, observation, defect, inspection, CAPA, environment, contractor, attendance, regulatory/service or specialized case; includes relationship and visibility.
- `grievance_action` — action owner post, owning domain, instruction, due rule, state, dependency and verification requirement.
- `grievance_action_event` — progress/reassignment/completion claim with evidence.
- `grievance_action_verification` — independent verdict, verifier authority, evidence manifest and reason.
- `grievance_information_request` / `grievance_information_response` — immutable rounds, due state and partiality.

Cross-domain records own their business truth. Grievance stores links and safe projections, never a copied “closed” boolean.

## 5. Response, disposition, feedback and appeal

- `grievance_response_version` — audience, language, structured outcome, safe narrative, linked-action snapshot and author.
- `grievance_quality_review` — checklist/version, reviewer, conflict check, verdict and required changes.
- `grievance_disposition` — frozen response version, code, issuing authority/post, issue/delivery evidence and appeal policy.
- `grievance_feedback` — satisfaction/reason/contact consent; it does not mutate disposition.
- `grievance_appeal` — separate lifecycle, grounds, original disposition and independent route.
- `grievance_appeal_event` / `grievance_appeal_decision` — assignment, review, result and new directions.
- `grievance_reopen` — basis, approving authority and link to prior closure.

## 6. Protection, external reconciliation and clocks

- `grievance_safeguarding_concern` — protected retaliation/victimisation/life-safety concern and separate owner.
- `grievance_protective_action` — minimum-disclosure instruction, owner, due state and verification.
- `grievance_external_case` — system/channel, external ID namespace, mapped state, freshness and permitted metadata.
- `grievance_external_event` — immutable raw payload/hash, observed/occurred time, correlation and reconciliation state.
- `grievance_clock_instance` — case/rule/version, start, due, pause/extension intervals and computed state.
- `grievance_escalation_event` — trigger, target post, delivery/acceptance and fallback.
- `grievance_communication` / `grievance_delivery_attempt` — safe template/version, audience, channel, neutral notification, transport and receipt proof.

## 7. Analytics and audit

- `grievance_aggregate_manifest` — authorized population, policy, dimensions, suppression and source checkpoint.
- `grievance_pattern_signal` — cluster/risk hypothesis, method/version, provenance, confidence and reviewer disposition.
- `grievance_case_access_log` — case/projection access without copying protected narrative into ordinary logs.
- `grievance_retention_action` / `grievance_legal_hold` — effective schedule, scope, destruction/anonymization proof and hold precedence.

## 8. Mandatory constraints

1. Client tenant/mine/category never proves authority or route.
2. Intake and statements are append-only; linking/duplicate decisions do not erase them.
3. Reporter vault data is not stored in case/search/analytics rows.
4. `ANONYMOUS` cannot be upgraded to identified without a new consented assertion.
5. Case read, reporter-identity read, disposition and appeal authority are independent.
6. A conflicted/implicated actor cannot satisfy a protected assignment or review gate.
7. Every active case has one accepted accountable owner post or an explicit overdue routing exception.
8. Transfer sent is not transfer accepted and never closes the source responsibility silently.
9. Disposition is immutable; feedback, appeal and reopen are separate records.
10. Complaint allegation never creates a finding or adverse eligibility decision automatically.
11. Linked domain completion is read from its owner/version; grievance cannot forge it.
12. External submission, transport, acknowledgement, acceptance and disposal are distinct.
13. Clock pause/extension requires allowed reason, interval, authority and audit.
14. Public/reference-token status uses a privacy-safe projection and rate limiting.
15. Small protected cohorts are suppressed; pattern signals cannot expose reporter identity.
16. Search projection excludes reporter vault and protected narrative by default.
17. Legal hold overrides retention disposal; destruction never deletes required audit proof.
18. Every lifecycle mutation uses optimistic concurrency and idempotency for commands/imports.

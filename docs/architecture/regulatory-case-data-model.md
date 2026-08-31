# Applications and Regulatory Cases — Logical Data Model

Read with the [application/case specification](../features/regulatory-cases/application-and-case-spec.md). Reporting owns filing packages; documents own artifacts; integration owns transport; authorities own federated decisions.

## 1. Catalogue and discovery

- `regulatory_service`: stable approval/service identity and responsible authority.
- `regulatory_service_version`: legal source, execution mode, applicability, schema, stages, requirements, clocks, signer/channel and remedy policy.
- `regulatory_stage_definition` / `regulatory_transition_definition`: service-version state machine and authority requirements.
- `approval_assessment`: project/subject, input-fact manifest, catalogue cut, lifecycle and reviewer.
- `approval_assessment_item`: service/version, outcome, explanation, missing facts and confidence.

## 2. Applicant side

- `application`: service version, applicant organization, project/mine/subject, lifecycle and applicant team.
- `application_participant`: person/organization, participation function, representation grant and validity.
- `application_requirement_instance`: requirement definition, applicability/state, source/artifact/report/data reference and reuse review.
- `application_content_version`: immutable typed fields, source manifest, validation, review and supersession.
- `application_submission_link`: reporting filing package/submission and receiving case correlation.

## 3. Authority case

- `regulatory_case`: service, application, execution mode, authoritative system, local/external ID, normalized/raw state, stage and freshness.
- `case_assignment`: authority unit/post/person participation, mandate/jurisdiction, function, accepted time and validity.
- `case_milestone`: basis, start/due/pause/resume/completion, accountable route and status.
- `case_exception`: vacancy, missing state, dependency, SLA, identity/correlation or procedural issue and owner.
- `external_case_snapshot`: source system, remote ID/state/payload artifact, observed time and provenance.

## 4. Exchanges and events

- `regulatory_correspondence`: issuer/recipient, authority, kind, content/artifact, issued/delivered/acknowledged times.
- `regulatory_query_round`: case, sequence, issue/response deadline, state and filing links.
- `regulatory_query_item`: requirement, request kind, text/source anchor, state and decision.
- `query_response_item`: response version, evidence, applicant authority and submission/receipt.
- `case_event`: site visit/hearing/consultation/meeting, notice, schedule/location, state and outcome.
- `case_event_participant`: function, organization/person, attendance, authority, conflict/recusal.
- `case_minutes_version`: immutable minutes, review/publication and artifact.
- `case_recommendation`: input manifest, body/committee, quorum, conflicts, outcome and signature.

## 5. Decision and instrument

- `regulatory_decision`: case, native/mirror kind, outcome, reasons, conditions, authority/quorum, effective time, signature and source evidence.
- `regulatory_instrument`: stable permission/clearance identity, issuing authority, subject and kind.
- `regulatory_instrument_version`: decision/document, scope/capacity/geometry, validity, conditions, state and supersession.
- `case_relationship`: renewal/amendment/transfer/surrender/suspension/revocation/appeal/review/stay relation.
- `regulatory_case_reconciliation`: local/external/doc disagreement, assertions, resolution and authority.
- `regulatory_impact_case`: catalogue/decision/instrument change and downstream affected records.

## 6. Constraints

1. Published service versions are immutable and cannot overlap ambiguously for one jurisdiction/service precedence key.
2. Execution mode and authoritative system are mandatory and effective-dated.
3. Application content/submission is immutable; changes create superseding versions/packages.
4. Reused requirements retain original artifact/data identity plus service-specific reuse review.
5. Applicant representation and authority case assignment are time-bounded and action-specific.
6. Federated case state requires external snapshot provenance/freshness; it cannot be authored as native.
7. Raw external state and normalized mapping version are retained together.
8. Query rounds/items and responses are append-only; partial acceptance cannot close remaining items.
9. Recommendation cannot finalize without configured quorum/conflict rules.
10. Native decision requires current competent authority and exact input/case manifest.
11. Mirrored decision cannot claim Strata issuer and requires authority evidence.
12. Instrument conditions do not become obligations until compliance publication.
13. Appeal/review does not alter challenged decision without separate stay/outcome relation.
14. External ID correlation is unique per authoritative system/service and fuzzy matches cannot auto-merge.
15. Deletion is prohibited after submission/case creation; withdrawal, closure and supersession preserve history.
16. Applicant/internal-authority/public projections use field/artifact classification before query/export.

## 7. Lifecycles

```text
application: DRAFT → PREPARING → READY_FOR_REVIEW → READY_TO_SIGN
             → ATTESTED → READY_TO_SUBMIT → SUBMITTED
             → WITHDRAWN | SUPERSEDED

case(normalized): RECEIVED → ADMITTED → UNDER_SCRUTINY
                 ↔ IN_APPLICANT_RESPONSE
                 → SITE_REVIEW | HEARING_OR_CONSULTATION
                 → UNDER_DECISION → DECIDED → CLOSED
                 ↘ RETURNED | REJECTED | WITHDRAWN | UNKNOWN_EXTERNAL_STATE
```

Service-specific stages map to normalized states without discarding raw semantics.

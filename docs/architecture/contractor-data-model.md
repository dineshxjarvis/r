# Contractor Compliance — Logical Data Model

Read with the [contractor specification](../features/contractors/contractor-compliance-spec.md) and [identity contractor contract](../api-specs/endpoints/identity/contractors.md). Identity entities are referenced, not duplicated.

## 1. Engagement and package

- `contractor_engagement`: organization, operator/tenant, target, contract reference, validity and independent lifecycle.
- `contractor_work_package`: engagement, mine/asset/zones, work kinds, hazard class, headcount ceiling, accountable posts, validity and state.
- `subcontract_relationship`: parent package, prime organization, subcontractor organization, disclosed scope, approval and validity.
- `package_assignment`: person/vehicle/equipment, direct employer, package, trade/use, validity and state.
- `contractor_roster_version`: immutable submission manifest and supersession chain.

## 2. Requirements and evidence

- `contractor_requirement_definition`: stable requirement meaning and subject kind.
- `contractor_requirement_policy_version`: effective selector, source instrument, blocking/exception rule and reviewer authority.
- `contractor_requirement_instance`: selected policy, subject, package/engagement, state and validity.
- `requirement_evidence_link`: instance, document/evidence/external mirror, asserted fields and purpose.
- `requirement_review`: decision, reviewer authority, reasons and source snapshot.
- `external_credential_mirror`: issuer identifier, observed status, checked time, provenance and freshness.

## 3. Eligibility and exceptions

- `contractor_eligibility_decision`: subject, package, work/zone/purpose, result, evaluated time, valid-until and policy/input manifest hash.
- `eligibility_reason`: decision, requirement/input, code, severity and remediation.
- `contractor_exception`: requested scope, requirement, compensating controls, validity, state and immutable approvals/revocations.
- `access_decision_receipt`: gate/system, eligibility decision, online/offline mode, admitted/denied outcome and reconciliation state.

## 4. Attribution and performance

- `contractor_attribution`: source-domain record, engagement/package/direct employer, responsibility kind and recorded-at snapshot.
- `attribution_dispute`: assertions, evidence, decision authority and state.
- `contractor_performance_period`: organization, scope, period, exposure denominators, status and source-manifest hash.
- `contractor_performance_measure`: metric definition/version, numerator, denominator, result, coverage and provenance.

## 5. Required constraints

1. Every work package belongs to exactly one engagement and target mine context.
2. Package validity cannot extend beyond engagement validity without a separately approved engagement amendment.
3. A subcontract relationship must form an acyclic disclosed chain and cannot broaden its parent scope.
4. An assignment's direct employer must have a current approved path to the package.
5. Requirement policy versions are immutable after publication and cannot overlap ambiguously for the same precedence key.
6. Requirement review author cannot be the submitting contractor actor for the same instance.
7. `VALID` requires an accepted evidence/review or trusted external status under policy; document presence alone is insufficient.
8. Eligibility decisions are append-only and `valid_until` is no later than the earliest blocking input expiry or cache ceiling.
9. A controlled exception cannot outlive its requirement, package, approver authority or compensating control.
10. Hard-stop requirements reject exception creation at the database/service invariant boundary.
11. Source-domain attribution references are immutable; disputes append decisions rather than rewrite the source.
12. Performance measures require metric version, source manifest, coverage and denominator semantics.
13. Organization suspension/revocation emits recomputation work for every affected active decision.
14. Historical engagement, affiliation and requirement records remain addressable after access ends.
15. Sensitive worker evidence is referenced through purpose-limited projections, not copied into performance records.

## 6. Key state transitions

```text
engagement: DRAFT → UNDER_REVIEW → APPROVED → ACTIVE
                                  ↘ REJECTED
ACTIVE → SUSPENDED → ACTIVE | TERMINATED
ACTIVE → EXPIRED → CLOSED

requirement: MISSING → SUBMITTED → UNDER_REVIEW → VALID → EXPIRING → EXPIRED
                                      ↘ REJECTED
VALID → SUSPENDED | SUPERSEDED

exception: REQUESTED → APPROVED → EXPIRED
                      ↘ REJECTED
APPROVED → REVOKED
```

State changes write audit and outbox events in the same transaction. Eligibility and performance projections are rebuildable from canonical records.

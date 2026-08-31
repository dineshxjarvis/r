# Wave 9 — Applications, Clearances and Regulatory Cases Whole-System Gap Audit

## A. Outcome and boundary

Outcome: let proponents discover, prepare and track approvals through one portal while preserving which authority/system legally owns every stage and decision. Case domain owns orchestration/record; authorities own federated decisions; reporting/integration own package/transport.

## B. Real-world actor/accountability map

Applicant organization/authorized representative and subject owners prepare; nodal officer coordinates; receiving/scrutiny/technical/site/hearing officers process; committee members record conflict/quorum/recommendation; competent authority decides; registry issues; integration operator reconciles. Applicant and authority workspaces remain distinct.

## C. Authoritative records and ownership

Service/version, assessment, application/content/requirements, submission link, authority case/assignment/milestones, queries/responses, events/minutes, recommendation, decision, instrument, related case and external snapshot/reconciliation are distinct. External case/decision is a mirror in federated mode.

## D. Lifecycle and handoff trace

```text
discovery → application/requirements → review/sign/package → submit/receipt
→ case correlation/admission → scrutiny ↔ query response → visit/hearing/consultation
→ recommendation → competent decision/instrument → conditions/obligations
→ renewal/amendment/transfer/surrender/suspension/appeal
```

## E. Physical/device/offline model

Applicants may prepare offline but signing/submission authority and version revalidation happen online. Site events use inspection/evidence contracts. Manual/hybrid authority processes require receipt/correlation proof. Portal outage shows unknown/stale state and never invents progress.

## F. Authority and separation-of-duties matrix

Applicant cannot act as authority. Coordinator cannot grant another authority's clearance. Scrutiny/recommendation/decision/registry are separate capabilities. Committee conflict/quorum is explicit. Adapter cannot issue/approve. Authority participant is case/mandate/jurisdiction constrained.

## G. Failure, abuse and recovery scenarios

Tested: changed/abolished service, wrong native/federated mode, incomplete discovery, expired representative, stale reused document, timeout/duplicate submission, external ID collision, officer transfer/vacancy, partial query response, missing quorum/recusal, portal/document conflict, revocation after approval, appeal without stay and private-draft leak.

## H. Upstream/downstream dependency impacts

Upstream: identity, mine/project, documents, GIS, reporting, workflow and integrations. Downstream: obligations, inspections, environment, production/access, dashboards/search, analytics and audit. Wave 12 implements adapters; Wave 15 hardens history/security.

## I. Gap register

### GAP-09-001

- **Gap:** unified portal intent did not distinguish native, API-federated, redirect, manual and information-only services.
- **Impact:** Strata could falsely claim another authority's workflow/decision.
- **Resolution:** effective execution mode and authoritative-system catalogue.
- **Status:** `RESOLVED`.

### GAP-09-002

- **Gap:** approval checklist/service applicability was static and unexplained.
- **Impact:** changed/abolished/new services create missing or fake applications.
- **Resolution:** versioned rules, explained assessment and unresolved review/impact.
- **Status:** `RESOLVED`.

### GAP-09-003

- **Gap:** application, submission receipt, authority case admission and approval were conflated.
- **Impact:** uploaded proposal could appear approved/in process without authority proof.
- **Resolution:** separated applicant/case/decision lifecycles and correlation evidence.
- **Status:** `RESOLVED`.

### GAP-09-004

- **Gap:** case participants, assignment acceptance, committee quorum/conflict and competent decision authority were missing.
- **Impact:** unavailable/conflicted/unauthorized actors can stall or decide cases.
- **Resolution:** time-bounded functions, assignments, recusal/quorum and capability gates.
- **Status:** `RESOLVED`.

### GAP-09-005

- **Gap:** query/deficiency rounds and partial response/extension semantics were absent.
- **Impact:** applicant responses disappear or falsely close all observations/deadlines.
- **Resolution:** immutable numbered rounds/items/responses/decisions and preserved clocks.
- **Status:** `RESOLVED`.

### GAP-09-006

- **Gap:** decision, instrument, conditions, renewal/amendment/transfer/revocation/appeal were status edits.
- **Impact:** legal lineage, scope and downstream obligations cannot be reconstructed.
- **Resolution:** immutable decision/instrument versions and related cases/stay/impact.
- **Status:** `RESOLVED`.

### GAP-09-007

- **Gap:** federated raw state, freshness, ID correlation and reconciliation were undefined.
- **Impact:** stale/incorrect portal mirrors can masquerade as authority state.
- **Resolution:** append-only external snapshots, versioned mapping, unique correlation and conflict cases.
- **Status:** `RESOLVED`.

### GAP-09-008

- **Gap:** exact national/state service catalogue, transitions, schemas, APIs, authority roles and migration authority require inter-agency agreements.
- **Impact:** design cannot declare every clearance discoverable/native/live.
- **Resolution:** catalogue/mode/adapter boundary fixed; Ministry/authority onboarding and Wave 12 supply approved contents/connectors.
- **Status:** `ACCEPTED_RISK`.

## J. Decisions requiring human approval

1. Ministry/authority legal owners approve service applicability, execution mode and transitions.
2. Each authority approves stage/action/role/quorum/clock/decision/instrument semantics.
3. Integration owners approve remote identifiers, APIs, mapping, reconciliation and credentials.
4. Privacy/records owners approve applicant/internal/public projections and retention.

## K. Canonical documents that must change

Feature, logical model, API/indexes, authorization, glossary, capability/inventory, decisions, unified-portal/integration boundaries and tracker.

## L. Exit verdict

**Pre-design verdict: FAIL.** Unified-portal strategy existed, but no canonical service, application, authority-case or remedy lifecycle did.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-09-001 through 007 are resolved. GAP-09-008 remains an explicit onboarding/Wave 12 dependency.

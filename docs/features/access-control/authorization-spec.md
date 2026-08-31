# Strata — Authorization Specification

## 1. Purpose

This specification translates the [canonical identity and authority model](../../architecture/identity-authority-model.md) into enforceable authorization decisions. Read it before adding an endpoint, OpenFGA relation, capability, appointment, regulator workflow, or cross-tenant query.

The invariant is:

```text
authenticated ≠ authorised
title ≠ capability
jurisdiction ≠ capability
workspace ≠ scope grant
visibility ≠ approval or closure authority
```

## 2. Decision model

Every decision evaluates:

```text
Check(principal, capability, resource, context) → ALLOW | DENY
```

| Input | Source |
|---|---|
| Principal and assurance | Valid server-side session or service credential |
| Acting person | Principal-to-person link |
| Resource and tenant | Server-side resource lookup |
| Affiliation/engagement | PostgreSQL canonical relationships |
| Appointment/post | PostgreSQL, projected to OpenFGA |
| Mandate/jurisdiction | PostgreSQL, projected or supplied as signed policy context |
| Business state | Domain database transaction |
| Purpose | Explicit caller input validated for regulated reads |
| Decision time | Server clock |
| Policy version | Deployed authorization bundle |

Missing or ambiguous inputs deny. Client-provided IDs select requested objects but never prove a relationship.

## 3. Capability catalogue

Capabilities are stable action identifiers. Position titles, authority names, and organisation kinds remain data.

### Identity and administration

| Capability | Target | Meaning |
|---|---|---|
| `identity.person.create` | platform or organisation | Create a human profile |
| `identity.person.read` | person | Read governed profile |
| `identity.affiliation.manage` | organisation/person | Create, revoke, or supersede affiliation |
| `identity.principal.manage` | principal | Provision, suspend, or disable login |
| `identity.session.revoke_any` | principal/session | Revoke another principal's session |
| `organization.create` | platform/tenant | Create legal organisation |
| `organization.read` | organisation | Read governed organisation/unit data |
| `organization.unit.configure` | organisation/unit | Maintain administrative hierarchy |
| `tenant.configure` | tenant | Maintain tenant-level configuration |
| `tenant.create`, `tenant.read` | platform/tenant | Create or view tenant boundary |
| `post.template.configure`, `post.read` | catalogue/post | Maintain templates or read posts |
| `post.configure` | organisation/unit/resource | Create or retire posts |
| `appointment.manage` | post | Appoint, revoke, or supersede holder |
| `appointment.read` | appointment/post | Read appointment and governed authority summary |
| `regulatory_authority.configure` | authority | Maintain authority catalogue |
| `regulatory_assignment.manage` | authority/unit | Grant mandates and jurisdictions |
| `workflow.route.configure`, `workflow.route.read`, `workflow.route.test` | route/scope | Maintain, read, or dry-run responsibility routing |

### Mine and compliance operations

| Capability | Target |
|---|---|
| `mine.create`, `mine.read_internal`, `mine.read_published`, `mine.configure` | mine/tenant |
| `inspection.request`, `inspection.plan` | inspection request/target |
| `inspection.create_internal`, `inspection.create_regulatory`, `inspection.create_third_party`, `inspection.register_received_notice` | inspection target |
| `inspection.confirm_regulatory_notice`, `inspection.assign_team` | inspection/authority |
| `inspection.conduct`, `inspection.record_access_event`, `inspection.record_observation` | inspection/visit |
| `inspection.read_internal`, `inspection.read_published` | inspection |
| `inspection.prepare_report`, `inspection.review_report`, `inspection.issue_internal`, `inspection.issue_regulatory` | inspection report |
| `inspection.cancel`, `inspection.close` | inspection |
| `document.upload`, `document.read_internal`, `document.read_published`, `document.review`, `document.publish`, `document.sign`, `document.supersede`, `document.withdraw` | document or filing |
| `obligation.read`, `obligation.configure`, `obligation.submit_evidence`, `obligation.verify` | obligation/instance |
| `evidence.capture`, `evidence.read_internal`, `evidence.read_published`, `evidence.verify`, `evidence.override_verdict` | evidence/target |
| `observation.raise`, `observation.match` | mine/observation |
| `defect.read`, `defect.merge_split` | defect |
| `finding.raise_internal`, `finding.raise_regulatory`, `finding.read`, `finding.close_internal`, `finding.close_regulatory` | finding |
| `capa.assign`, `capa.update`, `capa.verify`, `capa.extend_deadline` | CAPA/finding |
| `contractor.engagement.manage`, `contractor.engagement.read` | engagement/target |
| `contractor.package.create`, `contractor.package.approve`, `contractor.package.suspend` | package/engagement |
| `contractor.subcontract.propose`, `contractor.subcontract.approve` | subcontract relationship/package |
| `contractor.roster.submit`, `contractor.roster.review` | package/roster |
| `contractor.requirement.configure`, `contractor.requirement.submit`, `contractor.requirement.verify` | policy/requirement instance |
| `contractor.eligibility.evaluate`, `contractor.eligibility.read` | subject/package |
| `contractor.exception.request`, `contractor.exception.approve`, `contractor.exception.revoke` | contractor exception |
| `contractor.attribution.dispute`, `contractor.attribution.decide` | attribution/dispute |
| `contractor.performance.read` | contractor organization/authorized portfolio |
| `portfolio.read`, `audit.read`, `access_log.read` | authorised resource set |
| `attendance.roster.submit`, `attendance.roster.validate` | shift/mine |
| `attendance.credential.bind`, `attendance.credential.return` | credential assignment |
| `attendance.event.ingest_device` | checkpoint device |
| `attendance.record_manual`, `attendance.monitor`, `attendance.read` | shift/person/mine/portfolio |
| `attendance.exception.disposition` | attendance exception |
| `attendance.correction.propose`, `attendance.correction.approve` | correction/presence event |
| `attendance.register.generate`, `attendance.register.attest` | mine/shift/register |
| `attendance.device.configure`, `attendance.device.health_read` | checkpoint device |
| `muster.open`, `muster.operate`, `muster.read`, `muster.close` | incident/mine/muster |
| `spatial.source.configure`, `spatial.source.read` | spatial source/policy |
| `spatial.import.create`, `spatial.import.review` | spatial import/assertion set |
| `spatial.geometry.publish`, `spatial.geometry.withdraw` | governed geometry/version |
| `spatial.layer.configure`, `spatial.layer.read`, `spatial.layer.read_restricted` | spatial layer/scope |
| `spatial.topology.manage`, `spatial.topology.read` | topology/mine |
| `spatial.evaluate`, `spatial.evaluation.read`, `spatial.evaluation.override` | evaluation/subject/target |
| `spatial.map.compose`, `spatial.export` | map composition/layer set |
| `report.definition.configure`, `report.definition.publish`, `report.definition.read` | report definition/version |
| `report.obligation.materialize`, `report.prepare`, `report.read` | filing obligation/report |
| `report.source_map.resolve`, `report.review`, `report.validation.override` | compilation/validation/review |
| `report.attest` | report instance/filing subject |
| `filing.submit`, `filing.record_manual`, `filing.reconcile` | filing package/submission |
| `filing.correct`, `filing.withdraw` | filing submission |
| `regulatory.service.configure`, `regulatory.service.publish`, `regulatory.service.read` | regulatory service/version |
| `regulatory.assessment.run`, `regulatory.assessment.review` | project/approval assessment |
| `application.create`, `application.prepare`, `application.review`, `application.submit`, `application.withdraw` | application |
| `application.requirement.submit`, `application.requirement.review` | application requirement |
| `regulatory.case.create_native`, `regulatory.case.register_external`, `regulatory.case.read` | regulatory case |
| `regulatory.case.assign`, `regulatory.case.admit`, `regulatory.case.transition` | regulatory case/stage |
| `regulatory.query.issue`, `regulatory.query.respond`, `regulatory.query.decide` | query/round |
| `regulatory.event.manage`, `regulatory.recommendation.record` | case event/recommendation |
| `regulatory.decision.record_native`, `regulatory.decision.mirror`, `regulatory.instrument.issue` | case/decision/instrument |
| `regulatory.case.reconcile`, `regulatory.case.correct_external` | federated case/mirror |
| `search.query`, `search.query_sensitive`, `search.semantic` | authorized resource set/domain/corpus |
| `search.document_within` | document/version |
| `search.saved.manage`, `search.saved.share`, `search.alert.manage` | saved search/subscription/scope |
| `search.export` | query/scope/classification |
| `search.index.configure`, `search.index.operate`, `search.index.audit` | search projection/index |
| `grievance.intake.submit`, `grievance.intake.assist`, `grievance.intake.protected` | grievance intake/channel/scope |
| `grievance.triage`, `grievance.route`, `grievance.transfer.accept` | intake/case/transfer |
| `grievance.read_operational`, `grievance.read_sensitive`, `grievance.read_reporter_identity` | grievance case/projection/reporter vault reference |
| `grievance.case.assign`, `grievance.case.examine` | grievance case |
| `grievance.action.assign`, `grievance.action.update`, `grievance.action.verify` | grievance redress action |
| `grievance.response.prepare`, `grievance.response.review`, `grievance.dispose` | grievance response/case |
| `grievance.feedback.submit`, `grievance.appeal.submit`, `grievance.appeal.decide` | disposition/appeal |
| `grievance.retaliation.report`, `grievance.safeguard.manage` | protected safeguarding concern |
| `grievance.external.reconcile` | external grievance case/mirror |
| `grievance.policy.configure`, `grievance.policy.publish`, `grievance.audit` | grievance policy/authorized scope |
| `integration.system.configure`, `integration.connector.configure`, `integration.connector.approve` | external system/connector version |
| `integration.deployment.configure`, `integration.deployment.activate`, `integration.deployment.suspend` | connector deployment |
| `integration.credential.bind`, `integration.credential.rotate` | deployment/credential reference |
| `integration.exchange.request`, `integration.exchange.read`, `integration.ingress.receive` | operation/business target/exchange/deployment |
| `integration.reconcile`, `integration.mapping.resolve` | exchange/external identity mapping |
| `integration.retry`, `integration.replay`, `integration.dead_letter.resolve` | attempt/event/dead letter |
| `integration.payload.read_sensitive`, `integration.audit`, `integration.health.read` | integration payload/authorized scope |
| `analytics.metric.configure`, `analytics.metric.publish` | metric/version |
| `ai.use_case.propose`, `ai.use_case.approve`, `ai.use_case.retire` | AI use case/version |
| `ai.dataset.register`, `ai.feature.configure`, `ai.label.manage` | dataset/feature/label policy |
| `ai.model.register`, `ai.model.evaluate`, `ai.model.approve`, `ai.model.deploy` | model/version/deployment |
| `ai.signal.configure`, `ai.signal.run`, `ai.signal.read` | signal definition/run/scope |
| `ai.signal.review`, `ai.signal.contest` | signal/affected subject |
| `ai.monitor.read`, `ai.deployment.suspend`, `ai.incident.manage` | AI deployment/incident |
| `ai.prompt.configure`, `ai.provider.configure`, `ai.audit` | prompt/provider/authorized scope |
| `experience.locale.configure`, `experience.terminology.configure`, `experience.terminology.publish` | locale/term/version |
| `experience.content.translate`, `experience.translation.review`, `experience.translation.publish` | content/translation |
| `experience.assistance.start`, `experience.assistance.act`, `experience.interpreter.assign` | assisted session/target |
| `experience.accessibility.test`, `experience.accessibility.exception.approve` | release/journey/defect |
| `experience.locale_pack.publish`, `experience.audit` | locale pack/authorized scope |
| `platform.release.prepare`, `platform.release.approve`, `platform.release.deploy`, `platform.release.rollback` | release/environment |
| `platform.schema.publish`, `platform.policy.publish`, `platform.configuration.manage` | schema/policy/configuration version |
| `platform.audit.read`, `platform.audit.verify`, `platform.audit.checkpoint` | audit scope/checkpoint |
| `platform.security.assess`, `platform.security.exception.approve`, `platform.incident.manage` | release/finding/incident |
| `platform.slo.configure`, `platform.capacity.test`, `platform.health.read` | service/environment |
| `platform.backup.operate`, `platform.restore.execute`, `platform.dr.exercise` | data set/environment/exercise |
| `platform.migration.configure`, `platform.migration.execute`, `platform.migration.reconcile`, `platform.cutover.approve` | source/run/cutover |
| `incident.report`, `incident.report_protected`, `incident.triage`, `incident.classify` | mine/report/incident |
| `incident.read_operational`, `incident.read_sensitive`, `incident.read_published` | incident/projection |
| `emergency.activate`, `emergency.command`, `emergency.handover`, `emergency.demobilize` | incident/emergency activation |
| `incident.containment.assign`, `incident.containment.update` | containment action |
| `incident.casualty.record`, `incident.casualty.verify` | incident person/casualty update/family-contact task |
| `incident.notification.prepare`, `incident.notification.sign`, `incident.notification.send`, `incident.notification.reconcile` | notification obligation |
| `incident.notification.override_classification` | incident/classification decision |
| `incident.investigation.commission`, `incident.investigation.conduct`, `incident.investigation.issue` | investigation |
| `incident.scene.control`, `incident.scene.release`, `incident.complete` | scene/incident |
| `production.event.record`, `production.event.ingest_device`, `production.event.review`, `production.event.void_classify` | mine/device/material event |
| `production.lot.manage`, `production.transfer.record`, `production.processing.record` | lot/location/process |
| `dispatch.authorize`, `dispatch.weigh`, `dispatch.release`, `dispatch.read` | consignment/weighment |
| `stock.read`, `stock.survey.record`, `stock.adjust.propose`, `stock.adjust.approve` | stock location/snapshot/adjustment |
| `production.reconcile`, `production.discrepancy.resolve` | period/discrepancy |
| `production.period.approve`, `production.period.publish`, `production.period.reopen` | production period |
| `production.source_policy.configure`, `production.device_health.manage` | source policy/device |
| `production.read_operational`, `production.read_published`, `production.read_portfolio` | mine/period/portfolio |
| `environment.program.configure`, `environment.program.approve`, `environment.point.configure` | programme/mine/point |
| `environment.sample.collect`, `environment.sample.transfer`, `environment.sample.receive` | sample/custody |
| `environment.lab_result.record`, `environment.lab_result.issue`, `environment.lab_result.correct` | analysis/result |
| `environment.observation.ingest_device`, `environment.observation.validate` | instrument/observation/result |
| `environment.device.manage`, `environment.calibration.record` | instrument/calibration |
| `environment.limit.propose`, `environment.limit.publish` | limit binding/source obligation |
| `environment.evaluate`, `environment.exceedance.review` | result/binding/case |
| `environment.case.assign`, `environment.case.update`, `environment.case.complete` | exceedance case |
| `environment.period.review`, `environment.period.approve`, `environment.period.reopen` | monitoring period |
| `environment.read_operational`, `environment.read_published`, `environment.read_portfolio` | mine/result/portfolio |
| `approval.request`, `approval.read`, `approval.decide` | approval/subject |
| `notification.read`, `notification.acknowledge`, `notification.mark_actioned`, `notification.delegate.manage` | notification/post |
| `obligation.mark_not_applicable`, `obligation.waive`, `obligation.submit_nil_return` | obligation instance |
| `metric_manifest.read_self` | metric manifest |

New capabilities require a named target and policy tests. Do not create synonyms for existing actions.

## 4. Relationship model

OpenFGA is a derived relationship index, not the system of record. The minimum conceptual types are:

```text
principal
tenant
organization
organization_unit
mine
asset
post
appointment
regulatory_authority
authority_unit
mandate_assignment
jurisdiction_assignment
contractor_engagement
document
obligation_instance
finding
capa
evidence
inspection
inspection_visit
inspection_report
grievance_intake
grievance_case
grievance_reporter_ref
grievance_appeal
external_system_profile
connector_deployment
integration_exchange
ai_use_case
ai_deployment
signal_instance
assisted_session
```

Representative relations:

```text
principal acts_as person
person affiliated_with organization
person holds appointment
appointment fills post
post belongs_to organization_unit
post scoped_to mine|organization_unit|tenant|platform

appointment has_mandate mandate_assignment
mandate_assignment grants capability
mandate_assignment limited_by jurisdiction_assignment
jurisdiction_assignment covers mine|tenant|organization_unit|geography

organization engaged_at mine
person affiliated_with contractor organization

document filed_at mine|tenant|organization_unit
inspection targets mine
inspection assigned_member principal
inspection issued_by regulatory_authority
inspection_report for_inspection inspection
finding at_mine mine
finding issued_by regulatory_authority
capa for_finding finding
evidence for_target obligation_instance|capa|defect
grievance_case affects mine|tenant|organization_unit|community_scope
grievance_case assigned_to post
grievance_case linked_to incident|inspection|defect|capa
grievance_reporter_ref for_case grievance_case
grievance_appeal reviews grievance_case
connector_deployment connects external_system_profile
integration_exchange targets mine|tenant|organization_unit|document|filing_package|regulatory_case|grievance_case
ai_deployment serves ai_use_case
signal_instance concerns mine|tenant|organization_unit|contractor_engagement|incident|defect|capa|grievance_case
assisted_session assists principal|person|grievance_reporter_ref
```

The production OpenFGA DSL may normalize intermediate objects for tuple-to-userset traversal. It must preserve these semantics and pass the tests in §12. Do not encode authority as a single `inspector` relation on a string-named region.

## 5. Policy evaluation

### 5.1 Organisational positions

An organisational position policy maps a position template to capabilities and a resource relation. A current appointment grants the mapped capability only over the post's scope or an explicitly modelled descendant relationship.

Example:

```text
Safety Officer post at Mine A
  → evidence.capture at Mine A
  → finding.raise_internal at Mine A
  → not finding.close_regulatory anywhere
```

Hierarchy inheritance is explicit policy data. A title alone never grants platform-wide access.

### 5.2 Regulators

A regulator action requires all of:

1. current affiliation with the authority where policy requires it;
2. current appointment to an authority post;
3. current mandate granting the requested capability;
4. current jurisdiction covering the target resource;
5. resource state allowing that authority to act;
6. required purpose and assurance; and
7. separation-of-duty rules.

DGMS coverage does not imply MoEFCC capability. Sharing a geographic region does not merge authorities.

### 5.3 Contractors

Current contractor access requires a current worker affiliation and current contractor engagement at the target. Target-specific responsibility may further restrict evidence/CAPA actions.

Historical access requires a recorded party relationship and affiliation during the relevant period. No unconditional current membership or permanent mine-wide historic tuple is permitted.

### 5.4 Ministry portfolios

`portfolio.read` requires a current portfolio assignment or position policy. The query calculates the effective tenant/mine set, clips results to it, and records requested and effective scope in the manifest/access record.

No role receives an unrestricted cross-tenant bypass merely because its title contains Ministry, regulator, inspector, or administrator.

## 6. Closure and verification

Authorization and evidence fitness are separate gates:

```text
authority gate:
  may this principal perform this decision on this target?

business gate:
  does the evidence and target state satisfy closure rules?
```

Internal closure policies may vary by severity and category. Regulator-issued findings store issuing authority provenance and use a closure policy requiring `finding.close_regulatory` under the correct authority, mandate, and jurisdiction.

Minimum separation checks include verifier not being submitter or assignee. Higher-risk policies may require a different post, reporting chain, organisation, or issuing authority. The decision persists supporting appointment, mandate assignment, policy version, assurance, and evidence-attempt IDs.

Break-glass grants read capability only. It never grants signing, verification, approval, configuration, or closure.

## 7. Time and revocation

All authority-bearing intervals are half-open `[valid_from, valid_until)`. Every decision uses server `decision_time` and checks revocation/supersession.

OpenFGA conditional tuples may accelerate expiry, but PostgreSQL remains canonical. If conditional tuples are unavailable, use synchronous outbox-driven activation/revocation plus a policy-layer temporal check—not a nightly job with a permission lag.

Permission caches must be shorter than relationship invalidation guarantees and keyed by principal, capability, resource, policy version, and relevant relationship version. High-risk writes should avoid decision caching.

## 8. Tenant and list enforcement

Single-object flow:

1. Resolve the resource without exposing its existence.
2. Authorize capability on that resource.
3. Set validated `app.tenant_id` for ordinary tenant transactions.
4. Return `404` for concealed out-of-scope objects; use `403` when the object is visible but the action is forbidden.

List flow:

1. Calculate authorised resource IDs with `ListObjects`, policy projection, or portfolio assignment.
2. Intersect with request filters.
3. Apply tenant/resource constraints in SQL.
4. Use stable ordering and cursor/page rules from the API contract.

Cross-tenant reads use a controlled authorised-resource set and never disable RLS for a named role.

## 9. Administrative bootstrap

Initial platform and regulatory authority administrators are created by an audited bootstrap ceremony with short-lived deployment credentials and mandatory rotation. Subsequent administrators are appointed through governed posts and `appointment.manage`/`regulatory_assignment.manage` capabilities.

Bootstrap is not an undocumented seed script and creates no permanent superuser relation.

## 10. Audit requirements

Persist authorization evidence for legal/high-risk writes:

```json
{
  "principal_id": "...",
  "acting_person_id": "...",
  "capability": "finding.close_regulatory",
  "resource": "finding:...",
  "decision": "ALLOW",
  "supporting_appointment_id": "...",
  "supporting_mandate_assignment_id": "...",
  "effective_jurisdiction_id": "...",
  "policy_version": "2026-08-30.1",
  "assurance": "OIDC_MFA",
  "decision_time": "..."
}
```

Regulator reads log purpose, result including denials, target, effective jurisdiction, and policy version. Authentication activity belongs to `security_event`; business changes belong to domain audit.

## 11. Endpoint authoring rule

Every endpoint contract must state:

- capability;
- target resource used for the check;
- how target tenant/scope is resolved;
- additional mandate/jurisdiction rules;
- separation/business-state gates;
- authority evidence persisted; and
- list clipping behaviour where applicable.

“Internal viewer,” “manager,” “inspector,” or “platform admin” alone is not an acceptable canonical `Auth` specification.

## 12. Required tests

1. Workspace points at Mine A, request targets unauthorized Mine B: deny.
2. Appointment expires mid-session: next request denies.
3. Single-holder overlap fails; multi-holder inspectors coexist.
4. DGMS safety mandate cannot monitor an EC condition.
5. Same authority, wrong jurisdiction: deny.
6. Jurisdiction supersession changes access at its effective time.
7. Operator user cannot close regulator-issued finding.
8. Correct issuing authority but missing closure mandate: deny.
9. Contractor affiliation expires while engagement remains: deny current access.
10. Historical contractor reads only records naming the organisation as a historical party.
11. Ministry portfolio result excludes an unassigned tenant.
12. Suspended principal and version-bumped sessions deny immediately.
13. Break-glass read succeeds with purpose; closure remains denied.
14. Self-verification and same-chain verification deny under configured policy.
15. Direct database query without validated tenant context fails closed.
16. OpenFGA outage follows endpoint fail-closed policy; no handler falls back to role strings.

## 13. Prototype boundary

The prototype may seed a compact capability catalogue and a few position policies, mandates, and jurisdictions. It uses the same decision path as production. Hard-coded `if role == ...` branches, authority string comparisons, and cookie-carried scope are not acceptable prototype shortcuts because they prove the wrong architecture.

# Analytics and AI Governance Logical Data Model

This model implements the [analytics and AI governance specification](../features/analytics/analytics-and-ai-governance-spec.md). It governs rules, classical ML and generative/third-party models without making their stores authoritative.

## 1. Use cases and governance

- `ai_use_case` / `ai_use_case_version` — purpose, decision influence, affected actors, risk tier, intended/excluded use, human workflow, fallback and lifecycle.
- `ai_risk_assessment` — harms, likelihood/impact, controls, residual risk and owner acceptance.
- `ai_use_case_approval` — domain/data/security/privacy/legal/safety/model-risk/operations verdict.
- `ai_use_case_review` — periodic/change/incident review and continuation/narrow/suspend/retire result.
- `ai_policy_exception` — bounded deviation, compensating controls, approval and expiry.

## 2. Data, labels and features

- `ai_dataset_version` — manifest/hash, source versions, population/time cut, purpose/classification, lawful basis, quality, retention and access policy.
- `ai_dataset_split` — train/validation/test/monitor cohort rules and leakage checks.
- `ai_label_definition` / `ai_label_assertion` — meaning, guideline/version, annotator/source, confidence/disagreement and adjudication.
- `ai_feature_definition` / `ai_feature_version` — semantic owner, type/unit, event/as-of semantics, transformation, missingness, proxies/classification and code hash.
- `ai_feature_snapshot` — subject/time, exact source references/versions, feature version/value or protected object reference and quality.
- `ai_data_quality_result` — completeness, validity, freshness, drift and release verdict.

## 3. Models, prompts and evaluation

- `ai_model` / `ai_model_version` — type, artifact/provider identifier, algorithm/config, training manifest, dependencies, license/provenance and immutable hash.
- `ai_prompt_template_version` — system/developer/user template, tools/retrieval policy, output schema and safety controls.
- `ai_provider_profile` — deployment, retention/training/residency/logging/security terms and approved classifications.
- `ai_evaluation_plan` / `ai_evaluation_run` — dataset/slices/baseline/metrics/thresholds, environment/version and result manifest.
- `ai_evaluation_metric` / `ai_slice_result` — value, interval, cohort size/suppression and pass/warn/fail.
- `ai_red_team_case` / `ai_red_team_result` — attack/harm scenario, expected control, evidence and remediation.
- `ai_model_approval` — approver function, authorized use/thresholds/expiry and evidence.

## 4. Deployment and run lineage

- `ai_deployment` / `ai_deployment_version` — approved model/prompt/provider, use case, environment, traffic mode, thresholds, fallback and lifecycle.
- `ai_rollout_event` — shadow/canary/expand/rollback/suspend with approval and population.
- `ai_run` — use case/deployment/model/rule/prompt/retrieval/tool/code versions, input/output manifests, times, status, warnings, cost and trace.
- `ai_run_input` — authorized source/feature snapshot references, freshness/coverage and redaction.
- `ai_run_output` — typed score/range/ranking/candidate/draft reference, uncertainty/calibration and expiry.
- `ai_explanation` — method/version, factors/anchors/comparator/expected range and limitations.

## 5. Signals and human response

- `signal_definition` / `signal_definition_version` — eligible population, trigger, model/rule, semantics, threshold/severity, recipients, suppression/dedup and response contract.
- `signal_instance` — immutable run/output/subject/window, score/category, expiry and lifecycle.
- `signal_delivery` — authorized recipient projection, delivery/acknowledgement and revocation state.
- `signal_review` — reviewer authority, disposition, reason/evidence, usefulness and domain link.
- `signal_contest` / `signal_contest_decision` — affected party grounds, source correction, review and outcome.
- `signal_impact_record` — later domain decision reference and declared influence, never inferred causality.

## 6. Monitoring and incidents

- `ai_monitor_definition` / `ai_monitor_observation` — input/output/performance/calibration/slice/drift/availability/cost measure and threshold.
- `ai_drift_signal` — metric/baseline/window, magnitude, affected scope and review disposition.
- `ai_incident` / `ai_incident_event` — harmful/unauthorized/wrong output, containment, affected-run manifest, notification/correction and closure.
- `ai_feedback` — user/reviewer report, context, classification and adjudication; not automatic ground truth.
- `ai_retirement_record` — stopped uses, retained lineage, artifact disposition and replacement/fallback.

## 7. Mandatory constraints

1. Every production run binds one approved, unexpired use-case and deployment version.
2. Risk tier and allowed decision influence cannot be lowered by model developer alone.
3. Model/prompt/provider/mapping substitutions create new versions and approval impact review.
4. Training/evaluation/serving inputs are manifest-bound and point-in-time correct.
5. Synthetic data is labelled and cannot alone pass real-world effectiveness/fairness gates.
6. Protected attributes/proxies require declared purpose and cannot leak into ordinary outputs.
7. Run output/signal is immutable and never overwrites source-domain fact.
8. Signal review/contest/supersession is additive; dismissed signals remain auditable.
9. A signal cannot execute a high-impact domain decision directly.
10. Human reviewer authority and business gates are evaluated independently of model score.
11. Explanation binds exact run/model/features/comparator; generic text is invalid.
12. Missing/stale/low-coverage input follows declared degrade/withhold policy.
13. Authorization occurs before feature/context retrieval and again before delivery/read.
14. Provider logs/traces may not contain unapproved sensitive prompts/outputs/secrets.
15. Monitor alerts do not silently change thresholds/model; rollback/suspension is governed.
16. Developer cannot solely approve their model; required independent functions are enforced.
17. Retired/suspended deployment cannot influence new decisions, but lineage remains readable under retention.
18. Every command uses idempotency/concurrency and every artifact carries integrity/provenance.

# Strata — Analytics, Risk Signals and AI Governance Specification

## 1. Purpose and boundary

This specification owns `CAP-12` and the analytics/AI portions of PS §4.10–§4.11. It governs deterministic metrics, rules, statistical/anomaly models, predictive/forecast models, ranking/recommendation, NLP/extraction, embeddings and generative assistance from proposal through retirement.

AI produces candidates, signals, forecasts or drafts. It does not create legal facts, findings, guilt, contractor debarment, employment sanctions, inspection conclusions, grievance credibility, attendance facts, clearance decisions or CAPA closure.

Governance inputs include [IndiaAI’s Responsible AI principles](https://indiaai.gov.in/responsible-ai/pdf/principles-point-of-focus.pdf), [NIST AI RMF](https://www.nist.gov/itl/ai-risk-management-framework) and its [Generative AI profile](https://nvlpubs.nist.gov/nistpubs/ai/NIST.AI.600-1.pdf). They inform lifecycle controls; approved Indian legal/Ministry policy remains authoritative.

## 2. Where each analytical component sits

| Component | Input/output | Permitted use | Forbidden interpretation |
|---|---|---|---|
| OCR/layout model | document version → text/anchors/confidence | reviewer candidate text | authoritative document text without review |
| Obligation/entity extraction | text/anchors → structured candidate | review queue/population aid | published obligation or legal interpretation |
| Entity resolution | records → possible duplicate/link | human match workflow | automatic merge/identity conclusion |
| Rule signal | approved facts + versioned rule → signal | transparent prioritization/escalation | hidden policy or finding |
| Anomaly detection | comparable series/cohort → deviation score | investigate data/process/event | fraud, violation or causation |
| Risk prioritization | governed features → ranked attention | schedule human review/inspection | safety certification or autonomous enforcement |
| Forecasting | historical eligible facts → range/scenarios | staffing/load/stock planning | guaranteed outcome or statutory return |
| Semantic retrieval | authorized content → candidates | discovery | legal equivalence, duplicate or scope grant |
| Clustering/pattern detection | authorized records → group hypothesis | recurring issue/root-cause review | automatic common cause or complainant profiling |
| Generative assistance | approved context → labelled draft | summarize/draft/translate for review | unsourced answer, signature, final decision |

Analytics is an L4 projection. Source domains publish governed facts and never read a signal back as truth. Workflow may route a signal, but only a domain command with current human/authority and business gates changes authoritative state.

## 3. Canonical concepts

- **Metric:** deterministic aggregation with definition, denominator, scope, time, source manifest and freshness.
- **Rule:** explicit versioned predicate/weights/thresholds producing a reproducible result.
- **Signal:** time-bounded analytical assertion that something merits attention.
- **Anomaly:** deviation from a declared comparator/baseline with coverage and uncertainty; not wrongdoing.
- **Prediction/forecast:** probabilistic estimate for a defined target/horizon and population.
- **Recommendation:** ranked/proposed action for authorized human consideration.
- **Model:** immutable algorithm/artifact/configuration version, including external model identifiers.
- **Use case:** approved purpose, users, decisions influenced, harms, inputs/outputs and controls.
- **Run:** one execution over an exact data/model/policy cut.
- **Feedback:** reviewer/user outcome about usefulness/correctness; not ground truth automatically.

## 4. Risk tier and prohibited uses

Every use case is classified:

- `T0_DETERMINISTIC_INFORMATION`: descriptive metric/check with no decision influence;
- `T1_ASSISTIVE_LOW`: search, extraction or drafting candidate with easy verification;
- `T2_OPERATIONAL_PRIORITY`: affects queue/order/resource attention but not rights/legal status;
- `T3_HIGH_IMPACT_ADVISORY`: may materially influence inspection, safety, employment, contract, benefit or enforcement review; or
- `PROHIBITED`.

Prohibited without a new competent policy/legal decision include autonomous legal/safety conclusions, worker surveillance scoring beyond necessary purpose, emotion/intent inference, complainant credibility ranking, protected-characteristic inference, individual worker blacklists, automatic punitive action, fabricated evidence/citations and covert model use.

T2/T3 require documented human authority, contestability, fallback, subgroup/coverage evaluation, monitoring and kill switch. T3 cannot be production-active until independent risk/impact approval.

## 5. Use-case proposal and approval

An `ai_use_case_version` states problem, benefit, affected actors, decision influenced, risk tier, owner, intended/excluded uses, source domains/population, labels/ground truth limits, lawful purpose, data classification, model type/provider, human workflow, explanation, contest/review, metrics/thresholds, fallback, monitoring, retention and retirement.

Approval requires domain, data, security/privacy, safety/legal/ethics (as applicable), model-risk and operations verdicts. Reviewers examine whether a deterministic rule or ordinary workflow solves the problem with less risk. Approval is version-specific and expires/reviews on schedule.

## 6. Data and feature governance

Every feature has semantic definition, owner, unit, event/as-of time, eligible lifecycle states, missingness, source versions, transformations, leakage analysis, known proxies, classification and retention. Training/evaluation/serving use point-in-time-correct joins; future facts and post-outcome corrections cannot leak into historical features.

Training, validation, test and production-monitoring cohorts are manifest-bound and separated appropriately. Real sensitive data requires approved purpose and environment; synthetic data is labelled and cannot establish real-world effectiveness or fairness. Manual labels record annotator guidance, disagreement and adjudication. A domain status is not automatically ground truth merely because staff previously entered it.

Protected attributes are excluded unless explicitly needed to measure/mitigate fairness under approved policy; they are never used casually as predictors. Proxy analysis covers mine geography, contractor, shift, language, device/channel and other contextual attributes.

## 7. Signal definition and execution

A signal definition binds use case/version, feature set, rule/model, eligible population, schedule/trigger, score semantics, calibration, thresholds, severity/priority mapping, explanation template, recipients, expiry/suppression/dedup and required response.

Each run freezes:

- model/rule/prompt/retrieval/tool versions;
- feature and source manifests with freshness/coverage;
- code/environment/configuration version;
- population/exclusions and authorization projection;
- output, uncertainty/calibration and explanation factors;
- warnings/degraded/fallback state; and
- trace/cost/latency without sensitive prompt leakage.

Signals are immutable and may be superseded, acknowledged, investigated, confirmed, dismissed, expired or linked to a domain case. Reviewer disposition does not rewrite the original score.

## 8. Why anomaly detection exists

Threshold rules catch known conditions (for example, a permit limit). Anomaly detection finds data that is unusual relative to the mine’s own seasonal/operational history or a genuinely comparable governed cohort: sudden production/dispatch mismatch, repeated sensor flatline, unusual attendance/production combinations, environmental reporting discontinuity or unexpected recurrence patterns.

It is useful for data-quality and investigation prioritization where no complete hard-coded rule exists. It is unsafe as proof because maintenance, shutdowns, weather, geology, reporting corrections, new equipment and missing feeds can all look anomalous. Every anomaly therefore shows comparator, expected range, observed value, coverage, missingness, model/version and top contributing factors, and offers `EXPECTED/EXPLAINED`, `DATA_ISSUE`, `INVESTIGATE`, `CONFIRMED_DOMAIN_ISSUE` or `NOT_USEFUL` reviewer disposition.

## 9. Evaluation and release gates

Evaluation is use-case-specific and includes:

- baseline comparison against no-model/simple rule/current process;
- precision/recall or ranking metrics at operational thresholds, not only global accuracy;
- calibration and uncertainty where probabilities are shown;
- false-positive/false-negative harm and workload/capacity;
- temporal, mine/operator, geography, language, contractor/channel and data-quality slices;
- robustness to missing/stale/outlier/adversarial inputs and distribution shift;
- explanation fidelity and user comprehension;
- privacy/security/red-team tests, including prompt injection/data exfiltration for LLMs;
- reproducibility, latency, availability and cost; and
- human workflow outcomes, override patterns and automation bias testing.

Release uses offline validation, shadow, limited canary and monitored expansion. Thresholds are approved business/risk decisions. A champion/challenger may compare models, but only one approved version drives each production use at a time. Rollback restores a known approved version or deterministic fallback.

## 10. Human review, explanation and contestability

The UI labels the output type and limitations, shows source/time/coverage, material factors/anchors, applicable threshold and next permitted action. “AI says high risk” without factors and scope is invalid.

Human review is meaningful only if the reviewer has authority, evidence access, time, training and the ability to disagree without penalty. The system records decision, reason, evidence and whether the signal influenced it, while preventing copy-paste of generated rationale as human reasoning.

Affected organizations/people receive an appropriate explanation and correction/contest route when a signal materially influences review. Contesting the data/model does not erase the original run; corrected source facts trigger a new run and impact review.

## 11. Generative AI controls

Generative features use an approved provider/deployment, classification policy and prompt/tool/retrieval version. Retrieval is authorization-aware before context construction. Instructions/content from retrieved documents are untrusted data; tools use allowlisted schemas and independent authorization. Output requires citations/anchors for factual claims and is labelled draft.

Never send raw protected grievance identity, medical/biometric data, secrets, broad tenant corpora or legally restricted material to an unapproved provider. Provider training/retention settings, residency, logging and incident terms are approved and verified. Rate/key rotation cannot evade provider limits. On provider failure, core workflows continue without fabricated output.

## 12. Monitoring, drift and incident response

Monitor input schema/quality, feature drift, prediction distribution, calibration/performance after labels mature, subgroup/coverage, feedback/override, workload, latency/cost/errors, provider/version changes and harmful output reports. Drift alerts are signals, not proof of degradation.

Triggers can warn, increase review, switch to shadow/fallback, suspend or retire. Material model incidents preserve inputs/outputs/log lineage, stop unsafe use, notify owners, assess affected decisions, correct/communicate where required and document reactivation approval. Silent provider/model substitution is prohibited.

## 13. Authorization and separation

| Capability | Target |
|---|---|
| `analytics.metric.configure`, `analytics.metric.publish` | metric/version |
| `ai.use_case.propose`, `ai.use_case.approve`, `ai.use_case.retire` | use case/version |
| `ai.dataset.register`, `ai.feature.configure`, `ai.label.manage` | dataset/feature/label policy |
| `ai.model.register`, `ai.model.evaluate`, `ai.model.approve`, `ai.model.deploy` | model/version/deployment |
| `ai.signal.configure`, `ai.signal.run`, `ai.signal.read` | signal definition/run/scope |
| `ai.signal.review`, `ai.signal.contest` | signal/affected subject |
| `ai.monitor.read`, `ai.deployment.suspend`, `ai.incident.manage` | deployment/incident |
| `ai.prompt.configure`, `ai.provider.configure`, `ai.audit` | prompt/provider/authorized scope |

Model developer cannot solely approve evaluation/deployment. Data labeler cannot declare their labels authoritative. Platform/model operator has no automatic source-data access. Signal read does not grant sensitive feature or source-record read.

## 14. Acceptance scenarios

The implementation must prove:

1. stale/missing source produces degraded/withheld signal, not a confident score;
2. future data cannot enter a historical training feature;
3. anomaly after planned shutdown is explainable/dismissible and does not create finding;
4. contractor/minority mine cohort performance gap blocks T3 release or narrows use;
5. model upgrade changes scores only after version approval/canary and preserves old runs;
6. revoked source access prevents new signal/context exposure and invalidates derived delivery;
7. prompt injection cannot invoke tools or retrieve unauthorized records;
8. uncited/hallucinated generated draft cannot be issued/signed automatically;
9. reviewer can disagree, record reason and trigger correction/new run;
10. external provider outage falls back without blocking inspection/reporting/grievance work;
11. drift/incident suspension stops influence while preserving audit; and
12. replay reproduces output or explicitly records non-determinism/provider limitation.

## 15. Non-goals and dependencies

This wave does not claim a trained accident predictor, universal compliance score, causal inference, autonomous inspection scheduling/enforcement or certified production models. Domain/Ministry owners must approve use cases, harm tolerance, labels and thresholds. Wave 14 validates Hindi/localized and accessible human-AI interaction; Wave 15 owns executable model registry/pipelines, security/load/DR, retention and production evaluation gates.

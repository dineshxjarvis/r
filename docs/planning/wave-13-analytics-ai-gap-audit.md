# Wave 13 — Analytics and AI Governance Gap Audit

## A. Outcome and boundary

Every metric, rule, anomaly, risk score, forecast, recommendation, NLP/embedding and generative feature has a named purpose, source lineage, risk tier, evaluation, human boundary, monitoring and retirement path. No signal becomes legal/domain truth.

## B. Actors and accountability

Domain owner, affected user/subject, data/feature/label owner, analyst/model developer, independent evaluator, privacy/security/legal/safety/model-risk approver, deployment operator, human reviewer, contest reviewer and auditor.

## C. Sources and outputs

Sources are approved versioned domain facts/features/datasets/labels and authorized retrieval context. Outputs are metrics, candidates, anomaly/risk signals, forecasts, recommendations or labelled drafts with manifests, explanations, uncertainty and expiry.

## D. Lifecycles and semantics

Use case, dataset/feature/label, model/prompt/provider, evaluation/approval, deployment/rollout, run/signal, review/contest, monitor/incident and retirement remain separate. “Anomaly” does not mean fraud, cause, violation or predicted accident.

## E. Authorization and separation

Developer != sole evaluator/approver; model operator != source reader; signal read != feature/source read; AI output != domain capability; reviewer != affected-party contest reviewer where policy requires. Retrieval authorizes before context and delivery reauthorizes.

## F. Cross-domain consistency

Source domains publish facts; analytics consumes point-in-time versions and returns advisory signals. Workflow routes attention. Only domain commands under human/current authority create inspection, finding, action, eligibility, sanction, grievance or clearance state.

## G. Failure and adversarial scenarios

Stale/missing data, temporal leakage, planned-shutdown anomaly, subgroup/coverage gap, model upgrade, authorization revocation, prompt injection, hallucination, reviewer disagreement, provider outage, drift, incident suspension and reproducibility were challenged.

## H. Evaluation and operability

Baseline, operational thresholds, calibration, workload/harms, slices, robustness, explanation comprehension, security/red-team, human factors, shadow/canary/rollback, drift and incident response are required. Cost/latency/availability never replace harm/quality evaluation.

## I. Gap dispositions

### GAP-13-001

- **Gap:** “AI” claims mixed extraction, anomalies, risk, forecasting, semantic search and generation without component boundaries.
- **Impact:** implementers/users could attribute authority or accuracy from one use to another.
- **Resolution:** explicit component/use/output/forbidden-decision map and per-use governance.
- **Status:** `RESOLVED`.

### GAP-13-002

- **Gap:** signal/model/data/prompt lineage and point-in-time correctness were not canonical.
- **Impact:** unreproducible scores, training leakage and inability to explain historical decisions.
- **Resolution:** manifest-bound datasets/features/models/prompts/providers/runs/explanations.
- **Status:** `RESOLVED`.

### GAP-13-003

- **Gap:** anomaly/risk score could be read as violation, fraud, causation or accident prediction.
- **Impact:** unsafe enforcement, reputational harm and automation bias.
- **Resolution:** advisory semantics, explicit comparator/coverage/uncertainty and governed human dispositions.
- **Status:** `RESOLVED`.

### GAP-13-004

- **Gap:** model evaluation lacked operational thresholds, subgroup/context slices and workload/harm tests.
- **Impact:** a globally accurate model may fail small mines, languages, contractors or overwhelm reviewers.
- **Resolution:** risk-tiered baseline/calibration/slice/robustness/human-workflow release gates.
- **Status:** `RESOLVED`.

### GAP-13-005

- **Gap:** reviewer authority, contestability and downstream influence were not recorded.
- **Impact:** rubber-stamped AI decisions and no correction route.
- **Resolution:** meaningful human review, immutable disposition/contest and decision-influence linkage.
- **Status:** `RESOLVED`.

### GAP-13-006

- **Gap:** generative provider/retrieval/tool/prompt risks lacked controls.
- **Impact:** data leakage, prompt injection, hallucinated evidence or unauthorized action.
- **Resolution:** approved classification/provider, authorization-aware retrieval, untrusted context, allowlisted tools, citations and draft-only output.
- **Status:** `RESOLVED`.

### GAP-13-007

- **Gap:** drift, silent model/provider changes, rollback, incidents and retirement were undefined.
- **Impact:** degraded/harmful behavior persists without traceable containment.
- **Resolution:** immutable versions, monitoring, shadow/canary, kill switch/fallback, incident impact review and retirement lineage.
- **Status:** `RESOLVED`.

### GAP-13-008

- **Gap:** representative labelled data, approved harm thresholds, subgroup policy and production model/provider choices do not yet exist.
- **Impact:** architecture cannot claim predictive accuracy, fairness or production fitness.
- **Resolution:** governance/evaluation contract fixed; Ministry/domain owners approve real use cases/data/thresholds; Waves 14/15 complete interaction and executable production validation.
- **Status:** `ACCEPTED_RISK`.

## J. Decisions requiring human approval

1. Ministry/domain owners approve each purpose, risk tier, influenced decision, fallback and prohibited use.
2. Data/privacy/legal/safety owners approve features, labels, protected-attribute evaluation and retention.
3. Independent evaluators/model-risk owners approve metrics, thresholds, slice/harm results and rollout.
4. Operations/security approve provider, deployment, monitoring, incident, rollback and retirement.

## K. Canonical documents that must change

Feature, logical model, API/indexes, authorization, glossary, capability/inventory, dashboard/PRD boundaries, decisions and tracker.

## L. Exit verdict

**Pre-design verdict: FAIL.** Strong “AI-enabled” intent existed, but component authority, evaluation, lineage, contestability and lifecycle controls were fragmented.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-13-001 through 007 are resolved. GAP-13-008 remains an explicit Ministry/data/Waves 14–15 dependency.

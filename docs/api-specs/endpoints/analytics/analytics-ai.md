# Analytics and AI — metric and use-case governance, data, models, signals, monitoring, and incidents

Domain rules: [`../../../features/analytics/analytics-and-ai-governance-spec.md`](../../../features/analytics/analytics-and-ai-governance-spec.md). Logical model: [`../../../architecture/analytics-ai-data-model.md`](../../../architecture/analytics-ai-data-model.md). Conventions: [`../../README.md`](../../README.md).

This domain governs rules, classical ML, and generative or third-party models **without making any of their stores authoritative**. Three lines it never crosses:

- **A run output or signal is immutable and never overwrites a source-domain fact.** A model that thinks a CAPA is overdue does not make it overdue.
- **A signal cannot execute a high-impact domain decision directly.** It informs a human whose authority and business gates are evaluated **independently of the model score**.
- **A developer can never solely approve their own model.** The required independent functions are enforced, not encouraged.

## Routes

| Route | Purpose |
|---|---|
| `GET /metric-versions` · `POST /metric-versions` · `POST /metric-versions/{id}/actions` | Metric semantics, versioned |
| `GET /ai-use-case-versions` · `POST /ai-use-case-versions` · `POST /ai-use-case-versions/{id}/actions` | Purpose, risk tier, decision influence, retirement |
| `GET /ai-dataset-versions` · `POST /ai-dataset-versions` · `GET /ai-feature-versions` · `POST /ai-feature-versions` · `POST /ai-dataset-versions/{id}/actions` with `ASSERT_LABEL` | Manifest-bound, point-in-time data |
| `GET /ai-model-versions` · `POST /ai-model-versions` · `POST /ai-model-versions/{id}/actions` | Artefact, evaluation, independent approval |
| `GET /ai-prompt-template-versions` · `POST /ai-prompt-template-versions` · `GET /ai-provider-profiles` · `POST /ai-provider-profiles` | Prompt and provider terms |
| `GET /ai-evaluation-runs` · `POST /ai-evaluation-runs` | Slices, baselines, thresholds |
| `GET /ai-deployments` · `POST /ai-deployments` · `POST /ai-deployments/{id}/actions` | Rollout, suspension, rollback |
| `GET /signal-definition-versions` · `POST /signal-definition-versions` · `POST /signal-definition-versions/{id}/actions` | Trigger, severity, response contract |
| `GET /signals` · `GET /signals/{id}` · `POST /signals/{id}/actions` | Review, contest, link to a domain record |
| `GET /ai-deployments?view=runs` · `GET /ai-deployments/runs/{id}` | Full lineage of one inference |
| `GET /ai-deployments?view=monitoring` · `GET /ai-drift-signals` · `POST /ai-drift-signals/{id}/actions` | Threshold-bound monitoring |
| `GET /ai-incidents` · `POST /ai-incidents` · `POST /ai-incidents/{id}/actions` | Harmful, unauthorised, or wrong output |

Label assertions are append-only child facts created by `ASSERT_LABEL` on their dataset version. This removes a write-only top-level route while preserving the assertion object, capability, audit name, and immutable response schema.

`GET /ai-deployments/{id}/monitoring` and the former monitor-observation collection are `GET /ai-deployments?view=monitoring&filter[id]=…`. Inference lineage uses `GET /ai-deployments?view=runs`; `GET /ai-audit/runs/{id}` is `GET /ai-deployments/runs/{id}?expand=inputs,outputs,explanation,versions`.

---

## POST /ai-use-case-versions

**Auth:** `ai.use_case.propose`; each approval discipline has its own capability.

**Risk tier and allowed decision influence cannot be lowered by the model developer alone.**

```json
{
  "ai_use_case_id": "aiuc_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "version_label": "Defect recurrence risk, v3",
  "purpose": "Rank open defects by the likelihood of recurrence within 90 days, to help the safety officer prioritise inspection effort.",
  "decision_influence": "ADVISORY_RANKING_ONLY",
  "affected_actors": ["MINE_SAFETY_OFFICER", "CONTRACTOR_SUPERVISOR", "WORKERS_INDIRECTLY"],
  "risk_tier": "MEDIUM",
  "intended_use": ["Ordering the daily inspection walk", "Flagging candidates for a supervisor's judgement"],
  "excluded_use": ["Closing a defect", "Any adverse decision about a contractor or a person", "Any input to eligibility, discipline, or payment"],
  "human_workflow": { "human_in_the_loop": true, "reviewer_capability": "defect.read", "review_required_before_action": true, "review_sla": "P2D" },
  "fallback": { "on_unavailable": "PRESENT_UNRANKED_LIST", "on_degraded_inputs": "WITHHOLD_AND_NOTIFY" },
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Use-case version proposed; 7 approvals required",
  "data": {
    "id": "aiuv_01HZY2B3C4D5E6F7G8H9J0K1T0",
    "object": "ai_use_case_version",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PROPOSED",
    "available_actions": ["ASSESS_RISK", "APPROVE", "WITHDRAW"],
    "ai_use_case": { "type": "ai_use_case", "id": "aiuc_01HZY1A2B3C4D5E6F7G8H9J0K0", "display": "Defect recurrence risk" },
    "version_label": "Defect recurrence risk, v3",
    "purpose": "Rank open defects by the likelihood of recurrence within 90 days, to help the safety officer prioritise inspection effort.",
    "decision_influence": "ADVISORY_RANKING_ONLY",
    "decision_influence_lowerable_by_developer": false,
    "risk_tier": "MEDIUM",
    "risk_tier_lowerable_by_developer": false,
    "affected_actors": ["MINE_SAFETY_OFFICER", "CONTRACTOR_SUPERVISOR", "WORKERS_INDIRECTLY"],
    "intended_use": ["Ordering the daily inspection walk", "Flagging candidates for a supervisor's judgement"],
    "excluded_use": ["Closing a defect", "Any adverse decision about a contractor or a person", "Any input to eligibility, discipline, or payment"],
    "human_workflow": { "human_in_the_loop": true, "reviewer_capability": "defect.read", "review_required_before_action": true, "review_sla": "P2D" },
    "fallback": { "on_unavailable": "PRESENT_UNRANKED_LIST", "on_degraded_inputs": "WITHHOLD_AND_NOTIFY" },
    "risk_assessment": null,
    "approvals": [
      { "discipline": "DOMAIN", "state": "PENDING" },
      { "discipline": "DATA", "state": "PENDING" },
      { "discipline": "SECURITY", "state": "PENDING" },
      { "discipline": "PRIVACY", "state": "PENDING" },
      { "discipline": "LEGAL", "state": "PENDING" },
      { "discipline": "SAFETY", "state": "PENDING" },
      { "discipline": "MODEL_RISK", "state": "PENDING" }
    ],
    "next_review_due_on": null,
    "created_at": "2027-02-01T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/ai-use-case-versions/aiuv_01HZY2B3C4D5E6F7G8H9J0K1T0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-02-01T10:00:00Z" }
}
```

`excluded_use` is a **contract, not documentation**. A signal from this use case linked to an eligibility decision returns `403 FORBIDDEN` naming the excluded-use clause.

---

## POST /ai-model-versions/{id}/actions — APPROVE

**Auth:** each discipline's own capability. **The developer cannot be an approver of their own model.**

```json
{
  "action": "APPROVE",
  "expected_version": 6,
  "reason": "Evaluation meets thresholds on all slices, including the two smallest contractor cohorts; red-team cases pass",
  "payload": {
    "discipline": "MODEL_RISK",
    "authorized_use": { "use_case_version_id": "aiuv_01HZY2B3C4D5E6F7G8H9J0K1T0", "environments": ["PRODUCTION"], "traffic_modes": ["CANARY", "FULL"] },
    "thresholds": { "min_auc": "0.72", "max_slice_disparity": "0.15", "min_calibration_ece": null, "max_calibration_ece": "0.08" },
    "approval_expires_on": "2027-08-01",
    "evidence_run_ids": ["aier_01HZY3C4D5E6F7G8H9J0K1T2M0"]
  },
  "supporting_authority": { "appointment_id": "app_01HZY4D5E6F7G8H9J0K1T2M3N0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Model-risk approval recorded; deployment permitted from 2027-02-10",
  "data": {
    "id": "aimv_01HZY5E6F7G8H9J0K1T2M3N400",
    "object": "ai_model_version",
    "version": 7,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "APPROVED",
    "available_actions": ["DEPLOY", "RETIRE"],
    "model": { "type": "ai_model", "id": "aimd_01HZY6F7G8H9J0K1T2M3N405P0", "display": "Defect recurrence ranker" },
    "model_type": "GRADIENT_BOOSTED_TREES",
    "artifact": { "storage_ref": "s3://strata-ai-models/…", "hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3", "immutable": true, "byte_size": 8412094 },
    "algorithm_config_hash": "sha256:7d1a9c4e…",
    "training_manifest": { "dataset_version_ids": ["aidv_01HZY7G8H9J0K1T2M3N405P6Q0"], "split_id": "aisp_01HZY8H9J0K1T2M3N405P6Q7R0", "feature_version_ids": ["aifv_01HZY9J0K1T2M3N405P6Q7R8S0", "aifv_01HZYA0B1C2D3E4F5G6H7J8K90"], "point_in_time_correct": true, "leakage_checks_passed": true, "synthetic_data_used": false },
    "dependencies": [{ "name": "xgboost", "version": "2.1.1" }, { "name": "numpy", "version": "2.1.0" }],
    "license_and_provenance": { "license": "PROPRIETARY_INTERNAL", "third_party_components": [], "provider_profile_id": null },
    "developed_by": { "type": "person", "id": "per_01HZYB1C2D3E4F5G6H7J8K9T00", "display": "A. Sengupta" },
    "approvals": [
      { "discipline": "DATA", "state": "APPROVED", "approver": { "type": "person", "id": "per_01HZYC2D3E4F5G6H7J8K9T0M10", "display": "S. Devi" }, "approved_at": "2027-02-05T10:00:00Z", "approver_is_developer": false },
      { "discipline": "MODEL_RISK", "state": "APPROVED", "approver": { "type": "person", "id": "per_01HZYD3E4F5G6H7J8K9T0M1N20", "display": "V. Rao" }, "approved_at": "2027-02-08T14:00:00Z", "approver_is_developer": false }
    ],
    "developer_self_approval_blocked": true,
    "authorized_use": { "use_case_version_id": "aiuv_01HZY2B3C4D5E6F7G8H9J0K1T0", "environments": ["PRODUCTION"], "traffic_modes": ["CANARY", "FULL"], "approval_expires_on": "2027-08-01" },
    "thresholds": { "min_auc": "0.72", "max_slice_disparity": "0.15", "max_calibration_ece": "0.08" },
    "created_at": "2027-01-20T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/ai-model-versions/aimv_01HZY5E6F7G8H9J0K1T2M3N400" }
  },
  "meta": { "action": "APPROVE", "transition": { "from": "UNDER_APPROVAL", "to": "APPROVED" }, "effects": [ { "object": "ai_model_approval", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-02-08T14:00:00Z" }
}
```

Every approval records `approver_is_developer`, always false. An approval expires, so an unreviewed model cannot serve forever.

---

## POST /ai-evaluation-runs

**Auth:** `ai.evaluate`.

```json
{
  "success": true,
  "data": {
    "id": "aier_01HZY3C4D5E6F7G8H9J0K1T2M0",
    "object": "ai_evaluation_run",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED",
    "available_actions": [],
    "model_version": { "type": "ai_model_version", "id": "aimv_01HZY5E6F7G8H9J0K1T2M3N400", "display": "Defect recurrence ranker v3" },
    "plan": { "id": "aiep_01HZYE4F5G6H7J8K9T0M1N2030", "dataset_version_id": "aidv_01HZY7G8H9J0K1T2M3N405P6Q0", "split": "TEST", "baseline": { "kind": "PREVIOUS_MODEL_VERSION", "id": "aimv_01HZYF5G6H7J8K9T0M1N203P40" } },
    "environment": { "runtime": "python-3.13", "seed": 20270120, "deterministic": true },
    "metrics": [
      { "name": "AUC", "value": "0.784", "confidence_interval": { "low": "0.761", "high": "0.807", "level": "0.95" }, "threshold": "0.72", "verdict": "PASS", "baseline_value": "0.741", "delta": "+0.043" },
      { "name": "CALIBRATION_ECE", "value": "0.061", "threshold": "0.08", "verdict": "PASS" }
    ],
    "slice_results": [
      { "slice": { "dimension": "mine_id", "value": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }, "cohort_size": 1184, "metric": "AUC", "value": "0.791", "verdict": "PASS", "suppressed": false },
      { "slice": { "dimension": "responsible_organization_kind", "value": "CONTRACTOR" }, "cohort_size": 412, "metric": "AUC", "value": "0.702", "verdict": "WARN", "disparity_vs_best_slice": "0.089", "max_allowed_disparity": "0.15", "suppressed": false },
      { "slice": { "dimension": "responsible_organization_kind", "value": "SUBCONTRACTOR" }, "cohort_size": 3, "metric": null, "value": null, "verdict": null, "suppressed": true, "suppression_reason": "COHORT_BELOW_THRESHOLD", "note": "Cohort of 3 is below the minimum of 20. Reporting a metric here would be noise presented as fairness evidence." }
    ],
    "red_team_results": [
      { "case_id": "airt_01HZYG6H7J8K9T0M1N203P4Q50", "scenario": "Adversarially worded defect description attempting to suppress the risk score", "expected_control": "Score should be driven by structured features, not free text", "outcome": "PASS", "evidence_ref": "s3://strata-ai-eval/…" }
    ],
    "synthetic_data_used": false,
    "synthetic_data_note": "No synthetic data in this run. Synthetic data is always labelled and can never alone satisfy a real-world effectiveness or fairness gate.",
    "result_manifest_hash": "sha256:9f2c8b1a…",
    "completed_at": "2027-02-04T18:00:00Z",
    "links": { "self": "/api/v1/ai-evaluation-runs/aier_01HZY3C4D5E6F7G8H9J0K1T2M0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-02-04T18:00:00Z" }
}
```

The suppressed subcontractor slice is **reported as suppressed**, not omitted. A fairness table that silently drops its smallest cohort is exactly the evidence that should not reassure anyone.

---

## GET /ai-deployments/runs/{id}

**Auth:** `ai.run.read` on the subject's scope; sensitive input references remain purpose-limited.

**Authorization happens before feature and context retrieval, and again before delivery and read.**

```json
{
  "success": true,
  "data": {
    "id": "airn_01HZYH7J8K9T0M1N203P4Q5R60",
    "object": "ai_run",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED",
    "available_actions": [],
    "use_case_version": { "type": "ai_use_case_version", "id": "aiuv_01HZY2B3C4D5E6F7G8H9J0K1T0", "display": "Defect recurrence risk, v3" },
    "use_case_approval_valid_at_run": true,
    "deployment_version": { "type": "ai_deployment_version", "id": "aidv2_01HZYJ8K9T0M1N203P4Q5R6S70", "display": "Defect recurrence ranker, production, canary 10%" },
    "versions": {
      "model_version_id": "aimv_01HZY5E6F7G8H9J0K1T2M3N400",
      "rule_version_id": null,
      "prompt_template_version_id": null,
      "retrieval_policy_version": null,
      "tool_versions": [],
      "code_version": "ranker-svc@2.4.1"
    },
    "subject": { "type": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "display": "Safety berm missing, east haul road" },
    "inputs": [
      { "id": "airi_01HZYK9T0M1N203P4Q5R6S7T80", "feature_version_id": "aifv_01HZY9J0K1T2M3N405P6Q7R8S0", "feature_name": "recurrence_count_180d", "value": "1", "source_references": [{ "type": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "version": 7 }], "as_of": "2027-02-14T00:00:00Z", "freshness": "PT9H", "coverage": "1.000", "authorized_before_retrieval": true, "redacted": false },
      { "id": "airi_01HZYT0M1N203P4Q5R6S7T8V90", "feature_version_id": "aifv_01HZYA0B1C2D3E4F5G6H7J8K90", "feature_name": "capa_extension_count", "value": "2", "source_references": [{ "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "version": 4 }], "as_of": "2027-02-14T00:00:00Z", "freshness": "PT9H", "coverage": "1.000", "authorized_before_retrieval": true, "redacted": false }
    ],
    "protected_attribute_use": { "used": false, "declared_proxies_checked": ["responsible_organization_kind"], "proxy_leak_check": "PASS" },
    "output": {
      "id": "airo_01HZYM1N203P4Q5R6S7T8V9V00",
      "output_kind": "SCORE",
      "value": "0.812",
      "category": "HIGH_RISK",
      "uncertainty": { "kind": "PREDICTION_INTERVAL", "low": "0.694", "high": "0.903", "level": "0.90" },
      "calibration": { "ece_at_deployment": "0.061", "reliability_bucket": "0.75–0.85" },
      "immutable": true,
      "overwrites_source_fact": false,
      "expires_at": "2027-02-21T00:00:00Z"
    },
    "explanation": {
      "id": "aiex_01HZYN203P4Q5R6S7T8V9V0W10",
      "method": "SHAP_TREE",
      "method_version": "0.46.0",
      "bound_to_run_id": "airn_01HZYH7J8K9T0M1N203P4Q5R60",
      "factors": [
        { "feature_name": "capa_extension_count", "value": "2", "contribution": "+0.183", "direction": "INCREASES_RISK" },
        { "feature_name": "recurrence_count_180d", "value": "1", "contribution": "+0.141", "direction": "INCREASES_RISK" },
        { "feature_name": "days_since_last_inspection", "value": "34", "contribution": "+0.062", "direction": "INCREASES_RISK" }
      ],
      "comparator": { "kind": "COHORT_MEDIAN", "cohort": "Open haul-road defects at this mine", "comparator_score": "0.418" },
      "expected_range": { "low": "0.180", "high": "0.640" },
      "limitations": ["The model has no visibility of weather, and monsoon-season berm failures are under-represented in the training window.", "The contractor slice performs 0.089 below the best slice; treat contractor-attributed rankings with more caution."],
      "generic_text_rejected": true
    },
    "input_degradation": null,
    "status": "COMPLETED",
    "warnings": [],
    "cost": { "compute_ms": 41, "provider_cost": null },
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "started_at": "2027-02-14T09:00:00.100Z",
    "ended_at": "2027-02-14T09:00:00.141Z",
    "links": { "self": "/api/v1/ai-deployments/runs/airn_01HZYH7J8K9T0M1N203P4Q5R60" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-02-14T10:00:00Z" }
}
```

The explanation **binds the exact run, model, features, and comparator**. Generic text is invalid and refused at write time — `generic_text_rejected: true` records that the check ran.

### Degraded inputs

```json
{
  "success": true,
  "data": {
    "id": "airn_01HZY03P4Q5R6S7T8V9V0W1X20",
    "object": "ai_run",
    "state": "WITHHELD",
    "status": "WITHHELD",
    "input_degradation": {
      "policy": "WITHHOLD_AND_NOTIFY",
      "failing_inputs": [
        { "feature_name": "days_since_last_inspection", "reason": "STALE", "freshness": "P41D", "max_freshness": "P7D" },
        { "feature_name": "attendance_exposure_hours", "reason": "LOW_COVERAGE", "coverage": "0.412", "min_coverage": "0.900" }
      ],
      "declared_in_use_case_version": "aiuv_01HZY2B3C4D5E6F7G8H9J0K1T0"
    },
    "output": null,
    "signal_emitted": false,
    "warnings": [{ "code": "OUTPUT_WITHHELD", "message": "Inputs did not meet the declared freshness and coverage policy. No score was produced." }]
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-02-14T09:05:00Z", "effects": [ { "object": "notification", "count": 1, "change": "CREATED" } ] }
}
```

Missing, stale, or low-coverage input follows the **declared** degrade-or-withhold policy from the approved use case. The model does not quietly score on whatever it happens to have.

---

## GET /signals/{id} · POST /signals/{id}/actions

**Auth:** `signal.read` on the subject; review needs the reviewer capability declared in the signal definition.

```json
{
  "success": true,
  "data": {
    "id": "sgnl_01HZYP4Q5R6S7T8V9V0W1X2Y30",
    "object": "signal_instance",
    "version": 2,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "UNDER_REVIEW",
    "available_actions": ["REVIEW", "CONTEST"],
    "signal_definition_version": { "type": "signal_definition_version", "id": "sdfv_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "display": "High recurrence risk, v2" },
    "run": { "type": "ai_run", "id": "airn_01HZYH7J8K9T0M1N203P4Q5R60" },
    "output_ref": "airo_01HZYM1N203P4Q5R6S7T8V9V00",
    "subject": { "type": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "display": "Safety berm missing, east haul road" },
    "window": { "from": "2027-02-14T00:00:00Z", "to": "2027-05-15T00:00:00Z" },
    "score": "0.812",
    "category": "HIGH_RISK",
    "severity": "ADVISORY",
    "immutable": true,
    "expires_at": "2027-02-21T00:00:00Z",
    "can_execute_domain_decision": false,
    "can_execute_domain_decision_note": "This signal cannot close, escalate, reassign, or otherwise act on the defect. It can only be reviewed by a human whose own authority is evaluated independently.",
    "response_contract": { "expected_response": "REVIEW_AND_DISPOSITION", "sla": "P2D", "reviewer_capability": "defect.read" },
    "deliveries": [
      { "id": "sgdl_01HZYR6S7T8V9V0W1X2Y3Z4A50", "recipient": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" }, "projection": "REVIEWER", "authorized_at_delivery": true, "delivered_at": "2027-02-14T09:01:00Z", "acknowledged_at": "2027-02-14T09:14:00Z", "revoked": false }
    ],
    "reviews": [],
    "contests": [],
    "impact_records": [],
    "created_at": "2027-02-14T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/signals/sgnl_01HZYP4Q5R6S7T8V9V0W1X2Y30", "run": "/api/v1/ai-deployments/runs/airn_01HZYH7J8K9T0M1N203P4Q5R60" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-02-14T10:00:00Z" }
}
```

### REVIEW

```json
{
  "action": "REVIEW",
  "expected_version": 2,
  "reason": "Agreed. The berm was rebuilt with the same material and no drainage change; a monsoon repeat is plausible. Scheduling a geotechnical check.",
  "payload": { "disposition": "USEFUL_ACTED_ON", "usefulness": "HIGH", "domain_link": { "type": "capa", "id": "capa_01HZYS7T8V9V0W1X2Y3Z4A5B60", "relationship": "RAISED_AFTER_REVIEWING_SIGNAL" }, "evidence_ids": [] },
  "supporting_authority": { "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Signal reviewed",
  "data": {
    "id": "sgnl_01HZYP4Q5R6S7T8V9V0W1X2Y30",
    "object": "signal_instance",
    "version": 3,
    "state": "REVIEWED",
    "reviews": [
      { "id": "sgrv_01HZYT8V9V0W1X2Y3Z4A5B6C70", "reviewer": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" }, "reviewer_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "reviewer_authority_evaluated_independently_of_score": true, "disposition": "USEFUL_ACTED_ON", "usefulness": "HIGH", "reason": "Agreed. The berm was rebuilt with the same material and no drainage change; a monsoon repeat is plausible. Scheduling a geotechnical check.", "domain_link": { "type": "capa", "id": "capa_01HZYS7T8V9V0W1X2Y3Z4A5B60", "relationship": "RAISED_AFTER_REVIEWING_SIGNAL" }, "reviewed_at": "2027-02-15T11:00:00Z" }
    ],
    "impact_records": [
      { "id": "sgim_01HZYV9V0W1X2Y3Z4A5B6C7D80", "domain_decision": { "type": "capa", "id": "capa_01HZYS7T8V9V0W1X2Y3Z4A5B60" }, "declared_influence": "REVIEWER_STATES_SIGNAL_PROMPTED_REVIEW", "causality_inferred": false, "note": "Influence is declared by the reviewer. The system never infers that a signal caused a decision." }
    ],
    "available_actions": ["CONTEST"]
  },
  "meta": { "action": "REVIEW", "transition": { "from": "UNDER_REVIEW", "to": "REVIEWED" }, "effects": [ { "object": "signal_review", "count": 1, "change": "CREATED" }, { "object": "signal_impact_record", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-02-15T11:00:00Z" }
}
```

`causality_inferred: false` on every impact record. The reviewer said the signal prompted the review; the system does not conclude that the signal caused the CAPA.

### CONTEST

```json
{
  "action": "CONTEST",
  "expected_version": 3,
  "reason": "The extension count of 2 is wrong. One extension was recorded against the wrong CAPA and has since been corrected.",
  "payload": { "grounds": "INCORRECT_SOURCE_DATA", "affected_party_organization_id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "source_correction_reference": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "corrected_at": "2027-02-16T00:00:00Z" } }
}
```

```json
{
  "success": true,
  "message": "Contest recorded; original signal retained",
  "data": {
    "id": "sgnl_01HZYP4Q5R6S7T8V9V0W1X2Y30",
    "object": "signal_instance",
    "version": 4,
    "state": "CONTESTED",
    "score": "0.812",
    "original_signal_mutated": false,
    "contests": [
      { "id": "sgct_01HZYV0W1X2Y3Z4A5B6C7D8E90", "grounds": "INCORRECT_SOURCE_DATA", "raised_by_organization": { "type": "organization", "id": "org_01HZX5E6F7G8H9J0K1T2M3N400", "display": "Acme Mining Services Pvt Ltd" }, "source_correction_reference": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90" }, "state": "UNDER_REVIEW", "raised_at": "2027-02-16T09:00:00Z", "decision": null }
    ],
    "available_actions": []
  },
  "meta": { "action": "CONTEST", "transition": { "from": "REVIEWED", "to": "CONTESTED" }, "effects": [ { "object": "signal_contest", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 2, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-02-16T09:00:00Z" }
}
```

Review, contest, and supersession are **additive**. A dismissed signal stays auditable, and the original score is never rewritten — a contest produces a decision beside it.

---

## POST /ai-incidents

**Auth:** `ai.incident.raise`.

```json
{
  "success": true,
  "data": {
    "id": "aiin_01HZYW1X2Y3Z4A5B6C7D8E9F00",
    "object": "ai_incident",
    "version": 2,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "CONTAINED",
    "available_actions": ["RECORD_EVENT", "CLOSE"],
    "incident_kind": "WRONG_OUTPUT_AT_SCALE",
    "summary": "A feature pipeline change on 18 February caused capa_extension_count to read as 0 for all contractor-attributed defects, systematically under-ranking them for six days.",
    "deployment_version": { "type": "ai_deployment_version", "id": "aidv2_01HZYJ8K9T0M1N203P4Q5R6S70", "display": "Defect recurrence ranker, production" },
    "affected_run_manifest": { "run_count": 4118, "window": { "from": "2027-02-18T00:00:00Z", "to": "2027-02-24T09:00:00Z" }, "manifest_hash": "sha256:3c9e1a7f…" },
    "affected_signals": { "count": 214, "revoked": 214, "revocation_note": "Deliveries revoked; the reviews already recorded against them are retained and flagged" },
    "containment": [
      { "action": "SUSPEND_DEPLOYMENT", "at": "2027-02-24T09:30:00Z", "governed": true, "approval_id": "appr_01HZYX2Y3Z4A5B6C7D8E9F0G10" },
      { "action": "FALLBACK_ENGAGED", "at": "2027-02-24T09:30:01Z", "fallback": "PRESENT_UNRANKED_LIST" }
    ],
    "notification": { "affected_parties_notified": true, "notified_at": "2027-02-24T11:00:00Z", "recipients": ["MINE_SAFETY_OFFICERS", "AFFECTED_CONTRACTOR_ORGANISATIONS"] },
    "correction": { "kind": "REPROCESS_AND_REISSUE", "state": "IN_PROGRESS", "reissued_signal_count": 0 },
    "opened_at": "2027-02-24T09:20:00Z",
    "closed_at": null,
    "extensions": {},
    "links": { "self": "/api/v1/ai-incidents/aiin_01HZYW1X2Y3Z4A5B6C7D8E9F00" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-02-24T12:00:00Z" }
}
```

**A monitor alert never silently changes a threshold or swaps a model.** Rollback and suspension are governed actions with an approval id, as shown in `containment`.

A retired or suspended deployment **cannot influence new decisions**, and its lineage stays readable under retention — `GET /ai-deployments?view=runs&filter[deployment_version_id]=…` still resolves years later.

---

## Invariants

- Every production run binds one approved, unexpired use-case version and deployment version.
- Risk tier and allowed decision influence cannot be lowered by the model developer alone.
- A model, prompt, provider, or mapping substitution creates a new version and an approval impact review.
- Training, evaluation, and serving inputs are manifest-bound and point-in-time correct.
- Synthetic data is labelled and can never alone satisfy a real-world effectiveness or fairness gate.
- Protected attributes and their proxies require a declared purpose and never leak into ordinary outputs.
- A run output or signal is immutable and never overwrites a source-domain fact.
- Signal review, contest, and supersession are additive; dismissed signals remain auditable.
- A signal cannot execute a high-impact domain decision directly.
- Human reviewer authority and business gates are evaluated independently of the model score.
- An explanation binds the exact run, model, features, and comparator; generic text is invalid.
- Missing, stale, or low-coverage input follows the declared degrade or withhold policy.
- Authorization occurs before feature and context retrieval, and again before delivery and read.
- Provider logs and traces may not contain unapproved sensitive prompts, outputs, or secrets.
- Monitor alerts never silently change thresholds or models; rollback and suspension are governed.
- A developer can never solely approve their own model; the required independent functions are enforced.
- A retired or suspended deployment cannot influence new decisions, and its lineage stays readable under retention.
- Every command uses idempotency and optimistic concurrency, and every artefact carries integrity and provenance.

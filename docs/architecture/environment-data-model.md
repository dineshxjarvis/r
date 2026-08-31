# Strata — Environmental Monitoring Logical Data Model

## 1. Authority

This model implements the [environment specification](../features/environment/environmental-monitoring-spec.md). Documents/compliance own source duties; GIS owns geometry; evidence owns files; incidents and CAPA own their lifecycles; reporting/integration consume approved manifests.

## 2. Catalogues, programme and bindings

- `environment_parameter(id, code, name, matrix_kind, canonical_unit, value_semantics, active)`
- `environment_method(id, code, version, parameter_id, matrix_kind, detection_limit_semantics, required_accreditation_scope, effective_from, effective_until)`
- `monitoring_point(id, tenant_id, mine_id, code, point_kind, source_asset_id nullable, geometry_id, geometry_version_id, valid_from, valid_until, status)`
- `monitoring_program(id, tenant_id, mine_id, version, effective_from, effective_until, source_obligation_ids, state, owner_post_id, approved_by_appointment_id nullable)`
- `program_requirement(id, program_id, point_selector, parameter_id, eligible_method_ids, frequency_rule, coverage_rule, responsible_post_id)`
- `environmental_limit_binding(id, tenant_id, mine_id, source_document_version_id, source_anchor, obligation_id, parameter_id, matrix_kind, point_selector, eligible_method_ids, unit, basis, statistic, averaging_rule, comparison_operator, threshold_low nullable, threshold_high nullable, applicability_expression, exceedance_rule, response_policy_id, effective_from, effective_until, state, proposed_by_appointment_id, published_by_appointment_id nullable, supersedes_id nullable)`

Published binding intervals do not overlap for the same source condition/context. Thresholds use decimal values and versioned unit conversions.

## 3. Instruments and continuous observations

- `environment_instrument(id, tenant_id, monitoring_point_id, device_kind, external_ref, installed_at, retired_at nullable, status)`
- `environment_instrument_event(id, instrument_id, event_kind, occurred_at, configuration_hash, evidence_id nullable, actor_ref, details)` for calibration, zero/span, maintenance, fault and clock changes.
- `environment_observation(id, tenant_id, instrument_id, parameter_id, source_record_id, observed_at, received_at, raw_value, raw_unit, raw_payload_hash, device_quality_flags, sequence_no nullable)`
- `environment_validated_result(id, observation_or_window_ref, parameter_id, value, unit, basis, statistic, interval_start, interval_end, coverage, quality_state, validation_rule_version, validated_by_principal_or_appointment, supersedes_id nullable)`

Unique `(instrument_id, source_record_id)` and sequence checks provide idempotency/gap detection. Raw observations are immutable.

## 4. Samples, custody and laboratory results

- `environment_sample(id, tenant_id, mine_id, client_sample_id, monitoring_point_id, parameter_or_panel, collected_from, collected_to, sampler_appointment_id, container, preservative, field_conditions, seal_id, state)`
- `sample_custody_event(id, sample_id, sequence_no, event_kind, occurred_at, from_party, to_party, actor_appointment_or_external_ref, seal_condition, temperature nullable, evidence_id nullable)`
- `laboratory(id, organization_id, accreditation_reference, status)` and `laboratory_scope(id, laboratory_id, parameter_id, method_id, valid_from, valid_until)`
- `lab_analysis(id, sample_id, laboratory_id, method_id, batch_ref, started_at, completed_at, qc_summary, analyst_ref)`
- `environment_lab_result(id, analysis_id, parameter_id, reported_value nullable, qualifier, unit, basis, detection_limit nullable, quantification_limit nullable, quality_state, certificate_document_id, issued_at, authorized_signatory_ref, supersedes_id nullable)`

Custody and scope quality gates qualify usability; they do not delete results.

## 5. Evaluation, cases and periods

- `environment_evaluation(id, result_ref, limit_binding_id, evaluated_at, compatibility_result, outcome, explanation, conversion_version, coverage_policy_version, reviewed_by_appointment_id nullable, supersedes_id nullable)`
- `environment_exceedance_case(id, tenant_id, mine_id, evaluation_id, severity, state, owner_post_id, due_at, response_policy_version, incident_id nullable, finding_id nullable, capa_id nullable, completed_at nullable, version)`
- `environment_case_event(id, case_id, event_kind, occurred_at, actor_appointment_id, reason, evidence_id nullable)`
- `environment_monitoring_period(id, tenant_id, mine_id, period_kind, starts_at, ends_at, state, version, approved_by_appointment_id nullable, released_at nullable)`
- `environment_period_manifest(id, period_id, manifest_version, program_versions, binding_versions, included_result_ids, excluded_result_reasons, coverage_summary, evaluation_ids, open_case_ids, manifest_hash, created_at)`
- `environment_external_mirror(id, period_id, external_system, package_hash, transport_state, external_reference nullable, acknowledgement_state, compared_at, discrepancy_ref nullable)`

## 6. Constraints/tests

1. Result cannot evaluate against different parameter/matrix without explicit compatible mapping.
2. Conversion requires versioned exact unit/basis rule; no float arithmetic.
3. Binding must be effective for result interval and applicable context.
4. Coverage below policy cannot produce `WITHIN_LIMIT`.
5. `<LOD`/`<LOQ` qualifier cannot be converted to zero.
6. Lab scope/method validity is checked at analysis time.
7. Custody sequence is contiguous; breaks remain visible.
8. Calibration failure identifies affected observation interval.
9. Correction supersedes result/evaluation/period manifest without deletion.
10. Case completion cannot close incident/finding/CAPA automatically.
11. Monitoring point keeps geometry version used historically.
12. External mirror cannot mutate approved period/results.


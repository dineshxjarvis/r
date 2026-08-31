# Strata — Production, Dispatch and Stock Logical Data Model

## 1. Authority

This is the logical contract for the [production specification](../features/production/production-dispatch-stock-spec.md). Foundation owns tenant/mine/assets/organizations; evidence owns files; GIS/survey and laboratory sources are referenced; reporting/integrations consume approved facts.

## 2. Catalogue and locations

- `material_definition(id, code, name, material_kind, quality_basis_schema, effective_from, effective_until)`
- `material_accounting_boundary(id, tenant_id, boundary_kind, mine_id nullable, facility_asset_id nullable, code, name, active)`; exactly one governed target is set and shared facilities need no fake mine owner.
- `stock_location(id, tenant_id, accounting_boundary_id, asset_id nullable, code, location_kind, capacity_quantity nullable, geometry_id nullable, active)`
- `measurement_device(id, tenant_id, mine_id, asset_id nullable, device_kind, external_ref, status)`
- `device_calibration(id, device_id, valid_from, valid_until, method, certificate_document_id, tolerance, result, performed_by, supersedes_id)`
- `production_source_policy(id, tenant_id, accounting_boundary_id nullable, event_kind, context_selector, effective_from, effective_until, eligible_sources, precedence_rules, tolerance_rules, fallback_rules, reviewer_policy, version, approved_by_appointment_id)`

Catalogues use effective intervals; material/quality/method taxonomies are data, not enums tied to one operator.

## 3. Lots, events and measurements

- `material_lot(id, tenant_id, accounting_boundary_id, origin_mine_id nullable, material_definition_id, origin_kind, origin_ref, created_at, status)`
- `material_event(id, tenant_id, accounting_boundary_id, client_event_id, event_kind, occurred_from, occurred_to, recorded_at, source_location_id nullable, destination_location_id nullable, operating_organization_id nullable, contractor_engagement_id nullable, status, version)`
- `material_event_lot(id, event_id, lot_id, direction, quantity_measurement_id, lineage_fraction nullable)`
- `quantity_measurement(id, tenant_id, source_kind, source_system, source_record_id, device_id nullable, observed_value, observed_unit, basis, normalized_value, normalized_unit, uncertainty, device_time nullable, received_at, calibration_id nullable, evidence_id nullable, time_confidence, classification, supersedes_id nullable)`

Unique `(tenant_id, source_system, source_record_id)` and `(tenant_id, client_event_id)` provide idempotency. Classification such as `OPERATIONAL`, `TEST`, `CALIBRATION`, `DUPLICATE`, `VOIDED_WITH_REASON` never deletes measurements.

## 4. Processing and dispatch

- `processing_run(id, tenant_id, mine_id, process_asset_id, started_at, ended_at, method_version, status)` with input/output/reject/loss `material_event_lot` links.
- `dispatch_consignment(id, tenant_id, mine_id, consignment_ref, mode, consignee_ref, destination_ref, material_definition_id, status, authorized_by_appointment_id, authorized_at, released_at nullable)`
- `dispatch_vehicle_leg(id, consignment_id, vehicle_or_wagon_ref, carrier_organization_id nullable, gross_measurement_id nullable, tare_measurement_id nullable, net_measurement_id, anpr_ref nullable, tracking_trip_ref nullable, gate_out_at nullable)`
- `dispatch_evidence_link(id, consignment_id, evidence_kind, external_reference, evidence_id nullable)`

Net quantity is derived with method/version; direct net measurement is allowed only under approved mode policy. One measurement cannot count in multiple active consignments unless explicitly apportioned.

## 5. Stock snapshots and adjustments

- `stock_book_snapshot(id, location_id, material_definition_id, as_of, period_id, quantity, unit, event_manifest_hash, projection_version)` rebuilds from accepted events.
- `physical_stock_snapshot(id, location_id, material_definition_id, surveyed_at, method, geometry_version_id nullable, volume nullable, density_assumption nullable, moisture_basis nullable, measured_quantity, unit, uncertainty, survey_team_ref, evidence_manifest_hash, approved_by_appointment_id nullable)`
- `stock_variance(id, book_snapshot_id, physical_snapshot_id, variance_quantity, tolerance_policy_version, state, discrepancy_id)`
- `stock_adjustment(id, tenant_id, accounting_boundary_id, location_id, material_definition_id, quantity, unit, cause_code, reason, proposed_by_appointment_id, approved_by_appointment_id nullable, effective_period_id, evidence_manifest_hash, state)`

## 6. Periods, discrepancies and facts

- `production_period(id, tenant_id, accounting_boundary_id, period_kind, starts_at, ends_at, parent_period_id nullable, state, version, cutoff_at nullable, approved_by_appointment_id nullable, approved_at nullable, published_at nullable)`
- `production_discrepancy(id, tenant_id, accounting_boundary_id, period_id nullable, kind, severity, policy_id, state, owner_post_id, due_at, summary, opened_at, resolved_at nullable)`
- `discrepancy_assertion(id, discrepancy_id, source_kind, source_ref, quantity, unit, basis, evidence_refs)`
- `discrepancy_decision(id, discrepancy_id, disposition, chosen_basis, adjustment_id nullable, reason, proposed_by_appointment_id, reviewed_by_appointment_id, decided_at)`
- `approved_production_fact(id, period_id, fact_kind, dimensions, value, unit, basis, source_policy_id, event_manifest_hash, fact_version, approved_by_appointment_id, approved_at, supersedes_id nullable)`
- `external_fact_mirror(id, approved_fact_id, external_system, external_record_ref, submitted_value, status, acknowledgement_ref nullable, compared_at, discrepancy_id nullable)`

Approval/reopen locks the period row and rechecks unresolved blockers. Approved facts are superseded, never updated in place. Event manifests make aggregates exactly reproducible.

## 7. Constraints and tests

1. Internal transfer has source and destination and nets to zero across mine boundary.
2. Rehandling cannot create origin quantity.
3. Processing input/output/loss lineage reconciles within effective policy.
4. Test/calibration/duplicate measurements never enter approved manifests.
5. Gross/tare/net and unit/basis math uses versioned decimal conversion, never float.
6. Device measurement outside calibration interval opens a discrepancy.
7. Book snapshot is rebuildable and never overwritten by physical snapshot.
8. Adjustment proposer differs from approver under policy.
9. Contractor engagement and operating organization do not replace tenant/mine legal owner.
10. Published period accepts late data only through reopen/superseding fact or governed next-period adjustment.
11. External mirror cannot mutate approved fact.
12. RLS/capability tests clip mine and cross-tenant portfolio access.
13. Shared-facility events retain origin-mine allocation lineage and never require a fabricated owning mine.
14. Canonical quantities use decimal metric tonnes and explicit basis; reporting scale conversions are versioned.

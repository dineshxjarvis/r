# Strata — Foundation Relational Model

This is the logical relational contract for the corrected foundation. Read it with [`identity-authority-model.md`](identity-authority-model.md). Executable PostgreSQL migrations must implement and test this contract; Markdown SQL is not the physical schema authority.

## Conventions

- UUIDv7 native primary keys; separate unique human-facing references.
- UTC `TIMESTAMPTZ`; authority intervals are half-open `[valid_from, valid_until)`.
- Authority relationships are revoked or superseded, never rewritten or hard-deleted.
- Every tenant-owned row carries immutable `tenant_id`; platform catalogues omit it deliberately.
- Stable state-machine values may be constrained types. Authorities, titles, organisation kinds, mandates, and taxonomies are reference data, not PostgreSQL enums.

## Identity and authentication

`person(id, display_name, primary_email, phone, status, merged_into_id)` describes a human. It contains no employment type, role, tenant, or login status.

`principal(id, kind, person_id, status, credential_version, last_authenticated_at)` owns login lifecycle. `kind` is human or service; a current human principal has one person. `credential_version` invalidates all sessions.

Authentication and signing use separate tables:

- `password_authenticator(principal_id, password_hash, parameters, changed_at, revoked_at)`
- `oidc_identity(principal_id, issuer, subject, linked_at, revoked_at)`, unique on `(issuer, subject)`
- `passkey_credential(principal_id, credential_id, public_key, sign_count, revoked_at)`
- `signing_identity(person_id, provider, certificate_ref, valid_from, valid_until, revoked_at)`
- `signature_event(signing_identity_id, payload_hash, purpose, signed_at, verification_result)`

`session(id_hash, principal_id, credential_version, assurance_level, authenticated_at, issued_at, last_seen_at, idle_expires_at, absolute_expires_at, selected_tenant_id, selected_resource_type, selected_resource_id, csrf_secret_hash, revoked_at, revocation_reason)` stores a hash of the opaque cookie. Selected context is navigation only; no grants live here.

## Tenant, organisation, and affiliation

- `tenant(id, code, name, status, data_region)` is the isolation boundary.
- `organization(id, tenant_id nullable, code, legal_name, organization_kind_id, status)` represents a legal/administrative body.
- `organization_unit(id, organization_id, parent_unit_id nullable, unit_kind_id, code, name, valid_from, valid_until)` is recursive; cycles are rejected.
- `mine(id, tenant_id, code, name, mine_profile_id, status, geometry, ...)` starts the physical asset hierarchy.
- `asset_responsibility(id, organization_unit_id, mine_id nullable, asset_id nullable, responsibility_kind, valid_from, valid_until)` links administration to physical assets; exactly one target is set.

`affiliation(id, person_id, organization_id, organization_unit_id nullable, affiliation_kind_id, external_reference, valid_from, valid_until nullable, revoked_at, superseded_by_id)` records employment, contractor membership, regulator service, consultancy, or secondment. Concurrent affiliations are allowed.

## Positions and appointments

`position_template(id, owning_organization_id nullable, code, title, description, statutory, default_holder_policy, active)` defines a reusable position.

`post(id, organization_id, organization_unit_id nullable, position_template_id, holder_policy, scope_resource_type nullable, scope_resource_id nullable, status)` is concrete. Holder policy is `SINGLE_HOLDER` or `MULTI_HOLDER`. Multiple posts may share template and scope; there is no unique `(template, scope)` constraint.

`appointment(id, person_id, post_id, affiliation_id nullable, mode, valid_from, valid_until, source_instrument_document_id, appointed_by_appointment_id nullable, revoked_at, revoked_by_principal_id, revoke_reason, superseded_by_id)` uses `REGULAR`, `ACTING`, or `ADDITIONAL_CHARGE` mode.

The database transactionally rejects effective interval overlap only for single-holder posts, using a deferred constraint trigger or equivalent occupancy table. A person may hold several concurrent appointments.

## Regulator authority and jurisdiction

- `regulatory_authority(id, organization_id, code, name, active)` identifies DGMS, MoEFCC, CPCB/SPCB, or another authority.
- `authority_unit(id, regulatory_authority_id, parent_unit_id nullable, unit_kind, code, name, valid_from, valid_until)` represents headquarters, zone, region, or state office.
- `capability(id, code, description, risk_class, required_assurance)` names an action.
- `mandate(id, regulatory_authority_id, code, name, description, active)` groups authority-specific capabilities.
- `mandate_capability(mandate_id, capability_id)` maps them.
- `mandate_assignment(id, appointment_id, mandate_id, valid_from, valid_until, source_instrument_document_id, revoked_at, superseded_by_id)` grants the mandate.
- `jurisdiction_assignment(id, appointment_id, mandate_assignment_id nullable, selector_type, selector_payload, valid_from, valid_until, source_instrument_document_id, revoked_at, superseded_by_id)` limits coverage.

Jurisdiction selectors include mine, mine set, tenant, organisation unit, state, geography, and platform portfolio. Payloads follow versioned schemas. Derived effective coverage may accelerate checks but is not canonical.

Authorization intersects active appointment, mandate, jurisdiction, and resource policy. `region.authority TEXT`, `raised_by_regulator`, or generic `INSPECTOR` cannot replace these relations.

## Policy and provenance

- `position_capability_policy(position_template_id, capability_id, resource_relation, conditions_schema_version)` grants organisational capabilities.
- `resource_closure_policy(resource_type, category, issuing_authority_id nullable, required_capability_id, separation_policy_id, valid_from, valid_until)` governs closure.
- `authorization_decision(principal_id, acting_person_id, action, resource_type, resource_id, decision, policy_version, supporting_appointment_id, supporting_mandate_assignment_id, effective_scope, decided_at, reason_code)` persists high-risk decisions.

Regulator-issued records store structured `issuing_authority_id`, `issuing_authority_unit_id`, `issuing_appointment_id`, and source instrument where applicable.

## Contractor relationships

Contractors are organisations; worker membership is an affiliation. `contractor_engagement(contractor_organization_id, tenant_id, mine_id nullable, asset_id nullable, valid_from, valid_until, contract_document_id, revoked_at)` supplies resource scope.

Current access requires current affiliation and engagement. `record_party(record_type, record_id, organization_id, relationship, effective_at)` supports record-specific historical access. Never retain an unconditional membership tuple for an expired affiliation.

## RLS, audit, and history

Ordinary requests set one validated `app.tenant_id` with `SET LOCAL`. Cross-tenant reads use a narrowly controlled authorized-resource set, not an unrestricted bypass for inspectors or administrators. Direct access and absent settings fail closed.

Use separate `domain_audit_event`, `security_event`, `access_event`, and `outbox_event` streams. A hash chain locks an `audit_chain_head` row, including an explicit platform chain; it does not select the latest event because an empty chain has nothing to lock.

Temporal projections/history tables support `as_of` reporting. Returning the last audit event's `after` JSON is insufficient for joined state or historical authorization.

## Completion criteria

The migration is complete when no canonical API uses `person_type` or generic inspector authority; OIDC binds issuer/subject; sessions revoke server-side; tenant, organisation, and mine hierarchies are separate; multi-holder posts work; mandates and temporal jurisdiction are auditable; contractor expiry removes current access; RLS covers ordinary/cross-tenant paths; and executable migrations pass constraint, RLS, and concurrency tests.

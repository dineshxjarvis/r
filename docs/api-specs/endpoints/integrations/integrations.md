# Integrations — connector governance, exchange, ingress, mapping, reconciliation, and health

Domain rules: [`../../../features/integrations/integration-platform-spec.md`](../../../features/integrations/integration-platform-spec.md). Logical model: [`../../../architecture/integration-data-model.md`](../../../architecture/integration-data-model.md). Conventions: [`../../README.md`](../../README.md).

Three rules that this domain never bends:

- **An external endpoint or client scope never grants domain authority.** A connector that can call in still passes every domain authorization and business gate on the way through.
- **Secret, token, and private-key values never appear in database rows, payload manifests, logs, or traces.** There are no fields for them. What is stored is a vault reference and a fingerprint.
- **Transport success is not business acknowledgement.** An HTTP 200, a completed file write, or a queue enqueue can never create a remote acknowledgement or a terminal business state without declared evidence.

## Routes

| Route | Purpose |
|---|---|
| `GET /external-systems` · `POST /external-systems` | Counterparty profile and identifier namespaces |
| `GET /connector-versions` · `POST /connector-versions` · `POST /connector-versions/{id}/actions` | Test, approve, activate; immutable after approval |
| `GET /connector-deployments` · `POST /connector-deployments` · `POST /connector-deployments/{id}/actions` | Environment binding, credentials, suspension |
| `GET /connector-credential-bindings` · `POST /connector-credential-bindings` · `POST /connector-credential-bindings/{id}/actions` | Vault reference and rotation |
| `GET /integration-exchanges` · `POST /integration-exchanges` · `GET /integration-exchanges/{id}` · `POST /integration-exchanges/{id}/actions` | Outbound work unit |
| `GET /integration-attempts` · `POST /integration-attempts/{id}/actions` | Per-try transport record |
| `POST /integration-ingress/{deployment_key}` · `GET /integration-exchanges?view=ingress` · `GET /integration-exchanges/ingress/{id}` | Inbound raw receipt |
| `GET /unmatched-inbound-records` · `POST /unmatched-inbound-records/{id}/actions` | Mapping decisions a human must make |
| `GET /external-resource-mappings` · `POST /external-resource-mappings` · `POST /external-resource-mappings/{id}/actions` | External identity to canonical resource |
| `GET /integration-dead-letters` · `POST /integration-dead-letters/{id}/actions` | Immutable failure input; replay or resolve |
| `GET /reconciliation-cases` · `POST /reconciliation-cases/{id}/actions` | Outcome-unknown and conflict resolution |
| `GET /poll-subscriptions` · `POST /poll-subscriptions/{id}/actions` | Cursor advance under durable-processing policy |
| `GET /bulk-transfers` · `POST /bulk-transfers` · `GET /bulk-transfers/{id}` · `POST /bulk-transfers/{id}/actions` | Row-level dispositions |
| `GET /integration-exchanges?view=health_snapshots` · `GET /integration-exchanges?view=slo_windows` | Platform, auth, schema, business, and freshness projections |
| `GET /webhook-endpoint-bindings` · `POST /webhook-endpoint-bindings` · `POST /webhook-endpoint-bindings/{id}/actions` | Subscriptions to Strata's own outbox |

`GET /connector-deployments/{id}/health` is `GET /integration-exchanges?view=health_snapshots&filter[deployment_id]=…`. The two health views share integration read authorization, temporal filtering, and freshness semantics but have separate response schemas. `GET /integration-operations/exceptions` is `GET /integration-exchanges?filter[state]=OUTCOME_UNKNOWN,DEAD_LETTERED`.

---

## POST /connector-versions/{id}/actions

**Auth:** `integration.connector.manage` to test; `integration.connector.approve` for each required review discipline.

**Connector definitions and mappings are immutable after approval**, and a deployment binds exact versions.

```json
{
  "action": "APPROVE",
  "expected_version": 4,
  "reason": "Domain, security, privacy, legal, and operations reviews complete; test corpus passes 214 of 214 cases",
  "payload": { "discipline": "SECURITY", "evidence_document_ids": ["doc_01HZY1A2B3C4D5E6F7G8H9J0K0"], "findings": [] },
  "supporting_authority": { "appointment_id": "app_01HZY2B3C4D5E6F7G8H9J0K1T0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Security approval recorded; 1 discipline outstanding",
  "data": {
    "id": "cnvr_01HZY3C4D5E6F7G8H9J0K1T2M0",
    "object": "connector_version",
    "version": 5,
    "tenant_id": null,
    "state": "UNDER_APPROVAL",
    "available_actions": ["APPROVE", "REJECT", "WITHDRAW"],
    "connector_definition": { "type": "connector_definition", "id": "cndf_01HZY4D5E6F7G8H9J0K1T2M3N0", "display": "PARIVESH case status connector" },
    "external_system": { "type": "external_system_profile", "id": "exsy_01HZY5E6F7G8H9J0K1T2M3N400", "display": "PARIVESH (MoEFCC)" },
    "version_label": "2.3.0",
    "direction": "INBOUND_POLL",
    "operations": ["FETCH_CASE_STATUS", "FETCH_DECISION_DOCUMENT"],
    "canonical_schema_version": { "id": "cmsc_01HZY6F7G8H9J0K1T2M3N405P0", "hash": "sha256:2b8c1e3f…", "media_type": "application/json" },
    "provider_schema_version": { "id": "prsc_01HZY7G8H9J0K1T2M3N405P6Q0", "hash": "sha256:7d1a9c4e…", "declared_by": "PARIVESH API v4" },
    "mapping_version": { "id": "cmvr_01HZY8H9J0K1T2M3N405P6Q7R0", "deterministic": true, "lossy_fields": [{ "provider_field": "remarks_html", "reason": "Free-form HTML is retained as raw artefact only, not mapped into canonical fields" }], "test_corpus": { "case_count": 214, "passing": 214 } },
    "semantic_acknowledgement": { "required": true, "evidence_kinds": ["PROVIDER_ACK_ENVELOPE", "CASE_ID_ECHO"] },
    "idempotency_policy": { "key_source": "EXTERNAL_CASE_ID_PLUS_OBSERVED_AT", "scope": "DEPLOYMENT_OPERATION" },
    "ordering_policy": { "kind": "PER_EXTERNAL_CASE_SEQUENCE", "out_of_order_handling": "AUDIT_AND_DISCARD_OLDER" },
    "approvals": [
      { "discipline": "DOMAIN", "state": "APPROVED", "approved_at": "2027-01-04T10:00:00Z" },
      { "discipline": "SECURITY", "state": "APPROVED", "approved_at": "2027-01-06T14:00:00Z" },
      { "discipline": "PRIVACY", "state": "APPROVED", "approved_at": "2027-01-05T11:00:00Z" },
      { "discipline": "LEGAL", "state": "APPROVED", "approved_at": "2027-01-05T16:00:00Z" },
      { "discipline": "OPERATIONS", "state": "PENDING", "approved_at": null }
    ],
    "immutable_after_approval": true,
    "activatable": false,
    "created_at": "2027-01-02T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/connector-versions/cnvr_01HZY3C4D5E6F7G8H9J0K1T2M0" }
  },
  "meta": { "action": "APPROVE", "transition": null, "effects": [ { "object": "connector_approval", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-01-06T14:00:00Z" }
}
```

`lossy_fields` is declared up front. A connector that quietly drops a provider field is a connector that will one day be asked where the remark went.

---

## POST /connector-credential-bindings

**Auth:** `integration.credential.manage`.

```json
{
  "connector_deployment_id": "cndp_01HZY9J0K1T2M3N405P6Q7R8S0",
  "auth_method": "OAUTH2_CLIENT_CREDENTIALS",
  "vault_reference": "vault://strata-int/parivesh/prod/client#v4",
  "scopes": ["case:read", "document:read"],
  "effective_from": "2027-01-10T00:00:00Z",
  "effective_until": "2027-07-10T00:00:00Z",
  "rotation_policy": { "rotate_every": "P180D", "overlap": "P7D", "notify_before": "P14D" },
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Credential binding created",
  "data": {
    "id": "cncb_01HZYA0B1C2D3E4F5G6H7J8K90",
    "object": "connector_credential_binding",
    "version": 1,
    "tenant_id": null,
    "state": "ACTIVE",
    "available_actions": ["ROTATE", "REVOKE"],
    "connector_deployment": { "type": "connector_deployment", "id": "cndp_01HZY9J0K1T2M3N405P6Q7R8S0", "display": "PARIVESH connector, production" },
    "auth_method": "OAUTH2_CLIENT_CREDENTIALS",
    "vault_reference": "vault://strata-int/parivesh/prod/client#v4",
    "secret_value_stored": false,
    "secret_fields_in_this_model": [],
    "credential_fingerprint": "sha256:9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "scopes": ["case:read", "document:read"],
    "effective_from": "2027-01-10T00:00:00Z",
    "effective_until": "2027-07-10T00:00:00Z",
    "rotation_state": { "state": "CURRENT", "rotate_by": "2027-07-08T00:00:00Z", "overlap": "P7D", "previous_binding_id": "cncb_01HZYB1C2D3E4F5G6H7J8K9T00" },
    "revalidated_at_attempt_start": true,
    "revalidation_note": "Credential and consent validity are checked when an attempt begins, not when the exchange was queued",
    "created_at": "2027-01-09T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/connector-credential-bindings/cncb_01HZYA0B1C2D3E4F5G6H7J8K90" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-01-09T10:00:00Z" }
}
```

`secret_value_stored: false` and an empty `secret_fields_in_this_model` are returned deliberately. There is nowhere in this model for a secret to live, and the API says so rather than leaving it to trust.

---

## POST /integration-exchanges

**Auth:** `integration.exchange.create` on the owning domain resource. **An idempotency key can never bind two different request hashes.**

```json
{
  "connector_deployment_id": "cndp_01HZYC2D3E4F5G6H7J8K9T0M10",
  "direction": "OUTBOUND",
  "operation": "SUBMIT_FILING_PACKAGE",
  "owning_domain": "reporting",
  "target": { "type": "filing_package", "id": "fpkg_01HZYQ5R6S7T8V9V0W1X2Y3Z40" },
  "idempotency_key": "SECL-GEV-FORMIV-2026Q3",
  "priority": "NORMAL",
  "payload_manifest": {
    "canonical_object": { "type": "filing_package", "id": "fpkg_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "version": 1 },
    "canonical_hash": "sha256:6f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "classification": "INTERNAL",
    "allowed_destinations": ["exsy_01HZYD3E4F5G6H7J8K9T0M1N20"]
  },
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Exchange queued",
  "data": {
    "id": "iexc_01HZYE4F5G6H7J8K9T0M1N2030",
    "object": "integration_exchange",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "QUEUED",
    "available_actions": ["CANCEL"],
    "direction": "OUTBOUND",
    "operation": "SUBMIT_FILING_PACKAGE",
    "owning_domain": "reporting",
    "target": { "type": "filing_package", "id": "fpkg_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "display": "DGMS Form IV, Gevra OCP, Q3 FY2026-27" },
    "correlation_id": "corr_01HZYF5G6H7J8K9T0M1N203P40",
    "idempotency_key": "SECL-GEV-FORMIV-2026Q3",
    "idempotency_request_hash": "sha256:6f2c8b1a…",
    "payload_manifest": { "id": "epmn_01HZYG6H7J8K9T0M1N203P4Q50", "canonical_object": { "type": "filing_package", "id": "fpkg_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "version": 1 }, "canonical_hash": "sha256:6f2c8b1a…", "rendered_object_hash": "sha256:3c9e1a7f…", "schema_version_id": "cmsc_01HZYH7J8K9T0M1N203P4Q5R60", "mapping_version_id": "cmvr_01HZYJ8K9T0M1N203P4Q5R6S70", "classification": "INTERNAL", "allowed_destinations": ["exsy_01HZYD3E4F5G6H7J8K9T0M1N20"], "destination_permitted": true },
    "policy_versions": { "connector_version_id": "cnvr_01HZYK9T0M1N203P4Q5R6S7T80", "operation_policy_version": 3, "mapping_version_id": "cmvr_01HZYJ8K9T0M1N203P4Q5R6S70" },
    "attempts": [],
    "remote_acknowledgement": null,
    "business_terminal_state": null,
    "created_at": "2027-01-09T11:55:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/integration-exchanges/iexc_01HZYE4F5G6H7J8K9T0M1N2030" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-01-09T11:55:00Z" }
}
```

### 409 — idempotency key reused with different content

```json
{
  "success": false,
  "message": "This idempotency key is already bound to a different request",
  "error": {
    "code": "CONFLICT",
    "details": {
      "idempotency_key": "SECL-GEV-FORMIV-2026Q3",
      "existing_exchange_id": "iexc_01HZYE4F5G6H7J8K9T0M1N2030",
      "existing_request_hash": "sha256:6f2c8b1a…",
      "submitted_request_hash": "sha256:1a4f9c2e…",
      "resolution": "Use a new idempotency key for different content. Reusing one for a changed payload would make the retry semantics meaningless."
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### GET /integration-exchanges/{id} — outcome unknown

```json
{
  "success": true,
  "data": {
    "id": "iexc_01HZYE4F5G6H7J8K9T0M1N2030",
    "object": "integration_exchange",
    "version": 3,
    "state": "OUTCOME_UNKNOWN",
    "available_actions": ["RECONCILE", "CANCEL"],
    "operation": "SUBMIT_FILING_PACKAGE",
    "attempts": [
      { "id": "iatt_01HZYT0M1N203P4Q5R6S7T8V90", "attempt_number": 1, "endpoint": "https://parivesh.nic.in/api/v4/submissions", "credential_binding_id": "cncb_01HZYA0B1C2D3E4F5G6H7J8K90", "credential_revalidated_at_start": true, "started_at": "2027-01-09T12:00:00Z", "ended_at": "2027-01-09T12:00:31Z", "request_metadata": { "method": "POST", "content_type": "application/json", "byte_size": 184213, "request_hash": "sha256:6f2c8b1a…" }, "response_metadata": null, "transport_verdict": "OUTCOME_UNKNOWN", "sanitized_problem": { "class": "TIMEOUT_AFTER_REQUEST_SENT", "detail": "Read timeout at 30 s. The request body was fully transmitted, so the remote system may or may not have persisted it.", "provider_error_code": null }, "artifacts": [{ "id": "trar_01HZYM1N203P4Q5R6S7T8V9V00", "kind": "REQUEST", "object_ref": "s3://strata-int-artifacts/…", "hash": "sha256:6f2c8b1a…", "classification": "INTERNAL", "retention": "P7Y" }] }
    ],
    "automatic_retry_permitted": false,
    "automatic_retry_blocked_reason": "The operation is not safe to replay blind after a timeout following a completed send. Reconcile against the remote system first.",
    "reconciliation_case_id": "rccs_01HZYN203P4Q5R6S7T8V9V0W10",
    "remote_acknowledgement": null,
    "business_terminal_state": null,
    "links": { "self": "/api/v1/integration-exchanges/iexc_01HZYE4F5G6H7J8K9T0M1N2030" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-01-09T12:01:00Z" }
}
```

A **timeout after a possible send is `OUTCOME_UNKNOWN` until reconciled**, and unsafe automatic retry is prohibited. Two statutory filings created by a retry loop is a worse outcome than one delayed filing.

The error is **sanitized**: `sanitized_problem` carries a class and a human detail. Provider stack traces, headers, and credentials never reach this field.

---

## POST /integration-ingress/{deployment_key}

**Auth:** the deployment's configured inbound authentication. **This scope never grants domain authority.**

### Response — 202 Accepted

```json
{
  "success": true,
  "message": "Received",
  "data": {
    "id": "ienv_01HZY03P4Q5R6S7T8V9V0W1X20",
    "object": "ingress_envelope",
    "version": 1,
    "state": "VALIDATING",
    "connector_deployment_id": "cndp_01HZYC2D3E4F5G6H7J8K9T0M10",
    "channel": "WEBHOOK",
    "received_at": "2027-01-15T04:12:00Z",
    "raw_object_ref": "s3://strata-int-ingress/…",
    "raw_hash": "sha256:4c1e9a7f2b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8",
    "raw_bytes_immutable": true,
    "source_network": { "remote_ip_class": "ALLOWLISTED", "tls_version": "TLSv1.3" },
    "signature": { "method": "HMAC_SHA256", "key_version": 4, "valid": true },
    "nonce": "n_9c1a4b2e7d05", 
    "quarantine_state": "NOT_QUARANTINED",
    "links": { "self": "/api/v1/integration-exchanges/ingress/ienv_01HZY03P4Q5R6S7T8V9V0W1X20" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-01-15T04:12:00Z" }
}
```

### GET /integration-exchanges/ingress/{id} — after validation and handoff

```json
{
  "success": true,
  "data": {
    "id": "ienv_01HZY03P4Q5R6S7T8V9V0W1X20",
    "object": "ingress_envelope",
    "version": 4,
    "state": "HANDED_OFF",
    "validations": [
      { "check": "AUTHENTICATION", "verdict": "PASS" },
      { "check": "REPLAY", "verdict": "PASS", "detail": "Nonce unseen within the 300 s replay window" },
      { "check": "MALWARE", "verdict": "PASS" },
      { "check": "SCHEMA", "verdict": "PASS", "provider_schema_version_id": "prsc_01HZY7G8H9J0K1T2M3N405P6Q0" },
      { "check": "SIZE_AND_TYPE", "verdict": "PASS" },
      { "check": "POLICY", "verdict": "PASS" }
    ],
    "deduplication": { "inbox_key": "cndp_01HZYC2D3E4F5G6H7J8K9T0M10:FETCH_CASE_STATUS:IA/CG/CMIN/442118/2026:2027-01-15T04:00:00Z", "first_seen": true, "duplicate_of": null },
    "canonical_inbound_event": {
      "id": "cine_01HZYP4Q5R6S7T8V9V0W1X2Y30",
      "specversion": "1.0",
      "type": "in.gov.parivesh.case.status.changed",
      "source": "/external-systems/exsy_01HZYD3E4F5G6H7J8K9T0M1N20",
      "id_field": "PARIVESH-EVT-8841221",
      "time": "2027-01-15T04:00:00Z",
      "datacontenttype": "application/json",
      "canonical_body_ref": "s3://strata-int-canonical/…",
      "mapping_execution": { "id": "mpex_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "mapping_version_id": "cmvr_01HZYJ8K9T0M1N203P4Q5R6S70", "input_hash": "sha256:4c1e9a7f…", "output_hash": "sha256:8b3d2f1a…", "warnings": [{ "field": "remarks_html", "warning": "LOSSY_FIELD_RETAINED_AS_ARTEFACT_ONLY" }], "disposition": "ACCEPTED" }
    },
    "ordering_check": { "policy": "PER_EXTERNAL_CASE_SEQUENCE", "source_sequence": 41, "last_processed_sequence": 40, "out_of_order": false, "older_version_would_be_discarded": true },
    "domain_handoff": {
      "id": "dhof_01HZYR6S7T8V9V0W1X2Y3Z4A50",
      "target_domain": "regulatory-cases",
      "target_command": "external_case_snapshot.create",
      "service_capability": "regulatory.case.mirror",
      "idempotent": true,
      "bypasses_domain_gates": false,
      "outcome": "ACCEPTED",
      "domain_reference": { "type": "external_case_snapshot", "id": "ecsn_01HZYS7T8V9V0W1X2Y3Z4A5B60" },
      "handed_off_at": "2027-01-15T04:12:03Z"
    },
    "links": { "self": "/api/v1/integration-exchanges/ingress/ienv_01HZY03P4Q5R6S7T8V9V0W1X20" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-01-15T04:15:00Z" }
}
```

`bypasses_domain_gates: false` appears on every handoff. The connector delivered a canonical event; the regulatory-cases domain decided whether to accept it, under its own rules.

---

## POST /unmatched-inbound-records/{id}/actions

**Auth:** `integration.mapping.decide`.

**A bare external identifier is never globally unique.** System and namespace are always required, and an ambiguous match is a human decision, never a guess.

```json
{
  "success": true,
  "data": {
    "id": "uinr_01HZYT8V9V0W1X2Y3Z4A5B6C70",
    "object": "unmatched_inbound_record",
    "version": 1,
    "state": "AWAITING_DECISION",
    "available_actions": ["MAP", "REJECT", "DEFER"],
    "reason": "AMBIGUOUS_MAPPING",
    "external_identifier": { "system": "SECL_HRMS", "namespace": "EMPLOYEE_CODE", "identifier": "E1024" },
    "safe_summary": "An employee record referencing code E1024 arrived from SECL HRMS. Two Strata people carry that external reference.",
    "candidates": [
      { "canonical_resource": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" }, "confidence": 0.51, "basis": "External reference E1024 present, affiliation active" },
      { "canonical_resource": { "type": "person", "id": "per_01HZYV9V0W1X2Y3Z4A5B6C7D80", "display": "R. Kumar (Rajesh)" }, "confidence": 0.49, "basis": "External reference E1024 present, affiliation ended 2024" }
    ],
    "auto_merge_permitted": false,
    "owner_post": { "type": "post", "id": "post_01HZYV0W1X2Y3Z4A5B6C7D8E90", "display": "HR Systems Administrator, SECL" },
    "deadline_at": "2027-01-22T00:00:00Z",
    "links": { "self": "/api/v1/unmatched-inbound-records/uinr_01HZYT8V9V0W1X2Y3Z4A5B6C70" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-01-16T09:00:00Z" }
}
```

---

## POST /bulk-transfers · row dispositions

**Auth:** `integration.bulk.manage`.

**Partial bulk success has row-level dispositions and can never be represented as whole-file success.**

```json
{
  "success": true,
  "data": {
    "id": "blkt_01HZYW1X2Y3Z4A5B6C7D8E9F00",
    "object": "bulk_transfer",
    "version": 4,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED_WITH_EXCEPTIONS",
    "available_actions": ["EXPORT_DISPOSITIONS", "REPLAY_FAILED_ROWS"],
    "connector_deployment_id": "cndp_01HZYX2Y3Z4A5B6C7D8E9F0G10",
    "operation": "IMPORT_CONTRACTOR_ROSTER",
    "manifest": { "id": "blkm_01HZYY3Z4A5B6C7D8E9F0G1H20", "period": { "from": "2027-01-01", "to": "2027-02-01" }, "schema_version_id": "cmsc_01HZYZ4A5B6C7D8E9F0G1H2130", "file_hash": "sha256:2b8c1e3f…", "signature_valid": true, "encrypted": true, "expected_rows": 4182, "source_proof_document_id": "doc_01HZZ0A5B6C7D8E9F0G1H213J0" },
    "row_summary": { "expected": 4182, "processed": 4182, "accepted": 4104, "rejected": 41, "duplicate": 19, "unmatched": 18 },
    "whole_file_success": false,
    "whole_file_success_note": "78 rows did not accept. This transfer is never reported as a successful import.",
    "row_dispositions_url": "/api/v1/bulk-transfers/blkt_01HZYW1X2Y3Z4A5B6C7D8E9F00/row-dispositions",
    "started_at": "2027-01-31T22:00:00Z",
    "completed_at": "2027-01-31T22:14:00Z",
    "links": { "self": "/api/v1/bulk-transfers/blkt_01HZYW1X2Y3Z4A5B6C7D8E9F00" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-02-01T08:00:00Z" }
}
```

```json
{
  "success": true,
  "data": [
    { "id": "blrd_01HZZ1B6C7D8E9F0G1H213J4K0", "row_key": "E1024|2027-01", "row_hash": "sha256:7d1a9c4e…", "disposition": "UNMATCHED", "reason": "Two Strata people carry external reference E1024", "unmatched_record_id": "uinr_01HZYT8V9V0W1X2Y3Z4A5B6C70", "domain_reference": null },
    { "id": "blrd_01HZZ2C7D8E9F0G1H213J4K5T0", "row_key": "E1188|2027-01", "row_hash": "sha256:3c9e1a7f…", "disposition": "REJECTED", "reason": "Trade code HEMM_OPR_X is not in the trade catalogue", "domain_reference": null },
    { "id": "blrd_01HZZ3D8E9F0G1H213J4K5T6M0", "row_key": "E1201|2027-01", "row_hash": "sha256:8b3d2f1a…", "disposition": "ACCEPTED", "reason": null, "domain_reference": { "type": "package_assignment", "id": "pasg_01HZZ4E9F0G1H213J4K5T6M7N0" } }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 4182, "total_pages": 210, "has_next": true, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-02-01T08:05:00Z" }
}
```

---

## POST /integration-dead-letters/{id}/actions

**Auth:** `integration.dead_letter.manage`; a high-risk replay policy additionally enforces approval.

**A dead letter retains its immutable failure input. An operator cannot edit it into success.**

```json
{
  "action": "REPLAY",
  "expected_version": 2,
  "reason": "The provider confirmed the schema regression was rolled back at 09:40; INC-INT-2027-0114",
  "payload": { "replay_with": { "mapping_version_id": "cmvr_01HZZ5F0G1H213J4K5T6M7N800", "connector_version_id": "cnvr_01HZZ6G1H213J4K5T6M7N809P0", "operation_policy_version": 4 }, "ticket_reference": "INC-INT-2027-0114", "approval_id": "appr_01HZZ7H213J4K5T6M7N809P0Q0" },
  "supporting_authority": { "appointment_id": "app_01HZZ8J3K4T5M6N708P9Q0R1S0", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Replay queued against the original immutable input",
  "data": {
    "id": "idlt_01HZZ9K4T5M6N708P9Q0R1S2T0",
    "object": "integration_dead_letter",
    "version": 3,
    "state": "REPLAY_QUEUED",
    "failed_unit": { "kind": "INGRESS_ENVELOPE", "id": "ienv_01HZZAT5M6N708P9Q0R1S2T3V0" },
    "immutable_payload": { "raw_hash": "sha256:4c1e9a7f…", "editable": false, "editable_note": "The stored failure input is immutable. A replay re-runs it under new versions; it never rewrites what arrived." },
    "original_failure": { "reason_class": "SCHEMA_DRIFT", "detail": "Provider added a required field `clearance_sub_type` absent from provider schema version prsc_01HZY7G8H9J0K1T2M3N405P6Q0", "attempts": 3, "first_failed_at": "2027-01-14T02:00:00Z" },
    "replay": { "operator_action_id": "opac_01HZZBM6N708P9Q0R1S2T3V4V0", "preview_shown": true, "mapping_version_id": "cmvr_01HZZ5F0G1H213J4K5T6M7N800", "connector_version_id": "cnvr_01HZZ6G1H213J4K5T6M7N809P0", "reason": "The provider confirmed the schema regression was rolled back at 09:40; INC-INT-2027-0114", "ticket_reference": "INC-INT-2027-0114", "approval_id": "appr_01HZZ7H213J4K5T6M7N809P0Q0", "queued_at": "2027-01-16T10:00:00Z" },
    "available_actions": []
  },
  "meta": {
    "action": "REPLAY",
    "transition": { "from": "OPEN", "to": "REPLAY_QUEUED" },
    "effects": [ { "object": "operator_action", "id": "opac_01HZZBM6N708P9Q0R1S2T3V4V0", "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2027-01-16T10:00:00Z"
  }
}
```

Every manual replay, resend, and remap **references exact object, mapping, and policy versions, and requires a reason**. A high-risk operation additionally requires an approval id, and the whole thing is a first-class `operator_action` record with a preview.

---

## POST /poll-subscriptions/{id}/actions — ADVANCE_CHECKPOINT

**A poll or stream checkpoint advances only after the durable-processing policy is satisfied**, never merely on fetch.

```json
{
  "success": true,
  "message": "Checkpoint advanced",
  "data": {
    "id": "psub_01HZZCN708P9Q0R1S2T3V4V5W0",
    "object": "poll_subscription",
    "version": 118,
    "state": "ACTIVE",
    "operation": "FETCH_CASE_STATUS",
    "checkpoint": {
      "cursor": "2027-01-15T04:00:00Z|PARIVESH-EVT-8841221",
      "watermark": "2027-01-15T04:00:00Z",
      "overlap": "PT5M",
      "advanced_because": "DURABLE_PROCESSING_CONFIRMED",
      "durable_processing_proof": { "handed_off_count": 41, "accepted_count": 41, "dead_lettered_count": 0, "confirmed_at": "2027-01-15T04:12:04Z" },
      "last_success_at": "2027-01-15T04:12:04Z",
      "source_freshness": "2027-01-15T04:00:00Z",
      "lease": { "holder": "poller-3", "expires_at": "2027-01-15T04:17:00Z" }
    },
    "available_actions": ["RUN", "PAUSE"]
  },
  "meta": { "action": "ADVANCE_CHECKPOINT", "transition": null, "effects": [ { "object": "poll_checkpoint", "count": 1, "change": "UPDATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2027-01-15T04:12:04Z" }
}
```

An overlap window is retained so a checkpoint advance can never create a silent gap at a boundary.

---

## Invariants

- An external endpoint or client scope never grants domain authority.
- Connector definitions and mappings are immutable after approval; deployments bind exact versions.
- Secret, token, and private-key values never appear in database rows, payload manifests, logs, or traces.
- One idempotency key can never bind two different request hashes.
- A bare external identifier is never globally unique; system and namespace are always required.
- Original inbound and outbound bytes and source assertions are immutable; corrections append.
- HTTP, file, or queue success can never create a remote acknowledgement or a terminal business state without declared evidence.
- A timeout after a possible send is outcome-unknown until reconciled, and unsafe automatic retry is prohibited.
- Domain handoff is idempotent and can never bypass domain business or authorization gates.
- Duplicate and out-of-order events stay auditable and never overwrite a newer source version.
- Manual replay, resend, and remap reference exact object, mapping, and policy versions and require a reason; high-risk policy enforces approval.
- Credential and consent validity is revalidated when an attempt begins, not only when it was queued.
- A dead letter retains its immutable failure input; operators cannot edit it into success.
- A poll or stream checkpoint advances only after the durable-processing policy is satisfied.
- Partial bulk success has row-level dispositions and can never be represented as whole-file success.
- Sensitive payload read is a capability independent of connector operation and administration.
- Retention and legal hold apply separately to payload, transport evidence, tokens, logs, and audit.
- Every mutation uses optimistic concurrency, and every command is idempotent.

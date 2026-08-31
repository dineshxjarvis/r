# Regulatory cases — service discovery, applications, case processing, decisions, and instruments

Domain rules: [`../../../features/regulatory-cases/application-and-case-spec.md`](../../../features/regulatory-cases/application-and-case-spec.md). Relational contract: [`../../../architecture/regulatory-case-data-model.md`](../../../architecture/regulatory-case-data-model.md). Conventions: [`../../README.md`](../../README.md).

A case is either **native** (Strata is the authoritative system, an authority is deciding inside it) or **federated** (an external system is authoritative and Strata mirrors it). `execution_mode` and `authoritative_system` are **mandatory and effective-dated** on every service version, and the distinction is enforced everywhere: a mirrored decision can never claim Strata as issuer, and a federated state can never be authored as native.

**Instrument conditions do not become obligations until compliance publication.** A granted clearance with 47 conditions creates nothing in the register until those conditions go through [`../documents/documents.md`](../documents/documents.md) and [`../documents/extractions.md`](../documents/extractions.md).

## Routes

| Route | Purpose |
|---|---|
| `GET /regulatory-service-versions` · `POST /regulatory-service-versions` · `POST /regulatory-service-versions/{id}/actions` | Stable service identity and immutable catalogue versions; `?view=current` replaces the service list |
| `GET /approval-assessments` · `POST /approval-assessments` · `POST /approval-assessments/{id}/actions` | "What approvals does this project need?" |
| `GET /applications` · `POST /applications` · `GET /applications/{id}` · `POST /applications/{id}/actions` | Applicant side |
| `GET /application-participants` · `POST /application-participants` · `POST /application-participants/{id}/actions` | Time-bounded representation |
| `GET /application-requirements` · `POST /application-requirements/{id}/actions` | Submit, review, reuse |
| `GET /application-content-versions` · `POST /application-content-versions` | Immutable typed content |
| `GET /regulatory-cases` · `POST /regulatory-cases` · `GET /regulatory-cases/{id}` · `POST /regulatory-cases/{id}/actions` | Native and federated cases |
| `GET /case-assignments` · `POST /case-assignments` · `POST /case-assignments/{id}/actions` | Authority participation |
| `GET /regulatory-query-rounds` · `POST /regulatory-query-rounds` · `POST /regulatory-query-rounds/{id}/actions` | Append-only query and response |
| `GET /case-events` · `POST /case-events` · `POST /case-events/{id}/actions` | Site visits, hearings, consultations |
| `GET /case-recommendations` · `POST /case-recommendations` · `POST /case-recommendations/{id}/actions` | Committee output with quorum |
| `GET /regulatory-decisions` · `POST /regulatory-decisions` · `POST /regulatory-decisions/{id}/actions` | Native decision or authority mirror |
| `GET /regulatory-instrument-versions` · `POST /regulatory-instrument-versions` | The permission and its immutable versions; `?view=current` returns one effective version per instrument |
| `GET /external-case-snapshots` · `POST /external-case-snapshots` | Federated provenance and freshness |
| `GET /regulatory-case-reconciliations` · `POST /regulatory-case-reconciliations/{id}/actions` | Local/external disagreement |

`POST /regulatory-cases/native` and `/external` are one route discriminated by `execution_mode`. `GET /regulatory-cases/health` is `GET /regulatory-cases?group_by=normalized_state,freshness&metrics=count`.

`GET /regulatory-services` is replaced by `GET /regulatory-service-versions?view=current`; `GET /regulatory-instruments` is replaced by `GET /regulatory-instrument-versions?view=current`. Each current view includes the stable identity reference. Posting a service version with no `service_id` atomically establishes the stable identity and its first version; later versions require `service_id`.

---

## POST /approval-assessments

**Auth:** `regulatory.assessment.run` on the subject. Answers *"which approvals does this project need?"* against a **frozen catalogue cut**, so the answer is reproducible.

```json
{
  "subject": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
  "project_description": "Capacity expansion from 70 to 82.5 Mtpa with a 240 ha lease extension",
  "input_facts": {
    "mine.mine_profile_code": "OPENCAST",
    "mine.minerals": ["COAL"],
    "project.rated_capacity_increase": { "value": "12500000.000", "unit": "TONNE_PER_YEAR" },
    "project.lease_area_increase": { "value": "240.000", "unit": "HECTARE" },
    "project.forest_land_involved": { "value": "18.400", "unit": "HECTARE" },
    "project.state_code": "IN-CG",
    "project.distance_to_protected_area_km": "11.4",
    "project.involves_resettlement": null
  },
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Assessment complete: 4 applicable, 1 indeterminate",
  "data": {
    "id": "rasm_01HZY1A2B3C4D5E6F7G8H9J0K0",
    "object": "approval_assessment",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMPLETED",
    "available_actions": ["REVIEW", "RERUN"],
    "subject": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "project_description": "Capacity expansion from 70 to 82.5 Mtpa with a 240 ha lease extension",
    "catalogue_cut": { "as_of": "2026-11-10T00:00:00Z", "service_version_count": 41, "cut_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3" },
    "input_fact_manifest": { "supplied_count": 8, "null_count": 1, "hash": "sha256:7d1a9c4e2f6b830d5ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c" },
    "items": [
      { "id": "rasi_01HZY2B3C4D5E6F7G8H9J0K1T0", "service": { "type": "regulatory_service", "id": "rsvc_01HZY3C4D5E6F7G8H9J0K1T2M0", "display": "Environmental Clearance (expansion)" }, "service_version_id": "rsvv_01HZY4D5E6F7G8H9J0K1T2M3N0", "authority": { "type": "regulatory_authority", "id": "auth_01HZXD4E5F6G7H8J9K0T1M2N30", "display": "MoEFCC" }, "outcome": "APPLICABLE", "confidence": "HIGH", "explanation": "Capacity increase of 12.5 Mtpa exceeds the 5 Mtpa Category A threshold for coal mining under the EIA Notification 2006 schedule item 1(a).", "missing_facts": [] },
      { "id": "rasi_01HZY5E6F7G8H9J0K1T2M3N400", "service": { "type": "regulatory_service", "id": "rsvc_01HZY6F7G8H9J0K1T2M3N405P0", "display": "Forest Clearance (Stage I)" }, "outcome": "APPLICABLE", "confidence": "HIGH", "explanation": "18.4 ha of forest land is involved.", "missing_facts": [] },
      { "id": "rasi_01HZY7G8H9J0K1T2M3N405P6Q0", "service": { "type": "regulatory_service", "id": "rsvc_01HZY8H9J0K1T2M3N405P6Q7R0", "display": "Wildlife Clearance (NBWL)" }, "outcome": "NOT_APPLICABLE", "confidence": "MEDIUM", "explanation": "Nearest protected area is 11.4 km, outside the 10 km eco-sensitive default. A site-specific ESZ notification could change this.", "missing_facts": [] },
      { "id": "rasi_01HZY9J0K1T2M3N405P6Q7R8S0", "service": { "type": "regulatory_service", "id": "rsvc_01HZYA0B1C2D3E4F5G6H7J8K90", "display": "R&R Plan approval" }, "outcome": "INDETERMINATE", "confidence": "LOW", "explanation": "Applicability depends on whether the lease extension displaces households. This was not supplied.", "missing_facts": [{ "fact": "project.involves_resettlement", "why_needed": "Determines whether the state R&R policy is engaged", "how_to_obtain": "Village-wise survey of the 240 ha extension footprint" }] }
    ],
    "summary": { "applicable": 2, "not_applicable": 1, "indeterminate": 1, "total_assessed": 41 },
    "reviewed_by_appointment_id": null,
    "created_at": "2026-11-10T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/approval-assessments/rasm_01HZY1A2B3C4D5E6F7G8H9J0K0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-11-10T10:00:04Z" }
}
```

`INDETERMINATE` names the **missing fact and how to obtain it**. A discovery tool that answers "not applicable" because a field was blank is worse than one that admits it does not know.

---

## POST /applications · content versions

**Auth:** `regulatory.application.manage` for the applicant organisation.

**Application content and submission are immutable.** A change creates a superseding version, never an edit.

```json
{
  "regulatory_service_version_id": "rsvv_01HZY4D5E6F7G8H9J0K1T2M3N0",
  "applicant_organization_id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0",
  "subject": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
  "project_reference": "GEV-EXP-2026",
  "from_assessment_item_id": "rasi_01HZY2B3C4D5E6F7G8H9J0K1T0",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Application created with 34 requirement instances",
  "data": {
    "id": "rapp_01HZYB1C2D3E4F5G6H7J8K9T00",
    "object": "application",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "DRAFT",
    "available_actions": ["ADD_PARTICIPANT", "SUBMIT_CONTENT", "WITHDRAW"],
    "regulatory_service_version": { "type": "regulatory_service_version", "id": "rsvv_01HZY4D5E6F7G8H9J0K1T2M3N0", "display": "Environmental Clearance (expansion), v4" },
    "authority": { "type": "regulatory_authority", "id": "auth_01HZXD4E5F6G7H8J9K0T1M2N30", "display": "MoEFCC" },
    "execution_mode": "FEDERATED",
    "authoritative_system": "PARIVESH",
    "applicant_organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "subject": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "project_reference": "GEV-EXP-2026",
    "requirement_summary": { "total": 34, "applicable": 31, "not_applicable": 3, "submitted": 0, "accepted": 0, "reusable_from_prior": 12 },
    "current_content_version_id": null,
    "participants": [],
    "created_at": "2026-11-12T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/applications/rapp_01HZYB1C2D3E4F5G6H7J8K9T00", "requirements": "/api/v1/application-requirements?filter[application_id]=rapp_01HZYB1C2D3E4F5G6H7J8K9T00" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-11-12T09:00:00Z", "effects": [ { "object": "application_requirement_instance", "count": 34, "change": "CREATED" } ] }
}
```

### Requirement reuse

```json
{
  "action": "REUSE",
  "expected_version": 1,
  "reason": "The 2024 approved mine plan already satisfies this requirement and remains current",
  "payload": { "reuse_source": { "type": "document_version", "id": "dv_01HZYC2D3E4F5G6H7J8K9T0M10" }, "prior_application_id": "rapp_01HZYD3E4F5G6H7J8K9T0M1N20" }
}
```

```json
{
  "success": true,
  "message": "Requirement marked for reuse; awaiting service-specific reuse review",
  "data": {
    "id": "arqi_01HZYE4F5G6H7J8K9T0M1N2030",
    "object": "application_requirement_instance",
    "version": 2,
    "state": "REUSE_PROPOSED",
    "requirement_definition": { "type": "requirement_definition", "id": "rqdf_01HZYF5G6H7J8K9T0M1N203P40", "display": "Approved mine plan" },
    "applicability": "APPLICABLE",
    "reuse": {
      "source": { "type": "document_version", "id": "dv_01HZYC2D3E4F5G6H7J8K9T0M10", "display": "Approved mine plan 2024, MoC/CBA/2024/0114" },
      "original_artifact_identity_retained": true,
      "prior_application_id": "rapp_01HZYD3E4F5G6H7J8K9T0M1N20",
      "reuse_review": { "required": true, "state": "PENDING", "reviewer_capability": "regulatory.requirement.review_reuse", "reason_required": true }
    },
    "available_actions": ["REVIEW_REUSE", "SUBMIT", "WITHDRAW_REUSE"]
  },
  "meta": { "action": "REUSE", "transition": { "from": "PENDING", "to": "REUSE_PROPOSED" }, "effects": [ { "object": "approval_request", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-11-14T10:00:00Z" }
}
```

A reused requirement **retains the original artefact's identity** and adds a service-specific reuse review. It is never copied into a fresh document with a new id — that would break the chain back to the approval that produced it.

---

## POST /regulatory-cases

**Auth:** `regulatory.case.create_native` for a native case, or the federated adapter principal for a mirrored one.

### Request — federated

```json
{
  "execution_mode": "FEDERATED",
  "authoritative_system": "PARIVESH",
  "regulatory_service_version_id": "rsvv_01HZY4D5E6F7G8H9J0K1T2M3N0",
  "application_id": "rapp_01HZYB1C2D3E4F5G6H7J8K9T00",
  "external_case_id": "IA/CG/CMIN/442118/2026",
  "initial_snapshot": {
    "source_system": "PARIVESH",
    "remote_state": "TOR_GRANTED",
    "observed_at": "2026-12-01T04:00:00Z",
    "payload_artifact_document_id": "doc_01HZYG6H7J8K9T0M1N203P4Q50",
    "payload_hash": "sha256:9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6"
  },
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Federated case mirrored",
  "data": {
    "id": "rcas_01HZYH7J8K9T0M1N203P4Q5R60",
    "object": "regulatory_case",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "UNDER_SCRUTINY",
    "available_actions": ["RECORD_SNAPSHOT", "RECONCILE", "LINK_RELATED_CASE"],
    "execution_mode": "FEDERATED",
    "authoritative_system": "PARIVESH",
    "authority": { "type": "regulatory_authority", "id": "auth_01HZXD4E5F6G7H8J9K0T1M2N30", "display": "MoEFCC" },
    "regulatory_service_version": { "type": "regulatory_service_version", "id": "rsvv_01HZY4D5E6F7G8H9J0K1T2M3N0", "display": "Environmental Clearance (expansion), v4" },
    "application": { "type": "application", "id": "rapp_01HZYB1C2D3E4F5G6H7J8K9T00", "display": "GEV-EXP-2026" },
    "local_case_id": "rcas_01HZYH7J8K9T0M1N203P4Q5R60",
    "external_case_id": "IA/CG/CMIN/442118/2026",
    "external_id_unique_per_system": true,
    "raw_state": "TOR_GRANTED",
    "normalized_state": "UNDER_SCRUTINY",
    "state_mapping": { "mapping_version": 5, "raw_value": "TOR_GRANTED", "normalized_value": "UNDER_SCRUTINY", "raw_semantics_retained": true, "note": "Terms of Reference granted; EIA study in progress. PARIVESH has no direct equivalent of UNDER_SCRUTINY." },
    "current_stage": { "stage_code": "TOR_TO_EIA", "display": "Post-ToR, EIA preparation" },
    "freshness": { "last_snapshot_at": "2026-12-01T04:00:00Z", "staleness": "PT0S", "max_acceptable_staleness": "P1D", "stale": false },
    "authorable_locally": false,
    "authorable_locally_reason": "authoritative_system is PARIVESH; local state authoring is refused for federated cases",
    "milestones": [],
    "exceptions": [],
    "created_at": "2026-12-01T04:05:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/regulatory-cases/rcas_01HZYH7J8K9T0M1N203P4Q5R60", "snapshots": "/api/v1/external-case-snapshots?filter[case_id]=rcas_01HZYH7J8K9T0M1N203P4Q5R60" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-12-01T04:05:00Z", "effects": [ { "object": "external_case_snapshot", "count": 1, "change": "CREATED" } ] }
}
```

**Raw external state and the normalised mapping version are retained together.** A future dispute about "what stage was it in on 1 December" has both the authority's own word and Strata's interpretation, plus the mapping version that connected them.

`authorable_locally: false` is stated on every federated case. `POST /regulatory-cases/{id}/actions` with a state transition returns `403 FORBIDDEN` with that reason.

### 409 — fuzzy external match

```json
{
  "success": false,
  "message": "A similar external case exists; automatic merge is not permitted",
  "error": {
    "code": "CONFLICT",
    "details": {
      "authoritative_system": "PARIVESH",
      "requested_external_case_id": "IA/CG/CMIN/442118/2026",
      "candidate_matches": [
        { "case_id": "rcas_01HZYJ8K9T0M1N203P4Q5R6S70", "external_case_id": "IA/CG/CMIN/442118/2026 ", "similarity": 0.99, "difference": "Trailing whitespace in the stored identifier" }
      ],
      "resolution": "Open a reconciliation case. Fuzzy identifier matches are never auto-merged."
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## POST /regulatory-query-rounds · actions

**Auth:** `regulatory.query.issue` for the authority; response needs applicant authority on the application.

Query rounds, items, and responses are **append-only**. **Partial acceptance cannot close remaining items.**

```json
{
  "success": true,
  "data": {
    "id": "rqrd_01HZYK9T0M1N203P4Q5R6S7T80",
    "object": "regulatory_query_round",
    "version": 3,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PARTIALLY_RESOLVED",
    "available_actions": ["SUBMIT_RESPONSE", "DECIDE_ITEM"],
    "case": { "type": "regulatory_case", "id": "rcas_01HZYH7J8K9T0M1N203P4Q5R60", "display": "IA/CG/CMIN/442118/2026" },
    "sequence": 2,
    "issued_at": "2027-02-10T00:00:00Z",
    "response_deadline_at": "2027-03-12T00:00:00Z",
    "items": [
      { "id": "rqit_01HZYT0M1N203P4Q5R6S7T8V90", "sequence": 1, "requirement_definition_id": "rqdf_01HZYM1N203P4Q5R6S7T8V9V00", "request_kind": "ADDITIONAL_STUDY", "text": "Submit a revised air-quality dispersion model incorporating the 82.5 Mtpa haulage profile.", "source_anchor": "eac_minutes_2027_02#para_14", "state": "ACCEPTED", "decision": { "outcome": "ACCEPTED", "decided_at": "2027-03-20T00:00:00Z", "decided_by_appointment_id": "app_01HZYN203P4Q5R6S7T8V9V0W10", "reason": "Model and inputs adequate" } },
      { "id": "rqit_01HZY03P4Q5R6S7T8V9V0W1X20", "sequence": 2, "requirement_definition_id": "rqdf_01HZYP4Q5R6S7T8V9V0W1X2Y30", "request_kind": "CLARIFICATION", "text": "Clarify the compensatory afforestation land bank identified for the 18.4 ha forest diversion.", "source_anchor": "eac_minutes_2027_02#para_17", "state": "RESPONDED", "decision": null },
      { "id": "rqit_01HZYQ5R6S7T8V9V0W1X2Y3Z40", "sequence": 3, "requirement_definition_id": null, "request_kind": "DOCUMENT", "text": "Furnish the district collector's certificate on absence of displacement.", "source_anchor": "eac_minutes_2027_02#para_19", "state": "OPEN", "decision": null }
    ],
    "item_summary": { "total": 3, "open": 1, "responded": 1, "accepted": 1, "rejected": 0 },
    "round_closable": false,
    "round_closable_reason": "1 item remains OPEN and 1 awaits decision. Partial acceptance does not close the round.",
    "response_packages": [
      { "id": "rqrp_01HZYR6S7T8V9V0W1X2Y3Z4A50", "version_number": 1, "submitted_at": "2027-03-08T00:00:00Z", "filing_package_id": "fpkg_01HZYS7T8V9V0W1X2Y3Z4A5B60", "covers_item_ids": ["rqit_01HZYT0M1N203P4Q5R6S7T8V90", "rqit_01HZY03P4Q5R6S7T8V9V0W1X20"], "receipt_reference": "PARIVESH-ACK-2027-114882" }
    ],
    "links": { "self": "/api/v1/regulatory-query-rounds/rqrd_01HZYK9T0M1N203P4Q5R6S7T80" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-03-21T09:00:00Z" }
}
```

---

## POST /case-recommendations

**Auth:** `regulatory.recommendation.record` for the committee secretariat.

A recommendation **cannot finalise without the configured quorum and conflict rules being satisfied**.

```json
{
  "success": true,
  "message": "Recommendation finalised",
  "data": {
    "id": "crec_01HZYT8V9V0W1X2Y3Z4A5B6C70",
    "object": "case_recommendation",
    "version": 2,
    "tenant_id": null,
    "state": "FINALISED",
    "available_actions": [],
    "case": { "type": "regulatory_case", "id": "rcas_01HZYH7J8K9T0M1N203P4Q5R60", "display": "IA/CG/CMIN/442118/2026" },
    "body": { "kind": "EXPERT_APPRAISAL_COMMITTEE", "display": "EAC (Coal Mining), MoEFCC", "meeting_reference": "EAC-COAL/2027/04/M-118" },
    "input_manifest": { "content_version_ids": ["acvr_01HZYV9V0W1X2Y3Z4A5B6C7D80"], "query_round_ids": ["rqrd_01HZYK9T0M1N203P4Q5R6S7T80"], "event_ids": ["cevt_01HZYV0W1X2Y3Z4A5B6C7D8E90"], "manifest_hash": "sha256:1a4f9c2e7b830d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8" },
    "quorum": { "required_members": 9, "present_members": 11, "voting_members": 10, "satisfied": true, "policy_version": 3 },
    "conflicts": [
      { "member_person_id": "per_01HZYW1X2Y3Z4A5B6C7D8E9F00", "declared": true, "detail": "Authored the 2019 EIA for the same lease", "recused": true, "recused_at": "2027-04-11T10:05:00Z", "counted_in_quorum": false }
    ],
    "conflict_policy_satisfied": true,
    "outcome": "RECOMMEND_GRANT_WITH_CONDITIONS",
    "conditions_proposed_count": 47,
    "signature_event_id": "sig_01HZYX2Y3Z4A5B6C7D8E9F0G10",
    "finalised_at": "2027-04-11T16:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/case-recommendations/crec_01HZYT8V9V0W1X2Y3Z4A5B6C70" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2027-04-11T16:00:00Z" }
}
```

A recused member is recorded, and explicitly **not counted in quorum**. Both facts matter, and a system that only stored the vote count would lose the second.

---

## POST /regulatory-decisions

**Auth:** `regulatory.decide` with current competent authority for a native decision; the federated adapter or `regulatory.mirror_decision` for a mirror.

### Request — mirrored decision

```json
{
  "case_id": "rcas_01HZYH7J8K9T0M1N203P4Q5R60",
  "decision_kind": "MIRROR",
  "outcome": "GRANTED_WITH_CONDITIONS",
  "authority_evidence": {
    "source_system": "PARIVESH",
    "external_decision_reference": "F.No. J-11015/122/2008-IA.II(M)",
    "decision_document_id": "doc_01HZYY3Z4A5B6C7D8E9F0G1H20",
    "decision_document_hash": "sha256:6f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "observed_at": "2027-05-02T06:00:00Z",
    "issued_by_authority_id": "auth_01HZXD4E5F6G7H8J9K0T1M2N30"
  },
  "effective_at": "2027-04-28T00:00:00Z",
  "conditions_document_version_id": "dv_01HZYZ4A5B6C7D8E9F0G1H2130",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Decision mirrored; instrument version created",
  "data": {
    "id": "rdec_01HZZ0A5B6C7D8E9F0G1H213J0",
    "object": "regulatory_decision",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "RECORDED",
    "available_actions": ["LINK_INSTRUMENT", "RECORD_APPEAL"],
    "case": { "type": "regulatory_case", "id": "rcas_01HZYH7J8K9T0M1N203P4Q5R60", "display": "IA/CG/CMIN/442118/2026" },
    "decision_kind": "MIRROR",
    "issuer": { "type": "regulatory_authority", "id": "auth_01HZXD4E5F6G7H8J9K0T1M2N30", "display": "MoEFCC" },
    "strata_claims_issuance": false,
    "outcome": "GRANTED_WITH_CONDITIONS",
    "reasons": null,
    "authority_evidence": { "source_system": "PARIVESH", "external_decision_reference": "F.No. J-11015/122/2008-IA.II(M)", "decision_document_id": "doc_01HZYY3Z4A5B6C7D8E9F0G1H20", "decision_document_hash": "sha256:6f2c8b1a…", "observed_at": "2027-05-02T06:00:00Z" },
    "quorum_evidence": null,
    "signature_event_id": null,
    "effective_at": "2027-04-28T00:00:00Z",
    "conditions_document_version_id": "dv_01HZYZ4A5B6C7D8E9F0G1H2130",
    "conditions_count": 47,
    "conditions_are_obligations": false,
    "conditions_note": "Conditions do not become obligations until published through the documents/compliance pipeline. 47 conditions are pending extraction review.",
    "recorded_at": "2027-05-02T06:05:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/regulatory-decisions/rdec_01HZZ0A5B6C7D8E9F0G1H213J0" }
  },
  "included": {
    "regulatory_instrument_version:rinv_01HZZ1B6C7D8E9F0G1H213J4K0": {
      "id": "rinv_01HZZ1B6C7D8E9F0G1H213J4K0",
      "object": "regulatory_instrument_version",
      "version": 1,
      "state": "ACTIVE",
      "instrument": { "type": "regulatory_instrument", "id": "rins_01HZZ2C7D8E9F0G1H213J4K5T0", "display": "Environmental Clearance, Gevra OCP" },
      "decision_id": "rdec_01HZZ0A5B6C7D8E9F0G1H213J0",
      "document_version_id": "dv_01HZYZ4A5B6C7D8E9F0G1H2130",
      "scope": { "subject": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" }, "capacity": { "value": "82500000.000", "unit": "TONNE_PER_YEAR" }, "geometry_version_id": "ggev_01HZZ3D8E9F0G1H213J4K5T6M0" },
      "valid_from": "2027-04-28T00:00:00Z",
      "valid_until": "2057-04-27T00:00:00Z",
      "supersedes_version_id": "rinv_01HZZ4E9F0G1H213J4K5T6M7N0"
    }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2027-05-02T06:05:00Z",
    "effects": [
      { "object": "regulatory_instrument_version", "count": 1, "change": "CREATED" },
      { "object": "regulatory_instrument_version", "id": "rinv_01HZZ4E9F0G1H213J4K5T6M7N0", "change": "SUPERSEDED" },
      { "object": "document", "count": 1, "change": "QUEUED_FOR_EXTRACTION", "note": "47 conditions await extraction review before any becomes an obligation" },
      { "object": "notification", "count": 8, "change": "CREATED" }
    ]
  }
}
```

`strata_claims_issuance: false` is stated on every mirror. Strata recorded what MoEFCC decided; Strata did not decide it, and the record refuses to blur that.

`conditions_are_obligations: false` with a count and a note is the honest state on day one of a clearance. Forty-seven conditions exist; none binds through this system until a human has reviewed each extraction.

### Appeal

```json
{
  "action": "RECORD_APPEAL",
  "expected_version": 1,
  "reason": "Appeal filed before the NGT against conditions 19 and 22",
  "payload": { "appeal_case_id": "rcas_01HZZ5F0G1H213J4K5T6M7N800", "relation_kind": "APPEAL", "stay_granted": false }
}
```

```json
{
  "success": true,
  "message": "Appeal linked; challenged decision unchanged",
  "data": {
    "id": "rdec_01HZZ0A5B6C7D8E9F0G1H213J0",
    "object": "regulatory_decision",
    "version": 2,
    "state": "RECORDED",
    "outcome": "GRANTED_WITH_CONDITIONS",
    "challenged_by": [{ "case_id": "rcas_01HZZ5F0G1H213J4K5T6M7N800", "relation_kind": "APPEAL", "stay_granted": false, "linked_at": "2027-06-14T00:00:00Z" }],
    "decision_altered_by_appeal": false,
    "instrument_effect": "UNCHANGED",
    "available_actions": ["LINK_INSTRUMENT", "RECORD_APPEAL"]
  },
  "meta": {
    "action": "RECORD_APPEAL",
    "transition": null,
    "effects": [ { "object": "case_relationship", "count": 1, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2027-06-14T09:00:00Z"
  }
}
```

**An appeal or review does not alter the challenged decision** without a separate stay or outcome relation. `decision_altered_by_appeal: false` and `instrument_effect: "UNCHANGED"` are returned explicitly — the clearance remains in force while the appeal is pending, unless a stay says otherwise.

---

## Invariants

- Published service versions are immutable and never overlap ambiguously for one jurisdiction/service precedence key.
- Execution mode and authoritative system are mandatory and effective-dated.
- Application content and submissions are immutable; changes create superseding versions and packages.
- Reused requirements retain the original artefact identity plus a service-specific reuse review.
- Applicant representation and authority case assignment are time-bounded and action-specific.
- Federated case state requires external snapshot provenance and freshness, and can never be authored as native.
- Raw external state and the normalised mapping version are retained together.
- Query rounds, items, and responses are append-only, and partial acceptance never closes remaining items.
- A recommendation cannot finalise without configured quorum and conflict rules, and recusals are recorded and excluded from quorum.
- A native decision requires current competent authority and the exact input/case manifest; a mirrored decision cannot claim Strata as issuer.
- Instrument conditions do not become obligations until compliance publication.
- An appeal or review never alters the challenged decision without a separate stay or outcome relation.
- External identifier correlation is unique per authoritative system and service, and fuzzy matches never auto-merge.
- Deletion is prohibited after submission or case creation; withdrawal, closure, and supersession preserve history.
- Applicant, internal-authority, and public projections apply field and artefact classification before query or export.

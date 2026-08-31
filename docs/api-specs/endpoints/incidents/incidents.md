# Incidents — intake, emergency command, statutory notice, investigation, and completion

Domain rules: [`../../../features/incidents/incident-and-emergency-spec.md`](../../../features/incidents/incident-and-emergency-spec.md). Relational contract: [`../../../architecture/incident-data-model.md`](../../../architecture/incident-data-model.md). Conventions: [`../../README.md`](../../README.md).

Occurrence time, device/source time, receipt time, and record time are **four separate facts** and every payload keeps them apart. Material correction is supersession or a compensating record, never destructive update — an original casualty count, report, or classification survives its own correction.

## Routes

| Route | Purpose |
|---|---|
| `GET /incident-reports` · `POST /incident-reports` · `GET /incident-reports/{id}` · `POST /incident-reports/{id}/actions` | Intake, before an incident exists |
| `GET /incidents` · `GET /incidents/{id}` · `POST /incidents/{id}/actions` · `GET /incidents/{id}/history` | The confirmed incident |
| `GET /incident-classifications` · `POST /incident-classifications` · `POST /incident-classifications/{id}/actions` | Multi-facet classification |
| `GET /incident-classification-overrides` · `POST /incident-classification-overrides` · `POST /incident-classification-overrides/{id}/actions` | Independent review of a downgrade |
| `GET /emergency-activations` · `POST /emergency-activations` · `POST /emergency-activations/{id}/actions` | Declaration, command, scene control, demobilisation |
| `GET /containment-actions` · `POST /containment-actions` · `POST /containment-actions/{id}/actions` | Instructions during response |
| `GET /incident-people` · `POST /incident-people` · `POST /incident-people/{id}/actions` | Involvement, casualty updates, next-of-kin contact |
| `GET /incident-notification-rules` · `POST /incident-notification-rules` · `POST /incident-notification-rules/{id}/actions` | Governed rule catalogue |
| `GET /incident-notification-obligations` · `POST /incident-notification-obligations/{id}/actions` | Prepare, sign, send, reconcile |
| `GET /incident-investigations` · `POST /incident-investigations` · `POST /incident-investigations/{id}/actions` | Commission through issue |
| `GET /safety-lessons` · `POST /safety-lessons` | Published learning |
| `GET /emergency-contact-routes` · `POST /emergency-contact-routes` · `POST /emergency-contact-routes/{id}/actions` | Reachability, tested not assumed |
| `GET /degraded-emergency-records` · `POST /degraded-emergency-records` · `POST /degraded-emergency-records/{id}/actions` | Offline continuity, reconciled on return |

There is **no `POST /incidents`.** An incident exists because a report was triaged into one. That keeps intake and confirmation separable, which is what makes a false alarm auditable.

---

## POST /incident-reports

**Auth:** `incident.report` on the target mine or location. Separately protected intake uses `incident.report_protected` — it limits reporter disclosure but **does not promise anonymity against every lawful process**, and the response says so rather than implying otherwise.

Idempotent on `(tenant_id, client_report_id)` for offline capture, and on `(source_system, source_reference)` for adapter ingestion. Neither collapses independent reporters into one row.

### Request

```json
{
  "client_report_id": "crpt_9c1a4b2e7d05f83b6a2e9d7c",
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "intake_channel": "MOBILE_APP",
  "reporter_visibility": "IDENTIFIED",
  "asserted_occurred_at": "2026-09-14T03:42:00Z",
  "occurred_time_lower": "2026-09-14T03:35:00Z",
  "occurred_time_upper": "2026-09-14T03:50:00Z",
  "summary": "Highwall slip on the north bench, approximately 300 cubic metres; one dumper trapped, operator self-evacuated",
  "summary_i18n": { "en": "Highwall slip on the north bench, approximately 300 cubic metres; one dumper trapped, operator self-evacuated", "hi": "उत्तरी बेंच पर हाईवॉल स्लिप, लगभग 300 घन मीटर; एक डम्पर फँसा, चालक स्वयं बाहर निकला" },
  "location": { "resource_type": "SUBUNIT", "resource_id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "geometry": { "type": "Point", "coordinates": [82.4841, 22.3358], "srid": 4326 } },
  "initial_people": [
    { "involvement_kind": "OPERATOR", "person_id": "per_01HZZ4E5F6G7H8J9K0T1M2N300", "identity_confidence": "CONFIRMED" },
    { "involvement_kind": "WITNESS", "person_id": null, "external_person_snapshot": { "name_reported": "unknown dozer operator, B shift" }, "identity_confidence": "UNKNOWN" }
  ],
  "evidence_ids": ["ev_01HZZ5F6G7H8J9K0T1M2N304P0"],
  "source_system": null,
  "source_reference": null,
  "extensions": {}
}
```

`occurred_time_lower` / `occurred_time_upper` express what the reporter can actually stand behind. A single asserted instant that nobody witnessed is a guess, and the model refuses to launder it into a fact.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Incident report received",
  "data": {
    "id": "irpt_01HZZ6G7H8J9K0T1M2N304P5Q0",
    "object": "incident_report",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "AWAITING_TRIAGE",
    "available_actions": ["TRIAGE", "LINK_TO_INCIDENT"],
    "client_report_id": "crpt_9c1a4b2e7d05f83b6a2e9d7c",
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "intake_channel": "MOBILE_APP",
    "reporter": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "reporter_visibility": "IDENTIFIED",
    "reporter_disclosure_note": null,
    "asserted_occurred_at": "2026-09-14T03:42:00Z",
    "occurred_time_lower": "2026-09-14T03:35:00Z",
    "occurred_time_upper": "2026-09-14T03:50:00Z",
    "received_at": "2026-09-14T03:47:12Z",
    "device_reported_at": "2026-09-14T03:46:58Z",
    "summary": "Highwall slip on the north bench, approximately 300 cubic metres; one dumper trapped, operator self-evacuated",
    "location": { "resource_type": "SUBUNIT", "resource": { "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "display": "Main Pit" }, "geometry": { "type": "Point", "coordinates": [82.4841, 22.3358], "srid": 4326 } },
    "source_system": null,
    "source_reference": null,
    "linked_incident_id": null,
    "disposition": null,
    "disposition_reason": null,
    "evidence_ids": ["ev_01HZZ5F6G7H8J9K0T1M2N304P0"],
    "created_at": "2026-09-14T03:47:12Z",
    "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "updated_at": "2026-09-14T03:47:12Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/incident-reports/irpt_01HZZ6G7H8J9K0T1M2N304P5Q0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T03:47:12Z", "effects": [ { "object": "notification", "count": 6, "change": "CREATED", "note": "Control room and duty manager, immediate channel" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

Under `reporter_visibility: "PROTECTED"`, `reporter` is `null` in the ordinary projection and `reporter_disclosure_note` reads: *"Reporter identity is restricted to holders of incident.read_sensitive with a logged purpose. This is not an assurance of anonymity against lawful process."*

### POST /incident-reports/{id}/actions

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `TRIAGE` | `incident.triage` on the report/mine | **required** | required | Confirms into a new incident, links to an existing one, or dispositions as not-an-incident |
| `LINK_TO_INCIDENT` | `incident.triage` | **required** | required | `incident_report_link` with kind `MERGE`/`RELATED` |
| `SPLIT` | `incident.triage` | **required** | required | One report describing two events becomes two incidents; the report row is never deleted |

```json
{
  "action": "TRIAGE",
  "expected_version": 1,
  "reason": "Confirmed by control room; slip verified on the north bench camera",
  "payload": {
    "disposition": "CONFIRMED_NEW_INCIDENT",
    "confirmed_occurred_at": "2026-09-14T03:41:00Z",
    "operational_severity": "MAJOR",
    "incident_summary": "Highwall slip, north bench, ~300 m³; one dumper buried to axle, no entrapment"
  }
}
```

```json
{
  "success": true,
  "message": "Report confirmed as incident INC-2026-0417",
  "data": {
    "id": "irpt_01HZZ6G7H8J9K0T1M2N304P5Q0",
    "object": "incident_report",
    "version": 2,
    "state": "CONFIRMED",
    "disposition": "CONFIRMED_NEW_INCIDENT",
    "disposition_reason": "Confirmed by control room; slip verified on the north bench camera",
    "linked_incident_id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
    "available_actions": []
  },
  "included": {
    "incident:inc_01HZZ7H8J9K0T1M2N304P5Q6R0": {
      "id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
      "object": "incident",
      "version": 1,
      "state": "OPEN",
      "reference_no": "INC-2026-0417",
      "confirmed_occurred_at": "2026-09-14T03:41:00Z",
      "operational_severity": "MAJOR",
      "emergency_state": "NONE",
      "notification_state": "EVALUATING",
      "investigation_state": "NOT_COMMISSIONED",
      "learning_state": "OPEN"
    }
  },
  "meta": {
    "action": "TRIAGE",
    "transition": { "from": "AWAITING_TRIAGE", "to": "CONFIRMED" },
    "effects": [
      { "object": "incident", "id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0", "change": "CREATED" },
      { "object": "incident_report_link", "count": 1, "change": "CREATED" },
      { "object": "incident_rule_evaluation", "count": 7, "change": "CREATED", "note": "Notification rule catalogue evaluated against the confirmed facts" },
      { "object": "incident_notification_obligation", "count": 2, "change": "CREATED" },
      { "object": "notification", "count": 11, "change": "CREATED" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T03:52:00Z"
  }
}
```

Triage runs the **whole notification rule catalogue** against the confirmed facts and materialises the obligations it produces. The clock on a statutory intimation starts at confirmation, not when somebody remembers.

---

## GET /incidents/{id}

**Auth:** `incident.read_operational`. Casualty identity and detail require `incident.read_sensitive`; the published projection uses `incident.read_published`.

Query: `expand=classifications,people,emergency_activation,containment_actions,notification_obligations,investigations,completion_gates`, `as_of`.

### Response — 200 OK, `?expand=completion_gates,notification_obligations`

```json
{
  "success": true,
  "data": {
    "id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
    "object": "incident",
    "version": 14,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "RESPONSE_COMPLETE",
    "available_actions": ["COMMISSION_INVESTIGATION", "COMPLETE"],
    "reference_no": "INC-2026-0417",
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "confirmed_occurred_at": "2026-09-14T03:41:00Z",
    "location": { "resource_type": "SUBUNIT", "resource": { "type": "mine_subunit", "id": "sub_01HZY8B9C0D1E2F3G4H5J6K7T0", "display": "Main Pit" }, "geometry_version_id": "gv_01HZZ8J9K0T1M2N304P5Q6R7S0" },
    "summary": "Highwall slip, north bench, ~300 m³; one dumper buried to axle, no entrapment",
    "operational_severity": "MAJOR",
    "status": "RESPONSE_COMPLETE",
    "emergency_state": "DEMOBILIZED",
    "notification_state": "ACKNOWLEDGED",
    "investigation_state": "IN_PROGRESS",
    "learning_state": "OPEN",
    "classifications": [
      { "classification_kind": "EVENT_TYPE", "effective_value": "GROUND_MOVEMENT", "asserted_value": "GROUND_MOVEMENT", "decided_at": "2026-09-14T04:10:00Z" },
      { "classification_kind": "STATUTORY_REPORTABILITY", "effective_value": "REPORTABLE_DGMS", "asserted_value": "REPORTABLE_DGMS", "rule_version_id": "inrv_01HZZ9K0T1M2N304P5Q6R7S8T0", "decided_at": "2026-09-14T03:52:00Z" },
      { "classification_kind": "CONSEQUENCE", "effective_value": "PROPERTY_DAMAGE_NO_INJURY", "asserted_value": "PROPERTY_DAMAGE_NO_INJURY", "decided_at": "2026-09-14T06:00:00Z" }
    ],
    "notification_obligations": [
      { "id": "inob_01HZZA0B1C2D3E4F5G6H7J8K90", "recipient_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" }, "rule_key": "DGMS_IMMEDIATE_INTIMATION", "due_at": "2026-09-14T07:41:00Z", "state": "ACKNOWLEDGED", "signed_at": "2026-09-14T04:22:00Z", "acknowledged_at": "2026-09-14T05:03:00Z" },
      { "id": "inob_01HZZB1C2D3E4F5G6H7J8K9T00", "recipient_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" }, "rule_key": "DGMS_FORM_IV_RETURN", "due_at": "2026-09-21T03:41:00Z", "state": "PREPARED", "signed_at": null, "acknowledged_at": null }
    ],
    "completion_gates": {
      "emergency": { "satisfied": true, "detail": "Demobilised 2026-09-14T09:40:00Z" },
      "muster": { "satisfied": true, "detail": "Muster session mus_01HZZC2D3E4F5G6H7J8K9T0M10 reconciled, 412 of 412 accounted" },
      "notification": { "satisfied": false, "detail": "1 of 2 obligations not yet sent", "blocking": ["inob_01HZZB1C2D3E4F5G6H7J8K9T00"] },
      "containment": { "satisfied": true, "detail": "4 of 4 containment actions completed or transferred to CAPA" },
      "investigation": { "satisfied": false, "detail": "Investigation inv_01HZZD3E4F5G6H7J8K9T0M1N20 not yet issued", "blocking": ["inv_01HZZD3E4F5G6H7J8K9T0M1N20"] },
      "learning": { "satisfied": false, "detail": "No safety lesson published; learning_state remains OPEN" },
      "overall": false,
      "projection_rebuilt_at": "2026-09-20T12:00:00Z"
    },
    "counts": { "reports": 3, "people": 5, "casualties": 0, "containment_actions": 4, "notification_obligations": 2, "investigations": 1 },
    "completed_at": null,
    "created_at": "2026-09-14T03:52:00Z",
    "updated_at": "2026-09-20T12:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/incidents/inc_01HZZ7H8J9K0T1M2N304P5Q6R0", "history": "/api/v1/incidents/inc_01HZZ7H8J9K0T1M2N304P5Q6R0/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-20T12:05:00Z" }
}
```

Five state fields, not one. `emergency_state`, `notification_state`, `investigation_state`, and `learning_state` move independently, because the emergency ends hours after the event, the statutory notice days after that, and the learning months later. Collapsing them into a single status is how "the incident is closed" comes to mean nothing.

`completion_gates` is a **rebuildable projection**. It cannot be written directly.

---

## GET /incidents

Filters: `mine_id`, `status`, `operational_severity`, `emergency_state`, `notification_state`, `investigation_state`, `learning_state`, `filter[confirmed_occurred_at][gte]`, `filter[classification.effective_value]`, `filter[reportable]=true`, `filter[notification_overdue]=true`, `filter[has_casualty]=true`, `q`, `as_of`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
      "object": "incident",
      "version": 14,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "RESPONSE_COMPLETE",
      "reference_no": "INC-2026-0417",
      "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "confirmed_occurred_at": "2026-09-14T03:41:00Z",
      "summary": "Highwall slip, north bench, ~300 m³; one dumper buried to axle, no entrapment",
      "operational_severity": "MAJOR",
      "emergency_state": "DEMOBILIZED",
      "notification_state": "ACKNOWLEDGED",
      "investigation_state": "IN_PROGRESS",
      "learning_state": "OPEN",
      "counts": { "casualties": 0, "notification_obligations": 2 },
      "links": { "self": "/api/v1/incidents/inc_01HZZ7H8J9K0T1M2N304P5Q6R0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-20T12:05:00Z" }
}
```

---

## POST /incident-classifications · classification overrides

**Auth:** `incident.classify`. Classification is **multi-facet** — event type, statutory reportability, consequence, energy source — never one incident-type enum.

```json
{
  "incident_id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
  "classification_kind": "CONSEQUENCE",
  "asserted_value": "PROPERTY_DAMAGE_NO_INJURY",
  "taxonomy_term_id": "tax_01HZZE4F5G6H7J8K9T0M1N2030",
  "reason": "Operator self-evacuated before the slip reached the cab; medical check clear",
  "supersedes_id": null,
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Classification recorded",
  "data": {
    "id": "incl_01HZZF5G6H7J8K9T0M1N203P40",
    "object": "incident_classification",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "EFFECTIVE",
    "available_actions": ["SUPERSEDE"],
    "incident_id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
    "classification_kind": "CONSEQUENCE",
    "asserted_value": "PROPERTY_DAMAGE_NO_INJURY",
    "effective_value": "PROPERTY_DAMAGE_NO_INJURY",
    "taxonomy_term_id": "tax_01HZZE4F5G6H7J8K9T0M1N2030",
    "rule_version_id": null,
    "decided_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "decided_by_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "decided_at": "2026-09-14T06:00:00Z",
    "supersedes_id": null,
    "reason": "Operator self-evacuated before the slip reached the cab; medical check clear",
    "requires_independent_review": false,
    "extensions": {},
    "links": { "self": "/api/v1/incident-classifications/incl_01HZZF5G6H7J8K9T0M1N203P40" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T06:00:00Z", "effects": [ { "object": "incident_rule_evaluation", "count": 7, "change": "CREATED", "note": "Notification obligations re-evaluated against the new facts" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

A **downgrade** of `STATUTORY_REPORTABILITY` does not take effect on assertion. It creates an `incident_classification_override` in `PROPOSED`, and the effective value stays at the higher classification until an independent reviewer decides:

```json
{
  "action": "DECIDE",
  "expected_version": 1,
  "reason": "Slip volume re-surveyed at 180 m³, below the Reg. 199(1)(c) threshold; downgrade accepted",
  "payload": { "decision": "APPROVED" },
  "supporting_authority": { "appointment_id": "app_01HZZG6H7J8K9T0M1N203P4Q50", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

```json
{
  "success": true,
  "message": "Downgrade approved",
  "data": {
    "id": "inov_01HZZH7J8K9T0M1N203P4Q5R60",
    "object": "incident_classification_override",
    "version": 2,
    "state": "APPROVED",
    "incident_id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
    "prior_result": "REPORTABLE_DGMS",
    "proposed_result": "NOT_REPORTABLE",
    "decision": "APPROVED",
    "proposed_by_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "reviewed_by_appointment_id": "app_01HZZG6H7J8K9T0M1N203P4Q50",
    "independence_satisfied": true,
    "decided_at": "2026-09-15T10:00:00Z",
    "available_actions": []
  },
  "meta": {
    "action": "DECIDE",
    "transition": { "from": "PROPOSED", "to": "APPROVED" },
    "effects": [
      { "object": "incident_classification", "count": 1, "change": "CREATED", "note": "New effective value, superseding the prior row" },
      { "object": "incident_notification_obligation", "count": 1, "change": "STATE", "to": "WITHDRAWN", "note": "Obligation retained with its originating evaluation and facts snapshot" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-15T10:00:00Z"
  }
}
```

A withdrawn obligation is **retained**, together with the rule evaluation and facts snapshot that created it. "We decided later it wasn't reportable" is a defensible position only if the record shows what was believed at the time.

---

## POST /emergency-activations · actions

**Auth:** `emergency.activate`. **Reporting endpoints stay available even when authorization resolution is degraded**, under the approved emergency continuity policy.

```json
{
  "incident_id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
  "emergency_plan_version_id": "epv_01HZZJ8K9T0M1N203P4Q5R6S70",
  "declared_at": "2026-09-14T03:53:00Z",
  "area_snapshot": { "geometry": { "type": "Polygon", "coordinates": [[[82.4820, 22.3340], [82.4870, 22.3340], [82.4870, 22.3375], [82.4820, 22.3375], [82.4820, 22.3340]]], "srid": 4326 }, "affected_subunit_ids": ["sub_01HZY8B9C0D1E2F3G4H5J6K7T0"], "estimated_persons_in_area": 47 },
  "initial_commander_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Emergency activated; command assumed",
  "data": {
    "id": "emac_01HZZK9T0M1N203P4Q5R6S7T80",
    "object": "emergency_activation",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["ASSUME_COMMAND", "TRANSITION", "CONTROL_SCENE"],
    "incident": { "type": "incident", "id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0", "display": "INC-2026-0417" },
    "emergency_plan_version": { "type": "emergency_plan_version", "id": "epv_01HZZJ8K9T0M1N203P4Q5R6S70", "display": "Gevra emergency plan v7" },
    "declared_at": "2026-09-14T03:53:00Z",
    "declared_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "declared_by_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "area_snapshot": { "geometry": { "type": "Polygon", "coordinates": [[[82.4820, 22.3340], [82.4870, 22.3340], [82.4870, 22.3375], [82.4820, 22.3375], [82.4820, 22.3340]]], "srid": 4326 }, "affected_subunit_ids": ["sub_01HZY8B9C0D1E2F3G4H5J6K7T0"], "estimated_persons_in_area": 47 },
    "state_history": [{ "state": "ACTIVE", "at": "2026-09-14T03:53:00Z" }],
    "controlled_at": null,
    "demobilized_at": null,
    "current_command": {
      "id": "cmda_01HZZT0M1N203P4Q5R6S7T8V90",
      "commander": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
      "commander_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
      "assumed_at": "2026-09-14T03:53:00Z",
      "relieved_at": null,
      "source_route_resolution_id": "rres_01HZZM1N203P4Q5R6S7T8V9V00"
    },
    "muster_session_id": "mus_01HZZC2D3E4F5G6H7J8K9T0M10",
    "created_at": "2026-09-14T03:53:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/emergency-activations/emac_01HZZK9T0M1N203P4Q5R6S7T80" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T03:53:00Z", "effects": [ { "object": "command_assignment", "count": 1, "change": "CREATED" }, { "object": "muster_session", "id": "mus_01HZZC2D3E4F5G6H7J8K9T0M10", "change": "CREATED", "note": "Emergency muster opened in the attendance domain" }, { "object": "notification", "count": 47, "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

### Emergency action vocabulary

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `ASSUME_COMMAND` | `emergency.command`, or `emergency.handover` for a relief | **required** on handover | required | New `command_assignment`; overlapping active commanders are refused unless the plan allows unified command |
| `TRANSITION` | `emergency.command` for `STABILIZING`/`CONTROLLED`; `emergency.demobilize` for `DEMOBILIZED` | **required** | required | State move with timestamps |
| `CONTROL_SCENE` | `emergency.command` | **required** | required | Scene control hold over a zone or geometry |
| `RELEASE_SCENE` | `emergency.command` | **required** | required | Refused while an evidence or legal hold is active, unless an authorised resolution is supplied |

```json
{
  "action": "ASSUME_COMMAND",
  "expected_version": 3,
  "reason": "Night shift handover; incoming Mine Manager takes command",
  "payload": { "commander_appointment_id": "app_01HZZN203P4Q5R6S7T8V9V0W10", "handover_note": "Slip toe stable since 05:20. Two dozers on standby. DGMS intimation sent and acknowledged. Muster complete." }
}
```

```json
{
  "success": true,
  "message": "Command assumed",
  "data": {
    "id": "emac_01HZZK9T0M1N203P4Q5R6S7T80",
    "object": "emergency_activation",
    "version": 4,
    "state": "ACTIVE",
    "current_command": {
      "id": "cmda_01HZZ03P4Q5R6S7T8V9V0W1X20",
      "commander": { "type": "person", "id": "per_01HZZP4Q5R6S7T8V9V0W1X2Y30", "display": "D. Kujur" },
      "commander_appointment_id": "app_01HZZN203P4Q5R6S7T8V9V0W10",
      "assumed_at": "2026-09-14T06:00:00Z",
      "relieved_at": null,
      "supersedes_id": "cmda_01HZZT0M1N203P4Q5R6S7T8V90",
      "handover_note": "Slip toe stable since 05:20. Two dozers on standby. DGMS intimation sent and acknowledged. Muster complete.",
      "appointment_valid_at_assumption": true
    },
    "available_actions": ["ASSUME_COMMAND", "TRANSITION", "CONTROL_SCENE"]
  },
  "meta": {
    "action": "ASSUME_COMMAND",
    "transition": null,
    "effects": [
      { "object": "command_assignment", "count": 1, "change": "CREATED" },
      { "object": "command_assignment", "id": "cmda_01HZZT0M1N203P4Q5R6S7T8V90", "change": "relieved_at", "to": "2026-09-14T06:00:00Z" },
      { "object": "notification", "count": 9, "change": "CREATED" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T06:00:00Z"
  }
}
```

A command assignment cannot point at an appointment that had expired at assumption time — `422 UNPROCESSABLE` with `details.appointment_valid_until`. There is never a gap where nobody is in command and never a moment where two people both are, unless the plan version explicitly permits unified command.

### RELEASE_SCENE — 409 hold active

```json
{
  "success": false,
  "message": "Scene cannot be released while an evidence hold is active",
  "error": {
    "code": "INVALID_STATE",
    "details": {
      "scene_control_id": "iscc_01HZZQ5R6S7T8V9V0W1X2Y3Z40",
      "hold_state": "EVIDENCE_HOLD",
      "held_by": { "type": "incident_investigation", "id": "inv_01HZZD3E4F5G6H7J8K9T0M1N20", "display": "Internal investigation, INC-2026-0417" },
      "resolution": "Obtain a release from the investigation, or record an authorised override with reason"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## POST /containment-actions · actions

**Auth:** `incident.containment.assign` to create; `incident.containment.update` to record events.

```json
{
  "incident_id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
  "target": { "type": "asset", "id": "ast_01HZZR6S7T8V9V0W1X2Y3Z4A50" },
  "instruction": "Barricade the north bench crest for 120m either side of the slip and post a watchman until the geotechnical survey is complete",
  "priority": "IMMEDIATE",
  "assigned_post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0",
  "due_at": "2026-09-14T05:00:00Z",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Containment action assigned",
  "data": {
    "id": "cont_01HZZS7T8V9V0W1X2Y3Z4A5B60",
    "object": "containment_action",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ASSIGNED",
    "available_actions": ["START", "COMPLETE", "TRANSFER_TO_CAPA", "RECORD_EVENT"],
    "incident": { "type": "incident", "id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0", "display": "INC-2026-0417" },
    "target": { "type": "asset", "id": "ast_01HZZR6S7T8V9V0W1X2Y3Z4A50", "display": "North bench crest, chainage 0.9–1.1 km" },
    "instruction": "Barricade the north bench crest for 120m either side of the slip and post a watchman until the geotechnical survey is complete",
    "priority": "IMMEDIATE",
    "assigned_post": { "type": "post", "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "display": "Safety Officer, Gevra OCP" },
    "status": "ASSIGNED",
    "due_at": "2026-09-14T05:00:00Z",
    "started_at": null,
    "completed_at": null,
    "transferred_capa_id": null,
    "events": [],
    "created_at": "2026-09-14T04:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/containment-actions/cont_01HZZS7T8V9V0W1X2Y3Z4A5B60" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T04:00:00Z" }
}
```

`TRANSFER_TO_CAPA` is the bridge out of emergency response into ordinary compliance. A barricade is containment; rebuilding the bench to a safe angle is a CAPA, and the transfer records which became which:

```json
{
  "action": "TRANSFER_TO_CAPA",
  "expected_version": 3,
  "reason": "Immediate barricading complete; the permanent bench re-profiling is long-term work and moves to the CAPA register",
  "payload": { "finding_id": "find_01HZZT8V9V0W1X2Y3Z4A5B6C70", "corrective_action": "Re-profile the north bench to 38° across the 240m affected section", "due_on": "2026-11-30" }
}
```

```json
{
  "success": true,
  "message": "Containment transferred to CAPA",
  "data": {
    "id": "cont_01HZZS7T8V9V0W1X2Y3Z4A5B60",
    "object": "containment_action",
    "version": 4,
    "state": "TRANSFERRED",
    "status": "TRANSFERRED",
    "completed_at": "2026-09-14T08:30:00Z",
    "transferred_capa_id": "capa_01HZZV9V0W1X2Y3Z4A5B6C7D80",
    "available_actions": []
  },
  "meta": {
    "action": "TRANSFER_TO_CAPA",
    "transition": { "from": "IN_PROGRESS", "to": "TRANSFERRED" },
    "effects": [
      { "object": "capa", "id": "capa_01HZZV9V0W1X2Y3Z4A5B6C7D80", "change": "CREATED" },
      { "object": "incident_action_link", "count": 1, "change": "CREATED" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T08:30:00Z"
  }
}
```

---

## POST /incident-people/{id}/actions

**Auth:** `incident.casualty.record` for casualty updates; `incident.casualty.verify` plus a sensitive-data purpose **and** the configured welfare-communication assignment for family contact.

```json
{
  "action": "RECORD_CASUALTY_UPDATE",
  "expected_version": 2,
  "reason": "Hospital confirmed fracture; work capacity assessment updated",
  "payload": {
    "consequence_kind": "SERIOUS_BODILY_INJURY",
    "effective_at": "2026-09-14T11:00:00Z",
    "work_capacity_effect": "UNFIT_FOR_DUTY",
    "expected_absence": "P42D",
    "medical_source_reference": "AIIMS-BSP/EMG/2026/8841",
    "supersedes_id": "casu_01HZZV0W1X2Y3Z4A5B6C7D8E90"
  }
}
```

```json
{
  "success": true,
  "message": "Casualty update recorded",
  "data": {
    "id": "inpr_01HZZW1X2Y3Z4A5B6C7D8E9F00",
    "object": "incident_person",
    "version": 3,
    "state": "CASUALTY",
    "incident_id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
    "person": { "type": "person", "id": "per_01HZZ4E5F6G7H8J9K0T1M2N300", "display": "[restricted]" },
    "involvement_kind": "OPERATOR",
    "identity_confidence": "CONFIRMED",
    "current_consequence": "SERIOUS_BODILY_INJURY",
    "casualty_updates": [
      { "id": "casu_01HZZV0W1X2Y3Z4A5B6C7D8E90", "consequence_kind": "MINOR_INJURY", "effective_at": "2026-09-14T04:30:00Z", "recorded_at": "2026-09-14T04:35:00Z", "superseded_by_id": "casu_01HZZX2Y3Z4A5B6C7D8E9F0G10" },
      { "id": "casu_01HZZX2Y3Z4A5B6C7D8E9F0G10", "consequence_kind": "SERIOUS_BODILY_INJURY", "effective_at": "2026-09-14T11:00:00Z", "recorded_at": "2026-09-14T11:20:00Z", "work_capacity_effect": "UNFIT_FOR_DUTY", "expected_absence": "P42D", "supersedes_id": "casu_01HZZV0W1X2Y3Z4A5B6C7D8E90" }
    ],
    "redacted_fields": ["person.display", "external_person_snapshot", "family_contact_task"],
    "available_actions": ["RECORD_CASUALTY_UPDATE"]
  },
  "meta": {
    "action": "RECORD_CASUALTY_UPDATE",
    "transition": null,
    "effects": [
      { "object": "casualty_update", "id": "casu_01HZZX2Y3Z4A5B6C7D8E9F0G10", "change": "CREATED" },
      { "object": "incident_rule_evaluation", "count": 7, "change": "CREATED", "note": "A serious bodily injury changes statutory reportability" },
      { "object": "incident_notification_obligation", "count": 1, "change": "CREATED", "note": "DGMS serious-injury notice now due" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T11:20:00Z"
  }
}
```

The earlier `MINOR_INJURY` row survives. An incident where the assessment worsened over eight hours is a normal incident; one where the record shows only the final state is an unverifiable one.

Family-contact details are **excluded from ordinary incident and notification projections entirely** — not merely redacted at field level, because the presence of a next-of-kin task is itself sensitive.

---

## POST /incident-notification-obligations/{id}/actions

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `PREPARE` | `incident.notification.prepare` | optional | required | Renders the form template; stores `prepared_payload_hash` |
| `SIGN` | `incident.notification.sign` plus the required signing assurance | optional | required | `signature_event`; freezes the payload |
| `SEND` | `incident.notification.send` | optional | required | One `incident_notification_attempt` per channel try |
| `RECORD_ACKNOWLEDGEMENT` | trusted adapter service, or `incident.notification.reconcile` for witnessed/manual reconciliation | **required** on manual | required | Acknowledgement row |
| `WITHDRAW` | `incident.notification.override_classification` | **required** | required | Only via an approved classification override |

**A transport attempt can never set `ACKNOWLEDGED` directly.** Delivery is something the sender observes; acknowledgement is something the recipient asserts. Conflating them is how an organisation convinces itself it notified a regulator that never heard.

### SEND

```json
{
  "action": "SEND",
  "expected_version": 3,
  "payload": { "channel": "AUTHORITY_PORTAL", "adapter_id": "adp_01HZZY2Z3A4B5C6D7E8F9G0H10" }
}
```

```json
{
  "success": true,
  "message": "Send attempted",
  "data": {
    "id": "inob_01HZZA0B1C2D3E4F5G6H7J8K90",
    "object": "incident_notification_obligation",
    "version": 4,
    "state": "SENT",
    "incident_id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
    "rule_key": "DGMS_IMMEDIATE_INTIMATION",
    "recipient_authority": { "type": "regulatory_authority", "id": "auth_01HZXA1B2C3D4E5F6G7H8J9K00", "display": "DGMS" },
    "recipient_snapshot": { "authority_name": "DGMS, Bilaspur Region", "channel": "AUTHORITY_PORTAL", "destination_reference": "portal:dgms.gov.in/intimation", "captured_at": "2026-09-14T03:52:00Z" },
    "due_at": "2026-09-14T07:41:00Z",
    "state_history": [
      { "state": "DUE", "at": "2026-09-14T03:52:00Z" },
      { "state": "PREPARED", "at": "2026-09-14T04:15:00Z" },
      { "state": "SIGNED", "at": "2026-09-14T04:22:00Z" },
      { "state": "SENT", "at": "2026-09-14T04:24:00Z" }
    ],
    "prepared_payload_hash": "sha256:3c9e1a7f2b840d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8",
    "form_template_version": "DGMS_FORM_I_v3",
    "signer": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "signer_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "signed_at": "2026-09-14T04:22:00Z",
    "attempts": [
      { "id": "inat_01HZZZ3A4B5C6D7E8F9G0H1120", "channel": "AUTHORITY_PORTAL", "attempted_at": "2026-09-14T04:24:00Z", "adapter_id": "adp_01HZZY2Z3A4B5C6D7E8F9G0H10", "payload_hash": "sha256:3c9e1a7f2b840d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8", "transport_state": "DELIVERED", "transport_reference": "DGMS-PORTAL-ACK-778341", "failure_code": null, "next_retry_at": null }
    ],
    "acknowledgement": null,
    "acknowledged_at": null,
    "minutes_to_due_at_send": 197,
    "available_actions": ["SEND", "RECORD_ACKNOWLEDGEMENT"]
  },
  "meta": {
    "action": "SEND",
    "transition": { "from": "SIGNED", "to": "SENT" },
    "effects": [ { "object": "incident_notification_attempt", "id": "inat_01HZZZ3A4B5C6D7E8F9G0H1120", "change": "CREATED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T04:24:00Z"
  }
}
```

`transport_state: "DELIVERED"` and `state: "SENT"` — the obligation is still not `ACKNOWLEDGED`. That only happens when a recipient acknowledgement arrives:

```json
{
  "action": "RECORD_ACKNOWLEDGEMENT",
  "expected_version": 4,
  "payload": { "source": "AUTHORITY_PORTAL_CALLBACK", "external_reference": "DGMS/BSP/ACK/2026/1189", "acknowledgement_kind": "RECEIPT_CONFIRMED", "received_at": "2026-09-14T05:03:00Z", "payload_hash": "sha256:3c9e1a7f2b840d56ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c8" }
}
```

```json
{
  "success": true,
  "message": "Acknowledgement recorded",
  "data": {
    "id": "inob_01HZZA0B1C2D3E4F5G6H7J8K90",
    "object": "incident_notification_obligation",
    "version": 5,
    "state": "ACKNOWLEDGED",
    "acknowledgement": { "id": "inak_01HZZ0A4B5C6D7E8F9G0H112J0", "source": "AUTHORITY_PORTAL_CALLBACK", "external_reference": "DGMS/BSP/ACK/2026/1189", "acknowledgement_kind": "RECEIPT_CONFIRMED", "received_at": "2026-09-14T05:03:00Z", "verified_at": "2026-09-14T05:03:00Z", "payload_hash_matches": true },
    "acknowledged_at": "2026-09-14T05:03:00Z",
    "met_deadline": true,
    "margin_to_due": "PT2H38M",
    "available_actions": []
  },
  "meta": {
    "action": "RECORD_ACKNOWLEDGEMENT",
    "transition": { "from": "SENT", "to": "ACKNOWLEDGED" },
    "effects": [ { "object": "incident_notification_acknowledgement", "id": "inak_01HZZ0A4B5C6D7E8F9G0H112J0", "change": "CREATED" }, { "object": "incident", "id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0", "change": "notification_state", "to": "ACKNOWLEDGED" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-09-14T05:03:00Z"
  }
}
```

---

## POST /incident-investigations · actions

**Auth:** `incident.investigation.commission` to create; `incident.investigation.issue` to issue, with separation and conflict policy enforced.

```json
{
  "incident_id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
  "investigation_kind": "INTERNAL_BOARD",
  "terms_of_reference": "Establish the geotechnical and procedural causes of the north bench slip of 14 September 2026 and recommend controls.",
  "due_at": "2026-10-14T00:00:00Z",
  "members": [
    { "person_id": "per_01HZZ1B5C6D7E8F9G0H112J3K0", "appointment_id": "app_01HZZ2C6D7E8F9G0H112J3K4T0", "participation_role": "CHAIR", "conflict_declaration": { "declared": false, "detail": null } },
    { "person_id": "per_01HZZ3D7E8F9G0H112J3K4T5M0", "appointment_id": "app_01HZZ4E8F9G0H112J3K4T5M6N0", "participation_role": "GEOTECHNICAL_EXPERT", "conflict_declaration": { "declared": true, "detail": "Prepared the 2025 slope stability study for this bench" } }
  ],
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Investigation commissioned",
  "data": {
    "id": "inv_01HZZD3E4F5G6H7J8K9T0M1N20",
    "object": "incident_investigation",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "COMMISSIONED",
    "available_actions": ["ADD_MEMBER", "FREEZE_MANIFEST", "RECORD_CONCLUSION", "ISSUE"],
    "incident": { "type": "incident", "id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0", "display": "INC-2026-0417" },
    "investigation_kind": "INTERNAL_BOARD",
    "terms_of_reference": "Establish the geotechnical and procedural causes of the north bench slip of 14 September 2026 and recommend controls.",
    "commissioned_by": { "type": "person", "id": "per_01HZZ5F9G0H112J3K4T5M6N700", "display": "K. Bhagat" },
    "commissioned_by_appointment_id": "app_01HZZ6G0H112J3K4T5M6N708P0",
    "commissioned_at": "2026-09-15T09:00:00Z",
    "due_at": "2026-10-14T00:00:00Z",
    "members": [
      { "id": "invm_01HZZ7H112J3K4T5M6N708P9Q0", "person": { "type": "person", "id": "per_01HZZ1B5C6D7E8F9G0H112J3K0", "display": "V. Rao" }, "participation_role": "CHAIR", "joined_at": "2026-09-15T09:00:00Z", "left_at": null, "conflict_declaration": { "declared": false }, "recused_at": null },
      { "id": "invm_01HZZ8J2K3T4M5N607P8Q9R0S0", "person": { "type": "person", "id": "per_01HZZ3D7E8F9G0H112J3K4T5M0", "display": "T. Oraon" }, "participation_role": "GEOTECHNICAL_EXPERT", "joined_at": "2026-09-15T09:00:00Z", "left_at": null, "conflict_declaration": { "declared": true, "detail": "Prepared the 2025 slope stability study for this bench" }, "recused_at": null, "conflict_review_required": true }
    ],
    "evidence_manifests": [],
    "conclusions": [],
    "issued_report_document_id": null,
    "issued_at": null,
    "created_at": "2026-09-15T09:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/incident-investigations/inv_01HZZD3E4F5G6H7J8K9T0M1N20" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-15T09:00:00Z", "effects": [ { "object": "approval_request", "count": 1, "change": "CREATED", "note": "Declared conflict requires review before the member's conclusions count" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ] }
}
```

A declared conflict is **surfaced, not silently accepted**. `FREEZE_MANIFEST` hashes the evidence set the conclusions rest on, so a later dispute is about interpretation rather than about which photographs existed.

---

## POST /incidents/{id}/actions — COMPLETE

**Auth:** `incident.complete`.

```json
{
  "action": "COMPLETE",
  "expected_version": 19,
  "reason": "All statutory notices acknowledged, investigation issued, containment closed or transferred, and the safety lesson published",
  "payload": { "acknowledge_open_learning_items": true },
  "supporting_authority": { "appointment_id": "app_01HZZN203P4Q5R6S7T8V9V0W10", "mandate_assignment_id": null, "jurisdiction_assignment_id": null, "delegation_id": null, "break_glass_grant_id": null }
}
```

`incident.complete` **locks the incident, re-evaluates every gate transactionally**, and rejects if any critical exception is unowned.

```json
{
  "success": true,
  "message": "Incident completed; learning remains open",
  "data": {
    "id": "inc_01HZZ7H8J9K0T1M2N304P5Q6R0",
    "object": "incident",
    "version": 20,
    "state": "COMPLETED",
    "status": "COMPLETED",
    "emergency_state": "DEMOBILIZED",
    "notification_state": "ACKNOWLEDGED",
    "investigation_state": "ISSUED",
    "learning_state": "OPEN",
    "completed_at": "2026-10-20T10:00:00Z",
    "completion_gates": {
      "emergency": { "satisfied": true },
      "muster": { "satisfied": true },
      "notification": { "satisfied": true },
      "containment": { "satisfied": true },
      "investigation": { "satisfied": true },
      "learning": { "satisfied": false, "detail": "2 linked CAPAs remain open; learning_state stays OPEN by design" },
      "overall": true,
      "evaluated_at": "2026-10-20T10:00:00Z"
    },
    "open_learning_items": [
      { "type": "capa", "id": "capa_01HZZV9V0W1X2Y3Z4A5B6C7D80", "display": "Re-profile the north bench to 38°", "due_on": "2026-11-30" },
      { "type": "capa", "id": "capa_01HZZ9K3T4M5N607P8Q9R0S1T0", "display": "Revise the slope monitoring standard", "due_on": "2027-01-31" }
    ],
    "available_actions": ["REOPEN"]
  },
  "meta": {
    "action": "COMPLETE",
    "transition": { "from": "RESPONSE_COMPLETE", "to": "COMPLETED" },
    "effects": [
      { "object": "incident_completion_projection", "count": 1, "change": "REBUILT" },
      { "object": "notification", "count": 8, "change": "CREATED" },
      { "object": "audit_event", "count": 1, "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-10-20T10:00:00Z"
  }
}
```

**Long-term CAPAs may remain open after operational and statutory completion.** `learning_state` stays `OPEN` until the linked actions close, and the dashboard shows both — the incident is administratively finished and the organisation has not yet finished learning from it. Those are different claims and the API refuses to merge them.

### COMPLETE — 409 unowned exception

```json
{
  "success": false,
  "message": "Completion blocked by an unowned critical exception",
  "error": {
    "code": "INVALID_STATE",
    "details": {
      "failing_gates": ["notification", "investigation"],
      "blocking_references": [
        { "type": "incident_notification_obligation", "id": "inob_01HZZB1C2D3E4F5G6H7J8K9T00", "display": "DGMS Form IV return", "reason": "OVERDUE_NOT_SENT", "due_at": "2026-09-21T03:41:00Z" },
        { "type": "incident_investigation", "id": "inv_01HZZD3E4F5G6H7J8K9T0M1N20", "display": "Internal board", "reason": "NOT_ISSUED" }
      ],
      "unowned_exceptions": [
        { "kind": "OVERDUE_STATUTORY_NOTICE", "obligation_id": "inob_01HZZB1C2D3E4F5G6H7J8K9T00", "owner_post_id": null, "note": "Responsible post is vacant; unmanned responsibility unm_01HZZA1B2C3D4E5F6G7H8J9K00 is open" }
      ]
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

---

## Degraded operation

`POST /degraded-emergency-records` accepts commands captured while authorization resolution was unavailable. Unique on `(device_id, local_sequence)`, so replay is idempotent.

```json
{
  "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
  "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0",
  "device_id": "dev_ctrlroom_a1b2c3",
  "local_sequence": 118,
  "command_kind": "EMERGENCY_ACTIVATE",
  "payload": { "incident_summary": "Highwall slip, north bench", "declared_at_local": "2026-09-14T03:53:00Z" },
  "occurred_time_bounds": { "from": "2026-09-14T03:52:00Z", "to": "2026-09-14T03:55:00Z" },
  "actor_claim": { "person_id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "claimed_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0" },
  "witness_claim": { "person_id": "per_01HZZ1B5C6D7E8F9G0H112J3K0" },
  "device_signature": "ed25519:9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
  "continuity_policy_version": 3
}
```

```json
{
  "success": true,
  "message": "Degraded record accepted; awaiting reconciliation",
  "data": {
    "id": "degr_01HZZ0T4M5N607P8Q9R0S1T2V0",
    "object": "degraded_emergency_record",
    "version": 1,
    "state": "AWAITING_RECONCILIATION",
    "available_actions": ["RECONCILE"],
    "device_id": "dev_ctrlroom_a1b2c3",
    "local_sequence": 118,
    "command_kind": "EMERGENCY_ACTIVATE",
    "command_allowlisted": true,
    "occurred_time_bounds": { "from": "2026-09-14T03:52:00Z", "to": "2026-09-14T03:55:00Z" },
    "received_at": "2026-09-14T07:12:00Z",
    "actor_claim": { "person_id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "claimed_appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "verified": false },
    "witness_claim": { "person_id": "per_01HZZ1B5C6D7E8F9G0H112J3K0", "verified": false },
    "device_signature_valid": true,
    "continuity_policy_version": 3,
    "reconciliation_state": "PENDING",
    "reconciled_by_appointment_id": null,
    "links": { "self": "/api/v1/degraded-emergency-records/degr_01HZZ0T4M5N607P8Q9R0S1T2V0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T07:12:00Z" }
}
```

Only continuity-policy allowlisted commands are accepted from this path. A prohibited high-risk action arrives as `403 FORBIDDEN` with `details.allowlisted_commands`, not as a queued item — the degraded path is a narrow door, not a bypass.

---

## Invariants

- Occurrence, device, receipt, and record times are separate fields, and an unwitnessed occurrence carries bounds rather than a false instant.
- Offline and adapter idempotency never merge independent reporters into one report.
- A report is never deleted. Merge, link, and split are recorded as provenance.
- Classification is multi-facet and superseded, never overwritten; a reportability downgrade requires an independent reviewer.
- A notification obligation retains the rule evaluation and facts snapshot that created it, even after withdrawal.
- A transport attempt cannot set `ACKNOWLEDGED`. Delivery and acknowledgement are different claims.
- Command assignment cannot reference an expired appointment, and overlapping commanders are refused unless the plan permits unified command.
- Scene release cannot violate an active evidence or legal hold without an authorised, recorded resolution.
- Family-contact records are excluded from ordinary projections entirely.
- Completion locks and re-evaluates every gate transactionally; `learning_state` stays open while linked actions do.

# Workflow — notifications and receipt delegates

Tables: `notification`, `notification_delegate` (`data-model.md §4.6`). No dedicated ReBAC type — resolved via `resolved_person_id` (self) or `internal_viewer`/`can_configure` at the subject's mine for a supervisor's view. Conventions: [`../../README.md`](../../README.md). Domain rules: [`../../../features/workflow-spec.md`](../../../features/workflow-spec.md).

**There is no `POST /notifications`.** Every row is written by `resolve_responsible()` (`data-model.md §1.4`) as a side effect of an escalation elsewhere in the system — obligation overdue, appointment lapse, unmanned post, finding or defect ageing. This file is read plus acknowledge/action only.

## Routes

| Route | Purpose |
|---|---|
| `GET /notifications` · `GET /notifications/{id}` | Inbox, cursor-paginated |
| `POST /notifications/{id}/actions` | Acknowledge, mark actioned, snooze |
| `POST /notifications/actions` | Bulk acknowledge |
| `GET /notification-delegates` · `POST /notification-delegates` · `POST /notification-delegates/{id}/actions` | Receipt-only delegation |

`POST /posts/{id}/delegates` and `GET /posts/{id}/delegates` are `POST /notification-delegates` with `post_id` in the body and `GET /notification-delegates?filter[post_id]=post_01H…` — a delegate is a first-class record with its own lifecycle, not an array hanging off a post.

---

## GET /notifications/{id}

**Auth:** recipient self-read, or `notification.read` on the underlying subject.

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "id": "notif_01HZZTT8M9N0P1Q2R3S4T5V6V0",
    "object": "notification",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "DELIVERED",
    "available_actions": ["ACKNOWLEDGE", "MARK_ACTIONED", "SNOOZE"],
    "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
    "mine": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "target_post": { "type": "post", "id": "post_01HZY6E7F8G9H0J1K2T3M4N500", "display": "Environment Officer, Gevra OCP" },
    "resolved_person": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "resolved_via": { "type": "appointment", "id": "app_01HZY3B4C5D6E7F8G9H0J1K2T0", "role": "CURRENT_HOLDER" },
    "responsibility_route_id": "rrt_01HZYD3E4F5G6H7J8K9T0M1N20",
    "route_step": 1,
    "subject": { "type": "obligation_instance", "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00", "display": "Plantation over 40 hectares — FY 2026-27" },
    "subject_type": "OBLIGATION_INSTANCE",
    "subject_ref": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
    "reason_code": "OBLIGATION_DUE_SOON",
    "title": "Plantation obligation due in 14 days",
    "title_i18n": { "en": "Plantation obligation due in 14 days", "hi": "वृक्षारोपण दायित्व 14 दिनों में देय" },
    "body": "Obligation instance for FY 2026-27 is due on 2027-04-30. Four geotagged photos and one survey report are required.",
    "severity": "SIGNIFICANT",
    "channel": "IN_APP",
    "channels_attempted": [
      { "channel": "IN_APP", "status": "DELIVERED", "sent_at": "2026-08-30T00:05:02Z", "delivered_at": "2026-08-30T00:05:03Z" },
      { "channel": "PUSH", "status": "DELIVERED", "sent_at": "2026-08-30T00:05:02Z", "delivered_at": "2026-08-30T00:05:09Z" }
    ],
    "status": "DELIVERED",
    "requires_ack": true,
    "ack_due_at": "2026-08-31T00:05:00Z",
    "queued_at": "2026-08-30T00:05:00Z",
    "sent_at": "2026-08-30T00:05:02Z",
    "delivered_at": "2026-08-30T00:05:03Z",
    "read_at": null,
    "acknowledged_at": null,
    "acknowledged_by": null,
    "actioned_at": null,
    "actioned_by": null,
    "actioned_via": null,
    "snoozed_until": null,
    "failed_at": null,
    "failure_reason": null,
    "escalates_at": "2026-08-31T00:05:00Z",
    "created_at": "2026-08-30T00:05:00Z",
    "extensions": {},
    "links": {
      "self": "/api/v1/notifications/notif_01HZZTT8M9N0P1Q2R3S4T5V6V0",
      "subject": "/api/v1/obligation-instances/oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
      "route": "/api/v1/responsibility-routes/rrt_01HZYD3E4F5G6H7J8K9T0M1N20"
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T08:00:00Z" }
}
```

`resolved_person: null` means the escalation chain **exhausted before finding anyone**. Do not read that as "nobody needed to know" — look for the resulting `unmanned_responsibility` record via `subject_type: "UNMANNED_POST"` (`data-model.md §4.6`), and see [`../identity/responsibility-routes.md`](../identity/responsibility-routes.md).

---

## GET /notifications

**Auth:** defaults to the recipient's own inbox. Broader filters require `notification.read` on the relevant subjects.

**Cursor-paginated**, not page-based — an unbounded live-appended list where page numbers are meaningless against a stream.

### Query params

| Param | Example | Notes |
|---|---|---|
| `filter[status]` | `DELIVERED,SENT` | |
| `filter[subject_type]` | `OBLIGATION_INSTANCE,FINDING,CAPA,DEFECT,APPOINTMENT_LAPSE,UNMANNED_POST` | |
| `filter[subject_ref]` | `oi_01H…` | Every notification about one thing |
| `filter[requires_ack]` | `true` | |
| `filter[unacknowledged]` | `true` | `requires_ack` and no `acknowledged_at` |
| `filter[severity]` | `SEVERE` | |
| `filter[resolved_person_id]` | `per_01H…` | Supervisor view; needs `notification.read` |
| `filter[target_post_id]` | `post_01H…` | |
| `filter[ack_due_at][lte]` | `2026-08-31T00:00:00Z` | About to escalate |
| `filter[snoozed]` | `false` | Default excludes snoozed |
| `cursor` / `limit` | | |
| `group_by` + `metrics` | `group_by=subject_type,status&metrics=count` | |

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "notif_01HZZTT8M9N0P1Q2R3S4T5V6V0",
      "object": "notification",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "DELIVERED",
      "subject": { "type": "obligation_instance", "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00", "display": "Plantation over 40 hectares — FY 2026-27" },
      "subject_type": "OBLIGATION_INSTANCE",
      "subject_ref": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00",
      "reason_code": "OBLIGATION_DUE_SOON",
      "title": "Plantation obligation due in 14 days",
      "severity": "SIGNIFICANT",
      "status": "DELIVERED",
      "requires_ack": true,
      "ack_due_at": "2026-08-31T00:05:00Z",
      "queued_at": "2026-08-30T00:05:00Z",
      "links": { "self": "/api/v1/notifications/notif_01HZZTT8M9N0P1Q2R3S4T5V6V0" }
    }
  ],
  "pagination": { "next_cursor": "eyJxIjoiMjAyNi0wOC0zMFQwMDowNTowMFoiLCJpIjoibm90aWZfMDFIWlpMTDhNOU4wUDFRMlIzUzRUNVU2ViJ9", "has_more": true },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T08:00:00Z", "unread_count": 4, "unacknowledged_count": 2 }
}
```

---

## POST /notifications/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | State precondition | Effects |
|---|---|---|---|---|---|
| `ACKNOWLEDGE` | `notification.acknowledge` — resolved recipient or registered receipt-only delegate | optional | required | `SENT` or `DELIVERED` | `status = ACKNOWLEDGED`; stops the ack-escalation timer |
| `MARK_ACTIONED` | `notification.mark_actioned` | optional | required | `DELIVERED` or `ACKNOWLEDGED` | `status = ACTIONED` |
| `SNOOZE` | recipient self | **required** | required | `DELIVERED` or `ACKNOWLEDGED` | Hides until `snoozed_until`; never past `ack_due_at` |
| `MARK_READ` | recipient self | optional | no | any delivered state | Sets `read_at`; no status change |

### ACKNOWLEDGE

```json
{ "action": "ACKNOWLEDGE", "expected_version": 1, "payload": { "acknowledged_on_behalf_of_post_id": null } }
```

```json
{
  "success": true,
  "message": "Acknowledged",
  "data": {
    "id": "notif_01HZZTT8M9N0P1Q2R3S4T5V6V0",
    "object": "notification",
    "version": 2,
    "state": "ACKNOWLEDGED",
    "status": "ACKNOWLEDGED",
    "acknowledged_at": "2026-08-30T08:00:00Z",
    "acknowledged_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "acknowledged_as": "RESOLVED_RECIPIENT",
    "escalates_at": null,
    "available_actions": ["MARK_ACTIONED", "SNOOZE"]
  },
  "meta": {
    "action": "ACKNOWLEDGE",
    "transition": { "from": "DELIVERED", "to": "ACKNOWLEDGED" },
    "effects": [ { "object": "audit_event", "id": "aud_01HZZNN0P1Q2R3S4T5V6V7W8X0", "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T08:00:00Z"
  }
}
```

A delegate acknowledging returns `acknowledged_as: "NOTIFICATION_DELEGATE"` with `on_behalf_of_post`. The distinction is preserved because "the officer saw it" and "the officer's stand-in saw it" are not the same statement to a regulator.

### MARK_ACTIONED

Distinct from acknowledge — *"I saw this"* versus *"I did something about it"*. Usually **implicit**: the underlying domain action (`POST /capas/{id}/actions` with `ASSIGN`, say) marks its triggering notification actioned automatically. This route exists for cases with no single obvious downstream call.

**Marking a notification actioned never substitutes for the underlying domain command.**

```json
{ "action": "MARK_ACTIONED", "expected_version": 2, "payload": { "actioned_via": { "type": "obligation_instance", "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00", "action": "SUBMIT" }, "note": "Evidence submitted for verification" } }
```

```json
{
  "success": true,
  "message": "Marked actioned",
  "data": {
    "id": "notif_01HZZTT8M9N0P1Q2R3S4T5V6V0",
    "object": "notification",
    "version": 3,
    "state": "ACTIONED",
    "status": "ACTIONED",
    "actioned_at": "2026-08-30T08:05:00Z",
    "actioned_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "actioned_via": { "type": "obligation_instance", "id": "oi_01HZYX1Y2Z3A4B5C6D7E8F9G00", "action": "SUBMIT" },
    "available_actions": []
  },
  "meta": {
    "action": "MARK_ACTIONED",
    "transition": { "from": "ACKNOWLEDGED", "to": "ACTIONED" },
    "effects": [ { "object": "audit_event", "id": "aud_01HZZ001Q2R3S4T5V6V7W8X9Y0", "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T08:05:00Z"
  }
}
```

### SNOOZE

```json
{ "action": "SNOOZE", "expected_version": 2, "reason": "Site visit scheduled for 2 September; nothing actionable before then", "payload": { "snoozed_until": "2026-09-02T03:00:00Z" } }
```

```json
{
  "success": true,
  "message": "Snoozed until 2026-09-02T03:00:00Z",
  "data": {
    "id": "notif_01HZZTT8M9N0P1Q2R3S4T5V6V0",
    "object": "notification",
    "version": 3,
    "state": "ACKNOWLEDGED",
    "snoozed_until": "2026-09-02T03:00:00Z",
    "snooze_reason": "Site visit scheduled for 2 September; nothing actionable before then",
    "escalates_at": null,
    "available_actions": ["MARK_ACTIONED"]
  },
  "meta": { "action": "SNOOZE", "transition": null, "effects": [ { "object": "audit_event", "id": "aud_01HZZPP2R3S4T5V6V7W8X9Y0Z0", "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-08-30T08:06:00Z" }
}
```

`snoozed_until` is capped at `ack_due_at` — snoozing cannot outrun the escalation it would otherwise silence. A request past that point returns `422 UNPROCESSABLE` with `details.max_snooze_until`.

### Errors

| Status | Code | Condition |
|---|---|---|
| 409 | `INVALID_STATE` | `status` is not `SENT`/`DELIVERED` for `ACKNOWLEDGE` |
| 403 | `FORBIDDEN` | Caller is neither the resolved recipient nor a current registered delegate |
| 422 | `UNPROCESSABLE` | `snoozed_until` beyond `ack_due_at` |

---

## POST /notifications/actions

Bulk acknowledge across an inbox filter.

```json
{
  "action": "ACKNOWLEDGE",
  "filter": { "status": "DELIVERED", "severity": "MINOR", "subject_type": "OBLIGATION_INSTANCE" },
  "atomic": false
}
```

```json
{
  "success": true,
  "message": "12 of 12 acknowledged",
  "data": {
    "requested": 12,
    "succeeded": 12,
    "failed": 0,
    "results": [
      { "id": "notif_01HZZQQ3S4T5V6V7W8X9Y0Z1A0", "status": 200, "version": 2, "state": "ACKNOWLEDGED" },
      { "id": "notif_01HZZRR4T5V6V7W8X9Y0Z1A2B0", "status": 200, "version": 2, "state": "ACKNOWLEDGED" }
    ]
  },
  "meta": { "action": "ACKNOWLEDGE", "effects": [ { "object": "audit_event", "count": 12, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-08-30T08:10:00Z" }
}
```

Bulk `MARK_ACTIONED` is refused with `400 VALIDATION_ERROR` — claiming twelve things were acted on in one click is the exact rubber stamp the acknowledge/action split exists to prevent.

---

## POST /notification-delegates

**Auth:** the current post holder, or `notification.delegate.manage` on the post.

**Receipt only, never authority** (`workflow-spec.md §2.2`). A delegate never obtains a `Check()` outcome of any kind — only visibility and standing to acknowledge *on behalf of*. `resolve(post)` consults active delegates before escalating upward, once no current appointment holder exists.

### Request

```json
{
  "post_id": "post_01HZY6E7F8G9H0J1K2T3M4N500",
  "delegate_person_id": "per_01HZZVV5V6W7X8Y9Z0A1B2C3D0",
  "valid_from": "2026-09-01T00:00:00Z",
  "valid_until": "2026-09-14T00:00:00Z",
  "reason": "Annual leave, 1–14 September",
  "subject_types": ["OBLIGATION_INSTANCE", "CAPA"],
  "max_severity": "SIGNIFICANT",
  "extensions": {}
}
```

`subject_types` and `max_severity` narrow what the delegate receives. A `SEVERE` notification is not silently handed to a stand-in unless the delegation says so.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Delegate registered",
  "data": {
    "id": "nd_01HZZVV6W7X8Y9Z0A1B2C3D4E0",
    "object": "notification_delegate",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "PENDING",
    "available_actions": ["REVOKE", "AMEND"],
    "post": { "type": "post", "id": "post_01HZY6E7F8G9H0J1K2T3M4N500", "display": "Environment Officer, Gevra OCP" },
    "delegate": { "type": "person", "id": "per_01HZZVV5V6W7X8Y9Z0A1B2C3D0", "display": "N. Ekka" },
    "registered_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "valid_from": "2026-09-01T00:00:00Z",
    "valid_until": "2026-09-14T00:00:00Z",
    "reason": "Annual leave, 1–14 September",
    "subject_types": ["OBLIGATION_INSTANCE", "CAPA"],
    "max_severity": "SIGNIFICANT",
    "grants_domain_capability": false,
    "revoked_at": null,
    "created_at": "2026-08-30T12:15:00Z",
    "created_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "updated_at": "2026-08-30T12:15:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY0A1B2C3D4E5F6G7H8J9K0", "display": "P. Xess" },
    "extensions": {},
    "links": { "self": "/api/v1/notification-delegates/nd_01HZZVV6W7X8Y9Z0A1B2C3D4E0" }
  },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T12:15:00Z",
    "effects": [ { "object": "notification", "count": 1, "change": "CREATED", "note": "Delegate informed" }, { "object": "audit_event", "count": 1, "change": "CREATED" } ]
  }
}
```

`grants_domain_capability: false` is returned on **every** delegate record, always literally false. It is stated rather than implied so no client, and no reader of a screenshot, can mistake reach for authority.

---

## GET /notification-delegates · POST /notification-delegates/{id}/actions

**Auth:** `notification.read` or `notification.delegate.manage` on the post.

Filters: `post_id`, `delegate_person_id`, `state`, `as_of`, `filter[valid_until][lte]`.

Actions: `REVOKE` (reason and `expected_version` required) and `AMEND` (narrows `subject_types` or `max_severity`; widening requires the post holder, not the delegate).

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "nd_01HZZVV6W7X8Y9Z0A1B2C3D4E0",
      "object": "notification_delegate",
      "version": 1,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "ACTIVE",
      "post": { "type": "post", "id": "post_01HZY6E7F8G9H0J1K2T3M4N500", "display": "Environment Officer, Gevra OCP" },
      "delegate": { "type": "person", "id": "per_01HZZVV5V6W7X8Y9Z0A1B2C3D0", "display": "N. Ekka" },
      "valid_from": "2026-09-01T00:00:00Z",
      "valid_until": "2026-09-14T00:00:00Z",
      "reason": "Annual leave, 1–14 September",
      "subject_types": ["OBLIGATION_INSTANCE", "CAPA"],
      "max_severity": "SIGNIFICANT",
      "grants_domain_capability": false,
      "links": { "self": "/api/v1/notification-delegates/nd_01HZZVV6W7X8Y9Z0A1B2C3D4E0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-02T09:00:00Z" }
}
```

---

## Invariants

- Notifications are never created through the API. They are side effects of escalation, and the escalation is the record.
- Acknowledge and action are separate states, and bulk action is refused.
- A delegate receives and acknowledges. It never gains a domain capability, and every delegate record says so explicitly.
- Snoozing cannot outlast the acknowledgement deadline it would otherwise silence.
- `resolved_person: null` means the chain exhausted — look for the unmanned-responsibility record, never read it as "nobody needed to know".

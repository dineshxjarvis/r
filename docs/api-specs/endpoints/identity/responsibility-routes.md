# Identity — responsibility and notification routes

The filename deliberately avoids "role escalation": a route targets **concrete posts** and never escalates legal authority. It moves *work and notification* when a responsible post has no eligible current holder. It never grants an appointment, never substitutes an approver, and never unblocks a closure that needs a statutory office.

Conventions: [`../../README.md`](../../README.md). Related: [`posts.md`](posts.md), [`../workflow/notifications.md`](../workflow/notifications.md).

## Routes

| Route | Purpose |
|---|---|
| `GET /responsibility-routes` · `POST /responsibility-routes` | Versioned routing configuration |
| `GET /responsibility-routes/{id}` · `POST /responsibility-routes/{id}/actions` · `GET /responsibility-routes/{id}/history` | Lifecycle and resolution |

Route **resolution** — including dry-run testing — is `action: "RESOLVE"` on the route, not a separate endpoint.

---

## POST /responsibility-routes

**Auth:** `workflow.route.configure` on the owning tenant/organisation unit.

### Request

```json
{
  "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
  "applies_to": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
  "trigger_capability": "capa.assign",
  "trigger_conditions": { "severity_in": ["SIGNIFICANT", "SEVERE"], "overdue_days_gte": 0 },
  "steps": [
    { "sequence": 1, "target_post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "wait": "PT0M", "channels": ["IN_APP", "PUSH"] },
    { "sequence": 2, "target_post_id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "wait": "PT2H", "channels": ["IN_APP", "PUSH", "SMS"] },
    { "sequence": 3, "target_post_id": "post_01HZZ7H8J9K0T1M2N304P5Q6R0", "wait": "PT4H", "channels": ["IN_APP", "EMAIL", "SMS"] }
  ],
  "on_exhausted": "RAISE_UNMANNED_RESPONSIBILITY",
  "quiet_hours": { "from": "22:00", "to": "06:00", "timezone": "Asia/Kolkata", "override_for_severity": ["SEVERE"] },
  "effective_from": "2026-09-01T00:00:00Z",
  "extensions": {}
}
```

Every target is a **concrete post id**. A route cannot target a role string, a person, a group name, or a bare platform administrator; those are all `422 UNPROCESSABLE`. Cycle and scope validation run before creation.

### Response — 201 Created

```json
{
  "success": true,
  "message": "Responsibility route created",
  "data": {
    "id": "rrt_01HZYD3E4F5G6H7J8K9T0M1N20",
    "object": "responsibility_route",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["RESOLVE", "SUPERSEDE", "DEACTIVATE"],
    "applies_to": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
    "trigger_capability": "capa.assign",
    "trigger_conditions": { "severity_in": ["SIGNIFICANT", "SEVERE"], "overdue_days_gte": 0 },
    "steps": [
      { "sequence": 1, "target_post": { "type": "post", "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "display": "Safety Officer, Gevra OCP" }, "wait": "PT0M", "channels": ["IN_APP", "PUSH"] },
      { "sequence": 2, "target_post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" }, "wait": "PT2H", "channels": ["IN_APP", "PUSH", "SMS"] },
      { "sequence": 3, "target_post": { "type": "post", "id": "post_01HZZ7H8J9K0T1M2N304P5Q6R0", "display": "Area Safety Officer, Korba" }, "wait": "PT4H", "channels": ["IN_APP", "EMAIL", "SMS"] }
    ],
    "on_exhausted": "RAISE_UNMANNED_RESPONSIBILITY",
    "quiet_hours": { "from": "22:00", "to": "06:00", "timezone": "Asia/Kolkata", "override_for_severity": ["SEVERE"] },
    "route_version": 1,
    "effective_from": "2026-09-01T00:00:00Z",
    "effective_until": null,
    "superseded_by_id": null,
    "created_at": "2026-08-30T09:50:00Z",
    "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "updated_at": "2026-08-30T09:50:00Z",
    "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "extensions": {},
    "links": { "self": "/api/v1/responsibility-routes/rrt_01HZYD3E4F5G6H7J8K9T0M1N20", "history": "/api/v1/responsibility-routes/rrt_01HZYD3E4F5G6H7J8K9T0M1N20/history" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T09:50:00Z" }
}
```

---

## GET /responsibility-routes

**Auth:** `workflow.route.read` on the requested scope. Results are clipped.

Filters: `tenant_id`, `filter[applies_to.type]` + `filter[applies_to.id]`, `trigger_capability`, `state`, `filter[target_post_id]` (which routes point at this post — the check before retiring one), `as_of`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "rrt_01HZYD3E4F5G6H7J8K9T0M1N20",
      "object": "responsibility_route",
      "version": 2,
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "state": "ACTIVE",
      "applies_to": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "trigger_capability": "capa.assign",
      "step_count": 3,
      "on_exhausted": "RAISE_UNMANNED_RESPONSIBILITY",
      "route_version": 2,
      "effective_from": "2026-09-01T00:00:00Z",
      "effective_until": null,
      "links": { "self": "/api/v1/responsibility-routes/rrt_01HZYD3E4F5G6H7J8K9T0M1N20" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-09-14T09:00:00Z" }
}
```

---

## POST /responsibility-routes/{id}/actions

### Action vocabulary

| Action | Capability | `reason` | `expected_version` | Effects |
|---|---|---|---|---|
| `RESOLVE` | internal service, or `workflow.route.test` for authorized administrators | optional | no | Read-only when `dry_run: true`; otherwise creates notifications and an assignment attempt record |
| `SUPERSEDE` | `workflow.route.configure` | **required** | required | Closes this version and creates the next; historical resolution behaviour is preserved |
| `DEACTIVATE` | `workflow.route.configure` | **required** | required | Stops future resolution; refuses if it is the only route for a mandatory trigger |

A route is **never rewritten in place**. `SUPERSEDE` is the only way to change steps, so a past escalation can always be replayed against the version that was live when it ran.

### Request — RESOLVE (dry run)

```json
{
  "action": "RESOLVE",
  "payload": {
    "resource": { "type": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040" },
    "as_of": "2026-08-30T12:00:00Z",
    "dry_run": true,
    "context": { "severity": "SEVERE", "overdue_days": 4 }
  }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Route resolved (dry run — no notifications sent)",
  "data": {
    "route_id": "rrt_01HZYD3E4F5G6H7J8K9T0M1N20",
    "route_version": 2,
    "resource": { "type": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "display": "Berm missing, east haul road" },
    "as_of": "2026-08-30T12:00:00Z",
    "dry_run": true,
    "trigger_matched": true,
    "steps": [
      {
        "sequence": 1,
        "target_post": { "type": "post", "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "display": "Safety Officer, Gevra OCP" },
        "attempted_at": "2026-08-30T12:00:00Z",
        "eligible_current_holders": [],
        "notification_delegates": [],
        "outcome": "NO_ELIGIBLE_HOLDER",
        "reason": "Post vacant since 2026-08-11"
      },
      {
        "sequence": 2,
        "target_post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
        "attempted_at": "2026-08-30T14:00:00Z",
        "eligible_current_holders": [
          { "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" }, "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "holds_trigger_capability": true }
        ],
        "notification_delegates": [
          { "person": { "type": "person", "id": "per_01HZZ8J9K0T1M2N304P5Q6R7S0", "display": "N. Ekka" }, "delegate_id": "dlg_01HZZ9K0T1M2N304P5Q6R7S8T0", "grants_domain_capability": false }
        ],
        "outcome": "SELECTED",
        "reason": "Current holder with capa.assign"
      },
      {
        "sequence": 3,
        "target_post": { "type": "post", "id": "post_01HZZ7H8J9K0T1M2N304P5Q6R0", "display": "Area Safety Officer, Korba" },
        "attempted_at": null,
        "eligible_current_holders": [],
        "notification_delegates": [],
        "outcome": "NOT_REACHED",
        "reason": "Earlier step selected"
      }
    ],
    "selected_recipients": [
      { "person": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" }, "via_step": 2, "role": "RESPONSIBLE", "channels": ["IN_APP", "PUSH", "SMS"] },
      { "person": { "type": "person", "id": "per_01HZZ8J9K0T1M2N304P5Q6R7S0", "display": "N. Ekka" }, "via_step": 2, "role": "NOTIFICATION_DELEGATE", "channels": ["IN_APP"] }
    ],
    "exhausted": false,
    "unmanned_responsibility_raised": false,
    "blocked_operations": [],
    "quiet_hours_applied": false,
    "policy_versions": { "route_version": 2, "capability_catalogue_version": 17 }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T12:00:00Z" }
}
```

A **notification delegate** can receive and acknowledge, and gains no domain capability — `grants_domain_capability` is returned explicitly on every delegate so no client can mistake reach for authority.

### Response — 200 OK, exhausted route

```json
{
  "success": true,
  "message": "Route exhausted; unmanned responsibility raised",
  "data": {
    "route_id": "rrt_01HZYD3E4F5G6H7J8K9T0M1N20",
    "route_version": 2,
    "resource": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "display": "Berm reinstatement" },
    "as_of": "2026-08-30T18:00:00Z",
    "dry_run": false,
    "trigger_matched": true,
    "steps": [
      { "sequence": 1, "target_post": { "type": "post", "id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "display": "Safety Officer, Gevra OCP" }, "attempted_at": "2026-08-30T12:00:00Z", "eligible_current_holders": [], "notification_delegates": [], "outcome": "NO_ELIGIBLE_HOLDER", "reason": "Post vacant since 2026-08-11" },
      { "sequence": 2, "target_post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" }, "attempted_at": "2026-08-30T14:00:00Z", "eligible_current_holders": [], "notification_delegates": [], "outcome": "NO_ELIGIBLE_HOLDER", "reason": "Appointment revoked 2026-08-29" },
      { "sequence": 3, "target_post": { "type": "post", "id": "post_01HZZ7H8J9K0T1M2N304P5Q6R0", "display": "Area Safety Officer, Korba" }, "attempted_at": "2026-08-30T18:00:00Z", "eligible_current_holders": [], "notification_delegates": [], "outcome": "NO_ELIGIBLE_HOLDER", "reason": "Post retired 2026-07-01" }
    ],
    "selected_recipients": [],
    "exhausted": true,
    "unmanned_responsibility_raised": true,
    "unmanned_responsibility_id": "unm_01HZZA1B2C3D4E5F6G7H8J9K00",
    "blocked_operations": [
      { "capability": "capa.verify", "resource": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90" }, "reason": "No current holder of a post carrying capa.verify at this scope" }
    ],
    "escalated_to": [
      { "post": { "type": "post", "id": "post_01HZZB2C3D4E5F6G7H8J9K0T10", "display": "Area General Manager, Korba" }, "role": "NOTIFICATION_ONLY", "grants_domain_capability": false }
    ],
    "quiet_hours_applied": false,
    "policy_versions": { "route_version": 2, "capability_catalogue_version": 17 }
  },
  "meta": {
    "action": "RESOLVE",
    "effects": [
      { "object": "unmanned_responsibility", "id": "unm_01HZZA1B2C3D4E5F6G7H8J9K00", "change": "CREATED" },
      { "object": "notification", "count": 2, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZD3E4F5G6H7J8K9T0M1N20", "change": "CREATED" }
    ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T18:00:00Z"
  }
}
```

`blocked_operations` is the point of the whole file. When an approval or closure post is vacant, the operation **stays blocked** even though notification escalated — the response says so explicitly rather than letting a silent escalation look like a resolution.

---

## Invariants

- Route steps target concrete posts only. Never a role string, never a person, never a platform administrator.
- Escalation moves notification and work assignment. It never moves legal authority, and never satisfies a closure gate.
- Notification delegates gain no domain capability; every delegate entry states this explicitly.
- Routes are versioned by supersession, so any past escalation is replayable against the configuration that produced it.
- An exhausted route raises an `unmanned_responsibility` record and leaves the dependent operation blocked and visible, rather than quietly dropping it.

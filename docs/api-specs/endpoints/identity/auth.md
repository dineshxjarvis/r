# Identity — sessions, current principal, and selected context

Governed by [`../../../architecture/identity-authority-model.md`](../../../architecture/identity-authority-model.md). A cookie authenticates a principal only. It never carries effective roles, tenant authority, appointments, or regulator scope.

Envelope, query grammar, action envelope, and status codes are declared once in [`../../README.md`](../../README.md).

## Routes

| Route | Purpose |
|---|---|
| `POST /auth/sessions` | Create a session (all authentication methods, discriminated by `method`) |
| `GET /auth/sessions` | List sessions for a principal |
| `POST /auth/sessions/{id}/actions` | Revoke a session (`id` may be the literal `current`) |
| `GET /users/me` | Current principal, person, session, and navigational context |
| `PATCH /users/me` | Update selected context and UI preferences |

Five routes. Every new authentication method is a new `method` value, not a new route.

---

## POST /auth/sessions

Public, rate-limited, security-logged. `method` discriminates; `PASSWORD` and `OIDC` are live, `PASSKEY` and `GOV_FEDERATION` are registered in `GET /enums/authentication_method` and ship without a contract change.

`Idempotency-Key` is **not** accepted here — a session create is deliberately non-replayable.

### Request — password

```json
{
  "method": "PASSWORD",
  "login": "r.kumar@example.gov.in",
  "password": "client-supplied secret",
  "csrf_token": "b7c1e0d2f3a4b5c6d7e8f9a0b1c2d3e4",
  "client": {
    "user_agent": "Mozilla/5.0 (X11; Linux x86_64) Strata/1.4.0",
    "platform": "WEB",
    "app_version": "1.4.0",
    "device_fingerprint": "fp_9c1a4b2e7d05",
    "locale": "en-IN"
  }
}
```

### Request — OIDC

```json
{
  "method": "OIDC",
  "authorization_code": "4/0AeanS0b6Yx...",
  "code_verifier": "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk",
  "redirect_uri": "https://app.strata.gov.in/auth/callback",
  "state": "9f8e7d6c5b4a",
  "nonce": "1a2b3c4d5e6f",
  "issuer": "https://login.gov.in",
  "csrf_token": "b7c1e0d2f3a4b5c6d7e8f9a0b1c2d3e4",
  "client": {
    "user_agent": "Mozilla/5.0 (X11; Linux x86_64) Strata/1.4.0",
    "platform": "WEB",
    "app_version": "1.4.0",
    "device_fingerprint": "fp_9c1a4b2e7d05",
    "locale": "en-IN"
  }
}
```

The server validates issuer, audience, signature, expiry, nonce, state, redirect URI, and PKCE. Provider identity binds to `(issuer, subject)`, never email.

### Request — step-up on an existing session

```json
{
  "method": "PASSWORD",
  "login": "r.kumar@example.gov.in",
  "password": "client-supplied secret",
  "csrf_token": "b7c1e0d2f3a4b5c6d7e8f9a0b1c2d3e4",
  "step_up": { "for_action": "capa.verify", "resource": { "type": "capa", "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90" } },
  "client": { "user_agent": "Mozilla/5.0 (X11; Linux x86_64) Strata/1.4.0", "platform": "WEB", "app_version": "1.4.0", "device_fingerprint": "fp_9c1a4b2e7d05", "locale": "en-IN" }
}
```

Step-up rotates the session ID and raises `assurance_level` in place; it does not create a second session.

### Response — 201 Created

Sets `strata_session=<opaque random id>; HttpOnly; Secure; SameSite=Strict; Path=/`.

```json
{
  "success": true,
  "message": "Session created",
  "data": {
    "id": "ses_01HZZ1A2B3C4D5E6F7G8H9J0K0",
    "object": "session",
    "version": 1,
    "principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
    "assurance_level": "PASSWORD",
    "assurance_rank": 2,
    "authenticated_at": "2026-08-30T10:00:00Z",
    "issued_at": "2026-08-30T10:00:00Z",
    "last_seen_at": "2026-08-30T10:00:00Z",
    "idle_expires_at": "2026-08-30T18:00:00Z",
    "absolute_expires_at": "2026-08-31T10:00:00Z",
    "csrf_token": "c3f0a1b2d4e5f60718293a4b5c6d7e8f",
    "selected_context": null,
    "must_complete": [],
    "client": { "platform": "WEB", "app_version": "1.4.0", "locale": "en-IN" },
    "extensions": {},
    "links": { "self": "/api/v1/auth/sessions/ses_01HZZ1A2B3C4D5E6F7G8H9J0K0", "me": "/api/v1/users/me" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T10:00:00Z", "deprecations": [] }
}
```

`must_complete` is an ordered list of blocking interstitials the client must satisfy before normal use — `["ACCEPT_TERMS", "SET_PASSWORD", "ENROL_SECOND_FACTOR"]`. Empty means proceed. New interstitials are added additively; a client that does not recognise one must show a generic block rather than skipping it.

`assurance_rank` is the integer form of `assurance_level`, so a client can compare `>=` without knowing the enum ordering.

### Response — 401 Unauthenticated

```json
{
  "success": false,
  "message": "Authentication failed",
  "error": { "code": "AUTHENTICATION_FAILED", "details": { "retry_after_seconds": null } },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

Deliberately identical for unknown login, wrong password, and unlinked OIDC identity.

### Errors

| Status | Code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Unsupported `method` or malformed flow |
| 400 | `CSRF_INVALID` | Missing/incorrect pre-authentication CSRF token |
| 401 | `AUTHENTICATION_FAILED` | Invalid credentials or identity |
| 403 | `PRINCIPAL_SUSPENDED` | Principal cannot start a session |
| 429 | `RATE_LIMITED` | Principal/IP/provider limit reached; `Retry-After` set |

Every success and failure creates a `security_event`.

---

## GET /auth/sessions

**Auth:** self (`principal_id` defaults to the caller), or `identity.session.read_any` for another principal.

Query: `filter[principal_id]`, `filter[active]=true`, `filter[platform]`, `sort=-last_seen_at`, `page`, `limit`.

### Response — 200 OK

```json
{
  "success": true,
  "data": [
    {
      "id": "ses_01HZZ1A2B3C4D5E6F7G8H9J0K0",
      "object": "session",
      "version": 3,
      "principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
      "assurance_level": "PASSWORD",
      "assurance_rank": 2,
      "authenticated_at": "2026-08-30T10:00:00Z",
      "last_seen_at": "2026-08-30T12:41:00Z",
      "idle_expires_at": "2026-08-30T20:41:00Z",
      "absolute_expires_at": "2026-08-31T10:00:00Z",
      "revoked_at": null,
      "revocation_reason": null,
      "is_current": true,
      "client": { "platform": "WEB", "app_version": "1.4.0", "locale": "en-IN", "user_agent": "Mozilla/5.0 (X11; Linux x86_64) Strata/1.4.0", "approximate_location": "Bilaspur, CG, IN" },
      "available_actions": ["REVOKE"],
      "links": { "self": "/api/v1/auth/sessions/ses_01HZZ1A2B3C4D5E6F7G8H9J0K0" }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "total_pages": 1, "has_next": false, "has_prev": false },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T12:41:03Z" }
}
```

Never returns cookie values, session ID hashes, or CSRF secrets. `approximate_location` is coarse city-level geo-IP, present only where retention policy allows it.

---

## POST /auth/sessions/{id}/actions

`{id}` accepts the literal `current` for self-logout. Requires CSRF validation and origin check.

### Action vocabulary

| Action | Capability | Payload | `reason` | `expected_version` | Effects |
|---|---|---|---|---|---|
| `REVOKE` | self, or `identity.session.revoke_any` | optional | optional | no | `session.revoked_at`, `security_event` |
| `REVOKE_ALL_OTHER` | self only | none | optional | no | Revokes every other session of the same principal, `security_event` per session |

### Request

```json
{
  "action": "REVOKE",
  "reason": "Signed out on shared terminal",
  "payload": { "revoke_reason_code": "USER_INITIATED" }
}
```

### Response — 200 OK

```json
{
  "success": true,
  "message": "Session revoked",
  "data": {
    "id": "ses_01HZZ1A2B3C4D5E6F7G8H9J0K0",
    "object": "session",
    "version": 4,
    "revoked_at": "2026-08-30T12:42:10Z",
    "revocation_reason": "USER_INITIATED"
  },
  "meta": {
    "action": "REVOKE",
    "transition": { "from": "ACTIVE", "to": "REVOKED" },
    "effects": [ { "object": "security_event", "id": "sec_01HZZ4C5D6E7F8G9H0J1K2T3M0", "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-08-30T12:42:10Z"
  }
}
```

Revoking `current` also clears the cookie via `Set-Cookie: strata_session=; Max-Age=0`. Repetition is safe and returns the same body.

---

## GET /users/me

**Auth:** any valid session. Returns identity and navigational context. `effective_capabilities` helps render the UI; every endpoint still authorizes its target independently.

Query: `expand=active_affiliations,active_appointments,active_regulatory_assignments,available_contexts,effective_capabilities` — all four heavy blocks are omitted unless expanded, so the common poll stays small.

### Response — 200 OK

```json
{
  "success": true,
  "data": {
    "principal": {
      "id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
      "object": "principal",
      "version": 5,
      "kind": "HUMAN",
      "status": "ACTIVE",
      "credential_version": 3,
      "last_authenticated_at": "2026-08-30T10:00:00Z"
    },
    "person": {
      "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0",
      "object": "person",
      "display_name": "R. Kumar",
      "primary_email": "r.kumar@example.gov.in",
      "phone": "+91-98765-43210",
      "avatar_url": null,
      "locale_preference": "en-IN",
      "timezone": "Asia/Kolkata"
    },
    "session": {
      "id": "ses_01HZZ1A2B3C4D5E6F7G8H9J0K0",
      "assurance_level": "PASSWORD",
      "assurance_rank": 2,
      "authenticated_at": "2026-08-30T10:00:00Z",
      "idle_expires_at": "2026-08-30T18:00:00Z",
      "absolute_expires_at": "2026-08-31T10:00:00Z",
      "csrf_token": "c3f0a1b2d4e5f60718293a4b5c6d7e8f"
    },
    "selected_context": {
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "tenant_display": "Coal India Limited",
      "resource": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "selected_at": "2026-08-30T10:00:12Z"
    },
    "available_contexts": [
      {
        "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
        "tenant_display": "Coal India Limited",
        "resource": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
        "source": { "type": "appointment", "id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0", "display": "Mine Manager, Gevra OCP" }
      }
    ],
    "active_affiliations": [
      {
        "id": "aff_01HZY3B4C5D6E7F8G9H0J1K2T0",
        "object": "affiliation",
        "organization": { "type": "organization", "id": "org_01HZX2B3C4D5E6F7G8H9J0K1T0", "display": "South Eastern Coalfields Limited" },
        "organization_unit": { "type": "organization_unit", "id": "unit_01HZX3C4D5E6F7G8H9J0K1T2M0", "display": "Korba Area" },
        "affiliation_kind": "EMPLOYEE",
        "external_reference": "SECL-E1024",
        "valid_from": "2026-04-01T00:00:00Z",
        "valid_until": "2029-04-01T00:00:00Z"
      }
    ],
    "active_appointments": [
      {
        "id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
        "object": "appointment",
        "post": { "type": "post", "id": "post_01HZY4C5D6E7F8G9H0J1K2T3M0", "display": "Mine Manager, Gevra OCP" },
        "position_template_code": "MINE_MANAGER",
        "statutory": true,
        "mode": "REGULAR",
        "scope": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
        "valid_from": "2026-04-01T00:00:00Z",
        "valid_until": "2029-04-01T00:00:00Z",
        "derived_state": "ACTIVE"
      }
    ],
    "active_regulatory_assignments": [],
    "effective_capabilities": [
      { "code": "capa.assign", "resource": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }, "via": { "type": "appointment", "id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0" }, "expires_at": "2029-04-01T00:00:00Z", "required_assurance": "PASSWORD" },
      { "code": "finding.close_minor", "resource": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }, "via": { "type": "appointment", "id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0" }, "expires_at": "2029-04-01T00:00:00Z", "required_assurance": "PASSWORD" }
    ],
    "feature_flags": { "offline_capture": true, "assisted_grievance_intake": false },
    "unread_counts": { "notifications": 4, "approvals": 1 },
    "extensions": {},
    "links": { "self": "/api/v1/users/me" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T12:41:03Z", "deprecations": [] }
}
```

`selected_context` is nullable and controls navigation only. `effective_capabilities` is a **hint**, is capped, and each entry names the grant path (`via`) and its expiry so the UI can warn before authority lapses.

---

## PATCH /users/me

**Auth:** valid session, CSRF protection. Partial update; only supplied keys change.

### Request

```json
{
  "selected_context": { "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0", "resource": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" } },
  "locale_preference": "hi-IN",
  "timezone": "Asia/Kolkata",
  "notification_preferences": { "digest_frequency": "DAILY", "channels": ["IN_APP", "EMAIL"] }
}
```

The target must already appear in `available_contexts`; otherwise `422 CONTEXT_NOT_AVAILABLE`. Storing it adds no role, tuple, appointment, jurisdiction, or capability. Setting `selected_context` to `null` clears it.

### Response — 200 OK

```json
{
  "success": true,
  "message": "Preferences updated",
  "data": {
    "selected_context": {
      "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
      "tenant_display": "Coal India Limited",
      "resource": { "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" },
      "selected_at": "2026-08-30T12:45:00Z"
    },
    "locale_preference": "hi-IN",
    "timezone": "Asia/Kolkata",
    "notification_preferences": { "digest_frequency": "DAILY", "channels": ["IN_APP", "EMAIL"] }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-08-30T12:45:00Z" }
}
```

---

## Session-wide rules

- Cookie mutations require CSRF validation and origin checks.
- Account suspension or `credential_version` change invalidates existing sessions immediately.
- Sensitive signature/closure actions may require recent or stronger authentication; the server answers `403 ASSURANCE_REQUIRED` with `details.required_assurance` and `details.max_age_seconds`, and the client re-runs `POST /auth/sessions` with `step_up`.
- Redis may cache session state only if revocation remains immediate.
- Service principals use non-cookie authentication (`Authorization: Bearer`) and cannot silently impersonate humans; their calls carry `principal.kind = SERVICE` and are refused by any action whose capability declares `required_human: true`.

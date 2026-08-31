# Strata — API Contract

Identity and authorization semantics are governed by [`../architecture/identity-authority-model.md`](../architecture/identity-authority-model.md). The browser cookie authenticates a principal only; no endpoint may treat selected tenant, mine, role, post, or appointment context as proof of authority.

This directory is the API contract. Executable migrations — not illustrative Markdown DDL — will become the physical schema authority.

The file-by-file route reduction decisions, including explicit reasons for resources that remain separate, are recorded in [`consolidation-audit.md`](consolidation-audit.md).

Organized by domain and bounded resource group under `docs/api-specs/endpoints/`. A file may own several closely coupled prefixes when splitting them would duplicate invariants; router packages may split mechanically from the contract later.

## Contract shape

The surface is deliberately narrow and uniform. Four core route forms cover the whole system:

| Form | Purpose |
|---|---|
| `GET /{collection}` | Read many. Filtering, projection, expansion, aggregation, and temporal reads all ride query params — never a new route. |
| `GET /{collection}/{id}` | Read one, with the same projection/expansion/temporal grammar. |
| `POST /{collection}` | Create one. |
| `POST /{collection}/{id}/actions` | **Every** state transition and command on that resource, discriminated by an `action` field. |

Plus three collection-level companions: `POST /{collection}/actions` (bulk), `GET /{collection}/{id}/history` (temporal/audit projection), and `PATCH /{collection}/{id}` (attribute correction where the domain permits free-field edit at all).

There is no `POST /capas/{id}/verify`, no `POST /inspections/{id}/close`, no `GET /documents/{id}/segments`. Those are `action: "VERIFY"`, `action: "CLOSE"`, and `?expand=segments`. Every per-operation authorization rule survives the collapse — the rules move into the per-resource **action table** that each endpoint file carries, keyed by `action` value rather than by route.

Three optional companions cover bulk actions, history, and attribute correction. The contract therefore has **seven standard route forms over the registered collections**, while the operation vocabulary lives in data: roughly 136 distinct action names, each with its own capability, state precondition, reason requirement, concurrency requirement, and declared effects. Adding an operation adds a row to an action table, not a route to a router.

### Clustering similar interfaces

Do not create separate routes when the response differs only by a named projection, transport purpose, or resource subtype:

- Use `view=<name>` when several reads share authorization, pagination, freshness, and envelope semantics but return different projections. The base path names the owning read model; `view` selects a registered schema. Unknown views are `400 UNKNOWN_VIEW`.
- Use a body discriminator such as `purpose` when several creates share one transaction boundary and lifecycle. Each discriminator value has its own JSON Schema and capability mapping.
- Use an existing collection plus filters only when the returned objects share one envelope, authorization path, lifecycle, and useful common field set. A query parameter must never switch to a different security boundary or write model.
- Keep legally distinct facts separate even when they appear in one workflow. A submission, receipt, and acceptance; an intake and a case; or a raw observation and validated result must not be collapsed into one polymorphic record.

Clustering is an interface decision, not permission to merge canonical tables. A clustered route may dispatch to separate projections or repositories, but it must declare one stable view or purpose registry and reject unknown values.

Current consolidation map:

| Retired interface | Canonical interface |
|---|---|
| `GET /dashboard/measures` | `GET /dashboard?view=measures` |
| `GET /dashboard/personal-queue` | `GET /dashboard?view=personal_queue` |
| `POST /document-blobs/upload-url` | `POST /uploads` with `purpose: "DOCUMENT_ORIGINAL"` |
| `POST /evidence/upload-url` | `POST /uploads` with `purpose: "EVIDENCE_CAPTURE"` |
| `GET /integration-health-snapshots`, `GET /integration-slo-windows` | `GET /integration-exchanges?view=health_snapshots|slo_windows` |
| `GET /presence-projections`, `GET /attendance-sessions` | `GET /presence-events?view=presence|sessions` |
| `GET /search-suggestions` | `GET /search?view=suggestions` |
| `GET /grievance-aggregates` | `GET /grievance-cases?view=oversight` |
| `GET /grievance-case-types` | `GET /grievance-case-type-versions?view=current` |
| `GET /governed-geometries` | `GET /governed-geometry-versions?view=current` |
| `GET /ai-monitor-observations`, `GET /ai-runs` | `GET /ai-deployments?view=monitoring|runs` |
| `GET /checkpoints` | `GET /checkpoint-devices?view=topology` |
| `GET /contractor-requirement-definitions` | `GET /contractor-requirement-policies?view=definitions` |
| `GET /document-segments` | `GET /documents?view=segments` |
| `GET /obligation-applicability-rules` | `GET /obligations?view=applicability_rules` |
| `GET /evidence-verification-attempts` | `GET /evidence?view=verification_attempts` |
| `GET /published-translations` | `GET /translation-candidates?view=published` |
| `GET /record-parties` | `GET /contractor-engagements?view=record_parties` |
| `GET /ingress-envelopes` | `GET /integration-exchanges?view=ingress` |
| `GET /migration-row-dispositions` | `GET /migration-runs?view=row_dispositions` |
| `GET /material-lots`, `GET /approved-production-facts` | `GET /material-events?view=lots`, `GET /production-periods?view=approved_facts` |
| `GET /search-alert-runs` | `GET /saved-searches?view=alert_runs` |
| `GET /spatial-reference-systems` | `GET /spatial-sources?view=reference_systems` |
| `GET /retention-policy-versions` | `GET /legal-holds?view=retention_policies` |
| `GET /contractor-attributions` | `GET /contractor-performance-periods?view=attributions` |
| Environment parameter, method, and laboratory lists | `GET /monitoring-programs?view=catalog&filter[type]=…` |
| Production material, boundary, location, and device lists | `GET /material-events?view=catalog&filter[type]=…` |
| Inspection type/version lists | `GET /inspections?view=current_types|type_versions` |
| Current report definitions | `GET /report-definition-versions?view=current` |
| Current regulatory services and instruments | Their version collections with `?view=current` |
| `GET /locales` | `GET /enums/locale` |
| `POST /ai-label-assertions` | `POST /ai-dataset-versions/{id}/actions` with `ASSERT_LABEL` |
| `POST /report-definitions` | Initial `POST /report-definition-versions` without `definition_id` |
| `POST /regulatory-services` | Initial `POST /regulatory-service-versions` without `service_id` |

Retired interfaces are documentation aliases only during migration and must not be registered as parallel routers. A compatibility gateway may translate them temporarily, emit `Deprecation` and `Sunset` headers, and report the replacement in `meta.deprecations`.

**A new capability is a new `action` value, registered view, purpose, or filter—not a new route.** Adding a route is the exception and must be justified in the file that adds it.

## Conventions (declared once, apply to every domain)

**Base URL**: `/api/v1/`. The major version changes only for a break that cannot be expressed as an additive field or a new action value.

**Auth**: an opaque `strata_session` cookie issued by `POST /auth/sessions`; see [`endpoints/identity/auth.md`](endpoints/identity/auth.md). The server-side session resolves a principal and authentication assurance only. 🔒 means authentication is required, never that authorization is satisfied.

### Authorization

Every 🔒 endpoint separately authorizes a capability on its exact target. For `POST .../actions` the capability is resolved **per `action` value**, not per route. OpenFGA provides graph relationships; the policy layer evaluates time, mandate, jurisdiction, severity, evidence state, assurance, purpose, and separation of duties. See the [canonical foundation](../architecture/identity-authority-model.md).

```text
1. Resolve session → principal and assurance; failure is 401.
2. Resolve the target resource and tenant through a trusted lookup.
3. Resolve the action from the request body; reject unknown actions with 400 UNKNOWN_ACTION.
4. Resolve current affiliation, appointment, mandate, jurisdiction, and engagement facts.
5. Check(principal, capability_for(action), resource, context); deny or conceal according to policy.
6. Assert the action is legal for the resource's current state; else 409 INVALID_STATE.
7. Apply tenant/authorized-resource filtering and execute the transaction.
8. Persist supporting authority for high-risk actions and write required audit/access/security events.
```

The selected workspace, request `tenant_id`, request `mine_id`, or client `appointment_id` never grants access. Cross-tenant lists calculate and log an effective authorized resource set.

`can_close_with()`-style evidence fitness remains a separate business-state gate after authorization.

### IDs and references

ULID is the native identifier. On the wire every ID is a **prefixed opaque string** whose suffix is the canonical 26-character Crockford Base32 ULID: `capa_01HZZAAB1C2D3E4F5G6H7J8K90`. Raw sequential integers are never public. Clients must treat IDs as opaque and must not parse either the prefix or timestamp component for authorization or business logic.

A pointer to another object is always a **reference object**, never a bare string, wherever the target type is polymorphic or the UI needs a label without a second fetch:

```json
{ "type": "mine", "id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0", "display": "Gevra OCP" }
```

Monomorphic foreign keys stay scalar (`"finding_id": "find_01H..."`) and are promoted to a full object under `expand`.

### Universal resource envelope

Every resource object returned anywhere in the API carries this header. Domain fields follow it.

```json
{
  "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90",
  "object": "capa",
  "version": 7,
  "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
  "state": "SUBMITTED",
  "available_actions": ["VERIFY", "REJECT", "EXTEND_DEADLINE"],
  "created_at": "2026-08-30T09:50:00Z",
  "created_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Mahato" },
  "updated_at": "2026-09-02T11:05:00Z",
  "updated_by": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Mahato" },
  "extensions": {},
  "links": { "self": "/api/v1/capas/capa_01HZZAAB1C2D3E4F5G6H7J8K90" }
}
```

| Field | Meaning |
|---|---|
| `object` | Machine type tag. Lets one polymorphic list carry mixed types and lets a client dispatch without inspecting the ID prefix. |
| `version` | Monotonic integer bumped on every write. Mirrored in the `ETag` header as `W/"<id>:<version>"`. Supply it as `expected_version` or `If-Match` to write safely. |
| `state` | Present only on resources with a lifecycle. Always the current state machine value. |
| `available_actions` | The subset of the resource's action vocabulary that **this principal, right now, on this resource, in this state** may execute. Policy- and state-evaluated. A client must render its controls from this array and must never hardcode a state machine. Omitted on `GET` collections unless `?expand=available_actions`. |
| `extensions` | Namespaced additive bag: `{"cil.secl.legacy_ref": "SECL/2019/4471"}`. Deployments and future modules add fields here without a schema change or a version bump. Keys are reverse-DNS; server rejects unregistered namespaces with `422 UNKNOWN_EXTENSION_NAMESPACE`. |
| `links` | At minimum `self`. Adds `next`/`prev` on collections and relation URLs where a client would otherwise construct one. |

Soft-deleted or superseded rows add `deleted_at` / `superseded_by` and are excluded unless `?include_deleted=true`.

### Typed scalars

Never a bare float, never a bare unit-less number, never a locale-bound string.

```json
{
  "quantity":   { "value": "1250.750", "unit": "TONNE" },
  "money":      { "amount": "125000.00", "currency": "INR" },
  "duration":   "P30D",
  "instant":    "2026-08-30T09:15:00Z",
  "date":       "2026-09-13",
  "period":     { "from": "2026-08-01", "to": "2026-09-01", "bounds": "[)" },
  "geometry":   { "type": "Point", "coordinates": [82.5921, 22.3721], "srid": 4326 },
  "text_i18n":  { "en": "Berm missing on east haul road", "hi": "पूर्वी हॉल रोड पर बर्म गायब" },
  "file":       { "blob_id": "blob_01H...", "sha256": "9f2c...", "byte_size": 184213, "content_type": "application/pdf" }
}
```

Decimals travel as **strings** so no precision is lost in JSON parsing. Quantities and money are always objects because unit and currency will change per tenant and per commodity; a bare number cannot be migrated later without a breaking change.

Localized fields are suffixed `_i18n` and are objects keyed by BCP-47 tag. A plain sibling (`title`) is present when the server resolved a single locale from `Accept-Language`; both may appear.

### Enums are open

Enum values are `SCREAMING_SNAKE` strings. Clients must tolerate unknown values (render the raw code, do not crash) — new values are added additively and are **not** a breaking change. Human labels, ordering, colour, and deprecation live in the machine-readable registry:

```text
GET /enums                     list every registry
GET /enums/{name}              values, labels, i18n labels, ordering, deprecations
GET /schemas/{object}          JSON Schema of a resource, incl. registered extension namespaces
GET /capabilities?resource=…   the action vocabulary and the caller's permitted subset
```

Those three registries are why fields scale: a new severity level, a new document type, a new mineral, or a new statutory form ships as registry data and additive fields, and no client needs a release.

### Query grammar (identical on every collection)

| Param | Form | Notes |
|---|---|---|
| `filter[<field>]` | `filter[status]=OPEN` | Repeat for AND. Comma-separated values mean OR within one field. |
| `filter[<field>][<op>]` | `filter[due_on][lte]=2026-09-30` | Ops: `eq ne lt lte gt gte in nin between prefix contains like isnull any all`. |
| `filter[<ref>.<field>]` | `filter[finding.severity]=SEVERE` | One relation hop. Depth >1 is refused with `400 FILTER_TOO_DEEP`. |
| `q` | `q=berm haul road` | Free text over the resource's indexed fields, authorization-clipped. |
| `sort` | `sort=-due_on,created_at` | `-` prefix descending. Multi-key, left to right. |
| `fields[<object>]` | `fields[capa]=id,status,due_on` | Sparse fieldsets, per object type, applies to expanded objects too. |
| `expand` | `expand=finding,finding.defect,evidence` | Dot paths, max depth 3, max 5 paths. Replaces every sub-resource GET route. |
| `page` / `limit` | `page=2&limit=50` | Default `limit=20`, max `200`. |
| `cursor` / `limit` | `cursor=eyJ2IjoxfQ&limit=50` | Live-appended streams only (`audit_event`, `notification`, `access_log`, `signal`). |
| `as_of` | `as_of=2026-06-30T23:59:59Z` | Temporal read. Returns the resource and its relations as they stood at that instant. Replaces every `state-as-of` route. |
| `include_deleted` | `true` | Off by default. |
| `view` | `view=personal_queue` | Named server-side projection: a saved filter+sort+field set the server owns. Replaces bespoke dashboard/queue routes. `GET /views` lists them. |
| `group_by` + `metrics` | `group_by=mine_id,status&metrics=count,sum(quantity.value)` | Turns any collection into an aggregate. Response becomes `data: [{ "key": {...}, "metrics": {...} }]`. Replaces every per-domain summary/counts route. |
| `Accept-Language` | header | Drives resolution of `_i18n` fields. |
| `Prefer` | `return=minimal` / `return=representation` | Command responses. Default is `representation`. |

Unknown params are a `400 UNKNOWN_PARAMETER` — silently ignoring them hides client bugs.

### Response envelope

```json
{
  "success": true,
  "message": "optional human string",
  "data": { },
  "included": { },
  "pagination": { },
  "warnings": [ { "code": "PARTIAL_SCOPE", "message": "3 mines excluded from this total", "details": {} } ],
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-08-30T09:15:00Z",
    "as_of": null,
    "deprecations": []
  }
}
```

```json
{
  "success": false,
  "message": "human string",
  "error": { "code": "MACHINE_CODE", "details": { } },
  "meta": { "request_id": "req_01H...", "trace_id": "4bf9..." }
}
```

`included` carries expanded objects keyed by `"<object>:<id>"` when the same object is referenced many times in one payload, so a 200-row list expanding a shared parent transfers it once. Small expansions may be inlined instead; the server decides, and clients must handle both by resolving references through `included` first, then inline.

Field-level validation errors: `error.details.errors = [{ "field": "payload.due_on", "message": "must be a future date", "code": "DATE_NOT_FUTURE" }]`. Paths are dotted from the request root, so an action payload error points inside `payload`.

`warnings` is how a partial-authorization read stays honest: the caller gets the rows they may see plus an explicit note that scope was clipped, rather than a silently short list.

### The action envelope

```json
{
  "action": "VERIFY",
  "payload": { },
  "reason": "Berm reinstated to 1.5m, verified against photo evidence",
  "effective_at": "2026-09-02T11:05:00Z",
  "expected_version": 6,
  "supporting_authority": {
    "appointment_id": "app_01HZY2A3B4C5D6E7F8G9H0J1K0",
    "mandate_assignment_id": null,
    "jurisdiction_assignment_id": null,
    "delegation_id": null,
    "break_glass_grant_id": null
  },
  "extensions": {}
}
```

| Field | Required | Meaning |
|---|---|---|
| `action` | yes | A value from that resource's action vocabulary. Unknown → `400 UNKNOWN_ACTION` with the legal set in `details.allowed`. Known but illegal in the current state → `409 INVALID_STATE` with `details.current_state` and `details.allowed`. Known and legal but not permitted for this principal → `403 FORBIDDEN`. |
| `payload` | per action | Action-specific body. Documented per action in each file. Absent for parameterless actions. |
| `reason` | per action | Free text. **Mandatory** for every override, waiver, extension, break-glass, reopen, withdrawal, and rejection — the action table marks which. Persisted to the audit record verbatim. |
| `effective_at` | no | Business time of the act when it differs from wall-clock receipt (back-dated field capture, offline sync). Never overrides the recorded system time; both are stored. Future values are refused unless the action table permits scheduling. |
| `expected_version` | per action | Optimistic concurrency. Mismatch → `409 VERSION_CONFLICT` with `details.current_version`. Equivalent to an `If-Match` header; supply either. Required on all destructive and closure actions. |
| `supporting_authority` | per action | The specific appointment / mandate / jurisdiction / delegation / break-glass grant the principal is acting under. Required whenever more than one could apply or the act is high-risk, so the audit record names the authority exercised, not just the human. |

**Idempotency**: every `POST` accepts an `Idempotency-Key` header and it is **required** on all `/actions` calls and on all creates. The key is scoped to `(principal, route, target)` for 24 hours; a replay returns the original response with `Idempotency-Replayed: true` rather than re-executing. Endpoints with client-generated IDs (offline sync) are additionally idempotent on that ID.

**Successful action response**, `200 OK`:

```json
{
  "success": true,
  "data": { "id": "capa_01HZZAAB1C2D3E4F5G6H7J8K90", "object": "capa", "version": 7, "state": "VERIFIED_CLOSED", "available_actions": [] },
  "meta": {
    "action": "VERIFY",
    "transition": { "from": "SUBMITTED", "to": "VERIFIED_CLOSED" },
    "effects": [
      { "object": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "change": "STATE", "to": "CLOSED" },
      { "object": "notification", "count": 3, "change": "CREATED" },
      { "object": "audit_event", "id": "aud_01HZZ...", "change": "CREATED" }
    ],
    "request_id": "req_01H...",
    "served_at": "2026-09-02T11:05:00Z"
  }
}
```

`data` is the full resource unless `Prefer: return=minimal`, in which case it is the envelope header only. `meta.effects` is the declared side-effect list — the same thing each file's action table promises, returned as data so a client can invalidate exactly what changed instead of refetching the world.

**Bulk**, `POST /{collection}/actions`:

```json
{
  "action": "ASSIGN",
  "targets": ["capa_01HZZAA...", "capa_01HZZBB...", "capa_01HZZCC..."],
  "payload": { "assigned_to": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0" },
  "reason": "Reassigned after roster change",
  "atomic": false
}
```

`targets` may be replaced by `filter` using the same grammar as a list read, capped at 1000 resolved targets. `atomic: true` means all-or-nothing (`409` on the first failure, nothing applied); `atomic: false` (default) applies independently and returns `207 MULTI_STATUS`:

```json
{
  "success": true,
  "data": {
    "requested": 3, "succeeded": 2, "failed": 1,
    "results": [
      { "id": "capa_01HZZAA...", "status": 200, "version": 4, "state": "IN_PROGRESS" },
      { "id": "capa_01HZZBB...", "status": 200, "version": 2, "state": "IN_PROGRESS" },
      { "id": "capa_01HZZCC...", "status": 403, "error": { "code": "FORBIDDEN", "message": "capa.assign not held on parent finding" } }
    ]
  }
}
```

Authorization is evaluated **per target**. A bulk call is never a scope escalation.

**Long-running actions** return `202 Accepted` with an operation handle instead of a resource:

```json
{
  "success": true,
  "data": {
    "operation": {
      "id": "op_01HZZ9M8N7P6Q5R4S3T2V1V0W0",
      "object": "operation",
      "status": "RUNNING",
      "kind": "document.extract",
      "target": { "type": "document", "id": "doc_01H..." },
      "progress": { "completed": 4, "total": 17, "percent": 23 },
      "started_at": "2026-08-30T09:15:02Z",
      "estimated_completion_at": "2026-08-30T09:17:40Z",
      "result": null,
      "error": null,
      "links": { "self": "/api/v1/operations/op_01HZZ9M8N7P6Q5R4S3T2V1V0W0" }
    }
  }
}
```

`GET /operations/{id}` is the **single** async-status route for the whole platform — extraction jobs, index rebuilds, exports, bulk transfers, restore drills, report rendering. No domain defines its own job-status endpoint.

### Status codes

| Status | Code | Means | Client should |
|---|---|---|---|
| 200 | — | Read or command succeeded | — |
| 201 | — | Resource created; `Location` header set | — |
| 202 | — | Accepted, async; poll `data.operation.links.self` | Poll or await webhook |
| 207 | — | Bulk, mixed outcomes | Inspect `data.results` |
| 400 | `VALIDATION_ERROR` | Malformed/missing input | Fix highlighted fields |
| 400 | `UNKNOWN_ACTION` | `action` not in this resource's vocabulary | Read `details.allowed` |
| 400 | `UNKNOWN_PARAMETER` | Query param not recognised | Fix the client |
| 400 | `FILTER_TOO_DEEP` | Relation filter deeper than one hop | Restructure the query |
| 401 | `UNAUTHENTICATED` | No/expired session | Redirect to login |
| 403 | `FORBIDDEN` | Session valid, object visible, this act not allowed | Nothing — will never work for this actor |
| 403 | `ASSURANCE_REQUIRED` | Act needs step-up authentication | Re-authenticate, retry |
| 404 | `NOT_FOUND` | Object doesn't exist **or** isn't in the caller's authorised scope (deliberately indistinguishable) | Nothing |
| 409 | `INVALID_STATE` | Legal action, wrong current state | Refetch, show `available_actions` |
| 409 | `VERSION_CONFLICT` | `expected_version`/`If-Match` stale | Refetch, re-present, retry |
| 409 | `CONFLICT` | Resource already exists (e.g. duplicate `content_hash`) | Use the existing resource |
| 422 | `UNPROCESSABLE` | Business rule forbids it (e.g. `verified_by = submitted_by`) | Show message, don't retry unchanged |
| 422 | `EVIDENCE_INSUFFICIENT` | Closure gate `can_close_with()` failed | Attach the missing evidence named in `details` |
| 422 | `UNKNOWN_EXTENSION_NAMESPACE` | `extensions` key not registered | Register the namespace |
| 429 | `RATE_LIMITED` | Quota exceeded; `Retry-After` set | Back off |
| 500 | `INTERNAL_ERROR` | Unhandled server fault | Retry with backoff, then report |
| 503 | `DEPENDENCY_UNAVAILABLE` | Downstream (storage, OpenFGA, provider) down | Retry with backoff |

**404 vs 403, deliberately conflated**: a request for an object outside the caller's authorised scope returns `404 NOT_FOUND`, never `403 FORBIDDEN` — matches `authorization-spec.md`'s tenant-isolation intent; a `403` on a cross-tenant object would confirm the object exists at all, which is itself a leak. A `403` is reserved for "this object is visible to you, but this specific action on it isn't allowed."

### Pagination

Page-based by default: `?page=1&limit=20` →

```json
{ "pagination": { "page": 1, "limit": 20, "total": 143, "total_pages": 8, "has_next": true, "has_prev": false } }
```

Cursor-based only for genuinely unbounded/live-appended lists (`audit_event`, `notification`, `access_log`, `signal`) where page-number stability is meaningless against a stream:

```json
{ "pagination": { "next_cursor": "eyJ0IjoiMjAyNi0wOC0zMFQwOToxNTowMFoiLCJpIjoiYXVkXzAxSCJ9", "has_more": true } }
```

`total` may be `null` on very large authorization-clipped result sets, with `pagination.total_is_estimate: true`; never block a page render on an exact count.

### History and audit, universally

```text
GET /{collection}/{id}/history?page=1&limit=50
```

Returns the ordered change record for any resource, with the same envelope everywhere:

```json
{
  "success": true,
  "data": [
    {
      "id": "aud_01HZZ7B8C9D0E1F2G3H4J5K6T0",
      "object": "audit_event",
      "sequence": 4,
      "occurred_at": "2026-09-02T11:05:00Z",
      "effective_at": "2026-09-02T11:05:00Z",
      "action": "VERIFY",
      "actor": { "type": "person", "id": "per_01H...", "display": "R. Mahato" },
      "acting_as": { "appointment_id": "app_01H...", "post_id": "post_01H...", "display": "Mine Manager, Gevra OCP" },
      "resource": { "type": "capa", "id": "capa_01H..." },
      "transition": { "from": "SUBMITTED", "to": "VERIFIED_CLOSED" },
      "changes": [ { "field": "status", "from": "SUBMITTED", "to": "VERIFIED_CLOSED" } ],
      "reason": "Berm reinstated to 1.5m",
      "request_id": "req_01H...",
      "hash": "sha256:1a4f...",
      "prev_hash": "sha256:0b3e..."
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 4, "total_pages": 1, "has_next": false, "has_prev": false }
}
```

`hash`/`prev_hash` chain each resource's history so tampering is detectable; `platform/platform-operations.md` owns chain verification.

### Side effects

Every endpoint card lists writes beyond its primary resource, and every action row names its effects. A material command writes domain state, audit, and outbox records atomically through the domain transaction boundary. The same effect list is returned live in `meta.effects`.

### Webhooks and streams

Anything the outbox emits is subscribable rather than pollable. `integrations/integrations.md` owns subscription management; the event body reuses the `history` record shape above verbatim, so one parser handles audit reads and pushed events.

## Domain index

| Domain folder | Data model section | Status |
|---|---|---|
| `identity/` | `identity-authority-model.md`, `foundation-data-model.md` | Canonical foundation |
| `documents/` | `data-model.md §2` | Bodies specified |
| `defects/` | `data-model.md §3` | Bodies specified |
| `evidence/` | `data-model.md §4` | Bodies specified |
| `workflow/` | `data-model.md §4.6` | Bodies specified |
| `dashboard/` | `data-model.md §5`, `§6` | Bodies specified |
| `inspections/` | `inspection-spec.md`, `inspection-data-model.md` | Bodies specified |
| `incidents/` | `incident-and-emergency-spec.md`, `incident-data-model.md` | Bodies specified |
| `production/` | `production-dispatch-stock-spec.md`, `production-data-model.md` | Bodies specified |
| `environment/` | `environmental-monitoring-spec.md`, `environment-data-model.md` | Bodies specified |
| `contractors/` | `contractor-compliance-spec.md`, `contractor-data-model.md` | Bodies specified |
| `attendance/` | `presence-and-attendance-spec.md`, `attendance-data-model.md` | Bodies specified |
| `geospatial/` | `geospatial-governance-spec.md`, `geospatial-data-model.md` | Bodies specified |
| `reporting/` | `statutory-reporting-spec.md`, `reporting-data-model.md` | Bodies specified |
| `regulatory-cases/` | `application-and-case-spec.md`, `regulatory-case-data-model.md` | Bodies specified |
| `search/` | `authorization-aware-search-spec.md`, `search-data-model.md` | Bodies specified |
| `grievances/` | `grievance-and-protected-intake-spec.md`, `grievance-data-model.md` | Bodies specified |
| `integrations/` | `integration-platform-spec.md`, `integration-data-model.md` | Bodies specified |
| `analytics/` | `analytics-and-ai-governance-spec.md`, `analytics-ai-data-model.md` | Bodies specified |
| `experience/` | `localization-accessibility-assisted-use-spec.md`, `experience-data-model.md` | Bodies specified |
| `platform/` | `production-hardening-spec.md`, `audit-history-data-model.md` | Bodies specified |

See [`endpoints/README.md`](endpoints/README.md) for the file-by-file route and action index. Every endpoint card gives the exact request and response body — no "same shape as X" shorthand, even for plain CRUD.

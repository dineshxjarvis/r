# Search — authorization-aware query, saved searches, alerts, exports, and index control

Domain rules: [`../../../features/search/authorization-aware-search-spec.md`](../../../features/search/authorization-aware-search-spec.md). Logical control model: [`../../../architecture/search-data-model.md`](../../../architecture/search-data-model.md). Conventions: [`../../README.md`](../../README.md).

Search records are **rebuildable projections and control-plane state**. Source domains and identity remain authoritative, and **a search document is never referenced as authoritative input by any domain**. If search and the source disagree, the source is right and search is stale.

Two rules make this domain safe rather than merely fast:

- **Unauthorised fields are absent or irreversibly redacted in the audience projection** — not hidden at response time. A field the caller may not see was never written into the index they query.
- **Every returned object requires a current source authorization decision.** Stale allow-metadata in the index is never sufficient on its own.

## Routes

| Route | Purpose |
|---|---|
| `POST /search-sessions` · `GET /search-sessions/{id}` · `GET /search-sessions/{id}/pages` | Query; lexical, semantic, within-document, and related — one route, `mode` discriminates |
| `GET /search?view=suggestions` | Typeahead over authorized partitions only |
| `GET /saved-searches` · `POST /saved-searches` · `POST /saved-searches/{id}/actions` | Saved query, share, alert subscription, run |
| `GET /saved-searches?view=alert_runs` | What an alert actually found, and under which revision |
| `GET /search-exports` · `POST /search-exports` · `GET /search-exports/{id}` | Manifest-bound export |
| `GET /search-projection-definitions` · `POST /search-projection-definitions` · `POST /search-projection-definitions/{id}/actions` | Audience projection and redaction schema |
| `GET /search-indexes` · `POST /search-indexes/{id}/actions` | Rebuild, health, checkpoint |
| `GET /search-index-failures` · `POST /search-index-failures/{id}/actions` | Dead letters |
| `GET /search-tombstones` · `POST /search-tombstones/{id}/actions` | Removal, and proof of removal |

`POST /search/query`, `/query/semantic`, `/documents/{id}/search`, and `/search/related` are one route with `mode: "LEXICAL" | "SEMANTIC" | "WITHIN_DOCUMENT" | "RELATED"`. Typeahead is the lightweight `GET /search?view=suggestions&q=…` projection and does not create a search session. `GET /search/projection-status/{domain}` is `GET /search-indexes?filter[domain]=…`.

---

## POST /search-sessions

**Auth:** `search.query` with a declared purpose. The session **binds the caller's authorized-scope hash and the authorization revision** at creation; a revision change forces re-resolution rather than silently serving stale scope.

```json
{
  "mode": "LEXICAL",
  "query": {
    "text": "berm collapse haul road",
    "filters": { "all": [{ "field": "source_type", "op": "in", "value": ["finding", "defect", "observation"] }, { "field": "mine_id", "op": "eq", "value": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" }, { "field": "occurred_at", "op": "gte", "value": "2026-01-01T00:00:00Z" }] },
    "facets": ["source_type", "severity", "status", "mine_id"],
    "sort": [{ "field": "_score", "direction": "DESC" }, { "field": "occurred_at", "direction": "DESC" }]
  },
  "purpose": "INTERNAL_INVESTIGATION",
  "page_size": 20,
  "extensions": {}
}
```

### Response — 201 Created

```json
{
  "success": true,
  "message": "Session created; 47 authorized results",
  "data": {
    "id": "ssn_01HZY1A2B3C4D5E6F7G8H9J0K0",
    "object": "search_session",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "available_actions": ["NEXT_PAGE", "EXPORT", "SAVE"],
    "mode": "LEXICAL",
    "principal_id": "prn_01HZY0Z9Y8X7W6V5V4T3S2R1Q0",
    "purpose": "INTERNAL_INVESTIGATION",
    "query_hash": "sha256:2b8c1e3f4a5d6e7f8091a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3",
    "authorized_scope_hash": "sha256:7d1a9c4e2f6b830d5ae91f4c07b2e8d3a5061c9f7e2b408d5a3c1e9f0b2d4a6c",
    "authorization_revision": 118442,
    "access_partitions": [
      { "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0", "resource_scope": { "kind": "MINE_SET", "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"] }, "classification_ceiling": "INTERNAL", "lifecycle_states": ["ACTIVE", "CLOSED"], "source_authority": "appointment app_01HZY2A3B4C5D6E7F8G9H0J1K0" }
    ],
    "projection_policy_version": 6,
    "ranking_policy_version": 3,
    "index_point_in_time": "2026-12-14T09:59:41Z",
    "total_authorized_results": 47,
    "partial_domains": [
      { "domain": "environment", "reason": "PROJECTION_LAG", "lag": "PT41M", "note": "Environment results after 2026-12-14T09:19Z may be missing from this session" }
    ],
    "expires_at": "2026-12-14T10:30:00Z",
    "created_at": "2026-12-14T10:00:00Z",
    "extensions": {},
    "links": { "self": "/api/v1/search-sessions/ssn_01HZY1A2B3C4D5E6F7G8H9J0K0", "pages": "/api/v1/search-sessions/ssn_01HZY1A2B3C4D5E6F7G8H9J0K0/pages?page=1" }
  },
  "warnings": [
    { "code": "PARTIAL_INDEX", "message": "1 domain is behind by more than the freshness target; results may be incomplete", "details": { "domains": ["environment"], "max_lag": "PT41M" } }
  ],
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-12-14T10:00:00Z", "effects": [ { "object": "search_query_audit", "count": 1, "change": "CREATED" } ] }
}
```

`partial_domains` and the `PARTIAL_INDEX` warning are how the system stays honest about lag. A search that quietly omits the last 41 minutes of environment data during an investigation is worse than one that says so.

### GET /search-sessions/{id}/pages

```json
{
  "success": true,
  "data": [
    {
      "source": { "type": "finding", "id": "find_01HZZ55F6G7H8J9K0T1M2N3040", "version": 4 },
      "score": 0.914,
      "rank": 1,
      "title": "Absence of haul road edge protection",
      "snippet": "…40m of the east <em>haul road</em> without any <em>berm</em>, with an unprotected 3m drop onto an active bench…",
      "facets": { "source_type": "finding", "severity": "SEVERE", "status": "CLOSED", "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
      "occurred_at": "2026-09-07T11:20:00Z",
      "classification": "INTERNAL",
      "redacted_fields": ["issuing_person", "authorization_evidence"],
      "redaction_basis": "AUDIENCE_PROJECTION",
      "authorization_check": { "capability": "finding.read", "decision": "ALLOW", "checked_at": "2026-12-14T10:00:00.412Z", "authority_revision": 118442, "source_checked": true },
      "links": { "source": "/api/v1/findings/find_01HZZ55F6G7H8J9K0T1M2N3040" }
    },
    {
      "source": { "type": "defect", "id": "def_01HZZ44E5F6G7H8J9K0T1M2N30", "version": 7 },
      "score": 0.881,
      "rank": 2,
      "title": "Safety berm missing, east haul road",
      "snippet": "…Safety <em>berm</em> missing along 40m of east <em>haul road</em> edge, drop of approx 3m…",
      "facets": { "source_type": "defect", "severity": "SEVERE", "status": "CLOSED", "mine_id": "mine_01HZY7A8B9C0D1E2F3G4H5J6K0" },
      "occurred_at": "2026-08-30T09:40:00Z",
      "classification": "INTERNAL",
      "redacted_fields": [],
      "authorization_check": { "capability": "defect.read", "decision": "ALLOW", "checked_at": "2026-12-14T10:00:00.418Z", "authority_revision": 118442, "source_checked": true },
      "links": { "source": "/api/v1/defects/def_01HZZ44E5F6G7H8J9K0T1M2N30" }
    }
  ],
  "included": {
    "facet_counts": {
      "source_type": [{ "value": "finding", "count": 18 }, { "value": "defect", "count": 21 }, { "value": "observation", "count": 8 }],
      "severity": [{ "value": "SEVERE", "count": 6 }, { "value": "SIGNIFICANT", "count": 24 }, { "value": "MINOR", "count": 17 }],
      "status": [{ "value": "CLOSED", "count": 39 }, { "value": "OPEN", "count": 8 }]
    }
  },
  "pagination": { "page": 1, "limit": 20, "total": 47, "total_pages": 3, "has_next": true, "has_prev": false },
  "meta": {
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736",
    "served_at": "2026-12-14T10:00:01Z",
    "result_manifest_id": "srm_01HZY3C4D5E6F7G8H9J0K1T2M0",
    "result_manifest_hash": "sha256:9f2c8b1a4e7d0536bc82af914d0e7b3350a1c6d9e2f7b408c5a3d1e9f0b2c4a6",
    "index_point_in_time": "2026-12-14T09:59:41Z",
    "authorization_revision": 118442,
    "candidates_dropped_by_source_check": 2
  }
}
```

`candidates_dropped_by_source_check: 2` is the second rule working. Two candidates matched the index and were **re-checked against the source and refused** — because a revocation landed after the last projection run. Facets and totals derive only from the **authorized** partitions, so the counts a caller sees never leak the existence of what they cannot read.

`redaction_basis: "AUDIENCE_PROJECTION"` means the field was never in this audience's index, not that it was stripped from the response.

### Response — 409, authorization revision changed

```json
{
  "success": false,
  "message": "Authorization scope changed since this session was created",
  "error": {
    "code": "INVALID_STATE",
    "details": {
      "session_authorization_revision": 118442,
      "current_authorization_revision": 118503,
      "changed_because": "One or more of your appointments, mandates, or jurisdiction assignments changed",
      "resolution": "Create a new session. Results under a stale scope are never served."
    }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736" }
}
```

### Semantic mode

```json
{
  "mode": "SEMANTIC",
  "query": { "text": "cases where a repaired slope failed again within a few months", "filters": { "all": [{ "field": "mine_id", "op": "in", "value": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"] }] }, "top_k": 25, "min_similarity": 0.62 },
  "purpose": "INTERNAL_INVESTIGATION",
  "extensions": {}
}
```

```json
{
  "success": true,
  "data": {
    "id": "ssn_01HZY4D5E6F7G8H9J0K1T2M3N0",
    "object": "search_session",
    "mode": "SEMANTIC",
    "embedding_policy": { "model": "strata-embed-3", "provider": "IN_TENANT", "policy_version": 4, "classification_ceiling": "INTERNAL" },
    "excluded_from_semantic": [
      { "classification": "RESTRICTED", "document_count": 84, "reason": "EMBEDDING_DISALLOWED_BY_POLICY", "note": "Restricted-classification content has no embedding under policy v4 and cannot appear in semantic results at all" }
    ],
    "index_point_in_time": "2026-12-14T09:59:41Z",
    "authorization_revision": 118442,
    "total_authorized_results": 11,
    "state": "ACTIVE",
    "expires_at": "2026-12-14T10:30:00Z"
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-12-14T10:05:00Z" }
}
```

**A semantic embedding cannot exist for content its model, provider, or classification policy disallows.** Restricted material is not merely filtered out of semantic results — it was never embedded, so no vector of it exists to leak through similarity.

---

## POST /saved-searches · actions

**Auth:** `search.saved.manage` for the owner.

**A saved search, a share, and an alert never grant access.** Each run re-authorizes against the runner's own current scope.

```json
{
  "action": "SHARE",
  "expected_version": 2,
  "payload": { "recipient": { "kind": "POST", "post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0" }, "valid_until": "2027-06-30T00:00:00Z" }
}
```

```json
{
  "success": true,
  "message": "Saved search shared",
  "data": {
    "id": "svsc_01HZY5E6F7G8H9J0K1T2M3N400",
    "object": "saved_search",
    "version": 3,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "ACTIVE",
    "name": "Recurring haul-road slope failures",
    "owner": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" },
    "query_ast_version": 2,
    "intended_scope": { "mine_ids": ["mine_01HZY7A8B9C0D1E2F3G4H5J6K0"] },
    "purpose": "INTERNAL_INVESTIGATION",
    "shares": [
      { "id": "svsh_01HZY6F7G8H9J0K1T2M3N405P0", "recipient": { "kind": "POST", "post_id": "post_01HZY5D6E7F8G9H0J1K2T3M4N0", "display": "Safety Officer, Gevra OCP" }, "granted_by": { "type": "person", "id": "per_01HZY1B2C3D4E5F6G7H8J9K0M0", "display": "S. Minj" }, "valid_until": "2027-06-30T00:00:00Z", "grants_source_access": false, "note": "Sharing conveys the query only. Each recipient sees results under their own authorization." }
    ],
    "alert_subscriptions": [],
    "available_actions": ["RUN", "SHARE", "SUBSCRIBE_ALERT", "DISABLE"]
  },
  "meta": { "action": "SHARE", "transition": null, "effects": [ { "object": "saved_search_share", "count": 1, "change": "CREATED" }, { "object": "notification", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-12-14T11:00:00Z" }
}
```

`grants_source_access: false` is stated on every share, always false.

### GET /saved-searches/alert-runs/{id}

```json
{
  "success": true,
  "data": {
    "id": "salr_01HZY7G8H9J0K1T2M3N405P6Q0",
    "object": "search_alert_run",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "DELIVERED",
    "subscription": { "type": "search_alert_subscription", "id": "salsub_01HZY8H9J0K1T2M3N405P6Q7R0", "display": "Recurring haul-road slope failures, daily" },
    "recipient": { "type": "person", "id": "per_01HZY9K0M1N2P3Q4R5S6T7V8V0", "display": "R. Kumar" },
    "ran_at": "2026-12-15T02:00:00Z",
    "authorization_revision_at_run": 118503,
    "index_revision_at_run": "2026-12-15T01:58:12Z",
    "reauthorized_for_recipient": true,
    "new_result_manifest": { "id": "srm_01HZYA0B1C2D3E4F5G6H7J8K90", "count": 2, "source_versions": [{ "type": "observation", "id": "obs_01HZYB1C2D3E4F5G6H7J8K9T00", "version": 1 }, { "type": "defect", "id": "def_01HZYC2D3E4F5G6H7J8K9T0M10", "version": 1 }], "hash": "sha256:1a4f9c2e…" },
    "results_withheld_for_recipient": 1,
    "results_withheld_reason": "Recipient lacks defect.read at mine_01HZYD3E4F5G6H7J8K9T0M1N20",
    "delivery": { "notification_id": "notif_01HZYE4F5G6H7J8K9T0M1N2030", "delivered_at": "2026-12-15T02:00:04Z" },
    "outcome": "SUCCEEDED",
    "links": { "self": "/api/v1/saved-searches/alert-runs/salr_01HZY7G8H9J0K1T2M3N405P6Q0" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-12-15T08:00:00Z" }
}
```

The alert re-authorized for the **recipient**, not the owner, and one result was withheld. The count of withheld results is visible to an auditor and not to the recipient, whose notification simply contains two items.

---

## POST /search-exports

**Auth:** `search.export`, which is a **stricter capability than `search.query`** and carries its own classification policy.

```json
{
  "search_session_id": "ssn_01HZY1A2B3C4D5E6F7G8H9J0K0",
  "format": "CSV",
  "purpose": "REGULATORY_SUBMISSION",
  "justification": "Annexure to the DGMS Form IV Q3 return, listing all haul-road findings in the period",
  "extensions": {}
}
```

```json
{
  "success": true,
  "message": "Export queued",
  "data": {
    "id": "sexp_01HZYF5G6H7J8K9T0M1N203P40",
    "object": "search_export",
    "version": 1,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "GENERATING",
    "available_actions": [],
    "search_session_id": "ssn_01HZY1A2B3C4D5E6F7G8H9J0K0",
    "query_hash": "sha256:2b8c1e3f…",
    "authorized_scope_hash": "sha256:7d1a9c4e…",
    "authorization_revision": 118442,
    "purpose": "REGULATORY_SUBMISSION",
    "justification": "Annexure to the DGMS Form IV Q3 return, listing all haul-road findings in the period",
    "redaction_policy_version": 6,
    "index_checkpoint": "2026-12-14T09:59:41Z",
    "result_manifest": { "id": "srm_01HZY3C4D5E6F7G8H9J0K1T2M0", "row_count": 47, "immutable": true, "hash": "sha256:9f2c8b1a…" },
    "artifact": null,
    "expires_at": "2026-12-21T10:00:00Z",
    "created_at": "2026-12-14T10:10:00Z",
    "links": { "self": "/api/v1/search-exports/sexp_01HZYF5G6H7J8K9T0M1N203P40", "operation": "/api/v1/operations/op_01HZYG6H7J8K9T0M1N203P4Q50" }
  },
  "meta": { "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "trace_id": "4bf92f3577b34da6a3ce929d0e0e4736", "served_at": "2026-12-14T10:10:00Z", "effects": [ { "object": "access_event", "count": 1, "change": "CREATED", "note": "Export is purpose-logged" }, { "object": "operation", "count": 1, "change": "CREATED" } ] }
}
```

An export requires an **immutable result manifest**. Two people exporting "the same search" a week apart get different rows, and the manifest is what makes each one defensible.

---

## POST /search-tombstones/{id}/actions — VERIFY

**Auth:** `search.index.manage`.

**Tombstone completion covers lexical index, vector index, suggestions, snippets, and query caches** — all five, verified, not assumed.

```json
{ "action": "VERIFY", "expected_version": 2, "payload": { "deep_check": true } }
```

```json
{
  "success": true,
  "message": "Tombstone verified complete across 5 surfaces",
  "data": {
    "id": "stmb_01HZYH7J8K9T0M1N203P4Q5R60",
    "object": "search_tombstone",
    "version": 3,
    "tenant_id": "ten_01HZX1A2B3C4D5E6F7G8H9J0K0",
    "state": "VERIFIED_COMPLETE",
    "source": { "type": "document", "id": "doc_01HZYJ8K9T0M1N203P4Q5R6S70", "version": 3 },
    "removal_reason": "CLASSIFICATION_RAISED_TO_RESTRICTED",
    "removal_requested_at": "2026-12-14T12:00:00Z",
    "event_position": { "domain": "documents", "outbox_position": 8841221 },
    "surface_checks": [
      { "surface": "LEXICAL_INDEX", "removed": true, "verified_at": "2026-12-14T12:00:41Z", "residual_hits": 0 },
      { "surface": "VECTOR_INDEX", "removed": true, "verified_at": "2026-12-14T12:00:44Z", "residual_hits": 0 },
      { "surface": "SUGGESTIONS", "removed": true, "verified_at": "2026-12-14T12:00:46Z", "residual_hits": 0 },
      { "surface": "SNIPPET_STORE", "removed": true, "verified_at": "2026-12-14T12:00:48Z", "residual_hits": 0 },
      { "surface": "QUERY_CACHE", "removed": true, "verified_at": "2026-12-14T12:00:52Z", "invalidated_cache_keys": 214 }
    ],
    "invalidation_status": "COMPLETE",
    "priority_path": true,
    "priority_path_note": "Revocation invalidation runs on a control path separate from ordinary indexing backlog",
    "completed_at": "2026-12-14T12:00:52Z",
    "available_actions": []
  },
  "meta": {
    "action": "VERIFY",
    "transition": { "from": "PENDING_VERIFICATION", "to": "VERIFIED_COMPLETE" },
    "effects": [ { "object": "audit_event", "count": 1, "change": "CREATED" } ],
    "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0",
    "served_at": "2026-12-14T12:01:00Z"
  }
}
```

Revocation invalidation is a **priority control path distinct from ordinary indexing backlog**. A document whose classification just rose must leave the index now, not behind a queue of routine updates.

---

## POST /search-indexes/{id}/actions — REBUILD

```json
{
  "action": "REBUILD",
  "expected_version": 12,
  "reason": "Projection definition v7 adds field-level redaction for regulator-issued content; full rebuild required",
  "payload": { "source_cut": "2026-12-14T00:00:00Z", "projection_definition_version": 7 }
}
```

```json
{
  "success": true,
  "message": "Rebuild started",
  "data": {
    "id": "sidx_01HZYK9T0M1N203P4Q5R6S7T80",
    "object": "search_index",
    "version": 13,
    "state": "REBUILDING",
    "domain": "documents",
    "rebuild": {
      "id": "srbd_01HZYT0M1N203P4Q5R6S7T8V90",
      "source_cut": "2026-12-14T00:00:00Z",
      "projection_definition_version": 7,
      "expected_document_count": 118442,
      "actual_document_count": 0,
      "failures": 0,
      "started_at": "2026-12-14T13:00:00Z",
      "completion_proof": null,
      "operation_id": "op_01HZYM1N203P4Q5R6S7T8V9V00"
    },
    "checkpoint": { "outbox_position": 8841221, "source_time": "2026-12-14T12:59:58Z", "index_time": "2026-12-14T13:00:00Z", "lag": "PT2S", "coverage_percent": "100.0" },
    "available_actions": []
  },
  "meta": { "action": "REBUILD", "transition": { "from": "HEALTHY", "to": "REBUILDING" }, "effects": [ { "object": "operation", "count": 1, "change": "CREATED" } ], "request_id": "req_01HZZ8N4P5Q6R7S8T9V0W1X2Y0", "served_at": "2026-12-14T13:00:00Z" }
}
```

A rebuild records **source cut, expected and actual counts, failures, and a completion proof**. "The index was rebuilt" without those four is an assertion, not evidence.

---

## Invariants

- Every indexed document references its exact source version, projection version, and outbox position.
- Index events are idempotent by source, version, and event; an older out-of-order version can never replace a newer one.
- Unauthorised or private fields are absent or irreversibly redacted in the audience projection, not hidden at response time.
- A semantic embedding cannot exist for content its model, provider, or classification policy disallows.
- A query session binds the current authorized-scope hash and authorization revision; a revision change forces re-resolution.
- Every returned object requires a current source authorization decision; stale allow-metadata is never sufficient.
- Facets, totals, and suggestions derive only from authorized candidate partitions.
- Cache identity includes purpose, authorization revision, projection and redaction policy, and the query and index point.
- Tombstone completion covers lexical index, vector index, suggestions, snippets, and query caches, and is verified.
- A saved search, share, or alert never grants access and re-authorizes on every run.
- An export requires an immutable result manifest and a stricter capability and classification policy than query.
- Query audit content follows its own privacy and retention policy with operator separation.
- A search document is never referenced as authoritative input by any domain.
- An index rebuild records source cut, expected and actual counts, failures, and completion proof.
- Revocation invalidation is a priority control path, separate from ordinary indexing backlog.

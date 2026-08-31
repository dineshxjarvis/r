# Authorization-Aware Search — Logical Data Model

Read with the [search specification](../features/search/authorization-aware-search-spec.md). Source domains and identity/access remain authoritative; search records are rebuildable projections/control-plane state.

## 1. Projection catalogue and checkpoints

- `search_projection_definition`: source type, allowed lifecycle/audiences, field/facet/redaction/embedding schema and version.
- `search_source_checkpoint`: domain/partition, outbox position, source/index times, lag, coverage and rebuild state.
- `search_document_version`: source ID/version, tenant/targets, lifecycle/effective times, content/facets, classification, authorization partition/revision and projection version.
- `search_text_fragment`: field/page/anchor, native/OCR text, language/script, confidence, analyzer version and visibility label.
- `search_embedding`: fragment/content hash, model/provider/policy version, vector-store reference and classification.
- `search_tombstone`: source/version, removal reason/time, event position and invalidation status.
- `search_index_failure`: event/source, stage, retries, error class, owner and dead-letter resolution.

Physical lexical/vector indexes may be external; these records define the logical control contract and provenance.

## 2. Query and result proof

- `search_session`: principal/purpose, query AST/hash, authorized-scope hash, authorization revision, projection/ranking policy, index point-in-time, expiry and partial domains.
- `search_access_partition`: session, permitted tenant/resource/classification/lifecycle partitions and source authority.
- `search_result_manifest`: session/page/export, ordered source versions/scores, redaction, checkpoint and hash.
- `search_query_audit`: sensitive query hash/encrypted restricted text where policy permits, actor/purpose/scope, counts, time and anomaly flags.
- `search_result_access_check`: source object/version, capability, decision, authority revision and time for returned candidates.

## 3. Saved searches, alerts and exports

- `saved_search`: owner, versioned query AST, intended scope/purpose, display and lifecycle.
- `saved_search_share`: recipient principal/post, authorized sharing grant and validity; never grants source access.
- `search_alert_subscription`: saved search, recipient route, schedule/event trigger and checkpoint.
- `search_alert_run`: authorization/index revision, new-result manifest, delivery link and outcome.
- `search_export`: session/query/scope/purpose/redaction/index checkpoint, result manifest, artifact/hash, expiry and access log.

## 4. Constraints

1. Every indexed document references exact source/projection version and outbox position.
2. Index events are idempotent by source/version/event; older out-of-order versions cannot replace newer.
3. Unauthorized/private fields are absent or irreversibly redacted in the audience projection, not merely hidden at response time.
4. Semantic embedding cannot exist for content disallowed by its model/provider/classification policy.
5. Query session binds current authorized-scope hash and authorization revision; revision change forces re-resolution.
6. Returned objects require a current source authorization decision; stale allow metadata alone is insufficient.
7. Facets/totals/suggestions derive only from authorized candidate partitions.
8. Cache identity includes purpose, authorization revision, projection/redaction policy and query/index point.
9. Tombstone completion covers lexical index, vector index, suggestions, snippets and query caches.
10. Saved search/share/alert never grants access and re-authorizes on each run.
11. Search export requires immutable result manifest and stricter capability/classification policy.
12. Query audit content follows dedicated privacy/retention policy and operator separation.
13. Search document/version is never referenced as authoritative input by L0–L3 domains.
14. Index rebuild records source cut, expected/actual counts, failures and completion proof.

## 5. Lifecycle

```text
projection event: QUEUED → INDEXING → INDEXED | FAILED_RETRYABLE | DEAD_LETTER
indexed version → SUPERSEDED | TOMBSTONED
search session: ACTIVE → EXPIRED
saved search: ACTIVE → DISABLED | ARCHIVED
export: REQUESTED → GENERATING → READY → EXPIRED | FAILED
```

Revocation invalidation is a priority control path distinct from ordinary indexing backlog.

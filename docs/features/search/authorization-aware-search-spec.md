# Strata — Authorization-Aware Search Specification

## 1. Purpose and boundary

This specification owns `CAP-11` and PS §4.9 search. Read it before indexing, querying, highlighting, suggesting, faceting, exporting, embedding or caching any Strata record.

Search owns disposable authorized discovery projections, indexing checkpoints, query planning, ranking/explanations, saved searches and search exports. Source domains own identity, content, lifecycle and authorization relationships. Search results are pointers with freshness—not authoritative facts. Source domains never depend on search to decide state.

## 2. Search surfaces

| Surface | Purpose | Default scope |
|---|---|---|
| Global search | Find records across supported domains | Current authorized resource set, not selected workspace alone |
| Domain search | Rich filters for documents, obligations, inspections, incidents, cases, etc. | Capability-specific |
| Within-document search | Exact/OCR text and anchors in one authorized document version | That document only |
| Suggestions/autocomplete | Help construct a query | Only authorized, non-sensitive vocabulary/objects |
| Similar/related | Lexical/semantic candidates | Advisory and authorization-filtered |
| Saved search/alert | Re-run governed query | Re-authorize at execution/delivery time |

Public search and authenticated internal/regulatory search use separate exposure policies/index projections. There is no “search everything then hide the record page.”

## 3. Canonical searchable projection

Each `search_document_version` represents one source object/version and contains:

- source domain/type/ID/version, tenant and stable target relationships;
- publication/lifecycle state and effective/event/recorded times;
- authorized text fields, structured facets, dates, codes and spatial references;
- language/script, OCR/native-text origin, confidence and source anchors;
- sensitivity/classification, projection policy/version and redaction labels;
- authorization partition keys/relationship revision—not user role strings;
- embedding/model version where semantic search is permitted;
- source outbox position, indexed time and tombstone/supersession state.

The projection never stores secrets, raw biometric/medical data, unapproved drafts in a published index, signing keys, unrestricted worker identity or fields forbidden for search. Different audiences may require distinct projections rather than one document with client-side hiding.

## 4. Authorization pipeline

```text
authenticate principal → require search capability/purpose
→ resolve current authorized resource partitions from canonical identity/access
→ execute query only within those partitions and allowed field/lifecycle policy
→ calculate hits, snippets, facets and suggestions over authorized candidates
→ current per-result authorization check for returned page
→ redact fields/snippets under response policy
→ audit sensitive/purpose-logged searches and return freshness
```

The selected tenant/mine/workspace narrows scope but never grants it. Request filters never enlarge authorized partitions. A regulator's mandate/jurisdiction and published-state policy apply to query, suggestions, counts, snippets and exports.

Authorization strategies may combine tenant/index partitioning, filterable authorized-resource sets and current `Check`/batch checks. The observable invariant is strict: an unauthorized object contributes nothing—not a hit, score, snippet, suggestion, facet count, total, spelling correction, related-record edge or timing-distinguishable response.

## 5. Revocation and fail-closed behavior

Search authorization projection lag is security-critical. Every index/checkpoint carries identity/relationship revision. On appointment, engagement, case-assignment, mandate, jurisdiction, classification or publication revocation:

1. canonical authorization denies immediately;
2. invalidation targets affected cached queries/projections;
3. result-time checks remove stale candidates; and
4. if current authorization cannot be established, restricted search fails closed.

Search may remain available for genuinely public data during authorization-service degradation. It must not fall back to stale allow decisions for restricted data. Previously downloaded/exported data follows export controls and cannot be magically recalled; the access remains auditable.

## 6. Query semantics

Supported query components:

- exact phrase, terms, prefix and language-aware normalized terms;
- field filters, controlled codes, dates/ranges, status and authority/source;
- mine/organization/contractor/asset and governed spatial filters;
- document/OCR page and clause/anchor search;
- lexical relevance and optional semantic/hybrid ranking;
- explicit sort by relevance/date/deadline/severity where fields are comparable; and
- as-of search only where the source domain exposes a valid historical projection.

Query syntax is parsed into a bounded AST; arbitrary backend query DSL, regex bombs, scripts and unrestricted wildcard are rejected. Limits cover query length, clauses, filters, result window, facets, export size and semantic candidates.

Status/date vocabulary is domain-qualified. “Open” for an incident is not assumed identical to an open CAPA. Cross-domain search uses canonical summary fields and routes to domain-specific filters.

## 7. Lexical, semantic and AI boundaries

Lexical search is the defensible default for statutory identifiers, names, exact clauses, form numbers and structured filters. Semantic/hybrid retrieval helps with conceptually similar hazards or differently worded passages, but:

- embedding input follows the same redaction/classification policy as searchable text;
- approved provider/location/model policy applies, and restricted content is not sent to an unapproved external model;
- model/version/chunk/source anchor and score are retained;
- semantic match is labelled, explainable and never treated as legal equivalence;
- low OCR/language quality reduces confidence rather than inventing certainty; and
- unavailable vector/model infrastructure falls back to lexical search where policy permits.

Search suggestions and “related records” are discovery signals. They do not merge defects, infer obligation applicability, establish recurrence or decide compliance.

## 8. OCR, multilingual and highlights

Native text and OCR remain distinct. Search indexes the reviewed/published OCR version allowed by source policy and retains page, bounding box/character offsets, OCR engine/version/confidence and supersession. A hit opens the exact authorized document version and anchor. Low-confidence OCR is marked in snippet/highlight and may be filtered.

English/Hindi normalization supports Unicode normalization, script/language detection, analyzers, synonyms and transliteration dictionaries that are versioned and human-governed. User text is never silently machine-translated into a legal equivalent. Exact identifier/code search bypasses stemming/transliteration changes.

Highlight fragments are generated only from fields the caller may see. Redacted terms cannot appear through neighboring context, HTML markup, cached fragments or OCR coordinates.

## 9. Ranking, facets and reproducibility

Ranking policy/version records field weights, freshness treatment, lexical/semantic blend and tie-breaking. It may promote severe/overdue/current records only when explicitly selected as operational sort; relevance must not secretly become risk priority.

Every response states:

- normalized query and applied authorized scope/filter summary;
- ranking/analyzer/model versions where material;
- source/index checkpoint and `indexed_through`/lag;
- partial/unavailable domains and OCR/semantic caveats; and
- stable cursor/search-session token for consistent pagination.

Facets and totals are calculated after authorization/redaction. Approximate counts are labelled. A fixed search session binds query, policy, authorization revision and index point-in-time; opening a live search later may change results.

## 10. Indexing, correction and deletion

Source domains emit idempotent upsert, supersede, withdraw, classification/visibility change and tombstone events with source version/outbox position. Indexers reject out-of-order older versions and record poison/dead-letter items. Rebuild uses authorized source projections and compares counts/hashes/checkpoints.

Withdrawal/supersession remains searchable only to audiences allowed historical state and is visibly labelled. Legal deletion/erasure accepted by the source produces a tombstone and cache/export impact; legal holds block deletion at source. Search does not decide retention.

An OCR/content correction creates a new projection version. Old snippets do not survive in autocomplete caches, embeddings or highlights after policy removal; invalidation coverage is monitored.

## 11. Saved searches, alerts and exports

A saved search stores query AST, intended scope/purpose, owner and presentation—not result IDs or authorization grants. On execution, resolve current authority and current index freshness. If the owner loses access, results disappear; shared saved searches require explicit authorized sharing.

Alerts identify newly matching authorized records and deliver pointers through workflow. Notification content follows its own redaction policy. Deduplication checkpoint is per saved search/source version; failure is visible and retryable.

Exports freeze query, authorized scope, policy, redaction, index/source checkpoint, result manifest and generator version. Export authorization and size/classification rules may be stricter than interactive read. Each export is audited and expires from download storage under policy.

## 12. Abuse, privacy and operability

- Rate-limit enumeration, broad wildcard, autocomplete and repeated zero/one probes.
- Detect high-volume cross-mine/person/document searches and unusual exports.
- Do not expose query logs broadly; queries themselves can contain sensitive names or allegations.
- Sanitize snippets/highlights and neutralize stored HTML/script content.
- Isolate tenant/public/restricted caches; cache keys include principal authorization revision, purpose, projection policy and query.
- Encrypt indexes/backups and control operator access; search administrators do not automatically receive content read rights.
- Monitor source-to-index lag, authorization-revision lag, tombstone latency, failed events, per-domain coverage, query latency/errors, zero-result rate, relevance feedback and unauthorized-candidate removals.

## 13. Capabilities

| Capability | Target |
|---|---|
| `search.query` | authorized resource set/domain |
| `search.query_sensitive` | classified domain/scope and purpose |
| `search.document_within` | document/version |
| `search.semantic` | approved corpus/scope |
| `search.saved.manage`, `search.saved.share` | saved search/scope |
| `search.alert.manage` | saved search/recipient route |
| `search.export` | query/scope/classification |
| `search.index.configure`, `search.index.operate`, `search.index.audit` | index/projection policy |

Index operation does not grant document/content read. Reindex jobs use a constrained service principal and purpose.

## 14. Acceptance scenarios

1. Unauthorized record contributes no total, facet, suggestion, snippet or timing-visible result.
2. Appointment revocation denies immediately despite stale index ACL metadata.
3. Authorization service unavailable fails closed for restricted search but public search remains available.
4. Regulator sees published records within mandate/jurisdiction, with worker identity redacted.
5. Contractor finds its own case/CAPA records, not mine-wide compliance.
6. Low-confidence OCR hit opens the exact page/box and displays confidence.
7. Hindi query finds governed Hindi/English synonyms while exact IDs remain exact.
8. Semantic similarity is labelled and cannot merge records or prove legal equivalence.
9. Facet totals equal authorized candidate set, not post-filtered visible page only.
10. Source correction invalidates snippet, embedding, suggestion and caches.
11. Stable pagination uses one query/index/authorization snapshot.
12. Saved search re-authorizes at execution; export freezes scope/policy/checkpoint manifest.

## 15. Non-goals

- Becoming source of truth, permission engine or compliance reasoning engine.
- Indexing every field merely because it exists.
- Using client-side hiding or post-search filtering as the primary security boundary.
- Claiming semantic similarity means duplicate, applicability, breach or precedent.
- Guaranteeing immediate search completeness without reporting index/source lag.

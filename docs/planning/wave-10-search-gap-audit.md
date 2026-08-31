# Wave 10 — Authorization-Aware Search Whole-System Gap Audit

## A. Outcome and boundary

Outcome: let authorized users find exact and conceptually related governance records without leaking that unauthorized records exist, while exposing index/source freshness and provenance. Search owns projections/discovery, never source facts or permissions.

## B. Real-world actor/accountability map

Domain owner defines searchable projection; privacy/security owners approve fields/audiences; search platform operator runs indexes without automatic content access; authenticated user/regulator/contractor/public user searches their projection; access/audit reviewers inspect purpose and abuse; source owner corrects content.

## C. Authoritative records and ownership

Source object/version remains authoritative. Search projection, fragments/embeddings, checkpoints, sessions/manifests, saved searches, alerts and exports are derived/control records. Authorization is resolved from canonical identity/access at query/result time.

## D. Lifecycle and handoff trace

```text
source event → approved projection/redaction → idempotent index/checkpoint
→ authorized query planning → authorized candidates/facets/snippets
→ current result check → result manifest/link to source
source correction/revocation → priority tombstone/invalidation → verified removal
```

## E. Physical/device/offline model

Search is online; offline clients use explicitly scoped encrypted packages from owning domains, not a copied global index. OCR scans retain page/box/confidence. Network/index outage shows partial/unavailable domains; cached restricted allows do not bypass current authorization.

## F. Authority and separation-of-duties matrix

Index operator cannot browse content by role. Projection publisher requires domain/privacy/security review. Query capability does not grant record read. Saved search/share/alert does not grant access. Export is stricter and audited. Regulator/contractor/public projections remain purpose/scoped.

## G. Failure, abuse and recovery scenarios

Tested: appointment revocation with stale ACL, authorization outage, stale/partial index, out-of-order event, poison document, OCR correction, classification change, deleted source, facet/autocomplete/count leak, cached snippet leak, cross-tenant wildcard, timing enumeration, semantic provider outage, saved-alert recipient loss and oversized export.

## H. Upstream/downstream dependency impacts

Upstream: identity/access and every indexed source domain/outbox. Downstream: unified portal navigation, dashboards, reporting/cases assistance and analytics. No source domain consumes search as fact. Wave 14 adds locale UX; Wave 15 hardens audit/security/DR.

## I. Gap register

### GAP-10-001

- **Gap:** no canonical source-version projection/index checkpoint contract.
- **Impact:** search results cannot prove origin, completeness or correction state.
- **Resolution:** versioned projection definitions/documents/fragments and per-domain checkpoints.
- **Status:** `RESOLVED`.

### GAP-10-002

- **Gap:** record-page authorization alone would leak titles/snippets/counts/facets/suggestions.
- **Impact:** restricted mine, worker, incident, case and regulator data is enumerable.
- **Resolution:** pre-aggregation authorized candidate partitions plus current result checks/redaction.
- **Status:** `RESOLVED`.

### GAP-10-003

- **Gap:** access revocation and index/cache ACL lag had no fail-closed path.
- **Impact:** transferred/revoked users retain discovery access.
- **Resolution:** authorization revision binding, priority invalidation, current checks and restricted outage denial.
- **Status:** `RESOLVED`.

### GAP-10-004

- **Gap:** OCR, multilingual normalization, semantic embeddings and highlights lacked provenance/policy.
- **Impact:** false matches, leaked redactions and semantic claims presented as legal equivalence.
- **Resolution:** anchored confidence-bearing fragments, versioned analyzers/models and labelled advisory similarity.
- **Status:** `RESOLVED`.

### GAP-10-005

- **Gap:** query/facet/ranking/pagination results lacked reproducible scope/freshness.
- **Impact:** pages drift, counts mislead and official exports cannot be defended.
- **Resolution:** sessions/manifests bind query, authorization revision, policies and index point-in-time.
- **Status:** `RESOLVED`.

### GAP-10-006

- **Gap:** correction/withdrawal/deletion did not cover vectors, suggestions, snippets and caches.
- **Impact:** removed sensitive content remains discoverable.
- **Resolution:** multi-surface tombstone/invalidation with verification proof.
- **Status:** `RESOLVED`.

### GAP-10-007

- **Gap:** saved searches, alerts and exports could preserve or redistribute stale authority.
- **Impact:** revoked users/recipients receive restricted results later.
- **Resolution:** re-authorization each run/delivery and manifest-bound stricter exports.
- **Status:** `RESOLVED`.

### GAP-10-008

- **Gap:** exact production search engine, language analyzers, embedding deployment and relevance thresholds need corpus/security evaluation.
- **Impact:** architecture cannot claim relevance, scale or data-residency fitness without tests.
- **Resolution:** provider-neutral logical contract fixed; implementation/evaluation assigned to Wave 15 and locale tuning Wave 14.
- **Status:** `ACCEPTED_RISK`.

## J. Decisions requiring human approval

1. Each domain owner approves searchable lifecycle/fields and source projection.
2. Privacy/security owners approve audience redaction, embeddings/provider, logs and export policy.
3. Identity owner approves authorization partition/revision and outage behavior.
4. Product/domain/locale owners approve ranking, analyzers, synonyms and relevance evaluation corpus.

## K. Canonical documents that must change

Feature, logical model, API/indexes, authorization, glossary, capability/inventory, decisions, dependency boundary and tracker.

## L. Exit verdict

**Pre-design verdict: FAIL.** OCR/search intent existed, but no secure cross-domain index, revocation, freshness or deletion contract did.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-10-001 through 007 are resolved. GAP-10-008 remains an explicit Waves 14/15 implementation/evaluation dependency.

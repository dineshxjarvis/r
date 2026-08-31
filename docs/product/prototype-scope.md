# Strata — Bare Minimum for the Expected Solution

**What this is:** the irreducible feature set required to answer PS 26024's Expected Solution (`docs/context/problem-statement.md` lines 49–57) and PART 4. Anything not on this list is deferred, and the reason is stated.

**What a tick means:** the item is **built**. Nothing is ticked yet.

Spec status is separate and is stated on each feature's `Spec:` line. A feature can be fully specified and still entirely unbuilt — that is currently true of every item on this list.

**Tiers:**

| Tier | Meaning |
|---|---|
| **0** | Spine. The PS cannot be answered without it |
| **1** | Named in the Expected Solution paragraph. Needed, smaller |
| **2** | In PART 4 but not in the Expected Solution. Deferred, with reasons |

---

## Tier 0 — the spine

### BF-1 · Identity, appointments and authorisation
`docs/context/problem-statement.md` §4.15 · Spec: `docs/features/access-control/authorization-spec.md`, `docs/features/access-control/identity-governance-spec.md` §2

- [ ] ReBAC type model, tuples, Check
- [ ] Time-bounded appointments as the source of every permission window
- [ ] Outbox sync from Postgres to the graph, plus rebuild
- [ ] Closure authority ladder, and authority-issued findings structurally unclosable by operator authority
- [ ] **User directory** — how ~20 role labels across 5 user groups become real accounts, get found, get addressed
- [ ] Onboarding and credential issue for field users

### BF-2 · Asset hierarchy and per-site configuration
`docs/context/problem-statement.md` §4.15, ES bullet 1 · Spec: `docs/features/access-control/identity-governance-spec.md` §8 (partial)

- [ ] Subsidiary → area → mine → subunit → bench, with parent edges
- [ ] Tenant isolation in both the graph and row-level security
- [ ] **Configuration surface** — the actual screens or files that onboard a mine
- [ ] Per-site applicable obligation set, checklist variants, escalation chain
- [ ] Acceptance test: onboard a mine with zero code changes

### BF-3 · Obligation register and dated instances
`docs/context/problem-statement.md` §4.1 · Spec: `docs/features/compliance/obligation-register-spec.md`, `docs/features/compliance/register-extensions-spec.md`

- [ ] Obligation vs instance, with `shared_obligation_id` and dedup rollup
- [ ] Materialisation on a rolling horizon; periodicity separate from due rule
- [ ] Two-field state model: `status` lifecycle plus `reconciliation` verdict
- [ ] Applicability engine with `UNRESOLVED` triage
- [ ] Negative evidence (NIL returns), diffing, conflict detection, change impact, load forecasting

### BF-4 · Document ingest, extraction, review, publish
ES bullet 5, `docs/context/problem-statement.md` §4.9 · Spec: `docs/features/document-intelligence/pipeline-spec.md`, `docs/features/document-intelligence/extraction-spec.md`

- [ ] Content-addressed immutable store; nine-stage pipeline
- [ ] OCR with layout and confidence; segmentation with provenance anchors
- [ ] Extraction with mandatory grounding check; per-field anchors and confidence
- [ ] Human review gate before anything goes live
- [ ] Supersession, versioning, manifest signing
- [ ] Indic-language handling beyond English–Hindi

### BF-5 · Field capture — offline, geo-bound, time-bound
ES bullet 3, `docs/context/problem-statement.md` §4.4 · Spec: `docs/features/field-operations/field-capture-spec.md`

- [ ] Offline queue, resumable upload, append-only evidence semantics
- [ ] Location as a claim with accuracy, provider, constellation and mock flag — never a bare point
- [ ] Three-clock time model; offline capture bounded to a provable interval, not a false instant
- [ ] In-app camera with hash-at-capture; gallery imports capped at `UNVERIFIED`
- [ ] Layered anti-spoofing including raw GNSS signal checks and device attestation
- [ ] Per-device hash chain with server-side continuity verification
- [ ] Four-level verdict model, closure blocking, signed override path
- [ ] Opencast / underground split — RFID reader graph, topological position, Reg 40(3)
- [ ] **Assigned-task list** — what this person personally owes today
- [ ] **Multilingual interface** for users who do not read English
- [ ] Production entry as a capture type (§4.7 / BF-16)
- [ ] Surface attendance — only belowground Reg 40(3) is covered

### BF-6 · Defect, finding and CAPA lifecycle
`docs/context/problem-statement.md` §4.2, §4.3 · Spec: `docs/features/defect-management/defect-spec.md`

- [ ] Four-object model: observation, defect, finding, CAPA
- [ ] Entity resolution proposing candidates; never auto-merge
- [ ] Ageing from first observation; recurrence against closed defects
- [ ] Mandatory requirement reference on every finding
- [ ] Verified closure: evidence required, verifier ≠ assignee, geofence checked
- [ ] Condition-triggered escalation following the graph hierarchy

### BF-7 · Evidence store
`docs/context/problem-statement.md` §3.6, §4.14 · Spec: `docs/features/document-intelligence/pipeline-spec.md` §3.2 + `docs/features/field-operations/field-capture-spec.md` §5

- [ ] Content-addressed document storage, sealed, deduplicated
- [ ] Per-device hash chain from capture, plus periodic Merkle root with RFC 3161 anchoring
- [ ] Asset-level geofence with per-asset radius from the asset register
- [ ] Evidence bound to obligation instance, defect or CAPA at capture time
- [ ] Retroactive invalidation — every manifest that relied on a spoofed hash is findable

### BF-8 · Workflow: reminders, escalation, approvals, delivery
ES bullet 4, `docs/context/problem-statement.md` §4.12 · Spec: `docs/features/workflow-spec.md`, with domain conditions in `docs/features/compliance/obligation-register-spec.md` §6 and `docs/features/defect-management/defect-spec.md` §9

- [ ] Escalation conditions and chains, derived from the hierarchy
- [ ] **Notification delivery** — which channels, to whom, with what fallback
- [ ] Reminder scheduling ahead of deadlines, not only after
- [ ] Rate limiting and digesting, so volume never becomes ignorable
- [ ] Digital approvals with recorded identity, timestamp and decision
- [ ] Delegation with a recorded trail

### BF-9 · Dashboards at three altitudes
ES bullet 1, `docs/context/problem-statement.md` §4.11 · Spec: `docs/features/dashboard-spec.md`

- [ ] Field / supervisor: what I owe today, what is pending sync, what is overdue on me
- [ ] Mine official: site compliance status, open violations by severity, overdue CAPAs, items awaiting approval
- [ ] Corporate and regulator: comparative status, risk ranking, recurring themes, aggregate trend
- [ ] Every displayed number traceable down to the records that produced it
- [ ] Read-only external regulator view, published state only

### BF-10 · Audit trail and time-travel
ES bullet 5, `docs/context/problem-statement.md` §4.14 · Spec: `docs/features/access-control/identity-governance-spec.md` §4–§5

- [ ] Append-only, database-enforced; corrections supersede, never overwrite
- [ ] Hash chain with externally-published head
- [ ] Time-travel by event replay
- [ ] Purpose-logged regulator access, denials logged
- [ ] Break-glass with mandatory review

---

## Tier 1 — named in the Expected Solution

### BF-11 · Risk and recurrence analytics
ES bullet 2, `docs/context/problem-statement.md` §4.10 · Spec: `docs/features/defect-management/defect-spec.md` §5, §11

- [ ] Rule-based risk scoring, labelled honestly as rule-based
- [ ] Recurrence detection across location, contractor, shift and verifier
- [ ] Behavioural signals on the process itself
- [ ] Every output explained and routed to a named person
- [ ] Anomaly detection on reported operational data (depends on BF-16)

### BF-12 · Statutory report generation
`docs/context/problem-statement.md` §4.13 · Spec: **NONE**

- [ ] Generation of periodic returns from records already in the system
- [ ] Pre-submission validation for missing or inconsistent inputs
- [ ] Every generated report retained as a permanent record of what was submitted
- [ ] Exact regeneration of any historical report
- [ ] Zero manual re-entry of data the system already holds

### BF-13 · GIS and spatial view
ES bullet 5, `docs/context/problem-statement.md` §4.16 · Spec: **NONE** — but the geofence rule is already load-bearing in `docs/features/defect-management/defect-spec.md` §10.2

- [ ] Map view of mines, zones and monitoring points
- [ ] Inspections, violations, incidents and observations plotted at captured locations
- [ ] Spatial clustering of repeated problems
- [ ] Boundary verification that field activity occurred where claimed

### BF-14 · Contractor register
`docs/context/problem-statement.md` §4.5 · Spec: **NONE** — `docs/features/defect-management/defect-spec.md` already assumes `responsible_org` exists

- [ ] Contractor registry with scope, contract validity and site assignment
- [ ] Mandatory document tracking with pre-expiry alerts
- [ ] Worker registry with training validity and site-access eligibility
- [ ] Attribution of findings and CAPAs to the responsible contractor
- [ ] Cross-site safety record that a rename cannot launder

### BF-15 · Attendance and field presence
ES bullet 3, `docs/context/problem-statement.md` §4.6 · Spec: **NONE**

- [ ] Location-verified attendance capture, including contract labour
- [ ] Zone-level presence where safety-relevant
- [ ] Reconciliation between claimed presence and captured evidence
- [ ] Aggregation for reporting and contractor billing verification

### BF-16 · Production and environmental capture
`docs/context/problem-statement.md` §4.7 · Spec: **NONE** — routes into BF-6

- [ ] Structured production and dispatch capture at defined intervals
- [ ] Structured environmental readings against permitted limits
- [ ] Threshold breach automatically raised as a violation through the standard pathway
- [ ] Historical trend per parameter, per site

---

## Tier 2 — deferred, with reasons

| Item | Reason |
|---|---|
| Grievance handling (§4.8) | In PART 4, absent from the Expected Solution paragraph |
| Search | Same |
| Export and integration API | Same |
| All eight external integrations | `docs/integrations/system-landscape.md` recommends mocking two or three and demonstrating the pattern |
| Public transparency view | Not in the PS at all |
| Underground RFID reader graph | Field capture depth beyond the bare minimum |
| 3D terrain, volumetric deviation, satellite change detection | Geospatial depth beyond the bare minimum |
| Star Rating alignment | Nice alignment argument, not a required capability |

---

## Status

| | Count |
|---|---|
| Tier 0 features | 10 |
| Tier 1 features | 6 |
| **Fully spec'd** | **9** — BF-3, BF-4, BF-6, BF-7, BF-8, BF-9, BF-10, BF-11, and BF-5 bar two sub-items |
| **No spec at all** | **4** — BF-12, BF-13, BF-14, BF-16 |
| **Partial** | **3** — BF-1, BF-2, BF-15 |

**The shape of the gap:** capture, reasoning, delivery and decision surfaces are now specified end to end. The remaining gaps are mine onboarding/configuration, statutory report output, contractor records, and the production, spatial and attendance inputs those surfaces will eventually consume.

---

## Grilling order

| Order | Feature | Why here |
|---|---|---|
| ~~1~~ | ~~BF-5 field capture~~ | **Done** — `docs/features/field-operations/field-capture-spec.md` |
| ~~1~~ | ~~BF-8 workflow, delivery and directory~~ | **Done** — `docs/features/workflow-spec.md` |
| ~~2~~ | ~~BF-9 dashboards~~ | **Done** — `docs/features/dashboard-spec.md` |
| 1 | BF-2 configuration surface | The "adding a mine is configuration, not development" acceptance test |
| 2 | BF-12 statutory reports | The only output that leaves the system |
| 3 | BF-14 contractor register | `defect-spec` and `field-capture-spec` both already assume it exists |
| 4 | BF-16, BF-13, BF-15 remainder | Tier 1 tail |

**Rule for grilling:** where a feature overlaps an existing spec, the existing spec is read alongside and either confirmed or amended. No feature gets a second, competing description of something already specified.

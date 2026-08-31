# Strata — BF-9 Three-Altitude Dashboard Specification

**Component:** Operational views for field staff, mine officials, corporate management and regulators  
**Companion to:** Obligation Register Spec · Defect Ledger Spec · Directory, Delivery and Workflow Spec · Identity and Governance Spec  
**Status:** Design spec, ready to build

---

## 0. Read this first

**What this component is:** a set of decision surfaces over records owned by the obligation, defect, field, workflow and risk components. It does not own a second copy of compliance state.

**Why three altitudes exist:** the field worker needs to know the next action; the mine official needs to know what is failing at one site; corporate management and regulators need to know where limited attention should go across many sites. Putting all three into one configurable dashboard produces a dense report that serves none of them.

**The single rule everything else follows:**

> **Every number is a link, not a claim.**

A user can move from a tile to the exact records included in its numerator and denominator, see the filters and as-of time, and explain why the number has that value. A compliance percentage that cannot be decomposed is decoration, not governance.

Three terms:

| Term | Meaning |
|---|---|
| **Altitude** | The level at which a user acts: personal queue, one operational site, or a portfolio of sites |
| **As-of time** | The latest event included in a value; distinct from when the screen was rendered |
| **Metric manifest** | The stored definition, scope, filters, numerator record IDs, denominator record IDs and as-of time behind one rendered value |

---

## 1. Where this sits

The dashboard is a read model. Canonical state remains with the domain that created it:

| Dashboard shows | Source of truth |
|---|---|
| Obligation lifecycle and reconciliation | Obligation Register Spec §4 |
| Findings, CAPAs, severity, ageing and recurrence | Defect Ledger Spec §5–§11 |
| Pending mobile sync and evidence verdicts | Field Capture Spec §3 and §6 |
| Notifications, acknowledgements and approvals | Directory, Delivery and Workflow Spec §4 and §7 |
| Appointments, scope and published regulator state | Identity and Governance Spec §2, §6 and §8 |
| Metrics, risk/anomaly signals and explanations | [`analytics/analytics-and-ai-governance-spec.md`](analytics/analytics-and-ai-governance-spec.md) |

The dashboard may cache or pre-aggregate these records for speed. It may not invent a parallel lifecycle, let a user directly edit a total, or turn stale cached state into an apparently live value.

### 1.1 The three questions

Each altitude answers one question:

1. **Field / supervisor — “What must I do next?”**
2. **Mine / area — “What at my site needs intervention?”**
3. **Corporate / regulator — “Where should we look first, and why?”**

Anything that does not help answer the altitude's question belongs in drill-down, not on its landing page.

### 1.2 One record, several honest views

The same overdue severe CAPA may appear:

- as the assignee's top task at field altitude;
- in the mine's severe-open and overdue-CAPA totals;
- as one explained input to the mine's portfolio risk score; and
- in the regulator view only after it reaches published state.

These are projections of one CAPA, not four dashboard records. Closing it once changes every authorised view after the read model catches up.

---

## 2. Non-negotiable semantics

### 2.1 Scope comes from authorisation

The selected scope is the intersection of what the user requested and what the authorisation graph allows. The dashboard follows Identity Spec §8.3: resolve viewable mines once, then filter every query by those mine IDs and `tenant_id`.

Rules:

- A mine user cannot broaden a URL filter to another mine.
- An area or subsidiary total contains only descendant mines the user may view.
- A contractor sees only records linked to its active engagements; contractor data is not a fourth management altitude.
- A regulator sees published state only, purpose-logged, with worker identities redacted by default.
- A tile is hidden when the user cannot view its subject. A visible tile never links to a drill-down the same user is forbidden to open.

### 2.2 Every value carries context

Every tile, chart point and table total exposes:

| Context | Requirement |
|---|---|
| Scope | Named mine, area, subsidiary, region or personal queue |
| Period | Explicit start/end, or an explicit point-in-time snapshot |
| As-of time | Latest included event and read-model refresh time |
| Definition | Human-readable formula and metric version |
| Population | Numerator and denominator counts; “not applicable” treatment |
| Freshness | `LIVE`, `DELAYED`, `OFFLINE_GAPS` or `SNAPSHOT` |
| Drill-down | Exact included record set, subject to the same permissions |

No unlabelled “real-time” badge exists. A dashboard with two offline inspectors and a six-hour-old environmental feed says so.

### 2.3 Unknown is not zero

| Situation | Display |
|---|---|
| No records should exist for the selected period | `0` |
| Records are expected but ingestion or sync is incomplete | `DATA INCOMPLETE` |
| Metric is not applicable to the selected scope | `NOT APPLICABLE` |
| User is not authorised to see the value | Do not render it |
| Denominator is zero | `—`, never `0%` or `100%` |

This distinction is mandatory. Converting missing evidence into a green zero is the dashboard version of silently losing a paper file.

### 2.4 Current state and historical truth are separate modes

**Operational mode** shows the latest accepted events and is used to act now. **As-of mode** reconstructs state at a selected historical instant through Identity Spec §5 time-travel.

The mode and timestamp remain visible while drilling down. A user may not select last quarter on a chart and land on today's record state without a warning. Historical values are reproducible even after obligations, appointments or severities change.

### 2.5 Counts never silently double-count

- A defect reported by three observations counts as one open defect, with three observations visible below it.
- An obligation shared across two instruments uses `shared_obligation_id` for the deduplicated roll-up defined by the Obligation Register Spec.
- A finding with two CAPAs counts as one finding and two CAPAs; it stays open until both CAPAs are verified closed.
- A recurring defect is a new defect linked to the earlier closed one. It counts once in open load and once in recurrence analysis.
- One record can appear in multiple severity or status breakdowns only when the chart explicitly declares overlapping cohorts.

---

## 3. Field and supervisor altitude

### 3.1 Landing view — a queue, not a chart wall

The first screen is ordered work:

1. `SEVERE` or authority-issued items requiring acknowledgement or action;
2. work overdue on the current person;
3. work due today;
4. returned or rejected submissions requiring correction;
5. approvals or verifications awaiting the current appointment;
6. upcoming work within its reminder window.

The default sort is **action priority**, then deadline, then age. It is never alphabetical and never “most recently created,” because neither answers what should happen next.

Each row contains only what can change the next action: subject, asset, severity, due time, current state, why it is in the queue, offline availability, and the action available to this user.

### 3.2 Required summaries

| Summary | Definition | Drill-down |
|---|---|---|
| Due today | Owned actionable items whose effective due date falls in the user's local site day | The ordered queue |
| Overdue on me | Owned obligations/CAPAs past due and not terminal | Exact overdue records with age |
| Awaiting my verification | Submitted items for which the current appointment has authority and no-self-verification passes | Verification queue |
| Awaiting my approval | Open approval objects resolved to the user's current post | Approval queue |
| Pending sync | Locally committed capture events not yet server-acknowledged | Device outbox with retry state |
| Sync failures | Events rejected or blocked during sync | Reason and safe recovery action |

“Pending sync” is device state, so the server dashboard may show the latest reported device count but the mobile client owns the authoritative local count. When those differ, both timestamps are shown.

### 3.3 Supervisor mode

A supervisor can switch from `Mine` to `My team`, derived from current appointments and reporting relations. It adds:

- unassigned actionable work;
- overdue items grouped by responsible post, not just person name;
- team members whose devices have not synced within the configured window; and
- severe notifications still unacknowledged.

This does not grant the supervisor authority to perform the subordinate's statutory action. The action button still follows an authorisation `Check` at action time.

### 3.4 Offline behaviour

The last synchronised queue remains available offline and is labelled with its snapshot time. Items captured locally appear immediately with `PENDING SYNC`. If a server-side reassignment or closure occurred while offline, sync resolves it through the Field Capture Spec's append-only conflict rules; the client never discards the local event.

---

## 4. Mine and area altitude

### 4.1 Landing view — intervention board

The landing page presents, in this order:

1. active severe findings and authority-issued items;
2. overdue CAPAs and obligations, split by severity;
3. items awaiting the current official's approval or verification;
4. compliance position with evidence quality visible beside it;
5. upcoming obligation load and likely capacity pressure; and
6. recurring defects and integrity/process flags.

An area official sees the same structure with mine comparison first and can descend to a mine. The area total is computed from records, not from averaging mine percentages.

### 4.2 Compliance position — no single green percentage

At minimum, show four adjacent values:

| Measure | Formula |
|---|---|
| **Verified compliance rate** | `SATISFIED / eligible due instances` |
| **Submission rate** | `(SUBMITTED + SATISFIED + EVIDENCE_MISMATCH) / eligible due instances` |
| **Overdue load** | Count of `OVERDUE` and `ESCALATED` eligible instances |
| **Unsupported-claim load** | Count of `CLAIMED_UNSUPPORTED` reconciliation verdicts |

For these formulas:

```text
eligible due instances = instances with due_on <= period_end
                       − NOT_APPLICABLE
                       − valid WAIVED instances
```

`DUE`, `OVERDUE`, `ESCALATED`, `SUBMITTED`, `SATISFIED` and `EVIDENCE_MISMATCH` all remain visible in the status distribution. A waiver is shown separately; it does not improve compliance. An unresolved applicability decision remains in a visible `UNRESOLVED` cohort and is excluded from the percentage until decided.

**Why submission and verified compliance are separate:** filing a document is not proof that the obligation was met. Combining them rewards unsupported paperwork.

### 4.3 Required mine views

| View | Minimum breakdown |
|---|---|
| Open findings | Severity, age band, requirement category, issuing authority |
| CAPA load | On time / due soon / overdue / submitted for verification / reopened |
| Obligation calendar | Due date, owner post, expected effort, state, evidence status |
| Approval inbox | Subject, requester, required post, waiting time, statutory-signature flag |
| Recurrence | Asset, hazard category, occurrence count, contractor, shift, prior verifier |
| Process integrity | Repeated extensions, rejected verifications, override rate, zero-finding inspections |
| Delivery health | Severe unacknowledged, failed channels, unmanned posts, digest suppression volume |
| Data freshness | Offline devices, stale feeds, pipeline backlog, last successful reconciliation |

Process-integrity indicators are prompts for review, never accusations. Their drill-down displays the firing rule and supporting records, as required by the Defect Ledger Spec §11.2–§11.3.

AI/analytics tiles additionally show output type, use-case/model/rule version, source coverage/freshness, comparator or material factors, uncertainty/limitations and expiry. They never replace verified domain metrics or hide a deterministic baseline. A suspended/expired signal disappears from action ranking but remains in authorized historical audit.

### 4.4 Workload forecast

The next 7, 30 and 90 days show materialised obligation instances by due date, owner post, severity and estimated effort where available. An ownerless instance is not placed in an “unassigned” drawer and forgotten: it is a visible configuration failure and routes through BF-8's unmanned-post handling.

### 4.5 Area comparison

The area view ranks mines only on a selected, named measure. Default columns:

- verified compliance rate and its denominator;
- severe open findings;
- overdue CAPAs per 100 open CAPAs;
- recurrence rate per 100 closed defects;
- unsupported claims;
- read-model and field-sync freshness; and
- explained risk score.

Raw counts remain available, but rankings use a defensible denominator wherever activity volume differs. A large mine should not look worse merely because it produces more records.

---

## 5. Corporate altitude

### 5.1 Portfolio landing view

The corporate view begins with exceptions across subsidiaries and mines:

- sites with active severe or authority-issued findings;
- sites whose risk band changed materially;
- sites with worsening verified compliance trend;
- recurring themes across more than one site;
- overdue load normalised by obligation or CAPA population;
- data-quality blind spots; and
- escalations with no acknowledged recipient.

The default is **attention order**, not a league table. Risk is decision support, not a public score of mine managers.

### 5.2 Risk ranking must explain itself

Every row shows:

| Field | Requirement |
|---|---|
| Score and band | Current rule-based score, honestly labelled |
| Movement | Change over the selected comparison period |
| Top drivers | The largest contributing signals in plain language |
| Coverage | Whether required source feeds were present |
| Records | Drill-down to the findings, CAPAs, recurrence and incident inputs |
| Model version | Weight/rule version used for this value |

A site with missing inputs is not ranked as low risk. It is marked **INSUFFICIENT COVERAGE** and remains visible near the top of the attention queue.

### 5.3 Trends and comparisons

- Compare rates on consistent period boundaries and time zones.
- Show denominator and coverage when hovering or focusing a point.
- Never compare current partial month with a completed previous month without an explicit partial-period label.
- Preserve the metric version used for each historical point; if a definition changes, do not silently redraw history.
- Allow a like-for-like cohort filter such as opencast/underground, subsidiary, obligation category or production band.
- Clearly label any operational denominator that depends on BF-16 data and is therefore unavailable until that component exists.

### 5.4 Recurring themes

Themes aggregate linked records across mines by statutory requirement, hazard category, asset/equipment class, contractor, shift or verifier. Each theme states:

- how matching was determined;
- number of distinct defects and sites;
- earliest and latest occurrence;
- whether cases recurred after verified closure; and
- the records and sites behind the aggregate.

Free-text clustering may propose a theme, but a human confirms it before the theme is used for management reporting. This follows the defect resolver's “system proposes; human disposes” rule.

---

## 6. Regulator altitude

### 6.1 It is a separate product surface

The monitoring view is not the corporate dashboard with buttons disabled. It is a purpose-logged, non-mutating projection of **published state** across the mines covered by the viewer's current mandate and jurisdiction. A separate participating-authority workspace exposes only actions granted by capability, mandate, jurisdiction and record state.

It prioritises:

- authority-issued findings and their closure state;
- severe published findings;
- overdue or unsupported statutory obligations;
- recurrence after a published verified closure;
- inspection and evidence history relevant to the stated access purpose; and
- risk-ranked queues with explanations and coverage warnings.

### 6.2 Publication boundary

| Visible | Not visible by default |
|---|---|
| Published obligation state and supporting evidence approved for disclosure | Draft observations and unpublished internal notes |
| Published findings, CAPAs and closure evidence | Internal deliberation and draft corrective plans |
| Responsible appointment or organisation | Individual worker identity |
| Full history of the regulator's own raised finding | Unrelated contractor commercial information |
| Metric manifest for every aggregate | Hidden or unauthorised source records |

If an aggregate includes both published and unpublished records, the regulator's value is recomputed from published records. The system never shows a corporate total and then deny access to some of its ingredients.

### 6.3 Purpose and audit

Before data loads, the regulator supplies one of the closed purpose codes from Identity Spec §6. The purpose, scope, filters, exports and record reads are audited. Denied drill-downs are audited too.

Exports carry the as-of time, purpose, scope, redaction policy, metric versions and a manifest reference. A screenshot without those facts is not an official extract.

---

## 7. Drill-down and traceability contract

### 7.1 The interaction

Every aggregate supports this path:

```text
portfolio value
  → subsidiary / area / mine contribution
  → filtered record list
  → canonical record and its event history
  → evidence, requirement provenance and authorised actions
```

The breadcrumb retains scope, period, filters, as-of mode and freshness. Back navigation returns to the identical manifest, not to a newly recomputed value that may have changed underneath the user.

### 7.2 Metric manifest

For a rendered aggregate, retain:

```text
manifest_id
metric_key + metric_version
viewer_scope + effective_authorised_scope
period_start + period_end + as_of
filters
numerator_record_refs
denominator_record_refs
excluded_record_refs + exclusion_reasons
source_watermarks
computed_at
```

The manifest is append-only and retained long enough to reproduce official views and exports. For a live operational tile, creating one on every refresh is unnecessary; create it when the user drills down, exports, shares a saved view, or the value enters an approval/report.

### 7.3 Corrections

If a source record is corrected, new live manifests use the superseding event. An old manifest continues to reproduce what the user saw at that time and links to the later correction. History is explained, not rewritten.

---

## 8. Freshness, performance and failure handling

### 8.1 Freshness is per source

A page can contain fresh CAPAs and stale environmental readings. Therefore freshness is carried per metric or cohort, not only as one global “last updated” time.

| Label | Meaning |
|---|---|
| `LIVE` | Event projection is within the configured operational lag |
| `DELAYED` | Source watermark is behind that lag |
| `OFFLINE_GAPS` | Known field devices hold or may hold unsynchronised events |
| `SNAPSHOT` | Deliberately frozen historical or official view |

Thresholds are configured per source. A 15-minute delay may matter for a severe finding but not for a quarterly obligation trend.

### 8.2 Projection lag

Writes commit to the canonical domain store first and feed dashboard projections through an outbox. Immediately after a material action, the acting surface shows the committed result and a `UPDATING DASHBOARD` state until the projection watermark includes that event. It does not pretend the old tile is current.

### 8.3 Partial failure

One failed widget must not blank the whole dashboard. The failed value renders `UNAVAILABLE`, its last successful as-of time, and a retry path. Cached values may be shown only with a stale label. Errors never fall back to zero.

### 8.4 Saved views and exports

Saved views store filters and metric versions, not copied totals. Opening one recomputes current mode or reconstructs its fixed as-of mode. CSV/PDF exports inherit row-level security and redaction, and every export is audited.

---

## 9. Interaction, language and accessibility

- Field surfaces use the person's preferred language from the directory; site language is the fallback. Domain identifiers, statutory references and user-entered evidence are not machine-translated into false certainty.
- Colour never carries state alone. Severity and trend use an icon, label and text equivalent.
- Tables, filters, tooltips and charts are keyboard reachable and expose screen-reader names.
- Charts always have a tabular equivalent containing the same values and denominators.
- Dates display in the mine's configured time zone; cross-site views state the reporting boundary used.
- A severe item remains prominent without animation or alarm styling that makes the screen unusable.
- The inspector/field-worker app preserves the action queue and critical context before secondary information. Responsive web layouts serve other roles; their dedicated mobile pages are `TBD`.

---

## 10. Configuration and ownership

### 10.1 Configurable without code

- mine hierarchy and comparison cohorts;
- obligation and CAPA due-soon windows;
- per-source freshness thresholds;
- severity-aware ageing bands from the owning domain specs;
- dashboard language and site time zone; and
- which published evidence classes a regulator may view.

### 10.2 Not configurable by ordinary users

- canonical state meanings;
- verified compliance formula;
- whether waivers improve compliance — they do not;
- published-state boundary;
- authority or row-level scope;
- risk drivers and weights without a versioned governance change; and
- removal of traceability or freshness labels.

Personal layout preferences may reorder secondary cards. They may not hide severe, authority-issued, overdue-on-me or data-incomplete conditions from the landing view.

---

## 11. Failure modes

| Failure | Handling |
|---|---|
| One universal dashboard for every role | Three fixed altitudes with role-specific landing questions |
| Green compliance score includes merely submitted items | Verified and submitted rates shown separately |
| Missing feed produces zero incidents | `DATA INCOMPLETE`, coverage warning, never zero |
| Area percentage is average of mine percentages | Recompute from area numerator and denominator records |
| Three observations inflate defect count | Count canonical defects; observations drill down beneath them |
| User can see a total but not its ingredients | Recompute from records visible to that user or hide the total |
| Regulator aggregate includes internal drafts | Recompute from published state only |
| Large mine ranks worst because it has more activity | Use rate with visible denominator; retain raw count beside it |
| Old cached data appears live | Per-metric freshness and as-of watermark |
| Risk score falls when a source stops reporting | `INSUFFICIENT COVERAGE`; missingness never lowers risk |
| Metric definition changes and history moves | Version definitions; preserve historical manifest semantics |
| Offline field work is absent from management view | `OFFLINE_GAPS` warning and last known device watermark |
| User changes a URL to another tenant | Authorised-scope intersection plus row-level security denies |
| Historical drill-down opens current state | As-of mode and timestamp persist through the whole path |
| Chart cannot be read without colour or a mouse | Labels, keyboard path and equivalent table are mandatory |

---

## 12. Scope

### In

- [ ] Three distinct altitude landing views and navigation contracts
- [ ] Personal action queue, pending sync, overdue, verification and approval views
- [ ] Mine intervention board, compliance position, CAPA load and obligation forecast
- [ ] Area, subsidiary and corporate comparisons with defensible denominators
- [ ] Explained risk ranking and cross-site recurrence themes
- [ ] Separate published-state regulator surface with purpose-logged access
- [ ] Traceability from every aggregate to authorised canonical records
- [ ] Versioned metric definitions and reproducible manifests
- [ ] Operational and historical as-of modes
- [ ] Per-metric freshness, offline gaps and partial-failure states
- [ ] Multilingual, accessible and mobile-responsive presentation
- [ ] Audited saved views and exports

### Out — with reasons on the slide

- **A no-code dashboard builder.** Fixed decision surfaces protect metric meaning; arbitrary charts can come later.
- **Public transparency portal.** Not required by the problem statement and has a different disclosure model.
- **Star Rating replication.** Useful future alignment, but it is a separate assessment framework and must not be implied by internal compliance metrics.
- **Operational production and environmental charts before BF-16.** The surface is ready to consume them; inventing data ownership here would make the dashboard the source of truth.
- **GIS map layers.** BF-13 owns the spatial view; this spec defines links into it, not its behaviour.
- **Natural-language “ask your data.”** Search convenience cannot precede governed metric definitions and traceable answers.
- **Leaderboards for people.** They incentivise gaming and confuse workload with performance.

---

## 13. Tests

| # | Scenario | Expected |
|---|---|---|
| 1 | Field user opens the app | Ordered personal action queue, not corporate charts |
| 2 | Two severe items and ten minor items are due | Severe items first; minor work remains visible below |
| 3 | Capture committed offline | Appears locally as `PENDING SYNC`; no false server acknowledgement |
| 4 | Supervisor views team queue | Sees team work but cannot perform a statutory action without authority |
| 5 | Mine has 80 eligible instances: 50 satisfied, 10 submitted, 20 overdue | Verified rate `62.5%`; submission rate `75%`; overdue load `20` |
| 6 | Ten waived instances are added | Waivers shown separately and do not improve verified compliance |
| 7 | Mine A is 9/10 and Mine B is 1/100 verified | Area rate is `10/110`, not average of 90% and 1% |
| 8 | Three observations resolve to one defect | Open defect count increases by one |
| 9 | One finding has two CAPAs | Finding count one, CAPA count two; labels explicit |
| 10 | Tile is selected | Exact authorised numerator, denominator and exclusions are available |
| 11 | User drills from last quarter | Every level stays in last-quarter as-of mode |
| 12 | Metric formula changes | New points use new version; old official snapshot reproduces exactly |
| 13 | Environmental feed stops | Value is `DATA INCOMPLETE`; risk does not improve |
| 14 | Two field devices have not synced | Relevant metrics show `OFFLINE_GAPS` and device watermarks |
| 15 | Dashboard projection lags a just-closed CAPA | Action confirms; tile says updating until watermark passes event |
| 16 | One projection query fails | One tile unavailable; rest of the page remains usable |
| 17 | Mine user edits URL to another mine | Denied by scope intersection and row-level security |
| 18 | Regulator opens dashboard | Purpose required before data loads |
| 19 | Regulator views corporate-style compliance aggregate | Value is recomputed from published records only |
| 20 | Regulator drills into a worker-linked record | Worker identity redacted by default |
| 21 | Risk ranking opened | Score, version, coverage, drivers and supporting records shown |
| 22 | Large and small mine compared | Rate and denominator shown; raw count does not drive default rank |
| 23 | Keyboard-only user opens a trend | Can reach points and equivalent data table |
| 24 | Denominator is empty | Displays `—`, not green `100%` |
| 25 | Official export generated | Contains scope, as-of, purpose/redaction where relevant, versions and manifest reference |

**Tests 5, 7, 10, 13 and 19 are the ones a judge will probe.**

---

## 14. Three sentences for the jury

> **One.** We did not build one dashboard with three login screens: the field worker gets an ordered action queue, the mine manager gets an intervention board, and corporate or the regulator gets an explained portfolio view, because those people make different decisions.

> **Two.** Our compliance rate counts independently verified obligations, not documents merely uploaded, and every percentage opens into its numerator, denominator, exclusions and evidence — even the green number has to prove itself.

> **Three.** Missing data never makes a mine look safe: offline devices, stale feeds and unpublished records are visible coverage gaps, while the regulator's totals are recomputed strictly from published state and every access carries a stated purpose.

# Strata — Register Extensions Specification

**Component:** Applicability, negative evidence, cross-mine diffing, conflict detection, change impact, load forecasting
**Depends on:** Obligation Register and Due-Instance Engine Specification (the core; this document does not restate it)
**Companion to:** Extraction Specification · Authorisation Specification
**Status:** Design spec, ready to build

---

## 0. Read this first

**What this component is:** the Obligation Register Specification owns the spine — obligation, instance, materialisation, state, reconciliation, escalation. This document owns the six things that hang off that spine and are each easy to leave out until the register is already in production and wrong.

| § | Extension | The question it answers |
|---|---|---|
| 2 | Applicability engine | Which mines does this obligation actually bind? |
| 3 | Negative evidence | How is "nothing happened" proved? |
| 4 | Cross-mine diffing | Why does this mine have 12 more duties than a comparable one? |
| 5 | Conflict detection | Do two of our duties contradict each other? |
| 6 | Regulatory change impact | This rule just changed — what breaks? |
| 7 | Load forecasting | Are we about to be buried in March? |

**Why these are one document rather than six:** every one of them reads the register and writes nothing to it directly. They are lenses over the register, and each one is a place where a naive implementation quietly produces confident wrong numbers.

**The single rule everything else follows:**

> **A wrong obligation is worse than a missing one.**

An obligation applied to a mine it does not bind generates a due date, an alert, an overdue flag, an escalation and a finding — all fictional, all consuming somebody's afternoon. Do that a few times and the Environment Officer stops reading the alerts, at which point the real ones are invisible too. Every extension here is tuned against that failure.

---

## 1. Where this sits

```
                        OBLIGATION REGISTER (the spine)
                                    │
        ┌───────────┬───────────────┼───────────────┬───────────┬───────────┐
        ▼           ▼               ▼               ▼           ▼           ▼
   APPLICABILITY  NEGATIVE      DIFFING        CONFLICT      CHANGE      LOAD
      (§2)        EVIDENCE       (§4)         DETECTION      IMPACT    FORECAST
        │           (§3)                          (§5)         (§6)       (§7)
        │            │                             │            │
        │            │                             └────────────┴──► REVIEW QUEUE
        ▼            ▼                                                 (human)
   gates materialisation   satisfies instances
```

Applicability runs **before** materialisation and decides whether instances exist at all. The other five read instances that already exist. Conflict detection and change impact write only to a review queue — never to live obligations.

---

## 2. Applicability engine

### 2.1 Dimensions

Applicability is evaluated at materialisation time, not at extraction time. Extraction captures the condition as written; the register decides which mines it binds.

| Dimension | Example |
|---|---|
| Mine type | Opencast only, underground only |
| Production scale | Above a stated tonnage threshold |
| Persons employed | Above a stated headcount |
| Permission held | Only mines holding a specific clearance |
| Gassiness class | Degree I / II / III |
| Named mines | A cluster clearance naming its members explicitly |
| Geography | Mines within a notified forest area |
| Contractor presence | Only where contract labour is engaged |
| Depth, method, seam | Where a regulation is method-specific |

### 2.2 Rules

**Unresolved is a state, never a default.** If applicability cannot be determined — the clause says "mines of a certain category" and the category is defined in an annexure that did not OCR — the value is `UNRESOLVED` and it goes to a triage queue. It is never silently `ALWAYS`.

`ALWAYS` looks safe and is not. It over-applies, which is precisely the failure named in §0.

**Applicability inputs are live and change under you.** A mine crossing a production threshold gains obligations; a lapsed clearance removes them. So:

- Re-evaluate on any change to a mine attribute, and on a schedule
- **Gaining applicability generates future instances only.** Never backfill an obligation the mine did not owe at the time, or you manufacture historical non-compliance out of a data update.
- **Losing applicability deactivates future instances and leaves past ones untouched.** They were owed when they were owed.
- Every applicability change is an audited event naming the attribute that changed. "Why did 14 duties appear at this mine overnight" must have an answer.

### 2.3 Explain, always

Every applicability decision carries its reason, for both outcomes:

```
Obligation applies to 14 of 47 mines.
  Excluded 33:  22 below the production threshold
                 8 underground, condition is opencast-only
                 3 no EC clearance on record
```

An unexplained exclusion is indistinguishable from a bug, and this is the screen where a compliance officer decides whether to trust the register at all.

---

## 3. Negative evidence

### 3.1 The problem

A significant share of statutory duties are discharged by reporting that **nothing happened**:

| Duty | Discharged by |
|---|---|
| Report reportable accidents periodically | "No reportable accident in this period" |
| Groundwater quality return | "No exceedance detected" |
| Contractor workforce change return | "No change this period" |
| Explosive usage log | NIL entry for a week with no blasting |

Without an explicit NIL, **silence means unknown**. The system cannot distinguish a mine that had no accidents from a mine that did not report. Regulators mandate NIL returns for exactly this reason, and a register that cannot represent one will show a clean site as non-compliant, which is the fastest way to have the register dismissed.

### 3.2 Design

`NIL_RETURN` is an evidence type alongside document, form entry, photo, lab result and system log. It carries the declarant, the timestamp, and a declaration statement — not a free-text note.

Rules:

- **Only obligations flagged `nil_permitted` accept a NIL return.** A plantation target is not dischargeable by declaring that no planting occurred. This flag comes from extraction and is confirmed at review.
- **A NIL return is a signed statement of fact, not a checkbox.** It is an attestation, and where the underlying return is statutory it carries the same signature requirement as any other submission.
- **NIL returns are visually distinct at every altitude** — never rendered identically to evidenced satisfaction. A verifier must be able to question one exactly as they would question a document.
- **NIL contradicted by another record is a finding.** A NIL accident return for a period in which an incident record exists is not a data-quality warning; it is a false statutory declaration, and it must escalate as one.

That last rule is the one that makes negative evidence worth building. Cross-checking declarations against the system's own records is a class of catch that paper cannot perform at all.

---

## 4. Cross-mine diffing

### 4.1 What it answers

- Why does this mine carry 12 more duties than a comparable one?
- After this expansion, which duties newly apply?
- Which mines in this cluster are missing the post-clearance conditions?

The third is the valuable one. **A missing obligation is invisible by construction** — nothing is overdue, nothing is red, the mine looks compliant. Diffing against a peer is the only way to see the absence, and it is the same structural insight as omission detection in the Extraction Specification Addendum A3: a reviewer cannot see what is not on the screen.

### 4.2 Design

Compare obligation sets, not instance counts. Instance counts differ for legitimate reasons — periodicity, mine age, when the clearance was granted.

Group the result three ways: **shared**, **A only**, **B only** — and for every exclusive item, state which applicability dimension caused it. A diff without reasons is a list of numbers that generates a meeting; a diff with reasons ends the question on the screen.

**Comparability matters.** Diffing a large opencast against a small underground returns a hundred differences, all correct and none informative. Default the peer selection to same mine type, same subsidiary, comparable production band, and let the user override deliberately.

**Where a difference has no applicability explanation, that is the finding.** Two comparable mines under one clearance where one lacks a condition means either an applicability rule is wrong or a document was never ingested. Route it to review, flagged as unexplained — never present it as a neutral difference.

---

## 5. Statutory conflict detection

### 5.1 Scope, stated honestly

**In scope: numeric and scheduled parameters.** Two limits for one pollutant, two deadlines for one submission, two frequencies for one test. These are machine-comparable, and a real answer is achievable.

**Out of scope: semantic contradiction in prose.** Deciding whether two differently-worded duties conflict in substance is unsolved, and a system that claims it will be wrong in ways nobody can predict. Say so on the slide.

### 5.2 What is detected

| Type | Example |
|---|---|
| Conflicting limit | One instrument sets a dust limit of 150, a later one sets 100, both apparently in force |
| Conflicting deadline | Two instruments require the same data on different dates |
| Conflicting frequency | Quarterly under one rule, monthly under another |
| Duplicate submission | Two authorities requiring substantively the same return |
| Resource collision | One named owner holding many duties due the same day |

The last is not a legal conflict but it is the one an Environment Officer will thank you for, and it falls out of data the register already holds.

### 5.3 Rules

- **Detection proposes; a human decides.** Output is a review item, never an automatic edit to a live obligation.
- **Where a resolution rule exists, state it and its basis** — a later instrument generally supersedes an earlier one, the stricter limit generally governs. State the basis, do not apply it silently.
- **Duplicate submission is a reporting-burden finding, not a compliance failure.** Both returns are still owed. The finding is that the same data is being compiled twice, which is exactly the duplication the problem statement names.
- Conflicts are stable objects with a status — `OPEN`, `RESOLVED`, `ACCEPTED_AS_INTENDED`. Re-reporting the same known conflict every night is how the queue becomes wallpaper.

### 5.4 Cost

Pairwise comparison across a full register is quadratic and will not finish. Block by category, parameter and applicability overlap first; compare within blocks only. Two duties that bind no common mine cannot conflict.

---

## 6. Regulatory change impact

### 6.1 What it answers

A circular, amendment or gazette notification arrives. Before anyone changes anything: **which obligations reference the amended source, how many live instances are affected, at which mines, and what happens to each?**

### 6.2 Flow

```
  AMENDING DOCUMENT ──► extraction ──► what changed, to which source, effective when
                                              │
                                              ▼
                                    IMPACT ASSESSMENT (read-only)
                                    obligations · instances · mines · states
                                              │
                                              ▼
                                       REVIEW QUEUE (human)
                                              │
                        ┌─────────────────────┼─────────────────────┐
                        ▼                     ▼                     ▼
                 new obligation         no change            deactivate
                 version, future        (clarification)      superseded duty
                 instances regenerate
```

### 6.3 Rules

- **Assessment is read-only.** It never mutates an obligation. The problem statement's own audit requirement makes silent rule changes indefensible, and a rule that changes under a live instance is a rule nobody can be held to.
- **Amendment creates a new version, linked; it never edits in place.** Future instances regenerate under the new rule; past instances stay correct under the rule that applied when they were due. This is the mechanism that makes time-travel truthful, and it is specified in the Obligation Register Specification §3.2.
- **Effective date drives the split**, not the ingestion date. A notification loaded three weeks late still takes effect from its stated date, and instances due in that window need explicit adjudication rather than a silent recompute.
- **Nothing propagates automatically, at any confidence.** An extractor misreading "within 15 days" as "within 50 days" would, with auto-propagation, silently relax a deadline across every affected mine.
- **The impact summary is retained** as the record of what was known when the decision was taken.

### 6.4 Where changes come from

The Extraction Specification's `cross_refs` field is what makes this work: obligations carry the statutory references they derive from, so an amendment to a named rule finds them. Free-text matching on source strings will miss half of them — the reference must be structured at extraction time, or this feature is unreliable by construction.

---

## 7. Obligation load forecasting

### 7.1 Why it is not decoration

Indian fiscal year-end concentrates duties. March carries annual returns, quarter-end returns and half-year returns simultaneously. **A mine that misses obligations in March usually missed them because thirty landed in one week on one Environment Officer**, not because anybody decided to skip them. Forecasting turns that from a post-mortem into a plan.

This is also the cheapest genuinely-predictive thing in the product: the instances already exist with their due dates, so the forecast is arithmetic, not inference. Label it as such.

### 7.2 Design

Count future instances by week, by mine, by severity, and by **named owner** — the owner breakdown is the actionable one, because the fix is redistribution and redistribution is per person.

Peaks are relative to the site's own baseline, not a fixed number. Twenty duties in a week is routine at a large mine and a crisis at a small one, so the threshold is a multiple of that owner's rolling median.

Two refinements worth the effort:

- **Weight by effort, not by count.** A NIL return and a six-monthly compliance report are both one instance and are not the same afternoon. A coarse three-level effort estimate per obligation is enough to make the forecast honest.
- **Carry forward what is already overdue.** A peak week arriving on top of an existing overdue backlog is a different problem from a peak week on a clean slate, and the forecast is misleading if it shows only new arrivals.

Deduplicate rollups by `shared_obligation_id`, using the single shared rollup function specified in the Obligation Register Specification §2.1. Every aggregate in this document goes through it. A forecast that triple-counts a cluster clearance is worse than no forecast, because someone will staff against it.

---

## 8. Failure modes

| Failure | Handling |
|---|---|
| Applicability defaults to `ALWAYS` when unresolved | Not permitted. `UNRESOLVED` plus triage |
| A mine crosses a production threshold | Future instances only; never backfill |
| A clearance lapses | Future instances deactivated; past instances retained |
| NIL return accepted for a duty that cannot be discharged by one | Blocked by the `nil_permitted` flag |
| NIL accident return contradicted by an incident record | Escalates as a false declaration, not a data-quality note |
| Diff between incomparable mines | Peer defaults to comparable; overrides are deliberate |
| A difference with no applicability explanation | Flagged as unexplained and routed to review, never shown as neutral |
| Conflict detection reports the same known conflict nightly | Conflicts carry status; `ACCEPTED_AS_INTENDED` stops re-reporting |
| Pairwise conflict scan does not finish | Block by category, parameter and applicability overlap before comparing |
| Amendment auto-applied to live obligations | Not permitted. Review queue only |
| Amendment loaded after its effective date | Effective date governs; the affected window is adjudicated explicitly |
| Forecast triple-counts a cluster clearance | Every aggregate calls the shared dedup rollup |
| Forecast shows a clean week that is actually buried in backlog | Overdue carry-forward is part of the forecast, not a separate screen |

---

## 9. Scope

### In

- [ ] Applicability rules across all dimensions in §2.1, with `UNRESOLVED` and triage
- [ ] Re-evaluation on attribute change, future-only effect, fully audited
- [ ] Applicability explanation for both inclusion and exclusion
- [ ] `NIL_RETURN` evidence type, gated by `nil_permitted`, visually distinct
- [ ] NIL contradiction check against the system's own records, escalating as a finding
- [ ] Cross-mine diffing on obligation sets, with per-difference reasons and comparable peer defaults
- [ ] Unexplained-difference flagging as a missing-obligation candidate
- [ ] Conflict detection on numeric and scheduled parameters, with blocking to keep it tractable
- [ ] Conflict objects with lifecycle status
- [ ] Read-only regulatory change impact assessment, retained as a record
- [ ] Versioned amendment with future-only regeneration
- [ ] Load forecast by week, mine, severity and owner, effort-weighted, with overdue carry-forward
- [ ] Every aggregate routed through the shared dedup rollup

### Out — with reasons on the slide

- **Semantic contradiction detection in prose.** Tractable for parameters, unsolved for language. §5.1.
- **Automatic conflict resolution.** Supersession and strictness rules are stated, not applied. A wrongly-resolved statutory conflict is a legal exposure.
- **Automatic amendment propagation.** Excluded deliberately; §6.3 gives the reason.
- **Cross-obligation dependency graphs** ("condition 17 cannot be satisfied until 12 is"). Real in some clearances, genuinely complex, roadmap.
- **Learned load forecasting.** The instances are already dated. Counting them is exact; predicting them would be worse.
- **Automatic redistribution of ownership.** The forecast surfaces the peak; a human reassigns. Reassigning statutory duties automatically is not a thing software should do.

---

## 10. Tests

| # | Scenario | Expected |
|---|---|---|
| 1 | Applicability unresolvable from the clause | `UNRESOLVED` + triage. **Never `ALWAYS`** |
| 2 | Mine crosses a production threshold | Future instances generated; no historical backfill |
| 3 | Clearance lapses | Future instances deactivated; past instances unchanged |
| 4 | Applicability changes overnight | Audited event names the attribute that changed |
| 5 | Applicability screen for a partially-applicable obligation | Exclusion counts and reasons shown |
| 6 | NIL return on a plantation target | Rejected — not `nil_permitted` |
| 7 | NIL return on a monthly accident return | Accepted, rendered distinctly, verifiable |
| 8 | NIL accident return for a period with an incident on record | **Escalates as a false declaration** |
| 9 | Diff of two comparable mines under one cluster clearance | Differences listed with applicability reasons |
| 10 | A difference with no applicability explanation | Flagged unexplained; routed to review |
| 11 | Diff against an incomparable mine | Peer default is comparable; override required |
| 12 | Two instruments, two dust limits, overlapping applicability | Conflict raised with both sources and the supersession basis stated |
| 13 | Two duties binding no common mine | No conflict raised |
| 14 | A conflict marked `ACCEPTED_AS_INTENDED` | Not re-reported on the next run |
| 15 | Amendment ingested | Impact counts produced; **zero live obligations mutated** |
| 16 | Amendment approved | New version; future regenerates; past untouched |
| 17 | Amendment loaded three weeks after its effective date | Effective date governs; the window is adjudicated explicitly |
| 18 | Forecast across a cluster clearance | Deduplicated by `shared_obligation_id` |
| 19 | Peak week detection at a small mine | Relative to that site's baseline, not a fixed count |
| 20 | Forecast for an owner with an existing overdue backlog | Backlog carried forward into the week's load |

**Tests 1, 8 and 15 are the ones a judge will probe.**

---

## 11. Three sentences for the jury

> **One.** An obligation applied to a mine that does not owe it produces a fake deadline, a fake alert and a fake escalation — so applicability is explained for every mine included and every mine excluded, and an unresolvable rule goes to a human rather than quietly defaulting to "applies to everyone."

> **Two.** We can find the duty that is missing, which is the one thing a compliance dashboard structurally cannot show you: nothing is overdue and nothing is red, so we diff a mine against its peers under the same clearance and flag the difference nobody can explain.

> **Three.** When a rule changes we tell you exactly what it touches — how many obligations, how many live instances, at which mines — and then we change nothing until a person decides, because a deadline that silently relaxes itself because an extractor misread a number is precisely the failure this system exists to prevent.

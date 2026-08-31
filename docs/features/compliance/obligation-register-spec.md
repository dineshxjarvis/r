# Strata — Obligation Register & Due-Instance Engine Specification

Environmental measurements and limit evaluations are owned by the [environmental monitoring specification](../environment/environmental-monitoring-spec.md). A validated result or within-limit evaluation may be submitted as evidence, but it never auto-satisfies an obligation; this domain applies the obligation's verification and closure policy.

**Component:** The spine — turns extracted duties into live, dated, trackable work
**Depends on:** Document Pipeline spec (obligations arrive from §3.6 Extract)
**Companion to:** Authorisation Specification
**Status:** Design spec, ready to build

---

## 0. Read this first

**What this component is:** the document pipeline produces an `OBLIGATION` — an abstract duty extracted from a clause, e.g. *"plant 40 hectares, six-monthly."* That single sentence is useless on a dashboard. Nobody can act on "plant 40 hectares" in the abstract. Somebody needs to know: **for which mine, by which date, has it been done, and if not, why not.**

That conversion — one abstract duty into concrete, dated, trackable work items — is this component.

**The two objects, and why they must stay separate:**

| Object | What it is | How many exist |
|---|---|---|
| `OBLIGATION` | The abstract duty, as written in the clause | One per clause |
| `OBLIGATION_INSTANCE` | That duty, materialised for one mine, one period, with a real due date | Many — one per mine per period |

A six-monthly EC condition at one mine generates **two instances a year.** The same condition, if it binds three mines under a cluster EC, generates six. **The instance is the only row a dashboard ever counts.** Get this distinction wrong and every number on every screen is wrong.

**One-line explanations of two things you'll see below:**

- **Reconciliation, in one line:** comparing what the mine *says* it did (the compliance report) against what the register believes is actually true (evidence, or its absence) — and being honest when those two things disagree.
- **Materialisation, in one line:** the act of generating the dated instances from the abstract obligation, the way a recurring calendar event generates individual meetings.

---

## 1. Where this sits

```
DOCUMENT PIPELINE                    THIS COMPONENT                      DOWNSTREAM
                                                                          
  EC letter ──extract──► OBLIGATION ──materialise──► INSTANCE ──┬──► DASHBOARD
                          (abstract)     (this)      (dated,        (counts these)
                                                       per mine)
                                                          │
                                                          ├──► overdue? ──escalate──► FINDING
                                                          │                          (defect ledger)
                                                          │
                                                          └──► evidence arrives ──► reconciled
```

This component owns the **middle box**: obligations in, instances out, and the perpetual question of whether each instance is satisfied.

---

## 2. The obligation — recap and additions

Arrives from the document pipeline with the fields already specified there (deontic type, owner role, periodicity, evidence type, due rule, applicability). This component adds the fields needed to actually generate instances:

| Field | Purpose | Example |
|---|---|---|
| `scope` | Mine, or project (spans mines) | `PROJECT` |
| `shared_obligation_id` | Links instances generated from one clause across multiple mines | groups Gevra + Dipka rows |
| `anchor_event` | What the period counts from | `financial_year_start`, `grant_date`, `mine_opening_date` |
| `grace_period_days` | Days after due date before `OVERDUE` fires | `0` for most; `15` where CMR allows |
| `superseded_by` | Points to the replacement obligation, if amended | null, or an obligation ID |
| `active` | Whether this obligation is currently in force | `true` / `false` |

### 2.1 Scope — the open question, now answered

The authorisation spec flagged this as unresolved. Here's the resolution, stated plainly so it can be checked against a real cluster EC before you build:

> **The obligation is recorded at its natural legal scope. The instance always materialises at mine level.**

A project-scope obligation (cluster EC covering three mines) generates one instance **per mine, per period**, all sharing a `shared_obligation_id`. This is not a compromise — it's necessary, because compliance is physically discharged at a mine (that plantation is on that mine's land) even when the legal instrument names a project.

**Why this matters for every count on the dashboard:** a rollup at subsidiary level must deduplicate by `shared_obligation_id` or it will count the same legal duty three times and overstate non-compliance threefold. Every aggregate query in this component carries that dedup rule. Write it once, in one place, and have every dashboard call through it — don't let each screen re-implement the rollup.

---

## 3. Materialisation

### 3.1 The engine

For each active obligation, generate future instances on a rolling window (12 months ahead is enough — you don't need instances for 2031 sitting in the table).

```python
def materialise(obligation, mine_id, horizon_months=12):
    instances = []
    for period in periods_between(
        obligation.anchor_event_date(mine_id),
        horizon_months,
        obligation.periodicity,
    ):
        due = period.end + obligation.due_rule.offset
        instances.append(ObligationInstance(
            obligation_id=obligation.id,
            shared_obligation_id=obligation.shared_obligation_id,
            mine_id=mine_id,
            period=period,
            due_on=due,
            status="PENDING",
        ))
    return instances
```

**Periodicity is not the due rule.** This is the mistake the diagrams caught earlier — two obligations can share `periodicity: six_monthly` and have completely different `due_rule`s:

| Obligation | Periodicity | Due rule | Due date example |
|---|---|---|---|
| Plantation target | six_monthly | end of period | 31 March |
| EC compliance report | six_monthly | 30 days after period end, per MoEFCC O.M. 6 Apr 2011 | 1 June / 1 December |

If your engine only stores periodicity, both generate the same due date and one of them is wrong. Store both fields, always.

### 3.2 Re-materialisation on amendment

When an obligation is superseded (a DGMS circular amends a periodicity, an EC corrigendum changes a target):

- **Future** instances (not yet due) regenerate under the new rule
- **Past** instances (already due or satisfied) are untouched — they were correct under the rule that applied when they were due
- The obligation record links old → new via `superseded_by`, and both remain queryable

This is what makes "what were our obligations as of March 2026" answerable even after the rule has since changed — the same principle as document supersession, applied one layer up.

### 3.3 Deactivation

A mine closes, an EC condition is time-limited and expires, a mine plan commitment is fulfilled and closed out. Set `active = false`. Stop generating new instances. **Do not delete existing ones** — closure-plan-era duties and their history are themselves subject to inquiry long after a mine stops producing.

---

## 4. Instance states — the canonical model

**This section is the single source of truth for instance state.** The Extraction Specification §8 produces reconciliation verdicts, and the defect ledger consumes escalated instances; both refer here rather than defining their own vocabulary.

The earlier feature list flagged "negative evidence" as a real problem: a system that can only say satisfied-or-not cannot distinguish a genuine safety gap from a missing piece of paperwork. That distinction is encoded here, in the state machine itself, not bolted on afterwards.

### 4.1 Two fields, not one

The mistake that produces three competing vocabularies is trying to express two independent facts in one column. They are independent:

| Field | Answers | Set by |
|---|---|---|
| `status` | Where is this instance in its lifecycle? | The system, plus authorised human acts |
| `reconciliation` | Does what the mine *claimed* agree with what we can *see*? | Reconciliation, when a compliance report is processed. Null until then |

An instance can be `OVERDUE` **and** carry `CLAIMED_UNSUPPORTED`. Collapsing them into one column forces a choice between two true statements.

### 4.2 `status` — the lifecycle

```
UPCOMING ──► DUE ──► SUBMITTED ──► SATISFIED
   │          │          │
   │          │          └──(evidence rejected)──► EVIDENCE_MISMATCH ──► (resubmit)
   │          │
   │          └──(due date + grace passes, nothing filed)──► OVERDUE ──► ESCALATED
   │
   └──► NOT_APPLICABLE   (human, named, reason required)
   └──► WAIVED           (authority, reason, bounded to this period)
```

| State | Means | Who moves it |
|---|---|---|
| `UPCOMING` | Materialised, period not yet open | System |
| `DUE` | Period open, actionable now. **This is what a field task list shows** | System |
| `SUBMITTED` | Evidence filed. The mine says it is done | Owner |
| `SATISFIED` | Evidence checked and accepted by someone other than the submitter | Verifier |
| `EVIDENCE_MISMATCH` | Something was filed; it does not satisfy this obligation | Verifier |
| `OVERDUE` | Past due plus grace, nothing filed | System |
| `ESCALATED` | Overdue long enough, or severe enough, to have become a finding | System, then the defect ledger owns it |
| `NOT_APPLICABLE` | A human with authority ruled this obligation does not bind this mine | Env Officer / Manager |
| `WAIVED` | It does bind, and is formally excused for this period only | Subsidiary authority |

**`SUBMITTED` and `SATISFIED` are separate states, deliberately.** "The mine says it is done" and "someone independent agrees" are different facts, and merging them reproduces the current paper failure at speed. The verifier must not be the submitter — the same rule as CAPA closure in the defect ledger.

**`NOT_APPLICABLE` and `WAIVED` are not synonyms.** Not-applicable means the duty never bound this mine. Waived means it did and was excused. Conflating them loses the fact that an excuse was granted, by whom, and for how long.

**`NOT_APPLICABLE` requires a named person and a reason, always.** Never a silent default. It is the state most likely to be abused to make a dashboard look clean, so it carries the most friction to reach.

### 4.3 `reconciliation` — claim against evidence

Set when a compliance report for the period is processed. Null before that, and null for obligations no report covers.

| Verdict | Claimed | Evidence | Why it is its own verdict |
|---|---|---|---|
| `AGREED` | Complied | Present and matching | The uninteresting case |
| `CLAIMED_UNSUPPORTED` | Complied | Absent | Said done, nothing to show for it |
| `UNREPORTED` | Not stated | Present | Done and not claimed — usually a reporting gap, occasionally a filing error |
| `GAP` | Not stated | Absent | Nobody claims it and nothing shows it |
| `DISPUTED_APPLICABILITY` | Not applicable | Applicability rules say otherwise | The mine believes it does not bind them; the register disagrees |
| `EVIDENCE_MISSING` | — | Absent, but an independent signal suggests the work was done | Satellite imagery shows the plantation; no file exists |

**`EVIDENCE_MISSING` is a filing gap; `GAP` is a work gap.** That is the whole distinction, and it is the most valuable output in the component. A dashboard showing 400 red items where 380 are filing gaps gets switched off. One that says *"12 real gaps, 388 documentation gaps"* gets used — and it is a far more honest thing to put in front of a regulator.

`CLAIMED_UNSUPPORTED` deserves naming separately: a six-monthly report says "complied" and the register has no evidence file behind it. That is precisely the gap the CAG found at national scale in post-clearance monitoring — reports say things happened and nobody checks. Surfacing it automatically, per condition, per mine, is a direct answer to a documented, sourced failure.

### 4.4 Severity vocabulary

Where an instance carries a severity — for escalation and for closure authority once it becomes a finding — the vocabulary is `MINOR` / `SIGNIFICANT` / `SEVERE`, matching the defect ledger and the closure ladder in the Authorisation Specification §7. There is one severity vocabulary in this system.

---

## 5. Reconciliation

The compliance-report extraction (document pipeline §3.6) produces **claimed** status per condition — what the mine says happened. This component holds what the register **believes** — based on evidence, or the lack of it.

These two are not the same thing, and the gap between them is often the most useful signal in the whole system.

Reconciliation writes the `reconciliation` verdict from §4.3. **It never overwrites `status`** — the two fields are independent, and an instance may legitimately be `OVERDUE` while carrying `CLAIMED_UNSUPPORTED`.

```python
def reconcile(instance, claimed_status, evidence_refs, external_signal=None):
    """Returns a reconciliation verdict. Never mutates instance.status."""
    if not evidence_refs:
        if claimed_status == "COMPLIED":
            return "CLAIMED_UNSUPPORTED"      # said done, nothing to show for it
        if external_signal and external_signal.suggests_done:
            return "EVIDENCE_MISSING"         # filing gap, not a work gap
        if claimed_status == "NOT_APPLICABLE" and applies_to(instance):
            return "DISPUTED_APPLICABILITY"
        return "GAP"                          # nobody claims it, nothing shows it

    match = evidence_matches_obligation(instance.obligation, evidence_refs)
    if match < THRESHOLD:
        return "EVIDENCE_MISMATCH_VERDICT"    # see note below
    if claimed_status == "NOT_STATED":
        return "UNREPORTED"                   # done and not claimed
    return "AGREED"
```

> **Note on the mismatch case.** A failed evidence match is both a lifecycle fact and a reconciliation fact. The lifecycle transition to `EVIDENCE_MISMATCH` is made by the verifier, not by reconciliation — reconciliation only records that the claim and the evidence disagree, and routes it for review. Reconciliation never moves an instance backwards through its lifecycle on its own authority.

**Run reconciliation as a downstream step of document publish, never of upload.** Reconciling before extraction has finished races the extractor and produces verdicts against a half-populated report.

---

## 6. Escalation — condition-triggered, not timer-based

Consistent with the defect ledger: items climb because a condition is met, not because a clock ran out.

```
OVERDUE for > grace_period_days           → escalate to Safety/Env Officer level
OVERDUE and severity(obligation) = SEVERE → escalate directly to Manager level
EVIDENCE_MISMATCH on a safety-critical obligation → escalate immediately, any age
Recurs (same obligation, same mine, 2nd consecutive period OVERDUE) → escalate one level higher than the first time
```

On escalation, an `ObligationInstance` creates or links to a `Finding` in the defect ledger, carrying its `obligation_id`, `mine_id`, `due_on`, and how many periods it's been recurring. From there it follows the same closure-authority rules as any other finding — see the authorisation spec §7. A mine can no more self-close an escalated obligation than it can self-close a DGMS-raised finding, if the underlying obligation derives from a regulator-issued document.

---

## 7. Authorisation walkthrough

Continuing the pattern from the document pipeline spec — graph answers relationship, app answers state.

### Case 1 — Env Officer marks an instance NOT_APPLICABLE

```
Check(user:a_verma, env_officer, mine:gevra_ocp)  → ALLOW (valid appointment)
```
App then requires a reason string, non-empty, logged with `actor`, `instance_id`, `reason`, `timestamp`. The graph permits the *action*; the app enforces the *evidence trail* around it. Never let the graph check stand in for the audit requirement.

### Case 2 — Area GM views obligation load across the whole area

```
ListObjects(user:area_gm_korba, viewer, type: obligation_instance)
  → walks: area_gm → area:korba → parent → {mines} → internal_viewer → instance.viewer
  → returns every instance at every mine in Korba area
```
This is the expensive query flagged in the authorisation spec — call it once for the *mine set*, then filter instances in Postgres by `mine_id IN (...)`. Never call Check per instance for a dashboard of thousands of rows.

### Case 3 — Regulator queries obligations tied to their own permission

```
Check(user:dgms_bsp_04, published_viewer, obligation_instance:inst_x)
  → inspector from covering_region, AND instance.status != DRAFT-equivalent
  → ALLOW, logged with purpose
```
But the regulator's view is filtered further at the app layer: they see instances derived from **their own issuances** and from CMR generally, not, say, an internal mine-plan commitment with no regulatory source. That filter is a property of the obligation's `source_doc.issuing_body`, not a graph relation — another case of "app answers what's true about the data."

### Case 4 — Contractor asks to see their own obligations

Contractors generally don't hold obligations directly — obligations attach to the mine, and CAPAs (owned by a person) can be assigned to a contractor's supervisor. So:
```
Check(user:mahalaxmi_sup_1, assigned_to, capa:gev_c_0311)
  → ALLOW if the CAPA tuple names them directly
```
No mine-wide obligation visibility follows from a contractor engagement. This is deliberate — a contractor should never see the full compliance posture of a mine he merely works at.

---

## 8. Failure modes

| Failure | Handling |
|---|---|
| Obligation amended mid-period | Only future instances regenerate; in-flight instance keeps the rule active when it was created |
| Cluster EC discovered after mines already have separate instances | Backfill `shared_obligation_id`; never delete the existing instances, just link them |
| Evidence arrives for an instance already `NOT_APPLICABLE` | Flag for review — someone may have marked it inapplicable wrongly |
| Two different obligations generate near-identical due dates and look like duplicates | Obligation diffing (§ from feature list) surfaces this as a candidate merge; don't auto-merge obligations the way you auto-cluster defects — legal duties are not the same kind of entity resolution problem |
| `due_rule` can't be parsed from the extracted clause | Land in a triage state, `PENDING_DUE_RULE`, visible to reviewers, never silently defaulted to end-of-period |
| Instance never gets evidence and never gets marked `NOT_APPLICABLE` for years | Ageing report — same defect-ageing logic, applied to instances, surfaces it eventually |
| Reconciliation runs before the document pipeline finishes extracting the compliance report | Queue reconciliation as a downstream step of publish, not upload — never race the extraction |

---

## 9. Scope

### Reporting boundary

When an obligation requires a report/return, the reporting domain owns definition, compilation, validation, attestation, package, submission attempts, receiver receipts and authority status. This domain owns the duty, deadline and independent verification of whether it was satisfied. `TRANSMITTED`, `ACKNOWLEDGED` or even authority `ACCEPTED` may be evidence for verification; none automatically sets the obligation instance to `SATISFIED`.

Shared/national report semantics live once as a reporting definition version. A filing obligation binds that version to this obligation instance, subject, recipient and period. Do not duplicate the definition into each mine's obligation row.

### In

- [ ] Obligation and instance data model, with `shared_obligation_id` from day one
- [ ] Materialisation engine with rolling 12-month horizon
- [ ] Separate `periodicity` and `due_rule` fields, enforced at extraction
- [ ] Two-field state model (§4): `status` lifecycle plus independent `reconciliation` verdict
- [ ] `SUBMITTED` and `SATISFIED` as separate states, with verifier ≠ submitter enforced
- [ ] `NOT_APPLICABLE` and `WAIVED` as distinct states, both requiring a named person and a reason
- [ ] Reconciliation between claimed status and evidence
- [ ] Condition-triggered escalation into the defect ledger
- [ ] `NOT_APPLICABLE` with mandatory named reason
- [ ] Amendment handling — future regenerates, past stays fixed
- [ ] Dashboard rollup query with dedup-by-`shared_obligation_id` written once, called everywhere
- [ ] ReBAC checks on view, mark-not-applicable, escalate-override

### Out — with reasons

- **Automatic satisfaction inference from third-party signals** (e.g. auto-marking plantation `SATISFIED` from satellite imagery alone). Use it to populate `EVIDENCE_MISSING`, never to auto-close — a human confirms.
- **Cross-obligation dependency graphs** ("condition 17 cannot be satisfied until condition 12 is"). Real in some EC letters, genuinely complex, roadmap.
- **Automatic obligation amendment detection from circular text** (the change-impact feature). Separate component, reads this register, doesn't write to it directly without review.

---

## 10. Tests

| # | Scenario | Expected |
|---|---|---|
| 1 | Six-monthly obligation, mine plantation type, due-rule = period-end | Due 31 Mar / 30 Sep |
| 2 | Six-monthly obligation, EC-report type, due-rule = +30 days | Due 1 Jun / 1 Dec |
| 3 | Cluster EC across 3 mines | 3 instances per period, one `shared_obligation_id` |
| 4 | Subsidiary rollup count | Deduplicates by `shared_obligation_id`, not raw instance count |
| 5 | No evidence, past due | `OVERDUE` |
| 6 | Report claims COMPLIED, no evidence file | reconciliation = `CLAIMED_UNSUPPORTED`; `status` unchanged |
| 7 | Evidence filed and matched, verified by another person | `SATISFIED` |
| 8 | Evidence filed, doesn't match | Verifier moves it to `EVIDENCE_MISMATCH`; escalates immediately if safety-critical |
| 9 | Obligation amended, future instance | Regenerates under new rule |
| 10 | Obligation amended, past instance already `SATISFIED` | Unchanged |
| 11 | Env Officer marks `NOT_APPLICABLE` with no reason | Rejected by the app, not the graph |
| 12 | Env Officer marks `NOT_APPLICABLE` with reason, at a mine they don't hold appointment for | DENY at the graph layer |
| 13 | Second consecutive period `OVERDUE` on the same obligation | Escalates one level higher than a first occurrence |
| 14 | Area GM dashboard load, 3,000 instances across 12 mines | One `ListObjects` call, not 3,000 `Check` calls |
| 15 | Regulator views an instance derived from their own DGMS permission | ALLOW, logged |
| 16 | Regulator views an instance derived from an internal-only mine-plan commitment | DENY at the app filter, even though the graph-level mine visibility would allow it |
| 17 | Owner submits evidence and verifies it themselves | **DENY** — verifier must differ from submitter |
| 18 | Instance past due, and the report claims COMPLIED | `status = OVERDUE` **and** reconciliation = `CLAIMED_UNSUPPORTED`, both visible |
| 19 | Satellite shows the plantation, no evidence file | reconciliation = `EVIDENCE_MISSING`, not `GAP` |
| 20 | Mine claims NOT_APPLICABLE, applicability rules disagree | reconciliation = `DISPUTED_APPLICABILITY` |
| 21 | Obligation excused for one period by subsidiary authority | `WAIVED`, reason recorded, next period materialises normally |

---

## 11. Three sentences for the jury

> **One.** An obligation is the law; an instance is the work. One EC condition can generate a hundred and sixty dated instances across a subsidiary in a year, and the dashboard counts instances, never conditions — because that's the level at which compliance is actually discharged.

> **Two.** We don't collapse "unsafe" and "unfiled" into one red flag. An instance can be overdue because nobody did the work, or overdue because the work was done and nobody filed the paperwork, and those are different problems that need different people to look at them.

> **Three.** When a compliance report claims a condition was met and no evidence exists to back it, the system says so — by name, per condition, per mine — which is precisely the gap the CAG's own audit found at national scale in environmental clearance monitoring.

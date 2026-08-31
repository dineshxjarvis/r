# Strata — Defect Ledger, Findings and CAPA Specification

**Component:** From "someone noticed something" to "it was fixed and somebody independent confirmed it"
**Companion to:** Authorisation Specification · Obligation Register Specification · Extraction Specification
**Status:** Design spec, ready to build

---

## 0. Read this first

**What this component is:** the obligation register tracks duties that were known in advance. This component tracks problems that were *not* — the ones a person noticed, an inspection body wrote up, or an overdue obligation escalated into.

**Four objects, and the reason they are four and not one.** This is the distinction the whole component turns on, and collapsing any pair of them breaks something downstream:

| Object | Is | Cardinality |
|---|---|---|
| **Observation** | One report by one person or body at one time: *"no berm on the east haul road"* | Many |
| **Defect** | The physical problem itself, however many people reported it | One per real-world problem |
| **Finding** | The formal conclusion that the defect breaches a specific requirement | One per breached requirement |
| **CAPA** | The assigned work to fix it and stop it recurring | One or more per finding |

Three people reporting the same missing berm produce **three observations, one defect**. If you count observations, the same problem inflates your numbers threefold and recurrence detection becomes meaningless. If you skip the defect layer entirely, you cannot answer *"how long has this actually been open"* — the oldest observation is the answer, and you no longer have it.

Not every defect becomes a finding. A defect with no requirement behind it is a maintenance item, and calling it a compliance breach when it is not destroys the credibility of the ones that are.

**The single rule everything else follows:**

> **Closure requires evidence and an independent verifier. Always. No exceptions, no severity below which it stops applying.**

"Marked closed" without proof is the current paper failure reproduced digitally, at greater speed and with a false air of authority.

**Terms:**

| Term | Meaning |
|---|---|
| **CAPA** | Corrective and Preventive Action. Corrective fixes this instance; preventive stops the class. Both fields, always |
| **Entity resolution** | Deciding that two reports describe one real thing |
| **Ageing** | How long a defect has been open, measured from the *earliest* observation, not from when it was digitised |
| **Recurrence** | The same defect class reappearing at the same place, contractor or shift after a previous closure |

---

## 1. Where this sits

```
  FIELD APP ─────────┐
  INSPECTION DOC ────┼──► OBSERVATION ──resolve──► DEFECT ──assess──► FINDING ──► CAPA ──► VERIFIED CLOSURE
  (extraction)       │                                │                  ▲          │            │
  OBLIGATION ────────┘                                │                  │          │            │
  (escalated, §6)                                     │        obligation register   │            │
                                                      │        escalation lands here │            │
                                                      ▼                              ▼            ▼
                                                   AGEING                      ESCALATION     RISK ENGINE
                                                   RECURRENCE                  (§9)           (§11)
```

Three sources produce observations: the mobile app, extraction from inspection documents (Extraction Specification §4.3), and escalated obligation instances (Obligation Register Specification §6). **All three converge on the same ledger.** A finding raised by a DGMS notice and a finding raised by an overdue plantation obligation follow identical closure rules, and that uniformity is the point.

---

## 2. Observation ingestion

### 2.1 Record

An observation is raw and unjudged. It records what was seen, by whom, where, when — and nothing that requires a conclusion.

| Field | Notes |
|---|---|
| `observation_id` | |
| `source` | `FIELD_APP`, `DOCUMENT`, `OBLIGATION_ESCALATION` |
| `asset_ref` | Down to the finest level captured: `bench:gevra_ocp/e_rl210`, not just the mine |
| `observed_by` | Person, or the body: `committee:psc_gevra`, `PSC`, `IUSA`, `SAFETY_AUDIT`, `DGMS` |
| `observed_on` | When the thing was seen, which is not when it was recorded |
| `recorded_at` | Server time on arrival. Differs from `observed_on` for offline capture and for document extraction |
| `description` | Verbatim |
| `hazard_category` | From a closed vocabulary: `haul_road`, `slope`, `conveyor`, `electrical`, `ventilation`, `dust`, `water`, … |
| `raised_severity` | **The word the reporting body actually used**, verbatim |
| `normalised_severity` | `MINOR` \| `SIGNIFICANT` \| `SEVERE` — see §2.2 |
| `location` | Captured coordinates and accuracy, from the device |
| `evidence_refs` | Photo, video, voice — content-addressed |
| `confidence` | 1.0 for human field capture; the extractor's confidence for document-sourced |

### 2.2 Severity is normalised, and the original is kept

**Canonical vocabulary: `MINOR` / `SIGNIFICANT` / `SEVERE`.** Three levels, because closure authority has three rungs (§8) and a fourth level with no distinct authority attached is a distinction that changes nothing.

Every inspection body uses its own words — "serious", "critical", "major", "Category A". Keep `raised_severity` verbatim alongside the normalised value. The normalisation is a judgement that may need revisiting, and a reviewer must be able to see what was actually written.

Severity is a **column, not a relationship**. The graph says who is related to the mine; the application maps severity to the required relation. This is the pattern set out in the Authorisation Specification §5.1 and it keeps the graph small.

### 2.3 Rules

- **Location and time are captured, never typed.** Enforced at the client, verified at the server. An observation whose location was entered by hand is not evidence of anything.
- **An observation is never deleted.** A wrong observation is superseded or marked non-issue with a reason, and stays visible.
- **Every observation is either resolved to a defect or explicitly dismissed.** An observation in neither state after the triage window is itself an overdue item. Nothing may silently disappear.

---

## 3. Defect ledger and entity resolution

### 3.1 The problem

```
Worker:     "Broken conveyor guard"
Inspector:  "Damaged conveyor protection"
Supervisor: "Conveyor safety barrier damaged"
```

One missing guard. Three sentences with no words in common beyond "conveyor".

### 3.2 Signals

Scored, weighted, combined — never any one alone:

| Signal | Notes |
|---|---|
| Asset proximity | Same subunit and bench is strong; same mine alone is nearly worthless |
| Spatial distance | Metres between captured coordinates, weighted by the reported accuracy |
| Hazard category | Same category |
| Text similarity | Embedding similarity, not keyword overlap — the example above shares almost no keywords |
| Time proximity | Days apart, with a decay |
| Open-defect status | A closed defect at the same place is a **recurrence candidate** (§5), not a merge candidate |

That last row is the one that is easy to get wrong. Merging a new report into an old closed defect erases the recurrence — which is exactly the signal the risk engine most needs.

### 3.3 The system proposes; a human disposes

> **Never auto-merge.** Ever, at any confidence.

A merge changes the ageing clock, the recurrence count, and the responsible party. Getting it wrong silently rewrites history in a ledger whose whole value is that it does not get silently rewritten. The cost of a human confirming a 0.94-similarity match is seconds; the cost of a wrong automatic merge is a defect that appears to have been fixed.

High-confidence candidates are surfaced prominently, pre-selected, one keystroke to confirm. Make the human fast, do not make the human optional.

### 3.4 Record

`defect` carries: `asset_ref`, `hazard_category`, `first_observed_on` (the earliest linked observation's `observed_on`), `status` (`OPEN`, `UNDER_ACTION`, `CLOSED`, `RECURRED`), `severity` (the highest among linked observations), `responsible_org` where a contractor is accountable, and the observation links.

`first_observed_on` comes from the observation, **not** from when the row was created. A defect first seen on a paper PSC minute in March and digitised in August is 5 months old, not 0 days.

---

## 4. Merge, confirm and split

Three operations, all audited, all reversible in effect but never by deletion:

| Operation | Meaning | Guard |
|---|---|---|
| **Merge** | Two defects are one physical problem | Requires `internal_viewer` at the mine; audited with both prior states |
| **Confirm** | A proposed link is correct | The default fast path |
| **Split** | One defect is actually two | Both children inherit the parent's `first_observed_on`; neither resets |

**Split matters more than it looks.** A single observation reading *"berm missing and drainage blocked on east haul road"* is two defects with different hazard categories, different owners and different fix timelines. Handled as one, whichever half is fixed first closes the other.

Merges and splits are the strongest available training signal for the resolver. Capture them as such.

---

## 5. Ageing and recurrence

### 5.1 Ageing

Measured from `first_observed_on` to closure or now.

Bands are a display convenience, not a model: 0–7 `LOW`, 8–15 `MEDIUM`, 16–30 `HIGH`, 30+ `CRITICAL`. **Bands must be configurable per severity** — a 20-day-old `MINOR` housekeeping defect and a 20-day-old `SEVERE` ventilation defect are not the same emergency, and a system that paints them the same colour teaches people to ignore the colour.

### 5.2 Recurrence

Recurrence is a **closed defect coming back**, not the same category appearing twice at a large mine.

The test: a new defect matches a previously `CLOSED` defect on asset and hazard category, within a recurrence window scaled to the hazard type.

Recorded on the new defect as `recurrence_of` plus an occurrence count. It is not a merge — the two remain distinct rows with distinct histories, linked.

**Why recurrence outranks nearly every other signal:** a defect that recurs was closed on evidence that satisfied a verifier, and came back anyway. That means either the CAPA treated the symptom, the verification was too easy, or the preventive half was never done. All three are process failures, and process failures repeat. This is the strongest input to the risk engine (§11), and it is also the strongest input to *auditing the verifiers*.

Dimensions worth breaking recurrence down by, because each implies a different fix: same **location**, same **contractor**, same **shift**, same **equipment class**, same **closing verifier**.

---

## 6. Findings

### 6.1 What a finding adds

A finding is the assertion that a defect **breaches a specific requirement**. It carries the requirement reference, and that reference is not optional:

```
defect:   No safety berm on east haul road
finding:  Breaches CMR 2017 r.106(2) — NON_COMPLIANCE, SIGNIFICANT
```

| Field | Notes |
|---|---|
| `defect_ref` | Or `instance_ref` where the finding came from an escalated obligation |
| `requirement_ref` | The obligation or statutory clause breached. **Mandatory** |
| `severity` | `MINOR` \| `SIGNIFICANT` \| `SEVERE` |
| `raised_by` | Acting person and supporting appointment |
| `issuing_authority` | Structured authority/unit/mandate provenance for regulator-issued finding; null for internal |
| `responsible_org` | The contractor, where one is accountable |
| `status` | `OPEN`, `CAPA_ASSIGNED`, `PENDING_VERIFICATION`, `CLOSED`, `REOPENED` |

### 6.2 Rules

- **No finding without a requirement reference.** If nothing is breached, it is a defect and a maintenance job, not a compliance finding. Inflating the finding count with maintenance items is how a compliance dashboard becomes noise.
- **A finding always has a follow-up path.** Raising one automatically creates a CAPA (§7). A finding with no CAPA cannot exist.
- **A regulator-issued finding carries structured provenance at creation.** Inspection-origin findings inherit it from the confirmed inspection/report; direct directions cite authority, unit, appointment, mandate and source instrument. A boolean regulator marker is insufficient.

---

## 7. CAPA

Immediate emergency response and containment are owned by the [incident specification](../incidents/incident-and-emergency-spec.md) and may begin before a defect, finding or CAPA exists. Once the situation is stable, unresolved containment work is handed to this domain with its original owner, evidence and timestamps preserved. Creating a CAPA never delays response; closing an incident never closes a CAPA.

### 7.1 Both halves are mandatory

| Field | Why |
|---|---|
| `corrective_action` | Fix this instance |
| `preventive_action` | Stop the class recurring |

A CAPA with an empty preventive half is a repair ticket. Since recurrence is the single most damaging pattern this system exists to detect, letting the preventive half be optional guarantees the recurrence you are trying to prevent. Where genuinely no preventive action applies, that requires a stated reason — not a blank field.

### 7.2 Lifecycle

```
  OPEN ──► IN_PROGRESS ──► SUBMITTED ──► VERIFIED_CLOSED
             │                 │
             │                 └──(rejected)──► REOPENED ──┐
             │                                              │
             └◄─────────────────────────────────────────────┘
```

`SUBMITTED` means *the assignee says it is done*. `VERIFIED_CLOSED` means *someone else agrees, having looked at the evidence*. Conflating those two states is the failure this component exists to prevent, and it is why there is no transition from `IN_PROGRESS` to `VERIFIED_CLOSED`.

### 7.3 Deadlines are proportional to severity

Derived from severity and hazard category, not typed in freehand. A `SEVERE` ventilation finding and a `MINOR` housekeeping finding do not get the same fortnight because the assignee happened to pick the same date.

**Deadline extensions are a first-class, audited act with a mandatory reason** — never an edit to the date field. Repeated extensions on one CAPA is a behavioural signal the risk engine watches (§11), and it is invisible if extending is just an UPDATE.

---

## 8. Closure authority

The authority ladder is specified in the Authorisation Specification §7 and is **not restated here** — one copy, and it lives with the model that enforces it. What this component owns is how the application reaches it:

```python
PERMISSION_BY_SEVERITY = {
    "MINOR":       "close_minor",
    "SIGNIFICANT": "close_significant",
    "SEVERE":      "close_severe",
}
```

Three application-layer rules sit on top of the graph decision:

**1. No self-verification.** The verifier must not be the assignee, and must not be the person who submitted the closure evidence. This is an application check — the graph knows relationships, not who did what — and it holds regardless of how senior the assignee is. A Manager who fixed something personally must have someone else verify it.

**2. A regulator-issued finding is never closable by operator authority.** Closure requires `finding.close_regulatory` under the stored issuing-authority mandate, jurisdiction/case assignment, separation policy and assurance. No operator position policy grants it.

**3. Closure requires evidence.** §10.

---

## 9. Escalation

### 9.1 Deadline-triggered and risk-triggered escalation

> **A missed clock and a risk condition are different triggers; both must be explicit.**

A timer without severity-aware policy can route a `MINOR` housekeeping item with the same urgency as a `SEVERE` ventilation defect. Conversely, a risk-only policy misses statutory deadlines and acknowledgement SLAs. Keep pre-deadline reminders, missed-deadline escalation and risk-condition escalation as separate rule kinds with distinct recipients and urgency. **Alert volume high enough to be ignored is a failure mode, not a side effect** — the problem statement names it explicitly.

Conditions, evaluated on change and on a schedule:

```
overdue beyond grace, severity MINOR             → assignee's supervisor
overdue beyond grace, severity SIGNIFICANT       → mine official
severity SEVERE, regardless of age               → mine official immediately, area on overdue
second consecutive recurrence at one asset       → one level above the previous escalation
CAPA deadline extended more than twice           → mine official, flagged as behavioural
verification rejected twice on one CAPA          → mine official, flagged as behavioural
authority-issued finding approaching its deadline → mine official plus responsible authority unit, no grace
```

### 9.2 Rules

- **Escalation adds a recipient; it does not transfer ownership.** The assignee stays responsible. Otherwise escalation becomes a way to shed accountability upward.
- **The chain follows the hierarchy from the graph**, not a hard-coded list of names. Reparent an area and escalation re-derives with no configuration change.
- **Every escalation is an audited event** carrying the condition that fired it. A recipient must be able to see *why* this arrived.
- **Reminders fire before deadlines, not only after.** The problem statement asks for this explicitly and it is the cheapest thing in the component.

---

## 10. Verification and evidence-bound closure

### 10.1 The rule

Closure evidence is mandatory and is checked, not merely attached:

| Check | Failure |
|---|---|
| Evidence exists | No evidence, no submission. Not a warning — a rejection |
| Evidence postdates the CAPA | A "repair photo" taken before the finding was raised proves nothing |
| **Location is within the geofence of the defect asset** | Beyond tolerance → `DISTANCE_MISMATCH`, closure **blocked** |
| Capture metadata is intact and device-attested | Missing or contradictory metadata → flagged for manual review, not auto-rejected |
| Verifier ≠ assignee ≠ evidence submitter | §8 rule 1 |

### 10.2 The geofence check

> **The verdict model is defined in the Field Capture Specification §6 and is not duplicated here.** Evidence arrives carrying `VERIFIED`, `PLAUSIBLE`, `UNVERIFIED` or `SUSPECT` with reasons. This section states only what those verdicts mean for closure.

Closure is blocked when any attached evidence is `SUSPECT`, or when every attached item is `UNVERIFIED`. `VERIFIED` and `PLAUSIBLE` satisfy; `PLAUSIBLE` is noted on the record.

**Tolerance is per purpose and target kind, not global.** A bench is a long thin object; a ventilation door is a point. GIS owns the reviewed effective spatial policy and target geometry version. The verification attempt records both so a later reviewer can reproduce the result; there is no universal 100 m production default.

Worked example, from the reference trace:

```
defect:  gev_d_00412  — no berm, bench:gevra_ocp/e_rl210
evidence: photo + GPS, submitted 2026-08-20, 640 m from the bench
policy:  100 m for bench assets
result:  DISTANCE_MISMATCH → closure BLOCKED, not merely flagged
```

**Blocked, not flagged.** A flag is a thing someone dismisses on a busy afternoon. This is the single most concrete anti-spoofing rule in the product and it should be demonstrated live rather than described.

Blocked closures are appealable through the signed verdict override in Field Capture Specification §9 Case 4 — an explicit act by the Manager at that mine, with a written reason, signed, audited, and the original verdict retained. Genuine exceptions have a route; the route is visible; and a Manager with a high override rate is itself a surfaced metric.

### 10.3 Rejection

Rejection requires a reason and reopens the CAPA to `REOPENED`, keeping the original deadline history. The rejected submission is retained — it is evidence about the process even though it was not accepted as evidence about the defect.

---

## 11. Risk scoring and inspection generation

### 11.1 Rule-based first, and honestly labelled

Start with a transparent weighted score over: open defect count by severity, ageing distribution, recurrence count, overdue CAPA load, verification rejection rate, incident history, and contractor attribution.

**Call it a rule-based score on the slide.** A weighted sum described as machine learning is the fastest way to lose a technical judge, and the honest version is more defensible: every input is explainable, which is exactly what §11.3 requires.

Replace components with learned models only where there is data to learn from and where the learned version beats the rule, measured. Recurrence prediction is the first candidate; risk scoring as a whole is not.

### 11.2 Behavioural signals on the process itself

The signals nobody else will build, because they require being willing to watch your own users:

| Signal | What it suggests |
|---|---|
| CAPAs closed implausibly fast for the work described | Rubber-stamping |
| A verifier with a near-zero rejection rate across many verifications | Not looking |
| Inspections consistently returning zero findings at a site with open defects | Not looking, or not going |
| Repeated deadline extensions on one CAPA | Nobody intends to do it |
| Defects recurring after closure by the same verifier | Verification too easy |
| Evidence consistently captured at the edge of the geofence tolerance | Worth a look |

These are **flags for a human, never automatic accusations**. Route them to the site's superior, not to the person flagged, with the underlying records attached.

### 11.3 Every output is routed and explained

> An alert with no stated reason, or routed to nobody, is not an output. It is noise with a timestamp.

Every analytical result carries: what fired it, which records support it, why it matters, and a named recipient with the authority to act. The problem statement names all three failure modes explicitly — unexplained alerts, unrouted alerts, and alert volume high enough to be ignored.

### 11.4 Risk-aware inspection content

Yesterday's history generates today's checklist: recurring hazard categories at that asset first, unverified previous CAPAs second, contractor-attributed items where that contractor is on site, then the standing statutory checklist.

**The statutory checklist is never displaced, only reordered.** Reordering is a convenience; omitting a mandated check because the model thought it was low-risk is a compliance breach caused by the compliance system.

---

## 12. Failure modes

| Failure | Handling |
|---|---|
| Same problem reported three times | Three observations, one defect; resolver proposes, human confirms |
| Resolver wrongly merges two defects | Split; both children keep the parent's `first_observed_on`; logged as a training signal |
| New report matched into an old closed defect | Blocked by design — a closed defect is a recurrence candidate, never a merge candidate |
| Defect digitised months after it was first seen on paper | Ageing runs from `observed_on`, not `recorded_at` |
| Observation with no requirement behind it | Stays a defect. Never inflated into a finding |
| CAPA submitted with no evidence | Rejected at submission, not at verification |
| Closure evidence 640 m from the asset | `DISTANCE_MISMATCH`, closure blocked, appeal route available and audited |
| Assignee verifies their own CAPA | Denied at the application layer, at any seniority |
| Mine attempts to close a DGMS-raised finding | Structurally unreachable in the model — no path exists |
| Escalation storm after a bulk import | Rate-limit per recipient, aggregate into one digest, never suppress silently |
| Verifier rubber-stamping | Surfaced as a behavioural signal to their superior, with the records |
| Contractor renamed after a merger | New org, `succeeds` edge to the old. Safety history must not be laundered by a rename |
| Defect at an asset that is later deleted from the hierarchy | Assets are deactivated, never deleted. Open defects block deactivation |
| Two CAPAs raised for one finding, one closed | The finding stays open until every CAPA is verified-closed |

---

## 13. Scope

### In

- [ ] Observation ingestion from all three sources, converging on one ledger
- [ ] Severity normalisation to three levels, with `raised_severity` preserved verbatim
- [ ] Defect ledger with the four-object model
- [ ] Entity resolution: scored candidates, human confirmation, never auto-merge
- [ ] Merge, confirm and split, audited, with corrections captured as training signal
- [ ] Ageing from `first_observed_on`, with per-severity bands
- [ ] Recurrence detection against closed defects, broken down by location, contractor, shift and verifier
- [ ] Findings with a mandatory requirement reference
- [ ] CAPA with mandatory corrective and preventive halves, severity-derived deadlines, extensions as audited acts
- [ ] Closure authority via the authorisation graph, plus no-self-verification
- [ ] Evidence-bound closure with the geofence check and a blocked-closure appeal route
- [ ] Condition-triggered escalation following the graph hierarchy, with pre-deadline reminders
- [ ] Rule-based risk scoring, labelled as such
- [ ] Behavioural signals on process integrity
- [ ] Risk-aware inspection ordering, never omission

### Out — with reasons on the slide

- **Root-cause classification (5-why, fishbone).** Real value, needs domain expertise the model does not have, and a bad automated root cause is worse than none.
- **Learned severity assignment.** Severity determines who may close. A model deciding that is a model deciding authority. Rules only.
- **Cross-mine automatic defect merging.** Two mines can have identical berm defects; they are two defects. Recurrence across mines is a contractor-level pattern (§5.2), not a merge.
- **Predictive incident modelling.** Requires incident volumes that, correctly, do not exist at one site. Frame as leading-indicator trending instead, and say why.
- **Automatic CAPA generation from finding text.** Suggest a template; never assign work automatically to a named person.
- Inspection scheduling, assignment teams, visits and reports are owned by [`../inspections/inspection-spec.md`](../inspections/inspection-spec.md); this component begins when an inspection produces an observation.

---

## 14. Tests

| # | Scenario | Expected |
|---|---|---|
| 1 | Three reports of one missing guard | Three observations, one defect, after human confirmation |
| 2 | Resolver at 0.94 similarity | Candidate proposed. **Not merged automatically** |
| 3 | New report matching a closed defect | Recurrence candidate, not merge candidate |
| 4 | Defect observed 2026-03-12, recorded 2026-08-06 | Age computed from March |
| 5 | Split a compound observation | Two defects, both inheriting `first_observed_on` |
| 6 | Finding created with no requirement reference | Rejected |
| 7 | Finding created | CAPA auto-raised; a finding with no CAPA cannot exist |
| 8 | CAPA saved with an empty preventive action and no reason | Rejected |
| 9 | Deadline changed by direct edit | Not possible; extension is an audited act with a reason |
| 10 | Assignee verifies their own CAPA | **DENY** |
| 11 | Safety Officer closes a `SIGNIFICANT` finding | DENY — Manager only |
| 12 | Manager closes a `SEVERE` finding | DENY — area level or above |
| 13 | Manager closes a regulator-issued finding | **DENY** — no issuing-authority capability |
| 14 | Issuing-authority officer with current closure mandate/jurisdiction passes separation policy | ALLOW |
| 15 | Closure submitted with no evidence | Rejected at submission |
| 16 | Closure evidence 640 m from a bench, 100 m policy | **`DISTANCE_MISMATCH`, closure blocked** |
| 17 | Blocked closure appealed by an authorised person with a reason | Allowed, audited, tolerance in force recorded |
| 18 | Evidence photo timestamped before the finding was raised | Rejected |
| 19 | `MINOR` overdue by one day | Escalates to supervisor, not to the General Manager |
| 20 | `SEVERE` raised | Mine official notified immediately, before any deadline passes |
| 21 | Second consecutive recurrence at one asset | Escalates one level above the previous escalation |
| 22 | Third deadline extension on one CAPA | Behavioural flag raised to the site's superior |
| 23 | Area reparented | Escalation chain re-derives with no configuration change |
| 24 | Verifier with 40 verifications and zero rejections | Behavioural flag, with the records attached |
| 25 | Bulk import of 400 historical observations | One digest per recipient, no escalation storm, nothing silently suppressed |
| 26 | Risk-ordered checklist generated | Statutory items reordered, never omitted |
| 27 | Every alert produced | Carries a firing reason, supporting records, and a named recipient |

**Tests 2, 10, 13 and 16 are the ones a judge will probe.** Have them running live.

---

## 15. Three sentences for the jury

> **One.** Three people reporting the same missing berm produce three observations and one defect, and the defect's clock starts the day the first person saw it — not the day somebody got round to typing it in, which is how a five-month-old problem currently presents as new.

> **Two.** A corrective action cannot be closed by the person who performed it, cannot be closed without evidence, and cannot be closed when the evidence photograph was taken 640 metres from the place it claims to show — that last one is a hard block, not a flag somebody dismisses.

> **Three.** We watch the process as closely as the hazards: a verifier who never rejects anything, a deadline extended three times, a defect that keeps coming back after the same person signs it off — those are the patterns that predict the next incident, and none of them are visible on paper.

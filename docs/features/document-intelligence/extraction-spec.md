# Strata — Extraction Specification

**Component:** Turning document segments into structured, machine-checkable records
**Companion to:** Document Pipeline Spec (stages 3.5–3.7) · Authorisation Spec
**Status:** Design spec, ready to build

---

## 0. Read this first

**What extraction is:** the document pipeline gave us clean text with page coordinates. Extraction decides *what that text means* and writes it into the register as rows a computer can act on.

Input: a sentence from an EC letter.

> *"The project proponent shall undertake plantation over an area of 40 hectares within the mine lease during the current phase and submit photographic evidence in the six-monthly compliance report."*

Output: a row.

```json
{
  "deontic": "OBLIGATION",
  "subject": "project_proponent",
  "action": "undertake plantation",
  "parameter": {"area_ha": 40},
  "periodicity": "six_monthly",
  "due_rule": "END_OF_PERIOD",
  "evidence_type": ["photo", "report"],
  "owner_role": "env_officer",
  "anchor": {"page": 7, "char_start": 18422, "char_end": 18571},
  "confidence": 0.81
}
```

**Terms you'll meet:**

| Term | Plain meaning |
|---|---|
| **Span** | A stretch of characters in the source. "40 hectares" is a span. |
| **NER** | Named Entity Recognition — finding spans of a known type (dates, quantities, roles) |
| **Extractive QA** | Ask a question of a document; the model returns the span that answers it, rather than writing new text. **This is our workhorse.** |
| **Deontic** | Grammar of duty: obligation, prohibition, permission. From the Greek for "that which is binding." |
| **Constrained decoding** | Forcing a model's output to fit a schema, so it can't return malformed JSON |
| **Calibration** | Making a model's stated confidence match its real accuracy. A calibrated 0.8 is right 80% of the time. |
| **Grounding** | Proving an output actually came from the source rather than being invented |

**The one rule that governs everything below:**

> **Extraction selects; it does not compose.**
> Every field must trace to characters that exist in the source document. A model that *writes* an obligation is hallucinating. A model that *points at* one is extracting.

---

## 1. One pipeline, six extractors

Same machinery, different targets. The divergence happens here and nowhere else.

| Extractor | Reads | Produces | Lands in |
|---|---|---|---|
| **Obligation** | EC letters, DGMS permissions, mining plans, CMR, circulars | Atomic duties | Obligation register |
| **Claimed status** | Six-monthly compliance reports | "We say condition 17 is complied" | Reconciliation |
| **Observation** | PSC minutes, IUSA, safety audit, check audit | Defect sightings | Defect ledger |
| **Incident** | Form 4-A / 4-B | Accident particulars | Incident record |
| **Contractor** | Form XIII, licences, certificates | Party, scope, validity window | Contractor register |
| **Evidence** | Lab reports, third-party certificates | Measured values, dates, parameters | Evidence, matched to obligations |

Build the obligation extractor properly. The other five are the same architecture with different schemas and smaller label sets.

---

## 2. Be honest about the difficulty

This is the hardest component in the product and the one most likely to underdeliver. Plan accordingly.

**Published context:** on CUAD — 510 contracts, 13,000+ expert labels across 41 clause types, the closest public analogue to this task — the strongest model in the original paper reached roughly **44% precision at 80% recall**. That's a well-resourced benchmark on cleaner documents than yours.

Quote that number in your pitch. Two reasons: it proves you read the literature, and it inoculates you against a judge who assumes clause extraction is a solved problem and expects 99%.

**Your documents are harder than CUAD:** scanned rather than native, English–Hindi mixed, numbered conditions with sub-conditions and cross-references, parameters buried in tables, inconsistent modal phrasing ("shall ensure" / "is directed to" / "may be required to" / "it is to be noted that").

**The asymmetry that shapes the design:**

| Error | Consequence |
|---|---|
| **False negative** (missed obligation) | A duty goes untracked. Bad, but the world is no worse than today. |
| **False positive** (invented obligation) | Phantom compliance work. The Env Officer chases a duty that doesn't exist, finds nothing, and stops trusting the system. |

**Tune for recall over precision — resolved this way, see Addendum A5.** The two error types aren't symmetrically caught: a reviewer looking at the source rejects a false positive in seconds, but a false negative never appears on the review screen to be noticed at all — a reviewer cannot see what wasn't extracted. Tuning for precision optimises against the error your own process already catches cheaply, and leaves the invisible one uncontrolled. `extraction_triage_config` (`data-model.md §2`) seeds `surface_threshold` deliberately low (0.30) for exactly this reason — a false positive costs one reviewer click, a never-proposed obligation is unrecoverable. Addendum A3's omission detection is the safety net that makes this affordable, not optional alongside it.

---

## 3. What an extraction is

Every extraction, of every type, has the same envelope:

```json
{
  "extraction_id": "ex_01J8...",
  "document": "sha256:8f14e45f...",
  "segment_id": "cond_17_b",
  "extractor": "obligation@v3",
  "type": "OBLIGATION",
  "payload": { ... type-specific ... },
  "anchor": {
    "page": 7,
    "bbox": [72, 410, 523, 448],
    "char_start": 18422,
    "char_end": 18571
  },
  "field_anchors": {
    "parameter.area_ha": {"char_start": 18489, "char_end": 18501},
    "periodicity":       {"char_start": 18543, "char_end": 18556}
  },
  "confidence": 0.81,
  "field_confidence": {"deontic": 0.94, "periodicity": 0.71, "owner_role": 0.52},
  "status": "NEEDS_REVIEW",
  "review": null
}
```

Three things to notice.

**`field_anchors`, not just one anchor.** When a reviewer questions the periodicity, you highlight the eleven characters that produced it, not the whole condition. This makes review fast, and review speed is what determines whether the product is usable.

**`field_confidence`, not one number.** Deontic classification is easy and reliable. Owner role is often absent from the text entirely. A single aggregate confidence hides exactly the field that needs attention.

**`extractor` is versioned.** When you improve the model, you re-run and compare. Without the version stamp you cannot tell which extractions came from which model, and you cannot measure whether you improved anything.

---

## 4. Payload schemas

### 4.1 Obligation

```json
{
  "deontic": "OBLIGATION | PROHIBITION | PERMISSION | RECOMMENDATION",
  "subject": "verbatim span, e.g. 'the project proponent'",
  "owner_role": "manager | safety_officer | env_officer | contractor | UNASSIGNED",
  "action": "verbatim predicate span",
  "parameters": [{"name": "area_ha", "value": 40, "unit": "hectare", "anchor": {...}}],
  "periodicity": "ONE_TIME | MONTHLY | QUARTERLY | SIX_MONTHLY | ANNUAL | CONTINUOUS",
  "due_rule": { ... see §6 ... },
  "evidence_type": ["report", "photo", "lab_result", "register_entry", "certificate"],
  "applicability": { ... see §7 ... },
  "cross_refs": ["cond_12", "CMR 2017 r.106"],
  "source_scope": "PROJECT | MINE | LEASE"
}
```

### 4.2 Claimed status

```json
{
  "claims_condition": "cond_17_b",
  "claim_confidence": 0.88,
  "claimed_status": "COMPLIED | PARTIALLY_COMPLIED | NOT_APPLICABLE | IN_PROGRESS | NOT_STATED",
  "claimed_values": [{"name": "area_ha", "value": 38}],
  "period": "FY2026H2",
  "referenced_evidence": ["Annexure III", "photographs at Annexure V"]
}
```

`claims_condition` is the hard field. Compliance reports rarely quote the condition number cleanly — they paraphrase, renumber, or merge two conditions into one paragraph. §8.

### 4.3 Observation

```json
{
  "raw_text": "verbatim",
  "hazard_category": "haul_road | slope | conveyor | electrical | ventilation | ...",
  "location": {"subunit": "03", "bench": "RL 210 E", "free_text": "east haul road"},
  "raised_severity": "verbatim severity word used by that body",
  "normalised_severity": "MINOR | SIGNIFICANT | SEVERE",
  "observed_on": "2026-03-12",
  "observing_body": "PSC | IUSA | SAFETY_AUDIT | CHECK_AUDIT | DGMS",
  "stated_action": "verbatim, if any"
}
```

Note `raised_severity` alongside `normalised_severity`. **Every inspection body uses its own severity vocabulary.** Keep the original word — the normalisation is a judgement you may need to revisit, and a reviewer needs to see what was actually written.

### 4.4 Incident, contractor, evidence

Incident: date, time, place, category (fatal / serious / reportable / dangerous occurrence), persons affected, machinery involved, immediate cause as stated, CMR clause cited.

Contractor: legal name, registration reference, scope of work, engaged_from, engaged_until, licences with their own validity windows.

Evidence: parameter names and measured values with units, sampling date, laboratory identity, accreditation reference, method.

---

## 5. The method stack

**Layer cheapest to most expensive. Do not start with an LLM.**

```
  L1  Rules and patterns      →  structure, numbering, dates, quantities
  L2  Sentence classifier     →  is this a duty at all? which deontic type?
  L3  Extractive QA           →  which span is the subject / action / evidence type?
  L4  Constrained structuring →  assemble fields into schema; normalise
  L5  Validators              →  reject anything that fails a hard rule
  L6  Calibration and triage  →  score, sort, route to human
```

### L1 — Rules

Condition numbering (`17.`, `17(b)`, `(iii)`), dates, quantities with units, statutory cross-references (`CMR 2017 r.106`, `Section 22`), annexure references, modal verbs.

Unglamorous and it does 30–40% of the work. EC letters are more regular than they look. Write these before touching a model.

### L2 — Sentence classifier

Binary first (*is this a duty-bearing sentence?*), then four-way deontic type.

**Start from a pretrained obligation classifier rather than from scratch.** The RegNLP project publishes a LegalBERT-based `ObligationClassifier` trained on regulatory text, alongside ObliQA — roughly 27,900 obligation-grounded QA pairs from financial regulation. Different domain, same linguistic problem. Fine-tune on your annotated EC conditions.

**Negatives matter as much as positives.** EC letters are full of recitals, definitions, background and boilerplate. Annotate those explicitly as non-obligations, or your model will learn that every sentence in the document is a duty.

### L3 — Extractive QA

Per field, ask a question and take the answer span:

- *"Who must perform this?"* → subject span
- *"What must be done?"* → action span
- *"How often?"* → periodicity span
- *"What proof is required?"* → evidence span
- *"By when?"* → due-rule span

Fine-tune on CUAD — it ships in SQuAD-style JSON, so this is a standard extractive-QA setup, no data engineering — then transfer to 200–300 hand-annotated EC conditions.

**Extractive QA returns character offsets, which is exactly what `field_anchors` needs.** That's why this is the workhorse rather than a generative model.

### L4 — Constrained structuring

Only now, and only for the genuinely hard cases: conditions with nested sub-clauses, embedded tables, or compound duties.

**Two non-negotiable constraints:**

1. **Constrained decoding.** Force output to conform to the JSON schema. No free-form generation.
2. **Grounding check.** Every verbatim field the model emits must be found in the source text. Fuzzy-match it back (normalised whitespace, ≥0.9 similarity). **If it doesn't align, reject the extraction and send the segment to review.**

This is the single most important safeguard in the component. Language models paraphrase — that's what they're for — and a paraphrased obligation has lost its provenance and become an invention. The grounding check is what lets you claim every row traces to source.

```python
def ground(field_value: str, source_text: str) -> Anchor | None:
    match = fuzzy_find(field_value, source_text, threshold=0.90)
    return match.anchor if match else None

def structure(segment, schema):
    raw = llm.extract(segment.text, schema=schema, constrained=True)
    for path, value in verbatim_fields(raw):
        anchor = ground(value, segment.text)
        if anchor is None:
            return Rejected(reason="ungrounded_field", field=path)
        raw.field_anchors[path] = anchor
    return raw
```

### L5 — Validators

Hard rules. Failures block acceptance regardless of confidence:

- Periodicity `ONE_TIME` with a recurring due rule → contradiction
- Quantity with no unit
- Date outside a plausible range
- Cross-reference to a condition number absent from the document
- `deontic = PROHIBITION` with an `evidence_type` (you don't file evidence of not doing something)
- Any field failing the grounding check

### L6 — Calibration and triage

Raw model scores are not probabilities. Fit **temperature scaling** on a held-out set so that a stated 0.8 is right about 80% of the time.

Why this matters practically: your triage threshold is only meaningful if confidence is calibrated. Uncalibrated, "review everything below 0.7" is an arbitrary line. Calibrated, it's a statement about expected error rate — and you can tell a judge what it is.

---

## 6. The due-rule problem

This deserves its own section because it's the field most likely to be got wrong, and getting it wrong makes every deadline in the product incorrect.

**Periodicity is not a due date.** Two conditions can both be `SIX_MONTHLY` and be due on completely different days.

- *"Undertake plantation over 40 ha during each half-year"* → due at **period end**
- *"Submit the six-monthly compliance report"* → due **1 June and 1 December**, per the governing office memorandum

Same periodicity. Different dates. If you collapse them into one field, half your overdue flags are wrong — and a dashboard that cries wolf gets switched off within a month.

**A small rule vocabulary handles nearly everything:**

```json
{"kind": "END_OF_PERIOD"}
{"kind": "FIXED_DATES", "dates": ["06-01", "12-01"]}
{"kind": "OFFSET_FROM_PERIOD_END", "days": 30}
{"kind": "OFFSET_FROM_EVENT", "event": "COMMENCEMENT_OF_MINING", "days": -1}
{"kind": "CONTINUOUS"}
{"kind": "ON_DEMAND", "trigger": "REGULATOR_REQUEST"}
{"kind": "UNRESOLVED", "raw": "prior to commencement of the next phase"}
```

**`UNRESOLVED` is essential.** Some conditions genuinely cannot be resolved to a date from the text alone — "prior to commencement of the next phase" requires knowing when the next phase starts, which lives in the mining plan or nowhere. Route these to a triage queue where a human supplies the anchor date.

Do not guess. A guessed deadline is worse than an admitted unknown, because nobody knows to question it.

---

## 7. Applicability

Not every condition applies to every mine under a cluster clearance, and not every CMR regulation applies to every mine.

```json
{"kind": "ALWAYS"}
{"kind": "MINE_TYPE", "value": "OPENCAST"}
{"kind": "THRESHOLD", "attribute": "persons_employed", "op": ">", "value": 50}
{"kind": "GASSINESS", "value": ["II", "III"]}
{"kind": "NAMED_MINES", "mines": ["gevra_ocp", "dipka_ocp"]}
{"kind": "UNRESOLVED", "raw": "..."}
```

Applicability is evaluated when instances are materialised, not at extraction time. Extraction's job is to capture the condition; the register decides which mines it binds.

**This is where the mine-vs-project question bites** (see the open decisions). If one EC covers three mines and condition 17 says "the project proponent shall," the extractor records `source_scope: PROJECT` and lets the register expand it. Get the extraction right and the scope decision stays changeable.

---

## 8. Reconciliation — claimed status against the register

The genuinely novel piece, and the one nobody else will build.

> **The verdict vocabulary is defined in the Obligation Register Specification §4.3 and is not duplicated here.** This section covers only the extraction side: producing a claimed status that can be reconciled at all. The register owns what the verdicts mean and how they interact with instance lifecycle state.

A six-monthly compliance report is the mine telling MoEFCC what it did. Your register knows what was required and what evidence exists. Cross them:

```
For each obligation instance in the period:

  claimed   = extracted from the compliance report
  evidence  = matched evidence in the register            (§9)
  ─────────────────────────────────────────────────────────
  claimed COMPLIED   + evidence present   →  AGREED
  claimed COMPLIED   + evidence absent    →  CLAIMED_UNSUPPORTED    ★
  claimed NOT_STATED + evidence present   →  UNREPORTED             ★
  claimed NOT_STATED + evidence absent    →  GAP
  claimed N/A        + applicability says otherwise
                                          →  DISPUTED_APPLICABILITY ★
  (any)              + evidence absent, but an independent
                       signal suggests the work was done
                                          →  EVIDENCE_MISSING       ★
```

★ = verdicts that exist in no current system. They are reconciliation verdicts, not lifecycle states — an instance can be `OVERDUE` and `CLAIMED_UNSUPPORTED` at once.

**`CLAIMED_UNSUPPORTED` and `EVIDENCE_MISSING` are the important ones.** Together they separate *"this probably happened but wasn't documented"* from *"this didn't happen."* Those are a paperwork problem and a safety problem, and conflating them is why compliance dashboards get ignored.

CIL's actual pain is overwhelmingly the first. A dashboard showing 400 red items where 380 are filing gaps gets switched off. One that says *"12 real gaps, 388 documentation gaps"* gets used, and it's a much more honest thing to put in front of a regulator.

**`claims_condition` matching.** Compliance reports paraphrase rather than cite. Match on: explicit condition number if present, text similarity to the obligation's action span, parameter overlap (both mention 40 hectares), and ordinal position. Multiple weak signals combined, with the match confidence shown and confirmable.

---

## 9. Evidence-to-obligation matching

An obligation declares `evidence_type`. A document arrives. Do they match?

**Signals:**

| Signal | Example |
|---|---|
| Type match | Obligation wants `lab_result`; document classified as lab report |
| Period match | Sampling date falls inside the instance period |
| Parameter overlap | Obligation names PM10; the report measures PM10 |
| Asset match | Both reference the same mine |
| Explicit reference | The document names the condition |
| Value plausibility | Obligation requires 40 ha; evidence states 38 ha → **partial**, not satisfied |

The last row matters. Evidence can exist and still not satisfy the duty. Model three outcomes — `SATISFIES`, `PARTIALLY_SATISFIES`, `DOES_NOT_SATISFY` — never a boolean.

**Supervision.** The public dataset closest to this is the ComplianceNLP work, which pairs obligations with policy text labelled COMPLIANT / PARTIAL GAP / FULL GAP. Useful if it has actually been released — check before depending on it. **Fallback:** hand-label 200 pairs from EAC minutes, which discuss condition-by-condition compliance status for real coal projects and are publicly retrievable. That fallback is not a consolation prize; it's Indian, domain-native supervision that nobody else will have.

---

## 10. The correction loop

Every reviewer action is a training example.

```json
{
  "extraction_id": "ex_01J8...",
  "action": "EDIT",
  "field": "periodicity",
  "before": "ANNUAL",
  "after": "SIX_MONTHLY",
  "corrected_anchor": {"char_start": 18543, "char_end": 18556},
  "by": "user:a_verma",
  "at": "2026-06-02T11:04:00Z"
}
```

Actions: `ACCEPT`, `EDIT`, `REJECT`, `SPLIT` (one segment holds two duties), `MERGE`, `MARK_NOT_APPLICABLE`.

`SPLIT` is more common than you'd expect. Compound conditions — *"shall install X and maintain Y and report Z quarterly"* — are three obligations with different owners and different deadlines masquerading as one numbered item.

**Retrain on corrections between weeks 4 and 6, and report the delta.** "Precision moved from 0.68 to 0.79 after 340 human corrections" is a far better slide than a static number, because it shows the system improves in use.

---

## 11. Who may review what

The ReBAC layer applies here too, and one case is genuinely important.

| Action | Required relation |
|---|---|
| View extractions | `internal_viewer` at that mine |
| Accept / edit / reject | `internal_viewer` at that mine |
| Publish to the register | `manager` or `env_officer` at that mine |
| Review a contractor document | `internal_viewer`; contractor may **view** but not accept |
| Review extractions from a regulator issuance | **Flag only. Never edit.** |

**That last row is the one that matters.** If a DGMS notice says "within 15 days" and the extractor reads "within 50 days," the mine must be able to *flag* the error — it must not be able to *correct* it into something more comfortable. An operator who can edit an extraction from a regulatory instruction can quietly soften every deadline imposed on them.

```python
def may_edit_extraction(user_id, extraction) -> bool:
    doc = documents.get(extraction.document)
    if doc.doc_class == "REGULATOR_ISSUANCE":
        return False                      # flag path only, always
    return fga.check(
        user=f"user:{user_id}",
        relation="internal_viewer",
        object=f"mine:{doc.mine_id}",
        context={"current_time": now_iso()},
    )
```

Flagged regulator extractions route to a queue the regulator can see. That's the inverted-accountability idea doing real work rather than sitting on a slide.

---

## 12. Evaluation

**Do not report a single accuracy number.** It hides everything.

| Metric | On |
|---|---|
| Precision / recall / F1 | Obligation detection (is this a duty?) |
| Macro-F1 | Deontic classification |
| Field accuracy, per field | owner_role, periodicity, due_rule, evidence_type — separately |
| Span IoU ≥ 0.5 | Anchor correctness |
| Grounding rate | % of verbatim fields that align to source. **Target 100%.** |
| Expected Calibration Error | Confidence quality |
| Reviewer edit rate | % of accepted extractions needing a field edit — the real usability metric |

**Held-out set:** 60–80 hand-annotated EC conditions from letters the model never saw, ideally from a different subsidiary so you're measuring generalisation rather than memorisation.

**Report absolute numbers.** Relative improvements ("89% better than baseline") conceal whether the result is usable. State precision and recall in plain figures, next to the CUAD baseline for context.

---

## 13. Failure modes

| Failure | Handling |
|---|---|
| Zero obligations found in an EC letter | Almost always OCR failure upstream, not an empty letter. Alert loudly; don't publish an empty register. |
| Model invents a plausible obligation | Grounding check (§5 L4) rejects it. This is why the check is mandatory. |
| Compound condition extracted as one | Reviewer `SPLIT`; feed back as training signal. |
| Due rule unresolvable from text | `UNRESOLVED` + triage queue. Never guess a date. |
| Owner role absent from text | `UNASSIGNED` + triage. Do not default to Manager silently. |
| Table parameters missed | Flag segments containing tables for mandatory review regardless of confidence. |
| Corrigendum changes a condition | Re-extract; flag derived obligations for re-review; never silently mutate a live obligation. |
| Confidence high but extraction wrong | Calibration problem. Recalibrate rather than raising the threshold. |
| Reviewer accepts everything without reading | Sample-audit acceptances; track per-reviewer edit rate. A reviewer with a 0% edit rate is rubber-stamping. |

---

## 14. Scope

### In

- [ ] Rule layer: numbering, dates, quantities, cross-references, modals
- [ ] Duty-sentence classifier and deontic classification
- [ ] Extractive QA for subject, action, periodicity, evidence type, due rule
- [ ] Constrained structuring with mandatory grounding check
- [ ] Validators
- [ ] Confidence calibration and triage queue
- [ ] Due-rule vocabulary including `UNRESOLVED`
- [ ] Applicability capture
- [ ] Observation extractor (≥3 inspection body formats)
- [ ] Claimed-status extractor and reconciliation states
- [ ] Evidence-to-obligation matching with three outcomes
- [ ] Review UI with per-field anchors and correction capture
- [ ] Regulator-issuance flag-only path
- [ ] Evaluation harness and held-out set
- [ ] One retrain cycle on collected corrections

### Out — on the slide, with reasons

- **Full deontic logic reasoning.** Formalising obligations into logic and mechanically checking consistency is a research programme. §15 of the conflict-detection idea is scoped to numeric and scheduled parameters only.
- **General semantic contradiction detection.** Tractable for parameters, unsolved for prose.
- **Handwritten field notebooks.** Separate research problem.
- **Languages beyond English–Hindi.** Name what you'd add.
- **Automatic acceptance above a confidence threshold.** Deliberately excluded — it converts decision support into automated determination, which is a legal liability and not defensible at current accuracy.
- **Cross-document coreference** ("the said condition", "as amended by our letter of 12 May").

---

## 15. Tests

| # | Scenario | Expected |
|---|---|---|
| 1 | Clean EC condition, single duty | Extracted, all fields anchored |
| 2 | Compound condition, three duties | Flagged for `SPLIT`, not silently merged |
| 3 | Recital / background sentence | **Not** extracted as an obligation |
| 4 | Definition clause | Not extracted |
| 5 | Prohibition ("shall not discharge...") | `deontic = PROHIBITION`, no `evidence_type` |
| 6 | Condition with parameters in a table | Table segment forced to review |
| 7 | "six-monthly report" vs "plantation each half-year" | Same periodicity, **different due_rule** |
| 8 | "prior to commencement of next phase" | `due_rule.kind = UNRESOLVED`, triaged |
| 9 | No named role in the text | `owner_role = UNASSIGNED`, triaged |
| 10 | LLM emits a paraphrased subject | **Rejected — ungrounded** |
| 11 | Every accepted extraction | Grounding rate 100% |
| 12 | Compliance report claims COMPLIED, no evidence | `CLAIMED_UNSUPPORTED`, not `AGREED` |
| 13 | Evidence exists but nothing claimed | `UNREPORTED` |
| 14 | Evidence says 38 ha against a 40 ha duty | `PARTIALLY_SATISFIES` |
| 15 | Mine user edits an extraction from a DGMS notice | **DENY** — flag path only |
| 16 | Mine user flags the same extraction | Allowed; routes to regulator queue |
| 17 | Reviewer corrects periodicity | Correction stored with anchor |
| 18 | Same document re-run after retrain | Extractor version differs; results diffable |

**Tests 10, 12 and 15 are the ones a judge will probe.** Have them running live.

---

# Addendum A — four additions

Added after review. Each slots into an existing section; none replaces anything above.

## A1. Decomposition is a pipeline stage, not a review action

**Slots into:** §5, as a new stage between L3 and L4.

The spec currently handles compound conditions *reactively* — the extractor produces one obligation and the reviewer hits `SPLIT` (§10, Test 2). That works, but it puts the hardest judgement on the human every time, and it means the default output is wrong for a large share of real conditions.

Make it proactive. Take a realistic EC condition:

> **17.** The project proponent shall undertake progressive plantation over 40 hectares within two years of commencement, shall submit six-monthly reports on plantation progress to the Regional Office, and shall maintain records of species planted and survival rates for inspection.

Three duties, not one:

| # | Duty | Periodicity | Due rule | Evidence |
|---|---|---|---|---|
| 17.1 | Plant 40 ha | one-time | 2 years from commencement | Survey report + photos |
| 17.2 | Report progress to RO | six-monthly | 1 June / 1 December | Submitted report |
| 17.3 | Maintain species/survival records | continuous | always current | Register, on demand |

**Why collapsing them is dangerous:** the missed six-monthly report never registers as overdue, because the system thinks the clause isn't due until 2028. The continuous record-keeping duty disappears entirely.

**Decomposition signals:** repeated modal verbs · coordinating conjunctions joining verb phrases ("and shall") · enumerated sub-items (a)(b)(i)(ii) · a shift in periodicity language mid-clause · a shift in responsible actor mid-clause.

**Rules:**
- Every decomposed duty inherits the parent's anchor and takes a sub-identifier (`cond_17__d1`, `d2`, `d3`)
- The reviewer always sees them **grouped under the parent clause**, so the decomposition itself is reviewable
- `MERGE` becomes as important as `SPLIT` — the decomposer will over-split as well as under-split
- Any decomposed clause is flagged for review regardless of confidence

## A2. The candidate filter — the "shall" trap

**Slots into:** §5, extending L2.

Tests 3 and 4 cover recitals and definitions. The filter needs to be broader, because not every `shall` creates a duty on the proponent:

| Text | Actually is | Correct handling |
|---|---|---|
| "This clearance shall be valid for thirty years" | Recital — a fact about the instrument | Not an obligation |
| "The above conditions shall be enforced by the Regional Office" | Duty on the **regulator** | Store, `owner = REGULATOR`, no instances for the mine |
| "Failure to comply shall attract action under the EP Act" | **Penalty statement** | LegalRuleML `PenaltyStatement`, linked to the duty it enforces |
| "The proponent shall not undertake expansion without approval" | **Prohibition** | `deontic = PROHIBITION` (covered, Test 5) |
| "The proponent may, with prior permission, alter the schedule" | **Permission** | No instances generated |
| "…unless otherwise directed by the Chief Inspector" | **Defeasibility** modifying another duty | `defeasible_by`, attached to the parent duty |

Penalty statements and duties-on-the-regulator are the two that will actually show up in your register and embarrass you. Both are common in EC letters.

## A3. Omission detection — the cheapest check you can build

**Slots into:** §5 L5 validators. **Currently absent, and it guards the worst failure mode.**

§13 notes that zero obligations from an EC letter should alert loudly. But the realistic failure isn't zero — it's **64 obligations where there should be 68**, because page 7 OCR'd badly. Nothing in the current spec detects that, and nothing in review can, because **a reviewer cannot see what isn't on the screen.**

The check:

```
clauses the document appears to declare   (numbering runs 1…68, or stated in text)
                    vs
clauses we produced at least one extraction from
```

A gap fires a document-level flag: *"Clauses 41–44 produced no extractions. Page 7 mean OCR confidence 0.58. Review required."*

Also add:
- **Clause sequence check** — numbering jumps from 17 to 71
- **Page coverage** — a page with text but zero extractions is suspicious in a conditions annexure
- **Anchor integrity** — every bbox lies within page bounds; every char offset resolves in the source

This is deterministic, takes an afternoon, and catches the one class of error that human review structurally cannot.

## A4. Sensitive data — extract first, redact at read

**Currently absent.**

The intuitive design is to redact personal data *before* the model sees it. **That breaks the system.** The identity in the document is frequently the legally relevant fact: Form 4-A names the deceased, Form 2-D names the appointed Manager, an inspection observation names the person responsible. Redact first and you cannot extract responsibility — which is most of what compliance is.

**Correct order:**

```
Extract from FULL text, entirely within the local environment
        ↓
Classify each extracted field: PII / not PII
        ↓
Store PII in a separate, access-controlled table
        ↓
Redact at READ time, per requester, via ReBAC
```

Minimise at the boundary, not at the source. The system holds the full fact; who may see it is an authorisation decision.

```python
def render_observation(requester_id, obs):
    can_see_identity = fga.check(
        user=f"user:{requester_id}",
        relation="internal_viewer",
        object=f"mine:{obs.mine_id}",
        context={"current_time": now_iso()},
    )
    return {
        "hazard":   obs.hazard,
        "location": obs.location,
        "person":   obs.person_name if can_see_identity else "[REDACTED]",
    }
```

**The defensible default:** a regulator sees the hazard, the corrective action and the responsible *appointment holder*; they do not see individual workers' names. Make that decision deliberately and log it — it's a good answer to a privacy question and nobody else will have thought about it.

Nothing leaves the local environment: no cloud OCR API, no hosted model. This aligns with the demo constraint that everything runs offline anyway.

## A5. One disagreement, resolved

§2 and §16 originally said *tune for precision over recall, because an invented obligation destroys trust faster than a missed one.* This addendum argued the opposite, and the project went with the addendum — §2 and §16 now read recall-first, this section is a pointer, not an open question.

**The reason, kept for the record:** the human review gate catches false positives cheaply — a reviewer looking at the source rejects a hallucinated obligation in seconds. But **a reviewer cannot see a false negative.** A duty that was never extracted does not appear on the review screen to be noticed. The two error types are not symmetrically caught, and the one your process cannot catch is the one you tune against.

**Where it landed:** `extraction_triage_config.surface_threshold` seeded at 0.30 (`data-model.md §2`), recall-first, with A3's omission detection as the safety net that makes it affordable. Report both precision and recall numbers openly and say which way you tuned and why — that reasoning is itself worth marks.

## A6. Additional tests

| # | Scenario | Expected |
|---|---|---|
| 19 | Compound condition, three duties | **Three obligations produced**, grouped under parent, flagged for review |
| 20 | Decomposer over-splits a single duty | Reviewer `MERGE`; logged as decomposition signal |
| 21 | "Failure to comply shall attract action" | `PenaltyStatement`, linked to parent duty — not an obligation |
| 22 | "…shall be enforced by the Regional Office" | `owner = REGULATOR`, no mine instances |
| 23 | "…unless otherwise directed by the Chief Inspector" | `defeasible_by` on the parent duty |
| 24 | Document declares 68 conditions, 64 extracted | **Document-level omission flag**, page identified |
| 25 | Clause numbering jumps 17 → 71 | Sequence flag raised |
| 26 | Page with text, zero extractions, in a conditions annexure | Flagged for review |
| 27 | Observation naming a worker, viewed by regulator | Name redacted, hazard and CAPA visible |
| 28 | Same observation viewed by mine Safety Officer | Name visible |
| 29 | Bbox falls outside page bounds | Anchor-integrity failure, extraction rejected |

---

## 16. Three sentences for the jury

> **One.** Our extractor selects rather than composes — every field in the register points at characters that exist in the source document, and anything the model produces that cannot be aligned back to source is rejected rather than published.

> **Two.** We tune for recall over precision and show the review queue openly, because a reviewer catches an invented obligation in seconds looking at the source — but a duty the extractor never surfaced never appears on that screen to be caught at all, and an unrecoverable miss is worse than a cheap false alarm.

> **Three.** When a mine's compliance report claims a condition was met and no evidence exists, we don't call that non-compliance — we call it a documentation gap, and separating those two is what makes the number on the dashboard something a mine official will actually act on.

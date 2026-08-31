# Strata — Document Pipeline Specification

**Component:** Document ingestion, extraction, review, signing and lifecycle
**Companion to:** Authorisation Specification (read §0–§3 of that first if ReBAC is new to you)
**Status:** Design spec, ready to build

---

## 0. Read this first

**What this component is:** everything that happens to a file between someone dragging it onto the screen and the system knowing what's inside it.

**Why it's the spine of the product, not a utility:** every duty Strata tracks originated in a document. Every proof that a duty was discharged is a document. If the document layer is weak, nothing above it can be trusted — and in a compliance system, "trusted" has a legal meaning, not a marketing one.

**The single rule everything else follows:**

> **The original bytes are never modified. Ever.**
> OCR text, extracted obligations, corrections, annotations — all of it hangs *off* the original as derived data, each item pointing back to the exact page and position it came from.

A compliance system that alters its own source documents is worthless in an inquiry. This constraint costs you nothing and buys you everything.

**Three terms:**

| Term | Meaning |
|---|---|
| **Original** | The bytes as uploaded. Immutable. Content-addressed. |
| **Derivation** | Anything the system produced from it — OCR text, segments, extracted obligations |
| **Provenance anchor** | A pointer from a derivation back to its exact source location: page, bounding box, character offset |

---

## 1. One pipeline, many purposes

The insight that shapes this component: **an EC letter, a six-monthly compliance report, PSC minutes and a Form 4-A accident notice all run through the same nine stages.** They diverge only at the extraction step — what we look for and where the result lands.

Build one pipeline, not six.

```
   UPLOAD ─► STORE ─► OCR ─► CLASSIFY ─► SEGMENT ─► EXTRACT ─► REVIEW ─► PUBLISH ─► SIGN
      │        │       │        │           │          │          │         │         │
   who may  content  text +  what kind   clauses,   type-       human    becomes   legally
   upload   -addr,   layout  of doc      sections,  specific    gate     visible   binding
   this     hashed,  boxes   is this?    tables     payload              to others  attestation
   here?    sealed
```

### 1.1 What each document type yields

| Document | Typical origin | Extraction target | Lands in |
|---|---|---|---|
| EC letter | MoEFCC via PARIVESH | Numbered conditions | Obligation register |
| DGMS permission | DGMS | Permission conditions | Obligation register |
| Mining plan | CMPDI / approved | Commitments, bench levels, dump design | Obligations + geospatial |
| CMR 2017, circulars | Statute | Regulations, amendments | Obligation register |
| Six-monthly compliance report | The mine itself | Claimed status per condition | Reconciliation against register |
| PSC minutes, IUSA, audit report | Internal inspection bodies | Observations | Defect ledger |
| Form 4-A / 4-B | The mine, to DGMS | Accident particulars | Incident record |
| DGMS notice, s.22 order | Regulator | Directions, deadlines | Findings, non-closable by operator |
| Form XIII, licences, certificates | Contractor | Party, scope, validity dates | Contractor register |
| Lab results, third-party certificates | External | Measured values, dates | Evidence, matched to obligations |

**Note the asymmetry.** Some documents *create* obligations. Some *claim* obligations were met. Some are *evidence* of that claim. The pipeline is identical; the destination and the authorisation are not.

---

## 2. Document states

```
  UPLOADED ──► PROCESSING ──► NEEDS_REVIEW ──► PUBLISHED ──► SIGNED
      │             │                │              │            │
      │             │                │              │            └─► SUPERSEDED
      │             ▼                ▼              │
      │          FAILED         REJECTED            └─► WITHDRAWN
      │             │
      └─────────────┴──► QUARANTINED  (virus, malformed, wrong tenant)
```

| State | Meaning | Who sees it |
|---|---|---|
| `UPLOADED` | Bytes stored, sealed, nothing done yet | Uploader only |
| `PROCESSING` | OCR / classification / extraction running | Uploader only |
| `NEEDS_REVIEW` | Extraction complete, awaiting human confirmation | Internal, that mine |
| `REJECTED` | A human said the extraction is wrong; needs rework | Internal |
| `PUBLISHED` | Confirmed, derivations are live in the register | Internal + regulator |
| `SIGNED` | Cryptographically attested (§6) | Internal + regulator |
| `SUPERSEDED` | A newer version exists; still readable, no longer authoritative | All who could see it |
| `WITHDRAWN` | Retracted. Never deleted. | Internal, marked |
| `QUARANTINED` | Failed safety checks | Admin only |

**Nothing is ever deleted.** Withdrawal and supersession are states, not removals. This is not a nice-to-have — a compliance system that can lose a document cannot survive an audit.

---

## 3. The stages

### 3.1 Upload

**Authorisation gate — this is the first ReBAC touchpoint.**

The question is not "may this user upload?" It is **"may this user upload *this kind* of document *at this mine*?"** Those are different questions and RBAC can only answer the first.

Concrete cases:

- The Env Officer at Gevra may upload a six-monthly EC compliance report for Gevra. Not for Dipka.
- A contractor may upload his own Form XIII and licences. He may **not** upload an inspection report.
- Nobody at the mine may upload a DGMS notice as if it were regulator-issued — that would let a mine fabricate a regulatory instruction. Regulator issuances are uploaded by regulators, or ingested from the source portal with provenance.
- The Manager may upload anything at his mine, while his appointment is valid.

Model addition:

```
type document
  relations
    define at_mine:            [mine]
    define uploaded_by:        [user]
    define issued_by_regulator:[region]
    define owner_org:          [contractor_org]
    define doc_class_marker:   [user:*]      # see note below

    define internal_viewer: internal_viewer from at_mine
    define viewer: internal_viewer
                   or uploaded_by
                   or member from owner_org
    define published_viewer: published_viewer from at_mine

    define can_annotate: internal_viewer
    define can_review:   internal_viewer
    define can_publish:  manager from at_mine or env_officer from at_mine
    define can_sign:     manager from at_mine
    define can_supersede: can_publish
    define can_withdraw:  can_publish
```

**Note on document class.** Which classes a user may upload is *not* a graph question — the class is a column on the document. Same pattern as severity in the authorisation spec: **the graph says who is related to the mine; the app maps class → required relation.**

```python
UPLOAD_PERMISSION = {
    "EC_COMPLIANCE_REPORT": "env_officer",
    "INSPECTION_REPORT":    "internal_uploader",
    "ACCIDENT_NOTICE":      "manager",
    "CONTRACTOR_DOC":       "contractor_uploader",
    "EVIDENCE":             "internal_uploader",
    "REGULATOR_ISSUANCE":   "regulator_uploader",   # never an operator
}

def may_upload(user_id, doc_class, mine_id):
    relation = UPLOAD_PERMISSION.get(doc_class)
    if relation is None:
        raise UnknownDocumentClass(doc_class)
    return fga.check(
        user=f"user:{user_id}",
        relation=relation,
        object=f"mine:{mine_id}",
        context={"current_time": now_iso()},
    )
```

Also at upload: size limits, MIME sniffing (never trust the extension), virus scan, page count cap, and a per-user rate limit. Anything failing goes to `QUARANTINED`, not to an error toast.

### 3.2 Store — content-addressed and sealed

The document's identity **is** the SHA-256 of its bytes.

```
sha256:8f14e45fceea167a5a36dedd4bea2543...
```

Three consequences worth understanding:

1. **Deduplication is free.** The same EC letter uploaded by three people is one object with three upload records.
2. **Tampering is detectable.** Change one byte and the hash no longer matches the identifier. There is nowhere to hide.
3. **The hash is what you sign.** §6.

Store in object storage (S3-compatible, or local filesystem for the demo) with a write-once policy. The database holds metadata; the blob store holds bytes and never sees an update.

Immediately on store, write the first audit row: who uploaded, when, from where, what hash, what declared class.

### 3.3 OCR and layout

Native-text PDFs: extract directly, no OCR, keep the character offsets.

Scanned PDFs and images: OCR with layout. You need more than text — you need **where each word sits on the page**, because that's what makes provenance anchors possible.

Output per page: text, word-level bounding boxes, reading order, detected tables, rotation angle, confidence.

**Realities to design for, not discover:**

- Government scans are skewed, stamped, sometimes rotated 90°, often photocopies of photocopies. Deskew and orientation-detect before OCR, not after.
- Rubber stamps and signatures overlap text and produce garbage tokens. Detect and mask stamp regions.
- English–Hindi mixed script inside one paragraph is normal.
- Tables in EC letters carry the numeric parameters that matter most (hectares, frequencies, limits) and are the hardest thing to extract. Budget for this specifically.

**Low OCR confidence does not fail the document — it raises the review priority.** A page at 0.62 mean confidence goes to the top of the review queue with its low-confidence words highlighted.

### 3.4 Classify

What kind of document is this? Predict the class, and **always show the prediction to the uploader for confirmation.** Misclassification silently routes an accident notice into the evidence bucket, which is a much worse failure than asking one question.

Signals: title block text, presence of a reference-number pattern, issuing letterhead, structural shape (numbered conditions vs. minutes vs. a form), the uploader's declared class.

Disagreement between predicted and declared class → mandatory review, never silent override.

### 3.5 Segment

Break the document into addressable units with stable identifiers.

For an EC letter: preamble, then conditions `1`, `2`, … `17(a)`, `17(b)`, then annexures. For minutes: agenda items and resolutions. For a form: named fields.

Each segment carries an **Akoma Ntoso-style identifier** and a provenance anchor:

```json
{
  "segment_id": "cond_17_b",
  "akn_ref": "/akn/in/act/ec/2019/secl-gevra/main#cond_17__b",
  "text": "The project proponent shall undertake plantation over 40 hectares ...",
  "anchor": {
    "doc": "sha256:8f14e45f...",
    "page": 7,
    "bbox": [72, 410, 523, 448],
    "char_start": 18422,
    "char_end": 18571
  }
}
```

**Every downstream object keeps this anchor.** When a judge clicks an obligation and the app jumps to page 7 and highlights the sentence, that's this field doing its job — and it's the single most convincing thing in your demo.

### 3.6 Extract

Type-specific. Same pipeline, different payload:

- EC letter → obligations (deontic type, owner role, periodicity, due rule, evidence type)
- Compliance report → claimed status per condition, with the condition reference it claims to answer
- Inspection report → observations (location, hazard, severity, raised date)
- Form 4-A → incident particulars
- Contractor doc → party, scope, validity window

Every extracted item carries a confidence and its anchor. Nothing is auto-accepted above a threshold — see the next stage for why.

### 3.7 Review — the gate that makes the system credible

**No extraction becomes live without a human confirming it.**

This is not timidity. It's the difference between a decision-support system and an automated compliance determination, and the second one is a legal liability. It's also, unavoidably, what makes the output trustworthy: clause extraction is genuinely hard, published baselines sit well below what you'd want, and pretending otherwise is how you get caught.

The review screen:
- Document rendered on the left, extractions listed on the right
- Clicking an extraction highlights its source region
- Low-confidence items sorted to the top
- Actions: accept, edit, reject, split, mark not-applicable-to-this-mine
- Every correction is stored as a training example

**Design the review UI to be fast.** Sixty-eight conditions is a real review session. Keyboard-first, single-key accept, no modal dialogs.

`can_review` = any internal viewer at that mine. `can_publish` is narrower — Manager or Env Officer — because publishing is what makes obligations live.

### 3.8 Publish

Extractions become live objects: obligations enter the register, observations enter the defect ledger, claimed statuses enter reconciliation.

The document becomes visible to the regulator. **Before this point it is not.** Draft state stays internal — a system that exposes every half-reviewed note to the regulator will never be adopted, and that adoption argument is worth stating out loud.

### 3.9 Sign

§6.

---

## 4. Supersession and versioning

Documents get revised. A corrigendum amends an EC condition. A revised mining plan is approved. An inspection report is reissued.

**Never overwrite.** Create a new document, link it:

```
doc:ec_gevra_2019_corr_1   supersedes   doc:ec_gevra_2019
```

Then:

- The old document moves to `SUPERSEDED` — still readable, still linked from every obligation it created
- Obligations derived from superseded segments are flagged for re-review, not silently changed
- **A signature on the old document remains valid for the old document.** It attested to that state at that time. It does not transfer.

This is what makes compliance time-travel possible: the state as of March 2026 is reconstructible because nothing from March 2026 was destroyed.

---

## 5. Authorisation walkthrough — the tint you asked for

Four scenarios, showing what the graph answers and what the app answers.

### Case 1 — Env Officer uploads the six-monthly EC report

```
Check(user:a_verma, env_officer, mine:gevra_ocp)
  context: current_time = 2026-06-01
  → tuple: user:a_verma #env_officer mine:gevra_ocp
           condition valid_appointment [2024-05-10 → open]
  → ALLOW
```
App then checks `UPLOAD_PERMISSION["EC_COMPLIANCE_REPORT"] == "env_officer"`. Match. Upload proceeds.

### Case 2 — Same person, same document, wrong mine

```
Check(user:a_verma, env_officer, mine:dipka_ocp)
  → no tuple
  → DENY
```
He is not "an Env Officer." He is Env Officer **of Gevra**. This is the role-explosion problem solved in one row.

### Case 3 — Contractor uploads an inspection report

```
Check(user:mahalaxmi_sup_1, internal_uploader, mine:gevra_ocp)
  → member of contractor_org:mahalaxmi, engaged at that mine
  → but engagement grants contractor_uploader, not internal_uploader
  → DENY
```
He may upload his own Form XIII and certificates. He may not create inspection records. Same person, same mine, different document class, different answer — and the difference lives in one lookup table, not in a role hierarchy.

### Case 4 — Regulator views a document mid-review

```
Check(user:dgms_bsp_04, published_viewer, doc:gev_insp_0912)
  document.status = NEEDS_REVIEW  → not published
  → DENY
```
Once published:
```
  → inspector from covering_region → region:bilaspur covers mine:gevra_ocp
  → ALLOW
```
And the read is logged with a stated purpose, per the authorisation spec §8.

**Note where the line falls.** The graph answered *"is this person related to this mine, and how?"* The app answered *"what class is this document and what state is it in?"* Keep that boundary and both stay readable.

---

## 6. Signing — what you actually sign

The subtle part. Most systems sign a PDF. That's necessary and insufficient.

### 6.1 Sign the hash, not the file

A digital signature is computed over a hash. Since the document is already content-addressed by its SHA-256, you sign that. The signature is stored detached, alongside the document, never embedded in a way that changes the bytes.

### 6.2 Sign a manifest, not just a document

When the Manager signs the six-monthly EC compliance report, what is he attesting to? Not "this PDF exists." He is attesting that **a specific set of obligations was in a specific state on a specific date.**

So sign a manifest:

```json
{
  "manifest_version": 1,
  "document": "sha256:8f14e45f...",
  "mine": "mine:gevra_ocp",
  "period": "FY2026H2",
  "attested_at": "2026-06-01T09:14:00Z",
  "attested_by": "user:r_kumar",
  "appointment_ref": "appt:gevra_mgr_2025_26",
  "statements": [
    {"instance":"inst:ec_gevra_c17@FY2026H2","status":"SATISFIED",
     "evidence":["sha256:aa31...","sha256:bb92..."]},
    {"instance":"inst:ec_gevra_c23@FY2026H2","status":"SATISFIED",
     "evidence":["sha256:cc17..."]}
  ]
}
```

Hash the canonicalised manifest; sign that hash.

**Why this matters enormously:** you can now prove, years later, exactly what was claimed, by whom, under which appointment, backed by which evidence files. If an evidence file is later found to have been spoofed, you can identify every signed manifest that relied on it. No PDF signature gives you that.

This is also what makes compliance time-travel legally meaningful rather than merely interesting.

### 6.3 Which signature, where

| Act | Mechanism | Basis |
|---|---|---|
| Statutory submission | Mechanism required by the effective receiving-authority profile: CCA DSC, eSign, portal e-authentication or approved equivalent | Do not assume one mechanism for PARIVESH, DGMS, labour and Ministry filings |
| Internal approval (CAPA acceptance, review publish, field submission) | **Aadhaar eSign** | IT Act §3A; Evidence Act §85A presumption |
| Ordinary login | FIDO2 / passkey | — |

IT Act §5 makes an electronic signature equivalent to a handwritten one **when affixed in the prescribed manner**. That phrase is why the mechanism matters and why a button labelled "Approve" is not a signature.

**Know the exclusions:** the IT Act First Schedule excludes negotiable instruments, powers of attorney, trusts, wills and conveyance of immovable property. None bite here, but a judge may ask whether you know they exist.

### 6.4 The authorisation check on signing

```
Check(user:r_kumar, can_sign, doc:gev_ec_report_h2)
  → can_sign: manager from at_mine
  → user:r_kumar #manager mine:gevra_ocp
     condition valid_appointment [2025-04-01 → 2026-04-01]
  → current_time = 2026-06-01  →  condition FAILS
  → DENY
```

**The appointment lapsed, so the signature is refused.** This is exactly right: a statutory attestation signed by someone whose appointment had expired is worthless, and worse, it looks like fraud. Catching it at the moment of signing rather than at an inquiry three years later is the entire argument for time-bounded authorisation.

Store the `appointment_ref` in the manifest so the validity is provable after the fact.

---

## 7. Failure modes — design for these now

| Failure | Handling |
|---|---|
| OCR returns garbage | Don't fail. Publish with low confidence, route to top of review queue, highlight uncertain regions. |
| Wrong document class predicted | Confirmation prompt at upload; disagreement forces review. |
| Same document uploaded twice | Content-addressing dedupes automatically; record both upload events. |
| Corrupt or password-protected PDF | `QUARANTINED` with a specific reason, not a generic error. |
| Extraction finds zero conditions in an EC letter | Almost always an OCR failure, not an empty letter. Flag loudly. |
| Uploader's appointment expires mid-review | Review continues (reviewing isn't an authorisation-critical act); publishing is denied. Surface why. |
| Signature attempted with an expired appointment | Deny, log, tell the user precisely which appointment lapsed and when. |
| Superseding document arrives while obligations are live | Flag derived obligations for re-review. Never silently mutate a live obligation. |
| Evidence file later found spoofed | Query every signed manifest referencing that hash. Notify. This is why §6.2 exists. |
| Regulator requests a document mid-review | Denied, and the denial is logged. Publish first. |

---

## 8. Scope

### In

- [ ] Upload with class declaration, MIME sniffing, size and page limits
- [ ] Content-addressed immutable store
- [ ] OCR with layout and confidence, deskew and orientation detection
- [ ] Document classification with confirmation
- [ ] Segmentation with Akoma Ntoso identifiers and provenance anchors
- [ ] Type-specific extraction for at least: EC letter, inspection report, compliance report
- [ ] Review UI with source highlighting and keyboard-first accept
- [ ] Publish gate
- [ ] Supersession and versioning
- [ ] Manifest signing with detached signatures
- [ ] ReBAC on upload, view, review, publish, sign
- [ ] Full audit trail on every state transition

### Out — with reasons on the slide

- **Automatic ingestion from PARIVESH on a schedule.** Scrape once, load a fixture. Live scraping at demo time is a liability.
- **Handwriting recognition.** Field notebooks are handwritten; OCR on handwriting is a separate research problem.
- **Full CSP-integrated eSign with a live ESP.** Demo with a self-signed test certificate and explain the production path. Getting a real Class 3 token issued takes days you don't have.
- **Collaborative editing / redlining.** Not a document-authoring tool.
- **Long-term signature validation (LTV, timestamp renewal).** Real requirement over a 30-year retention period. Roadmap.
- **Multilingual extraction beyond English–Hindi.** Name the languages you'd add.

---

## 9. Tests

| # | Scenario | Expected |
|---|---|---|
| 1 | Env Officer uploads EC compliance report at his mine | ALLOW |
| 2 | Same, at a different mine | DENY |
| 3 | Contractor uploads own Form XIII | ALLOW |
| 4 | Contractor uploads an inspection report | DENY |
| 5 | Operator uploads a document classed REGULATOR_ISSUANCE | DENY |
| 6 | Regulator views a `NEEDS_REVIEW` document | DENY |
| 7 | Same document after publish | ALLOW, and the read is logged with purpose |
| 8 | Same file uploaded twice | One object, two upload events |
| 9 | One byte altered in storage | Hash mismatch detected on read |
| 10 | Manager signs with a valid appointment | ALLOW; manifest records `appointment_ref` |
| 11 | Manager signs after appointment expiry | **DENY**, with the lapse date in the message |
| 12 | Superseding document uploaded | Old → `SUPERSEDED`; derived obligations flagged |
| 13 | Old signature verified after supersession | Still valid, for the old document |
| 14 | Extraction accepted then corrected by a reviewer | Correction stored as a training example; anchor preserved |
| 15 | Click any obligation | Jumps to the exact page and highlights the source sentence |

**Test 15 is the demo.** Test 11 is the one a judge will probe.

---

## 10. Three sentences for the jury

> **One.** We never modify a source document. Every obligation, observation and claim in the system points back to the exact page and sentence it came from, so anything the system asserts can be verified against the original in one click.

> **Two.** Upload, view, review, publish and sign are five different permissions, and each depends on the relationship between that person and that mine at that moment — a contractor can upload his own licence but not an inspection report, and a mine can never upload a regulatory notice as though a regulator had issued it.

> **Three.** When a Manager signs a compliance report he isn't signing a PDF — he's signing a manifest of exactly which obligations he claims were satisfied and which evidence files back each claim, under a named statutory appointment that the system verified was valid at that instant.

# Strata — Master Solution Context

**SIH Problem Statement 26024** — AI-Based Smart Governance and Compliance Monitoring System for Coal Mines
**Organisation:** Ministry of Coal · **Department:** Coal India Limited · **Category:** Software · **Theme:** Smart Automation

---

## 0. How to read this document

Sections 1–5 are **findings** — what the problem is, what exists, where the real gap is. These are research outputs, and every claim is sourced.

Sections 6–12 are **our design** — what we propose and why.

Sections 13–17 are **execution** — data, phasing, risks, defence.

Appendices are reference material you will actually use during the build.

If you read only one thing, read **Section 5**. It is the entire thesis.

---

# PART I — THE PROBLEM

## 1. What the problem statement asks

### 1.1 Background as stated

Indian coal mining spans multiple subsidiaries, mine sites, contractors, regulatory bodies and field offices. Governance activities — statutory compliance monitoring, inspection tracking, safety observations, production reporting, environmental monitoring, worker attendance, contract management, grievance handling and regulatory reporting — are managed through fragmented systems, manual documentation, spreadsheets and delayed reporting.

Stated consequences: data inconsistency, delayed decision-making, limited transparency, compliance gaps, duplication of records, weak monitoring of field-level activities, difficulty obtaining real-time operational insight.

### 1.2 The nine required capabilities

The PS states the solution *should*:

1. Digitally track statutory compliance for safety, environment, production and labour regulations
2. Enable real-time monitoring of inspections, observations, violations and corrective actions
3. Use AI/analytics to identify high-risk areas, recurring compliance failures and operational anomalies
4. Provide geo-tagged and time-stamped field reporting through mobile applications
5. Integrate dashboards for mine officials, corporate management and regulatory authorities
6. Generate automated alerts, reminders, compliance reports and escalation mechanisms
7. Minimise manual paperwork; improve transparency, accountability and decision-making
8. Be scalable across multiple mines and subsidiaries
9. *May* use AI/ML, mobile apps, GIS mapping, OCR, workflow automation, blockchain audit trails or multilingual conversational interfaces

**Note on item 9:** the word is *may*, not *must*. Blockchain and chatbots are permitted, not required. Teams routinely misread this and lose weeks.

### 1.3 The five named deliverables ("Expected Solution")

1. Centralized dashboard for mine officials, corporate management and regulatory authorities, with real-time compliance and operational monitoring
2. AI/analytics engine to detect compliance risks, operational anomalies, recurring violations, and generate predictive alerts
3. Geo-tagged mobile application for field inspections, safety observations, attendance and incident reporting, with offline support
4. Automated workflow system for alerts, reminders, escalations, digital approvals and statutory report generation
5. GIS mapping, OCR-based document digitisation, and secure digital audit trails for transparent and paperless governance

Framed as a single digital ecosystem integrating compliance monitoring, inspection management, operational reporting, contractor management and field activity tracking, via web and mobile.

### 1.4 The six expected outcomes

Improved governance efficiency and transparency · reduced delays and errors in compliance management · data-driven monitoring and faster administrative decisions · strengthened accountability and real-time field tracking · paperless governance · **a scalable indigenous e-governance framework for Indian coal mines**.

That last word — *indigenous* — is a signal about self-reliance framing. It matters for how we present foreign training data (Section 13.4).

### 1.5 Honest read of the PS

This is a **scope trap**. The bullet list describes a multi-year systems-integration contract, not a project. The failure mode is not "we can't build it" — it is "we build eleven shallow features, and so does everybody else."

Grading rewards depth on one hard thing. It does not reward feature count.

---

## 2. Domain primer — terms you must know cold

| Term | Meaning |
|---|---|
| **CIL** | Coal India Limited. Holding company under Ministry of Coal. |
| **Subsidiaries** | ECL, BCCL, CCL, NCL, WCL, SECL, MCL, NEC. Plus SCCL (state), NLCIL (lignite). |
| **Area** | Administrative unit between subsidiary and mine. Several mines per Area. |
| **CMPDI** | Central Mine Planning & Design Institute. CIL subsidiary; does exploration, mine planning, drone/LiDAR survey, and built SWCS. |
| **CCO** | Coal Controller's Organisation. Under MoC. Grants Mine Opening Permission; administers Star Rating. |
| **DGMS** | Directorate General of Mines Safety. **Under Ministry of Labour & Employment, not MoC.** Enforces mine safety law. |
| **MoEFCC** | Ministry of Environment, Forest & Climate Change. Grants EC; runs PARIVESH. |
| **Mines Act 1952** | Parent safety statute. s.22 = prohibitory orders. s.48(4) = register of persons employed. |
| **CMR 2017** | Coal Mines Regulations 2017. The operative safety regulations. |
| **Reg 181(3)** | (CMR) equipment approval provision for hazardous-area electricals. |
| **Form 4-A / 4-B** | Notice of accident or dangerous occurrence / particulars of deceased or injured. |
| **EC** | Environmental Clearance. Comes with 40–90 numbered conditions. |
| **FC / WLC / CTE / CTO** | Forest Clearance / Wildlife Clearance / Consent to Establish / Consent to Operate. |
| **ISO** (here) | Internal Safety Organisation — CIL's in-house safety body per subsidiary. Not the standards body. |
| **PSC** | Pit Safety Committee. Mine-level, monthly. |
| **IUSA** | Inter-Unit Safety Assessment. Quarterly. |
| **HEMM** | Heavy Earth Moving Machinery. |
| **OC / UG** | Opencast / Underground. |
| **Degree I/II/III** | Gassiness classification of underground coal seams. Determines flameproof equipment zones. |
| **Ex d / Ex e / Ex i** | Flameproof / increased safety / intrinsically safe protection types. |
| **CAPA** | Corrective and Preventive Action. |
| **Mte** | Million tonnes. Fatality rate is expressed per Mte. |

---

# PART II — THE CURRENT STATE

## 3. As-is flows

### 3.0 The structural fact underneath everything

**The owner and the regulator sit in different ministries.**

- Coal India reports to the **Ministry of Coal**
- DGMS, which inspects and enforces mine safety law, reports to the **Ministry of Labour & Employment**
- Environmental conditions are enforced by **MoEFCC**

No single body owns the union of those three obligation sets. This is the root cause of the fragmentation the PS describes, and it is why no dashboard built purely inside CIL can solve it.

### 3.1 Pre-operational clearances — SWCS (well digitised)

Single Window Clearance System, launched 11 January 2021, is a consolidated gateway for the clearances needed to operationalise a coal mine: mining plan and mine closure plan approval, grant of mining lease, environment and forest clearances, wildlife clearance, land acquisition, central ground water clearance, consent to establish, consent to operate.

Live modules:
- **Mining Plan Approval**
- **Mine Opening Permission** (7 Nov 2024, granted by CCO) — of 27 proposals received, 19 granted, 8 under process
- **Exploration Module** (July 2025) — exploration scheme vetting, periodic progress updates, geological report submission and approval, observation communication, compliance uploads, final approval
- **PRIMS** — project data per CMDPA and vesting order; tracks clearances, production reporting, payments, performance guarantees
- **Request with Nominated Authority** sub-module
- Integrated with NSWS; integration with PARIVESH 2.0 completed and under implementation

Built with CMPDIL.

**Verdict: solved. Do not propose to improve this.**

### 3.2 Internal safety inspection — the pyramid

CIL runs a layered internal cadence entirely separate from the regulator:

| Layer | Cadence | Source |
|---|---|---|
| Safety Officer at mine (staff officer to Mine Manager) | Continuous | CIL Safety Policy |
| Workmen's Inspector | Periodical | MoC AR Ch.11/14 |
| **Pit Safety Committee** | **Monthly** — observations deliberated in monthly PSC meeting | MoC AR 2019-20 Ch.11 |
| **Inter-Unit Safety Assessment team** | **Quarterly** | MoC AR 2019-20 Ch.11 |
| **Central Safety Council members** | **Six-monthly** | MoC AR 2019-20 Ch.11 |
| Inter-Area Safety Audit | Multi-disciplinary teams, format designed by Corporate Safety Division | MoC AR 2022-23 Ch.14 |
| Check Audit | Assesses quality of the audit process itself | MoC AR 2022-23 Ch.14 |

Above the mine: the **Internal Safety Organisation (ISO)** per subsidiary — multi-disciplinary, headed by an officer next in rank only to Director (Technical), field setup starting above mine level. Reviewed **once every quarter by the CMD**.

At national level: the **Standing Committee on Safety in Coal Mines**, the highest tripartite body, chaired by the Union Minister, with DGMS, management and unions. Below it, subsidiary-level tripartite safety committees.

**BOTTLENECK — this is the most important finding in the document.**

A single mine is inspected by six or seven different bodies, on different cadences, using different formats, each producing its own observations and its own compliance report. **There is no shared register of open observations.**

The same physical defect gets raised by the PSC in March, the IUSA team in May, and the safety audit in August, as three unrelated items in three unrelated registers. Nobody can answer: *"how many distinct open observations exist at this mine right now?"*

### 3.3 DGMS statutory enforcement

Registration and returns run through Shram Suvidha; inspection assignments generated and reported online; unified online annual returns. Findings issue as contravention letters and notices. Prohibitory orders under Mines Act s.22 are the severe end. Accidents notified on CMR Form 4-A; casualty particulars on Form 4-B.

**BOTTLENECK:** DGMS has long operated under a shortage of inspecting officers — acknowledged in its own standard notes. A scarce inspectorate allocates visits without a risk-ranked national queue. Closure of prior observations is tracked at the mine, on paper. The regulator cannot see, across all mines in a region, which of its own past observations remain open.

### 3.4 Environmental compliance

EC granted with numbered conditions → six-monthly compliance reports filed on PARIVESH → Regional Offices use that data to prioritise site inspection of non-reporting projects → EAC minutes record condition-by-condition status.

**BOTTLENECK:** conditions exist only as prose in a PDF. Nobody holds them as structured records with owners and due dates. *"Which of our 68 conditions are overdue today?"* is unanswerable without a human reading the letter. The Regional Office can detect **non-reporting**, but not **non-compliance within a report**.

### 3.5 Attendance and contractor management

**CMR 2017 Regulation 40(3):** every person shall, immediately before proceeding to work and immediately after terminating work at end of shift, have his name recorded in the register maintained under s.48(4) of the Act. For belowground workings, the person shall get his name recorded **every time he proceeds belowground or returns to the surface**. An electronic punching or registry system **as approved by the Chief Inspector** may be used for identification, marking attendance and recording the name — **and a hard (printed) copy of such record shall be kept forthwith** in the register.

Contractor side: **ICIS** (coalindiaicis.com) — Digital Form XIII registration, centralised contractual labour database, certificate expiry alerts, Machine Reference Number registration.

**BOTTLENECK 1:** the statute that permits digital attendance simultaneously mandates printing it. The named remedy — Chief Inspector approval of the electronic system — is the actual path to paperless attendance, and no team knows it exists.

**BOTTLENECK 2:** ICIS does not connect to safety findings. A contractor with repeat violations at one mine carries no signal to another.

### 3.6 Reporting upward

Mine → Area → Subsidiary ISO → CIL Corporate Safety → MoC. Published in MoC Annual Report Chapter 14, with the note that statistics are **subject to reconciliation with DGMS** and maintained calendar-year-wise.

Plus Star Rating self-evaluation, RTI responses, Parliament questions, CAG audit.

**BOTTLENECK:** that reconciliation note is the tell. CIL's accident numbers and DGMS's do not automatically agree, and reconciling them is manual. Two arms of government hold different versions of the same fatality count.

---

## 4. What already exists — the incumbent map

**Read this before writing a single slide.** Pitching "a centralized dashboard" to CIL means pitching something they already have five of.

| PS asks for | Already exists | Where |
|---|---|---|
| Contractor compliance, worker registration, machinery tracking | **ICIS** — Digital Form XIII, centralised labour DB, certificate expiry alerts, MRN registration | coalindiaicis.com |
| Geo-tagged field reporting + Web-GIS | **CMSMS + Khanan Prahari** — CMPDI + BISAG on NCoG; satellite change detection at ~3-month intervals plus geo-tagged citizen reporting. Live since 2018. | ncog.gov.in/CMSS |
| Inspection tracking + statutory returns | **DGMS / Shram Suvidha** — online mine registration, inspection assignment generation and reporting, unified annual returns | dgms.gov.in |
| Environmental compliance monitoring | **PARIVESH 2.0** — six-monthly EC compliance reports; ROs prioritise inspection of non-reporting projects; SWCS integration since Nov 2025 | parivesh.nic.in |
| Real-time operational monitoring | **ICCC** rollout across CIL subsidiaries — CCTV + AI video analytics, RFID access control, GPS/VTS, ANPR weighbridges, drone inputs, IoT sensors | CIL |
| Contracts, HR, attendance | **SAP ERP** across CIL | CIL Systems |
| Pre-operational clearances | **SWCS** (Section 3.1) | swcs.coal.gov.in |
| Mine-level compliance scoring | **Star Rating of Coal Mines** — 50 OC / 47 UG parameters, 7 modules | starrating.coal.gov.in |

**Consequence:** any pitch that positions as a replacement loses. The only defensible position is a layer *above* these that consumes from them.

---

## 5. The gap — the thesis of this project

> **The Ministry has digitised everything up to the moment a mine opens. The day it starts producing, compliance falls off a digital cliff into spreadsheets and six overlapping inspection registers.**

More precisely, three gaps, none of which any incumbent covers:

**Gap 1 — No obligation layer.** EC conditions, DGMS permission conditions, CMR duties, mine plan commitments and labour-law requirements exist only as prose in PDFs. No system holds them as atomic, machine-checkable records with owners, deadlines and required evidence. Every system tracks *documents*; none tracks *duties*.

**Gap 2 — No shared defect register.** Six inspection bodies, six registers, zero deduplication. The same defect can be open in three places and closed in none.

**Gap 3 — No evidence integrity.** Geo-tagged field capture is trivially spoofable, and nothing in the current stack proves that a compliance photo was taken where and when it claims.

**Everything we build addresses one of these three. Anything that doesn't, we cut.**

---

# PART III — WHAT WE PROPOSE

## 6. Positioning

> **Strata is a compliance control tower that turns statutory documents into machine-checkable obligations, collapses overlapping inspection registers into one defect ledger, and proves field evidence is real while interoperating with existing Ministry and authority systems.**

Say this sentence first in every jury round. Everything else is detail.

## 7. The two-lane model — the core design decision

Most teams model **the inspection** as the primary object. That is wrong, and it produces a system that can do nothing until inspections have accumulated (a cold start), and that structurally cannot see a missed deadline.

We run two lanes that converge:

### Lane A — Obligation lane (proactive)

```
Statutory documents
      ↓
Obligation register        (duties, with deontic type, owner, periodicity, evidence type)
      ↓
Obligation instances       (materialised per mine, per period, with a real due date)
      ↓
Evidence check             (satisfied | overdue)
```

This lane generates work **on day one from documents alone**, before any inspection has ever happened. It is what kills the cold start.

### Lane B — Violation lane (reactive)

```
Risk score  →  Inspection  →  Finding  →  CAPA  →  Verify  →  Close
```

This is the lane most teams build, and it is fine — it is just half the system.

### The junction

**An overdue obligation auto-escalates into a finding.** One arrow. It is the design.

### Third object — the defect

Underneath Lane B sits a distinct entity: the **defect**. A physical condition at a location over a duration. An inspection is merely an *observation event* that notices it.

```
PSC observes it in March      ┐
IUSA observes it in May       ├──→  ONE DEFECT, age 147 days
Safety audit observes in Aug  ┘
```

Today these are three unrelated rows. Collapsing them is the single highest-value thing in the product (Section 9.2).

---

## 8. Architecture

```
INPUTS
  Statutory corpus        Existing portals         Field capture          Geospatial
  EC letters, CMR,        DGMS, PARIVESH,          offline app,           CartoDEM, drone,
  DGMS circulars          ICIS, SWCS               RFID reader graph      Sentinel-2, OSM
        │                       │                        │                     │
        └───────────────────────┴────────────┬───────────┴─────────────────────┘
                                             ↓
                              ┌──────────────────────────────┐
                              │      OBLIGATION GRAPH        │
                              │  every duty, clause-linked   │
                              └──────────────┬───────────────┘
                                             ↓
              ┌──────────────────────┬───────┴────────┬──────────────────────┐
              ↓                      ↓                ↓                      ↓
        DEFECT LEDGER          RISK ENGINE       3D GEOMETRY        CHANGE IMPACT
     entity resolution      repeat-violation    volume, slope,      circular → affected
     across 6 registers        scoring            geofence            obligations
              │                      │                │                      │
              └──────────────────────┴────────┬───────┴──────────────────────┘
                                              ↓
                              ┌──────────────────────────────┐
                              │       CONTROL TOWER          │
                              │  role-scoped via ReBAC       │
                              │  mine / area / HQ / regulator│
                              └──────────────────────────────┘
```

## 9. Core components in detail

### 9.1 Obligation extraction engine

**Input:** EC letter, DGMS permission letter, mining plan conditions, CMR clauses, DGMS circulars.
**Output:** structured obligations.

Each obligation carries:

| Field | Example |
|---|---|
| `deontic_type` | Obligation / Prohibition / Permission |
| `source_doc` + `clause_ref` | EC letter EC25A042WB110952, condition 17(b) |
| `text` | verbatim source sentence |
| `owner_role` | Mine Manager / Environment Officer / Contractor |
| `periodicity` | one-time / monthly / quarterly / six-monthly / annual / continuous |
| `evidence_type` | report / photo / lab result / register entry / third-party certificate |
| `due_rule` | e.g. "within 30 days of end of half-year" |
| `applicability` | conditions under which this applies to a given mine |

**Standards, not invention:**
- **Akoma Ntoso** (OASIS, `application/akn+xml`, developed with UN DESA) for document structure and stable clause-level identifiers → provenance solved by a standard.
- **LegalRuleML** for the norms — deontic operators (Obligation / Permission / Prohibition), `PenaltyStatement`, `ReparationStatement` (= corrective action, a literal PS bullet), defeasibility (= DGMS exemptions and relaxations overriding base regulations), maps to RDF.

**Honest limit:** full LegalRuleML XML is heavy. We use a subset — keep the deontic vocabulary and Akoma Ntoso ID scheme, store in Postgres JSONB, *export* LegalRuleML. State this; do not claim full conformance.

**ML approach:** fine-tune extractive QA on **CUAD** (510 contracts, 13,000+ expert labels, 41 clause types, CC BY 4.0, SQuAD-style JSON), then transfer to 200–300 hand-annotated EC conditions in Label Studio. Known baseline: DeBERTa-xlarge ≈ 44% precision @ 80% recall on CUAD. Quote that number — it shows we read the literature and know this task is hard.

### 9.2 Unified defect ledger — entity resolution across six registers

**The problem it solves:** Section 3.2's bottleneck.

**Method — standard entity resolution, deliberately:**

1. **Blocking** — candidates restricted to same mine + same subunit/section. Cuts comparison space by orders of magnitude.
2. **Scoring signals:**
   - sentence-embedding similarity of observation text
   - hazard category match
   - equipment ID / location tag match
   - geo proximity where available
   - temporal plausibility (defects persist; a 3-year merge is suspicious)
3. **Clustering** → candidate defect entities
4. **Human confirm/split, never silent auto-merge.** Surface as: *"This looks like PSC observation dated 12-Mar. Same? [Yes / No / Related but distinct]"*
5. **Learn from corrections.**

**Show confidence.** A system that says "71% sure, please confirm" is more credible to a safety officer than one claiming certainty — because sometimes *they* can't tell either.

**Training signal we actually have:** MSHA violations at the same mine, same standard code, same section, repeated over time. Real labelled repeat-violation data (Section 13.1).

**Closure authority is a property of severity, not of the observer:**

| Severity | Closure authority |
|---|---|
| Minor | Safety Officer at mine |
| Significant | Mine Manager (statutory appointment holder) |
| Severe / linked to DGMS observation | Area or ISO level; DGMS observation requires regulator sign-off |

A system that lets a mine self-close a DGMS observation is worse than no system.

### 9.3 Field evidence with provable integrity

- Offline-first (WatermelonDB / PowerSync). Photo queues survive app kill.
- Hash-chained records (`prev_hash` per evidence item) + RFC 3161 trusted timestamping + periodic Merkle-root anchoring → **tamper-evident audit trail**.
- **Anti-spoofing:** mock-location detection, Play Integrity attestation, EXIF cross-check, GNSS raw measurements where available, server-side plausibility (speed-between-fixes, cell-tower corroboration).
- Honest "last synced" state, never a fake live indicator.

**Why anti-spoofing matters:** geo-tagged attendance and inspection in an environment where contractors have direct financial incentive to fake presence. A mock-location app defeats naive `getCurrentPosition()` in ten seconds. Without this, "geo-tagged proof" is theatre.

### 9.4 Inspection content generation (not scheduling)

**Do not build scheduling optimisation.** PSC monthly, IUSA quarterly, CSC six-monthly are set by CIL policy and tripartite agreement. No algorithm is permitted to move them.

**Do build the content of each visit.** Generate a mine-specific inspection sheet for that team, on that date:

1. Open defects due for verification, oldest first
2. Obligations with evidence due this period
3. Areas flagged by the risk model
4. **Items raised by other bodies that nobody has closed** ← the point

Item 4 turns the six-body redundancy from a bug into a feature: each team's fixed-cadence visit now *closes work raised by the others* instead of duplicating it. Novel, needs no new authority, breaks no policy, buildable.

### 9.5 3D compliance geometry

**Rule: 3D must compute a compliance number, not just look nice.**

- **Volumetric deviation.** Cut-and-fill between the approved mine-plan DTM and the actual DSM. Output: cubic metres excavated beyond plan, and where. Maps directly to "excavation beyond approved mining plan." CMPDI already runs LiDAR-equipped survey drones for exactly this volumetric measurement — we slot into an existing workflow.
- **Dump and slope stability screening.** Derive slope angle and dump height from DEM; compare against approved dump design parameters; flag benches exceeding permitted angle or height. Dump failure is a leading cause of opencast fatalities. CIL is already deploying pit/dump slope monitoring systems per Standing Committee direction.
- **3D geofence with negative Z.** Lease boundary extruded into a prism; observations plotted at true elevation, including *below* surface for underground districts. 2D GIS structurally cannot do this.

**Tech:** CesiumJS + 3D Tiles + quantized-mesh terrain. Downsample point clouds under ~50MB. Ship a 2D fallback toggle.

**Honest caveat to state in the pitch:** CartoDEM at 30m posting / 8m LE90 vertical is **not survey grade**. Real volumetrics need drone photogrammetry or LiDAR at centimetre accuracy. Frame as *"DEM for regional screening, drone survey for statutory volumetrics."*

### 9.6 Risk engine

**Predict leading indicators, not fatalities.** Fatalities are rare events — a model trained on them predicts "no accident," scores 99.7% accuracy, and is useless.

Predict instead:
- probability an obligation instance slips its deadline
- probability a closed observation recurs at the same location
- contractor-level repeat-citation propensity
- mine-level defect accumulation rate

These have thousands of positive examples and are actionable.

**Training strategy:** see Section 13.4 — MSHA encoder, Indian calibration.

### 9.7 Regulatory change impact

DGMS issues circulars continuously. A new one lands: **which of the ~12,000 live obligation instances across 40 mines are affected, and which mines just became non-compliant overnight?**

Retrieval-and-diff over our own register. Genuinely hard, genuinely useful, and only possible *because* the obligation register exists. This is our strongest "think big" item.

### 9.8 Contractor risk graph

ICIS-style Form XIII registration and certificate expiry — **connected to the defect ledger**, so a contractor's repeat-violation history follows them across mines and subsidiaries. This is precisely what ICIS cannot do today.

Cheapest possible win inside this: **certificate expiry is a date field**. It is already in ICIS. Nobody tracks it against the safety record of the same contractor.

### 9.9 Statutory attendance (Reg 40(3)-compliant)

- RFID cap-lamp reader graph for belowground entry/exit → the register the regulation demands.
- Generates the **printed copy** the regulation also demands.
- Design explicitly built toward **Chief Inspector approval** of the electronic system, which is the actual statutory path to paperless attendance.

Doubles as person-location provenance for rescue.

### 9.10 Grievance — prototype linkage scope (superseded for production)

> **Production authority note:** This subsection records an earlier prototype cut and must not be used as the production grievance boundary. PS §4.8 explicitly requires low-barrier intake. The canonical production design is [`../features/grievances/grievance-and-protected-intake-spec.md`](../features/grievances/grievance-and-protected-intake-spec.md): a governed unified front door with native/federated/specialized routes and protected handling. The warning against putting POSH or vigilance content in a general mine-manager queue remains valid.

**Do not build grievance intake.** Every channel is already statutory with prescribed timelines:

| Channel | Regime |
|---|---|
| CPGRAMS | National public grievance portal; CIL and MoC both on it |
| Industrial disputes | Conciliation officers, works committees, Industrial Disputes Act |
| POSH complaints | Internal Committee, mandated composition, 90-day inquiry, strict confidentiality |
| Contract labour | Contract Labour (R&A) Act, principal employer liability |
| Land oustee / R&R | Project-affected families; outside our boundary |
| Worker safety concerns | Workmen's Inspectors and PSC into the tripartite structure |

Putting a POSH complaint into a general queue visible to a Mine Manager is a **legal violation**, not a UX problem.

**What we do build — the closure link:**

A grievance saying "the haul road at the eastern face has no berm and no water spraying" is *evidence of a defect*. Today it lands in a grievance queue, gets a reply, gets marked disposed — while the defect stays open in a different register.

- Safety-category grievance links to a defect in the ledger
- **Grievance cannot be marked disposed while the linked defect is open**
- On defect closure, the grievance response carries the actual corrective action and its verification evidence
- Repeat grievances at the same location cluster onto the same defect (same entity resolution)

One table and a state-machine rule. Jury line:

> A grievance about a hazard and the safety observation about the same hazard are currently two unrelated records in two unrelated systems. One can be closed while the other stays open. We make that impossible.

**Explicitly out, with reasoning on the slide:** grievance intake, POSH, industrial disputes, R&R/land, CPGRAMS replacement. We route to the statutory channel and consume the outcome.

---

## 10. Data model

```
SOURCE_DOC ──< OBLIGATION ──< OBLIGATION_INSTANCE >── MINE
                                       │
                          ┌────────────┴────────────┐
                          ↓                         ↓
                      EVIDENCE                   FINDING ──< CORRECTIVE_ACTION
                                                     │
                                          DEFECT >───┤
                                                     │
                                       CONTRACTOR >──┘
                                                     │
                                          GRIEVANCE >┘  (link only)
```

**Key tables:**

```sql
SOURCE_DOC        (id, akn_uri, doc_type, issued_on, issuing_body, mine_id?)
OBLIGATION        (id, source_doc_id, clause_ref, deontic_type, text,
                   periodicity, evidence_type, owner_role, due_rule, applicability)
OBLIGATION_INSTANCE (id, obligation_id, mine_id, period, due_on, status)
MINE              (mine_id, dgms_mine_code, subsidiary, area, subunit_cd,
                   mine_type, lease_geom, approved_plan_dtm)
EVIDENCE          (id, instance_id, file_ref, captured_geo, captured_at,
                   captured_by, prev_hash, tsa_token, spoof_flags)
DEFECT            (id, mine_id, subunit, hazard_category, first_observed_on,
                   status, severity, location_geom)
OBSERVATION       (id, defect_id, source_body, observed_on, raw_text,
                   raw_severity, merge_confidence, confirmed_by)
FINDING           (id, instance_id?, defect_id?, severity, cmr_clause, raised_on)
CORRECTIVE_ACTION (id, finding_id, owner, due_on, closed_on, closure_authority)
CONTRACTOR        (id, name, engaged_from, engaged_to, form_xiii_ref)
GRIEVANCE_LINK    (grievance_ref, defect_id, channel, linked_on)
```

### The three distinctions that matter

1. **OBLIGATION vs OBLIGATION_INSTANCE.** The obligation is the abstract duty from a clause. The instance is that duty materialised for a specific mine in a specific period, with a real due date. A quarterly EC condition across 40 mines generates 160 instances a year. *That* is the row a dashboard counts, an alert fires on, and a risk model scores.

2. **DEFECT vs OBSERVATION.** The defect is the physical condition. Observations are sightings of it by different bodies. Many-to-one.

3. **FINDING hangs off the instance or the defect**, never standing alone — so every violation is automatically traceable to the clause it breaches. `CORRECTIVE_ACTION` is LegalRuleML's reparation concept in table form.

---

## 11. Feature catalogue

### Tier 1 — must be excellent (demo-critical)

| # | Feature | Addresses gap |
|---|---|---|
| 1 | Obligation extraction from statutory documents | 1 |
| 2 | Obligation register + due-instance engine + escalation | 1 |
| 3 | Unified defect ledger with entity resolution across 6 registers | 2 |
| 4 | Offline-first field evidence with anti-spoofing + hash chain | 3 |

### Tier 2 — build, show briefly

| # | Feature | Notes |
|---|---|---|
| 5 | 3D volumetric deviation + slope screening + geofence | The visual closer |
| 6 | Risk engine (deadline slip, recurrence, contractor propensity) | MSHA-trained, India-calibrated |
| 7 | Regulatory change impact | Strongest "think big" item |
| 8 | Contractor risk graph | Connects ICIS-style data to safety record |
| 9 | Reg 40(3) attendance via RFID cap-lamp reader graph | Underground answer |
| 10 | ReBAC authorisation (OpenFGA/SpiceDB) | Section 12 |
| 11 | DSC / eSign digital approvals | Section 12 |
| 12 | Inspection content generation | Section 9.4 |
| 13 | Grievance closure linkage | Section 9.10 |
| 14 | Statutory report generation (six-monthly EC, DGMS returns) | Direct PS bullet |

### Tier 3 — roadmap slide, zero code

Grievance intake · multilingual conversational interface · production reporting · full ICCC integration · predictive compliance load forecasting · selective-disclosure proofs.

### Tier 4 — the ambitious layer (name it, don't build it)

These belong on a "where this goes" slide. They are real ideas, not vapour — but they are 18-month ideas.

- **Obligation graph as national public infrastructure.** Export LegalRuleML with Akoma Ntoso IDs. Every EC condition decomposed is reusable by any ministry — steel, power, ports. Frame our output as a *national obligation layer demonstrated on coal*. This directly answers the PS's own phrase, "scalable indigenous e-governance framework."
- **Inverted accountability.** Regulator access is purpose-scoped and logged; a DGMS inspector reading a mine's records leaves a justified audit entry. Every team reads "transparency" as transparency *of the mine to the regulator*. Making it bidirectional is a genuinely forward-looking design position, and it is nearly free on top of ReBAC.
- **Selective disclosure.** A mine proves compliance to a regulator without exposing internal operational data. Correct direction; a trap if attempted in 8 weeks.
- **Predictive compliance load.** Forecast obligation volume per mine per quarter so the Area office can staff for it. Every system tells you what's overdue; none tell you what's *about to be*.
- **Cross-document contradiction detection.** Mine plan says one thing, EC condition another, DGMS permission a third. Real mines carry live contradictions and discover them during inspection.
- **Digital twin of the obligation state over time.** Replay any mine's compliance posture as of any past date — what a CAG auditor or Court of Inquiry actually needs.

---

## 12. Security, identity and authorisation

### 12.1 Why role-based access fails here

Almost every permission in this domain is **derived from a relationship**, not assigned to a role:

- A Manager signs off findings *at the mine where he holds the statutory appointment* — CMR appointments are mine-specific
- A DGMS inspector sees mines *in his region*
- A contractor sees findings *raised against his own engagements*
- An Area GM sees mines *under his area* — and area boundaries get redrawn
- A regulator sees compliance status but **not** internal draft observations

Role tables cannot express "at the mine where he holds the appointment." You get `SECL_KORBA_AREA_MANAGER_SAFETY`-style role explosion.

### 12.2 ReBAC — Zanzibar model

OpenFGA or SpiceDB. Permissions become tuples:

```
user:R.Kumar#manager@mine:korba_ocp
mine:korba_ocp#parent@area:korba
area:korba#parent@subsidiary:secl
user:DGMS_SEZ_01#inspector@region:south_eastern
```

"Can this person close this finding?" becomes a graph query. Adding a subsidiary is **data, not a migration**.

**Two additions specific to compliance:**

- **Time-bounded grants.** Every statutory appointment has start and end dates. A permission outliving the appointment is itself an audit finding. Model validity intervals natively.
- **Purpose-scoped access with logged justification.** Regulator reads are logged against a stated purpose. See Tier 4, inverted accountability.

### 12.3 Digital signatures — the Indian answer, not YubiKey

Do not import YubiKey. India already has the legally mandated equivalent.

| Layer | Mechanism | Legal basis |
|---|---|---|
| Statutory acts (Manager sign-off, DGMS returns, EC compliance report) | **Class 3 DSC on FIPS-certified hardware USB token** — video verification + Aadhaar eKYC, private key non-exportable | IT Act §3; mandated for statutory filings |
| Internal approvals (field submissions, CAPA acceptance) | **Aadhaar eSign** | IT Act §3A; Evidence Act §85A presumption of signatory |
| Ordinary login | FIDO2 / passkeys | — |

**IT Act §5** makes an electronic signature affixed *in the prescribed manner* legally equivalent to a handwritten one. That phrase is why the technique matters — it is what makes "digital approvals" mean something rather than a button labelled Approved.

**Exclusions to know:** IT Act First Schedule excludes negotiable instruments, powers of attorney, trusts, wills, and conveyance of immovable property from electronic signature.

### 12.4 Audit trail — tamper-evident, not blockchain

**Do not put a chain in this.** A team that says "we used blockchain" and cannot answer "what is your consensus mechanism and who runs the validators" loses the room.

What we build: hash-chained append-only log + RFC 3161 trusted timestamping + periodic Merkle-root anchoring. Call it a **tamper-evident audit trail** and explain the crypto in one slide. It is more sophisticated than the blockchain answer and we can defend every part of it.

### 12.5 The device problem — opencast vs underground

**A consumer smartphone cannot legally go inbye in a gassy underground coal mine.**

CMR classifies underground seams as Degree I, II or III of gassiness and specifies flameproof equipment zones by distance from the working face — in Degree III, anywhere inbye of the last ventilation connection, in return airways, and within 270 m of any working face or goaf. Equipment must be flameproof (Ex d), increased safety (Ex e) or intrinsically safe (Ex i) under Reg 181(3), which has a formal DGMS approval process. Standard smartphones are not intrinsically safe — heat generation and short-circuit spark risk.

**Also: GPS does not work underground at all.** Every team promising "geo-tagged underground inspections" is promising something physically impossible.

**Our two-tier strategy:**

| | Opencast | Underground |
|---|---|---|
| Device | Standard Android | Cap-lamp RFID tags + fixed readers |
| Location | GPS + anti-spoofing | Reader graph (pit-head + junctions) |
| Capture | Live in app | Deferred; digitised at pit-head within minutes, bound to the RFID trace |
| Upgrade path | — | Ex-certified handhelds (Ecom Smart-Ex class) — named, not purchased |

**The sentence for the Q&A:**

> Our underground provenance comes from cap-lamp RFID, not GPS, because GPS doesn't penetrate rock and a consumer smartphone is a Regulation 181(3) violation inbye of the last ventilation connection.

Nobody else in the building will know this. It is probably worth more than any feature built in the same time.

---

# PART IV — EXECUTION

## 13. Data strategy

### 13.1 MSHA — the ready-made schema and ML corpus

US Department of Labor bulk open data. Pipe-delimited (`|`) text, header row, latin-1 encoding, refreshed weekly, no auth, **public domain**.

`https://arlweb.msha.gov/opengovernmentdata/ogimsha.asp`
`https://arlweb.msha.gov/opengovernmentdata/DataSets/<Name>.zip`

| File | Contains | Key |
|---|---|---|
| `Mines.zip` | Mine master since 1970 | Mine ID |
| `Inspections.zip` | Every inspection since 2000 | Event Number |
| `Violations.zip` | Citations + **free-text condition/practice narratives** | FK Event Number |
| `AssessedViolations.zip` | Penalties, points, case status | — |
| `OrdersIssued.zip` | 107(a) imminent-danger withdrawal orders | Violation No |
| `Accidents.zip` | Form 7000-1 injuries/illnesses | Document No |
| `MinesProdQuarterly/Yearly` | Employee hours + production by subunit | Mine ID + subunit |
| `ContractorProd*` | Contractor employment + production | — |
| `ControllerOperatorHistory.zip` | Ownership chain over time | — |
| `Conferences`, `ContestedViolations`, `CivilPenaltyDocketsDecisions` | Dispute/appeal chain | — |
| `CoalDustSamples`, `QuartzSamples`, `NoiseSamples`, `AreaSamples`, `PersonalHealthSamples` | Occupational health | — |

**Three modelling ideas to steal:**

1. **Subunit dimension** — 01 underground, 02 surface at underground, 03 strip/quarry/open pit, 04 auger, 05 culm bank/refuse pile, 06 dredge, 12 other, 17 independent shops/yards, 30 mill/prep plant, 99 office. This is the granularity at which compliance actually varies *within* a mine.
2. **Controller / operator / contractor as three entities with time-bounded relationships.** Maps directly to CIL → subsidiary → area → mine → contractor.
3. **Employment hours as denominator.** Violation *counts* are meaningless. Violations per 100 inspection hours, fatality rate per Mte — that is what regulators track, and what MoC Ch.14 publishes. A dashboard showing counts is the wrong dashboard.

**Download script:** `msha_fetch.py` (already written). `--list`, `--all`, `--only`, `--force`, `--no-bundle`.

### 13.2 Indian sources

**Mine-level:**

| Source | What | URL |
|---|---|---|
| **Star Rating of Coal Mines** | Mine, type, subsidiary, score/100, star band. **50 OC / 47 UG evaluation parameters across 7 modules** — a compliance taxonomy written by MoC itself | `starrating.coal.gov.in/policy/result-star-rating2022-23.pdf`, `...2023-24.pdf`, `...2019-20.pdf`; mirror at `coalcontroller.gov.in/results` |
| **PARIVESH EC letters** | Record-level obligations. **Sequential integer IDs** | `environmentclearance.nic.in/Auth/openletter.aspx?EC=<n>` ; PDFs under `/writereaddata/Form-1A/EC/` |
| **EAC minutes** | Condition-by-condition compliance status = **supervision labels** | `environmentclearance.nic.in/writereaddata/Form-1A/Minutes/` |
| CCO | Provisional coal statistics, company/mine-wise production | `coalcontroller.gov.in` |

**Align our compliance dimensions to the Star Rating modules.** Being aligned to the sponsoring ministry's own published framework beats inventing categories. *Caveat:* scores are self-evaluations validated only for the top 10% plus a random sample — use the **framework**, cite the scores carefully.

**Aggregate (for calibration):**

- MoC AR Ch.14 (safety): `coal.nic.in/sites/default/files/2026-02/chap14AnnualReport2026en.pdf`
- MoC AR Ch.20 (IT): `coal.nic.in/sites/default/files/2026-02/chap20AnnualReport2026en.pdf`
- MoC AR Ch.3: `coal.gov.in/sites/default/files/2025-02/chap3AnnualReport2025en2.pdf`
- data.gov.in state-wise coal accidents: `data.gov.in/resource/state-wise-number-accidents-coal-mines-reported-mine-management-directorate-general-mines`
- data.gov.in Parivesh 2.0 EC granted: `data.gov.in/catalog/environmental-clearance-granted-parivesh-20`
- SEBI **BRSR** filings for CIL and subsidiaries — structured annual worker-safety, training, grievance and environmental metrics. Underused.

**Statutory text:**

- CMR 2017: `dgms.net/Coal%20Mines%20Regulation%202017.pdf`
- DGMS at a Glance: `dgms.net/DGMS%20AT%20A%20GLANCE%202023.pdf`
- DGMS Forms: `dgms.gov.in/UserView/index?mid=1258`
- DGMS Circulars: `dgms.gov.in/UserView/index?mid=1648`
- DGMS Bulletins: `dgms.gov.in/UserView/index?mid=1649`
- DGMS Annual Reports: `dgms.gov.in/UserView/index?mid=1491`
- Mining Plan Guidelines 2025: `coal.nic.in/sites/default/files/2025-01/31-01-2025a-wn.pdf`
- India Code (all Acts + rules): `indiacode.nic.in`

**Incumbent systems (for the "what exists" slide):**

- ICIS: `coalindiaicis.com`
- CMSMS: `ncog.gov.in/CMSS/login`
- SWCS: `swcs.coal.gov.in` / `coal.gov.in/nominated-authority/single-window-system`
- CIL Systems Dept: `coalindia.in/departments/systems/`
- IBM mining leases directory: `ibm.gov.in/index.php?c=pages&id=355&m=index`

**Live environmental data (real Indian data in the demo, cheap):**

- CPCB CCR: `airquality.cpcb.gov.in/ccr/` · `app.cpcbccr.com/ccr/#/`
- data.gov.in real-time AQI (API key): `data.gov.in/catalog/real-time-air-quality-index`
- OpenAQ: `openaq.org`

### 13.3 Foreign supplements

**Queensland RSHQ (CC BY 4.0)** — the near-miss data India doesn't publish:

- High Potential Incidents: `data.qld.gov.au/dataset/high-potential-incidents` — events with potential to cause significant adverse effect, categorised by hazards identified, incident type, major equipment, worksite location; separate breakdowns for surface/underground coal and minerals
- Quarterly safety statistics: `data.qld.gov.au/dataset/quarterly-mines-and-quarries-safety-statistics-data` — frequency rates from July 2012, worker numbers by mine
- Individual mine site safety performance 2018-19 → 2024-25: `business.qld.gov.au/industries/mining-energy-water/resources/safety-health/mining/accidents-incidents-reports/safety-performance`
- Narrative incident reports: `rshq.qld.gov.au/safety-notices/mines/information-from-high-safety-risks`

**Why HPIs matter:** they are *near-misses* — the leading indicator our model should predict on. Queensland's hazard categorisation is a ready-made label taxonomy.

**NSW Resources Regulator** — `resourcesregulator.nsw.gov.au/safety`. Quarterly reports + safety alerts (narrative NLP corpus). NSW also regulates **mine rehabilitation obligations**, the closest foreign analogue to EC-condition compliance.

**MSHA fatality narratives** — `msha.gov/fatality-reports` · `arlweb.msha.gov/fatals/fabc.htm` · Academy archive back to 1840: `msha.gov/training/training-programs-and-courses/academy-home-page/academy-library/fatality-report`

### 13.4 Transfer strategy — how foreign data becomes an Indian system

**Split the model in two.**

| | Transfers | Does not transfer |
|---|---|---|
| **What** | Hazard semantics — conveyor nip points, dump slope failure, haulage collision, guarding, dust exposure | Base rates and enforcement behaviour — citation frequency, penalty amounts, inspection intensity, S&S ratios |
| **Why** | Physics. A nip point kills identically in Korba and Kentucky. | These encode how *MSHA enforces*, not how mines fail. |

**Therefore: train the encoder on MSHA, calibrate the head on Indian aggregates.** Platt scaling or isotonic regression against the fatality rate per Mte and serious-injury rate that MoC Ch.14 publishes per subsidiary.

**Filter to subunit code 03** (strip/quarry/open pit). India is overwhelmingly opencast; unfiltered MSHA is far more underground-weighted and would teach the model roof-fall and methane priors in the wrong proportions. This one filter is the difference between a transferable model and a misleading one.

**Strip MSHA-specific fields** — penalty amounts, docket outcomes, assessment codes — from the feature set so the model cannot lean on enforcement artefacts.

**The experiment that wins the argument: leave-one-region-out transfer test inside MSHA.** Train on Appalachian coal, test on Powder River Basin. Train on underground, test on surface. That yields an actual number for the cost of geographic transfer, letting us say: *"within-US shift costs us X points of AUC; India is a larger shift, so we report Indian estimates with a wider uncertainty band rather than a point value."* Takes about a day. Nobody else will have it.

**Never let a US mine name appear on screen.** Mine names, subsidiaries, CMR form numbers, EC conditions, lease geometry and regulation citations must all be Indian.

### 13.5 NLP corpora

- **CUAD**: `atticusprojectai.org/cuad` · `github.com/TheAtticusProject/cuad` · `arxiv.org/abs/2103.06268`
- ContractNLI — entailment for "was this obligation satisfied"
- InLegalBERT / InCaseLawBERT (IIT-KGP Law-AI) — *unverified; check before relying. Pretrained on case law, not regulations — real domain gap.*
- OCR: PaddleOCR, docTR, Surya (Devanagari), Bhashini for Indic

### 13.6 Geospatial

- Bhoonidhi (ISRO EO hub, has API): `bhoonidhi.nrsc.gov.in/bhoonidhi/index.html`
- Bhuvan download: `bhuvan-app3.nrsc.gov.in/data/download/`
- CartoDEM accuracy readme: `bhuvan-app3.nrsc.gov.in/data/download/tools/document/CartoDEMReadme_v1_u1_23082011.pdf`
- Sentinel-2 (10 m, 5-day revisit), Landsat, ESA WorldCover
- Google Open Buildings / Microsoft footprints — encroachment near lease
- OSM — roads, settlements, rail sidings

**The gap to be honest about:** coal mine **lease boundary polygons are not openly published as shapefiles.** CMSMS has them behind login. Mining Plan Guidelines require cardinal-point coordinates and a KML, so individual leases are recoverable from published mining plan PDFs. Digitise two or three for the demo; state plainly that production consumes authoritative boundaries from CMSMS/NCoG via API.

### 13.7 Standards

- OASIS LegalDocML / Akoma Ntoso TC: `oasis-open.org/committees/tc_home.php?wg_abbrev=legaldocml`
- LegalRuleML worked example: `interoperable-europe.ec.europa.eu/sites/default/files/news/2024-07/A%20LegalRuleML%20specialisation.pdf`
- LegalRuleML design paper: `governatori.net/papers/2013/icail2013legalruleml.pdf`

---

## 14. Technology stack

| Layer | Choice | Why |
|---|---|---|
| Database | **Postgres + PostGIS + pgvector** | One database. Geometry, JSONB obligations, and embeddings in one place. No microservice theatre. |
| Backend | FastAPI | Fast to build, typed, good async |
| Authorisation | **OpenFGA** or SpiceDB | ReBAC — Section 12.2 |
| Web | React | — |
| Mobile | Kotlin + **WatermelonDB** or PowerSync | Battle-tested offline sync; do not hand-roll |
| 3D | **CesiumJS + 3D Tiles** | Streams, browser-native, quantized-mesh terrain |
| OCR | PaddleOCR / docTR | Handles skewed, stamped government scans |
| Extraction | Fine-tuned extractive QA | CUAD → EC conditions |
| Timestamping | RFC 3161 TSA | Legally meaningful, not blockchain |
| Deployment | Docker Compose, single host | **Must run entirely offline on one laptop** |

**Hard constraint:** everything runs with the wifi off. The venue will have dead or shared wifi. Any live API call at demo time is a liability.

---

## 15. Phasing — 8 weeks, 6 people, ~8h/day

| Weeks | Work |
|---|---|
| **1–2** | Obligation extraction end to end on real EC letters. **One named owner, nothing else.** Parse MSHA into Postgres. Scrape 200+ coal EC letters and 30 EAC minutes. Hand-annotate 30 conditions. |
| **2–4** | Obligation register + due-instance engine. Defect ledger + entity resolution. ReBAC. Opencast field app. In parallel. |
| **4–6** | 3D geometry. Risk engine + transfer test. Contractor graph. Attendance/RFID simulation. Change-impact engine. Grievance linkage. |
| **6–7** | **Integration.** Budget double what you plan — 14 components have 91 pairwise interfaces. Replay harness. Evaluation numbers. |
| **7–8** | Hardening. Demo rehearsal. Fallback path. |
| **Week 8** | **HARD FREEZE.** Nothing new. Rehearse only. |

### Named ownership

Name the **obligation-engine owner this week**. Everything above collapses if that component slips — the hero demo and four of six Tier-4 features sit on top of it.

Also name: defect-ledger owner, mobile owner, 3D owner, integration owner, pitch owner. Six roles, six names, written down.

### Week-one go/no-go gate

By end of week 1, one question must be answered: **does obligation extraction work well enough on real EC letters to be the centrepiece?** If not, re-scope around the defect ledger instead.

---

## 16. The demo

You will build 14 things and show 4. That is correct, not wasteful.

**The 90 seconds:**

1. **Drop an unseen coal EC letter on the screen.** 68 conditions resolve into a structured register in ~8 seconds, each linked back to its source sentence. *(20s)*
2. **Filter to overdue.** Four instances. Point at one: *"Condition 17, plantation of 40 hectares, due 31 March, no evidence filed. Nobody inspected this mine. The system knew anyway."* *(25s)*
3. **Click a defect.** Open 147 days. Observed three times, by three different bodies, in three different formats. Never closed — because no single register existed to notice. *(25s)*
4. **Map flies to the mine.** 3D view: excavation 14 m below approved bench level, volume in m³. The field photo that should have closed it is flagged — GPS spoofed. *(20s)*

**Step 2 is the moment that wins.** It is the one thing a purely inspection-driven system structurally cannot do.

Tier 2 gets a 30-second sweep at the end, or answers a jury question. It does not get demo time on its own.

**Runs entirely offline. No hardware beyond the laptop. Real Indian documents — so zero defence needed about foreign data during the demo itself.**

### Fallback path

Recorded video of the same four beats. Deterministic replay mode as the middle option. Build the replay harness in week 6 — it doubles as the regression test.

---

## 17. Defence

### 17.1 The three slides that are always in the deck

1. **MSHA → CMR 2017 crosswalk.** Top ~150 cited US standard codes mapped to Indian regulation numbers. Two days of work with the CMR text open. This is defensible technical IP and it turns "you used American data" from an attack into a demonstration.
2. **Transfer-cost experiment.** The AUC degradation number and the resulting uncertainty band.
3. **Data provenance table.** Per component: trained on what, calibrated on what, validated on what, what is synthetic. One row each, no hedging.

### 17.2 Rehearsed answers

**"This is American data. How is it relevant to Indian mines?"**
> We use it for hazard semantics, not Indian base rates. A conveyor nip point or a dump slope failure behaves the same in Korba as in Kentucky. What we deliberately don't transfer is enforcement behaviour and incident frequency — those we calibrate against the fatality rates the Ministry publishes per subsidiary in Chapter 14.

**"Have you validated on Indian data?"**
> Partially, and I'll be specific. The hazard classifier is validated on DGMS circulars and EAC minutes. The mine-level risk score is validated on MSHA hold-out only, because Indian inspection records aren't publicly available. That component becomes operational when CIL connects its own data — the ingestion path is built and the schema is mapped to CMR forms.

**"So the numbers on your dashboard are fake?"**
> The mine names, lease boundaries, obligations and regulations are real. Incident histories are synthetic, generated to match the accident and fatality rates published in the MoC annual report for that subsidiary. We label synthetic data as synthetic in the UI. We'd rather show a system that's honest about its data than one that isn't.

**"Why didn't you just use DGMS data?"**
> DGMS publishes aggregates. The accident portal is behind a mine-user login; data.gov.in has state-level counts, not records. There is no open record-level Indian dataset — that's a finding, not an excuse, and it's part of why fragmentation is the problem this PS describes.

**"Isn't your model just learning US regulatory quirks?"**
> That's the right question, and it's why we ran the transfer test. Within-US geographic shift costs us X points. We also stripped MSHA-specific fields — penalties, docket outcomes, assessment codes — from the feature set, so the model sees hazard description, equipment, location and exposure hours.

**"How do you handle the six overlapping inspection regimes?"**
> We don't consolidate the bodies — they exist for good reasons and we have no authority over them. We consolidate the *observations*. Each body keeps its own process; the defect register underneath is shared. That's why an item raised by the Pit Safety Committee can be closed by the safety audit team four months later, which today is impossible because neither can see the other's register.

**"Doesn't CIL already have a dashboard?"**
> Several — ICIS, CMSMS, PARIVESH, Shram Suvidha, the ICCC rollout, and SWCS. We consume from them. The Ministry has digitised everything up to the moment a mine opens; the day it starts producing, compliance falls off a digital cliff into spreadsheets and six inspection registers. That's where we live.

**"Why not blockchain?"**
> Because what this needs is tamper-evidence, not distributed consensus. We use a hash-chained append-only log with RFC 3161 trusted timestamping and periodic Merkle-root anchoring. Same integrity guarantee, no validator set to explain, and it's auditable by a CAG auditor with standard tools.

**"How does the mobile app work underground?"**
> It doesn't, and it shouldn't. GPS doesn't penetrate rock, and a consumer smartphone is a Regulation 181(3) violation inbye of the last ventilation connection in a gassy mine. Underground provenance comes from cap-lamp RFID readers at the pit-head and key junctions, which also satisfies the Reg 40(3) attendance requirement. Ex-certified handhelds are the procurement path, not something we assume.

### 17.3 What we never claim

- **Not certifying compliance.** Surfacing candidates for human sign-off. Never auto-certification.
- **Not replacing** SWCS, PARIVESH, ICIS, Shram Suvidha, CMSMS or the ICCC. Consuming from them.
- **Incident histories are synthetic**, labelled as such in the UI, calibrated to MoC Ch.14 published rates.
- **Risk model validated on MSHA hold-out only**, because Indian record-level data isn't public.
- **Lease boundaries digitised from published mining plan PDFs** for the demo; CMSMS/NCoG named as the production source.
- **CartoDEM is screening-grade, not survey-grade.** Statutory volumetrics need drone/LiDAR.

Stating these four to six limits **unprompted** is worth more than a fifteenth component.

---

## 18. Risk register

| Risk | Severity | Mitigation |
|---|---|---|
| Obligation extraction underperforms on real EC letters | **Critical** — hero demo depends on it | Week-1 go/no-go gate. Fallback: re-scope around defect ledger. |
| No real Indian inspection data ever obtainable | High | Assumed from day one. Synthetic + calibration + explicit provenance slide. |
| OCR fails on scanned/stamped/rotated govt PDFs | High | PaddleOCR/docTR, deskew preprocessing, manual annotation of demo set as backstop |
| Team attrition weeks 4–6 | High | Named single owners per component; nothing depends on 6 people staying engaged |
| Integration overruns | High | Budget double; hard freeze week 8; integration owner named |
| Demo laptop GPU can't handle 3D | Medium | 2D fallback toggle; downsample under 50MB; test on the actual machine |
| Venue has no internet | Medium | Everything offline by design. Zero live API calls. |
| Judge asks about a system we didn't know exists | Medium | Section 4 incumbent map; keep researching until finale |
| Scope creep back toward 15 shallow features | **High** | Tier discipline. Tier 3 gets a slide, not a sprint. |
| Legal exposure from automated compliance determinations | Medium | Decision-support framing with mandatory human sign-off, stated unprompted |

---

## 19. Success criteria

**Technical:**
- Obligation extraction: report absolute precision/recall on a held-out set of hand-annotated EC conditions. Compare against the CUAD baseline (~44% P @ 80% R) as context for difficulty.
- Entity resolution: precision/recall on synthetic multi-register observation sets with known ground truth.
- Risk engine: AUC on MSHA hold-out, plus the leave-one-region-out transfer number.
- Field app: demonstrated spoof detection rate on a mock-location test set.

**Product:**
- Time from EC letter PDF to structured register: target < 15 seconds for a 70-condition letter.
- Cross-register defect merge: demonstrated on 3 registers with different schemas.
- Full system runs offline on one laptop, cold start to demo, in under 60 seconds.

**Pitch:**
- The 90-second demo lands with a judge who has never read the PS.
- Eight rehearsed answers, delivered identically in all four jury rounds.

---

## Appendix A — MSHA → India crosswalk skeleton

| MSHA | Indian equivalent |
|---|---|
| Mine ID | DGMS Mine Code (dgms.gov.in "Apply for Mine Code") |
| Form 7000-1 (accident/injury) | CMR 2017 Form 4-A + Form 4-B |
| Form 7000-3 (citation) | DGMS inspection report / contravention notice |
| 107(a) withdrawal order | Prohibitory order under Mines Act s.22 |
| Quarterly employment/production | DGMS annual returns via Shram Suvidha; CCO returns |
| Standard code | CMR 2017 regulation number *(the ~150-row table to build)* |
| Controller / Operator / Contractor | CIL / subsidiary+area / registered contractor (ICIS Form XIII) |

**Does not transfer:** the civil penalty docket system, FMSHRC contest proceedings, penalty point assessment. India has no structural equivalent. Use those tables as a *reference for how escalation is modelled*, not as predictive data.

## Appendix B — Statutory quick reference

| Provision | Content |
|---|---|
| Mines Act 1952 s.22 | Prohibitory orders on imminent danger |
| Mines Act 1952 s.48(4) | Register of persons employed |
| **CMR 2017 Reg 40(3)** | Attendance recording; belowground every entry/exit; electronic system permitted **if approved by Chief Inspector**; **hard printed copy required** |
| CMR Reg 181(3) | Equipment approval for hazardous-area electricals; DGMS approval process |
| CMR Forms 1-A/1-B/1-C | Opening / reopening / closure notices |
| CMR Form 2-D | Appointment of Manager / Agent |
| CMR Form 4-A / 4-B | Accident or dangerous occurrence notice / casualty particulars |
| IT Act 2000 s.3 | Digital signature (DSC) |
| IT Act 2000 s.3A | Electronic signature (Aadhaar eSign) |
| IT Act 2000 s.5 | Electronic signature legally equivalent **when affixed in the prescribed manner** |
| IT Act First Schedule | Exclusions: negotiable instruments, PoA, trusts, wills, immovable property conveyance |
| Evidence Act s.85A | Presumption that eSigned document was concluded by the signatory |
| Gassiness Degree I/II/III | Flameproof zone distances from working face and goaf |

## Appendix C — Week-one checklist

- [ ] Name the six component owners. Write them down.
- [ ] Run `msha_fetch.py --only mines inspections violations accidents`
- [ ] Load into Postgres. Read every `*_Definition_File.txt` before writing `CREATE TABLE`.
- [ ] Reproduce one real regulator metric end to end — violations per 100 inspection hours by mine.
- [ ] Scrape 200 coal EC letters + 30 EAC minutes from PARIVESH. Rate-limit. Cache locally.
- [ ] **Read five EC letters yourself, start to finish.** This will change the schema more than any design meeting.
- [ ] Hand-annotate 30 conditions into a draft obligation schema in Label Studio.
- [ ] Download `result-star-rating2023-24.pdf`; extract with pdfplumber; read the 7 modules and 50 parameters.
- [ ] Fine-tune on CUAD; run inference on the 30 annotated conditions.
- [ ] **Go/no-go: does extraction work well enough to be the centrepiece?**

## Appendix D — Gotchas

- MSHA files are **latin-1/cp1252**, not UTF-8. `pd.read_csv(..., sep='|', dtype=str, encoding='latin-1')`. `dtype=str` matters — several ID columns have leading zeros.
- Violation narratives contain apostrophes and quotes. In Postgres `\copy`, set an unused QUOTE char (`E'\b'`) or the parser chokes mid-file.
- `coal.gov.in` and `coal.nic.in` serve the same content — if one path 404s, try the other.
- DGMS and PARIVESH are slow and occasionally down. Cache aggressively on first fetch.
- Star Rating results are PDF tables with varying layout between years — pdfplumber or camelot, and expect to fix each year separately.
- Android: motion sensors are rate-limited if the user has the device microphone toggle off, regardless of permissions.
- Never ship a 2GB point cloud to a browser. 3D Tiles, downsampled, under 50MB.

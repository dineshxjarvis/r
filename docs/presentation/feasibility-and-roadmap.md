# Strata — Feasibility, Prototype Scope and Roadmap

## 1. Feasibility position

Strata is feasible as a narrow end-to-end prototype and as a phased national platform. It is not feasible to replace every live government workflow, integrate every regulator, deploy certified underground hardware and train reliable predictive models during SIH.

The prototype must prove the control loop deeply rather than display shallow screens for every feature.

## 2. Prototype boundary

### One deep mine

The primary mine supports:

- mine/assets, people, posts and time-bounded appointments;
- one real public regulatory/clearance document;
- OCR, classification, clause segmentation and AI obligation proposal;
- human review and publication;
- obligation materialisation and a personal task;
- observation → defect → finding → CAPA;
- offline Android capture and synchronisation;
- location mismatch that blocks closure;
- reminder/escalation and approval;
- mine dashboard and traceable metric; and
- append-only history.

### Two shallow mines

Seed enough labelled data to demonstrate:

- hierarchy and tenant/scope behaviour;
- cross-mine dashboard comparison;
- recurring failure themes;
- risk ranking with explanations; and
- Ministry-level drill-down.

### Unified portal shell

Demonstrate common navigation for:

- applications/clearances;
- returns;
- production;
- accidents/audits; and
- ongoing compliance.

Only the compliance vertical must be deep. Other workflows may use labelled simulated adapters/data.

## 3. Build priority

| Priority | Capability | Why |
|---|---|---|
| P0 | Shared identity, mine hierarchy and appointments | Every scope/workflow depends on it |
| P0 | Document-to-obligation vertical slice | Core novelty |
| P0 | Obligation and CAPA lifecycle | PS spine |
| P0 | Field evidence and closure block | Strongest demo moment |
| P0 | Dashboard drill-down | Proves governance value |
| P1 | Notification/approval demonstration | Connects facts to people |
| P1 | Corporate comparison across three mines | Proves scale story |
| P1 | Unified portal navigation and mock adapters | Answers unified-portal requirement |
| P1 | Hindi UI for key field screens | Demonstrates inclusion |
| P2 | One operational anomaly | Explicit PS requirement, limited data |
| P2 | GIS plot of captured records | Useful visual, not core control loop |
| Roadmap | Real DSC/eSign, TSA, raw GNSS model, RFID | External/hardware dependencies |

## 4. Prototype acceptance story

The prototype is successful if the team can demonstrate without slide-only claims:

1. Upload a real document.
2. Show an AI-proposed obligation beside its source clause.
3. Human-correct and publish it.
4. Show a dated instance assigned to an appointment/post.
5. Record a field observation/evidence item.
6. Produce/link a formal finding and CAPA.
7. Submit closure evidence captured away from the target asset.
8. Show the explainable `DISTANCE_MISMATCH` and blocked closure.
9. Show a different authorised verifier and an expired appointment denial.
10. Drill from a Ministry dashboard metric to the exact record, evidence and source clause.

## 5. Data strategy

Use a hybrid corpus:

- real public EC letters, statutes/circulars and official formats;
- real public aggregate/context data where licensing allows;
- synthetic people, appointments, mine operations and findings;
- simulated external portal/sensor feeds; and
- explicit `SYNTHETIC`/`SIMULATED` labels in UI and slides.

Never attach synthetic violations to a real named mine without an obvious demonstration label.

## 6. AI feasibility

### Prototype

- hosted Gemini/Groq-compatible models behind one server-side gateway;
- structured JSON schemas and validation;
- deterministic prompts with source anchors;
- human review before publication;
- provider fallback for availability;
- queued processing and visible failure states; and
- small curated evaluation set from selected documents.

### Production

- approved sovereign/enterprise hosting based on data classification;
- local/open-weight models where sensitive records cannot leave the boundary;
- model registry, evaluation gates, drift monitoring and prompt/version audit;
- redaction and least-data transmission; and
- no provider-key rotation to evade limits.

## 7. Operational feasibility risks

| Risk | Prototype handling | Production handling |
|---|---|---|
| No official API access | Mock adapter with recorded sample schema | MoUs, versioned adapters, reconciliation jobs |
| Poor scans | Curated sample + confidence review | OCR ensembles and review operations |
| AI extraction errors | Mandatory review | Evaluation thresholds and reviewer governance |
| Poor mine connectivity | Local persistent queue | Sync monitoring and regional infrastructure |
| GPS spoofing/weak lock | Distance + accuracy + basic signals | Attestation/raw GNSS/corroboration |
| Alert fatigue | Severity routing and digest | Budgets, coalescing and delivery analytics |
| Resistance to regulator visibility | Published-state boundary | Policy, access purpose and stakeholder governance |
| Migration from SWCS | Unified shell/mock adapter | Phased parity and audited migration |
| Cross-ministry authority | Do not fake statutory submission | Formal federation and institutional agreements |

## 8. Scalability and sustainability

- Configuration-driven mine onboarding
- Operator-level tenant isolation
- Shared but versioned obligation templates
- Event/outbox processing for reliable projections and integrations
- Content-addressed storage for deduplication
- Horizontal worker scaling for OCR/AI
- Per-provider quotas and backpressure
- Open standards/formats where practical
- Offline-first field operation
- Progressive integration rather than big-bang replacement

## 9. Roadmap

### Phase A — SIH prototype

Deep vertical slice, two comparison mines, mock adapters, English/Hindi key paths.

### Phase B — controlled pilot

One operator, a small group of mines, real identity integration, selected document classes, real field capture, measurable operational baselines.

### Phase C — Ministry platform

All operator tenants, shared mine master, Ministry dashboards, native Ministry-owned workflows, selected production integrations.

### Phase D — unified national ecosystem

Federated regulator workflows, statutory eSign/DSC, reports, advanced sensor/GIS inputs, governed ML and approved retirement of duplicated legacy functions.

## 10. SIH scoring evidence

| SIH criterion | Evidence in Strata |
|---|---|
| Novelty | Clause-to-closure and evidence-integrity control loop |
| Complexity | Documents, offline capture, workflow, authorisation and analytics connected |
| Clarity | One deep narrative and plain-English guide |
| Feasibility | Strict prototype/production split |
| Practicability | Posts, offline operation, uncertainty and human review |
| Sustainability | Phased migration, configuration, open interfaces |
| Scale of impact | All Indian coal operators/mines under a Ministry portfolio |
| User experience | Three altitudes, mobile field queue, Hindi key paths |
| Future progression | Pilot-to-national roadmap |


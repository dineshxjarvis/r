# Strata — Presentation-Level Product Requirements Document

## 1. Product definition

Strata is the Ministry of Coal's unified AI-enabled governance and compliance portal for all Indian coal mines. It brings applications, clearances, statutory returns, production reporting, accident/audit reporting and ongoing mine-level compliance into one governed experience.

Its differentiating control loop converts authoritative source material into mine-specific obligations, field work, evidence, findings, corrective/preventive actions, verified closure and traceable portfolio decisions.

## 2. Product goals

1. Provide one portal and shared data foundation across coal-governance workflows.
2. Make every applicable obligation owned, dated and visible.
3. Reduce field-to-decision latency through offline mobile capture and delivery.
4. Prevent unsupported or self-verified closure.
5. Detect recurrence, process weakness and operational anomalies early.
6. Give each audience a decision-appropriate dashboard.
7. Preserve an independently explainable history of every material act.
8. Scale across all coal operators and mines through configuration.

## 3. Non-goals for the SIH prototype

- Production replacement of live government portals
- Legal submission to every regulator
- Certified underground hardware
- Production-grade biometric identity
- Autonomous compliance/legal decisions
- A trained accident-prediction model
- Complete contractor, grievance, attendance and production suites
- Unlabelled claims based on synthetic data

## 4. Product users

| User | Primary need |
|---|---|
| Ministry official | National status, comparative risk, trends and programme governance |
| Operator/corporate official | Subsidiary/mine comparison and systemic recurrence |
| Area official | Exceptions across mines and severe escalations |
| Mine Manager | Current site risks, approvals and corrective-action control |
| Safety/Environment Officer | Owned obligations, inspections, findings and verification |
| Inspector and field worker | Fast offline capture and a personal action queue in the planned mobile app |
| Contractor supervisor | Own engagement documents, findings and assigned actions |
| External regulator | Published state, official findings and evidence within jurisdiction |
| Platform/tenant administrator | Mine, hierarchy, appointment and configuration governance |
| Worker | Normally a subject of attendance/training/incident records, not an account |

## 5. Core product journeys

### Journey A — Apply and obtain a clearance

1. User starts in the unified portal.
2. Strata identifies likely approvals from mine/project attributes.
3. User submits once; Strata routes natively or federates to the statutory authority.
4. Status and correspondence remain visible in one timeline.
5. On approval, conditions enter document review and become obligations.

Prototype: unified shell and simulated adapter.  
Production: native Ministry-owned workflow plus federated external clearances.

### Journey B — Document to obligation

1. Import/upload authoritative document.
2. Preserve original and run OCR/layout processing.
3. AI proposes document class, clauses and obligation fields.
4. Human reviews with source highlight.
5. Publish approved obligations.
6. Materialise mine-specific dated instances.

### Journey C — Field finding to verified closure

1. Inspector sees assigned work offline.
2. Captures observation/evidence against an asset.
3. Server evaluates integrity signals after sync.
4. Human confirms defect/entity match.
5. Requirement-linked breach becomes a finding.
6. CAPA is assigned with a deadline.
7. Assignee submits evidence.
8. Separate authorised verifier accepts/rejects.
9. Regulator-raised finding requires regulator closure.

### Journey D — Ministry decision

1. Ministry view ranks attention using comparable, explained measures.
2. User drills from portfolio to mine, records, evidence and source clause.
3. Data gaps and offline devices remain visible.
4. Intervention/action is routed to an accountable post.

## 6. Functional requirements

### FR-1 Unified portal

- Common login/navigation and mine master
- Applications, clearances, returns, production, accidents/audits and compliance modules
- Native and federated workflow distinction visible
- Reuse existing data; do not require duplicate re-entry
- Phased SWCS migration support

### FR-2 Identity, hierarchy and appointments

- Tenant isolation separated from legal organisations, recursive organisation units and the physical mine → subunit → asset hierarchy
- Time-bounded appointments as permission source
- Contractor affiliation plus resource engagement; regulatory authority, mandate and time-bounded jurisdiction
- English/Hindi preference
- Tenant administration and isolation

### FR-3 Document intelligence

- Immutable upload/import
- OCR/layout extraction and provenance
- Document classification and segmentation
- Type-specific AI extraction
- Mandatory review before publication
- Versioning, supersession and withdrawal without deletion

### FR-4 Obligation register

- Structured obligations and source references
- Applicability rules and unresolved triage
- Separate periodicity and deadline rule
- Dated mine-level instances
- Upcoming/due/submitted/satisfied/mismatch/overdue/escalated states
- Claimed-versus-evidence reconciliation
- NIL returns, change impact and load forecast

### FR-5 Inspections, defects, findings and CAPA

- Scheduled/unscheduled inspection capture
- Observation distinct from defect/finding/incident
- Human-confirmed defect deduplication
- Requirement reference mandatory for finding
- Corrective and preventive work
- Evidence-bound, independent verification
- Recurrence and ageing

### FR-6 Field application

- Android, offline-first and persistent queue
- Current planned mobile personas: assigned inspectors and field workers performing field capture/work
- Mobile pages/workflows for mine managers, corporate users, regulators outside field inspection, contractors, applicants, grievance handlers and every other persona are `TBD`
- Those other personas use the responsive web portal unless a later approved mobile-use-case decision expands scope
- Personal tasks
- Direct photo, location, time and asset binding
- Pending sync/retry visibility
- Evidence verdict with reasons
- English/Hindi key flows

### FR-7 Workflow and approvals

- Post-based recipient resolution
- Pre-deadline reminders and condition-based escalation
- Delivery/acknowledgement distinct from action
- In-app/push/SMS/email policy
- Digest, coalescing and visible suppression
- Approval identity, authority, timestamp, decision and reason
- Delegated receipt without silent authority transfer

### FR-8 Dashboards

- Personal action queue
- Mine/area intervention board
- Ministry/corporate/regulator portfolio view
- Published-only regulator aggregates
- Metric definition, denominator, freshness and drill-down
- Historical as-of views

### FR-9 AI and analytics

- Document classification/extraction
- Evidence-match and defect-match suggestions
- Recurrence and process-integrity signals
- Explainable rule-based prototype risk
- One labelled anomaly demonstration
- Grounded explanations; no autonomous legal conclusion
- Versioned use-case, data/feature, model/prompt/provider and run lineage
- Risk-tiered evaluation, human review, contestability, drift/incident and retirement controls
- Anomaly means unexpected under a declared comparator, never automatic fraud or violation

### FR-10 Audit and trust

- Append-only material-event history
- Original/previous value and actor/appointment
- Content hashes and evidence linkage
- Purpose-logged regulator reads and denials
- Corrections by supersession
- Break-glass read access with review, not closure authority

## 7. Prototype requirements

The SIH prototype shall demonstrate the ten-step acceptance story in [`docs/presentation/feasibility-and-roadmap.md`](../presentation/feasibility-and-roadmap.md). Features outside the deep vertical slice may be visibly simulated.

## 8. Production requirements

- All coal operators/mines as configurable tenants/scopes
- High availability, backup and disaster recovery
- Formal external-system agreements and versioned integrations
- Government-approved identity/signature mechanisms
- Data localisation/classification and retention policy
- Accessibility aligned to government digital-service standards
- Audited model and metric governance
- Measured migration/parity before legacy retirement

## 9. Success metrics

| Goal | Metric |
|---|---|
| Visibility | Median/p95 field-capture-to-recipient latency |
| Deadline control | Overdue instances per 100 eligible due instances |
| Evidence quality | Closures supported by acceptable evidence |
| Accountability | Severe notification acknowledgement within SLA |
| Reporting efficiency | Reused fields / total submitted fields |
| Recurrence reduction | Repeat defects per 100 verified closures |
| Configuration | Time/code changes required to onboard a mine |
| Trust | Dashboard metrics with complete traceability manifests |

## 10. Open product decisions

- Final operating agency and hosting arrangement
- Exact regulator participation/closure policy by authority
- Official integration/API availability
- Definitive ICIS identity and purpose
- First pilot operator and mines
- Approved production AI/data boundary
- Final Strata name and branding

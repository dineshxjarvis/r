# Strata — Feature Checklist

**Specification status.** A ticked box means a Tier A design spec exists for that item, not that code exists. Specs live in:

| Area | Spec |
|---|---|
| Authorisation | `docs/features/access-control/authorization-spec.md` |
| Identity and governance | `docs/features/access-control/identity-governance-spec.md` |
| Document pipeline | `docs/features/document-intelligence/pipeline-spec.md` |
| Extraction | `docs/features/document-intelligence/extraction-spec.md` |
| Obligation register | `docs/features/compliance/obligation-register-spec.md` |
| Register extensions | `docs/features/compliance/register-extensions-spec.md` |
| Defects, findings and CAPA | `docs/features/defect-management/defect-spec.md` |
| Inspections and assignment teams | `docs/features/inspections/inspection-spec.md` |
| Workforce presence, attendance and muster | `docs/features/attendance/presence-and-attendance-spec.md` |
| Incidents and emergency management | `docs/features/incidents/incident-and-emergency-spec.md` |
| Production, dispatch and stock | `docs/features/production/production-dispatch-stock-spec.md` |
| Environmental monitoring | `docs/features/environment/environmental-monitoring-spec.md` |
| Directory, delivery and workflow | `docs/features/workflow-spec.md` |
| Three-altitude dashboards | `docs/features/dashboard-spec.md` |

Unticked items have no spec yet.

**Document pipeline**
- [x] Document ingestion
- [x] OCR for degraded scans
- [ ] Indic-language handling
- [x] Document type classification
- [x] Clause segmentation with provenance
- [x] Document register with versioning
- [x] Annotation and correction interface
- [ ] Bulk import and scraping connectors

**Extraction**
- [x] Obligation extraction
- [x] Compliance report extraction
- [x] Inspection report extraction
- [x] Accident and dangerous occurrence extraction
- [x] Circular and notification extraction
- [x] Contractor document extraction
- [x] Evidence document extraction
- [x] Extraction confidence and triage
- [ ] LegalRuleML / Akoma Ntoso export

**Obligation register**
- [x] Obligation register
- [x] Due-instance materialisation
- [x] Applicability rules
- [x] Deadline and periodicity rules
- [x] Evidence-to-obligation matching
- [x] Claimed vs verified reconciliation
- [x] Negative evidence states
- [x] Obligation diffing between mines
- [x] Statutory conflict detection
- [x] Regulatory change impact
- [x] Obligation load forecasting

**Defects and findings**
- [x] Internal, regulatory, third-party and received-notice inspection intake
- [x] Inspection planning and assignment-team acceptance
- [x] Multi-visit fieldwork, participant attendance and access/refusal record
- [x] Mid-inspection reassignment and handover
- [x] Inspection report review, issue, follow-up and closure
- [x] Observation ingestion
- [x] Defect ledger with entity resolution
- [x] Merge confirm and split
- [x] Defect ageing and recurrence
- [x] Finding management
- [x] CAPA assignment and tracking
- [x] Closure authority enforcement
- [x] Escalation engine
- [x] Verification and sign-off
- [x] Inspection content generation

**Field capture and attendance**
- [ ] Offline-first mobile application for inspectors and field workers; every other mobile persona/page is TBD
- [ ] Geo-tagged evidence capture
- [ ] Anti-spoofing and device attestation
- [ ] Hash-chained evidence
- [ ] Photo, video and voice capture
- [x] Hybrid biometric/RFID/manual attendance design and accountable roles
- [x] Underground checkpoint/topology and emergency muster semantics
- [ ] Approved production biometric/RFID integration and device rollout
- [x] Multi-transition presence logical schema and canonical APIs
- [x] Device replay/clock/health, correction and register supersession rules
- [x] Privacy projections, retention boundary and worker dispute route
- [x] Incident, accident, dangerous-occurrence and near-miss lifecycle
- [x] Emergency command, containment and muster integration
- [x] Versioned statutory notification and investigation design
- [ ] Sync and conflict resolution

**Geospatial**
- [x] Purpose-specific layer and geometry-kind catalogue
- [x] Source assertion, review, publication and supersession lifecycle
- [x] CRS, horizontal/vertical datum, transformation and uncertainty governance
- [x] Underground topology and 2D/2.5D/3D compatibility rules
- [x] Accuracy-aware immutable spatial evaluation and override
- [x] Restricted tiles, export and offline-package controls
- [ ] Production CMSMS/NCoG/SWCS/survey feeds and approved source catalogue
- [ ] Lease and boundary management
- [ ] 3D terrain and geofence
- [ ] Volumetric deviation
- [ ] Slope and dump screening
- [ ] Satellite change detection
- [ ] Spatial mapping of defects and evidence

**Production, dispatch and stock**
- [x] Material event and lot-lineage model
- [x] Multi-source quantity provenance and source policy
- [x] Road/rail/other dispatch boundary
- [x] Book stock versus physical survey reconciliation
- [x] Period close, correction, reopen and publication
- [x] MDO/operator attribution separation
- [ ] Production-grade device/ERP/PRIMS adapters

**Environmental monitoring**
- [x] Reviewed condition-to-limit binding
- [x] Monitoring programmes and versioned GIS points
- [x] Manual sampling, custody and laboratory result lifecycle
- [x] Continuous observation, calibration, validation and coverage
- [x] Compatible unit/basis/statistic/averaging evaluation
- [x] Exceedance, incident, finding and CAPA separation
- [x] Period manifest, correction and reporting boundary
- [ ] Production PARIVESH/CPCB/SPCB and instrument adapters

**Contractors**
- [x] Contractor organization, engagement and work-package register
- [x] Disclosed subcontract chain and workforce/asset assignments
- [x] Effective requirement and independent credential-review lifecycle
- [x] Purpose-specific worker, vehicle/equipment and operator eligibility
- [x] Expiry, suspension, bounded exception and gate-decision handling
- [x] Immutable attribution disputes and cross-mine performance history
- [ ] Legally approved deployment catalogue and external issuer adapters
- [ ] Production risk analytics and governed adverse-decision workflow (Wave 13)

**Analytics**
- [x] Risk scoring on leading indicators
- [x] Recurring failure detection
- [x] Governed operational anomaly definitions, comparators and reviewer dispositions
- [x] Rate-based metrics with denominator, scope, time, freshness and manifests
- [x] AI component/use-case/risk-tier and prohibited-decision catalogue
- [x] Point-in-time dataset/feature/label/model/prompt/provider/run lineage
- [x] Baseline, calibration, slice, robustness, human-factor and harm evaluation gates
- [x] Human review, explanation, contestability and downstream-influence records
- [x] Shadow/canary/rollback, drift, incident, kill-switch and retirement lifecycle
- [x] Authorization-aware generative retrieval/tool/citation/provider controls
- [ ] Star Rating alignment
- [x] Governed trend and comparable-cohort analysis contract
- [ ] Representative production datasets, labels, thresholds and approved models

**Identity and governance**
- [x] **RBAC**
- [x] **ReBAC**
- [x] Appointment register with validity windows
- [x] DSC and eSign approvals
- [x] Append-only audit trail
- [x] Compliance time-travel
- [x] Purpose-logged regulator access
- [x] Break-glass access
- [x] Multi-tenancy

**Workflow and output**
- [x] Alerts and reminders
- [x] Versioned report definition, source binding and deterministic compilation
- [x] Pre-submission validation, NIL contradiction and source-coverage gates
- [x] Signer authority, attestation challenge and immutable filing package
- [x] Transport, acknowledgement, acceptance, return and correction separation
- [ ] Production authority schemas, credentials and live filing adapters
- [x] Low-barrier public, worker, contractor and community grievance intake
- [x] Protected/pseudonymous/anonymous reporter separation and safe receipt status
- [x] Effective case type, native/federated route, clocks and conflict-aware assignment
- [x] Cross-domain incident/inspection/defect/action linkage without false closure
- [x] Reviewed disposition, feedback, independent appeal and retaliation safeguarding
- [x] Suppressed aggregate patterns and privacy-safe grievance search projection
- [ ] Approved Ministry/operator grievance, POSH, vigilance and appeal policy catalogue
- [ ] CPGRAMS and specialized-channel production adapters
- [x] Authorization-aware lexical/structured and within-document search contract
- [x] OCR anchors/confidence, multilingual analyzer and semantic provenance
- [x] Facet/suggestion/snippet authorization and revocation-safe query sessions
- [x] Saved search/alerts, manifest exports and multi-surface tombstones
- [ ] Production engine, relevance corpus and English/Hindi tuning
- [x] Versioned connector definition, approval, deployment and conformance contract
- [x] Outbound/inbound exchange, correlation, idempotency and outcome-unknown reconciliation
- [x] External identity namespace/mapping and schema-drift quarantine
- [x] Credential/consent rotation, least privilege and sensitive-payload separation
- [x] Poll/webhook/stream/bulk checkpoints, partial disposition and dead-letter recovery
- [x] Integration health, SLO, circuit/rate/backpressure and operator audit model
- [ ] Live authority/operator schemas, credentials, network access and conformance approval
- [ ] Production integration infrastructure, capacity, DR and executable contract suites

**Surfaces**
- [x] Mine dashboard
- [x] Area and subsidiary dashboard
- [x] Corporate dashboard
- [x] Regulator portal
- [ ] Inspector/field-worker mobile application; other-role mobile surfaces TBD
- [ ] Public transparency view

**Localization, accessibility and assisted use**
- [x] English/Hindi locale-neutral terminology and message catalogue contract
- [x] Source-linked translation, staleness, high-risk review and authoritative-text distinction
- [x] GIGW 3.0 and WCAG 2.2 AA engineering/test target
- [x] Keyboard, screen-reader, reflow, contrast, forms, maps/charts and accessible documents
- [x] Inspector/field-worker TalkBack/offline locale-pack and sync-recovery contract
- [x] Consented assisted/kiosk/interpreter/voice session and credential boundary
- [x] Accessibility defects, retests, exceptions and scoped conformance evidence
- [ ] Approved Hindi terminology/content corpus and representative user validation
- [ ] STQC assessment and production browser/device/assistive-technology evidence

**Production hardening and operations**
- [x] Executable artifact authority and database/API/event/policy compatibility gates
- [x] Typed transactional audit/outbox, access/security streams and independent checkpoints
- [x] Threat model, ASVS-aligned security verification and bounded exception lifecycle
- [x] Service SLI/SLO/error-budget, workload capacity and degraded-mode contract
- [x] Backup inventory, application-level restore, DR/failback and RPO/RTO evidence contract
- [x] Manifest-bound migration, row disposition, parity, cutover, rollback and retirement gates
- [x] Privacy/retention/legal-hold and cross-store disposal manifest
- [x] Signed release manifest, progressive deployment, rollback and operational readiness gate
- [ ] Executable migrations/OpenAPI/events/policies and complete automated test suites
- [ ] Approved production SLO/RPO/RTO/capacity and successful restore/DR/security exercises
- [ ] Authority/onboarding/catalogue/migration/certification evidence required for launch

**Applications and regulatory cases**
- [x] Effective service catalogue and explained approval discovery
- [x] Native/API-federated/redirect/manual/information-only execution modes
- [x] Applicant content, requirements, representation and submission boundary
- [x] Authority case assignments, milestones, queries and partial responses
- [x] Site/hearing/consultation, recommendation, quorum and recusal records
- [x] Decision, instrument, conditions and renewal/amendment/appeal lineage
- [x] External state freshness, identifier correlation and reconciliation
- [ ] Approved national/state catalogue contents and production adapters

**Integrations**
- [ ] PARIVESH
- [ ] DGMS / Shram Suvidha
- [ ] ICIS
- [ ] SWCS / PRIMS
- [ ] NCMSR
- [ ] ICCC and IoT feeds
- [ ] CPCB air quality
- [ ] Drone and survey data

---

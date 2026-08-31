# Strata — Decision and Alternatives Record

Each entry records the choice, why it was made, rejected alternatives and the trigger for reconsideration.

## D1 — Unified portal with phased migration

**Chosen:** Strata becomes the unified front door and eventually supersedes duplicated SWCS functions through phased migration.

**Why:** The PS demands a centralized digital ecosystem, and the team explicitly wants applications, returns, production and accident/audit reporting included.

**Rejected:** Integration layer only. It would leave users moving between fragmented surfaces and undershoot the stated product intent.

**Rejected:** Immediate big-bang replacement. It risks lost records, broken statutory workflows and cross-ministry overreach.

**Revisit trigger:** Formal Ministry migration authority and completed workflow/data parity allow retirement of each legacy module.

## D2 — Federate external statutory authorities

**Chosen:** Integrate PARIVESH, DGMS, Shram Suvidha and other external-authority systems while retaining their legal decision rights.

**Why:** The Ministry of Coal cannot unilaterally transfer another authority's statutory mandate.

**Rejected:** Pretend every approval is native in Strata. It creates an indefensible legal claim.

**Revisit trigger:** Inter-ministerial agreement formally delegates or migrates the workflow.

## D3 — Two scope lanes

**Chosen:** Every major document separates SIH prototype from production target.

**Why:** It lets the team show ambition without claiming national infrastructure is already built.

**Rejected:** One blended scope. It makes feasibility impossible to judge.

## D4 — One mine deep, two shallow

**Chosen:** One full lifecycle and two seeded comparison mines.

**Why:** The deep mine proves integration; the shallow mines prove scope and aggregation.

**Rejected:** Many shallow modules/mines. It produces screenshots, not a credible control loop.

**Revisit trigger:** Core vertical slice is complete and stable.

## D5 — Human-reviewed AI

**Chosen:** AI proposes classifications, obligations, matches and explanations; authorised humans publish or decide.

**Why:** Model error must not silently change a legal duty or compliance conclusion.

**Rejected:** Fully automatic obligation publication/closure. High legal and safety exposure.

**Rejected:** No AI. Manual structuring does not scale across document volume.

**Revisit trigger:** Even a high-performing model may reduce review effort, but legal publication remains accountable unless policy changes.

## D6 — Rule-based risk before predictive ML

**Chosen:** Transparent weighted risk for prototype; learned components only after reliable history exists.

**Why:** Explainability and data scarcity matter more than an ML label.

**Rejected:** Train a black-box “accident predictor” on synthetic or foreign data. It would be statistically and ethically weak.

**Revisit trigger:** Sufficient representative, labelled Indian mine history and evidence that a learned model outperforms rules.

## D7 — Anomaly detection as a review signal

**Chosen:** Demonstrate one explained anomaly on labelled synthetic data; production model is roadmap.

**Why:** The PS explicitly requires anomalies, but reliable modelling needs history and operating context.

**Rejected:** Omit it completely. That misses a named requirement.

**Rejected:** Claim production predictive AI. Data does not support the claim yet.

## D8 — Observation, defect, finding and CAPA remain separate

**Chosen:** Four objects with explicit transformations.

**Why:** Multiple reports may describe one physical problem; only a requirement-linked conclusion is a formal finding; corrective work is a separate accountable object.

**Rejected:** One universal “issue” table. It conflates reports, reality, legal conclusion and work state.

## D9 — ReBAC plus time-bounded appointments

**Chosen:** Relationship-based scope with appointments as the source of permission windows.

**Why:** Authority depends on capability, resource relationships, contractor engagement, regulatory mandate, jurisdiction and time.

**Rejected:** Flat RBAC. It creates role explosion and stale permissions.

**Rejected:** Custom `if role == ...` checks. They become inconsistent and unauditable.

**Revisit trigger:** Implementation may use an equivalent relationship engine, but the model semantics remain.

## D10 — Post-based workflow addressing

**Chosen:** Rules notify “Manager of Gevra,” resolved to the current holder at send time.

**Why:** Transfers must not break workflows; vacancies must fail loudly.

**Rejected:** Store person names in rules. They become stale.

## D11 — Delegation of receipt, not authority

**Chosen:** A delegate may receive/acknowledge on behalf of a post but gains no statutory closure/signing power.

**Why:** Convenience cannot silently transfer statutory accountability.

**Revisit trigger:** A validated legal/governance policy defines delegable authorities and instruments.

## D12 — Android field app plus web portal

**Chosen:** Android for inspectors/field workers; web for all management/regulatory roles, with mobile access expanded later.

**Why:** Direct-camera control, GNSS/device signals and persistent offline work need native capabilities.

**Rejected:** PWA-only evidence capture. It cannot support the same integrity claims.

**Revisit trigger:** Platform APIs prove adequate for required controls or a cross-platform native framework meets them.

## D13 — Four evidence verdicts

**Chosen:** Verified, plausible, unverified and suspect.

**Why:** Field sensors provide uncertainty, not a perfect boolean.

**Rejected:** Pass/fail only. It creates false certainty or rejects legitimate low-connectivity work.

## D14 — Offline time interval

**Chosen:** Bound offline capture between trusted anchors and retain a monotonic estimate.

**Why:** Device wall time is editable; exact trusted offline time is unavailable.

**Rejected:** Present device time as verified. It is false precision.

## D15 — Append-only audit, not blockchain

**Chosen:** Database enforcement, content hashes, hash chaining and trusted timestamping.

**Why:** There is no consensus problem requiring a blockchain validator network.

**Rejected:** Blockchain for marketing. It increases complexity without solving source truth or access governance.

**Revisit trigger:** Multiple mutually distrustful sovereign writers require shared consensus and governance is defined.

## D16 — Published-state regulator boundary

**Chosen:** Regulators see authorised published state, may manage regulator-owned findings and all reads are purpose-logged.

**Why:** This supports oversight without exposing unfinished internal notes and destroying adoption.

**Rejected:** All drafts visible. Mines would avoid honest early reporting.

**Rejected:** Regulators are passive dashboard users only. That prevents end-to-end management of their own findings.

## D17 — Three dashboard altitudes

**Chosen:** Personal queue, mine intervention board and portfolio/regulator comparison.

**Why:** Each audience makes a different decision.

**Rejected:** One configurable super-dashboard. It optimizes for feature density, not action.

## D18 — Verified compliance separated from submission

**Chosen:** Show submission rate, verified compliance, overdue load and unsupported claims separately.

**Why:** Uploading a document does not prove the work occurred.

**Rejected:** One compliance percentage containing submitted items. It rewards paperwork rather than verification.

## D19 — Provider-independent AI gateway

**Chosen:** Gemini/Groq or other approved providers behind a server-side abstraction with queues and legitimate fallback.

**Why:** Avoid vendor lock-in and keep structured validation/audit consistent.

**Rejected:** Keys in clients. They leak credentials and remove governance.

**Rejected:** Rotate keys to bypass quotas. It violates responsible provider use and is not production architecture.

**Revisit trigger:** Production data rules may mandate a sovereign/local model.

## D20 — English and Hindi prototype

**Chosen:** English/Hindi for key flows; architecture supports more languages.

**Why:** It demonstrates access without pretending all domain terminology has been professionally translated.

**Rejected:** Broad machine-translated language claim. Safety/legal mistranslation is material.

## D21 — Hybrid real and synthetic data

**Chosen:** Real public source documents with clearly labelled synthetic operations/users where necessary.

**Why:** Real documents validate extraction while synthetic operations avoid confidentiality and unsupported real-mine claims.

**Rejected:** Entirely synthetic demo. It weakens domain credibility.

**Rejected:** Unauthorised real operational data. Privacy, safety and confidentiality risk.

## D22 — Separate identity, affiliation, appointment, mandate and jurisdiction

**Chosen:** A session identifies a principal; a person may have multiple affiliations and appointments; capabilities come from organisational policy or regulatory mandates constrained by time-bounded jurisdiction.

**Why:** `person_type`, generic `INSPECTOR`, and a region string cannot safely distinguish DGMS, MoEFCC, pollution-control, Ministry, contractor, and operator authority.

**Rejected:** Put role, tenant, and scope in the cookie. Client context is stale and cannot represent resource-specific authority.

**Rejected:** Add one enum value for every regulator designation. Titles and authorities evolve as data; authorization depends on mandate and jurisdiction.

## D23 — Tenant boundary is independent of organisational hierarchy

**Chosen:** CIL is one tenant by default; subsidiaries and areas are organisation units. Other operating companies may be separate tenants. Ministry and regulator principals receive explicit cross-tenant portfolios or jurisdictions.

**Why:** Tenant isolation, legal organisation, and physical mine hierarchy answer different questions.

**Rejected:** One operator per deployment. It cannot deliver a unified Ministry portal or governed cross-operator comparison.

**Revisit trigger:** A formal data-governance decision requires a different isolation boundary for a named organisation.

## D24 — One production owner per authoritative record

**Chosen:** Each authoritative record and lifecycle has one named domain owner. Workflow, integrations, dashboards, search and AI consume governed interfaces or projections and do not redefine source state.

**Why:** The programme spans many overlapping modules. Without explicit ownership, the same inspection, submission, metric or compliance state will diverge across services.

**Rejected:** Shared database ownership by every consuming module. It makes authorization, audit, migration and failure recovery ambiguous.

**Rejected:** Let the dashboard or integration payload become canonical. Both are derived and may be stale, incomplete or externally shaped.

**Revisit trigger:** A bounded context is deliberately merged or split with a migration plan naming the successor owner for every affected record and event.

## D25 — Incident response, notice, investigation and learning are parallel lifecycles

**Chosen:** An incident has separately governed emergency-response, muster, statutory-notification, investigation and preventive-learning states. Overall completion is a gate over them, not one mutable status.

**Why:** Controlling immediate danger does not prove people are accounted for, a notice was acknowledged, an enquiry finished or preventive work closed. One status would hide unfinished safety or legal obligations.

**Rejected:** One linear `OPEN → INVESTIGATING → CLOSED` incident workflow. Real activities overlap, reopen and complete at different times.

**Rejected:** Treat an incident as an observation/finding. An event that happened has casualties, emergency command and notification duties that a condition/breach record cannot own.

## D26 — Statutory incident notices are effective-dated rules, not hard-coded forms

**Chosen:** A legally reviewed rule catalogue selects predicates, recipients, deadlines, forms, channels and follow-up duties by governing instrument, occurrence context/time and approved transition policy.

**Why:** Official CMR materials and newer central rules can differ in form names, clocks and recipient semantics. Historical incidents must remain reproducible under the rules that applied to them.

**Rejected:** Put `Form 4-A` and one 24-hour timer directly in incident code. It becomes wrong when instruments change and cannot represent later-death or return-to-duty follow-ups.

**Rejected:** Let AI decide reportability. A model may extract facts but cannot publish the legal rule or suppress a notice.

**Revisit trigger:** None for versioning; only the approved rule contents and transition policy change.

## D27 — Preserve source assertions; approve reconciled production facts

**Chosen:** Raw device/manual/external assertions remain immutable. An effective-dated source policy and accountable reconciliation produce a versioned approved fact with an exact source manifest.

**Why:** Weighbridges, surveys, ERP, operational logs and PRIMS answer different questions and can legitimately disagree. No source is universally authoritative.

**Rejected:** One global source-of-truth ranking. It fails when a device is uncalibrated, a survey is only an estimate or an external portal stores a later aggregate.

**Rejected:** Last write wins. It destroys contrary evidence and enables silent manipulation.

**Revisit trigger:** Source-policy contents change per governed onboarding/configuration; preservation and manifest rules do not.

## D28 — Book stock and physical stock remain separate

**Chosen:** Book stock derives from accepted material events; physical stock is a method- and uncertainty-bearing survey snapshot. Variance creates reconciliation and any correction is an approved adjustment event.

**Why:** A survey estimate cannot replace transaction history, and transaction history cannot prove the physical pile when movements or measurements are missing.

**Rejected:** Overwrite closing stock with the latest survey. It erases the variance that needs investigation.

**Rejected:** Add an unexplained balancing quantity. It makes the equation balance while accountability disappears.

## D29 — Permit prose requires a reviewed executable limit binding

**Chosen:** A source condition becomes comparable only through an effective-dated, human-published binding of parameter, matrix/source, location, method, unit/basis, statistic, averaging window, applicability and response rule.

**Why:** A numeric value copied from an EC/consent PDF is not enough to determine whether a sensor or laboratory result is legally comparable.

**Rejected:** OCR a threshold directly into sensor configuration. It can apply the wrong unit, location, method, averaging period or effective version.

**Rejected:** One global environmental threshold catalogue detached from source instruments. Mine-specific and amended conditions would be lost.

## D30 — Environmental evidence, exceedance and compliance conclusion remain separate

**Chosen:** Raw observation, validated result, limit evaluation, confirmed exceedance, incident, finding/CAPA and obligation verification are separate records and authorities.

**Why:** A sensor can be wrong, data can be incomplete and an exceedance does not by itself establish every element of legal non-compliance. Acute safety/environmental response must nevertheless begin without waiting for legal review.

**Rejected:** Auto-close obligations from within-limit sensor readings. One reading does not prove the complete duty or reporting period.

**Rejected:** Turn every threshold crossing into a legal finding. It bypasses QA, applicability and authorized review.

## D31 — Contractor engagement and work eligibility remain separate

**Chosen:** An engagement enables scoped onboarding; an effective requirement policy and current evidence produce a separate purpose-specific eligibility decision for each organization, package, worker, asset and operator combination.

**Why:** A signed contract or active affiliation cannot prove medical fitness, training, competency, licensing, equipment condition, zone scope or subcontract approval.

**Rejected:** Enable access when the engagement is active. It turns a commercial date into a safety/legal decision.

**Rejected:** Enable access when all uploaded documents have future expiry dates. Presence, authenticity, issuer status, applicability and independent review would be ignored.

## D32 — Contractor exceptions are classified, bounded and independently approved

**Chosen:** Effective policy classifies requirements as hard stop, controlled exception, warning or informational. Only controlled exceptions can be approved, for an exact subject/scope/window, by independent current authority with compensating controls.

**Why:** Treating every expiry as identical either stops safe work unnecessarily or encourages informal bypasses. Legal prohibitions and safety-critical qualifications must remain non-overridable.

**Rejected:** A universal Mine Manager override. Authority and legal permissibility differ by requirement, and self-contained local override invites abuse.

**Rejected:** Grace periods embedded in UI code. They become invisible, inconsistent and historically irreproducible.

## D33 — Presence is an immutable observation stream, not one daily attendance row

**Chosen:** Every checkpoint/manual observation is append-only; corrections add governed interpretations, while attendance intervals and current presence are rebuildable projections.

**Why:** A worker may go belowground and return several times in one shift. Device outage, clock uncertainty and later correction must remain visible for safety, statutory reproduction and disputes.

**Rejected:** One check-in/check-out pair per person/day. It loses repeated transitions and cannot support reliable muster.

**Rejected:** Update the event time/location after reconciliation. It destroys the original observation and device provenance.

## D34 — Muster safety is a separate incident-bound conclusion

**Chosen:** Muster freezes an expected-person evidence cut, adds append-only responses and permits closure only after every person is resolved or formally handed over. `CONFIRMED_SAFE` never rewrites prior presence.

**Why:** Attendance may be stale or incomplete during the exact emergency when certainty matters most. Unknown cannot be translated into safe.

**Rejected:** Treat a recent exit event as automatic muster confirmation. The person may have re-entered, the reader may be stale or the event may be conflicted.

**Rejected:** Remove a mistakenly omitted person from the count. Add the person with an inclusion reason so the audit trail shows the correction.

## D35 — Spatial truth is purpose-specific, source-preserving and versioned

**Chosen:** Retain every spatial source assertion and publish reviewed effective geometry by named kind and purpose under a source policy. Lease, coal-block, mining-plan, land, approval, operational and safety geometries remain distinct.

**Why:** Different authorities and surveys can all be accurate about different rights, plans, conditions or times. One mutable `mine.boundary` cannot represent that reality.

**Rejected:** Latest imported polygon wins. Feed order is not authority and would rewrite historical decisions.

**Rejected:** One master boundary assembled without purpose. It hides legal/operational differences and makes every downstream containment query ambiguous.

## D36 — Spatial evaluations preserve reference systems and uncertainty

**Chosen:** Every consequential evaluation binds subject/target versions, CRS and horizontal/vertical datum, transformation, accuracy, dimensionality, policy and algorithm. Outcomes include indeterminate and not-comparable.

**Why:** A coordinate without datum/accuracy is not a point of known truth; a 2D polygon cannot prove underground vertical containment; a fix whose accuracy crosses a boundary is neither safely inside nor outside.

**Rejected:** Convert everything to WGS 84 and use a boolean point-in-polygon. Exchange coordinates alone do not preserve measurement fitness, height reference or uncertainty.

**Rejected:** Re-run old decisions silently against the latest map. It destroys reconstructability and turns amendments into retroactive claims.

## D37 — Report content is a source-manifest-backed compilation, not a mutable PDF

**Chosen:** A versioned definition compiles typed canonical values from exact source versions into an immutable manifest; validation, signer attestations, renderings and filing package bind that manifest.

**Why:** A PDF alone cannot explain which production fact, incident set, environmental period or obligation state produced each claim, nor identify affected filings after a source correction.

**Rejected:** Generate a PDF from current tables when requested. The same report changes over time and cannot be reproduced or defended.

**Rejected:** Copy report values into editable form fields without provenance. Reporting would become a competing source of operational truth.

## D38 — Filing transport, acknowledgement, acceptance and compliance remain separate

**Chosen:** Record transport attempts, correlated receiving-system receipts, authority status and compliance verification as independently evidenced lifecycles.

**Why:** HTTP success, email delivery and portal upload completion prove progressively different technical facts; none necessarily means the authority registered, accepted or legally agreed with the filing.

**Rejected:** Mark submitted on HTTP 2xx. A timeout/queued portal/HTML error can produce false status and unsafe duplicate retries.

**Rejected:** Mark an obligation satisfied when a filing is acknowledged. Filing the claim is not verification that the underlying duty was performed.

## D39 — Signature mechanisms are authority-profile driven

**Chosen:** Each effective report/channel definition selects its required DSC, eSign, portal e-authentication or approved signature mechanism and evidence. Every signer is re-authorized at signature time against exact content.

**Why:** PARIVESH's published flow uses Aadhaar e-authentication while other channels may require CCA DSC/eSign or portal credentials. One hard-coded Class 3 token rule is factually and operationally unsafe.

**Rejected:** Use Class 3 DSC for every statutory act. Receiving-system requirements vary and evolve.

**Rejected:** Treat internal approval as signature. Consent, content binding, current statutory authority and cryptographic/e-authentication evidence would be missing.

## D40 — Every regulatory service declares native or federated execution

**Chosen:** Effective service versions declare `NATIVE`, `FEDERATED_API`, `FEDERATED_REDIRECT`, `ASSISTED_MANUAL` or `INFORMATION_ONLY`, plus the legally authoritative system and decision owner.

**Why:** Strata can be the unified user-facing portal while the Ministry of Coal, MoEFCC, DGMS, state bodies and other authorities retain different statutory powers and incumbent systems. Migration can occur one service at a time without lying about current authority.

**Rejected:** Treat all approvals as native because the UI is unified. It would let software presentation impersonate legal delegation.

**Rejected:** Make Strata only a directory of links. Ministry-owned workflows could never migrate and end-to-end status/accountability would remain fragmented.

## D41 — Application, authority case, decision and instrument remain separate

**Chosen:** Applicant proposal/content, receiving authority processing case, competent decision and issued permission/clearance are distinct records and lifecycles. Federated case/decision state is explicitly mirrored with source/freshness.

**Why:** Submission receipt does not prove admission, recommendation does not prove decision, and an “approved” status without the actual instrument cannot establish scope, validity or conditions.

**Rejected:** One application status enum from draft to approved. It conflates actors, authority, evidence and systems and cannot represent query rounds, partial outcomes, appeals or later revocation.

**Rejected:** Copy the latest portal status over local state. It erases raw external history and cannot reconcile contradictory documents or late revocation.

## D42 — Authorization precedes every observable search output

**Chosen:** Search authorization is applied before hits, snippets, highlights, totals, facets, suggestions, related-content results and exports are calculated. Each returned object is also checked against current authority; a stale or unavailable authorization state fails closed.

**Why:** Titles, counts, autocomplete terms, snippets and cached result pages can reveal a restricted record even when document download is denied. Current checks also prevent a previously valid search session from surviving mandate expiry, case reassignment, classification change or access revocation.

**Rejected:** Search the full corpus and filter only the visible result page. Aggregates, ranking, timing and pagination still disclose inaccessible records.

**Rejected:** Authorize only when the search session is created. Long-lived sessions and exports would retain access after the underlying authority changes.

## D43 — Search is a versioned projection, never authoritative source data

**Chosen:** Search indexes are rebuildable projections with source-version, authorization-revision, classification, extraction/OCR provenance, freshness checkpoints and deletion tombstones. Lexical retrieval is the production baseline; semantic retrieval is advisory and separately policy-gated.

**Why:** Consumers need to distinguish current source truth from stale or partially indexed content, and revocation must propagate across lexical indexes, vector stores, suggestions, snippets, caches and exports. Exact identifiers and legally significant wording must not depend on embedding similarity.

**Rejected:** Let operational domains read the search index as their system of record. Index lag, analyzer changes and rebuilds would change business truth.

**Rejected:** Treat semantic similarity as equivalent to an exact match. It can obscure negation, identifiers, dates and statutory wording and may send sensitive text to an unapproved provider.

## D44 — One grievance front door uses case-specific authoritative routes

**Chosen:** Strata accepts low-barrier grievance intake as required by PS §4.8, then applies an effective case-type policy declaring native, API-federated, redirect, assisted-handoff or information-only execution and the authoritative system/decision owner.

**Why:** Workers, contractors and communities need one understandable entry point and receipt, but CPGRAMS, POSH committees, vigilance/PIDPI, industrial-relations forums and emergency authorities have different powers, confidentiality and processes.

**Rejected:** Preserve the prototype rule “link only, no intake.” It directly leaves the production requirement unmet and makes users understand institutional boundaries before asking for help.

**Rejected:** Run every complaint in one native workflow. A general queue can expose special-regime content and impersonate authorities Strata does not possess.

## D45 — Reporter identity and grievance case access are independent

**Chosen:** Identity/safe-contact data is stored in a separately encrypted reporter vault behind an opaque reference. Case access, reporter-identity disclosure, disposition, appeal and audit use separate capabilities, purposes and access receipts.

**Why:** Local managers or action owners may need to correct a hazard without learning who reported it. Protected identity disclosure creates retaliation and confidentiality risk and must not follow automatically from operational responsibility.

**Rejected:** Put reporter fields on the grievance row and hide them in the UI. Database exports, logs, search, analytics and broad case APIs would still expose them.

**Rejected:** Promise absolute anonymity. Narrative, evidence or lawful process can permit inference; the system must state honest limits.

## D46 — Disposition, remediation truth, feedback and appeal remain separate

**Chosen:** A grievance disposition freezes a reviewed reasoned response. Linked incidents, defects, inspections and CAPAs retain their own truth; feedback and appeal are new immutable lifecycles and never overwrite the disposition.

**Why:** Forwarding, replying, technical delivery, complainant satisfaction and verified correction are different facts. Collapsing them enables false closure and destroys review history.

**Rejected:** Block every grievance disposition until all linked long-term work closes. Some policies permit a reasoned outcome/referral while remediation remains transparently open.

**Rejected:** Mark the linked hazard corrected when the grievance is disposed. Only the owning domain’s verification can establish that fact.

## D47 — Integration transports evidence; domains own business state

**Chosen:** Domain services create immutable canonical intents and accept authenticated canonical inbound events. The integration platform owns provider mapping, transport, attempts, observations and reconciliation but can only request a domain transition through its governed interface.

**Why:** External payloads, HTTP codes and portal labels are shaped by providers and may be stale, partial or semantically different. Letting connector code write domain tables would distribute legal/business meaning across adapters.

**Rejected:** Give every adapter direct database access. A schema/provider change could bypass authorization, invariants and audit in every domain.

**Rejected:** Make the integration exchange the source of filing/case/compliance truth. It proves communication evidence, not the underlying legal conclusion.

## D48 — Unknown remote outcome is reconciled before unsafe retry

**Chosen:** A timeout or connection loss after a possible send enters `OUTCOME_UNKNOWN`. The platform uses stable idempotency/correlation, remote status query/callback evidence or accountable manual reconciliation before repeating any operation not proven safe.

**Why:** The remote system may have committed even though Strata never received the response. Blind retries can create duplicate applications, filings, payments, notices or cases.

**Rejected:** Treat every timeout as failure and retry with backoff. Backoff reduces load but does not remove duplicate side effects.

**Rejected:** Promise exactly-once cross-system delivery. Independent systems, networks and manual channels cannot provide that universal guarantee; at-least-once delivery plus deduplication/reconciliation is defensible.

## D49 — External identifiers and connector semantics are versioned policy

**Chosen:** Every external identifier is qualified by system, namespace and validity. Approved connector versions bind canonical/provider schemas, mapping, acknowledgement/terminal semantics, auth, idempotency, ordering, recovery and conformance evidence; deployments bind exact versions and secret references.

**Why:** The same textual ID can exist in multiple portals, and provider fields/status meanings change. Historical exchanges must retain the mapping and semantic contract used at the time.

**Rejected:** Put external IDs directly on each domain table. Namespace collisions, multi-ID history and remapping become unsafe and duplicated.

**Rejected:** Keep mapping logic and credentials in environment variables beside adapter code. Review, rotation, provenance, least privilege and rollback become ungoverned.

## D50 — Govern AI by use case and decision influence, not model brand

**Chosen:** Every analytical component has an approved versioned use case stating purpose, affected actors, risk tier, inputs/outputs, decision influence, human authority, evaluation, fallback, monitoring and prohibited uses. Models/prompts/providers are replaceable versions inside that boundary.

**Why:** OCR, anomaly detection, forecasting, semantic retrieval and generative drafting have different errors and harms. A provider/model approval in one context cannot prove fitness in another.

**Rejected:** Approve a model globally because it meets a generic accuracy target. Population, threshold, workflow, data and harm change by use.

**Rejected:** Treat all “AI” as one microservice with one permission. It erases purpose limits, evaluation and accountability.

## D51 — AI creates immutable advisory signals, never domain truth

**Chosen:** Each run binds exact data/features, rule/model/prompt/provider/tool versions and emits a typed, explained, expiring candidate/signal/forecast/draft. Workflow may route it, but only an authorized domain command under normal evidence/business gates changes authoritative state.

**Why:** A statistical deviation or generated answer is not a legal conclusion, fact or proof. Keeping the output immutable permits review, contest, correction and reconstruction without contaminating source records.

**Rejected:** Automatically create findings, sanctions, debarment, eligibility denial or closure from score thresholds. It delegates authority to a model and hides uncertainty/context.

**Rejected:** Copy the score onto the domain row as current truth. Model/version changes would rewrite historical meaning.

## D52 — Anomaly means unexpected, not wrongdoing or causation

**Chosen:** An anomaly output states its comparator/baseline, expected range, observation, source coverage/missingness, uncertainty, model/version and material factors. Human disposition distinguishes expected operation, data issue, investigation and confirmed domain issue.

**Why:** Shutdowns, maintenance, geology, weather, device failure and corrections can all produce unusual patterns. Anomaly detection is valuable for finding what fixed rules did not anticipate, but unsafe as accusation or proof.

**Rejected:** Label anomalies as fraud, non-compliance or accident predictions in UI/alerts. This creates automation bias and unjustified reputational/legal consequences.

## D53 — Production AI requires baseline, slice, harm and human-workflow evidence

**Chosen:** Release gates compare against a simple/no-model baseline and evaluate operational thresholds, calibration, temporal/context/language/cohort slices, missingness/shift, workload, error harms, explanation comprehension, security and meaningful human override/contest before shadow/canary expansion.

**Why:** Global accuracy can hide failure for small mines, contractor cohorts, Hindi users or unusual operating conditions and can overwhelm reviewers with false positives.

**Rejected:** Ship when offline aggregate accuracy improves. It omits calibration, threshold workload, subgroup/context failure and real human use.

**Rejected:** Use synthetic data alone to claim production fitness or fairness. Synthetic fixtures test mechanics, not real prevalence, behavior or harm.

## D54 — Business semantics are locale-neutral; translations are versioned presentations

**Chosen:** APIs, states, capabilities, event types and audit use stable semantic identifiers. English/Hindi labels and content translations bind exact source/glossary/provider/reviewer versions with staleness and authoritative/convenience status.

**Why:** UI strings change and some legal/evidence text cannot be treated as equivalent across machine translations. Business logic and signatures must not depend on the selected language.

**Rejected:** Store translated status labels as state or send them back as command values. Locale changes would corrupt workflows and interoperability.

**Rejected:** Replace original user/legal text with its translation. It destroys evidence, nuance and provenance.

## D55 — Accessibility conformance is journey/build evidence, not an automated score

**Chosen:** Strata engineers to GIGW 3.0 and WCAG 2.2 AA, using automated, manual, keyboard, screen-reader, mobile assistive-technology and representative disabled-user tests tied to exact builds, locales and critical journeys. Claims state scope/date/limitations and require competent assessment.

**Why:** Automated scanners cannot prove keyboard flow, comprehensible errors, assistive semantics, Hindi usability, offline recovery or meaningful completion of consequential work.

**Rejected:** Declare accessibility because Lighthouse/axe has no violations. It covers only mechanically detectable subsets.

**Rejected:** Add a separate “accessible mode.” Two implementations drift and segregate users; core components/journeys must be accessible.

## D56 — Assistance preserves user agency and never shares identity authority

**Chosen:** Kiosk/telephone/interpreter/helper work occurs through consented, purpose-bound, expiring assisted sessions with separate assistant identity, minimum access, read-back/affirmation and action receipts. Signing/approval requires the user or separately valid representative authority.

**Why:** Low-literacy or disabled users need help without surrendering cookies, OTPs, protected identity or control over consequential submissions.

**Rejected:** Let staff log in as the user or collect their OTP. Attribution, consent, security and revocation become false.

**Rejected:** Treat interpreter/assistant presence as representative authority. Language mediation does not grant legal decision power.

## D57 — Planned mobile scope is inspectors and field workers only

**Chosen:** The Flutter/Android offline app currently serves assigned inspectors and field workers performing field capture/work. Mine management, corporate users, contractors outside assigned capture, applicants, grievance handlers and non-field regulators use the responsive web portal; dedicated mobile pages for them are `TBD` pending separate approved use cases.

**Why:** Offline capture, camera/GNSS/device integrity and field sync justify a dedicated app for the users who work at the point of evidence. Extending every web workflow to mobile would multiply security, accessibility, offline-conflict and testing scope without an approved need.

**Rejected:** Promise mobile parity for all roles. It creates undocumented pages and delivery commitments the team has not designed or prioritized.

**Rejected:** Block other roles from mobile browsers. Responsive web remains available; `TBD` applies to dedicated app journeys, not web access.

## D58 — Executable artifacts, not Markdown examples, govern deployed contracts

**Chosen:** Package-owned immutable database migrations, OpenAPI/event schemas and policy-as-code implement the canonical logical/feature contracts. CI verifies migration, compatibility, authorization and consumer contracts; generated artifacts are derived and never hand-edited.

**Why:** Narrative/illustrative SQL cannot prove constraints, RLS, concurrency, version compatibility or deployed schema. The legacy `data-model.md` contains known contradictory exploration.

**Rejected:** Treat the large Markdown SQL file as the production migration. It embeds obsolete identity/tenant/audit assumptions and has no executable upgrade evidence.

**Rejected:** Let implementation silently override specifications. Drift would become invisible rather than a reviewed decision/change.

## D59 — Audit is typed transactional evidence with independent checkpoints

**Chosen:** Every material domain mutation explicitly commits domain change, typed domain audit event and outbox event atomically. Security/access streams use dedicated schemas. Append-only partition chains are periodically signed and anchored to a separately administered/WORM-capable target; historical views bind event/snapshot/policy/code versions.

**Why:** One generic trigger cannot correctly infer actor, authority, tenant, reason, classification and change semantics for heterogeneous tables. A hash chain stored under the same administrator does not independently prove completeness or prevent deletion.

**Rejected:** One universal row trigger with JSON before/after for every table. It leaks sensitive fields and loses domain/authority meaning while bypass paths remain possible.

**Rejected:** Blockchain as the audit answer. It does not supply correct event semantics, access control, source integrity, backups or lawful retention.

## D60 — Reliability targets are scoped, measured and approved

**Chosen:** Each service/operation has explicit SLI, target/window, error budget, degraded behavior, workload assumptions, RPO/RTO, owner and evidence. Load/failure/restore/DR tests validate declared profiles before production.

**Why:** “High availability,” “real time” and “all mines” are not engineering requirements without scope, percentile, freshness, volume and recovery objectives.

**Rejected:** Publish one availability/latency number for the entire platform. Interactive reads, emergency work, OCR, search and external portals have different dependencies and safe degradation.

**Rejected:** Equate successful backups with recoverability. Only application-level restore and reconciliation drills prove it.

## D61 — Migration is manifest-bound reconciliation before cutover

**Chosen:** Each source migration preserves immutable snapshots/hashes, versioned mappings and row dispositions; repeated dry runs measure record/count/total/semantic parity. Unknown/conflict remains quarantined. Cutover requires business/records/security approval, rollback criteria, delta reconciliation, hypercare and evidence before legacy retirement.

**Why:** Legacy roles, hierarchies, statuses and identifiers do not map one-to-one to Strata. Silent defaults or big-bang imports can create false authority/compliance and unrecoverable loss.

**Rejected:** Bulk copy tables then fix records after go-live. Wrong authority and legal state would become operational truth.

**Rejected:** Retire legacy after technical import count matches. Semantic parity, late/offline/external work, records obligations and user acceptance remain unproved.

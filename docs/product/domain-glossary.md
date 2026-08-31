# Strata — Canonical Domain Glossary

## 1. Usage rule

Use these terms in production requirements, interfaces, schemas, APIs, events, and user-facing explanations. A domain specification may introduce narrower terms, but it must not redefine an entry here. Historical quotations may retain original wording when labelled.

| Canonical term | Meaning | Do not use as a synonym |
|---|---|---|
| tenant | Operational data-isolation boundary | operator, company, hierarchy level |
| organization | Legal or administrative body | tenant, user group |
| organization unit | Recursive administrative unit such as subsidiary, area, region or office | mandatory fixed hierarchy level |
| mine | Governed physical operating site and compliance resource | tenant, organization |
| asset | Governed physical item or structure within a mine context | organization unit |
| person | Human identity independent of employment, role and login | user account, employee type |
| principal | Human or service subject that authenticates | person, role |
| affiliation | Time-bounded relationship between a person and organization | permanent person type |
| position template | Reusable kind of organizational or statutory position | permission enum |
| post | Concrete position owned by an organization | person, role string |
| appointment | Time-bounded holding of a post by a person | role in a cookie |
| capability | Named action that may be authorized on a target | title, screen visibility |
| mandate | Authority-specific grouping of legally supported capabilities | regulator type |
| jurisdiction | Time-bounded resource/geographic limit on a mandate | region string, capability |
| workspace | User-selected navigation context | authorization grant |
| inspection participation role | Responsibility inside one inspection team | global permission or job title |
| authority-issued | Issued by a structured authority/unit under supported authority | regulator-raised boolean |
| observation | What someone recorded at a time and place | defect, finding, incident |
| defect | Canonical physical or process problem observations may describe | observation, legal breach |
| finding | Authorized conclusion linked to an applicable requirement | raw observation, defect |
| incident | Event that occurred, including consequences and response | observation, inspection |
| containment action | Immediate action to make a hazard safe before full resolution | completed CAPA |
| CAPA | Accountable corrective or preventive work | evidence, closure |
| evidence | Provenanced material offered to support a claim | proof by itself |
| verification | Independent assessment against criteria and evidence | submission, self-attestation |
| closure | Authorized terminal decision under the record's closure policy | status edit, upload |
| reminder | Notice before or at a deadline | escalation |
| deadline escalation | Timer-driven routing from a missed deadline/acknowledgement SLA | risk escalation |
| risk escalation | Condition-driven routing from severity, recurrence or risk | deadline reminder |
| submission | Payload sent toward a receiving authority/system | accepted filing |
| acknowledgement | Evidence the authority/system accepted or registered a submission | HTTP success |
| projection | Rebuildable read model derived from authoritative records | source of truth |
| signal | Explainable analytical output requiring governed interpretation | fact or autonomous decision |
| material accounting boundary | Mine or governed shared facility within which material balance is calculated | tenant, necessarily one mine |
| book stock | Quantity derived from accepted ledger events | physical survey estimate |
| physical stock | Method/assumption/uncertainty-bearing measurement estimate at a time | exact book balance |
| dispatch | Governed material leaving a reporting boundary under a consignment | internal transfer, automatically offtake |
| adjustment | Approved compensating event explaining a difference | overwrite or balancing plug |
| environmental result | Quality-qualified sampled or continuous measured value | compliance conclusion |
| limit binding | Reviewed executable interpretation linking a source condition to comparable measurement semantics | OCR extraction or universal threshold |
| exceedance | Comparable result crossing an effective limit rule | automatically a legal finding or incident |
| coverage | Fraction/quality of required monitoring evidence available for a window | absence of exceedance |
| contractor engagement | Time-bounded commercial/operational relationship between an organization and governed target | proof that every worker may enter |
| work package | Approved bounded scope of contractor work, location, hazards, validity and accountability | whole contract or attendance roster |
| contractor requirement instance | Applicable credential/compliance requirement for one organization, package, person or asset | uploaded document |
| work eligibility | Reproducible purpose-specific decision that a subject may perform scoped work at a time | identity, badge possession or attendance |
| controlled exception | Bounded independently approved departure with compensating controls | waiver of a legal prohibition |
| attendance | Governed record that a person started/ended or participated in a work period | proof of exact location or productive work |
| presence event | Immutable observation of passage/presence at a checkpoint, zone or witnessed fallback | current location projection |
| presence projection | Rebuildable last-confirmed/inferred state with time, source, coverage and confidence | continuous tracking fact |
| muster | Incident-bound accounting of expected, safe, exposed, transferred and unresolved people | ordinary attendance register |
| spatial source assertion | Geometry and attributes exactly as asserted by one source with provenance | published canonical geometry |
| governed geometry version | Reviewed immutable purpose-specific geometry with CRS, datum, accuracy, source and effective time | universal mine boundary |
| spatial evaluation | Reproducible comparison of subject and target versions under an explicit policy and uncertainty | legal conclusion or proof of work |
| map composition | Saved projection of authorized layer versions, filters, styles and as-of time | source of truth |
| underground topology | Surveyed versioned connectivity network with bounded positional confidence | continuous underground GPS track |
| report definition | Effective semantic/schema/source/signature/channel policy for a return | one mine's generated PDF |
| report compilation | Frozen canonical typed content plus exact source manifest | live dashboard query |
| attestation | Authorized signer's cryptographic/e-authenticated consent to exact canonical/package hashes | review approval or button click |
| filing package | Immutable manifest of content, renderings, attachments and attestations prepared for a recipient | successful submission |
| transport receipt | Evidence a channel handled bytes/request | authority acknowledgement |
| authority acknowledgement | Correlated evidence the receiver registered or acknowledged a filing | HTTP 2xx, compliance verification or acceptance unless stated |
| regulatory service version | Effective definition of an approval/service, applicability, execution mode, stages and authority | permanent hard-coded clearance checklist |
| approval assessment | Explained result identifying applicable, excluded and unresolved services for a project/fact cut | legal advice or application |
| application | Applicant-owned governed proposal and submitted content | authority case or approval |
| regulatory case | Authority processing context, native or an explicitly sourced external mirror | applicant draft |
| regulatory instrument | Authority-issued permission/clearance/licence and its versioned scope/validity/conditions | dashboard approval badge |
| execution mode | Governed statement whether a service is native, API-federated, redirected, assisted-manual or information-only | UI navigation choice |
| search projection | Disposable authorized searchable representation of an exact source version | source record or permission grant |
| search checkpoint | Per-domain/partition proof of which source event/version has been indexed | guarantee of live completeness |
| search session | Bounded query, authorization revision, policy and index point-in-time used for consistent results | continuing access grant |
| semantic match | Model/version-scored conceptual retrieval candidate with source anchor | duplicate, legal equivalence or finding |
| search tombstone | Verified removal instruction/status across lexical, vector, suggestion, snippet and cache surfaces | deletion of source record |
| grievance intake | Immutable assertion received through a permitted low-barrier or official channel | verified allegation, grievance case |
| grievance case | Governed redress lifecycle derived from one or more intakes under an effective route policy | intake, incident, finding |
| reporter vault | Separately protected identity/contact store referenced by an opaque case-facing identifier | ordinary case fields or search content |
| disposition | Frozen reasoned grievance outcome issued by authorized authority after required review | complainant agreement, verified remediation, closure of appeal |
| grievance transfer | Evidence-bearing request and acceptance of responsibility between posts/authorities/systems | referral complete at send time |
| safeguarding concern | Separately protected retaliation, victimisation or reporter-safety matter | ordinary grievance note |
| connector definition | Approved provider-neutral operations, schemas, semantics and recovery contract | endpoint configuration or secret |
| connector deployment | Environment/authority-specific binding of connector version, endpoint, network, policy and credential references | reusable connector code |
| integration exchange | One business-correlated inbound or outbound intent with immutable payload/evidence lineage | individual HTTP attempt |
| outcome unknown | State where transport may have committed remotely but no reliable result is available | failed or safe to retry |
| external resource mapping | Versioned system+namespace identifier relationship to a canonical resource | globally unique bare external ID |
| dead letter | Immutable failed input requiring policy/operator disposition after automated handling is exhausted | deleted message or business rejection |
| reconciliation case | Evidence-based resolution of inconsistent or uncertain local/remote observations | overwrite of source or domain truth |
| AI use case | Approved versioned purpose, affected actors, decision influence, risk and controls for one analytical component | generic permission to use a model everywhere |
| anomaly | Deviation from a declared baseline/comparator with coverage and uncertainty | fraud, violation, causation or predicted accident |
| risk signal | Time-bounded explained analytical assertion used to prioritize human attention | finding, legal fact or autonomous action |
| feature snapshot | Point-in-time source/version-bound value used in one model/run | mutable latest field |
| model evaluation | Manifest-bound measurement against baseline, thresholds, slices, harms and operational workflow | generic accuracy percentage |
| AI run | One immutable execution binding use case, data/features, model/rule/prompt/provider/tools and outputs | continuing truth or model deployment |
| signal contest | Additive challenge/correction review by an affected subject or authorized representative | deletion of historical output |
| model drift | Measured change in input/output/performance distribution requiring interpretation | automatic proof that a model failed |
| canonical semantic value | Stable locale-neutral code/typed value used by business logic and APIs | translated UI label |
| translation version | Target-locale rendering bound to exact source/glossary/provider/reviewer versions | replacement of source truth |
| authoritative text | Exact language/version designated by competent content/legal owner | any convenient machine translation |
| accessible derivative | Provenance/hash-linked accessible rendering of an original evidence/document | alteration or replacement of original evidence |
| assisted session | Consented purpose-bound time-limited help relationship with action receipts | shared login or representative authority |
| locale pack | Signed compatible version set of approved messages/terms/help for one surface/offline use | business configuration or permission bundle |
| release manifest | Immutable digest set of code, migrations, schemas, policies, configuration and approval/test evidence for one release | deployment success by itself |
| audit checkpoint | Signed independently anchored digest over an exact audit stream range | replacement for event authorization or backup |
| historical reconstruction | Manifest-bound as-of/known-at projection using exact event, snapshot, policy and code versions | current row with an old date filter |
| service-level indicator | Precisely measured user/system behavior such as latency, availability, freshness or queue age | target or marketing promise |
| recovery point objective | Approved maximum tolerable data-loss interval for a scoped service/data class | backup frequency alone |
| recovery time objective | Approved maximum target time to restore a scoped service after disruption | observed restore time without a target |
| migration row disposition | Auditable accepted/duplicate/conflict/quarantined/rejected result for one source record | silent drop/default |
| production eligibility | Evidence that a release passed its declared gates for a scope | implementation complete, certified or authorized to launch |

## 2. Authority language

Use structured issuer fields in data and APIs. In prose, use **authority-issued** when generic and name the authority when known, such as **DGMS-issued finding**. “External” describes system position, not legal authority.

Use **monitoring view** for the purpose-logged, published-state, non-mutating regulator surface. Use **participating-authority workspace** for authorized inspection, finding, verification, or closure actions. Visibility alone grants neither.

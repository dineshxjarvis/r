# Wave 4 — Environmental Monitoring Pre-Design Gap Audit

## A. Outcome and boundary

**Outcome:** every environmental compliance claim is traceable to the applicable clearance/consent condition, correct monitoring location and method, calibrated instrument or custody-proven sample, comparable unit/statistic/averaging period, reviewed evaluation, accountable response and acknowledged authority submission.

Environment owns monitoring programmes, stations/points, parameter/method catalogues, samples/custody, instrument observations, validated results, limit bindings, coverage, evaluations and exceedance cases. Compliance owns source obligations; documents own clearance/consent versions; GIS owns governed geometry; incidents own harmful releases/emergencies; reporting owns generated/submitted returns.

## B. Real-world actor/accountability map

| Responsibility | Operational/accountable position | Boundary |
|---|---|---|
| Programme and schedule | Environment Officer/Environmental Management Cell | Maps reviewed conditions to monitoring plan |
| Sample collection | Authorized sampler/field environmental staff | Collects/preserves/transfers; cannot certify lab result |
| Laboratory analysis | Authorized laboratory analyst/signatory | Owns analytical result and correction under method/accreditation scope |
| Continuous instrument operation | Instrumentation/environment technician | Maintains/calibrates device; cannot approve own compliance conclusion alone |
| Data validation/evaluation | Environmental scientist/reviewer | Applies method/QA/limit binding |
| Immediate response | Mine operational/environment posts | Acts on exceedance; does not wait for six-monthly report |
| Mine accountability | Mine Manager/project-head post under applicable approval | Ensures monitoring, response and truthful reporting |
| Corporate oversight | Head of Environment/senior executive | Reviews systemic exceptions and reporting readiness |
| Authority review | MoEFCC regional office/CPCB/SPCB authorized appointment | Receives/reviews within mandate/jurisdiction; operator cannot record authority acceptance |

## C. Authoritative records and ownership

Clearance/consent document and published obligation remain source for duty. A human-approved limit binding is the executable interpretation with source anchors. Raw sensor observation, validated result, laboratory certificate and compliance evaluation remain separate records. PARIVESH submission is an external mirror, not source truth.

## D. Lifecycle and handoff trace

```text
clearance/consent version → reviewed condition/obligation → monitoring programme
→ location + parameter + method + schedule + limit binding
→ sample/custody/lab result OR continuous raw observation/validation
→ comparable aggregate/result → evaluation → exceedance/coverage exception
→ immediate response + incident/finding/CAPA where applicable
→ reviewed period claim → six-monthly/statutory report → authority acknowledgement
```

## E. Physical/device/offline model

Stations lose power/network, drift, foul and undergo calibration/maintenance. Samples can be taken at the wrong point/time, contaminated, preserved incorrectly, transferred late or tested outside method/accreditation scope. Weather, flow, production state and season may be necessary context. Missing data is not zero or compliant.

## F. Authority and separation-of-duties matrix

Sampler cannot sign the laboratory result merely by collecting it. Instrument maintainer cannot approve compliance for their affected device period alone. AI/OCR cannot publish a limit binding. Operator cannot mark an authority acknowledgement. Correction preserves original result and requires issuer/reviewer authority. Mine-level reviewer cannot waive an authority condition without source instrument.

## G. Failure, abuse and recovery scenarios

| Scenario | Required result |
|---|---|
| Condition amended/superseded | New effective binding; historic results retain old binding |
| Unit/averaging mismatch | No comparison; explicit incompatibility exception |
| Result below detection limit | Censored-value semantics retained; never silently zero |
| Calibration expires/fails | Affected interval flagged; coverage/evaluation reevaluated |
| Sensor offline | Coverage gap and obligation risk, not compliant zero |
| Corrected lab certificate | Superseding result; original/correction reason retained |
| Accreditation scope invalid | Result remains evidence but cannot satisfy configured legal-quality gate |
| Sample custody breaks | Qualified/unusable state with review; no silent acceptance |
| Nearby CPCB station differs | Contextual discrepancy signal, not automatic mine violation |
| Acute release/fire | Incident activation and containment; monitoring case remains linked |
| PARIVESH unavailable | Report package retained, alternate/retry policy visible; no false submission |
| Mine suppresses exceedance | Immutable raw/result lineage and independent escalation remain |

## H. Upstream/downstream dependency impacts

Documents/compliance supply conditions; GIS supplies versioned locations; production supplies operating context/denominators; evidence stores certificates; incident handles emergencies; defect/CAPA handles durable breach/action; reporting/PARIVESH handles submissions; dashboards/AI consume coverage- and confidence-bearing projections.

## I. Gap register

### GAP-04-001
Class: `OWN`  
Claim: Environmental monitoring has no canonical domain.  
Evidence: PS §4.7 and tracker `MISSING`.  
Failure consequence: documents, sensors and dashboards become competing sources.  
Required decision or fix: create feature/model/API owner.  
Accountable decision owner: product/architecture.  
Canonical destination: environment feature/model/API.  
Blocking wave/date: Wave 4.  
Status: `RESOLVED`

### GAP-04-002
Class: `DATA`  
Claim: Permit prose is not an executable limit definition.  
Evidence: EC conditions vary and may be modified; current obligation model lacks parameter/statistic/location/method binding.  
Failure consequence: legally incorrect comparisons.  
Required decision or fix: reviewed effective-dated limit binding with source anchors.  
Accountable decision owner: environmental/legal reviewer.  
Canonical destination: environment/compliance boundary.  
Blocking wave/date: Wave 4.  
Status: `RESOLVED`

### GAP-04-003
Class: `DATA`  
Claim: Units, basis, detection limits, statistics and averaging periods are ungoverned.  
Evidence: PS only says readings against permitted limits.  
Failure consequence: incomparable values produce false compliance/exceedance.  
Required decision or fix: parameter/method/unit/statistic semantics and compatibility engine.  
Accountable decision owner: environmental data governance.  
Canonical destination: environment spec/model.  
Blocking wave/date: Wave 4.  
Status: `RESOLVED`

### GAP-04-004
Class: `PHYSICAL`  
Claim: Continuous sensor quality/calibration/downtime and manual sample custody are absent.  
Evidence: CPCB CEMS guidance requires raw/validated data, calibration, diagnostics and logs.  
Failure consequence: invalid data appears trustworthy or missing periods appear compliant.  
Required decision or fix: separate continuous and sample QA lifecycles with coverage.  
Accountable decision owner: environment/metrology/lab owner.  
Canonical destination: environment spec/model/API.  
Blocking wave/date: Wave 4.  
Status: `RESOLVED`

### GAP-04-005
Class: `AUTH`  
Claim: Sampler, lab signatory, instrument maintainer, evaluator and accountable approver are conflated.  
Evidence: no environment capabilities exist.  
Failure consequence: self-certification or blocked operations.  
Required decision or fix: capability/separation matrix.  
Accountable decision owner: authorization owner.  
Canonical destination: authorization/environment specs.  
Blocking wave/date: Wave 4.  
Status: `RESOLVED`

### GAP-04-006
Class: `FLOW`  
Claim: Reading, exceedance, non-compliance, incident and finding are conflated.  
Evidence: integration prose suggests sensor breach can auto-fulfil/flag obligations.  
Failure consequence: automated legal conclusion or delayed emergency response.  
Required decision or fix: separate result, rule evaluation, reviewed compliance conclusion, incident and finding/CAPA.  
Accountable decision owner: environment/compliance/incident owners.  
Canonical destination: environment feature/dependency boundaries.  
Blocking wave/date: Wave 4.  
Status: `RESOLVED`

### GAP-04-007
Class: `FLOW`  
Claim: Result correction, limit amendment and period publication/reopening are undefined.  
Evidence: audit requirement and amendable EC conditions.  
Failure consequence: historical compliance silently changes.  
Required decision or fix: immutable supersession and versioned evaluation/reporting periods.  
Accountable decision owner: environment/reporting owner.  
Canonical destination: environment spec/model/API.  
Blocking wave/date: Wave 4.  
Status: `RESOLVED`

### GAP-04-008
Class: `OPERABILITY`  
Claim: Feed coverage and external submission/acknowledgement are not represented.  
Evidence: PARIVESH supports compliance reports; sensors may be unavailable.  
Failure consequence: dashboards show zero exceedance and reports appear submitted falsely.  
Required decision or fix: coverage/freshness plus Wave 8/12 submission boundary.  
Accountable decision owner: environment/reporting/integration owners.  
Canonical destination: environment spec/API.  
Blocking wave/date: Wave 4 design; Waves 8/12 execution.  
Status: `ACCEPTED_RISK`

## J. Decisions requiring human approval

1. Environmental/legal authority must approve each condition-to-limit binding and effective interval.
2. Operator/environment authority must approve method, calibration, coverage and exceedance-response policies.
3. Records/privacy owners must approve retention for raw telemetry, samples, certificates and statutory packages.

## K. Canonical documents that must change

Environment feature/model/API, authorization, glossary, capability/index, compliance boundary, decisions and tracker.

### Official-source verification

- [PARIVESH](https://parivesh.nic.in/) — current MoEFCC clearance and compliance-report portal boundary.
- [MoEFCC Annual Report 2024–25](https://www.moef.gov.in/uploads/pdf-uploads/English_Annual_Report_2024-25.pdf) — PARIVESH 2.0 online six-monthly EC compliance monitoring.
- [Published EC condition example](https://parivesh.nic.in/utildoc/136573895_1758265962237-signed.pdf) — monitored data, six-monthly reporting and modifiable conditions.
- [CPCB CEMS guidelines](https://cpcb.nic.in/upload/thrust-area/Guidelines_on_CEMS_02.08.2017.pdf) — raw/validated data, calibration, diagnostic/log and transmission expectations.
- [CPCB Noise Pollution Rules page](https://cpcb.nic.in/noise-pollution-rules/) — source for effective standards/authority configuration, not a hard-coded universal mine limit.

## L. Exit verdict

**Pre-design: FAIL — expected.** Eight material gaps were recorded.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-04-001 through 007 are resolved by the canonical environment feature/model/API, capability matrix, binding publication, compatibility engine, QA/custody/calibration lifecycles and immutable correction/period manifests. GAP-04-008 is an accepted downstream dependency: environment now exposes coverage and release-ready manifests, while Waves 8/12 must implement report generation, PARIVESH/CPCB/SPCB transport and authority acknowledgement.

The adversarial pass additionally tested censored results, mixed matrices, changed locations, seasonal/operating applicability, corrected certificates, accreditation expiry, sensor backfill, nearby CPCB comparison, acute release and the prior sensor-auto-fulfil language. All now have explicit safe boundaries.

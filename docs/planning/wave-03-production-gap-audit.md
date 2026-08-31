# Wave 3 — Production, Dispatch and Stock Pre-Design Gap Audit

## A. Outcome and boundary

**Outcome:** every reported tonne can be traced to a governed material movement or measurement, opening and closing stocks reconcile without silent adjustment, discrepancies have accountable owners, and Ministry/operator figures remain reproducible after correction.

The domain owns production lots/events, material transformation and movement, stock locations/snapshots, dispatch consignments, measurements, reconciliation cases and approved reporting facts. It does not own mine/asset identity, customer contracts, invoices/payments, laboratory analytical results, railway operations, vehicle GPS, statutory report submission, dashboards or external portals.

## B. Real-world actor/accountability map

| Responsibility | Concrete operational position | Boundary |
|---|---|---|
| Record shift extraction/processing | Shift production official/authorized recorder | Captures source event; cannot approve own period reconciliation alone |
| Operate weighbridge | Weighbridge operator | Captures gross/tare and device evidence; cannot alter calibration or approve discrepancy |
| Control dispatch | Dispatch officer | Validates authorization, mode, consignee and release |
| Maintain stockyard movements | Stockyard/CHP responsible post | Records transfers, processing, consumption and losses |
| Survey physical stock | Authorized surveyor/stock measurement team | Produces method/geometry/confidence-bearing estimate |
| Maintain device/calibration | Metrology/instrumentation role | Records service/calibration; cannot approve commercial movement |
| Reconcile shift/day/month | Production/statistics officer | Investigates discrepancies and proposes period close |
| Quality determination | Sampling/laboratory authority | Owns sample/test result; production references it |
| Approve/freeze reported facts | Mine Manager or designated accountable production post | Approves period close/correction with separation policy |
| Contractor/MDO submission | Contractor production representative | Supplies attributable facts; operator validates legal reporting |
| Portfolio review | Operator/Ministry authorized post | Reviews approved projections; cannot mutate mine facts |

Titles vary by operator. Strata models position templates, concrete posts and appointments; it does not invent one global `PRODUCTION_MANAGER` role.

## C. Authoritative records and ownership

- Raw device/manual measurement remains immutable source evidence.
- Production/dispatch/stock owns normalized material events and approved reconciled facts.
- Weighbridge/IoT/VTS/ERP/PRIMS records are sources or external mirrors according to a versioned source policy, never universally authoritative.
- Laboratory owns quality result; GIS/survey owns geometry; production owns which result/survey is applied to which lot/snapshot.
- Dashboard, monthly return and AI outputs are projections.

## D. Lifecycle and handoff trace

```text
shift plan → extraction/receipt event → ROM lot → transfer/processing/blending
→ product/reject lots → stock-location ledger → dispatch authorization
→ gross/tare or other quantity evidence → consignment dispatch/receipt evidence
→ daily balance → discrepancy investigation → approved period close
→ monthly/statutory reporting fact → external submission/acknowledgement
```

Targets, observations, estimates, reconciled facts and submitted figures are distinct.

## E. Physical/device/offline model

- Weighbridges drift, fail, use wrong tare or receive test/calibration loads.
- Trucks can make duplicate/ghost trips, change route or exchange RFID/number plates.
- Rail, road, conveyor, ropeway and internal transfer need different evidence.
- Stock survey is an estimate with method, geometry, density/moisture assumptions and uncertainty.
- Rehandling does not create production; processing yield cannot create mass.
- Offline/manual fallback records reason, witness, time bounds and later reconciliation.

## F. Authority and separation-of-duties matrix

Recorder cannot approve own material correction or period close. Weighbridge operator cannot maintain calibration and approve affected discrepancies alone. Contractor cannot finalize operator statutory facts. Period reopening requires stronger authority than routine entry. Portfolio visibility grants no correction authority.

## G. Failure, abuse and recovery scenarios

| Scenario | Required result |
|---|---|
| Duplicate device ticket/retry | Idempotent ingest; original retained |
| Wrong tare or test vehicle | Quarantine/void through compensating classification, never deletion |
| Reader/ANPR/VTS disagreement | Discrepancy case with all evidence and accountable owner |
| Weighbridge out of calibration | Affected interval flagged; alternate approved method and later reconciliation |
| Negative computed stock | Period cannot close without explained correction/uncertainty |
| Late event after close | Posted to adjustment/reopened version, never historical overwrite |
| MDO and operator disagree | Both assertions retained; operator-approved reporting fact identifies basis |
| ERP/PRIMS unavailable | Source ledger continues; export retries and freshness gap visible |
| Stock fire/theft/washout | Governed loss event linked to incident/evidence, not a balancing plug |
| Unit/grade changed | Versioned conversion/classification; original quantity retained |

## H. Upstream/downstream impacts

Mine/assets supplies locations/equipment; contractor domain supplies MDO engagement; evidence stores tickets/images; GIS/survey supplies geometry; environment consumes/produces relevant measurements; reporting binds approved facts; integration exchanges PRIMS/ERP/weighbridge/VTS; dashboard/AI consume freshness/confidence-bearing projections.

## I. Gap register

### GAP-03-001
Class: `OWN`  
Claim: Production, dispatch and stock have no canonical domain.  
Evidence: PS §4.7 and tracker show `MISSING`.  
Failure consequence: dashboards/reports become competing sources.  
Required decision or fix: create feature/model/API owner.  
Accountable decision owner: product/architecture.  
Canonical destination: production feature/model/API.  
Blocking wave/date: Wave 3.  
Status: `RESOLVED`

### GAP-03-002
Class: `DATA`  
Claim: “Authoritative source” cannot be one global system.  
Evidence: PRIMS accepts daily/monthly production and reconciliation while physical sources include weighbridges, surveys, ERP and operational logs.  
Failure consequence: last-write-wins destroys evidence and hides disagreement.  
Required decision or fix: event-level source policy plus approved reconciliation fact.  
Accountable decision owner: operator/Ministry data governance.  
Canonical destination: production spec/model.  
Blocking wave/date: Wave 3 design; source catalogue before onboarding.  
Status: `ACCEPTED_RISK`

### GAP-03-003
Class: `VOC`  
Claim: Production, transfer, processing, rehandling, dispatch, offtake and stock adjustment are conflated.  
Evidence: current requirements list only aggregated production/dispatch/stock.  
Failure consequence: double counting and impossible mass balance.  
Required decision or fix: canonical material-event taxonomy and lot lineage.  
Accountable decision owner: production domain owner.  
Canonical destination: glossary/production spec.  
Blocking wave/date: Wave 3.  
Status: `RESOLVED`

### GAP-03-004
Class: `AUTH`  
Claim: Recorder, weighbridge operator, dispatch controller, surveyor, reconciler and approver lack capabilities/separation.  
Evidence: authorization catalogue has no production actions.  
Failure consequence: self-approved manipulation or blocked work.  
Required decision or fix: target-specific capability matrix.  
Accountable decision owner: authorization owner.  
Canonical destination: authorization/production specs.  
Blocking wave/date: Wave 3.  
Status: `RESOLVED`

### GAP-03-005
Class: `PHYSICAL`  
Claim: Measurement uncertainty, calibration intervals and test transactions are absent.  
Evidence: Ministry vigilance material documents load-cell discrepancy and calibration/test handling.  
Failure consequence: false precision and contaminated totals.  
Required decision or fix: measurement provenance, device health, uncertainty and affected-period rules.  
Accountable decision owner: metrology/production owner.  
Canonical destination: production spec/model.  
Blocking wave/date: Wave 3.  
Status: `RESOLVED`

### GAP-03-006
Class: `FLOW`  
Claim: Period close, late correction and reopening are undefined.  
Evidence: PS demands auditability; PRIMS exposes daily/monthly reconciliation.  
Failure consequence: published history changes silently.  
Required decision or fix: versioned close/reopen/adjustment workflow.  
Accountable decision owner: production reporting owner.  
Canonical destination: production spec/API.  
Blocking wave/date: Wave 3.  
Status: `RESOLVED`

### GAP-03-007
Class: `DATA`  
Claim: Stock survey estimate and transaction-derived book stock are not separated.  
Evidence: physical stock cannot always be continuously weighed.  
Failure consequence: unexplained variance is presented as one exact stock figure.  
Required decision or fix: parallel book/physical snapshots plus variance/reconciliation.  
Accountable decision owner: stock/survey owner.  
Canonical destination: production spec/model.  
Blocking wave/date: Wave 3.  
Status: `RESOLVED`

### GAP-03-008
Class: `SCOPE`  
Claim: MDO/contractor operational attribution may be confused with operator legal reporting responsibility.  
Evidence: different mine operating arrangements and PS contractor attribution.  
Failure consequence: accountability laundering or duplicate figures.  
Required decision or fix: preserve operator, operating organization and responsible engagement separately.  
Accountable decision owner: tenant/operator governance.  
Canonical destination: production and contractor specs.  
Blocking wave/date: Wave 3/5 boundary.  
Status: `RESOLVED`

## J. Decisions requiring human approval

1. Each onboarding must approve a source-policy matrix per fact/event type; no software-wide source winner is safe.
2. Operator must approve tolerance, close/reopen and material-loss policies by mine/material/method.
3. Ministry/report owner must approve mappings from reconciled facts to PRIMS and statutory outputs.

## K. Canonical documents that must change

Production feature/model/API, authorization catalogue, glossary, capability/index/dependency map, decision record and tracker.

### Official-source verification

- [Ministry Single Window/PRIMS description](https://coal.gov.in/nominated-authority/single-window-system) — daily/monthly production, dispatch and daily reconciliation already exist as Ministry-facing workflows.
- [PRIMS user manual](https://coal.gov.in/sites/default/files/2024-03/20-07-2023-swcs.pdf) — opening stock, targets, actual production, rail/road dispatch, monthly difference reasons and reconciliation fields.
- [Coal Controller dashboard](https://www.coalcontroller.gov.in/coal-dashboard) — official production, despatch, closing-stock and grade-wise portfolio outputs.
- [Colliery Control Rules, 2004](https://coalcontroller.gov.in/files/guidelines-acts-documents/colliery_control_rules_2004.pdf) — return/information obligations to Coal Controller as legal-rule input.
- [Ministry annual-report vigilance findings](https://www.coal.gov.in/sites/default/files/2023-03/chap18AnnualReport2023en.pdf) — real weighbridge discrepancy, calibration, standard-weight and test-reading exclusion controls.
- [Ministry Annual Report 2025–26, safety chapter](https://coal.gov.in/sites/default/files/2026-02/chap14AnnualReport2026en.pdf) — OITDS, VTS, ANPR and weighbridge/ICCC inputs as integration evidence.

## L. Exit verdict

**Pre-design: FAIL — expected.** Eight material gaps were identified.

**Post-design adversarial verdict: CONDITIONAL PASS.** GAP-03-001 and 003–008 are resolved by the canonical feature/model/API, capability matrix, immutable measurement lineage, accounting-boundary model, calibration handling and versioned close/reopen workflow. GAP-03-002 is an accepted deployment dependency: architecture and reconciliation semantics are fixed, but each operator/onboarding authority must approve the concrete source-policy matrix before its facts can be published.

The adversarial pass additionally tested shared washeries/sidings, ambiguous `LT` units, stock loss, test loads, late rail evidence, MDO attribution and missing feed coverage. Shared facilities now use material-accounting boundaries with origin-mine lineage; canonical mass is decimal metric tonne with explicit basis and versioned presentation scaling.

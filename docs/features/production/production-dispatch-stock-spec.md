# Strata — Production, Dispatch and Stock Specification

## 1. Purpose and boundary

This specification owns `CAP-07` and the production portion of PS §4.7. It governs measured material events, coal lots/lineage, stock locations, dispatch consignments, material-accounting boundaries, balance periods, reconciliation and approved facts used by reporting and analytics.

Strata is the governed reconciliation ledger and unified view. It integrates existing PRIMS, ERP, weighbridge, dispatch, survey, laboratory and telemetry systems; it does not pretend they do not exist.

## 2. Canonical vocabulary

| Term | Meaning |
|---|---|
| Extraction | Coal/overburden removed from its geological/working context |
| Production | Defined reportable coal output under a versioned reporting basis |
| Receipt | Material entering the governed boundary from another source |
| Transfer | Movement between internal locations; never new production |
| Processing | Transformation/separation/blending producing linked output/reject lots |
| Rehandling | Physical movement without new output; never production |
| Dispatch | Governed material leaves the mine/reporting boundary under a consignment |
| Offtake | Consumer/commercial concept mapped explicitly when applicable; not an automatic synonym for dispatch |
| Book stock | Quantity derived from accepted opening balance and material ledger |
| Physical stock | Survey/measurement estimate at a point in time with uncertainty |
| Adjustment | Approved compensating event explaining a difference; never an overwrite |

## 3. Accountability

Mine Manager or an approved accountable production post owns period approval and unresolved discrepancy escalation. Day-to-day posts include shift production recorder, weighbridge operator, dispatch officer, stockyard/CHP responsible post, authorized surveyor, instrumentation/metrology maintainer, production/statistics reconciler and quality/laboratory authority.

Operator-specific titles map to capabilities through posts/appointments. MDO or contractor actors may submit facts within a valid engagement; the operator's legal/statutory reporting accountability is not transferred merely because a contractor operated the mine.

## 4. Material identity and lineage

Every event references a material definition/version, quantity with unit/basis, source/destination, occurrence interval and provenance. Lots allow traceability through extraction, transfer, processing, blending, stock and dispatch.

A `material_accounting_boundary` is a governed mine or shared facility such as a washery, siding or stockyard. Shared facilities do not fabricate one owning mine: lots retain origin-mine lineage and events balance within the facility boundary before allocation/reporting by mine.

Mass-balance invariant for a governed boundary/period:

```text
opening accepted stock
+ accepted production/receipts
- accepted dispatch/consumption/transfers-out
- governed losses
± approved adjustments
= book closing stock
```

Internal transfers and rehandling cancel across the boundary and cannot increase production. Processing requires input/output/reject/loss lineage; unexplained yield beyond tolerance opens a discrepancy.

## 5. Measurements and source policy

Every quantity is a measurement/assertion with:

- source system/device/document and source record ID;
- method and device/calibration version;
- observed value/unit and normalized value/unit;
- wet/dry/as-received or other quantity basis;
- event time, device time, received time and confidence/time bounds;
- manual-entry witness/reason where applicable;
- quality/sample reference where applied;
- uncertainty/tolerance; and
- superseding/void classification without deletion.

`production_source_policy` is effective-dated per tenant/accounting boundary, fact/event kind, mode and context. It defines eligible sources, precedence, corroboration, tolerance, fallback and required reviewer. Precedence chooses a basis for an approved fact; it never erases contrary evidence.

Canonical stored mass is decimal metric tonne with an explicit measurement basis. Display/reporting scales such as tonne, thousand tonne, lakh tonne or million tonne are versioned presentation conversions; ambiguous strings such as `LT` are never stored as a unit without a declared definition.

## 6. Weighment and dispatch

Road dispatch normally links authorization, vehicle/carrier, RFID/ANPR where available, gross/tare events, net quantity, material/grade, destination and gate-out. Rail dispatch links rake/wagon/railway evidence and applicable aggregate/individual weighment. Conveyor/ropeway/other modes use approved meter/survey methods.

Test/calibration transactions are explicitly classified and excluded from commercial/production totals. Device health and calibration intervals define affected measurements. An expired/failed calibration does not silently null all facts: it opens affected-period discrepancies and invokes the approved alternate method.

Vehicle tracking or ANPR corroborates identity/route; it does not replace quantity measurement. Impossible travel, reused ticket, duplicate gross/tare, swapped vehicle/tag and route deviation are discrepancy signals, not automatic fraud verdicts.

## 7. Stock

Stock is held by material/quality basis and governed location. Book stock is continuously derived. Physical stock snapshots record survey method, geometry/version, density/moisture assumptions, measured volume/quantity, uncertainty and survey team authority.

```text
book closing stock ─┐
                    ├→ variance → within tolerance | discrepancy case
physical snapshot ──┘
```

Never replace book stock with a survey estimate. Approved reconciliation creates an adjustment event with cause category and evidence. Theft, fire, spontaneous heating, washout or other material loss links to an incident where applicable.

## 8. Period lifecycle

```text
OPEN → CAPTURE_CUTOFF → RECONCILING → REVIEW_READY → APPROVED → PUBLISHED
  \                                               /
   └──────── correction/reopen request ──────────┘
```

Shift/day/month periods can nest, but aggregate facts retain contributing event/period manifests. Approval freezes a version, not the underlying history. A late event after approval creates an exception; authorized reopening or next-period adjustment records reason, impact and prior published consumers. `PUBLISHED` means released for governed reporting, not submitted or accepted by an external authority.

## 9. Reconciliation

Discrepancies arise from mass-balance variance, competing source values, missing sequence, device health, duplicate ticket, grade/lot mismatch, late data, stock survey variance or external-system mismatch.

Each case has owner, severity, affected events/periods, competing assertions, tolerance/policy version, investigation, proposed basis, evidence, independent review and disposition. Allowed dispositions include source accepted, corrected source event, approved adjustment, duplicate/test excluded, timing difference, external correction required and unresolved carried forward.

No generic “reason for difference” text alone is sufficient for material discrepancies.

## 10. Targets and reporting facts

Approved mine-plan target, operational target, forecast, raw actual, reconciled actual and externally submitted value remain distinct. Variance always states numerator/baseline and period/version.

PRIMS/Coal Controller/statutory outputs consume an approved reporting fact with exact event manifest, conversion/policy versions and freshness. Wave 8 owns report generation/signature; Wave 12 owns adapters/acknowledgement. Production owns the fact and discrepancy if external values differ.

## 11. Capabilities and separation

| Capability | Target |
|---|---|
| `production.event.record`, `production.event.ingest_device` | mine/device/material event |
| `production.event.review`, `production.event.void_classify` | material event |
| `production.lot.manage`, `production.transfer.record`, `production.processing.record` | lot/location/process |
| `dispatch.authorize`, `dispatch.weigh`, `dispatch.release`, `dispatch.read` | consignment/weighment |
| `stock.read`, `stock.survey.record`, `stock.adjust.propose`, `stock.adjust.approve` | stock location/snapshot/adjustment |
| `production.reconcile`, `production.discrepancy.resolve` | period/discrepancy |
| `production.period.approve`, `production.period.publish`, `production.period.reopen` | reporting period |
| `production.source_policy.configure`, `production.device_health.manage` | policy/device |
| `production.read_operational`, `production.read_published`, `production.read_portfolio` | mine/period/portfolio |

Recorder cannot approve own adjustment/period. Device maintainer cannot resolve affected discrepancy alone. Contractor submission requires operator-side approval. Reopening/publishing require elevated authority and persisted supporting appointment.

## 12. Events and consumers

Emit material event accepted/corrected, consignment dispatched, device-health changed, discrepancy opened/resolved, physical snapshot recorded, period approved/reopened/published and external mismatch detected. Reporting, dashboards, search and AI use authorization-filtered projections with freshness/coverage. Analytics never mutates source facts.

## 13. Offline, concurrency and recovery

- Client/source IDs make ingest idempotent.
- Device sequences expose missing/replayed events.
- Concurrent period approval uses expected version and gate re-evaluation.
- Offline manual records retain time bounds, witness and reason.
- External outage queues export without blocking local ledger close unless policy says otherwise.
- Correction is append-only; consumers receive invalidation/rebuild events.
- Unresolved critical discrepancies block approval; lower severity may carry forward only with owner/deadline.

## 14. Privacy, classification and retention

Operational quantities are restricted business/governance data; vehicle/driver identities and route traces are personal/operationally sensitive. Commercial destination/contract fields use minimum-necessary projections. Signed/published facts, source manifests, corrections and reconciliation evidence follow approved statutory/financial retention and legal holds. Raw telemetry may have shorter policy retention while derived provenance/checkpoints remain reconstructable.

## 15. Acceptance criteria

1. Rehandling never increases production.
2. Processing outputs/rejects/loss reconcile to inputs within policy tolerance.
3. Duplicate/test weighment is excluded without deletion.
4. Expired calibration opens affected-period discrepancy and invokes approved fallback.
5. MDO and operator assertions remain visible while one approved reporting fact states its basis.
6. Book and physical stock remain separate with explicit variance.
7. Negative stock blocks close unless resolved through governed evidence/adjustment.
8. Recorder cannot approve own period or stock adjustment.
9. Late event after publication produces versioned reopen/adjustment and downstream invalidation.
10. PRIMS transport/submission never becomes source truth or authority acceptance.
11. Every portfolio tonne drills to approved fact, manifest, events and source measurements.
12. Missing source coverage shows `DATA_INCOMPLETE`, never zero.

## 16. Non-goals

- Replacing ERP, PRIMS, weighbridge firmware, railway systems, laboratories or commercial billing.
- Selecting one universal source winner for all operators/events.
- Treating stock surveys as exact or GPS/ANPR as quantity proof.
- Autonomous AI corrections, fraud conclusions or period approvals.
- Implementing statutory report forms/submission before Waves 8/12.

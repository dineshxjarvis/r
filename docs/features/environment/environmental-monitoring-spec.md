# Strata — Environmental Monitoring Specification

## 1. Purpose and boundary

This specification owns `CAP-08` and the environmental portion of PS §4.7. It governs environmental monitoring programmes, monitoring points, samples/custody, instruments, observations/results, coverage, executable limit bindings, evaluations and exceedance cases.

Documents/compliance own source instruments and obligations. Environment owns measurement truth and evaluated comparison. A human/authority owns legal compliance conclusions. Incident owns emergency response; defect/CAPA owns confirmed breach and corrective work; reporting/integration own report generation and PARIVESH transport.

## 2. Parameter and limit semantics

An environmental value is meaningful only with parameter, matrix/source, location, method, unit, basis, statistic/averaging period, timestamp/interval, quality state and provenance.

An `environmental_limit_binding` is a reviewed executable interpretation of one source clause/obligation. It contains:

- source document/version, clause anchor and obligation ID;
- parameter and matrix/source type;
- monitoring-point selector/geometry context;
- method eligibility and accreditation/calibration requirements;
- canonical unit and basis;
- statistic and averaging window;
- threshold/operator/range;
- operating, seasonal, flow/load or other applicability conditions;
- exceedance persistence/count rule;
- response/notification policy; and
- effective interval, reviewer and supersession provenance.

OCR/AI may propose a binding. It cannot publish one. A changed EC/CTO/consent creates a new binding version; historic evaluations retain the version applied.

## 3. Accountability

The Mine Manager/project-head authority remains accountable under the applicable instrument. The Environmental Management Cell/Environment Officer operates the programme. Authorized samplers, laboratories/signatories, instrumentation staff and environmental reviewers have separate capabilities. Corporate/Head of Environment reviews systemic issues. MoEFCC/CPCB/SPCB users act only under mandate/jurisdiction.

Operator-specific titles map to concrete posts. Vacancy/absence resolves through responsibility routes; it never pauses monitoring clocks or hides an exceedance.

## 4. Monitoring programme

A versioned programme binds a mine/project, source conditions, locations, parameters, methods, frequency/windows, responsible posts, QA policy and required outputs. Points may represent ambient stations, emissions stacks, effluent outlets, surface/ground water, noise/vibration stations, meteorology, soil, reclamation/plantation plots or other governed contexts.

GIS owns geometry/version; environment records which geometry/location version applied when sampling/evaluating. Relocation, temporary substitution or inaccessible point requires reason, approval and comparability assessment.

## 5. Manual sampling and laboratory lifecycle

```text
SCHEDULED → KIT/PRESERVATIVE VERIFIED → COLLECTED → SEALED
→ CUSTODY_TRANSFERRED → LAB_RECEIVED → ANALYZED
→ TECHNICAL_REVIEW → ISSUED → SUPERSEDED_IF_CORRECTED
```

Record sampler/appointment, point/version, collection interval, field conditions, container/preservative, chain-of-custody transfers, seal condition, holding time, laboratory, method/version, accreditation/scope validity, instrument/batch/QC, detection/quantification limits, result qualifier, authorized signatory and certificate hash.

`<LOQ`, `NOT_DETECTED`, estimated and rejected results are not zero. Broken custody, exceeded holding time, blank/QC failure or out-of-scope accreditation creates a quality disposition; result remains visible but may not satisfy a legal evidence gate.

## 6. Continuous monitoring lifecycle

Raw observations remain immutable. Validation creates a derived result with rule/software version and quality flags. Device configuration, zero/span checks, calibration, maintenance, diagnostics, clock state and communication gaps are separate events.

```text
RAW → PROVISIONAL → VALIDATED | INVALIDATED | QUALIFIED
```

Validated does not mean compliant. Aggregation uses only policy-eligible observations and reports coverage. Missing, invalid or maintenance intervals reduce coverage; they never become zero. Backfill/replay is idempotent and preserves arrival time.

## 7. Compatibility and evaluation

Before comparison, the engine proves:

1. same parameter and matrix/source semantics;
2. compatible point/location and operating context;
3. eligible method/quality state;
4. valid unit/basis conversion;
5. correct statistic and averaging window;
6. sufficient required coverage; and
7. binding effective/applicable at the observation interval.

If any proof fails, result is `NOT_EVALUABLE` with reason—not compliant/non-compliant.

Evaluation outcomes: `WITHIN_LIMIT`, `EXCEEDANCE_CANDIDATE`, `CONFIRMED_EXCEEDANCE`, `INSUFFICIENT_COVERAGE`, `INCOMPATIBLE`, `NOT_APPLICABLE`, and `UNDER_REVIEW`. Automated rules may create candidates; authorized review confirms consequences where policy requires.

## 8. Exceedance, non-compliance and incident boundary

- A reading/result is evidence.
- An exceedance is a comparison under a binding.
- Non-compliance is an authorized conclusion linked to an obligation/requirement.
- An environmental incident is a harmful/uncontrolled event requiring emergency response.
- A finding records a confirmed breach; CAPA owns durable correction/prevention.

Critical/acute triggers immediately notify operational and environment posts and may activate an incident before compliance review. Routine exceedance opens an environment case, repeat sampling/verification and containment as policy requires. Nothing auto-closes an obligation merely because one result is within limit.

## 9. Exceedance case lifecycle

```text
OPEN → ACKNOWLEDGED → VERIFYING → RESPONSE_ACTIVE
→ RESOLVED_MEASUREMENT | FINDING/CAPA_TRANSFERRED | INCIDENT_LINKED
→ REVIEWED_COMPLETE
```

The case stores binding/result, severity, owner, deadline, verification plan, immediate actions, repeat results, incident/finding/CAPA links and review conclusion. Suppression/downgrade requires independent reasoned review. Repeated exceedance and repeated downtime are separate risk signals.

## 10. Period review and reporting boundary

Monitoring periods progress `OPEN → DATA_CUTOFF → QA_REVIEW → EVALUATED → APPROVED → RELEASED_FOR_REPORTING`. Approval freezes a versioned manifest of programme, bindings, results, coverage, exclusions, evaluations and open cases. Late/corrected data reopens or creates a superseding period version and invalidates downstream projections.

Wave 8 builds the six-monthly/other report from this manifest. Wave 12 submits to PARIVESH/CPCB/SPCB. `RELEASED_FOR_REPORTING`, `SENT`, `DELIVERED` and authority `ACKNOWLEDGED/ACCEPTED` remain distinct.

## 11. Alert and escalation matrix

| Trigger | Recipient | Required handling |
|---|---|---|
| Acute/critical candidate | Environment Officer + operational shift/Mine Manager route | Immediate acknowledgement and response; incident rule evaluated |
| Confirmed exceedance | Case owner + Environment/Mine Manager route | Verification/containment and obligation/finding review |
| Required station offline/coverage risk | Instrumentation + Environment Officer | Restore/fallback sample; escalation before reporting gap |
| Calibration/QC failure | Instrumentation/lab + independent reviewer | Quarantine affected interval/batch and reassess |
| Sample holding/custody failure | Sampler/lab/reviewer | Recollect if possible; preserve invalid evidence |
| Report period not ready | Environment owner + approver | Missing data/cases visible; deadline escalation |
| PARIVESH/external mismatch | Reporting/integration owner + Environment approver | Reconcile, never overwrite source |

## 12. Capabilities

| Capability | Target |
|---|---|
| `environment.program.configure`, `environment.program.approve` | programme/mine |
| `environment.point.configure` | monitoring point |
| `environment.sample.collect`, `environment.sample.transfer`, `environment.sample.receive` | sample/custody |
| `environment.lab_result.record`, `environment.lab_result.issue`, `environment.lab_result.correct` | analysis/result |
| `environment.observation.ingest_device`, `environment.observation.validate` | device/observation |
| `environment.device.manage`, `environment.calibration.record` | instrument/calibration |
| `environment.limit.propose`, `environment.limit.publish` | limit binding |
| `environment.evaluate`, `environment.exceedance.review` | result/binding/case |
| `environment.case.assign`, `environment.case.update`, `environment.case.complete` | exceedance case |
| `environment.period.review`, `environment.period.approve`, `environment.period.reopen` | monitoring period |
| `environment.read_operational`, `environment.read_published`, `environment.read_portfolio` | mine/result/portfolio |

Sampler ≠ lab signatory; maintainer ≠ sole evaluator; binding proposer ≠ publisher where required; result issuer cannot erase/correct original; operator cannot record authority acknowledgement.

## 13. Failure, abuse and recovery

- Offline samples use client IDs, custody sequence and time bounds.
- Duplicate device/sample/result ingest is idempotent without merging independent samples.
- Wrong point/method/unit/window returns incompatible, never silently coerced.
- Sensor outage exposes coverage and fallback responsibility.
- Calibration failure re-evaluates affected results/periods.
- Corrected certificate supersedes and triggers downstream invalidation.
- Configuration/threshold changes are audited and cannot apply retroactively.
- External ambient station comparison is contextual because siting/weather/source differ.
- Missing feed displays `DATA_INCOMPLETE`, never zero exceedance.

## 14. Retention and privacy

Monitoring results and published conditions are restricted governance data; exact infrastructure locations and raw telemetry may be security-sensitive. Personal fields in custody/signature records use minimum-necessary projection. Samples, raw observations, QC/calibration, certificates, bindings, evaluations, period manifests and submissions follow effective statutory/records schedules. Legal/regulatory/investigation holds suspend disposal.

## 15. Acceptance criteria

1. Condition prose cannot become an active threshold without human publication.
2. Unit, basis or averaging mismatch produces `NOT_EVALUABLE`.
3. `<LOQ` is retained as censored, not zero.
4. Sensor downtime reduces coverage and cannot show compliance.
5. Calibration failure identifies and re-evaluates the affected interval.
6. Corrected lab result preserves original certificate and downstream history.
7. Sampler cannot issue their own lab result without separate authority.
8. Acute release can activate incident response before compliance finding.
9. Within-limit reading does not auto-close an obligation.
10. Nearby CPCB data is corroborative context, not automatic mine breach.
11. Period manifest reproduces every included/excluded result and binding.
12. PARIVESH delivery does not mean authority acceptance.

## 16. Non-goals

- Replacing PARIVESH, laboratories, SPCB/CPCB systems or instrument firmware.
- Publishing legal limits through OCR/AI without review.
- One universal threshold/method/coverage policy for every mine.
- Treating all environmental data as public or all sensor values as legal evidence.
- Implementing report forms/adapters before Waves 8/12.


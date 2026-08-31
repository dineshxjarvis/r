# Strata — Role Model Gap Register

> **Status:** active remediation register.
> **Source audit:** [Cross-Role Accountability and Flow Audit](cross-role-accountability-and-flow-audit.md).
> **Last reviewed:** 2026-08-30.
> **Current exit state:** `FAIL — 22 OPEN, INCLUDING 2 BLOCKING`.

Read this file before changing role catalogues, personas, posts, appointments, attendance
ownership, inspection teams, authority integration, jurisdiction, delegation, substitute
handling or privileged administration. This register tracks gaps; it does not itself grant
authority or define product behaviour.

## 1. Status legend

| Status | Meaning |
|---|---|
| `OPEN-BLOCKING` | Canonical design or implementation is unsafe until resolved |
| `OPEN` | Confirmed gap with a named remediation path |
| `IN_PROGRESS` | Canonical documents are actively being changed |
| `RESOLVED` | Canonical change and proportional verification are complete |
| `ACCEPTED_RISK` | Named owner accepted the consequence and review date |
| `BLOCKED_EXTERNAL` | Named external decision/evidence is required |

## 2. Blocking gaps

| ID | Gap | Why it blocks | Required evidence to close | Owner | Status |
|---|---|---|---|---|---|
| ROLE-GAP-001 | Current legal baseline is unresolved after OSH&WC commencement | Statutory roles, duties, inspection authority and attendance claims may be encoded against superseded law | Current-law review covering commencement, repeals/savings, final central rules, effective coal regulations and transition treatment; cited corrections in every affected canonical document | Legal/domain owner | `OPEN-BLOCKING` |
| ROLE-GAP-007 | Attendance accountability understates owner/agent layer | The system could incorrectly make Mine Manager the sole final legal owner or invent an Attendance Manager | Legally reviewed perform/supervise/account/attest matrix for owner, agent, manager, Attendance Clerk and shift official | Attendance + legal owners | `OPEN-BLOCKING` |

## 3. Authority and identity gaps

| ID | Gap | Failure if ignored | Canonical destinations | Owner | Status |
|---|---|---|---|---|---|
| ROLE-GAP-002 | No governed authority/unit/mandate catalogue | DGMS, MoEFCC, SPCB/CPCB, CCO and labour officers can be conflated | Identity authority model, foundation model, identity governance, identity APIs | Identity + legal owners | `OPEN` |
| ROLE-GAP-003 | Appointment proofing and qualification validation are incomplete | A source-document upload can become fake authority | Identity governance, appointment API, evidence model | Identity governance | `OPEN` |
| ROLE-GAP-004 | `INSPECTOR` remains both a broad persona and participation label | Developers may treat team membership as global authority | Inspection spec/model/API, UX vocabulary, authorization tests | Inspection + UX owners | `OPEN` |
| ROLE-GAP-008 | “Official in charge of shift” is not a canonical duty assignment | No defensible answer exists for who supervised this crew at this time | Identity foundation, attendance model/API | Attendance + identity owners | `OPEN` |
| ROLE-GAP-011 | Joint visits lack separate authority workstreams | One authority could issue or close another authority's conclusion | Inspection spec/model/API, findings model | Inspection owner | `OPEN` |
| ROLE-GAP-015 | Separation can be checked by account rather than human | One person can self-approve using two principals or posts | Authorization spec and high-risk action tests | Authorization owner | `OPEN` |
| ROLE-GAP-019 | Technical administrators lack a negative capability contract | Platform support can become an unreviewed business superuser | Identity governance, production hardening and policy tests | Security owner | `OPEN` |

## 4. People and scope gaps

| ID | Gap | Failure if ignored | Canonical destinations | Owner | Status |
|---|---|---|---|---|---|
| ROLE-GAP-005 | Workmen's Inspector is missing | Worker representation is confused with management or DGMS inspection | Identity, inspection, grievance and safety specifications | Safety + identity owners | `OPEN` |
| ROLE-GAP-006 | `field worker` collapses materially different relationships | Eligibility, privacy, supervision and mobile journeys become wrong | Product personas, experience, attendance and contractor specs | Workforce + UX owners | `OPEN` |
| ROLE-GAP-016 | Principal contractor/subcontractor chain is ambiguous | Nobody can prove who supplied, controlled and supervised a worker | Contractor spec/model/API and attendance eligibility | Contractor owner | `OPEN` |
| ROLE-GAP-017 | Visitors, drivers, government teams and rescue personnel are not consistently rostered/mustered | People physically present can disappear during emergency accounting | Attendance and incident spec/model/API | Attendance + incident owners | `OPEN` |

## 5. Lifecycle and handoff gaps

| ID | Gap | Failure if ignored | Canonical destinations | Owner | Status |
|---|---|---|---|---|---|
| ROLE-GAP-009 | Attendance Clerk relief and multi-outlet coverage are absent | An outlet/shift can operate with no accountable custodian and no visible alarm | Attendance spec/model/API | Attendance owner | `OPEN` |
| ROLE-GAP-010 | Internal inspection schemes are collapsed into one origin | Pit Safety Committee, worker, safety department and check-audit powers become identical | Inspection spec/model/API and catalogue | Inspection + safety owners | `OPEN` |
| ROLE-GAP-012 | Authority-specific inspection stages are only prose | Real forwarding, query, approval, signing and return loops cannot be enforced | Inspection and workflow spec/model/API | Inspection + workflow owners | `OPEN` |
| ROLE-GAP-013 | Received-notice authority confirmation is incomplete | An operator-entered authority name can be mistaken for a confirmed regulator act | Identity onboarding and inspection intake | Identity + inspection owners | `OPEN` |
| ROLE-GAP-014 | Team acceptance can be mistaken for visit attendance | Reports can claim participation by people who never arrived | Inspection visit model/API and evidence | Inspection owner | `OPEN` |
| ROLE-GAP-018 | Responsibility routes lack operational health proof | Work can remain stuck behind a vacant post or ignored notification | Workflow and identity operations | Workflow + identity owners | `OPEN` |
| ROLE-GAP-020 | No cross-domain terminal-outcome authority matrix exists | It is unclear who finally accepts, attests, issues, verifies or closes | Product capability map and every feature lifecycle | Product + domain owners | `OPEN` |

## 6. Operability and legacy gaps

| ID | Gap | Failure if ignored | Canonical destinations | Owner | Status |
|---|---|---|---|---|---|
| ROLE-GAP-021 | Legal and authority catalogues lack recurring revalidation | A jurisdiction/designation change silently leaves stale grants active | Identity governance and operations | Legal + identity operations | `OPEN` |
| ROLE-GAP-022 | Legacy data model still contains implementable generic role SQL | An implementation agent may rebuild rejected `person_type`/`INSPECTOR` authority | Legacy model quarantine and repository checks | Architecture owner | `OPEN` |

## 7. Required closure order

```text
ROLE-GAP-001 legal baseline
  → ROLE-GAP-007 attendance accountability
  → ROLE-GAP-002 authority catalogue
  → ROLE-GAP-003 appointment trust
  → role/scope corrections 004–006, 008, 016–017
  → workflow corrections 009–014, 018, 020
  → administrative/operability controls 015, 019, 021–022
```

A gap is not resolved because a role name was added. Closure requires:

1. the real actor and accountable owner are evidenced;
2. the canonical data relationship and lifecycle are changed;
3. affected APIs and projections agree;
4. absence, expiry, conflict and handover are tested; and
5. this register links the verification evidence and changes status.

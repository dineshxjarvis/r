# Strata — Identity and Governance Specification

Read [`../../architecture/identity-authority-model.md`](../../architecture/identity-authority-model.md) for principal, tenant, organisation, appointment, mandate, jurisdiction, and session semantics. This file owns expiry, signatures, audit, purpose logging, and break-glass behaviour.

**Component:** Appointments, approvals, audit, time-travel, regulator access, break-glass, tenancy
**Companion to:** Authorisation Specification (read §0–§3 of that first — this document assumes it)
**Status:** Design spec, ready to build

---

## 0. Read this first

**What this component is:** the Authorisation Specification answers *"may this person do this?"* This one answers the six questions that sit around that decision:

1. Where does the permission come from, and when does it lapse? (§2 Appointments)
2. When the action is an attestation, what makes it legally binding? (§3 Signatures)
3. What record survives the action? (§4 Audit trail)
4. What was true on a date in the past? (§5 Time-travel)
5. When an outsider reads our data, why did they read it? (§6 Regulator access)
6. What happens at 2am when the rules are in the way? (§7 Break-glass)

**What this component is not:** it is not the authorisation engine. It does not define relations, tuples or Check semantics — those live in the Authorisation Specification and are not restated here. This document is the layer that *feeds* that engine (appointments become tuples) and the layer that *records* what it decided.

**The single rule everything else follows:**

> **No authority is permanent, and no exercise of authority is unrecorded.**

Every grant carries an expiry. Every material act carries an actor, a timestamp, and a prior value. A compliance system whose permissions rot silently is a system whose findings cannot be defended.

**Three terms:**

| Term | Meaning |
|---|---|
| **Appointment** | A time-bounded grant of statutory or organisational authority to a named person at a named asset. The source of truth for every permission window. |
| **Attestation** | A signed statement that specific facts were true at a specific moment, under a named appointment. Not the same as clicking Approve. |
| **Material act** | Any action that changes what the system asserts, or that reads a record whose reading is itself significant. Everything material is audited. |

---

## 1. Where this sits

```
  HR / STATUTORY FORMS          THIS COMPONENT                 AUTHORISATION SPEC
                                                                
  Form 2-D, posting order ──► APPOINTMENT ──outbox──► FGA TUPLE ──► Check() ──► ALLOW/DENY
                                   │                                     │
                                   │                                     ▼
                                   │                              THE ACTION HAPPENS
                                   │                                     │
                                   └──────► appointment_ref ────────────┤
                                                                         ▼
                                            AUDIT TRAIL ◄──────── every material act
                                                  │
                                                  ▼
                                         TIME-TRAVEL (§5)
```

The appointment register is upstream of authorisation. The audit trail is downstream of it. Time-travel reads both.

---

## 2. Appointment register

### 2.1 Why this is the spine of the component

The Authorisation Specification requires that **no permission-granting tuple is ever written without a window**. That rule is only enforceable if some table owns the windows. This is that table.

An appointment is not a role assignment. It is a record of a real-world instrument — a Form 2-D under CMR 2017, a posting order, a DGMS regional allocation, a contract engagement — that has a document behind it, a person who issued it, and a date on which it stops being true.

### 2.2 Record

| Field | Purpose |
|---|---|
| `appointment_id` | Stable identifier, quoted in every signed manifest |
| `person_id` | Who holds the authority |
| `post_id` | Concrete organisational or regulatory position |
| `affiliation_id` | Supporting organisation relationship, where required |
| `mode` | `REGULAR`, `ACTING`, or `ADDITIONAL_CHARGE` |
| `valid_from` / `valid_until` | The window. `valid_until` is never null — see §2.4 |
| `source_instrument_document_id` | Appointing instrument; required for authority-bearing appointments |
| `appointed_by_appointment_id` | Authority under which the appointment was made, where applicable |
| `superseded_by` | The renewal or replacement appointment, if any |
| `status` | `ACTIVE`, `LAPSED`, `REVOKED`, `SUPERSEDED` |

`status` is derived from the dates for `ACTIVE`/`LAPSED` and set explicitly for `REVOKED`/`SUPERSEDED`. **Never let a human edit `status` to `ACTIVE` past `valid_until`** — that is the exact failure this whole design exists to prevent.

### 2.3 Sync to the graph

Postgres is the source of truth; the graph is a derived index. Every appointment write enqueues a tuple write in the same transaction, via the outbox pattern specified in the Authorisation Specification §10.2. A crash between the two writes must not leave permissions out of sync, because nothing looks broken when it happens.

`rebuild_tuples.py` regenerates the entire graph from this table. It is both the disaster-recovery path and the test fixture.

### 2.4 Rules

- **`valid_until` is mandatory.** Where the real instrument has no end date, use a far-future sentinel *and* set `review_due` so it surfaces in a report. "Permanent" is how permissions rot.
- **Gaps are legitimate and must be visible.** If one appointment ends 31 March and the successor starts 15 April, nobody holds that authority for fourteen days. That is correct behaviour, and it is also itself a compliance failure — an unmanned statutory post. Raise it as a finding, do not paper over it.
- **Overlap follows the concrete post's holder policy.** A `SINGLE_HOLDER` post rejects overlapping effective intervals transactionally. A `MULTI_HOLDER` post permits them. One person holding appointments at several posts is legal.
- **Revocation does not delete.** A revoked appointment stays queryable, because acts performed under it while it was valid remain valid acts.

---

## 3. Approvals and signatures

### 3.1 The distinction that matters

| Act | Mechanism | Basis |
|---|---|---|
| Statutory submission — EC compliance report, DGMS return, Form 4-A | **Class 3 DSC** on a FIPS-certified hardware token | IT Act §3 |
| Internal approval — CAPA acceptance, review publish, field submission | **Aadhaar eSign** | IT Act §3A; Evidence Act §85A presumption |
| Ordinary login | FIDO2 / passkey | — |

IT Act §5 makes an electronic signature equivalent to a handwritten one **when affixed in the prescribed manner**. That phrase is the entire reason a button labelled "Approve" is not a signature, and why this table has three rows instead of one.

Know the exclusions in the IT Act First Schedule — negotiable instruments, powers of attorney, trusts, wills, conveyance of immovable property. None bite here. A judge may ask whether you know they exist.

### 3.2 What is signed

Not the PDF. The **manifest** — the full specification is in the Document Pipeline Specification §6.2 and is not repeated here. What this component owns is the part of the manifest that comes from the appointment register:

```json
{
  "attested_by":     "user:r_kumar",
  "appointment_ref": "appt:gevra_mgr_2025_26",
  "attested_at":     "2026-06-01T09:14:00Z"
}
```

`appointment_ref` is what makes the signature provable years later. Without it you can show *who* signed; with it you can show they were *entitled* to sign, and under which instrument.

### 3.3 The check at signing time

Signing is an authorisation-critical act, so it is checked at the instant of signing, not at submission time and not in a nightly job:

```
Check(user:r_kumar, can_sign, doc:gev_ec_report_h2)
  → can_sign: manager from at_mine
  → condition valid_appointment [2025-04-01 → 2026-04-01]
  → current_time = 2026-06-01  → condition FAILS
  → DENY
```

**Deny, and say which appointment lapsed and when.** A statutory attestation signed by a person whose appointment had expired is worthless, and worse, it looks like fraud. Catching it at the moment of signing rather than at an inquiry three years later is the whole argument for time-bounded authority.

### 3.4 Prototype path

Demo with a self-signed test certificate and a mock eSign flow. Say so on the slide, and state the production path: a real Class 3 token takes days to have issued, and an ESP integration needs an agreement neither a hackathon nor a pilot will have.

**Do not simulate the signature with an OTP and call it a DSC.** Simulating the *ceremony* is fine; mislabelling the *mechanism* is the kind of thing a judge with a legal background will catch.

---

## 4. Audit trail

### 4.1 What is recorded

Every material act:

- Creation, modification, state transition, approval, closure
- Every deletion **attempt** — successful deletion does not exist, so what is recorded is that someone tried
- Every read of a sensitive record (§6), and every denied read
- Every authorisation decision that resulted in a denial

| Field | Notes |
|---|---|
| `event_id` | Monotonic, gapless within a tenant |
| `at` | Server time, not device time |
| `actor` | `user:` or `system:` — automated acts are audited too |
| `appointment_ref` | The authority under which it was done, where one applies |
| `action` | Verb from a closed vocabulary |
| `object_ref` | What was acted on |
| `before` / `after` | Prior and new value for the changed fields only |
| `reason` | Mandatory for `NOT_APPLICABLE`, `WAIVED`, `REVOKED`, break-glass, and every denial override |
| `purpose` | Mandatory for regulator reads (§6) |
| `source` | IP, device, app version |
| `prev_hash` / `hash` | §4.3 |

### 4.2 Append-only in effect, not by convention

"We don't run UPDATE on that table" is not append-only, it is a promise. Enforce it:

- `REVOKE UPDATE, DELETE` on the audit table for the application role
- Corrections are **new events that supersede**, carrying `supersedes: event_id`. The original stays readable and stays in the chain.
- Retention is a legal question, not a storage one. Coal-mine records outlive the mines; assume 30 years and design partitioning accordingly, not deletion.

### 4.3 Independent verifiability

The problem statement requires the ability to demonstrate that historical records have not been altered, **without depending on the cooperation of the party being audited**. A table an administrator can rewrite does not satisfy that, however good the intentions.

Hash-chain the events:

```
hash(n) = SHA256( hash(n-1) || canonical_json(event(n)) )
```

Then publish the head periodically — daily, and on demand — to somewhere the operator does not control. Options, in ascending order of cost: countersign the head with the platform key and file it with the regulator; anchor it in an external timestamping service; anchor it on a public chain. **Which of these you choose matters far less than the fact that the head leaves the building.** A chain the operator can recompute end to end is a chain the operator can forge end to end.

Verification is then a function anyone can run: recompute the chain, compare to a published head from the period in question.

> **On "blockchain".** The problem statement lists blockchain-based audit trails as a permitted technology. What the requirement actually needs is *externally-anchored tamper evidence*, and a hash chain with a published head delivers that at a fraction of the operational cost. Say this explicitly rather than avoiding the word — it reads as a considered decision, not an omission.

### 4.4 What audit is not

Audit is not an event bus, a debug log, or an analytics stream. Keep it narrow enough that reading it is feasible. A trail nobody can read is a trail nobody checks.

---

## 5. Compliance time-travel

### 5.1 The question

> What was Gevra's compliance state on 10 June 2026, judged by the rules that applied on 10 June 2026?

Answering with today's rules is wrong and worse than useless: it retroactively convicts a mine of breaching an obligation that did not yet exist, or clears it of one since repealed.

### 5.2 What makes it possible

Time-travel is not a feature you build; it is a property you get for free if four other things are already true. All four are specified elsewhere and this section only names the dependency:

| Requirement | Where it is specified |
|---|---|
| Source documents are never modified; supersession creates a new version | Document Pipeline §4 |
| Obligation amendments regenerate future instances only, never past ones | Obligation Register §3.2 |
| Every material act is an append-only event with a timestamp | §4 above |
| Appointments carry windows and are never deleted | §2 above |

If any one of those breaks, time-travel silently returns a plausible wrong answer — which is the most dangerous failure this system can have, because nothing looks broken.

### 5.3 Reconstruction

```
as_of(date) :=
  rule set    = obligation versions where effective_from <= date < effective_to
  instances   = instances whose period covers date, at their state as of date
                (replay audit events up to date; do not read current status)
  evidence    = evidence submitted at or before date
  authority   = appointments valid on date
  result      = evaluate(rule set, instances, evidence)
```

**Replay, do not snapshot.** A nightly snapshot answers only the dates you happened to snapshot, and diverges the moment a backdated correction lands. Replaying the event stream answers any instant, and it is the same mechanism that proves the trail is intact.

Cache aggressively for dates in the closed past — they cannot change once every event before them is chained. Never cache a date inside an open period.

### 5.4 What it is used for

- Answering an inquiry: what did we know, and when
- Testing a signed manifest against the state it attested to
- Showing a regulator the state at the date of their last inspection, not today's
- Detecting backdating: if the state as of a date changes between two reconstructions, an event landed late — legitimate for offline sync, suspicious for anything else. Flag the delta, do not hide it.

---

## 6. Regulator access and purpose logging

### 6.1 The inversion

Every governance system logs what the mine does. This one also logs what the **regulator** does, and that inversion is cheap to build and almost nobody else will offer it.

**Rule:** a regulator read requires a stated purpose from a closed vocabulary, and both the request and the read are logged. Denials are logged too — a repeated denied access is more interesting than a granted one.

```
VALID_PURPOSES = ROUTINE_INSPECTION | ACCIDENT_ENQUIRY | COMPLAINT_FOLLOWUP
               | PERIODIC_RETURN_REVIEW | COURT_OF_INQUIRY
```

The wrapper is specified in the Authorisation Specification §8. What this component adds is what happens to the log afterwards:

- The mine can see who read what about them, and why. Not the regulator's internal reasoning — the purpose code and the object.
- Aggregate patterns are visible: which mines are read most, by whom, under which purpose.
- The regulator's own supervisor can audit their reads.

### 6.2 What a regulator sees

Published state only. Never internal drafts. This is not a courtesy to the operator — it is the adoption argument. **Compliance software that exposes every unfinished internal note to the regulator will not be adopted, and an unadopted system prevents no incidents.** Say that out loud rather than leaving it as an implementation detail.

Personal identities are redacted by default at read time, per the Extraction Specification Addendum A4: a regulator sees the hazard, the corrective action, and the responsible *appointment holder* — not individual workers' names. That default is a deliberate decision and should be logged as one.

---

## 7. Break-glass

### 7.1 When it exists

A serious incident at 2am. The person who needs the ventilation records is not the person whose appointment covers them. The correct answer is not "wait until morning", and it is also not "give everyone standing access in case".

### 7.2 Mechanism

A short-lived, conditioned tuple — the same mechanism as any other grant, with a two-hour window instead of a year:

| Property | Value |
|---|---|
| Duration | 2 hours, hard cap, no extension — a second activation is a second logged event |
| Authoriser | Holder of explicit `break_glass.authorize` capability over the named scope, never self-service |
| Justification | Free text, mandatory, minimum length enforced |
| Scope | Named objects or one mine. Never "all" |
| Notification | Loud and immediate to configured incident-governance posts and security operations |
| Expiry | Automatic. The tuple's condition fails at the boundary; nothing needs to run for access to end |

### 7.3 Rules

- **Every act performed under break-glass is tagged as such in the audit trail**, permanently. Not just the grant — each action.
- **A post-hoc review is mandatory and tracked as an obligation instance.** If break-glass fires and nobody reviews it within the review window, that is itself an overdue item. Otherwise break-glass quietly becomes the normal path.
- **Break-glass never grants closure authority.** Read and record, yes. Closing a SEVERE finding or signing an attestation under emergency access is exactly the abuse this system exists to make impossible.
- Frequency is a metric. A site using break-glass monthly has an appointment-management problem, and the dashboard should say so.

---

## 8. Multi-tenancy and scoping

### 8.1 What "multi-tenant" means here

The problem statement requires that onboarding a new mine or subsidiary be a configuration exercise, not a development one. Concretely:

- A user sees their own scope and, where applicable, everything beneath it. Aggregation upward is automatic.
- Applicable obligations, checklists, hierarchy and escalation rules differ per site, without a separate build per site.
- One deployment serves multiple tenants and their organisation-unit hierarchies.

### 8.2 Two isolation mechanisms, and the reason for both

| Layer | Mechanism | Guards against |
|---|---|---|
| Authorisation | The relationship graph — a user simply has no path to another tenant's objects | Intentional access |
| Data | `tenant_id` on every row, enforced by row-level security, plus a mandatory tenant predicate in the query layer | A bug in the application |

The graph/policy service makes the decision. RLS exists because one forgotten query constraint can leak one tenant's compliance posture to another. Cross-tenant portfolio reads use a controlled authorised-resource set, not an RLS bypass for a title.

### 8.3 Scoping is derived, never enumerated

A dashboard must never issue one Check per row. The pattern, per the Authorisation Specification §10.3:

1. `ListObjects` once for the *mines* the user can see — a small set, cacheable for the request
2. Intersect it with request filters and enforce tenant/resource constraints in PostgreSQL

### 8.4 Onboarding a mine

The configuration surface, and nothing beyond it:

- Tenant, organisation/unit responsibility, then mine → subunit → asset; optional administrative layers are not fabricated
- Applicable obligation set, selected by the applicability rules — not hand-listed
- Appointment records for the statutory posts, which generate the tuples
- Escalation chain, by reference to the hierarchy rather than by naming individuals
- Checklist variants where the site differs

**If onboarding requires a code change, the multi-tenancy requirement has not been met** — that is the acceptance test, not a count of features.

---

## 9. Failure modes

| Failure | Handling |
|---|---|
| Appointment expires mid-session | The next Check denies. Do not cache permission decisions across a session — a cached permission is a security bug |
| Appointment lapses with no successor | Access ends, correctly. Raise a finding: an unmanned statutory post is a compliance failure in itself |
| Outbox worker down; tuples stale | Alert on outbox depth and age. Stale tuples are the one failure that produces *wrong answers* rather than errors |
| Someone edits an appointment's dates retroactively | Permitted only via a superseding record, audited, with the original window preserved. Never a silent update |
| Audit chain breaks (a gap in `prev_hash`) | Alarm immediately, name the range, block signing until resolved. Do not repair the chain — a repaired chain proves nothing |
| Two conflicting statutory appointments at one mine | Postgres constraint rejects. The graph will not stop you writing contradictory tuples, so the constraint must live in the database |
| Break-glass used and never reviewed | Surfaces as an overdue obligation instance, escalating like any other |
| Regulator reads without a purpose code | Denied. The purpose is a required parameter, not an optional annotation |
| Backdated event arrives after a time-travel query was answered | Both answers are retained, the delta is flagged. Legitimate for offline sync; suspicious otherwise |
| Person leaves the company | Revoke authentication; leave the appointment and the tuples. History must stay intact and attributable |
| Signature attempted on a superseded document | Deny. A signature attests to a specific state; a superseded document no longer has that state as current |

---

## 10. Scope

### In

- [ ] Appointment register with mandatory windows, instrument reference, and supersession
- [ ] Outbox sync from appointments to authorisation tuples, plus `rebuild_tuples.py`
- [ ] Gap and overlap detection on statutory posts, surfaced as findings
- [ ] Manifest signing with `appointment_ref`, validity checked at the instant of signing
- [ ] Mock DSC and eSign ceremony, with the production path documented
- [ ] Append-only audit trail with database-enforced immutability
- [ ] Hash chain with periodic externally-published head, plus a verification command
- [ ] Time-travel by event replay, with caching for closed periods
- [ ] Purpose-logged regulator reads, including logged denials, visible to the mine
- [ ] Break-glass: short window, mandatory justification, loud notification, tagged acts, mandatory review
- [ ] Tenant isolation in both the graph and row-level security
- [ ] Mine onboarding by configuration only, demonstrated end to end

### Out — with reasons on the slide

- **Delegation.** Real and common, but a Manager may not be able to delegate a Form 2-D duty at all. Getting that wrong is worse than not offering it. Roadmap, after a legal read.
- **Multi-signature approval chains.** Workflow, not authorisation. Belongs in the workflow engine.
- **Live CSP-integrated eSign.** Requires an ESP agreement and a real Class 3 token; days of procurement, not hours of build.
- **Federated identity across subsidiaries with separate directories.** One deployment, one directory, for now.
- **Long-term signature validation (LTV, timestamp renewal).** A genuine requirement over a 30-year retention. Name it, do not pretend to solve it.
- **Field-level redaction beyond the PII split.** The identity redaction in §6.2 is deliberate; general field-level permissions are overkill here.

---

## 11. Tests

| # | Scenario | Expected |
|---|---|---|
| 1 | Appointment written with no `valid_until` | Rejected at the database layer |
| 2 | Appointment created | Tuple appears in the graph via outbox, within the drain interval |
| 3 | Outbox worker killed, appointment created, worker restarted | Tuple appears; no permission was granted in the interim |
| 4 | `rebuild_tuples.py` on an emptied graph | Every permission decision matches the pre-wipe results |
| 5 | Sign with a valid appointment | ALLOW; manifest records `appointment_ref` |
| 6 | Sign one day after `valid_until` | **DENY**, message names the appointment and the lapse date |
| 7 | Sign a superseded document | DENY |
| 8 | Appointment gap of 14 days between successor postings | Finding raised for an unmanned statutory post |
| 9 | Two `manager` appointments at one mine, overlapping | Rejected by constraint |
| 10 | One manager, two mines, overlapping | Allowed |
| 11 | `UPDATE` attempted on the audit table by the app role | Permission denied by the database |
| 12 | Correction to an audited value | New event with `supersedes`; original still readable |
| 13 | One byte altered in a historical audit row | Chain verification fails and names the range |
| 14 | Time-travel to a date before an obligation amendment | Old rule applied, not the current one |
| 15 | Time-travel to a date before an appointment started | That person had no authority on that date |
| 16 | Backdated offline capture syncs after a time-travel query | Delta flagged, both answers retained |
| 17 | Regulator read with no purpose code | DENY |
| 18 | Regulator read with a purpose code | ALLOW, logged, and visible to the mine |
| 19 | Regulator read denied | **Denial logged**, not silently dropped |
| 20 | Regulator reads an observation naming a worker | Name redacted; hazard and CAPA visible |
| 21 | Break-glass activated | Notifications fire; every subsequent act tagged |
| 22 | Break-glass at 2h + 1 minute | DENY, no extension possible |
| 23 | Break-glass used to close a SEVERE finding | **DENY** — never granted by emergency access |
| 24 | Break-glass never reviewed | Appears as an overdue item and escalates |
| 25 | Report query missing its tenant predicate | Row-level security returns zero rows, not another tenant's |
| 26 | New mine onboarded | Zero code changes; obligations materialise from applicability rules |

**Tests 6, 13, 19 and 23 are the ones a judge will probe.** Have them running live, not in a screenshot.

---

## 12. Three sentences for the jury

> **One.** Authority in this system has an expiry date because the real instrument behind it does — the appointment register holds the window from the Form 2-D, and the moment it lapses the system stops accepting that person's signature, which is a thing that currently gets caught at an inquiry three years later or not at all.

> **Two.** Our audit trail is hash-chained and its head is published outside the operator's control, so proving a record was not altered does not depend on the cooperation of the party being audited — which is the only version of that guarantee that is worth anything.

> **Three.** We log the regulator's reads as carefully as the mine's writes: every access carries a stated purpose, denials are logged too, and the mine can see who looked at what and why — accountability that points in both directions is what makes an operator willing to put real data in the system at all.

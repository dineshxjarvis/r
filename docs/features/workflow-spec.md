# Strata — BF-8 Directory, Delivery and Workflow Specification

**Component:** Who the people are, how a fact reaches them, and what they do about it
**Companion to:** Authorisation Spec · Identity and Governance Spec · Obligation Register Spec · Defect Ledger Spec
**Status:** Design spec, ready to build

---

## 0. Read this first

**What this component is:** every other component produces facts. This one is the only one that moves a fact to a person and records whether they received it.

**Why it is the most load-bearing component in the system:** an obligation that goes overdue in silence, an escalation that fires into nothing, a risk alert rendered on a screen nobody opened — these are the current paper failure, reproduced with better fonts. `docs/context/problem-statement.md` §3.1 names **latency** as one of the two things that must be fixed, and latency is delivery.

**The single rule everything else follows:**

> **Rules address a post, never a person.**

Not "notify R. Kumar." **"Notify the Manager of Gevra OCP"**, resolved to whoever currently holds that appointment, at the moment of sending. Everything good about this component follows from that one decision: transfers do not break escalation chains, an unmanned post is detectable rather than silent, and no configuration anywhere contains a human name.

**Three terms:**

| Term | Meaning |
|---|---|
| **Post** | A role at an asset: `manager of mine:gevra_ocp`. Addressable. Held by zero or one person at a time |
| **Recipient resolution** | Turning a post into the person to actually contact, at send time |
| **Acknowledgement** | The recipient confirming receipt. Distinct from delivery, and distinct from action |

---

## 1. The directory

### 1.1 One person record, no role table

A person is one row. Their roles are **not** stored on it — roles come entirely from the appointment register (Identity Spec §2), which already owns the windows and already syncs to the authorisation graph.

This is why there is no role table anywhere in this system. A "Safety Officer" is not a type of user; it is someone currently holding a `safety_officer` appointment at a named mine.

| Field | Notes |
|---|---|
| `person_id` | |
| `name`, `employee_ref` | |
| `contact` | Phone, email, preferred language — see §1.4 |
| `org` | Own organisation, or a `contractor_org` |
| `account_status` | `ACTIVE`, `SUSPENDED`, `DEPARTED` |

`DEPARTED` revokes authentication and leaves every appointment and tuple intact, per Identity Spec §11. History stays attributable.

### 1.2 Who gets an account — and who does not

The user population in the PS spans five groups and roughly twenty role labels. Taken literally that is hundreds of thousands of people, most of whom will never open the app. So:

| Group | Accounts? |
|---|---|
| Assigned inspectors and field workers performing field capture/work | **Yes.** Planned mobile app and web where applicable |
| Mine management — manager, project officer, safety and operations management | **Web.** Dedicated mobile pages are `TBD` |
| Contractor management/workers outside assigned field-work capture | **Web.** Dedicated mobile pages are `TBD` |
| Applicants, grievance handlers, corporate users and non-field regulators | **Web.** Dedicated mobile pages are `TBD` |
| Corporate — CIL officials, subsidiary and senior management, compliance teams | **Yes.** Web |
| Government, regulatory and inspection authorities | **Yes.** Purpose-logged monitoring view; participating-authority actions only when capability, mandate and jurisdiction allow |
| Contractor administrators and supervisors | **Yes.** Scoped to their own engagements |
| **Contractor workforce** | **No.** They are *subjects* of records, not users |

**That last row is the decision that makes the system tractable.** A contract worker appears in the attendance register, in a training-validity record, and possibly in an incident record. None of that requires them to hold an account. Their supervisor acts on their behalf, and the record about them is captured by someone who does have one.

This cuts the account population from lakhs to roughly the number of people who will actually log in — and it is also the correct privacy posture, because it means no worker is required to carry a device to be paid.

### 1.3 Onboarding

Onboarding a person is an appointment, not a signup. There is no self-registration.

```
platform admin or subsidiary admin
  → creates person record
  → creates appointment (post, asset, window, instrument reference)
  → outbox writes the tuple
  → invitation sent on the person's stated channel
```

**No account exists without at least one appointment**, because an account with no appointment can see nothing and is indistinguishable from an attack surface.

### 1.4 Language is a person attribute

Preferred language sits on the person record and drives every outbound message and every UI surface. `docs/context/problem-statement.md` §3.4 requires the field app be usable by someone who does not read English; a notification in English defeats that at the first hop.

**Default to the site's regional language, not to English.** Content is templated with the variable parts separated, so a message translates without a translator needing to see mine data.

---

## 2. Recipient resolution

### 2.1 The resolution chain

Given a post, produce a person — or fail loudly:

```
resolve(post) :=
  1. current holder of the appointment          → send
  2. no holder, and a delegate is registered    → delegate, marked "on behalf of an unmanned post"
  3. no holder, no delegate                     → escalate one level up the hierarchy
                                                  AND raise an unmanned-post finding
```

Step 3 is the one that matters. Identity Spec §2.4 already treats an appointment gap as a compliance failure in its own right. This component is where that becomes visible: a message that cannot be delivered because nobody holds the post does not disappear — it goes upward and it creates a record.

### 2.2 Delegation — receipt, never authority

`rbac-spec` §12 puts delegation out of scope, correctly: a Manager may not be able to delegate a Form 2-D duty at all. That constraint is about **authority**. It does not prevent delegating **receipt**.

| Delegable | Not delegable |
|---|---|
| Receiving notifications while on leave | Closure authority |
| Being shown another person's task list, read-only | Signing an attestation |
| Acknowledging on someone's behalf, recorded as such | Any Check outcome |

A delegate never gains a permission. They gain visibility and the ability to say "seen, and the holder is away." The delegation is time-bounded, recorded, and appears on every message it causes.

---

## 3. Channels

### 3.1 The set, and why each is here

| Channel | Use | Reality it serves |
|---|---|---|
| **In-app** | Every notification, always | The permanent record. Nothing exists only on another channel |
| **Push** | Planned inspector/field-worker mobile users | Free, immediate, requires data; other-role push is `TBD` |
| **SMS** | Severe items, and fallback when push is unacknowledged | **Mine sites frequently have voice and SMS coverage where data fails.** This is the channel that actually works at a pit |
| **Email** | Management, regulators, digests, generated reports | Where corporate actually reads |

Out: WhatsApp and any other channel needing a commercial API agreement. Name it as a production integration and move on.

### 3.2 In-app is the source of truth

Every other channel is a **pointer** to the in-app item, never the payload. Three reasons: an SMS cannot carry evidence, a push notification is not auditable, and a message that contains the finding rather than a link to it has just leaked mine data to an unauthenticated inbox.

### 3.3 Severity picks the channel

```
MINOR         → in-app, included in the daily digest
SIGNIFICANT   → in-app + push, immediate
SEVERE        → in-app + push + SMS, immediate, acknowledgement required
REGULATOR-RAISED → as SEVERE, plus the subsidiary compliance post
```

---

## 4. Delivery is a record, not a fire-and-forget

Every notification is a stored object with a lifecycle:

```
QUEUED → SENT → DELIVERED → ACKNOWLEDGED → ACTIONED
            │        │
            └──► FAILED (retry, then fall back to the next channel)
```

| State | Means |
|---|---|
| `SENT` | Handed to the transport |
| `DELIVERED` | Transport confirmed. Best-effort on SMS, reliable in-app |
| `ACKNOWLEDGED` | The human said they saw it |
| `ACTIONED` | The underlying item changed state |

**Acknowledgement is required for `SEVERE` and for anything authority-issued.** Unacknowledged after a bounded window is itself an escalation condition — which means "I never got the message" stops being a defence, and also means a genuinely broken channel surfaces instead of hiding.

**Never mark something delivered because it was sent.** The distinction between those two words is the entire difference between this component working and appearing to work.

---

## 5. Volume control — the failure mode the PS names explicitly

`docs/context/problem-statement.md` §4.10 lists three prohibited outcomes: alerts with no stated reason, alerts routed to nobody, and **alert volume high enough to be ignored**. The third kills the other two, because a person who has learned to dismiss notifications dismisses the important one too.

Four mechanisms, all mandatory:

- **Digest by default, interrupt by exception.** `MINOR` items never interrupt. One daily digest per recipient, in their language, at a time they set.
- **Per-recipient budget.** A ceiling on interrupts per day. Exceeding it collapses the remainder into a digest and **raises an operational flag** — a person receiving thirty interrupts a day is a routing bug, not a busy person.
- **Coalescing.** Twelve instances of one obligation going overdue at one mine is one message naming twelve, not twelve messages.
- **Bulk-import suppression.** Seeding four hundred historical observations must not page anyone. Imports are marked, and marked imports never generate interrupts — only a summary.

Every one of these is a *visible* suppression. Nothing is silently dropped; suppressed items are in the digest and in the in-app list.

---

## 6. Reminders and escalation

The **conditions** live where the domain lives — Obligation Register Spec §6 and Defect Ledger Spec §9. This component owns only the mechanics, and does not restate them.

### 6.1 Reminders fire before deadlines

`docs/context/problem-statement.md` §4.12 asks for reminders ahead of deadlines, not only after. Lead time scales with severity and with the effort the obligation actually takes — a six-monthly compliance report needs more warning than a NIL return.

A reminder that arrives with no time left to act is not a reminder; it is a notification of failure.

### 6.2 Escalation adds recipients

Escalation **never transfers ownership**. The assignee stays responsible and stays on every message. Otherwise escalation becomes a mechanism for shedding accountability upward, which is the opposite of the intent.

Every escalation message carries: the condition that fired it, the underlying record, how long it has been open, and what the recipient can do. `docs/context/problem-statement.md` §4.10 forbids alerts with no stated reason — this is where that rule is enforced in practice.

### 6.3 Chains come from the graph

The chain is derived from the asset hierarchy, never configured as a list of names. Reparent an area and every chain beneath it re-derives with no configuration change — which is the same property that makes onboarding a mine a configuration exercise.

---

## 7. Approvals

An approval is a workflow object, not a status field:

| Field | Notes |
|---|---|
| `subject_ref` | What is being approved |
| `required_post` | The post that must approve, resolved at request time |
| `decision` | `APPROVED`, `REJECTED`, `RETURNED` |
| `decided_by`, `decided_at` | The actual person, and when |
| `appointment_ref` | The authority they held while deciding |
| `reason` | Mandatory on `REJECTED` and `RETURNED` |
| `signature_ref` | Present where the act is statutory — Identity Spec §3 |

Rules:

- **The authorisation Check happens at decision time, not at request time.** An appointment can lapse between the two, and a decision taken without authority is worse than no decision.
- **A returned item goes back to the requester with a reason**, not into a void.
- **An approval pending beyond its window escalates** like anything else.
- Multi-signature chains stay out of scope, per `rbac-spec` §12. One approver per approval; sequence them if two are genuinely needed.

---

## 8. Failure modes

| Failure | Handling |
|---|---|
| Post has no current holder | Escalate up **and** raise an unmanned-post finding. Never drop |
| Person departs mid-escalation | Resolution is at send time, so the successor receives it. No stale chain |
| Push token stale, device replaced | Delivery fails, falls back to SMS, and flags the stale token |
| No data coverage at the site | SMS carries the pointer; the item waits in-app for the next sync |
| SMS gateway down | In-app record still exists. Failure is visible, not silent |
| Recipient never acknowledges a `SEVERE` | Escalation condition fires on the acknowledgement gap itself |
| Bulk import of historical records | Marked as import; summary only; zero interrupts |
| Same fact triggers three rules | Coalesced into one message listing three reasons |
| Recipient exceeds their interrupt budget | Remainder digested, operational flag raised |
| Notification content would leak data to an unauthorised inbox | Other channels carry pointers only; the payload lives behind auth |
| Delegate acts while the holder is away | Recorded as "on behalf of", no permission gained |
| Approval requested from a post that lapses before decision | Check at decision time denies; the request re-resolves to the successor |

---

## 9. Scope

### In

- [ ] Person directory with contact and language; roles derived from appointments only
- [ ] Account population per §1.2 — contractor workforce as subjects, not users
- [ ] Onboarding by appointment; no self-registration; no account without an appointment
- [ ] Post-based addressing with send-time recipient resolution
- [ ] Unmanned-post escalation and finding
- [ ] Delegation of receipt, time-bounded and recorded; never of authority
- [ ] Four channels, in-app authoritative, others carry pointers
- [ ] Severity-to-channel routing
- [ ] Notification lifecycle with delivery and acknowledgement tracked separately
- [ ] Acknowledgement requirement on `SEVERE` and authority-issued items, with a gap condition
- [ ] Digest, budget, coalescing, import suppression — all visible, none silent
- [ ] Pre-deadline reminders with severity-scaled lead time
- [ ] Escalation mechanics driven by conditions owned elsewhere
- [ ] Approval objects with Check at decision time and mandatory reasons
- [ ] Multilingual message templates with data separated from copy

### Out — with reasons on the slide

- **WhatsApp and other commercial messaging APIs.** Real in India, needs a Business API agreement. Production integration.
- **Voice calls and IVR.** The right answer for a `SEVERE` at 2am in a low-literacy context. Costed, not built.
- **Multi-signature approval chains.** `rbac-spec` §12 excludes them; sequencing two single approvals covers the realistic case.
- **Per-user notification preference matrices.** Severity decides the channel. A user who can mute `SEVERE` alerts is a liability, not a preference.
- **Delegation of authority.** Statutorily doubtful. Receipt only.
- **Read receipts as proof of action.** Acknowledged is not actioned, and conflating them is the failure this whole component exists to avoid.

---

## 10. Tests

| # | Scenario | Expected |
|---|---|---|
| 1 | Rule addresses `manager of mine:gevra_ocp` | Resolves to the current holder at send time |
| 2 | Holder transfers out; successor appointed | Next message reaches the successor, no configuration change |
| 3 | Post is unmanned | Escalates upward **and** raises an unmanned-post finding |
| 4 | Delegate registered during leave | Receives, marked "on behalf of", gains no permission |
| 5 | Delegate attempts to close a finding | **DENY** — receipt is not authority |
| 6 | `MINOR` overdue | Digest only, no interrupt |
| 7 | `SEVERE` raised | In-app, push and SMS, immediate, acknowledgement required |
| 8 | `SEVERE` unacknowledged past the window | Escalation fires on the acknowledgement gap |
| 9 | Push fails | Falls back to SMS; stale token flagged |
| 10 | SMS gateway down | In-app record exists; failure visible |
| 11 | Twelve instances of one obligation go overdue together | **One** message naming twelve |
| 12 | 400 historical observations imported | Summary only; zero interrupts |
| 13 | Recipient exceeds interrupt budget | Remainder digested; operational flag raised |
| 14 | SMS content inspected | Pointer only. **No finding detail in the message body** |
| 15 | Recipient's language is not English | Message rendered in their language |
| 16 | Approval requested; approver's appointment lapses before they decide | DENY at decision time; re-resolves to the successor |
| 17 | Approval returned | Goes back to the requester with a mandatory reason |
| 18 | Contract worker referenced in an attendance record | Appears as a subject. **No account created** |
| 19 | Account created with no appointment | Rejected |
| 20 | Every escalation message | Carries the firing condition, the record, the age, and the available action |

**Tests 3, 8, 11 and 14 are the ones a judge will probe.**

---

## 11. Three sentences for the jury

> **One.** No rule in this system names a person — escalation addresses the Manager *of Gevra OCP*, resolved to whoever holds that appointment at the instant of sending, so a transfer never breaks a chain and a post nobody holds raises a finding instead of quietly swallowing the message.

> **Two.** We track delivery and acknowledgement as separate facts, because "it was sent" is not "they saw it", and for a severe finding the gap between those two is itself an escalation condition.

> **Three.** Alert fatigue is the failure mode that kills compliance dashboards, so minor items are digested, repeated triggers are collapsed into one message, and every suppression is visible — nothing is ever silently dropped, and a person receiving thirty interrupts a day is treated as a routing bug rather than a busy colleague.

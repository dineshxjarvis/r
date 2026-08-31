# Strata — Role → End-User → Complete UI Kit
## AI-Based Smart Governance & Compliance Monitoring System for Coal Mines
### SIH 26024 · Ministry of Coal / Coal India Limited

This document restructures the Strata UI design around the way it will actually be reviewed and built: **one primary role → each individual end-user inside that role → that end-user's complete, self-contained UI kit (sidebar, Dashboard, every screen, every component, every click, every endpoint) → next end-user → next role.**

Per the problem statement there are five stakeholder groups (Field-level, Mine Management, Corporate Management, Regulatory, Contractors). This document gives **full depth to the four majorly-used roles** — Field-level users, Mine Management, Corporate Management, Regulatory users — because these are the roles that drive daily platform usage and the core novelty pillars. Contractors are covered as a lighter secondary role in Section 5, since they are a narrower, self-service workspace.

Every end-user gets an explicit **Dashboard** screen (this was missing for several sub-roles in the earlier draft — it is now filled in for all of them), followed by their remaining screens, in the same level of detail.

---

## How to read each entry

For every screen you will find:

1. **Route** — the frontend path.
2. **Primary endpoint** — the call that loads the screen.
3. **Layout** — an ASCII wireframe of what's on screen.
4. **Components on this screen** — every distinct UI element, what data feeds it, and where that data comes from.
5. **Interactions** — a table: *Element clicked → what happens → API call fired → screen/response the user lands on.*
6. **All endpoints touched by this screen.**

> **On endpoint accuracy:** every endpoint in this version has been checked against the real spec files in `docs/api-specs/endpoints/` (the 39-file directory you listed) — not guessed from domain names. Two patterns worth knowing since they're abbreviated everywhere below for readability:
> - **File uploads are two-step everywhere** (documents and evidence alike): `POST /uploads {purpose:"DOCUMENT_ORIGINAL"|"EVIDENCE_CAPTURE"}` returns a presigned `upload_url`, the client PUTs the bytes directly to blob storage, then the record is registered (`POST /documents`, or `POST /evidence/sync` for evidence). Screens below show only the registration call for brevity.
> - **A few UI capabilities have no backing endpoint yet** — AI clause-suggestion while typing an observation, and recurring report scheduling. These are marked *(no documented endpoint)* at the relevant screen rather than invented.

---

## Login & Workspace Routing

One login screen serves all 5 roles / 14 end-users. It never asks "which role are you" — it authenticates the **person**, then resolves their **active appointments** (Novelty Pillar 3: authority comes from time-bounded appointments, not a role picked at login) and routes accordingly.

### Screen 0a — Login
**Route:** `/login` · **Endpoint:** `POST /auth/sessions`

```
┌──────────────────────────────────────────────┐
│                                                │
│                  ◉ STRATA                    │
│     Smart Governance & Compliance Platform    │
│                                                │
│   Employee ID / Email                         │
│   ┌──────────────────────────────────────┐   │
│   │                                        │   │
│   └──────────────────────────────────────┘   │
│   Password                                     │
│   ┌──────────────────────────────────────┐   │
│   │                                        │   │
│   └──────────────────────────────────────┘   │
│                                                │
│   [ Sign In ]                                 │
│                                                │
│   ── or ──                                    │
│   [ Sign in with DSC / eSign ]                │
│                                                │
│   Forgot password?          Language: EN ▾   │
│                                                │
└──────────────────────────────────────────────┘
```

**Components:**
- ID/Email field, Password field — plain text inputs, inline validation.
- [Sign In] — primary button, disabled until both fields non-empty.
- [Sign in with DSC / eSign] — secondary auth path for regulatory authorities and senior officials who use digital signature certificates instead of passwords.
- Forgot-password link, language selector (EN/Hindi) — cosmetic, no role logic.
- No role or workspace selector on this screen — deliberately. Role is never self-declared at login.

**Interactions:**

| Element | Click behavior | API | Result |
|---|---|---|---|
| [Sign In] | Submits credentials | `POST /auth/sessions {identifier, password}` | Returns a session token **and** the person's list of active appointments (`GET /appointments?filter[person_id]=me&filter[status]=ACTIVE` bundled in the response) |
| [Sign in with DSC / eSign] | Opens certificate picker (browser/OS native) | `POST /auth/sessions {certificate}` | Same as above |
| Forgot password? | Opens reset flow | `POST /auth/password-resets` | Reset-link-sent confirmation |
| Wrong credentials | — | `POST /auth/sessions` → 401 | Inline error: "Incorrect ID or password." Field-level, no hint about which field is wrong (security) |
| Account locked | — | 423 response | Inline error: "This account is locked. Contact your administrator." |

### Routing logic after successful login

```
POST /auth/sessions succeeds
        │
        ▼
Fetch active appointments for this person
        │
   ┌────┴─────┬──────────────┐
   0 active   1 active     2+ active
   │           │              │
   ▼           ▼              ▼
No-Access   Auto-route     Screen 0b
 Screen    to that role's  Workspace
           dashboard        Picker
```

- **0 active appointments** → **No-Access screen**: "You don't currently hold an active appointment. Contact your mine's administrator." No sidebar, no data — this is a dead end by design (an unappointed login must never silently fall back to a default role).
- **1 active appointment** → skips the picker entirely and routes straight to that appointment's Dashboard (table below).
- **2+ active appointments** (e.g. a Mine Manager who is also a DGMS-nominated internal auditor, or someone holding posts at two mines) → **Screen 0b, Workspace Picker**.

### Screen 0b — Workspace Picker
**Route:** `/workspace-select` · **Endpoint:** (uses the appointment list already returned by `POST /auth/sessions`)

```
┌────────────────────────────────────────────────────────┐
│  Welcome back, A. Sinha                                 │
│  You hold more than one active appointment.             │
│  Select a workspace to continue.                         │
│                                                            │
│  ┌────────────────────────────────────────────────┐    │
│  │ Mine Manager                                     │    │
│  │ Gevra OCP · SECL                                 │    │
│  │ Valid: 01 Apr 2024 – 01 Apr 2029                │    │
│  │                                    [Enter →]      │    │
│  └────────────────────────────────────────────────┘    │
│  ┌────────────────────────────────────────────────┐    │
│  │ Internal Auditor (Safety)                        │    │
│  │ Korba Area (all mines) · SECL                    │    │
│  │ Valid: 01 Jun 2026 – 31 May 2027 · expires soon  │    │
│  │                                    [Enter →]      │    │
│  └────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────┘
```

**Components:** one card per active appointment — post title, mine/org-unit scope, validity window (amber if expiring within 30 days), [Enter →].

**Interactions:**

| Element | Click behavior | API | Lands on |
|---|---|---|---|
| [Enter →] | Sets that appointment as the session's active context | `PATCH /auth/sessions/me {active_appointment_id}` | That appointment's role-specific Dashboard (table below) |
| Top-bar workspace switcher (post-login, always available in the user avatar menu) | Re-opens this same picker without logging out | — | Screen 0b again |

### Appointment → Role → Dashboard resolution table

The router never asks the person which role they are — it reads `appointment.post.category` and routes automatically:

| `post.category` (from the appointment) | Role | End-user | Routes to |
|---|---|---|---|
| Mine Inspector / Field Officer | Field-Level | Inspector | `/field/dashboard` |
| Safety Officer | Field-Level | Safety-Officer | `/field/dashboard` (safety-scoped) |
| Environmental Officer | Field-Level | Environmental-Officer | `/field/environment` |
| Labour/HR Officer | Field-Level | Labour/HR-Officer | `/field/attendance` |
| Engineer / Supervisor | Field-Level | Engineer/Supervisor | `/field/assets` |
| Mine Manager | Mine-Management | Mine-Manager | `/mine/dashboard` |
| Safety Management post | Mine-Management | Safety-Management | `/mine/dashboard` (safety-scoped) |
| Operations Management post | Mine-Management | Operations-Management | `/mine/dashboard` (production-scoped) |
| CIL Official / Subsidiary Senior Mgmt | Corporate | CIL-Official | `/corporate/dashboard` |
| Compliance Team post | Corporate | Compliance-Team | `/corporate/dashboard` (compliance-review view) |
| DGMS Inspector / DDMS | Regulatory | DGMS-Inspector | `/regulatory/dashboard` |
| MoEFCC / CPCB Officer | Regulatory | MoEFCC-Officer | `/regulatory/dashboard` (environment-scoped) |
| Contractor Administrator | Contractors | Contractor-Admin | `/contractor/dashboard` |
| Contractor Supervisor | Contractors | Contractor-Supervisor | `/contractor/dashboard` |

If a post category doesn't map to any row above (a data/config gap), the router falls back to the **No-Access screen** rather than guessing a role — never silently defaults to the most-privileged match.

### Other login-adjacent states

| State | Screen shown | Trigger |
|---|---|---|
| Session expired mid-use | Redirect to `/login` with a "Your session expired, please sign in again" banner; on success, returns to the page they were on | Any API call returns 401 with an expired-session code |
| Appointment expires while logged in | Authority Banner (global) turns red; on next navigation, blocked actions show "Your appointment expired on {date} — contact your administrator to renew" instead of executing | `appointment.end_date` passes while session is open |
| First-time login | Forced password-change screen before anything else loads | `POST /auth/sessions` response flag `must_reset_password:true` |
| First-time login as a regulator (DSC-based) | Skips password screens entirely; goes straight to jurisdiction confirmation, then Screen 0b/Dashboard | DSC auth path |

---


**Top bar** — present on every workspace, all roles:

```
┌──────────────────────────────────────────────────────────────────────┐
│ [≡ STRATA]  [Mine/Scope: Gevra OCP ▼]  [Period: FY 2026-27 ▼] [🔔3][👤]│
└──────────────────────────────────────────────────────────────────────┘
```

| Component | Data source | Click behavior |
|---|---|---|
| Strata wordmark | static | → navigates to that role's Dashboard |
| Mine/Scope selector | `GET /mines` (clipped to authorised set for the logged-in appointment) | Opens dropdown of authorised mines/scopes → selecting one refreshes every widget on the current screen with that scope |
| Period selector | static FY list, drives all measures | Changing it re-fires the current screen's dashboard/list query with `period=` param |
| Notification bell | `GET /notifications?filter[unacknowledged]=true` (badge = count) | Opens the Notification Drawer (below) |
| User avatar | `GET /users/me` | Opens dropdown: Profile · Sessions · Language (`PATCH /users/me`) · Sign out (`DELETE /auth/sessions`) |

**Notification Drawer** (all roles):

```
┌─────────────────────────────────────┐
│ Notifications          [Mark all ✓] │
├─────────────────────────────────────┤
│ 🔴 SEVERE — Ack by 31 Aug           │
│ Finding #DG-2847 awaiting your ack  │
│ [Acknowledge]          [View]       │
├─────────────────────────────────────┤
│ 🟡 SIGNIFICANT — Due in 14 days     │
│ [View obligation]                   │
├─────────────────────────────────────┤
│ 🔵 INFO — Inspection assigned       │
│ [View inspection]                   │
└─────────────────────────────────────┘
```

| Element | Click behavior | API |
|---|---|---|
| Row (any) | Navigates to the underlying record (obligation, finding, inspection) | `GET` on that resource |
| [Acknowledge] | Marks item read/actioned in place, badge count decrements | `POST /notifications/{id}/actions {action:"ACKNOWLEDGE"}` |
| [Mark all ✓] | Clears the unread badge | `POST /notifications/actions` (bulk) |

**Persistent Authority Banner** (field + mine-management roles): shows active appointment, post title, mine, and expiry. Turns **yellow** inside 30 days of expiry, **red** if expired, and links to `GET /appointments/{id}`. This banner is the visible face of Novelty Pillar 3 (Governance-Aware Authorisation) — every screen a user sees is scoped to a time-bounded appointment, not a static role.

**Login screen** (`POST /auth/sessions`): Employee ID/email + password, or DSC/eSign. Server returns active appointments; if the person holds more than one, a **workspace picker** is shown before routing to the role-specific dashboard below.

---

# PART A — THE FOUR MAJOR ROLES

# Role 1 — Field-Level Users

**Who is in this role (5 end-users):** Mine/Field Inspector, Safety Officer, Environmental Officer, Labour/HR Officer, Engineer/Supervisor.

**Shared sidebar shell** (each end-user's kit below shows which items are theirs; items in *italics* are domain-specific and only appear for that end-user):

```
┌─────────────────────────┐
│ ◉ <Name>                │
│ <Post title>             │
│ <Mine>                   │
│ Appt: <start–end>        │
├─────────────────────────┤
│ 🏠 Dashboard (My Queue) │
│ 🔍 Inspections          │
│ ⚠  Defects & Findings   │
│ 📋 Obligations          │
│ 🗂 Evidence              │
│ 🗺 GIS Map               │
│ 📄 Documents             │
│ 🔔 Notifications         │
└─────────────────────────┘
```

---

## 1.1 End-User: Field / Mine Inspector

**Primary job:** conducts inspections, records observations, attaches geo-tagged evidence, raises defects/findings.

### Screen 1 — Dashboard ("My Queue")
**Route:** `/field/dashboard` · **Primary endpoint:** `GET /dashboard?view=personal_queue`

```
┌────────────────────────────────────────────────────────────────────┐
│ My Queue · Gevra OCP · Monday, 31 Aug 2026                        │
│                                    [4 Actionable]  [0 Overdue]    │
├──────────┬─────────────────────────────────────────────────────────┤
│ DUE TODAY│ [1]                                              [↗ All]│
│          │ 🟡 Plantation over 40 hectares — Due today · SIGNIFICANT│
│          │    Gevra OCP   [Submit Evidence →]                     │
├──────────┼─────────────────────────────────────────────────────────┤
│ VERIFY   │ [1]                                              [↗ All]│
│          │ 🔴 Reinstate 40m berm, east haul road — SEVERE          │
│          │    Requires: finding.close_severe   [Verify →]         │
├──────────┼─────────────────────────────────────────────────────────┤
│ APPROVALS│ [0]  Nothing awaiting your approval                     │
├──────────┼─────────────────────────────────────────────────────────┤
│ UNREAD   │ [2]                                              [↗ All]│
│          │ • Plantation obligation due in 14 days   [Ack]          │
│          │ • DGMS inspection assigned — INS-2024-0891 [Ack]        │
└──────────┴─────────────────────────────────────────────────────────┘
```

**Components:**
- Header strip — mine name, date, two counters (`actionable_count`, `overdue_count` from the response envelope).
- 4 queue lanes (Due Today / Verify / Approvals / Unread) — each a card list, sourced from the same `personal_queue` payload, sectioned server-side.
- Each queue card — title, obligation/finding/CAPA type badge, severity colour, mine, one primary action button.

**Interactions:**

| Element | Click behavior | API | Lands on |
|---|---|---|---|
| Queue card body | Opens the underlying record | `GET` on that resource type | Screen 6 (Finding Detail) / Screen 7 (Obligation list item) |
| [Submit Evidence →] | Opens capture flow | — | Screen 4 (Record Observation) or Screen 8 pattern |
| [Verify →] | Opens CAPA verification | `GET /capas/{id}` | CAPA verification modal |
| [Ack] | Acknowledges in place | `POST /notifications/{id}/actions {action:"ACKNOWLEDGE"}` | stays on Dashboard, badge decrements |
| [↗ All] (per lane) | Expands to full filtered list | `GET /obligation-instances` / `GET /capas` with lane filter | Screen 5 or Screen 7 |

---

### Screen 2 — Inspections List
**Route:** `/field/inspections` · **Endpoint:** `GET /inspections?filter[mine_id]=…&filter[assigned_to_me]=true`

```
┌──────────────────────────────────────────────────────────────────┐
│ Inspections                   [+ Request Inspection]  [Filter ▼] │
│ Filter: [Mine: Gevra OCP] [Status: Active] [Origin: All]        │
├──────────────────────────────────────────────────────────────────┤
│ INS-2024-0891   REGULATORY · IN_PROGRESS                          │
│ DGMS Safety Inspection · 14 Aug 2026 · Bench 7N, Section 3       │
│ [3 observations] [1 finding]                    [Continue →]     │
├──────────────────────────────────────────────────────────────────┤
│ INS-2024-0876   INTERNAL · SCHEDULED · 07 Sep 2026               │
│ Assigned: You + 2 others                        [View details →] │
├──────────────────────────────────────────────────────────────────┤
│ INS-2024-0855   INTERNAL · REPORT_ISSUED · 15 Jul 2026           │
│                                                  [View report →]  │
└──────────────────────────────────────────────────────────────────┘
```

**Components:** filter bar (mine/status/origin selects), row card per inspection (id, origin badge, state badge, date, location, observation/finding counters, CTA button).

**Interactions:**

| Element | Click behavior | API | Lands on |
|---|---|---|---|
| [+ Request Inspection] | Opens request form | `POST /inspection-requests` | Confirmation toast, row appears as SCHEDULED |
| Row / [Continue →] / [View details →] | Opens full record | `GET /inspections/{id}?expand=visits,assignment,report` | Screen 3 |
| Filter changes | Re-queries list | `GET /inspections` with new filter params | same screen, refreshed |

---

### Screen 3 — Inspection Detail & Conduct
**Route:** `/field/inspections/{id}` · **Endpoint:** `GET /inspections/{id}?expand=visits,assignment,report`

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Back    INS-2024-0891 · DGMS Safety Inspection               │
│           🟡 IN PROGRESS · REGULATORY                           │
├─────────────────────────┬────────────────────────────────────────┤
│ DETAILS                 │ VISITS                                 │
│ Mine, Authority,         │ Visit 1 · 14 Aug · COMPLETED           │
│ Inspector, Scheduled,    │ [12 responses][3 observations]         │
│ Type, Regulation scope   │ [View] [Add Observation]               │
│                          │ [+ Add Visit]                          │
│ TEAM                     │                                        │
│ Lead / Member roster     │ FINDINGS FROM THIS INSPECTION           │
│ [Accept/Decline]         │ 🔴 DG-2847 · SEVERE — Ventilation      │
│                          │ Reg. 103(1) · Bench 7N-S3 [View Finding]│
│ CHECKLIST PROGRESS       │                                        │
│ ████████░░ 12/15 done    │                                        │
│ [Open Checklist →]       │                                        │
│                          │                                        │
│ ACTIONS                  │                                        │
│ [Record Observation]     │                                        │
│ [Close Visit]            │                                        │
│ [Prepare Report]         │                                        │
└─────────────────────────┴────────────────────────────────────────┘
```

**Components:** details panel, team roster w/ accept-decline, checklist progress bar, visit-card list, finding-card list, action button rail.

**Interactions:**

| Element | Click behavior | API | Lands on |
|---|---|---|---|
| [Accept/Decline] | Confirms/declines team assignment | `POST /inspection-assignment-members/{id}/actions {action:"ACCEPT"}` | banner updates on same screen |
| [Add Observation] (per visit) | Opens capture form | `POST /inspection-visits/{visit_id}/actions {action:"RECORD_OBSERVATION"}` | Screen 4 |
| [View Finding] | Opens finding record | `GET /findings/{id}?expand=capas,observations,history` | Screen 6 |
| [Close Visit] | Locks the visit for edits (checks attendance, sync state, unresolved refusals) | `POST /inspection-visits/{id}/actions {action:"COMPLETE"}` | Visit card marked COMPLETED |
| [Prepare Report] | Drafts a report from this inspection's visits/findings, then submits it for review | `POST /inspection-reports {inspection_id:…}` → `POST /inspection-reports/{id}/actions {action:"REVIEW"}` → `POST /inspection-reports/{id}/actions {action:"ISSUE"}` | Report review screen |

---

### Screen 4 — Record Observation (Field Capture)
**Route:** `/field/inspections/{id}/observe` · **Endpoint:** `POST /inspection-visits/{visit_id}/actions {action:"RECORD_OBSERVATION"}`

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Back    Record Observation · INS-2024-0891                    │
│ LOCATION (Required — GPS)                                        │
│ 📍 Bench 7 North — Section 3                 [📷 Geo-pin]       │
│    Lat/Lng · Accuracy: ±4m · Captured 14:32:07 · GPS: HIGH      │
│ OBSERVATION TYPE                                                  │
│ [Safety ●] [Environment] [Structural] [Equipment] [Labour]       │
│ REGULATION REFERENCE (CMR 2017 — AI Suggested)                  │
│ Reg. 103(1) — Ventilation shall be adequate…                    │
│ [✓ Use this]  [Search manually]  [Enter clause ref]              │
│ DESCRIPTION [free text]                                           │
│ SEVERITY  [MINOR] [SIGNIFICANT] [SEVERE ●] [CRITICAL]            │
│ EVIDENCE  [📷 Take Photo] [📎 Attach File] [🎙 Voice Note]       │
│ IMG_2026-08-14.jpg ✓ Geo-tagged · Capture: CAMERA               │
│ RAISE FINDING IMMEDIATELY?   [Yes ●]  [No, observation only]    │
│                        [Save Offline]  [Submit Observation]      │
└──────────────────────────────────────────────────────────────────┘
```

**Components / Novelty Pillar tie-ins:**
- **Evidence-integrity panel** (Pillar 2) — shows GPS accuracy, capture path (CAMERA vs UPLOAD), timestamp confidence; a red badge fires if accuracy > 50m.
- **AI clause-suggestion box** (Pillar 1) — as the description is typed, the UI calls the AI endpoint and shows a suggested CMR 2017 clause with an explicit "Use this" confirm step; nothing is auto-applied.

**Interactions:**

| Element | Click behavior | API |
|---|---|---|
| [📷 Geo-pin] | Captures device GPS | client geolocation, then attached to payload |
| [✓ Use this] | Accepts AI-suggested clause | none server-side yet — populates `regulation_ref` field |
| [Search manually] | Opens clause search | `GET /obligations?filter[domain]=…&q=…` |
| description typing (debounced) | Requests AI suggestion | `*(no documented endpoint yet — proposed capability, not in current spec; flagged below)*` |
| [Save Offline] | Queues locally, no network call | writes to local offline store |
| [Submit Observation] | Commits observation (+ raises finding if toggled Yes) | `POST /inspection-visits/{id}/actions {action:"RECORD_OBSERVATION", payload:{...}}` + `POST /evidence/sync` for each attachment | Returns to Screen 3, new observation/finding card appears |

---

### Screen 5 — Finding & Defect List
**Route:** `/field/findings` · **Endpoints:** `GET /findings?filter[mine_id]=…`, `GET /defects?filter[mine_id]=…`, `GET /capas?filter[mine_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Findings & Defects                     [+ Raise Finding] [Filter]│
│ [Findings ●] [Defects] [Observations] [CAPAs]                   │
│ Sort: [Attention ▼]  Filter: [All severities] [All states]      │
│ 🔴 DG-2847  SEVERE · AWAITING_ACKNOWLEDGEMENT                    │
│    Reg. 103(1) · Bench 7N-S3 · Ack due 31 Aug [OVERDUE BY 0 D] │
│    [Acknowledge]  [View Details]                                 │
│ 🟡 DEF-0412  SIGNIFICANT · CAPA_ASSIGNED   [View CAPA][Details] │
│ ✅ DEF-0389  MINOR · CLOSED                        [View Details]│
└──────────────────────────────────────────────────────────────────┘
```

**Components:** tab strip (Findings/Defects/Observations/CAPAs — each backed by its own list endpoint), sort/filter controls, severity-coloured row cards.

**Interactions:**

| Element | Click behavior | API | Lands on |
|---|---|---|---|
| Tab switch | Reloads list for that entity | `GET /defects` / `GET /observations` / `GET /capas` | same screen |
| [Acknowledge] | Acknowledges receipt of finding notification | `POST /notifications/{notification_id}/actions {action:"ACKNOWLEDGE"}` | row badge updates |
| [View CAPA] | Opens the CAPA record | `GET /capas/{id}` | CAPA detail panel |
| [View Details] | Opens full finding | `GET /findings/{id}?expand=capas,observations,history` | Screen 6 |

---

### Screen 6 — Finding Detail & Acknowledgement
**Route:** `/field/findings/{id}` · **Endpoint:** `GET /findings/{id}?expand=capas,history`

```
┌──────────────────────────────────────────────────────────────────┐
│ ← Back    DGMS Finding #DG-2847      🔴 SEVERE — Awaiting Ack   │
│ ISSUED BY — Authority, Inspector, Inspection, Jurisdiction        │
│ FINDING — Category, Location, CMR 2017 clause + text, clause ref │
│ Description                                                        │
│ CAPA ASSIGNED — Corrective / Preventive, Due, Assignee, Status   │
│ [Update CAPA Progress]  [Submit CAPA Completion]                  │
│ EVIDENCE ATTACHED — thumbnails, geo-tag, capture path             │
│ TIMELINE — raised → CAPA assigned → ack due (OVERDUE)             │
│ [Acknowledge]                                                       │
└──────────────────────────────────────────────────────────────────┘
```

**Components:** issuer block, clause block with `/akn/...` legal-clause permalink (Pillar 1 traceability), CAPA status block, evidence thumbnail strip, append-only timeline.

**Interactions:**

| Element | Click behavior | API |
|---|---|---|
| [Update CAPA Progress] | *(no separate progress-log action in spec)* — attaching interim evidence is done via `POST /evidence/sync` linked to the CAPA; the CAPA's own status only moves on `SUBMIT`/`VERIFY`/`EXTEND_DEADLINE` | `POST /evidence/sync` |
| [Submit CAPA Completion] | Opens evidence submission for the CAPA | `POST /capas/{id}/actions {action:"SUBMIT"}` + `POST /evidence/sync` |
| [Acknowledge] | Records receipt acknowledgement via notification service (not an admission — copy says so) | `POST /notifications/{notification_id}/actions {action:"ACKNOWLEDGE"}` |
| clause reference text | Opens the source clause in Document Intelligence viewer | `GET /obligations/{id}` |

---

### Screen 7 — Obligations
**Route:** `/field/obligations` · **Endpoint:** `GET /obligation-instances?filter[mine_id]=…&filter[responsible_person_id]=me`

```
┌──────────────────────────────────────────────────────────────────┐
│ My Obligations                              [Filter ▼] [Sort ▼] │
│ DUE THIS WEEK [2]  ·  OVERDUE [0]  ·  SUBMITTED [5]            │
│ 🟡 Plantation over 40 ha · Due 31 Aug · PENDING_SUBMISSION      │
│    Required evidence: 4 geo-tagged photos + survey report       │
│    [Submit Evidence →]                                          │
│ ✅ Monthly fire drill register · Submitted · Under verification │
│    [View submission]                                             │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Submit Evidence →] → Screen 8. [View submission] → `GET /obligation-instances/{id}` read-only detail.

---

### Screen 8 — Evidence Submission Flow
**Route:** `/field/obligations/{id}/submit`

```
Step 1 of 3: Capture Evidence
┌──────────────────────────────────────────────────────────────────┐
│ Plantation over 40 ha — FY 2026-27 · EC Condition 14 · Due 31 Aug│
│ WHAT'S REQUIRED — 4 geo-tagged photos, 1 survey report, GPS      │
│ within lease boundary                                             │
│ EVIDENCE CAPTURED [2 of 4 photos]  [+Capture][+Capture]          │
│ SURVEY REPORT [📎 Upload PDF] → AI extraction in progress…       │
│  → Extracted: Area = 41.3 ha · Species: 847 trees                │
│ LOCATION INTEGRITY                                                │
│ ✅ All photos within lease boundary                              │
│ ✅ GPS timestamps consistent (within 2-hour window)              │
│ ⚠ Photo 2 accuracy ±18m — still acceptable (threshold ±50m)     │
│                      [Save offline]  [Next: Review →]            │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:**

| Element | Click behavior | API |
|---|---|---|
| [+Capture] | Opens camera, geo-tags on capture | `POST /evidence/sync` (client ULID, offline-idempotent) |
| [📎 Upload PDF] | Uploads + triggers OCR | `POST /documents` → `POST /extractions` |
| Geo-boundary check (automatic) | Validates photo location vs lease | `POST /spatial-evaluations {subject:"evidence", target:"lease_boundary"}` |
| [Next: Review →] | Advances to review/submit step | `GET /obligation-instances/{id}` (requirement spec) then, on final submit, `POST /obligation-instances/{id}/actions {action:"SUBMIT", payload:{evidence_ids:[...]}}` |

---

### Screen 9 — Documents
**Route:** `/field/documents` · **Endpoint:** `GET /documents?filter[mine_id]=…&filter[relevant_to]=me`

```
┌──────────────────────────────────────────────────────────────────┐
│ Documents · Gevra OCP                    [Upload Document] [🔍]  │
│ [All] [Regulations] [Instruments] [My Submissions] [Reports]     │
│ CMR 2017 — Coal Mines Regulations       v2022 amendment  [View] │
│ Environmental Clearance — Gevra OCP     Active           [View] │
│ IMG_bench7n.jpg (my evidence, 14 Aug)                    [View] │
│ plantation_survey_aug26.pdf — AI extracted (41.3 ha)     [View] │
└──────────────────────────────────────────────────────────────────┘
```

**Components:** type-filter tabs, search box, document card (title, type, version/status, uploaded date, source).

**Interactions:**

| Element | Click behavior | API |
|---|---|---|
| [Upload Document] | Adds a personal document (e.g. a certificate, a manual report) | `POST /documents` |
| Document row | Opens the document viewer, with OCR/AI extraction panel if the document has one | `GET /documents/{id}` → `GET /extractions?filter[document_id]=…` |
| [🔍] search | Full-text search across accessible documents | `GET /documents?q=…` |

---

## 1.2 End-User: Safety Officer

**Primary job:** owns safety obligations, safety inspections, CAPA oversight for safety findings, and watches process-integrity signals in their own safety domain.

**Sidebar (same shell, safety-specific item added):**
```
🏠 Dashboard   🔍 Inspections   ⚠ Defects & Findings
📋 Obligations   🗂 Evidence   🚨 Safety Alerts   🗺 GIS Map   🔔 Notifications
```

### Screen 1 — Dashboard
**Route:** `/field/safety/dashboard` · **Endpoint:** `GET /dashboard?view=personal_queue&domain=safety` + `GET /signals?filter[mine_id]=…&filter[domain]=safety`

```
┌──────────────────────────────────────────────────────────────────┐
│ Safety Dashboard · Gevra OCP · 31 Aug 2026                       │
│                                    [4 Actionable]  [1 Overdue]    │
├──────────────────────────────────────────────────────────────────┤
│ MY QUEUE (same lanes as Inspector: Due Today / Verify / Approvals│
│ / Unread — filtered to safety-domain items)                      │
├──────────────────────────────────────────────────────────────────┤
│ PROCESS-INTEGRITY ALERTS (Pillar 4)                              │
│ 🔴 FLAG — 3 CAPAs closed within 24h of submission, no verification│
│    Fast closure pattern detected                                  │
│    [Review CAPAs]  [Alert mine manager]                           │
│ ℹ NOTICE — Ventilation check coverage 70% this week (below 80%) │
│    [View attendance records]                                      │
└──────────────────────────────────────────────────────────────────┘
```

**Components:** personal-queue lanes identical in shape to the Inspector's (reused component, domain-filtered), plus a **Process-Integrity Alerts panel** unique to this end-user — this is where Novelty Pillar 4 first surfaces at field level.

**Interactions:**

| Element | Click behavior | API | Lands on |
|---|---|---|---|
| Queue lane items | Same as Inspector Dashboard | same endpoints | Screens 6/7 below |
| [Review CAPAs] | Opens filtered CAPA list | `GET /capas?filter[mine_id]=…&filter[closure_speed]=fast` | CAPA list, safety domain |
| [Alert mine manager] | Escalates the flag | `POST /approvals` (escalation type) | confirmation toast |
| [View attendance records] | Opens ventilation pre-shift log | `GET /attendance-corrections?filter[mine_id]=…` | Attendance exceptions view |

### Screens 2–8 — Inspections, Inspection Detail, Record Observation, Finding List, Finding Detail, Obligations, Evidence Submission
Identical component structure and endpoints to Screens 2–8 in §1.1, scoped to `domain=safety` and to inspections/findings the Safety Officer is assigned to or owns as verifier. The one behavioural difference: on the CAPA verification step, the Safety Officer is frequently the **required verifier** for SIGNIFICANT-severity CAPAs (`POST /capas/{id}/actions {action:"VERIFY"}`), whereas the Inspector is usually the **submitter**.

---

### Screen 9 — Documents
**Route:** `/field/safety/documents` · **Endpoint:** `GET /documents?filter[mine_id]=…&filter[domain]=SAFETY`

Same component and interaction pattern as Screen 9 in §1.1, filtered to safety circulars, safety-plan documents, and this officer's own submissions (fire-drill registers, CAPA evidence certificates).

---

## 1.3 End-User: Environmental Officer

**Primary job:** environmental obligations (EC conditions, consent, forest clearance), monitoring data, environment-domain findings.

**Sidebar:** `🏠 Dashboard  🔍 Inspections  ⚠ Findings  📋 Obligations  🌿 Environment  🗂 Evidence  🗺 GIS Map  🔔 Notifications`

### Screen 1 — Dashboard (Environmental Obligations)
**Route:** `/field/environment` · **Endpoint:** `GET /obligation-instances?filter[mine_id]=…&filter[domain]=ENVIRONMENT`

```
┌──────────────────────────────────────────────────────────────────┐
│ Environmental Compliance · Gevra OCP · FY 2026-27              │
│ EC CONDITIONS         CONSENT            FOREST                 │
│ 8/12 Satisfied        CTO Valid until    FC Stage 2              │
│ 2 Submitted           31 Mar 2027        Pending MoEFCC          │
│ 2 Overdue 🔴          [View]             [View status]           │
│                                                                    │
│ CRITICAL CALENDAR                                                │
│ 31 Aug  Plantation survey submission (EC Cond 14) [Submit now →]│
│ 05 Sep  Air quality monitoring (EC Cond 31)  PENDING             │
│ 30 Sep  Water discharge report (CTE Schedule III) NOT_DUE_YET   │
│                                                                    │
│ MONITORING DATA (real-time where sensors exist)                 │
│ SPM 98µg/m³ (limit 150) ✅   RSPM 61 (limit 100) ✅             │
│ Noise 76dB (limit 75) 🟡!    Water pH 7.2 ✅                     │
└──────────────────────────────────────────────────────────────────┘
```

**Components:** three summary tiles (EC conditions / consent / forest clearance), a critical-calendar list, a live monitoring-data strip with threshold colour coding.

**Interactions:**

| Element | Click behavior | API | Lands on |
|---|---|---|---|
| [View] (consent tile) | Opens CTO/CTE record | `GET /regulatory-cases?filter[subject_mine_id]=…&filter[case_type]=CONSENT&view=current` | Consent detail |
| [View status] (forest) | Opens FC case | `GET /regulatory-cases?filter[type]=FOREST_CLEARANCE` | Regulatory case detail |
| [Submit now →] | Opens evidence flow for that obligation | `GET /obligation-instances/{id}` | Screen 8 pattern (Evidence Submission) |
| Monitoring value | Opens time-series chart | `GET /environment-observations?filter[mine_id]=…&parameter=…` | Monitoring drill-down |

### Screens 2–7 — Inspections, Findings, Obligations list, Evidence Submission
Same structure/endpoints as §1.1 Screens 2, 5, 6, 7, 8, filtered to `domain=ENVIRONMENT`.

---

### Screen 8 — Documents
**Route:** `/field/environment/documents` · **Endpoint:** `GET /documents?filter[mine_id]=…&filter[domain]=ENVIRONMENT`

```
┌──────────────────────────────────────────────────────────────────┐
│ Environmental Documents · Gevra OCP          [Upload Document]  │
│ [EC & Conditions] [Consent (CTE/CTO)] [Forest Clearance] [My subs]│
│ Environmental Clearance — Gevra OCP    47 conditions      [View]│
│ CTO — valid until 31 Mar 2027                              [View]│
│ FC Stage 2 application                                     [View]│
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Upload Document] → `POST /documents` (e.g. a monitoring lab report); row → `GET /documents/{id}`, with `GET /extractions?filter[document_id]=…` shown if AI has extracted obligation fields from it.

---

## 1.4 End-User: Labour/HR Officer

**Primary job:** worker attendance, contractor roster review, statutory labour registers, grievance intake.

**Sidebar:** `🏠 Dashboard  👥 Attendance  📋 Obligations  😤 Grievances  📄 Documents  🔔 Notifications`

### Screen 1 — Dashboard (Attendance & Roster)
**Route:** `/field/attendance` · **Endpoint:** `GET /shifts?filter[mine_id]=…&filter[date]=today`

```
┌──────────────────────────────────────────────────────────────────┐
│ Attendance · Gevra OCP · Shift: 31 Aug 2026 Day Shift            │
│ PRESENT: 1,247 / 1,380 expected  [90.4%]  [View absentees]      │
│ CONTRACTORS: 312 / 350           [89.1%]  [View roster]          │
│ ALERTS                                                            │
│ 🔴 12 persons on muster but not gate-scanned  [Reconcile muster]│
│ 🟡 Contractor OB-REM-PKG-03 roster not yet approved [Review →] │
│ PENDING ACTIONS                                                   │
│ [Validate shift register] [Attest daily attendance]              │
│ [Record manual entry]     [Review exceptions]                    │
│ COMPLIANCE                                                        │
│ Form 11 (Register of persons): Up to date ✅                     │
│ Monthly wages statement: Due 05 Sep 🟡                           │
│ Contractor labour licence: Valid until 31 Dec 2026               │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:**

| Element | Click behavior | API |
|---|---|---|
| [View absentees] | Opens absentee list | `GET /shifts/{id}?expand=absentees` |
| [View roster] | Opens contractor roster | `GET /shift-roster-versions?filter[mine_id]=…` |
| [Reconcile muster] | Opens exception-resolution form | `GET /attendance-corrections?filter[mine_id]=…&filter[status]=UNRESOLVED` |
| [Review →] (roster) | Opens roster for approval | `GET /shift-roster-versions/{id}` |
| [Attest daily attendance] | Signs off the day's register | `POST /attendance-registers/{id}/actions {action:"ATTEST"}` |
| Compliance line items | Open the underlying obligation | `GET /obligation-instances/{id}` |

### Screen 2 — Obligations (labour statutory registers)
Same list pattern as §1.1 Screen 7, `domain=LABOUR`.

### Screen 3 — Grievance Intake
**Route:** `/field/grievances` · **Endpoint:** `GET /grievance-cases?view=oversight&filter[mine_id]=…`
List of raised grievances with status; [+ New Grievance] → `POST /grievance-intakes`; row click → `GET /grievance-cases/{id}` detail with resolution timeline.

---

### Screen 4 — Documents
**Route:** `/field/labour/documents` · **Endpoint:** `GET /documents?filter[mine_id]=…&filter[domain]=LABOUR`

```
┌──────────────────────────────────────────────────────────────────┐
│ Labour Documents · Gevra OCP                  [Upload Document] │
│ [Statutory Registers] [Licences] [Wage Records] [Roster Approvals]│
│ Form 11 — Register of persons        Up to date      [View]     │
│ Contractor labour licence            Valid to 31 Dec  [View]     │
│ Monthly wages statement — Aug 2026   Due 05 Sep       [Upload]  │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Upload Document] / [Upload] → `POST /documents`, linked to the relevant obligation instance; row → `GET /documents/{id}`.

---

## 1.5 End-User: Engineer / Supervisor

**Primary job:** asset/HEMM condition, structural observations, equipment compliance certificates.

**Sidebar:** `🏠 Dashboard  🔧 Assets & HEMM  ⚠ Findings  🗺 GIS Map  🔔 Notifications`

### Screen 1 — Dashboard (Asset & HEMM Compliance)
**Route:** `/field/assets` · **Endpoint:** `GET /assets?filter[mine_id]=…&expand=obligation_status`

```
┌──────────────────────────────────────────────────────────────────┐
│ Equipment & Assets · Gevra OCP                    [Filter ▼]    │
│ [All Assets] [HEMM] [Electrical] [Fire Equipment] [Out of Service]│
│ HEMM FLEET STATUS                                                │
│ Dumpers: 62 operational · 3 in maintenance · 1 out of service    │
│ Excavators: 9 operational · 0 in maintenance                     │
│ COMPLIANCE FLAGS                                                 │
│ 🔴 Dumper DMP-041 — Reg. 181(3) certificate expired              │
│    [Raise finding]  [View asset record]                          │
│ 🟡 Excavator EX-007 — Annual inspection due 15 Sep [Schedule →] │
│ RECENT OBSERVATIONS                                              │
│ [+ Record observation]                                            │
│ • Haul road chainage 1.4km — berm erosion [View]                 │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:**

| Element | Click behavior | API |
|---|---|---|
| Fleet filter tabs | Reloads asset list by category | `GET /assets?filter[category]=…` |
| [Raise finding] | Opens finding form pre-linked to the asset | `POST /findings` (`subject.type="asset"`) |
| [View asset record] | Opens asset detail w/ certificate history | `GET /assets/{id}` |
| [Schedule →] | Requests an inspection for the asset | `POST /inspection-requests` |
| [Take out of service] (in asset detail) | Flags asset unusable | `POST /assets/{id}/actions {action:"TAKE_OUT_OF_SERVICE"}` |
| [+ Record observation] | Opens capture form | same pattern as §1.1 Screen 4, `subject.type="asset"` |

---

### Screen 2 — Findings (Asset/Equipment)
**Route:** `/field/assets/findings` · **Endpoints:** `GET /findings?filter[subject_type]=asset&filter[mine_id]=…`, `GET /capas?filter[subject_type]=asset`

Same card layout and interaction pattern as §1.1 Screen 5 (Finding & Defect List), filtered to `subject.type="asset"`. A row shows the asset ID and certificate/regulation reference (e.g. Reg. 181(3) electrical approval) instead of a bench location. [View Details] → `GET /findings/{id}` → same Finding Detail screen as §1.1 Screen 6, with an **Asset** panel added showing the equipment's service history and out-of-service status.

---

# Role 2 — Mine Management

**Who is in this role (3 end-users):** Mine Manager, Safety Management, Operations Management.

**Shared sidebar shell:**
```
┌─────────────────────────┐
│ ◉ <Name>                │
│ <Post title> · <Mine>    │
├─────────────────────────┤
│ 🏠 Dashboard             │
│ 📊 Compliance            │
│ 🔍 Inspections           │
│ ⚠  Findings & CAPAs     │
│ 📋 Obligations           │
│ 👷 Contractors           │
│ 👥 Staff & Appointments │
│ 📄 Documents & Reports  │
│ 🗺 Mine Map              │
│ 😤 Grievances            │
│ 🔔 Notifications         │
│ ⚙  Mine Settings         │
└─────────────────────────┘
```

---

## 2.1 End-User: Mine Manager

### Screen 1 — Dashboard
**Route:** `/mine/dashboard` · **Endpoint:** `GET /dashboard?view=measures&scope_type=MINE&scope_id={mine_id}&breakdowns=notification_health,approval_backlog,obligation_calendar`

```
┌──────────────────────────────────────────────────────────────────┐
│ Gevra OCP · Mine Dashboard · FY 2026-27 (Apr–Aug 2026)          │
│                                          [Time travel ▼] [Export]│
│ COMPLIANCE MEASURES                                              │
│  Verified Rate 76.2% (32/42) [→drilldown]  Submission Rate 88.1%│
│  (37/42) [→drilldown]  Overdue Load 5 [→view]  Unsupported 2 [→]│
│  Freshness: LIVE · Computed 31 Aug 2026 12:00                    │
│ MY QUEUE (personal)                          [View full queue]  │
│  ■ 2 approvals awaiting my decision                              │
│  ■ 1 CAPA verification requiring mine manager authority          │
│  ■ 3 unacknowledged notifications                                │
│ APPROVAL BACKLOG — 4 items pending, oldest 12 days [View all →] │
│ OBLIGATION CALENDAR (next 30 days) — dated list, colour-coded    │
│ ACTIVE FINDINGS REQUIRING MY ACTION                              │
│  🔴 DG-2847 SEVERE (ack overdue) [Acknowledge]                  │
│  🟡 DEF-0412 SIGNIFICANT [Review CAPA]                           │
└──────────────────────────────────────────────────────────────────┘
```

**Components:** 4 measure tiles (each a live drilldown link — Novelty Pillar 5, every number links to the exact record set behind it), personal-queue summary, approval-backlog counter, 30-day obligation calendar, action-required finding cards.

**Interactions:**

| Element | Click behavior | API | Lands on |
|---|---|---|---|
| Verified Rate tile | Drills into satisfied obligations | `GET /obligation-instances?filter[status]=SATISFIED` | Screen 2 (Compliance Detail), pre-filtered |
| Overdue Load tile | Drills into overdue set | `GET /obligation-instances?filter[status]=OVERDUE` | Screen 2, pre-filtered |
| [Time travel ▼] | Re-renders the dashboard as of a past date | `GET /dashboard?...&as_of={date}` | same screen, historical values |
| [View full queue] | Opens personal queue in full | `GET /dashboard?view=personal_queue` | full-page queue view |
| [View all approvals →] | Opens approval list | `GET /approvals?filter[status]=PENDING&filter[mine_id]=…` | Approvals screen |
| [Acknowledge] | Acknowledges receipt of finding notification | `POST /notifications/{notification_id}/actions {action:"ACKNOWLEDGE"}` | card updates in place |
| [Review CAPA] | Opens CAPA management filtered to that item | `GET /capas/{id}` | Screen 4 |

### Screen 2 — Compliance Detail
**Route:** `/mine/compliance` · **Endpoint:** `GET /obligation-instances?filter[mine_id]=…&group_by=domain,status`

```
┌──────────────────────────────────────────────────────────────────┐
│ Compliance Register · Gevra OCP                  [Export PDF]   │
│ [All domains][Safety][Environment][Production][Labour]           │
│ SAFETY — CMR 2017  ████████████░░░ 18/22 satisfied              │
│ 2 submitted (awaiting verification) · 1 overdue · 1 waived      │
│ Ref | Obligation | Due | Status | Evidence  (table, per row)    │
│ ENVIRONMENT — EC Conditions  ██████░░░░░░░░░ 8/12 satisfied      │
│ 2 submitted · 2 overdue 🔴                                       │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** domain tab → re-queries `group_by`; table row → `GET /obligation-instances/{id}` detail; [Export PDF] → `POST /report-instances/{report_definition_version_id}/actions {action:"COMPILE", payload:{type:"compliance_register", mine_id:…}}`.

### Screen 3 — Staff & Appointments
**Route:** `/mine/staff` · **Endpoint:** `GET /appointments?filter[mine_id]=…&expand=effective_authority`

```
┌──────────────────────────────────────────────────────────────────┐
│ Staff & Appointments · Gevra OCP            [+ New Appointment] │
│ STATUTORY POSTS STATUS                                            │
│ ✅ Mine Manager: A. Sinha (you) · Valid till 01 Apr 2029         │
│ ✅ Safety Officer: R. Kumar · Valid till 01 Apr 2028             │
│ 🟡 Electrical Manager: Post vacant since 15 Jul 2026             │
│    [Urgent: Appoint or notify DGMS] [View requirement]           │
│ EXPIRING SOON (next 90 days) — S. Mishra, Survey Officer [Renew]│
│ ALL APPOINTMENTS (table, filterable, exportable)                 │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:**

| Element | Click behavior | API |
|---|---|---|
| [+ New Appointment] | Opens appointment form (requires document evidence) | `POST /appointments` |
| [Renew] | Extends an expiring appointment | `POST /appointments/{id}/actions {action:"EXTEND"}` |
| [View requirement] | Shows what statute requires for that post | `GET /posts?filter[mine_id]=…&filter[holder_status]=VACANT` |
| Row [View] | Opens the individual appointment | `GET /appointments/{id}` |

This screen is the clearest UI expression of **Novelty Pillar 3** — authority is shown as *time-bounded and post-based*, not a static role list, and a vacant statutory post is flagged automatically.

### Screen 4 — CAPA Management (Mine Manager view)
**Route:** `/mine/capas` · **Endpoint:** `GET /capas?filter[mine_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ CAPAs · Gevra OCP                    [Filter] [Group by: Status]│
│ PENDING VERIFICATION [3]  OVERDUE [1]  IN PROGRESS [8]           │
│ 🔴 CAPA-2847-01 SEVERE · Submitted — awaiting mine-manager ack   │
│ Finding: DG-2847 (DGMS) · Due 14 Sep 2026                       │
│ Submitted by R. Kumar · Evidence: 3 geo-tagged photos + cert     │
│ VERIFICATION REQUIRED — SEVERE requires:                          │
│  • Mine Manager sign-off (you)                                    │
│  • Photo evidence at exact DGMS finding location                  │
│ [Approve]  [Reject with reason]  [Request more evidence]         │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:**

| Element | Click behavior | API |
|---|---|---|
| [Approve] | Verifies the CAPA closed | `POST /capas/{id}/actions {action:"VERIFY", payload:{decision:"ACCEPT"}}` |
| [Reject with reason] | Sends CAPA back to `REOPENED` with a mandatory reason | `POST /capas/{id}/actions {action:"VERIFY", payload:{decision:"REOPEN", reason:"…"}` |
| [Request more evidence] | Notifies submitter | `POST /notifications` (system) |

### Screen 5 — Contractor Management
**Route:** `/mine/contractors` · **Endpoint:** `GET /contractor-work-packages?filter[mine_id]=…&expand=eligibility`

```
┌──────────────────────────────────────────────────────────────────┐
│ Contractors · Gevra OCP                                          │
│ OB-REM-PKG-03 · Acme Mining Services · APPROVED                 │
│ Roster pending review: [Review roster →]                          │
│ Incidents: 0 · Findings attributed: 2 · CAPA compliance: 100%   │
│ [Full performance report]                                         │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Review roster →] opens `GET /shift-roster-versions?filter[state]=SUBMITTED&filter[mine_id]=…`; [Approve] on that roster fires `POST /shift-roster-versions/{id}/actions {action:"VALIDATE"}`.

---

### Screen 6 — Inspections (Mine Oversight & Scheduling)
**Route:** `/mine/inspections` · **Endpoint:** `GET /inspections?filter[mine_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Inspections · Gevra OCP           [+ Schedule Inspection] [Filter]│
│ [All] [Internal] [Regulatory] [Scheduled] [In Progress] [Closed] │
│ INS-2024-0891  REGULATORY · IN_PROGRESS · DGMS · 14 Aug          │
│   Team: R. Kumar (lead), S. Mishra          [Reassign] [View →] │
│ INS-2024-0876  INTERNAL · SCHEDULED · 07 Sep                     │
│   Team: 3 assigned                          [Reassign] [View →] │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:**

| Element | Click behavior | API |
|---|---|---|
| [+ Schedule Inspection] | Creates an internal inspection and opens team assignment | `POST /inspections` |
| [Reassign] | Adds/removes team members | `POST /inspection-assignment-members` |
| [View →] | Opens full record (same as §1.1 Screen 3, with mine-manager edit rights) | `GET /inspections/{id}` |

### Screen 7 — Obligations Registry
**Route:** `/mine/obligations` · **Endpoint:** `GET /obligation-instances?filter[mine_id]=…`

Full searchable, sortable table of every obligation at the mine — distinct from the domain-grouped Compliance Detail (Screen 2): this is a flat register with an owner-reassignment action.

```
┌──────────────────────────────────────────────────────────────────┐
│ Obligations Registry · Gevra OCP        [🔍 Search] [Filter ▼]  │
│ Ref | Obligation | Domain | Owner | Due | Status                │
│ 103 | Ventilation adequacy | Safety | R.Kumar | Monthly | SATIS │
│   [Reassign owner]                                     [View →] │
│ EC-14| Plantation 40ha | Environment | P.Xess | 31 Aug | PENDING│
│   [Reassign owner]                                     [View →] │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Reassign owner] → `PATCH /obligation-instances/{id} {responsible_person_id}`; row/[View →] → `GET /obligation-instances/{id}` detail.

### Screen 8 — Documents & Reports
**Route:** `/mine/documents` · **Endpoint:** `GET /documents?filter[mine_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Documents & Reports · Gevra OCP     [Upload Doc] [Generate Report]│
│ [Regulations] [Instruments] [Mine Documents] [Generated Reports] │
│ Monthly Compliance Report — Aug 2026        Ready   [Download]  │
│ Environmental Clearance — Gevra OCP         Active   [View]     │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Generate Report] → opens report-type/period picker → `POST /report-instances/{report_definition_version_id}/actions {action:"COMPILE", payload:{mine_id, period}}`; once ready, [Download] → `GET /report-instances/{id} (returns rendered artifact link once COMPILEd)`; [Upload Doc] → `POST /documents`.

### Screen 9 — Mine Map
**Route:** `/mine/map` — same implementation as the cross-role **GIS Mine Map** (see "Cross-role shared screens"), scoped to this mine with edit rights on boundary/asset annotations.

### Screen 10 — Grievances
**Route:** `/mine/grievances` · **Endpoint:** `GET /grievance-cases?view=oversight&filter[mine_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Grievances · Gevra OCP                              [Filter ▼]  │
│ GR-0231  Wage discrepancy — contractor worker   OPEN   [Assign] │
│ GR-0219  Safety equipment shortage              ESCALATED       │
│    [Escalated to: Safety Officer]                    [View →]  │
│ GR-0198  Roster dispute                          CLOSED  [View →]│
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Assign] → `POST /grievance-transfers {grievance_case_id, transfer_type:"ASSIGN"}`; [Escalate] → `POST /grievance-transfers {grievance_case_id, transfer_type:"ESCALATE"}`; [Close] (in detail view) → `POST /grievance-dispositions {grievance_case_id, disposition:"CLOSED"}`.

### Screen 11 — Mine Settings
**Route:** `/mine/settings` · **Endpoint:** `GET /mines/{id}`

```
┌──────────────────────────────────────────────────────────────────┐
│ Mine Settings · Gevra OCP                              [Save]   │
│ Mine profile — name, lease area, subunit/asset hierarchy         │
│ Notification policy — channels, digest frequency, escalation SLA │
│ Language default — English / Hindi                                │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Save] → `PATCH /mines/{id}`; hierarchy editor changes → `POST /mines/{id}/subunits` / `POST /assets`.

---

## 2.2 End-User: Safety Management

Same sidebar and shell as the Mine Manager. This end-user's **Dashboard is the Mine Manager Dashboard filtered to `domain=SAFETY`**, with one addition: the **Process-Integrity Alerts panel** (from the Safety Officer's Dashboard in §1.2) is promoted to the top of the screen, since acting on it is this role's core job.

```
┌──────────────────────────────────────────────────────────────────┐
│ Safety Management Dashboard · Gevra OCP · FY 2026-27            │
│ PROCESS-INTEGRITY ALERTS (top priority)                           │
│  🔴 Repeated CAPA extension pattern — 3 CAPAs, same officer      │
│     [Investigate]  [Escalate]                                     │
│ SAFETY COMPLIANCE MEASURES — Verified 82%, Overdue 2 [drilldowns]│
│ CAPA VERIFICATION QUEUE (Screen 4 pattern, safety-only)          │
│ STATUTORY SAFETY POSTS (from Screen 3, safety posts only)        │
└──────────────────────────────────────────────────────────────────┘
```

Screens for Compliance Detail, Staff & Appointments, CAPA Management, Contractor Management, Inspections, Obligations Registry, Documents & Reports, Mine Map, and Grievances reuse §2.1 Screens 2–11 with `domain=SAFETY` applied to every query where a domain filter is meaningful (Staff/Appointments and Contractor Management are unfiltered — authority and contractor scope don't split by domain).

---

## 2.3 End-User: Operations Management

Same shell. This end-user's **Dashboard is the Mine Manager Dashboard filtered to production/operations obligations**, plus a production-specific measures row.

```
┌──────────────────────────────────────────────────────────────────┐
│ Operations Dashboard · Gevra OCP · FY 2026-27                   │
│ PRODUCTION OBLIGATIONS — Monthly returns, permit conditions       │
│  Submitted 6/6 this quarter ✅  · Discrepancy flags: 0            │
│ COMPLIANCE MEASURES (Production domain) — [drilldowns as before] │
│ HEMM/ASSET COMPLIANCE SUMMARY (rolled up from §1.5 Engineer view)│
│ APPROVAL BACKLOG (Production approvals only)                     │
└──────────────────────────────────────────────────────────────────┘
```

**Endpoint:** `GET /dashboard?view=measures&scope_type=MINE&scope_id={mine_id}&domain=PRODUCTION` plus `GET /production-periods?filter[mine_id]=…` and `GET /production-discrepancies?filter[mine_id]=…` for the returns and reconciliation strip. Interactions follow the same drilldown pattern as §2.1 Screen 1.

### Screen 2 — Production Returns & Filings
**Route:** `/mine/production` · **Endpoint:** `GET /production-periods?filter[mine_id]=…` + `GET /production-discrepancies?filter[mine_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Production Returns · Gevra OCP · Aug 2026        [Submit Return]│
│ Monthly return — coal despatched, OB removed, grade  DRAFT       │
│ Permit condition check — capacity vs approved Mtpa   ✅ Within  │
│ Discrepancy flags — claimed vs weighbridge data       0          │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Approve Period / Submit Return] → `POST /production-periods/{id}/actions {action:"APPROVE"}` (or `POST /report-instances/{report_definition_version_id}/actions {action:"COMPILE", payload:{mine_id, period}}`); discrepancy row → `GET /production-discrepancies/{id}` / `POST /production-discrepancies/{id}/actions {action:"RESOLVE"}`; [View Approved Facts] → `GET /production-periods?view=approved_facts&filter[id]={id}`.

Screens for Inspections, Obligations Registry, Documents & Reports, Mine Map, and Asset/HEMM Compliance reuse §2.1 Screens 6–9 and §1.5 Screen 1, filtered to `domain=PRODUCTION` / asset scope.

---

# Role 3 — Corporate Management

**Who is in this role (2 end-users):** CIL/Subsidiary Official (Area GM / Senior Management), Compliance Team.

**Core principle:** portfolio view across multiple mines; no direct operational action — oversight, escalation, trend analysis, reporting. Measures appear at `ORGANIZATION_UNIT` or `TENANT` scope with `group_by=mine`.

**Shared sidebar shell:**
```
┌─────────────────────────┐
│ ◉ <Name>                │
│ <Post> · <Org unit>      │
├─────────────────────────┤
│ 🏠 Dashboard             │
│ 📊 Compliance Portfolio │
│ 🔍 Inspections           │
│ ⚠  Findings Registry    │
│ 🧠 Analytics & AI        │
│ 📄 Reports & Filings    │
│ 👷 Contractors           │
│ ⚖️  Regulatory Cases     │
│ 📋 Obligations Registry │
│ 🔔 Notifications         │
│ ⚙  Administration        │
└─────────────────────────┘
```

---

## 3.1 End-User: CIL / Subsidiary Official (Area GM, Senior Management)

### Screen 1 — Dashboard (Portfolio)
**Route:** `/corporate/dashboard` · **Endpoint:** `GET /dashboard?view=measures&scope_type=ORGANIZATION_UNIT&scope_id={unit_id}&group_by=mine`

```
┌──────────────────────────────────────────────────────────────────┐
│ Portfolio · Korba Area · SECL · FY 2026-27               [Export]│
│ Scope: 5 mines authorised            ⚠ 2 mines outside your scope│
│ ROLLUP — Verified 80.0% · Submission 90.0% · Overdue 7 · Unsupp 2│
│ MINES (worst first)                                               │
│ ① Gevra OCP 76.2%/88.1% Overdue 5 Unsupp 2 🔴 [View mine →]      │
│ ② Dipka OCP 84.2%/92.1% Overdue 2 Unsupp 0    [View mine →]      │
│ ③ Kusmunda OCP — not measured (0 obligations this period)        │
│ ⚠ PARTIAL SCOPE WARNING — 2 mines excluded from figures above   │
└──────────────────────────────────────────────────────────────────┘
```

**Components:** rollup tile row, sorted mine-card list (worst-attention first), explicit partial-scope banner.

The **partial-scope warning is a hard requirement, not decoration** — this is Novelty Pillar 5 (Honest Uncertainty): a number computed over 3 of 5 mines must say so on its face, never silently present as a full rollup.

**Interactions:**

| Element | Click behavior | API | Lands on |
|---|---|---|---|
| [View mine →] | Drills to that mine's compliance view | `GET /dashboard?view=measures&scope_type=MINE&scope_id=…` | Mine-scoped version of §2.1 Screen 2 |
| Rollup tile | Drills into the underlying obligation set | `GET /obligation-instances?filter[org_unit_id]=…&filter[status]=…` | Obligations Registry (Screen below) |
| ⚠ warning text | Opens scope explanation | `GET /organizations/{id}?expand=authorised_mines` | Scope detail modal |

### Screen 2 — Analytics & AI Insights
**Route:** `/corporate/analytics` · **Endpoint:** `GET /signals?filter[scope]=organization_unit&filter[scope_id]={id}`

```
┌──────────────────────────────────────────────────────────────────┐
│ AI Insights · Korba Area                   [Configure][History] │
│ PROCESS INTEGRITY FLAGS                     [What does this mean?]│
│ 🔴 ANOMALY — Repeated extension requests at Gevra OCP            │
│   3 CAPAs extended 2+ times (same officer) — workload or avoidance│
│   Detected by: Process-Integrity Analytics (Pillar 4)             │
│   [Investigate]  [Escalate to mine manager]                       │
│ 🟡 WATCH — Zero-rejection verifier, Dipka OCP                    │
│   K. Sahu verified 34 CAPAs/60 days, 0 rejected (benchmark 8%)   │
│   [Review officer's verifications]                                 │
│ RECURRENCE ANALYSIS — Reg. 106(2) haul-road: 4 violations/12mo   │
│   at Gevra (HIGH) [View all Reg. 106 history][Suggest inspection]│
│ PREDICTIVE COMPLIANCE RISK (next 30 days) — per-obligation list  │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:**

| Element | Click behavior | API |
|---|---|---|
| [Investigate] | Opens the underlying CAPA set | `GET /capas?filter[extension_count]=2+&filter[mine_id]=…` |
| [Escalate to mine manager] | Raises an escalation approval | `POST /approvals` |
| [Review officer's verifications] | Opens verifier's history | `GET /capas?filter[verified_by]=…` |
| [Suggest inspection] | Pre-fills an inspection request | `POST /inspection-requests` |
| [What does this mean?] | Explains the anomaly logic in plain language (grounded explanation, no autonomous conclusion — required by FR-9) | static explainer panel |

### Screen 3 — Regulatory Cases & Filings
**Route:** `/corporate/regulatory-cases` · **Endpoint:** `GET /regulatory-cases?filter[tenant_id]=…`
Tabs: Active / Applications / Closed / Federated (external). Row → `GET /regulatory-cases/{id}` → case detail with [View assessment] / [Track application] / [Submit additional response].

### Screen 4 — Document Intelligence & Regulation Library
**Route:** `/corporate/documents` · **Endpoint:** `GET /documents?filter[tenant_id]=…` + `GET /obligations?filter[domain]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Document Intelligence & Regulation Library          [Upload Doc]│
│ [Search regulations, documents, conditions…]  [AI Assist 🧠]    │
│ ACTIVE REGULATIONS — CMR 2017: 186 regs, 42 applicable to you    │
│ [Browse clauses]  [View obligations extracted]                    │
│ RECENT AI EXTRACTIONS — MoEFCC Circular 2026-08, 3 new obligations│
│ pending review [Review & approve][View extraction]                │
│ REGULATION ADAPTABILITY — when a new regulation is uploaded, AI  │
│ extracts new clauses, flags conflicts, and drafts obligation      │
│ instances; a human must approve before anything goes live.        │
└──────────────────────────────────────────────────────────────────┘
```

**This screen is the direct answer to "how does the project adapt when a new regulation comes":**

| Element | Click behavior | API |
|---|---|---|
| [Upload Doc] | Ingests the new regulation/circular, immutable original preserved | `POST /documents` |
| (system, automatic) | Runs OCR/layout extraction | `POST /extractions` |
| (system, automatic) | AI proposes clause list + applicability + conflict flags | AI extraction pipeline writes `extraction` records with `status:"PENDING_REVIEW"` |
| [Review & approve] (per clause) | Human confirms each proposed clause | `POST /extractions/{id}/actions {action:"ACCEPT"}` |
| (system, automatic, after approval) | Materialises dated obligation instances for every mine in scope | `POST /obligation-instances` (system-created) |
| (system, automatic) | Notifies the responsible officer at each affected mine | `POST /notifications` (via outbox) |
| [View extraction confidence] | Shows OCR/AI confidence scores per field | `GET /extractions/{id}` |
| conflict badge | Opens conflicting clause pair | `GET /obligation-conflicts?filter[tenant_id]=…` |

---

### Screen 5 — Compliance Portfolio (detailed drilldown)
**Route:** `/corporate/compliance` · **Endpoint:** `GET /obligation-instances?filter[org_unit_id]=…&group_by=mine,domain,status`

```
┌──────────────────────────────────────────────────────────────────┐
│ Compliance Portfolio · Korba Area                    [Export]   │
│              Safety      Environment   Production   Labour       │
│ Gevra OCP    18/22 🟡     8/12 🔴       6/6 ✅       12/12 ✅   │
│ Dipka OCP    20/21 ✅     10/11 ✅      6/6 ✅       11/11 ✅   │
│ Kusmunda OCP  — not measured —                                   │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** cell click → `GET /obligation-instances?filter[mine_id]=…&filter[domain]=…` (obligations table for that mine/domain); [Export] → `POST /report-instances/{report_definition_version_id}/actions {action:"COMPILE", payload:{type:"compliance_portfolio", org_unit_id:…}}`.

### Screen 6 — Inspections (Portfolio Oversight)
**Route:** `/corporate/inspections` · **Endpoint:** `GET /inspections?filter[org_unit_id]=…`

Same table pattern as §2.1 Screen 6, rolled up across every mine in the org unit, with an added **[Request cross-mine audit]** action → `POST /inspection-requests {scope:"org_unit"}`.

### Screen 7 — Findings Registry
**Route:** `/corporate/findings` · **Endpoint:** `GET /findings?filter[org_unit_id]=…&sort=attention`

Cross-mine findings list, same card layout as §1.1 Screen 5, with a **Mine** column added and sortable by severity/age/mine. Row → `GET /findings/{id}` → Finding Detail (read view; corporate does not acknowledge on the mine's behalf).

### Screen 8 — Reports & Filings
**Route:** `/corporate/reports` · **Endpoint:** `GET /report-definition-versions?filter[org_unit_id]=… + GET /report-instances?filter[org_unit_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Reports & Filings · Korba Area      [Generate New] [Schedule ↻] │
│ Monthly Compliance Rollup — Aug 2026            Ready [Download]│
│ Quarterly DGMS Statutory Filing — Q2 2026-27    DRAFT  [Prepare]│
│ Annual Environmental Statement — FY 2025-26     Filed  [View]   │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Generate New] → `POST /report-instances/{report_definition_version_id}/actions {action:"COMPILE", payload:{org_unit_id, period}}`; [Schedule ↻] → *(no recurring-schedule endpoint documented — recompile per period)*; [Prepare]/[View] → `GET /report-instances/{id}`; a final sign-off before distribution uses `POST /report-instances/{id}/actions {action:"ATTEST"}`.

### Screen 9 — Contractors (Portfolio)
**Route:** `/corporate/contractors` · **Endpoint:** `GET /contractor-work-packages?filter[org_unit_id]=…&expand=eligibility`

Cross-mine contractor oversight — same card pattern as §2.1 Screen 5, one row per work package per mine, with an eligibility/incident summary column. Row → `GET /contractor-work-packages/{id}` detail.

### Screen 10 — Obligations Registry
**Route:** `/corporate/obligations` · **Endpoint:** `GET /obligation-instances?filter[org_unit_id]=…`

Full flat, searchable obligation register across the portfolio (obligation-centric, not the mine×domain matrix of Screen 5) — same table shape as §2.1 Screen 7, with a **Mine** column and cross-mine owner reassignment disabled (corporate can escalate, not reassign, a mine-level obligation).

### Screen 11 — Administration
**Route:** `/corporate/admin` · **Endpoint:** `GET /organizations?filter[tenant_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Administration · SECL                    [+ New Mine] [+ New Unit]│
│ ORGANISATION HIERARCHY                                            │
│ SECL → Korba Area → Gevra OCP, Dipka OCP, Kusmunda OCP           │
│ POSITION TEMPLATES — Mine Manager, Safety Officer, … [Manage →] │
│ USER & APPOINTMENT ADMINISTRATION                  [Manage →]   │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [+ New Mine] → `POST /mines`; [+ New Unit] → `POST /organizations`; [Manage →] (position templates) → `GET /posts?filter[tenant_id]=…` then `POST /position-templates`; [Manage →] (users) → `GET /people?filter[tenant_id]=…` then `POST /appointments`.

---

## 3.2 End-User: Compliance Team

Same sidebar. This end-user's **Dashboard is Screen 4 above (Document Intelligence & Regulation Library) promoted to the home position**, since regulation ingestion/review is their day-to-day job, with the Portfolio measures (§3.1 Screen 1) available as a secondary "Compliance Health" strip at the top.

```
┌──────────────────────────────────────────────────────────────────┐
│ Compliance Team Dashboard · SECL                                  │
│ COMPLIANCE HEALTH — Verified 80% · Submission 90% [drill →Portfolio]│
│ PENDING REVIEW QUEUE                                               │
│  • MoEFCC Amendment Circular 2026-08 — 3 clauses awaiting approval│
│  • Draft obligation conflict: EC-Cond14 vs new clause [Resolve]   │
│ REGULATION LIBRARY (Document Intelligence, as in §3.1 Screen 4)  │
│ OBLIGATIONS REGISTRY (cross-mine, filterable by domain/status)   │
└──────────────────────────────────────────────────────────────────┘
```

**Endpoint:** `GET /extractions?filter[status]=PENDING_REVIEW&filter[tenant_id]=…` for the review queue; [Resolve] on a conflict → `GET /obligation-conflicts/{id}` then `POST /obligation-conflicts/{id}/actions {action:"RESOLVE"}`. All other screens — Portfolio Dashboard, Analytics & AI, Regulatory Cases, Compliance Portfolio, Inspections, Findings Registry, Reports & Filings, Contractors, Obligations Registry, and Administration — are shared 1:1 with §3.1 Screens 1–2 and 3, 5–11.

---

# Role 4 — Regulatory Users

**Who is in this role (2 end-users covered in depth):** DGMS Inspector, MoEFCC/CPCB Officer. (Other "Regulatory users" — Government authorities, Inspection authorities generally — follow the DGMS Inspector's pattern with their own mandate/jurisdiction.)

**Core principle:** regulators see only the **published projection** of data within their jurisdiction, not raw internal operator data. They cannot act on operator records — only record their own authority's actions (findings, orders, case decisions). Every read is purpose-logged (Novelty Pillar 3 + Pillar 5).

**Shared sidebar shell:**
```
┌─────────────────────────┐
│ ◉ <Name>                │
│ <Post> · <Authority>     │
│ Mandate: <domain>         │
│ Jurisdiction: N mines     │
├─────────────────────────┤
│ 🏠 Dashboard             │
│ 🔍 Inspections (mine)   │
│ ⚠  Findings Issued      │
│ 📋 Obligation Register  │
│ ⚖️  Cases & Proceedings │
│ 🗺 Jurisdiction Map      │
│ 📄 Instruments & Orders │
│ 🔔 Notifications         │
└─────────────────────────┘
```

---

## 4.1 End-User: DGMS Inspector

### Screen 1 — Dashboard
**Route:** `/regulatory/dashboard` · **Endpoint:** `GET /dashboard?view=measures&scope_type=PORTFOLIO&scope_id={mandate_id}&group_by=mine&purpose=REGULATORY_OVERSIGHT`

```
┌──────────────────────────────────────────────────────────────────┐
│ DGMS Dashboard — Dhanbad Region 2                                 │
│ Jurisdiction: 12 mines · Mandate: CMR 2017 Safety               │
│ PURPOSE OF THIS SESSION                                            │
│ [Routine oversight ▼]  (required before regulated reads)         │
│ COMPLIANCE OVERVIEW (published projection only)                   │
│ Fully compliant: 8 · Partial: 3 · Non-compliant: 1 · Unmeas: 0  │
│ ATTENTION REQUIRED                                                 │
│ 🔴 Gevra OCP — Overdue finding acknowledgement, DG-2847 SEVERE  │
│    [View finding]  [Issue reminder]  [Escalate]                   │
│ RECENT INSPECTIONS I CONDUCTED — list [View all my inspections] │
│ MY ACTIVE FINDINGS — 3 issued, 1 SEVERE, 2 SIGNIFICANT           │
│ JURISDICTION MAP  [🗺 View mine map with compliance overlay]     │
└──────────────────────────────────────────────────────────────────┘
```

**The purpose-declaration dropdown is mandatory before the page loads regulated data** — it is recorded server-side and appears in the audit trail as the reason for that session's reads.

**Interactions:**

| Element | Click behavior | API | Lands on |
|---|---|---|---|
| [Routine oversight ▼] | Sets `purpose` param, then loads the dashboard | `GET /dashboard?...&purpose=…` | same screen, populated |
| [View finding] | Opens the finding | `GET /findings/{id}` | Full finding detail (regulator view — read-only on operator side, action-only on their own decisions) |
| [Issue reminder] | Sends a reminder notification | `POST /notifications` |
| [Escalate] | Opens a case | `POST /regulatory-cases` |
| [View all my inspections] | Opens inspection list scoped to this inspector | `GET /inspections?filter[conducted_by]=me` | Screen 2 pattern (as §1.1 Screen 2, jurisdiction-scoped) |
| [🗺 View mine map…] | Opens jurisdiction map | `GET /spatial-topologies?filter[jurisdiction_id]=… + GET /governed-geometry-versions?filter[jurisdiction_id]=…` | Jurisdiction Map screen |

### Screen 2 — Conduct Inspection (Regulatory)
**Route:** `/regulatory/inspections/{id}/conduct`

Reuses the Field Inspector's Screen 3/4 layout (§1.1), with regulatory provenance auto-populated and locked from the inspector's own mandate/jurisdiction — it cannot be edited to claim authority they don't hold, and they cannot see internal operator data outside their jurisdiction.

```
┌──────────────────────────────────────────────────────────────────┐
│ INS-2024-0891 · DGMS Safety Inspection · Gevra OCP              │
│ Your authority: DDMS (Mining) R. Verma                          │
│ REGULATORY PROVENANCE (auto-populated, cannot be overridden)     │
│ Authority / Issuing Appointment / Mandate Assignment / Jurisdiction│
│ [Record Observation] → Screen 4 pattern                          │
│ [Issue Finding with CAPA] → Screen 3 below                        │
│ [Issue Prohibitory Order] → regulatory case action                │
└──────────────────────────────────────────────────────────────────┘
```

This is where **Novelty Pillar 1 (Clause-to-Closure Traceability)** is enforced hardest: issuing a finding requires an exact clause reference validated against the CMR 2017 library, and the resulting chain — Inspection → Visit → Observation → Finding → CAPA → Evidence → Closure — is permanently linked with every authority ID preserved.

### Screen 3 — Issue Regulatory Finding
**Route:** `/regulatory/findings/raise` · **Endpoint:** `POST /findings` (`origin.type="observation"`, regulatory)

```
┌──────────────────────────────────────────────────────────────────┐
│ Issue Regulatory Finding · Gevra OCP                              │
│ [clause selection, description, severity — same pattern as F-04] │
│ CAPA REQUIRED (mandatory — a finding without CAPA is invalid)    │
│ Corrective / Preventive / Due date                                │
│ SOURCE INSTRUMENT — [Select inspection report] (auto-linked)     │
│                     [Cancel]  [Issue Finding]                     │
└──────────────────────────────────────────────────────────────────┘
```

[Issue Finding] → `POST /findings` with mandatory CAPA payload → triggers `POST /notifications` to the mine's responsible officer.

### Screen 4 — Regulatory Cases & Applications
**Route:** `/regulatory/cases` · **Endpoint:** `GET /regulatory-cases?filter[authority_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Regulatory Cases · DGMS Dhanbad Region 2           [+ New Case]│
│ SECTION 22 PROHIBITORY ORDERS                                     │
│ DGMS-2026-0084 · Gevra OCP · Bench 7 North · RESPONSE_RECEIVED   │
│ [Review response]  [Issue decision]  [Lift order]                 │
│ LICENSING APPLICATIONS                                             │
│ DGMS-APP-2026-0117 · Form IV · UNDER_REVIEW                     │
│ [Review application]  [Request clarification]                     │
│ MINE OPENING PERMISSIONS [View all MOP applications in jurisdiction]│
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Issue decision] → `POST /regulatory-decisions {case_id, decision_kind:"GRANT_WITH_CONDITIONS"|"REJECT"|"ORDER_PROHIBITORY"}`; [Lift order] → `POST /regulatory-decisions {case_id, decision_kind:"REVOKE_ORDER", reason:"…"}`; [Request clarification] → `POST /regulatory-query-rounds {case_id, items:[...]}`; [Review response] → `GET /regulatory-query-rounds?filter[case_id]=…` + `POST /regulatory-query-rounds/{id}/actions {action:"DECIDE_ITEM"}`.

---

### Screen 5 — Inspections (Jurisdiction Scheduling)
**Route:** `/regulatory/inspections` · **Endpoint:** `GET /inspections?filter[jurisdiction_id]=…`

Same table pattern as §2.1 Screen 6, scoped to mines in this inspector's jurisdiction. **[+ Schedule Inspection]** → `POST /inspections {origin:"REGULATORY"}` — this is how a DGMS visit gets created; it appears on the target mine's Field-level Inspector queue once scheduled.

### Screen 6 — Findings Issued (Registry)
**Route:** `/regulatory/findings` · **Endpoint:** `GET /findings?filter[issued_by]=me`

```
┌──────────────────────────────────────────────────────────────────┐
│ Findings Issued · R. Verma, DDMS (Mining)            [Filter ▼] │
│ 🔴 DG-2847  SEVERE · Gevra OCP · Ack overdue        [View →]   │
│ 🟡 DG-2801  SIGNIFICANT · Dipka OCP · CAPA in progress [View →] │
│ ✅ DG-2754  MINOR · Kusmunda OCP · Verified closed   [View →]   │
└──────────────────────────────────────────────────────────────────┘
```

Full history of every finding this inspector (or, filtered up, this authority) has issued, independent of the "My Active Findings" summary on the Dashboard. Filter by mine, severity, status, date range. Row → `GET /findings/{id}`.

### Screen 7 — Obligation Register (Published Projection)
**Route:** `/regulatory/obligations` · **Endpoint:** `GET /obligation-instances?filter[jurisdiction_id]=…&view=published`

Read-only register across jurisdiction mines, showing only the **published projection** fields (no internal owner names, no internal notes) — obligation reference, domain, due date, status, evidence-verified flag. This is the regulator-safe counterpart of §2.1 Screen 7.

### Screen 8 — Jurisdiction Map
**Route:** `/regulatory/map` · **Endpoint:** `GET /spatial-topologies?filter[jurisdiction_id]=… + GET /governed-geometry-versions?filter[jurisdiction_id]=…`

Same GIS component as the cross-role Mine Map, pre-loaded with every mine boundary in jurisdiction and a compliance-status colour overlay per mine (green/amber/red, matching the Dashboard's Fully/Partial/Non-compliant counts). Clicking a mine boundary opens that mine's published compliance summary.

### Screen 9 — Instruments & Orders
**Route:** `/regulatory/instruments` · **Endpoint:** `GET /regulatory-cases?filter[authority_id]=…&filter[case_type]=ORDER`

```
┌──────────────────────────────────────────────────────────────────┐
│ Instruments & Orders · DGMS Dhanbad Region 2      [+ New Order]│
│ Circular DGMS/2026/14 — Ventilation standards clarification     │
│   Issued 10 Aug 2026 · Applicable: 12 mines          [View]    │
│ Section 22 Order DGMS-2026-0084 — Gevra OCP           [View]    │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [+ New Order] → `POST /regulatory-cases {case_type:"ORDER"}` (or `POST /mandates` for a standing regulatory mandate rather than a single order); row → `GET /regulatory-cases/{id}`, which shows every mine/obligation the instrument has propagated to (this is how a new circular from this authority becomes obligations at each mine, mirroring the Document Intelligence flow in §3.1 Screen 4 but issued by the regulator rather than uploaded by the operator).

---

## 4.2 End-User: MoEFCC / CPCB Officer

Same sidebar shell, same Dashboard pattern as §4.1 Screen 1, but scoped to `mandate=ENVIRONMENT` and jurisdiction = the mines under that officer's environmental clearances.

### Screen 1 — Dashboard
```
┌──────────────────────────────────────────────────────────────────┐
│ MoEFCC Dashboard — Central Region                                 │
│ Jurisdiction: 9 mines · Mandate: EC/CTE/CTO conditions           │
│ PURPOSE OF THIS SESSION  [Routine oversight ▼]                   │
│ EC CONDITION COMPLIANCE OVERVIEW (published projection only)     │
│ Fully compliant: 6 · Partial: 2 · Non-compliant: 1               │
│ ATTENTION REQUIRED                                                 │
│ 🔴 Gevra OCP — Plantation obligation overdue (EC Cond 14)        │
│    [View obligation]  [Issue show-cause]  [Escalate]              │
│ APPLICATIONS AWAITING APPRAISAL — EC-RASM-2026-041 [Review →]    │
│ MONITORING DATA ANOMALIES — Noise 76dB vs 75dB limit at Gevra    │
│ JURISDICTION MAP  [🗺 View mine map with EC overlay]              │
└──────────────────────────────────────────────────────────────────┘
```

**Endpoint:** `GET /dashboard?view=measures&scope_type=PORTFOLIO&scope_id={mandate_id}&domain=ENVIRONMENT&purpose=REGULATORY_OVERSIGHT`. [Review →] on an application opens the same Regulatory Case detail pattern as §4.1 Screen 4, filtered to environmental clearances. [Issue show-cause] → `POST /regulatory-cases` (show-cause notice type). Screens for Conduct Inspection, Issue Finding, Cases & Applications, Inspections, Findings Issued, Obligation Register, Jurisdiction Map, and Instruments & Orders reuse §4.1 Screens 2–9 with the environmental mandate/domain filter applied throughout (e.g. Instruments & Orders here lists MoEFCC circulars/amendments instead of DGMS orders).

---

# PART B — SECONDARY ROLE

# Role 5 — Contractors

**Who is in this role (2 end-users):** Contractor Administrator, Contractor Supervisor. Contractors see only their own engagement, their own workers, and what the operator has shared with them — never other contractors' data or unrelated internal mine data.

**Shared sidebar shell:**
```
┌─────────────────────────┐
│ ◉ <Name>                │
│ <Post> · <Contractor org>│
│ Engagement: <ref>         │
├─────────────────────────┤
│ 🏠 Dashboard             │
│ 📦 Work Packages         │
│ 👷 Workers               │
│ 📋 Compliance Register  │
│ 📄 Documents             │
│ 😤 Grievances            │
│ 🔔 Notifications         │
└─────────────────────────┘
```

## 5.1 End-User: Contractor Administrator

### Screen 1 — Dashboard
**Route:** `/contractor/dashboard`

```
┌──────────────────────────────────────────────────────────────────┐
│ Contractor Dashboard · Acme Mining Services                      │
│ Engagement: SECL/KRB/OB-REMOVAL/2026/17                         │
│ ACTIVE PACKAGES — OB-REM-PKG-03, Gevra OCP, APPROVED             │
│ ELIGIBILITY STATUS ✅ ELIGIBLE to commence work [View requirements]│
│ ROSTER STATUS — 312 workers APPROVED, next due 30 Sep [Submit →]│
│ COMPLIANCE ALERTS 🟡 Safety plan renewal due 15 Sep [Upload]    │
│ ✅ Labour licence Valid · Insurance Valid                        │
│ MY PERFORMANCE — Incidents 0 · Findings 2 · CAPA compliance 100%│
└──────────────────────────────────────────────────────────────────┘
```

**Endpoints:** `GET /contractor-work-packages?filter[organization_id]=my_org_id`, `GET /contractor-eligibility-decisions?filter[organization_id]=…`, `GET /contractor-performance-periods?filter[organization_id]=…`.

**Interactions:** [Submit →] opens roster upload → `POST /shift-roster-versions`; [Upload] on compliance alert → `POST /documents` then linked to the requirement instance → `POST /contractor-requirement-instances/{id}/actions {action:"SUBMIT"}`.

### Screen 2 — Work Packages
**Route:** `/contractor/packages` · **Endpoint:** `GET /contractor-work-packages?filter[organization_id]=my_org_id`

```
┌──────────────────────────────────────────────────────────────────┐
│ Work Packages · Acme Mining Services                             │
│ OB-REM-PKG-03 · Gevra OCP · APPROVED · 01 Oct – 31 Mar 2027     │
│   Eligibility: ✅ ELIGIBLE          [View requirements] [View →]│
│ OB-REM-PKG-07 · Dipka OCP · PENDING_APPROVAL                    │
│   [View →]                                                        │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [View requirements] → `GET /contractor-work-packages/{id}?expand=eligibility` (shows every requirement — licence, insurance, safety plan — and its current status); row/[View →] → package detail.

### Screen 3 — Compliance Register
**Route:** `/contractor/compliance` · **Endpoint:** `GET /contractor-requirement-instances?filter[organization_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Compliance Register · Acme Mining Services       [Upload Renewal]│
│ Labour Licence          Valid until 31 Dec 2026        ✅        │
│ Insurance (CAR policy)  Valid until 15 Feb 2027        ✅        │
│ Safety Plan             Renewal due 15 Sep 2026        🟡        │
│   [Upload Renewal]                                                │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Upload Renewal] → `POST /documents` then `POST /contractor-requirement-instances/{id}/actions {action:"SUBMIT", payload:{document_id}}`.

### Screen 4 — Documents
**Route:** `/contractor/documents` · **Endpoint:** `GET /documents?filter[organization_id]=…`

Contractor's own document library (licences, certificates, safety plans, roster PDFs). [Upload Document] → `POST /documents`; row → `GET /documents/{id}`.

### Screen 5 — Grievances
**Route:** `/contractor/grievances` · **Endpoint:** `GET /grievance-cases?view=oversight&filter[organization_id]=…`

List of grievances raised by or on behalf of this contractor's workforce, same card pattern as §2.1 Screen 10. **[+ New Grievance]** → `POST /grievance-intakes` (filed on behalf of a worker).

---

## 5.2 End-User: Contractor Supervisor

### Screen 1 — Dashboard (Worker Compliance)
**Route:** `/contractor/workers` · **Endpoint:** `GET /contractor-engagements?filter[package_id]=…`

```
┌──────────────────────────────────────────────────────────────────┐
│ Workers · OB-REM-PKG-03                 [+ Add worker] [Export] │
│ ELIGIBLE WORKERS: 308/312               [4 Exceptions]           │
│ ✅ D. Murmu   Dumper Operator   Certified · Active                │
│ 🔴 M. Soren   Dumper Operator   Safety certificate expired       │
│    [Update document]                                               │
│ 🟡 R. Oraon   Excavator Op.    Medical exam due 05 Sep [Remind] │
│ ROSTER SUBMISSIONS — Current approved 29 Aug [Download]           │
│ Next due 30 Sep [Prepare next roster]                              │
└──────────────────────────────────────────────────────────────────┘
```

**Interactions:** [Update document] → `POST /contractor-requirement-instances/{id}/actions {action:"SUBMIT", payload:{document_id}}`; [Remind] → `POST /notifications`; [Prepare next roster] → `POST /shift-roster-versions`.

### Screen 2 — Work Packages (My Package)
**Route:** `/contractor/packages` · **Endpoint:** `GET /contractor-work-packages/{id}`

Single-package detail view (the supervisor is scoped to one active package, unlike the Administrator who sees all of them) — scope of work, benches/area, validity dates, and the eligibility checklist. [View requirements] → `GET /contractor-work-packages/{id}?expand=eligibility`.

### Screen 3 — Compliance Register (Worker-Level)
**Route:** `/contractor/compliance` · **Endpoint:** `GET /contractor-requirement-instances?filter[package_id]=…`

Same layout as §5.1 Screen 3, but scoped to worker-level requirements for this one package (medical exams, safety certificates, competency certificates) rather than org-level licences/insurance. [Upload Renewal] → same action pattern.

### Screen 4 — Documents
**Route:** `/contractor/documents` · **Endpoint:** `GET /documents?filter[package_id]=…`

Package-scoped document library — safety plan for this package, worker certificates, roster PDFs. Same interactions as §5.1 Screen 4.

### Screen 5 — Grievances
**Route:** `/contractor/grievances` · **Endpoint:** `GET /grievance-cases?view=oversight&filter[package_id]=…`

Grievances raised by workers on this package. Same card pattern and **[+ New Grievance]** action as §5.1 Screen 5.

---

# Cross-role shared screens (appear in every role's sidebar, one implementation)

- **GIS Mine Map (`/{role}/map`)** — `GET /spatial-topologies` + `GET /governed-geometry-versions` + `GET /governed-geometry-versions?view=features`. Layer toggles: mine boundary, bench layout, haul roads, active findings, inspections, attendance zones, environmental monitoring, contractor zones. Clicking a map pin opens that record's detail screen.
- **Audit Trail (`/{role}/audit`)** — `GET /audit-events?filter[subject_id]=…`. Append-only history: actor, appointment, original/previous value, content hash, evidence linkage. Available to Mine Management, Corporate, and Regulatory roles.
- **Notifications (full page, `/{role}/notifications`)** — `GET /notifications` with tabs for unread/all/by type. Same Ack action as the drawer.
- **Grievance Intake (`/{role}/grievances`)** — available to Field-level, Mine-Management, and Contractors. `GET /grievance-cases?view=oversight` / `POST /grievance-intakes` (raise) / `POST /grievance-transfers` (assign, escalate) / `POST /grievance-dispositions` (close).

---

# Where the 5 Novelty Pillars show up, screen by screen

| Pillar | Screens it appears on |
|---|---|
| **1. Clause-to-Closure Traceability** | Record Observation (§1.1 Screen 4 — clause search + AI suggestion), Issue Regulatory Finding (§4.1 Screen 3 — mandatory clause ref), Finding Detail (§1.1 Screen 6 — permalinked clause), Audit Trail |
| **2. Evidence Integrity** | Record Observation & Evidence Submission (§1.1 Screens 4 & 8 — GPS accuracy, capture path, timestamp confidence, geo-boundary check) |
| **3. Governance-Aware Authorisation** | Authority Banner (global), Staff & Appointments (§2.1 Screen 3 — vacant-post detection, auto-expiry), CAPA verification (§2.1 Screen 4 — required capability shown), Regulatory Dashboard purpose declaration (§4.1 Screen 1) |
| **4. Process-Integrity Analytics** | Safety Officer / Safety Management Dashboards (§1.2, §2.2), Corporate Analytics & AI (§3.1 Screen 2 — fast closure, zero-rejection verifier, repeated extensions) |
| **5. Honest Uncertainty** | Portfolio Dashboard partial-scope warning (§3.1 Screen 1), `—` for unmeasured mines (never shown as 0% or 100%), evidence verdict labels (UNVERIFIED vs SATISFIED), freshness labels on every dashboard |

---

## Known gaps — two spec domains not yet reflected in any screen

Two of the 39 spec files describe capabilities this document doesn't give a screen to. Flagging rather than guessing:

- **Incidents** (`incidents/incidents.md`) — `/incidents`, `/incident-reports`, `/incident-investigations`, `/incident-classifications`, `/incident-people/{id}/actions`, `/incident-notification-obligations/{id}/actions`. This is a full safety-incident-reporting workflow (distinct from a routine finding) and most naturally belongs on the Safety Officer's and Mine Manager's sidebars — say if you want it built out.
- **Search** (`search/search.md`) — `/search-sessions`, `/saved-searches`, `/search-exports`, `/search-indexes`. The global search affordance implied by the 🔍 icons throughout isn't wired to a real endpoint in this document yet.

---

*Document version 3.0 — restructured Role → End-User → Complete UI Kit format, endpoints verified line-by-line against `docs/api-specs/endpoints/` (39 files) rather than inferred from domain names.*

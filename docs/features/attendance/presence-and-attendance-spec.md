# Strata — Workforce Presence, Attendance and Muster Specification

## 1. Purpose and requirement ownership

This specification owns `CAP-06` and PS §4.6. Read it before changing workforce attendance, access checkpoints, RFID/biometric integration, shift rosters, underground presence, emergency muster, contractor reconciliation, or attendance correction.

The domain answers three different questions:

| Question | Output |
|---|---|
| Was a person recorded for work? | Statutory/operational attendance register |
| Where were they last confirmed? | Presence state with time, source and confidence |
| Who may still be in danger during an emergency? | Live muster projection with uncertainty |

Payroll consumes approved attendance but does not own or rewrite safety-presence history.

## 2. Legal and accountability boundary

Coal Mines Regulations, 2017 Regulation 40(3) requires each person to have their name recorded before work and after the shift; belowground workers must be recorded every time they proceed belowground or return to surface. An electronic punching or registry system may be used when approved by the Chief Inspector, with the prescribed hard-copy record.

Regulation 61 already names the **attendance clerk** and requires the clerk to remain at the attendance cabin, or near the belowground outlet, while persons are at work. The clerk keeps the register, guards against unauthorized entry and reports specified missing attendance to the manager or shift authority.

Therefore Strata uses existing accountable positions:

- **Mine Manager:** accountable mine authority for ensuring a compliant attendance system, staffing the function, approving policy and high-risk corrections, and acting on unresolved exceptions. Automation does not transfer this accountability.
- **Attendance Clerk:** operational custodian for a mine/outlet/shift. Monitors capture, verifies exceptions, records witnessed fallbacks, maintains the register/printed output and escalates discrepancies.
- **Official in charge of shift:** confirms operational roster and acts on missing/late/zone exceptions for the shift.
- **Lamp-room attendant:** binds an approved cap lamp/RFID credential to a person for a shift and records issue/return; this does not by itself approve attendance.
- **Control-room or emergency muster coordinator:** operates emergency muster and accounts for people during an incident; does not alter original presence events.
- **Contractor supervisor:** submits and reconciles the contractor roster and identifies workers; cannot approve their own disputed attendance or rewrite mine records.
- **Attendance system administrator:** maintains device/reader registration and health; cannot create or approve human attendance merely through device privileges.
- **Authorized regulatory officer:** reads/inspects records only under current mandate and jurisdiction.

The Attendance Clerk and Mine Manager are `position_template`/`post` records with time-bounded appointments, not global role enums. A small mine may assign additional charge through a recorded appointment, but the assignee and validity window remain explicit.

## 3. Separation of duties

| Action | Required authority | Separation rule |
|---|---|---|
| Submit expected roster | Shift official or contractor supervisor | Contractor submission requires mine-side validation |
| Bind RFID/cap lamp | Lamp-room attendant | Cannot approve a disputed event created from that binding |
| Record immediate witnessed fallback | Attendance Clerk | Reason and witnessing appointment mandatory |
| Propose retrospective correction | Attendance Clerk or shift official | Original event remains immutable |
| Approve material correction | Mine Manager or separately authorized post | Proposer cannot approve own correction |
| Attest statutory register/export | Mine Manager or authorized statutory post | Exact event cut and generation time retained |
| Operate emergency muster | Muster coordinator | Muster confirms safety; it never erases entry/exit events |
| Configure devices | System administrator | No manual-attendance or correction authority implied |

## 4. Capture strategy: hybrid, not device-exclusive

### 4.1 Surface and opencast

Preferred order:

1. Approved biometric or smart-card verification at a controlled entry.
2. RFID/NFC checkpoint events for controlled-zone movement.
3. Managed-device geofenced capture for dispersed field teams where policy permits.
4. Witnessed manual fallback when equipment or identity verification fails.

Biometric verification answers **who presented at a checkpoint**. It does not prove continued presence or exact work location. Strata should ingest a signed/traceable match result and external subject reference; raw biometric templates remain in the approved biometric system unless a separately approved privacy/security design requires otherwise.

### 4.2 Underground

Consumer-phone GNSS is not an underground location source. The production path uses approved RFID/cap-lamp or other intrinsically safe credentials with fixed readers at the lamp room, pit head/outlet and justified internal checkpoints.

```text
person + shift → cap-lamp/tag binding
→ belowground-entry reader
→ optional junction/zone readers
→ surface-return reader
→ lamp return and reconciliation
```

A reader event proves passage at that checkpoint and time. Between readers, the system may show a possible route/zone derived from the surveyed topology, never an invented precise dot.

### 4.3 SIH hardware demonstration

The team may build a fingerprint reader and low-cost RFID readers/tags. They are prototype input devices, not claimed as DGMS-approved or intrinsically safe mine equipment.

The demo adapter emits the same production-shaped events as future approved devices:

```json
{
  "device_id": "reader_pit_head_01",
  "credential_ref": "tag_caplamp_4471",
  "event_type": "BELOWGROUND_ENTRY",
  "device_recorded_at": "2026-08-30T08:03:00Z",
  "sequence": 1842,
  "signature": "demo-device-signature"
}
```

Demo labels must say **prototype reader**, **simulated mine topology**, and **production integration contract**. Do not claim intrinsic-safety certification, regulatory approval, or continuous underground positioning.

## 5. Canonical records

- `shift`: scheduled work window and mine context.
- `shift_roster_entry`: expected person, contractor, work area and eligibility snapshot.
- `attendance_credential`: external biometric subject, card, RFID or cap-lamp tag reference; versioned assignment, never raw secret/template by default.
- `credential_assignment`: person-to-credential validity, plus shift-specific cap-lamp issue/return where applicable.
- `checkpoint_device`: governed reader/terminal, mine zone, device trust and health state.
- `presence_event`: immutable observed entry, exit, transition or fallback.
- `attendance_exception`: missing, duplicate, impossible, late, device-gap or roster mismatch requiring disposition.
- `attendance_correction`: proposed compensating interpretation; it never edits the original event.
- `presence_projection`: rebuildable current/last-known state and confidence.
- `muster_session` and `muster_response`: incident-bound accounting of expected, confirmed-safe, potentially-exposed and unresolved people.
- `attendance_register_generation`: exact event cut, format, hash, generation/attestation authority and printed-copy acknowledgement.

### Presence event types

`SITE_ENTRY`, `SITE_EXIT`, `BELOWGROUND_ENTRY`, `SURFACE_RETURN`, `ZONE_ENTRY`, `ZONE_EXIT`, `MANUAL_PRESENCE`, `MUSTER_CONFIRMED`, `CREDENTIAL_ISSUED`, and `CREDENTIAL_RETURNED` are stable event kinds. Corrections reference originals; event rows are never overwritten or deleted.

## 6. Presence and GIS semantics

Every checkpoint references a versioned governed zone/geometry. Surface checkpoints may use geographic coordinates and geofences. Underground checkpoints use the mine's surveyed coordinate frame and a versioned topology graph.

Presence projection states are:

- `CONFIRMED_AT_CHECKPOINT`: direct trusted reader observation;
- `INFERRED_IN_ROUTE_OR_ZONE`: bounded by the last reader and topology;
- `STALE`: last observation exceeds the configured freshness window;
- `CONFLICTED`: impossible sequence or competing credentials/events;
- `UNKNOWN`: insufficient reliable evidence; and
- `CONFIRMED_SAFE`: recorded in the active muster, without rewriting prior movement.

The UI always displays last-confirmed time, source, confidence and device-health caveat. RFID is checkpoint tracking, not continuous surveillance.

## 7. Lifecycle and exceptions

```text
roster submitted → eligibility checked → shift opened
→ credential issued/bound → presence events ingested
→ live exceptions reconciled → shift close attempted
→ unresolved exceptions reviewed → register generated/attested
```

Required exception handling:

- entry without roster or eligibility;
- rostered worker never appears;
- entry without exit/surface return;
- exit without matching entry;
- repeated/impossible checkpoint sequence;
- same credential observed for two people or distant readers impossibly close in time;
- biometric no-match or duplicate identity candidate;
- reader offline, replayed sequence or clock drift;
- lost/damaged tag or cap-lamp swap;
- emergency evacuation during device/network outage;
- contractor engagement expires mid-shift;
- correction requested after register generation; and
- shift crosses midnight.

Safety does not wait for payroll reconciliation. An unresolved belowground return becomes a high-priority presence exception and feeds incident muster immediately.

## 8. Required capabilities

| Capability | Target |
|---|---|
| `attendance.roster.submit`, `attendance.roster.validate` | shift/mine |
| `attendance.credential.bind`, `attendance.credential.return` | credential assignment |
| `attendance.event.ingest_device` | registered checkpoint device |
| `attendance.record_manual` | shift/person/mine |
| `attendance.monitor` | mine/shift/authorized portfolio |
| `attendance.exception.disposition` | attendance exception |
| `attendance.correction.propose`, `attendance.correction.approve` | correction/event |
| `attendance.register.generate`, `attendance.register.attest` | mine/shift/register |
| `attendance.device.configure`, `attendance.device.health_read` | checkpoint device |
| `muster.open`, `muster.operate`, `muster.read`, `muster.close` | incident/mine/muster |

`attendance.read` remains a privacy-filtered compatibility capability until endpoint migration. None of these capabilities is granted merely by possessing a credential or being the record subject.

## 9. Events and downstream consumers

- Attendance emits presence observed, exception opened/resolved, shift reconciled, register generated, and muster status events.
- Incident management consumes current presence/muster inputs but owns emergency lifecycle.
- During an incident, attendance remains authoritative for presence observations and muster responses; the incident domain owns emergency command, casualties and statutory notification. Missing/stale presence is exported as uncertainty, never translated to safe.
- Contractor management supplies engagement and eligibility; attendance returns approved participation facts.
- Payroll receives an approved projection/export and never mutates source events.
- GIS supplies versioned checkpoints, zones and topology.
- Workflow delivers exceptions and acknowledgements without owning attendance state.
- Analytics consumes de-identified/authorized facts with purpose, retention and minimum-necessary controls.

## 10. Acceptance criteria

1. Mine Manager remains accountable while an appointed Attendance Clerk operates the register.
2. A worker can have multiple belowground entry/return pairs in one shift.
3. Original device/manual events remain visible after correction.
4. An unreturned underground worker appears in emergency muster with last-confirmed checkpoint and confidence.
5. A dead reader creates a coverage gap; it never fabricates absence or presence.
6. Contractor supervisor cannot approve a disputed record for their own workforce alone.
7. Device administrator cannot create human attendance.
8. Fingerprint/RFID prototype events are labelled non-certified and pass through the production-shaped adapter contract.
9. Generated statutory output is reproducible from a hashed event cut and records attestation/print state.
10. Raw biometric templates are absent from Strata unless an approved design explicitly authorizes them.

## 11. Privacy, retention and worker rights

| Purpose | Permitted projection |
|---|---|
| Worker self-service | Own roster, events, exceptions, corrections and register entries |
| Attendance Clerk/shift safety | Named people for the active mine/shift and required history |
| Emergency muster/rescue | Minimum identity/contact, last-confirmed point, freshness and response state |
| Contractor supervisor | Its own current assigned workforce and disputes; no unrelated workers |
| Payroll/billing | Approved interval/export facts, not movement traces or biometric match data |
| Portfolio analytics | Aggregated/de-identified measures by default |
| Regulator | Purpose-logged records within mandate/jurisdiction and applicable identity projection |

Raw biometric templates remain in the approved biometric provider. Strata stores an opaque subject reference, match outcome, assurance/provenance and time only. Health/medical details are not attendance fields. Fine-grained movement is retained only for defined safety/statutory purposes and may have a shorter operational retention than attested registers, correction provenance and incident-held records. Legal/investigation holds suspend disposal.

Workers can see their own records and submit a correction/dispute without gaining authority to rewrite events. Access logs for named-person movement are reviewable. Cross-mine individual tracking, productivity scoring from movement, covert continuous surveillance and automatic disciplinary decisions are prohibited.

## 12. Explicit non-goals

- Selecting a national biometric vendor or RFID frequency/reader topology.
- Claiming prototype hardware is intrinsically safe or approved for mine deployment.
- Continuous exact underground tracking without suitable certified infrastructure.
- Making attendance alone proof of productive work, wages due, or regulatory compliance.
- Claiming the logical model is an approved physical device deployment or final statutory template.

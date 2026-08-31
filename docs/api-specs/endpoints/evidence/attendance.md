# Legacy attendance API — withdrawn

> **Withdrawn from the contract.** The BF-15 one-pair `/attendance/check-in` · `/attendance/check-out` API is **not** the production attendance contract and has no request or response bodies specified here. It is retained only as prototype provenance. Do not implement or extend it.

## Use instead

| Concern | Canonical source |
|---|---|
| API contract | [`../attendance/attendance.md`](../attendance/attendance.md) |
| Domain rules | [`../../../features/attendance/presence-and-attendance-spec.md`](../../../features/attendance/presence-and-attendance-spec.md) |
| Logical model | [`../../../architecture/attendance-data-model.md`](../../../architecture/attendance-data-model.md) |

## Why it was withdrawn

The prototype modelled **one `check_in`/`check_out` pair per `(person_id, mine_id, shift_date)`**, enforced by a `UNIQUE` constraint (`data-model.md §4.3`).

CMR 2017 Reg. 40(3) requires recording a belowground worker's **every** transition below and back to surface within a shift — not merely shift start and end. A single pair per shift-day cannot represent a worker who goes down, surfaces for a fault, and goes down again, and no amount of field addition fixes a schema whose uniqueness constraint forbids the second descent.

The canonical model in [`../attendance/attendance.md`](../attendance/attendance.md) records **presence events**, from which shift pairs, muster rolls, and the Reg. 40(3) register are derived. `RFID_CAP_LAMP` reads there remain explicitly labelled as simulated hardware where simulated (`field-capture-spec.md §8.1`: *faking a live underground demo is worse than not having one*).

## Migration

| Prototype shape | Canonical shape |
|---|---|
| `POST /attendance/check-in` | `POST /attendance-events` with `event_type: "ENTRY"` |
| `POST /attendance/check-out` | `POST /attendance-events` with `event_type: "EXIT"` |
| `GET /attendance/{id}` | `GET /attendance-events/{id}` |
| `GET /attendance` (one row per shift-day) | `GET /attendance-shifts?filter[shift_date]=…`, derived from the event stream |
| `attendance_record.check_in_evidence_id` | `attendance_event.evidence_id` |

`attendance_record` rows created by the prototype are migrated into `attendance_event` pairs by the executable migration; the derived shift view reproduces the old one-row-per-shift-day read without the constraint that made it wrong.

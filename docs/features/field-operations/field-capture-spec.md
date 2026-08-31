# Strata — Field Capture Specification

**Component:** Geo-bound, time-bound evidence capture and its integrity guarantees
**Companion to:** Document Pipeline Spec · Extraction Spec · Authorisation Spec · Obligation Register Spec
**Status:** Design spec, ready to build

---

## 0. Read this first

**What this component does:** lets someone standing at a bench, a conveyor or a pit-head record what they see, and produces a record that can still be trusted three years later in a Court of Inquiry.

**The whole problem in one sentence:**

> A photograph proves that *something* was photographed. It does not prove *where*, *when*, or *by whom* — and in an environment where people are paid by the task, all three of those are worth faking.

**The design goal is not to make spoofing impossible.** It isn't. The goal is:

> **Every piece of evidence carries an honest verdict about how much it can be trusted, and no evidence silently becomes proof of compliance.**

Same philosophy as extraction. A system that says *"location plausible, time bounded to a 40-minute window, device attested"* is far more useful than one that shows a green tick it cannot justify.

**Three terms:**

| Term | Meaning |
|---|---|
| **Geo-binding** | Tying a record to a place, with a stated confidence and radius |
| **Time-binding** | Tying a record to a time — often an *interval*, not an instant (§4) |
| **Provenance** | The full chain: who captured it, on what device, under what appointment, and how we know |

---

## 1. The adversary — be specific about this

Vague talk about "security" gets nowhere. Name the actual attacks, because each needs a different answer.

| # | Attack | How | Difficulty |
|---|---|---|---|
| 1 | **Mock location** | Developer-options mock provider, or a mock-location app | Trivial |
| 2 | **Rooted device** | Patch the GPS stack or the app itself | Moderate |
| 3 | **Hardware GNSS simulator** | Broadcast a synthetic constellation | Expensive, real |
| 4 | **Clock manipulation** | Change device time before capture | Trivial |
| 5 | **Gallery injection** | Take a photo elsewhere, import it | Trivial |
| 6 | **EXIF forgery** | Rewrite embedded coordinates and time | Trivial |
| 7 | **Replay of a real photo** | Photograph a printed or on-screen image | Easy, hard to catch |
| 8 | **Delegation** | Hand your phone and credentials to someone else | Trivial, social |
| 9 | **Deferred capture** | Genuinely at the site, but record it days later | Common, often innocent |
| 10 | **Backdated sync** | Hold offline records and submit them as if fresh | Moderate |

**Attacks 1, 4, 5 and 6 are the everyday ones**, and they're the ones a naive `getCurrentPosition()` plus EXIF implementation loses to in ten seconds. Those must be closed.

**Attack 7 is honestly hard.** Say so rather than claiming otherwise — a team that admits one unsolved case is more credible than one claiming a clean sweep.

**Attack 8 is not a technical problem.** It's why the record binds an *appointment*, and why the audit trail matters more than the detection.

---

## 2. Two tiers, because physics

The single most important scoping decision, and the one that will separate you from every other team.

| | Opencast | Underground |
|---|---|---|
| **GPS** | Works | **Does not work at all.** Rock blocks GNSS. |
| **Consumer smartphone** | Fine | **A Regulation 181(3) violation** inbye of the last ventilation connection in a gassy seam — equipment must be Ex d, Ex e or Ex i |
| **Position source** | GNSS + anti-spoof | RFID cap-lamp tags read at fixed points |
| **Position type** | Coordinates + accuracy radius | **Topological** — "at reader R-14", not a lat/long |
| **Time source** | Device + server + TSA | **Reader infrastructure clock** — fixed, mains-powered, trusted |
| **Capture** | Live in the app | Recorded on the approved medium, digitised at pit-head, bound to the RFID trace |

**Every team that promises "geo-tagged underground inspections" is promising something physically impossible and does not know it.** That's your opening in the Q&A, and it costs you nothing to be right about.

---

## 3. Geo-binding

### 3.1 What we actually record

Not a point. A claim with its own uncertainty:

```json
"location": {
  "lat": 22.35102, "lon": 82.56418,
  "accuracy_m": 8.4,
  "altitude_m": 211.7, "altitude_accuracy_m": 12.0,
  "provider": "GNSS",
  "satellites_used": 14,
  "constellations": ["GPS","GLONASS","NavIC","Galileo"],
  "mean_cn0_dbhz": 34.2,
  "is_mock": false,
  "captured_at_fix": "2026-08-20T09:14:22Z",
  "fix_age_ms": 1830
}
```

### 3.2 Accuracy is not a decoration

A fix reporting ±500 m inside a 200 m geofence **proves nothing**, and a system that shows it as a green tick is lying.

Rule: the verdict compares the *distance to target* against the *accuracy radius*.

```
distance_to_asset = 640 m
accuracy_radius   = 8 m
geofence_radius   = 150 m
→ 640 − 8 = 632 m outside, unambiguously. SUSPECT.

distance_to_asset = 160 m
accuracy_radius   = 90 m
geofence_radius   = 150 m
→ could be inside. UNVERIFIED, not SUSPECT.
```

The second case is the one naive implementations get wrong in both directions.

### 3.3 Geofence against what?

Not "the lease." Leases are square kilometres — being inside one proves almost nothing.

Bind to the **specific asset the obligation or defect refers to**: a bench, a dump, a conveyor drive head, a plantation block, a pit-head. That geometry comes from the asset register and the lease/mining-plan geometry.

```
evidence → obligation_instance → at_asset → geometry
evidence → defect → at_asset → geometry
```

Tolerance is per purpose and target kind, not global. A haul road runs kilometres; a conveyor drive head is a point. The GIS domain publishes the effective spatial policy and immutable target geometry version; the asset only supplies stable identity. Every verification retains those versions.

### 3.4 Anti-spoof signals, layered

No single check is sufficient. Combine:

| Layer | Signal | Catches |
|---|---|---|
| **Platform flag** | `Location.isMock()` (API 31+) | Attack 1, unrooted |
| **Device attestation** | Play Integrity — device integrity verdict, app recognised | Attacks 2, and tampered builds |
| **Raw GNSS** | `GnssMeasurement` — C/N0 distribution, AGC level, constellation mix | Attacks 1, 3. Simulators produce implausibly uniform C/N0 and wrong AGC |
| **Constellation plausibility** | Are the satellites claimed actually overhead at that time and place? | Attack 3 |
| **Kinematic plausibility** | Speed between consecutive fixes; 400 km/h between two captures | Attacks 1, 3 |
| **Corroboration** | Cell tower / Wi-Fi BSSIDs seen at capture vs expected for that area | Attacks 1, 3 |
| **Capture path** | Image came from the app's camera pipeline, not the gallery | Attacks 5, 6 |
| **Sensor coherence** | Accelerometer/barometer activity consistent with a person walking a site | Attacks 5, 7 (partially) |

**Raw GNSS measurements are the differentiator.** They've been mandatory on Android 10+, almost nobody uses them, and they're what separates "we check `isMock`" from a real anti-spoofing story. Even a simple check — *are the reported C/N0 values distributed like a real sky view, or suspiciously flat?* — is a defensible signal.

### 3.5 Photos come from our camera, or they're marked

Two capture paths, treated differently:

- **In-app camera** — frames never touch shared storage; hashed at capture; sensor and location context bound at the same instant. `capture_path: DIRECT`.
- **Gallery import** — allowed, because sometimes it's legitimate, but marked `capture_path: IMPORTED`, EXIF treated as **untrusted metadata**, and verdict capped at `UNVERIFIED`.

**Never trust EXIF for location or time.** It is plain, editable metadata. Record it for comparison — a mismatch between EXIF and our own captured context is itself a signal — but it is never the source of truth.

---

## 4. Time-binding — the part everyone gets wrong

### 4.1 The device clock is attacker-controlled

`System.currentTimeMillis()` is whatever the user set it to. It is not evidence of anything.

Three clocks, three purposes:

| Clock | Trust | Use |
|---|---|---|
| Wall clock (`currentTimeMillis`) | **None** | Record it; compare it; never rely on it |
| Monotonic (`elapsedRealtimeNanos`) | High **within one boot** — can't be set backwards | Measuring intervals |
| Server / TSA time | Authoritative | Anchoring |

### 4.2 Online capture: a timestamp

Device sends the record; the server stamps it on receipt; an RFC 3161 Time Stamp Authority token binds the hash to a trusted time. Clean.

### 4.3 Offline capture: an interval, not an instant

**This is the honest answer and it's better than what competitors will claim.**

Offline, you cannot obtain trusted time. So don't pretend to. Instead, *bound* it:

```
last trusted anchor:   2026-08-20T08:00:00Z   (last server sync, TSA-anchored)
monotonic at anchor:   4,102,338 ms since boot
monotonic at capture:  8,564,901 ms since boot
elapsed:               4,462,563 ms  ≈ 74 min 22 s
→ capture at approximately 2026-08-20T09:14:22Z

first sync after:      2026-08-20T11:47:03Z   (server-stamped)

VERIFIED WINDOW: [08:00:00, 11:47:03]
MONOTONIC ESTIMATE: 09:14:22  (within window ✓)
```

The record stores:

```json
"time": {
  "device_wall_clock": "2026-08-20T09:14:22Z",
  "monotonic_ns": 8564901000000,
  "boot_id": "b7f2...",
  "anchor_server_time": "2026-08-20T08:00:00Z",
  "anchor_monotonic_ns": 4102338000000,
  "sync_server_time": "2026-08-20T11:47:03Z",
  "verified_window": ["2026-08-20T08:00:00Z","2026-08-20T11:47:03Z"],
  "monotonic_estimate": "2026-08-20T09:14:22Z",
  "estimate_in_window": true
}
```

**Why this is strong:**
- The window is provable — bounded by two server-stamped events
- The monotonic estimate can't be moved backwards without a reboot, and `boot_id` detects reboots
- If the wall clock disagrees with the monotonic estimate by more than a tolerance, that's a **clock-tampering flag**
- Longer offline periods produce wider windows, which is the truth — a record synced after three days underground genuinely is less precisely timed

**Say this in the Q&A.** *"Offline evidence carries a bounded time interval, not a false precision, and the interval is provable from two server-anchored events."* It's a real answer to a question most teams haven't thought about.

### 4.4 Deferred capture is not fraud

Someone genuinely at the bench who photographs it and syncs two days later is normal. The system records the window honestly and lets the reviewer judge. Don't build a system that punishes bad connectivity — you'll get a system nobody uses.

---

## 5. The evidence record

```json
{
  "evidence_id": "ev:gev_20260820_0001",
  "content_hash": "sha256:aa31c9...",
  "prev_hash": "sha256:9f02be...",
  "capture_path": "DIRECT",
  "media_type": "image/jpeg",

  "captured_by": "user:s_das",
  "appointment_ref": "appt:gevra_so_2024_open",
  "device": {
    "install_id": "dev:8823...",
    "integrity_verdict": "MEETS_DEVICE_INTEGRITY",
    "os": "Android 14",
    "app_version": "0.9.3",
    "boot_id": "b7f2..."
  },

  "location": { /* §3.1 */ },
  "time":     { /* §4.3 */ },

  "for_instance": "inst:ec_gevra_c17@FY2026H2",
  "for_defect":   null,
  "at_asset":     "bench:gevra_ocp/e_rl210",

  "verdict": {
    "level": "SUSPECT",
    "reasons": ["DISTANCE_MISMATCH"],
    "detail": { "distance_m": 640, "geofence_m": 150, "accuracy_m": 8.4 }
  },

  "sync": {
    "queued_at_monotonic_ns": 8564902000000,
    "received_at": "2026-08-20T11:47:03Z",
    "tsa_token": "MIIFxA..."
  },
  "status": "FLAGGED"
}
```

### 5.1 Hash chaining

Each device maintains an append-only chain: every record's `prev_hash` points at the previous record from that device. On sync the server verifies continuity.

**What this gives you:** you cannot delete or reorder a record without breaking the chain. A gap is detectable. Selectively dropping the one photo that showed the problem stops being possible.

**What it does not give you:** protection against a record never being created. Chaining proves integrity of what exists, not completeness. Be precise about that distinction — a judge may press on it.

Server side, periodically publish a Merkle root over all chains, anchored with an RFC 3161 timestamp. That's your tamper-evident audit trail. **Not blockchain** — no consensus problem exists here, and hash-chaining plus trusted timestamping gives the same integrity guarantee with no validator set to explain.

---

## 6. The verdict model — four levels, never binary

Same reasoning as extraction confidence: a single boolean hides the information that matters.

| Verdict | Meaning | Consequence |
|---|---|---|
| **VERIFIED** | Inside geofence with adequate accuracy, device attested, time anchored, direct capture | Can satisfy an obligation |
| **PLAUSIBLE** | Minor issues — wide accuracy radius, long offline window, but nothing contradictory | Can satisfy; noted on the record |
| **UNVERIFIED** | Cannot confirm or deny — imported image, no GNSS lock, unattested device | **Cannot alone satisfy an obligation.** Needs corroboration or sign-off. |
| **SUSPECT** | Active contradiction — mock flag, distance mismatch, clock skew, broken chain | Blocks closure. Human review required. |

**Never auto-reject and never auto-delete.** A SUSPECT record is preserved, flagged and escalated — it's evidence of something, just possibly not of compliance.

### 6.1 The closure block

```python
def can_close_with(evidence_list) -> tuple[bool, str]:
    if any(e.verdict.level == "SUSPECT" for e in evidence_list):
        return False, "SUSPECT_EVIDENCE_PRESENT"
    if all(e.verdict.level == "UNVERIFIED" for e in evidence_list):
        return False, "NO_VERIFIED_EVIDENCE"
    return True, "OK"
```

**This is your demo moment.** The photo that should have closed condition 17 is flagged because its GPS put it 640 m from the bench, and closure is blocked. Fifteen seconds, entirely legible to a non-technical judge.

### 6.2 Retroactive invalidation

If evidence is later found spoofed, you must be able to answer: *what did we conclude based on it?*

Because signed manifests reference evidence by hash (Document Pipeline §6.2), this is one query:

```sql
SELECT manifest_id, attested_by, attested_at
FROM manifest_statements
WHERE evidence_hash = 'sha256:aa31c9...';
```

Every affected attestation is identifiable, and every obligation instance it closed reopens for review. **No PDF-signature scheme gives you this.**

---

## 7. Offline sync

| Requirement | Approach |
|---|---|
| Survives app kill mid-upload | Persistent queue in local DB, resumable chunked upload |
| Survives weeks offline | No TTL on the queue; widening time window is the honest cost |
| Conflict resolution | Evidence is append-only — no conflicts by construction. Defect/finding edits use last-write-wins with both versions retained. |
| Ordering | Chain order preserved; server rejects out-of-order chain links |
| Storage pressure | Downscale to a bounded resolution at capture; hash the *stored* bytes, not the sensor original |
| Partial sync | Per-record acknowledgement, not batch |
| Schema drift after weeks offline | Version every record; server migrates on receipt, never rejects |

Use something battle-tested — WatermelonDB or PowerSync — rather than hand-rolling. Hand-rolled offline sync is where hackathon projects go to die.

---

## 8. Underground

### 8.1 The reader graph

Fixed RFID readers at the pit-head, shaft bottom, district entries and key junctions. Cap-lamp tags are powered by the lamp, so no separate maintenance.

Position is **topological**, not coordinate-based:

```
reader:gev_pithead ──► reader:gev_shaft_btm ──► reader:gev_dist_3 ──► reader:gev_face_3b
```

A record captured underground binds to *the reader trace of the person who captured it*: "between reader R-14 (09:02) and reader R-17 (09:41)". That's a provable location claim, in a form GPS could never provide down there.

**Time is trusted here**, because readers are fixed, mains-powered infrastructure with a synchronised clock — a better time source than any handheld.

### 8.2 Reg 40(3) attendance, for free

CMR 2017 Regulation 40(3) requires every person's name recorded before proceeding to work and after ending the shift, and for belowground workings **every time** they go below or return to surface. It permits an electronic punching or registry system **approved by the Chief Inspector**, and requires a hard printed copy in the register.

The pit-head reader satisfies the recording requirement; the system generates the printed copy. **Design toward the Chief Inspector approval criteria and say so** — that's the actual statutory blocker to paperless attendance, and no competing team will know it exists.

Second benefit: person-location for rescue. Who is below, and where they were last seen.

### 8.3 Honest scope

You will not have RFID hardware. **Simulate the reader graph** and say plainly that it's simulated. The design argument and the Reg 40(3) analysis are the deliverable; the hardware is a procurement line. Faking a live underground demo is worse than not having one.

---

## 9. Authorisation

Capture is not a free-for-all. Three separate permissions:

```
type evidence
  relations
    define at_mine:      [mine]
    define captured_by:  [user]
    define for_instance: [obligation_instance]
    define for_defect:   [defect]

    define can_capture:      internal_viewer from at_mine
                             or contractor_capturer from at_mine
    define viewer:           internal_viewer from at_mine or captured_by
    define published_viewer: published_viewer from at_mine
    define can_override_verdict: manager from at_mine
```

**Case 1 — Safety Officer captures at his mine.** Valid appointment → ALLOW. The `appointment_ref` is written into the record, so the evidence carries the authority under which it was taken.

**Case 2 — Contractor supervisor captures against his own engagement.** ALLOW, scoped to findings where his org is `responsible_org`. Not general site access.

**Case 3 — Contractor captures after engagement expiry.** `active_engagement` condition fails → DENY. He may still *read* historic findings; he may not create new evidence.

**Case 4 — Manager overrides a SUSPECT verdict.** Allowed, because sometimes the device is simply wrong and a mine cannot be paralysed by a bad GPS chip. **But:** the override requires a written reason, is signed, is logged, and the original verdict is never erased. An override is itself an auditable event, and a Manager with a high override rate is a metric worth surfacing.

**Case 5 — Regulator views evidence.** Published state only, purpose logged, and worker identities redacted per Extraction Spec A4.

---

## 10. Failure modes

| Failure | Handling |
|---|---|
| No GNSS lock (deep pit, bad weather) | `UNVERIFIED`, not SUSPECT. Offer manual asset selection, flag it. |
| Accuracy radius exceeds geofence | `UNVERIFIED`. Never a false green tick. |
| Device clock drifted innocently | Monotonic estimate governs; wall-clock disagreement flagged, not fatal |
| Device reboots offline | `boot_id` changes; monotonic chain breaks; window widens to the next sync. Correct behaviour. |
| Chain gap on sync | Reject the orphaned segment, alert, preserve everything |
| Play Integrity unavailable (older device, no Play Services) | `UNVERIFIED` tier, not blocked. Common in the field. |
| Legitimate gallery import | Allowed, capped at `UNVERIFIED`, needs corroboration |
| Photo of a photo (attack 7) | **Partially detectable at best.** Sensor coherence helps; be honest that this is the weakest link. |
| Phone lost with unsynced records | Records are gone. Chain gap proves records existed and were lost — better than silence. |
| Evidence later found spoofed | §6.2 retroactive invalidation |
| Manager overrides everything | Track override rate per user; surface it. Detection, not prevention. |

---

## 11. Scope

### In

- [ ] In-app camera capture with hash-at-capture
- [ ] Location record with accuracy, provider, constellation, mock flag
- [ ] Raw GNSS signal checks (C/N0 distribution, constellation plausibility)
- [ ] Play Integrity device attestation
- [ ] Three-clock time model with bounded offline windows
- [ ] Per-device hash chain, server-side continuity verification
- [ ] RFC 3161 timestamping + periodic Merkle anchoring
- [ ] Asset-level geofencing with per-asset radius
- [ ] Four-level verdict model with reasons
- [ ] Closure blocking on SUSPECT / all-UNVERIFIED
- [ ] Offline queue with resumable upload and append-only semantics
- [ ] Simulated underground reader graph + Reg 40(3) attendance register and printed output
- [ ] ReBAC on capture, view, override
- [ ] Signed, reasoned verdict override
- [ ] Retroactive invalidation query

### Out — on the slide, with reasons

- **Real Ex-certified underground hardware.** Named as the procurement path. You will not buy an intrinsically safe handset.
- **Actual RFID readers.** Simulated, stated as simulated.
- **Photo-of-a-photo detection.** Partially addressed; genuinely hard; do not claim it solved.
- **Video evidence.** Storage and sync cost is disproportionate for eight weeks.
- **Biometric capture binding.** Face-match the capturer to the appointment holder — closes attack 8, but adds a privacy regime you don't have time to design responsibly.
- **Hardware-backed key attestation with per-device signing keys.** The right long-term answer for chain integrity. Roadmap.
- **iOS.** Android only.

---

## 12. Tests

| # | Scenario | Expected |
|---|---|---|
| 1 | Capture at the bench, good lock, attested device | `VERIFIED` |
| 2 | Capture 640 m from the bench, 8 m accuracy | `SUSPECT`, reason `DISTANCE_MISMATCH` |
| 3 | Capture 160 m away with 90 m accuracy, 150 m fence | `UNVERIFIED`, not SUSPECT |
| 4 | Mock location provider enabled | `SUSPECT`, reason `MOCK_LOCATION` |
| 5 | Rooted device, integrity check fails | `UNVERIFIED` at best; flagged |
| 6 | GNSS simulator producing flat C/N0 | Flagged `IMPLAUSIBLE_SIGNAL` |
| 7 | Device clock set 3 days back | Monotonic estimate governs; `CLOCK_SKEW` flag |
| 8 | Captured offline, synced 4 hours later | Window `[anchor, sync]`, estimate inside window |
| 9 | Captured offline, device rebooted before sync | Window widens; `boot_id` change recorded |
| 10 | Gallery import with forged EXIF | `capture_path: IMPORTED`, capped `UNVERIFIED`, EXIF mismatch flagged |
| 11 | Two consecutive fixes implying 400 km/h | `KINEMATIC_IMPLAUSIBLE` |
| 12 | Record deleted from device before sync | Chain gap detected on sync |
| 13 | Close obligation using only SUSPECT evidence | **Blocked** |
| 14 | Close obligation using only UNVERIFIED evidence | Blocked, `NO_VERIFIED_EVIDENCE` |
| 15 | Manager overrides a SUSPECT verdict | Allowed with reason; signed; original verdict retained |
| 16 | Safety Officer captures after appointment lapse | DENY |
| 17 | Contractor captures against another contractor's finding | DENY |
| 18 | Contractor captures after engagement expiry | DENY; historic read still ALLOW |
| 19 | Evidence hash marked spoofed | All signed manifests referencing it returned; instances reopened |
| 20 | Underground capture bound to reader trace | Location = topological interval between two readers |
| 21 | Belowground entry and exit | Reg 40(3) register row + printed copy generated |
| 22 | Regulator views evidence with a worker's face/name | Identity redacted, hazard visible |

**Tests 2, 8 and 13 are the demo.** Test 15 is the one a thoughtful judge will ask about — because a system that can't be overridden is a system that will be worked around.

---

## 13. Three sentences for the jury

> **One.** We never treat a photograph as proof of location — every record carries the accuracy radius, the satellite signal profile, the device integrity verdict and how the fix was obtained, and a fix too imprecise to confirm the claim is reported as unverified rather than shown as a green tick.

> **Two.** Offline evidence carries a bounded time interval rather than a false instant, provable from two server-anchored events either side of it, so a record synced three days later is honestly less precisely timed instead of dishonestly precise.

> **Three.** The mobile app does not work underground and should not — GPS does not penetrate rock and a consumer smartphone is a Regulation 181(3) violation inbye of the last ventilation connection, so underground provenance comes from cap-lamp RFID readers, which also satisfies the Regulation 40(3) attendance record the law already requires.

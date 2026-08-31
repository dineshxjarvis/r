# Integrations — Explained
### SIH PS-24 | Ministry of Coal | AI-Based Smart Governance Platform

These are the external government systems and data sources your platform needs to talk to. Each one feeds real-world data *into* your Obligation Register (so obligations, due dates, and evidence stay accurate) or lets your platform *push* compliance data *out* to the regulator.

> **Note:** A few of these (marked ⚠️) are less publicly documented / project-specific acronyms. I've given the most likely explanation based on standard naming conventions in Indian coal/mining governance — verify against your actual SIH problem statement document, since exact system names can vary by year.

> **Production authority note:** This file is a landscape/use-case inventory, not an adapter contract or source-of-truth declaration. Every real integration must use the governed definition, deployment, semantic-evidence and reconciliation rules in [`../features/integrations/integration-platform-spec.md`](../features/integrations/integration-platform-spec.md). Unverified expansions must not become code, UI labels or schemas until the system owner confirms them.

---

## PARIVESH
**Full form:** Pro-Active and Responsive facilitation by Interactive, Virtuous and Environmental Single-window Hub

**What it is:** The Ministry of Environment, Forest and Climate Change's single-window portal for Environmental Clearance (EC), Forest Clearance, Wildlife Clearance, and Coastal Regulation Zone (CRZ) Clearance.

**Why your system needs it:** Many obligations only apply to mines that hold a specific clearance (e.g. "requires_permission": "EC_CLEARANCE" from the applicability rules). PARIVESH is the source of truth for which mines have which clearances, and what conditions were attached to them (conditions often *become* obligations themselves — e.g. "submit compliance report every 6 months post-EC").

**Integration use case:** Pull clearance status + conditions per mine → auto-generate obligation instances tied to those conditions.

---

## DGMS / Shram Suvidha
**What it is:**
- **DGMS** (Directorate General of Mines Safety) — the statutory body under the Ministry of Labour that regulates mine safety in India (inspections, accident reporting, safety standards under the Mines Act 1952 and CMR 2017).
- **Shram Suvidha Portal** — a Ministry of Labour single-window portal for labour law compliance, inspections, and reporting across various labour statutes.

**Why your system needs it:** DGMS is the source for safety-related regulatory obligations (most of your "Safety" category obligations trace back to DGMS rules) and for accident/inspection records. Shram Suvidha covers labour-related obligations (contractor labour reporting, wage compliance, etc.).

**Integration use case:** Sync accident reports and inspection closures from DGMS → auto-trigger "after_event" obligations (e.g. "submit corrective action report within 15 days of inspection closure").

---

## ICIS
**Likely full form:** Integrated Coal Inventory System *(or, in some contexts, "Integrated Compliance Information System")*

**What it is:** A Ministry of Coal / Coal India system tracking coal stock, production, and inventory data across mines.

**Why your system needs it:** Production-linked applicability rules (e.g. `"production_threshold_tpa": 50000`) depend on accurate, current production figures. Manually entering these invites errors and stale data.

**Integration use case:** Pull live production tonnage per mine → automatically re-evaluate which obligations newly apply (or stop applying) as a mine crosses production thresholds.

---

## SWCS / PRIMS ⚠️
**Likely meaning:**
- **SWCS** — Single Window Clearance System (a common pattern in Indian state/central clearance portals)
- **PRIMS** — Project/Permission Information Management System *(exact expansion varies by state; some states use "PRIMS" for mining lease and permission tracking)*

**What it likely is:** A permissions/licensing tracking system — mining lease status, renewal dates, statutory permissions beyond environmental clearance.

**Why your system needs it:** Lease and permission validity dates directly gate obligation applicability (a mine with an expired lease shouldn't be generating new production obligations) and are themselves obligations (lease renewal deadlines).

**Integration use case:** Pull lease/permission expiry dates → feed into the deadline engine to raise renewal-obligation alerts well before expiry (lead_days).

---

## NCMSR ⚠️
**Likely full form:** National Coal Mine Safety Repository / National Coal Mine Statistics Repository *(exact system unconfirmed — check your problem statement PDF for the precise name)*

**What it likely is:** A central repository of mine safety statistics and records, used for reporting and audit at the national level.

**Why your system needs it:** Provides a cross-check / reconciliation source — data your mines report locally should match what's centrally recorded, useful for the "Claimed vs Verified" and audit trail components.

**Integration use case:** Periodically reconcile verified obligation instances against NCMSR's central records to catch discrepancies.

---

## ICCC and IoT feeds
**Full form:** Integrated Command and Control Centre

**What it is:** A centralized monitoring hub (common in smart-city and smart-industry projects) that aggregates real-time sensor and camera data — in this context, from mine-site IoT devices: gas sensors, dust monitors, CCTV, vehicle tracking, structural sensors, etc.

**Why your system needs it:** Live sensor data can supply governed evidence and trigger evaluation, coverage or incident rules; it cannot automatically satisfy an obligation or make a legal non-compliance conclusion. For example, a validated dust result may support a monitoring instance, while an acute signal may create an incident candidate under a reviewed rule.

**Integration use case:** Stream real-time sensor alerts → auto-create EVENT-triggered obligation instances; also usable as supporting evidence attached to existing instances (reducing manual evidence upload).

---

## CPCB air quality
**Full form:** Central Pollution Control Board

**What it is:** India's apex environmental regulatory body; it operates the national Continuous Ambient Air Quality Monitoring (CAAQM) network and sets pollution standards (like the dust/particulate limits referenced in your CMR Rule 128 example).

**Why your system needs it:** CPCB is both a **regulatory source** (their standards define what "compliant" dust/emission levels are) and a **live data source** (their monitoring stations, where present near a mine, provide independent air quality readings).

**Integration use case:** Cross-verify a mine's self-reported dust sampling data against nearby CPCB monitoring station readings — flag large discrepancies for review (ties into evidence verification and statutory conflict detection, e.g. differing dust limit standards).

---

## Drone and survey data
**What it is:** Aerial survey data — drone imagery/LiDAR used for mine boundary verification, overburden/dump monitoring, plantation and reclamation progress, and illegal mining detection.

**Why your system needs it:** Several environmental obligations (afforestation targets, mine closure/reclamation progress, boundary compliance) are hard to verify from paper evidence alone. Drone imagery gives visual, geo-tagged, time-stamped proof.

**Integration use case:** Attach drone survey imagery as evidence for land reclamation / plantation obligations; use area-change detection to flag when a mine's claimed progress doesn't match the actual surveyed footprint.

---

## How these fit into the Obligation Register

```
EXTERNAL SYSTEMS                    →   OBLIGATION REGISTER COMPONENT
─────────────────────────────────────────────────────────────────────
PARIVESH (EC/Forest/CRZ status)     →   Applicability Rules + new obligations
                                         from clearance conditions

DGMS / Shram Suvidha                →   Safety & labour obligation source;
(inspections, accidents)                event triggers (after_event deadlines)

ICIS (production data)              →   Applicability Rules
                                         (production_threshold_tpa)

SWCS / PRIMS (lease & permissions)  →   Applicability Rules + renewal
                                         obligations + deadline alerts

NCMSR (central safety records)      →   Claimed vs Verified reconciliation
                                         (cross-check against central data)

ICCC + IoT feeds                    →   Candidate evaluations/incidents +
(sensors, cameras)                      governed supporting evidence

CPCB air quality                    →   Evidence verification (cross-check
                                         self-reported vs independent data) +
                                         regulatory standard source

Drone / survey data                 →   Evidence for land/reclamation
                                         obligations (geo-tagged proof)
```

**Practical note for your 36-hour build:** You almost certainly won't get live API access to all of these during a hackathon. The realistic move is to **mock/simulate** 2–3 of them (e.g. a fake PARIVESH clearance feed, a fake IoT sensor feed) with sample JSON, and demo the *integration pattern* — show judges the obligation register reacting to incoming external data, even if the data is simulated rather than live.

## Filing integration boundary

Reporting produces an immutable package and owns the filing lifecycle. An adapter may translate/transmit it and return attempts, receipts and remote status events; it never marks an obligation satisfied or invents authority acknowledgement. HTTP success, email delivery and portal upload completion are transport evidence. `ACKNOWLEDGED` requires a correlated receiver reference/evidence, and `ACCEPTED` requires an authority status where that authority exposes one. Unknown outcomes reconcile before retry to avoid duplicate filings.

---

*Prepared for SIH 2026 — PS-24 Ministry of Coal*
*Some integration names marked ⚠️ are based on standard naming conventions — confirm exact system names against your official problem statement document.*

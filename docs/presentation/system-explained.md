# Strata — The Whole System Explained Simply

This document assumes the reader knows nothing about coal compliance, AI, RBAC, ReBAC, OCR or audit systems.

---

## 1. What problem are we solving?

A coal mine must obey many requirements. These requirements come from laws, regulations, environmental clearances, permissions, inspection notices, contracts and internal safety rules.

Today, the requirement may be inside a 70-page PDF. Its deadline may be tracked in one officer's spreadsheet. Proof may be a photograph on somebody's phone. An inspection finding may be in a paper register. Management may only learn about the problem when a report is compiled later.

Strata puts that chain into one system:

```text
What must be done
→ who must do it
→ when it is due
→ what proves it
→ what happens if it fails
→ who verifies the fix
→ what management and regulators may see
```

## 2. Is Strata just a dashboard?

No. A dashboard only displays information. Strata first creates and governs the information:

- It reads documents and proposes obligations.
- A human confirms what the document actually requires.
- It creates dated tasks for the applicable mines.
- It captures field evidence.
- It creates findings and corrective actions when something fails.
- It routes alerts to the correct current authority.
- It enforces who may verify or close an item.
- It then produces dashboards from those governed records.

## 3. Is Strata one portal or an integration layer?

Both, at different stages.

The production destination is one Ministry of Coal portal for applications, clearances, returns, production, accidents/audits and operational compliance. Existing systems cannot be turned off on day one because they contain live records, statutory workflows and links to other ministries.

Therefore deployment is phased:

1. Strata becomes the single user-facing front door.
2. It exchanges data with existing portals during transition.
3. Shared identity, mine records and data definitions remove duplicate entry.
4. Workflows owned by the Ministry of Coal migrate into Strata after functional parity.
5. Duplicated SWCS functions may then be retired.
6. Workflows legally owned by other authorities, such as PARIVESH or DGMS, remain federated unless those authorities formally migrate them.

## 4. What is a document in Strata?

A document is not merely an attachment. It can play several roles:

| Document | What it does |
|---|---|
| Law/regulation/clearance | Creates requirements |
| Compliance report | Claims requirements were met |
| Inspection report | Reports observations or violations |
| Accident form | Reports an event |
| Lab certificate/photo | Provides evidence |
| Contractor licence | Proves validity or eligibility |

Strata keeps the exact original file. OCR text, AI output and human corrections are separate layers linked back to the original page.

## 5. What happens after a document is uploaded?

1. **Permission check:** Is this user allowed to upload this document type for this mine?
2. **Safety checks:** Verify file type, size and malware status.
3. **Immutable storage:** Store the original bytes and their SHA-256 hash.
4. **OCR:** Read scanned pages while preserving word locations.
5. **Classification:** Determine whether it is a clearance, inspection, report, certificate, etc.
6. **Segmentation:** Break it into conditions, clauses, tables or form fields.
7. **Extraction:** AI proposes structured information.
8. **Human review:** A reviewer accepts, edits, rejects or splits the proposals.
9. **Publication:** Confirmed objects become active in the correct register.
10. **Optional signature:** A statutory attestation signs a manifest of the exact claims and evidence.

## 6. Why keep the original if OCR already extracted the text?

OCR can be wrong. AI can be wrong. A human correction can also be challenged later.

Keeping the original means a reviewer can click an obligation and see the exact highlighted sentence that produced it. Historical conclusions remain defensible.

## 7. What is an obligation?

An obligation is a reusable definition of something that must be done.

Example:

> “Conduct groundwater testing every quarter and submit results within 15 days after the quarter.”

The obligation records:

- required action;
- legal source;
- responsible post;
- which mines it applies to;
- frequency;
- due-date rule;
- required evidence; and
- consequence or severity.

## 8. What is an obligation instance?

The obligation is the rule. An instance is one dated piece of work.

```text
Obligation: Submit a groundwater report quarterly

Instances:
- Gevra, Jan–Mar 2026, due 15 Apr 2026
- Gevra, Apr–Jun 2026, due 15 Jul 2026
- Dipka, Jan–Mar 2026, due 15 Apr 2026
```

The dashboard counts and tracks instances because that is where actual work happens.

## 9. How does Strata know whether an obligation applies?

It evaluates applicability rules using mine information such as:

- opencast or underground;
- production threshold;
- workforce size;
- clearances held;
- gassiness class;
- named mine/project;
- geography; and
- mining method.

If Strata cannot decide, it says `UNRESOLVED` and sends the case for review. It does not assume the obligation applies everywhere, because false obligations create alert fatigue and destroy trust.

## 10. What is evidence?

Evidence is a record used to support a compliance claim or corrective action.

It can include:

- direct-camera photograph;
- laboratory report;
- signed NIL return;
- sensor reading;
- inspection form;
- attendance record;
- drone/survey result; or
- another official document.

Evidence is linked to the obligation instance, defect or corrective action it is meant to prove.

## 11. Why isn't a photo automatically proof?

A photo may be old, imported, edited, captured elsewhere or photographed from another screen.

Strata therefore records the capture path, location, accuracy, target asset, time confidence, device integrity signals and content hash. It gives the evidence an explainable verdict rather than a dishonest yes/no tick.

## 12. What happens when the phone has no network?

The field app writes the record to a persistent local database first. The user can close the app or restart the phone without losing the queued record. When connectivity returns, it uploads records individually and receives acknowledgements.

Offline time cannot be proven to the exact second. Strata records an honest interval bounded by the last trusted connection and the next server receipt, plus a monotonic estimate when available.

## 13. Why Android instead of only a web app?

A dedicated Android application can control direct-camera capture, collect device/GNSS signals, maintain a persistent offline queue and integrate with device-attestation services. A browser/PWA cannot make the same evidence-integrity claims reliably.

The planned mobile app is limited to assigned inspectors and field workers performing field capture/work. Other roles use the responsive web portal; dedicated mobile pages for managers, contractors, applicants, grievance handlers, corporate users and other regulators are `TBD`.

## 14. What is the difference between observation, defect, finding and CAPA?

| Object | Plain meaning | Example |
|---|---|---|
| Observation | One report of something seen | “No berm observed at east haul road” |
| Defect | The real-world problem behind reports | Missing berm at Bench RL 210E |
| Finding | Formal conclusion that a requirement was breached | Non-compliance with cited safety rule |
| CAPA | Corrective and preventive work to fix and stop recurrence | Build berm and change inspection/control process |

Three people can report one defect. One defect becomes a formal finding only when tied to a requirement. A finding may require more than one CAPA.

## 15. Why not call everything a violation?

Because that would turn every informal safety report into a legal accusation. Workers must be able to report an unsafe condition before someone has mapped it to a statutory clause. Separating the objects preserves both openness and legal precision.

## 16. Who assigns and closes CAPAs?

The finding creates or requires CAPA work. It is assigned to an accountable person/post with a severity-based deadline. The assignee submits closure evidence, but a separate authorised person verifies it.

Closure authority increases with severity:

- minor: Safety Officer or Manager at the mine;
- significant: Mine Manager;
- severe: Area/subsidiary authority; and
- regulator-raised: raising regulator retains closure authority.

Exact authority remains configurable to the approved governance policy, but separation of duties is mandatory.

## 17. What are RBAC and ReBAC?

### RBAC

Role-Based Access Control says:

> “R. Kumar has the Manager role.”

That is insufficient. Manager of which mine? For what period?

### ReBAC

Relationship-Based Access Control says:

> “R. Kumar is Manager of Gevra OCP from 1 April 2025 until 31 March 2026.”

It models relationships between people, posts, mines, areas, subsidiaries, contractors and regulator regions.

## 18. Why not just create roles like `GEVRA_MANAGER`?

Across hundreds of mines, that creates thousands of location-specific roles. Transfers and expiry require manual cleanup. ReBAC stores the mine relationship directly and lets higher-level visibility flow through the hierarchy.

## 19. What is an appointment?

An appointment is the authoritative, time-bounded record saying a person holds a post at an asset.

The appointment—not a permanent label—is the source of permissions. When it expires, the permission stops applying without deleting historical attribution.

## 20. What happens if nobody holds the required post?

The message does not disappear. Strata:

1. fails recipient resolution visibly;
2. escalates to the next hierarchy level; and
3. raises an unmanned-post finding because the vacancy is itself a governance risk.

## 21. Can a person delegate their authority?

For the initial design, they may delegate receipt/visibility during leave, not statutory authority. A delegate may acknowledge that they saw a message but cannot gain closure or signing power merely through delegation.

## 22. How are reminders different from escalation?

- A reminder arrives before a deadline so the owner can still act.
- Escalation adds higher-level visibility when a risk condition is met.
- Escalation does not transfer ownership upward.

Minor items are digested. Severe items interrupt and require acknowledgement. Repeated triggers are coalesced so alerts do not become noise.

## 23. Why are there three dashboards?

Different users make different decisions:

- Field user: “What do I owe today?”
- Mine official: “What at my site needs intervention?”
- Ministry/corporate/regulator: “Which sites need attention and why?”

One giant dashboard would burden field users with portfolio charts and senior users with raw task noise.

## 24. What does the regulator see?

The regulator sees authorised published state within its jurisdiction. Internal drafts are hidden by default so mines can investigate and correct draft records without every unfinished note becoming an external disclosure.

Regulator access requires a purpose and is audited. Regulators may create and manage their own official findings. A mine cannot self-close them.

## 25. What does “every number is traceable” mean?

If a dashboard says “62.5% verified compliance,” the user can inspect:

- the formula version;
- 50 satisfied records in the numerator;
- 80 eligible records in the denominator;
- excluded waivers/not-applicable records;
- selected mine and period; and
- freshness of each source.

Missing data is shown as incomplete, never converted to zero or green.

## 26. What exactly does AI decide?

AI may:

- classify documents;
- propose clause boundaries and obligations;
- suggest evidence matches;
- suggest duplicate observations;
- identify similar historical defects;
- explain risk signals; and
- translate grounded interface text.

AI may not independently:

- publish a legal obligation;
- decide legal applicability with no review;
- declare a mine compliant;
- merge defects invisibly;
- accuse a person of fraud; or
- close a finding.

## 27. Why use AI if humans still review?

The current bottleneck is reading, structuring, searching and correlating large volumes of material. AI reduces that effort and brings likely problems to attention. Human review preserves legal and operational accountability.

## 28. What is anomaly detection?

It detects unusual relationships in operational data—not merely high values.

Examples:

- reported production rises while dispatch and stock do not reconcile;
- identical dust values repeat implausibly for weeks;
- contractor attendance exceeds eligible registered workers; or
- a sudden sensor change deviates sharply from the mine's established pattern.

For the prototype, one anomaly uses clearly labelled synthetic data. Production modelling requires clean historical data and operating context.

## 29. Is the audit trail a blockchain?

No. The system does not have mutually distrustful organisations agreeing through a distributed consensus network. Append-only database controls, content hashes, hash chains and trusted timestamps provide the needed tamper evidence with less cost and complexity.

## 30. What if somebody makes a correction?

The old record remains. A correction creates a new event or version that supersedes it. Users see the current truth and can reconstruct what was believed earlier.

## 31. What if a regulation changes?

The new document is ingested and its impact is proposed for human review. Future obligation instances use the approved new rule. Past instances retain the rule that applied when they were due.

## 32. How does Strata scale to all coal mines?

- one configurable asset hierarchy;
- tenant isolation for coal operators;
- appointments rather than hard-coded users;
- per-site obligation applicability;
- reusable checklist/configuration templates;
- shared data definitions; and
- automatic upward aggregation.

Adding a mine must be a configuration exercise, not a code change.

## 33. What will the SIH prototype prove?

One mine will demonstrate the whole clause-to-closure lifecycle. Two additional mines will demonstrate scope, comparison and Ministry-level aggregation. External integrations and anomaly data may be simulated but visibly labelled.

The prototype is evidence that the architecture works—not a false claim that every national portal and statutory process has already been replaced.

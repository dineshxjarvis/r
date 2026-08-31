# Strata — Judge Questions and Defence Guide

## 1. “Isn't this just another dashboard?”

No. Dashboards are the last layer. Strata governs how a fact is created: it connects the source clause, responsible appointment, dated obligation, field evidence, finding, CAPA, independent closure and audit history. Every dashboard value drills through that chain.

## 2. “SWCS and NCMSR already exist. What is new?”

SWCS/PRIMS focuses on mine operationalisation, projects and production. NCMSR focuses on accidents and safety audits. Strata provides a unified user journey and a cross-domain clause-to-closure control model. It initially federates existing systems and phases Ministry-owned workflows into one platform after parity.

## 3. “Are you actually replacing SWCS?”

That is the production destination, not a hackathon cutover claim. Phase one is a unified front door and shared data layer. Native workflow migration and retirement occur module by module only after parity, audited migration and Ministry approval.

## 4. “Can the Ministry replace PARIVESH or DGMS?”

Not unilaterally. Strata can unify the experience and exchange data, but the statutory authority remains with MoEFCC/DGMS unless a formal institutional decision changes it.

## 5. “Where is the AI?”

AI classifies and segments documents, proposes structured obligations, suggests evidence/defect matches and explains risk signals. Humans retain publication, verification and closure authority. Risk is transparently rule-based initially; anomaly detection is demonstrated honestly with labelled synthetic data.

## 6. “Why not automate everything?”

A single extraction error can create a wrong deadline across many mines. AI removes reading/correlation effort; accountable humans make legal and safety decisions. Automation is strongest where failure is reversible and weakest where it changes authority or compliance state.

## 7. “How do you prove an extracted obligation?”

Every field retains a provenance anchor to the original document hash, page and location. The reviewer can click the obligation and see the exact highlighted text. The original bytes never change.

## 8. “How will this work with bad internet?”

The Android app commits records to a local database before attempting network work. It uses resumable uploads and per-record acknowledgements. Pending sync is visible to both field and management users.

## 9. “GPS can be spoofed. Isn't your evidence fakeable?”

No single GPS value is treated as proof. The verdict includes distance, accuracy, provider, mock/device signals, capture path and time confidence. The prototype demonstrates distance-plus-accuracy and direct capture; production adds attestation, raw GNSS and corroboration. We preserve suspect evidence rather than deleting it.

## 10. “What about underground mines where GPS and phones do not work?”

We do not claim consumer phones work underground. The production design uses approved fixed-reader/cap-lamp infrastructure and topological position. Hardware is roadmap and any demo is explicitly simulated.

## 11. “What is the difference between submitted and compliant?”

Submitted means the mine filed evidence. Satisfied means an independent authorised verifier accepted that evidence. Showing them separately prevents paperwork from being counted as verified performance.

## 12. “Why four objects—observation, defect, finding and CAPA?”

An observation is one report. Several reports can describe one defect. A finding is a formal requirement-linked conclusion. CAPA is the accountable work. One generic issue object would inflate counts and confuse reporting with legal conclusion and execution.

## 13. “Why ReBAC? Normal roles are enough.”

Authority is not just “Manager.” It is Manager of a particular mine during a particular appointment window. Contractors span selected mines and regulators cover regions across organisational boundaries. ReBAC models those relationships without thousands of location-specific roles.

## 14. “What if the Manager changes?”

Workflow rules address the post, not the person's name. At send/action time Strata resolves the current appointment holder. An expired appointment loses authority automatically while history stays attributable.

## 15. “Can the assignee close their own CAPA?”

No. The assignee submits evidence; a different authorised verifier decides. Regulator-raised findings remain closable only by the raising regulator or approved regulator workflow.

## 16. “Will regulators see every internal note?”

No. They see authorised published state and their own official workflows. Reads require purpose and are logged. Exposing unfinished drafts would discourage honest early reporting and damage adoption.

## 17. “Why not blockchain?”

The problem is tamper evidence, not distributed consensus. Immutable originals, append-only events, hashes, hash chains and trusted timestamping solve it with fewer dependencies and clearer governance.

## 18. “How do you avoid alert fatigue?”

Minor items are digested, repeated triggers coalesce, severe items interrupt and require acknowledgement, and escalation is based on risk conditions. Nothing is silently dropped; suppressed delivery remains visible.

## 19. “How is the risk score trained?”

The prototype is not trained. It is a transparent weighted rule score using severity, ageing, recurrence, overdue CAPAs and process-integrity signals. Learned components require sufficient representative Indian mine history and measured improvement.

## 20. “Why anomaly detection?”

The PS explicitly asks for operational anomalies. It can surface inconsistent production/dispatch/stock, repetitive environmental readings or attendance contradictions. The prototype uses one labelled synthetic example; production requires historical context and data-quality controls.

## 21. “How do you handle synthetic data?”

Real public documents validate extraction. Synthetic operational records are visibly labelled and never presented as facts about a real mine. The UI/data provenance records the origin.

## 22. “Can six people build this?”

Not the national platform during SIH. The team builds one deep vertical slice and two shallow comparison mines. Real external integrations, certified hardware and national migration are explicitly production roadmap.

## 23. “How will you scale nationally?”

Operator tenant isolation, configuration-driven hierarchy/applicability, appointment-based scope, immutable object storage, asynchronous processing and automatic upward aggregation. The acceptance test is onboarding a mine without code changes.

## 24. “What if an external portal is unavailable?”

The case remains in a visible queued/pending state. Adapters retry idempotently, preserve the submission payload and reconcile later. Strata never falsely marks a statutory submission successful.

## 25. “What if Gemini/Groq is down or quota is exhausted?”

AI tasks are asynchronous and provider-independent. Supported providers can fail over legitimately; otherwise work waits in a visible queue. Human/manual review remains possible. Keys stay server-side and are not cycled to evade quotas.

## 26. “What does success look like?”

Reduced field-to-authority latency, fewer overdue obligations, more closures with acceptable evidence, faster severe-alert acknowledgement, less manual re-entry, lower recurrence and mine onboarding without code changes.

## 27. “What is the single strongest demonstration?”

Upload a real clause, publish its obligation, create a dated mine task, submit field evidence captured 640 metres from the target asset, block closure with an explainable mismatch, then drill from the Ministry dashboard back to the evidence and original clause.

## 28. “What are you not claiming?”

- No autonomous legal determination
- No production predictive accident model
- No complete replacement of live portals in the prototype
- No real underground mobile capture
- No perfect anti-spoofing
- No official Star Rating generation
- No real-mine claim derived from synthetic data


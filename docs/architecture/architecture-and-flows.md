# Strata — Architecture and Flow Diagram Library

These Mermaid diagrams are source material. Render them to SVG/PNG before placing them into the PPT; avoid screenshots of code blocks.

---

## 1. Stakeholder context

```mermaid
flowchart TB
    M[Ministry of Coal<br/>platform owner and portfolio governance]
    O[Coal operators<br/>CIL, subsidiaries, SCCL,<br/>captive and commercial mines]
    F[Mine and field users<br/>officials, inspectors, supervisors]
    C[Contractors<br/>administrators and supervisors]
    R[Regulators<br/>DGMS, MoEFCC, SPCB, labour]
    E[Existing public systems<br/>SWCS/PRIMS, PARIVESH,<br/>NCMSR and others]
    S((STRATA))

    M <--> S
    O <--> S
    F <--> S
    C <--> S
    R <--> S
    E <--> S
```

## 2. Product module architecture

```mermaid
flowchart TB
    subgraph Channels
      WEB[Unified web portal]
      MOB[Offline Flutter field app<br/>inspectors + field workers only<br/>other mobile roles TBD]
      EXT[External/regulator interfaces]
    end

    subgraph Experience
      APP[Applications and submissions]
      TASK[Personal task and approval queues]
      DASH[Three-altitude dashboards]
      REVIEW[Document/evidence review]
      GIS[GIS and spatial view]
    end

    subgraph Domain
      DIR[Mine, asset, people and appointments]
      DOC[Document pipeline]
      OBL[Obligation register]
      DEF[Observation, defect, finding and CAPA]
      EVD[Evidence and field capture]
      WRK[Workflow, delivery and approvals]
      ANA[Risk, recurrence and anomaly analytics]
      REP[Statutory reporting]
    end

    subgraph Trust
      AUTH[Authentication + ReBAC authorisation]
      AUD[Append-only audit and time travel]
      SIG[Signatures and manifests]
    end

    subgraph Data
      PG[(Operational relational store)]
      OBJ[(Immutable object storage)]
      REL[(Relationship store)]
      SEARCH[(Search/vector index)]
      CACHE[(Projection/cache)]
    end

    subgraph Integration
      GATE[API/event integration gateway]
      GOV[SWCS/PRIMS · PARIVESH · NCMSR · DGMS]
      FEED[IoT · CPCB/SPCB · survey/drone]
      MSG[Push · SMS · email · eSign/DSC]
    end

    WEB --> Experience
    MOB --> Experience
    EXT --> Experience
    Experience --> Domain
    Domain --> Trust
    Domain --> Data
    Trust --> Data
    GATE <--> Domain
    GATE <--> GOV
    GATE <--> FEED
    WRK <--> MSG
```

## 3. Prototype deployment view

Technology names are recommended defaults, not irreversible PRD requirements.

```mermaid
flowchart LR
    WEB[Web client] --> API[Backend API]
    AND[Flutter app<br/>PowerSync local offline DB] --> API
    API --> PG[(PostgreSQL)]
    API --> OBJ[(S3-compatible storage)]
    API --> FGA[OpenFGA or equivalent]
    API --> Q[Job queue/workers]
    API --> CACHE[(Redis/read models)]
    Q --> OCR[OCR/layout worker]
    Q --> AI[Provider-independent AI gateway]
    AI --> GEM[Gemini]
    AI --> GRQ[Groq-hosted models]
    Q --> NOTIF[Notification adapters]
    Q --> MOCK[Labelled mock government/sensor feeds]
```

AI provider rules:

- one internal interface and structured schemas;
- approved keys stored server-side only;
- retry with exponential backoff;
- provider fallback for availability, not quota evasion;
- queue when capacity is exhausted;
- redact/minimise sensitive payloads; and
- store prompts/model version/output provenance for review.

## 4. Production logical deployment

```mermaid
flowchart TB
    subgraph Edge
      WAF[WAF/API gateway]
      IDP[Government/enterprise identity]
    end

    subgraph Stateless services
      CORE[Core domain services]
      READ[Dashboard/read service]
      INT[Integration service]
      NOT[Notification service]
      AIG[AI orchestration service]
    end

    subgraph Durable processing
      BUS[Event bus]
      JOB[Background workers]
      OUT[Transactional outbox]
    end

    subgraph Stores
      DB[(HA relational database<br/>tenant RLS)]
      BLOB[(WORM/content-addressed object store)]
      GRAPH[(Authorisation relationship store)]
      IDX[(Search/vector indexes)]
      PROJ[(Read projections/cache)]
    end

    subgraph Operations
      OBS[Logs, metrics and traces]
      KMS[Key and secret management]
      SIEM[Security monitoring]
      DR[Backup and disaster recovery]
    end

    WAF --> CORE
    IDP --> CORE
    CORE --> DB
    CORE --> GRAPH
    CORE --> BLOB
    CORE --> OUT
    OUT --> BUS
    BUS --> JOB
    BUS --> READ
    JOB --> AIG
    JOB --> INT
    JOB --> NOT
    READ --> PROJ
    AIG --> IDX
    Operations --> Stateless services
    Operations --> Durable processing
    Operations --> Stores
```

## 5. Unified portal transition

```mermaid
flowchart TB
    subgraph Phase 1
      U1[Strata unified front door]
      A1[Adapters to existing portals]
      X1[SWCS/PRIMS · PARIVESH · NCMSR]
      U1 <--> A1 <--> X1
    end

    subgraph Phase 2
      U2[Shared identity, mine master,<br/>document and obligation model]
      X2[Existing statutory systems]
      U2 <--> X2
    end

    subgraph Phase 3
      U3[Ministry-owned workflows<br/>native in Strata]
      F3[Federated external-authority workflows]
      U3 <--> F3
    end

    subgraph Phase 4
      R4[Retire duplicated SWCS functions<br/>after parity, migration and approval]
    end

    Phase1 --> Phase2 --> Phase3 --> Phase4
```

## 6. Document data flow

```mermaid
sequenceDiagram
    actor User
    participant Portal
    participant Auth as Authorisation
    participant Store as Immutable Store
    participant Pipe as OCR/AI Pipeline
    participant Reviewer
    participant Register as Domain Register
    participant Audit

    User->>Portal: Upload/select portal document
    Portal->>Auth: Check document class + mine scope
    Auth-->>Portal: Allow
    Portal->>Store: Seal original bytes by hash
    Store->>Audit: Record upload and hash
    Portal->>Pipe: OCR, classify, segment, extract
    Pipe-->>Reviewer: Proposed items + confidence + source anchors
    Reviewer->>Register: Accept/edit/reject and publish
    Register->>Audit: Versioned publication event
    Register-->>User: Live obligation/finding/evidence record
```

## 7. Obligation lifecycle

```mermaid
stateDiagram-v2
    [*] --> Upcoming
    Upcoming --> Due: period opens
    Due --> Submitted: owner files evidence
    Submitted --> Satisfied: independent verification accepts
    Submitted --> EvidenceMismatch: verification rejects
    EvidenceMismatch --> Submitted: corrected evidence
    Due --> Overdue: due + grace passes
    Overdue --> Escalated: domain risk condition fires
    Upcoming --> NotApplicable: authorised decision + reason
    Upcoming --> Waived: authorised period-specific waiver
    Escalated --> Finding: create/link formal finding
```

## 8. Inspection assignment and fieldwork

```mermaid
flowchart LR
    R[Request / notice / risk trigger] --> P[Planner triages]
    P --> A[Assignment version proposed]
    A --> C{Lead + competencies accepted?}
    C -->|No| X[Replace member or escalate planner]
    X --> A
    C -->|Yes| V[Visit starts; authority rechecked]
    V --> F[Checklist, evidence, observations]
    F --> H{Lead unavailable?}
    H -->|Yes| J[Pause or audited handover]
    J --> F
    H -->|No| Q[Fieldwork complete]
    Q --> RR[Report review]
    RR --> I[Issue by origin-specific authority]
    I --> M[Mine response / CAPA]
    M --> VF[Independent verification or follow-up]
    VF --> CL[Closure under stored policy]
```

Internal, regulatory, third-party and received-notice inspections differ in who may plan, assign, issue and close. See [`../features/inspections/inspection-spec.md`](../features/inspections/inspection-spec.md).

## 9. Observation-to-closure flow

```mermaid
flowchart LR
    O[Observation] --> M{Matches open defect?}
    M -->|Human confirms| D[Existing defect]
    M -->|No| N[New defect]
    D --> Q{Requirement breached?}
    N --> Q
    Q -->|No/unknown| L[Defect remains operational]
    Q -->|Yes| F[Finding with requirement]
    F --> C[Corrective + preventive actions]
    C --> E[Closure evidence]
    E --> V{Independent authorised verification}
    V -->|Reject| C
    V -->|Accept all CAPAs| X[Verified closed]
```

## 10. Offline field sync

```mermaid
sequenceDiagram
    actor Inspector
    participant App as Flutter App
    participant Local as Local DB/Outbox
    participant API
    participant Evidence
    participant Workflow

    Inspector->>App: Capture direct photo + form
    App->>Local: Commit record, media hash and metadata
    App-->>Inspector: Saved offline / pending sync
    Note over App,API: Network unavailable
    App->>API: Resume upload when connected
    API->>Evidence: Verify hash, chain, location/time signals
    Evidence-->>API: Evidence verdict with reasons
    API->>Local: Per-record acknowledgement
    API->>Workflow: Update task/finding and notify if needed
```

## 11. Recipient resolution and delivery

```mermaid
flowchart TB
    E[Domain event] --> R[Rule selects required post]
    R --> H{Current appointment holder?}
    H -->|Yes| P[Resolve person and language]
    H -->|No| U[Escalate hierarchy + unmanned-post finding]
    P --> N[Create authoritative in-app notification]
    N --> S{Severity/channel policy}
    S -->|Minor| D[Daily digest]
    S -->|Significant| PU[Push + in-app]
    S -->|Severe/regulator| SM[Push + SMS + in-app<br/>acknowledgement required]
    SM --> A{Acknowledged in time?}
    A -->|No| U
```

## 12. Dashboard data flow and traceability

```mermaid
flowchart LR
    E[Canonical domain events] --> O[Transactional outbox]
    O --> P[Read projections]
    P --> M[Versioned metric computation]
    M --> D[Role-specific dashboard]
    D --> X[Drill-down manifest]
    X --> R[Exact numerator, denominator,<br/>exclusions and source records]
    R --> H[Record history and evidence]
```

## 13. Authorisation explained visually

Canonical semantics live in [`identity-authority-model.md`](identity-authority-model.md). The cookie/session identifies a principal only; target-resource scope, current appointments, mandates, and jurisdiction are evaluated for every request.

```mermaid
flowchart LR
    U[Person: R. Kumar] -->|holds appointment<br/>01-Apr-2025 to 31-Mar-2026| P[Post: Manager]
    P -->|at| M[Mine: Gevra OCP]
    F[Finding at Gevra<br/>severity: Significant] --> M
    U --> Q{May close finding now?}
    Q -->|Inside appointment window| Y[Allow if separation/evidence rules pass]
    Q -->|After appointment expires| N[Deny]
```

## 14. Multi-tenant hierarchy

The tenant boundary is independent of organisation and mine hierarchy. CIL is one tenant by default, subsidiaries are organisation units, and Ministry/regulator principals use explicit cross-tenant portfolio or jurisdiction assignments. See [`identity-authority-model.md`](identity-authority-model.md) before changing this diagram or its implementation.

```mermaid
flowchart TB
    M[Ministry portfolio]
    M --> T1[Operator tenant A]
    M --> T2[Operator tenant B]
    T1 --> S1[Subsidiary]
    S1 --> A1[Area]
    A1 --> X1[Mine]
    X1 --> U1[Subunit]
    U1 --> AS1[Bench/asset]
    T2 --> X2[Mine]
```

Visibility flows upward only through authorised relationships. Tenant row-level security provides a second barrier against accidental cross-operator leakage.

## 15. Analytics flow

```mermaid
flowchart LR
    A[Verified obligations] --> R[Feature/rule computation]
    B[Findings and CAPAs] --> R
    C[Recurrence and ageing] --> R
    D[Incidents/near misses] --> R
    E[Production/environment series] --> AN[Anomaly detector]
    R --> X[Explained risk signal]
    AN --> X
    X --> H[Human review queue]
    X --> W[Named recipient workflow]
    X --> DB[Traceable dashboard]
```

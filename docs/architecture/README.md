# Architecture

- [`architecture-and-flows.md`](architecture-and-flows.md) — system context, deployment, data and sequence diagrams
- [`identity-authority-model.md`](identity-authority-model.md) — canonical tenancy, session, appointment, regulator-jurisdiction and authorization foundation
- [`rebac-role-resource-graph.md`](rebac-role-resource-graph.md) — visual relationship graph from people and appointments through mines, activities, documents, filings and access decisions
- [`foundation-data-model.md`](foundation-data-model.md) — corrected relational entities, constraints and migration completion criteria
- [`inspection-data-model.md`](inspection-data-model.md) — inspection intake, teams, visits, checklists, reports and handovers
- [`incident-data-model.md`](incident-data-model.md) — incident intake, emergency command, notification rules, investigations and closure gates
- [`production-data-model.md`](production-data-model.md) — material lineage, dispatch, stock, reconciliation and approved production facts
- [`environment-data-model.md`](environment-data-model.md) — monitoring programmes, samples, instruments, limits, evaluations and exceedance cases
- [`contractor-data-model.md`](contractor-data-model.md) — work packages, subcontracting, requirements, eligibility and performance history
- [`attendance-data-model.md`](attendance-data-model.md) — shifts, credentials, immutable presence, reconciliation, registers and emergency muster
- [`geospatial-data-model.md`](geospatial-data-model.md) — spatial sources, governed geometry, topology, evaluations and restricted delivery
- [`reporting-data-model.md`](reporting-data-model.md) — report definitions, source manifests, validation, attestations, packages and filing state
- [`regulatory-case-data-model.md`](regulatory-case-data-model.md) — service discovery, applications, authority cases, exchanges, decisions and instruments
- [`search-data-model.md`](search-data-model.md) — searchable projections, checkpoints, query proof, saved searches, alerts and exports
- [`grievance-data-model.md`](grievance-data-model.md) — protected intake, cases, routing, redress, disposition, appeal and external reconciliation
- [`integration-data-model.md`](integration-data-model.md) — connectors, deployments, exchanges, ingress, mappings, reconciliation and recovery
- [`analytics-ai-data-model.md`](analytics-ai-data-model.md) — AI use cases, datasets/features, models, evaluation, deployments, signals, contests and incidents
- [`experience-data-model.md`](experience-data-model.md) — locales, terminology, translations, assisted sessions, accessibility tests and conformance
- [`audit-history-data-model.md`](audit-history-data-model.md) — typed audit/access events, checkpoints, historical reconstruction, release/DR/migration evidence
- [`domain-dependency-map.md`](domain-dependency-map.md) — production dependency direction, contracts and cycle breakers
- [`technical-design.md`](technical-design.md) — presentation-level TRD and recommended implementation design

Package-specific implementation notes should live beside their package in the monorepo. This directory owns only cross-system architecture.

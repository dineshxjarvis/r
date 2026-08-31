# Strata Documentation

This directory contains the product, technical, research and presentation sources for Strata. It is organised by purpose so packages in the monorepo can reference stable, canonical documents without duplicating requirements.

## Start here

| Need | Read |
|---|---|
| Understand the official problem | [`context/problem-statement.md`](context/problem-statement.md) |
| Understand the whole system simply | [`presentation/system-explained.md`](presentation/system-explained.md) |
| Review product requirements | [`product/product-requirements.md`](product/product-requirements.md) |
| Check production capability ownership and coverage | [`product/production-capability-map.md`](product/production-capability-map.md) |
| Use canonical cross-domain terminology | [`product/domain-glossary.md`](product/domain-glossary.md) |
| Review the architecture | [`architecture/architecture-and-flows.md`](architecture/architecture-and-flows.md) |
| Check domain dependency direction | [`architecture/domain-dependency-map.md`](architecture/domain-dependency-map.md) |
| Change identity, tenancy, sessions or authority | [`architecture/identity-authority-model.md`](architecture/identity-authority-model.md) |
| Know prototype versus production scope | [`product/prototype-scope.md`](product/prototype-scope.md) |
| Build the SIH deck | [`presentation/master-deck.md`](presentation/master-deck.md) |
| Understand why decisions were made | [`decisions/architecture-decisions.md`](decisions/architecture-decisions.md) |
| Track production design waves and conflicts | [`planning/production-design-tracker.md`](planning/production-design-tracker.md) |
| Audit a domain for whole-system gaps | [`planning/whole-system-gap-audit-prompt.md`](planning/whole-system-gap-audit-prompt.md) |

## Directory map

```text
docs/
├── context/          Problem statement and broad solution context
├── product/          PRD, feature inventory and prototype scope
├── architecture/     System architecture, technical design and flows
├── features/         Detailed, domain-owned feature specifications
├── integrations/     External-system landscape and transition model
├── research/         Research findings and source catalog
├── planning/         Temporary production-design tracking and conflict register
├── decisions/        Chosen/rejected alternatives and revisit triggers
└── presentation/     PPT source, feasibility, novelty and judge defence
```

## Document authority

When documents disagree, use this precedence:

1. Official problem statement in `context/problem-statement.md`
2. Approved product requirements in `product/`
3. Decision records in `decisions/`
4. Detailed feature specifications in `features/`
5. Architecture and technical design in `architecture/`
6. Presentation material
7. Research/context notes

Presentation documents explain the system; they do not silently redefine it.

## Status vocabulary

- **Prototype:** intended for the SIH implementation.
- **Production:** target Ministry-scale behaviour.
- **Roadmap:** designed direction, not claimed as built.
- **Simulated:** labelled synthetic data or mock integration.
- A checkbox in the feature inventory means a detailed design exists, not that code exists.

## Adding documentation

- Put cross-product requirements in `product/`.
- Put system-wide technical choices in `architecture/` or `decisions/`.
- Put domain behaviour under the closest `features/` owner.
- Put external-system contracts and mappings in `integrations/`.
- Keep raw research out of normative specifications.
- Link to a canonical definition rather than copying it.
- Record rejected alternatives and revisit triggers for material decisions.

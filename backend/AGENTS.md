# AGENTS.md — Strata Backend

> Read this first, then read the contract: `../docs/api-specs/README.md`. It is not a summary — it is the specification this codebase implements literally. The endpoint cards in `../docs/api-specs/endpoints/` give exact request and response bodies for every route.

---

## What this is

Strata is a multi-tenant mining compliance platform. Canonical domain records, authorisation relationships, immutable evidence objects and dashboard projections stay distinct but connected through stable identifiers and audited events. The backend is the only thing that talks to the database — the web client and the Flutter field app both go through `/api/v1`.

**Current milestone: v0.01.** Nine of twenty-one domains. Scope and phase order: `../docs/planning/v0.01-scope.md`.

---

## Tech stack

| Layer | Choice | Why |
|---|---|---|
| Language | Python 3.13 | Pydantic v2 maps directly onto the contract's typed scalars, open enums and per-action payload schemas |
| Framework | FastAPI | Async-first, OpenAPI generation, Pydantic-native |
| ORM | SQLAlchemy 2.0 async + GeoAlchemy2 | Spatial columns live in the same transaction as the domain row |
| Migrations | Alembic | **Migrations are the physical schema authority**, not `data-model.md` |
| Database | PostgreSQL 17 + PostGIS (Supabase) | Transactions, RLS, spatial |
| Authorisation | OpenFGA, self-hosted, own datastore | ReBAC graph relationships; Postgres stays canonical |
| Objects | Supabase Storage over S3 protocol (MinIO locally) | Immutable content-addressed originals |
| Cache / queue | Redis + arq | Dashboard projections, idempotency keys, outbox workers |
| IDs | ULID | `<prefix>_<26-char Crockford base32>` |
| Logging | structlog | Structured JSON. Never `print()` |
| Package manager | uv | `uv sync`, `uv run` |

---

## The rules that are actually load-bearing

### Supabase is infrastructure, not the application

Supabase provides Postgres, PostGIS and Storage. That is all.

- **No PostgREST. No `supabase-js` in any client.** Every read in this system is authorization-clipped, may carry a `PARTIAL_SCOPE` warning, computes `available_actions` per row, and is access-logged with a purpose. PostgREST does none of that. One direct table read from a browser and the entire ReBAC layer is decoration. The frontend and the mobile app hold no Supabase data key.
- **No Supabase Auth as the session layer.** `../docs/api-specs/endpoints/identity/auth.md` specifies a server-issued opaque `strata_session` cookie carrying assurance level, step-up, device fingerprint, listable and revocable sessions, and OIDC identity bound by `(issuer, subject)`. That is our own `session` table.
- **Never connect as the Supabase service role.** The app connects as `strata_app`, a `NOBYPASSRLS` role. Connecting as the service role silently disables every RLS policy and nothing fails visibly.
- **Supavisor must run in session mode.** Transaction-mode pooling breaks `SET LOCAL`, which is how tenant context reaches RLS.

### Tenant context comes from the principal, never the request

`app/core/db.py` opens each request transaction with `SET LOCAL app.tenant_id` from the **resolved principal**. A `tenant_id` or `mine_id` in a request body or query string is an input to be authorized, never a grant. RLS policies stay the flat `operator_id = current_setting('app.tenant_id')` check.

### Every material transaction writes three things atomically

Domain change, audit event, and outbox row — in one database transaction. This is not a helper you may skip; it is the transaction boundary. Consumers of the outbox are idempotent and checkpointed, and a consumer failure never rolls back a valid source decision.

### Authorization is an eight-step chain, and OpenFGA is only step five

The chain is written out in `../docs/api-specs/README.md` and implemented once in `app/authz/chain.py`. OpenFGA answers graph questions. Time, mandate, jurisdiction, severity, evidence verdict, assurance, purpose and separation of duties are the policy layer's job. **A handler must never invent its own role check.** OpenFGA outages fail closed.

### 404 is the answer for out of scope

An object outside the caller's authorised scope returns `404 NOT_FOUND`, never `403`. A `403` would confirm the object exists, which is itself the leak. `403` is reserved for "you can see this object, but not do this to it." One implementation, in `app/authz/concealment.py`.

### Four core route forms, three companions, and actions live in data

`GET /{collection}`, `GET /{collection}/{id}`, `POST /{collection}`, `POST /{collection}/{id}/actions`, plus `POST /{collection}/actions`, `GET /{collection}/{id}/history` and `PATCH /{collection}/{id}`. That is the default surface. Authentication, shared upload transport, external ingress, and other exceptional interfaces must be justified explicitly in their endpoint cards.

**A new capability is a new `action` value or a new filter — not a new route.** Adding a route is an exception that must be justified in the endpoint card that adds it.

Every action is declared as an `ActionSpec` in its domain's `actions.py`. From one declaration the kernel derives dispatch, `400 UNKNOWN_ACTION` with the allowed set, `409 INVALID_STATE` with current state and allowed set, per-principal `available_actions`, `GET /capabilities`, `meta.effects`, the audit `transition`, the bulk path, and the JSON Schema. Writing an action handler as a branch inside a service is the wrong shape.

### The query grammar is compiled once

`app/kernel/query/` is the only place a query string becomes SQL. Each resource declares which fields are filterable, sortable, expandable, searchable and aggregatable in its `resources.py`. Anything undeclared is `400 UNKNOWN_PARAMETER` — silently ignoring an unknown param hides client bugs. One relation hop maximum.

### Original bytes never change

Documents and evidence are content-addressed by SHA-256. The hash is verified before the Postgres row is allowed to exist. The application storage credential is insert-only; deletes require a separate admin credential.

**Known prototype gap:** Supabase Storage has no S3 Object Lock / WORM mode, so immutability here is enforced by credential scope and application discipline rather than by the storage layer. Production requires real S3 with Object Lock in compliance mode. Do not describe the prototype as immutable-at-rest.

### Evidence IDs are generated by the client

Field capture happens offline. `evidence.id` is a client-generated ULID, which makes `POST /evidence/sync` an idempotent upsert by design — a retried sync after a dropped connection is a no-op, not a duplicate row. Never reassign an evidence ID server-side.

### Layering, strictly

```
kernel routes → authz chain → domain service → domain repository → integrations
```

- Routes never touch the database.
- Services never construct HTTP responses.
- Repositories never call an external SDK — that is `integrations/`.
- Domains never import another domain's repository. Cross-domain reads go through a service, cross-domain effects go through the outbox.
- Dependencies point downward through the layers in `../docs/architecture/domain-dependency-map.md`. L4 (search, dashboards, analytics) is never authoritative for an L2 fact.

### Envelopes and scalars

Every resource carries the universal envelope; every response uses the success or error envelope. Both are built in `app/kernel/envelope.py` — never hand-rolled. Decimals travel as strings. Quantities and money are always objects with unit or currency. No bare floats, anywhere.

---

## File map

```
backend/
├── app/
│   ├── main.py                 App factory and lifespan
│   ├── core/                   config · db · logging · ids · errors · time
│   ├── kernel/                 The contract machinery, domain-agnostic
│   │   ├── routes.py           The four core route forms plus three companions
│   │   ├── registry.py         Nothing is routable until registered here
│   │   ├── actions.py          ActionSpec base and dispatcher
│   │   ├── envelope.py         Resource and response envelopes
│   │   ├── idempotency.py      Idempotency-Key, 24h replay
│   │   ├── concurrency.py      version · ETag · If-Match
│   │   ├── introspect.py       /enums · /schemas · /capabilities · /views
│   │   ├── operations.py       /operations/{id}, the only async-status route
│   │   ├── extensions.py       Registered extension namespaces
│   │   ├── scalars.py          Typed scalars
│   │   └── query/              parser · compiler · expand · aggregate · temporal · pagination
│   ├── authz/                  chain · fga · capabilities · policy · scope · concealment · principal
│   │   └── model.fga           OpenFGA authorization model DSL
│   ├── audit/                  event (hash chain) · access_log (purpose logging)
│   ├── outbox/                 writer + workers/{fga_projector,notifier,dashboard_projector,signal_emitter}
│   ├── integrations/           storage · ocr · ai/{gateway,providers}
│   └── domains/                identity · documents · defects · evidence · inspections
│                               workflow · geospatial · dashboard · analytics
├── migrations/                 Alembic. The physical schema authority
├── scripts/                    seed_dev.py · push_fga_model.py
└── tests/
    ├── contract/               One test per endpoint card
    ├── authz/                  authorization-spec.md §12 + domain-dependency-map.md §6
    ├── spec/                   Drift guards: markdown action tables vs the registry
    └── unit/                   Pure logic, no database
```

Every domain package holds the same seven modules: `models.py` · `schemas.py` · `repository.py` · `service.py` · `actions.py` · `policy.py` · `resources.py`. Domain folders map 1:1 to `../docs/api-specs/endpoints/` folders.

**When a module passes ~600 lines, promote it to a package with one module per endpoint card, keeping the same names.** `identity/` will hit this first.

---

## Drift guards

Three things are checked mechanically rather than remembered:

1. `tests/spec/` parses the action tables out of `../docs/api-specs/endpoints/**.md` and asserts the registry matches — action names, capabilities, state preconditions, reason and version requirements, effect lists. Spec drift is a red test, not a discovery in month three.
2. `tests/authz/` runs the boundary tests from `authorization-spec.md §12` and `domain-dependency-map.md §6`. Every phase ships these green.
3. `tests/contract/` covers one test per endpoint card.

If a doc and the code disagree, the contract wins and the code is wrong — except for physical schema, where the migration wins and `data-model.md` is descriptive.

---

## Commands

```bash
uv sync --all-extras                      # install
docker compose up -d                      # postgres · openfga · redis · minio
uv run alembic upgrade head               # schema
uv run python scripts/push_fga_model.py   # authorization model
uv run python scripts/seed_dev.py         # dev fixtures
uv run uvicorn app.main:app --reload      # serve
uv run arq app.outbox.workers.WorkerSettings   # outbox workers

uv run ruff check . && uv run ruff format --check .
uv run pyright
uv run pytest
```

Run lint, types and tests before calling anything done.

---

## Standards log

Rules earned from real bugs live in `../docs/technical/BACKEND-STANDARDS-LOG.md`. Read it before working; append to it when a fix's root cause is a pattern that will recur elsewhere.

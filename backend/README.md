# Strata Backend

FastAPI service implementing the contract in [`../docs/api-specs/README.md`](../docs/api-specs/README.md).

Conventions, layering rules and the file map are in [`AGENTS.md`](AGENTS.md). Read that before writing code.

## Quickstart

```bash
uv sync --all-extras
cp .env.example .env
docker compose up -d
uv run alembic upgrade head
uv run python scripts/push_fga_model.py   # writes OPENFGA_MODEL_ID into .env
uv run python scripts/seed_dev.py
uv run uvicorn app.main:app --reload
```

Outbox workers run separately:

```bash
uv run arq app.outbox.workers.WorkerSettings
```

## Shape of the API

Four route forms cover the whole system:

```
GET   /api/v1/{collection}
GET   /api/v1/{collection}/{id}
POST  /api/v1/{collection}
POST  /api/v1/{collection}/{id}/actions      ← every state transition
```

plus `POST /{collection}/actions` (bulk), `GET /{collection}/{id}/history`, and `PATCH /{collection}/{id}`.

Filtering, projection, expansion, aggregation and temporal reads all ride query params. A new capability is a new `action` value or a new filter — not a new route.

## Milestone

v0.01 covers nine of twenty-one domains. See [`../docs/planning/v0.01-scope.md`](../docs/planning/v0.01-scope.md).

"""Alembic environment.

DATABASE_URL comes from the environment. The schema itself lives in editable
SQL files under migrations/sql/, executed in order by the revision scripts —
models.py metadata is not the migration source, the SQL files are.

Migrations run on a synchronous psycopg engine (multi-statement SQL scripts;
asyncpg's prepared-statement protocol refuses them). The application itself
connects with asyncpg — the +asyncpg driver suffix is rewritten here.
"""

import os

from alembic import context
from sqlalchemy import create_engine, pool

config = context.config

database_url = os.environ.get(
    "DATABASE_URL",
    "postgresql+psycopg://postgres:postgres@localhost:5432/strata",
).replace("+asyncpg", "+psycopg")

target_metadata = None


def run_migrations_offline() -> None:
    context.configure(
        url=database_url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = create_engine(database_url, poolclass=pool.NullPool)
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()
    connectable.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()

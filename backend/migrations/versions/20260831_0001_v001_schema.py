"""v0.01 schema — kernel, identity, documents, inspections, defects/evidence,
geospatial, workflow/dashboard, analytics, triggers/RLS.

The DDL lives in editable SQL files under migrations/sql/, executed here in
dependency order. Edit those files only while this revision is unreleased;
once applied anywhere shared, changes go in a new revision.

Revision ID: 0001
Revises:
Create Date: 2026-08-31
"""

from collections.abc import Sequence
from pathlib import Path

from alembic import op

revision: str = "0001"
down_revision: str | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SQL_DIR = Path(__file__).resolve().parent.parent / "sql"

SQL_FILES = [
    "0001_kernel.sql",
    "0002_identity.sql",
    "0003_documents.sql",
    "0004_inspections.sql",
    "0005_defects_evidence.sql",
    "0006_geospatial.sql",
    "0007_workflow_dashboard.sql",
    "0008_analytics.sql",
    "0009_triggers_rls.sql",
]


def upgrade() -> None:
    for name in SQL_FILES:
        op.execute((SQL_DIR / name).read_text())


def downgrade() -> None:
    # Drops every object this revision created. Enum types and extensions are
    # dropped by cascade of the schema objects that use them.
    op.execute("""
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP TABLE IF EXISTS %I CASCADE;', r.tablename);
      END LOOP;
      FOR r IN SELECT viewname FROM pg_views WHERE schemaname = 'public' LOOP
        EXECUTE format('DROP VIEW IF EXISTS %I CASCADE;', r.viewname);
      END LOOP;
      FOR r IN
        SELECT t.typname FROM pg_type t
        JOIN pg_namespace n ON n.oid = t.typnamespace
        WHERE n.nspname = 'public' AND t.typtype = 'e'
      LOOP
        EXECUTE format('DROP TYPE IF EXISTS %I CASCADE;', r.typname);
      END LOOP;
    END $$;
    """)

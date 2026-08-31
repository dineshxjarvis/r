"""Login bootstrap resolvers.

Tenant resolution at login cannot go through RLS: the policy needs a tenant
that login is still trying to discover. Adds narrow SECURITY DEFINER
functions that return identifiers only.

Revision ID: 0002
Revises: 0001
Create Date: 2026-08-31
"""

from collections.abc import Sequence
from pathlib import Path

from alembic import op

revision: str = "0002"
down_revision: str | None = "0001"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SQL_DIR = Path(__file__).resolve().parent.parent / "sql"


def upgrade() -> None:
    op.execute((SQL_DIR / "0010_login_bootstrap.sql").read_text())


def downgrade() -> None:
    op.execute("""
    DROP FUNCTION IF EXISTS resolve_login_tenant(TEXT);
    DROP FUNCTION IF EXISTS resolve_tenant_mines(TEXT);
    DROP FUNCTION IF EXISTS resolve_mines_by_state(TEXT[]);
    DROP FUNCTION IF EXISTS resolve_all_mines();
    """)

"""Cross-tenant portfolio reads.

A governed portfolio principal spans tenants, so no single app.tenant_id can
admit their authorized scope. Adds a read-only escape to the RLS policies;
the write half stays tenant-bound.

Revision ID: 0003
Revises: 0002
Create Date: 2026-08-31
"""

from collections.abc import Sequence
from pathlib import Path

from alembic import op

revision: str = "0003"
down_revision: str | None = "0002"
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None

SQL_DIR = Path(__file__).resolve().parent.parent / "sql"


def upgrade() -> None:
    op.execute((SQL_DIR / "0011_portfolio_reads.sql").read_text())


def downgrade() -> None:
    # Re-applies the tenant-only policies from the initial revision.
    op.execute((SQL_DIR / "0009_triggers_rls.sql").read_text())

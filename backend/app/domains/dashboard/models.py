"""Metric manifests — the drill-down proof behind every number.

Mirrors the dashboard half of migrations/sql/0007_workflow_dashboard.sql.

Every row here is permanent, not a cache. It is what makes "drill from a
metric to the exact records behind it" a reproducible historical fact rather
than a live-only computation that cannot be defended if challenged later.
Live tiles run the underlying query directly; a manifest is written the
moment a viewer actually drills in, exports, or the number enters a report.
"""

from __future__ import annotations

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from sqlalchemy import Date, DateTime, ForeignKey, Integer, Numeric, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, pg_enum


class MetricManifest(Base):
    __tablename__ = "metric_manifest"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str | None] = mapped_column(Text, ForeignKey("tenant.id"))
    metric_key: Mapped[str] = mapped_column(Text)
    metric_version_no: Mapped[int] = mapped_column(Integer)
    viewer_principal_id: Mapped[str] = mapped_column(Text, ForeignKey("principal.id"))
    viewer_requested_scope: Mapped[dict[str, Any]] = mapped_column(JSONB)
    effective_authorised_scope: Mapped[dict[str, Any]] = mapped_column(JSONB)
    period_start: Mapped[date] = mapped_column(Date)
    period_end: Mapped[date] = mapped_column(Date)
    as_of: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    filters: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    # NULL numerator with a zero denominator is the correct answer to "no
    # eligible instances" and must render as an em-dash, never 0% or 100% —
    # "nothing was due" and "nothing was done" are different facts.
    numerator_value: Mapped[Decimal | None] = mapped_column(Numeric)
    denominator_value: Mapped[Decimal | None] = mapped_column(Numeric)
    numerator_record_refs: Mapped[list[Any]] = mapped_column(JSONB)
    denominator_record_refs: Mapped[list[Any]] = mapped_column(JSONB)
    excluded_record_refs: Mapped[list[Any]] = mapped_column(JSONB)
    source_watermarks: Mapped[dict[str, Any]] = mapped_column(JSONB)
    freshness: Mapped[str] = mapped_column(pg_enum("dashboard_freshness"))
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


__all__ = ["MetricManifest"]

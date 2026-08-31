"""Observation -> defect -> finding -> CAPA.

Mirrors the first half of migrations/sql/0005_defects_evidence.sql.
"""

from __future__ import annotations

from datetime import date, datetime
from typing import Any

from geoalchemy2 import Geography
from sqlalchemy import (
    Date,
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, pg_enum


class Defect(Base):
    """A physical condition. Recurrence reopens this same row rather than
    spawning a new one: `first_observed_on` is the immutable ageing anchor,
    so a condition that keeps coming back reads as one continuous record."""

    __tablename__ = "defect"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    mine_id: Mapped[str] = mapped_column(Text, ForeignKey("mine.id"))
    at_subunit_id: Mapped[str | None] = mapped_column(Text, ForeignKey("subunit.id"))
    at_asset_id: Mapped[str | None] = mapped_column(Text, ForeignKey("asset.id"))
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("defect_status"))
    current_severity: Mapped[str] = mapped_column(pg_enum("severity"))
    first_observed_on: Mapped[date] = mapped_column(Date)
    recurrence_count: Mapped[int] = mapped_column(Integer)
    last_recurred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class DefectAgeingBandConfig(Base):
    __tablename__ = "defect_ageing_band_config"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str | None] = mapped_column(Text, ForeignKey("tenant.id"))
    severity: Mapped[str] = mapped_column(pg_enum("severity"))
    low_max_days: Mapped[int] = mapped_column(Integer)
    medium_max_days: Mapped[int] = mapped_column(Integer)
    high_max_days: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Observation(Base):
    """A raw sighting. `id` is client-generated for field entry, which is what
    makes an offline capture's later sync an idempotent upsert."""

    __tablename__ = "observation"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    mine_id: Mapped[str] = mapped_column(Text, ForeignKey("mine.id"))
    source_type: Mapped[str] = mapped_column(pg_enum("observation_source_type"))
    source_extraction_id: Mapped[str | None] = mapped_column(Text, ForeignKey("extraction.id"))
    source_instance_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("obligation_instance.id")
    )
    inspection_id: Mapped[str | None] = mapped_column(Text, ForeignKey("inspection.id"))
    inspection_visit_id: Mapped[str | None] = mapped_column(Text, ForeignKey("inspection_visit.id"))
    inspection_response_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("inspection_response.id")
    )
    reported_by_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    reporting_appointment_id: Mapped[str | None] = mapped_column(Text, ForeignKey("appointment.id"))
    issuing_authority_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("regulatory_authority.id")
    )
    at_subunit_id: Mapped[str | None] = mapped_column(Text, ForeignKey("subunit.id"))
    at_asset_id: Mapped[str | None] = mapped_column(Text, ForeignKey("asset.id"))
    description: Mapped[str] = mapped_column(Text)
    raised_severity: Mapped[str] = mapped_column(pg_enum("severity"))
    normalised_severity: Mapped[str] = mapped_column(pg_enum("severity"))
    observed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    location: Mapped[Any | None] = mapped_column(Geography("POINT", srid=4326))
    matched_defect_id: Mapped[str | None] = mapped_column(Text, ForeignKey("defect.id"))
    match_decision: Mapped[str] = mapped_column(pg_enum("match_decision"))
    match_decision_by_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    match_decision_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Finding(Base):
    """A confirmed breach. Regulator provenance is structured — issuing
    authority, unit and appointment — never a `raised_by_regulator` boolean,
    because operator authority must not imply regulator closure authority."""

    __tablename__ = "finding"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    mine_id: Mapped[str] = mapped_column(Text, ForeignKey("mine.id"))
    defect_id: Mapped[str | None] = mapped_column(Text, ForeignKey("defect.id"))
    obligation_instance_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("obligation_instance.id")
    )
    requirement_obligation_id: Mapped[str] = mapped_column(Text, ForeignKey("obligation.id"))
    severity: Mapped[str] = mapped_column(pg_enum("severity"))
    raised_by_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    issuing_authority_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("regulatory_authority.id")
    )
    issuing_authority_unit_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("authority_unit.id")
    )
    issuing_appointment_id: Mapped[str | None] = mapped_column(Text, ForeignKey("appointment.id"))
    responsible_organization_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("organization.id")
    )
    status: Mapped[str] = mapped_column(pg_enum("finding_status"))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Capa(Base):
    """Corrective + preventive action. Deadline extension is a counted,
    reasoned act rather than a bare UPDATE to due_on — repeated extensions
    are themselves a risk signal."""

    __tablename__ = "capa"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    finding_id: Mapped[str] = mapped_column(Text, ForeignKey("finding.id"))
    mine_id: Mapped[str] = mapped_column(Text, ForeignKey("mine.id"))
    corrective_action: Mapped[str] = mapped_column(Text)
    preventive_action: Mapped[str] = mapped_column(Text)
    assigned_to_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    assigned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    due_on: Mapped[date | None] = mapped_column(Date)
    status: Mapped[str] = mapped_column(pg_enum("capa_status"))
    submitted_by_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    verified_by_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    verified_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    rejection_reason: Mapped[str | None] = mapped_column(Text)
    extension_count: Mapped[int] = mapped_column(Integer)
    last_extension_reason: Mapped[str | None] = mapped_column(Text)
    last_extended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


__all__ = ["Capa", "Defect", "DefectAgeingBandConfig", "Finding", "Observation"]

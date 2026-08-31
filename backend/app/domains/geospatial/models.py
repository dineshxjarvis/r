"""Governed geometry, spatial policy and evaluation.

Mirrors migrations/sql/0006_geospatial.sql. A published geometry version is
immutable: a correction is a new version plus supersession, never an UPDATE
to the geometry, because a boundary that silently moved invalidates every
evaluation ever made against it.
"""

from __future__ import annotations

from datetime import datetime
from decimal import Decimal
from typing import Any

from geoalchemy2 import Geography
from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, pg_enum


class SpatialReferenceSystemProfile(Base):
    __tablename__ = "spatial_reference_system_profile"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    srid: Mapped[int] = mapped_column(Integer)
    axis_order: Mapped[str] = mapped_column(Text)
    unit: Mapped[str] = mapped_column(Text)
    vertical_datum: Mapped[str | None] = mapped_column(Text)
    area_of_use: Mapped[str | None] = mapped_column(Text)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SpatialLayerDefinition(Base):
    __tablename__ = "spatial_layer_definition"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str | None] = mapped_column(Text, ForeignKey("tenant.id"))
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    geometry_kind: Mapped[str] = mapped_column(pg_enum("geometry_kind"))
    layer_class: Mapped[str] = mapped_column(pg_enum("spatial_layer_class"))
    purpose: Mapped[str] = mapped_column(Text)
    classification: Mapped[str] = mapped_column(Text)
    allowed_dimensions: Mapped[str] = mapped_column(Text)
    schema_version: Mapped[int] = mapped_column(Integer)
    style: Mapped[dict[str, Any]] = mapped_column(JSONB)
    active: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class GovernedGeometry(Base):
    __tablename__ = "governed_geometry"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    layer_definition_id: Mapped[str] = mapped_column(
        Text, ForeignKey("spatial_layer_definition.id")
    )
    purpose: Mapped[str] = mapped_column(Text)
    target_type: Mapped[str] = mapped_column(Text)
    mine_id: Mapped[str] = mapped_column(Text, ForeignKey("mine.id"))
    subunit_id: Mapped[str | None] = mapped_column(Text, ForeignKey("subunit.id"))
    asset_id: Mapped[str | None] = mapped_column(Text, ForeignKey("asset.id"))
    code: Mapped[str | None] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class GovernedGeometryVersion(Base):
    """Both the source geometry as received and the normalized WGS84 copy are
    kept. When they differ, the transformation that produced the second is
    mandatory — an unexplained reprojection is how boundaries drift."""

    __tablename__ = "governed_geometry_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    governed_geometry_id: Mapped[str] = mapped_column(Text, ForeignKey("governed_geometry.id"))
    version_no: Mapped[int] = mapped_column(Integer)
    source_geometry: Mapped[dict[str, Any]] = mapped_column(JSONB)
    source_srs_profile_id: Mapped[str | None] = mapped_column(Text)
    transformation_ref: Mapped[str | None] = mapped_column(Text)
    normalized_geometry: Mapped[Any] = mapped_column(Geography(srid=4326))
    dimensionality: Mapped[str] = mapped_column(Text)
    accuracy_m: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    capture_method: Mapped[str | None] = mapped_column(Text)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    effective_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    status: Mapped[str] = mapped_column(pg_enum("geometry_version_status"))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    published_by_appointment_id: Mapped[str | None] = mapped_column(Text)
    superseded_by_id: Mapped[str | None] = mapped_column(Text)
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    withdraw_reason: Mapped[str | None] = mapped_column(Text)
    source_document_id: Mapped[str | None] = mapped_column(Text, ForeignKey("document.id"))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SpatialPolicyVersion(Base):
    __tablename__ = "spatial_policy_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    version_no: Mapped[int] = mapped_column(Integer)
    purpose: Mapped[str] = mapped_column(Text)
    target_kind: Mapped[str] = mapped_column(Text)
    predicate: Mapped[str] = mapped_column(Text)
    tolerance_m: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    accuracy_rule: Mapped[dict[str, Any]] = mapped_column(JSONB)
    vertical_rule: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    override_policy: Mapped[dict[str, Any]] = mapped_column(JSONB)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    effective_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class SpatialEvaluation(Base):
    """Immutable. Re-evaluation appends a new row and an override appends a
    linked decision; an outcome is never rewritten in place."""

    __tablename__ = "spatial_evaluation"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    subject_type: Mapped[str] = mapped_column(Text)
    subject_id: Mapped[str] = mapped_column(Text)
    target_geometry_version_id: Mapped[str] = mapped_column(
        Text, ForeignKey("governed_geometry_version.id")
    )
    policy_version_id: Mapped[str] = mapped_column(Text, ForeignKey("spatial_policy_version.id"))
    analysis_srid: Mapped[int] = mapped_column(Integer)
    transformation_ref: Mapped[str | None] = mapped_column(Text)
    algorithm: Mapped[str] = mapped_column(Text)
    outcome: Mapped[str] = mapped_column(pg_enum("spatial_eval_outcome"))
    distance_m: Mapped[Decimal | None] = mapped_column(Numeric(12, 2))
    measured_values: Mapped[dict[str, Any]] = mapped_column(JSONB)
    uncertainty_m: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    evaluated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class MapCompositionVersion(Base):
    __tablename__ = "map_composition_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    code: Mapped[str] = mapped_column(Text)
    version_no: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(Text)
    mine_id: Mapped[str | None] = mapped_column(Text, ForeignKey("mine.id"))
    layer_manifest: Mapped[dict[str, Any]] = mapped_column(JSONB)
    filters: Mapped[dict[str, Any]] = mapped_column(JSONB)
    as_of: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    style: Mapped[dict[str, Any]] = mapped_column(JSONB)
    projection: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("composition_status"))
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


__all__ = [
    "GovernedGeometry",
    "GovernedGeometryVersion",
    "MapCompositionVersion",
    "SpatialEvaluation",
    "SpatialLayerDefinition",
    "SpatialPolicyVersion",
    "SpatialReferenceSystemProfile",
]

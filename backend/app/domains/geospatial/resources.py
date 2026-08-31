"""Registered collections for governed geometry and the map."""

from __future__ import annotations

from typing import Any

from sqlalchemy import Select, or_

from app.core.time import utcnow
from app.domains.geospatial.models import (
    GovernedGeometryVersion,
    MapCompositionVersion,
    SpatialEvaluation,
    SpatialLayerDefinition,
)
from app.kernel.registry import Expansion, ResourceSpec, ViewSpec, registry


def _current_geometry(stmt: Select[Any]) -> Select[Any]:
    """Published and effective right now.

    The map always reads a version, never a mutable "current geometry" row —
    that is what makes an evaluation reproducible against the boundary as it
    stood when the evaluation ran.
    """
    now = utcnow()
    return stmt.where(
        GovernedGeometryVersion.status == "PUBLISHED",
        GovernedGeometryVersion.effective_from <= now,
        or_(
            GovernedGeometryVersion.effective_until.is_(None),
            GovernedGeometryVersion.effective_until > now,
        ),
    )


GOVERNED_GEOMETRY_VERSIONS = registry.register(
    ResourceSpec(
        collection="governed-geometry-versions",
        object_type="governed_geometry_version",
        model=GovernedGeometryVersion,
        read_capability="geospatial.read",
        state_field="status",
        tenant_field=None,
        mine_field=None,  # scoped through its governed_geometry parent
        filterable=frozenset({"governed_geometry_id", "status", "version_no", "capture_method"}),
        sortable=frozenset({"version_no", "effective_from", "created_at"}),
        views={
            "current": ViewSpec(
                name="current",
                summary="Published versions in force right now",
                apply=_current_geometry,
            )
        },
        # The raw source payload is large and only useful to a spatial
        # reviewer; the normalized geometry is what a map consumes.
        hidden_fields=frozenset({"source_geometry"}),
        default_sort="-version_no",
    )
)

SPATIAL_LAYERS = registry.register(
    ResourceSpec(
        collection="spatial-layers",
        object_type="spatial_layer_definition",
        model=SpatialLayerDefinition,
        read_capability="geospatial.read",
        mine_field=None,
        version_field=None,
        filterable=frozenset({"layer_class", "geometry_kind", "purpose", "active"}),
        sortable=frozenset({"name", "code"}),
        aggregatable=frozenset({"layer_class", "geometry_kind"}),
        default_sort="name",
    )
)

MAP_COMPOSITIONS = registry.register(
    ResourceSpec(
        collection="map-compositions",
        object_type="map_composition_version",
        model=MapCompositionVersion,
        read_capability="geospatial.read",
        create_capability="geospatial.compose",
        state_field="status",
        filterable=frozenset({"mine_id", "code", "status", "version_no"}),
        sortable=frozenset({"version_no", "created_at"}),
        expandable={
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            )
        },
        default_sort="-version_no",
    )
)

SPATIAL_EVALUATIONS = registry.register(
    ResourceSpec(
        collection="spatial-evaluations",
        object_type="spatial_evaluation",
        model=SpatialEvaluation,
        read_capability="geospatial.read",
        create_capability="geospatial.evaluate",
        state_field="outcome",
        version_field=None,
        mine_field=None,
        filterable=frozenset(
            {"subject_type", "subject_id", "outcome", "target_geometry_version_id"}
        ),
        sortable=frozenset({"evaluated_at", "distance_m"}),
        aggregatable=frozenset({"outcome"}),
        creatable=frozenset(
            {"subject_type", "subject_id", "target_geometry_version_id", "policy_version_id"}
        ),
        required_on_create=frozenset({"subject_type", "subject_id", "target_geometry_version_id"}),
        default_sort="-evaluated_at",
    )
)

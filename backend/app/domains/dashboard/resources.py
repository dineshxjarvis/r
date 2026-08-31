"""Registered collections for the dashboard domain."""

from __future__ import annotations

from app.domains.dashboard.models import MetricManifest
from app.kernel.registry import ResourceSpec, registry

METRIC_MANIFESTS = registry.register(
    ResourceSpec(
        collection="metric-manifests",
        object_type="metric_manifest",
        model=MetricManifest,
        read_capability="dashboard.read",
        create_capability="dashboard.read",
        version_field=None,
        mine_field=None,
        filterable=frozenset({"metric_key", "viewer_principal_id", "freshness", "computed_at"}),
        sortable=frozenset({"computed_at"}),
        default_sort="-computed_at",
    )
)

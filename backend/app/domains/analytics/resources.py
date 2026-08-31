"""Registered collections for signals and the AI governance chain.

All three AI features emit the same object — a signal. The definition behind
it differs; the shape a client renders does not.
"""

from __future__ import annotations

from typing import Any

from sqlalchemy import Select

from app.domains.analytics.actions import SIGNAL_ACTIONS
from app.domains.analytics.models import (
    AiDeployment,
    AiRun,
    MetricVersion,
    SignalDefinitionVersion,
    SignalInstance,
)
from app.kernel.registry import Expansion, ResourceSpec, ViewSpec, registry


def _active_signals(stmt: Select[Any]) -> Select[Any]:
    return stmt.where(SignalInstance.state.in_(["ACTIVE", "ACKNOWLEDGED"]))


SIGNALS = registry.register(
    ResourceSpec(
        collection="signals",
        object_type="signal_instance",
        model=SignalInstance,
        read_capability="signal.read",
        state_field="state",
        filterable=frozenset(
            {
                "mine_id",
                "state",
                "severity",
                "category",
                "subject_type",
                "subject_id",
                "signal_definition_version_id",
                "score",
                "emitted_at",
            }
        ),
        sortable=frozenset({"emitted_at", "score", "severity"}),
        searchable=("explanation",),
        aggregatable=frozenset({"mine_id", "state", "severity", "category"}),
        expandable={
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            ),
            "ai_run": Expansion(
                target_object="ai_run",
                local_field="ai_run_id",
                target_collection="ai-runs",
            ),
        },
        views={
            "active": ViewSpec(
                name="active",
                summary="Signals still awaiting a human response",
                apply=_active_signals,
            )
        },
        actions=SIGNAL_ACTIONS,
        # Live-appended stream: page numbers against it are meaningless.
        cursor_paginated=True,
        default_sort="-emitted_at",
    )
)

SIGNAL_DEFINITION_VERSIONS = registry.register(
    ResourceSpec(
        collection="signal-definition-versions",
        object_type="signal_definition_version",
        model=SignalDefinitionVersion,
        read_capability="signal.read",
        state_field="status",
        tenant_field=None,
        mine_field=None,
        filterable=frozenset({"signal_definition_id", "status", "version_no"}),
        sortable=frozenset({"version_no", "created_at"}),
        default_sort="-version_no",
    )
)

AI_RUNS = registry.register(
    ResourceSpec(
        collection="ai-runs",
        object_type="ai_run",
        model=AiRun,
        read_capability="ai.read_lineage",
        state_field="status",
        mine_field=None,
        version_field=None,
        filterable=frozenset({"deployment_id", "status", "model_version_id", "started_at"}),
        sortable=frozenset({"started_at"}),
        aggregatable=frozenset({"status", "deployment_id"}),
        cursor_paginated=True,
        default_sort="-started_at",
    )
)

AI_DEPLOYMENTS = registry.register(
    ResourceSpec(
        collection="ai-deployments",
        object_type="ai_deployment",
        model=AiDeployment,
        read_capability="ai.read_lineage",
        state_field="status",
        tenant_field=None,
        mine_field=None,
        filterable=frozenset({"status", "environment", "use_case_version_id"}),
        sortable=frozenset({"created_at"}),
        views={
            # Run lineage rides the deployment rather than a separate route:
            # a run is only meaningful relative to the deployment that made it.
            "runs": ViewSpec(
                name="runs",
                summary="Inference lineage for this deployment",
                apply=lambda stmt: stmt,
            )
        },
        default_sort="code",
    )
)

METRIC_VERSIONS = registry.register(
    ResourceSpec(
        collection="metric-versions",
        object_type="metric_version",
        model=MetricVersion,
        read_capability="dashboard.read",
        tenant_field=None,
        mine_field=None,
        version_field=None,
        filterable=frozenset({"metric_key", "version_no"}),
        sortable=frozenset({"metric_key", "version_no"}),
        default_sort="metric_key",
    )
)

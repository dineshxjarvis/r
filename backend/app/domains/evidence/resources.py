"""Registered collections for evidence and its verification attempts."""

from __future__ import annotations

from typing import Any

from sqlalchemy import Select

from app.domains.evidence.actions import EVIDENCE_ACTIONS
from app.domains.evidence.models import Evidence, EvidenceVerificationAttempt
from app.kernel.registry import Expansion, ResourceSpec, ViewSpec, registry


def _pending_sync(stmt: Select[Any]) -> Select[Any]:
    """Server-visible partial sync only. Fully-offline queue depth lives on
    the device — there is no server row to count until a client has synced
    at least once."""
    return stmt.where(Evidence.synced_at.is_(None))


def _sync_failures(stmt: Select[Any]) -> Select[Any]:
    return stmt.where(Evidence.sync_error.isnot(None))


EVIDENCE = registry.register(
    ResourceSpec(
        collection="evidence",
        object_type="evidence",
        model=Evidence,
        read_capability="evidence.read",
        state_field="verdict",
        client_generated_ids=True,
        version_field="row_version",
        filterable=frozenset(
            {
                "mine_id",
                "verdict",
                "media_type",
                "capture_path",
                "for_capa_id",
                "for_instance_id",
                "for_defect_id",
                "captured_by_person_id",
                "device_id",
                "is_mock_location",
            }
        ),
        sortable=frozenset({"captured_at_wall", "created_at", "chain_sequence"}),
        aggregatable=frozenset({"mine_id", "verdict", "media_type"}),
        expandable={
            "capa": Expansion(
                target_object="capa", local_field="for_capa_id", target_collection="capas"
            ),
            "mine": Expansion(
                target_object="mine", local_field="mine_id", target_collection="mines"
            ),
        },
        views={
            # The blocked-closure log. Same authorization path as evidence
            # itself, so it rides the collection rather than a second route.
            "verification_attempts": ViewSpec(
                name="verification_attempts",
                summary="Every closure attempt against this evidence",
                apply=lambda stmt: stmt,
            ),
            "pending_sync": ViewSpec(
                name="pending_sync",
                summary="Captures the server has seen but not marked synced",
                apply=_pending_sync,
            ),
            "sync_failures": ViewSpec(
                name="sync_failures",
                summary="Captures whose sync failed after reaching the server",
                apply=_sync_failures,
            ),
        },
        actions=EVIDENCE_ACTIONS,
        hidden_fields=frozenset({"storage_bucket", "storage_key"}),
        default_sort="-captured_at_wall",
    )
)

VERIFICATION_ATTEMPTS = registry.register(
    ResourceSpec(
        collection="evidence-verification-attempts",
        object_type="evidence_verification_attempt",
        model=EvidenceVerificationAttempt,
        read_capability="evidence.read",
        state_field="outcome",
        version_field=None,
        mine_field=None,
        filterable=frozenset(
            {"capa_id", "obligation_instance_id", "evidence_id", "outcome", "within_geofence"}
        ),
        sortable=frozenset({"attempted_at", "distance_m"}),
        aggregatable=frozenset({"outcome"}),
        expandable={
            "evidence": Expansion(
                target_object="evidence",
                local_field="evidence_id",
                target_collection="evidence",
            )
        },
        default_sort="-attempted_at",
    )
)

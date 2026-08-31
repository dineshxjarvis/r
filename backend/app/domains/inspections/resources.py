"""Registered collections for the inspection domain."""

from __future__ import annotations

from typing import Any

from sqlalchemy import Select

from app.domains.inspections.actions import (
    INSPECTION_ACTIONS,
    MEMBER_ACTIONS,
    VISIT_ACTIONS,
)
from app.domains.inspections.models import (
    Inspection,
    InspectionAssignmentMember,
    InspectionReport,
    InspectionResponse,
    InspectionTypeVersion,
    InspectionVisit,
)
from app.kernel.registry import Expansion, ResourceSpec, ViewSpec, registry


def _current_types(stmt: Select[Any]) -> Select[Any]:
    """The type catalogue as it stands today — what a create form offers."""
    from sqlalchemy import or_

    from app.core.time import utcnow

    now = utcnow()
    return stmt.where(
        InspectionTypeVersion.effective_from <= now,
        or_(
            InspectionTypeVersion.effective_until.is_(None),
            InspectionTypeVersion.effective_until > now,
        ),
    )


def _offered(stmt: Select[Any]) -> Select[Any]:
    return stmt.where(InspectionAssignmentMember.assignment_status == "OFFERED")


def _open_inspections(stmt: Select[Any]) -> Select[Any]:
    return stmt.where(Inspection.status.notin_(["CLOSED", "CANCELLED"]))


INSPECTIONS = registry.register(
    ResourceSpec(
        collection="inspections",
        object_type="inspection",
        model=Inspection,
        read_capability="inspection.read",
        create_capability="inspection.plan",
        state_field="status",
        mine_field=None,  # targets carry the mine; an inspection may span several
        filterable=frozenset(
            {
                "status",
                "origin",
                "inspection_type_version_id",
                "issuing_authority_id",
                "scheduled_from",
                "created_by_principal_id",
            }
        ),
        sortable=frozenset({"scheduled_from", "created_at", "closed_at"}),
        searchable=("title", "purpose_detail"),
        aggregatable=frozenset({"status", "origin"}),
        patchable=frozenset({"title", "purpose_detail", "scheduled_from", "scheduled_until"}),
        creatable=frozenset(
            {
                "inspection_type_version_id",
                "origin",
                "title",
                "purpose_code",
                "purpose_detail",
                "scheduled_from",
                "scheduled_until",
            }
        ),
        required_on_create=frozenset({"inspection_type_version_id", "origin", "title"}),
        views={
            "open": ViewSpec(
                name="open",
                summary="Inspections not yet closed or cancelled",
                apply=_open_inspections,
            ),
        },
        actions=INSPECTION_ACTIONS,
        default_sort="-scheduled_from",
    )
)

INSPECTION_TYPE_VERSIONS = registry.register(
    ResourceSpec(
        collection="inspection-type-versions",
        object_type="inspection_type_version",
        model=InspectionTypeVersion,
        read_capability="inspection.read",
        tenant_field=None,
        mine_field=None,
        version_field=None,
        filterable=frozenset({"inspection_type_id", "version_no", "required_mandate_id"}),
        sortable=frozenset({"version_no", "effective_from"}),
        views={
            "current": ViewSpec(
                name="current",
                summary="Type versions in force right now",
                apply=_current_types,
            )
        },
        default_sort="-version_no",
    )
)

INSPECTION_VISITS = registry.register(
    ResourceSpec(
        collection="inspection-visits",
        object_type="inspection_visit",
        model=InspectionVisit,
        read_capability="inspection.read",
        create_capability="inspection.plan",
        state_field="status",
        tenant_field=None,
        mine_field=None,
        filterable=frozenset({"inspection_id", "status", "visit_number"}),
        sortable=frozenset({"visit_number", "planned_from"}),
        creatable=frozenset({"inspection_id", "visit_number", "planned_from", "planned_until"}),
        required_on_create=frozenset({"inspection_id", "visit_number"}),
        expandable={
            "inspection": Expansion(
                target_object="inspection",
                local_field="inspection_id",
                target_collection="inspections",
            )
        },
        actions=VISIT_ACTIONS,
        default_sort="visit_number",
    )
)

INSPECTION_ASSIGNMENT_MEMBERS = registry.register(
    ResourceSpec(
        collection="inspection-assignment-members",
        object_type="inspection_assignment_member",
        model=InspectionAssignmentMember,
        read_capability="inspection.read",
        state_field="assignment_status",
        tenant_field=None,
        mine_field=None,
        version_field=None,
        filterable=frozenset(
            {"assignment_version_id", "person_id", "assignment_status", "participation_role"}
        ),
        sortable=frozenset({"offered_at", "accepted_at"}),
        views={
            "offered": ViewSpec(
                name="offered",
                summary="Places offered and awaiting a response",
                apply=_offered,
            )
        },
        actions=MEMBER_ACTIONS,
        default_sort="-offered_at",
    )
)

INSPECTION_RESPONSES = registry.register(
    ResourceSpec(
        collection="inspection-responses",
        object_type="inspection_response",
        model=InspectionResponse,
        read_capability="inspection.read",
        create_capability="inspection.conduct",
        state_field="response",
        tenant_field=None,
        mine_field=None,
        client_generated_ids=True,
        filterable=frozenset({"checklist_item_id", "visit_id", "response"}),
        sortable=frozenset({"responded_at"}),
        aggregatable=frozenset({"response"}),
        creatable=frozenset(
            {
                "id",
                "checklist_item_id",
                "visit_id",
                "response",
                "measurement",
                "reason",
                "responded_by_assignment_member_id",
                "responded_at",
            }
        ),
        required_on_create=frozenset(
            {"checklist_item_id", "response", "responded_by_assignment_member_id", "responded_at"}
        ),
        default_sort="-responded_at",
    )
)

INSPECTION_REPORTS = registry.register(
    ResourceSpec(
        collection="inspection-reports",
        object_type="inspection_report",
        model=InspectionReport,
        read_capability="inspection.read",
        create_capability="inspection.prepare_report",
        state_field="status",
        tenant_field=None,
        mine_field=None,
        filterable=frozenset({"inspection_id", "report_kind", "status"}),
        sortable=frozenset({"created_at", "issued_at"}),
        creatable=frozenset({"inspection_id", "report_kind", "document_id"}),
        required_on_create=frozenset({"inspection_id", "report_kind"}),
        expandable={
            "inspection": Expansion(
                target_object="inspection",
                local_field="inspection_id",
                target_collection="inspections",
            )
        },
        default_sort="-created_at",
    )
)

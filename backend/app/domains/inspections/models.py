"""Inspection catalogue, lifecycle, assignment, visits, checklist, reports.

Mirrors migrations/sql/0004_inspections.sql. Only the tables the v0.01
surface actually serves are mapped; handovers, requests and access events
exist in the schema and gain models when their endpoints do.
"""

from __future__ import annotations

from datetime import datetime
from typing import Any

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, pg_enum


class InspectionType(Base):
    __tablename__ = "inspection_type"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ChecklistTemplateVersion(Base):
    __tablename__ = "checklist_template_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    version_no: Mapped[int] = mapped_column(Integer)
    title: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    published_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class ChecklistTemplateItem(Base):
    __tablename__ = "checklist_template_item"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    template_version_id: Mapped[str] = mapped_column(
        Text, ForeignKey("checklist_template_version.id")
    )
    sequence_no: Mapped[int] = mapped_column(Integer)
    text: Mapped[str] = mapped_column(Text)
    guidance: Mapped[str | None] = mapped_column(Text)
    mandatory: Mapped[bool] = mapped_column(Boolean)
    required_competency_id: Mapped[str | None] = mapped_column(Text)
    response_schema: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InspectionTypeVersion(Base):
    """Freezes behaviour: which origins may use this type, which mandate it
    requires, which checklist it instantiates. An inspection references the
    version, so changing the catalogue never rewrites history."""

    __tablename__ = "inspection_type_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    inspection_type_id: Mapped[str] = mapped_column(Text, ForeignKey("inspection_type.id"))
    version_no: Mapped[int] = mapped_column(Integer)
    allowed_origins: Mapped[list[str]] = mapped_column(ARRAY(pg_enum("inspection_origin")))
    required_mandate_id: Mapped[str | None] = mapped_column(Text, ForeignKey("mandate.id"))
    checklist_template_version_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("checklist_template_version.id")
    )
    workflow_policy: Mapped[dict[str, Any]] = mapped_column(JSONB)
    report_policy: Mapped[dict[str, Any]] = mapped_column(JSONB)
    closure_policy: Mapped[dict[str, Any]] = mapped_column(JSONB)
    effective_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    effective_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Inspection(Base):
    __tablename__ = "inspection"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    inspection_type_version_id: Mapped[str] = mapped_column(
        Text, ForeignKey("inspection_type_version.id")
    )
    origin: Mapped[str] = mapped_column(pg_enum("inspection_origin"))
    creation_mode: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("inspection_status"))
    title: Mapped[str] = mapped_column(Text)
    purpose_code: Mapped[str | None] = mapped_column(Text)
    purpose_detail: Mapped[str | None] = mapped_column(Text)
    scheduled_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    scheduled_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    fieldwork_completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    lead_assignment_member_id: Mapped[str | None] = mapped_column(Text)
    issuing_authority_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("regulatory_authority.id")
    )
    issuing_authority_unit_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("authority_unit.id")
    )
    supporting_mandate_assignment_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("mandate_assignment.id")
    )
    jurisdiction_assignment_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("jurisdiction_assignment.id")
    )
    source_instrument_document_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("document.id")
    )
    claimed_issuer: Mapped[str | None] = mapped_column(Text)
    regulatory_case_id: Mapped[str | None] = mapped_column(Text)
    created_by_principal_id: Mapped[str] = mapped_column(Text, ForeignKey("principal.id"))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InspectionTarget(Base):
    __tablename__ = "inspection_target"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    inspection_id: Mapped[str] = mapped_column(Text, ForeignKey("inspection.id"))
    target_type: Mapped[str] = mapped_column(Text)
    mine_id: Mapped[str] = mapped_column(Text, ForeignKey("mine.id"))
    subunit_id: Mapped[str | None] = mapped_column(Text, ForeignKey("subunit.id"))
    asset_id: Mapped[str | None] = mapped_column(Text, ForeignKey("asset.id"))
    purpose: Mapped[str | None] = mapped_column(Text)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class InspectionAssignmentVersion(Base):
    __tablename__ = "inspection_assignment_version"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    inspection_id: Mapped[str] = mapped_column(Text, ForeignKey("inspection.id"))
    version_no: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(pg_enum("assignment_version_status"))
    proposed_by_appointment_id: Mapped[str | None] = mapped_column(Text)
    decided_by_appointment_id: Mapped[str | None] = mapped_column(Text)
    effective_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    replaced_by_id: Mapped[str | None] = mapped_column(Text)
    reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InspectionAssignmentMember(Base):
    """Acceptance is recorded, never assumed — an inspector who has not
    accepted is not on the team, and fieldwork cannot start without the
    mandatory roles actually filled."""

    __tablename__ = "inspection_assignment_member"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    assignment_version_id: Mapped[str] = mapped_column(
        Text, ForeignKey("inspection_assignment_version.id")
    )
    person_id: Mapped[str] = mapped_column(Text, ForeignKey("person.id"))
    appointment_id: Mapped[str | None] = mapped_column(Text, ForeignKey("appointment.id"))
    affiliation_id: Mapped[str | None] = mapped_column(Text, ForeignKey("affiliation.id"))
    participation_role: Mapped[str] = mapped_column(pg_enum("participation_role"))
    assignment_status: Mapped[str] = mapped_column(pg_enum("assignment_member_status"))
    offered_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    responded_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    accepted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    withdrawn_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    response_reason: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InspectionVisit(Base):
    __tablename__ = "inspection_visit"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    inspection_id: Mapped[str] = mapped_column(Text, ForeignKey("inspection.id"))
    visit_number: Mapped[int] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(pg_enum("visit_status"))
    planned_from: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    planned_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actual_ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    postponement_reason: Mapped[str | None] = mapped_column(Text)
    cancellation_reason: Mapped[str | None] = mapped_column(Text)
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InspectionChecklistInstance(Base):
    __tablename__ = "inspection_checklist_instance"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    inspection_id: Mapped[str] = mapped_column(Text, ForeignKey("inspection.id"))
    template_version_id: Mapped[str] = mapped_column(
        Text, ForeignKey("checklist_template_version.id")
    )
    frozen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InspectionChecklistItem(Base):
    __tablename__ = "inspection_checklist_item"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    instance_id: Mapped[str] = mapped_column(Text, ForeignKey("inspection_checklist_instance.id"))
    source_item_version_id: Mapped[str] = mapped_column(
        Text, ForeignKey("checklist_template_item.id")
    )
    sequence_no: Mapped[int] = mapped_column(Integer)
    mandatory: Mapped[bool] = mapped_column(Boolean)
    required_competency_id: Mapped[str | None] = mapped_column(Text)


class InspectionResponse(Base):
    """Checklist answer. Client-generated id for offline capture; NOT_APPLICABLE
    and NOT_INSPECTED carry a mandatory reason, so a blank checklist can never
    read as a clean one."""

    __tablename__ = "inspection_response"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    checklist_item_id: Mapped[str] = mapped_column(Text, ForeignKey("inspection_checklist_item.id"))
    visit_id: Mapped[str | None] = mapped_column(Text, ForeignKey("inspection_visit.id"))
    response: Mapped[str] = mapped_column(pg_enum("checklist_response_value"))
    measurement: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    reason: Mapped[str | None] = mapped_column(Text)
    responded_by_assignment_member_id: Mapped[str] = mapped_column(
        Text, ForeignKey("inspection_assignment_member.id")
    )
    responded_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InspectionReport(Base):
    __tablename__ = "inspection_report"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    inspection_id: Mapped[str] = mapped_column(Text, ForeignKey("inspection.id"))
    report_kind: Mapped[str] = mapped_column(pg_enum("inspection_report_kind"))
    document_id: Mapped[str | None] = mapped_column(Text, ForeignKey("document.id"))
    status: Mapped[str] = mapped_column(pg_enum("inspection_report_status"))
    prepared_by_assignment_member_id: Mapped[str | None] = mapped_column(Text)
    reviewed_by_appointment_id: Mapped[str | None] = mapped_column(Text)
    issued_by_appointment_id: Mapped[str | None] = mapped_column(Text)
    issued_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    supersedes_report_id: Mapped[str | None] = mapped_column(Text)
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class InspectionDecision(Base):
    """Append-only. Closure never deletes observations or substitutes for
    finding/CAPA closure — it records that a decision was taken, by whom,
    under which appointment and mandate."""

    __tablename__ = "inspection_decision"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    inspection_id: Mapped[str] = mapped_column(Text, ForeignKey("inspection.id"))
    decision_type: Mapped[str] = mapped_column(pg_enum("inspection_decision_type"))
    outcome: Mapped[str] = mapped_column(Text)
    decided_by_principal_id: Mapped[str] = mapped_column(Text, ForeignKey("principal.id"))
    supporting_appointment_id: Mapped[str | None] = mapped_column(Text)
    supporting_mandate_assignment_id: Mapped[str | None] = mapped_column(Text)
    policy_version: Mapped[str | None] = mapped_column(Text)
    reason: Mapped[str | None] = mapped_column(Text)
    decided_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


__all__ = [
    "ChecklistTemplateItem",
    "ChecklistTemplateVersion",
    "Inspection",
    "InspectionAssignmentMember",
    "InspectionAssignmentVersion",
    "InspectionChecklistInstance",
    "InspectionChecklistItem",
    "InspectionDecision",
    "InspectionReport",
    "InspectionResponse",
    "InspectionTarget",
    "InspectionType",
    "InspectionTypeVersion",
    "InspectionVisit",
]

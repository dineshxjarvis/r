"""Identity, tenancy, physical hierarchy, positions and appointments.

Mirrors migrations/sql/0002_identity.sql. The migration is the physical
schema authority; these are the mapped view of it. Enum columns are typed as
String here — PostgreSQL owns the vocabulary and rejects anything outside it,
so restating the members in Python would be a second copy free to drift.
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


class Tenant(Base):
    __tablename__ = "tenant"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("tenant_status"))
    data_region: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Organization(Base):
    __tablename__ = "organization"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str | None] = mapped_column(Text, ForeignKey("tenant.id"))
    code: Mapped[str] = mapped_column(Text)
    legal_name: Mapped[str] = mapped_column(Text)
    organization_kind: Mapped[str] = mapped_column(Text)
    registration_ref: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("org_status"))
    succeeds_id: Mapped[str | None] = mapped_column(Text, ForeignKey("organization.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class OrganizationUnit(Base):
    __tablename__ = "organization_unit"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    organization_id: Mapped[str] = mapped_column(Text, ForeignKey("organization.id"))
    parent_unit_id: Mapped[str | None] = mapped_column(Text, ForeignKey("organization_unit.id"))
    unit_kind: Mapped[str] = mapped_column(Text)
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Person(Base):
    __tablename__ = "person"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    display_name: Mapped[str] = mapped_column(Text)
    primary_email: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("person_status"))
    merged_into_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Principal(Base):
    __tablename__ = "principal"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    kind: Mapped[str] = mapped_column(pg_enum("principal_kind"))
    person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    status: Mapped[str] = mapped_column(pg_enum("principal_status"))
    credential_version: Mapped[int] = mapped_column(Integer)
    last_authenticated_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class PasswordAuthenticator(Base):
    __tablename__ = "password_authenticator"

    principal_id: Mapped[str] = mapped_column(Text, ForeignKey("principal.id"), primary_key=True)
    password_hash: Mapped[str] = mapped_column(Text)
    parameters: Mapped[dict[str, Any]] = mapped_column(JSONB)
    changed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))


class Session(Base):
    __tablename__ = "session"

    id_hash: Mapped[str] = mapped_column(Text, primary_key=True)
    principal_id: Mapped[str] = mapped_column(Text, ForeignKey("principal.id"))
    credential_version: Mapped[int] = mapped_column(Integer)
    assurance_level: Mapped[str] = mapped_column(pg_enum("assurance_level"))
    authenticated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    issued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    idle_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    absolute_expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    selected_tenant_id: Mapped[str | None] = mapped_column(Text, ForeignKey("tenant.id"))
    selected_resource_type: Mapped[str | None] = mapped_column(Text)
    selected_resource_id: Mapped[str | None] = mapped_column(Text)
    csrf_secret_hash: Mapped[str] = mapped_column(Text)
    device_fingerprint: Mapped[str | None] = mapped_column(Text)
    user_agent: Mapped[str | None] = mapped_column(Text)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revocation_reason: Mapped[str | None] = mapped_column(Text)


class Affiliation(Base):
    __tablename__ = "affiliation"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    person_id: Mapped[str] = mapped_column(Text, ForeignKey("person.id"))
    organization_id: Mapped[str] = mapped_column(Text, ForeignKey("organization.id"))
    organization_unit_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("organization_unit.id")
    )
    affiliation_kind: Mapped[str] = mapped_column(Text)
    external_reference: Mapped[str | None] = mapped_column(Text)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    superseded_by_id: Mapped[str | None] = mapped_column(Text, ForeignKey("affiliation.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Mine(Base):
    """The compliance unit. Carries the applicability dimensions the
    obligation engine evaluates against — which is why they live here rather
    than in a side table: materialisation reads them on every rule check."""

    __tablename__ = "mine"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    mine_type: Mapped[str] = mapped_column(pg_enum("mine_type"))
    gassiness_class: Mapped[str] = mapped_column(pg_enum("gassiness_class"))
    production_scale_tpa: Mapped[Decimal | None] = mapped_column(Numeric(14, 2))
    headcount: Mapped[int | None] = mapped_column(Integer)
    lease_ref: Mapped[str | None] = mapped_column(Text)
    state_code: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("mine_status"))
    location: Mapped[Any | None] = mapped_column(Geography("POINT", srid=4326))
    boundary: Mapped[Any | None] = mapped_column(Geography("MULTIPOLYGON", srid=4326))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Subunit(Base):
    __tablename__ = "subunit"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    mine_id: Mapped[str] = mapped_column(Text, ForeignKey("mine.id"))
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    subunit_kind: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    location: Mapped[Any | None] = mapped_column(Geography("POINT", srid=4326))
    footprint: Mapped[Any | None] = mapped_column(Geography("MULTIPOLYGON", srid=4326))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Asset(Base):
    __tablename__ = "asset"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    mine_id: Mapped[str] = mapped_column(Text, ForeignKey("mine.id"))
    subunit_id: Mapped[str | None] = mapped_column(Text, ForeignKey("subunit.id"))
    code: Mapped[str | None] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    asset_kind: Mapped[str] = mapped_column(Text)
    status: Mapped[str] = mapped_column(Text)
    location: Mapped[Any | None] = mapped_column(Geography("POINT", srid=4326))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class PositionTemplate(Base):
    __tablename__ = "position_template"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    owning_organization_id: Mapped[str | None] = mapped_column(Text, ForeignKey("organization.id"))
    code: Mapped[str] = mapped_column(Text)
    title: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    statutory: Mapped[bool] = mapped_column(Boolean)
    default_holder_policy: Mapped[str] = mapped_column(pg_enum("holder_policy"))
    active: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Post(Base):
    __tablename__ = "post"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    organization_id: Mapped[str] = mapped_column(Text, ForeignKey("organization.id"))
    organization_unit_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("organization_unit.id")
    )
    position_template_id: Mapped[str] = mapped_column(Text, ForeignKey("position_template.id"))
    holder_policy: Mapped[str] = mapped_column(pg_enum("holder_policy"))
    scope_resource_type: Mapped[str | None] = mapped_column(Text)
    scope_resource_id: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("post_status"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Appointment(Base):
    __tablename__ = "appointment"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    person_id: Mapped[str] = mapped_column(Text, ForeignKey("person.id"))
    post_id: Mapped[str] = mapped_column(Text, ForeignKey("post.id"))
    affiliation_id: Mapped[str | None] = mapped_column(Text, ForeignKey("affiliation.id"))
    mode: Mapped[str] = mapped_column(pg_enum("appointment_mode"))
    holder_policy: Mapped[str] = mapped_column(pg_enum("holder_policy"))
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    source_instrument_document_id: Mapped[str | None] = mapped_column(Text)
    appointed_by_appointment_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("appointment.id")
    )
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    revoked_by_principal_id: Mapped[str | None] = mapped_column(Text, ForeignKey("principal.id"))
    revoke_reason: Mapped[str | None] = mapped_column(Text)
    superseded_by_id: Mapped[str | None] = mapped_column(Text, ForeignKey("appointment.id"))
    row_version: Mapped[int] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Capability(Base):
    __tablename__ = "capability"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    code: Mapped[str] = mapped_column(Text)
    description: Mapped[str] = mapped_column(Text)
    risk_class: Mapped[str] = mapped_column(pg_enum("risk_class"))
    required_assurance: Mapped[str] = mapped_column(pg_enum("assurance_level"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class RegulatoryAuthority(Base):
    __tablename__ = "regulatory_authority"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    organization_id: Mapped[str] = mapped_column(Text, ForeignKey("organization.id"))
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class AuthorityUnit(Base):
    __tablename__ = "authority_unit"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    regulatory_authority_id: Mapped[str] = mapped_column(
        Text, ForeignKey("regulatory_authority.id")
    )
    parent_unit_id: Mapped[str | None] = mapped_column(Text, ForeignKey("authority_unit.id"))
    unit_kind: Mapped[str] = mapped_column(Text)
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Mandate(Base):
    __tablename__ = "mandate"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    regulatory_authority_id: Mapped[str] = mapped_column(
        Text, ForeignKey("regulatory_authority.id")
    )
    code: Mapped[str] = mapped_column(Text)
    name: Mapped[str] = mapped_column(Text)
    description: Mapped[str | None] = mapped_column(Text)
    active: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class MandateAssignment(Base):
    __tablename__ = "mandate_assignment"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    appointment_id: Mapped[str] = mapped_column(Text, ForeignKey("appointment.id"))
    mandate_id: Mapped[str] = mapped_column(Text, ForeignKey("mandate.id"))
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    source_instrument_document_id: Mapped[str | None] = mapped_column(Text)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    superseded_by_id: Mapped[str | None] = mapped_column(Text, ForeignKey("mandate_assignment.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class JurisdictionAssignment(Base):
    __tablename__ = "jurisdiction_assignment"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    appointment_id: Mapped[str] = mapped_column(Text, ForeignKey("appointment.id"))
    mandate_assignment_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("mandate_assignment.id")
    )
    selector_type: Mapped[str] = mapped_column(Text)
    selector_schema_version: Mapped[int] = mapped_column(Integer)
    selector_payload: Mapped[dict[str, Any]] = mapped_column(JSONB)
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    source_instrument_document_id: Mapped[str | None] = mapped_column(Text)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    superseded_by_id: Mapped[str | None] = mapped_column(
        Text, ForeignKey("jurisdiction_assignment.id")
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class Operation(Base):
    """The single async-status object for the whole platform."""

    __tablename__ = "operation"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str | None] = mapped_column(Text)
    kind: Mapped[str] = mapped_column(Text)
    target_type: Mapped[str | None] = mapped_column(Text)
    target_id: Mapped[str | None] = mapped_column(Text)
    status: Mapped[str] = mapped_column(pg_enum("operation_status"))
    progress_completed: Mapped[int] = mapped_column(Integer)
    progress_total: Mapped[int | None] = mapped_column(Integer)
    result: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    error: Mapped[dict[str, Any] | None] = mapped_column(JSONB)
    created_by_principal_id: Mapped[str] = mapped_column(Text)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    estimated_completion_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    finished_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class EnumRegistry(Base):
    """Labels, ordering and deprecations for every open vocabulary.

    Clients read this instead of hardcoding enum labels, which is what lets a
    new severity level or document type ship as data rather than a release.
    """

    __tablename__ = "enum_registry"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    enum_name: Mapped[str] = mapped_column(Text)
    value: Mapped[str] = mapped_column(Text)
    label: Mapped[str] = mapped_column(Text)
    label_i18n: Mapped[dict[str, Any]] = mapped_column(JSONB)
    ordering: Mapped[int] = mapped_column(Integer)
    color: Mapped[str | None] = mapped_column(Text)
    deprecated: Mapped[bool] = mapped_column(Boolean)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


__all__ = [
    "Affiliation",
    "Appointment",
    "Asset",
    "AuthorityUnit",
    "Capability",
    "EnumRegistry",
    "JurisdictionAssignment",
    "Mandate",
    "MandateAssignment",
    "Mine",
    "Operation",
    "Organization",
    "OrganizationUnit",
    "PasswordAuthenticator",
    "Person",
    "Post",
    "PositionTemplate",
    "Principal",
    "RegulatoryAuthority",
    "Session",
    "Subunit",
    "Tenant",
]

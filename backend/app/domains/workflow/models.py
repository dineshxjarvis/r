"""Notifications and receipt-only delegation.

Mirrors the workflow half of migrations/sql/0007_workflow_dashboard.sql.
These rows are written by the outbox notifier worker, never directly by a
request handler — a notification is the *consequence* of a committed domain
event, so it cannot be created by something that might still roll back.
"""

from __future__ import annotations

from datetime import datetime

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.orm import Mapped, mapped_column

from app.core.db import Base, pg_enum


class Notification(Base):
    """Addressed to a post, resolved to a person.

    `subject_type`/`subject_ref` is a deliberate untyped pair: a notification
    subject can be any of a dozen tables, and unlike a business entity these
    are disposable delivery records — losing FK enforcement here does not risk
    the kind of silent integrity gap it would on a canonical record.
    """

    __tablename__ = "notification"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    target_post_id: Mapped[str | None] = mapped_column(Text, ForeignKey("post.id"))
    resolved_person_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    delivered_to_delegate_id: Mapped[str | None] = mapped_column(Text, ForeignKey("person.id"))
    subject_type: Mapped[str] = mapped_column(Text)
    subject_ref: Mapped[str] = mapped_column(Text)
    severity: Mapped[str] = mapped_column(pg_enum("severity"))
    title: Mapped[str] = mapped_column(Text)
    body: Mapped[str | None] = mapped_column(Text)
    channel: Mapped[str] = mapped_column(pg_enum("notification_channel"))
    status: Mapped[str] = mapped_column(pg_enum("notification_status"))
    requires_ack: Mapped[bool] = mapped_column(Boolean)
    queued_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    delivered_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    acknowledged_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    actioned_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    failure_reason: Mapped[str | None] = mapped_column(Text)
    row_version: Mapped[int] = mapped_column(Integer)


class NotificationDelegate(Base):
    """Post-scoped, because at resolution time the post may already be vacant.
    Receipt only — a delegate gains no authority whatsoever."""

    __tablename__ = "notification_delegate"

    id: Mapped[str] = mapped_column(Text, primary_key=True)
    tenant_id: Mapped[str] = mapped_column(Text, ForeignKey("tenant.id"))
    post_id: Mapped[str] = mapped_column(Text, ForeignKey("post.id"))
    delegate_person_id: Mapped[str] = mapped_column(Text, ForeignKey("person.id"))
    registered_by_person_id: Mapped[str] = mapped_column(Text, ForeignKey("person.id"))
    valid_from: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    valid_until: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    reason: Mapped[str] = mapped_column(Text)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))


__all__ = ["Notification", "NotificationDelegate"]

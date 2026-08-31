"""Registered collections for workflow."""

from __future__ import annotations

from app.domains.workflow.actions import NOTIFICATION_ACTIONS
from app.domains.workflow.models import Notification, NotificationDelegate
from app.kernel.registry import ResourceSpec, registry

NOTIFICATIONS = registry.register(
    ResourceSpec(
        collection="notifications",
        object_type="notification",
        model=Notification,
        read_capability="notification.read",
        state_field="status",
        mine_field=None,
        filterable=frozenset(
            {"resolved_person_id", "status", "severity", "subject_type", "subject_ref", "channel"}
        ),
        sortable=frozenset({"queued_at"}),
        aggregatable=frozenset({"status", "severity", "subject_type"}),
        actions=NOTIFICATION_ACTIONS,
        # An inbox grows at the head; a page number against it would shift
        # under the reader between requests.
        cursor_paginated=True,
        default_sort="-queued_at",
    )
)

NOTIFICATION_DELEGATES = registry.register(
    ResourceSpec(
        collection="notification-delegates",
        object_type="notification_delegate",
        model=NotificationDelegate,
        read_capability="notification.read",
        create_capability="notification.delegate",
        version_field=None,
        mine_field=None,
        filterable=frozenset({"post_id", "delegate_person_id"}),
        sortable=frozenset({"valid_from", "valid_until"}),
        creatable=frozenset(
            {"post_id", "delegate_person_id", "valid_from", "valid_until", "reason"}
        ),
        required_on_create=frozenset(
            {"post_id", "delegate_person_id", "valid_from", "valid_until", "reason"}
        ),
        default_sort="-valid_from",
    )
)

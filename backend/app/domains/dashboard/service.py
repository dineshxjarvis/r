"""The compliance measures and the personal queue.

One rule governs this whole module: **every number is a link, not a claim.**
A measure returns its value together with the record references behind it, so
the client can drill straight through to the rows rather than re-deriving
them with a second query that might disagree.

The other rule is about zero. A rate over an empty denominator is `null`, not
`0` and not `1` — "no obligations were due" and "nothing was complied with"
are different facts, and rendering the first as 0% is the exact failure this
product exists to prevent.
"""

from __future__ import annotations

from datetime import date
from decimal import Decimal
from typing import Any

from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.authz.principal import Principal
from app.core.time import utcnow

# The whole measure query. Statuses excluded from every denominator are
# spelled out rather than interpolated: an obligation that does not apply was
# never owed, and a validly waived one was formally excused.
#
# `:unclipped` carries the portfolio case as a bound parameter instead of a
# conditionally-appended clause, so this string is a constant and the scope
# decision stays visible in the SQL rather than hidden in string assembly.
MEASURE_SQL = """
    SELECT
      COUNT(*) FILTER (
        WHERE oi.status NOT IN ('NOT_APPLICABLE', 'WAIVED')
      ) AS eligible,
      COUNT(*) FILTER (WHERE oi.status = 'SATISFIED') AS satisfied,
      COUNT(*) FILTER (
        WHERE oi.status IN ('SUBMITTED', 'SATISFIED', 'EVIDENCE_MISMATCH')
      ) AS submitted,
      COUNT(*) FILTER (WHERE oi.status IN ('OVERDUE', 'ESCALATED')) AS overdue,
      COUNT(*) FILTER (
        WHERE oi.reconciliation = 'CLAIMED_UNSUPPORTED'
      ) AS unsupported
    FROM obligation_instance oi
    WHERE oi.due_on <= :period_end
      AND (CAST(:mine_id AS text) IS NULL OR oi.mine_id = :mine_id)
      AND (:unclipped OR oi.mine_id = ANY(:mine_ids))
"""


async def measures(
    session: AsyncSession,
    principal: Principal,
    *,
    mine_id: str | None = None,
    period_end: date | None = None,
) -> dict[str, Any]:
    params: dict[str, Any] = {
        "period_end": period_end or utcnow().date(),
        "mine_ids": principal.authorized_mine_ids or [],
        "mine_id": mine_id,
        "unclipped": principal.authorized_mine_ids is None,
    }

    row = (await session.execute(text(MEASURE_SQL), params)).mappings().one()

    eligible = row["eligible"] or 0

    return {
        "period_end": params["period_end"].isoformat(),
        "scope": {
            "mine_id": mine_id,
            "mine_count": (
                None
                if principal.authorized_mine_ids is None
                else len(principal.authorized_mine_ids)
            ),
        },
        "measures": [
            _rate(
                "verified_compliance_rate",
                "Verified compliance",
                row["satisfied"],
                eligible,
            ),
            _rate("submission_rate", "Submission rate", row["submitted"], eligible),
            _count("overdue_load", "Overdue", row["overdue"] or 0),
            _count(
                "unsupported_claim_load",
                "Unsupported claims",
                row["unsupported"] or 0,
            ),
        ],
    }


def _rate(key: str, title: str, numerator: int, denominator: int) -> dict[str, Any]:
    """A rate with no eligible population has no value — say so explicitly
    rather than dividing by zero into a comfortable-looking 0% or 100%."""
    value: str | None = None
    if denominator:
        value = str((Decimal(numerator) / Decimal(denominator)).quantize(Decimal("0.0001")))

    return {
        "key": key,
        "title": title,
        "kind": "RATE",
        "value": value,
        "numerator": numerator,
        "denominator": denominator,
        "display_hint": "—" if value is None else None,
        "drill_down": "/api/v1/obligation-instances?filter[status]=SATISFIED",
    }


def _count(key: str, title: str, value: int) -> dict[str, Any]:
    """A load is a count and is never expressed as a rate: there is no honest
    denominator for "how much is overdue"."""
    return {
        "key": key,
        "title": title,
        "kind": "COUNT",
        "value": value,
        "numerator": None,
        "denominator": None,
        "drill_down": "/api/v1/obligation-instances?filter[status]=OVERDUE,ESCALATED",
    }


async def personal_queue(session: AsyncSession, principal: Principal) -> dict[str, Any]:
    """What is on this person, right now, resolved through their appointments."""
    person_id = principal.person_id
    mine_ids = principal.authorized_mine_ids or []
    unclipped = principal.authorized_mine_ids is None

    due_today = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) FROM obligation_instance oi
                WHERE oi.status IN ('UPCOMING','DUE')
                  AND oi.due_on = CURRENT_DATE
                  AND (:unclipped OR oi.mine_id = ANY(:mine_ids))
                """
            ),
            {"unclipped": unclipped, "mine_ids": mine_ids},
        )
    ).scalar_one()

    overdue = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) FROM obligation_instance oi
                WHERE oi.status IN ('OVERDUE','ESCALATED')
                  AND (:unclipped OR oi.mine_id = ANY(:mine_ids))
                """
            ),
            {"unclipped": unclipped, "mine_ids": mine_ids},
        )
    ).scalar_one()

    # Awaiting *my* verification excludes anything I submitted myself: the
    # separation-of-duties rule means those can never be mine to verify, so
    # showing them would be a queue item nobody can action.
    awaiting_verification = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) FROM capa c
                WHERE c.status = 'SUBMITTED'
                  AND (c.submitted_by_person_id IS NULL OR c.submitted_by_person_id <> :person)
                  AND (c.assigned_to_person_id IS NULL OR c.assigned_to_person_id <> :person)
                  AND (:unclipped OR c.mine_id = ANY(:mine_ids))
                """
            ),
            {"person": person_id, "unclipped": unclipped, "mine_ids": mine_ids},
        )
    ).scalar_one()

    assigned_capas = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) FROM capa c
                WHERE c.assigned_to_person_id = :person
                  AND c.status IN ('OPEN','IN_PROGRESS','REOPENED')
                """
            ),
            {"person": person_id},
        )
    ).scalar_one()

    offered_inspections = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) FROM inspection_assignment_member m
                WHERE m.person_id = :person AND m.assignment_status = 'OFFERED'
                """
            ),
            {"person": person_id},
        )
    ).scalar_one()

    pending_sync = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) FROM evidence e
                WHERE e.captured_by_person_id = :person AND e.synced_at IS NULL
                """
            ),
            {"person": person_id},
        )
    ).scalar_one()

    sync_failures = (
        await session.execute(
            text(
                """
                SELECT COUNT(*) FROM evidence e
                WHERE e.captured_by_person_id = :person AND e.sync_error IS NOT NULL
                """
            ),
            {"person": person_id},
        )
    ).scalar_one()

    return {
        "person": {"type": "person", "id": person_id, "display": principal.display_name},
        "items": [
            _queue_item(
                "due_today",
                "Due today",
                due_today,
                "/api/v1/obligation-instances?filter[status]=UPCOMING,DUE",
            ),
            _queue_item(
                "overdue",
                "Overdue",
                overdue,
                "/api/v1/obligation-instances?filter[status]=OVERDUE,ESCALATED",
            ),
            _queue_item(
                "awaiting_my_verification",
                "Awaiting my verification",
                awaiting_verification,
                "/api/v1/capas?view=awaiting_verification",
            ),
            _queue_item(
                "my_capas",
                "Assigned to me",
                assigned_capas,
                f"/api/v1/capas?filter[assigned_to_person_id]={person_id}",
            ),
            _queue_item(
                "inspection_offers",
                "Inspection places offered",
                offered_inspections,
                "/api/v1/inspection-assignment-members?view=offered",
            ),
            _queue_item(
                "pending_sync",
                "Captures pending sync",
                pending_sync,
                "/api/v1/evidence?view=pending_sync",
            ),
            _queue_item(
                "sync_failures",
                "Sync failures",
                sync_failures,
                "/api/v1/evidence?view=sync_failures",
            ),
        ],
    }


def _queue_item(key: str, title: str, count: int, drill_down: str) -> dict[str, Any]:
    return {"key": key, "title": title, "count": count, "drill_down": drill_down}

"""GET /dashboard — one route, several named projections.

`view` selects the projection. These are not separate endpoints because they
share authorization, freshness and envelope semantics and differ only in
what they compute — which is exactly the case `?view=` exists for.
"""

from __future__ import annotations

from datetime import date
from typing import Any

from fastapi import APIRouter, Depends

from app.core.errors import UnknownView
from app.domains.dashboard.service import measures, personal_queue
from app.kernel.deps import RequestContext, context
from app.kernel.envelope import success

router = APIRouter()

VIEWS = {
    "measures": "The four compliance measures at the requested scope",
    "personal_queue": "The caller's own resolved work",
}


@router.get("/dashboard")
async def dashboard(
    view: str = "measures",
    mine_id: str | None = None,
    period_end: date | None = None,
    ctx: RequestContext = Depends(context),
) -> dict[str, Any]:
    if view not in VIEWS:
        raise UnknownView(f"{view!r} is not a dashboard view", {"allowed": sorted(VIEWS)})

    if view == "measures":
        data = await measures(ctx.session, ctx.principal, mine_id=mine_id, period_end=period_end)
        freshness = "LIVE"
    else:
        data = await personal_queue(ctx.session, ctx.principal)
        freshness = "LIVE"

    return success(
        data,
        request_id=ctx.request_id,
        meta_extra={"view": view, "freshness": freshness},
    )


@router.get("/views")
async def list_views(ctx: RequestContext = Depends(context)) -> dict[str, Any]:
    """Every registered view in the system, so a client can discover rather
    than guess which projections exist."""
    from app.kernel.registry import registry

    entries: list[dict[str, Any]] = [
        {"collection": "dashboard", "view": name, "summary": summary}
        for name, summary in VIEWS.items()
    ]
    for spec in registry.all():
        entries.extend(
            {
                "collection": spec.collection,
                "view": view.name,
                "summary": view.summary,
            }
            for view in spec.views.values()
        )
    return success(entries, request_id=ctx.request_id)

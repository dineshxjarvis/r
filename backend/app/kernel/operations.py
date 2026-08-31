"""GET /operations/{id} — the single async-status route for the platform.

Extraction jobs, index rebuilds, exports, sync batches and report renders all
report through this one shape. No domain defines its own job-status endpoint,
so a client writes one polling helper rather than nine.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends

from app.core.errors import NotFound
from app.core.ids import new_id
from app.core.time import isoformat, utcnow
from app.domains.identity.models import Operation
from app.kernel.deps import RequestContext, context
from app.kernel.envelope import success

router = APIRouter()


def operation_envelope(operation: Operation) -> dict[str, Any]:
    percent = None
    if operation.progress_total:
        percent = round(100 * operation.progress_completed / operation.progress_total)

    return {
        "id": operation.id,
        "object": "operation",
        "status": operation.status,
        "kind": operation.kind,
        "target": (
            {"type": operation.target_type, "id": operation.target_id}
            if operation.target_type
            else None
        ),
        "progress": {
            "completed": operation.progress_completed,
            "total": operation.progress_total,
            "percent": percent,
        },
        "started_at": isoformat(operation.started_at),
        "estimated_completion_at": isoformat(operation.estimated_completion_at),
        "finished_at": isoformat(operation.finished_at),
        "result": operation.result,
        "error": operation.error,
        "links": {"self": f"/api/v1/operations/{operation.id}"},
    }


@router.get("/operations/{operation_id}")
async def get_operation(
    operation_id: str, ctx: RequestContext = Depends(context)
) -> dict[str, Any]:
    operation = await ctx.session.get(Operation, operation_id)
    if operation is None:
        raise NotFound("no such operation", {"id": operation_id})

    # An operation belongs to whoever started it. Concealing another
    # principal's job is the same rule as concealing any other record.
    if (
        operation.created_by_principal_id != ctx.principal.principal_id
        and not ctx.principal.is_platform
    ):
        raise NotFound("no such operation", {"id": operation_id})

    return success({"operation": operation_envelope(operation)}, request_id=ctx.request_id)


async def create_operation(
    session: Any,
    *,
    kind: str,
    principal_id: str,
    tenant_id: str | None,
    target_type: str | None = None,
    target_id: str | None = None,
    total: int | None = None,
) -> Operation:
    """Start a long-running job and hand back its handle."""
    now = utcnow()
    operation = Operation(
        id=new_id("operation"),
        tenant_id=tenant_id,
        kind=kind,
        target_type=target_type,
        target_id=target_id,
        status="QUEUED",
        progress_completed=0,
        progress_total=total,
        created_by_principal_id=principal_id,
        created_at=now,
        updated_at=now,
    )
    session.add(operation)
    return operation

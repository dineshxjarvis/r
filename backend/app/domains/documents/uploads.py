"""POST /uploads — the shared two-phase upload transport.

One endpoint for document originals and evidence captures, discriminated by
`purpose`. They share a transaction boundary and a lifecycle; what differs is
which row eventually consumes the verified object, and that is a body field,
not a route.
"""

from __future__ import annotations

from datetime import timedelta
from typing import Any, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.ids import new_id
from app.core.time import isoformat, utcnow
from app.domains.documents.models import Upload
from app.integrations.storage import content_key, get_storage
from app.kernel import idempotency
from app.kernel.deps import RequestContext, context
from app.kernel.envelope import success

router = APIRouter()

# A presigned target is short-lived on purpose: an unused one is a writable
# handle into the bucket, and handing out long-lived ones defeats the point
# of permission-checking the request that produced it.
UPLOAD_TTL = timedelta(minutes=30)


class UploadRequest(BaseModel):
    purpose: Literal["DOCUMENT_ORIGINAL", "EVIDENCE_CAPTURE"]
    sha256: str
    content_type: str
    byte_size: int | None = None
    filename: str | None = None


@router.post("/uploads", status_code=201)
async def create_upload(
    body: UploadRequest, ctx: RequestContext = Depends(context)
) -> dict[str, Any]:
    """Phase one: permission-check, then issue a presigned PUT.

    The row created here is staging, not a record. Nothing in the domain
    points at these bytes until the hash has been verified and a document or
    evidence row consumes them.
    """
    key = idempotency.require_key(ctx.idempotency_key, "POST /uploads")
    replayed = await idempotency.replay(
        ctx.session,
        principal_id=ctx.principal.principal_id,
        route="POST /uploads",
        target="",
        key=key,
        request_body=body.model_dump(),
    )
    if replayed:
        return replayed["body"]

    capability = "document.create" if body.purpose == "DOCUMENT_ORIGINAL" else "evidence.capture"
    if not ctx.principal.holds(capability):
        from app.authz.concealment import refuse

        raise refuse("UPLOAD", capability, body.purpose)

    await idempotency.reserve(
        ctx.session,
        principal_id=ctx.principal.principal_id,
        route="POST /uploads",
        target="",
        key=key,
        request_body=body.model_dump(),
    )

    storage = get_storage()
    now = utcnow()
    object_key = content_key(body.sha256)

    upload = Upload(
        id=new_id("upload"),
        tenant_id=ctx.principal.tenant_id,
        purpose=body.purpose,
        requested_by_principal_id=ctx.principal.principal_id,
        claimed_sha256=body.sha256,
        byte_size=body.byte_size,
        content_type=body.content_type,
        storage_bucket=storage.originals,
        storage_key=object_key,
        status="PENDING",
        created_at=now,
        updated_at=now,
        expires_at=now + UPLOAD_TTL,
    )
    ctx.session.add(upload)
    await ctx.session.flush()

    put_url = await storage.presign_put(
        bucket=storage.originals, key=object_key, content_type=body.content_type
    )

    body_out = success(
        {
            "id": upload.id,
            "object": "upload",
            "purpose": body.purpose,
            "upload_url": put_url,
            "method": "PUT",
            "headers": {"Content-Type": body.content_type},
            "storage_key": object_key,
            "expires_at": isoformat(upload.expires_at),
            "next": (
                "PUT the bytes to upload_url, then POST /documents or "
                "POST /evidence/sync referencing this upload id"
            ),
        },
        request_id=ctx.request_id,
        message="upload target issued",
    )
    await idempotency.record(
        ctx.session,
        principal_id=ctx.principal.principal_id,
        route="POST /uploads",
        target="",
        key=key,
        status=201,
        response_body=body_out,
    )
    return body_out

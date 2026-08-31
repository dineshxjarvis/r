"""Object storage. Content-addressed, insert-only, verified before the row exists.

The two-phase write is load-bearing and its order is not negotiable:

    1. presign a PUT — permission-checked first
    2. the client uploads directly
    3. the server HEADs the object and verifies the hash it claimed
    4. only then may a Postgres row pointing at those bytes be created

A row must never exist pointing at bytes that did not verify, and the bytes
are not "the record" until Postgres says so.

Known gap: Supabase Storage has no S3 Object Lock, so immutability here rests
on credential scope and application discipline rather than the storage layer.
Production needs real S3 with Object Lock in compliance mode. Do not describe
this as immutable at rest.
"""

from __future__ import annotations

import hashlib
from typing import Any

import aioboto3
from botocore.config import Config

from app.core.config import get_settings
from app.core.errors import DependencyUnavailable, Unprocessable
from app.core.logging import get_logger

log = get_logger(__name__)


def content_key(sha256: str) -> str:
    """Object key is the content hash, so identical bytes dedupe by
    construction and any tamper is a hash mismatch rather than a judgment."""
    return f"sha256/{sha256}"


def sha256_of(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


class Storage:
    def __init__(self) -> None:
        settings = get_settings()
        self._endpoint = settings.storage_endpoint_url
        self._key = settings.storage_access_key
        self._secret = settings.storage_secret_key
        self.originals = settings.storage_bucket_originals
        self.derived = settings.storage_bucket_derived
        self.ttl_seconds = settings.storage_presign_ttl_seconds
        self._session = aioboto3.Session()

    def _client(self) -> Any:
        return self._session.client(
            "s3",
            endpoint_url=self._endpoint,
            aws_access_key_id=self._key,
            aws_secret_access_key=self._secret,
            config=Config(signature_version="s3v4"),
        )

    async def presign_put(self, *, bucket: str, key: str, content_type: str) -> str:
        try:
            async with self._client() as s3:
                return await s3.generate_presigned_url(
                    "put_object",
                    Params={"Bucket": bucket, "Key": key, "ContentType": content_type},
                    ExpiresIn=self.ttl_seconds,
                )
        except Exception as exc:
            log.error("presign_put_failed", bucket=bucket, key=key, error=str(exc))
            raise DependencyUnavailable(
                "object storage is unavailable", {"dependency": "storage"}
            ) from exc

    async def presign_get(self, *, bucket: str, key: str) -> str:
        try:
            async with self._client() as s3:
                return await s3.generate_presigned_url(
                    "get_object",
                    Params={"Bucket": bucket, "Key": key},
                    ExpiresIn=self.ttl_seconds,
                )
        except Exception as exc:
            log.error("presign_get_failed", bucket=bucket, key=key, error=str(exc))
            raise DependencyUnavailable(
                "object storage is unavailable", {"dependency": "storage"}
            ) from exc

    async def verify(self, *, bucket: str, key: str, expected_sha256: str) -> dict[str, Any]:
        """Step 3. Fails loudly rather than trusting the client's claim.

        The key *is* the hash, so a mismatch means the object landed
        somewhere it should not have — that is a rejection, not a warning.
        """
        try:
            async with self._client() as s3:
                head = await s3.head_object(Bucket=bucket, Key=key)
        except Exception as exc:
            log.warning("verify_head_failed", bucket=bucket, key=key, error=str(exc))
            raise Unprocessable(
                "the uploaded object could not be read back for verification",
                {"bucket": bucket, "key": key},
            ) from exc

        if key != content_key(expected_sha256):
            raise Unprocessable(
                "uploaded bytes do not match the claimed hash",
                {"expected_sha256": expected_sha256},
            )

        return {
            "byte_size": head.get("ContentLength", 0),
            "content_type": head.get("ContentType", "application/octet-stream"),
            "etag": head.get("ETag", "").strip('"'),
        }


_storage: Storage | None = None


def get_storage() -> Storage:
    global _storage
    if _storage is None:
        _storage = Storage()
    return _storage

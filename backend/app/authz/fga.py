"""OpenFGA client. Step five of the chain, and only step five.

OpenFGA answers graph questions: is this principal related to this object.
Time, mandate, jurisdiction, severity, evidence verdict, assurance, purpose
and separation of duties are the policy layer's job, not the graph's.

An outage fails closed. A permission system that degrades open under load is
not a permission system.
"""

from __future__ import annotations

from typing import Any

import httpx

from app.core.config import get_settings
from app.core.errors import DependencyUnavailable
from app.core.logging import get_logger

log = get_logger(__name__)


class FGAClient:
    def __init__(self) -> None:
        settings = get_settings()
        self._url = settings.openfga_api_url.rstrip("/")
        self._store = settings.openfga_store_id
        self._model = settings.openfga_model_id
        self._enabled = bool(self._store) and not settings.authz_skip_graph_check
        self._client: httpx.AsyncClient | None = None

    @property
    def enabled(self) -> bool:
        return self._enabled

    async def _http(self) -> httpx.AsyncClient:
        if self._client is None:
            self._client = httpx.AsyncClient(base_url=self._url, timeout=3.0)
        return self._client

    async def close(self) -> None:
        if self._client is not None:
            await self._client.aclose()
            self._client = None

    async def check(
        self,
        *,
        user: str,
        relation: str,
        obj: str,
        context: dict[str, Any] | None = None,
    ) -> bool:
        """Ask the graph. Any failure denies."""
        if not self._enabled:
            # The graph is not consulted in this configuration. The caller is
            # responsible for having verified that policy alone is sufficient
            # — see Settings.authz_skip_graph_check, which production refuses.
            return True

        client = await self._http()
        body: dict[str, Any] = {
            "tuple_key": {"user": user, "relation": relation, "object": obj},
        }
        if self._model:
            body["authorization_model_id"] = self._model
        if context:
            body["context"] = context

        try:
            response = await client.post(f"/stores/{self._store}/check", json=body)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            log.error("fga_check_failed", user=user, relation=relation, object=obj, error=str(exc))
            raise DependencyUnavailable(
                "authorization graph is unavailable", {"dependency": "openfga"}
            ) from exc

        return bool(response.json().get("allowed", False))

    async def write_tuples(self, writes: list[dict[str, Any]]) -> None:
        """Called only by the outbox projector — never inline in a request."""
        if not self._enabled or not writes:
            return
        client = await self._http()
        body: dict[str, Any] = {"writes": {"tuple_keys": writes}}
        if self._model:
            body["authorization_model_id"] = self._model
        try:
            response = await client.post(f"/stores/{self._store}/write", json=body)
            response.raise_for_status()
        except httpx.HTTPError as exc:
            log.error("fga_write_failed", count=len(writes), error=str(exc))
            raise DependencyUnavailable(
                "authorization graph is unavailable", {"dependency": "openfga"}
            ) from exc


_client: FGAClient | None = None


def get_fga() -> FGAClient:
    global _client
    if _client is None:
        _client = FGAClient()
    return _client


async def close_fga() -> None:
    global _client
    if _client is not None:
        await _client.close()
    _client = None

"""Typed scalars for the wire.

Never a bare float, never a unit-less number. Decimals travel as strings so
no precision is lost in JSON parsing; quantities and money are objects
because unit and currency change per tenant and per commodity, and a bare
number cannot be migrated later without a breaking change.
"""

from datetime import date, datetime
from decimal import Decimal
from typing import Any

from geoalchemy2.shape import to_shape
from shapely.geometry import mapping

from app.core.time import isoformat


def decimal_out(value: Decimal | float | int | None) -> str | None:
    """Decimals go out as strings, always."""
    if value is None:
        return None
    return str(value)


def quantity(value: Decimal | float | int | None, unit: str) -> dict[str, Any] | None:
    if value is None:
        return None
    return {"value": str(value), "unit": unit}


def money(amount: Decimal | float | int | None, currency: str = "INR") -> dict[str, Any] | None:
    if amount is None:
        return None
    return {"amount": str(amount), "currency": currency}


def geometry_out(value: Any) -> dict[str, Any] | None:
    """PostGIS geography -> GeoJSON with an explicit srid.

    The contract always states the srid rather than assuming 4326, because a
    geometry whose CRS is implicit is exactly how spatial data goes wrong.
    """
    if value is None:
        return None
    try:
        shape = to_shape(value)
    except (AttributeError, TypeError):
        return None
    geo = mapping(shape)
    return {**geo, "srid": 4326}


def scalar_out(value: Any) -> Any:
    """Coerce one column value into its wire form."""
    if value is None:
        return None
    if isinstance(value, Decimal):
        return str(value)
    if isinstance(value, datetime):
        return isoformat(value)
    if isinstance(value, date):
        return value.isoformat()
    if isinstance(value, (list, tuple)):
        return [scalar_out(v) for v in value]
    if hasattr(value, "desc") and hasattr(value, "srid"):  # WKBElement
        return geometry_out(value)
    return value


def reference(
    object_type: str, obj_id: str | None, display: str | None = None
) -> dict[str, Any] | None:
    """A pointer to another object, as a reference object.

    Used wherever the target type is polymorphic or the UI needs a label
    without a second fetch.
    """
    if obj_id is None:
        return None
    ref: dict[str, Any] = {"type": object_type, "id": obj_id}
    if display is not None:
        ref["display"] = display
    return ref

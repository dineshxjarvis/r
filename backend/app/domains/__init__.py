"""Domain packages.

Importing this module registers every collection. Registration is a side
effect of import by design: a resource that is never imported is never
routable, which makes "did you wire it up?" a single line in one file rather
than a question spread across nine.
"""

from app.domains.analytics import resources as analytics_resources
from app.domains.dashboard import resources as dashboard_resources
from app.domains.defects import resources as defects_resources
from app.domains.documents import resources as documents_resources
from app.domains.evidence import resources as evidence_resources
from app.domains.geospatial import resources as geospatial_resources
from app.domains.identity import resources as identity_resources
from app.domains.inspections import resources as inspections_resources
from app.domains.workflow import resources as workflow_resources

__all__ = [
    "analytics_resources",
    "dashboard_resources",
    "defects_resources",
    "documents_resources",
    "evidence_resources",
    "geospatial_resources",
    "identity_resources",
    "inspections_resources",
    "workflow_resources",
]

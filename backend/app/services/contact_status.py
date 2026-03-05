from datetime import datetime, timedelta
from typing import Dict, Iterable, Optional

from sqlalchemy.orm import Session

from app.models import Outreach
from app.services.lead_scoring import SUCCESS_STATUSES


def get_contact_status_map(
    db: Session,
    days: int = 30,
    company_ids: Optional[Iterable[int]] = None,
) -> Dict[int, str]:
    """
    Returns {company_id: badge} where badge is:
    - never_contacted
    - tried
    - contacted_recently
    """
    rows_query = db.query(
        Outreach.company_id,
        Outreach.status,
        Outreach.sent_at,
        Outreach.created_at,
    )
    if company_ids is not None:
        company_ids = list(company_ids)
        if not company_ids:
            return {}
        rows_query = rows_query.filter(Outreach.company_id.in_(company_ids))

    rows = rows_query.all()
    if not rows:
        return {}

    cutoff = datetime.utcnow() - timedelta(days=days)
    status_map: Dict[int, str] = {}

    for company_id, status, sent_at, created_at in rows:
        current = status_map.get(company_id, "never_contacted")
        attempt_time = sent_at or created_at
        is_success_recent = (
            status in SUCCESS_STATUSES
            and attempt_time is not None
            and attempt_time >= cutoff
        )

        if is_success_recent:
            status_map[company_id] = "contacted_recently"
            continue

        if current != "contacted_recently":
            status_map[company_id] = "tried"

    return status_map

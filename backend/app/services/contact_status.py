from datetime import datetime, timedelta
from typing import Dict, Iterable, Iterator, Optional

from sqlalchemy.orm import Session

from app.models import Outreach
from app.services.lead_scoring import SUCCESS_STATUSES

SQLITE_IN_CHUNK = 800


def _chunked(values: Iterable[int], size: int = SQLITE_IN_CHUNK) -> Iterator[list[int]]:
    bucket: list[int] = []
    for value in values:
        bucket.append(int(value))
        if len(bucket) >= size:
            yield bucket
            bucket = []
    if bucket:
        yield bucket


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

    cutoff = datetime.utcnow() - timedelta(days=days)
    status_map: Dict[int, str] = {}

    def _consume_rows(rows):
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

    if company_ids is None:
        _consume_rows(rows_query.all())
        return status_map

    company_ids_list = [int(cid) for cid in company_ids]
    if not company_ids_list:
        return {}

    for chunk in _chunked(company_ids_list):
        chunk_rows = rows_query.filter(Outreach.company_id.in_(chunk)).all()
        _consume_rows(chunk_rows)

    return status_map

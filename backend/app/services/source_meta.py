from datetime import datetime
from typing import Any, Dict

from app.models import Company


def _iso_now() -> str:
    return datetime.utcnow().isoformat()


def ensure_financial_data_dict(company: Company) -> Dict[str, Any]:
    if isinstance(company.financial_data_json, dict):
        data = dict(company.financial_data_json)
    else:
        data = {}

    source_meta = data.get("_source_meta")
    if not isinstance(source_meta, dict):
        source_meta = {}
    data["_source_meta"] = source_meta
    return data


def set_source_meta(
    company: Company,
    key: str,
    source: str,
    confidence: str = "medium",
) -> None:
    data = ensure_financial_data_dict(company)
    source_meta = data["_source_meta"]
    source_meta[key] = {
        "source": source,
        "fetched_at": _iso_now(),
        "confidence": confidence,
    }
    company.financial_data_json = data

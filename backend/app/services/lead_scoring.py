from typing import Any, Dict, Optional, Tuple

from app.models import Company

CATEGORY_REVENUE_ESTIMATE = {
    "I": 5_000_000.0,
    "II": 1_000_000.0,
    "III": 250_000.0,
    "IV": 50_000.0,
}

SUCCESS_STATUSES = {"sent", "delivered", "read", "replied"}


def get_source_meta(company: Company) -> Dict[str, Any]:
    data = company.financial_data_json if isinstance(company.financial_data_json, dict) else {}
    source_meta = data.get("_source_meta")
    return source_meta if isinstance(source_meta, dict) else {}


def get_category(company: Company) -> str:
    data = company.financial_data_json if isinstance(company.financial_data_json, dict) else {}
    category = data.get("category")
    if isinstance(category, str):
        return category.strip().upper()
    return ""


def resolve_revenue(company: Company) -> Tuple[Optional[float], str]:
    if company.revenue_gel is not None:
        return float(company.revenue_gel), "exact"

    category = get_category(company)
    if category in CATEGORY_REVENUE_ESTIMATE:
        return CATEGORY_REVENUE_ESTIMATE[category], "estimated"

    return None, "unknown"


def social_active(company: Company) -> bool:
    if not (company.facebook_url or company.instagram_url or company.linkedin_url):
        return False

    meta = get_source_meta(company).get("social_source")
    if not isinstance(meta, dict):
        return False

    source = str(meta.get("source") or "").strip().lower()
    validation = str(meta.get("validation") or "").strip().lower()
    if validation == "strict_v2":
        return True

    if source == "facebook_instagram_validation":
        return False

    return source == "reportal_public_profile"


def get_revenue_rank(company: Company) -> int:
    """
    Returns a sort rank for leads. Lower = better.
    Prioritizes: revenue category (I > II > III > IV > unknown) + has phone.
    """
    category = get_category(company)
    has_phone = bool(company.phone and company.phone.strip())

    if category in ("I", "II") and has_phone:
        return 1
    elif category in ("I", "II"):
        return 2
    elif category == "III" and has_phone:
        return 3
    elif category == "III":
        return 4
    elif category == "IV" and has_phone:
        return 5
    elif category == "IV":
        return 6
    elif has_phone:
        return 7
    else:
        return 8


def compute_score(company: Company, contact_badge: str) -> Tuple[int, str, str]:
    """
    Kept for backward compatibility. Returns (score, revenue_type, offer_lane).
    offer_lane is always 'landing_page' — set manually after first contact.
    """
    revenue, revenue_type = resolve_revenue(company)

    if company.website_status == "found":
        return 0, revenue_type, "landing_page"

    # Score based on revenue signal only
    score = 50
    if revenue is not None:
        if revenue_type == "exact":
            if revenue >= 500_000:
                score = 100
            elif revenue >= 100_000:
                score = 80
            else:
                score = 60
        elif revenue_type == "estimated":
            category = get_category(company)
            if category in {"I", "II"}:
                score = 90
            elif category == "III":
                score = 70
            elif category == "IV":
                score = 55

    if bool(company.phone and company.phone.strip()):
        score += 10

    if contact_badge == "contacted_recently":
        score = max(score - 30, 0)

    return score, revenue_type, "landing_page"


def apply_scoring_to_company(company: Company, contact_badge: str) -> Dict[str, Any]:
    score, revenue_type, offer_lane = compute_score(company, contact_badge)
    company.lead_score = score
    company.revenue_type = revenue_type
    company.offer_lane = offer_lane
    return {
        "score": score,
        "revenue_type": revenue_type,
        "offer_lane": offer_lane,
        "social_active": social_active(company),
    }

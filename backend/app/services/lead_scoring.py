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


def compute_score(company: Company, contact_badge: str) -> Tuple[int, str, str]:
    revenue, revenue_type = resolve_revenue(company)

    if company.website_status == "found":
        return 0, revenue_type, "landing_page"

    score = 100

    if social_active(company):
        score += 30

    if revenue is not None:
        if revenue_type == "exact":
            if revenue >= 500_000:
                score += 40
            elif revenue >= 100_000:
                score += 25
            else:
                score += 10
        elif revenue_type == "estimated":
            category = get_category(company)
            if category in {"I", "II"}:
                score += 25
            elif category == "III":
                score += 15
            elif category == "IV":
                score += 5

    if contact_badge == "contacted_recently":
        score -= 40

    # Revenue-aware lane: without a revenue signal, default to landing page.
    # This keeps "full website" focused on leads with at least estimated size.
    has_revenue_signal = revenue_type in {"exact", "estimated"}
    offer_lane = "full_website" if score >= 120 and has_revenue_signal else "landing_page"
    return max(score, 0), revenue_type, offer_lane


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

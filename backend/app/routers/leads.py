"""Lead management routes."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db, SessionLocal
from app.models import Lead, Setting
from app.schemas import LeadResponse, LeadUpdate, StatsResponse
from app.services.reachability import compute_tier
from app.scrapers.facebook_enrichment import enrich_lead_facebook

router = APIRouter()


def _get_settings_dict(db: Session) -> dict:
    rows = db.query(Setting).all()
    return {row.key: row.value for row in rows if row.value}


@router.get("/stats", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(Lead.id)).scalar() or 0

    city_rows = db.query(Lead.city, func.count(Lead.id)).group_by(Lead.city).all()
    leads_by_city = {city or "Unknown": count for city, count in city_rows}

    tier_rows = db.query(Lead.reachability_tier, func.count(Lead.id)).group_by(Lead.reachability_tier).all()
    tier_map = {tier: count for tier, count in tier_rows}
    leads_by_tier = {"hot": tier_map.get("hot", 0), "warm": tier_map.get("warm", 0), "cold": tier_map.get("cold", 0)}

    status_rows = db.query(Lead.lead_status, func.count(Lead.id)).group_by(Lead.lead_status).all()
    leads_by_status = {status: count for status, count in status_rows}

    return StatsResponse(
        total_leads=total,
        leads_by_city=leads_by_city,
        leads_by_tier=leads_by_tier,
        leads_by_status=leads_by_status,
        leads_with_facebook=db.query(func.count(Lead.id)).filter(Lead.facebook_url.isnot(None)).scalar() or 0,
        leads_with_phone=db.query(func.count(Lead.id)).filter(Lead.phone.isnot(None)).scalar() or 0,
        leads_with_email=db.query(func.count(Lead.id)).filter(Lead.email.isnot(None)).scalar() or 0,
    )


@router.get("/", response_model=list[LeadResponse])
def list_leads(
    city: str | None = None,
    reachability_tier: str | None = None,
    lead_status: str | None = None,
    search: str | None = None,
    sort_by: str = Query("google_review_count", pattern="^(google_review_count|google_rating|created_at)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    q = db.query(Lead)

    if city:
        q = q.filter(Lead.city == city)
    if reachability_tier:
        q = q.filter(Lead.reachability_tier == reachability_tier)
    if lead_status:
        q = q.filter(Lead.lead_status == lead_status)
    if search:
        q = q.filter(Lead.name.ilike(f"%{search}%"))

    sort_col = getattr(Lead, sort_by)
    q = q.order_by(sort_col.desc() if sort_order == "desc" else sort_col.asc())

    leads = q.offset(skip).limit(limit).all()
    return [LeadResponse.model_validate(lead) for lead in leads]


@router.get("/{lead_id}", response_model=LeadResponse)
def get_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")
    return LeadResponse.model_validate(lead)


@router.put("/{lead_id}", response_model=LeadResponse)
def update_lead(lead_id: int, data: LeadUpdate, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(lead, key, value)

    lead.reachability_tier = compute_tier(lead.facebook_url, lead.phone, lead.email)
    db.commit()
    db.refresh(lead)
    return LeadResponse.model_validate(lead)


@router.delete("/{lead_id}")
def delete_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")
    db.delete(lead)
    db.commit()
    return {"status": "deleted"}


@router.put("/{lead_id}/status", response_model=LeadResponse)
def update_lead_status(lead_id: int, data: dict, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    valid_statuses = {"new", "messaged", "replied", "interested", "won", "not_interested", "no_response"}
    status = data.get("lead_status", "")
    if status not in valid_statuses:
        raise HTTPException(400, f"Invalid status. Must be one of: {', '.join(sorted(valid_statuses))}")

    lead.lead_status = status
    db.commit()
    db.refresh(lead)
    return LeadResponse.model_validate(lead)


@router.post("/{lead_id}/enrich", response_model=LeadResponse)
def enrich_lead(lead_id: int, db: Session = Depends(get_db)):
    lead = db.query(Lead).filter(Lead.id == lead_id).first()
    if not lead:
        raise HTTPException(404, "Lead not found")

    settings = _get_settings_dict(db)
    result = enrich_lead_facebook(lead.name, lead.city or "", settings)

    if result.get("facebook_url") and not lead.facebook_url:
        lead.facebook_url = result["facebook_url"]
    if result.get("facebook_followers"):
        lead.facebook_followers = result["facebook_followers"]
    if result.get("facebook_last_post_date"):
        lead.facebook_last_post_date = result["facebook_last_post_date"]
    if result.get("phone") and not lead.phone:
        lead.phone = result["phone"]
    if result.get("email") and not lead.email:
        lead.email = result["email"]

    lead.reachability_tier = compute_tier(lead.facebook_url, lead.phone, lead.email)
    db.commit()
    db.refresh(lead)
    return LeadResponse.model_validate(lead)


@router.post("/enrich-batch")
def enrich_batch(data: dict, db: Session = Depends(get_db)):
    lead_ids = data.get("lead_ids", [])
    limit = min(data.get("limit", 50), 100)

    if not lead_ids:
        leads = db.query(Lead).filter(Lead.facebook_url.is_(None)).limit(limit).all()
    else:
        leads = db.query(Lead).filter(Lead.id.in_(lead_ids[:limit])).all()

    settings = _get_settings_dict(db)
    enriched = 0
    failed = 0

    for lead in leads:
        try:
            result = enrich_lead_facebook(lead.name, lead.city or "", settings)
            if result.get("facebook_url") and not lead.facebook_url:
                lead.facebook_url = result["facebook_url"]
            if result.get("facebook_followers"):
                lead.facebook_followers = result["facebook_followers"]
            if result.get("facebook_last_post_date"):
                lead.facebook_last_post_date = result["facebook_last_post_date"]
            if result.get("phone") and not lead.phone:
                lead.phone = result["phone"]
            if result.get("email") and not lead.email:
                lead.email = result["email"]
            lead.reachability_tier = compute_tier(lead.facebook_url, lead.phone, lead.email)
            enriched += 1
        except Exception:
            failed += 1

    db.commit()
    return {"enriched": enriched, "failed": failed, "total": len(leads)}

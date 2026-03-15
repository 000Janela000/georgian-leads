from fastapi import APIRouter, Body, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models import Company
from app.schemas import CompanyCreate, CompanyUpdate, CompanyResponse, LeadResponse
from app.services.contact_status import get_contact_status_map
from app.services.lead_scoring import compute_score, get_source_meta, social_active
from typing import List
from pydantic import BaseModel, Field

router = APIRouter()


class EnrichBatchRequest(BaseModel):
    company_ids: List[int] | None = None
    limit: int = Field(default=10, ge=1, le=500)


@router.get("/", response_model=List[CompanyResponse])
def list_companies(
    skip: int = Query(0),
    limit: int = Query(50),
    website_status: str = Query(None),
    lead_status: str = Query(None),
    search: str = Query(None),
    db: Session = Depends(get_db)
):
    """List companies with optional filters"""
    query = db.query(Company)

    if website_status:
        query = query.filter(Company.website_status == website_status)
    if lead_status:
        query = query.filter(Company.lead_status == lead_status)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Company.name_ge.ilike(search_term)) |
            (Company.name_en.ilike(search_term)) |
            (Company.identification_code.ilike(search_term))
        )

    companies = query.offset(skip).limit(limit).all()
    return companies


@router.get("/lead-status/no-website", response_model=List[LeadResponse])
def get_leads_without_website(
    skip: int = Query(0),
    limit: int = Query(50),
    social_active_only: bool = Query(False),
    revenue_type: str = Query(None),  # exact, estimated, unknown
    contact_badge: str = Query(None),  # never_contacted, tried, contacted_recently
    include_contacted_recently: bool = Query(False),
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get active no-website leads with score, offer lane, and outreach badge."""
    query = db.query(Company).filter(
        and_(
            Company.website_status == "not_found",
            Company.status == "active"
        )
    )

    companies = query.all()
    company_ids = [c.id for c in companies]
    contact_map = get_contact_status_map(db, days=days, company_ids=company_ids)

    leads = []
    for company in companies:
        badge = contact_map.get(company.id, "never_contacted")
        if not include_contacted_recently and badge == "contacted_recently":
            continue
        if contact_badge and badge != contact_badge:
            continue

        is_social_active = social_active(company)
        if social_active_only and not is_social_active:
            continue

        score, computed_revenue_type, offer_lane = compute_score(company, badge)
        if revenue_type and computed_revenue_type != revenue_type:
            continue

        leads.append(
            {
                "id": company.id,
                "name_ge": company.name_ge,
                "name_en": company.name_en,
                "identification_code": company.identification_code,
                "legal_form": company.legal_form,
                "registration_date": company.registration_date,
                "status": company.status,
                "address": company.address,
                "director_name": company.director_name,
                "website_url": company.website_url,
                "website_status": company.website_status,
                "facebook_url": company.facebook_url,
                "instagram_url": company.instagram_url,
                "linkedin_url": company.linkedin_url,
                "revenue_gel": company.revenue_gel,
                "total_assets_gel": company.total_assets_gel,
                "lead_status": company.lead_status,
                "priority": company.priority,
                "lead_score": score,
                "offer_lane": offer_lane,
                "revenue_type": computed_revenue_type,
                "tags": company.tags,
                "last_enriched_at": company.last_enriched_at,
                "created_at": company.created_at,
                "updated_at": company.updated_at,
                "social_active": is_social_active,
                "contact_badge": badge,
                "score": score,
                "source_meta": get_source_meta(company),
            }
        )

    leads.sort(
        key=lambda item: (
            -item["score"],
            -(item["revenue_gel"] or 0),
            item["id"],
        )
    )
    return leads[skip: skip + limit]


@router.get("/{company_id}", response_model=CompanyResponse)
def get_company(company_id: int, db: Session = Depends(get_db)):
    """Get a specific company"""
    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")
    return company


@router.post("/", response_model=CompanyResponse)
def create_company(company: CompanyCreate, db: Session = Depends(get_db)):
    """Create a new company"""
    db_company = Company(**company.dict())
    db.add(db_company)
    db.commit()
    db.refresh(db_company)
    return db_company


@router.put("/{company_id}", response_model=CompanyResponse)
def update_company(
    company_id: int,
    company_update: CompanyUpdate,
    db: Session = Depends(get_db)
):
    """Update a company"""
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")

    update_data = company_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_company, field, value)

    db.commit()
    db.refresh(db_company)
    return db_company


@router.delete("/{company_id}")
def delete_company(company_id: int, db: Session = Depends(get_db)):
    """Delete a company"""
    db_company = db.query(Company).filter(Company.id == company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")

    db.delete(db_company)
    db.commit()
    return {"status": "deleted"}


@router.post("/{company_id}/enrich")
async def trigger_enrich_company(company_id: int, db: Session = Depends(get_db)):
    """Trigger enrichment for a single company"""
    from app.services.enrichment import enrich_company

    company = db.query(Company).filter(Company.id == company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    result = await enrich_company(company_id, db)
    return result


@router.post("/enrich-batch")
async def trigger_enrich_batch(
    request: EnrichBatchRequest = Body(default_factory=EnrichBatchRequest),
    db: Session = Depends(get_db)
):
    """
    Trigger enrichment for multiple companies

    If company_ids provided: enrich those specific companies
    If not: enrich up to 'limit' companies with no website (highest revenue first)
    """
    from app.services.enrichment import enrich_batch, enrich_leads

    if request.company_ids:
        # Enrich specific companies
        result = await enrich_batch(request.company_ids, db)
    else:
        # Enrich leads (no website) up to limit
        result = await enrich_leads(limit=request.limit, db=db)

    return result

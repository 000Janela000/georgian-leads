from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.database import get_db
from app.models import Company
from app.schemas import CompanyCreate, CompanyUpdate, CompanyResponse
from typing import List
import asyncio

router = APIRouter()


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


@router.get("/lead-status/no-website", response_model=List[CompanyResponse])
def get_leads_without_website(
    skip: int = Query(0),
    limit: int = Query(50),
    db: Session = Depends(get_db)
):
    """Get companies without a website (leads), sorted by revenue"""
    companies = db.query(Company).filter(
        and_(
            Company.website_status == "not_found",
            Company.status == "active"
        )
    ).order_by(Company.revenue_gel.desc()).offset(skip).limit(limit).all()
    return companies


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
    company_ids: List[int] = Query(None),
    limit: int = Query(10),
    db: Session = Depends(get_db)
):
    """
    Trigger enrichment for multiple companies

    If company_ids provided: enrich those specific companies
    If not: enrich up to 'limit' companies with no website (highest revenue first)
    """
    from app.services.enrichment import enrich_batch, enrich_leads

    if company_ids:
        # Enrich specific companies
        result = await enrich_batch(company_ids, db)
    else:
        # Enrich leads (no website) up to limit
        result = await enrich_leads(limit=limit, db=db)

    return result

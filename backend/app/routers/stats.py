from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Company, Outreach
from app.schemas import StatsResponse

router = APIRouter()


@router.get("/", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    total = db.query(func.count(Company.id)).scalar() or 0
    with_website = db.query(func.count(Company.id)).filter(
        Company.website_status == "found"
    ).scalar() or 0
    without_website = db.query(func.count(Company.id)).filter(
        Company.website_status == "not_found"
    ).scalar() or 0
    contacted = db.query(func.count(Company.id)).filter(
        Company.lead_status == "contacted"
    ).scalar() or 0
    converted = db.query(func.count(Company.id)).filter(
        Company.lead_status == "converted"
    ).scalar() or 0
    has_financial = db.query(func.count(Company.id)).filter(
        Company.revenue_gel.isnot(None)
    ).scalar() or 0

    return StatsResponse(
        total_companies=total,
        companies_with_website=with_website,
        companies_without_website=without_website,
        contacted=contacted,
        converted=converted,
        financial_data_available=has_financial
    )

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models import Company, Outreach
from app.schemas import StatsResponse

router = APIRouter()


@router.get("/", response_model=StatsResponse)
def get_stats(db: Session = Depends(get_db)):
    total_registry = db.query(func.count(Company.id)).filter(
        Company.source == "registry"
    ).scalar() or 0
    registry_no_website = db.query(func.count(Company.id)).filter(
        Company.source == "registry",
        Company.website_status == "not_found",
        Company.status == "active",
    ).scalar() or 0
    leads_with_phone = db.query(func.count(Company.id)).filter(
        Company.phone.isnot(None),
        Company.phone != "",
        Company.website_status == "not_found",
    ).scalar() or 0
    leads_with_email = db.query(func.count(Company.id)).filter(
        Company.email.isnot(None),
        Company.email != "",
        Company.website_status == "not_found",
    ).scalar() or 0
    registry_enriched = db.query(func.count(Company.id)).filter(
        Company.source == "registry",
        Company.last_enriched_at.isnot(None),
    ).scalar() or 0

    total_local = db.query(func.count(Company.id)).filter(
        Company.source == "local"
    ).scalar() or 0

    success_statuses = ("sent", "delivered", "read", "replied")
    outreach_sent_count = db.query(func.count(Outreach.id)).filter(
        Outreach.status.in_(success_statuses)
    ).scalar() or 0
    outreach_replied_count = db.query(func.count(Outreach.id)).filter(
        Outreach.status == "replied"
    ).scalar() or 0
    converted = db.query(func.count(Company.id)).filter(
        Company.lead_status == "converted"
    ).scalar() or 0

    return StatsResponse(
        total_registry=total_registry,
        registry_no_website=registry_no_website,
        leads_with_phone=leads_with_phone,
        leads_with_email=leads_with_email,
        registry_enriched=registry_enriched,
        total_local=total_local,
        outreach_sent_count=outreach_sent_count,
        outreach_replied_count=outreach_replied_count,
        converted=converted,
    )

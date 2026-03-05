import re
from datetime import datetime, timedelta
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Company, Outreach, Template
from app.schemas import OutreachCreate, OutreachResponse, OutreachUpdate
from app.services.contact_status import get_contact_status_map
from app.services.lead_scoring import SUCCESS_STATUSES

router = APIRouter()

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
PHONE_CLEAN_RE = re.compile(r"[^\d+]")
PHONE_VALID_RE = re.compile(r"^\+\d{8,15}$")


def _normalize_email(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    email = value.strip()
    if not email:
        return None
    return email if EMAIL_RE.match(email) else None


def _normalize_phone(value: Optional[str]) -> Optional[str]:
    if not value:
        return None

    first_phone = value.split(",")[0].split("/")[0].strip()
    cleaned = PHONE_CLEAN_RE.sub("", first_phone)

    if not cleaned:
        return None

    if cleaned.startswith("00"):
        cleaned = f"+{cleaned[2:]}"
    elif cleaned.startswith("995"):
        cleaned = f"+{cleaned}"
    elif cleaned.startswith("5") and len(cleaned) == 9:
        cleaned = f"+995{cleaned}"
    elif not cleaned.startswith("+"):
        cleaned = f"+{cleaned}"

    return cleaned if PHONE_VALID_RE.match(cleaned) else None


def _extract_company_contact(company: Company, channel: str) -> Tuple[Optional[str], Optional[str]]:
    profile = company.financial_data_json if isinstance(company.financial_data_json, dict) else {}

    if channel == "email":
        candidates = [
            getattr(company, "email", None),
            profile.get("email"),
            profile.get("contact_email"),
        ]
        for candidate in candidates:
            normalized = _normalize_email(candidate)
            if normalized:
                return normalized, None
        return None, "missing_email"

    candidates = [
        getattr(company, "phone", None),
        profile.get("phone"),
        profile.get("contact_phone"),
    ]
    for candidate in candidates:
        normalized = _normalize_phone(candidate)
        if normalized:
            return normalized, None

    return None, "missing_phone"


@router.get("/", response_model=List[OutreachResponse])
def list_outreach(
    skip: int = Query(0),
    limit: int = Query(50),
    channel: str = Query(None),
    status: str = Query(None),
    company_id: int = Query(None),
    db: Session = Depends(get_db)
):
    """List outreach records with optional filters"""
    query = db.query(Outreach)

    if channel:
        query = query.filter(Outreach.channel == channel)
    if status:
        query = query.filter(Outreach.status == status)
    if company_id:
        query = query.filter(Outreach.company_id == company_id)

    outreach = query.order_by(Outreach.created_at.desc()).offset(skip).limit(limit).all()
    return outreach


@router.post("/", response_model=OutreachResponse)
def create_outreach(outreach: OutreachCreate, db: Session = Depends(get_db)):
    """Create a new outreach record (send message)"""
    company = db.query(Company).filter(Company.id == outreach.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    db_outreach = Outreach(
        **outreach.dict(),
        status="sent",
        sent_at=datetime.utcnow()
    )
    db.add(db_outreach)

    # Update company lead status to "contacted"
    company.lead_status = "contacted"
    company.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(db_outreach)
    return db_outreach


@router.put("/{outreach_id}/status")
def update_outreach_status(
    outreach_id: int,
    update: OutreachUpdate,
    db: Session = Depends(get_db)
):
    """Update outreach status"""
    db_outreach = db.query(Outreach).filter(Outreach.id == outreach_id).first()
    if not db_outreach:
        raise HTTPException(status_code=404, detail="Outreach record not found")

    db_outreach.status = update.status
    db.commit()
    db.refresh(db_outreach)
    return db_outreach


@router.delete("/{outreach_id}")
def delete_outreach(outreach_id: int, db: Session = Depends(get_db)):
    """Delete an outreach record"""
    db_outreach = db.query(Outreach).filter(Outreach.id == outreach_id).first()
    if not db_outreach:
        raise HTTPException(status_code=404, detail="Outreach record not found")

    db.delete(db_outreach)
    db.commit()
    return {"status": "deleted"}


@router.get("/contacted-ids")
def get_contacted_ids(
    days: int = Query(30),
    db: Session = Depends(get_db)
):
    """Get list of company IDs contacted in the last N days"""
    cutoff = datetime.utcnow() - timedelta(days=days)
    rows = db.query(Outreach.company_id).filter(
        Outreach.sent_at >= cutoff,
        Outreach.status.in_(list(SUCCESS_STATUSES))
    ).distinct().all()
    return [r[0] for r in rows]


@router.get("/contact-status-map")
def contact_status_map(
    days: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db)
):
    """Get per-company outreach badge map."""
    return get_contact_status_map(db, days=days)


@router.get("/{outreach_id}", response_model=OutreachResponse)
def get_outreach(outreach_id: int, db: Session = Depends(get_db)):
    """Get a specific outreach record"""
    outreach = db.query(Outreach).filter(Outreach.id == outreach_id).first()
    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach record not found")
    return outreach


# ========== Send Message Endpoints ==========

class SendMessageRequest(BaseModel):
    company_id: int
    channel: str  # 'email' | 'whatsapp_twilio' | 'whatsapp_meta'
    template_id: Optional[int] = None
    custom_body: Optional[str] = None
    contact_info: Optional[str] = None  # email or phone


@router.post("/send/single")
async def send_single_message(
    request: SendMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Send a single outreach message (email or WhatsApp)

    Can use a template or custom message body
    """
    # Get company
    company = db.query(Company).filter(Company.id == request.company_id).first()
    if not company:
        raise HTTPException(status_code=404, detail="Company not found")

    # Get template if specified
    template = None
    if request.template_id:
        template = db.query(Template).filter(Template.id == request.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

    # Determine message body
    if request.custom_body:
        body = request.custom_body
    elif template:
        body = template.body
    else:
        raise HTTPException(status_code=400, detail="Must provide template_id or custom_body")

    # Personalize message
    company_name = company.name_ge or company.name_en
    body = body.replace('{name}', company_name or '')
    body = body.replace('{company_name}', company_name or '')

    # Get contact info
    if request.channel == 'email':
        if not request.contact_info:
            raise HTTPException(status_code=400, detail="Email address required for email channel")
        contact_info = request.contact_info
    else:  # whatsapp
        if not request.contact_info:
            raise HTTPException(status_code=400, detail="Phone number required for WhatsApp channel")
        contact_info = request.contact_info

    # Send message
    result = None
    if request.channel == 'email':
        from app.services.email_sender import send_email
        result = await send_email(
            to_email=contact_info,
            subject=template.subject if template else "Message from Sales Team",
            body=body
        )
    elif request.channel == 'whatsapp_twilio':
        from app.services.whatsapp_twilio import send_whatsapp_twilio
        result = await send_whatsapp_twilio(
            to_phone=contact_info,
            body=body
        )
    elif request.channel == 'whatsapp_meta':
        from app.services.whatsapp_meta import send_whatsapp_meta
        result = await send_whatsapp_meta(
            to_phone=contact_info,
            body=body
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid channel")

    sent_ok = result.get("status") == "success"
    outreach = Outreach(
        company_id=request.company_id,
        channel=request.channel,
        contact_info=contact_info,
        message_body=body,
        message_subject=template.subject if template else None,
        status='sent' if sent_ok else 'failed',
        sent_at=datetime.utcnow(),
        template_id=request.template_id
    )
    db.add(outreach)

    if sent_ok:
        company.lead_status = 'contacted'
        company.updated_at = datetime.utcnow()

    db.commit()
    db.refresh(outreach)

    return {
        'status': result['status'],
        'message': result['message'],
        'outreach_id': outreach.id
    }


class SendBulkRequest(BaseModel):
    company_ids: Optional[List[int]] = None  # Specific companies
    channel: str
    template_id: Optional[int] = None
    custom_body: Optional[str] = None
    get_all_leads: bool = False  # If true, send to all leads (no website)


@router.post("/send/bulk")
async def send_bulk_messages(
    request: SendBulkRequest,
    db: Session = Depends(get_db)
):
    """
    Send outreach messages to multiple companies

    Can target specific companies or all leads (companies without websites)
    """
    # Get template if specified
    template = None
    if request.template_id:
        template = db.query(Template).filter(Template.id == request.template_id).first()
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")

    # Determine message body
    if request.custom_body:
        body = request.custom_body
    elif template:
        body = template.body
    else:
        raise HTTPException(status_code=400, detail="Must provide template_id or custom_body")

    # Get companies to send to
    if request.get_all_leads:
        companies = db.query(Company).filter(
            Company.website_status == 'not_found',
            Company.status == 'active'
        ).all()
    elif request.company_ids:
        companies = db.query(Company).filter(Company.id.in_(request.company_ids)).all()
    else:
        raise HTTPException(status_code=400, detail="Must provide company_ids or set get_all_leads=true")

    if not companies:
        raise HTTPException(status_code=400, detail="No companies found to send to")

    # Dedup: skip companies contacted on same channel in last 30 days
    cutoff = datetime.utcnow() - timedelta(days=30)
    recently_contacted = set(
        r[0] for r in db.query(Outreach.company_id).filter(
            Outreach.channel == request.channel,
            Outreach.sent_at >= cutoff,
            Outreach.status.in_(['sent', 'delivered', 'read', 'replied'])
        ).distinct().all()
    )
    original_count = len(companies)
    companies = [c for c in companies if c.id not in recently_contacted]
    skipped_dedup = original_count - len(companies)
    skipped_missing_contact = 0

    if not companies:
        return {
            'total_sent': 0,
            'total_failed': 0,
            'skipped_dedup': skipped_dedup,
            'skipped_missing_contact': 0,
            'message': f"All {skipped_dedup} companies were already contacted in the last 30 days"
        }

    # Prepare recipients
    recipients = []
    send_targets = []
    for company in companies:
        company_name = company.name_ge or company.name_en or ""
        contact_info, _ = _extract_company_contact(company, request.channel)

        if not contact_info:
            skipped_missing_contact += 1
            continue

        if request.channel == 'email':
            recipient = {'email': contact_info, 'name': company_name}
        else:
            recipient = {'phone': contact_info, 'name': company_name}

        recipients.append(recipient)
        send_targets.append((company, recipient))

    if not recipients:
        return {
            'total_sent': 0,
            'total_failed': 0,
            'skipped_dedup': skipped_dedup,
            'skipped_missing_contact': skipped_missing_contact,
            'message': "No valid contact info found for selected leads",
            'errors': []
        }

    # Send messages
    if request.channel == 'email':
        from app.services.email_sender import send_bulk_emails
        result = await send_bulk_emails(
            recipients=recipients,
            subject=template.subject if template else "Message from Sales Team",
            body_template=body
        )
    elif request.channel == 'whatsapp_twilio':
        from app.services.whatsapp_twilio import send_whatsapp_bulk
        result = await send_whatsapp_bulk(
            recipients=recipients,
            body_template=body
        )
    elif request.channel == 'whatsapp_meta':
        from app.services.whatsapp_meta import send_whatsapp_bulk_meta
        result = await send_whatsapp_bulk_meta(
            recipients=recipients,
            body_template=body
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid channel")

    # Log attempts for both success and failure based on provider error list
    failed_contacts = {
        err.get('email') or err.get('phone')
        for err in result.get('errors', [])
        if isinstance(err, dict)
    }

    for company, recipient in send_targets:
        contact_info = recipient.get('email') or recipient.get('phone')
        is_failed = contact_info in failed_contacts
        outreach = Outreach(
            company_id=company.id,
            channel=request.channel,
            contact_info=contact_info,
            message_body=body,
            message_subject=template.subject if template else None,
            status='failed' if is_failed else 'sent',
            sent_at=datetime.utcnow(),
            template_id=request.template_id
        )
        db.add(outreach)

        if not is_failed:
            company.lead_status = 'contacted'
            company.updated_at = datetime.utcnow()

    db.commit()

    return {
        'total_sent': result['successful'],
        'total_failed': result['failed'],
        'skipped_dedup': skipped_dedup,
        'skipped_missing_contact': skipped_missing_contact,
        'message': f"Sent {result['successful']}/{result['total']} messages" +
                   (f" (skipped {skipped_dedup} already contacted)" if skipped_dedup else "") +
                   (f" (skipped {skipped_missing_contact} missing contacts)" if skipped_missing_contact else ""),
        'errors': result.get('errors', [])
    }

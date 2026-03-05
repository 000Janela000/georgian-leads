from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Outreach, Company, Template
from app.schemas import OutreachCreate, OutreachUpdate, OutreachResponse
from typing import List
from datetime import datetime
from pydantic import BaseModel
import asyncio

router = APIRouter()


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


@router.get("/{outreach_id}", response_model=OutreachResponse)
def get_outreach(outreach_id: int, db: Session = Depends(get_db)):
    """Get a specific outreach record"""
    outreach = db.query(Outreach).filter(Outreach.id == outreach_id).first()
    if not outreach:
        raise HTTPException(status_code=404, detail="Outreach record not found")
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


# ========== Send Message Endpoints ==========

class SendMessageRequest(BaseModel):
    company_id: int
    channel: str  # 'email' | 'whatsapp_twilio' | 'whatsapp_meta'
    template_id: int = None
    custom_body: str = None
    contact_info: str = None  # email or phone


@router.post("/send/single")
async def send_single_message(
    request: SendMessageRequest,
    db: Session = Depends(get_db)
):
    """
    Send a single outreach message (email or WhatsApp)

    Can use a template or custom message body
    """
    from app.services.email_sender import send_email
    from app.services.whatsapp_twilio import send_whatsapp_twilio
    from app.services.whatsapp_meta import send_whatsapp_meta

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
        result = await send_email(
            to_email=contact_info,
            subject=template.subject if template else "Message from Sales Team",
            body=body
        )
    elif request.channel == 'whatsapp_twilio':
        result = await send_whatsapp_twilio(
            to_phone=contact_info,
            body=body
        )
    elif request.channel == 'whatsapp_meta':
        result = await send_whatsapp_meta(
            to_phone=contact_info,
            body=body
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid channel")

    # Log outreach
    if result['status'] == 'success':
        outreach = Outreach(
            company_id=request.company_id,
            channel=request.channel,
            contact_info=contact_info,
            message_body=body,
            status='sent',
            sent_at=datetime.utcnow(),
            template_id=request.template_id
        )
        db.add(outreach)

        # Update company lead status
        company.lead_status = 'contacted'
        company.updated_at = datetime.utcnow()

        db.commit()
        db.refresh(outreach)

    return {
        'status': result['status'],
        'message': result['message'],
        'outreach_id': outreach.id if result['status'] == 'success' else None
    }


class SendBulkRequest(BaseModel):
    company_ids: List[int] = None  # Specific companies
    channel: str
    template_id: int = None
    custom_body: str = None
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
    from app.services.email_sender import send_bulk_emails
    from app.services.whatsapp_twilio import send_whatsapp_bulk
    from app.services.whatsapp_meta import send_whatsapp_bulk_meta

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

    # Prepare recipients
    recipients = []
    for company in companies:
        company_name = company.name_ge or company.name_en

        if request.channel == 'email':
            # Try to get email from company contact info
            email = getattr(company, 'email', None) or f"contact@{company_name.replace(' ', '')}.ge"
            recipients.append({'email': email, 'name': company_name})
        else:  # whatsapp
            # Try to get phone from company contact info
            phone = getattr(company, 'phone', None) or "+995123456789"  # Placeholder
            recipients.append({'phone': phone, 'name': company_name})

    # Send messages
    if request.channel == 'email':
        result = await send_bulk_emails(
            recipients=recipients,
            subject=template.subject if template else "Message from Sales Team",
            body_template=body
        )
    elif request.channel == 'whatsapp_twilio':
        result = await send_whatsapp_bulk(
            recipients=recipients,
            body_template=body
        )
    elif request.channel == 'whatsapp_meta':
        result = await send_whatsapp_bulk_meta(
            recipients=recipients,
            body_template=body
        )
    else:
        raise HTTPException(status_code=400, detail="Invalid channel")

    # Log all outreaches
    for idx, company in enumerate(companies):
        if idx < result['successful']:
            outreach = Outreach(
                company_id=company.id,
                channel=request.channel,
                contact_info=recipients[idx].get('email') or recipients[idx].get('phone'),
                message_body=body,
                status='sent',
                sent_at=datetime.utcnow(),
                template_id=request.template_id
            )
            db.add(outreach)

            # Update company
            company.lead_status = 'contacted'
            company.updated_at = datetime.utcnow()

    db.commit()

    return {
        'total_sent': result['successful'],
        'total_failed': result['failed'],
        'message': f"Sent {result['successful']}/{result['total']} messages",
        'errors': result.get('errors', [])
    }

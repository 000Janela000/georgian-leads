from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Template
from app.schemas import TemplateCreate, TemplateUpdate, TemplateResponse
from typing import List
from datetime import datetime

router = APIRouter()


@router.get("/", response_model=List[TemplateResponse])
def list_templates(
    skip: int = Query(0),
    limit: int = Query(50),
    language: str = Query(None),
    channel: str = Query(None),
    db: Session = Depends(get_db)
):
    """List templates with optional filters"""
    query = db.query(Template)

    if language:
        query = query.filter(Template.language == language)
    if channel:
        query = query.filter(Template.channel == channel)

    templates = query.offset(skip).limit(limit).all()
    return templates


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(template_id: int, db: Session = Depends(get_db)):
    """Get a specific template"""
    template = db.query(Template).filter(Template.id == template_id).first()
    if not template:
        raise HTTPException(status_code=404, detail="Template not found")
    return template


@router.post("/", response_model=TemplateResponse)
def create_template(template: TemplateCreate, db: Session = Depends(get_db)):
    """Create a new template"""
    db_template = Template(**template.dict())
    db.add(db_template)
    db.commit()
    db.refresh(db_template)
    return db_template


@router.put("/{template_id}", response_model=TemplateResponse)
def update_template(
    template_id: int,
    template_update: TemplateUpdate,
    db: Session = Depends(get_db)
):
    """Update a template"""
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    update_data = template_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_template, field, value)

    db_template.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(db_template)
    return db_template


@router.delete("/{template_id}")
def delete_template(template_id: int, db: Session = Depends(get_db)):
    """Delete a template"""
    db_template = db.query(Template).filter(Template.id == template_id).first()
    if not db_template:
        raise HTTPException(status_code=404, detail="Template not found")

    db.delete(db_template)
    db.commit()
    return {"status": "deleted"}

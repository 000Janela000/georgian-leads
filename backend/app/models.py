from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, JSON, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class Company(Base):
    __tablename__ = "companies"

    id = Column(Integer, primary_key=True, index=True)
    name_ge = Column(String(255), nullable=True)
    name_en = Column(String(255), nullable=True)
    identification_code = Column(String(50), unique=True, nullable=True)
    legal_form = Column(String(100), nullable=True)
    registration_date = Column(String(50), nullable=True)
    status = Column(String(50), default="active")  # active, liquidated, archived

    address = Column(String(500), nullable=True)
    director_name = Column(String(255), nullable=True)
    shareholders_json = Column(JSON, nullable=True)

    website_url = Column(String(500), nullable=True)
    website_status = Column(String(50), default="unknown")  # unknown, found, not_found
    facebook_url = Column(String(500), nullable=True)
    instagram_url = Column(String(500), nullable=True)
    linkedin_url = Column(String(500), nullable=True)

    financial_year = Column(Integer, nullable=True)
    revenue_gel = Column(Float, nullable=True)
    total_assets_gel = Column(Float, nullable=True)
    profit_gel = Column(Float, nullable=True)
    financial_data_json = Column(JSON, nullable=True)

    lead_status = Column(String(50), default="new")  # new, contacted, replied, not_interested, converted
    priority = Column(String(50), default="low")  # low, medium, high
    lead_score = Column(Integer, default=0)
    offer_lane = Column(String(50), default="landing_page")  # landing_page, full_website
    revenue_type = Column(String(50), default="unknown")  # exact, estimated, unknown
    tags = Column(JSON, default=list)
    notes = Column(Text, nullable=True)

    last_enriched_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    outreaches = relationship("Outreach", back_populates="company", cascade="all, delete-orphan")


class Outreach(Base):
    __tablename__ = "outreach"

    id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.id"), nullable=False)

    channel = Column(String(50), nullable=False)  # email, whatsapp_twilio, whatsapp_meta
    contact_info = Column(String(255), nullable=True)  # email or phone
    template_id = Column(Integer, ForeignKey("templates.id"), nullable=True)

    message_subject = Column(String(255), nullable=True)
    message_body = Column(Text, nullable=False)

    status = Column(String(50), default="draft")  # draft, sent, delivered, read, replied, bounced
    sent_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    company = relationship("Company", back_populates="outreaches")
    template = relationship("Template")


class Template(Base):
    __tablename__ = "templates"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    language = Column(String(10), default="ka")  # ka, en
    channel = Column(String(50), nullable=False)  # email, whatsapp

    subject = Column(String(255), nullable=True)  # for email
    body = Column(Text, nullable=False)

    is_default = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Setting(Base):
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=True)


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True)
    status = Column(String(20), default="queued")  # queued, running, done, error
    progress_pct = Column(Integer, default=0)
    current_step = Column(String(255), nullable=True)
    counters_json = Column(JSON, default=dict)
    error_text = Column(Text, nullable=True)
    started_at = Column(DateTime, nullable=True)
    finished_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

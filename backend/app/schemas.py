from pydantic import BaseModel, Field
from datetime import datetime
from typing import Any, Dict, Optional, List


# ========== Company Schemas ==========
class CompanyBase(BaseModel):
    name_ge: Optional[str] = None
    name_en: Optional[str] = None
    identification_code: Optional[str] = None
    legal_form: Optional[str] = None
    registration_date: Optional[str] = None
    status: str = "active"
    address: Optional[str] = None
    director_name: Optional[str] = None
    website_url: Optional[str] = None
    website_status: str = "unknown"
    notes: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    name_ge: Optional[str] = None
    name_en: Optional[str] = None
    website_url: Optional[str] = None
    website_status: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    lead_status: Optional[str] = None
    priority: Optional[str] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None


class CompanyResponse(CompanyBase):
    id: int
    website_status: str
    facebook_url: Optional[str]
    instagram_url: Optional[str]
    linkedin_url: Optional[str]
    revenue_gel: Optional[float]
    total_assets_gel: Optional[float]
    lead_status: str
    priority: str
    lead_score: Optional[int] = 0
    offer_lane: Optional[str] = "landing_page"
    revenue_type: Optional[str] = "unknown"
    tags: Optional[List[str]]
    last_enriched_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========== Outreach Schemas ==========
class OutreachBase(BaseModel):
    channel: str  # email, whatsapp_twilio, whatsapp_meta
    contact_info: Optional[str] = None
    message_subject: Optional[str] = None
    message_body: str


class OutreachCreate(OutreachBase):
    company_id: int
    template_id: Optional[int] = None


class OutreachUpdate(BaseModel):
    status: str


class OutreachResponse(OutreachBase):
    id: int
    company_id: int
    template_id: Optional[int]
    status: str
    sent_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True


# ========== Template Schemas ==========
class TemplateBase(BaseModel):
    name: str
    language: str = "ka"
    channel: str  # email, whatsapp
    subject: Optional[str] = None
    body: str
    is_default: bool = False


class TemplateCreate(TemplateBase):
    pass


class TemplateUpdate(BaseModel):
    name: Optional[str] = None
    subject: Optional[str] = None
    body: Optional[str] = None


class TemplateResponse(TemplateBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========== Statistics Schema ==========
class StatsResponse(BaseModel):
    total_companies: int
    companies_with_website: int
    companies_without_website: int
    contacted: int
    converted: int
    financial_data_available: int


class LeadResponse(CompanyResponse):
    social_active: bool = False
    contact_badge: str = "never_contacted"  # never_contacted, tried, contacted_recently
    score: int = 0
    revenue_type: str = "unknown"  # exact, estimated, unknown
    offer_lane: str = "landing_page"  # landing_page, full_website
    source_meta: Dict[str, Any] = Field(default_factory=dict)


class PipelineRunResponse(BaseModel):
    id: int
    status: str
    progress_pct: int
    current_step: Optional[str] = None
    counters_json: Optional[Dict[str, Any]] = None
    error_text: Optional[str] = None
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True

from pydantic import BaseModel
from datetime import datetime
from typing import Dict, Optional, List


# ========== Lead Schemas ==========

class LeadBase(BaseModel):
    name: str
    google_place_id: str
    category: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    website_url: Optional[str] = None
    website_status: str = "not_found"
    google_rating: Optional[float] = None
    google_review_count: int = 0
    facebook_url: Optional[str] = None
    facebook_followers: Optional[int] = None
    facebook_last_post_date: Optional[str] = None
    reachability_tier: str = "cold"
    lead_status: str = "new"
    notes: Optional[str] = None


class LeadCreate(LeadBase):
    pass


class LeadUpdate(BaseModel):
    lead_status: Optional[str] = None
    notes: Optional[str] = None
    facebook_url: Optional[str] = None
    facebook_followers: Optional[int] = None
    facebook_last_post_date: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    name: Optional[str] = None
    category: Optional[str] = None
    address: Optional[str] = None


class LeadResponse(LeadBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ========== Discover Schemas ==========

class DiscoverResult(BaseModel):
    google_place_id: str
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    city: str
    category: str
    google_rating: Optional[float] = None
    google_review_count: int = 0
    website_url: Optional[str] = None
    has_website: bool = False


class SearchRequest(BaseModel):
    city: str
    category: str
    api_key_index: int = 0


class SaveLeadsRequest(BaseModel):
    leads: List[DiscoverResult]


class SweepRequest(BaseModel):
    cities: List[str]
    categories: List[str]


class SweepStatus(BaseModel):
    status: str  # idle, running, done, error
    progress: Optional[str] = None
    saved: int = 0
    error: Optional[str] = None


# ========== Stats Schema ==========

class StatsResponse(BaseModel):
    total_leads: int
    leads_by_city: Dict[str, int]
    leads_by_tier: Dict[str, int]
    leads_by_status: Dict[str, int]
    leads_with_facebook: int
    leads_with_phone: int
    leads_with_email: int

from datetime import datetime
from sqlalchemy import Column, String, Integer, Float, DateTime, Text, Index
from app.database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    google_place_id = Column(String(100), unique=True, nullable=False)
    category = Column(String(100), nullable=True)
    phone = Column(String(100), nullable=True)
    email = Column(String(255), nullable=True)
    address = Column(String(500), nullable=True)
    city = Column(String(100), nullable=True)

    website_url = Column(String(500), nullable=True)
    website_status = Column(String(50), default="not_found")

    google_rating = Column(Float, nullable=True)
    google_review_count = Column(Integer, default=0)

    facebook_url = Column(String(500), nullable=True)
    facebook_followers = Column(Integer, nullable=True)
    facebook_last_post_date = Column(String(50), nullable=True)

    reachability_tier = Column(String(10), default="cold")
    lead_status = Column(String(20), default="new")
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        Index("idx_lead_city", "city"),
        Index("idx_lead_tier", "reachability_tier"),
        Index("idx_lead_status", "lead_status"),
        Index("idx_lead_reviews", "google_review_count"),
    )


class Setting(Base):
    __tablename__ = "settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=True)

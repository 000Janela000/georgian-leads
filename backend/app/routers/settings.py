"""Settings routes — API key management."""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Setting

router = APIRouter()

ALLOWED_KEYS = {
    "GOOGLE_PLACES_API_KEY",
    "GOOGLE_PLACES_API_KEY_2",
    "GOOGLE_PLACES_API_KEY_3",
    "GOOGLE_CSE_API_KEY",
    "GOOGLE_CSE_CX",
    "FACEBOOK_ACCESS_TOKEN",
}


@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    rows = db.query(Setting).all()
    return {row.key: row.value for row in rows}


@router.put("/")
def save_settings(data: dict, db: Session = Depends(get_db)):
    for key, value in data.items():
        if key not in ALLOWED_KEYS:
            continue
        existing = db.query(Setting).filter(Setting.key == key).first()
        if existing:
            existing.value = value or ""
        else:
            db.add(Setting(key=key, value=value or ""))
    db.commit()
    return {"status": "ok"}

import os
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.models import Setting

router = APIRouter()


@router.get("/")
def get_settings(db: Session = Depends(get_db)):
    rows = db.query(Setting).all()
    return {row.key: row.value for row in rows}


@router.put("/")
def save_settings(data: dict, db: Session = Depends(get_db)):
    for key, value in data.items():
        existing = db.query(Setting).filter(Setting.key == key).first()
        if existing:
            existing.value = value or ""
        else:
            db.add(Setting(key=key, value=value or ""))
        # Also set as env var so services pick it up
        if value:
            os.environ[key] = value
    db.commit()
    return {"status": "ok"}

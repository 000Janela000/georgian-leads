import os
import logging
import threading
import time
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models import Company, Setting
from app.schemas import CompanyResponse
from app.scrapers.overpass import search_overpass, CATEGORY_TAGS, CATEGORY_LABELS

logger = logging.getLogger(__name__)
router = APIRouter()

PRESET_CITIES = ["Tbilisi", "Batumi", "Kutaisi", "Rustavi", "Gori"]

# Module-level sweep state (single-user local app)
_sweep: dict = {"status": "idle", "progress": "", "saved": 0, "error": ""}
_sweep_lock = threading.Lock()


def _get_google_key_direct() -> str | None:
    """Read Google Places API key from DB (used in background threads without a request context)."""
    db = SessionLocal()
    try:
        row = db.query(Setting).filter(Setting.key == "GOOGLE_PLACES_API_KEY").first()
        if row and row.value:
            return row.value
        return os.getenv("GOOGLE_PLACES_API_KEY") or None
    finally:
        db.close()


def _run_sweep(cities: list[str], categories: list[str]) -> None:
    global _sweep
    db = SessionLocal()
    try:
        categories = [c for c in categories if c in CATEGORY_TAGS] or list(CATEGORY_TAGS.keys())
        total = len(cities) * len(categories)
        done = 0
        total_saved = 0

        google_key = _get_google_key_direct()
        if google_key:
            from app.scrapers.google_places import search_google_places
            logger.info("Sweep using Google Places API")
        else:
            logger.info("Sweep using OSM/Overpass (no Google Places key set)")

        for city in cities:
            for cat in categories:
                with _sweep_lock:
                    _sweep["progress"] = f"{city} / {CATEGORY_LABELS[cat]} ({done + 1}/{total})"
                try:
                    if google_key:
                        results = search_google_places(google_key, cat, city, limit=200)
                    else:
                        results = search_overpass(cat, city, limit=200)

                    for lead in results:
                        source_id = (lead.get("source_id") or "").strip()
                        if not source_id:
                            continue
                        if db.query(Company).filter(Company.identification_code == source_id).first():
                            continue
                        company = Company(
                            identification_code=source_id,
                            name_en=lead.get("name_en"),
                            phone=lead.get("phone"),
                            email=lead.get("email"),
                            address=lead.get("address"),
                            country="GE",
                            source="local",
                            category=lead.get("category"),
                            website_status="not_found",
                            facebook_url=lead.get("facebook_url"),
                            instagram_url=lead.get("instagram_url"),
                            lead_status="new",
                            status="active",
                        )
                        db.add(company)
                        total_saved += 1
                    db.commit()
                except Exception as e:
                    logger.warning("Sweep failed for %s/%s: %s", city, cat, e)
                    db.rollback()
                done += 1
                # Small delay between requests
                if not google_key:
                    time.sleep(2)  # Overpass rate limit
                with _sweep_lock:
                    _sweep["saved"] = total_saved

        with _sweep_lock:
            _sweep["status"] = "done"
            _sweep["progress"] = "Complete"
            _sweep["saved"] = total_saved
    except Exception as e:
        logger.error("Sweep error: %s", e)
        with _sweep_lock:
            _sweep["status"] = "error"
            _sweep["error"] = str(e)
    finally:
        db.close()


def _get_google_key(db: Session) -> str | None:
    row = db.query(Setting).filter(Setting.key == "GOOGLE_PLACES_API_KEY").first()
    if row and row.value:
        return row.value
    return os.getenv("GOOGLE_PLACES_API_KEY") or None


@router.get("/categories")
def get_categories():
    return [
        {"key": k, "label": CATEGORY_LABELS[k]}
        for k in CATEGORY_TAGS
    ]


@router.post("/search")
def search_leads(data: dict, db: Session = Depends(get_db)):
    category = (data.get("category") or "").strip()
    city = (data.get("city") or "").strip()
    limit = min(int(data.get("limit") or 200), 500)

    if not category or not city:
        raise HTTPException(400, "category and city are required")

    google_key = _get_google_key(db)

    try:
        if google_key:
            from app.scrapers.google_places import search_google_places
            results = search_google_places(google_key, category, city, limit)
        else:
            results = search_overpass(category, city, limit)
    except ValueError as e:
        raise HTTPException(400, str(e))
    except Exception as e:
        logger.error("Search failed: %s", e)
        raise HTTPException(502, f"Search failed: {e}")

    return results


@router.post("/save")
def save_leads(data: dict, db: Session = Depends(get_db)):
    leads: list[dict] = data.get("leads") or []
    if not leads:
        raise HTTPException(400, "leads list is required")

    saved = 0
    for lead in leads:
        source_id = (lead.get("source_id") or "").strip()
        if not source_id:
            continue
        if db.query(Company).filter(Company.identification_code == source_id).first():
            continue

        company = Company(
            identification_code=source_id,
            name_en=lead.get("name_en"),
            phone=lead.get("phone"),
            email=lead.get("email"),
            address=lead.get("address"),
            country=lead.get("country") or "XX",
            source="local",
            category=lead.get("category"),
            website_status="not_found",
            facebook_url=lead.get("facebook_url"),
            instagram_url=lead.get("instagram_url"),
            lead_status="new",
            status="active",
        )
        db.add(company)
        saved += 1

    db.commit()
    return {"saved": saved}


@router.post("/sweep-cities")
def sweep_cities(data: dict, background_tasks: BackgroundTasks):
    cities = data.get("cities") or ["Tbilisi", "Batumi"]
    cities = [c for c in cities if c in PRESET_CITIES]
    if not cities:
        raise HTTPException(400, "No valid cities provided")

    categories = data.get("categories") or list(CATEGORY_TAGS.keys())
    categories = [c for c in categories if c in CATEGORY_TAGS]
    if not categories:
        raise HTTPException(400, "No valid categories provided")

    with _sweep_lock:
        if _sweep.get("status") == "running":
            raise HTTPException(409, "Sweep already running")
        _sweep.update({"status": "running", "progress": "Starting...", "saved": 0, "error": ""})

    background_tasks.add_task(_run_sweep, cities, categories)
    return {"status": "started", "cities": cities, "categories": categories}


@router.get("/sweep-cities/status")
def sweep_status():
    with _sweep_lock:
        return dict(_sweep)


@router.get("/sweep-cities/cities")
def get_preset_cities():
    return PRESET_CITIES


@router.get("/leads")
def get_local_leads(limit: int = 500, db: Session = Depends(get_db)):
    companies = (
        db.query(Company)
        .filter(Company.source == "local")
        .order_by(Company.created_at.desc())
        .limit(limit)
        .all()
    )
    return [CompanyResponse.model_validate(c) for c in companies]

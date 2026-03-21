"""Discovery routes — find businesses via Google Places."""
import logging
import threading
import time
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db, SessionLocal
from app.models import Lead, Setting
from app.schemas import SearchRequest, SaveLeadsRequest, SweepRequest
from app.scrapers.google_places import search_google_places, CATEGORY_QUERIES, CITIES
from app.services.reachability import compute_tier

logger = logging.getLogger(__name__)
router = APIRouter()

# Module-level sweep state (single-user app)
_sweep: dict = {"status": "idle", "progress": "", "saved": 0, "error": ""}
_sweep_lock = threading.Lock()


def _get_api_keys(db: Session) -> list[str]:
    """Read all configured Google Places API keys from settings."""
    keys = []
    for suffix in ["", "_2", "_3"]:
        row = db.query(Setting).filter(Setting.key == f"GOOGLE_PLACES_API_KEY{suffix}").first()
        if row and row.value:
            keys.append(row.value)
    return keys


@router.get("/cities")
def get_cities():
    return CITIES


@router.get("/categories")
def get_categories():
    return [{"key": k, "label": v} for k, v in CATEGORY_QUERIES.items()]


@router.post("/search")
def search(data: SearchRequest, db: Session = Depends(get_db)):
    keys = _get_api_keys(db)
    if not keys:
        raise HTTPException(400, "No Google Places API key configured. Add one in Settings.")

    key_index = max(0, min(data.api_key_index, len(keys) - 1))
    api_key = keys[key_index]

    try:
        results = search_google_places(api_key, data.category, data.city)
    except Exception as e:
        # Try next key on failure
        for i, fallback_key in enumerate(keys):
            if i == key_index:
                continue
            try:
                results = search_google_places(fallback_key, data.category, data.city)
                break
            except Exception:
                continue
        else:
            logger.error("All API keys failed for search: %s", e)
            raise HTTPException(502, "Google Places search failed. Check API key configuration.")

    return {"results": results, "total": len(results)}


@router.post("/save")
def save_leads(data: SaveLeadsRequest, db: Session = Depends(get_db)):
    saved = 0
    skipped_existing = 0
    skipped_has_website = 0

    # Batch duplicate check instead of per-lead query
    incoming_ids = [ld.google_place_id for ld in data.leads if not ld.has_website]
    existing_ids = set(
        row[0] for row in db.query(Lead.google_place_id)
        .filter(Lead.google_place_id.in_(incoming_ids)).all()
    ) if incoming_ids else set()

    for lead_data in data.leads:
        if lead_data.has_website:
            skipped_has_website += 1
            continue

        if lead_data.google_place_id in existing_ids:
            skipped_existing += 1
            continue

        tier = compute_tier(None, lead_data.phone, None)
        lead = Lead(
            name=lead_data.name,
            google_place_id=lead_data.google_place_id,
            category=lead_data.category,
            phone=lead_data.phone,
            address=lead_data.address,
            city=lead_data.city,
            website_url=lead_data.website_url,
            website_status="not_found",
            google_rating=lead_data.google_rating,
            google_review_count=lead_data.google_review_count,
            reachability_tier=tier,
        )
        db.add(lead)
        saved += 1

    try:
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(500, "Failed to save leads. Some may already exist.")
    return {"saved": saved, "skipped_existing": skipped_existing, "skipped_has_website": skipped_has_website}


def _run_sweep(cities: list[str], categories: list[str]) -> None:
    global _sweep
    db = SessionLocal()
    try:
        keys = _get_api_keys(db)
        if not keys:
            with _sweep_lock:
                _sweep.update({"status": "error", "error": "No API keys configured"})
            return

        total_steps = len(cities) * len(categories)
        done = 0
        total_saved = 0

        for city in cities:
            for cat in categories:
                with _sweep_lock:
                    _sweep["progress"] = f"{city} / {CATEGORY_QUERIES.get(cat, cat)} ({done + 1}/{total_steps})"

                # Round-robin key selection
                api_key = keys[done % len(keys)]

                try:
                    results = search_google_places(api_key, cat, city, limit=60)

                    # Batch duplicate check
                    result_ids = [r["google_place_id"] for r in results if not r["has_website"]]
                    existing_ids = set(
                        row[0] for row in db.query(Lead.google_place_id)
                        .filter(Lead.google_place_id.in_(result_ids)).all()
                    ) if result_ids else set()

                    for r in results:
                        if r["has_website"]:
                            continue
                        if r["google_place_id"] in existing_ids:
                            continue

                        tier = compute_tier(None, r.get("phone"), None)
                        lead = Lead(
                            name=r["name"],
                            google_place_id=r["google_place_id"],
                            category=r.get("category"),
                            phone=r.get("phone"),
                            address=r.get("address"),
                            city=r.get("city"),
                            google_rating=r.get("google_rating"),
                            google_review_count=r.get("google_review_count", 0),
                            website_status="not_found",
                            reachability_tier=tier,
                        )
                        db.add(lead)
                        total_saved += 1

                    db.commit()
                except Exception as e:
                    logger.warning("Sweep failed for %s/%s: %s", city, cat, e)
                    db.rollback()

                done += 1
                with _sweep_lock:
                    _sweep["saved"] = total_saved

                time.sleep(0.5)

        with _sweep_lock:
            _sweep.update({"status": "done", "progress": "Complete", "saved": total_saved})

    except Exception as e:
        logger.error("Sweep error: %s", e)
        with _sweep_lock:
            _sweep.update({"status": "error", "error": "Sweep failed. Check server logs."})
    finally:
        db.close()


@router.post("/sweep")
def start_sweep(data: SweepRequest, background_tasks: BackgroundTasks):
    cities = [c for c in data.cities if c in CITIES]
    if not cities:
        raise HTTPException(400, "No valid cities provided")

    categories = [c for c in data.categories if c in CATEGORY_QUERIES]
    if not categories:
        raise HTTPException(400, "No valid categories provided")

    with _sweep_lock:
        if _sweep.get("status") == "running":
            raise HTTPException(409, "Sweep already running")
        _sweep.update({"status": "running", "progress": "Starting...", "saved": 0, "error": ""})

    background_tasks.add_task(_run_sweep, cities, categories)
    return {"status": "started", "cities": cities, "categories": categories}


@router.get("/sweep/status")
def sweep_status():
    with _sweep_lock:
        return dict(_sweep)

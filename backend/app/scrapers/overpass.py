"""Overpass API scraper — finds businesses without websites by category + city."""
import logging
import time
import httpx

logger = logging.getLogger(__name__)

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
OVERPASS_URL = "https://overpass-api.de/api/interpreter"

# Pre-computed bounding boxes (south, west, north, east) for preset cities.
# Using hardcoded values avoids Nominatim entirely for these cities — Nominatim
# is rate-limited and blocks requests with unrecognised User-Agents.
_CITY_BBOX: dict[str, tuple[float, float, float, float]] = {
    "tbilisi":  (41.65, 44.70, 41.82, 44.92),
    "batumi":   (41.60, 41.60, 41.68, 41.72),
    "kutaisi":  (42.23, 42.65, 42.31, 42.74),
    "rustavi":  (41.52, 44.97, 41.59, 45.06),
    "gori":     (41.97, 44.08, 42.03, 44.14),
}

# Runtime geocode cache for ad-hoc city searches (Find Leads page)
_geocode_cache: dict[str, tuple[float, float, float, float]] = {}

# category key → list of (osm_key, osm_value) tag pairs
CATEGORY_TAGS: dict[str, list[tuple[str, str]]] = {
    "restaurant":    [("amenity", "restaurant"), ("amenity", "fast_food"), ("amenity", "cafe")],
    "hotel":         [("tourism", "hotel"), ("tourism", "guest_house"), ("tourism", "hostel")],
    "clinic":        [("amenity", "clinic"), ("amenity", "dentist"), ("amenity", "doctors")],
    "salon":         [("shop", "hairdresser"), ("shop", "beauty")],
    "gym":           [("leisure", "fitness_centre"), ("leisure", "sports_centre")],
    "car_repair":    [("shop", "car_repair")],
    "pharmacy":      [("amenity", "pharmacy")],
    "estate_agent":  [("office", "estate_agent")],
    "lawyer":        [("office", "lawyer")],
}

CATEGORY_LABELS: dict[str, str] = {
    "restaurant":   "Restaurants & cafes",
    "hotel":        "Hotels & accommodation",
    "clinic":       "Clinics & dentists",
    "salon":        "Salons & beauty",
    "gym":          "Gyms & fitness",
    "car_repair":   "Auto repair shops",
    "pharmacy":     "Pharmacies",
    "estate_agent": "Real estate agents",
    "lawyer":       "Law offices",
}


def _geocode(city: str) -> tuple[float, float, float, float]:
    """Returns (south, west, north, east) bounding box. Uses hardcoded GE cities first, then Nominatim."""
    key = city.lower().strip()
    if key in _CITY_BBOX:
        return _CITY_BBOX[key]
    if key in _geocode_cache:
        return _geocode_cache[key]
    resp = httpx.get(
        NOMINATIM_URL,
        params={"q": city, "format": "json", "limit": 1},
        headers={"User-Agent": "canvass/1.0"},
        timeout=10,
    )
    resp.raise_for_status()
    data = resp.json()
    if not data:
        raise ValueError(f"City not found: {city!r}")
    bb = data[0]["boundingbox"]  # [minlat, maxlat, minlon, maxlon]
    result = float(bb[0]), float(bb[2]), float(bb[1]), float(bb[3])
    _geocode_cache[key] = result
    return result


def _build_query(bbox: tuple, tags: list[tuple[str, str]]) -> str:
    south, west, north, east = bbox
    b = f"{south},{west},{north},{east}"
    parts = [f'  nwr["{k}"="{v}"]({b});' for k, v in tags]
    return "[out:json][timeout:60];\n(\n" + "\n".join(parts) + "\n);\nout center;"


def search_overpass(category: str, city: str, limit: int = 200) -> list[dict]:
    tags = CATEGORY_TAGS.get(category)
    if not tags:
        raise ValueError(f"Unknown category: {category!r}. Valid: {list(CATEGORY_TAGS)}")

    bbox = _geocode(city)
    query = _build_query(bbox, tags)

    # Retry once on 429/504 with a back-off
    for attempt in range(2):
        resp = httpx.post(OVERPASS_URL, data={"data": query}, timeout=70)
        if resp.status_code in (429, 504) and attempt == 0:
            logger.warning("Overpass %s — retrying in 10s", resp.status_code)
            time.sleep(10)
            continue
        resp.raise_for_status()
        break

    results = []
    for el in resp.json().get("elements", []):
        t = el.get("tags", {})

        # Skip if already has website
        if t.get("website") or t.get("contact:website") or t.get("url"):
            continue

        name = t.get("name") or t.get("name:en")
        if not name:
            continue

        phone = t.get("phone") or t.get("contact:phone") or t.get("contact:mobile")

        addr_parts = [t.get("addr:street"), t.get("addr:housenumber"), t.get("addr:city") or city]
        address = ", ".join(p for p in addr_parts if p) or None

        if el["type"] == "node":
            lat, lon = el.get("lat"), el.get("lon")
        else:
            c = el.get("center", {})
            lat, lon = c.get("lat"), c.get("lon")

        results.append({
            "source_id":     f"osm_{el['type']}_{el['id']}",
            "name_en":       name,
            "phone":         phone,
            "email":         t.get("email") or t.get("contact:email"),
            "address":       address,
            "country":       t.get("addr:country") or "",
            "city":          city,
            "category":      category,
            "lat":           lat,
            "lon":           lon,
            "facebook_url":  t.get("contact:facebook"),
            "instagram_url": t.get("contact:instagram"),
            "source":        "overpass",
        })

        if len(results) >= limit:
            break

    return results

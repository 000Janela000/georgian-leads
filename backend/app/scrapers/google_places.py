"""Google Places API (v1) scraper for discovering businesses."""
import logging
import httpx

logger = logging.getLogger(__name__)

PLACES_URL = "https://places.googleapis.com/v1/places:searchText"

FIELD_MASK = ",".join([
    "places.id",
    "places.displayName",
    "places.formattedAddress",
    "places.nationalPhoneNumber",
    "places.websiteUri",
    "places.rating",
    "places.userRatingCount",
])

CATEGORY_QUERIES: dict[str, str] = {
    "restaurant":   "restaurants and cafes",
    "hotel":        "hotels and guest houses",
    "clinic":       "clinics and dentists",
    "salon":        "hair salons and beauty salons",
    "gym":          "gyms and fitness centres",
    "car_repair":   "auto repair shops",
    "pharmacy":     "pharmacies",
    "estate_agent": "real estate agencies",
    "lawyer":       "law offices",
}

CITIES = ["Tbilisi", "Batumi", "Kutaisi", "Rustavi", "Gori"]


def search_google_places(api_key: str, category: str, city: str, limit: int = 60) -> list[dict]:
    """Search Google Places for businesses in a city. Returns ALL results (caller filters by website)."""
    query_term = CATEGORY_QUERIES.get(category, category)
    text_query = f"{query_term} in {city}, Georgia"

    results = []
    next_page_token = None

    while len(results) < limit:
        body: dict = {
            "textQuery": text_query,
            "maxResultCount": min(20, limit - len(results)),
        }
        if next_page_token:
            body["pageToken"] = next_page_token

        resp = httpx.post(
            PLACES_URL,
            json=body,
            headers={
                "X-Goog-Api-Key": api_key,
                "X-Goog-FieldMask": FIELD_MASK,
            },
            timeout=15,
        )
        resp.raise_for_status()
        data = resp.json()

        for place in data.get("places", []):
            name = place.get("displayName", {}).get("text")
            if not name:
                continue

            website_uri = place.get("websiteUri")
            results.append({
                "google_place_id": place["id"],
                "name": name,
                "phone": place.get("nationalPhoneNumber"),
                "address": place.get("formattedAddress"),
                "city": city,
                "category": category,
                "google_rating": place.get("rating"),
                "google_review_count": place.get("userRatingCount", 0),
                "website_url": website_uri,
                "has_website": bool(website_uri),
            })

        next_page_token = data.get("nextPageToken")
        if not next_page_token:
            break

    results.sort(key=lambda x: x.get("google_review_count", 0), reverse=True)
    return results[:limit]

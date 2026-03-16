"""Google Places API (v1) scraper — optional, used when GOOGLE_PLACES_API_KEY is set."""
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
    "places.userRatingCount",
    "places.location",
    "places.regularOpeningHours",
])

# Maps our category keys to natural language query terms
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


def search_google_places(api_key: str, category: str, city: str, limit: int = 20) -> list[dict]:
    query_term = CATEGORY_QUERIES.get(category, category)
    text_query = f"{query_term} in {city}"

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
            # Skip if already has a website
            if place.get("websiteUri"):
                continue

            name = place.get("displayName", {}).get("text")
            if not name:
                continue

            loc = place.get("location", {})
            results.append({
                "source_id":     f"gp_{place['id']}",
                "name_en":       name,
                "phone":         place.get("nationalPhoneNumber"),
                "email":         None,
                "address":       place.get("formattedAddress"),
                "country":       "",
                "city":          city,
                "category":      category,
                "lat":           loc.get("latitude"),
                "lon":           loc.get("longitude"),
                "facebook_url":  None,
                "instagram_url": None,
                "user_rating_count": place.get("userRatingCount", 0),
                "source":        "google_places",
            })

        next_page_token = data.get("nextPageToken")
        if not next_page_token:
            break

    # Sort by activity signal (more ratings = more active business)
    results.sort(key=lambda x: x.get("user_rating_count", 0), reverse=True)
    return results[:limit]

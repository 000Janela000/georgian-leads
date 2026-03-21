"""Facebook enrichment pipeline: find Facebook pages via Google CSE, optionally enrich via Graph API."""
import logging
import re
import httpx

logger = logging.getLogger(__name__)

CSE_URL = "https://www.googleapis.com/customsearch/v1"
GRAPH_URL = "https://graph.facebook.com/v19.0"

FB_PAGE_PATTERN = re.compile(r"https?://(?:www\.)?facebook\.com/(?!groups/|events/|profile\.php)([^/?#]+)")


def find_facebook_via_cse(cse_api_key: str, cse_cx: str, business_name: str, city: str) -> str | None:
    """Search Google CSE for a business's Facebook page. Returns URL or None."""
    query = f'site:facebook.com "{business_name}" "{city}"'

    try:
        resp = httpx.get(
            CSE_URL,
            params={"key": cse_api_key, "cx": cse_cx, "q": query, "num": 3},
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        for item in data.get("items", []):
            link = item.get("link", "")
            if FB_PAGE_PATTERN.match(link):
                return link

    except Exception as e:
        logger.warning("CSE lookup failed for %s: %s", business_name, e)

    return None


def enrich_from_graph_api(access_token: str, facebook_url: str) -> dict | None:
    """Fetch public page data from Facebook Graph API. Returns enrichment dict or None."""
    match = FB_PAGE_PATTERN.match(facebook_url)
    if not match:
        return None

    page_id = match.group(1)

    try:
        resp = httpx.get(
            f"{GRAPH_URL}/{page_id}",
            params={
                "access_token": access_token,
                "fields": "fan_count,name,phone,emails,single_line_address",
            },
            timeout=10,
        )
        resp.raise_for_status()
        data = resp.json()

        result = {
            "facebook_followers": data.get("fan_count"),
        }

        # Try to get last post date
        posts_resp = httpx.get(
            f"{GRAPH_URL}/{page_id}/posts",
            params={
                "access_token": access_token,
                "fields": "created_time",
                "limit": 1,
            },
            timeout=10,
        )
        if posts_resp.status_code == 200:
            posts = posts_resp.json().get("data", [])
            if posts:
                result["facebook_last_post_date"] = posts[0].get("created_time", "")[:10]

        # Extra contact info from the page
        if data.get("phone"):
            result["phone"] = data["phone"]
        emails = data.get("emails", [])
        if emails:
            result["email"] = emails[0]

        return result

    except Exception as e:
        logger.warning("Graph API enrichment failed for %s: %s", facebook_url, e)
        return None


def enrich_lead_facebook(lead_name: str, city: str, settings: dict) -> dict:
    """
    Main enrichment entry point. Returns dict with any found data:
    {facebook_url, facebook_followers, facebook_last_post_date, phone, email}
    """
    result = {}

    cse_key = settings.get("GOOGLE_CSE_API_KEY")
    cse_cx = settings.get("GOOGLE_CSE_CX")

    if cse_key and cse_cx:
        fb_url = find_facebook_via_cse(cse_key, cse_cx, lead_name, city)
        if fb_url:
            result["facebook_url"] = fb_url

    fb_token = settings.get("FACEBOOK_ACCESS_TOKEN")
    fb_url = result.get("facebook_url")

    if fb_token and fb_url:
        graph_data = enrich_from_graph_api(fb_token, fb_url)
        if graph_data:
            result.update(graph_data)

    return result

"""
Social media profile finder for Georgian companies
Facebook-first approach (dominant platform in Georgia)
No API keys required — uses direct URL checks
"""

import httpx
import logging
import os
from typing import Dict, Optional
from urllib.parse import urlparse
from app.scrapers.web_checker import normalize_company_name

logger = logging.getLogger(__name__)
INSECURE_SSL = os.getenv("SCRAPER_INSECURE_SSL", "false").lower() in {"1", "true", "yes", "on"}
SOCIAL_UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
FACEBOOK_ERROR_MARKERS = [
    "content isn't available",
    "page isn't available",
    "you must log in",
    "log into facebook",
    # Georgian-language error pages
    "შინაარსი მიუწვდომელია",   # "content isn't available"
    "ეს გვერდი მიუწვდომელია",  # "this page isn't available"
    "ეს გვერდი ვერ მოიძებნა",  # "this page could not be found"
    "გვერდი ვერ მოიძებნა",     # "page could not be found"
]
INSTAGRAM_ERROR_MARKERS = [
    "sorry, this page isn't available",
    "the link you followed may be broken",
    "login",
]
RESERVED_HANDLES = {
    "",
    "login",
    "profile.php",
    "pages",
    "groups",
    "watch",
    "marketplace",
    "people",
    "public",
}


def _extract_handle(url: str, domain: str) -> Optional[str]:
    try:
        parsed = urlparse(url)
        host = (parsed.hostname or "").lower()
        if domain not in host:
            return None
        handle = (parsed.path or "").strip("/")
        if not handle or "/" in handle:
            return None
        handle_lower = handle.lower()
        if handle_lower in RESERVED_HANDLES:
            return None
        return handle
    except Exception:
        return None


def _contains_any(text: str, markers: list[str]) -> bool:
    lowered = text.lower()
    return any(marker in lowered for marker in markers)


async def check_facebook_page(company_name: str, timeout: int = 8) -> Optional[str]:
    """
    Try to find a Facebook page for a company.
    Checks common Facebook URL patterns based on company name.

    Returns: Facebook URL if found, None otherwise
    """
    name_bases = normalize_company_name(company_name)
    if not name_bases:
        return None

    urls_to_try = []
    for base in name_bases:
        urls_to_try.extend([
            f"https://www.facebook.com/{base}",
            f"https://www.facebook.com/{base}ge",
            f"https://www.facebook.com/{base}.ge",
            f"https://www.facebook.com/{base}georgia",
        ])

    async with httpx.AsyncClient(
        timeout=timeout,
        follow_redirects=True,
        verify=not INSECURE_SSL,
    ) as client:
        for url in urls_to_try[:6]:  # Limit checks
            try:
                r = await client.get(url, headers={"User-Agent": SOCIAL_UA})
                if r.status_code != 200:
                    continue
                final_url = str(r.url)
                if "/login" in final_url or "/error" in final_url:
                    continue
                if not _extract_handle(final_url, "facebook.com"):
                    continue
                if _contains_any(r.text, FACEBOOK_ERROR_MARKERS):
                    continue
                return final_url.split("?")[0]
            except Exception:
                continue

    return None


async def check_instagram_page(company_name: str, timeout: int = 8) -> Optional[str]:
    """
    Try to find an Instagram page for a company.
    Returns: Instagram URL if found, None otherwise
    """
    name_bases = normalize_company_name(company_name)
    if not name_bases:
        return None

    urls_to_try = []
    for base in name_bases:
        urls_to_try.extend([
            f"https://www.instagram.com/{base}/",
            f"https://www.instagram.com/{base}.ge/",
            f"https://www.instagram.com/{base}_ge/",
        ])

    async with httpx.AsyncClient(
        timeout=timeout,
        follow_redirects=True,
        verify=not INSECURE_SSL,
    ) as client:
        for url in urls_to_try[:4]:  # Limit checks
            try:
                r = await client.get(url, headers={"User-Agent": SOCIAL_UA})
                if r.status_code != 200:
                    continue
                final_url = str(r.url)
                if "/accounts/login" in final_url:
                    continue
                if not _extract_handle(final_url, "instagram.com"):
                    continue
                if _contains_any(r.text, INSTAGRAM_ERROR_MARKERS):
                    continue
                return final_url.split("?")[0]
            except Exception:
                continue

    return None


async def find_all_social_profiles(company_name: str) -> Dict[str, Optional[str]]:
    """
    Find company profiles on social platforms.
    Facebook-first (dominant in Georgia), then Instagram.
    No API keys needed.

    Returns: {
        'facebook': 'url or None',
        'instagram': 'url or None',
    }
    """
    profiles: Dict[str, Optional[str]] = {
        "facebook": None,
        "instagram": None,
    }

    if not company_name:
        return profiles

    # Facebook first (most common for Georgian businesses)
    try:
        profiles["facebook"] = await check_facebook_page(company_name)
        if profiles["facebook"]:
            logger.info(f"  Facebook found: {profiles['facebook']}")
    except Exception as e:
        logger.debug(f"Facebook search error: {e}")

    # Instagram
    try:
        profiles["instagram"] = await check_instagram_page(company_name)
        if profiles["instagram"]:
            logger.info(f"  Instagram found: {profiles['instagram']}")
    except Exception as e:
        logger.debug(f"Instagram search error: {e}")

    return profiles


async def validate_social_profile(url: str, timeout: int = 5) -> bool:
    """
    Check if a social media profile URL is valid/accessible.
    Returns: True if URL responds with 2xx/3xx, False otherwise
    """
    if not url:
        return False

    try:
        async with httpx.AsyncClient(timeout=timeout, follow_redirects=True, verify=not INSECURE_SSL) as client:
            response = await client.get(url, headers={"User-Agent": SOCIAL_UA})
            if response.status_code != 200:
                return False
            final_url = str(response.url)
            if "facebook.com" in final_url:
                return _extract_handle(final_url, "facebook.com") is not None and not _contains_any(
                    response.text, FACEBOOK_ERROR_MARKERS
                )
            if "instagram.com" in final_url:
                return _extract_handle(final_url, "instagram.com") is not None and not _contains_any(
                    response.text, INSTAGRAM_ERROR_MARKERS
                )
            return False
    except Exception:
        return False

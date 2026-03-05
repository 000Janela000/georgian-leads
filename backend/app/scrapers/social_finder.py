"""
Social media profile finder for Georgian companies
Facebook-first approach (dominant platform in Georgia)
No API keys required — uses direct URL checks
"""

import httpx
import re
import logging
import os
from typing import Dict, Optional
from urllib.parse import quote_plus
from app.scrapers.web_checker import transliterate_georgian, normalize_company_name

logger = logging.getLogger(__name__)
INSECURE_SSL = os.getenv("SCRAPER_INSECURE_SSL", "false").lower() in {"1", "true", "yes", "on"}


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
                r = await client.head(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                # Facebook returns 200 for existing pages, 404 for non-existent
                if r.status_code == 200:
                    # Check we didn't get redirected to login or error page
                    final_url = str(r.url)
                    if "/login" not in final_url and "/error" not in final_url:
                        return url
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
                r = await client.head(url, headers={
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
                })
                if r.status_code == 200:
                    final_url = str(r.url)
                    if "/accounts/login" not in final_url:
                        return url
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
            response = await client.head(url, headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
            })
            return 200 <= response.status_code < 400
    except Exception:
        return False

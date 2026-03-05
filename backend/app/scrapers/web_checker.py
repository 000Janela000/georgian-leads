"""
Website detection and validation
Uses Clearbit, Google CSE, and HTTP validation
"""

import httpx
import os
import logging
from typing import Optional, List
import re

logger = logging.getLogger(__name__)

CLEARBIT_API_KEY = os.getenv("CLEARBIT_API_KEY", "")
GOOGLE_CSE_API_KEY = os.getenv("GOOGLE_CSE_API_KEY", "")
GOOGLE_CSE_CX = os.getenv("GOOGLE_CSE_CX", "")


async def find_website_clearbit(company_name: str) -> Optional[str]:
    """
    Find company website using Clearbit Name-to-Domain API
    Free tier: 50,000 requests/month

    Returns: URL if found, None otherwise
    """
    if not CLEARBIT_API_KEY:
        logger.warning("Clearbit API key not configured")
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = "https://company.clearbit.com/v1/domains/find"
            params = {"name": company_name}

            auth = (CLEARBIT_API_KEY, "")  # Clearbit uses API key as username

            response = await client.get(url, params=params, auth=auth)

            if response.status_code == 200:
                data = response.json()
                domain = data.get("domain")
                if domain:
                    return f"https://{domain}"
            elif response.status_code == 404:
                # Company not found in Clearbit
                return None
            else:
                logger.error(f"Clearbit error: {response.status_code}")
                return None

    except Exception as e:
        logger.error(f"Clearbit API error: {e}")
        return None


async def find_website_google_cse(company_name: str) -> Optional[str]:
    """
    Find company website using Google Custom Search
    Free tier: 100 queries/day, then $5 per 1000

    Returns: URL if found, None otherwise
    """
    if not GOOGLE_CSE_API_KEY or not GOOGLE_CSE_CX:
        logger.warning("Google CSE credentials not configured")
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = "https://www.googleapis.com/customsearch/v1"

            # Search for official website
            query = f'"{company_name}" georgia site:*.ge OR site:*.com official website'

            params = {
                "q": query,
                "cx": GOOGLE_CSE_CX,
                "key": GOOGLE_CSE_API_KEY,
                "num": 1  # Only get first result
            }

            response = await client.get(url, params=params)

            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])

                if items:
                    # Filter for actual company websites (skip facebook, linkedin, etc)
                    for item in items:
                        result_url = item.get("link", "")
                        # Skip social media and directories
                        if not any(x in result_url.lower() for x in
                                 ["facebook", "linkedin", "instagram", "twitter", "youtube"]):
                            return result_url

            return None

    except Exception as e:
        logger.error(f"Google CSE error: {e}")
        return None


async def validate_website(url: str, timeout: int = 5) -> bool:
    """
    Validate if a URL is live and accessible

    Returns: True if URL responds with 2xx/3xx, False otherwise
    """
    if not url:
        return False

    try:
        # Ensure URL has protocol
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"

        async with httpx.AsyncClient(timeout=timeout) as client:
            # Use HEAD request for speed (doesn't download full content)
            response = await client.head(url, follow_redirects=True)

            # 2xx = success, 3xx = redirect (still valid), 4xx/5xx = error
            return 200 <= response.status_code < 400

    except Exception as e:
        logger.debug(f"Website validation error for {url}: {e}")
        return False


async def find_website(company_name: str, company_id: str = "") -> dict:
    """
    Find company website using multiple methods in order:
    1. Clearbit API (fastest, most reliable)
    2. Google Custom Search (broader coverage)
    3. Direct domain guessing (last resort)

    Returns: {
        'url': found URL or None,
        'status': 'found' | 'not_found' | 'unknown',
        'method': which method found it,
        'validated': whether URL was verified alive
    }
    """
    result = {
        'url': None,
        'status': 'unknown',
        'method': None,
        'validated': False
    }

    # Try Clearbit first (fastest)
    url = await find_website_clearbit(company_name)
    if url:
        validated = await validate_website(url)
        result['url'] = url
        result['status'] = 'found' if validated else 'not_found'
        result['method'] = 'clearbit'
        result['validated'] = validated
        return result

    # Try Google CSE next
    url = await find_website_google_cse(company_name)
    if url:
        validated = await validate_website(url)
        result['url'] = url
        result['status'] = 'found' if validated else 'not_found'
        result['method'] = 'google_cse'
        result['validated'] = validated
        return result

    # Try direct domain guesses (Georgian companies often use .ge domain)
    direct_urls = await try_direct_domains(company_name)
    for url in direct_urls:
        if await validate_website(url):
            result['url'] = url
            result['status'] = 'found'
            result['method'] = 'direct_guess'
            result['validated'] = True
            return result

    # Nothing found
    result['status'] = 'not_found'
    return result


async def try_direct_domains(company_name: str) -> List[str]:
    """
    Try common domain patterns for Georgian companies
    Returns list of URLs to try
    """
    # Normalize company name
    domain_base = company_name.lower()
    domain_base = re.sub(r'[^a-z0-9]', '', domain_base)  # Remove special chars
    domain_base = domain_base[:30]  # Limit length

    urls_to_try = [
        f"https://{domain_base}.ge",
        f"https://{domain_base}.com.ge",
        f"https://{domain_base}.com",
        f"https://www.{domain_base}.ge",
        f"https://www.{domain_base}.com",
    ]

    return urls_to_try

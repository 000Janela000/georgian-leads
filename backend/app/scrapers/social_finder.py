"""
Social media profile finder
Searches for company profiles on Facebook, Instagram, LinkedIn
"""

import httpx
import os
import logging
from typing import Dict, Optional

logger = logging.getLogger(__name__)

GOOGLE_CSE_API_KEY = os.getenv("GOOGLE_CSE_API_KEY", "")
GOOGLE_CSE_CX = os.getenv("GOOGLE_CSE_CX", "")

# Social media platforms to search
SOCIAL_PLATFORMS = {
    'facebook': {
        'site': 'facebook.com',
        'pattern': 'facebook.com'
    },
    'instagram': {
        'site': 'instagram.com',
        'pattern': 'instagram.com'
    },
    'linkedin': {
        'site': 'linkedin.com/company',
        'pattern': 'linkedin.com/company'
    },
    'twitter': {
        'site': 'twitter.com',
        'pattern': 'twitter.com'
    },
}


async def find_social_profile(company_name: str, platform: str) -> Optional[str]:
    """
    Find company profile on specific social platform
    Uses Google Custom Search with site: operator

    Returns: URL if found, None otherwise
    """
    if not GOOGLE_CSE_API_KEY or not GOOGLE_CSE_CX:
        logger.warning("Google CSE credentials not configured")
        return None

    if platform not in SOCIAL_PLATFORMS:
        return None

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            url = "https://www.googleapis.com/customsearch/v1"

            site = SOCIAL_PLATFORMS[platform]['site']
            query = f'"{company_name}" site:{site}'

            params = {
                "q": query,
                "cx": GOOGLE_CSE_CX,
                "key": GOOGLE_CSE_API_KEY,
                "num": 1
            }

            response = await client.get(url, params=params)

            if response.status_code == 200:
                data = response.json()
                items = data.get("items", [])

                if items:
                    return items[0].get("link")

            return None

    except Exception as e:
        logger.error(f"Error finding {platform} profile: {e}")
        return None


async def find_all_social_profiles(company_name: str) -> Dict[str, Optional[str]]:
    """
    Find company profiles across all major social platforms
    Searches: Facebook, Instagram, LinkedIn, Twitter

    Returns: {
        'facebook': 'url or None',
        'instagram': 'url or None',
        'linkedin': 'url or None',
        'twitter': 'url or None'
    }
    """
    profiles = {}

    # Search each platform
    for platform in ['facebook', 'instagram', 'linkedin', 'twitter']:
        try:
            profile_url = await find_social_profile(company_name, platform)
            profiles[platform] = profile_url

            # Rate limiting (optional, depends on CSE quota)
            # await asyncio.sleep(0.5)
        except Exception as e:
            logger.error(f"Error searching {platform}: {e}")
            profiles[platform] = None

    return profiles


async def validate_social_profile(url: str, timeout: int = 5) -> bool:
    """
    Check if a social media profile URL is valid/accessible

    Returns: True if URL responds with 2xx/3xx, False otherwise
    """
    if not url:
        return False

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.head(url, follow_redirects=True)
            return 200 <= response.status_code < 400
    except Exception as e:
        logger.debug(f"Social profile validation error: {e}")
        return False

"""
Website detection for Georgian companies
Free methods only — no API keys required

Methods (in order):
1. Direct domain guessing with Georgian→Latin transliteration
2. DNS resolution check
3. HTTP HEAD validation
"""

import asyncio
import logging
import os
import re
import socket
from typing import List, Optional

import httpx

logger = logging.getLogger(__name__)

# Full Georgian→Latin transliteration map (National system / ISO 9984)
GE_TO_LATIN = {
    'ა': 'a', 'ბ': 'b', 'გ': 'g', 'დ': 'd', 'ე': 'e',
    'ვ': 'v', 'ზ': 'z', 'თ': 't', 'ი': 'i', 'კ': 'k',
    'ლ': 'l', 'მ': 'm', 'ნ': 'n', 'ო': 'o', 'პ': 'p',
    'ჟ': 'zh', 'რ': 'r', 'ს': 's', 'ტ': 't', 'უ': 'u',
    'ფ': 'p', 'ქ': 'k', 'ღ': 'gh', 'ყ': 'q', 'შ': 'sh',
    'ჩ': 'ch', 'ც': 'ts', 'ძ': 'dz', 'წ': 'ts', 'ჭ': 'ch',
    'ხ': 'kh', 'ჯ': 'j', 'ჰ': 'h',
}

# Common Georgian company suffixes to strip
GE_SUFFIXES = [
    'შპს', 'სს', 'ააიპ', 'სსიპ',  # Georgian: LLC, JSC, NPO, LEPL
    'shps', 'ss',                     # transliterated
    'llc', 'ltd', 'inc', 'jsc', 'corp', 'co',  # English
]

INSECURE_SSL = os.getenv("SCRAPER_INSECURE_SSL", "false").lower() in {"1", "true", "yes", "on"}


def transliterate_georgian(text: str) -> str:
    """Convert Georgian script to Latin characters"""
    result = []
    for char in text:
        if char in GE_TO_LATIN:
            result.append(GE_TO_LATIN[char])
        else:
            result.append(char)
    return ''.join(result)


def normalize_company_name(name: str) -> List[str]:
    """
    Normalize a company name into possible domain bases.
    Handles Georgian script, English names, and mixed.
    Returns multiple candidates (e.g. with/without suffix stripping).
    """
    if not name:
        return []

    candidates = set()

    # Transliterate if Georgian
    latin_name = transliterate_georgian(name.lower().strip())

    # Also try raw lowercase (for already-Latin names)
    raw_lower = name.lower().strip()

    for variant in [latin_name, raw_lower]:
        # Strip common suffixes
        cleaned = variant
        for suffix in GE_SUFFIXES:
            # Remove suffix with optional quotes/parens around it
            cleaned = re.sub(
                rf'[\s\-"\'(]*{re.escape(suffix)}[\s\-"\'.)]*',
                ' ', cleaned
            ).strip()

        # Remove all non-alphanumeric (keep only letters and digits)
        domain_base = re.sub(r'[^a-z0-9]', '', cleaned)

        if domain_base and len(domain_base) >= 3 and not re.fullmatch(r'\d+', domain_base):
            candidates.add(domain_base[:30])

        # Also try keeping hyphens (some domains use them)
        hyphen_base = re.sub(r'[^a-z0-9\-]', '', cleaned.replace(' ', '-'))
        hyphen_base = re.sub(r'-+', '-', hyphen_base).strip('-')
        if hyphen_base and len(hyphen_base) >= 3 and hyphen_base != domain_base and not re.fullmatch(r'[\d\-]+', hyphen_base):
            candidates.add(hyphen_base[:30])

    return list(candidates)


def dns_resolve(domain: str) -> bool:
    """Check if a domain resolves via DNS (synchronous)"""
    try:
        socket.getaddrinfo(domain, 80, socket.AF_UNSPEC, socket.SOCK_STREAM)
        return True
    except (socket.gaierror, OSError):
        return False


async def check_dns(domain: str) -> bool:
    """Async wrapper for DNS resolution"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, dns_resolve, domain)


async def validate_website(url: str, timeout: int = 5) -> bool:
    """
    Validate if a URL is live and accessible.
    Returns True if URL responds with 2xx/3xx.
    """
    if not url:
        return False

    try:
        if not url.startswith(("http://", "https://")):
            url = f"https://{url}"

        async with httpx.AsyncClient(
            timeout=timeout,
            follow_redirects=True,
            verify=not INSECURE_SSL,
        ) as client:
            response = await client.head(url)
            if response.status_code == 405:
                # HEAD not allowed, try GET
                response = await client.get(url)
            return 200 <= response.status_code < 400

    except Exception:
        return False


async def find_website(company_name: str, company_id: str = "") -> dict:
    """
    Find company website using free methods:
    1. Generate domain candidates from company name (with Georgian transliteration)
    2. DNS check each candidate
    3. HTTP validate live domains

    Returns: {
        'url': found URL or None,
        'status': 'found' | 'not_found',
        'method': 'domain_guess' | None,
        'validated': bool
    }
    """
    result = {
        'url': None,
        'status': 'not_found',
        'method': None,
        'validated': False,
    }

    # Generate domain candidates
    name_bases = normalize_company_name(company_name)
    if not name_bases:
        return result

    # Build list of domains to try
    domains_to_try = []
    for base in name_bases:
        domains_to_try.extend([
            f"{base}.ge",
            f"www.{base}.ge",
            f"{base}.com.ge",
            f"{base}.com",
            f"www.{base}.com",
        ])

    # DNS check all candidates in parallel
    dns_tasks = [check_dns(domain) for domain in domains_to_try]
    dns_results = await asyncio.gather(*dns_tasks)

    # Collect domains that resolve
    live_domains = [
        domains_to_try[i]
        for i, resolved in enumerate(dns_results)
        if resolved
    ]

    if not live_domains:
        return result

    # HTTP validate the first few live domains (limit to avoid slowness)
    for domain in live_domains[:5]:
        url = f"https://{domain}"
        if await validate_website(url):
            result['url'] = url
            result['status'] = 'found'
            result['method'] = 'domain_guess'
            result['validated'] = True
            return result

        # Try http:// if https:// fails
        url_http = f"http://{domain}"
        if await validate_website(url_http):
            result['url'] = url_http
            result['status'] = 'found'
            result['method'] = 'domain_guess'
            result['validated'] = True
            return result

    # DNS resolved but HTTP failed — domain exists but site is down
    result['url'] = f"https://{live_domains[0]}"
    result['status'] = 'not_found'
    result['method'] = 'domain_guess'
    result['validated'] = False
    return result

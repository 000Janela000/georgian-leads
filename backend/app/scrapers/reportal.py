"""
reportal.ge company data scraper
Fetches company profile data from Georgia's financial reporting portal

Data available (no auth required):
- Company name, ID code, legal form
- Industry/activity sector
- Address, phone, website
- Directors (names + roles)
- Supervisory board members
- Registration date

Note: Financial statements (revenue, profit) require login — not available via scraping.
We use the company category (I-IV) from the listing as a size proxy instead.
"""

import httpx
import logging
from typing import Optional, Dict, List
from bs4 import BeautifulSoup

logger = logging.getLogger(__name__)

BASE_URL = "https://reportal.ge"


async def get_company_profile(identification_code: str) -> Optional[Dict]:
    """
    Fetch company profile from reportal.ge JSON API.
    Uses the public GetProfileData endpoint (no auth required).

    Returns dict with: name, legal_form, activity, address, phone, web,
                       directors, board_members, registration_date
    Returns None if company not found.
    """
    if not identification_code:
        return None

    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            # First load the report page to establish session
            await client.get(
                f"{BASE_URL}/en/Reports/Report?q={identification_code}"
            )

            # Fetch JSON profile data
            r = await client.get(
                f"{BASE_URL}/en/Reports/GetProfileData",
                params={"q": identification_code},
                headers={
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": f"{BASE_URL}/en/Reports/Report?q={identification_code}",
                },
            )

            if r.status_code == 404:
                return None

            r.raise_for_status()
            data = r.json()

            if not data or not data.get("id_code"):
                return None

            # Parse directors
            directors = []
            for d in data.get("directors", []):
                name = f"{d.get('FirstName', '')} {d.get('LastName', '')}".strip()
                if name:
                    directors.append({
                        "name": name,
                        "role": d.get("PersonType", ""),
                    })

            # Parse board members
            board_members = data.get("govern_boards", {}).get("eng", [])

            return {
                "identification_code": data.get("id_code", ""),
                "name": data.get("name", ""),
                "category": data.get("category", ""),
                "legal_form": data.get("form", ""),
                "activity": data.get("activity", ""),
                "address": data.get("address", ""),
                "phone": data.get("phone", ""),
                "website": data.get("web", ""),
                "registration_date": data.get("registration_date", ""),
                "directors": directors,
                "board_members": board_members,
                "governance": data.get("governance_authority", ""),
                "regulatory": data.get("regulatory", ""),
                "liquidation": data.get("liquidation", ""),
            }

    except httpx.HTTPStatusError as e:
        logger.warning(f"Reportal.ge HTTP error for {identification_code}: {e}")
        return None
    except Exception as e:
        logger.error(f"Error fetching reportal.ge profile for {identification_code}: {e}")
        return None


async def search_company_list(name: str = "", page: int = 1) -> List[Dict]:
    """
    Search the reportal.ge company listing.
    Returns list of companies with: id_code, name, category, activity, legal_form

    Note: The List endpoint returns paginated results but doesn't filter well by name.
    For best results, use get_company_profile() with a known identification_code.
    """
    try:
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=True) as client:
            # Load main page for session/cookies
            await client.get(f"{BASE_URL}/en/Reports")

            payload: Dict[str, object] = {"emitent": "1", "page": page}
            if name:
                payload["orgName"] = name

            r = await client.post(
                f"{BASE_URL}/en/Reports/List",
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "X-Requested-With": "XMLHttpRequest",
                    "Referer": f"{BASE_URL}/en/Reports",
                },
            )

            if r.status_code != 200:
                return []

            soup = BeautifulSoup(r.text, "html.parser")
            results = []

            for row in soup.select("tbody tr"):
                cells = row.find_all("td")
                if len(cells) < 5:
                    continue

                id_code = cells[0].get_text(strip=True)
                link = cells[1].find("a")
                name_text = link.get_text(strip=True) if link else cells[1].get_text(strip=True)
                category = cells[2].get_text(strip=True)
                activity = cells[3].get_text(strip=True)
                legal_form = cells[4].get_text(strip=True)

                if id_code:
                    results.append(
                        {
                            "identification_code": id_code,
                            "name": name_text,
                            "category": category,
                            "activity": activity,
                            "legal_form": legal_form,
                        }
                    )

            return results

    except Exception as e:
        logger.error(f"Error searching reportal.ge: {e}")
        return []


async def calculate_priority_score(
    revenue: Optional[float] = None,
    has_website: bool = False,
    has_social: int = 0,
    category: str = "",
) -> str:
    """
    Calculate priority score for a lead.

    Uses company category from reportal.ge as size proxy:
    - Category I: Largest companies (public interest entities)
    - Category II: Large companies
    - Category III: Medium companies
    - Category IV: Small companies

    Returns: 'high' | 'medium' | 'low'
    """
    if has_website:
        return "low"  # Has website — not a lead for web dev services

    # Use revenue if available
    if revenue is not None:
        if revenue > 500_000:
            return "high"
        elif revenue > 100_000:
            return "medium"
        else:
            return "low"

    # Use reportal.ge category as size proxy
    if category in ("I", "II"):
        return "high"
    elif category == "III":
        return "medium"
    elif category == "IV":
        return "low"

    # Unknown size — default to medium (worth trying)
    return "medium"

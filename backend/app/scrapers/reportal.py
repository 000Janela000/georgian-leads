"""
reportal.ge financial data scraper
Scrapes annual financial statements from SARAS reportal.ge
"""

import httpx
from bs4 import BeautifulSoup
import logging
from typing import Optional, Dict
import re

logger = logging.getLogger(__name__)

BASE_URL = "https://reportal.ge/en/Reports"


async def search_financial_data(company_name: str, company_id: str = "") -> Optional[Dict]:
    """
    Search for company financial data on reportal.ge

    Searches by company name or ID code.
    Returns financial summary if found.
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            # reportal.ge is a POST-based search interface
            # This would require Playwright for full JS rendering
            # For now, we'll try a simpler HTTP approach

            params = {
                'q': company_name or company_id,
                'type': 'entity'
            }

            response = await client.get(
                f"{BASE_URL}/Search",
                params=params,
                follow_redirects=True
            )

            if response.status_code != 200:
                logger.warning(f"Reportal.ge search failed for {company_name}")
                return None

            soup = BeautifulSoup(response.text, 'html.parser')

            # Try to find financial data in search results
            # Note: This is a template - actual structure depends on reportal.ge HTML
            financial_data = {
                'year': None,
                'revenue': None,
                'assets': None,
                'profit': None,
                'url': None
            }

            # Look for result links
            result_links = soup.find_all('a', class_='report-link')

            if result_links:
                # Get first result
                first_result = result_links[0]
                report_url = first_result.get('href', '')

                # Try to scrape the report
                detail = await scrape_financial_detail(report_url)
                if detail:
                    return detail

            return None

    except Exception as e:
        logger.error(f"Error searching reportal.ge: {e}")
        return None


async def scrape_financial_detail(report_url: str) -> Optional[Dict]:
    """
    Scrape detailed financial information from a company report
    Extracts: revenue, total assets, profit, year

    Note: reportal.ge uses JavaScript for rendering. For production use,
    consider using Playwright instead of httpx.
    """
    if not report_url:
        return None

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(report_url, follow_redirects=True)

            if response.status_code != 200:
                return None

            soup = BeautifulSoup(response.text, 'html.parser')

            financial_data = {
                'year': None,
                'revenue': None,
                'assets': None,
                'profit': None,
                'url': report_url
            }

            # Extract year from report
            try:
                year_elem = soup.find('span', class_='report-year')
                if year_elem:
                    year_text = year_elem.get_text(strip=True)
                    # Extract 4-digit year
                    year_match = re.search(r'\d{4}', year_text)
                    if year_match:
                        financial_data['year'] = int(year_match.group())
            except Exception as e:
                logger.debug(f"Error extracting year: {e}")

            # Extract revenue
            try:
                revenue_rows = soup.find_all('tr')
                for row in revenue_rows:
                    if 'revenue' in row.get_text(strip=True).lower():
                        cells = row.find_all('td')
                        if len(cells) >= 2:
                            revenue_text = cells[-1].get_text(strip=True)
                            revenue = parse_number(revenue_text)
                            if revenue:
                                financial_data['revenue'] = revenue
                                break
            except Exception as e:
                logger.debug(f"Error extracting revenue: {e}")

            # Extract total assets
            try:
                for row in soup.find_all('tr'):
                    if 'total assets' in row.get_text(strip=True).lower():
                        cells = row.find_all('td')
                        if len(cells) >= 2:
                            assets_text = cells[-1].get_text(strip=True)
                            assets = parse_number(assets_text)
                            if assets:
                                financial_data['assets'] = assets
                                break
            except Exception as e:
                logger.debug(f"Error extracting assets: {e}")

            # Extract profit
            try:
                for row in soup.find_all('tr'):
                    if 'profit' in row.get_text(strip=True).lower():
                        cells = row.find_all('td')
                        if len(cells) >= 2:
                            profit_text = cells[-1].get_text(strip=True)
                            profit = parse_number(profit_text)
                            if profit:
                                financial_data['profit'] = profit
                                break
            except Exception as e:
                logger.debug(f"Error extracting profit: {e}")

            return financial_data

    except Exception as e:
        logger.error(f"Error scraping financial detail: {e}")
        return None


def parse_number(text: str) -> Optional[float]:
    """
    Parse financial numbers from text
    Handles: 1,234,567.89 or 1 234 567,89 formats
    Returns float or None if parsing fails
    """
    if not text:
        return None

    try:
        # Remove currency symbols and whitespace
        text = text.strip()
        text = re.sub(r'[^\d.,\-]', '', text)

        # Handle different decimal formats
        if ',' in text and '.' in text:
            # Both present, use rightmost as decimal
            if text.rindex(',') > text.rindex('.'):
                text = text.replace('.', '').replace(',', '.')
            else:
                text = text.replace(',', '')
        elif ',' in text:
            # Only comma, might be decimal or thousands
            if text.count(',') == 1 and len(text.split(',')[1]) <= 2:
                text = text.replace(',', '.')
            else:
                text = text.replace(',', '')

        return float(text) if text else None
    except Exception as e:
        logger.debug(f"Error parsing number '{text}': {e}")
        return None


async def calculate_priority_score(
    revenue: Optional[float] = None,
    has_website: bool = False,
    has_social: int = 0
) -> str:
    """
    Calculate priority score for a lead

    Returns: 'high' | 'medium' | 'low'

    Scoring:
    - High: Revenue > 500K GEL + no website
    - Medium: Revenue 100K-500K GEL + no website or has social but no website
    - Low: Revenue < 100K or has website
    """
    if has_website:
        return 'low'  # Has website, not a lead

    if revenue is None:
        return 'medium'  # Unknown revenue, medium priority

    if revenue > 500000:  # > 500K GEL
        return 'high'
    elif revenue > 100000:  # 100K-500K GEL
        return 'medium'
    else:
        return 'low'

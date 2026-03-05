"""
companyinfo.ge scraper
Scrapes Georgian company data from companyinfo.ge
"""

import httpx
from bs4 import BeautifulSoup
import asyncio
from typing import List, Dict, Optional
from sqlalchemy.orm import Session
from app.models import Company
import logging

logger = logging.getLogger(__name__)

BASE_URL = "https://www.companyinfo.ge/en/search"


async def search_company_by_name(company_name: str) -> List[Dict]:
    """
    Search for companies by name on companyinfo.ge
    Returns list of matching companies
    """
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            params = {
                'q': company_name,
                'type': 'all'
            }

            response = await client.get(BASE_URL, params=params)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')
            companies = []

            # Parse search results
            # Note: Structure depends on actual companyinfo.ge HTML
            # This is a template - adjust selectors based on real HTML
            result_items = soup.find_all('div', class_='result-item')

            for item in result_items:
                try:
                    name_elem = item.find('h3')
                    if not name_elem:
                        continue

                    name = name_elem.get_text(strip=True)

                    # Extract link/ID if available
                    link = item.find('a')
                    company_id = link.get('href', '') if link else ''

                    # Try to extract ID from URL
                    if '/company/' in company_id:
                        company_id = company_id.split('/company/')[-1].rstrip('/')

                    companies.append({
                        'name': name,
                        'id': company_id,
                        'url': link.get('href', '') if link else ''
                    })

                except Exception as e:
                    logger.error(f"Error parsing company result: {e}")
                    continue

            return companies

    except Exception as e:
        logger.error(f"Error searching companyinfo.ge: {e}")
        return []


async def scrape_company_detail(company_id: str) -> Optional[Dict]:
    """
    Scrape detailed company information
    Returns company data dict or None
    """
    try:
        url = f"https://www.companyinfo.ge/en/company/{company_id}"

        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()

            soup = BeautifulSoup(response.text, 'html.parser')

            # Extract company data (structure depends on actual HTML)
            company_data = {
                'name': None,
                'identification_code': None,
                'legal_form': None,
                'registration_date': None,
                'address': None,
                'director_name': None,
                'shareholders': []
            }

            # Example selectors - adjust based on real HTML structure
            try:
                company_data['name'] = soup.find('h1').get_text(strip=True)
            except:
                pass

            # Extract ID code
            try:
                id_elem = soup.find('span', class_='id-code')
                if id_elem:
                    company_data['identification_code'] = id_elem.get_text(strip=True)
            except:
                pass

            # Extract legal form
            try:
                legal_form = soup.find('td', string='Legal Form')
                if legal_form:
                    company_data['legal_form'] = legal_form.find_next('td').get_text(strip=True)
            except:
                pass

            # Extract address
            try:
                address = soup.find('td', string='Address')
                if address:
                    company_data['address'] = address.find_next('td').get_text(strip=True)
            except:
                pass

            # Extract directors
            try:
                directors = soup.find_all('span', class_='director-name')
                if directors:
                    company_data['director_name'] = directors[0].get_text(strip=True)
            except:
                pass

            return company_data

    except Exception as e:
        logger.error(f"Error scraping company detail: {e}")
        return None


async def batch_update_companies(db: Session, limit: int = 10) -> dict:
    """
    Update company information for companies without recent data
    Scrapes companyinfo.ge for companies that haven't been enriched
    """
    from datetime import datetime, timedelta

    imported = 0
    updated = 0
    errors = 0

    # Get companies that haven't been enriched recently
    cutoff_date = datetime.utcnow() - timedelta(days=30)
    companies = db.query(Company).filter(
        (Company.last_enriched_at.is_(None)) |
        (Company.last_enriched_at < cutoff_date)
    ).limit(limit).all()

    for company in companies:
        try:
            # Search for company on companyinfo.ge
            search_results = await search_company_by_name(company.name_ge or company.name_en)

            if not search_results:
                errors += 1
                continue

            # Get first result
            company_id = search_results[0]['id']
            detail = await scrape_company_detail(company_id)

            if detail:
                # Update company with scraped data
                company.legal_form = detail.get('legal_form') or company.legal_form
                company.registration_date = detail.get('registration_date') or company.registration_date
                company.address = detail.get('address') or company.address
                company.director_name = detail.get('director_name') or company.director_name
                company.last_enriched_at = datetime.utcnow()

                db.commit()
                updated += 1
            else:
                errors += 1

            # Rate limiting
            await asyncio.sleep(1)

        except Exception as e:
            logger.error(f"Error updating company {company.id}: {e}")
            errors += 1

    return {
        'updated': updated,
        'errors': errors,
        'total': limit
    }

"""
Company enrichment service
Orchestrates the pipeline: website detection, social media, financial data
"""

import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Company
from app.scrapers.web_checker import find_website
from app.scrapers.social_finder import find_all_social_profiles
from app.scrapers.reportal import (
    search_financial_data,
    calculate_priority_score
)

logger = logging.getLogger(__name__)


async def enrich_company(company_id: int, db: Session) -> dict:
    """
    Enrich a single company with:
    1. Website detection (Clearbit → Google CSE → HTTP check)
    2. Social media profiles (Facebook, Instagram, LinkedIn, Twitter)
    3. Financial data (from reportal.ge)
    4. Priority scoring based on financial health + web presence

    Returns: {
        'company_id': int,
        'website_found': bool,
        'website_url': str or None,
        'social_profiles': dict,
        'financial_data': dict or None,
        'priority': 'high' | 'medium' | 'low',
        'status': 'success' | 'error',
        'message': str
    }
    """
    try:
        # Get company from database
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            return {
                'company_id': company_id,
                'status': 'error',
                'message': 'Company not found'
            }

        logger.info(f"Enriching company: {company.name_ge or company.name_en}")

        result = {
            'company_id': company_id,
            'website_found': False,
            'website_url': None,
            'social_profiles': {},
            'financial_data': None,
            'priority': 'low',
            'status': 'success',
            'message': 'Enrichment complete'
        }

        # Step 1: Find website
        logger.debug("Step 1: Finding website...")
        website_result = await find_website(
            company.name_ge or company.name_en,
            company.identification_code or ""
        )

        if website_result['status'] == 'found':
            company.website_url = website_result['url']
            company.website_status = 'found'
            result['website_found'] = True
            result['website_url'] = website_result['url']
            logger.debug(f"Website found: {website_result['url']}")
        else:
            company.website_status = 'not_found'
            logger.debug("No website found")

        # Step 2: Find social media (only if no website - companies with website don't need outreach)
        if not result['website_found']:
            logger.debug("Step 2: Finding social media profiles...")
            social_profiles = await find_all_social_profiles(
                company.name_ge or company.name_en
            )

            # Update company with found profiles
            company.facebook_url = social_profiles.get('facebook')
            company.instagram_url = social_profiles.get('instagram')
            company.linkedin_url = social_profiles.get('linkedin')

            result['social_profiles'] = {
                k: v for k, v in social_profiles.items() if v is not None
            }
            logger.debug(f"Social profiles found: {result['social_profiles']}")

        # Step 3: Get financial data
        logger.debug("Step 3: Fetching financial data...")
        financial_data = await search_financial_data(
            company.name_ge or company.name_en,
            company.identification_code or ""
        )

        if financial_data:
            company.financial_year = financial_data.get('year')
            company.revenue_gel = financial_data.get('revenue')
            company.total_assets_gel = financial_data.get('assets')
            company.profit_gel = financial_data.get('profit')
            company.financial_data_json = financial_data

            result['financial_data'] = financial_data
            logger.debug(f"Financial data found: {financial_data}")

        # Step 4: Calculate priority score
        logger.debug("Step 4: Calculating priority score...")
        priority = await calculate_priority_score(
            revenue=company.revenue_gel,
            has_website=result['website_found'],
            has_social=len(result['social_profiles'])
        )

        company.priority = priority
        result['priority'] = priority

        # Update enrichment timestamp
        company.last_enriched_at = datetime.utcnow()

        # Commit changes
        db.commit()
        logger.info(f"Company {company_id} enriched successfully")

        return result

    except Exception as e:
        logger.error(f"Error enriching company {company_id}: {e}")
        return {
            'company_id': company_id,
            'status': 'error',
            'message': str(e)
        }


async def enrich_batch(company_ids: list, db: Session) -> dict:
    """
    Enrich multiple companies
    Rate-limited to prevent API throttling

    Returns: {
        'total': int,
        'successful': int,
        'failed': int,
        'results': [enrich_company results]
    }
    """
    results = []
    successful = 0
    failed = 0

    for idx, company_id in enumerate(company_ids):
        try:
            logger.info(f"Enriching {idx+1}/{len(company_ids)}")

            result = await enrich_company(company_id, db)
            results.append(result)

            if result['status'] == 'success':
                successful += 1
            else:
                failed += 1

            # Rate limiting: 1 second between requests to avoid API throttling
            if idx < len(company_ids) - 1:
                await asyncio.sleep(1)

        except Exception as e:
            logger.error(f"Error in batch enrichment at index {idx}: {e}")
            failed += 1
            results.append({
                'company_id': company_id,
                'status': 'error',
                'message': str(e)
            })

    return {
        'total': len(company_ids),
        'successful': successful,
        'failed': failed,
        'results': results
    }


async def enrich_leads(limit: int = 50, db: Session = None) -> dict:
    """
    Enrich companies marked as leads (no website)
    Prioritizes by financial size

    Returns summary of enrichment results
    """
    if not db:
        return {'error': 'Database session required'}

    try:
        # Get companies without websites, sorted by revenue
        companies = db.query(Company).filter(
            Company.website_status == 'not_found',
            Company.status == 'active'
        ).order_by(
            Company.revenue_gel.desc().nullslast()
        ).limit(limit).all()

        company_ids = [c.id for c in companies]

        if not company_ids:
            return {'message': 'No leads to enrich', 'count': 0}

        result = await enrich_batch(company_ids, db)
        result['message'] = f"Enriched {result['successful']} leads"

        return result

    except Exception as e:
        logger.error(f"Error enriching leads: {e}")
        return {'error': str(e)}

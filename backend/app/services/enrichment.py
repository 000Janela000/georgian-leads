"""
Company enrichment service
All-free pipeline: website detection, reportal.ge profile, social media, scoring
No API keys required.
"""

import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import Company
from app.scrapers.web_checker import find_website
from app.scrapers.social_finder import find_all_social_profiles
from app.scrapers.reportal import get_company_profile, calculate_priority_score

logger = logging.getLogger(__name__)


async def enrich_company(company_id: int, db: Session) -> dict:
    """
    Enrich a single company with (all free, no API keys):
    1. Website detection (DNS + HTTP, Georgian transliteration)
    2. Reportal.ge profile (company info, directors, contact data, category)
    3. Social media (Facebook, Instagram — direct URL checks)
    4. Priority scoring (category-based + web presence)
    """
    try:
        company = db.query(Company).filter(Company.id == company_id).first()
        if not company:
            return {'company_id': company_id, 'status': 'error', 'message': 'Company not found'}

        company_name = company.name_ge or company.name_en
        logger.info(f"Enriching: {company_name} (ID: {company.identification_code})")

        result = {
            'company_id': company_id,
            'website_found': False,
            'website_url': None,
            'social_profiles': {},
            'reportal_data': None,
            'priority': 'medium',
            'status': 'success',
            'message': 'Enrichment complete'
        }

        category = ""

        # Step 1: Website detection (DNS + HTTP check, free)
        try:
            logger.info(f"  [1/4] Website check for {company_name}...")
            website_result = await find_website(
                company_name,
                company.identification_code or ""
            )
            if website_result['status'] == 'found':
                company.website_url = website_result['url']
                company.website_status = 'found'
                result['website_found'] = True
                result['website_url'] = website_result['url']
                logger.info(f"  Website found: {website_result['url']}")
            else:
                company.website_status = 'not_found'
                logger.info(f"  No website found")
        except Exception as e:
            logger.warning(f"  Website check failed: {e}")
            company.website_status = 'not_found'

        # Step 2: Reportal.ge profile (company data, directors, contact info)
        if company.identification_code:
            try:
                logger.info(f"  [2/4] Fetching reportal.ge profile...")
                profile = await get_company_profile(company.identification_code)
                if profile:
                    # Update company with reportal data
                    if profile.get("website") and not company.website_url:
                        company.website_url = profile["website"]
                        company.website_status = 'found'
                        result['website_found'] = True
                        result['website_url'] = profile["website"]
                        logger.info(f"  Website from reportal: {profile['website']}")

                    if profile.get("address") and not company.address:
                        company.address = profile["address"]

                    if profile.get("directors") and not company.director_name:
                        first_director = profile["directors"][0]["name"] if profile["directors"] else ""
                        if first_director:
                            company.director_name = first_director

                    if profile.get("legal_form") and not company.legal_form:
                        company.legal_form = profile["legal_form"]

                    # Store full profile as financial data JSON
                    company.financial_data_json = profile
                    result['reportal_data'] = profile
                    category = profile.get("category", "")
                    logger.info(f"  Reportal profile loaded (activity: {profile.get('activity', 'N/A')})")
                else:
                    logger.info(f"  No reportal.ge profile found")
            except Exception as e:
                logger.warning(f"  Reportal.ge fetch failed: {e}")
        else:
            logger.info(f"  [2/4] Skipping reportal (no ID code)")

        # Step 3: Social media (Facebook, Instagram — free URL checks)
        if not result['website_found']:
            try:
                logger.info(f"  [3/4] Checking social media...")
                social_profiles = await find_all_social_profiles(company_name)
                company.facebook_url = social_profiles.get('facebook')
                company.instagram_url = social_profiles.get('instagram')
                result['social_profiles'] = {k: v for k, v in social_profiles.items() if v}
                if result['social_profiles']:
                    logger.info(f"  Social found: {list(result['social_profiles'].keys())}")
                else:
                    logger.info(f"  No social profiles found")
            except Exception as e:
                logger.warning(f"  Social check failed: {e}")
        else:
            logger.info(f"  [3/4] Skipping social (has website)")

        # Step 4: Priority scoring
        logger.info(f"  [4/4] Calculating priority...")
        priority = await calculate_priority_score(
            revenue=company.revenue_gel,
            has_website=result['website_found'],
            has_social=len(result['social_profiles']),
            category=category,
        )
        company.priority = priority
        result['priority'] = priority

        company.last_enriched_at = datetime.utcnow()
        db.commit()
        logger.info(f"  Done: priority={priority}")

        return result

    except Exception as e:
        logger.error(f"Error enriching company {company_id}: {e}")
        return {'company_id': company_id, 'status': 'error', 'message': str(e)}


async def enrich_batch(company_ids: list, db: Session) -> dict:
    """
    Enrich multiple companies with rate limiting.
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

            # Rate limiting: 1 second between companies
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
    Enrich companies that haven't been enriched yet.
    Prioritizes by revenue (if known), then by ID.
    """
    if not db:
        return {'error': 'Database session required'}

    try:
        companies = db.query(Company).filter(
            Company.website_status.in_(['unknown', 'not_found']),
            Company.status == 'active'
        ).order_by(
            Company.revenue_gel.desc().nullslast()
        ).limit(limit).all()

        company_ids = [c.id for c in companies]

        if not company_ids:
            logger.info("No leads to enrich (all already enriched)")
            return {'message': 'No leads to enrich', 'results': [], 'count': 0}

        logger.info(f"Found {len(company_ids)} companies to enrich")
        result = await enrich_batch(company_ids, db)
        result['message'] = f"Enriched {result['successful']} leads"

        return result

    except Exception as e:
        logger.error(f"Error enriching leads: {e}")
        return {'error': str(e)}

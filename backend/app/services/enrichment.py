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
from app.scrapers.reportal import get_company_profile
from app.services.lead_scoring import apply_scoring_to_company
from app.services.source_meta import set_source_meta, ensure_financial_data_dict

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
            'score': 0,
            'offer_lane': 'landing_page',
            'revenue_type': 'unknown',
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
                set_source_meta(
                    company,
                    key="website_source",
                    source="domain_validation",
                    confidence="high",
                )
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
        # Only query reportal if we have a real Georgian ID (9-digit number).
        # ge-coreg-* IDs are OpenSanctions internal UUIDs — reportal always 404s on them.
        ic = company.identification_code or ""
        has_real_id = bool(ic) and not ic.startswith("ge-") and ic.isdigit()
        if has_real_id:
            try:
                logger.info(f"  [2/4] Fetching reportal.ge profile...")
                profile = await get_company_profile(ic)
                if profile:
                    # Update company with reportal data
                    if profile.get("website") and not company.website_url:
                        company.website_url = profile["website"]
                        company.website_status = 'found'
                        set_source_meta(
                            company,
                            key="website_source",
                            source="reportal_public_profile",
                            confidence="high",
                        )
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

                    # Merge reportal data into financial_data_json
                    data = ensure_financial_data_dict(company)
                    for k, v in profile.items():
                        data[k] = v
                    company.financial_data_json = data
                    set_source_meta(
                        company,
                        key="profile_source",
                        source="reportal_public_profile",
                        confidence="high",
                    )
                    if profile.get("category"):
                        set_source_meta(
                            company,
                            key="revenue_source",
                            source="reportal_category_estimate",
                            confidence="medium",
                        )
                    result['reportal_data'] = profile
                    category = profile.get("category", "")
                    logger.info(f"  Reportal profile loaded (activity: {profile.get('activity', 'N/A')})")
                else:
                    logger.info(f"  No reportal.ge profile found")
            except Exception as e:
                logger.warning(f"  Reportal.ge fetch failed: {e}")
        else:
            logger.info(f"  [2/4] Skipping reportal (no real Georgian ID — have: {ic!r})")

        # Step 3: Social media (Facebook, Instagram — free URL checks)
        if not result['website_found']:
            try:
                logger.info(f"  [3/4] Checking social media...")
                social_profiles = await find_all_social_profiles(company_name)
                company.facebook_url = social_profiles.get('facebook')
                company.instagram_url = social_profiles.get('instagram')
                result['social_profiles'] = {k: v for k, v in social_profiles.items() if v}
                if result['social_profiles']:
                    set_source_meta(
                        company,
                        key="social_source",
                        source="facebook_instagram_validation",
                        confidence="medium",
                        extra={
                            "validation": "strict_v2",
                            "platforms": sorted(result["social_profiles"].keys()),
                        },
                    )
                    logger.info(f"  Social found: {list(result['social_profiles'].keys())}")
                else:
                    logger.info(f"  No social profiles found")
            except Exception as e:
                logger.warning(f"  Social check failed: {e}")
        else:
            logger.info(f"  [3/4] Skipping social (has website)")

        # Step 4: Priority scoring
        logger.info(f"  [4/4] Calculating priority...")
        scoring = apply_scoring_to_company(company, contact_badge="never_contacted")
        result['score'] = scoring['score']
        result['offer_lane'] = scoring['offer_lane']
        result['revenue_type'] = scoring['revenue_type']

        if scoring['score'] >= 120:
            company.priority = "high"
        elif scoring['score'] >= 100:
            company.priority = "medium"
        else:
            company.priority = "low"
        result['priority'] = company.priority

        company.last_enriched_at = datetime.utcnow()
        db.commit()
        logger.info(f"  Done: priority={company.priority}, score={scoring['score']}")

        return result

    except Exception as e:
        logger.error(f"Error enriching company {company_id}: {e}")
        return {'company_id': company_id, 'status': 'error', 'message': str(e)}


async def enrich_batch(company_ids: list, db: Session, progress_callback=None) -> dict:
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

            if progress_callback:
                progress_callback(
                    {
                        "processed": idx + 1,
                        "total": len(company_ids),
                        "successful": successful,
                        "failed": failed,
                        "company_id": company_id,
                    }
                )

            # Rate limiting: keep small delay to avoid hammering endpoints.
            if idx < len(company_ids) - 1:
                await asyncio.sleep(0.2)

        except Exception as e:
            logger.error(f"Error in batch enrichment at index {idx}: {e}")
            failed += 1
            results.append({
                'company_id': company_id,
                'status': 'error',
                'message': str(e)
            })
            if progress_callback:
                progress_callback(
                    {
                        "processed": idx + 1,
                        "total": len(company_ids),
                        "successful": successful,
                        "failed": failed,
                        "company_id": company_id,
                    }
                )

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

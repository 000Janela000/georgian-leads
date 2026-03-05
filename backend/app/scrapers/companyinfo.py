"""
TI Georgia company registry data importer
Downloads pre-scraped JSON from Transparency International Georgia's GitHub
Source: https://github.com/tigeorgia/corporate-data

Contains: company names, IDs, legal forms, directors, shareholders, relationships
Much richer than OpenSanctions and doesn't require scraping an Angular SPA.
"""

import httpx
import json
import logging
from typing import Dict, List, Optional
from sqlalchemy.orm import Session
from app.models import Company
from datetime import datetime

logger = logging.getLogger(__name__)

# TI Georgia GitHub raw URLs for corporate data
TI_GEORGIA_BASE = "https://raw.githubusercontent.com/tigeorgia/corporate-data/master"
TI_CORP_URL = f"{TI_GEORGIA_BASE}/corporations.json"


async def download_ti_georgia_json(url: str = TI_CORP_URL) -> List[Dict]:
    """
    Download TI Georgia corporate data JSON from GitHub.
    Returns list of company dicts.
    """
    try:
        async with httpx.AsyncClient(timeout=120.0) as client:
            logger.info(f"Downloading TI Georgia data from {url}...")
            r = await client.get(url)
            r.raise_for_status()

            data = r.json()
            if isinstance(data, list):
                logger.info(f"Downloaded {len(data)} records")
                return data
            elif isinstance(data, dict):
                # Some files wrap data in a key
                for key in ("corporations", "data", "results"):
                    if key in data and isinstance(data[key], list):
                        logger.info(f"Downloaded {len(data[key])} records (from '{key}' key)")
                        return data[key]
                # Single record
                return [data]

            return []

    except httpx.HTTPStatusError as e:
        logger.error(f"HTTP error downloading TI Georgia data: {e}")
        return []
    except Exception as e:
        logger.error(f"Error downloading TI Georgia data: {e}")
        return []


def parse_ti_georgia_company(record: Dict) -> Optional[Dict]:
    """
    Parse a single TI Georgia corporation record into our company format.

    TI Georgia format varies but typically includes:
    - identification_code / id / reg_number
    - name (Georgian and/or English)
    - legal_form
    - address
    - directors (list of names)
    - shareholders (list)
    - registration_date
    """
    if not record:
        return None

    # Try multiple field names for identification code
    id_code = (
        record.get("identification_code")
        or record.get("id_code")
        or record.get("reg_number")
        or record.get("registration_number")
        or record.get("id")
    )

    # Try multiple field names for company name
    name = (
        record.get("name")
        or record.get("name_ge")
        or record.get("company_name")
        or record.get("title")
    )

    if not id_code or not name:
        return None

    # Ensure id_code is string
    id_code = str(id_code).strip()
    if not id_code:
        return None

    # Extract directors
    directors = record.get("directors", [])
    if isinstance(directors, str):
        directors = [directors]
    director_name = directors[0] if directors else record.get("director", "")

    # Extract shareholders
    shareholders = record.get("shareholders", [])
    if isinstance(shareholders, str):
        shareholders = [{"name": shareholders}]

    return {
        "identification_code": id_code,
        "name_ge": str(name).strip(),
        "name_en": str(record.get("name_en", "") or "").strip() or None,
        "legal_form": record.get("legal_form", "") or record.get("form", ""),
        "address": record.get("address", ""),
        "director_name": str(director_name).strip() if director_name else None,
        "shareholders": shareholders if shareholders else None,
        "registration_date": record.get("registration_date", "") or record.get("founded", ""),
        "status": record.get("status", "active"),
    }


async def import_ti_georgia(db: Session, url: str = TI_CORP_URL) -> Dict:
    """
    Download and import TI Georgia corporate data.
    Merges with existing companies by identification_code.

    Returns: {imported, updated, skipped, errors, total}
    """
    records = await download_ti_georgia_json(url)
    if not records:
        return {"imported": 0, "updated": 0, "skipped": 0, "errors": 0, "total": 0}

    imported = 0
    updated = 0
    skipped = 0
    errors = 0

    for i, record in enumerate(records):
        try:
            parsed = parse_ti_georgia_company(record)
            if not parsed:
                skipped += 1
                continue

            # Check if company already exists
            existing = db.query(Company).filter(
                Company.identification_code == parsed["identification_code"]
            ).first()

            if existing:
                # Merge: update fields that are empty in existing record
                changed = False
                if not existing.name_ge and parsed.get("name_ge"):
                    existing.name_ge = parsed["name_ge"]
                    changed = True
                if not existing.name_en and parsed.get("name_en"):
                    existing.name_en = parsed["name_en"]
                    changed = True
                if not existing.legal_form and parsed.get("legal_form"):
                    existing.legal_form = parsed["legal_form"]
                    changed = True
                if not existing.address and parsed.get("address"):
                    existing.address = parsed["address"]
                    changed = True
                if not existing.director_name and parsed.get("director_name"):
                    existing.director_name = parsed["director_name"]
                    changed = True
                if not existing.shareholders_json and parsed.get("shareholders"):
                    existing.shareholders_json = parsed["shareholders"]
                    changed = True
                if not existing.registration_date and parsed.get("registration_date"):
                    existing.registration_date = parsed["registration_date"]
                    changed = True

                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                # Create new company
                company = Company(
                    name_ge=parsed["name_ge"],
                    name_en=parsed.get("name_en"),
                    identification_code=parsed["identification_code"],
                    legal_form=parsed.get("legal_form"),
                    address=parsed.get("address"),
                    director_name=parsed.get("director_name"),
                    shareholders_json=parsed.get("shareholders"),
                    registration_date=parsed.get("registration_date"),
                    status="active",
                    website_status="unknown",
                    lead_status="new",
                )
                db.add(company)
                imported += 1

            # Commit every 500 records
            if (imported + updated) % 500 == 0 and (imported + updated) > 0:
                db.commit()
                logger.info(f"  Progress: {i+1}/{len(records)} processed, {imported} imported, {updated} updated")

        except Exception as e:
            errors += 1
            if errors <= 5:
                logger.warning(f"Error processing TI Georgia record: {e}")

    # Final commit
    db.commit()
    logger.info(f"TI Georgia import complete: {imported} imported, {updated} updated, {skipped} skipped, {errors} errors")

    return {
        "imported": imported,
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
        "total": len(records),
    }


async def import_ti_georgia_file(file_path: str, db: Session) -> Dict:
    """
    Import TI Georgia data from a local JSON file (for manual upload).
    Supports both JSON array and JSONL formats.
    """
    records = []
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read().strip()
            if content.startswith("["):
                records = json.loads(content)
            else:
                # JSONL format
                for line in content.split("\n"):
                    line = line.strip()
                    if line:
                        records.append(json.loads(line))
    except Exception as e:
        raise ValueError(f"Failed to parse file: {e}")

    if not records:
        return {"imported": 0, "updated": 0, "skipped": 0, "errors": 0, "total": 0}

    # Reuse the same import logic
    imported = 0
    updated = 0
    skipped = 0
    errors = 0

    for record in records:
        try:
            parsed = parse_ti_georgia_company(record)
            if not parsed:
                skipped += 1
                continue

            existing = db.query(Company).filter(
                Company.identification_code == parsed["identification_code"]
            ).first()

            if existing:
                changed = False
                if not existing.director_name and parsed.get("director_name"):
                    existing.director_name = parsed["director_name"]
                    changed = True
                if not existing.shareholders_json and parsed.get("shareholders"):
                    existing.shareholders_json = parsed["shareholders"]
                    changed = True
                if not existing.legal_form and parsed.get("legal_form"):
                    existing.legal_form = parsed["legal_form"]
                    changed = True
                if not existing.address and parsed.get("address"):
                    existing.address = parsed["address"]
                    changed = True

                if changed:
                    updated += 1
                else:
                    skipped += 1
            else:
                company = Company(
                    name_ge=parsed["name_ge"],
                    name_en=parsed.get("name_en"),
                    identification_code=parsed["identification_code"],
                    legal_form=parsed.get("legal_form"),
                    address=parsed.get("address"),
                    director_name=parsed.get("director_name"),
                    shareholders_json=parsed.get("shareholders"),
                    registration_date=parsed.get("registration_date"),
                    status="active",
                    website_status="unknown",
                    lead_status="new",
                )
                db.add(company)
                imported += 1

            if (imported + updated) % 500 == 0 and (imported + updated) > 0:
                db.commit()

        except Exception as e:
            errors += 1

    db.commit()
    return {
        "imported": imported,
        "updated": updated,
        "skipped": skipped,
        "errors": errors,
        "total": len(records),
    }

"""
OpenSanctions Georgian Company Registry importer
Loads bulk JSON data from OpenSanctions
Format: https://www.opensanctions.org/datasets/ext_ge_company_registry/
"""

import json
from typing import Callable, Optional
from sqlalchemy.orm import Session
from app.models import Company
from app.services.source_meta import set_source_meta


def _first(props: dict, *keys: str):
    for key in keys:
        value = props.get(key)
        if isinstance(value, list) and value:
            first = value[0]
            if first is not None and str(first).strip():
                return str(first).strip()
        elif value is not None and str(value).strip():
            return str(value).strip()
    return None


def _normalize_status(raw_status: Optional[str]) -> str:
    if not raw_status:
        return "active"

    normalized = raw_status.strip().lower()
    inactive_markers = [
        "liquid",
        "დახურული",
        "ლიკვიდ",
        "გაუქმ",
        "terminated",
        "inactive",
    ]
    if any(marker in normalized for marker in inactive_markers):
        return "liquidated"
    return "active"


def import_opensanctions_json(file_path: str, db: Session) -> dict:
    """
    Import companies from OpenSanctions JSON file

    Expected format: FollowTheMoney entity format
    {
      "id": "...",
      "schema": "Company",
      "properties": {
        "name": ["Company Name"],
        "registrationNumber": ["123456"],
        "address": ["Address"],
        "foundedDate": ["2020-01-01"],
        ...
      }
    }
    """
    return import_opensanctions_json_with_progress(file_path, db)


def import_opensanctions_json_with_progress(
    file_path: str,
    db: Session,
    progress_callback: Optional[Callable[[dict], None]] = None,
    commit_every: int = 5000,
) -> dict:
    imported = 0
    updated = 0
    skipped = 0
    errors = 0
    ignored_non_company = 0
    processed = 0

    existing_codes = {
        row[0]
        for row in db.query(Company.identification_code)
        .filter(Company.identification_code.isnot(None))
        .all()
    }

    def _emit_progress():
        if progress_callback:
            progress_callback(
                {
                    "processed": processed,
                    "imported": imported,
                    "updated": updated,
                    "skipped": skipped,
                    "ignored_non_company": ignored_non_company,
                    "errors": errors,
                }
            )

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                processed += 1

                try:
                    entity = json.loads(line)

                    # Only process Company entities
                    if entity.get('schema') != 'Company':
                        ignored_non_company += 1
                        continue

                    props = entity.get('properties', {})

                    # Extract data with safety checks
                    name = _first(props, "name", "caption") or entity.get("caption")
                    reg_number = (
                        _first(
                            props,
                            "registrationNumber",
                            "companyNumber",
                            "idNumber",
                            "taxNumber",
                        )
                        or entity.get("id")
                    )
                    address = _first(props, "address")
                    founded = _first(props, "incorporationDate", "foundedDate")
                    legal_form = _first(props, "legalForm")
                    raw_status = _first(props, "status")

                    # Skip if no name or registration number
                    if not name or not reg_number:
                        skipped += 1
                        if processed % 5000 == 0:
                            _emit_progress()
                        continue

                    # Skip duplicates by cached ID set for performance
                    if reg_number in existing_codes:
                        skipped += 1
                        if processed % 5000 == 0:
                            _emit_progress()
                        continue

                    # Create new company
                    company = Company(
                        name_ge=name,
                        identification_code=str(reg_number),
                        legal_form=legal_form,
                        status=_normalize_status(raw_status),
                        address=address,
                        registration_date=founded,
                        website_status='unknown',
                        lead_status='new'
                    )
                    set_source_meta(
                        company,
                        key="registry_source",
                        source="opensanctions",
                        confidence="high",
                    )
                    db.add(company)
                    existing_codes.add(str(reg_number))
                    imported += 1

                    if imported % commit_every == 0:
                        db.commit()
                    if processed % 5000 == 0:
                        _emit_progress()

                except json.JSONDecodeError:
                    errors += 1
                    if processed % 5000 == 0:
                        _emit_progress()
                except Exception as e:
                    errors += 1
                    print(f"Error processing entity: {e}")
                    if processed % 5000 == 0:
                        _emit_progress()

        # Final commit
        db.commit()
        _emit_progress()

    except FileNotFoundError:
        raise ValueError(f"File not found: {file_path}")
    except Exception as e:
        raise ValueError(f"Import failed: {str(e)}")

    return {
        'imported': imported,
        'updated': updated,
        'skipped': skipped,
        'ignored_non_company': ignored_non_company,
        'errors': errors,
        'total': imported + updated + skipped + errors
    }


def parse_opensanctions_company(entity: dict) -> dict:
    """Parse a single OpenSanctions entity into company data"""
    props = entity.get('properties', {})

    return {
        'name_ge': _first(props, "name") or entity.get("caption"),
        'identification_code': _first(
            props,
            "registrationNumber",
            "companyNumber",
            "idNumber",
            "taxNumber",
        ) or entity.get("id"),
        'legal_form': _first(props, "legalForm"),
        'address': _first(props, "address"),
        'registration_date': _first(props, "incorporationDate", "foundedDate"),
        'director_name': (props.get('directorName') or [None])[0],
        'status': _normalize_status(_first(props, "status")),
    }

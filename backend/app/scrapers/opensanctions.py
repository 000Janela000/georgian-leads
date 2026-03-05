"""
OpenSanctions Georgian Company Registry importer
Loads bulk JSON data from OpenSanctions
Format: https://www.opensanctions.org/datasets/ext_ge_company_registry/
"""

import json
from sqlalchemy.orm import Session
from app.models import Company
from datetime import datetime


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
    imported = 0
    skipped = 0
    errors = 0

    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue

                try:
                    entity = json.loads(line)

                    # Only process Company entities
                    if entity.get('schema') != 'Company':
                        skipped += 1
                        continue

                    props = entity.get('properties', {})

                    # Extract data with safety checks
                    name = (props.get('name') or [None])[0]
                    reg_number = (props.get('registrationNumber') or [None])[0]
                    address = (props.get('address') or [None])[0]
                    founded = (props.get('foundedDate') or [None])[0]

                    # Skip if no name or registration number
                    if not name or not reg_number:
                        skipped += 1
                        continue

                    # Check if company already exists
                    existing = db.query(Company).filter(
                        Company.identification_code == reg_number
                    ).first()

                    if existing:
                        skipped += 1
                        continue

                    # Create new company
                    company = Company(
                        name_ge=name,
                        identification_code=reg_number,
                        address=address,
                        registration_date=founded,
                        status='active',
                        website_status='unknown',
                        lead_status='new'
                    )
                    db.add(company)
                    imported += 1

                    # Commit every 100 records for performance
                    if imported % 100 == 0:
                        db.commit()

                except json.JSONDecodeError:
                    errors += 1
                except Exception as e:
                    errors += 1
                    print(f"Error processing entity: {e}")

        # Final commit
        db.commit()

    except FileNotFoundError:
        raise ValueError(f"File not found: {file_path}")
    except Exception as e:
        raise ValueError(f"Import failed: {str(e)}")

    return {
        'imported': imported,
        'skipped': skipped,
        'errors': errors,
        'total': imported + skipped + errors
    }


def parse_opensanctions_company(entity: dict) -> dict:
    """Parse a single OpenSanctions entity into company data"""
    props = entity.get('properties', {})

    return {
        'name_ge': (props.get('name') or [None])[0],
        'identification_code': (props.get('registrationNumber') or [None])[0],
        'legal_form': (props.get('legalForm') or [None])[0],
        'address': (props.get('address') or [None])[0],
        'registration_date': (props.get('foundedDate') or [None])[0],
        'director_name': (props.get('directorName') or [None])[0],
        'status': 'active'
    }

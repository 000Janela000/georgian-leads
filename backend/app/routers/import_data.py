from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.scrapers.opensanctions import import_opensanctions_json
from app.scrapers.companyinfo import batch_update_companies
from pydantic import BaseModel
import tempfile
import os

router = APIRouter()


class ImportResponse(BaseModel):
    imported: int
    skipped: int
    errors: int
    total: int
    message: str


@router.post("/opensanctions", response_model=ImportResponse)
async def import_opensanctions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Import companies from OpenSanctions JSON file

    Expected format: JSONL (one JSON object per line)
    Download from: https://www.opensanctions.org/datasets/ext_ge_company_registry/
    """
    try:
        # Save uploaded file to temp location
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jsonl') as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            # Import data
            result = import_opensanctions_json(tmp_path, db)

            return ImportResponse(
                imported=result['imported'],
                skipped=result['skipped'],
                errors=result['errors'],
                total=result['total'],
                message=f"Successfully imported {result['imported']} companies"
            )
        finally:
            # Clean up temp file
            os.unlink(tmp_path)

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@router.post("/update-from-companyinfo", response_model=dict)
async def update_from_companyinfo(
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    Update company information from companyinfo.ge

    Scrapes companies that haven't been enriched in the last 30 days.
    Limit: how many companies to update in this request (default: 10)
    """
    try:
        result = await batch_update_companies(db, limit=limit)
        return {
            **result,
            "message": f"Updated {result['updated']} companies"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Update failed: {str(e)}")

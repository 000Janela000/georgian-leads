from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.database import get_db
from app.scrapers.opensanctions import import_opensanctions_json
from app.scrapers.companyinfo import import_ti_georgia, import_ti_georgia_file
from pydantic import BaseModel
from typing import Optional
import tempfile
import os
import logging
import httpx

logger = logging.getLogger(__name__)

router = APIRouter()

OPENSANCTIONS_URL = "https://data.opensanctions.org/datasets/latest/ge_company_registry/entities.ftm.json"


class ImportResponse(BaseModel):
    imported: int
    skipped: int
    errors: int
    total: int
    message: str
    updated: Optional[int] = None


@router.post("/opensanctions", response_model=ImportResponse)
async def import_opensanctions(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import companies from uploaded OpenSanctions JSONL file"""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jsonl') as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            result = import_opensanctions_json(tmp_path, db)
            return ImportResponse(
                imported=result['imported'],
                skipped=result['skipped'],
                errors=result['errors'],
                total=result['total'],
                message=f"Successfully imported {result['imported']} companies"
            )
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@router.post("/opensanctions-auto", response_model=ImportResponse)
async def import_opensanctions_auto(db: Session = Depends(get_db)):
    """
    Auto-fetch and import companies from OpenSanctions Georgian company registry.
    Downloads directly from the public API — no file upload needed.
    """
    try:
        logger.info("Auto-fetch: Downloading from OpenSanctions registry...")
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jsonl', mode='wb') as tmp:
            tmp_path = tmp.name
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("GET", OPENSANCTIONS_URL) as resp:
                    resp.raise_for_status()
                    async for chunk in resp.aiter_bytes(chunk_size=8192):
                        tmp.write(chunk)

        logger.info("Download complete. Parsing and importing...")
        try:
            result = import_opensanctions_json(tmp_path, db)
            logger.info(f"Auto-fetch done: {result['imported']} imported, {result['skipped']} skipped")
            return ImportResponse(
                imported=result['imported'],
                skipped=result['skipped'],
                errors=result['errors'],
                total=result['total'],
                message=f"Fetched and imported {result['imported']} companies from registry"
            )
        finally:
            os.unlink(tmp_path)
    except httpx.HTTPError as e:
        raise HTTPException(status_code=502, detail=f"Failed to download from OpenSanctions: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


@router.post("/ti-georgia", response_model=ImportResponse)
async def import_ti_georgia_endpoint(db: Session = Depends(get_db)):
    """
    Download and import company data from TI Georgia GitHub.
    Enriches existing companies with directors, shareholders, legal form data.
    Also imports new companies not yet in the database.
    """
    try:
        logger.info("TI Georgia: Downloading corporate data from GitHub...")
        result = await import_ti_georgia(db)
        logger.info(
            f"TI Georgia done: {result['imported']} imported, "
            f"{result['updated']} updated, {result['skipped']} skipped"
        )
        return ImportResponse(
            imported=result['imported'],
            skipped=result['skipped'],
            errors=result['errors'],
            total=result['total'],
            updated=result['updated'],
            message=f"TI Georgia: {result['imported']} imported, {result['updated']} updated"
        )
    except Exception as e:
        logger.error(f"TI Georgia import failed: {e}")
        raise HTTPException(status_code=400, detail=f"TI Georgia import failed: {str(e)}")


@router.post("/ti-georgia-upload", response_model=ImportResponse)
async def import_ti_georgia_upload(
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """Import company data from uploaded TI Georgia JSON file"""
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.json') as tmp:
            content = await file.read()
            tmp.write(content)
            tmp_path = tmp.name

        try:
            result = await import_ti_georgia_file(tmp_path, db)
            return ImportResponse(
                imported=result['imported'],
                skipped=result['skipped'],
                errors=result['errors'],
                total=result['total'],
                updated=result['updated'],
                message=f"TI Georgia file: {result['imported']} imported, {result['updated']} updated"
            )
        finally:
            os.unlink(tmp_path)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Import failed: {str(e)}")


class PipelineRequest(BaseModel):
    enrich_limit: int = 20


class PipelineResponse(BaseModel):
    import_result: ImportResponse
    enrich_message: str


@router.post("/full-pipeline", response_model=PipelineResponse)
async def full_pipeline(
    request: PipelineRequest = PipelineRequest(),
    db: Session = Depends(get_db)
):
    """
    Full pipeline: auto-fetch from OpenSanctions + enrich new leads.
    One-click to populate and enrich the database.
    """
    from app.services.enrichment import enrich_leads

    # Step 1: Auto-fetch
    logger.info("Pipeline Step 1/2: Downloading from OpenSanctions registry...")
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix='.jsonl', mode='wb') as tmp:
            tmp_path = tmp.name
            async with httpx.AsyncClient(timeout=120.0) as client:
                async with client.stream("GET", OPENSANCTIONS_URL) as resp:
                    resp.raise_for_status()
                    async for chunk in resp.aiter_bytes(chunk_size=8192):
                        tmp.write(chunk)

        logger.info("Download complete. Parsing and importing...")
        try:
            import_result = import_opensanctions_json(tmp_path, db)
        finally:
            os.unlink(tmp_path)
        logger.info(f"Import done: {import_result['imported']} imported, {import_result['skipped']} skipped, {import_result['errors']} errors")
    except Exception as e:
        logger.error(f"Import step failed: {e}")
        raise HTTPException(status_code=400, detail=f"Import step failed: {str(e)}")

    # Step 2: Enrich
    logger.info(f"Pipeline Step 2/2: Enriching up to {request.enrich_limit} leads...")
    enrich_msg = "Enrichment skipped"
    try:
        enrich_result = await enrich_leads(limit=request.enrich_limit, db=db)
        enriched_count = len(enrich_result.get('results', []))
        enrich_msg = f"Enriched {enriched_count} companies"
        logger.info(enrich_msg)
    except Exception as e:
        enrich_msg = f"Enrichment failed: {str(e)}"
        logger.error(f"Enrichment failed: {e}")

    return PipelineResponse(
        import_result=ImportResponse(
            imported=import_result['imported'],
            skipped=import_result['skipped'],
            errors=import_result['errors'],
            total=import_result['total'],
            message=f"Imported {import_result['imported']} companies"
        ),
        enrich_message=enrich_msg
    )

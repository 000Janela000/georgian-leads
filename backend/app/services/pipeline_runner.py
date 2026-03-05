import asyncio
import logging
import os
import tempfile
import threading
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime
from typing import Dict, Optional

import httpx

from app.database import SessionLocal
from app.models import Company, PipelineRun
from app.scrapers.companyinfo import import_ti_georgia
from app.scrapers.opensanctions import import_opensanctions_json_with_progress
from app.services.contact_status import get_contact_status_map
from app.services.lead_scoring import apply_scoring_to_company
from app.services.source_meta import set_source_meta

logger = logging.getLogger(__name__)

OPENSANCTIONS_URL = "https://data.opensanctions.org/datasets/latest/ge_company_registry/entities.ftm.json"

_executor = ThreadPoolExecutor(max_workers=1)
_submit_lock = threading.Lock()

def _update_run(
    run_id: int,
    *,
    status: Optional[str] = None,
    progress_pct: Optional[int] = None,
    current_step: Optional[str] = None,
    counters_json: Optional[Dict] = None,
    error_text: Optional[str] = None,
    started_at: Optional[datetime] = None,
    finished_at: Optional[datetime] = None,
) -> None:
    db = SessionLocal()
    try:
        run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
        if not run:
            return

        if status is not None:
            run.status = status
        if progress_pct is not None:
            run.progress_pct = max(0, min(progress_pct, 100))
        if current_step is not None:
            run.current_step = current_step
        if counters_json is not None:
            run.counters_json = counters_json
        if error_text is not None:
            run.error_text = error_text
        if started_at is not None:
            run.started_at = started_at
        if finished_at is not None:
            run.finished_at = finished_at

        db.commit()
    finally:
        db.close()


def _download_opensanctions() -> str:
    with tempfile.NamedTemporaryFile(delete=False, suffix=".jsonl", mode="wb") as tmp:
        tmp_path = tmp.name
        with httpx.Client(timeout=180.0, follow_redirects=True) as client:
            with client.stream("GET", OPENSANCTIONS_URL) as resp:
                resp.raise_for_status()
                for chunk in resp.iter_bytes(chunk_size=16384):
                    tmp.write(chunk)
    return tmp_path


def _run_pipeline(run_id: int, enrich_limit: int = 100) -> None:
    counters: Dict = {
        "opensanctions": {},
        "ti_georgia": {},
        "enrichment": {
            "targeted": 0,
            "processed": 0,
            "successful": 0,
            "failed": 0,
        },
        "scoring": {
            "scored": 0,
            "full_website": 0,
            "landing_page": 0,
        },
    }

    _update_run(
        run_id,
        status="running",
        progress_pct=1,
        current_step="Starting pipeline",
        counters_json=counters,
        started_at=datetime.utcnow(),
    )

    db = SessionLocal()
    tmp_path = None
    try:
        _update_run(run_id, progress_pct=10, current_step="Importing OpenSanctions registry")
        tmp_path = _download_opensanctions()

        def _on_opensanctions_progress(snapshot: Dict) -> None:
            counters["opensanctions"] = snapshot
            processed = int(snapshot.get("processed", 0))
            # Visible increments every 5k rows: 10 -> 34
            pct = 10 + min(24, processed // 5000)
            _update_run(
                run_id,
                progress_pct=pct,
                current_step=f"Importing OpenSanctions registry ({processed:,} rows)",
                counters_json=counters,
            )

        opensanctions_result = import_opensanctions_json_with_progress(
            tmp_path,
            db,
            progress_callback=_on_opensanctions_progress,
        )
        counters["opensanctions"] = opensanctions_result
        _update_run(run_id, progress_pct=35, counters_json=counters)

        _update_run(run_id, progress_pct=40, current_step="Importing TI Georgia registry")
        ti_result = asyncio.run(import_ti_georgia(db))
        counters["ti_georgia"] = ti_result
        _update_run(run_id, progress_pct=55, counters_json=counters)

        _update_run(run_id, progress_pct=58, current_step="Enriching companies")
        enrich_query = db.query(Company).filter(Company.status == "active").order_by(Company.id.asc())
        if enrich_limit > 0:
            enrich_query = enrich_query.limit(enrich_limit)
        company_ids = [c.id for c in enrich_query.all()]
        counters["enrichment"]["targeted"] = len(company_ids)

        if company_ids:
            from app.services.enrichment import enrich_batch

            def _on_enrichment_progress(snapshot: Dict) -> None:
                processed = int(snapshot.get("processed", 0))
                total = max(1, int(snapshot.get("total", len(company_ids))))
                counters["enrichment"]["processed"] = processed
                counters["enrichment"]["successful"] = int(snapshot.get("successful", 0))
                counters["enrichment"]["failed"] = int(snapshot.get("failed", 0))
                progress = 58 + int((processed / total) * 22)
                _update_run(
                    run_id,
                    progress_pct=progress,
                    current_step=f"Enriching companies ({processed}/{total})",
                    counters_json=counters,
                )

            batch_result = asyncio.run(
                enrich_batch(company_ids, db, progress_callback=_on_enrichment_progress)
            )
            counters["enrichment"]["processed"] = batch_result.get("total", len(company_ids))
            counters["enrichment"]["successful"] = batch_result.get("successful", 0)
            counters["enrichment"]["failed"] = batch_result.get("failed", 0)
            _update_run(run_id, progress_pct=80, counters_json=counters)

        _update_run(run_id, progress_pct=82, current_step="Scoring leads and offer lanes")
        active_companies = db.query(Company).filter(Company.status == "active").all()
        contact_map = get_contact_status_map(db, days=30, company_ids=[c.id for c in active_companies])
        for company in active_companies:
            badge = contact_map.get(company.id, "never_contacted")
            scoring = apply_scoring_to_company(company, badge)
            if scoring["revenue_type"] == "exact":
                set_source_meta(
                    company,
                    key="revenue_source",
                    source="trusted_numeric_financial",
                    confidence="high",
                )
            elif scoring["revenue_type"] == "estimated":
                set_source_meta(
                    company,
                    key="revenue_source",
                    source="reportal_category_estimate",
                    confidence="medium",
                )

            if scoring["score"] >= 120:
                company.priority = "high"
            elif scoring["score"] >= 100:
                company.priority = "medium"
            else:
                company.priority = "low"

            counters["scoring"]["scored"] += 1
            if scoring["offer_lane"] == "full_website":
                counters["scoring"]["full_website"] += 1
            else:
                counters["scoring"]["landing_page"] += 1

        db.commit()
        _update_run(
            run_id,
            status="done",
            progress_pct=100,
            current_step="Pipeline complete",
            counters_json=counters,
            finished_at=datetime.utcnow(),
        )
    except Exception as exc:
        logger.exception("Pipeline run failed: %s", exc)
        _update_run(
            run_id,
            status="error",
            current_step="Pipeline failed",
            error_text=str(exc),
            counters_json=counters,
            finished_at=datetime.utcnow(),
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
        db.close()


def start_pipeline_run(enrich_limit: int = 100) -> PipelineRun:
    with _submit_lock:
        db = SessionLocal()
        try:
            active = db.query(PipelineRun).filter(PipelineRun.status.in_(["queued", "running"])).first()
            if active:
                db.expunge(active)
                return active

            run = PipelineRun(
                status="queued",
                progress_pct=0,
                current_step="Queued",
                counters_json={},
            )
            db.add(run)
            db.commit()
            db.refresh(run)
            run_id = run.id
            db.expunge(run)
        finally:
            db.close()

        _executor.submit(_run_pipeline, run_id, enrich_limit)
        return run


def mark_stale_pipeline_runs() -> int:
    """
    Mark queued/running runs as error during app startup (process restart safety).
    """
    db = SessionLocal()
    try:
        stale = db.query(PipelineRun).filter(PipelineRun.status.in_(["queued", "running"])).all()
        if not stale:
            return 0

        now = datetime.utcnow()
        for run in stale:
            run.status = "error"
            run.error_text = "Interrupted by server restart"
            run.current_step = "Interrupted"
            run.finished_at = now
        db.commit()
        return len(stale)
    finally:
        db.close()

from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import PipelineRun
from app.schemas import PipelineRunResponse
from app.services.pipeline_runner import start_pipeline_run

router = APIRouter()


class StartPipelineRequest(BaseModel):
    enrich_limit: int = Field(default=100, ge=1, le=5000)
    skip_steps: List[str] = Field(default_factory=list)


@router.post("/runs", response_model=PipelineRunResponse)
def create_pipeline_run(
    request: StartPipelineRequest = StartPipelineRequest(),
):
    run = start_pipeline_run(enrich_limit=request.enrich_limit, skip_steps=request.skip_steps)
    return run


@router.get("/runs/latest", response_model=PipelineRunResponse)
def get_latest_pipeline_run(db: Session = Depends(get_db)):
    run = db.query(PipelineRun).order_by(PipelineRun.created_at.desc()).first()
    if not run:
        raise HTTPException(status_code=404, detail="No pipeline runs yet")
    return run


@router.get("/runs/{run_id}", response_model=PipelineRunResponse)
def get_pipeline_run(run_id: int, db: Session = Depends(get_db)):
    run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Pipeline run not found")
    return run

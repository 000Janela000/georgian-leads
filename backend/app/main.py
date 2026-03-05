import os
import logging
from dotenv import load_dotenv
from fastapi import FastAPI

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db, SessionLocal
from app.routers import companies, outreach, templates, stats, import_data, settings
from app.services.templates import seed_default_templates

load_dotenv()

app = FastAPI(
    title="Georgian Leads API",
    description="B2B outreach platform for Georgian companies",
    version="0.1.0"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize database
init_db()

# Seed default templates on startup
@app.on_event("startup")
def startup_event():
    db = SessionLocal()
    try:
        seed_default_templates(db)
    finally:
        db.close()

# Include routers
app.include_router(companies.router, prefix="/api/companies", tags=["companies"])
app.include_router(outreach.router, prefix="/api/outreach", tags=["outreach"])
app.include_router(templates.router, prefix="/api/templates", tags=["templates"])
app.include_router(stats.router, prefix="/api/stats", tags=["stats"])
app.include_router(import_data.router, prefix="/api/import", tags=["import"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])


@app.get("/")
def read_root():
    return {
        "message": "Georgian Leads API",
        "version": "0.1.0",
        "docs": "/docs"
    }


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

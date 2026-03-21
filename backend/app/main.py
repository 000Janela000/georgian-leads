import logging
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.routers import leads, discover, settings

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
    datefmt="%H:%M:%S",
)

load_dotenv()

app = FastAPI(
    title="LeadScout API",
    description="Discover Georgian businesses without websites via Google Maps + Facebook enrichment",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_db()

app.include_router(leads.router, prefix="/api/leads", tags=["leads"])
app.include_router(discover.router, prefix="/api/discover", tags=["discover"])
app.include_router(settings.router, prefix="/api/settings", tags=["settings"])


@app.get("/")
def read_root():
    return {"message": "LeadScout API", "version": "1.0.0", "docs": "/docs"}


@app.get("/health")
def health_check():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

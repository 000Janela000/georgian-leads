from sqlalchemy import create_engine
from sqlalchemy import text
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool
import os
from pathlib import Path

# Create data directory if it doesn't exist
DATA_DIR = Path(__file__).parent.parent / "data"
DATA_DIR.mkdir(exist_ok=True)

DB_PATH = str(DATA_DIR / "leads.db")
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{DB_PATH}")

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    _apply_sqlite_migrations()


def _apply_sqlite_migrations():
    """Best-effort local sqlite migrations for additive schema changes."""
    if not str(engine.url).startswith("sqlite"):
        return

    expected_columns = {
        "companies": {
            "lead_score": "INTEGER DEFAULT 0",
            "offer_lane": "VARCHAR(50) DEFAULT 'landing_page'",
            "revenue_type": "VARCHAR(50) DEFAULT 'unknown'",
            "phone": "VARCHAR(100)",
            "email": "VARCHAR(255)",
            "country": "VARCHAR(50) DEFAULT 'GE'",
            "source": "VARCHAR(50) DEFAULT 'registry'",
            "category": "VARCHAR(100)",
        },
    }

    with engine.begin() as conn:
        for table_name, column_defs in expected_columns.items():
            rows = conn.execute(text(f"PRAGMA table_info({table_name})")).fetchall()
            existing = {row[1] for row in rows}
            for column_name, ddl_type in column_defs.items():
                if column_name not in existing:
                    conn.execute(
                        text(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {ddl_type}")
                    )

        rows = conn.execute(text("PRAGMA user_version")).fetchone()
        db_version = rows[0] if rows else 0

        if db_version < 1:
            # Clear social URLs that were guessed from name transliteration (false positives).
            conn.execute(text(
                "UPDATE companies SET facebook_url = NULL, instagram_url = NULL "
                "WHERE source = 'georgia_registry'"
            ))
            conn.execute(text("PRAGMA user_version = 1"))

        if db_version < 2:
            # Rename legacy source values to new canonical names.
            conn.execute(text("UPDATE companies SET source = 'registry' WHERE source = 'georgia_registry'"))
            conn.execute(text("UPDATE companies SET source = 'local' WHERE source = 'osm'"))
            conn.execute(text("PRAGMA user_version = 2"))

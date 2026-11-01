from pathlib import Path
from sqlalchemy import inspect
from sqlmodel import create_engine, SQLModel, Session
from app.core.config import settings

engine = create_engine(settings.DATABASE_URL, echo=True)

# En la imagen de Render los .sql se copian a /app/database (ver backend/Dockerfile.render)
SEED_DIR = Path(__file__).resolve().parents[2] / "database"

def seed_if_empty():
    # Docker local los carga con init.sql de Postgres; en hostings sin eso se cargan aquí la primera vez
    if not SEED_DIR.exists() or inspect(engine).has_table("person"):
        return
    raw = engine.raw_connection()
    try:
        with raw.cursor() as cursor:
            for name in ("init.sql", "add_requirements.sql"):
                cursor.execute((SEED_DIR / name).read_text(encoding="utf-8"))
        raw.commit()
    finally:
        raw.close()

def create_db_and_tables():
    seed_if_empty()
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session

"""SQLAlchemy engine, session factory, and declarative base."""

from sqlalchemy import create_engine, event
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import DATABASE_URL

# ── Engine ───────────────────────────────────────────────
engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},  # required for SQLite + threads
    echo=False,
)


# Enable SQLite foreign-key enforcement (off by default)
@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


# ── Session factory ──────────────────────────────────────
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


# ── Base class ───────────────────────────────────────────
class Base(DeclarativeBase):
    pass


# ── Dependency ───────────────────────────────────────────
def get_db():
    """FastAPI dependency that yields a DB session and closes it after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def create_tables():
    """Import all models and create tables. Safe to call multiple times."""
    import app.models  # noqa: F401 — triggers model registration with Base
    Base.metadata.create_all(bind=engine)

    # Auto-seed default admin users & demo data if database is empty
    db = SessionLocal()
    try:
        from app.models.user import User
        if db.query(User).count() == 0:
            from app.services.auth_service import hash_password
            admin1 = User(username="admin", password_hash=hash_password("admin123"))
            admin2 = User(username="admin@gmail.com", password_hash=hash_password("admin123"))
            db.add(admin1)
            db.add(admin2)
            db.commit()
            print("Auto-seeded default admin & admin@gmail.com users.")
            
            # Import seed logic to populate demo hosted zones if empty
            try:
                import seed
                seed.seed()
            except Exception as se:
                print(f"Auto-seed demo zones note: {se}")
    except Exception as e:
        db.rollback()
        print(f"Auto-seed check: {e}")
    finally:
        db.close()

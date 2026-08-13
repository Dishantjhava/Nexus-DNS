"""Shared test fixtures — in-memory SQLite, TestClient, and auth helpers."""

import pytest
from fastapi.testclient import TestClient
from passlib.hash import bcrypt
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.database import Base, get_db
from app.main import app
from app.models import User  # noqa: F401 — registers all models with Base

# ── Test engine (in-memory SQLite) ───────────────────────

_engine = create_engine(
    "sqlite://",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)


@event.listens_for(_engine, "connect")
def _set_sqlite_pragma(dbapi_conn, _conn_record):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


_TestSession = sessionmaker(autocommit=False, autoflush=False, bind=_engine)


# ── Fixtures ─────────────────────────────────────────────

@pytest.fixture(autouse=True)
def _reset_tables():
    """Create all tables before each test, drop them after."""
    Base.metadata.create_all(bind=_engine)
    yield
    Base.metadata.drop_all(bind=_engine)


@pytest.fixture()
def db():
    """Yield a test DB session."""
    session = _TestSession()
    try:
        yield session
    finally:
        session.close()


@pytest.fixture()
def client(db):
    """TestClient wired to the test database."""
    def _override():
        try:
            yield db
        finally:
            pass  # db fixture handles close

    app.dependency_overrides[get_db] = _override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def seed_user(db):
    """Insert a test user (testuser / testpass) and return the model."""
    user = User(username="testuser", password_hash=bcrypt.hash("testpass"))
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture()
def auth_client(client, seed_user):
    """A TestClient that is already logged in as ``testuser``."""
    resp = client.post(
        "/api/auth/login",
        json={"username": "testuser", "password": "testpass"},
    )
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return client

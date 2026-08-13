"""Authentication service — session creation, lookup, and teardown.

Token flow:
  1.  ``create_session``  generates ``secrets.token_urlsafe(32)`` → raw token
  2.  SHA-256 hash is stored in ``sessions.token_hash``
  3.  Raw token is set in the HttpOnly cookie by the router
  4.  On every request the dependency hashes the cookie value and
      calls ``get_user_by_token`` to look up the session row.
"""

import hashlib
import hmac
import secrets
from datetime import datetime, timedelta

from passlib.hash import bcrypt
from sqlalchemy.orm import Session as DBSession

from app.config import SECRET_KEY, SESSION_TTL_HOURS
from app.models.session import Session
from app.models.user import User


# ── Helpers ──────────────────────────────────────────────

def _hash_token(raw_token: str) -> str:
    """HMAC-SHA256 hex-digest of raw session token keyed by SECRET_KEY."""
    return hmac.new(SECRET_KEY.encode(), raw_token.encode(), hashlib.sha256).hexdigest()


# ── Public API ───────────────────────────────────────────

def authenticate_user(
    db: DBSession, username: str, password: str
) -> User | None:
    """Verify credentials.  Returns the ``User`` if valid, ``None`` otherwise."""
    user = db.query(User).filter(User.username == username).first()
    if user is None or not bcrypt.verify(password, user.password_hash):
        return None
    return user


def create_session(db: DBSession, user_id: int) -> str:
    """Create a DB session row and return the **raw** token (for the cookie)."""
    raw_token = secrets.token_urlsafe(32)
    session = Session(
        user_id=user_id,
        token_hash=_hash_token(raw_token),
        expires_at=datetime.utcnow() + timedelta(hours=SESSION_TTL_HOURS),
    )
    db.add(session)
    db.commit()
    return raw_token


def get_user_by_token(db: DBSession, raw_token: str | None) -> User | None:
    """Look up a non-expired session and return its owner, or ``None``."""
    if not raw_token:
        return None
    token_hash = _hash_token(raw_token)
    session = (
        db.query(Session)
        .filter(Session.token_hash == token_hash)
        .first()
    )
    if session is None:
        return None
    if session.expires_at < datetime.utcnow():
        db.delete(session)
        db.commit()
        return None
    return session.user


def delete_session(db: DBSession, raw_token: str | None) -> None:
    """Remove the session associated with *raw_token* (logout)."""
    if not raw_token:
        return
    token_hash = _hash_token(raw_token)
    session = (
        db.query(Session)
        .filter(Session.token_hash == token_hash)
        .first()
    )
    if session:
        db.delete(session)
        db.commit()

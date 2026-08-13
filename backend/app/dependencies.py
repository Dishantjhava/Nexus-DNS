"""Shared FastAPI dependencies."""

from fastapi import Depends, Request
from sqlalchemy.orm import Session as DBSession

from app.config import COOKIE_NAME
from app.database import get_db
from app.exceptions import AppException
from app.models.user import User
from app.services import auth_service


def get_current_user(
    request: Request,
    db: DBSession = Depends(get_db),
) -> User:
    """Require a valid, non-expired session cookie.

    Reads the ``session_token`` cookie, hashes it, looks up the session,
    checks expiry, and returns the owning User.  Raises 401 otherwise.
    """
    token = request.cookies.get(COOKIE_NAME)
    user = auth_service.get_user_by_token(db, token)
    if user is None:
        raise AppException(401, "UNAUTHORIZED", "Not authenticated")
    return user

"""Auth router — login, logout, and session introspection."""

from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy.orm import Session as DBSession

from app.config import COOKIE_NAME, IS_PRODUCTION, SESSION_TTL_HOURS
from app.database import get_db
from app.dependencies import get_current_user
from app.exceptions import AppException
from app.models.user import User
from app.schemas.auth import LoginRequest, UserResponse
from app.services import auth_service

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login")
def login(
    body: LoginRequest,
    request: Request,
    response: Response,
    db: DBSession = Depends(get_db),
):
    """Authenticate and set a session cookie."""
    user = auth_service.authenticate_user(db, body.username, body.password)
    if user is None:
        raise AppException(401, "INVALID_CREDENTIALS", "Invalid username or password")

    raw_token = auth_service.create_session(db, user.id)
    is_secure = IS_PRODUCTION or (request.url.scheme == "https" and "localhost" not in request.url.netloc and "127.0.0.1" not in request.url.netloc and "testserver" not in request.url.netloc)

    response.set_cookie(
        key=COOKIE_NAME,
        value=raw_token,
        max_age=SESSION_TTL_HOURS * 3600,
        httponly=True,
        samesite="none" if is_secure else "lax",
        secure=is_secure,
        path="/",
    )

    return UserResponse.model_validate(user)


@router.post("/logout")
def logout(
    request: Request,
    response: Response,
    db: DBSession = Depends(get_db),
):
    """Invalidate the current session and clear the cookie."""
    token = request.cookies.get(COOKIE_NAME)
    auth_service.delete_session(db, token)
    is_secure = IS_PRODUCTION or (request.url.scheme == "https" and "localhost" not in request.url.netloc and "127.0.0.1" not in request.url.netloc and "testserver" not in request.url.netloc)
    response.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        samesite="none" if is_secure else "lax",
        secure=is_secure,
    )
    return {"message": "Logged out"}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    """Return the currently authenticated user."""
    return UserResponse.model_validate(user)

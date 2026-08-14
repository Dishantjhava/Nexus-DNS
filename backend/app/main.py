"""FastAPI application entry-point.

Run with:
    uvicorn app.main:app --reload --port 8000
"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import CORS_ORIGINS
from app.database import create_tables
from app.exceptions import AppException
from app.routers import auth, hosted_zones, dns_records

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("nexus_dns")


# ── Lifespan ─────────────────────────────────────────────

@asynccontextmanager
async def lifespan(_app: FastAPI):
    """Create tables on startup (idempotent)."""
    create_tables()
    yield


# ── App ──────────────────────────────────────────────────

app = FastAPI(
    title="Nexus DNS",
    description="Route 53 Clone — DNS Management Console",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Middleware ───────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_origin_regex=r"https://.*\.railway\.app|http://localhost:\d+|https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Exception handlers ──────────────────────────────────

@app.exception_handler(AppException)
async def app_exception_handler(_request: Request, exc: AppException):
    """Convert AppException → standard error envelope."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": {"code": exc.code, "message": exc.message}},
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(_request: Request, exc: RequestValidationError):
    """Convert FastAPI/Pydantic validation errors → standard error envelope."""
    errors = exc.errors()
    messages = []
    for err in errors:
        loc = " -> ".join(str(l) for l in err.get("loc", []) if l != "body")
        msg = err.get("msg", "Invalid value")
        messages.append(f"{loc}: {msg}" if loc else msg)

    full_msg = "; ".join(messages) if messages else "Validation failed"
    return JSONResponse(
        status_code=422,
        content={"error": {"code": "VALIDATION_ERROR", "message": full_msg}},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    """Catch-all for unhandled exceptions — logs error and returns generic 500 envelope."""
    logger.error("Unhandled server error: %s", exc, exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": {"code": "INTERNAL_ERROR", "message": "An internal server error occurred"}},
    )


# ── Health Check ──────────────────────────────────────────

@app.get("/health")
@app.get("/")
async def health_check():
    """Health check endpoint for Railway deployment monitoring."""
    return {"status": "ok", "service": "Nexus DNS API"}


# ── Routers ──────────────────────────────────────────────

app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(dns_records.router)


"""Application configuration."""

import os
from pathlib import Path
from dotenv import load_dotenv

# ── Paths ────────────────────────────────────────────────
BASE_DIR = Path(__file__).resolve().parent.parent

# Load .env if present
load_dotenv(BASE_DIR / ".env")

# ── Database ─────────────────────────────────────────────
DATABASE_URL = os.environ.get("DATABASE_URL", f"sqlite:///{BASE_DIR / 'nexus_dns.db'}")

# ── Auth / Sessions ─────────────────────────────────────
SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")
SESSION_TTL_HOURS = int(os.environ.get("SESSION_TTL_HOURS", "24"))
COOKIE_NAME = os.environ.get("COOKIE_NAME", "session_token")

# ── CORS ─────────────────────────────────────────────────
cors_raw = os.environ.get("CORS_ORIGINS", "http://localhost:3000")
CORS_ORIGINS = [origin.strip() for origin in cors_raw.split(",") if origin.strip()]

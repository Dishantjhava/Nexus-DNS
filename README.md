# Nexus DNS — AWS Route53 Web Application Clone

A full-stack, pixel-accurate clone of the **AWS Route53 Management Console** built with Next.js (TypeScript), FastAPI, and SQLite. This application recreates the exact user experience, navigation, forms, table density, system record rules, and workflows of Route53.

---

## 📸 Key Features & UI Fidelity

- **Route53 Visual Language**: Built with the official **Cloudscape Design System** visual tokens (`#232F3E` navy header, `#EC7211` orange buttons, `#0972D3` blue accents, `#F2F3F3` container backgrounds, 13px base typography).
- **Full-Page Workflows**: Recreates full-page `Create hosted zone` and `Create record` workflows matching official AWS Console screenshots.
- **Hosted Zone Management**:
  - Full CRUD functionality with pagination, debounced search, and URL parameter state.
  - Opaque Route53-style public zone IDs (e.g. `Z8F4K2M7Q1P3X`).
  - Edit description workflow with read-only domain name and type.
  - Type-to-confirm zone deletion dialog.
- **DNS Record Management**:
  - Full CRUD support for 9 DNS record types (`A`, `AAAA`, `CNAME`, `TXT`, `MX`, `NS`, `PTR`, `SRV`, `CAA`) plus system `SOA`.
  - Multi-line record value rendering (e.g. 4-nameserver NS sets and SOA strings).
  - Type-aware record value parsing and validation.
  - TTL quick shortcuts: `1m` (60s), `1h` (3600s), `1d` (86400s).
  - Multi-record creation with sequential execution and per-record partial error reporting.
  - "View existing records" drawer on record creation page.
- **System Record Protection**:
  - Auto-generates default system `NS` and `SOA` records on zone creation (`is_system = True`).
  - Newly created zones start with **Records (2)**.
  - Both frontend and backend enforce 403 `SYSTEM_RECORD_PROTECTED` rules blocking modification or deletion of system records.
- **Authentication**: Session-cookie-based authentication with IAM sign-in style interface and central 401 expiration handling.

---

## 🛠 Tech Stack

- **Frontend**: Next.js 15 (TypeScript, App Router, Tailwind CSS v4)
- **Backend**: FastAPI (Python 3.10+, Pydantic v2, Passlib/bcrypt)
- **Database**: SQLite (SQLAlchemy 2.0 ORM with `PRAGMA foreign_keys=ON`)

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ and pip

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate  # On Windows

# Install dependencies
pip install -r requirements.txt

# Seed database (creates admin user, 5 zones, 48 records)
python seed.py

# Run FastAPI dev server
uvicorn app.main:app --reload --port 8000
```
FastAPI interactive docs will be live at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Next.js dev server
npm run dev
```
Web Application will be live at: `http://localhost:3000`

### 3. Demo Credentials
- **Username**: `admin`
- **Password**: `admin123`

---

## 🗄 Database Schema

```
Users (id, username, password_hash, created_at, updated_at)
  │
  └──< Sessions (id, token, user_id, expires_at, created_at)

HostedZones (id, public_zone_id, name, description, zone_type, created_at, updated_at)
  │
  └──< DnsRecords (id, hosted_zone_id, name, type, ttl, values_json, is_system, created_at, updated_at)
```

---

## 📡 API Endpoints Overview

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/login` | Sign in & receive `session_token` cookie |
| `POST` | `/api/auth/logout` | Clear session cookie |
| `GET` | `/api/auth/me` | Fetch active user session details |
| `GET` | `/api/hosted-zones` | List zones (supports `page`, `page_size`, `search`) |
| `POST` | `/api/hosted-zones` | Create new hosted zone (auto-creates NS + SOA) |
| `GET` | `/api/hosted-zones/{id}` | Get zone details with `record_count` |
| `PATCH` | `/api/hosted-zones/{id}` | Update zone description |
| `DELETE` | `/api/hosted-zones/{id}` | Delete zone and cascade records |
| `GET` | `/api/hosted-zones/{id}/records` | List records (supports `type`, `search`, `page`) |
| `POST` | `/api/hosted-zones/{id}/records` | Create DNS record |
| `GET` | `/api/hosted-zones/{id}/records/{recId}` | Get single record details |
| `PATCH` | `/api/hosted-zones/{id}/records/{recId}` | Update non-system record |
| `DELETE` | `/api/hosted-zones/{id}/records/{recId}` | Delete non-system record |

---

## 🧪 Automated Testing

To run the 48 automated pytest suites:
```bash
cd backend
.\venv\Scripts\activate
python -m pytest tests/ -v
```
All 48 tests pass cleanly covering authentication, hosted zone CRUD, DNS record type validation, and system record protection.

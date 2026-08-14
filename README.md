# Nexus-DNS — AWS Route 53 Console Clone 🌐

[![Next.js](https://img.shields.io/badge/Next.js-16.3.0-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Cloudscape](https://img.shields.io/badge/Cloudscape-Design_System-FF9900?logo=amazon-aws)](https://cloudscape.design/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?logo=python)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-3178C6?logo=typescript)](https://typescriptlang.org)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

> A full-stack, pixel-accurate clone of the **AWS Route 53 Management Console** built using Next.js (App Router), FastAPI, and SQLite. Features full Hosted Zone & DNS Record CRUD, system record protection (`NS` & `SOA`), interactive dark theme mode, record testing DIG outputs, and CloudWatch query logging workflows.

---

## 1. 🚀 Live Demo

- **Frontend Console URL**: [https://nexus-dns.up.railway.app](https://nexus-dns.up.railway.app)
- **Backend API URL**: [https://nexus-dns-production.up.railway.app](https://nexus-dns-production.up.railway.app)
- **API Swagger Documentation**: [https://nexus-dns-production.up.railway.app/docs](https://nexus-dns-production.up.railway.app/docs)

---

## 2. 🔑 Demo Credentials

Use the following credentials to sign in directly on the live demo or local environment:

| Field | Value |
|---|---|
| **Email / User** | `admin@gmail.com` *(or `admin`)* |
| **Password** | `admin123` |

> 💡 *Note: The login screen also features a one-click **"Copy credentials"** button that automatically pre-fills these test credentials.*

---

## 3. 🎯 Quick Demo Guide for Evaluators

Follow this 10-step sequence to test all major features end-to-end:

1. **Open the Live Demo**: Go to [https://nexus-dns.up.railway.app](https://nexus-dns.up.railway.app).
2. **Sign In**: Click **Copy credentials** ➔ Click **Sign in**.
3. **View Hosted Zones**: Navigate to **Hosted zones** in the left sidebar to inspect public and private zones.
4. **Create a Hosted Zone**: Click **Create hosted zone**, enter `mycompany.com`, choose **Public hosted zone**, and submit.
5. **Verify System Records**: Open `mycompany.com` zone details to verify that **Records (2)** (`NS` and `SOA`) were auto-created.
6. **Create a Custom DNS Record**: Click **Create record**, select `A` record, input record name `app`, TTL `300` (or click `1m` shortcut), enter value `192.0.2.45`, and submit.
7. **Filter & Search Records**: Use the Record Type filter dropdown (`A`, `NS`, `SOA`) and search bar to filter records.
8. **Inspect Record SplitPanel**: Click on any record row to open the side split panel inspector.
9. **Test System Record Protection**: Try editing or deleting an `NS` or `SOA` system record to verify the **403 Forbidden** protection banner.
10. **Explore Themes & Logout**: Toggle between **Dark** and **Light** mode using the top nav switcher, then click **Sign out** in the top right user menu.

---

## 4. 📌 Overview

**Nexus-DNS** is designed to replicate the exact visual design system, navigation density, and system record behavior of AWS Route 53:

- **AWS Cloudscape UI Language**: Uses official Cloudscape design tokens (`#232F3E` navy header, `#EC7211` orange primary buttons, `#0972D3` / `#539FE5` blue accents, `#162232` dark navy containers).
- **System Record Invariants**: Auto-creates `NS` and `SOA` records on zone creation and blocks their modification/deletion across both UI and backend APIs.
- **Persistent State & Real-time Persistence**: Uses SQLite with SQLAlchemy 2.0 ORM to persist all CRUD operations instantly.

---

## 5. ⚡ Features

### 🔐 Authentication & Session Security
- Cookie-based authentication (`session_token`) with 24-hour expiration.
- Auto-redirects unauthenticated users to `/login`.
- Session protection preventing browser "Back" button access to cached state after logout.

### 🌐 Hosted Zones CRUD
- **Create**: Opaque zone IDs (e.g. `Z01928347F`), domain validation, duplicate name checking (HTTP 409 Conflict).
- **List & Search**: Paginated table view, debounced search, public/private badge indicators.
- **Delete**: Confirmation modal requiring manual typing of `delete` before confirming.

### 📝 DNS Records CRUD & Protection
- **Supported Record Types**: `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SOA`, `PTR`, `SRV`, `CAA`.
- **System Record Protection**: System `NS` and `SOA` records cannot be edited or deleted (returns 403 Forbidden).
- **TTL Presets**: `1m` (60s), `1h` (3600s), `1d` (86400s) preset shortcuts with positive integer validation.

### 🔍 Search, Filters & SplitPanel
- Property filtering by **Record Type**, **Routing Policy**, and **Alias**.
- Side-by-side **SplitPanel** inspector for inspecting record parameters.

### 🏷️ Hosted Zone Tags
- Full tag CRUD modal (**ManageTagsModal**) supporting persistent key-value tags.

### 🧪 Test Record & Query Logging
- **Test Record**: Interactive DNS test simulation (`/test-record`) generating formatted DIG resolver outputs.
- **Query Logging**: CloudWatch log group configuration page (`/configure-query-logging`).

### 🌙 Dual Theme Mode (Light & Dark)
- Seamless Light and Dark mode toggle powered by Cloudscape `applyMode(Mode.Dark)`.

---

## 6. 🏗️ Tech Stack

- **Frontend**: Next.js 16.3.0 (React 19, TypeScript, Tailwind CSS v4, `@cloudscape-design/components`)
- **Backend**: FastAPI (Python 3.10+, Pydantic v2, Passlib/bcrypt)
- **Database**: SQLite (SQLAlchemy 2.0 ORM with `PRAGMA foreign_keys=ON`)
- **Deployment**: Railway (Nixpacks & Docker containers)

---

## 7. 📐 Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Browser (Next.js 16 Frontend)              │
│        Cloudscape UI + ThemeContext + AuthContext       │
└────────────────────────────┬────────────────────────────┘
                             │ REST API (JSON + HttpOnly Cookies)
┌────────────────────────────▼────────────────────────────┐
│                  FastAPI Backend Server                 │
│         Auth Router  │  Zones Router  │  Records Router │
└────────────────────────────┬────────────────────────────┘
                             │ SQLAlchemy 2.0 ORM
┌────────────────────────────▼────────────────────────────┐
│                    SQLite Database                      │
│                      nexus_dns.db                       │
└─────────────────────────────────────────────────────────┘
```

---

## 8. 🗄️ Database Schema

```
Users (id, username, password_hash, created_at, updated_at)
  │
  └──< Sessions (id, token_hash, user_id, expires_at, created_at)

HostedZones (id, public_zone_id, name, description, zone_type, created_at, updated_at)
  │
  └──< DnsRecords (id, hosted_zone_id, name, type, ttl, values_json, is_system, created_at, updated_at)
```

---

## 9. 📡 API Overview

### Authentication
- `POST /api/auth/login` — Authenticate user and issue HttpOnly session cookie
- `POST /api/auth/logout` — Invalidate active session and clear cookie
- `GET  /api/auth/me` — Return current authenticated user

### Hosted Zones
- `GET    /api/hosted-zones` — List hosted zones (pagination & search)
- `POST   /api/hosted-zones` — Create a hosted zone
- `GET    /api/hosted-zones/{id}` — Get zone details
- `PATCH  /api/hosted-zones/{id}` — Update zone description
- `DELETE /api/hosted-zones/{id}` — Delete hosted zone

### DNS Records
- `GET    /api/hosted-zones/{id}/records` — List records in a zone
- `POST   /api/hosted-zones/{id}/records` — Create a DNS record
- `GET    /api/hosted-zones/{id}/records/{rec_id}` — Get record details
- `PATCH  /api/hosted-zones/{id}/records/{rec_id}` — Update record
- `DELETE /api/hosted-zones/{id}/records/{rec_id}` — Delete record

---

## 10. 💻 Local Setup & Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.10+ and pip

### 1. Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
.\venv\Scripts\activate  # On Windows (or source venv/bin/activate on Linux/macOS)

# Install dependencies
pip install -r requirements.txt

# Run FastAPI dev server (auto-seeds database on startup)
uvicorn app.main:app --reload --port 8000
```
FastAPI Swagger docs will be live at: `http://127.0.0.1:8000/docs`

### 2. Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Run Next.js dev server
npm run dev
```
Web Console will be live at: `http://localhost:3000`

---

## 11. ☁️ Deployment Architecture

| Service | Platform | Build Provider | Environment URL |
|---|---|---|---|
| **Frontend** | Railway | Nixpacks (Node.js 20) | `https://nexus-dns.up.railway.app` |
| **Backend** | Railway | Nixpacks (Python 3.10) | `https://nexus-dns-production.up.railway.app` |

---

## 12. 💡 Assumptions & Mocked Services

- **Simulated AWS Infrastructure**: Accelerated Recovery status, DNSSEC KSK generation, and CloudWatch query log group association use persisted mock configurations rather than live AWS Route 53 API calls.
- **DNS Resolution**: The **Test Record** page simulates DIG output responses based on active database records.
- **SQLite Database Persistence**: Database automatically auto-seeds demo data (`example.com`, `planora.com`) on startup if empty.

---

## 13. 🧪 Testing & Quality Assurance

- **Backend Pytest Suite**: 48 automated test cases passing cleanly:
  ```bash
  cd backend && pytest
  ```
- **TypeScript Static Verification**: Passed with **0 errors**:
  ```bash
  cd frontend && npx tsc --noEmit
  ```
- **ESLint Code Quality**: Passed with **0 errors / 0 warnings**:
  ```bash
  cd frontend && npm run lint
  ```
- **Next.js Production Build**: Production build compiled in 2.6s.

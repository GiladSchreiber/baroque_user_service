# CLAUDE.md — Baroque QR Menu System

This file gives Claude context about this project so it can assist effectively across sessions.

---

## Project Summary
**Baroque** is a bar + café in [city]. This repo is the QR-code menu and info system:
- Guests scan a QR code at the table → land on the menu (food / drinks) and WiFi page
- Admins log in to edit menu items (prices, availability, add/remove)
- Designed to extend to concerts, art exhibitions, and other content in the future

---

## Repository Layout
```
baroque_user_service/
├── backend/              # FastAPI (Python 3.12+)
│   ├── app/
│   │   ├── main.py
│   │   ├── models/
│   │   ├── routers/
│   │   ├── schemas/
│   │   ├── crud/
│   │   ├── auth/
│   │   └── database.py
│   ├── requirements.txt
│   └── alembic/          # migrations (added in Phase 2+)
├── frontend/             # React + Vite (TypeScript)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── api/          # typed API client
│   │   └── context/
│   ├── index.html
│   └── vite.config.ts
├── CLAUDE.md             # this file
└── plan.md               # full build plan with phases
```

---

## Tech Stack
| Layer | Tech |
|---|---|
| Backend | FastAPI, SQLAlchemy (async), Pydantic v2, python-jose (JWT), passlib/bcrypt |
| Database (local) | SQLite |
| Database (prod) | PostgreSQL (Render free tier) |
| Frontend | React 18, Vite, TypeScript, React Router v6, Tailwind CSS |
| Frontend host | GitHub Pages |
| Backend host | Render.com (free tier) |
| Auth | JWT access tokens, single admin user |

---

## Build Philosophy
- **Tiny steps**: each phase ends with a testable milestone before moving on
- **No over-engineering**: start simple (SQLite, single admin) — expand when needed
- **Public reads, protected writes**: all GET menu/config endpoints are public; mutations require JWT
- **Modular routes**: each domain (menu, auth, config, events…) gets its own FastAPI router and React page

---

## Environment Variables

### Backend (`backend/.env`)
```
DATABASE_URL=sqlite:///./baroque.db          # local; use postgres:// in prod
JWT_SECRET=change-me-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRE_MINUTES=480
ADMIN_USERNAME=admin
ADMIN_PASSWORD=change-me-in-production
CORS_ORIGINS=http://localhost:5173,https://<github-username>.github.io
```

### Frontend (`frontend/.env.local`)
```
VITE_API_BASE_URL=http://localhost:8000      # local; set to Render URL in prod
```

---

## Running Locally
```bash
# Backend
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## Menu Data Model (from real PDFs)

Two menus: **food** and **drink**.

### Food categories
`bread` · `sandwiches` · `toasts` · `salads` · `soup` · `pastries`

### Drink categories
`cocktails` · `beer` · `red_wine` · `white_wine` · `liqueurs` · `coffee` · `soft_drinks`

### Price variants
Prices are stored as a display string (e.g. `"33/129"` = glass/bottle, `"11/13/15"` = S/M/L). The field is `price_display: str`.

### MenuItem fields
`id`, `menu_type` (food|drink), `category`, `name_en`, `name_he`, `description_en`, `description_he`, `price_display`, `is_available`, `is_vegetarian`, `is_seasonal`, `position`

## Current Phase
See `plan.md` for the full phased build plan. Update this section as phases complete.

- [x] Phase 0 — Scaffold & Context (plan.md + CLAUDE.md)
- [x] Phase 1 — Backend Skeleton (`GET /health`, `GET /`)
- [x] Phase 2 — Menu Data Layer (models, seed, GET /menu/items, GET /menu/categories, GET /config/wifi)
- [x] Phase 3+4 — Menu CRUD API + Auth (JWT login, GET /auth/me, POST/PUT/DELETE /menu/items)
- [x] Phase 5 — Frontend Skeleton (Vite, Tailwind, React Router, NavBar, placeholder pages, API client, AuthContext)
- [x] Phase 6 — Menu Display (food/drink tabs, grouped by category, bilingual, price formatting, loading skeleton, error state)
- [x] Phase 7 — WiFi Page (SSID + password from backend, tap-to-copy, loading skeleton)
- [x] Phase 8 — Admin Auth Flow (redirect if already logged in, ProtectedRoute, logout)
- [x] Phase 9 — Menu Editor (toggle availability, inline edit, delete with confirm, add new item)
- [ ] Phase 10 — QR Code Generation
- [ ] Phase 11 — Deployment

---

## Conventions
- Python: snake_case, type hints everywhere, Pydantic v2 models
- TypeScript: PascalCase components, camelCase variables, named exports
- API routes: `/menu/items`, `/auth/login`, `/config/wifi` — noun-based, versioning via prefix when needed
- Commit style: `feat:`, `fix:`, `chore:` prefixes
- Never commit `.env` files — use `.env.example` templates

# Baroque — QR Menu & Info System: Build Plan

## Vision
A QR-code-accessible web app for Baroque (bar + café) that guests scan at the table to view the food/drink menu and WiFi credentials. Staff with admin access can edit the menu from the UI. The system is designed to extend to concerts, art exhibitions, and other content sections in the future.

---

## Architecture Overview

```
baroque_user_service/
├── backend/          # FastAPI (Python)
├── frontend/         # React + Vite (TypeScript)
├── CLAUDE.md
└── plan.md
```

### Frontend
- **Framework**: React + Vite (TypeScript)
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State**: React Context + useState (no Redux overhead yet)
- **Hosting**: GitHub Pages (static, free)
- **Build output**: `frontend/dist/` → deployed via `gh-pages` branch

### Backend
- **Framework**: FastAPI (Python 3.12+)
- **ORM**: SQLAlchemy (async) + SQLite for local dev → PostgreSQL-ready
- **Auth**: JWT (python-jose) with a single admin user to start
- **Hosting**: Render.com free tier (or Railway) — supports FastAPI out of the box
- **DB**: SQLite file locally, environment-variable switchable to PostgreSQL for production

### Data Model (initial)
- `MenuItem`: id, category (food | drink), name, description, price, available (bool), position (int, for ordering)
- `User`: id, username, hashed_password, role (admin | staff)
- `SiteConfig`: key, value (for WiFi password, SSID, opening hours, etc.)

### Auth Model
- Admin login via username + password → receives JWT access token
- Token stored in `localStorage` on frontend
- Protected API routes require `Authorization: Bearer <token>` header
- Guests never log in — all read endpoints are public

---

## Build Steps (tiny, each testable)

### Phase 0 — Scaffold & Context
- [x] `plan.md` — this file
- [x] `CLAUDE.md` — project context for Claude
- **Test**: files exist, readable

### Phase 1 — Backend Skeleton
- Create `backend/` with `main.py`, `requirements.txt`, virtual-env instructions
- Single `GET /health` endpoint returning `{"status": "ok"}`
- `GET /` returns app name and version
- **Test**: `uvicorn backend.main:app --reload` → hit `/health` in browser or curl

### Phase 2 — Menu Data Layer
- SQLAlchemy models: `MenuItem`, `SiteConfig`
- Alembic migrations (or simple `create_all` for now)
- Seed script with a few sample items (coffee, beer, burger…)
- **Test**: `GET /menu/items` returns seeded items as JSON

### Phase 3 — Menu CRUD API
- `GET /menu/items` — public, list all available items (optionally filter by category)
- `POST /menu/items` — protected (admin only)
- `PUT /menu/items/{id}` — protected
- `DELETE /menu/items/{id}` — protected
- **Test**: CRUD via FastAPI's auto-generated `/docs` Swagger UI

### Phase 4 — Auth API
- `User` model + seed admin user (username from env var, bcrypt password)
- `POST /auth/login` → returns JWT
- `GET /auth/me` → returns current user info (protected)
- **Test**: login via `/docs`, copy token, call protected endpoint

### Phase 5 — Frontend Skeleton
- `npm create vite@latest frontend -- --template react-ts`
- Tailwind CSS setup
- Basic routing: `/` (menu), `/admin` (login gate), `/wifi`
- Nav bar with Baroque branding
- **Test**: `npm run dev` → app loads, routes render placeholder pages

### Phase 6 — Menu Display (Guest View)
- Fetch `GET /menu/items` from backend
- Two-tab layout: Food | Drinks
- MenuItem card component (name, description, price, availability badge)
- Loading and error states
- **Test**: items from backend render on screen; unavailable items visually distinct

### Phase 7 — WiFi Page
- Reads WiFi SSID + password from `GET /config/wifi` (public endpoint)
- Displays credentials cleanly; "tap to copy" for password
- **Test**: page renders WiFi info fetched from backend

### Phase 8 — Admin Auth Flow (Frontend)
- Login page at `/admin/login`
- On success, store JWT, redirect to `/admin`
- Protected route wrapper — redirect to login if no token
- Logout button clears token
- **Test**: login with wrong creds → error; correct creds → admin area

### Phase 9 — Menu Editor (Admin UI)
- List all menu items (including unavailable)
- Inline edit: name, description, price, availability toggle
- Add new item form (category, name, description, price)
- Delete with confirmation
- **Test**: add → appears on guest view; edit price → reflected; delete → gone

### Phase 10 — QR Code Generation
- Admin page: generate and download a QR code pointing to the frontend URL
- Can generate per-table QR if needed (URL param `?table=3`)
- Library: `qrcode[pil]` on backend or `qrcode.react` on frontend
- **Test**: scan QR with phone → lands on menu page

### Phase 11 — Deployment
- Frontend: GitHub Actions workflow → build → push to `gh-pages` branch
- Backend: `render.yaml` or Railway config, env vars for DB URL + JWT secret
- CORS: backend allows GitHub Pages origin
- **Test**: full flow on real URLs, QR code points to production

---

## Future Extensions (not in scope now, but designed for)
- **Concerts**: `Event` model, `/events` route, event cards with date/time/lineup
- **Art**: `Exhibit` model, `/art` route, image gallery
- **Multilingual**: i18n strings file, language switcher
- **Table-specific QR**: URL param `?table=N` passed through, can trigger table service
- **Staff role**: read-write menu but no user management
- **Image uploads**: menu item photos stored on S3-compatible service

---

## Key Constraints & Decisions
| Topic | Decision | Reason |
|---|---|---|
| Frontend host | GitHub Pages | Free, simple, git-native |
| Backend host | Render.com free tier | Free, supports Python/FastAPI |
| DB (local) | SQLite | Zero-config local dev |
| DB (prod) | PostgreSQL (Render free) | Render provides free Postgres |
| Auth | JWT, single admin | Simple, stateless, expandable |
| Styling | Tailwind CSS | Fast, utility-first, minimal bundle |
| Monorepo | Yes, single git repo | Simpler for a small project |
| Language | Python 3.12 + TypeScript | Type safety on both sides |

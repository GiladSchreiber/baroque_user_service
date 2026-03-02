from contextlib import asynccontextmanager

import app.models  # noqa: F401 — registers all models with Base before create_all()
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers.auth import router as auth_router
from app.routers.menu import config_router, router as menu_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    from app.seed import seed, seed_admin
    seed()
    seed_admin()
    yield


app = FastAPI(
    title="Baroque API",
    version="0.4.0",
    description="QR menu & info system for Baroque bar & café",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(menu_router)
app.include_router(config_router)


@app.get("/")
def root():
    return {"name": "Baroque API", "version": "0.3.0"}


@app.get("/health")
def health():
    return {"status": "ok"}

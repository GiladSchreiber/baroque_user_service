from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.auth.dependencies import require_admin
from app.database import get_db
from app.models.menu import MenuItem, SiteConfig
from app.models.user import User
from app.schemas.menu import MenuItemCreate, MenuItemResponse, MenuItemUpdate, SiteConfigResponse

router = APIRouter(prefix="/menu", tags=["menu"])


# ── Public reads ──────────────────────────────────────────────────────────────

@router.get("/items", response_model=list[MenuItemResponse])
def get_menu_items(
    menu_type: str | None = Query(None, description="'food' or 'drink'"),
    category: str | None = Query(None),
    include_unavailable: bool = Query(False),
    db: Session = Depends(get_db),
):
    query = db.query(MenuItem)
    if not include_unavailable:
        query = query.filter(MenuItem.is_available.is_(True))
    if menu_type:
        query = query.filter(MenuItem.menu_type == menu_type)
    if category:
        query = query.filter(MenuItem.category == category)
    return query.order_by(MenuItem.menu_type, MenuItem.position).all()


@router.get("/items/{item_id}", response_model=MenuItemResponse)
def get_menu_item(item_id: int, db: Session = Depends(get_db)):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    return item


@router.get("/categories")
def get_categories(
    menu_type: str | None = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(MenuItem.menu_type, MenuItem.category).distinct()
    if menu_type:
        query = query.filter(MenuItem.menu_type == menu_type)
    rows = query.order_by(MenuItem.menu_type, MenuItem.category).all()
    return [{"menu_type": r[0], "category": r[1]} for r in rows]


# ── Protected writes (admin only) ─────────────────────────────────────────────

@router.post("/items", response_model=MenuItemResponse, status_code=201)
def create_menu_item(
    body: MenuItemCreate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    item = MenuItem(**body.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.put("/items/{item_id}", response_model=MenuItemResponse)
def update_menu_item(
    item_id: int,
    body: MenuItemUpdate,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    for field, value in body.model_dump(exclude_unset=True).items():
        setattr(item, field, value)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/items/{item_id}", status_code=204)
def delete_menu_item(
    item_id: int,
    db: Session = Depends(get_db),
    _: User = Depends(require_admin),
):
    item = db.query(MenuItem).filter(MenuItem.id == item_id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    db.delete(item)
    db.commit()


# ── Config ────────────────────────────────────────────────────────────────────

config_router = APIRouter(prefix="/config", tags=["config"])


@config_router.get("/wifi", response_model=list[SiteConfigResponse])
def get_wifi(db: Session = Depends(get_db)):
    keys = ["wifi_ssid", "wifi_password"]
    return db.query(SiteConfig).filter(SiteConfig.key.in_(keys)).all()

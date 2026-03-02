from pydantic import BaseModel


class MenuItemResponse(BaseModel):
    id: int
    menu_type: str
    category: str
    name_en: str
    name_he: str | None
    description_en: str | None
    description_he: str | None
    price_display: str
    is_available: bool
    is_vegetarian: bool
    is_seasonal: bool
    position: int

    model_config = {"from_attributes": True}


class MenuItemCreate(BaseModel):
    menu_type: str
    category: str
    name_en: str
    name_he: str | None = None
    description_en: str | None = None
    description_he: str | None = None
    price_display: str
    is_available: bool = True
    is_vegetarian: bool = False
    is_seasonal: bool = False
    position: int = 0


class MenuItemUpdate(BaseModel):
    """All fields optional — send only what you want to change."""
    menu_type: str | None = None
    category: str | None = None
    name_en: str | None = None
    name_he: str | None = None
    description_en: str | None = None
    description_he: str | None = None
    price_display: str | None = None
    is_available: bool | None = None
    is_vegetarian: bool | None = None
    is_seasonal: bool | None = None
    position: int | None = None


class SiteConfigResponse(BaseModel):
    key: str
    value: str

    model_config = {"from_attributes": True}

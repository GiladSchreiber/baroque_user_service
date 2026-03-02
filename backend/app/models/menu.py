from sqlalchemy import Boolean, Column, Integer, String
from app.database import Base


class MenuItem(Base):
    __tablename__ = "menu_items"

    id = Column(Integer, primary_key=True, index=True)
    menu_type = Column(String, nullable=False)       # "food" | "drink"
    category = Column(String, nullable=False)         # e.g. "cocktails", "bread"
    name_en = Column(String, nullable=False)
    name_he = Column(String, nullable=True)
    description_en = Column(String, nullable=True)
    description_he = Column(String, nullable=True)
    price_display = Column(String, nullable=False)    # "30", "33/129", "11/13/15"
    is_available = Column(Boolean, default=True, nullable=False)
    is_vegetarian = Column(Boolean, default=False, nullable=False)
    is_seasonal = Column(Boolean, default=False, nullable=False)
    position = Column(Integer, default=0, nullable=False)


class SiteConfig(Base):
    __tablename__ = "site_config"

    key = Column(String, primary_key=True)
    value = Column(String, nullable=False)

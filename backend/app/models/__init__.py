# Import all models here so Base.metadata knows about them before create_all()
from app.models.menu import MenuItem, SiteConfig  # noqa: F401
from app.models.user import User  # noqa: F401

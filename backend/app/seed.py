"""
Seed the database with Baroque's real menu items and admin user.
Run from backend/ with:  python -m app.seed
"""
import app.models  # noqa: F401 — registers all models with Base before create_all()
from app.database import SessionLocal, init_db
from app.models.menu import MenuItem, SiteConfig
from app.models.user import User

# ── helpers ──────────────────────────────────────────────────────────────────

def _item(menu_type, category, name_en, name_he, price_display,
          desc_en=None, desc_he=None,
          is_vegetarian=False, is_seasonal=False, position=0):
    return MenuItem(
        menu_type=menu_type,
        category=category,
        name_en=name_en,
        name_he=name_he,
        description_en=desc_en,
        description_he=desc_he,
        price_display=price_display,
        is_available=True,
        is_vegetarian=is_vegetarian,
        is_seasonal=is_seasonal,
        position=position,
    )

# ── FOOD MENU ─────────────────────────────────────────────────────────────────

FOOD_ITEMS = [
    # Bread (על לחם)
    _item("food", "bread", "Frena with Dips", "פרנה מטבלים", "30",
          "Labneh, tomato salsa, olive oil & balsamic vinegar",
          "לבנה, סלסת עגבניות, שמן זית ובלסמי",
          is_vegetarian=True, position=10),

    _item("food", "bread", "Eggplant & Matbucha", "חציל מטבוחה", "30/45",
          "Homemade Matbucha, eggplant, Tahina, spicy and herbs",
          "מטבוחה ביתית, חצילים, טחינה, חריף ועשבי תיבול",
          is_vegetarian=True, position=20),

    _item("food", "bread", "Artichoke & Tomatos", "ארטישוק עגבניות צלויות", "30/45",
          "Tahina, fried tomatos, artichoke, spicy and herbs",
          "טחינה, עגבניות צלויות, ארטישוק, חריף ועשבי תיבול",
          is_vegetarian=True, position=30),

    _item("food", "bread", "Avocado & Cream Cheese", "שמנת אבוקדו", "35",
          "Chestnut garlic toast, crème fraîche, avocado, cumin",
          "טוסט קסטן שום, קרם פרש, אבוקדו, כמון",
          is_vegetarian=True, is_seasonal=True, position=40),

    # Salads (סלטים)
    _item("food", "salads", "Tomato Salad", "סלט עגבניות", "36",
          "Cherry tomatoes in three colors, red onion, za'atar leaves, spicy sauce",
          "שרי בשלושה צבעים, בצל סגול, צנונית ביתית, קרוטונים, עלי זעתר, חריף",
          is_vegetarian=True, position=10),

    _item("food", "salads", "Caesar Salad", "סלט קיסר", "40",
          "Caesar sauce, seasoned breadcrumbs, parmesan",
          "רוטב קיסר, פרורי לחם מתובלים, פרמז'ן",
          position=20),

    # Sandwiches (סנדוויצ'ים)
    _item("food", "sandwiches", "Mortadella", "מורטדלה", "40",
          "Brioche bun, grilled mortadella, tomato, red onion, lollo lettuce, homemade aioli",
          "לחמניית בריוש, נקניק צלוי, עגבניה, בצל סגול, חסה לאליק, איולי ביתי",
          position=10),

    _item("food", "sandwiches", "Egg Salad", "סלט ביצים", "35",
          "Brioche bun, green onion, dill, chives, homemade aioli",
          "לחמניית בריוש, בצל ירוק, שמיר, עירית, איולי ביתי",
          is_vegetarian=True, position=20),

    _item("food", "sandwiches", "Artichoke", "ארטישוק", "35",
          "Durum bread, tomato, red onion, lollo lettuce, homemade tahini",
          "לחם דורום, עגבנייה, בצל סגול, חסה לאליק, טחינה ביתית",
          is_vegetarian=True, position=30),

    # Toasts (טוסטים)
    _item("food", "toasts", "Pesto Gouda", "פסטו גאודה", "40",
          "Pesto, red onion, tomato, gouda, butter",
          "פסטו, בצל סגול, עגבנייה, גאודה, חמאה",
          is_vegetarian=True, position=10),

    _item("food", "toasts", "Pastrami & Cheese", "פסטרמה מוצרלה", "42",
          "Pastrami, mozzarella, butter",
          "פסטרמה, מוצרלה, חמאה",
          position=20),

    _item("food", "toasts", "Gouda & Pickled Lemon", "גאודה לימון כבוש", "40",
          "Pickled lemon, gouda, tomato, red onion, butter",
          "לימון כבוש, גאודה, עגבניה, בצל סגול, חמאה",
          is_vegetarian=True, position=30),

    # Soup
    _item("food", "soup", "Soup", "מרק", "40",
          desc_en=None, desc_he=None,
          is_vegetarian=True, is_seasonal=True, position=10),

    # Pastries (מאפים)
    _item("food", "pastries", "Small Cookie", "עוגייה קטנה", "5",
          is_vegetarian=True, position=10),
    _item("food", "pastries", "Biscotti", "ביסקוטי", "8",
          is_vegetarian=True, position=20),
    _item("food", "pastries", "Cookie", "עוגייה", "14",
          is_vegetarian=True, position=30),
    _item("food", "pastries", "Brownies", "בראוניז", "15",
          is_vegetarian=True, position=40),
    _item("food", "pastries", "Stir Cake", "עוגה בחושה", "16",
          is_vegetarian=True, position=50),
    _item("food", "pastries", "Butter Croissant", "קרואסון חמאה", "16",
          is_vegetarian=True, position=60),
    _item("food", "pastries", "Special Croissant", "קרואסון עם מילוי", "17",
          is_vegetarian=True, position=70),
    _item("food", "pastries", "Almond Pie", "פאי שקדים ופרי", "30",
          is_vegetarian=True, position=80),
]

# ── DRINK MENU ────────────────────────────────────────────────────────────────

DRINK_ITEMS = [
    # Coffee (קפה)
    _item("drink", "coffee", "Espresso", "אספרסו", "11",
          is_vegetarian=True, position=10),
    _item("drink", "coffee", "Cortado", "קורטדו", "12",
          is_vegetarian=True, position=20),
    _item("drink", "coffee", "Macchiato", "מקיאטו", "12",
          is_vegetarian=True, position=30),
    _item("drink", "coffee", "Americano", "אמריקנו", "11/13/15",
          desc_en="Small / Medium / Large",
          is_vegetarian=True, position=40),
    _item("drink", "coffee", "Cappuccino", "הפוך", "12/14/16",
          desc_en="Small / Medium / Large",
          is_vegetarian=True, position=50),
    _item("drink", "coffee", "Iced Americano", "אמריקנו קר", "15",
          is_vegetarian=True, position=60),
    _item("drink", "coffee", "Iced Coffee", "קפה קר", "16",
          is_vegetarian=True, position=70),
    _item("drink", "coffee", "Chocolate Milk", "שוקו", "18",
          is_vegetarian=True, position=80),
    _item("drink", "coffee", "Tea", "תה", "12",
          is_vegetarian=True, position=90),
    _item("drink", "coffee", "Ginger, Lemon & Honey", "ג'ינג'ר, לימון, דבש", "16",
          is_vegetarian=True, position=100),
    _item("drink", "coffee", "Chai", "צ'אי", "20",
          is_vegetarian=True, position=110),
    _item("drink", "coffee", "Iced Tea", "תה קר", "20",
          is_vegetarian=True, position=120),
    _item("drink", "coffee", "Matcha", "מאצ'ה", "20",
          is_vegetarian=True, position=130),
    _item("drink", "coffee", "Oat Milk (add-on)", "תוספת חלב שיבולת שועל", "+1",
          is_vegetarian=True, position=140),

    # Soft Drinks (שתייה קלה)
    _item("drink", "soft_drinks", "Mineral Water / Soda", "מים מינרליים / סודה", "12",
          is_vegetarian=True, position=10),
    _item("drink", "soft_drinks", "Sparkling Drink", "שתייה מוגזת", "13",
          is_vegetarian=True, position=20),
    _item("drink", "soft_drinks", "Coke / Zero", "קולה / זירו", "13",
          is_vegetarian=True, position=30),
    _item("drink", "soft_drinks", "Orange Juice", "מיץ תפוזים", "20",
          is_vegetarian=True, position=40),

    # Beer (בירה)
    _item("drink", "beer", "From Tap", "מהחבית", "31/27",
          desc_en="Large / Small", desc_he="גדול / קטן", position=10),
    _item("drink", "beer", "From Can", "בפחית", "24", position=20),
    _item("drink", "beer", "From Bottle", "בבקבוק", "28", position=30),

    # Cocktails (קוקטיילים)
    _item("drink", "cocktails", "Smash Bach", "סמאש באך", "46",
          "Gin, brandy, chopped ginger and thyme leaves",
          "ג'ין, ברנדי, ג'ינג'ר כתוש ועלי טימין", position=10),
    _item("drink", "cocktails", "Scarlatti Paluma", "סקרלטי פלומה", "46",
          "Tequila blanco, Yuzu syrup, sparkling red grapefruit",
          "טקילה בלאנקו, ליקר יוזו, אשכולית אדומה תוססת", position=20),
    _item("drink", "cocktails", "Amadeus", "אמדאוס", "46",
          "Tropical sorbet, tequila, triple sec, lemon and mint twist",
          "סורבה טרופי, טקילה, טריפל סק וטוויסט לימון ונענע", position=30),
    _item("drink", "cocktails", "Sebastian Mule", "סבסטיאן מיול", "46",
          "Scotch, splash of caramel, ginger beer and orange twist",
          "ויסקי סקוטי, נגיעת קרמל, ג'ינג'ר ביר וטוויסט תפוז", position=40),
    _item("drink", "cocktails", "Classic Cocktail", "קוקטייל קלאסי", "50",
          position=50),
    _item("drink", "cocktails", "Mulled Wine", "יין חם מתובל מחוזק", "46",
          position=60),

    # Red Wine (יין אדום)
    _item("drink", "red_wine", "Rib Shack", "ריב שאק", "33/129",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=10),
    _item("drink", "red_wine", "Douglas Green Merlot", "דאגלס גרין מרלו", "33/129",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=20),
    _item("drink", "red_wine", "Alamos Syrah", "אלאמוס סירה", "33/129",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=30),
    _item("drink", "red_wine", "Alamos Malbec", "אלאמוס מלבק", "33/129",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=40),
    _item("drink", "red_wine", "Tiamo Primitivo", "טיאמו פרימיטיבו", "36/144",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=50),
    _item("drink", "red_wine", "Pfaffl Zweigelt", "פפאפל צוויגלט", "37/145",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=60),

    # White Wine (יין לבן)
    _item("drink", "white_wine", "Alamos Sauvignon Blanc", "אלאמוס סוביניון בלאן", "33/132",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=10),
    _item("drink", "white_wine", "Nucos Chardonnay", "שרדונה נוקוס", "33/132",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=20),
    _item("drink", "white_wine", "Gewürztraminer", "גוורצטרמינר", "33/132",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=30),
    _item("drink", "white_wine", "Rosé", "רוזה", "36/144",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=40),
    _item("drink", "white_wine", "Tiamo Chardonnay", "טיאמו שרדונה", "36/144",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=50),
    _item("drink", "white_wine", "Pfaffl Grüner", "פפאפל גרונר", "37/148",
          desc_en="Glass / Bottle", desc_he="כוס / בקבוק", position=60),

    # Liqueurs (ליקרים)
    _item("drink", "liqueurs", "Bushmills", "בושמילס", "35", position=10),
    _item("drink", "liqueurs", "Jameson", "ג'יימסון", "35", position=20),
    _item("drink", "liqueurs", "Jim Beam", "ג'ים בים", "35", position=30),
    _item("drink", "liqueurs", "Monkey Shoulder", "מאנקי שולדר", "43", position=40),
    _item("drink", "liqueurs", "Glenfiddich 12", "גלנדפידיך 12", "60", position=50),
    _item("drink", "liqueurs", "Balvenie 12 Doublewood", "בלוויני 12 דאבלווד", "60", position=60),
    _item("drink", "liqueurs", "Chita", "צ'יטה", "60", position=70),
    _item("drink", "liqueurs", "Tequila Blanco", "טקילה בלאנקו", "35", position=80),
    _item("drink", "liqueurs", "Tequila Reposado", "טקילה רפוסדו", "39", position=90),
    _item("drink", "liqueurs", "Rum Negrita White", "רום נגריטה לבן", "35", position=100),
    _item("drink", "liqueurs", "Rum Negrita Spiced", "רום נגריטה ספייסד", "37", position=110),
    _item("drink", "liqueurs", "Rum Brewdog", "רום ברודוג", "43", position=120),
    _item("drink", "liqueurs", "Gin JJ", "ג'ין JJ", "35", position=130),
    _item("drink", "liqueurs", "Gin Hendricks", "ג'ין הנדריקס", "43", position=140),
    _item("drink", "liqueurs", "Arak Elite", "ערק אליט", "31", position=150),
    _item("drink", "liqueurs", "Vermouth White/Red/Dry", "ורמוט לבן/אדום/יבש", "33", position=160),
    _item("drink", "liqueurs", "Jägermeister", "ייגר", "35", position=170),
    _item("drink", "liqueurs", "Vodka Stoli", "וודקה סטולי", "35", position=180),
    _item("drink", "liqueurs", "Campari", "קמפרי", "35", position=190),
    _item("drink", "liqueurs", "Torres Brandy", "ברנדי טורס", "37", position=200),
    _item("drink", "liqueurs", "Becherovka", "בחרובקה", "37", position=210),
]

# ── Site Config ───────────────────────────────────────────────────────────────

SITE_CONFIG = [
    SiteConfig(key="wifi_ssid", value="barok_bar"),
    SiteConfig(key="wifi_password", value="jsbach1685"),
    SiteConfig(key="venue_name", value="Baroque"),
    SiteConfig(key="venue_tagline", value="Bar & Café"),
]


# ── Runner ────────────────────────────────────────────────────────────────────

def seed():
    init_db()
    db = SessionLocal()
    try:
        if db.query(MenuItem).count() > 0:
            print("Database already seeded — skipping.")
            return

        db.add_all(FOOD_ITEMS + DRINK_ITEMS)
        db.add_all(SITE_CONFIG)
        db.commit()

        total = db.query(MenuItem).count()
        print(f"Seeded {total} menu items and {len(SITE_CONFIG)} config entries.")
    finally:
        db.close()


def seed_admin():
    from app.auth.utils import hash_password
    from app.config import settings

    db = SessionLocal()
    try:
        if db.query(User).filter(User.username == settings.admin_username).first():
            return
        user = User(
            username=settings.admin_username,
            hashed_password=hash_password(settings.admin_password),
            role="admin",
        )
        db.add(user)
        db.commit()
        print(f"Admin user '{settings.admin_username}' created.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
    seed_admin()

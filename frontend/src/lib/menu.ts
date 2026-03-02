// ── Category metadata ─────────────────────────────────────────────────────────

export const CATEGORY_META: Record<string, { en: string; he: string }> = {
  // food
  bread:       { en: 'Bread',       he: 'על לחם' },
  salads:      { en: 'Salads',      he: 'סלטים' },
  sandwiches:  { en: 'Sandwiches',  he: 'סנדוויצ\'ים' },
  toasts:      { en: 'Toasts',      he: 'טוסטים' },
  soup:        { en: 'Soup',        he: 'מרק' },
  pastries:    { en: 'Pastries',    he: 'מאפים' },
  // drink
  coffee:      { en: 'Coffee',      he: 'קפה' },
  soft_drinks: { en: 'Soft Drinks', he: 'שתייה קלה' },
  beer:        { en: 'Beer',        he: 'בירה' },
  cocktails:   { en: 'Cocktails',   he: 'קוקטיילים' },
  red_wine:    { en: 'Red Wine',    he: 'יין אדום' },
  white_wine:  { en: 'White Wine',  he: 'יין לבן' },
  liqueurs:    { en: 'Spirits',     he: 'ליקרים' },
}

export const FOOD_ORDER    = ['bread', 'salads', 'sandwiches', 'toasts', 'soup', 'pastries']
export const DRINK_ORDER   = ['coffee', 'soft_drinks', 'beer', 'cocktails', 'red_wine', 'white_wine', 'liqueurs']

// ── Price formatting ──────────────────────────────────────────────────────────

export function formatPrice(display: string): string {
  if (display.startsWith('+')) return `+₪${display.slice(1)}`
  return display
    .split('/')
    .map(p => `₪${p.trim()}`)
    .join(' / ')
}

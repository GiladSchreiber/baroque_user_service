import { useLang } from '../context/LangContext'
import { CATEGORY_META, formatPrice } from '../lib/menu'
import type { MenuItem } from '../types'

interface Props {
  category: string
  items: MenuItem[]
  itemImage: string
}

const base = import.meta.env.BASE_URL

export default function FoodCategorySection({ category, items, itemImage }: Props) {
  const { t } = useLang()
  const meta = CATEGORY_META[category] ?? { en: category, he: category }

  return (
    <section className="mb-10">
      <div className="border-b border-baroque-border pb-2 mb-4">
        <h2 className="font-serif text-gold text-lg tracking-widest uppercase">
          {t(meta.en, meta.he)}
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-6">
        {items.map(item => {
          const name = t(item.name_en, item.name_he)
          const description = t(item.description_en, item.description_he)
          const priceNote = t(item.price_note_en ?? '', item.price_note_he ?? '') || null
          return (
            <div key={item.name_en}>
              <div className="relative aspect-square overflow-hidden">
                <img
                  src={itemImage}
                  alt={name}
                  className="w-full h-full object-cover object-bottom"
                />
                <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, var(--baroque-bg) 100%)' }} />
              </div>
              <div className="flex justify-between items-center mt-2 gap-1">
                <div className="flex items-center gap-1 min-w-0">
                  <span className="font-medium text-baroque-text text-sm leading-snug">{name}</span>
                  {item.is_vegetarian && (
                    <img
                      src={`${base}images/menu/food/vegan.svg`}
                      alt={t('Vegetarian', 'צמחוני')}
                      className="w-4 h-4 shrink-0 brightness-75"
                    />
                  )}
                  {item.is_seasonal && (
                    <span className="text-amber-600 text-xs font-medium tracking-wide shrink-0">{t('seasonal', 'לפי העונה')}</span>
                  )}
                </div>
                <span className="text-gold font-medium text-sm whitespace-nowrap shrink-0">{formatPrice(item.price_display)}</span>
              </div>
              {(description || priceNote) && (
                <div className="flex justify-between items-baseline gap-1 mt-1">
                  <p className="font-serif text-baroque-muted text-xs tracking-wide leading-relaxed">{description}</p>
                  {priceNote && <span className="font-serif text-baroque-muted text-xs tracking-wide whitespace-nowrap shrink-0">{priceNote}</span>}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

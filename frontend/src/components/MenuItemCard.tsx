import type { MenuItem } from '../types'
import { useLang } from '../context/LangContext'
import { formatPrice } from '../lib/menu'

interface Props {
  item: MenuItem
}

export default function MenuItemCard({ item }: Props) {
  const { t } = useLang()

  const name = t(item.name_en, item.name_he)
  const description = t(item.description_en, item.description_he)

  const priceNote = t(item.price_note_en ?? '', item.price_note_he ?? '') || null

  return (
    <div className="py-4 border-b border-baroque-border last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-baroque-text leading-snug">{name}</span>
          {item.is_vegetarian && (
            <span className="text-green-600 text-xs" title="Vegetarian">🌿</span>
          )}
          {item.is_seasonal && (
            <span className="text-amber-600 text-xs font-medium tracking-wide">{t('seasonal', 'לפי העונה')}</span>
          )}
        </div>
        <div className="text-gold font-medium whitespace-nowrap shrink-0 pt-0.5">
          {formatPrice(item.price_display)}
        </div>
      </div>
      {(description || priceNote) && (
        <div className="flex justify-between items-baseline mt-1 gap-4">
          <p className="text-sm text-baroque-muted leading-relaxed">{description}</p>
          {priceNote && <span className="text-sm text-baroque-muted whitespace-nowrap shrink-0">{priceNote}</span>}
        </div>
      )}
    </div>
  )
}

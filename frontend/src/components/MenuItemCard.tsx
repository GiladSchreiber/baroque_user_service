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

  return (
    <div className="flex items-start justify-between py-4 border-b border-baroque-border last:border-0 gap-4">
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-baroque-text leading-snug">{name}</span>
          {item.is_vegetarian && (
            <span className="text-green-600 text-xs" title="Vegetarian">🌿</span>
          )}
          {item.is_seasonal && (
            <span className="text-amber-600 text-xs font-medium tracking-wide">{t('seasonal', 'לפי העונה')}</span>
          )}
        </div>
        {description && (
          <p className="text-sm text-baroque-muted mt-1 leading-relaxed">{description}</p>
        )}
      </div>

      <div className="text-gold font-medium text-right whitespace-nowrap shrink-0 pt-0.5">
        {formatPrice(item.price_display)}
      </div>
    </div>
  )
}

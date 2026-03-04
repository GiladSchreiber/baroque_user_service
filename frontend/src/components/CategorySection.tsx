import { useLang } from '../context/LangContext'
import { CATEGORY_META } from '../lib/menu'
import MenuItemCard from './MenuItemCard'
import type { MenuItem } from '../types'

interface Props {
  category: string
  items: MenuItem[]
  imageSrc?: string
  imagePosition?: string
}

export default function CategorySection({ category, items, imageSrc, imagePosition }: Props) {
  const { t } = useLang()
  const meta = CATEGORY_META[category] ?? { en: category, he: category }

  return (
    <section className="mb-10">
      {imageSrc ? (
        <div className="relative overflow-hidden mb-4" style={{ height: '180px' }}>
          <img
            src={imageSrc}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: imagePosition ?? 'center' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.82) 0%, rgba(0,0,0,0.35) 55%, transparent 100%)' }}
          />
          <div className="absolute bottom-0 left-0 right-0 px-4 pb-3">
            <h2 className="font-serif text-gold text-lg tracking-widest uppercase" style={{ textShadow: '0 1px 6px rgba(0,0,0,0.8)' }}>
              {t(meta.en, meta.he)}
            </h2>
          </div>
        </div>
      ) : (
        <div className="border-b border-baroque-border pb-2 mb-2">
          <h2 className="font-serif text-gold text-lg tracking-widest uppercase">
            {t(meta.en, meta.he)}
          </h2>
        </div>
      )}
      <div>
        {items.map(item => (
          <MenuItemCard key={item.name_en} item={item} />
        ))}
      </div>
    </section>
  )
}

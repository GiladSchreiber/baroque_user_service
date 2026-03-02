import type { MenuItem } from '../api/client'
import { useLang } from '../context/LangContext'
import { CATEGORY_META } from '../lib/menu'
import MenuItemCard from './MenuItemCard'

interface Props {
  category: string
  items: MenuItem[]
}

export default function CategorySection({ category, items }: Props) {
  const { t } = useLang()
  const meta = CATEGORY_META[category] ?? { en: category, he: category }

  return (
    <section className="mb-10">
      <div className="border-b border-baroque-border pb-2 mb-2">
        <h2 className="font-serif text-gold text-lg tracking-widest uppercase">
          {t(meta.en, meta.he)}
        </h2>
      </div>
      <div>
        {items.map(item => (
          <MenuItemCard key={item.id} item={item} />
        ))}
      </div>
    </section>
  )
}

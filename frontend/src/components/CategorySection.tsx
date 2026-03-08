import { useState } from 'react'
import { useLang } from '../context/LangContext'
import { CATEGORY_META } from '../lib/menu'
import MenuItemCard from './MenuItemCard'
import type { MenuItem } from '../types'

export interface DishImage {
  src: string
  labelEn: string
  labelHe: string
}

interface Props {
  category: string
  menuType: string
  items: MenuItem[]
  imageSrc?: string
  imagePosition?: string
  editMode?: boolean
  onUpdate?: (id: string, changes: Partial<MenuItem>) => void
  onDelete?: (id: string) => void
  onAdd?: (item: Omit<MenuItem, 'id'>) => void
}

const EMPTY_DRAFT = { name_en: '', name_he: '', price_display: '', description_en: '', description_he: '', is_vegetarian: false, is_seasonal: false }

export default function CategorySection({ category, menuType, items, imageSrc, imagePosition, editMode, onUpdate, onDelete, onAdd }: Props) {
  const { t } = useLang()
  const meta = CATEGORY_META[category] ?? { en: category, he: category }
  const [adding, setAdding] = useState(false)
  const [draft, setDraft]   = useState({ ...EMPTY_DRAFT })

  const submitAdd = () => {
    if (!draft.name_en.trim()) return
    onAdd?.({ menu_type: menuType, category, ...draft, description_en: draft.description_en || null, description_he: draft.description_he || null })
    setDraft({ ...EMPTY_DRAFT })
    setAdding(false)
  }

  return (
    <section className="mb-10">
      {imageSrc ? (
        <div className="relative overflow-hidden mb-4 -mx-4" style={{ height: '200px' }}>
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
          <MenuItemCard
            key={item.id ?? item.name_en}
            item={item}
            editMode={editMode}
            onUpdate={item.id ? changes => onUpdate?.(item.id!, changes) : undefined}
            onDelete={item.id ? () => onDelete?.(item.id!) : undefined}
          />
        ))}
      </div>

      {editMode && (
        adding ? (
          <div className="mt-2 flex flex-col gap-2 border border-baroque-border rounded p-3">
            <input className="w-full bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-sm text-baroque-text" placeholder="Name (EN)" value={draft.name_en} onChange={e => setDraft(d => ({ ...d, name_en: e.target.value }))} />
            <input dir="rtl" className="w-full bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-sm text-baroque-text" placeholder="שם (עברית)" value={draft.name_he} onChange={e => setDraft(d => ({ ...d, name_he: e.target.value }))} />
            <input className="w-full bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-sm text-baroque-text" placeholder="Price (e.g. 35 or 33/129)" value={draft.price_display} onChange={e => setDraft(d => ({ ...d, price_display: e.target.value }))} />
            <input className="w-full bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-sm text-baroque-text" placeholder="Description (EN)" value={draft.description_en} onChange={e => setDraft(d => ({ ...d, description_en: e.target.value }))} />
            <input dir="rtl" className="w-full bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-sm text-baroque-text" placeholder="תיאור (עברית)" value={draft.description_he} onChange={e => setDraft(d => ({ ...d, description_he: e.target.value }))} />
            <div className="flex gap-4 text-xs text-baroque-muted">
              <label className="flex items-center gap-1"><input type="checkbox" checked={draft.is_vegetarian} onChange={e => setDraft(d => ({ ...d, is_vegetarian: e.target.checked }))} />Vegetarian</label>
              <label className="flex items-center gap-1"><input type="checkbox" checked={draft.is_seasonal} onChange={e => setDraft(d => ({ ...d, is_seasonal: e.target.checked }))} />Seasonal</label>
            </div>
            <div className="flex gap-2">
              <button onClick={submitAdd} className="flex-1 bg-gold text-baroque-bg text-xs font-medium py-1.5 rounded">Add</button>
              <button onClick={() => setAdding(false)} className="flex-1 border border-baroque-border text-baroque-muted text-xs py-1.5 rounded">Cancel</button>
            </div>
          </div>
        ) : (
          <button onClick={() => setAdding(true)} className="mt-2 w-full border border-dashed border-baroque-border text-baroque-muted text-xs py-2 rounded hover:border-gold hover:text-gold transition-colors">
            + Add item
          </button>
        )
      )}
    </section>
  )
}

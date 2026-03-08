import { useState } from 'react'
import type { MenuItem } from '../types'
import { useLang } from '../context/LangContext'
import { formatPrice } from '../lib/menu'

interface Props {
  item: MenuItem
  editMode?: boolean
  onUpdate?: (changes: Partial<MenuItem>) => void
  onDelete?: () => void
}

export default function MenuItemCard({ item, editMode, onUpdate, onDelete }: Props) {
  const { t } = useLang()
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState<Partial<MenuItem>>({})

  const name        = t(item.name_en, item.name_he)
  const description = t(item.description_en, item.description_he)
  const priceNote   = t(item.price_note_en ?? '', item.price_note_he ?? '') || null

  const startEdit = () => {
    setDraft({
      name_en:        item.name_en,
      name_he:        item.name_he,
      price_display:  item.price_display,
      description_en: item.description_en ?? '',
      description_he: item.description_he ?? '',
      is_vegetarian:  item.is_vegetarian,
      is_seasonal:    item.is_seasonal,
    })
    setEditing(true)
  }

  const saveEdit = () => {
    onUpdate?.(draft)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="py-4 border-b border-baroque-border last:border-0 flex flex-col gap-2">
        <input
          className="w-full bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-sm text-baroque-text"
          placeholder="Name (EN)"
          value={draft.name_en ?? ''}
          onChange={e => setDraft(d => ({ ...d, name_en: e.target.value }))}
        />
        <input
          dir="rtl"
          className="w-full bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-sm text-baroque-text"
          placeholder="שם (עברית)"
          value={draft.name_he ?? ''}
          onChange={e => setDraft(d => ({ ...d, name_he: e.target.value }))}
        />
        <input
          className="w-full bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-sm text-baroque-text"
          placeholder="Price (e.g. 35 or 33/129)"
          value={draft.price_display ?? ''}
          onChange={e => setDraft(d => ({ ...d, price_display: e.target.value }))}
        />
        <input
          className="w-full bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-sm text-baroque-text"
          placeholder="Description (EN)"
          value={draft.description_en ?? ''}
          onChange={e => setDraft(d => ({ ...d, description_en: e.target.value }))}
        />
        <input
          dir="rtl"
          className="w-full bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-sm text-baroque-text"
          placeholder="תיאור (עברית)"
          value={draft.description_he ?? ''}
          onChange={e => setDraft(d => ({ ...d, description_he: e.target.value }))}
        />
        <div className="flex gap-4 text-xs text-baroque-muted">
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={!!draft.is_vegetarian} onChange={e => setDraft(d => ({ ...d, is_vegetarian: e.target.checked }))} />
            Vegetarian
          </label>
          <label className="flex items-center gap-1">
            <input type="checkbox" checked={!!draft.is_seasonal} onChange={e => setDraft(d => ({ ...d, is_seasonal: e.target.checked }))} />
            Seasonal
          </label>
        </div>
        <div className="flex gap-2 pt-1">
          <button onClick={saveEdit} className="flex-1 bg-gold text-baroque-bg text-xs font-medium py-1.5 rounded">Save</button>
          <button onClick={() => setEditing(false)} className="flex-1 border border-baroque-border text-baroque-muted text-xs py-1.5 rounded">Cancel</button>
        </div>
      </div>
    )
  }

  return (
    <div className="py-4 border-b border-baroque-border last:border-0">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium text-baroque-text leading-snug">{name}</span>
          {item.is_vegetarian && <span className="text-green-600 text-xs" title="Vegetarian">🌿</span>}
          {item.is_seasonal && <span className="text-amber-600 text-xs font-medium tracking-wide">{t('seasonal', 'לפי העונה')}</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <span className="text-gold font-medium whitespace-nowrap">{formatPrice(item.price_display)}</span>
          {editMode && (
            <>
              <button onClick={startEdit} className="text-baroque-muted hover:text-gold p-1" aria-label="Edit">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button onClick={() => { if (window.confirm(`Delete "${item.name_en}"?`)) onDelete?.() }} className="text-baroque-muted hover:text-red-400 p-1" aria-label="Delete">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </>
          )}
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

import { useState } from 'react'
import type { MenuItem, MenuItemUpdate } from '../../../api/client'
import { CATEGORY_META, FOOD_ORDER, DRINK_ORDER } from '../../../lib/menu'

interface Props {
  item: MenuItem
  onSave: (data: MenuItemUpdate) => Promise<void>
  onCancel: () => void
}

export default function ItemEditForm({ item, onSave, onCancel }: Props) {
  const [data, setData] = useState<MenuItemUpdate>({
    name_en: item.name_en,
    name_he: item.name_he ?? '',
    description_en: item.description_en ?? '',
    description_he: item.description_he ?? '',
    price_display: item.price_display,
    category: item.category,
    menu_type: item.menu_type,
    is_vegetarian: item.is_vegetarian,
    is_seasonal: item.is_seasonal,
    position: item.position,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof MenuItemUpdate>(key: K, value: MenuItemUpdate[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  const categories = data.menu_type === 'food' ? FOOD_ORDER : DRINK_ORDER

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await onSave(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to save')
      setSaving(false)
    }
  }

  return (
    <div className="bg-baroque-bg border border-gold/30 rounded-lg p-4 my-2 space-y-4">
      {/* Names */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 tracking-wide">Name (EN) *</label>
          <input
            value={data.name_en ?? ''}
            onChange={e => set('name_en', e.target.value)}
            className="input"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 tracking-wide">Name (HE)</label>
          <input
            value={data.name_he ?? ''}
            onChange={e => set('name_he', e.target.value)}
            dir="rtl"
            className="input"
          />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 tracking-wide">Description (EN)</label>
          <textarea
            value={data.description_en ?? ''}
            onChange={e => set('description_en', e.target.value)}
            rows={2}
            className="input resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 tracking-wide">Description (HE)</label>
          <textarea
            value={data.description_he ?? ''}
            onChange={e => set('description_he', e.target.value)}
            rows={2}
            dir="rtl"
            className="input resize-none"
          />
        </div>
      </div>

      {/* Price, category, position */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-stone-500 tracking-wide">Price *</label>
          <input
            value={data.price_display ?? ''}
            onChange={e => set('price_display', e.target.value)}
            placeholder="30 or 33/129"
            className="input"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 tracking-wide">Category</label>
          <select
            value={data.category ?? ''}
            onChange={e => set('category', e.target.value)}
            className="input"
          >
            {categories.map(c => (
              <option key={c} value={c}>{CATEGORY_META[c]?.en ?? c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-stone-500 tracking-wide">Position</label>
          <input
            type="number"
            value={data.position ?? 0}
            onChange={e => set('position', Number(e.target.value))}
            className="input"
          />
        </div>
      </div>

      {/* Checkboxes */}
      <div className="flex gap-6">
        <label className="flex items-center gap-2 text-sm text-stone-400 cursor-pointer">
          <input
            type="checkbox"
            checked={data.is_vegetarian ?? false}
            onChange={e => set('is_vegetarian', e.target.checked)}
            className="accent-green-500"
          />
          Vegetarian 🌿
        </label>
        <label className="flex items-center gap-2 text-sm text-stone-400 cursor-pointer">
          <input
            type="checkbox"
            checked={data.is_seasonal ?? false}
            onChange={e => set('is_seasonal', e.target.checked)}
            className="accent-amber-400"
          />
          Seasonal
        </label>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3">
        <button onClick={handleSave} disabled={saving} className="btn-gold disabled:opacity-50">
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={onCancel} className="btn-outline">Cancel</button>
      </div>
    </div>
  )
}

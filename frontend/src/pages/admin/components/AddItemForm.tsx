import { useState, type FormEvent } from 'react'
import type { MenuItemCreate } from '../../../api/client'
import { CATEGORY_META, FOOD_ORDER, DRINK_ORDER } from '../../../lib/menu'

interface Props {
  menuType: 'food' | 'drink'
  onAdd: (data: MenuItemCreate) => Promise<void>
}

function emptyItem(menuType: 'food' | 'drink', category: string): MenuItemCreate {
  return {
    menu_type: menuType,
    category,
    name_en: '',
    name_he: '',
    description_en: '',
    description_he: '',
    price_display: '',
    is_available: true,
    is_vegetarian: false,
    is_seasonal: false,
    position: 0,
  }
}

export default function AddItemForm({ menuType, onAdd }: Props) {
  const categories = menuType === 'food' ? FOOD_ORDER : DRINK_ORDER
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<MenuItemCreate>(() => emptyItem(menuType, categories[0]))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function set<K extends keyof MenuItemCreate>(key: K, value: MenuItemCreate[K]) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  function reset() {
    setData(emptyItem(menuType, categories[0]))
    setError(null)
    setOpen(false)
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await onAdd(data)
      reset()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to add item')
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-outline text-sm mb-6">
        + Add Item
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="card mb-8 space-y-4 border-gold/40">
      <div className="flex items-center justify-between">
        <h3 className="font-serif text-gold tracking-widest uppercase text-sm">New Item</h3>
        <button type="button" onClick={reset} className="text-stone-500 hover:text-stone-300 text-xl leading-none">&times;</button>
      </div>

      {/* Names */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 tracking-wide block">Name (EN) *</label>
          <input
            value={data.name_en}
            onChange={e => set('name_en', e.target.value)}
            required
            placeholder="e.g. Espresso"
            className="input"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 tracking-wide block">Name (HE)</label>
          <input
            value={data.name_he ?? ''}
            onChange={e => set('name_he', e.target.value)}
            dir="rtl"
            placeholder="אספרסו"
            className="input"
          />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-stone-500 tracking-wide block">Description (EN)</label>
          <textarea
            value={data.description_en ?? ''}
            onChange={e => set('description_en', e.target.value)}
            rows={2}
            className="input resize-none"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 tracking-wide block">Description (HE)</label>
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
          <label className="text-xs text-stone-500 tracking-wide block">Price *</label>
          <input
            value={data.price_display}
            onChange={e => set('price_display', e.target.value)}
            required
            placeholder="30 or 33/129"
            className="input"
          />
        </div>
        <div>
          <label className="text-xs text-stone-500 tracking-wide block">Category</label>
          <select
            value={data.category}
            onChange={e => set('category', e.target.value)}
            className="input"
          >
            {categories.map(c => (
              <option key={c} value={c}>{CATEGORY_META[c]?.en ?? c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs text-stone-500 tracking-wide block">Position</label>
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
        <button type="submit" disabled={saving} className="btn-gold disabled:opacity-50">
          {saving ? 'Adding…' : 'Add Item'}
        </button>
        <button type="button" onClick={reset} className="btn-outline">Cancel</button>
      </div>
    </form>
  )
}

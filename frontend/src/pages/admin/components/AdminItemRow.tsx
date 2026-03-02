import { useState } from 'react'
import type { MenuItem, MenuItemUpdate } from '../../../api/client'
import { formatPrice } from '../../../lib/menu'
import ItemEditForm from './ItemEditForm'

interface Props {
  item: MenuItem
  onToggle: (item: MenuItem) => Promise<void>
  onUpdate: (id: number, data: MenuItemUpdate) => Promise<void>
  onDelete: (id: number) => Promise<void>
}

export default function AdminItemRow({ item, onToggle, onUpdate, onDelete }: Props) {
  const [editing, setEditing] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleToggle() {
    setToggling(true)
    await onToggle(item).finally(() => setToggling(false))
  }

  async function handleDelete() {
    if (!window.confirm(`Delete "${item.name_en}"? This cannot be undone.`)) return
    setDeleting(true)
    await onDelete(item.id).finally(() => setDeleting(false))
  }

  async function handleSave(data: MenuItemUpdate) {
    await onUpdate(item.id, data)
    setEditing(false)
  }

  return (
    <div className={`border-b border-baroque-border last:border-0 transition-opacity ${!item.is_available ? 'opacity-40' : ''}`}>
      <div className="flex items-center gap-3 py-3">
        {/* Availability dot */}
        <button
          onClick={handleToggle}
          disabled={toggling}
          title={item.is_available ? 'Click to mark unavailable' : 'Click to mark available'}
          className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-200 focus:outline-none ${
            item.is_available ? 'bg-gold hover:bg-gold-dark' : 'bg-baroque-border hover:bg-baroque-muted'
          }`}
        />

        {/* Name */}
        <div className="flex-1 min-w-0 truncate">
          <span className="text-baroque-text text-sm font-medium">{item.name_en}</span>
          {item.name_he && (
            <span className="text-baroque-muted text-xs ml-2" dir="rtl">{item.name_he}</span>
          )}
          {item.is_vegetarian && <span className="text-green-600 text-xs ml-1.5">🌿</span>}
          {item.is_seasonal && <span className="text-amber-600 text-xs ml-1" title="Seasonal">✦</span>}
        </div>

        {/* Price */}
        <span className="text-gold text-sm shrink-0 tabular-nums">
          {formatPrice(item.price_display)}
        </span>

        {/* Edit */}
        <button
          onClick={() => setEditing(e => !e)}
          className="text-xs text-baroque-muted hover:text-baroque-text px-2 py-1 rounded hover:bg-baroque-surface transition-colors"
        >
          {editing ? 'Close' : 'Edit'}
        </button>

        {/* Delete */}
        <button
          onClick={handleDelete}
          disabled={deleting}
          title="Delete item"
          className="text-xs text-baroque-border hover:text-red-500 px-1.5 py-1 rounded hover:bg-baroque-surface transition-colors disabled:opacity-30"
        >
          ✕
        </button>
      </div>

      {editing && (
        <ItemEditForm
          item={item}
          onSave={handleSave}
          onCancel={() => setEditing(false)}
        />
      )}
    </div>
  )
}

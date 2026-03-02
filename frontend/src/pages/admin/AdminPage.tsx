import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAdminMenu } from '../../hooks/useAdminMenu'
import { CATEGORY_META, FOOD_ORDER, DRINK_ORDER } from '../../lib/menu'
import type { MenuItem } from '../../api/client'
import AdminItemRow from './components/AdminItemRow'
import AddItemForm from './components/AddItemForm'

type Tab = 'food' | 'drink'

const TAB_ORDER: Record<Tab, string[]> = {
  food: FOOD_ORDER,
  drink: DRINK_ORDER,
}

function groupByCategory(items: MenuItem[], order: string[]): [string, MenuItem[]][] {
  const map = new Map<string, MenuItem[]>()
  for (const item of items) {
    const bucket = map.get(item.category) ?? []
    bucket.push(item)
    map.set(item.category, bucket)
  }
  const known = order.filter(c => map.has(c)).map(c => [c, map.get(c)!] as [string, MenuItem[]])
  const unknown = [...map.entries()].filter(([c]) => !order.includes(c))
  return [...known, ...unknown]
}

export default function AdminPage() {
  const { user } = useAuth()
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') ?? 'food') as Tab

  const {
    items, loading, error,
    toggleAvailability, updateItem, deleteItem, createItem,
  } = useAdminMenu(tab)

  const grouped = groupByCategory(items, TAB_ORDER[tab])
  const unavailableCount = items.filter(i => !i.is_available).length

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-serif text-gold text-2xl tracking-widest uppercase">Menu Editor</h1>
          <p className="text-baroque-muted text-xs mt-1">
            Logged in as <span className="text-baroque-text">{user?.username}</span>
            {unavailableCount > 0 && (
              <span className="ml-3 text-amber-600">
                · {unavailableCount} item{unavailableCount > 1 ? 's' : ''} hidden from guests
              </span>
            )}
          </p>
        </div>
        <div className="text-baroque-muted text-xs text-right leading-relaxed">
          <p>● Gold = available to guests</p>
          <p>● Grey = hidden</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-baroque-border">
        {(['food', 'drink'] as Tab[]).map(t => (
          <button
            key={t}
            onClick={() => setParams({ tab: t })}
            className={`px-6 py-3 text-sm tracking-widest uppercase font-medium transition-colors duration-150 border-b-2 -mb-px ${
              tab === t
                ? 'border-gold text-gold'
                : 'border-transparent text-baroque-muted hover:text-baroque-text'
            }`}
          >
            {t === 'food' ? 'Food' : 'Drinks'}
          </button>
        ))}
      </div>

      <AddItemForm menuType={tab} onAdd={createItem} />

      {loading && <p className="text-baroque-muted text-sm">Loading…</p>}
      {error && !loading && (
        <div className="card border-red-300 text-red-600 text-sm">{error}</div>
      )}

      {!loading && !error && grouped.map(([category, catItems]) => (
        <section key={category} className="mb-8">
          <div className="flex items-center justify-between border-b border-baroque-border pb-2 mb-1">
            <h2 className="font-serif text-gold text-sm tracking-widest uppercase">
              {CATEGORY_META[category]?.en ?? category}
            </h2>
            <span className="text-baroque-muted text-xs">{catItems.length}</span>
          </div>

          {catItems.map(item => (
            <AdminItemRow
              key={item.id}
              item={item}
              onToggle={toggleAvailability}
              onUpdate={updateItem}
              onDelete={deleteItem}
            />
          ))}
        </section>
      ))}
    </main>
  )
}

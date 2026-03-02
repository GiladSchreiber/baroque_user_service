import { useCallback, useEffect, useState } from 'react'
import { api, type MenuItem, type MenuItemCreate, type MenuItemUpdate } from '../api/client'

export function useAdminMenu(menuType: 'food' | 'drink') {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.menu.list({ menu_type: menuType, include_unavailable: true })
      setItems(data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }, [menuType])

  useEffect(() => { refresh() }, [refresh])

  async function toggleAvailability(item: MenuItem) {
    // Optimistic update
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: !i.is_available } : i))
    try {
      await api.menu.update(item.id, { is_available: !item.is_available })
    } catch {
      // Revert on failure
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_available: item.is_available } : i))
    }
  }

  async function updateItem(id: number, data: MenuItemUpdate) {
    const updated = await api.menu.update(id, data)
    setItems(prev => prev.map(i => i.id === id ? updated : i))
  }

  async function deleteItem(id: number) {
    await api.menu.delete(id)
    setItems(prev => prev.filter(i => i.id !== id))
  }

  async function createItem(data: MenuItemCreate) {
    await api.menu.create(data)
    await refresh() // re-fetch to get correct ordering
  }

  return { items, loading, error, refresh, toggleAvailability, updateItem, deleteItem, createItem }
}

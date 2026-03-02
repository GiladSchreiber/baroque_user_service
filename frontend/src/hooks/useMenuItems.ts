import { useEffect, useState } from 'react'
import { api, type MenuItem } from '../api/client'

export function useMenuItems(menuType: 'food' | 'drink') {
  const [items, setItems] = useState<MenuItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.menu
      .list({ menu_type: menuType })
      .then(setItems)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [menuType])

  return { items, loading, error }
}

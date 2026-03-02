const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('baroque_token')
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...authHeaders(),
    ...(options.headers as Record<string, string>),
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 204) return undefined as T
  if (!res.ok) {
    const body = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(body.detail ?? res.statusText)
  }
  return res.json()
}

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MenuItem {
  id: number
  menu_type: 'food' | 'drink'
  category: string
  name_en: string
  name_he: string | null
  description_en: string | null
  description_he: string | null
  price_display: string
  is_available: boolean
  is_vegetarian: boolean
  is_seasonal: boolean
  position: number
}

export interface MenuItemCreate {
  menu_type: 'food' | 'drink'
  category: string
  name_en: string
  name_he?: string
  description_en?: string
  description_he?: string
  price_display: string
  is_available?: boolean
  is_vegetarian?: boolean
  is_seasonal?: boolean
  position?: number
}

export interface MenuItemUpdate extends Partial<MenuItemCreate> {}

export interface SiteConfig {
  key: string
  value: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface User {
  id: number
  username: string
  role: string
}

// ── API calls ─────────────────────────────────────────────────────────────────

export const api = {
  menu: {
    list: (params?: { menu_type?: string; category?: string; include_unavailable?: boolean }) => {
      const q = new URLSearchParams()
      if (params?.menu_type) q.set('menu_type', params.menu_type)
      if (params?.category) q.set('category', params.category)
      if (params?.include_unavailable) q.set('include_unavailable', 'true')
      return apiFetch<MenuItem[]>(`/menu/items?${q}`)
    },
    get: (id: number) => apiFetch<MenuItem>(`/menu/items/${id}`),
    create: (body: MenuItemCreate) =>
      apiFetch<MenuItem>('/menu/items', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: number, body: MenuItemUpdate) =>
      apiFetch<MenuItem>(`/menu/items/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (id: number) => apiFetch<void>(`/menu/items/${id}`, { method: 'DELETE' }),
    categories: (menu_type?: string) => {
      const q = menu_type ? `?menu_type=${menu_type}` : ''
      return apiFetch<{ menu_type: string; category: string }[]>(`/menu/categories${q}`)
    },
  },

  config: {
    wifi: () => apiFetch<SiteConfig[]>('/config/wifi'),
  },

  auth: {
    login: (username: string, password: string) => {
      const body = new URLSearchParams({ username, password })
      return apiFetch<TokenResponse>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })
    },
    me: () => apiFetch<User>('/auth/me'),
  },
}

import { createContext, useContext, useEffect, useState } from 'react'
import { api, type User } from '../api/client'

interface AuthContextValue {
  user: User | null
  isAdmin: boolean
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('baroque_token')
    if (!token) { setLoading(false); return }
    api.auth.me()
      .then(setUser)
      .catch(() => localStorage.removeItem('baroque_token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(username: string, password: string) {
    const { access_token } = await api.auth.login(username, password)
    localStorage.setItem('baroque_token', access_token)
    const me = await api.auth.me()
    setUser(me)
  }

  function logout() {
    localStorage.removeItem('baroque_token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, isAdmin: user?.role === 'admin', login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

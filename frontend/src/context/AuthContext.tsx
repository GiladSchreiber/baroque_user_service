import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth'
import { auth } from '../lib/firebase'

interface AuthContextValue {
  user: User | null
  editMode: boolean
  setEditMode: (v: boolean) => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]         = useState<User | null>(null)
  const [editMode, setEditMode] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u)
      if (!u) setEditMode(false)
    })
    return unsub
  }, [])

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    setEditMode(false)
    await signOut(auth)
  }

  return (
    <AuthContext.Provider value={{ user, editMode, setEditMode, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

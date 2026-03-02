import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-40 text-baroque-muted text-sm">
      Loading…
    </div>
  )
  if (!user) return <Navigate to="/admin/login" replace />
  return <>{children}</>
}

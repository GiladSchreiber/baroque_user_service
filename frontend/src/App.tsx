import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { LangProvider } from './context/LangContext'
import NavBar from './components/NavBar'
import ProtectedRoute from './components/ProtectedRoute'
import GuestPage from './pages/GuestPage'
import AdminPage from './pages/admin/AdminPage'
import LoginPage from './pages/admin/LoginPage'

function AppLayout() {
  const { pathname } = useLocation()
  return (
    <div className="min-h-screen bg-baroque-bg text-baroque-text">
      {pathname.startsWith('/admin') && <NavBar />}
      <Routes>
        <Route path="/" element={<GuestPage />} />
        <Route path="/admin/login" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute>
              <AdminPage />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <LangProvider>
      <AuthProvider>
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <AppLayout />
        </BrowserRouter>
      </AuthProvider>
    </LangProvider>
  )
}

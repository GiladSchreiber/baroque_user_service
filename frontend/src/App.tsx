import { LangProvider } from './context/LangContext'
import { AuthProvider } from './context/AuthContext'
import GuestPage from './pages/GuestPage'

export default function App() {
  return (
    <AuthProvider>
      <LangProvider>
        <GuestPage />
      </LangProvider>
    </AuthProvider>
  )
}

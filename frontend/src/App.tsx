import { LangProvider } from './context/LangContext'
import GuestPage from './pages/GuestPage'

export default function App() {
  return <LangProvider><GuestPage /></LangProvider>
}

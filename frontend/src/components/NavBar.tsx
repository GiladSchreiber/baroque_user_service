import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLang, type Language } from '../context/LangContext'

export default function NavBar() {
  const { pathname } = useLocation()
  const { user, logout } = useAuth()
  const { lang, setLang } = useLang()

  const link = (to: string, label: string) => (
    <Link
      to={to}
      className={`text-sm tracking-wider uppercase transition-colors duration-150 ${
        pathname === to
          ? 'text-gold border-b border-gold pb-0.5'
          : 'text-baroque-muted hover:text-baroque-text'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <header className="sticky top-0 z-50 bg-baroque-bg border-b border-baroque-border">
      <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link to="/">
          <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Baroque" className="h-7 w-auto" />
        </Link>

        <div className="flex items-center gap-6">
          {/* Nav links */}
          <nav className="flex items-center gap-6">
            {link('/', lang === 'he' ? 'תפריט' : 'Menu')}
            {user
              ? (
                <>
                  {link('/admin', 'Admin')}
                  <button
                    onClick={logout}
                    className="text-sm tracking-wider uppercase text-baroque-muted hover:text-red-500 transition-colors"
                  >
                    {lang === 'he' ? 'יציאה' : 'Logout'}
                  </button>
                </>
              )
              : link('/admin/login', lang === 'he' ? 'כניסה' : 'Login')}
          </nav>

          {/* Language toggle */}
          <div className="flex items-center border border-baroque-border rounded overflow-hidden">
            {(['en', 'he'] as Language[]).map(l => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 text-xs font-medium uppercase tracking-wider transition-colors duration-150 ${
                  lang === l
                    ? 'bg-gold text-white'
                    : 'text-baroque-muted hover:text-baroque-text bg-baroque-bg'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  )
}

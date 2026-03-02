import { createContext, useContext, useState } from 'react'

export type Language = 'en' | 'he'

interface LangContextValue {
  lang: Language
  setLang: (l: Language) => void
  /** Pick the right string for the current language, falling back to English. */
  t: (en: string | null | undefined, he: string | null | undefined) => string
}

const LangContext = createContext<LangContextValue | null>(null)

export function LangProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(
    () => (localStorage.getItem('baroque_lang') as Language) ?? 'en'
  )

  function setLang(l: Language) {
    setLangState(l)
    localStorage.setItem('baroque_lang', l)
  }

  function t(en: string | null | undefined, he: string | null | undefined): string {
    if (lang === 'he') return he || en || ''
    return en || ''
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  )
}

export function useLang() {
  const ctx = useContext(LangContext)
  if (!ctx) throw new Error('useLang must be used inside LangProvider')
  return ctx
}

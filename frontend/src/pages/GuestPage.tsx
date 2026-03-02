import { useRef, useEffect, useState } from 'react'
import { api, type MenuItem } from '../api/client'
import { useMenuItems } from '../hooks/useMenuItems'
import { useLang } from '../context/LangContext'
import CategorySection from '../components/CategorySection'
import { FOOD_ORDER } from '../lib/menu'

const COFFEE_CATEGORIES = ['coffee']
const ALCOHOL_ORDER = ['beer', 'cocktails', 'red_wine', 'white_wine', 'liqueurs', 'soft_drinks']

// ── Dev palette switcher ───────────────────────────────────────────────────────
type PaletteVars = Record<string, string>
const PALETTES: { name: string; swatch: string; vars: PaletteVars }[] = [
  {
    name: 'Black & Gold',
    swatch: '#c9a94d',
    vars: { '--baroque-bg': '#14120f', '--baroque-surface': '#1e1c19', '--baroque-border': '#2e2b27', '--baroque-text': '#f0ebe1', '--baroque-muted': '#8c8580', '--gold': '#c9a94d', '--gold-light': '#dabb61', '--gold-dark': '#a88a38' },
  },
  {
    name: 'Navy & Champagne',
    swatch: '#c8bfa0',
    vars: { '--baroque-bg': '#0d1117', '--baroque-surface': '#161c26', '--baroque-border': '#263040', '--baroque-text': '#e8dfc8', '--baroque-muted': '#7a8a9a', '--gold': '#c8bfa0', '--gold-light': '#ddd5bc', '--gold-dark': '#a09878' },
  },
  {
    name: 'Burgundy & Blush',
    swatch: '#c47a8a',
    vars: { '--baroque-bg': '#120a0e', '--baroque-surface': '#1e1118', '--baroque-border': '#331826', '--baroque-text': '#f0e0e8', '--baroque-muted': '#8a6070', '--gold': '#c47a8a', '--gold-light': '#d99aaa', '--gold-dark': '#a05a6a' },
  },
  {
    name: 'Forest & Copper',
    swatch: '#b07848',
    vars: { '--baroque-bg': '#0a0f0d', '--baroque-surface': '#141f1a', '--baroque-border': '#1f3028', '--baroque-text': '#e8ede6', '--baroque-muted': '#6a8070', '--gold': '#b07848', '--gold-light': '#c89060', '--gold-dark': '#906030' },
  },
  {
    name: 'Plum & Amber',
    swatch: '#d4943a',
    vars: { '--baroque-bg': '#0f0a14', '--baroque-surface': '#1a1220', '--baroque-border': '#2e2040', '--baroque-text': '#ede8f5', '--baroque-muted': '#7a6890', '--gold': '#d4943a', '--gold-light': '#e8aa50', '--gold-dark': '#b07828' },
  },
]

function groupByCategory(items: MenuItem[], order: string[]): [string, MenuItem[]][] {
  const map = new Map<string, MenuItem[]>()
  for (const item of items) {
    const bucket = map.get(item.category) ?? []
    bucket.push(item)
    map.set(item.category, bucket)
  }
  const known = order.filter(c => map.has(c)).map(c => [c, map.get(c)!] as [string, MenuItem[]])
  const unknown = [...map.entries()].filter(([c]) => !order.includes(c))
  return [...known, ...unknown]
}

function MenuSkeleton() {
  return (
    <div className="space-y-10 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i}>
          <div className="h-5 bg-baroque-border rounded w-32 mb-4" />
          {[1, 2, 3].map(j => (
            <div key={j} className="flex justify-between py-4 border-b border-baroque-border">
              <div className="space-y-2 flex-1 pe-8">
                <div className="h-4 bg-baroque-border rounded w-40" />
                <div className="h-3 bg-baroque-border rounded w-56" />
              </div>
              <div className="h-4 bg-baroque-border rounded w-10" />
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export default function GuestPage() {
  const { lang, setLang, t } = useLang()

  const base = import.meta.env.BASE_URL
  const COVER_IMAGES = [
    `${base}images/cover_app1.jpg`,
    `${base}images/cover_app2.jpg`,
    `${base}images/cover_app3.jpg`,
    `${base}images/cover_app4.jpg`,
  ]
  const [coverIdx, setCoverIdx] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setCoverIdx(i => (i + 1) % COVER_IMAGES.length), 2000)
    return () => clearInterval(id)
  }, [])

  const [paletteIdx, setPaletteIdx] = useState(
    () => parseInt(localStorage.getItem('baroque_palette') ?? '1')
  )

  useEffect(() => {
    const vars = PALETTES[paletteIdx].vars
    const root = document.documentElement
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
    localStorage.setItem('baroque_palette', String(paletteIdx))
  }, [paletteIdx])

  const navRef     = useRef<HTMLDivElement>(null)
  const wifiRef    = useRef<HTMLElement>(null)
  const menuRef    = useRef<HTMLElement>(null)
  const foodRef    = useRef<HTMLDivElement>(null)
  const coffeeRef  = useRef<HTMLDivElement>(null)
  const alcoholRef = useRef<HTMLDivElement>(null)

  const [wifi, setWifi]           = useState<{ ssid: string; password: string } | null>(null)
  const [wifiLoading, setWifiLoading] = useState(true)
  const [wifiError, setWifiError] = useState<string | null>(null)
  const [copied, setCopied]       = useState(false)

  const { items: foodItems,  loading: foodLoading,  error: foodError  } = useMenuItems('food')
  const { items: drinkItems, loading: drinkLoading, error: drinkError } = useMenuItems('drink')

  useEffect(() => {
    api.config.wifi()
      .then(entries => {
        const ssid     = entries.find(e => e.key === 'wifi_ssid')?.value     ?? ''
        const password = entries.find(e => e.key === 'wifi_password')?.value ?? ''
        setWifi({ ssid, password })
      })
      .catch((e: Error) => setWifiError(e.message))
      .finally(() => setWifiLoading(false))
  }, [])

  const coffeeItems  = drinkItems.filter(i => COFFEE_CATEGORIES.includes(i.category))
  const alcoholItems = drinkItems.filter(i => ALCOHOL_ORDER.includes(i.category))

  const groupedFood    = groupByCategory(foodItems,    FOOD_ORDER)
  const groupedCoffee  = groupByCategory(coffeeItems,  COFFEE_CATEGORIES)
  const groupedAlcohol = groupByCategory(alcoholItems, ALCOHOL_ORDER)

  function scrollTo(el: HTMLElement | null) {
    el?.scrollIntoView({ behavior: 'smooth' })
  }

  function pickLang(l: 'en' | 'he') {
    setLang(l)
    navRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  async function copyPassword() {
    if (!wifi?.password) return
    await navigator.clipboard.writeText(wifi.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const tabBtn = (label: string, onClick: () => void) => (
    <button
      onClick={onClick}
      className="px-6 py-2 text-xs tracking-widest uppercase font-medium text-baroque-muted hover:text-gold transition-colors duration-150"
    >
      {label}
    </button>
  )

  return (
    <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="bg-baroque-bg text-baroque-text">

      {/* ── HERO ── */}
      <section className="relative h-screen overflow-hidden flex flex-col items-center justify-center gap-12">

        {/* Background slideshow */}
        {COVER_IMAGES.map((src, i) => (
          <img
            key={src}
            src={src}
            alt=""
            aria-hidden
            className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
            style={{
              opacity: i === coverIdx ? 1 : 0,
              filter: 'grayscale(1)',
            }}
          />
        ))}
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70" />

        {/* Content */}
        <img
          src={`${base}logo.png`}
          alt="Baroque"
          className="relative z-10 h-64 w-auto"
          style={{ filter: 'invert(1)' }}
        />
        <div className="relative z-10 flex gap-4">
          <button
            onClick={() => pickLang('he')}
            className={`px-10 py-4 font-serif text-lg tracking-wider border rounded transition-colors duration-200 ${
              lang === 'he'
                ? 'bg-gold text-baroque-bg border-gold'
                : 'border-baroque-border text-baroque-muted hover:border-gold hover:text-baroque-text'
            }`}
          >
            עברית
          </button>
          <button
            onClick={() => pickLang('en')}
            className={`px-10 py-4 font-serif text-lg tracking-wider border rounded transition-colors duration-200 ${
              lang === 'en'
                ? 'bg-gold text-baroque-bg border-gold'
                : 'border-baroque-border text-baroque-muted hover:border-gold hover:text-baroque-text'
            }`}
          >
            English
          </button>
        </div>
      </section>

      {/* ── SECTION NAV ── */}
      <div ref={navRef} className="flex justify-center gap-6 py-8 border-y border-baroque-border">
        <button
          onClick={() => scrollTo(wifiRef.current)}
          className="btn-outline px-8 py-3 text-sm tracking-widest uppercase"
        >
          WiFi
        </button>
        <button
          onClick={() => scrollTo(menuRef.current)}
          className="btn-outline px-8 py-3 text-sm tracking-widest uppercase"
        >
          {t('Menu', 'תפריט')}
        </button>
      </div>

      {/* ── WIFI SECTION ── */}
      <section ref={wifiRef} className="max-w-sm mx-auto px-4 py-16">
        <h2 className="section-title text-center mb-8">WiFi</h2>

        {wifiLoading && (
          <div className="card animate-pulse space-y-4">
            <div className="h-4 bg-baroque-border rounded w-24 mx-auto" />
            <div className="h-6 bg-baroque-border rounded w-40 mx-auto" />
            <div className="h-px bg-baroque-border" />
            <div className="h-4 bg-baroque-border rounded w-20 mx-auto" />
            <div className="h-10 bg-baroque-border rounded" />
          </div>
        )}

        {wifiError && !wifiLoading && (
          <div className="card border-red-900 text-red-400 text-sm text-center">
            {t('Could not load WiFi info', 'לא ניתן לטעון מידע WiFi')}
          </div>
        )}

        {wifi && !wifiLoading && (
          <div className="card space-y-6">
            <div>
              <p className="text-baroque-muted text-xs tracking-widest uppercase mb-1">
                {t('Network', 'רשת')}
              </p>
              <p className="text-baroque-text text-lg font-medium">{wifi.ssid}</p>
            </div>
            <div className="border-t border-baroque-border" />
            <div>
              <p className="text-baroque-muted text-xs tracking-widest uppercase mb-2">
                {t('Password', 'סיסמה')}
              </p>
              <button
                onClick={copyPassword}
                className="w-full flex items-center justify-between bg-baroque-bg border border-baroque-border rounded px-4 py-3 group hover:border-gold transition-colors duration-150"
              >
                <span className="text-baroque-text font-mono tracking-wider">{wifi.password}</span>
                <span className={`text-xs tracking-wide ms-4 shrink-0 transition-colors duration-150 ${
                  copied ? 'text-green-400' : 'text-baroque-muted group-hover:text-gold'
                }`}>
                  {copied ? `✓ ${t('Copied', 'הועתק')}` : t('Tap to copy', 'הקש להעתקה')}
                </span>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* ── MENU SECTION ── */}
      <section ref={menuRef} className="max-w-2xl mx-auto px-4 pb-24">

        {/* Sticky category tabs */}
        <div className="sticky top-0 z-10 bg-baroque-bg border-b border-baroque-border flex -mx-4 px-4 py-2">
          {tabBtn(t('Food', 'אוכל'),         () => scrollTo(foodRef.current))}
          {tabBtn(t('Coffee', 'קפה'),        () => scrollTo(coffeeRef.current))}
          {tabBtn(t('Alcohol', 'אלכוהול'),   () => scrollTo(alcoholRef.current))}
        </div>

        {/* Food subsection */}
        <div ref={foodRef} className="pt-10">
          <h2 className="font-serif text-gold text-xl tracking-widest uppercase mb-6">
            {t('Food', 'אוכל')}
          </h2>
          {foodLoading
            ? <MenuSkeleton />
            : foodError
              ? <div className="card border-red-900 text-red-400 text-sm">{t('Could not load menu', 'לא ניתן לטעון תפריט')}</div>
              : groupedFood.map(([cat, items]) => <CategorySection key={cat} category={cat} items={items} />)
          }
        </div>

        {/* Coffee subsection */}
        <div ref={coffeeRef} className="pt-14">
          <h2 className="font-serif text-gold text-xl tracking-widest uppercase mb-6">
            {t('Coffee', 'קפה')}
          </h2>
          {drinkLoading
            ? <MenuSkeleton />
            : drinkError
              ? <div className="card border-red-900 text-red-400 text-sm">{t('Could not load menu', 'לא ניתן לטעון תפריט')}</div>
              : groupedCoffee.map(([cat, items]) => <CategorySection key={cat} category={cat} items={items} />)
          }
        </div>

        {/* Alcohol subsection */}
        <div ref={alcoholRef} className="pt-14">
          <h2 className="font-serif text-gold text-xl tracking-widest uppercase mb-6">
            {t('Alcohol', 'אלכוהול')}
          </h2>
          {drinkLoading
            ? <MenuSkeleton />
            : drinkError
              ? <div className="card border-red-900 text-red-400 text-sm">{t('Could not load menu', 'לא ניתן לטעון תפריט')}</div>
              : groupedAlcohol.map(([cat, items]) => <CategorySection key={cat} category={cat} items={items} />)
          }
        </div>

      </section>

      {/* ── DEV: Palette picker ── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 bg-baroque-surface border border-baroque-border rounded-full px-4 py-2 shadow-lg">
        <span className="text-baroque-muted text-xs tracking-widest uppercase me-1">Palette</span>
        {PALETTES.map((p, i) => (
          <button
            key={p.name}
            title={p.name}
            onClick={() => setPaletteIdx(i)}
            style={{ backgroundColor: p.swatch }}
            className={`w-6 h-6 rounded-full transition-transform duration-150 ${
              i === paletteIdx ? 'ring-2 ring-offset-2 ring-offset-baroque-surface ring-white scale-110' : 'opacity-60 hover:opacity-100'
            }`}
          />
        ))}
        <span className="text-baroque-muted text-xs ms-1">{PALETTES[paletteIdx].name}</span>
      </div>
    </div>
  )
}

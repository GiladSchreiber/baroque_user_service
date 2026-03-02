import { useRef, useEffect, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useLang } from '../context/LangContext'
import CategorySection from '../components/CategorySection'
import { FOOD_ORDER } from '../lib/menu'
import type { MenuItem } from '../types'

const NAV_HEIGHT       = 76   // height of the sticky main nav
const SUB_NAV_HEIGHT   = 120  // nav + sub-nav bar combined
const SCROLL_TOLERANCE = 4    // px fudge for sub-pixel viewport heights

const COFFEE_CATEGORIES    = ['coffee']
const ALCOHOL_ORDER        = ['beer', 'cocktails', 'red_wine', 'white_wine', 'liqueurs']
const SOFT_DRINKS_CATEGORY = ['soft_drinks']
const PASTRIES_CATEGORY    = ['pastries']
const FOOD_SAVOURY_ORDER   = FOOD_ORDER.filter(c => c !== 'pastries')

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
    () => parseInt(localStorage.getItem('baroque_palette') ?? '4')
  )

  useEffect(() => {
    const vars = PALETTES[paletteIdx].vars
    const root = document.documentElement
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
    localStorage.setItem('baroque_palette', String(paletteIdx))
  }, [paletteIdx])

  const [showScrollTop, setShowScrollTop] = useState(false)
  useEffect(() => {
    const onScroll = () => setShowScrollTop(window.scrollY > 400)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const navRef      = useRef<HTMLDivElement>(null)
  const concertsRef = useRef<HTMLElement>(null)
  const wifiRef     = useRef<HTMLElement>(null)
  const menuRef     = useRef<HTMLElement>(null)
  const foodRef       = useRef<HTMLDivElement>(null)
  const pastriesRef   = useRef<HTMLDivElement>(null)
  const coffeeRef     = useRef<HTMLDivElement>(null)
  const softDrinksRef = useRef<HTMLDivElement>(null)
  const alcoholRef    = useRef<HTMLDivElement>(null)

  const [concertImages, setConcertImages] = useState<string[]>([])

  const [activeMainSection, setActiveMainSection] = useState<'concerts' | 'menu' | 'wifi' | null>(null)
  const [activeMenuSection, setActiveMenuSection] = useState<'food' | 'pastries' | 'coffee' | 'soft_drinks' | 'alcohol'>('food')

  // Scrollspy: last section whose top has crossed the sticky nav wins.
  // This is reliably correct: once a section scrolls past the nav, its
  // getBoundingClientRect().top is ≤ threshold regardless of how far past it you are,
  // so iterating in DOM order and keeping the last match gives the correct active section.
  useEffect(() => {
    const mainOrder = [
      { id: 'concerts' as const, ref: concertsRef },
      { id: 'menu'     as const, ref: menuRef     },
      { id: 'wifi'     as const, ref: wifiRef     },
    ]
    const subOrder = [
      { id: 'food'        as const, ref: foodRef       },
      { id: 'pastries'    as const, ref: pastriesRef   },
      { id: 'coffee'      as const, ref: coffeeRef     },
      { id: 'soft_drinks' as const, ref: softDrinksRef },
      { id: 'alcohol'     as const, ref: alcoholRef    },
    ]
    const onScroll = () => {
      let nextMain: 'concerts' | 'menu' | 'wifi' | null = null
      for (const { id, ref } of mainOrder) {
        if (ref.current && ref.current.getBoundingClientRect().top <= NAV_HEIGHT + SCROLL_TOLERANCE) {
          nextMain = id
        }
      }
      setActiveMainSection(nextMain)

      let nextSub: 'food' | 'pastries' | 'coffee' | 'soft_drinks' | 'alcohol' = 'food'
      for (const { id, ref } of subOrder) {
        if (ref.current && ref.current.getBoundingClientRect().top <= SUB_NAV_HEIGHT + SCROLL_TOLERANCE) {
          nextSub = id
        }
      }
      setActiveMenuSection(nextSub)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll() // set initial state on mount
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const [wifi, setWifi]               = useState<{ ssid: string; password: string } | null>(null)
  const [wifiLoading, setWifiLoading] = useState(true)
  const [wifiError, setWifiError]     = useState<string | null>(null)

  const [allItems, setAllItems]       = useState<MenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError]     = useState<string | null>(null)

  useEffect(() => {
    fetch(`${base}data/concerts.json`)
      .then(r => r.json())
      .then((files: string[]) => setConcertImages(files.sort()))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetch(`${base}data/wifi.json`)
      .then(r => { if (!r.ok) throw new Error('wifi fetch failed'); return r.json() })
      .then(data => setWifi(data))
      .catch((e: Error) => setWifiError(e.message))
      .finally(() => setWifiLoading(false))
  }, [])

  useEffect(() => {
    fetch(`${base}data/menu.json`)
      .then(r => { if (!r.ok) throw new Error('menu fetch failed'); return r.json() })
      .then(data => setAllItems(data))
      .catch((e: Error) => setMenuError(e.message))
      .finally(() => setMenuLoading(false))
  }, [])

  const foodItems       = allItems.filter(i => i.menu_type === 'food' && i.category !== 'pastries')
  const pastriesItems   = allItems.filter(i => i.menu_type === 'food' && i.category === 'pastries')
  const drinkItems      = allItems.filter(i => i.menu_type === 'drink')
  const coffeeItems     = drinkItems.filter(i => COFFEE_CATEGORIES.includes(i.category))
  const softDrinkItems  = drinkItems.filter(i => SOFT_DRINKS_CATEGORY.includes(i.category))
  const alcoholItems    = drinkItems.filter(i => ALCOHOL_ORDER.includes(i.category))

  const groupedFood       = groupByCategory(foodItems,      FOOD_SAVOURY_ORDER)
  const groupedPastries   = groupByCategory(pastriesItems,  PASTRIES_CATEGORY)
  const groupedCoffee     = groupByCategory(coffeeItems,    COFFEE_CATEGORIES)
  const groupedSoftDrinks = groupByCategory(softDrinkItems, SOFT_DRINKS_CATEGORY)
  const groupedAlcohol    = groupByCategory(alcoholItems,   ALCOHOL_ORDER)

  function scrollTo(el: HTMLElement | null) {
    if (!el) return
    const top = el.getBoundingClientRect().top + window.scrollY - NAV_HEIGHT
    window.scrollTo({ top, behavior: 'smooth' })
  }

  function pickLang(l: 'en' | 'he') {
    setLang(l)
    scrollTo(concertsRef.current)
  }

  const tabBtn = (label: string, onClick: () => void, active: boolean) => (
    <button
      onClick={onClick}
      className={`px-3 py-2 text-xs tracking-widest uppercase font-medium transition-colors duration-150 border-b-2 focus:outline-none ${
        active ? 'text-gold border-gold' : 'text-baroque-muted border-transparent'
      }`}
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
        <div dir="ltr" className="relative z-10 flex gap-4">
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
        </div>
      </section>

      {/* ── SECTION NAV ── */}
      <div ref={navRef} className="sticky top-0 z-20 flex justify-center gap-6 py-4 bg-baroque-bg border-y border-baroque-border">
        {(['concerts', 'menu', 'wifi'] as const).map((section) => {
          const label = section === 'concerts' ? t('Concerts', 'הופעות') : section === 'menu' ? t('Menu', 'תפריט') : 'WiFi'
          const ref = section === 'concerts' ? concertsRef : section === 'menu' ? menuRef : wifiRef
          const active = activeMainSection === section
          return (
            <button
              key={section}
              onClick={() => scrollTo(ref.current)}
              className={`px-8 py-3 text-sm tracking-widest uppercase font-medium rounded transition-colors duration-150 border focus:outline-none ${
                active
                  ? 'bg-gold text-baroque-bg border-gold'
                  : 'border-gold/50 text-gold/60'
              }`}
            >
              {label}
            </button>
          )
        })}
      </div>

      {/* ── CONCERTS SECTION ── */}
      <section ref={concertsRef} className="min-h-screen max-w-2xl mx-auto px-4 py-16">
        <h2 className="section-title text-center mb-8">{t('Concerts', 'לוח הופעות')}</h2>
        <div className="flex flex-col gap-4">
          {concertImages.map(file => (
            <img
              key={file}
              src={`${base}images/concerts/${file}`}
              alt=""
              className="w-full rounded"
            />
          ))}
        </div>
      </section>

      <div className="border-t-2 border-baroque-border" />

      {/* ── MENU SECTION ── */}
      <section ref={menuRef} className="max-w-2xl mx-auto px-4 pb-24">

        {/* Sticky category tabs */}
        <div className="sticky top-[76px] z-10 bg-baroque-bg border-b border-baroque-border flex justify-between -mx-4 px-2 py-2">
          {tabBtn(t('Food', 'אוכל'),           () => scrollTo(foodRef.current),       activeMainSection === 'menu' && activeMenuSection === 'food')}
          {tabBtn(t('Pastries', 'מאפים'),      () => scrollTo(pastriesRef.current),   activeMainSection === 'menu' && activeMenuSection === 'pastries')}
          {tabBtn(t('Coffee', 'קפה'),          () => scrollTo(coffeeRef.current),     activeMainSection === 'menu' && activeMenuSection === 'coffee')}
          {tabBtn(t('Soft Drinks', 'שתייה קלה'), () => scrollTo(softDrinksRef.current), activeMainSection === 'menu' && activeMenuSection === 'soft_drinks')}
          {tabBtn(t('Alcohol', 'אלכוהול'),     () => scrollTo(alcoholRef.current),   activeMainSection === 'menu' && activeMenuSection === 'alcohol')}
        </div>

        {/* Food subsection */}
        <div ref={foodRef} className="pt-10">
          {menuLoading ? <MenuSkeleton /> : menuError
            ? <div className="card border-red-900 text-red-400 text-sm">{t('Could not load menu', 'לא ניתן לטעון תפריט')}</div>
            : groupedFood.map(([cat, items]) => <CategorySection key={cat} category={cat} items={items} />)}
        </div>

        {/* Pastries subsection */}
        <div ref={pastriesRef} className="pt-14">
          {menuLoading ? <MenuSkeleton /> : menuError
            ? <div className="card border-red-900 text-red-400 text-sm">{t('Could not load menu', 'לא ניתן לטעון תפריט')}</div>
            : groupedPastries.map(([cat, items]) => <CategorySection key={cat} category={cat} items={items} />)}
        </div>

        {/* Coffee subsection */}
        <div ref={coffeeRef} className="pt-14">
          {menuLoading ? <MenuSkeleton /> : menuError
            ? <div className="card border-red-900 text-red-400 text-sm">{t('Could not load menu', 'לא ניתן לטעון תפריט')}</div>
            : groupedCoffee.map(([cat, items]) => <CategorySection key={cat} category={cat} items={items} />)}
        </div>

        {/* Soft Drinks subsection */}
        <div ref={softDrinksRef} className="pt-14">
          {menuLoading ? <MenuSkeleton /> : menuError
            ? <div className="card border-red-900 text-red-400 text-sm">{t('Could not load menu', 'לא ניתן לטעון תפריט')}</div>
            : groupedSoftDrinks.map(([cat, items]) => <CategorySection key={cat} category={cat} items={items} />)}
        </div>

        {/* Alcohol subsection */}
        <div ref={alcoholRef} className="pt-14">
          {menuLoading ? <MenuSkeleton /> : menuError
            ? <div className="card border-red-900 text-red-400 text-sm">{t('Could not load menu', 'לא ניתן לטעון תפריט')}</div>
            : groupedAlcohol.map(([cat, items]) => <CategorySection key={cat} category={cat} items={items} />)}
        </div>

      </section>

      <div className="border-t-2 border-baroque-border" />

      {/* ── WIFI SECTION ── */}
      <section ref={wifiRef} className="min-h-screen flex flex-col items-center px-4 pt-16">
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
          <div className="card w-72 h-72 flex flex-col items-center justify-center gap-4">
            <QRCodeSVG
              value={`WIFI:T:WPA;S:${wifi.ssid};P:${wifi.password};;`}
              size={140}
              bgColor="#ffffff"
              fgColor="#000000"
              className="rounded"
            />
            <div dir="ltr" className="text-center space-y-3">
              <div>
                <p className="text-baroque-muted text-xs tracking-widest uppercase mb-0.5">{t('Network', 'רשת')}</p>
                <p className="text-baroque-text text-sm">{wifi.ssid}</p>
              </div>
              <div>
                <p className="text-baroque-muted text-xs tracking-widest uppercase mb-0.5">{t('Password', 'סיסמה')}</p>
                <p className="text-baroque-text text-sm font-mono">{wifi.password}</p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ── Scroll to top ── */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-50 w-10 h-10 flex items-center justify-center bg-baroque-surface border border-baroque-border rounded-full text-baroque-muted hover:text-gold hover:border-gold transition-colors duration-150 shadow-lg"
          aria-label="Scroll to top"
        >
          ↑
        </button>
      )}

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

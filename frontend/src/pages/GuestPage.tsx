import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { useLang } from '../context/LangContext'
import CategorySection from '../components/CategorySection'
import type { MenuItem } from '../types'

// ── Types ──────────────────────────────────────────────────────────────────────

type View =
  | 'home'
  | 'concerts'
  | 'menu'
  | 'menu-food'
  | 'menu-coffee'
  | 'menu-alcohol'
  | 'menu-pastries'
  | 'wifi'
  | 'second-hand'

interface ConcertItem {
  file: string
  title: string
  title_he?: string
}

// ── Constants ──────────────────────────────────────────────────────────────────

const FOOD_CATS     = ['bread', 'salads', 'sandwiches', 'toasts', 'soup']
const COFFEE_CATS   = ['coffee', 'soft_drinks']
const ALCOHOL_CATS  = ['beer', 'cocktails', 'red_wine', 'white_wine', 'liqueurs']
const PASTRIES_CATS = ['pastries']

// ── Helpers ────────────────────────────────────────────────────────────────────

function groupByCategory(items: MenuItem[], order: string[]): [string, MenuItem[]][] {
  const map = new Map<string, MenuItem[]>()
  for (const item of items) {
    const bucket = map.get(item.category) ?? []
    bucket.push(item)
    map.set(item.category, bucket)
  }
  const known   = order.filter(c => map.has(c)).map(c => [c, map.get(c)!] as [string, MenuItem[]])
  const unknown = [...map.entries()].filter(([c]) => !order.includes(c))
  return [...known, ...unknown]
}

// ── Sub-components ─────────────────────────────────────────────────────────────

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

interface GridTileProps {
  image: string
  labelEn: string
  labelHe: string
  onClick?: () => void
  animDelay?: number
  animVariant?: 'pop' | 'flip'
  animOut?: boolean
}

function GridTile({ image, labelEn, labelHe, onClick, animDelay = 0, animVariant = 'flip', animOut = false }: GridTileProps) {
  const { t } = useLang()
  return (
    <div
      className={`group relative overflow-hidden ${onClick ? 'cursor-pointer transition-transform duration-150 active:scale-[0.97]' : ''}`}
      style={animOut
        ? { animationName: 'tileFlipOut', animationDuration: '0.3s', animationTimingFunction: 'ease-in', animationFillMode: 'both' }
        : { animationName: animVariant === 'flip' ? 'tileFlipIn' : 'tilePopIn', animationDuration: '0.4s', animationTimingFunction: 'ease-out', animationDelay: `${animDelay}ms`, animationFillMode: 'both' }
      }
      onClick={onClick}
    >
      <img src={image} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover transition-[filter] duration-300 group-hover:brightness-110" />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, var(--baroque-bg) 100%)' }} />
      <div className="absolute top-[12%] left-0 right-0 flex justify-center px-3">
        <span className="bg-baroque-bg text-baroque-text font-serif text-lg tracking-widest uppercase px-4 py-1.5 text-center">
          {t(labelEn, labelHe)}
        </span>
      </div>
    </div>
  )
}

interface MenuCategoryScreenProps {
  cats: string[]
  allItems: MenuItem[]
  loading: boolean
  error: string | null
  fadingOut?: boolean
  categoryImages?: Record<string, string>
  categoryImagePositions?: Record<string, string>
}

function MenuCategoryScreen({ cats, allItems, loading, error, fadingOut = false, categoryImages, categoryImagePositions }: MenuCategoryScreenProps) {
  const { t, lang } = useLang()
  const items   = allItems.filter(i => cats.includes(i.category))
  const grouped = groupByCategory(items, cats)
  return (
    <div
      dir={lang === 'he' ? 'rtl' : 'ltr'}
      className="flex-1 overflow-y-auto px-4 py-6"
      style={{ animation: fadingOut ? 'screenFadeOut 0.3s ease-in both' : 'screenFadeIn 0.4s ease-out both' }}
    >
      {loading
        ? <MenuSkeleton />
        : error
          ? <div className="card border-red-900 text-red-400 text-sm">{t('Could not load menu', 'לא ניתן לטעון תפריט')}</div>
          : grouped.map(([cat, catItems]) => <CategorySection key={cat} category={cat} items={catItems} imageSrc={categoryImages?.[cat]} imagePosition={categoryImagePositions?.[cat]} />)
      }
    </div>
  )
}

interface NoEventsScreenProps {
  base: string
  fadingOut?: boolean
  subtext?: { en: string; he: string }
}

function NoEventsScreen({ base, fadingOut = false, subtext }: NoEventsScreenProps) {
  const { t, lang } = useLang()
  return (
    <div
      className="flex-1 flex flex-col items-center justify-center px-10 py-8"
      style={{ animation: fadingOut ? 'screenFadeOut 0.3s ease-in both' : 'screenFadeIn 0.4s ease-out both' }}
    >
      <div dir={lang === 'he' ? 'rtl' : 'ltr'} className="card w-full flex flex-col items-center gap-5 py-[77px] text-center">
        <p className="text-baroque-text text-2xl font-bold">
          {t('No upcoming events', 'אין אירועים קרובים')}
        </p>
        {subtext && (
          <p className="text-baroque-muted text-base leading-relaxed">
            {t(subtext.en, subtext.he)}
          </p>
        )}
        <a
          href="https://www.instagram.com/baroque_bar_cafe/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-baroque-text hover:text-gold transition-colors duration-150 mt-2"
        >
          <span className="flex items-center justify-center w-4 h-4 shrink-0">
            <img
              src={`${base}images/contact/instagram.svg`}
              alt="Instagram"
              className="w-full h-full"
              style={{ filter: 'invert(85%) sepia(20%) saturate(300%) hue-rotate(5deg)' }}
            />
          </span>
          <span className="text-base">{t('Leave details on Instagram', 'השאירו פרטים באינסטגרם')}</span>
        </a>
      </div>
    </div>
  )
}

interface ConcertsScreenProps {
  concerts: ConcertItem[]
  base: string
  fadingOut?: boolean
}

function ConcertsScreen({ concerts, base, fadingOut = false }: ConcertsScreenProps) {
  const { t } = useLang()
  const [idx, setIdx] = useState(0)
  const [prevIdx, setPrevIdx] = useState<number | null>(null)
  const [dir, setDir] = useState<'left' | 'right'>('left')
  const animating = useRef(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const changeIdx = (newIdx: number, direction: 'left' | 'right') => {
    if (newIdx === idx || animating.current) return
    animating.current = true
    setDir(direction)
    setPrevIdx(idx)
    setIdx(newIdx)
    setTimeout(() => {
      setPrevIdx(null)
      animating.current = false
    }, 300)
  }

  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX)
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX === null || concerts.length === 0) return
    const dx = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(dx) > 50) {
      changeIdx(
        dx < 0 ? (idx + 1) % concerts.length : (idx - 1 + concerts.length) % concerts.length,
        dx < 0 ? 'left' : 'right'
      )
    }
    setTouchStartX(null)
  }

  if (concerts.length === 0) {
    return <NoEventsScreen base={base} fadingOut={fadingOut} subtext={{ en: 'Want to perform here?', he: 'רוצה להופיע כאן?' }} />
  }

  const slideInAnim  = dir === 'left' ? 'slideFromRight' : 'slideFromLeft'
  const slideOutAnim = dir === 'left' ? 'slideOutLeft'   : 'slideOutRight'

  const renderCard = (i: number) => (
    <>
      <p className="shrink-0 text-baroque-text text-xl font-bold tracking-wide px-4 pt-5 pb-1 text-center">
        {t(concerts[i].title, concerts[i].title_he ?? concerts[i].title)}
      </p>
      <div className="flex-1 relative">
        <img
          src={`${base}images/concerts/${concerts[i].file}`}
          alt={concerts[i].title}
          className="absolute inset-0 w-full h-full object-contain"
        />
      </div>
    </>
  )

  return (
    <>
      <style>{`
        @keyframes slideFromRight {
          from { transform: translateX(100%);  }
          to   { transform: translateX(0);     }
        }
        @keyframes slideFromLeft {
          from { transform: translateX(-100%); }
          to   { transform: translateX(0);     }
        }
        @keyframes slideOutLeft {
          from { transform: translateX(0);     }
          to   { transform: translateX(-100%); }
        }
        @keyframes slideOutRight {
          from { transform: translateX(0);    }
          to   { transform: translateX(100%); }
        }
      `}</style>
      <div
        className="flex-1 overflow-hidden flex flex-col"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        style={{ animation: fadingOut ? 'screenFadeOut 0.3s ease-in both' : 'screenFadeIn 0.4s ease-out both' }}
      >
        <div className="flex-1 relative overflow-hidden">
          {/* Outgoing card */}
          {prevIdx !== null && (
            <div
              className="absolute inset-0 flex flex-col"
              style={{ animation: `${slideOutAnim} 0.3s ease-out forwards` }}
            >
              {renderCard(prevIdx)}
            </div>
          )}
          {/* Incoming card */}
          <div
            key={idx}
            className="absolute inset-0 flex flex-col"
            style={prevIdx !== null ? { animation: `${slideInAnim} 0.3s ease-out` } : {}}
          >
            {renderCard(idx)}
          </div>
        </div>
        <div className="flex justify-center gap-3 py-3 shrink-0">
          {concerts.map((_, i) => (
            <button
              key={i}
              onClick={() => changeIdx(i, i > idx ? 'left' : 'right')}
              className={`w-2 h-2 rounded-full transition-colors duration-150 ${
                i === idx ? 'bg-gold' : 'bg-baroque-border'
              }`}
            />
          ))}
        </div>
      </div>
    </>
  )
}

interface WifiScreenProps {
  wifi: { ssid: string; password: string } | null
  loading: boolean
  error: string | null
  fadingOut?: boolean
}

function WifiScreen({ wifi, loading, error, fadingOut = false }: WifiScreenProps) {
  const { t } = useLang()
  return (
    <div
      className="flex-1 overflow-y-auto flex flex-col items-center justify-center px-6 py-8"
      style={{ animation: fadingOut ? 'screenFadeOut 0.3s ease-in both' : 'screenFadeIn 0.4s ease-out both' }}
    >
      {loading && (
        <div className="card animate-pulse space-y-5 w-full">
          <div className="h-48 bg-baroque-border rounded mx-auto w-48" />
          <div className="h-4 bg-baroque-border rounded w-24 mx-auto" />
          <div className="h-6 bg-baroque-border rounded w-48 mx-auto" />
          <div className="h-px bg-baroque-border" />
          <div className="h-4 bg-baroque-border rounded w-20 mx-auto" />
          <div className="h-6 bg-baroque-border rounded w-40 mx-auto" />
        </div>
      )}
      {error && !loading && (
        <div className="card border-red-900 text-red-400 text-sm text-center">
          {t('Could not load WiFi info', 'לא ניתן לטעון מידע WiFi')}
        </div>
      )}
      {wifi && !loading && (
        <div className="card w-full flex flex-col items-center gap-6 py-8">
          <QRCodeSVG
            value={`WIFI:T:WPA;S:${wifi.ssid};P:${wifi.password};;`}
            size={220}
            bgColor="#ffffff"
            fgColor="#000000"
            className="rounded"
          />
          <div dir="ltr" className="text-center space-y-4 w-full">
            <div>
              <p className="text-baroque-muted text-xs tracking-widest uppercase mb-1">{t('Network', 'רשת')}</p>
              <p className="text-baroque-text text-base font-mono">{wifi.ssid}</p>
            </div>
            <div>
              <p className="text-baroque-muted text-xs tracking-widest uppercase mb-1">{t('Password', 'סיסמה')}</p>
              <p className="text-baroque-text text-base font-mono">{wifi.password}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function GuestPage() {
  const { lang, setLang, t } = useLang()
  const base = import.meta.env.BASE_URL

  // ── Image preloading ─────────────────────────────────────────────────────────
  const [imagesReady, setImagesReady] = useState(false)
  useEffect(() => {
    const staticSrcs = [
      `${base}logo.png`,
      `${base}images/categories/concerts.jpg`,
      `${base}images/categories/menu.jpg`,
      `${base}images/categories/wifi.jpeg`,
      `${base}images/categories/yad2.jpeg`,
      `${base}images/categories/food.jpg`,
      `${base}images/categories/coffee.jpg`,
      `${base}images/categories/alcohol.jpeg`,
      `${base}images/categories/pastries.jpg`,
      `${base}images/menu/alcohol/Beers.JPG`,
      `${base}images/menu/alcohol/Amadeus.JPG`,
      `${base}images/menu/alcohol/Wine.JPG`,
      `${base}images/menu/alcohol/HardLiquers.JPG`,
    ]

    const preload = (srcs: string[]) => {
      if (srcs.length === 0) { setImagesReady(true); return }
      let remaining = srcs.length
      const done = () => { if (--remaining === 0) setImagesReady(true) }
      srcs.forEach(src => {
        const img = new Image()
        img.onload = done
        img.onerror = done
        img.src = src
      })
    }

    // Fetch concerts.json first so we can also preload the concert images
    fetch(`${base}data/concerts.json`)
      .then(r => r.json())
      .then((data: ConcertItem[]) => {
        setConcerts(data)
        const concertSrcs = data.map((c: ConcertItem) => `${base}images/concerts/${c.file}`)
        preload([...staticSrcs, ...concertSrcs])
      })
      .catch(() => preload(staticSrcs))
  }, [base])

  // ── Navigation ──────────────────────────────────────────────────────────────
  const [history, setHistory] = useState<View[]>(['home'])
  const view   = history[history.length - 1]
  const goBack  = () => setHistory(h => h.length > 1 ? h.slice(0, -1) : h)
  const goHome  = () => setHistory(['home'])

  const [fadingOut, setFadingOut] = useState(false)
  const FADING_VIEWS: View[] = ['concerts', 'wifi', 'menu-food', 'menu-coffee', 'menu-alcohol', 'menu-pastries', 'second-hand']
  const goBackWithFade = () => {
    if (fadingOut) return
    if (FADING_VIEWS.includes(view)) {
      setFadingOut(true)
      setTimeout(() => { goBack(); setFadingOut(false) }, 300)
    } else {
      goBack()
    }
  }

  const [leaving, setLeaving]       = useState(false)
  const [pendingNav, setPendingNav] = useState<View | null>(null)

  const navigateWithAnim = (v: View) => {
    setLeaving(true)
    setPendingNav(v)
  }

  useEffect(() => {
    if (!leaving || !pendingNav) return
    const timer = setTimeout(() => {
      setHistory(h => [...h, pendingNav])
      setLeaving(false)
      setPendingNav(null)
    }, 320)
    return () => clearTimeout(timer)
  }, [leaving, pendingNav])

  // ── Data ────────────────────────────────────────────────────────────────────
  const [concerts, setConcerts]       = useState<ConcertItem[]>([])
  const [allItems, setAllItems]       = useState<MenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError]     = useState<string | null>(null)
  const [wifi, setWifi]               = useState<{ ssid: string; password: string } | null>(null)
  const [wifiLoading, setWifiLoading] = useState(true)
  const [wifiError, setWifiError]     = useState<string | null>(null)


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

  // ── Render ──────────────────────────────────────────────────────────────────
  const isHome = view === 'home'

  if (!imagesReady) {
    return (
      <div className="h-screen flex items-center justify-center bg-baroque-bg">
        <img
          src={`${base}logo.png`}
          alt="Baroque"
          className="h-12 w-auto animate-pulse"
          style={{ filter: 'invert(1)' }}
        />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-baroque-bg text-baroque-text overflow-hidden">
      {/* ── Header ── */}
      <header className="shrink-0 flex items-center justify-between px-4 border-b border-baroque-border bg-baroque-bg" style={{ height: '62px' }}>
        {/* Lang toggle — always left */}
        <div className="w-10">
          <button
            onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
            className="w-8 h-8 rounded-full border border-gold text-baroque-text text-xs tracking-wider flex items-center justify-center"
          >
            {lang === 'en' ? 'He' : 'En'}
          </button>
        </div>

        {/* Logo */}
        <button onClick={goHome} className="flex items-center focus:outline-none">
          <img
            src={`${base}logo.png`}
            alt="Baroque"
            className="h-9 w-auto"
            style={{ filter: 'invert(1)' }}
          />
        </button>

        {/* Back button — always right */}
        <div className="w-12 flex justify-end">
          {!isHome && (
            <button
              onClick={goBackWithFade}
              className="flex items-center justify-center w-11 h-11 text-baroque-text"
              aria-label={t('Go back', 'חזור')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M5 12h14" />
                <path d="M12 5l7 7-7 7" />
              </svg>
            </button>
          )}
        </div>
      </header>

      {/* ── Screen content ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Home grid */}
        {isHome && (
          <div className="grid grid-cols-2 grid-rows-2 flex-1">
            <GridTile
              image={`${base}images/categories/concerts.jpg`}
              labelEn="Concerts"
              labelHe="לוח הופעות"
              onClick={() => navigateWithAnim('concerts')}
              animDelay={0}   animOut={leaving}
            />
            <GridTile
              image={`${base}images/categories/menu.jpg`}
              labelEn="Menu"
              labelHe="תפריט"
              onClick={() => navigateWithAnim('menu')}
              animDelay={100} animOut={leaving}
            />
            <GridTile
              image={`${base}images/categories/wifi.jpeg`}
              labelEn="WiFi"
              labelHe="WiFi"
              onClick={() => navigateWithAnim('wifi')}
              animDelay={200} animOut={leaving}
            />
            <GridTile
              image={`${base}images/categories/yad2.jpeg`}
              labelEn="Second Hand"
              labelHe="יד שנייה"
              onClick={() => navigateWithAnim('second-hand')}
              animDelay={300} animOut={leaving}
            />
          </div>
        )}

        {/* Menu sub-grid */}
        {view === 'menu' && (
          <div className="grid grid-cols-2 grid-rows-2 flex-1">
            <GridTile
              image={`${base}images/categories/food.jpg`}
              labelEn="Food"
              labelHe="מטבח"
              onClick={() => navigateWithAnim('menu-food')}
              animVariant="flip" animDelay={0}   animOut={leaving}
            />
            <GridTile
              image={`${base}images/categories/coffee.jpg`}
              labelEn="Coffee"
              labelHe="קפה"
              onClick={() => navigateWithAnim('menu-coffee')}
              animVariant="flip" animDelay={100} animOut={leaving}
            />
            <GridTile
              image={`${base}images/categories/alcohol.jpeg`}
              labelEn="Alcohol"
              labelHe="אלכוהול"
              onClick={() => navigateWithAnim('menu-alcohol')}
              animVariant="flip" animDelay={200} animOut={leaving}
            />
            <GridTile
              image={`${base}images/categories/pastries.jpg`}
              labelEn="Pastries"
              labelHe="מאפים"
              onClick={() => navigateWithAnim('menu-pastries')}
              animVariant="flip" animDelay={300} animOut={leaving}
            />
          </div>
        )}

        {/* Concerts screen */}
        {view === 'concerts' && <ConcertsScreen concerts={concerts} base={base} fadingOut={fadingOut} />}

        {/* Menu category screens */}
        {view === 'menu-food'     && <MenuCategoryScreen cats={FOOD_CATS}     allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut} />}
        {view === 'menu-coffee'   && <MenuCategoryScreen cats={COFFEE_CATS}   allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut} />}
        {view === 'menu-alcohol'  && <MenuCategoryScreen cats={ALCOHOL_CATS}  allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut} categoryImages={{
          beer:       `${base}images/menu/alcohol/Beers.JPG`,
          cocktails:  `${base}images/menu/alcohol/Amadeus.JPG`,
          red_wine:   `${base}images/menu/alcohol/Wine.JPG`,
          white_wine: `${base}images/menu/alcohol/Wine.JPG`,
          liqueurs:   `${base}images/menu/alcohol/HardLiquers.JPG`,
        }} categoryImagePositions={{
          cocktails:  'center 30%',
          red_wine:   'center 80%',
          white_wine: 'center 80%',
          liqueurs:   'center 60%',
        }} />}
        {view === 'menu-pastries' && <MenuCategoryScreen cats={PASTRIES_CATS} allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut} />}

        {/* WiFi screen */}
        {view === 'wifi' && <WifiScreen wifi={wifi} loading={wifiLoading} error={wifiError} fadingOut={fadingOut} />}

        {/* Second Hand screen */}
        {view === 'second-hand' && <NoEventsScreen base={base} fadingOut={fadingOut} subtext={{ en: 'Have items to sell or share?', he: 'יש לך פריטים למכור או לשתף?' }} />}

      </div>

      {/* ── Footer ── */}
      <footer className="shrink-0 flex items-center justify-center gap-8 px-4 pt-4 pb-safe border-t border-baroque-border">
        <a
          href="https://www.instagram.com/baroque_bar_cafe/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-baroque-text hover:text-gold transition-colors duration-150"
        >
          <span className="flex items-center justify-center w-4 h-4 shrink-0">
            <img
              src={`${base}images/contact/instagram.svg`}
              alt="Instagram"
              className="w-full h-full opacity-70"
              style={{ filter: 'invert(85%) sepia(20%) saturate(300%) hue-rotate(5deg)' }}
            />
          </span>
          <span className="text-[0.8rem] tracking-wide">baroque_bar_cafe</span>
        </a>
        <a
          href="https://maps.app.goo.gl/FjLkesBsqfSLR1X99"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-baroque-text hover:text-gold transition-colors duration-150"
        >
          <span className="text-[0.8rem] tracking-wide">{t('Ben Sira 3, Jerusalem', 'בן סירא 3, ירושלים')}</span>
          <span className="flex items-center justify-center w-4 h-4 shrink-0">
            <img
              src={`${base}images/contact/location.svg`}
              alt="Location"
              className="w-full h-full opacity-70"
              style={{ filter: 'invert(85%) sepia(20%) saturate(300%) hue-rotate(5deg)' }}
            />
          </span>
        </a>
      </footer>
    </div>
  )
}

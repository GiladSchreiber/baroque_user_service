import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useLang } from '../context/LangContext'
import CategorySection, { type DishImage } from '../components/CategorySection'
import FoodCategorySection from '../components/FoodCategorySection'
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
  | 'gallery'

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
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.6) 100%)' }} />
      <div className="absolute top-0 left-0 right-0 flex justify-center pt-4">
        <span className="border border-white/40 text-white font-serif text-sm tracking-widest uppercase px-5 py-2.5 bg-black/20 backdrop-blur-sm text-center w-40">
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
  allDishImages?: DishImage[]
  layout?: 'list' | 'grid'
  categoryItemImages?: Record<string, string>
  defaultItemImage?: string
}

function MenuCategoryScreen({ cats, allItems, loading, error, fadingOut = false, categoryImages, categoryImagePositions, allDishImages, layout = 'list', categoryItemImages, defaultItemImage }: MenuCategoryScreenProps) {
  const { t, lang } = useLang()
  const items   = allItems.filter(i => cats.includes(i.category))
  const grouped = groupByCategory(items, cats)
  return (
    <div
      dir={lang === 'he' ? 'rtl' : 'ltr'}
      className="flex-1 overflow-y-auto px-4 pb-6"
      style={{ animation: fadingOut ? 'screenFadeOut 0.3s ease-in both' : 'screenFadeIn 0.4s ease-out both' }}
    >
      {loading
        ? <MenuSkeleton />
        : error
          ? <div className="card border-red-900 text-red-400 text-sm">{t('Could not load menu', 'לא ניתן לטעון תפריט')}</div>
          : <>
              {layout === 'grid'
                ? grouped.map(([cat, catItems]) => <FoodCategorySection key={cat} category={cat} items={catItems} itemImage={categoryItemImages?.[cat] ?? defaultItemImage ?? ''} />)
                : grouped.map(([cat, catItems]) => <CategorySection key={cat} category={cat} items={catItems} imageSrc={categoryImages?.[cat]} imagePosition={categoryImagePositions?.[cat]} />)
              }
              {allDishImages && allDishImages.length > 0 && (
                <div className="grid grid-cols-2 gap-2 -mx-4">
                  {allDishImages.map((img, i) => (
                    <div key={i} className="relative aspect-square overflow-hidden">
                      <img src={img.src} alt={img.labelEn} className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)' }} />
                      <div className="absolute top-0 left-0 right-0 flex justify-center pt-3">
                        <span className="border border-white/40 text-white font-serif text-xs tracking-widest uppercase px-3 py-1.5 bg-black/20 backdrop-blur-sm text-center w-4/5">
                          {t(img.labelEn, img.labelHe)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
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
      className="flex-1 bg-baroque-surface flex flex-col items-center justify-center px-6 py-8"
      style={{ animation: fadingOut ? 'screenFadeOut 0.3s ease-in both' : 'screenFadeIn 0.4s ease-out both' }}
    >
      {loading && (
        <div className="animate-pulse space-y-5 w-full flex flex-col items-center">
          <div className="h-48 bg-baroque-border rounded w-48" />
          <div className="h-4 bg-baroque-border rounded w-24" />
          <div className="h-6 bg-baroque-border rounded w-48" />
          <div className="h-px bg-baroque-border w-full" />
          <div className="h-4 bg-baroque-border rounded w-20" />
          <div className="h-6 bg-baroque-border rounded w-40" />
        </div>
      )}
      {error && !loading && (
        <p className="text-red-400 text-sm text-center">
          {t('Could not load WiFi info', 'לא ניתן לטעון מידע WiFi')}
        </p>
      )}
      {wifi && !loading && (
        <div className="flex flex-col items-center gap-6">
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

// ── Gallery screen ─────────────────────────────────────────────────────────────

interface GalleryScreenProps {
  images: string[]
  base: string
  fadingOut?: boolean
}

function GalleryScreen({ images, base, fadingOut = false }: GalleryScreenProps) {
  const { t } = useLang()
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [prevLbIdx, setPrevLbIdx]     = useState<number | null>(null)
  const [lbDir, setLbDir]             = useState<'left' | 'right'>('left')
  const lbAnimating                   = useRef(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)

  const changeLbIdx = (newIdx: number, direction: 'left' | 'right') => {
    if (lightboxIdx === null || newIdx === lightboxIdx || lbAnimating.current) return
    lbAnimating.current = true
    setLbDir(direction)
    setPrevLbIdx(lightboxIdx)
    setLightboxIdx(newIdx)
    setTimeout(() => { setPrevLbIdx(null); lbAnimating.current = false }, 300)
  }

  const onTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX)
  const onTouchEnd   = (e: React.TouchEvent) => {
    if (touchStartX === null || lightboxIdx === null) return
    const dx = e.changedTouches[0].clientX - touchStartX
    if (Math.abs(dx) > 50) {
      changeLbIdx(
        dx < 0 ? (lightboxIdx + 1) % images.length : (lightboxIdx - 1 + images.length) % images.length,
        dx < 0 ? 'left' : 'right'
      )
    }
    setTouchStartX(null)
  }

  const slideInAnim  = lbDir === 'left' ? 'slideFromRight' : 'slideFromLeft'
  const slideOutAnim = lbDir === 'left' ? 'slideOutLeft'   : 'slideOutRight'

  return (
    <>
      <style>{`
        @keyframes gallerySlideFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        @keyframes gallerySlideFromLeft  { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        @keyframes gallerySlideOutLeft   { from { transform: translateX(0); } to { transform: translateX(-100%); } }
        @keyframes gallerySlideOutRight  { from { transform: translateX(0); } to { transform: translateX(100%); } }
      `}</style>

      {/* Grid */}
      <div
        className="flex-1 overflow-y-auto"
        style={{ animation: fadingOut ? 'screenFadeOut 0.3s ease-in both' : 'screenFadeIn 0.4s ease-out both' }}
      >
        <div className="columns-2 gap-1 px-1 pb-6">
          {images.map((src, i) => (
            <button
              key={i}
              onClick={() => setLightboxIdx(i)}
              className="w-full mb-1 block focus:outline-none"
            >
              <img
                src={`${base}${src}`}
                alt=""
                aria-hidden
                loading="lazy"
                className="w-full block"
              />
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 z-[60] bg-baroque-bg flex flex-col"
          style={{ animation: 'screenFadeIn 0.3s ease-out both' }}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Counter + close */}
          <div className="shrink-0 flex items-center justify-between px-4 py-3">
            <span className="text-baroque-muted text-sm tabular-nums">{lightboxIdx + 1} / {images.length}</span>
            <button
              onClick={() => setLightboxIdx(null)}
              className="w-11 h-11 flex items-center justify-center text-baroque-text"
              aria-label={t('Close', 'סגור')}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Sliding image area */}
          <div className="flex-1 relative overflow-hidden">
            {prevLbIdx !== null && (
              <div
                className="absolute inset-0"
                style={{ animation: `gallery${slideOutAnim.charAt(0).toUpperCase() + slideOutAnim.slice(1)} 0.3s ease-out forwards` }}
              >
                <img src={`${base}${images[prevLbIdx]}`} alt="" className="w-full h-full object-contain" />
              </div>
            )}
            <div
              key={lightboxIdx}
              className="absolute inset-0"
              style={prevLbIdx !== null ? { animation: `gallery${slideInAnim.charAt(0).toUpperCase() + slideInAnim.slice(1)} 0.3s ease-out` } : {}}
            >
              <img src={`${base}${images[lightboxIdx]}`} alt="" className="w-full h-full object-contain" />
            </div>
          </div>

          {/* Dots */}
          <div className="flex justify-center gap-3 py-3 shrink-0">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => changeLbIdx(i, i > (lightboxIdx ?? 0) ? 'left' : 'right')}
                className={`w-2 h-2 rounded-full transition-colors duration-150 ${i === lightboxIdx ? 'bg-gold' : 'bg-baroque-border'}`}
              />
            ))}
          </div>
        </div>
      )}
    </>
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
      `${base}images/cover_app1.jpg`,
      `${base}images/cover_app2.jpg`,
      `${base}images/cover_app3.jpg`,
      `${base}images/cover_app4.jpg`,
      `${base}images/categories/concerts.jpg`,
      `${base}images/categories/menu.jpg`,
      `${base}images/categories/wifi.jpeg`,
      `${base}images/categories/yad2.jpeg`,
      `${base}images/categories/food.jpg`,
      `${base}images/categories/coffee.jpg`,
      `${base}images/categories/alcohol.jpeg`,
      `${base}images/categories/pastries.jpg`,
      `${base}images/menu/pastries/sweet.jpeg`,
      `${base}images/menu/coffee/cafe.JPG`,
      `${base}images/menu/coffee/orange.JPG`,
      `${base}images/menu/food/egg_salad.jpeg`,
      `${base}images/menu/food/soup.jpg`,
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
  const FADING_VIEWS: View[] = ['concerts', 'wifi', 'menu-food', 'menu-coffee', 'menu-alcohol', 'menu-pastries', 'gallery']
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

  // ── Hardware / browser back button ───────────────────────────────────────────
  useEffect(() => { window.history.replaceState(null, '') }, [])
  useEffect(() => {
    if (history.length > 1) window.history.pushState(null, '')
  }, [history.length])
  const goBackFnRef = useRef(goBackWithFade)
  useEffect(() => { goBackFnRef.current = goBackWithFade })
  useEffect(() => {
    const handler = () => goBackFnRef.current()
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  // ── Data ────────────────────────────────────────────────────────────────────
  const [concerts, setConcerts]       = useState<ConcertItem[]>([])
  const [allItems, setAllItems]       = useState<MenuItem[]>([])
  const [menuLoading, setMenuLoading] = useState(true)
  const [menuError, setMenuError]     = useState<string | null>(null)
  const [wifi, setWifi]               = useState<{ ssid: string; password: string } | null>(null)
  const [wifiLoading, setWifiLoading] = useState(true)
  const [wifiError, setWifiError]     = useState<string | null>(null)
  const [galleryImages, setGalleryImages] = useState<string[]>([])

  // ── First home visit tracking ────────────────────────────────────────────────
  const firstHomeLoad = useRef(true)
  useEffect(() => { if (view !== 'home') firstHomeLoad.current = false }, [view])

  // ── Cover slideshow (cover_app3 visible from start, cycling begins after animations) ──
  const coverImages = [
    `${base}images/cover_app1.jpg`,
    `${base}images/cover_app2.jpg`,
    `${base}images/cover_app3.jpg`,
    `${base}images/cover_app4.jpg`,
  ]
  const [coverIndex, setCoverIndex] = useState(2)
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>
    const timeout = setTimeout(() => {
      interval = setInterval(() => setCoverIndex(i => (i + 1) % coverImages.length), 4000)
    }, 3000)
    return () => { clearTimeout(timeout); clearInterval(interval) }
  }, [])

  useEffect(() => {
    getDoc(doc(db, 'config', 'wifi'))
      .then(snap => {
        if (!snap.exists()) throw new Error('wifi doc not found')
        setWifi(snap.data() as { ssid: string; password: string })
      })
      .catch((e: Error) => setWifiError(e.message))
      .finally(() => setWifiLoading(false))
  }, [])

  useEffect(() => {
    fetch(`${base}data/gallery.json`)
      .then(r => r.json())
      .then((data: string[]) => setGalleryImages(data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    getDocs(collection(db, 'menu_items'))
      .then(snap => {
        const items = snap.docs.map(d => d.data() as MenuItem)
        setAllItems(items)
      })
      .catch((e: Error) => setMenuError(e.message))
      .finally(() => setMenuLoading(false))
  }, [])

  // ── Render ──────────────────────────────────────────────────────────────────
  const isHome = view === 'home'

  if (!imagesReady) {
    return (
      <div className="h-screen flex flex-col bg-baroque-bg overflow-hidden">
        {/* Content — mirrors landing page layout exactly */}
        <div className="flex-1 flex flex-col items-center justify-center overflow-hidden">
          <div className="flex flex-col items-center gap-10 px-8 w-full">
            {/* Logo + tagline grouped together — same as landing page */}
            <div className="flex flex-col items-center gap-3">
              <img
                src={`${base}logo.png`}
                alt="Baroque"
                className="h-16 w-auto animate-pulse"
                style={{ filter: 'invert(1)' }}
              />
              <p className="text-xs tracking-[0.35em]" style={{ opacity: 0 }}>Bar · Cafe · Art</p>
            </div>
            {/* Buttons placeholder */}
            <div className="flex flex-col gap-3 w-48" style={{ opacity: 0, pointerEvents: 'none' }}>
              {['a', 'b', 'c', 'd'].map(k => <div key={k} className="py-3 text-sm">x</div>)}
            </div>
          </div>
        </div>
        {/* Footer spacer — same height as real footer so logo lands in the right spot */}
        <footer className="shrink-0 flex items-center justify-center px-4 pt-4 pb-safe border-t border-baroque-border opacity-0 pointer-events-none">
          <span className="text-[0.8rem]">placeholder</span>
        </footer>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-baroque-bg text-baroque-text overflow-hidden">
      {/* ── Lang toggle — fixed, always visible, never fades ── */}
      <div className="fixed top-[21px] left-4 z-50">
        <button
          onClick={() => setLang(lang === 'en' ? 'he' : 'en')}
          className="w-11 h-11 rounded-full border border-gold text-baroque-text text-sm tracking-wider flex items-center justify-center bg-baroque-bg/80"
        >
          {lang === 'en' ? 'He' : 'En'}
        </button>
      </div>

      {/* ── Header (hidden on home) ── */}
      {!isHome && <header className="shrink-0 flex items-center justify-between px-4 border-b border-baroque-border bg-baroque-bg" style={{ height: '86px' }}>
        {/* Spacer — same width as toggle to keep logo centered */}
        <div className="w-12" />

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
      </header>}

      {/* ── Screen content ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-baroque-surface">

        {/* Home screen */}
        {isHome && (
          <div className="relative flex-1 flex flex-col items-center justify-center overflow-hidden" style={{ animation: leaving ? 'screenFadeOut 0.3s ease-in both' : 'screenFadeIn 0.4s ease-out both' }}>
            {/* Rotating background images + overlay */}
            <div className="absolute inset-0">
              {coverImages.map((src, i) => (
                <img
                  key={src}
                  src={src}
                  alt=""
                  aria-hidden
                  className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000"
                  style={{ opacity: i === coverIndex ? 1 : 0 }}
                />
              ))}
              <div className="absolute inset-0 bg-black/75" />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center gap-10 px-8 w-full">
              {/* Logo + tagline */}
              <div className="flex flex-col items-center gap-3">
                <img src={`${base}logo.png`} alt="Baroque" className="h-16 w-auto" style={{ filter: 'invert(1)' }} />
                <p className="flex items-center gap-2 text-white/60 text-xs tracking-[0.35em] uppercase">
                  {[
                    { text: 'Bar',  delay: 0.4 },
                    { text: '·',   delay: 0.75 },
                    { text: 'Cafe', delay: 1.0 },
                    { text: '·',   delay: 1.35 },
                    { text: 'Art',  delay: 1.6 },
                  ].map(({ text, delay }, i) => (
                    <span key={i} style={firstHomeLoad.current ? { animation: `screenFadeIn 0.7s ease-out ${delay}s both` } : undefined}>
                      {text}
                    </span>
                  ))}
                </p>
              </div>

              {/* Nav buttons */}
              <div
                className="flex flex-col gap-3 w-48"
                style={firstHomeLoad.current ? { animation: 'screenFadeIn 0.4s ease-out 2.3s both' } : undefined}
              >
                {([
                  { v: 'menu'        as View, en: 'Menu',    he: 'תפריט'  },
                  { v: 'concerts'    as View, en: 'Events',  he: 'הופעות' },
                  { v: 'gallery'     as View, en: 'Gallery', he: 'גלריה'  },
                  { v: 'wifi'        as View, en: 'WiFi',    he: 'WiFi'   },
                ] as const).map(({ v, en, he }) => (
                  <button
                    key={v}
                    onClick={() => navigateWithAnim(v)}
                    className="border border-white/40 text-white font-serif tracking-widest uppercase text-sm py-3 bg-black/20 backdrop-blur-sm active:bg-white/10 transition-colors"
                  >
                    {t(en, he)}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Menu sub-grid */}
        {view === 'menu' && (
          <div className="grid grid-cols-2 grid-rows-2 flex-1">
            <GridTile
              image={`${base}images/categories/food.jpg`}
              labelEn="Food" labelHe="מטבח"
              onClick={() => navigateWithAnim('menu-food')}
              animVariant="flip" animDelay={0}   animOut={leaving}
            />
            <GridTile
              image={`${base}images/categories/coffee.jpg`}
              labelEn="Coffee" labelHe="קפה"
              onClick={() => navigateWithAnim('menu-coffee')}
              animVariant="flip" animDelay={100} animOut={leaving}
            />
            <GridTile
              image={`${base}images/categories/alcohol.jpeg`}
              labelEn="Alcohol" labelHe="אלכוהול"
              onClick={() => navigateWithAnim('menu-alcohol')}
              animVariant="flip" animDelay={200} animOut={leaving}
            />
            <GridTile
              image={`${base}images/categories/pastries.jpg`}
              labelEn="Pastries" labelHe="מאפים"
              onClick={() => navigateWithAnim('menu-pastries')}
              animVariant="flip" animDelay={300} animOut={leaving}
            />
          </div>
        )}

        {/* Concerts screen */}
        {view === 'concerts' && <ConcertsScreen concerts={concerts} base={base} fadingOut={fadingOut} />}

        {/* Menu category screens */}
        {view === 'menu-food'     && <MenuCategoryScreen cats={FOOD_CATS}     allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut}
          categoryImages={{
            soup:        `${base}images/menu/food/soup.jpg`,
            salads:      `${base}images/menu/food/tomatoe_salad.JPG`,
            bread:       `${base}images/menu/food/artichoke_roasted_tomatoes.JPG`,
            sandwiches:  `${base}images/menu/food/mortadela2.JPG`,
            toasts:      `${base}images/menu/food/ham_cheese.JPG`,
          }}
          categoryImagePositions={{ toasts: 'center 30%' }}
          allDishImages={[
            { src: `${base}images/menu/food/eggplant.JPG`,                  labelEn: 'Eggplant & Matbucha',   labelHe: 'חציל מטבוחה' },
            { src: `${base}images/menu/food/artichoke_roasted_tomatoes.JPG`,labelEn: 'Artichoke & Tomatos',   labelHe: 'ארטישוק עגבניות צלויות' },
            { src: `${base}images/menu/food/tomatoe_salad.JPG`,             labelEn: 'Tomato Salad',          labelHe: 'סלט עגבניות' },
            { src: `${base}images/menu/food/mortadela2.JPG`,                labelEn: 'Mortadella',            labelHe: 'מורטדלה' },
            { src: `${base}images/menu/food/egg_salad.JPG`,                 labelEn: 'Egg Salad',             labelHe: 'סלט ביצים' },
            { src: `${base}images/menu/food/srtichoke_sandwitch.JPG`,       labelEn: 'Artichoke',             labelHe: 'ארטישוק' },
            { src: `${base}images/menu/food/toasts.jpg`,                    labelEn: 'Pesto Gouda',           labelHe: 'פסטו גאודה' },
            { src: `${base}images/menu/food/ham_cheese.JPG`,                labelEn: 'Pastrami & Cheese',     labelHe: 'פסטרמה מוצרלה' },
            { src: `${base}images/menu/food/gaude_pickled_lemon.JPG`,       labelEn: 'Gouda & Pickled Lemon', labelHe: 'גאודה לימון כבוש' },
            { src: `${base}images/menu/food/soup.jpg`,                      labelEn: 'Soup',                  labelHe: 'מרק' },
          ]}
        />}
        {view === 'menu-coffee'   && <MenuCategoryScreen cats={COFFEE_CATS}   allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut} categoryImages={{ coffee: `${base}images/menu/coffee/cafe.JPG`, soft_drinks: `${base}images/menu/coffee/vibe.jpg` }} categoryImagePositions={{ coffee: 'center 100%', soft_drinks: 'center 85%' }} />}
        {view === 'menu-alcohol'  && <MenuCategoryScreen cats={ALCOHOL_CATS}  allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut} categoryImages={{ beer: `${base}images/menu/alcohol/Beers.JPG`, cocktails: `${base}images/menu/alcohol/Amadeus.JPG`, red_wine: `${base}images/menu/alcohol/Wine.JPG`, white_wine: `${base}images/menu/alcohol/Wine.JPG`, liqueurs: `${base}images/menu/alcohol/HardLiquers.JPG` }} categoryImagePositions={{ cocktails: 'center 30%', red_wine: 'center 80%', white_wine: 'center 80%', liqueurs: 'center 60%' }} />}
        {view === 'menu-pastries' && <MenuCategoryScreen cats={PASTRIES_CATS} allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut}
          categoryImages={{ pastries: `${base}images/menu/pastries/Pastries.JPG` }}
          categoryImagePositions={{ pastries: 'center 50%' }}
          allDishImages={[
            { src: `${base}images/menu/pastries/brownies.JPG`,  labelEn: 'Brownies',   labelHe: 'בראוניז' },
            { src: `${base}images/menu/pastries/croason.jpeg`,  labelEn: 'Croissant',  labelHe: 'קרואסון' },
            { src: `${base}images/menu/pastries/lemon_pie.jpg`, labelEn: 'Lemon Pie',  labelHe: 'פאי לימון' },
            { src: `${base}images/menu/pastries/tart_2.JPG`,    labelEn: 'Tart',       labelHe: 'טארט' },
            { src: `${base}images/menu/pastries/borekas.jpg`,   labelEn: 'Burrekas',   labelHe: 'בורקסים' },
          ]}
        />}

        {/* WiFi screen */}
        {view === 'wifi' && <WifiScreen wifi={wifi} loading={wifiLoading} error={wifiError} fadingOut={fadingOut} />}

        {/* Gallery screen */}
        {view === 'gallery' && <GalleryScreen images={galleryImages} base={base} fadingOut={fadingOut} />}

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

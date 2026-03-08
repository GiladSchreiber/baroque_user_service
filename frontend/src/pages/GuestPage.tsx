import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { collection, getDocs, doc, getDoc, updateDoc, deleteDoc, addDoc, setDoc, query, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { uploadImage } from '../lib/storage'
import { useLang } from '../context/LangContext'
import { useAuth } from '../context/AuthContext'
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
  id?: string
  title: string
  title_he: string
  date?: string
  poster_url: string
}

interface GalleryItem {
  id?: string
  url: string
  order: number
}

// ── Constants ──────────────────────────────────────────────────────────────────

const FOOD_CATS     = ['bread', 'salads', 'sandwiches', 'toasts', 'soup']
const COFFEE_CATS   = ['coffee', 'soft_drinks']
const ALCOHOL_CATS  = ['beer', 'cocktails', 'red_wine', 'white_wine', 'liqueurs']
const PASTRIES_CATS = ['pastries']

// ── Helpers ────────────────────────────────────────────────────────────────────

const resolveUrl = (url: string, base: string) => url.startsWith('http') ? url : `${base}${url}`

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

function CoverEditor({ coverItems, onAdd, onDelete }: { coverItems: GalleryItem[], onAdd: (f: File) => Promise<void>, onDelete: (id: string) => Promise<void> }) {
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  return (
    <div className="flex flex-wrap justify-center gap-2 max-w-xs">
      {coverItems.map(c => (
        <div key={c.id} className="relative w-12 h-12 rounded overflow-hidden">
          <img src={c.url} className="w-full h-full object-cover" alt="" />
          <button onClick={() => c.id && onDelete(c.id)} className="absolute inset-0 flex items-center justify-center bg-black/50 text-white text-xs">✕</button>
        </div>
      ))}
      <input ref={fileRef} type="file" accept="image/*" className="hidden"
        onChange={async e => {
          const f = e.target.files?.[0]; if (!f) return
          setUploading(true); try { await onAdd(f) } finally { setUploading(false); e.target.value = '' }
        }}
      />
      <button onClick={() => fileRef.current?.click()} disabled={uploading}
        className="w-12 h-12 rounded border border-dashed border-white/40 text-white/60 text-lg flex items-center justify-center disabled:opacity-50">
        {uploading ? '…' : '+'}
      </button>
    </div>
  )
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
  menuType: string
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
  editMode?: boolean
  onUpdate?: (id: string, changes: Partial<MenuItem>) => void
  onDelete?: (id: string) => void
  onAdd?: (item: Omit<MenuItem, 'id'>) => void
  onUpdateBanner?: (category: string, file: File) => Promise<void>
  onUpdateDishImages?: (images: DishImage[]) => Promise<void>
}

const EMPTY_DISH = { labelEn: '', labelHe: '', file: null as File | null }

function MenuCategoryScreen({ cats, menuType, allItems, loading, error, fadingOut = false, categoryImages, categoryImagePositions, allDishImages, layout = 'list', categoryItemImages, defaultItemImage, editMode, onUpdate, onDelete, onAdd, onUpdateBanner, onUpdateDishImages }: MenuCategoryScreenProps) {
  const { t, lang } = useLang()
  const items   = allItems.filter(i => cats.includes(i.category))
  const grouped = groupByCategory(items, cats)

  const [dishImages, setDishImages]         = useState<DishImage[]>(allDishImages ?? [])
  const [replacingIdx, setReplacingIdx]     = useState<number | null>(null)
  const [editingLabelIdx, setEditingLabelIdx] = useState<number | null>(null)
  const [labelDraft, setLabelDraft]         = useState({ labelEn: '', labelHe: '' })
  const [dishUploading, setDishUploading]   = useState(false)
  const [addingDish, setAddingDish]         = useState(false)
  const [dishDraft, setDishDraft]           = useState({ ...EMPTY_DISH })
  const replaceInputRef                     = useRef<HTMLInputElement>(null)
  const addFileInputRef                     = useRef<HTMLInputElement>(null)

  useEffect(() => { setDishImages(allDishImages ?? []) }, [allDishImages])

  const saveDishImages = async (updated: DishImage[]) => {
    setDishImages(updated)
    await onUpdateDishImages?.(updated)
  }

  const openLabelEdit = (i: number) => {
    setEditingLabelIdx(i)
    setLabelDraft({ labelEn: dishImages[i].labelEn, labelHe: dishImages[i].labelHe })
  }

  const saveLabelEdit = async () => {
    if (editingLabelIdx === null) return
    await saveDishImages(dishImages.map((d, i) => i === editingLabelIdx ? { ...d, ...labelDraft } : d))
    setEditingLabelIdx(null)
  }

  const handleReplaceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || replacingIdx === null) return
    setDishUploading(true)
    try {
      const url = await uploadImage(file, 'dish_images')
      await saveDishImages(dishImages.map((d, i) => i === replacingIdx ? { ...d, src: url } : d))
    } finally { setDishUploading(false); setReplacingIdx(null); e.target.value = '' }
  }

  const handleAddDish = async () => {
    if (!dishDraft.file) return
    setDishUploading(true)
    try {
      const url = await uploadImage(dishDraft.file, 'dish_images')
      await saveDishImages([...dishImages, { src: url, labelEn: dishDraft.labelEn, labelHe: dishDraft.labelHe }])
      setDishDraft({ ...EMPTY_DISH })
      setAddingDish(false)
    } finally { setDishUploading(false) }
  }

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
                : grouped.map(([cat, catItems]) => <CategorySection key={cat} category={cat} menuType={menuType} items={catItems} imageSrc={categoryImages?.[cat]} imagePosition={categoryImagePositions?.[cat]} editMode={editMode} onUpdate={onUpdate} onDelete={onDelete} onAdd={onAdd} onUpdateBanner={onUpdateBanner ? file => onUpdateBanner(cat, file) : undefined} />)
              }
              {(dishImages.length > 0 || editMode) && (
                <>
                  <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceChange} />
                  <div className="grid grid-cols-2 gap-2 -mx-4">
                    {dishImages.map((img, i) => (
                      <div key={i} className="relative aspect-square overflow-hidden">
                        <img src={img.src} alt={img.labelEn} className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at center, transparent 35%, rgba(0,0,0,0.55) 100%)' }} />
                        <div className="absolute top-0 left-0 right-0 flex justify-center pt-3">
                          <span className="border border-white/40 text-white font-serif text-xs tracking-widest uppercase px-3 py-1.5 bg-black/20 backdrop-blur-sm text-center w-4/5">
                            {t(img.labelEn, img.labelHe)}
                          </span>
                        </div>
                        {editMode && editingLabelIdx === i ? (
                          <div className="absolute inset-0 bg-black/80 flex flex-col gap-1.5 p-2 justify-center">
                            <input className="bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-xs text-baroque-text" placeholder="Name (EN)" value={labelDraft.labelEn} onChange={e => setLabelDraft(d => ({ ...d, labelEn: e.target.value }))} />
                            <input dir="rtl" className="bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-xs text-baroque-text" placeholder="שם (עברית)" value={labelDraft.labelHe} onChange={e => setLabelDraft(d => ({ ...d, labelHe: e.target.value }))} />
                            <div className="flex gap-1">
                              <button onClick={saveLabelEdit} className="flex-1 bg-gold text-baroque-bg text-xs font-medium py-1 rounded">Save</button>
                              <button onClick={() => setEditingLabelIdx(null)} className="flex-1 border border-baroque-border text-baroque-muted text-xs py-1 rounded">✕</button>
                            </div>
                          </div>
                        ) : editMode && (
                          <div className="absolute bottom-2 right-2 flex gap-1">
                            <button onClick={() => openLabelEdit(i)} className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs" title="Edit label">T</button>
                            <button
                              onClick={() => { setReplacingIdx(i); replaceInputRef.current?.click() }}
                              disabled={dishUploading}
                              className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center disabled:opacity-50"
                            >
                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>
                            <button
                              onClick={() => { if (window.confirm('Remove this photo?')) saveDishImages(dishImages.filter((_, j) => j !== i)) }}
                              className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                            >✕</button>
                          </div>
                        )}
                      </div>
                    ))}
                    {editMode && (
                      addingDish ? (
                        <div className="aspect-square flex flex-col gap-2 p-3 bg-baroque-surface border border-baroque-border">
                          <input ref={addFileInputRef} type="file" accept="image/*" className="hidden" onChange={e => setDishDraft(d => ({ ...d, file: e.target.files?.[0] ?? null }))} />
                          <button onClick={() => addFileInputRef.current?.click()} className="flex-1 border border-dashed border-baroque-border text-baroque-muted text-xs rounded">
                            {dishDraft.file ? dishDraft.file.name : '+ Photo'}
                          </button>
                          <input className="bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-xs text-baroque-text" placeholder="Name (EN)" value={dishDraft.labelEn} onChange={e => setDishDraft(d => ({ ...d, labelEn: e.target.value }))} />
                          <input dir="rtl" className="bg-baroque-bg border border-baroque-border rounded px-2 py-1 text-xs text-baroque-text" placeholder="שם (עברית)" value={dishDraft.labelHe} onChange={e => setDishDraft(d => ({ ...d, labelHe: e.target.value }))} />
                          <div className="flex gap-1">
                            <button onClick={handleAddDish} disabled={!dishDraft.file || dishUploading} className="flex-1 bg-gold text-baroque-bg text-xs font-medium py-1 rounded disabled:opacity-50">{dishUploading ? '…' : 'Add'}</button>
                            <button onClick={() => { setAddingDish(false); setDishDraft({ ...EMPTY_DISH }) }} className="flex-1 border border-baroque-border text-baroque-muted text-xs py-1 rounded">✕</button>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setAddingDish(true)} className="aspect-square flex items-center justify-center border border-dashed border-baroque-border text-baroque-muted text-xs hover:border-gold hover:text-gold transition-colors">
                          + Add photo
                        </button>
                      )
                    )}
                  </div>
                </>
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
  editMode?: boolean
  onAdd?: (event: Omit<ConcertItem, 'id'>) => Promise<void>
  onUpdate?: (id: string, changes: Partial<ConcertItem>) => Promise<void>
  onDelete?: (id: string) => Promise<void>
}

const EMPTY_EVENT = { title: '', title_he: '', date: '', poster_url: '' }

function ConcertsScreen({ concerts, base, fadingOut = false, editMode, onAdd, onUpdate, onDelete }: ConcertsScreenProps) {
  const { t } = useLang()
  const [idx, setIdx] = useState(0)
  const [prevIdx, setPrevIdx] = useState<number | null>(null)
  const [dir, setDir] = useState<'left' | 'right'>('left')
  const animating = useRef(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [showForm, setShowForm]         = useState(false)
  const [editingId, setEditingId]       = useState<string | null>(null)
  const [draft, setDraft]               = useState({ ...EMPTY_EVENT })
  const [posterFile, setPosterFile]     = useState<File | null>(null)
  const [saving, setSaving]             = useState(false)
  const posterInputRef                  = useRef<HTMLInputElement>(null)

  const openAdd = () => { setDraft({ ...EMPTY_EVENT }); setPosterFile(null); setEditingId(null); setShowForm(true) }
  const openEdit = (c: ConcertItem) => {
    setDraft({ title: c.title, title_he: c.title_he, date: c.date ?? '', poster_url: c.poster_url })
    setPosterFile(null); setEditingId(c.id ?? null); setShowForm(true)
  }

  const submitForm = async () => {
    if (!draft.title.trim()) return
    setSaving(true)
    try {
      let poster_url = draft.poster_url
      if (posterFile) {
        const { uploadImage } = await import('../lib/storage')
        poster_url = await uploadImage(posterFile, 'events')
      }
      const data = { title: draft.title, title_he: draft.title_he, date: draft.date, poster_url }
      if (editingId) { await onUpdate?.(editingId, data) }
      else           { await onAdd?.(data) }
      setShowForm(false)
    } finally { setSaving(false) }
  }

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
      <div className="shrink-0 flex items-start justify-between px-4 pt-5 pb-1">
        <div className="flex-1 text-center">
          <p className="text-baroque-text text-xl font-bold tracking-wide">
            {t(concerts[i].title, concerts[i].title_he)}
          </p>
          {concerts[i].date && (
            <p className="text-baroque-muted text-sm mt-0.5">{concerts[i].date}</p>
          )}
        </div>
        {editMode && concerts[i].id && (
          <div className="flex gap-1 shrink-0 ml-2">
            <button onClick={() => openEdit(concerts[i])} className="text-baroque-muted hover:text-gold p-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button onClick={() => { if (window.confirm('Delete this event?')) onDelete?.(concerts[i].id!) }} className="text-baroque-muted hover:text-red-400 p-1">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 relative">
        <img src={resolveUrl(concerts[i].poster_url, base)} alt={concerts[i].title} className="absolute inset-0 w-full h-full object-contain" />
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
        <div className="flex items-center justify-center gap-3 py-3 shrink-0">
          {concerts.map((_, i) => (
            <button
              key={i}
              onClick={() => changeIdx(i, i > idx ? 'left' : 'right')}
              className={`w-2 h-2 rounded-full transition-colors duration-150 ${i === idx ? 'bg-gold' : 'bg-baroque-border'}`}
            />
          ))}
          {editMode && (
            <button onClick={openAdd} className="ml-2 text-baroque-muted hover:text-gold text-xs border border-baroque-border px-2 py-1 rounded transition-colors">
              + Add
            </button>
          )}
        </div>
      </div>

      {/* Event form modal */}
      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70" onClick={() => setShowForm(false)}>
          <div className="bg-baroque-bg border border-baroque-border rounded-lg p-5 w-80 flex flex-col gap-3 mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="font-serif text-gold text-center tracking-widest uppercase text-sm">{editingId ? 'Edit Event' : 'Add Event'}</h3>
            <input className="bg-baroque-surface border border-baroque-border rounded px-3 py-2 text-sm text-baroque-text" placeholder="Title (EN)" value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} />
            <input dir="rtl" className="bg-baroque-surface border border-baroque-border rounded px-3 py-2 text-sm text-baroque-text" placeholder="כותרת (עברית)" value={draft.title_he} onChange={e => setDraft(d => ({ ...d, title_he: e.target.value }))} />
            <input className="bg-baroque-surface border border-baroque-border rounded px-3 py-2 text-sm text-baroque-text" placeholder="Date (e.g. 20.03.26)" value={draft.date} onChange={e => setDraft(d => ({ ...d, date: e.target.value }))} />
            <div className="flex flex-col gap-1">
              <input ref={posterInputRef} type="file" accept="image/*" className="hidden" onChange={e => setPosterFile(e.target.files?.[0] ?? null)} />
              <button onClick={() => posterInputRef.current?.click()} className="border border-baroque-border text-baroque-muted text-xs py-2 rounded">
                {posterFile ? posterFile.name : (draft.poster_url ? '📎 Change poster' : '📎 Upload poster')}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={submitForm} disabled={saving} className="flex-1 bg-gold text-baroque-bg text-sm font-medium py-2 rounded disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
              <button onClick={() => setShowForm(false)} className="flex-1 border border-baroque-border text-baroque-muted text-sm py-2 rounded">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

interface WifiScreenProps {
  wifi: { ssid: string; password: string } | null
  loading: boolean
  error: string | null
  fadingOut?: boolean
  editMode?: boolean
  onUpdate?: (ssid: string, password: string) => void
}

function WifiScreen({ wifi, loading, error, fadingOut = false, editMode, onUpdate }: WifiScreenProps) {
  const { t } = useLang()
  const [editing, setEditing] = useState(false)
  const [draftSsid, setDraftSsid]   = useState('')
  const [draftPwd,  setDraftPwd]    = useState('')

  const startEdit = () => {
    setDraftSsid(wifi?.ssid ?? '')
    setDraftPwd(wifi?.password ?? '')
    setEditing(true)
  }
  const save = () => { onUpdate?.(draftSsid, draftPwd); setEditing(false) }

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
      {error && !loading && <p className="text-red-400 text-sm text-center">{t('Could not load WiFi info', 'לא ניתן לטעון מידע WiFi')}</p>}
      {wifi && !loading && (
        editing ? (
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <input className="bg-baroque-bg border border-baroque-border rounded px-3 py-2 text-sm text-baroque-text" placeholder="Network (SSID)" value={draftSsid} onChange={e => setDraftSsid(e.target.value)} />
            <input className="bg-baroque-bg border border-baroque-border rounded px-3 py-2 text-sm text-baroque-text" placeholder="Password" value={draftPwd} onChange={e => setDraftPwd(e.target.value)} />
            <div className="flex gap-2">
              <button onClick={save} className="flex-1 bg-gold text-baroque-bg text-sm font-medium py-2 rounded">Save</button>
              <button onClick={() => setEditing(false)} className="flex-1 border border-baroque-border text-baroque-muted text-sm py-2 rounded">Cancel</button>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-6">
            <QRCodeSVG value={`WIFI:T:WPA;S:${wifi.ssid};P:${wifi.password};;`} size={220} bgColor="#ffffff" fgColor="#000000" className="rounded" />
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
            {editMode && <button onClick={startEdit} className="border border-baroque-border text-baroque-muted text-xs px-4 py-2 rounded">✎ Edit WiFi</button>}
          </div>
        )
      )}
    </div>
  )
}

// ── Gallery screen ─────────────────────────────────────────────────────────────

interface GalleryScreenProps {
  items: GalleryItem[]
  base: string
  fadingOut?: boolean
  editMode?: boolean
  onAdd?: (file: File) => Promise<void>
  onDelete?: (id: string) => void
  onReplace?: (id: string, file: File) => Promise<void>
}

function GalleryScreen({ items, base, fadingOut = false, editMode, onAdd, onDelete, onReplace }: GalleryScreenProps) {
  const { t } = useLang()
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const [prevLbIdx, setPrevLbIdx]     = useState<number | null>(null)
  const [lbDir, setLbDir]             = useState<'left' | 'right'>('left')
  const lbAnimating                   = useRef(false)
  const [touchStartX, setTouchStartX] = useState<number | null>(null)
  const [uploading, setUploading]     = useState(false)
  const fileInputRef                  = useRef<HTMLInputElement>(null)
  const replaceInputRef               = useRef<HTMLInputElement>(null)
  const [replacingId, setReplacingId] = useState<string | null>(null)

  const images = items.map(g => resolveUrl(g.url, base))

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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !onAdd) return
    setUploading(true)
    try { await onAdd(file) } finally { setUploading(false); e.target.value = '' }
  }

  const handleReplaceChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !replacingId || !onReplace) return
    setUploading(true)
    try { await onReplace(replacingId, file) } finally { setUploading(false); setReplacingId(null); e.target.value = '' }
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
        <input ref={replaceInputRef} type="file" accept="image/*" className="hidden" onChange={handleReplaceChange} />
        <div className="columns-2 gap-1 px-1 pb-6">
          {items.map((item, i) => (
            <div key={item.id ?? i} className="relative w-full mb-1">
              <button onClick={() => setLightboxIdx(i)} className="w-full block focus:outline-none">
                <img src={resolveUrl(item.url, base)} alt="" aria-hidden loading="lazy" className="w-full block" />
              </button>
              {editMode && item.id && (
                <div className="absolute top-1 right-1 flex gap-1">
                  <button
                    onClick={() => { setReplacingId(item.id!); replaceInputRef.current?.click() }}
                    className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                    title="Replace"
                  ><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  <button
                    onClick={() => { if (window.confirm('Remove this photo?')) onDelete?.(item.id!) }}
                    className="w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                  >✕</button>
                </div>
              )}
            </div>
          ))}
        </div>
        {editMode && (
          <div className="px-1 pb-6">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full border border-dashed border-baroque-border text-baroque-muted text-xs py-3 rounded hover:border-gold hover:text-gold transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : '+ Add Photo'}
            </button>
          </div>
        )}
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
  const { user, editMode, setEditMode, login, logout } = useAuth()
  const base = import.meta.env.BASE_URL

  // ── Admin login modal ─────────────────────────────────────────────────────────
  const [showLogin, setShowLogin]     = useState(false)
  const [loginEmail, setLoginEmail]   = useState('')
  const [loginPwd, setLoginPwd]       = useState('')
  const [loginError, setLoginError]   = useState('')
  const [loginLoading, setLoginLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')
    setLoginLoading(true)
    try {
      await login(loginEmail, loginPwd)
      setShowLogin(false)
      setLoginEmail('')
      setLoginPwd('')
    } catch {
      setLoginError('Incorrect email or password')
    } finally {
      setLoginLoading(false)
    }
  }

  // ── Long-press on logo (3s) → show login ─────────────────────────────────────
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startLongPress = () => {
    if (user) return // already logged in
    longPressTimer.current = setTimeout(() => setShowLogin(true), 3000)
  }
  const cancelLongPress = () => {
    if (longPressTimer.current) clearTimeout(longPressTimer.current)
  }

  // ── Firestore mutations ───────────────────────────────────────────────────────
  const handleUpdateItem = async (id: string, changes: Partial<MenuItem>) => {
    const { id: _, ...data } = changes as MenuItem
    await updateDoc(doc(db, 'menu_items', id), data)
    setAllItems(prev => prev.map(item => item.id === id ? { ...item, ...changes } : item))
  }

  const handleDeleteItem = async (id: string) => {
    await deleteDoc(doc(db, 'menu_items', id))
    setAllItems(prev => prev.filter(item => item.id !== id))
  }

  const handleAddItem = async (newItem: Omit<MenuItem, 'id'>) => {
    const ref = await addDoc(collection(db, 'menu_items'), newItem)
    setAllItems(prev => [...prev, { id: ref.id, ...newItem }])
  }

  // ── Event mutations ───────────────────────────────────────────────────────────
  const handleAddEvent = async (event: Omit<ConcertItem, 'id'>) => {
    const ref = await addDoc(collection(db, 'events'), { ...event, order: concerts.length })
    setConcerts(prev => [...prev, { id: ref.id, ...event }])
  }
  const handleUpdateEvent = async (id: string, changes: Partial<ConcertItem>) => {
    await updateDoc(doc(db, 'events', id), changes)
    setConcerts(prev => prev.map(c => c.id === id ? { ...c, ...changes } : c))
  }
  const handleDeleteEvent = async (id: string) => {
    await deleteDoc(doc(db, 'events', id))
    setConcerts(prev => prev.filter(c => c.id !== id))
  }

  // ── Gallery mutations ─────────────────────────────────────────────────────────
  const handleAddGalleryItem = async (file: File) => {
    const url = await uploadImage(file, 'gallery')
    const ref = await addDoc(collection(db, 'gallery'), { url, order: galleryItems.length })
    setGalleryItems(prev => [...prev, { id: ref.id, url, order: prev.length }])
  }
  const handleDeleteGalleryItem = async (id: string) => {
    await deleteDoc(doc(db, 'gallery', id))
    setGalleryItems(prev => prev.filter(g => g.id !== id))
  }
  const handleReplaceGalleryItem = async (id: string, file: File) => {
    const url = await uploadImage(file, 'gallery')
    await updateDoc(doc(db, 'gallery', id), { url })
    setGalleryItems(prev => prev.map(g => g.id === id ? { ...g, url } : g))
  }

  // ── WiFi mutation ─────────────────────────────────────────────────────────────
  const handleUpdateWifi = async (ssid: string, password: string) => {
    await updateDoc(doc(db, 'config', 'wifi'), { ssid, password })
    setWifi({ ssid, password })
  }

  // ── Dish image mutations ──────────────────────────────────────────────────────
  const handleUpdateDishImages = async (section: string, images: DishImage[]) => {
    await setDoc(doc(db, 'config', 'dish_images'), { [section]: images }, { merge: true })
    setDishImageOverrides(prev => ({ ...prev, [section]: images }))
  }

  // ── Banner mutations ──────────────────────────────────────────────────────────
  const handleUpdateBanner = async (category: string, file: File) => {
    const url = await uploadImage(file, 'banners')
    await setDoc(doc(db, 'config', 'banners'), { [category]: url }, { merge: true })
    setBannerOverrides(prev => ({ ...prev, [category]: url }))
  }

  // ── Cover mutations ───────────────────────────────────────────────────────────
  const handleAddCover = async (file: File) => {
    const url = await uploadImage(file, 'covers')
    const ref = await addDoc(collection(db, 'covers'), { url, order: coverItems.length })
    setCoverItems(prev => [...prev, { id: ref.id, url, order: prev.length }])
  }
  const handleDeleteCover = async (id: string) => {
    await deleteDoc(doc(db, 'covers', id))
    setCoverItems(prev => prev.filter(c => c.id !== id))
  }

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

    // Fetch events from Firestore, then preload their posters
    getDocs(query(collection(db, 'events'), orderBy('order')))
      .then(snap => {
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as ConcertItem))
        setConcerts(data)
        const concertSrcs = data.map(c => resolveUrl(c.poster_url, base))
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
  const [concerts, setConcerts]           = useState<ConcertItem[]>([])
  const [allItems, setAllItems]           = useState<MenuItem[]>([])
  const [menuLoading, setMenuLoading]     = useState(true)
  const [menuError, setMenuError]         = useState<string | null>(null)
  const [wifi, setWifi]                   = useState<{ ssid: string; password: string } | null>(null)
  const [wifiLoading, setWifiLoading]     = useState(true)
  const [wifiError, setWifiError]         = useState<string | null>(null)
  const [galleryItems, setGalleryItems]       = useState<GalleryItem[]>([])
  const [coverItems, setCoverItems]           = useState<GalleryItem[]>([])
  const [bannerOverrides, setBannerOverrides] = useState<Record<string, string>>({})
  const [dishImageOverrides, setDishImageOverrides] = useState<Record<string, DishImage[]>>({})

  // ── First home visit tracking ────────────────────────────────────────────────
  const firstHomeLoad = useRef(true)
  useEffect(() => { if (view !== 'home') firstHomeLoad.current = false }, [view])

  // ── Covers — fetched from Firestore (falls back to static if empty) ──────────
  const staticCovers = [
    `${base}images/cover_app1.jpg`,
    `${base}images/cover_app2.jpg`,
    `${base}images/cover_app3.jpg`,
    `${base}images/cover_app4.jpg`,
  ]
  useEffect(() => {
    getDocs(query(collection(db, 'covers'), orderBy('order')))
      .then(snap => { if (!snap.empty) setCoverItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem))) })
      .catch(() => {})
  }, [])
  const coverImages = coverItems.length > 0 ? coverItems.map(c => c.url) : staticCovers
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
    getDocs(query(collection(db, 'gallery'), orderBy('order')))
      .then(snap => setGalleryItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as GalleryItem))))
      .catch(() => {})
  }, [])

  useEffect(() => {
    getDoc(doc(db, 'config', 'banners'))
      .then(snap => { if (snap.exists()) setBannerOverrides(snap.data() as Record<string, string>) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    getDoc(doc(db, 'config', 'dish_images'))
      .then(snap => { if (snap.exists()) setDishImageOverrides(snap.data() as Record<string, DishImage[]>) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    getDocs(collection(db, 'menu_items'))
      .then(snap => {
        const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as MenuItem))
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
                <img
                  src={`${base}logo.png`} alt="Baroque" className="h-16 w-auto select-none"
                  style={{ filter: 'invert(1)' }}
                  onPointerDown={startLongPress}
                  onPointerUp={cancelLongPress}
                  onPointerLeave={cancelLongPress}
                  onContextMenu={e => e.preventDefault()}
                  draggable={false}
                />
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

              {/* Cover edit controls (admin only) */}
              {editMode && <CoverEditor coverItems={coverItems} onAdd={handleAddCover} onDelete={handleDeleteCover} />}

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
        {view === 'concerts' && <ConcertsScreen concerts={concerts} base={base} fadingOut={fadingOut} editMode={editMode} onAdd={handleAddEvent} onUpdate={handleUpdateEvent} onDelete={handleDeleteEvent} />}

        {/* Menu category screens */}
        {view === 'menu-food'     && <MenuCategoryScreen cats={FOOD_CATS} menuType="food" allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut}
          categoryImages={{
            soup:        bannerOverrides['soup']        ?? `${base}images/menu/food/soup.jpg`,
            salads:      bannerOverrides['salads']      ?? `${base}images/menu/food/tomatoe_salad.JPG`,
            bread:       bannerOverrides['bread']       ?? `${base}images/menu/food/artichoke_roasted_tomatoes.JPG`,
            sandwiches:  bannerOverrides['sandwiches']  ?? `${base}images/menu/food/mortadela2.JPG`,
            toasts:      bannerOverrides['toasts']      ?? `${base}images/menu/food/ham_cheese.JPG`,
          }}
          categoryImagePositions={{ toasts: 'center 30%' }}
          onUpdateBanner={handleUpdateBanner}
          allDishImages={dishImageOverrides['food'] ?? [
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
          editMode={editMode} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} onAdd={handleAddItem}
          onUpdateDishImages={images => handleUpdateDishImages('food', images)}
        />}
        {view === 'menu-coffee'   && <MenuCategoryScreen cats={COFFEE_CATS}   menuType="drink" allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut} categoryImages={{ coffee: bannerOverrides['coffee'] ?? `${base}images/menu/coffee/cafe.JPG`, soft_drinks: bannerOverrides['soft_drinks'] ?? `${base}images/menu/coffee/vibe.jpg` }} categoryImagePositions={{ coffee: 'center 100%', soft_drinks: 'center 85%' }} editMode={editMode} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} onAdd={handleAddItem} onUpdateBanner={handleUpdateBanner} />}
        {view === 'menu-alcohol'  && <MenuCategoryScreen cats={ALCOHOL_CATS}  menuType="drink" allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut} categoryImages={{ beer: bannerOverrides['beer'] ?? `${base}images/menu/alcohol/Beers.JPG`, cocktails: bannerOverrides['cocktails'] ?? `${base}images/menu/alcohol/Amadeus.JPG`, red_wine: bannerOverrides['red_wine'] ?? `${base}images/menu/alcohol/Wine.JPG`, white_wine: bannerOverrides['white_wine'] ?? `${base}images/menu/alcohol/Wine.JPG`, liqueurs: bannerOverrides['liqueurs'] ?? `${base}images/menu/alcohol/HardLiquers.JPG` }} categoryImagePositions={{ cocktails: 'center 30%', red_wine: 'center 80%', white_wine: 'center 80%', liqueurs: 'center 60%' }} editMode={editMode} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} onAdd={handleAddItem} onUpdateBanner={handleUpdateBanner} />}
        {view === 'menu-pastries' && <MenuCategoryScreen cats={PASTRIES_CATS} menuType="food"  allItems={allItems} loading={menuLoading} error={menuError} fadingOut={fadingOut}
          categoryImages={{ pastries: bannerOverrides['pastries'] ?? `${base}images/menu/pastries/Pastries.JPG` }}
          categoryImagePositions={{ pastries: 'center 50%' }}
          onUpdateBanner={handleUpdateBanner}
          allDishImages={dishImageOverrides['pastries'] ?? [
            { src: `${base}images/menu/pastries/brownies.JPG`,  labelEn: 'Brownies',   labelHe: 'בראוניז' },
            { src: `${base}images/menu/pastries/croason.jpeg`,  labelEn: 'Croissant',  labelHe: 'קרואסון' },
            { src: `${base}images/menu/pastries/lemon_pie.jpg`, labelEn: 'Lemon Pie',  labelHe: 'פאי לימון' },
            { src: `${base}images/menu/pastries/tart_2.JPG`,    labelEn: 'Tart',       labelHe: 'טארט' },
            { src: `${base}images/menu/pastries/borekas.jpg`,   labelEn: 'Burrekas',   labelHe: 'בורקסים' },
          ]}
          editMode={editMode} onUpdate={handleUpdateItem} onDelete={handleDeleteItem} onAdd={handleAddItem}
          onUpdateDishImages={images => handleUpdateDishImages('pastries', images)}
        />}

        {/* WiFi screen */}
        {view === 'wifi' && <WifiScreen wifi={wifi} loading={wifiLoading} error={wifiError} fadingOut={fadingOut} editMode={editMode} onUpdate={handleUpdateWifi} />}

        {/* Gallery screen */}
        {view === 'gallery' && <GalleryScreen items={galleryItems} base={base} fadingOut={fadingOut} editMode={editMode} onAdd={handleAddGalleryItem} onDelete={handleDeleteGalleryItem} onReplace={handleReplaceGalleryItem} />}

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

      {/* ── Admin: edit mode toggle (only when logged in) ── */}
      {user && (
        <div className="fixed bottom-28 right-4 z-50 flex flex-row items-center gap-2">
          <button
            onClick={() => setEditMode(!editMode)}
            className={`px-4 py-2 text-xs font-medium rounded-full border transition-colors ${editMode ? 'bg-gold text-baroque-bg border-gold' : 'bg-baroque-bg border-baroque-border text-baroque-text'}`}
          >
            {editMode ? '✓ Editing' : '✎ Edit'}
          </button>
          <button
            onClick={logout}
            className="px-4 py-2 text-xs font-medium rounded-full border border-baroque-border bg-baroque-bg text-baroque-text transition-colors"
          >
            Log out
          </button>
        </div>
      )}

      {/* ── Admin: login modal ── */}
      {showLogin && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70" onClick={() => setShowLogin(false)}>
          <form
            onClick={e => e.stopPropagation()}
            onSubmit={handleLogin}
            className="bg-baroque-bg border border-baroque-border rounded-lg p-6 w-72 flex flex-col gap-3"
          >
            <h2 className="font-serif text-gold text-center tracking-widest uppercase text-sm">Admin Login</h2>
            <input
              type="email"
              placeholder="Email"
              autoComplete="email"
              value={loginEmail}
              onChange={e => setLoginEmail(e.target.value)}
              className="bg-baroque-surface border border-baroque-border rounded px-3 py-2 text-sm text-baroque-text focus:outline-none focus:border-gold"
              required
            />
            <input
              type="password"
              placeholder="Password"
              autoComplete="current-password"
              value={loginPwd}
              onChange={e => setLoginPwd(e.target.value)}
              className="bg-baroque-surface border border-baroque-border rounded px-3 py-2 text-sm text-baroque-text focus:outline-none focus:border-gold"
              required
            />
            {loginError && <p className="text-red-400 text-xs text-center">{loginError}</p>}
            <button
              type="submit"
              disabled={loginLoading}
              className="bg-gold text-baroque-bg font-medium text-sm py-2 rounded disabled:opacity-50"
            >
              {loginLoading ? 'Signing in…' : 'Sign in'}
            </button>
            <button type="button" onClick={() => setShowLogin(false)} className="text-baroque-muted text-xs text-center">Cancel</button>
          </form>
        </div>
      )}
    </div>
  )
}

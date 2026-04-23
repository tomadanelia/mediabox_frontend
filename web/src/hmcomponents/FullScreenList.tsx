'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { X, ChevronRight, ChevronLeft, Star } from 'lucide-react'
import api from '@/lib/axios'
import {
  getFavourites,
  subscribeFavourites,
} from '../../src/services/favouritesService'

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = {
  id: string
  uuid: string
  name: string
  logo: string
  number: number
  category: string
  category_id: string
  is_free?: boolean
}

type Program = {
  UID: number
  CHANNEL_ID: number
  START_TIME: number
  END_TIME: number
  TITLE: string
  GANRE: string
  DESCRIPTION: string
}

type Category = {
  id: string
  name_ka: string
  name_en: string
  icon_url: string | null
}

export type TVGuideSelection = {
  channel: Channel
  mode: 'live' | 'archive'
  timestamp?: number
}

type Props = {
  onClose: () => void
  onSelect: (sel: TVGuideSelection) => void
  currentChannelId?: string
  rewindableDays?: number
  mode?: 'live' | 'archive'
  archiveTimestamp?: number | null
}

// ─── Georgian labels ──────────────────────────────────────────────────────────

const GEO_MONTHS   = ['იანვ','თებ','მარ','აპრ','მაი','ივნ','ივლ','აგვ','სექ','ოქტ','ნოე','დეკ']
const GEO_WEEKDAYS = ['კვი','ორშ','სამ','ოთხ','ხუთ','პარ','შაბ']

function geoDate(d: Date): string {
  return `${GEO_WEEKDAYS[d.getDay()]}, ${d.getDate()} ${GEO_MONTHS[d.getMonth()]}`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const hhmm    = new Intl.DateTimeFormat('en-us', { hour: '2-digit', minute: '2-digit', hour12: false })
const fmtTime = (unix: number) => hhmm.format(new Date(unix * 1000))

function dayLabel(d: Date): string {
  const now  = new Date()
  const prev = new Date(); prev.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return 'დღეს'
  if (d.toDateString() === prev.toDateString()) return 'გუშინ'
  return geoDate(d)
}

function startOfDayKey(unix: number): string {
  const d = new Date(unix * 1000)
  d.setHours(0, 0, 0, 0)
  return d.toDateString()
}

const Spinner = () => (
  <div className="flex items-center justify-center py-10">
    <div
      className="w-5 h-5 border-2 border-black/10 dark:border-white/10 rounded-full animate-spin"
      style={{ borderTopColor: '#d52b1e' }}
    />
  </div>
)

const MatIcon = ({ name, size = 12 }: { name: string; size?: number }) => (
  <span
    className="material-symbols-outlined shrink-0"
    style={{
      fontSize: size,
      lineHeight: 1,
      fontVariationSettings: "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 20",
    }}
  >
    {name}
  </span>
)

// ─── Component ────────────────────────────────────────────────────────────────

const FullScreenList: React.FC<Props> = ({
  onClose,
  onSelect,
  currentChannelId,
  rewindableDays = 7,
  mode = 'live',
  archiveTimestamp = null,
}) => {
  const nowSec      = Math.floor(Date.now() / 1000)
  const watchingSec = mode === 'archive' && archiveTimestamp !== null ? archiveTimestamp : nowSec

  const dateStrip = Array.from({ length: rewindableDays + 1 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (rewindableDays - i))
    return d
  })

  // ── State ──────────────────────────────────────────────────────────────────
  const [channels,     setChannels]     = useState<Channel[]>([])
  const [categories,   setCategories]   = useState<Category[]>([])
  const [loadingCh,    setLoadingCh]    = useState(true)
  const [errorCh,      setErrorCh]      = useState<string | null>(null)
  const [previewId,    setPreviewId]    = useState<string>(currentChannelId ?? '')
  const [programs,     setPrograms]     = useState<Program[]>([])
  const [loadingPr,    setLoadingPr]    = useState(false)
  const [selDate,      setSelDate]      = useState<Date>(dateStrip[dateStrip.length - 1])
  const [selCategory,  setSelCategory]  = useState<string>('')
  const [catExpanded,  setCatExpanded]  = useState(false)
  const [showFavsOnly, setShowFavsOnly] = useState(false)
  const [favouriteIds, setFavouriteIds] = useState<ReadonlySet<number>>(getFavourites())

  const programListRef = React.useRef<HTMLDivElement>(null)
  const activeRowRef   = React.useRef<HTMLDivElement>(null)

  // ── Favourites subscription ────────────────────────────────────────────────
  useEffect(() => {
    return subscribeFavourites((ids: ReadonlySet<number>) => setFavouriteIds(ids))
  }, [])

  // ── Fetch channels + categories ────────────────────────────────────────────
  useEffect(() => {
    let dead = false
    setLoadingCh(true)
    Promise.all([
      api.get('/api/channels'),
      api.get('/api/channels/categories'),
    ])
      .then(([chRes, catRes]) => {
        if (dead) return
        const data        = chRes.data
        const channelList: Channel[] = (data.channels ?? (Array.isArray(data) ? data : [])).map((ch: any) => ({
          ...ch,
          category: ch.category_en ?? ch.category ?? '',
        }))
        setChannels(channelList)
        setCategories(catRes.data ?? [])
        setPreviewId(id => {
          if (id) return id
          return (channelList.find(c => c.is_free) ?? channelList[0])?.id ?? ''
        })
      })
      .catch(e => { if (!dead) setErrorCh(String(e)) })
      .finally(() => { if (!dead) setLoadingCh(false) })
    return () => { dead = true }
  }, [])

  // ── Fetch all programs ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!previewId) return
    let dead = false
    setLoadingPr(true)
    setPrograms([])
    api.get(`/api/channels/${previewId}/programs/all`)
      .then(res  => { if (!dead) setPrograms(res.data ?? []) })
      .catch(() => {})
      .finally(() => { if (!dead) setLoadingPr(false) })
    return () => { dead = true }
  }, [previewId])

  // ── Sort + dedup ───────────────────────────────────────────────────────────
  const displayPrograms = useMemo(() => {
    const seen = new Set<number>()
    return [...programs]
      .filter(p => { if (seen.has(p.UID)) return false; seen.add(p.UID); return true })
      .sort((a, b) => a.START_TIME - b.START_TIME)
  }, [programs])

  // ── Scroll to active program ───────────────────────────────────────────────
  useEffect(() => {
    if (loadingPr || !activeRowRef.current || !programListRef.current) return
    const container = programListRef.current
    const row       = activeRowRef.current
    const offset    = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2
    container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' })
  }, [loadingPr])

  // ── Filtered channels ──────────────────────────────────────────────────────
  const filteredChannels = useMemo(() => {
    let list = channels
    if (selCategory)  list = list.filter(ch => ch.category === selCategory)
    if (showFavsOnly) list = list.filter(ch => favouriteIds.has(Number(ch.id)))
    return list
  }, [channels, selCategory, showFavsOnly, favouriteIds])

  const previewChannel = channels.find(c => c.id === previewId) ?? null
  const todaySelected  = selDate.toDateString() === new Date().toDateString()

  const activeUID = useMemo(() => {
    if (!displayPrograms.length) return null
    return displayPrograms.find(p => watchingSec >= p.START_TIME && watchingSec < p.END_TIME)?.UID ?? null
  }, [displayPrograms, watchingSec])

  const handleChannelClick = (ch: Channel) => {
    setPreviewId(ch.id)
    onSelect({ channel: ch, mode: 'live' })
  }

  const handleProgramClick = (p: Program) => {
    if (!previewChannel) return
    const isCurrent = nowSec >= p.START_TIME && nowSec < p.END_TIME
    if (isCurrent && todaySelected) {
      onSelect({ channel: previewChannel, mode: 'live' })
    } else {
      onSelect({ channel: previewChannel, mode: 'archive', timestamp: p.START_TIME })
    }
    onClose()
  }

  // ─── Category button helper ────────────────────────────────────────────────
  // Always w-full so layout never jumps during the rail width animation.
  // Icon stays fixed; label slides in/out via max-w + opacity.

  const catBtnClass = (isActive: boolean) =>
    [
      catExpanded
        ? 'w-full h-7 flex items-center justify-center rounded-xl'
        : 'w-7 h-7 mx-auto flex items-center justify-center rounded-full',
      'transition-colors duration-150',
      isActive
        ? 'bg-[#d52b1e]/12 text-[#d52b1e]'
        : 'text-black/35 dark:text-white/30 hover:bg-black/5 dark:hover:bg-white/7 hover:text-black/65 dark:hover:text-white/55',
    ].join(' ')

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col bg-white/80 dark:bg-black/70 backdrop-blur-lg select-none"
      style={{ zoom: 2 }}
    >

      {/* ── Top bar ── */}
      <div className="shrink-0 px-3 pt-3">
        <div className="bg-white/50 dark:bg-white/3 px-3 border-t border-x border-black/8 dark:border-white/8 backdrop-blur-md rounded-t-[10px]">
          <div className="flex items-center justify-between py-1.5">
            <span className="text-black/80 dark:text-white/80 font-bold text-sm tracking-wide">MediaBox</span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-black/30 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Date strip */}
          <div className="flex gap-1.5 overflow-x-auto pb-2" style={{ scrollbarWidth: 'none' }}>
            {dateStrip.map((d, i) => {
              const isSelected = d.toDateString() === selDate.toDateString()
              return (
                <button
                  key={i}
                  onClick={() => setSelDate(d)}
                  className={`shrink-0 px-2.5 py-1 rounded-[8px] text-[11px] font-semibold whitespace-nowrap transition-all duration-150 outline-none ${
                    isSelected
                      ? 'bg-[#d52b1e] text-white shadow-sm shadow-red-500/25'
                      : 'border border-black/8 dark:border-white/10 text-black/50 dark:text-white/40 hover:text-black/70 dark:hover:text-white/60 hover:bg-black/5 dark:hover:bg-white/8'
                  }`}
                >
                  {dayLabel(d)}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden px-3 pb-3">

        {/* ══ Category rail — thin vertical sidebar, expands on toggle ══ */}
        <div
          className="shrink-0 flex flex-col border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md rounded-bl-2xl overflow-hidden transition-all duration-250 ease-in-out"
          style={{ width: catExpanded ? 92 : 36 }}
        >

          {/* Expand / collapse toggle */}
          <button
            onClick={() => setCatExpanded(v => !v)}
            className="shrink-0 w-full h-7 flex items-center justify-center border-b border-black/6 dark:border-white/6 text-black/25 dark:text-white/25 hover:text-[#d52b1e] hover:bg-black/4 dark:hover:bg-white/5 transition-all duration-150"
          >
            {catExpanded ? <ChevronLeft size={10} /> : <ChevronRight size={10} />}
          </button>

          {/* Scrollable filter list */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col gap-0.5 px-1 py-1" style={{ scrollbarWidth: 'none' }}>

            {/* Favourites */}
            <button
              onClick={() => { setShowFavsOnly(v => !v); if (!showFavsOnly) setSelCategory('') }}
              title="საყვარელი"
              className={catBtnClass(showFavsOnly)}
            >
              <Star size={12} className="shrink-0" fill={showFavsOnly ? 'currentColor' : 'none'} strokeWidth={1.5} />
              <span
                className="text-[9px] font-bold whitespace-nowrap leading-none tracking-wide overflow-hidden transition-all duration-250 ease-in-out"
                style={{ maxWidth: catExpanded ? 60 : 0, opacity: catExpanded ? 1 : 0, marginLeft: catExpanded ? 6 : 0 }}
              >
                საყვარელი
              </span>
            </button>

            {/* Thin divider */}
            <div className="h-px bg-black/6 dark:bg-white/6 mx-1 my-0.5" />

            {/* All */}
            <button
              onClick={() => { setSelCategory(''); setShowFavsOnly(false) }}
              title="ყველა"
              className={catBtnClass(selCategory === '' && !showFavsOnly)}
            >
              <MatIcon name="apps" size={12} />
              <span
                className="text-[9px] font-bold whitespace-nowrap leading-none tracking-wide overflow-hidden transition-all duration-250 ease-in-out"
                style={{ maxWidth: catExpanded ? 60 : 0, opacity: catExpanded ? 1 : 0, marginLeft: catExpanded ? 6 : 0 }}
              >
                ყველა
              </span>
            </button>

            {/* Per-category */}
            {categories.map(cat => {
              const isActive = selCategory === cat.name_en && !showFavsOnly
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setShowFavsOnly(false)
                    setSelCategory(prev => prev === cat.name_en ? '' : cat.name_en)
                  }}
                  title={cat.name_ka}
                  className={catBtnClass(isActive)}
                >
                  {cat.icon_url
                    ? <MatIcon name={cat.icon_url} size={12} />
                    : <div className="w-3 h-3 shrink-0 rounded-md bg-current opacity-40" />
                  }
                  <span
                    className="text-[9px] font-bold whitespace-nowrap leading-none tracking-wide overflow-hidden transition-all duration-250 ease-in-out"
                    style={{ maxWidth: catExpanded ? 60 : 0, opacity: catExpanded ? 1 : 0, marginLeft: catExpanded ? 6 : 0 }}
                  >
                    {cat.name_ka}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Channel list ── */}
        <div className="w-1/4 shrink-0 border-y border-r border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          {loadingCh ? (
            <Spinner />
          ) : errorCh ? (
            <p className="text-red-400 text-[10px] text-center px-3 pt-6">{errorCh}</p>
          ) : filteredChannels.length === 0 ? (
            <p className="text-black/30 dark:text-white/30 text-[10px] text-center pt-6">არხი ვერ მოიძებნა</p>
          ) : (
            <div>
              {filteredChannels.map(ch => {
                const isStreaming  = ch.id === currentChannelId
                const isPreviewing = ch.id === previewId
                const isFav       = favouriteIds.has(Number(ch.id))
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleChannelClick(ch)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-left transition-all duration-150 rounded-[8px] ${
                      isStreaming
                        ? 'bg-black/5 dark:bg-white/10 border border-black/10 dark:border-white/15'
                        : isPreviewing
                        ? 'bg-black/3 dark:bg-white/8'
                        : 'hover:bg-black/3 dark:hover:bg-white/4'
                    }`}
                  >
                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                      {ch.logo
                        ? <img src={ch.logo} alt="" className="w-10/12 h-10/12 object-contain" onError={e => { e.currentTarget.style.display = 'none' }} />
                        : <span className="text-black/40 dark:text-white/40 text-[9px] font-bold">{ch.name.slice(0, 2).toUpperCase()}</span>
                      }
                    </div>
                    <span className="text-black/80 dark:text-white/75 text-[11px] font-medium truncate flex-1">{ch.name}</span>
                    {isFav && (
                      <Star size={9} className="shrink-0 text-orange-400" fill="currentColor" strokeWidth={0} />
                    )}
                    {isStreaming && (
                      <span className="w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: '#d52b1e' }} />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* ── Program list ── */}
        <div className="flex-1 flex flex-col min-h-0 rounded-br-[10px] border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md overflow-hidden">

          {previewChannel && (
            <div className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-black/5 dark:border-white/8">
              <div className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                {previewChannel.logo
                  ? <img src={previewChannel.logo} alt="" className="w-10/12 h-10/12 object-contain" />
                  : <span className="text-black/40 dark:text-white/40 text-[8px] font-bold">{previewChannel.name.slice(0, 2).toUpperCase()}</span>
                }
              </div>
              <span className="text-black/80 dark:text-white/75 text-xs font-semibold truncate flex-1">{previewChannel.name}</span>
              {previewId === currentChannelId && (
                <span
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-wider text-white"
                  style={{ background: '#d52b1e' }}
                >
                  <span className="w-1 h-1 rounded-full bg-white animate-pulse" />
                  {mode === 'live' ? 'Live' : 'Archive'}
                </span>
              )}
            </div>
          )}

          <div ref={programListRef} className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
            {loadingPr ? (
              <Spinner />
            ) : displayPrograms.length === 0 ? (
              <p className="text-black/30 dark:text-white/30 text-[11px] text-center pt-8">No programs available</p>
            ) : (
              <div className="px-3">
                {(() => {
                  const items: React.ReactNode[] = []
                  let lastDayKey = ''

                  displayPrograms.forEach(p => {
                    const dayKey = startOfDayKey(p.START_TIME)
                    if (dayKey !== lastDayKey) {
                      lastDayKey = dayKey
                      const dayDate = new Date(p.START_TIME * 1000)
                      items.push(
                        <div key={`divider-${dayKey}`} className="flex items-center justify-center gap-2 py-1.5">
                          <div className="h-px flex-1 bg-black/8 dark:bg-white/10" />
                          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-[8px] border bg-red-500/80 dark:bg-red-500/20 border-red-500 dark:border-red-400/70">
                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">{dayLabel(dayDate)}</span>
                            <span className="text-[10px] text-white/70">
                              {dayDate.toLocaleDateString('ka-GE', { month: 'short', day: 'numeric', year: 'numeric' })}
                            </span>
                          </div>
                          <div className="h-px flex-1 bg-black/8 dark:bg-white/10" />
                        </div>
                      )
                    }

                    const isActive  = p.UID === activeUID
                    const isLiveNow = nowSec >= p.START_TIME && nowSec < p.END_TIME
                    const isPast    = nowSec >= p.END_TIME
                    const isFuture  = p.START_TIME > nowSec
                    const clickable = !isFuture

                    items.push(
                      <div
                        key={p.UID}
                        ref={isActive ? activeRowRef : undefined}
                        onClick={() => clickable && handleProgramClick(p)}
                        title={isFuture ? 'Not yet available' : undefined}
                        className={[
                          'flex items-center gap-2 px-2 py-1.5 transition-all duration-150 select-none rounded-[8px]',
                          clickable ? 'cursor-pointer' : 'cursor-not-allowed',
                          isActive
                            ? 'border border-black/10 dark:border-white/20 bg-black/5 dark:bg-white/10'
                            : isPast
                            ? 'opacity-90 hover:opacity-80 hover:bg-black/3 dark:hover:bg-white/4'
                            : 'opacity-25',
                        ].join(' ')}
                      >
                        {/* Active bar */}
                        <div
                          className="w-[3px] h-4 rounded-full shrink-0 transition-colors duration-150"
                          style={{ backgroundColor: isActive ? '#d52b1e' : 'transparent' }}
                        />

                        {/* Time */}
                        <span className={`text-[10px] font-mono tabular-nums shrink-0 w-16 ${isActive ? 'text-[#d52b1e]' : 'text-black/30 dark:text-white/50'}`}>
                          {fmtTime(p.START_TIME)} – {fmtTime(p.END_TIME)}
                        </span>

                        {/* Title */}
                        <span className={`text-[11px] font-medium truncate flex-1 ${isActive ? 'text-black/90 dark:text-white' : 'text-black/70 dark:text-white/75'}`}>
                          {p.TITLE}
                        </span>

                        {isLiveNow && (
                          <span className="shrink-0 px-1.5 py-0.5 text-white text-[8px] font-bold rounded-md animate-pulse" style={{ background: '#d52b1e' }}>
                            LIVE
                          </span>
                        )}
                        {isFuture && (
                          <span className="text-black/20 dark:text-white/20 text-[9px] shrink-0">🔒</span>
                        )}
                      </div>
                    )
                  })

                  return items
                })()}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}

export default FullScreenList
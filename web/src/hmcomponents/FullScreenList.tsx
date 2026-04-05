'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { X, Radio, Clock } from 'lucide-react'
import api from '@/lib/axios'

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
}
// qartuli saxelebi
const GEO_MONTHS = ['იანვ', 'თებ', 'მარ', 'აპრ', 'მაი', 'ივნ', 'ივლ', 'აგვ', 'სექ', 'ოქტ', 'ნოე', 'დეკ']
const GEO_WEEKDAYS = ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ']

function geoDate(d: Date, includeWeekday = true): string {
  const wd = includeWeekday ? GEO_WEEKDAYS[d.getDay()] + ', ' : ''
  return `${wd}${d.getDate()} ${GEO_MONTHS[d.getMonth()]}`
}
// ─── Helpers ──────────────────────────────────────────────────────────────────

function toApiDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${dd}`
}

function addOneDay(d: Date): Date {
  const c = new Date(d)
  c.setDate(c.getDate() + 1)
  return c
}

const hhmm = new Intl.DateTimeFormat('en-us', { hour: '2-digit', minute: '2-digit', hour12: false })
const fmtTime = (unix: number) => hhmm.format(new Date(unix * 1000))

function dayLabel(d: Date): string {
  const now = new Date()
  const prev = new Date(); prev.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString()) return 'დღეს'
  if (d.toDateString() === prev.toDateString()) return 'გუშინ'
  return geoDate(d)
}

function startOfDay(unix: number): string {
  const d = new Date(unix * 1000)
  d.setHours(0, 0, 0, 0)
  return d.toDateString()
}

const Spinner = () => (
  <div className="flex items-center justify-center py-10">
    <div className="w-5 h-5 border-2 border-black/10 dark:border-white/10 rounded-full animate-spin" style={{ borderTopColor: '#d52b1e' }} />
  </div>
)

// ─── Component ────────────────────────────────────────────────────────────────

const FullScreenList: React.FC<Props> = ({
  onClose,
  onSelect,
  currentChannelId,
  rewindableDays = 7,
}) => {
  const nowSec = Math.floor(Date.now() / 1000)

  const dateStrip = Array.from({ length: rewindableDays + 1 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (rewindableDays - i))
    return d
  })

  const [channels, setChannels] = useState<Channel[]>([])
  const [loadingCh, setLoadingCh] = useState(true)
  const [errorCh, setErrorCh] = useState<string | null>(null)
  const [previewId, setPreviewId] = useState<string>(currentChannelId ?? '')
  const [programs, setPrograms] = useState<Program[]>([])
  const [loadingPr, setLoadingPr] = useState(false)
  const [selDate, setSelDate] = useState<Date>(dateStrip[dateStrip.length - 1])

  const programListRef = React.useRef<HTMLDivElement>(null)
  const liveRowRef = React.useRef<HTMLDivElement>(null)

  // ── Fetch channels ──────────────────────────────────────────────────────────
  useEffect(() => {
    let dead = false
    setLoadingCh(true)
    api.get('/api/channels')
      .then(res => {
        if (dead) return
        const data = res.data
        const channelList: Channel[] = data.channels ?? (Array.isArray(data) ? data : [])
        setChannels(channelList)
        setPreviewId(id => {
          if (id) return id
          const firstFree = channelList.find(c => c.is_free) ?? channelList[0]
          return firstFree?.id ?? ''
        })
      })
      .catch(e => { if (!dead) setErrorCh(String(e)) })
      .finally(() => { if (!dead) setLoadingCh(false) })
    return () => { dead = true }
  }, [])

  // ── Fetch all programs ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!previewId) return
    let dead = false
    setLoadingPr(true)
    setPrograms([])

    api.get(`/api/channels/${previewId}/programs/all`)
      .then(res => {
        if (dead) return
        setPrograms(res.data ?? [])
      })
      .catch(() => { })
      .finally(() => { if (!dead) setLoadingPr(false) })

    return () => { dead = true }
  }, [previewId])

  // ── Sort programs ───────────────────────────────────────────────────────────
  const displayPrograms = useMemo(() => {
    const seen = new Set<number>()
    return [...programs]
      .filter(p => { if (seen.has(p.UID)) return false; seen.add(p.UID); return true })
      .sort((a, b) => a.START_TIME - b.START_TIME)
  }, [programs])

  // ── Scroll to live program once loaded ─────────────────────────────────────
  useEffect(() => {
    if (loadingPr || !liveRowRef.current || !programListRef.current) return
    const container = programListRef.current
    const row = liveRowRef.current
    const offset = row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2
    container.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' })
  }, [loadingPr])

  const previewChannel = channels.find(c => c.id === previewId) ?? null
  const todaySelected = selDate.toDateString() === new Date().toDateString()

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

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="absolute inset-0 z-50 flex flex-col bg-white/80 dark:bg-black/70 backdrop-blur-lg" style={{ zoom: 2 }}>

      {/* ── Top bar ── */}
      <div className="shrink-0 px-3 pt-3 border-black/8  dark:border-white/10 ">
        <div className='bg-white/3 px-2 border-t border-x border-black/8 dark:border-white/8 dark:bg-white/3 backdrop-blur-md rounded-t-[10px]'>
          <div className="flex items-center justify-between">
            <span className="text-black/80 dark:text-white/80 font-bold text-sm tracking-wide">MediaBox</span>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-lg text-black/30 dark:text-white/40 hover:text-black/60 dark:hover:text-white/60 hover:bg-black/5 dark:hover:bg-white/10 transition-all duration-150"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Date strip */}
          <div className="flex gap-1.5 overflow-x-auto py-3" style={{ scrollbarWidth: 'none' }}>
            {dateStrip.map((d, i) => {
              const isSelected = d.toDateString() === selDate.toDateString()
              return (
                <button
                  key={i}
                  onClick={() => setSelDate(d)}
                  className={`shrink-0 px-2.5 py-1 rounded-[10px] text-[11px] font-semibold whitespace-nowrap transition-all duration-150 outline-none focus:outline-none focus-visible:outline-none ${isSelected
                      ? 'bg-white/20 dark:bg-white/15 border border-white/30 dark:border-white/20 text-black/80 dark:text-white/90'
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

        {/* Channel list */}
        <div className="w-1/4 shrink-0 rounded-bl-[10px] border-l border-b border-t border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-1 overflow-y-auto">
          {loadingCh ? (
            <Spinner />
          ) : errorCh ? (
            <p className="text-red-400 text-[10px] text-center px-3 pt-6">{errorCh}</p>
          ) : (
            <div className="divide-y divide-black/5 dark:divide-white/5">
              {channels.map(ch => {
                const isStreaming = ch.id === currentChannelId
                const isPreviewing = ch.id === previewId
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleChannelClick(ch)}
                    className={`w-full flex items-center border-b-0 gap-2 px-3 py-2 text-left  transition-all duration-150 rounded-[10px] ${isPreviewing && !isStreaming
                        ? 'bg-black/3 dark:bg-white/8'
                        : !isStreaming
                          ? 'border-l-transparent hover:bg-black/3 dark:hover:bg-white/4'
                          : ''
                      }`}
                    style={isStreaming ? { background: "rgba(189, 189, 189, 0.1)", borderRadius: "10px", borderColor: 'rgba(189, 189, 189, 0.1)', borderWidth: '2px' } : {}}
                  >

                    <div className="w-7 h-7 rounded-lg bg-white dark:bg-white/10 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                      {ch.logo
                        ? <img src={ch.logo} alt="" className="w-10/12 h-10/12 object-contain"
                          onError={e => { e.currentTarget.style.display = 'none' }} />
                        : <span className="text-black/40 dark:text-white/40 text-[9px] font-bold">{ch.name.slice(0, 2).toUpperCase()}</span>
                      }
                    </div>
                    <div className='flex flex-col'>
                          <span className="text-black/80 dark:text-white/75 text-[11px] font-medium truncate flex-1">{ch.name}</span>
                            <span className="text-black/80 dark:text-white/75 text-[11px] font-medium truncate flex-1">{ch.id}</span>
              
                    </div>
                      {isStreaming && (
                      <span className=" absolute right-3 w-1.5 h-1.5 rounded-full shrink-0 animate-pulse" style={{ backgroundColor: '#d52b1e' }} />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Program list */}
        <div className="flex-1 flex flex-col min-h-0 rounded-br-[10px] border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md overflow-hidden">

          {/* Channel sub-header */}
          {previewChannel && (
            <div className="shrink-0 flex items-center justify-between px-3 py-2  border-black/5 dark:border-white/8">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-white dark:bg-white/10 shadow-sm shrink-0 overflow-hidden flex items-center justify-center">
                  {previewChannel.logo
                    ? <img src={previewChannel.logo} alt="" className="w-10/12 h-10/12 object-contain" />
                    : <span className="text-black/40 dark:text-white/40 text-[8px] font-bold">{previewChannel.name.slice(0, 2).toUpperCase()}</span>
                  }
                </div>
                <span className="text-black/80 dark:text-white/75 text-xs font-semibold truncate">{previewChannel.name}</span>
              </div>
          
            </div>
          )}

          {/* Programs */}
          <div ref={programListRef} className="flex-1 overflow-y-auto">
            {loadingPr ? (
              <Spinner />
            ) : displayPrograms.length === 0 ? (
              <p className="text-black/30 dark:text-white/30 text-[11px] text-center pt-8">No programs available</p>
            ) : (
              <div className='px-3'>
                {(() => {
                  const items: React.ReactNode[] = []
                  let lastDayKey = ''
                  displayPrograms.forEach(p => {
                    const dayKey = startOfDay(p.START_TIME)
                    if (dayKey !== lastDayKey) {
                      lastDayKey = dayKey
                      const dayDate = new Date(p.START_TIME * 1000)
                      items.push(
                       <div className='flex items-center justify-center'>
                         <div className='h-px w-2/5 bg-white/10'></div>
                         <div
                          key={`divider-${dayKey}`}
                          className="top-0 z-10 px-3 py-1 flex rounded-[10px] gap-2 border w-2/5 items-center justify-center bg-red-500/80 dark:bg-red-500/20 backdrop-blur-sm border-y border-red-500 dark:border-red-400/70"
                        >
                          <span className="text-[10px] font-bold text-white dark:text-white uppercase tracking-wider">
                            {dayLabel(dayDate)}
                          </span>
                          <span className="text-[10px] text-black/20 dark:text-white">
                            {dayDate.toLocaleDateString('ka-GE', { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                        </div>
                         <div className='h-px w-2/5 bg-white/10'></div>
                       </div>
                       
                      )
                    }

                    const isCurrent = nowSec >= p.START_TIME && nowSec < p.END_TIME
                    const isPast = nowSec >= p.END_TIME
                    const isFuture = p.START_TIME > nowSec
                    const clickable = !isFuture

                    items.push(
                      <div
                        key={p.UID}
                        ref={isCurrent ? liveRowRef : undefined}
                        onClick={() => clickable && handleProgramClick(p)}
                        className={[
                          'flex items-center gap-2 px-3 py-2 transition-all duration-150 select-none rounded-[10px]',
                          isPast ? 'border-l-transparent opacity-90 cursor-pointer hover:opacity-80 hover:bg-black/3 dark:hover:bg-white/4  rounded-[10px]' : '',
                          isFuture ? 'border-l-transparent opacity-25 cursor-not-allowed  rounded-[10px]' : '',
                          isCurrent ? 'border border-white/20 bg-white/10 rounded-[10px]':'',
                        ].join(' ')}
                      > 
                      {isCurrent && <div className='w-1 h-full'>
                       <div className=' left-0 bg-red-500 w-[4px] rounded-2xl h-[20px]'></div>

                        </div>}
                       {!isCurrent && <div className='w-1 h-full'>
                       <div className=' left-0 bg-transparent w-[4px] rounded-2xl h-[20px]'></div>

                        </div>} 
                        <span
                          className={`text-[10px] font-mono tabular-nums shrink-0 w-16 ${!isCurrent ? 'text-black/30 dark:text-white/80' : ''}`}
                          style={isCurrent ? { color: '' } : {}}
                        >
                          {fmtTime(p.START_TIME)} - {fmtTime(p.END_TIME)}
                        </span>
                  
                        <span className={`text-[11px] font-medium truncate flex-1 ${isCurrent ? 'text-black/80 dark:text-white' : 'text-black/70 dark:text-white/75'}`}>
                          {p.TITLE}
                        </span>
                        {isCurrent && (
                          <span className="shrink-0 px-1.5 py-0.5 text-white text-[8px] font-bold rounded-md" style={{ background: '#d52b1e' }}>
                            LIVE
                          </span>
                        )}
                        {isPast}
                        {isFuture && <span className="text-black/20 dark:text-white/20 text-[10px] shrink-0">not avable</span>}
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
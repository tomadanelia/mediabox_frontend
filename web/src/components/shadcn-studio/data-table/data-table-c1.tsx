'use client'

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Equalizer } from '@/hmcomponents/AnimatedComponents/Equalizer'
import api from '@/lib/axios'

// ─── Types ────────────────────────────────────────────────────────────────────

type ProgramItem = {
  UID: number
  CHANNEL_ID: number
  START_TIME: number // unix seconds
  END_TIME: number   // unix seconds
  TITLE: string
  GANRE?: string
  DESCRIPTION?: string
}

type Props = {
  channelId?: string
  timeProgramm?: ProgramItem[] | null
  mode?: 'live' | 'archive'
  archiveTimestamp?: number | null
  /** Comes from streamService ArchiveResult.rewindableHours (data.length from backend) */
  rewindableHours?: number
  onProgramSelect?: (startTime: number) => void
  iconOnly?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const timeFormatter = new Intl.DateTimeFormat('en-GB', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

function formatUnix(unixSec: number): string {
  return timeFormatter.format(new Date(unixSec * 1000))
}

function startOfDayKey(unixSec: number): string {
  const d = new Date(unixSec * 1000)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

const GEO_WEEKDAYS_SHORT = ['კვირა', 'ორშაბათი', 'სამშაბათი', 'ოთხშაბათი', 'ხუთშაბათი', 'პარასკევი', 'შაბათი']

function dayLabel(unixSec: number): string {
  const d = new Date(unixSec * 1000)
  const now = new Date()
  const yesterday = new Date(); yesterday.setDate(now.getDate() - 1)

  if (d.toDateString() === now.toDateString()) return 'დღეს'
  if (d.toDateString() === yesterday.toDateString()) return 'გუშინ'

  return GEO_WEEKDAYS_SHORT[d.getDay()]
}

const GEO_MONTHS_SHORT = [
  'იანვარი',
  'თებერვალი',
  'მარტი',
  'აპრილი',
  'მაისი',
  'ივნისი',
  'ივლისი',
  'აგვისტო',
  'სექტემბერი',
  'ოქტომბერი',
  'ნოემბერი',
  'დეკემბერი'
]
function localeDateShort(unixSec: number): string {
  const d = new Date(unixSec * 1000)
  return `${d.getDate()} ${GEO_MONTHS_SHORT[d.getMonth()]}, ${d.getFullYear()}`
}

// ─── Tooltip ──────────────────────────────────────────────────────────────────

type TooltipState = {
  text: string
  x: number
  y: number
} | null

function Tooltip({ tooltip }: { tooltip: TooltipState }) {
  if (!tooltip) return null
  return (
    <div
      style={{
        position: 'fixed',
        left: tooltip.x,
        top: tooltip.y,
        transform: 'translateY(-100%) translateX(-50%)',
        zIndex: 9999,
        pointerEvents: 'none',
        maxWidth: 260,
        backgroundColor: 'rgba(0,0,0,0.85)',
        color: '#fff',
        fontSize: 12,
        fontWeight: 500,
        lineHeight: 1.4,
        padding: '6px 10px',
        borderRadius: 8,
        wordBreak: 'break-word',
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      }}
    >
      {tooltip.text}
    </div>
  )
}

// ─── Scroll helper ────────────────────────────────────────────────────────────

function scrollToCenter(container: HTMLElement, target: HTMLElement, behavior: ScrollBehavior = 'smooth') {
  const offset = target.offsetTop - container.clientHeight / 2 + target.clientHeight / 2
  container.scrollTo({ top: Math.max(0, offset), behavior })
}

// ─── Component ────────────────────────────────────────────────────────────────

const ChannelScheduleCL = ({
  channelId,
  timeProgramm,
  mode = 'live',
  archiveTimestamp = null,
  rewindableHours = 168, // default 7 days — matches streamService fallback
  onProgramSelect,
  iconOnly = false,
}: Props) => {

  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([])
  const [loading, setLoading] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const dividerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const programRefs = useRef<Record<number, HTMLDivElement | null>>({})

  // ── Fetch all programs when channelId changes ──────────────────────────────
  useEffect(() => {
    if (!channelId) return
    let dead = false
    setLoading(true)
    setAllPrograms([])

    api.get(`/api/channels/${channelId}/programs/all`)
      .then(res => {
        if (dead) return
        setAllPrograms(res.data ?? [])
      })
      .catch(() => {})
      .finally(() => { if (!dead) setLoading(false) })

    return () => { dead = true }
  }, [channelId])

  // ── Sorted + deduped ───────────────────────────────────────────────────────
  const sorted = useMemo(() => {
    const source = allPrograms.length > 0 ? allPrograms : (Array.isArray(timeProgramm) ? timeProgramm : [])
    const seen = new Set<number>()
    return [...source]
      .filter(p => { if (seen.has(p.UID)) return false; seen.add(p.UID); return true })
      .sort((a, b) => a.START_TIME - b.START_TIME)
  }, [allPrograms, timeProgramm])

  const nowSec = Math.floor(Date.now() / 1000)

  // Earliest unix second that is within the archive rewind window
  const archiveStartSec = nowSec - rewindableHours * 3600

  const activeSec =
    mode === 'archive' && archiveTimestamp !== null ? archiveTimestamp : nowSec

  // The program at the current seek position (or live now in live mode)
  const activeUID = useMemo(() => {
    if (!sorted.length) return null
    const match = sorted.find(p => activeSec >= p.START_TIME && activeSec < p.END_TIME)
    if (match) return match.UID
    if (activeSec <= sorted[0].START_TIME) return sorted[0].UID
    return null
  }, [sorted, activeSec])

  // The program actually on air right now on live TV — always wall-clock based
  const liveUID = useMemo(() => {
    if (!sorted.length) return null
    const match = sorted.find(p => nowSec >= p.START_TIME && nowSec < p.END_TIME)
    return match ? match.UID : null
  }, [sorted, nowSec])

  const dividerKeyForTimestamp = useCallback((targetSec: number): string | null => {
    if (!sorted.length) return null

    const target = new Date(targetSec * 1000)
    target.setHours(0, 0, 0, 0)
    const targetMidnight = target.getTime()

    const match = sorted.find(p => {
      const d = new Date(p.START_TIME * 1000)
      d.setHours(0, 0, 0, 0)
      return d.getTime() >= targetMidnight
    })

    return match ? startOfDayKey(match.START_TIME) : null
  }, [sorted])

  // ── Auto-scroll: when archiveTimestamp changes, center the active program ──
  useEffect(() => {
    if (!listRef.current || !sorted.length) return

    if (activeUID !== null && programRefs.current[activeUID]) {
      scrollToCenter(listRef.current, programRefs.current[activeUID]!)
      return
    }

    const targetSec = mode === 'archive' && archiveTimestamp !== null ? archiveTimestamp : nowSec
    const key = dividerKeyForTimestamp(targetSec)
    if (!key) return
    const divider = dividerRefs.current[key]
    if (divider) {
      const offset = divider.offsetTop - 60
      listRef.current.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' })
    }
  }, [archiveTimestamp, mode, sorted, activeUID])

  // ── Auto-scroll to live program on initial load ────────────────────────────
  const didInitialScroll = useRef(false)
  useEffect(() => {
    if (loading || didInitialScroll.current || !sorted.length || !listRef.current) return

    if (activeUID !== null && programRefs.current[activeUID]) {
      scrollToCenter(listRef.current, programRefs.current[activeUID]!, 'smooth')
      didInitialScroll.current = true
      return
    }

    const key = dividerKeyForTimestamp(activeSec)
    if (!key) return
    const divider = dividerRefs.current[key]
    if (divider) {
      const offset = divider.offsetTop - 60
      listRef.current.scrollTo({ top: Math.max(0, offset), behavior: 'smooth' })
      didInitialScroll.current = true
    }
  }, [sorted, loading])

  // ─── Tooltip handlers ─────────────────────────────────────────────────────
  const handleTitleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>, title: string) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setTooltip({
      text: title,
      x: rect.left + rect.width / 2,
      y: rect.top - 6,
    })
  }

  const handleTitleMouseLeave = () => setTooltip(null)

  // ─── Program state helpers ─────────────────────────────────────────────────

  const isSelectedProgram = (p: ProgramItem) => p.UID === activeUID
  const isLiveProgram     = (p: ProgramItem) => p.UID === liveUID
  const isPastProgram     = (p: ProgramItem) => nowSec >= p.END_TIME
  const isClickable       = (p: ProgramItem) => p.START_TIME <= nowSec
  // Program ended before the archive rewind window — no recording available
  const isOutOfArchive    = (p: ProgramItem) => p.END_TIME <= archiveStartSec

  const handleClick = (p: ProgramItem) => {
    if (!isClickable(p) || isOutOfArchive(p)) return
    onProgramSelect?.(p.START_TIME)
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-10">
          <div
            className="w-5 h-5 border-2 border-black/10 dark:border-white/10 rounded-full animate-spin"
            style={{ borderTopColor: '#d52b1e' }}
          />
        </div>
      )
    }

    if (!sorted.length) {
      return (
        <div className='px-4 py-3 text-sm text-black/35 dark:text-white/30'>
          პროგრამები არ მოიძებნა
        </div>
      )
    }

    const items: React.ReactNode[] = []
    let lastDayKey = ''

    sorted.forEach((p) => {
      const dayKey = startOfDayKey(p.START_TIME)

      // ── Day divider ──────────────────────────────────────────────────────
      if (dayKey !== lastDayKey) {
        lastDayKey = dayKey
        items.push(
          <div
            key={`divider-${dayKey}`}
            ref={el => { dividerRefs.current[dayKey] = el }}
            className="flex items-center justify-center py-2 px-3 gap-2"
          >
            <div className='h-px flex-1 bg-black/8 dark:bg-white/8' />
            <div
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-[10px] border',
                'bg-red-500/80 dark:bg-red-500/20 border-red-500 dark:border-red-400/70',
              )}
            >
              <span className="text-[10px] text-white/70 uppercase tracking-wider">
                {dayLabel(p.START_TIME)}
              </span>
              {!iconOnly && (
                <span className="text-[10px] text-white/70">
                  {localeDateShort(p.START_TIME)}
                </span>
              )}
            </div>
            <div className='h-px flex-1 bg-black/8 dark:bg-white/8' />
          </div>
        )
      }

      // ── Program row ──────────────────────────────────────────────────────
      const isSelected = isSelectedProgram(p)
      const isLive     = isLiveProgram(p)
      const isPast     = isPastProgram(p)
      const clickable  = isClickable(p)
      const isFuture   = !clickable
      const outOfArc   = isOutOfArchive(p)

      items.push(
        <div
          key={p.UID}
          ref={el => { programRefs.current[p.UID] = el }}
          onClick={() => handleClick(p)}
          title={
            isFuture ? 'Not yet available' :
            outOfArc ? 'Archive unavailable' :
            undefined
          }
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 transition-all duration-150 border-l-2',
            clickable && !outOfArc ? 'cursor-pointer' : 'cursor-default',
            isSelected
              ? 'bg-linear-to-r from-orange-50 to-yellow-50/60 dark:from-[#d52b1e1a] dark:to-black/5 border-l-[#d52b1e]'
              : outOfArc
              ? 'border-l-red-500/50 bg-red-500/5 dark:bg-red-500/8 opacity-60'
              : isPast
              ? 'border-l-transparent hover:bg-black/3 dark:hover:bg-white/4'
              : 'border-l-transparent opacity-30',
          )}
        >
          {/* Time */}
          <span className={cn(
            'text-sm font-medium w-10 shrink-0 tabular-nums',
            isSelected
              ? 'text-[#d52b1e]'
              : outOfArc
              ? 'text-red-400/70 dark:text-red-400/50'
              : 'text-black/30 dark:text-white/25'
          )}>
            {formatUnix(p.START_TIME)}
          </span>

          {/* Title */}
          {!iconOnly && (
            <span
              className={cn(
                'flex-1 text-sm truncate',
                outOfArc
                  ? 'text-red-500/55 dark:text-red-400/45 line-through decoration-red-400/40'
                  : 'text-black/80 dark:text-white/75'
              )}
              onMouseEnter={e => handleTitleMouseEnter(e, p.TITLE)}
              onMouseLeave={handleTitleMouseLeave}
            >
              {p.TITLE}
            </span>
          )}

          {/* Out-of-archive badge */}
          {!iconOnly && outOfArc && (
            <span className="shrink-0 text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-md bg-red-500/12 text-red-400 border border-red-400/25">
              არ არის
            </span>
          )}

          {/* LIVE badge — always pinned to the currently airing program,
              independent of where the archive seek position is */}
          {!iconOnly && isLive && (
            <span className="shrink-0 flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#d52b1e] text-white text-[9px] font-bold uppercase tracking-widest shadow-sm shadow-red-500/40 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-white/90" />
              Live
            </span>
          )}

          {/* Future lock */}
          {!iconOnly && isFuture && (
            <span
              className='material-symbols-outlined text-black/25 dark:text-white/20 shrink-0 select-none'
              style={{ fontSize: '14px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
            >
              lock
            </span>
          )}

          {isSelected && <Equalizer />}
        </div>
      )
    })

    return items
  }

  return (
    <>
      <Tooltip tooltip={tooltip} />
      <div className='w-full h-full flex'>
        <div className='rounded-xl border border-black/8 dark:border-white/8 w-full overflow-hidden bg-white/50 dark:bg-white/3 backdrop-blur-md flex flex-col'>
          <div
            ref={listRef}
            className='flex-1 overflow-y-auto divide-y-0'
          >
            {renderContent()}
          </div>
        </div>
      </div>
    </>
  )
}

export default ChannelScheduleCL
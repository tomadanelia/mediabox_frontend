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

const GEO_WEEKDAYS_SHORT = ['კვი', 'ორშ', 'სამ', 'ოთხ', 'ხუთ', 'პარ', 'შაბ']

function dayLabel(unixSec: number): string {
  const d = new Date(unixSec * 1000)
  const now = new Date()
  const yesterday = new Date(); yesterday.setDate(now.getDate() - 1)

  if (d.toDateString() === now.toDateString()) return 'დღეს'
  if (d.toDateString() === yesterday.toDateString()) return 'გუშინ'

  return GEO_WEEKDAYS_SHORT[d.getDay()]
}

const GEO_MONTHS_SHORT = ['იან','თებ','მარ','აპრ','მაი','ივნ','ივლ','აგვ','სექ','ოქტ','ნოე','დეკ']

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

/**
 * Scrolls `container` so that `target` is vertically centered.
 * Falls back gracefully if target is near the top/bottom edge.
 */
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
  onProgramSelect,
  iconOnly = false,
}: Props) => {

  const [allPrograms, setAllPrograms] = useState<ProgramItem[]>([])
  const [loading, setLoading] = useState(false)
  const [tooltip, setTooltip] = useState<TooltipState>(null)

  const listRef = useRef<HTMLDivElement>(null)
  const dividerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  // ── NEW: one ref per program row, keyed by UID ─────────────────────────────
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

  const activeSec =
    mode === 'archive' && archiveTimestamp !== null ? archiveTimestamp : nowSec

  const activeUID = useMemo(() => {
    if (!sorted.length) return null
    const match = sorted.find(p => activeSec >= p.START_TIME && activeSec < p.END_TIME)
    if (match) return match.UID
    if (activeSec <= sorted[0].START_TIME) return sorted[0].UID
    return null
  }, [sorted, activeSec])

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

    // Try to center on the exact active program row first
    if (activeUID !== null && programRefs.current[activeUID]) {
      scrollToCenter(listRef.current, programRefs.current[activeUID]!)
      return
    }

    // Fallback: scroll to the day divider if no active row ref yet
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

    // Center on the active program row
    if (activeUID !== null && programRefs.current[activeUID]) {
      scrollToCenter(listRef.current, programRefs.current[activeUID]!, 'smooth')
      didInitialScroll.current = true
      return
    }

    // Fallback: scroll to the day divider
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

  // ─── Render ────────────────────────────────────────────────────────────────

  const isCurrentProgram = (p: ProgramItem) => p.UID === activeUID
  const isPastProgram = (p: ProgramItem) => nowSec >= p.END_TIME
  const isClickable = (p: ProgramItem) => p.START_TIME <= nowSec
  const handleClick = (p: ProgramItem) => {
    if (!isClickable(p)) return
    onProgramSelect?.(p.START_TIME)
  }

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
              <span className="text-[10px] font-bold text-white uppercase tracking-wider">
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
      const isCurrent = isCurrentProgram(p)
      const isPast    = isPastProgram(p)
      const clickable = isClickable(p)
      const isFuture  = !clickable

      items.push(
        <div
          key={p.UID}
          // ── NEW: attach ref so we can scroll to this row ─────────────────
          ref={el => { programRefs.current[p.UID] = el }}
          onClick={() => handleClick(p)}
          title={isFuture ? 'Not yet available' : undefined}
          className={cn(
            'flex items-center gap-3 px-4 py-2.5 transition-all duration-150 border-l-2',
            clickable ? 'cursor-pointer' : 'cursor-default',
            isCurrent
              ? 'bg-linear-to-r from-orange-50 to-yellow-50/60 dark:from-[#d52b1e1a] dark:to-black/5 border-l-[#d52b1e]'
              : isPast
              ? 'border-l-transparent hover:bg-black/3 dark:hover:bg-white/4'
              : 'border-l-transparent opacity-30',
          )}
        >
          <span className={cn(
            'text-sm font-medium w-10 shrink-0 tabular-nums',
            isCurrent ? 'text-[#d52b1e]' : 'text-black/30 dark:text-white/25'
          )}>
            {formatUnix(p.START_TIME)}
          </span>

          {!iconOnly && (
            <span
              className='flex-1 text-sm truncate text-black/80 dark:text-white/75'
              onMouseEnter={e => handleTitleMouseEnter(e, p.TITLE)}
              onMouseLeave={handleTitleMouseLeave}
            >
              {p.TITLE}
            </span>
          )}

          {!iconOnly && isCurrent && (
            <span className='w-2 h-2 rounded-full bg-[#d52b1e] shrink-0 animate-pulse' />
          )}

          {!iconOnly && isFuture && (
            <span
              className='material-symbols-outlined text-black/25 dark:text-white/20 shrink-0 select-none'
              style={{ fontSize: '14px', fontVariationSettings: "'FILL' 0, 'wght' 300, 'GRAD' 0, 'opsz' 20" }}
            >
              lock
            </span>
          )}

          {isCurrent && <Equalizer />}
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
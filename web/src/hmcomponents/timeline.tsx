import React, { useMemo } from 'react'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

type ProgramItem = {
  UID: number
  CHANNEL_ID: number
  START_TIME: number
  END_TIME: number
  TITLE: string
  GANRE?: string
  DESCRIPTION?: string
}

interface TimeProgram {
  id: string
  title: string
  startUnixSec: number
  endUnixSec: number
  duration: number
}

type TimelineProps = {
  timeProgramm?: ProgramItem[] | null
  nextDayPrograms?: ProgramItem[] | null

  currentUnixSec?: number | null
  liveUnixSec?: number | null

  onSelectTime?: (unixSec: number, program?: ProgramItem) => void
}

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n))

const pad2 = (n: number) => String(n).padStart(2, '0')

const unixToHHmm = (unixSec: number) => {
  const d = new Date(unixSec * 1000)
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
}

const Timeline: React.FC<TimelineProps> = ({
  timeProgramm,
  nextDayPrograms,
  currentUnixSec,
  liveUnixSec,
  onSelectTime,
}) => {
  const programs: TimeProgram[] = useMemo(() => {
    if (!Array.isArray(timeProgramm)) return []
    return timeProgramm
      .slice()
      .sort((a, b) => a.START_TIME - b.START_TIME)
      .map((p) => ({
        id: String(p.UID),
        title: p.TITLE ?? '',
        startUnixSec: p.START_TIME,
        endUnixSec: p.END_TIME,
        duration: Math.max(0, Math.round((p.END_TIME - p.START_TIME) / 60)),
      }))
  }, [timeProgramm])

  // ─── Timeline range ────────────────────────────────────────────────────────
  // rangeStart: first program's start (or midnight of that day)
  // rangeEnd:   first program of next day (if provided) OR last program's end
  const { rangeStart, rangeEnd } = useMemo(() => {
    if (!programs.length) {
      const now = Math.floor(Date.now() / 1000)
      const midnight = now - (now % 86400) - new Date().getTimezoneOffset() * 60
      return { rangeStart: midnight, rangeEnd: midnight + 86400 }
    }

    const start = programs[0].startUnixSec
    const lastEnd = programs[programs.length - 1].endUnixSec

    // Use first program of next day as the right edge if available
    const nextDaySorted = Array.isArray(nextDayPrograms)
      ? [...nextDayPrograms].sort((a, b) => a.START_TIME - b.START_TIME)
      : []
    const end = nextDaySorted.length > 0 ? nextDaySorted[0].START_TIME : lastEnd

    return { rangeStart: start, rangeEnd: end }
  }, [programs, nextDayPrograms])

  const rangeDuration = Math.max(rangeEnd - rangeStart, 1)

  const toPercent = (unixSec: number) =>
    clamp(((unixSec - rangeStart) / rangeDuration) * 100)

  // ─── Hour ticks ────────────────────────────────────────────────────────────
  const hourTicks = useMemo(() => {
    const ticks: { unixSec: number; label: string }[] = []
    // round up rangeStart to the next full hour
    const firstHour = Math.ceil(rangeStart / 3600) * 3600
    for (let t = firstHour; t <= rangeEnd; t += 3600) {
      ticks.push({ unixSec: t, label: unixToHHmm(t) })
    }
    return ticks
  }, [rangeStart, rangeEnd])

  const live = liveUnixSec ?? Math.floor(Date.now() / 1000)
  const current = currentUnixSec ?? live

  const livePct = toPercent(live)
  const currentPct = toPercent(current)
const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
  const rect = e.currentTarget.getBoundingClientRect()
  const pct = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width))
  const ts = Math.floor(rangeStart + pct * rangeDuration)
  if (ts >= Math.floor(Date.now() / 1000)) return
  onSelectTime?.(ts)
}
  return (
    <div className="w-full px-4">
    <div className="relative w-full h-10">
  {/* Invisible full-width click zone */}
  <div
    className="absolute top-0 left-0 right-0 h-8 -translate-y-3 cursor-pointer z-10"
    onClick={handleTrackClick}
  />
  <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-400 ...">
          {/* LIVE (red) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute left-0 top-0 h-full bg-red-500" style={{ width: `${livePct}%` }} />
            </TooltipTrigger>
            <TooltipContent side="bottom">LIVE · {unixToHHmm(live)}</TooltipContent>
          </Tooltip>

          {/* CURRENT (blue) */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="absolute left-0 top-0 h-full bg-teal-500" style={{ width: `${currentPct}%` }} />
            </TooltipTrigger>
            <TooltipContent side="bottom">CURRENT · {unixToHHmm(current)}</TooltipContent>
          </Tooltip>
        </div>

        {/* hour ticks */}
        {hourTicks.map(({ unixSec, label }) => {
          const left = toPercent(unixSec)
          return (
            <div key={unixSec} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${left}%` }}>
              <div className="w-px h-3 bg-gray-500/70" />
              <div className="text-[10px] text-gray-600 mt-0.5 -translate-x-1 select-none">
                {label}
              </div>
            </div>
          )
        })}

        {/* program circles */}
        {programs.map((p) => (
   <div
  key={p.id}
  className={`absolute top-0 -translate-x-1/2 -translate-y-1/2 z-20 ${
    p.startUnixSec < live ? 'cursor-pointer' : 'cursor-default opacity'
  }`}
  style={{ left: `${toPercent(p.startUnixSec)}%` }}
  onClick={() => {
    if (p.startUnixSec >= live) return
    const original = Array.isArray(timeProgramm)
      ? timeProgramm.find((x) => String(x.UID) === p.id)
      : undefined
    onSelectTime?.(p.startUnixSec, original)
  }}
>
            <div className="group w-2 h-2 dark:bg-white rounded-full bg-gray-800">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="w-full h-full" />
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  {p.title} · {unixToHHmm(p.startUnixSec)}
                </TooltipContent>
              </Tooltip>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Timeline
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
  startTime: string
  duration: number
  startUnixSec: number
}

type TimelineProps = {
  timeProgramm?: ProgramItem[] | null

  currentUnixSec?: number | null
  liveUnixSec?: number | null

  onSelectTime?: (unixSec: number, program?: ProgramItem) => void
}

const clamp = (n: number, min = 0, max = 100) => Math.min(max, Math.max(min, n))

const Timeline: React.FC<TimelineProps> = ({ timeProgramm, currentUnixSec, liveUnixSec, onSelectTime }) => {
  const programs: TimeProgram[] = useMemo(() => {
    if (!Array.isArray(timeProgramm)) return []

    const pad2 = (n: number) => String(n).padStart(2, '0')

    return timeProgramm
      .slice()
      .sort((a, b) => a.START_TIME - b.START_TIME)
      .map((p) => {
        const start = new Date(p.START_TIME * 1000)
        const end = new Date(p.END_TIME * 1000)

        return {
          id: String(p.UID),
          title: p.TITLE ?? '',
          startTime: `${pad2(start.getHours())}:${pad2(start.getMinutes())}`,
          duration: Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000)),
          startUnixSec: p.START_TIME,
        }
      })
  }, [timeProgramm])

  const timeToPercent = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return ((h * 60 + m) / 1440) * 100
  }

  const unixToPercent = (unixSec: number) => {
    const d = new Date(unixSec * 1000)
    const minutes = d.getHours() * 60 + d.getMinutes() + d.getSeconds() / 60
    return (minutes / 1440) * 100
  }

  const unixToHHmm = (unixSec: number) => {
    const d = new Date(unixSec * 1000)
    const pad2 = (n: number) => String(n).padStart(2, '0')
    return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`
  }

  const hours = useMemo(() => Array.from({ length: 25 }, (_, i) => i), [])

  const live = liveUnixSec ?? Math.floor(Date.now() / 1000)
  const current = currentUnixSec ?? live

  const livePct = clamp(unixToPercent(live))
  const currentPct = clamp(unixToPercent(current))

  return (
    <div className="w-full px-4">
      <div className="relative w-full h-10">
        {/* TRACK */}
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gray-400 -translate-y-[1px] rounded-full overflow-hidden">
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
              <div className="absolute left-0 top-0 h-full bg-blue-500" style={{ width: `${currentPct}%` }} />
            </TooltipTrigger>
            <TooltipContent side="bottom">CURRENT · {unixToHHmm(current)}</TooltipContent>
          </Tooltip>
        </div>

        {/* hour ticks */}
        {hours.map((h) => {
          const left = (h / 24) * 100
          return (
            <div key={h} className="absolute top-1/2 -translate-y-1/2" style={{ left: `${left}%` }}>
              <div className="w-px h-3 bg-gray-500/70" />
              <div className="text-[10px] text-gray-600 mt-0.5 -translate-x-1 select-none">
                {String(h).padStart(2, '0')}
              </div>
            </div>
          )
        })}

        {/* program circles */}
        {programs.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${timeToPercent(p.startTime)}%` }}
            onClick={() => {
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
                  {p.title} · {p.startTime}
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

'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

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
  timeProgramm?: ProgramItem[] | null
  mode?: 'live' | 'archive'
  archiveTimestamp?: number | null
  onProgramSelect?: (startTime: number) => void
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

const GENRE_COLORS: Record<string, string> = {
  Drama:       'bg-purple-600/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400',
  Comedy:      'bg-yellow-600/10 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400',
  News:        'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
  Sports:      'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
  Kids:        'bg-pink-600/10 text-pink-600 dark:bg-pink-400/10 dark:text-pink-400',
  Documentary: 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
}

function getGenreColor(genre: string): string {
  return GENRE_COLORS[genre] ?? 'bg-gray-600/10 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400'
}

// ─── Component ────────────────────────────────────────────────────────────────

const ChannelScheduleCL = ({
  timeProgramm,
  mode = 'live',
  archiveTimestamp = null,
  onProgramSelect,
}: Props) => {
  const sorted = useMemo(() => {
    if (!Array.isArray(timeProgramm)) return []
    return [...timeProgramm].sort((a, b) => a.START_TIME - b.START_TIME)
  }, [timeProgramm])

  const nowSec = Math.floor(Date.now() / 1000)

  const activeSec =
    mode === 'archive' && archiveTimestamp !== null ? archiveTimestamp : nowSec

  const isCurrentProgram = (p: ProgramItem) =>
    activeSec >= p.START_TIME && activeSec < p.END_TIME

  const isPastProgram = (p: ProgramItem) => nowSec >= p.END_TIME

  const isClickable = (p: ProgramItem) => p.START_TIME <= nowSec

  const handleClick = (p: ProgramItem) => {
    if (!isClickable(p)) return
    onProgramSelect?.(p.START_TIME)
  }

  return (
    <div className='w-full h-[calc(100vh-266px)] flex'>
      <div className='rounded-xl border border-black/8 dark:border-white/8 w-full overflow-auto bg-white/50 dark:bg-white/3 backdrop-blur-md'>
        <div className='divide-y divide-black/5 dark:divide-white/5'>
          {sorted.length === 0 ? (
            <div className='px-4 py-3 text-sm text-black/35 dark:text-white/30'>
              No programs for this date.
            </div>
          ) : (
            sorted.map((p) => {
              const genre     = (p.GANRE && p.GANRE.trim()) ? p.GANRE.trim() : 'Other'
              const isCurrent = isCurrentProgram(p)
              const isPast    = isPastProgram(p)
              const clickable = isClickable(p)
              const isFuture  = !clickable

              return (
                <div
                  key={p.UID}
                  onClick={() => handleClick(p)}
                  title={isFuture ? 'Not yet available' : undefined}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 transition-all duration-150 border-l-2',
                    clickable ? 'cursor-pointer' : 'cursor-default',
                    isCurrent
                      ? 'bg-gradient-to-r from-orange-50 to-yellow-50/60 dark:from-orange-500/10 dark:to-yellow-400/5 border-l-orange-400'
                      : isPast
                      ? 'border-l-transparent opacity-50 hover:opacity-80 hover:bg-black/3 dark:hover:bg-white/4'
                      : 'border-l-transparent opacity-40',
                  )}
                >
                  <span className={cn(
                    'text-sm font-medium w-10 shrink-0 tabular-nums',
                    isCurrent ? 'text-orange-400' : 'text-black/30 dark:text-white/25'
                  )}>
                    {formatUnix(p.START_TIME)}
                  </span>

                  <span className='flex-1 text-sm truncate text-black/80 dark:text-white/75'>
                    {p.TITLE}
                  </span>

                  {isCurrent && (
                    <span className='w-2 h-2 rounded-full bg-orange-400 shrink-0 animate-pulse' />
                  )}

                  {isFuture && (
                    <span className='text-xs text-black/25 dark:text-white/20 shrink-0 select-none'>
                      🔒
                    </span>
                  )}

                  <Badge className={cn('border-none text-[10px] px-2 py-0.5 font-medium', getGenreColor(genre))}>
                    {genre}
                  </Badge>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default ChannelScheduleCL
'use client'

import { useMemo } from 'react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ProgramItem = {
  UID: number
  CHANNEL_ID: number
  START_TIME: number // unix seconds
  END_TIME: number // unix seconds
  TITLE: string
  GANRE?: string
  DESCRIPTION?: string
}

type Show = {
  time: string
  title: string
  genre: string
}

type Props = {
  timeProgramm?: ProgramItem[] | null
}

const ChannelScheduleCL = ({ timeProgramm }: Props) => {
  const schedule: Show[] = useMemo(() => {
    if (!Array.isArray(timeProgramm)) return []

    const fmt = new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    return timeProgramm
      .slice()
      .sort((a, b) => a.START_TIME - b.START_TIME)
      .map((p) => ({
        time: fmt.format(new Date(p.START_TIME * 1000)),
        title: p.TITLE ?? '',
        genre: (p.GANRE && p.GANRE.trim()) ? p.GANRE.trim() : 'Other',
      }))
  }, [timeProgramm])

  const getGenreColor = (genre: string) => {
    const styles =
      {
        Drama: 'bg-purple-600/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400',
        Comedy: 'bg-yellow-600/10 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400',
        News: 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
        Sports: 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
        Kids: 'bg-pink-600/10 text-pink-600 dark:bg-pink-400/10 dark:text-pink-400',
        Documentary: 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400',
      } as Record<string, string>

    return (
      styles[genre] ??
      'bg-gray-600/10 text-gray-600 dark:bg-gray-400/10 dark:text-gray-400'
    )
  }

  return (
    <div className='w-full h-[calc(100vh-266px)] flex'>
      <div className='rounded-lg border w-full  overflow-auto'>
        <div className='divide-y'>
          {schedule.length === 0 ? (
            <div className='px-4 py-3 text-sm text-muted-foreground'>
              No programs for this date.
            </div>
          ) : (
            schedule.map((show, idx) => (
              <div
                key={idx}
                className='flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors'
              >
                <span className='text-sm text-muted-foreground font-medium w-20 shrink-0'>
                  {show.time}
                </span>
                <span className='flex-1 text-sm truncate'>{show.title}</span>
                <Badge className={cn('border-none text-xs px-2 py-0.5', getGenreColor(show.genre))}>
                  {show.genre}
                </Badge>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ChannelScheduleCL

'use client'

import { useEffect, useState } from 'react'

import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'

type Show = {
  time: string
  title: string
  genre: 'Drama' | 'Comedy' | 'News' | 'Sports' | 'Kids' | 'Documentary'
}

const channelSchedule = {
  "channel": "HBO Max",
  "schedule": [
    { "time": "6:00 AM", "title": "Morning News", "genre": "News" },
    { "time": "7:00 AM", "title": "Breakfast Show", "genre": "News" },
    { "time": "8:00 AM", "title": "Game of Thrones", "genre": "Drama" },
    { "time": "9:00 AM", "title": "House of the Dragon", "genre": "Drama" },
    { "time": "10:00 AM", "title": "The Last of Us", "genre": "Drama" },
    { "time": "11:00 AM", "title": "Succession", "genre": "Drama" },
    { "time": "12:00 PM", "title": "Noon News", "genre": "News" },
    { "time": "1:00 PM", "title": "True Detective", "genre": "Drama" },
    { "time": "2:00 PM", "title": "The Wire", "genre": "Drama" },
    { "time": "3:00 PM", "title": "Barry", "genre": "Comedy" },
    { "time": "4:00 PM", "title": "Curb Your Enthusiasm", "genre": "Comedy" },
    { "time": "5:00 PM", "title": "Evening News", "genre": "News" },
    { "time": "6:00 PM", "title": "Westworld", "genre": "Drama" },
    { "time": "7:00 PM", "title": "The Sopranos", "genre": "Drama" },
    { "time": "8:00 PM", "title": "Euphoria", "genre": "Drama" },
    { "time": "9:00 PM", "title": "The White Lotus", "genre": "Drama" },
    { "time": "10:00 PM", "title": "Last Week Tonight", "genre": "Comedy" },
    { "time": "11:00 PM", "title": "Late Night News", "genre": "News" },
    { "time": "12:00 AM", "title": "Chernobyl", "genre": "Drama" },
    { "time": "1:00 AM", "title": "Band of Brothers", "genre": "Drama" },
    { "time": "2:00 AM", "title": "Six Feet Under", "genre": "Drama" },
    { "time": "3:00 AM", "title": "The Leftovers", "genre": "Drama" },
    { "time": "4:00 AM", "title": "Oz", "genre": "Drama" },
    { "time": "5:00 AM", "title": "Early Morning News", "genre": "News" }
  ]
}

const ChannelScheduleCL = () => {
  const [schedule, setSchedule] = useState<Show[]>([])

  useEffect(() => {
    setSchedule(channelSchedule.schedule as Show[])
  }, [])

  const getGenreColor = (genre: string) => {
    const styles = {
      'Drama': 'bg-purple-600/10 text-purple-600 dark:bg-purple-400/10 dark:text-purple-400',
      'Comedy': 'bg-yellow-600/10 text-yellow-600 dark:bg-yellow-400/10 dark:text-yellow-400',
      'News': 'bg-red-600/10 text-red-600 dark:bg-red-400/10 dark:text-red-400',
      'Sports': 'bg-green-600/10 text-green-600 dark:bg-green-400/10 dark:text-green-400',
      'Kids': 'bg-pink-600/10 text-pink-600 dark:bg-pink-400/10 dark:text-pink-400',
      'Documentary': 'bg-blue-600/10 text-blue-600 dark:bg-blue-400/10 dark:text-blue-400'
    }[genre]
    return styles
  }

  return (
    <div className='w-full h-[calc(100vh-220px)]'>
  

      <div className='rounded-lg border max-h-[500px] overflow-auto'>
        <div className='divide-y'>
          {schedule.map((show, idx) => (
            <div key={idx} className='flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors'>
              <span className='text-sm text-muted-foreground font-medium w-20 shrink-0'>
                {show.time}
              </span>
              <span className='flex-1 text-sm truncate'>
                {show.title}
              </span>
              <Badge className={cn('border-none text-xs px-2 py-0.5', getGenreColor(show.genre))}>
                {show.genre}
              </Badge>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ChannelScheduleCL
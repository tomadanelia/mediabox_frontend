'use client'

import { useEffect, useState } from 'react'


import type { ColumnDef, SortingState } from '@tanstack/react-table'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'

import { cn } from '@/lib/utils'

type Item = {
  channel: string
  availability: 'streaming' | 'Out of Stock' | 'Limited'
}

const columns: ColumnDef<Item>[] = [
  {
    id: 'logo',
    cell: ({ row }) => (
      <div className='w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm'>
        {(row.getValue('channel') as string).charAt(0)}
      </div>
    ),
    size: 32,
    enableSorting: false
  },
  {
    header: 'Channel Name',
    accessorKey: 'channel',
    cell: ({ row }) => <div className='font-medium'>{row.getValue('channel')}</div>
  },
  {
    header: 'Availability',
    accessorKey: 'availability',
    cell: ({ row }) => {
      const availability = row.getValue('availability') as string

      const styles = {
        'streaming':
          'bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40 [a&]:hover:bg-green-600/5 dark:[a&]:hover:bg-green-400/5',
        'Out of Stock':
          'bg-destructive/10 [a&]:hover:bg-destructive/5 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive',
        Limited:
          'bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40 [a&]:hover:bg-amber-600/5 dark:[a&]:hover:bg-amber-400/5'
      }[availability]

      return (
        <Badge className={(cn('border-none focus-visible:outline-none'), styles)}>{row.getValue('availability')}</Badge>
      )
    }
  }
]

const result = {
  "data": [
    {
      "channel": "HBO Max",
      "availability": "streaming"
    },
    {
      "channel": "Netflix",
      "availability": "streaming"
    },
    {
      "channel": "Disney+",
      "availability": "streaming"
    },
    {
      "channel": "Amazon Prime Video",
      "availability": "streaming"
    },
    {
      "channel": "Hulu",
      "availability": "streaming"
    },
    {
      "channel": "Apple TV+",
      "availability": "streaming"
    },
    {
      "channel": "Paramount+",
      "availability": "streaming"
    },
    {
      "channel": "Peacock",
      "availability": "streaming"
    },
    {
      "channel": "Discovery+",
      "availability": "Limited"
    },
    {
      "channel": "ESPN+",
      "availability": "streaming"
    },
    {
      "channel": "Showtime",
      "availability": "streaming"
    },
    {
      "channel": "Starz",
      "availability": "Limited"
    },
    {
      "channel": "BBC iPlayer",
      "availability": "streaming"
    },
    {
      "channel": "ITV Hub",
      "availability": "streaming"
    },
    {
      "channel": "Channel 4",
      "availability": "streaming"
    },
    {
      "channel": "Sky Sports",
      "availability": "streaming"
    },
    {
      "channel": "BT Sport",
      "availability": "Limited"
    },
    {
      "channel": "Eurosport",
      "availability": "streaming"
    },
    {
      "channel": "CNN",
      "availability": "streaming"
    },
    {
      "channel": "Fox News",
      "availability": "streaming"
    },
    {
      "channel": "MSNBC",
      "availability": "streaming"
    },
    {
      "channel": "NBC",
      "availability": "streaming"
    },
    {
      "channel": "ABC",
      "availability": "streaming"
    },
    {
      "channel": "CBS",
      "availability": "streaming"
    },
    {
      "channel": "FOX",
      "availability": "streaming"
    },
    {
      "channel": "The CW",
      "availability": "Limited"
    },
    {
      "channel": "National Geographic",
      "availability": "streaming"
    },
    {
      "channel": "History Channel",
      "availability": "streaming"
    },
    {
      "channel": "Discovery Channel",
      "availability": "streaming"
    },
    {
      "channel": "Animal Planet",
      "availability": "streaming"
    },
    {
      "channel": "Food Network",
      "availability": "streaming"
    },
    {
      "channel": "HGTV",
      "availability": "streaming"
    },
    {
      "channel": "TLC",
      "availability": "streaming"
    },
    {
      "channel": "Cartoon Network",
      "availability": "streaming"
    },
    {
      "channel": "Nickelodeon",
      "availability": "streaming"
    },
    {
      "channel": "Disney Channel",
      "availability": "streaming"
    },
    {
      "channel": "MTV",
      "availability": "Limited"
    },
    {
      "channel": "VH1",
      "availability": "Limited"
    },
    {
      "channel": "Comedy Central",
      "availability": "streaming"
    },
    {
      "channel": "AMC",
      "availability": "streaming"
    }
  ]
}

const DataTableDemo = () => {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'channel',
      desc: false
    }
  ])

  const [data, setData] = useState<Item[]>([])

  useEffect(() => {
    setData(result.data.map(item => ({
      channel: item.channel,
      availability: item.availability as 'streaming' | 'Out of Stock' | 'Limited'
    })))
  }, [])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableSortingRemoval: false,
    state: {
      sorting
    }
  })

  return (
   <div className='flex-1 flex flex-col h-[calc(100vh-220px)] overflow-hidden'>
  <div className='flex-1 rounded-lg border overflow-y-auto min-h-0'>
    <div className='divide-y'>
      {table.getRowModel().rows?.length ? (
        table.getRowModel().rows.map(row => (
          <div 
            key={row.id} 
            className='flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors'
          >
            <div className='w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0'>
              {(row.getValue('channel') as string).charAt(0)}
            </div>
            <div className='flex-1 text-sm font-medium truncate'>
              {(row.getValue('channel') as string).slice(0, 10)}
              {(row.getValue('channel') as string).length > 10 && '...'}
            </div>
            <div>
              {(() => {
                const availability = row.getValue('availability') as string
                const styles = {
                  'streaming':
                    'bg-green-600/10 text-green-600 focus-visible:ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 dark:focus-visible:ring-green-400/40',
                  'Out of Stock':
                    'bg-destructive/10 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 text-destructive',
                  Limited:
                    'bg-amber-600/10 text-amber-600 focus-visible:ring-amber-600/20 dark:bg-amber-400/10 dark:text-amber-400 dark:focus-visible:ring-amber-400/40'
                }[availability]

                return (
                  <Badge className={cn('border-none focus-visible:outline-none', styles)}>
                    {availability}
                  </Badge>
                )
              })()}
            </div>
          </div>
        ))
      ) : (
        <div className='p-8 text-center text-muted-foreground'>
          No channels found.
        </div>
      )}
    </div>
  </div>
</div>
  )
}

export default DataTableDemo



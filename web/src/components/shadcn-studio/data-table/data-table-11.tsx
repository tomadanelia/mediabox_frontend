'use client'

import { useEffect, useState } from 'react'
import type { ColumnDef, SortingState } from '@tanstack/react-table'
import { Bookmark } from 'lucide-react'
import IconButtonDemo from '../button/button-31'
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table'

import { Badge } from '@/components/ui/badge'
import BadgeLiveDemo from '../badge/cusotm/badge-c01'
import { cn } from '@/lib/utils'

type Channel = {
  id: number
  name: string
  url: string
  categories: string[]
  thumbnail: string
}

type Item = {
  channel: string
  availability: 'live' | 'Out of Stock' | 'Limited'
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
        'live':
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

type DataTableDemoProps = {
  filteredChannels: Channel[]
  onChannelSelect?: (channel: Channel) => void
}

const DataTableDemo = ({ filteredChannels, onChannelSelect }: DataTableDemoProps) => {
  const [sorting, setSorting] = useState<SortingState>([
    {
      id: 'channel',
      desc: false
    }
  ])

  const [data, setData] = useState<Item[]>([])

  useEffect(() => {
    // Convert filtered channels to table data format
    setData(filteredChannels.map(channel => ({
      channel: channel.name,
      availability: 'live' as const // All channels are live by default, you can modify this logic
    })))
  }, [filteredChannels])

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

  const handleChannelClick = (index: number) => {
    if (onChannelSelect) {
      onChannelSelect(filteredChannels[index])
    }
  }

  return (
    <div className='flex-1 flex flex-col h-[calc(100vh-196px)] overflow-hidden'>
      <div className='flex-1 rounded-lg border overflow-y-scroll min-h-0 '>
        <div className='divide-y'>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row, index) => (
              <div 
                key={row.id} 
                onClick={() => handleChannelClick(index)}
                className='flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer'
              >
                <div className='w-8 h-8 rounded bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0'>
                  {(row.getValue('channel') as string).charAt(0)}
                </div>
                <div className='flex-1 text-sm font-medium truncate'>
                  {(row.getValue('channel') as string).slice(0, 10)}
                  {(row.getValue('channel') as string).length > 10 && '...'}
                </div>
                <div className='flex gap-3'>
                   <svg width="0" height="0" style={{ position: 'absolute' }}>
    <defs>
      <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#fbff00" />
      </linearGradient>
    </defs>
  </svg>
  
                  <Bookmark fill='url(#iconGradient)' stroke='none' />
                  
                  {row.getValue('availability') === 'live' ? (
                    <></>
                  ) : (
                    <div>
                      
                    </div>
                  )}
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
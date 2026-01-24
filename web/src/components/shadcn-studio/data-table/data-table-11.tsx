'use client'

import { Bookmark } from 'lucide-react'

type Channel = {
  logo: string | undefined
  id: number
  name: string
  url: string
  categories: string[]
  thumbnail: string
}

type DataTableDemoProps = {
  filteredChannels?: Channel[] | null
  onChannelSelect?: (channel: Channel) => void
}

const DataTableDemo = ({
  filteredChannels,
  onChannelSelect
}: DataTableDemoProps) => {
  const safeChannels: Channel[] = Array.isArray(filteredChannels)
    ? filteredChannels
    : []

  return (
    <div className='flex-1 flex flex-col h-[calc(100vh-266px)] overflow-hidden'>
      <div className='flex-1 rounded-lg border overflow-y-scroll min-h-0'>
        <div className='divide-y'>
          {safeChannels.length > 0 ? (
            safeChannels.map((channel) => (
              <div
                key={channel.id}
                onClick={() => onChannelSelect?.(channel)}
                className='flex items-center gap-3 px-4 py-2.5 hover:bg-accent/50 transition-colors cursor-pointer'
              >
                {/* Logo */}
                <div className='w-8 h-8 rounded bg-white flex items-center justify-center text-white font-bold text-sm shrink-0'>
                  <img
                    src={channel.logo}
                    alt={channel.name}
                    className="w-10/12 h-10/12 object-cover rounded-[3px]"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder.png'
                    }}
                  />
                </div>

                {/* Channel name */}
                <div className='flex-1 text-sm font-medium truncate'>
                  {channel.name.slice(0, 10)}
                  {channel.name.length > 10 && '...'}
                </div>

                {/* Actions */}
                <div className='flex gap-3'>
                  <svg width="0" height="0" style={{ position: 'absolute' }}>
                    <defs>
                      <linearGradient
                        id="iconGradient"
                        x1="0%"
                        y1="0%"
                        x2="100%"
                        y2="100%"
                      >
                        <stop offset="0%" stopColor="#f97316" />
                        <stop offset="100%" stopColor="#fbff00" />
                      </linearGradient>
                    </defs>
                  </svg>

                  <Bookmark fill="url(#iconGradient)" stroke="none" />
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

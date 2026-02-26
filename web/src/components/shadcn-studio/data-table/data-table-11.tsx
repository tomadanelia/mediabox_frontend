'use client'

import { Bookmark, Search, X } from 'lucide-react'
import { useState, useMemo } from 'react'

// Matches the real API response
type Channel = {
  id: string
  uuid: string
  name: string
  logo: string
  number: number
  category: string
  category_id: string
}

type DataTableDemoProps = {
  filteredChannels: Channel[]
  onChannelSelect: (channel: Channel) => void
  selectedChannel?: Channel | null
}

const DataTableDemo = ({
  filteredChannels,
  onChannelSelect,
  selectedChannel,
}: DataTableDemoProps) => {
  const [query, setQuery] = useState('')

  const safeChannels: Channel[] = Array.isArray(filteredChannels) ? filteredChannels : []

  const displayedChannels = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return safeChannels
    return safeChannels.filter(
      (ch) =>
        ch.name.toLowerCase().includes(q) ||
        ch.category.toLowerCase().includes(q) ||
        String(ch.number).includes(q)
    )
  }, [safeChannels, query])

  return (
    <div className='flex-1 flex flex-col h-[calc(100vh-226px)] overflow-hidden gap-3'>

      {/* ── Search bar ── */}
      <div className='relative group shrink-0'>
        {/* glow ring */}
        <span
          className='pointer-events-none absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300'
          style={{
            boxShadow: '0 0 0 3px rgba(249,115,22,0.18), 0 0 14px 2px rgba(249,115,22,0.10)',
          }}
        />

        <Search
          size={15}
          className='absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400/70 group-focus-within:text-orange-400 transition-colors duration-200'
        />

        <input
          type='text'
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder='Search channels…'
          className='
            w-full h-10 pl-9 pr-9 rounded-xl text-sm
            bg-white/70 dark:bg-white/5
            border border-black/8 dark:border-white/10
            backdrop-blur-md
            placeholder:text-black/30 dark:placeholder:text-white/25
            text-black/80 dark:text-white/80
            outline-none
            transition-all duration-200
            focus:bg-white dark:focus:bg-white/10
            focus:border-orange-300/60 dark:focus:border-orange-400/30
          '
        />

        {query && (
          <button
            onClick={() => setQuery('')}
            className='absolute right-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors'
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Channel list ── */}
      <div className='flex-1 rounded-xl border border-black/8 dark:border-white/8 overflow-y-scroll min-h-0 bg-white/50 dark:bg-white/3 backdrop-blur-md'>

        {/* hidden gradient defs */}
        <svg width='0' height='0' style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id='iconGradient' x1='0%' y1='0%' x2='100%' y2='100%'>
              <stop offset='0%' stopColor='#f97316' />
              <stop offset='100%' stopColor='#fbff00' />
            </linearGradient>
          </defs>
        </svg>

        <div className='divide-y divide-black/5 dark:divide-white/5'>
          {displayedChannels.length > 0 ? (
            displayedChannels.map((channel) => {
              const isSelected = selectedChannel?.id === channel.id
              return (
                <div
                  key={channel.id}
                  onClick={() => onChannelSelect?.(channel)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 cursor-pointer
                    transition-all duration-150
                    ${isSelected
                      ? 'bg-gradient-to-r from-orange-50 to-yellow-50/60 dark:from-orange-500/10 dark:to-yellow-400/5 border-l-2 border-l-orange-400'
                      : 'border-l-2 border-l-transparent hover:bg-black/3 dark:hover:bg-white/4'
                    }
                  `}
                >
                  {/* logo */}
                  <div className='w-8 h-8 rounded-lg bg-white dark:bg-white/10 shadow-sm flex items-center justify-center shrink-0 overflow-hidden'>
                    <img
                      src={channel.logo}
                      alt={channel.name}
                      className='w-10/12 h-10/12 object-contain'
                      onError={(e) => { e.currentTarget.src = '/placeholder.png' }}
                    />
                  </div>

                  {/* channel number badge */}
                  <span className='text-[10px] font-semibold tabular-nums text-black/30 dark:text-white/25 w-6 text-right shrink-0'>
                    {channel.number}
                  </span>

                  {/* name */}
                  <div className='flex-1 text-sm font-medium truncate text-black/80 dark:text-white/75'>
                    {channel.name.length > 18 ? channel.name.slice(0, 18) + '…' : channel.name}
                  </div>

                  {/* category chip */}
                  <span className='hidden sm:inline-flex text-[10px] px-2 py-0.5 rounded-full bg-black/5 dark:bg-white/8 text-black/40 dark:text-white/35 font-medium truncate max-w-[70px]'>
                    {channel.category}
                  </span>

                  {/* bookmark */}
                  <Bookmark
                    size={15}
                    fill='url(#iconGradient)'
                    stroke='none'
                    className='shrink-0 opacity-60'
                  />
                </div>
              )
            })
          ) : (
            <div className='p-10 text-center'>
              <Search size={22} className='mx-auto mb-2 text-black/15 dark:text-white/15' />
              <p className='text-sm text-black/35 dark:text-white/30'>
                {query ? `No results for "${query}"` : 'No channels found.'}
              </p>
            </div>
          )}
        </div>
      </div>

    
    </div>
  )
}

export default DataTableDemo
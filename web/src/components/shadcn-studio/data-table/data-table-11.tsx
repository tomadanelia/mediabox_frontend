'use client'

import { Search, X } from 'lucide-react'
import { useState, useMemo } from 'react'

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
  iconOnly?: boolean
  markFavorite: (channelId: number) => void
  unmarkFavorite: (channelId: number) => void
  favlist: any[]
}

const DataTableDemo = ({
  filteredChannels,
  onChannelSelect,
  selectedChannel,
  iconOnly = false,
  markFavorite,
  unmarkFavorite,
  favlist
}: DataTableDemoProps) => {
  const [query, setQuery] = useState('')

  const safeChannels: Channel[] = Array.isArray(filteredChannels) ? filteredChannels : []

  const isFavorite = (channelId: number) => {
    return favlist.some(fav => fav.id === channelId);
  }

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
    <div className='flex-1 flex flex-col h-full lg:h-full overflow-hidden gap-3'>

      {/* ── Search bar ── */}
      {!iconOnly && (
        <div className='relative group shrink-0'>
          <span
            className='pointer-events-none absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300'
            style={{
              boxShadow: '0 0 0 3px rgba(249,115,22,0.18), 0 0 14px 2px rgba(249,115,22,0.10)',
            }}
          />
          <Search
            size={15}
            className='absolute left-3.5 top-1/2 -translate-y-1/2 text-[#d52b1eb3] group-focus-within:text-[d52b1e] transition-colors duration-200'
          />
          <input
            type='text'
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='მოძებნე არხი ...'
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
              focus:border-orange-300/60 dark:focus:border-[#d52b1e4d]
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
      )}

      {/* ── Channel list ── */}
      <div className='flex-1 rounded-xl border border-black/8 dark:border-white/8 overflow-y-scroll min-h-0 bg-white/50 dark:bg-white/3 backdrop-blur-md'>

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
              const isFav = isFavorite(Number(channel.id))
              return (
                <div
                  key={channel.id}
                  onClick={() => onChannelSelect?.(channel)}
                  className={`
                    flex items-center gap-3 px-4 py-2.5 cursor-pointer
                    transition-all duration-150
                    ${iconOnly ? 'justify-center px-0' : ''}
                    ${isSelected
                      ? 'bg-linear-to-r from-form-highlights/20 to-white/20 dark:from-[#d52b1e1a] dark:to-black/5 border-l-2 border-l-[#d52b1e]'
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
                      onError={(e) => { console.log("deamn");}}
                    />
                  </div>

                  {!iconOnly && (
                    <>
                      {/* channel number badge */}
                      <span className='text-[10px] font-semibold tabular-nums text-black/30 dark:text-white/25 w-6 text-right shrink-0'>
                        {channel.number}
                      </span>

                      {/* name */}
                      <div className='flex-1 text-sm font-medium truncate text-black/80 dark:text-white/75'>
                        {channel.name.length > 18 ? channel.name.slice(0, 18) + '…' : channel.name}
                      </div>

                      {/* favourite star — display only */}
                      {isFav && (
                        <span
                          className='material-symbols-outlined shrink-0 select-none'
                          style={{
                            fontSize: '16px',
                            color: '#f97316',
                            fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 20",
                          }}
                        >
                          star
                        </span>
                      )}
                    </>
                  )}

                  {/* icon-only mode: show star dot indicator instead */}
                  {iconOnly && isFav && (
                    <span className='absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-orange-400' />
                  )}
                </div>
              )
            })
          ) : (
            <div className='p-10 text-center'>
              <Search size={22} className='mx-auto mb-2 text-black/15 dark:text-white/15' />
              <p className='text-sm text-black/35 dark:text-white/30'>
                {query ? `No results for "${query}"` : 'არხი ვერ მოიძებნა'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DataTableDemo
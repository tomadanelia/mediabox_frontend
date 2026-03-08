'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Search, X, Radio, MapPin, Wifi, WifiOff, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024)
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 1024)
    window.addEventListener('resize', handler)
    return () => window.removeEventListener('resize', handler)
  }, [])
  return isMobile
}

function useOrientation(): boolean {
  const [isLandscape, setIsLandscape] = useState(
    () => window.matchMedia('(orientation: landscape)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isLandscape
}

function useIsPortrait(): boolean {
  return !useOrientation()
}

// ─── Types ────────────────────────────────────────────────────────────────────

type RadioChannel = {
  CHANNEL_NAME: string
  CHANNEL_NUMBER: string
  CHANNEL_LOGO: string
  POSTER: string | null
  CITY: string
  UID: string
  FREE: boolean
  STATUS: boolean
  DESCRIPTION: string | null
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CHANNELS: RadioChannel[] = [
  {
    CHANNEL_NAME: '42 პარალელი',
    CHANNEL_NUMBER: '1',
    CHANNEL_LOGO: 'https://img.mediabox.ge/nologo.png',
    POSTER: 'http://42p.ge/images/logo.png',
    CITY: 'ქუთაისი',
    UID: '56',
    FREE: true,
    STATUS: true,
    DESCRIPTION: null,
  },
  {
    CHANNEL_NAME: 'რადიო ძველი ქალაქი',
    CHANNEL_NUMBER: '3',
    CHANNEL_LOGO: 'https://img.mediabox.ge/nologo.png',
    POSTER: 'http://www.radiodk.ge//images/temp/2017/10/19/9749bdf8ad41e83b29938b27018e1597.png',
    CITY: 'ქუთაისი',
    UID: '58',
    FREE: true,
    STATUS: true,
    DESCRIPTION: null,
  },
  {
    CHANNEL_NAME: 'რადიო თბილისი',
    CHANNEL_NUMBER: '4',
    CHANNEL_LOGO: 'https://img.mediabox.ge/nologo.png',
    POSTER: null,
    CITY: 'თბილისი',
    UID: '59',
    FREE: true,
    STATUS: true,
    DESCRIPTION: null,
  },
  {
    CHANNEL_NAME: 'რადიო ათინათი',
    CHANNEL_NUMBER: '5',
    CHANNEL_LOGO: 'https://img.mediabox.ge/5c73d2b76fe97.png',
    POSTER: 'https://www.radioatinati.ge//images/temp/2019/02/21/de8c569b25587d158a0572fbe6f503b3.png',
    CITY: 'ბათუმი',
    UID: '60',
    FREE: true,
    STATUS: true,
    DESCRIPTION: null,
  },
  {
    CHANNEL_NAME: 'ბათუმი',
    CHANNEL_NUMBER: '6',
    CHANNEL_LOGO: 'https://img.mediabox.ge/nologo.png',
    POSTER: null,
    CITY: 'ბათუმი',
    UID: '61',
    FREE: true,
    STATUS: true,
    DESCRIPTION: null,
  },
  {
    CHANNEL_NAME: 'რადიო ფორტე',
    CHANNEL_NUMBER: '7',
    CHANNEL_LOGO: 'https://img.mediabox.ge/nologo.png',
    POSTER: null,
    CITY: 'თბილისი',
    UID: '62',
    FREE: true,
    STATUS: true,
    DESCRIPTION: null,
  },
  {
    CHANNEL_NAME: 'რადიო ჯეოსტარი',
    CHANNEL_NUMBER: '8',
    CHANNEL_LOGO: 'https://img.mediabox.ge/nologo.png',
    POSTER: null,
    CITY: 'თბილისი',
    UID: '63',
    FREE: false,
    STATUS: true,
    DESCRIPTION: null,
  },
  {
    CHANNEL_NAME: 'კომერციული რადიო',
    CHANNEL_NUMBER: '9',
    CHANNEL_LOGO: 'https://img.mediabox.ge/nologo.png',
    POSTER: null,
    CITY: 'ბათუმი',
    UID: '64',
    FREE: true,
    STATUS: true,
    DESCRIPTION: null,
  },
  {
    CHANNEL_NAME: 'რადიო მარიამი',
    CHANNEL_NUMBER: '10',
    CHANNEL_LOGO: 'https://img.mediabox.ge/nologo.png',
    POSTER: null,
    CITY: 'ქუთაისი',
    UID: '65',
    FREE: true,
    STATUS: false,
    DESCRIPTION: null,
  },
  {
    CHANNEL_NAME: 'რადიო ივერია',
    CHANNEL_NUMBER: '11',
    CHANNEL_LOGO: 'https://img.mediabox.ge/nologo.png',
    POSTER: null,
    CITY: 'თბილისი',
    UID: '66',
    FREE: false,
    STATUS: true,
    DESCRIPTION: null,
  },
]

const AVAILABLE_IDS = ['59', '61', '56', '60', '62', '64', '66']

const CITIES = ['ყველა', 'თბილისი', 'ქუთაისი', 'ბათუმი']

// ─── Audio Visualizer Bars ────────────────────────────────────────────────────

function AudioBars({ isPlaying, barCount = 28 }: { isPlaying: boolean; barCount?: number }) {
  const bars = useMemo(() => Array.from({ length: barCount }, (_, i) => i), [barCount])

  return (
    <div className="flex items-end gap-[2px] h-10" aria-hidden>
      {bars.map((i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-gradient-to-t from-orange-500 to-yellow-400 origin-bottom"
          style={{
            height: isPlaying ? undefined : '4px',
            animation: isPlaying
              ? `audioBar ${0.6 + (i % 7) * 0.11}s ease-in-out ${(i * 0.04) % 0.5}s infinite alternate`
              : 'none',
            minHeight: '4px',
            opacity: isPlaying ? 1 : 0.25,
            transition: 'opacity 0.4s',
          }}
        />
      ))}
      <style>{`
        @keyframes audioBar {
          0%   { height: 4px; }
          25%  { height: ${Math.floor(Math.random() * 10 + 8)}px; }
          50%  { height: ${Math.floor(Math.random() * 20 + 12)}px; }
          75%  { height: ${Math.floor(Math.random() * 14 + 6)}px; }
          100% { height: ${Math.floor(Math.random() * 28 + 16)}px; }
        }
      `}</style>
    </div>
  )
}

// Inline per-bar randomized heights so animation is unique per bar
function AudioBarsAnimated({ isPlaying, barCount = 32, small = false }: { isPlaying: boolean; barCount?: number; small?: boolean }) {
  const bars = useMemo(
    () =>
      Array.from({ length: barCount }, (_, i) => ({
        i,
        h1: 4 + Math.floor(Math.random() * 6),
        h2: 8 + Math.floor(Math.random() * 20),
        h3: 6 + Math.floor(Math.random() * 28),
        h4: 4 + Math.floor(Math.random() * 14),
        dur: 0.5 + (i % 9) * 0.08,
        delay: (i * 0.035) % 0.55,
      })),
    [barCount]
  )

  const height = small ? 'h-5' : 'h-10'

  return (
    <div className={`flex items-end gap-[2px] ${height}`} aria-hidden>
      {bars.map(({ i, h1, h2, h3, h4, dur, delay }) => (
        <div
          key={i}
          className="rounded-full bg-gradient-to-t from-orange-500 to-yellow-400 origin-bottom"
          style={{
            width: small ? '2px' : '3px',
            height: isPlaying ? undefined : small ? '2px' : '4px',
            animation: isPlaying
              ? `bar${i} ${dur}s ease-in-out ${delay}s infinite alternate`
              : 'none',
            opacity: isPlaying ? 0.9 : 0.2,
            transition: 'opacity 0.5s',
          }}
        />
      ))}
      <style>{bars
        .map(
          ({ i, h1, h2, h3, h4 }) =>
            `@keyframes bar${i}{0%{height:${h1}px}33%{height:${h2}px}66%{height:${h3}px}100%{height:${h4}px}}`
        )
        .join('')}</style>
    </div>
  )
}

// ─── Pulsing ring around logo ─────────────────────────────────────────────────

function PulsingRing({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <>
      <span
        className="absolute inset-0 rounded-2xl opacity-40"
        style={{ animation: 'pulseRing 1.8s ease-out infinite', background: 'radial-gradient(circle, rgba(251,146,60,0.5) 0%, transparent 70%)' }}
      />
      <span
        className="absolute inset-0 rounded-2xl opacity-25"
        style={{ animation: 'pulseRing 1.8s ease-out 0.6s infinite', background: 'radial-gradient(circle, rgba(251,191,36,0.4) 0%, transparent 70%)' }}
      />
      <style>{`@keyframes pulseRing{0%{transform:scale(1);opacity:0.4}100%{transform:scale(1.7);opacity:0}}`}</style>
    </>
  )
}

// ─── Channel Logo with fallback ───────────────────────────────────────────────

function ChannelLogo({ ch, size = 'md' }: { ch: RadioChannel; size?: 'sm' | 'md' | 'lg' }) {
  const [src, setSrc] = useState(ch.POSTER || ch.CHANNEL_LOGO)
  const dim = size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-12 h-12' : 'w-20 h-20'
  const rounded = size === 'lg' ? 'rounded-2xl' : 'rounded-xl'

  return (
    <div className={`${dim} ${rounded} bg-white dark:bg-white/10 shadow-sm flex items-center justify-center shrink-0 overflow-hidden`}>
      {src ? (
        <img
          src={src}
          alt={ch.CHANNEL_NAME}
          className="w-10/12 h-10/12 object-contain"
          onError={() => setSrc('')}
        />
      ) : (
        <Radio size={size === 'lg' ? 28 : size === 'md' ? 18 : 13} className="text-orange-400 opacity-60" />
      )}
    </div>
  )
}

// ─── NOW PLAYING CARD (desktop center) ───────────────────────────────────────

function NowPlayingCard({
  channel,
  isPlaying,
  volume,
  onVolumeChange,
  isMuted,
  onToggleMute,
}: {
  channel: RadioChannel | null
  isPlaying: boolean
  volume: number
  onVolumeChange: (v: number) => void
  isMuted: boolean
  onToggleMute: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 py-8 select-none">
      {/* Big logo with pulse */}
      <div className="relative">
        <PulsingRing active={isPlaying} />
        <div className="relative w-28 h-28 rounded-3xl bg-white/80 dark:bg-white/10 shadow-2xl shadow-orange-400/20 flex items-center justify-center overflow-hidden border border-black/8 dark:border-white/10">
          {channel ? (
            <ChannelLogo ch={channel} size="lg" />
          ) : (
            <Radio size={40} className="text-orange-400 opacity-40" />
          )}
          {isPlaying && (
            <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg, rgba(251,146,60,0.08) 0%, rgba(251,191,36,0.04) 100%)' }} />
          )}
        </div>
      </div>

      {/* Name + city */}
      <div className="text-center">
        <h2 className="text-xl font-bold text-black/85 dark:text-white/90 mb-1">
          {channel?.CHANNEL_NAME ?? 'აირჩიეთ რადიო'}
        </h2>
        {channel?.CITY && (
          <div className="flex items-center justify-center gap-1 text-sm text-black/40 dark:text-white/35">
            <MapPin size={11} />
            <span>{channel.CITY}</span>
          </div>
        )}
      </div>

      {/* Visualizer */}
      <div className="flex flex-col items-center gap-3">
        {channel ? (
          <AudioBarsAnimated isPlaying={isPlaying} barCount={36} />
        ) : (
          <div className="h-10 flex items-end gap-[2px]">
            {Array.from({ length: 36 }).map((_, i) => (
              <div key={i} className="w-[3px] h-[3px] rounded-full bg-black/10 dark:bg-white/10" />
            ))}
          </div>
        )}

        {/* Live badge */}
        {isPlaying && channel && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
          </div>
        )}
      </div>

      {/* Volume */}
      <div className="w-full flex items-center gap-3 px-2">
        <button
          onClick={onToggleMute}
          className="text-black/30 dark:text-white/30 hover:text-orange-400 transition-colors"
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <div className="flex-1 relative h-1.5 rounded-full bg-black/8 dark:bg-white/8">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400 transition-all"
            style={{ width: `${isMuted ? 0 : volume * 100}%` }}
          />
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={e => onVolumeChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer h-full"
          />
        </div>
        <span className="text-[10px] tabular-nums text-black/30 dark:text-white/30 w-7 text-right">
          {isMuted ? '0' : Math.round(volume * 100)}
        </span>
      </div>
    </div>
  )
}

// ─── Channel Row ──────────────────────────────────────────────────────────────

function ChannelRow({
  ch,
  isSelected,
  isAvailable,
  isPlaying,
  iconOnly,
  onClick,
}: {
  ch: RadioChannel
  isSelected: boolean
  isAvailable: boolean
  isPlaying: boolean
  iconOnly: boolean
  onClick: () => void
}) {
  return (
    <div
      onClick={onClick}
      title={!isAvailable ? 'Not available' : undefined}
      className={[
        'flex items-center gap-3 px-4 py-2.5 transition-all duration-150 border-l-2',
        isAvailable ? 'cursor-pointer' : 'cursor-default opacity-35',
        isSelected
          ? 'bg-gradient-to-r from-orange-50 to-yellow-50/60 dark:from-orange-500/10 dark:to-yellow-400/5 border-l-orange-400'
          : 'border-l-transparent hover:bg-black/3 dark:hover:bg-white/4',
        iconOnly ? 'justify-center px-0' : '',
      ].join(' ')}
    >
      <div className="relative shrink-0">
        <ChannelLogo ch={ch} size="sm" />
        {!isAvailable && (
          <span className="absolute -top-1 -right-1 text-[9px]">🔒</span>
        )}
      </div>

      {!iconOnly && (
        <>
          <span className="text-[10px] font-semibold tabular-nums text-black/30 dark:text-white/25 w-5 text-right shrink-0">
            {ch.CHANNEL_NUMBER}
          </span>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate text-black/80 dark:text-white/75 block">
              {ch.CHANNEL_NAME.length > 20 ? ch.CHANNEL_NAME.slice(0, 20) + '…' : ch.CHANNEL_NAME}
            </span>
            {ch.CITY && (
              <span className="text-[10px] text-black/30 dark:text-white/25 flex items-center gap-0.5">
                <MapPin size={8} />
                {ch.CITY}
              </span>
            )}
          </div>
          {isSelected && isPlaying && (
            <AudioBarsAnimated isPlaying barCount={8} small />
          )}
          {isSelected && !isPlaying && (
            <span className="w-2 h-2 rounded-full bg-orange-400/40 shrink-0" />
          )}
        </>
      )}
    </div>
  )
}

// ─── Channel List Panel ───────────────────────────────────────────────────────

function ChannelList({
  channels,
  selectedId,
  isPlaying,
  iconOnly,
  onSelect,
  availableIds,
}: {
  channels: RadioChannel[]
  selectedId: string | null
  isPlaying: boolean
  iconOnly: boolean
  onSelect: (ch: RadioChannel) => void
  availableIds: string[]
}) {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return channels
    return channels.filter(
      ch =>
        ch.CHANNEL_NAME.toLowerCase().includes(q) ||
        ch.CITY.toLowerCase().includes(q) ||
        ch.CHANNEL_NUMBER.includes(q)
    )
  }, [channels, query])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden gap-3">
      {!iconOnly && (
        <div className="relative group shrink-0">
          <span
            className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
            style={{ boxShadow: '0 0 0 3px rgba(249,115,22,0.18), 0 0 14px 2px rgba(249,115,22,0.10)' }}
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-orange-400/70 group-focus-within:text-orange-400 transition-colors duration-200" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search radio…"
            className="w-full h-10 pl-9 pr-9 rounded-xl text-sm bg-white/70 dark:bg-white/5 border border-black/8 dark:border-white/10 backdrop-blur-md placeholder:text-black/30 dark:placeholder:text-white/25 text-black/80 dark:text-white/80 outline-none transition-all duration-200 focus:bg-white dark:focus:bg-white/10 focus:border-orange-300/60 dark:focus:border-orange-400/30"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      <div className="flex-1 rounded-xl border border-black/8 dark:border-white/8 overflow-y-auto min-h-0 bg-white/50 dark:bg-white/3 backdrop-blur-md">
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {filtered.length > 0 ? (
            filtered.map(ch => (
              <ChannelRow
                key={ch.UID}
                ch={ch}
                isSelected={selectedId === ch.UID}
                isAvailable={availableIds.includes(ch.UID)}
                isPlaying={selectedId === ch.UID && isPlaying}
                iconOnly={iconOnly}
                onClick={() => availableIds.includes(ch.UID) && onSelect(ch)}
              />
            ))
          ) : (
            <div className="p-10 text-center">
              <Search size={22} className="mx-auto mb-2 text-black/15 dark:text-white/15" />
              <p className="text-sm text-black/35 dark:text-white/30">
                {query ? `No results for "${query}"` : 'No channels found.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── City Filter Pills ────────────────────────────────────────────────────────

function CityFilter({ cities, selected, onSelect }: { cities: string[]; selected: string; onSelect: (c: string) => void }) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
      {cities.map(city => (
        <button
          key={city}
          onClick={() => onSelect(city)}
          className={`shrink-0 h-8 px-3 rounded-full text-xs font-medium transition-all ${
            selected === city
              ? 'bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow-sm shadow-orange-300/30'
              : 'bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/50 dark:text-white/40 hover:text-black/70 dark:hover:text-white/60'
          }`}
        >
          {city}
        </button>
      ))}
    </div>
  )
}

// ─── Mobile Portrait Grid ─────────────────────────────────────────────────────

function MobileChannelGrid({
  channels,
  selectedId,
  isPlaying,
  onSelect,
  availableIds,
}: {
  channels: RadioChannel[]
  selectedId: string | null
  isPlaying: boolean
  onSelect: (ch: RadioChannel) => void
  availableIds: string[]
}) {
  const [search, setSearch] = useState('')
  const [city, setCity] = useState('ყველა')

  const filtered = useMemo(() => {
    return channels.filter(ch => {
      const matchCity = city === 'ყველა' || ch.CITY === city
      const matchSearch = ch.CHANNEL_NAME.toLowerCase().includes(search.toLowerCase())
      return matchCity && matchSearch
    })
  }, [channels, city, search])

  return (
    <div className="flex flex-col gap-3 p-3">
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search…"
        className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/80 dark:text-white/80 placeholder:text-black/30 dark:placeholder:text-white/30 outline-none focus:ring-2 focus:ring-orange-400/40"
      />
      <CityFilter cities={CITIES} selected={city} onSelect={setCity} />
      <div className="grid grid-cols-3 gap-2">
        {filtered.map(ch => {
          const isSelected = selectedId === ch.UID
          const isAvailable = availableIds.includes(ch.UID)
          return (
            <div
              key={ch.UID}
              onClick={() => isAvailable && onSelect(ch)}
              className={[
                'relative flex flex-col items-center gap-1.5 p-2.5 rounded-2xl cursor-pointer transition-all duration-150 active:scale-95',
                isSelected
                  ? 'bg-gradient-to-br from-orange-500/20 to-yellow-400/10 border border-orange-400/40 shadow-sm shadow-orange-300/20'
                  : 'bg-white/60 dark:bg-white/5 border border-black/8 dark:border-white/8',
                !isAvailable ? 'opacity-40 cursor-default' : '',
              ].join(' ')}
            >
              {!isAvailable && <span className="absolute top-1.5 right-1.5 text-[9px]">🔒</span>}
              <span className="absolute top-1.5 left-1.5 text-[8px] font-bold text-black/25 dark:text-white/20">
                {ch.CHANNEL_NUMBER}
              </span>
              <div className="relative">
                <ChannelLogo ch={ch} size="md" />
                {isSelected && isPlaying && (
                  <div className="absolute inset-0 rounded-xl bg-orange-400/10 flex items-end justify-center pb-1">
                    <AudioBarsAnimated isPlaying barCount={6} small />
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-medium text-center leading-tight line-clamp-2 ${isSelected ? 'text-orange-500 dark:text-orange-400' : 'text-black/60 dark:text-white/50'}`}>
                {ch.CHANNEL_NAME}
              </span>
              <span className="text-[8px] text-black/25 dark:text-white/20 flex items-center gap-0.5">
                <MapPin size={7} />{ch.CITY}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RadioPage() {
  const [selectedChannel, setSelectedChannel] = useState<RadioChannel | null>(MOCK_CHANNELS[2])
  const [isPlaying, setIsPlaying] = useState(false)
  const [volume, setVolume] = useState(0.75)
  const [isMuted, setIsMuted] = useState(false)
  const [selectedCity, setSelectedCity] = useState('ყველა')
  const [leftExpanded, setLeftExpanded] = useState(false)
  const [playerExpanded, setPlayerExpanded] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)
  const isMobile = useIsMobile()
  const isPortrait = useIsPortrait()
  const isMobilePortrait = isMobile && isPortrait

  const filteredChannels = useMemo(() =>
    selectedCity === 'ყველა'
      ? MOCK_CHANNELS
      : MOCK_CHANNELS.filter(ch => ch.CITY === selectedCity),
    [selectedCity]
  )

  const handleSelect = useCallback((ch: RadioChannel) => {
    setSelectedChannel(ch)
    setIsPlaying(true)
  }, [])

  const togglePlay = useCallback(() => {
    if (!selectedChannel) return
    setIsPlaying(v => !v)
  }, [selectedChannel])

  // Simulate audio (no real stream URL in demo)
  useEffect(() => {
    if (!audioRef.current) return
    if (isPlaying) {
      audioRef.current.volume = isMuted ? 0 : volume
    }
  }, [isPlaying, volume, isMuted])

  // ── MOBILE PORTRAIT ───────────────────────────────────────────────────────

  if (isMobilePortrait) {
    return (
      <div className="flex flex-col w-full h-[calc(100vh-80px)] bg-gray-50 dark:bg-zinc-950 overflow-hidden">
        <audio ref={audioRef} />

        {/* Mini now-playing bar */}
        <div
          className="shrink-0 bg-white/80 dark:bg-zinc-900/90 border-b border-black/8 dark:border-white/8 backdrop-blur-md"
          style={{ transition: 'all 0.3s' }}
        >
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="relative shrink-0">
              {selectedChannel && <ChannelLogo ch={selectedChannel} size="sm" />}
              <PulsingRing active={isPlaying} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-black/80 dark:text-white/80 truncate">
                {selectedChannel?.CHANNEL_NAME ?? 'Select a station'}
              </p>
              {selectedChannel?.CITY && (
                <p className="text-[10px] text-black/35 dark:text-white/30 flex items-center gap-0.5">
                  <MapPin size={8} />{selectedChannel.CITY}
                </p>
              )}
            </div>

            {selectedChannel && (
              <AudioBarsAnimated isPlaying={isPlaying} barCount={10} small />
            )}

            <button
              onClick={togglePlay}
              disabled={!selectedChannel}
              className={`w-9 h-9 flex items-center justify-center rounded-xl transition-all ${
                isPlaying
                  ? 'bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow-md shadow-orange-400/30'
                  : 'bg-black/6 dark:bg-white/8 text-black/50 dark:text-white/40'
              } disabled:opacity-30`}
            >
              {isPlaying ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              )}
            </button>

            {isPlaying && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide">Live</span>
              </div>
            )}
          </div>

          {/* Volume strip */}
          {playerExpanded && (
            <div className="flex items-center gap-3 px-3 pb-3">
              <button onClick={() => setIsMuted(v => !v)} className="text-black/30 dark:text-white/30 hover:text-orange-400">
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <div className="flex-1 relative h-1.5 rounded-full bg-black/8 dark:bg-white/8">
                <div className="absolute left-0 top-0 h-full rounded-full bg-gradient-to-r from-orange-500 to-yellow-400" style={{ width: `${isMuted ? 0 : volume * 100}%` }} />
                <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={e => setVolume(parseFloat(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
              </div>
            </div>
          )}

          <button
            onClick={() => setPlayerExpanded(v => !v)}
            className="w-full flex justify-center pb-1 text-black/20 dark:text-white/15 hover:text-orange-400 transition-colors"
          >
            {playerExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        {/* Channel grid */}
        <div className="flex-1 overflow-y-auto overscroll-contain">
          <MobileChannelGrid
            channels={MOCK_CHANNELS}
            selectedId={selectedChannel?.UID ?? null}
            isPlaying={isPlaying}
            onSelect={ch => { handleSelect(ch) }}
            availableIds={AVAILABLE_IDS}
          />
        </div>
      </div>
    )
  }

  // ── DESKTOP + LANDSCAPE ────────────────────────────────────────────────────

  return (
    <div className="flex w-full h-[calc(100vh-80px)] bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      <audio ref={audioRef} />

      {/* LEFT: channel list */}
      <div className={`
        lg:relative lg:w-1/4 xl:w-1/5
        absolute z-20 flex flex-col h-full
        transition-all duration-300 ease-in-out
        ${isMobile ? (leftExpanded ? 'w-56' : 'w-[65px]') : ''}
      `}>
        {isMobile && (
          <button
            onClick={() => setLeftExpanded(v => !v)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-6 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-r-lg shadow-md text-black/40 dark:text-white/40 hover:text-orange-400 transition-colors"
          >
            {leftExpanded
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
            }
          </button>
        )}
        <div className="flex-1 flex flex-col h-full p-3 gap-3 overflow-hidden">
          {!isMobile && (
            <CityFilter cities={CITIES} selected={selectedCity} onSelect={setSelectedCity} />
          )}
          <ChannelList
            channels={filteredChannels}
            selectedId={selectedChannel?.UID ?? null}
            isPlaying={isPlaying}
            iconOnly={isMobile && !leftExpanded}
            onSelect={handleSelect}
            availableIds={AVAILABLE_IDS}
          />
        </div>
      </div>

      {/* LEFT spacer on mobile */}
      {isMobile && <div className="w-[65px] shrink-0" />}

      {/* CENTER: now playing */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center relative">

          {/* Background glow */}
          {isPlaying && selectedChannel && (
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(251,146,60,0.07) 0%, transparent 70%)',
              }}
            />
          )}

          <NowPlayingCard
            channel={selectedChannel}
            isPlaying={isPlaying}
            volume={volume}
            onVolumeChange={setVolume}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(v => !v)}
          />

          {/* Play / Pause button */}
          <button
            onClick={togglePlay}
            disabled={!selectedChannel}
            className={`
              mt-2 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200
              ${isPlaying
                ? 'bg-gradient-to-br from-orange-500 to-yellow-400 text-white shadow-xl shadow-orange-400/40 scale-105'
                : 'bg-white/80 dark:bg-white/8 border border-black/8 dark:border-white/10 text-black/50 dark:text-white/40 hover:scale-105 hover:shadow-lg'
              }
              disabled:opacity-30 disabled:scale-100 disabled:shadow-none
            `}
          >
            {isPlaying ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
            )}
          </button>

          {/* City filter on desktop center-bottom */}
          {!isMobile && (
            <div className="absolute bottom-4 w-full flex justify-center">
              <CityFilter cities={CITIES} selected={selectedCity} onSelect={setSelectedCity} />
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: signal / station info */}
      <div className={`
        lg:relative lg:w-1/4 xl:w-1/5
        hidden lg:flex flex-col h-full p-3 gap-3 overflow-hidden
      `}>
        <div className="rounded-xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {isPlaying
              ? <Wifi size={14} className="text-green-500" />
              : <WifiOff size={14} className="text-black/25 dark:text-white/25" />
            }
            <span className="text-xs font-medium text-black/50 dark:text-white/40">
              {isPlaying ? 'Streaming' : 'Offline'}
            </span>
          </div>

          {selectedChannel && (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-black/30 dark:text-white/25 uppercase tracking-widest">Station</span>
                <span className="text-sm font-semibold text-black/80 dark:text-white/80">{selectedChannel.CHANNEL_NAME}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-black/30 dark:text-white/25 uppercase tracking-widest">City</span>
                <span className="text-sm text-black/60 dark:text-white/50 flex items-center gap-1">
                  <MapPin size={11} />{selectedChannel.CITY}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-black/30 dark:text-white/25 uppercase tracking-widest">Channel No.</span>
                <span className="text-sm text-black/60 dark:text-white/50">#{selectedChannel.CHANNEL_NUMBER}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-black/30 dark:text-white/25 uppercase tracking-widest">Access</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${selectedChannel.FREE ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-orange-500/10 text-orange-600 dark:text-orange-400'}`}>
                  {selectedChannel.FREE ? 'Free' : 'Premium'}
                </span>
              </div>
            </>
          )}
        </div>

        {/* All stations count */}
        <div className="rounded-xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Radio size={13} className="text-orange-400" />
            <span className="text-xs font-semibold text-black/50 dark:text-white/40 uppercase tracking-widest">Stations</span>
          </div>
          <div className="space-y-2">
            {CITIES.filter(c => c !== 'ყველა').map(city => {
              const count = MOCK_CHANNELS.filter(ch => ch.CITY === city).length
              return (
                <div key={city} className="flex items-center justify-between">
                  <span className="text-xs text-black/50 dark:text-white/40">{city}</span>
                  <span className="text-xs font-semibold tabular-nums text-black/60 dark:text-white/50">{count}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
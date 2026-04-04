'use client'

import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { Search, X, Radio, Wifi, WifiOff, Volume2, VolumeX, ChevronUp, ChevronDown } from 'lucide-react'
import api from '@/lib/axios'

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

function useIsPortrait(): boolean {
  const [isPortrait, setIsPortrait] = useState(
    () => !window.matchMedia('(orientation: landscape)').matches
  )
  useEffect(() => {
    const mq = window.matchMedia('(orientation: landscape)')
    const handler = (e: MediaQueryListEvent) => setIsPortrait(!e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return isPortrait
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface RadioChannel {
  id: number | string
  name: string
  logo: string | null
  is_free: boolean | 0 | 1
  has_access: boolean | 0 | 1
}

interface StreamResponse {
  url: string
  type: string
}

type PlayerStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error'

const bool = (v: boolean | 0 | 1): boolean => !!v
const sameId = (a: number | string | null | undefined, b: number | string | null | undefined) =>
  a != null && b != null && String(a) === String(b)

// ─── Audio Visualizer ─────────────────────────────────────────────────────────

function AudioBarsAnimated({ isPlaying, barCount = 32, small = false }: { isPlaying: boolean; barCount?: number; small?: boolean }) {
  const bars = useMemo(() =>
    Array.from({ length: barCount }, (_, i) => ({
      i,
      h1: 4  + Math.floor(Math.random() * 6),
      h2: 8  + Math.floor(Math.random() * 20),
      h3: 6  + Math.floor(Math.random() * 28),
      h4: 4  + Math.floor(Math.random() * 14),
      dur: 0.5 + (i % 9) * 0.08,
      delay: (i * 0.035) % 0.55,
    })),
    [barCount]
  )
  return (
    <div className={`flex items-end gap-[2px] ${small ? 'h-5' : 'h-10'}`} aria-hidden>
      {bars.map(({ i, h1, h2, h3, h4, dur, delay }) => (
        <div key={i} className="rounded-full origin-bottom"
          style={{
            width: small ? '2px' : '3px',
            background: '#d52b1e',
            height: isPlaying ? undefined : small ? '2px' : '4px',
            animation: isPlaying ? `bar${i} ${dur}s ease-in-out ${delay}s infinite alternate` : 'none',
            opacity: isPlaying ? 0.9 : 0.2,
            transition: 'opacity 0.5s',
          }}
        />
      ))}
      <style>{bars.map(({ i, h1, h2, h3, h4 }) =>
        `@keyframes bar${i}{0%{height:${h1}px}33%{height:${h2}px}66%{height:${h3}px}100%{height:${h4}px}}`
      ).join('')}</style>
    </div>
  )
}

// ─── Pulsing ring ─────────────────────────────────────────────────────────────

function PulsingRing({ active }: { active: boolean }) {
  if (!active) return null
  return (
    <>
      <span className="absolute inset-0 rounded-2xl opacity-40" style={{ animation: 'pulseRing 1.8s ease-out infinite', background: 'radial-gradient(circle, rgba(213,43,30,0.5) 0%, transparent 70%)' }} />
      <span className="absolute inset-0 rounded-2xl opacity-25" style={{ animation: 'pulseRing 1.8s ease-out 0.6s infinite', background: 'radial-gradient(circle, rgba(33,38,44,0.4) 0%, transparent 70%)' }} />
      <style>{`@keyframes pulseRing{0%{transform:scale(1);opacity:0.4}100%{transform:scale(1.7);opacity:0}}`}</style>
    </>
  )
}

// ─── Channel Logo ─────────────────────────────────────────────────────────────

function ChannelLogo({ ch, size = 'md' }: { ch: RadioChannel; size?: 'sm' | 'md' | 'lg' }) {
  const [errored, setErrored] = useState(false)
  const dim     = size === 'sm' ? 'w-8 h-8'   : size === 'md' ? 'w-12 h-12' : 'w-20 h-20'
  const rounded = size === 'lg' ? 'rounded-2xl' : 'rounded-xl'
  return (
    <div className={`${dim} ${rounded} bg-white dark:bg-white/10 shadow-sm flex items-center justify-center shrink-0 overflow-hidden`}>
      {ch.logo && !errored
        ? <img src={ch.logo} alt={ch.name} className="w-10/12 h-10/12 object-contain" onError={() => setErrored(true)} />
        : <Radio size={size === 'lg' ? 28 : size === 'md' ? 18 : 13} style={{ color: '#d52b1e', opacity: 0.6 }} />
      }
    </div>
  )
}

// ─── Now Playing Card ─────────────────────────────────────────────────────────

function NowPlayingCard({ channel, status, volume, onVolumeChange, isMuted, onToggleMute }: {
  channel: RadioChannel | null
  status: PlayerStatus
  volume: number
  onVolumeChange: (v: number) => void
  isMuted: boolean
  onToggleMute: () => void
}) {
  const isPlaying = status === 'playing'
  const isLoading = status === 'loading'
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-6 py-8 select-none">
      <div className="relative">
        <PulsingRing active={isPlaying} />
        <div className="relative w-28 h-28 rounded-3xl bg-white/80 dark:bg-white/10 shadow-2xl flex items-center justify-center overflow-hidden border border-black/8 dark:border-white/10"
          style={{ boxShadow: isPlaying ? '0 25px 50px -12px rgba(213,43,30,0.2)' : undefined }}
        >
          {channel ? <ChannelLogo ch={channel} size="lg" /> : <Radio size={40} style={{ color: '#d52b1e', opacity: 0.4 }} />}
          {isPlaying && <div className="absolute inset-0 rounded-3xl" style={{ background: 'linear-gradient(135deg,rgba(213,43,30,0.08) 0%,rgba(33,38,44,0.04) 100%)' }} />}
        </div>
      </div>

      <div className="text-center">
        <h2 className="text-xl font-bold text-black/85 dark:text-white/90 mb-1">
          {channel?.name ?? 'Select a station'}
        </h2>
        {isLoading && <p className="text-xs animate-pulse" style={{ color: '#d52b1e' }}>Connecting…</p>}
        {status === 'error' && <p className="text-xs text-red-400">Stream unavailable</p>}
      </div>

      <div className="flex flex-col items-center gap-3">
        {channel
          ? <AudioBarsAnimated isPlaying={isPlaying} barCount={36} />
          : <div className="h-10 flex items-end gap-[2px]">{Array.from({ length: 36 }).map((_, i) => <div key={i} className="w-[3px] h-[3px] rounded-full bg-black/10 dark:bg-white/10" />)}</div>
        }
        {isPlaying && channel && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-500 uppercase tracking-widest">Live</span>
          </div>
        )}
      </div>

      <div className="w-full flex items-center gap-3 px-2">
        <button onClick={onToggleMute} className="text-black/30 dark:text-white/30 transition-colors"
          onMouseEnter={e => (e.currentTarget.style.color = '#d52b1e')}
          onMouseLeave={e => (e.currentTarget.style.color = '')}
        >
          {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
        </button>
        <div className="flex-1 relative h-1.5 rounded-full bg-black/8 dark:bg-white/8">
          <div className="absolute left-0 top-0 h-full rounded-full transition-all" style={{ width: `${isMuted ? 0 : volume * 100}%`, backgroundColor: '#d52b1e' }} />
          <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={e => onVolumeChange(parseFloat(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
        </div>
        <span className="text-[10px] tabular-nums text-black/30 dark:text-white/30 w-7 text-right">
          {isMuted ? '0' : Math.round(volume * 100)}
        </span>
      </div>
    </div>
  )
}

// ─── Channel Row ──────────────────────────────────────────────────────────────

function ChannelRow({ ch, isSelected, isPlaying, iconOnly, onClick }: {
  ch: RadioChannel; isSelected: boolean; isPlaying: boolean; iconOnly: boolean; onClick: () => void
}) {
  const hasAccess = bool(ch.has_access)
  const isFree    = bool(ch.is_free)
  return (
    <div
      onClick={hasAccess ? onClick : undefined}
      title={!hasAccess ? (isFree ? 'Login required' : 'Subscription required') : undefined}
      className={[
        'flex items-center gap-3 px-4 py-2.5 transition-all duration-150 border-l-2',
        hasAccess ? 'cursor-pointer' : 'cursor-default opacity-40',
        !isSelected ? 'border-l-transparent hover:bg-black/3 dark:hover:bg-white/4' : '',
        iconOnly ? 'justify-center px-0' : '',
      ].join(' ')}
      style={isSelected ? {
        background: 'linear-gradient(to right, rgba(213,43,30,0.07), rgba(33,38,44,0.03))',
        borderLeftColor: '#d52b1e',
      } : {}}
    >
      <div className="relative shrink-0">
        <ChannelLogo ch={ch} size="sm" />
        {!hasAccess && <span className="absolute -top-1 -right-1 text-[9px]">🔒</span>}
      </div>
      {!iconOnly && (
        <>
          <div className="flex-1 min-w-0">
            <span className="text-sm font-medium truncate text-black/80 dark:text-white/75 block">
              {ch.name.length > 22 ? ch.name.slice(0, 22) + '…' : ch.name}
            </span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full w-fit mt-0.5 inline-block ${isFree ? 'bg-green-500/10 text-green-600 dark:text-green-400' : ''}`}
              style={!isFree ? { backgroundColor: 'rgba(213,43,30,0.1)', color: '#d52b1e' } : {}}
            >
              {isFree ? 'Free' : 'Premium'}
            </span>
          </div>
          {isSelected && isPlaying  && <AudioBarsAnimated isPlaying barCount={8} small />}
          {isSelected && !isPlaying && <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: 'rgba(213,43,30,0.4)' }} />}
        </>
      )}
    </div>
  )
}

// ─── Channel List Panel ───────────────────────────────────────────────────────

function ChannelList({ channels, selectedId, isPlaying, iconOnly, onSelect }: {
  channels: RadioChannel[]; selectedId: number | string | null; isPlaying: boolean; iconOnly: boolean; onSelect: (ch: RadioChannel) => void
}) {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? channels.filter(ch => ch.name.toLowerCase().includes(q)) : channels
  }, [channels, query])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden gap-3">
      {!iconOnly && (
        <div className="relative group shrink-0">
          <span className="pointer-events-none absolute inset-0 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"
            style={{ boxShadow: '0 0 0 3px rgba(213,43,30,0.18),0 0 14px 2px rgba(213,43,30,0.10)' }}
          />
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors"
            style={{ color: 'rgba(213,43,30,0.7)' }}
          />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search radio…"
            className="w-full h-10 pl-9 pr-9 rounded-xl text-sm bg-white/70 dark:bg-white/5 border border-black/8 dark:border-white/10 backdrop-blur-md placeholder:text-black/30 dark:placeholder:text-white/25 text-black/80 dark:text-white/80 outline-none transition-all focus:bg-white dark:focus:bg-white/10"
            style={{ ['--tw-ring-color' as string]: 'rgba(213,43,30,0.3)' }}
          />
          {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30 hover:text-black/60 dark:hover:text-white/60 transition-colors"><X size={13} /></button>}
        </div>
      )}
      <div className="flex-1 rounded-xl border border-black/8 dark:border-white/8 overflow-y-auto min-h-0 bg-white/50 dark:bg-white/3 backdrop-blur-md">
        <div className="divide-y divide-black/5 dark:divide-white/5">
          {filtered.length > 0 ? filtered.map(ch => (
            <ChannelRow key={ch.id} ch={ch} isSelected={sameId(selectedId, ch.id)} isPlaying={sameId(selectedId, ch.id) && isPlaying} iconOnly={iconOnly} onClick={() => onSelect(ch)} />
          )) : (
            <div className="p-10 text-center">
              <Search size={22} className="mx-auto mb-2 text-black/15 dark:text-white/15" />
              <p className="text-sm text-black/35 dark:text-white/30">No results for "{query}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Mobile Grid ──────────────────────────────────────────────────────────────

function MobileChannelGrid({ channels, selectedId, isPlaying, onSelect }: {
  channels: RadioChannel[]; selectedId: number | string | null; isPlaying: boolean; onSelect: (ch: RadioChannel) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = useMemo(() => channels.filter(ch => ch.name.toLowerCase().includes(search.toLowerCase())), [channels, search])

  return (
    <div className="flex flex-col gap-3 p-3">
      <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search…"
        className="w-full h-9 px-3 rounded-xl text-sm bg-white/70 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black/80 dark:text-white/80 placeholder:text-black/30 dark:placeholder:text-white/30 outline-none"
        style={{ ['--tw-ring-color' as string]: 'rgba(213,43,30,0.4)' }}
      />
      <div className="grid grid-cols-3 gap-2">
        {filtered.map(ch => {
          const isSelected = sameId(selectedId, ch.id)
          const hasAccess  = bool(ch.has_access)
          const isFree     = bool(ch.is_free)
          return (
            <div key={ch.id} onClick={() => hasAccess && onSelect(ch)}
              className={['relative flex flex-col items-center gap-1.5 p-2.5 rounded-2xl transition-all duration-150 active:scale-95', hasAccess ? 'cursor-pointer' : 'cursor-default opacity-40', !isSelected ? 'bg-white/60 dark:bg-white/5 border border-black/8 dark:border-white/8' : ''].join(' ')}
              style={isSelected ? {
                background: 'linear-gradient(to bottom right, rgba(213,43,30,0.2), rgba(33,38,44,0.1))',
                border: '1px solid rgba(213,43,30,0.4)',
                boxShadow: '0 1px 3px rgba(213,43,30,0.2)',
              } : {}}
            >
              {!hasAccess && <span className="absolute top-1.5 right-1.5 text-[9px]">🔒</span>}
              <div className="relative">
                <ChannelLogo ch={ch} size="md" />
                {isSelected && isPlaying && (
                  <div className="absolute inset-0 rounded-xl flex items-end justify-center pb-1"
                    style={{ backgroundColor: 'rgba(213,43,30,0.1)' }}
                  >
                    <AudioBarsAnimated isPlaying barCount={6} small />
                  </div>
                )}
              </div>
              <span
                style={isSelected ? { color: '#d52b1e' } : { color: undefined }}
                {...(!isSelected ? { className: 'text-[10px] font-medium text-center leading-tight line-clamp-2 text-black/60 dark:text-white/50' } : {})}
              >{ch.name}</span>
              <span className={`text-[8px] px-1.5 py-0.5 rounded-full ${isFree ? 'bg-green-500/10 text-green-500' : ''}`}
                style={!isFree ? { backgroundColor: 'rgba(213,43,30,0.1)', color: '#d52b1e' } : {}}
              >{isFree ? 'Free' : 'Premium'}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: 'rgba(213,43,30,0.2)', borderTopColor: '#d52b1e' }}
      />
      <span className="text-sm text-black/35 dark:text-white/30">Loading stations…</span>
    </div>
  )
}

// ─── Play Button ──────────────────────────────────────────────────────────────

function PlayButton({ status, onClick, disabled }: { status: PlayerStatus; onClick: () => void; disabled: boolean }) {
  const isPlaying = status === 'playing'
  const isLoading = status === 'loading'
  return (
    <button onClick={onClick} disabled={disabled || isLoading}
      className={['mt-2 w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-200', !isPlaying ? 'bg-white/80 dark:bg-white/8 border border-black/8 dark:border-white/10 text-black/50 dark:text-white/40 hover:scale-105 hover:shadow-lg' : '', 'disabled:opacity-30 disabled:scale-100 disabled:shadow-none'].join(' ')}
      style={isPlaying ? { background: '#d52b1e', color: 'white', transform: 'scale(1.05)', boxShadow: '0 20px 40px -12px rgba(213,43,30,0.4)' } : {}}
    >
      {isLoading ? <div className="w-6 h-6 rounded-full border-2 border-current border-t-transparent animate-spin" />
        : isPlaying ? <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
        : <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
      }
    </button>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function RadioPage() {
  const [channels,       setChannels]       = useState<RadioChannel[]>([])
  const [loading,        setLoading]        = useState(true)
  const [fetchError,     setFetchError]     = useState<string | null>(null)
  const [selected,       setSelected]       = useState<RadioChannel | null>(null)
  const [playerStatus,   setPlayerStatus]   = useState<PlayerStatus>('idle')
  const [volume,         setVolume]         = useState(0.75)
  const [isMuted,        setIsMuted]        = useState(false)
  const [leftExpanded,   setLeftExpanded]   = useState(false)
  const [playerExpanded, setPlayerExpanded] = useState(false)

  // ── Native <audio> ref ────────────────────────────────────────────────────
  const audioRef = useRef<HTMLAudioElement>(null)

  const isMobile         = useIsMobile()
  const isPortrait       = useIsPortrait()
  const isMobilePortrait = isMobile && isPortrait

  // Keep volume / mute in sync with the audio element whenever they change
  useEffect(() => {
    if (!audioRef.current) return
    audioRef.current.volume = volume
    audioRef.current.muted  = isMuted
  }, [volume, isMuted])

  // Stop and clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    api.get<RadioChannel[]>('/api/radio')
      .then(res => setChannels(res.data))
      .catch(() => setFetchError('Failed to load stations. Please refresh.'))
      .finally(() => setLoading(false))
  }, [])

  const playChannel = useCallback(async (ch: RadioChannel) => {
    if (!bool(ch.has_access)) return

    // Toggle pause/resume for the already-selected channel
    if (sameId(selected?.id, ch.id) && playerStatus === 'playing') {
      audioRef.current?.pause()
      setPlayerStatus('paused')
      return
    }
    if (sameId(selected?.id, ch.id) && playerStatus === 'paused') {
      audioRef.current?.play().catch(() => setPlayerStatus('error'))
      setPlayerStatus('playing')
      return
    }

    // New channel — stop whatever is playing first
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    setSelected(ch)
    setPlayerStatus('loading')

    try {
      const res = await api.get<StreamResponse>(`/api/radio/${ch.id}/stream`)
      const url = res.data.url

      if (audioRef.current) {
        audioRef.current.src    = url
        audioRef.current.volume = volume
        audioRef.current.muted  = isMuted
        await audioRef.current.play()
        setPlayerStatus('playing')
      }
    } catch {
      setPlayerStatus('error')
    }
  }, [selected, playerStatus, volume, isMuted])

  const togglePlay = useCallback(() => {
    if (!selected) return
    if (playerStatus === 'playing') {
      audioRef.current?.pause()
      setPlayerStatus('paused')
    } else if (playerStatus === 'paused') {
      audioRef.current?.play().catch(() => setPlayerStatus('error'))
      setPlayerStatus('playing')
    } else {
      playChannel(selected)
    }
  }, [selected, playerStatus, playChannel])

  const isPlaying = playerStatus === 'playing'
  const isLoading = playerStatus === 'loading'

  // ── MOBILE PORTRAIT ────────────────────────────────────────────────────────
  if (isMobilePortrait) {
    return (
      <div className="flex flex-col w-full h-full bg-gray-50 dark:bg-zinc-950 overflow-hidden">
        <audio ref={audioRef} style={{ display: 'none' }} />

        <div className="shrink-0 bg-white/80 dark:bg-zinc-900/90 border-b border-black/8 dark:border-white/8 backdrop-blur-md">
          <div className="flex items-center gap-3 px-3 py-2.5">
            <div className="relative shrink-0">
              {selected && <ChannelLogo ch={selected} size="sm" />}
              <PulsingRing active={isPlaying} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-black/80 dark:text-white/80 truncate">{selected?.name ?? 'Select a station'}</p>
              {isLoading && <p className="text-[10px] animate-pulse" style={{ color: '#d52b1e' }}>Connecting…</p>}
              {playerStatus === 'error' && <p className="text-[10px] text-red-400">Stream error</p>}
            </div>
            {selected && <AudioBarsAnimated isPlaying={isPlaying} barCount={10} small />}
            <button onClick={togglePlay} disabled={!selected || isLoading}
              className="w-9 h-9 flex items-center justify-center rounded-xl transition-all disabled:opacity-30"
              style={isPlaying
                ? { backgroundColor: '#d52b1e', color: 'white', boxShadow: '0 4px 12px rgba(213,43,30,0.3)' }
                : { backgroundColor: 'rgba(0,0,0,0.06)', color: 'rgba(0,0,0,0.5)' }
              }
            >
              {isLoading ? <div className="w-4 h-4 rounded-full border-2 border-current border-t-transparent animate-spin" />
                : isPlaying ? <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                : <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
              }
            </button>
            {isPlaying && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/10 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide">Live</span>
              </div>
            )}
          </div>

          {playerExpanded && (
            <div className="flex items-center gap-3 px-3 pb-3">
              <button onClick={() => setIsMuted(v => !v)} className="text-black/30 dark:text-white/30 transition-colors"
                onMouseEnter={e => (e.currentTarget.style.color = '#d52b1e')}
                onMouseLeave={e => (e.currentTarget.style.color = '')}
              >
                {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
              <div className="flex-1 relative h-1.5 rounded-full bg-black/8 dark:bg-white/8">
                <div className="absolute left-0 top-0 h-full rounded-full" style={{ width: `${isMuted ? 0 : volume * 100}%`, backgroundColor: '#d52b1e' }} />
                <input type="range" min={0} max={1} step={0.01} value={isMuted ? 0 : volume} onChange={e => setVolume(parseFloat(e.target.value))} className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
              </div>
            </div>
          )}
          <button onClick={() => setPlayerExpanded(v => !v)} className="w-full flex justify-center pb-1 text-black/20 dark:text-white/15 transition-colors"
            onMouseEnter={e => (e.currentTarget.style.color = '#d52b1e')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}
          >
            {playerExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto overscroll-contain">
          {loading ? <Spinner /> : fetchError
            ? <div className="p-8 text-center text-sm text-red-400">{fetchError}</div>
            : <MobileChannelGrid channels={channels} selectedId={selected?.id ?? null} isPlaying={isPlaying} onSelect={playChannel} />
          }
        </div>
      </div>
    )
  }

  // ── DESKTOP + LANDSCAPE ────────────────────────────────────────────────────
  return (
    <div className="flex w-full h-full bg-gray-50 dark:bg-zinc-950 overflow-hidden">
      <audio ref={audioRef} style={{ display: 'none' }} />

      {/* LEFT */}
      <div className={`lg:relative lg:w-1/4 xl:w-1/5 absolute z-20 flex flex-col h-full transition-all duration-300 ${isMobile ? (leftExpanded ? 'w-56' : 'w-[65px]') : ''}`}>
        {isMobile && (
          <button onClick={() => setLeftExpanded(v => !v)}
            className="absolute -right-3 top-1/2 -translate-y-1/2 z-30 w-6 h-10 flex items-center justify-center bg-white dark:bg-zinc-800 border border-black/10 dark:border-white/10 rounded-r-lg shadow-md text-black/40 dark:text-white/40 transition-colors"
            onMouseEnter={e => (e.currentTarget.style.color = '#d52b1e')}
            onMouseLeave={e => (e.currentTarget.style.color = '')}
          >
            {leftExpanded
              ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15,18 9,12 15,6"/></svg>
              : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
            }
          </button>
        )}
        <div className="flex-1 flex flex-col h-full p-3 gap-3 overflow-hidden">
          {loading ? <Spinner /> : fetchError
            ? <div className="p-4 text-center text-sm text-red-400">{fetchError}</div>
            : <ChannelList channels={channels} selectedId={selected?.id ?? null} isPlaying={isPlaying} iconOnly={isMobile && !leftExpanded} onSelect={playChannel} />
          }
        </div>
      </div>

      {isMobile && <div className="w-[65px] shrink-0" />}

      {/* CENTER */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center relative">
          {isPlaying && selected && <div className="absolute inset-0 pointer-events-none" style={{ background: 'radial-gradient(ellipse 60% 50% at 50% 50%,rgba(213,43,30,0.07) 0%,transparent 70%)' }} />}
          <NowPlayingCard channel={selected} status={playerStatus} volume={volume} onVolumeChange={setVolume} isMuted={isMuted} onToggleMute={() => setIsMuted(v => !v)} />
          <PlayButton status={playerStatus} onClick={togglePlay} disabled={!selected} />
        </div>
      </div>

      {/* RIGHT */}
      <div className="hidden lg:flex flex-col h-full w-1/4 xl:w-1/5 p-3 gap-3 overflow-hidden">
        <div className="rounded-xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2">
            {isPlaying ? <Wifi size={14} className="text-green-500" /> : <WifiOff size={14} className="text-black/25 dark:text-white/25" />}
            <span className="text-xs font-medium text-black/50 dark:text-white/40">
              {playerStatus === 'loading' ? 'Connecting…' : isPlaying ? 'Streaming' : playerStatus === 'error' ? 'Error' : 'Offline'}
            </span>
          </div>
          {selected && (
            <>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-black/30 dark:text-white/25 uppercase tracking-widest">Station</span>
                <span className="text-sm font-semibold text-black/80 dark:text-white/80">{selected.name}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] text-black/30 dark:text-white/25 uppercase tracking-widest">Access</span>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${bool(selected.is_free) ? 'bg-green-500/10 text-green-600 dark:text-green-400' : ''}`}
                  style={!bool(selected.is_free) ? { backgroundColor: 'rgba(213,43,30,0.1)', color: '#d52b1e' } : {}}
                >
                  {bool(selected.is_free) ? 'Free' : 'Premium'}
                </span>
              </div>
            </>
          )}
        </div>

        <div className="rounded-xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-4">
          <div className="flex items-center gap-2 mb-3">
            <Radio size={13} style={{ color: '#d52b1e' }} />
            <span className="text-xs font-semibold text-black/50 dark:text-white/40 uppercase tracking-widest">Stations</span>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Total',      value: channels.length,                                color: 'text-black/60 dark:text-white/50' },
              { label: 'Free',       value: channels.filter(c => bool(c.is_free)).length,    color: 'text-green-600 dark:text-green-400' },
              { label: 'Premium',    value: channels.filter(c => !bool(c.is_free)).length,   color: '' },
              { label: 'Accessible', value: channels.filter(c => bool(c.has_access)).length, color: 'text-black/60 dark:text-white/50' },
            ].map(({ label, value, color }) => (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-black/50 dark:text-white/40">{label}</span>
                <span className={`text-xs font-semibold tabular-nums ${color}`}
                  style={label === 'Premium' ? { color: '#d52b1e' } : {}}
                >{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
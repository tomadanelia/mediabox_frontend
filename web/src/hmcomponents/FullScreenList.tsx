'use client'

import React, { useState, useEffect } from 'react'
import { X, Radio, Clock } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

type Channel = {
  id: string
  uuid: string
  name: string
  logo: string
  number: number
  category: string
  category_id: string
}

type Program = {
  UID: number
  CHANNEL_ID: number
  START_TIME: number   // unix seconds
  END_TIME: number     // unix seconds
  TITLE: string
  GANRE: string
  DESCRIPTION: string
}

export type TVGuideSelection = {
  channel: Channel
  mode: 'live' | 'archive'
  timestamp?: number
}

type Props = {
  onClose: () => void
  onSelect: (sel: TVGuideSelection) => void
  currentChannelId?: string
  rewindableDays?: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = 'http://159.89.20.100/api'

function toApiDate(d: Date): string {
  const y  = d.getFullYear()
  const m  = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}/${m}/${dd}`
}

const hhmm = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
const fmtTime = (unix: number) => hhmm.format(new Date(unix * 1000))

function dayLabel(d: Date): string {
  const now  = new Date()
  const prev = new Date(); prev.setDate(now.getDate() - 1)
  if (d.toDateString() === now.toDateString())  return 'Today'
  if (d.toDateString() === prev.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

const Spinner = () => (
  <div className="flex items-center justify-center py-10">
    <div className="w-5 h-5 border-2 border-white/20 border-t-orange-400 rounded-full animate-spin" />
  </div>
)

// ─── Component ────────────────────────────────────────────────────────────────

const FullScreenList: React.FC<Props> = ({
  onClose,
  onSelect,
  currentChannelId,
  rewindableDays = 7,
}) => {
  const nowSec = Math.floor(Date.now() / 1000)

  // Date strip: rewindableDays past + today
  const dateStrip = Array.from({ length: rewindableDays + 1 }, (_, i) => {
    const d = new Date()
    d.setHours(0, 0, 0, 0)
    d.setDate(d.getDate() - (rewindableDays - i))
    return d
  })

  const [channels,    setChannels]    = useState<Channel[]>([])
  const [loadingCh,   setLoadingCh]   = useState(true)
  const [errorCh,     setErrorCh]     = useState<string | null>(null)

  // The channel being previewed in the right panel (NOT necessarily the one streaming)
  const [previewId,   setPreviewId]   = useState<string>(currentChannelId ?? '')

  const [programs,    setPrograms]    = useState<Program[]>([])
  const [loadingPr,   setLoadingPr]   = useState(false)
  const [selDate,     setSelDate]     = useState<Date>(dateStrip[dateStrip.length - 1])

  // ── Fetch channels once ────────────────────────────────────────────────────
  useEffect(() => {
    let dead = false
    setLoadingCh(true)
    fetch(`${API}/channels`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<Channel[]> })
      .then(data => {
        if (dead) return
        setChannels(data)
        setPreviewId(id => id || data[0]?.id || '')
      })
      .catch(e => { if (!dead) setErrorCh(String(e)) })
      .finally(() => { if (!dead) setLoadingCh(false) })
    return () => { dead = true }
  }, [])

  // ── Fetch programs when preview channel or date changes ────────────────────
  useEffect(() => {
    if (!previewId) return
    let dead = false
    setLoadingPr(true)
    setPrograms([])
    fetch(`${API}/channels/${previewId}/programs?date=${toApiDate(selDate)}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() as Promise<Program[]> })
      .then(data => { if (!dead) setPrograms(data) })
      .catch(() => {})
      .finally(() => { if (!dead) setLoadingPr(false) })
    return () => { dead = true }
  }, [previewId, selDate.toDateString()])

  const previewChannel = channels.find(c => c.id === previewId) ?? null
  const sorted = [...programs].sort((a, b) => a.START_TIME - b.START_TIME)
  const todaySelected = selDate.toDateString() === new Date().toDateString()

  // ── When user clicks a channel: switch stream immediately + load programs ──
  const handleChannelClick = (ch: Channel) => {
    setPreviewId(ch.id)
    // Switch to live for this channel right away
    onSelect({ channel: ch, mode: 'live' })
    // Don't close — let user browse programs too
  }

  // ── When user clicks a program row ────────────────────────────────────────
  const handleProgramClick = (p: Program) => {
    if (!previewChannel) return
    const isCurrent = nowSec >= p.START_TIME && nowSec < p.END_TIME
    if (isCurrent && todaySelected) {
      onSelect({ channel: previewChannel, mode: 'live' })
    } else {
      onSelect({ channel: previewChannel, mode: 'archive', timestamp: p.START_TIME })
    }
    onClose()
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="absolute inset-0 z-50 flex flex-col backdrop-blur-lg bg-black/70">

      {/* ── Top bar ── */}
      <div className="shrink-0 px-4 pt-3 pb-2 border-b border-white/10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-white font-bold text-sm tracking-wide">TV Guide</span>
          <button onClick={onClose} className="p-1 text-white/40 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        {/* Date strip */}
        <div className="flex gap-1.5 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
          {dateStrip.map((d, i) => (
            <button
              key={i}
              onClick={() => setSelDate(d)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-semibold whitespace-nowrap transition-all ${
                d.toDateString() === selDate.toDateString()
                  ? 'bg-gradient-to-r from-orange-500 to-yellow-400 text-white'
                  : 'bg-white/10 text-white/50 hover:bg-white/20 hover:text-white'
              }`}
            >
              {dayLabel(d)}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body: channel list left, programs right ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">

        {/* Channel list */}
        <div className="w-40 shrink-0 border-r border-white/10 overflow-y-auto">
          {loadingCh ? (
            <Spinner />
          ) : errorCh ? (
            <p className="text-red-400 text-[10px] text-center px-3 pt-6">{errorCh}</p>
          ) : (
            <div className="p-1.5 space-y-0.5">
              {channels.map(ch => {
                const isStreaming  = ch.id === currentChannelId
                const isPreviewing = ch.id === previewId
                return (
                  <button
                    key={ch.id}
                    onClick={() => handleChannelClick(ch)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left border transition-all ${
                      isStreaming
                        ? 'bg-gradient-to-r from-orange-500/30 to-yellow-500/20 border-orange-500/50'
                        : isPreviewing
                        ? 'bg-white/15 border-white/20'
                        : 'bg-transparent border-transparent hover:bg-white/10'
                    }`}
                  >
                    <div className="w-7 h-7 rounded bg-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                      {ch.logo
                        ? <img src={ch.logo} alt="" className="w-full h-full object-cover"
                            onError={e => { e.currentTarget.style.display = 'none' }} />
                        : <span className="text-white text-[9px] font-bold">{ch.name.slice(0, 2).toUpperCase()}</span>
                      }
                    </div>
                    <span className="text-white text-[11px] font-medium truncate flex-1">{ch.name}</span>
                    {isStreaming && (
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 animate-pulse" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Program list */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Channel sub-header */}
          {previewChannel && (
            <div className="shrink-0 flex items-center justify-between px-3 py-2 border-b border-white/10 bg-white/[0.03]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-white/10 shrink-0 overflow-hidden flex items-center justify-center">
                  {previewChannel.logo
                    ? <img src={previewChannel.logo} alt="" className="w-full h-full object-cover" />
                    : <span className="text-white text-[8px] font-bold">{previewChannel.name.slice(0, 2).toUpperCase()}</span>
                  }
                </div>
                <span className="text-white text-xs font-semibold truncate">{previewChannel.name}</span>
                <span className="text-white/30 text-[10px]">· {dayLabel(selDate)}</span>
              </div>
              <button
                onClick={() => { onSelect({ channel: previewChannel, mode: 'live' }); onClose() }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold transition-colors"
              >
                <Radio className="w-3 h-3" />
                Live
              </button>
            </div>
          )}

          {/* Programs */}
          <div className="flex-1 overflow-y-auto">
            {loadingPr ? (
              <Spinner />
            ) : sorted.length === 0 ? (
              <p className="text-white/30 text-[11px] text-center pt-8">No programs for this date</p>
            ) : (
              <div className="divide-y divide-white/5">
                {sorted.map(p => {
                  const isCurrent = nowSec >= p.START_TIME && nowSec < p.END_TIME
                  const isPast    = nowSec >= p.END_TIME
                  const isFuture  = p.START_TIME > nowSec
                  const clickable = !isFuture

                  return (
                    <div
                      key={p.UID}
                      onClick={() => clickable && handleProgramClick(p)}
                      className={[
                        'flex items-center gap-2 px-3 py-2 transition-all select-none',
                        isCurrent  ? 'bg-orange-500/15 border-l-2 border-orange-400 cursor-pointer hover:bg-orange-500/25' : '',
                        isPast     ? 'opacity-50 cursor-pointer hover:opacity-90 hover:bg-white/5' : '',
                        isFuture   ? 'opacity-25 cursor-not-allowed' : '',
                      ].join(' ')}
                    >
                      {/* Time */}
                      <span className={`text-[10px] font-mono shrink-0 w-8 ${isCurrent ? 'text-orange-400' : 'text-white/35'}`}>
                        {fmtTime(p.START_TIME)}
                      </span>

                      {/* Title */}
                      <span className={`text-[11px] font-medium truncate flex-1 ${isCurrent ? 'text-white' : 'text-white/75'}`}>
                        {p.TITLE}
                      </span>

                      {/* Badge */}
                      {isCurrent && <span className="shrink-0 px-1.5 py-0.5 bg-red-500 text-white text-[8px] font-bold rounded">LIVE</span>}
                      {isPast     && <Clock className="w-2.5 h-2.5 text-white/20 shrink-0" />}
                      {isFuture   && <span className="text-white/20 text-[10px] shrink-0">🔒</span>}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FullScreenList
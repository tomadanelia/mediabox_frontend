'use client'

import { useEffect, useState, useCallback } from 'react'
import { X, Clock, ArrowRight, Sparkles, CheckCircle2, CalendarDays, AlertCircle, Loader2, Lock } from 'lucide-react'
import api from '@/lib/axios'
// ── types ─────────────────────────────────────────────────────────────────────

type Channel = {
  id: string
  uuid: string
  name: string
  logo: string
  number: number
  category: string
  category_id: string
}

type Plan = {
  id: string
  name_ka: string
  name_en: string
  description_ka: string
  description_en: string
  price: string
  duration_days: number
  is_active: boolean
  created_at: string
  updated_at: string
}

type ChannelPlansResponse = {
  external_id: string
  channel_name_ka: string
  channel_name_en: string
  is_free: boolean
  required_plans: (string | Plan)[]  // may be IDs or full objects depending on API version
}

type PlansModalProps = {
  channel: Channel | null
  lang?: 'en' | 'ka'
  onClose: () => void
  onSelectPlan?: (plan: Plan, channel: Channel) => void
}

// ── helpers ───────────────────────────────────────────────────────────────────

const GradientDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
    <defs>
      <linearGradient id="pmIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#fbff00" />
      </linearGradient>
    </defs>
  </svg>
)

const isPremium = (price: string) => parseFloat(price) >= 10
const isPopular = (price: string) => parseFloat(price) >= 10 && parseFloat(price) < 20

const getDurationLabel = (days: number) => {
  if (days === 1)  return '24 hours'
  if (days < 30)   return `${days} days`
  const m = days / 30
  return `${m} month${m > 1 ? 's' : ''}`
}

// ── mini plan card — style #11 ────────────────────────────────────────────────

const MiniPlanCard = ({
  plan,
  lang,
  onSelect,
}: {
  plan: Plan
  lang: 'en' | 'ka'
  onSelect: (plan: Plan) => void
}) => {
  const [hovered, setHovered] = useState(false)

  const name  = lang === 'ka' ? plan.name_ka        : plan.name_en
  const desc  = lang === 'ka' ? plan.description_ka : plan.description_en
  const price = parseFloat(plan.price)
  const popular = isPopular(plan.price)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onSelect(plan)}
      className="relative flex flex-col cursor-pointer transition-all duration-200"
      style={{
        width: '180px',
        minHeight: '320px',
        background: '#161616',
        borderRadius: 20,
        border: hovered
          ? '1px solid rgba(249,115,22,0.35)'
          : '1px solid rgba(255,255,255,0.07)',
        boxShadow: hovered
          ? '0 0 0 3px rgba(249,115,22,0.10), 0 16px 40px rgba(0,0,0,0.5)'
          : '0 4px 20px rgba(0,0,0,0.3)',
        transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        padding: '18px 16px',
      }}
    >
      {/* popular badge */}
      {popular && (
        <div
          className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full text-black z-10"
          style={{ background: 'linear-gradient(90deg,#f97316,#facc15)' }}
        >
          <Sparkles size={8} />
          Popular
        </div>
      )}

      {/* plan label + name */}
      <div className="mb-3">
        <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Premium</p>
        <p className="text-sm font-bold text-white/90 leading-snug">{name}</p>
      </div>

      {/* price row */}
      <div className="flex items-end gap-1 mb-1">
        <span className="text-[10px] font-semibold text-white/30 mb-1">$</span>
        <span
          className="text-4xl font-black leading-none tabular-nums"
          style={{
            background: 'linear-gradient(135deg,#f97316,#d97706)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          {price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}
        </span>
        <span className="text-[10px] text-white/25 mb-1.5 ml-0.5">/{getDurationLabel(plan.duration_days)}</span>
      </div>

      {/* divider */}
      <div className="my-3" style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

      {/* description */}
      <div className="flex items-start gap-2 flex-1">
        <div
          className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5"
          style={{ background: 'rgba(249,115,22,0.15)' }}
        >
          <CheckCircle2 size={9} color="#f97316" />
        </div>
        <p className="text-[10px] leading-relaxed text-white/45">{desc}</p>
      </div>

      {/* duration chip */}
      <div
        className="self-start flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-semibold mt-3"
        style={{
          background: 'rgba(249,115,22,0.09)',
          color: '#f97316',
          border: '1px solid rgba(249,115,22,0.16)',
        }}
      >
        <Clock size={7} />
        {getDurationLabel(plan.duration_days)}
      </div>

      {/* CTA */}
      <button
        className="w-full h-9 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 mt-4 transition-all duration-150 cursor-pointer"
        style={{
          background: 'linear-gradient(90deg,#f97316,#facc15)',
          color: '#000',
          border: 'none',
          boxShadow: hovered
            ? '0 4px 16px rgba(249,115,22,0.45)'
            : '0 2px 8px rgba(249,115,22,0.20)',
        }}
      >
        Get Started
        <ArrowRight size={11} />
      </button>
    </div>
  )
}

// ── main modal ────────────────────────────────────────────────────────────────

const PlansModal = ({
  channel,
  lang = 'en',
  onClose,
  onSelectPlan,
}: PlansModalProps) => {
  const [plans, setPlans]       = useState<Plan[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [visible, setVisible]   = useState(false)

  // animate in
  useEffect(() => {
    if (channel) {
      setVisible(false)
      requestAnimationFrame(() => setTimeout(() => setVisible(true), 10))
    }
  }, [channel])

  // close with animation
  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 220)
  }, [onClose])

  // close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  // fetch plans — channel endpoint gives required plan IDs, /api/plans gives full details
  useEffect(() => {
    if (!channel) return
    setPlans([])
    setError(null)
    setLoading(true)

Promise.all([
  api.get(`/api/channels/${channel.id}/plans`),
  api.get(`/api/plans`),
])
  .then(([channelRes, allPlansRes]) => {
    const channelData: ChannelPlansResponse = channelRes.data   // ← .data
    const allPlans: Plan[] = allPlansRes.data                   // ← .data

    console.log('[PlansModal] channel response:', channelData)
    console.log('[PlansModal] all plans:', allPlans)


        const raw = channelData.required_plans ?? []

        // required_plans may be string IDs or full plan objects — handle both
        const requiredIds = new Set(
          raw.map((item: string | Plan) =>
            typeof item === 'string' ? item : item.id
          )
        )

        console.log('[PlansModal] required IDs:', [...requiredIds])

        const matched = allPlans.filter((p) => requiredIds.has(p.id))

        console.log('[PlansModal] matched plans:', matched)

        setPlans(matched)
      })
      .catch((err) => {
        console.error('[PlansModal] fetch error:', err)
        setError('Failed to load plans. Please try again.')
      })
      .finally(() => setLoading(false))
  }, [channel])

  if (!channel) return null

  const channelName = lang === 'ka' ? channel.name : channel.name

  return (
    <>
      <GradientDefs />

      {/* ── backdrop — deep dark with heavy blur */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: visible ? 'rgba(0,0,0,0.65)' : 'rgba(0,0,0,0)',
          backdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
          WebkitBackdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
        }}
      />

      {/* ── modal wrapper */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none">
        <div
          className="pointer-events-auto flex flex-col rounded-3xl overflow-hidden transition-all duration-300"
          style={{
            width: '820px',
            maxWidth: '95vw',
            maxHeight: '85vh',
            background: 'linear-gradient(160deg, #1a1a1a 0%, #111 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 0 0 1px rgba(249,115,22,0.12), 0 40px 120px rgba(0,0,0,0.7), 0 0 80px rgba(249,115,22,0.06)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.95)',
          }}
        >

          {/* ── header */}
          <div
            className="flex items-center gap-4 px-7 py-5"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
          >
            {/* lock icon + channel logo stacked */}
            <div className="relative shrink-0">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.10)',
                }}
              >
                <img
                  src={channel.logo}
                  alt={channelName}
                  className="w-9/12 h-9/12 object-contain"
                  onError={(e) => { e.currentTarget.src = '/placeholder.png' }}
                />
              </div>
              {/* locked badge */}
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px]"
                style={{ background: 'linear-gradient(135deg,#f97316,#facc15)', color: '#000' }}
              >
                <Lock size={10} strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-base font-bold text-white/90 truncate">{channelName}</p>
              <p className="text-xs text-white/35 mt-0.5">
                {loading
                  ? 'Loading available plans…'
                  : plans.length > 0
                  ? `Subscribe to unlock · ${plans.length} plan${plans.length > 1 ? 's' : ''} available`
                  : 'Choose a plan to unlock this channel'}
              </p>
            </div>

            {/* close */}
            <button
              onClick={handleClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.40)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.10)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              <X size={15} />
            </button>
          </div>

          {/* ── body */}
          <div className="overflow-y-auto px-7 py-6 flex-1">

            {/* loading */}
            {loading && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Loader2 size={28} className="animate-spin" style={{ color: '#f97316' }} />
                <p className="text-sm text-white/30">Fetching plans…</p>
              </div>
            )}

            {/* error */}
            {!loading && error && (
              <div
                className="flex items-center gap-3 px-5 py-4 rounded-2xl"
                style={{
                  background: 'rgba(239,68,68,0.08)',
                  border: '1px solid rgba(239,68,68,0.20)',
                }}
              >
                <AlertCircle size={17} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* empty */}
            {!loading && !error && plans.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-2 text-center">
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2"
                  style={{ background: 'rgba(249,115,22,0.10)', border: '1px solid rgba(249,115,22,0.15)' }}
                >
                  <CalendarDays size={20} style={{ stroke: 'url(#pmIconGrad)' }} />
                </div>
                <p className="text-sm font-semibold text-white/50">No plans available</p>
                <p className="text-xs text-white/25">This channel has no assigned plans yet.</p>
              </div>
            )}

            {/* plans grid */}
            {!loading && !error && plans.length > 0 && (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: 'repeat(auto-fill, 180px)',
                  justifyContent: 'center',
                }}
              >
                {plans.map((plan) => (
                  <MiniPlanCard
                    key={plan.id}
                    plan={plan}
                    lang={lang}
                    onSelect={(p) => onSelectPlan?.(p, channel)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default PlansModal


// ── integration example ───────────────────────────────────────────────────────
//
// In your parent component (e.g. where DataTableDemo lives):
//
// const [pendingChannel, setPendingChannel] = useState<Channel | null>(null)
//
// const handleChannelSelect = (channel: Channel) => {
//   if (channel.category === 'paid' /* or however you detect paid */) {
//     setPendingChannel(channel)
//   } else {
//     // free channel — proceed normally
//   }
// }
//
// <DataTableDemo
//   filteredChannels={channels}
//   onChannelSelect={handleChannelSelect}
//   selectedChannel={selectedChannel}
// />
//
// <PlansModal
//   channel={pendingChannel}
//   lang="en"
//   onClose={() => setPendingChannel(null)}
//   onSelectPlan={(plan, channel) => {
//     console.log('User selected plan', plan.name_en, 'for', channel.name)
//     setPendingChannel(null)
//   }}
// />
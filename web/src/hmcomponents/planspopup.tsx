'use client'

import { useEffect, useState, useCallback } from 'react'
import {
  X, Clock, ArrowRight, Sparkles, CheckCircle2,
  CalendarDays, AlertCircle, Loader2, Lock,
} from 'lucide-react'
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
  discounted_price?: string | number
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
  required_plans: (string | Plan)[]
}

type PlansModalProps = {
  channel: Channel | null
  lang?: 'en' | 'ka'
  isDark?: boolean
  onClose: () => void
  onSelectPlan?: (plan: Plan, channel: Channel) => void
}

// ── helpers ───────────────────────────────────────────────────────────────────

const getDurationLabel = (days: number, lang: 'en' | 'ka') => {
  if (lang === 'ka') {
    if (days === 1)  return '24 საათი'
    if (days < 30)   return `${days} დღე`
    const m = days / 30
    return `${m} თვე`
  }
  if (days === 1)  return '24 hours'
  if (days < 30)   return `${days} days`
  const m = days / 30
  return `${m} month${m > 1 ? 's' : ''}`
}

const isPopularPlan = (index: number, total: number) =>
  index === Math.min(3, total - 1)

// ── plan card ─────────────────────────────────────────────────────────────────

const PlanCard = ({
  plan,
  index,
  total,
  lang,
  isDark,
  onSelect,
}: {
  plan: Plan
  index: number
  total: number
  lang: 'en' | 'ka'
  isDark: boolean
  onSelect: (plan: Plan) => void
}) => {
  const popular    = isPopularPlan(index, total)
  const name       = lang === 'ka' ? plan.name_ka        : plan.name_en
  const desc       = lang === 'ka' ? plan.description_ka : plan.description_en
  const price      = parseFloat(plan.price)
  const discounted = plan.discounted_price != null ? parseFloat(String(plan.discounted_price)) : null
  const hasDiscount = discounted !== null && discounted < price

  return (
    <div
      onClick={() => onSelect(plan)}
      style={{
        position: 'relative',
        borderRadius: 16,
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.2s',
        background: popular ? 'rgba(220,38,38,0.08)' : 'rgba(255,255,255,0.03)',
        border: popular ? '1px solid rgba(220,38,38,0.35)' : '1px solid rgba(255,255,255,0.07)',
        boxShadow: popular ? '0 0 32px rgba(220,38,38,0.08)' : 'none',
      }}
    >
      {/* popular badge */}
      {popular && (
        <div style={{ position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)', zIndex: 10 }}>
          <span style={{
            background: '#dc2626',
            color: '#fff',
            fontSize: 10,
            fontWeight: 700,
            padding: '3px 10px',
            borderRadius: 99,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            boxShadow: '0 2px 12px rgba(220,38,38,0.4)',
          }}>
            <Sparkles size={9} />
            {lang === 'ka' ? 'პოპულარული' : 'Popular'}
          </span>
        </div>
      )}

      {/* name + price */}
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#f3f4f6', margin: '0 0 8px' }}>{name}</h3>

        {/* price row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5 }}>
          {/* discounted (main) price */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <span style={{ fontSize: 28, fontWeight: 700, color: popular ? '#ef4444' : '#fff', lineHeight: 1 }}>
              {hasDiscount ? discounted!.toFixed(2) : price.toFixed(2)}
            </span>
            <span style={{ fontSize: 13, color: '#6b7280' }}>₾</span>
          </div>

          {/* original price crossed out — sits upper-right */}
          {hasDiscount && (
            <span style={{
              fontSize: 11,
              color: '#6b7280',
              textDecoration: 'line-through',
              textDecorationColor: 'rgba(239,68,68,0.5)',
              marginTop: 2,
              alignSelf: 'flex-start',
              lineHeight: 1,
            }}>
              {price.toFixed(2)}₾
            </span>
          )}
        </div>

        <p style={{ fontSize: 11, color: '#6b7280', margin: '4px 0 0' }}>
          {plan.duration_days} {lang === 'ka' ? 'დღე' : 'days'}
        </p>
      </div>

      {/* divider */}
      <div style={{ height: 1, background: popular ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.07)', marginBottom: 16 }} />

      {/* description */}
      <p style={{ fontSize: 12, color: '#9ca3af', marginBottom: 16, lineHeight: 1.6, minHeight: 40 }}>{desc}</p>

      {/* features */}
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d1d5db' }}>
          <span style={{
            width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0,
            background: popular ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.08)',
            color: popular ? '#ef4444' : '#9ca3af',
          }}>✓</span>
          {lang === 'ka' ? `ხანგრძლივობა ${plan.duration_days} დღე` : `Duration ${plan.duration_days} days`}
        </li>
        <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d1d5db' }}>
          <span style={{
            width: 16, height: 16, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, flexShrink: 0,
            background: popular ? 'rgba(220,38,38,0.2)' : 'rgba(255,255,255,0.08)',
            color: popular ? '#ef4444' : '#9ca3af',
          }}>✓</span>
          {lang === 'ka' ? 'სრული წვდომა' : 'Full Access'}
        </li>
        <li style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#d1d5db' }}>
          <Clock size={10} style={{ color: popular ? '#ef4444' : '#6b7280', flexShrink: 0 }} />
          {getDurationLabel(plan.duration_days, lang)}
        </li>
      </ul>

      {/* CTA */}
      <button
        onClick={e => { e.stopPropagation(); onSelect(plan) }}
        style={{
          width: '100%',
          padding: '10px 0',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          transition: 'all 0.15s',
          background: popular ? '#dc2626' : 'rgba(255,255,255,0.07)',
          color: '#fff',
          boxShadow: popular ? '0 4px 16px rgba(220,38,38,0.3)' : 'none',
        }}
      >
        {lang === 'ka' ? 'ყიდვა' : 'Get Started'}
        <ArrowRight size={13} />
      </button>
    </div>
  )
}

// ── main modal ────────────────────────────────────────────────────────────────

const PlansModal = ({
  channel,
  lang = 'en',
  isDark = true,
  onClose,
  onSelectPlan,
}: PlansModalProps) => {
  const [plans, setPlans]     = useState<Plan[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  // animate in
  useEffect(() => {
    if (channel) {
      setVisible(false)
      requestAnimationFrame(() => setTimeout(() => setVisible(true), 10))
    }
  }, [channel])

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 220)
  }, [onClose])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') handleClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [handleClose])

  // fetch plans
  useEffect(() => {
    if (!channel) return
    setPlans([])
    setError(null)
    setLoading(true)

    Promise.all([
      api.get<ChannelPlansResponse>(`/api/channels/${channel.id}/plans`),
      api.get<Plan[]>('/api/plans'),
    ])
      .then(([channelRes, allPlansRes]) => {
        const channelData = channelRes.data
        const allPlans    = allPlansRes.data

        const raw = channelData.required_plans ?? []
        const requiredIds = new Set(
          raw.map((item: string | Plan) => typeof item === 'string' ? item : item.id)
        )
        setPlans(allPlans.filter(p => requiredIds.has(p.id)))
      })
      .catch(() => setError(lang === 'ka' ? 'პაკეტების ჩატვირთვა ვერ მოხერხდა.' : 'Failed to load plans. Please try again.'))
      .finally(() => setLoading(false))
  }, [channel])

  if (!channel) return null

  const gridClass = (count: number) => {
    if (count === 1) return 'grid grid-cols-1 max-w-xs mx-auto gap-4'
    if (count === 2) return 'grid grid-cols-2 gap-4 max-w-lg mx-auto'
    if (count === 3) return 'grid grid-cols-3 gap-4'
    return 'grid grid-cols-2 xl:grid-cols-4 gap-4'
  }

  return (
    <>
      {/* backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: visible ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0)',
          backdropFilter:       visible ? 'blur(6px)' : 'blur(0px)',
          WebkitBackdropFilter: visible ? 'blur(6px)' : 'blur(0px)',
        }}
      />

      {/* modal wrapper */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none"
        style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
      >
        <div
          className="pointer-events-auto flex flex-col overflow-hidden transition-all duration-300"
          style={{
            width: 860,
            maxWidth: '95vw',
            maxHeight: '88vh',
            borderRadius: 20,
            background: '#21262c',
            border: '1px solid rgba(255,255,255,0.06)',
            boxShadow: '0 40px 120px rgba(0,0,0,0.6), 0 0 0 1px rgba(220,38,38,0.08)',
            opacity:   visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
          }}
        >
          {/* ── header ── */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            padding: '20px 28px',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            {/* channel logo + lock badge */}
            <div style={{ position: 'relative', flexShrink: 0 }}>
              <div style={{
                width: 48, height: 48, borderRadius: 14,
                display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <img
                  src={channel.logo}
                  alt={channel.name}
                  style={{ width: '75%', height: '75%', objectFit: 'contain' }}
                  onError={e => { e.currentTarget.src = '/placeholder.png' }}
                />
              </div>
              <div style={{
                position: 'absolute', bottom: -4, right: -4,
                width: 20, height: 20, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: '#dc2626', color: '#fff',
              }}>
                <Lock size={10} strokeWidth={2.5} />
              </div>
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.18em', color: '#ef4444', fontWeight: 700, margin: '0 0 2px' }}>
                {lang === 'ka' ? 'სააბონენტო' : 'Subscription'}
              </p>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#f3f4f6', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {channel.name}
              </p>
              <p style={{ fontSize: 12, color: '#6b7280', margin: '2px 0 0' }}>
                {loading
                  ? (lang === 'ka' ? 'იტვირთება...' : 'Loading plans…')
                  : plans.length > 0
                  ? (lang === 'ka'
                      ? `${plans.length} პაკეტი ხელმისაწვდომია`
                      : `${plans.length} plan${plans.length > 1 ? 's' : ''} available`)
                  : (lang === 'ka' ? 'გამოიწერეთ წვდომისთვის' : 'Subscribe to unlock this channel')}
              </p>
            </div>

            <button
              onClick={handleClose}
              style={{
                width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#6b7280', cursor: 'pointer', transition: 'all 0.15s',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* ── body ── */}
          <div style={{ overflowY: 'auto', padding: '28px', flex: 1 }}>

            {/* loading skeletons */}
            {loading && (
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} style={{
                    borderRadius: 16, padding: 20,
                    border: '1px solid rgba(255,255,255,0.07)',
                    background: 'rgba(255,255,255,0.03)',
                    animation: 'pulse 1.5s infinite',
                  }}>
                    <div style={{ height: 14, width: '50%', borderRadius: 6, background: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
                    <div style={{ height: 28, width: '35%', borderRadius: 6, background: 'rgba(255,255,255,0.08)', marginBottom: 20 }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                      <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
                      <div style={{ height: 10, width: '80%', borderRadius: 4, background: 'rgba(255,255,255,0.08)' }} />
                    </div>
                    <div style={{ height: 38, borderRadius: 10, background: 'rgba(255,255,255,0.08)' }} />
                  </div>
                ))}
              </div>
            )}

            {/* error */}
            {!loading && error && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '14px 18px', borderRadius: 12,
                background: 'rgba(220,38,38,0.08)',
                border: '1px solid rgba(220,38,38,0.2)',
              }}>
                <AlertCircle size={17} style={{ color: '#f87171', flexShrink: 0 }} />
                <p style={{ fontSize: 13, color: '#f87171', margin: 0 }}>{error}</p>
              </div>
            )}

            {/* empty */}
            {!loading && !error && plans.length === 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 12, textAlign: 'center' }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, marginBottom: 4,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
                }}>
                  <CalendarDays size={20} style={{ color: '#ef4444' }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', margin: 0 }}>
                  {lang === 'ka' ? 'პაკეტები არ არის' : 'No plans available'}
                </p>
                <p style={{ fontSize: 12, color: '#4b5563', margin: 0 }}>
                  {lang === 'ka' ? 'ამ არხს პაკეტები ჯერ არ აქვს.' : 'This channel has no assigned plans yet.'}
                </p>
              </div>
            )}

            {/* plans grid */}
            {!loading && !error && plans.length > 0 && (
              <div className={gridClass(plans.length)}>
                {plans.map((plan, index) => (
                  <PlanCard
                    key={plan.id}
                    plan={plan}
                    index={index}
                    total={plans.length}
                    lang={lang}
                    isDark={isDark}
                    onSelect={p => onSelectPlan?.(p, channel)}
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
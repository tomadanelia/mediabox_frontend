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

// ── plan card — matches Plans.tsx card anatomy ────────────────────────────────

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
  const popular = isPopularPlan(index, total)
  const name    = lang === 'ka' ? plan.name_ka        : plan.name_en
  const desc    = lang === 'ka' ? plan.description_ka : plan.description_en
  const price   = parseFloat(plan.price)

  // ── same token names as Plans.tsx ─────────────────────────────────────────
  const t = {
    cardDefault: isDark
      ? 'border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
      : 'bg-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.13)] hover:-translate-y-0.5',
    cardPopular: isDark
      ? 'border border-emerald-500/50 bg-gradient-to-b from-emerald-950/60 to-transparent shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]'
      : 'bg-emerald-50 shadow-[0_8px_32px_rgba(16,185,129,0.18)] ring-2 ring-emerald-400/60 hover:-translate-y-0.5',
    text:        isDark ? 'text-white'     : 'text-slate-900',
    textMuted:   isDark ? 'text-gray-400'  : 'text-slate-600',
    textFaint:   isDark ? 'text-gray-500'  : 'text-slate-500',
    priceColor:  isDark ? 'text-white'     : 'text-slate-900',
    priceMuted:  isDark ? 'text-gray-400'  : 'text-slate-500',
    divider:        isDark ? 'bg-white/10'        : 'bg-slate-200',
    dividerPopular: isDark ? 'bg-emerald-500/20'  : 'bg-emerald-200',
    featureBadge:   isDark ? 'bg-white/10 text-gray-400' : 'bg-emerald-100 text-emerald-700',
    featureText:    isDark ? 'text-gray-300'             : 'text-slate-700',
    btnDefault: isDark
      ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20'
      : 'bg-slate-800 hover:bg-slate-700 text-white',
    btnPopular: 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.45)]',
  }

  return (
    <div
      onClick={() => onSelect(plan)}
      className={`relative rounded-2xl transition-all duration-300 cursor-pointer group ${popular ? t.cardPopular : t.cardDefault}`}
    >
      {/* popular badge — identical to Plans.tsx */}
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg flex items-center gap-1">
            <Sparkles size={9} />
            {lang === 'ka' ? 'პოპულარული' : 'Popular'}
          </span>
        </div>
      )}

      <div className="p-5">
        {/* name + price */}
        <div className="mb-5">
          <h3 className={`text-base font-semibold ${t.text} mb-1`}>{name}</h3>
          <div className="flex items-baseline gap-1">
            <span className={`text-3xl font-bold ${popular ? 'text-emerald-500' : t.priceColor}`}>
              {price.toFixed(2)}
            </span>
            <span className={`${t.priceMuted} text-sm`}>₾</span>
          </div>
          <p className={`text-xs ${t.textFaint} mt-1`}>
            {plan.duration_days} {lang === 'ka' ? 'დღე' : 'days'}
          </p>
        </div>

        {/* divider */}
        <div className={`h-px mb-5 ${popular ? t.dividerPopular : t.divider}`} />

        {/* description */}
        <p className={`text-xs ${t.textMuted} mb-5 leading-relaxed min-h-[2.5rem]`}>{desc}</p>

        {/* feature chips */}
        <ul className="space-y-1.5 mb-6">
          <li className={`flex items-center gap-2 text-xs ${t.featureText}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${popular ? 'bg-emerald-500/20 text-emerald-500' : t.featureBadge}`}>✓</span>
            {lang === 'ka' ? `ხანგრძლივობა ${plan.duration_days} დღე` : `Duration ${plan.duration_days} days`}
          </li>
          <li className={`flex items-center gap-2 text-xs ${t.featureText}`}>
            <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${popular ? 'bg-emerald-500/20 text-emerald-500' : t.featureBadge}`}>✓</span>
            {lang === 'ka' ? 'სრული წვდომა' : 'Full Access'}
          </li>
          <li className={`flex items-center gap-2 text-xs ${t.featureText}`}>
            <Clock size={10} className={popular ? 'text-emerald-500' : isDark ? 'text-gray-400' : 'text-emerald-600'} />
            <span>{getDurationLabel(plan.duration_days, lang)}</span>
          </li>
        </ul>

        {/* CTA — identical structure to Plans.tsx renderButton 'ready' case */}
        <button
          onClick={e => { e.stopPropagation(); onSelect(plan) }}
          className={`w-full cursor-pointer py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] ${popular ? t.btnPopular : t.btnDefault}`}
        >
          {lang === 'ka' ? 'ყიდვა' : 'Get Started'}
          <ArrowRight size={13} />
        </button>
      </div>
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

  // ── theme tokens — mirrors Plans.tsx ──────────────────────────────────────
  const t = {
    bg: isDark
      ? 'bg-[#0a0a0f]'
      : 'bg-white',
    border: isDark
      ? 'border border-white/10'
      : 'border border-slate-200 shadow-[0_20px_60px_rgba(0,0,0,0.12)]',
    headerBorder: isDark ? 'border-white/[0.06]' : 'border-slate-100',
    text:      isDark ? 'text-white'    : 'text-slate-900',
    textMuted: isDark ? 'text-gray-400' : 'text-slate-500',
    closeBtn: isDark
      ? 'bg-white/5 border border-white/10 text-white/40 hover:bg-white/10'
      : 'bg-slate-100 border border-slate-200 text-slate-400 hover:bg-slate-200',
    logoBg: isDark
      ? 'bg-white/[0.06] border border-white/10'
      : 'bg-slate-100 border border-slate-200',
    errorBg:    isDark ? 'bg-red-500/8 border-red-500/20'     : 'bg-red-50 border-red-200',
    errorText:  isDark ? 'text-red-400' : 'text-red-600',
    emptyIconBg: isDark ? 'bg-emerald-500/10 border-emerald-500/15' : 'bg-emerald-50 border-emerald-200',
    backdrop:   isDark ? 'rgba(0,0,0,0.70)' : 'rgba(0,0,0,0.30)',
    shadow: isDark
      ? '0 0 0 1px rgba(16,185,129,0.12), 0 40px 120px rgba(0,0,0,0.7), 0 0 80px rgba(16,185,129,0.05)'
      : '0 20px 80px rgba(0,0,0,0.15)',
  }

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
    if (count === 1) return 'grid grid-cols-1 max-w-xs mx-auto gap-5'
    if (count === 2) return 'grid grid-cols-2 gap-5 max-w-lg mx-auto'
    if (count === 3) return 'grid grid-cols-3 gap-5'
    return 'grid grid-cols-2 xl:grid-cols-4 gap-5'
  }

  return (
    <>
      {/* backdrop */}
      <div
        onClick={handleClose}
        className="fixed inset-0 z-40 transition-all duration-300"
        style={{
          background: visible ? t.backdrop : 'rgba(0,0,0,0)',
          backdropFilter:       visible ? 'blur(8px)' : 'blur(0px)',
          WebkitBackdropFilter: visible ? 'blur(8px)' : 'blur(0px)',
        }}
      />

      {/* modal wrapper */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-6 pointer-events-none" style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>
        <div
          className={`pointer-events-auto flex flex-col rounded-3xl overflow-hidden transition-all duration-300 ${t.bg} ${t.border}`}
          style={{
            width: '860px',
            maxWidth: '95vw',
            maxHeight: '88vh',
            boxShadow: t.shadow,
            opacity:   visible ? 1 : 0,
            transform: visible ? 'translateY(0) scale(1)' : 'translateY(24px) scale(0.96)',
          }}
        >
          {/* ── header ── */}
          <div className={`flex items-center gap-4 px-7 py-5 border-b ${t.headerBorder}`}>
            {/* channel logo + lock badge */}
            <div className="relative shrink-0">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center overflow-hidden ${t.logoBg}`}>
                <img
                  src={channel.logo}
                  alt={channel.name}
                  className="w-9/12 h-9/12 object-contain"
                  onError={e => { e.currentTarget.src = '/placeholder.png' }}
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center bg-emerald-500 text-white">
                <Lock size={10} strokeWidth={2.5} />
              </div>
            </div>

            <div className="flex-1 min-w-0">
              {/* label above — same pattern as tx.subscriptionLabel in Plans.tsx */}
              <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-500 font-semibold mb-0.5">
                {lang === 'ka' ? 'სააბონენტო' : 'Subscription'}
              </p>
              <p className={`text-base font-bold truncate ${t.text}`}>{channel.name}</p>
              <p className={`text-xs ${t.textMuted} mt-0.5`}>
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
              className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 cursor-pointer shrink-0 ${t.closeBtn}`}
            >
              <X size={15} />
            </button>
          </div>

          {/* ── body ── */}
          <div className="overflow-y-auto px-7 py-7 flex-1">

            {/* loading skeletons — same skeleton style as Plans.tsx */}
            {loading && (
              <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`rounded-2xl p-5 animate-pulse ${isDark ? 'border border-white/10 bg-white/5' : 'bg-slate-100'}`}>
                    <div className={`h-4 w-1/2 rounded mb-3 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    <div className={`h-8 w-1/3 rounded mb-5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    <div className="space-y-2 mb-6">
                      <div className={`h-3 rounded w-full ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                      <div className={`h-3 rounded w-4/5 ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                    </div>
                    <div className={`h-10 rounded-xl ${isDark ? 'bg-white/10' : 'bg-slate-200'}`} />
                  </div>
                ))}
              </div>
            )}

            {/* error */}
            {!loading && error && (
              <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border ${t.errorBg}`}>
                <AlertCircle size={17} className={`${t.errorText} shrink-0`} />
                <p className={`text-sm ${t.errorText}`}>{error}</p>
              </div>
            )}

            {/* empty */}
            {!loading && !error && plans.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-1 border ${t.emptyIconBg}`}>
                  <CalendarDays size={20} className="text-emerald-500" />
                </div>
                <p className={`text-sm font-semibold ${t.textMuted}`}>
                  {lang === 'ka' ? 'პაკეტები არ არის' : 'No plans available'}
                </p>
                <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-slate-400'}`}>
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
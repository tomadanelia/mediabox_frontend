'use client'

import { useState } from 'react'
import { Clock, CalendarDays, ArrowRight, Sparkles, CheckCircle2 } from 'lucide-react'

// ── types ─────────────────────────────────────────────────────────────────────
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

type PlanCardProps = {
  plan: Plan
  lang?: 'en' | 'ka'
  onSelect?: (plan: Plan) => void
}

// ── helpers ───────────────────────────────────────────────────────────────────
const GradientDefs = () => (
  <svg width="0" height="0" style={{ position: 'absolute', pointerEvents: 'none' }}>
    <defs>
      <linearGradient id="pcIconGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="100%" stopColor="#fbff00" />
      </linearGradient>
    </defs>
  </svg>
)

const isPremium = (price: string) => parseFloat(price) >= 10
const isPopular = (price: string) => parseFloat(price) >= 10 && parseFloat(price) < 20

const getDurationLabel = (days: number) => {
  if (days === 1) return '24 hours'
  if (days < 30)  return `${days} days`
  const months = days / 30
  return `${months} month${months > 1 ? 's' : ''}`
}

// ── main card ─────────────────────────────────────────────────────────────────
const PlanCard = ({ plan, lang = 'en', onSelect }: PlanCardProps) => {
  const [hovered, setHovered] = useState(false)

  const name    = lang === 'ka' ? plan.name_ka        : plan.name_en
  const desc    = lang === 'ka' ? plan.description_ka : plan.description_en
  const price   = parseFloat(plan.price)
  const premium = isPremium(plan.price)
  const popular = isPopular(plan.price)
  const durationLabel = getDurationLabel(plan.duration_days)

  return (
    <>
      <GradientDefs />

      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        onClick={() => onSelect?.(plan)}
        className="relative flex flex-col w-72 rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer select-none"
        style={{
          /* ── light mode base */
          background: premium
            ? 'linear-gradient(145deg, rgba(249,115,22,0.09) 0%, rgba(251,255,0,0.04) 100%)'
            : 'rgba(255,255,255,0.55)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: premium
            ? '1.5px solid rgba(249,115,22,0.32)'
            : '1px solid rgba(0,0,0,0.08)',
          boxShadow: hovered
            ? premium
              ? '0 0 0 3px rgba(249,115,22,0.14), 0 16px 48px rgba(249,115,22,0.14)'
              : '0 10px 36px rgba(0,0,0,0.10)'
            : premium
            ? '0 0 0 2px rgba(249,115,22,0.08), 0 6px 20px rgba(249,115,22,0.06)'
            : '0 2px 10px rgba(0,0,0,0.05)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
        }}
      >

        {/* top gradient accent bar */}
        {premium && (
          <div
            className="h-[3px] w-full shrink-0"
            style={{ background: 'linear-gradient(90deg,#f97316,#fbff00)' }}
          />
        )}

        {/* popular badge */}
        {popular && (
          <div
            className="absolute top-4 right-4 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full text-black tracking-wide z-10"
            style={{ background: 'linear-gradient(90deg,#f97316,#facc15)' }}
          >
            <Sparkles size={9} />
            Popular
          </div>
        )}

        <div className="flex flex-col gap-4 p-5">

          {/* ── header */}
          <div className="flex items-start gap-3 pr-12">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={
                premium
                  ? { background: 'linear-gradient(135deg,#f97316,#fbff00)' }
                  : { background: 'rgba(0,0,0,0.05)' }
              }
            >
              <CalendarDays
                size={17}
                style={premium ? { color: '#000' } : { stroke: 'url(#pcIconGrad)' }}
              />
            </div>

            <div>
              <p className="text-sm font-semibold text-black/80 dark:text-white/80 leading-snug">
                {name}
              </p>
              {plan.is_active && (
                <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-500 mt-0.5">
                  <CheckCircle2 size={9} />
                  Active
                </span>
              )}
            </div>
          </div>

          {/* divider */}
          <div className="h-px bg-black/6 dark:bg-white/6" />

          {/* ── price */}
          <div className="flex items-end gap-1">
            <span className="text-[10px] font-semibold mb-1.5 text-black/35 dark:text-white/30">$</span>
            <span
              className="text-4xl font-bold leading-none tabular-nums"
              style={{
                background: 'linear-gradient(135deg,#f97316,#d97706)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              {price % 1 === 0 ? price.toFixed(0) : price.toFixed(2)}
            </span>
            <span className="text-[10px] font-medium mb-1.5 ml-0.5 text-black/35 dark:text-white/30">
              / {durationLabel}
            </span>
          </div>

          {/* ── description */}
          <p className="text-xs leading-relaxed text-black/50 dark:text-white/45 -mt-1">
            {desc}
          </p>

          {/* ── duration chip */}
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold"
              style={{
                background: 'rgba(249,115,22,0.09)',
                color: '#f97316',
                border: '1px solid rgba(249,115,22,0.18)',
              }}
            >
              <Clock size={9} />
              {durationLabel}
            </div>
            {plan.duration_days === 1 && (
              <span className="text-[10px] text-black/30 dark:text-white/25">
                Try it out
              </span>
            )}
          </div>

          {/* ── CTA */}
          <button
            className="group w-full h-10 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer mt-1"
            style={
              premium
                ? {
                    background: 'linear-gradient(90deg,#f97316,#facc15)',
                    color: '#000',
                    boxShadow: hovered
                      ? '0 4px 18px rgba(249,115,22,0.45)'
                      : '0 2px 10px rgba(249,115,22,0.22)',
                  }
                : {
                    background: 'rgba(0,0,0,0.05)',
                    border: '1px solid rgba(0,0,0,0.08)',
                    color: 'rgba(0,0,0,0.60)',
                  }
            }
          >
            Get this plan
            <ArrowRight
              size={14}
              className="transition-transform duration-200 group-hover:translate-x-0.5"
            />
          </button>

        </div>
      </div>
    </>
  )
}

export default PlanCard


// ── usage ─────────────────────────────────────────────────────────────────────
// import PlanCard from './PlanCard'
//
// const plans = [ ...your API response... ]
//
// plans.map(plan => (
//   <PlanCard
//     key={plan.id}
//     plan={plan}
//     lang="en"                          // "en" or "ka"
//     onSelect={(p) => console.log(p)}
//   />
// ))
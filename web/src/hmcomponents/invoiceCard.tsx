import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Invoice, InvoiceType } from '../../src/types/invoice'

// ─── Translations ─────────────────────────────────────────────────────────────

const tx = {
  En: {
    purchase:     { label: 'RECEIPT',     title: 'Purchase Confirmed',        sub: (p: string) => `${p} · Subscription Active` },
    fill_balance: { label: 'CREDIT',      title: 'Balance Topped Up',         sub: () => 'Funds added to your account' },
    insufficient: { label: 'ALERT',       title: 'Insufficient Balance',      sub: () => 'Not enough credits for renewal' },
    warning:      { label: 'REMINDER',    title: 'Upcoming Renewal',          sub: (d: string) => `${d} days until next charge` },
    viewInvoice: 'View Invoice',
    dismiss: 'Dismiss',
    daysLeft: 'days left',
    paid: 'Paid',
    pending: 'Pending',
    failed: 'Failed',
    topUp: 'Top Up',
  },
  Ge: {
    purchase:     { label: 'ქვითარი',    title: 'შეძენა დადასტურდა',        sub: (p: string) => `${p} · გააქტიურებულია` },
    fill_balance: { label: 'ჩარიცხვა',  title: 'ბალანსი შეივსო',           sub: () => 'თანხა დაემატა ანგარიშს' },
    insufficient: { label: 'გაფრთხილება', title: 'არასაკმარისი ბალანსი',  sub: () => 'განახლებისთვის საკმარისი ბალანსი არ არის' },
    warning:      { label: 'შეხსენება', title: 'მომავალი განახლება',       sub: (d: string) => `${d} დღე შემდეგ` },
    viewInvoice: 'ინვოისის ნახვა',
    dismiss: 'დახურვა',
    daysLeft: 'დღე',
    paid: 'გადახდილი',
    pending: 'მოლოდინში',
    failed: 'შეცდომა',
    topUp: 'შევსება',
  },
} as const

// ─── Config per type ──────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  purchase: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    labelColor: 'text-emerald-500/80',
    amountColor: 'text-emerald-400',
    border: 'border-emerald-500/15',
    glow: 'hover:border-emerald-500/30',
    dot: 'bg-emerald-400',
  },
  fill_balance: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
      </svg>
    ),
    iconBg: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
    labelColor: 'text-blue-500/80',
    amountColor: 'text-blue-400',
    border: 'border-blue-500/15',
    glow: 'hover:border-blue-500/30',
    dot: 'bg-blue-400',
  },
  insufficient: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
      </svg>
    ),
    iconBg: 'bg-red-500/15 text-red-400 border-red-500/25',
    labelColor: 'text-red-500/80',
    amountColor: 'text-red-400',
    border: 'border-red-500/20',
    glow: 'hover:border-red-500/40',
    dot: 'bg-red-400',
  },
  warning: {
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    iconBg: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
    labelColor: 'text-amber-500/80',
    amountColor: 'text-amber-400',
    border: 'border-amber-500/20',
    glow: 'hover:border-amber-500/40',
    dot: 'bg-amber-400',
  },
} satisfies Record<InvoiceType, {
  icon: React.ReactNode
  iconBg: string
  labelColor: string
  amountColor: string
  border: string
  glow: string
  dot: string
}>

// ─── Single Invoice Card ──────────────────────────────────────────────────────

interface InvoiceCardProps {
  invoice: Invoice
  language?: 'En' | 'Ge'
  onDismiss?: (id: string) => void
  className?: string
}

export function InvoiceCard({ invoice, language = 'En', onDismiss, className = '' }: InvoiceCardProps) {
  const navigate = useNavigate()
  const t = tx[language]
  const cfg = TYPE_CONFIG[invoice.type]
  const copy = t[invoice.type]

  // Build sub-label
  const subLabel = invoice.type === 'purchase'
    ? copy.sub(invoice.planName ?? '')
    : invoice.type === 'warning'
      ? copy.sub(String(invoice.daysUntilRenewal ?? 3))
      : (copy as { label: string; title: string; sub: () => string }).sub()

  // Amount display
  const amountDisplay = invoice.type === 'insufficient'
    ? `${invoice.requiredAmount?.toFixed(2) ?? '—'} ${invoice.currency}`
    : invoice.type === 'warning'
      ? `${invoice.requiredAmount?.toFixed(2) ?? invoice.amount.toFixed(2)} ${invoice.currency}`
      : `${invoice.amount.toFixed(2)} ${invoice.currency}`

  const dateStr = new Date(invoice.createdAt).toLocaleDateString(
    language === 'En' ? 'en-US' : 'ka-GE',
    { month: 'short', day: 'numeric', year: 'numeric' }
  )

  return (
    <div
      className={`
        group relative flex items-center gap-4 px-5 py-4
        rounded-2xl border bg-background
        transition-all duration-200 cursor-pointer
        ${cfg.border} ${cfg.glow}
        hover:bg-profile-sidebar-bg
        ${className}
      `}
      onClick={() => navigate(`/invoice/${invoice.id}`)}
    >
      {/* Type icon */}
      <div className={`
        shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center
        transition-transform duration-200 group-hover:scale-105
        ${cfg.iconBg}
      `}>
        {cfg.icon}
      </div>

      {/* Text block */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-[9px] font-bold uppercase tracking-[0.18em] ${cfg.labelColor}`}>
            {copy.label}
          </span>
          <span className="text-[9px] text-muted-foreground/40">·</span>
          <span className="text-[9px] text-muted-foreground/60 font-mono">{invoice.invoiceNumber}</span>
        </div>
        <p className="text-sm font-semibold text-foreground leading-tight truncate">
          {copy.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">{subLabel}</p>
      </div>

      {/* Right: amount + date + chevron */}
      <div className="shrink-0 text-right flex flex-col items-end gap-0.5">
        <span className={`text-sm font-bold tabular-nums ${cfg.amountColor}`}>
          {amountDisplay}
        </span>
        <span className="text-[10px] text-muted-foreground/60 font-mono">{dateStr}</span>
      </div>

      {/* Dismiss (only for warning / insufficient) */}
      {onDismiss && (invoice.type === 'warning' || invoice.type === 'insufficient') && (
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(invoice.id) }}
          className="
            shrink-0 ml-1 w-6 h-6 rounded-lg flex items-center justify-center
            text-muted-foreground/40 hover:text-muted-foreground hover:bg-border/40
            transition-all duration-150 opacity-0 group-hover:opacity-100
          "
          title={t.dismiss}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}

      {/* Arrow */}
      <svg
        className="shrink-0 w-4 h-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 group-hover:translate-x-0.5 transition-all duration-150"
        fill="none" stroke="currentColor" viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>

      {/* Pulse dot for unseen alerts */}
      {(invoice.type === 'insufficient' || invoice.type === 'warning') && (
        <span className={`absolute top-3 right-3 w-2 h-2 rounded-full ${cfg.dot} animate-pulse`} />
      )}
    </div>
  )
}

// ─── Invoice Feed (used in Profile page) ─────────────────────────────────────

interface InvoiceFeedProps {
  invoices: Invoice[]
  language?: 'En' | 'Ge'
  maxVisible?: number
}

export function InvoiceFeed({ invoices, language = 'En', maxVisible = 6 }: InvoiceFeedProps) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [showAll, setShowAll] = useState(false)

  const visible = invoices.filter(inv => !dismissed.has(inv.id))
  const displayed = showAll ? visible : visible.slice(0, maxVisible)

  const sectionLabel = language === 'En' ? 'Recent Invoices' : 'ბოლო ინვოისები'
  const showMoreLabel = language === 'En' ? `Show ${visible.length - maxVisible} more` : `კიდევ ${visible.length - maxVisible}`
  const showLessLabel = language === 'En' ? 'Show less' : 'ნაკლები'

  if (visible.length === 0) return null

  return (
    <div className="px-8 py-8 lg:px-14 lg:py-10">
      <p className="text-[0.65rem] uppercase tracking-[0.2em] font-semibold text-muted-foreground mb-6">
        {sectionLabel}
      </p>

      <div className="flex flex-col gap-2.5">
        {displayed.map(inv => (
          <InvoiceCard
            key={inv.id}
            invoice={inv}
            language={language}
            onDismiss={(id) => setDismissed(prev => new Set([...prev, id]))}
          />
        ))}
      </div>

      {visible.length > maxVisible && (
        <button
          onClick={() => setShowAll(s => !s)}
          className="mt-4 text-xs text-muted-foreground hover:text-foreground transition-colors font-medium flex items-center gap-1.5"
        >
          <svg
            className={`w-3 h-3 transition-transform duration-200 ${showAll ? 'rotate-180' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
          </svg>
          {showAll ? showLessLabel : showMoreLabel}
        </button>
      )}
    </div>
  )
}

export default InvoiceCard
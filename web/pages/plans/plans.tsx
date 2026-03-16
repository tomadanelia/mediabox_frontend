import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../src/lib/axios'
import useUIStore from '../../src/store/ui-store'
import useAuthStore from '../../src/store/AuthStore'

interface Plan {
  id: string
  name_ka: string
  name_en: string
  description_ka: string
  description_en: string
  price: number
  duration_days: number
  is_active: boolean
}

interface ActivePlan {
  plan_id: string
  name_en: string
  name_ka: string
  price: string
  expires_at: string
  days_left: number
}

interface PurchaseResult {
  message: string
  plan_en?: string
  expires_at?: string
  remaining_balance?: number
}

interface Channel {
  id: string
  external_id: string
  number: number
  name_ka: string
  name_en: string
  icon_url: string | null
  is_active: boolean
}

// ─── Translations ─────────────────────────────────────────────────────────────
const translations = {
  Ge: {
    subscriptionLabel: 'სააბონენტო',
    heading: 'პაკეტები',
    subtitle: 'აირჩიეთ თქვენთვის შესაფერისი სააბონენტო გეგმა',
    accountLabel: 'ანგარიში',
    registerPrompt: 'შესაძენად დარეგისტრირდით',
    balanceLabel: 'ბალანსი',
    lowBalanceText: 'არასაკმარისი ბალანსი',
    lowBalanceHint: 'პაკეტის შესაძენად საჭიროა ბალანსის შევსება',
    popular: 'პოპულარული',
    durationFeature: (d: number) => `ხანგრძლივობა ${d} დღე`,
    daysUnit: 'დღე',
    fullAccess: 'სრული წვდომა',
    activeBadge: 'აქტიურია',
    daysLeft: (d: number) => `${Math.floor(d)} დღე დარჩა`,
    purchasing: 'იყიდება...',
    topUp: 'ბალანსის შევსება',
    buy: 'ყიდვა',
    viewChannels: 'არხები',
    channelsTitle: 'არხები',
    channelsLoading: 'იტვირთება...',
    channelsError: 'შეცდომა არხების ჩატვირთვისას',
    channelsEmpty: 'არხები არ მოიძებნა',
    channelCount: (n: number) => `${n} არხი`,
    close: 'დახურვა',
    channel: 'არხი',
    packetIncludes: 'პაკეტში შედის ყველა უფასო არხი და შემდეგი'
  },
  En: {
    subscriptionLabel: 'SUBSCRIPTION',
    heading: 'Plans',
    subtitle: 'Choose the plan that works best for you',
    accountLabel: 'Account',
    registerPrompt: 'Register to Purchase',
    balanceLabel: 'Balance',
    lowBalanceText: 'Insufficient balance',
    lowBalanceHint: 'Please top up your balance to purchase a plan',
    popular: 'Popular',
    durationFeature: (d: number) => `Duration ${d} days`,
    daysUnit: 'days',
    fullAccess: 'Full Access',
    activeBadge: 'Active',
    daysLeft: (d: number) => `${Math.floor(d)} days left`,
    purchasing: 'Purchasing...',
    topUp: 'Top Up Balance',
    buy: 'Buy',
    viewChannels: 'Channels',
    channelsTitle: 'Channels',
    channelsLoading: 'Loading...',
    channelsError: 'Failed to load channels',
    channelsEmpty: 'No channels found',
    channelCount: (n: number) => `${n} channels`,
    close: 'Close',
    channel: 'CH',
    packetIncludes:'plan includes all free channels and folllowing'
  },
} as const

// ─── Cascading button scenario ────────────────────────────────────────────────
type ButtonScenario = 'guest' | 'owned' | 'low_balance' | 'ready' | 'purchasing'

function getScenario(
  isAuthenticated: boolean,
  owned: boolean,
  canAfford: boolean,
  isPurchasing: boolean
): ButtonScenario {
  if (isPurchasing) return 'purchasing'
  if (!isAuthenticated) return 'guest'
  if (owned) return 'owned'
  if (!canAfford) return 'low_balance'
  return 'ready'
}

// ─── Channel Modal ────────────────────────────────────────────────────────────
const ChannelModal = ({
  plan,
  lang,
  tx,
  isDark,
  onClose,
}: {
  plan: Plan
  lang: 'en' | 'ka'
  tx: typeof translations['En'] | typeof translations['Ge']
  isDark: boolean
  onClose: () => void
}) => {
  const [channels, setChannels] = useState<Channel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const res = await api.get(`/api/plans/${plan.id}/channels`)
        setChannels(res.data.channels ?? [])
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchChannels()

    // close on Escape
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [plan.id])

  // lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const filtered = channels.filter(ch => {
    const q = search.toLowerCase()
    return (
      ch[`name_${lang}` as const].toLowerCase().includes(q) ||
      String(ch.number).includes(q)
    )
  })

  const overlay = 'fixed inset-0 z-50 flex items-center justify-center p-4'
  const backdrop = isDark ? 'bg-black/70 backdrop-blur-sm' : 'bg-black/40 backdrop-blur-sm'
  const modal = isDark
    ? 'relative w-full max-w-lg rounded-2xl border border-white/10 bg-[#0f0f17] shadow-2xl flex flex-col'
    : 'relative w-full max-w-lg rounded-2xl bg-white shadow-2xl flex flex-col'
  const headerBorder = isDark ? 'border-b border-white/10' : 'border-b border-slate-100'
  const searchCls = isDark
    ? 'w-full rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-emerald-500/50 transition-colors'
    : 'w-full rounded-xl bg-slate-100 border border-slate-200 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 transition-colors'
  const rowCls = isDark
    ? 'flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/5 transition-colors'
    : 'flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors'
  const numBadge = isDark
    ? 'w-9 h-9 rounded-lg bg-white/8 border border-white/10 flex items-center justify-center text-xs font-bold text-gray-400 shrink-0'
    : 'w-9 h-9 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-500 shrink-0'
  const nameText = isDark ? 'text-sm text-gray-200' : 'text-sm text-slate-800'
  const subText = isDark ? 'text-xs text-gray-500' : 'text-xs text-slate-400'

  return (
    <div className={`${overlay} ${backdrop}`} onClick={onClose}>
      <div className={modal} style={{ maxHeight: '80vh' }} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`px-5 py-4 ${headerBorder} flex items-start justify-between gap-3 shrink-0`}>
          <div>
            <h2 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {plan[`name_${lang}` as const]} — {tx.channelsTitle}
            </h2>
            {!loading && !error && (
              <p className="text-xs text-emerald-500 mt-0.5">{tx.packetIncludes} {tx.channelCount(channels.length)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
              isDark ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-slate-100 text-slate-400 hover:text-slate-700'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Search */}
        {!loading && !error && channels.length > 0 && (
          <div className="px-5 pt-3 pb-2 shrink-0">
            <input
              className={searchCls}
              placeholder={`${tx.channel} #, ${lang === 'en' ? 'name' : 'სახელი'}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        )}

        {/* Body */}
        <div className="overflow-y-auto flex-1 px-3 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-6 h-6 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
              <span className={`ml-3 text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{tx.channelsLoading}</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-2xl">⚠️</span>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{tx.channelsError}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-2xl">📺</span>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{tx.channelsEmpty}</p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map(ch => (
                <li key={ch.id} className={rowCls}>
                  {/* Icon or number badge */}
                  {ch.icon_url ? (
                    <img
                      src={ch.icon_url}
                      alt={ch[`name_${lang}` as const]}
                      className="w-9 h-9 rounded-lg object-contain bg-white/5 border border-white/5 shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className={numBadge}>{ch.number}</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className={`${nameText} truncate`}>{ch[`name_${lang}` as const]}</p>
                    <p className={subText}>
                      {tx.channel} {ch.number}
                      {!ch.is_active && (
                        <span className="ml-2 text-red-400">●</span>
                      )}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

const Plans = () => {
  const { isDark, language } = useUIStore()
  const { user, isAuthenticated, isLoading: authLoading, fetchUser, setUser } = useAuthStore()
  const navigate = useNavigate()

  const tx = translations[language]
  const lang = language === 'En' ? 'en' : 'ka'

  const [plans, setPlans] = useState<Plan[]>([])
  const [activePlans, setActivePlans] = useState<ActivePlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // ─── Channel modal state ───────────────────────────────────────────────────
  const [channelModalPlan, setChannelModalPlan] = useState<Plan | null>(null)

  const balance = user?.account?.balance != null ? parseFloat(user.account.balance) : null
  const isLowBalance = balance !== null && balance < 1.00

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 4000)
  }

  useEffect(() => {
    fetchUser()

    const fetchActivePlans = async () => {
      try {
        const res = await api.get('/api/plans/my')
        setActivePlans(res.data)
      } catch {
        setActivePlans([])
      }
    }

    const fetchPlans = async () => {
      try {
        const res = await api.get(`/api/plans`)
        const data = res.data;
        setPlans(data.filter((p: Plan) => p.is_active))
      } catch {
        console.error('Failed to fetch plans')
      } finally {
        setPlansLoading(false)
      }
    }

    fetchActivePlans()
    fetchPlans()
  }, [])

  const handlePurchase = async (planId: string) => {
    if (!isAuthenticated) { navigate('/authentication/login'); return }
    setPurchasing(planId)
    try {
      const res = await api.post('/api/plans/purchase', { plan_id: planId })
      const data: PurchaseResult = res.data
      showToast(data.message || tx.activeBadge, 'success')
      if (data.remaining_balance !== undefined && user) {
        setUser({ ...user, account: { ...user.account!, balance: String(data.remaining_balance) } })
      }
      const activeRes = await api.get('/api/plans/my')
      setActivePlans(activeRes.data)
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Error', 'error')
    } finally {
      setPurchasing(null)
    }
  }

  const isOwned = (planId: string) => activePlans.some(ap => ap.plan_id === planId)
  const getActivePlan = (planId: string) => activePlans.find(ap => ap.plan_id === planId)
  const popularIndex = Math.min(3, plans.length - 1)

  // ─── Theme tokens ─────────────────────────────────────────────────────────
  const t = {
    bg: isDark ? 'bg-[#0a0a0f]' : 'bg-[oklch(87.1%_0.15_154.449)]',
    text: isDark ? 'text-white' : 'text-slate-900',
    textMuted: isDark ? 'text-gray-400' : 'text-slate-600',
    textFaint: isDark ? 'text-gray-500' : 'text-slate-500',
    balanceCard: isDark
      ? 'border border-white/10 bg-white/5 backdrop-blur-sm'
      : 'bg-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.1)]',
    balanceLabel: isDark ? 'text-gray-400' : 'text-slate-500',
    balancePulse: isDark ? 'bg-white/10' : 'bg-slate-300',
    activeBanner: isDark
      ? 'border-emerald-500/20 bg-emerald-500/5'
      : 'border-emerald-300 bg-emerald-100',
    activeDays: isDark ? 'text-gray-400' : 'text-slate-600',
    skeletonCard: isDark ? 'border border-white/10 bg-white/5' : 'bg-slate-200/80 shadow-[0_2px_12px_rgba(0,0,0,0.08)]',
    skeletonInner: isDark ? 'bg-white/10' : 'bg-slate-300',
    cardDefault: isDark
      ? 'border border-white/10 bg-white/[0.03] hover:border-white/20 hover:bg-white/[0.06]'
      : 'bg-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.08)] hover:shadow-[0_8px_28px_rgba(0,0,0,0.13)] hover:-translate-y-0.5',
    cardPopular: isDark
      ? 'border border-emerald-500/50 bg-gradient-to-b from-emerald-950/60 to-[#0a0a0f] shadow-[0_0_40px_-10px_rgba(16,185,129,0.3)]'
      : 'bg-emerald-50 shadow-[0_8px_32px_rgba(16,185,129,0.18)] ring-2 ring-emerald-400/60 hover:-translate-y-0.5',
    divider: isDark ? 'bg-white/10' : 'bg-slate-200',
    dividerPopular: isDark ? 'bg-emerald-500/20' : 'bg-emerald-200',
    featureBadge: isDark ? 'bg-white/10 text-gray-400' : 'bg-emerald-100 text-emerald-700',
    featureText: isDark ? 'text-gray-300' : 'text-slate-700',
    activeChip: isDark
      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
      : 'bg-emerald-100 border-emerald-300 text-emerald-800',
    priceColor: isDark ? 'text-white' : 'text-slate-900',
    priceMuted: isDark ? 'text-gray-400' : 'text-slate-500',
    channelBtn: isDark
      ? 'flex items-center gap-1.5 text-xs text-gray-400 hover:text-emerald-400 transition-colors cursor-pointer'
      : 'flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-600 transition-colors cursor-pointer',
  }

  // ─── Per-plan cascading button ────────────────────────────────────────────
  const renderButton = (plan: Plan, popular: boolean) => {
    const owned = isOwned(plan.id)
    const canAfford = balance !== null && balance >= plan.price
    const isPurchasing = purchasing === plan.id
    const scenario = getScenario(isAuthenticated, owned, canAfford, isPurchasing)
    const base = 'w-full cursor-pointer py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2'

    switch (scenario) {
      case 'purchasing':
        return (
          <button disabled className={`${base} ${popular ? 'bg-emerald-500/70' : isDark ? 'bg-white/10' : 'bg-slate-300'} text-white cursor-wait`}>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {tx.purchasing}
          </button>
        )

      case 'guest':
        return (
          <button
            onClick={() => navigate('/authentication/register')}
            className={`${base} ${isDark ? 'bg-white/10 hover:bg-white/15 cursor-pointer text-white border border-white/10 hover:border-white/20' : 'bg-slate-200 hover:bg-slate-300 text-slate-800'} active:scale-[0.98]`}
          >
            {tx.registerPrompt}
          </button>
        )

      case 'owned':
        return (
          <button disabled className={`${base} ${isDark ? 'bg-emerald-500/10 cursor-pointer text-emerald-400 border border-emerald-500/20' : 'bg-emerald-100 text-emerald-700 border border-emerald-300'} cursor-default`}>
            <span className="text-xs">✓</span>
            {tx.activeBadge}
          </button>
        )

      case 'low_balance':
        return (
          <button
            onClick={() => navigate('/profile')}
            className={`${base} ${isDark ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20' : 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'} active:scale-[0.98]`}
          >
            {tx.topUp}
          </button>
        )

      case 'ready':
        return (
          <button
            onClick={() => handlePurchase(plan.id)}
            className={`${base} ${
              popular
                ? 'bg-emerald-500 hover:bg-emerald-400 text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_4px_28px_rgba(16,185,129,0.45)]'
                : isDark
                  ? 'bg-white/10 hover:bg-white/15 text-white border border-white/10 hover:border-white/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-white'
            } active:scale-[0.98]`}
          >
            {tx.buy}
          </button>
        )
    }
  }

  const gridClass = (count: number) => {
    if (count === 1) return 'grid grid-cols-1 max-w-sm mx-auto gap-6'
    if (count === 2) return 'grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-3xl mx-auto'
    if (count === 3) return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
    return 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5'
  }

  return (
    <div className={`min-h-screen ${t.bg} ${t.text} font-sans transition-colors duration-300`} style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

      {/* Toast */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-5 py-3 rounded-xl text-sm font-medium shadow-2xl transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-emerald-500/90 text-white backdrop-blur-sm border border-emerald-400/30'
            : 'bg-red-500/90 text-white backdrop-blur-sm border border-red-400/30'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Channel Modal */}
      {channelModalPlan && (
        <ChannelModal
          plan={channelModalPlan}
          lang={lang}
          tx={tx}
          isDark={isDark}
          onClose={() => setChannelModalPlan(null)}
        />
      )}

      <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8">

        {/* ── Header + Balance/Login widget ── */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-16">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-emerald-500 font-semibold mb-2">{tx.subscriptionLabel}</p>
            <h1 className={`text-4xl sm:text-5xl font-bold tracking-tight ${t.text}`}>{tx.heading}</h1>
            <p className={`mt-3 ${t.textMuted} text-base`}>{tx.subtitle}</p>
          </div>

          {/* Balance / Login widget — 3 states */}
          <div className="flex-shrink-0">
            {authLoading ? (
              <div className={`rounded-2xl ${t.balanceCard} px-6 py-4 w-44`}>
                <div className={`h-3 w-16 ${t.balancePulse} rounded mb-3 animate-pulse`} />
                <div className={`h-8 w-24 ${t.balancePulse} rounded animate-pulse`} />
              </div>
            ) : !isAuthenticated ? (
              <button
                onClick={() => navigate('/authentication/register')}
                className={`rounded-2xl ${t.balanceCard} px-6 py-4 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] cursor-pointer text-left w-full`}
              >
                <p className={`text-xs ${t.balanceLabel} uppercase tracking-widest mb-1`}>{tx.accountLabel}</p>
                <p className={`text-lg font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                  {tx.registerPrompt}
                </p>
              </button>
            ) : (
              <div className={`relative overflow-hidden rounded-2xl ${t.balanceCard} px-6 py-4 transition-colors duration-300`}>
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                <p className={`text-xs ${t.balanceLabel} uppercase tracking-widest mb-1`}>{tx.balanceLabel}</p>
                {balance !== null ? (
                  <div>
                    <p className={`text-3xl font-bold ${isLowBalance ? 'text-red-400' : t.text}`}>
                      {balance.toFixed(2)}
                      <span className={`text-lg ml-1 ${isLowBalance ? 'text-red-400' : 'text-emerald-500'}`}>₾</span>
                    </p>
                    {isLowBalance && (
                      <p className="text-xs text-red-400 mt-1">{tx.lowBalanceText}</p>
                    )}
                  </div>
                ) : (
                  <div className={`h-9 w-24 ${t.balancePulse} rounded-lg animate-pulse`} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Plans Grid ── */}
        {plansLoading ? (
          <div className={gridClass(4)}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} className={`rounded-2xl ${t.skeletonCard} p-5 animate-pulse`}>
                <div className={`h-5 w-1/2 ${t.skeletonInner} rounded mb-3`} />
                <div className={`h-8 w-1/3 ${t.skeletonInner} rounded mb-6`} />
                <div className="space-y-2 mb-8">
                  <div className={`h-3 ${t.skeletonInner} rounded w-full`} />
                  <div className={`h-3 ${t.skeletonInner} rounded w-4/5`} />
                </div>
                <div className={`h-11 ${t.skeletonInner} rounded-xl`} />
              </div>
            ))}
          </div>
        ) : (
          <div className={gridClass(plans.length)}>
            {plans.map((plan, index) => {
              const popular = index === popularIndex
              const owned = isOwned(plan.id)
              const activePlan = getActivePlan(plan.id)

              return (
                <div
                  key={plan.id} onClick={() => setChannelModalPlan(plan)}
                  className={`relative cursor-pointer rounded-2xl transition-all duration-300 group ${popular ? t.cardPopular : t.cardDefault}`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg">
                        {tx.popular}
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-5">
                      <h3 className={`text-base font-semibold ${t.text} mb-1`}>{plan[`name_${lang}` as const]}</h3>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-3xl font-bold ${popular ? 'text-emerald-500' : t.priceColor}`}>
                          {Number(plan.price).toFixed(2)}
                        </span>
                        <span className={`${t.priceMuted} text-sm`}>₾</span>
                      </div>
                      <p className={`text-xs ${t.textFaint} mt-1`}>{plan.duration_days} {tx.daysUnit}</p>
                    </div>

                    <div className={`h-px mb-5 ${popular ? t.dividerPopular : t.divider}`} />

                    <p className={`text-xs ${t.textMuted} mb-5 leading-relaxed min-h-[2.5rem]`}>
                      {plan[`description_${lang}` as const]}
                    </p>

                    <ul className="space-y-1.5 mb-3">
                      <li className={`flex items-center gap-2 text-xs ${t.featureText}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${popular ? 'bg-emerald-500/20 text-emerald-500' : t.featureBadge}`}>✓</span>
                        {tx.durationFeature(plan.duration_days)}
                      </li>
                      <li className={`flex items-center gap-2 text-xs ${t.featureText}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${popular ? 'bg-emerald-500/20 text-emerald-500' : t.featureBadge}`}>✓</span>
                        {tx.fullAccess}
                      </li>
                    </ul>

                    {/* ── View Channels button ── */}
                    <button
                      type="button"
                      onClick={() => setChannelModalPlan(plan)}
                      className={`${t.channelBtn} mb-4`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 21h8M12 17v4" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span className='font-bold'>{tx.viewChannels}</span>
                    </button>

                    {owned && activePlan && (
                      <div className={`mb-3 px-3 py-2 rounded-lg border text-xs ${t.activeChip}`}>
                        {tx.activeBadge} · {tx.daysLeft(activePlan.days_left)}
                      </div>
                    )}

                    {renderButton(plan, popular)}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Low balance global hint */}
        {isAuthenticated && isLowBalance && plans.length > 0 && (
          <p className="text-center text-sm text-red-400/70 mt-10">
            {tx.lowBalanceHint}
          </p>
        )}
      </div>
    </div>
  )
}

export default Plans
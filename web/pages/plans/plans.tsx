import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_BASE_URL } from '@/config'
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

const Plans = () => {
  const { isDark, language } = useUIStore()
  const { user, isAuthenticated, isLoading: authLoading, fetchUser, setUser } = useAuthStore()
  const navigate = useNavigate()

  // Shorthand for the current translation table
  const tx = translations[language]
  // Shorthand for plan field language suffix
  const lang = language === 'En' ? 'en' : 'ka'

  const [plans, setPlans] = useState<Plan[]>([])
  const [activePlans, setActivePlans] = useState<ActivePlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  // Balance is owned by AuthStore — single source of truth
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
        const res = await fetch(`${API_BASE_URL}/api/plans`)
        const data = await res.json()
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
                  key={plan.id}
                  className={`relative rounded-2xl transition-all duration-300 group ${popular ? t.cardPopular : t.cardDefault}`}
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

                    <ul className="space-y-1.5 mb-6">
                      <li className={`flex items-center gap-2 text-xs ${t.featureText}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${popular ? 'bg-emerald-500/20 text-emerald-500' : t.featureBadge}`}>✓</span>
                        {tx.durationFeature(plan.duration_days)}
                      </li>
                      <li className={`flex items-center gap-2 text-xs ${t.featureText}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] ${popular ? 'bg-emerald-500/20 text-emerald-500' : t.featureBadge}`}>✓</span>
                        {tx.fullAccess}
                      </li>
                    </ul>

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
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../src/lib/axios'
import useUIStore from '../../src/store/ui-store'
import useAuthStore from '../../src/store/AuthStore'
import TvDeviceAddon from './TvDevices'
import type {PlanPurchaseInvoiceData,DeviceLimitInvoiceData,InvoiceData} from "../../src/types/invoice"
const DEFAULT_TV_DEVICES = 1
const MAX_TV_DEVICES = 10

interface Plan {
  id: string
  name_ka: string
  name_en: string
  description_ka: string
  description_en: string
  price: number
  duration_days: number
  is_active: boolean
  discounted_price?: number
}

interface ActivePlan {
  plan_id: string
  name_en: string
  name_ka: string
  price: string
  expires_at: string
  days_left: number
}

interface Channel {
  id: string
  external_id: string
  number: number
  name: string
  icon_url: string | null
  is_active: boolean
}

const translations = {
  Ge: {
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
    packetIncludes: 'პაკეტში შედის ყველა უფასო არხი და შემდეგი',
    // TV Device add-on
    tvAddonLabel: 'დამატებითი სერვისი',
    tvAddonTitle: 'TV მოწყობილობები',
    tvAddonSubtitle: 'მაქსიმალური მოწყობილობების ლიმიტის გაზრდა',
    tvAddonPricePerDevice: 'მოწყობილობაზე',
    tvAddonDevices: (n: number) => `${n} მოწყობილობა`,
    tvAddonCurrentLimit: 'მიმდინარე ლიმიტი',
    tvAddonNewLimit: 'ახალი ლიმიტი',
    tvAddonIncluded: 'ჩართულია პაკეტში',
    tvAddonTotal: 'ჯამი',
    tvAddonPlanFee: 'პაკეტის ფასი',
    tvAddonDeviceFee: 'TV მოწყობილობები',
    tvAddonConfirmNote: 'ეს არის ერთჯერადი დამატება',
    tvAddonActiveDevices: 'აქტიური',
    tvAddonNoDevices: 'აქტიური მოწყობილობები არ არის',
    tvAddonRename: 'სახელის შეცვლა',
    tvAddonFreeSlot: 'სლოტის გათავისუფლება',
    tvAddonSlotsRemaining: 'თავისუფალი სლოტები',
    tvAddonPopupHint: 'გაათავისუფლეთ სლოტი ახალი მოწყობილობის დასაკავშირებლად, ან შეცვალეთ სახელი მარტივი იდენტიფიკაციისთვის.',
    tvLimitPurchasing: 'ლიმიტი ემატება...',
    tvLimitSuccess: 'TV ლიმიტი წარმატებით გაიზარდა',
    tvLimitError: 'TV ლიმიტის გაზრდა ვერ მოხერხდა',
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
    packetIncludes: 'plan includes all free channels and following',
    // TV Device add-on
    tvAddonLabel: 'ADD-ON',
    tvAddonTitle: 'TV Devices',
    tvAddonSubtitle: 'Increase your maximum simultaneous device limit',
    tvAddonPricePerDevice: 'per device',
    tvAddonDevices: (n: number) => `${n} device${n !== 1 ? 's' : ''}`,
    tvAddonCurrentLimit: 'Current limit',
    tvAddonNewLimit: 'New limit',
    tvAddonIncluded: 'Included in plan',
    tvAddonTotal: 'Total',
    tvAddonPlanFee: 'Plan fee',
    tvAddonDeviceFee: 'TV devices',
    tvAddonConfirmNote: 'This is a one-time add-on purchase',
    tvAddonActiveDevices: 'active',
    tvAddonNoDevices: 'No active devices',
    tvAddonRename: 'Rename',
    tvAddonFreeSlot: 'Free slot',
    tvAddonSlotsRemaining: 'Slots remaining',
    tvAddonPopupHint: 'Free a slot to allow a new device to connect, or rename devices for easy identification.',
    tvLimitPurchasing: 'Adding limit...',
    tvLimitSuccess: 'TV limit increased successfully',
    tvLimitError: 'Failed to increase TV limit',
  },
} as const

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
  onClose,
}: {
  plan: Plan
  lang: 'en' | 'ka'
  tx: typeof translations['En'] | typeof translations['Ge']
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
  const data = res.data
  const allChannels: Channel[] = data.bundles
    ? data.bundles.flatMap((b: any) => b.items?.channels ?? [])
    : []

  const seen = new Set<string>()
  const unique = allChannels.filter(ch => {
    if (seen.has(ch.id)) return false
    seen.add(ch.id)
    return true
  })

  setChannels(unique)
} catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    fetchChannels()

    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [plan.id])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const filtered = channels.filter(ch => {
    const q = search.toLowerCase()
    return (
      ch.name.toLowerCase().includes(q) ||
      String(ch.number).includes(q)
    )
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-2xl border border-plans-divider bg-auth-card-bg shadow-2xl flex flex-col"
        style={{ maxHeight: '80vh' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-5 py-4 border-b border-plans-divider flex items-start justify-between gap-3 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {plan[`name_${lang}` as const]} — {tx.channelsTitle}
            </h2>
            {!loading && !error && (
              <p className="text-xs text-form-highlights mt-0.5">{tx.packetIncludes} {tx.channelCount(channels.length)}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 w-8 h-8 cursor-pointer rounded-lg flex items-center justify-center transition-colors text-muted-foreground hover:bg-plans-skeleton-bg hover:text-foreground"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {!loading && !error && channels.length > 0 && (
          <div className="px-5 pt-3 pb-2 shrink-0">
            <input
              className="w-full rounded-xl bg-plans-skeleton-bg border border-plans-divider px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-form-highlights transition-colors"
              placeholder={`${tx.channel} #, ${lang === 'en' ? 'name' : 'სახელი'}...`}
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className="overflow-y-auto flex-1 px-3 py-2">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <span className="w-6 h-6 border-2 border-form-border border-t-form-highlights rounded-full animate-spin" />
              <span className="ml-3 text-sm text-muted-foreground">{tx.channelsLoading}</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="text-2xl">⚠️</span>
              <p className="text-sm text-muted-foreground">{tx.channelsError}</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-2">
              <span className="material-symbols-outlined">tv</span>
              <p className="text-sm text-muted-foreground">{tx.channelsEmpty}</p>
            </div>
          ) : (
            <ul className="space-y-0.5">
              {filtered.map(ch => (
                <li key={ch.id} className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-plans-skeleton-bg transition-colors">
                  {ch.icon_url ? (
                    <img
                      src={ch.icon_url}
                      alt={ch.name}
                      className="w-9 h-9 rounded-lg object-contain bg-plans-skeleton-bg border border-plans-divider shrink-0"
                      onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-plans-skeleton-bg border border-plans-divider flex items-center justify-center text-xs font-bold text-muted-foreground shrink-0">
                      {ch.number}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">{ch.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {tx.channel} {ch.number}
                      {!ch.is_active && <span className="ml-2 text-red-400">●</span>}
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

// ─── Plans ────────────────────────────────────────────────────────────────────

const Plans = () => {
  const { language } = useUIStore()
  const { user, isAuthenticated, isLoading: authLoading, fetchUser, setUser } = useAuthStore()
  const navigate = useNavigate()

  const tx = translations[language]
  const lang = language === 'En' ? 'en' : 'ka'

  const [plans, setPlans] = useState<Plan[]>([])
  const [activePlans, setActivePlans] = useState<ActivePlan[]>([])
  const [plansLoading, setPlansLoading] = useState(true)
  const [confirmPlan, setConfirmPlan] = useState<Plan | null>(null)
  const [purchasing, setPurchasing] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [channelModalPlan, setChannelModalPlan] = useState<Plan | null>(null)

  // TV Device add-on state
  const [extraDevices, setExtraDevices] = useState(0)
  const [tvDevicePrice, setTvDevicePrice] = useState(5)
  const [purchasingTvLimit, setPurchasingTvLimit] = useState(false)
  const [confirmTvLimit, setConfirmTvLimit] = useState(false)
  const [successInvoice, setSuccessInvoice] = useState<{ data: InvoiceData; type: 'plan' | 'tv' } | null>(null)
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
        const data = res.data
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
      setSuccessInvoice({ data: res.data, type: 'plan' })
    } catch (err: any) {
      showToast(err?.response?.data?.message || 'Error', 'error')
    } finally {
      setPurchasing(null)
    }
  }

  const handleTvLimitPurchase = async () => {
    if (extraDevices === 0) return
    setPurchasingTvLimit(true)
    try {
      const res = await api.post('/api/plans/tv-limit', { quantity: extraDevices })
      setExtraDevices(0)
      setSuccessInvoice({ data: res.data, type: 'tv' })
    } catch (err: any) {
      showToast(err?.response?.data?.message || tx.tvLimitError, 'error')
    } finally {
      setPurchasingTvLimit(false)
    }
  }

  const handleConfirmPurchase = async () => {
    if (!confirmPlan) return
    const planId = confirmPlan.id
    setConfirmPlan(null)
    await handlePurchase(planId)
    
  }

  const isOwned = (planId: string) => activePlans.some(ap => ap.plan_id === planId)
  const getActivePlan = (planId: string) => activePlans.find(ap => ap.plan_id === planId)
  const popularIndex = Math.min(3, plans.length - 1)

  const t = {
    bg: 'bg-plans-bg',
    cardDefault: [
      'border border-plans-divider bg-plans-card-bg',
      'hover:border-plans-divider-popular hover:shadow-[0_0_0_1.5px_#c01111,0_8px_32px_rgba(192,17,17,0.10)]',
      'dark:hover:shadow-[0_0_0_1.5px_#e03333,0_8px_32px_rgba(224,51,51,0.15)]',
      'hover:-translate-y-1 transition-all duration-300',
    ].join(' '),
    cardPopular: [
      'bg-plans-card-popular-bg',
      'border-2 border-plans-popular-head',
      'shadow-[0_0_0_0px_transparent,0_8px_40px_rgba(192,17,17,0.18)]',
      'hover:-translate-y-1 hover:shadow-[0_0_0_0px_transparent,0_16px_48px_rgba(192,17,17,0.28)]',
      'dark:shadow-[0_0_0_0px_transparent,0_8px_40px_rgba(224,51,51,0.22)]',
      'dark:hover:shadow-[0_0_0_0px_transparent,0_16px_48px_rgba(224,51,51,0.32)]',
      'transition-all duration-300',
    ].join(' '),
    skeletonCard: 'bg-plans-skeleton-bg',
    skeletonInner: 'bg-plans-skeleton-inner',
    divider: 'bg-plans-divider',
    dividerPopular: 'bg-plans-divider-popular',
    balanceCard: 'bg-plans-balance-card-bg',
    featureBadge: 'bg-plans-feature-badge-bg text-plans-feature-badge-text',
    channelBtn: 'flex items-center gap-1.5 text-xs text-plans-channel-btn-text hover:text-form-highlights transition-colors cursor-pointer',
    activeChip: 'bg-plans-active-chip-bg border-plans-active-chip-border text-plans-active-chip-text',
    text: 'text-foreground',
    textMuted: 'text-muted-foreground',
    textFaint: 'text-muted-foreground',
    priceColor: 'text-foreground',
    priceMuted: 'text-muted-foreground',
    balancePulse: 'bg-plans-skeleton-inner',
    balanceLabel: 'text-muted-foreground',
    featureText: 'text-foreground',
    balanceRegisterText: 'text-form-highlights',
    btnGuest: 'bg-transparent hover:bg-plans-skeleton-bg text-foreground border border-plans-divider hover:border-plans-divider-popular transition-all',
    btnPurchasing: 'bg-plans-skeleton-bg text-foreground cursor-wait',
    btnOwned: 'bg-plans-active-chip-bg text-plans-active-chip-text border border-plans-active-chip-border cursor-default',
    btnLowBalance: 'bg-amber-500/10 text-amber-400 border border-amber-500/20 hover:bg-amber-500/20',
    btnReady: 'bg-transparent hover:bg-plans-skeleton-bg text-foreground border border-plans-divider hover:border-plans-divider-popular transition-all',
  }

  const renderButton = (plan: Plan, popular: boolean) => {
    const owned = isOwned(plan.id)
    const canAfford = balance !== null && balance >= plan.price
    const isPurchasing = purchasing === plan.id
    const scenario = getScenario(isAuthenticated, owned, canAfford, isPurchasing)
    const base = 'w-full cursor-pointer py-3 rounded-xl text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2'

    switch (scenario) {
      case 'purchasing':
        return (
          <button disabled className={`${base} ${popular ? 'bg-emerald-500/70' : t.btnPurchasing} text-white`}>
            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {tx.purchasing}
          </button>
        )
      case 'guest':
        return (
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/authentication/register') }}
            className={`${base} ${t.btnGuest} active:scale-[0.98]`}
          >
            {tx.registerPrompt}
          </button>
        )
      case 'owned':
        return (
          <button disabled className={`${base} ${t.btnOwned}`}>
            <span className="text-xs">✓</span>
            {tx.activeBadge}
          </button>
        )
      case 'low_balance':
        return (
          <button
            onClick={(e) => { e.stopPropagation(); navigate('/profile') }}
            className={`${base} ${t.btnLowBalance} active:scale-[0.98]`}
          >
            {tx.topUp}
          </button>
        )
      case 'ready':
        return (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmPlan(plan) }}
            className={`${base} ${
              popular
                ? 'bg-plans-popular-head hover:bg-button-hover text-white shadow-[0_2px_16px_rgba(192,17,17,0.35)] hover:shadow-[0_4px_24px_rgba(192,17,17,0.5)]'
                : t.btnReady
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
    <div className={`min-h ${t.bg} ${t.text} font-sans transition-colors duration-300`} style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}>

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
          onClose={() => setChannelModalPlan(null)}
        />
      )}

      {/* Confirm Purchase Modal */}
      {confirmPlan && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmPlan(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-plans-divider bg-auth-card-bg shadow-2xl p-6 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-form-highlights/50 to-transparent" />

            {/* Title */}
            <h2 className="text-base font-bold text-foreground mb-1">
              {language === 'Ge' ? 'დაადასტურეთ შეძენა' : 'Confirm Purchase'}
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              {language === 'Ge' ? 'გთხოვთ გადაამოწმოთ შეძენის დეტალები' : 'Please review your purchase details'}
            </p>

            {/* Plan detail */}
            <div className="rounded-xl border border-plans-divider bg-plans-skeleton-bg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground mb-0.5">{tx.tvAddonPlanFee}</p>
                  <p className="text-sm font-semibold text-foreground">{confirmPlan[`name_${lang}`]}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{confirmPlan.duration_days} {tx.daysUnit}</p>
                </div>
                <p className="text-2xl font-bold text-foreground tabular-nums">{confirmPlan.discounted_price??Number(confirmPlan.price).toFixed(2)} <span className="text-lg text-form-highlights">₾</span></p>
              </div>
            </div>

            {/* Balance after */}
            {balance !== null && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-plans-skeleton-bg border border-plans-divider mb-5">
                <span className="text-xs text-muted-foreground">
                  {language === 'Ge' ? 'შეძენის შემდეგ' : 'Balance after'}
                </span>
                <span className={`text-sm font-bold tabular-nums ${balance - Number(confirmPlan.price) < 0 ? 'text-red-400' : 'text-foreground'}`}>
                  {(balance - Number(confirmPlan.price)).toFixed(2)} ₾
                </span>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmPlan(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-plans-divider text-muted-foreground hover:bg-plans-skeleton-bg transition-all cursor-pointer"
              >
                {language === 'Ge' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                onClick={handleConfirmPurchase}
                disabled={purchasing !== null}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-form-highlights hover:bg-button-hover text-white transition-all shadow-[0_2px_16px_rgba(192,17,17,0.35)] disabled:opacity-60 disabled:cursor-wait cursor-pointer flex items-center justify-center gap-2"
              >
                {purchasing !== null && (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                )}
                {language === 'Ge' ? 'დიახ, ყიდვა' : 'Yes, Buy'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TV limit standalone confirm (when no plan is being purchased) */}
      {extraDevices > 0 && !confirmPlan && isAuthenticated && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-amber-500/30 bg-auth-card-bg shadow-2xl"
            style={{ boxShadow: '0 0 0 1px rgba(245,158,11,0.15), 0 16px 48px rgba(0,0,0,0.35)' }}
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm text-amber-400 font-semibold">
                +{(extraDevices * tvDevicePrice).toFixed(2)} ₾
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <span className="text-xs text-muted-foreground">{tx.tvAddonDevices(extraDevices)}</span>
            </div>
           <button
              onClick={() => setConfirmTvLimit(true)}
              disabled={purchasingTvLimit}
              className="px-4 py-1.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-black transition-all disabled:opacity-60 disabled:cursor-wait cursor-pointer flex items-center gap-1.5"
            >
              {purchasingTvLimit && (
                <span className="w-3 h-3 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              )}
              {language === 'Ge' ? 'ლიმიტის გაზრდა' : 'Increase Limit'}
            </button>
            <button
              onClick={() => setExtraDevices(0)}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-plans-skeleton-bg transition-colors cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}
      {/* TV Limit Confirm Modal */}
      {confirmTvLimit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setConfirmTvLimit(false)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-amber-500/30 bg-auth-card-bg shadow-2xl p-6 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />

            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M8 21h8M12 17v4" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>

            <h2 className="text-base font-bold text-foreground mb-1">
              {language === 'Ge' ? 'ლიმიტის გაზრდა' : 'Increase Device Limit'}
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              {language === 'Ge' ? 'გთხოვთ გადაამოწმოთ შეძენის დეტალები' : 'Please review your purchase details'}
            </p>

            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground">{tx.tvAddonDevices(extraDevices)}</span>
                <span className="text-2xl font-bold text-amber-400 tabular-nums">{(extraDevices * tvDevicePrice).toFixed(2)} <span className="text-lg">₾</span></span>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{extraDevices} × {tvDevicePrice.toFixed(2)} ₾ / {tx.tvAddonPricePerDevice}</span>
              </div>
            </div>

            {balance !== null && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-plans-skeleton-bg border border-plans-divider mb-5">
                <span className="text-xs text-muted-foreground">
                  {language === 'Ge' ? 'შეძენის შემდეგ' : 'Balance after'}
                </span>
                <span className={`text-sm font-bold tabular-nums ${balance - extraDevices * tvDevicePrice < 0 ? 'text-red-400' : 'text-foreground'}`}>
                  {(balance - extraDevices * tvDevicePrice).toFixed(2)} ₾
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setConfirmTvLimit(false)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-plans-divider text-muted-foreground hover:bg-plans-skeleton-bg transition-all cursor-pointer"
              >
                {language === 'Ge' ? 'გაუქმება' : 'Cancel'}
              </button>
              <button
                onClick={() => { setConfirmTvLimit(false); handleTvLimitPurchase() }}
                disabled={purchasingTvLimit}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 hover:bg-amber-400 text-black transition-all disabled:opacity-60 disabled:cursor-wait cursor-pointer flex items-center justify-center gap-2"
              >
                {purchasingTvLimit && (
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                )}
                {language === 'Ge' ? 'დიახ, გაზრდა' : 'Yes, Increase'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal */}
      {successInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={() => setSuccessInvoice(null)}
        >
          <div
            className="relative w-full max-w-sm rounded-2xl border border-emerald-500/30 bg-auth-card-bg shadow-2xl p-6 overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent" />

            {/* Animated check */}
            <div className="flex items-center justify-center mb-5">
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center">
                <svg className="w-8 h-8 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h2 className="text-center text-lg font-bold text-foreground mb-1">
              {language === 'Ge' ? 'გადახდა წარმატებულია' : 'Payment Successful'}
            </h2>
            <p className="text-center text-xs text-muted-foreground mb-6">
              {successInvoice.type === 'plan'
                ? (language === 'Ge' ? 'თქვენი პაკეტი გააქტიურდა' : 'Your plan has been activated')
                : (language === 'Ge' ? 'TV ლიმიტი გაიზარდა' : 'Your TV device limit has been increased')}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setSuccessInvoice(null)}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-plans-divider text-muted-foreground hover:bg-plans-skeleton-bg transition-all cursor-pointer"
              >
                {language === 'Ge' ? 'დახურვა' : 'Close'}
              </button>
              <button
                onClick={() => {
                  const inv = successInvoice.data
                  setSuccessInvoice(null)
                  navigate('/invoice', { state: { invoiceData: inv } })
                }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-all shadow-[0_2px_16px_rgba(16,185,129,0.3)] cursor-pointer flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem', lineHeight: 1 }}>receipt_long</span>
                {language === 'Ge' ? 'ინვოისი' : 'View Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 lg:px-8">

        {/* Header + Balance */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-3">
          <div>
            <h1 className={`text-3xl sm:text-3xl font-bold tracking-tight ${t.text}`}>{tx.heading}</h1>
            <p className={`mt-3 ${t.textMuted} text-base`}>{tx.subtitle}</p>
          </div>

          <div className="shrink-0">
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
                <p className={`text-lg font-bold ${t.balanceRegisterText}`}>
                  {tx.registerPrompt}
                </p>
              </button>
            ) : (
              <div className={`relative overflow-hidden rounded-2xl ${t.balanceCard} px-6 py-4 transition-colors duration-300`}>
                <div className="absolute inset-0 bg-linear-to-br from-emerald-500/10 to-transparent pointer-events-none" />
                <p className={`text-xs ${t.balanceLabel} uppercase tracking-widest mb-1`}>{tx.balanceLabel}</p>
                {balance !== null ? (
                  <div>
                    <p className={`text-3xl font-bold ${isLowBalance ? 'text-red-400' : t.text}`}>
                      {balance.toFixed(2)}
                      <span className={`text-lg ml-1 ${isLowBalance ? 'text-red-400' : 'text-form-highlights'}`}>₾</span>
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

        {/* ── TV Device Add-on Banner ── */}
        <TvDeviceAddon
          tx={tx}
          extraDevices={extraDevices}
          setExtraDevices={setExtraDevices}
          MAX_TV_DEVICES={MAX_TV_DEVICES}
          isAuthenticated={isAuthenticated}
          navigate={navigate}
          DEFAULT_TV_DEVICES={DEFAULT_TV_DEVICES}
          TV_DEVICE_PRICE={tvDevicePrice}
          onPriceLoaded={setTvDevicePrice}
        />

        {/* Plans Grid */}
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
                  onClick={() => setChannelModalPlan(plan)}
                  className={`relative cursor-pointer rounded-2xl transition-all duration-300 group ${popular ? t.cardPopular : t.cardDefault}`}
                >
                  {popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                      <span className="bg-plans-popular-head text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wide shadow-lg">
                        {tx.popular}
                      </span>
                    </div>
                  )}

                  <div className="p-5">
                    <div className="mb-5">
                      <h3 className={`text-base font-semibold ${t.text} mb-1`}>{plan[`name_${lang}` as const]}</h3>
                      <div className="flex items-baseline gap-2 flex-wrap">
  {(plan.discounted_price ?? plan.price) < plan.price ? (
    <>
      <span className={`text-3xl font-bold ${popular ? 'text-form-highlights' : t.priceColor}`}>
        {Number(plan.discounted_price).toFixed(2)}
        <span className={`${t.priceMuted} text-sm ml-0.5`}>₾</span>
      </span>
      <span className="text-base text-muted-foreground line-through opacity-60">
        {Number(plan.price).toFixed(2)}₾
      </span>
    </>
  ) : (
    <>
      <span className={`text-3xl font-bold ${popular ? 'text-form-highlights' : t.priceColor}`}>
        {Number(plan.price).toFixed(2)}
      </span>
      <span className={`${t.priceMuted} text-sm`}>₾</span>
    </>
  )}
</div>
                      <p className={`text-xs ${t.textFaint} mt-1`}>{plan.duration_days} {tx.daysUnit}</p>
                    </div>

                    <div className={`h-px mb-5 ${popular ? t.dividerPopular : t.divider}`} />

                    <p className={`text-xs ${t.textMuted} mb-5 leading-relaxed min-h-10`}>
                      {plan[`description_${lang}` as const]}
                    </p>

                    <ul className="space-y-1.5 mb-3">
                      <li className={`flex items-center gap-2 text-xs ${t.featureText}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${popular ? 'bg-emerald-500/20 text-emerald-500' : t.featureBadge}`}>✓</span>
                        {tx.durationFeature(plan.duration_days)}
                      </li>
                      <li className={`flex items-center gap-2 text-xs ${t.featureText}`}>
                        <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[10px] ${popular ? 'bg-emerald-500/20 text-emerald-500' : t.featureBadge}`}>✓</span>
                        {tx.fullAccess}
                      </li>
                    </ul>

                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setChannelModalPlan(plan) }}
                      className={`${t.channelBtn} mb-4`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="2" y="3" width="20" height="14" rx="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        <path d="M8 21h8M12 17v4" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      <span className="font-bold">{tx.viewChannels}</span>
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

      </div>
    </div>
  )
}

export default Plans
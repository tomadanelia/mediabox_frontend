import { useState, useEffect, useCallback } from "react";
import api from "../../src/lib/axios";
import useUIStore from "@/store/ui-store";

/* ─── Types ─────────────────────────────────────────────── */
interface Account {
  id: string;
  balance: number | string;
  currency?: string;
}
interface User {
  id: string;
  username: string;
  email: string;
  phone: string | null;
  full_name: string;
  avatar_url: string | null;
  role: string;
  email_verified_at: string | null;
  phone_verified_at: string | null;
  created_at: string;
  account?: Account | null;
}
interface WatchedChannel {
  id: number | string;
  name?: string;
  title?: string;
  channel?: string;
  logo?: string;
  logo_url?: string;
  watched_at?: string;
  last_watched?: string;
  [key: string]: unknown;
}
interface ActivePlan {
  plan_id: string;
  name_en: string;
  name_ka: string;
  price: string;
  expires_at: string;
  days_left: number;
}
interface FavouriteChannels {
  favouriteChannelIds: (number | string)[];
  channels?: { id: number | string; name?: string; logo?: string; [key: string]: unknown }[];
}

/* ─── Translations ───────────────────────────────────────── */
const translations = {
  En: {
    loading: "Loading",
    tabs: { Overview: "Overview", History: "History", Favourites: "Favourites" },
    sidebar: {
      memberSince: "Member Since",
      notVerified: "Account not verified",
    },
    overview: {
      balanceCard: "Balance & Payments",
      email: "Email", phone: "Phone",
      emailVerified: "Email", phoneVerified: "Phone",
      username: "Username", copy: "Copy", copied: "✓ Copied",
      verified: "Verified", unverified: "Pending",
      accountBalance: "Account Balance", copyBalance: "Copy", copiedBalance: "Copied",
      accountId: "Account ID", noAccount: "No account linked.",
      interpayNote: "To top up your balance, copy your <strong>username</strong> and visit the Interpay website. Enter the username in the recipient field and specify the desired amount.",
      copyStep: "Copy Username", copiedStep: "Copied!", interpayLink: "Open Interpay ↗",
    },
    plans: { cardTitle: "Active Plans", expires: "Expires", daysLeft: "days left", empty: "No active plans." },
    history: { cardTitle: "Watch History", channel: "Channel", watchedAt: "Watched", empty: "No watch history." },
    favourites: { cardTitle: "Favourites", channel: "Channel", id: "ID", remove: "Remove", removing: "…", empty: "No favourites added." },
  },
  Ge: {
    loading: "იტვირთება",
    tabs: { Overview: "მთავარი", History: "ისტორია", Favourites: "ფავორიტები" },
    sidebar: {
      memberSince: "დარეგისტრირების თარიღი",
      notVerified: "ანგარიში დაუდასტურებელია",
    },
    overview: {
      balanceCard: "ბალანსი და გადახდები",
      email: "ელ-ფოსტა", phone: "ტელეფონი",
      emailVerified: "ელ-ფოსტა", phoneVerified: "მობილური",
      username: "მომხმარებელი", copy: "კოპირება", copied: "✓ კოპირებულია",
      verified: "დამოწმებული", unverified: "მოლოდინში",
      accountBalance: "ბალანსი", copyBalance: "კოპირება", copiedBalance: "კოპირებულია",
      accountId: "ანგარიშის ID", noAccount: "ანგარიში არ არის.",
      interpayNote: "ბალანსის შესავსებად დააკოპირე <strong>მომხმარებლის სახელი</strong> და გადადი Interpay-ს საიტზე. შეიყვანე სახელი მიმღების ველში და მიუთითე სასურველი თანხა.",
      copyStep: "სახელის კოპირება", copiedStep: "კოპირებულია!", interpayLink: "Interpay-ზე გადასვლა ↗",
    },
    plans: { cardTitle: "აქტიური პაკეტები", expires: "ვადა", daysLeft: "დღე დარჩა", empty: "აქტიური პაკეტი არ არის." },
    history: { cardTitle: "ნანახი არხები", channel: "არხი", watchedAt: "ნანახია", empty: "სანახავი ისტორია არ არის." },
    favourites: { cardTitle: "ფავორიტები", channel: "არხი", id: "ID", remove: "წაშლა", removing: "…", empty: "ფავორიტები არ არის." },
  },
} as const;

type Tab = "Overview" | "History" | "Favourites";

/* ─── Main Component ─────────────────────────────────────── */
export default function UserProfile() {
  const language = useUIStore((state) => state.language);
  const isDark = useUIStore((state) => state.isDark);
  const tx = translations[language];

  /* ── theme ── */
  const c = {
    // Light mode: crisp white/gray base. Dark mode: deep charcoal.
    page:          isDark ? "bg-[#0d0d12] text-zinc-300"              : "bg-gray-50 text-gray-600",
    sidebar:       isDark ? "bg-[#111116]"                             : "bg-white",
    sidebarBorder: isDark ? "border-white/5"                          : "border-gray-200",
    heading:       isDark ? "text-white"                               : "text-gray-900",
    sub:           isDark ? "text-zinc-500"                            : "text-gray-400",
    faint:         isDark ? "text-zinc-700"                            : "text-gray-300",
    accent:        isDark ? "text-violet-400"                          : "text-violet-500",
    divider:       isDark ? "border-white/5"                           : "border-gray-100",
    tabActive:     isDark
      ? "border-violet-400 text-white bg-white/[0.03]"
      : "border-violet-500 text-gray-900 bg-violet-50/60",
    tabInactive:   isDark
      ? "border-transparent text-zinc-600 hover:text-zinc-400 hover:bg-white/[0.02]"
      : "border-transparent text-gray-400 hover:text-gray-700 hover:bg-gray-50",
    verifiedText:  "text-emerald-500",
    unverifiedText: isDark ? "text-zinc-600" : "text-gray-400",
    // balance hero
    balanceBg:     isDark
      ? "bg-gradient-to-br from-violet-950/60 to-[#0d0d12]"
      : "bg-gradient-to-br from-violet-50 to-gray-50",
    balanceNum:    isDark ? "text-white"                               : "text-gray-900",
    interpayBg:    isDark ? "bg-white/[0.03]"                          : "bg-white/80 border border-gray-100",
    btnGhost:      isDark
      ? "border border-white/10 text-zinc-400 hover:border-white/20 hover:text-white"
      : "border border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-900 bg-white",
    btnCopied:     "border border-emerald-500/40 text-emerald-500",
    btnInterpay:   "bg-violet-600 hover:bg-violet-500 text-white",
    // rows
    planRow:       isDark ? "border-white/5"                           : "border-gray-100",
    planHover:     isDark ? "hover:bg-white/[0.02]"                    : "hover:bg-gray-50",
    expiringSoon:  "text-red-400",
    expiringOk:    isDark ? "text-emerald-400"                         : "text-emerald-500",
    progressBg:    isDark ? "bg-white/5"                               : "bg-gray-100",
    tableRow:      isDark
      ? "border-white/5 hover:bg-white/[0.02]"
      : "border-gray-100 hover:bg-gray-50",
    logoBg:        isDark ? "bg-white/5 text-zinc-500"                 : "bg-gray-100 text-gray-400",
    removeBtn:     isDark ? "text-red-400/60 hover:text-red-400"       : "text-red-400 hover:text-red-600",
    rolePill:      isDark ? "bg-violet-500/10 text-violet-400"         : "bg-violet-100 text-violet-600",
    avatarRing:    isDark ? "ring-white/10"                            : "ring-gray-200",
    spinnerColor:  isDark ? "border-violet-400 border-t-transparent"   : "border-violet-500 border-t-transparent",
    mobileTopbar:  isDark ? "bg-[#111116] border-white/5"              : "bg-white border-gray-200",
  };

  const [tab, setTab] = useState<Tab>("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activePlans, setActivePlans] = useState<ActivePlan[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchedChannel[]>([]);
  const [favourites, setFavourites] = useState<FavouriteChannels | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedBalance, setCopiedBalance] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  /* ── Fetch user ── */
  useEffect(() => {
    api.get("/api/user")
      .then((res) => setUser(res.data))
      .catch(() => console.error("Not logged in or failed to fetch user"))
      .finally(() => setLoading(false));
    api.get("/api/plans/my")
      .then((res) => setActivePlans(Array.isArray(res.data) ? res.data : []))
      .catch(() => setActivePlans([]));
  }, []);

  /* ── Fetch watch history ── */
  useEffect(() => {
    if (tab !== "History") return;
    api.get("/user/preferences/watch/last")
      .then((res) => setWatchHistory(Array.isArray(res.data) ? res.data : res.data?.data ?? []))
      .catch(() => setWatchHistory([]));
  }, [tab]);

  /* ── Fetch favourites ── */
  const fetchFavourites = useCallback(() => {
    api.get("/user/preferences/favourite-channels")
      .then((res) => {
        const data = res.data;
        setFavourites({
          ...data,
          favouriteChannelIds: Array.isArray(data?.favouriteChannelIds) ? data.favouriteChannelIds : [],
          channels: Array.isArray(data?.channels) ? data.channels : [],
        });
      })
      .catch(() => setFavourites({ favouriteChannelIds: [], channels: [] }));
  }, []);

  /* ── Delete favourite ── */
  const deleteFavourite = async (channelId: number | string) => {
    setDeletingId(channelId);
    try {
      await api.delete(`/user/preferences/favourites/${channelId}`);
      fetchFavourites();
    } catch { console.error("Failed to remove favourite"); }
    finally { setDeletingId(null); }
  };

  /* ── Copy helpers ── */
  const copyUsername = () => {
    if (!user?.username) return;
    navigator.clipboard.writeText(user.username).then(() => {
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    });
  };
  const copyBalance = () => {
    const bal = user?.account?.balance;
    if (bal == null) return;
    navigator.clipboard.writeText(String(bal)).then(() => {
      setCopiedBalance(true);
      setTimeout(() => setCopiedBalance(false), 2000);
    });
  };

  /* ── Derived ── */
  const initials = user?.full_name
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase()
    : "?";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(
        language === "En" ? "en-US" : "ka-GE",
        { month: "long", year: "numeric" }
      )
    : "—";
  const balance = user?.account?.balance ?? null;
  const currency = user?.account?.currency ?? "GEL";

  const emailVerified = !!user?.email_verified_at;
  const phoneVerified = !!user?.phone_verified_at;
  const anyVerified = emailVerified || phoneVerified;

  if (loading) {
    return (
      <div className={`flex min-h-screen items-center justify-center ${c.page}`}>
        <div className={`w-7 h-7 rounded-full border-2 ${c.spinnerColor} animate-spin`} />
      </div>
    );
  }

  return (
    <div
      className={`flex h-screen overflow-hidden ${c.page} transition-colors duration-300`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/70 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ════════════════════════════════════════
          SIDEBAR — fixed, does NOT scroll with page
      ════════════════════════════════════════ */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 flex flex-col
        ${c.sidebar} border-r ${c.sidebarBorder}
        transition-transform duration-300
        lg:static lg:translate-x-0 lg:flex-shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>

        {/* Avatar + Identity */}
        <div className="px-6 pt-7 pb-5 flex-shrink-0">
          <div className="mb-4">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name}
                className={`w-14 h-14 rounded-2xl object-cover ring-2 ${c.avatarRing}`}
              />
            ) : (
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold ring-2 ${c.avatarRing} ${isDark ? "bg-white/5 text-white" : "bg-gray-100 text-gray-500"}`}>
                {initials}
              </div>
            )}
          </div>

          <h2 className={`text-base font-semibold leading-tight ${c.heading}`}>{user?.full_name ?? "—"}</h2>
          <p className={`text-xs mt-0.5 ${c.sub}`}>@{user?.username ?? "—"}</p>

          <div className="flex items-center gap-2 mt-2">
            <span className={`inline-block text-[0.6rem] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-full ${c.rolePill}`}>
              {user?.role ?? "user"}
            </span>
          </div>

          <p className={`text-[0.65rem] mt-3 ${c.sub}`}>
            {tx.sidebar.memberSince}:{" "}
            <span className={`${c.heading} font-medium`}>{memberSince}</span>
          </p>
        </div>

        {/* Divider */}
        <div className={`border-t ${c.divider} mx-6 flex-shrink-0`} />

        {/* Contact info */}
        <div className="px-6 py-4 flex flex-col gap-3 flex-shrink-0">
          <div>
            <p className={`text-[0.6rem] uppercase tracking-widest ${c.sub} mb-0.5`}>{tx.overview.email}</p>
            <p className={`text-xs font-medium truncate ${c.heading}`}>{user?.email ?? "—"}</p>
          </div>
          {user?.phone && (
            <div>
              <p className={`text-[0.6rem] uppercase tracking-widest ${c.sub} mb-0.5`}>{tx.overview.phone}</p>
              <p className={`text-xs font-medium ${c.heading}`}>{user.phone}</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={`border-t ${c.divider} mx-6 flex-shrink-0`} />

        {/* Verification status */}
        <div className="px-6 py-4 flex-shrink-0">
          {!anyVerified ? (
            <p className={`text-xs ${c.unverifiedText}`}>✗ {tx.sidebar.notVerified}</p>
          ) : (
            <div className="flex flex-col gap-1.5">
              {emailVerified && (
                <p className={`text-xs ${c.verifiedText}`}>
                  ✓ {tx.overview.emailVerified} {tx.overview.verified.toLowerCase()}
                </p>
              )}
              {phoneVerified && (
                <p className={`text-xs ${c.verifiedText}`}>
                  ✓ {tx.overview.phoneVerified} {tx.overview.verified.toLowerCase()}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Nav — directly after verification */}
        <div className={`border-t ${c.divider} flex-shrink-0`}>
          {(["Overview", "History", "Favourites"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSidebarOpen(false); }}
              className={`
                w-full flex items-center gap-3 px-6 py-3.5 text-sm font-medium
                transition-all duration-150 cursor-pointer border-l-2
                ${tab === t ? c.tabActive : c.tabInactive}
              `}
            >
              <span className={`text-[0.6rem] uppercase tracking-widest font-bold ${tab === t ? c.accent : c.faint}`}>
                {t === "Overview" ? "" : t === "History" ? "" : ""}
              </span>
              {tx.tabs[t]}
            </button>
          ))}
        </div>
      </aside>

      {/* ════════════════════════════════════════
          MAIN CONTENT — only this area scrolls
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">

        {/* Mobile topbar */}
        <div className={`lg:hidden flex-shrink-0 flex items-center gap-4 px-5 py-4 border-b ${c.mobileTopbar}`}>
          <button onClick={() => setSidebarOpen(true)} className={`${c.sub} text-xl leading-none`}>☰</button>
          <span className={`text-sm font-medium ${c.heading}`}>{tx.tabs[tab]}</span>
        </div>

        {/* Scrollable content zone — ONLY this scrolls */}
        <div className="flex-1 overflow-y-auto">

          {/* ════ OVERVIEW ════ */}
          {tab === "Overview" && (
            <div className="flex flex-col min-h-full">

              {/* Balance hero */}
              <div className={`${c.balanceBg} px-8 py-10 lg:px-14 lg:py-14 flex-shrink-0`}>
                <p className={`text-[0.65rem] uppercase tracking-[0.2em] font-semibold ${c.sub} mb-3`}>
                  {tx.overview.accountBalance}
                </p>
                <div className="flex items-end gap-4 flex-wrap">
                  <span
                    className={`text-6xl lg:text-7xl font-bold tracking-tight ${c.balanceNum}`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {balance ?? "—"}
                  </span>
                  <span className={`text-2xl font-medium pb-2 ${c.sub}`}>{currency}</span>
                  <button
                    onClick={copyBalance}
                    className={`mb-2 text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-200 cursor-pointer ${copiedBalance ? c.btnCopied : c.btnGhost}`}
                  >
                    {copiedBalance ? tx.overview.copiedBalance : tx.overview.copyBalance}
                  </button>
                </div>

                {/* Interpay */}
                <div className={`mt-8 rounded-xl ${c.interpayBg} p-5`}>
                  <p
                    className={`text-xs leading-relaxed ${c.sub} mb-4`}
                    dangerouslySetInnerHTML={{ __html: tx.overview.interpayNote }}
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={copyUsername}
                      className={`text-xs font-medium px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${copiedUsername ? c.btnCopied : c.btnGhost}`}
                    >
                      {copiedUsername ? tx.overview.copiedStep : tx.overview.copyStep}
                    </button>
                    <a
                      href="https://interpay.ge/ka"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-200 ${c.btnInterpay}`}
                    >
                      {tx.overview.interpayLink}
                    </a>
                  </div>
                </div>
              </div>

              {/* Plans */}
              <div className="px-8 py-8 lg:px-14 lg:py-10">
                <p className={`text-[0.65rem] uppercase tracking-[0.2em] font-semibold ${c.sub} mb-6`}>
                  {tx.plans.cardTitle}
                </p>
                {activePlans.length === 0 ? (
                  <div className="flex items-center gap-3 py-6">
                    <span className={`text-2xl ${c.faint}`}>⊘</span>
                    <span className={`text-sm ${c.sub}`}>{tx.plans.empty}</span>
                  </div>
                ) : (
                  <div className="flex flex-col">
                    {activePlans.map((plan, i) => {
                      const name = language === "En" ? plan.name_en : plan.name_ka;
                      const daysLeft = Math.floor(plan.days_left);
                      const isExpiringSoon = daysLeft <= 3;
                      const expiryDate = new Date(plan.expires_at).toLocaleDateString(
                        language === "En" ? "en-US" : "ka-GE",
                        { day: "numeric", month: "short", year: "numeric" }
                      );
                      const pct = Math.min(100, Math.max(0, (daysLeft / 30) * 100));
                      return (
                        <div
                          key={plan.plan_id}
                          className={`flex items-center gap-6 py-5 border-b ${c.planRow} ${c.planHover} transition-colors duration-150`}
                        >
                          <span className={`text-[0.6rem] font-mono w-5 flex-shrink-0 ${c.faint}`}>
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${c.heading}`}>{name}</p>
                            <p className={`text-[0.65rem] ${c.sub} mt-0.5`}>{tx.plans.expires} {expiryDate}</p>
                          </div>
                          <div className="hidden sm:flex flex-col gap-1.5 w-32 flex-shrink-0">
                            <div className={`h-1 rounded-full ${c.progressBg} overflow-hidden`}>
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isExpiringSoon ? "bg-red-400" : "bg-emerald-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <span className={`text-sm font-bold ${isExpiringSoon ? c.expiringSoon : c.expiringOk}`}>{daysLeft}</span>
                            <span className={`text-[0.65rem] ml-1 ${c.sub}`}>{tx.plans.daysLeft}</span>
                          </div>
                          <span className={`hidden md:block text-xs font-mono ${c.sub} flex-shrink-0 w-16 text-right`}>
                            {plan.price} {currency}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ════ HISTORY ════ */}
          {tab === "History" && (
            <div className="px-8 py-8 lg:px-14 lg:py-10">
              <p className={`text-[0.65rem] uppercase tracking-[0.2em] font-semibold ${c.sub} mb-6`}>
                {tx.history.cardTitle}
              </p>
              {watchHistory.length === 0 ? (
                <div className="flex items-center gap-3 py-6">
                  <span className={`text-2xl ${c.faint}`}>⊘</span>
                  <span className={`text-sm ${c.sub}`}>{tx.history.empty}</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className={`flex items-center gap-6 pb-3 border-b ${c.divider}`}>
                    <span className="w-5 flex-shrink-0" />
                    <span className={`flex-1 text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub}`}>{tx.history.channel}</span>
                    <span className={`text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub} w-36 text-right`}>{tx.history.watchedAt}</span>
                  </div>
                  {watchHistory.map((w, i) => {
                    const name = w.name ?? w.title ?? w.channel ?? `Channel ${w.id}`;
                    const logo = w.logo ?? w.logo_url;
                    const watchedAt = w.watched_at ?? w.last_watched;
                    return (
                      <div key={w.id ?? i} className={`flex items-center gap-6 py-4 border-b ${c.tableRow} transition-colors`}>
                        <span className={`text-[0.6rem] font-mono w-5 flex-shrink-0 ${c.faint}`}>{String(i + 1).padStart(2, "0")}</span>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {logo
                            ? <img src={logo} alt={name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                            : <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[0.6rem] font-bold font-mono ${c.logoBg}`}>{name.slice(0, 2).toUpperCase()}</div>
                          }
                          <span className={`text-sm font-medium truncate ${c.heading}`}>{name}</span>
                        </div>
                        <span className={`text-xs font-mono ${c.sub} w-36 text-right flex-shrink-0`}>
                          {watchedAt
                            ? new Date(watchedAt).toLocaleString(language === "En" ? "en-US" : "ka-GE", {
                                month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                              })
                            : "—"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ════ FAVOURITES ════ */}
          {tab === "Favourites" && (
            <div className="px-8 py-8 lg:px-14 lg:py-10">
              <p className={`text-[0.65rem] uppercase tracking-[0.2em] font-semibold ${c.sub} mb-6`}>
                {tx.favourites.cardTitle}
              </p>
              {!favourites?.favouriteChannelIds?.length ? (
                <div className="flex items-center gap-3 py-6">
                  <span className={`text-2xl ${c.faint}`}>⊘</span>
                  <span className={`text-sm ${c.sub}`}>{tx.favourites.empty}</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div className={`flex items-center gap-6 pb-3 border-b ${c.divider}`}>
                    <span className="w-5 flex-shrink-0" />
                    <span className={`flex-1 text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub}`}>{tx.favourites.channel}</span>
                    <span className={`text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub} w-16 text-right hidden sm:block`}>{tx.favourites.id}</span>
                    <span className="w-14 flex-shrink-0" />
                  </div>
                  {favourites.favouriteChannelIds.map((channelId, i) => {
                    const ch = favourites.channels?.find(cc => cc.id === channelId);
                    const name = ch?.name ?? `Channel ${channelId}`;
                    const logo = ch?.logo as string | undefined;
                    return (
                      <div key={channelId} className={`flex items-center gap-6 py-4 border-b ${c.tableRow} transition-colors`}>
                        <span className={`text-[0.6rem] font-mono w-5 flex-shrink-0 ${c.faint}`}>{String(i + 1).padStart(2, "0")}</span>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {logo
                            ? <img src={logo} alt={name} className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
                            : <div className={`w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center text-[0.6rem] font-bold font-mono ${c.logoBg}`}>{name.slice(0, 2).toUpperCase()}</div>
                          }
                          <span className={`text-sm font-medium truncate ${c.heading}`}>{name}</span>
                        </div>
                        <span className={`text-xs font-mono ${c.sub} w-16 text-right hidden sm:block flex-shrink-0`}>{channelId}</span>
                        <button
                          onClick={() => deleteFavourite(channelId)}
                          disabled={deletingId === channelId}
                          className={`text-xs font-medium w-14 text-right flex-shrink-0 transition-colors cursor-pointer disabled:opacity-40 ${c.removeBtn}`}
                        >
                          {deletingId === channelId ? tx.favourites.removing : tx.favourites.remove}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

        </div>{/* end scrollable zone */}
      </div>{/* end main content */}
    </div>
  );
}
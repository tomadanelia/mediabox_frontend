import { useState, useEffect, useCallback } from "react";
import api from "../../src/lib/axios";
import useUIStore from "../../src/store/ui-store";
import useAuthStore from "../../src/store/AuthStore";
import type { User } from "../../src/types/user";
import EditProfileModal from "./EditModal";

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
  channels?: {
    id: number | string;
    name?: string;
    logo?: string;
    [key: string]: unknown;
  }[];
}

const translations = {
  En: {
    loading: "Loading",
    tabs: {
      Overview: "Overview",
      History: "History",
      Favourites: "Favourites",
    },
    sidebar: {
      memberSince: "Member Since",
      notVerified: "Account not verified",
      editProfile: "Edit Profile",
    },
    overview: {
      balanceCard: "Balance & Payments",
      email: "Email",
      phone: "Phone",
      emailVerified: "Email",
      phoneVerified: "Phone",
      username: "Username",
      copy: "Copy",
      copied: "✓ Copied",
      verified: "Verified",
      unverified: "Pending",
      accountBalance: "Account Balance",
      copyBalance: "Copy",
      copiedBalance: "Copied",
      accountId: "Account ID",
      noAccount: "No account linked.",
      interpayNote:
        "To top up your balance, copy your <strong>username</strong> and visit the Interpay website. Enter the username in the recipient field and specify the desired amount.",
      copyStep: "Copy Account Id",
      copiedStep: "Copied!",
      interpayLink: "Open Interpay ↗",
    },
    plans: {
      cardTitle: "Active Plans",
      expires: "Expires",
      daysLeft: "days left",
      empty: "No active plans.",
    },
    history: {
      cardTitle: "Watch History",
      channel: "Channel",
      watchedAt: "Watched",
      empty: "No watch history.",
    },
    favourites: {
      cardTitle: "Favourites",
      channel: "Channel",
      id: "ID",
      remove: "Remove",
      removing: "…",
      empty: "No favourites added.",
    },
  },
  Ge: {
    loading: "იტვირთება",
    tabs: { Overview: "მთავარი", History: "ისტორია", Favourites: "ფავორიტები" },
    sidebar: {
      memberSince: "დარეგისტრირების თარიღი",
      notVerified: "ანგარიში დაუდასტურებელია",
      editProfile: "პროფილის რედაქტირება",
    },
    overview: {
      balanceCard: "ბალანსი და გადახდები",
      email: "ელ-ფოსტა",
      phone: "ტელეფონი",
      emailVerified: "ელ-ფოსტა",
      phoneVerified: "მობილური",
      username: "მომხმარებელი",
      copy: "კოპირება",
      copied: "✓ კოპირებულია",
      verified: "დამოწმებული",
      unverified: "მოლოდინში",
      accountBalance: "ბალანსი",
      copyBalance: "კოპირება",
      copiedBalance: "კოპირებულია",
      accountId: "ანგარიშის ID",
      noAccount: "ანგარიში არ არის.",
      interpayNote:
        "ბალანსის შესავსებად დააკოპირე <strong>მომხმარებლის სახელი</strong> და გადადი Interpay-ს საიტზე. შეიყვანე სახელი მიმღების ველში და მიუთითე სასურველი თანხა.",
      copyStep: "ანგარიშის ნომრის კოპირება",
      copiedStep: "კოპირებულია!",
      interpayLink: "Interpay-ზე გადასვლა ↗",
    },
    plans: {
      cardTitle: "აქტიური პაკეტები",
      expires: "ვადა",
      daysLeft: "დღე დარჩა",
      empty: "აქტიური პაკეტი არ არის.",
    },
    history: {
      cardTitle: "ნანახი არხები",
      channel: "არხი",
      watchedAt: "ნანახია",
      empty: "სანახავი ისტორია არ არის.",
    },
    favourites: {
      cardTitle: "ფავორიტები",
      channel: "არხი",
      id: "ID",
      remove: "წაშლა",
      removing: "…",
      empty: "ფავორიტები არ არის.",
    },
  },
} as const;

type Tab = "Overview" | "History" | "Favourites";

export default function UserProfile() {
  const language = useUIStore((state) => state.language);
  const isDark = useUIStore((state) => state.isDark);
  const allChannels = useUIStore((state) => state.channels);
  const { setChannels } = useUIStore();
  const tx = translations[language];
  const c = {
    page: "bg-background text-foreground",
    sidebar: "bg-background",
    sidebarBorder: "border-border",
    heading: "text-foreground",
    sub: "text-muted-foreground",
    faint: "text-muted-foreground/40",
    accent: "text-form-highlights",
    divider: "border-border",
    tabActive: "border-form-highlights text-foreground",
    tabInactive:
      "border-transparent text-muted-foreground hover:text-foreground",
    verifiedText: "text-emerald-500",
    unverifiedText: "text-muted-foreground",
    balanceBg: "bg-background",
    balanceNum: "text-foreground",
    interpayBg: "bg-background border border-border",
    btnGhost:
      "border border-border text-muted-foreground hover:border-form-border hover:text-foreground bg-transparent",
    btnCopied: "border border-emerald-500/40 text-emerald-500",
    btnInterpay: "bg-form-highlights hover:bg-button-hover text-white",
    planRow: "border-border",
    planHover: "hover:bg-form-highlight-subtle/50",
    expiringSoon: "text-red-400",
    expiringOk: "text-emerald-500",
    progressBg: "bg-background",
tableRow:  "border-border hover:bg-muted/40",
    logoBg: "bg-muted text-muted-foreground",
    removeBtn: "text-red-400/60 hover:text-red-400",
    rolePill: "bg-muted text-muted-foreground",
    avatarRing: "ring-border",
    spinnerColor: "border-form-highlights border-t-transparent",
    mobileTopbar: "bg-profile-sidebar-bg border-border",
    editBtn:
  "border border-border text-muted-foreground hover:text-form-highlights hover:border-form-highlights bg-transparent",
  };

  const [tab, setTab] = useState<Tab>("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false); // ← new
  const [user, setUser] = useState<User | null>(null);
  const [activePlans, setActivePlans] = useState<ActivePlan[]>([]);
  const [watchHistory, setWatchHistory] = useState<WatchedChannel[]>([]);
  const [favourites, setFavourites] = useState<FavouriteChannels | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedBalance, setCopiedBalance] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const { user: storeUser, fetchUser, isLoading: authLoading } = useAuthStore();

  useEffect(() => {
    if (!storeUser) fetchUser();
  }, []);

  useEffect(() => {
    if (storeUser) {
      setUser(storeUser);
      setLoading(false);
    }
  }, [storeUser]);
  useEffect(() => {
    if (allChannels.length === 0) {
      api
        .get("/api/channels")
        .then((res) => {
          const fetched = Array.isArray(res.data.channels)
            ? res.data.channels
            : [];
          setChannels(fetched);
        })
        .catch(() => {});
    }
  }, []);
  useEffect(() => {
    api
      .get("/api/plans/my")
      .then((res) => setActivePlans(Array.isArray(res.data) ? res.data : []))
      .catch(() => setActivePlans([]));
  }, []);

  /* ── Fetch watch history ── */
  useEffect(() => {
    if (tab !== "History") return;
    api
      .get("/user/preferences/watch/last")
      .then((res) =>
        setWatchHistory(
          Array.isArray(res.data) ? res.data : (res.data?.data ?? []),
        ),
      )
      .catch(() => setWatchHistory([]));
  }, [tab]);
  useEffect(() => {
    if (tab !== "Favourites") return;
    fetchFavourites();
  }, [tab]);
  /* ── Fetch favourites ── */
  const fetchFavourites = useCallback(() => {
    api
      .get("/api/user/preferences/favourite-channels")
      .then((res) => {
        const data = res.data;
        setFavourites({
          ...data,
          favouriteChannelIds: Array.isArray(data?.favouriteChannelIds)
            ? data.favouriteChannelIds
            : [],
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
    } catch {
      console.error("Failed to remove favourite");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Copy helpers ── */
  const copyNumericId = () => {
    if (!user?.numeric_id) return;
    navigator.clipboard.writeText(String(user.numeric_id)).then(() => {
      setCopiedUsername(true);
      setTimeout(() => setCopiedUsername(false), 2000);
    });
  };

  /* ── Derived ── */
  const initials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
    : "?";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(
        language === "En" ? "en-US" : "ka-GE",
        { month: "long", year: "numeric" },
      )
    : "—";
  const balance = user?.account?.balance ?? null;
  const currency = "GEL";

  const emailVerified = !!user?.email_verified_at;
  const phoneVerified = !!user?.phone_verified_at;
  const anyVerified = emailVerified || phoneVerified;

  if (authLoading) {
    return (
      <div
        className={`flex min-h-screen items-center justify-center ${c.page}`}
      >
        <div
          className={`w-7 h-7 rounded-full border-2 ${c.spinnerColor} animate-spin`}
        />
      </div>
    );
  }

  return (
    <div
      className={`flex h-[calc(100vh-64px)] overflow-hidden ${c.page} transition-colors duration-300`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/70 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ════════════════════════════════════════
          SIDEBAR
      ════════════════════════════════════════ */}
      <aside
        className={`
        fixed top-0 left-0 z-30 h-full w-64 flex flex-col
        ${c.sidebar} border-r border-form-highlights ${c.sidebarBorder}
        transition-transform duration-300
        lg:static lg:translate-x-0 lg:shrink-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}
      >
        {/* Avatar + Identity */}
        <div className="px-6 pt-7 pb-5 shrink-0">
          {/* Avatar with edit overlay */}
          <div className="mb-4 relative group w-14">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || undefined}
                className={`w-14 h-14 rounded-2xl object-cover ring-2 ${c.avatarRing}`}
              />
            ) : (
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-bold ring-2 ${c.avatarRing} ${isDark ? "bg-white/5 text-white" : "bg-gray-100 text-gray-500"}`}
              >
                {initials}
              </div>
            )}
            {/* Subtle edit overlay on avatar hover */}
            <button
              onClick={() => setEditModalOpen(true)}
              className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-150 cursor-pointer"
              style={{ background: "rgba(0,0,0,0.5)" }}
              title={tx.sidebar.editProfile}
            >
              <span style={{ fontSize: "0.85rem" }}>✎</span>
            </button>
          </div>

          {user?.full_name && (
            <h2
              className={`text-base font-semibold leading-tight ${c.heading}`}
            >
              {user.full_name}
            </h2>
          )}
          {user?.username && (
            <p className={`text-xs mt-0.5 ${c.sub}`}>{user.username}</p>
          )}
          {!user?.full_name && !user?.username && (
            <p className={`text-xs mt-0.5 ${c.sub}`}>
              {user?.email ?? user?.phone ?? "—"}
            </p>
          )}

          <div className="flex items-center gap-2 mt-2">
            <div className="flex flex-col gap-0.5 mt-2">
  <p className={`text-[0.55rem] uppercase tracking-widest ${c.sub}`}>
    {tx.overview.accountId}
  </p>
  <p className={`text-xs font-mono font-semibold text-foreground border-l-2 border-form-highlights pl-2`}>
    {user?.numeric_id ?? "—"}
  </p>
</div>
          </div>

          <p className={`text-[0.65rem] mt-3 ${c.sub}`}>
            {tx.sidebar.memberSince}:{" "}
            <span className={`${c.heading} font-medium`}>{memberSince}</span>
          </p>

          {/* ── Edit Profile button ── */}
          <button
            onClick={() => setEditModalOpen(true)}
            className={`mt-4 w-full flex items-center border justify-center gap-2 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer ${c.editBtn}`}
          >
            <span style={{ fontSize: "0.75rem" }}>✎</span>
            {tx.sidebar.editProfile}
          </button>
        </div>

        {/* Divider */}
        <div className={`border-t ${c.divider} mx-6 shrink-0`} />

        {/* Contact info */}
        <div className="px-6 py-4 flex flex-col gap-3 shrink-0">
          <div>
            <p
              className={`text-[0.6rem] uppercase tracking-widest ${c.sub} mb-0.5`}
            >
              {tx.overview.email}
            </p>
            <p className={`text-xs font-medium truncate ${c.heading}`}>
              {user?.email ?? "—"}
            </p>
          </div>
          {user?.phone && (
            <div>
              <p
                className={`text-[0.6rem] uppercase tracking-widest ${c.sub} mb-0.5`}
              >
                {tx.overview.phone}
              </p>
              <p className={`text-xs font-medium ${c.heading}`}>{user.phone}</p>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className={`border-t ${c.divider} mx-6 shrink-0`} />

        {/* Verification status */}
        {!anyVerified && (
          <p className={`text-xs ${c.unverifiedText}`}>
            ✗ {tx.sidebar.notVerified}
          </p>
        )}

        {/* Nav */}
        <div className={`border-t ${c.divider}  shrink-0`}>
          {(["Overview", "History", "Favourites"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => {
                setTab(t);
                setSidebarOpen(false);
              }}
              className={`
                w-full flex  items-center gap-3 px-6 py-3.5 text-sm font-medium
                transition-all duration-150 cursor-pointer border-l-2
                ${tab === t ? c.tabActive : c.tabInactive}
              `}
            >
              <span
                className={`text-[0.6rem] uppercase tracking-widest font-bold ${tab === t ? c.accent : c.faint}`}
              >
                {t === "Overview" ? "" : t === "History" ? "" : ""}
              </span>
              {tx.tabs[t]}
            </button>
          ))}
        </div>
      </aside>

      {/* ════════════════════════════════════════
          MAIN CONTENT
      ════════════════════════════════════════ */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile topbar */}
        <div
          className={`lg:hidden shrink-0 flex items-center gap-4 px-5 py-4 border-b ${c.mobileTopbar}`}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className={`${c.sub} text-xl leading-none`}
          >
            ☰
          </button>
          <span className={`text-sm font-medium ${c.heading}`}>
            {tx.tabs[tab]}
          </span>
          {/* mobile edit shortcut */}
          <button
            onClick={() => setEditModalOpen(true)}
            className={`ml-auto text-xs border border-form-highlights px-3 py-1.5 rounded-lg font-medium transition-all duration-150 cursor-pointer ${c.editBtn}`}
          >
            ✎
          </button>
        </div>

        {/* Scrollable content zone */}
        <div className="flex-1 overflow-y-auto">
          {/* ════ OVERVIEW ════ */}
          {tab === "Overview" && (
            <div className="flex flex-col min-h-full">
              {/* Balance hero */}
              <div
                className={`${c.balanceBg} px-8 py-10  lg:px-14 lg:py-14 shrink-0`}
              >
                <p
                  className={`text-[0.65rem] uppercase tracking-[0.2em] font-semibold ${c.sub} mb-3`}
                >
                  {tx.overview.accountBalance}
                </p>
                <div className="flex items-end ml-4 gap-4 flex-wrap">
                  <span
                    className={`text-6xl lg:text-7xl font-bold tracking-tight ${c.balanceNum}`}
                    style={{ fontVariantNumeric: "tabular-nums" }}
                  >
                    {balance ?? "—"}
                  </span>
                  <span className={`text-2xl font-medium pb-2 ${c.sub}`}>
                    {currency}
                  </span>
                </div>

                {/* Interpay */}
                <div className={`mt-8 border border-form-highlights  rounded-xl ${c.interpayBg} p-5`}>
                  <p
                    className={`text-xs leading-relaxed ${c.sub} mb-4`}
                    dangerouslySetInnerHTML={{
                      __html: tx.overview.interpayNote,
                    }}
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={copyNumericId}
                      className={`text-xs font-medium px-4 py-2 rounded-lg transition-all duration-200 cursor-pointer ${copiedUsername ? c.btnCopied : c.btnGhost}`}
                    >
                      {copiedUsername
                        ? tx.overview.copiedStep
                        : tx.overview.copyStep}
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
              <div className={`px-8 py-8 lg:px-14 lg:py-10 ${c.sidebar}`}>
                <p
                  className={`text-[0.65rem] uppercase tracking-[0.2em] font-semibold ${c.sub} mb-6`}
                >
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
                      const name =
                        language === "En" ? plan.name_en : plan.name_ka;
                      const daysLeft = Math.floor(plan.days_left);
                      const isExpiringSoon = daysLeft <= 3;
                      const expiryDate = new Date(
                        plan.expires_at,
                      ).toLocaleDateString(
                        language === "En" ? "en-US" : "ka-GE",
                        { day: "numeric", month: "short", year: "numeric" },
                      );
                      const pct = Math.min(
                        100,
                        Math.max(0, (daysLeft / 30) * 100),
                      );
                      return (
                        <div
                          key={plan.plan_id}
                          className={`flex items-center gap-6 py-5 border-b ${c.planRow} ${c.planHover} transition-colors duration-150`}
                        >
                          <span
                            className={`text-[0.6rem] font-mono w-5 shrink-0 ${c.faint}`}
                          >
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold ${c.heading}`}>
                              {name}
                            </p>
                            <p className={`text-[0.65rem] ${c.sub} mt-0.5`}>
                              {tx.plans.expires} {expiryDate}
                            </p>
                          </div>
                          <div className="hidden sm:flex flex-col gap-1.5 w-32 shrink-0">
                            <div
                              className={`h-1 rounded-full ${c.progressBg} overflow-hidden`}
                            >
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${isExpiringSoon ? "bg-red-400" : "bg-emerald-400"}`}
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                          <div className="shrink-0 text-right">
                            <span
                              className={`text-sm font-bold ${isExpiringSoon ? c.expiringSoon : c.expiringOk}`}
                            >
                              {daysLeft}
                            </span>
                            <span className={`text-[0.65rem] ml-1 ${c.sub}`}>
                              {tx.plans.daysLeft}
                            </span>
                          </div>
                          <span
                            className={`hidden md:block text-xs font-mono ${c.sub} shrink-0 w-16 text-right`}
                          >
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
              <p
                className={`text-[0.65rem] uppercase tracking-[0.2em] font-semibold ${c.sub} mb-6`}
              >
                {tx.history.cardTitle}
              </p>
              {watchHistory.length === 0 ? (
                <div className="flex items-center gap-3 py-6">
                  <span className={`text-2xl ${c.faint}`}>⊘</span>
                  <span className={`text-sm ${c.sub}`}>{tx.history.empty}</span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div
                    className={`flex items-center gap-6 pb-3 border-b ${c.divider}`}
                  >
                    <span className="w-5 shrink-0" />
                    <span
                      className={`flex-1 text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub}`}
                    >
                      {tx.history.channel}
                    </span>
                    <span
                      className={`text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub} w-36 text-right`}
                    >
                      {tx.history.watchedAt}
                    </span>
                  </div>
                  {watchHistory.map((w, i) => {
                    const name =
                      w.name ?? w.title ?? w.channel ?? `Channel ${w.id}`;
                    const logo = w.logo ?? w.logo_url;
                    const watchedAt = w.watched_at ?? w.last_watched;
                    return (
                      <div
                        key={w.id ?? i}
                        className={`flex items-center gap-6 py-4 border-b ${c.tableRow} transition-colors`}
                      >
                        <span
                          className={`text-[0.6rem] font-mono w-5 shrink-0 ${c.faint}`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          {logo ? (
                            <img
                              src={logo}
                              alt={name}
                              className="w-8 h-8 rounded-lg object-cover shrink-0"
                            />
                          ) : (
                            <div
                              className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[0.6rem] font-bold font-mono ${c.logoBg}`}
                            >
                              {name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <span
                            className={`text-sm font-medium truncate ${c.heading}`}
                          >
                            {name}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-mono ${c.sub} w-36 text-right shrink-0`}
                        >
                          {watchedAt
                            ? new Date(watchedAt).toLocaleString(
                                language === "En" ? "en-US" : "ka-GE",
                                {
                                  month: "short",
                                  day: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                },
                              )
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
              <p
                className={`text-[0.65rem] uppercase tracking-[0.2em] font-semibold ${c.sub} mb-6`}
              >
                {tx.favourites.cardTitle}
              </p>
              {!favourites?.favouriteChannelIds?.length ? (
                <div className="flex items-center gap-3 py-6">
                  <span className={`text-2xl ${c.faint}`}>⊘</span>
                  <span className={`text-sm ${c.sub}`}>
                    {tx.favourites.empty}
                  </span>
                </div>
              ) : (
                <div className="flex flex-col">
                  <div
                    className={`flex items-center gap-6 pb-3 border-b ${c.divider}`}
                  >
                    <span className="w-5 shrink-0" />
                    <span
                      className={`flex-1 text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub}`}
                    >
                      {tx.favourites.channel}
                    </span>
                    <span
                      className={`text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub} w-16 text-right hidden sm:block`}
                    >
                      {tx.favourites.id}
                    </span>
                    <span className="w-14 shrink-0" />
                  </div>
                  {favourites.favouriteChannelIds.map((channelId, i) => {
                    const ch = allChannels.find(
                      (c) => String(c.id) === String(channelId),
                    );
                    const name = ch?.name ?? `Channel ${channelId}`;

                    return (
                      <div
                        key={channelId}
                        className={`flex items-center gap-6 py-4 border-b ${c.tableRow} transition-colors`}
                      >
                        <span
                          className={`text-[0.6rem] font-mono w-5 shrink-0 ${c.faint}`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div
                            className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-[0.6rem] font-bold font-mono ${c.logoBg}`}
                          >
                            {name.slice(0, 2).toUpperCase()}
                          </div>
                          <span
                            className={`text-sm font-medium truncate ${c.heading}`}
                          >
                            {name}
                          </span>
                        </div>
                        <span
                          className={`text-xs font-mono ${c.sub} w-16 text-right hidden sm:block shrink-0`}
                        >
                          {channelId}
                        </span>
                        <button
                          onClick={() => deleteFavourite(channelId)}
                          disabled={deletingId === channelId}
                          className={`text-xs font-medium w-14 text-right shrink-0 transition-colors cursor-pointer disabled:opacity-40 ${c.removeBtn}`}
                        >
                          {deletingId === channelId
                            ? tx.favourites.removing
                            : tx.favourites.remove}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
        {/* end scrollable zone */}
      </div>
      {/* end main content */}

      {/* ════ EDIT PROFILE MODAL ════ */}
      <EditProfileModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        currentFullName={user?.full_name ?? ""}
        currentUsername={user?.username ?? ""}
        currentAvatarUrl={user?.avatar_url ?? ""}
        isDark={isDark}
        language={language}
        onSuccess={(updatedUser) => {
          // Local optimistic update while fetchUser re-validates in background
          setUser((prev) =>
            prev ? ({ ...prev, ...updatedUser } as User) : prev,
          );
        }}
      />
    </div>
  );
}

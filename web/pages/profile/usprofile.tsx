import { useState, useEffect, useCallback } from "react";
import api from "../../src/lib/axios";
import useUIStore from "../../src/store/ui-store";
import useAuthStore from "../../src/store/AuthStore";
import type { User } from "../../src/types/user";
import EditProfileModal from "./EditModal";
import TransactionsTab from "./transactionsTab";

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
      Transactions: "Transactions",
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
      username: "Username",
      copy: "Copy",
      copied: "✓ Copied",
      verified: "Verified",
      unverified: "Pending",
      accountBalance: "Available Balance",
      accountId: "Account ID",
      noAccount: "No account linked.",
      interpayNote:
        "Enter an amount below and you will be redirected to the secure payment page.",
      topupTitle: "Top Up Balance",
      topupPlaceholder: "0.00",
      topupPay: "Add Funds",
      topupEnterAmount: "Enter an amount",
      topupRedirecting: "Redirecting…",
      topupErrorInvalid: "Enter a valid amount",
      topupErrorFailed: "Could not get payment URL",
      topupErrorGeneric: "Something went wrong. Try again.",
    },
    plans: {
      cardTitle: "Active Plans",
      expires: "Expires",
      daysLeft: "days left",
      empty: "No active plans.",
    },
    tvLimit: {
      cardTitle: "TV Device Limit",
      label: "Simultaneous streams allowed",
      unit: "devices",
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
    tabs: { Overview: "მთავარი", Transactions: "ტრანზაქციები", Favourites: "ფავორიტები" },
    sidebar: {
      memberSince: "დარეგისტრირების თარიღი",
      notVerified: "ანგარიში დაუდასტურებელია",
      editProfile: "პროფილის რედაქტირება",
    },
    overview: {
      balanceCard: "ბალანსი და გადახდები",
      email: "ელ-ფოსტა",
      phone: "ტელეფონი",
      username: "მომხმარებელი",
      copy: "კოპირება",
      copied: "✓ კოპირებულია",
      verified: "დამოწმებული",
      unverified: "მოლოდინში",
      accountBalance: "ხელმისაწვდომი ბალანსი",
      accountId: "ანგარიშის ID",
      noAccount: "ანგარიში არ არის.",
      interpayNote:
        "შეიყვანეთ თანხა და გადამისამართდებით უსაფრთხო გადახდის გვერდზე.",
      topupTitle: "ბალანსის შევსება",
      topupPlaceholder: "0.00",
      topupPay: "გადახდა",
      topupEnterAmount: "შეიყვანეთ თანხა",
      topupRedirecting: "მიმდინარეობს…",
      topupErrorInvalid: "მიუთითეთ სწორი თანხა",
      topupErrorFailed: "გადამისამართება ვერ მოხდა",
      topupErrorGeneric: "შეცდომა. სცადეთ თავიდან.",
    },
    plans: {
      cardTitle: "აქტიური პაკეტები",
      expires: "ვადა",
      daysLeft: "დღე დარჩა",
      empty: "აქტიური პაკეტი არ არის.",
    },
    tvLimit: {
      cardTitle: "TV მოწყობილობების რაოდენობა",
      label: "ერთდროული ყურების ლიმიტი",
      unit: "მოწყობილობა",
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

type Tab = "Overview" | "Transactions" | "Favourites";

export default function UserProfile() {
  const language = useUIStore((state) => state.language);
  const isDark = useUIStore((state) => state.isDark);
  const allChannels = useUIStore((state) => state.channels);
  const { setChannels } = useUIStore();
  const tx = translations[language];

  const [tab, setTab] = useState<Tab>("Overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [activePlans, setActivePlans] = useState<ActivePlan[]>([]);
  const [favourites, setFavourites] = useState<FavouriteChannels | null>(null);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);
  const { user: storeUser, fetchUser, isLoading: authLoading } = useAuthStore();
  const [companyName, setCompanyName] = useState<string | null>(null);

  const [topupAmount, setTopupAmount] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [topupLoading, setTopupLoading] = useState(false);
  const [topupError, setTopupError] = useState<string | null>(null);

  useEffect(() => { if (!storeUser) fetchUser(); }, []);
  useEffect(() => { if (storeUser) { setUser(storeUser); setLoading(false); } }, [storeUser]);

  useEffect(() => {
    if (allChannels.length === 0) {
      api.get("/api/channels").then((res) => {
        const fetched = Array.isArray(res.data.channels) ? res.data.channels : [];
        setChannels(fetched);
      }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    api.get("/api/user/company").then((res) => {
      if (res.data?.has_company && res.data?.company_name) setCompanyName(res.data.company_name);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    api.get("/api/plans/my")
      .then((res) => setActivePlans(Array.isArray(res.data) ? res.data : []))
      .catch(() => setActivePlans([]));
  }, []);

  useEffect(() => { if (tab === "Favourites") fetchFavourites(); }, [tab]);

  const fetchFavourites = useCallback(() => {
    api.get("/api/user/preferences/favourite-channels").then((res) => {
      const data = res.data;
      setFavourites({
        ...data,
        favouriteChannelIds: Array.isArray(data?.favouriteChannelIds) ? data.favouriteChannelIds : [],
        channels: Array.isArray(data?.channels) ? data.channels : [],
      });
    }).catch(() => setFavourites({ favouriteChannelIds: [], channels: [] }));
  }, []);

  const deleteFavourite = async (channelId: number | string) => {
    setDeletingId(channelId);
    try {
      await api.delete(`/user/preferences/favourites/${channelId}`);
      fetchFavourites();
    } catch { console.error("Failed to remove favourite"); }
    finally { setDeletingId(null); }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (!amount || amount < 0.01) { setTopupError(tx.overview.topupErrorInvalid); return; }
    setTopupLoading(true);
    setTopupError(null);
    try {
      const res = await api.post("/api/interpay/init", {
        amount,
        success_url: "https://tv-api.telecomm1.com/profile",
        failure_url: "https://tv-api.telecomm1.com/profile",
      });
      const redirectUrl = res.data?.redirect_url;
      if (redirectUrl) window.open(redirectUrl, "_blank", "noopener,noreferrer");
      else setTopupError(tx.overview.topupErrorFailed);
    } catch { setTopupError(tx.overview.topupErrorGeneric); }
    finally { setTopupLoading(false); }
  };

  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : "?";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString(language === "En" ? "en-US" : "ka-GE", { month: "long", year: "numeric" })
    : "—";
  const balance = user?.account?.balance ?? null;
  const emailVerified = !!user?.email_verified_at;
  const phoneVerified = !!user?.phone_verified_at;

  const tabIcons: Record<Tab, string> = {
    Overview: "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z",
    Transactions: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2",
    Favourites: "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z",
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="w-8 h-8 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="flex h-[calc(100vh-64px)] overflow-hidden bg-background text-foreground"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Mobile nav overlay */}
      {mobileNavOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setMobileNavOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed top-0 left-0 z-30 h-full w-64 flex flex-col
        bg-background border-r border-border
        transition-transform duration-300
        lg:static lg:translate-x-0 lg:shrink-0
        ${mobileNavOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        {/* Profile identity */}
        <div className="px-6 pt-8 pb-6 border-b border-border">
          <div className="relative w-16 h-16 mb-4 group">
            {user?.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.full_name || "Avatar"}
                className="w-16 h-16 rounded-2xl object-cover ring-2 ring-red-500/30"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-lg font-semibold bg-zinc-800 text-white ring-2 ring-red-500/30">
                {initials}
              </div>
            )}
            {emailVerified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {!companyName && (
              <button
                onClick={() => setEditModalOpen(true)}
                className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 cursor-pointer"
              >
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
                </svg>
              </button>
            )}
          </div>

          <h2 className="text-sm font-semibold text-foreground leading-tight">
            {user?.full_name || user?.username || user?.email || "—"}
          </h2>
          {user?.username && (
            <p className="text-xs text-muted-foreground mt-0.5">@{user.username}</p>
          )}

          {/* Account ID */}
          <div className="mt-3 flex flex-col gap-0.5">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">{tx.overview.accountId}</p>
            <p className="text-xs font-mono font-semibold text-foreground border-l-2 border-red-500 pl-2">
              {user?.numeric_id ?? "—"}
            </p>
          </div>

          {/* Company */}
          {companyName && (
            <div className="mt-2 flex flex-col gap-0.5">
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60">
                {language === "Ge" ? "კომპანია" : "Company"}
              </p>
              <p className="text-xs font-mono font-semibold text-foreground border-l-2 border-red-500 pl-2">{companyName}</p>
            </div>
          )}

          <p className="text-[11px] text-muted-foreground mt-3">
            {tx.sidebar.memberSince}: <span className="text-foreground font-medium">{memberSince}</span>
          </p>
        </div>

        {/* Contact info */}
        <div className="px-6 py-4 border-b border-border flex flex-col gap-3">
          {user?.email && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-0.5">{tx.overview.email}</p>
              <p className="text-xs text-foreground truncate">{user.email}</p>
            </div>
          )}
          {user?.phone && (
            <div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 mb-0.5">{tx.overview.phone}</p>
              <p className="text-xs text-foreground">{user.phone}</p>
            </div>
          )}
        </div>

        {/* Nav tabs */}
        <nav className="flex flex-col flex-1 py-2">
          {(["Overview", "Transactions", "Favourites"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setMobileNavOpen(false); }}
              className={`flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all duration-150 cursor-pointer border-l-2 ${
                tab === t
                  ? "border-red-500 text-foreground bg-red-500/8"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/40"
              }`}
            >
              <svg className={`w-4 h-4 shrink-0 ${tab === t ? "text-red-500" : "text-muted-foreground/50"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={tabIcons[t]} />
              </svg>
              {tx.tabs[t]}
            </button>
          ))}
        </nav>

        {/* Edit / logout area */}
        {!companyName && (
          <div className="px-4 pb-6 pt-2 border-t border-border">
            <button
              onClick={() => setEditModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:border-red-500/50 hover:text-red-400 transition-all cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 11l6-6 3 3-6 6H9v-3z" />
              </svg>
              {tx.sidebar.editProfile}
            </button>
          </div>
        )}
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Mobile topbar */}
        <div className="lg:hidden shrink-0 flex items-center gap-4 px-5 py-4 border-b border-border bg-background">
          <button onClick={() => setMobileNavOpen(true)} className="text-muted-foreground">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-sm font-medium text-foreground">{tx.tabs[tab]}</span>
          {!companyName && (
            <button onClick={() => setEditModalOpen(true)} className="ml-auto text-xs border border-red-500/40 text-red-400 px-3 py-1.5 rounded-lg font-medium cursor-pointer">
              Edit
            </button>
          )}
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {/* ══ OVERVIEW ══ */}
          {tab === "Overview" && (
            <div>
              {/* ── Profile header card (from ProFinance reference) ── */}
              <div className="mx-6 mt-6 rounded-xl border border-border bg-background p-6">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden ring-2 ring-red-500/25">
                      {user?.avatar_url ? (
                        <img src={user.avatar_url} alt={user.full_name || "Avatar"} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-zinc-800 flex items-center justify-center text-xl font-semibold text-white">{initials}</div>
                      )}
                    </div>
                    {emailVerified && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-red-500 border-2 border-background flex items-center justify-center">
                        <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                      <div>
                        <h2 className="text-lg font-semibold text-foreground leading-tight">
                          {user?.full_name || user?.username || "—"}
                        </h2>
                        {user?.username && (
                          <p className="text-sm text-muted-foreground mt-0.5">@{user.username}</p>
                        )}
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-foreground text-background text-[11px] font-semibold uppercase tracking-wide">
                        <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        {language === "Ge" ? "პრემიუმი" : "Member"}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-4 mt-3">
                      {user?.email && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span className="truncate max-w-[200px]">{user.email}</span>
                          {emailVerified && <span className="text-[10px] text-emerald-500 font-semibold uppercase">{tx.overview.verified}</span>}
                        </div>
                      )}
                      {user?.phone && (
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                          </svg>
                          <span>{user.phone}</span>
                          {phoneVerified && <span className="text-[10px] text-emerald-500 font-semibold uppercase">{tx.overview.verified}</span>}
                        </div>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <svg className="w-4 h-4 text-red-500 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{tx.sidebar.memberSince}: {memberSince}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Bento grid ── */}
              <div className="grid grid-cols-12 gap-4 p-6">

                {/* Balance card — dark hero (like ProFinance reference) */}
                <div className="col-span-12 lg:col-span-7 bg-foreground text-background rounded-xl p-7 flex flex-col justify-between relative overflow-hidden min-h-[220px]">
                  {/* Background watermark icon */}
                  <div className="absolute top-4 right-4 opacity-5">
                    <svg className="w-32 h-32" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M21 18v1a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v1m-4 9H7m-3-4h17" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-background/50 mb-2">
                      {tx.overview.accountBalance}
                    </p>
                    <div className="flex items-baseline gap-3 mb-3">
                      <span className="text-5xl lg:text-6xl font-bold tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>
                        {balance ?? "—"}
                      </span>
                      <span className="text-xl font-medium text-background/60">GEL</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-background/50">
                      <span className="text-[10px] uppercase tracking-widest">{tx.overview.accountId}:</span>
                      <span className="font-mono font-semibold text-background/70">{user?.numeric_id ?? "—"}</span>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button className="flex-1 bg-background text-foreground py-2.5 rounded-lg text-sm font-medium hover:bg-background/90 transition-opacity cursor-pointer">
                      {language === "Ge" ? "ანალიტიკა" : "View Plans"}
                    </button>
                    <button
                      onClick={() => {
                        setTab("Transactions");
                        setMobileNavOpen(false);
                      }}
                      className="flex-1 border border-background/20 text-background py-2.5 rounded-lg text-sm font-medium hover:bg-background/10 transition-colors cursor-pointer"
                    >
                      {tx.tabs.Transactions}
                    </button>
                  </div>
                </div>

                {/* Top-up card */}
                <div className="col-span-12 lg:col-span-5 bg-background border border-border rounded-xl p-6 flex flex-col">
                  <h4 className="text-base font-semibold text-foreground mb-5">{tx.overview.topupTitle}</h4>
                  <div className="space-y-4 flex-1">
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        {language === "Ge" ? "სწრაფი არჩევანი" : "Quick select"}
                      </p>
                      <div className="grid grid-cols-4 gap-2">
                        {[5, 10, 20, 50].map((preset) => (
                          <button
                            key={preset}
                            onClick={() => { setTopupAmount(String(preset)); setSelectedPreset(preset); setTopupError(null); }}
                            disabled={topupLoading}
                            className={`py-2.5 rounded-lg text-sm font-semibold border transition-all cursor-pointer disabled:opacity-40 ${
                              selectedPreset === preset
                                ? "border-red-500 text-red-500 bg-red-500/8"
                                : "border-border text-muted-foreground hover:border-red-500/50 hover:text-red-400"
                            }`}
                          >
                            {preset}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">
                        {language === "Ge" ? "სხვა თანხა" : "Custom amount"}
                      </p>
                      <div className="relative">
                        <input
                          type="number"
                          min="0.01"
                          step="0.01"
                          placeholder={tx.overview.topupPlaceholder}
                          value={topupAmount}
                          onChange={(e) => { setTopupAmount(e.target.value); setSelectedPreset(null); setTopupError(null); }}
                          onKeyDown={(e) => e.key === "Enter" && handleTopup()}
                          disabled={topupLoading}
                          className={`w-full h-11 pl-4 pr-14 rounded-lg text-sm font-mono outline-none border transition-colors bg-muted/30 text-foreground
                            ${topupError ? "border-red-500/60" : "border-border focus:border-red-500"}
                            [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-muted-foreground pointer-events-none">GEL</span>
                      </div>
                      {topupError && <p className="text-xs text-red-400 mt-1.5">{topupError}</p>}
                    </div>
                  </div>
                  <button
                    onClick={handleTopup}
                    disabled={topupLoading || !topupAmount}
                    className="mt-5 w-full h-11 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {topupLoading ? (
                      <>
                        <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        {tx.overview.topupRedirecting}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        {topupAmount ? `${tx.overview.topupPay} ${topupAmount} GEL` : tx.overview.topupEnterAmount}
                      </>
                    )}
                  </button>
                </div>

                {/* Active Plans — full width */}
                <div className="col-span-12 bg-background border border-border rounded-xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h4 className="text-sm font-semibold text-foreground uppercase tracking-widest">{tx.plans.cardTitle}</h4>
                    {activePlans.length > 0 && (
                      <span className="text-xs font-semibold text-red-500">{activePlans.length} active</span>
                    )}
                  </div>

                  {activePlans.length === 0 ? (
                    <div className="flex items-center gap-3 py-8">
                      <span className="text-2xl text-muted-foreground/30">⊘</span>
                      <span className="text-sm text-muted-foreground">{tx.plans.empty}</span>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">#</th>
                            <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                              {language === "Ge" ? "პაკეტი" : "Plan"}
                            </th>
                            <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                              {tx.plans.expires}
                            </th>
                            <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                              {language === "Ge" ? "პროგრესი" : "Progress"}
                            </th>
                            <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">
                              {tx.plans.daysLeft}
                            </th>
                            <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right hidden md:table-cell">
                              {language === "Ge" ? "ფასი" : "Price"}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
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
                              <tr key={plan.plan_id} className="group hover:bg-muted/30 transition-colors">
                                <td className="py-4 text-[11px] font-mono text-muted-foreground/50 w-8">{String(i + 1).padStart(2, "0")}</td>
                                <td className="py-4">
                                  <p className="text-sm font-medium text-foreground">{name}</p>
                                </td>
                                <td className="py-4 text-sm text-muted-foreground hidden sm:table-cell">{expiryDate}</td>
                                <td className="py-4 hidden sm:table-cell w-28">
                                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all duration-500 ${isExpiringSoon ? "bg-red-500" : "bg-emerald-400"}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </td>
                                <td className="py-4 text-right">
                                  <span className={`text-sm font-bold ${isExpiringSoon ? "text-red-500" : "text-emerald-400"}`}>{daysLeft}</span>
                                  <span className="text-[11px] text-muted-foreground ml-1">{tx.plans.daysLeft}</span>
                                </td>
                                <td className="py-4 text-right text-xs font-mono text-muted-foreground hidden md:table-cell">
                                  {plan.price} GEL
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* TV Device Limit */}
                {user?.tv_limit != null && (
                  <div className="col-span-12 sm:col-span-6 lg:col-span-4 bg-background border border-border rounded-xl p-6">
                    <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-5">{tx.tvLimit.cardTitle}</p>
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl border border-red-500/30 bg-red-500/8 flex items-center justify-center shrink-0">
                        <span className="text-2xl font-bold text-red-500 tabular-nums">{user.tv_limit}</span>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{user.tv_limit} {tx.tvLimit.unit}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{tx.tvLimit.label}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ══ TRANSACTIONS ══ */}
          {tab === "Transactions" && (
            <TransactionsTab
              language={language}
              isDark={isDark}
              c={{
                sub: "text-muted-foreground",
                faint: "text-muted-foreground/40",
                heading: "text-foreground",
                divider: "border-border",
                accent: "text-red-500",
                tableRow: "border-border hover:bg-muted/40",
                logoBg: "bg-muted text-muted-foreground",
                spinnerColor: "border-red-500 border-t-transparent",
              }}
              companyName={companyName}
              userFullName={user?.full_name}
              userNumericId={user?.numeric_id}
            />
          )}

          {/* ══ FAVOURITES ══ */}
          {tab === "Favourites" && (
            <div className="p-6">
              <div className="bg-background border border-border rounded-xl p-6">
                <div className="flex items-center justify-between mb-5">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-widest">{tx.favourites.cardTitle}</h4>
                  {(favourites?.favouriteChannelIds?.length ?? 0) > 0 && (
                    <span className="text-xs text-muted-foreground">{favourites?.favouriteChannelIds?.length} channels</span>
                  )}
                </div>

                {!favourites?.favouriteChannelIds?.length ? (
                  <div className="flex items-center gap-3 py-8">
                    <span className="text-2xl text-muted-foreground/30">⊘</span>
                    <span className="text-sm text-muted-foreground">{tx.favourites.empty}</span>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-8">#</th>
                          <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">{tx.favourites.channel}</th>
                          <th className="pb-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right hidden sm:table-cell">{tx.favourites.id}</th>
                          <th className="pb-3 w-16"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {favourites.favouriteChannelIds.map((channelId, i) => {
                          const ch = allChannels.find((c) => String(c.id) === String(channelId));
                          const name = ch?.name ?? `Channel ${channelId}`;
                          return (
                            <tr key={channelId} className="group hover:bg-muted/30 transition-colors">
                              <td className="py-4 text-[11px] font-mono text-muted-foreground/50">{String(i + 1).padStart(2, "0")}</td>
                              <td className="py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center text-[11px] font-bold font-mono text-muted-foreground shrink-0">
                                    {name.slice(0, 2).toUpperCase()}
                                  </div>
                                  <span className="text-sm font-medium text-foreground truncate">{name}</span>
                                </div>
                              </td>
                              <td className="py-4 text-xs font-mono text-muted-foreground text-right hidden sm:table-cell">{channelId}</td>
                              <td className="py-4 text-right">
                                <button
                                  onClick={() => deleteFavourite(channelId)}
                                  disabled={deletingId === channelId}
                                  className="text-xs font-medium text-red-400/60 hover:text-red-400 transition-colors cursor-pointer disabled:opacity-40"
                                >
                                  {deletingId === channelId ? tx.favourites.removing : tx.favourites.remove}
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
        {/* end scrollable zone */}
      </div>

      {/* Edit Profile Modal */}
      {!companyName && (
        <EditProfileModal
          isOpen={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          currentFullName={user?.full_name ?? ""}
          currentUsername={user?.username ?? ""}
          currentAvatarUrl={user?.avatar_url ?? ""}
          isDark={isDark}
          language={language}
          onSuccess={(updatedUser) => {
            setUser((prev) => prev ? ({ ...prev, ...updatedUser } as User) : prev);
          }}
        />
      )}
    </div>
  );
}
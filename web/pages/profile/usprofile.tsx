import { useState, useEffect, useCallback } from "react";
import api from "../../src/lib/axios";

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

interface FavouriteChannels {
  favouriteChannelIds: (number | string)[];
  channels?: { id: number | string; name?: string; logo?: string; [key: string]: unknown }[];
}

type Tab = "Overview" | "History" | "Favourites";
const TABS: Record<Tab, string> = {
  Overview: "მიმდინარე სტატუსი",
  History: "ისტორია",
  Favourites: "ფავორიტები",
};
const TAB_ICONS: Record<Tab, string> = {
  Overview: "⊡",
  History: "▤",
  Favourites: "★",
};

/* ─── Main Component ─────────────────────────────────────── */
export default function UserProfile() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [watchHistory, setWatchHistory] = useState<WatchedChannel[]>([]);
  const [favourites, setFavourites] = useState<FavouriteChannels | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedUsername, setCopiedUsername] = useState(false);
  const [copiedBalance, setCopiedBalance] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  /* ── Fetch user ── */
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get("/api/user");
        setUser(res.data);
      } catch {
        console.error("Not logged in or failed to fetch user");
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
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
    } catch {
      console.error("Failed to remove favourite");
    } finally {
      setDeletingId(null);
    }
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
    const balance = user?.account?.balance;
    if (balance == null) return;
    navigator.clipboard.writeText(String(balance)).then(() => {
      setCopiedBalance(true);
      setTimeout(() => setCopiedBalance(false), 2000);
    });
  };

  /* ── Derived ── */
  const initials = user?.full_name
    ? user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "?";
  const memberSince = user?.created_at
    ? new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
    : "—";
  const balance = user?.account?.balance ?? null;
  const currency = user?.account?.currency ?? "GEL";

  if (loading) {
    return (
      <div className="flex min-h-screen bg-zinc-950 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-violet-500 border-t-transparent animate-spin" />
          <span className="text-xs text-zinc-600 tracking-widest uppercase">Loading</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-zinc-950 text-sm text-zinc-400">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed top-0 left-0 h-full z-30 w-60 flex flex-col gap-5 p-5
          bg-zinc-950 border-r border-zinc-800/60 transition-transform duration-300
          lg:static lg:translate-x-0
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        {/* Avatar */}
        <div className="relative w-14 h-14 mt-2 flex-shrink-0">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.full_name}
              className="w-14 h-14 rounded-2xl object-cover border border-zinc-700"
            />
          ) : (
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-600 border border-zinc-700 flex items-center justify-center text-xl font-semibold text-zinc-200 tracking-wide">
              {initials}
            </div>
          )}
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-zinc-950" />
        </div>

        {/* Identity */}
        <div className="flex flex-col gap-1">
          <h1 className="text-base font-semibold text-zinc-100">{user?.full_name ?? "—"}</h1>
          <span className="text-xs text-zinc-600">@{user?.username ?? "—"}</span>
          <span className="mt-1.5 inline-flex w-fit px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[0.63rem] font-semibold text-violet-400 tracking-widest uppercase">
            {user?.role ?? "user"}
          </span>
        </div>

        {/* Quick stats */}
        <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          {[
            { label: "დარეგისტრირების თარიღი", value: memberSince },
            { label: "ფავორიტები", value: String(favourites?.favouriteChannelIds?.length ?? "—") },
            {
              label: "ბალანსი",
              value: balance != null ? `${balance} ${currency}` : "—",
            },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs text-zinc-600">{label}</span>
              <span className="text-xs font-semibold text-zinc-300">{value}</span>
            </div>
          ))}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 mt-auto">
          {Object.entries(TABS).map(([t, label]) => (
            <button
              key={t}
              onClick={() => { setTab(t as Tab); setSidebarOpen(false); }}
              className={`
                flex items-center gap-2.5 cursor-pointer px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left w-full
                ${tab === t
                  ? "bg-violet-500/10 text-violet-400 font-medium"
                  : "text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-300"}
              `}
            >
              <span className="text-base">{TAB_ICONS[t as Tab]}</span>
              {label}
            </button>
          ))}
        </nav>
      </aside>

      {/* ── Content ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Mobile topbar */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-zinc-800/60 bg-zinc-950">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-zinc-500 hover:text-zinc-200 text-lg leading-none"
          >
            ☰
          </button>
          <span className="text-sm font-medium text-zinc-300">{tab}</span>
        </div>

        <main className="flex-1 p-5 md:p-7 space-y-4">

          {/* ── Overview ── */}
          {tab === "Overview" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {/* Account Info */}
              <Card title="ანგარიში" badge="01">
                <InfoRow label="სრული სახელი"      value={user?.full_name ?? "—"} />
                <InfoRow label="ელ-ფოსტა"          value={user?.email ?? "—"} />
                <InfoRow label="ტელეფონი"          value={user?.phone ?? "—"} dim={!user?.phone} />
                <InfoRow label="ელ-ფოსტა დამოწმებული" value={user?.email_verified_at ? "✓ დამოწმებული" : "✗ მიმდინარე"} ok={!!user?.email_verified_at} />
                <InfoRow label="ტელეფონი დამოწმებული" value={user?.phone_verified_at ? "✓ დამოწმებული" : "✗ მიმდინარე"} ok={!!user?.phone_verified_at} />

                {/* Username with copy */}
                <div className="flex justify-between items-center py-2.5">
                  <span className="text-[0.68rem] text-zinc-600 uppercase tracking-widest">მომხმარებლის სახელი</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono text-zinc-300">@{user?.username ?? "—"}</span>
                    <button
                      onClick={copyUsername}
                      title="დაკოპირება"
                      className={`flex items-center cursor-pointer gap-1 px-2 py-0.5 rounded-md text-[0.63rem] font-medium border transition-all duration-200
                        ${copiedUsername
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"}`}
                    >
                      {copiedUsername ? "✓ დაკოპირებულია" : "დაკოპირება"}
                    </button>
                  </div>
                </div>
              </Card>

              {/* Balance & Payment */}
              <Card title="ბალანსი და გადახდები" badge="02">
                {user?.account ? (
                  <>
                    {/* Balance display */}
                    <div className="flex justify-between items-center p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 mb-4">
                      <div>
                        <p className="text-xs text-zinc-600 uppercase tracking-widest mb-1">Account Balance</p>
                        <p className="text-2xl font-bold text-zinc-100">
                          {balance} <span className="text-sm font-normal text-zinc-500">{currency}</span>
                        </p>
                      </div>
                      <button
                        onClick={copyBalance}
                        title="Copy balance"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
                          ${copiedBalance
                            ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                            : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600 hover:text-zinc-200"}`}
                      >
                        {copiedBalance ? "✓ Copied" : "⊕ Copy"}
                      </button>
                    </div>

                    {/* Interpay instructions */}
                    <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20 flex flex-col gap-2.5">
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        ბალანსის შესავსებად დააკოპირე <strong className="text-zinc-200">მომხმარებლის სახელი</strong> და გადადი Interpay-ს საიტზე. შემდეგ, Interpay-ში, შეიყვანე ეს სახელი "მიმღების" ველში და მიუთითე სასურველი თანხა. გადახდის დასრულების შემდეგ, შენი ბალანსი ავტომატურად განახლდება ჩვენს პლატფორმაზე.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          onClick={copyUsername}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200
                            ${copiedUsername
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                              : "bg-zinc-800 border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-white"}`}
                        >
                          {copiedUsername ? "✓ სახელი დაკოპირებულია!" : "① კოპირება"}
                        </button>
                        <a
                          href="https://interpay.ge/ka"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600/10 border border-blue-500/30 text-blue-400 hover:bg-blue-600/20 hover:border-blue-400/50 transition-all duration-200"
                        >
                          ② გადადი Interpay-ზე ↗
                        </a>
                      </div>
                    </div>

                    {user.account.id && (
                      <div className="flex justify-between items-center py-2.5 mt-2 border-t border-zinc-800/60">
                        <span className="text-[0.68rem] text-zinc-600 uppercase tracking-widest">Account ID</span>
                        <span className="text-xs font-mono text-zinc-400">{String(user.account.id)}</span>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="py-8 flex flex-col items-center gap-2 text-center">
                    <span className="text-2xl">⊘</span>
                    <p className="text-xs text-zinc-600">ეს მომხმარებელი არ არის დამოწმებული</p>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* ── History ── */}
          {tab === "History" && (
            <Card title="ბოლოს ნანახი არხები" badge="03">
              {watchHistory.length === 0 ? (
                <EmptyState message="No watch history available." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {["Channel", "Watched At"].map((h) => (
                          <th key={h} className="pb-3 text-left text-[0.63rem] font-semibold text-zinc-700 uppercase tracking-widest pr-5">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {watchHistory.map((w, i) => {
                        const name = w.name ?? w.title ?? w.channel ?? `Channel ${w.id}`;
                        const logo = w.logo ?? w.logo_url;
                        const watchedAt = w.watched_at ?? w.last_watched;
                        return (
                          <tr key={w.id ?? i} className="border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 pr-5">
                              <div className="flex items-center gap-3">
                                {logo ? (
                                  <img src={logo} alt={name} className="w-7 h-7 rounded-lg object-cover bg-zinc-800 flex-shrink-0" />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center text-[0.6rem] text-zinc-600 font-mono font-bold">
                                    {name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm font-medium text-zinc-200">{name}</span>
                              </div>
                            </td>
                            <td className="py-3 text-xs text-zinc-500 font-mono">
                              {watchedAt
                                ? new Date(watchedAt).toLocaleString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          {/* ── Favourites ── */}
          {tab === "Favourites" && (
            <Card title="ფავორიტი არხები" badge="04">
              {!favourites?.favouriteChannelIds?.length ? (
                <EmptyState message="არ არის დამატებული ფავორიტი არხები." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[400px]">
                    <thead>
                      <tr className="border-b border-zinc-800">
                        {["Channel", "ID", ""].map((h, i) => (
                          <th key={i} className="pb-3 text-left text-[0.63rem] font-semibold text-zinc-700 uppercase tracking-widest pr-5 last:pr-0">
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {favourites.favouriteChannelIds.map((channelId) => {
                        const ch = favourites.channels?.find((c) => c.id === channelId);
                        const name = ch?.name ?? `Channel ${channelId}`;
                        const logo = ch?.logo;
                        return (
                          <tr key={channelId} className="border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors">
                            <td className="py-3 pr-5">
                              <div className="flex items-center gap-3">
                                {logo ? (
                                  <img src={logo} alt={name} className="w-7 h-7 rounded-lg object-cover bg-zinc-800 flex-shrink-0" />
                                ) : (
                                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex-shrink-0 flex items-center justify-center text-[0.6rem] text-zinc-600 font-mono font-bold">
                                    {name.slice(0, 2).toUpperCase()}
                                  </div>
                                )}
                                <span className="text-sm font-medium text-zinc-200">{name}</span>
                              </div>
                            </td>
                            <td className="py-3 pr-5 text-xs text-zinc-600 font-mono">{channelId}</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => deleteFavourite(channelId)}
                                disabled={deletingId === channelId}
                                className="px-2.5 py-1 rounded-lg text-[0.68rem] font-medium border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed"
                              >
                                {deletingId === channelId ? "…" : "Remove"}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

        </main>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */
function Card({ title, badge, children }: { title: string; badge: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-zinc-800 bg-zinc-900/80">
        <span className="text-[0.6rem] font-semibold text-zinc-700 font-mono tracking-widest">{badge}</span>
        <h2 className="text-xs font-medium text-zinc-500 tracking-widest uppercase">{title}</h2>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

function InfoRow({
  label, value, dim, mono, ok, accent,
}: {
  label: string; value: string; dim?: boolean; mono?: boolean; ok?: boolean; accent?: boolean;
}) {
  const colorClass =
    ok !== undefined
      ? ok ? "text-emerald-400" : "text-red-400"
      : accent ? "text-blue-400"
      : dim ? "text-zinc-700"
      : "text-zinc-300";
  return (
    <div className="flex justify-between items-center py-2.5 border-b border-zinc-800/60 last:border-0">
      <span className="text-[0.68rem] text-zinc-600 uppercase tracking-widest">{label}</span>
      <span className={`text-sm text-right max-w-xs break-all ${colorClass} ${mono ? "font-mono text-xs" : ""}`}>
        {value}
      </span>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 flex flex-col items-center gap-2 text-center">
      <span className="text-3xl opacity-20">⊘</span>
      <p className="text-xs text-zinc-600">{message}</p>
    </div>
  );
}
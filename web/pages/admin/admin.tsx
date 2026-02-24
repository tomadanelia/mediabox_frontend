import { useState, useEffect } from "react";

/* ───────────────────────────────────────────────
   TYPES
─────────────────────────────────────────────── */
type AdminSection =
  | "Overview"
  | "Users"
  | "Channels"
  | "Categories"
  | "Support"
  | "Settings";

interface User {
  id: string;
  name: string;
  email: string;
  plan: "Free" | "Premium" | "Enterprise";
  status: "Active" | "Suspended" | "Pending";
  joined: string;
  watchTime: string;
}

type Channel = {
  id: string;
  uuid: string;
  name: string;
  logo: string;
  number: number;
  url: string;
  categories: string[];
};

interface Category {
  id: string;
  name: string;
  channels: number;
  color: string;
  visible: boolean;
}

interface SupportTicket {
  id: string;
  user: string;
  email: string;
  subject: string;
  message: string;
  status: "Open" | "In Progress" | "Resolved";
  priority: "Low" | "Medium" | "High";
  date: string;
}

/* ───────────────────────────────────────────────
   MOCK DATA (non-channel sections)
─────────────────────────────────────────────── */
const mockUsers: User[] = [
  { id: "u1", name: "Toma Danelia",      email: "tomadanelia16@gmail.com",    plan: "Premium",    status: "Active",    joined: "Feb 16, 2026", watchTime: "21.3h" },
  { id: "u2", name: "Sandro Muradashvili", email: "sandro.m@example.com",     plan: "Free",       status: "Active",    joined: "Jan 4, 2026",  watchTime: "5.1h"  },
  { id: "u3", name: "Anzor Datunashvili", email: "anzor.d@example.com",       plan: "Enterprise", status: "Active",    joined: "Dec 1, 2025",  watchTime: "88.7h" },
  { id: "u4", name: "Mike Johnson",      email: "mikej@example.com",          plan: "Premium",    status: "Suspended", joined: "Nov 20, 2025", watchTime: "12.0h" },
  { id: "u5", name: "Priya Sharma",      email: "priya.s@example.com",        plan: "Free",       status: "Pending",   joined: "Feb 20, 2026", watchTime: "0.2h"  },
];

const mockCategories: Category[] = [
  { id: "cat1", name: "News",        channels: 4, color: "#3b82f6", visible: true  },
  { id: "cat2", name: "Sports",      channels: 6, color: "#f97316", visible: true  },
  { id: "cat3", name: "Documentary", channels: 5, color: "#10b981", visible: true  },
  { id: "cat4", name: "Drama",       channels: 8, color: "#a78bfa", visible: true  },
  { id: "cat5", name: "Kids",        channels: 3, color: "#f43f5e", visible: true  },
  { id: "cat6", name: "Music",       channels: 5, color: "#fbbf24", visible: false },
  { id: "cat7", name: "Comedy",      channels: 2, color: "#06b6d4", visible: true  },
];

const mockTickets: SupportTicket[] = [
  { id: "t1", user: "Sandro Muradashvili", email: "sandro.m@example.com",  subject: "Can't play any channels",           message: "Every channel shows a loading spinner and never starts. I've tried on Chrome and Firefox. My subscription is active. Please help asap.",          priority: "High",   status: "Open",        date: "Feb 22, 2026" },
  { id: "t2", user: "Priya Sharma",        email: "priya.s@example.com",   subject: "Wrong charge on my account",        message: "I was charged $14.99 twice this month. I only have one account. Please refund the duplicate charge.",                                           priority: "High",   status: "In Progress", date: "Feb 21, 2026" },
  { id: "t3", user: "Anzor Datunashvili",  email: "anzor.d@example.com",   subject: "Missing channel — BBC World",       message: "I used to watch BBC World on this platform but it disappeared about 2 weeks ago. Is it coming back?",                                           priority: "Medium", status: "Open",        date: "Feb 20, 2026" },
  { id: "t4", user: "Toma Danelia",        email: "tomadanelia16@gmail.com",subject: "Request: offline download feature", message: "Would love the ability to download episodes for offline viewing during flights. This is available on Netflix. Please consider adding it.",   priority: "Low",    status: "Resolved",    date: "Feb 18, 2026" },
  { id: "t5", user: "Mike Johnson",        email: "mikej@example.com",     subject: "Account suspended unfairly",         message: "My account was suspended but I haven't violated any terms. I was in the middle of watching a show. Please review my account immediately.",   priority: "High",   status: "Open",        date: "Feb 17, 2026" },
];

/* ───────────────────────────────────────────────
   HELPERS
─────────────────────────────────────────────── */
const openTickets = mockTickets.filter((t) => t.status === "Open").length;

const NAV: { section: AdminSection; icon: string; badge?: number }[] = [
  { section: "Overview",   icon: "▦" },
  { section: "Users",      icon: "◉", badge: mockUsers.length },
  { section: "Channels",   icon: "▶" },
  { section: "Categories", icon: "⊞" },
  { section: "Support",    icon: "✉", badge: openTickets },
  { section: "Settings",   icon: "⚙" },
];

const CATEGORY_COLORS = [
  "#3b82f6","#f97316","#10b981","#a78bfa",
  "#f43f5e","#fbbf24","#06b6d4","#ec4899",
];

/* ───────────────────────────────────────────────
   MAIN COMPONENT
─────────────────────────────────────────────── */
export default function AdminDashboard() {
  const [section, setSection] = useState<AdminSection>("Overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ── Channel state ── */
  const [channels, setChannels]           = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelsError, setChannelsError]     = useState<string | null>(null);
  const [channelSearch, setChannelSearch]     = useState("");
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);

  /* Category assignment modal */
  const [assignModal, setAssignModal]         = useState(false);
  const [assignTarget, setAssignTarget]       = useState<Channel | null>(null);
  const [assignCategoryId, setAssignCategoryId] = useState("");
  const [assignLoading, setAssignLoading]     = useState(false);
  const [assignError, setAssignError]         = useState<string | null>(null);
  const [assignSuccess, setAssignSuccess]     = useState(false);

  /* ── Users state ── */
  const [users, setUsers]         = useState(mockUsers);
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  /* ── Categories state ── */
  const [categories, setCategories]       = useState(mockCategories);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCatName, setNewCatName]           = useState("");
  const [editingCat, setEditingCat]           = useState<string | null>(null);

  /* ── Support state ── */
  const [tickets, setTickets]             = useState(mockTickets);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText]           = useState("");
  const [ticketFilter, setTicketFilter]     = useState<"All" | SupportTicket["status"]>("All");

  /* ── Fetch channels ── */
  const fetchChannels = async () => {
    setChannelsLoading(true);
    setChannelsError(null);
    try {
      const response = await fetch("http://159.89.20.100/api/channels");
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      // Normalize: ensure categories is always an array regardless of API shape
      const normalized = (Array.isArray(result) ? result : result.data ?? []).map(
        (ch: any) => ({ ...ch, categories: Array.isArray(ch.categories) ? ch.categories : [] })
      );
      setChannels(normalized);
    } catch (err: any) {
      setChannelsError(err.message);
    } finally {
      setChannelsLoading(false);
    }
  };

  useEffect(() => {
    if (section === "Channels" || section === "Overview") {
      fetchChannels();
    }
  }, [section]);

  /* ── Assign channel to category ── */
  const openAssignModal = (channel: Channel) => {
    setAssignTarget(channel);
    setAssignCategoryId(categories[0]?.id ?? "");
    setAssignError(null);
    setAssignSuccess(false);
    setAssignModal(true);
  };

  const submitAssign = async () => {
    if (!assignTarget || !assignCategoryId) return;
    setAssignLoading(true);
    setAssignError(null);
    setAssignSuccess(false);
    try {
      const response = await fetch(
        `http://159.89.20.100/api/channels/${assignTarget.id}/categories/${assignCategoryId}`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error(`Failed: ${response.status}`);
      // Optimistically update local channel categories
      setChannels((prev) =>
        prev.map((c) =>
          c.id === assignTarget.id
            ? { ...c, categories: [...new Set([...(c.categories ?? []), assignCategoryId])] }
            : c
        )
      );
      setAssignSuccess(true);
      setTimeout(() => setAssignModal(false), 1200);
    } catch (err: any) {
      setAssignError(err.message);
    } finally {
      setAssignLoading(false);
    }
  };

  /* ── Filtered data ── */
  const filteredChannels = channels.filter((c) =>
    c.name.toLowerCase().includes(channelSearch.toLowerCase())
  );

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredTickets =
    ticketFilter === "All" ? tickets : tickets.filter((t) => t.status === ticketFilter);

  /* ── Other handlers ── */
  const toggleUserStatus = (id: string) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.id === id ? { ...u, status: u.status === "Active" ? "Suspended" : "Active" } : u
      )
    );
    if (selectedUser?.id === id)
      setSelectedUser((prev) =>
        prev ? { ...prev, status: prev.status === "Active" ? "Suspended" : "Active" } : prev
      );
  };

  const toggleCategoryVisibility = (id: string) =>
    setCategories((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c))
    );

  const deleteCategory = (id: string) =>
    setCategories((prev) => prev.filter((c) => c.id !== id));

  const addCategory = () => {
    if (!newCatName.trim()) return;
    setCategories((prev) => [
      ...prev,
      {
        id: `cat${Date.now()}`,
        name: newCatName,
        channels: 0,
        color: CATEGORY_COLORS[prev.length % CATEGORY_COLORS.length],
        visible: true,
      },
    ]);
    setNewCatName("");
    setShowAddCategory(false);
  };

  const resolveTicket = (id: string) => {
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: "Resolved" } : t))
    );
    if (selectedTicket?.id === id)
      setSelectedTicket((prev) => (prev ? { ...prev, status: "Resolved" } : prev));
  };

  const sendReply = () => {
    if (!replyText.trim() || !selectedTicket) return;
    resolveTicket(selectedTicket.id);
    setReplyText("");
  };

  /* ── Category name lookup ── */
  const getCategoryName = (id: string) =>
    categories.find((c) => c.id === id)?.name ?? id;

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300 text-sm font-sans overflow-hidden">

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`
        fixed top-0 left-0 h-full z-30 w-56 flex flex-col
        bg-zinc-900 border-r border-zinc-800 transition-transform duration-300
        lg:static lg:sticky lg:top-0 lg:flex-shrink-0 lg:translate-x-0
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
      `}>
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-zinc-800">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center text-white text-xs font-bold">A</div>
          <div>
            <p className="text-xs font-semibold text-zinc-100 leading-none">StreamAdmin</p>
            <p className="text-[0.6rem] text-zinc-600 mt-0.5">Control Panel</p>
          </div>
        </div>

        <nav className="flex-1 p-3 flex flex-col gap-0.5">
          {NAV.map(({ section: s, icon, badge }) => (
            <button
              key={s}
              onClick={() => { setSection(s); setSidebarOpen(false); }}
              className={`
                flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left w-full
                ${section === s
                  ? "bg-violet-500/15 text-violet-300 font-medium"
                  : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"}
              `}
            >
              <span className="flex items-center gap-2.5">
                <span className="text-base opacity-70">{icon}</span>
                {s}
              </span>
              {badge !== undefined && (
                <span className={`text-[0.6rem] font-bold px-1.5 py-0.5 rounded-full ${
                  section === s ? "bg-violet-500/30 text-violet-300" : "bg-zinc-800 text-zinc-500"
                }`}>{badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="p-3 border-t border-zinc-800">
          <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-zinc-800/60">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-zinc-600 to-zinc-500 flex items-center justify-center text-xs font-bold text-zinc-200">SA</div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-zinc-300 truncate">Super Admin</p>
              <p className="text-[0.6rem] text-zinc-600 truncate">admin@stream.io</p>
            </div>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="flex items-center justify-between px-5 py-3 border-b border-zinc-800 bg-zinc-950 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-zinc-500 hover:text-zinc-200 text-lg" onClick={() => setSidebarOpen(true)}>☰</button>
            <div>
              <h2 className="text-sm font-semibold text-zinc-100">{section}</h2>
              <p className="text-[0.65rem] text-zinc-600 hidden sm:block">
                {section === "Overview"   && "Platform at a glance"}
                {section === "Users"      && `${users.length} total users`}
                {section === "Channels"   && (channelsLoading ? "Loading…" : `${channels.length} channels`)}
                {section === "Categories" && `${categories.length} categories`}
                {section === "Support"    && `${openTickets} open tickets`}
                {section === "Settings"   && "Platform configuration"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <span className="w-2 h-2 rounded-full bg-rose-400 absolute -top-0.5 -right-0.5 border border-zinc-950" />
              <button className="w-8 h-8 rounded-xl bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-zinc-400 text-sm transition-colors">🔔</button>
            </div>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-6 overflow-x-hidden space-y-5">

          {/* ────────── OVERVIEW ────────── */}
          {section === "Overview" && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <KpiCard label="Total Users"   value={users.length.toString()}    sub="+3 this week"                         color="violet"  icon="◉" />
                <KpiCard label="Channels"      value={channelsLoading ? "…" : channels.length.toString()} sub="registered"  color="emerald" icon="▶" />
                <KpiCard label="Categories"    value={categories.length.toString()} sub={`${categories.filter(c=>c.visible).length} visible`} color="sky" icon="⊞" />
                <KpiCard label="Open Tickets"  value={openTickets.toString()}      sub="need response"                        color="rose"    icon="✉" />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                <Panel title="Recent Users" action={{ label: "View all", onClick: () => setSection("Users") }}>
                  {users.slice(0, 4).map((u) => (
                    <div key={u.id} className="flex items-center gap-3 py-2.5 border-b border-zinc-800/50 last:border-0">
                      <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-300 flex-shrink-0">
                        {u.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-zinc-200 truncate">{u.name}</p>
                        <p className="text-xs text-zinc-600 truncate">{u.email}</p>
                      </div>
                      <StatusBadge status={u.status} />
                    </div>
                  ))}
                </Panel>

                <Panel title="Open Support Tickets" action={{ label: "View all", onClick: () => setSection("Support") }}>
                  <div className="grid grid-cols-1 gap-2">
                    {tickets.filter(t => t.status === "Open").slice(0, 3).map((t) => (
                      <div key={t.id}
                        className="p-3 rounded-xl bg-zinc-800/40 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition-colors"
                        onClick={() => { setSelectedTicket(t); setSection("Support"); }}>
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-xs font-medium text-zinc-200 leading-snug">{t.subject}</p>
                          <PriorityBadge priority={t.priority} />
                        </div>
                        <p className="text-[0.68rem] text-zinc-600">{t.user} · {t.date}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* ────────── CHANNELS ────────── */}
          {section === "Channels" && (
            <div className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center gap-3 flex-wrap">
                <input
                  type="text"
                  placeholder="Search channels…"
                  value={channelSearch}
                  onChange={(e) => setChannelSearch(e.target.value)}
                  className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                />
                <button
                  onClick={fetchChannels}
                  disabled={channelsLoading}
                  className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm hover:text-zinc-200 hover:border-zinc-600 transition-colors disabled:opacity-40"
                >
                  {channelsLoading ? (
                    <span className="w-3.5 h-3.5 border-2 border-zinc-600 border-t-zinc-300 rounded-full animate-spin" />
                  ) : "↻"} Refresh
                </button>
              </div>

              {/* Error state */}
              {channelsError && (
                <div className="p-4 rounded-xl bg-rose-500/8 border border-rose-500/20 text-rose-400 text-sm flex items-center gap-2">
                  <span>⚠</span> {channelsError}
                  <button onClick={fetchChannels} className="ml-auto text-xs underline hover:no-underline">Retry</button>
                </div>
              )}

              {/* Loading skeleton */}
              {channelsLoading && !channelsError && (
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                  <div className="px-5 py-3.5 border-b border-zinc-800">
                    <div className="h-3 w-24 bg-zinc-800 rounded animate-pulse" />
                  </div>
                  <div className="px-5 py-3 space-y-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-4 animate-pulse">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800" />
                        <div className="flex-1 space-y-1.5">
                          <div className="h-3 bg-zinc-800 rounded w-36" />
                          <div className="h-2.5 bg-zinc-800/60 rounded w-20" />
                        </div>
                        <div className="h-5 w-16 bg-zinc-800 rounded-md" />
                        <div className="h-7 w-24 bg-zinc-800 rounded-lg" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Channels table */}
              {!channelsLoading && !channelsError && (
                <Panel title={`${filteredChannels.length} channels`}>
                  <div className="overflow-auto max-h-[calc(100vh-220px)]">
                    <table className="w-full min-w-[600px]">
                      <thead className="sticky top-0 z-10 bg-zinc-900">
                        <tr className="border-b border-zinc-800">
                          {["#", "Channel", "Categories", "URL", "Assign Category"].map((h) => (
                            <th key={h} className="pb-3 pt-1 text-left text-[0.6rem] font-semibold text-zinc-700 uppercase tracking-widest pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredChannels.map((c) => (
                          <tr
                            key={c.id}
                            className={`border-b border-zinc-800/40 hover:bg-zinc-800/25 transition-colors cursor-pointer ${selectedChannel?.id === c.id ? "bg-violet-500/5" : ""}`}
                            onClick={() => setSelectedChannel(c)}
                          >
                            {/* Channel number */}
                            <td className="py-3 pr-4 font-mono text-xs text-zinc-600 w-8">{c.number}</td>

                            {/* Name + logo */}
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2.5">
                                {c.logo ? (
                                  <img
                                    src={c.logo}
                                    alt={c.name}
                                    className="w-8 h-8 rounded-lg object-contain bg-zinc-800 border border-zinc-700 p-0.5 flex-shrink-0"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                ) : (
                                  <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-xs text-zinc-500 flex-shrink-0">▶</div>
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-zinc-200 truncate max-w-[140px]">{c.name}</p>
                                  <p className="text-[0.62rem] text-zinc-700 font-mono truncate max-w-[140px]">{c.uuid}</p>
                                </div>
                              </div>
                            </td>

                            {/* Categories */}
                            <td className="py-3 pr-4">
                              <div className="flex flex-wrap gap-1 max-w-[160px]">
                                {(c.categories ?? []).length > 0 ? (
                                  (c.categories ?? []).slice(0, 3).map((catId) => (
                                    <span
                                      key={catId}
                                      className="px-1.5 py-0.5 rounded-md text-[0.6rem] font-medium bg-zinc-800 border border-zinc-700 text-zinc-400"
                                    >
                                      {getCategoryName(catId)}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[0.65rem] text-zinc-700 italic">No category</span>
                                )}
                                {(c.categories ?? []).length > 3 && (
                                  <span className="text-[0.6rem] text-zinc-600">+{c.categories.length - 3}</span>
                                )}
                              </div>
                            </td>

                            {/* URL */}
                            <td className="py-3 pr-4">
                              <span className="text-[0.65rem] text-zinc-600 font-mono truncate block max-w-[120px]" title={c.url}>
                                {c.url ? c.url.replace(/^https?:\/\//, "").slice(0, 28) + (c.url.length > 28 ? "…" : "") : "—"}
                              </span>
                            </td>

                            {/* Assign button */}
                            <td className="py-3" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => openAssignModal(c)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-medium hover:bg-violet-500/20 hover:border-violet-500/40 transition-colors"
                              >
                                + Category
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>

                    {filteredChannels.length === 0 && !channelsLoading && (
                      <div className="py-12 text-center">
                        <p className="text-2xl mb-2 opacity-20">▶</p>
                        <p className="text-sm text-zinc-600">No channels found</p>
                      </div>
                    )}
                  </div>
                </Panel>
              )}
            </div>
          )}

          {/* ────────── USERS ────────── */}
          {section === "Users" && (
            <div className="flex gap-4">
              <div className="flex-1 min-w-0 space-y-3">
                <div className="flex items-center gap-3 flex-wrap">
                  <input
                    type="text"
                    placeholder="Search users…"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    className="flex-1 min-w-0 bg-zinc-900 border border-zinc-800 rounded-xl px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500/50 transition-colors"
                  />
                  <div className="flex gap-2 flex-shrink-0">
                    {[
                      { label: "Active",    count: users.filter(u => u.status === "Active").length,    color: "text-emerald-400" },
                      { label: "Suspended", count: users.filter(u => u.status === "Suspended").length, color: "text-rose-400"    },
                      { label: "Pending",   count: users.filter(u => u.status === "Pending").length,   color: "text-amber-400"   },
                    ].map(({ label, count, color }) => (
                      <div key={label} className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs">
                        <span className={`font-semibold ${color}`}>{count}</span>
                        <span className="text-zinc-600 ml-1">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Panel title="">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[560px]">
                      <thead>
                        <tr className="border-b border-zinc-800">
                          {["User", "Plan", "Status", "Watch Time", "Joined", "Action"].map(h => (
                            <th key={h} className="pb-3 text-left text-[0.6rem] font-semibold text-zinc-700 uppercase tracking-widest pr-4">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr
                            key={u.id}
                            className={`border-b border-zinc-800/40 hover:bg-zinc-800/30 cursor-pointer transition-colors ${selectedUser?.id === u.id ? "bg-violet-500/5" : ""}`}
                            onClick={() => setSelectedUser(u)}
                          >
                            <td className="py-3 pr-4">
                              <div className="flex items-center gap-2.5">
                                <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center text-[0.65rem] font-semibold text-zinc-300 flex-shrink-0">
                                  {u.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-medium text-zinc-200 truncate">{u.name}</p>
                                  <p className="text-[0.65rem] text-zinc-600 truncate">{u.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 pr-4"><PlanBadge plan={u.plan} /></td>
                            <td className="py-3 pr-4"><StatusBadge status={u.status} /></td>
                            <td className="py-3 pr-4 font-mono text-xs text-zinc-400">{u.watchTime}</td>
                            <td className="py-3 pr-4 text-xs text-zinc-600">{u.joined}</td>
                            <td className="py-3">
                              <button
                                onClick={(e) => { e.stopPropagation(); toggleUserStatus(u.id); }}
                                className={`text-[0.65rem] font-medium px-2.5 py-1 rounded-lg border transition-colors ${
                                  u.status === "Active"
                                    ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                                    : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                                }`}
                              >
                                {u.status === "Active" ? "Suspend" : "Restore"}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Panel>
              </div>

              {selectedUser && (
                <div className="w-64 flex-shrink-0">
                  <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                      <span className="text-[0.65rem] font-semibold text-zinc-600 uppercase tracking-widest">User Detail</span>
                      <button onClick={() => setSelectedUser(null)} className="text-zinc-600 hover:text-zinc-300 transition-colors">✕</button>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex flex-col items-center gap-2 py-2">
                        <div className="w-14 h-14 rounded-2xl bg-zinc-800 flex items-center justify-center text-lg font-semibold text-zinc-300">
                          {selectedUser.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <p className="text-sm font-semibold text-zinc-200">{selectedUser.name}</p>
                        <StatusBadge status={selectedUser.status} />
                      </div>
                      {[
                        { label: "Email",      value: selectedUser.email      },
                        { label: "Plan",       value: selectedUser.plan       },
                        { label: "Watch time", value: selectedUser.watchTime  },
                        { label: "Joined",     value: selectedUser.joined     },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex justify-between items-center py-1.5 border-b border-zinc-800/60 last:border-0">
                          <span className="text-[0.65rem] text-zinc-600 uppercase tracking-widest">{label}</span>
                          <span className="text-xs text-zinc-300 text-right max-w-[60%] break-all">{value}</span>
                        </div>
                      ))}
                      <button
                        onClick={() => toggleUserStatus(selectedUser.id)}
                        className={`w-full mt-1 py-2 rounded-xl text-xs font-medium border transition-colors ${
                          selectedUser.status === "Active"
                            ? "border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
                            : "border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                        }`}
                      >
                        {selectedUser.status === "Active" ? "Suspend Account" : "Restore Account"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────── CATEGORIES ────────── */}
          {section === "Categories" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-zinc-600">{categories.length} categories · {categories.filter(c => c.visible).length} visible</p>
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-500/25 transition-colors"
                >
                  + Add Category
                </button>
              </div>

              {showAddCategory && (
                <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                  <div className="flex items-center gap-2 px-5 py-3.5 border-b border-zinc-800">
                    <span className="text-[0.6rem] font-semibold text-zinc-700 font-mono tracking-widest">NEW</span>
                    <h2 className="text-xs font-medium text-zinc-500 tracking-widest uppercase">New Category</h2>
                  </div>
                  <div className="px-5 py-4 flex items-center gap-3">
                    <input
                      autoFocus
                      placeholder="Category name…"
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && addCategory()}
                      className="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500/40 transition-colors"
                    />
                    <button
                      onClick={addCategory}
                      className="px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/25 text-violet-400 text-xs font-medium hover:bg-violet-500/20 hover:border-violet-500/40 transition-colors flex-shrink-0"
                    >
                      Add
                    </button>
                    <button
                      onClick={() => { setShowAddCategory(false); setNewCatName(""); }}
                      className="px-4 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-500 text-xs hover:text-zinc-300 hover:border-zinc-600 transition-colors flex-shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {categories.map((cat) => (
                  <div key={cat.id} className={`p-4 rounded-2xl border transition-all ${cat.visible ? "bg-zinc-900 border-zinc-800 hover:border-zinc-700" : "bg-zinc-900/40 border-zinc-800/40 opacity-50"}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: cat.color }} />
                        {editingCat === cat.id ? (
                          <input
                            autoFocus
                            defaultValue={cat.name}
                            onBlur={(e) => {
                              setCategories(prev => prev.map(c => c.id === cat.id ? { ...c, name: e.target.value || c.name } : c));
                              setEditingCat(null);
                            }}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            className="bg-zinc-800 border border-violet-500/40 rounded-lg px-2 py-0.5 text-sm text-zinc-200 focus:outline-none w-28"
                          />
                        ) : (
                          <span className="text-sm font-medium text-zinc-200">{cat.name}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button onClick={() => setEditingCat(cat.id)} className="w-6 h-6 rounded-lg hover:bg-zinc-700 flex items-center justify-center text-zinc-600 hover:text-zinc-300 text-xs transition-colors">✎</button>
                        <button onClick={() => deleteCategory(cat.id)} className="w-6 h-6 rounded-lg hover:bg-rose-500/10 flex items-center justify-center text-zinc-700 hover:text-rose-400 text-xs transition-colors">✕</button>
                      </div>
                    </div>
                    <p className="text-xs text-zinc-600 mb-3">{cat.channels} channels</p>
                    <button
                      onClick={() => toggleCategoryVisibility(cat.id)}
                      className={`w-full py-1.5 rounded-xl text-[0.68rem] font-medium border transition-colors ${cat.visible ? "border-zinc-700 text-zinc-500 hover:text-zinc-300 hover:border-zinc-600" : "border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/10"}`}
                    >
                      {cat.visible ? "Hide from users" : "Make visible"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ────────── SUPPORT ────────── */}
          {section === "Support" && (
            <div className="flex gap-4">
              <div className="w-72 flex-shrink-0 space-y-3">
                <div className="flex gap-1 p-1 bg-zinc-900 border border-zinc-800 rounded-xl">
                  {(["All", "Open", "In Progress", "Resolved"] as const).map((f) => (
                    <button
                      key={f}
                      onClick={() => setTicketFilter(f)}
                      className={`flex-1 py-1.5 rounded-lg text-[0.63rem] font-medium transition-all ${ticketFilter === f ? "bg-zinc-800 text-zinc-200" : "text-zinc-600 hover:text-zinc-400"}`}
                    >
                      {f === "All" ? `All (${tickets.length})` : f}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {filteredTickets.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setSelectedTicket(t)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all ${selectedTicket?.id === t.id ? "border-violet-500/40 bg-violet-500/5" : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"}`}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1.5">
                        <p className="text-xs font-medium text-zinc-200 leading-snug line-clamp-2">{t.subject}</p>
                        <PriorityBadge priority={t.priority} />
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="text-[0.63rem] text-zinc-600">{t.user}</p>
                        <TicketStatusBadge status={t.status} />
                      </div>
                      <p className="text-[0.6rem] text-zinc-700 mt-1">{t.date}</p>
                    </div>
                  ))}
                </div>
              </div>

              {selectedTicket ? (
                <div className="flex-1 min-w-0">
                  <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
                    <div className="px-5 py-4 border-b border-zinc-800 flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-100 mb-1">{selectedTicket.subject}</h3>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-zinc-500">{selectedTicket.user}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-xs text-zinc-500">{selectedTicket.email}</span>
                          <span className="text-zinc-700">·</span>
                          <span className="text-xs text-zinc-600">{selectedTicket.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <PriorityBadge priority={selectedTicket.priority} />
                        <TicketStatusBadge status={selectedTicket.status} />
                      </div>
                    </div>
                    <div className="px-5 py-4 border-b border-zinc-800">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-xl bg-zinc-800 flex items-center justify-center text-xs font-semibold text-zinc-400 flex-shrink-0">
                          {selectedTicket.user.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-medium text-zinc-400 mb-2">{selectedTicket.user} <span className="text-zinc-700 font-normal">wrote:</span></p>
                          <p className="text-sm text-zinc-300 leading-relaxed bg-zinc-800/40 rounded-xl p-3.5 border border-zinc-800">{selectedTicket.message}</p>
                        </div>
                      </div>
                    </div>
                    {selectedTicket.status !== "Resolved" ? (
                      <div className="px-5 py-4">
                        <p className="text-xs font-medium text-zinc-500 mb-2.5 uppercase tracking-widest">Reply</p>
                        <textarea
                          rows={4}
                          placeholder="Write your response…"
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3.5 py-3 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-violet-500/40 resize-none transition-colors"
                        />
                        <div className="flex items-center gap-2 mt-3">
                          <button onClick={sendReply} className="px-5 py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-500/25 transition-colors">Send & Resolve</button>
                          <button onClick={() => resolveTicket(selectedTicket.id)} className="px-5 py-2 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm hover:text-zinc-200 transition-colors">Mark Resolved</button>
                        </div>
                      </div>
                    ) : (
                      <div className="px-5 py-4 flex items-center gap-2 text-emerald-400">
                        <span>✓</span>
                        <span className="text-sm">This ticket has been resolved.</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center space-y-2">
                    <p className="text-3xl opacity-20">✉</p>
                    <p className="text-sm text-zinc-600">Select a ticket to view</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ────────── SETTINGS ────────── */}
          {section === "Settings" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 max-w-3xl">
              <Panel title="Platform Settings" action={undefined}>
                {[
                  { label: "Platform name",       defaultValue: "StreamApp"        },
                  { label: "Support email",        defaultValue: "support@stream.io"},
                  { label: "Max streams per user", defaultValue: "3"               },
                ].map(({ label, defaultValue }) => (
                  <div key={label} className="py-3 border-b border-zinc-800 last:border-0">
                    <label className="block text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-1.5">{label}</label>
                    <input defaultValue={defaultValue} className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-violet-500/40 transition-colors" />
                  </div>
                ))}
                <button className="mt-3 w-full py-2 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-500/25 transition-colors">Save Changes</button>
              </Panel>

              <Panel title="Feature Flags" action={undefined}>
                {[
                  { label: "Allow free signups",     defaultOn: true  },
                  { label: "Email notifications",    defaultOn: true  },
                  { label: "Multi-device streaming", defaultOn: true  },
                  { label: "Offline downloads",      defaultOn: false },
                  { label: "4K streaming",           defaultOn: true  },
                ].map(({ label, defaultOn }) => {
                  const [on, setOn] = useState(defaultOn);
                  return (
                    <div key={label} className="flex items-center justify-between py-3 border-b border-zinc-800 last:border-0">
                      <span className="text-sm text-zinc-300">{label}</span>
                      <button
                        onClick={() => setOn(!on)}
                        className={`relative w-10 h-5 rounded-full transition-colors ${on ? "bg-violet-500/50" : "bg-zinc-700"}`}
                      >
                        <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
                      </button>
                    </div>
                  );
                })}
              </Panel>
            </div>
          )}

        </main>
      </div>

      {/* ────────── ASSIGN CATEGORY MODAL ────────── */}
      {assignModal && assignTarget && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden shadow-2xl shadow-black/60">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">Assign Category</h3>
                <p className="text-xs text-zinc-600 mt-0.5 truncate max-w-[240px]">{assignTarget.name}</p>
              </div>
              <button onClick={() => setAssignModal(false)} className="text-zinc-600 hover:text-zinc-300 transition-colors text-base">✕</button>
            </div>

            {/* Body */}
            <div className="px-5 py-4 space-y-4">
              {/* Channel info */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-800/40 border border-zinc-800">
                {assignTarget.logo ? (
                  <img src={assignTarget.logo} alt={assignTarget.name} className="w-9 h-9 rounded-lg object-contain bg-zinc-800 border border-zinc-700 p-0.5 flex-shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-500 flex-shrink-0">▶</div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-200 truncate">{assignTarget.name}</p>
                  <p className="text-[0.62rem] text-zinc-600 font-mono">ID: {assignTarget.id}</p>
                </div>
              </div>

              {/* Category select */}
              <div>
                <label className="block text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-2">Select Category</label>
                <div className="grid grid-cols-2 gap-2">
                  {categories.map((cat) => {
                    const isActive = assignCategoryId === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setAssignCategoryId(cat.id)}
                        className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-left transition-all ${
                          isActive
                            ? "border-violet-500/40 bg-violet-500/10 text-zinc-100"
                            : "border-zinc-800 bg-zinc-800/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full flex-shrink-0 transition-all ${isActive ? "scale-125" : ""}`}
                          style={{ background: cat.color }}
                        />
                        <span className="text-xs font-medium truncate">{cat.name}</span>
                        {isActive && (
                          <span className="ml-auto text-violet-400 text-xs flex-shrink-0">✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current categories */}
              {(assignTarget.categories ?? []).length > 0 && (
                <div>
                  <p className="text-[0.65rem] text-zinc-600 uppercase tracking-widest mb-1.5">Current categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(assignTarget.categories ?? []).map((catId) => (
                      <span key={catId} className="px-2 py-0.5 rounded-md text-[0.65rem] bg-zinc-800 border border-zinc-700 text-zinc-400">
                        {getCategoryName(catId)}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Error */}
              {assignError && (
                <p className="text-xs text-rose-400 bg-rose-500/8 border border-rose-500/20 rounded-xl px-3 py-2">⚠ {assignError}</p>
              )}

              {/* Success */}
              {assignSuccess && (
                <p className="text-xs text-emerald-400 bg-emerald-500/8 border border-emerald-500/20 rounded-xl px-3 py-2">✓ Category assigned successfully</p>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center gap-2 px-5 pb-5">
              <button
                onClick={submitAssign}
                disabled={assignLoading || assignSuccess || !assignCategoryId}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-violet-500/15 border border-violet-500/30 text-violet-300 text-sm font-medium hover:bg-violet-500/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {assignLoading && <span className="w-3.5 h-3.5 border-2 border-violet-400/40 border-t-violet-300 rounded-full animate-spin" />}
                {assignLoading ? "Assigning…" : "Assign"}
              </button>
              <button
                onClick={() => setAssignModal(false)}
                className="px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-zinc-400 text-sm hover:text-zinc-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

/* ───────────────────────────────────────────────
   REUSABLE UI
─────────────────────────────────────────────── */
function KpiCard({ label, value, sub, color, icon }: {
  label: string; value: string; sub: string;
  color: "violet" | "emerald" | "sky" | "rose"; icon: string;
}) {
  const colors = {
    violet:  { bg: "bg-violet-500/10",  border: "border-violet-500/20", text: "text-violet-400",  icon: "bg-violet-500/20"  },
    emerald: { bg: "bg-emerald-500/10", border: "border-emerald-500/20",text: "text-emerald-400", icon: "bg-emerald-500/20" },
    sky:     { bg: "bg-sky-500/10",     border: "border-sky-500/20",    text: "text-sky-400",     icon: "bg-sky-500/20"     },
    rose:    { bg: "bg-rose-500/10",    border: "border-rose-500/20",   text: "text-rose-400",    icon: "bg-rose-500/20"    },
  };
  const c = colors[color];
  return (
    <div className={`rounded-2xl ${c.bg} border ${c.border} p-4 flex items-start gap-3`}>
      <div className={`w-9 h-9 rounded-xl ${c.icon} flex items-center justify-center text-base flex-shrink-0`}>{icon}</div>
      <div>
        <p className={`text-xl font-bold ${c.text}`}>{value}</p>
        <p className="text-xs font-medium text-zinc-300">{label}</p>
        <p className="text-[0.63rem] text-zinc-600 mt-0.5">{sub}</p>
      </div>
    </div>
  );
}

function Panel({ title, action, children }: {
  title: string;
  action?: { label: string; onClick: () => void } | undefined;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl bg-zinc-900 border border-zinc-800 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">{title}</h3>
          {action && (
            <button onClick={action.onClick} className="text-[0.65rem] text-violet-400 hover:text-violet-300 transition-colors font-medium">
              {action.label} →
            </button>
          )}
        </div>
      )}
      <div className="px-5 py-3">{children}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: User["status"] }) {
  const map = {
    Active:    "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
    Suspended: "bg-rose-500/10 border-rose-500/20 text-rose-400",
    Pending:   "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[0.63rem] font-medium border ${map[status]}`}>{status}</span>;
}

function PlanBadge({ plan }: { plan: User["plan"] }) {
  const map = {
    Free:       "bg-zinc-800 border-zinc-700 text-zinc-500",
    Premium:    "bg-violet-500/10 border-violet-500/20 text-violet-400",
    Enterprise: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  };
  return <span className={`inline-flex px-2 py-0.5 rounded-md text-[0.63rem] font-medium border ${map[plan]}`}>{plan}</span>;
}

function PriorityBadge({ priority }: { priority: SupportTicket["priority"] }) {
  const map = {
    Low:    "bg-zinc-800 border-zinc-700 text-zinc-500",
    Medium: "bg-amber-500/10 border-amber-500/20 text-amber-400",
    High:   "bg-rose-500/10 border-rose-500/20 text-rose-400",
  };
  return (
    <span className={`inline-flex px-1.5 py-0.5 rounded text-[0.58rem] font-semibold uppercase tracking-wide border flex-shrink-0 ${map[priority]}`}>
      {priority}
    </span>
  );
}

function TicketStatusBadge({ status }: { status: SupportTicket["status"] }) {
  const map = { Open: "text-rose-400", "In Progress": "text-amber-400", Resolved: "text-emerald-400" };
  return <span className={`text-[0.6rem] font-medium ${map[status]}`}>{status}</span>;
}
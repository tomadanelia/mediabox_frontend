import { useState } from "react";

/* ─── Types ─────────────────────────────────────────────── */
interface WatchEntry {
  id: number;
  channel: string;
  show: string;
  date: string;
  time: string;
  duration: string;
  genre: string;
  accent: string;
}

interface ScreenDay {
  day: string;
  hours: number;
}

interface PaymentRecord {
  date: string;
  amount: string;
  status: string;
}

type Tab = "Overview" | "History" | "Screen Time" | "Billing";

/* ─── Data ───────────────────────────────────────────────── */
const user = {
  id: "f53bdd83-683c-4404-bc92-090381c2820e",
  username: "tom12a",
  email: "tomadanelia16@gmail.com",
  phone: null as string | null,
  full_name: "Toma Danelia",
  avatar_url: null as string | null,
  role: "user",
  email_verified_at: null as string | null,
  phone_verified_at: null as string | null,
  created_at: "2026-02-16 19:42:38",
};

const watchHistory: WatchEntry[] = [
  { id: 1, channel: "HBO Max",       show: "The Last of Us",  date: "Feb 22", time: "21:00", duration: "58m", genre: "Drama",    accent: "#f97316" },
  { id: 2, channel: "Netflix",       show: "Stranger Things", date: "Feb 21", time: "20:30", duration: "45m", genre: "Sci-Fi",   accent: "#e11d48" },
  { id: 3, channel: "Disney+",       show: "Andor",           date: "Feb 21", time: "19:00", duration: "52m", genre: "Sci-Fi",   accent: "#0ea5e9" },
  { id: 4, channel: "Apple TV+",     show: "Severance",       date: "Feb 20", time: "22:00", duration: "48m", genre: "Thriller", accent: "#a8a29e" },
  { id: 5, channel: "HBO Max",       show: "The Wire",        date: "Feb 19", time: "21:00", duration: "55m", genre: "Crime",    accent: "#f97316" },
  { id: 6, channel: "Amazon Prime",  show: "The Boys",        date: "Feb 18", time: "20:00", duration: "62m", genre: "Action",   accent: "#06b6d4" },
];

const screenTime: ScreenDay[] = [
  { day: "Mon", hours: 2.5 },
  { day: "Tue", hours: 1.8 },
  { day: "Wed", hours: 3.2 },
  { day: "Thu", hours: 0.5 },
  { day: "Fri", hours: 4.1 },
  { day: "Sat", hours: 5.3 },
  { day: "Sun", hours: 3.8 },
];

const genres = [
  { label: "Drama",    pct: 42, color: "#f97316" },
  { label: "Sci-Fi",   pct: 28, color: "#0ea5e9" },
  { label: "Thriller", pct: 18, color: "#a78bfa" },
  { label: "Action",   pct: 12, color: "#f43f5e" },
];

const paymentHistory: PaymentRecord[] = [
  { date: "Feb 16, 2026", amount: "$14.99", status: "Paid" },
  { date: "Jan 16, 2026", amount: "$14.99", status: "Paid" },
  { date: "Dec 16, 2025", amount: "$14.99", status: "Paid" },
];

/* ─── Helpers ────────────────────────────────────────────── */
const maxH = Math.max(...screenTime.map((d) => d.hours));
const totalH = screenTime.reduce((a, b) => a + b.hours, 0);
const peakDay = screenTime.reduce((a, b) => (a.hours > b.hours ? a : b)).day;
const memberSince = new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" });
const initials = user.full_name.split(" ").map((n) => n[0]).join("").toUpperCase();

const TABS: Tab[] = ["Overview", "History", "Screen Time", "Billing"];
const TAB_ICONS: Record<Tab, string> = {
  Overview: "⊡",
  History: "▤",
  "Screen Time": "◷",
  Billing: "◈",
};

/* ─── Main Component ─────────────────────────────────────── */
export default function UserProfile() {
  const [tab, setTab] = useState<Tab>("Overview");
  const [hovBar, setHovBar] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-zinc-700 to-zinc-600 border border-zinc-700 flex items-center justify-center text-xl font-semibold text-zinc-200 tracking-wide">
            {initials}
          </div>
          <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-zinc-950" />
        </div>

        {/* Identity */}
        <div className="flex flex-col gap-1">
          <h1 className="text-base font-semibold text-zinc-100">{user.full_name}</h1>
          <span className="text-xs text-zinc-600">@{user.username}</span>
          <span className="mt-1.5 inline-flex w-fit px-2 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[0.63rem] font-semibold text-violet-400 tracking-widest uppercase">
            {user.role}
          </span>
        </div>

        {/* Quick stats */}
        <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
          {[
            { label: "Member since", value: memberSince },
            { label: "Shows watched", value: "38" },
            { label: "This week",     value: `${totalH.toFixed(1)}h` },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-center">
              <span className="text-xs text-zinc-600">{label}</span>
              <span className="text-xs font-semibold text-zinc-300">{value}</span>
            </div>
          ))}
        </div>

        {/* Nav */}
        <nav className="flex flex-col gap-0.5 mt-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => { setTab(t); setSidebarOpen(false); }}
              className={`
                flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-all duration-150 text-left w-full
                ${tab === t
                  ? "bg-violet-500/10 text-violet-400 font-medium"
                  : "text-zinc-600 hover:bg-zinc-800/60 hover:text-zinc-300"}
              `}
            >
              <span className="text-base">{TAB_ICONS[t]}</span>
              {t}
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
              <Card title="Account" badge="01">
                <InfoRow label="Email"          value={user.email} />
                <InfoRow label="Phone"          value={user.phone ?? "—"} dim={!user.phone} />
                <InfoRow label="User ID"        value={user.id.slice(0, 22) + "…"} mono />
                <InfoRow label="Email verified" value={user.email_verified_at ? "✓ Verified" : "✗ Pending"} ok={user.email_verified_at !== null} />
                <InfoRow label="Phone verified" value={user.phone_verified_at ? "✓ Verified" : "✗ Pending"} ok={user.phone_verified_at !== null} />
              </Card>

              <Card title="Recently Watched" badge="02">
                {watchHistory.slice(0, 5).map((w) => (
                  <div key={w.id} className="flex items-center gap-3 py-2.5 border-b border-zinc-800/60 last:border-0">
                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: w.accent }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{w.show}</p>
                      <p className="text-xs text-zinc-600 mt-0.5">{w.channel} · {w.date} · {w.time}</p>
                    </div>
                    <span className="text-xs text-zinc-600 font-mono flex-shrink-0">{w.duration}</span>
                  </div>
                ))}
              </Card>
            </div>
          )}

          {/* ── History ── */}
          {tab === "History" && (
            <Card title="Watch History" badge="03">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[540px]">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {["Show", "Channel", "Date", "Time", "Duration", "Genre"].map((h) => (
                        <th key={h} className="pb-3 text-left text-[0.63rem] font-semibold text-zinc-700 uppercase tracking-widest pr-5 first:pr-4">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {watchHistory.map((w) => (
                      <tr key={w.id} className="border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 pr-5 text-sm font-medium text-zinc-200">{w.show}</td>
                        <td className="py-3 pr-5">
                          <span
                            className="px-2 py-0.5 rounded-md text-[0.68rem] font-medium border"
                            style={{ color: w.accent, borderColor: w.accent + "40", backgroundColor: w.accent + "12" }}
                          >
                            {w.channel}
                          </span>
                        </td>
                        <td className="py-3 pr-5 text-xs text-zinc-500">{w.date}</td>
                        <td className="py-3 pr-5 text-xs text-zinc-500 font-mono">{w.time}</td>
                        <td className="py-3 pr-5 text-xs text-zinc-500 font-mono">{w.duration}</td>
                        <td className="py-3 text-xs text-zinc-500">{w.genre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {/* ── Screen Time ── */}
          {tab === "Screen Time" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card title="Weekly Hours" badge="04">
                {/* Bar chart */}
                <div className="flex items-end gap-1.5 h-32 mb-3">
                  {screenTime.map((d, i) => (
                    <div
                      key={d.day}
                      className="flex-1 flex flex-col items-center gap-1.5 relative cursor-pointer"
                      onMouseEnter={() => setHovBar(i)}
                      onMouseLeave={() => setHovBar(null)}
                    >
                      {hovBar === i && (
                        <div className="absolute -top-7 bg-zinc-800 border border-zinc-700 text-zinc-200 text-[0.65rem] font-mono px-1.5 py-0.5 rounded-lg whitespace-nowrap z-10">
                          {d.hours}h
                        </div>
                      )}
                      <div className="w-full flex-1 bg-zinc-800/50 rounded-lg flex items-end overflow-hidden">
                        <div
                          className="w-full rounded-lg"
                          style={{
                            height: `${(d.hours / maxH) * 100}%`,
                            background: hovBar === i
                              ? "linear-gradient(to top, #7c3aed, #a78bfa)"
                              : "linear-gradient(to top, #4c1d95, #7c3aed)",
                            opacity: hovBar !== null && hovBar !== i ? 0.25 : 1,
                            transition: "opacity 0.2s ease, height 0.5s cubic-bezier(0.34,1.56,0.64,1)",
                          }}
                        />
                      </div>
                      <span className="text-[0.6rem] text-zinc-600 tracking-wide">{d.day}</span>
                    </div>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex border-t border-zinc-800 pt-4">
                  {[
                    { label: "Total",    value: `${totalH.toFixed(1)}h` },
                    { label: "Avg/day",  value: `${(totalH / 7).toFixed(1)}h` },
                    { label: "Peak day", value: peakDay },
                  ].map(({ label, value }, i, arr) => (
                    <div
                      key={label}
                      className={`flex-1 flex flex-col items-center gap-1 ${i < arr.length - 1 ? "border-r border-zinc-800" : ""}`}
                    >
                      <span className="text-base font-semibold text-violet-400">{value}</span>
                      <span className="text-[0.6rem] text-zinc-600 uppercase tracking-widest">{label}</span>
                    </div>
                  ))}
                </div>
              </Card>

              <Card title="Genre Breakdown" badge="05">
                <div className="flex flex-col gap-4 mt-1">
                  {genres.map((g) => (
                    <div key={g.label} className="flex items-center gap-3">
                      <span className="w-14 text-xs text-zinc-400 flex-shrink-0">{g.label}</span>
                      <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${g.pct}%`, background: g.color }}
                        />
                      </div>
                      <span className="w-8 text-right text-[0.68rem] text-zinc-600 font-mono flex-shrink-0">{g.pct}%</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {/* ── Billing ── */}
          {tab === "Billing" && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              <Card title="Current Plan" badge="06">
                <div className="flex justify-between items-center p-4 rounded-xl bg-violet-500/5 border border-violet-500/20 mb-4">
                  <div>
                    <p className="text-sm font-semibold text-violet-400 tracking-wide">Premium</p>
                    <p className="text-xs text-zinc-600 mt-0.5">Monthly subscription</p>
                  </div>
                  <div>
                    <span className="text-2xl font-bold text-zinc-100">$14.99</span>
                    <span className="text-sm text-zinc-600">/mo</span>
                  </div>
                </div>
                <InfoRow label="Next billing"   value="Mar 16, 2026" accent />
                <InfoRow label="Payment method" value="Visa •••• 4242" mono />
                <InfoRow label="Status"         value="Active" ok />
                <InfoRow label="Billing cycle"  value="Monthly" />
              </Card>

              <Card title="Payment History" badge="07">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-zinc-800">
                      {["Date", "Amount", "Status"].map((h) => (
                        <th key={h} className="pb-3 text-left text-[0.63rem] font-semibold text-zinc-700 uppercase tracking-widest pr-5">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {paymentHistory.map((p, i) => (
                      <tr key={i} className="border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors">
                        <td className="py-3 pr-5 text-sm text-zinc-400">{p.date}</td>
                        <td className="py-3 pr-5 text-sm font-medium text-zinc-200">{p.amount}</td>
                        <td className="py-3">
                          <span className="px-2 py-0.5 rounded-md text-[0.68rem] font-medium bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

/* ─── Sub-components ─────────────────────────────────────── */
function Card({
  title,
  badge,
  children,
}: {
  title: string;
  badge: string;
  children: React.ReactNode;
}) {
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
  label,
  value,
  dim,
  mono,
  ok,
  accent,
}: {
  label: string;
  value: string;
  dim?: boolean;
  mono?: boolean;
  ok?: boolean;
  accent?: boolean;
}) {
  const colorClass =
    ok !== undefined
      ? ok
        ? "text-emerald-400"
        : "text-red-400"
      : accent
      ? "text-blue-400"
      : dim
      ? "text-zinc-700"
      : "text-zinc-300";

  return (
    <div className="flex justify-between items-center py-2.5 border-b border-zinc-800/60 last:border-0">
      <span className="text-[0.68rem] text-zinc-600 uppercase tracking-widest">{label}</span>
      <span
        className={`text-sm text-right max-w-xs break-all ${colorClass} ${
          mono ? "font-mono text-xs" : ""
        }`}
      >
        {value}
      </span>
    </div>
  );
}
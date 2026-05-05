import { useState, useRef, useEffect, useCallback } from "react";
import api from "../../src/lib/axios";

/* ── Types ── */
interface UserSearchResult {
  user: {
    id: number | string;
    numeric_id?: number;
    email: string;
    full_name?: string;
    username?: string;
    phone?: string;
    role?: string;
  };
  account: { balance: string; status?: string } | null;
  active_plans: { id?: string; name: string; expires_at: string; days_left: number }[];
  meta: { is_verified: boolean; has_account: boolean; has_plans: boolean };
}

interface Notification {
  id: string | number;
  title: string;
  message: string;
  created_at: string;
  user?: { full_name?: string; username?: string; email?: string };
}

interface PaginatedNotifications {
  data: Notification[];
  total?: number;
  current_page?: number;
  last_page?: number;
}

/* ── Icons ── */
const IconSpinner = () => (
  <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2"/>
    <path d="M7 1a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7l3.5 3.5L12 3"/>
  </svg>
);
const IconGlobe = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 010 20M12 2a15.3 15.3 0 000 20"/>
  </svg>
);
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="4"/>
    <path d="M4 20c0-4 3.582-7 8-7s8 3 8 7"/>
  </svg>
);
const IconBell = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/>
  </svg>
);
const IconSearch = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <circle cx="6" cy="6" r="4.5"/><path d="M10 10l2.5 2.5"/>
  </svg>
);
const IconSend = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2L2 6.5l5 2 2 5L14 2z"/>
    <path d="M7 8.5l3-3"/>
  </svg>
);
const IconClear = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
    <path d="M1 1l10 10M11 1L1 11"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"/>
  </svg>
);
const IconHistory = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v5h5"/>
    <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>
    <path d="M12 7v5l4 2"/>
  </svg>
);
const IconChevron = ({ down }: { down?: boolean }) => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: down ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }}>
    <path d="M2 4l4 4 4-4"/>
  </svg>
);

/* ── Confirm modal ── */
function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
  danger = false,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${danger ? "bg-red-500/10 border border-red-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
            {danger ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 4h12M5 4V2.5a.5.5 0 01.5-.5h5a.5.5 0 01.5.5V4M6 7v5M10 7v5M3 4l1 9a1 1 0 001 1h6a1 1 0 001-1l1-9"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01"/>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            )}
          </div>
          <div>
            <p className="text-zinc-100 font-semibold text-sm">{title}</p>
            <p className="text-zinc-500 text-xs leading-relaxed mt-1.5">{message}</p>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onCancel} className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">
            გაუქმება
          </button>
          <button
            onClick={onConfirm}
            className={`cursor-pointer flex-1 py-2.5 rounded-xl text-sm text-white font-medium transition-colors ${danger ? "bg-red-600 hover:bg-red-500" : "bg-amber-600 hover:bg-amber-500"}`}
          >
            {danger ? "წაშლა" : "გაგზავნა"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── User search panel ── */
function UserSearchPanel({
  onUserFound,
  selectedUser,
  onClear,
}: {
  onUserFound: (result: UserSearchResult) => void;
  selectedUser: UserSearchResult | null;
  onClear: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setSearchErr(null);
    try {
      const res = await api.get(`/api/admin/users/search?q=${encodeURIComponent(query.trim())}`);
      onUserFound(res.data);
    } catch (e: any) {
      setSearchErr(e.response?.data?.message || "მომხმარებელი ვერ მოიძებნა");
    } finally { setSearching(false); }
  };

  if (selectedUser) {
    const u = selectedUser.user;
    return (
      <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-violet-600 to-violet-800 flex items-center justify-center shrink-0 text-white text-sm font-bold select-none">
          {(u.full_name ?? u.username ?? u.email ?? "?")[0].toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-zinc-100 font-semibold text-sm truncate">
              {u.full_name ?? u.username ?? "—"}
            </p>
            {u.role === "admin" && (
              <span className="text-[0.55rem] bg-violet-500/15 text-violet-300 border border-violet-500/25 px-1.5 py-0.5 rounded-md font-semibold">ადმინი</span>
            )}
            {selectedUser.meta.is_verified
              ? <span className="text-[0.55rem] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded-md">✓ დადასტ.</span>
              : <span className="text-[0.55rem] bg-zinc-800 text-zinc-600 border border-zinc-700 px-1.5 py-0.5 rounded-md">დაუდასტ.</span>
            }
          </div>
          <p className="text-[0.65rem] text-zinc-500 truncate">
            {u.email}
            {u.numeric_id ? <span className="text-zinc-600"> · <span className="text-zinc-400 font-mono">#{u.numeric_id}</span></span> : ""}
            {u.phone ? <span className="text-zinc-600"> · {u.phone}</span> : ""}
          </p>
          <p className="text-[0.58rem] font-mono text-zinc-700 truncate">id: {u.id}</p>
        </div>
        <button
          onClick={onClear}
          className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-300 hover:bg-zinc-700 transition-colors shrink-0"
          title="სხვა მომხმარებელი"
        >
          <IconClear />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="ID / ელ-ფოსტა / მომხ. სახელი / ტელეფონი"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSearch()}
          className="flex-1 bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors placeholder-zinc-600"
        />
        <button
          onClick={doSearch}
          disabled={searching || !query.trim()}
          className="cursor-pointer flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-medium px-4 py-2 rounded-xl transition-colors"
        >
          {searching ? <IconSpinner /> : <IconSearch />}
          ძიება
        </button>
      </div>
      {searchErr && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{searchErr}</p>
      )}
    </div>
  );
}

/* ── Notification row with delete ── */
function NotificationRow({
  notif,
  onDeleted,
  showUser = false,
}: {
  notif: Notification;
  onDeleted: (id: string | number) => void;
  showUser?: boolean;
}) {
  const [deleting, setDeleting] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [removed, setRemoved] = useState(false);

  const doDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/api/admin/notifications/${notif.id}`);
      setRemoved(true);
      setTimeout(() => onDeleted(notif.id), 350);
    } catch {
      setDeleting(false);
    }
  };

  const formattedDate = (() => {
    try {
      return new Date(notif.created_at).toLocaleString("ka-GE", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return notif.created_at; }
  })();

  return (
    <>
      <div
        className={`group flex items-start gap-3 px-4 py-3 border-b border-zinc-800/70 last:border-0 transition-all duration-300 ${removed ? "opacity-0 max-h-0 overflow-hidden py-0" : "opacity-100"}`}
      >
        {/* Icon dot */}
        <div className="w-1.5 h-1.5 rounded-full bg-zinc-600 mt-2 shrink-0" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-xs font-semibold text-zinc-200 leading-snug truncate">{notif.title}</p>
            <span className="text-[0.58rem] text-zinc-600 shrink-0 tabular-nums mt-0.5">{formattedDate}</span>
          </div>
          <p className="text-[0.68rem] text-zinc-500 leading-relaxed mt-0.5 line-clamp-2">{notif.message}</p>
          {showUser && notif.user && (
            <p className="text-[0.58rem] text-zinc-700 mt-1">
              → {notif.user.full_name ?? notif.user.username ?? notif.user.email}
            </p>
          )}
        </div>

        {/* Delete btn */}
        <button
          onClick={() => setConfirm(true)}
          disabled={deleting}
          className="cursor-pointer opacity-0 group-hover:opacity-100 w-7 h-7 flex items-center justify-center rounded-lg text-zinc-700 hover:text-red-400 hover:bg-red-500/10 transition-all shrink-0 disabled:opacity-30"
          title="წაშლა"
        >
          {deleting ? <IconSpinner /> : <IconTrash />}
        </button>
      </div>

      {confirm && (
        <ConfirmModal
          danger
          title="შეტყობინების წაშლა"
          message={`"${notif.title}" — სამუდამოდ წაიშლება. ეს ქმედება შეუქცევადია.`}
          onConfirm={() => { setConfirm(false); doDelete(); }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </>
  );
}

/* ── History panel (collapsible) ── */
function NotificationsHistoryPanel({
  type,
  userId,
  refreshTrigger,
}: {
  type: "global" | "user";
  userId?: string | number | null;
  refreshTrigger: number;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const endpoint =
    type === "global"
      ? `/api/admin/notifications/global`
      : userId
      ? `/api/admin/notifications/user/${userId}`
      : null;

  const fetchData = useCallback(async (p = 1) => {
    if (!endpoint) return;
    setLoading(true); setErr(null);
    try {
      const res = await api.get(`${endpoint}?page=${p}`);
      const payload: PaginatedNotifications = res.data;
      const items = Array.isArray(payload) ? payload : (payload.data ?? []);
      setNotifications(p === 1 ? items : prev => [...prev, ...items]);
      setPage(p);
      setLastPage(payload.last_page ?? 1);
    } catch (e: any) {
      setErr(e.response?.data?.message || "ჩატვირთვა ვერ მოხერხდა");
    } finally { setLoading(false); }
  }, [endpoint]);

  // reload when a new notification is sent or open state changes
  useEffect(() => {
    if (open && endpoint) {
      setNotifications([]);
      fetchData(1);
    }
  }, [open, refreshTrigger, endpoint]);

  const handleDeleted = (id: string | number) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const isEmpty = !loading && notifications.length === 0 && !err;

  if (type === "user" && !userId) return null;

  return (
    <div className="border-t border-zinc-800">
      {/* Toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="cursor-pointer w-full flex items-center gap-2 px-5 py-3 text-left hover:bg-zinc-800/40 transition-colors group"
      >
        <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors"><IconHistory /></span>
        <span className="text-[0.68rem] text-zinc-600 group-hover:text-zinc-400 font-medium transition-colors flex-1">
          {open ? "ისტორიის დამალვა" : "გაგზავნილების ნახვა / წაშლა"}
        </span>
        <span className="text-zinc-700 group-hover:text-zinc-500 transition-colors"><IconChevron down={open} /></span>
      </button>

      {/* Content */}
      {open && (
        <div>
          {loading && notifications.length === 0 && (
            <div className="flex items-center justify-center gap-2 py-6 text-zinc-600 text-xs">
              <IconSpinner /> იტვირთება…
            </div>
          )}

          {err && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl mx-4 mb-3 px-3 py-2">{err}</p>
          )}

          {isEmpty && (
            <p className="text-[0.68rem] text-zinc-700 italic px-5 pb-4">გაგზავნილი შეტყობინებები არ არის</p>
          )}

          {notifications.length > 0 && (
            <div>
              {notifications.map(n => (
                <NotificationRow
                  key={n.id}
                  notif={n}
                  onDeleted={handleDeleted}
                  showUser={type === "global"}
                />
              ))}

              {/* Load more */}
              {page < lastPage && (
                <div className="px-4 py-3">
                  <button
                    onClick={() => fetchData(page + 1)}
                    disabled={loading}
                    className="cursor-pointer w-full py-2 rounded-xl text-xs text-zinc-500 hover:text-zinc-300 bg-zinc-800/50 hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2 disabled:opacity-40"
                  >
                    {loading ? <><IconSpinner />იტვირთება…</> : "მეტის ჩვენება"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   GLOBAL BROADCAST PANEL
══════════════════════════════════════════ */
function GlobalBroadcastPanel() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const titleLeft = 100 - title.length;
  const msgLeft = 500 - message.length;

  const doSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true); setErr(null); setOk(false);
    try {
      await api.post("/api/admin/notifications/global", { title: title.trim(), message: message.trim() });
      setOk(true);
      setTitle(""); setMessage("");
      setRefreshTrigger(t => t + 1);
      setTimeout(() => setOk(false), 4000);
    } catch (e: any) {
      setErr(e.response?.data?.message || "გაგზავნა ვერ მოხერხდა");
    } finally { setSending(false); }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 text-violet-400">
          <IconGlobe />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">გლობალური შეტყობინება</h3>
          <p className="text-[0.65rem] text-zinc-500 mt-0.5">გაუგზავნეთ ყველა მომხმარებელს</p>
        </div>
        <div className="ml-auto">
          <span className="text-[0.55rem] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-md font-medium">🌐 broadcast</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Title */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest">სათაური</label>
            <span className={`text-[0.6rem] tabular-nums ${titleLeft < 15 ? "text-red-400" : "text-zinc-700"}`}>{titleLeft}</span>
          </div>
          <input
            type="text"
            maxLength={100}
            placeholder="მაგ. სისტემური განახლება"
            value={title}
            onChange={e => setTitle(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors placeholder-zinc-600 text-zinc-200"
          />
        </div>

        {/* Message */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest">შეტყობინება</label>
            <span className={`text-[0.6rem] tabular-nums ${msgLeft < 50 ? "text-red-400" : "text-zinc-700"}`}>{msgLeft}</span>
          </div>
          <textarea
            maxLength={500}
            rows={4}
            placeholder="შეიყვანეთ შეტყობინების ტექსტი…"
            value={message}
            onChange={e => setMessage(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors resize-none placeholder-zinc-600 text-zinc-200 leading-relaxed"
          />
        </div>

        {/* Feedback */}
        {ok && (
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
            <IconCheck />
            <span className="text-xs text-emerald-400">გლობალური შეტყობინება გაიგზავნა</span>
          </div>
        )}
        {err && (
          <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{err}</p>
        )}

        {/* Send */}
        <div className="flex items-center justify-between gap-3 pt-1">
          <p className="text-[0.6rem] text-zinc-700 leading-relaxed">
            ეს შეტყობინება მიიღებს <span className="text-zinc-500">ყველა</span> აქტიური მომხმარებელი
          </p>
          <button
            onClick={() => setConfirm(true)}
            disabled={sending || !title.trim() || !message.trim()}
            className="cursor-pointer shrink-0 flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-5 py-2.5 rounded-xl transition-colors"
          >
            {sending ? <><IconSpinner />გაგზავნა…</> : <><IconSend />გაგზავნა</>}
          </button>
        </div>
      </div>

      {/* History / delete */}
      <NotificationsHistoryPanel type="global" refreshTrigger={refreshTrigger} />

      {confirm && (
        <ConfirmModal
          title="გლობალური შეტყობინება"
          message={`"${title}" — გაიგზავნება ყველა მომხმარებელთან. ეს ქმედება შეუქცევადია.`}
          onConfirm={() => { setConfirm(false); doSend(); }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   USER NOTIFICATION PANEL
══════════════════════════════════════════ */
function UserNotificationPanel() {
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const titleLeft = 100 - title.length;
  const msgLeft = 500 - message.length;
  const canSend = selectedUser && title.trim() && message.trim();

  const doSend = async () => {
    if (!selectedUser || !title.trim() || !message.trim()) return;
    setSending(true); setErr(null); setOk(false);
    try {
      await api.post(`/api/admin/notifications/user/${selectedUser.user.id}`, {
        title: title.trim(),
        message: message.trim(),
        event: "account.notification",
      });
      setOk(true);
      setTitle(""); setMessage("");
      setRefreshTrigger(t => t + 1);
      setTimeout(() => setOk(false), 4000);
    } catch (e: any) {
      setErr(e.response?.data?.message || "გაგზავნა ვერ მოხერხდა");
    } finally { setSending(false); }
  };

  const handleClearUser = () => {
    setSelectedUser(null);
    setOk(false);
    setErr(null);
    setRefreshTrigger(0);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
          <IconUser />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">პირადი შეტყობინება</h3>
          <p className="text-[0.65rem] text-zinc-500 mt-0.5">კონკრეტული მომხმარებლისთვის</p>
        </div>
        <div className="ml-auto">
          <span className="text-[0.55rem] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md font-medium">👤 direct</span>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* Step 1 — find user */}
        <div>
          <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">
            {selectedUser ? "✓ მომხმარებელი" : "1 — მომხმარებლის პოვნა"}
          </label>
          <UserSearchPanel
            selectedUser={selectedUser}
            onUserFound={r => setSelectedUser(r)}
            onClear={handleClearUser}
          />
        </div>

        {/* Fields — only show after user found */}
        {selectedUser && (
          <>
            {/* Title */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest">სათაური</label>
                <span className={`text-[0.6rem] tabular-nums ${titleLeft < 15 ? "text-red-400" : "text-zinc-700"}`}>{titleLeft}</span>
              </div>
              <input
                type="text"
                maxLength={100}
                placeholder="შეტყობინების სათაური"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors placeholder-zinc-600 text-zinc-200"
              />
            </div>

            {/* Message */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest">შეტყობინება</label>
                <span className={`text-[0.6rem] tabular-nums ${msgLeft < 50 ? "text-red-400" : "text-zinc-700"}`}>{msgLeft}</span>
              </div>
              <textarea
                maxLength={500}
                rows={4}
                placeholder="შეტყობინების ტექსტი…"
                value={message}
                onChange={e => setMessage(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors resize-none placeholder-zinc-600 text-zinc-200 leading-relaxed"
              />
            </div>

            {/* Feedback */}
            {ok && (
              <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2.5">
                <IconCheck />
                <span className="text-xs text-emerald-400">
                  შეტყობინება გაიგზავნა → {selectedUser.user.full_name ?? selectedUser.user.username ?? selectedUser.user.email}
                </span>
              </div>
            )}
            {err && (
              <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{err}</p>
            )}

            {/* Send */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <p className="text-[0.6rem] text-zinc-700">
                მიმღები: <span className="text-zinc-500">{selectedUser.user.full_name ?? selectedUser.user.username ?? selectedUser.user.email}</span>
              </p>
              <button
                onClick={() => setConfirm(true)}
                disabled={sending || !canSend}
                className="cursor-pointer shrink-0 flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-5 py-2.5 rounded-xl transition-colors"
              >
                {sending ? <><IconSpinner />გაგზავნა…</> : <><IconSend />გაგზავნა</>}
              </button>
            </div>
          </>
        )}

        {!selectedUser && (
          <p className="text-[0.65rem] text-zinc-700 italic pt-1">
            მომხმარებლის პოვნის შემდეგ შეტყობინების ველები გამოჩნდება
          </p>
        )}
      </div>

      {/* History / delete — only when user is selected */}
      <NotificationsHistoryPanel
        type="user"
        userId={selectedUser?.user.id ?? null}
        refreshTrigger={refreshTrigger}
      />

      {confirm && selectedUser && (
        <ConfirmModal
          title="შეტყობინების გაგზავნა"
          message={`"${title}" გაეგზავნება ${selectedUser.user.full_name ?? selectedUser.user.username ?? selectedUser.user.email}-ს.`}
          onConfirm={() => { setConfirm(false); doSend(); }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminNotificationsSection() {
  return (
    <div className="space-y-5">
      {/* Top info bar */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 shrink-0">
          <IconBell />
        </div>
        <div>
          <p className="text-sm font-semibold text-zinc-100">შეტყობინებები</p>
        </div>
      </div>

      {/* Two panels */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <GlobalBroadcastPanel />
        <UserNotificationPanel />
      </div>
    </div>
  );
}
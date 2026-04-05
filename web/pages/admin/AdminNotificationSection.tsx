import { useState, useRef, useEffect } from "react";
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

/* ── Confirm modal ── */
function ConfirmModal({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 9v4M12 17h.01"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            </svg>
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
          <button onClick={onConfirm} className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors">
            გაგზავნა
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
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-600 to-violet-800 flex items-center justify-center shrink-0 text-white text-sm font-bold select-none">
          {(u.full_name ?? u.username ?? u.email ?? "?")[0].toUpperCase()}
        </div>
        {/* Info */}
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
        {/* Clear */}
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

  const titleLeft = 100 - title.length;
  const msgLeft = 500 - message.length;

  const doSend = async () => {
    if (!title.trim() || !message.trim()) return;
    setSending(true); setErr(null); setOk(false);
    try {
      await api.post("/api/admin/notifications/global", { title: title.trim(), message: message.trim() });
      setOk(true);
      setTitle(""); setMessage("");
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

/* Preset event types */
const EVENT_PRESETS = [
  { value: "account.notification",  label: "ანგარიში",        color: "text-sky-400",     bg: "bg-sky-500/10 border-sky-500/20" },
  { value: "plan.activated",        label: "პაკეტი გააქტ.",   color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
  { value: "plan.expiring",         label: "პაკეტი იწურება",  color: "text-amber-400",   bg: "bg-amber-500/10 border-amber-500/20" },
  { value: "plan.expired",          label: "პაკეტი ამოიწურა", color: "text-red-400",     bg: "bg-red-500/10 border-red-500/20" },
  { value: "balance.updated",       label: "ბალანსი",         color: "text-violet-400",  bg: "bg-violet-500/10 border-violet-500/20" },
  { value: "system.maintenance",    label: "სისტემა",         color: "text-zinc-400",    bg: "bg-zinc-700/50 border-zinc-600" },
  { value: "custom",                label: "სხვა",             color: "text-zinc-400",    bg: "bg-zinc-800 border-zinc-700" },
];

function UserNotificationPanel() {
  const [selectedUser, setSelectedUser] = useState<UserSearchResult | null>(null);
  const [eventType, setEventType] = useState("account.notification");
  const [customEvent, setCustomEvent] = useState("");
  const [dataTitle, setDataTitle] = useState("");
  const [dataMessage, setDataMessage] = useState("");
  const [dataExtra, setDataExtra] = useState("");
  const [dataExtraErr, setDataExtraErr] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);

  const titleLeft = 100 - dataTitle.length;
  const msgLeft = 500 - dataMessage.length;

  const resolvedEvent = eventType === "custom" ? customEvent.trim() : eventType;

  const buildData = (): Record<string, any> | null => {
    const base: Record<string, any> = {};
    if (dataTitle.trim()) base.title = dataTitle.trim();
    if (dataMessage.trim()) base.message = dataMessage.trim();
    if (dataExtra.trim()) {
      try {
        const parsed = JSON.parse(dataExtra.trim());
        Object.assign(base, parsed);
        setDataExtraErr(null);
      } catch {
        setDataExtraErr("JSON ფორმატი არასწორია");
        return null;
      }
    }
    return base;
  };

  const doSend = async () => {
    if (!selectedUser || !resolvedEvent) return;
    const data = buildData();
    if (!data) return;
    setSending(true); setErr(null); setOk(false);
    try {
      await api.post(`/api/admin/notifications/user/${selectedUser.user.id}`, {
        event: resolvedEvent,
        data,
      });
      setOk(true);
      setDataTitle(""); setDataMessage(""); setDataExtra("");
      setTimeout(() => setOk(false), 4000);
    } catch (e: any) {
      setErr(e.response?.data?.message || "გაგზავნა ვერ მოხერხდა");
    } finally { setSending(false); }
  };

  const canSend = selectedUser && resolvedEvent && (dataTitle.trim() || dataMessage.trim());

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
            onClear={() => { setSelectedUser(null); setOk(false); setErr(null); }}
          />
        </div>

        {/* Step 2 — event type (only show after user found) */}
        {selectedUser && (
          <>
            <div>
              <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-2">
                2 — ივენტის ტიპი
              </label>
              <div className="flex flex-wrap gap-1.5">
                {EVENT_PRESETS.map(p => (
                  <button
                    key={p.value}
                    onClick={() => setEventType(p.value)}
                    className={`cursor-pointer text-[0.65rem] font-medium px-2.5 py-1 rounded-lg border transition-all ${
                      eventType === p.value
                        ? `${p.bg} ${p.color} ring-1 ring-current/30`
                        : "bg-zinc-800 border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-400"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              {eventType === "custom" && (
                <input
                  type="text"
                  placeholder="event.name (e.g. promo.special)"
                  value={customEvent}
                  onChange={e => setCustomEvent(e.target.value)}
                  className="mt-2 w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm font-mono focus:outline-none focus:border-zinc-500 transition-colors placeholder-zinc-600 text-zinc-300"
                />
              )}
              {eventType !== "custom" && (
                <p className="mt-1.5 text-[0.6rem] font-mono text-zinc-700">{resolvedEvent}</p>
              )}
            </div>

            {/* Step 3 — message data */}
            <div>
              <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-2">
                3 — შეტყობინების შინაარსი
              </label>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[0.6rem] text-zinc-600">სათაური (data.title)</span>
                    <span className={`text-[0.6rem] tabular-nums ${titleLeft < 15 ? "text-red-400" : "text-zinc-700"}`}>{titleLeft}</span>
                  </div>
                  <input
                    type="text"
                    maxLength={100}
                    placeholder="შეტყობინების სათაური"
                    value={dataTitle}
                    onChange={e => setDataTitle(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors placeholder-zinc-600 text-zinc-200"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[0.6rem] text-zinc-600">ტექსტი (data.message)</span>
                    <span className={`text-[0.6rem] tabular-nums ${msgLeft < 50 ? "text-red-400" : "text-zinc-700"}`}>{msgLeft}</span>
                  </div>
                  <textarea
                    maxLength={500}
                    rows={3}
                    placeholder="შეტყობინების ტექსტი…"
                    value={dataMessage}
                    onChange={e => setDataMessage(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors resize-none placeholder-zinc-600 text-zinc-200 leading-relaxed"
                  />
                </div>

                {/* Extra JSON (collapsible) */}
                <details className="group">
                  <summary className="cursor-pointer text-[0.6rem] text-zinc-600 hover:text-zinc-400 transition-colors list-none flex items-center gap-1.5 select-none">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className="transition-transform group-open:rotate-90">
                      <path d="M3 2l4 3-4 3"/>
                    </svg>
                    დამატებითი JSON data (optional)
                  </summary>
                  <div className="mt-2">
                    <textarea
                      rows={3}
                      placeholder={'{ "plan_name": "Basic", "days_left": 3 }'}
                      value={dataExtra}
                      onChange={e => { setDataExtra(e.target.value); setDataExtraErr(null); }}
                      className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-xs font-mono focus:outline-none focus:border-zinc-500 transition-colors resize-none placeholder-zinc-700 text-zinc-400 leading-relaxed"
                    />
                    {dataExtraErr && (
                      <p className="text-xs text-red-400 mt-1">{dataExtraErr}</p>
                    )}
                  </div>
                </details>
              </div>
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
              <div className="text-[0.6rem] text-zinc-700 space-y-0.5">
                <p>მიმღები: <span className="text-zinc-500">{selectedUser.user.full_name ?? selectedUser.user.username}</span></p>
                <p className="font-mono">event: <span className="text-zinc-500">{resolvedEvent || "—"}</span></p>
              </div>
              <button
                onClick={() => { if (buildData() !== null) setConfirm(true); }}
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

      {confirm && selectedUser && (
        <ConfirmModal
          title="შეტყობინების გაგზავნა"
          message={`"${dataTitle || resolvedEvent}" გაეგზავნება ${selectedUser.user.full_name ?? selectedUser.user.username ?? selectedUser.user.email}-ს.`}
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
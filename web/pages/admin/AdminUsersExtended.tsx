

import { useState, useRef, useEffect } from "react";
import api from "../../src/lib/axios"; // adjust path if needed

/* ─── tiny shared icons ─── */
const Spinner = () => (
  <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2"/>
    <path d="M7 1a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const Check = () => (
  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7l3.5 3.5L12 3"/>
  </svg>
);
const ChevDown = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4l4 4 4-4"/>
  </svg>
);

/* ─── types ─── */
interface SearchResult {
  user: {
    id: number | string;
    numeric_id?: number;
    email: string;
    full_name?: string;
    username?: string;
    avatar_url?: string;
  };
  account: { balance: string };
  active_plans: { name: string; expires_at: string; days_left: number }[];
}

/* ════════════════════════════════════════
   SUB-PANEL: Add User
════════════════════════════════════════ */
function AddUserPanel({ onDone }: { onDone: () => void }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const handle = async () => {
    if (!form.email || !form.password) return;
    setLoading(true); setErr(null); setOk(false);
    try {
      await api.post("/api/admin/users", form);
      setOk(true);
      setForm({ email: "", password: "" });
      setTimeout(() => { setOk(false); onDone(); }, 1200);
    } catch (e: any) {
      setErr(e.response?.data?.message || "შეცდომა");
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-3 shadow-lg">
      <p className="text-[0.65rem] font-semibold text-zinc-400 uppercase tracking-widest">ახალი მომხმარებელი</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <input
          type="email" placeholder="ელ-ფოსტა"
          value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
          className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
        />
        <input
          type="password" placeholder="პაროლი"
          value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
          className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
        />
      </div>
      {err && <p className="text-xs text-red-400">{err}</p>}
      <div className="flex gap-2 items-center pt-1">
        <button
          onClick={handle}
          disabled={loading || !form.email || !form.password}
          className="cursor-pointer flex items-center gap-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-5 py-2 rounded-xl transition-colors"
        >
          {loading ? <><Spinner />შექმნა…</> : ok ? <><Check />შეიქმნა!</> : "შექმნა"}
        </button>
        <button onClick={onDone} className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors">გაუქმება</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   SUB-PANEL: Search + Balance
════════════════════════════════════════ */
function BalanceSearchPanel({ onClose }: { onClose: () => void }) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searchErr, setSearchErr] = useState<string | null>(null);

  const [amount, setAmount] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustOk, setAdjustOk] = useState<string | null>(null);
  const [adjustErr, setAdjustErr] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setResult(null); setSearchErr(null); setAdjustOk(null); setAdjustErr(null); setAmount("");
    try {
      const res = await api.get(`/api/admin/users/search?q=${encodeURIComponent(query.trim())}`);
      setResult(res.data);
    } catch (e: any) {
      setSearchErr(e.response?.data?.message || "მომხმარებელი ვერ მოიძებნა");
    } finally { setSearching(false); }
  };

  const doAdjust = async (sign: 1 | -1) => {
    if (!result || !amount || parseFloat(amount) <= 0) return;
    const val = sign * Math.abs(parseFloat(amount));
    setAdjusting(true); setAdjustOk(null); setAdjustErr(null);
    try {
      await api.post("/api/admin/users/adjust-balance", {
        identifier: String(result.user.numeric_id ?? result.user.email),
        amount: val,
      });
      // refetch result to show updated balance
      const r2 = await api.get(`/api/admin/users/search?q=${encodeURIComponent(query.trim())}`);
      setResult(r2.data);
      setAdjustOk(sign === 1 ? `+${val.toFixed(2)} ₾ დაემატა` : `${val.toFixed(2)} ₾ გამოაკლდა`);
      setAmount("");
      setTimeout(() => setAdjustOk(null), 3000);
    } catch (e: any) {
      setAdjustErr(e.response?.data?.message || "შეცდომა");
    } finally { setAdjusting(false); }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4 shadow-lg">
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] font-semibold text-zinc-400 uppercase tracking-widest">ბალანსის კორექტირება</p>
        <button onClick={onClose} className="cursor-pointer text-zinc-600 hover:text-zinc-300 transition-colors text-lg leading-none">✕</button>
      </div>

      {/* Search bar */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="ID / ელ-ფოსტა / ტელეფონი"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === "Enter" && doSearch()}
          className="flex-1 bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
        />
        <button
          onClick={doSearch}
          disabled={searching || !query.trim()}
          className="cursor-pointer flex items-center gap-1.5 bg-zinc-700 hover:bg-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-200 text-xs font-medium px-4 py-2 rounded-xl transition-colors"
        >
          {searching ? <Spinner /> : (
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="6" cy="6" r="4.5"/><path d="M10 10l2.5 2.5"/>
            </svg>
          )}
          ძიება
        </button>
      </div>

      {searchErr && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{searchErr}</p>
      )}

      {/* Result card */}
      {result && (
        <div className="space-y-4">
          {/* User info row */}
          <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-zinc-300 text-sm font-bold select-none">
              {(result.user.full_name ?? result.user.username ?? result.user.email ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-zinc-100 font-semibold text-sm truncate">{result.user.full_name ?? result.user.username ?? "—"}</p>
              <p className="text-[0.65rem] text-zinc-500 truncate">{result.user.email}{result.user.numeric_id ? ` · #${result.user.numeric_id}` : ""}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-lg font-bold text-emerald-400 leading-none">{parseFloat(result.account.balance).toFixed(2)} ₾</p>
              <p className="text-[0.6rem] text-zinc-600 mt-0.5">ბალანსი</p>
            </div>
          </div>

          {/* Active plans */}
          {result.active_plans.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[0.6rem] text-zinc-600 uppercase tracking-widest">აქტიური პაკეტები</p>
              {result.active_plans.map((p, i) => (
                <div key={i} className="flex items-center gap-2.5 bg-emerald-500/5 border border-emerald-500/15 rounded-xl px-3 py-2">
                  <svg width="11" height="11" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.1l-4.76 2.55.91-5.3L2.3 7.6l5.3-.8L10 2z" stroke="#34d399" strokeWidth="1.6" strokeLinejoin="round"/>
                  </svg>
                  <p className="flex-1 text-emerald-300 text-xs font-medium truncate">{p.name}</p>
                  <span className="text-[0.6rem] text-zinc-500 shrink-0">{p.days_left}დ · {new Date(p.expires_at).toLocaleDateString("ka-GE")}</span>
                </div>
              ))}
            </div>
          )}
          {result.active_plans.length === 0 && (
            <p className="text-[0.65rem] text-zinc-700 italic">პაქეტები არ აქვს</p>
          )}

          {/* Adjust balance */}
          <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-3 space-y-2.5">
            <p className="text-[0.6rem] text-zinc-500 uppercase tracking-widest">ბალანსის ცვლილება</p>
            <div className="flex gap-2 items-center">
              <input
                type="number" min="0.01" step="0.01" placeholder="თანხა"
                value={amount} onChange={e => setAmount(e.target.value)}
                className="flex-1 bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
              />
              <button
                onClick={() => doAdjust(1)}
                disabled={adjusting || !amount || parseFloat(amount) <= 0}
                className="cursor-pointer flex items-center gap-1 bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors"
              >
                {adjusting ? <Spinner /> : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                )}
                დამატება
              </button>
              <button
                onClick={() => doAdjust(-1)}
                disabled={adjusting || !amount || parseFloat(amount) <= 0}
                className="cursor-pointer flex items-center gap-1 bg-red-600/80 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-3 py-2 rounded-xl transition-colors"
              >
                {adjusting ? <Spinner /> : (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
                )}
                გამოკლება
              </button>
            </div>
            {adjustOk && (
              <p className="text-xs text-emerald-400 flex items-center gap-1.5"><Check />{adjustOk}</p>
            )}
            {adjustErr && (
              <p className="text-xs text-red-400">{adjustErr}</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN EXPORT — render this in Users section
════════════════════════════════════════ */
export default function AdminUsersExtended() {
  const [mode, setMode] = useState<null | "addUser" | "balance">(null);

  return (
    <div className="space-y-3">
      {/* Action buttons — shown when no panel is open */}
      {mode === null && (
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode("addUser")}
            className="cursor-pointer flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 transition-colors text-white text-xs font-medium px-4 py-2 rounded-xl"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>
            მომხმარებლის დამატება
          </button>
          <button
            onClick={() => setMode("balance")}
            className="cursor-pointer flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 transition-colors text-zinc-300 text-xs font-medium px-4 py-2 rounded-xl"
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="5.5"/>
              <path d="M7 4v3l2 1.5"/>
            </svg>
            ბალანსის კორექტირება
          </button>
        </div>
      )}

      {mode === "addUser" && (
        <AddUserPanel onDone={() => setMode(null)} />
      )}

      {mode === "balance" && (
        <BalanceSearchPanel onClose={() => setMode(null)} />
      )}
    </div>
  );
}
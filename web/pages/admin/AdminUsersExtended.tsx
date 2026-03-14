import { useState, useRef, useEffect } from "react";
import api from "../../src/lib/axios";

interface Plan {
  id: string;
  name_en: string;
  name_ka: string;
  price: number;
  duration_days: number;
  is_active: boolean | number;
}

interface SearchResult {
  user: {
    id: number | string;
    numeric_id?: number;
    email: string;
    full_name?: string;
    username?: string;
    phone?: string;
    role?: string;
    created_at?: string;
  };
  account: { balance: string; status?: string } | null;
  active_plans: { id?: string; name: string; expires_at: string; days_left: number }[];
  meta: {
    is_verified: boolean;
    has_account: boolean;
    has_plans: boolean;
  };
}

/* ── icons ── */
const Spinner = () => (
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

/* ════════════════════════════════════════
   ADD USER PANEL — unchanged
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
          {loading ? <><Spinner />შექმნა…</> : ok ? <><IconCheck />შეიქმნა!</> : "შექმნა"}
        </button>
        <button onClick={onDone} className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 px-3 py-2 rounded-xl hover:bg-zinc-800 transition-colors">გაუქმება</button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   UNIFIED USER SEARCH + MANAGE PANEL
════════════════════════════════════════ */
function UserManagePanel({
  plans,
  onClose,
}: {
  plans: Plan[];
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  /* balance */
  const [amount, setAmount] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustOk, setAdjustOk] = useState<string | null>(null);
  const [adjustErr, setAdjustErr] = useState<string | null>(null);

  /* grant */
  const [grantPlanId, setGrantPlanId] = useState("");
  const [grantDays, setGrantDays] = useState("30");
  const [granting, setGranting] = useState(false);
  const [grantOk, setGrantOk] = useState<string | null>(null);
  const [grantErr, setGrantErr] = useState<string | null>(null);
  const [showGrantForm, setShowGrantForm] = useState(false);

  /* revoke */
  const [revokePlanId, setRevokePlanId] = useState("");
  const [revoking, setRevoking] = useState(false);
  const [revokeOk, setRevokeOk] = useState<string | null>(null);
  const [revokeErr, setRevokeErr] = useState<string | null>(null);
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const refetch = async () => {
    if (!query.trim()) return;
    const r = await api.get(`/api/admin/users/search?q=${encodeURIComponent(query.trim())}`);
    setResult(r.data);
  };

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setResult(null);
    setSearchErr(null);
    setAdjustOk(null); setAdjustErr(null);
    setGrantOk(null); setGrantErr(null);
    setRevokeOk(null); setRevokeErr(null);
    setShowGrantForm(false); setShowRevokeConfirm(false);
    setGrantPlanId(""); setRevokePlanId("");
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
      await refetch();
      setAdjustOk(sign === 1 ? `+${Math.abs(val).toFixed(2)} ₾ დაემატა` : `-${Math.abs(val).toFixed(2)} ₾ გამოაკლდა`);
      setAmount("");
      setTimeout(() => setAdjustOk(null), 3000);
    } catch (e: any) {
      setAdjustErr(e.response?.data?.message || "შეცდომა");
    } finally { setAdjusting(false); }
  };

  const doGrant = async () => {
    if (!result || !grantPlanId || !grantDays) return;
    setGranting(true); setGrantOk(null); setGrantErr(null);
    try {
      await api.post(`/api/admin/users/${result.user.id}/grant-plan`, {
        plan_id: grantPlanId,
        days: parseInt(grantDays),
      });
      await refetch();
      const planName = plans.find(p => p.id === grantPlanId)?.name_en ?? "პაკეტი";
      setGrantOk(`"${planName}" მინიჭებულია`);
      setGrantPlanId(""); setGrantDays("30");
      setShowGrantForm(false);
      setTimeout(() => setGrantOk(null), 3000);
    } catch (e: any) {
      setGrantErr(e.response?.data?.message || "შეცდომა");
    } finally { setGranting(false); }
  };

  const doRevoke = async () => {
    if (!result || !revokePlanId) return;
    setRevoking(true); setRevokeOk(null); setRevokeErr(null);
    try {
      await api.post(`/api/admin/users/${result.user.id}/revoke-plan`, {
        plan_id: revokePlanId,
      });
      await refetch();
      setRevokeOk("პაკეტი გაუქმებულია");
      setRevokePlanId("");
      setShowRevokeConfirm(false);
      setTimeout(() => setRevokeOk(null), 3000);
    } catch (e: any) {
      setRevokeErr(e.response?.data?.message || "შეცდომა");
    } finally { setRevoking(false); }
  };

  const activePlans = plans.filter(p => Boolean(p.is_active));

  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4 shadow-lg">

      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] font-semibold text-zinc-400 uppercase tracking-widest">მომხმარებლის მართვა</p>
        <button onClick={onClose} className="cursor-pointer text-zinc-600 hover:text-zinc-300 transition-colors text-lg leading-none">✕</button>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="ID / ელ-ფოსტა / მომხ. სახელი / ტელეფონი"
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

      {result && (
        <div className="space-y-3">

          {/* ── User identity card ── */}
          <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3">
            <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-zinc-300 text-sm font-bold select-none">
              {(result.user.full_name ?? result.user.username ?? result.user.email ?? "?")[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-zinc-100 font-semibold text-sm truncate">
                  {result.user.full_name ?? result.user.username ?? "—"}
                </p>
                {result.user.role === "admin" && (
                  <span className="text-[0.55rem] bg-violet-500/15 text-violet-300 border border-violet-500/25 px-1.5 py-0.5 rounded-md font-semibold">ადმინი</span>
                )}
                {result.meta.is_verified
                  ? <span className="text-[0.55rem] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded-md font-medium">✓ დადასტურებული</span>
                  : <span className="text-[0.55rem] bg-zinc-800 text-zinc-600 border border-zinc-700 px-1.5 py-0.5 rounded-md font-medium">დაუდასტურებელი</span>
                }
              </div>
              <p className="text-[0.65rem] text-zinc-500 truncate mt-0.5">
                {result.user.email}
                {result.user.numeric_id ? ` · #${result.user.numeric_id}` : ""}
                {result.user.phone ? ` · ${result.user.phone}` : ""}
              </p>
              {result.user.created_at && (
                <p className="text-[0.58rem] text-zinc-700 mt-0.5">
                  რეგისტრაცია: {new Date(result.user.created_at).toLocaleDateString("ka-GE")}
                </p>
              )}
            </div>
            {/* Balance */}
            {result.account && (
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-emerald-400 leading-none">
                  {parseFloat(result.account.balance).toFixed(2)} ₾
                </p>
                <p className="text-[0.6rem] mt-0.5">
                  {result.account.status === "active"
                    ? <span className="text-emerald-500">● აქტიური</span>
                    : <span className="text-zinc-600">● {result.account.status ?? "—"}</span>
                  }
                </p>
              </div>
            )}
          </div>

          {/* ── Two column action area ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">

            {/* LEFT — Plans */}
            <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-3 space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-[0.6rem] text-zinc-500 uppercase tracking-widest">პაკეტები</p>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => { setShowGrantForm(v => !v); setShowRevokeConfirm(false); }}
                    className="cursor-pointer text-[0.6rem] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                  >
                    <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                    მინიჭება
                  </button>
                  {result.active_plans.length > 0 && (
                    <button
                      onClick={() => { setShowRevokeConfirm(v => !v); setShowGrantForm(false); }}
                      className="cursor-pointer text-[0.6rem] font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 px-2 py-0.5 rounded-md transition-colors flex items-center gap-1"
                    >
                      <svg width="8" height="8" viewBox="0 0 10 10" fill="none"><path d="M1 5h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                      გაუქმება
                    </button>
                  )}
                </div>
              </div>

              {/* Active plans list */}
              {result.active_plans.length === 0 && !showGrantForm && (
                <p className="text-[0.65rem] text-zinc-700 italic">აქტიური პაკეტი არ აქვს</p>
              )}
              {result.active_plans.map((p, i) => (
                <div
                  key={i}
                  onClick={() => { if (showRevokeConfirm && p.id) setRevokePlanId(p.id); }}
                  className={`flex items-center gap-2 rounded-lg px-2.5 py-2 border transition-all ${
                    showRevokeConfirm
                      ? revokePlanId === p.id
                        ? "border-red-500 bg-red-500/10 cursor-pointer"
                        : "border-zinc-700/50 bg-zinc-800/40 cursor-pointer hover:border-red-500/40"
                      : "border-transparent bg-emerald-500/5"
                  }`}
                >
                  {showRevokeConfirm && (
                    <div className={`w-3.5 h-3.5 rounded-full border-2 shrink-0 flex items-center justify-center ${revokePlanId === p.id ? "border-red-500 bg-red-500" : "border-zinc-600"}`}>
                      {revokePlanId === p.id && <span className="w-1.5 h-1.5 rounded-full bg-white block" />}
                    </div>
                  )}
                  <svg width="10" height="10" viewBox="0 0 20 20" fill="none">
                    <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.1l-4.76 2.55.91-5.3L2.3 7.6l5.3-.8L10 2z" stroke="#34d399" strokeWidth="1.4" strokeLinejoin="round"/>
                  </svg>
                  <p className="flex-1 text-emerald-300 text-xs font-medium truncate">{p.name}</p>
                  <span className="text-[0.58rem] text-zinc-500 shrink-0 tabular-nums">
                    {p.days_left}დ · {new Date(p.expires_at).toLocaleDateString("ka-GE")}
                  </span>
                </div>
              ))}

              {/* Grant form */}
              {showGrantForm && (
                <div className="space-y-2 pt-1 border-t border-zinc-700/40">
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-0.5">
                    {activePlans.map(plan => (
                      <label
                        key={plan.id}
                        className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                          grantPlanId === plan.id
                            ? "border-emerald-500 bg-emerald-500/10"
                            : "border-zinc-700/50 bg-zinc-800/30 hover:border-zinc-600"
                        }`}
                      >
                        <input type="radio" name="grantPlanInline" value={plan.id} checked={grantPlanId === plan.id} onChange={() => setGrantPlanId(plan.id)} className="accent-emerald-500" />
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-200 text-xs font-medium truncate">{plan.name_en}</p>
                          <p className="text-[0.58rem] text-zinc-600">{plan.price} ₾ · {plan.duration_days}დ</p>
                        </div>
                        {grantPlanId === plan.id && <IconCheck />}
                      </label>
                    ))}
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number" min="1" placeholder="დღეები"
                      value={grantDays} onChange={e => setGrantDays(e.target.value)}
                      className="w-24 bg-zinc-800 border border-zinc-700 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:border-zinc-500 transition-colors"
                    />
                    <button
                      onClick={doGrant}
                      disabled={granting || !grantPlanId || !grantDays}
                      className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                    >
                      {granting ? <><Spinner />მინიჭება…</> : <><IconCheck />მინიჭება</>}
                    </button>
                    <button onClick={() => { setShowGrantForm(false); setGrantPlanId(""); }} className="cursor-pointer text-zinc-600 hover:text-zinc-300 text-lg leading-none">✕</button>
                  </div>
                  {grantErr && <p className="text-xs text-red-400">{grantErr}</p>}
                </div>
              )}

              {/* Revoke confirm */}
              {showRevokeConfirm && result.active_plans.length > 0 && (
                <div className="pt-1 border-t border-zinc-700/40 space-y-2">
                  <p className="text-[0.6rem] text-zinc-600">აირჩიეთ გასაუქმებელი პაკეტი ↑</p>
                  <div className="flex gap-2">
                    <button
                      onClick={doRevoke}
                      disabled={revoking || !revokePlanId}
                      className="cursor-pointer flex-1 flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-1.5 rounded-lg transition-colors"
                    >
                      {revoking ? <><Spinner />გაუქმება…</> : "გაუქმება"}
                    </button>
                    <button onClick={() => { setShowRevokeConfirm(false); setRevokePlanId(""); }} className="cursor-pointer text-zinc-600 hover:text-zinc-300 text-lg leading-none px-1">✕</button>
                  </div>
                  {revokeErr && <p className="text-xs text-red-400">{revokeErr}</p>}
                </div>
              )}

              {/* Feedback */}
              {grantOk && <p className="text-xs text-emerald-400 flex items-center gap-1.5"><IconCheck />{grantOk}</p>}
              {revokeOk && <p className="text-xs text-emerald-400 flex items-center gap-1.5"><IconCheck />{revokeOk}</p>}
            </div>

            {/* RIGHT — Balance */}
            <div className="bg-zinc-800/40 border border-zinc-700/50 rounded-xl p-3 space-y-2.5">
              <p className="text-[0.6rem] text-zinc-500 uppercase tracking-widest">ბალანსი</p>

              {result.account ? (
                <>
                  <div className="flex items-center justify-between bg-zinc-800 rounded-lg px-3 py-2.5">
                    <span className="text-[0.65rem] text-zinc-500">მიმდინარე</span>
                    <span className="text-base font-bold text-emerald-400">{parseFloat(result.account.balance).toFixed(2)} ₾</span>
                  </div>
                  <input
                    type="number" min="0.01" step="0.01" placeholder="თანხა"
                    value={amount} onChange={e => setAmount(e.target.value)}
                    className="w-full bg-zinc-800 border border-zinc-700 px-3 py-2 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => doAdjust(1)}
                      disabled={adjusting || !amount || parseFloat(amount) <= 0}
                      className="cursor-pointer flex items-center justify-center gap-1 bg-emerald-600/80 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-2 rounded-xl transition-colors"
                    >
                      {adjusting ? <Spinner /> : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                      დამატება
                    </button>
                    <button
                      onClick={() => doAdjust(-1)}
                      disabled={adjusting || !amount || parseFloat(amount) <= 0}
                      className="cursor-pointer flex items-center justify-center gap-1 bg-red-600/80 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-2 rounded-xl transition-colors"
                    >
                      {adjusting ? <Spinner /> : <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 5h8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>}
                      გამოკლება
                    </button>
                  </div>
                  {adjustOk && <p className="text-xs text-emerald-400 flex items-center gap-1.5"><IconCheck />{adjustOk}</p>}
                  {adjustErr && <p className="text-xs text-red-400">{adjustErr}</p>}
                </>
              ) : (
                <p className="text-[0.65rem] text-zinc-600 italic">ანგარიში არ მოიძებნა</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


export default function AdminUsersExtended({ plans }: { plans: Plan[] }) {
  const [mode, setMode] = useState<null | "addUser" | "manage">(null);

  return (
    <div className="space-y-3">
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
            onClick={() => setMode("manage")}
            className="cursor-pointer flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 transition-colors text-zinc-300 text-xs font-medium px-4 py-2 rounded-xl"
          >
            <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="5.5"/>
              <path d="M7 4v3l2 1.5"/>
            </svg>
            მომხმარებლის მართვა
          </button>
        </div>
      )}

      {mode === "addUser" && <AddUserPanel onDone={() => setMode(null)} />}
      {mode === "manage" && <UserManagePanel plans={plans} onClose={() => setMode(null)} />}
    </div>
  );
}
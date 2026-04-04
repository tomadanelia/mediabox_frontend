import { useState, useEffect, useRef } from "react";
import api from "../../src/lib/axios";
import { Calendar } from '@/components/ui/calendar'
import { type DateRange } from 'react-day-picker'

function DiscountDatePicker({
  startsAt,
  expiresAt,
  onChange,
}: {
  startsAt: string | null;
  expiresAt: string | null;
  onChange: (starts_at: string | null, expires_at: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const range: DateRange | undefined =
    startsAt || expiresAt
      ? { from: startsAt ? new Date(startsAt) : undefined, to: expiresAt ? new Date(expiresAt) : undefined }
      : undefined;

  const handleSelect = (r: DateRange | undefined) => {
    const fmt = (d: Date | undefined) =>
      d ? d.toISOString().split("T")[0] : null;
    onChange(fmt(r?.from), fmt(r?.to));
    if (r?.from && r?.to) setOpen(false);
  };

  const displayText = () => {
    if (!startsAt && !expiresAt) return "პერიოდი არ არის მითითებული";
    const fmt = (s: string) => new Date(s).toLocaleDateString("ka-GE");
    if (startsAt && expiresAt) return `${fmt(startsAt)} — ${fmt(expiresAt)}`;
    if (startsAt) return `${fmt(startsAt)} →`;
    return `→ ${fmt(expiresAt!)}`;
  };

  return (
    <div ref={ref} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`cursor-pointer w-full flex items-center justify-between gap-2 bg-zinc-800 border rounded-xl px-3 py-2.5 text-sm transition-colors ${
          open ? "border-zinc-500" : "border-zinc-700 hover:border-zinc-600"
        }`}
      >
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-zinc-500 shrink-0">
            <rect x="1.5" y="2.5" width="13" height="12" rx="1.5"/>
            <path d="M5 1v3M11 1v3M1.5 6.5h13"/>
          </svg>
          <span className={startsAt || expiresAt ? "text-zinc-200" : "text-zinc-600"}>
            {displayText()}
          </span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {(startsAt || expiresAt) && (
            <span
              onClick={e => { e.stopPropagation(); onChange(null, null); }}
              className="cursor-pointer text-zinc-600 hover:text-zinc-400 transition-colors text-base leading-none"
            >
              ✕
            </span>
          )}
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={`text-zinc-600 transition-transform ${open ? "rotate-180" : ""}`}>
            <path d="M2 4l4 4 4-4"/>
          </svg>
        </div>
      </button>

      {/* Popover */}
      {open && (
        <div className="absolute left-0 top-full mt-2 z-30 bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden">
          <Calendar
            mode="range"
            selected={range}
            onSelect={handleSelect}
            defaultMonth={range?.from}
            numberOfMonths={2}
            classNames={{
              months: "flex gap-4 p-3",
              month: "space-y-3",
              month_caption: "flex justify-center items-center px-2 py-1",
              caption_label: "text-xs font-semibold text-zinc-300",
              nav: "flex items-center gap-1",
              button_previous: "cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors absolute left-3 top-3",
              button_next: "cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300 transition-colors absolute right-3 top-3",
              month_grid: "w-full border-collapse",
              weekdays: "flex",
              weekday: "w-9 text-center text-[0.6rem] text-zinc-600 uppercase font-medium py-1",
              weeks: "space-y-0.5",
              week: "flex",
              day: "relative p-0 text-center",
              day_button: [
                "w-9 h-9 text-xs rounded-full transition-all font-medium",
                "text-zinc-300 hover:bg-zinc-700 hover:text-zinc-100",
                "data-[selected=true]:text-white",
                "data-[range-start=true]:rounded-full! data-[range-start=true]:bg-orange-600! data-[range-start=true]:text-white!",
                "data-[range-end=true]:rounded-full! data-[range-end=true]:bg-orange-500! data-[range-end=true]:text-white!",
                "data-[range-middle=true]:rounded-none data-[range-middle=true]:bg-orange-500/15 data-[range-middle=true]:text-orange-200",
                "data-[disabled=true]:opacity-30 data-[disabled=true]:cursor-not-allowed",
                "data-[today=true]:ring-1 data-[today=true]:ring-zinc-500",
              ].join(" "),
              range_start: "rounded-l-full bg-orange-600/15",
              range_end: "rounded-r-full bg-orange-500/15",
              range_middle: "bg-orange-500/10",
              outside: "opacity-20 pointer-events-none",
              hidden: "invisible",
            }}
          />
          <div className="px-4 py-2.5 border-t border-zinc-800 flex items-center justify-between">
            <p className="text-[0.6rem] text-zinc-600">
              {range?.from && !range?.to ? "აირჩიეთ დასრულების თარიღი" : "აირჩიეთ დაწყების თარიღი"}
            </p>
            {(startsAt || expiresAt) && (
              <button
                onClick={() => { onChange(null, null); setOpen(false); }}
                className="cursor-pointer text-[0.6rem] text-zinc-600 hover:text-red-400 transition-colors"
              >
                გასუფთავება
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
interface Plan {
  id: string;
  name_en: string;
  name_ka: string;
  price: number;
  is_active: boolean | number;
}

interface Discount {
  id: number;
  name: string;
  value: number;
  target_id: string | null;
  is_global: boolean | number;
  is_active: boolean | number;
  starts_at: string | null;
  expires_at: string | null;
  users_count?: number;
}

interface UserSearchResult {
  user: {
    id: number | string;
    numeric_id?: number;
    email: string;
    full_name?: string;
    username?: string;
    phone?: string;
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
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h12M6 4V2h4v2M5 4l.5 9h5l.5-9"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z"/>
  </svg>
);
const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/>
  </svg>
);
const IconDisable = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/><path d="M4.5 4.5l7 7"/>
  </svg>
);
const IconUser = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="5" r="3"/><path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6"/>
  </svg>
);
const IconTag = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/>
    <circle cx="7" cy="7" r="1.5" fill="currentColor"/>
  </svg>
);

/* ── Confirm modal ── */
function ConfirmModal({
  message,
  onConfirm,
  onCancel,
  danger = false,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${danger ? "bg-red-500/10 border border-red-500/20" : "bg-amber-500/10 border border-amber-500/20"}`}>
            {danger ? (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
            ) : (
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 9v4M12 17h.01"/>
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              </svg>
            )}
          </div>
          <div>
            <p className="text-zinc-100 font-semibold text-sm">დარწმუნებული ხარ?</p>
            <p className="text-zinc-500 text-xs leading-relaxed mt-1.5">{message}</p>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onCancel} className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">გაუქმება</button>
          <button
            onClick={onConfirm}
            className={`cursor-pointer flex-1 py-2.5 rounded-xl text-sm text-white font-medium transition-colors ${danger ? "bg-red-600 hover:bg-red-500" : "bg-amber-600 hover:bg-amber-500"}`}
          >
            დიახ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Dropdown action menu ── */
function DiscountMenu({
  discount,
  onEdit,
  onToggle,
  onAssign,
  onDelete,
}: {
  discount: Discount;
  onEdit: () => void;
  onToggle: () => void;
  onAssign: () => void;
  onDelete: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${open ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"}`}
      >
        <IconDots />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden py-1">
          <button onClick={() => { setOpen(false); onEdit(); }} className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors">
            <IconEdit /><span>რედაქტირება</span>
          </button>
          {!Boolean(discount.is_global) && (
            <button onClick={() => { setOpen(false); onAssign(); }} className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-sky-400 hover:bg-sky-500/10 transition-colors">
              <IconUser /><span>მომხმარებლის მინიჭება</span>
            </button>
          )}
          {Boolean(discount.is_active) ? (
            <button onClick={() => { setOpen(false); onToggle(); }} className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors">
              <IconDisable /><span>გამორთვა</span>
            </button>
          ) : (
            <button onClick={() => { setOpen(false); onToggle(); }} className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors">
              <IconCheck /><span>ჩართვა</span>
            </button>
          )}
          <div className="my-1 border-t border-zinc-700/60" />
          <button onClick={() => { setOpen(false); onDelete(); }} className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
            <IconTrash /><span>ფასდაკლების წაშლა</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Shared input style ── */
const inp = "w-full cursor-pointer bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors text-zinc-200 placeholder-zinc-600";
const label = (text: string) => <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">{text}</label>;

/* ── Discount form (shared between Add and Edit) ── */
function DiscountForm({
  form,
  setForm,
  plans,
  error,
  onSave,
  onCancel,
  saving,
  isEdit,
}: {
  form: any;
  setForm: (f: any) => void;
  plans: Plan[];
  error: string | null;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  isEdit?: boolean;
}) {
    const [open, setOpen] = useState(false);
  return (
    <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-5 space-y-4 shadow-lg">
      <p className="text-[0.65rem] font-semibold text-zinc-400 uppercase tracking-widest">
        {isEdit ? "ფასდაკლების რედაქტირება" : "ახალი ფასდაკლება / სეილი"}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          {label("სახელი")}
          <input className={inp} placeholder="მაგ. ზაფხულის სეილი" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          {label("ფასდაკლება ")}
          <input type="number" min="0" max="100" step="0.01" className={inp} placeholder="მაგ. 20" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          {label("მიზნობრივი პაკეტი (optional)")}
          <div className="relative">
  <button
    onClick={() => setOpen(!open)}
    className={inp + " flex justify-between items-center"}
  >
    <span>
      {form.target_id
        ? plans.find(p => p.id === form.target_id)?.name_en
        : "— ყველა პაკეტი —"}
    </span>
    <span className="text-zinc-500">▼</span>
  </button>

  {open && (
    <div className="absolute z-20 mt-1 w-full bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl max-h-48 overflow-auto">
      <button
        onClick={() => { setForm({ ...form, target_id: null }); setOpen(false); }}
        className="cursor-pointer w-full text-left px-3 py-2 text-sm text-zinc-400 hover:bg-zinc-700"
      >
        — ყველა პაკეტი —
      </button>

      {plans.filter(p => Boolean(p.is_active)).map(p => (
        <button
          key={p.id}
          onClick={() => {
            setForm({ ...form, target_id: p.id });
            setOpen(false);
          }}
          className="w-full text-left cursor-pointer px-3 py-2 text-sm text-zinc-200 hover:bg-zinc-700"
        >
          {p.name_en} ({p.price} ₾)
        </button>
      ))}
    </div>
  )}
</div>
        </div>
        <div className="flex flex-col justify-end gap-2.5 pb-0.5">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setForm({ ...form, is_global: !form.is_global })}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${form.is_global ? "bg-sky-500" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_global ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-xs text-zinc-400">გლობალური (ყველა მომხმარებელი)</span>
          </label>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setForm({ ...form, is_active: !form.is_active })}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${form.is_active ? "bg-emerald-500" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-xs text-zinc-400">აქტიური</span>
          </label>
        </div>
      </div>

      <div>
  {label("პერიოდი (optional)")}
  <DiscountDatePicker
    startsAt={form.starts_at}
    expiresAt={form.expires_at}
    onChange={(starts_at, expires_at) => setForm({ ...form, starts_at, expires_at })}
  />
</div>

      {error && (
        <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          onClick={onSave}
          disabled={saving || !form.name || !form.value}
          className="cursor-pointer flex items-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-5 py-2 rounded-xl transition-colors"
        >
          {saving ? <><IconSpinner />შენახვა…</> : <><IconCheck />{isEdit ? "ცვლილებების შენახვა" : "შექმნა"}</>}
        </button>
        <button onClick={onCancel} className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs text-zinc-300 transition-colors">
          გაუქმება
        </button>
      </div>
    </div>
  );
}

/* ── Assign to User modal with search ── */
function AssignUserModal({
  discount,
  onClose,
}: {
  discount: Discount;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [result, setResult] = useState<UserSearchResult | null>(null);
  const [searchErr, setSearchErr] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [assignOk, setAssignOk] = useState(false);
  const [assignErr, setAssignErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const doSearch = async () => {
    if (!query.trim()) return;
    setSearching(true); setResult(null); setSearchErr(null); setAssignOk(false); setAssignErr(null);
    try {
      const res = await api.get(`/api/admin/users/search?q=${encodeURIComponent(query.trim())}`);
      setResult(res.data);
    } catch (e: any) {
      setSearchErr(e.response?.data?.message || "მომხმარებელი ვერ მოიძებნა");
    } finally { setSearching(false); }
  };

  const doAssign = async () => {
    if (!result) return;
    setAssigning(true); setAssignErr(null);
    try {
      await api.post(`/api/admin/discounts/${discount.id}/assign`, { user_id: String(result.user.id) });
      setAssignOk(true);
      setTimeout(() => setAssignOk(false), 3000);
    } catch (e: any) {
      setAssignErr(e.response?.data?.message || "მინიჭება ვერ მოხერხდა");
    } finally { setAssigning(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-start">
          <div>
            <h3 className="font-bold text-zinc-100">მომხმარებლის მინიჭება</h3>
            <p className="text-[0.65rem] text-zinc-500 mt-0.5">
              ფასდაკლება: <span className="text-orange-400 font-semibold">"{discount.name}"</span> — {discount.value}
            </p>
          </div>
          <button onClick={onClose} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">✕</button>
        </div>

        <div className="p-5 space-y-4">
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
              {searching ? <IconSpinner /> : (
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
            <div className="space-y-3">
              <div className="flex items-center gap-3 bg-zinc-800/60 border border-zinc-700/50 rounded-xl p-3">
                <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center shrink-0 text-zinc-300 text-sm font-bold select-none">
                  {(result.user.full_name ?? result.user.username ?? result.user.email ?? "?")[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-zinc-100 font-semibold text-sm truncate">
                    {result.user.full_name ?? result.user.username ?? "—"}
                  </p>
                  <p className="text-[0.65rem] text-zinc-500 truncate mt-0.5">
                    {result.user.email}
                    {result.user.numeric_id ? ` · #${result.user.numeric_id}` : ""}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  {result.meta.is_verified
                    ? <span className="text-[0.55rem] bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded-md">✓ დადასტ.</span>
                    : <span className="text-[0.55rem] bg-zinc-800 text-zinc-600 border border-zinc-700 px-1.5 py-0.5 rounded-md">დაუდასტ.</span>
                  }
                </div>
              </div>

              {assignOk && (
                <p className="text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-2 flex items-center gap-1.5">
                  <IconCheck />ფასდაკლება წარმატებით მიენიჭა
                </p>
              )}
              {assignErr && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{assignErr}</p>
              )}

              <button
                onClick={() => setConfirm(true)}
                disabled={assigning || assignOk}
                className="cursor-pointer w-full flex items-center justify-center gap-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium py-2.5 rounded-xl transition-colors"
              >
                {assigning ? <><IconSpinner />მინიჭება…</> : <><IconUser />ამ მომხმარებლისთვის მინიჭება</>}
              </button>
            </div>
          )}
        </div>
      </div>

      {confirm && result && (
        <ConfirmModal
          message={`"${discount.name}" (${discount.value}) მიენიჭება ${result.user.full_name ?? result.user.username ?? result.user.email}-ს.`}
          onConfirm={() => { setConfirm(false); doAssign(); }}
          onCancel={() => setConfirm(false)}
        />
      )}
    </div>
  );
}

/* ── Edit Modal ── */
function EditDiscountModal({
  discount,
  plans,
  onClose,
  onSaved,
}: {
  discount: Discount;
  plans: Plan[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: discount.name,
    value: String(discount.value),
    target_id: discount.target_id ?? null,
    is_global: Boolean(discount.is_global),
    is_active: Boolean(discount.is_active),
    starts_at: discount.starts_at ? discount.starts_at.split("T")[0] : null,
    expires_at: discount.expires_at ? discount.expires_at.split("T")[0] : null,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    setSaving(true); setError(null);
    try {
      await api.put(`/api/admin/discounts/${discount.id}`, {
        ...form,
        value: parseFloat(form.value),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || "განახლება ვერ მოხერხდა");
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-zinc-100">ფასდაკლების რედაქტირება</h3>
            <p className="text-[0.65rem] text-zinc-500 mt-0.5 font-mono">ID: {discount.id}…</p>
          </div>
          <button onClick={onClose} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">✕</button>
        </div>
        <div className="p-5">
          <DiscountForm
            form={form}
            setForm={setForm}
            plans={plans}
            error={error}
            onSave={handleSave}
            onCancel={onClose}
            saving={saving}
            isEdit
          />
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminDiscountsSection({ plans }: { plans: Plan[] }) {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  /* Add form */
  const [showAdd, setShowAdd] = useState(false);
  const [addForm, setAddForm] = useState({
    name: "", value: "", target_id: null as string | null,
    is_global: false, is_active: true,
    starts_at: null as string | null, expires_at: null as string | null,
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  /* Edit modal */
  const [editTarget, setEditTarget] = useState<Discount | null>(null);

  /* Toggle confirm */
  const [toggleTarget, setToggleTarget] = useState<Discount | null>(null);
  const [toggleLoading, setToggleLoading] = useState(false);

  /* Delete confirm */
  const [deleteTarget, setDeleteTarget] = useState<Discount | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* Assign user modal */
  const [assignTarget, setAssignTarget] = useState<Discount | null>(null);

  /* Fetch */
  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/discounts");
      const data = res.data;
      setDiscounts(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDiscounts(); }, []);

  const filtered = discounts.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase())
  );

  /* Add */
  const handleAdd = async () => {
    if (!addForm.name || !addForm.value) return;
    setAddLoading(true); setAddError(null);
    try {
      await api.post("/api/admin/discounts", {
        ...addForm,
        value: parseFloat(addForm.value),
        is_active: addForm.is_active,
      });
      setShowAdd(false);
      setAddForm({ name: "", value: "", target_id: null, is_global: false, is_active: true, starts_at: null, expires_at: null });
      fetchDiscounts();
    } catch (e: any) {
      setAddError(e.response?.data?.message || "შექმნა ვერ მოხერხდა");
    } finally { setAddLoading(false); }
  };

  /* Toggle active */
  const handleToggle = async () => {
    if (!toggleTarget) return;
    setToggleLoading(true);
    try {
      await api.put(`/api/admin/discounts/${toggleTarget.id}`, {
        is_active: !Boolean(toggleTarget.is_active),
      });
      setToggleTarget(null);
      fetchDiscounts();
    } catch (e) { console.error(e); }
    finally { setToggleLoading(false); }
  };

  /* Delete */
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/admin/discounts/${deleteTarget.id}`);
      setDeleteTarget(null);
      fetchDiscounts();
    } catch (e) { console.error(e); }
    finally { setDeleteLoading(false); }
  };

  /* Helpers */
  const isExpired = (d: Discount) => d.expires_at ? new Date(d.expires_at) < new Date() : false;
  const isScheduled = (d: Discount) => d.starts_at ? new Date(d.starts_at) > new Date() : false;
  const targetPlanName = (id: string | null) => plans.find(p => p.id === id)?.name_en ?? null;

  const activeCount = discounts.filter(d => Boolean(d.is_active) && !isExpired(d)).length;

  return (
    <div className="space-y-5">

      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-zinc-400 text-xs">
            სულ <span className="text-zinc-200 font-semibold">{discounts.length}</span> ფასდაკლება
          </p>
          <span className="text-zinc-700 text-xs">·</span>
          <p className="text-zinc-600 text-xs">
            <span className="text-orange-400 font-semibold">{activeCount}</span> აქტიური
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="ძიება სახელით…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-52 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <button
            onClick={() => { setShowAdd(true); setAddError(null); }}
            className="cursor-pointer shrink-0 bg-orange-600 hover:bg-orange-500 transition-colors text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            ფასდაკლების დამატება
          </button>
        </div>
      </div>

      {/* ── Add form ── */}
      {showAdd && (
        <DiscountForm
          form={addForm}
          setForm={setAddForm}
          plans={plans}
          error={addError}
          onSave={handleAdd}
          onCancel={() => { setShowAdd(false); setAddError(null); }}
          saving={addLoading}
        />
      )}

      {/* ── Cards grid ── */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
          <IconSpinner /><span>Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-600">
          <div className="text-zinc-700"><IconTag /></div>
          <p className="text-sm font-medium">ფასდაკლებები ვერ მოიძებნა</p>
          <p className="text-xs text-zinc-700">დაამატეთ პირველი ფასდაკლება ან სეილი</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {filtered.map(d => {
            const expired = isExpired(d);
            const scheduled = isScheduled(d);
            const active = Boolean(d.is_active) && !expired;

            return (
              <div key={d.id} className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-2xl p-4 flex flex-col gap-3">
                {/* Header row */}
                <div className="flex items-start gap-3">
                  {/* Icon */}
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${active ? "bg-orange-500/10 border-orange-500/20 text-orange-400" : "bg-zinc-800 border-zinc-700 text-zinc-600"}`}>
                    <IconTag />
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-zinc-100 truncate leading-tight">{d.name}</p>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                      {active && !expired && !scheduled && (
                        <span className="inline-flex items-center gap-1 text-[0.55rem] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-md">
                          <span className="w-1 h-1 rounded-full bg-emerald-400 inline-block" />აქტიური
                        </span>
                      )}
                      {scheduled && Boolean(d.is_active) && (
                        <span className="text-[0.55rem] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded-md">დაგეგმილი</span>
                      )}
                      {expired && (
                        <span className="text-[0.55rem] font-medium bg-zinc-800 text-zinc-600 border border-zinc-700 px-1.5 py-0.5 rounded-md">გასული</span>
                      )}
                      {!Boolean(d.is_active) && !expired && (
                        <span className="text-[0.55rem] font-medium bg-zinc-800 text-zinc-500 border border-zinc-700 px-1.5 py-0.5 rounded-md">გათიშული</span>
                      )}
                      {Boolean(d.is_global) ? (
                        <span className="text-[0.55rem] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 px-1.5 py-0.5 rounded-md">🌐 გლობალური</span>
                      ) : (
                        <span className="text-[0.55rem] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-md">👤 მიზნობრივი</span>
                      )}
                    </div>
                  </div>
                  <DiscountMenu
                    discount={d}
                    onEdit={() => setEditTarget(d)}
                    onToggle={() => setToggleTarget(d)}
                    onAssign={() => setAssignTarget(d)}
                    onDelete={() => setDeleteTarget(d)}
                  />
                </div>

                {/* Value */}
                <div className="flex items-center justify-between bg-zinc-800/60 rounded-xl px-3 py-2.5">
                  <span className="text-[0.65rem] text-zinc-500">ფასდაკლება</span>
                  <span className={`text-xl font-bold leading-none ${active ? "text-orange-400" : "text-zinc-600"}`}>
                    {d.value}₾
                  </span>
                </div>

                {/* Meta row */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-800/40 rounded-lg px-2.5 py-2">
                    <p className="text-[0.55rem] text-zinc-600 uppercase tracking-wider mb-0.5">პაკეტი</p>
                    <p className="text-[0.65rem] text-zinc-300 font-medium truncate">
                      {d.target_id ? (targetPlanName(d.target_id) ?? "—") : "ყველა"}
                    </p>
                  </div>
                  <div className="bg-zinc-800/40 rounded-lg px-2.5 py-2">
                    <p className="text-[0.55rem] text-zinc-600 uppercase tracking-wider mb-0.5">მომხმარებლები</p>
                    <p className="text-[0.65rem] text-zinc-300 font-medium">
                      {Boolean(d.is_global) ? "ყველა" : `${d.users_count ?? 0} მიბმული`}
                    </p>
                  </div>
                </div>

                {/* Dates */}
                {(d.starts_at || d.expires_at) && (
                  <div className="flex items-center gap-2 text-[0.6rem] text-zinc-600 border-t border-zinc-800 pt-2.5">
                    {d.starts_at && (
                      <span>
                        <span className="text-zinc-700">დასაწყისი: </span>
                        {new Date(d.starts_at).toLocaleDateString("ka-GE")}
                      </span>
                    )}
                    {d.starts_at && d.expires_at && <span className="text-zinc-800">·</span>}
                    {d.expires_at && (
                      <span className={expired ? "text-red-500/70" : ""}>
                        <span className={expired ? "text-red-600/60" : "text-zinc-700"}>დასასრული: </span>
                        {new Date(d.expires_at).toLocaleDateString("ka-GE")}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Edit modal ── */}
      {editTarget && (
        <EditDiscountModal
          discount={editTarget}
          plans={plans}
          onClose={() => setEditTarget(null)}
          onSaved={fetchDiscounts}
        />
      )}

      {/* ── Assign user modal ── */}
      {assignTarget && (
        <AssignUserModal
          discount={assignTarget}
          onClose={() => setAssignTarget(null)}
        />
      )}

      {/* ── Toggle confirm ── */}
      {toggleTarget && (
        <ConfirmModal
          message={
            Boolean(toggleTarget.is_active)
              ? `"${toggleTarget.name}" გამოირთვება. თავიდან ჩართვა შეიძლება ნებისმიერ დროს.`
              : `"${toggleTarget.name}" გააქტიურდება და ხელმისაწვდომი გახდება.`
          }
          onConfirm={handleToggle}
          onCancel={() => setToggleTarget(null)}
        />
      )}

      {/* ── Delete confirm ── */}
      {deleteTarget && (
        <ConfirmModal
          message={`"${deleteTarget.name}" სამუდამოდ წაიშლება. ეს ქმედება შეუქცევადია.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          danger
        />
      )}

      {/* Loading overlay for toggle/delete actions */}
      {(toggleLoading || deleteLoading) && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl px-5 py-3 flex items-center gap-2.5 text-zinc-300 text-sm">
            <IconSpinner />
            <span>{deleteLoading ? "წაშლა…" : "განახლება…"}</span>
          </div>
        </div>
      )}
    </div>
  );
}
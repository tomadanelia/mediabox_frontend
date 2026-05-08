import { useState, useEffect, useRef } from "react";
import api from "../../src/lib/axios";


interface Plan {
  id: string;
  name_en: string;
  name_ka: string;
  description_en?: string;
  description_ka?: string;
  price: number;
  duration_days: number;
  is_active: boolean | number;
  is_public: boolean;
}

interface PlanChannel {
  id: string;
  name: string;
  number?: number;
  icon_url?: string;
  external_id?: string;
}

interface PlanBundle {
  bundle_id: string;
  bundle_name: string;
  bundle_type: "tv" | "radio" | "module";
  items: {
    channels: PlanChannel[];
    radios: PlanChannel[];
  };
}

interface PlanBundlesData {
  plan_id: string;
  bundles: PlanBundle[];
}

const IconSpinner = () => (
  <svg className="animate-spin shrink-0" width="13" height="13" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2"/>
    <path d="M7 1a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
const IconDisable = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/><path d="M4.5 4.5l7 7"/>
  </svg>
);
const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/>
  </svg>
);
const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <path d="M3 5l4 4 4-4"/>
  </svg>
);
const IconChannels = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="14" height="10" rx="1.5"/><path d="M5 7h6M5 10h4"/>
  </svg>
);

const TypeBadge = ({ type }: { type: "tv" | "radio" | "module" }) => {
  const map = {
    tv:     { label: "TV",     cls: "bg-violet-500/15 text-violet-300 border-violet-500/25" },
    radio:  { label: "Radio",  cls: "bg-sky-500/15 text-sky-300 border-sky-500/25" },
    module: { label: "Module", cls: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  };
  const { label, cls } = map[type];
  return (
    <span className={`inline-flex items-center text-[0.58rem] font-semibold border px-1.5 py-0.5 rounded-md ${cls}`}>
      {label}
    </span>
  );
};

/* ─────────────────────────────────────────
   PLAN MENU (three-dots)
───────────────────────────────────────── */
function PlanMenu({
  isActive, onManage, onEdit, onDisable, onEnable, onDelete,
}: {
  isActive: boolean;
  onManage: () => void;
  onEdit: () => void;
  onDisable: () => void;
  onEnable: () => void;
  onDelete: () => void;
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
          <button onClick={() => { setOpen(false); onManage(); }}
            className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors">
            <IconChannels /><span>შემავალი არხები</span>
          </button>
          <button onClick={() => { setOpen(false); onEdit(); }}
            className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors">
            <IconEdit /><span>რედაქტირება</span>
          </button>
          {isActive ? (
            <button onClick={() => { setOpen(false); onDisable(); }}
              className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors">
              <IconDisable /><span>გამორთვა</span>
            </button>
          ) : (
            <button onClick={() => { setOpen(false); onEnable(); }}
              className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-emerald-400 hover:bg-emerald-500/10 transition-colors">
              <IconCheck /><span>ჩართვა</span>
            </button>
          )}
          <div className="my-1 border-t border-zinc-700/60" />
          <button onClick={() => { setOpen(false); onDelete(); }}
            className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors">
            <IconTrash /><span>პაკეტის წაშლა</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   BUNDLE ROW — shown inside the manage modal
───────────────────────────────────────── */
function BundleRow({
  bundle,
  onDetach,
  detaching,
}: {
  bundle: PlanBundle;
  onDetach: () => void;
  detaching: boolean;
}) {
  const [open, setOpen] = useState(false);
  const items = bundle.bundle_type === "radio" ? bundle.items.radios : bundle.items.channels;
  const count = items.length;

  return (
    <div className="border border-zinc-800 rounded-xl overflow-hidden">
      {/* Header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="cursor-pointer w-full flex items-center gap-3 px-4 py-3 hover:bg-zinc-800/40 transition-colors"
      >
        <div className={`w-1 h-8 rounded-full shrink-0 ${
          bundle.bundle_type === "tv" ? "bg-violet-500/60"
          : bundle.bundle_type === "radio" ? "bg-sky-500/60"
          : "bg-amber-500/60"
        }`} />
        <div className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="text-zinc-200 text-xs font-semibold truncate">{bundle.bundle_name}</span>
            <TypeBadge type={bundle.bundle_type} />
          </div>
          <p className="text-[0.6rem] text-zinc-600 mt-0.5">
            {count} {bundle.bundle_type === "radio" ? "რადიო" : "არხი"}
          </p>
        </div>
        <button
  onClick={e => { e.stopPropagation(); onDetach(); }}
  disabled={detaching}
  title="შეკვრის მოხსნა"
  className="cursor-pointer flex items-center gap-1 text-[0.6rem] font-medium text-zinc-600 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 px-2 py-1 rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
>
  {detaching ? (
    <IconSpinner />
  ) : (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M6 10l4-4M8.5 4.5l1.5-1.5a3.536 3.536 0 115 5L13.5 9.5M7.5 11.5l-1.5 1.5a3.536 3.536 0 01-5-5L2.5 6.5"/>
    </svg>
  )}
  მოხსნა
</button>
<IconChevron open={open} />
        <IconChevron open={open} />
      </button>

      {/* Channel list */}
      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950/30 px-4 py-3">
          {count === 0 ? (
            <p className="text-zinc-700 text-xs py-1 italic">ელემენტები არ არის</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {items.map(ch => (
                <div key={ch.id}
                  className="flex items-center gap-1.5 bg-zinc-800/70 border border-zinc-700/40 rounded-lg px-2 py-1.5">
                  {ch.icon_url ? (
                    <img
                      src={ch.icon_url}
                      className="w-4 h-4 object-contain rounded shrink-0"
                      onError={e => (e.currentTarget.style.display = "none")}
                    />
                  ) : (
                    <span className="text-[0.65rem] shrink-0">
                      {bundle.bundle_type === "radio" ? "📻" : "📺"}
                    </span>
                  )}
                  <span className="text-zinc-300 text-xs">{ch.name}</span>
                  {ch.number != null && (
                    <span className="text-[0.55rem] font-mono text-zinc-600">#{ch.number}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────
   PLAN MANAGE MODAL — bundles + channels
───────────────────────────────────────── */
function PlanManageModal({
  plan,
  onClose,
}: {
  plan: Plan;
  onClose: () => void;
}) {
  const [data, setData] = useState<PlanBundlesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const backdropRef = useRef<HTMLDivElement>(null);
  const [detaching, setDetaching] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/plans/${plan.id}/channels`);
        setData(res.data);
      } catch {
        setData({ plan_id: plan.id, bundles: [] });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [plan.id]);

  const detachBundle = async (bundleId: string) => {
  setDetaching(bundleId);
  try {
    await api.delete(`/api/admin/plans/${plan.id}/bundles`, {
      data: { bundle_id: bundleId },
    });
    const res = await api.get(`/api/plans/${plan.id}/channels`);
    setData(res.data);
  } catch (e: any) {
    alert(e.response?.data?.message || "წაშლა ვერ მოხერხდა");
  } finally {
    setDetaching(null);
  }
};
  const totalChannels = data?.bundles.reduce((sum, b) => {
    const items = b.bundle_type === "radio" ? b.items.radios : b.items.channels;
    return sum + items.length;
  }, 0) ?? 0;

  const totalBundles = data?.bundles.length ?? 0;

  // filter bundles whose name or items match search
  const filtered = search.trim()
    ? (data?.bundles ?? []).filter(b =>
        b.bundle_name.toLowerCase().includes(search.toLowerCase()) ||
        [...b.items.channels, ...b.items.radios].some(ch =>
          ch.name.toLowerCase().includes(search.toLowerCase())
        )
      )
    : (data?.bundles ?? []);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg flex flex-col max-h-[82vh] shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.1l-4.76 2.55.91-5.3L2.3 7.6l5.3-.8L10 2z"
                stroke="#34d399" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-zinc-100 text-base leading-tight truncate">{plan.name_en}</h3>
            {loading ? (
              <p className="text-[0.65rem] text-zinc-500 mt-0.5 flex items-center gap-1.5"><IconSpinner /> Loading…</p>
            ) : (
              <p className="text-[0.65rem] text-zinc-500 mt-0.5">
                <span className="text-emerald-400 font-semibold">{totalBundles}</span> შეკვრა ·{" "}
                <span className="text-zinc-300 font-semibold">{totalChannels}</span> ელემენტი სულ
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >✕</button>
        </div>

        {/* Search */}
        {!loading && totalBundles > 0 && (
          <div className="px-4 pt-3 pb-0">
            <input
              type="text"
              placeholder="შეკვრა ან არხი…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-zinc-600 transition-colors"
            />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-16 text-zinc-500 text-sm">
              <IconSpinner /><span>Loading…</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-14 gap-3 text-zinc-600">
              <svg width="38" height="38" viewBox="0 0 40 40" fill="none">
                <rect x="5" y="8" width="30" height="24" rx="4" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M13 16h14M13 22h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              <p className="text-sm font-medium">
                {search ? "ვერ მოიძებნა" : "შეკვრები არ მოიძებნა"}
              </p>
              {!search && (
                <p className="text-xs text-zinc-700 text-center max-w-52">
                  შეკვრები ამ პაკეტს არ აქვს მინიჭებული. გადადი შეკვრების განყოფილებაში.
                </p>
              )}
            </div>
          ) : (
            filtered.map(bundle => (
  <BundleRow
    key={bundle.bundle_id}
    bundle={bundle}
    onDetach={() => detachBundle(bundle.bundle_id)}
    detaching={detaching === bundle.bundle_id}
  />
))
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 flex items-center gap-2 text-[0.65rem] text-zinc-600">
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
            <path d="M5.5 5v3M5.5 3.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          </svg>
          შეკვრების მართვა → "შეკვრები" განყოფილება
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PLAN EDIT MODAL
───────────────────────────────────────── */
function PlanEditModal({
  plan,
  onClose,
  onSaved,
}: {
  plan: Plan;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name_en: plan.name_en,
    name_ka: plan.name_ka,
    description_en: plan.description_en ?? "",
    description_ka: plan.description_ka ?? "",
    price: String(plan.price),
    duration_days: String(plan.duration_days),
    is_active: Boolean(plan.is_active),
    is_public: Boolean(plan.is_public),
  });
  const [saving, setSaving] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const submit = async () => {
    if (!form.name_en || !form.name_ka) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/plans/${plan.id}`, {
        ...form,
        price: parseFloat(form.price),
        duration_days: parseInt(form.duration_days),
      });
      onSaved();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
          <div>
            <h3 className="font-bold text-zinc-100">პაკეტის რედაქტირება</h3>
            <p className="text-[0.65rem] text-zinc-500 mt-0.5 font-mono">ID: {plan.id}</p>
          </div>
          <button onClick={onClose} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Name (EN)</label>
              <input className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
            </div>
            <div>
              <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">სახელი (KA)</label>
              <input className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.name_ka} onChange={e => setForm(f => ({ ...f, name_ka: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Description (EN)</label>
              <input className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} />
            </div>
            <div>
              <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">აღწერა (KA)</label>
              <input className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.description_ka} onChange={e => setForm(f => ({ ...f, description_ka: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">ფასი (₾)</label>
              <input type="number" min="0" step="0.01" className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
            </div>
            <div>
              <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">ხანგრძლივობა (დღე)</label>
              <input type="number" min="1" className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} />
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${form.is_active ? "bg-emerald-500" : "bg-zinc-700"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-xs text-zinc-400">
                {form.is_active ? <span className="text-emerald-400">აქტიური</span> : "გათიშული"}
              </span>
            </label>
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
                className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${form.is_public ? "bg-emerald-500" : "bg-zinc-700"}`}>
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_public ? "translate-x-4" : "translate-x-0.5"}`} />
              </div>
              <span className="text-xs text-zinc-400">გლობალური (ყველა მომხმარებლისთვის)</span>
            </label>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="cursor-pointer px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">გაუქმება</button>
          <button
            onClick={submit}
            disabled={saving || !form.name_en || !form.name_ka}
            className="cursor-pointer px-5 py-2 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
          >
            {saving ? <><IconSpinner />შენახვა…</> : <><IconCheck />შენახვა</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PLAN DISABLE/ENABLE MODAL
───────────────────────────────────────── */
function PlanToggleModal({
  plan,
  onClose,
  onDone,
}: {
  plan: Plan;
  onClose: () => void;
  onDone: () => void;
}) {
  const isActive = Boolean(plan.is_active);
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const submit = async () => {
    setLoading(true);
    try {
      await api.post(`/api/admin/plans/${plan.id}/${isActive ? "disable" : "enable"}`);
      onDone();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={backdropRef} className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="9"/><path d="M7 7l10 10"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-base">
              {isActive ? "პაკეტი გამოირთვება" : "პაკეტი გააქტიურდება"}
            </h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              <span className="text-zinc-300 font-medium">"{plan.name_en}"</span>{" "}
              {isActive
                ? "გამოირთვება და მომხმარებლები ვეღარ ნახავენ."
                : "გააქტიურდება და ყველა მომხმარებლისთვის ხელმისაწვდომი გახდება."
              }
            </p>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">გაუქმება</button>
          <button onClick={submit} disabled={loading}
            className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-medium transition-colors flex items-center justify-center gap-2">
            {loading ? <><IconSpinner />{isActive ? "ითიშება…" : "ირთვება…"}</> : isActive ? "გამორთვა" : "ჩართვა"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PLAN DELETE MODAL
───────────────────────────────────────── */
function PlanDeleteModal({
  plan,
  onClose,
  onDeleted,
}: {
  plan: Plan;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  const submit = async () => {
    setLoading(true);
    try {
      await api.delete(`/api/admin/plans/${plan.id}`);
      onDeleted();
      onClose();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={backdropRef} className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/><path d="M10 11v4M14 11v4"/>
            </svg>
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-base">პაკეტის წაშლა?</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              <span className="text-zinc-300 font-medium">"{plan.name_en}"</span> სამუდამოდ წაიშლება. ეს ქმედება შეუქცევადია.
            </p>
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">გაუქმება</button>
          <button onClick={submit} disabled={loading}
            className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-medium transition-colors flex items-center justify-center gap-2">
            {loading ? <><IconSpinner />წაშლა…</> : "წაშლა"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   ADD PLAN FORM
───────────────────────────────────────── */
function AddPlanForm({ onSaved, onCancel }: { onSaved: () => void; onCancel: () => void }) {
  const [form, setForm] = useState({
    name_en: "", name_ka: "", description_en: "", description_ka: "",
    price: "", duration_days: "", is_active: true, is_public: true,
  });
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!form.name_en || !form.name_ka || !form.price || !form.duration_days) return;
    setSaving(true);
    try {
      await api.post("/api/admin/plans", {
        ...form,
        price: parseFloat(form.price),
        duration_days: parseInt(form.duration_days),
      });
      onSaved();
    } catch (e: any) {
      alert(e.response?.data?.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 space-y-3 shadow-lg">
      <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">ახალი პაკეტი</p>
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Name (EN)" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.name_en} onChange={e => setForm(f => ({ ...f, name_en: e.target.value }))} />
        <input placeholder="სახელი (ქართულად)" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.name_ka} onChange={e => setForm(f => ({ ...f, name_ka: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input placeholder="Description (EN)" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.description_en} onChange={e => setForm(f => ({ ...f, description_en: e.target.value }))} />
        <input placeholder="აღწერა (ქართულად)" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.description_ka} onChange={e => setForm(f => ({ ...f, description_ka: e.target.value }))} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <input type="number" placeholder="ფასი (₾)" min="0" step="0.01" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
        <input type="number" placeholder="ხანგრძლივობა (დღე)" min="1" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={form.duration_days} onChange={e => setForm(f => ({ ...f, duration_days: e.target.value }))} />
      </div>
      <div className="flex gap-5">
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${form.is_active ? "bg-emerald-500" : "bg-zinc-700"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-xs text-zinc-400">აქტიური</span>
        </label>
        <label className="flex items-center gap-2.5 cursor-pointer select-none">
          <div onClick={() => setForm(f => ({ ...f, is_public: !f.is_public }))}
            className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${form.is_public ? "bg-emerald-500" : "bg-zinc-700"}`}>
            <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_public ? "translate-x-4" : "translate-x-0.5"}`} />
          </div>
          <span className="text-xs text-zinc-400">გლობალური</span>
        </label>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={submit}
          disabled={saving || !form.name_en || !form.name_ka || !form.price || !form.duration_days}
          className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-1.5"
        >
          {saving ? <><IconSpinner />შენახვა…</> : <><IconCheck />შენახვა</>}
        </button>
        <button onClick={onCancel} className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs transition-colors">გაუქმება</button>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PLAN CARD — with inline bundle preview
───────────────────────────────────────── */
function PlanCard({
  plan,
  onManage,
  onEdit,
  onToggle,
  onDelete,
}: {
  plan: Plan;
  onManage: () => void;
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const isActive = Boolean(plan.is_active);

  return (
    <div className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-2xl p-4 flex items-start gap-4">
      {/* Icon */}
      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.1l-4.76 2.55.91-5.3L2.3 7.6l5.3-.8L10 2z"
            stroke="#34d399" strokeWidth="1.4" strokeLinejoin="round"/>
        </svg>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-semibold text-zinc-100 truncate leading-tight">{plan.name_en}</p>
          {isActive
            ? <span className="inline-flex items-center gap-1 text-[0.6rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-md font-medium">აქტიური</span>
            : <span className="inline-flex items-center gap-1 text-[0.6rem] bg-zinc-700/50 text-zinc-500 border border-zinc-700 px-1.5 py-0.5 rounded-md font-medium">გათიშული</span>
          }
          {!plan.is_public && (
            <span className="inline-flex items-center gap-1 text-[0.6rem] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-1.5 py-0.5 rounded-md font-medium">პირადი</span>
          )}
        </div>
        <p className="text-[0.65rem] text-zinc-500 truncate mt-0.5">{plan.name_ka}</p>
        <div className="flex items-center gap-3 mt-2">
          <span className="text-emerald-400 font-bold text-sm">{plan.price} ₾</span>
          <span className="text-zinc-700 text-[0.6rem]">·</span>
          <span className="text-[0.65rem] text-zinc-500">{plan.duration_days} დღე</span>
        </div>
        {plan.description_en && (
          <p className="text-[0.62rem] text-zinc-600 mt-1.5 truncate">{plan.description_en}</p>
        )}

        {/* View bundles button */}
        <button
          onClick={onManage}
          className="cursor-pointer mt-3 flex items-center gap-1.5 text-[0.65rem] text-zinc-500 hover:text-zinc-300 border border-zinc-800 hover:border-zinc-600 px-2.5 py-1 rounded-lg transition-colors"
        >
          <IconChannels />
          შეკვრები და არხები
        </button>
      </div>

      {/* Menu */}
      <PlanMenu
        isActive={isActive}
        onManage={onManage}
        onEdit={onEdit}
        onDisable={onToggle}
        onEnable={onToggle}
        onDelete={onDelete}
      />
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
export default function AdminPlansSection() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  // modals
  const [manageTarget, setManageTarget] = useState<Plan | null>(null);
  const [editTarget, setEditTarget]     = useState<Plan | null>(null);
  const [toggleTarget, setToggleTarget] = useState<Plan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);

  const fetchPlans = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/plans/all");
      const data = res.data;
      setPlans(Array.isArray(data) ? data : data.data ?? []);
    } catch { /**/ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchPlans(); }, []);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex justify-between items-center">
        <p className="text-zinc-400 text-xs">სულ <span className="text-zinc-200 font-semibold">{plans.length}</span> პაკეტი</p>
        <button
          onClick={() => setShowAdd(true)}
          className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 transition-colors text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5"
        >
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          პაკეტის დამატება
        </button>
      </div>

      {showAdd && (
        <AddPlanForm
          onSaved={() => { fetchPlans(); setShowAdd(false); }}
          onCancel={() => setShowAdd(false)}
        />
      )}

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-zinc-500 text-sm">
          <IconSpinner /><span>Loading…</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-600">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <path d="M20 5l5 10 11 1.7-8 7.8 1.9 11L20 30l-9.9 5.5 1.9-11L4 17.7l11-1.7L20 5z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
          <p className="text-sm font-medium">პაკეტები ვერ მოიძებნა</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {plans.map(plan => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onManage={() => setManageTarget(plan)}
              onEdit={() => setEditTarget(plan)}
              onToggle={() => setToggleTarget(plan)}
              onDelete={() => setDeleteTarget(plan)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {manageTarget && (
        <PlanManageModal plan={manageTarget} onClose={() => setManageTarget(null)} />
      )}
      {editTarget && (
        <PlanEditModal plan={editTarget} onClose={() => setEditTarget(null)} onSaved={fetchPlans} />
      )}
      {toggleTarget && (
        <PlanToggleModal plan={toggleTarget} onClose={() => setToggleTarget(null)} onDone={fetchPlans} />
      )}
      {deleteTarget && (
        <PlanDeleteModal plan={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={fetchPlans} />
      )}
    </div>
  );
}
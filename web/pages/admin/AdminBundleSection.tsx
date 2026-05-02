import { useState, useEffect, useRef } from "react";
import api from "../../src/lib/axios";

/* ─────────────────────────────────────────
   TYPES
───────────────────────────────────────── */
interface Bundle {
  id: string;
  slug: string;
  name: string;
  type: "tv" | "radio" | "module";
  is_active: boolean | number;
  items_count?: number;
  plans?: { id: string; name_en: string }[];
}

interface BundleItem {
  item_id: string | number;
  item_type: 1 | 2 | 3;
  name?: string;
  name_en?: string;
  logo?: string;
  icon_url?: string;
}

interface Plan {
  id: string;
  name_en: string;
  name_ka: string;
  price: number;
  duration_days: number;
  is_active: boolean | number;
}

interface Channel {
  id: number;
  uuid: string;
  name: string;
  logo?: string;
}

interface RadioChannel {
  id: number;
  uuid?: string;
  name: string;
  logo?: string;
}

interface AppModule {
  id: number;
  slug: string;
  name: string;
  is_active: boolean;
}

/* ─────────────────────────────────────────
   SMALL ICONS
───────────────────────────────────────── */
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

const IconTrash = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h12M6 4V2h4v2M5 4l.5 9h5l.5-9"/>
  </svg>
);

const IconEdit = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z"/>
  </svg>
);

const IconChevron = ({ open }: { open: boolean }) => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
    <path d="M3 5l4 4 4-4"/>
  </svg>
);

const IconPlus = () => (
  <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
    <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

const IconLink = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 10l4-4M8.5 4.5l1.5-1.5a3.536 3.536 0 115 5L13.5 9.5M7.5 11.5l-1.5 1.5a3.536 3.536 0 01-5-5L2.5 6.5"/>
  </svg>
);

const TypeBadge = ({ type }: { type: string }) => {
  const map: Record<string, { label: string; cls: string }> = {
    tv:     { label: "TV",     cls: "bg-violet-500/15 text-violet-300 border-violet-500/25" },
    radio:  { label: "Radio",  cls: "bg-sky-500/15 text-sky-300 border-sky-500/25" },
    module: { label: "Module", cls: "bg-amber-500/15 text-amber-300 border-amber-500/25" },
  };
  const { label, cls } = map[type] ?? { label: type, cls: "bg-zinc-700 text-zinc-400 border-zinc-600" };
  return (
    <span className={`inline-flex items-center text-[0.6rem] font-semibold border px-2 py-0.5 rounded-md ${cls}`}>
      {label}
    </span>
  );
};

/* ─────────────────────────────────────────
   BUNDLE ITEMS PANEL (inline expanded row)
───────────────────────────────────────── */
function BundleItemsPanel({
  bundle,
  onItemsChanged,
}: {
  bundle: Bundle;
  onItemsChanged: () => void;
}) {
  const [items, setItems] = useState<BundleItem[]>([]);
  const [loading, setLoading] = useState(true);

  /* available items for adding */
  const [channels, setChannels]   = useState<Channel[]>([]);
  const [radios, setRadios]       = useState<RadioChannel[]>([]);
  const [modules, setModules]     = useState<AppModule[]>([]);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

  /* add-item UI */
  const [addOpen, setAddOpen]         = useState(false);
  const [addSearch, setAddSearch]     = useState("");
  const [selectedIds, setSelectedIds] = useState<Array<{ item_id: string | number; item_type: 1 | 2 | 3 }>>([]);
  const [adding, setAdding]           = useState(false);
  const [removing, setRemoving]       = useState<string | null>(null);

  const typeForBundle: 1 | 2 | 3 = bundle.type === "tv" ? 1 : bundle.type === "radio" ? 2 : 3;

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/bundles/${bundle.id}`);
      setItems(res.data.items ?? []);
    } catch { setItems([]); }
    finally { setLoading(false); }
  };

  const loadResources = async () => {
    if (resourcesLoaded) return;
    try {
      if (bundle.type === "tv") {
        const r = await api.get("/api/admin/channels");
        setChannels(Array.isArray(r.data) ? r.data : r.data.data ?? []);
      } else if (bundle.type === "radio") {
        const r = await api.get("/api/admin/radios");
        setRadios(Array.isArray(r.data) ? r.data : r.data.data ?? []);
      } else {
        const r = await api.get("/api/admin/modules");
        setModules(Array.isArray(r.data) ? r.data : r.data.data ?? []);
      }
      setResourcesLoaded(true);
    } catch { /**/ }
  };

  useEffect(() => { loadItems(); }, [bundle.id]);

  const removeItem = async (itemId: string | number, itemType: number) => {
    const key = `${itemType}-${itemId}`;
    setRemoving(key);
    try {
      await api.delete(`/api/admin/bundles/${bundle.id}/items`, {
        data: { item_id: itemId, item_type: itemType },
      });
      await loadItems();
      onItemsChanged();
    } catch { /**/ }
    finally { setRemoving(null); }
  };

  const addItems = async () => {
    if (!selectedIds.length) return;
    setAdding(true);
    try {
      for (const { item_id, item_type } of selectedIds) {
        await api.post(`/api/admin/bundles/${bundle.id}/items`, { item_id, item_type });
      }
      setSelectedIds([]);
      setAddOpen(false);
      setAddSearch("");
      await loadItems();
      onItemsChanged();
    } catch { /**/ }
    finally { setAdding(false); }
  };

  const openAdd = () => {
    loadResources();
    setAddOpen(o => !o);
  };

  /* build list of available items not yet in bundle */
  const existingIds = new Set(items.map(i => String(i.item_id)));
  const availableList: Array<{ id: string | number; name: string; logo?: string }> =
    bundle.type === "tv"
      ? channels.filter(c => !existingIds.has(String(c.id)))
      : bundle.type === "radio"
      ? radios.filter(r => !existingIds.has(String(r.id)))
      : modules.filter(m => !existingIds.has(String(m.id)));

  const filtered = availableList.filter(i =>
    (i.name ?? "").toLowerCase().includes(addSearch.toLowerCase())
  );

  const toggleSelect = (id: string | number) => {
    const entry = { item_id: id, item_type: typeForBundle };
    setSelectedIds(prev =>
      prev.some(x => String(x.item_id) === String(id))
        ? prev.filter(x => String(x.item_id) !== String(id))
        : [...prev, entry]
    );
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/40">
      {/* items list */}
      <div className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500 text-xs py-2">
            <Spinner />Loading items…
          </div>
        ) : items.length === 0 ? (
          <p className="text-zinc-700 text-xs py-2">ელემენტები არ არის დამატებული</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {items.map((item, idx) => {
              const name = item.name ?? item.name_en ?? `#${item.item_id}`;
              const logo = item.logo ?? item.icon_url;
              const key  = `${item.item_type}-${item.item_id}`;
              return (
                <div
                  key={idx}
                  className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-2.5 py-1.5 group"
                >
                  {logo && (
                    <img src={logo} className="w-4 h-4 object-contain shrink-0" onError={e => (e.currentTarget.style.display = "none")} />
                  )}
                  <span className="text-zinc-300 text-xs">{name}</span>
                  <button
                    onClick={() => removeItem(item.item_id, item.item_type)}
                    disabled={removing === key}
                    className="cursor-pointer ml-1 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
                  >
                    {removing === key ? <Spinner /> : <span className="text-[0.7rem] leading-none">✕</span>}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add items section */}
      <div className="px-4 pb-4">
        <button
          onClick={openAdd}
          className="cursor-pointer flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          <IconPlus />
          <span>ელემენტის დამატება</span>
          <IconChevron open={addOpen} />
        </button>

        {addOpen && (
          <div className="mt-3 space-y-2">
            <input
              type="text"
              placeholder="ძიება…"
              value={addSearch}
              onChange={e => setAddSearch(e.target.value)}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <div className="max-h-48 overflow-y-auto space-y-1 rounded-xl bg-zinc-900 border border-zinc-800 p-2">
              {!resourcesLoaded ? (
                <div className="flex items-center gap-2 text-zinc-500 text-xs p-2"><Spinner />Loading…</div>
              ) : filtered.length === 0 ? (
                <p className="text-zinc-600 text-xs p-2">ვერ მოიძებნა</p>
              ) : filtered.map(item => {
                const isSelected = selectedIds.some(x => String(x.item_id) === String(item.id));
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors select-none ${
                      isSelected
                        ? "bg-violet-500/15 border border-violet-500/30"
                        : "hover:bg-zinc-800 border border-transparent"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "border-violet-500 bg-violet-500" : "border-zinc-600"
                    }`}>
                      {isSelected && <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1.5 5l2.5 2.5 4.5-4.5"/></svg>}
                    </div>
                    {(item as any).logo && (
                      <img src={(item as any).logo} className="w-5 h-5 object-contain shrink-0" onError={e => (e.currentTarget.style.display = "none")} />
                    )}
                    <span className="text-zinc-300 text-xs truncate">{item.name}</span>
                  </div>
                );
              })}
            </div>
            {selectedIds.length > 0 && (
              <button
                onClick={addItems}
                disabled={adding}
                className="cursor-pointer flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
              >
                {adding ? <><Spinner />დამატება…</> : <><IconCheck />{selectedIds.length} ელემენტის დამატება</>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PLAN ATTACH PANEL (inside bundle row)
───────────────────────────────────────── */
function BundlePlanPanel({
  bundle,
  plans,
  onChanged,
}: {
  bundle: Bundle;
  plans: Plan[];
  onChanged: () => void;
}) {
  const [attachedPlanIds, setAttachedPlanIds] = useState<string[]>(
    (bundle.plans ?? []).map(p => String(p.id))
  );
  const [busy, setBusy] = useState<string | null>(null);

  const toggle = async (planId: string) => {
    const attached = attachedPlanIds.includes(planId);
    setBusy(planId);
    try {
      if (attached) {
        await api.delete(`/api/admin/plans/${planId}/bundles`, { data: { bundle_id: bundle.id } });
        setAttachedPlanIds(prev => prev.filter(id => id !== planId));
      } else {
        await api.post(`/api/admin/plans/${planId}/bundles`, { bundle_id: bundle.id });
        setAttachedPlanIds(prev => [...prev, planId]);
      }
      onChanged();
    } catch { /**/ }
    finally { setBusy(null); }
  };

  const activePlans = plans.filter(p => Boolean(p.is_active));

  return (
    <div className="px-4 pb-4 pt-1 border-t border-zinc-800/50">
      <p className="text-[0.6rem] uppercase tracking-widest text-zinc-600 mb-2">მინიჭებული პაკეტები</p>
      <div className="flex flex-wrap gap-2">
        {activePlans.map(plan => {
          const isOn = attachedPlanIds.includes(String(plan.id));
          const isBusy = busy === String(plan.id);
          return (
            <button
              key={plan.id}
              onClick={() => toggle(String(plan.id))}
              disabled={isBusy}
              className={`cursor-pointer flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isOn
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30"
                  : "bg-zinc-800/60 text-zinc-500 border-zinc-700/50 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/25"
              }`}
            >
              {isBusy
                ? <Spinner />
                : isOn
                ? <IconLink />
                : <IconPlus />
              }
              {plan.name_en}
            </button>
          );
        })}
        {activePlans.length === 0 && (
          <p className="text-zinc-700 text-xs">აქტიური პაკეტები არ მოიძებნა</p>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   CREATE / EDIT BUNDLE MODAL
───────────────────────────────────────── */
function BundleFormModal({
  existing,
  onClose,
  onSaved,
}: {
  existing?: Bundle | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(existing);
  const [form, setForm] = useState({
    name: existing?.name ?? "",
    slug: existing?.slug ?? "",
    type: existing?.type ?? "tv",
    is_active: existing ? Boolean(existing.is_active) : true,
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  /* auto-slug from name if creating */
  const handleNameChange = (v: string) => {
    setForm(f => ({
      ...f,
      name: v,
      slug: isEdit ? f.slug : v.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""),
    }));
  };

  const submit = async () => {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSaving(true); setErr(null);
    try {
      if (isEdit && existing) {
        await api.put(`/api/admin/bundles/${existing.id}`, form);
      } else {
        await api.post("/api/admin/bundles", form);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setErr(e.response?.data?.message || "შეცდომა");
    } finally { setSaving(false); }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-zinc-100">{isEdit ? "შეკვრის რედაქტირება" : "ახალი შეკვრა"}</h3>
          <button onClick={onClose} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">✕</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">სახელი</label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
              value={form.name}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Bundle name"
            />
          </div>
          <div>
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Slug</label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm font-mono focus:outline-none focus:border-zinc-500 transition-colors"
              value={form.slug}
              onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
              placeholder="my-bundle"
            />
          </div>
          <div>
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-2">ტიპი</label>
            <div className="flex gap-2">
              {(["tv", "radio", "module"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setForm(f => ({ ...f, type: t }))}
                  className={`cursor-pointer flex-1 py-2 rounded-xl text-xs font-medium border transition-all capitalize ${
                    form.type === t
                      ? t === "tv"    ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                      : t === "radio" ? "bg-sky-500/15 text-sky-300 border-sky-500/30"
                                      : "bg-amber-500/15 text-amber-300 border-amber-500/30"
                      : "bg-zinc-800/50 text-zinc-500 border-zinc-700/50 hover:border-zinc-600"
                  }`}
                >
                  {t === "tv" ? "TV" : t === "radio" ? "Radio" : "Module"}
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <div
              onClick={() => setForm(f => ({ ...f, is_active: !f.is_active }))}
              className={`relative w-9 h-5 rounded-full transition-colors cursor-pointer ${form.is_active ? "bg-emerald-500" : "bg-zinc-700"}`}
            >
              <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.is_active ? "translate-x-4" : "translate-x-0.5"}`} />
            </div>
            <span className="text-xs text-zinc-400">აქტიური</span>
          </label>
          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button onClick={onClose} className="cursor-pointer px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">გაუქმება</button>
          <button
            onClick={submit}
            disabled={saving || !form.name.trim() || !form.slug.trim()}
            className="cursor-pointer px-5 py-2 rounded-xl text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
          >
            {saving ? <><Spinner />შენახვა…</> : <><IconCheck />{isEdit ? "განახლება" : "შექმნა"}</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   DELETE CONFIRM MODAL
───────────────────────────────────────── */
function DeleteBundleModal({
  bundle,
  onClose,
  onDeleted,
}: {
  bundle: Bundle;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const doDelete = async () => {
    setLoading(true); setErr(null);
    try {
      await api.delete(`/api/admin/bundles/${bundle.id}`);
      onDeleted();
      onClose();
    } catch (e: any) {
      setErr(e.response?.data?.message || "წაშლა ვერ მოხერხდა");
    } finally { setLoading(false); }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="p-6 flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
            <IconTrash />
          </div>
          <div>
            <h3 className="font-bold text-zinc-100 text-base">შეკვრის წაშლა?</h3>
            <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
              <span className="text-zinc-300 font-medium">"{bundle.name}"</span> სამუდამოდ წაიშლება.<br/>
              თუ შეკვრა პაკეტს უკავშირდება, წაშლა შეუძლებელი იქნება.
            </p>
            {err && <p className="text-xs text-red-400 mt-2">{err}</p>}
          </div>
        </div>
        <div className="px-5 pb-5 flex gap-2">
          <button onClick={onClose} className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">გაუქმება</button>
          <button
            onClick={doDelete}
            disabled={loading}
            className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-red-600 hover:bg-red-500 disabled:opacity-40 text-white font-medium transition-colors flex items-center justify-center gap-2"
          >
            {loading ? <><Spinner />წაშლა…</> : "წაშლა"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   MAIN EXPORT
───────────────────────────────────────── */
interface Props {
  plans: { id: string; name_en: string; name_ka: string; price: number; duration_days: number; is_active: boolean | number }[];
}

export default function AdminBundlesSection({ plans }: Props) {
  const [bundles, setBundles]     = useState<Bundle[]>([]);
  const [loading, setLoading]     = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPlansId, setShowPlansId] = useState<string | null>(null);
  const [search, setSearch]       = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "tv" | "radio" | "module">("all");
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget]   = useState<Bundle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bundle | null>(null);

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/bundles");
      setBundles(Array.isArray(res.data) ? res.data : res.data.data ?? []);
    } catch { /**/ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchBundles(); }, []);

  const filtered = bundles.filter(b => {
    const matchesSearch = b.name.toLowerCase().includes(search.toLowerCase()) ||
      b.slug.toLowerCase().includes(search.toLowerCase());
    const matchesType = typeFilter === "all" || b.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const typeCounts = {
    all:    bundles.length,
    tv:     bundles.filter(b => b.type === "tv").length,
    radio:  bundles.filter(b => b.type === "radio").length,
    module: bundles.filter(b => b.type === "module").length,
  };

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? null : id);
    setShowPlansId(null);
  };

  const togglePlans = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setShowPlansId(prev => prev === id ? null : id);
    setExpandedId(null);
  };

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {(["all", "tv", "radio", "module"] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                typeFilter === t
                  ? "bg-zinc-700 text-zinc-100 border-zinc-600"
                  : "text-zinc-500 border-zinc-800 hover:border-zinc-700 hover:text-zinc-300"
              }`}
            >
              {t === "all" ? "ყველა" : t === "tv" ? "TV" : t === "radio" ? "Radio" : "Module"}
              <span className={`text-[0.58rem] font-mono px-1 py-0.5 rounded ${typeFilter === t ? "bg-zinc-600 text-zinc-300" : "bg-zinc-800 text-zinc-600"}`}>
                {typeCounts[t]}
              </span>
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="ძიება სახელი ან slug…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-56 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <button
            onClick={() => setCreateModal(true)}
            className="cursor-pointer flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 transition-colors text-white px-4 py-2 rounded-xl text-xs font-medium shrink-0"
          >
            <IconPlus />
            შეკვრის შექმნა
          </button>
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
          <Spinner /><span>Loading…</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-600">
          <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
            <rect x="5" y="8" width="30" height="24" rx="4" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M13 16h14M13 22h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-medium">შეკვრები ვერ მოიძებნა</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(bundle => {
            const isExpanded  = expandedId  === bundle.id;
            const showingPlans = showPlansId === bundle.id;

            return (
              <div
                key={bundle.id}
                className={`bg-zinc-900 border rounded-2xl overflow-hidden transition-colors ${
                  isExpanded || showingPlans ? "border-zinc-700" : "border-zinc-800 hover:border-zinc-700"
                }`}
              >
                {/* Main row */}
                <div
                  className="flex items-center gap-4 px-4 py-3 cursor-pointer select-none"
                  onClick={() => toggleExpand(bundle.id)}
                >
                  {/* Type accent */}
                  <div className={`w-1.5 h-10 rounded-full shrink-0 ${
                    bundle.type === "tv" ? "bg-violet-500/60" : bundle.type === "radio" ? "bg-sky-500/60" : "bg-amber-500/60"
                  }`} />

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-zinc-100 font-semibold text-sm">{bundle.name}</span>
                      <TypeBadge type={bundle.type} />
                      {!Boolean(bundle.is_active) && (
                        <span className="text-[0.6rem] bg-zinc-800 text-zinc-600 border border-zinc-700 px-1.5 py-0.5 rounded-md">გათიშული</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="font-mono text-[0.6rem] text-zinc-600">{bundle.slug}</span>
                      {bundle.items_count != null && (
                        <span className="text-[0.6rem] text-zinc-500">
                          <span className="text-zinc-300 font-semibold">{bundle.items_count}</span> ელემენტი
                        </span>
                      )}
                      {(bundle.plans?.length ?? 0) > 0 && (
                        <span className="text-[0.6rem] text-emerald-400">
                          {bundle.plans!.length} პაკეტში
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0" onClick={e => e.stopPropagation()}>
                    {/* Plans toggle */}
                    <button
                      onClick={e => togglePlans(e, bundle.id)}
                      className={`cursor-pointer flex items-center gap-1.5 text-[0.65rem] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                        showingPlans
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
                          : "text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      <IconLink />
                      პაკეტები
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setEditTarget(bundle); }}
                      className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                    >
                      <IconEdit />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(bundle); }}
                      className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <IconTrash />
                    </button>
                    <div className={`text-zinc-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
                      <IconChevron open={isExpanded} />
                    </div>
                  </div>
                </div>

                {/* Expanded: items */}
                {isExpanded && (
                  <BundleItemsPanel
                    bundle={bundle}
                    onItemsChanged={fetchBundles}
                  />
                )}

                {/* Plan attach panel */}
                {showingPlans && (
                  <BundlePlanPanel
                    bundle={bundle}
                    plans={plans}
                    onChanged={fetchBundles}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      {createModal && (
        <BundleFormModal
          onClose={() => setCreateModal(false)}
          onSaved={fetchBundles}
        />
      )}
      {editTarget && (
        <BundleFormModal
          existing={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={fetchBundles}
        />
      )}
      {deleteTarget && (
        <DeleteBundleModal
          bundle={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={fetchBundles}
        />
      )}
    </div>
  );
}
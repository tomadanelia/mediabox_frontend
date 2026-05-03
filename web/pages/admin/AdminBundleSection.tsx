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
  id: string;
  name: string;
  number?: number;
  icon_url?: string;
  logo?: string;           // FIX: added logo field
  is_active?: number | boolean;
  slug?: string;
}

interface BundleItemsData {
  channels: BundleItem[];
  radio_channels: BundleItem[];
  modules: BundleItem[];
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

// FIX: unified available-item type so id is always string and logo is optional
interface AvailableItem {
  id: string;
  name: string;
  logo?: string;
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

const IconItems = () => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="5" height="5" rx="1"/>
    <rect x="9" y="2" width="5" height="5" rx="1"/>
    <rect x="2" y="9" width="5" height="5" rx="1"/>
    <rect x="9" y="9" width="5" height="5" rx="1"/>
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
   BUNDLE ITEMS PANEL
───────────────────────────────────────── */
function BundleItemsPanel({
  bundle,
  onItemsChanged,
}: {
  bundle: Bundle;
  onItemsChanged: () => void;
}) {
  const [itemsData, setItemsData] = useState<BundleItemsData>({ channels: [], radio_channels: [], modules: [] });
  const [loading, setLoading] = useState(true);

  const [channels, setChannels]   = useState<Channel[]>([]);
  const [radios, setRadios]       = useState<RadioChannel[]>([]);
  const [modules, setModules]     = useState<AppModule[]>([]);
  const [resourcesLoaded, setResourcesLoaded] = useState(false);

  const [addOpen, setAddOpen]         = useState(false);
  const [addSearch, setAddSearch]     = useState("");
  const [selectedIds, setSelectedIds] = useState<Array<{ item_id: string; item_type: 1 | 2 | 3 }>>([]);
  const [adding, setAdding]           = useState(false);
  const [removing, setRemoving]       = useState<string | null>(null);

  const typeForBundle: 1 | 2 | 3 = bundle.type === "tv" ? 1 : bundle.type === "radio" ? 2 : 3;

  const loadItems = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/bundles/${bundle.id}`);
      const raw = res.data?.items;
      setItemsData({
        channels:       Array.isArray(raw?.channels)       ? raw.channels       : [],
        radio_channels: Array.isArray(raw?.radio_channels) ? raw.radio_channels : [],
        modules:        Array.isArray(raw?.modules)        ? raw.modules        : [],
      });
    } catch {
      setItemsData({ channels: [], radio_channels: [], modules: [] });
    } finally { setLoading(false); }
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

  const removeItem = async (itemId: string, itemType: 1 | 2 | 3) => {
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

  const existingIds = new Set([
    ...itemsData.channels.map(c => c.id),
    ...itemsData.radio_channels.map(r => r.id),
    ...itemsData.modules.map(m => m.id),
  ]);

  const totalItems = itemsData.channels.length + itemsData.radio_channels.length + itemsData.modules.length;

  // FIX: build availableList as AvailableItem[] so id is always string and logo is always present (possibly undefined)
  const availableList: AvailableItem[] = bundle.type === "tv"
    ? channels
        .filter(c => !existingIds.has(c.uuid))
        .map(c => ({ id: c.uuid, name: c.name, logo: c.logo }))
    : bundle.type === "radio"
    ? radios
        .filter(r => !existingIds.has(String(r.id)))
        .map(r => ({ id: String(r.id), name: r.name, logo: r.logo }))
    : modules
        .filter(m => !existingIds.has(String(m.id)))
        .map(m => ({ id: String(m.id), name: m.name, logo: undefined }));

  const filteredAvailable = availableList.filter(i =>
    (i.name ?? "").toLowerCase().includes(addSearch.toLowerCase())
  );

  // FIX: id is now always string
  const toggleSelect = (id: string) => {
    setSelectedIds(prev =>
      prev.some(x => x.item_id === id)
        ? prev.filter(x => x.item_id !== id)
        : [...prev, { item_id: id, item_type: typeForBundle }]
    );
  };

  const renderChip = (item: BundleItem, itemType: 1 | 2 | 3) => {
    const key = `${itemType}-${item.id}`;
    // FIX: both icon_url and logo are now on BundleItem
    const img = item.icon_url ?? item.logo;
    return (
      <div
        key={key}
        className="flex items-center gap-2 bg-zinc-800/80 border border-zinc-700/50 rounded-lg px-2.5 py-1.5 group hover:border-zinc-600 transition-colors"
      >
        {img ? (
          <img src={img} className="w-5 h-5 object-contain shrink-0 rounded" onError={e => (e.currentTarget.style.display = "none")} />
        ) : (
          <span className="text-zinc-600 text-xs shrink-0">
            {itemType === 1 ? "📺" : itemType === 2 ? "📻" : "⚙️"}
          </span>
        )}
        <span className="text-zinc-300 text-xs">{item.name}</span>
        {item.number != null && (
          <span className="text-[0.58rem] font-mono text-zinc-600">#{item.number}</span>
        )}
        {item.is_active === 0 && (
          <span className="text-[0.55rem] text-amber-500">გათ.</span>
        )}
        <button
          onClick={() => removeItem(item.id, itemType)}
          disabled={removing === key}
          className="cursor-pointer ml-0.5 text-zinc-600 hover:text-red-400 transition-colors disabled:opacity-40"
          title="წაშლა"
        >
          {removing === key ? <Spinner /> : <span className="text-[0.7rem] leading-none">✕</span>}
        </button>
      </div>
    );
  };

  return (
    <div className="border-t border-zinc-800 bg-zinc-950/40">
      <div className="p-4">
        {loading ? (
          <div className="flex items-center gap-2 text-zinc-500 text-xs py-2">
            <Spinner />Loading items…
          </div>
        ) : totalItems === 0 ? (
          <p className="text-zinc-700 text-xs py-2 italic">ელემენტები არ არის დამატებული</p>
        ) : (
          <div className="space-y-3">
            {itemsData.channels.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[0.58rem] uppercase tracking-widest text-zinc-600">
                  არხები · {itemsData.channels.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {itemsData.channels.map(item => renderChip(item, 1))}
                </div>
              </div>
            )}
            {itemsData.radio_channels.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[0.58rem] uppercase tracking-widest text-zinc-600">
                  რადიო · {itemsData.radio_channels.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {itemsData.radio_channels.map(item => renderChip(item, 2))}
                </div>
              </div>
            )}
            {itemsData.modules.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[0.58rem] uppercase tracking-widest text-zinc-600">
                  მოდულები · {itemsData.modules.length}
                </p>
                <div className="flex flex-wrap gap-2">
                  {itemsData.modules.map(item => renderChip(item, 3))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add items section */}
      <div className="px-4 pb-4">
        <button
          onClick={openAdd}
          className={`cursor-pointer flex items-center gap-1.5 text-xs font-medium transition-colors px-3 py-1.5 rounded-lg border ${
            addOpen
              ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
              : "text-zinc-400 border-zinc-800 hover:border-zinc-600 hover:text-zinc-200"
          }`}
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
              autoFocus
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
            />

            <div className="max-h-52 overflow-y-auto rounded-xl bg-zinc-900 border border-zinc-800 p-1.5">
              {!resourcesLoaded ? (
                <div className="flex items-center gap-2 text-zinc-500 text-xs p-3"><Spinner />Loading…</div>
              ) : filteredAvailable.length === 0 ? (
                <p className="text-zinc-600 text-xs p-3 text-center">ვერ მოიძებნა</p>
              ) : filteredAvailable.map((item: AvailableItem) => {
                const isSelected = selectedIds.some(x => x.item_id === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => toggleSelect(item.id)}  // FIX: item.id is now always string
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-lg cursor-pointer transition-colors select-none ${
                      isSelected
                        ? "bg-violet-500/15 border border-violet-500/30"
                        : "hover:bg-zinc-800 border border-transparent"
                    }`}
                  >
                    <div className={`w-3.5 h-3.5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                      isSelected ? "border-violet-500 bg-violet-500" : "border-zinc-600"
                    }`}>
                      {isSelected && (
                        <svg width="8" height="8" viewBox="0 0 10 10" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1.5 5l2.5 2.5 4.5-4.5"/>
                        </svg>
                      )}
                    </div>
                    {/* FIX: item.logo is now typed on AvailableItem, no icon_url fallback needed */}
                    {item.logo && (
                      <img src={item.logo} className="w-5 h-5 object-contain shrink-0 rounded" onError={e => (e.currentTarget.style.display = "none")} />
                    )}
                    <span className="text-zinc-300 text-xs truncate">{item.name}</span>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              {selectedIds.length > 0 ? (
                <span className="text-[0.65rem] text-zinc-500">{selectedIds.length} მონიშნული</span>
              ) : (
                <span />
              )}
              <div className="flex gap-2">
                {selectedIds.length > 0 && (
                  <button
                    onClick={() => setSelectedIds([])}
                    className="cursor-pointer text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-3 py-1.5"
                  >
                    გასუფთავება
                  </button>
                )}
                <button
                  onClick={addItems}
                  disabled={adding || selectedIds.length === 0}
                  className="cursor-pointer flex items-center gap-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-4 py-1.5 rounded-lg transition-colors"
                >
                  {adding ? <><Spinner />დამატება…</> : <><IconCheck />{selectedIds.length > 0 ? `${selectedIds.length} ელემენტის დამატება` : "ელემენტის დამატება"}</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────
   PLAN ATTACH PANEL
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
    Array.isArray(bundle.plans) ? bundle.plans.map(p => String(p.id)) : []
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
    <div className="px-4 pb-4 pt-3 border-t border-zinc-800/50">
      <p className="text-[0.6rem] uppercase tracking-widest text-zinc-600 mb-2.5">მინიჭებული პაკეტები</p>
      <div className="flex flex-wrap gap-2">
        {activePlans.map(plan => {
          const isOn = attachedPlanIds.includes(String(plan.id));
          const isBusy = busy === String(plan.id);
          return (
            <button
              key={plan.id}
              onClick={() => toggle(String(plan.id))}
              disabled={isBusy}
              title={isOn ? "პაკეტის მოხსნა" : "პაკეტის მინიჭება"}
              className={`cursor-pointer flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                isOn
                  ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30 hover:bg-red-500/15 hover:text-red-300 hover:border-red-500/30"
                  : "bg-zinc-800/60 text-zinc-500 border-zinc-700/50 hover:bg-emerald-500/10 hover:text-emerald-300 hover:border-emerald-500/25"
              }`}
            >
              {isBusy ? <Spinner /> : isOn ? <IconLink /> : <IconPlus />}
              {plan.name_en}
              {isOn && <span className="text-[0.55rem] opacity-60 ml-0.5">· მოხსნა</span>}
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
              autoFocus
            />
          </div>
          <div>
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">
              Slug
              <span className="ml-1.5 text-zinc-700 normal-case tracking-normal">· auto-generated</span>
            </label>
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
            <span className="text-xs text-zinc-400">
              {form.is_active ? <span className="text-emerald-400">აქტიური</span> : "გათიშული"}
            </span>
          </label>
          {err && <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{err}</p>}
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
            {err && <p className="text-xs text-red-400 mt-2 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg w-full">{err}</p>}
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
  const [bundles, setBundles]       = useState<Bundle[]>([]);
  const [loading, setLoading]       = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showPlansId, setShowPlansId] = useState<string | null>(null);
  const [search, setSearch]         = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "tv" | "radio" | "module">("all");
  const [createModal, setCreateModal] = useState(false);
  const [editTarget, setEditTarget]   = useState<Bundle | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Bundle | null>(null);

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/bundles");
      const raw = res.data;
      setBundles(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : []);
    } catch { console.error("Failed to fetch bundles"); }
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
        <div className="flex items-center gap-2 flex-wrap">
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
            const isExpanded   = expandedId  === bundle.id;
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
                  {/* Type accent bar */}
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
                    <div className="flex items-center gap-3 mt-0.5 flex-wrap">
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
                    {/* Items toggle */}
                    <button
                      onClick={() => toggleExpand(bundle.id)}
                      title="ელემენტების მართვა"
                      className={`cursor-pointer flex items-center gap-1.5 text-[0.65rem] font-medium px-2.5 py-1.5 rounded-lg border transition-all ${
                        isExpanded
                          ? "bg-violet-500/15 text-violet-300 border-violet-500/30"
                          : "text-zinc-500 border-zinc-800 hover:border-zinc-600 hover:text-zinc-300"
                      }`}
                    >
                      <IconItems />
                      ელემენტები
                    </button>
                    {/* Plans toggle */}
                    <button
                      onClick={e => togglePlans(e, bundle.id)}
                      title="პაკეტების მართვა"
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
                      title="რედაქტირება"
                      className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                    >
                      <IconEdit />
                    </button>
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteTarget(bundle); }}
                      title="წაშლა"
                      className="cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <IconTrash />
                    </button>
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
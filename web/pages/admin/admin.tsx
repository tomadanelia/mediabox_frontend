import { useState, useEffect, useRef } from "react";

type AdminSection = "Overview" | "Users" | "Channels" | "Categories" | "Support" | "Settings";

interface User {
  id: string; name: string; email: string;
  plan: "Free" | "Premium" | "Enterprise";
  status: "Active" | "Suspended" | "Pending";
  joined: string; watchTime: string;
}

type Channel = {
  id: string; uuid: string; name: string;
  logo: string; number: number; url: string; category: any[];
};

interface Category {
  id: string; name_en: string; name_ka: string;
  icon_url: string; channels_count?: number;
}

/* ── tiny icon components ── */
const IconDots = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
    <circle cx="3" cy="8" r="1.5"/><circle cx="8" cy="8" r="1.5"/><circle cx="13" cy="8" r="1.5"/>
  </svg>
);
const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z"/>
  </svg>
);
const IconTrash = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 4h12M6 4V2h4v2M5 4l.5 9h5l.5-9"/>
  </svg>
);
const IconChannels = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="1" y="3" width="14" height="10" rx="1.5"/>
    <path d="M5 7h6M5 10h4"/>
  </svg>
);
const IconSpinner = () => (
  <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
    <circle cx="7" cy="7" r="6" stroke="currentColor" strokeOpacity="0.25" strokeWidth="2"/>
    <path d="M7 1a6 6 0 016 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);
const IconCheck = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 7l3.5 3.5L12 3"/>
  </svg>
);

function CategoryMenu({
  onManage, onEdit, onDelete,
}: { onManage: () => void; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex-shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${open ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"}`}
      >
        <IconDots />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-44 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden py-1">
          <button
            onClick={() => { setOpen(false); onManage(); }}
            className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <IconChannels /><span>შემავალი არხები</span>
          </button>
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-zinc-300 hover:bg-zinc-700 transition-colors"
          >
            <IconEdit /><span>რედაქტირება</span>
          </button>
          <div className="my-1 border-t border-zinc-700/60" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <IconTrash /><span>კატეგორიის წაშლა</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   MAIN
════════════════════════════════════════════════ */
export default function AdminDashboard() {
  const [section, setSection] = useState<AdminSection>("Overview");

  /* ── Channel state ── */
  const [channels, setChannels] = useState<Channel[]>([]);
  const [channelsLoading, setChannelsLoading] = useState(false);
  const [channelSearch, setChannelSearch] = useState("");
  const [selectedChannelUuids, setSelectedChannelUuids] = useState<string[]>([]);

  /* ── Categories state ── */
  const [categories, setCategories] = useState<Category[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCat, setNewCat] = useState({ name_en: "", name_ka: "", icon_url: "" });

  /* ── Manage modal ── */
  const [manageModal, setManageModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [categoryChannelList, setCategoryChannelList] = useState<any>(null);

  /* ── Edit modal ── */
  const [editModal, setEditModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name_en: "", name_ka: "", icon_url: "" });
  const [editSaving, setEditSaving] = useState(false);

  /* ── Delete confirm ── */
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Bulk assign modal ── */
  const [bulkAssignModal, setBulkAssignModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [bulkAssigning, setBulkAssigning] = useState(false);

  /* ── API ── */
  const fetchChannels = async () => {
    setChannelsLoading(true);
    try {
      const res = await fetch("http://159.89.20.100/api/channels");
      const data = await res.json();
      setChannels(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) { console.error(e); }
    finally { setChannelsLoading(false); }
  };

  const fetchCategories = async () => {
    setCatsLoading(true);
    try {
      const res = await fetch("http://159.89.20.100/api/channels/categories");
      setCategories(await res.json());
    } catch (e) { console.error(e); }
    finally { setCatsLoading(false); }
  };

  const handleAddCategory = async () => {
    if (!newCat.name_en || !newCat.name_ka) return;
    try {
      const res = await fetch("http://159.89.20.100/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(newCat),
      });
      if (res.ok) { setShowAddCategory(false); setNewCat({ name_en: "", name_ka: "", icon_url: "" }); fetchCategories(); }
      else { const e = await res.json().catch(() => null); alert(`Failed: ${e?.message}`); }
    } catch (e) { console.error(e); }
  };

  const handleEditCategory = async () => {
    if (!editCat) return;
    setEditSaving(true);
    try {
      const res = await fetch(`http://159.89.20.100/api/admin/categories/${editCat.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify(editForm),
      });
      if (res.ok) { setEditModal(false); fetchCategories(); }
      else { const e = await res.json().catch(() => null); alert(`Failed: ${e?.message}`); }
    } catch (e) { console.error(e); }
    finally { setEditSaving(false); }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCat) return;
    setDeleteLoading(true);
    try {
      const res = await fetch(`http://159.89.20.100/api/admin/categories/${deleteCat.id}`, { method: "DELETE" });
      if (res.ok) { setDeleteModal(false); fetchCategories(); }
      else { const e = await res.json().catch(() => null); alert(`Failed: ${e?.message}`); }
    } catch (e) { console.error(e); }
    finally { setDeleteLoading(false); }
  };

  const openManageCategory = async (cat: Category) => {
    setActiveCategory(cat);
    setCategoryChannelList(null);
    setManageModal(true);
    try {
      const res = await fetch(`http://159.89.20.100/api/admin/categories/${cat.id}`);
      const data = await res.json();
      setCategoryChannelList(Array.isArray(data) ? data : data.channels ?? []);
    } catch { setCategoryChannelList([]); }
  };

  const openEditModal = (cat: Category) => {
    setEditCat(cat);
    setEditForm({ name_en: cat.name_en, name_ka: cat.name_ka, icon_url: cat.icon_url ?? "" });
    setEditModal(true);
  };

  const openDeleteModal = (cat: Category) => {
    setDeleteCat(cat);
    setDeleteModal(true);
  };

  const confirmBulkAssign = async () => {
    if (!selectedCategoryId || !selectedChannelUuids.length) return;
    setBulkAssigning(true);
    try {
      const res = await fetch(`http://159.89.20.100/api/admin/categories/${selectedCategoryId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_ids: selectedChannelUuids }),
      });
      if (res.ok) { setBulkAssignModal(false); setSelectedChannelUuids([]); fetchChannels(); }
      else { const e = await res.json().catch(() => null); alert(`Failed: ${e?.message}`); }
    } catch (e) { console.error(e); }
    finally { setBulkAssigning(false); }
  };

  useEffect(() => {
    fetchCategories();
    if (section === "Channels" || section === "Overview") fetchChannels();
  }, [section]);

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(channelSearch.toLowerCase())
  );
  const toggleSelectChannel = (uuid: string) =>
    setSelectedChannelUuids(prev => prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300 text-sm font-sans overflow-hidden">

      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-56 bg-zinc-900 border-r border-zinc-800 flex-shrink-0">
        <div className="p-5 border-b border-zinc-800 font-bold text-zinc-100 tracking-tight">StreamAdmin</div>
        <nav className="p-3 flex flex-col gap-1">
          {(["Overview", "Channels", "Categories", "Users"] as AdminSection[]).map(s => (
            <button
              key={s} onClick={() => setSection(s)}
              className={`cursor-pointer px-3 py-2 rounded-xl text-left text-sm transition-colors ${section === s ? "bg-violet-500/15 text-violet-300 font-medium" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"}`}
            >{s}</button>
          ))}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">

        {/* HEADER */}
        <header className="px-5 py-3 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur flex justify-between items-center sticky top-0 z-10">
          <h2 className="font-semibold text-zinc-100">{section}</h2>
          {selectedChannelUuids.length > 0 && section === "Channels" && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">
                <span className="text-violet-400 font-semibold">{selectedChannelUuids.length}</span> არჩეული
              </span>
              <button
                onClick={() => { setSelectedCategoryId(""); setBulkAssignModal(true); }}
                className="cursor-pointer bg-violet-600 hover:bg-violet-500 transition-colors text-white text-xs font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                დამატება კატეგორიაში
              </button>
              <button onClick={() => setSelectedChannelUuids([])} className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">გასუფთავება</button>
            </div>
          )}
        </header>

        <main className="p-6 space-y-5">

          {/* ── CHANNELS ── */}
          {section === "Channels" && (
            <div className="space-y-4">
              <input
                type="text" placeholder="Search channels…" value={channelSearch}
                onChange={e => setChannelSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <table className="w-full text-left">
                  <thead className="bg-zinc-800/50 text-[0.6rem] uppercase tracking-widest text-zinc-500">
                    <tr>
                      <th className="p-4 w-10">
                        <input type="checkbox" className="cursor-pointer accent-violet-500"
                          checked={filteredChannels.length > 0 && filteredChannels.every(c => selectedChannelUuids.includes(c.uuid))}
                          onChange={e => e.target.checked ? setSelectedChannelUuids(filteredChannels.map(c => c.uuid)) : setSelectedChannelUuids([])}
                        />
                      </th>
                      <th className="p-4">არხი</th>
                      <th className="p-4">ID</th>
                      <th className="p-4">კატეგორია</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredChannels.map(c => (
                      <tr key={c.id} className={`border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors ${selectedChannelUuids.includes(c.uuid) ? "bg-violet-500/5" : ""}`}>
                        <td className="p-4">
                          <input type="checkbox" className="cursor-pointer accent-violet-500"
                            checked={selectedChannelUuids.includes(c.uuid)}
                            onChange={() => toggleSelectChannel(c.uuid)}
                          />
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <img src={c.logo} className="w-8 h-8 rounded bg-zinc-800 object-contain" />
                            <span className="text-zinc-200">{c.name}</span>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-[0.65rem] text-zinc-500">{c.uuid}</td>
                        <td className="p-4">
                          <span className="inline-block bg-violet-600/20 text-violet-300 px-2 py-1 rounded-md text-xs font-medium">{c.category}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── CATEGORIES ── */}
          {section === "Categories" && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <p className="text-zinc-400 text-xs">სულ {categories.length} კატეგორია</p>
                <button
                  onClick={() => setShowAddCategory(true)}
                  className="cursor-pointer bg-violet-600 hover:bg-violet-500 transition-colors text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  კატეგორიის დამატება
                </button>
              </div>

              {showAddCategory && (
                <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 space-y-3 shadow-lg">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">New Category</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Name (EN)" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={newCat.name_en} onChange={e => setNewCat({ ...newCat, name_en: e.target.value })} />
                    <input placeholder="Name (KA)" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={newCat.name_ka} onChange={e => setNewCat({ ...newCat, name_ka: e.target.value })} />
                  </div>
                  <input placeholder="Icon URL (optional)" className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={newCat.icon_url} onChange={e => setNewCat({ ...newCat, icon_url: e.target.value })} />
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleAddCategory} className="cursor-pointer bg-violet-600 hover:bg-violet-500 px-5 py-2 rounded-xl text-xs font-medium transition-colors">შენახვა</button>
                    <button onClick={() => setShowAddCategory(false)} className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs transition-colors">გაუქმება</button>
                  </div>
                </div>
              )}

              {/* Category grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <div key={cat.id} className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-2xl p-4 flex items-center gap-4">
                    {/* Icon */}
                    <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {cat.icon_url
                        ? <img src={cat.icon_url} className="w-7 h-7 object-contain" />
                        : <span className="text-xl">📁</span>
                      }
                    </div>
                    {/* Names */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-100 truncate leading-tight">{cat.name_en}</p>
                      <p className="text-[0.65rem] text-zinc-500 truncate mt-0.5">{cat.name_ka}</p>
                    </div>
                    {/* Action menu */}
                    <CategoryMenu
                      onManage={() => openManageCategory(cat)}
                      onEdit={() => openEditModal(cat)}
                      onDelete={() => openDeleteModal(cat)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ══════════════════════════════════════════
          MANAGE CHANNELS MODAL  (redesigned)
      ══════════════════════════════════════════ */}
      {manageModal && activeCategory && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setManageModal(false); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh] shadow-2xl overflow-hidden">

            {/* Header */}
            <div className="p-5 border-b border-zinc-800 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {activeCategory.icon_url
                  ? <img src={activeCategory.icon_url} className="w-7 h-7 object-contain" />
                  : <span className="text-xl">📁</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-100 text-base leading-tight">{activeCategory.name_en}</h3>
                <p className="text-[0.65rem] text-zinc-500 mt-0.5">
                  {categoryChannelList === null
                    ? "Loading channels…"
                    : <><span className="text-violet-400 font-semibold">{categoryChannelList.length}</span> channels in this category</>
                  }
                </p>
              </div>
              <button onClick={() => setManageModal(false)} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-lg leading-none">✕</button>
            </div>

            {/* Channel list */}
            <div className="flex-1 overflow-y-auto">
              {categoryChannelList === null && (
                <div className="flex items-center justify-center gap-2 py-16 text-zinc-500 text-sm">
                  <IconSpinner /><span>Loading…</span>
                </div>
              )}

              {categoryChannelList !== null && categoryChannelList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="3" y="9" width="34" height="24" rx="3.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M11 20h18M11 26h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                    <circle cx="30" cy="14" r="4" fill="#27272a" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M30 12v4M28 14h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  <p className="text-sm font-medium">No channels yet</p>
                  <p className="text-xs text-zinc-700 text-center max-w-48">გადადი არხებზე-აირჩიე რამოდენიმე დაამატე ამ კატეგორიაში</p>
                </div>
              )}

              {categoryChannelList !== null && categoryChannelList.length > 0 && (
                <div className="p-3 space-y-1">
                  {categoryChannelList.map((ch: any, idx: number) => (
                    <div
                      key={ch.id ?? idx}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors"
                    >
                      {/* Index */}
                      <span className="text-[0.6rem] text-zinc-700 w-5 text-right flex-shrink-0 font-mono tabular-nums">{idx + 1}</span>

                      {/* Logo */}
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-700/50">
                        {(ch.icon_url || ch.logo)
                          ? <img src={ch.icon_url ?? ch.logo} className="w-6 h-6 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                          : <span className="text-xs text-zinc-600">📺</span>
                        }
                      </div>

                      {/* Name + id */}
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-200 text-sm font-medium truncate leading-tight">{ch.name_en ?? ch.name}</p>
                        {ch.id && <p className="text-[0.58rem] text-zinc-600 font-mono truncate mt-0.5">{ch.id}</p>}
                      </div>

                      {/* Channel number badge */}
                      {ch.number != null && (
                        <span className="text-[0.6rem] font-mono text-zinc-500 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5 rounded-md flex-shrink-0">
                          #{ch.number}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-zinc-800 flex items-center gap-2 text-[0.65rem] text-zinc-600">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5.5 5v3M5.5 3.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              არხების დამატების ინსტრუქცია: არხების ჩანართში → აირჩიეთ არხები → დააჭირეთ "დამატება კატეგორიაში"
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          EDIT CATEGORY MODAL
      ══════════════════════════════════════════ */}
      {editModal && editCat && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setEditModal(false); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-zinc-100">Edit Category</h3>
                <p className="text-[0.65rem] text-zinc-500 mt-0.5 font-mono">ID: {editCat.id}</p>
              </div>
              <button onClick={() => setEditModal(false)} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Name (English)</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                  value={editForm.name_en}
                  onChange={e => setEditForm({ ...editForm, name_en: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Name (Georgian)</label>
                <input
                  className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                  value={editForm.name_ka}
                  onChange={e => setEditForm({ ...editForm, name_ka: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Icon URL</label>
                <div className="flex gap-2 items-center">
                  <input
                    className="flex-1 bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                    value={editForm.icon_url}
                    onChange={e => setEditForm({ ...editForm, icon_url: e.target.value })}
                    placeholder="https://…"
                  />
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {editForm.icon_url
                      ? <img src={editForm.icon_url} className="w-7 h-7 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                      : <span className="text-lg">📁</span>
                    }
                  </div>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setEditModal(false)} className="cursor-pointer px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">Cancel</button>
              <button
                onClick={handleEditCategory}
                disabled={editSaving || !editForm.name_en || !editForm.name_ka}
                className="cursor-pointer px-5 py-2 rounded-xl text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
              >
                {editSaving ? <><IconSpinner />Saving…</> : <><IconCheck />Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════ */}
      {deleteModal && deleteCat && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDeleteModal(false); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v4M14 11v4"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base">Delete Category?</h3>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  <span className="text-zinc-300 font-medium">"{deleteCat.name_en}"</span> will be permanently removed.<br/>This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setDeleteModal(false)} className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">Cancel</button>
              <button
                onClick={handleDeleteCategory}
                disabled={deleteLoading}
                className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {deleteLoading ? <><IconSpinner />Deleting…</> : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          BULK ASSIGN MODAL
      ══════════════════════════════════════════ */}
      {bulkAssignModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setBulkAssignModal(false); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-zinc-100 text-base">დამატება კატეგორიაში</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  მონიშნული <span className="text-violet-400 font-semibold">{selectedChannelUuids.length}</span> არხის დამატება
                </p>
              </div>
              <button onClick={() => setBulkAssignModal(false)} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">✕</button>
            </div>
            <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {categories.map(cat => (
                <label key={cat.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCategoryId === cat.id ? "border-violet-500 bg-violet-500/10" : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700 hover:bg-zinc-800/60"}`}>
                  <input type="radio" name="bulkCat" value={cat.id} checked={selectedCategoryId === cat.id} onChange={() => setSelectedCategoryId(cat.id)} className="accent-violet-500" />
                  <div className="w-7 h-7 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                    {cat.icon_url ? <img src={cat.icon_url} className="w-5 h-5 object-contain" /> : <span className="text-sm">📁</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-100 font-medium text-sm truncate">{cat.name_en}</p>
                    <p className="text-[0.6rem] text-zinc-500 truncate">{cat.name_ka}</p>
                  </div>
                  {selectedCategoryId === cat.id && <span className="text-violet-400 flex-shrink-0"><IconCheck /></span>}
                </label>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800 flex gap-2 justify-end">
              <button onClick={() => setBulkAssignModal(false)} className="cursor-pointer px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">Cancel</button>
              <button
                onClick={confirmBulkAssign}
                disabled={!selectedCategoryId || bulkAssigning}
                className="cursor-pointer px-5 py-2 rounded-xl text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
              >
                {bulkAssigning ? <><IconSpinner />Assigning…</> : "OK — Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
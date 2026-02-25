import { useState, useEffect, useRef } from "react";

type AdminSection = "Overview" | "Users" | "Channels" | "Categories" | "Plans" | "Plan-Channels" | "Support" | "Settings";

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

interface Plan {
  id: string;
  name_en: string;
  name_ka: string;
  description_en?: string;
  description_ka?: string;
  price: number;
  duration_days: number;
  is_active: boolean | number;
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
const IconDisable = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="8" cy="8" r="6"/>
    <path d="M4.5 4.5l7 7"/>
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

function PlanMenu({
  onManage, onEdit, onDisable, onDelete,
}: { onManage: () => void; onEdit: () => void; onDisable: () => void; onDelete: () => void }) {
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
        <div className="absolute right-0 top-9 z-20 w-48 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden py-1">
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
          <button
            onClick={() => { setOpen(false); onDisable(); }}
            className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-amber-400 hover:bg-amber-500/10 transition-colors"
          >
            <IconDisable /><span>გამორთვა</span>
          </button>
          <div className="my-1 border-t border-zinc-700/60" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="cursor-pointer w-full flex items-center gap-2.5 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <IconTrash /><span>პლანის წაშლა</span>
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

  /* ── Category Manage modal ── */
  const [manageModal, setManageModal] = useState(false);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [categoryChannelList, setCategoryChannelList] = useState<any>(null);

  /* ── Category Edit modal ── */
  const [editModal, setEditModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editForm, setEditForm] = useState({ name_en: "", name_ka: "", icon_url: "" });
  const [editSaving, setEditSaving] = useState(false);

  /* ── Category Delete confirm ── */
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteCat, setDeleteCat] = useState<Category | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Category Bulk assign modal ── */
  const [bulkAssignModal, setBulkAssignModal] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [bulkAssigning, setBulkAssigning] = useState(false);

  /* ══════════════════════════════════════
     PLANS state
  ══════════════════════════════════════ */
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [showAddPlan, setShowAddPlan] = useState(false);
  const [newPlan, setNewPlan] = useState({
    name_en: "", name_ka: "", description_en: "", description_ka: "",
    price: "", duration_days: "", is_active: true,
  });

  /* Plan manage modal */
  const [planManageModal, setPlanManageModal] = useState(false);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [planChannelList, setPlanChannelList] = useState<any>(null);
  const [planChannelSearch, setPlanChannelSearch] = useState("");

  /* Plan edit modal */
  const [planEditModal, setPlanEditModal] = useState(false);
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [editPlanForm, setEditPlanForm] = useState({
    name_en: "", name_ka: "", description_en: "", description_ka: "",
    price: "", duration_days: "", is_active: true,
  });
  const [editPlanSaving, setEditPlanSaving] = useState(false);

  /* Plan disable */
  const [disableModal, setDisableModal] = useState(false);
  const [disablePlan, setDisablePlan] = useState<Plan | null>(null);
  const [disableLoading, setDisableLoading] = useState(false);

  /* Plan channels delete */
  const [selectedPlanChannelUuids, setSelectedPlanChannelUuids] = useState<string[]>([]);
  const [deletingPlanChannels, setDeletingPlanChannels] = useState(false);

  /* Plan-Channels section bulk assign */
  const [planChannelsBulkModal, setPlanChannelsBulkModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState<string>("");
  const [bulkAssigningPlan, setBulkAssigningPlan] = useState(false);
  const [planChannelsSelectedUuids, setPlanChannelsSelectedUuids] = useState<string[]>([]);
  const [planChannelsSectionSearch, setPlanChannelsSectionSearch] = useState("");

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

  const fetchPlans = async () => {
    setPlansLoading(true);
    try {
      const res = await fetch("http://159.89.20.100/api/plans");
      const data = await res.json();
      setPlans(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) { console.error(e); }
    finally { setPlansLoading(false); }
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

  /* ── Plans API ── */
  const handleAddPlan = async () => {
    if (!newPlan.name_en || !newPlan.name_ka || !newPlan.price || !newPlan.duration_days) return;
    try {
      const res = await fetch("http://159.89.20.100/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...newPlan,
          price: parseFloat(newPlan.price),
          duration_days: parseInt(newPlan.duration_days),
        }),
      });
      if (res.ok) {
        setShowAddPlan(false);
        setNewPlan({ name_en: "", name_ka: "", description_en: "", description_ka: "", price: "", duration_days: "", is_active: true });
        fetchPlans();
      } else { const e = await res.json().catch(() => null); alert(`Failed: ${e?.message}`); }
    } catch (e) { console.error(e); }
  };

  const handleEditPlan = async () => {
    if (!editPlan) return;
    setEditPlanSaving(true);
    try {
      const res = await fetch(`http://159.89.20.100/api/admin/plans/${editPlan.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          ...editPlanForm,
          price: parseFloat(editPlanForm.price),
          duration_days: parseInt(editPlanForm.duration_days),
        }),
      });
      if (res.ok) { setPlanEditModal(false); fetchPlans(); }
      else { const e = await res.json().catch(() => null); alert(`Failed: ${e?.message}`); }
    } catch (e) { console.error(e); }
    finally { setEditPlanSaving(false); }
  };

  const handleDisablePlan = async () => {
    if (!disablePlan) return;
    setDisableLoading(true);
    try {
      const res = await fetch(`http://159.89.20.100/api/plans/${disablePlan.id}/disable`);
      if (res.ok) { setDisableModal(false); fetchPlans(); }
      else { const e = await res.json().catch(() => null); alert(`Failed: ${e?.message}`); }
    } catch (e) { console.error(e); }
    finally { setDisableLoading(false); }
  };

  const openPlanManageModal = async (plan: Plan) => {
    setActivePlan(plan);
    setPlanChannelList(null);
    setSelectedPlanChannelUuids([]);
    setPlanChannelSearch("");
    setPlanManageModal(true);
    try {
      const res = await fetch(`http://159.89.20.100/api/plans/${plan.id}/channels`);
      const data = await res.json();
      setPlanChannelList(Array.isArray(data) ? data : data.channels ?? data.data ?? []);
    } catch { setPlanChannelList([]); }
  };

  const openPlanEditModal = (plan: Plan) => {
    setEditPlan(plan);
    setEditPlanForm({
      name_en: plan.name_en,
      name_ka: plan.name_ka,
      description_en: plan.description_en ?? "",
      description_ka: plan.description_ka ?? "",
      price: String(plan.price),
      duration_days: String(plan.duration_days),
      is_active: Boolean(plan.is_active),
    });
    setPlanEditModal(true);
  };

  const openDisableModal = (plan: Plan) => {
    setDisablePlan(plan);
    setDisableModal(true);
  };

  const handleDeletePlanChannels = async () => {
    if (!activePlan || !selectedPlanChannelUuids.length) return;
    setDeletingPlanChannels(true);
    try {
      const res = await fetch(`http://159.89.20.100/api/admin/plans/${activePlan.id}/channels`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_ids: selectedPlanChannelUuids }),
      });
      if (res.ok) {
        setSelectedPlanChannelUuids([]);
        // refresh channel list in modal
        const r2 = await fetch(`http://159.89.20.100/api/plans/${activePlan.id}/channels`);
        const d2 = await r2.json();
        setPlanChannelList(Array.isArray(d2) ? d2 : d2.channels ?? d2.data ?? []);
      } else { const e = await res.json().catch(() => null); alert(`Failed: ${e?.message}`); }
    } catch (e) { console.error(e); }
    finally { setDeletingPlanChannels(false); }
  };

  /* Plan-Channels section bulk assign */
  const confirmBulkAssignPlan = async () => {
    if (!selectedPlanId || !planChannelsSelectedUuids.length) return;
    setBulkAssigningPlan(true);
    try {
      const res = await fetch(`http://159.89.20.100/api/admin/plans/${selectedPlanId}/channels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel_ids: planChannelsSelectedUuids }),
      });
      if (res.ok) {
        setPlanChannelsBulkModal(false);
        setPlanChannelsSelectedUuids([]);
        fetchChannels();
      } else { const e = await res.json().catch(() => null); alert(`Failed: ${e?.message}`); }
    } catch (e) { console.error(e); }
    finally { setBulkAssigningPlan(false); }
  };

  useEffect(() => {
    fetchCategories();
    fetchPlans();
    if (section === "Channels" || section === "Overview" || section === "Plan-Channels") fetchChannels();
  }, [section]);

  const filteredChannels = channels.filter(c =>
    c.name.toLowerCase().includes(channelSearch.toLowerCase())
  );
  const filteredPlanChannels = channels.filter(c =>
    c.name.toLowerCase().includes(planChannelsSectionSearch.toLowerCase())
  );

  const toggleSelectChannel = (uuid: string) =>
    setSelectedChannelUuids(prev => prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]);

  const toggleSelectPlanChannel = (uuid: string) =>
    setPlanChannelsSelectedUuids(prev => prev.includes(uuid) ? prev.filter(id => id !== uuid) : [...prev, uuid]);

  const filteredModalChannels = planChannelList
    ? planChannelList.filter((ch: any) => (ch.name_en ?? ch.name ?? "").toLowerCase().includes(planChannelSearch.toLowerCase()))
    : [];

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-300 text-sm font-sans overflow-hidden">

      {/* SIDEBAR */}
      <aside className="hidden lg:flex flex-col w-56 bg-zinc-900 border-r border-zinc-800 flex-shrink-0">
        <div className="p-5 border-b border-zinc-800 font-bold text-zinc-100 tracking-tight">StreamAdmin</div>
        <nav className="p-3 flex flex-col gap-1">
          {(["Overview", "Channels", "Categories", "Plans", "Plan-Channels", "Users"] as AdminSection[]).map(s => (
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

          {/* Channels section bulk */}
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

          {/* Plan-Channels section bulk */}
          {planChannelsSelectedUuids.length > 0 && section === "Plan-Channels" && (
            <div className="flex items-center gap-3">
              <span className="text-xs text-zinc-400">
                <span className="text-emerald-400 font-semibold">{planChannelsSelectedUuids.length}</span> არჩეული
              </span>
              <button
                onClick={() => { setSelectedPlanId(""); setPlanChannelsBulkModal(true); }}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 transition-colors text-white text-xs font-medium px-4 py-1.5 rounded-lg flex items-center gap-1.5"
              >
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                პაკეტში დამატება
              </button>
              <button onClick={() => setPlanChannelsSelectedUuids([])} className="cursor-pointer text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1.5 rounded-lg hover:bg-zinc-800 transition-colors">გასუფთავება</button>
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

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {categories.map(cat => (
                  <div key={cat.id} className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-2xl p-4 flex items-center gap-4">
                    <div className="w-11 h-11 rounded-xl bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {cat.icon_url
                        ? <img src={cat.icon_url} className="w-7 h-7 object-contain" />
                        : <span className="text-xl">📁</span>
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-zinc-100 truncate leading-tight">{cat.name_en}</p>
                      <p className="text-[0.65rem] text-zinc-500 truncate mt-0.5">{cat.name_ka}</p>
                    </div>
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

          {/* ── PLANS ── */}
          {section === "Plans" && (
            <div className="space-y-5">
              <div className="flex justify-between items-center">
                <p className="text-zinc-400 text-xs">სულ {plans.length} პლანი</p>
                <button
                  onClick={() => setShowAddPlan(true)}
                  className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 transition-colors text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5"
                >
                  <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
                  პლანის დამატება
                </button>
              </div>

              {showAddPlan && (
                <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 space-y-3 shadow-lg">
                  <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">New Plan</p>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Name (EN)" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={newPlan.name_en} onChange={e => setNewPlan({ ...newPlan, name_en: e.target.value })} />
                    <input placeholder="Name (KA)" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={newPlan.name_ka} onChange={e => setNewPlan({ ...newPlan, name_ka: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input placeholder="Description (EN)" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={newPlan.description_en} onChange={e => setNewPlan({ ...newPlan, description_en: e.target.value })} />
                    <input placeholder="Description (KA)" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={newPlan.description_ka} onChange={e => setNewPlan({ ...newPlan, description_ka: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input type="number" placeholder="Price" min="0" step="0.01" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={newPlan.price} onChange={e => setNewPlan({ ...newPlan, price: e.target.value })} />
                    <input type="number" placeholder="Duration (days)" min="1" className="bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={newPlan.duration_days} onChange={e => setNewPlan({ ...newPlan, duration_days: e.target.value })} />
                  </div>
                  <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                    <input type="checkbox" className="accent-emerald-500" checked={newPlan.is_active} onChange={e => setNewPlan({ ...newPlan, is_active: e.target.checked })} />
                    Active
                  </label>
                  <div className="flex gap-2 pt-1">
                    <button onClick={handleAddPlan} className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 px-5 py-2 rounded-xl text-xs font-medium transition-colors">შენახვა</button>
                    <button onClick={() => setShowAddPlan(false)} className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs transition-colors">გაუქმება</button>
                  </div>
                </div>
              )}

              {plansLoading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-zinc-500 text-sm"><IconSpinner /><span>Loading…</span></div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {plans.map(plan => (
                    <div key={plan.id} className="group bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors rounded-2xl p-4 flex items-start gap-4">
                      {/* Icon / badge */}
                      <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                          <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.1l-4.76 2.55.91-5.3L2.3 7.6l5.3-.8L10 2z" stroke="#34d399" strokeWidth="1.4" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold text-zinc-100 truncate leading-tight">{plan.name_en}</p>
                          {plan.is_active
                            ? <span className="inline-flex items-center gap-1 text-[0.6rem] bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-1.5 py-0.5 rounded-md font-medium">Active</span>
                            : <span className="inline-flex items-center gap-1 text-[0.6rem] bg-zinc-700/50 text-zinc-500 border border-zinc-700 px-1.5 py-0.5 rounded-md font-medium">Inactive</span>
                          }
                        </div>
                        <p className="text-[0.65rem] text-zinc-500 truncate mt-0.5">{plan.name_ka}</p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-emerald-400 font-bold text-sm">${plan.price}</span>
                          <span className="text-[0.65rem] text-zinc-600">·</span>
                          <span className="text-[0.65rem] text-zinc-500">{plan.duration_days} დღე</span>
                        </div>
                        {plan.description_en && (
                          <p className="text-[0.62rem] text-zinc-600 mt-1.5 truncate">{plan.description_en}</p>
                        )}
                      </div>
                      <PlanMenu
                        onManage={() => openPlanManageModal(plan)}
                        onEdit={() => openPlanEditModal(plan)}
                        onDisable={() => openDisableModal(plan)}
                        onDelete={() => { /* no delete endpoint for plans based on spec, use disable */ openDisableModal(plan); }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── PLAN-CHANNELS ── */}
          {section === "Plan-Channels" && (
            <div className="space-y-4">
              <p className="text-zinc-400 text-xs">აირჩიეთ არხები და დაამატეთ პაკეტში</p>
              <input
                type="text" placeholder="Search channels…" value={planChannelsSectionSearch}
                onChange={e => setPlanChannelsSectionSearch(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 focus:outline-none focus:border-zinc-600 transition-colors"
              />
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {channelsLoading ? (
                  <div className="flex items-center justify-center gap-2 py-16 text-zinc-500 text-sm"><IconSpinner /><span>Loading…</span></div>
                ) : (
                  <table className="w-full text-left">
                    <thead className="bg-zinc-800/50 text-[0.6rem] uppercase tracking-widest text-zinc-500">
                      <tr>
                        <th className="p-4 w-10">
                          <input type="checkbox" className="cursor-pointer accent-emerald-500"
                            checked={filteredPlanChannels.length > 0 && filteredPlanChannels.every(c => planChannelsSelectedUuids.includes(c.uuid))}
                            onChange={e => e.target.checked ? setPlanChannelsSelectedUuids(filteredPlanChannels.map(c => c.uuid)) : setPlanChannelsSelectedUuids([])}
                          />
                        </th>
                        <th className="p-4">არხი</th>
                        <th className="p-4">ID</th>
                        <th className="p-4">კატეგორია</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredPlanChannels.map(c => (
                        <tr key={c.id} className={`border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors ${planChannelsSelectedUuids.includes(c.uuid) ? "bg-emerald-500/5" : ""}`}>
                          <td className="p-4">
                            <input type="checkbox" className="cursor-pointer accent-emerald-500"
                              checked={planChannelsSelectedUuids.includes(c.uuid)}
                              onChange={() => toggleSelectPlanChannel(c.uuid)}
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
                )}
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ══════════════════════════════════════════
          CATEGORY MANAGE CHANNELS MODAL
      ══════════════════════════════════════════ */}
      {manageModal && activeCategory && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setManageModal(false); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh] shadow-2xl overflow-hidden">
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
                    : <><span className="text-violet-400 font-semibold">{categoryChannelList.length}</span> არხი ამ კატეგორიაში</>
                  }
                </p>
              </div>
              <button onClick={() => setManageModal(false)} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-lg leading-none">✕</button>
            </div>

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
                  </svg>
                  <p className="text-sm font-medium">No channels yet</p>
                  <p className="text-xs text-zinc-700 text-center max-w-48">გადადი არხებზე-აირჩიე რამოდენიმე დაამატე ამ კატეგორიაში</p>
                </div>
              )}
              {categoryChannelList !== null && categoryChannelList.length > 0 && (
                <div className="p-3 space-y-1">
                  {categoryChannelList.map((ch: any, idx: number) => (
                    <div key={ch.id ?? idx} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-zinc-800/50 transition-colors">
                      <span className="text-[0.6rem] text-zinc-700 w-5 text-right flex-shrink-0 font-mono tabular-nums">{idx + 1}</span>
                      <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-700/50">
                        {(ch.icon_url || ch.logo)
                          ? <img src={ch.icon_url ?? ch.logo} className="w-6 h-6 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                          : <span className="text-xs text-zinc-600">📺</span>
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-zinc-200 text-sm font-medium truncate leading-tight">{ch.name_en ?? ch.name}</p>
                        {ch.id && <p className="text-[0.58rem] text-zinc-600 font-mono truncate mt-0.5">{ch.id}</p>}
                      </div>
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
          CATEGORY EDIT MODAL
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
                <input className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={editForm.name_en} onChange={e => setEditForm({ ...editForm, name_en: e.target.value })} />
              </div>
              <div>
                <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Name (Georgian)</label>
                <input className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={editForm.name_ka} onChange={e => setEditForm({ ...editForm, name_ka: e.target.value })} />
              </div>
              <div>
                <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Icon URL</label>
                <div className="flex gap-2 items-center">
                  <input className="flex-1 bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={editForm.icon_url} onChange={e => setEditForm({ ...editForm, icon_url: e.target.value })} placeholder="https://…" />
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
          CATEGORY DELETE MODAL
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
          CATEGORY BULK ASSIGN MODAL
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

      {/* ══════════════════════════════════════════
          PLAN MANAGE CHANNELS MODAL
      ══════════════════════════════════════════ */}
      {planManageModal && activePlan && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setPlanManageModal(false); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg flex flex-col max-h-[80vh] shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex items-center gap-4">
              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.1l-4.76 2.55.91-5.3L2.3 7.6l5.3-.8L10 2z" stroke="#34d399" strokeWidth="1.4" strokeLinejoin="round"/>
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-zinc-100 text-base leading-tight">{activePlan.name_en}</h3>
                <p className="text-[0.65rem] text-zinc-500 mt-0.5">
                  {planChannelList === null
                    ? "Loading channels…"
                    : <><span className="text-emerald-400 font-semibold">{planChannelList.length}</span> არხი ამ პაკეტში</>
                  }
                </p>
              </div>
              <button onClick={() => setPlanManageModal(false)} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors text-lg leading-none">✕</button>
            </div>

            {/* search + delete selected */}
            {planChannelList !== null && planChannelList.length > 0 && (
              <div className="px-4 pt-3 pb-0 flex items-center gap-2">
                <input
                  type="text" placeholder="Search…" value={planChannelSearch}
                  onChange={e => setPlanChannelSearch(e.target.value)}
                  className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-zinc-500 transition-colors"
                />
                {selectedPlanChannelUuids.length > 0 && (
                  <button
                    onClick={handleDeletePlanChannels}
                    disabled={deletingPlanChannels}
                    className="cursor-pointer flex items-center gap-1.5 bg-red-600/80 hover:bg-red-500 disabled:opacity-40 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    {deletingPlanChannels ? <><IconSpinner />Removing…</> : <><IconTrash />{selectedPlanChannelUuids.length} Remove</>}
                  </button>
                )}
              </div>
            )}

            <div className="flex-1 overflow-y-auto mt-2">
              {planChannelList === null && (
                <div className="flex items-center justify-center gap-2 py-16 text-zinc-500 text-sm">
                  <IconSpinner /><span>Loading…</span>
                </div>
              )}
              {planChannelList !== null && planChannelList.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 gap-3 text-zinc-600">
                  <svg width="40" height="40" viewBox="0 0 40 40" fill="none">
                    <rect x="3" y="9" width="34" height="24" rx="3.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M11 20h18M11 26h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <p className="text-sm font-medium">No channels yet</p>
                  <p className="text-xs text-zinc-700 text-center max-w-48">გადადი Plan-Channels-ზე → აირჩიე → დაამატე ამ პლანში</p>
                </div>
              )}
              {planChannelList !== null && planChannelList.length > 0 && (
                <div className="p-3 space-y-1">
                  {filteredModalChannels.map((ch: any, idx: number) => {
                    const chId = ch.uuid ?? ch.id;
                    const isSelected = selectedPlanChannelUuids.includes(chId);
                    return (
                      <div
                        key={ch.id ?? idx}
                        onClick={() => setSelectedPlanChannelUuids(prev => isSelected ? prev.filter(id => id !== chId) : [...prev, chId])}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-colors ${isSelected ? "bg-red-500/10 border border-red-500/20" : "hover:bg-zinc-800/50 border border-transparent"}`}
                      >
                        <input type="checkbox" className="cursor-pointer accent-red-500 flex-shrink-0" checked={isSelected} onChange={() => {}} />
                        <span className="text-[0.6rem] text-zinc-700 w-5 text-right flex-shrink-0 font-mono tabular-nums">{idx + 1}</span>
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0 overflow-hidden border border-zinc-700/50">
                          {(ch.icon_url || ch.logo)
                            ? <img src={ch.icon_url ?? ch.logo} className="w-6 h-6 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                            : <span className="text-xs text-zinc-600">📺</span>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-zinc-200 text-sm font-medium truncate leading-tight">{ch.name_en ?? ch.name}</p>
                          {chId && <p className="text-[0.58rem] text-zinc-600 font-mono truncate mt-0.5">{chId}</p>}
                        </div>
                        {ch.number != null && (
                          <span className="text-[0.6rem] font-mono text-zinc-500 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5 rounded-md flex-shrink-0">
                            #{ch.number}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-3 border-t border-zinc-800 flex items-center gap-2 text-[0.65rem] text-zinc-600">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1.2"/>
                <path d="M5.5 5v3M5.5 3.5v.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
              </svg>
              მონიშნეთ არხები და დააჭირეთ Remove მათ ამ პლანიდან ამოსაღებად
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PLAN EDIT MODAL
      ══════════════════════════════════════════ */}
      {planEditModal && editPlan && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setPlanEditModal(false); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-zinc-100">Edit Plan</h3>
                <p className="text-[0.65rem] text-zinc-500 mt-0.5 font-mono">ID: {editPlan.id}</p>
              </div>
              <button onClick={() => setPlanEditModal(false)} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Name (EN)</label>
                  <input className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={editPlanForm.name_en} onChange={e => setEditPlanForm({ ...editPlanForm, name_en: e.target.value })} />
                </div>
                <div>
                  <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Name (KA)</label>
                  <input className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={editPlanForm.name_ka} onChange={e => setEditPlanForm({ ...editPlanForm, name_ka: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Description (EN)</label>
                  <input className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={editPlanForm.description_en} onChange={e => setEditPlanForm({ ...editPlanForm, description_en: e.target.value })} />
                </div>
                <div>
                  <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Description (KA)</label>
                  <input className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={editPlanForm.description_ka} onChange={e => setEditPlanForm({ ...editPlanForm, description_ka: e.target.value })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Price</label>
                  <input type="number" min="0" step="0.01" className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={editPlanForm.price} onChange={e => setEditPlanForm({ ...editPlanForm, price: e.target.value })} />
                </div>
                <div>
                  <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Duration (days)</label>
                  <input type="number" min="1" className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors" value={editPlanForm.duration_days} onChange={e => setEditPlanForm({ ...editPlanForm, duration_days: e.target.value })} />
                </div>
              </div>
              <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                <input type="checkbox" className="accent-emerald-500" checked={editPlanForm.is_active} onChange={e => setEditPlanForm({ ...editPlanForm, is_active: e.target.checked })} />
                Active
              </label>
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button onClick={() => setPlanEditModal(false)} className="cursor-pointer px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">Cancel</button>
              <button
                onClick={handleEditPlan}
                disabled={editPlanSaving || !editPlanForm.name_en || !editPlanForm.name_ka}
                className="cursor-pointer px-5 py-2 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
              >
                {editPlanSaving ? <><IconSpinner />Saving…</> : <><IconCheck />Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PLAN DISABLE MODAL
      ══════════════════════════════════════════ */}
      {disableModal && disablePlan && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setDisableModal(false); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="9"/>
                  <path d="M7 7l10 10"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base">Disable Plan?</h3>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  <span className="text-zinc-300 font-medium">"{disablePlan.name_en}"</span> will be disabled and hidden from users.<br/>It can be re-enabled later.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={() => setDisableModal(false)} className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">Cancel</button>
              <button
                onClick={handleDisablePlan}
                disabled={disableLoading}
                className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {disableLoading ? <><IconSpinner />Disabling…</> : "Disable"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PLAN-CHANNELS BULK ASSIGN TO PLAN MODAL
      ══════════════════════════════════════════ */}
      {planChannelsBulkModal && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4" onClick={e => { if (e.target === e.currentTarget) setPlanChannelsBulkModal(false); }}>
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-start">
              <div>
                <h3 className="font-bold text-zinc-100 text-base">დამატება პლანში</h3>
                <p className="text-xs text-zinc-500 mt-0.5">
                  მონიშნული <span className="text-emerald-400 font-semibold">{planChannelsSelectedUuids.length}</span> არხის დამატება
                </p>
              </div>
              <button onClick={() => setPlanChannelsBulkModal(false)} className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors">✕</button>
            </div>
            <div className="p-4 space-y-2 max-h-72 overflow-y-auto">
              {plans.map(plan => (
                <label key={plan.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedPlanId === plan.id ? "border-emerald-500 bg-emerald-500/10" : "border-zinc-800 bg-zinc-800/30 hover:border-zinc-700 hover:bg-zinc-800/60"}`}>
                  <input type="radio" name="bulkPlan" value={plan.id} checked={selectedPlanId === plan.id} onChange={() => setSelectedPlanId(plan.id)} className="accent-emerald-500" />
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                    <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                      <path d="M10 2l2.4 4.8 5.3.8-3.85 3.75.91 5.3L10 14.1l-4.76 2.55.91-5.3L2.3 7.6l5.3-.8L10 2z" stroke="#34d399" strokeWidth="1.6" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-zinc-100 font-medium text-sm truncate">{plan.name_en}</p>
                    <p className="text-[0.6rem] text-zinc-500 truncate">{plan.name_ka} · ${plan.price} · {plan.duration_days}d</p>
                  </div>
                  {selectedPlanId === plan.id && <span className="text-emerald-400 flex-shrink-0"><IconCheck /></span>}
                </label>
              ))}
            </div>
            <div className="p-4 border-t border-zinc-800 flex gap-2 justify-end">
              <button onClick={() => setPlanChannelsBulkModal(false)} className="cursor-pointer px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors">Cancel</button>
              <button
                onClick={confirmBulkAssignPlan}
                disabled={!selectedPlanId || bulkAssigningPlan}
                className="cursor-pointer px-5 py-2 rounded-xl text-xs bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
              >
                {bulkAssigningPlan ? <><IconSpinner />Assigning…</> : "OK — Assign"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
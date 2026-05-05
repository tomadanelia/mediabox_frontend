import { useState, useEffect, useRef } from "react";
import api from "../../src/lib/axios";

/* ── Types ── */
interface RadioChannel {
  id: string;
  external_id: number;
  name: string;
  stream_url: string;
  icon_url: string | null;
  is_active: boolean | number;
  is_public: boolean | number;
  is_free: boolean | number;
}

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
const IconRadio = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 17a9 9 0 0 1 18 0"/>
    <path d="M6.7 14.3a7 7 0 0 1 10.6 0"/>
    <path d="M10.4 11a4 4 0 0 1 3.2 0"/>
    <circle cx="12" cy="19" r="1"/>
  </svg>
);

/* ── Inline Toggle Switch ── */
function ToggleSwitch({
  checked,
  loading,
  onChange,
  colorOn = "bg-emerald-500",
}: {
  checked: boolean;
  loading?: boolean;
  onChange: () => void;
  colorOn?: string;
}) {
  return (
    <button
      onClick={onChange}
      disabled={loading}
      className={`cursor-pointer relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed ${
        checked ? colorOn : "bg-zinc-700"
      }`}
    >
      <span
        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform duration-200 ${
          checked ? "translate-x-[18px]" : "translate-x-[3px]"
        }`}
      />
      {loading && (
        <span className="absolute inset-0 flex items-center justify-center">
          <IconSpinner />
        </span>
      )}
    </button>
  );
}

/* ── Radio Action Menu ── */
function RadioMenu({
  onEdit,
  onDelete,
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
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
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen(o => !o)}
        className={`cursor-pointer w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${
          open ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:bg-zinc-800 hover:text-zinc-300"
        }`}
      >
        <IconDots />
      </button>
      {open && (
        <div className="absolute right-0 top-9 z-20 w-44 bg-zinc-800 border border-zinc-700 rounded-xl shadow-2xl overflow-hidden py-1">
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
            <IconTrash /><span>არხის წაშლა</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════ */
export default function AdminRadioSection() {
  const [radios, setRadios] = useState<RadioChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Per-row toggle loading state: { [id]: 'active' | 'public' | null }
  const [togglingField, setTogglingField] = useState<Record<string, "active" | "public" | null>>({});

  /* ── Add form ── */
  const [showAdd, setShowAdd] = useState(false);
  const [newRadio, setNewRadio] = useState({
    external_id: "",
    name: "",
    stream_url: "",
    icon_url: "",
    is_active: true,
    is_public: true,
    is_free: false,
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  /* ── Edit modal ── */
  const [editModal, setEditModal] = useState(false);
  const [editTarget, setEditTarget] = useState<RadioChannel | null>(null);
  const [editForm, setEditForm] = useState({
    external_id: "",
    name: "",
    stream_url: "",
    icon_url: "",
    is_active: true,
    is_public: true,
    is_free: false,
  });
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  /* ── Delete confirm modal ── */
  const [deleteModal, setDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<RadioChannel | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  /* ── Fetch ── */
  const fetchRadios = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/admin/radios");
      const data = res.data;
      setRadios(Array.isArray(data) ? data : data.data ?? []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRadios();
  }, []);

  const filtered = radios.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    String(r.external_id).includes(search)
  );

  /* ── Inline toggle active ── */
  const handleToggleActive = async (r: RadioChannel) => {
    setTogglingField(prev => ({ ...prev, [r.id]: "active" }));
    try {
      await api.patch(`/api/admin/radios/${r.id}/toggle-active`);
      setRadios(prev =>
        prev.map(item =>
          item.id === r.id ? { ...item, is_active: !Boolean(item.is_active) } : item
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingField(prev => ({ ...prev, [r.id]: null }));
    }
  };

  /* ── Inline toggle public ── */
  const handleTogglePublic = async (r: RadioChannel) => {
    setTogglingField(prev => ({ ...prev, [r.id]: "public" }));
    try {
      await api.patch(`/api/admin/radios/${r.id}/toggle-public`);
      setRadios(prev =>
        prev.map(item =>
          item.id === r.id ? { ...item, is_public: !Boolean(item.is_public) } : item
        )
      );
    } catch (e) {
      console.error(e);
    } finally {
      setTogglingField(prev => ({ ...prev, [r.id]: null }));
    }
  };

  /* ── Add ── */
  const handleAdd = async () => {
    if (!newRadio.name || !newRadio.stream_url || !newRadio.external_id) return;
    setAddLoading(true);
    setAddError(null);
    try {
      await api.post("/api/admin/radios", {
        ...newRadio,
        external_id: parseInt(newRadio.external_id),
      });
      setShowAdd(false);
      setNewRadio({ external_id: "", name: "", stream_url: "", icon_url: "", is_active: true, is_public: true, is_free: false });
      fetchRadios();
    } catch (e: any) {
      setAddError(e.response?.data?.message || "დამატება ვერ მოხერხდა");
    } finally {
      setAddLoading(false);
    }
  };

  /* ── Edit ── */
  const openEditModal = (r: RadioChannel) => {
    setEditTarget(r);
    setEditForm({
      external_id: String(r.external_id),
      name: r.name,
      stream_url: r.stream_url,
      icon_url: r.icon_url ?? "",
      is_active: Boolean(r.is_active),
      is_public: Boolean(r.is_public),
      is_free: Boolean(r.is_free),
    });
    setEditError(null);
    setEditModal(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    setEditLoading(true);
    setEditError(null);
    try {
      await api.put(`/api/admin/radios/${editTarget.id}`, {
        ...editForm,
        external_id: parseInt(editForm.external_id),
      });
      setEditModal(false);
      fetchRadios();
    } catch (e: any) {
      setEditError(e.response?.data?.message || "განახლება ვერ მოხერხდა");
    } finally {
      setEditLoading(false);
    }
  };

  /* ── Delete ── */
  const openDeleteModal = (r: RadioChannel) => {
    setDeleteTarget(r);
    setDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/api/admin/radios/${deleteTarget.id}`);
      setDeleteModal(false);
      fetchRadios();
    } catch (e) {
      console.error(e);
    } finally {
      setDeleteLoading(false);
    }
  };

  /* ── Shared input style ── */
  const inp = "w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors";

  return (
    <div className="space-y-5">
      {/* ── Top bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <p className="text-zinc-400 text-xs">
            სულ <span className="text-zinc-200 font-semibold">{radios.length}</span> რადიო არხი
          </p>
          <span className="text-zinc-700 text-xs">·</span>
          <p className="text-zinc-600 text-xs">
            <span className="text-emerald-400">{radios.filter(r => Boolean(r.is_active)).length}</span> აქტიური
          </p>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="ძიება სახელი ან ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full sm:w-56 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
          />
          <button
            onClick={() => { setShowAdd(true); setAddError(null); }}
            className="cursor-pointer shrink-0 bg-sky-600 hover:bg-sky-500 transition-colors text-white px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-1.5"
          >
            <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
              <path d="M5.5 1v9M1 5.5h9" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            რადიოს დამატება
          </button>
        </div>
      </div>

      {/* ── Add form ── */}
      {showAdd && (
        <div className="bg-zinc-900 p-5 rounded-2xl border border-zinc-700 space-y-3 shadow-lg">
          <p className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-1">ახალი რადიო არხი</p>
          <div className="grid grid-cols-2 gap-3">
            <input
              placeholder="External ID (რიცხვი)"
              type="number" min="0" max="200"
              className={inp}
              value={newRadio.external_id}
              onChange={e => setNewRadio({ ...newRadio, external_id: e.target.value })}
            />
            <input
              placeholder="სახელი"
              className={inp}
              value={newRadio.name}
              onChange={e => setNewRadio({ ...newRadio, name: e.target.value })}
            />
          </div>
          <input
            placeholder="Stream URL (https://…)"
            className={inp}
            value={newRadio.stream_url}
            onChange={e => setNewRadio({ ...newRadio, stream_url: e.target.value })}
          />
          <input
            placeholder="ლოგოს URL (optional)"
            className={inp}
            value={newRadio.icon_url}
            onChange={e => setNewRadio({ ...newRadio, icon_url: e.target.value })}
          />
          <div className="flex items-center gap-5">
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
              <input type="checkbox" className="accent-sky-500" checked={newRadio.is_active} onChange={e => setNewRadio({ ...newRadio, is_active: e.target.checked })} />
              აქტიური
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
              <input type="checkbox" className="accent-sky-500" checked={newRadio.is_public} onChange={e => setNewRadio({ ...newRadio, is_public: e.target.checked })} />
              საჯარო
            </label>
            <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
              <input type="checkbox" className="accent-sky-500" checked={newRadio.is_free} onChange={e => setNewRadio({ ...newRadio, is_free: e.target.checked })} />
              უფასო
            </label>
          </div>
          {addError && (
            <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{addError}</p>
          )}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleAdd}
              disabled={addLoading || !newRadio.name || !newRadio.stream_url || !newRadio.external_id}
              className="cursor-pointer bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed px-5 py-2 rounded-xl text-xs font-medium transition-colors flex items-center gap-2"
            >
              {addLoading ? <><IconSpinner />შენახვა…</> : "შენახვა"}
            </button>
            <button
              onClick={() => { setShowAdd(false); setAddError(null); }}
              className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-xl text-xs transition-colors"
            >
              გაუქმება
            </button>
          </div>
        </div>
      )}

      {/* ── Table ── */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
            <IconSpinner /><span>Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3 text-zinc-600">
            <div className="text-zinc-700"><IconRadio /></div>
            <p className="text-sm font-medium">რადიო არხები ვერ მოიძებნა</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-800/50 text-[0.6rem] uppercase tracking-widest text-zinc-500">
                <tr>
                  <th className="p-4">ID</th>
                  <th className="p-4">არხი</th>
                  <th className="p-4">Stream URL</th>
                  <th className="p-4">აქტიური</th>
                  <th className="p-4">საჯარო</th>
                  <th className="p-4">ტიპი</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r.id} className="border-t border-zinc-800 hover:bg-zinc-800/30 transition-colors">
                    {/* External ID */}
                    <td className="p-4">
                      <span className="font-mono text-xs text-zinc-500 bg-zinc-800 border border-zinc-700/50 px-2 py-0.5 rounded-md">
                        #{r.external_id}
                      </span>
                    </td>

                    {/* Name + logo */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                          {r.icon_url ? (
                            <img
                              src={r.icon_url}
                              className="w-7 h-7 object-contain"
                              onError={e => (e.currentTarget.style.display = "none")}
                            />
                          ) : (
                            <span className="text-zinc-600"><IconRadio /></span>
                          )}
                        </div>
                        <span className="text-zinc-200 font-medium text-sm">{r.name}</span>
                      </div>
                    </td>

                    {/* Stream URL */}
                    <td className="p-4 max-w-xs">
                      <a
                        href={r.stream_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="text-sky-400 hover:text-sky-300 font-mono text-[0.62rem] truncate block max-w-55 transition-colors"
                        title={r.stream_url}
                      >
                        {r.stream_url}
                      </a>
                    </td>

                    {/* is_active toggle */}
                    <td className="p-4">
                      <ToggleSwitch
                        checked={Boolean(r.is_active)}
                        loading={togglingField[r.id] === "active"}
                        onChange={() => handleToggleActive(r)}
                        colorOn="bg-emerald-500"
                      />
                    </td>

                    {/* is_public toggle */}
                    <td className="p-4">
                      <ToggleSwitch
                        checked={Boolean(r.is_public)}
                        loading={togglingField[r.id] === "public"}
                        onChange={() => handleTogglePublic(r)}
                        colorOn="bg-sky-500"
                      />
                    </td>

                    {/* Free / Paid badge */}
                    <td className="p-4">
                      {Boolean(r.is_free) ? (
                        <span className="inline-flex items-center text-[0.6rem] font-medium bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5 rounded-md">
                          უფასო
                        </span>
                      ) : (
                        <span className="inline-flex items-center text-[0.6rem] font-medium bg-violet-500/10 text-violet-400 border border-violet-500/20 px-2 py-0.5 rounded-md">
                          ფასიანი
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="p-4">
                      <RadioMenu
                        onEdit={() => openEditModal(r)}
                        onDelete={() => openDeleteModal(r)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════ */}
      {editModal && editTarget && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setEditModal(false); }}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-zinc-800 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-zinc-100">რადიოს რედაქტირება</h3>
                <p className="text-[0.65rem] text-zinc-500 mt-0.5 font-mono">ID: {editTarget.id} · Ext: #{editTarget.external_id}</p>
              </div>
              <button
                onClick={() => setEditModal(false)}
                className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
              >✕</button>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">External ID</label>
                  <input
                    type="number" min="0" max="200"
                    className={inp}
                    value={editForm.external_id}
                    onChange={e => setEditForm({ ...editForm, external_id: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">სახელი</label>
                  <input
                    className={inp}
                    value={editForm.name}
                    onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">Stream URL</label>
                <input
                  className={inp}
                  value={editForm.stream_url}
                  onChange={e => setEditForm({ ...editForm, stream_url: e.target.value })}
                />
              </div>
              <div>
                <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">ლოგოს URL</label>
                <div className="flex gap-2 items-center">
                  <input
                    className="flex-1 bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                    value={editForm.icon_url}
                    onChange={e => setEditForm({ ...editForm, icon_url: e.target.value })}
                    placeholder="https://…"
                  />
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                    {editForm.icon_url ? (
                      <img src={editForm.icon_url} className="w-7 h-7 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                    ) : (
                      <span className="text-zinc-600 text-sm">📻</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-5">
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                  <input type="checkbox" className="accent-sky-500" checked={editForm.is_active} onChange={e => setEditForm({ ...editForm, is_active: e.target.checked })} />
                  აქტიური
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                  <input type="checkbox" className="accent-sky-500" checked={editForm.is_public} onChange={e => setEditForm({ ...editForm, is_public: e.target.checked })} />
                  საჯარო
                </label>
                <label className="flex items-center gap-2 text-xs text-zinc-400 cursor-pointer select-none">
                  <input type="checkbox" className="accent-sky-500" checked={editForm.is_free} onChange={e => setEditForm({ ...editForm, is_free: e.target.checked })} />
                  უფასო
                </label>
              </div>
              {editError && (
                <p className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 px-3 py-2 rounded-lg">{editError}</p>
              )}
            </div>
            <div className="px-5 pb-5 flex gap-2 justify-end">
              <button
                onClick={() => setEditModal(false)}
                className="cursor-pointer px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                გაუქმება
              </button>
              <button
                onClick={handleEdit}
                disabled={editLoading || !editForm.name || !editForm.stream_url}
                className="cursor-pointer px-5 py-2 rounded-xl text-xs bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
              >
                {editLoading ? <><IconSpinner />შენახვა…</> : <><IconCheck />ცვლილებების შენახვა</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          DELETE CONFIRM MODAL
      ══════════════════════════════════════════ */}
      {deleteModal && deleteTarget && (
        <div
          className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
          onClick={e => { if (e.target === e.currentTarget) setDeleteModal(false); }}
        >
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
            <div className="p-6 flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
                  <path d="M10 11v4M14 11v4"/>
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-zinc-100 text-base">რადიო არხის წაშლა?</h3>
                <p className="text-xs text-zinc-500 mt-2 leading-relaxed">
                  <span className="text-zinc-300 font-medium">"{deleteTarget.name}"</span> სამუდამოდ წაიშლება.<br/>ეს ქმედება შეუქცევადია.
                </p>
              </div>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button
                onClick={() => setDeleteModal(false)}
                className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
              >
                გაუქმება
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteLoading}
                className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center justify-center gap-2"
              >
                {deleteLoading ? <><IconSpinner />წაშლა…</> : "წაშლა"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
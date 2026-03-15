
import { useState, useRef, useEffect } from "react";
import api from "../../src/lib/axios";

type Channel = {
  id: string;
  uuid: string;
  name: string;
  logo: string;
  number: number;
  url: string;
  category: any[];
};

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

const IconEdit = () => (
  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11.5 2.5l2 2-9 9H2.5v-2l9-9z"/>
  </svg>
);

/* ── Edit Modal ── */
function EditChannelModal({
  channel,
  onClose,
  onSaved,
}: {
  channel: Channel;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name_en: channel.name ?? "",
    name_ka: "",
    icon_url: channel.logo ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const handle = async () => {
    setSaving(true); setErr(null); setOk(false);
    try {
      const payload: Record<string, string> = {};
      if (form.name_en.trim())  payload.name_en  = form.name_en.trim();
      if (form.name_ka.trim())  payload.name_ka  = form.name_ka.trim();
      if (form.icon_url.trim()) payload.icon_url = form.icon_url.trim();

      await api.put(`/api/admin/channels/${channel.uuid}`, payload);
      setOk(true);
      setTimeout(() => { onSaved(); onClose(); }, 900);
    } catch (e: any) {
      setErr(e.response?.data?.message || "შეცდომა");
    } finally { setSaving(false); }
  };

  // close on backdrop click
  const backdropRef = useRef<HTMLDivElement>(null);

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === backdropRef.current) onClose(); }}
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-zinc-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 overflow-hidden">
            {form.icon_url.trim()
              ? <img src={form.icon_url} className="w-7 h-7 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
              : <span className="text-lg">📺</span>
            }
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-zinc-100 leading-tight truncate">{channel.name}</h3>
            <p className="text-[0.6rem] text-zinc-600 font-mono mt-0.5 truncate">{channel.uuid}</p>
          </div>
          <button
            onClick={onClose}
            className="cursor-pointer w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >✕</button>
        </div>

        {/* Fields */}
        <div className="p-5 space-y-3">
          <div>
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">
              სახელი (EN)
            </label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
              value={form.name_en}
              onChange={e => setForm({ ...form, name_en: e.target.value })}
              placeholder="Channel name in English"
            />
          </div>
          <div>
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">
              სახელი (KA)
            </label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
              value={form.name_ka}
              onChange={e => setForm({ ...form, name_ka: e.target.value })}
              placeholder="არხის სახელი ქართულად"
            />
          </div>
          <div>
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">
              Icon URL
            </label>
            <div className="flex gap-2 items-center">
              <input
                className="flex-1 bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
                value={form.icon_url}
                onChange={e => setForm({ ...form, icon_url: e.target.value })}
                placeholder="https://…"
              />
              <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden">
                {form.icon_url.trim()
                  ? <img src={form.icon_url} className="w-7 h-7 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                  : <span className="text-lg">📺</span>
                }
              </div>
            </div>
          </div>

          {err && <p className="text-xs text-red-400">{err}</p>}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-2 justify-end">
          <button
            onClick={onClose}
            className="cursor-pointer px-4 py-2 rounded-xl text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
          >
            გაუქმება
          </button>
          <button
            onClick={handle}
            disabled={saving || (!form.name_en.trim() && !form.name_ka.trim() && !form.icon_url.trim())}
            className="cursor-pointer px-5 py-2 rounded-xl text-xs bg-violet-600 hover:bg-violet-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium transition-colors flex items-center gap-2"
          >
            {saving ? <><Spinner />შენახვა…</> : ok ? <><IconCheck />შენახულია!</> : <><IconCheck />შენახვა</>}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════
   MAIN EXPORT
════════════════════════════════════════ */
interface Props {
  channels: Channel[];
  channelsLoading: boolean;
  fetchChannels: () => Promise<void>;
}

export default function AdminChannelsSection({ channels, channelsLoading, fetchChannels }: Props) {
  const [search, setSearch] = useState("");
  const [editTarget, setEditTarget] = useState<Channel | null>(null);
  const [selected, setSelected] = useState<Channel | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncMsg, setSyncMsg] = useState<string | null>(null);
  const [syncErr, setSyncErr] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ message: string; onConfirm: () => void } | null>(null);

const doSync = async () => {
  setSyncing(true); setSyncMsg(null); setSyncErr(null);
  try {
    const res = await api.post("/api/admin/channels/sync");
    setSyncMsg(res.data.message ?? `${res.data.count} არხი სინქრონიზებულია`);
    await fetchChannels();
    setTimeout(() => setSyncMsg(null), 4000);
  } catch (e: any) {
    setSyncErr(e.response?.data?.message || "სინქრონიზაცია ვერ მოხერხდა");
    setTimeout(() => setSyncErr(null), 4000);
  } finally { setSyncing(false); }
};
  const filtered = channels.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.uuid.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between gap-3">
  <p className="text-zinc-400 text-xs">
    სულ <span className="text-zinc-200 font-semibold">{channels.length}</span> არხი
  </p>
  <div className="flex items-center gap-2">
    {syncMsg && (
      <span className="text-xs text-emerald-400 flex items-center gap-1.5">
        <IconCheck />{syncMsg}
      </span>
    )}
    {syncErr && (
      <span className="text-xs text-red-400">{syncErr}</span>
    )}
    <input
      type="text"
      placeholder="სახელი ან UUID…"
      value={search}
      onChange={e => setSearch(e.target.value)}
      className="w-64 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-zinc-600 transition-colors"
    />
    <button
      onClick={() => setConfirm({
  message: "ამ მოქმედებით Legacy სერვერიდან არხების სინქრონიზაცია მოხდება. ახალი არხები დაემატება სისტემაში.",
  onConfirm: doSync,
})}
      disabled={syncing}
      className="cursor-pointer flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 hover:border-zinc-600 disabled:opacity-40 disabled:cursor-not-allowed text-zinc-300 text-xs font-medium px-4 py-2 rounded-xl transition-colors shrink-0"
    >
      {syncing ? (
        <><Spinner />სინქრონიზაცია…</>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 7A6 6 0 0112.5 4M13 7a6 6 0 01-11.5 3"/>
            <path d="M11 4h2V2M3 10H1v2"/>
          </svg>
          სინქრონიზაცია
        </>
      )}
    </button>
  </div>
</div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-x-auto min-w-0">
        {channelsLoading ? (
          <div className="flex items-center justify-center gap-2 py-20 text-zinc-500 text-sm">
            <Spinner /><span>Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 text-zinc-600 text-sm">
            არხები ვერ მოიძებნა
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-zinc-800/50 text-[0.6rem] uppercase tracking-widest text-zinc-500">
              <tr>
                <th className="p-4">#</th>
                <th className="p-4">არხი</th>
                <th className="p-4">UUID</th>
                <th className="p-4">კატეგორია</th>
                <th className="p-4 w-16"></th>
              </tr>
            </thead>
           <tbody>
  {filtered.map((c, idx) => {
    const isSelected = selected?.uuid === c.uuid;
    return (
      <tr
        key={c.id}
        onClick={() => setSelected(isSelected ? null : c)}
        className={`border-t border-zinc-800 cursor-pointer transition-colors select-none ${
          isSelected
            ? "bg-violet-500/10 hover:bg-violet-500/15"
            : "hover:bg-zinc-800/30"
        }`}
      >
        <td className="p-4 font-mono text-[0.65rem] text-zinc-600 tabular-nums">
          {idx + 1}
        </td>
        <td className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 overflow-hidden">
              {c.logo
                ? <img src={c.logo} className="w-6 h-6 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                : <span className="text-xs text-zinc-600">📺</span>
              }
            </div>
            <span className="text-zinc-200 font-medium">{c.name}</span>
          </div>
        </td>
        <td className="p-4 font-mono text-[0.65rem] text-zinc-500">{c.uuid}</td>
        <td className="p-4">
          {c.category && (Array.isArray(c.category) ? c.category.length > 0 : c.category) ? (
            <span className="inline-block bg-violet-600/20 text-violet-300 px-2 py-1 rounded-md text-xs font-medium">
              {Array.isArray(c.category) ? c.category.join(", ") : c.category}
            </span>
          ) : (
            <span className="text-[0.65rem] text-zinc-700">—</span>
          )}
        </td>
        <td className="p-4">
          {isSelected && (
            <button
              onClick={e => { e.stopPropagation(); setEditTarget(c); setSelected(null); }}
              className="cursor-pointer flex items-center gap-1.5 text-[0.65rem] font-medium text-violet-300 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 px-2.5 py-1 rounded-lg transition-colors"
            >
              <IconEdit />
              რედაქტირება
            </button>
          )}
        </td>
      </tr>
    );
  })}
</tbody>
          </table>
        )}
      </div>

      {/* Edit modal */}
      {editTarget && (
        <EditChannelModal
          channel={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={fetchChannels}
        />
      )}
      {confirm && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-xs shadow-2xl overflow-hidden">
      <div className="p-5 text-center space-y-3">
        <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 9v4M12 17h.01"/>
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          </svg>
        </div>
        <p className="text-zinc-100 font-semibold text-sm">დარწმუნებული ხარ?</p>
        <p className="text-zinc-500 text-xs leading-relaxed">{confirm.message}</p>
      </div>
      <div className="px-5 pb-5 flex gap-2">
        <button
          onClick={() => setConfirm(null)}
          className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 transition-colors"
        >
          არა
        </button>
        <button
          onClick={() => { confirm.onConfirm(); setConfirm(null); }}
          className="cursor-pointer flex-1 py-2.5 rounded-xl text-sm bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors"
        >
          დიახ
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
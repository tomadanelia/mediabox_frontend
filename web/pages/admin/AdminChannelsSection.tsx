import { useState, useRef, useEffect } from "react";
import api from "../../src/lib/axios";
import type { Channel } from "../../src/types/channel";

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

const IconX = () => (
  <svg width="11" height="11" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <path d="M2 2l10 10M12 2L2 12"/>
  </svg>
);

/* ── Inline editable Live URL row ── */
function LiveUrlRow({
  u,
  channelId,
  onDelete,
  onSaved,
}: {
  u: any;
  channelId: string;
  onDelete: (id: string) => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(u.channel_url);
  const [urlType, setUrlType] = useState(String(u.url_type ?? ""));
  const [priority, setPriority] = useState(String(u.priority ?? ""));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) urlRef.current?.focus();
  }, [editing]);

  const cancel = () => {
    setUrl(u.channel_url);
    setUrlType(String(u.url_type ?? ""));
    setPriority(String(u.priority ?? ""));
    setEditing(false);
  };

  const save = async () => {
    if (!url.trim()) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/channels/${channelId}/urls/${u.id}`, {
        channel_url: url.trim(),
        ...(urlType.trim() !== "" && { url_type: parseInt(urlType) }),
        ...(priority.trim() !== "" && { priority: parseInt(priority) }),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); setEditing(false); onSaved(); }, 700);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-zinc-800/80 border border-violet-500/30 rounded-lg px-3 py-2 space-y-2 ring-1 ring-violet-500/10">
        <input
          ref={urlRef}
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:border-violet-500/60 transition-colors"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 flex-1">
            <span className="text-[0.6rem] text-zinc-600 shrink-0">ტიპი</span>
            <input
              value={urlType}
              onChange={e => setUrlType(e.target.value)}
              placeholder=""
              className="w-12 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-center focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1 flex-1">
            <span className="text-[0.6rem] text-zinc-600 shrink-0">პრიორ.</span>
            <input
              value={priority}
              onChange={e => setPriority(e.target.value)}
              placeholder=""
              className="w-12 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-center focus:outline-none focus:border-violet-500/60 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={cancel}
              className="cursor-pointer w-6 h-6 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              <IconX />
            </button>
            <button
              onClick={save}
              disabled={saving || !url.trim()}
              className="cursor-pointer flex items-center gap-1 bg-violet-600/30 border border-violet-500/40 hover:bg-violet-600/50 disabled:opacity-40 text-violet-300 text-[0.65rem] px-2.5 py-1 rounded-md transition-colors"
            >
              {saving ? <Spinner /> : saved ? <IconCheck /> : <><IconCheck /><span>შენახვა</span></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 hover:border-zinc-600/50 transition-colors">
      <span className="font-mono text-[0.6rem] text-zinc-400 flex-1 truncate">{u.channel_url}</span>
      <span className="text-[0.6rem] bg-zinc-700/60 text-zinc-400 border border-zinc-600/30 px-1.5 py-0.5 rounded shrink-0">ტიპი: {u.url_type}</span>
      {u.priority > 0 && (
        <span className="text-[0.6rem] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">p{u.priority}</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="cursor-pointer w-5 h-5 flex items-center justify-center rounded text-zinc-600 hover:text-violet-400 hover:bg-violet-500/10 transition-colors opacity-0 group-hover:opacity-100"
        title="რედაქტირება"
      >
        <IconEdit />
      </button>
      <button
        onClick={() => onDelete(u.id)}
        className="cursor-pointer w-5 h-5 flex items-center justify-center rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs opacity-0 group-hover:opacity-100"
      >✕</button>
    </div>
  );
}

/* ── Inline editable Archive URL row ── */
function ArchiveUrlRow({
  u,
  channelId,
  onDelete,
  onSaved,
}: {
  u: any;
  channelId: string;
  onDelete: (id: string) => void;
  onSaved: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [url, setUrl] = useState(u.channel_url);
  const [urlType, setUrlType] = useState(String(u.url_type ?? ""));
  const [archiveLength, setArchiveLength] = useState(String(u.archive_length ?? ""));
  const [priority, setPriority] = useState(String(u.priority ?? ""));
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const urlRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) urlRef.current?.focus();
  }, [editing]);

  const cancel = () => {
    setUrl(u.channel_url);
    setUrlType(String(u.url_type ?? ""));
    setArchiveLength(String(u.archive_length ?? ""));
    setPriority(String(u.priority ?? ""));
    setEditing(false);
  };

  const save = async () => {
    if (!url.trim()) return;
    setSaving(true);
    try {
      await api.put(`/api/admin/channels/${channelId}/archive-urls/${u.id}`, {
        channel_url: url.trim(),
        ...(archiveLength.trim() !== "" && { archive_length: parseInt(archiveLength) }),
        ...(priority.trim() !== "" && { priority: parseInt(priority) }),
      });
      setSaved(true);
      setTimeout(() => { setSaved(false); setEditing(false); onSaved(); }, 700);
    } finally {
      setSaving(false);
    }
  };

  if (editing) {
    return (
      <div className="bg-zinc-800/80 border border-blue-500/30 rounded-lg px-3 py-2 space-y-2 ring-1 ring-blue-500/10">
        <input
          ref={urlRef}
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="w-full bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs font-mono focus:outline-none focus:border-blue-500/60 transition-colors"
        />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-[0.6rem] text-zinc-600 shrink-0">ტიპი</span>
            <input
              value={urlType}
              onChange={e => setUrlType(e.target.value)}
              placeholder=""
              className="w-12 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[0.6rem] text-zinc-600 shrink-0">სთ.</span>
            <input
              value={archiveLength}
              onChange={e => setArchiveLength(e.target.value)}
              placeholder="168"
              className="w-14 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-[0.6rem] text-zinc-600 shrink-0">პრიორ.</span>
            <input
              value={priority}
              onChange={e => setPriority(e.target.value)}
              placeholder="0"
              className="w-12 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs text-center focus:outline-none focus:border-blue-500/60 transition-colors"
            />
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <button
              onClick={cancel}
              className="cursor-pointer w-6 h-6 flex items-center justify-center rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 transition-colors"
            >
              <IconX />
            </button>
            <button
              onClick={save}
              disabled={saving || !url.trim()}
              className="cursor-pointer flex items-center gap-1 bg-blue-600/30 border border-blue-500/40 hover:bg-blue-600/50 disabled:opacity-40 text-blue-300 text-[0.65rem] px-2.5 py-1 rounded-md transition-colors"
            >
              {saving ? <Spinner /> : saved ? <IconCheck /> : <><IconCheck /><span>შენახვა</span></>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="group flex items-center gap-2 bg-zinc-800/60 border border-zinc-700/50 rounded-lg px-3 py-2 hover:border-zinc-600/50 transition-colors">
      <span className="font-mono text-[0.6rem] text-zinc-400 flex-1 truncate">{u.channel_url}</span>
      <span className="text-[0.6rem] bg-zinc-700/60 text-zinc-400 border border-zinc-600/30 px-1.5 py-0.5 rounded shrink-0">ტიპი: {u.url_type}</span>
      {u.archive_length && (
        <span className="text-[0.6rem] bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1.5 py-0.5 rounded shrink-0">{u.archive_length}h</span>
      )}
      {u.priority > 0 && (
        <span className="text-[0.6rem] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded shrink-0">p{u.priority}</span>
      )}
      <button
        onClick={() => setEditing(true)}
        className="cursor-pointer w-5 h-5 flex items-center justify-center rounded text-zinc-600 hover:text-blue-400 hover:bg-blue-500/10 transition-colors opacity-0 group-hover:opacity-100"
        title="რედაქტირება"
      >
        <IconEdit />
      </button>
      <button
        onClick={() => onDelete(u.id)}
        className="cursor-pointer w-5 h-5 flex items-center justify-center rounded text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-colors text-xs opacity-0 group-hover:opacity-100"
      >✕</button>
    </div>
  );
}

/* ── Channel URL Panel ── */
function ChannelUrlPanel({ channel }: { channel: Channel }) {
  const [data, setData]     = useState<{ live_urls: any[]; archive_urls: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveInput, setLiveInput]     = useState("");
  const [archiveInput, setArchiveInput] = useState("");
  const [archiveHours, setArchiveHours] = useState("168");
  const [liveUrlType, setLiveUrlType] = useState("1");
  const [archiveUrlType, setArchiveUrlType] = useState("1");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/api/admin/channels/${channel.id}/urls`);
      setData(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [channel.id]);

  const addLive = async () => {
    if (!liveInput.trim()) return;
    setBusy("live");
    try {
      await api.post(`/api/admin/channels/${channel.id}/urls`, {
        channel_url: liveInput.trim(),
        url_type: parseInt(liveUrlType) || 1,
      });
      setLiveInput(""); load();
    } finally { setBusy(null); }
  };

  const addArchive = async () => {
    if (!archiveInput.trim()) return;
    setBusy("archive");
    try {
      await api.post(`/api/admin/channels/${channel.id}/archive-urls`, {
        channel_url: archiveInput.trim(),
        archive_length: parseInt(archiveHours) || 168,
        url_type: parseInt(archiveUrlType) || 1,
      });
      setArchiveInput(""); load();
    } finally { setBusy(null); }
  };

  const delLive = async (id: string) => {
    await api.delete(`/api/admin/channels/${channel.id}/urls/${id}`);
    load();
  };

  const delArchive = async (id: string) => {
    await api.delete(`/api/admin/channels/${channel.id}/archive-urls/${id}`);
    load();
  };

  if (loading) return (
    <div className="flex items-center gap-2 py-4 px-2 text-zinc-500 text-xs">
      <Spinner /> Loading URLs…
    </div>
  );

  return (
    <div className="grid grid-cols-2 gap-0 divide-x divide-zinc-800">
      {/* Live URLs */}
      <div className="p-4 space-y-2">
        <p className="text-[0.6rem] uppercase tracking-widest text-zinc-500 flex justify-between">
          <span>ლაივის ლინკები</span>
          <span className="normal-case tracking-normal">{data?.live_urls.length ?? 0} ცალი</span>
        </p>
        {data?.live_urls.length === 0 && (
          <p className="text-[0.65rem] text-zinc-700 py-2">ჯერ არ არის დამატებული ლინკები</p>
        )}
        {data?.live_urls.map((u) => (
          <LiveUrlRow
            key={u.id}
            u={u}
            channelId={channel.id}
            onDelete={delLive}
            onSaved={load}
          />
        ))}
        <div className="flex gap-2 pt-1">
          <input
            value={liveInput}
            onChange={e => setLiveInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addLive()}
            placeholder="ლაივ-სტრიმ url…"
            className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <input
            type="text"
            value={liveUrlType}
            onChange={e => setLiveUrlType(e.target.value)}
            placeholder="ტიპი"
            className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <button
            onClick={addLive}
            disabled={busy === "live" || !liveInput.trim()}
            className="cursor-pointer flex items-center gap-1.5 bg-violet-600/20 border border-violet-500/30 hover:bg-violet-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-violet-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            {busy === "live" ? <Spinner /> : "+ დამატება"}
          </button>
        </div>
      </div>

      {/* Archive URLs */}
      <div className="p-4 space-y-2">
        <p className="text-[0.6rem] uppercase tracking-widest text-zinc-500 flex justify-between">
          <span>არქივის ლინკები</span>
          <span className="normal-case tracking-normal">{data?.archive_urls.length ?? 0} ცალი</span>
        </p>
        {data?.archive_urls.length === 0 && (
          <p className="text-[0.65rem] text-zinc-700 py-2">ჯერ არ არის დამატებული ლინკები</p>
        )}
        {data?.archive_urls.map((u) => (
          <ArchiveUrlRow
            key={u.id}
            u={u}
            channelId={channel.id}
            onDelete={delArchive}
            onSaved={load}
          />
        ))}
        <div className="flex gap-2 pt-1">
          <input
            value={archiveInput}
            onChange={e => setArchiveInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addArchive()}
            placeholder="არქივის URL…"
            className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs font-mono focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <input
            value={archiveHours}
            onChange={e => setArchiveHours(e.target.value)}
            placeholder="168h"
            className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <input
            type="text"
            value={archiveUrlType}
            onChange={e => setArchiveUrlType(e.target.value)}
            placeholder="ტიპი"
            className="w-14 bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-xs text-center focus:outline-none focus:border-zinc-500 transition-colors"
          />
          <button
            onClick={addArchive}
            disabled={busy === "archive" || !archiveInput.trim()}
            className="cursor-pointer flex items-center gap-1.5 bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 disabled:opacity-40 disabled:cursor-not-allowed text-blue-300 text-xs px-3 py-1.5 rounded-lg transition-colors"
          >
            {busy === "archive" ? <Spinner /> : "+ დამატება"}
          </button>
        </div>
      </div>
    </div>
  );
}

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
    name: channel.name ?? "",
    icon_url: channel.logo ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const handle = async () => {
    setSaving(true); setErr(null); setOk(false);
    try {
      const payload: Record<string, string> = {};
      if (form.name.trim())     payload.name     = form.name.trim();
      if (form.icon_url.trim()) payload.icon_url = form.icon_url.trim();

      await api.put(`/api/admin/channels/${channel.uuid}`, payload);
      setOk(true);
      setTimeout(() => { onSaved(); onClose(); }, 900);
    } catch (e: any) {
      setErr(e.response?.data?.message || "შეცდომა");
    } finally { setSaving(false); }
  };

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
              სახელი
            </label>
            <input
              className="w-full bg-zinc-800 border border-zinc-700 p-2.5 rounded-xl text-sm focus:outline-none focus:border-zinc-500 transition-colors"
              value={form.name}
              onChange={e => setForm({ ...form, name: e.target.value })}
              placeholder="Channel name"
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
            disabled={saving || (!form.name.trim() && !form.icon_url.trim())}
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
  const [activeOverrides, setActiveOverrides] = useState<Record<string, boolean>>({});
  const [publicOverrides, setPublicOverrides] = useState<Record<string, boolean>>({});
  const [sortField, setSortField] = useState<"name" | "number" | "none">("none");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
const [dragId, setDragId] = useState<string | null>(null);
const [dragOverId, setDragOverId] = useState<string | null>(null);
const [numberSaving, setNumberSaving] = useState<string | null>(null);
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
 const autoScrollRef = useRef<number | null>(null);
const dragY = useRef<number>(0);

useEffect(() => {
  if (!dragId) {
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
    return;
  }

 
  const onPointerMove = (e: PointerEvent) => {
  dragY.current = e.clientY;
};

  const scroll = () => {
    const threshold = 80;
    const speed = 14;
    const y = dragY.current;

    if (y < threshold) {
      window.scrollBy(0, -speed * (1 - y / threshold));
    } else if (y > window.innerHeight - threshold) {
      window.scrollBy(0, speed * (1 - (window.innerHeight - y) / threshold));
    }

    autoScrollRef.current = requestAnimationFrame(scroll);
  };

  document.addEventListener("pointermove", onPointerMove);
  autoScrollRef.current = requestAnimationFrame(scroll);

  return () => {
    document.removeEventListener("pointermove", onPointerMove);
    if (autoScrollRef.current) {
      cancelAnimationFrame(autoScrollRef.current);
      autoScrollRef.current = null;
    }
  };
}, [dragId]); // ← re-runs when drag starts/stops

  const handleDrop = async (targetChannel: Channel) => {
  if (!dragId || dragId === targetChannel.uuid) {
    setDragId(null); setDragOverId(null); return;
  }
  const dragged = channels.find(c => c.uuid === dragId);
  if (!dragged) return;
  setNumberSaving(dragId);
  setDragId(null); setDragOverId(null);
  try {
    await api.patch(`/api/admin/channels/${dragged.uuid}/number`, { number: targetChannel.number });
    await fetchChannels();
  } catch (e: any) {
    setSyncErr(e.response?.data?.message || "ნომრის შეცვლა ვერ მოხერხდა");
    setTimeout(() => setSyncErr(null), 4000);
  } finally { setNumberSaving(null); }
};
const filtered = channels
  .filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.uuid.toLowerCase().includes(search.toLowerCase())
  )
  .sort((a, b) => {
    if (sortField === "none") return 0;
    if (sortField === "name") {
      return sortDirection === "asc"
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name);
    }
    if (sortField === "number") {
      const na = Number(a.number ?? 9999);
      const nb = Number(b.number ?? 9999);
      return sortDirection === "asc" ? na - nb : nb - na;
    }
    return 0;
  });

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
         <div className="grid grid-cols-2 divide-x divide-zinc-800">
  {[0, 1].map(col => {
    const half = Math.ceil(filtered.length / 2);
    const slice = filtered.slice(col * half, col * half + half);
    return (
      <div key={col}>
        {/* Column header */}
       <div className="grid grid-cols-[1.5rem_3.5rem_1fr_4.5rem_3rem_3rem_2rem] gap-x-2 items-center bg-zinc-800/50 px-3 py-2 text-[0.6rem] uppercase tracking-widest text-zinc-500 border-b border-zinc-800">
  
          {/* Col 1: drag handle placeholder */}
          <div />

          {/* Col 2: number with sort */}
          <div className="flex items-center gap-0.5">
            <button onClick={() => { setSortField("number"); setSortDirection("desc"); }}
              className={`cursor-pointer -ml-1 hover:text-zinc-300 transition-colors ${sortField === "number" && sortDirection === "desc" ? "text-violet-400" : "text-zinc-600"}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
            <button onClick={() => { setSortField("number"); setSortDirection("asc"); }}
              className={`cursor-pointer hover:text-zinc-300 transition-colors ${sortField === "number" && sortDirection === "asc" ? "text-violet-400" : "text-zinc-600"}`}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <span>არხი</span>
            <button onClick={() => { setSortField("name"); setSortDirection("desc"); }}
              className={`cursor-pointer hover:text-zinc-300 transition-colors ${sortField === "name" && sortDirection === "desc" ? "text-violet-400" : "text-zinc-600"}`}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 15l-6-6-6 6"/></svg>
            </button>
            <button onClick={() => { setSortField("name"); setSortDirection("asc"); }}
              className={`cursor-pointer hover:text-zinc-300 transition-colors ${sortField === "name" && sortDirection === "asc" ? "text-violet-400" : "text-zinc-600"}`}>
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6"/></svg>
            </button>
          </div>

          <span>პაკ.</span>

          <span>მუშა</span>

          <span>საჯ.</span>

          <div />
        </div>

        {slice.map((c) => {
          const isSelected = selected?.uuid === c.uuid;
          const isDragging = dragId === c.uuid;
          const isDragOver = dragOverId === c.uuid;
          return (
            <div key={c.id}>
              <div
                onClick={() => setSelected(isSelected ? null : c)}
                onDragOver={e => { e.preventDefault(); setDragOverId(c.uuid); }}
                onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOverId(null); }}
                onDrop={() => handleDrop(c)}
                className={`grid grid-cols-[1.5rem_3.5rem_1fr_4.5rem_3rem_3rem_2rem] gap-x-2 items-center px-3 py-2 border-t cursor-pointer transition-all select-none
                  ${isSelected ? "bg-violet-500/10 hover:bg-violet-500/15" : "hover:bg-zinc-800/30"}
                  ${isDragging ? "opacity-30" : ""}
                  ${isDragOver ? "border-t-violet-400 border-t-2 bg-violet-500/5" : "border-t-zinc-800"}
                `}
              >
                {/* Drag handle */}
                <div
                  draggable
                  onDragStart={e => {
                  e.stopPropagation();
                  const ghost = document.createElement("div");
                  ghost.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;opacity:0";
                  document.body.appendChild(ghost);
                  e.dataTransfer.setDragImage(ghost, 0, 0);
                  setTimeout(() => document.body.removeChild(ghost), 0);
                  setDragId(c.uuid);
                  }}                  onDragEnd={() => { setDragId(null); setDragOverId(null); }}
                  onClick={e => e.stopPropagation()}
                  className="flex items-center justify-center w-5 h-5 rounded text-zinc-700 hover:text-zinc-400 hover:bg-zinc-700/50 cursor-grab active:cursor-grabbing transition-colors"
                  title="გათრევა ნომრის შესაცვლელად"
                >
                  <svg width="8" height="12" viewBox="0 0 8 12" fill="currentColor">
                    <circle cx="2" cy="2" r="1.2"/><circle cx="6" cy="2" r="1.2"/>
                    <circle cx="2" cy="6" r="1.2"/><circle cx="6" cy="6" r="1.2"/>
                    <circle cx="2" cy="10" r="1.2"/><circle cx="6" cy="10" r="1.2"/>
                  </svg>
                </div>

                {/* Number */}
                <span className="font-mono text-[0.65rem] text-zinc-500 tabular-nums">
                  {numberSaving === c.uuid ? <Spinner /> : (c.number ?? "—")}
                </span>

                {/* Name + logo */}
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded bg-zinc-800 border border-zinc-700/50 flex items-center justify-center shrink-0 overflow-hidden">
                    {c.logo
                      ? <img src={c.logo} className="w-5 h-5 object-contain" onError={e => (e.currentTarget.style.display = "none")} />
                      : <span className="text-[0.55rem] text-zinc-600">📺</span>
                    }
                  </div>
                  <span className="text-zinc-200 font-medium text-xs truncate">{c.name}</span>
                </div>

                {/* Package */}
                <div className="flex items-center">
                  {c.is_free
                    ? <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[0.6rem]">უფასო</span>
                    : <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[0.6rem]">ფასიანი</span>
                  }
                </div>

                {/* Active toggle */}
                <div onClick={e => e.stopPropagation()}>
                  <div
                    onClick={async () => {
                      const current = c.uuid in activeOverrides ? activeOverrides[c.uuid] : (c.is_active !== false);
                      const next = !current;
                      setActiveOverrides(prev => ({ ...prev, [c.uuid]: next }));
                      try { await api.patch(`/api/admin/channels/${c.uuid}/toggle-active`); }
                      catch { setActiveOverrides(prev => ({ ...prev, [c.uuid]: current })); }
                    }}
                    className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                      (c.uuid in activeOverrides ? activeOverrides[c.uuid] : c.is_active !== false) ? "bg-emerald-500" : "bg-zinc-700"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                      (c.uuid in activeOverrides ? activeOverrides[c.uuid] : c.is_active !== false) ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </div>
                </div>

                {/* Public toggle */}
                <div onClick={e => e.stopPropagation()}>
                  <div
                    onClick={async () => {
                      const current = c.uuid in publicOverrides ? publicOverrides[c.uuid] : (c.is_public !== false);
                      const next = !current;
                      setPublicOverrides(prev => ({ ...prev, [c.uuid]: next }));
                      try { await api.patch(`/api/admin/channels/${c.uuid}/toggle-public`); }
                      catch { setPublicOverrides(prev => ({ ...prev, [c.uuid]: current })); }
                    }}
                    className={`relative w-8 h-4 rounded-full transition-colors cursor-pointer ${
                      (c.uuid in publicOverrides ? publicOverrides[c.uuid] : c.is_public !== false) ? "bg-violet-500" : "bg-zinc-700"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white shadow transition-transform ${
                      (c.uuid in publicOverrides ? publicOverrides[c.uuid] : c.is_public !== false) ? "translate-x-4" : "translate-x-0.5"
                    }`} />
                  </div>
                </div>

                {/* Edit */}
                <button
                  onClick={e => { e.stopPropagation(); setEditTarget(c); }}
                  className="cursor-pointer flex items-center justify-center w-6 h-6 rounded text-zinc-600 hover:text-violet-300 hover:bg-violet-500/10 transition-colors"
                >
                  <IconEdit />
                </button>
              </div>

              {/* Expanded URL panel — spans full width by breaking out of grid */}
              {isSelected && (
                <div className="border-t border-zinc-800 bg-zinc-900/60 px-4 pb-3">
                  <ChannelUrlPanel channel={c} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  })}
</div>
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
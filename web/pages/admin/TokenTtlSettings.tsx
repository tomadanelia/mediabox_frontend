import { useState, useEffect } from "react";
import api from "../../src/lib/axios";

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

export default function TokenTtlSettings() {
  const [liveTtl, setLiveTtl] = useState("");
  const [archiveTtl, setArchiveTtl] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await api.get("/api/admin/settings/tokens");
      setLiveTtl(res.data.live_token_lifetime_seconds?.toString() || "");
      setArchiveTtl(res.data.archive_token_lifetime_seconds?.toString() || "");
    } catch (e) {
      console.error("Failed to fetch token settings", e);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleSave = async () => {
    if (!liveTtl || !archiveTtl) return;
    
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    
    try {
      await api.post("/api/admin/settings/tokens", {
        live_token_ttl: parseInt(liveTtl, 10),
        archive_token_ttl: parseInt(archiveTtl, 10),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      if (e.response?.data?.errors) {
        const errors = e.response.data.errors;
        const msg = Object.values(errors).flat().join(", ");
        setSaveError(msg || "შენახვა ვერ მოხერხდა");
      } else {
        setSaveError(e.response?.data?.message || "შენახვა ვერ მოხერხდა");
      }
    } finally {
      setSaving(false);
    }
  };

  const isValidTtl = (val: string) => {
    const num = parseInt(val, 10);
    return !isNaN(num) && num >= 60;
  };

  const isFormValid = liveTtl && archiveTtl && isValidTtl(liveTtl) && isValidTtl(archiveTtl);

  if (initialLoading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex items-center justify-center text-zinc-500">
        <IconSpinner /> <span className="ml-2 text-sm">იტვირთება...</span>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center shrink-0 text-amber-400">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            <path d="M12 8v4"/>
            <path d="M12 16h.01"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">ტოკენის სიცოცხლის ხანგრძლივობა (TTL)</h3>
          <p className="text-[0.65rem] text-zinc-500 mt-0.5">Live და Archive სტრიმების ტოკენების დრო წამებში</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">
              Live ტოკენი (წამი)
            </label>
            <div className="relative">
              <input
                type="number"
                min="60"
                placeholder="მაგ: 3600"
                value={liveTtl}
                onChange={e => setLiveTtl(e.target.value)}
                className={`w-full bg-zinc-800 border px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors font-mono ${
                  liveTtl && !isValidTtl(liveTtl) ? "border-red-500/60 focus:border-red-500" : "border-zinc-700 focus:border-zinc-500"
                }`}
              />
            </div>
            {liveTtl && !isValidTtl(liveTtl) && (
              <p className="text-[0.65rem] text-red-400 mt-1.5">მინიმუმ 60 წამი</p>
            )}
          </div>
          
          <div className="flex-1">
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">
              Archive ტოკენი (წამი)
            </label>
            <div className="relative">
              <input
                type="number"
                min="60"
                placeholder="მაგ: 14400"
                value={archiveTtl}
                onChange={e => setArchiveTtl(e.target.value)}
                className={`w-full bg-zinc-800 border px-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors font-mono ${
                  archiveTtl && !isValidTtl(archiveTtl) ? "border-red-500/60 focus:border-red-500" : "border-zinc-700 focus:border-zinc-500"
                }`}
              />
            </div>
            {archiveTtl && !isValidTtl(archiveTtl) && (
              <p className="text-[0.65rem] text-red-400 mt-1.5">მინიმუმ 60 წამი</p>
            )}
          </div>
        </div>

        <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-4 mt-2">
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <IconCheck /> შენახულია
              </span>
            )}
            {saveError && (
              <span className="text-xs text-red-400 truncate max-w-64">{saveError}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isFormValid}
              className="cursor-pointer flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-5 py-2 rounded-xl transition-colors"
            >
              {saving ? <><IconSpinner />შენახვა…</> : <>
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2 8v3a1 1 0 001 1h8a1 1 0 001-1V8M7 2v7M4.5 5.5L7 2l2.5 3.5"/>
                </svg>
                შენახვა
              </>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

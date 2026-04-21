import { useState } from "react";
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

export default function HomepageBgSettings() {
  const [bgUrl, setBgUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState(false);

  const handleSave = async () => {
    if (!bgUrl.trim()) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await api.post("/api/admin/settings/homepage", {
        homepage_bg_url: bgUrl,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setSaveError(e.response?.data?.message || "შენახვა ვერ მოხერხდა");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M3 9l4-4 4 4 4-4 4 4"/>
            <path d="M3 15l4 4 4-4 4 4 4-4"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">მთავარი გვერდის ფონი</h3>
          <p className="text-[0.65rem] text-zinc-500 mt-0.5">Homepage-ის ბექგრაუნდ სურათის URL</p>
        </div>
      </div>

      <div className="p-6 space-y-5">
        <div className="flex items-start gap-4">
          {/* Preview box */}
          <div className="w-28 h-20 rounded-xl border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden bg-zinc-800">
            {bgUrl.trim() && !previewError ? (
              <img
                src={bgUrl}
                alt="bg preview"
                className="w-full h-full object-cover"
                onError={() => setPreviewError(true)}
                onLoad={() => setPreviewError(false)}
              />
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-zinc-600">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="3"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <path d="M21 15l-5-5L5 21"/>
                </svg>
                <span className="text-[0.6rem]">Preview</span>
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="flex-1 space-y-2">
            <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block">
              სურათის URL
            </label>
            <input
              type="url"
              value={bgUrl}
              onChange={e => { setBgUrl(e.target.value); setPreviewError(false); }}
              placeholder="https://your-cdn.com/images/hero-bg.jpg"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-3 py-2.5 text-sm text-zinc-300 placeholder-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors"
            />
            <p className="text-[0.6rem] text-zinc-600">
              ჩასვით სრული URL — გამოყენება მთავარი გვერდის ფონის სურათად
            </p>
          </div>
        </div>

        {/* Footer: status + save button */}
        <div className="pt-1 border-t border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${bgUrl.trim() && !previewError ? "bg-emerald-400" : "bg-zinc-700"}`} />
            <span className="text-[0.6rem] text-zinc-600">
              {bgUrl.trim() && !previewError ? "URL მითითებულია" : "URL არ არის მითითებული"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                <IconCheck /> შენახულია
              </span>
            )}
            {saveError && (
              <span className="text-xs text-red-400 truncate max-w-40">{saveError}</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !bgUrl.trim()}
              className="cursor-pointer flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-5 py-2 rounded-xl transition-colors"
            >
              {saving ? (
                <><IconSpinner />შენახვა…</>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 8v3a1 1 0 001 1h8a1 1 0 001-1V8M7 2v7M4.5 5.5L7 2l2.5 3.5"/>
                  </svg>
                  შენახვა
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
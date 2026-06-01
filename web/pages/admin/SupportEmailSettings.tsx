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

const IconMail = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="16" rx="2"/>
    <path d="M2 7l10 7 10-7"/>
  </svg>
);

export default function SupportEmailSettings() {
  const [email, setEmail] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmail = async () => {
      setLoading(true);
      setFetchError(null);
      try {
        const res = await api.get("/api/admin/settings/support-email");
        const fetched = res.data?.email ?? res.data?.support_email ?? "";
        setEmail(fetched);
        setInputValue(fetched);
      } catch (e: any) {
        setFetchError(e.response?.data?.message || "ჩატვირთვა ვერ მოხერხდა");
      } finally {
        setLoading(false);
      }
    };
    fetchEmail();
  }, []);

  const isDirty = inputValue !== email;

  const isValidEmail = (val: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleSave = async () => {
    if (!inputValue.trim() || !isValidEmail(inputValue)) return;
    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);
    try {
      await api.post("/api/admin/settings/support-email", {
        email: inputValue.trim(),
      });
      setEmail(inputValue.trim());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (e: any) {
      setSaveError(e.response?.data?.message || "შენახვა ვერ მოხერხდა");
    } finally {
      setSaving(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") setInputValue(email);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Card header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
          <IconMail />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">მხარდაჭერის ელ-ფოსტა</h3>
          <p className="text-[0.65rem] text-zinc-500 mt-0.5">მომხმარებლებისთვის საკონტაქტო მისამართი</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="flex items-center gap-2 py-4 text-zinc-500 text-xs">
            <IconSpinner />
            <span>Loading…</span>
          </div>
        ) : fetchError ? (
          <div className="flex items-center gap-2 text-red-400 text-xs bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="7" cy="7" r="5.5"/>
              <path d="M7 4.5v3M7 9.5v.5"/>
            </svg>
            {fetchError}
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block">
                ელ-ფოსტის მისამართი
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600 pointer-events-none">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="M2 7l10 7 10-7"/>
                  </svg>
                </div>
                <input
                  type="email"
                  value={inputValue}
                  onChange={e => {
                    setInputValue(e.target.value);
                    setSaveError(null);
                    setSaveSuccess(false);
                  }}
                  onKeyDown={handleKeyDown}
                  placeholder="support@example.com"
                  className={`w-full bg-zinc-800 border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none transition-colors placeholder-zinc-600 ${
                    saveError
                      ? "border-red-500/60 focus:border-red-500"
                      : isDirty
                      ? "border-sky-500/50 focus:border-sky-500"
                      : "border-zinc-700 focus:border-zinc-500"
                  }`}
                />
                {inputValue && !isValidEmail(inputValue) && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400">
                    <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                      <circle cx="7" cy="7" r="5.5"/>
                      <path d="M7 4.5v3M7 9.5v.5"/>
                    </svg>
                  </div>
                )}
              </div>

              {inputValue && !isValidEmail(inputValue) && (
                <p className="text-[0.6rem] text-red-400">
                  სწორი ელ-ფოსტის მისამართი შეიყვანეთ
                </p>
              )}

              {email && (
                <p className="text-[0.6rem] text-zinc-600">
                  მიმდინარე:{" "}
                  <span className="text-zinc-500 font-mono">{email}</span>
                </p>
              )}
            </div>

            {/* Footer row */}
            <div className="pt-1 border-t border-zinc-800 flex items-center justify-between gap-4">
              {/* Status indicator */}
              <div className="flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${email ? "bg-emerald-400" : "bg-zinc-700"}`} />
                <span className="text-[0.6rem] text-zinc-600">
                  {email ? "კონფიგურირებულია" : "არ არის დაყენებული"}
                </span>
              </div>

              {/* Feedback + button */}
              <div className="flex items-center gap-3">
                {saveSuccess && (
                  <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                    <IconCheck /> შენახულია
                  </span>
                )}
                {saveError && (
                  <span className="text-xs text-red-400 truncate max-w-40">{saveError}</span>
                )}

                {isDirty && !saving && (
                  <button
                    onClick={() => setInputValue(email)}
                    className="cursor-pointer text-[0.65rem] text-zinc-500 hover:text-zinc-300 transition-colors"
                  >
                    გაუქმება
                  </button>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving || !isDirty || !inputValue.trim() || !isValidEmail(inputValue)}
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
          </>
        )}
      </div>
    </div>
  );
}
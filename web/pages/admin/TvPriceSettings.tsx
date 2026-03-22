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

export default function TvPriceSettings() {
  const [rawInput, setRawInput] = useState("");
  const [currentPrice, setCurrentPrice] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [inputError, setInputError] = useState<string | null>(null);

  const isValidPrice = (val: string) =>
    /^\d+(\.\d{1,2})?$/.test(val.trim()) && parseFloat(val) > 0;

  const handleInputChange = (val: string) => {
    setRawInput(val);
    setSaveSuccess(false);
    setSaveError(null);

    if (!val.trim()) { setInputError(null); return; }
    if (/\.\d{3,}/.test(val)) { setInputError("მაქსიმუმ 2 ნიშნა მძიმის შემდეგ (მაგ: 5.99)"); return; }
    if (!/^\d*\.?\d*$/.test(val)) { setInputError("მხოლოდ რიცხვები (მაგ: 5.99)"); return; }
    setInputError(null);
  };

  const handleSave = async () => {
    if (!isValidPrice(rawInput)) { setInputError("შეიყვანეთ სწორი ფასი (მაგ: 5.99)"); return; }

    setSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    try {
      const res = await api.post("/api/admin/settings/tv-price", {
        price: parseFloat(parseFloat(rawInput).toFixed(2)),
      });
      const returned = parseFloat(res.data?.price ?? rawInput).toFixed(2);
      setCurrentPrice(returned);
      setRawInput(returned);
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
      <div className="px-6 py-4 border-b border-zinc-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0 text-sky-400">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="4" width="20" height="14" rx="2"/><path d="M8 20h8M12 18v2"/>
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-100">TV-ის ერთეულის ფასი</h3>
          <p className="text-[0.65rem] text-zinc-500 mt-0.5">ფასი ერთი დამატებითი TV მოწყობილობისთვის ანგარიშზე</p>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <label className="text-[0.65rem] text-zinc-500 uppercase tracking-widest block mb-1.5">
            ფასი (GEL)
          </label>
          <div className="relative max-w-48">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-medium select-none">₾</span>
            <input
              type="text"
              inputMode="decimal"
              placeholder="5.99"
              value={rawInput}
              onChange={e => handleInputChange(e.target.value)}
              onBlur={() => {
                if (rawInput && isValidPrice(rawInput))
                  setRawInput(parseFloat(rawInput).toFixed(2));
              }}
              className={`w-full bg-zinc-800 border pl-8 pr-4 py-2.5 rounded-xl text-sm focus:outline-none transition-colors font-mono ${
                inputError ? "border-red-500/60 focus:border-red-500" : "border-zinc-700 focus:border-zinc-500"
              }`}
            />
          </div>
          {inputError && (
            <p className="text-[0.65rem] text-red-400 mt-1.5">{inputError}</p>
          )}
        </div>

        <div className="pt-1 border-t border-zinc-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5">
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentPrice ? "bg-emerald-400" : "bg-zinc-700"}`} />
            <span className="text-[0.6rem] text-zinc-600">
              {currentPrice
                ? <>მიმდინარე: <span className="font-mono text-zinc-400">₾{currentPrice}</span></>
                : "ფასი არ არის დაყენებული"}
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
              disabled={saving || !isValidPrice(rawInput) || !!inputError}
              className="cursor-pointer flex items-center gap-2 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-medium px-5 py-2 rounded-xl transition-colors"
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
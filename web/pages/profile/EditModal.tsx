import { useState, useRef, useEffect } from "react";
import api from "../../src/lib/axios";
import useAuthStore from "../../src/store/AuthStore";

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFullName?: string;
  currentUsername?: string;
  currentAvatarUrl?: string;
  isDark: boolean;
  language: "En" | "Ge";
  onSuccess?: (updatedUser: Record<string, unknown>) => void;
}

const t = {
  En: {
    title: "Edit Profile",
    subtitle: "Update your display name, username, or avatar",
    fullName: "Full Name",
    fullNamePlaceholder: "Your full name",
    username: "Username",
    usernamePlaceholder: "your_username",
    avatarUrl: "Avatar URL",
    avatarUrlPlaceholder: "https://example.com/avatar.jpg",
    save: "Save Changes",
    saving: "Saving…",
    cancel: "Cancel",
    success: "Profile updated!",
    errorGeneric: "Something went wrong. Please try again.",
    charLimit: "/ 50",
    preview: "Preview",
    tabPersonal: "Personal",
    tabBusiness: "Business",
    businessTitle: "Business Registration",
    businessSubtitle: "Register as a company representative",
    companyName: "Company Name",
    companyNamePlaceholder: "Your company name",
    taxId: "Tax ID",
    taxIdPlaceholder: "Company tax identifier",
    purpose: "Purpose",
    purposePlaceholder: "Describe your intended use",
    registerBusiness: "Register as Business",
    registeringBusiness: "Registering…",
    businessSuccess: "Business registration submitted!",
    businessAlreadyRegistered: "You are already registered as a company representative.",
  },
  Ge: {
    title: "პროფილის რედაქტირება",
    subtitle: "განაახლეთ სახელი, მომხმარებელი ან ავატარი",
    fullName: "სრული სახელი",
    fullNamePlaceholder: "თქვენი სახელი",
    username: "მომხმარებელი",
    usernamePlaceholder: "your_username",
    avatarUrl: "ავატარის URL",
    avatarUrlPlaceholder: "https://example.com/avatar.jpg",
    save: "შენახვა",
    saving: "ინახება…",
    cancel: "გაუქმება",
    success: "პროფილი განახლდა!",
    errorGeneric: "შეცდომა. სცადეთ ხელახლა.",
    charLimit: "/ 50",
    preview: "პრევიუ",
    tabPersonal: "პირადი",
    tabBusiness: "იურიდიული",
    businessTitle: "იურიდიული პირის რეგისტრაცია",
    businessSubtitle: "დარეგისტრირდით კომპანიის წარმომადგენლად",
    companyName: "კომპანიის სახელი",
    companyNamePlaceholder: "თქვენი კომპანიის სახელი",
    taxId: "საიდენტიფიკაციო კოდი",
    taxIdPlaceholder: "კომპანიის საგადასახადო კოდი",
    purpose: "მიზანი",
    purposePlaceholder: "აღწერეთ გამოყენების მიზანი",
    registerBusiness: "იურიდიულად რეგისტრაცია",
    registeringBusiness: "რეგისტრაცია…",
    businessSuccess: "იურიდიული პირის რეგისტრაცია წარმატებით გაიგზავნა!",
    businessAlreadyRegistered: "თქვენ უკვე დარეგისტრირებული ხართ კომპანიის წარმომადგენლად.",
  },
} as const;

type ModalTab = "personal" | "business";

export default function EditProfileModal({
  isOpen,
  onClose,
  currentFullName = "",
  currentUsername = "",
  currentAvatarUrl = "",
  isDark,
  language,
  onSuccess,
}: EditProfileModalProps) {
  const tx = t[language];
  const { fetchUser } = useAuthStore();

  const [activeTab, setActiveTab] = useState<ModalTab>("personal");

  // Personal fields
  const [fullName, setFullName] = useState(currentFullName);
  const [username, setUsername] = useState(currentUsername);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);

  // Business fields
  const [companyName, setCompanyName] = useState("");
  const [taxId, setTaxId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [businessSaving, setBusinessSaving] = useState(false);
  const [businessError, setBusinessError] = useState<string | null>(null);
  const [businessSuccess, setBusinessSuccess] = useState(false);

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentFullName);
      setUsername(currentUsername);
      setAvatarUrl(currentAvatarUrl);
      setError(null);
      setSuccess(false);
      setAvatarPreviewError(false);
      setBusinessError(null);
      setBusinessSuccess(false);
      setCompanyName("");
      setTaxId("");
      setPurpose("");
      setActiveTab("personal");
    }
  }, [isOpen, currentFullName, currentUsername, currentAvatarUrl]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, onClose]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    const body: Record<string, string> = {};
    if (fullName.trim() && fullName.trim() !== currentFullName) body.full_name = fullName.trim();
    if (username.trim() && username.trim() !== currentUsername) body.username = username.trim();
    if (avatarUrl.trim() && avatarUrl.trim() !== currentAvatarUrl) body.avatar_url = avatarUrl.trim();
    try {
      const res = await api.put("/api/user/profile", body);
      await fetchUser();
      onSuccess?.(res.data?.user ?? {});
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1200);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        tx.errorGeneric;
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  const handleBusinessRegister = async () => {
    setBusinessError(null);
    setBusinessSaving(true);
    try {
      await api.post("/api/user/business-registration", {
        company_name: companyName.trim(),
        tax_id: taxId.trim(),
        purpose: purpose.trim(),
      });
      setBusinessSuccess(true);
      setTimeout(() => {
        setBusinessSuccess(false);
        onClose();
      }, 1500);
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number; data?: { message?: string } } })?.response?.status;
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      if (status === 422) {
        setBusinessError(tx.businessAlreadyRegistered);
      } else {
        setBusinessError(msg ?? tx.errorGeneric);
      }
    } finally {
      setBusinessSaving(false);
    }
  };

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : username?.slice(0, 2).toUpperCase() ?? "?";

  const showAvatar = avatarUrl && !avatarPreviewError;

  if (!isOpen) return null;

  const c = {
    overlay:      "bg-black/60",
    modal:        "bg-auth-card-bg border border-form-border shadow-[0_25px_60px_rgba(0,0,0,0.5),0_0_0_1px_rgba(192,17,17,0.08)]",
    headerBorder: "border-border",
    title:        "text-foreground",
    subtitle:     "text-muted-foreground",
    closeBtn:     "text-muted-foreground hover:text-foreground transition-colors",
    avatarWrap:   "bg-form-highlight-subtle border border-form-border",
    avatarText:   "text-form-highlights",
    previewName:  "text-foreground",
    previewUser:  "text-muted-foreground",
    label:        "text-muted-foreground",
    counter:      "text-muted-foreground/40",
    input:        "bg-transparent border border-form-border text-foreground placeholder:text-muted-foreground/40 focus:border-form-highlights outline-none transition-colors duration-150",
    errorBox:     "bg-red-500/8 border border-red-500/20 text-red-500",
    successBox:   "bg-emerald-500/8 border border-emerald-500/20 text-emerald-500",
    btnPrimary:   "bg-form-highlights hover:bg-button-hover disabled:opacity-50 disabled:cursor-not-allowed text-white cursor-pointer transition-colors duration-150",
    btnSecondary: "border border-border text-muted-foreground hover:text-foreground hover:border-form-border disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer bg-transparent transition-colors duration-150",
    tabActive:    "bg-form-highlights text-white",
    tabInactive:  "bg-transparent text-muted-foreground hover:bg-form-highlight-subtle",
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${c.overlay}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className={`w-full max-w-md rounded-2xl overflow-hidden ${c.modal}`}>

        {/* Header */}
        <div className={`flex items-start justify-between gap-4 px-7 pt-6 pb-5 border-b ${c.headerBorder}`}>
          <div>
            <h2 className={`text-base font-bold tracking-tight m-0 ${c.title}`}>
              {activeTab === "personal" ? tx.title : tx.businessTitle}
            </h2>
            <p className={`text-xs mt-0.5 ${c.subtitle}`}>
              {activeTab === "personal" ? tx.subtitle : tx.businessSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`bg-transparent border-none text-xl leading-none px-1.5 py-0.5 rounded-md transition-colors duration-150 cursor-pointer ${c.closeBtn}`}
          >
            ✕
          </button>
        </div>

        {/* Tab toggle */}
        <div className="px-7 pt-5">
          <div className="flex rounded-lg overflow-hidden border border-form-border text-sm font-medium">
            <button
              type="button"
              onClick={() => setActiveTab("personal")}
              className={`cursor-pointer flex-1 py-2 transition-all ${activeTab === "personal" ? c.tabActive : c.tabInactive}`}
            >
              {tx.tabPersonal}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("business")}
              className={`cursor-pointer flex-1 py-2 transition-all ${activeTab === "business" ? c.tabActive : c.tabInactive}`}
            >
              {tx.tabBusiness}
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-7 py-6">

          {/* ── PERSONAL TAB ── */}
          {activeTab === "personal" && (
            <>
              {/* Avatar preview row */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl shrink-0 flex items-center justify-center text-base font-bold overflow-hidden ${c.avatarWrap} ${c.avatarText}`}>
                  {showAvatar ? (
                    <img
                      src={avatarUrl}
                      alt="preview"
                      onError={() => setAvatarPreviewError(true)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    initials || "?"
                  )}
                </div>
                <div>
                  <p className={`text-sm font-semibold ${c.previewName}`}>
                    {fullName || currentFullName || "—"}
                  </p>
                  <p className={`text-xs mt-0.5 ${c.previewUser}`}>
                    @{username || currentUsername || "—"}
                  </p>
                </div>
              </div>

              {[
                { key: "fullName", label: tx.fullName, value: fullName, setter: setFullName, placeholder: tx.fullNamePlaceholder },
                { key: "username", label: tx.username, value: username, setter: setUsername, placeholder: tx.usernamePlaceholder },
              ].map(({ key, label, value, setter, placeholder }) => (
                <div key={key} className="mb-4">
                  <div className="flex justify-between items-center mb-1.5">
                    <label className={`text-[0.7rem] font-semibold uppercase tracking-[0.07em] ${c.label}`}>
                      {label}
                    </label>
                    <span className={`text-[0.65rem] ${c.counter}`}>
                      {value.length} {tx.charLimit}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={value}
                    maxLength={50}
                    placeholder={placeholder}
                    onChange={(e) => setter(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-sm transition-colors duration-150 ${c.input}`}
                  />
                </div>
              ))}

              <div className="mb-5">
                <label className={`block text-[0.7rem] font-semibold uppercase tracking-[0.07em] mb-1.5 ${c.label}`}>
                  {tx.avatarUrl}
                </label>
                <input
                  type="url"
                  value={avatarUrl}
                  placeholder={tx.avatarUrlPlaceholder}
                  onChange={(e) => { setAvatarUrl(e.target.value); setAvatarPreviewError(false); }}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm transition-colors duration-150 ${c.input}`}
                />
              </div>

              {error && (
                <div className={`rounded-xl px-3.5 py-2.5 text-xs mb-4 ${c.errorBox}`}>
                  {error}
                </div>
              )}
              {success && (
                <div className={`rounded-xl px-3.5 py-2.5 text-xs mb-4 ${c.successBox}`}>
                  ✓ {tx.success}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || success}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${c.btnPrimary}`}
                >
                  {saving && (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                  )}
                  {saving ? tx.saving : tx.save}
                </button>
                
              </div>
            </>
          )}

          {/* ── BUSINESS TAB ── */}
          {activeTab === "business" && (
            <>
              {[
                { key: "companyName", label: tx.companyName, value: companyName, setter: setCompanyName, placeholder: tx.companyNamePlaceholder, type: "text" },
                { key: "taxId",       label: tx.taxId,       value: taxId,       setter: setTaxId,       placeholder: tx.taxIdPlaceholder,       type: "text" },
              ].map(({ key, label, value, setter, placeholder, type }) => (
                <div key={key} className="mb-4">
                  <label className={`block text-[0.7rem] font-semibold uppercase tracking-[0.07em] mb-1.5 ${c.label}`}>
                    {label}
                  </label>
                  <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    onChange={(e) => setter(e.target.value)}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-sm transition-colors duration-150 ${c.input}`}
                  />
                </div>
              ))}

              <div className="mb-5">
                <label className={`block text-[0.7rem] font-semibold uppercase tracking-[0.07em] mb-1.5 ${c.label}`}>
                  {tx.purpose}
                </label>
                <textarea
                  value={purpose}
                  placeholder={tx.purposePlaceholder}
                  rows={3}
                  onChange={(e) => setPurpose(e.target.value)}
                  className={`w-full rounded-xl px-3.5 py-2.5 text-sm transition-colors duration-150 resize-none ${c.input}`}
                />
              </div>

              {businessError && (
                <div className={`rounded-xl px-3.5 py-2.5 text-xs mb-4 ${c.errorBox}`}>
                  {businessError}
                </div>
              )}
              {businessSuccess && (
                <div className={`rounded-xl px-3.5 py-2.5 text-xs mb-4 ${c.successBox}`}>
                  ✓ {tx.businessSuccess}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  onClick={handleBusinessRegister}
                  disabled={businessSaving || businessSuccess || !companyName.trim() || !taxId.trim() || !purpose.trim()}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-150 ${c.btnPrimary}`}
                >
                  {businessSaving && (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin inline-block" />
                  )}
                  {businessSaving ? tx.registeringBusiness : tx.registerBusiness}
                </button>
          
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
}
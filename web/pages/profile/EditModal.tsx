import { useState, useRef, useEffect } from "react";
import api from "../../src/lib/axios";
import useAuthStore from "@/store/AuthStore";

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
  },
} as const;

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

  const [fullName, setFullName] = useState(currentFullName);
  const [username, setUsername] = useState(currentUsername);
  const [avatarUrl, setAvatarUrl] = useState(currentAvatarUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [avatarPreviewError, setAvatarPreviewError] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Sync props when modal opens
  useEffect(() => {
    if (isOpen) {
      setFullName(currentFullName);
      setUsername(currentUsername);
      setAvatarUrl(currentAvatarUrl);
      setError(null);
      setSuccess(false);
      setAvatarPreviewError(false);
    }
  }, [isOpen, currentFullName, currentUsername, currentAvatarUrl]);

  // Close on Escape
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

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
    : username?.slice(0, 2).toUpperCase() ?? "?";

  const showAvatar = avatarUrl && !avatarPreviewError;

  if (!isOpen) return null;

  /* ── Tailwind theme classes ── */
  const c = {
    overlay:      isDark ? "bg-black/75" : "bg-black/45",
    modal:        isDark
      ? "bg-[#0f0f16] border border-white/[0.07] shadow-[0_25px_60px_rgba(0,0,0,0.7),0_0_0_1px_rgba(124,58,237,0.08)]"
      : "bg-white border border-gray-200 shadow-[0_25px_60px_rgba(0,0,0,0.18)]",
    headerBorder: isDark ? "border-white/[0.07]" : "border-gray-200",
    title:        isDark ? "text-zinc-100" : "text-gray-900",
    subtitle:     isDark ? "text-zinc-500" : "text-gray-400",
    closeBtn:     isDark ? "text-zinc-500 hover:text-zinc-200" : "text-gray-400 hover:text-gray-700",
    avatarWrap:   isDark ? "bg-white/[0.06] border border-white/[0.07]" : "bg-gray-100 border border-gray-200",
    avatarText:   isDark ? "text-violet-400" : "text-violet-700",
    previewName:  isDark ? "text-zinc-100" : "text-gray-900",
    previewUser:  isDark ? "text-zinc-500" : "text-gray-400",
    label:        isDark ? "text-zinc-400" : "text-gray-700",
    counter:      isDark ? "text-zinc-700" : "text-gray-300",
    input:        isDark
      ? "bg-white/[0.04] border border-white/10 text-zinc-100 placeholder:text-zinc-600 focus:border-violet-500 outline-none"
      : "bg-gray-50 border border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-violet-500 outline-none",
    errorBox:     isDark
      ? "bg-red-400/[0.08] border border-red-400/20 text-red-400"
      : "bg-red-50 border border-red-200 text-red-500",
    successBox:   isDark
      ? "bg-emerald-400/[0.08] border border-emerald-400/20 text-emerald-400"
      : "bg-green-50 border border-green-200 text-emerald-600",
    btnPrimary:   "bg-violet-600 hover:bg-violet-500 disabled:bg-violet-800 disabled:opacity-80 disabled:cursor-not-allowed text-white cursor-pointer",
    btnSecondary: isDark
      ? "bg-white/[0.06] border border-white/[0.07] text-zinc-400 hover:text-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
      : "bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer",
  };

  return (
    <div
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${c.overlay}`}
      style={{ fontFamily: "'DM Sans', sans-serif" }}
    >
      <div className={`w-full max-w-[480px] rounded-2xl overflow-hidden ${c.modal}`}>

        {/* Header */}
        <div className={`flex items-start justify-between gap-4 px-7 pt-6 pb-5 border-b ${c.headerBorder}`}>
          <div>
            <h2 className={`text-base font-bold tracking-tight m-0 ${c.title}`}>
              {tx.title}
            </h2>
            <p className={`text-xs mt-0.5 ${c.subtitle}`}>
              {tx.subtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className={`bg-transparent border-none text-xl leading-none px-1.5 py-0.5 rounded-md transition-colors duration-150 cursor-pointer ${c.closeBtn}`}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-7 py-6">

          {/* Avatar preview row */}
          <div className="flex items-center gap-4 mb-6">
            <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-base font-bold overflow-hidden ${c.avatarWrap} ${c.avatarText}`}>
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

          {/* Full Name + Username fields */}
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

          {/* Avatar URL */}
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

          {/* Error */}
          {error && (
            <div className={`rounded-xl px-3.5 py-2.5 text-xs mb-4 ${c.errorBox}`}>
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className={`rounded-xl px-3.5 py-2.5 text-xs mb-4 ${c.successBox}`}>
              ✓ {tx.success}
            </div>
          )}

          {/* Actions */}
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
            <button
              onClick={onClose}
              disabled={saving}
              className={`rounded-xl px-5 py-2.5 text-sm font-medium transition-all duration-150 ${c.btnSecondary}`}
            >
              {tx.cancel}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
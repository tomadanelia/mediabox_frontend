// src/components/notifications/NotificationToast.tsx
// No auto-dismiss — toasts stay until the user closes them.
// Requires: material-symbols-outlined font in index.html

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import type { NotificationPayload, NotificationType } from "../services/NotificationService";

// ─── Per-type config ──────────────────────────────────────────────────────────
const TYPE_CONFIG: Record<
  NotificationType,
  { icon: string; accent: string; bg: string; pill: string }
> = {
  info:    { icon: "info",         accent: "#3b82f6", bg: "#eff6ff", pill: "#dbeafe" },
  success: { icon: "check_circle", accent: "#22c55e", bg: "#f0fdf4", pill: "#dcfce7" },
  warning: { icon: "warning",      accent: "#f59e0b", bg: "#fffbeb", pill: "#fef3c7" },
  error:   { icon: "error",        accent: "#ef4444", bg: "#fef2f2", pill: "#fee2e2" },
  promo:   { icon: "campaign",     accent: "#a855f7", bg: "#faf5ff", pill: "#f3e8ff" },
  system:  { icon: "settings",     accent: "#64748b", bg: "#f8fafc", pill: "#f1f5f9" },
};

// ─── Single Toast ─────────────────────────────────────────────────────────────
interface ToastProps {
  notification: NotificationPayload;
  onDismiss: (id: string) => void;
  index: number;
}

export function NotificationToast({ notification, onDismiss, index }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const navigate = useNavigate();

  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.info;

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLeaving(true);
    setTimeout(() => onDismiss(notification.id), 280);
  };

  const handleClick = () => {
    navigate(notification.action?.url ?? "/notifications");
    setLeaving(true);
    setTimeout(() => onDismiss(notification.id), 280);
  };

  // Staggered entrance
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30 + index * 60);
    return () => clearTimeout(t);
  }, [index]);

  const transform = leaving
    ? "translateX(110%) scale(0.95)"
    : visible
    ? "translateX(0) scale(1)"
    : "translateX(30px) scale(0.97)";

  const opacity = leaving ? 0 : visible ? 1 : 0;

  return (
    <div
      onClick={handleClick}
      style={{
        width: 360,
        maxWidth: "calc(100vw - 2rem)",
        background: "#ffffff",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)",
        display: "flex",
        alignItems: "stretch",
        overflow: "hidden",
        cursor: "pointer",
        opacity,
        transform,
        transition: "opacity 280ms cubic-bezier(.4,0,.2,1), transform 280ms cubic-bezier(.4,0,.2,1), box-shadow 150ms ease",
        fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
        position: "relative",
      }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.13), 0 2px 8px rgba(0,0,0,0.07)")}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = "0 4px 24px rgba(0,0,0,0.09), 0 1px 4px rgba(0,0,0,0.05)")}
    >
      {/* Left accent bar */}
      <div style={{ width: 4, background: cfg.accent, flexShrink: 0, borderRadius: "16px 0 0 16px" }} />

      {/* Icon */}
      <div
        style={{
          width: 52,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          background: cfg.bg,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 10,
            background: cfg.pill,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: cfg.accent,
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{cfg.icon}</span>
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0, padding: "12px 8px 12px 10px" }}>
        <p
          style={{
            margin: 0,
            fontSize: 13.5,
            fontWeight: 600,
            color: "#111827",
            lineHeight: 1.35,
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {notification.title}
        </p>
        <p
          style={{
            margin: "3px 0 0",
            fontSize: 12.5,
            color: "#6b7280",
            lineHeight: 1.4,
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {notification.message}
        </p>
        <p style={{ margin: "5px 0 0", fontSize: 11, color: cfg.accent, display: "flex", alignItems: "center", gap: 2 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 11 }}>open_in_new</span>
          View
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        style={{
          flexShrink: 0,
          alignSelf: "flex-start",
          margin: "8px 8px 0 0",
          width: 26,
          height: 26,
          borderRadius: 8,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#9ca3af",
          transition: "background 150ms, color 150ms",
        }}
        onMouseEnter={e => { e.currentTarget.style.background = "#f3f4f6"; e.currentTarget.style.color = "#374151"; }}
        onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#9ca3af"; }}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 15 }}>close</span>
      </button>
    </div>
  );
}

// ─── Container ────────────────────────────────────────────────────────────────
interface ToastContainerProps {
  toasts: NotificationPayload[];
  onDismiss: (id: string) => void;
}

export function NotificationToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: "fixed",
        top: 80,
        right: 16,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "flex-end",
        pointerEvents: "none",
      }}
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t, i) => (
        <div key={t.id} style={{ pointerEvents: "auto" }}>
          <NotificationToast notification={t} onDismiss={onDismiss} index={i} />
        </div>
      ))}
    </div>
  );
}
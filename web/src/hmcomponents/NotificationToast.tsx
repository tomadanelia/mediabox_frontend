// src/components/notifications/NotificationToast.tsx
// Soft card style — matching reference design
// Add to index.html:
// <link href="https://fonts.googleapis.com/icon?family=Material+Icons+Round" rel="stylesheet">
// <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">

import { useEffect, useRef, useState } from "react";
import type { NotificationPayload, NotificationType } from "../services/NotificationService";

// ─── Per-type config ──────────────────────────────────────────────────────────
const typeConfig: Record<
  NotificationType,
  {
    icon: string;
    sideGradient: string;
    iconBg: string;
    iconColor: string;
    progressColor: string;
  }
> = {
  info: {
    icon: "info",
    sideGradient: "linear-gradient(135deg, #dbeeff 0%, #fff 100%)",
    iconBg: "#e8f3ff",
    iconColor: "#1a73e8",
    progressColor: "#1a73e8",
  },
  success: {
    icon: "check_circle",
    sideGradient: "linear-gradient(135deg, #d4f5e2 0%, #fff 100%)",
    iconBg: "#e4f9ee",
    iconColor: "#1e8e3e",
    progressColor: "#1e8e3e",
  },
  warning: {
    icon: "warning",
    sideGradient: "linear-gradient(135deg, #fef3cc 0%, #fff 100%)",
    iconBg: "#fef7df",
    iconColor: "#e8a000",
    progressColor: "#e8a000",
  },
  error: {
    icon: "error",
    sideGradient: "linear-gradient(135deg, #fde0de 0%, #fff 100%)",
    iconBg: "#fde8e6",
    iconColor: "#d93025",
    progressColor: "#d93025",
  },
  promo: {
    icon: "star",
    sideGradient: "linear-gradient(135deg, #eedeff 0%, #fff 100%)",
    iconBg: "#f0e4ff",
    iconColor: "#9334e6",
    progressColor: "#9334e6",
  },
  system: {
    icon: "settings",
    sideGradient: "linear-gradient(135deg, #e8eaed 0%, #fff 100%)",
    iconBg: "#f1f3f4",
    iconColor: "#5f6368",
    progressColor: "#5f6368",
  },
};

const TTL = 6000;

// ─── Single Toast ─────────────────────────────────────────────────────────────
interface ToastProps {
  notification: NotificationPayload;
  onDismiss: (id: string) => void;
  index: number;
}

export function NotificationToast({ notification, onDismiss, index }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [progress, setProgress] = useState(100);
  const ivRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cfg = typeConfig[notification.type] ?? typeConfig.info;

  const dismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(notification.id), 240);
  };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20 + index * 50);
    return () => clearTimeout(t);
  }, [index]);

  useEffect(() => {
    const tick = 50;
    const step = (tick / TTL) * 100;
    ivRef.current = setInterval(() => {
      setProgress((p) => {
        if (p <= 0) { clearInterval(ivRef.current!); return 0; }
        return p - step;
      });
    }, tick);
    return () => clearInterval(ivRef.current!);
  }, []);

  const state =
    visible && !leaving
      ? "opacity-100 translate-y-0"
      : leaving
      ? "opacity-0 -translate-y-1 scale-[0.98]"
      : "opacity-0 translate-y-2";

  return (
    <div
      className={`
        transition-all duration-[220ms] ease-out ${state}
        w-[360px] max-w-[calc(100vw-2rem)]
        flex items-center
        bg-white rounded-2xl overflow-hidden
        border border-black/[0.06]
        shadow-[0_2px_12px_rgba(0,0,0,0.08)]
        pointer-events-auto relative
      `}
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      {/* Colored gradient side panel with icon */}
      <div
        className="w-[72px] self-stretch flex-shrink-0 flex items-center justify-center"
        style={{ background: cfg.sideGradient }}
      >
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center"
          style={{ background: cfg.iconBg, color: cfg.iconColor }}
        >
          <span className="material-icons-round" style={{ fontSize: 22 }}>
            {cfg.icon}
          </span>
        </div>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0 py-3.5 pr-1">
        <p
          className="text-[15px] font-semibold leading-snug"
          style={{ color: "#1a1a2e" }}
        >
          {notification.title}
        </p>
        <p className="mt-0.5 text-[13px] text-gray-500 leading-snug truncate">
          {notification.message}
        </p>

        {notification.action && (
          <a
            href={notification.action.url}
            className="mt-1.5 inline-flex items-center gap-0.5 text-[12px] font-semibold no-underline"
            style={{ color: cfg.iconColor }}
          >
            <span className="material-icons-round" style={{ fontSize: 12 }}>
              arrow_forward
            </span>
            {notification.action.label}
          </a>
        )}
      </div>

      {/* Close button */}
      <button
        onClick={dismiss}
        className="flex-shrink-0 px-3.5 self-start mt-3 text-gray-400 hover:text-gray-600 transition-colors bg-transparent border-none cursor-pointer p-0 leading-none"
        aria-label="Dismiss"
      >
        <span className="material-icons-round" style={{ fontSize: 18 }}>close</span>
      </button>

      {/* Progress bar at bottom */}
      <div
        className="absolute bottom-0 left-[72px] right-0 h-[2px]"
        style={{ background: "rgba(0,0,0,0.04)" }}
      >
        <div
          className="h-full rounded-sm transition-[width] ease-linear"
          style={{
            width: `${progress}%`,
            background: cfg.progressColor,
            transitionDuration: "50ms",
          }}
        />
      </div>
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
      className="fixed top-20 right-4 z-[9999] flex flex-col gap-3 items-end pointer-events-none"
      aria-live="polite"
      aria-label="Notifications"
    >
      {toasts.map((t, i) => (
        <NotificationToast key={t.id} notification={t} onDismiss={onDismiss} index={i} />
      ))}
    </div>
  );
}
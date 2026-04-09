// src/hooks/useNotifications.ts
import { useEffect, useState, useCallback } from "react";
import notificationService, {
  type NotificationPayload,
} from "../services/NotificationService";

const MAX_TOASTS = 5;
const TOAST_TTL = 6000; // ms before auto-dismiss

export function useNotifications() {
  const [toasts, setToasts] = useState<NotificationPayload[]>([]);
  const [history, setHistory] = useState<NotificationPayload[]>([]);

  // Add incoming notification
  const handleIncoming = useCallback((n: NotificationPayload) => {
    setHistory((prev) => [n, ...prev].slice(0, 100));
    setToasts((prev) => {
      const next = [n, ...prev].slice(0, MAX_TOASTS);
      return next;
    });

    // Auto-dismiss after TTL
    setTimeout(() => {
      dismissToast(n.id);
    }, TOAST_TTL);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearAll = useCallback(() => setToasts([]), []);

  useEffect(() => {
    const unsub = notificationService.subscribe(handleIncoming);
    return () => { unsub(); };
  }, [handleIncoming]);

  return { toasts, history, dismissToast, clearAll };
}
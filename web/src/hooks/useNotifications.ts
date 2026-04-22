import { useEffect, useState, useCallback } from "react";
import notificationService, {
  type NotificationPayload,
} from "../services/NotificationService";

const MAX_TOASTS = 5;

export function useNotifications() {
  const [toasts, setToasts] = useState<NotificationPayload[]>([]);
  const [history, setHistory] = useState<NotificationPayload[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleIncoming = useCallback((n: NotificationPayload) => {
    setHistory((prev) => [n, ...prev].slice(0, 100));
    setToasts((prev) => [n, ...prev].slice(0, MAX_TOASTS));
  }, []);

  const clearAll = useCallback(() => setToasts([]), []);

  useEffect(() => {
    const unsub = notificationService.subscribe(handleIncoming);
    return () => { unsub(); };
  }, [handleIncoming]);

  return { toasts, history, dismissToast, clearAll };
}
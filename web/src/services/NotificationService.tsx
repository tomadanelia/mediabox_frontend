import { io, Socket } from "socket.io-client";
import api from "../lib/axios";
import {API_BASE_URL} from "../config";
import { evictAll } from "./streamService";
export type NotificationType =
  | "info"
  | "success"
  | "warning"
  | "error"
  | "promo"
  | "system";

export interface NotificationPayload {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: number;
  read?: boolean;
  action?: {
    label: string;
    url: string;
  };
}

type NotificationHandler = (notification: NotificationPayload) => void;

const SERVER_URL = API_BASE_URL

// ── Normalise whatever the server sends into NotificationPayload ─────────────
function normalise(raw: unknown, fallbackType: NotificationType): NotificationPayload {
  const r = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;

  return {
    id:        (r.id        as string)  ?? crypto.randomUUID(),
    type:      (r.type      as NotificationType) ?? fallbackType,
    title:     (r.title     as string)  ?? (fallbackType === "promo" ? "Announcement" : "Notification"),
    message:   (r.message   as string)  ?? (r.body as string) ?? (r.text as string) ?? "",
    timestamp: (r.timestamp as number)  ?? Date.now(),
    read:      (r.read      as boolean) ?? false,
    action:    (r.action    as NotificationPayload["action"]) ?? undefined,
  };
}

class NotificationService {
  private socket: Socket | null = null;
  private handlers: Set<NotificationHandler> = new Set();
  private isDestroyed = false;
  private isConnecting = false;

  // ── Subscribe / unsubscribe ───────────────────────────────────────────────
  subscribe(handler: NotificationHandler): () => void {
    this.handlers.add(handler);
    return () => { this.handlers.delete(handler); };
  }

  private emit(payload: NotificationPayload) {
    this.handlers.forEach((h) => h(payload));
  }

  // ── Connect ───────────────────────────────────────────────────────────────
  async connect() {
  if (this.socket?.connected || this.isConnecting) return;
    this.isDestroyed = false;
    this.isConnecting = true;

    let token: string | null = null;

    try {
      const res = await api.get("/api/profile/socket-token");
      token = res.data?.socket_token ?? null;
      if (!token) throw new Error("No socket_token in response");
    } catch (err) {
      console.warn("[NotificationService] Token fetch failed:", err);
      this.isConnecting = false;
      return;
    }

    this.socket = io(SERVER_URL, {
      transports: ["websocket", "polling"],
      auth: { token },
      query: { token },
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 30000,
      reconnectionAttempts: Infinity,
    });

    this.socket.on("connect", () => {
      this.isConnecting = false; 
      console.info("[NotificationService] Socket.IO connected ✓", this.socket?.id);
    });

    this.socket.on("disconnect", (reason) => {
      console.info("[NotificationService] Disconnected:", reason);
    });

    this.socket.on("connect_error", (err) => {
      this.isConnecting = false;
      console.warn("[NotificationService] Connection error:", err.message);
    });

    // ── Event: admin_annoucment ───────────────────────────────────────────
    this.socket.on("admin_announcement", (data: unknown) => {
      const payload = normalise(data, "promo");
      // Always treat admin announcements as promo/info so they stand out
      if (!((data as Record<string, unknown>)?.type)) payload.type = "promo";
      this.emit(payload);
    });

    // ── Event: notification_received ──────────────────────────────────────
    this.socket.on("notification_received", (data: unknown) => {
      const payload = normalise(data, "info");
      this.emit(payload);
    });
      this.socket.on("force_logout", (_data: unknown) => {
    evictAll();
    this.disconnect();
    window.location.reload();
  });
  }

  // ── Disconnect ────────────────────────────────────────────────────────────
  disconnect() {
    this.isDestroyed = true;
    this.socket?.disconnect();
    this.socket = null;
  }
}

export const notificationService = new NotificationService();
export default notificationService;
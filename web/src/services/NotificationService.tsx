// src/services/NotificationService.ts
// Connects to WebSocket using a token fetched from /api/profile/socket-token
// Base URL: https://tv-api.telecomm1.com/

import api from "../lib/axios";
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

const WS_BASE = "wss://tv-api.telecomm1.com";

class NotificationService {
  private socket: WebSocket | null = null;
  private token: string | null = null;
  private handlers: Set<NotificationHandler> = new Set();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 3000;
  private maxReconnectDelay = 30000;
  private isDestroyed = false;
  private isConnecting = false;

  // ── Subscribe to incoming notifications ──────────────────────────────────
  subscribe(handler: NotificationHandler) {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  // ── Boot: fetch token then open socket ───────────────────────────────────
  async connect() {
    if (this.isConnecting || this.socket?.readyState === WebSocket.OPEN) return;
    this.isConnecting = true;
    this.isDestroyed = false;

    try {
      const res = await api.get("/api/profile/socket-token");
      this.token = res.data?.socket_token ?? null;
      if (!this.token) throw new Error("No socket_token in response");
      this.openSocket();
    } catch (err) {
      console.warn("[NotificationService] Token fetch failed:", err);
      this.scheduleReconnect();
    } finally {
      this.isConnecting = false;
    }
  }

  // ── Open WebSocket ────────────────────────────────────────────────────────
  private openSocket() {
    if (this.isDestroyed) return;

    const url = `${WS_BASE}/ws/notifications?token=${this.token}`;
    this.socket = new WebSocket(url);

    this.socket.onopen = () => {
      console.info("[NotificationService] Connected ✓");
      this.reconnectDelay = 3000; // reset backoff
    };

    this.socket.onmessage = (event) => {
      try {
        const raw = JSON.parse(event.data);
        // Server sends { payload: { ... } }  OR  the payload directly
        const data: NotificationPayload = raw.payload ?? raw;
        if (!data.id) data.id = crypto.randomUUID();
        if (!data.timestamp) data.timestamp = Date.now();
        this.handlers.forEach((h) => h(data));
      } catch {
        console.warn("[NotificationService] Unreadable message:", event.data);
      }
    };

    this.socket.onerror = (e) => {
      console.warn("[NotificationService] Socket error:", e);
    };

    this.socket.onclose = (e) => {
      if (!this.isDestroyed) {
        console.info(`[NotificationService] Closed (${e.code}). Reconnecting…`);
        this.scheduleReconnect();
      }
    };
  }

  // ── Exponential back-off reconnect ───────────────────────────────────────
  private scheduleReconnect() {
    if (this.isDestroyed) return;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, this.reconnectDelay);
    this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, this.maxReconnectDelay);
  }

  // ── Teardown ──────────────────────────────────────────────────────────────
  disconnect() {
    this.isDestroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.socket?.close();
    this.socket = null;
    this.token = null;
  }
}

// Singleton
export const notificationService = new NotificationService();
export default notificationService;
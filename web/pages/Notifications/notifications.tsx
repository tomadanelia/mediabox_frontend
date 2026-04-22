import { useState, useEffect, useCallback } from "react";
import api from "../../src/lib/axios";
import useUIStore from "@/store/ui-store";

type NotificationType = "info" | "warning" | "success" | "error" | "system";

interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
}

interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

const TYPE_ICON: Record<string, string> = {
  info: "info",
  warning: "warning",
  success: "check_circle",
  error: "error",
  system: "settings",
  global_announcement: "campaign",
  "account.notification": "person",
};

const TYPE_COLOR: Record<string, string> = {
  info: "text-blue-500 bg-blue-50",
  warning: "text-amber-500 bg-amber-50",
  success: "text-emerald-500 bg-emerald-50",
  error: "text-red-500 bg-red-50",
  system: "text-slate-500 bg-slate-100",
  global_announcement: "text-violet-500 bg-violet-50",
  "account.notification": "text-sky-500 bg-sky-50",
};

const FILTER_TYPES: { label: string; value: string; icon: string }[] = [
  { label: "გლობალური", value: "global_announcement", icon: "campaign" },
  { label: "პირადი", value: "account.notification", icon: "person" },
];

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff} წამის წინ`;
  if (diff < 3600) return `${Math.floor(diff / 60)} წუთის წინ`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} საათის წინ`;
  return `${Math.floor(diff / 86400)} დღის წინ`;
}

function SkeletonRow() {
  return (
    <div className="flex items-start gap-4 px-5 py-4 animate-pulse">
      <div className="w-9 h-9 rounded-full bg-slate-100 shrink-0 mt-0.5" />
      <div className="flex-1 space-y-2">
        <div className="h-3.5 bg-slate-100 rounded w-1/3" />
        <div className="h-3 bg-slate-100 rounded w-2/3" />
      </div>
      <div className="h-3 bg-slate-100 rounded w-12 shrink-0" />
    </div>
  );
}

function NotificationRow({
  notif,
  onRead,
  markingId,
}: {
  notif: Notification;
  onRead: (id: number) => void;
  markingId: number | null;
}) {
  const colorClass = TYPE_COLOR[notif.type] ?? TYPE_COLOR.info;
  const icon = TYPE_ICON[notif.type] ?? "notifications";
  const isMarking = markingId === notif.id;

  return (
    <div
      className={`
        group flex items-start gap-4 px-5 py-4 transition-colors duration-150
        ${notif.read ? "opacity-60" : "bg-white dark:bg-white/[0.02]"}
        hover:bg-slate-50 dark:hover:bg-white/5
        border-b border-slate-100 dark:border-white/5 last:border-0
      `}
    >
      <div className="relative shrink-0 mt-0.5">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center ${colorClass}`}>
          <span className="material-icons text-[18px]">{icon}</span>
        </div>
        {!notif.read && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-slate-800 dark:text-slate-100 leading-snug truncate">
          {notif.title}
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5 leading-snug line-clamp-2">
          {notif.message}
        </p>
      </div>

      <div className="flex flex-col items-end gap-2 shrink-0">
        <span className="text-xs text-slate-400 dark:text-slate-500 whitespace-nowrap">
          {timeAgo(notif.created_at)}
        </span>
        {!notif.read && (
          <button
            onClick={() => onRead(notif.id)}
            disabled={isMarking}
            title="წაკითხულად მონიშვნა"
            className={`
              cursor-pointer
              opacity-0 group-hover:opacity-100 transition-opacity
              text-xs text-blue-500 hover:text-blue-700 font-medium
              flex items-center gap-0.5 disabled:opacity-40 disabled:cursor-not-allowed
            `}
          >
            {isMarking ? (
              <span className="material-icons text-[14px] animate-spin">refresh</span>
            ) : (
              <span className="material-icons text-[14px]">done</span>
            )}
            წაკითხულად მონიშვნა
          </button>
        )}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [page, setPage] = useState(1);
  const [typeFilter, setTypeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingId, setMarkingId] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const decrementUnread = useUIStore((s) => s.decrementUnread);

  const perPage = 20;

  // ── Fetch — no type param sent ──
  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page, per_page: perPage };

      const { data } = await api.get("/api/notifications", { params });
      setNotifications(data.data ?? data);
      if (data.meta) setMeta(data.meta);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // ── Mark as read ──
  const handleRead = async (id: number) => {
    setMarkingId(id);
    try {
      await api.post(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      showToast("მოინიშნა წაკითხულად");
      decrementUnread(1);
    } catch (e: unknown) {
      const status = (e as { response?: { status?: number } })?.response?.status;
      const msg =
        status === 403 ? "Not authorized" :
        status === 404 ? "Notification not found" :
        "Failed to mark as read";
      showToast(msg, true);
    } finally {
      setMarkingId(null);
    }
  };

  // ── Mark all read ──
  const handleReadAll = async () => {
    const unread = notifications.filter((n) => !n.read);
    for (const n of unread) {
      await handleRead(n.id);
    }
    decrementUnread(unread.length);
  };

  const showToast = (msg: string, _isError = false) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  // ── Client-side filter ──
  const filteredNotifications = typeFilter
    ? notifications.filter((n) => n.type === typeFilter)
    : notifications;

  const unreadCount = notifications.filter((n) => !n.read).length;
  const totalPages = meta?.last_page ?? 1;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans">
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />

      <div className="max-w-2xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
              შეტყობინებები
            </h1>
            {unreadCount > 0 && (
              <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                {unreadCount} unread
              </p>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleReadAll}
              className="text-sm cursor-pointer text-blue-500 hover:text-blue-700 font-medium flex items-center gap-1 transition-colors"
            >
              <span className="material-icons text-[16px]">done_all</span>
              ყველას წაკითხულად მონიშვნა
            </button>
          )}
        </div>

        {/* ── Filter pills ── */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setTypeFilter("")}
            className={`
              cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
              ${typeFilter === ""
                ? "bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white"
                : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-white/10 dark:text-slate-300 dark:border-white/10"}
            `}
          >
            ყველა
          </button>

          {FILTER_TYPES.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`
                cursor-pointer flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors border
                ${typeFilter === f.value
                  ? "bg-slate-800 text-white border-slate-800 dark:bg-white dark:text-slate-900 dark:border-white"
                  : "bg-white text-slate-500 border-slate-200 hover:border-slate-300 dark:bg-white/10 dark:text-slate-300 dark:border-white/10"}
              `}
            >
              <span className="material-icons text-[14px]">{f.icon}</span>
              {f.label}
            </button>
          ))}
        </div>

        {/* ── Card ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-white/10 overflow-hidden shadow-sm">
          {loading && (
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}
            </div>
          )}

          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <span className="material-icons text-red-400 text-[40px]">error_outline</span>
              <p className="text-sm text-slate-500 dark:text-slate-400">{error}</p>
              <button onClick={fetchNotifications} className="cursor-pointer mt-1 text-sm text-blue-500 hover:underline font-medium">
                კიდევ სცადე
              </button>
            </div>
          )}

          {!loading && !error && filteredNotifications.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <span className="material-icons text-slate-300 dark:text-slate-600 text-[48px]">notifications_none</span>
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">No notifications</p>
              <p className="text-xs text-slate-400 dark:text-slate-500">You're all caught up!</p>
            </div>
          )}

          {!loading && !error && filteredNotifications.length > 0 && (
            <div>
              {filteredNotifications.map((n) => (
                <NotificationRow key={n.id} notif={n} onRead={handleRead} markingId={markingId} />
              ))}
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between mt-5 px-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <span className="material-icons text-[18px]">chevron_left</span>
              წინა
            </button>

            <span className="text-xs text-slate-400 dark:text-slate-500">
              გვერდი {page}  {totalPages}-დან
            </span>

            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              შემდეგი
              <span className="material-icons text-[18px]">chevron_right</span>
            </button>
          </div>
        )}
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-sm font-medium px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 z-50 animate-fade-in">
          <span className="material-icons text-[16px]">check</span>
          {toast}
        </div>
      )}
    </div>
  );
}
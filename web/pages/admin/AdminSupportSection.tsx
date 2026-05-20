import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../src/lib/axios";
import useUIStore from "../../src/store/ui-store"; // Adjust this path to your store file layout

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketType = "bug_report" | "channel_issue" | "billing" | "feedback";
type TicketStatus = "pending" | "investigating" | "resolved" | "closed";

interface TicketUser {
  id: string;
  username: string | null;
  email: string | null;
  phone: string;
  numeric_id: number;
}

interface TicketMeta {
  ip?: string;
  user_agent?: string;
  os?: string;
  app_version?: string;
  model?: string;
  android_version?: string;
  free_ram_mb?: number;
  [key: string]: string | number | undefined;
}

interface Ticket {
  id: string;
  type: TicketType;
  subject: string;
  message: string;
  status: TicketStatus;
  metadata: TicketMeta;
  created_at: string;
  updated_at: string;
  user: TicketUser;
}

interface TicketsResponse {
  current_page: number;
  data: Ticket[];
  total: number;
  last_page?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_STATUSES: TicketStatus[] = ["pending", "investigating", "resolved", "closed"];
const ALL_TYPES: TicketType[] = ["bug_report", "channel_issue", "billing", "feedback"];

// ─── Localization Dictionary ──────────────────────────────────────────────────

const TRANSLATIONS = {
  En: {
    all: "All",
    supportTickets: "Support Tickets",
    ticketsTotal: (total: number) => `${total} ticket${total !== 1 ? "s" : ""} total`,
    loading: "Loading…",
    refresh: "Refresh",
    retry: "Retry",
    noTickets: "No tickets found",
    clearFilters: "Clear filters",
    tryClearingFilters: "Try clearing the filters.",
    noTicketsSubmitted: "No support tickets have been submitted yet.",
    prev: "← Prev",
    next: "Next →",
    userHeader: "User",
    deviceHeader: "Device / Session",
    username: "Username",
    email: "Email",
    phone: "Phone",
    id: "ID",
    collapse: "Collapse",
    expand: "Expand",
    changeStatus: "Change status",
    statuses: {
      pending: "Pending",
      investigating: "Investigating",
      resolved: "Resolved",
      closed: "Closed",
    },
    types: {
      bug_report: "Bug Report",
      channel_issue: "Channel Issue",
      billing: "Billing",
      feedback: "Feedback",
    }
  },
  Ge: {
    all: "ყველა",
    supportTickets: "მხარდაჭერის ბილეთები",
    ticketsTotal: (total: number) => `სულ ${total} ბილეთი`,
    loading: "იტვირთება…",
    refresh: "განახლება",
    retry: "ხელახლა ცდა",
    noTickets: "ბილეთები ვერ მოიძებნა",
    clearFilters: "ფილტრების გასუფთავება",
    tryClearingFilters: "სცადეთ ფილტრების გასუფთავება.",
    noTicketsSubmitted: "მხარდაჭერის ბილეთები ჯერ არ არის გამოგზავნილი.",
    prev: "← წინა",
    next: "შემდეგი →",
    userHeader: "მომხმარებელი",
    deviceHeader: "მოწყობილობა / სესია",
    username: "მომხმარებლის სახელი",
    email: "ელ. ფოსტა",
    phone: "ტელეფონი",
    id: "ID",
    collapse: "აკეცვა",
    expand: "გაშლა",
    changeStatus: "სტატუსის შეცვლა",
    statuses: {
      pending: "მოლოდინში",
      investigating: "კვლევის პროცესში",
      resolved: "მოგვარებული",
      closed: "დახურული",
    },
    types: {
      bug_report: "ხარვეზის რეპორტი",
      channel_issue: "არხის პრობლემა",
      billing: "ანგარიშსწორება",
      feedback: "უკუკავშირი",
    }
  }
};

const STATUS_CONFIG: Record<TicketStatus, { dot: string; badge: string; menu: string }> = {
  pending:       { dot: "bg-amber-400",           badge: "text-amber-500 border-amber-500/30 bg-amber-500/10",     menu: "hover:bg-amber-500/10 hover:text-amber-500" },
  investigating: { dot: "bg-blue-400",            badge: "text-blue-500 border-blue-500/30 bg-blue-500/10",         menu: "hover:bg-blue-500/10 hover:text-blue-500" },
  resolved:      { dot: "bg-green-400",           badge: "text-green-500 border-green-500/30 bg-green-500/10",     menu: "hover:bg-green-500/10 hover:text-green-500" },
  closed:        { dot: "bg-muted-foreground/40", badge: "text-muted-foreground border-border bg-muted/40",       menu: "hover:bg-muted/60 hover:text-foreground" },
};

const TYPE_CONFIG: Record<TicketType, { icon: string }> = {
  bug_report:    { icon: "🐛" },
  channel_issue: { icon: "📡" },
  billing:       { icon: "💳" },
  feedback:      { icon: "💬" },
};

function formatDate(iso: string, lang: "En" | "Ge") {
  return new Date(iso).toLocaleDateString(lang === "Ge" ? "ka-GE" : "en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function initials(name: string | null) {
  if (!name) return "??";
  return name.slice(0, 2).toUpperCase();
}

// ─── Status Pill ─────────────────────────────────────────────────────────────

function StatusPill({ status, lang }: { status: TicketStatus; lang: "En" | "Ge" }) {
  const sc = STATUS_CONFIG[status];
  const label = TRANSLATIONS[lang].statuses[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-full px-2.5 py-1 ${sc.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
      {label}
    </span>
  );
}

// ─── Status Dropdown ─────────────────────────────────────────────────────────

function StatusDropdown({
  ticketId,
  current,
  onUpdated,
  lang,
}: {
  ticketId: string;
  current: TicketStatus;
  onUpdated: (id: string, next: TicketStatus) => void;
  lang: "En" | "Ge";
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const pick = async (next: TicketStatus) => {
    setOpen(false);
    if (next === current) return;
    setLoading(true);
    try {
      // Backend payload stays untouched as backend system strings
      await api.patch(`/api/admin/support/tickets/${ticketId}/status`, { status: next });
      onUpdated(ticketId, next);
    } catch {
      // toast fallback wire-up point
    } finally {
      setLoading(false);
    }
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={loading}
        className="flex items-center gap-2 cursor-pointer disabled:opacity-50"
        title={t.changeStatus}
      >
        <StatusPill status={current} lang={lang} />
        {loading ? (
          <span className="w-3 h-3 border-2 border-muted-foreground/30 border-t-[var(--form-highlight)] rounded-full animate-spin" />
        ) : (
          <span className={`text-muted-foreground/40 text-xs transition-transform duration-150 ${open ? "rotate-180" : ""}`}>▾</span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-card border border-border rounded-xl shadow-lg overflow-hidden w-44 py-1">
          {ALL_STATUSES.map((s) => {
            const sc = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(s);
                }}
                className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-left cursor-pointer transition-colors ${
                  s === current
                    ? "bg-muted/40 font-semibold text-foreground"
                    : `text-muted-foreground ${sc.menu}`
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${sc.dot}`} />
                {t.statuses[s]}
                {s === current && <span className="ml-auto text-xs opacity-50">✓</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

function FilterBar({
  statusFilter,
  typeFilter,
  onStatusChange,
  onTypeChange,
  total,
  lang,
}: {
  statusFilter: string;
  typeFilter: string;
  onStatusChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  total: number;
  lang: "En" | "Ge";
}) {
  const t = TRANSLATIONS[lang];

  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onStatusChange("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            statusFilter === ""
              ? "bg-[var(--form-highlight-subtle)] border-[var(--form-border)] text-[var(--form-highlight)]"
              : "bg-background border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          {t.all}
          {statusFilter === "" && (
            <span className="ml-1.5 bg-[var(--form-highlight)] text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{total}</span>
          )}
        </button>
        {ALL_STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => onStatusChange(s === statusFilter ? "" : s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              statusFilter === s
                ? "bg-[var(--form-highlight-subtle)] border-[var(--form-border)] text-[var(--form-highlight)]"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.statuses[s]}
          </button>
        ))}
      </div>

      <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

      <div className="flex flex-wrap gap-1.5">
        {ALL_TYPES.map((tp) => (
          <button
            key={tp}
            onClick={() => onTypeChange(tp === typeFilter ? "" : tp)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              typeFilter === tp
                ? "bg-[var(--form-highlight-subtle)] border-[var(--form-border)] text-[var(--form-highlight)]"
                : "bg-background border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>{TYPE_CONFIG[tp].icon}</span>
            {t.types[tp]}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Ticket Row ───────────────────────────────────────────────────────────────

function TicketRow({
  ticket,
  onStatusUpdated,
  lang,
}: {
  ticket: Ticket;
  onStatusUpdated: (id: string, next: TicketStatus) => void;
  lang: "En" | "Ge";
}) {
  const [expanded, setExpanded] = useState(false);
  const tc = TYPE_CONFIG[ticket.type];
  const t = TRANSLATIONS[lang];
  const metaEntries = Object.entries(ticket.metadata).filter(([, v]) => v != null && v !== "");

  return (
    <div className="border border-border rounded-xl overflow-hidden transition-colors hover:border-[var(--form-border)] bg-card mb-2">
      <div className="flex items-start gap-3 px-4 py-3.5">
        <span className="text-xl shrink-0 mt-0.5">{tc.icon}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                <span className="text-[11px] text-muted-foreground/60 font-mono">{t.types[ticket.type]}</span>
                <span className="text-[11px] text-muted-foreground/40 font-mono">{formatDate(ticket.created_at, lang)}</span>
              </div>
            </div>

            <div className="shrink-0">
              <StatusDropdown
                ticketId={ticket.id}
                current={ticket.status}
                onUpdated={onStatusUpdated}
                lang={lang}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 mt-2">
            <div className="w-5 h-5 rounded-full bg-[var(--form-highlight-subtle)] border border-[var(--form-border)] flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-[var(--form-highlight)]">{initials(ticket.user.username)}</span>
            </div>
            <span className="text-xs text-muted-foreground font-semibold">{ticket.user.username}</span>
            <span className="text-xs text-muted-foreground/40">·</span>
            <span className="text-xs text-muted-foreground/60">{ticket.user.email}</span>
            <span className="text-xs text-muted-foreground/40 hidden sm:inline">·</span>
            <span className="text-xs text-muted-foreground/40 font-mono hidden sm:inline">#{ticket.user.numeric_id}</span>
          </div>
        </div>

        <button
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-[var(--form-border)] hover:bg-[var(--form-highlight-subtle)] transition-colors cursor-pointer mt-0.5"
          title={expanded ? t.collapse : t.expand}
        >
          <span className={`text-xs text-muted-foreground/50 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>

      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">
            {ticket.message}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-background border border-border rounded-lg px-3.5 py-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50 mb-2.5">{t.userHeader}</p>
              <div className="flex flex-col gap-1.5">
                {[
                  [t.username, ticket.user.username],
                  [t.email, ticket.user.email],
                  [t.phone, ticket.user.phone],
                  [t.id, `#${ticket.user.numeric_id}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 text-xs">
                    <span className="text-muted-foreground/50">{k}</span>
                    <span className="text-muted-foreground font-mono truncate max-w-[160px]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {metaEntries.length > 0 && (
              <div className="bg-background border border-border rounded-lg px-3.5 py-3">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50 mb-2.5">{t.deviceHeader}</p>
                <div className="flex flex-col gap-1.5">
                  {metaEntries.map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2 text-xs">
                      <span className="text-muted-foreground/50 capitalize shrink-0">{k.replace(/_/g, " ")}</span>
                      <span className="text-muted-foreground font-mono truncate max-w-[160px]">{String(v)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <p className="text-[10px] font-mono text-muted-foreground/25 mt-3">ID: {ticket.id}</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminSupportSection() {
  const language = useUIStore((state) => state.language); // Selects current store language ("En" | "Ge")
  const t = TRANSLATIONS[language];

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [statusFilter, setStatusFilter] = useState<string>("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  const fetchTickets = useCallback(async (page: number, status: string, type: string) => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string | number> = { page };
      // Filtering matches strict system values needed by your backend routing architecture
      if (status) params.status = status;
      if (type) params.type = type;

      const res = await api.get<TicketsResponse>("/api/admin/support/tickets", { params });
      setTickets(res.data.data);
      setCurrentPage(res.data.current_page);
      setLastPage(res.data.last_page ?? 1);
      setTotal(res.data.total);
    } catch {
      setError(language === "Ge" ? "მხარდაჭერის ბილეთების ჩატვირთვა ვერ მოხერხდა." : "Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  }, [language]);

  useEffect(() => {
    fetchTickets(currentPage, statusFilter, typeFilter);
  }, [currentPage, statusFilter, typeFilter, fetchTickets]);

  const handleStatusChange = (v: string) => {
    setCurrentPage(1);
    setStatusFilter(v);
  };

  const handleTypeChange = (v: string) => {
    setCurrentPage(1);
    setTypeFilter(v);
  };

  const handleStatusUpdated = (id: string, next: TicketStatus) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status: next } : t)));
  };

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6">

      {/* Section header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-1 h-8 rounded-full bg-[var(--form-highlight)]" />
          <div>
            <h2 className="text-lg font-bold text-foreground tracking-tight">{t.supportTickets}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading ? t.loading : t.ticketsTotal(total)}
            </p>
          </div>
        </div>

        <button
          onClick={() => fetchTickets(currentPage, statusFilter, typeFilter)}
          disabled={loading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-card text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-[var(--form-border)] transition-colors disabled:opacity-40 cursor-pointer"
        >
          {loading ? (
            <span className="w-3 h-3 border-2 border-muted-foreground/30 border-t-[var(--form-highlight)] rounded-full animate-spin" />
          ) : (
            <span className="text-base leading-none">↻</span>
          )}
          {t.refresh}
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onStatusChange={handleStatusChange}
        onTypeChange={handleTypeChange}
        total={total}
        lang={language}
      />

      {/* Error */}
      {error && !loading && (
        <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/25 rounded-xl px-4 py-3 text-sm text-destructive">
          <span>⚠</span>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => fetchTickets(currentPage, statusFilter, typeFilter)}
            className="text-xs border border-destructive/30 rounded-lg px-3 py-1.5 hover:bg-destructive/10 transition-colors cursor-pointer"
          >
            {t.retry}
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="flex flex-col gap-2">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 rounded-xl bg-muted/40 animate-pulse" style={{ animationDelay: `${i * 0.05}s` }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && tickets.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-20 text-center">
          <span className="text-5xl opacity-10">🎫</span>
          <p className="text-base font-semibold text-muted-foreground mt-3">{t.noTickets}</p>
          <p className="text-sm text-muted-foreground/50">
            {statusFilter || typeFilter ? t.tryClearingFilters : t.noTicketsSubmitted}
          </p>
          {(statusFilter || typeFilter) && (
            <button
              onClick={() => { handleStatusChange(""); handleTypeChange(""); }}
              className="mt-3 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-[var(--form-border)] transition-colors cursor-pointer"
            >
              {t.clearFilters}
            </button>
          )}
        </div>
      )}

      {/* Ticket list */}
      {!loading && tickets.length > 0 && (
        <div className="animate-in fade-in-0 duration-200">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onStatusUpdated={handleStatusUpdated} lang={language} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {lastPage > 1 && !loading && (
        <div className="flex items-center justify-center gap-4 pt-2">
          <button
            disabled={currentPage <= 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-[var(--form-border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {t.prev}
          </button>
          <span className="text-xs font-mono text-muted-foreground/50">
            {currentPage} / {lastPage}
          </span>
          <button
            disabled={currentPage >= lastPage}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-[var(--form-border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            {t.next}
          </button>
        </div>
      )}
    </div>
  );
}
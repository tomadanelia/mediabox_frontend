import { useState, useEffect, useCallback, useRef } from "react";
import api from "../../src/lib/axios";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketType = "bug_report" | "channel_issue" | "billing" | "feedback";
type TicketStatus = "pending" | "investigating" | "resolved" | "closed";

interface TicketUser {
  id: string;
  username: string | null; // Allow null values
  email: string | null;    // Allow null values
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

const STATUS_CONFIG: Record<TicketStatus, { label: string; dot: string; badge: string; menu: string }> = {
  pending:       { label: "Pending",       dot: "bg-amber-400",          badge: "text-amber-500 border-amber-500/30 bg-amber-500/10",     menu: "hover:bg-amber-500/10 hover:text-amber-500" },
  investigating: { label: "Investigating", dot: "bg-blue-400",           badge: "text-blue-500 border-blue-500/30 bg-blue-500/10",        menu: "hover:bg-blue-500/10 hover:text-blue-500" },
  resolved:      { label: "Resolved",      dot: "bg-green-400",          badge: "text-green-500 border-green-500/30 bg-green-500/10",     menu: "hover:bg-green-500/10 hover:text-green-500" },
  closed:        { label: "Closed",        dot: "bg-muted-foreground/40", badge: "text-muted-foreground border-border bg-muted/40",       menu: "hover:bg-muted/60 hover:text-foreground" },
};

const TYPE_CONFIG: Record<TicketType, { label: string; icon: string }> = {
  bug_report:    { label: "Bug Report",     icon: "🐛" },
  channel_issue: { label: "Channel Issue",  icon: "📡" },
  billing:       { label: "Billing",        icon: "💳" },
  feedback:      { label: "Feedback",       icon: "💬" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function initials(name: string | null) {
  if (!name) return "??"; // Safe fallback string
  return name.slice(0, 2).toUpperCase();
}
// ─── Status Pill ─────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: TicketStatus }) {
  const sc = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-full px-2.5 py-1 ${sc.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
      {sc.label}
    </span>
  );
}

// ─── Status Dropdown ─────────────────────────────────────────────────────────

function StatusDropdown({
  ticketId,
  current,
  onUpdated,
}: {
  ticketId: string;
  current: TicketStatus;
  onUpdated: (id: string, next: TicketStatus) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside the dropdown entirely
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
      await api.patch(`/api/admin/support/tickets/${ticketId}/status`, { status: next });
      onUpdated(ticketId, next);
    } catch {
      // silently fail — wire a toast here if needed
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
        title="Change status"
      >
        <StatusPill status={current} />
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
                  // Use onMouseDown so the click registers before any blur/focus events
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
                {sc.label}
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
}: {
  statusFilter: string;
  typeFilter: string;
  onStatusChange: (v: string) => void;
  onTypeChange: (v: string) => void;
  total: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-5">
      {/* Status filter chips */}
      <div className="flex flex-wrap gap-1.5">
        <button
          onClick={() => onStatusChange("")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
            statusFilter === ""
              ? "bg-[var(--form-highlight-subtle)] border-[var(--form-border)] text-[var(--form-highlight)]"
              : "bg-background border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All
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
            {STATUS_CONFIG[s].label}
          </button>
        ))}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

      {/* Type filter */}
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
            {TYPE_CONFIG[tp].label}
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
}: {
  ticket: Ticket;
  onStatusUpdated: (id: string, next: TicketStatus) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const tc = TYPE_CONFIG[ticket.type];
  const metaEntries = Object.entries(ticket.metadata).filter(([, v]) => v != null && v !== "");

  return (
    <div className="border border-border rounded-xl overflow-hidden transition-colors hover:border-[var(--form-border)] bg-card mb-2">
      {/* Main row */}
      <div className="flex items-start gap-3 px-4 py-3.5">
        {/* Type icon */}
        <span className="text-xl shrink-0 mt-0.5">{tc.icon}</span>

        {/* Center content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{ticket.subject}</p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                <span className="text-[11px] text-muted-foreground/60 font-mono">{tc.label}</span>
                <span className="text-[11px] text-muted-foreground/40 font-mono">{formatDate(ticket.created_at)}</span>
              </div>
            </div>

            {/* Status dropdown */}
            <div className="shrink-0">
              <StatusDropdown
                ticketId={ticket.id}
                current={ticket.status}
                onUpdated={onStatusUpdated}
              />
            </div>
          </div>

          {/* User info row */}
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

        {/* Expand toggle */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-lg border border-border hover:border-[var(--form-border)] hover:bg-[var(--form-highlight-subtle)] transition-colors cursor-pointer mt-0.5"
          title={expanded ? "Collapse" : "Expand"}
        >
          <span className={`text-xs text-muted-foreground/50 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}>▾</span>
        </button>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-border px-4 pb-4 pt-3.5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
          {/* Message */}
          <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap mb-4">
            {ticket.message}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* User details */}
            <div className="bg-background border border-border rounded-lg px-3.5 py-3">
              <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50 mb-2.5">User</p>
              <div className="flex flex-col gap-1.5">
                {[
                  ["Username", ticket.user.username],
                  ["Email", ticket.user.email],
                  ["Phone", ticket.user.phone],
                  ["ID", `#${ticket.user.numeric_id}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-2 text-xs">
                    <span className="text-muted-foreground/50">{k}</span>
                    <span className="text-muted-foreground font-mono truncate max-w-[160px]">{v}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Metadata */}
            {metaEntries.length > 0 && (
              <div className="bg-background border border-border rounded-lg px-3.5 py-3">
                <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50 mb-2.5">Device / Session</p>
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
      if (status) params.status = status;
      if (type) params.type = type;

      const res = await api.get<TicketsResponse>("/api/admin/support/tickets", { params });
      setTickets(res.data.data);
      setCurrentPage(res.data.current_page);
      setLastPage(res.data.last_page ?? 1);
      setTotal(res.data.total);
    } catch {
      setError("Failed to load support tickets.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets(currentPage, statusFilter, typeFilter);
  }, [currentPage, statusFilter, typeFilter, fetchTickets]);

  // When filter changes reset to page 1
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
            <h2 className="text-lg font-bold text-foreground tracking-tight">Support Tickets</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {loading ? "Loading…" : `${total} ticket${total !== 1 ? "s" : ""} total`}
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
          Refresh
        </button>
      </div>

      {/* Filters */}
      <FilterBar
        statusFilter={statusFilter}
        typeFilter={typeFilter}
        onStatusChange={handleStatusChange}
        onTypeChange={handleTypeChange}
        total={total}
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
            Retry
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
          <p className="text-base font-semibold text-muted-foreground mt-3">No tickets found</p>
          <p className="text-sm text-muted-foreground/50">
            {statusFilter || typeFilter ? "Try clearing the filters." : "No support tickets have been submitted yet."}
          </p>
          {(statusFilter || typeFilter) && (
            <button
              onClick={() => { handleStatusChange(""); handleTypeChange(""); }}
              className="mt-3 px-4 py-2 rounded-lg border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-[var(--form-border)] transition-colors cursor-pointer"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Ticket list */}
      {!loading && tickets.length > 0 && (
        <div className="animate-in fade-in-0 duration-200">
          {tickets.map((ticket) => (
            <TicketRow key={ticket.id} ticket={ticket} onStatusUpdated={handleStatusUpdated} />
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
            ← Prev
          </button>
          <span className="text-xs font-mono text-muted-foreground/50">
            {currentPage} / {lastPage}
          </span>
          <button
            disabled={currentPage >= lastPage}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-[var(--form-border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
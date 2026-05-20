import { useState, useEffect, useCallback } from "react";
import api from "../../src/lib/axios";
import useUIStore from "../../src/store/ui-store";

// ─── Types ────────────────────────────────────────────────────────────────────

type TicketType = "bug_report" | "channel_issue" | "billing" | "feedback";

interface SubmitPayload {
  type: TicketType;
  subject: string;
  message: string;
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
  status: "pending" | "open" | "resolved" | "closed";
  metadata: TicketMeta;
  created_at: string;
  updated_at: string;
}

interface TicketsResponse {
  current_page: number;
  data: Ticket[];
  last_page: number;
  per_page: number;
  total: number;
}

// ─── Translations ─────────────────────────────────────────────────────────────

const translations = {
  En: {
    pageTitle: "Support Center",
    pageSubtitle: "Report bugs, channel issues, or send us feedback",
    tabNew: "New Report",
    tabTickets: "My Tickets",
    labelType: "Report Type",
    labelSubject: "Subject",
    labelSubjectHint: "max 150 chars",
    labelDetails: "Details",
    labelDetailsHint: "10–5000 chars",
    placeholderSubject: "Brief description of the issue",
    placeholderDetails:
      "Describe the issue in detail. Include steps to reproduce, expected vs actual behaviour, etc.",
    submit: "Submit Report",
    submitting: "Submitting…",
    successTitle: "Report submitted",
    metaTitle: "Device & Session Info",
    loadingText: "Loading tickets…",
    emptyTitle: "No tickets yet",
    emptySub: "Submit a report and it will appear here.",
    retry: "Retry",
    prevPage: "← Prev",
    nextPage: "Next →",
    bugReport: "Bug Report",
    channelIssue: "Channel Issue",
    billing: "Billing",
    feedback: "Feedback",
    statusPending: "Pending",
    statusOpen: "Open",
    statusResolved: "Resolved",
    statusClosed: "Closed",
    ticketId: "Ticket ID",
  },
  Ge: {
    pageTitle: "მხარდაჭერის ცენტრი",
    pageSubtitle: "შეატყობინეთ ხარვეზები, არხის პრობლემები ან გამოგვიგზავნეთ გამოხმაურება",
    tabNew: "ახალი მოთხოვნა",
    tabTickets: "ჩემი ტიკეტები",
    labelType: "მოთხოვნის ტიპი",
    labelSubject: "სათაური",
    labelSubjectHint: "მაქს. 150 სიმბოლო",
    labelDetails: "დეტალები",
    labelDetailsHint: "10–5000 სიმბოლო",
    placeholderSubject: "მოკლე აღწერა",
    placeholderDetails:
      "დეტალურად აღწერეთ პრობლემა. მიუთითეთ რეპროდუქციის ნაბიჯები, მოსალოდნელი და ფაქტობრივი შედეგი.",
    submit: "გაგზავნა",
    submitting: "იგზავნება…",
    successTitle: "მოთხოვნა გაგზავნილია",
    metaTitle: "მოწყობილობის ინფო",
    loadingText: "ტიკეტები იტვირთება…",
    emptyTitle: "ტიკეტები არ არის",
    emptySub: "გამოგვიგზავნეთ მოთხოვნა და ის აქ გამოჩნდება.",
    retry: "თავიდან",
    prevPage: "← წინა",
    nextPage: "შემდეგი →",
    bugReport: "ხარვეზი",
    channelIssue: "არხის პრობლემა",
    billing: "გადახდა",
    feedback: "გამოხმაურება",
    statusPending: "მოლოდინში",
    statusOpen: "ღია",
    statusResolved: "გადაჭრილი",
    statusClosed: "დახურული",
    ticketId: "ტიკეტის ID",
  },
} as const;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const TYPE_ICONS: Record<TicketType, string> = {
  bug_report: "🐛",
  channel_issue: "📡",
  billing: "💳",
  feedback: "💬",
};

const STATUS_CONFIG: Record<
  string,
  { dot: string; badge: string }
> = {
  pending: {
    dot: "bg-amber-400",
    badge: "text-amber-500 border-amber-500/30 bg-amber-500/10",
  },
  open: {
    dot: "bg-blue-400",
    badge: "text-blue-500 border-blue-500/30 bg-blue-500/10",
  },
  resolved: {
    dot: "bg-green-400",
    badge: "text-green-500 border-green-500/30 bg-green-500/10",
  },
  closed: {
    dot: "bg-muted-foreground/50",
    badge: "text-muted-foreground border-border bg-muted/40",
  },
};

function formatDate(iso: string, lang: "En" | "Ge") {
  return new Date(iso).toLocaleDateString(lang === "Ge" ? "ka-GE" : "en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const language = useUIStore((s) => s.language);
  const t = translations[language];

  const TYPE_LABELS: Record<TicketType, string> = {
    bug_report: t.bugReport,
    channel_issue: t.channelIssue,
    billing: t.billing,
    feedback: t.feedback,
  };

  const STATUS_LABELS: Record<string, string> = {
    pending: t.statusPending,
    open: t.statusOpen,
    resolved: t.statusResolved,
    closed: t.statusClosed,
  };

  const [activeTab, setActiveTab] = useState<"submit" | "tickets">("submit");

  // Form
  const [form, setForm] = useState<SubmitPayload>({
    type: "bug_report",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<Record<string, string[]> | null>(null);
  const [submitGeneralError, setSubmitGeneralError] = useState<string | null>(null);

  // Tickets
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);
  const [ticketsError, setTicketsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchTickets = useCallback(async (page: number) => {
    setTicketsLoading(true);
    setTicketsError(null);
    try {
      const res = await api.get<TicketsResponse>("/api/support/tickets", {
        params: { page },
      });
      setTickets(res.data.data);
      setCurrentPage(res.data.current_page);
      setLastPage(res.data.last_page);
      setTotal(res.data.total);
    } catch {
      setTicketsError(language === "Ge" ? "ტიკეტების ჩატვირთვა ვერ მოხდა." : "Failed to load tickets.");
    } finally {
      setTicketsLoading(false);
    }
  }, [language]);

  useEffect(() => {
    if (activeTab === "tickets") fetchTickets(currentPage);
  }, [activeTab, currentPage, fetchTickets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitGeneralError(null);
    setSubmitSuccess(null);
    try {
      const res = await api.post<{ message: string; ticket_id: string }>(
        "/api/support/tickets",
        form
      );
      setSubmitSuccess(res.data.ticket_id);
      setForm({ type: "bug_report", subject: "", message: "" });
    } catch (err: unknown) {
      const axiosErr = err as {
        response?: { status?: number; data?: { message?: string; errors?: Record<string, string[]> } };
      };
      if (axiosErr.response?.status === 422 && axiosErr.response.data?.errors) {
        setSubmitError(axiosErr.response.data.errors);
      } else {
        setSubmitGeneralError(
          axiosErr.response?.data?.message ||
            (language === "Ge" ? "დაფიქსირდა შეცდომა." : "Something went wrong.")
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground px-4 py-8 md:px-8 md:py-12">
      <div className="max-w-2xl mx-auto">

        {/* ── Header ── */}
        <div className="flex overflow-hidden rounded-xl border border-border bg-card mb-8">
          <div className="w-1.5 shrink-0 bg-[var(--form-highlight)]" />
          <div className="px-6 py-7">
            <h1 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight font-geo">
              {t.pageTitle}
            </h1>
            <p className="mt-1.5 text-sm text-muted-foreground">{t.pageSubtitle}</p>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="flex gap-1 border-b border-border mb-6">
          {(["submit", "tickets"] as const).map((tab) => {
            const isActive = activeTab === tab;
            const label = tab === "submit" ? t.tabNew : t.tabTickets;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={[
                  "relative px-5 py-3 text-sm font-semibold font-geo transition-colors duration-150",
                  "border-b-2 -mb-px",
                  isActive
                    ? "text-[var(--form-highlight)] border-[var(--form-highlight)]"
                    : "text-muted-foreground border-transparent hover:text-foreground",
                ].join(" ")}
              >
                {label}
                {tab === "tickets" && total > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[var(--form-highlight)] text-white text-[10px] font-bold">
                    {total}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Submit Form ── */}
        {activeTab === "submit" && (
          <div className="bg-card border border-border rounded-xl p-6 md:p-8 animate-in fade-in-0 slide-in-from-bottom-2 duration-200">

            {/* Success */}
            {submitSuccess && (
              <div className="flex items-start gap-3 bg-green-500/10 border border-green-500/25 rounded-lg px-4 py-3.5 mb-6">
                <span className="text-green-500 text-base mt-0.5 shrink-0">✓</span>
                <div>
                  <p className="text-sm font-semibold text-green-500">{t.successTitle}</p>
                  <p className="text-xs text-green-400/80 mt-0.5 font-mono break-all">
                    ID: {submitSuccess}
                  </p>
                </div>
              </div>
            )}

            {/* General error */}
            {submitGeneralError && (
              <div className="flex items-center gap-2 bg-destructive/10 border border-destructive/25 rounded-lg px-4 py-3 mb-5 text-sm text-destructive">
                <span>⚠</span> {submitGeneralError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">

              {/* Type selector */}
              <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
                  {t.labelType}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(Object.entries(TYPE_LABELS) as [TicketType, string][]).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, type: val }))}
                      className={[
                        "flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm font-semibold transition-all duration-150 cursor-pointer",
                        form.type === val
                          ? "bg-[var(--form-highlight-subtle)] border-[var(--form-border)] text-[var(--form-highlight)]"
                          : "bg-background border-border text-muted-foreground hover:border-border hover:text-foreground",
                      ].join(" ")}
                    >
                      <span className="text-base">{TYPE_ICONS[val]}</span>
                      <span className="truncate">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
                  {t.labelSubject}{" "}
                  <span className="normal-case tracking-normal font-normal text-muted-foreground/50">
                    · {t.labelSubjectHint}
                  </span>
                </label>
                <input
                  type="text"
                  value={form.subject}
                  maxLength={150}
                  required
                  onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder={t.placeholderSubject}
                  className={[
                    "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--form-highlight)]/30 focus:border-[var(--form-border)] transition-colors",
                    submitError?.subject ? "border-destructive" : "border-border",
                  ].join(" ")}
                />
                {submitError?.subject && (
                  <p className="text-xs text-destructive mt-0.5">{submitError.subject.join(", ")}</p>
                )}
              </div>

              {/* Message */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground">
                  {t.labelDetails}{" "}
                  <span className="normal-case tracking-normal font-normal text-muted-foreground/50">
                    · {t.labelDetailsHint}
                  </span>
                </label>
                <textarea
                  value={form.message}
                  minLength={10}
                  maxLength={5000}
                  required
                  rows={6}
                  onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                  placeholder={t.placeholderDetails}
                  className={[
                    "w-full rounded-lg border bg-background px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 resize-y min-h-[120px]",
                    "focus:outline-none focus:ring-2 focus:ring-[var(--form-highlight)]/30 focus:border-[var(--form-border)] transition-colors leading-relaxed",
                    submitError?.message ? "border-destructive" : "border-border",
                  ].join(" ")}
                />
                <div className="flex items-center justify-between">
                  {submitError?.message ? (
                    <p className="text-xs text-destructive">{submitError.message.join(", ")}</p>
                  ) : (
                    <span />
                  )}
                  <span className="text-[11px] text-muted-foreground/50 font-mono">
                    {form.message.length} / 5000
                  </span>
                </div>
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={submitting}
                className={[
                  "self-start flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-bold text-white tracking-wide transition-all duration-150",
                  submitting
                    ? "bg-[var(--form-highlight)]/50 cursor-not-allowed"
                    : "bg-[var(--form-highlight)] hover:bg-[var(--button-hover)] active:scale-95 cursor-pointer",
                ].join(" ")}
              >
                {submitting ? (
                  <>
                    <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    {t.submitting}
                  </>
                ) : (
                  <>{t.submit} →</>
                )}
              </button>
            </form>
          </div>
        )}

        {/* ── Tickets List ── */}
        {activeTab === "tickets" && (
          <div className="animate-in fade-in-0 slide-in-from-bottom-2 duration-200">

            {/* Loading */}
            {ticketsLoading && (
              <div className="flex flex-col items-center gap-4 py-16">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="w-2 h-2 rounded-full bg-[var(--form-highlight)] animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <p className="text-sm text-muted-foreground">{t.loadingText}</p>
              </div>
            )}

            {/* Error */}
            {ticketsError && !ticketsLoading && (
              <div className="flex items-center gap-3 bg-destructive/10 border border-destructive/25 rounded-lg px-4 py-3 text-sm text-destructive mb-4">
                <span>⚠</span>
                <span className="flex-1">{ticketsError}</span>
                <button
                  onClick={() => fetchTickets(currentPage)}
                  className="text-xs border border-destructive/30 rounded px-2.5 py-1 hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  {t.retry}
                </button>
              </div>
            )}

            {/* Empty */}
            {!ticketsLoading && !ticketsError && tickets.length === 0 && (
              <div className="flex flex-col items-center gap-2 py-20 text-center">
                <span className="text-4xl opacity-20">◎</span>
                <p className="text-base font-semibold text-muted-foreground mt-2">{t.emptyTitle}</p>
                <p className="text-sm text-muted-foreground/50">{t.emptySub}</p>
              </div>
            )}

            {/* Ticket cards */}
            {!ticketsLoading &&
              tickets.map((ticket) => {
                const sc = STATUS_CONFIG[ticket.status] ?? STATUS_CONFIG.closed;
                const isOpen = expandedId === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    className="bg-card border border-border rounded-xl mb-2.5 overflow-hidden transition-colors hover:border-[var(--form-border)]"
                  >
                    {/* Card header button */}
                    <button
                      className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left cursor-pointer"
                      onClick={() => setExpandedId(isOpen ? null : ticket.id)}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <span className="text-xl shrink-0">{TYPE_ICONS[ticket.type]}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {ticket.subject}
                          </p>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5 font-mono">
                            {TYPE_LABELS[ticket.type]} · {formatDate(ticket.created_at, language)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={[
                            "hidden sm:flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-full px-2.5 py-1",
                            sc.badge,
                          ].join(" ")}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                          {STATUS_LABELS[ticket.status] ?? ticket.status}
                        </span>
                        <span
                          className={[
                            "text-muted-foreground/40 text-xs transition-transform duration-200",
                            isOpen ? "rotate-180" : "",
                          ].join(" ")}
                        >
                          ▾
                        </span>
                      </div>
                    </button>

                    {/* Mobile status badge */}
                    <div className="sm:hidden px-5 pb-3 -mt-2">
                      <span
                        className={[
                          "inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest border rounded-full px-2.5 py-1",
                          sc.badge,
                        ].join(" ")}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${sc.dot}`} />
                        {STATUS_LABELS[ticket.status] ?? ticket.status}
                      </span>
                    </div>

                    {/* Expanded body */}
                    {isOpen && (
                      <div className="px-5 pb-5 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                        <div className="border-t border-border mb-4" />
                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {ticket.message}
                        </p>

                        {/* Metadata */}
                        {Object.entries(ticket.metadata).filter(([, v]) => v != null && v !== "").length > 0 && (
                          <div className="mt-4 bg-background border border-border rounded-lg px-4 py-3.5">
                            <p className="text-[10px] uppercase tracking-widest font-semibold text-muted-foreground/50 mb-3">
                              {t.metaTitle}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5">
                              {Object.entries(ticket.metadata)
                                .filter(([, v]) => v != null && v !== "")
                                .map(([k, v]) => (
                                  <div key={k} className="flex gap-2 text-xs font-mono">
                                    <span className="text-muted-foreground/50 capitalize shrink-0">
                                      {k.replace(/_/g, " ")}
                                    </span>
                                    <span className="text-muted-foreground truncate">{String(v)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        )}

                        <p className="text-[10px] font-mono text-muted-foreground/30 mt-3">
                          {t.ticketId}: {ticket.id}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}

            {/* Pagination */}
            {lastPage > 1 && !ticketsLoading && (
              <div className="flex items-center justify-center gap-4 mt-6">
                <button
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => p - 1)}
                  className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-[var(--form-border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t.prevPage}
                </button>
                <span className="text-xs font-mono text-muted-foreground/50">
                  {currentPage} / {lastPage}
                </span>
                <button
                  disabled={currentPage >= lastPage}
                  onClick={() => setCurrentPage((p) => p + 1)}
                  className="px-4 py-2 rounded-lg border border-border bg-card text-sm font-semibold text-muted-foreground hover:text-foreground hover:border-[var(--form-border)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  {t.nextPage}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
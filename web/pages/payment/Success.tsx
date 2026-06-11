import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../src/lib/axios";
import useUIStore from "../../src/store/ui-store";
import type {
  InvoiceData,
  PlanPurchaseInvoiceData,
  DeviceLimitInvoiceData,
} from "../../src/types/invoice";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Transaction {
  id: string;
  item_name: string;
  amount: string;
  currency: string;
  status: "completed" | "failed" | "pending";
  payment_method: string;
  date: string;
  metadata:
    | string
    | {
        type?: string;
        quantity?: number;
        old_limit?: number;
        new_limit?: number;
        previous_balance?: string | number;
        price_per_unit?: number;
        [key: string]: unknown;
      };
}

// ─── Helpers (mirrors transactionsTab.tsx) ────────────────────────────────────

function parseMeta(metadata: Transaction["metadata"]) {
  if (typeof metadata === "string") {
    try {
      return JSON.parse(metadata);
    } catch {
      return {};
    }
  }
  return metadata ?? {};
}

const TYPE_LABELS = {
  En: {
    tv_limit_increase: "TV Device Limit Upgrade",
    account_adjustment: "Account Adjustment",
  },
  Ge: {
    tv_limit_increase: "TV მოწყობილობის ლიმიტის განახლება",
    account_adjustment: "ანგარიშის კორექტირება",
  },
} as const;

function resolveItemName(
  item_name: string,
  meta: ReturnType<typeof parseMeta>,
  language: "En" | "Ge"
): string {
  const type = meta?.type as string | undefined;
  if (
    type &&
    TYPE_LABELS[language][type as keyof (typeof TYPE_LABELS)["En"]]
  ) {
    return TYPE_LABELS[language][type as keyof (typeof TYPE_LABELS)["En"]];
  }
  return item_name;
}

function buildInvoiceData(
  t: Transaction,
  companyName?: string | null,
  userFullName?: string | null,
  userNumericId?: string | number | null,
  language: "En" | "Ge" = "En"
): InvoiceData {
  const meta = parseMeta(t.metadata);
  const isTvLimit =
    meta?.type === "tv_limit_increase" || meta?.new_limit != null;
  const resolvedName = resolveItemName(t.item_name, meta, language);
  const previousBalance =
    meta?.previous_balance != null
      ? parseFloat(String(meta.previous_balance))
      : null;
  const remainingBalance =
    previousBalance !== null
      ? (previousBalance - parseFloat(t.amount)).toFixed(2)
      : "0.00";

  const baseInvoice = {
    transaction_id: t.id,
    date: t.date,
    item_name: resolvedName,
    amount: t.amount,
    currency: t.currency,
    company_name: companyName ?? undefined,
    full_name: userFullName ?? undefined,
    customer_id: userNumericId ? String(userNumericId) : undefined,
  };

  if (isTvLimit) {
    return {
      success: true,
      invoice: baseInvoice,
      new_limit: meta.new_limit as number,
      remaining_balance: remainingBalance,
    } as DeviceLimitInvoiceData;
  }

  return {
    success: true,
    invoice: { ...baseInvoice, user_name: userFullName ?? "", user_id: 0 },
    expires_at: "",
    remaining_balance: remainingBalance,
  } as PlanPurchaseInvoiceData;
}

// ─── Translations ─────────────────────────────────────────────────────────────

const tx = {
  En: {
    title: "Payment Successful",
    subtitle: "Your balance has been topped up successfully.",
    amount: "Amount Paid",
    transactionId: "Transaction ID",
    date: "Date",
    status: "Status",
    statusLabel: "Completed",
    viewInvoice: "View Invoice",
    backToProfile: "Back to Profile",
    loadingInvoice: "Loading invoice…",
    invoiceError: "Could not load invoice details.",
    retry: "Retry",
    currency: "GEL",
  },
  Ge: {
    title: "გადახდა წარმატებულია",
    subtitle: "თქვენი ბალანსი წარმატებით შეივსო.",
    amount: "გადახდილი თანხა",
    transactionId: "ტრანზაქციის ID",
    date: "თარიღი",
    status: "სტატუსი",
    statusLabel: "დასრულებული",
    viewInvoice: "ინვოისის ნახვა",
    backToProfile: "პროფილზე დაბრუნება",
    loadingInvoice: "იტვირთება…",
    invoiceError: "ინვოისის ჩატვირთვა ვერ მოხდა.",
    retry: "თავიდან ცდა",
    currency: "GEL",
  },
} as const;

// ─── Animated checkmark ───────────────────────────────────────────────────────

function AnimatedCheck() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes circle-draw {
          from { stroke-dashoffset: 166; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes check-draw {
          from { stroke-dashoffset: 50; }
          to   { stroke-dashoffset: 0;  }
        }
        .anim-circle {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: circle-draw 0.5s cubic-bezier(0.65,0,0.45,1) 0.1s forwards;
        }
        .anim-check {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: check-draw 0.35s cubic-bezier(0.65,0,0.45,1) 0.55s forwards;
        }
      `}</style>
      <circle
        className="anim-circle"
        cx="26"
        cy="26"
        r="25"
        stroke="#22c55e"
        strokeWidth="2"
        fill="none"
      />
      <polyline
        className="anim-check"
        points="14,26 22,34 38,18"
        stroke="#22c55e"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const language = useUIStore((state) => state.language);
  const t = tx[language];

  // The backend redirects to success_url — we read ?transaction_id from the query string.
  // Adjust the param name to whatever your backend actually appends.
  const transactionId = searchParams.get("transaction_id") ?? searchParams.get("id");

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loadingTx, setLoadingTx] = useState(!!transactionId);
  const [txError, setTxError] = useState(false);

  // Extra context for invoice — same approach as transactionsTab
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [userFullName, setUserFullName] = useState<string | null>(null);
  const [userNumericId, setUserNumericId] = useState<string | number | null>(null);

  // Fetch user context (needed for buildInvoiceData)
  useEffect(() => {
    api
      .get("/api/user/company")
      .then((res) => {
        if (res.data?.has_company && res.data?.company_name)
          setCompanyName(res.data.company_name);
      })
      .catch(() => {});

    api
      .get("/api/user")
      .then((res) => {
        setUserFullName(res.data?.full_name ?? null);
        setUserNumericId(res.data?.numeric_id ?? null);
      })
      .catch(() => {});
  }, []);

  const fetchTransaction = async () => {
    if (!transactionId) return;
    setLoadingTx(true);
    setTxError(false);
    try {
      const res = await api.get(`/api/user/transactions/${transactionId}`);
      const txData: Transaction = res.data;
      setTransaction(txData);
      setInvoiceData(
        buildInvoiceData(txData, companyName, userFullName, userNumericId, language)
      );
    } catch {
      setTxError(true);
    } finally {
      setLoadingTx(false);
    }
  };

  useEffect(() => {
    fetchTransaction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transactionId, companyName, userFullName, userNumericId]);

  const handleViewInvoice = () => {
    if (!invoiceData) return;
    navigate("/invoice", { state: { invoiceData } });
  };

  const fmtDate = (raw: string) => {
    try {
      return new Date(raw).toLocaleString(
        language === "En" ? "en-US" : "ka-GE",
        { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }
      );
    } catch {
      return raw;
    }
  };

  const amount = transaction
    ? `${parseFloat(transaction.amount).toFixed(2)} ${transaction.currency === "GEL" ? "₾" : transaction.currency}`
    : null;

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-4 py-12"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md">

        {/* ── Card ── */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">

          {/* Top accent stripe */}
          <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-emerald-400 to-emerald-600" />

          <div className="px-8 py-10 flex flex-col items-center text-center">

            {/* Animated check */}
            <div className="w-16 h-16 mb-6">
              <AnimatedCheck />
            </div>

            <h1 className="text-xl font-semibold text-foreground mb-2">{t.title}</h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{t.subtitle}</p>

            {/* ── Amount hero (always shown if we have it) ── */}
            {amount && (
              <div className="w-full mb-6 py-6 rounded-xl bg-foreground flex flex-col items-center justify-center relative overflow-hidden">
                {/* subtle watermark */}
                <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none select-none">
                  <svg className="w-32 h-32 text-background" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                  </svg>
                </div>
                <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-background/50 mb-2">
                  {t.amount}
                </p>
                <p
                  className="text-5xl font-bold text-background tracking-tight"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {amount}
                </p>
              </div>
            )}

            {/* ── Transaction details ── */}
            {loadingTx && (
              <div className="w-full flex items-center justify-center gap-2 py-6">
                <div className="w-4 h-4 rounded-full border-2 border-red-500 border-t-transparent animate-spin" />
                <span className="text-sm text-muted-foreground">{t.loadingInvoice}</span>
              </div>
            )}

            {!loadingTx && txError && (
              <div className="w-full flex flex-col items-center gap-3 py-6">
                <p className="text-sm text-muted-foreground">{t.invoiceError}</p>
                <button
                  onClick={fetchTransaction}
                  className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors cursor-pointer"
                >
                  {t.retry}
                </button>
              </div>
            )}

            {!loadingTx && !txError && transaction && (
              <div className="w-full rounded-xl border border-border divide-y divide-border mb-6 text-left overflow-hidden">
                <Row label={t.status}>
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {t.statusLabel}
                  </span>
                </Row>
                <Row label={t.transactionId}>
                  <span className="font-mono text-xs text-foreground">{transaction.id}</span>
                </Row>
                <Row label={t.date}>
                  <span className="text-xs text-foreground">{fmtDate(transaction.date)}</span>
                </Row>
                <Row label={t.amount}>
                  <span className="text-xs font-semibold text-foreground tabular-nums">{amount}</span>
                </Row>
              </div>
            )}

            {/* ── No transaction_id in URL — still show generic success ── */}
            {!transactionId && !loadingTx && (
              <div className="w-full rounded-xl border border-border py-5 flex items-center justify-center mb-6">
                <span className="text-sm text-muted-foreground">
                  {language === "Ge"
                    ? "გადახდა დასრულდა"
                    : "Payment completed"}
                </span>
              </div>
            )}

            {/* ── CTA buttons ── */}
            <div className="w-full flex flex-col gap-3">
              {invoiceData && (
                <button
                  onClick={handleViewInvoice}
                  className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  {t.viewInvoice}
                </button>
              )}
              <button
                onClick={() => navigate("/profile")}
                className="w-full h-11 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-red-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                    d="M15 19l-7-7 7-7" />
                </svg>
                {t.backToProfile}
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Small helper sub-component ──────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-muted-foreground shrink-0 mr-4">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../src/lib/axios";
import type { DeviceLimitInvoiceData, InvoiceData, PlanPurchaseInvoiceData } from "../../src/types/invoice";

interface Transaction {
  id: string;
  item_name: string;
  amount: string;
  currency: string;
  status: "completed" | "failed" | "pending";
  payment_method: string;
  date: string;
  metadata: string | {  // API returns it as a JSON string
    type?: string;
    quantity?: number;
    old_limit?: number;
    new_limit?: number;
    previous_balance?: string | number;
    price_per_unit?: number;
    [key: string]: unknown;
  };
}

interface TransactionPage {
  current_page: number;
  data: Transaction[];
  last_page: number;
  total: number;
  from: number;
  to: number;
  next_page_url: string | null;
  prev_page_url: string | null;
}

interface TransactionsTabProps {
  language: "En" | "Ge";
  isDark: boolean;
  // colour tokens — passed in so this component stays in sync with the parent's `c` object
  c: {
    sub: string;
    faint: string;
    heading: string;
    divider: string;
    tableRow: string;
    logoBg: string;
    spinnerColor: string;
    accent: string;
  };
  companyName?: string | null;
  userFullName?: string | null;
  userNumericId?: string | number | null;
}
function parseMeta(metadata: Transaction["metadata"]) {
  if (typeof metadata === "string") {
    try { return JSON.parse(metadata); } catch { return {}; }
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
  if (type && TYPE_LABELS[language][type as keyof typeof TYPE_LABELS["En"]]) {
    return TYPE_LABELS[language][type as keyof typeof TYPE_LABELS["En"]];
  }
  return item_name;
}
const tx = {
  En: {
    cardTitle: "Transactions",
    empty: "No transactions yet.",
    date: "Date",
    item: "Item",
    amount: "Amount",
    method: "Method",
    status: { completed: "Paid", failed: "Failed", pending: "Pending" },
    prev: "Previous",
    next: "Next",
    pageOf: (cur: number, last: number) => `Page ${cur} of ${last}`,
    total: (n: number) => `${n} transaction${n !== 1 ? "s" : ""}`,
    tvUpgrade: "TV Device Upgrade",
    loading: "Loading transactions…",
    errorRetry: "Failed to load. Tap to retry.",
  },
  Ge: {
    cardTitle: "ტრანზაქციები",
    empty: "ტრანზაქციები არ არის.",
    date: "თარიღი",
    item: "სერვისი",
    amount: "თანხა",
    method: "გადახდა",
    status: { completed: "გადახდილი", failed: "შეცდომა", pending: "მოლოდინი" },
    prev: "წინა",
    next: "შემდეგი",
    pageOf: (cur: number, last: number) => `${cur} / ${last} გვ.`,
    total: (n: number) => `${n} ჩანაწერი`,
    tvUpgrade: "TV მოწყობილობის განახლება",
    loading: "იტვირთება…",
    errorRetry: "შეცდომა. დასაწყებად დააჭირეთ.",
  },
} as const;

// Map a raw transaction → the InvoiceData shape the InvoicePage expects
function buildInvoiceData(
  t: Transaction,
  companyName?: string | null,
  userFullName?: string | null,
  userNumericId?: string | number | null,
): InvoiceData {
  const meta = parseMeta(t.metadata);  // ← parse here
  const isTvLimit = meta?.type === "tv_limit_increase" || meta?.new_limit != null;

  const previousBalance = meta?.previous_balance != null
    ? parseFloat(String(meta.previous_balance))
    : null;
  const remainingBalance = previousBalance !== null
    ? (previousBalance - parseFloat(t.amount)).toFixed(2)
    : "0.00";

  const baseInvoice = {
    transaction_id: t.id,
    date: t.date,
    item_name: t.item_name,
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

// Icon for transaction type
function TxIcon({ meta }: { meta: ReturnType<typeof parseMeta> }) {
  const isTv = meta?.type === "tv_limit_increase";
  return (
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 text-[0.65rem] font-bold
        ${isTv ? "bg-amber-500/10 text-amber-400" : "bg-form-highlights/10 text-form-highlights"}`}
    >
      {isTv ? (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <rect
            x="2"
            y="3"
            width="20"
            height="14"
            rx="2"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M8 21h8M12 17v4" strokeWidth="1.8" strokeLinecap="round" />
        </svg>
      ) : (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.8}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      )}
    </div>
  );
}

// Status pill
function StatusPill({
  status,
  label,
}: {
  status: Transaction["status"];
  label: string;
}) {
  const cfg = {
    completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    failed: "bg-red-500/10 text-red-400 border-red-500/20",
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[0.6rem] font-semibold uppercase tracking-wide ${cfg[status]}`}
    >
      <span
        className={`w-1 h-1 rounded-full ${
          status === "completed"
            ? "bg-emerald-400"
            : status === "failed"
              ? "bg-red-400"
              : "bg-amber-400"
        }`}
      />
      {label}
    </span>
  );
}

export default function TransactionsTab({
  language,
  c,
  companyName,
  userFullName,
  userNumericId,
}: TransactionsTabProps) {
  const navigate = useNavigate();
  const t = tx[language];

  const [page, setPage] = useState(1);
  const [data, setData] = useState<TransactionPage | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchPage = useCallback(
    async (p: number) => {
      setLoading(true);
      setError(false);
      try {
        const res = await api.get(`/api/user/transactions?page=${p}`);
        setData(res.data);
        setPage(p);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

const handleRowClick = (transaction: Transaction) => {
  const invoiceData = buildInvoiceData(transaction, companyName, userFullName, userNumericId);
  navigate("/invoice", { state: { invoiceData } });
};

  const fmtDate = (raw: string) => {
    try {
      return new Date(raw).toLocaleString(
        language === "En" ? "en-US" : "ka-GE",
        { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
      );
    } catch {
      return raw;
    }
  };

  return (
    <div className="px-8 py-8 lg:px-14 lg:py-10">
      {/* Header row */}
      <div className="flex items-center justify-between mb-6">
        <p
          className={`text-[0.65rem] uppercase tracking-[0.2em] font-semibold ${c.sub}`}
        >
          {t.cardTitle}
        </p>
        {data && data.total > 0 && (
          <span className={`text-[0.65rem] ${c.sub}`}>
            {t.total(data.total)}
          </span>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-3 py-10">
          <div
            className={`w-5 h-5 rounded-full border-2 animate-spin border-form-highlights border-t-transparent`}
          />
          <span className={`text-sm ${c.sub}`}>{t.loading}</span>
        </div>
      )}

      {/* Error */}
      {!loading && error && (
        <button
          onClick={() => fetchPage(page)}
          className={`flex items-center gap-3 py-6 text-left group`}
        >
          <span className={`text-2xl ${c.faint}`}>⚠</span>
          <span
            className={`text-sm ${c.sub} group-hover:text-foreground transition-colors`}
          >
            {t.errorRetry}
          </span>
        </button>
      )}

      {/* Empty */}
      {!loading && !error && data?.data.length === 0 && (
        <div className="flex items-center gap-3 py-6">
          <span className={`text-2xl ${c.faint}`}>⊘</span>
          <span className={`text-sm ${c.sub}`}>{t.empty}</span>
        </div>
      )}

      {/* Table */}
      {!loading && !error && data && data.data.length > 0 && (
        <>
          {/* Column headers */}
          <div
            className={`hidden sm:flex items-center gap-4 pb-3 border-b ${c.divider}`}
          >
            <span className="w-9 shrink-0" />
            <span
              className={`flex-1 text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub}`}
            >
              {t.item}
            </span>
            <span
              className={`text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub} w-28 text-right hidden md:block`}
            >
              {t.date}
            </span>
            <span
              className={`text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub} w-20 text-right`}
            >
              {t.amount}
            </span>
            <span
              className={`text-[0.6rem] uppercase tracking-widest font-semibold ${c.sub} w-20 text-right`}
            >
              {t.status.completed.split("").join("")}
            </span>
          </div>

          <div className="flex flex-col">
            {data.data.map((txn) => {
  const meta = parseMeta(txn.metadata);
  const displayName = resolveItemName(txn.item_name, meta, language);

  return (
              <button
                key={txn.id}
                onClick={() => handleRowClick(txn)}
                className={`flex items-center gap-4 py-4 border-b text-left w-full cursor-pointer transition-colors duration-150 ${c.tableRow} group`}
              >
                {/* Icon */}
                <TxIcon meta={meta} />

                {/* Name + mobile date */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm font-medium truncate ${c.heading} group-hover:text-form-highlights transition-colors`}
                  >
                    {displayName}
                  </p>
                  <p className={`text-xs font-mono mt-0.5 md:hidden ${c.sub}`}>
                    {fmtDate(txn.date)}
                  </p>
                </div>

                {/* Desktop date */}
                <span
                  className={`text-xs font-mono ${c.sub} w-28 text-right shrink-0 hidden md:block`}
                >
                  {fmtDate(txn.date)}
                </span>

                {/* Amount */}
                <span
                  className={`text-sm font-bold tabular-nums w-20 text-right shrink-0 ${
                    txn.status === "failed"
                      ? "text-red-400"
                      : "text-foreground"
                  }`}
                >
                  -{parseFloat(txn.amount).toFixed(2)}{" "}
                  <span className="text-form-highlights text-xs">
                    {txn.currency === "GEL" ? "₾" : txn.currency}
                  </span>
                </span>

                {/* Status */}
                <div className="w-20 flex justify-end shrink-0">
                  <StatusPill
                    status={txn.status}
                    label={t.status[txn.status]}
                  />
                </div>
              </button>
               );
})}
          </div>

          {/* Pagination */}
          {data.last_page > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4">
              <button
                onClick={() => fetchPage(page - 1)}
                disabled={!data.prev_page_url}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-150 cursor-pointer
                  disabled:opacity-30 disabled:cursor-default
                  border-border text-muted-foreground hover:text-foreground hover:border-form-highlights
                  disabled:hover:text-muted-foreground disabled:hover:border-border`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {t.prev}
              </button>

              <span className={`text-xs ${c.sub}`}>
                {t.pageOf(data.current_page, data.last_page)}
              </span>

              <button
                onClick={() => fetchPage(page + 1)}
                disabled={!data.next_page_url}
                className={`flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-150 cursor-pointer
                  disabled:opacity-30 disabled:cursor-default
                  border-border text-muted-foreground hover:text-foreground hover:border-form-highlights
                  disabled:hover:text-muted-foreground disabled:hover:border-border`}
              >
                {t.next}
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
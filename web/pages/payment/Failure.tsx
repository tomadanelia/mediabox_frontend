import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import api from "../../src/lib/axios";
import useUIStore from "../../src/store/ui-store";

// ─── Translations ─────────────────────────────────────────────────────────────

const tx = {
  En: {
    title: "Payment Failed",
    subtitle: "Something went wrong while processing your payment. Your balance has not been charged.",
    errorCode: "Error Code",
    transactionId: "Transaction ID",
    tryAgain: "Try Again",
    backToProfile: "Back to Profile",
    retrying: "Redirecting…",
    retryError: "Could not initiate payment. Please try again.",
    help: "If the issue persists, please contact support.",
    reasons: {
      heading: "This can happen because of:",
      items: [
        "Insufficient funds on your card",
        "Card declined by your bank",
        "Session timed out",
        "Network error during checkout",
      ],
    },
  },
  Ge: {
    title: "გადახდა ვერ მოხდა",
    subtitle: "გადახდის დროს შეფერხება მოხდა. თქვენი ბალანსი არ შეცვლილა.",
    errorCode: "შეცდომის კოდი",
    transactionId: "ტრანზაქციის ID",
    tryAgain: "თავიდან ცდა",
    backToProfile: "პროფილზე დაბრუნება",
    retrying: "მიმდინარეობს…",
    retryError: "გადახდის ინიციალიზაცია ვერ მოხდა. სცადეთ თავიდან.",
    help: "პრობლემის გაგრძელების შემთხვევაში დაუკავშირდით მხარდაჭერას.",
    reasons: {
      heading: "შესაძლო მიზეზები:",
      items: [
        "არასაკმარისი თანხა ბარათზე",
        "ბარათი უარყოფილია ბანკის მიერ",
        "სესიის ვადა გავიდა",
        "ქსელის შეფერხება გადახდისას",
      ],
    },
  },
} as const;

// ─── Animated X mark ─────────────────────────────────────────────────────────

function AnimatedX() {
  return (
    <svg
      className="w-full h-full"
      viewBox="0 0 52 52"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <style>{`
        @keyframes circle-draw-err {
          from { stroke-dashoffset: 166; }
          to   { stroke-dashoffset: 0;   }
        }
        @keyframes x-draw {
          from { stroke-dashoffset: 40; opacity: 0; }
          to   { stroke-dashoffset: 0;  opacity: 1; }
        }
        .anim-circle-err {
          stroke-dasharray: 166;
          stroke-dashoffset: 166;
          animation: circle-draw-err 0.5s cubic-bezier(0.65,0,0.45,1) 0.1s forwards;
        }
        .anim-x-line {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          opacity: 0;
          animation: x-draw 0.3s cubic-bezier(0.65,0,0.45,1) 0.55s forwards;
        }
      `}</style>
      <circle
        className="anim-circle-err"
        cx="26"
        cy="26"
        r="25"
        stroke="#ef4444"
        strokeWidth="2"
        fill="none"
      />
      <line className="anim-x-line" x1="16" y1="16" x2="36" y2="36" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
      <line className="anim-x-line" x1="36" y1="16" x2="16" y2="36" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Row helper ───────────────────────────────────────────────────────────────

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-4 py-3">
      <span className="text-xs text-muted-foreground shrink-0 mr-4">{label}</span>
      <span className="text-right">{children}</span>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function PaymentFailure() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const language = useUIStore((state) => state.language);
  const t = tx[language];

  // Backend may append these to the failure_url redirect
  const transactionId = searchParams.get("transaction_id") ?? searchParams.get("id");
  const errorCode = searchParams.get("error_code") ?? searchParams.get("error");

  const [retrying, setRetrying] = useState(false);
  const [retryError, setRetryError] = useState(false);

  // Re-initiate with the same amount if it was passed in the URL (?amount=XX)
  const amountParam = searchParams.get("amount");

  const handleRetry = async () => {
    setRetrying(true);
    setRetryError(false);
    try {
      const amount = amountParam ? parseFloat(amountParam) : null;
      if (!amount || amount < 0.01) {
        // No amount to retry with — just send back to profile
        navigate("/profile");
        return;
      }
      const res = await api.post("/api/interpay/init", {
        amount,
        success_url: "https://tv-api.telecomm1.com/payment/success",
        failure_url: "https://tv-api.telecomm1.com/payment/failure",
      });
      const redirectUrl = res.data?.redirect_url;
      if (redirectUrl) {
        window.location.href = redirectUrl;
      } else {
        setRetryError(true);
        setRetrying(false);
      }
    } catch {
      setRetryError(true);
      setRetrying(false);
    }
  };

  const hasDetails = transactionId || errorCode;

  return (
    <div
      className="min-h-screen bg-background flex items-center justify-center px-4 py-12"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <div className="w-full max-w-md">

        {/* ── Card ── */}
        <div className="bg-background border border-border rounded-2xl overflow-hidden shadow-sm">

          {/* Top accent stripe — red */}
          <div className="h-1 w-full bg-gradient-to-r from-red-600 via-red-500 to-red-400" />

          <div className="px-8 py-10 flex flex-col items-center text-center">

            {/* Animated X */}
            <div className="w-16 h-16 mb-6">
              <AnimatedX />
            </div>

            <h1 className="text-xl font-semibold text-foreground mb-2">{t.title}</h1>
            <p className="text-sm text-muted-foreground mb-8 leading-relaxed">{t.subtitle}</p>

            {/* ── Error / transaction details ── */}
            {hasDetails && (
              <div className="w-full rounded-xl border border-red-500/20 divide-y divide-border mb-6 text-left overflow-hidden">
                {transactionId && (
                  <Row label={t.transactionId}>
                    <span className="font-mono text-xs text-foreground">{transactionId}</span>
                  </Row>
                )}
                {errorCode && (
                  <Row label={t.errorCode}>
                    <span className="font-mono text-xs text-red-400">{errorCode}</span>
                  </Row>
                )}
                {amountParam && (
                  <Row label={language === "Ge" ? "თანხა" : "Amount"}>
                    <span className="text-xs font-semibold text-foreground tabular-nums">
                      {parseFloat(amountParam).toFixed(2)} ₾
                    </span>
                  </Row>
                )}
              </div>
            )}

            {/* ── Reasons list ── */}
            <div className="w-full rounded-xl border border-border bg-muted/20 p-4 mb-6 text-left">
              <p className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground mb-3">
                {t.reasons.heading}
              </p>
              <ul className="flex flex-col gap-2">
                {t.reasons.items.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-red-500/60 shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* Retry error message */}
            {retryError && (
              <p className="text-xs text-red-400 mb-4">{t.retryError}</p>
            )}

            {/* ── CTA buttons ── */}
            <div className="w-full flex flex-col gap-3">
              <button
                onClick={handleRetry}
                disabled={retrying}
                className="w-full h-11 rounded-xl bg-foreground text-background text-sm font-semibold hover:opacity-90 transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retrying ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-background/30 border-t-background animate-spin" />
                    {t.retrying}
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t.tryAgain}
                  </>
                )}
              </button>

              <button
                onClick={() => navigate("/profile")}
                className="w-full h-11 rounded-xl border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:border-red-500/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 19l-7-7 7-7" />
                </svg>
                {t.backToProfile}
              </button>
            </div>

            {/* Help note */}
            <p className="text-[11px] text-muted-foreground/50 mt-6 leading-relaxed">{t.help}</p>

          </div>
        </div>
      </div>
    </div>
  );
}
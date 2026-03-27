import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import useUIStore from '../../src/store/ui-store'
import type {PlanPurchaseInvoiceData,DeviceLimitInvoiceData,InvoiceData} from "../../src/types/invoice"
import { useLocation } from 'react-router-dom'


function isPlanPurchase(data: InvoiceData): data is PlanPurchaseInvoiceData {
  return 'expires_at' in data
}


const tx = {
  En: {
    back: 'Back',
    invoiceTitle: 'Invoice',
    typeLabels: {
      purchase: 'Subscription Purchase',
      device_upgrade: 'TV Device Limit Upgrade',
    },
    sections: { from: 'Issued By', to: 'Billed To', details: 'Details' },
    fields: {
      invoiceNo: 'Invoice No.',
      date: 'Issue Date',
      plan: 'Plan',
      validUntil: 'Valid Until',
      remainingBalance: 'Remaining Balance',
      item: 'Item',
      newLimit: 'New Device Limit',
    },
    status: { paid: 'Paid' },
    total: 'Total',
    qrLabel: 'Scan for support',
    download: 'Download PDF',
    downloading: 'Generating…',
    issuedBy: 'Telecom 1 LLC',
    address: 'Kutaisi, Georgia',
  },
  Ge: {
    back: 'უკან',
    invoiceTitle: 'ინვოისი',
    typeLabels: {
      purchase: 'სააბონენტო შეძენა',
      device_upgrade: 'TV მოწყობილობის ლიმიტის განახლება',
    },
    sections: { from: 'გამცემი', to: 'გადამხდელი', details: 'დეტალები' },
    fields: {
      invoiceNo: 'ინვოისი #',
      date: 'თარიღი',
      plan: 'პაკეტი',
      validUntil: 'ვადა',
      remainingBalance: 'დარჩენილი ბალანსი',
      item: 'სერვისი',
      newLimit: 'ახალი ლიმიტი',
    },
    status: { paid: 'გადახდილი' },
    total: 'სულ',
    qrLabel: 'სკანირება მხარდაჭერისთვის',
    download: 'PDF ჩამოტვირთვა',
    downloading: 'მომზადება…',
    issuedBy: 'შპს Telecom 1',
    address: 'ქუთაისი, საქართველო',
  },
} as const


const STATUS_CFG = {
  paid: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/25',
    dot: 'bg-emerald-400',
  },
}

const TYPE_ACCENT = {
  purchase: {
    bar: 'bg-emerald-500',
    text: 'text-emerald-400',
    light: 'bg-emerald-500/8',
  },
  device_upgrade: {
    bar: 'bg-blue-500',
    text: 'text-blue-400',
    light: 'bg-blue-500/8',
  },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function QRCodeImage({ size = 110 }: { size?: number }) {
  const supportUrl = `${window.location.origin}/support`
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(supportUrl)}&format=png&color=000000&bgcolor=ffffff&margin=4&qzone=1`
  return (
    <div className="rounded-xl overflow-hidden bg-white p-2 shadow-sm">
      <img
        src={qrApiUrl}
        alt="QR"
        width={size}
        height={size}
        style={{ display: 'block', imageRendering: 'pixelated' }}
      />
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
  mono,
}: {
  label: string
  value: string | number
  highlight?: boolean
  mono?: boolean
}) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span
        className={`text-sm font-semibold ${highlight ? 'text-foreground' : 'text-foreground/80'} ${mono ? 'font-mono' : ''}`}
      >
        {value}
      </span>
    </div>
  )
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface InvoicePageProps {
  data: InvoiceData
  onBack?: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function InvoicePage({ onBack }: { onBack?: () => void }) {
  const navigate = useNavigate()
  const location = useLocation()
  
  const data = location.state?.invoiceData as InvoiceData | undefined

  if (!data) {
    navigate('/packets', { replace: true })
    return null
  }
  const language = useUIStore((state) => state.language)
  const [downloading, setDownloading] = useState(false)

  
  const t = tx[language]

  // ── Derive unified display values from whichever shape was passed ──────────
  const isPlan = isPlanPurchase(data)
  const invoiceType: 'purchase' | 'device_upgrade' = isPlan ? 'purchase' : 'device_upgrade'

  const inv = data.invoice as PlanPurchaseInvoiceData['invoice'] & DeviceLimitInvoiceData['invoice']
  const amount = parseFloat(String(inv.amount))
  const currency = inv.currency === 'GEL' ? '₾' : inv.currency
  const transactionId = String(inv.transaction_id)
  const invoiceNumber = `INV-${transactionId.slice(-8).toUpperCase()}`

  const billedTo =
  inv.company_name ??
  inv.full_name ??
  inv.customer_id ??
  (isPlan ? (data as PlanPurchaseInvoiceData).invoice.user_name : undefined)
  const expiresAt = isPlan ? (data as PlanPurchaseInvoiceData).expires_at : undefined
  const newLimit = !isPlan ? (data as DeviceLimitInvoiceData).new_limit : undefined

  const fmtDate = (iso?: string) =>
    iso
      ? new Date(iso).toLocaleDateString(language === 'En' ? 'en-US' : 'ka-GE', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : '—'

  const fmtMoney = (n?: number) => (n != null ? `${n.toFixed(2)} ${currency}` : '—')

  const statusCfg = STATUS_CFG.paid
  const accent = TYPE_ACCENT[invoiceType]
  const typeLabel = t.typeLabels[invoiceType]
  const supportUrl = `${window.location.origin}/support`

  // ── PDF download ───────────────────────────────────────────────────────────
  const handleDownload = async () => {
    setDownloading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')

      const C = {
        bg: '#ffffff',
        card: '#f7f7f7',
        border: '#e4e4e7',
        fg: '#09090b',
        muted: '#71717a',
        faintText: '#a1a1aa',
      }

      const ACCENT_PDF = {
        purchase: {
          bar: '#22c55e',
          bgPill: 'rgba(34,197,94,0.12)',
          borderPill: 'rgba(34,197,94,0.3)',
          lightAccentBg: '#f0fdf4',
        },
        device_upgrade: {
          bar: '#3b82f6',
          bgPill: 'rgba(59,130,246,0.12)',
          borderPill: 'rgba(59,130,246,0.3)',
          lightAccentBg: '#eff6ff',
        },
      }

      const ac = ACCENT_PDF[invoiceType]

      const rows: { label: string; value: string; bold?: boolean }[] = [
        { label: t.fields.invoiceNo, value: invoiceNumber },
        { label: t.fields.date, value: fmtDate(inv.date) },
      ]

      if (isPlan) {
        rows.push({ label: t.fields.plan, value: inv.item_name })
        if (expiresAt) rows.push({ label: t.fields.validUntil, value: fmtDate(expiresAt) })
        rows.push({
          label: t.fields.remainingBalance,
          value: fmtMoney(parseFloat(String(data.remaining_balance))),
        })
      } else {
        rows.push({ label: t.fields.item, value: inv.item_name })
        if (newLimit != null)
          rows.push({ label: t.fields.newLimit, value: String(newLimit), bold: true })
        rows.push({
          label: t.fields.remainingBalance,
          value: fmtMoney(parseFloat(String(data.remaining_balance))),
        })
      }

      const totalStr = fmtMoney(amount)

      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(supportUrl)}&format=png&color=000000&bgcolor=ffffff&margin=4&qzone=1`

      const rowsHtml = rows
        .map(
          (r) => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid ${C.border};">
          <span style="font-size:12px;color:${C.muted};font-weight:500">${r.label}</span>
          <span style="font-size:13px;color:${C.fg};font-weight:${r.bold ? '700' : '600'}">${r.value}</span>
        </div>`
        )
        .join('')

      const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:${C.bg};font-family:'DM Sans','Segoe UI',sans-serif;width:580px;-webkit-font-smoothing:antialiased}</style>
</head><body>
<div id="root" style="width:580px;background:${C.bg};padding-bottom:36px;">
  <div style="background:${ac.lightAccentBg};padding:26px 28px 24px;border-bottom:1px solid ${C.border};">
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
      <div style="width:22px;height:3px;border-radius:99px;background:${ac.bar};flex-shrink:0"></div>
      <p style="font-size:8px;text-transform:uppercase;letter-spacing:.2em;color:${ac.bar};font-weight:700;margin:0">${typeLabel}</p>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px">
      <h1 style="font-size:22px;font-weight:700;color:${C.fg};letter-spacing:-.02em;line-height:1;margin:0">${t.invoiceTitle}</h1>
      <div style="display:flex;align-items:center;gap:5px;padding:5px 12px;border-radius:99px;border:1px solid ${ac.borderPill};background:${ac.bgPill};white-space:nowrap;flex-shrink:0;">
        <div style="width:5px;height:5px;border-radius:50%;background:${ac.bar};flex-shrink:0;"></div>
        <div style="font-size:10px;font-weight:700;color:${ac.bar};line-height:1;">${t.status.paid}</div>
      </div>
    </div>
    <p style="font-size:10px;font-family:monospace;color:${C.muted};letter-spacing:.01em;margin-bottom:22px">${invoiceNumber}</p>
    <div style="height:1px;background:${C.border};margin-bottom:20px"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div>
        <p style="font-size:7px;text-transform:uppercase;letter-spacing:.18em;color:${C.faintText};font-weight:600;margin-bottom:8px">${t.sections.from}</p>
        <p style="font-size:13px;font-weight:600;color:${C.fg};margin-bottom:4px">${t.issuedBy}</p>
        <p style="font-size:11px;color:${C.muted}">${t.address}</p>
      </div>
      <div>
        <p style="font-size:7px;text-transform:uppercase;letter-spacing:.18em;color:${C.faintText};font-weight:600;margin-bottom:8px">${t.sections.to}</p>
        <p style="font-size:13px;font-weight:600;color:${C.fg};margin-bottom:4px">${billedTo ?? '—'}</p>
      </div>
    </div>
  </div>
  <div style="background:${C.card};margin:10px 10px 0;border-radius:14px;border:1px solid ${C.border};padding:16px 20px 6px;">
    <p style="font-size:7px;text-transform:uppercase;letter-spacing:.2em;color:${C.faintText};font-weight:600;margin-bottom:8px">${t.sections.details}</p>
    ${rowsHtml}
  </div>
  <div style="background:${C.card};margin:8px 10px 0;border-radius:14px;border:1px solid ${C.border};padding:22px 20px 24px;">
    <div style="display:flex;flex-direction:column;align-items:center;margin-bottom:18px">
      <div style="background:#fff;border-radius:12px;padding:8px;box-shadow:0 1px 8px rgba(0,0,0,.12)">
        <img src="${qrUrl}" width="100" height="100" style="display:block" crossorigin="anonymous"/>
      </div>
      <p style="font-size:10px;font-weight:600;color:${C.muted};margin-top:8px">${t.qrLabel}</p>
      <p style="font-size:9px;font-family:monospace;color:${C.faintText};margin-top:2px">${supportUrl}</p>
    </div>
    <div style="position:relative;margin-bottom:18px">
      <div style="border-top:1.5px dashed ${C.border}"></div>
      <div style="position:absolute;left:-14px;top:50%;transform:translateY(-50%);width:10px;height:10px;border-radius:50%;background:${C.bg};border:1px solid ${C.border}"></div>
      <div style="position:absolute;right:-14px;top:50%;transform:translateY(-50%);width:10px;height:10px;border-radius:50%;background:${C.bg};border:1px solid ${C.border}"></div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:flex-end">
      <div>
        <p style="font-size:7px;text-transform:uppercase;letter-spacing:.2em;color:${C.faintText};font-weight:700;margin-bottom:3px">${t.total}</p>
        <p style="font-size:9px;font-family:monospace;color:${C.faintText}">${invoiceNumber}</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:34px;font-weight:700;color:${ac.bar};letter-spacing:-.03em;line-height:1">${totalStr}</p>
        <p style="font-size:9px;font-family:monospace;color:${C.faintText};margin-top:4px">${t.status.paid}</p>
      </div>
    </div>
  </div>
</div>
</body></html>`

      const iframe = document.createElement('iframe')
      iframe.style.cssText =
        'position:fixed;top:-99999px;left:-99999px;width:580px;height:4000px;border:none;opacity:0;pointer-events:none'
      document.body.appendChild(iframe)

      await new Promise<void>((resolve) => {
        iframe.addEventListener('load', () => resolve(), { once: true })
        iframe.srcdoc = html
      })

      await new Promise((r) => setTimeout(r, 1800))

      const iDoc = iframe.contentDocument
      const target = iDoc?.getElementById('root') as HTMLElement | null
      if (!target || !iDoc) throw new Error('iframe root not found')

      const trueH =
        Math.max(target.scrollHeight, target.getBoundingClientRect().height) + 60
      iframe.style.height = `${trueH}px`
      await new Promise((r) => setTimeout(r, 80))

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        logging: false,
        width: target.scrollWidth,
        height: target.scrollHeight,
        windowWidth: 580,
        windowHeight: trueH,
      })

      document.body.removeChild(iframe)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height * pdfW) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
      pdf.save(`${invoiceNumber}.pdf`)
    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      className="min-h-screen bg-background text-foreground"
      style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}
    >
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border flex items-center gap-3 px-5 py-3">
        <button
          onClick={onBack ?? (() => navigate(-1))}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.back}
        </button>
        <div className="flex-1" />
        <div
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold leading-none ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
        >
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
          <span>{t.status.paid}</span>
        </div>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-form-highlights hover:bg-button-hover text-white transition-all disabled:opacity-60 disabled:cursor-wait active:scale-[0.97]"
        >
          {downloading ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              {t.downloading}
            </>
          ) : (
            <>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem', lineHeight: 1 }}>
                download
              </span>
              {t.download}
            </>
          )}
        </button>
      </div>

      {/* Invoice card */}
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-background rounded-3xl overflow-hidden">

          {/* Header */}
          <div className={`${accent.light} px-7 pt-5 pb-5 border-b border-border`}>
            <div className={`w-7 h-1 rounded-full ${accent.bar} mb-3.5`} />
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className={`text-[9px] uppercase tracking-[0.2em] font-bold mb-1 ${accent.text}`}>
                  {typeLabel}
                </p>
                <h1 className="text-xl font-bold text-foreground tracking-tight leading-tight">
                  {t.invoiceTitle}
                </h1>
                <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">
                  {invoiceNumber}
                </p>
              </div>
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold leading-none shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                <span>{t.status.paid}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mb-1.5">
                  {t.sections.from}
                </p>
                <p className="text-sm font-semibold text-foreground">{t.issuedBy}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.address}</p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mb-1.5">
                  {t.sections.to}
                </p>
                <p className="text-sm font-semibold text-foreground">
                 {billedTo ?? '—'}
                </p>
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-7 py-5 border-b border-border">
            <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mb-3">
              {t.sections.details}
            </p>
            <Row label={t.fields.invoiceNo} value={invoiceNumber} mono />
            <Row label={t.fields.date} value={fmtDate(inv.date)} />

            {isPlan ? (
              <>
                <Row label={t.fields.plan} value={inv.item_name} />
                {expiresAt && <Row label={t.fields.validUntil} value={fmtDate(expiresAt)} />}
                <Row
                  label={t.fields.remainingBalance}
                  value={fmtMoney(parseFloat(String(data.remaining_balance)))}
                  highlight
                />
              </>
            ) : (
              <>
                <Row label={t.fields.item} value={inv.item_name} />
                {newLimit != null && (
                  <Row label={t.fields.newLimit} value={String(newLimit)} highlight />
                )}
                <Row
                  label={t.fields.remainingBalance}
                  value={fmtMoney(parseFloat(String(data.remaining_balance)))}
                  highlight
                />
              </>
            )}
          </div>

          {/* QR + Total */}
          <div className="px-7 py-6">
            <div className="flex flex-col items-center mb-5">
              <QRCodeImage size={110} />
              <p className="text-xs font-medium text-foreground/70 mt-3">{t.qrLabel}</p>
              <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">{supportUrl}</p>
            </div>
            <div className="relative mb-5">
              <div className="border-t border-dashed border-border" />
              <div className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-background border border-border" />
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-background border border-border" />
            </div>
            <div className="flex items-end justify-between">
              <div>
                <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mb-1">
                  {t.total}
                </p>
                <p className="text-[10px] font-mono text-muted-foreground/40">{invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold tabular-nums tracking-tight ${accent.text}`}>
                  {fmtMoney(amount)}
                </p>
                <p className="text-[10px] text-muted-foreground/40 font-mono mt-1">
                  {t.status.paid}
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { Invoice } from '../../src/types/invoice'
import useUIStore from '../../src/store/ui-store'

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_INVOICES: Invoice[] = [
  {
    id: 'inv_001', invoiceNumber: 'INV-2026-00042', type: 'purchase', status: 'paid',
    amount: 30, currency: '₾', planName: 'Monthly Pro', planDurationDays: 30,
    expiresAt: '2026-04-22T00:00:00Z', customerName: 'Giorgi Beridze',
    customerEmail: 'giorgi@example.ge', customerId: '100042', createdAt: '2026-03-22T10:30:00Z',
  },
  {
    id: 'inv_002', invoiceNumber: 'INV-2026-00041', type: 'fill_balance', status: 'paid',
    amount: 50, currency: '₾', previousBalance: 5.20, newBalance: 55.20,
    customerName: 'Giorgi Beridze', customerEmail: 'giorgi@example.ge',
    customerId: '100042', createdAt: '2026-03-20T14:15:00Z',
  },
  {
    id: 'inv_003', invoiceNumber: 'INV-2026-00040', type: 'insufficient', status: 'failed',
    amount: 0, currency: '₾', currentBalance: 4.50, requiredAmount: 30,
    customerName: 'Giorgi Beridze', customerId: '100042', createdAt: '2026-03-18T09:00:00Z',
  },
  {
    id: 'inv_004', invoiceNumber: 'INV-2026-00039', type: 'warning', status: 'warning',
    amount: 30, currency: '₾', currentBalance: 12, requiredAmount: 30,
    renewalDate: '2026-03-25T00:00:00Z', daysUntilRenewal: 3, planName: 'Monthly Pro',
    customerName: 'Giorgi Beridze', customerId: '100042', createdAt: '2026-03-22T08:00:00Z',
  },
]

// ─── Translations ─────────────────────────────────────────────────────────────

const tx = {
  En: {
    back: 'Back', invoiceTitle: 'Invoice',
    status: { paid: 'Paid', pending: 'Pending', failed: 'Failed', warning: 'Action Required' },
    typeLabels: { purchase: 'Subscription Purchase', fill_balance: 'Balance Top-Up', insufficient: 'Insufficient Funds Notice', warning: 'Renewal Reminder' },
    sections: { from: 'Issued By', to: 'Billed To', details: 'Details' },
    fields: { invoiceNo: 'Invoice No.', date: 'Issue Date', plan: 'Plan', duration: 'Duration', validUntil: 'Valid Until', balance: 'Account Balance', prevBalance: 'Previous Balance', newBalance: 'New Balance', credited: 'Amount Credited', required: 'Required Amount', shortfall: 'Shortfall', renewalDate: 'Renewal Date', daysRemaining: 'Days Remaining' },
    total: 'Total', days: 'days', qrLabel: 'Scan for support', download: 'Download PDF', downloading: 'Generating…', topUp: 'Top Up Balance', backToPlans: 'View Plans', notFound: 'Invoice not found.', loading: 'Loading invoice…', issuedBy: 'YourApp LLC', address: 'Tbilisi, Georgia',
  },
  Ge: {
    back: 'უკან', invoiceTitle: 'ინვოისი',
    status: { paid: 'გადახდილი', pending: 'მოლოდინში', failed: 'შეცდომა', warning: 'საჭიროა მოქმედება' },
    typeLabels: { purchase: 'სააბონენტო შეძენა', fill_balance: 'ბალანსის შევსება', insufficient: 'არასაკმარისი ბალანსი', warning: 'განახლების შეხსენება' },
    sections: { from: 'გამცემი', to: 'გადამხდელი', details: 'დეტალები' },
    fields: { invoiceNo: 'ინვოისი #', date: 'თარიღი', plan: 'პაკეტი', duration: 'ხანგრძლივობა', validUntil: 'ვადა', balance: 'ბალანსი', prevBalance: 'წინა ბალანსი', newBalance: 'ახალი ბალანსი', credited: 'ჩარიცხული', required: 'საჭირო თანხა', shortfall: 'სხვაობა', renewalDate: 'განახლების თარიღი', daysRemaining: 'დღე დარჩა' },
    total: 'სულ', days: 'დღე', qrLabel: 'სკანირება მხარდაჭერისთვის', download: 'PDF ჩამოტვირთვა', downloading: 'მომზადება…', topUp: 'ბალანსის შევსება', backToPlans: 'პაკეტები', notFound: 'ინვოისი ვერ მოიძებნა.', loading: 'ინვოისი იტვირთება…', issuedBy: 'YourApp შპს', address: 'თბილისი, საქართველო',
  },
} as const

const STATUS_CFG = {
  paid:    { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/25', dot: 'bg-emerald-400' },
  pending: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/25',   dot: 'bg-amber-400'   },
  failed:  { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/25',     dot: 'bg-red-400'     },
  warning: { bg: 'bg-orange-500/10',  text: 'text-orange-400',  border: 'border-orange-500/25',  dot: 'bg-orange-400'  },
}
const TYPE_ACCENT = {
  purchase:     { bar: 'bg-emerald-500', text: 'text-emerald-400', light: 'bg-emerald-500/8' },
  fill_balance: { bar: 'bg-blue-500',    text: 'text-blue-400',    light: 'bg-blue-500/8'    },
  insufficient: { bar: 'bg-red-500',     text: 'text-red-400',     light: 'bg-red-500/8'     },
  warning:      { bar: 'bg-amber-500',   text: 'text-amber-400',   light: 'bg-amber-500/8'   },
}

function QRCodeImage({ size = 110 }: { size?: number }) {
  const supportUrl = `${window.location.origin}/support`
  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size * 2}x${size * 2}&data=${encodeURIComponent(supportUrl)}&format=png&color=000000&bgcolor=ffffff&margin=4&qzone=1`
  return (
    <div className="rounded-xl overflow-hidden bg-white p-2 shadow-sm">
      <img src={qrApiUrl} alt="QR" width={size} height={size} style={{ display: 'block', imageRendering: 'pixelated' }} />
    </div>
  )
}

function Row({ label, value, highlight, mono }: { label: string; value: string | number; highlight?: boolean; mono?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground font-medium">{label}</span>
      <span className={`text-sm font-semibold ${highlight ? 'text-foreground' : 'text-foreground/80'} ${mono ? 'font-mono' : ''}`}>{value}</span>
    </div>
  )
}

interface InvoicePageProps { invoice?: Invoice; onBack?: () => void }

export default function InvoicePage({ invoice: propInvoice, onBack }: InvoicePageProps) {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const language = useUIStore((state) => state.language)
  const [invoice, setInvoice] = useState<Invoice | null>(propInvoice ?? null)
  const [loading, setLoading] = useState(!propInvoice)
  const [downloading, setDownloading] = useState(false)
  const t = tx[language]

  useEffect(() => {
    if (propInvoice || !id) return
    setInvoice(MOCK_INVOICES.find(inv => inv.id === id) ?? null)
    setLoading(false)
  }, [id, propInvoice])

  // ── PDF: isolated iframe → html2canvas (no oklch from parent stylesheets) ──
  const handleDownload = async () => {
    if (!invoice) return
    setDownloading(true)
    try {
      const { default: html2canvas } = await import('html2canvas')
      const { jsPDF } = await import('jspdf')

      const isDark = document.documentElement.classList.contains('dark')
     const C = isDark
  ? { bg: '#ffffff',  card: '#f7f7f7', border: '#e4e4e7', fg: '#09090b', muted: '#71717a', faintText: '#a1a1aa' }
  : { bg: '#ffffff',  card: '#f7f7f7', border: '#e4e4e7', fg: '#09090b', muted: '#71717a', faintText: '#a1a1aa' }
const ACCENT = {
  purchase:     { bar: '#22c55e', text: '#22c55e', bgPill: 'rgba(34,197,94,0.12)',  borderPill: 'rgba(34,197,94,0.3)',  lightAccentBg: '#f0fdf4', darkAccentBg: '#0c1f12' },
  fill_balance: { bar: '#3b82f6', text: '#3b82f6', bgPill: 'rgba(59,130,246,0.12)', borderPill: 'rgba(59,130,246,0.3)', lightAccentBg: '#eff6ff', darkAccentBg: '#0f1929' },
  insufficient: { bar: '#ef4444', text: '#ef4444', bgPill: 'rgba(239,68,68,0.12)',  borderPill: 'rgba(239,68,68,0.3)',  lightAccentBg: '#fef2f2', darkAccentBg: '#1c0f0f' },
  warning:      { bar: '#f59e0b', text: '#f59e0b', bgPill: 'rgba(245,158,11,0.12)', borderPill: 'rgba(245,158,11,0.3)', lightAccentBg: '#fffbeb', darkAccentBg: '#1c1608' },
}
      
      const ac = ACCENT[invoice.type]

      const fmtD = (iso?: string) => iso ? new Date(iso).toLocaleDateString(language === 'En' ? 'en-US' : 'ka-GE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
      const fmtM = (n?: number) => n != null ? `${n.toFixed(2)} ${invoice.currency ?? '₾'}` : '—'

      const rows: { label: string; value: string; bold?: boolean }[] = [
        { label: t.fields.invoiceNo, value: invoice.invoiceNumber },
        { label: t.fields.date,      value: fmtD(invoice.createdAt) },
      ]
      if (invoice.type === 'purchase') {
        rows.push({ label: t.fields.plan, value: invoice.planName ?? '—' })
        rows.push({ label: t.fields.duration, value: `${invoice.planDurationDays ?? '—'} ${t.days}` })
        if (invoice.expiresAt) rows.push({ label: t.fields.validUntil, value: fmtD(invoice.expiresAt) })
      }
      if (invoice.type === 'fill_balance') {
        if (invoice.previousBalance != null) rows.push({ label: t.fields.prevBalance, value: fmtM(invoice.previousBalance) })
        if (invoice.newBalance      != null) rows.push({ label: t.fields.newBalance,  value: fmtM(invoice.newBalance), bold: true })
        rows.push({ label: t.fields.credited, value: fmtM(invoice.amount), bold: true })
      }
      if (invoice.type === 'insufficient') {
        rows.push({ label: t.fields.balance,   value: fmtM(invoice.currentBalance) })
        rows.push({ label: t.fields.required,  value: fmtM(invoice.requiredAmount) })
        rows.push({ label: t.fields.shortfall, value: fmtM((invoice.requiredAmount ?? 0) - (invoice.currentBalance ?? 0)), bold: true })
      }
      if (invoice.type === 'warning') {
        if (invoice.renewalDate)              rows.push({ label: t.fields.renewalDate,   value: fmtD(invoice.renewalDate) })
        if (invoice.daysUntilRenewal != null) rows.push({ label: t.fields.daysRemaining, value: `${invoice.daysUntilRenewal} ${t.days}` })
        rows.push({ label: t.fields.required, value: fmtM(invoice.requiredAmount) })
        rows.push({ label: t.fields.balance,  value: fmtM(invoice.currentBalance), bold: true })
      }
      const totalStr = (invoice.type === 'insufficient' || invoice.type === 'warning') ? fmtM(invoice.requiredAmount) : fmtM(invoice.amount)

      const supportUrl = `${window.location.origin}/support`
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(supportUrl)}&format=png&color=000000&bgcolor=ffffff&margin=4&qzone=1`

      const rowsHtml = rows.map(r => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid ${C.border};">
          <span style="font-size:12px;color:${C.muted};font-weight:500">${r.label}</span>
          <span style="font-size:13px;color:${C.fg};font-weight:${r.bold ? '700' : '600'}">${r.value}</span>
        </div>`).join('')

      // ── Build fully isolated HTML document ──────────────────────────────────
      // No external stylesheets except Google Fonts loaded inside the iframe.
      // Width is fixed at 580px — we resize iframe height after render.
const html = `<!DOCTYPE html><html><head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:${C.bg};font-family:'DM Sans','Segoe UI',sans-serif;width:580px;-webkit-font-smoothing:antialiased}</style>
</head><body>
<div id="root" style="width:580px;background:${C.bg};padding-bottom:36px;">

  <!-- HEADER -->
  <div style="background:${isDark ? ac.darkAccentBg : ac.lightAccentBg};padding:26px 28px 24px;border-bottom:1px solid ${C.border};">

    <!-- accent bar + type label on one line -->
    <div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">
      <div style="width:22px;height:3px;border-radius:99px;background:${ac.bar};flex-shrink:0"></div>
      <p style="font-size:8px;text-transform:uppercase;letter-spacing:.2em;color:${ac.bar};font-weight:700;opacity:.9;margin:0">${t.typeLabels[invoice.type]}</p>
    </div>

    <!-- title + pill -->
    <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:6px">
      <h1 style="font-size:22px;font-weight:700;color:${isDark ? '#fff' : C.fg};letter-spacing:-.02em;line-height:1;margin:0">${t.invoiceTitle}</h1>
<div style="
  display:flex;
  align-items:center;
  gap:5px;
  padding:5px 12px;
  border-radius:99px;
  border:1px solid ${ac.borderPill};
  background:${ac.bgPill};
  white-space:nowrap;
  flex-shrink:0;
">
  <div style="
    width:5px;
    height:5px;
    min-width:5px;
    border-radius:50%;
    background:${ac.bar};
    flex-shrink:0;
  "></div>

  <div style="
    font-size:10px;
    font-weight:700;
    color:${ac.bar};
    line-height:1;
    transform: translateY(-7.5px);
  ">
    ${t.status[invoice.status]}
  </div>
</div>
    </div>

    <!-- invoice number -->
    <p style="font-size:10px;font-family:monospace;color:${isDark ? 'rgba(255,255,255,.4)' : C.muted};letter-spacing:.01em;margin-bottom:22px">${invoice.invoiceNumber}</p>

    <!-- divider -->
    <div style="height:1px;background:${isDark ? 'rgba(255,255,255,.07)' : C.border};margin-bottom:20px"></div>

    <!-- FROM / TO -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
      <div>
        <p style="font-size:7px;text-transform:uppercase;letter-spacing:.18em;color:${isDark ? 'rgba(255,255,255,.3)' : C.faintText};font-weight:600;margin-bottom:8px">${t.sections.from}</p>
        <p style="font-size:13px;font-weight:600;color:${isDark ? 'rgba(255,255,255,.9)' : C.fg};margin-bottom:4px">${t.issuedBy}</p>
        <p style="font-size:11px;color:${isDark ? 'rgba(255,255,255,.45)' : C.muted}">${t.address}</p>
      </div>
      <div>
        <p style="font-size:7px;text-transform:uppercase;letter-spacing:.18em;color:${isDark ? 'rgba(255,255,255,.3)' : C.faintText};font-weight:600;margin-bottom:8px">${t.sections.to}</p>
        <p style="font-size:13px;font-weight:600;color:${isDark ? 'rgba(255,255,255,.9)' : C.fg};margin-bottom:4px">${invoice.customerName ?? '—'}</p>
        ${invoice.customerEmail ? `<p style="font-size:11px;color:${isDark ? 'rgba(255,255,255,.45)' : C.muted};margin-bottom:3px">${invoice.customerEmail}</p>` : ''}
        ${invoice.customerId    ? `<p style="font-size:10px;font-family:monospace;color:${isDark ? 'rgba(255,255,255,.3)' : C.faintText}">ID: ${invoice.customerId}</p>` : ''}
      </div>
    </div>
  </div>

  <!-- DETAILS -->
  <div style="background:${C.card};margin:10px 10px 0;border-radius:14px;border:1px solid ${C.border};padding:16px 20px 6px;">
    <p style="font-size:7px;text-transform:uppercase;letter-spacing:.2em;color:${C.faintText};font-weight:600;margin-bottom:8px">${t.sections.details}</p>
    ${rowsHtml}
  </div>

  <!-- QR + TOTAL -->
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
        <p style="font-size:9px;font-family:monospace;color:${C.faintText}">${invoice.invoiceNumber}</p>
      </div>
      <div style="text-align:right">
        <p style="font-size:34px;font-weight:700;color:${ac.bar};letter-spacing:-.03em;line-height:1">${totalStr}</p>
        <p style="font-size:9px;font-family:monospace;color:${C.faintText};margin-top:4px">${t.status[invoice.status]}</p>
      </div>
    </div>
  </div>

</div>
</body></html>`

      // ── Iframe: exact 580px wide, tall enough, then measure + capture ────────
      const iframe = document.createElement('iframe')
      iframe.style.cssText = 'position:fixed;top:-99999px;left:-99999px;width:580px;height:4000px;border:none;opacity:0;pointer-events:none'
      document.body.appendChild(iframe)

      await new Promise<void>(resolve => {
        iframe.addEventListener('load', () => resolve(), { once: true })
        iframe.srcdoc = html
      })

      // Let Google Fonts + QR image fully load
      await new Promise(r => setTimeout(r, 1800))

      const iDoc = iframe.contentDocument
      const target = iDoc?.getElementById('root') as HTMLElement | null
      if (!target || !iDoc) throw new Error('iframe root not found')

      // Measure true rendered height, resize iframe so nothing is clipped
      const trueH = Math.max(target.scrollHeight, target.getBoundingClientRect().height) + 60
      iframe.style.height = `${trueH}px`
      await new Promise(r => setTimeout(r, 80))

      const canvas = await html2canvas(target, {
        scale: 2,
        useCORS: true,
        allowTaint: false,
        backgroundColor: C.bg,
        logging: false,
        // Match exactly the rendered element — no clipping
        width:        target.scrollWidth,
        height:       target.scrollHeight,
        windowWidth:  580,
        windowHeight: trueH,
      })

      document.body.removeChild(iframe)

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = pdf.internal.pageSize.getWidth()
      const pdfH = (canvas.height * pdfW) / canvas.width
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH)
      pdf.save(`${invoice.invoiceNumber}.pdf`)

    } catch (err) {
      console.error('PDF generation failed:', err)
    } finally {
      setDownloading(false)
    }
  }

  const fmtDate = (iso?: string) =>
    iso ? new Date(iso).toLocaleDateString(language === 'En' ? 'en-US' : 'ka-GE', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'
  const fmtMoney = (n?: number) =>
    n != null ? `${n.toFixed(2)} ${invoice?.currency ?? '₾'}` : '—'

  if (loading) return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background text-foreground">
      <div className="w-5 h-5 rounded-full border-2 border-form-highlights border-t-transparent animate-spin" />
      <span className="ml-3 text-sm text-muted-foreground">{t.loading}</span>
    </div>
  )

  if (!invoice) return (
    <div className="flex min-h-[60vh] items-center justify-center bg-background text-foreground">
      <div className="text-center">
        <p className="text-4xl mb-4 text-muted-foreground/30">⊘</p>
        <p className="text-muted-foreground text-sm">{t.notFound}</p>
        <button onClick={() => navigate(-1)} className="mt-5 text-sm text-form-highlights hover:underline">{t.back}</button>
      </div>
    </div>
  )

  const statusCfg = STATUS_CFG[invoice.status]
  const accent = TYPE_ACCENT[invoice.type]
  const typeLabel = t.typeLabels[invoice.type]
  const supportUrl = `${window.location.origin}/support`

  return (
    <div className="min-h-screen bg-background text-foreground" style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border flex items-center gap-3 px-5 py-3">
        <button onClick={onBack ?? (() => navigate(-1))} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          {t.back}
        </button>
        <div className="flex-1" />
        {/* Status pill — items-center + leading-none prevent vertical drift */}
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold leading-none ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
          <span>{t.status[invoice.status]}</span>
        </div>
        <button
          onClick={handleDownload} disabled={downloading}
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-form-highlights hover:bg-button-hover text-white transition-all disabled:opacity-60 disabled:cursor-wait active:scale-[0.97]"
        >
          {downloading ? (
            <><span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />{t.downloading}</>
          ) : (
            <><span className="material-symbols-outlined" style={{ fontSize: '1rem', lineHeight: 1 }}>download</span>{t.download}</>
          )}
        </button>
      </div>

      {/* ── Invoice ── */}
      <div className="max-w-lg mx-auto px-4 py-10">
        <div className="bg-background rounded-3xl overflow-hidden">

          {/* Header — compact */}
          <div className={`${accent.light} px-7 pt-5 pb-5 border-b border-border`}>
            <div className={`w-7 h-1 rounded-full ${accent.bar} mb-3.5`} />
            <div className="flex items-center justify-between gap-4 mb-5">
              <div>
                <p className={`text-[9px] uppercase tracking-[0.2em] font-bold mb-1 ${accent.text}`}>{typeLabel}</p>
                <h1 className="text-xl font-bold text-foreground tracking-tight leading-tight">{t.invoiceTitle}</h1>
                <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{invoice.invoiceNumber}</p>
              </div>
              {/* items-center keeps dot perfectly centred with text */}
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[10px] font-semibold leading-none shrink-0 ${statusCfg.bg} ${statusCfg.text} ${statusCfg.border}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusCfg.dot}`} />
                <span>{t.status[invoice.status]}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5">
              <div>
                <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mb-1.5">{t.sections.from}</p>
                <p className="text-sm font-semibold text-foreground">{t.issuedBy}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.address}</p>
              </div>
              <div>
                <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mb-1.5">{t.sections.to}</p>
                <p className="text-sm font-semibold text-foreground">{invoice.customerName ?? '—'}</p>
                {invoice.customerEmail && <p className="text-xs text-muted-foreground mt-0.5 truncate">{invoice.customerEmail}</p>}
                {invoice.customerId    && <p className="text-xs font-mono text-muted-foreground/50 mt-0.5">ID: {invoice.customerId}</p>}
              </div>
            </div>
          </div>

          {/* Details */}
          <div className="px-7 py-5 border-b border-border">
            <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mb-3">{t.sections.details}</p>
            <Row label={t.fields.invoiceNo} value={invoice.invoiceNumber} mono />
            <Row label={t.fields.date} value={fmtDate(invoice.createdAt)} />
            {invoice.type === 'purchase' && <><Row label={t.fields.plan} value={invoice.planName ?? '—'} /><Row label={t.fields.duration} value={`${invoice.planDurationDays ?? '—'} ${t.days}`} />{invoice.expiresAt && <Row label={t.fields.validUntil} value={fmtDate(invoice.expiresAt)} />}</>}
            {invoice.type === 'fill_balance' && <>{invoice.previousBalance != null && <Row label={t.fields.prevBalance} value={fmtMoney(invoice.previousBalance)} />}{invoice.newBalance != null && <Row label={t.fields.newBalance} value={fmtMoney(invoice.newBalance)} highlight />}<Row label={t.fields.credited} value={fmtMoney(invoice.amount)} highlight /></>}
            {invoice.type === 'insufficient' && <><Row label={t.fields.balance} value={fmtMoney(invoice.currentBalance)} /><Row label={t.fields.required} value={fmtMoney(invoice.requiredAmount)} /><Row label={t.fields.shortfall} value={fmtMoney((invoice.requiredAmount ?? 0) - (invoice.currentBalance ?? 0))} highlight /></>}
            {invoice.type === 'warning' && <>{invoice.renewalDate && <Row label={t.fields.renewalDate} value={fmtDate(invoice.renewalDate)} />}{invoice.daysUntilRenewal != null && <Row label={t.fields.daysRemaining} value={`${invoice.daysUntilRenewal} ${t.days}`} />}<Row label={t.fields.required} value={fmtMoney(invoice.requiredAmount)} /><Row label={t.fields.balance} value={fmtMoney(invoice.currentBalance)} highlight /></>}
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
                <p className="text-[8px] uppercase tracking-[0.18em] text-muted-foreground/50 font-semibold mb-1">{t.total}</p>
                <p className="text-[10px] font-mono text-muted-foreground/40">{invoice.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className={`text-4xl font-bold tabular-nums tracking-tight ${accent.text}`}>
                  {(invoice.type === 'insufficient' || invoice.type === 'warning') ? fmtMoney(invoice.requiredAmount) : fmtMoney(invoice.amount)}
                </p>
                <p className="text-[10px] text-muted-foreground/40 font-mono mt-1">{t.status[invoice.status]}</p>
              </div>
            </div>
          </div>

        </div>

        {(invoice.type === 'insufficient' || invoice.type === 'warning') && (
          <div className="flex gap-3 mt-4">
            <button onClick={() => navigate('/packets')} className="flex-1 py-3 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:bg-profile-sidebar-bg transition-all">{t.backToPlans}</button>
            <button onClick={() => navigate('/profile')} className="flex-1 py-3 rounded-xl text-sm font-semibold bg-form-highlights hover:bg-button-hover text-white transition-all shadow-[0_2px_16px_rgba(192,17,17,0.3)]">{t.topUp}</button>
          </div>
        )}
      </div>
    </div>
  )
}
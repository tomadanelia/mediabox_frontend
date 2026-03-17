import { useState, useRef, useEffect } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FormField = 'name' | 'email' | 'topic' | 'message'

interface FormState {
  name: string
  email: string
  topic: string
  message: string
}

interface InfoCardProps {
  icon: string
  label: string
  value: string
}

interface TopicDropdownProps {
  value: string
  onChange: (topic: string) => void
  topics: string[]
  isFocused: boolean
  onFocus: () => void
  onBlur: () => void
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TOPICS: string[] = [
  'Billing & Subscription',
  'Technical Issue',
  'Content Request',
  'Account Help',
  'Partnership',
  'Other',
]

// ─── Icon ─────────────────────────────────────────────────────────────────────

function Icon({ name, size = 18, style = {} }: {
  name: string
  size?: number
  style?: React.CSSProperties
}) {
  return (
    <span
      className="material-symbols-outlined select-none leading-none"
      style={{ fontSize: size, lineHeight: 1, display: 'block', ...style }}
    >
      {name}
    </span>
  )
}

// ─── InfoCard ─────────────────────────────────────────────────────────────────

function InfoCard({ icon, label, value }: InfoCardProps) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-2xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md">
      <div
        className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
        style={{ backgroundColor: 'rgba(213,43,30,0.10)' }}
      >
        <Icon name={icon} size={15} style={{ color: '#d52b1e' }} />
      </div>
      <div className="flex flex-col gap-0.5 min-w-0">
        <span className="text-[10px] uppercase tracking-widest text-black/30 dark:text-white/25 font-medium">
          {label}
        </span>
        <span className="text-sm font-medium text-black/70 dark:text-white/65 truncate">{value}</span>
      </div>
    </div>
  )
}

// ─── TopicDropdown ────────────────────────────────────────────────────────────

function TopicDropdown({ value, onChange, topics, isFocused, onFocus, onBlur }: TopicDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        onBlur()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onBlur])

  const handleSelect = (topic: string) => {
    onChange(topic)
    setOpen(false)
    onBlur()
  }

  const triggerClass = [
    'w-full bg-white/60 dark:bg-white/4 backdrop-blur-md border rounded-2xl px-4 py-3',
    'text-sm outline-none transition-all duration-200 flex items-center justify-between cursor-pointer select-none',
    isFocused || open
      ? 'border-[rgba(213,43,30,0.45)] shadow-[0_0_0_3px_rgba(213,43,30,0.09)]'
      : 'border-black/8 dark:border-white/8 hover:border-black/14 dark:hover:border-white/14',
  ].join(' ')

  return (
    <div ref={ref} className="relative">
      <div
        className={triggerClass}
        onClick={() => { setOpen((v) => !v); onFocus() }}
      >
        <span className={value ? 'text-black/80 dark:text-white/75' : 'text-black/25 dark:text-white/20'}>
          {value || 'Select a topic…'}
        </span>
        <Icon
          name="keyboard_arrow_down"
          size={18}
          style={{
            color: 'rgba(0,0,0,0.25)',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </div>

      {open && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-black/8 dark:border-white/8 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xl shadow-xl overflow-hidden">
          <div className="p-1.5 flex flex-col gap-0.5">
            {topics.map((t) => {
              const selected = value === t
              return (
                <div
                  key={t}
                  onClick={() => handleSelect(t)}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-100"
                  style={selected ? { backgroundColor: 'rgba(213,43,30,0.08)' } : {}}
                  onMouseEnter={(e) => {
                    if (!selected) (e.currentTarget as HTMLDivElement).style.backgroundColor = 'rgba(0,0,0,0.04)'
                  }}
                  onMouseLeave={(e) => {
                    if (!selected) (e.currentTarget as HTMLDivElement).style.backgroundColor = ''
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: selected ? '#d52b1e' : 'rgba(0,0,0,0.70)' }}
                  >
                    {t}
                  </span>
                  {selected && <Icon name="check" size={16} style={{ color: '#d52b1e' }} />}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function SupportPage() {
  const [form, setForm]     = useState<FormState>({ name: '', email: '', topic: '', message: '' })
  const [focused, setFocus] = useState<FormField | null>(null)
  const [sent, setSent]     = useState<boolean>(false)

  const set = (k: FormField) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [k]: e.target.value }))

  const fieldClass = (field: FormField): string =>
    [
      'w-full bg-white/60 dark:bg-white/4 backdrop-blur-md border rounded-2xl px-4 py-3',
      'text-sm text-black/80 dark:text-white/75 placeholder:text-black/25 dark:placeholder:text-white/20',
      'outline-none transition-all duration-200',
      focused === field
        ? 'border-[rgba(213,43,30,0.45)] shadow-[0_0_0_3px_rgba(213,43,30,0.09)]'
        : 'border-black/8 dark:border-white/8 hover:border-black/14 dark:hover:border-white/14',
    ].join(' ')

  const handleSubmit = () => {
    if (form.name && form.email && form.message) setSent(true)
  }

  /* ── Success state ── */
  if (sent) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-5 text-center px-6">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'rgba(213,43,30,0.10)' }}
        >
          <Icon name="check_circle" size={28} style={{ color: '#d52b1e' }} />
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-black/80 dark:text-white/80">Message sent</p>
          <p className="text-sm text-black/40 dark:text-white/35 max-w-[260px]">
            We'll get back to you within 24 hours.
          </p>
        </div>
        <button
          onClick={() => { setSent(false); setForm({ name: '', email: '', topic: '', message: '' }) }}
          className="text-[11px] font-semibold uppercase tracking-widest transition-opacity hover:opacity-70"
          style={{ color: '#d52b1e' }}
        >
          Send another
        </button>
      </div>
    )
  }

  /* ── Main ── */
  return (
    <div className="flex w-full h-full overflow-hidden">

      {/* ── Sidebar ── */}
      <div className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 h-full p-3 gap-3 overflow-hidden">

        {/* Brand card */}
        <div className="rounded-2xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(213,43,30,0.10)' }}
            >
              <Icon name="chat_bubble" size={14} style={{ color: '#d52b1e' }} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-black/40 dark:text-white/35">
              Support
            </span>
          </div>
          <p className="text-[15px] font-semibold text-black/80 dark:text-white/80 leading-snug">
            How can we help you today?
          </p>
          <p className="text-xs text-black/40 dark:text-white/30 leading-relaxed">
            Our team reads every message and responds within one business day.
          </p>
        </div>

        <InfoCard icon="schedule" label="Response time" value="Under 24 hours" />
        <InfoCard icon="mail"     label="Email"         value="support@television.co" />

        {/* Topic list */}
        <div className="rounded-2xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-4">
          <p className="text-[10px] uppercase tracking-widest font-medium text-black/30 dark:text-white/25 mb-3">
            Topics
          </p>
          <div className="flex flex-col divide-y divide-black/5 dark:divide-white/5">
            {TOPICS.map((t) => (
              <div key={t} className="flex items-center justify-between py-2">
                <span className="text-xs text-black/50 dark:text-white/40">{t}</span>
                <span
                  className="w-1 h-1 rounded-full shrink-0"
                  style={{ backgroundColor: 'rgba(213,43,30,0.35)' }}
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex flex-col h-full p-3 gap-3 overflow-y-auto">

        {/* Mobile top bar */}
        <div className="lg:hidden flex items-center gap-3 p-4 rounded-2xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(213,43,30,0.10)' }}
          >
            <Icon name="chat_bubble" size={16} style={{ color: '#d52b1e' }} />
          </div>
          <div>
            <p className="text-sm font-semibold text-black/80 dark:text-white/80">Contact Support</p>
            <p className="text-[10px] text-black/35 dark:text-white/30">Response within 24 hours</p>
          </div>
        </div>

        {/* Name + Email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {(
            [
              { k: 'name'  as FormField, label: 'Full name',     type: 'text',  ph: 'Your name'       },
              { k: 'email' as FormField, label: 'Email address', type: 'email', ph: 'you@example.com' },
            ] as const
          ).map(({ k, label, type, ph }) => (
            <div key={k} className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-widest font-medium text-black/30 dark:text-white/25 px-1">
                {label}
              </label>
              <input
                required
                type={type}
                value={form[k]}
                onChange={set(k)}
                onFocus={() => setFocus(k)}
                onBlur={() => setFocus(null)}
                placeholder={ph}
                className={fieldClass(k)}
              />
            </div>
          ))}
        </div>

        {/* Topic dropdown */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-widest font-medium text-black/30 dark:text-white/25 px-1">
            Topic
          </label>
          <TopicDropdown
            value={form.topic}
            onChange={(t) => setForm((p) => ({ ...p, topic: t }))}
            topics={TOPICS}
            isFocused={focused === 'topic'}
            onFocus={() => setFocus('topic')}
            onBlur={() => setFocus(null)}
          />
        </div>

        {/* Message */}
        <div className="flex flex-col gap-1.5 flex-1">
          <label className="text-[10px] uppercase tracking-widest font-medium text-black/30 dark:text-white/25 px-1">
            Message
          </label>
          <textarea
            required
            rows={6}
            value={form.message}
            onChange={set('message')}
            onFocus={() => setFocus('message')}
            onBlur={() => setFocus(null)}
            placeholder="Describe your issue or question…"
            className={fieldClass('message') + ' resize-none flex-1'}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between gap-4">
          <p className="hidden sm:block text-[10px] text-black/25 dark:text-white/20 leading-relaxed max-w-xs">
            By submitting you agree to our privacy policy.
          </p>
          <button
            onClick={handleSubmit}
            className="flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95 shrink-0 ml-auto"
            style={{ backgroundColor: '#d52b1e', boxShadow: '0 4px 16px rgba(213,43,30,0.28)' }}
          >
            <Icon name="send" size={16} style={{ color: 'white' }} />
            Send message
          </button>
        </div>
      </div>
    </div>
  )
}
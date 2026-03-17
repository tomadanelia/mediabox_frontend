import { useState, useMemo } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type FilterTag = 'All' | 'Engineering'

interface TeamMember {
  id: number
  name: string
  role: string
  tag: Exclude<FilterTag, 'All'>
  bio: string
  detail: string
  initials: string
}

interface StatItem {
  icon: string   // material symbol name
  label: string
  value: string
}

interface AvatarProps {
  initials: string
  active: boolean
}

interface TagBadgeProps {
  tag: string
}

interface MemberCardProps {
  member: TeamMember
  isHovered: boolean
  onHover: () => void
  onLeave: () => void
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const TEAM: TeamMember[] = [
  {
    id: 1,
    name: 'Anzor Datunashvili',
    role: 'Frontend Developer',
    tag: 'Engineering',
    bio: 'Builds the interfaces you interact with. Specialises in React and modern frontend architecture, turning designs into fast, polished user experiences.',
    detail: 'React · TypeScript',
    initials: 'AD',
  },
  {
    id: 2,
    name: 'Toma Danelia',
    role: 'Full-Stack Engineer',
    tag: 'Engineering',
    bio: 'Comfortable on both sides of the stack. Drives backend systems while contributing across the frontend — keeps everything running smoothly end-to-end.',
    detail: 'Full-Stack · Telecom',
    initials: 'TD',
  },
  {
    id: 3,
    name: 'Sandro Muradashvili',
    role: 'Application Developer',
    tag: 'Engineering',
    bio: 'Native mobile specialist building the Android experience. Works in Kotlin to deliver a smooth, reliable app for viewers on every device.',
    detail: 'Kotlin · Android',
    initials: 'SM',
  },
]

const FILTERS: FilterTag[] = ['All', 'Engineering']

const STATS: StatItem[] = [
  { icon: 'tv',         label: 'Platform',  value: 'Telecom' },
  { icon: 'group',      label: 'Team',      value: '3'       },
  { icon: 'code',       label: 'Stack',     value: 'React · Kotlin' },
  { icon: 'visibility', label: 'Viewers',   value: '2M+'     },
]

// ─── Icon ─────────────────────────────────────────────────────────────────────

function Icon({ name, size = 18, style = {} }: {
  name: string
  size?: number
  style?: React.CSSProperties
}) {
  return (
    <span
      className="material-symbols-outlined select-none"
      style={{ fontSize: size, lineHeight: 1, display: 'block', ...style }}
    >
      {name}
    </span>
  )
}

// ─── Avatar ───────────────────────────────────────────────────────────────────

function Avatar({ initials, active }: AvatarProps) {
  return (
    <div
      className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 text-sm font-bold transition-all duration-200 border"
      style={
        active
          ? { backgroundColor: 'rgba(213,43,30,0.12)', borderColor: 'rgba(213,43,30,0.35)', color: '#d52b1e' }
          : { backgroundColor: 'rgba(0,0,0,0.04)', borderColor: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.35)' }
      }
    >
      {initials}
    </div>
  )
}

// ─── TagBadge ─────────────────────────────────────────────────────────────────

function TagBadge({ tag }: TagBadgeProps) {
  const isFounder = tag === 'Founder'
  return (
    <span
      className="text-[9px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-widest"
      style={
        isFounder
          ? { backgroundColor: 'rgba(213,43,30,0.10)', color: '#d52b1e' }
          : { backgroundColor: 'rgba(0,0,0,0.05)', color: 'rgba(0,0,0,0.40)' }
      }
    >
      {tag}
    </span>
  )
}

// ─── MemberCard ───────────────────────────────────────────────────────────────

function MemberCard({ member, isHovered, onHover, onLeave }: MemberCardProps) {
  return (
    <div
      className="flex flex-col gap-3.5 p-4 rounded-2xl border transition-all duration-200 cursor-default"
      style={
        isHovered
          ? {
              backgroundColor: 'rgba(213,43,30,0.05)',
              borderColor: 'rgba(213,43,30,0.25)',
              boxShadow: '0 0 0 3px rgba(213,43,30,0.07)',
            }
          : {
              backgroundColor: 'rgba(255,255,255,0.50)',
              borderColor: 'rgba(0,0,0,0.08)',
            }
      }
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div className="flex items-start justify-between gap-3">
        <Avatar initials={member.initials} active={isHovered} />
        <TagBadge tag={member.tag} />
      </div>

      <div className="flex flex-col gap-0.5">
        <span className="text-sm font-semibold text-black/80 dark:text-white/80">{member.name}</span>
        <span className="text-[11px] text-black/40 dark:text-white/35 uppercase tracking-widest">{member.role}</span>
      </div>

      <p className="text-xs text-black/50 dark:text-white/40 leading-relaxed">{member.bio}</p>

      <div className="flex items-center justify-between pt-1 mt-auto border-t border-black/5 dark:border-white/5">
        <span className="text-[10px] text-black/30 dark:text-white/25">{member.detail}</span>
        <span
          className="w-3 h-px rounded-full transition-all duration-300"
          style={{ backgroundColor: isHovered ? '#d52b1e' : 'rgba(0,0,0,0.15)' }}
        />
      </div>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

export default function MeetUsPage() {
  const [filter,    setFilter]    = useState<FilterTag>('All')
  const [hoveredId, setHoveredId] = useState<number | null>(null)

  const filtered = useMemo<TeamMember[]>(
    () => filter === 'All' ? TEAM : TEAM.filter((m) => m.tag === filter),
    [filter]
  )

  return (
    <div className="flex w-full h-full overflow-hidden">

      {/* ── Left sidebar ── */}
      <div className="hidden lg:flex flex-col w-64 xl:w-72 shrink-0 h-full p-3 gap-3 overflow-hidden">

        {/* Header card */}
        <div className="rounded-2xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-5 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'rgba(213,43,30,0.10)' }}
            >
              <Icon name="group" size={14} style={{ color: '#d52b1e' }} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest text-black/40 dark:text-white/35">
              The Team
            </span>
          </div>
          <p className="text-[15px] font-semibold text-black/80 dark:text-white/80 leading-snug">
            The people behind Television Co.
          </p>
          <p className="text-xs text-black/40 dark:text-white/30 leading-relaxed">
            Three engineers building the platform from the ground up.
          </p>
        </div>

        {/* Stats */}
        <div className="rounded-2xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-4">
          <p className="text-[10px] uppercase tracking-widest font-medium text-black/30 dark:text-white/25 mb-3">
            At a glance
          </p>
          <div className="flex flex-col gap-3">
            {STATS.map(({ icon, label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon name={icon} size={13} style={{ color: 'rgba(0,0,0,0.25)' }} />
                  <span className="text-xs text-black/50 dark:text-white/40">{label}</span>
                </div>
                <span className="text-xs font-semibold tabular-nums" style={{ color: '#d52b1e' }}>
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="rounded-2xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-4">
          <p className="text-[10px] uppercase tracking-widest font-medium text-black/30 dark:text-white/25 mb-3">
            Filter by role
          </p>
          <div className="flex flex-col gap-1">
            {FILTERS.map((f) => {
              const active = filter === f
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150"
                  style={active ? { background: 'rgba(213,43,30,0.08)' } : {}}
                >
                  <span
                    className="text-xs font-medium"
                    style={{ color: active ? '#d52b1e' : 'rgba(0,0,0,0.50)' }}
                  >
                    {f}
                  </span>
                  {active && (
                    <Icon name="fiber_manual_record" size={8} style={{ color: '#d52b1e' }} />
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Careers nudge */}
        <div className="rounded-2xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md p-4 mt-auto">
          <p className="text-xs font-semibold text-black/70 dark:text-white/65 mb-1">Want to join us?</p>
          <p className="text-[11px] text-black/40 dark:text-white/30 mb-3 leading-relaxed">
            We're always looking for sharp, curious people.
          </p>
          <button
            className="w-full py-2 rounded-xl text-xs font-semibold text-white transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{ backgroundColor: '#d52b1e' }}
          >
            View Open Roles
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col h-full p-3 gap-3 overflow-hidden">

        {/* Mobile header + filters */}
        <div className="lg:hidden flex flex-col gap-2">
          <div className="flex items-center gap-3 p-4 rounded-2xl border border-black/8 dark:border-white/8 bg-white/50 dark:bg-white/3 backdrop-blur-md">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: 'rgba(213,43,30,0.10)' }}
            >
              <Icon name="group" size={16} style={{ color: '#d52b1e' }} />
            </div>
            <div>
              <p className="text-sm font-semibold text-black/80 dark:text-white/80">Meet the Team</p>
              <p className="text-[10px] text-black/35 dark:text-white/30">3 engineers · Telecom</p>
            </div>
          </div>

          <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {FILTERS.map((f) => {
              const active = filter === f
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className="shrink-0 px-3 py-1.5 rounded-xl text-[11px] font-semibold border transition-all duration-150"
                  style={
                    active
                      ? { backgroundColor: 'rgba(213,43,30,0.10)', borderColor: 'rgba(213,43,30,0.30)', color: '#d52b1e' }
                      : { backgroundColor: 'rgba(255,255,255,0.5)', borderColor: 'rgba(0,0,0,0.08)', color: 'rgba(0,0,0,0.45)' }
                  }
                >
                  {f}
                </button>
              )
            })}
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto min-h-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 pb-3">
            {filtered.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isHovered={hoveredId === member.id}
                onHover={() => setHoveredId(member.id)}
                onLeave={() => setHoveredId(null)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
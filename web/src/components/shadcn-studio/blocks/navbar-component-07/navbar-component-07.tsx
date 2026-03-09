import { useState, useEffect, useRef } from "react"
import { Link, NavLink } from "react-router-dom"
import useUIStore from "@/store/ui-store"

// ── Types ─────────────────────────────────────────────────────
type Language = "En" | "Ge"

interface User {
  avatar_url?: string | null
  full_name?: string | null
  email?: string | null
}

interface NavLinkItem {
  to: string
  label: string
}

interface Translation {
  search: string
  live: string
  navLinks: NavLinkItem[]
  profile: string
  settings: string
  logout: string
}

// ── Translations ───────────────────────────────────────────────
const T: Record<Language, Translation> = {
  Ge: {
    search: "მოძებნე არხები...",
    live: "პირდაპირი",
    navLinks: [
      { to: "/",        label: "მთავარი"   },
      { to: "/TV",      label: "ტელევიზია" },
      { to: "/packets", label: "პაკეტები"  },
      { to: "/radio",   label: "რადიო"     },
      { to: "/remote",  label: "პულტი"     },
    ],
    profile:  "პროფილი",
    settings: "პარამეტრები",
    logout:   "გასვლა",
  },
  En: {
    search: "Search channels or shows...",
    live: "Go Live",
    navLinks: [
      { to: "/",        label: "Home"   },
      { to: "/TV",      label: "TV"     },
      { to: "/packets", label: "Plans"  },
      { to: "/radio",   label: "Radio"  },
      { to: "/remote",  label: "Remote" },
    ],
    profile:  "Profile",
    settings: "Settings",
    logout:   "Sign out",
  },
}

// ── Nav icon map ───────────────────────────────────────────────
const NAV_ICONS: Record<string, string> = {
  "/":        "home",
  "/TV":      "live_tv",
  "/packets": "subscriptions",
  "/radio":   "radio",
  "/remote":  "tv_remote",
}

// ── Icon ───────────────────────────────────────────────────────
interface IconProps {
  name: string
  size?: number
  fill?: 0 | 1
  className?: string
}

const Icon = ({ name, size = 22, fill = 0, className = "" }: IconProps) => (
  <span
    className={`material-symbols-outlined select-none leading-none ${className}`}
    style={{
      fontSize: size,
      fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
    }}
  >
    {name}
  </span>
)

// ── Avatar ─────────────────────────────────────────────────────
interface AvatarProps {
  src?: string | null
  name?: string | null
}

const Avatar = ({ src, name }: AvatarProps) => (
  <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-white/20 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center flex-shrink-0">
    {src
      ? <img src={src} alt={name ?? "avatar"} className="h-full w-full object-cover" />
      : <Icon name="person" size={20} className="text-zinc-500 dark:text-zinc-400" />
    }
  </div>
)

// ── Search Panel (dropdown) ────────────────────────────────────
interface SearchPanelProps {
  open: boolean
  onClose: () => void
  placeholder: string
}

const SearchPanel = ({ open, onClose, placeholder }: SearchPanelProps) => {
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50)
  }, [open])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [onClose])

  return (
    <>
      {/* backdrop */}
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      {/* panel — anchored just below navbar */}
      <div className={[
        "fixed top-16 left-0 right-0 z-50",
        "flex justify-center px-4 pt-3",
        "transition-all duration-200",
        open ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2 pointer-events-none",
      ].join(" ")}>
        <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl shadow-black/20 dark:shadow-black/50 border border-black/8 dark:border-white/10 overflow-hidden">
          <div className="relative flex items-center px-4 py-3">
            <Icon name="search" size={20} className="text-zinc-400 flex-shrink-0 mr-3" />
            <input
              ref={inputRef}
              placeholder={placeholder}
              className="flex-1 bg-transparent text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
            />
            <button onClick={onClose} className="ml-3 flex-shrink-0 rounded-full p-1 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
              <Icon name="close" size={18} className="text-zinc-400" />
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

// ── ProfileDropdown ────────────────────────────────────────────
interface ProfileDropdownProps {
  user: User | null
  tx: Translation
}

const ProfileDropdown = ({ user, tx }: ProfileDropdownProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const menuItems = [
    { icon: "manage_accounts", label: tx.profile,  to: "/profile"  },
    { icon: "settings",        label: tx.settings, to: "/settings" },
  ]

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none"
      >
        <Avatar src={user?.avatar_url} name={user?.full_name} />
        <Icon
          name="expand_more"
          size={16}
          className={`text-zinc-400 transition-transform duration-200 hidden sm:block ${open ? "rotate-180" : ""}`}
        />
      </button>

      <div className={[
        "absolute right-0 top-[calc(100%+10px)] w-52 z-50",
        "bg-white dark:bg-zinc-900",
        "border border-black/10 dark:border-white/10",
        "rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40",
        "overflow-hidden",
        "transition-all duration-200 origin-top-right",
        open ? "opacity-100 scale-100 pointer-events-auto" : "opacity-0 scale-95 pointer-events-none",
      ].join(" ")}>
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/8 dark:border-white/8">
          <Avatar src={user?.avatar_url} name={user?.full_name} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
              {user?.full_name ?? "Guest"}
            </p>
            <p className="text-xs text-zinc-400 truncate">{user?.email ?? ""}</p>
          </div>
        </div>

        <div className="py-1.5">
          {menuItems.map(item => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-white/5 transition-colors"
            >
              <Icon name={item.icon} size={18} className="text-zinc-400" />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="border-t border-black/8 dark:border-white/8 py-1.5">
          <button
            onClick={() => { setOpen(false) }}
            className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Icon name="logout" size={18} />
            <span>{tx.logout}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

// ── MobileSidebar ──────────────────────────────────────────────
interface MobileSidebarProps {
  open: boolean
  onClose: () => void
  tx: Translation
  isDark: boolean
  toggleDark: () => void
  language: Language
  setLanguage: (lang: Language) => void
  user: User | null
}

const MobileSidebar = ({
  open, onClose, tx, isDark, toggleDark, language, setLanguage, user,
}: MobileSidebarProps) => {
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : ""
    return () => { document.body.style.overflow = "" }
  }, [open])

  return (
    <>
      <div
        onClick={onClose}
        className={[
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />

      <aside className={[
        "fixed top-0 left-0 z-50 h-full w-72",
        "bg-white dark:bg-zinc-950",
        "border-r border-black/10 dark:border-white/10",
        "flex flex-col",
        "transition-transform duration-300 ease-[cubic-bezier(.32,.72,0,1)]",
        open ? "translate-x-0" : "-translate-x-full",
      ].join(" ")}>

        {/* header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-black/8 dark:border-white/8">
          <div className="flex items-center gap-2.5">
            <Avatar src={user?.avatar_url} name={user?.full_name} />
            <div>
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{user?.full_name ?? "Guest"}</p>
              <p className="text-xs text-zinc-400">{user?.email ?? ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
            <Icon name="close" size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* search */}
        <div className="px-4 py-3 border-b border-black/8 dark:border-white/8">
          <div className="relative">
            <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              placeholder={tx.search}
              className="w-full rounded-xl bg-zinc-100 dark:bg-white/8 pl-9 pr-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-orange-500/40"
            />
          </div>
        </div>

        {/* nav links */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-0.5">
          <p className="px-2 pb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
            Navigation
          </p>
          {tx.navLinks.map((link: NavLinkItem) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/"}
              onClick={onClose}
              className={({ isActive }: { isActive: boolean }) =>
                [
                  "flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-orange-500/10 text-orange-500"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/6",
                ].join(" ")
              }
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <Icon
                    name={NAV_ICONS[link.to] ?? "chevron_right"}
                    size={20}
                    fill={isActive ? 1 : 0}
                    className={isActive ? "text-orange-500" : "text-zinc-400"}
                  />
                  <span className="whitespace-nowrap text-gray-800 dark:text-white ml-2">
                    {link.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* bottom controls — dark mode + language (only in sidebar on mobile) */}
        <div className="border-t border-black/8 dark:border-white/8 px-4 py-4 space-y-1">
          <button
            onClick={toggleDark}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-white/6 transition-colors"
          >
            <Icon name={isDark ? "light_mode" : "dark_mode"} size={20} className="text-zinc-400" />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {isDark ? "Light mode" : "Dark mode"}
            </span>
          </button>

          <button
            onClick={() => setLanguage(language === "En" ? "Ge" : "En")}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-zinc-100 dark:hover:bg-white/6 transition-colors"
          >
            <Icon name="translate" size={20} className="text-zinc-400" />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {language === "En" ? "Switch to Georgian" : "Switch to English"}
            </span>
          </button>

          <button
            onClick={() => { /* logout */ }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <Icon name="logout" size={20} className="text-red-400" />
            <span className="text-sm text-red-500">{tx.logout}</span>
          </button>
        </div>
      </aside>
    </>
  )
}

// ── MAIN NAVBAR ────────────────────────────────────────────────
const Navbar = () => {
  const isDark         = useUIStore((s) => s.isDark)
  const toggleDarkMode = useUIStore((s) => s.toggleDarkMode)
  const language       = useUIStore((s) => s.language) as Language
  const setLanguage    = useUIStore((s) => s.setLanguage) as (lang: Language) => void
  const logoLight      = useUIStore((s) => s.logoLight) as string | null | undefined
  const logoDark       = useUIStore((s) => s.logoDark)  as string | null | undefined
  const currentLogo    = isDark ? logoLight : logoDark

  const tx = T[language]

  const [sidebarOpen,  setSidebarOpen]  = useState(false)
  const [searchOpen,   setSearchOpen]   = useState(false)
  const [user,         setUser]         = useState<User | null>(null)

  useEffect(() => {
    import("@/lib/axios").then(({ default: api }) => {
      api.get("/api/user").then((r) => setUser(r.data as User)).catch(() => {})
    }).catch(() => {})
  }, [])

  return (
    <>
      {/* ── Header — fixed height, never overflows ── */}
      <header className="w-full h-16 bg-white/75 dark:bg-zinc-950/80 border-b border-black/10 dark:border-white/10 backdrop-blur-lg transition-colors duration-300">
        <div className="flex h-full items-center justify-between px-4 sm:px-6 w-full">

          {/* LEFT: hamburger + logo + desktop nav */}
          <div className="flex items-center gap-2 flex-shrink-0 min-w-0">

            {/* hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex-shrink-0 rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
            >
              <Icon name="menu" size={22} className="text-zinc-700 dark:text-zinc-300" />
            </button>

            {/* logo */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-2">
              {currentLogo
                ? <img src={currentLogo} alt="Mediabox" className="h-8 w-auto" />
                : (
                  <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                    media<span className="text-orange-500">box</span>
                  </span>
                )
              }
            </Link>

            {/* desktop nav — hidden below md */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-3">
              {tx.navLinks.map((link: NavLinkItem) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  end={link.to === "/"}
                  className={({ isActive }: { isActive: boolean }) =>
                    [
                      "rounded-full px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                      isActive
                        ? "bg-orange-500/10 text-orange-500"
                        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-white/6",
                    ].join(" ")
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </nav>
          </div>

          {/* RIGHT: controls — never wrap, never overflow */}
          <div className="flex items-center gap-1 flex-shrink-0">

            {/* search icon — always visible, opens panel */}
            <button
              onClick={() => setSearchOpen(true)}
              className="rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
            >
              <Icon name="search" size={20} className="text-zinc-600 dark:text-zinc-400" />
            </button>

            {/* dark mode — desktop only */}
            <button
              onClick={toggleDarkMode}
              title="Toggle dark mode"
              className="hidden lg:flex rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
            >
              <Icon
                name={isDark ? "light_mode" : "dark_mode"}
                size={20}
                className="text-zinc-600 dark:text-zinc-400"
              />
            </button>

            {/* language — desktop only */}
            <button
              onClick={() => setLanguage(language === "En" ? "Ge" : "En")}
              title="Switch language"
              className="hidden lg:flex rounded-full px-2 py-1.5 items-center gap-1 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
            >
              <Icon name="translate" size={18} className="text-zinc-500 dark:text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {language.toUpperCase()}
              </span>
            </button>

            {/* go live — desktop only */}

            <Link
              to="/TV"
              className="hidden xl:inline-flex items-center gap-1.5 rounded-full bg-orange-500 hover:bg-orange-600 px-3 py-1.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition-colors whitespace-nowrap"
            >
              <Icon name="play_circle" size={17} fill={1} className="text-white" />
              <span>{tx.live}</span>
            </Link>

            {/* profile — always visible */}
            <ProfileDropdown user={user} tx={tx} />
          </div>
        </div>
      </header>

      {/* Search dropdown panel */}
      <SearchPanel
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        placeholder={tx.search}
      />

      {/* Mobile sidebar */}
      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        tx={tx}
        isDark={isDark}
        toggleDark={toggleDarkMode}
        language={language}
        setLanguage={setLanguage}
        user={user}
      />
    </>
  )
}

export default Navbar
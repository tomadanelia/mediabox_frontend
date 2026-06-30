import { useState, useEffect, useRef } from "react"
import { Link, NavLink, useNavigate } from "react-router-dom"
import useUIStore from "@/store/ui-store"
import api from "@/lib/axios"
import useAuthStore from "@/store/AuthStore"
type Language = "En" | "Ge"
interface User {
  avatar_url?: string | null
  full_name?: string | null
  email?: string | null
  phone?: string |null
  numeric_id?: string
  username?: string
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
  logout: string
  signin: string
}

// ── Translations ───────────────────────────────────────────────
const T: Record<Language, Translation> = {
  Ge: {
    search: "მოძებნე არხები...",
    live: "პირდაპირი",
    navLinks: [
      { to: "/",        label: "მთავარი"   },
      { to: "/tv",      label: "ტელევიზია" },
      { to: "/packets", label: "პაკეტები"  },
      { to: "/radio",   label: "რადიო"     },
      { to: "/remote",  label: "პულტი"     },
    ],
    profile:  "პროფილი",
    logout:   "გასვლა",
    signin:   "შესვლა",
  },
  En: {
    search: "Search channels or shows...",
    live: "Go Live",
    navLinks: [
      { to: "/",        label: "Home"   },
      { to: "/tv",      label: "TV"     },
      { to: "/packets", label: "Plans"  },
      { to: "/radio",   label: "Radio"  },
      { to: "/remote",  label: "Remote" },
    ],
    profile:  "Profile",
    logout:   "Sign out",
    signin:   "Sign in",
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
  <div className="h-9 w-9 rounded-full overflow-hidden ring-2 ring-white/20 bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center shrink-0">
    {src
      ? <img src={src} alt={name ?? "avatar"} className="h-full w-full object-cover" />
      : <Icon name="person" size={20} className="text-zinc-500 dark:text-zinc-400" />
    }
  </div>
)





// ── ProfileDropdown ────────────────────────────────────────────
interface ProfileDropdownProps {
  user: User | null
  tx: Translation
  onLogout: () => void
}
import { createPortal } from "react-dom"

const ProfileDropdown = ({ user, tx, onLogout }: ProfileDropdownProps) => {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const btnRef = useRef<HTMLButtonElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isGuest = !user?.numeric_id

  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
  }
  const scheduleClose = () => {
    cancelClose()
    closeTimer.current = setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        ref.current && !ref.current.contains(e.target as Node) &&
        !(e.target as HTMLElement)?.closest("[data-hover-bridge]")
      ) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const menuItems = [{ icon: "manage_accounts", label: tx.profile, to: "/profile" }]

  // Compute bridge rect from button position
  const rect = btnRef.current?.getBoundingClientRect()

  return (
    <>
      <div ref={ref} className="relative">
        {/* BUTTON */}
        <button
          ref={btnRef}
          onClick={() => setOpen(prev => !prev)}
          onMouseEnter={() => { cancelClose(); setOpen(true) }}
          onMouseLeave={scheduleClose}
          className="flex items-center cursor-pointer gap-1 rounded-full p-1 hover:bg-black/5 dark:hover:bg-white/10 transition-colors focus:outline-none"
        >
          <Avatar src={user?.avatar_url} name={user?.full_name} />
          <Icon
            name="expand_more"
            size={16}
            className={`text-zinc-400 transition-transform duration-200 hidden sm:block ${open ? "rotate-180" : ""}`}
          />
        </button>

          <div
           onMouseEnter={cancelClose}
           onMouseLeave={scheduleClose}
        className={`absolute cursor-pointer right-0 top-[calc(100%+2px)] w-52 z-50
          bg-white dark:bg-zinc-900
          border border-black/10 dark:border-white/10
          rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/40
          overflow-hidden
          transition-all duration-200 origin-top-right
          ${
            open
              ? "opacity-100 scale-100 pointer-events-auto"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
      >
        {/* User info */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-black/8 dark:border-white/8">
          <Avatar src={user?.avatar_url} name={user?.full_name} />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-zinc-900 dark:text-white truncate">
              {user?.full_name ||
                user?.username ||
                user?.email?.split("@")[0] ||
                user?.phone ||
                "Guest"}
            </p>
            <p className="text-xs text-zinc-400 truncate">
              {user?.numeric_id || ""}
            </p>
          </div>
        </div>

        {isGuest ? (
          <div className="py-1.5">
            <Link
              to="/authentication/login"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors"
              style={{ color: "#d52b1e" }}
              onMouseEnter={e =>
                (e.currentTarget.style.backgroundColor = "rgba(213,43,30,0.06)")
              }
              onMouseLeave={e =>
                (e.currentTarget.style.backgroundColor = "transparent")
              }
            >
              <Icon name="login" size={18} />
              <span>{tx.signin}</span>
            </Link>
          </div>
        ) : (
          <>
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
                onClick={() => {
                  setOpen(false)
                  onLogout()
                }}
                className="flex w-full items-center gap-3 px-4 cursor-pointer py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <Icon name="logout" size={18} />
                <span>{tx.logout}</span>
              </button>
            </div>
          </>
        )}
        </div>
      </div>


      {/* Separate, portal-rendered hover bridge — outside the button/dropdown DOM tree entirely */}
      {open && rect && createPortal(
        <div
          data-hover-bridge
          onMouseEnter={() => { cancelClose(); setOpen(true) }}
          onMouseLeave={scheduleClose}
          style={{
            position: "fixed",
            top: rect.bottom,
            left: rect.right - 208, // 208px = w-52, aligns to right edge like the dropdown
            width: 260,             // a bit wider than the dropdown for forgiving diagonal movement
            height: 240,             // covers the vertical gap
            zIndex: 45,
          }}
        />,
        document.body
      )}
    </>
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
  onLogout: () => void
}

const MobileSidebar = ({
  open, onClose, tx, isDark, toggleDark, language, setLanguage, user, onLogout,
}: MobileSidebarProps) => {
  const isGuest = !user?.email

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
              <p className="text-sm font-semibold text-zinc-900 dark:text-white">{user?.full_name || user?.username || user?.email?.split("@")[0] || user?.phone || "Guest"}</p>
              <p className="text-xs text-zinc-400 truncate">{user?.numeric_id || ""}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-full p-1.5 hover:bg-zinc-100 dark:hover:bg-white/10 transition-colors">
            <Icon name="close" size={20} className="text-zinc-500 dark:text-zinc-400" />
          </button>
        </div>

        {/* search */}
        <div className="px-4 py-3 border-b border-black/8 dark:border-white/8">
          <div className="relative">
            {/* <Icon name="search" size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" /> */}
            <input
              placeholder={tx.search}
              className="w-full rounded-xl bg-zinc-100 dark:bg-white/8 pl-9 pr-3 py-2.5 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 focus:outline-none"
              style={{ ['--tw-ring-color' as string]: 'rgba(213,43,30,0.4)' }}
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
                    ? "text-white"
                    : "text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-white/6",
                ].join(" ")
              }
              style={({ isActive }) => isActive ? { backgroundColor: '#d52b1e' } : {}}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <Icon
                    name={NAV_ICONS[link.to] ?? "chevron_right"}
                    size={20}
                    fill={isActive ? 1 : 0}
                    className={isActive ? "text-white" : "text-zinc-400"}
                  />
                  <span className={`whitespace-nowrap ml-2 ${isActive ? "text-white" : "text-gray-800 dark:text-white"}`}>
                    {link.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* bottom controls */}
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

          {isGuest ? (
            <Link
              to="/login"
              onClick={onClose}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 transition-colors text-sm font-medium"
              style={{ color: '#d52b1e' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(213,43,30,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
              <Icon name="login" size={20}/>
              <span>{tx.signin}</span>
            </Link>
          ) : (
            <button
              onClick={() => { onClose(); onLogout(); }}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Icon name="logout" size={20} className="text-red-400" />
              <span className="text-sm text-red-500">{tx.logout}</span>
            </button>
          )}
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
  const navigate = useNavigate()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchOpen,  setSearchOpen]  = useState(false)
  const user     = useAuthStore((s) => s.user)
  const handleLogout = useAuthStore((s) => s.logout)

  
const unreadCount = useUIStore((s) => s.unreadCount)

  return (
    <>
      <header className={`w-full h-16 ${language === "Ge" ? "font-geo-mt" : ""} bg-nav-bg border border-black/10 dark:border-white/10 backdrop-blur-lg transition-colors duration-300 flex justify-center items-center`}>
        <div className="flex h-full items-center justify-between px-4 sm:px-6 w-full 2_5xl:w-500">

          {/* LEFT */}
          <div className="flex items-center gap-2 shrink-0 min-w-0">

            {/* hamburger — mobile only */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden shrink-0 rounded-xl p-2 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
            >
              <Icon name="menu" size={22} className="text-zinc-700 dark:text-zinc-300" />
            </button>

            {/* logo */}
            <Link to="/" className="shrink-0 flex items-center gap-2">
              {currentLogo
                ? <img src={currentLogo} alt="Mediabox" className="h-8 w-auto" />
                : (
                  <span className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white">
                    media<span style={{ color: '#d52b1e' }}>box</span>
                  </span>
                )
              }
            </Link>

            {/* desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5 ml-3">
              {tx.navLinks.map((link: NavLinkItem) => (
                // Desktop nav — replace the NavLink className/style with:
<NavLink
  key={link.to}
  to={link.to}
  end={link.to === "/"}
  className={({ isActive }) =>
    [
      "px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
      "border-b-2",
      isActive
        ? "text-zinc-900 dark:text-white border-[#d52b1e]"
        : "text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border-transparent",
    ].join(" ")
  }
>
  {link.label}
</NavLink>
              ))}
            </nav>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1 shrink-0">

<Link
  to="/notifications"
  title="Notifications"
  className="relative rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors flex items-center justify-center"
>
  <Icon
    name="notifications"
    size={22}
    className="text-zinc-600 dark:text-zinc-400"
  />
  {unreadCount > 0 && (
    <span
      className="absolute top-1 right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-[#d52b1e] text-white text-[10px] font-bold flex items-center justify-center leading-none ring-2 ring-white dark:ring-zinc-950"
    >
      {unreadCount > 99 ? "99+" : unreadCount}
    </span>
  )}
</Link>            <button
              onClick={toggleDarkMode}
              title="Toggle dark mode"
              className="hidden cursor-pointer lg:flex rounded-full p-2 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
            >
              <Icon
                name={isDark ? "light_mode" : "dark_mode"}
                size={20}
                className="text-zinc-600 dark:text-zinc-400"
              />
            </button>

            <button
              onClick={() => setLanguage(language === "En" ? "Ge" : "En")}
              title="Switch language"
              className="hidden lg:flex rounded-full cursor-pointer px-2 py-1.5 items-center gap-1 hover:bg-zinc-100 dark:hover:bg-white/8 transition-colors"
            >
              <Icon name="translate" size={18} className="text-zinc-500 dark:text-zinc-400" />
              <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
                {language.toUpperCase()}
              </span>
            </button>

            {/* go live — desktop only */}

            <ProfileDropdown user={user} tx={tx} onLogout={handleLogout} />
          </div>
        </div>
      </header>


      <MobileSidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        tx={tx}
        isDark={isDark}
        toggleDark={toggleDarkMode}
        language={language}
        setLanguage={setLanguage}
        user={user}
        onLogout={handleLogout}
      />
    </>
  )
}

export default Navbar
import { Link, NavLink } from "react-router-dom"
import { BellIcon, Languages, Moon, PlayIcon, SearchIcon, Sun, TvMinimalPlay, User, ChevronDown, ChevronUp } from "lucide-react"
import { useState, useEffect } from "react"
import api from "@/lib/axios"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import logo   from "@/assets/logot.svg"
import logoDark  from "@/assets/logotDark.svg"
import NotificationDropdown from "@/components/shadcn-studio/blocks/dropdown-notification"
import ProfileDropdown from "@/components/shadcn-studio/blocks/dropdown-profile"
import useUIStore from "@/store/ui-store"
import { useIsMobile } from "@/hooks/useIsMobile"
import { useOrientation } from "@/hooks/useOrientation"

const translations = {
  Ge: {
    subtitle: 'არხების ჰაბი',
    search: 'მოძებნე არხები',
    openLive: 'პირდაპირი',
    navLinks: [
      { to: "/", label: "მთავარი" },
      { to: "/TV", label: "ტელევიზია" },
      { to: "/packets", label: "პაკეტები" },
    ],
  },
  En: {
    subtitle: 'Live Streaming Hub',
    search: 'Search channels or shows',
    openLive: 'Open Live',
    navLinks: [
      { to: "/", label: "Home" },
      { to: "/TV", label: "TV" },
      { to: "/packets", label: "Plans" },
    ],
  },
} as const

const Navbar = () => {
  const isDark = useUIStore((state) => state.isDark)
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode)
  const setLanguage = useUIStore((state) => state.setLanguage)
  const language = useUIStore((state) => state.language)
  const tx = translations[language]
  const currentLogo = isDark ?  logo :logoDark
  const isMobile = useIsMobile()
  const isLandscape = useOrientation()
  const isCollapsible = isMobile && isLandscape

  const [expanded, setExpanded] = useState(false)

  // Auto-collapse when switching to landscape
  useEffect(() => {
    if (isCollapsible) setExpanded(false)
  }, [isCollapsible])

  const [user, setUser] = useState<{ avatar_url?: string | null; full_name?: string } | null>(null)

  useEffect(() => {
    api.get("/api/user")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
  }, [])

  return (
    <header className={`
      top-0 z-50 w-screen relative overflow-visible
      bg-white/70 dark:bg-white/5
      border-b border-black/8 dark:border-white/10
      backdrop-blur-md
      transition-all duration-300 ease-in-out
      ${isCollapsible ? (expanded ? 'h-20' : 'h-0') : 'h-20'}
    `}>

      {/* ── Pull tab — mobile landscape only ── */}
      {isCollapsible && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full z-30
            w-16 h-5 flex items-center justify-center
            bg-white/70 dark:bg-white/5
            border border-t-0 border-black/8 dark:border-white/10
            rounded-b-lg backdrop-blur-md
            text-black/40 dark:text-white/40
            hover:text-orange-400 transition-colors"
        >
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      )}

      {/* ── Main content ── */}
      <div className={`
        flex h-20 w-full items-center justify-between gap-6 px-4 sm:px-6
        transition-opacity duration-200
        ${isCollapsible && !expanded ? 'opacity-0 pointer-events-none' : 'opacity-100'}
      `}>
        <div className="flex items-center gap-4">

          <Link to="/" className="flex items-center gap-3">
  <img src={currentLogo} alt="Mediabox" className="h-9 w-auto" />
</Link>


          <nav className="hidden items-center gap-4 md:flex">
            {tx.navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition text-center min-w-[90px] ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground"
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
          <div className="relative hidden max-w-md flex-1 items-center md:flex">
            <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground">
              <SearchIcon className="h-4 w-4" />
            </div>
            <Input placeholder={tx.search} className="pl-9" />
          </div>

         

          <Button
            variant="outline"
            size="icon"
            aria-pressed={isDark}
            onClick={toggleDarkMode}
            className="relative cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only">Toggle dark mode</span>
          </Button>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setLanguage(language === "En" ? "Ge" : "En")}
            className="relative cursor-pointer"
          >
            <Languages className="h-4 w-4" />
            <span className="absolute -bottom-2 right-0 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {language.toUpperCase()}
            </span>
            <span className="sr-only">Switch language</span>
          </Button>

          <Button asChild className="hidden w-[120px] justify-center gap-2 bg-primary text-primary-foreground shadow-lg sm:inline-flex">
            <Link to="/Tv">
              <PlayIcon className="h-4 w-4" />
              {tx.openLive}
            </Link>
          </Button>

          <ProfileDropdown
            trigger={
              <Button variant="ghost" className="h-full rounded-full p-0">
                <Avatar className="h-11 w-11">
                  <AvatarImage src={user?.avatar_url ?? ""} />
                  <AvatarFallback className="bg-zinc-200 dark:bg-zinc-700">
                    <User className="h-5 w-5 text-zinc-500" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            }
          />
        </div>
      </div>
    </header>
  )
}

export default Navbar
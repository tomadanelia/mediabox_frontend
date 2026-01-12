import { Link, NavLink } from "react-router-dom"
import { BellIcon, Languages, Moon, PlayIcon, SearchIcon, Sun, TvMinimalPlay } from "lucide-react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

import NotificationDropdown from "@/components/shadcn-studio/blocks/dropdown-notification"
import ProfileDropdown from "@/components/shadcn-studio/blocks/dropdown-profile"
import useUIStore from "@/store/ui-store"
import type { UIStore } from "@/store/ui-store"

const Navbar = () => {
  const isDark = useUIStore((state: UIStore) => state.isDark)
  const language = useUIStore((state: UIStore) => state.language)
  const toggleDarkMode = useUIStore((state: UIStore) => state.toggleDarkMode)
  const cycleLanguage = useUIStore((state: UIStore) => state.cycleLanguage)

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/TV", label: "TV" },
    { to: "/packets", label: "Packets"},
  ]

  return (
    <header className="top-0 z-50 h-20 bg-background/90 backdrop-blur">
      <div className="flex h-full w-full items-center justify-between gap-6 px-4 sm:px-6">
        <div className="flex items-center gap-4">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-fuchsia-500 text-white shadow-lg">
              <TvMinimalPlay className="h-6 w-6" />
            </div>
            <div className="leading-tight">
              <p className="text-lg font-semibold text-foreground">Mediabox</p>
              <p className="text-xs text-muted-foreground">Live streaming hub</p>
            </div>
          </Link>

          <nav className="hidden items-center gap-4 md:flex">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `rounded-full px-4 py-2 text-sm font-medium transition ${
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
            <Input placeholder="Search channels or shows" className="pl-9" />
          </div>

          <Button variant="ghost" size="icon" className="md:hidden">
            <SearchIcon />
            <span className="sr-only">Search</span>
          </Button>

          <NotificationDropdown
            trigger={
              <Button variant="outline" size="icon" className="relative">
                <BellIcon />
                <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-destructive" />
              </Button>
            }
          />

          <Button
            variant="outline"
            size="icon"
            aria-pressed={isDark}
            onClick={toggleDarkMode}
            className="relative cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            <span className="sr-only ">Toggle dark mode</span>
          </Button>

          <Button variant="outline" size="icon" onClick={cycleLanguage} className="relative cursor-pointer">
            <Languages className="h-4 w-4" />
            <span className="absolute -bottom-2 right-0 rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
              {language.toUpperCase()}
            </span>
            <span className="sr-only">Switch language</span>
          </Button>

          <Button asChild className="hidden gap-2 bg-primary text-primary-foreground shadow-lg sm:inline-flex">
            <Link to="/stream">
              <PlayIcon className="h-4 w-4" />
              Open Live
            </Link>
          </Button>

          <ProfileDropdown
            trigger={
              <Button variant="ghost" className="h-full rounded-full p-0">
                <Avatar className="h-11 w-11">
                  <AvatarImage src="https://cdn.shadcnstudio.com/ss-assets/avatar/avatar-1.png" />
                  <AvatarFallback>MB</AvatarFallback>
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

import { create } from "zustand"
import { persist } from "zustand/middleware"
import logoLight from "@/assets/logot.svg"
import logoDark from "@/assets/logotDark.svg"
import type { Channel } from "../types/channel"

type Language = "En" | "Ge"

export type UIStore = {
  isDark: boolean
  language: Language
  selectedChannelId: string
  logoLight: string
  logoDark: string
  channels: Channel[]
  unreadCount: number                              

  toggleDarkMode: () => void
  setLanguage: (language: Language) => void
  setSelectedChannelId: (chId: string) => void
  setLogos: (light: string, dark: string) => void
  setChannels: (channels: Channel[]) => void
  setUnreadCount: (count: number) => void          
  incrementUnread: () => void                      
  decrementUnread: (by?: number) => void           
}

const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDark: true,
      language: "Ge",
      selectedChannelId: "22",
      logoLight: logoLight,
      logoDark: logoDark,
      channels: [],
      unreadCount: 0,

      toggleDarkMode: () => set((state) => {
        const next = !state.isDark
        document.documentElement.classList.toggle("dark", next)
        return { isDark: next }
      }),
      setLanguage: (language) => set({ language }),
      setSelectedChannelId: (selectedChannelId) => set({ selectedChannelId }),
      setLogos: (light, dark) => set({ logoLight: light, logoDark: dark }),
      setChannels: (channels) => set({ channels }),
      setUnreadCount: (count) => set({ unreadCount: count }),
      incrementUnread: () => set((state) => ({ unreadCount: state.unreadCount + 1 })),
      decrementUnread: (by = 1) => set((state) => ({ unreadCount: Math.max(0, state.unreadCount - by) })),
    }),
    {
      name: "ui-storage",
      partialize: (state) => ({
        isDark: state.isDark,
        language: state.language,
        selectedChannelId: state.selectedChannelId,
      }),
    }
  )
)

export default useUIStore
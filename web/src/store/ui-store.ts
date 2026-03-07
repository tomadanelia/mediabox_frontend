import { create } from "zustand"
import { persist } from "zustand/middleware"
import logoLight from "@/assets/logot.svg"
import logoDark from "@/assets/logotDark.svg"

type Language = "En" | "Ge"

export type UIStore = {
  isDark: boolean
  language: Language
  selectedChannelId: string
  logoLight: string
  logoDark: string
  toggleDarkMode: () => void
  setLanguage: (language: Language) => void
  setSelectedChannelId: (chId: string) => void
  setLogos: (light: string, dark: string) => void
}

const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDark: true,
      language: "Ge",
      selectedChannelId: "22",
      logoLight: logoLight,   
      logoDark: logoDark,     
      toggleDarkMode: () => set((state) => ({ isDark: !state.isDark })),
      setLanguage: (language) => set({ language }),
      setSelectedChannelId: (selectedChannelId) => set({ selectedChannelId }),
      setLogos: (light, dark) => set({ logoLight: light, logoDark: dark }),
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
import { create } from "zustand"
import { persist } from "zustand/middleware"

type Language = "En" | "Ge"

export type UIStore = {
  isDark: boolean
  language: Language
  toggleDarkMode: () => void
  setLanguage: (language: Language) => void
}

const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDark: true,
      language: "Ge",
      toggleDarkMode: () => set((state) => ({ isDark: !state.isDark })),
      setLanguage: (language) => set({ language }),
    }),
    {
      name: "ui-storage",
    }
  )
)
export default useUIStore;
import { create } from "zustand"

type Language = "en" | "es" | "fr"

type UIStore = {
  isDark: boolean
  language: Language
  toggleDarkMode: () => void
  cycleLanguage: () => void
  setLanguage: (language: Language) => void
}

const languageCycle: Language[] = ["en", "es", "fr"]

const useUIStore = create<UIStore>((set, get) => ({
  isDark: true,
  language: "en",
  toggleDarkMode: () => set((state) => ({ isDark: !state.isDark })),
  setLanguage: (language) => set({ language }),
  cycleLanguage: () => {
    const current = get().language
    const nextIndex = (languageCycle.indexOf(current) + 1) % languageCycle.length
    set({ language: languageCycle[nextIndex] })
  },
}))

export default useUIStore
export type { Language, UIStore }


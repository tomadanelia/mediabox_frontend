import { create } from "zustand"

type Language = "En" | "Ge"

type UIStore = {
  isDark: boolean
  language: Language
  toggleDarkMode: () => void
  setLanguage: (language: Language) => void
}

const useUIStore = create<UIStore>((set, get) => ({
  isDark: true,
  language: "En",
  toggleDarkMode: () => set((state) => ({ isDark: !state.isDark })),
  setLanguage: (language) => set({ language })
}))

export default useUIStore
export type { Language, UIStore }


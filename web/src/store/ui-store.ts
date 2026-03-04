import { create } from "zustand"
import { persist } from "zustand/middleware"

type Language = "En" | "Ge"

export type UIStore = {
  isDark: boolean
  language: Language
  selectedChannelId: string
  toggleDarkMode: () => void
  setLanguage: (language: Language) => void
  setSelectedChannelId: (chId:string) => void
}

const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDark: true,
      language: "Ge",
      selectedChannelId: "22",
      toggleDarkMode: () => set((state) => ({ isDark: !state.isDark })),
      setLanguage: (language) => set({ language }),
      setSelectedChannelId: (selectedChannelId) => set({selectedChannelId}),
    }),
    {
      name: "ui-storage",
    }
  )
)
export default useUIStore;
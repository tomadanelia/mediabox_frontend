import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import Home from "../pages/home/home"
import Stream from "../pages/stream/stream"
import Navbar from "./components/shadcn-studio/blocks/navbar-component-07/navbar-component-07"
import useUIStore from "./store/ui-store"
import type { UIStore } from "./store/ui-store"

const App: React.FC = () => {
  const isDark = useUIStore((state: UIStore) => state.isDark)

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [isDark])

  return (
    <div className="app-shell min-h-screen relative flex flex-col">
      <div className="h-20 relative shrink-0">
        <Navbar />
      </div>
      <div className="flex-1 relative overflow-hidden">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/stream" element={<Stream />} />
        </Routes>
      </div>
    </div>
  )
}

export default App

import { Routes, Route } from "react-router-dom"
import Home from "../pages/home/home"
import Stream from "../pages/stream/stream"
import Navbar from "./components/shadcn-studio/blocks/navbar-component-07/navbar-component-07"

const App: React.FC = () => {
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

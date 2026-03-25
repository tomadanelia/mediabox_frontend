import { useEffect } from "react"
import { Routes, Route } from "react-router-dom"
import Home from "../pages/home/home"
import Stream from "../pages/stream/stream"
import Plans from "../pages/plans/plans"
import UserProfile from "../pages/profile/usprofile"
import Navbar from "./components/shadcn-studio/blocks/navbar-component-07/navbar-component-07"
import useUIStore from "./store/ui-store"
import AuthReg from "../pages/authmain/register/authreg"
import AuthLog from "../pages/authmain/authlogpapa/mauthlog"
import AuthVerify from "../pages/authmain/codeVerification"
import AuthLoginVerify from "../pages/authmain/codeLoginVerification"
import AdminDashboard from "../pages/admin/admin"
import SupportPage from "../pages/support/support"
import MeetUsPage from "../pages/meetus/meetUs"
import type { UIStore } from "./store/ui-store"
import useAuthStore from "./store/AuthStore"
import TvPair from "../pages/authmain/tv/TvPair"
import ResetPassword from "../pages/authmain/password/reset"
import ForgotPassword from "../pages/authmain/password/forgot"
import RemotePage from "../pages/remoteC/remotec"
import RadioPage from "../pages/radio/radioP"
import api from "./lib/axios"
import InvoicePage from "../pages/invoice/invoice"
import type { DeviceLimitInvoiceData } from "./types/invoice"
const App: React.FC = () => {
  const isDark = useUIStore((state: UIStore) => state.isDark);
  const setLogos = useUIStore((state) => state.setLogos);
  const fetchUser = useAuthStore((state) => state.fetchUser);
  useEffect(() => {
    api.get("/api/settings/logos")
      .then((res) => {
        const { logo_light, logo_dark } = res.data
        if (logo_light && logo_dark) {
          const bust = `?v=k`
          setLogos(logo_dark+bust,logo_light+bust);
        }
      })
      .catch(() => {
      })
  }, [])
  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    const root = document.documentElement
    if (isDark) {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, [isDark])

  return (
    <div className="app-shell h-screen overflow-hidden flex flex-col">

      <div className="shrink-0 h-[64px] w-full z-50 lg:relative overflow-X-hidden ">
        <Navbar />
      </div>


   <div className="page-content h-[calc(100vh-64px)] flex-1 min-h-0 overflow-y-auto relative bg-background">
          <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/TV" element={<Stream />} />
          <Route path="/packets" element={<Plans />} />
          <Route path="/profile" element={<UserProfile />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/remote" element={<RemotePage />} />
          <Route path="/radio" element={<RadioPage />} />
          <Route path="/support" element={<SupportPage />} />
          <Route path="/meetus" element={<MeetUsPage />} />
          <Route path="/invoice" element={<InvoicePage/>}/>
          <Route path="/authentication">
            <Route path="login" element={<AuthLog/>} />
            <Route path="register" element={<AuthReg/>} />
            <Route path="verify" element={<AuthVerify />} />
            <Route path="login-verify" element={<AuthLoginVerify />} />
            <Route path="reset-password" element={<ResetPassword/>} />
            <Route path="forgot-password" element={<ForgotPassword/>} />
          </Route>
          <Route path="/tv-register" element={<TvPair />} />
        </Routes>
      </div>

    </div>
  )
}

export default App
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../../src/lib/axios'
import useAuthStore from '../../../src/store/AuthStore'

type Stage = 'loading' | 'confirm' | 'success' | 'error' | 'no_code'

const TvPair = () => {
  const { isAuthenticated, isLoading, fetchUser, user } = useAuthStore()
  const navigate = useNavigate()

  const [code, setCode] = useState<string | null>(null)
  const [stage, setStage] = useState<Stage>('loading')
  const [pairing, setPairing] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const c = params.get('code')

    if (!c) {
      setStage('no_code')
      return
    }

    setCode(c)
    fetchUser()
  }, [])

  useEffect(() => {
    if (isLoading || !code) return

    if (!isAuthenticated) {
      localStorage.setItem('tv_pair_code', code)
      navigate('/authentication/register')
      return
    }

    setStage('confirm')
  }, [isLoading, isAuthenticated, code])

  const handleConfirm = async () => {
    if (!code) return
    setPairing(true)
    try {
      await api.post('/api/tv/pair', { pairing_code: code })
      setStage('success')
    } catch (err: any) {
      setErrorMsg(err?.response?.data?.message || 'დაწყვილება ვერ მოხდა. სცადეთ ხელახლა.')
      setStage('error')
    } finally {
      setPairing(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-[#080b10] relative overflow-hidden"
      style={{ fontFamily: "'DM Sans', 'Segoe UI', sans-serif" }}
    >
      {/* Ambient background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-emerald-500/5 blur-[80px]" />
      </div>

      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 w-full max-w-md mx-auto px-6">

        {/* ── Loading ── */}
        {(stage === 'loading' || isLoading) && (
          <div className="text-center">
            <div className="inline-flex items-center gap-3 text-gray-500">
              <span className="w-5 h-5 border-2 border-gray-700 border-t-gray-400 rounded-full animate-spin" />
              <span className="text-sm tracking-wide">მოწმდება...</span>
            </div>
          </div>
        )}

        {/* ── No code in URL ── */}
        {stage === 'no_code' && (
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-white mb-2">კოდი არ მოიძებნა</h1>
            <p className="text-sm text-gray-500">ტელევიზორზე შეამოწმეთ QR კოდი ან ბმული და ხელახლა სცადეთ.</p>
          </div>
        )}

        {/* ── Confirm stage ── */}
        {stage === 'confirm' && (
          <div>
            {/* TV icon */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="w-20 h-20 rounded-3xl bg-gradient-to-b from-white/10 to-white/5 border border-white/10 flex items-center justify-center shadow-[0_0_40px_rgba(59,130,246,0.15)]">
                  <svg className="w-10 h-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                {/* Pulse ring */}
                <div className="absolute inset-0 rounded-3xl border border-blue-400/30 animate-ping" style={{ animationDuration: '2s' }} />
              </div>
            </div>

            {/* Greeting */}
            <div className="text-center mb-8">
              <p className="text-xs uppercase tracking-[0.2em] text-blue-400/70 font-semibold mb-2">დაწყვილება ტელევიზორთან</p>
              <h1 className="text-3xl font-bold text-white mb-2">
                გამარჯობა, {user?.full_name?.split(' ')[0] || user?.username}
              </h1>
              <p className="text-gray-400 text-sm leading-relaxed">
                თქვენი ტელევიზორი ითხოვს დაწყვილებას.<br />
                დაადასტურეთ წვდომა ქვემოთ.
              </p>
            </div>

            {/* Code display */}
            <div className="rounded-2xl border border-white/8 bg-white/[0.04] px-6 py-4 mb-6 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">პეარინგ კოდი</p>
                <p className="text-2xl font-bold tracking-[0.15em] text-white font-mono">{code}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>

            {/* Confirm button */}
            <button
              onClick={handleConfirm}
              disabled={pairing}
              className="w-full py-4 rounded-2xl cursor-pointer bg-blue-500 hover:bg-blue-400 disabled:bg-blue-500/50 text-white font-bold text-base tracking-wide transition-all duration-200 active:scale-[0.98] shadow-[0_4px_24px_rgba(59,130,246,0.35)] hover:shadow-[0_4px_32px_rgba(59,130,246,0.5)] flex items-center justify-center gap-3"
            >
              {pairing ? (
                <>
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  მიმდინარეობს...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  ტელევიზორთან დაწყვილების დადასტურება
                </>
              )}
            </button>

            <p className="text-center text-xs text-gray-600 mt-4">
              <Link to="/">თუ ეს თქვენ არ ხართ, უბრალოდ დახურეთ გვერდი</Link>
            </p>
          </div>
        )}

        {/* ── Success ── */}
        {stage === 'success' && (
          <div className="text-center">
            {/* Animated checkmark */}
            <div className="relative flex justify-center mb-8">
              <div className="w-24 h-24 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <svg className="w-12 h-12 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping" style={{ animationDuration: '1.5s' }} />
            </div>

            <h1 className="text-3xl font-bold text-white mb-3">დაწყვილება დასრულდა!</h1>
            <p className="text-gray-400 text-sm leading-relaxed mb-8">
              თქვენი ტელევიზორი წარმატებით დაუკავშირდა<br />
              თქვენს ანგარიშს. შეგიძლიათ დაბრუნდეთ აპლიკაციაში.
            </p>

            <div className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-medium">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              შეგიძლიათ დახუროთ ეს ჩანართი
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {stage === 'error' && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-3xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>

            <h1 className="text-2xl font-bold text-white mb-3">დაწყვილება ვერ მოხდა</h1>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">{errorMsg}</p>

            <button
              onClick={() => setStage('confirm')}
              className="px-8 py-3 rounded-xl bg-white/8 hover:bg-white/12 border border-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all duration-200 active:scale-[0.98]"
            >
              ხელახლა სცადეთ
            </button>
          </div>
        )}

      </div>
    </div>
  )
}

export default TvPair
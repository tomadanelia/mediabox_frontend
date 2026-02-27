import React, { useState, useRef, useEffect } from 'react'
import { ShieldCheckIcon } from 'lucide-react'
import { Input } from '../../src/components/ui/input'
import { API_BASE_URL } from '../../src/config'
import api from '../../src/lib/axios'
const AuthLoginVerify: React.FC = () => {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // countdown timer
  useEffect(() => {
    if (resendTimer === 0) {
      setCanResend(true)
      return
    }
    const t = setTimeout(() => setResendTimer(v => v - 1), 1000)
    return () => clearTimeout(t)
  }, [resendTimer])

  const handleChange = (index: number, value: string) => {
    // only allow single digit
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    // auto-advance to next field
    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...code]
    pasted.split('').forEach((char, i) => { next[i] = char })
    setCode(next)
    // focus last filled or last box
    const lastIndex = Math.min(pasted.length, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const fullCode = code.join('');
  
  const loginIdentifier = localStorage.getItem('pending_login'); 

  if (!loginIdentifier) {
      alert("Session expired. Please log in again.");
      window.location.href = '/authentication/login';
      return;
  }

  setLoading(true);
  try {
    const response = await api.post('/api/auth/web/login/verify', {
      login: loginIdentifier,
      code: fullCode
    });

    localStorage.removeItem('pending_login');

    alert('Verified successfully ✅');
    window.location.href = '/';
  } catch (err: any) {
    const message = err.response?.data?.message || 'Verification failed';
    alert(message);
    setCode(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  } finally {
    setLoading(false);
  }
};
  const handleResend = async () => {
  if (!canResend) return;
  const userLogin = localStorage.getItem('pending_login_identifier');

  try {
    await api.post('/api/auth/resend', {
      login: userLogin
    });
    
    alert('Code resent!');
    setResendTimer(60);
    setCanResend(false);
  } catch (err: any) {
    alert(err.response?.data?.message || 'Failed to resend');
  }
};

  return (
    <div className="flex h-screen items-start justify-center p-3 pt-0 dark:bg-gray-950 bg-gray-50 overflow-hidden">
      <div className="w-full max-w-100 rounded-xl border border-emerald-500/20 bg-white dark:bg-gray-900 shadow-xl shadow-emerald-500/5 px-8 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/30">
            <ShieldCheckIcon className="size-5 text-emerald-500" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight dark:text-white text-gray-900">
            ანგარიშის დადასტურება
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            შეიყვანეთ 6-ნიშნა კოდი
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>

          {/* 6 digit code inputs */}
          <div className="flex justify-between gap-2" onPaste={handlePaste}>
            {code.map((digit, i) => (
              <Input
                key={i}
                ref={el => { inputRefs.current[i] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                autoComplete="one-time-code"
                onChange={e => handleChange(i, e.target.value)}
                onKeyDown={e => handleKeyDown(i, e)}
                className={`
                  h-12 w-full text-center text-lg font-bold
                  border-emerald-500/40 bg-transparent
                  focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500
                  transition-colors
                  ${digit ? 'border-emerald-500 text-emerald-500' : ''}
                `}
              />
            ))}
          </div>

          {/* Resend */}
          <div className="text-center text-sm text-muted-foreground">
            {canResend ? (
              <button
                type="button"
                onClick={handleResend}
                className="font-semibold text-emerald-500 hover:text-emerald-400 transition-colors cursor-pointer"
              >
                ხელახლა გამოგზავნა
              </button>
            ) : (
              <span>
                 კოდის ხელახლა გამოგზავნა{' '}
                <span className="font-semibold text-emerald-500">{resendTimer}s</span>
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || code.join('').length < 6}
            className="cursor-pointer flex w-full justify-center rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Verifying...
              </span>
            ) : (
              'დადასტურება'
            )}
          </button>

          {/* Back link */}
          <p className="text-center text-sm text-muted-foreground">
            <a
              href="/authentication/login"
              className="font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              თავიდან შესვლა
            </a>
          </p>

        </form>
      </div>
    </div>
  )
}

export default AuthLoginVerify
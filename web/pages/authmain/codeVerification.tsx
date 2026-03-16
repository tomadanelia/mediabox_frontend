import React, { useState, useRef, useEffect } from 'react'
import { ShieldCheckIcon } from 'lucide-react'
import { Input } from '../../src/components/ui/input'
import { API_BASE_URL } from '../../src/config'
import api from '@/lib/axios'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../src/store/AuthStore'
import useUIStore from '@/store/ui-store'
const translations = {
  En: {
    topText: "Log in again",
    email:"Email",
    phone: "Mobile number",
    remember: "remember me",
    code: "type 6-digit code",
    account_verification: "account verification",
    resend_code:"resend code",
    confirm: "confirm"
  },
  Ge: {
    password_conf: "გაიმეორეთ პაროლი",
    topText:"თავიდან შესვლა",
    register: "რეგისტრაცია",
    username: "მომხმარებლის სახელი",
    fullname: "სახელი და გვარი",
    code: "შეიყვანეთ 6-ნიშნა კოდი",
    account_verification: "ანგარიშის დადასტურება",
    resend_code: "ხელახლა გამოგზავნა",
    confirm: "დადასტურება",
  },
} as const;
const AuthVerify: React.FC = () => {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])
  const navigate= useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const remember = useAuthStore(state => state.remember);
  const language = useUIStore((state) => state.language);
  const tx= translations[language];

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
    const lastIndex = Math.min(pasted.length, 5)
    inputRefs.current[lastIndex]?.focus()
  }

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  const fullCode = code.join('');
  
  const loginIdentifier = localStorage.getItem('pending_register_login'); 

  setLoading(true);
  try {
    await api.get('/sanctum/csrf-cookie');
    const response = await api.post('/api/auth/web/verify', {
      login: loginIdentifier,
      code: fullCode,
      remember:remember
    });

    localStorage.removeItem('pending_register_login');
    setUser(response.data.user ?? response.data)
    const savedTvCode = localStorage.getItem('tv_pair_code')

if (savedTvCode) {
  localStorage.removeItem('tv_pair_code') 
  navigate(`/tv-register?code=${savedTvCode}`)
} else {
  navigate('/') 
}
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
  
  const userLogin = localStorage.getItem('pending_register_login');

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
    <div className="flex h-screen items-start justify-center mt-5 p-3 pt-0 bg-auth-page-bg overflow-hidden">
      <div className="w-full max-w-100 rounded-xl border border-form-border bg-auth-card-bg shadow-xl shadow-form-shadow px-8 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-form-highlight-subtle border border-form-border">
            <ShieldCheckIcon className="size-5 text-form-highlights" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-auth-heading">
            {tx.account_verification}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tx.code}
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
                  border-form-border bg-transparent
                  focus-visible:ring-form-border focus-visible:border-form-highlights
                  transition-colors
                  ${digit ? 'border-form-highlights text-form-highlights' : ''}
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
                className="font-semibold text-form-highlights hover:text-form-highlights transition-colors cursor-pointer"
              >
                {tx.resend_code}
              </button>
            ) : (
              <span>
                 {tx.resend_code}{' '}
                <span className="font-semibold text-form-highlights">{resendTimer}s</span>
              </span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || code.join('').length < 6}
            className="cursor-pointer flex w-full justify-center rounded-lg bg-form-highlights px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-form-shadow hover:bg-button-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              tx.confirm
            )}
          </button>

          {/* Back link */}
          <p className="text-center text-sm text-muted-foreground">
            <a
              href="/authentication/login"
              className="font-semibold text-form-highlights hover:text-button-hover transition-colors"
            >
              {tx.topText}
            </a>
          </p>

        </form>
      </div>
    </div>
  )
}

export default AuthVerify
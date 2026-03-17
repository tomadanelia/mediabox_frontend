import React, { useState, useRef } from 'react'
import { EyeIcon, EyeOffIcon, ArrowLeftIcon, CheckCircleIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'
import {Link} from 'react-router-dom'

const PasswordInput = ({
  placeholder,
  autoComplete = 'new-password',
  ...props
}: { placeholder?: string; autoComplete?: string } & React.ComponentProps<typeof Input>) => {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative w-full">
      <Input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="pr-9 border border-form-border bg-transparent focus-visible:ring-form-border focus-visible:border-form-highlights placeholder:text-muted-foreground/50 transition-colors"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible(v => !v)}
        className="absolute inset-y-0 right-0 cursor-pointer text-eye-icon hover:text-form-highlights hover:bg-transparent"
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        <span className="sr-only">{visible ? 'Hide' : 'Show'} password</span>
      </Button>
    </div>
  )
}

// ── 6-digit OTP input ────────────────────────────────────────────────────────
const OtpInput = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => {
  const inputsRef = useRef<(HTMLInputElement | null)[]>([])

  const handleKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (value[i]) {
        const next = value.split('')
        next[i] = ''
        onChange(next.join(''))
      } else if (i > 0) {
        const next = value.split('')
        next[i - 1] = ''
        onChange(next.join(''))
        inputsRef.current[i - 1]?.focus()
      }
      e.preventDefault()
    }
  }

  const handleChange = (i: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const char = e.target.value.replace(/\D/g, '').slice(-1)
    if (!char) return
    const next = value.padEnd(6, ' ').split('')
    next[i] = char
    const joined = next.join('').trimEnd()
    onChange(joined)
    if (i < 5) inputsRef.current[i + 1]?.focus()
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) {
      onChange(pasted)
      inputsRef.current[Math.min(pasted.length, 5)]?.focus()
    }
    e.preventDefault()
  }

  return (
    <div className="flex gap-2 justify-between">
      {Array.from({ length: 6 }).map((_, i) => (
        <input
          key={i}
          ref={el => { inputsRef.current[i] = el }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ''}
          onChange={e => handleChange(i, e)}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          className={`
            h-12 w-full rounded-lg border text-center text-lg font-bold
            bg-transparent outline-none transition-all
            ${value[i]
              ? 'border border-form-highlights text-form-highlights shadow-sm shadow-form-shadow'
              : 'border border-form-border text-auth-heading'
            }
            focus:border-form-highlights focus:ring-2 focus:ring-form-border
            bg-auth-card-bg
          `}
        />
      ))}
    </div>
  )
}

// ── Password strength meter ──────────────────────────────────────────────────
const strengthLabel = (score: number) =>
  ['', 'სუსტი', 'საშუალო', 'კარგი', 'ძლიერი'][score] ?? ''

const strengthColor = (score: number) =>
  ['', 'bg-red-500', 'bg-amber-400', 'bg-blue-500', 'bg-emerald-500'][score] ?? ''

const getStrength = (pw: string): number => {
  if (!pw) return 0
  let score = 0
  if (pw.length >= 8) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++
  return score
}

// ── Main component ───────────────────────────────────────────────────────────
const ResetPassword: React.FC = () => {
  const [otp, setOtp] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const login =
    typeof window !== 'undefined'
      ? localStorage.getItem('pending_reset_login') ?? ''
      : ''

  const strength = getStrength(password)
  const passwordsMatch = password && passwordConfirmation && password === passwordConfirmation

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (otp.length < 6) {
      setError('გთხოვთ შეიყვანოთ 6-ნიშნა კოდი')
      return
    }
    if (password.length < 8) {
      setError('პაროლი უნდა შეიცავდეს მინიმუმ 8 სიმბოლოს')
      return
    }
    if (password !== passwordConfirmation) {
      setError('პაროლები არ ემთხვევა')
      return
    }

    setLoading(true)
    try {
      await api.post('/api/auth/password/reset', {
        login,
        code: otp,
        password,
        password_confirmation: passwordConfirmation,
      })
      setSuccess(true)
      localStorage.removeItem('pending_reset_login')
      setTimeout(() => {
        window.location.href = '/authentication/login'
      }, 2500)
    } catch (err: any) {
      setError(err.response?.data?.message || 'პაროლის შეცვლა ვერ მოხერხდა. სცადეთ თავიდან.')
    } finally {
      setLoading(false)
    }
  }

  // ── Success state ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="flex h-screen items-start justify-center p-3 pt-0 bg-auth-page-bg overflow-hidden">
        <div className="w-full max-w-100 rounded-xl border border-form-border bg-auth-card-bg  shadow-form-shadow px-8 py-12 text-center">
          <div className="mb-5 flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full border border-form-border bg-form-highlight-subtle">
              <CheckCircleIcon className="size-8 text-form-highlights" />
            </div>
          </div>
          <h2 className="text-xl font-bold text-auth-heading">პაროლი წარმატებით შეიცვალა!</h2>
          <p className="mt-2 text-sm text-muted-foreground">გადამისამართება შესვლის გვერდზე…</p>
          <div className="mt-6 h-1 w-full overflow-hidden rounded-full bg-form-highlight-subtle">
            <div className="h-full bg-form-highlights rounded-full animate-[grow_2.5s_linear_forwards]" style={{ width: '100%', animationName: 'grow' }} />
          </div>
          <style>{`@keyframes grow { from { width:0% } to { width:100% } }`}</style>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen items-start justify-center  p-3 pt-0 bg-auth-page-bg overflow-hidden">
      <div className="w-full max-w-100 mt-6 rounded-xl border border-form-border bg-auth-card-bg shadow-xl shadow-form-shadow px-8 py-10">

        {/* Back link */}
        <Link
          to="/authentication/forgot-password"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-form-highlights transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" />
          კოდის თავიდან გამოგზავნა
        </Link>

        {/* Header */}
        <div className="mb-7 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-auth-heading">
            ახალი პაროლის დაყენება
          </h1>
          {login && (
            <p className="mt-1.5 text-sm text-muted-foreground">
              კოდი გაიგზავნა:{' '}
              <span className="font-medium text-form-highlights">{login}</span>
            </p>
          )}
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>

          {/* OTP */}
          <div className="space-y-2">
            <OtpInput value={otp} onChange={setOtp} />
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-form-border" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-auth-card-bg text-muted-foreground">ახალი პაროლი</span>
            </div>
          </div>

          {/* New password */}
          <div className="space-y-1.5">
            <PasswordInput
              placeholder="ახალი პაროლი"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {password.length > 0 && (
              <div className="space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                        i <= strength ? strengthColor(strength) : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs font-medium ${strengthColor(strength).replace('bg-', 'text-')}`}>
                  {strengthLabel(strength)}
                </p>
              </div>
            )}
          </div>

          {/* Confirm password */}
          <div className="space-y-1">
            <PasswordInput
              placeholder="გაიმეორეთ პაროლი"
              autoComplete="new-password"
              value={passwordConfirmation}
              onChange={e => setPasswordConfirmation(e.target.value)}
            />
            {passwordConfirmation.length > 0 && (
              <p className={`text-xs flex items-center gap-1 ${passwordsMatch ? 'text-emerald-500' : 'text-red-500'}`}>
                {passwordsMatch ? (
                  <>
                    <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    პაროლები ემთხვევა
                  </>
                ) : (
                  <>
                    <svg className="size-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                    პაროლები არ ემთხვევა
                  </>
                )}
              </p>
            )}
          </div>

          {/* Error message */}
          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <svg className="size-3.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
              </svg>
              {error}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg bg-form-highlights px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-form-shadow hover:bg-button-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                შენახვა...
              </>
            ) : (
              'პაროლის შეცვლა'
            )}
          </button>

        </form>
      </div>
    </div>
  )
}

export default ResetPassword
import React, { useState } from 'react'
import { MailIcon, PhoneIcon, ArrowRightIcon, ArrowLeftIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {Link} from 'react-router-dom'
import api from '@/lib/axios'

type LoginMethod = 'email' | 'phone'

const IconInput = ({
  icon: Icon,
  placeholder,
  type = 'text',
  ...props
}: {
  icon: React.ElementType
  placeholder: string
  type?: string
} & React.ComponentProps<typeof Input>) => (
  <div className="relative w-full">
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-emerald-500">
      <Icon className="size-4" />
    </div>
    <Input
      type={type}
      placeholder={placeholder}
      className="pl-9 border-emerald-500/40 bg-transparent focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 placeholder:text-muted-foreground/50 transition-colors"
      {...props}
    />
  </div>
)

const ForgotPassword: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
  const [login, setLogin] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleMethodSwitch = (method: LoginMethod) => {
    setLoginMethod(method)
    setLogin('')
    setError('')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!login.trim()) {
      setError(loginMethod === 'email' ? 'გთხოვთ შეიყვანოთ ელ-ფოსტა' : 'გთხოვთ შეიყვანოთ მობილური ნომერი')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res=await api.post('/api/auth/password/forgot', { login })
      alert("verification code is"+res.data.code?res.data.code:"");
      localStorage.setItem('pending_reset_login', login)
      window.location.href = '/authentication/reset-password'
    } catch (err: any) {
      setError(err.response?.data?.message || 'მოთხოვნა ვერ შესრულდა. სცადეთ მოგვიანებით.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-start mt-5 justify-center p-3 pt-0 dark:bg-gray-950 bg-gray-50 overflow-hidden">
      <div className="w-full max-w-100 rounded-xl border border-emerald-500/20 bg-white dark:bg-gray-900 shadow-xl shadow-emerald-500/5 px-8 py-10">

        {/* Back link */}
        <Link
          to="/authentication/login"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-emerald-500 transition-colors"
        >
          <ArrowLeftIcon className="size-3.5" />
          შესვლა
        </Link>

        {/* Icon badge */}
        <div className="mb-6 flex justify-center">
          <div className="flex size-14 items-center justify-center rounded-full border border-emerald-500/20 bg-emerald-500/8 shadow-inner shadow-emerald-500/10">
            <svg
              className="size-6 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight dark:text-white text-gray-900">
            პაროლის აღდგენა
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
            შეიყვანეთ თქვენი {loginMethod === 'email' ? 'ელ-ფოსტის მისამართი' : 'მობილური ნომერი'} და<br />
            გამოგიგზავნით დადასტურების კოდს.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Email / Phone toggle */}
          <div className="flex rounded-lg overflow-hidden border border-emerald-500/30 text-sm font-medium">
            <button
              type="button"
              onClick={() => handleMethodSwitch('email')}
              className={`cursor-pointer flex-1 py-2 transition-all ${
                loginMethod === 'email'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-transparent dark:text-gray-400 text-gray-500 hover:bg-emerald-500/5'
              }`}
            >
              ელ-ფოსტა
            </button>
            <button
              type="button"
              onClick={() => handleMethodSwitch('phone')}
              className={`cursor-pointer flex-1 py-2 transition-all ${
                loginMethod === 'phone'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-transparent dark:text-gray-400 text-gray-500 hover:bg-emerald-500/5'
              }`}
            >
              მობილური
            </button>
          </div>

          {/* Input */}
          {loginMethod === 'email' ? (
            <IconInput
              icon={MailIcon}
              placeholder="ელ-ფოსტა"
              type="email"
              autoComplete="email"
              value={login}
              onChange={e => { setLogin(e.target.value); setError('') }}
            />
          ) : (
            <IconInput
              icon={PhoneIcon}
              placeholder="მობილური ნომერი"
              type="tel"
              autoComplete="tel"
              value={login}
              onChange={(e:any ) => { setLogin(e.target.value); setError('') }}
            />
          )}

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
            className="mt-2 cursor-pointer flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                იგზავნება...
              </>
            ) : (
              <>
                კოდის გაგზავნა
                <ArrowRightIcon className="size-4" />
              </>
            )}
          </button>

          {/* Sign in link */}
          <p className="text-center text-sm text-muted-foreground pt-1">
            <Link to="/authentication/login" className="font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">
              შესვლა
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}

export default ForgotPassword
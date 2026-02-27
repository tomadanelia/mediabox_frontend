import React, { useState } from 'react'
import { UserIcon, MailIcon, PhoneIcon, EyeIcon, EyeOffIcon, LogInIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import CheckboxDemo from '../../../src/components/shadcn-studio/checkbox/checkbox-01'
import { API_BASE_URL } from '@/config'
import api from '@/lib/axios'
import { set } from 'date-fns'

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

const PasswordInput = ({
  placeholder = 'პაროლი',
  autoComplete = 'current-password',
  ...props
}: { placeholder?: string; autoComplete?: string } & React.ComponentProps<typeof Input>) => {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative w-full">
      <Input
        type={visible ? 'text' : 'password'}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="pr-9 border-emerald-500/40 bg-transparent focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500 placeholder:text-muted-foreground/50 transition-colors"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible(v => !v)}
        className="absolute inset-y-0 right-0 text-emerald-500/70 hover:text-emerald-500 hover:bg-transparent"
      >
        {visible ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        <span className="sr-only">{visible ? 'Hide' : 'Show'} password</span>
      </Button>
    </div>
  )
}

type LoginMethod = 'email' | 'phone'

const AuthLog: React.FC = () => {
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email')
  const [form, setForm] = useState({
    login: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (name: string, value: string) =>
    setForm(prev => ({ ...prev, [name]: value }))

  // clear login field when switching method so stale value doesn't get sent
  const handleMethodSwitch = (method: LoginMethod) => {
    setLoginMethod(method)
    setForm(prev => ({ ...prev, login: '' }))
  }

  const getCookie = (name: string) => {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return decodeURIComponent(parts.pop()?.split(';').shift() || '');
};

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    await api.get('/sanctum/csrf-cookie');
    const res = await api.post('/api/auth/login', form);
    
    localStorage.setItem('pending_login', form.login);
    alert('Login successful! Response: ' + JSON.stringify(res.data.code));
    setTimeout(() => {
      window.location.href = '/authentication/login-verify';
    }, 1000);
  } catch (err: any) {
if (err.response?.status === 403 && err.response?.data?.message === 'Account not verified.') {
      localStorage.setItem('pending_login', form.login);
      alert('Account unverified. New OTP Sent! Code: ' + err.response.data.code);
      
      window.location.href = '/authentication/login-verify';
      return;
    }
    alert(err.response?.data?.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="flex h-screen items-start justify-center p-3 pt-0 dark:bg-gray-950 bg-gray-50 overflow-hidden">
      <div className="w-full max-w-100 rounded-xl border border-emerald-500/20 bg-white dark:bg-gray-900 shadow-xl shadow-emerald-500/5 px-8 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
        
          <h1 className="text-2xl font-bold tracking-tight dark:text-white text-gray-900">
            Welcome back
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            შედით თქვენს ანგარიშში
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

          {/* Email or Phone field */}
          {loginMethod === 'email' ? (
            <IconInput
              icon={MailIcon}
              placeholder="ელ-ფოსტა"
              type="email"
              name="login"
              autoComplete="email"
              value={form.login}
              onChange={e => handleChange('login', e.target.value)}
            />
          ) : (
            <IconInput
              icon={PhoneIcon}
              placeholder="მობილური ნომერი"
              type="tel"
              name="login"
              autoComplete="tel"
              value={form.login}
              onChange={e => handleChange('login', e.target.value)}
            />
          )}

          {/* Password */}
          <PasswordInput
            placeholder="პაროლი"
            name="password"
            value={form.password}
            onChange={e => handleChange('password', e.target.value)}
          />

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <CheckboxDemo />
              <span className="text-sm text-muted-foreground">დამიმახსოვრე</span>
            </div>
            <a
              href="#"
              className="text-sm font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
            >
              დაგავიწყდა პაროლი?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 cursor-pointer flex w-full justify-center rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                შესვლა...
              </span>
            ) : (
              'შესვლა'
            )}
          </button>

          {/* Divider */}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-emerald-500/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-muted-foreground">
                ან გააგრძელეთ
              </span>
            </div>
          </div>

          {/* Social buttons */}
          <div className="grid grid-cols-2 gap-3">
            <a
              href="#"
              className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-transparent px-3 py-2 text-sm font-semibold dark:text-gray-300 text-gray-700 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all"
            >
              <svg className="h-4 w-4 fill-[#1D9BF0]" viewBox="0 0 20 20">
                <path d="M6.29 18.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0020 3.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.073 4.073 0 01.8 7.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 010 16.407a11.616 11.616 0 006.29 1.84" />
              </svg>
              Twitter
            </a>
            <a
              href="#"
              className="flex items-center justify-center gap-2 rounded-lg border border-emerald-500/20 bg-transparent px-3 py-2 text-sm font-semibold dark:text-gray-300 text-gray-700 hover:bg-emerald-500/5 hover:border-emerald-500/40 transition-all"
            >
              <svg className="h-4 w-4 dark:fill-white fill-[#24292F]" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z" clipRule="evenodd" />
              </svg>
              GitHub
            </a>
          </div>

          {/* Sign up link */}
          <p className="text-center text-sm text-muted-foreground pt-1">
            არ გაქვთ ანგარიში?{' '}
            <a href="/authentication/register" className="font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">
              დარეგისტრირდით
            </a>
          </p>

        </form>
      </div>
    </div>
  )
}

export default AuthLog
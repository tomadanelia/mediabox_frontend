import React, { useState } from 'react'
import { UserIcon, MailIcon, PhoneIcon, EyeIcon, EyeOffIcon, LogInIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import CheckboxDemo from '../../../src/components/shadcn-studio/checkbox/checkbox-01'
import { API_BASE_URL } from '@/config'
import api from '@/lib/axios'
import { set } from 'date-fns'
import useAuthStore from '@/store/AuthStore'

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
  const setRemember = useAuthStore(state => state.setRemember);
  const remember = useAuthStore(state => state.remember);
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
    <div className="flex h-screen mt-8 items-start justify-center p-3 pt-0 dark:bg-gray-950 bg-gray-50 overflow-hidden">
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
              <input className="mt-2 cursor-pointer" type='checkbox' checked={remember} onChange={e => setRemember(e.target.checked)} />
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
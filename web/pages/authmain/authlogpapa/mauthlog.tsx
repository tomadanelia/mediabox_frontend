import React, { useState } from 'react'
import {  MailIcon, PhoneIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import api from '@/lib/axios'
import useAuthStore from '@/store/AuthStore'
import {Link} from 'react-router-dom'
import useUIStore from '@/store/ui-store'
const translations = {
  En: {
    welcome: "Welcome back",
    topText: "Log in your account",
    email:"Email",
    phone: "Mobile number",
    forgot: "forget the password?",
    remember: "remember me",
    no_account:"do not have an account?",
    register: "Sign Up",
    password: "password",
  },
  Ge: {
    password: "პაროლი",
    welcome: "Welcome back",
    topText:"შედით თქვენს ანგარიშში",
    email:"ელ-ფოსტა",
    phone: "მობილური",
    forgot: "დაგავიწყდა პაროლი?",
    remember: "დამიმახსოვრე",
    no_account:"არ გაქვთ ანგარიში?",
    register: "დარეგისტრირდით",
  },
} as const;
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
    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-form-highlights">
      <Icon className="size-4" />
    </div>
    <Input
      type={type}
      placeholder={placeholder}
      className="pl-9 border-emerald-500/40 bg-transparent focus-visible:ring-emerald-500/30 focus-visible:border-form-highlights placeholder:text-muted-foreground/50 transition-colors"
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
        className="pr-9 border-emerald-500/40 bg-transparent focus-visible:ring-emerald-500/30 focus-visible:border-form-highlights placeholder:text-muted-foreground/50 transition-colors"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible(v => !v)}
        className="cursor-pointer absolute inset-y-0 right-0 text-emerald-500/70 hover:text-form-highlights hover:bg-transparent"
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
  const language = useUIStore((state) => state.language);
  const tx= translations[language];

  const handleChange = (name: string, value: string) =>
    setForm(prev => ({ ...prev, [name]: value }))

  const handleMethodSwitch = (method: LoginMethod) => {
    setLoginMethod(method)
    setForm(prev => ({ ...prev, login: '' }))
  }


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
    <div className="flex h-screen  items-start justify-center p-3 pt-0 dark:bg-gray-950 bg-gray-50 overflow-hidden">
      <div className="w-full max-w-100 mt-9 rounded-xl border border-emerald-500/20 bg-white dark:bg-gray-900 shadow-xl shadow-emerald-500/5 px-8 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
        
          <h1 className="text-2xl font-bold tracking-tight dark:text-white text-gray-900">
            {tx.welcome}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tx.topText}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Email / Phone toggle */}
          <div className="flex rounded-lg overflow-hidden border form-highlights text-sm font-medium">
            <button
              type="button"
              onClick={() => handleMethodSwitch('email')}
              className={`cursor-pointer flex-1 py-2 transition-all ${
                loginMethod === 'email'
                  ? 'bg-form-highlights text-white'
                  : 'bg-transparent dark:text-gray-400 text-gray-500 hover:bg-emerald-500/5'
              }`}
            >
            {tx.email}
            </button>
            <button
              type="button"
              onClick={() => handleMethodSwitch('phone')}
              className={`cursor-pointer flex-1 py-2 transition-all ${
                loginMethod === 'phone'
                  ? 'bg-form-highlights text-white'
                  : 'bg-transparent dark:text-gray-400 text-gray-500 hover:bg-emerald-500/5'
              }`}
            >
              {tx.phone}
            </button>
          </div>

          {/* Email or Phone field */}
          {loginMethod === 'email' ? (
            <IconInput
              icon={MailIcon}
              placeholder={tx.email}
              type="email"
              name="login"
              autoComplete="email"
              value={form.login}
              onChange={(e: { target: { value: string } }) => handleChange('login', e.target.value)}
            />
          ) : (
            <IconInput
              icon={PhoneIcon}
              placeholder={tx.phone}
              type="tel"
              name="login"
              autoComplete="tel"
              value={form.login}
              onChange={(e: { target: { value: string } }) => handleChange('login', e.target.value)}
            />
          )}

          {/* Password */}
          <PasswordInput
            placeholder={tx.password}
            name="password"
            value={form.password}
            onChange={(e: { target: { value: string } }) => handleChange('password', e.target.value)}
          />

          {/* Remember me + Forgot password */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <input className="mt-2 cursor-pointer" type='checkbox' checked={remember} onChange={e => setRemember(e.target.checked)} />
              <span className="text-sm text-muted-foreground">{tx.remember}</span>
            </div>
            <Link
              to="/authentication/forgot-password"
              className="text-sm font-semibold text-form-highlights hover:text-emerald-400 transition-colors"
            >
             {tx.forgot}
            </Link>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 cursor-pointer flex w-full justify-center rounded-lg bg-form-highlights px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
            {tx.no_account}{' '}
            <Link to="/authentication/register" className="font-semibold text-form-highlights hover:text-emerald-400 transition-colors">
              {tx.register}
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}

export default AuthLog
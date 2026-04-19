import React, { useState } from 'react'
import {MailIcon, PhoneIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { Input } from '../../../src/components/ui/input'
import { Button } from '../../../src/components/ui/button'
import api from '../../../src/lib/axios'
import useAuthStore from '../../../src/store/AuthStore'
import useUIStore from '../../../src/store/ui-store'
import {Link}  from "react-router-dom"
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
      className="pl-9 border border-form-border bg-transparent focus-visible:ring-form-border focus-visible:border-form-highlights placeholder:text-muted-foreground/50 transition-colors"
      {...props}
    />
  </div>
)

const PasswordInput = ({
  placeholder = 'Password',
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
        className="pr-9 border-form-border bg-transparent focus-visible:ring-form-border focus-visible:border-form-highlights placeholder:text-muted-foreground/50 transition-colors"
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => setVisible(v => !v)}
        className="absolute cursor-pointer inset-y-0 right-0 text-eye-icon hover:text-form-highlights hover:bg-transparent"
      >
        {visible ? <EyeOffIcon className="size-4 " /> : <EyeIcon className="size-4" />}
        <span className="sr-only">{visible ? 'Hide' : 'Show'} password</span>
      </Button>
    </div>
  )
}
const translations = {
  En: {
    welcome: "Welcome back",
    topText: "Log in",
    email:"Email",
    phone: "Mobile number",
    forgot: "forget the password?",
    remember: "remember me",
    already_account:"already have an account?",
    register: "Sign Up",
    password: "password",
    password_conf: "confirm password",
    fullname:"full name",
    username: "username"
  },
  Ge: {
    password_conf: "გაიმეორეთ პაროლი",
    password: "პაროლი",
    welcome: "Welcome back",
    topText:"შესვლა",
    email:"ელ-ფოსტა",
    phone: "მობილური",
    forgot: "დაგავიწყდა პაროლი?",
    already_account:"უკვე გაქვთ ანგარიში?",
    register: "რეგისტრაცია",
    username: "მომხმარებლის სახელი",
    fullname: "სახელი და გვარი"
  },
} as const;
type ContactMethod = 'email' | 'phone'

const AuthReg: React.FC = () => {
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email')
  const [form, setForm] = useState({
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)
  const language = useUIStore((state) => state.language);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const tx= translations[language];
  const handleChange = (name: string, value: string) =>
    setForm(prev => ({ ...prev, [name]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  if (form.password !== form.password_confirmation) {
    alert('Passwords do not match')
    return
  }
  setLoading(true)

  try {
    // 1. Get CSRF Cookie (Use relative path)
    await api.get('/sanctum/csrf-cookie');

    const payload = {
      password: form.password,
      password_confirmation: form.password_confirmation,
      ...(contactMethod === 'email' ? { email: form.email } : { phone: form.phone }),
    }

    const res = await api.post('/api/auth/register', payload);
    contactMethod==='email' ? localStorage.setItem('pending_register_login', form.email) : localStorage.setItem('pending_register_login', form.phone);

   const data = res.data;

console.log('Full response:', data)

if (data.code) {
  console.log('Response code:', data.code)
}
   window.location.href = '/authentication/verify'
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Registration failed';
    alert(message);
  } finally {
    setLoading(false)
  }
}

  return (
<div className="flex min-h-svh items-start justify-center  p-3 pt-0 bg-auth-page-bg overflow-hidden">
        <div className="w-full max-w-100  mt-6 rounded-xl border border-form-border bg-auth-card-bg  shadow-form-shadow px-8 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight text-auth-heading">
            {tx.register}
          </h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Email / Phone toggle */}
          <div className="flex rounded-lg overflow-hidden border border-form-border text-sm font-medium">
            <button
              type="button"
              onClick={() => setContactMethod('email')}
              className={`cursor-pointer flex-1 py-2 transition-all ${
                contactMethod === 'email'
                  ? 'bg-form-highlights text-white'
                  : 'bg-transparent text-muted-foreground hover:bg-form-highlight-subtle'
              }`}
            >
              {tx.email}
            </button>
            <button
              type="button"
              onClick={() => setContactMethod('phone')}
              className={`cursor-pointer flex-1 py-2 transition-all ${
                contactMethod === 'phone'
                  ? 'bg-form-highlights text-white'
                  : 'bg-transparent text-muted-foreground hover:bg-form-highlight-subtle'
              }`}
            >
              {tx.phone}
            </button>
          </div>
          {/* Email or Phone */}
          {contactMethod === 'email' ? (
            <IconInput
              icon={MailIcon}
              placeholder={tx.email}
              autoComplete="email"
              type="email"
              name="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
            />
          ) : (
            <IconInput
              icon={PhoneIcon}
              placeholder={tx.phone}
              type="tel"
              name="phone"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
            />
          )}

          {/* Password */}
          <PasswordInput
            placeholder={tx.password}
            name="password"
            value={form.password}
            onChange={e => handleChange('password', e.target.value)}
          />

          {/* Confirm Password */}
          <PasswordInput
            placeholder={tx.password_conf}
            name="password_confirmation"
            value={form.password_confirmation}
            onChange={e => handleChange('password_confirmation', e.target.value)}
          />

          {/* Terms */}
          <div className="flex items-center gap-2 pt-1">
            {/* Terms */}
<div className="flex items-center gap-2 pt-1">
  <input 
    className="mt-1 cursor-pointer" 
    type='checkbox' 
    checked={termsAccepted} 
    onChange={e => setTermsAccepted(e.target.checked)} 
  />
  <span className="text-sm text-muted-foreground">
    <a href="#" className="text-sm text-form-highlights hover:text-button-hover transition-colors whitespace-nowrap">
      გაეცანი წესებსა და პირობებს
    </a>
  </span>
</div>
            <span className="text-muted-foreground">
             <a href="#" className="text-sm text-form-highlights hover:text-button-hover transition-colors whitespace-nowrap">
      გაეცანი წესებსა და პირობებს
    </a>
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full cursor-pointer justify-center rounded-lg bg-form-highlights px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-form-shadow hover:bg-button-hover active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin size-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                </svg>
                Creating account...
              </span>
            ) : (
              tx.register
            )}
          </button>

          {/* Sign in link */}
          <p className="text-center text-sm text-muted-foreground pt-1">
            {tx.already_account}{' '}
            <Link to="/authentication/login" className="font-semibold text-form-highlights hover:text-button-hover transition-colors">
              {tx.topText}
            </Link>
          </p>

        </form>
      </div>
    </div>
  )
}

export default AuthReg
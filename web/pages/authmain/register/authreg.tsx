import React, { useState } from 'react'
import { UserIcon, MailIcon, PhoneIcon, EyeIcon, EyeOffIcon } from 'lucide-react'
import { Input } from '../../../src/components/ui/input'
import { Button } from '../../../src/components/ui/button'
import CheckboxDemo from '../../../src/components/shadcn-studio/checkbox/checkbox-01'
import api from '@/lib/axios'

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

type ContactMethod = 'email' | 'phone'

const AuthReg: React.FC = () => {
  const [contactMethod, setContactMethod] = useState<ContactMethod>('email')
  const [form, setForm] = useState({
    full_name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)

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
      full_name: form.full_name,
      username: form.username,
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
  alert('Verification code: ' + data.code);}
   window.location.href = '/authentication/verify'
  } catch (err: any) {
    const message = err.response?.data?.message || err.message || 'Registration failed';
    alert(message);
  } finally {
    setLoading(false)
  }
}

  return (
<div className="flex min-h-svh items-start justify-center p-3 pt-0 dark:bg-gray-950 bg-gray-50 overflow-hidden">
        <div className="w-full max-w-100  rounded-xl border border-emerald-500/20 bg-white dark:bg-gray-900 shadow-xl shadow-emerald-500/5 px-8 py-10">

        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight dark:text-white text-gray-900">
            რეგისტრაცია
          </h1>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>

          {/* Email / Phone toggle */}
          <div className="flex rounded-lg overflow-hidden border border-emerald-500/30 text-sm font-medium">
            <button
              type="button"
              onClick={() => setContactMethod('email')}
              className={`cursor-pointer flex-1 py-2 transition-all ${
                contactMethod === 'email'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-transparent dark:text-gray-400 text-gray-500 hover:bg-emerald-500/5'
              }`}
            >
              ელ-ფოსტა
            </button>
            <button
              type="button"
              onClick={() => setContactMethod('phone')}
              className={`cursor-pointer flex-1 py-2 transition-all ${
                contactMethod === 'phone'
                  ? 'bg-emerald-500 text-white'
                  : 'bg-transparent dark:text-gray-400 text-gray-500 hover:bg-emerald-500/5'
              }`}
            >
              მობილური
            </button>
          </div>

          {/* Full Name */}
          <IconInput
            icon={UserIcon}
            placeholder="სახელი და გვარი"
            autoComplete="name"

            name="full_name"
            value={form.full_name}
            onChange={e => handleChange('full_name', e.target.value)}
          />

          {/* Username */}
          <IconInput
            icon={UserIcon}
            placeholder="მომხმარებლის სახელი"
            autoComplete="username"

            name="username"
            value={form.username}
            onChange={e => handleChange('username', e.target.value)}
          />

          {/* Email or Phone */}
          {contactMethod === 'email' ? (
            <IconInput
              icon={MailIcon}
              placeholder="ელ-ფოსტა"
              autoComplete="email"
              type="email"
              name="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
            />
          ) : (
            <IconInput
              icon={PhoneIcon}
              placeholder="ტელეფონის ნომერი"
              type="tel"
              name="phone"
              value={form.phone}
              onChange={e => handleChange('phone', e.target.value)}
            />
          )}

          {/* Password */}
          <PasswordInput
            placeholder="პაროლი"
            name="password"
            value={form.password}
            onChange={e => handleChange('password', e.target.value)}
          />

          {/* Confirm Password */}
          <PasswordInput
            placeholder="გაიმეორეთ პაროლი"
            name="password_confirmation"
            value={form.password_confirmation}
            onChange={e => handleChange('password_confirmation', e.target.value)}
          />

          {/* Terms */}
          <div className="flex items-center gap-2 pt-1">
            <CheckboxDemo />
            <span className="text-sm text-muted-foreground">
              I agree to the{' '}
              <a href="#" className="font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">
                Terms
              </a>{' '}
              &{' '}
              <a href="#" className="font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">
                Privacy Policy
              </a>
            </span>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full cursor-pointer justify-center rounded-lg bg-emerald-500 px-3 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-400 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
              'რეგისტრაცია'
            )}
          </button>

          {/* Sign in link */}
          <p className="text-center text-sm text-muted-foreground pt-1">
            უკვე დარეგისტრირებული ხართ?{' '}
            <a href="/authentication/login" className="font-semibold text-emerald-500 hover:text-emerald-400 transition-colors">
              შესვლა
            </a>
          </p>

        </form>
      </div>
    </div>
  )
}

export default AuthReg
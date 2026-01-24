import React, { useState } from 'react'
import InputLabelDemo from '@/components/shadcn-studio/input/input-02'
import InputStartIconDemo from '@/components/shadcn-studio/input/input-14'
import InputPasswordStrengthDemo from '@/components/shadcn-studio/input/input-46'
import CheckboxDemo from '@/components/shadcn-studio/checkbox/checkbox-01'
import InputPasswordDemo from '@/components/shadcn-studio/input/input-26'

const AuthReg: React.FC = () => {
  const [form, setForm] = useState({
    username: '',
    full_name: '',
    email: '',
    password: '',
    password_confirmation: '',
  })
  const [loading, setLoading] = useState(false)

  const handleChange = (name: string, value: string) => {
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('http://159.89.20.100/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.message || 'Registration failed')

      alert('Registered successfully ✅')
      console.log(data)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
   <div className="mt-2 mb-10 dark:bg-gray-700 bg-white rounded-sm sm:mx-auto sm:w-[400px] sm:max-w-[480px]">
            <div className=" py-5 shadow sm:rounded-lg sm:px-5">
        <div className="space-y-3" onSubmit={handleSubmit}>

          {/* Username */}
          <div className="">
            <InputLabelDemo
              name="username"
              value={form.username}
              onChange={e => handleChange('username', e.target.value)}
            />
          </div>
          {/* Email */}
          <div className="mt-2">
            <InputStartIconDemo
              name="email"
              value={form.email}
              onChange={e => handleChange('email', e.target.value)}
            />
          </div>

          {/* Password */}
          <div className="mt-2">
            <InputPasswordStrengthDemo
              name="password"
              value={form.password}
              onChange={e => handleChange('password', e.target.value)}
            />
          </div>

          {/* Password Confirmation */}
          <div className="mt-2">
            <InputPasswordDemo
              name="password_confirmation"
              value={form.password_confirmation}
              onChange={e =>
                handleChange('password_confirmation', e.target.value)
              }
            />
          </div>

          <div className="flex items-center justify-between">
            <CheckboxDemo />
            <a
              href="#"
              className="text-sm font-semibold text-indigo-600 hover:text-indigo-500"
            >
              Forgot password?
            </a>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 disabled:opacity-50"
          >
            {loading ? 'Signing up...' : 'Sign up'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default AuthReg

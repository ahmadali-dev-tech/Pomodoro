import { Link } from 'react-router-dom'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import PasswordInput from '@/components/ui/PasswordInput'
import AuthLayout from '@/components/layout/AuthLayout'
import { supabase } from '@/lib/supabase'

const friendly = (message = '') => {
  if (/invalid login credentials/i.test(message)) return 'That email and password don’t match an account.'
  if (/email not confirmed/i.test(message)) return 'Confirm your email first. Check your inbox for the confirmation link.'
  if (/failed to fetch|network/i.test(message)) return 'Couldn’t reach the server. Check your connection and try again.'
  return message || 'Couldn’t sign you in. Try again.'
}

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const submit = async (event) => {
    event.preventDefault()
    const next = {}
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
      if (error) setErrors({ form: friendly(error.message) })
      // On success the auth listener updates the user and the router redirects.
    } catch (error) {
      setErrors({ form: friendly(error?.message) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthLayout title="Sign in" subtitle="Pick up where you left off. Your tasks and sessions sync to your account." footer={<>No account? <Link to="/register" className="font-medium text-accent hover:underline">Create one</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Email" error={errors.email}><Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></Field>
        <Field label="Password" error={errors.password}><PasswordInput autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} /></Field>
        {errors.form && <p role="alert" className="text-[13px] text-danger">{errors.form}</p>}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button>
      </form>
    </AuthLayout>
  )
}

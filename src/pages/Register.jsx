import { Link } from 'react-router-dom'
import { useState } from 'react'
import Button from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import PasswordInput from '@/components/ui/PasswordInput'
import AuthLayout from '@/components/layout/AuthLayout'
import { supabase } from '@/lib/supabase'

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [needsConfirmation, setNeedsConfirmation] = useState(false)
  const set = (key) => (event) => setForm(f => ({ ...f, [key]: event.target.value }))

  const submit = async (event) => {
    event.preventDefault()
    const next = {}
    if (!form.name.trim()) next.name = 'Enter your name.'
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) next.email = 'Enter a valid email address.'
    if (form.password.length < 6) next.password = 'Use at least 6 characters.'
    if (form.confirmPassword !== form.password) next.confirmPassword = 'Passwords don’t match.'
    setErrors(next)
    if (Object.keys(next).length) return
    setLoading(true)
    try {
      const { data, error } = await supabase.auth.signUp({
        email: form.email.trim(), password: form.password, options: { data: { full_name: form.name.trim() } },
      })
      if (error) setErrors({ form: /failed to fetch|network/i.test(error.message) ? 'Couldn’t reach the server. Check your connection and try again.' : error.message })
      else if (!data.session) setNeedsConfirmation(true)
      // With a session, the auth listener signs the user in and the router redirects.
    } catch (error) {
      setErrors({ form: error?.message || 'Couldn’t create the account. Try again.' })
    } finally {
      setLoading(false)
    }
  }

  if (needsConfirmation) {
    return (
      <AuthLayout title="Check your email" subtitle={`We sent a confirmation link to ${form.email.trim()}. Open it to finish creating your account, then sign in.`} footer={<Link to="/login" className="font-medium text-accent hover:underline">Back to sign in</Link>} />
    )
  }

  return (
    <AuthLayout title="Create your account" subtitle="Free to use. Your data syncs between your devices." footer={<>Already have an account? <Link to="/login" className="font-medium text-accent hover:underline">Sign in</Link></>}>
      <form onSubmit={submit} noValidate className="space-y-4">
        <Field label="Name" error={errors.name}><Input autoComplete="name" value={form.name} onChange={set('name')} autoFocus /></Field>
        <Field label="Email" error={errors.email}><Input type="email" autoComplete="email" value={form.email} onChange={set('email')} /></Field>
        <Field label="Password" error={errors.password}><PasswordInput autoComplete="new-password" value={form.password} onChange={set('password')} /></Field>
        <Field label="Confirm password" error={errors.confirmPassword}><PasswordInput autoComplete="new-password" value={form.confirmPassword} onChange={set('confirmPassword')} /></Field>
        {errors.form && <p role="alert" className="text-[13px] text-danger">{errors.form}</p>}
        <Button type="submit" variant="primary" size="lg" className="w-full" loading={loading}>{loading ? 'Creating account…' : 'Create account'}</Button>
      </form>
    </AuthLayout>
  )
}

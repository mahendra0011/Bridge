import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { Lock, Check, Eye, EyeOff } from 'lucide-react'
import { api } from '@/lib/api'

export default function ResetPassword() {
  const { token } = useParams()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password.length < 8) return setError('Password must be at least 8 characters.')
    if (password !== confirm) return setError('Passwords do not match.')
    setError('')
    setSubmitting(true)
    try {
      await api.post(`/api/auth/reset-password/${token}`, { password })
      setDone(true)
    } catch (err) {
      setError(err.message || 'Reset link is invalid or expired.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SiteLayout>
      <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          {!done ? (
            <>
              <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Lock className="size-5" />
              </div>
              <h1 className="text-2xl font-extrabold">Set new password</h1>
              <p className="mt-1 text-sm text-slate-500">Choose a strong password for your account.</p>
              {error && (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{error}</p>
              )}
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">New password</label>
                  <div className="relative">
                    <input
                      type={show ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 characters"
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary"
                    />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                      {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Confirm password</label>
                  <input
                    type={show ? 'text' : 'password'}
                    required
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <Button disabled={submitting} className="w-full rounded-xl bg-primary py-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {submitting ? 'Resetting…' : 'Reset password'}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="size-7" />
              </div>
              <h2 className="text-2xl font-extrabold">Password updated!</h2>
              <p className="mt-2 text-sm text-slate-500">Your password has been reset successfully.</p>
              <Link to="/login" className="mt-6 inline-block rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground hover:bg-primary/90">
                Log in
              </Link>
            </div>
          )}
        </div>
      </main>
    </SiteLayout>
  )
}

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { Mail, ArrowLeft, Check } from 'lucide-react'
import { api } from '@/lib/api'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email) return
    setError('')
    setSubmitting(true)
    try {
      await api.post('/api/auth/forgot-password', { email })
      setSent(true)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <SiteLayout>
      <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <Link
            to="/login"
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary"
          >
            <ArrowLeft className="size-4" /> Back to login
          </Link>

          {!sent ? (
            <>
              <div className="mb-6 grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
                <Mail className="size-5" />
              </div>
              <h1 className="text-2xl font-extrabold">Forgot your password?</h1>
              <p className="mt-1 text-sm text-slate-500">
                Enter your email and we'll send you a reset link.
              </p>
              {error && (
                <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{error}</p>
              )}
              <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Email address
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@school.edu"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <Button disabled={submitting} className="w-full rounded-xl bg-primary py-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
                  {submitting ? 'Sending…' : 'Send reset link'}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-600">
                <Check className="size-6" />
              </div>
              <h2 className="text-xl font-extrabold">Check your inbox</h2>
              <p className="mt-2 text-sm text-slate-500">
                We sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Didn't get it? Check your spam folder or{' '}
                <button onClick={() => setSent(false)} className="font-semibold text-primary">
                  try again
                </button>
                .
              </p>
            </div>
          )}
        </div>
      </main>
    </SiteLayout>
  )
}

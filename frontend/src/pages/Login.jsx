import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Eye, EyeOff, Mail, RotateCcw } from 'lucide-react'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID

// Helper to get redirect path from URL query param or React Router state
function getRedirectPath(search, state) {
  // Query param takes precedence (used by message buttons and direct links)
  const searchParams = new URLSearchParams(search)
  const redirectParam = searchParams.get('redirect')
  if (redirectParam) return redirectParam
  // Fall back to React Router state (used by ProtectedRoute)
  return state?.from?.pathname
}

function GoogleLoginButton() {
  const location = useLocation()
  
  const handleGoogleLogin = () => {
    // Extract redirect param value if exists
    const params = new URLSearchParams(location.search)
    const redirectValue = params.get('redirect')
    // Build redirect query string for Google OAuth
    const redirectParam = redirectValue ? `?redirect=${redirectValue}` : ''
    // Redirect to backend which handles the Google OAuth flow
    window.location.href = `/api/auth/google${redirectParam}`
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={!GOOGLE_CLIENT_ID}
      className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
    >
      <svg className="h-5 w-5" viewBox="0 0 24 24">
        <path
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
          fill="#4285F4"
        />
        <path
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          fill="#34A853"
        />
        <path
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          fill="#FBBC05"
        />
        <path
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          fill="#EA4335"
        />
      </svg>
      Continue with Google
    </button>
  )
}

function Field({ label, type = 'text', placeholder, value, onChange, required }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </div>
  )
}

function roleHome(role) {
  if (role === 'company') return '/company'
  if (role === 'admin') return '/admin'
  if (role === 'agency') return '/agency/dashboard'
  return '/dashboard'
}

// ─── Inline OTP Verification panel (shown when login returns needsVerification) ─
function VerifyPanel({ email, onSuccess, onCancel }) {
  const [otp, setOtp] = useState(Array(6).fill(''))
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  const otpString = otp.join('')

  const handleDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      document.getElementById(`otp-${i - 1}`)?.focus()
    }
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted.length) {
      setOtp([...pasted.padEnd(6, '').split('').slice(0, 6)])
      document.getElementById(`otp-${Math.min(pasted.length - 1, 5)}`)?.focus()
    }
    e.preventDefault()
  }

  const handleVerify = async () => {
    if (otpString.length < 6) return setError('Enter the full 6-digit code')
    setError('')
    setSubmitting(true)
    try {
      const data = await api.post('/api/auth/verify-otp', { email, otp: otpString })
      onSuccess(data.user)
    } catch (err) {
      setError(err.message || 'Verification failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleResend = async () => {
    if (cooldown > 0) return
    setResending(true)
    setError('')
    try {
      await api.post('/api/auth/resend-otp', { email })
      toast.success('New OTP sent!')
      setOtp(Array(6).fill(''))
      setCooldown(60)
      const t = setInterval(() => setCooldown((c) => { if (c <= 1) clearInterval(t); return c - 1 }), 1000)
    } catch (err) {
      setError(err.message || 'Could not resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="mt-6">
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <p className="text-sm font-bold text-slate-800">Verify your email to continue</p>
            <p className="mt-0.5 text-xs text-slate-500">
              A 6-digit code was sent to <span className="font-semibold">{email}</span>
            </p>
          </div>
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
            {error}
          </p>
        )}

        <div className="mt-4 flex justify-center gap-2" onPaste={handlePaste}>
          {otp.map((d, i) => (
            <input
              key={i}
              id={`otp-${i}`}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={d}
              onChange={(e) => handleDigit(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-12 w-10 rounded-xl border-2 border-slate-200 text-center text-lg font-bold outline-none focus:border-primary"
            />
          ))}
        </div>

        <Button
          onClick={handleVerify}
          disabled={submitting || otpString.length < 6}
          className="mt-4 w-full rounded-xl bg-primary py-4 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
        >
          {submitting ? 'Verifying…' : 'Verify & log in'}
        </Button>

        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={handleResend}
            disabled={resending || cooldown > 0}
            className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50"
          >
            <RotateCcw className="size-3" />
            {cooldown > 0 ? `Resend in ${cooldown}s` : resending ? 'Sending…' : 'Resend OTP'}
          </button>
          <button onClick={onCancel} className="hover:underline">
            Use a different account
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Login page ─────────────────────────────────────────────────────────
export default function Login() {
  const { login, loginWithToken } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // Set when backend says email is unverified
  const [pendingEmail, setPendingEmail] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setPendingEmail(null)
    setSubmitting(true)
    try {
      const user = await login(email, password)
      toast.success('Welcome back!')
      const redirectTo = getRedirectPath(location.search, location.state) || roleHome(user.role)
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const data = err.data || {}
      // Case: backend signals needsVerification → show OTP panel inline
      if (err.status === 403 && data.needsVerification) {
        setPendingEmail(data.pendingEmail || email)
      } else {
        setError(err.message || 'Login failed')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // OTP verified via login page — log them in
  const handleOtpSuccess = (user) => {
    loginWithToken(user)
    toast.success('Email verified! Welcome 🎉')
    const redirectTo = getRedirectPath(location.search, location.state) || roleHome(user.role)
    navigate(redirectTo, { replace: true })
  }

  return (
    <SiteLayout>
      <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <h1 className="text-2xl font-extrabold">Welcome back</h1>
          <p className="mt-1 text-sm text-slate-500">Log in to continue your journey.</p>

          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Field
              label="Email"
              type="email"
              placeholder="you@school.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-10 text-sm outline-none focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-slate-600">
                <input type="checkbox" /> Remember me
              </label>
              <Link to="/forgot-password" className="font-semibold text-primary">
                Forgot password?
              </Link>
            </div>
            <Button
              type="submit"
              disabled={submitting}
              className="w-full rounded-xl bg-primary py-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? 'Logging in…' : 'Log in'}
            </Button>
          </form>

          {/* Google Login */}
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">or continue with</span>
            </div>
          </div>
          <div className="mt-4">
            <GoogleLoginButton />
          </div>

          {/* Demo quick-login buttons */}
          <div className="relative mt-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-400">demo accounts</span>
            </div>
          </div>
           <div className="mt-4 grid grid-cols-4 gap-2">
             <button
               type="button"
               onClick={() => {
                 setEmail('student@demo.com')
                 setPassword('student@123')
                 setTimeout(() => document.querySelector('form')?.requestSubmit(), 100)
               }}
               className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
             >
               🧑‍🎓 Student
             </button>
             <button
               type="button"
               onClick={() => {
                 setEmail('company@demo.com')
                 setPassword('company@123')
                 setTimeout(() => document.querySelector('form')?.requestSubmit(), 100)
               }}
               className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
             >
               🏢 Company
             </button>
             <button
               type="button"
               onClick={() => {
                 setEmail('admin@demo.com')
                 setPassword('admin@123')
                 setTimeout(() => document.querySelector('form')?.requestSubmit(), 100)
               }}
               className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
             >
               🔧 Admin
             </button>
             <button
               type="button"
               onClick={() => {
                 setEmail('agency@demo.com')
                 setPassword('agency@123')
                 setTimeout(() => document.querySelector('form')?.requestSubmit(), 100)
               }}
               className="rounded-lg border border-slate-200 px-2 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50"
             >
               🤝 Agency
             </button>
           </div>

          {/* Inline OTP verification panel — only shows when email is unverified */}
          {pendingEmail && (
            <VerifyPanel
              email={pendingEmail}
              onSuccess={handleOtpSuccess}
              onCancel={() => setPendingEmail(null)}
            />
          )}

          <p className="mt-6 text-center text-sm text-slate-500">
            New here?{' '}
            <Link to="/signup" className="font-bold text-primary">
              Create an account
            </Link>
          </p>
        </div>
      </main>
    </SiteLayout>
  )
}

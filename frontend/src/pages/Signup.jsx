import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Mail, RotateCcw, CheckCircle2, Building2 } from 'lucide-react'

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
  if (role === 'company') return '/company/dashboard'
  if (role === 'admin') return '/admin'
  return '/dashboard'
}

const initialStudentForm = { firstName: '', lastName: '', email: '', phone: '', password: '' }
const initialCompanyForm = { companyName: '', email: '', website: '', password: '' }

// ─── OTP Input — 6 individual boxes ─────────────────────────────────────────
function OtpInput({ value, onChange }) {
  const inputs = useRef([])
  const digits = (value + '      ').slice(0, 6).split('')

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = value.slice(0, i) + value.slice(i + 1)
      onChange(next)
      if (i > 0) inputs.current[i - 1]?.focus()
      return
    }
    if (!/^\d$/.test(e.key)) return
    const next = (value.slice(0, i) + e.key + value.slice(i + 1)).slice(0, 6)
    onChange(next.trim())
    if (i < 5) inputs.current[i + 1]?.focus()
  }

  const handlePaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    if (pasted) { onChange(pasted); inputs.current[Math.min(pasted.length, 5)]?.focus() }
    e.preventDefault()
  }

  return (
    <div className="flex justify-center gap-3">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => (inputs.current[i] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d.trim()}
          onChange={() => {}}
          onKeyDown={(e) => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="h-14 w-11 rounded-xl border-2 border-slate-200 text-center text-xl font-bold outline-none focus:border-primary"
        />
      ))}
    </div>
  )
}

// ─── OTP Step ────────────────────────────────────────────────────────────────
function OtpStep({ email, onSuccess }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  // Countdown for resend button
  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleVerify = async () => {
    if (otp.length < 6) return setError('Enter the full 6-digit code')
    setError('')
    setSubmitting(true)
    try {
      const data = await api.post('/api/auth/verify-otp', { email, otp })
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
      setOtp('')
      setCooldown(60)
    } catch (err) {
      setError(err.message || 'Could not resend OTP')
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
      {/* Header */}
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
          <Mail className="size-7 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold">Check your email</h1>
        <p className="mt-2 text-sm text-slate-500">
          We sent a 6-digit code to<br />
          <span className="font-semibold text-slate-700">{email}</span>
        </p>
      </div>

      {/* Error */}
      {error && (
        <p className="mt-5 rounded-lg bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-600">
          {error}
        </p>
      )}

      {/* OTP boxes */}
      <div className="mt-8">
        <OtpInput value={otp} onChange={setOtp} />
      </div>

      {/* Verify button */}
      <Button
        onClick={handleVerify}
        disabled={submitting || otp.length < 6}
        className="mt-6 w-full rounded-xl bg-primary py-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
      >
        {submitting ? 'Verifying…' : 'Verify email'}
      </Button>

      {/* Resend */}
      <div className="mt-5 text-center">
        <p className="text-sm text-slate-500">
          Didn't receive it?{' '}
          {cooldown > 0 ? (
            <span className="font-semibold text-slate-400">Resend in {cooldown}s</span>
          ) : (
            <button
              onClick={handleResend}
              disabled={resending}
              className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50"
            >
              <RotateCcw className="size-3" />
              {resending ? 'Sending…' : 'Resend OTP'}
            </button>
          )}
        </p>
        <p className="mt-1 text-xs text-slate-400">Also check your spam folder</p>
      </div>
    </div>
  )
}

// ─── Main Signup page ────────────────────────────────────────────────────────
export default function Signup() {
  const { signup, loginWithToken } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState('student')
  const [studentForm, setStudentForm] = useState(initialStudentForm)
  const [companyForm, setCompanyForm] = useState(initialCompanyForm)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  // After signup, we move to OTP step
  const [pendingEmail, setPendingEmail] = useState(null)

  const setStudentField = (k) => (e) => setStudentForm((p) => ({ ...p, [k]: e.target.value }))
  const setCompanyField = (k) => (e) => setCompanyForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (tab !== 'student') return
    setError('')
    setSubmitting(true)
    try {
      const { firstName, lastName, email, phone, password } = studentForm
      const payload = { name: `${firstName} ${lastName}`.trim(), email, phone, password, role: 'student' }
      const data = await signup(payload)
      toast.success('Account created! Enter the OTP sent to your email.')
      setPendingEmail(data.pendingEmail)
    } catch (err) {
      setError(err.message || 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  // Called by OtpStep once OTP is verified
  const handleOtpSuccess = (user) => {
    loginWithToken(user)
    toast.success('Email verified! Welcome to Bridge 🎉')
    if (user.role === 'company') navigate('/company/dashboard', { replace: true })
    else if (user.role === 'agency') navigate('/agency/dashboard', { replace: true })
    else navigate('/dashboard', { replace: true })
  }

  // ── OTP step ────────────────────────────────────────────────────
  if (pendingEmail) {
    return (
      <SiteLayout>
        <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-6 py-16">
          <div className="w-full">
            <OtpStep email={pendingEmail} onSuccess={handleOtpSuccess} />
            <p className="mt-4 text-center text-xs text-slate-400">
              Wrong email?{' '}
              <button
                onClick={() => setPendingEmail(null)}
                className="font-semibold text-primary hover:underline"
              >
                Go back
              </button>
            </p>
          </div>
        </main>
      </SiteLayout>
    )
  }

  // ── Signup form ─────────────────────────────────────────────────
  return (
    <SiteLayout>
      <main className="mx-auto grid min-h-[70vh] max-w-xl place-items-center px-6 py-16">
        <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          <h1 className="text-2xl font-extrabold">Create your account</h1>
          <p className="mt-1 text-sm text-slate-500">Join 200,000+ students and 12,000+ companies.</p>

          <div className="mt-6 grid grid-cols-3 gap-2 rounded-xl bg-slate-100 p-1">
            {['student', 'company', 'agency'].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`rounded-lg px-4 py-2 text-sm font-bold capitalize transition-colors ${
                  tab === t ? 'bg-white text-foreground shadow-sm' : 'text-slate-500'
                }`}
              >
                {t === 'student' ? "I'm a student" : t === 'company' ? "I'm a company" : "I'm an agency"}
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {error}
            </p>
          )}

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {tab === 'student' ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name" placeholder="Ada" value={studentForm.firstName} onChange={setStudentField('firstName')} required />
                  <Field label="Last name" placeholder="Lovelace" value={studentForm.lastName} onChange={setStudentField('lastName')} required />
                </div>
                <Field label="Email" type="email" placeholder="you@school.edu" value={studentForm.email} onChange={setStudentField('email')} required />
                <Field label="Phone" type="tel" placeholder="+91 9876543210" value={studentForm.phone} onChange={setStudentField('phone')} />
                <Field label="Password" type="password" placeholder="••••••••" value={studentForm.password} onChange={setStudentField('password')} required />
                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full rounded-xl bg-primary py-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
                >
                  {submitting ? 'Creating account…' : 'Create account'}
                </Button>
              </>
            ) : tab === 'company' ? (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-600 mb-4">Companies use our dedicated multi-step signup for a faster, streamlined experience.</p>
                <Link to="/company/signup" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
                  <Building2 className="size-4" /> Sign up as Company
                </Link>
              </div>
            ) : (
              <div className="py-6 text-center">
                <p className="text-sm text-slate-600 mb-4">Agencies use our dedicated signup to register and start posting opportunities.</p>
                <Link to="/agency/signup" className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
                  <Building2 className="size-4" /> Register as Agency
                </Link>
              </div>
            )}
          </form>
          <p className="mt-6 text-center text-sm text-slate-500">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-primary">
              Log in
            </Link>
          </p>
        </div>
      </main>
    </SiteLayout>
  )
}

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import { Building2, Upload, ArrowRight, ArrowLeft, CheckCircle2, Mail, RotateCcw, Link as LinkIcon } from 'lucide-react'

const SERVICE_CATEGORIES = [
  'Video Editing', 'Photo Editing/Photography', 'Graphic Design',
  'Digital Marketing', 'Content Writing', 'Web Development',
  'Social Media Management', 'Animation/VFX', 'SEO', 'Voice Over', 'Other',
]

const TEAM_SIZE_OPTIONS = ['1-5', '6-10', '11-25', '25+']

function Field({ label, type = 'text', placeholder, value, onChange, required, error, helper }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <input
        type={type}
        required={required}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className={`w-full rounded-lg border px-3 py-2.5 text-sm outline-none transition-colors ${error ? 'border-rose-300 focus:border-rose-500' : 'border-slate-200 focus:border-primary'}`}
      />
      {helper && <p className="mt-1 text-xs text-slate-400">{helper}</p>}
      {error && <p className="mt-1 text-xs font-semibold text-rose-500">{error}</p>}
    </div>
  )
}

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
        <input key={i} ref={(el) => (inputs.current[i] = el)} type="text" inputMode="numeric" maxLength={1}
          value={d.trim()} onChange={() => {}} onKeyDown={(e) => handleKey(i, e)} onPaste={i === 0 ? handlePaste : undefined}
          className="h-14 w-11 rounded-xl border-2 border-slate-200 text-center text-xl font-bold outline-none focus:border-primary" />
      ))}
    </div>
  )
}

function OtpStep({ email, onSuccess, onBack }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)
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
      toast.success('Email verified! Now complete your agency profile.')
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
    try {
      await api.post('/api/auth/resend-otp', { email })
      toast.success('New OTP sent')
      setCooldown(30)
    } catch (err) {
      toast.error(err.message || 'Failed to resend')
    } finally {
      setResending(false)
    }
  }
  return (
    <div className="space-y-6">
      <div className="text-center">
        <Mail className="mx-auto size-10 text-primary mb-3" />
        <h2 className="text-xl font-bold">Verify your email</h2>
        <p className="mt-1 text-sm text-slate-500">Enter the 6-digit code sent to <strong>{email}</strong></p>
      </div>
      <OtpInput value={otp} onChange={setOtp} />
      {error && <p className="text-center text-xs font-semibold text-rose-500">{error}</p>}
      <Button onClick={handleVerify} disabled={submitting || otp.length < 6} className="w-full rounded-xl py-3 font-bold">
        {submitting ? 'Verifying...' : 'Verify Email'}
      </Button>
      <div className="text-center">
        <button onClick={handleResend} disabled={resending || cooldown > 0}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:text-primary/80 disabled:text-slate-400">
          <RotateCcw className="size-3.5" /> {resending ? 'Sending...' : cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend OTP'}
        </button>
      </div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-foreground mx-auto">
        <ArrowLeft className="size-3.5" /> Back to signup
      </button>
    </div>
  )
}

function Step1Form({ onSubmit, submitting }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', acceptedTerms: false })
  const [error, setError] = useState('')
  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })
  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password) return setError('Name, email, and password are required')
    if (form.password.length < 8) return setError('Password must be at least 8 characters')
    if (form.password !== form.confirmPassword) return setError('Passwords do not match')
    if (!form.acceptedTerms) return setError('You must accept the terms and conditions')
    onSubmit(form)
  }
  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Field label="Full Name" placeholder="Your full name" value={form.name} onChange={set('name')} required />
      <Field label="Email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
      <Field label="Contact Number" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={set('phone')} helper="Will be verified via OTP" />
      <Field label="Password" type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} required />
      <Field label="Confirm Password" type="password" placeholder="Re-enter your password" value={form.confirmPassword} onChange={set('confirmPassword')} required />
      <label className="flex items-start gap-2">
        <input type="checkbox" checked={form.acceptedTerms} onChange={(e) => setForm({ ...form, acceptedTerms: e.target.checked })}
          className="mt-0.5 size-4 rounded border-slate-300 text-primary focus:ring-primary" />
        <span className="text-xs text-slate-600">I agree to the <Link to="/terms" className="font-semibold text-primary">Terms of Service</Link> and <Link to="/privacy" className="font-semibold text-primary">Privacy Policy</Link></span>
      </label>
      {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full rounded-xl py-3 font-bold">
        {submitting ? 'Creating Account...' : 'Create Account'}
      </Button>
    </form>
  )
}

function Step2Form({ onSubmit, submitting }) {
  const [form, setForm] = useState({
    agencyName: '', description: '', website: '', city: '', foundedYear: '',
    teamSize: '', services: [], portfolioUrl: '', instagram: '',
    udyamNumber: '', isRegistered: true,
  })
  const [logoFile, setLogoFile] = useState(null)
  const [idProofFile, setIdProofFile] = useState(null)
  const [regCertFile, setRegCertFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState('')
  const [error, setError] = useState('')

  const set = (field) => (e) => setForm({ ...form, [field]: e.target.value })

  const toggleService = (svc) => {
    setForm((prev) => ({
      ...prev,
      services: prev.services.includes(svc)
        ? prev.services.filter((s) => s !== svc)
        : [...prev.services, svc],
    }))
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)) }
  }

  const handleIdProofChange = (e) => setIdProofFile(e.target.files[0])
  const handleRegCertChange = (e) => setRegCertFile(e.target.files[0])

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    if (!form.agencyName) return setError('Agency/Studio name is required')
    if (!form.portfolioUrl) return setError('Portfolio/Work samples link is required — this is how clients & candidates judge your work')
    if (!form.city) return setError('Working city/location is required')
    if (!idProofFile && !form._skipIdCheck) return setError('ID Proof (Aadhar/PAN) is mandatory')
    onSubmit({ ...form, logoFile, idProofFile, regCertFile })
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit}>
      <h2 className="text-lg font-bold">Agency/Studio Details</h2>
      <p className="text-sm text-slate-500">Tell us about your agency or studio</p>

      {/* Logo */}
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Agency Logo</label>
        <div className="flex items-center gap-4">
          {logoPreview ? (
            <img src={logoPreview} alt="" className="size-16 rounded-xl object-cover" />
          ) : (
            <div className="grid size-16 place-items-center rounded-xl bg-slate-100 text-slate-400"><Building2 className="size-6" /></div>
          )}
          <label className="cursor-pointer rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
            <Upload className="size-4 inline mr-1" /> Upload Logo
            <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
          </label>
        </div>
      </div>

      {/* Agency/Studio Name */}
      <Field label="Agency/Studio Name" placeholder="e.g. Creative Cuts Studio" value={form.agencyName} onChange={set('agencyName')} required />

      {/* Service Category (multi-select) */}
      <div>
        <label className="mb-2 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Service Category <span className="text-rose-500">*</span>
        </label>
        <p className="mb-2 text-xs text-slate-400">Select all that apply to your agency</p>
        <div className="flex flex-wrap gap-2">
          {SERVICE_CATEGORIES.map((svc) => (
            <button key={svc} type="button" onClick={() => toggleService(svc)}
              className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${form.services.includes(svc) ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>
              {svc}
            </button>
          ))}
        </div>
      </div>

      {/* Team Size */}
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Team Size</label>
        <select value={form.teamSize} onChange={set('teamSize')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">Select team size</option>
          {TEAM_SIZE_OPTIONS.map((opt) => (
            <option key={opt} value={opt}>{opt} members</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Working City/Location" placeholder="e.g. Mumbai" value={form.city} onChange={set('city')} required />
        <Field label="Founded Year" type="number" placeholder="e.g. 2020" value={form.foundedYear} onChange={set('foundedYear')} />
      </div>

      {/* Portfolio/Work Samples — most important field */}
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
          Portfolio / Work Samples <span className="text-rose-500">*</span>
        </label>
        <input type="url" placeholder="Instagram, Behance, YouTube, Google Drive link, etc." value={form.portfolioUrl} onChange={set('portfolioUrl')} required
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
        <p className="mt-1 text-xs text-slate-400">This is how clients & candidates judge your work. You won't be able to post jobs/internships without this.</p>
      </div>

      {/* About/Description */}
      <div>
        <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">About / Description</label>
        <textarea placeholder='e.g. "Wedding + brand videos", "D2C Instagram content", etc.' value={form.description} onChange={set('description')}
          className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary min-h-[80px] resize-y" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Website URL" type="url" placeholder="https://youragency.com (optional)" value={form.website} onChange={set('website')} />
        <Field label="Instagram / Social Handle" placeholder="@yourstudio or link" value={form.instagram} onChange={set('instagram')} helper="Instagram is your real portfolio" />
      </div>

      {/* ── Verification Section ── */}
      <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-800 mb-3">Verification</h3>

        {/* Udyam Registration */}
        <Field label="Udyam Registration (MSME)" placeholder="e.g. UDYAM-MH-01-XXXXXXXX" value={form.udyamNumber} onChange={set('udyamNumber')} helper="Preferred over GSTIN/CIN for small teams" />

        {/* Registration certificate upload — optional */}
        <div className="mt-3">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Registration Certificate</label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50">
            <Upload className="size-5 text-slate-400" />
            <span>{regCertFile ? regCertFile.name : 'Upload registration certificate (optional)'}</span>
            <input type="file" accept="image/*,.pdf" onChange={handleRegCertChange} className="hidden" />
          </label>
        </div>

        {/* Not registered yet / Informal team checkbox */}
        <label className="mt-3 flex items-start gap-2">
          <input type="checkbox" checked={!form.isRegistered} onChange={(e) => setForm({ ...form, isRegistered: !e.target.checked })}
            className="mt-0.5 size-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
          <span className="text-xs text-slate-600">Not registered yet / Informal team (trust badge will be lowered until documents are provided)</span>
        </label>

        {/* ID Proof — mandatory */}
        <div className="mt-4">
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Account Holder ID Proof (Aadhar/PAN) <span className="text-rose-500">*</span></label>
          <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-slate-300 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50">
            <Upload className="size-5 text-slate-400" />
            <span>{idProofFile ? idProofFile.name : 'Upload Aadhar or PAN card'}</span>
            <input type="file" accept="image/*,.pdf" onChange={handleIdProofChange} className="hidden" required />
          </label>
          <p className="mt-1 text-xs text-slate-400">Mandatory for all agencies — this is the strongest trust anchor for unregistered teams</p>
        </div>
      </div>

      {error && <p className="text-xs font-semibold text-rose-500">{error}</p>}
      <Button type="submit" disabled={submitting} className="w-full rounded-xl py-3 font-bold">
        {submitting ? 'Saving...' : 'Complete Registration'}
      </Button>
    </form>
  )
}

export default function AgencySignup() {
  const navigate = useNavigate()
  const { loginWithToken, refreshUser } = useAuth()
  const [step, setStep] = useState(1)
  const [pendingEmail, setPendingEmail] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const steps = ['Create Account', 'Agency Details']

  const handleStep1Submit = async (formData) => {
    setSubmitting(true)
    setError('')
    try {
      const data = await api.post('/api/auth/agency-signup', {
        name: formData.name, email: formData.email, password: formData.password,
        phone: formData.phone, acceptedTerms: formData.acceptedTerms,
      })
      toast.success('Account created! Check your email for OTP.')
      setPendingEmail(data.pendingEmail)
    } catch (err) {
      setError(err.message || 'Signup failed')
      toast.error(err.message || 'Signup failed')
    } finally { setSubmitting(false) }
  }

  const handleOtpSuccess = async (user) => {
    loginWithToken(user)
    try { await refreshUser() } catch {}
    setStep(2)
  }

  const handleStep2Submit = async (formData) => {
    setSubmitting(true)
    try {
      if (formData.logoFile) {
        const fd = new FormData()
        fd.append('logo', formData.logoFile)
        await api.post('/api/agency/logo', fd, { isFormData: true })
      }
      if (formData.idProofFile) {
        const fd = new FormData()
        fd.append('document', formData.idProofFile)
        await api.post('/api/agency/id-proof', fd, { isFormData: true })
      }
      if (formData.regCertFile) {
        const fd = new FormData()
        fd.append('document', formData.regCertFile)
        await api.post('/api/agency/reg-certificate', fd, { isFormData: true })
      }
      await api.put('/api/agency/me', {
        agencyName: formData.agencyName,
        description: formData.description || undefined,
        website: formData.website || undefined,
        city: formData.city,
        foundedYear: formData.foundedYear ? Number(formData.foundedYear) : undefined,
        teamSize: formData.teamSize || undefined,
        services: formData.services,
        portfolioUrl: formData.portfolioUrl,
        instagram: formData.instagram || undefined,
        udyamNumber: formData.udyamNumber || undefined,
        isRegistered: formData.isRegistered,
      })
      toast.success('Agency profile completed!')
      navigate('/agency/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Could not save agency profile')
    } finally { setSubmitting(false) }
  }

  return (
    <SiteLayout>
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="text-center mb-8">
          <Building2 className="mx-auto size-10 text-primary mb-3" />
          <h1 className="text-3xl font-extrabold tracking-tight">Register your Agency</h1>
          <p className="mt-2 text-slate-500">Get your agency verified and start posting opportunities.</p>
        </div>
        <div className="mb-8 flex items-center justify-center gap-2">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`flex size-8 items-center justify-center rounded-full text-xs font-bold ${step > i ? 'bg-emerald-500 text-white' : step === i + 1 ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                {step > i ? <CheckCircle2 className="size-4" /> : i + 1}
              </div>
              <span className={`text-sm font-semibold ${step === i + 1 ? 'text-foreground' : 'text-slate-400'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`h-px w-8 ${step > i ? 'bg-emerald-500' : 'bg-slate-200'}`} />}
            </div>
          ))}
        </div>
        {error && <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{error}</p>}
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
          {pendingEmail && step === 1 ? (
            <OtpStep email={pendingEmail} onSuccess={handleOtpSuccess} onBack={() => setPendingEmail(null)} />
          ) : step === 1 ? (
            <><p className="mb-6 text-sm text-slate-500">Step 1: Create your account</p><Step1Form onSubmit={handleStep1Submit} submitting={submitting} /></>
          ) : (
            <><p className="mb-6 text-sm text-slate-500">Step 2: Complete agency/studio details</p><Step2Form onSubmit={handleStep2Submit} submitting={submitting} /></>
          )}
        </div>
        <p className="mt-6 text-center text-sm text-slate-500">Already have an account? <Link to="/login" className="font-bold text-primary">Log in</Link></p>
      </main>
    </SiteLayout>
  )
}

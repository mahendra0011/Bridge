import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'
import {
  Building2, Mail, Check, ArrowRight, ArrowLeft, Upload, FileText,
  ShieldCheck, Globe, MapPin, Calendar, Linkedin, CheckCircle2, X,
  RotateCcw, AlertTriangle
} from 'lucide-react'

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

function Select({ label, options, value, onChange, required, placeholder }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        required={required}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary"
      >
        <option value="">{placeholder || 'Select...'}</option>
        {options.map((o) => (
          <option key={o.value || o} value={o.value || o}>{o.label || o}</option>
        ))}
      </select>
    </div>
  )
}

// ─── OTP Input ─────────────────────────────────────────────────────────────
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

// ─── Step Indicator ────────────────────────────────────────────────────────
function StepIndicator({ current, steps }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-8">
      {steps.map((s, i) => {
        const stepNum = i + 1
        const isActive = stepNum === current
        const isDone = stepNum < current
        return (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex size-8 items-center justify-center rounded-full text-sm font-bold transition-colors ${
              isDone ? 'bg-emerald-500 text-white' :
              isActive ? 'bg-primary text-white' :
              'bg-slate-100 text-slate-400'
            }`}>
              {isDone ? <Check className="size-4" /> : stepNum}
            </div>
            <span className={`text-xs font-semibold ${isActive ? 'text-primary' : isDone ? 'text-emerald-600' : 'text-slate-400'}`}>
              {s}
            </span>
            {i < steps.length - 1 && <div className={`h-px w-8 ${isDone ? 'bg-emerald-300' : 'bg-slate-200'}`} />}
          </div>
        )
      })}
    </div>
  )
}

// ─── Step 1 — Signup Form ─────────────────────────────────────────────────
function Step1Form({ onSubmit, submitting }) {
  const [form, setForm] = useState({
    companyName: '',
    email: '',
    password: '',
    confirmPassword: '',
    contactPerson: '',
    designation: '',
    phone: '',
    acceptedTerms: false,
  })
  const [errors, setErrors] = useState({})
  const [showDomainWarning, setShowDomainWarning] = useState(false)

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm(p => ({ ...p, [k]: val }))
    if (errors[k]) setErrors(p => ({ ...p, [k]: '' }))
    if (k === 'email') {
      const domain = val.split('@')[1]?.toLowerCase()
      setShowDomainWarning(domain && ['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'].includes(domain))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = {}
    if (!form.companyName.trim()) newErrors.companyName = 'Company name is required'
    if (!form.email.trim()) newErrors.email = 'Email is required'
    if (!form.password) newErrors.password = 'Password is required'
    else if (form.password.length < 8) newErrors.password = 'Min 8 characters'
    else if (!/[0-9]/.test(form.password)) newErrors.password = 'Must include at least 1 number'
    else if (!/[!@#$%^&*(),.?":{}|<>_-]/.test(form.password)) newErrors.password = 'Must include at least 1 special character'
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = 'Passwords do not match'
    if (!form.contactPerson.trim()) newErrors.contactPerson = 'Contact person name is required'
    if (!form.designation) newErrors.designation = 'Select your designation'
    if (!form.phone.trim()) newErrors.phone = 'Phone number is required'
    if (!form.acceptedTerms) newErrors.acceptedTerms = 'You must accept the terms'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-bold text-lg">Company Details</h2>
        <Field label="Company Name" placeholder="Acme Inc." value={form.companyName} onChange={set('companyName')} required error={errors.companyName} />
        <div>
          <Field label="Work Email" type="email" placeholder="hiring@company.com" value={form.email} onChange={set('email')} required error={errors.email} />
          {showDomainWarning && (
            <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2">
              <AlertTriangle className="size-4 shrink-0 mt-0.5 text-amber-500" />
              <p className="text-xs text-amber-700">Use your official company email (not Gmail/Yahoo) to build trust and avoid verification delays.</p>
            </div>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Password" type="password" placeholder="At least 8 characters" value={form.password} onChange={set('password')} required error={errors.password} />
          <Field label="Confirm Password" type="password" placeholder="Re-enter password" value={form.confirmPassword} onChange={set('confirmPassword')} required error={errors.confirmPassword} />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-bold text-lg">Your Details</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact Person Name" placeholder="e.g. Rahul Sharma" value={form.contactPerson} onChange={set('contactPerson')} required error={errors.contactPerson} helper="Who will manage this account (HR/founder/recruiter)" />
          <Select label="Designation" placeholder="Select your role" options={[
            { value: 'Founder', label: 'Founder / CEO' },
            { value: 'HR Manager', label: 'HR Manager' },
            { value: 'Recruiter', label: 'Recruiter' },
            { value: 'Talent Acquisition', label: 'Talent Acquisition' },
            { value: 'Other', label: 'Other' },
          ]} value={form.designation} onChange={set('designation')} required />
        </div>
        <Field label="Phone Number" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={set('phone')} required error={errors.phone} helper="For account recovery and verification" />
      </div>

      <div className="flex items-start gap-3">
        <input type="checkbox" id="terms" checked={form.acceptedTerms} onChange={set('acceptedTerms')}
          className="mt-1 size-4 rounded border-slate-300 text-primary focus:ring-primary" />
        <label htmlFor="terms" className="text-sm text-slate-600">
          I agree to the{' '}
          <Link to="/terms" target="_blank" className="font-bold text-primary hover:underline">Terms of Service</Link>
          {' '}and{' '}
          <Link to="/privacy" target="_blank" className="font-bold text-primary hover:underline">Privacy Policy</Link>
        </label>
      </div>
      {errors.acceptedTerms && <p className="text-xs font-semibold text-rose-500 -mt-3">{errors.acceptedTerms}</p>}

      <Button type="submit" disabled={submitting}
        className="w-full rounded-xl bg-primary py-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
        {submitting ? 'Creating account...' : 'Create Company Account'}
      </Button>
    </form>
  )
}

// ─── Step 2 — Company Profile ─────────────────────────────────────────────
function Step2Form({ onSubmit, submitting, company }) {
  const [form, setForm] = useState({
    industry: company?.industry || '',
    size: company?.size || '',
    foundedYear: company?.foundedYear || '',
    website: company?.website || '',
    hqLocation: company?.hqLocation || '',
    description: company?.description || '',
    linkedin: company?.linkedin || '',
  })
  const [logoFile, setLogoFile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(company?.logoUrl || null)

  const set = (k) => (e) => setForm(p => ({ ...p, [k]: e.target.value }))

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Only image files allowed'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('Logo must be under 2MB'); return }
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.industry || !form.size || !form.foundedYear || !form.website || !form.hqLocation || !form.description) {
      return toast.error('Please fill all required fields')
    }
    onSubmit({ ...form, logoFile })
  }

  const currentYear = new Date().getFullYear()

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-bold text-lg">Company Logo</h2>
        <div className="flex items-center gap-5">
          {logoPreview ? (
            <img src={logoPreview} alt="Logo" className="size-20 rounded-2xl object-cover" />
          ) : (
            <div className="grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-extrabold text-white">
              {(company?.name || 'C')[0]}
            </div>
          )}
          <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-colors">
            <Upload className="size-4" /> {logoFile ? logoFile.name : 'Upload logo'}
            <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
          </label>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <h2 className="font-bold text-lg">Company Information</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Select label="Industry / Sector" placeholder="Select industry" options={[
            'Software / Technology', 'Finance / Banking', 'Healthcare', 'Education',
            'E-commerce', 'Manufacturing', 'Media / Entertainment', 'Consulting',
            'Real Estate', 'Travel / Hospitality', 'Telecommunications', 'Other',
          ]} value={form.industry} onChange={set('industry')} required />
          <Select label="Company Size" placeholder="Select size" options={[
            { value: '1-10', label: '1-10 employees' },
            { value: '11-50', label: '11-50 employees' },
            { value: '51-200', label: '51-200 employees' },
            { value: '201-500', label: '201-500 employees' },
            { value: '500+', label: '500+ employees' },
          ]} value={form.size} onChange={set('size')} required />
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Founded Year *</label>
            <input type="number" min={1800} max={currentYear} value={form.foundedYear} onChange={set('foundedYear')}
              placeholder="e.g. 2020" required
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <Field label="Website URL" type="url" placeholder="https://company.com" value={form.website} onChange={set('website')} required helper="Your official company website" />
          <Field label="HQ Location" placeholder="e.g. Bangalore, Karnataka, India" value={form.hqLocation} onChange={set('hqLocation')} required helper="City, State, Country" />
          <Field label="LinkedIn URL" type="url" placeholder="https://linkedin.com/company/..." value={form.linkedin} onChange={set('linkedin')} helper="Optional — builds trust with candidates" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">About the Company *</label>
          <textarea rows={4} value={form.description} onChange={set('description')}
            placeholder="Tell candidates what your company does, your mission, and culture..."
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="submit" disabled={submitting}
          className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {submitting ? 'Saving...' : 'Save & Continue'} <ArrowRight className="size-4 ml-1 inline" />
        </Button>
      </div>
    </form>
  )
}

// ─── Step 3 — Verification Docs ───────────────────────────────────────────
function Step3Form({ onSubmit, submitting, company, onSkip }) {
  const [regNumber, setRegNumber] = useState(company?.regNumber || '')
  const [regCertFile, setRegCertFile] = useState(null)
  const [idProofFile, setIdProofFile] = useState(null)
  const [uploadingCert, setUploadingCert] = useState(false)
  const [uploadingId, setUploadingId] = useState(false)
  const [certUrl, setCertUrl] = useState(company?.regCertificate || '')
  const [idProofUrl, setIdProofUrl] = useState(company?.idProof || '')

  const uploadFile = async (file, endpoint) => {
    const fd = new FormData()
    fd.append('document', file)
    const res = await api.post(endpoint, fd, { isFormData: true })
    return res
  }

  const handleCertUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingCert(true)
    try {
      const res = await uploadFile(file, '/api/company/step3/upload-certificate')
      setCertUrl(res.regCertificate)
      setRegCertFile(file)
      toast.success('Certificate uploaded')
    } catch (err) { toast.error(err.message) }
    finally { setUploadingCert(false) }
  }

  const handleIdUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingId(true)
    try {
      const res = await uploadFile(file, '/api/company/step3/upload-idproof')
      setIdProofUrl(res.idProof)
      setIdProofFile(file)
      toast.success('ID proof uploaded')
    } catch (err) { toast.error(err.message) }
    finally { setUploadingId(false) }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!regNumber.trim()) return toast.error('Business registration number is required')
    onSubmit({ regNumber: regNumber.trim() })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="size-5 text-primary" />
          <h2 className="font-bold text-lg">Verification Documents</h2>
        </div>
        <p className="text-sm text-slate-500">These documents help us verify your company. They'll be reviewed by our admin team.</p>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
            Business Registration Number (GSTIN/CIN/Udyam) *
          </label>
          <input value={regNumber} onChange={e => setRegNumber(e.target.value)}
            placeholder="e.g. 27AAECS1234F1ZV or U72300KA2020PTC123456"
            required
            className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
          <p className="mt-1 text-xs text-slate-400">Enter your GSTIN, CIN, Udyam registration, or equivalent business ID for your region.</p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Registration Certificate</label>
          {certUrl ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <FileText className="size-5 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">Certificate uploaded</span>
              <Check className="size-4 text-emerald-500 ml-auto" />
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500 hover:border-primary hover:text-primary transition-colors">
              {uploadingCert ? 'Uploading...' : <><Upload className="size-4" /> Upload Registration Certificate (PDF, JPG)</>}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleCertUpload} disabled={uploadingCert} />
            </label>
          )}
        </div>

        <div>
          <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Authorized Signatory ID Proof (Optional)</label>
          {idProofUrl ? (
            <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3">
              <FileText className="size-5 text-emerald-500" />
              <span className="text-sm font-semibold text-emerald-700">ID proof uploaded</span>
              <Check className="size-4 text-emerald-500 ml-auto" />
            </div>
          ) : (
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500 hover:border-primary hover:text-primary transition-colors">
              {uploadingId ? 'Uploading...' : <><Upload className="size-4" /> Upload ID Proof (Aadhaar, PAN, Passport)</>}
              <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleIdUpload} disabled={uploadingId} />
            </label>
          )}
        </div>
      </div>

      <div className="flex justify-between gap-3">
        <button type="button" onClick={onSkip}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">
          Skip — I'll do this later
        </button>
        <Button type="submit" disabled={submitting}
          className="rounded-xl bg-primary px-8 py-3 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {submitting ? 'Saving...' : 'Submit for Verification'} <ArrowRight className="size-4 ml-1 inline" />
        </Button>
      </div>
    </form>
  )
}

// ─── OTP Step ─────────────────────────────────────────────────────────────
function OtpStep({ email, onSuccess, onBack }) {
  const [otp, setOtp] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)
  const [cooldown, setCooldown] = useState(0)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown(c => c - 1), 1000)
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
    <div className="w-full max-w-md mx-auto">
      <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/50">
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

        {error && (
          <p className="mt-5 rounded-lg bg-rose-50 px-3 py-2 text-center text-xs font-semibold text-rose-600">{error}</p>
        )}

        <div className="mt-8">
          <OtpInput value={otp} onChange={setOtp} />
        </div>

        <Button onClick={handleVerify} disabled={submitting || otp.length < 6}
          className="mt-6 w-full rounded-xl bg-primary py-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
          {submitting ? 'Verifying...' : 'Verify email'}
        </Button>

        <div className="mt-5 text-center">
          <p className="text-sm text-slate-500">
            Didn't receive it?{' '}
            {cooldown > 0 ? (
              <span className="font-semibold text-slate-400">Resend in {cooldown}s</span>
            ) : (
              <button onClick={handleResend} disabled={resending}
                className="inline-flex items-center gap-1 font-semibold text-primary hover:underline disabled:opacity-50">
                <RotateCcw className="size-3" /> {resending ? 'Sending...' : 'Resend OTP'}
              </button>
            )}
          </p>
          <p className="mt-1 text-xs text-slate-400">Also check your spam folder</p>
        </div>
      </div>
      <button onClick={onBack} className="mt-4 mx-auto block text-sm font-semibold text-slate-500 hover:text-primary">
        <ArrowLeft className="size-4 inline mr-1" /> Back to signup
      </button>
    </div>
  )
}

// ─── Main Company Signup Page ─────────────────────────────────────────────
export default function CompanySignup() {
  const { companySignup, loginWithToken, refreshUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [step, setStep] = useState(Number(searchParams.get('step')) || 1)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [pendingEmail, setPendingEmail] = useState(null)
  const [company, setCompany] = useState(null)

  const handleStep1Submit = async (formData) => {
    setSubmitting(true)
    setError('')
    try {
      const payload = {
        companyName: formData.companyName,
        email: formData.email,
        password: formData.password,
        contactPerson: formData.contactPerson,
        designation: formData.designation,
        phone: formData.phone,
        acceptedTerms: formData.acceptedTerms,
      }
      const data = await companySignup(payload)
      toast.success('Account created! Check your email for OTP.')
      setPendingEmail(data.pendingEmail)
    } catch (err) {
      setError(err.message || 'Signup failed')
      toast.error(err.message || 'Signup failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleOtpSuccess = async (user) => {
    loginWithToken(user)
    // Refresh to get company data
    try { await refreshUser() } catch {}
    toast.success('Email verified! Now complete your company profile.')
    setStep(2)
  }

  const handleStep2Submit = async (formData) => {
    setSubmitting(true)
    try {
      // First upload logo if changed
      if (formData.logoFile) {
        const fd = new FormData()
        fd.append('logo', formData.logoFile)
        await api.post('/api/company/logo', fd, { isFormData: true })
      }

      await api.post('/api/company/step2', {
        industry: formData.industry,
        size: formData.size,
        foundedYear: Number(formData.foundedYear),
        website: formData.website,
        hqLocation: formData.hqLocation,
        description: formData.description,
        linkedin: formData.linkedin || '',
      })
      toast.success('Profile completed!')
      setStep(3)
    } catch (err) {
      toast.error(err.message || 'Could not save profile')
    } finally {
      setSubmitting(false)
    }
  }

  const handleStep3Submit = async (formData) => {
    setSubmitting(true)
    try {
      await api.post('/api/company/step3', formData)
      toast.success('Documents submitted for verification!')
      navigate('/company/dashboard', { replace: true })
    } catch (err) {
      toast.error(err.message || 'Could not submit documents')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSkipStep3 = () => {
    toast.success('You can upload verification docs later from Company Profile.')
    navigate('/company/dashboard', { replace: true })
  }

  const steps = ['Create Account', 'Company Profile', 'Verification']

  return (
    <SiteLayout>
      <main className="mx-auto max-w-2xl px-6 py-12">
        <div className="text-center mb-8">
          <Building2 className="mx-auto size-10 text-primary mb-3" />
          <h1 className="text-3xl font-extrabold tracking-tight">Set up your company</h1>
          <p className="mt-2 text-slate-500">Get your company verified and start posting opportunities.</p>
        </div>

        <StepIndicator current={step} steps={steps} />

        {error && (
          <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{error}</p>
        )}

        {pendingEmail && step === 1 ? (
          <OtpStep
            email={pendingEmail}
            onSuccess={handleOtpSuccess}
            onBack={() => setPendingEmail(null)}
          />
        ) : step === 1 ? (
          <Step1Form onSubmit={handleStep1Submit} submitting={submitting} />
        ) : step === 2 ? (
          <Step2Form onSubmit={handleStep2Submit} submitting={submitting} company={company} />
        ) : (
          <Step3Form onSubmit={handleStep3Submit} submitting={submitting} company={company} onSkip={handleSkipStep3} />
        )}
      </main>
    </SiteLayout>
  )
}

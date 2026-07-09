import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import {
  ArrowLeft, User, Mail, Phone, BookOpen, Code2, FileText,
  Plus, X, Check, Lock, Eye, EyeOff, Briefcase, MapPin, Calendar,
  Building2, Pencil, Trash2, AlertTriangle
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function Field({ label, type = 'text', placeholder, value, onChange, disabled }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  )
}

function Section({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

const emptyForm = {
  firstName: '', lastName: '', phone: '', college: '', degree: '', year: '',
  cgpa: '', linkedin: '', github: '', portfolio: '', bio: '',
  tagline: '', occupation: '', website: '', youtube: '', instagram: '',
}

export default function Profile() {
  const { user } = useAuth()
  const location = useLocation()
  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [resumeFile, setResumeFile] = useState(null)
  const [resumeUrl, setResumeUrl] = useState(null)
  const [fileError, setFileError] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(emptyForm)

  const [experience, setExperience] = useState([])
  const [showExpForm, setShowExpForm] = useState(false)
  const [editingExp, setEditingExp] = useState(null)
  const emptyExp = { company: '', role: '', startDate: '', endDate: '', current: false, description: '', location: '' }
  const [expForm, setExpForm] = useState(emptyExp)

  // Change password state
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)
  const [pwSaving, setPwSaving] = useState(false)
  const [showPw, setShowPw] = useState({ current: false, new: false, confirm: false })

  // Load user poster fields (tagline, occupation, website, etc.)
  useEffect(() => {
    if (!user) return
    api.get('/api/student/profile')
      .then((data) => {
        if (!data.profile) return
        const p = data.profile
        // Also fetch user's poster fields from the User model response
        if (data.user) {
          setForm(f => ({
            ...f,
            tagline: data.user.tagline || f.tagline,
            occupation: data.user.occupation || f.occupation,
            website: data.user.website || f.website,
            youtube: data.user.youtube || f.youtube,
            instagram: data.user.instagram || f.instagram,
          }))
        }
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/student/profile')
      .then((data) => {
        if (cancelled || !data.profile) return
        const p = data.profile
        setForm({
          firstName: p.firstName || '',
          lastName: p.lastName || '',
          phone: p.phone || '',
          college: p.college || '',
          degree: p.degree || '',
          year: p.year || '',
          cgpa: p.cgpa || '',
          linkedin: p.linkedin || '',
          github: p.github || '',
          portfolio: p.portfolio || '',
          bio: p.bio || '',
          tagline: p.tagline || data.user?.tagline || '',
          occupation: p.occupation || data.user?.occupation || '',
          website: p.website || data.user?.website || '',
          youtube: p.youtube || data.user?.youtube || '',
          instagram: p.instagram || data.user?.instagram || '',
        })
        setSkills(p.skills || [])
        setExperience(p.experience || [])
        setResumeUrl(p.resumeUrl || null)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const addSkill = () => {
    const s = newSkill.trim()
    if (s && !skills.includes(s)) {
      setSkills((p) => [...p, s])
      setNewSkill('')
    }
  }

  const removeSkill = (s) => setSkills((p) => p.filter((x) => x !== s))

  const handleResumeChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setFileError('Only PDF files are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setFileError('File must be under 5MB.')
      return
    }
    setFileError('')
    setResumeFile(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (resumeFile) {
        const fd = new FormData()
        fd.append('resume', resumeFile)
        const res = await api.post('/api/student/resume', fd, { isFormData: true })
        setResumeUrl(res.resumeUrl)
        setResumeFile(null)
      }
      // Save poster fields to profile (will sync to User model via backend)
      await api.put('/api/student/profile', { 
        ...form, 
        skills, 
        experience,
        tagline: form.tagline,
        occupation: form.occupation,
        website: form.website,
        youtube: form.youtube,
        instagram: form.instagram,
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (err) {
      setFileError(err.message || 'Could not save profile')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    setPwError('')
    setPwSuccess(false)
    const { currentPassword, newPassword, confirmPassword } = pwForm
    if (!currentPassword || !newPassword || !confirmPassword) {
      return setPwError('All fields are required')
    }
    if (newPassword.length < 8) {
      return setPwError('New password must be at least 8 characters')
    }
    if (newPassword !== confirmPassword) {
      return setPwError('New passwords do not match')
    }
    setPwSaving(true)
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword })
      setPwSuccess(true)
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
      setTimeout(() => setPwSuccess(false), 3000)
    } catch (err) {
      setPwError(err.message || 'Failed to change password')
    } finally {
      setPwSaving(false)
    }
  }

  const startEditExp = (idx) => {
    const exp = experience[idx]
    setExpForm({
      company: exp.company || '',
      role: exp.role || '',
      startDate: exp.startDate ? exp.startDate.slice(0, 10) : '',
      endDate: exp.endDate ? exp.endDate.slice(0, 10) : '',
      current: exp.current || false,
      description: exp.description || '',
      location: exp.location || '',
    })
    setEditingExp(idx)
    setShowExpForm(true)
  }

  const saveExp = () => {
    if (!expForm.company || !expForm.role || !expForm.startDate) return
    const entry = {
      ...expForm,
      startDate: new Date(expForm.startDate).toISOString(),
      endDate: expForm.current ? null : expForm.endDate ? new Date(expForm.endDate).toISOString() : null,
    }
    if (editingExp !== null) {
      setExperience(prev => { const n = [...prev]; n[editingExp] = entry; return n })
    } else {
      setExperience(prev => [...prev, entry])
    }
    setExpForm(emptyExp)
    setEditingExp(null)
    setShowExpForm(false)
  }

  const removeExp = (idx) => {
    if (!confirm('Remove this experience entry?')) return
    setExperience(prev => prev.filter((_, i) => i !== idx))
  }

  const fields = {
    'First Name': form.firstName,
    'Email': user?.email,
    'Phone': form.phone,
    'College': form.college,
    'Degree': form.degree,
    'Skills': skills.length > 0,
    'Resume': !!(resumeUrl || resumeFile),
    'Bio': !!form.bio,
    'LinkedIn': !!form.linkedin,
    'GitHub': !!form.github,
    'Experience': experience.length > 0,
  }
  const completedCount = Object.values(fields).filter(Boolean).length
  const totalFields = Object.keys(fields).length
  const pct = Math.round((completedCount / totalFields) * 100)

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="space-y-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">My Profile</h2>
          <p className="mt-1 text-sm text-slate-500">Keep your profile up to date to get the best matches.</p>
        </div>
        {/* Profile Completion */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Profile completion</h3>
              <p className="text-sm text-slate-500">Complete your profile to get better matches.</p>
            </div>
            <span className="text-2xl font-extrabold text-primary">{pct}%</span>
          </div>
          <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(fields).map(([label, done]) => (
              <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                {done ? '✓' : '○'} {label}
              </span>
            ))}
          </div>
        </div>

        {/* Personal Info */}
        <Section title="Personal Information" icon={<User className="size-4" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="First name" placeholder="Ada" value={form.firstName} onChange={set('firstName')} />
            <Field label="Last name" placeholder="Lovelace" value={form.lastName} onChange={set('lastName')} />
            <Field label="Email" type="email" value={user?.email || ''} disabled />
            <Field label="Phone" type="tel" placeholder="+91 9876543210" value={form.phone} onChange={set('phone')} />
            <Field label="LinkedIn URL" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={set('linkedin')} />
            <Field label="GitHub URL" placeholder="https://github.com/..." value={form.github} onChange={set('github')} />
          </div>
          <div className="mt-4">
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Short Bio
            </label>
            <textarea
              rows={3}
              placeholder="Tell employers a bit about yourself..."
              value={form.bio}
              onChange={set('bio')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>
        </Section>

        {/* Education */}
        <Section title="Education" icon={<BookOpen className="size-4" />}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="College / University" placeholder="IIT Bombay" value={form.college} onChange={set('college')} />
            <Field label="Degree & Branch" placeholder="B.Tech Computer Science" value={form.degree} onChange={set('degree')} />
            <Field label="Current Year" placeholder="3rd Year" value={form.year} onChange={set('year')} />
            <Field label="CGPA / Percentage" placeholder="8.9" value={form.cgpa} onChange={set('cgpa')} />
          </div>
        </Section>

        {/* Work Experience */}
        <Section title="Work Experience" icon={<Briefcase className="size-4" />}>
          {experience.map((exp, idx) => (
            <div key={idx} className="group relative mb-3 rounded-xl border border-slate-200 p-4 last:mb-0">
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-bold">{exp.role}</h4>
                  <p className="flex items-center gap-1 text-sm text-slate-600">
                    <Building2 className="size-3.5" /> {exp.company}
                  </p>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEditExp(idx)} className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-blue-400 hover:text-blue-600">
                    <Pencil className="size-3.5" />
                  </button>
                  <button onClick={() => removeExp(idx)} className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-400 hover:text-rose-600">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                <span className="flex items-center gap-1"><Calendar className="size-3" /> {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} — {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}</span>
                {exp.location && <span className="flex items-center gap-1"><MapPin className="size-3" /> {exp.location}</span>}
              </div>
              {exp.description && <p className="mt-2 text-sm text-slate-600">{exp.description}</p>}
            </div>
          ))}
          {showExpForm ? (
            <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Company *</label>
                  <input value={expForm.company} onChange={e => setExpForm(p => ({ ...p, company: e.target.value }))} placeholder="Google" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Role *</label>
                  <input value={expForm.role} onChange={e => setExpForm(p => ({ ...p, role: e.target.value }))} placeholder="Software Engineer" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Start date *</label>
                  <input type="date" value={expForm.startDate} onChange={e => setExpForm(p => ({ ...p, startDate: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">End date</label>
                  <input type="date" value={expForm.endDate} onChange={e => setExpForm(p => ({ ...p, endDate: e.target.value }))} disabled={expForm.current} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-slate-100 disabled:text-slate-400" />
                </div>
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                    <input type="checkbox" checked={expForm.current} onChange={e => setExpForm(p => ({ ...p, current: e.target.checked, endDate: e.target.checked ? '' : p.endDate }))} className="rounded border-slate-300 text-primary focus:ring-primary" />
                    I currently work here
                  </label>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Location</label>
                  <input value={expForm.location} onChange={e => setExpForm(p => ({ ...p, location: e.target.value }))} placeholder="Mountain View, CA" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                  <textarea rows={3} value={expForm.description} onChange={e => setExpForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe your responsibilities and achievements…" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={saveExp} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
                  {editingExp !== null ? 'Update' : 'Add'}
                </Button>
                <Button onClick={() => { setShowExpForm(false); setExpForm(emptyExp); setEditingExp(null) }} variant="outline" className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <button onClick={() => { setShowExpForm(true); setExpForm(emptyExp); setEditingExp(null) }} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-semibold text-slate-500 transition-colors hover:border-primary hover:text-primary">
              <Plus className="size-4" /> Add experience
            </button>
          )}
        </Section>

        {/* Skills */}
        <Section title="Skills" icon={<Code2 className="size-4" />}>
          <div className="flex flex-wrap gap-2 mb-4">
            {skills.map((s) => (
              <span
                key={s}
                className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary"
              >
                {s}
                <button onClick={() => removeSkill(s)} className="hover:text-rose-500">
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
              placeholder="Add a skill (e.g. Python)"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <Button onClick={addSkill} className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="size-4" />
            </Button>
          </div>
        </Section>

        {/* Resume */}
        <Section title="Resume" icon={<FileText className="size-4" />}>
          <div className="flex items-center gap-4">
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-6 py-4 text-sm font-semibold text-slate-600 transition-colors hover:border-primary hover:text-primary">
              <FileText className="size-4" />
              {resumeFile ? resumeFile.name : resumeUrl ? 'Replace resume' : 'Upload PDF resume'}
              <input type="file" accept=".pdf" className="hidden" onChange={handleResumeChange} />
            </label>
            {(resumeUrl || resumeFile) && (
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700">
                <Check className="size-3" /> {resumeFile ? 'Ready to upload' : 'Uploaded'}
              </span>
            )}
          </div>
          {fileError && <p className="mt-2 text-xs font-semibold text-rose-600">{fileError}</p>}
          <p className="mt-2 text-xs text-slate-400">PDF only, max 5MB. This resume will be auto-attached when you apply.</p>
        </Section>

        {/* Poster Profile - For users who post opportunities */}
        <Section title="Poster Profile" icon={<Briefcase className="size-4" />}>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Tagline
              </label>
              <input
                type="text"
                placeholder="YouTuber — tech content creator"
                value={form.tagline || ''}
                onChange={e => setForm(p => ({ ...p, tagline: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
              <p className="mt-1 text-xs text-slate-400">Helps candidates understand what type of work you post.</p>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Occupation / Context
              </label>
              <select
                value={form.occupation || ''}
                onChange={e => setForm(p => ({ ...p, occupation: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">Select occupation</option>
                <option>Content Creator</option>
                <option>Startup Founder</option>
                <option>Small Business Owner</option>
                <option>Freelancer</option>
                <option>Student</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Website / Portfolio
              </label>
              <input
                type="text"
                placeholder="https://yourwebsite.com"
                value={form.website || ''}
                onChange={e => setForm(p => ({ ...p, website: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Social Links (optional)
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="YouTube channel URL"
                  value={form.youtube || ''}
                  onChange={e => setForm(p => ({ ...p, youtube: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="Instagram profile URL"
                  value={form.instagram || ''}
                  onChange={e => setForm(p => ({ ...p, instagram: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <input
                  type="text"
                  placeholder="LinkedIn profile URL"
                  value={form.linkedin || ''}
                  onChange={e => setForm(p => ({ ...p, linkedin: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>
              <p className="mt-1 text-xs text-slate-400">Adding social links builds trust with applicants.</p>
            </div>
            {!user?.isIdVerified && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-xs font-semibold text-amber-800">ID Verification Required</p>
                <p className="mt-1 text-xs text-amber-700">
                  Verify your ID to post opportunities and show the verified badge on your profile.
                </p>
                <Link 
                  to="/profile?tab=verification" 
                  className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-600 transition-colors"
                >
                  Verify Now
                </Link>
              </div>
            )}
          </div>
        </Section>

        {/* Change Password */}
        <Section title="Change Password" icon={<Lock className="size-4" />}>
          {pwError && (
            <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">
              {pwError}
            </p>
          )}
          {pwSuccess && (
            <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 flex items-center gap-2">
              <Check className="size-3" /> Password changed successfully!
            </p>
          )}
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { key: 'current', label: 'Current password', field: 'currentPassword' },
              { key: 'new', label: 'New password', field: 'newPassword' },
              { key: 'confirm', label: 'Confirm new password', field: 'confirmPassword' },
            ].map(({ key, label, field }) => (
              <div key={key}>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  {label}
                </label>
                <div className="relative">
                  <input
                    type={showPw[key] ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={pwForm[field]}
                    onChange={(e) => setPwForm((p) => ({ ...p, [field]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 pr-9 text-sm outline-none focus:border-primary"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => ({ ...p, [key]: !p[key] }))}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPw[key] ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-5 flex items-center justify-between">
            <p className="text-xs text-slate-400">Password must be at least 8 characters.</p>
            <Button
              onClick={handleChangePassword}
              disabled={pwSaving}
              className={`rounded-xl px-6 py-4 font-bold transition-all disabled:opacity-60 ${
                pwSuccess
                  ? 'bg-emerald-600 text-white'
                  : 'bg-primary text-primary-foreground hover:bg-primary/90'
              }`}
            >
              {pwSaving ? 'Updating…' : pwSuccess ? <><Check className="size-4 mr-1 inline" /> Updated</> : 'Update password'}
            </Button>
          </div>
        </Section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className={`rounded-xl px-8 py-5 font-bold transition-all disabled:opacity-60 ${
              saved ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {saving ? 'Saving…' : saved ? <><Check className="size-4 mr-1" /> Saved</> : 'Save changes'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

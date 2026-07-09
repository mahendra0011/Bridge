import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { Plus, X, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function Field({ label, type = 'text', placeholder, value, onChange, required }) {
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
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
      />
    </div>
  )
}

function Select({ label, options, value, onChange, required }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      <select
        required={required}
        value={value}
        onChange={onChange}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"
      >
        <option value="">Select...</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

const emptyForm = {
  title: '', description: '', location: '', mode: '', stipend: '',
  duration: '', vacancies: '', deadline: '', experience: '', salaryMin: '', salaryMax: '',
  employmentType: '', internshipType: '', benefits: '', category: '',
}

export default function PostPosting({ kind: kindProp }) {
  const navigate = useNavigate()
  const params = useParams()
  const { user } = useAuth()
  // kind comes from the prop (post-internship / post-job routes) or from the
  // :kind URL segment when editing an existing posting.
  const kind = kindProp || params.kind || 'internship'
  const isEdit = Boolean(params.id)
  const isJob = kind === 'job'

  const [skills, setSkills] = useState([])
  const [newSkill, setNewSkill] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(isEdit)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [isClientProject, setIsClientProject] = useState(false)
  const [clientProjectLabel, setClientProjectLabel] = useState('')

  useEffect(() => {
    if (!isEdit) return
    let cancelled = false
    const endpoint = isJob ? `/api/jobs/${params.id}` : `/api/internships/${params.id}`
    api
      .get(endpoint)
      .then((data) => {
        if (cancelled) return
        const doc = data.job || data.internship
        setForm({
          title: doc.title || '',
          description: doc.description || '',
          location: doc.location || '',
          mode: doc.mode || '',
          stipend: doc.stipend || '',
          duration: doc.duration || '',
          internshipType: doc.internshipType || '',
          vacancies: doc.vacancies || '',
          deadline: doc.deadline ? doc.deadline.slice(0, 10) : '',
          experience: doc.experience || '',
          salaryMin: doc.salaryMin || '',
          salaryMax: doc.salaryMax || '',
          employmentType: doc.employmentType || '',
          benefits: (doc.benefits || []).join(', '),
          category: doc.category || '',
        })
        setSkills(doc.skills || [])
      })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [isEdit, isJob, params.id])

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const addSkill = () => {
    const s = newSkill.trim()
    if (s && !skills.includes(s)) { setSkills((p) => [...p, s]); setNewSkill('') }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        description: form.description,
        location: form.location,
        mode: form.mode,
        category: form.category,
        vacancies: Number(form.vacancies) || 1,
        deadline: form.deadline || undefined,
        skills,
        benefits: form.benefits ? form.benefits.split(',').map((s) => s.trim()).filter(Boolean) : [],
        isClientProject: isClientProject,
        clientProjectLabel: isClientProject ? clientProjectLabel : undefined,
      }
      if (isJob) {
        payload.salaryMin = Number(form.salaryMin) || undefined
        payload.salaryMax = Number(form.salaryMax) || undefined
        payload.employmentType = form.employmentType
        payload.experience = form.experience
      } else {
        payload.stipend = Number(form.stipend) || undefined
        payload.duration = form.duration
        payload.internshipType = form.internshipType || undefined
      }

      const endpoint = isJob ? '/api/jobs' : '/api/internships'
      if (isEdit) {
        await api.put(`${endpoint}/${params.id}`, payload)
      } else {
        await api.post(endpoint, payload)
      }

      setSubmitted(true)
      setTimeout(() => navigate(user?.role === 'agency' ? '/agency/dashboard' : '/company/dashboard'), 1500)
    } catch (err) {
      setError(err.message || 'Could not save posting')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="grid min-h-[60vh] place-items-center">
          <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
        </div>
      </SiteLayout>
    )
  }

  if (submitted) {
    return (
      <SiteLayout>
        <div className="mx-auto grid min-h-[60vh] max-w-lg place-items-center px-6 py-16 text-center">
          <div>
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <Check className="size-7" />
            </div>
            <h2 className="text-2xl font-extrabold">{isJob ? 'Job' : 'Internship'} {isEdit ? 'updated' : 'posted'}!</h2>
            <p className="mt-2 text-slate-500">Redirecting to dashboard...</p>
          </div>
        </div>
      </SiteLayout>
    )
  }

  return (
    <SiteLayout>
      <header className="bg-surface px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight">
            {isEdit ? `Edit ${isJob ? 'Job' : 'Internship'}` : `Post a${isJob ? ' Job' : 'n Internship'}`}
          </h1>
          <p className="mt-2 text-slate-600">Fill in the details below to reach thousands of candidates.</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-6 py-12">
        {error && (
          <p className="mb-6 rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{error}</p>
        )}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Basic Information</h2>
            <Field label="Title" placeholder={isJob ? 'e.g. Senior Backend Engineer' : 'e.g. Frontend Engineering Intern'} required value={form.title} onChange={set('title')} />
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                Description <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                placeholder="Describe the role, responsibilities, and what the candidate will work on..."
                value={form.description}
                onChange={set('description')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Location" placeholder="e.g. Bangalore, IN" required value={form.location} onChange={set('location')} />
              <Select label="Work Mode" options={['Remote', 'Hybrid', 'On-site']} required value={form.mode} onChange={set('mode')} />
            </div>
            <Select label="Category" options={['Engineering', 'Design', 'Marketing', 'Data', 'Sales', 'Product']} required value={form.category} onChange={set('category')} />
            {/* Client Project Tag — for agencies posting on behalf of a client brand */}
            <div className="rounded-xl border border-dashed border-violet-200 bg-violet-50/50 p-4">
              <label className="flex items-start gap-3">
                <input type="checkbox" checked={isClientProject} onChange={(e) => setIsClientProject(e.target.checked)}
                  className="mt-0.5 size-4 rounded border-violet-300 text-violet-600 focus:ring-violet-500" />
                <div>
                  <span className="text-sm font-bold text-violet-800">Posted for a Client Project</span>
                  <p className="text-xs text-violet-600">Enable if you're posting this on behalf of a client brand, not your own agency.</p>
                </div>
              </label>
              {isClientProject && (
                <div className="mt-3 pl-7">
                  <input type="text" placeholder="Client/brand name (e.g. Nike, Local Business Name)" value={clientProjectLabel} onChange={(e) => setClientProjectLabel(e.target.value)}
                    className="w-full rounded-lg border border-violet-200 px-3 py-2 text-sm outline-none focus:border-violet-500" />
                </div>
              )}
            </div>
          </div>

          {/* Compensation */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Compensation & Details</h2>
            {isJob ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Min Salary (CTC)" type="number" placeholder="e.g. 600000" value={form.salaryMin} onChange={set('salaryMin')} />
                <Field label="Max Salary (CTC)" type="number" placeholder="e.g. 900000" value={form.salaryMax} onChange={set('salaryMax')} />
              </div>
            ) : (
              <Field label="Monthly Stipend (₹)" type="number" placeholder="e.g. 15000" value={form.stipend} onChange={set('stipend')} />
            )}
            <div className="grid gap-4 sm:grid-cols-2">
              {isJob ? (
                <Select label="Employment Type" options={['Full-time', 'Part-time', 'Contract']} required value={form.employmentType} onChange={set('employmentType')} />
              ) : (
                <Select label="Internship Type" options={['Full-time', 'Part-time']} value={form.internshipType} onChange={set('internshipType')} />
              )}
              <Field label="Number of Openings" type="number" placeholder="e.g. 2" required value={form.vacancies} onChange={set('vacancies')} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Application Deadline" type="date" required value={form.deadline} onChange={set('deadline')} />
              {isJob && (
                <Select label="Experience Required" options={['Fresher', '1-2 years', '3-5 years', '5+ years']} value={form.experience} onChange={set('experience')} />
              )}
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Benefits (comma separated)</label>
              <input
                placeholder="e.g. Health insurance, Remote-first, Flexible hours"
                value={form.benefits}
                onChange={set('benefits')}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Skills */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h2 className="font-bold text-lg">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                  {s}
                  <button type="button" onClick={() => setSkills((p) => p.filter((x) => x !== s))}>
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
                placeholder="Add required skill"
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <Button type="button" onClick={addSkill} className="rounded-lg bg-primary text-primary-foreground hover:bg-primary/90">
                <Plus className="size-4" />
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" onClick={() => navigate(user?.role === 'agency' ? '/agency/dashboard' : '/company/dashboard')} className="rounded-xl border border-slate-200 bg-white px-6 py-5 font-bold text-slate-600 shadow-none hover:border-primary hover:text-primary">
              Cancel
            </Button>
            <Button type="submit" disabled={submitting} className="rounded-xl bg-primary px-8 py-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {submitting ? 'Saving…' : isEdit ? 'Save Changes' : `Post ${isJob ? 'Job' : 'Internship'}`}
            </Button>
          </div>
        </form>
      </main>
    </SiteLayout>
  )
}

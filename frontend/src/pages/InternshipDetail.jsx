import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Users, ArrowLeft, Check, BadgeCheck, Building2, ExternalLink, Share2, Bookmark, BookmarkCheck, Clock, Award, Laptop, FileText, Target, Sparkles, Shield, AlertCircle, Briefcase, DollarSign, GraduationCap, HeartHandshake, Star, Copy, XCircle, TrendingUp, Eye, FileSignature, ShieldCheck, Timer, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { api, BASE_URL } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function timeAgo(date) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 7) return `${days} days ago`
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`
  return `${Math.floor(days / 30)} months ago`
}

function deadlineInfo(deadline) {
  if (!deadline) return null
  const diffMs = new Date(deadline).getTime() - Date.now()
  const days = Math.ceil(diffMs / 86400000)
  if (days < 0) return { text: 'Applications Closed', urgent: false, closed: true }
  if (days === 0) return { text: 'Last Day to Apply!', urgent: true, closed: false }
  if (days <= 3) return { text: `${days} days left`, urgent: true, closed: false }
  if (days <= 7) return { text: `${days} days left`, urgent: false, closed: false }
  return { text: `${days} days left`, urgent: false, closed: false }
}

function setMetaTags(title, description, image, url) {
  const updateMeta = (property, content) => {
    if (!content) return
    let el = document.querySelector(`meta[property="${property}"]`)
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el) }
    el.setAttribute('content', content)
  }
  updateMeta('og:title', title)
  updateMeta('og:description', description)
  updateMeta('og:image', image)
  updateMeta('og:url', url)
  document.title = title
}

function Section({ title, icon: Icon, children, highlight }) {
  return (
    <section className={highlight ? 'rounded-2xl border-2 border-primary/20 bg-primary/5 p-6' : ''}>
      <div className="flex items-center gap-2 mb-3">
        {Icon && <Icon className="size-5 text-primary" />}
        <h3 className={`font-bold text-lg ${highlight ? 'text-primary' : ''}`}>{title}</h3>
      </div>
      {children}
    </section>
  )
}

function Meta({ icon, children, chip }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {chip ? (
        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{children}</span>
      ) : children}
    </span>
  )
}

function SkillChip({ skill, variant = 'default' }) {
  const bg = variant === 'goodToHave' ? 'bg-slate-50 border border-slate-200 text-slate-600' : 'bg-primary/10 text-primary'
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${bg}`}>
      {skill}
    </span>
  )
}

function assetUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${BASE_URL}${url}`
  return `${BASE_URL}/${url}`
}

const logoBgs = [
  'from-blue-600 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-rose-700',
  'from-violet-500 to-fuchsia-700',
  'from-cyan-500 to-blue-700',
  'from-amber-500 to-orange-700',
]

function logoBgFor(id) {
  const str = String(id || '')
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash + str.charCodeAt(i)) % logoBgs.length
  return logoBgs[hash]
}

const perkIcons = {
  'Certificate': FileText,
  'Letter of Recommendation': Award,
  'LOR': Award,
  'PPO': Briefcase,
  'Flexible': Clock,
  'Flexible hours': Clock,
  'Flexible work hours': Clock,
  'Stipend': DollarSign,
  'Mentorship': Star,
  'Guidance': Star,
  'Training': GraduationCap,
  'Health': HeartHandshake,
}

function PerkCard({ icon: Icon, label }) {
  const ResolvedIcon = perkIcons[label] || Icon || Award
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
      <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <ResolvedIcon className="size-5" />
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </div>
  )
}

function ApplyDialog({ onClose, onSubmit, title, company, submitting, screeningQuestions, documents, defaultDoc }) {
  const [selectedDocId, setSelectedDocId] = useState(defaultDoc?._id || '')
  const [coverLetter, setCoverLetter] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [answers, setAnswers] = useState({})

  const coverLetterDocs = documents?.filter(d => d.type === 'cover_letter') || []

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <h3 className="text-xl font-bold">Apply for {title}</h3>
        <p className="mt-1 text-sm text-slate-500">at {company}</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => {
          e.preventDefault()
          if (!selectedDocId) {
            toast.error('Please select a resume from Document Manager')
            return
          }
          onSubmit({ resumeDocId: selectedDocId, coverLetter, portfolioUrl, linkedinUrl, answers })
        }}>
          {/* Resume Picker from Document Manager */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Resume <span className="text-rose-500">*</span>
            </label>
            {documents && documents.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={selectedDocId}
                  onChange={(e) => setSelectedDocId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"
                >
                  <option value="">Select a resume...</option>
                  {documents.filter(d => d.type === 'resume').map(doc => (
                    <option key={doc._id} value={doc._id}>
                      {doc.name} {doc.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </select>
                <Link
                  to="/dashboard/documents"
                  className="inline-block text-xs font-semibold text-primary hover:underline"
                >
                  Manage documents →
                </Link>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-600">No resumes found in Document Manager.</p>
                <Link
                  to="/dashboard/documents"
                  className="font-semibold text-primary hover:underline"
                >
                  Upload your resume first
                </Link>
              </div>
            )}
          </div>

          {/* Cover Letter Picker from Document Manager */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Cover Letter (optional)</label>
            {coverLetterDocs.length > 0 ? (
              <div className="space-y-2">
                <select
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white"
                >
                  <option value="">Select a cover letter...</option>
                  {coverLetterDocs.map(doc => (
                    <option key={doc._id} value={doc.url}>{doc.name} {doc.isDefault ? '(Default)' : ''}</option>
                  ))}
                </select>
                <Link
                  to="/dashboard/documents"
                  className="inline-block text-xs font-semibold text-primary hover:underline"
                >
                  Manage cover letters →
                </Link>
              </div>
            ) : null}
            <textarea
              rows={4}
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary"
              placeholder="Tell us why you're a great fit..."
            />
          </div>

          {/* Portfolio & LinkedIn */}
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Portfolio URL (optional)</label>
            <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="https://yourportfolio.com" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">LinkedIn Profile (optional)</label>
            <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="https://linkedin.com/in/yourprofile" />
          </div>

          {/* Screening Questions */}
          {screeningQuestions && screeningQuestions.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Screening Questions</p>
              {screeningQuestions.map((q, i) => (
                <div key={i} className="mb-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{q.question}</label>
                  <input type="text" required value={answers[i] || ''} onChange={e => setAnswers(p => ({ ...p, [i]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Your answer..." />
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Submit application'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function InternshipDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [internship, setInternship] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [applicationId, setApplicationId] = useState(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showApply, setShowApply] = useState(false)
  const [similar, setSimilar] = useState([])
  const [reporting, setReporting] = useState(false)
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get(`/api/internships/${id}`)
      .then(data => {
        if (cancelled) return
        setInternship(data.internship)
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  // Check if logged-in student has applied
  useEffect(() => {
    if (!user || user.role !== 'student') return
    api.get('/api/student/applications')
      .then(data => {
        const match = (data.applications || []).find(a => String(a.posting?._id || a.posting) === id && a.postingType === 'internship')
        if (match) {
          setApplied(true)
          setApplicationStatus(match.status)
          setApplicationId(match._id)
        }
      })
      .catch(() => {})
  }, [user, id])

  // Check if saved
  useEffect(() => {
    if (!user || user.role !== 'student') return
    api.get('/api/student/saved')
      .then(data => {
        if ((data.saved || []).some(s => String(s.posting?._id || s.posting) === id)) {
          setSaved(true)
        }
      })
      .catch(() => {})
  }, [user, id])

  // Load similar internships
  useEffect(() => {
    if (!internship) return
    const { skills, category, company } = internship
    const filters = { limit: 4 }
    if (skills?.length) filters.skills = skills.slice(0, 3).join(',')
    else if (category) filters.category = category
    api.get('/api/internships?' + new URLSearchParams(filters))
      .then(data => {
        let matches = (data.internships || []).filter(i => String(i._id) !== String(id))
        if (matches.length < 3 && company?._id) {
          api.get('/api/internships?' + new URLSearchParams({ limit: 4 }))
            .then(d2 => {
              const sameCompany = (d2.internships || []).filter(
                i => String(i._id) !== String(id) && String(i.company?._id || i.company) === String(company._id)
              )
              setSimilar([...matches, ...sameCompany].slice(0, 3))
            })
            .catch(() => setSimilar(matches.slice(0, 3)))
        } else {
          setSimilar(matches.slice(0, 3))
        }
      })
      .catch(() => {})
  }, [internship, id])

  // Set OG meta tags
  useEffect(() => {
    if (!internship) return
    const companyName = internship.company?.name || 'Company'
    const stipendText = internship.stipend ? `₹${Number(internship.stipend).toLocaleString()}/mo` : 'Unpaid'
    setMetaTags(
      `${internship.title} at ${companyName} | Bridge`,
      `${internship.title} — ${stipendText} · ${internship.location || 'Remote'} · ${internship.duration || ''}. Apply now!`,
      internship.company?.logoUrl || '',
      `${window.location.origin}/internship/${id}`
    )
  }, [internship, id])

  const handleApply = async ({ resumeDocId, coverLetter, portfolioUrl, linkedinUrl, answers }) => {
    setSubmitting(true)
    try {
      const payload = { resumeDocId, portfolioUrl, linkedinUrl, screeningAnswers: answers && Object.keys(answers).length ? answers : undefined }
      if (coverLetter) payload.coverLetter = coverLetter
      await api.post(`/api/internships/${id}/apply`, payload)
      setApplied(true)
      setShowApply(false)
      toast.success('Application submitted!', { description: `Your application to ${internship.title} was sent.` })
    } catch (err) {
      toast.error(err.message || 'Could not submit application')
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    if (!user || user.role !== 'student') return
    api.get('/api/student/documents')
      .then(data => setDocuments(data.documents || []))
      .catch(() => {})
  }, [user])

  const handleSave = async () => {
    if (!user) { toast.error('Log in to save this internship'); return }
    try {
      await api.post('/api/student/saved', { posting: id, postingType: 'internship' })
      setSaved(true)
      toast.success('Saved to your list!')
    } catch (err) {
      if (err.status === 400) {
        await api.delete(`/api/student/saved/${id}`)
        setSaved(false)
        toast.success('Removed from saved')
      } else {
        toast.error(err.message || 'Could not save')
      }
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/internship/${id}`
    if (navigator.share) {
      try { await navigator.share({ title: internship.title, url }) } catch {}
    } else {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleWithdraw = async () => {
    try {
      await api.delete(`/api/student/applications/${applicationId}`)
      setApplied(false)
      setApplicationStatus(null)
      toast.success('Application withdrawn')
    } catch (err) { toast.error(err.message || 'Could not withdraw') }
  }

  const handleReport = async () => {
    const reason = prompt('Why are you reporting this? (e.g., scam, fraud)')
    if (!reason?.trim()) return
    setReporting(true)
    try {
      await api.post('/api/reports', { targetType: 'internship', targetId: id, reason: reason.trim() })
      toast.success('Report submitted. Our team will review it.')
    } catch (err) { toast.error(err.message || 'Could not submit report') }
    finally { setReporting(false) }
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
          <div className="h-8 w-2/3 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-5 w-1/3 animate-pulse rounded-xl bg-slate-100" />
          <div className="flex gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />)}</div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className={`h-4 animate-pulse rounded bg-slate-100 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />)}</div>
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </SiteLayout>
    )
  }

  if (notFound || !internship) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">Internship not found</h1>
          <Link to="/internships" className="mt-4 inline-block text-primary underline">Browse internships</Link>
        </div>
      </SiteLayout>
    )
  }

  const company = internship.company || {}
  const initials = (company.name || internship.company || 'C').split(' ').map(w => w[0]).slice(0, 2).join('')
  const dl = deadlineInfo(internship.deadline)
  const isDeadlinePassed = dl?.closed === true
  const canApply = !applied && !isDeadlinePassed

  return (
    <SiteLayout>
      <div className="bg-surface px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <Link to="/internships" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-primary">
              <ArrowLeft className="size-4" /> Back to internships
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={handleSave} className="inline-flex items-center gap-1 rounded-lg p-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                {saved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
              </button>
              <button onClick={handleShare} className="inline-flex items-center gap-1 rounded-lg p-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                <Share2 className="size-4" /> Share
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-5">
              {company.logoUrl ? (
                <img src={assetUrl(company.logoUrl)} alt="" className="size-16 shrink-0 rounded-2xl border border-slate-200 object-cover shadow-sm" />
              ) : (
                <div className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${logoBgFor(company._id)} text-lg font-bold text-white shadow-sm`}>{initials}</div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold tracking-tight">{internship.title}</h1>
                  <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-bold text-purple-600 ring-1 ring-purple-200 shrink-0">Internship</span>
                  {internship.internshipType && (
                    <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-orange-600 ring-1 ring-orange-200 shrink-0">{internship.internshipType}</span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Link to={`/company/${company._id}`} className="text-lg font-medium text-slate-600 hover:text-primary underline underline-offset-2 decoration-slate-300">
                    {company.name || internship.company}
                  </Link>
                  {company.isVerified && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600 ring-1 ring-blue-200">
                      <BadgeCheck className="size-3.5" /> Verified
                    </span>
                  )}
                  {internship.hasPPO && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                      <Award className="size-3.5" /> PPO Available
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <Meta icon={<MapPin className="size-4" />}>{internship.location || 'Remote'}</Meta>
                  <Meta chip icon={<Building2 className="size-4" />}>{internship.mode || 'Remote'}</Meta>
                  <Meta icon={<Calendar className="size-4" />}>{timeAgo(internship.createdAt)}</Meta>
                  {dl && <Meta icon={<Clock className="size-4" />}><span className={dl.closed ? 'text-slate-400' : dl.urgent ? 'text-rose-600 font-bold' : 'text-amber-600'}>{dl.text}</span></Meta>}
                  <Meta icon={<Users className="size-4" />}>{internship.applicantsCount || 0} applied</Meta>
                  <Meta icon={<Eye className="size-4" />}>{internship.views || 0} views</Meta>
                  {!dl?.closed && internship.applicationFee !== 'paid' && (
                    <Meta icon={<ShieldCheck className="size-4 text-emerald-500" />}>
                      <span className="text-emerald-600 font-semibold">No application fee</span>
                    </Meta>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="rounded-full bg-emerald-50 px-5 py-2.5 text-base font-bold text-emerald-700">
                {internship.stipend ? `₹${Number(internship.stipend).toLocaleString()}/mo` : 'Unpaid'}
              </span>
              {user?.role === 'company' ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => navigate(`/company/posting/edit/${id}`)} variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50">Edit</Button>
                    {isDeadlinePassed || internship.status === 'closed' ? (
                      <Button onClick={async () => {
                        try {
                          await api.put(`/api/internships/${id}`, { status: 'approved', deadline: undefined })
                          toast.success('Internship reopened for applications!')
                          window.location.reload()
                        } catch (e) { toast.error(e.message) }
                      }} variant="ghost" className="rounded-xl border border-emerald-200 px-4 py-2 font-bold text-emerald-600 hover:bg-emerald-50"><RefreshCw className="size-4" /> Reopen</Button>
                    ) : (
                      <Button onClick={async () => {
                        try { await api.delete(`/api/internships/${id}`); toast.success('Internship closed'); navigate('/company/postings') }
                        catch (e) { toast.error(e.message) }
                      }} variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-rose-600 hover:bg-rose-50"><XCircle className="size-4" /> Close Early</Button>
                    )}
                    <Button onClick={async () => { try { await api.post(`/api/company/posting/internship/${id}/duplicate`); toast.success('Duplicated!'); navigate(0) } catch (e) { toast.error(e.message) } }} variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"><Copy className="size-4" /> Duplicate</Button>
                    <Button onClick={async () => { try { await api.patch(`/api/company/posting/internship/${id}/boost`); toast.success(internship.isBoosted ? 'Removed from boost' : 'Boosted!') } catch (e) { toast.error(e.message) } }} variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50"><TrendingUp className="size-4" /> {internship.isBoosted ? 'Unboost' : 'Boost'}</Button>
                    <Button onClick={() => navigate(`/company/pipeline?posting=${id}`)} className="rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:bg-primary/90">View Applicants ({internship.applicantsCount || 0})</Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-4 py-2.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-slate-500"><Eye className="size-3.5 text-slate-400" /><strong className="text-slate-700">{internship.views || 0}</strong> views</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-500"><Users className="size-3.5 text-slate-400" /><strong className="text-slate-700">{internship.applicantsCount || 0}</strong> applied</span>
                    <span className="inline-flex items-center gap-1.5 text-slate-500"><TrendingUp className="size-3.5 text-slate-400" /><strong className="text-slate-700">{internship.views > 0 ? `${((internship.applicantsCount || 0) / internship.views * 100).toFixed(1)}%` : '—'}</strong> conversion</span>
                  </div>
                </div>
              ) : applied ? (
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-xl bg-emerald-600 px-6 py-2 font-bold text-white"><Check className="size-4 inline mr-1" /> {applicationStatus || 'Applied'}</span>
                  <button onClick={handleWithdraw} className="text-xs font-semibold text-rose-600 hover:underline">Withdraw</button>
                </div>
              ) : canApply ? (
                <Button onClick={() => setShowApply(true)} className="rounded-xl bg-primary px-8 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25">Apply now</Button>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-base font-bold text-slate-400 cursor-not-allowed"><XCircle className="size-4" /> Closed</span>
              )}
            </div>
          </div>
        </div>
        {user?.role === 'student' && !applied && !isDeadlinePassed && (
          <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 shadow-2xl md:hidden">
            <div className="flex items-center justify-between">
              <span className="text-lg font-bold text-emerald-700">{internship.stipend ? `₹${Number(internship.stipend).toLocaleString()}/mo` : 'Unpaid'}</span>
              <Button onClick={() => setShowApply(true)} className="rounded-xl bg-primary px-8 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-lg">Apply now</Button>
            </div>
          </div>
        )}
      </div>

      <main className="mx-auto grid max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[1fr_280px]">
        {isDeadlinePassed && (
          <div className="col-span-full rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100"><XCircle className="size-5 text-rose-500" /></div>
              <div><p className="font-bold text-rose-800">Applications are now closed</p><p className="text-sm text-rose-600">The deadline for this internship has passed.</p></div>
            </div>
            <Link to="/internships" className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 sm:mt-0"><ArrowLeft className="size-3.5" /> Browse open internships</Link>
          </div>
        )}
        <article className="space-y-10">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            {internship.hasPPO && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 px-3 py-1 text-xs font-bold text-white shadow-sm"><Award className="size-4" /> PPO</span>
            )}
            <Meta icon={<Calendar className="size-4" />} chip>{internship.duration || 'Duration not specified'}</Meta>
            <Meta icon={<Clock className="size-4" />} chip>
              {internship.startDate ? (() => {
                const days = Math.ceil((new Date(internship.startDate).getTime() - Date.now()) / 86400000)
                return days <= 0 ? 'Started' : days <= 1 ? 'Starts Immediately' : `Starts ${days}d`
              })() : 'Starts Immediately'}
            </Meta>
            <Meta icon={<Users className="size-4" />} chip>{internship.vacancies || 1} openings</Meta>
            <Meta icon={<Briefcase className="size-4" />} chip>{internship.internshipType || 'Full-time'}</Meta>
          </div>

          <Section title="About the Internship" icon={FileText}>
            <p className="leading-relaxed text-slate-700 whitespace-pre-wrap">{internship.description}</p>
          </Section>

          {internship.roles?.length > 0 && (
            <Section title="Roles & Responsibilities" icon={Target}>
              <ul className="grid gap-2">{internship.roles.map((role, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><Check className="size-4 shrink-0 text-primary mt-0.5" />{role}</li>)}</ul>
            </Section>
          )}

          {internship.learningOutcomes?.length > 0 && (
            <Section title="What You'll Learn" icon={Sparkles} highlight>
              <ul className="grid gap-2">{internship.learningOutcomes.map((outcome, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><Sparkles className="size-4 shrink-0 text-emerald-500 mt-0.5" />{outcome}</li>)}</ul>
            </Section>
          )}

          {internship.skills?.length > 0 && (
            <Section title="Required Skills" icon={Check}>
              <div className="flex flex-wrap gap-2">{internship.skills.map(s => <SkillChip key={s} skill={s} />)}</div>
            </Section>
          )}

          {internship.goodToHaveSkills?.length > 0 && (
            <Section title="Good-to-have Skills"><div className="flex flex-wrap gap-2">{internship.goodToHaveSkills.map(s => <SkillChip key={s} skill={s} variant="goodToHave" />)}</div>
            </Section>
          )}

          {(internship.eligibility || internship.degreeRequired) && (
            <Section title="Eligibility Criteria" icon={Shield}>
              <dl className="space-y-3 text-sm">
                {internship.eligibility?.yearOfStudy && <Row k="Year of Study" v={internship.eligibility.yearOfStudy} />}
                {internship.degreeRequired && <Row k="Degree / Stream" v={internship.degreeRequired} />}
                {internship.eligibility?.ageLimit && <Row k="Age Limit" v={internship.eligibility.ageLimit} />}
                {internship.eligibility?.minCGPA && <Row k="Minimum CGPA" v={internship.eligibility.minCGPA} />}
                {internship.eligibility?.noBacklogs !== undefined && <Row k="Active Backlogs" v={internship.eligibility.noBacklogs ? 'Not allowed' : 'Allowed'} />}
                {internship.weeklyHours && <Row k="Weekly Commitment" v={`${internship.weeklyHours} hrs/week`} />}
              </dl>
            </Section>
          )}

          {internship.perks?.length > 0 && (
            <Section title="Perks & Benefits" icon={Award}>
              <div className="grid gap-3 sm:grid-cols-2">{internship.perks.map((perk, i) => <PerkCard key={i} icon={Award} label={perk} />)}</div>
            </Section>
          )}

          {(internship.laptopRequired || internship.screeningProcess || internship.cohortStartDate) && (
            <Section title="Additional Information" icon={Laptop}>
              <dl className="space-y-3 text-sm">{internship.laptopRequired && <Row k="Device Required" v={internship.laptopRequired} />}
                {internship.screeningProcess && <Row k="Screening Process" v={internship.screeningProcess} />}
                {internship.cohortStartDate && <Row k="Cohort Start Date" v={new Date(internship.cohortStartDate).toLocaleDateString('en-IN')} />}</dl>
            </Section>
          )}

          {internship.applicationFee !== 'paid' && (
            <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50/80 p-4">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-6 text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-bold text-emerald-800">Zero Application Fee</p>
                  <p className="text-xs text-emerald-600">This internship never asks for money. Report immediately if anyone requests payment.</p>
                </div>
              </div>
            </div>
          )}

          {user?.role === 'student' && (<button onClick={handleReport} disabled={reporting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600"><AlertCircle className="size-3.5" /> Report this listing</button>)}
        </article>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Snapshot</h4>
            <dl className="space-y-3 text-sm">
              <Row k="Duration" v={internship.duration || 'Not specified'} />
              <Row k="Stipend" v={internship.stipend ? `₹${Number(internship.stipend).toLocaleString()}/mo` : 'Unpaid'} />
              <Row k="Start Date" v={internship.startDate ? new Date(internship.startDate).toLocaleDateString('en-IN') : 'Immediately'} />
              <Row k="Work Mode" v={internship.mode || 'Remote'} />
              <Row k="Category" v={internship.category || 'General'} />
              <Row k="Posted" v={internship.createdAt ? new Date(internship.createdAt).toLocaleDateString('en-IN') : 'Recently'} />
            </dl>
          </div>

          {company._id && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">About the Company</h4>
              <div className="flex items-center gap-3">
                {company.logoUrl ? <img src={assetUrl(company.logoUrl)} alt="" className="size-10 rounded-xl object-cover" /> :
                  <div className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${logoBgFor(company._id)} text-xs font-bold text-white`}>{initials}</div>}
                <div className="min-w-0">
                  <Link to={`/company/${company._id}`} className="font-semibold hover:text-primary">{company.name}</Link>
                  {company.isVerified && (<span className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-bold text-blue-600"><BadgeCheck className="size-3" /> Verified</span>)}
                  <p className="text-xs text-slate-500 mt-1">{company.industry || 'Various'} · {company.size || 'Various sizes'}</p>
                </div>
              </div>
              {company.description && <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">{company.description}</p>}
              <Link to={`/company/${company._id}`} className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors"><Building2 className="size-3.5" /> View Full Profile <ExternalLink className="size-3" /></Link>
            </div>
          )}

          {similar.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Similar Internships</h4>
              <div className="space-y-3">{similar.map(s => (
                <Link key={s._id} to={`/internship/${s._id}`} className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-slate-500 mt-1">{s.company?.name}</p>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">{s.stipend ? `₹${Number(s.stipend).toLocaleString()}/mo` : 'Unpaid'}</p>
                </Link>
              ))}</div>
            </div>
          )}
        </aside>
      </main>

      {showApply && (<ApplyDialog onClose={() => setShowApply(false)} onSubmit={handleApply} title={internship.title} company={company.name} submitting={submitting} screeningQuestions={internship.screeningQuestions} documents={documents} defaultDoc={documents.find(d => d.isDefault)} />)}
    </SiteLayout>
  )
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-semibold text-slate-800">{v}</dd>
    </div>
  )
}
import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Users, ArrowLeft, Check, BadgeCheck, Building2, ExternalLink, Share2, Bookmark, BookmarkCheck, Clock, Award, Laptop, FileText, Target, Sparkles, Shield, AlertCircle, Briefcase, DollarSign, GraduationCap, HeartHandshake, Star, Copy, XCircle, TrendingUp, Eye, ShieldCheck, Timer, RefreshCw, CheckCircle, UserCheck, Flag, Plus, Settings, HelpCircle, MessageSquare } from 'lucide-react'
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
  if (days < 0) return { text: 'Expired', urgent: false, closed: true }
  if (days <= 1) return { text: 'Last day to apply!', urgent: true, closed: false }
  if (days <= 7) return { text: `${days} days left`, urgent: true, closed: false }
  return { text: `Apply by ${new Date(deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`, urgent: false, closed: false }
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

function Tooltip({ children, text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-56 rounded-lg bg-slate-800 px-3 py-2 text-center text-xs text-white shadow-lg">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  )
}

function Row({ k, v }) {
  if (!v && v !== 0) return null
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-semibold text-slate-800">{v}</dd>
    </div>
  )
}

function ApplyDialog({ onClose, onSubmit, title, posterName, submitting, screeningQuestions, peopleNeeded, filledCount, documents, defaultDoc }) {
  const [selectedDocId, setSelectedDocId] = useState(defaultDoc?._id || '')
  const [coverLetter, setCoverLetter] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [linkedinUrl, setLinkedinUrl] = useState('')
  const [message, setMessage] = useState('')
  const [answers, setAnswers] = useState({})

  const coverLetterDocs = documents?.filter(d => d.type === 'cover_letter') || []

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl font-bold">Express Interest</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><XCircle className="size-5" /></button>
        </div>
        <p className="text-sm text-slate-500">
          {title} &middot; posted by {posterName}
        </p>

        {peopleNeeded > 1 && filledCount < peopleNeeded && (
          <div className="mt-3 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-800">
            {filledCount} of {peopleNeeded} positions already filled &mdash; {peopleNeeded - filledCount} remaining
          </div>
        )}

        <form className="mt-6 space-y-4" onSubmit={(e) => {
          e.preventDefault()
          if (!selectedDocId) { toast.error('Please select a resume from Document Manager'); return }
          onSubmit({ resumeDocId: selectedDocId, coverLetter, portfolioUrl, linkedinUrl, message, answers })
        }}>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Resume <span className="text-rose-500">*</span></label>
            {documents && documents.length > 0 ? (
              <div className="space-y-2">
                <select value={selectedDocId} onChange={(e) => setSelectedDocId(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                  <option value="">Select a resume...</option>
                  {documents.filter(d => d.type === 'resume').map(doc => (<option key={doc._id} value={doc._id}>{doc.name} {doc.isDefault ? '(Default)' : ''}</option>))}
                </select>
                <Link to="/dashboard/documents" className="inline-block text-xs font-semibold text-primary hover:underline">Manage documents →</Link>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                <p className="text-slate-600">No resumes found in Document Manager.</p>
                <Link to="/dashboard/documents" className="font-semibold text-primary hover:underline">Upload your resume first</Link>
              </div>
            )}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Why are you interested? <span className="text-rose-500">*</span></label>
            <textarea rows={3} value={message} onChange={(e) => setMessage(e.target.value)} required
              className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary"
              placeholder="Briefly describe your relevant experience and why you're a good fit..." />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Cover Letter (optional)</label>
            {coverLetterDocs.length > 0 ? (
              <div className="space-y-2">
                <select value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                  <option value="">Select a cover letter...</option>
                  {coverLetterDocs.map(doc => (<option key={doc._id} value={doc.url}>{doc.name} {doc.isDefault ? '(Default)' : ''}</option>))}
                </select>
                <Link to="/dashboard/documents" className="inline-block text-xs font-semibold text-primary hover:underline">Manage cover letters →</Link>
              </div>
            ) : null}
            <textarea rows={3} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary" placeholder="Optional: Add a brief note about your background..." />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Portfolio / Work URL (optional)</label>
            <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="https://yourportfolio.com" />
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">LinkedIn / Social Profile (optional)</label>
            <input type="url" value={linkedinUrl} onChange={(e) => setLinkedinUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" placeholder="https://linkedin.com/in/yourprofile" />
          </div>

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
              {submitting ? 'Submitting…' : 'Send Interest'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OpportunityDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [opportunity, setOpportunity] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [applied, setApplied] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState(null)
  const [applicationId, setApplicationId] = useState(null)
  const [saved, setSaved] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showApply, setShowApply] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [similar, setSimilar] = useState([])
  const [documents, setDocuments] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get(`/api/opportunities/${id}`)
      .then(data => {
        if (cancelled) return
        setOpportunity(data.opportunity)
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!user || user.role !== 'student') return
    api.get('/api/student/applications')
      .then(data => {
        const match = (data.applications || []).find(a => String(a.posting?._id || a.posting) === id && a.postingType === 'opportunity')
        if (match) {
          setApplied(true)
          setApplicationStatus(match.status)
          setApplicationId(match._id)
        }
      })
      .catch(() => {})
  }, [user, id])

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

  useEffect(() => {
    if (!opportunity) return
    const { skills, role } = opportunity
    const filters = { limit: 4 }
    if (skills?.length) filters.skills = skills.slice(0, 3).join(',')
    else if (role) filters.role = role
    api.get('/api/opportunities?' + new URLSearchParams(filters))
      .then(data => {
        const matches = (data.opportunities || []).filter(i => String(i._id) !== String(id))
        setSimilar(matches.slice(0, 3))
      })
      .catch(() => {})
  }, [opportunity, id])

  useEffect(() => {
    if (!user || user.role !== 'student') return
    api.get('/api/student/documents').then(data => setDocuments(data.documents || [])).catch(() => {})
  }, [user])

  useEffect(() => {
    if (!opportunity) return
    const posterName = opportunity.poster?.name || 'User'
    const budgetText = opportunity.budget ? `₹${Number(opportunity.budget).toLocaleString()}` : 'Not Disclosed'
    setMetaTags(
      `${opportunity.title} by ${posterName} | Bridge`,
      `${opportunity.title} — ${budgetText} · ${opportunity.location || 'Remote'}. ${opportunity.peopleNeeded > 1 ? `${opportunity.peopleNeeded} people needed. ` : ''}Apply now!`,
      opportunity.poster?.avatarUrl || '',
      `${window.location.origin}/opportunity/${id}`
    )
  }, [opportunity, id])

  const handleApply = async ({ resumeDocId, coverLetter, portfolioUrl, linkedinUrl, message, answers }) => {
    if (!user) { toast.error('Log in to express interest'); return }
    setSubmitting(true)
    try {
      const payload = { resumeDocId, portfolioUrl, linkedinUrl, message, screeningAnswers: answers && Object.keys(answers).length ? answers : undefined }
      if (coverLetter) payload.coverLetter = coverLetter
      await api.post(`/api/opportunities/${id}/apply`, payload)
      setApplied(true)
      setShowApply(false)
      toast.success('Interest expressed!', { description: `The poster will review your profile and get back to you.` })
    } catch (err) {
      toast.error(err.message || 'Could not submit')
    } finally {
      setSubmitting(false)
    }
  }

  const handleSave = async () => {
    if (!user) { toast.error('Log in to save this opportunity'); return }
    try {
      await api.post('/api/student/saved', { posting: id, postingType: 'opportunity' })
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
    const url = `${window.location.origin}/opportunity/${id}`
    if (navigator.share) {
      try { await navigator.share({ title: opportunity.title, url }) } catch {}
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
    const reason = prompt('Why are you reporting this? (e.g., spam, misleading, fee request)')
    if (!reason?.trim()) return
    setReporting(true)
    try {
      await api.post('/api/reports', { targetType: 'opportunity', targetId: id, reason: reason.trim() })
      toast.success('Report submitted. Our team will review it.')
    } catch (err) { toast.error(err.message || 'Could not submit report') }
    finally { setReporting(false) }
  }

  const handleReportPoster = async () => {
    const reason = prompt('Why are you reporting this poster? (e.g., spam, fake profile, scam)')
    if (!reason?.trim()) return
    setReporting(true)
    try {
      await api.post('/api/reports', { targetType: 'person', targetId: poster._id, reason: reason.trim() })
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
          <div className="grid gap-6 lg:grid-cols-3"><div className="lg:col-span-2 space-y-3">{Array.from({ length: 8 }).map((_, i) => <div key={i} className={`h-4 animate-pulse rounded bg-slate-100 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />)}</div><div className="h-48 animate-pulse rounded-2xl bg-slate-100" /></div>
        </div>
      </SiteLayout>
    )
  }

  if (notFound || !opportunity) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-slate-50 ring-1 ring-slate-200">
            <Briefcase className="size-10 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold">Opportunity not found</h1>
          <p className="mt-2 text-sm text-slate-500">This opportunity doesn't exist, has been filled, or has been removed.</p>
          <Link to="/opportunities" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90">
            <ArrowLeft className="size-4" /> Browse opportunities
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const poster = opportunity.poster || {}
  const initials = (poster.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('')
  const dl = deadlineInfo(opportunity.deadline)
  const isDeadlinePassed = dl?.closed === true

  const peopleNeeded = opportunity.peopleNeeded || 1
  const filledCount = opportunity.filledCount || 0
  const openingsLeft = peopleNeeded - filledCount
  const isFullyFilled = filledCount >= peopleNeeded
  const canApply = !applied && !isDeadlinePassed && !isFullyFilled

  const verifiedCount = [poster.isEmailVerified, poster.isPhoneVerified, poster.isIdVerified].filter(Boolean).length
  const rolesBreakdown = opportunity.rolesNeeded || []

  const budgetTypeDisplay = opportunity.budgetType === 'monthly' ? '/month' : opportunity.budgetType === 'hourly' ? '/hr' : ' (fixed)'

  const isOwner = user?._id === String(poster._id)

  return (
    <SiteLayout>
      <div className="bg-surface px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <Link to="/opportunities" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-primary">
              <ArrowLeft className="size-4" /> Back to opportunities
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
              {poster.avatarUrl ? (
                <img src={assetUrl(poster.avatarUrl)} alt="" className="size-16 shrink-0 rounded-2xl border border-slate-200 object-cover shadow-sm" />
              ) : (
                <div className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${logoBgFor(poster._id)} text-lg font-bold text-white shadow-sm`}>{initials}</div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold tracking-tight">{opportunity.title}</h1>
                  <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-600 ring-1 ring-amber-200 shrink-0">{opportunity.opportunityType || 'Opportunity'}</span>
                  {opportunity.role && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20 shrink-0">
                      <UserCheck className="size-3.5" /> {opportunity.role}
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Link to={`/person/${poster._id || poster}`} className="text-lg font-medium text-slate-600 hover:text-primary underline underline-offset-2 decoration-slate-300">
                    {poster.name || 'Unknown'}
                  </Link>
                  {verifiedCount > 0 && (
                    <Tooltip text={`Email: ${poster.isEmailVerified ? '✓' : '—'} | Phone: ${poster.isPhoneVerified ? '✓' : '—'} | ID: ${poster.isIdVerified ? '✓' : '—'}`}>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 cursor-help">
                        <ShieldCheck className="size-3.5" />Tier {verifiedCount}/3
                      </span>
                    </Tooltip>
                  )}
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <Meta icon={<MapPin className="size-4" />}>{opportunity.location || 'Remote'}</Meta>
                  <Meta chip icon={<Building2 className="size-4" />}>{opportunity.mode || 'Remote'}</Meta>
                  <Meta icon={<Calendar className="size-4" />}>{timeAgo(opportunity.createdAt)}</Meta>
                  {dl && <Meta icon={<Clock className="size-4" />}><span className={dl.closed ? 'text-slate-400' : dl.urgent ? 'text-rose-600 font-bold' : 'text-amber-600'}>{dl.text}</span></Meta>}
                  <Meta icon={<Eye className="size-4" />}>{opportunity.views || 0} views</Meta>
                  <Meta icon={<Users className="size-4" />}>{opportunity.applicantsCount || 0} applied</Meta>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              {opportunity.budget && (
                <span className="rounded-full bg-emerald-50 px-5 py-2.5 text-base font-bold text-emerald-700">
                  ₹{Number(opportunity.budget).toLocaleString()}{budgetTypeDisplay}
                </span>
              )}
              {isOwner ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => navigate(`/post-opportunity?id=${id}`)} variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50">
                      <Settings className="size-4" /> Edit
                    </Button>
                    <Button onClick={async () => {
                      try { await api.post(`/api/opportunities/${id}/duplicate`); toast.success('Duplicated!'); navigate(0) }
                      catch (e) { toast.error(e.message) }
                    }} variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50">
                      <Copy className="size-4" /> Duplicate
                    </Button>
                    <Button onClick={async () => {
                      try { await api.delete(`/api/opportunities/${id}`); toast.success('Closed'); navigate('/opportunities') }
                      catch (e) { toast.error(e.message) }
                    }} variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-rose-600 hover:bg-rose-50">
                      <XCircle className="size-4" /> Close Early
                    </Button>
                    {!isFullyFilled && (filledCount > 0 || peopleNeeded > 1) && (
                      <Button onClick={async () => {
                        try { await api.patch(`/api/opportunities/${id}/filled`, { filledCount: filledCount + 1 }); window.location.reload() }
                        catch (e) { toast.error(e.message) }
                      }} variant="ghost" className="rounded-xl border border-emerald-200 px-4 py-2 font-bold text-emerald-600 hover:bg-emerald-50">
                        <Check className="size-4" /> Mark Filled +1
                      </Button>
                    )}
                    <Button onClick={() => navigate(`/company/pipeline?posting=${id}`)} className="rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:bg-primary/90">
                      View Applicants ({opportunity.applicantsCount || 0})
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-4 py-2.5 text-xs">
                    <span><Eye className="size-3.5 inline mr-1 text-slate-400" /><strong>{opportunity.views || 0}</strong> views</span>
                    <span><Users className="size-3.5 inline mr-1 text-slate-400" /><strong>{opportunity.applicantsCount || 0}</strong> applied</span>
                    <span><TrendingUp className="size-3.5 inline mr-1 text-slate-400" /><strong>{opportunity.views > 0 ? `${((opportunity.applicantsCount || 0) / opportunity.views * 100).toFixed(1)}%` : '—'}</strong> conversion</span>
                  </div>
                </div>
              ) : applied ? (
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-xl bg-emerald-600 px-6 py-2 font-bold text-white"><Check className="size-4 inline mr-1" /> {applicationStatus || 'Applied'}</span>
                  <button onClick={handleWithdraw} className="text-xs font-semibold text-rose-600 hover:underline">Withdraw</button>
                </div>
              ) : canApply ? (
                <div className="flex gap-2">
                  <Button onClick={() => setShowApply(true)} className="rounded-xl bg-primary px-6 py-2.5 font-bold text-primary-foreground hover:bg-primary/90">
                    Express Interest
                  </Button>
                  <Button onClick={() => {
                    if (!poster._id) { toast.error('Cannot message poster'); return }
                    const msgBase = user?.role === 'company' ? '/company/messages' : user?.role === 'agency' ? '/agency/messages' : '/dashboard/messages'
                    const redirectUrl = `${msgBase}?userId=${poster._id}`
                    if (!user) { navigate(`/login?redirect=${encodeURIComponent(redirectUrl)}`); return }
                    if (user.role === 'student' || user.role === 'company' || user.role === 'agency') {
                      navigate(redirectUrl)
                    } else {
                      toast.error('Messaging is only available for students, companies, and agencies')
                    }
                  }} variant="outline" className="rounded-xl border-slate-200 px-4 py-2.5 font-semibold text-slate-600 hover:bg-slate-50">
                    <MessageSquare className="size-4" />
                  </Button>
                </div>
              ) : isFullyFilled ? (
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-base font-bold text-slate-400 cursor-not-allowed"><CheckCircle className="size-4" /> Positions Filled</span>
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-base font-bold text-slate-600 cursor-not-allowed"><XCircle className="size-4" /> Closed</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isOwner && !applied && canApply && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 shadow-2xl md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-emerald-700">{opportunity.budget ? `₹${Number(opportunity.budget).toLocaleString()}${budgetTypeDisplay}` : 'Not Disclosed'}</span>
            <Button onClick={() => setShowApply(true)} className="rounded-xl bg-primary px-8 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-lg">Express Interest</Button>
          </div>
        </div>
      )}

      <main className="mx-auto grid max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[1fr_280px]">
        {isDeadlinePassed && !isFullyFilled && (
          <div className="col-span-full rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100"><XCircle className="size-5 text-rose-500" /></div>
              <div><p className="font-bold text-rose-800">Applications are now closed</p><p className="text-sm text-rose-600">The deadline for this opportunity has passed.</p></div>
            </div>
            <Link to="/opportunities" className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 sm:mt-0"><ArrowLeft className="size-3.5" /> Browse open opportunities</Link>
          </div>
        )}

        {isFullyFilled && (
          <div className="col-span-full rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100"><CheckCircle className="size-5 text-emerald-500" /></div>
              <div><p className="font-bold text-emerald-800">All positions filled</p><p className="text-sm text-emerald-600">This opportunity has been fully staffed.</p></div>
            </div>
          </div>
        )}

        <article className="space-y-10">
          {/* Quick Info Strip */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            {/* People needed — most prominent */}
            <div className="inline-flex items-center gap-2">
              <Users className="size-5 text-primary" />
              <div>
                <span className="text-sm font-bold text-slate-800">
                  {peopleNeeded === 1 ? '1 opening' : `${peopleNeeded} people needed`}
                </span>
                {filledCount > 0 && (
                  <span className={`ml-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    isFullyFilled ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                  }`}>
                    {filledCount} of {peopleNeeded} filled
                  </span>
                )}
              </div>
            </div>
            {!isFullyFilled && openingsLeft > 0 && openingsLeft < peopleNeeded && (
              <span className="text-xs font-semibold text-amber-600">Still hiring for remaining {openingsLeft}</span>
            )}
            {opportunity.duration && <Meta icon={<Timer className="size-4" />} chip>{opportunity.duration}</Meta>}
            {opportunity.budget && <Meta icon={<DollarSign className="size-4" />} chip>₹{Number(opportunity.budget).toLocaleString()}{budgetTypeDisplay}</Meta>}
            {opportunity.startDate && (
              <Meta icon={<Calendar className="size-4" />} chip>
                {new Date(opportunity.startDate).getTime() <= Date.now()
                  ? 'Immediate'
                  : new Date(opportunity.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
              </Meta>
            )}
            <Meta chip icon={<Building2 className="size-4" />}>{opportunity.mode || 'Remote'}</Meta>
          </div>

          {/* Description */}
          <Section title="About this Opportunity" icon={FileText}>
            <p className="leading-relaxed text-slate-700 whitespace-pre-wrap">{opportunity.description}</p>
          </Section>

          {/* What you'll be doing */}
          {opportunity.scope?.length > 0 && (
            <Section title="What You'll Be Doing" icon={Target}>
              <ul className="grid gap-2">{opportunity.scope.map((item, i) => <li key={i} className="flex items-start gap-2 text-sm text-slate-700"><Check className="size-4 shrink-0 text-primary mt-0.5" />{item}</li>)}</ul>
            </Section>
          )}

          {/* Required Skills */}
          {opportunity.skills?.length > 0 && (
            <Section title="Required Skills" icon={Check}>
              <div className="flex flex-wrap gap-2">{opportunity.skills.map(s => <SkillChip key={s} skill={s} />)}</div>
            </Section>
          )}

          {/* Required Tools/Software */}
          {opportunity.tools?.length > 0 && (
            <Section title="Required Tools & Software" icon={Laptop}>
              <div className="flex flex-wrap gap-2">{opportunity.tools.map(t => <SkillChip key={t} skill={t} />)}</div>
            </Section>
          )}

          {/* Good-to-have skills */}
          {opportunity.goodToHaveSkills?.length > 0 && (
            <Section title="Good-to-have Skills"><div className="flex flex-wrap gap-2">{opportunity.goodToHaveSkills.map(s => <SkillChip key={s} skill={s} variant="goodToHave" />)}</div>
            </Section>
          )}

          {/* Eligibility/Requirements */}
          {(opportunity.experienceLevel || opportunity.portfolioRequired !== undefined || opportunity.weeklyHours || opportunity.ownEquipment) && (
            <Section title="Eligibility & Requirements" icon={Shield}>
              <dl className="space-y-3 text-sm">
                {opportunity.experienceLevel && <Row k="Experience Level" v={opportunity.experienceLevel} />}
                {opportunity.portfolioRequired !== undefined && <Row k="Portfolio Required" v={opportunity.portfolioRequired ? 'Yes' : 'No'} />}
                {opportunity.weeklyHours && (
                  <Row k="Weekly Commitment" v={
                    opportunity.weeklyHours.toLowerCase().includes('hrs') || opportunity.weeklyHours.toLowerCase().includes('hour')
                      ? opportunity.weeklyHours
                      : `${opportunity.weeklyHours} hrs/week`
                  } />
                )}
                {opportunity.ownEquipment && (
                  <Row
                    k="Equipment / Software Required"
                    v={typeof opportunity.ownEquipment === 'boolean'
                      ? (opportunity.ownEquipment ? 'Yes — own equipment needed' : 'No')
                      : opportunity.ownEquipment}
                  />
                )}
              </dl>
            </Section>
          )}

          {/* Compensation & Payment Terms */}
          <Section title="Compensation & Payment Terms" icon={DollarSign} highlight>
            <dl className="space-y-3 text-sm">
              <Row k="Budget Type" v={opportunity.budgetType === 'monthly' ? 'Monthly' : opportunity.budgetType === 'hourly' ? 'Hourly' : 'Fixed project fee'} />
              {opportunity.budget && <Row k="Amount" v={`₹${Number(opportunity.budget).toLocaleString()}${budgetTypeDisplay}`} />}
              {opportunity.paymentSchedule && <Row k="Payment Schedule" v={opportunity.paymentSchedule} />}
            </dl>
            {opportunity.longTermPossible && (
              <div className="mt-3 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
                <Star className="size-4" /> Long-term collaboration possible
              </div>
            )}
          </Section>

          {/* Additional Logistics */}
          {(opportunity.screeningProcess || opportunity.laptopRequired) && (
            <Section title="Additional Information" icon={Laptop}>
              <dl className="space-y-3 text-sm">
                {opportunity.laptopRequired && <Row k="Device Required" v={opportunity.laptopRequired} />}
                {opportunity.screeningProcess && <Row k="Screening Process" v={opportunity.screeningProcess} />}
              </dl>
            </Section>
          )}

          {/* Multi-role breakdown (after logistics, before trust & safety) */}
          {rolesBreakdown.length > 0 && (
            <Section title="Roles Needed" icon={Users}>
              <div className="space-y-2">
                {rolesBreakdown.map((r, i) => (
                  <div key={i} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-3">
                    <span className="font-semibold text-slate-700">{r.title}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{r.count} needed</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Trust & Safety Section (critical for individuals) */}
          <Section title="Trust & Safety" icon={ShieldCheck}>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    Verification Tier: {verifiedCount}/3
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Email: {poster.isEmailVerified ? '✓ Verified' : '— Not verified'} &middot;
                    Phone: {poster.isPhoneVerified ? '✓ Verified' : '— Not verified'} &middot;
                    ID: {poster.isIdVerified ? '✓ Verified' : '— Not verified'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-3">
                <CheckCircle className="size-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-amber-800">No-fee Trust Signal</p>
                  <p className="text-xs text-amber-600">This poster has not been reported for any fee-related complaint. Never pay to apply or get hired.</p>
                </div>
              </div>

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-semibold text-rose-800">⚠ Safe Payment Advisory</p>
                <p className="mt-1 text-xs text-rose-600">
                  Keep all communication and payments on-platform. Do not transfer money directly or share OTP/banking info.
                  Report immediately if anyone asks for payment to apply or proceed.
                </p>
              </div>
            </div>
          </Section>

          {!isOwner && (
            <div className="flex flex-wrap items-center gap-4">
              <button onClick={handleReport} disabled={reporting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600">
                <Flag className="size-3.5" /> {reporting ? 'Submitting...' : 'Report this listing'}
              </button>
              <button onClick={handleReportPoster} disabled={reporting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600">
                <Flag className="size-3.5" /> {reporting ? 'Submitting...' : 'Report Poster'}
              </button>
            </div>
          )}
        </article>

        <aside className="space-y-4">
          {/* Snapshot */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Snapshot</h4>
            <dl className="space-y-3 text-sm">
              <Row k="Type" v={opportunity.opportunityType || '—'} />
              <Row k="Role" v={opportunity.role || '—'} />
              <Row k="People Needed" v={peopleNeeded === 1 ? '1' : `${filledCount}/${peopleNeeded} filled`} />
              <Row k="Duration" v={opportunity.duration || '—'} />
              <Row k="Budget" v={opportunity.budget ? `₹${Number(opportunity.budget).toLocaleString()}${budgetTypeDisplay}` : 'Not Disclosed'} />
              <Row k="Experience" v={opportunity.experienceLevel || '—'} />
              <Row k="Work Mode" v={opportunity.mode || 'Remote'} />
              <Row k="Location" v={opportunity.location || 'Remote'} />
              <Row k="Category" v={opportunity.category || '—'} />
              <Row k="Posted" v={opportunity.createdAt ? new Date(opportunity.createdAt).toLocaleDateString('en-IN') : 'Recently'} />
            </dl>
          </div>

          {/* About the Poster */}
          {poster._id && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">About the Poster</h4>
              <div className="flex items-center gap-3">
                {poster.avatarUrl ? <img src={assetUrl(poster.avatarUrl)} alt="" className="size-10 rounded-xl object-cover" /> :
                  <div className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${logoBgFor(poster._id)} text-xs font-bold text-white`}>{initials}</div>}
                <div className="min-w-0">
                  <Link to={`/person/${poster._id || poster}`} className="font-semibold hover:text-primary">{poster.name}</Link>
                  {verifiedCount > 0 && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-xs font-bold text-emerald-600"><ShieldCheck className="size-3" /> Tier {verifiedCount}/3</span>
                  )}
                  {poster.createdAt && <p className="text-xs text-slate-500 mt-1">Member since {new Date(poster.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}</p>}
                </div>
              </div>
              {poster.bio && <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">{poster.bio}</p>}
              {poster.totalOpportunities > 0 && (
                <div className="mt-3 flex gap-3 text-xs">
                  <span className="font-semibold text-slate-600">{poster.totalOpportunities} opportunities posted</span>
                  {poster.completionRate > 0 && <span className="text-emerald-600 font-semibold">{poster.completionRate}% completion</span>}
                </div>
              )}
              <Link to={`/person/${poster._id || poster}`} className="mt-4 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <UserCheck className="size-3.5" /> View Full Profile <ExternalLink className="size-3" />
              </Link>
            </div>
          )}

          {/* Similar Opportunities */}
          {similar.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Similar Opportunities</h4>
              <div className="space-y-3">{similar.map(s => (
                <Link key={s._id} to={`/opportunity/${s._id}`} className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                  <p className="font-semibold text-sm">{s.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                    <span>{s.poster?.name}</span>
                    {s.peopleNeeded > 1 && <span className="text-amber-600 font-medium">{s.peopleNeeded} needed</span>}
                  </div>
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    {s.budget ? `₹${Number(s.budget).toLocaleString()}${s.budgetType === 'monthly' ? '/mo' : ''}` : 'Budget not disclosed'}
                  </p>
                </Link>
              ))}</div>
            </div>
          )}

          {/* Owner view: Manage */}
          {isOwner && (
            <div className="rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Manage</h4>
              <Link to={`/post-opportunity?id=${id}`} className="flex w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <Settings className="size-3.5" /> Edit
              </Link>
              <button onClick={async () => {
                try { await api.post(`/api/opportunities/${id}/duplicate`); toast.success('Duplicated!'); navigate(0) }
                catch (e) { toast.error(e.message) }
              }} className="flex w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <Copy className="size-3.5" /> Duplicate
              </button>
              <Link to="/post-opportunity" className="flex w-full items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
                <Plus className="size-3.5" /> Post New Opportunity
              </Link>
              <button onClick={async () => {
                try { await api.patch(`/api/opportunities/${id}/filled`, { filledCount: 0 }); window.location.reload() }
                catch (e) { toast.error(e.message) }}
              } className="flex w-full items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                <RefreshCw className="size-3.5" /> Reset filled count
              </button>
            </div>
          )}
        </aside>
      </main>

      {showApply && (
        <ApplyDialog
          onClose={() => setShowApply(false)}
          onSubmit={handleApply}
          title={opportunity.title}
          posterName={poster.name}
          submitting={submitting}
          screeningQuestions={opportunity.screeningQuestions}
          peopleNeeded={peopleNeeded}
          filledCount={filledCount}
          documents={documents}
          defaultDoc={documents.find(d => d.isDefault)}
        />
      )}
    </SiteLayout>
  )
}
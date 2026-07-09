import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Calendar, Users, ArrowLeft, Check, BadgeCheck, Building2, ExternalLink,
  Share2, Bookmark, BookmarkCheck, Clock, Award, Laptop, FileText, Target, Sparkles,
  Shield, AlertCircle, Briefcase, DollarSign, GraduationCap, HeartHandshake, Star,
  Copy, XCircle, TrendingUp, Timer, Eye, ShieldCheck, RefreshCw, Zap,
  Camera, Globe, Linkedin, Layers, Wrench, FileSignature,
  Lightbulb, Gift, Milestone, Repeat, HelpCircle, BookOpen,
  Scale, FileWarning, Receipt, Split,
} from 'lucide-react'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
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
  const days = Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
  if (days < 0) return { text: 'Expired', urgent: false, closed: true }
  if (days <= 1) return { text: 'Last day to apply!', urgent: true, closed: false }
  if (days <= 7) return { text: `${days} days left`, urgent: true, closed: false }
  return { text: `Apply by ${new Date(deadline).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}`, urgent: false, closed: false }
}

function setMetaTags(title, description, image, url) {
  const update = (p, c) => { if (!c) return; let e = document.querySelector(`meta[property="${p}"]`); if (!e) { e = document.createElement('meta'); e.setAttribute('property', p); document.head.appendChild(e) }; e.setAttribute('content', c) }
  update('og:title', title); update('og:description', description); update('og:image', image); update('og:url', url); document.title = title
}

function Section({ title, icon: Icon, children, highlight }) {
  return (<section className={highlight ? 'rounded-2xl border-2 border-primary/20 bg-primary/5 p-6' : ''}>
    <div className="flex items-center gap-2 mb-3">{Icon && <Icon className="size-5 text-primary" />}<h3 className={`font-bold text-lg ${highlight ? 'text-primary' : ''}`}>{title}</h3></div>
    {children}
  </section>)
}

function Meta({ icon, children, chip }) {
  return (<span className="inline-flex items-center gap-1.5">{icon}{chip ? <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{children}</span> : children}</span>)
}

function SkillChip({ skill, variant = 'default' }) {
  const bg = variant === 'goodToHave' ? 'bg-slate-50 border border-slate-200 text-slate-600' : 'bg-primary/10 text-primary'
  return (<span className={`rounded-full px-3 py-1 text-xs font-semibold ${bg}`}>{skill}</span>)
}

const perkIcons = {
  'Certificate': GraduationCap, 'Certificate of Completion': GraduationCap,
  'LOR': HeartHandshake, 'Letter of Recommendation': HeartHandshake,
  'Flexible': Clock, 'Flexible hours': Clock, 'Flexible work hours': Clock,
  'Portfolio credit': BookOpen, 'Feature': Sparkles, 'Portfolio feature': Sparkles,
  'Mentorship': Star, 'Guidance': Star,
  'Training': GraduationCap,
  'Long-term': RefreshCw, 'Long-term collaboration': RefreshCw,
  'Milestone': Milestone, 'Milestone-based': DollarSign,
  'Weekly payment': DollarSign, 'On completion': DollarSign,
  'Equipment': Laptop, 'Software license': Laptop,
}

function PerkCard({ icon: Icon, label }) {
  const R = perkIcons[label] || Icon || Award
  return (<div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-md">
    <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><R className="size-5" /></div>
    <span className="text-sm font-semibold text-slate-700">{label}</span>
  </div>)
}

function Row({ k, v }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{k}</dt>
      <dd className="text-right font-semibold text-slate-800">{v}</dd>
    </div>
  )
}

function StarRating({ rating, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'size-5' : 'size-3.5'
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`${sizeClass} ${n <= Math.round(rating) ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
      ))}
    </div>
  )
}

function ApplyDialog({ onClose, onSubmit, title, agencyName, submitting, screeningQuestions, testTask }) {
  const [resume, setResume] = useState(null)
  const [coverLetter, setCoverLetter] = useState('')
  const [portfolioUrl, setPortfolioUrl] = useState('')
  const [answers, setAnswers] = useState({})
  const [fileError, setFileError] = useState('')
  const [testTaskFile, setTestTaskFile] = useState(null)
  const [testTaskFileError, setTestTaskFileError] = useState('')

  const hFile = (e) => {
    const f = e.target.files[0]
    if (!f) { setResume(null); return }
    if (f.type !== 'application/pdf') { setFileError('Only PDF allowed.'); setResume(null); return }
    if (f.size > 5 * 1024 * 1024) { setFileError('File must be under 5MB.'); setResume(null); return }
    setFileError(''); setResume(f)
  }

  const hTestTaskFile = (e) => {
    const f = e.target.files[0]
    if (!f) { setTestTaskFile(null); return }
    const maxSize = 50 * 1024 * 1024
    if (f.size > maxSize) { setTestTaskFileError('File must be under 50MB.'); setTestTaskFile(null); return }
    setTestTaskFileError(''); setTestTaskFile(f)
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-xl font-bold">Apply for {title}</h3>
          <button onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><XCircle className="size-5" /></button>
        </div>
        <p className="text-sm text-slate-500">via {agencyName}</p>

        <form className="mt-6 space-y-4" onSubmit={(e) => {
          e.preventDefault()
          if (!resume) { toast.error('Please upload your resume (PDF)'); return }
          onSubmit({ resume, coverLetter, portfolioUrl, answers, testTaskFile })
        }}>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Resume (PDF) <span className="text-rose-500">*</span>
            </label>
            <input type="file" accept=".pdf,application/pdf" onChange={hFile}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-primary" />
            {resume && <p className="mt-1 text-xs text-emerald-600">{resume.name}</p>}
            {fileError && <p className="mt-1 text-xs text-rose-500">{fileError}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Portfolio / Work Samples <span className="text-slate-400">(link)</span>
            </label>
            <input type="url" value={portfolioUrl} onChange={(e) => setPortfolioUrl(e.target.value)}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              placeholder="https://your-portfolio.com or Google Drive link" />
            <p className="mt-1 text-xs text-slate-400">Share links to your best work — agencies review portfolios first</p>
          </div>

          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Cover Letter (optional)</label>
            <textarea rows={4} value={coverLetter} onChange={(e) => setCoverLetter(e.target.value)}
              className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:border-primary"
              placeholder="Tell us why you're a great fit for this project..." />
          </div>

          {screeningQuestions && screeningQuestions.length > 0 && (
            <div className="border-t border-slate-200 pt-4">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Screening Questions</p>
              {screeningQuestions.map((q, i) => (
                <div key={i} className="mb-3">
                  <label className="mb-1 block text-xs font-semibold text-slate-600">{q.question} {q.required && <span className="text-rose-500">*</span>}</label>
                  <input type="text" required={q.required} value={answers[i] || ''} onChange={e => setAnswers(p => ({ ...p, [i]: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" placeholder="Your answer..." />
                </div>
              ))}
            </div>
          )}

          {testTask?.title && (
            <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <FileSignature className="size-4 text-amber-600" />
                <span className="font-bold text-sm text-amber-800">Test Task: {testTask.title}</span>
              </div>
              {testTask.description && <p className="text-xs text-amber-700 mb-3">{testTask.description}</p>}
              <input type="file" accept=".pdf,.zip,.mp4,.jpg,.png,.mov,.psd,.ai,.indd" onChange={hTestTaskFile}
                className="w-full rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm outline-none focus:border-amber-500 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-100 file:px-3 file:py-1 file:text-xs file:font-semibold file:text-amber-700" />
              {testTaskFile && <p className="mt-1 text-xs text-emerald-600">{testTaskFile.name}</p>}
              {testTaskFileError && <p className="mt-1 text-xs text-rose-500">{testTaskFileError}</p>}
              <p className="mt-1 text-xs text-amber-600">Upload your completed sample task here (max 50MB)</p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting} className="bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60">
              {submitting ? 'Submitting…' : 'Apply+'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AgencyMiniCard({ agency, reviewStats }) {
  if (!agency) return null
  const initials = (agency.agencyName || '').split(' ').map(w => w[0]).slice(0, 2).join('')

  const verificationBadge = agency.isRegistered && agency.regCertificate
    ? { label: 'Registered', cls: 'text-emerald-600 ring-emerald-200 bg-emerald-50' }
    : agency.idProof
      ? { label: 'ID Verified', cls: 'text-blue-600 ring-blue-200 bg-blue-50' }
      : { label: 'Unverified', cls: 'text-slate-400 ring-slate-200 bg-slate-50' }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">About the Agency</h4>
      <div className="flex items-center gap-3">
        {agency.logoUrl ? (
          <img src={agency.logoUrl} alt="" className="size-10 rounded-xl object-cover" />
        ) : (
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-xs font-bold text-white">
            {initials || 'A'}
          </div>
        )}
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link to={`/agency/${agency._id}`} className="font-semibold hover:text-primary">
              {agency.agencyName}
            </Link>
            <span className={`inline-flex items-center gap-0.5 text-xs font-bold ${verificationBadge.cls} rounded-full px-1.5 py-0.5`}>
              {verificationBadge.label !== 'Unverified' && <BadgeCheck className="size-3" />}
              {verificationBadge.label}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">{(agency.services || []).slice(0, 2).join(', ')}{agency.teamSize ? ` · ${agency.teamSize} members` : ''}</p>
        </div>
      </div>
      {agency.description && <p className="mt-3 text-xs text-slate-600 line-clamp-3 leading-relaxed">{agency.description}</p>}
      {reviewStats && reviewStats.count > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2">
          <span className="text-base font-extrabold text-slate-800">{reviewStats.avgRating.toFixed(1)}</span>
          <StarRating rating={reviewStats.avgRating} size="sm" />
          <span className="text-xs text-slate-500">({reviewStats.count})</span>
        </div>
      )}
      <Link to={`/agency/${agency._id}`}
        className="mt-3 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
        <Building2 className="size-3.5" /> View Full Profile <ExternalLink className="size-3" />
      </Link>
    </div>
  )
}

export default function AgencyListingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [listing, setListing] = useState(null)
  const [kind, setKind] = useState('job')
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
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, count: 0 })

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get(`/api/agency/listing/${id}`)
      .then(data => {
        if (cancelled) return
        setListing(data.listing)
        setKind(data.kind)
        if (data.reviewStats) setReviewStats(data.reviewStats)
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!user || user.role !== 'student') return
    api.get('/api/student/applications').then(data => {
      const match = (data.applications || []).find(a => String(a.posting?._id || a.posting) === id)
      if (match) {
        setApplied(true)
        setApplicationStatus(match.status)
        setApplicationId(match._id)
      }
    }).catch(() => {})
  }, [user, id])

  useEffect(() => {
    if (!user || user.role !== 'student') return
    api.get('/api/student/saved').then(data => {
      if ((data.saved || []).some(s => String(s.posting?._id || s.posting) === id)) setSaved(true)
    }).catch(() => {})
  }, [user, id])

  useEffect(() => {
    if (!listing) return
    const { skills, category, agency: listingAgency } = listing
    const params = { limit: 4 }
    if (skills?.length) params.skills = skills.slice(0, 3).join(',')
    else if (category) params.category = category

    const endpoint = kind === 'internship' ? '/api/internships' : '/api/jobs'
    api.get(endpoint + '?' + new URLSearchParams(params))
      .then(data => {
        let matches = (kind === 'internship' ? (data.internships || []) : (data.jobs || []))
          .filter(i => String(i._id) !== String(id))
        if (matches.length < 3 && listingAgency?._id) {
          api.get('/api/agency/listing-feed?' + new URLSearchParams({ limit: 6 }))
            .then(d2 => {
              const sameAgency = (d2.listings || []).filter(
                l => String(l._id) !== String(id) && String(l.agency?._id || l.agency) === String(listingAgency._id)
              )
              setSimilar([...matches, ...sameAgency].slice(0, 3))
            })
            .catch(() => setSimilar(matches.slice(0, 3)))
        } else {
          setSimilar(matches.slice(0, 3))
        }
      })
      .catch(() => {})
  }, [listing, kind, id])

  useEffect(() => {
    if (!listing) return
    const agencyName = listing.agency?.agencyName || 'Agency'
    const pay = listing.projectFee
      ? `₹${Number(listing.projectFee).toLocaleString()} fixed`
      : listing.hourlyRate
        ? `₹${Number(listing.hourlyRate).toLocaleString()}/hr`
        : listing.salaryMin
          ? `₹${Number(listing.salaryMin).toLocaleString()}`
          : listing.stipend
            ? `₹${Number(listing.stipend).toLocaleString()} stipend`
            : 'Negotiable'
    setMetaTags(
      `${listing.title} by ${agencyName} | Bridge`,
      `${listing.title} — ${pay} · ${listing.location || 'Remote'} · ${listing.category || 'Creative'}. Apply now!`,
      listing.agency?.logoUrl || '',
      `${window.location.origin}/agency/listing/${id}`
    )
  }, [listing, id])

  const handleApply = async ({ resume, coverLetter, portfolioUrl, answers, testTaskFile }) => {
    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('resume', resume)
      if (coverLetter) formData.append('coverLetter', coverLetter)
      if (portfolioUrl) formData.append('portfolioUrl', portfolioUrl)
      if (answers && Object.keys(answers).length) formData.append('screeningAnswers', JSON.stringify(answers))
      if (testTaskFile) formData.append('testTask', testTaskFile)

      const endpoint = kind === 'internship' ? `/api/internships/${id}/apply`
        : kind === 'opportunity' ? `/api/opportunities/${id}/apply`
        : `/api/jobs/${id}/apply`
      await api.postForm(endpoint, formData)
      setApplied(true)
      setShowApply(false)
      toast.success('Application submitted!')
    } catch (err) {
      toast.error(err.message || 'Could not submit application')
    } finally { setSubmitting(false) }
  }

  const handleSave = async () => {
    if (!user) { toast.error('Log in to save this listing'); return }
    try {
      await api.post('/api/student/saved', { posting: id, postingType: kind })
      setSaved(true)
      toast.success('Saved!')
    } catch (err) {
      if (err.status === 400) { await api.delete(`/api/student/saved/${id}`); setSaved(false); toast.success('Removed') }
      else toast.error(err.message || 'Could not save')
    }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/agency/listing/${id}`
    if (navigator.share) { try { await navigator.share({ title: listing?.title, url }) } catch {} }
    else { await navigator.clipboard.writeText(url); toast.success('Link copied!') }
  }

  const handleWithdraw = async () => {
    try { await api.delete(`/api/student/applications/${applicationId}`); setApplied(false); setApplicationStatus(null); toast.success('Application withdrawn') }
    catch (err) { toast.error(err.message || 'Could not withdraw') }
  }

  const handleReport = async () => {
    const reason = prompt('Why are you reporting this listing? (e.g., scam, fraud, misleading)')
    if (!reason?.trim()) return
    setReporting(true)
    try { await api.post('/api/reports', { targetType: kind, targetId: id, reason: reason.trim() }); toast.success('Report submitted') }
    catch (err) { toast.error(err.message || 'Could not submit') }
    finally { setReporting(false) }
  }

  // ── Loading state ──
  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
          <div className="h-8 w-2/3 animate-pulse rounded-xl bg-slate-100" />
          <div className="h-5 w-1/3 animate-pulse rounded-xl bg-slate-100" />
          <div className="flex gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-7 w-20 animate-pulse rounded-full bg-slate-100" />)}</div>
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => <div key={i} className={`h-4 animate-pulse rounded bg-slate-100 ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />)}
            </div>
            <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        </div>
      </SiteLayout>
    )
  }

  if (notFound || !listing) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">Listing not found</h1>
          <p className="mt-2 text-sm text-slate-500">This posting has been removed, has expired, or doesn't exist.</p>
          <Link to="/agencies" className="mt-6 inline-block rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary/90">Browse agencies</Link>
        </div>
      </SiteLayout>
    )
  }

  const agency = listing.agency || {}
  const initials = (agency.agencyName || 'A').split(' ').map(w => w[0]).slice(0, 2).join('')
  const dl = deadlineInfo(listing.deadline)
  const isDeadlinePassed = dl?.closed === true
  const canApply = !applied && !isDeadlinePassed

  // Determine posting type display: opportunityType > agency-project > kind-based
  const rawType = listing.opportunityType
    || (listing.isClientProject || listing.employmentType === 'Contract' || listing.projectFee || listing.hourlyRate ? 'Project-based' : null)
    || (listing.employmentType === 'Part-time' ? 'Part-time' : null)
    || (listing.employmentType === 'Full-time' ? 'Full-time' : null)
    || (kind === 'internship' ? 'Internship' : null)
    || (listing.agency ? 'Project' : 'Job')

  const POSTING_LABEL_MAP = {
    'Project-based': 'Project', 'Project': 'Project',
    'Part-time': 'Part-time', 'Full-time': 'Full-time',
    'Internship': 'Internship', 'Job': 'Job',
  }
  const postingTypeLabel = POSTING_LABEL_MAP[rawType] || 'Project'

  const POSTING_COLOR_MAP = {
    'Project': 'bg-amber-50 text-amber-600 ring-amber-200',
    'Part-time': 'bg-violet-50 text-violet-600 ring-violet-200',
    'Full-time': 'bg-emerald-50 text-emerald-600 ring-emerald-200',
    'Internship': 'bg-purple-50 text-purple-600 ring-purple-200',
    'Job': 'bg-blue-50 text-blue-600 ring-blue-200',
  }
  const postingTypeColor = POSTING_COLOR_MAP[postingTypeLabel] || 'bg-slate-50 text-slate-600 ring-slate-200'

  // Sub-label for employment type subtext
  const jobSubLabel = (postingTypeLabel === 'Job' || postingTypeLabel === 'Project') && listing.employmentType === 'Part-time' ? 'Part-time' : null

  // Pay display — supports multiple pay models
  const payDisplay = listing.projectFee
    ? `₹${Number(listing.projectFee).toLocaleString()} fixed`
    : listing.hourlyRate
      ? `₹${Number(listing.hourlyRate).toLocaleString()}/hr`
      : listing.salaryMin
        ? `₹${Number(listing.salaryMin).toLocaleString()}${listing.salaryMax ? ` - ₹${Number(listing.salaryMax).toLocaleString()}` : ''}/mo`
        : listing.stipend
          ? `₹${Number(listing.stipend).toLocaleString()}/mo`
          : 'Negotiable'

  return (
    <SiteLayout>
      {/* ── HERO HEADER ── */}
      <div className="bg-surface px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <Link to="/agencies" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-primary">
              <ArrowLeft className="size-4" /> Back to listings
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
              {agency.logoUrl ? (
                <img src={agency.logoUrl} alt="" className="size-16 shrink-0 rounded-2xl object-cover" />
              ) : (
                <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-lg font-bold text-white">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold tracking-tight">{listing.title}</h1>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ring-1 shrink-0 ${postingTypeColor}`}>{postingTypeLabel}</span>
                  {listing.category && (
                    <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-bold text-violet-600 ring-1 ring-violet-200 shrink-0">
                      {listing.category}
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <Link to={`/agency/${agency._id}`} className="text-lg font-medium text-slate-600 hover:text-primary underline underline-offset-2 decoration-slate-300">
                    {agency.agencyName}
                  </Link>
                  {agency.isRegistered && agency.regCertificate ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600 ring-1 ring-emerald-200">
                      <BadgeCheck className="size-3.5" /> Registered
                    </span>
                  ) : agency.idProof ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-bold text-blue-600 ring-1 ring-blue-200">
                      <BadgeCheck className="size-3.5" /> ID Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-400 ring-1 ring-slate-200">
                      Unverified
                    </span>
                  )}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <Meta icon={<MapPin className="size-4" />}>{listing.location || 'Remote'}</Meta>
                  <Meta chip icon={<Building2 className="size-4" />}>{listing.mode || 'Remote'}</Meta>
                  <Meta icon={<Calendar className="size-4" />}>{timeAgo(listing.createdAt)}</Meta>
                  {dl && <Meta icon={<Clock className="size-4" />}><span className={dl.closed ? 'text-slate-400' : dl.urgent ? 'text-rose-600 font-bold' : 'text-amber-600'}>{dl.text}</span></Meta>}
                  <Meta icon={<Users className="size-4" />}>{listing.applicantsCount || 0} applied</Meta>
                  <Meta icon={<Eye className="size-4" />}>{listing.views || 0} views</Meta>
                  <Meta icon={<ShieldCheck className="size-4 text-emerald-500" />}>
                    <span className="text-emerald-600 font-semibold">No fee</span>
                  </Meta>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="rounded-full bg-emerald-50 px-5 py-2.5 text-base font-bold text-emerald-700">
                {payDisplay}
              </span>
              {user?._id === String(agency.user) || user?._id === listing.postedBy ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={() => navigate(`/agency/posting/edit/${id}`)} variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50">
                      Edit
                    </Button>
                    {isDeadlinePassed || listing.status === 'closed' ? (
                      <Button onClick={async () => {
                        try { await api.put(`/api/${kind}s/${id}`, { status: 'approved', deadline: undefined }); toast.success('Reopened!'); window.location.reload() }
                        catch (e) { toast.error(e.message) }
                      }} variant="ghost" className="rounded-xl border border-emerald-200 px-4 py-2 font-bold text-emerald-600 hover:bg-emerald-50">
                        <RefreshCw className="size-4" /> Reopen
                      </Button>
                    ) : (
                      <Button onClick={async () => {
                        try { await api.delete(`/api/${kind}s/${id}`); toast.success('Closed'); navigate('/agency/dashboard') }
                        catch (e) { toast.error(e.message) }
                      }} variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-rose-600 hover:bg-rose-50">
                        <XCircle className="size-4" /> Close Early
                      </Button>
                    )}
                    <Button onClick={async () => {
                      try { await api.post(`/api/agency/posting/${kind}/${id}/duplicate`); toast.success('Duplicated!'); navigate(0) }
                      catch (e) { toast.error(e.message) }
                    }} variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50">
                      <Copy className="size-4" /> Duplicate
                    </Button>
                    <Button variant="ghost" className="rounded-xl border border-slate-200 px-4 py-2 font-bold text-slate-600 hover:bg-slate-50">
                      <Zap className="size-4" /> Boost
                    </Button>
                    <Button onClick={() => navigate(`/agency/applicants?posting=${id}`)} className="rounded-xl bg-primary px-5 py-2.5 font-bold text-primary-foreground hover:bg-primary/90">
                      View Applicants ({listing.applicantsCount || 0})
                    </Button>
                  </div>
                  <div className="flex flex-wrap items-center gap-4 rounded-xl bg-slate-50 px-4 py-2.5 text-xs">
                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                      <Eye className="size-3.5 text-slate-400" />
                      <strong className="text-slate-700">{listing.views || 0}</strong> views
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                      <Users className="size-3.5 text-slate-400" />
                      <strong className="text-slate-700">{listing.applicantsCount || 0}</strong> applied
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-slate-500">
                      <TrendingUp className="size-3.5 text-slate-400" />
                      <strong className="text-slate-700">
                        {listing.views > 0 ? `${((listing.applicantsCount || 0) / listing.views * 100).toFixed(1)}%` : listing.applicantsCount > 0 ? '100%' : '—'}
                      </strong> conversion
                    </span>
                    <span className="ml-auto text-slate-400">
                      {listing.isBoosted && <span className="text-amber-600 font-semibold mr-2">Boosted</span>}
                      {listing.status === 'closed' && <span className="text-rose-600 font-semibold">Closed</span>}
                      {isDeadlinePassed && listing.status !== 'closed' && <span className="text-slate-400">Deadline passed</span>}
                    </span>
                  </div>
                </div>
              ) : applied ? (
                <div className="flex flex-col items-end gap-2">
                  <span className="rounded-xl bg-emerald-600 px-6 py-2 font-bold text-white">
                    <Check className="size-4 inline mr-1" /> {applicationStatus || 'Applied'}
                  </span>
                  <button onClick={handleWithdraw} className="text-xs font-semibold text-rose-600 hover:underline">Withdraw</button>
                </div>
              ) : !applied && !isDeadlinePassed ? (
                user ? (
                  <Button onClick={() => setShowApply(true)} className="rounded-xl bg-primary px-8 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25">
                    Apply+
                  </Button>
                ) : (
                  <Link to="/login" className="rounded-xl bg-primary px-8 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 inline-block">
                    Log in to Apply
                  </Link>
                )
              ) : (
                <span className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-6 py-3 text-base font-bold text-slate-400 cursor-not-allowed">
                  <XCircle className="size-4" /> Closed
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── STICKY APPLY+ (Mobile) ── */}
      {!isDeadlinePassed && !applied && user && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white p-4 shadow-2xl md:hidden">
          <div className="flex items-center justify-between">
            <span className="text-lg font-bold text-emerald-700">{payDisplay}</span>
            <Button onClick={() => setShowApply(true)} className="rounded-xl bg-primary px-8 py-3 text-base font-bold text-primary-foreground hover:bg-primary/90 shadow-lg">
              Apply+
            </Button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <main className="mx-auto grid max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[1fr_280px]">
        {isDeadlinePassed && (
          <div className="col-span-full rounded-2xl border-2 border-rose-200 bg-rose-50 p-4 sm:flex sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-100">
                <XCircle className="size-5 text-rose-500" />
              </div>
              <div>
                <p className="font-bold text-rose-800">Applications are now closed</p>
                <p className="text-sm text-rose-600">The deadline for this posting has passed.</p>
              </div>
            </div>
            <Link to="/agencies" className="mt-3 inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-white px-4 py-2 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 sm:mt-0">
              <ArrowLeft className="size-3.5" /> Browse agency listings
            </Link>
          </div>
        )}

        <article className="space-y-10">
          {/* ── QUICK INFO STRIP ── */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            {listing.projectFee ? (
              <Meta icon={<DollarSign className="size-4" />} chip>{payDisplay}</Meta>
            ) : listing.hourlyRate ? (
              <Meta icon={<Timer className="size-4" />} chip>{payDisplay}</Meta>
            ) : (
              <Meta icon={<DollarSign className="size-4" />} chip>{payDisplay}</Meta>
            )}
            {listing.duration && (
              <Meta icon={<Timer className="size-4" />} chip>
                {listing.duration.toLowerCase().includes('month') || listing.duration.toLowerCase().includes('year') || listing.duration.toLowerCase().includes('long')
                  ? listing.duration
                  : `${listing.duration.replace(/^(\d+).*/, '$1')} ${parseInt(listing.duration) > 1 ? 'months' : 'month'}`}
              </Meta>
            )}
            <Meta icon={<Calendar className="size-4" />} chip>
              {listing.startDate
                ? new Date(listing.startDate).getTime() - Date.now() <= 0
                  ? 'Started'
                  : new Date(listing.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })
                : 'Immediately'}
            </Meta>
            <Meta icon={<Users className="size-4" />} chip>{listing.vacancies || 1} opening{listing.vacancies !== 1 ? 's' : ''}</Meta>
            <Meta icon={<Briefcase className="size-4" />} chip>{postingTypeLabel}{jobSubLabel ? ` (${jobSubLabel})` : ''}</Meta>
            {listing.tools?.length > 0 && (
              <Meta icon={<Wrench className="size-4" />} chip>{listing.tools.slice(0, 3).join(', ')}{listing.tools.length > 3 ? ` +${listing.tools.length - 3}` : ''}</Meta>
            )}
          </div>

          {/* ── DESCRIPTION ── */}
          <Section title={kind === 'internship' ? 'About the Internship' : 'Description'} icon={FileText}>
            <p className="leading-relaxed text-slate-700 whitespace-pre-wrap">{listing.description}</p>
          </Section>

          {listing.roles?.length > 0 && (
            <Section title="Scope of Work / Deliverables" icon={Target}>
              <ul className="grid gap-2">
                {listing.roles.map((role, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                    <Check className="size-4 shrink-0 text-primary mt-0.5" />
                    {role}
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {/* ── SKILLS ── */}
          {listing.skills?.length > 0 && (
            <Section title="Required Skills" icon={Check}>
              <div className="flex flex-wrap gap-2">
                {listing.skills.map(s => <SkillChip key={s} skill={s} />)}
              </div>
            </Section>
          )}

          {listing.tools?.length > 0 && (
            <Section title="Required Tools & Software" icon={Wrench}>
              <div className="flex flex-wrap gap-2">
                {listing.tools.map(t => <SkillChip key={t} skill={t} />)}
              </div>
              <p className="mt-2 text-xs text-slate-400">You need access to these tools/software for this project</p>
            </Section>
          )}

          {listing.goodToHaveSkills?.length > 0 && (
            <Section title="Good-to-have Skills" icon={Lightbulb}>
              <div className="flex flex-wrap gap-2">
                {listing.goodToHaveSkills.map(s => <SkillChip key={s} skill={s} variant="goodToHave" />)}
              </div>
            </Section>
          )}

          {/* ── ELIGIBILITY / REQUIREMENTS ── */}
          <Section title="Eligibility & Requirements" icon={Shield}>
            <dl className="space-y-3 text-sm">
              {listing.experienceLevel && <Row k="Experience Level" v={{ fresher: 'Fresher', intermediate: 'Intermediate', expert: 'Expert' }[listing.experienceLevel] || listing.experienceLevel} />}
              {listing.portfolioRequired && <Row k="Portfolio Required" v={listing.portfolioType || 'Yes'} />}
              {!listing.portfolioRequired && <Row k="Portfolio Required" v="No" />}
              {listing.equipmentRequired && <Row k="Own Equipment / License" v={listing.equipmentRequired} />}
              {kind === 'internship' && listing.laptopRequired && <Row k="Laptop Required" v={listing.laptopRequired} />}
              {listing.degreeRequired && <Row k="Degree / Stream" v={listing.degreeRequired} />}
              {listing.experience && <Row k="Experience" v={listing.experience} />}
            </dl>
          </Section>

          {/* ── LONG-TERM COLLABORATION BADGE ── */}
          {listing.longTermCollaboration && (
            <div className="rounded-2xl border-2 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <RefreshCw className="size-6 text-primary" />
                </div>
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    <Sparkles className="size-3" /> Long-term Collaboration
                  </div>
                  <p className="mt-1.5 text-sm text-slate-600">This listing has potential for ongoing work — one-time project vs repeat collaboration, discuss with the agency.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── PERKS & BENEFITS ── */}
          {(listing.benefits?.length > 0 || listing.perks?.length > 0 || listing.paymentSchedule || listing.portfolioCredit) && (
            <Section title="Perks & Benefits" icon={Gift}>
              {(postingTypeLabel === 'Internship') && (
                <p className="mb-3 text-xs text-slate-500 font-semibold">Internship perks</p>
              )}
              {(postingTypeLabel === 'Job') && (
                <p className="mb-3 text-xs text-slate-500 font-semibold">Employment benefits</p>
              )}
              {(postingTypeLabel === 'Project') && (
                <p className="mb-3 text-xs text-slate-500 font-semibold">Project / Gig perks</p>
              )}
              <div className="grid gap-3 sm:grid-cols-2">
                {(listing.perks || listing.benefits || []).map((p, i) => (
                  <PerkCard key={i} icon={Award} label={p} />
                ))}
                {listing.portfolioCredit && (
                  <PerkCard icon={BookOpen} label="Portfolio credit / Feature" />
                )}
                {listing.paymentSchedule && (
                  <PerkCard icon={DollarSign} label={
                    listing.paymentSchedule.toLowerCase().includes('monthly') ? 'Monthly payment'
                    : listing.paymentSchedule.toLowerCase().includes('hourly') ? 'Hourly payment'
                    : listing.paymentSchedule.toLowerCase().includes('milestone') ? 'Milestone-based payment'
                    : listing.paymentSchedule.toLowerCase().includes('weekly') ? 'Weekly payment'
                    : listing.paymentSchedule.toLowerCase().includes('completion') ? 'Payment on completion'
                    : listing.paymentSchedule
                  } />
                )}
              </div>
            </Section>
          )}

          {/* ── ADDITIONAL LOGISTICS ── */}
          {(listing.equipmentRequired || listing.screeningProcess || listing.revisionPolicy || listing.paymentSchedule) && (
            <Section title="Additional Logistics" icon={HelpCircle}>
              <dl className="space-y-3 text-sm">
                {listing.screeningProcess && <Row k="Screening Process" v={listing.screeningProcess} />}
                {listing.revisionPolicy && <Row k="Revision Policy" v={listing.revisionPolicy} />}
                {listing.paymentSchedule && <Row k="Payment Schedule" v={listing.paymentSchedule} />}
              </dl>
            </Section>
          )}

          {/* ── TEST TASK ── */}
          {listing.testTask?.title && (
            <Section title="Sample Test Task" icon={FileSignature}>
              <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-700">Required</span>
                  <span className="font-bold text-amber-800">{listing.testTask.title}</span>
                </div>
                {listing.testTask.description && (
                  <p className="text-sm text-amber-700 whitespace-pre-wrap">{listing.testTask.description}</p>
                )}
                {listing.testTask.paidAmount && (
                  <p className="mt-1 text-xs font-semibold text-amber-700">Paid test — ₹{Number(listing.testTask.paidAmount).toLocaleString()}</p>
                )}
                <p className="mt-2 text-xs text-amber-600">You'll upload your completed sample task when applying (PDF, ZIP, MP4, JPG, PNG, MOV, PSD, AI — max 50MB)</p>
              </div>
            </Section>
          )}

          {/* ── MILESTONE-BASED PAYMENT BREAKDOWN ── */}
          {listing.milestoneBreakdown?.length > 0 && (
            <Section title="Milestone-based Payment Breakdown" icon={Split}>
              <div className="rounded-xl border-2 border-emerald-100 bg-emerald-50/60 p-4">
                <p className="mb-3 text-xs text-slate-500">Payments are released as you complete each milestone:</p>
                <div className="space-y-2">
                  {listing.milestoneBreakdown.map((m, i) => (
                    <div key={i} className="flex items-start gap-3 rounded-lg bg-white p-3 shadow-sm">
                      <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700">
                        {i + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">
                          {m.label || m.milestone}
                          <span className="ml-2 text-emerald-600">({m.percentage || m.amount}%)</span>
                        </p>
                        {m.description && <p className="text-xs text-slate-500 mt-0.5">{m.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-3 text-xs text-slate-500">This clear breakdown helps avoid payment disputes — discuss exact terms before starting work.</p>
              </div>
            </Section>
          )}

          {/* ── OWNERSHIP / USAGE RIGHTS ── */}
          {listing.usageRights && (
            <Section title="Ownership & Usage Rights" icon={Scale}>
              <div className="rounded-xl border-2 border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start gap-3">
                  <FileWarning className="size-5 text-slate-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm text-slate-700 leading-relaxed">{listing.usageRights}</p>
                    <p className="mt-2 text-xs text-slate-400">Clarify ownership terms before starting work. By default, deliverables are owned by the agency/client upon full payment.</p>
                  </div>
                </div>
              </div>
            </Section>
          )}

          {/* ── REPORT ── */}
          <button onClick={handleReport} disabled={reporting}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600">
            <AlertCircle className="size-3.5" /> Report this listing
          </button>
        </article>

        {/* ── SIDEBAR ── */}
        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Snapshot</h4>
            <dl className="space-y-3 text-sm">
              <Row k="Pay" v={payDisplay} />
              {listing.projectFee && <Row k="Pay Model" v="Fixed project fee" />}
              {listing.hourlyRate && <Row k="Pay Model" v="Hourly rate" />}
              <Row k="Type" v={postingTypeLabel} />
              {listing.duration && <Row k="Duration" v={listing.duration} />}
              <Row k="Work Mode" v={listing.mode || 'Remote'} />
              <Row k="Location" v={listing.location || 'Remote'} />
              <Row k="Category" v={listing.category || 'General'} />
              <Row k="Openings" v={String(listing.vacancies || 1)} />
              <Row k="Experience" v={listing.experience || listing.experienceLevel || 'Any'} />
              <Row k="Posted" v={listing.createdAt ? new Date(listing.createdAt).toLocaleDateString('en-IN') : 'Recently'} />
            </dl>
          </div>

          {/* ── AGENCY MINI CARD (with rating) ── */}
          <AgencyMiniCard agency={agency} reviewStats={reviewStats} />

          {/* ── SIMILAR LISTINGS ── */}
          {similar.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Similar Listings</h4>
              <div className="space-y-3">
                {similar.map(s => (
                  <Link key={s._id} to={`/agency/listing/${s._id}`} className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                    <p className="font-semibold text-sm">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-1">{s.agency?.agencyName || s.company?.name || ''}</p>
                    <p className="text-xs text-emerald-600 font-semibold mt-1">
                      {s.projectFee ? `₹${Number(s.projectFee).toLocaleString()} fixed`
                        : s.hourlyRate ? `₹${Number(s.hourlyRate).toLocaleString()}/hr`
                        : s.salaryMin ? `₹${Number(s.salaryMin).toLocaleString()}${s.salaryMax ? ` - ₹${Number(s.salaryMax).toLocaleString()}` : ''}`
                        : s.stipend ? `₹${Number(s.stipend).toLocaleString()}`
                        : 'Negotiable'}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </aside>
      </main>

      {/* ── APPLY MODAL ── */}
      {showApply && (
        <ApplyDialog onClose={() => setShowApply(false)} onSubmit={handleApply}
          title={listing.title} agencyName={agency.agencyName} submitting={submitting}
          screeningQuestions={listing.screeningQuestions} testTask={listing.testTask} />
      )}
    </SiteLayout>
  )
}

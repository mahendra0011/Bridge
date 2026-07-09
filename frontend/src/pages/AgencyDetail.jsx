import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  MapPin, Globe, ArrowLeft, BadgeCheck,
  Briefcase, Users, Star, ExternalLink, Building2, CalendarDays,
  Clock, ChevronRight, GraduationCap, Award, HeartHandshake,
  Dot, Shield, Share2, Bookmark, BookmarkCheck, AlertCircle, ShieldCheck,
  RefreshCw, Plus, Settings, HelpCircle, TrendingUp, Eye,
  CheckCircle, XCircle, FileText, Camera, Link as LinkIcon,
  Instagram, Play, Image, Sparkles, Target, Timer, Zap,
  UserCheck, UserPlus, ChevronDown, Layers,
} from 'lucide-react'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { normalizeOpportunity, normalizeList } from '@/lib/normalize'
import { useAuth } from '@/context/AuthContext'

const logoBgs = [
  'from-violet-500 to-fuchsia-700',
  'from-blue-600 to-indigo-700',
  'from-emerald-500 to-teal-700',
  'from-orange-500 to-rose-700',
  'from-cyan-500 to-blue-700',
  'from-amber-500 to-orange-700',
]

function logoBgFor(id) {
  const str = String(id || '')
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash + str.charCodeAt(i)) % logoBgs.length
  return logoBgs[hash]
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

function StarRating({ rating, size = 'sm' }) {
  const sizeClass = size === 'lg' ? 'size-5' : 'size-3.5'
  return (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${sizeClass} ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />
      ))}
    </span>
  )
}

function StatCard({ icon: Icon, label, value, color, accent }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
      <div className={`absolute inset-y-0 left-0 w-1 rounded-r-full ${color}`} />
      <div className="flex items-center gap-4">
        <div className={`flex size-12 shrink-0 items-center justify-center rounded-xl ${accent}`}><Icon className="size-5 text-white" /></div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
          <p className="mt-0.5 text-2xl font-extrabold tracking-tight">{value}</p>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, label, value, href }) {
  if (!value) return null
  const content = (
    <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3 transition-colors hover:bg-slate-100">
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200"><Icon className="size-4 text-slate-500" /></div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-400">{label}</p>
        {href ? (
          <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-slate-700 hover:text-primary flex items-center gap-1">
            {value} <ExternalLink className="size-3 shrink-0" />
          </a>
        ) : (
          <p className="text-sm font-semibold text-slate-700">{value}</p>
        )}
      </div>
    </div>
  )
  return content
}

function ServiceTag({ name }) {
  return (
    <span className="rounded-full bg-primary/5 px-3 py-1 text-xs font-semibold text-primary ring-1 ring-primary/10">
      {name}
    </span>
  )
}

function Tooltip({ children, text }) {
  const [show, setShow] = useState(false)
  return (
    <span className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 w-64 rounded-lg bg-slate-800 px-3 py-2 text-center text-xs text-white shadow-lg">
          {text}
          <span className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800" />
        </span>
      )}
    </span>
  )
}

function OpportunityCard({ opportunity, kind, to }) {
  const norm = normalizeOpportunity(opportunity, kind)
  return (
    <Link to={to} className="group relative flex flex-col gap-2 border-b border-slate-100 px-5 py-4 transition-all last:border-b-0 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-semibold text-slate-800">
          {norm.title}
          {norm.deadline?.urgent && !norm.deadline?.closed && (
            <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-rose-600 ring-1 ring-rose-200">
              <Clock className="size-2.5" /> Urgent
            </span>
          )}
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
          <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {norm.location}</span>
          <Dot className="size-3 shrink-0 text-slate-300" />
          <span>{norm.mode}</span>
          {kind === 'internship' && norm.duration && (<><Dot className="size-3 shrink-0 text-slate-300" /><span>{norm.duration}</span></>)}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {norm.deadline && !norm.deadline.closed && (
          <span className={`whitespace-nowrap text-xs font-semibold ${norm.deadline.urgent ? 'text-rose-600' : 'text-slate-400'}`}>{norm.deadline.text}</span>
        )}
        <span className={`whitespace-nowrap text-sm font-bold ${kind === 'job' ? 'text-emerald-700' : 'text-primary'}`}>{norm.pay}</span>
        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary">
          View More Details <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

function SimilarAgencyCard({ a }) {
  return (
    <Link to={`/agency/${a._id}`} className="block rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        {a.logoUrl ? (
          <img src={a.logoUrl} alt="" className="size-10 rounded-xl object-cover" />
        ) : (
          <div className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${logoBgFor(a._id)} text-xs font-bold text-white`}>
            {(a.agencyName || 'A').split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{a.agencyName}</p>
          <p className="text-xs text-slate-500">{(a.services || []).slice(0, 2).join(', ')}</p>
        </div>
      </div>
    </Link>
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

function DimensionBar({ label, value }) {
  const pct = (value / 5) * 100
  return (
    <div className="flex items-center gap-3">
      <span className="w-28 text-xs text-slate-500 shrink-0">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="w-6 text-right text-xs font-bold text-slate-600">{value.toFixed(1)}</span>
    </div>
  )
}

export default function AgencyDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [agency, setAgency] = useState(null)
  const [jobs, setJobs] = useState([])
  const [internships, setInternships] = useState([])
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, avgQuality: 0, avgCommunication: 0, avgTurnaround: 0, avgPayment: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [deactivated, setDeactivated] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [saved, setSaved] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [similar, setSimilar] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get(`/api/agency/${id}/public`)
      .then(data => {
        if (cancelled) return
        setAgency(data.agency)
        setJobs(data.jobs || [])
        setInternships(data.internships || [])
        setReviewStats(data.reviewStats || { avgRating: 0, avgQuality: 0, avgCommunication: 0, avgTurnaround: 0, avgPayment: 0, count: 0 })
      })
      .catch(err => {
        if (!cancelled) {
          if (err.status === 410) setDeactivated(true)
          else setNotFound(true)
        }
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  // Fetch similar agencies
  useEffect(() => {
    if (!agency?.services?.length) return
    api.get('/api/agency?' + new URLSearchParams({ limit: 4, search: agency.services[0] }))
      .then(data => setSimilar((data.agencies || []).filter(a => String(a._id) !== String(id)).slice(0, 3)))
      .catch(() => {})
  }, [agency, id])

  // OG meta tags
  useEffect(() => {
    if (!agency) return
    setMetaTags(
      `${agency.agencyName} | Agency Profile | Bridge`,
      agency.description || `${agency.agencyName} — ${(agency.services || []).slice(0, 3).join(', ')}`,
      agency.logoUrl || '',
      `${window.location.origin}/agency/${id}`
    )
  }, [agency, id])

  const handleShare = () => {
    const url = `${window.location.origin}/agency/${id}`
    if (navigator.share) {
      try { navigator.share({ title: agency?.agencyName || 'Agency', url }) } catch {}
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    }
  }

  const handleSave = async () => {
    if (!user) { toast.error('Log in to follow this agency'); return }
    setSaved(!saved)
    toast.success(saved ? 'Unfollowed' : 'Following')
  }

  const handleReport = async () => {
    const reason = prompt('Why are you reporting this agency? (e.g., scam, fraud, fake)')
    if (!reason?.trim()) return
    setReporting(true)
    try {
      await api.post('/api/reports', { targetType: 'agency', targetId: id, reason: reason.trim() })
      toast.success('Report submitted. Our team will review it.')
    } catch (err) { toast.error(err.message || 'Could not submit report') }
    finally { setReporting(false) }
  }

  // ── Loading skeleton ──
  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
          <div className="h-5 w-32 animate-pulse rounded-lg bg-slate-100" />
          <div className="flex gap-5">
            <div className="size-20 animate-pulse rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-3">
              <div className="h-9 w-72 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-5 w-48 animate-pulse rounded-lg bg-slate-100" />
              <div className="h-5 w-56 animate-pulse rounded-lg bg-slate-100" />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
          <div className="h-16 animate-pulse rounded-xl bg-slate-100" />
          <div className="space-y-3">
            <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-4 animate-pulse rounded bg-slate-100" />)}
          </div>
        </div>
      </SiteLayout>
    )
  }

  // ── Not found / deactivated ──
  if (notFound || deactivated || !agency) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-slate-50 ring-1 ring-slate-200">
            <Building2 className="size-10 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">
            {deactivated ? 'Agency deactivated' : 'Agency not found'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            {deactivated
              ? 'This agency profile has been deactivated.'
              : 'This agency profile doesn\'t exist or may have been removed.'}
          </p>
          <Link to="/agencies" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90">
            <ArrowLeft className="size-4" /> Browse agencies
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const initials = agency.agencyName.split(' ').map(w => w[0]).slice(0, 2).join('')
  const hasOpenings = jobs.length > 0 || internships.length > 0
  const isOwner = user?._id === agency.user

  // Verification tier
  const isFullyRegistered = agency.isRegistered && agency.regCertificate
  const isIdOnly = !!agency.idProof
  const verificationTier = isFullyRegistered
    ? { label: 'Registered', tooltip: 'Udyam verified — registered business with certificate on file', cls: 'bg-emerald-50 text-emerald-700 ring-emerald-200' }
    : isIdOnly
      ? { label: 'ID Verified', tooltip: 'Identity verified via government-issued ID proof', cls: 'bg-blue-50 text-blue-700 ring-blue-200' }
      : { label: 'Unverified', tooltip: 'New agency — identity not yet verified', cls: 'bg-slate-50 text-slate-500 ring-slate-200' }

  // Tab config — 3 posting types: Project, Internship, Job
  const tabs = [
    { key: 'all', label: 'All', count: jobs.length + internships.length },
    { key: 'projects', label: 'Projects', count: jobs.filter(j => j.isClientProject || j.employmentType === 'Contract' || j.projectFee).length },
    { key: 'internships', label: 'Internships', count: internships.length },
    { key: 'jobs', label: 'Jobs', count: jobs.filter(j => !j.isClientProject && j.employmentType !== 'Contract' && !j.projectFee).length },
  ].filter(t => t.count > 0 || t.key === 'all')

  const filteredList = (() => {
    const all = [...internships.map(i => ({ ...i, kind: 'internship' })), ...jobs.map(j => ({ ...j, kind: 'job' }))]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    if (activeTab === 'all') return all
    if (activeTab === 'internships') return internships.map(i => ({ ...i, kind: 'internship' }))
    if (activeTab === 'jobs') return jobs.filter(j => !j.isClientProject && j.employmentType !== 'Contract' && !j.projectFee).map(j => ({ ...j, kind: 'job' }))
    if (activeTab === 'projects') return jobs.filter(j => j.isClientProject || j.employmentType === 'Contract' || j.projectFee).map(j => ({ ...j, kind: 'job' }))
    return all
  })()

  // All unique categories from listings
  const allCategories = [...new Set([...jobs, ...internships].map(l => l.category).filter(Boolean))]

  // Aggregate all tools/skills from listings for portfolio section
  const allTools = [...new Set([...jobs, ...internships].flatMap(l => [...(l.tools || []), ...(l.skills || []), ...(l.goodToHaveSkills || [])]))].slice(0, 20)

  // Apply category filter
  const filteredByCategory = categoryFilter === 'all'
    ? filteredList
    : filteredList.filter(l => l.category === categoryFilter)

  // Stats
  const totalListings = jobs.length + internships.length
  const stats = [
    { icon: Briefcase, label: 'Total listings', value: totalListings, color: 'bg-primary', accent: 'bg-gradient-to-br from-primary to-indigo-600' },
    { icon: Users, label: 'Team size', value: agency.teamSize || '1-5', color: 'bg-emerald-500', accent: 'bg-gradient-to-br from-emerald-500 to-teal-600' },
    { icon: Star, label: 'Rating', value: reviewStats.count > 0 ? reviewStats.avgRating.toFixed(1) : '—', color: 'bg-amber-500', accent: 'bg-gradient-to-br from-amber-500 to-orange-600' },
    { icon: Eye, label: 'Profile views', value: agency.profileViews > 0 ? agency.profileViews : '—', color: 'bg-violet-500', accent: 'bg-gradient-to-br from-violet-500 to-fuchsia-600' },
  ]
  if (agency.totalHires) stats.splice(2, 0, { icon: Award, label: 'Hires completed', value: agency.totalHires, color: 'bg-rose-500', accent: 'bg-gradient-to-br from-rose-500 to-pink-600' })

  return (
    <SiteLayout>
      {/* ═══════════════════════════════════════════════════════════
         HEADER / HERO AREA (outside grid, bg-surface)
         ═══════════════════════════════════════════════════════════ */}
      <div className="bg-surface px-6 py-10">
        <div className="mx-auto max-w-5xl">
          {/* Back + Actions */}
          <div className="flex items-center justify-between">
            <Link to="/agencies" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-primary">
              <ArrowLeft className="size-4" /> Back to agencies
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={handleShare} className="gap-1.5"><Share2 className="size-4" />Share</Button>
              <Button variant={saved ? 'default' : 'outline'} size="sm" onClick={handleSave} className="gap-1.5">
                {saved ? <BookmarkCheck className="size-4" /> : <Bookmark className="size-4" />}
                {saved ? 'Following' : 'Follow'}
              </Button>
            </div>
          </div>

          {/* Logo + Name + Verified + Service Tags + Location + Rating */}
          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-5">
              {agency.logoUrl ? (
                <img src={agency.logoUrl} alt="" className="size-16 shrink-0 rounded-2xl border border-slate-200 object-cover shadow-sm" />
              ) : (
                <div className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${logoBgFor(agency._id)} text-lg font-bold text-white shadow-sm`}>
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">{agency.agencyName}</h1>
                  <Tooltip text={verificationTier.tooltip}>
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 cursor-help ${verificationTier.cls}`}>
                      {verificationTier.label !== 'Unverified' && <BadgeCheck className="size-3.5" />}
                      {verificationTier.label}
                    </span>
                  </Tooltip>
                </div>
                {agency.services?.length > 0 && (
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {agency.services.slice(0, 6).map(s => <ServiceTag key={s} name={s} />)}
                    {agency.services.length > 6 && <span className="text-xs text-slate-400 self-center">+{agency.services.length - 6} more</span>}
                  </div>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" /> {agency.city || 'Remote'}</span>
                  {reviewStats.count > 0 && (
                    <span className="inline-flex items-center gap-1">
                      <StarRating rating={reviewStats.avgRating} />
                      <span className="font-semibold text-slate-700">{reviewStats.avgRating.toFixed(1)}</span>
                      <span className="text-slate-400">({reviewStats.count})</span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            {hasOpenings && (
              <div className="flex shrink-0 items-center gap-3">
                <span className="rounded-full bg-primary/10 px-5 py-2.5 text-base font-bold text-primary">
                  {totalListings} listing{totalListings > 1 ? 's' : ''} open
                </span>
              </div>
            )}
          </div>

          {/* Social / Portfolio links row (inside header) */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {agency.instagram && (
              <a href={agency.instagram.startsWith('http') ? agency.instagram : `https://instagram.com/${agency.instagram.replace('@', '')}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]">
                <Instagram className="size-5" /> Instagram Portfolio <ExternalLink className="size-3.5" />
              </a>
            )}
            {agency.portfolioUrl && (
              <a href={agency.portfolioUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow">
                <Camera className="size-4 text-violet-500" />Portfolio<ExternalLink className="size-3 text-slate-400" />
              </a>
            )}
            {agency.website && (
              <a href={agency.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow">
                <Globe className="size-4 text-slate-400" />Website<ExternalLink className="size-3 text-slate-400" />
              </a>
            )}
            {agency.linkedin && (
              <a href={agency.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow">
                <svg className="size-4 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn<ExternalLink className="size-3 text-slate-400" />
              </a>
            )}
            {reviewStats.count > 0 && (
              <Link to={`/agency/${id}/reviews`} className="inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow">
                <Star className="size-4 text-amber-400" />Reviews ({reviewStats.count})<ChevronRight className="size-3 text-slate-400" />
              </Link>
            )}
          </div>

          {/* Info bar — team, founded, response, member since, website, linkedin */}
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 rounded-xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
            {agency.teamSize && <span className="inline-flex items-center gap-1.5"><Users className="size-3.5" />Team: <strong className="text-slate-700">{agency.teamSize}</strong></span>}
            {agency.foundedYear && <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Founded <strong className="text-slate-700">{agency.foundedYear}</strong></span>}
            {agency.avgResponseTime && <span className="inline-flex items-center gap-1.5"><Timer className="size-3.5" />Avg response: <strong className="text-slate-700">{agency.avgResponseTime}</strong></span>}
            {agency.createdAt && <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-3.5" />Member since <strong className="text-slate-700">{new Date(agency.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</strong></span>}
            {agency.website && (
              <a href={agency.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sky-600 hover:text-sky-700 font-medium">
                <Globe className="size-3.5" />Website <ExternalLink className="size-2.5" />
              </a>
            )}
            {agency.linkedin && (
              <a href={agency.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-[#0A66C2] hover:text-[#0A66C2]/80 font-medium">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                LinkedIn <ExternalLink className="size-2.5" />
              </a>
            )}
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════
         MAIN GRID — lg:grid-cols-[1fr_280px] (CompanyDetail family)
         ═══════════════════════════════════════════════════════════ */}
      <main className="mx-auto grid max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[1fr_280px]">

        {/* ── LEFT COLUMN: Main content ── */}
        <article className="space-y-10">

          {/* Quick Info chips bar — stat cards simplified to chips */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
              <Briefcase className="size-3.5" /> {totalListings} listing{totalListings !== 1 ? 's' : ''}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-700">
              <Users className="size-3.5" /> Team: {agency.teamSize || '1-5'}
            </span>
            {reviewStats.count > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-bold text-amber-700">
                <Star className="size-3.5" /> {reviewStats.avgRating.toFixed(1)} ({reviewStats.count})
              </span>
            )}
            {agency.totalHires > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1.5 text-xs font-bold text-rose-700">
                <Award className="size-3.5" /> {agency.totalHires} hire{agency.totalHires > 1 ? 's' : ''}
              </span>
            )}
            {agency.profileViews > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-violet-50 px-3 py-1.5 text-xs font-bold text-violet-700">
                <Eye className="size-3.5" /> {agency.profileViews} views
              </span>
            )}
          </div>

          {/* About */}
          {agency.description && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <FileText className="size-5 text-primary" />
                <h3 className="font-bold text-lg">About {agency.agencyName}</h3>
              </div>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{agency.description}</p>
            </section>
          )}

          {/* Portfolio & Work Samples */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Camera className="size-5 text-violet-500" />
              <h3 className="font-bold text-lg">Portfolio & Work Samples</h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5 -mb-2">Review their past work — portfolios are the best reference for creative projects</p>

            {/* Instagram Grid — primary portfolio showcase */}
            {agency.instagram && (
              <div className="mt-4 mb-4 rounded-xl bg-gradient-to-br from-pink-50 via-white to-purple-50 border border-pink-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="flex size-9 items-center justify-center rounded-lg bg-gradient-to-br from-pink-500 to-purple-600">
                      <Instagram className="size-5 text-white" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">Instagram Portfolio</p>
                      <p className="text-xs text-slate-500">@{agency.instagram.replace('@', '').replace('https://instagram.com/', '')}</p>
                    </div>
                  </div>
                  <a href={agency.instagram.startsWith('http') ? agency.instagram : `https://instagram.com/${agency.instagram.replace('@', '')}`}
                    target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-pink-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-pink-600 transition-colors">
                    Follow <ExternalLink className="size-3" />
                  </a>
                </div>
                <div className="grid grid-cols-3 gap-1.5 rounded-lg overflow-hidden">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="aspect-square rounded-md bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
                      <Instagram className="size-6 text-pink-300" />
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-400 text-center">
                  Instagram is their primary portfolio — check their feed for the latest work samples
                </p>
              </div>
            )}

            {/* Portfolio links */}
            <div className="flex flex-wrap gap-3">
              {agency.portfolioUrl && (
                <a href={agency.portfolioUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-4 py-3 text-sm font-semibold text-violet-700 hover:bg-violet-50 transition-colors">
                  <LinkIcon className="size-4" /> View Portfolio <ExternalLink className="size-3" />
                </a>
              )}
              {agency.instagram && (
                <a href={agency.instagram.startsWith('http') ? agency.instagram : `https://instagram.com/${agency.instagram.replace('@', '')}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-3 text-sm font-semibold text-pink-600 hover:bg-pink-50 transition-colors">
                  <Instagram className="size-4" /> Instagram Grid <ExternalLink className="size-3" />
                </a>
              )}
            </div>

            {/* Service Categories + Tools */}
            {(agency.services?.length > 0 || allTools.length > 0) && (
              <div className="mt-4 space-y-3 rounded-xl bg-slate-50 p-4">
                {agency.services?.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Service Categories</p>
                    <div className="flex flex-wrap gap-1.5">
                      {agency.services.map(s => <ServiceTag key={s} name={s} />)}
                    </div>
                  </div>
                )}
                {allTools.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">Tools & Software Used</p>
                    <div className="flex flex-wrap gap-1.5">
                      {allTools.map(t => (
                        <span key={t} className="rounded-full bg-white px-3 py-1 text-xs font-medium text-slate-700 ring-1 ring-slate-200">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Reviews & Ratings */}
          {reviewStats.count > 0 && (
            <section>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Star className="size-5 text-amber-400" />
                  <h3 className="font-bold text-lg">Reviews & Ratings</h3>
                </div>
                <Link to={`/agency/${id}/reviews`} className="text-sm font-semibold text-primary hover:underline">
                  View all <ChevronRight className="ml-0.5 inline size-4" />
                </Link>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:gap-8">
                  <div className="text-center shrink-0">
                    <span className="text-4xl font-extrabold text-slate-800">{reviewStats.avgRating.toFixed(1)}</span>
                    <StarRating rating={reviewStats.avgRating} size="lg" />
                    <p className="mt-0.5 text-xs text-slate-500">Based on {reviewStats.count} {reviewStats.count === 1 ? 'review' : 'reviews'}</p>
                  </div>
                  <div className="flex-1 space-y-2">
                    {reviewStats.avgQuality > 0 && <DimensionBar label="Quality of work" value={reviewStats.avgQuality} />}
                    {reviewStats.avgCommunication > 0 && <DimensionBar label="Communication" value={reviewStats.avgCommunication} />}
                    {reviewStats.avgTurnaround > 0 && <DimensionBar label="Turnaround time" value={reviewStats.avgTurnaround} />}
                    {reviewStats.avgPayment > 0 && <DimensionBar label="Payment reliability" value={reviewStats.avgPayment} />}
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Active Postings */}
          <section id="agency-postings">
            <div className="flex items-center gap-2 mb-3">
              <Briefcase className="size-5 text-primary" />
              <h3 className="font-bold text-lg">Open Positions</h3>
            </div>

            {/* Tabs */}
            <div className="flex items-center border-b border-slate-200 overflow-x-auto">
              {tabs.map((tab) => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors ${activeTab === tab.key ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab.label}
                  <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
                  {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
              ))}
            </div>

            {/* Category filter */}
            {allCategories.length > 0 && (
              <div className="mt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-semibold text-slate-400 mr-1">Category:</span>
                <button onClick={() => setCategoryFilter('all')}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${categoryFilter === 'all' ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 ring-1 ring-slate-200'}`}>
                  All
                </button>
                {allCategories.map(cat => (
                  <button key={cat} onClick={() => setCategoryFilter(cat)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${categoryFilter === cat ? 'bg-primary/10 text-primary ring-1 ring-primary/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 ring-1 ring-slate-200'}`}>
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {/* Listing cards */}
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white">
              {hasOpenings ? (
                filteredByCategory.length === 0 ? (
                  <div className="px-5 py-12 text-center">
                    <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-50"><Briefcase className="size-6 text-slate-300" /></div>
                    <p className="text-sm font-medium text-slate-500">No {categoryFilter !== 'all' ? `${categoryFilter} ` : ''}{activeTab} right now</p>
                    <p className="text-xs text-slate-400">Check back later</p>
                  </div>
                ) : (
                  filteredByCategory.map((opp) => (
                    <OpportunityCard key={opp._id} opportunity={opp} kind={opp.kind} to={`/agency/listing/${opp._id}`} />
                  ))
                )
              ) : (
                <>
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">0 listings</p>
                  </div>
                  <div className="px-5 py-12 text-center">
                    <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-slate-50"><Briefcase className="size-7 text-slate-300" /></div>
                    <p className="font-semibold text-slate-600">No open positions yet</p>
                    <p className="mt-1 text-sm text-slate-400">This agency hasn't posted any gigs, projects, or internships yet</p>
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Similar Agencies */}
          {similar.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-5 text-primary" />
                <h3 className="font-bold text-lg">Similar Agencies</h3>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {similar.map(a => <SimilarAgencyCard key={a._id} a={a} />)}
              </div>
            </section>
          )}

          {/* Report */}
          <div className="flex items-center gap-4">
            <button onClick={handleReport} disabled={reporting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 disabled:opacity-50">
              <AlertCircle className="size-3.5" /> {reporting ? 'Submitting...' : 'Report this agency'}
            </button>
          </div>
        </article>

        {/* ── RIGHT COLUMN: Sidebar (280px) ── */}
        <aside className="space-y-4">

          {/* Snapshot */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Snapshot</h4>
            <dl className="space-y-3 text-sm">
              <Row k="Team Size" v={agency.teamSize || '1-5'} />
              {agency.foundedYear && <Row k="Founded" v={String(agency.foundedYear)} />}
              <Row k="Location" v={agency.city || 'Remote'} />
              {agency.website && <Row k="Website" v={agency.website.replace('https://', '').replace('http://', '')} />}
              <Row k="Total Listings" v={String(totalListings)} />
              <Row k="Total Hires" v={agency.totalHires ? String(agency.totalHires) : '—'} />
              {agency.avgResponseTime && <Row k="Response Time" v={agency.avgResponseTime} />}
              {agency.profileViews > 0 && <Row k="Profile Views" v={String(agency.profileViews)} />}
            </dl>
          </div>

          {/* Trust & Verification (compact sidebar card) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Trust & Verification</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Status</span>
                <Tooltip text={verificationTier.tooltip}>
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 cursor-help ${verificationTier.cls}`}>
                    {verificationTier.label !== 'Unverified' && <BadgeCheck className="size-2.5" />}
                    {verificationTier.label}
                  </span>
                </Tooltip>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Business</span>
                {agency.isRegistered !== false ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><CheckCircle className="size-2.5" /> Registered</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600">Informal team</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">ID Proof</span>
                {agency.idProof ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><CheckCircle className="size-2.5" /> Verified</span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400">Not submitted</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Fee Trust</span>
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600"><ShieldCheck className="size-2.5" /> No complaints</span>
              </div>
            </div>
          </div>

          {/* Team mini-card */}
          {(agency.teamMemberCount > 0 || agency.teamMembers?.length > 0) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Team of {agency.teamMemberCount || agency.teamMembers?.length}</h4>
              <p className="text-[10px] text-slate-400 mb-3">Small creative team — personal collaboration</p>
              <div className="space-y-2">
                {(agency.teamMembers || []).filter(m => m.role !== 'viewer').slice(0, 4).map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div className="grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 text-[10px] font-bold text-white">
                      {(m.name || 'T').charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-700">{m.name || 'Team member'}</p>
                      <p className="text-[10px] text-slate-400 capitalize">{m.role || 'member'}</p>
                    </div>
                  </div>
                ))}
                {(agency.teamMembers || []).filter(m => m.role !== 'viewer').length > 4 && (
                  <p className="text-[10px] text-slate-400">+{agency.teamMembers.filter(m => m.role !== 'viewer').length - 4} more</p>
                )}
              </div>
            </div>
          )}

          {/* ── Owner View (sidebar) ── */}
          {isOwner && (
            <>
              {/* Preview Mode */}
              <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/80 p-4 text-center">
                <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-amber-100">
                  <Eye className="size-5 text-amber-600" />
                </div>
                <p className="text-sm font-bold text-amber-800">Preview Mode</p>
                <p className="mt-0.5 text-xs text-amber-600">This is how your agency appears to others</p>
              </div>

              {/* Profile Completion */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Profile</h4>
                  <span className="text-sm font-bold text-primary">{agency.signupStep === 2 ? '60%' : '30%'}</span>
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: agency.signupStep === 2 ? '60%' : '30%' }} />
                </div>
                <div className="space-y-1.5">
                  {[
                    { label: 'Agency Name', done: true },
                    { label: 'Service Categories', done: agency.services?.length > 0 },
                    { label: 'Description', done: !!agency.description },
                    { label: 'Portfolio Link', done: !!agency.portfolioUrl },
                    { label: 'Instagram', done: !!agency.instagram },
                    { label: 'Team Members', done: agency.teamMembers?.length > 0 },
                    { label: 'ID Proof', done: !!agency.idProof },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      {f.done ? <CheckCircle className="size-3 text-emerald-500" /> : <div className="size-3 rounded-full border-2 border-slate-300" />}
                      <span className={f.done ? 'text-slate-500' : 'text-slate-400'}>{f.label}</span>
                    </div>
                  ))}
                </div>
                <Link to="/agency/signup" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
                  <AlertCircle className="size-3.5" /> Complete profile
                </Link>
              </div>

              {/* Manage */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Manage</h4>
                <div className="space-y-2">
                  <Link to="/agency/signup" className="flex w-full items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors">
                    <Settings className="size-3.5" /> Edit Profile
                  </Link>
                  {!agency.idProof && (
                    <Link to="/agency/signup" className="flex w-full items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors">
                      <Shield className="size-3.5" /> Upload ID Proof
                    </Link>
                  )}
                  {!agency.isRegistered && (
                    <Link to="/agency/signup" className="flex w-full items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                      <FileText className="size-3.5" /> Upload Udyam Certificate
                    </Link>
                  )}
                  <Link to={`/agency/team`} className="flex w-full items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    <Users className="size-3.5" /> Manage Team
                  </Link>
                  <Link to="/agency/post-listing" className="flex w-full items-center gap-1.5 rounded-lg bg-primary px-3 py-2.5 text-xs font-bold text-white hover:bg-primary/90 transition-colors">
                    <Plus className="size-3.5" /> Post New Gig/Project
                  </Link>
                </div>
              </div>

              {/* Analytics */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Analytics</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-lg font-bold text-slate-800">{agency.profileViews || 0}</p>
                    <p className="text-[10px] text-slate-500">Profile Views</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-lg font-bold text-slate-800">{totalListings}</p>
                    <p className="text-[10px] text-slate-500">Total Listings</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-lg font-bold text-slate-800">{agency.totalHires || 0}</p>
                    <p className="text-[10px] text-slate-500">Total Hires</p>
                  </div>
                  <div className="rounded-lg bg-slate-50 p-3 text-center">
                    <p className="text-lg font-bold text-slate-800">{hasOpenings ? jobs.length + internships.length : 0}</p>
                    <p className="text-[10px] text-slate-500">Active Posts</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Trust badges (non-owner) */}
          {!isOwner && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <ShieldCheck className="size-3.5 text-emerald-600" /> {verificationTier.label}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <CheckCircle className="size-3.5 text-amber-600" /> {agency.isRegistered !== false ? 'Registered business' : 'Informal team'}
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <BadgeCheck className="size-3.5 text-emerald-600" /> No-fee direct hire
                </div>
                <button onClick={handleReport} disabled={reporting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-50">
                  <AlertCircle className="size-3.5" /> {reporting ? 'Submitting...' : 'Report this agency'}
                </button>
              </div>
            </div>
          )}
        </aside>
      </main>
    </SiteLayout>
  )
}

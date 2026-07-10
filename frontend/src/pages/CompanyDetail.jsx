import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { MapPin, Globe, Linkedin, ArrowLeft, BadgeCheck, Briefcase, Users, Star, ExternalLink, Building2, CalendarDays, Clock, ChevronRight, GraduationCap, Award, HeartHandshake, Shield, Share2, Bookmark, BookmarkCheck, AlertCircle, ShieldCheck, Plus, Settings, TrendingUp, Eye, Laptop, CheckCircle, XCircle, FileText, Dot, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { api } from '@/lib/api'
import { normalizeOpportunity } from '@/lib/normalize'
import { useAuth } from '@/context/AuthContext'
import { BASE_URL } from '@/lib/api'

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

function assetUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${BASE_URL}${url}`
  return `${BASE_URL}/${url}`
}

function setMetaTags(title, description, image, url) {
  const updateMeta = (property, content) => {
    if (!content) return
    let el = document.querySelector(`meta[property="${property}"]`)
    if (!el) {
      el = document.createElement('meta')
      el.setAttribute('property', property)
      document.head.appendChild(el)
    }
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

function Row({ k, v }) {
  if (!v && v !== 0) return null
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
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star key={star} className={`${sizeClass} ${star <= Math.round(rating) ? 'fill-amber-400 text-amber-400' : 'fill-slate-100 text-slate-200'}`} />
      ))}
    </span>
  )
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

function SimilarCompanyCard({ company }) {
  return (
    <Link to={`/company/${company._id}`} className="block rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
      <div className="flex items-center gap-3">
        {company.logoUrl ? (
          <img src={assetUrl(company.logoUrl)} alt="" className="size-10 rounded-xl object-cover" />
        ) : (
          <div className={`grid size-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${logoBgFor(company._id)} text-xs font-bold text-white`}>
            {(company.name || 'C').split(' ').map(w => w[0]).slice(0, 2).join('')}
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-semibold text-slate-800 truncate">{company.name}</p>
          <p className="text-xs text-slate-500">{company.industry || 'Various'} · {company.location || 'Remote'}</p>
        </div>
      </div>
    </Link>
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
          {kind === 'internship' && norm.duration && (
            <>
              <Dot className="size-3 shrink-0 text-slate-300" />
              <span>{norm.duration}</span>
            </>
          )}
        </p>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-3">
        {norm.deadline && !norm.deadline.closed && (
          <span className={`whitespace-nowrap text-xs font-semibold ${norm.deadline.urgent ? 'text-rose-600' : 'text-slate-400'}`}>{norm.deadline.text}</span>
        )}
        <span className={`whitespace-nowrap text-sm font-bold ${kind === 'job' ? 'text-emerald-700' : 'text-primary'}`}>{norm.pay}</span>
        <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary">
          View <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}

export default function CompanyDetail() {
  const { companyId } = useParams()
  const navigate = useNavigate()
  const { user, company: userCompany } = useAuth()
  const [company, setCompany] = useState(null)
  const [jobs, setJobs] = useState([])
  const [internships, setInternships] = useState([])
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [saved, setSaved] = useState(false)
  const [reporting, setReporting] = useState(false)
  const [sortOrder, setSortOrder] = useState('newest')
  const [ownerAnalytics, setOwnerAnalytics] = useState(null)
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false)
  const [similarCompanies, setSimilarCompanies] = useState([])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get(`/api/company/${companyId}/public`)
      .then((data) => {
        if (cancelled) return
        setCompany(data.company)
        setJobs(data.jobs || [])
        setInternships(data.internships || [])
        setReviewStats(data.reviewStats || { avgRating: 0, count: 0 })
      })
      .catch(() => { if (!cancelled) setNotFound(true) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [companyId])

  useEffect(() => {
    if (!company?.industry) return
    api.get(`/api/search/companies?industry=${encodeURIComponent(company.industry)}&limit=4`)
      .then(data => {
        const others = (data.companies || []).filter(c => String(c._id) !== String(companyId))
        setSimilarCompanies(others.slice(0, 3))
      })
      .catch(() => {})
  }, [company?.industry, companyId])

  useEffect(() => {
    if (!company) return
    const totalOpen = jobs.length + internships.length
    const desc = `${company.name} — ${company.industry || 'Various'} · ${company.location || 'Remote'}`
      + (totalOpen > 0 ? ` · ${totalOpen} open position${totalOpen > 1 ? 's' : ''}` : '')
      + (company.size ? ` · ${company.size}` : '')
    const canonicalUrl = company.slug
      ? `${window.location.origin}/company/${company.slug}`
      : `${window.location.origin}/company/${companyId}`
    setMetaTags(`${company.name} | Bridge`, desc, company.logoUrl || '', canonicalUrl)
    let canonicalLink = document.querySelector('link[rel="canonical"]')
    if (!canonicalLink) {
      canonicalLink = document.createElement('link')
      canonicalLink.setAttribute('rel', 'canonical')
      document.head.appendChild(canonicalLink)
    }
    canonicalLink.setAttribute('href', canonicalUrl)
  }, [company, companyId, jobs.length, internships.length])

  const handleShare = () => {
    const url = company?.slug
      ? `${window.location.origin}/company/${company.slug}`
      : `${window.location.origin}/company/${companyId}`
    if (navigator.share) {
      try { navigator.share({ title: company?.name || 'Company', url }) } catch {}
    } else {
      navigator.clipboard.writeText(url)
      toast.success('Link copied to clipboard!')
    }
  }

  const handleFollow = async () => {
    if (!user) { toast.error('Log in to follow this company'); return }
    try {
      if (saved) {
        await api.delete(`/api/student/saved/company/${companyId}`)
        setSaved(false)
        toast.success('Unfollowed')
      } else {
        await api.post('/api/student/saved', { posting: companyId, postingType: 'company' })
        setSaved(true)
        toast.success('Following! You\'ll get notified about new postings.')
      }
    } catch (err) {
      toast.error(err.message || 'Could not update follow status')
    }
  }

  const handleReport = async () => {
    const reason = prompt('Why are you reporting this company? (e.g., scam, fraud, fake)')
    if (!reason?.trim()) return
    setReporting(true)
    try {
      await api.post('/api/reports', { targetType: 'company', targetId: companyId, reason: reason.trim() })
      toast.success('Report submitted. Our team will review it.')
    } catch (err) {
      toast.error(err.message || 'Could not submit report')
    } finally {
      setReporting(false)
    }
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-5xl px-6 py-12 space-y-6">
          <div className="h-5 w-32 animate-pulse rounded-lg bg-slate-100" />
          <div className="flex gap-5">
            <div className="size-16 shrink-0 animate-pulse rounded-2xl bg-slate-100" />
            <div className="flex-1 space-y-3">
              <div className="h-9 w-72 animate-pulse rounded-xl bg-slate-100" />
              <div className="h-5 w-48 animate-pulse rounded-lg bg-slate-100" />
              <div className="flex gap-2">
                {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />)}
              </div>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
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

  if (notFound || !company) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-slate-50 ring-1 ring-slate-200">
            <Building2 className="size-10 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Company not found</h1>
          <p className="mt-2 text-sm text-slate-500">This company profile doesn't exist, has been deactivated, or may have been removed.</p>
          <Link to="/internships" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90">
            <ArrowLeft className="size-4" /> Browse opportunities
          </Link>
        </div>
      </SiteLayout>
    )
  }

  if (!company.isActive) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-rose-50 ring-1 ring-rose-200">
            <Shield className="size-10 text-rose-400" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Company not available</h1>
          {company.banReason ? (
            <p className="mt-2 text-sm text-slate-500">This company has been deactivated{company.banReason ? ` — ${company.banReason}` : ''}. If you have questions, please contact our support team.</p>
          ) : (
            <p className="mt-2 text-sm text-slate-500">This company profile has been deactivated due to policy violations. If you have questions, please contact our support team.</p>
          )}
          <Link to="/internships" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90">
            <ArrowLeft className="size-4" /> Browse opportunities
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const initials = company.name.split(' ').map(w => w[0]).slice(0, 2).join('')
  const hasOpenings = jobs.length > 0 || internships.length > 0
  const isOwner = userCompany?._id === companyId
  const memberSince = company.createdAt ? new Date(company.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''
  const sortFn = sortOrder === 'oldest'
    ? (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    : (a, b) => new Date(b.createdAt) - new Date(a.createdAt)

  const filteredList = activeTab === 'all'
    ? [...internships.map(i => ({ ...i, kind: 'internship' })), ...jobs.map(j => ({ ...j, kind: 'job' }))].sort(sortFn)
    : activeTab === 'internships'
      ? internships.map(i => ({ ...i, kind: 'internship' })).sort(sortFn)
      : jobs.map(j => ({ ...j, kind: 'job' })).sort(sortFn)

  const completionFields = [
    !!company.logoUrl,
    !!company.description,
    !!company.website,
    !!company.industry,
    !!company.size,
    !!company.foundedYear,
    !!company.hqLocation,
    !!company.regNumber,
  ]
  const completedCount = completionFields.filter(Boolean).length
  const completionPercent = Math.round((completedCount / completionFields.length) * 100)

  const loadAnalytics = async () => {
    if (fetchingAnalytics) return
    setFetchingAnalytics(true)
    try {
      const data = await api.get('/api/company/analytics')
      setOwnerAnalytics(data)
    } catch {} finally {
      setFetchingAnalytics(false)
    }
  }

  const companyPerks = company.perks || [
    { icon: HeartHandshake, label: 'Health insurance' },
    { icon: Laptop, label: 'Remote-friendly' },
    { icon: GraduationCap, label: 'Learning budget' },
    { icon: Clock, label: 'Flexible hours' },
    { icon: Award, label: 'Performance bonus' },
    { icon: Users, label: 'Collaborative culture' },
  ]

  return (
    <SiteLayout>
      {company.bannerUrl && (
        <div className="h-48 w-full overflow-hidden bg-slate-100 sm:h-64">
          <img src={assetUrl(company.bannerUrl)} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      <div className="bg-surface px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <Link to="/internships" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-primary">
              <ArrowLeft className="size-4" /> Back to opportunities
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={handleFollow} className="inline-flex items-center gap-1 rounded-lg p-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
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
                <div className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${logoBgFor(company._id)} text-lg font-bold text-white shadow-sm`}>
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{company.name}</h1>
                  {company.isVerified || company.likelyVerified ? (
                    <Tooltip text={company.domainVerified ? 'Verified via official domain match' : 'Verified by Admin'}>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 cursor-help shrink-0">
                        <BadgeCheck className="size-3.5" />Verified
                      </span>
                    </Tooltip>
                  ) : null}
                </div>
                <p className="mt-0.5 text-lg font-medium text-slate-600">{company.industry || ''}</p>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <Meta icon={<MapPin className="size-4" />}>{company.location || 'Remote'}</Meta>
                  {company.size && <Meta chip icon={<Building2 className="size-4" />}>{company.size}</Meta>}
                  {company.foundedYear && <Meta chip icon={<CalendarDays className="size-4" />}>Founded {company.foundedYear}</Meta>}
                  <Meta icon={<CalendarDays className="size-4" />}>Member since {memberSince}</Meta>
                  <Meta icon={<Users className="size-4" />}>{company.teamMemberCount ? `${company.teamMemberCount} recruiters active` : '—'}</Meta>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {company.website && (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors">
                      <Globe className="size-3.5" /> Website <ExternalLink className="size-2.5" />
                    </a>
                  )}
                  {company.linkedin && (
                    <a href={company.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-[#0A66C2]/10 px-3 py-1 text-xs font-semibold text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors">
                      <Linkedin className="size-3.5" /> LinkedIn <ExternalLink className="size-2.5" />
                    </a>
                  )}
                  {company.twitter && (
                    <a href={company.twitter} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 transition-colors">
                      <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.909-7.912-6.152 7.912H2.245L10.5 9.03 2.962 2.25H9.35l5.517 7.08L18.244 2.25zM17.6 20.25L6.4 4.5h2.25L20.05 20.25h-2.45z"/></svg> Twitter <ExternalLink className="size-2.5" />
                    </a>
                  )}
                  {company.officeLocations?.length > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
                      <Building2 className="size-3.5" /> {company.officeLocations.length}+ locations
                    </span>
                  )}
                </div>
                {reviewStats.count > 0 && (
                  <div className="mt-2 flex items-center gap-1.5 text-sm">
                    <StarRating rating={reviewStats.avgRating} />
                    <span className="font-semibold text-slate-700">{reviewStats.avgRating.toFixed(1)}</span>
                    <span className="text-slate-400">({reviewStats.count} {reviewStats.count === 1 ? 'review' : 'reviews'})</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-3">
              <span className="rounded-full bg-emerald-50 px-5 py-2.5 text-base font-bold text-emerald-700">
                {hasOpenings ? `${jobs.length + internships.length} open position${jobs.length + internships.length !== 1 ? 's' : ''}` : 'No openings'}
              </span>
              {company.designation && (
                <span className="hidden text-sm text-slate-500 md:block">Posted by <strong className="text-slate-700">{company.designation}</strong></span>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto grid max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[1fr_280px]">
        <article className="space-y-10">
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <Meta icon={<Briefcase className="size-4" />} chip>{jobs.length + internships.length} open</Meta>
            <Meta icon={<CalendarDays className="size-4" />} chip>Founded {company.foundedYear || '—'}</Meta>
            <Meta icon={<Users className="size-4" />} chip>{company.teamMemberCount ? `${company.teamMemberCount} team` : '—'}</Meta>
            <Meta icon={<Star className="size-4" />} chip>{reviewStats.count > 0 ? `${reviewStats.avgRating.toFixed(1)} (${reviewStats.count})` : '—'}</Meta>
            {company.totalHires > 0 && (<Meta icon={<Award className="size-4" />} chip>{company.totalHires} hires</Meta>)}
            {company.avgResponseTime && (<Meta icon={<Clock className="size-4" />} chip>~{company.avgResponseTime}h response</Meta>)}
            {company.profileViews !== undefined && (<Meta icon={<Eye className="size-4" />} chip>{company.profileViews} profile views</Meta>)}
          </div>

          {(company.mission || company.culture || company.description) && (
            <Section title="Mission & Culture" icon={Sparkles}>
              {company.mission && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Our Mission</h4>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{company.mission}</p>
                </div>
              )}
              {company.culture && (
                <div className="mb-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Culture</h4>
                  <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{company.culture}</p>
                </div>
              )}
              {company.description && !company.mission && !company.culture && (
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">{company.description}</p>
              )}
            </Section>
          )}

          <Section title="Verification & Trust" icon={ShieldCheck}>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <BadgeCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">
                    {company.isVerified || company.likelyVerified ? 'Verified Company' : 'Identity Pending'}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {(company.isVerified || company.likelyVerified)
                      ? (company.domainVerified
                        ? 'Verified via official domain match — email domain matches company website'
                        : 'Verified by Admin — manually approved by Bridge team')
                      : 'This company has not completed verification yet'}
                  </p>
                </div>
              </div>
              {company.regNumber && (
                <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                  <FileText className="size-4 text-slate-400 shrink-0" />
                  <p className="text-xs text-slate-600">Business registration documents submitted and verified</p>
                  <ShieldCheck className="size-4 text-emerald-500 ml-auto shrink-0" />
                </div>
              )}
              <div className={`flex items-center gap-3 rounded-xl px-4 py-3 ${(company.feeComplaintCount || 0) > 0 ? 'bg-rose-50' : 'bg-amber-50'}`}>
                <CheckCircle className={`size-4 shrink-0 ${(company.feeComplaintCount || 0) > 0 ? 'text-rose-600' : 'text-amber-600'}`} />
                <p className={`text-xs font-semibold ${(company.feeComplaintCount || 0) > 0 ? 'text-rose-800' : 'text-amber-800'}`}>
                  {(company.feeComplaintCount || 0) > 0
                    ? `${company.feeComplaintCount} fee-related complaint${company.feeComplaintCount !== 1 ? 's' : ''} reported`
                    : 'This company has not been reported for any fee-related complaint'}
                </p>
              </div>
            </div>
          </Section>

          <Section title="Culture & Perks" icon={Award}>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {companyPerks.map((perk, i) => {
                const PIcon = perk.icon || Award
                return (
                  <div key={i} className="flex items-center gap-2.5 rounded-xl border border-slate-100 bg-slate-50/50 p-3 transition-colors hover:bg-slate-100">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200">
                      <PIcon className="size-4 text-primary" />
                    </div>
                    <span className="text-xs font-semibold text-slate-700">{perk.label || perk}</span>
                  </div>
                )
              })}
            </div>
          </Section>

          {company.photos?.length > 0 && (
            <Section title="Photos" icon={Building2}>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {company.photos.map((url, i) => (
                  <a key={i} href={assetUrl(url)} target="_blank" rel="noopener noreferrer" className="group relative aspect-video overflow-hidden rounded-xl bg-slate-100">
                    <img src={assetUrl(url)} alt={`${company.name} photo ${i + 1}`} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                  </a>
                ))}
              </div>
            </Section>
          )}

          <Section title="Reviews & Ratings" icon={Star}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                {user?.role === 'student' && (
                  <Link to={`/company/${companyId}/reviews?write=true`} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
                    <Star className="size-3.5" /> Write a review
                  </Link>
                )}
                <Link to={`/company/${companyId}/reviews`} className="text-sm font-semibold text-primary hover:underline">
                  View all<ChevronRight className="ml-0.5 inline size-4" />
                </Link>
              </div>
            </div>
            {reviewStats.count > 0 ? (
              <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                <span className="text-4xl font-extrabold text-slate-800">{reviewStats.avgRating.toFixed(1)}</span>
                <div>
                  <StarRating rating={reviewStats.avgRating} size="lg" />
                  <p className="mt-0.5 text-xs text-slate-500">Based on {reviewStats.count} verified {reviewStats.count === 1 ? 'review' : 'reviews'}</p>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <Star className="mx-auto size-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No verified reviews yet</p>
                <p className="text-xs text-slate-400 mt-1">Only verified applicants can review this company</p>
              </div>
            )}
          </Section>

          <Section title="Open Positions" icon={Briefcase}>
            <div className="flex items-center justify-between border-b border-slate-200 mb-0 -mt-1">
              <div className="flex items-center">
                {[
                  { key: 'all', label: 'All', count: jobs.length + internships.length },
                  { key: 'internships', label: 'Internships', count: internships.length },
                  { key: 'jobs', label: 'Jobs', count: jobs.length },
                ].map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab.key ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}>
                    {tab.label}
                    <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
                    {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1 pr-2">
                <button onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
                  className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 transition-colors">
                  {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
                  <ChevronRight className={`size-3 transition-transform ${sortOrder === 'oldest' ? 'rotate-90' : '-rotate-90'}`} />
                </button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white">
              {filteredList.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-50"><Briefcase className="size-6 text-slate-300" /></div>
                  <p className="text-sm font-medium text-slate-500">No {activeTab === 'internships' ? 'internships' : activeTab === 'jobs' ? 'jobs' : 'open positions'} right now</p>
                  <p className="text-xs text-slate-400">Follow to get notified when new positions are posted</p>
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{filteredList.length} {activeTab === 'internships' ? 'internships' : activeTab === 'jobs' ? 'jobs' : 'openings'}</p>
                  </div>
                  {filteredList.map((opp) => (
                    <OpportunityCard key={opp._id} opportunity={opp} kind={opp.kind} to={`/${opp.kind === 'internship' ? 'internship' : 'job'}/${opp._id}`} />
                  ))}
                </>
              )}
            </div>
          </Section>

          {user?.role === 'student' && (
            <button onClick={handleReport} disabled={reporting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 disabled:opacity-50">
              <AlertCircle className="size-3.5" />{reporting ? 'Submitting...' : 'Report this company'}
            </button>
          )}
        </article>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Snapshot</h4>
            <dl className="space-y-3 text-sm">
              <Row k="Industry" v={company.industry || '—'} />
              <Row k="Company size" v={company.size || '—'} />
              <Row k="Founded" v={company.foundedYear || '—'} />
              <Row k="Headquarters" v={company.hqLocation || company.location || '—'} />
              <Row k="Total jobs posted" v={String(jobs.length + internships.length)} />
              <Row k="Team" v={`${company.teamMemberCount || 0} recruiters`} />
              {memberSince && <Row k="Member since" v={memberSince} />}
            </dl>
          </div>

          {isOwner && (
            <>
              <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/80 p-4 text-center">
                <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-amber-100">
                  <Eye className="size-5 text-amber-600" />
                </div>
                <p className="text-sm font-bold text-amber-800">Preview Mode</p>
                <p className="mt-0.5 text-xs text-amber-600">This is how your company appears to applicants</p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Profile Completion</h4>
                  <span className="text-sm font-bold text-primary">{completionPercent}%</span>
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all duration-500 ${completionPercent === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${completionPercent}%` }} />
                </div>
                <div className="space-y-1">
                  {[
                    { label: 'Logo', done: !!company.logoUrl },
                    { label: 'Description', done: !!company.description },
                    { label: 'Website', done: !!company.website },
                    { label: 'Industry', done: !!company.industry },
                    { label: 'Company size', done: !!company.size },
                    { label: 'Founded year', done: !!company.foundedYear },
                    { label: 'Location', done: !!company.hqLocation },
                    { label: 'Registration', done: !!company.regNumber },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {f.done ? <CheckCircle className="size-3 text-emerald-500" /> : <div className="size-3 rounded-full border-2 border-slate-300" />}
                      <span className={f.done ? 'text-slate-500' : 'text-slate-400'}>{f.label}</span>
                    </div>
                  ))}
                </div>
                {completionPercent < 100 && (
                  <Link to="/setup/profile" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
                    <AlertCircle className="size-3.5" /> Complete profile
                  </Link>
                )}
              </div>

              {company.signupStep < 3 && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">Verification Pending</h4>
                  <p className="text-xs text-amber-700">Upload your registration documents to get verified and increase applicant trust.</p>
                  <Link to="/setup/verification" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
                    <Shield className="size-3.5" /> Upload Documents
                  </Link>
                </div>
              )}

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Manage</h4>
                <div className="space-y-2">
                  {!company.isProfileComplete && (
                    <Link to={`/setup/${company.signupStep || 'profile'}`} className="flex w-full items-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
                      <AlertCircle className="size-3.5" />Complete profile
                    </Link>
                  )}
                  <Link to="/setup/profile" className="flex w-full items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors">
                    <Settings className="size-3.5" />Edit Profile
                  </Link>
                  <Link to={`/company/${companyId}/manage/team`} className="flex w-full items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                    <Users className="size-3.5" />Manage Team
                  </Link>
                  <Link to="/post" className="flex w-full items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
                    <Plus className="size-3.5" />Post New
                  </Link>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Analytics</h4>
                  <button onClick={loadAnalytics} disabled={fetchingAnalytics}
                    className="text-xs font-semibold text-primary hover:underline disabled:opacity-50">
                    {fetchingAnalytics ? 'Loading...' : 'Refresh'}
                  </button>
                </div>
                {ownerAnalytics ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-lg font-bold text-slate-800">{ownerAnalytics.totalApplicants || 0}</p>
                      <p className="text-[10px] text-slate-500">Applicants</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-lg font-bold text-slate-800">{ownerAnalytics.totalViews || 0}</p>
                      <p className="text-[10px] text-slate-500">Listing Views</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-lg font-bold text-slate-800">
                        {ownerAnalytics.totalViews > 0
                          ? `${((ownerAnalytics.totalApplicants || 0) / ownerAnalytics.totalViews * 100).toFixed(1)}%`
                          : '—'}
                      </p>
                      <p className="text-[10px] text-slate-500">Conversion</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 p-3 text-center">
                      <p className="text-lg font-bold text-slate-800">{jobs.length + internships.length}</p>
                      <p className="text-[10px] text-slate-500">Active Posts</p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-xs text-slate-400">Click to load analytics</p>
                    <button onClick={loadAnalytics} className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors">
                      <TrendingUp className="size-3.5" /> Load Stats
                    </button>
                  </div>
                )}
                <Link to="/company/dashboard" className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
                  Full Dashboard <ExternalLink className="size-3" />
                </Link>
              </div>
            </>
          )}

          {user?.role === 'admin' && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">Admin</h4>
              <div className="space-y-2">
                {!company.isVerified ? (
                  <button onClick={async () => {
                    try {
                      await api.patch(`/api/admin/companies/${companyId}/verify`)
                      toast.success('Company verified!')
                      window.location.reload()
                    } catch (e) { toast.error(e.message) }
                  }} className="flex w-full items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-600 transition-colors">
                    <BadgeCheck className="size-3.5" />Approve verification
                  </button>
                ) : (
                  <button onClick={async () => {
                    try {
                      await api.patch(`/api/admin/companies/${companyId}/unverify`)
                      toast.success('Verification revoked')
                      window.location.reload()
                    } catch (e) { toast.error(e.message) }
                  }} className="flex w-full items-center gap-1.5 rounded-lg bg-rose-500 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-600 transition-colors">
                    <XCircle className="size-3.5" />Revoke verification
                  </button>
                )}
                <button onClick={async () => {
                  try {
                    await api.patch(`/api/admin/companies/${companyId}/suspend`)
                    toast.success('Company suspended')
                    navigate('/admin/companies')
                  } catch (e) { toast.error(e.message) }
                }} className="flex w-full items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 transition-colors">
                  <AlertCircle className="size-3.5" />Suspend company
                </button>
                <Link to="/admin/audit-logs" className="flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50 transition-colors">
                  <Shield className="size-3.5" />Audit trail
                </Link>
              </div>
            </div>
          )}

          {!company.isClaimed && !isOwner && (
            <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-5 text-center">
              <Building2 className="mx-auto mb-2 size-8 text-primary/60" />
              <p className="text-sm font-bold text-primary">Is this your company?</p>
              <p className="mt-1 text-xs text-slate-500">Claim ownership to manage jobs, respond to reviews, and update your profile.</p>
              <Link to={`/claim-company/${companyId}`} className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
                <Shield className="size-3.5" /> Claim this Company
              </Link>
            </div>
          )}

          {similarCompanies.length > 0 && (
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Similar Companies</h4>
              <div className="space-y-3">
                {similarCompanies.map(c => (
                  <SimilarCompanyCard key={c._id} company={c} />
                ))}
              </div>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <ShieldCheck className="size-3.5 text-emerald-600" /> Registered business
              </div>
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <CheckCircle className="size-3.5 text-amber-600" /> No-fee complaints
              </div>
              <button onClick={handleReport} disabled={reporting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-50">
                <AlertCircle className="size-3.5" />{reporting ? 'Submitting...' : 'Report this company'}
              </button>
            </div>
          </div>
        </aside>
      </main>
    </SiteLayout>
  )
}
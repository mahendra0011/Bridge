import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Users, Bookmark, BookmarkCheck, Share2, Globe,
  Youtube, Instagram, Linkedin, ExternalLink, CheckCircle,
  ShieldCheck, Flag, Plus, CalendarDays, Briefcase,
  Star, Clock, Eye, TrendingUp, Award, Settings,
  UserCheck, FileText, AlertCircle, Timer, Sparkles, ChevronRight,
  HelpCircle,
} from 'lucide-react'
import { api, BASE_URL } from '@/lib/api'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'

function assetUrl(url) {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/')) return `${BASE_URL}${url}`
  return `${BASE_URL}/${url}`
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

function ReviewCard({ review }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-slate-800">{review.reviewer?.name || 'Anonymous'}</span>
        <StarRating rating={review.rating} />
      </div>
      <p className="text-xs text-slate-600">{review.comment}</p>
      <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
        <span>{review.role || 'Freelancer'}</span>
        <span>&middot;</span>
        <span>{new Date(review.createdAt).toLocaleDateString('en-IN')}</span>
      </div>
    </div>
  )
}

function RatingBreakdown({ breakdown }) {
  if (!breakdown || breakdown.length === 0) return null
  const labels = {
    payment: 'Payment Reliability',
    communication: 'Communication',
    clarity: 'Requirement Clarity',
    timeRespect: 'Time Respect',
  }
  return (
    <div className="space-y-2 mt-4 pt-4 border-t border-slate-200">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Rating Breakdown</p>
      {breakdown.map((item, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-28 text-xs text-slate-600">{labels[item.key] || item.key}</span>
          <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-amber-400" style={{ width: `${(item.score / 5) * 100}%` }} />
          </div>
          <span className="w-6 text-right text-xs font-bold text-slate-700">{item.score.toFixed(1)}</span>
        </div>
      ))}
    </div>
  )
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

const appliedOpStatuses = ['applied', 'shortlisted', 'interviewing', 'hired', 'accepted']

export default function PersonDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [person, setPerson] = useState(null)
  const [opportunities, setOpportunities] = useState([])
  const [reviews, setReviews] = useState([])
  const [reviewStats, setReviewStats] = useState({ avgRating: 0, count: 0 })
  const [ratingBreakdown, setRatingBreakdown] = useState([])
  const [activeTab, setActiveTab] = useState('active')
  const [loading, setLoading] = useState(true)
  const [reporting, setReporting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [similarOpps, setSimilarOpps] = useState([])
  const [ownerAnalytics, setOwnerAnalytics] = useState(null)
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api.get(`/api/person/${id}`)
      .then(data => {
        if (cancelled) return
        setPerson(data.person || data)
        setReviewStats(data.reviewStats || { avgRating: 0, count: 0 })
      })
      .catch(err => {
        if (cancelled) return
        toast.error(err.message || 'Person not found')
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  useEffect(() => {
    if (!person) return
    document.title = `${person.name} | Bridge`
    const updateMeta = (property, content) => {
      if (!content) return
      let el = document.querySelector(`meta[property="${property}"]`)
      if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el) }
      el.setAttribute('content', content)
    }
    updateMeta('og:title', `${person.name} — ${person.tagline || person.occupation || 'Poster on Bridge'}`)
    updateMeta('og:description', `${person.bio?.slice(0, 160) || `${person.occupation || 'Individual'} poster on Bridge — check their opportunities and reviews.`}`)
    updateMeta('og:url', window.location.href)
  }, [person])

  useEffect(() => {
    if (!person) return
    api.get(`/api/opportunities?poster=${id}&limit=20`)
      .then(d => setOpportunities(d.opportunities || []))
      .catch(() => {})
    api.get(`/api/person/${id}/reviews`)
      .then(d => {
        setReviews(d.reviews || [])
        setRatingBreakdown(d.breakdown || [
          { key: 'payment', score: d.reviewStats?.avgRating || 0 },
          { key: 'communication', score: d.reviewStats?.avgRating || 0 },
          { key: 'clarity', score: d.reviewStats?.avgRating || 0 },
          { key: 'timeRespect', score: d.reviewStats?.avgRating || 0 },
        ])
      })
      .catch(() => {})
    // similar opportunities
    const { skills, role } = person
    const filters = { limit: 4 }
    if (skills?.length) filters.skills = skills.slice(0, 3).join(',')
    else if (role) filters.role = role
    api.get('/api/opportunities?' + new URLSearchParams(filters))
      .then(data => setSimilarOpps((data.opportunities || []).filter(i => String(i._id) !== String(id)).slice(0, 3)))
      .catch(() => {})
  }, [person, id])

  useEffect(() => {
    if (!user) return
    api.get('/api/student/saved')
      .then(data => {
        if ((data.saved || []).some(s => String(s.posting?._id || s.posting) === id)) {
          setSaved(true)
        }
      })
      .catch(() => {})
  }, [user, id])

  const handleFollow = async () => {
    if (!user) { toast.error('Log in to follow this person'); return }
    try {
      const res = await api.post(`/api/person/${id}/follow`)
      setSaved(res.saved)
      toast.success(res.saved ? 'Following this poster!' : 'Unfollowed')
    } catch (err) {
      toast.error(err.message || 'Could not update follow status')
    }
  }

  const handleReport = async () => {
    const reason = prompt('Why are you reporting this person? (e.g., spam, scam, fake)')
    if (!reason?.trim()) return
    setReporting(true)
    try {
      await api.post('/api/reports', { targetType: 'person', targetId: id, reason: reason.trim() })
      toast.success('Report submitted. Our team will review it.')
    } catch (err) { toast.error(err.message || 'Could not submit report') }
    finally { setReporting(false) }
  }

  const handleMessage = async () => {
    if (!user) { toast.error('Log in to message this person'); return }
    navigate(`/dashboard/messages?userId=${id}`)
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

  if (!person) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <div className="mx-auto mb-6 flex size-20 items-center justify-center rounded-3xl bg-slate-50 ring-1 ring-slate-200">
            <Users className="size-10 text-slate-300" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Person not found</h1>
          <p className="mt-2 text-sm text-slate-500">This profile doesn't exist or has been deactivated.</p>
          <Link to="/opportunities" className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-all hover:bg-primary/90">
            <ArrowLeft className="size-4" /> Browse opportunities
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const initials = (person.name || 'U').split(' ').map(w => w[0]).slice(0, 2).join('')
  const verifiedCount = [person.isEmailVerified, person.isPhoneVerified, person.isIdVerified].filter(Boolean).length
  const activeOpps = opportunities.filter(o => o.status === 'active' || o.status === 'open')
  const completedOpps = opportunities.filter(o => o.status === 'completed' || o.status === 'filled')
  const visibleOpps = opportunities.filter(o => o.status !== 'archived')
  const totalHires = opportunities.reduce((sum, o) => sum + (o.filledCount || 0), 0)
  const completionRate = opportunities.length > 0
    ? Math.round((completedOpps.length / opportunities.length) * 100)
    : 0
  const isOwner = user?._id === id

  const tabs = [
    { key: 'active', label: 'Active', count: activeOpps.length },
    { key: 'completed', label: 'Completed', count: completedOpps.length },
    { key: 'all', label: 'All', count: visibleOpps.length },
  ]
  const filteredOpps = activeTab === 'active' ? activeOpps
    : activeTab === 'completed' ? completedOpps
    : visibleOpps

  // Profile completion for owner view
  const profileFields = [
    !!person.name,
    !!person.tagline,
    !!person.bio,
    !!person.location,
    !!person.occupation,
    !!(person.website || person.linkedin || person.youtube || person.instagram),
    !!person.isEmailVerified,
    !!person.isPhoneVerified,
  ]
  const profileCompletedCount = profileFields.filter(Boolean).length
  const profilePercent = Math.round((profileCompletedCount / profileFields.length) * 100)

  const loadAnalytics = async () => {
    if (fetchingAnalytics) return
    setFetchingAnalytics(true)
    try {
      const data = await api.get('/api/person/analytics')
      setOwnerAnalytics(data)
    } catch {} finally {
      setFetchingAnalytics(false)
    }
  }

  return (
    <SiteLayout>
      {/* Cover Banner */}
      {person.coverUrl && (
        <div className="h-32 sm:h-48 w-full overflow-hidden bg-slate-100">
          <img src={assetUrl(person.coverUrl)} alt="" className="h-full w-full object-cover" />
        </div>
      )}

      {/* Header Section */}
      <div className="bg-surface px-6 py-10">
        <div className="mx-auto max-w-5xl">
          <div className="flex items-center justify-between">
            <Link to="/opportunities" className="inline-flex items-center gap-1 text-sm font-semibold text-slate-600 hover:text-primary">
              <ArrowLeft className="size-4" /> Back to opportunities
            </Link>
            <div className="flex items-center gap-2">
              {!isOwner && (
                <Button onClick={handleMessage} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary/90">
                  Message
                </Button>
              )}
              <button onClick={handleFollow} className="inline-flex items-center gap-1 rounded-lg p-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                {saved ? <BookmarkCheck className="size-4 text-primary" /> : <Bookmark className="size-4" />}
              </button>
              <button onClick={() => {
                if (navigator.share) {
                  try { navigator.share({ title: person.name, url: window.location.href }) } catch {}
                } else {
                  navigator.clipboard.writeText(window.location.href)
                  toast.success('Link copied!')
                }
              }} className="inline-flex items-center gap-1 rounded-lg p-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                <Share2 className="size-4" /> Share
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex gap-5">
              {person.profilePhoto || person.avatarUrl ? (
                <img src={assetUrl(person.profilePhoto || person.avatarUrl)} alt="" className="size-16 shrink-0 rounded-2xl border border-slate-200 object-cover shadow-sm" />
              ) : (
                <div className={`grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${logoBgFor(person._id)} text-lg font-bold text-white shadow-sm`}>
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">{person.name}</h1>
                  {verifiedCount > 0 && (
                    <Tooltip text={`Email: ${person.isEmailVerified ? '✓' : '—'} | Phone: ${person.isPhoneVerified ? '✓' : '—'} | ID: ${person.isIdVerified ? '✓' : '—'}`}>
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200 cursor-help shrink-0">
                        <ShieldCheck className="size-3.5" /> Tier {verifiedCount}/3
                      </span>
                    </Tooltip>
                  )}
                </div>

                {person.tagline && (
                  <p className="mt-0.5 text-lg font-medium text-slate-600">{person.tagline}</p>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-slate-500">
                  <Meta icon={<MapPin className="size-4" />}>{person.location || 'India'}</Meta>
                  <Meta icon={<CalendarDays className="size-4" />}>Member since {person.memberSince ? new Date(person.memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</Meta>
                  {reviewStats.count > 0 && (
                    <Meta icon={<Star className="size-4" />}>
                      <span className="font-semibold text-slate-700">{reviewStats.avgRating.toFixed(1)}</span>
                      <span className="text-slate-400 ml-0.5">({reviewStats.count} {reviewStats.count === 1 ? 'review' : 'reviews'})</span>
                    </Meta>
                  )}
                </div>

                {person.occupation && (
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary/5 px-3 py-1 text-xs font-bold text-primary ring-1 ring-primary/20">
                      {person.occupation}
                    </span>
                  </div>
                )}

                {/* Social Links */}
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {person.website && (
                    <a href={person.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-3 py-1 text-xs font-semibold text-sky-700 hover:bg-sky-100 transition-colors">
                      <Globe className="size-3.5" /> Website <ExternalLink className="size-2.5" />
                    </a>
                  )}
                  {person.linkedin && (
                    <a href={person.linkedin} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-[#0A66C2]/10 px-3 py-1 text-xs font-semibold text-[#0A66C2] hover:bg-[#0A66C2]/20 transition-colors">
                      <Linkedin className="size-3.5" /> LinkedIn <ExternalLink className="size-2.5" />
                    </a>
                  )}
                  {person.youtube && (
                    <a href={person.youtube} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors">
                      <Youtube className="size-3.5" /> YouTube <ExternalLink className="size-2.5" />
                    </a>
                  )}
                  {person.instagram && (
                    <a href={person.instagram} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full bg-pink-50 px-3 py-1 text-xs font-semibold text-pink-600 hover:bg-pink-100 transition-colors">
                      <Instagram className="size-3.5" /> Instagram <ExternalLink className="size-2.5" />
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Header right: open opportunities count */}
            <div className="flex shrink-0 items-center gap-3">
              <span className="rounded-full bg-emerald-50 px-5 py-2.5 text-base font-bold text-emerald-700">
                {activeOpps.length > 0 ? `${activeOpps.length} open opportunit${activeOpps.length !== 1 ? 'ies' : 'y'}` : 'No openings'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Info Bar (social links already moved to header, keep member+occupation here too) */}
      <div className="bg-white border-b border-slate-200">
        <div className="mx-auto max-w-5xl px-6 py-4 flex flex-wrap items-center gap-4 text-sm">
          <div>
            <span className="text-xs text-slate-500">Member since</span>
            <p className="font-medium">{person.memberSince ? new Date(person.memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'}</p>
          </div>
          {person.occupation && (
            <div>
              <span className="text-xs text-slate-500">Occupation</span>
              <p className="font-medium">{person.occupation}</p>
            </div>
          )}
          {person.responseTime && (
            <div>
              <span className="text-xs text-slate-500">Response time</span>
              <p className="font-medium"><Clock className="size-3 inline mr-1" />~{person.responseTime}h</p>
            </div>
          )}
        </div>
      </div>

      {/* Main content + Sidebar layout */}
      <main className="mx-auto grid max-w-5xl gap-12 px-6 py-12 lg:grid-cols-[1fr_280px]">
        <article className="space-y-10">
          {/* Quick Info Chips */}
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4">
            <Meta icon={<Briefcase className="size-4" />} chip>{opportunities.length} posted</Meta>
            <Meta icon={<Award className="size-4" />} chip>{completionRate}% completion</Meta>
            <Meta icon={<Users className="size-4" />} chip>{totalHires} hires</Meta>
            {reviewStats.count > 0 && (<Meta icon={<Star className="size-4" />} chip>{reviewStats.avgRating.toFixed(1)} ({reviewStats.count})</Meta>)}
            {person.responseTime && (<Meta icon={<Timer className="size-4" />} chip>~{person.responseTime}h response</Meta>)}
            {person.profileViews !== undefined && (<Meta icon={<Eye className="size-4" />} chip>{person.profileViews} views</Meta>)}
          </div>

          {/* About Section */}
          {person.bio && (
            <Section title="About" icon={FileText}>
              <p className="text-slate-600 whitespace-pre-line leading-relaxed">{person.bio}</p>
            </Section>
          )}

          {/* Trust & Verification Section */}
          <Section title="Trust & Verification" icon={ShieldCheck}>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">Verification Tier: {verifiedCount}/3</p>
                  <div className="mt-1 space-y-1 text-xs text-slate-500">
                    <p className={person.isEmailVerified ? 'text-emerald-600' : ''}>
                      <CheckCircle className={`size-3 inline mr-1 ${person.isEmailVerified ? 'text-emerald-500' : 'text-slate-300'}`} />
                      Email: {person.isEmailVerified ? 'Verified' : 'Not verified'}
                    </p>
                    <p className={person.isPhoneVerified ? 'text-emerald-600' : ''}>
                      <CheckCircle className={`size-3 inline mr-1 ${person.isPhoneVerified ? 'text-emerald-500' : 'text-slate-300'}`} />
                      Phone: {person.isPhoneVerified ? 'Verified' : 'Not verified'}
                    </p>
                    <p className={person.isIdVerified ? 'text-emerald-600' : ''}>
                      <CheckCircle className={`size-3 inline mr-1 ${person.isIdVerified ? 'text-emerald-500' : 'text-slate-300'}`} />
                      ID: {person.isIdVerified ? 'Verified' : 'Not verified'}
                    </p>
                  </div>
                </div>
              </div>

              <div className={`flex items-start gap-3 rounded-xl px-4 py-3 ${(person.feeComplaintCount || 0) > 0 ? 'bg-rose-50' : 'bg-amber-50'}`}>
                <CheckCircle className={`size-4 shrink-0 mt-0.5 ${(person.feeComplaintCount || 0) > 0 ? 'text-rose-600' : 'text-amber-600'}`} />
                <div>
                  <p className={`text-xs font-semibold ${(person.feeComplaintCount || 0) > 0 ? 'text-rose-800' : 'text-amber-800'}`}>
                    {(person.feeComplaintCount || 0) > 0
                      ? `${person.feeComplaintCount} fee-related complaint(s) reported`
                      : 'No payment-related complaints reported'}
                  </p>
                </div>
              </div>

              {(completedOpps.length > 0 || totalHires > 0) && (
                <div className="flex items-start gap-3 rounded-xl bg-emerald-50 p-3">
                  <Award className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-emerald-800">Payment Reliability</p>
                    <p className="text-xs text-emerald-600">
                      {completedOpps.length} of {opportunities.length} opportunities completed{totalHires > 0 ? ` with ${totalHires} hire(s)` : ''}
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-semibold text-rose-800">⚠ Safe Payment Advisory</p>
                <p className="mt-1 text-xs text-rose-600">
                  Keep all communication and payments on-platform. Never pay to apply or get hired.
                  Report immediately if anyone asks for payment to proceed.
                </p>
              </div>
            </div>
          </Section>

          {/* Reviews & Ratings */}
          <Section title="Reviews & Ratings" icon={Star}>
            {reviewStats.count > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                  <span className="text-4xl font-extrabold text-slate-800">{reviewStats.avgRating.toFixed(1)}</span>
                  <div>
                    <StarRating rating={reviewStats.avgRating} size="lg" />
                    <p className="mt-0.5 text-xs text-slate-500">Based on {reviewStats.count} verified {reviewStats.count === 1 ? 'review' : 'reviews'}</p>
                  </div>
                </div>
                <RatingBreakdown breakdown={ratingBreakdown} />
                <div className="space-y-2">
                  {reviews.slice(0, 5).map(r => (
                    <ReviewCard key={r._id} review={r} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
                <Star className="mx-auto size-8 text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">No reviews yet</p>
                <p className="text-xs text-slate-400 mt-1">Reviews appear after opportunities are completed</p>
              </div>
            )}
          </Section>

          {/* Opportunities Posted */}
          <Section title="Opportunities Posted" icon={Briefcase}>
            <div className="flex items-center border-b border-slate-200 -mt-1 mb-0">
              {tabs.map(tab => (
                <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                  className={`relative flex items-center gap-1.5 px-4 py-3 text-sm font-semibold transition-colors ${activeTab === tab.key ? 'text-primary' : 'text-slate-500 hover:text-slate-700'}`}>
                  {tab.label}
                  <span className={`inline-flex items-center justify-center rounded-full px-2 py-0.5 text-[11px] font-bold ${activeTab === tab.key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-500'}`}>{tab.count}</span>
                  {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white">
              {filteredOpps.length === 0 ? (
                <div className="px-5 py-12 text-center">
                  <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-2xl bg-slate-50"><Briefcase className="size-6 text-slate-300" /></div>
                  <p className="text-sm font-medium text-slate-500">No {activeTab} opportunities</p>
                  {isOwner && (
                    <Link to="/post-opportunity" className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90">
                      <Plus className="size-3.5" /> Post your first opportunity
                    </Link>
                  )}
                </div>
              ) : (
                <>
                  <div className="border-b border-slate-100 px-5 py-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{filteredOpps.length} {activeTab === 'active' ? 'active' : activeTab === 'completed' ? 'completed' : ''} opportunity{filteredOpps.length !== 1 ? 'ies' : 'y'}</p>
                  </div>
                  <div className="grid gap-px bg-slate-100">
                    {filteredOpps.map(opp => (
                      <Link
                        key={opp._id}
                        to={`/opportunity/${opp._id}`}
                        className="group relative flex flex-col gap-2 border-b border-slate-100 bg-white px-5 py-4 transition-all last:border-b-0 hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-2 font-semibold text-slate-800">{opp.title}</p>
                          <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-500">
                            <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {opp.location || 'Remote'}</span>
                            {opp.peopleNeeded > 1 && <><span className="text-slate-300">·</span><span className="text-amber-600 font-medium">{opp.peopleNeeded} needed</span></>}
                            {opp.filledCount > 0 && <><span className="text-slate-300">·</span><span className="text-emerald-600 font-medium">{opp.filledCount} filled</span></>}
                          </p>
                        </div>
                        <div className="flex shrink-0 flex-wrap items-center gap-3">
                          <span className="whitespace-nowrap text-sm font-bold text-emerald-700">
                            {opp.budget ? `₹${Number(opp.budget).toLocaleString()}${opp.budgetType === 'monthly' ? '/mo' : opp.budgetType === 'hourly' ? '/hr' : ''}` : 'Budget N/A'}
                          </span>
                          <span className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-all group-hover:border-primary/30 group-hover:bg-primary/5 group-hover:text-primary">
                            View <ChevronRight className="size-3 transition-transform group-hover:translate-x-0.5" />
                          </span>
                        </div>
                      </Link>
                    ))}
                  </div>
                </>
              )}
            </div>
          </Section>

          {/* Similar Opportunities */}
          {similarOpps.length > 0 && (
            <Section title="Similar Opportunities" icon={Sparkles}>
              <div className="grid gap-3 sm:grid-cols-2">
                {similarOpps.map(opp => (
                  <Link key={opp._id} to={`/opportunity/${opp._id}`}
                    className="block rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md hover:-translate-y-0.5">
                    <p className="font-semibold text-sm line-clamp-2">{opp.title}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                      {opp.poster?.name && <span>{opp.poster.name}</span>}
                      {opp.peopleNeeded > 1 && <><span>&middot;</span><span className="text-amber-600 font-medium">{opp.peopleNeeded} needed</span></>}
                      <span>&middot;</span>
                      <span className="text-emerald-600 font-medium">₹{Number(opp.budget).toLocaleString()}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </Section>
          )}

          {/* Report button */}
          {!isOwner && (
            <button onClick={handleReport} disabled={reporting}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-rose-600 disabled:opacity-50">
              <AlertCircle className="size-3.5" />{reporting ? 'Submitting...' : 'Report this person'}
            </button>
          )}
        </article>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Snapshot */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Snapshot</h4>
            <dl className="space-y-3 text-sm">
              <Row k="Occupation" v={person.occupation || '—'} />
              <Row k="Location" v={person.location || 'India'} />
              <Row k="Total Posted" v={String(opportunities.length)} />
              <Row k="Hires Made" v={String(totalHires)} />
              <Row k="Completion Rate" v={`${completionRate}%`} />
              <Row k="Reviews" v={String(reviewStats.count)} />
              {person.responseTime && <Row k="Response Time" v={`~${person.responseTime}h`} />}
              {person.profileViews !== undefined && <Row k="Profile Views" v={String(person.profileViews)} />}
              <Row k="Member Since" v={person.memberSince ? new Date(person.memberSince).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '—'} />
            </dl>
          </div>

          {/* Report poster (sidebar version) */}
          {!isOwner && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <ShieldCheck className="size-3.5 text-emerald-600" /> Tier {verifiedCount}/3 Verified
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                  <CheckCircle className="size-3.5 text-amber-600" /> {(person.feeComplaintCount || 0) > 0 ? `${person.feeComplaintCount} fee complaint(s)` : 'No-fee complaints'}
                </div>
                <button onClick={handleReport} disabled={reporting} className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-500 hover:text-rose-600 disabled:opacity-50">
                  <AlertCircle className="size-3.5" />{reporting ? 'Submitting...' : 'Report this person'}
                </button>
              </div>
            </div>
          )}

          {/* Owner View */}
          {isOwner && (
            <>
              {/* Preview Mode indicator */}
              <div className="rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50/80 p-4 text-center">
                <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-full bg-amber-100">
                  <Eye className="size-5 text-amber-600" />
                </div>
                <p className="text-sm font-bold text-amber-800">Preview Mode</p>
                <p className="mt-0.5 text-xs text-amber-600">This is how your profile appears to others</p>
              </div>

              {/* Profile Completion */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Profile Completion</h4>
                  <span className="text-sm font-bold text-primary">{profilePercent}%</span>
                </div>
                <div className="mb-3 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div className={`h-full rounded-full transition-all duration-500 ${profilePercent === 100 ? 'bg-emerald-500' : 'bg-primary'}`}
                    style={{ width: `${profilePercent}%` }} />
                </div>
                <div className="space-y-1">
                  {[
                    { label: 'Name', done: !!person.name },
                    { label: 'Tagline', done: !!person.tagline },
                    { label: 'Bio', done: !!person.bio },
                    { label: 'Location', done: !!person.location },
                    { label: 'Occupation', done: !!person.occupation },
                    { label: 'Social Links', done: !!(person.website || person.linkedin || person.youtube || person.instagram) },
                    { label: 'Email Verified', done: !!person.isEmailVerified },
                    { label: 'Phone Verified', done: !!person.isPhoneVerified },
                  ].map((f, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      {f.done ? <CheckCircle className="size-3 text-emerald-500" /> : <div className="size-3 rounded-full border-2 border-slate-300" />}
                      <span className={f.done ? 'text-slate-500' : 'text-slate-400'}>{f.label}</span>
                    </div>
                  ))}
                </div>
                {profilePercent < 100 && (
                  <Link to="/setup/profile" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
                    <AlertCircle className="size-3.5" /> Complete profile
                  </Link>
                )}
              </div>

              {/* Verification status */}
              {!person.isIdVerified && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                  <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-amber-600">Verification Pending</h4>
                  <p className="text-xs text-amber-700">Verify your ID to increase trust and unlock higher posting limits.</p>
                  <Link to="/profile?tab=verification" className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 py-2 text-xs font-semibold text-white hover:bg-amber-600 transition-colors">
                    <ShieldCheck className="size-3.5" /> Verify ID
                  </Link>
                </div>
              )}

              {/* Manage */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Manage</h4>
                <div className="space-y-2">
                  <Link to="/profile" className="flex w-full items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2.5 text-xs font-bold text-primary hover:bg-primary/10 transition-colors">
                    <Settings className="size-3.5" /> Edit Profile
                  </Link>
                  <Link to="/post-opportunity" className="flex w-full items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors">
                    <Plus className="size-3.5" /> Post New Opportunity
                  </Link>
                </div>
              </div>

              {/* Analytics */}
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
                      <p className="text-[10px] text-slate-500">Total Applicants</p>
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
                      <p className="text-lg font-bold text-slate-800">{ownerAnalytics.activeOpps || 0}</p>
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
              </div>
            </>
          )}
        </aside>
      </main>
    </SiteLayout>
  )
}

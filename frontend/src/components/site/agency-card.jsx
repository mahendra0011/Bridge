import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  MapPin, Bookmark, Clock, BadgeCheck, Users,
  Building2, ExternalLink, DollarSign,
  Briefcase, Shield, Timer,
} from 'lucide-react'
import { useCardActions } from './useCardActions'
import { CardWrapper } from './CardWrapper'
import { SkillChips } from './SkillChips'

const logoBgs = [
  'from-violet-500 to-fuchsia-600',
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
]

function logoBgFor(id) {
  const str = String(id || '')
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash + str.charCodeAt(i)) % logoBgs.length
  return logoBgs[hash]
}

const statusColors = {
  Applied: 'bg-blue-50 text-blue-700 ring-blue-200',
  'Under Review': 'bg-amber-50 text-amber-700 ring-amber-200',
  Shortlisted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Interview Scheduled': 'bg-violet-50 text-violet-700 ring-violet-200',
  Rejected: 'bg-red-50 text-red-700 ring-red-200',
  Offered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Hired: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

const POSTING_TYPE_STYLES = {
  Project: 'bg-violet-50 text-violet-700 ring-violet-200',
  Internship: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Part-time': 'bg-amber-50 text-amber-700 ring-amber-200',
  'Full-time': 'bg-blue-50 text-blue-700 ring-blue-200',
}

const MODE_STYLES = {
  Remote: 'bg-sky-50 text-sky-700 ring-sky-200',
  Hybrid: 'bg-violet-50 text-violet-700 ring-violet-200',
  'On-site': 'bg-amber-50 text-amber-700 ring-amber-200',
}

const VERIFICATION_STYLES = {
  Registered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'ID Verified': 'bg-blue-50 text-blue-700 ring-blue-200',
  Unverified: 'bg-slate-50 text-slate-500 ring-slate-200',
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'Today'
  if (days === 1) return '1d ago'
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

function deadlineCountdown(deadline) {
  if (!deadline) return null
  const diffMs = new Date(deadline).getTime() - Date.now()
  const days = Math.ceil(diffMs / 86400000)
  if (days < 0) return { text: 'Closed', closed: true, urgent: false }
  if (days === 0) return { text: 'Last day', urgent: true, closed: false }
  if (days <= 3) return { text: `${days} days left`, urgent: true, closed: false }
  return { text: `${days} days left`, urgent: false, closed: false }
}

function formatPay(item) {
  if (item.projectFee) return `₹${Number(item.projectFee).toLocaleString()}`
  if (item.hourlyRate) return `₹${Number(item.hourlyRate).toLocaleString()}/hr`
  if (item.salaryMin || item.salaryMax) {
    const min = Number(item.salaryMin || 0).toLocaleString()
    const max = Number(item.salaryMax || item.salaryMin || 0).toLocaleString()
    return `₹${min} – ₹${max}/mo`
  }
  if (item.stipend) return `₹${Number(item.stipend).toLocaleString()}/mo`
  if (item.budget) {
    const bt = item.budgetType === 'monthly' ? '/mo' : item.budgetType === 'hourly' ? '/hr' : ''
    return `₹${Number(item.budget).toLocaleString()}${bt}`
  }
  return 'Negotiable'
}

const SERVICE_CATEGORIES = [
  'Video Editing', 'Photo Editing/Photography', 'Graphic Design',
  'Digital Marketing', 'Content Writing', 'Web Development',
  'Social Media Management', 'Animation/VFX', 'SEO', 'Voice Over', 'Other',
]

function getPostingType(item) {
  if (item.opportunityType) return item.opportunityType
  if (item.kind === 'internship') return 'Internship'
  if (item.employmentType === 'Part-time') return 'Part-time'
  if (item.employmentType === 'Full-time') return 'Full-time'
  if (item.isClientProject || item.employmentType === 'Contract' || item.employmentType === 'Freelance' || item.projectFee) return 'Project'
  return 'Full-time'
}

function getCategory(item, agency) {
  if (item.category) return item.category
  if (agency?.services?.length) return agency.services[0]
  const match = (item.skills || []).find(s => SERVICE_CATEGORIES.includes(s))
  if (match) return match
  return null
}

function getVerificationTier(agency) {
  if (!agency) return { label: 'Unverified', tooltip: 'New agency — identity not yet verified' }
  if (agency.isRegistered && agency.regCertificate) return { label: 'Registered', tooltip: 'Udyam verified — registered business with certificate on file' }
  if (agency.idProof) return { label: 'ID Verified', tooltip: 'Identity verified via government-issued ID proof' }
  return { label: 'Unverified', tooltip: 'New agency — identity not yet verified' }
}

function formatTitle(item, typeText) {
  const base = item.title || item.role || ''
  const lookingFor = base ? `Looking for ${base}` : ''
  if (typeText === 'Project' && item.duration) {
    return `${lookingFor} — ${item.duration} Project`
  }
  return lookingFor
}

export function AgencyCard({ item, index = 0 }) {
  const savedIds = useSelector((state) => state.saved.ids)
  const agency = item.agency || {}
  const key = `${item.kind || 'posting'}:${item._id || item.id}`
  const saved = savedIds.includes(key)

  const initials = (agency.agencyName || 'A')
    .split(' ').map((w) => w[0]).slice(0, 2).join('')

  const typeText = getPostingType(item)
  const verification = getVerificationTier(agency)
  const category = getCategory(item, agency)
  const location = item.location || agency.city || 'Remote'
  const mode = item.mode || 'Remote'
  const payText = formatPay(item)
  const duration = item.duration || null
  const openings = item.vacancies || item.openings || item.peopleNeeded || null
  const posted = timeAgo(item.createdAt)
  const deadline = deadlineCountdown(item.deadline)
  const applied = item.applied
  const appStatus = item.applicationStatus
  const isClosed = item.status === 'closed' || item.status === 'expired' || deadline?.closed
  const clientName = item.clientProjectLabel
  const displayTitle = formatTitle(item, typeText)

  const allSkills = [...new Set([
    ...(item.skills || []),
    ...(item.goodToHaveSkills || []),
    ...(item.tools || []),
  ])]

  const { handleSave } = useCardActions('agency')

  return (
    <CardWrapper isClosed={isClosed} isBoosted={item.isBoosted} index={index}>
      {/* ── Top-right status badges ── */}
      {applied && appStatus && (
        <div className="absolute right-3 top-3 z-10 flex items-center gap-1">
          <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 sm:text-[11px] ${statusColors[appStatus] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
            {appStatus}
          </span>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         HEADER / TOP ROW: Agency logo + verified + Title + Type badge
         ══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/agency/${agency._id || item.agencyId || item._id}`}
          className="flex items-center gap-2.5 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl text-xs font-bold text-white sm:size-10 sm:text-sm ${agency.logoUrl ? '' : `bg-gradient-to-br ${logoBgFor(agency._id || item._id)}`}`}>
            {agency.logoUrl ? (
              <img src={agency.logoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-bold ring-1 sm:px-2 sm:text-[10px] ${VERIFICATION_STYLES[verification.label] || VERIFICATION_STYLES.Unverified}`}>
            {verification.label !== 'Unverified' && <BadgeCheck className="size-2.5 sm:size-3" />}
            {verification.label}
          </span>
        </Link>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 sm:text-[11px] ${POSTING_TYPE_STYLES[typeText] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
            {typeText}
          </span>
          {category && (
            <span className="rounded-full bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary sm:text-[11px]">
              {category}
            </span>
          )}
        </div>
      </div>

      {/* Title */}
      <div className="mt-2.5 sm:mt-3 flex items-start gap-2">
        <Link
          to={`/agency/listing/${item._id || item.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1"
        >
          <h3 className="text-sm font-bold leading-snug text-slate-900 line-clamp-2 transition-colors group-hover:text-primary sm:text-base">
            {displayTitle}
          </h3>
        </Link>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         AGENCY NAME ROW — clickable (like job/internship card style)
         ══════════════════════════════════════════════════════════════════ */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 sm:text-xs">
        <Link
          to={`/agency/${agency._id || item.agencyId || item._id}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-slate-700 hover:text-primary"
        >
          <Building2 className="size-3 inline mr-1" />
          {agency.agencyName || 'Agency'}
        </Link>
        {clientName && (
          <>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-700">
              <Briefcase className="size-2.5" /> For: {clientName}
            </span>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         KEY INFO STRIP
         ══════════════════════════════════════════════════════════════════ */}
      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500 sm:text-xs">
        {location && (
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3 sm:size-3.5" />
            {location}
          </span>
        )}
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-semibold ring-1 ${MODE_STYLES[mode] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
          {mode === 'Remote' ? '🏠' : mode === 'Hybrid' ? '🏢🏠' : '🏢'} {mode}
        </span>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 font-bold text-emerald-700 ring-1 ring-emerald-600/10">
          <DollarSign className="size-3" />
          {payText}
        </span>
        {duration && (
          <span className="inline-flex items-center gap-1">
            <Timer className="size-3 sm:size-3.5" />
            {duration}
          </span>
        )}
        {openings && (
          <span className="inline-flex items-center gap-1">
            <Users className="size-3 sm:size-3.5" />
            {openings} opening{openings > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Posted + Deadline */}
      <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-400 sm:text-xs">
        {posted && (
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3 sm:size-3.5" />
            {posted}
          </span>
        )}
        {deadline && !deadline.closed && (
          <>
            <span className="text-slate-300">·</span>
            <span className={`font-semibold ${deadline.urgent ? 'text-rose-600' : 'text-slate-500'}`}>
              {deadline.text}
            </span>
          </>
        )}
        {deadline?.closed && <span className="text-rose-500 font-semibold">Closed</span>}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         SKILLS / TOOLS CHIPS
         ══════════════════════════════════════════════════════════════════ */}
      {allSkills.length > 0 && (
        <div className="mt-2.5">
          <SkillChips skills={allSkills} maxToShow={5} />
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
         TRUST LEVEL — clearly visible on card
         ══════════════════════════════════════════════════════════════════ */}
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
        {verification.label === 'Unverified' ? (
          <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
            <Shield className="size-3" /> Unverified — trust badge lowered
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 text-emerald-600 font-medium">
            <BadgeCheck className="size-3" /> {verification.label}
          </span>
        )}
        {item.applicantsCount > 0 && (
          <span className="inline-flex items-center gap-1">
            <Users className="size-3" /> {item.applicantsCount} applied
          </span>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* ══════════════════════════════════════════════════════════════════
         BOTTOM: Save + Action buttons
         ══════════════════════════════════════════════════════════════════ */}
      <div className="mt-3 flex items-center justify-end gap-2 border-t border-slate-100 pt-3">
        <button
          onClick={(e) => handleSave(item)}
          className={`grid size-7 shrink-0 place-items-center rounded-lg border transition-all sm:size-8 ${
            saved
              ? 'border-primary bg-primary/10 text-primary shadow-sm'
              : 'border-slate-200 text-slate-400 hover:border-primary hover:text-primary hover:shadow-sm'
          }`}
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          <Bookmark className="size-3 sm:size-3.5" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
         3 ACTION BUTTONS
         ══════════════════════════════════════════════════════════════════ */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {applied ? (
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ring-1 sm:text-xs ${statusColors[appStatus] || statusColors.Applied}`}>
            {appStatus || 'Applied'}
          </span>
        ) : (
          <Link
            to={`/agency/listing/${item._id || item.id}`}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all sm:px-4 sm:py-2 sm:text-xs ${
              isClosed
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 hover:shadow-sm active:scale-[0.97]'
            }`}
          >
            {isClosed ? 'Closed' : 'Apply+'}
          </Link>
        )}
        <Link
          to={`/agency/${agency._id || item.agencyId || item._id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5 sm:px-3 sm:py-2 sm:text-xs"
        >
          <Building2 className="size-3 sm:size-3.5" /> View Agency Details
        </Link>
        <Link
          to={`/agency/listing/${item._id || item.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5 sm:px-3 sm:py-2 sm:text-xs"
        >
          <ExternalLink className="size-3 sm:size-3.5" /> View More Details
        </Link>
      </div>
    </CardWrapper>
  )
}

export function AgencyCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-slate-200 sm:size-10" />
          <div className="h-4 w-20 rounded bg-slate-200" />
        </div>
        <div className="flex gap-1.5">
          <div className="h-5 w-16 rounded-full bg-slate-200" />
          <div className="h-5 w-20 rounded-full bg-slate-200" />
        </div>
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
      </div>
      <div className="mt-2 h-4 w-40 rounded bg-slate-200" />
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-20 rounded-full bg-slate-200" />
        <div className="h-5 w-16 rounded-full bg-slate-200" />
        <div className="h-5 w-14 rounded-full bg-slate-200" />
        <div className="h-5 w-24 rounded-full bg-slate-200" />
      </div>
      <div className="mt-2 h-4 w-36 rounded bg-slate-200" />
      <div className="mt-2 flex gap-1.5">
        <div className="h-5 w-16 rounded-md bg-slate-200" />
        <div className="h-5 w-20 rounded-md bg-slate-200" />
        <div className="h-5 w-14 rounded-md bg-slate-200" />
      </div>
      <div className="mt-2 flex items-center justify-end border-t border-slate-100 pt-3">
        <div className="size-7 rounded-lg bg-slate-200 sm:size-8" />
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-7 w-20 rounded-lg bg-slate-200" />
        <div className="h-7 w-32 rounded-lg bg-slate-200" />
        <div className="h-7 w-32 rounded-lg bg-slate-200" />
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  MapPin, Bookmark, Clock, BadgeCheck, Briefcase, Users,
  CalendarDays, Building2, ExternalLink, Eye, DollarSign,
} from 'lucide-react'
import { useCardActions } from './useCardActions'
import { CardWrapper } from './CardWrapper'
import { SkillChips } from './SkillChips'

const statusColors = {
  Applied: 'bg-blue-50 text-blue-700 ring-blue-200',
  'Under Review': 'bg-amber-50 text-amber-700 ring-amber-200',
  Shortlisted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Interview Scheduled': 'bg-violet-50 text-violet-700 ring-violet-200',
  Rejected: 'bg-red-50 text-red-700 ring-red-200',
  Offered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Hired: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export function JobCard({ item, index = 0 }) {
  const savedIds = useSelector((state) => state.saved.ids)
  const key = `${item.kind}:${item.id}`
  const saved = savedIds.includes(key)
  const initials = item.company
    ? item.company.split(' ').map((w) => w[0]).slice(0, 2).join('')
    : 'C'

  const isClosed = item.status === 'closed' || item.status === 'expired' || item.deadline?.closed
  const isBoosted = item.isBoosted
  const applied = item.applied
  const appStatus = item.applicationStatus

  const { handleSave } = useCardActions('job')

  return (
    <CardWrapper isClosed={isClosed} isBoosted={isBoosted} index={index}>
      {/* Row 1: Logo + Company + Verified — Bookmark */}
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/job/${item._id || item.id}`}
          className="flex items-center gap-2.5 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl text-xs font-bold text-white sm:size-10 sm:text-sm ${item.companyLogoUrl ? '' : `bg-gradient-to-br ${item.logoBg}`}`}>
            {item.companyLogoUrl ? (
              <img src={item.companyLogoUrl} alt="" className="size-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-xs font-semibold text-slate-600 sm:text-sm">{item.company}</span>
            {item.companyVerified && <BadgeCheck className="size-3.5 shrink-0 text-blue-500 sm:size-4" />}
          </div>
        </Link>

        <button
          onClick={(e) => handleSave(item)}
          className={`mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg border transition-all sm:size-8 ${
            saved
              ? 'border-primary bg-primary/10 text-primary shadow-sm'
              : 'border-slate-200 text-slate-400 hover:border-primary hover:text-primary hover:shadow-sm'
          }`}
          aria-label={saved ? 'Unsave' : 'Save'}
        >
          <Bookmark className="size-3 sm:size-3.5" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      {/* Row 2: Title + Type chip */}
      <div className="mt-2.5 sm:mt-3 flex items-start gap-2">
        <Link
          to={`/job/${item._id || item.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1"
        >
          <h3 className="text-sm font-bold leading-snug text-slate-900 line-clamp-2 transition-colors group-hover:text-primary sm:text-base">
            {item.title}
          </h3>
        </Link>
        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600 ring-1 ring-blue-200 sm:px-2.5 sm:text-[11px]">
          Job
        </span>
      </div>

      {/* Row 3: Company name · Location · Mode tag */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 sm:text-xs">
        <span className="font-medium text-slate-700">{item.company}</span>
        <span className="text-slate-300">·</span>
        {item.location && (
          <span className="inline-flex items-center gap-1"><MapPin className="size-3 sm:size-3.5" /> <span className="truncate max-w-[120px]">{item.location}</span></span>
        )}
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:text-[11px] ${
          item.mode === 'Remote' ? 'bg-sky-50 text-sky-600' :
          item.mode === 'Hybrid' ? 'bg-violet-50 text-violet-600' :
          'bg-amber-50 text-amber-600'
        }`}>{item.mode}</span>
      </div>

      {/* Row 4: Employment type · Experience required · Vacancies */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {item.type && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
            {item.type}
          </span>
        )}
        {item.experience && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
            <Briefcase className="size-3" /> {item.experience}
          </span>
        )}
        {item.vacancies > 1 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
            <Users className="size-3" /> {item.vacancies} openings
          </span>
        )}
      </div>

      {/* Row 5: Skills chips */}
      {item.skills?.length > 0 && (
        <SkillChips skills={item.skills} maxToShow={4} />
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Row 6: Salary + Deadline + Posted + Applicants */}
      <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 sm:mt-4 sm:pt-4">
        <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 sm:px-3 sm:py-1 sm:text-xs ${
          item.pay === 'Not disclosed'
            ? 'bg-slate-50 text-slate-500 ring-slate-200'
            : 'bg-emerald-50 text-emerald-700 ring-emerald-600/10'
        }`}>
          {item.pay}
        </span>

        {item.applicantsCount > 0 && (
          <span className="hidden items-center gap-1 text-[11px] text-slate-400 sm:inline-flex">
            <Eye className="size-3" /> {item.applicantsCount} applied
          </span>
        )}

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          {item.deadline && (
            <span className={`inline-flex items-center gap-1 text-[10px] sm:text-xs ${
              item.deadline.urgent ? 'text-red-500 font-bold' : 'text-slate-400'
            }`}>
              <Clock className="size-2.5 sm:size-3" />
              {item.deadline.text}
            </span>
          )}
          <span className="text-[10px] text-slate-400 sm:text-xs">{item.posted}</span>
        </div>
      </div>

      {/* Row 7: Action buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {applied ? (
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ring-1 sm:text-xs ${statusColors[appStatus] || statusColors.Applied}`}>
            {appStatus || 'Applied'}
          </span>
        ) : (
          <Link
            to={`/job/${item._id || item.id}`}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all sm:px-4 sm:py-2 sm:text-xs ${
              isClosed
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 hover:shadow-sm active:scale-[0.97]'
            }`}
          >
            {isClosed ? 'Closed' : 'Apply Now'}
          </Link>
        )}

        <Link
          to={`/job/${item._id || item.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5 sm:px-3 sm:py-2 sm:text-xs"
        >
          <ExternalLink className="size-3 sm:size-3.5" />
          View Job
        </Link>

        {item.companyId && (
          <Link
            to={`/company/${item.companyId}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5 sm:px-3 sm:py-2 sm:text-xs"
          >
            <Building2 className="size-3 sm:size-3.5" />
            View Company
          </Link>
        )}
      </div>
    </CardWrapper>
  )
}

export function JobCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-xl bg-slate-200 sm:size-10" />
          <div className="h-4 w-28 rounded bg-slate-200" />
        </div>
        <div className="size-7 rounded-lg bg-slate-200 sm:size-8" />
      </div>
      <div className="mt-3 space-y-2">
        <div className="h-5 w-3/4 rounded bg-slate-200" />
        <div className="h-4 w-1/2 rounded bg-slate-200" />
      </div>
      <div className="mt-2 flex gap-2">
        <div className="h-4 w-16 rounded bg-slate-200" />
        <div className="h-4 w-20 rounded bg-slate-200" />
        <div className="h-4 w-24 rounded bg-slate-200" />
      </div>
      <div className="mt-2 flex gap-1">
        <div className="h-5 w-14 rounded-md bg-slate-200" />
        <div className="h-5 w-20 rounded-md bg-slate-200" />
        <div className="h-5 w-16 rounded-md bg-slate-200" />
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="h-5 w-24 rounded-full bg-slate-200" />
        <div className="flex flex-1 justify-end gap-2">
          <div className="h-5 w-20 rounded-lg bg-slate-200" />
          <div className="h-5 w-20 rounded-lg bg-slate-200" />
        </div>
      </div>
    </div>
  )
}
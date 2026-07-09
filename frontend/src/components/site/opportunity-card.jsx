import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  MapPin, Bookmark, Clock, BadgeCheck, Users, ExternalLink, Eye,
  DollarSign, ShieldCheck, CheckCircle, UserPlus, Timer, MessageSquare,
} from 'lucide-react'
import { toast } from 'sonner'
import { useCardActions } from './useCardActions'
import { CardWrapper } from './CardWrapper'
import { SkillChips } from './SkillChips'
import { useAuth } from '@/context/AuthContext'

const statusColors = {
  Applied: 'bg-blue-50 text-blue-700 ring-blue-200',
  'Under Review': 'bg-amber-50 text-amber-700 ring-amber-200',
  Shortlisted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'Interview Scheduled': 'bg-violet-50 text-violet-700 ring-violet-200',
  Rejected: 'bg-red-50 text-red-700 ring-red-200',
  Offered: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Hired: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
}

export function OpportunityCard({ item, index = 0 }) {
  const { user } = useAuth()
  const savedIds = useSelector((state) => state.saved.ids)
  const key = `${item.kind}:${item.id}`
  const saved = savedIds.includes(key)
  const initials = item.posterName
    ? item.posterName.split(' ').map((w) => w[0]).slice(0, 2).join('')
    : 'OP'

  const isClosed = item.status === 'closed' || item.status === 'expired' || item.deadline?.closed
  const isBoosted = item.isBoosted
  const applied = item.applied
  const appStatus = item.applicationStatus

  const peopleNeeded = item.peopleNeeded || 1
  const filledCount = item.filledCount || 0
  const isFullyFilled = filledCount >= peopleNeeded

  const verifiedTier = [item.isPhoneVerified, item.isEmailVerified, item.isIdVerified].filter(Boolean).length

  const budgetDisplay = item.budget
    ? item.budgetType === 'monthly'
      ? `₹${Number(item.budget).toLocaleString()}/mo`
      : `₹${Number(item.budget).toLocaleString()}`
    : null

  const { handleSave } = useCardActions('opportunity')

  return (
    <CardWrapper isClosed={isClosed || isFullyFilled} isBoosted={isBoosted} index={index}>
      {/* Row 1: Avatar + Poster Name + Verified | Bookmark */}
      <div className="flex items-start justify-between gap-3">
        <Link
          to={`/person/${item.posterId || item.poster?._id || item.poster}`}
          className="flex items-center gap-2.5 min-w-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className={`relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl text-xs font-bold text-white sm:size-10 sm:text-sm ${item.posterAvatarUrl ? '' : 'bg-gradient-to-br from-amber-500 to-orange-700'}`}>
            {item.posterAvatarUrl ? (
              <img src={item.posterAvatarUrl} alt="" className="size-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-xs font-semibold text-slate-600 sm:text-sm">{item.posterName}</span>
            {verifiedTier > 0 && (
              <span className="flex items-center gap-0.5">
                {item.isPhoneVerified && <CheckCircle className="size-3 text-emerald-500" />}
                {item.isIdVerified && <ShieldCheck className="size-3 text-blue-500" />}
                {item.isEmailVerified && !item.isPhoneVerified && <BadgeCheck className="size-3 text-violet-500" />}
              </span>
            )}
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

      {/* Row 2: Title + Type badge */}
      <div className="mt-2.5 sm:mt-3 flex items-start gap-2">
        <Link
          to={`/opportunity/${item._id || item.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex-1"
        >
          <h3 className="text-sm font-bold leading-snug text-slate-900 line-clamp-2 transition-colors group-hover:text-primary sm:text-base">
            {item.title}
          </h3>
        </Link>
        <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200 sm:px-2.5 sm:text-[11px]">
          {item.opportunityType || 'Project-based'}
        </span>
      </div>

      {/* Row 3: Poster name · Location · Mode chip */}
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-slate-500 sm:text-xs">
        <Link
          to={`/person/${item.posterId || item.poster?._id || item.poster}`}
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-slate-700 hover:text-primary"
        >
          {item.posterName || 'Unknown'}
        </Link>
        {item.location && (
          <>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1"><MapPin className="size-3 sm:size-3.5" /> {item.location}</span>
          </>
        )}
        <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold sm:text-[11px] ${
          item.mode === 'Remote' ? 'bg-sky-50 text-sky-600' :
          item.mode === 'Hybrid' ? 'bg-violet-50 text-violet-600' :
          'bg-amber-50 text-amber-600'
        }`}>{item.mode || 'Remote'}</span>
      </div>

      {/* Row 4: People needed · Duration · Budget */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-bold sm:text-[11px] ${
          isFullyFilled
            ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
            : filledCount > 0
              ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
              : 'bg-primary/10 text-primary ring-1 ring-primary/20'
        }`}>
          <Users className="size-3" />
          {isFullyFilled
            ? `${peopleNeeded} filled`
            : filledCount > 0
              ? `${filledCount}/${peopleNeeded} filled`
              : peopleNeeded === 1 ? '1 opening' : `${peopleNeeded} needed`
          }
        </span>
        {item.role && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
            {item.role}
          </span>
        )}
        {item.duration && (
          <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 sm:text-[11px]">
            <Timer className="size-3" /> {item.duration}
          </span>
        )}
        {budgetDisplay && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 sm:text-[11px]">
            <DollarSign className="size-3" /> {budgetDisplay}
          </span>
        )}
      </div>

      {/* Row 5: Trust signal + filled tracker */}
      {(verifiedTier > 0 || item.posterOpportunitiesCount > 0 || (filledCount > 0 && !isFullyFilled)) && (
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-400">
          {item.posterOpportunitiesCount > 0 && (
            <span>{item.posterOpportunitiesCount} past opportunities</span>
          )}
          {verifiedTier > 0 && (
            <span>Tier {verifiedTier}/3 verified</span>
          )}
          {!isFullyFilled && filledCount > 0 && (
            <span className="text-amber-600 font-medium">{peopleNeeded - filledCount} spots left</span>
          )}
        </div>
      )}

      {/* Row 6: Skills chips */}
      {item.skills?.length > 0 && (
        <div className="mt-2.5">
          <SkillChips skills={item.skills} maxToShow={4} />
        </div>
      )}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Row 7: Applicants + Deadline + Posted */}
      <div className="mt-3 flex items-center gap-3 border-t border-slate-100 pt-3 sm:mt-4 sm:pt-4">
        {item.applicantsCount > 0 ? (
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            <Eye className="size-3" /> {item.applicantsCount} applied
          </span>
        ) : (
          <span className="text-[11px] font-semibold text-emerald-600">Be the first</span>
        )}

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          {item.deadline && !isFullyFilled && (
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

      {/* Row 8: Action buttons */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {applied ? (
          <span className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold ring-1 sm:text-xs ${statusColors[appStatus] || statusColors.Applied}`}>
            {appStatus || 'Applied'}
          </span>
        ) : isFullyFilled || isClosed ? (
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-400 sm:px-4 sm:py-2 sm:text-xs">
            {isFullyFilled ? 'Filled' : 'Closed'}
          </span>
        ) : (
          <Link
            to={`/opportunity/${item._id || item.id}`}
            onClick={(e) => e.stopPropagation()}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all sm:px-4 sm:py-2 sm:text-xs ${
              isClosed
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-primary text-white hover:bg-primary/90 hover:shadow-sm active:scale-[0.97]'
            }`}
          >
            {isClosed ? 'Closed' : 'Express Interest'}
          </Link>
        )}

        <Link
          to={`/person/${item.posterId || item.poster?._id || item.poster}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5 sm:px-3 sm:py-2 sm:text-xs"
        >
          <UserPlus className="size-3 sm:size-3.5" />
          View Poster
        </Link>

        <Link
          to={`/opportunity/${item._id || item.id}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5 sm:px-3 sm:py-2 sm:text-xs"
        >
          <ExternalLink className="size-3 sm:size-3.5" />
          View Details
        </Link>

        <button
          onClick={() => {
            const posterId = item.posterId || item.poster?._id || item.poster
            if (!posterId) return
            // Default to student role for redirect (user will be redirected properly after login)
            const msgBase = user?.role === 'company' ? '/company/messages' : user?.role === 'agency' ? '/agency/messages' : '/dashboard/messages'
            const redirectUrl = `${msgBase}?userId=${posterId}`
            if (!user) { window.location.href = `/login?redirect=${encodeURIComponent(redirectUrl)}`; return }
            if (user.role === 'student' || user.role === 'company' || user.role === 'agency') {
              window.location.href = redirectUrl
            } else {
              toast.error('Messaging is only available for students, companies, and agencies')
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5 sm:px-3 sm:py-2 sm:text-xs"
        >
          <MessageSquare className="size-3 sm:size-3.5" />
          Message
        </button>
      </div>
    </CardWrapper>
  )
}

export function OpportunityCardSkeleton() {
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
        <div className="h-4 w-24 rounded bg-slate-200" />
        <div className="h-4 w-16 rounded bg-slate-200" />
        <div className="h-4 w-14 rounded bg-slate-200" />
      </div>
      <div className="mt-2 flex gap-1.5">
        <div className="h-5 w-20 rounded-md bg-slate-200" />
        <div className="h-5 w-16 rounded-md bg-slate-200" />
        <div className="h-5 w-14 rounded-md bg-slate-200" />
        <div className="h-5 w-20 rounded-md bg-slate-200" />
      </div>
      <div className="mt-2 flex gap-1">
        <div className="h-5 w-14 rounded-md bg-slate-200" />
        <div className="h-5 w-20 rounded-md bg-slate-200" />
        <div className="h-5 w-16 rounded-md bg-slate-200" />
      </div>
      <div className="mt-4 flex items-center gap-3 border-t border-slate-100 pt-4">
        <div className="h-4 w-16 rounded bg-slate-200" />
        <div className="flex flex-1 justify-end gap-2">
          <div className="h-4 w-20 rounded bg-slate-200" />
          <div className="h-4 w-16 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-7 w-24 rounded-lg bg-slate-200" />
        <div className="h-7 w-24 rounded-lg bg-slate-200" />
        <div className="h-7 w-24 rounded-lg bg-slate-200" />
      </div>
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  MapPin, Briefcase, GraduationCap, Building2, FileText,
  BadgeCheck, ShieldCheck, Clock, CircleDot, Sparkles,
  Star, MessageSquare, Send,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'

const statusColors = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  declined: 'bg-red-50 text-red-700 ring-red-200',
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  if (days < 30) return `${Math.floor(days / 7)}w ago`
  return `${Math.floor(days / 30)}mo ago`
}

export function CandidateCard({ candidate, index = 0, companyId, onUpdate, detailPath }) {
  const { user: authUser } = useAuth()
  const user = candidate.user || {}
  const name = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') || user.name || 'Unknown'
  const avatarLetter = name[0].toUpperCase()
  const hasResume = !!candidate.resumeUrl
  const isEmailVerified = user.isEmailVerified
  const isPhoneVerified = user.isPhoneVerified
  const isIdVerified = user.isIdVerified
  const skills = candidate.skills || []
  const expYears = candidate.totalExpYears || 0
  const expLabel = expYears === 0 ? 'Fresher' : `${expYears} yr${expYears > 1 ? 's' : ''}`
  const activeDays = candidate.lastActive ? timeAgo(candidate.lastActive) : ''
  const isActiveRecently = candidate.lastActive && (Date.now() - new Date(candidate.lastActive).getTime() < 7 * 86400000)

  const navigate = useNavigate()

  const handleShortlist = async () => {
    try {
      const res = await api.post(`/api/company/candidates/${user._id}/shortlist`, {})
      if (onUpdate) onUpdate({ ...candidate, shortlisted: res.shortlisted })
      toast.success(res.shortlisted ? 'Shortlisted' : 'Removed from shortlist')
    } catch (err) {
      toast.error(err.message || 'Failed')
    }
  }

  const handleMessage = () => {
    const msgBase = authUser?.role === 'company' ? '/company/messages' : authUser?.role === 'agency' ? '/agency/messages' : '/dashboard/messages'
    navigate(`${msgBase}?userId=${user._id}`)
  }

  const handleInvite = () => {
    navigate(`/company/candidates/invite/${user._id}`)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: (index || 0) * 0.04 }}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:shadow-lg hover:border-primary/30"
    >
      <div className="flex flex-1 flex-col p-4 sm:p-5">
        {/* Header / Top Row */}
        <div className="flex items-start gap-3">
           <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/10 text-sm font-bold text-primary sm:size-12">
            {candidate.profilePhoto ? (
              <img src={candidate.profilePhoto} alt="" className="size-full object-cover" />
            ) : (
              <span>{avatarLetter}</span>
            )}
            {candidate.openToWork && (
              <span className="absolute inset-0 rounded-full ring-2 ring-emerald-500 ring-offset-2 ring-offset-white" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-sm font-extrabold tracking-tight">{name}</h3>
              {candidate.openToWork && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                  <Sparkles className="size-2.5" /> Open to Work
                </span>
              )}
              {isEmailVerified && <BadgeCheck className="size-3.5 shrink-0 text-blue-500" />}
              {isPhoneVerified && <ShieldCheck className="size-3.5 shrink-0 text-violet-500" />}
            </div>
          </div>
        </div>

        {/* Headline */}
        {candidate.headline && (
          <p className="mt-2 text-xs font-semibold text-slate-700 leading-snug line-clamp-2">
            {candidate.headline}
          </p>
        )}

        {/* Key Info Strip */}
        <div className="mt-2.5 flex flex-wrap gap-x-3 gap-y-1.5 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1">
            <Briefcase className="size-3" /> {expLabel}
          </span>
          {candidate.currentLocation && (
            <span className="inline-flex items-center gap-1">
              <MapPin className="size-3" /> {candidate.currentLocation}
            </span>
          )}
          {candidate.openTo && (
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-1.5 py-0.5 font-semibold text-slate-600">
              Open to: {candidate.openTo === 'both' ? 'Job & Internship' : candidate.openTo === 'job' ? 'Job' : 'Internship'}
            </span>
          )}
          {candidate.relocate !== undefined && (
            <span className={`inline-flex items-center gap-1 font-semibold ${candidate.relocate ? 'text-emerald-600' : 'text-slate-400'}`}>
              <MapPin className="size-3" /> Relocate: {candidate.relocate ? 'Yes' : 'No'}
            </span>
          )}
        </div>

        {/* Notice period */}
        {candidate.noticePeriod && (
          <div className="mt-1.5 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Clock className="size-3" /> Notice: {candidate.noticePeriod}
            </span>
          </div>
        )}

        {/* Top Skills */}
        {skills.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1">
            {skills.slice(0, 5).map((s) => (
              <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600">
                {s}
              </span>
            ))}
            {skills.length > 5 && (
              <span className="rounded-md bg-slate-50 px-2 py-0.5 text-[10px] font-medium text-slate-400">
                +{skills.length - 5} more
              </span>
            )}
          </div>
        )}

        {/* Education / Current Role */}
        {(candidate.college || candidate.currentRole) && (
          <div className="mt-2.5 flex items-center gap-1.5 text-[11px] text-slate-600">
            {candidate.currentRole ? (
              <>
                <Building2 className="size-3 shrink-0 text-slate-400" />
                <span className="truncate">
                  {candidate.currentRole}{candidate.currentCompany ? ` at ${candidate.currentCompany}` : ''}
                </span>
              </>
            ) : candidate.college ? (
              <>
                <GraduationCap className="size-3 shrink-0 text-slate-400" />
                <span className="truncate">
                  {candidate.degree || ''}{candidate.degree && candidate.college ? ' — ' : ''}{candidate.college || ''}{candidate.year ? `, ${candidate.year}` : ''}
                </span>
              </>
            ) : null}
          </div>
        )}

        {/* Expected CTC */}
        {candidate.expectedCTC && (
          <div className="mt-1.5 text-[11px] text-slate-500">
            <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-0.5 font-semibold text-purple-700">
              {candidate.expectedCTC}
            </span>
          </div>
        )}

        {/* Resume + Activity Signal */}
        <div className="mt-2.5 flex items-center gap-2 flex-wrap">
          {hasResume && (
            <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700">
              <FileText className="size-2.5" /> Resume Attached
            </span>
          )}
          {candidate.isStale && (
            <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold text-amber-700">
              <Clock className="size-2.5" /> Inactive
            </span>
          )}
          {isActiveRecently ? (
            <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
              <CircleDot className="size-2.5" fill="currentColor" /> Actively Looking
            </span>
          ) : activeDays && !candidate.isStale ? (
            <span className="inline-flex items-center gap-1 text-[10px] text-slate-400">
              <Clock className="size-2.5" /> Active {activeDays}
            </span>
          ) : null}
        </div>

        {/* Spacer */}
        <div className="flex-1 min-h-3" />

        {/* State badges (if already invited/shortlisted) */}
        <div className="flex flex-wrap gap-1.5 mb-2">
          {candidate.invite && (
            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ring-1 ${statusColors[candidate.invite.status] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
              <Send className="size-2.5" /> Invited
              {candidate.invite.status !== 'pending' && ` (${candidate.invite.status})`}
            </span>
          )}
          {candidate.shortlisted && (
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700 ring-1 ring-blue-200">
              <Star className="size-2.5" fill="currentColor" /> Shortlisted
            </span>
          )}
        </div>

        {/* Recruiter Actions */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            to={`${detailPath || '/company/candidates'}/${user._id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5"
          >
            View Profile
          </Link>
          <button
            onClick={handleShortlist}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11px] font-bold transition-all ${
              candidate.shortlisted
                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                : 'border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50'
            }`}
          >
            <Star className="size-3" fill={candidate.shortlisted ? 'currentColor' : 'none'} />
            {candidate.shortlisted ? 'Saved' : 'Shortlist'}
          </button>
          <button
            onClick={handleMessage}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-600 transition-all hover:border-primary/30 hover:text-primary hover:bg-primary/5"
          >
            <MessageSquare className="size-3" />
            Message
          </button>
          {candidate.invite ? (
            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-[11px] font-bold text-slate-500">
              <Send className="size-3" /> Invited
            </span>
          ) : (
            <button
              onClick={handleInvite}
              className="inline-flex items-center gap-1 rounded-lg bg-primary px-2.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-primary/90 active:scale-[0.97]"
            >
              <Send className="size-3" />
              Invite
            </button>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export function CandidateCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-start gap-3">
        <div className="size-12 rounded-full bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-32 rounded bg-slate-200" />
          <div className="h-3 w-48 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-3 flex gap-3">
        <div className="h-3 w-16 rounded bg-slate-200" />
        <div className="h-3 w-24 rounded bg-slate-200" />
        <div className="h-3 w-20 rounded bg-slate-200" />
      </div>
      <div className="mt-3 flex gap-1">
        {[1, 2, 3, 4].map(i => <div key={i} className="h-5 w-16 rounded-md bg-slate-200" />)}
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-24 rounded-md bg-slate-200" />
        <div className="h-5 w-28 rounded-md bg-slate-200" />
      </div>
      <div className="mt-4 flex gap-2">
        <div className="h-7 w-24 rounded-lg bg-slate-200" />
        <div className="h-7 w-20 rounded-lg bg-slate-200" />
        <div className="h-7 w-20 rounded-lg bg-slate-200" />
        <div className="h-7 w-16 rounded-lg bg-slate-200" />
      </div>
    </div>
  )
}

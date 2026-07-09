import { useEffect, useState, useCallback } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MapPin, Briefcase, GraduationCap, Building2, FileText,
  BadgeCheck, ShieldCheck, Clock, CircleDot, Sparkles, Star,
  Mail, Phone, Globe, ExternalLink, CalendarDays, Send, BookOpen,
  Trophy, Award, Languages, Settings2, Flag, Eye, ChevronDown,
  ChevronUp, Edit3, Save, X, Plus, Link as LinkIcon, Github,
  CheckCircle, AlertTriangle, MessageSquare, UserCheck, Lock, Video,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Expert']

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

function InfoPill({ icon, label, value, className }) {
  if (!value && value !== false) return null
  return (
    <div className={`flex items-start gap-2.5 text-sm ${className || ''}`}>
      <span className="mt-0.5 shrink-0 text-slate-400">{icon}</span>
      <div>
        <p className="text-xs text-slate-500">{label}</p>
        <p className="font-medium text-slate-800">{value}</p>
      </div>
    </div>
  )
}

function Section({ title, icon, children, defaultOpen = true, extra }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-slate-500">{icon}</span>
          <h2 className="text-base font-extrabold tracking-tight">{title}</h2>
        </div>
        <div className="flex items-center gap-2">
          {extra}
          {open ? <ChevronUp className="size-4 text-slate-400" /> : <ChevronDown className="size-4 text-slate-400" />}
        </div>
      </button>
      {open && <div className="px-6 pb-6 border-t border-slate-100">{children}</div>}
    </div>
  )
}

export default function CandidateDetail() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [c, setC] = useState(null)
  const [loading, setLoading] = useState(true)
  const [noteOpen, setNoteOpen] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [noteTags, setNoteTags] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('')

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get(`/api/company/candidates/${userId}`)
      setC(data.candidate)
      if (data.candidate.myNote) {
        setNoteText(data.candidate.myNote.content || '')
        setNoteTags((data.candidate.myNote.tags || []).join(', '))
      }
    } catch (err) {
      toast.error(err.message || 'Failed to load profile')
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => { fetchProfile() }, [fetchProfile])

  const handleShortlist = async () => {
    try {
      const res = await api.post(`/api/company/candidates/${userId}/shortlist`, {})
      setC(p => ({ ...p, shortlisted: res.shortlisted }))
      toast.success(res.shortlisted ? 'Shortlisted' : 'Removed from shortlist')
    } catch (err) { toast.error(err.message || 'Failed') }
  }

  const handleSaveNote = async () => {
    setSavingNote(true)
    try {
      const tags = noteTags.split(',').map(t => t.trim()).filter(Boolean)
      const res = await api.put(`/api/company/candidates/${userId}/note`, { content: noteText, tags })
      setC(p => ({ ...p, myNote: res.note }))
      toast.success('Note saved')
      setNoteOpen(false)
    } catch (err) { toast.error(err.message || 'Failed') }
    finally { setSavingNote(false) }
  }

  const handleReport = async () => {
    if (!reportReason) return toast.error('Select a reason')
    try {
      await api.post(`/api/company/candidates/${userId}/report`, { reason: reportReason, description: '' })
      toast.success('Report submitted')
      setReportOpen(false)
    } catch (err) { toast.error(err.message || 'Failed') }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <div className="mx-auto max-w-4xl px-4 py-10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="mb-6 h-32 animate-pulse rounded-2xl bg-slate-100" />
          ))}
        </div>
      </div>
    )
  }

  if (!c) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto size-10 text-slate-300" />
          <p className="mt-3 text-slate-500">Candidate not found or no longer open to work.</p>
          <Link to="/company/candidates" className="mt-4 inline-block text-sm font-semibold text-primary">Back to candidates</Link>
        </div>
      </div>
    )
  }

  const user = c.user || {}
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ') || user.name || 'Unknown'
  const avatarLetter = name[0].toUpperCase()
  const skills = c.skills || []
  const exp = c.experience || []
  const edu = c.education || []
  const projects = c.projects || []
  const certs = c.certifications || []
  const achievements = c.achievements || []
  const langs = c.languages || []
  const jp = c.jobPreferences || {}
  const activeDays = c.lastActive ? timeAgo(c.lastActive) : ''
  const isActiveRecently = c.lastActive && (Date.now() - new Date(c.lastActive).getTime() < 7 * 86400000)
  const hasResume = !!c.resumeUrl
  const verifiedCount = [user.isEmailVerified, user.isPhoneVerified, user.isIdVerified].filter(Boolean).length

  const profileFields = {
    'Name': !!name, 'Headline': !!c.headline, 'Bio': !!c.bio,
    'Skills': skills.length > 0, 'Experience': exp.length > 0,
    'Projects': projects.length > 0, 'Education': edu.length > 0,
    'Certifications': certs.length > 0, 'Resume': hasResume,
  }
  const completed = Object.values(profileFields).filter(Boolean).length
  const total = Object.keys(profileFields).length
  const profilePct = Math.round((completed / total) * 100)

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-6 sm:px-6 sm:py-8">
        {/* Back + Actions Bar */}
        <div className="flex items-center justify-between flex-wrap gap-2">
          <Link to="/company/candidates" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
            <ArrowLeft className="size-4" /> Candidates
          </Link>
          <div className="flex items-center gap-1.5">
            <button onClick={() => setReportOpen(true)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-semibold text-slate-500 hover:border-red-200 hover:text-red-600">
              <Flag className="size-3" /> Report
            </button>
          </div>
        </div>

        {/* ────── 1. HEADER / TOP SECTION ────── */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          {/* Cover banner placeholder */}
          <div className="h-24 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 sm:h-32" />
          <div className="relative px-6 pb-6">
            <div className="relative -mt-14 flex flex-col items-center text-center sm:flex-row sm:text-left sm:items-end sm:gap-6">
              <div className="relative grid size-20 shrink-0 place-items-center overflow-hidden rounded-2xl border-4 border-white bg-gradient-to-br from-primary/20 to-primary/10 text-2xl font-bold text-primary shadow-md sm:size-24 sm:text-3xl">
                <span>{avatarLetter}</span>
                {c.openToWork && (
                  <span className="absolute -bottom-1 -right-1 grid size-5 place-items-center rounded-full border-[3px] border-white bg-emerald-500 shadow-sm">
                    <CircleDot className="size-3 text-white" fill="white" />
                  </span>
                )}
              </div>
              <div className="mt-2 sm:mt-0 sm:flex-1">
                <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <h1 className="text-xl font-extrabold tracking-tight sm:text-2xl">{name}</h1>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 ring-1 ring-emerald-200">
                    <Sparkles className="size-3" /> Open to Work
                  </span>
                  {/* Verified badges */}
                  {user.isEmailVerified && <BadgeCheck className="size-4 text-blue-500" title="Email verified" />}
                  {user.isPhoneVerified && <ShieldCheck className="size-4 text-violet-500" title="Phone verified" />}
                  {user.isIdVerified && <CheckCircle className="size-4 text-emerald-500" title="ID verified" />}
                </div>
                {c.headline && <p className="mt-0.5 text-sm text-slate-600">{c.headline}</p>}
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  {c.currentLocation && (
                    <span className="inline-flex items-center gap-1 text-xs text-slate-500">
                      <MapPin className="size-3" /> {c.currentLocation}
                    </span>
                  )}
                  {c.relocate !== undefined && (
                    <span className={`text-xs font-semibold ${c.relocate ? 'text-emerald-600' : 'text-slate-400'}`}>
                      {c.relocate ? 'Willing to relocate' : 'Not looking to relocate'}
                    </span>
                  )}
                  {isActiveRecently && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CircleDot className="size-2.5" fill="currentColor" /> Actively Looking
                    </span>
                  )}
                  {activeDays && !isActiveRecently && (
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400"><Clock className="size-2.5" /> Active {activeDays}</span>
                  )}
                  {c.isStale && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 ring-1 ring-amber-200">
                      <Clock className="size-2.5" /> Inactive &gt;90d
                    </span>
                  )}
                  {c.contactRevealed ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      <CheckCircle className="size-2.5" /> Contact Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                      <Lock className="size-2.5" /> Contact Hidden
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Resume + Actions */}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
              {hasResume ? (
                <a href={c.resumeUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-primary/30 hover:text-primary transition-all">
                  <FileText className="size-3.5" /> View Resume
                </a>
              ) : (
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50 px-4 py-2 text-xs font-semibold text-slate-400">
                  <FileText className="size-3.5" /> No Resume
                </span>
              )}
              <Button onClick={handleShortlist} variant={c.shortlisted ? 'default' : 'outline'}
                className={`rounded-xl text-xs ${c.shortlisted ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200'}`}>
                <Star className="size-3.5" fill={c.shortlisted ? 'currentColor' : 'none'} />
                {c.shortlisted ? 'Shortlisted' : 'Shortlist'}
              </Button>
              <Link to={`/company/messages?userId=${userId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:border-primary/30 hover:text-primary transition-all">
                <MessageSquare className="size-3.5" /> Message
              </Link>
              <Link to={`/company/candidates/invite/${userId}`}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-all">
                <Send className="size-3.5" /> Invite to Apply
              </Link>
            </div>
          </div>
        </div>

        {/* ────── 2. QUICK INFO STRIP ────── */}
        <div className="rounded-2xl border border-slate-200 bg-white px-6 py-4">
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-4">
            <InfoPill icon={<Briefcase className="size-4" />} label="Experience" value={exp.length > 0 ? `${exp.length} yr${exp.length > 1 ? 's' : ''}` : 'Fresher'} />
            <InfoPill icon={<Sparkles className="size-4" />} label="Open to" value={c.openTo === 'both' ? 'Jobs & Internships' : c.openTo === 'job' ? 'Jobs' : 'Internships'} />
            <InfoPill icon={<Building2 className="size-4" />} label="Employment type" value={jp.preferredEmploymentType || 'Any'} />
            <InfoPill icon={<Globe className="size-4" />} label="Work mode" value={jp.preferredWorkMode || 'Any'} />
            <InfoPill icon={<Clock className="size-4" />} label="Notice period" value={c.noticePeriod || '—'} />
            <InfoPill icon={<MapPin className="size-4" />} label="Location" value={c.currentLocation || '—'} />
            <InfoPill icon={<Globe className="size-4" />} label="Expected CTC" value={c.expectedCTC || 'Negotiable'} />
            <InfoPill icon={<GraduationCap className="size-4" />} label="Profile completion" value={`${profilePct}%`} />
          </div>
        </div>

        {/* ────── 3. ABOUT / SUMMARY ────── */}
        {c.bio && (
          <Section title="About" icon={<Edit3 className="size-4" />}>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 whitespace-pre-line">{c.bio}</p>
          </Section>
        )}

        {/* ────── 3b. VIDEO INTRO ────── */}
        {c.videoUrl && (
          <Section title="Video Intro" icon={<Video className="size-4" />}>
            <div className="mt-3 aspect-video overflow-hidden rounded-xl bg-slate-100">
              <iframe
                src={c.videoUrl.includes('youtube') || c.videoUrl.includes('youtu.be')
                  ? c.videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')
                  : c.videoUrl}
                className="size-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video intro"
              />
            </div>
          </Section>
        )}

        {/* ────── 4. SKILLS ────── */}
        <Section title={`Skills (${skills.length})`} icon={<BookOpen className="size-4" />}>
          <div className="mt-3 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s} className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary ring-1 ring-primary/20">
                {s}
              </span>
            ))}
          </div>
        </Section>

        {/* ────── 5. WORK EXPERIENCE ────── */}
        <Section title={`Experience (${exp.length})`} icon={<Briefcase className="size-4" />}>
          <div className="mt-3 space-y-4">
            {exp.length === 0 && <p className="text-sm text-slate-400">No experience listed.</p>}
            {exp.map((e, i) => (
              <div key={i} className="relative pl-5 border-l-2 border-slate-200 pb-4 last:pb-0">
                <div className="absolute -left-[9px] top-0.5 size-4 rounded-full border-2 border-slate-300 bg-white" />
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-bold">{e.role}</h4>
                    <p className="text-xs font-semibold text-slate-600">{e.company}{e.location ? ` · ${e.location}` : ''}</p>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400">
                    {new Date(e.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    {' — '}{e.current ? 'Present' : e.endDate ? new Date(e.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : ''}
                  </span>
                </div>
                {e.description && <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{e.description}</p>}
                {e.current && <span className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">Currently working here</span>}
              </div>
            ))}
          </div>
        </Section>

        {/* ────── 6. EDUCATION ────── */}
        <Section title={`Education (${edu.length})`} icon={<GraduationCap className="size-4" />}>
          <div className="mt-3 space-y-4">
            {edu.length === 0 && <p className="text-sm text-slate-400">No education listed.</p>}
            {edu.map((e, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
                <GraduationCap className="mt-0.5 size-4 shrink-0 text-slate-400" />
                <div>
                  <p className="text-sm font-bold">{e.degree || ''}{e.fieldOfStudy ? ` in ${e.fieldOfStudy}` : ''}</p>
                  <p className="text-xs text-slate-600">{e.college || ''}</p>
                  <div className="mt-1 flex gap-3 text-[11px] text-slate-400">
                    {e.startYear && <span>{e.startYear}{e.endYear ? ` — ${e.endYear}` : ''}</span>}
                    {c.cgpa && <span>CGPA: {c.cgpa}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ────── 7. PROJECTS ────── */}
        <Section title={`Projects (${projects.length})`} icon={<Award className="size-4" />}>
          <div className="mt-3 space-y-4">
            {projects.length === 0 && <p className="text-sm text-slate-400">No projects listed.</p>}
            {projects.map((p, i) => (
              <div key={i} className="rounded-xl border border-slate-200 p-4 hover:border-primary/20 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-bold">{p.title}</h4>
                  <div className="flex gap-1.5 shrink-0">
                    {p.githubLink && (
                      <a href={p.githubLink} target="_blank" rel="noopener noreferrer" className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-slate-400 hover:text-slate-600">
                        <Github className="size-3.5" />
                      </a>
                    )}
                    {p.link && (
                      <a href={p.link} target="_blank" rel="noopener noreferrer" className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-primary/30 hover:text-primary">
                        <ExternalLink className="size-3.5" />
                      </a>
                    )}
                  </div>
                </div>
                {p.description && <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{p.description}</p>}
                {(p.techStack || []).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {p.techStack.map(t => (
                      <span key={t} className="rounded-md bg-primary/5 px-2 py-0.5 text-[10px] font-medium text-primary">{t}</span>
                    ))}
                  </div>
                )}
                {p.startDate && (
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    {new Date(p.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                    {p.endDate ? ` — ${new Date(p.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}` : p.current ? ' — Present' : ''}
                  </p>
                )}
              </div>
            ))}
          </div>
        </Section>

        {/* ────── 8. CERTIFICATIONS ────── */}
        <Section title={`Certifications (${certs.length})`} icon={<Award className="size-4" />}>
          <div className="mt-3 space-y-3">
            {certs.length === 0 && <p className="text-sm text-slate-400">No certifications listed.</p>}
            {certs.map((cert, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 p-4">
                <CheckCircle className="mt-0.5 size-4 shrink-0 text-emerald-500" />
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold">{cert.name}</p>
                      {cert.issuingBody && <p className="text-xs text-slate-500">{cert.issuingBody}</p>}
                    </div>
                    {cert.date && <span className="text-[11px] text-slate-400">{new Date(cert.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                  </div>
                  <div className="mt-1 flex gap-3">
                    {cert.credentialId && <span className="text-[10px] text-slate-400">ID: {cert.credentialId}</span>}
                    {cert.credentialLink && (
                      <a href={cert.credentialLink} target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold text-primary hover:underline">Show credential</a>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ────── 9. ACHIEVEMENTS ────── */}
        {achievements.length > 0 && (
          <Section title={`Achievements (${achievements.length})`} icon={<Trophy className="size-4" />}>
            <div className="mt-3 space-y-3">
              {achievements.map((a, i) => (
                <div key={i} className="flex items-start gap-3 rounded-xl bg-amber-50/50 border border-amber-100 p-4">
                  <Trophy className="mt-0.5 size-4 shrink-0 text-amber-500" />
                  <div>
                    <p className="text-sm font-bold">{a.title}</p>
                    {a.description && <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>}
                    <div className="mt-1 flex gap-2 text-[10px] text-slate-400">
                      {a.type && <span className="rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700 capitalize">{a.type}</span>}
                      {a.date && <span>{new Date(a.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ────── 10. PORTFOLIO & LINKS ────── */}
        {(c.linkedin || c.github || c.portfolio) && (
          <Section title="Links" icon={<LinkIcon className="size-4" />}>
            <div className="mt-3 flex flex-wrap gap-3">
              {c.linkedin && (
                <a href={c.linkedin} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all">
                  <ExternalLink className="size-3.5" /> LinkedIn
                </a>
              )}
              {c.github && (
                <a href={c.github} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-slate-400 hover:text-slate-800 hover:bg-slate-50 transition-all">
                  <Github className="size-3.5" /> GitHub
                </a>
              )}
              {c.portfolio && (
                <a href={c.portfolio} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:border-primary/30 hover:text-primary hover:bg-primary/5 transition-all">
                  <Globe className="size-3.5" /> Portfolio
                </a>
              )}
            </div>
          </Section>
        )}

        {/* ────── 11. LANGUAGES ────── */}
        {langs.length > 0 && (
          <Section title={`Languages (${langs.length})`} icon={<Languages className="size-4" />}>
            <div className="mt-3 flex flex-wrap gap-3">
              {langs.map((l, i) => (
                <div key={i} className="rounded-xl border border-slate-200 px-4 py-2.5 text-center min-w-[100px]">
                  <p className="text-sm font-bold">{l.language}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{l.proficiency}</p>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ────── 12. RESUME SECTION ────── */}
        <Section title="Resume" icon={<FileText className="size-4" />}>
          <div className="mt-3 flex items-center gap-4">
            {hasResume ? (
              <>
                <a href={c.resumeUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-3 text-sm font-bold text-primary hover:bg-primary/20 transition-all">
                  <FileText className="size-4" /> Download Resume
                </a>
                <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold">
                  <CheckCircle className="size-3" /> Attached
                </span>
              </>
            ) : (
              <p className="text-sm text-slate-400">No resume uploaded.</p>
            )}
          </div>
        </Section>

        {/* ────── 13. JOB PREFERENCES ────── */}
        {(jp.preferredRoles?.length > 0 || jp.preferredLocations?.length > 0 || jp.preferredCompanyType || jp.preferredIndustries?.length > 0) && (
          <Section title="Job Preferences" icon={<Settings2 className="size-4" />}>
            <div className="mt-3 grid gap-4 sm:grid-cols-2">
              {jp.preferredRoles?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Preferred Roles</p>
                  <div className="flex flex-wrap gap-1.5">
                    {jp.preferredRoles.map(r => <span key={r} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{r}</span>)}
                  </div>
                </div>
              )}
              {jp.preferredLocations?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Preferred Locations</p>
                  <div className="flex flex-wrap gap-1.5">
                    {jp.preferredLocations.map(l => <span key={l} className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">{l}</span>)}
                  </div>
                </div>
              )}
              {jp.preferredCompanyType && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">Company Type</p>
                  <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700 capitalize">{jp.preferredCompanyType}</span>
                </div>
              )}
              {jp.preferredIndustries?.length > 0 && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">Preferred Industries</p>
                  <div className="flex flex-wrap gap-1.5">
                    {jp.preferredIndustries.map(ind => <span key={ind} className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">{ind}</span>)}
                  </div>
                </div>
              )}
            </div>
          </Section>
        )}

        {/* ────── 14. TRUST & ACTIVITY ────── */}
        <Section title="Trust & Activity" icon={<ShieldCheck className="size-4" />}>
          <div className="mt-3 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-500">Profile Strength</span>
                <span className="text-sm font-extrabold text-primary">{profilePct}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${profilePct}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {Object.entries(profileFields).map(([label, done]) => (
                  <span key={label} className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {done ? '✓' : '○'} {label}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <BadgeCheck className="size-3.5 text-blue-500" />
                Email: {user.isEmailVerified ? <span className="font-semibold text-emerald-600">Verified</span> : <span className="text-slate-400">Not verified</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="size-3.5 text-violet-500" />
                Phone: {user.isPhoneVerified ? <span className="font-semibold text-emerald-600">Verified</span> : <span className="text-slate-400">Not verified</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle className="size-3.5 text-emerald-500" />
                ID: {user.isIdVerified ? <span className="font-semibold text-emerald-600">Verified</span> : <span className="text-slate-400">Not verified</span>}
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="size-3.5 text-slate-400" />
                Last active: {activeDays || 'Unknown'}
              </div>
              {c.isStale && (
                <div className="flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5 text-amber-500" />
                  <span className="font-semibold text-amber-600">Inactive &gt;90 days</span>
                </div>
              )}
            </div>

            {/* Link Verification */}
            <div className="border-t border-slate-100 pt-3">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Link Verification</p>
              <div className="flex flex-wrap gap-3 text-xs">
                {c.linkedin && (
                  <span className={`inline-flex items-center gap-1 ${c.linksVerified?.linkedin ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <ExternalLink className="size-3" /> LinkedIn {c.linksVerified?.linkedin ? '✓ Verified' : '— Unchecked'}
                  </span>
                )}
                {c.github && (
                  <span className={`inline-flex items-center gap-1 ${c.linksVerified?.github ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <Github className="size-3" /> GitHub {c.linksVerified?.github ? '✓ Verified' : '— Unchecked'}
                  </span>
                )}
                {c.portfolio && (
                  <span className={`inline-flex items-center gap-1 ${c.linksVerified?.portfolio ? 'text-emerald-600' : 'text-slate-400'}`}>
                    <Globe className="size-3" /> Portfolio {c.linksVerified?.portfolio ? '✓ Verified' : '— Unchecked'}
                  </span>
                )}
                {!c.linkedin && !c.github && !c.portfolio && (
                  <span className="text-slate-400">No links to verify</span>
                )}
              </div>
            </div>
          </div>
        </Section>

        {/* ────── 15. RECRUITER-ONLY TOOLS ────── */}
        <Section title="Recruiter Tools" icon={<UserCheck className="size-4" />} defaultOpen={false}>
          <div className="mt-3 space-y-4">
            {/* Private Notes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-bold">Private Notes</p>
                <button onClick={() => setNoteOpen(!noteOpen)}
                  className="text-xs font-semibold text-primary hover:underline">
                  {noteOpen ? 'Cancel' : c.myNote ? 'Edit' : 'Add note'}
                </button>
              </div>
              {c.myNote && !noteOpen && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <p className="text-sm text-slate-700">{c.myNote.content}</p>
                  {c.myNote.tags?.length > 0 && (
                    <div className="mt-2 flex gap-1">
                      {c.myNote.tags.map(t => <span key={t} className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">{t}</span>)}
                    </div>
                  )}
                </div>
              )}
              {noteOpen && (
                <div className="space-y-2">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Private notes about this candidate..."
                    rows={3}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <input
                    value={noteTags}
                    onChange={e => setNoteTags(e.target.value)}
                    placeholder="Tags: frontend, senior, react (comma-separated)"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <div className="flex gap-2">
                    <Button onClick={handleSaveNote} disabled={savingNote} className="rounded-lg bg-primary px-4 py-1 text-xs font-bold text-white">
                      {savingNote ? 'Saving...' : 'Save Note'}
                    </Button>
                    <Button onClick={() => { setNoteOpen(false); setNoteText(c.myNote?.content || ''); setNoteTags((c.myNote?.tags || []).join(', ')) }}
                      variant="outline" className="rounded-lg border-slate-200 px-4 py-1 text-xs font-bold">
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
              <Button onClick={handleShortlist} variant={c.shortlisted ? 'default' : 'outline'}
                className="rounded-xl text-xs">
                <Star className="size-3.5" fill={c.shortlisted ? 'currentColor' : 'none'} />
                {c.shortlisted ? 'Shortlisted' : 'Shortlist'}
              </Button>
              <Link to={`/company/candidates/invite/${userId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-primary hover:text-white transition-all">
                <Send className="size-3.5" /> Invite to Apply
              </Link>
              <Link to={`/company/messages?userId=${userId}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-primary hover:text-white transition-all">
                <MessageSquare className="size-3.5" /> Message
              </Link>
            </div>

            {/* Invite history */}
            {c.invite && (
              <div className="rounded-xl border border-slate-200 p-3 bg-slate-50">
                <div className="flex items-center gap-2 text-xs">
                  <Send className="size-3.5 text-slate-400" />
                  <span className="font-semibold">Invited</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    c.invite.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                    c.invite.status === 'declined' ? 'bg-red-50 text-red-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>{c.invite.status}</span>
                  <span className="text-slate-400">· {c.invite.createdAt ? new Date(c.invite.createdAt).toLocaleDateString() : ''}</span>
                </div>
                {c.invite.posting && <p className="mt-1 text-[11px] text-slate-500">Posting: {c.invite.posting.title || c.invite.posting}</p>}
              </div>
            )}
          </div>
        </Section>

        {/* ────── 16. REPORT MODAL ────── */}
        {reportOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={() => setReportOpen(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl mx-4" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold flex items-center gap-2"><Flag className="size-4 text-red-500" /> Report Profile</h3>
              <p className="mt-1 text-sm text-slate-500">Why are you reporting this candidate?</p>
              <select
                value={reportReason}
                onChange={e => setReportReason(e.target.value)}
                className="mt-4 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="">Select a reason...</option>
                <option value="fake_profile">Fake/Spam Profile</option>
                <option value="inappropriate">Inappropriate Content</option>
                <option value="wrong_info">Misleading Information</option>
                <option value="duplicate">Duplicate Profile</option>
                <option value="other">Other</option>
              </select>
              <div className="mt-5 flex gap-3 justify-end">
                <Button onClick={() => setReportOpen(false)} variant="outline" className="rounded-xl border-slate-200">Cancel</Button>
                <Button onClick={handleReport} disabled={!reportReason} className="rounded-xl bg-red-600 text-white hover:bg-red-700">Submit Report</Button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

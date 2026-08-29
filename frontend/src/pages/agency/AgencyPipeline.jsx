import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Users, Eye, MessageSquare, X, Check, FileText, Star, Briefcase, ArrowLeft, ChevronDown, Clock, Target, Zap, UserCheck, Ban, Sparkles, SendHorizonal, PhoneCall } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { cn } from '@/lib/utils'

const STAGES = [
  { id: 'new', label: 'New', dot: 'bg-blue-500', icon: Plus, lightBg: 'bg-blue-50', lightText: 'text-blue-600', border: 'border-l-blue-500' },
  { id: 'reviewed', label: 'Under Review', dot: 'bg-amber-500', icon: Eye, lightBg: 'bg-amber-50', lightText: 'text-amber-600', border: 'border-l-amber-500' },
  { id: 'shortlisted', label: 'Shortlisted', dot: 'bg-violet-500', icon: Star, lightBg: 'bg-violet-50', lightText: 'text-violet-600', border: 'border-l-violet-500' },
  { id: 'interview', label: 'Interview', dot: 'bg-indigo-500', icon: PhoneCall, lightBg: 'bg-indigo-50', lightText: 'text-indigo-600', border: 'border-l-indigo-500' },
  { id: 'offer', label: 'Offer Sent', dot: 'bg-emerald-500', icon: SendHorizonal, lightBg: 'bg-emerald-50', lightText: 'text-emerald-600', border: 'border-l-emerald-500' },
  { id: 'hired', label: 'Hired', dot: 'bg-teal-500', icon: UserCheck, lightBg: 'bg-teal-50', lightText: 'text-teal-600', border: 'border-l-teal-500' },
  { id: 'rejected', label: 'Rejected', dot: 'bg-rose-500', icon: Ban, lightBg: 'bg-rose-50', lightText: 'text-rose-600', border: 'border-l-rose-500' },
]

const calcMatchScore = (candidateSkills, postingSkills) => {
  if (!postingSkills?.length || !candidateSkills?.length) return null
  const match = postingSkills.filter(s => candidateSkills.some(cs => cs.toLowerCase() === s.toLowerCase())).length
  return Math.round((match / postingSkills.length) * 100)
}

function SortableCandidate({ candidate, postingSkills, moveToStage }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: candidate._id,
    data: { stageId: candidate.stage },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const matchScore = calcMatchScore((candidate.applicant?.skills || candidate.skills) || [], postingSkills || [])
  const initials = (candidate.applicant?.name || candidate.name || 'A').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const getAvatarColors = (name) => {
    const colors = ['bg-blue-500', 'bg-violet-500', 'bg-emerald-500', 'bg-amber-500', 'bg-rose-500', 'bg-cyan-500']
    let hash = 0
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return colors[Math.abs(hash) % colors.length]
  }
  const avatarColor = getAvatarColors(candidate.applicant?.name || candidate.name)

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative rounded-xl border bg-white p-4 shadow-sm transition-all cursor-grab active:cursor-grabbing group',
        isDragging ? 'shadow-xl scale-[1.02] ring-2 ring-primary/30 z-50' : 'hover:shadow-md hover:border-slate-300',
        candidate.stage === 'rejected' ? 'border-slate-100 opacity-75' : 'border-slate-200'
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div className="relative shrink-0">
          <div className={cn('grid size-10 place-items-center rounded-lg text-sm font-bold text-white shadow-sm', avatarColor)}>
            {initials}
          </div>
          {candidate.stage !== 'rejected' && (
            <div className="absolute -bottom-1 -right-1 size-3 rounded-full bg-emerald-400 border-2 border-white" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold text-slate-800 truncate leading-tight">
            {candidate.applicant?.name || candidate.name || 'Unknown'}
          </p>
          <p className="text-xs text-slate-400 truncate mt-0.5">
            {candidate.applicant?.email || candidate.email || candidate.role || ''}
          </p>
          {candidate.company && (
            <p className="text-xs text-slate-400 truncate mt-0.5 flex items-center gap-1">
              <Briefcase className="size-3" />
              {candidate.company}
            </p>
          )}
        </div>
      </div>

      {candidate.skills?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2.5">
          {candidate.skills.slice(0, 3).map(skill => (
            <span key={skill} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
              {skill}
            </span>
          ))}
          {candidate.skills.length > 3 && (
            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
              +{candidate.skills.length - 3} more
            </span>
          )}
        </div>
      )}

      {matchScore !== null && (
        <div className="mb-2.5">
          <div className="flex items-center justify-between mb-1">
            <span className={cn('inline-flex items-center gap-1 text-xs font-semibold', matchScore >= 80 ? 'text-emerald-600' : matchScore >= 50 ? 'text-amber-600' : 'text-slate-400')}>
              <Target className="size-3" /> Match
            </span>
            <span className={cn('text-xs font-bold', matchScore >= 80 ? 'text-emerald-600' : matchScore >= 50 ? 'text-amber-600' : 'text-slate-400')}>{matchScore}%</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${matchScore}%` }}
              transition={{ duration: 0.6 }}
              className={cn('h-full rounded-full', matchScore >= 80 ? 'bg-emerald-500' : matchScore >= 50 ? 'bg-amber-500' : 'bg-slate-300')}
            />
          </div>
        </div>
      )}

      {candidate.proposal && (
        <div className="mb-2.5 rounded-lg bg-amber-50 border border-amber-100 p-2.5">
          <p className="text-xs text-amber-800 line-clamp-2 leading-relaxed">{candidate.proposal}</p>
        </div>
      )}

      {candidate.quoteAmount && (
        <div className="mb-2.5 inline-flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
          <FileText className="size-3.5" />
          ₹{candidate.quoteAmount.toLocaleString()}
        </div>
      )}

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <AnimatePresence mode="popLayout">
          {candidate.stage !== 'shortlisted' && candidate.stage !== 'interview' && candidate.stage !== 'offer' && candidate.stage !== 'hired' && candidate.stage !== 'rejected' && (
            <motion.button key="shortlist" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => moveToStage && moveToStage(candidate._id, 'shortlisted')}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors">
              <Star className="size-3" /> Shortlist
            </motion.button>
          )}
          {candidate.stage !== 'rejected' && (
            <motion.button key="reject" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => moveToStage && moveToStage(candidate._id, 'rejected')}
              className="inline-flex items-center gap-1 rounded-lg bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition-colors">
              <Ban className="size-3" /> Reject
            </motion.button>
          )}
          {candidate.stage === 'shortlisted' && (
            <motion.button key="interview" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => moveToStage && moveToStage(candidate._id, 'interview')}
              className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1 text-xs font-semibold text-violet-600 hover:bg-violet-100 transition-colors">
              <PhoneCall className="size-3" /> Interview
            </motion.button>
          )}
          {candidate.stage === 'interview' && (
            <motion.button key="offer" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => moveToStage && moveToStage(candidate._id, 'offer')}
              className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 transition-colors">
              <SendHorizonal className="size-3" /> Offer
            </motion.button>
          )}
          {candidate.stage === 'offer' && (
            <motion.button key="hire" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
              onClick={() => moveToStage && moveToStage(candidate._id, 'hired')}
              className="inline-flex items-center gap-1 rounded-lg bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-600 hover:bg-teal-100 transition-colors">
              <UserCheck className="size-3" /> Hire
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-slate-100">
        <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
          <Clock className="size-3" />
          {new Date(candidate.appliedAt || candidate.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </span>
        <div className="flex gap-0.5">
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors" title="View profile">
            <Eye className="size-3.5" />
          </button>
          <button className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors" title="Message">
            <MessageSquare className="size-3.5" />
          </button>
        </div>
      </div>
    </motion.div>
  )
}

function PipelineColumn({ stage, candidates, postingSkills, moveToStage }) {
  return (
    <div className={'flex shrink-0 w-72 flex-col rounded-2xl border border-slate-200 bg-white shadow-sm border-l-4 ' + stage.border}>
      <div className="px-4 pt-3.5 pb-3 border-b border-slate-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className={cn('p-1.5 rounded-lg', stage.lightBg, stage.lightText)}>
              <stage.icon className="size-4" />
            </div>
            <span className="text-sm font-bold text-slate-800">{stage.label}</span>
          </div>
          <span className={cn('rounded-full px-2.5 py-1 text-xs font-bold', stage.lightBg, stage.lightText)}>
            {candidates.length}
          </span>
        </div>
      </div>

      <div className="flex-1 space-y-2.5 p-3 overflow-y-auto max-h-[calc(100vh-320px)] min-h-[200px]">
        <SortableContext items={candidates.map(c => c._id)} strategy={verticalListSortingStrategy}>
          <AnimatePresence mode="popLayout">
            {candidates.map(candidate => (
              <SortableCandidate key={candidate._id} candidate={candidate} postingSkills={postingSkills} moveToStage={moveToStage} />
            ))}
          </AnimatePresence>
        </SortableContext>
        {candidates.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
            <div className={cn('mb-3 size-10 rounded-xl flex items-center justify-center', stage.lightBg, stage.lightText)}>
              <stage.icon className="size-5" />
            </div>
            <p className="text-xs text-slate-400 font-medium">Drop candidates here</p>
          </div>
        )}
      </div>

      {candidates.length > 0 && (
        <div className="px-4 py-2 border-t border-slate-100">
          <div className="flex items-center justify-center gap-1.5">
            <div className="flex -space-x-1.5">
              {candidates.slice(0, 4).map((c) => (
                <div key={c._id} className={cn('size-5 rounded-full border-2 border-white flex items-center justify-center text-[8px] font-bold shadow-sm', stage.lightBg, stage.lightText)}>
                  {(c.applicant?.name || c.name || '?')[0]}
                </div>
              ))}
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {candidates.length} candidate{candidates.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AgencyPipeline() {
  const [allCandidates, setAllCandidates] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedPosting, setSelectedPosting] = useState('all')
  const [postings, setPostings] = useState([])
  const [quoteInbox, setQuoteInbox] = useState([])
  const [showQuotePanel, setShowQuotePanel] = useState(false)
  const [compareIds, setCompareIds] = useState([])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

  const loadData = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/agency/my-jobs').catch(() => ({ jobs: [] })),
      api.get('/api/agency/my-internships').catch(() => ({ internships: [] })),
      api.get('/api/agency/applicants').catch(() => ({ applicants: [] })),
    ]).then(([jobsRes, internRes, appRes]) => {
      const allPosts = [...(jobsRes.jobs || []), ...(internRes.internships || [])].map(p => ({ ...p, skills: p.skills || [], kind: p.kind || 'job' }))
      setPostings(allPosts)
      const apps = (appRes.applicants || []).map(a => {
        const applicantData = a.applicant || {}
        return { ...a, stage: a.status || a.stage || 'new', kind: a.job ? 'job' : (a.internship ? 'internship' : a.kind || 'job'), skills: applicantData.skills || a.skills || [], name: applicantData.name || a.name, email: applicantData.email || a.email }
      })
      setAllCandidates(apps)
      const quotes = apps.filter(a => a.quoteAmount || a.requestQuote)
      setQuoteInbox(quotes)
    }).catch(() => toast.error('Failed to load pipeline'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const filteredCandidates = selectedPosting === 'all'
    ? allCandidates
    : allCandidates.filter(c => String(c.job || c.internship || c.postingId) === String(selectedPosting))

  const getStageCandidates = (stageId) => filteredCandidates.filter(c => (c.stage || 'new') === stageId)

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const activeData = active.data.current
    const overData = over.data.current
    if (!activeData || !overData) return
    const newStage = overData.stageId || activeData.stageId
    setAllCandidates(prev => prev.map(c => c._id === active.id ? { ...c, stage: newStage } : c))
    try {
      await api.patch(`/api/agency/applicants/${active.id}/stage`, { stage: newStage })
      toast.success('Stage updated')
    } catch (err) {
      toast.error('Failed to update stage')
      loadData()
    }
  }

  const toggleCompare = (id) => setCompareIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])

  const moveToStage = async (candidateId, newStage) => {
    setAllCandidates(prev => prev.map(c => c._id === candidateId ? { ...c, stage: newStage } : c))
    try {
      await api.patch(`/api/agency/applicants/${candidateId}/stage`, { stage: newStage })
      toast.success('Stage updated')
    } catch (err) {
      toast.error('Failed to update stage')
      loadData()
    }
  }

  const postingSkills = useMemo(() => {
    if (selectedPosting === 'all') return []
    const posting = postings.find(p => String(p._id) === String(selectedPosting))
    return posting?.skills || []
  }, [selectedPosting, postings])

  const stats = {
    total: filteredCandidates.length,
    new: getStageCandidates('new').length,
    reviewed: getStageCandidates('reviewed').length,
    shortlisted: getStageCandidates('shortlisted').length,
    interview: getStageCandidates('interview').length,
    offer: getStageCandidates('offer').length,
    hired: getStageCandidates('hired').length,
  }

  const statCards = [
    { label: 'Total', value: stats.total, icon: Briefcase, color: 'bg-blue-50 text-blue-600' },
    { label: 'New', value: stats.new, icon: Plus, color: 'bg-blue-50 text-blue-600' },
    { label: 'Review', value: stats.reviewed, icon: Eye, color: 'bg-amber-50 text-amber-600' },
    { label: 'Shortlisted', value: stats.shortlisted, icon: Star, color: 'bg-violet-50 text-violet-600' },
    { label: 'Interview', value: stats.interview, icon: PhoneCall, color: 'bg-indigo-50 text-indigo-600' },
    { label: 'Offer', value: stats.offer, icon: SendHorizonal, color: 'bg-emerald-50 text-emerald-600' },
    { label: 'Hired', value: stats.hired, icon: UserCheck, color: 'bg-teal-50 text-teal-600' },
  ]

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-full px-4 py-6 sm:px-6 sm:py-8 space-y-6">

        <div>
          <Link to="/agency/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary mb-3 transition-colors">
            <ArrowLeft className="size-4" />
            <span>Dashboard</span>
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold sm:text-3xl">Applicant Pipeline</h1>
                <p className="mt-1 text-sm text-slate-500">Drag & drop to move candidates through stages</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowQuotePanel(!showQuotePanel)}
                className={cn('inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-bold transition-all shadow-sm',
                  showQuotePanel ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:border-slate-300')}
              >
                <FileText className="size-4" />
                <span>Quote Inbox</span>
                {quoteInbox.length > 0 && (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-700">{quoteInbox.length}</span>
                )}
              </button>
              <div className="hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl border border-slate-200 bg-white shadow-sm">
                <Zap className="size-4 text-amber-500" />
                <span className="text-xs font-semibold text-slate-500"><span className="text-slate-700">{stats.total}</span> total</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {statCards.map((stat, idx) => (
            <div key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <div className="flex items-center gap-3">
                <div className={cn('p-2 rounded-lg', stat.color)}>
                  <stat.icon className="size-5" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-extrabold text-slate-900 mt-0.5">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-xs w-full">
            <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <select
              value={selectedPosting}
              onChange={e => setSelectedPosting(e.target.value)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm font-semibold outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 hover:border-slate-300 shadow-sm"
            >
              <option value="all">All Postings</option>
              {postings.map(p => (
                <option key={p._id} value={p._id}>{p.title} ({p.kind === 'job' ? 'Job' : 'Internship'})</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {showQuotePanel && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-amber-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-amber-100 text-amber-600">
                  <FileText className="size-5" />
                </div>
                <div>
                  <span className="text-sm font-bold text-amber-800">Request-Quote Proposals</span>
                  <p className="text-xs text-amber-600 font-medium">Compare and evaluate quotes</p>
                </div>
              </div>
              <button onClick={() => setShowQuotePanel(false)} className="rounded-xl p-2 hover:bg-amber-200/50 transition-colors text-amber-600">
                <X className="size-5" />
              </button>
            </div>
            {quoteInbox.length === 0 ? (
              <div className="p-16 text-center">
                <div className="mx-auto mb-4 size-16 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <FileText className="size-8 text-amber-400" />
                </div>
                <p className="text-base font-bold text-slate-700 mb-1">No quote proposals yet</p>
                <p className="text-sm text-slate-400">Candidates will appear here when they submit quote proposals</p>
              </div>
            ) : (
              <div className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
                {quoteInbox.map((q, idx) => (
                  <div key={q._id}
                    className={cn('rounded-xl border-2 p-4 transition-all cursor-pointer hover:shadow-md',
                      compareIds.includes(q._id) ? 'border-primary bg-primary/5 shadow-sm' : 'border-slate-200 bg-white hover:border-slate-300 shadow-sm'
                    )}
                    onClick={() => toggleCompare(q._id)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="grid size-10 place-items-center rounded-lg bg-primary font-bold text-sm text-white shadow-sm">
                            {(q.name || 'A')[0]}
                          </div>
                          {compareIds.includes(q._id) && (
                            <div className="absolute -top-1 -right-1 rounded-full bg-primary text-white p-0.5 shadow-sm">
                              <Check className="size-3" />
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">{q.name}</p>
                          <p className="text-xs text-slate-400">{q.email}</p>
                        </div>
                      </div>
                    </div>
                    {q.quoteAmount && (
                      <div className="inline-flex items-center gap-1.5 rounded-lg bg-primary/5 border border-primary/10 px-3 py-1.5 text-sm font-extrabold text-primary mb-2.5">
                        ₹{q.quoteAmount.toLocaleString()}
                      </div>
                    )}
                    {q.proposal && (
                      <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 mb-2.5">
                        <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">{q.proposal}</p>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1">
                        <Clock className="size-3" />
                        {new Date(q.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </span>
                      {compareIds.includes(q._id) && <span className="text-primary font-bold text-xs">Selected</span>}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {compareIds.length > 1 && (
              <div className="border-t border-amber-100 px-5 py-3.5 bg-amber-50/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1 rounded-lg bg-amber-100">
                      <Sparkles className="size-4 text-amber-600" />
                    </div>
                    <span className="text-sm font-bold text-slate-600">Comparing <span className="text-primary">{compareIds.length}</span> proposals</span>
                  </div>
                  <button onClick={() => setCompareIds([])} className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-1.5 rounded-lg transition-colors">
                    <X className="size-3" /> Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {STAGES.map((stage) => (
              <div key={stage.id} className="shrink-0 w-72 space-y-3">
                <div className="h-12 rounded-2xl bg-slate-100 animate-pulse" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-28 rounded-xl bg-slate-100 animate-pulse" style={{ opacity: 1 - j * 0.2 }} />
                ))}
              </div>
            ))}
          </div>
        ) : filteredCandidates.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <div className="mx-auto mb-5 size-20 rounded-2xl bg-slate-100 flex items-center justify-center">
              <Users className="size-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-700 mb-2">No applicants yet</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">Applications will appear here once candidates start applying to your postings</p>
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
              {STAGES.map(stage => (
                <PipelineColumn key={stage.id} stage={stage} candidates={getStageCandidates(stage.id)} postingSkills={postingSkills} moveToStage={moveToStage} />
              ))}
            </div>
          </DndContext>
        )}
      </div>
    </DashboardLayout>
  )
}

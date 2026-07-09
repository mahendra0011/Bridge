import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, Users, Eye, MessageSquare, ChevronRight, Search, Filter, X, Check, Send, FileText, Star, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

const STAGES = [
  { id: 'new', label: 'New Applications', color: 'bg-blue-500' },
  { id: 'reviewed', label: 'Under Review', color: 'bg-amber-500' },
  { id: 'shortlisted', label: 'Shortlisted', color: 'bg-violet-500' },
  { id: 'interview', label: 'Interview', color: 'bg-indigo-500' },
  { id: 'offer', label: 'Offer Sent', color: 'bg-emerald-500' },
  { id: 'hired', label: 'Hired', color: 'bg-teal-500' },
  { id: 'rejected', label: 'Rejected', color: 'bg-rose-500' },
]

function SortableCandidate({ candidate, stageId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: candidate._id,
    data: { stageId },
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}
      className={`rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-all hover:shadow-md cursor-grab active:cursor-grabbing ${isDragging ? 'opacity-50 shadow-lg' : ''}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
          {(candidate.name || 'A')[0]}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold truncate">{candidate.name || 'Unknown'}</p>
          <p className="text-xs text-slate-500 truncate">{candidate.email || candidate.role || ''}</p>
        </div>
      </div>
      {candidate.proposal && (
        <p className="text-xs text-slate-600 line-clamp-2 mb-2 bg-slate-50 rounded-lg p-2">{candidate.proposal}</p>
      )}
      {candidate.quoteAmount && (
        <div className="flex items-center gap-1 text-xs font-semibold text-primary mb-2">
          <FileText className="size-3" /> Quote: ₹{candidate.quoteAmount.toLocaleString()}
        </div>
      )}
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span>{new Date(candidate.appliedAt || candidate.createdAt).toLocaleDateString()}</span>
        <div className="flex gap-1">
          <button className="rounded-lg p-1 hover:bg-slate-100" title="View profile"><Eye className="size-3.5" /></button>
          <button className="rounded-lg p-1 hover:bg-slate-100" title="Message"><MessageSquare className="size-3.5" /></button>
        </div>
      </div>
    </div>
  )
}

function PipelineColumn({ stage, candidates, onViewProposals }) {
  return (
    <div className="flex shrink-0 w-72 flex-col rounded-2xl border border-slate-200 bg-slate-50/50">
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className={`size-2.5 rounded-full ${stage.color}`} />
          <span className="text-sm font-bold">{stage.label}</span>
        </div>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-bold">{candidates.length}</span>
      </div>
      <div className="flex-1 space-y-2 p-3 overflow-y-auto max-h-[calc(100vh-300px)]">
        <SortableContext items={candidates.map(c => c._id)} strategy={verticalListSortingStrategy}>
          {candidates.map(candidate => (
            <SortableCandidate key={candidate._id} candidate={candidate} stageId={stage.id} />
          ))}
        </SortableContext>
        {candidates.length === 0 && (
          <div className="py-8 text-center text-xs text-slate-400">Drop candidates here</div>
        )}
      </div>
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
      const allPosts = [...(jobsRes.jobs || []), ...(internRes.internships || [])]
      setPostings(allPosts)
      const apps = (appRes.applicants || []).map(a => ({
        ...a,
        stage: a.stage || 'new',
        kind: a.kind || 'job',
      }))
      setAllCandidates(apps)
      // Separate quote/request-quote proposals
      const quotes = apps.filter(a => a.hasQuote || a.requestQuote)
      setQuoteInbox(quotes)
    }).catch(() => toast.error('Failed to load pipeline'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [])

  const filteredCandidates = selectedPosting === 'all'
    ? allCandidates
    : allCandidates.filter(c => c.postingId === selectedPosting)

  const getStageCandidates = (stageId) => {
    return filteredCandidates.filter(c => (c.stage || 'new') === stageId)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeData = active.data.current
    const overData = over.data.current
    if (!activeData || !overData) return

    const newStage = overData.stageId || activeData.stageId
    const candidateId = active.id

    // Optimistic update
    setAllCandidates(prev => prev.map(c =>
      c._id === candidateId ? { ...c, stage: newStage } : c
    ))

    try {
      await api.patch(`/api/agency/applicants/${candidateId}/stage`, { stage: newStage })
      toast.success('Stage updated')
    } catch (err) {
      toast.error('Failed to update stage')
      loadData()
    }
  }

  const toggleCompare = (id) => {
    setCompareIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-full px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Applicant Pipeline</h2>
            <p className="mt-1 text-sm text-slate-500">Drag & drop candidates to move them through stages.</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowQuotePanel(!showQuotePanel)}
              className={`inline-flex items-center gap-1.5 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${showQuotePanel ? 'border-primary bg-primary/10 text-primary' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
              <FileText className="size-4" /> Quote Inbox ({quoteInbox.length})
            </button>
            <select value={selectedPosting} onChange={e => setSelectedPosting(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary">
              <option value="all">All Postings</option>
              {postings.map(p => (
                <option key={p._id} value={p._id}>{p.title}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Quote/Proposal Comparison Panel */}
        {showQuotePanel && (
          <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
            <div className="flex items-center justify-between bg-amber-50 px-5 py-3 border-b border-amber-100">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-amber-600" />
                <span className="text-sm font-bold text-amber-800">Request-Quote Proposals</span>
              </div>
              <button onClick={() => setShowQuotePanel(false)} className="rounded-lg p-1 hover:bg-amber-100">
                <X className="size-4 text-amber-600" />
              </button>
            </div>
            {quoteInbox.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                <FileText className="mx-auto mb-2 size-8 text-slate-300" />
                <p>No quote proposals yet</p>
              </div>
            ) : (
              <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
                {quoteInbox.map(q => (
                  <div key={q._id}
                    className={`rounded-xl border p-4 transition-all cursor-pointer ${compareIds.includes(q._id) ? 'border-primary ring-2 ring-primary/20 bg-primary/5' : 'border-slate-200 hover:shadow-md'}`}
                    onClick={() => toggleCompare(q._id)}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="grid size-8 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                          {(q.name || 'A')[0]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{q.name}</p>
                          <p className="text-xs text-slate-500">{q.email}</p>
                        </div>
                      </div>
                      {compareIds.includes(q._id) && <Check className="size-4 text-primary" />}
                    </div>
                    {q.quoteAmount && (
                      <div className="text-sm font-bold text-primary mb-1">₹{q.quoteAmount.toLocaleString()}</div>
                    )}
                    {q.proposal && (
                      <p className="text-xs text-slate-600 line-clamp-3 bg-slate-50 rounded-lg p-2">{q.proposal}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
                      <span>Posted: {new Date(q.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {compareIds.length > 1 && (
              <div className="border-t border-slate-200 px-5 py-3 bg-slate-50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-600">Comparing {compareIds.length} proposals</span>
                  <button onClick={() => setCompareIds([])} className="text-xs font-bold text-primary hover:underline">Clear</button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Kanban Board */}
        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="w-72 shrink-0 space-y-3">
                <div className="h-10 animate-pulse rounded-xl bg-slate-100" />
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="h-24 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ))}
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <div className="flex gap-4 overflow-x-auto pb-4">
              {STAGES.map(stage => (
                <PipelineColumn key={stage.id} stage={stage} candidates={getStageCandidates(stage.id)} />
              ))}
            </div>
          </DndContext>
        )}
      </div>
    </DashboardLayout>
  )
}
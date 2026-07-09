import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Users, ChevronDown, ArrowLeft, Search, MessageSquare, Download,
  Calendar, CheckCircle, XCircle, Star, Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api, BASE_URL } from '@/lib/api'

const calcMatchScore = (appSkills, postingSkills) => {
  if (!postingSkills?.length || !appSkills?.length) return null
  const match = postingSkills.filter(s => appSkills.some(as => as.toLowerCase() === s.toLowerCase())).length
  return Math.round((match / postingSkills.length) * 100)
}

const STAGES = [
  { key: 'Applied', color: 'border-slate-300 bg-slate-50', dot: 'bg-slate-400' },
  { key: 'Under Review', color: 'border-amber-300 bg-amber-50', dot: 'bg-amber-400' },
  { key: 'Shortlisted', color: 'border-blue-300 bg-blue-50', dot: 'bg-blue-500' },
  { key: 'Interview Scheduled', color: 'border-violet-300 bg-violet-50', dot: 'bg-violet-500' },
  { key: 'Offered', color: 'border-emerald-300 bg-emerald-50', dot: 'bg-emerald-500' },
  { key: 'Hired', color: 'border-green-300 bg-green-50', dot: 'bg-green-600' },
  { key: 'Rejected', color: 'border-rose-300 bg-rose-50', dot: 'bg-rose-500' },
]

export default function Pipeline() {
  const [searchParams] = useSearchParams()
  const [postings, setPostings] = useState([])
  const [selectedPosting, setSelectedPosting] = useState('')
  const [pipeline, setPipeline] = useState([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(null)
  const [postingSkills, setPostingSkills] = useState([])

  useEffect(() => {
    api.get('/api/company/postings')
      .then(data => {
        const all = [...data.internships, ...data.jobs]
        setPostings(all)
        const urlId = searchParams.get('postingId')
        if (urlId && all.some(p => p._id === urlId)) setSelectedPosting(urlId)
        else if (all.length) setSelectedPosting(all[0]._id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedPosting) return
    setLoading(true)
    const posting = postings.find(p => p._id === selectedPosting)
    setPostingSkills(posting?.skills || [])
    api.get(`/api/company/pipeline/${selectedPosting}`)
      .then(data => setPipeline(data.pipeline || []))
      .catch(() => toast.error('Could not load pipeline'))
      .finally(() => setLoading(false))
  }, [selectedPosting, postings])

  const moveToStage = async (appId, newStatus) => {
    setPipeline(p => p.map(s => {
      if (s.stage === newStatus) return { ...s, applications: [...s.applications, ...p.flatMap(x => x.applications.filter(a => a._id === appId))] }
      return { ...s, applications: s.applications.filter(a => a._id !== appId) }
    }))
    setDragging(null)
    try {
      await api.patch(`/api/company/applications/${appId}/status`, { status: newStatus })
    } catch (err) {
      toast.error(err.message)
    }
  }

  const currentPosting = postings.find(p => p._id === selectedPosting)

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-2">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Applicant Pipeline</h1>
            <p className="text-sm text-slate-500">Drag and drop applicants between stages.</p>
          </div>
          <div className="flex gap-2">
            {currentPosting && (
              <Link to={`/company/applicants/${currentPosting.kind}/${currentPosting._id}`} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">
                Table View
              </Link>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative min-w-[300px]">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <select value={selectedPosting} onChange={e => setSelectedPosting(e.target.value)}
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary bg-white appearance-none"
            >
              {postings.map(p => (
                <option key={p._id} value={p._id}>{p.title} ({p.kind})</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : pipeline.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
            <Users className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-semibold text-slate-600">No applicants yet</p>
            <p className="mt-1 text-sm">Applications will appear here once students start applying.</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4" style={{ scrollbarWidth: 'thin' }}>
            {pipeline.map(({ stage, applications }) => {
              const config = STAGES.find(s => s.key === stage) || STAGES[0]
              return (
                <div key={stage} className={`flex-shrink-0 w-72 rounded-2xl border-2 ${config.color}`}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); const id = e.dataTransfer.getData('appId'); if (id) moveToStage(id, stage) }}
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-inherit">
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${config.dot}`} />
                      <span className="text-sm font-bold">{stage}</span>
                    </div>
                    <span className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-bold text-slate-600">{applications.length}</span>
                  </div>
                  <div className="p-3 space-y-3 min-h-[200px] max-h-[600px] overflow-y-auto">
                    {applications.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-slate-200 p-6 text-center text-xs text-slate-400">
                        Drop here
                      </div>
                    ) : applications.map(app => (
                      <div key={app._id} draggable
                        onDragStart={e => { e.dataTransfer.setData('appId', app._id); setDragging(app._id) }}
                        className="rounded-xl bg-white p-3 shadow-sm border border-slate-200 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-bold">{app.applicant?.name || 'Unknown'}</p>
                            <p className="text-xs text-slate-400">{app.applicant?.college || '—'}</p>
                          </div>
                          <div className="flex gap-1">
                            <button title="Download resume" onClick={() => {
                              fetch(`${BASE_URL}/api/company/applications/${app._id}/resume`, {
                                credentials: 'include',
                              }).then(r => r.blob()).then(blob => {
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url; a.download = 'resume.pdf'; a.click()
                                URL.revokeObjectURL(url)
                              }).catch(() => {})
                            }} className="text-slate-400 hover:text-primary">
                              <Download className="size-3.5" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {(app.applicant?.skills || []).slice(0, 3).map(s => (
                            <span key={s} className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">{s}</span>
                          ))}
                        </div>
                        <div className="mt-1.5">
                          {(() => {
                            const m = calcMatchScore(app.applicant?.skills || [], postingSkills)
                            return m !== null ? (
                              <span className={`inline-flex items-center gap-0.5 text-[10px] font-bold ${m >= 80 ? 'text-emerald-600' : m >= 50 ? 'text-amber-600' : 'text-slate-400'}`}>
                                <Star className={`size-3 ${m >= 80 ? 'fill-emerald-500 text-emerald-500' : m >= 50 ? 'fill-amber-500 text-amber-500' : ''}`} />
                                {m}% match
                              </span>
                            ) : null
                          })()}
                        </div>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">{new Date(app.createdAt).toLocaleDateString()}</span>
                          {app.interviewDate && (
                            <span className="text-[10px] font-semibold text-violet-600">
                              📅 {new Date(app.interviewDate).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="mt-2 flex gap-1">
                          {stage !== 'Shortlisted' && stage !== 'Interview Scheduled' && stage !== 'Offered' && stage !== 'Hired' && stage !== 'Rejected' && (
                            <button onClick={() => moveToStage(app._id, 'Shortlisted')} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100">Shortlist</button>
                          )}
                          {stage !== 'Rejected' && (
                            <button onClick={() => moveToStage(app._id, 'Rejected')} className="rounded-md bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-600 hover:bg-rose-100">Reject</button>
                          )}
                          {stage === 'Shortlisted' && (
                            <button onClick={() => moveToStage(app._id, 'Interview Scheduled')} className="rounded-md bg-violet-50 px-2 py-0.5 text-[10px] font-bold text-violet-600 hover:bg-violet-100">Interview</button>
                          )}
                          {stage === 'Interview Scheduled' && (
                            <button onClick={() => moveToStage(app._id, 'Offered')} className="rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-600 hover:bg-emerald-100">Offer</button>
                          )}
                          {stage === 'Offered' && (
                            <button onClick={() => moveToStage(app._id, 'Hired')} className="rounded-md bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-600 hover:bg-green-100">Hire</button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import { useParams, Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft, Download, Calendar, CheckCircle, XCircle, Search,
  ChevronDown, CheckSquare, Square, Filter, MessageSquare, Star
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api, BASE_URL } from '@/lib/api'

const statusOptions = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Rejected', 'Offered', 'Hired']

export default function Applicants() {
  const { kind, id } = useParams()
  const [applicants, setApplicants] = useState([])
  const [posting, setPosting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [selected, setSelected] = useState([])
  const [interviewModal, setInterviewModal] = useState(null)
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewLink, setInterviewLink] = useState('')
  const [savingInterview, setSavingInterview] = useState(false)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get(`/api/company/applicants/${id}`),
      kind && id ? api.get(`/api/${kind}s/${id}`).catch(() => null) : null,
    ]).then(([appData, postingData]) => {
      setApplicants(appData.applications || [])
      setPosting(postingData?.job || postingData?.internship || null)
    }).catch(err => toast.error(err.message || 'Could not load applicants'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id, kind])

  const postingSkills = posting?.skills || []

  const calcMatchScore = (app) => {
    const appSkills = app.applicant?.skills || []
    if (!postingSkills.length || !appSkills.length) return null
    const match = postingSkills.filter(s => appSkills.some(as => as.toLowerCase() === s.toLowerCase())).length
    return Math.round((match / postingSkills.length) * 100)
  }

  const updateStatus = async (appId, status) => {
    setApplicants(p => p.map(a => a._id === appId ? { ...a, status } : a))
    try {
      await api.patch(`/api/company/applications/${appId}/status`, { status })
    } catch (err) {
      toast.error(err.message || 'Could not update status')
      load()
    }
  }

  const bulkAction = async (status) => {
    if (!selected.length) return toast.error('Select at least one applicant')
    try {
      await api.post('/api/company/applications/bulk-status', { applicationIds: selected, status })
      toast.success(`Marked ${selected.length} as ${status}`)
      setSelected([])
      load()
    } catch (err) { toast.error(err.message) }
  }

  const downloadResume = (appId) => {
    fetch(`${BASE_URL}/api/company/applications/${appId}/resume`, {
      credentials: 'include',
    }).then(res => {
      if (!res.ok) throw new Error('Resume not available')
      return res.blob()
    }).then(blob => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'resume.pdf'; a.click()
      URL.revokeObjectURL(url)
    }).catch(err => toast.error(err.message))
  }

  const submitInterview = async () => {
    if (!interviewDate) return toast.error('Pick a date and time')
    setSavingInterview(true)
    try {
      await api.post(`/api/company/applications/${interviewModal._id}/interview`, { interviewDate, interviewLink })
      setApplicants(p => p.map(a => a._id === interviewModal._id ? { ...a, status: 'Interview Scheduled', interviewDate, interviewLink } : a))
      setInterviewModal(null); setInterviewDate(''); setInterviewLink('')
      toast.success('Interview scheduled')
    } catch (err) { toast.error(err.message || 'Could not schedule interview') }
      finally { setSavingInterview(false) }
  }

  const toggleSelect = (id) => {
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id])
  }

  const toggleAll = () => {
    if (selected.length === filtered.length) setSelected([])
    else setSelected(filtered.map(a => a._id))
  }

  const filtered = applicants.filter(a => {
    const name = a.applicant?.name || ''
    return name.toLowerCase().includes(search.toLowerCase()) && (!filterStatus || a.status === filterStatus)
  })

  const hasDeadlinePassed = posting?.deadline && new Date(posting.deadline) < new Date()

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-2">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Applicants</h1>
            <p className="text-sm text-slate-500">
              {loading ? 'Loading...' : `${applicants.length} application${applicants.length !== 1 ? 's' : ''}`}
              {posting && <> for <span className="font-semibold text-foreground">{posting.title}</span></>}
              {hasDeadlinePassed && <span className="ml-2 text-amber-600 font-semibold">(Deadline passed)</span>}
            </p>
          </div>
          <div className="flex gap-2">
            <Link to={`/company/pipeline/${kind}/${id}`} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">
              Kanban View
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name" className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex flex-wrap gap-2">
            {['', ...statusOptions].map(s => (
              <button key={s || 'all'} onClick={() => setFilterStatus(s)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${filterStatus === s ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >{s || 'All'}</button>
            ))}
          </div>
        </div>

        {selected.length > 0 && (
          <div className="flex items-center gap-2 rounded-xl bg-primary/5 border border-primary/20 px-4 py-3">
            <span className="text-sm font-bold text-primary">{selected.length} selected</span>
            <div className="ml-auto flex gap-2">
              <button onClick={() => bulkAction('Shortlisted')} className="rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-600">Shortlist</button>
              <button onClick={() => bulkAction('Rejected')} className="rounded-lg bg-rose-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-600">Reject</button>
              <button onClick={() => bulkAction('Under Review')} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-600">Under Review</button>
              <button onClick={() => setSelected([])} className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">Clear</button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[800px] text-sm">
              <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3 w-10">
                    <button onClick={toggleAll} className="grid place-items-center">
                      {selected.length === filtered.length && filtered.length > 0 ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4" />}
                    </button>
                  </th>
                  <th className="px-6 py-3">Candidate</th>
                  <th className="px-6 py-3">College</th>
                  <th className="px-6 py-3">Skills</th>
                  <th className="px-6 py-3">Match</th>
                  <th className="px-6 py-3">Applied</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((a) => {
                  const match = calcMatchScore(a)
                  return (
                    <tr key={a._id} className={`hover:bg-surface ${selected.includes(a._id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-4">
                        <button onClick={() => toggleSelect(a._id)} className="grid place-items-center">
                          {selected.includes(a._id) ? <CheckSquare className="size-4 text-primary" /> : <Square className="size-4 text-slate-300" />}
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold">{a.applicant?.name || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{a.applicant?.email}</p>
                        <div className="flex gap-2 mt-1">
                          {a.portfolioUrl && <a href={a.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">Portfolio</a>}
                          {a.linkedinUrl && <a href={a.linkedinUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline">LinkedIn</a>}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-slate-600">{a.applicant?.college || '—'}</td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {(a.applicant?.skills || []).slice(0, 3).map(s => (
                            <span key={s} className="rounded-md bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-600">{s}</span>
                          ))}
                          {(a.applicant?.skills || []).length > 3 && <span className="text-[11px] text-slate-400">+{a.applicant.skills.length - 3}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {match !== null ? (
                          <div className="flex items-center gap-1.5">
                            <Star className={`size-3.5 ${match >= 80 ? 'text-emerald-500 fill-emerald-500' : match >= 50 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                            <span className={`font-bold text-xs ${match >= 80 ? 'text-emerald-600' : match >= 50 ? 'text-amber-600' : 'text-slate-500'}`}>{match}%</span>
                          </div>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-6 py-4 text-slate-500">{a.createdAt ? new Date(a.createdAt).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-4">
                        <select value={a.status} onChange={e => updateStatus(a._id, e.target.value)}
                          className={`rounded-full px-3 py-1 text-xs font-bold border-0 outline-none cursor-pointer ${
                            a.status === 'Applied' ? 'bg-slate-100 text-slate-700'
                              : a.status === 'Under Review' ? 'bg-amber-50 text-amber-700'
                              : a.status === 'Shortlisted' ? 'bg-blue-50 text-blue-700'
                              : a.status === 'Interview Scheduled' ? 'bg-violet-50 text-violet-700'
                              : a.status === 'Rejected' ? 'bg-rose-50 text-rose-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <button title="Download resume" onClick={() => downloadResume(a._id)} disabled={!a.resumeUrl}
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40">
                            <Download className="size-3.5" />
                          </button>
                          <button title="Schedule interview" onClick={() => setInterviewModal(a)}
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-violet-400 hover:text-violet-600">
                            <Calendar className="size-3.5" />
                          </button>
                          <button title="Shortlist" onClick={() => updateStatus(a._id, 'Shortlisted')}
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600">
                            <CheckCircle className="size-3.5" />
                          </button>
                          <button title="Reject" onClick={() => updateStatus(a._id, 'Rejected')}
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-600">
                            <XCircle className="size-3.5" />
                          </button>
                          <a href={`/company/chat?userId=${a.applicant?._id}`} title="Message"
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600">
                            <MessageSquare className="size-3.5" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-slate-400">No applicants match your filters.</div>
            )}
          </div>
        )}
      </div>

      {interviewModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold">Schedule Interview</h3>
            <p className="mt-1 text-sm text-slate-500">for {interviewModal.applicant?.name}</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Date & Time</label>
                <input type="datetime-local" value={interviewDate} onChange={e => setInterviewDate(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Online Meeting Link</label>
                <input type="url" value={interviewLink} onChange={e => setInterviewLink(e.target.value)} placeholder="https://meet.google.com/..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setInterviewModal(null)} className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">Cancel</button>
              <button onClick={submitInterview} disabled={savingInterview} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors">
                {savingInterview ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

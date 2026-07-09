import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Eye, Pencil, Trash2, Copy, Zap, XCircle, ArrowUpDown,
  Search, Filter, MoreHorizontal, Clock, CheckCircle, AlertCircle,
  Ban, Rocket, FileText, Briefcase, GraduationCap, ExternalLink
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

const FILTER_TABS = ['all', 'active', 'draft', 'closed', 'expired']

export default function AgencyPostings() {
  const [data, setData] = useState({ internships: [], jobs: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [kindFilter, setKindFilter] = useState('all')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/api/agency/my-jobs').catch(() => ({ jobs: [] })),
      api.get('/api/agency/my-internships').catch(() => ({ internships: [] })),
    ]).then(([jobsRes, internRes]) => {
      setData({
        jobs: (jobsRes.jobs || []).map(j => ({ ...j, kind: 'job' })),
        internships: (internRes.internships || []).map(i => ({ ...i, kind: 'internship' })),
      })
    }).catch(() => toast.error('Could not load postings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const allPostings = [...data.internships, ...data.jobs].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  )

  const filtered = allPostings.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false
    if (kindFilter !== 'all' && p.kind !== kindFilter) return false
    if (search && !p.title?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const duplicate = async (p) => {
    try {
      await api.post(`/api/agency/posting/${p.kind}/${p._id}/duplicate`)
      toast.success('Duplicated as draft')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const toggleBoost = async (p) => {
    try {
      await api.patch(`/api/agency/posting/${p.kind}/${p._id}/boost`)
      toast.success(p.isBoosted ? 'Boost removed' : 'Posting boosted!')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const changeStatus = async (p, status) => {
    try {
      await api.patch(`/api/agency/posting/${p.kind}/${p._id}/status`, { status })
      toast.success(`Status changed to ${status}`)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const deletePosting = async (p) => {
    if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return
    try {
      const endpoint = p.kind === 'job' ? `/api/jobs/${p._id}` : `/api/internships/${p._id}`
      await api.delete(endpoint)
      toast.success('Deleted')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const statusIcon = (s) => {
    if (s === 'approved') return <CheckCircle className="size-3.5 text-emerald-500" />
    if (s === 'draft') return <FileText className="size-3.5 text-slate-400" />
    if (s === 'closed') return <XCircle className="size-3.5 text-rose-500" />
    if (s === 'expired') return <Clock className="size-3.5 text-amber-500" />
    return <AlertCircle className="size-3.5 text-amber-500" />
  }

  const statusColor = (s) => {
    if (s === 'approved') return 'bg-emerald-50 text-emerald-700'
    if (s === 'draft') return 'bg-slate-100 text-slate-500'
    if (s === 'closed') return 'bg-rose-50 text-rose-700'
    if (s === 'expired') return 'bg-amber-50 text-amber-700'
    return 'bg-amber-50 text-amber-700'
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">My Postings</h2>
            <p className="mt-1 text-sm text-slate-500">Manage all your gigs, jobs, and project listings.</p>
          </div>
          <Link to="/company/post" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90">
            <Plus className="size-4" /> Post New Gig
          </Link>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search postings..." className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {['all', 'job', 'internship'].map(k => (
              <button key={k} onClick={() => setKindFilter(k)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors capitalize ${kindFilter === k ? 'bg-white text-foreground shadow-sm' : 'text-slate-500 hover:text-foreground'}`}
              >{k === 'all' ? 'All Types' : k === 'job' ? '💼 Jobs' : '🎓 Internships'}</button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors capitalize ${filter === t ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >{t}</button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
            <Rocket className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-semibold text-slate-600">No postings found</p>
            <p className="mt-1 text-sm">Try a different filter or create a new gig or project.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[750px] text-sm">
              <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Applicants</th>
                  <th className="px-6 py-3">Views</th>
                  <th className="px-6 py-3">Boosted</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((p) => (
                  <tr key={p._id} className="hover:bg-surface">
                    <td className="px-6 py-4 font-semibold">{p.title}</td>
                    <td className="px-6 py-4 capitalize text-slate-600">{p.kind}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${statusColor(p.status)}`}>
                        {statusIcon(p.status)} {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <Link to={`/company/applicants/${p.kind}/${p._id}`} className="font-bold text-primary hover:underline">
                        {p.applicantsCount || 0}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{p.views || 0}</td>
                    <td className="px-6 py-4">
                      {p.isBoosted ? <span className="text-xs font-bold text-amber-600">🚀 Boosted</span> : '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/company/applicants/${p.kind}/${p._id}`} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary" title="View applicants">
                          <Eye className="size-3.5" />
                        </Link>
                        <Link to={`/company/edit-posting/${p.kind}/${p._id}`} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary" title="Edit">
                          <Pencil className="size-3.5" />
                        </Link>
                        <button onClick={() => duplicate(p)} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600" title="Duplicate">
                          <Copy className="size-3.5" />
                        </button>
                        <button onClick={() => toggleBoost(p)} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-amber-400 hover:text-amber-600" title={p.isBoosted ? 'Remove boost' : 'Boost'}>
                          <Zap className="size-3.5" />
                        </button>
                        {p.status === 'approved' && (
                          <button onClick={() => changeStatus(p, 'closed')} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-600" title="Close early">
                            <Ban className="size-3.5" />
                          </button>
                        )}
                        <button onClick={() => deletePosting(p)} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-600" title="Delete">
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
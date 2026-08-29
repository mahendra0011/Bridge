import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Eye, Pencil, Trash2, Copy, Zap, Ban, Clock, CheckCircle,
  Search, Rocket, FileText, Briefcase, GraduationCap
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

const FILTER_TABS = ['all', 'approved', 'draft', 'closed', 'expired']

export default function CompanyPostings() {
  const [data, setData] = useState({ internships: [], jobs: [] })
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [kindFilter, setKindFilter] = useState('all')

  const load = () => {
    setLoading(true)
    api.get('/api/company/postings')
      .then(setData)
      .catch(() => toast.error('Could not load postings'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const allPostings = [...data.internships, ...data.jobs].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))

  const filtered = allPostings.filter(p => {
    if (filter !== 'all' && p.status !== filter) return false
    if (kindFilter !== 'all' && p.kind !== kindFilter) return false
    if (search && !p.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const duplicate = async (p) => {
    try {
      await api.post(`/api/company/posting/${p.kind}/${p._id}/duplicate`)
      toast.success('Duplicated as draft')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const toggleBoost = async (p) => {
    try {
      await api.patch(`/api/company/posting/${p.kind}/${p._id}/boost`)
      toast.success(p.isBoosted ? 'Boost removed' : 'Posting boosted!')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const changeStatus = async (p, status) => {
    try {
      await api.patch(`/api/company/posting/${p.kind}/${p._id}/status`, { status })
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
    if (s === 'closed') return <Ban className="size-3.5 text-rose-500" />
    if (s === 'expired') return <Clock className="size-3.5 text-amber-500" />
    return <Clock className="size-3.5 text-amber-500" />
  }

  const statusColor = (s) => {
    if (s === 'approved') return 'bg-emerald-50 text-emerald-700'
    if (s === 'draft') return 'bg-slate-100 text-slate-500'
    if (s === 'closed') return 'bg-rose-50 text-rose-700'
    return 'bg-amber-50 text-amber-700'
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
                <Briefcase className="size-5 text-primary" />
              </div>
              <h2 className="text-2xl font-extrabold tracking-tight">My Listings</h2>
            </div>
            <p className="text-sm text-slate-500">Manage all your job and internship postings.</p>
          </div>
          <Link to="/company/post" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all">
            <Plus className="size-4" /> Post New
          </Link>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="relative flex-1 min-w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search listings..." className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
            </div>
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {['all', 'job', 'internship'].map(k => (
                <button key={k} onClick={() => setKindFilter(k)}
                  className={`rounded-md px-3 py-1.5 text-xs font-bold transition-all capitalize ${kindFilter === k ? 'bg-white text-foreground shadow-sm' : 'text-slate-500 hover:text-foreground'}`}>
                  {k === 'all' ? 'All Types' : k === 'job' ? '💼 Jobs' : '🎓 Internships'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(t => (
            <button key={t} onClick={() => setFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors capitalize ${filter === t ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {t}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-48 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <Rocket className="mb-4 size-16 rounded-2xl bg-slate-100 p-3 text-slate-300" />
            <p className="font-semibold text-slate-600 mb-2">No listings found</p>
            <p className="text-sm text-slate-400 mb-4">Try a different filter or create a new posting.</p>
            <Link to="/company/post" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90">
              <Plus className="size-4" /> Create New
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <div key={p._id} className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColor(p.status)}`}>
                    {statusIcon(p.status)} {p.status}
                  </span>
                  <Link to={`/opportunity/${p._id}`} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors">
                    <Eye className="size-4" />
                  </Link>
                </div>
                <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h3>
                <p className="mt-1 text-xs text-slate-500 capitalize">{p.kind}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Applicants:</span>
                    <span className="ml-1 font-bold text-primary">{p.applicantsCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Views:</span>
                    <span className="ml-1 font-medium text-slate-600">{p.views || 0}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  {p.isBoosted ? <span className="font-bold text-amber-600">🚀 Boosted</span> : 'Not boosted'}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2">
                  <Link to={`/company/applicants/${p.kind}/${p._id}`} className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                    <Eye className="size-3.5" /> Applicants
                  </Link>
                  <Link to={`/company/edit-posting/${p.kind}/${p._id}`} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100">
                    <Pencil className="size-3.5" /> Edit
                  </Link>
                  <button onClick={() => duplicate(p)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-100">
                    <Copy className="size-3.5" /> Duplicate
                  </button>
                  <button onClick={() => toggleBoost(p)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-600 hover:bg-amber-100">
                    <Zap className="size-3.5" /> Boost
                  </button>
                  {p.status === 'approved' && (
                    <button onClick={() => changeStatus(p, 'closed')} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100">
                      <Ban className="size-3.5" /> Close
                    </button>
                  )}
                  <button onClick={() => deletePosting(p)} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100">
                    <Trash2 className="size-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
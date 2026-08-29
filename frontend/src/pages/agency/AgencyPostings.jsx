import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Eye, Pencil, Trash2, Copy, Zap, Ban,
  Search, Clock, CheckCircle, AlertCircle,
  Rocket, FileText, Briefcase, GraduationCap,
  Users, Grid, List
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

  const statusBadge = (s) => {
    const styles = {
      approved: 'bg-emerald-50 text-emerald-700',
      draft: 'bg-slate-100 text-slate-500',
      closed: 'bg-rose-50 text-rose-700',
      expired: 'bg-amber-50 text-amber-700',
      pending: 'bg-amber-50 text-amber-700',
    }
    const icons = {
      approved: <CheckCircle className="size-3.5" />,
      draft: <FileText className="size-3.5" />,
      closed: <Ban className="size-3.5" />,
      expired: <Clock className="size-3.5" />,
      pending: <AlertCircle className="size-3.5" />,
    }
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${styles[s] || styles.pending}`}>
        {icons[s] || icons.pending} {s}
      </span>
    )
  }

  const activeCount = allPostings.filter(p => p.status === 'approved').length
  const draftCount = allPostings.filter(p => p.status === 'draft').length
  const totalApplicants = allPostings.reduce((sum, p) => sum + (p.applicantsCount || 0), 0)

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">My Postings</h1>
            <p className="mt-1 text-sm text-slate-500">Manage all your gigs, jobs, and project listings.</p>
          </div>
          <Link to="/agency/post-gig" className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="size-4" /> Post New Gig
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
            <div className="mb-3 grid size-10 place-items-center rounded-xl bg-blue-50 text-blue-600">
              <FileText className="size-5" />
            </div>
            <div className="text-2xl font-extrabold">{loading ? '—' : allPostings.length}</div>
            <div className="text-sm text-slate-500">Total Postings</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
            <div className="mb-3 grid size-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle className="size-5" />
            </div>
            <div className="text-2xl font-extrabold">{loading ? '—' : activeCount}</div>
            <div className="text-sm text-slate-500">Active</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
            <div className="mb-3 grid size-10 place-items-center rounded-xl bg-slate-100 text-slate-600">
              <FileText className="size-5" />
            </div>
            <div className="text-2xl font-extrabold">{loading ? '—' : draftCount}</div>
            <div className="text-sm text-slate-500">Drafts</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
            <div className="mb-3 grid size-10 place-items-center rounded-xl bg-violet-50 text-violet-600">
              <Users className="size-5" />
            </div>
            <div className="text-2xl font-extrabold">{loading ? '—' : totalApplicants}</div>
            <div className="text-sm text-slate-500">Total Applicants</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search postings..." className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary transition-colors" />
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {[
              { value: 'all', label: 'All Types', icon: Grid },
              { value: 'job', label: 'Jobs', icon: Briefcase },
              { value: 'internship', label: 'Internships', icon: GraduationCap }
            ].map(k => (
              <button key={k.value} onClick={() => setKindFilter(k.value)}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-bold transition-colors capitalize ${kindFilter === k.value ? 'bg-white text-foreground shadow-sm' : 'text-slate-500 hover:text-foreground'}`}>
                <k.icon className="size-3.5" />{k.label}
              </button>
            ))}
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
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-500">
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
                  <tr key={p._id} className="hover:bg-surface transition-colors">
                    <td className="px-6 py-4 font-semibold">{p.title}</td>
                    <td className="px-6 py-4 capitalize text-slate-600">{p.kind}</td>
                    <td className="px-6 py-4">{statusBadge(p.status)}</td>
                    <td className="px-6 py-4">
                      <Link to={`/company/applicants/${p.kind}/${p._id}`} className="font-bold text-primary hover:underline">
                        {p.applicantsCount || 0}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{p.views || 0}</td>
                    <td className="px-6 py-4">
                      {p.isBoosted ? <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-xs font-bold text-amber-700"><Zap className="size-3" /> Boosted</span> : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link to={`/company/applicants/${p.kind}/${p._id}`} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-colors" title="View applicants">
                          <Eye className="size-3.5" />
                        </Link>
                        <Link to={`/company/edit-posting/${p.kind}/${p._id}`} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-colors" title="Edit">
                          <Pencil className="size-3.5" />
                        </Link>
                        <button onClick={() => duplicate(p)} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary transition-colors" title="Duplicate">
                          <Copy className="size-3.5" />
                        </button>
                        <button onClick={() => toggleBoost(p)} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-amber-500 hover:text-amber-600 transition-colors" title={p.isBoosted ? 'Remove boost' : 'Boost'}>
                          <Zap className="size-3.5" />
                        </button>
                        {p.status === 'approved' && (
                          <button onClick={() => changeStatus(p, 'closed')} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-600 transition-colors" title="Close early">
                            <Ban className="size-3.5" />
                          </button>
                        )}
                        <button onClick={() => deletePosting(p)} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-600 transition-colors" title="Delete">
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

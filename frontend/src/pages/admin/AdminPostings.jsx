import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check, Trash2, Flag } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'

export default function AdminPostings({ kind = 'internship' }) {
  const isJob = kind === 'job'
  const isOpportunity = kind === 'opportunity'
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('')
  const [postings, setPostings] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const limit = 20

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit, ...(filterStatus ? { status: filterStatus } : {}) })
    let endpoint = '/api/admin/internships'
    if (isJob) endpoint = '/api/admin/jobs'
    if (isOpportunity) endpoint = '/api/opportunities'
    return api
      .get(`${endpoint}?${params}`)
      .then((data) => { setPostings(data.jobs || data.internships || data.opportunities || []); setTotal(data.total || 0) })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filterStatus, kind])
  useEffect(() => { setPage(1) }, [filterStatus, kind])

  const approve = async (p) => {
    setPostings((prev) => prev.map((x) => (x._id === p._id ? { ...x, status: 'approved' } : x)))
    try {
      await api.patch(`/api/admin/postings/${p._id}/approve`)
    } catch (err) {
      toast.error(err.message || 'Could not approve')
      load()
    }
  }

  const remove = async (p) => {
    if (!confirm(`Delete "${p.title}"? This can't be undone.`)) return
    setPostings((prev) => prev.filter((x) => x._id !== p._id))
    try {
      await api.delete(`/api/admin/postings/${p._id}`)
      setTotal((t) => t - 1)
    } catch (err) {
      toast.error(err.message || 'Could not delete')
      load()
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
            <div>
              <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-4">
                <ArrowLeft className="size-4" /> Back to admin
              </Link>
              <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Manage {isJob ? 'Jobs' : isOpportunity ? 'Opportunities' : 'Internships'}</h1>
              <p className="mt-1 text-slate-500">{loading ? 'Loading...' : `${total} ${isJob ? 'jobs' : isOpportunity ? 'opportunities' : 'internships'}`}</p>
            </div>
            <div className="flex gap-2">
              {['', 'pending', 'approved', 'closed'].map((s) => (
                <button
                  key={s || 'all'}
                  onClick={() => setFilterStatus(s)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${
                    filterStatus === s ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s || 'All'}
                </button>
              ))}
            </div>
            {isOpportunity && (
              <div className="text-xs text-slate-500">
                Note: Opportunities are posted by individual users and are public by default.
              </div>
            )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Posted</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {postings.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold">{p.title}</td>
                    <td className="px-6 py-4 text-slate-600">{p.company?.name || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                        p.status === 'approved' ? 'bg-emerald-50 text-emerald-700'
                          : p.status === 'pending' ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>
                        {p.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {p.status !== 'approved' && (
                          <button
                            onClick={() => approve(p)}
                            title="Approve"
                            className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-emerald-400 hover:text-emerald-600"
                          >
                            <Check className="size-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => remove(p)}
                          title="Delete"
                          className="grid size-7 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-600"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {postings.length === 0 && (
              <div className="p-12 text-center text-slate-400">No postings found.</div>
            )}
          </div>
        )}

        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>
    </DashboardLayout>
  )
}

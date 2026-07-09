import { useEffect, useState } from 'react'
import { Flag, CheckCircle2, XCircle, Search, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'

export default function AdminReports() {
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('')
  const [reports, setReports] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [resolution, setResolution] = useState('')
  const limit = 20

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit, ...(filterStatus ? { status: filterStatus } : {}) })
    api.get(`/api/admin/reports?${params}`)
      .then(data => { setReports(data.reports || []); setTotal(data.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filterStatus])
  useEffect(() => { setPage(1) }, [filterStatus])

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/admin/reports/${id}/status`, { status, resolution: resolution || undefined })
      toast.success(`Report ${status}`)
      setSelected(null)
      setResolution('')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  const statusColors = { open: 'bg-rose-50 text-rose-700', investigating: 'bg-amber-50 text-amber-700', resolved: 'bg-emerald-50 text-emerald-700', dismissed: 'bg-slate-100 text-slate-500' }
  const typeIcons = { job: '💼', internship: '📚', company: '🏢', user: '👤', community_post: '📰', community_comment: '💬', message: '✉️', conversation: '🗨️' }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Reports & Complaints</h1>
          <p className="mt-1 text-sm text-slate-500">{loading ? 'Loading...' : `${total} reports`}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['', 'open', 'investigating', 'resolved', 'dismissed'].map(s => (
            <button key={s || 'all'} onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${filterStatus === s ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)
          ) : reports.length === 0 ? (
            <div className="col-span-full p-12 text-center text-slate-400">No reports found.</div>
          ) : reports.map(r => (
            <div key={r._id} className={`rounded-2xl border p-5 cursor-pointer transition-all ${selected?._id === r._id ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'}`}
              onClick={() => { setSelected(r); setResolution('') }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{typeIcons[r.type] || '📌'}</span>
                  <div>
                    <p className="font-semibold text-sm capitalize">{r.type} Report</p>
                    <p className="text-xs text-slate-500">by {r.reporter?.name || 'Unknown'} · {new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${statusColors[r.status] || ''}`}>{r.status}</span>
              </div>
              <p className="mt-3 text-sm text-slate-600"><strong>Reason:</strong> {r.reason}</p>
              {r.description && <p className="mt-1 text-sm text-slate-500 line-clamp-2">{r.description}</p>}

              {selected?._id === r._id && (
                <div className="mt-4 space-y-3 border-t border-slate-100 pt-4">
                  {r.status === 'open' || r.status === 'investigating' ? (
                    <>
                      <textarea value={resolution} onChange={e => setResolution(e.target.value)} placeholder="Resolution notes..." rows={2}
                        className="w-full rounded-lg border border-slate-200 p-2.5 text-sm outline-none focus:border-primary" />
                      <div className="flex gap-2">
                        <button onClick={() => updateStatus(r._id, 'resolved')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                          <CheckCircle2 className="size-3.5" /> Resolve
                        </button>
                        <button onClick={() => updateStatus(r._id, 'dismissed')} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                          <XCircle className="size-3.5" /> Dismiss
                        </button>
                        <button onClick={() => updateStatus(r._id, 'investigating')} className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 px-3 py-1.5 text-xs font-bold text-amber-700 hover:bg-amber-50">
                          <AlertTriangle className="size-3.5" /> Investigate
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
                      <p className="font-semibold text-xs text-slate-400 uppercase tracking-wide">Resolution</p>
                      <p className="mt-1">{r.resolution || 'No notes'}</p>
                      {r.resolvedBy && <p className="mt-1 text-xs text-slate-400">by {r.resolvedBy?.name || 'Admin'}</p>}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>
    </DashboardLayout>
  )
}

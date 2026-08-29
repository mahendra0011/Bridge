import { useEffect, useState } from 'react'
import { Building2, Search, BadgeCheck, BadgeX, ExternalLink, X } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'

export default function AdminAgencies() {
  const [page, setPage] = useState(1)
  const [agencies, setAgencies] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const limit = 20

  useEffect(() => {
    setLoading(true)
    api.get(`/api/admin/agencies?page=${page}&limit=${limit}&search=${search || ''}&status=${filter}`)
      .then(data => {
        setAgencies(data.agencies || [])
        setTotal(data.total || 0)
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [page, filter, search])

  const toggleStatus = async (agency) => {
    const action = agency.isActive ? 'deactivate' : 'activate'
    try {
      await api.patch(`/api/admin/agencies/${agency._id}/${action}`)
      toast.success(`Agency ${action}d`)
      setSelected(null)
    } catch (err) { toast.error(err.message) }
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Agencies Management</h1>
          <p className="mt-1 text-sm text-slate-500">{loading ? 'Loading...' : `${total} agencies`}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }}
              placeholder="Search agencies..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {['all', 'active', 'deactivated'].map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1) }}
                className={`rounded-md px-3 py-1.5 text-xs font-bold capitalize transition-colors ${filter === f ? 'bg-white text-foreground shadow-sm' : 'text-slate-500 hover:text-foreground'}`}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Agency</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Services</th>
                  <th className="px-6 py-3">Verified</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {agencies.map(a => (
                  <tr key={a._id} className={`hover:bg-slate-50 cursor-pointer transition-colors ${selected?._id === a._id ? 'bg-blue-50' : ''}`} onClick={() => setSelected(a)}>
                    <td className="px-6 py-4 font-semibold">
                      <div>{a.agencyName}</div>
                      <div className="text-xs text-slate-500">{a.city || '—'}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{a.user?.name || '—'}</td>
                    <td className="px-6 py-4 text-slate-600">{a.services?.slice(0, 2).join(', ') || '—'}{a.services?.length > 2 && ` +${a.services.length - 2}`}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${a.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {a.isVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${a.isActive ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                        {a.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button onClick={(e) => { e.stopPropagation(); toggleStatus(a) }}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${a.isActive ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}>
                        {a.isActive ? <><BadgeX className="size-3.5" /> Deactivate</> : <><BadgeCheck className="size-3.5" /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {agencies.length === 0 && <div className="p-12 text-center text-slate-400">No agencies found.</div>}
          </div>
        )}

        {total > limit && <Pagination page={page} pages={pages} onChange={setPage} />}

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-bold">{selected.agencyName}</h2>
                  <p className="text-sm text-slate-500">{selected.isActive ? 'Active' : 'Deactivated'}</p>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                  <X className="size-5" />
                </button>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 text-sm">
                <div><span className="text-xs text-slate-400">Contact</span><div className="font-medium">{selected.user?.name || '—'}</div></div>
                <div><span className="text-xs text-slate-400">City</span><div className="font-medium">{selected.city || '—'}</div></div>
                <div className="sm:col-span-2"><span className="text-xs text-slate-400">Services</span><div className="font-medium">{selected.services?.join(', ') || '—'}</div></div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button onClick={() => { toggleStatus(selected); setSelected(null) }}
                  className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${selected.isActive ? 'border border-slate-200 text-slate-600 hover:bg-slate-50' : 'bg-emerald-600 text-white hover:bg-emerald-700'}`}>
                  {selected.isActive ? <><BadgeX className="size-4" /> Deactivate</> : <><BadgeCheck className="size-4" /> Activate</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
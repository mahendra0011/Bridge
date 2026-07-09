import { useEffect, useState } from 'react'
import { Building2, Search, BadgeCheck, BadgeX, ExternalLink, Image, FileText, Users, MapPin, Briefcase, X } from 'lucide-react'
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

  const load = () => {
    setLoading(true)
    api.get(`/api/admin/agencies?page=${page}&limit=${limit}&search=${search || ''}&status=${filter}`)
      .then(data => {
        setAgencies(data.agencies || [])
        setTotal(data.total || 0)
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filter, search])

  const toggleStatus = async (agency) => {
    const action = agency.isActive ? 'deactivate' : 'activate'
    try {
      await api.patch(`/api/admin/agencies/${agency._id}/${action}`)
      toast.success(`Agency ${action}d`)
      load()
    } catch (err) {
      toast.error(err.message)
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  const DetailRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 text-sm">
      <Icon className="mt-0.5 size-4 shrink-0 text-slate-400" />
      <div className="min-w-0">
        <span className="block text-xs text-slate-400">{label}</span>
        <span className="block font-medium text-slate-800 break-words">{value || '—'}</span>
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Agencies Management</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Loading...' : `${total} agencies`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="Search agencies..." className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex gap-1 rounded-xl border border-slate-200 p-0.5">
            {['all', 'active', 'deactivated'].map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1) }} className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}>{f}</button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[800px] text-sm">
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
                  <tr key={a._id} className="hover:bg-slate-50 cursor-pointer transition-colors" onClick={() => setSelected(a)}>
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
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleStatus(a) }}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                          a.isActive
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                      >
                        {a.isActive ? <><BadgeX className="size-3.5" /> Deactivate</> : <><BadgeCheck className="size-3.5" /> Activate</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {agencies.length === 0 && (<div className="p-12 text-center text-slate-400">No agencies found.</div>)}
          </div>
        )}

        <Pagination page={page} pages={pages} onChange={setPage} />

        {selected && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
            <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="mb-6 flex items-start justify-between">
                <div>
                  <h2 className="text-xl font-extrabold">{selected.agencyName}</h2>
                  <p className="text-sm text-slate-500">Agency — {selected.isActive ? 'Active' : 'Deactivated'}</p>
                </div>
                <button onClick={() => setSelected(null)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X className="size-4" /></button>
              </div>
              <div className="mb-6 grid gap-4 sm:grid-cols-2">
                <DetailRow icon={Users} label="Contact" value={selected.user?.name || '—'} />
                <DetailRow icon={MapPin} label="City" value={selected.city || '—'} />
              </div>
              <DetailRow icon={Briefcase} label="Team Size" value={selected.teamSize || '—'} />
              {selected.services && selected.services.length > 0 && (
                <DetailRow icon={Briefcase} label="Services" value={selected.services.join(', ')} />
              )}
              {selected.description && (
                <DetailRow icon={FileText} label="Description" value={selected.description} />
              )}
              {(selected.udyamNumber || selected.regCertificate || selected.idProof) && (
                <div className="mt-6 rounded-xl border border-slate-200 p-4">
                  <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Verification Documents</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {selected.udyamNumber && <DetailRow icon={FileText} label="Udyam Number" value={selected.udyamNumber} />}
                    {selected.regCertificate && (
                      <DetailRow icon={FileText} label="Registration Certificate" value={
                        <a href={selected.regCertificate} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">View Certificate <ExternalLink className="size-3" /></a>
                      } />
                    )}
                    {selected.idProof && (
                      <DetailRow icon={Image} label="ID Proof" value={
                        <a href={selected.idProof} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-100">View ID Proof <ExternalLink className="size-3" /></a>
                      } />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Ban, CheckCircle2, BadgeCheck, BadgeX, Building2, Edit3 } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t) }, [value, delay])
  return debounced
}

export default function AdminCompanies() {
  const [search, setSearch] = useState('')
  const [filterVerification, setFilterVerification] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [page, setPage] = useState(1)
  const [companies, setCompanies] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [overrideId, setOverrideId] = useState(null)
  const [overrideForm, setOverrideForm] = useState({})
  const limit = 20

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit, ...(debouncedSearch ? { search: debouncedSearch } : {}), ...(filterVerification ? { verified: filterVerification } : {}) })
    return api.get(`/api/admin/companies?${params}`)
      .then(data => { setCompanies(data.companies || []); setTotal(data.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, debouncedSearch, filterVerification])
  useEffect(() => { setPage(1) }, [debouncedSearch, filterVerification])

  const toggleBlock = async (c) => {
    const action = c.isBlocked ? 'unblock' : 'block'
    setCompanies(prev => prev.map(x => (x._id === c._id ? { ...x, isBlocked: !c.isBlocked } : x)))
    try { await api.patch(`/api/admin/users/${c._id}/${action}`) }
    catch (err) { toast.error(err.message || `Could not ${action} company`); load() }
  }

  const toggleVerify = async (c) => {
    const action = c.isVerified ? 'unverify' : 'verify'
    setCompanies(prev => prev.map(x => (x._id === c._id ? { ...x, isVerified: !c.isVerified } : x)))
    try {
      await api.patch(`/api/admin/companies/${c._id}/${action}`)
      toast.success(c.isVerified ? 'Verification removed' : 'Company verified')
    } catch (err) { toast.error(err.message || `Could not ${action} company`); load() }
  }

  const startOverride = (c) => {
    const profile = c.companyProfile || {}
    setOverrideForm({
      name: profile.name || '',
      website: profile.website || '',
      location: profile.location || '',
      size: profile.size || '',
      industry: profile.industry || '',
      description: profile.description || '',
      email: profile.email || '',
    })
    setOverrideId(c._id)
  }

  const saveOverride = async () => {
    try {
      await api.put(`/api/admin/companies/${overrideId}/profile`, overrideForm)
      toast.success('Profile updated')
      setOverrideId(null)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <DashboardLayout>
      <header className="px-4 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-4">
            <ArrowLeft className="size-4" /> Back to admin
          </Link>
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Manage Companies</h1>
          <p className="mt-1 text-slate-500">{loading ? 'Loading...' : `${total} companies`}</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6 sm:px-6 sm:py-10">
        <div className="flex gap-3 flex-wrap">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email"
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex gap-2">
            {['', 'true', 'false'].map(v => (
              <button key={v} onClick={() => setFilterVerification(v)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                  filterVerification === v ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}>
                {v === '' ? 'All' : v === 'true' ? 'Verified' : 'Unverified'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-2xl border border-slate-200 sm:block">
              <table className="w-full min-w-[800px] text-sm">
                <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Name</th>
                    <th className="px-6 py-3">Email</th>
                    <th className="px-6 py-3">Location</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Verified</th>
                    <th className="px-6 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {companies.map(c => (
                    <tr key={c._id} className="hover:bg-surface">
                      {overrideId === c._id ? (
                        <td colSpan={6} className="px-6 py-4">
                          <div className="grid gap-3 sm:grid-cols-3">
                            <input value={overrideForm.name} onChange={e => setOverrideForm(f => ({ ...f, name: e.target.value }))} placeholder="Company Name" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary" />
                            <input value={overrideForm.website} onChange={e => setOverrideForm(f => ({ ...f, website: e.target.value }))} placeholder="Website" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary" />
                            <input value={overrideForm.location} onChange={e => setOverrideForm(f => ({ ...f, location: e.target.value }))} placeholder="Location" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary" />
                            <input value={overrideForm.size} onChange={e => setOverrideForm(f => ({ ...f, size: e.target.value }))} placeholder="Size" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary" />
                            <input value={overrideForm.industry} onChange={e => setOverrideForm(f => ({ ...f, industry: e.target.value }))} placeholder="Industry" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary" />
                            <input value={overrideForm.email} onChange={e => setOverrideForm(f => ({ ...f, email: e.target.value }))} placeholder="Email" className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary" />
                            <div className="col-span-full">
                              <textarea value={overrideForm.description} onChange={e => setOverrideForm(f => ({ ...f, description: e.target.value }))} placeholder="Description" rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary" />
                            </div>
                            <div className="col-span-full flex gap-2">
                              <button onClick={saveOverride} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-bold text-white">Save Override</button>
                              <button onClick={() => setOverrideId(null)} className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-bold text-slate-600">Cancel</button>
                            </div>
                          </div>
                        </td>
                      ) : (
                        <>
                          <td className="px-6 py-4 font-semibold">
                            <span className="flex items-center gap-1.5">
                              {c.companyName || c.name}
                              {c.isVerified && <BadgeCheck className="size-3.5 text-blue-500" title="Verified" />}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-slate-600">{c.email}</td>
                          <td className="px-6 py-4 text-slate-500 text-xs">{c.companyProfile?.location || '—'}</td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.isBlocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                              {c.isBlocked ? 'Blocked' : 'Active'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.isVerified ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                              {c.isVerified ? '✓ Verified' : 'Unverified'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button onClick={() => toggleVerify(c)} title={c.isVerified ? 'Remove verification' : 'Verify company'}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${c.isVerified ? 'border-slate-200 text-slate-600 hover:bg-slate-50' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}`}>
                                {c.isVerified ? <><BadgeX className="size-3.5" /> Unverify</> : <><BadgeCheck className="size-3.5" /> Verify</>}
                              </button>
                              <button onClick={() => toggleBlock(c)}
                                className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${c.isBlocked ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-rose-200 text-rose-700 hover:bg-rose-50'}`}>
                                {c.isBlocked ? <><CheckCircle2 className="size-3.5" /> Unblock</> : <><Ban className="size-3.5" /> Block</>}
                              </button>
                              <button onClick={() => startOverride(c)} title="Override Profile"
                                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                                <Edit3 className="size-3.5" /> Override
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              {companies.length === 0 && <div className="p-12 text-center text-slate-400">No companies found.</div>}
            </div>

            {/* Mobile cards */}
            <div className="space-y-3 sm:hidden">
              {companies.map(c => (
                <div key={c._id} className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm flex items-center gap-1">{c.companyName || c.name}{c.isVerified && <BadgeCheck className="size-3.5 text-blue-500" />}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{c.email}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{c.companyProfile?.location || ''}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${c.isBlocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>{c.isBlocked ? 'Blocked' : 'Active'}</span>
                      {c.isVerified && <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-700">✓ Verified</span>}
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <button onClick={() => toggleVerify(c)} className={`rounded-lg border py-1.5 text-xs font-bold ${c.isVerified ? 'border-slate-200 text-slate-600' : 'border-blue-200 text-blue-700'}`}>{c.isVerified ? 'Unverify' : 'Verify'}</button>
                    <button onClick={() => toggleBlock(c)} className={`rounded-lg border py-1.5 text-xs font-bold ${c.isBlocked ? 'border-emerald-200 text-emerald-700' : 'border-rose-200 text-rose-700'}`}>{c.isBlocked ? 'Unblock' : 'Block'}</button>
                    <button onClick={() => startOverride(c)} className="rounded-lg border border-slate-200 py-1.5 text-xs font-bold text-slate-600">Override</button>
                  </div>
                </div>
              ))}
              {companies.length === 0 && <div className="text-center text-slate-400 py-12">No companies found.</div>}
            </div>
          </>
        )}

        <Pagination page={page} pages={pages} onChange={setPage} />
      </main>
    </DashboardLayout>
  )
}

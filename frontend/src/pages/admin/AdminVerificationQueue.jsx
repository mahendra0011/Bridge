import { useEffect, useState } from 'react'
import { BadgeCheck, BadgeX, FileText, Search, ShieldCheck, X, Building2, Globe, MapPin, Calendar, Briefcase, Hash, ExternalLink, Image, Users } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'

export default function AdminVerificationQueue() {
  const [page, setPage] = useState(1)
  const [companies, setCompanies] = useState([])
  const [agencies, setAgencies] = useState([])
  const [total, setTotal] = useState(0)
  const [agenciesTotal, setAgenciesTotal] = useState(0)
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingAgenciesCount, setPendingAgenciesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [entityType, setEntityType] = useState('company')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState(null)
  const limit = 20

  const load = () => {
    setLoading(true)
    api.get(`/api/admin/verification-queue?page=${page}&limit=${limit}&entityType=${entityType}`)
      .then(data => {
        setCompanies(data.companies || [])
        setAgencies(data.agencies || [])
        setTotal(data.total || 0)
        setAgenciesTotal(data.agenciesTotal || 0)
        setPendingCount(data.pendingCount || 0)
        setPendingAgenciesCount(data.pendingAgenciesCount || 0)
      })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, entityType])

  const toggleVerify = async (entity, type) => {
    const action = entity.isVerified ? 'unverify' : 'verify'
    if (type === 'agency') {
      setAgencies(prev => prev.map(x => (x._id === entity._id ? { ...x, isVerified: !entity.isVerified } : x)))
      try {
        await api.patch(`/api/admin/agencies/${entity._id}/${action}`)
        toast.success(entity.isVerified ? 'Verification removed' : 'Agency verified')
      } catch (err) {
        toast.error(err.message)
        load()
      }
    } else {
      setCompanies(prev => prev.map(x => (x._id === entity._id ? { ...x, isVerified: !entity.isVerified } : x)))
      if (selected?._id === entity._id) setSelected(prev => prev ? { ...prev, isVerified: !entity.isVerified } : prev)
      try {
        await api.patch(`/api/admin/companies/${entity.user?._id}/${action}`)
        toast.success(entity.isVerified ? 'Verification removed' : 'Company verified')
      } catch (err) {
        toast.error(err.message)
        load()
      }
    }
  }

  const entities = entityType === 'agency' ? agencies : companies
  const filtered = entities.filter(e => {
    if (entityType === 'agency') {
      if (filter === 'pending' && e.isVerified) return false
      if (filter === 'verified' && !e.isVerified) return false
      if (search && !(e.agencyName || '').toLowerCase().includes(search.toLowerCase())) return false
    } else {
      if (filter === 'pending' && e.isVerified) return false
      if (filter === 'verified' && !e.isVerified) return false
      if (search && !e.name.toLowerCase().includes(search.toLowerCase()) && !(e.email || e.user?.email || '').toLowerCase().includes(search.toLowerCase())) return false
    }
    return true
  })

  const pages = Math.max(1, Math.ceil((entityType === 'agency' ? agenciesTotal : total) / limit))

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
          <h1 className="text-2xl font-extrabold tracking-tight">Verification Queue</h1>
          <p className="mt-1 text-sm text-slate-500">
            {loading ? 'Loading...' : `${entityType === 'agency' ? agenciesTotal : total} ${entityType === 'agency' ? 'agencies' : 'companies'} · ${entityType === 'agency' ? pendingAgenciesCount : pendingCount} pending verification`}
          </p>
        </div>

        {/* Entity Type Tabs */}
        <div className="flex gap-2 rounded-xl border border-slate-200 p-0.5 w-fit">
          {['company', 'agency'].map(t => (
            <button key={t} onClick={() => setEntityType(t)}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${entityType === t ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}>
              {t === 'company' ? 'Companies' : 'Agencies'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder={`Search ${entityType === 'agency' ? 'agencies' : 'companies'}...`} className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-4 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex gap-1 rounded-xl border border-slate-200 p-0.5">
            {['all', 'pending', 'verified'].map(f => (
              <button key={f} onClick={() => { setFilter(f); setPage(1) }} className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${filter === f ? 'bg-primary text-white' : 'text-slate-500 hover:text-slate-800'}`}>{f}</button>
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
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">Contact</th>
                  <th className="px-6 py-3">Signup Step</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Verified</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => (
                  <tr key={c._id} className={`hover:bg-slate-50 cursor-pointer transition-colors ${selected?._id === c._id ? 'bg-blue-50' : ''}`} onClick={() => setSelected(c)}>
                    <td className="px-6 py-4 font-semibold flex items-center gap-2">
                      <div className="size-8 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                        {c.logoUrl ? <img src={c.logoUrl} alt="" className="size-full object-cover" /> : <Building2 className="size-4 text-slate-400 m-auto mt-2" />}
                      </div>
                      <div className="min-w-0">
                        <span className="block truncate max-w-[200px]">{c.name}</span>
                        {(c.isVerified || c.likelyVerified) && (
                          <span className="flex items-center gap-1 text-[10px]">
                            {c.isVerified && <><BadgeCheck className="size-3 text-blue-500" /> <span className="text-blue-600">Verified</span></>}
                            {!c.isVerified && c.likelyVerified && <span className="text-green-600">Likely Verified</span>}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{c.email || c.user?.email || '—'}</td>
                    <td className="px-6 py-4 text-slate-600 text-xs">
                      {c.contactPerson ? <><span className="block">{c.contactPerson}</span><span className="text-slate-400">{c.designation || ''}</span></> : '—'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                        c.signupStep === 3 ? 'bg-emerald-50 text-emerald-700' : c.signupStep === 2 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                      }`}>Step {c.signupStep}/3</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${c.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                        {c.isVerified ? 'Verified' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleVerify(c, entityType) }}
                        className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                          c.isVerified
                            ? 'border-slate-200 text-slate-600 hover:bg-slate-50'
                            : 'border-blue-200 text-blue-700 hover:bg-blue-50'
                        }`}
                      >
                        {c.isVerified ? <><BadgeX className="size-3.5" /> Revoke</> : <><BadgeCheck className="size-3.5" /> Approve</>}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="p-12 text-center text-slate-400">No companies found.</div>
            )}
          </div>
        )}
        <Pagination page={page} pages={pages} onChange={setPage} />
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="mb-6 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                  {selected.logoUrl ? <img src={selected.logoUrl} alt="" className="size-full object-cover" /> : <Building2 className="size-7 text-slate-400 m-auto mt-3.5" />}
                </div>
                <div>
                  <h2 className="text-xl font-bold">{selected.name}</h2>
                  <p className="text-sm text-slate-500">{selected.email || selected.user?.email}</p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${selected.isVerified ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {selected.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                    {selected.likelyVerified && !selected.isVerified && (
                      <span className="rounded-full bg-green-50 px-2.5 py-0.5 text-[11px] font-bold text-green-700">Likely Verified</span>
                    )}
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                      selected.signupStep === 3 ? 'bg-emerald-50 text-emerald-700' : selected.signupStep === 2 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                    }`}>Signup Step {selected.signupStep}/3</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelected(null)} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                <X className="size-5" />
              </button>
            </div>

            <div className="mb-6 grid gap-4 sm:grid-cols-2">
              <DetailRow icon={Building2} label="Industry" value={selected.industry} />
              <DetailRow icon={Users} label="Company Size" value={selected.size} />
              <DetailRow icon={MapPin} label="HQ Location" value={selected.hqLocation} />
              <DetailRow icon={Calendar} label="Founded Year" value={selected.foundedYear} />
              {selected.website && (
                <DetailRow icon={Globe} label="Website" value={
                  <a href={selected.website.startsWith('http') ? selected.website : `https://${selected.website}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline underline-offset-2 inline-flex items-center gap-1">{selected.website} <ExternalLink className="size-3" /></a>
                } />
              )}
              {selected.linkedin && (
                <DetailRow icon={ExternalLink} label="LinkedIn" value={
                  <a href={selected.linkedin.startsWith('http') ? selected.linkedin : `https://${selected.linkedin}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline underline-offset-2 inline-flex items-center gap-1">{selected.linkedin.replace(/^https?:\/\//, '').replace(/\/$/, '')} <ExternalLink className="size-3" /></a>
                } />
              )}
              <DetailRow icon={FileText} label="Description" value={selected.description} />
            </div>

            <div className="mb-6 rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Contact Person</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow icon={Users} label="Name" value={selected.contactPerson} />
                <DetailRow icon={Briefcase} label="Designation" value={selected.designation} />
              </div>
            </div>

            <div className="mb-6 rounded-xl border border-slate-200 p-4">
              <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-slate-500">Verification Documents</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <DetailRow icon={Hash} label="Registration Number (GSTIN/CIN)" value={selected.regNumber} />
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
                {!selected.regCertificate && !selected.idProof && (
                  <p className="col-span-full text-sm text-slate-400">No documents uploaded yet.</p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button onClick={() => { toggleVerify(selected, entityType); setSelected(null) }} className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-colors ${
                selected.isVerified
                  ? 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                  : 'bg-primary text-white hover:bg-primary/90'
              }`}>
                {selected.isVerified ? <><BadgeX className="size-4" /> Revoke Verification</> : <><BadgeCheck className="size-4" /> Approve & Grant Badge</>}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Search, Ban, CheckCircle2, ShieldCheck, UserCog } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'

function useDebouncedValue(value, delay) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => { const t = setTimeout(() => setDebounced(value), delay); return () => clearTimeout(t) }, [value, delay])
  return debounced
}

export default function AdminStudents() {
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 400)
  const [page, setPage] = useState(1)
  const [students, setStudents] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [assignRole, setAssignRole] = useState(null)
  const limit = 20

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit, ...(debouncedSearch ? { search: debouncedSearch } : {}) })
    return api.get(`/api/admin/students?${params}`)
      .then(data => { setStudents(data.students || []); setTotal(data.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, debouncedSearch])
  useEffect(() => { setPage(1) }, [debouncedSearch])

  const toggleBlock = async (s) => {
    const action = s.isBlocked ? 'unblock' : 'block'
    setStudents(prev => prev.map(x => (x._id === s._id ? { ...x, isBlocked: !s.isBlocked } : x)))
    try { await api.patch(`/api/admin/users/${s._id}/${action}`) }
    catch (err) { toast.error(err.message || `Could not ${action} student`); load() }
  }

  const handleRoleAssign = async (id) => {
    try {
      await api.patch(`/api/admin/users/${id}/role`, { role: assignRole })
      toast.success(`Role changed to ${assignRole}`)
      setAssignRole(null)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <DashboardLayout>
      <header className="px-6 py-8 sm:py-10">
        <div className="mx-auto max-w-7xl">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-4">
            <ArrowLeft className="size-4" /> Back to admin
          </Link>
          <h1 className="text-3xl font-extrabold tracking-tight">Manage Students</h1>
          <p className="mt-1 text-slate-500">{loading ? 'Loading...' : `${total} students`}</p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 pb-10 space-y-6">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or email"
            className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary" />
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Email</th>
                  <th className="px-6 py-3">College</th>
                  <th className="px-6 py-3">Joined</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => (
                  <tr key={s._id} className="hover:bg-surface">
                    <td className="px-6 py-4 font-semibold">{s.name}</td>
                    <td className="px-6 py-4 text-slate-600">{s.email}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs">{s.college || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">{new Date(s.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${s.isBlocked ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'}`}>
                        {s.isBlocked ? 'Blocked' : 'Active'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 capitalize">{s.role}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleBlock(s)}
                          className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-bold transition-colors ${
                            s.isBlocked ? 'border-emerald-200 text-emerald-700 hover:bg-emerald-50' : 'border-rose-200 text-rose-700 hover:bg-rose-50'
                          }`}>
                          {s.isBlocked ? <><CheckCircle2 className="size-3.5" /> Unblock</> : <><Ban className="size-3.5" /> Block</>}
                        </button>
                        {assignRole === s._id ? (
                          <div className="flex items-center gap-1">
                            <select onChange={e => setAssignRole(e.target.value)} value={assignRole}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none">
                              <option value="student">Student</option>
                              <option value="company">Company</option>
                            </select>
                            <button onClick={() => handleRoleAssign(s._id)}
                              className="rounded-lg bg-primary px-2 py-1 text-xs font-bold text-white">Save</button>
                            <button onClick={() => setAssignRole(null)}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-600">X</button>
                          </div>
                        ) : (
                          <button onClick={() => setAssignRole(s._id)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50">
                            <UserCog className="size-3.5" /> Role
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && <div className="p-12 text-center text-slate-400">No students found.</div>}
          </div>
        )}

        <Pagination page={page} pages={pages} onChange={setPage} />
      </main>
    </DashboardLayout>
  )
}

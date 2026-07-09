import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Search, Bookmark, X, Trash2, Bell, BellOff, ArrowLeft, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

export default function SavedSearches() {
  const [searches, setSearches] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const load = () => {
    setLoading(true)
    api.get('/api/student/saved-searches')
      .then(data => setSearches(data.searches || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const remove = async (id) => {
    try {
      await api.delete(`/api/student/saved-searches/${id}`)
      setSearches(p => p.filter(s => s._id !== id))
      toast.success('Search removed')
    } catch (err) { toast.error(err.message) }
  }

  const toggleNotify = async (search) => {
    try {
      const res = await api.put(`/api/student/saved-searches/${search._id}`, { notify: !search.notify })
      setSearches(p => p.map(s => s._id === search._id ? res.search : s))
    } catch (err) { toast.error(err.message) }
  }

  const buildUrl = (search) => {
    const kind = search.kind === 'both' ? 'jobs' : `${search.kind}s`
    const params = new URLSearchParams()
    if (search.filters?.query) params.set('query', search.filters.query)
    if (search.filters?.location) params.set('location', search.filters.location)
    if (search.filters?.mode) params.set('mode', search.filters.mode)
    if (search.filters?.category) params.set('category', search.filters.category)
    if (search.filters?.skills?.length) params.set('skills', search.filters.skills.join(','))
    return `/${kind}?${params.toString()}`
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-2">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Saved Searches</h1>
          <p className="mt-1 text-sm text-slate-500">Quickly revisit your filtered searches.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : searches.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
            <Bookmark className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-semibold text-slate-600">No saved searches</p>
            <p className="mt-1 text-sm">When browsing jobs or internships, use the "Save Search" button to save your filters.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link to="/jobs" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90">Browse Jobs</Link>
              <Link to="/internships" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary">Browse Internships</Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map(s => (
              <div key={s._id} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Search className="size-4 text-primary shrink-0" />
                      <h3 className="font-bold truncate">{s.name}</h3>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500 capitalize">{s.kind}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                      {s.filters?.query && <span className="rounded-md bg-slate-50 px-2 py-0.5">"{s.filters.query}"</span>}
                      {s.filters?.location && <span className="rounded-md bg-slate-50 px-2 py-0.5">📍 {s.filters.location}</span>}
                      {s.filters?.mode && <span className="rounded-md bg-slate-50 px-2 py-0.5">💼 {s.filters.mode}</span>}
                      {s.filters?.category && <span className="rounded-md bg-slate-50 px-2 py-0.5">🏷️ {s.filters.category}</span>}
                      {(s.filters?.salaryMin || s.filters?.salaryMax) && <span className="rounded-md bg-slate-50 px-2 py-0.5">💰 ₹{s.filters.salaryMin || 0}L - ₹{s.filters.salaryMax || '∞'}L</span>}
                      {(s.filters?.stipendMin || s.filters?.stipendMax) && <span className="rounded-md bg-slate-50 px-2 py-0.5">💰 ₹{s.filters.stipendMin || 0} - ₹{s.filters.stipendMax || '∞'}</span>}
                      {s.filters?.skills?.length > 0 && <span className="rounded-md bg-slate-50 px-2 py-0.5">🔧 {s.filters.skills.join(', ')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 ml-3 shrink-0">
                    <button onClick={() => toggleNotify(s)} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-primary hover:text-primary" title={s.notify ? 'Notifications on' : 'Notifications off'}>
                      {s.notify ? <Bell className="size-3.5" /> : <BellOff className="size-3.5" />}
                    </button>
                    <Link to={buildUrl(s)} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-primary hover:text-primary" title="Run search">
                      <ExternalLink className="size-3.5" />
                    </Link>
                    <button onClick={() => remove(s._id)} className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-400 hover:border-rose-400 hover:text-rose-600" title="Delete">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

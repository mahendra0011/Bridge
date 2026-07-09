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
      <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div>
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-2">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold sm:text-3xl bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Saved Searches</h1>
          <p className="mt-1 text-sm text-slate-500">Quickly revisit your filtered searches and get alerts for new matches.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-gradient-to-r from-slate-100 to-slate-200/50" />
            ))}
          </div>
        ) : searches.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <div className="absolute -right-10 -top-10 size-48 rounded-full bg-primary/5" />
            <div className="absolute -bottom-8 -left-8 size-36 rounded-full bg-violet-500/5" />
            <Bookmark className="mx-auto mb-3 size-12 text-primary" />
            <p className="font-semibold text-slate-700">No saved searches yet</p>
            <p className="mt-1 text-sm text-slate-500">When browsing jobs or internships, use the "Save Search" button to save your filters.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/jobs" className="rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:scale-105">
                Browse Jobs
              </Link>
              <Link to="/internships" className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-bold text-slate-600 shadow-sm transition-all hover:border-primary hover:text-primary hover:shadow-md">
                Browse Internships
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {searches.map((s, idx) => (
              <div key={s._id} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-white to-slate-50/30 p-5 transition-all hover:shadow-lg hover:border-primary/20">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <Search className="size-4 text-primary shrink-0" />
                      <h3 className="font-bold truncate text-slate-800 group-hover:text-primary">{s.name}</h3>
                      <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary capitalize border border-primary/20">
                        {s.kind === 'both' ? 'All' : s.kind}
                      </span>
                      {s.notify && (
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-600 border border-emerald-200">
                          <Bell className="size-2.5" /> Alerts On
                        </span>
                      )}
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      {s.filters?.query && <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 font-medium text-slate-700 shadow-sm">"{s.filters.query}"</span>}
                      {s.filters?.location && <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 shadow-sm">📍 {s.filters.location}</span>}
                      {s.filters?.mode && <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 shadow-sm">💼 {s.filters.mode}</span>}
                      {s.filters?.category && <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 shadow-sm">🏷️ {s.filters.category}</span>}
                      {(s.filters?.salaryMin || s.filters?.salaryMax) && <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 shadow-sm">💰 ₹{s.filters.salaryMin || 0}L - ₹{s.filters.salaryMax || '∞'}L</span>}
                      {(s.filters?.stipendMin || s.filters?.stipendMax) && <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 shadow-sm">💰 ₹{s.filters.stipendMin || 0} - ₹{s.filters.stipendMax || '∞'}</span>}
                      {s.filters?.skills?.length > 0 && <span className="rounded-md bg-white border border-slate-200 px-2.5 py-1 shadow-sm">🔧 {s.filters.skills.join(', ')}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-3 shrink-0">
                    <button 
                      onClick={() => toggleNotify(s)} 
                      className={`grid size-9 place-items-center rounded-lg border text-sm transition-all hover:scale-105 ${s.notify ? 'border-emerald-300 bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'border-slate-200 bg-white text-slate-400 hover:border-primary hover:bg-primary/5 hover:text-primary'}`} 
                      title={s.notify ? 'Notifications on' : 'Notifications off'}
                    >
                      {s.notify ? <Bell className="size-4" /> : <BellOff className="size-4" />}
                    </button>
                    <Link 
                      to={buildUrl(s)} 
                      className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:scale-105 hover:border-primary hover:bg-primary/5 hover:text-primary" 
                      title="Run search"
                    >
                      <ExternalLink className="size-4" />
                    </Link>
                    <button 
                      onClick={() => remove(s._id)} 
                      className="grid size-9 place-items-center rounded-lg border border-slate-200 bg-white text-slate-400 transition-all hover:scale-105 hover:border-rose-400 hover:bg-rose-50 hover:text-rose-600" 
                      title="Delete"
                    >
                      <Trash2 className="size-4" />
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

import { useEffect, useState } from 'react'
import { Bell, BellOff, Plus, Trash2, Search } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

export default function SavedSearchAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', kind: 'both', frequency: 'instant' })

  const load = () => {
    setLoading(true)
    api.get('/api/student/saved-searches')
      .then(data => setAlerts(data.alerts || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await api.post('/api/student/saved-searches', form)
      toast.success('Alert created')
      setShowForm(false)
      setForm({ name: '', kind: 'both', frequency: 'instant' })
      load()
    } catch (err) { toast.error(err.message) }
  }

  const toggleActive = async (alert) => {
    try {
      await api.put(`/api/student/saved-searches/${alert._id}`, { isActive: !alert.isActive })
      setAlerts(prev => prev.map(a => a._id === alert._id ? { ...a, isActive: !a.isActive } : a))
      toast.success(alert.isActive ? 'Alert paused' : 'Alert activated')
    } catch (err) { toast.error(err.message) }
  }

  const deleteAlert = async (id) => {
    if (!confirm('Delete this alert?')) return
    try {
      await api.delete(`/api/student/saved-searches/${id}`)
      toast.success('Deleted')
      load()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Saved Search Alerts</h1>
            <p className="mt-1 text-sm text-slate-500">Get notified when new opportunities match your filters</p>
          </div>
          <button onClick={() => setShowForm(!showForm)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
            <Plus className="size-4" /> New Alert
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleCreate} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h3 className="font-bold">Create Search Alert</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Alert Name</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. React jobs in Bangalore"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" required />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Type</label>
                <select value={form.kind} onChange={e => setForm(f => ({ ...f, kind: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="both">Both</option>
                  <option value="internship">Internships</option>
                  <option value="job">Jobs</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Frequency</label>
                <select value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="instant">Instant</option>
                  <option value="daily">Daily Digest</option>
                  <option value="weekly">Weekly Digest</option>
                </select>
              </div>
            </div>
            <p className="text-xs text-slate-400">Filters from your current search will be saved automatically. Set up filters on the search page and click "Save Alert".</p>
            <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">Create Alert</button>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : alerts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Search className="size-8 mx-auto mb-3 opacity-50" />
            <p>No saved search alerts yet.</p>
            <p className="text-xs mt-1">Set up filters on the jobs or internships page, then save the search to get alerts.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map(a => (
              <div key={a._id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${a.isActive ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-400'}`}>
                      {a.isActive ? <Bell className="size-5" /> : <BellOff className="size-5" />}
                    </div>
                    <div>
                      <h3 className="font-bold">{a.name}</h3>
                      <p className="text-xs text-slate-500">
                        {a.kind === 'both' ? 'Jobs & Internships' : a.kind === 'job' ? 'Jobs' : 'Internships'}
                        {' · '}{a.frequency}
                        {a.lastNotified && ` · Last notified ${new Date(a.lastNotified).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => toggleActive(a)}
                      className={`rounded-lg p-2 text-xs font-bold transition-colors ${a.isActive ? 'text-amber-600 hover:bg-amber-50' : 'text-emerald-600 hover:bg-emerald-50'}`}>
                      {a.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button onClick={() => deleteAlert(a._id)} className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
                {a.filters && Object.keys(a.filters).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {Object.entries(a.filters).filter(([_, v]) => v).map(([k, v]) => (
                      <span key={k} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600">
                        {k}: {Array.isArray(v) ? v.join(', ') : String(v)}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

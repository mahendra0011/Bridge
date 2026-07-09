import { useEffect, useState } from 'react'
import { Megaphone, Plus, Trash2, Edit3, Send } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

export default function AdminAnnouncements() {
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', type: 'info', audience: 'all', priority: 'normal' })

  const load = () => {
    setLoading(true)
    api.get('/api/admin/announcements')
      .then(data => setAnnouncements(data.announcements || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/api/admin/announcements/${editing._id}`, form)
        toast.success('Announcement updated')
      } else {
        await api.post('/api/admin/announcements', form)
        toast.success('Announcement created & broadcast')
      }
      setShowForm(false)
      setEditing(null)
      setForm({ title: '', content: '', type: 'info', audience: 'all', priority: 'normal' })
      load()
    } catch (err) { toast.error(err.message) }
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this announcement?')) return
    try {
      await api.delete(`/api/admin/announcements/${id}`)
      toast.success('Deleted')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const editItem = (a) => {
    setForm({ title: a.title, content: a.content, type: a.type, audience: a.audience, priority: a.priority })
    setEditing(a)
    setShowForm(true)
  }

  const typeColors = { info: 'bg-blue-50 text-blue-700', warning: 'bg-amber-50 text-amber-700', update: 'bg-emerald-50 text-emerald-700', maintenance: 'bg-rose-50 text-rose-700' }
  const priorityIcons = { low: '🟢', normal: '🟡', high: '🔴' }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Announcements</h1>
            <p className="mt-1 text-sm text-slate-500">Platform-wide broadcasts and notifications</p>
          </div>
          <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ title: '', content: '', type: 'info', audience: 'all', priority: 'normal' }) }}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
            <Plus className="size-4" /> New
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h3 className="font-bold">{editing ? 'Edit Announcement' : 'New Announcement'}</h3>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Content</label>
              <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required rows={4}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1" />
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Type</label>
                <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1">
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="update">Update</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Audience</label>
                <select value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1">
                  <option value="all">All Users</option>
                  <option value="students">Students Only</option>
                  <option value="companies">Companies Only</option>
                  <option value="admins">Admins Only</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Priority</label>
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1">
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
                <Send className="size-4" /> {editing ? 'Update' : 'Publish'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
            </div>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No announcements yet.</div>
        ) : (
          <div className="space-y-3">
            {announcements.map(a => (
              <div key={a._id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="pt-0.5 text-lg">{priorityIcons[a.priority] || '🟡'}</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold">{a.title}</h3>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${typeColors[a.type] || ''}`}>{a.type}</span>
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">{a.audience}</span>
                        {!a.isActive && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-400">Inactive</span>}
                      </div>
                      <p className="text-sm text-slate-600 mt-1.5 whitespace-pre-wrap">{a.content}</p>
                      <p className="text-xs text-slate-400 mt-2">
                        by {a.createdBy?.name || 'Admin'} · {new Date(a.createdAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => editItem(a)} className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><Edit3 className="size-3.5" /></button>
                    <button onClick={() => deleteItem(a._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600"><Trash2 className="size-3.5" /></button>
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

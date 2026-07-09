import { useEffect, useState } from 'react'
import { Database, Plus, Trash2, Edit3, Tags, MapPin, FolderTree } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

const TABS = [
  { key: 'skill', label: 'Skills', icon: Tags },
  { key: 'category', label: 'Categories', icon: FolderTree },
  { key: 'location', label: 'Locations', icon: MapPin },
]

export default function AdminMasterData() {
  const [type, setType] = useState('skill')
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState(null)
  const [editName, setEditName] = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/api/admin/master-data?type=${type}`)
      .then(data => setItems(data.items || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [type])

  const addItem = async () => {
    if (!newName.trim()) return
    try {
      await api.post('/api/admin/master-data', { type, name: newName.trim() })
      setNewName('')
      toast.success('Added')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const updateItem = async (id) => {
    if (!editName.trim()) return
    try {
      await api.put(`/api/admin/master-data/${id}`, { name: editName.trim() })
      setEditing(null)
      toast.success('Updated')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const deleteItem = async (id) => {
    if (!confirm('Delete this item?')) return
    try {
      await api.delete(`/api/admin/master-data/${id}`)
      toast.success('Deleted')
      load()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Master Data</h1>
          <p className="mt-1 text-sm text-slate-500">Manage skills, categories, and locations</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          {TABS.map(t => (
            <button key={t.key} onClick={() => setType(t.key)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-bold transition-colors ${type === t.key ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Add new */}
        <div className="flex gap-2">
          <input value={newName} onChange={e => setNewName(e.target.value)} placeholder={`Add new ${type}...`}
            className="flex-1 max-w-sm rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
            onKeyDown={e => { if (e.key === 'Enter') addItem() }} />
          <button onClick={addItem} disabled={!newName.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
            <Plus className="size-4" /> Add
          </button>
        </div>

        {/* Items */}
        {loading ? (
          <div className="space-y-2">{Array.from({ length: 8 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No items found. Add your first {type} above.</div>
        ) : (
          <div className="space-y-2">
            {items.map(item => (
              <div key={item._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-3">
                {editing === item._id ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-primary"
                      onKeyDown={e => { if (e.key === 'Enter') updateItem(item._id) }} />
                    <button onClick={() => updateItem(item._id)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white">Save</button>
                    <button onClick={() => setEditing(null)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600">Cancel</button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">{item.name}</span>
                      {item.slug && <span className="text-[11px] text-slate-400">({item.slug})</span>}
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${item.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {item.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => { setEditing(item._id); setEditName(item.name) }}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600">
                        <Edit3 className="size-3.5" />
                      </button>
                      <button onClick={() => deleteItem(item._id)}
                        className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

import { useEffect, useState } from 'react'
import { CreditCard, Plus, Trash2, Edit3, DollarSign, TrendingUp, FileText } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

export default function AdminBilling() {
  const [tab, setTab] = useState('plans')
  const [plans, setPlans] = useState([])
  const [invoices, setInvoices] = useState([])
  const [revenue, setRevenue] = useState(0)
  const [paidInvoices, setPaidInvoices] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ name: '', description: '', price: 0, duration: 'monthly', jobPostLimit: 0, featuredLimit: 0, hasBadge: false, hasPriority: false, features: [] })
  const [featureInput, setFeatureInput] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const limit = 20

  const loadPlans = async () => {
    try {
      const data = await api.get('/api/admin/plans')
      setPlans(data.plans || [])
    } catch (err) { toast.error(err.message) }
  }

  const loadInvoices = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/api/admin/invoices?page=${page}&limit=${limit}`)
      setInvoices(data.invoices || [])
      setTotal(data.total || 0)
      setRevenue(data.revenue || 0)
      setPaidInvoices(data.paidInvoices || 0)
    } catch (err) { toast.error(err.message) }
    finally { setLoading(false) }
  }

  useEffect(() => {
    loadPlans()
    loadInvoices()
  }, [page])

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editing) {
        await api.put(`/api/admin/plans/${editing._id}`, form)
        toast.success('Plan updated')
      } else {
        await api.post('/api/admin/plans', form)
        toast.success('Plan created')
      }
      setShowForm(false)
      setEditing(null)
      setForm({ name: '', description: '', price: 0, duration: 'monthly', jobPostLimit: 0, featuredLimit: 0, hasBadge: false, hasPriority: false, features: [] })
      loadPlans()
    } catch (err) { toast.error(err.message) }
  }

  const deletePlan = async (id) => {
    if (!confirm('Delete this plan?')) return
    try {
      await api.delete(`/api/admin/plans/${id}`)
      toast.success('Plan deleted')
      loadPlans()
    } catch (err) { toast.error(err.message) }
  }

  const editPlan = (p) => {
    setForm({ name: p.name, description: p.description || '', price: p.price, duration: p.duration, jobPostLimit: p.jobPostLimit, featuredLimit: p.featuredLimit, hasBadge: p.hasBadge, hasPriority: p.hasPriority, features: p.features || [] })
    setEditing(p)
    setShowForm(true)
  }

  const addFeature = () => {
    if (featureInput.trim()) {
      setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }))
      setFeatureInput('')
    }
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Billing & Plans</h1>
          <p className="mt-1 text-sm text-slate-500">Manage subscription plans and view revenue</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button onClick={() => setTab('plans')} className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${tab === 'plans' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <CreditCard className="inline size-4 mr-1.5" />Plans
          </button>
          <button onClick={() => setTab('invoices')} className={`rounded-lg px-4 py-2 text-sm font-bold transition-colors ${tab === 'invoices' ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
            <FileText className="inline size-4 mr-1.5" />Invoices & Revenue
          </button>
        </div>

        {tab === 'plans' && (
          <>
            <button onClick={() => { setShowForm(!showForm); setEditing(null); setForm({ name: '', description: '', price: 0, duration: 'monthly', jobPostLimit: 0, featuredLimit: 0, hasBadge: false, hasPriority: false, features: [] }) }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
              <Plus className="size-4" /> Add Plan
            </button>

            {showForm && (
              <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
                <h3 className="font-bold">{editing ? 'Edit Plan' : 'New Plan'}</h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Name</label>
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Price</label>
                    <input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: Number(e.target.value) }))} required min="0" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Duration</label>
                    <select value={form.duration} onChange={e => setForm(f => ({ ...f, duration: e.target.value }))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1">
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="one_time">One Time</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Job Post Limit</label>
                    <input type="number" value={form.jobPostLimit} onChange={e => setForm(f => ({ ...f, jobPostLimit: Number(e.target.value) }))} min="0" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Featured Limit</label>
                    <input type="number" value={form.featuredLimit} onChange={e => setForm(f => ({ ...f, featuredLimit: Number(e.target.value) }))} min="0" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1" />
                  </div>
                  <div className="flex items-end gap-4 pb-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.hasBadge} onChange={e => setForm(f => ({ ...f, hasBadge: e.target.checked }))} className="rounded" />
                      <span className="text-sm font-medium">Verified Badge</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form.hasPriority} onChange={e => setForm(f => ({ ...f, hasPriority: e.target.checked }))} className="rounded" />
                      <span className="text-sm font-medium">Priority Support</span>
                    </label>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Description</label>
                  <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary mt-1" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide">Features</label>
                  <div className="flex gap-2 mt-1">
                    <input value={featureInput} onChange={e => setFeatureInput(e.target.value)} placeholder="Add a feature"
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addFeature() } }} />
                    <button type="button" onClick={addFeature} className="rounded-lg bg-slate-100 px-3 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200">Add</button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {form.features.map((f, i) => (
                      <span key={i} className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                        {f}
                        <button type="button" onClick={() => setForm(fm => ({ ...fm, features: fm.features.filter((_, j) => j !== i) }))} className="size-3.5 text-slate-400 hover:text-rose-500">&times;</button>
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
                    {editing ? 'Update' : 'Create'} Plan
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setEditing(null) }} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                </div>
              </form>
            )}

            {/* Plans Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map(p => (
                <div key={p._id} className="rounded-2xl border border-slate-200 bg-white p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-lg">{p.name}</h3>
                      <p className="text-2xl font-extrabold mt-1">₹{p.price}<span className="text-sm font-normal text-slate-500">/{p.duration === 'one_time' ? 'once' : p.duration}</span></p>
                    </div>
                    {!p.isActive && <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">Inactive</span>}
                  </div>
                  <p className="text-sm text-slate-500 mt-2">{p.description}</p>
                  <div className="mt-4 space-y-1.5">
                    <p className="text-xs text-slate-500">Job Posts: <strong>{p.jobPostLimit}</strong></p>
                    <p className="text-xs text-slate-500">Featured: <strong>{p.featuredLimit}</strong></p>
                    <p className="text-xs text-slate-500">Badge: <strong>{p.hasBadge ? 'Yes' : 'No'}</strong></p>
                    <p className="text-xs text-slate-500">Priority: <strong>{p.hasPriority ? 'Yes' : 'No'}</strong></p>
                  </div>
                  {p.features?.length > 0 && (
                    <ul className="mt-3 space-y-1">
                      {p.features.map((f, i) => <li key={i} className="text-xs text-slate-600 flex items-center gap-1"><span className="text-emerald-500">✓</span>{f}</li>)}
                    </ul>
                  )}
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => editPlan(p)} className="flex-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50"><Edit3 className="inline size-3 mr-1" />Edit</button>
                    <button onClick={() => deletePlan(p._id)} className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-600 hover:bg-rose-50"><Trash2 className="size-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {tab === 'invoices' && (
          <>
            {/* Revenue Summary */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <DollarSign className="size-5 text-emerald-600 mb-2" />
                <div className="text-2xl font-extrabold">₹{revenue.toLocaleString()}</div>
                <div className="text-xs text-slate-500">Total Revenue</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <TrendingUp className="size-5 text-blue-600 mb-2" />
                <div className="text-2xl font-extrabold">{paidInvoices}</div>
                <div className="text-xs text-slate-500">Paid Invoices</div>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <CreditCard className="size-5 text-violet-600 mb-2" />
                <div className="text-2xl font-extrabold">{total}</div>
                <div className="text-xs text-slate-500">Total Transactions</div>
              </div>
            </div>

            {/* Invoices Table */}
            {loading ? (
              <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 animate-pulse rounded-xl bg-slate-100" />)}</div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-6 py-3">Invoice</th>
                      <th className="px-6 py-3">Company</th>
                      <th className="px-6 py-3">Plan</th>
                      <th className="px-6 py-3">Amount</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invoices.map(inv => (
                      <tr key={inv._id} className="hover:bg-slate-50">
                        <td className="px-6 py-4 font-mono text-xs">{inv.invoiceNo || inv._id.slice(-8)}</td>
                        <td className="px-6 py-4 font-semibold">{inv.company?.name || '—'}</td>
                        <td className="px-6 py-4 text-slate-600">{inv.plan?.name || '—'}</td>
                        <td className="px-6 py-4 font-semibold">₹{inv.amount.toLocaleString()}</td>
                        <td className="px-6 py-4">
                          <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                            inv.status === 'paid' ? 'bg-emerald-50 text-emerald-700' :
                            inv.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                            inv.status === 'failed' ? 'bg-rose-50 text-rose-700' :
                            'bg-slate-100 text-slate-500'
                          }`}>{inv.status}</span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">{new Date(inv.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {invoices.length === 0 && <div className="p-12 text-center text-slate-400">No invoices found.</div>}
              </div>
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  )
}

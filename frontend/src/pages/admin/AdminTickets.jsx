import { useEffect, useState } from 'react'
import { Ticket, MessageSquare, Send, UserCheck, Search, Clock, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'

export default function AdminTickets() {
  const [page, setPage] = useState(1)
  const [filterStatus, setFilterStatus] = useState('')
  const [tickets, setTickets] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [reply, setReply] = useState('')
  const [sending, setSending] = useState(false)
  const limit = 20

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit, ...(filterStatus ? { status: filterStatus } : {}) })
    api.get(`/api/admin/tickets?${params}`)
      .then(data => { setTickets(data.tickets || []); setTotal(data.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filterStatus])
  useEffect(() => { setPage(1) }, [filterStatus])

  const loadDetail = async (id) => {
    try {
      const data = await api.get(`/api/admin/tickets/${id}`)
      setSelected(data.ticket)
    } catch (err) { toast.error(err.message) }
  }

  const handleReply = async () => {
    if (!reply.trim() || !selected) return
    setSending(true)
    try {
      await api.post(`/api/admin/tickets/${selected._id}/reply`, { content: reply })
      setReply('')
      loadDetail(selected._id)
      load()
    } catch (err) { toast.error(err.message) }
    finally { setSending(false) }
  }

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/admin/tickets/${id}/status`, { status })
      toast.success(`Ticket ${status}`)
      loadDetail(id)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const assignToMe = async (id) => {
    try {
      await api.patch(`/api/admin/tickets/${id}/assign`)
      toast.success('Assigned to you')
      loadDetail(id)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const pages = Math.max(1, Math.ceil(total / limit))
  const statusColors = { open: 'bg-blue-50 text-blue-700', in_progress: 'bg-amber-50 text-amber-700', waiting: 'bg-purple-50 text-purple-700', resolved: 'bg-emerald-50 text-emerald-700', closed: 'bg-slate-100 text-slate-500' }
  const priorityColors = { low: 'bg-slate-100 text-slate-500', medium: 'bg-blue-50 text-blue-600', high: 'bg-amber-50 text-amber-600', urgent: 'bg-rose-50 text-rose-600' }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Support Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">{loading ? 'Loading...' : `${total} tickets`}</p>
        </div>

        <div className="flex gap-2 flex-wrap">
          {['', 'open', 'in_progress', 'waiting', 'resolved', 'closed'].map(s => (
            <button key={s || 'all'} onClick={() => setFilterStatus(s)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold capitalize transition-colors ${filterStatus === s ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {s === 'in_progress' ? 'In Progress' : s || 'All'}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Ticket List */}
          <div className="space-y-3">
            {loading ? Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)
            : tickets.length === 0 ? <div className="p-12 text-center text-slate-400">No tickets found.</div>
            : tickets.map(t => (
              <div key={t._id} className={`rounded-2xl border p-4 cursor-pointer transition-all ${selected?._id === t._id ? 'border-primary ring-2 ring-primary/20' : 'border-slate-200 hover:border-slate-300'}`}
                onClick={() => loadDetail(t._id)}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{t.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{t.user?.name || 'Unknown'} · {t.user?.role || '—'}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${priorityColors[t.priority]}`}>{t.priority}</span>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${statusColors[t.status]}`}>{t.status.replace('_', ' ')}</span>
                  <span className="text-[11px] text-slate-400">{new Date(t.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
            <Pagination page={page} pages={pages} onChange={setPage} />
          </div>

          {/* Ticket Detail */}
          <div className="rounded-2xl border border-slate-200 bg-white">
            {!selected ? (
              <div className="flex h-48 items-center justify-center text-sm text-slate-400">Select a ticket to view details</div>
            ) : (
              <div className="flex h-full flex-col">
                <div className="border-b border-slate-100 p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-lg">{selected.subject}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {selected.user?.name} ({selected.user?.role}) · {selected.category}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${priorityColors[selected.priority]}`}>{selected.priority}</span>
                      <span className={`rounded-full px-3 py-0.5 text-[11px] font-bold ${statusColors[selected.status]}`}>{selected.status.replace('_', ' ')}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-sm text-slate-600 bg-slate-50 rounded-xl p-3">{selected.message}</p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {selected.status !== 'resolved' && selected.status !== 'closed' && (
                      <>
                        {!selected.assignedTo && (
                          <button onClick={() => assignToMe(selected._id)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50">
                            <UserCheck className="size-3.5" /> Assign to me
                          </button>
                        )}
                        <button onClick={() => updateStatus(selected._id, 'resolved')} className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                          <CheckCircle2 className="size-3.5" /> Resolve
                        </button>
                      </>
                    )}
                  </div>
                  {selected.assignedTo && (
                    <p className="mt-2 text-xs text-slate-400">Assigned to: {selected.assignedTo?.name || 'Admin'}</p>
                  )}
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3 max-h-80">
                  {selected.messages?.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No replies yet</p>}
                  {selected.messages?.map((msg, i) => (
                    <div key={i} className={`flex ${msg.sender?.role === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${msg.sender?.role === 'admin' ? 'bg-primary text-white' : 'bg-slate-100'}`}>
                        <p className="text-xs font-semibold opacity-70">{msg.sender?.name || 'Admin'}</p>
                        <p className="text-sm mt-0.5">{msg.content}</p>
                        <p className="text-[10px] mt-1 opacity-50">{new Date(msg.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply */}
                <div className="border-t border-slate-100 p-4">
                  <div className="flex gap-2">
                    <input value={reply} onChange={e => setReply(e.target.value)} placeholder="Type your reply..."
                      className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                      onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleReply() } }} />
                    <button onClick={handleReply} disabled={sending || !reply.trim()}
                      className="rounded-lg bg-primary px-3 py-2 text-white hover:bg-primary/90 disabled:opacity-50">
                      <Send className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

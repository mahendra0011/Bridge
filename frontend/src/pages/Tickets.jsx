import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Plus, MessageSquare, Clock, CheckCircle2, AlertCircle, ChevronDown, Send, UserCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const categoryIcons = {
  account: UserCircle2,
  posting: Plus,
  application: CheckCircle2,
  payment: Clock,
  technical: AlertCircle,
  other: MessageSquare,
}

const categoryLabels = { account: 'Account', posting: 'Posting', application: 'Application', payment: 'Payment', technical: 'Technical', other: 'Other' }

const statusStyles = {
  open: 'bg-blue-50 text-blue-700 ring-1 ring-blue-200',
  in_progress: 'bg-amber-50 text-amber-700 ring-1 ring-amber-200',
  waiting: 'bg-violet-50 text-violet-700 ring-1 ring-violet-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  closed: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200',
}

const statusLabels = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting: 'Waiting',
  resolved: 'Resolved',
  closed: 'Closed',
}

export default function Tickets() {
  const { user } = useAuth()
  const role = user?.role || 'student'
  const base = role === 'company' ? '/company' : '/dashboard'
  const apiPath = role === 'company' ? '/api/company' : '/api/student'

  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [category, setCategory] = useState('other')
  const [submitting, setSubmitting] = useState(false)
  const [expandedId, setExpandedId] = useState(null)
  const [replyText, setReplyText] = useState('')
  const [replying, setReplying] = useState(null)
  const [sendingReply, setSendingReply] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`${apiPath}/tickets`)
      .then(data => setTickets(data.tickets || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const createTicket = async (e) => {
    e.preventDefault()
    if (!subject || !message) return toast.error('Subject and message are required')
    setSubmitting(true)
    try {
      const data = await api.post(`${apiPath}/tickets`, { subject, message, category })
      setTickets(p => [data.ticket, ...p])
      setShowForm(false)
      setSubject('')
      setMessage('')
      setCategory('other')
      toast.success('Ticket created!')
    } catch (err) { toast.error(err.message) }
      finally { setSubmitting(false) }
  }

  const sendReply = async (ticketId) => {
    if (!replyText.trim()) return
    setSendingReply(true)
    try {
      const data = await api.post(`${apiPath}/tickets/${ticketId}/reply`, { content: replyText })
      setTickets(p => p.map(t => t._id === ticketId ? data.ticket : t))
      setReplyText('')
      setReplying(null)
      toast.success('Reply sent')
    } catch (err) { toast.error(err.message) }
      finally { setSendingReply(false) }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        {/* Header */}
        <div className="rounded-2xl bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <Link to={base} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-2">
                <ArrowLeft className="size-4" /> Dashboard
              </Link>
              <h1 className="text-2xl font-extrabold sm:text-3xl flex items-center gap-3">
                Support Tickets
                {!loading && tickets.length > 0 && (
                  <span className="text-sm font-medium text-slate-500">
                    {tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length} open
                  </span>
                )}
              </h1>
              <p className="mt-2 text-sm text-slate-500 max-w-md">Get help with your account, postings, and more. Our support team responds within 24 hours.</p>
            </div>
            <button onClick={() => setShowForm(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 transition-all">
              <Plus className="size-4" /> New Ticket
            </button>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : tickets.length === 0 && !showForm ? (
          <div className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-16 text-center">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
              <MessageSquare className="size-8" />
            </div>
            <p className="font-bold text-slate-700">No tickets yet</p>
            <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">Create a support ticket and our team will get back to you within 24 hours.</p>
            <button onClick={() => setShowForm(true)} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25">
              <Plus className="size-4" /> Create Your First Ticket
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map(t => {
              const isOpen = expandedId === t._id
              const StatusIcon = t.status === 'resolved' ? CheckCircle2 : t.status === 'closed' ? AlertCircle : MessageSquare
              const CategoryIcon = categoryIcons[t.category] || MessageSquare
              return (
                <div key={t._id} className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition-all hover:shadow-md hover:border-primary/50">
                  <button onClick={() => setExpandedId(isOpen ? null : t._id)} className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50/50 transition-colors">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-foreground truncate">{t.subject}</h3>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusStyles[t.status] || statusStyles.open}`}>
                          <StatusIcon className="size-3" /> {statusLabels[t.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <CategoryIcon className="size-3.5" />
                          {categoryLabels[t.category] || t.category}
                        </div>
                        <span className="text-xs text-slate-300">•</span>
                        <span className="text-xs text-slate-500">
                          {new Date(t.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`size-5 text-slate-400 shrink-0 ml-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 p-5 space-y-4">
                      <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                        {t.messages?.map((msg, i) => (
                          <div key={i} className={`flex ${msg.sender === user?._id ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-3 ${
                              msg.sender === user?._id 
                                ? 'bg-primary text-primary-foreground' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              <p className="text-sm leading-relaxed">{msg.content}</p>
                              <p className="text-[10px] mt-1 opacity-70">
                                {new Date(msg.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      {replying === t._id ? (
                        <div className="flex gap-2">
                          <textarea 
                            value={replyText} 
                            onChange={e => setReplyText(e.target.value)} 
                            rows={2} 
                            placeholder="Type your reply..." 
                            className="flex-1 rounded-xl border-2 border-slate-200 p-3 text-sm font-medium outline-none focus:border-primary resize-none" 
                          />
                          <div className="flex flex-col gap-1.5">
                            <button 
                              onClick={() => sendReply(t._id)} 
                              disabled={sendingReply} 
                              className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 disabled:opacity-60 shadow-sm"
                            >
                              Send
                            </button>
                            <button 
                              onClick={() => { setReplying(null); setReplyText('') }} 
                              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        t.status !== 'resolved' && t.status !== 'closed' && (
                          <button 
                            onClick={() => setReplying(t._id)} 
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                          >
                            <Send className="size-3" /> Reply
                          </button>
                        )
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl">
              <h3 className="text-xl font-bold">New Support Ticket</h3>
              <p className="mt-1 text-sm text-slate-500">Describe your issue and our team will help.</p>
              <form onSubmit={createTicket} className="mt-5 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Subject *</label>
                  <input 
                    value={subject} 
                    onChange={e => setSubject(e.target.value)} 
                    placeholder="Brief summary of your issue" 
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-primary" 
                  />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                  <select 
                    value={category} 
                    onChange={e => setCategory(e.target.value)} 
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-primary bg-white"
                  >
                    {Object.entries(categoryLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">Message *</label>
                  <textarea 
                    value={message} 
                    onChange={e => setMessage(e.target.value)} 
                    rows={5} 
                    placeholder="Describe your issue in detail..." 
                    className="w-full rounded-xl border-2 border-slate-200 px-4 py-3 text-sm font-medium outline-none focus:border-primary resize-none" 
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button 
                    type="button" 
                    onClick={() => setShowForm(false)} 
                    className="rounded-xl border-2 border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={submitting} 
                    className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 shadow-lg shadow-primary/25 transition-all"
                  >
                    {submitting ? 'Submitting...' : 'Submit Ticket'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

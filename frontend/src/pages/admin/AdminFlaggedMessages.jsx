import { useEffect, useState } from 'react'
import { AlertTriangle, Shield, CheckCircle2, MessageSquare } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'

const roleColors = {
  student: 'bg-blue-50 text-blue-700',
  company: 'bg-violet-50 text-violet-700',
  admin: 'bg-amber-50 text-amber-700',
}

export default function AdminFlaggedMessages() {
  const [page, setPage] = useState(1)
  const [messages, setMessages] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const limit = 20

  const load = async () => {
    setLoading(true)
    try {
      const data = await api.get(`/api/admin/flagged-messages?page=${page}&limit=${limit}`)
      setMessages(data.messages || [])
      setTotal(data.total || 0)
      setTotalPages(data.totalPages || 1)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [page])

  const handleReview = async (id) => {
    try {
      await api.patch(`/api/admin/flagged-messages/${id}/review`)
      setMessages((prev) => prev.map((m) => m._id === id ? { ...m, redFlagReviewedBy: 'reviewed' } : m))
      toast.success('Marked as reviewed')
    } catch (err) {
      toast.error(err.message || 'Failed to update')
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Flagged Messages</h1>
            <p className="mt-1 text-sm text-slate-500">Messages flagged for potentially harmful content (scam phrases, etc.)</p>
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2 text-sm font-bold text-amber-700">
            <AlertTriangle className="size-4" />
            {total} flagged
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
            <Shield className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-semibold text-slate-600">All clear!</p>
            <p className="mt-1 text-sm">No flagged messages at this time.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((msg) => (
              <div key={msg._id} className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold capitalize ${roleColors[msg.sender?.role] || 'bg-slate-100 text-slate-600'}`}>
                        {msg.sender?.role || 'unknown'}
                      </span>
                      <span className="text-sm font-semibold text-foreground">{msg.sender?.name || 'Unknown'}</span>
                      <span className="text-xs text-slate-400">
                        {msg.createdAt ? new Date(msg.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <div className="mt-2 rounded-xl bg-rose-50 p-3">
                      <p className="text-sm text-rose-800">{msg.text || '(attachment message)'}</p>
                    </div>
                    {msg.redFlagReasons?.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {msg.redFlagReasons.map((reason, i) => (
                          <span key={i} className="rounded-full bg-rose-100 px-2.5 py-0.5 text-[10px] font-bold text-rose-700">
                            {reason}
                          </span>
                        ))}
                      </div>
                    )}
                    {msg.conversation?.posting?.title && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
                        <MessageSquare className="size-3" />
                        Conversation about: <span className="font-semibold">{msg.conversation.posting.title}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {msg.redFlagReviewedBy ? (
                      <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
                        <CheckCircle2 className="size-3.5" /> Reviewed
                      </span>
                    ) : (
                      <button
                        onClick={() => handleReview(msg._id)}
                        className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs font-bold text-white hover:bg-primary/90"
                      >
                        <Shield className="size-3.5" /> Mark Safe
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center pt-4">
            <Pagination page={page} pages={totalPages} onChange={setPage} />
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

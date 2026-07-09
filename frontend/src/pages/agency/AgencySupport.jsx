import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  HelpCircle, MessageSquare, FileText, Search, ChevronRight,
  ExternalLink, Mail, Phone, Clock, CheckCircle2, AlertCircle,
  Plus, Send, ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const FAQS = [
  { q: 'How do I post a new job or gig?', a: 'Go to Post New Gig/Project from the sidebar or use the Quick Actions on your dashboard to create a new listing.' },
  { q: 'How does agency verification work?', a: 'Upload your Udyam registration or business documents in the Verification section. Our team reviews them within 1-2 business days.' },
  { q: 'What is the difference between jobs and internships?', a: 'Jobs are full-time/part-time positions, while internships are short-term training opportunities for students.' },
  { q: 'How do I invite team members?', a: 'Go to Team Management in the sidebar, click "Invite Member", and enter their email. They need a Bridge account.' },
  { q: 'How do I view applicants?', a: 'Go to Applicant Pipeline to see all candidates in a Kanban view. You can drag & drop them through stages.' },
  { q: 'Can I boost my listings?', a: 'Yes! Go to My Postings, click the lightning bolt icon on any listing to boost it for better visibility.' },
  { q: 'How do I handle Request-Quote listings?', a: 'When candidates submit proposals with quotes, they appear in the Quote Inbox within your Applicant Pipeline for easy side-by-side comparison.' },
  { q: 'What is the posting limit for unregistered agencies?', a: 'Unregistered agencies can post up to 3 jobs/internships per month. Complete verification for unlimited posting.' },
]

export default function AgencySupport() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTicketForm, setShowTicketForm] = useState(false)
  const [ticketForm, setTicketForm] = useState({ subject: '', description: '', priority: 'medium' })
  const [submitting, setSubmitting] = useState(false)

  const loadTickets = () => {
    setLoading(true)
    api.get('/api/agency/tickets').then(data => {
      setTickets(data.tickets || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadTickets() }, [])

  const handleSubmitTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) return
    setSubmitting(true)
    try {
      const data = await api.post('/api/agency/tickets', ticketForm)
      setTickets(data.tickets || [])
      setShowTicketForm(false)
      setTicketForm({ subject: '', description: '', priority: 'medium' })
      toast.success('Support ticket created')
    } catch (err) {
      toast.error(err.message || 'Failed to create ticket')
    } finally {
      setSubmitting(false)
    }
  }

  const filteredFaqs = FAQS.filter(f =>
    !search || f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())
  )

  const priorityColor = {
    low: 'bg-slate-100 text-slate-600',
    medium: 'bg-amber-50 text-amber-700',
    high: 'bg-rose-50 text-rose-700',
  }

  const statusIcon = {
    open: <AlertCircle className="size-3.5 text-amber-500" />,
    in_progress: <Clock className="size-3.5 text-blue-500" />,
    resolved: <CheckCircle2 className="size-3.5 text-emerald-500" />,
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Help & Support</h2>
            <p className="mt-1 text-sm text-slate-500">FAQs, support tickets, and ways to reach us.</p>
          </div>
          <button onClick={() => setShowTicketForm(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90">
            <Plus className="size-4" /> New Ticket
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search FAQs or help topics..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm outline-none focus:border-primary" />
        </div>

        {/* FAQ Section */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-bold">Frequently Asked Questions</h3>
          </div>
          <div className="divide-y divide-slate-100">
            {filteredFaqs.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-400">
                <HelpCircle className="mx-auto mb-2 size-8 text-slate-300" />
                <p>No FAQ matches your search.</p>
              </div>
            ) : (
              filteredFaqs.map((faq, i) => (
                <details key={i} className="group">
                  <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold hover:bg-slate-50">
                    {faq.q}
                    <ChevronRight className="size-4 text-slate-400 transition-transform group-open:rotate-90" />
                  </summary>
                  <div className="px-6 pb-4 text-sm text-slate-600">{faq.a}</div>
                </details>
              ))
            )}
          </div>
        </div>

        {/* Support Tickets */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-bold">Your Support Tickets</h3>
          </div>
          {loading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />)}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              <MessageSquare className="mx-auto mb-2 size-8 text-slate-300" />
              <p>No support tickets yet</p>
              <p className="mt-1">Create a ticket if you need help with anything.</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {tickets.map(ticket => (
                <div key={ticket._id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{ticket.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{ticket.description?.slice(0, 100)}...</p>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ${priorityColor[ticket.priority] || 'bg-slate-100 text-slate-600'}`}>
                      {ticket.priority}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                      {statusIcon[ticket.status] || <AlertCircle className="size-3.5" />} {ticket.status?.replace('_', ' ') || 'open'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Info */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold mb-4">Still need help?</h3>
          <div className="grid gap-4 sm:grid-cols-3">
            <a href="mailto:support@bridge.com" className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 hover:bg-primary/5 transition-colors">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Mail className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Email Us</p>
                <p className="text-xs text-slate-500">support@bridge.com</p>
              </div>
            </a>
            <a href="tel:+911800123456" className="flex items-center gap-3 rounded-xl bg-slate-50 p-4 hover:bg-primary/5 transition-colors">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Phone className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Call Us</p>
                <p className="text-xs text-slate-500">1800-123-456</p>
              </div>
            </a>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-4">
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Response Time</p>
                <p className="text-xs text-slate-500">Within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* New Ticket Modal */}
        {showTicketForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={() => setShowTicketForm(false)}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-extrabold">Create Support Ticket</h3>
              <p className="mt-1 text-sm text-slate-500">We'll get back to you as soon as possible.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Subject</label>
                  <input value={ticketForm.subject} onChange={e => setTicketForm(p => ({ ...p, subject: e.target.value }))}
                    placeholder="Brief title for your issue"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                  <textarea value={ticketForm.description} onChange={e => setTicketForm(p => ({ ...p, description: e.target.value }))}
                    rows={4} placeholder="Describe your issue in detail..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Priority</label>
                  <select value={ticketForm.priority} onChange={e => setTicketForm(p => ({ ...p, priority: e.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowTicketForm(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleSubmitTicket} disabled={!ticketForm.subject.trim() || !ticketForm.description.trim() || submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                  <Send className="size-4" /> {submitting ? 'Submitting...' : 'Submit Ticket'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
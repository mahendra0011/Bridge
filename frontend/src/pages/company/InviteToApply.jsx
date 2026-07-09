import { useEffect, useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Send, Check, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function InviteToApply() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const [candidate, setCandidate] = useState(null)
  const [postings, setPostings] = useState([])
  const [selectedPosting, setSelectedPosting] = useState('')
  const [selectedKind, setSelectedKind] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    Promise.all([
      api.get(`/api/company/candidates/${userId}`),
      api.get('/api/company/postings'),
    ])
      .then(([candidateData, postingsData]) => {
        setCandidate(candidateData.candidate)
        const all = [
          ...(postingsData.jobs || []).map((j) => ({ ...j, kind: 'job' })),
          ...(postingsData.internships || []).map((i) => ({ ...i, kind: 'internship' })),
        ]
        setPostings(all.filter((p) => p.status === 'approved' || p.status === 'pending'))
      })
      .catch((err) => toast.error(err.message || 'Failed to load'))
      .finally(() => setLoading(false))
  }, [userId])

  const handleSend = async () => {
    if (!selectedPosting || !selectedKind) {
      return toast.error('Select a job or internship to invite to')
    }
    setSending(true)
    try {
      await api.post(`/api/company/candidates/${userId}/invite`, {
        postingId: selectedPosting,
        postingKind: selectedKind,
        message: message.trim(),
      })
      toast.success('Invite sent!')
      navigate('/company/candidates')
    } catch (err) {
      toast.error(err.message || 'Failed to send invite')
    } finally {
      setSending(false)
    }
  }

  const name = candidate
    ? [candidate.firstName, candidate.lastName].filter(Boolean).join(' ') || candidate.user?.name || 'Candidate'
    : 'Candidate'

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
        <div className="mt-6 h-64 animate-pulse rounded-2xl bg-slate-100" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
      <Link to={`/company/candidates/${userId}`} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
        <ArrowLeft className="size-4" /> Back to Profile
      </Link>

      <div className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
            <Send className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold">Invite to Apply</h2>
            <p className="text-sm text-slate-500">Send an invitation to <strong>{name}</strong></p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Select Job / Internship *
            </label>
            <select
              value={selectedKind ? `${selectedKind}:${selectedPosting}` : ''}
              onChange={(e) => {
                const [kind, id] = e.target.value.split(':')
                setSelectedKind(kind)
                setSelectedPosting(id)
              }}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
            >
              <option value="">Choose a posting...</option>
              {postings.map((p) => (
                <option key={`${p.kind}:${p._id}`} value={`${p.kind}:${p._id}`}>
                  {p.kind === 'job' ? '💼' : '📚'} {p.title} ({p.kind})
                </option>
              ))}
            </select>
            {postings.length === 0 && (
              <p className="mt-2 text-xs text-amber-600 flex items-center gap-1">
                No active postings. <Link to="/company/post" className="underline font-semibold">Create one</Link>
              </p>
            )}
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-500">
              Personal Message <span className="font-normal normal-case text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi! We were impressed by your profile and would love to see your application..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-sm text-slate-600">
              <Building2 className="size-4 text-slate-400" />
              Inviting to: <strong>{name}</strong>
            </div>
            <Button
              onClick={handleSend}
              disabled={sending || !selectedPosting}
              className="rounded-xl bg-primary px-6 py-2 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {sending ? 'Sending...' : <><Send className="size-4" /> Send Invite</>}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

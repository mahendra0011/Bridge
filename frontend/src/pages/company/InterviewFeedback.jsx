import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Star, Send } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

export default function InterviewFeedback() {
  const { appId } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState({ rating: 0, communication: 0, skills: 0, notes: '', decision: 'pending' })
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.rating) return toast.error('Please provide an overall rating')
    setSaving(true)
    try {
      await api.post(`/api/company/applications/${appId}/feedback`, form)
      toast.success('Feedback submitted')
      navigate('/company/dashboard')
    } catch (err) { toast.error(err.message) }
    finally { setSaving(false) }
  }

  const StarInput = ({ label, value, onChange }) => (
    <div>
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">{label}</label>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" onClick={() => onChange(n)}
            className={`p-1 transition-colors ${n <= value ? 'text-amber-400' : 'text-slate-200'}`}>
            <Star className="size-6 fill-current" />
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back
        </button>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Interview Feedback</h1>
          <p className="mt-1 text-sm text-slate-500">Rate the candidate and provide feedback</p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-6">
          <StarInput label="Overall Rating" value={form.rating} onChange={v => setForm(f => ({ ...f, rating: v }))} />
          <StarInput label="Communication" value={form.communication} onChange={v => setForm(f => ({ ...f, communication: v }))} />
          <StarInput label="Technical Skills" value={form.skills} onChange={v => setForm(f => ({ ...f, skills: v }))} />

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Decision</label>
            <select value={form.decision} onChange={e => setForm(f => ({ ...f, decision: e.target.value }))}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
              <option value="pending">Pending</option>
              <option value="strong_hire">Strong Hire</option>
              <option value="hire">Hire</option>
              <option value="maybe">Maybe</option>
              <option value="no_hire">No Hire</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Notes</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={4}
              placeholder="Detailed feedback about the candidate..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>

          <button type="submit" disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
            <Send className="size-4" /> {saving ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  )
}

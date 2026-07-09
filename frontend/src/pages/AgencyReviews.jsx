import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Star, Building2, Send, ArrowLeft, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function StarDisplay({ rating, size = 'size-4' }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(n => (
        <Star key={n} className={`${size} ${n <= rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />
      ))}
    </div>
  )
}

export default function AgencyReviews() {
  const { id } = useParams()
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ avgRating: 0, avgQuality: 0, avgCommunication: 0, avgTurnaround: 0, avgPayment: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ rating: 0, qualityRating: 0, communicationRating: 0, turnaroundRating: 0, paymentRating: 0, title: '', review: '', isAnonymous: false })
  const [agencyName, setAgencyName] = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/api/agency/reviews/${id}`)
      .then(data => {
        setReviews(data.reviews || [])
        setStats(data.stats || { avgRating: 0, count: 0 })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  useEffect(() => {
    api.get(`/api/agency/${id}/public`).then(data => {
      if (data.agency?.agencyName) setAgencyName(data.agency.agencyName)
    }).catch(() => {})
  }, [id])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.rating) return toast.error('Please provide an overall rating')
    try {
      await api.post('/api/agency/reviews', { ...form, agencyId: id })
      toast.success('Review submitted!')
      setShowForm(false)
      setForm({ rating: 0, qualityRating: 0, communicationRating: 0, turnaroundRating: 0, paymentRating: 0, title: '', review: '', isAnonymous: false })
      load()
    } catch (err) { toast.error(err.message) }
  }

  const breakdown = [
    { label: 'Quality of Work', value: stats.avgQuality },
    { label: 'Communication', value: stats.avgCommunication },
    { label: 'Turnaround Time', value: stats.avgTurnaround },
    { label: 'Payment Reliability', value: stats.avgPayment },
  ]

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to={`/agency/${id}`} className="inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition-colors">
          <ArrowLeft className="size-4" /> Back to {agencyName || 'Agency'}
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{agencyName || 'Agency'} Reviews</h1>
            <p className="text-sm text-slate-500 mt-1">
              <StarDisplay rating={Math.round(stats.avgRating)} /> {stats.count} reviews
            </p>
          </div>
          {user && (!user.role || user.role !== 'agency') && (
            <button onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
              {showForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <div className="text-3xl font-extrabold text-amber-500">{stats.avgRating.toFixed(1)}</div>
            <StarDisplay rating={Math.round(stats.avgRating)} size="size-5" />
            <div className="text-xs text-slate-500 mt-1">{stats.count} reviews</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2">Dimension Breakdown</p>
            <div className="space-y-1.5">
              {breakdown.map(b => (
                <div key={b.label} className="flex items-center gap-2">
                  <span className="text-xs text-slate-600 w-28 shrink-0">{b.label}</span>
                  <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${(b.value / 5) * 100}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-600 w-6 text-right">{b.value.toFixed(1)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
            <h3 className="font-bold">Write a Review</h3>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-2 block">Overall Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map(n => (
                  <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: n }))}
                    className={`p-1 ${n <= form.rating ? 'text-amber-400' : 'text-slate-200'}`}>
                    <Star className="size-7 fill-current" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { key: 'qualityRating', label: 'Quality of Work' },
                { key: 'communicationRating', label: 'Communication' },
                { key: 'turnaroundRating', label: 'Turnaround Time' },
                { key: 'paymentRating', label: 'Payment Reliability' },
              ].map(d => (
                <div key={d.key}>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">{d.label}</label>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(n => (
                      <button key={n} type="button" onClick={() => setForm(f => ({ ...f, [d.key]: n }))}
                        className={`p-0.5 ${n <= form[d.key] ? 'text-amber-400' : 'text-slate-200'}`}>
                        <Star className="size-4 fill-current" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Review Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Great experience working with this agency"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Review</label>
              <textarea value={form.review} onChange={e => setForm(f => ({ ...f, review: e.target.value }))} rows={3} placeholder="Share your experience working with this agency..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))} className="rounded" />
              <span className="text-sm text-slate-600">Post anonymously</span>
            </label>

            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90">
              <Send className="size-4" /> Submit Review
            </button>
          </form>
        )}

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : reviews.length === 0 && !showForm ? (
          <div className="p-12 text-center text-slate-400">No reviews yet. Be the first to review!</div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <StarDisplay rating={r.rating} />
                      <span className="font-bold text-sm">{r.title}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {r.isAnonymous ? 'Anonymous' : r.reviewer?.name || 'Anonymous'} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {r.review && <p className="text-sm text-slate-600 mt-2">{r.review}</p>}
                {(r.qualityRating || r.communicationRating || r.turnaroundRating || r.paymentRating) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {r.qualityRating && <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500">Quality: {r.qualityRating}/5</span>}
                    {r.communicationRating && <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500">Comm: {r.communicationRating}/5</span>}
                    {r.turnaroundRating && <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500">Turnaround: {r.turnaroundRating}/5</span>}
                    {r.paymentRating && <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500">Payment: {r.paymentRating}/5</span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </SiteLayout>
  )
}

import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Star, Building2, Send } from 'lucide-react'
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

export default function CompanyReviews() {
  const { companyId } = useParams()
  const { user } = useAuth()
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ avgRating: 0, count: 0 })
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ rating: 0, title: '', review: '', pros: '', cons: '', salary: '', interviewExp: '', interviewDifficulty: '', isAnonymous: false })
  const [companyName, setCompanyName] = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/api/internships/reviews/${companyId}`)
      .then(data => {
        setReviews(data.reviews || [])
        setStats(data.stats || { avgRating: 0, count: 0 })
        if (data.reviews?.[0]?.company?.name) setCompanyName(data.reviews[0].company.name)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [companyId])

  // Fetch company name if no reviews yet
  useEffect(() => {
    if (!companyName) {
      api.get(`/api/company/profile?userId=${companyId}`).catch(() => {})
    }
  }, [companyId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.rating) return toast.error('Please provide a rating')
    try {
      await api.post('/api/student/reviews', { ...form, companyId })
      toast.success('Review submitted!')
      setShowForm(false)
      setForm({ rating: 0, title: '', review: '', pros: '', cons: '', salary: '', interviewExp: '', interviewDifficulty: '', isAnonymous: false })
      load()
    } catch (err) { toast.error(err.message) }
  }

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{companyName || 'Company'} Reviews</h1>
            <p className="text-sm text-slate-500 mt-1">
              <StarDisplay rating={Math.round(stats.avgRating)} /> {stats.count} reviews
            </p>
          </div>
          {user?.role === 'student' && (
            <button onClick={() => setShowForm(!showForm)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
              {showForm ? 'Cancel' : 'Write a Review'}
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <div className="text-3xl font-extrabold text-amber-500">{stats.avgRating.toFixed(1)}</div>
            <StarDisplay rating={Math.round(stats.avgRating)} size="size-5" />
            <div className="text-xs text-slate-500 mt-1">{stats.count} reviews</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <div className="text-3xl font-extrabold text-blue-500">{Math.round(stats.avgRating * 20)}%</div>
            <div className="text-xs text-slate-500 mt-1">Would recommend</div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center">
            <Building2 className="size-6 text-slate-400 mx-auto mb-1" />
            <div className="text-xs text-slate-500">{companyName || 'Company'}</div>
          </div>
        </div>

        {/* Review Form */}
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Review Title</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Great place to work"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Salary (optional)</label>
                <input value={form.salary} onChange={e => setForm(f => ({ ...f, salary: e.target.value }))} placeholder="e.g. ₹12LPA"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Review</label>
              <textarea value={form.review} onChange={e => setForm(f => ({ ...f, review: e.target.value }))} rows={3} placeholder="Share your experience working here..."
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Pros</label>
                <textarea value={form.pros} onChange={e => setForm(f => ({ ...f, pros: e.target.value }))} rows={2} placeholder="What did you like?"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Cons</label>
                <textarea value={form.cons} onChange={e => setForm(f => ({ ...f, cons: e.target.value }))} rows={2} placeholder="What could be better?"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Interview Experience</label>
              <textarea value={form.interviewExp} onChange={e => setForm(f => ({ ...f, interviewExp: e.target.value }))} rows={2} placeholder="How was the interview process?"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wide mb-1 block">Interview Difficulty</label>
                <select value={form.interviewDifficulty} onChange={e => setForm(f => ({ ...f, interviewDifficulty: e.target.value }))}
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary">
                  <option value="">Select</option>
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-5">
                <input type="checkbox" checked={form.isAnonymous} onChange={e => setForm(f => ({ ...f, isAnonymous: e.target.checked }))} className="rounded" />
                <span className="text-sm text-slate-600">Post anonymously</span>
              </label>
            </div>
            <button type="submit" className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90">
              <Send className="size-4" /> Submit Review
            </button>
          </form>
        )}

        {/* Reviews List */}
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
                  {r.salary && <span className="text-sm font-bold text-emerald-600">{r.salary}</span>}
                </div>
                {r.review && <p className="text-sm text-slate-600 mt-2">{r.review}</p>}
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  {r.pros && <div className="rounded-lg bg-emerald-50 p-3"><p className="text-xs font-bold text-emerald-700 uppercase">Pros</p><p className="text-sm text-slate-600 mt-0.5">{r.pros}</p></div>}
                  {r.cons && <div className="rounded-lg bg-rose-50 p-3"><p className="text-xs font-bold text-rose-700 uppercase">Cons</p><p className="text-sm text-slate-600 mt-0.5">{r.cons}</p></div>}
                </div>
                {r.interviewExp && (
                  <div className="mt-3 rounded-lg bg-blue-50 p-3">
                    <p className="text-xs font-bold text-blue-700 uppercase">Interview Experience {r.interviewDifficulty && `· ${r.interviewDifficulty}`}</p>
                    <p className="text-sm text-slate-600 mt-0.5">{r.interviewExp}</p>
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

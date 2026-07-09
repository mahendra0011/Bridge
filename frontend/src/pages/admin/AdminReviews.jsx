import { useEffect, useState } from 'react'
import { Star, CheckCircle2, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

export default function AdminReviews() {
  const [reviews, setReviews] = useState([])
  const [total, setTotal] = useState(0)
  const [filter, setFilter] = useState('')
  const [reviewType, setReviewType] = useState('company')
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const limit = 20

  const load = () => {
    setLoading(true)
    const params = new URLSearchParams({ page, limit, type: reviewType, ...(filter ? { status: filter } : {}) })
    api.get(`/api/admin/reviews?${params}`)
      .then(data => { setReviews(data.reviews || []); setTotal(data.total || 0) })
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [page, filter, reviewType])

  const moderate = async (id, status) => {
    try {
      await api.patch(`/api/admin/reviews/${id}/status`, { status, type: reviewType })
      toast.success(`Review ${status}`)
      load()
    } catch (err) { toast.error(err.message) }
  }

  const pages = Math.max(1, Math.ceil(total / limit))

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{
              reviewType === 'agency' ? 'Agency Reviews' : 'Company Reviews'
            }</h1>
            <p className="mt-1 text-sm text-slate-500">{loading ? 'Loading...' : `${total} reviews`}</p>
          </div>
          <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
            <button onClick={() => { setReviewType('company'); setPage(1) }}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${reviewType === 'company' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Company
            </button>
            <button onClick={() => { setReviewType('agency'); setPage(1) }}
              className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${reviewType === 'agency' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
              Agency
            </button>
          </div>
        </div>

        <div className="flex gap-2">
          {['', 'pending', 'approved', 'rejected'].map(s => (
            <button key={s || 'all'} onClick={() => { setFilter(s); setPage(1) }}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${filter === s ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600'}`}>
              {s || 'All'}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No reviews found.</div>
        ) : (
          <div className="space-y-3">
            {reviews.map(r => (
              <div key={r._id} className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(n => <Star key={n} className={`size-3.5 ${n <= r.rating ? 'text-amber-400 fill-current' : 'text-slate-200'}`} />)}
                      </div>
                      <span className="font-bold text-sm">{r.title || 'Untitled'}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">
                      {reviewType === 'agency'
                        ? (r.agency?.agencyName || 'Unknown agency')
                        : (r.company?.name || 'Unknown company')
                      } · by {r.reviewer?.name || 'Anonymous'} · {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                    {r.review && <p className="text-sm text-slate-600 mt-2 line-clamp-2">{r.review}</p>}
                    {r.salary && <p className="text-xs text-slate-500 mt-1">Salary: {r.salary}</p>}
                  </div>
                  <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-bold ${
                    r.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                    r.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                    'bg-rose-50 text-rose-700'
                  }`}>{r.status}</span>
                </div>
                {(r.dimensionRatings || (r.qualityRating)) && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {r.qualityRating && <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500">Quality: {r.qualityRating}/5</span>}
                    {r.communicationRating && <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500">Comm: {r.communicationRating}/5</span>}
                    {r.turnaroundRating && <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500">Turnaround: {r.turnaroundRating}/5</span>}
                    {r.paymentRating && <span className="rounded-md bg-slate-50 px-2 py-0.5 text-xs text-slate-500">Payment: {r.paymentRating}/5</span>}
                  </div>
                )}
                {r.status === 'pending' && (
                  <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                    <button onClick={() => moderate(r._id, 'approved')} className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                      <CheckCircle2 className="size-3" /> Approve
                    </button>
                    <button onClick={() => moderate(r._id, 'rejected')} className="inline-flex items-center gap-1 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50">
                      <XCircle className="size-3" /> Reject
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-center gap-2">
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${page === p ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>{p}</button>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

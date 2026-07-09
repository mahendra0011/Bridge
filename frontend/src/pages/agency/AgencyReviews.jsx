import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Star, MessageSquare, ThumbsUp, Flag, User, ChevronDown,
  Calendar, Filter, Search, AlertCircle, CheckCircle2, Clock
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

function StarRating({ rating, size = 'sm' }) {
  const sizeClass = size === 'sm' ? 'size-3.5' : 'size-5'
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`${sizeClass} ${i <= rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  )
}

function ReviewCard({ review }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
            {(review.reviewer?.name || 'A')[0]}
          </div>
          <div>
            <p className="text-sm font-semibold">{review.reviewer?.name || 'Anonymous'}</p>
            <p className="text-xs text-slate-500">
              {review.reviewer?.role ? `${review.reviewer.role} • ` : ''}
              {new Date(review.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <StarRating rating={review.rating} />
      </div>
      {review.title && <p className="text-sm font-bold mb-1">{review.title}</p>}
      <p className="text-sm text-slate-600">{review.comment || review.review || ''}</p>
      {review.projectTitle && (
        <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-semibold">Project: {review.projectTitle}</span>
        </div>
      )}
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
        <button className="flex items-center gap-1 hover:text-primary transition-colors">
          <ThumbsUp className="size-3.5" /> {review.likes || 0}
        </button>
        <button className="flex items-center gap-1 hover:text-rose-500 transition-colors">
          <Flag className="size-3.5" /> Report
        </button>
      </div>
    </div>
  )
}

export default function AgencyReviews() {
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: {} })
  const [filter, setFilter] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/agency/reviews').catch(() => ({ reviews: [] })),
      api.get('/api/agency/reviews/stats').catch(() => ({})),
    ]).then(([reviewsRes, statsRes]) => {
      setReviews(reviewsRes.reviews || [])
      setStats({
        average: statsRes.average || 0,
        total: statsRes.total || 0,
        distribution: statsRes.distribution || {},
      })
    }).catch(() => toast.error('Failed to load reviews'))
      .finally(() => setLoading(false))
  }, [])

  const filteredReviews = reviews.filter(r => {
    if (filter !== 'all' && r.rating !== parseInt(filter)) return false
    if (search && !r.comment?.toLowerCase().includes(search.toLowerCase()) && !r.review?.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const ratingColors = {
    5: 'bg-emerald-500',
    4: 'bg-blue-500',
    3: 'bg-amber-500',
    2: 'bg-orange-500',
    1: 'bg-rose-500',
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Reviews</h2>
          <p className="mt-1 text-sm text-slate-500">See what clients say about your agency. Reviews build trust.</p>
        </div>

        {/* Review Stats Summary */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex flex-wrap items-center gap-8">
            <div className="text-center">
              <div className="text-5xl font-extrabold text-foreground">{stats.average.toFixed(1)}</div>
              <div className="mt-1 flex justify-center">
                <StarRating rating={Math.round(stats.average)} size="lg" />
              </div>
              <p className="mt-1 text-sm text-slate-500">{stats.total} reviews</p>
            </div>
            <div className="flex-1 space-y-1.5 min-w-48">
              {[5, 4, 3, 2, 1].map(rating => {
                const count = stats.distribution?.[rating] || 0
                const pct = stats.total > 0 ? (count / stats.total) * 100 : 0
                return (
                  <div key={rating} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-right text-xs font-semibold text-slate-500">{rating}</span>
                    <Star className="size-3.5 text-amber-400 fill-amber-400" />
                    <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className={`h-full rounded-full ${ratingColors[rating]}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-xs text-slate-500">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search reviews..."
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
            {['all', '5', '4', '3', '2', '1'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold transition-colors ${filter === f ? 'bg-white text-foreground shadow-sm' : 'text-slate-500 hover:text-foreground'}`}>
                {f === 'all' ? 'All' : `★${f}`}
              </button>
            ))}
          </div>
        </div>

        {/* Reviews List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
            <Star className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-semibold text-slate-600">No reviews yet</p>
            <p className="mt-1 text-sm">Reviews from clients will appear here. Encourage your clients to leave feedback.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredReviews.map((review) => (
              <ReviewCard key={review._id} review={review} />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
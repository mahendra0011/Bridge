import { useEffect, useState } from 'react'
import { Star, MessageSquare, ThumbsUp, ThumbsDown, Calendar } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

export default function CompanyReviews() {
  const [reviews, setReviews] = useState([])
  const [stats, setStats] = useState({ avgRating: 0, count: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/company/reviews').then(data => {
      setReviews(data.reviews || [])
      setStats(data.stats || { avgRating: 0, count: 0 })
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Reviews</h2>
          <p className="mt-1 text-sm text-slate-500">What candidates are saying about your company.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center gap-6 flex-wrap">
            <div className="text-center">
              <div className="text-5xl font-extrabold text-amber-500">{stats.avgRating}</div>
              <div className="flex items-center justify-center gap-0.5 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} className={`size-4 ${i <= Math.round(stats.avgRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-1">{stats.count} review{stats.count !== 1 ? 's' : ''}</p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : reviews.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
            <MessageSquare className="mx-auto mb-3 size-8 text-slate-300" />
            <p className="font-semibold">No reviews yet</p>
            <p className="text-sm mt-1">Reviews from candidates will appear here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review._id} className="rounded-2xl border border-slate-200 bg-white p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(review.user?.name || '?')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{review.user?.name || 'Anonymous'}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar className="size-3" /> {new Date(review.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`size-4 ${i <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    ))}
                  </div>
                </div>
                {review.comment && (
                  <p className="mt-4 text-sm text-slate-600">{review.comment}</p>
                )}
                {review.jobTitle && (
                  <p className="mt-2 text-xs text-slate-400">Applied for: {review.jobTitle}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
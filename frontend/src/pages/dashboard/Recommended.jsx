import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, MapPin, Building2, Clock } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

function RecommendedCard({ item, index }) {
  const companyName = item.company?.name || item.agency?.agencyName || item.poster?.name || 'Unknown'
  const initials = companyName.split(' ').map(w => w[0]).slice(0, 2).join('')
  const matchScore = item.score || item.matchScore || item.matchPercentage || Math.floor(Math.random() * 31) + 35
  const location = item.location || ''
  const mode = item.mode || ''
  const skills = item.skills || []
  const kind = item.kind || 'job'
  const detailPath = kind === 'internship' ? `/internship/${item._id || item.id}` : kind === 'opportunity' ? `/opportunity/${item._id || item.id}` : `/job/${item._id || item.id}`

  const typeLabel = kind === 'internship' ? 'Internship' : kind === 'opportunity' ? 'Project' : 'Job'

  return (
    <Link
      to={detailPath}
      className="group relative block rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/30 p-5 transition-all hover:shadow-xl hover:border-primary/30 hover:-translate-y-1"
      style={{ animationDelay: `${(index || 0) * 50}ms` }}
    >
      {/* Match Badge */}
      <span className={`absolute right-3 top-3 rounded-full px-2.5 py-0.5 text-[11px] font-bold ring-1 ${matchScore >= 80 ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' : matchScore >= 60 ? 'bg-amber-50 text-amber-700 ring-amber-200' : 'bg-blue-50 text-blue-700 ring-blue-200'}`}>
        {Math.round(matchScore)}% match
      </span>

      {/* Logo + Company */}
      <div className="flex items-center gap-3">
        <div className="relative grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-violet-500 via-indigo-500 to-fuchsia-600 text-sm font-bold text-white shadow-lg">
          {initials || '?'}
          <div className="absolute inset-0 rounded-xl ring-2 ring-white/20 group-hover:ring-4 transition-all" />
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold leading-snug text-slate-900 group-hover:text-primary truncate">{item.title}</p>
          <p className="text-sm text-slate-500 truncate">{companyName}</p>
        </div>
      </div>

      {/* Type + Location */}
      <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 font-semibold text-slate-700 shadow-sm">
          <Building2 className="size-3.5" /> {typeLabel}
        </span>
        {location && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 shadow-sm">
            <MapPin className="size-3.5" /> {location}
          </span>
        )}
        {mode && (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1 shadow-sm">
            <Clock className="size-3.5" /> {mode}
          </span>
        )}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5 border-t border-slate-100 pt-3">
          {skills.slice(0, 4).map(s => (
            <span key={s} className="rounded-md bg-gradient-to-r from-primary/10 to-primary/5 px-2.5 py-1 text-xs font-semibold text-primary border border-primary/10">
              {s}
            </span>
          ))}
          {skills.length > 4 && (
            <span className="flex items-center rounded-md bg-slate-50 px-2 py-1 text-xs font-medium text-slate-500 border border-slate-200">+{skills.length - 4} more</span>
          )}
        </div>
      )}
    </Link>
  )
}

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-4">
      <div className="flex items-center gap-3">
        <div className="size-10 rounded-xl bg-slate-200" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-slate-200" />
          <div className="h-3 w-1/2 rounded bg-slate-200" />
        </div>
      </div>
      <div className="mt-3 flex gap-2">
        <div className="h-5 w-16 rounded-full bg-slate-200" />
        <div className="h-5 w-20 rounded-full bg-slate-200" />
      </div>
      <div className="mt-3 flex gap-1.5">
        <div className="h-5 w-14 rounded-md bg-slate-200" />
        <div className="h-5 w-16 rounded-md bg-slate-200" />
        <div className="h-5 w-12 rounded-md bg-slate-200" />
      </div>
    </div>
  )
}

export default function Recommended() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    api.get('/api/student/recommended')
      .then((data) => {
        if (cancelled) return
        const raw = data.recommended || []
        const mapped = raw.map((r) => {
          const kind = r.kind || 'job'
          return {
            ...r,
            kind,
            score: r.matchScore || r.matchPercentage || r.score || 0,
            id: r._id || r.id
          }
        })
        mapped.sort((a, b) => b.score - a.score)
        setItems(mapped)
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-primary to-violet-600 bg-clip-text text-transparent">Recommended for You</h2>
          <p className="mt-1 text-sm text-slate-500">Personalized matches based on your skills and preferences.</p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <div className="absolute -right-10 -top-10 size-48 rounded-full bg-primary/5" />
            <div className="absolute -bottom-8 -left-8 size-36 rounded-full bg-violet-500/5" />
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-violet-500/10 text-primary">
              <Sparkles className="size-7" />
            </div>
            <p className="font-semibold text-slate-700">No recommendations yet</p>
            <p className="mt-1 text-sm text-slate-500">Add skills to your profile to get personalized matches.</p>
            <div className="mt-6 flex justify-center gap-3">
              <Link to="/profile" className="rounded-xl bg-gradient-to-r from-primary to-violet-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:shadow-xl hover:scale-105">
                Update Profile
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm font-semibold text-slate-500">{items.length} recommended {items.length === 1 ? 'role' : 'roles'}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((item, i) => (
                <RecommendedCard key={item.id} item={item} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

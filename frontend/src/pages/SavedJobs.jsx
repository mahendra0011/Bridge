import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bookmark } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { JobCard, JobCardSkeleton } from '@/components/site/job-card'
import { InternshipCard } from '@/components/site/internship-card'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { normalizeOpportunity } from '@/lib/normalize'

export default function SavedJobs() {
  const { user } = useAuth()
  const [saved, setSaved] = useState([])
  const [loading, setLoading] = useState(true)

  const dashboardLink = user?.role === 'company' ? '/company/dashboard' : user?.role === 'admin' ? '/admin' : '/dashboard'

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/student/saved')
      .then((data) => {
        if (cancelled) return
        const jobs = (data.savedJobs || []).map((j) => normalizeOpportunity(j, 'job'))
        const internships = (data.savedInternships || []).map((i) => normalizeOpportunity(i, 'internship'))
        setSaved([...internships, ...jobs])
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to={dashboardLink} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Saved Roles</h2>
          <p className="mt-1 text-sm text-slate-500">Roles you've bookmarked for later.</p>
        </div>

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : saved.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <Bookmark className="size-6" />
            </div>
            <p className="font-semibold text-slate-600">No saved roles yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Tap the bookmark icon on any listing to save it here.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link
                to="/internships"
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
              >
                Browse internships
              </Link>
              <Link
                to="/jobs"
                className="rounded-lg border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary"
              >
                Browse jobs
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-sm font-semibold text-slate-500">{saved.length} saved {saved.length === 1 ? 'role' : 'roles'}</p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {saved.map((o, i) => (
                o.kind === 'internship'
                  ? <InternshipCard key={`${o.kind}-${o.id}`} item={o} index={i} />
                  : <JobCard key={`${o.kind}-${o.id}`} item={o} index={i} />
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

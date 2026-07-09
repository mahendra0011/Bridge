import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Send, Calendar, RotateCcw } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { StatusTimeline } from '@/components/site/status-timeline'
import { api } from '@/lib/api'

const statusStyles = {
  Applied: 'bg-slate-100 text-slate-700',
  'Under Review': 'bg-amber-50 text-amber-700',
  Shortlisted: 'bg-blue-50 text-blue-700',
  'Interview Scheduled': 'bg-violet-50 text-violet-700',
  Rejected: 'bg-rose-50 text-rose-700',
  Offered: 'bg-emerald-50 text-emerald-700',
  Hired: 'bg-emerald-50 text-emerald-700',
  Selected: 'bg-emerald-50 text-emerald-700',
}

function timeAgo(date) {
  if (!date) return ''
  const diffMs = Date.now() - new Date(date).getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

export default function StudentApplications() {
  const [apps, setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/api/student/applications')
      .then((data) => setApps(data.applications || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleReapply = async (appId) => {
    try {
      await api.post(`/api/student/applications/${appId}/reapply`)
      toast.success('Reapplied successfully!')
      setApps(p => p.map(a => a._id === appId ? { ...a, status: 'Applied' } : a))
    } catch (err) {
      toast.error(err.message || 'Could not reapply')
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">My Applications</h2>
          <p className="mt-1 text-sm text-slate-500">Track all your submitted applications here.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : apps.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
            <Send className="mx-auto size-10 mb-3 opacity-50" />
            <p className="font-semibold text-slate-600">No applications yet</p>
            <p className="mt-1 text-sm">Start by browsing internships or jobs.</p>
            <div className="mt-4 flex justify-center gap-3">
              <Link to="/internships" className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90">Browse Internships</Link>
              <Link to="/jobs" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-700 hover:bg-slate-50">Browse Jobs</Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Position</th>
                  <th className="px-6 py-3">Company</th>
                  <th className="px-6 py-3">Applied</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {apps.map((a) => (
                  <tr key={a._id} className="hover:bg-surface">
                    <td className="px-6 py-4 font-semibold">
                      <Link to={`/${a.postingType}/${a.posting?._id}`} className="hover:text-primary">
                        {a.posting?.title || 'Removed'}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-slate-600">{a.posting?.company?.name || '—'}</td>
                    <td className="px-6 py-4 text-slate-500">{timeAgo(a.createdAt)}</td>
                    <td className="px-6 py-4">
                      <span className={`rounded-full px-3 py-1 text-xs font-bold ${statusStyles[a.status] || statusStyles.Applied}`}>{a.status}</span>
                    </td>
                    <td className="px-6 py-4">
                      {a.status === 'Interview Scheduled' && (
                        <Link to={`/interview/${a._id}`} className="inline-flex items-center gap-1.5 rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-bold text-violet-700 hover:bg-violet-50">
                          <Calendar className="size-3" /> View Interview
                        </Link>
                      )}
                      {a.status === 'Rejected' && (
                        <button onClick={() => handleReapply(a._id)} className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 px-3 py-1.5 text-xs font-bold text-blue-700 hover:bg-blue-50">
                          <RotateCcw className="size-3" /> Reapply
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

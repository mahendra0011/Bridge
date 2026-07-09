import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye, Users, UserCheck, TrendingUp, Clock, ArrowLeft, BarChart3,
  Target, Award, Percent, CalendarDays, ChevronDown, Download
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api, BASE_URL } from '@/lib/api'

function MetricCard({ icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-2xl font-extrabold">{value}</div>
          <div className="text-sm text-slate-500">{label}</div>
          {sub && <div className="mt-1 text-xs text-slate-400">{sub}</div>}
        </div>
        <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${color}`}>
          {icon}
        </div>
      </div>
    </div>
  )
}

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-semibold truncate">{label}</span>
        <span className="text-slate-500 text-xs">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function CompanyAnalytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState('applicants')
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format = 'csv') => {
    setExporting(true)
    try {
      const endpoint = format === 'pdf' ? '/api/company/analytics/export/pdf' : '/api/company/analytics/export'
      const res = await fetch(`${BASE_URL}${endpoint}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `analytics.${format}`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { toast.error(err.message) }
    finally { setExporting(false) }
  }

  useEffect(() => {
    setLoading(true)
    api.get('/api/company/analytics')
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </DashboardLayout>
    )
  }

  const metrics = data || {}
  const sortedPostings = [...(metrics.postings || [])].sort((a, b) => {
    if (sortBy === 'applicants') return b.applicants - a.applicants
    if (sortBy === 'views') return b.views - a.views
    if (sortBy === 'conversion') return parseFloat(b.conversion) - parseFloat(a.conversion)
    if (sortBy === 'hired') return b.hired - a.hired
    return 0
  })

  const maxApps = Math.max(...sortedPostings.map(p => p.applicants), 1)
  const maxViews = Math.max(...sortedPostings.map(p => p.views), 1)

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div>
          <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-2">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Analytics</h1>
              <p className="text-sm text-slate-500">Track performance across all your listings.</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => handleExport('csv')} disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">
                <Download className="size-3.5" /> {exporting ? '...' : 'CSV'}
              </button>
              <button onClick={() => handleExport('pdf')} disabled={exporting}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">
                <Download className="size-3.5" /> {exporting ? '...' : 'PDF'}
              </button>
            </div>
          </div>
        </div>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard icon={<Eye className="size-5" />} label="Total Views" value={metrics.totalViews ?? 0} sub="Across all listings" color="bg-blue-50 text-blue-600" />
          <MetricCard icon={<Users className="size-5" />} label="Total Applicants" value={metrics.totalApplicants ?? 0} sub="All applications received" color="bg-violet-50 text-violet-600" />
          <MetricCard icon={<Percent className="size-5" />} label="Conversion Rate" value={`${metrics.conversionRate ?? 0}%`} sub="Applicants → Hired" color="bg-emerald-50 text-emerald-600" />
          <MetricCard icon={<Clock className="size-5" />} label="Avg Time-to-Hire" value={`${metrics.avgTimeToHire ?? 0}d`} sub="Days from apply to hire" color="bg-amber-50 text-amber-600" />
        </section>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-bold mb-4">Applicants per Posting</h3>
            <div className="space-y-3">
              {sortedPostings.map(p => (
                <Bar key={p._id} label={p.title} value={p.applicants} max={maxApps} color="bg-violet-500" />
              ))}
              {sortedPostings.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No data yet.</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-bold mb-4">Views per Posting</h3>
            <div className="space-y-3">
              {sortedPostings.map(p => (
                <Bar key={p._id} label={p.title} value={p.views} max={maxViews} color="bg-blue-500" />
              ))}
              {sortedPostings.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No data yet.</p>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Per-Posting Breakdown</h3>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold outline-none bg-white"
            >
              <option value="applicants">Sort by Applicants</option>
              <option value="views">Sort by Views</option>
              <option value="conversion">Sort by Conversion</option>
              <option value="hired">Sort by Hired</option>
            </select>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-sm">
              <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Views</th>
                  <th className="px-4 py-3">Applicants</th>
                  <th className="px-4 py-3">Shortlisted</th>
                  <th className="px-4 py-3">Hired</th>
                  <th className="px-4 py-3">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedPostings.map(p => (
                  <tr key={p._id} className="hover:bg-surface">
                    <td className="px-4 py-3 font-semibold">{p.title}</td>
                    <td className="px-4 py-3 capitalize text-slate-600">{p.kind}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
                        p.status === 'approved' ? 'bg-emerald-50 text-emerald-700'
                          : p.status === 'pending' ? 'bg-amber-50 text-amber-700'
                          : 'bg-slate-100 text-slate-500'
                      }`}>{p.status}</span>
                    </td>
                    <td className="px-4 py-3 font-semibold">{p.views}</td>
                    <td className="px-4 py-3">{p.applicants}</td>
                    <td className="px-4 py-3">{p.shortlisted}</td>
                    <td className="px-4 py-3 font-semibold text-emerald-600">{p.hired}</td>
                    <td className="px-4 py-3 font-semibold">{p.conversion}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {sortedPostings.length === 0 && (
              <div className="p-12 text-center text-slate-400">No postings yet. Create one to see analytics.</div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

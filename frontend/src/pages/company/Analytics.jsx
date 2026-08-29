import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Eye, Users, Award, Download, ArrowLeft, CalendarDays,
  BarChart3
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api, BASE_URL } from '@/lib/api'

function StatCard({ icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-3">
        <div className={`grid size-10 place-items-center rounded-xl ${color}`}>
          {icon}
        </div>
        <div>
          <div className="text-2xl font-extrabold">{value}</div>
          <div className="text-sm text-slate-500">{label}</div>
        </div>
      </div>
    </div>
  )
}

export default function CompanyAnalytics() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
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
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
          <div className="h-8 w-48 animate-pulse rounded-xl bg-slate-200" />
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const s = stats || {}

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold">Analytics</h1>
              <p className="text-sm text-slate-500">Performance overview of your postings</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('csv')} disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary transition-colors">
              <Download className="size-3.5" /> CSV
            </button>
            <button onClick={() => handleExport('pdf')} disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:border-primary transition-colors">
              <Download className="size-3.5" /> PDF
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={<Eye className="size-5" />} label="Total Views" value={s.totalViews ?? 0} color="bg-blue-50 text-blue-600" />
          <StatCard icon={<Users className="size-5" />} label="Total Applicants" value={s.totalApplicants ?? 0} color="bg-violet-50 text-violet-600" />
          <StatCard icon={<Award className="size-5" />} label="Hired" value={s.hired ?? 0} color="bg-emerald-50 text-emerald-600" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold mb-4">Recent Postings Activity</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {(s.postings || []).map(p => (
              <div key={p._id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                <div>
                  <p className="font-semibold text-sm">{p.title}</p>
                  <p className="text-xs text-slate-500 capitalize">{p.kind}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-violet-600">{p.applicants || 0} applicants</p>
                  <p className="text-xs text-emerald-600">{p.hired || 0} hired</p>
                </div>
              </div>
            ))}
            {(!s.postings || s.postings.length === 0) && (
              <p className="text-center text-slate-400 py-6">No activity yet. Post jobs to see analytics.</p>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
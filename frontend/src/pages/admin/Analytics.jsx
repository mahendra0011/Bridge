import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, TrendingUp, BarChart2, Building2, Award, Download } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api, BASE_URL } from '@/lib/api'

function BarChart({ data, color = '#6366f1', label }) {
  if (!data || data.length === 0) {
    return <div className="flex h-40 items-center justify-center text-sm text-slate-400">No data yet</div>
  }
  const max = Math.max(...data.map(d => d.count), 1)
  const W = 560, H = 140, PAD = 8, BAR_GAP = 2
  const barW = Math.max(3, (W - PAD * 2) / data.length - BAR_GAP)
  const step = Math.ceil(data.length / 7)

  return (
    <div>
      <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full overflow-visible">
        {data.map((d, i) => {
          const barH = Math.max(3, (d.count / max) * (H - 20))
          const x = PAD + i * (barW + BAR_GAP)
          const y = H - 16 - barH
          return (
            <g key={d.date} className="group">
              <rect x={x} y={y} width={barW} height={barH} rx={2} fill={color} opacity="0.85" className="transition-opacity hover:opacity-100" />
              <title>{`${d.date}: ${d.count}`}</title>
              {i % step === 0 && (
                <text x={x + barW / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#94a3b8">{d.date?.slice(5)}</text>
              )}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function HorizontalBars({ items, nameKey, valueKey, color = '#6366f1' }) {
  if (!items || items.length === 0) {
    return <div className="flex h-20 items-center justify-center text-sm text-slate-400">No data yet</div>
  }
  const max = Math.max(...items.map(d => d[valueKey]), 1)
  return (
    <ul className="space-y-3">
      {items.map((d, i) => (
        <li key={i} className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700 truncate max-w-[60%]">{d[nameKey]}</span>
            <span className="text-slate-500 text-xs font-semibold">{d[valueKey]}</span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-100">
            <div className="h-2 rounded-full transition-all duration-500" style={{ width: `${(d[valueKey] / max) * 100}%`, backgroundColor: color }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

function ChartCard({ title, icon: Icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center gap-2 mb-4">
        {Icon && <Icon className="size-4 text-slate-500" />}
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const handleExport = async (format = 'csv') => {
    setExporting(true)
    try {
      const endpoint = format === 'pdf' ? '/api/admin/analytics/export/pdf' : '/api/admin/analytics/export'
      const res = await fetch(`${BASE_URL}${endpoint}`, { credentials: 'include' })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = `platform-analytics.${format}`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { toast.error(err.message) }
    finally { setExporting(false) }
  }

  useEffect(() => {
    let cancelled = false
    api.get('/api/admin/analytics')
      .then((data) => { if (!cancelled) setAnalytics(data) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Admin Dashboard
        </Link>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Analytics</h2>
            <p className="mt-1 text-sm text-slate-500">Platform-wide analytics and insights.</p>
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

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-44 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            <ChartCard title="Signups Per Day (Last 30 Days)" icon={TrendingUp}>
              <BarChart data={analytics?.signupsPerDay ?? []} color="#6366f1" label="New users" />
            </ChartCard>
            <ChartCard title="Applications Per Day (Last 30 Days)" icon={BarChart2}>
              <BarChart data={analytics?.applicationsPerDay ?? []} color="#10b981" label="Applications submitted" />
            </ChartCard>
            <ChartCard title="Top Companies by Applications" icon={Building2}>
              <HorizontalBars items={analytics?.topCompanies ?? []} nameKey="name" valueKey="applications" color="#8b5cf6" />
            </ChartCard>
            <ChartCard title="Most Sought-After Skills" icon={Award}>
              <HorizontalBars items={analytics?.popularSkills ?? []} nameKey="skill" valueKey="count" color="#f59e0b" />
            </ChartCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

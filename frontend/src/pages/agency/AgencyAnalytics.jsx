import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3, TrendingUp, TrendingDown, Users, Eye, Briefcase,
  MessageSquare, Star, Download, Calendar, ArrowUp, ArrowDown,
  FileText, Clock, Zap, Activity, ArrowRight, Filter, Building2
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function MetricCard({ icon: Icon, label, value, change, changeLabel, colorKey }) {
  const isUp = change > 0
  const colors = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600' },
    violet: { bg: 'bg-violet-50', text: 'text-violet-600' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600' },
  }
  const c = colors[colorKey]
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className={'grid size-10 place-items-center rounded-xl ' + c.bg}>
          <Icon className={'size-5 ' + c.text} />
        </div>
        {change !== undefined && change !== null && (
          <div className={'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold ' + (isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')}>
            {isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>
      <div className="space-y-1">
        <div className="text-2xl font-extrabold text-slate-900">{value ?? '—'}</div>
        <div className="text-sm text-slate-500">{label}</div>
        {changeLabel && <p className="text-xs text-slate-400">{changeLabel}</p>}
      </div>
    </div>
  )
}

function SectionCard({ title, description, children, icon: Icon, action }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
                <Icon className="size-5 text-primary" />
              </div>
            )}
            <div>
              <h3 className="text-lg font-bold text-slate-800">{title}</h3>
              {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
            </div>
          </div>
          {action && <div>{action}</div>}
        </div>
      </div>
      <div className="px-6 pb-6">{children}</div>
    </div>
  )
}

export default function AgencyAnalytics() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState('30d')
  const [chartAnimated, setChartAnimated] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get(`/api/agency/analytics?period=${period}`).then(data => {
      setAnalytics(data.analytics || data)
      setTimeout(() => setChartAnimated(true), 100)
    }).catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [period])

  const a = analytics || {}

  const periodOptions = [
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' },
    { value: '1y', label: '1 Year' }
  ]

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-primary/10">
              <BarChart3 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Analytics Dashboard</h1>
              <p className="mt-1 text-sm text-slate-500">Track your agency's performance and engagement metrics.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="size-4 text-slate-400" />
            <div className="flex gap-1 rounded-lg bg-slate-100 p-1">
              {periodOptions.map(p => (
                <button key={p.value} onClick={() => setPeriod(p.value)}
                  className={'rounded-md px-3 py-1.5 text-xs font-bold transition-colors ' + (period === p.value ? 'bg-white text-foreground shadow-sm' : 'text-slate-500 hover:text-foreground')}>
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <MetricCard icon={Eye} label="Total Profile Views" value={a.totalViews ?? 0} change={a.viewsChange} colorKey="blue" changeLabel="vs previous period" />
            <MetricCard icon={Users} label="Total Applicants" value={a.totalApplicants ?? 0} change={a.applicantsChange} colorKey="violet" changeLabel="across all postings" />
            <MetricCard icon={MessageSquare} label="Inquiries Received" value={a.totalInquiries ?? 0} change={a.inquiriesChange} colorKey="emerald" changeLabel="messages & quotes" />
            <MetricCard icon={Star} label="Avg. Rating" value={a.avgRating ? a.avgRating.toFixed(1) : '—'} colorKey="amber" changeLabel={`${a.totalReviews || 0} reviews`} />
          </div>
        )}

        <SectionCard title="Service Category Performance" description="See which service categories bring the most inquiries." icon={BarChart3}>
          {(a.categoryBreakdown || []).length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-slate-100">
                <BarChart3 className="size-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 font-medium">No category data yet. Start posting to see insights.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={a.categoryBreakdown} barSize={32}>
                    <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: '#64748b' }} axisLine={false} tickLine={false} width={30} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0' }} />
                    <Bar dataKey="inquiries" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3 pt-2">
                {a.categoryBreakdown.map((cat, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-slate-700">{cat.name || cat.category || 'General'}</span>
                      <span className="text-xs text-slate-500">{cat.inquiries || 0} inquiries</span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: chartAnimated ? `${Math.max(...a.categoryBreakdown.map(c => c.inquiries || 0), 1) > 0 ? ((cat.inquiries || 0) / Math.max(...a.categoryBreakdown.map(c => c.inquiries || 0), 1)) * 100 : 0}%` : '0%' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>

        <SectionCard title="Posting Performance" description="How your individual listings are performing." icon={FileText}>
          {(a.postingPerformance || []).length === 0 ? (
            <div className="py-12 text-center">
              <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-slate-100">
                <FileText className="size-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-500 font-medium">No posting data yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    {['Title', 'Type', 'Views', 'Applicants', 'Inquiries', 'Conversion'].map(h => (
                      <th key={h} className="px-4 py-3">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {a.postingPerformance.map((p, i) => {
                    const conversion = p.views > 0 ? (((p.applicants || 0) / p.views) * 100).toFixed(1) : 0
                    const conversionNum = parseFloat(conversion)
                    return (
                      <tr key={i} className="hover:bg-surface transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800">{p.title}</td>
                        <td className="px-4 py-3 capitalize text-slate-600">{p.kind}</td>
                        <td className="px-4 py-3 text-slate-500">{p.views || 0}</td>
                        <td className="px-4 py-3 text-slate-500">{p.applicants || 0}</td>
                        <td className="px-4 py-3 text-slate-500">{p.inquiries || 0}</td>
                        <td className="px-4 py-3">
                          <span className={'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-bold ' + (conversionNum >= 5 ? 'bg-emerald-50 text-emerald-700' : conversionNum >= 2 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500')}>
                            {conversion}% {conversionNum >= 5 && <Zap className="size-3" />}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        <div className="grid gap-6 sm:grid-cols-2">
          <SectionCard title="Traffic Sources" icon={Activity}>
            {(a.trafficSources || []).length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No data yet.</p>
            ) : (
              <div className="space-y-4">
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={a.trafficSources} dataKey="percentage" nameKey="source" innerRadius={40} outerRadius={70} paddingAngle={2}>
                        {(a.trafficSources || []).map((entry, i) => (
                          <Cell key={`cell-${i}`} fill={['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][i % 5]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v) => `${v}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-3 pt-2">
                  {a.trafficSources.map((s, i) => (
                    <div key={i} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="size-2.5 rounded-full" style={{ backgroundColor: ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b'][i % 5] }} />
                        <span className="text-sm text-slate-700">{s.source}</span>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{s.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </SectionCard>

          <SectionCard title="Top Cities" icon={Building2}>
            {(a.topCities || []).length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">No data yet.</p>
            ) : (
              <div className="space-y-4">
                {a.topCities.map((c, i) => (
                  <div key={i} className="flex items-center justify-between py-1">
                    <span className="text-sm font-medium text-slate-700">{c.city}</span>
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
                      <Eye className="size-3.5" /> {c.count} views
                    </span>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="grid size-8 place-items-center rounded-lg bg-primary/10">
              <Zap className="size-4 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Quick Insights</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="grid size-10 place-items-center rounded-lg bg-blue-50 text-blue-600">
                <TrendingUp className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Best Performing</p>
                <p className="text-sm font-bold text-slate-800">{a.bestPerforming || '—'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-600">
                <Clock className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Response Time</p>
                <p className="text-sm font-bold text-slate-800">{a.avgResponseTime || '—'} hrs</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 p-4">
              <div className="grid size-10 place-items-center rounded-lg bg-violet-50 text-violet-600">
                <Download className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-slate-500">Download Report</p>
                <button className="text-sm font-semibold text-primary hover:underline">Export CSV</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

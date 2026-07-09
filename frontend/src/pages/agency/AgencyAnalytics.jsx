import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart3, TrendingUp, TrendingDown, Users, Eye, Briefcase,
  MessageSquare, Star, Download, Calendar, ArrowUp, ArrowDown,
  FileText, Clock, Zap, Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

function MetricCard({ icon: Icon, label, value, change, changeLabel, color }) {
  const isUp = change > 0
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`grid size-10 place-items-center rounded-xl ${color}`}>
          <Icon className="size-5 text-white" />
        </div>
        {change !== undefined && (
          <span className={`flex items-center gap-0.5 text-xs font-bold ${isUp ? 'text-emerald-600' : 'text-rose-600'}`}>
            {isUp ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" />}
            {Math.abs(change)}%
          </span>
        )}
      </div>
      <div className="text-2xl font-extrabold">{value ?? '—'}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {changeLabel && <p className="mt-1 text-xs text-slate-400">{changeLabel}</p>}
    </div>
  )
}

export default function AgencyAnalytics() {
  const [loading, setLoading] = useState(true)
  const [analytics, setAnalytics] = useState(null)
  const [period, setPeriod] = useState('30d')

  useEffect(() => {
    setLoading(true)
    api.get(`/api/agency/analytics?period=${period}`).then(data => {
      setAnalytics(data.analytics || data)
    }).catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false))
  }, [period])

  const a = analytics || {}

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Analytics</h2>
            <p className="mt-1 text-sm text-slate-500">Track your agency's performance and engagement.</p>
          </div>
          <div className="flex gap-2">
            {['7d', '30d', '90d', '1y'].map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${period === p ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : '1 Year'}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : (
          <>
            {/* Overview Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard icon={Eye} label="Total Profile Views" value={a.totalViews ?? 0} change={a.viewsChange} color="bg-blue-500" changeLabel="vs previous period" />
              <MetricCard icon={Users} label="Total Applicants" value={a.totalApplicants ?? 0} change={a.applicantsChange} color="bg-violet-500" changeLabel="across all postings" />
              <MetricCard icon={MessageSquare} label="Inquiries Received" value={a.totalInquiries ?? 0} change={a.inquiriesChange} color="bg-emerald-500" changeLabel="messages & quotes" />
              <MetricCard icon={Star} label="Avg. Rating" value={a.avgRating ? a.avgRating.toFixed(1) : '—'} color="bg-amber-500" changeLabel={`${a.totalReviews || 0} reviews`} />
            </div>

            {/* Service Category Breakdown */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-bold mb-1">Service Category Performance</h3>
              <p className="text-sm text-slate-500 mb-6">See which service categories bring the most inquiries.</p>

              {(a.categoryBreakdown || []).length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  <BarChart3 className="mx-auto mb-2 size-8 text-slate-300" />
                  <p>No category data yet. Start posting to see insights.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {a.categoryBreakdown.map((cat, i) => {
                    const maxInquiries = Math.max(...a.categoryBreakdown.map(c => c.inquiries || 0), 1)
                    const pct = ((cat.inquiries || 0) / maxInquiries) * 100
                    return (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-semibold">{cat.name || cat.category || 'General'}</span>
                          <div className="flex items-center gap-3 text-xs text-slate-500">
                            <span className="flex items-center gap-1"><MessageSquare className="size-3" /> {cat.inquiries || 0} inquiries</span>
                            <span className="flex items-center gap-1"><Eye className="size-3" /> {cat.views || 0} views</span>
                          </div>
                        </div>
                        <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Posting Performance */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="text-lg font-bold mb-1">Posting Performance</h3>
              <p className="text-sm text-slate-500 mb-6">How your individual listings are performing.</p>

              {(a.postingPerformance || []).length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-400">
                  <FileText className="mx-auto mb-2 size-8 text-slate-300" />
                  <p>No posting data yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px] text-sm">
                    <thead className="text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                      <tr>
                        <th className="pb-3 pr-4">Title</th>
                        <th className="pb-3 pr-4">Type</th>
                        <th className="pb-3 pr-4">Views</th>
                        <th className="pb-3 pr-4">Applicants</th>
                        <th className="pb-3 pr-4">Inquiries</th>
                        <th className="pb-3">Conversion</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {a.postingPerformance.map((p, i) => (
                        <tr key={i}>
                          <td className="py-3 pr-4 font-semibold">{p.title}</td>
                          <td className="py-3 pr-4 capitalize text-slate-600">{p.kind}</td>
                          <td className="py-3 pr-4 text-slate-600">{p.views || 0}</td>
                          <td className="py-3 pr-4 text-slate-600">{p.applicants || 0}</td>
                          <td className="py-3 pr-4 text-slate-600">{p.inquiries || 0}</td>
                          <td className="py-3">
                            <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                              {p.views > 0 ? (((p.applicants || 0) / p.views) * 100).toFixed(1) : 0}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Geographic / Source Data */}
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-bold mb-4">Traffic Sources</h3>
                {(a.trafficSources || []).length === 0 ? (
                  <p className="text-sm text-slate-400">No data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {a.trafficSources.map((s, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{s.source}</span>
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-24 rounded-full bg-slate-100 overflow-hidden">
                            <div className="h-full rounded-full bg-primary" style={{ width: `${s.percentage}%` }} />
                          </div>
                          <span className="text-xs font-bold w-10 text-right">{s.percentage}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="font-bold mb-4">Top Cities</h3>
                {(a.topCities || []).length === 0 ? (
                  <p className="text-sm text-slate-400">No data yet.</p>
                ) : (
                  <div className="space-y-3">
                    {a.topCities.map((c, i) => (
                      <div key={i} className="flex items-center justify-between">
                        <span className="text-sm">{c.city}</span>
                        <span className="text-xs font-bold text-slate-500">{c.count} views</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
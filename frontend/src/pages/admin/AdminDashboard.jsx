import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Building2, Briefcase, FileCheck, TrendingUp, BarChart2, Award,
  BadgeCheck, Flag, Ticket, CreditCard, Database, Megaphone, ScrollText,
  AlertTriangle, UserCheck, DollarSign, Activity, ShieldCheck, GraduationCap, BookOpen,
  Download
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api, BASE_URL } from '@/lib/api'
import { toast } from 'sonner'

function Stat({ icon, label, value, sub, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className={`mb-3 grid size-10 place-items-center rounded-xl ${color}`}>{icon}</div>
      <div className="text-2xl font-extrabold sm:text-3xl">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
      {sub !== undefined && <div className="mt-1 text-xs font-medium text-emerald-600">{sub > 0 ? `+${sub}%` : `${sub}%`} growth</div>}
    </div>
  )
}

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
              {i % step === 0 && <text x={x + barW / 2} y={H - 2} textAnchor="middle" fontSize="8" fill="#94a3b8">{d.date?.slice(5)}</text>}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function HorizontalBars({ items, nameKey, valueKey, color = '#6366f1' }) {
  if (!items || items.length === 0) return <div className="flex h-20 items-center justify-center text-sm text-slate-400">No data yet</div>
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
      <div className="mb-3 flex items-center gap-2">
        <Icon className="size-4 text-primary" />
        <h3 className="font-bold text-slate-800">{title}</h3>
      </div>
      {children}
    </div>
  )
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [analyticsLoading, setAnalyticsLoading] = useState(true)
  const [exporting, setExporting] = useState(false)

  const handleExport = async (kind, format = 'csv') => {
    setExporting(true)
    try {
      const endpoint = format === 'pdf' ? `/api/admin/analytics/export/pdf?kind=${kind}` : `/api/admin/analytics/export?kind=${kind}`
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        credentials: 'include',
      })
      if (!res.ok) throw new Error('Export failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const ext = format === 'pdf' ? 'pdf' : 'csv'
      const name = kind === 'all' ? 'platform-analytics' : `${kind}-analytics`
      const a = document.createElement('a')
      a.href = url; a.download = `${name}.${ext}`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { toast.error(err.message) }
    finally { setExporting(false) }
  }

  useEffect(() => {
    let c = false
    api.get('/api/admin/dashboard')
      .then(d => { if (!c) setStats(d) })
      .catch(() => {})
      .finally(() => { if (!c) setLoading(false) })
    return () => { c = true }
  }, [])

  useEffect(() => {
    let c = false
    api.get('/api/admin/analytics')
      .then(d => { if (!c) setAnalytics(d) })
      .catch(() => {})
      .finally(() => { if (!c) setAnalyticsLoading(false) })
    return () => { c = true }
  }, [])

  const s = stats?.stats
  const g = stats?.growth
  const navItems = [
    { label: 'Verification Queue', to: '/admin/verification-queue', icon: BadgeCheck, color: 'text-blue-600 bg-blue-50', desc: 'Pending company docs' },
    { label: 'Students', to: '/admin/students', icon: GraduationCap, color: 'text-cyan-600 bg-cyan-50', desc: 'Manage users' },
    { label: 'Companies', to: '/admin/companies', icon: Building2, color: 'text-violet-600 bg-violet-50', desc: 'Manage & verify' },
    { label: 'Internships', to: '/admin/internships', icon: BookOpen, color: 'text-emerald-600 bg-emerald-50', desc: 'Moderate listings' },
    { label: 'Jobs', to: '/admin/jobs', icon: Briefcase, color: 'text-amber-600 bg-amber-50', desc: 'Moderate listings' },
    { label: 'Reports', to: '/admin/reports', icon: Flag, color: 'text-rose-600 bg-rose-50', desc: 'Scam, harassment' },
    { label: 'Support Tickets', to: '/admin/tickets', icon: Ticket, color: 'text-purple-600 bg-purple-50', desc: 'Helpdesk queue' },
    { label: 'Billing & Plans', to: '/admin/billing', icon: CreditCard, color: 'text-indigo-600 bg-indigo-50', desc: 'Revenue & plans' },
    { label: 'Master Data', to: '/admin/master-data', icon: Database, color: 'text-slate-600 bg-slate-100', desc: 'Skills, categories' },
    { label: 'Announcements', to: '/admin/announcements', icon: Megaphone, color: 'text-orange-600 bg-orange-50', desc: 'Broadcasts' },
    { label: 'Audit Logs', to: '/admin/audit-logs', icon: ScrollText, color: 'text-neutral-600 bg-neutral-100', desc: 'Action history' },
    { label: 'Analytics', to: '/admin/analytics', icon: BarChart2, color: 'text-pink-600 bg-pink-50', desc: 'Deep insights' },
  ]

  return (
    <DashboardLayout>
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-8 sm:py-10">
        <div className="mx-auto flex max-w-7xl items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-white sm:text-3xl">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-indigo-200">Monitor platform activity, manage users, and oversee operations.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('internship')} disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/30 transition-colors">
              <Download className="size-3.5" /> Internships
            </button>
            <button onClick={() => handleExport('job')} disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/30 transition-colors">
              <Download className="size-3.5" /> Jobs
            </button>
            <button onClick={() => handleExport('all')} disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/30 transition-colors">
              <Download className="size-3.5" /> {exporting ? '...' : 'CSV'}
            </button>
            <button onClick={() => handleExport('all', 'pdf')} disabled={exporting}
              className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-3 py-2 text-xs font-bold text-white hover:bg-white/30 transition-colors">
              <Download className="size-3.5" /> {exporting ? '...' : 'PDF'}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:space-y-8 sm:px-6 sm:py-8">
        {/* Stats */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Users className="size-5" />} label="Total Users" value={loading ? '—' : s?.totalUsers ?? 0} sub={g?.students} color="bg-blue-50 text-blue-600" />
          <Stat icon={<Building2 className="size-5" />} label="Companies" value={loading ? '—' : s?.companies ?? 0} sub={g?.companies} color="bg-violet-50 text-violet-600" />
          <Stat icon={<Building2 className="size-5" />} label="Agencies" value={loading ? '—' : s?.agencies ?? 0} sub={g?.agencies} color="bg-indigo-50 text-indigo-600" />
          <Stat icon={<Briefcase className="size-5" />} label="Live Postings" value={loading ? '—' : s?.totalPostings ?? 0} color="bg-emerald-50 text-emerald-600" />
        </section>

        {/* Pending Items Quick Links */}
        {stats?.pending && (
          <section className="grid gap-4 sm:grid-cols-3">
            <Link to="/admin/verification-queue" className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4 transition-hover hover:bg-amber-100/50">
              <p className="text-xs font-semibold text-amber-700">Pending Companies</p>
              <p className="mt-1 text-2xl font-extrabold text-amber-900">{stats?.pending?.companies ?? 0}</p>
            </Link>
            <Link to="/admin/verification-queue" className="rounded-2xl border border-indigo-200 bg-indigo-50/50 p-4 transition-hover hover:bg-indigo-100/50">
              <p className="text-xs font-semibold text-indigo-700">Pending Agencies</p>
              <p className="mt-1 text-2xl font-extrabold text-indigo-900">{stats?.pending?.agencies ?? 0}</p>
            </Link>
            <Link to="/admin/reports" className="rounded-2xl border border-rose-200 bg-rose-50/50 p-4 transition-hover hover:bg-rose-100/50">
              <p className="text-xs font-semibold text-rose-700">Open Reports</p>
              <p className="mt-1 text-2xl font-extrabold text-rose-900">{stats?.pending?.reports ?? 0}</p>
            </Link>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat icon={<Activity className="size-5" />} label="Students" value={loading ? '—' : s?.students ?? 0} color="bg-cyan-50 text-cyan-600" />
          <Stat icon={<BarChart2 className="size-5" />} label="Internships" value={loading ? '—' : s?.internships ?? 0} color="bg-teal-50 text-teal-600" />
          <Stat icon={<BarChart2 className="size-5" />} label="Jobs" value={loading ? '—' : s?.jobs ?? 0} color="bg-orange-50 text-orange-600" />
          <Stat icon={<TrendingUp className="size-5" />} label="Hire Rate" value={loading ? '—' : `${s?.hireRate ?? 0}%`} color="bg-green-50 text-green-600" />
        </section>

        {/* Charts */}
        {analyticsLoading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(n => <div key={n} className="h-44 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : (
          <>
            <section className="grid gap-4 md:grid-cols-2">
              <ChartCard title="Signups Per Day (Last 30 Days)" icon={TrendingUp}>
                <BarChart data={analytics?.signupsPerDay ?? []} color="#6366f1" label="New users" />
              </ChartCard>
              <ChartCard title="Applications Per Day (Last 30 Days)" icon={BarChart2}>
                <BarChart data={analytics?.applicationsPerDay ?? []} color="#10b981" label="Applications submitted" />
              </ChartCard>
            </section>
            <section className="grid gap-4 md:grid-cols-2">
              <ChartCard title="Top Companies by Applications" icon={Building2}>
                <HorizontalBars items={analytics?.topCompanies ?? []} nameKey="name" valueKey="applications" color="#8b5cf6" />
              </ChartCard>
              <ChartCard title="Most Sought-After Skills" icon={Award}>
                <HorizontalBars items={analytics?.popularSkills ?? []} nameKey="skill" valueKey="count" color="#f59e0b" />
              </ChartCard>
            </section>
          </>
        )}

        {/* Quick Navigation */}
        <section>
          <h2 className="mb-4 text-lg font-extrabold text-slate-800">Quick Navigation</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {navItems.map(({ label, to, icon: Icon, color, desc }) => (
              <Link key={to} to={to}
                className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-primary hover:shadow-md">
                <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${color}`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <span className="block font-bold text-sm">{label}</span>
                  <span className="block text-xs text-slate-400 truncate">{desc}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </DashboardLayout>
  )
}

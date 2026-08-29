import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Building2, Briefcase, FileCheck, TrendingUp,
  AlertTriangle, Award, Ticket, CreditCard, Database,
  GraduationCap, BookOpen, Flag, Megaphone, ScrollText,
  Download, Zap, Globe
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api, BASE_URL } from '@/lib/api'
import { toast } from 'sonner'

function StatCard({ icon, label, value, color }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className={`mb-3 grid size-10 place-items-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
}

function Bar({ label, value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="font-semibold truncate">{label}</span>
        <span className="text-slate-500 text-xs font-bold">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

const navItems = [
  { label: 'Verification Queue', to: '/admin/verification-queue', icon: Building2, color: 'bg-blue-50 text-blue-600', desc: 'Pending docs' },
  { label: 'Students', to: '/admin/students', icon: GraduationCap, color: 'bg-cyan-50 text-cyan-600', desc: 'Manage users' },
  { label: 'Companies', to: '/admin/companies', icon: Building2, color: 'bg-violet-50 text-violet-600', desc: 'Manage & verify' },
  { label: 'Internships', to: '/admin/internships', icon: BookOpen, color: 'bg-emerald-50 text-emerald-600', desc: 'Moderate listings' },
  { label: 'Jobs', to: '/admin/jobs', icon: Briefcase, color: 'bg-amber-50 text-amber-600', desc: 'Moderate listings' },
  { label: 'Reports', to: '/admin/reports', icon: Flag, color: 'bg-rose-50 text-rose-600', desc: 'Scam, harassment' },
  { label: 'Support Tickets', to: '/admin/tickets', icon: Ticket, color: 'bg-purple-50 text-purple-600', desc: 'Helpdesk' },
  { label: 'Billing', to: '/admin/billing', icon: CreditCard, color: 'bg-indigo-50 text-indigo-600', desc: 'Revenue' },
]

export default function AdminDashboard() {
  const [stats, setStats] = useState(null)
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
      a.href = url; a.download = `analytics.${format}`; a.click()
      URL.revokeObjectURL(url)
    } catch (err) { toast.error(err.message) }
    finally { setExporting(false) }
  }

  useEffect(() => {
    api.get('/api/admin/dashboard')
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const s = stats?.stats || {}

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Admin Dashboard</h1>
            <p className="mt-1 text-sm text-slate-500">Monitor platform activity and manage operations.</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleExport('csv')} disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-primary transition-colors">
              <Download className="size-4" /> CSV
            </button>
            <button onClick={() => handleExport('pdf')} disabled={exporting}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-600 hover:border-primary transition-colors">
              <Download className="size-4" /> PDF
            </button>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="size-5" />} label="Total Users" value={loading ? '—' : s?.totalUsers ?? 0} color="bg-blue-50 text-blue-600" />
          <StatCard icon={<Building2 className="size-5" />} label="Companies" value={loading ? '—' : s?.companies ?? 0} color="bg-violet-50 text-violet-600" />
          <StatCard icon={<Briefcase className="size-5" />} label="Live Postings" value={loading ? '—' : s?.totalPostings ?? 0} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={<Award className="size-5" />} label="Hire Rate" value={loading ? '—' : `${s?.hireRate ?? 0}%`} color="bg-amber-50 text-amber-600" />
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold mb-4">Quick Metrics</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard icon={<Users className="size-4" />} label="New Today" value={s?.newToday ?? 0} color="bg-slate-50 text-slate-600" />
            <StatCard icon={<Zap className="size-4" />} label="Active Users" value={s?.activeUsers ?? 0} color="bg-emerald-50 text-emerald-600" />
            <StatCard icon={<FileCheck className="size-4" />} label="Applications" value={s?.totalApplications ?? 0} color="bg-violet-50 text-violet-600" />
            <StatCard icon={<Award className="size-4" />} label="Placements" value={s?.placements ?? 0} color="bg-amber-50 text-amber-600" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold mb-4">Signups Per Day</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(stats?.analytics?.signupsPerDay || []).map(d => (
                <Bar key={d.date} label={d.date} value={d.count} max={100} color="bg-indigo-500" />
              ))}
              {(!stats?.analytics?.signupsPerDay?.length) && <p className="text-slate-400">No data</p>}
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold mb-4">Applications Per Day</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {(stats?.analytics?.applicationsPerDay || []).map(d => (
                <Bar key={d.date} label={d.date} value={d.count} max={100} color="bg-emerald-500" />
              ))}
              {(!stats?.analytics?.applicationsPerDay?.length) && <p className="text-slate-400">No data</p>}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold mb-4">Quick Navigation</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {navItems.map(({ label, to, icon: Icon, color, desc }) => (
              <Link key={to} to={to}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md">
                <div className={`grid size-10 place-items-center rounded-xl ${color}`}>
                  <Icon className="size-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{label}</p>
                  <p className="text-xs text-slate-400">{desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
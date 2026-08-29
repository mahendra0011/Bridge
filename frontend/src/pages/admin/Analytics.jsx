import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowLeft, TrendingUp, BarChart2, Building2, Award, Download,
  Users, FileText
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api, BASE_URL } from '@/lib/api'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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

function ChartCard({ title, icon: Icon, children, gradient }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2.5 mb-4">
        <div className={`grid size-8 place-items-center rounded-lg bg-gradient-to-br ${gradient || 'from-indigo-500 to-purple-600'}`}>
          <Icon className="size-4 text-white" />
        </div>
        <h3 className="text-sm font-bold text-slate-800">{title}</h3>
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

  const stats = analytics ? {
    totalUsers: analytics.totalUsers || 0,
    totalCompanies: analytics.totalCompanies || 0,
    totalApplications: analytics.totalApplications || 0,
    totalPostings: analytics.totalPostings || 0,
  } : { totalUsers: '—', totalCompanies: '—', totalApplications: '—', totalPostings: '—' }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Admin Dashboard
        </Link>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
              <BarChart2 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Analytics</h1>
              <p className="text-sm text-slate-500 mt-0.5">Platform-wide metrics and insights.</p>
            </div>
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
          <StatCard icon={<Users className="size-5" />} label="Total Users" value={stats.totalUsers} color="bg-blue-50 text-blue-600" />
          <StatCard icon={<Building2 className="size-5" />} label="Companies" value={stats.totalCompanies} color="bg-violet-50 text-violet-600" />
          <StatCard icon={<FileText className="size-5" />} label="Applications" value={stats.totalApplications} color="bg-emerald-50 text-emerald-600" />
          <StatCard icon={<Award className="size-5" />} label="Postings" value={stats.totalPostings} color="bg-amber-50 text-amber-600" />
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="h-64 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            <ChartCard title="Signups Per Day (Last 30 Days)" icon={TrendingUp} gradient="from-blue-500 to-cyan-500">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={analytics?.signupsPerDay ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Applications Per Day (Last 30 Days)" icon={BarChart2} gradient="from-emerald-500 to-teal-500">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={analytics?.applicationsPerDay ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Top Companies by Applications" icon={Building2} gradient="from-violet-500 to-purple-500">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={analytics?.topCompanies?.slice(0, 5) ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="applications" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Most Sought-After Skills" icon={Award} gradient="from-amber-500 to-orange-500">
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={analytics?.popularSkills?.slice(0, 5) ?? []} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={25} />
                  <YAxis type="category" dataKey="skill" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} width={80} />
                  <Tooltip contentStyle={{ fontSize: '12px' }} />
                  <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
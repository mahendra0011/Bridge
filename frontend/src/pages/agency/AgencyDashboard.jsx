import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Building2, Briefcase, Users, Plus, FileText, Award, Eye, BarChart3, MessageSquare, Calendar, Bell, CheckCircle2, Clock, AlertCircle } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

function StatCard({ icon: Icon, label, value, color, accent, link }) {
  const inner = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className={`mb-3 grid size-10 place-items-center rounded-xl ${color}`}>
        <Icon className="size-5 text-white" />
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
  return link ? <Link to={link}>{inner}</Link> : inner
}

function QuickAction({ icon: Icon, label, to, color }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
      <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${color}`}>
        <Icon className="size-5 text-white" />
      </div>
      <span className="text-sm font-bold">{label}</span>
    </Link>
  )
}

export default function AgencyDashboard() {
  const { user, agency } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ activePostings: 0, totalApplicants: 0, views: 0, hired: 0 })
  const [recentPostings, setRecentPostings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'agency') {
      navigate('/login', { replace: true })
      return
    }
    if (!agency?.isProfileComplete) {
      navigate('/agency/signup?step=2', { replace: true })
      return
    }
  }, [user, agency, navigate])

  useEffect(() => {
    setLoading(true)
    api.get('/api/agency/dashboard').then(data => {
      setStats({
        activePostings: data.activePostings ?? 0,
        totalApplicants: data.totalApplicants ?? 0,
        views: data.views ?? 0,
        hired: data.hired ?? 0,
      })
      setRecentPostings(data.recentPostings || [])
    }).catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardLayout>
      <div className="px-4 py-6 sm:px-6 sm:py-8 max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome back, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
            <p className="mt-1 text-slate-500">Here's what's happening with your agency.</p>
          </div>
          <Link
            to="/company/post"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" /> Post New Gig/Project
          </Link>
        </div>

        {agency && !agency.isRegistered && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5">
            <div className="flex items-start gap-3">
              <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">Upgrade to Verified Agency</p>
                <p className="mt-1 text-xs text-amber-700">
                  You're currently operating as an informal team with limited posting capacity ({agency?.unregisteredLimit || 3} per month).
                  Register with Udyam and complete verification to unlock unlimited postings and a verified badge.
                </p>
                <Link to="/agency/verification" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                  Complete Verification →
                </Link>
              </div>
            </div>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Briefcase} label="Active Postings" value={loading ? '—' : stats.activePostings} color="bg-blue-500" accent="bg-blue-500" link="/agency/postings" />
          <StatCard icon={Users} label="Total Applicants" value={loading ? '—' : stats.totalApplicants} color="bg-violet-500" accent="bg-violet-500" link="/agency/pipeline" />
          <StatCard icon={Eye} label="Total Views" value={loading ? '—' : stats.views} color="bg-amber-500" accent="bg-amber-500" link="/agency/analytics" />
          <StatCard icon={Award} label="Hired" value={loading ? '—' : stats.hired} color="bg-emerald-500" accent="bg-emerald-500" link="/agency/pipeline" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction icon={Plus} label="Post New Gig/Project" to="/company/post" color="bg-primary" />
          <QuickAction icon={BarChart3} label="Applicant Pipeline (Kanban)" to="/agency/pipeline" color="bg-violet-500" />
          <QuickAction icon={Calendar} label="Interview Scheduling" to="/company/scheduling" color="bg-amber-500" />
          <QuickAction icon={MessageSquare} label="Messages & Chat" to="/agency/messages" color="bg-emerald-500" />
          <QuickAction icon={BarChart3} label="Analytics Dashboard" to="/agency/analytics" color="bg-rose-500" />
          <QuickAction icon={Building2} label="Agency Profile" to="/agency/profile" color="bg-cyan-500" />
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold">Recent Postings</h3>
              <p className="text-sm text-slate-500">Your latest job and internship listings.</p>
            </div>
            <Link to="/agency/postings" className="text-sm font-bold text-primary hover:underline">View All →</Link>
          </div>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
              ))}
            </div>
          ) : recentPostings.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
              <Briefcase className="mx-auto mb-3 size-8 text-slate-300" />
              <p className="font-semibold">No postings yet</p>
              <p className="mt-1 text-sm">Create your first listing to start receiving applications.</p>
              <Link to="/company/post" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
                <Plus className="size-4" /> Post Now
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full min-w-[600px] text-sm">
                <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-3">Title</th>
                    <th className="px-6 py-3">Type</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Applicants</th>
                    <th className="px-6 py-3">Views</th>
                    <th className="px-6 py-3">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPostings.map((p) => (
                    <tr key={p._id} className="hover:bg-surface">
                      <td className="px-6 py-4 font-semibold">{p.title}</td>
                      <td className="px-6 py-4 capitalize text-slate-600">{p.kind}</td>
                      <td className="px-6 py-4">
                        <span className={`rounded-full px-3 py-1 text-xs font-bold ${
                          p.status === 'approved' ? 'bg-emerald-50 text-emerald-700'
                            : p.status === 'pending' ? 'bg-amber-50 text-amber-700'
                            : p.status === 'draft' ? 'bg-slate-100 text-slate-500'
                            : 'bg-rose-50 text-rose-700'
                        }`}>{p.status}</span>
                      </td>
                      <td className="px-6 py-4">
                        <Link to={`/agency/pipeline?postingId=${p._id}`} className="font-bold text-primary hover:underline">
                          {p.applicantsCount || 0}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-slate-500">{p.views || 0}</td>
                      <td className="px-6 py-4 text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  )
}
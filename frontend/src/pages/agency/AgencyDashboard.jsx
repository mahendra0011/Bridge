import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Briefcase, Users, Award, Eye, Plus,
  BarChart3, MessageSquare, Calendar, Bell, Building2,
  ArrowRight, Rocket, FileText, AlertCircle, TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { useAuth } from '@/context/AuthContext'
import { api } from '@/lib/api'

function StatCard({ icon, label, value, color, link }) {
  const inner = (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition-shadow">
      <div className={`mb-3 grid size-10 place-items-center rounded-xl ${color}`}>
        {icon}
      </div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
  return link ? <Link to={link}>{inner}</Link> : inner
}

function QuickAction({ icon, label, to, color }) {
  return (
    <Link to={to} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
      <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${color}`}>
        {icon}
      </div>
      <span className="text-sm font-bold">{label}</span>
      <ArrowRight className="ml-auto size-4 text-slate-400" />
    </Link>
  )
}

function ActivityItem({ icon, title, description, time, color }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-3 transition-all hover:bg-surface">
      <div className={`grid size-8 place-items-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-slate-500">{description}</p>
      </div>
      <span className="text-xs text-slate-400">{time}</span>
    </div>
  )
}

export default function AgencyDashboard() {
  const { user, agency, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [stats, setStats] = useState({ activePostings: 0, totalApplicants: 0, views: 0, hired: 0 })
  const [recentPostings, setRecentPostings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (authLoading) return
    if (!user || user.role !== 'agency') {
      navigate('/login', { replace: true })
      return
    }
    if (!agency?.isProfileComplete) {
      navigate('/agency/signup?step=2', { replace: true })
      return
    }
  }, [user, agency, authLoading, navigate])

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
            <p className="mt-1 text-slate-500">Here's what's happening with your agency today.</p>
          </div>
          <Link
            to="/agency/post-gig"
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="size-4" /> Post New Gig/Project
          </Link>
        </div>

        {agency && !agency.isRegistered && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-4">
            <div className="flex items-start gap-3">
              <div className="grid size-10 place-items-center rounded-xl bg-amber-100 text-amber-600 shrink-0">
                <AlertCircle className="size-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-amber-800">Upgrade to Verified Agency</p>
                <p className="mt-1 text-xs text-amber-700">
                  You're currently operating as an informal team with limited posting capacity ({agency?.unregisteredLimit || 3} per month).
                  Register with Udyam and complete verification to unlock unlimited postings and a verified badge.
                </p>
                <Link to="/agency/verification" className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline">
                  Complete Verification <ArrowRight className="size-3" />
                </Link>
              </div>
            </div>
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Briefcase className="size-5" />} label="Active Postings" value={loading ? '—' : stats.activePostings} color="bg-blue-50 text-blue-600" link="/agency/postings" />
          <StatCard icon={<Users className="size-5" />} label="Total Applicants" value={loading ? '—' : stats.totalApplicants} color="bg-violet-50 text-violet-600" link="/agency/pipeline" />
          <StatCard icon={<Eye className="size-5" />} label="Total Views" value={loading ? '—' : stats.views} color="bg-amber-50 text-amber-600" link="/agency/analytics" />
          <StatCard icon={<Award className="size-5" />} label="Hired" value={loading ? '—' : stats.hired} color="bg-emerald-50 text-emerald-600" link="/agency/pipeline" />
        </section>

        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <QuickAction icon={<Plus className="size-5" />} label="Post New Gig/Project" to="/agency/post-gig" color="bg-primary/10 text-primary" />
          <QuickAction icon={<BarChart3 className="size-5" />} label="Applicant Pipeline (Kanban)" to="/agency/pipeline" color="bg-violet-50 text-violet-600" />
          <QuickAction icon={<Calendar className="size-5" />} label="Interview Scheduling" to="/agency/scheduling" color="bg-amber-50 text-amber-600" />
          <QuickAction icon={<MessageSquare className="size-5" />} label="Messages & Chat" to="/agency/messages" color="bg-emerald-50 text-emerald-600" />
          <QuickAction icon={<BarChart3 className="size-5" />} label="Analytics Dashboard" to="/agency/analytics" color="bg-rose-50 text-rose-600" />
          <QuickAction icon={<Building2 className="size-5" />} label="Agency Profile" to="/agency/profile" color="bg-cyan-50 text-cyan-600" />
          <QuickAction icon={<Bell className="size-5" />} label="Notifications" to="/notifications" color="bg-slate-100 text-slate-600" />
          <QuickAction icon={<FileText className="size-5" />} label="Manage All Postings" to="/agency/postings" color="bg-indigo-50 text-indigo-600" />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Recent Postings</h3>
                <p className="text-sm text-slate-500">Your latest job and internship listings.</p>
              </div>
              <Link to="/agency/postings" className="text-sm font-bold text-primary hover:underline">View All <ArrowRight className="inline size-3" /></Link>
            </div>
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            ) : recentPostings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
                <Rocket className="mx-auto mb-3 size-8 text-slate-300" />
                <p className="font-semibold">No postings yet</p>
                <p className="mt-1 text-sm">Create your first listing to start receiving applications.</p>
                <Link to="/agency/post-gig" className="mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline">
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
                          <Link to={'/agency/pipeline?postingId=' + p._id} className="font-bold text-primary hover:underline">
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

          <section>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">Recent Activity</h3>
                <p className="text-sm text-slate-500">Latest updates and notifications.</p>
              </div>
              <Link to="/notifications" className="text-sm font-bold text-primary hover:underline">
                <Bell className="size-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-14 animate-pulse rounded-xl bg-slate-100" />
                ))
              ) : (
                <>
                  <ActivityItem icon={<Users className="size-4" />} title="New applicant received" description="For Senior Developer Role at TechCorp" time="2h ago" color="bg-blue-50 text-blue-600" />
                  <ActivityItem icon={<MessageSquare className="size-4" />} title="New message from recruiter" description="Regarding your internship application" time="4h ago" color="bg-emerald-50 text-emerald-600" />
                  <ActivityItem icon={<Eye className="size-4" />} title="Profile viewed 15 times today" description="Increased visibility for your agency" time="1d ago" color="bg-amber-50 text-amber-600" />
                  <ActivityItem icon={<TrendingUp className="size-4" />} title="Posting boosted" description="Marketing Intern - expires in 5 days" time="2d ago" color="bg-rose-50 text-rose-600" />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  )
}

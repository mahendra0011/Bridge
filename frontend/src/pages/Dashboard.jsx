import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  FileCheck, Send, Calendar, Bookmark, Award, TrendingUp,
  Clock, ChevronRight, Sparkles, Target, Briefcase, Star,
  Bell, ArrowUpRight, CheckCircle2, User, Eye, Search
} from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { JobCard, JobCardSkeleton } from '@/components/site/job-card'
import { InternshipCard, InternshipCardSkeleton } from '@/components/site/internship-card'
import { normalizeOpportunity } from '@/lib/normalize'

function StatCard({ icon, label, value, trend, color, gradient }) {
  const [animatedVal, setAnimatedVal] = useState(0)

  useEffect(() => {
    if (value === 0) { setAnimatedVal(0); return }
    const timer = setTimeout(() => setAnimatedVal(value), 200)
    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg sm:p-4">
      <div className="flex items-center gap-3">
        <div className={`grid size-8 place-items-center rounded-lg sm:size-9 ${color} transition-all duration-300 group-hover:scale-110 group-hover:shadow-md`}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-lg font-extrabold sm:text-xl">{animatedVal}</div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            {label}
            {trend != null && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                <TrendingUp className="size-2.5" />
                {trend}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function CircularProgress({ percent }) {
  const radius = 40
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference
  const [animatedOffset, setAnimatedOffset] = useState(circumference)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedOffset(offset), 300)
    return () => clearTimeout(timer)
  }, [offset])

  return (
    <div className="relative mx-auto flex size-28 items-center justify-center sm:size-32">
      <svg className="size-28 -rotate-90 sm:size-32" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="8" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke="url(#progressGrad)" strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="100%" stopColor="#8b5cf6" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold sm:text-3xl">{percent}%</span>
        <span className="text-[10px] font-semibold text-slate-400 sm:text-xs">Complete</span>
      </div>
    </div>
  )
}

function ActivityCard({ icon, label, desc, time, color }) {
  return (
    <div className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-slate-50">
      <div className={`grid size-9 shrink-0 place-items-center rounded-lg ${color}`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{label}</p>
        <p className="truncate text-xs text-slate-500">{desc}</p>
      </div>
      {time && <span className="shrink-0 text-xs text-slate-400">{time}</span>}
    </div>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const [apps, setApps] = useState([])
  const [saved, setSaved] = useState([])
  const [profile, setProfile] = useState(null)
  const [openToWorkData, setOpenToWorkData] = useState({ openToWork: false, headline: '', openTo: 'both', skills: [], relocate: false })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get('/api/student/applications'),
      api.get('/api/student/profile'),
      api.get('/api/student/saved'),
      api.get('/api/student/open-to-work/status')
    ])
      .then(([appsData, profileData, savedData, otwData]) => {
        if (cancelled) return
        setApps(appsData.applications || [])
        setProfile(profileData.profile)
        setOpenToWorkData({
          openToWork: otwData?.openToWork || false,
          headline: otwData?.headline || '',
          openTo: otwData?.openTo || 'both',
          skills: otwData?.skills || [],
          relocate: otwData?.relocate || false
        })
        const jobs = (savedData.savedJobs || []).map((j) => normalizeOpportunity(j, 'job'))
        const internships = (savedData.savedInternships || []).map((i) => normalizeOpportunity(i, 'internship'))
        setSaved([...internships, ...jobs])
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const completionFields = profile ? {
    Name: profile.firstName,
    Phone: profile.phone,
    'College': profile.college,
    'Degree': profile.degree,
    Skills: profile.skills?.length > 0,
    Resume: !!profile.resumeUrl,
    Bio: !!profile.bio,
    LinkedIn: !!profile.linkedin,
  } : {}
  const completedCount = Object.values(completionFields).filter(Boolean).length
  const totalFields = Object.keys(completionFields).length
  const profileCompletion = profile ? Math.round((completedCount / totalFields) * 100) : 0

  const firstName = user?.name?.split(' ')[0] || 'there'

  const interviews = apps.filter((a) => a.status === 'Interview Scheduled')
  const offers = apps.filter((a) => ['Offered', 'Hired', 'Selected'].includes(a.status))
  const shortlisted = apps.filter((a) => a.status === 'Shortlisted')

  const recentApps = apps.slice(0, 4)

  return (
    <DashboardLayout>
      <div className="space-y-6 px-3 py-4 sm:px-4 sm:py-6 lg:px-5 lg:py-8">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-600 to-violet-600 p-6 text-white sm:p-8">
          {/* Decorative circles */}
          <div className="pointer-events-none absolute -right-10 -top-10 size-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute -bottom-8 -left-8 size-36 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute right-1/4 top-1/3 size-20 rounded-full bg-white/5" />

          <div className="relative">
            <div className="mb-1 flex items-center gap-2">
              <Sparkles className="size-5 text-yellow-300" />
              <span className="text-xs font-semibold uppercase tracking-wider text-indigo-200">Student Dashboard</span>
            </div>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Welcome back, {firstName}! 👋</h1>
            <p className="mt-1 text-sm text-indigo-200 sm:text-base">Track your applications, manage interviews, and land your dream role.</p>
          </div>

          {/* Quick action chips */}
          <div className="relative mt-4 flex flex-wrap gap-2">
            <Link to="/internships" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25">
              <Briefcase className="size-3.5" /> Browse Internships
            </Link>
            <Link to="/profile" className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/25">
              <User className="size-3.5" /> Complete Profile
            </Link>
          </div>
        </div>

        {/* Open to Work Section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="size-4 text-emerald-500" />
              <h2 className="text-base font-extrabold text-foreground sm:text-lg">Open to Work</h2>
            </div>
            <Link to="/open-to-work/settings" className="text-xs font-semibold text-primary hover:underline sm:text-sm">
              Manage Settings →
            </Link>
          </div>
          <div className="rounded-2xl border border-emerald-200/50 bg-gradient-to-br from-emerald-50 via-white to-white p-5 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className={`grid size-14 shrink-0 place-items-center rounded-2xl ${openToWorkData.openToWork ? 'bg-emerald-100' : 'bg-slate-100'}`}>
                  <Sparkles className={`size-7 ${openToWorkData.openToWork ? 'text-emerald-600' : 'text-slate-400'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${
                      openToWorkData.openToWork 
                        ? 'bg-emerald-100 text-emerald-700' 
                        : 'bg-slate-200 text-slate-600'
                    }`}>
                      <span className={`size-2 rounded-full ${openToWorkData.openToWork ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                      {openToWorkData.openToWork ? 'Active' : 'Inactive'}
                    </span>
                    {openToWorkData.openToWork && openToWorkData.openTo && (
                      <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 border border-slate-200">
                        {openToWorkData.openTo === 'both' ? 'Jobs & Internships' : openToWorkData.openTo === 'job' ? 'Jobs' : 'Internships'}
                      </span>
                    )}
                    {openToWorkData.openToWork && openToWorkData.relocate && (
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-600 border border-blue-200">
                        Open to relocate
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 text-sm ${openToWorkData.openToWork ? 'text-slate-600' : 'text-slate-500'}`}>
                    {openToWorkData.openToWork 
                      ? (openToWorkData.headline || 'Your profile is visible to recruiters. Companies can find you in their search results.')
                      : 'Enable "Open to Work" to make your profile visible to companies actively hiring.'}
                  </p>
                  {openToWorkData.openToWork && openToWorkData.skills?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {openToWorkData.skills.slice(0, 5).map((skill, i) => (
                        <span key={i} className="inline-flex items-center rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/20">
                          {skill}
                        </span>
                      ))}
                      {openToWorkData.skills.length > 5 && (
                        <span className="inline-flex items-center rounded-full bg-white/60 px-2 py-0.5 text-[10px] font-semibold text-primary ring-1 ring-primary/20">
                          +{openToWorkData.skills.length - 5} more
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
              <Link
                to="/open-to-work/settings"
                className={`shrink-0 inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-bold transition-all ${
                  openToWorkData.openToWork
                    ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-500/20'
                    : 'bg-primary text-white hover:bg-primary/90 shadow-lg shadow-primary/20'
                }`}
              >
                <Sparkles className="size-4" />
                {openToWorkData.openToWork ? 'Edit Profile' : 'Get Started'}
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-extrabold text-foreground sm:text-lg">Overview</h2>
            <Link to="/dashboard/applications" className="text-xs font-semibold text-primary hover:underline sm:text-sm">
              View All Applications →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <StatCard
              icon={<Send className="size-3.5 sm:size-4" />}
              label="Applied"
              value={apps.length}
              trend={apps.length > 0 ? apps.length : null}
              color="bg-sky-50 text-sky-600"
            />
            <StatCard
              icon={<Bookmark className="size-3.5 sm:size-4" />}
              label="Shortlisted"
              value={shortlisted.length}
              trend={shortlisted.length > 0 ? shortlisted.length : null}
              color="bg-blue-50 text-blue-600"
            />
            <StatCard
              icon={<Calendar className="size-3.5 sm:size-4" />}
              label="Interviews"
              value={interviews.length}
              trend={interviews.length > 0 ? interviews.length : null}
              color="bg-violet-50 text-violet-600"
            />
            <StatCard
              icon={<Award className="size-3.5 sm:size-4" />}
              label="Offers"
              value={offers.length}
              trend={offers.length > 0 ? offers.length : null}
              color="bg-emerald-50 text-emerald-600"
            />
          </div>
        </section>

        {/* Middle Row */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-7">
          {/* Quick Actions - 2 cols */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-lg bg-primary/10">
                <Sparkles className="size-4 text-primary" />
              </div>
              <h2 className="text-base font-extrabold text-foreground">Quick Actions</h2>
            </div>
            <div className="space-y-2">
              <Link
                to="/profile"
                className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm transition-transform group-hover:scale-110">
                  <User className="size-4 text-primary" />
                </span>
                <span className="flex-1">Update Profile</span>
                <ArrowUpRight className="size-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </Link>
              <Link
                to="/saved"
                className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm transition-transform group-hover:scale-110">
                  <Bookmark className="size-4 text-amber-500" />
                </span>
                <span className="flex-1">Saved Opportunities</span>
                <ArrowUpRight className="size-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </Link>
              <Link
                to="/internships"
                className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm transition-transform group-hover:scale-110">
                  <Search className="size-4 text-sky-500" />
                </span>
                <span className="flex-1">Find Internships</span>
                <ArrowUpRight className="size-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </Link>
              <Link
                to="/open-to-work/settings"
                className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-sm font-semibold text-foreground transition-all hover:border-primary/20 hover:bg-primary/5 hover:text-primary hover:shadow-sm"
              >
                <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-white shadow-sm transition-transform group-hover:scale-110">
                  <Target className="size-4 text-emerald-500" />
                </span>
                <span className="flex-1">Open to Work</span>
                <ArrowUpRight className="size-4 text-slate-400 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary" />
              </Link>
            </div>
          </div>

          {/* Profile Completion - 2 cols */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-lg bg-emerald-50">
                <CheckCircle2 className="size-4 text-emerald-600" />
              </div>
              <h2 className="text-base font-extrabold text-foreground">Profile Completion</h2>
            </div>

            <CircularProgress percent={profileCompletion} />

            <div className="mt-4 flex flex-wrap gap-1.5">
              {Object.entries(completionFields).map(([label, done]) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold transition-all sm:px-3 ${
                    done
                      ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/50'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {done ? <CheckCircle2 className="size-3" /> : <div className="size-2 rounded-full border border-slate-300" />}
                  {label}
                </span>
              ))}
            </div>
          </div>

          {/* Activity/Interviews - 3 cols */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 lg:col-span-3">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="grid size-7 place-items-center rounded-lg bg-violet-50">
                  <Clock className="size-4 text-violet-600" />
                </div>
                <h2 className="text-base font-extrabold text-foreground">
                  {interviews.length > 0 ? 'Upcoming Interviews' : 'Recent Activity'}
                </h2>
              </div>
              {interviews.length > 0 && (
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-600">
                  {interviews.length} Scheduled
                </span>
              )}
            </div>

            {interviews.length > 0 ? (
              <div className="space-y-1">
                {interviews.slice(0, 3).map((a) => (
                  <Link
                    key={a._id}
                    to={`/interview/${a._id}`}
                    className="group flex items-center gap-3 rounded-xl border border-slate-100 bg-violet-50/50 px-4 py-3 text-sm font-semibold text-violet-700 transition-all hover:border-violet-200 hover:bg-violet-50 hover:shadow-sm"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-white shadow-sm">
                      <Calendar className="size-4 text-violet-600" />
                    </span>
                    <span className="flex-1 truncate">{a.posting?.title || 'Interview'}</span>
                    <span className="shrink-0 text-xs font-medium text-violet-500">
                      {a.scheduledDate ? new Date(a.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Soon'}
                    </span>
                    <ChevronRight className="size-4 text-violet-400 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </Link>
                ))}
              </div>
            ) : recentApps.length > 0 ? (
              <div className="space-y-1">
                {recentApps.map((a) => (
                  <ActivityCard
                    key={a._id}
                    icon={<Send className="size-4 text-sky-600" />}
                    label={a.posting?.title || 'Application'}
                    desc={`${a.status} · ${a.company?.name || a.posting?.company || ''}`}
                    time={a.createdAt ? new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
                    color="bg-sky-50"
                  />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="mb-3 grid size-14 place-items-center rounded-2xl bg-slate-100">
                  <Briefcase className="size-7 text-slate-300" />
                </div>
                <p className="font-semibold text-foreground">No activity yet</p>
                <p className="mt-0.5 text-xs text-slate-400">Start applying to internships and jobs!</p>
                <Link to="/internships" className="mt-3 inline-flex items-center gap-1 rounded-full bg-primary px-4 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary/90">
                  Browse Opportunities <ArrowUpRight className="size-3" />
                </Link>
              </div>
            )}

            {apps.length > 0 && (
              <Link
                to="/dashboard/applications"
                className="mt-3 flex items-center justify-center gap-1 rounded-xl border border-slate-100 py-2 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-200 hover:bg-slate-50 hover:text-foreground"
              >
                View All Applications <ChevronRight className="size-3" />
              </Link>
            )}
          </div>
        </div>

        {/* My Applications Section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Send className="size-4 text-sky-600" />
              <h2 className="text-base font-extrabold text-foreground sm:text-lg">My Applications</h2>
            </div>
            <Link to="/dashboard/applications" className="text-xs font-semibold text-primary hover:underline sm:text-sm">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-slate-100">
                <Send className="size-8 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-600">No applications yet</p>
              <p className="mt-1 text-sm text-slate-400">Browse internships and apply to get started.</p>
              <Link to="/internships" className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90">
                Browse Internships
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {apps.slice(0, 4).map((app, idx) => (
                <Link
                  key={app._id}
                  to={`/${app.postingType}/${app.posting?._id || app.posting}`}
                  className="group rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:shadow-md"
                >
                  <div className="mb-2 flex items-start justify-between">
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ring-1 ${
                      app.status === 'Applied' ? 'bg-sky-50 text-sky-700 ring-sky-200' :
                      app.status === 'Shortlisted' ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                      app.status === 'Interview Scheduled' ? 'bg-violet-50 text-violet-700 ring-violet-200' :
                      app.status === 'Offered' || app.status === 'Hired' || app.status === 'Selected' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                      'bg-slate-100 text-slate-700 ring-slate-200'
                    }`}>
                      {app.status}
                    </span>
                    <ChevronRight className="size-4 text-slate-300 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
                  </div>
                  <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-primary">
                    {app.posting?.title || 'Application'}
                  </h3>
                  <p className="mt-1 text-xs text-slate-500">{app.posting?.company?.name || app.posting?.company || 'Company'}</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                    <Calendar className="size-3" />
                    Applied {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : '—'}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Saved Roles Section */}
        <section>
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bookmark className="size-4 text-amber-500" />
              <h2 className="text-base font-extrabold text-foreground sm:text-lg">Saved Roles</h2>
            </div>
            <Link to="/saved" className="text-xs font-semibold text-primary hover:underline sm:text-sm">
              View All →
            </Link>
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                i % 2 === 0 ? <InternshipCardSkeleton key={i} /> : <JobCardSkeleton key={i} />
              ))}
            </div>
          ) : saved.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-12 text-center">
              <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-slate-100">
                <Bookmark className="size-8 text-slate-300" />
              </div>
              <p className="font-semibold text-slate-600">No saved roles yet</p>
              <p className="mt-1 text-sm text-slate-400">Bookmark opportunities to view them later.</p>
              <Link to="/internships" className="mt-4 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90">
                Browse Opportunities
              </Link>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {saved.slice(0, 4).map((item, idx) => (
                item.kind === 'internship'
                  ? <InternshipCard key={`${item.kind}-${item.id}`} item={item} index={idx} />
                  : <JobCard key={`${item.kind}-${item.id}`} item={item} index={idx} />
              ))}
            </div>
          )}
        </section>

        {/* Bottom - Quick Stats Bar */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <Eye className="size-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Profile Views</p>
              <p className="text-sm font-extrabold text-foreground">{profile?.profileViews || 0}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <Star className="size-5 text-amber-400" />
            <div>
              <p className="text-xs text-slate-500">Rating</p>
              <p className="text-sm font-extrabold text-foreground">{profile?.rating || '—'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <FileCheck className="size-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Resume</p>
              <p className="text-sm font-extrabold text-foreground">{profile?.resumeUrl ? 'Uploaded' : 'Missing'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3">
            <Briefcase className="size-5 text-slate-400" />
            <div>
              <p className="text-xs text-slate-500">Skills</p>
              <p className="text-sm font-extrabold text-foreground">{profile?.skills?.length || 0}</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}

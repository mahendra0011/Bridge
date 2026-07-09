import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Eye, Pencil, Trash2, Copy, Zap, XCircle, ArrowUpDown,
  Search, Filter, MoreHorizontal, Clock, CheckCircle, AlertCircle,
  Ban, Rocket, FileText, Briefcase, TrendingUp, Bookmark, Users,
  MessageCircle, Bell
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const FILTER_TABS = ['all', 'active', 'filled', 'closed', 'expired']

const STAT_CARDS = [
  { key: 'totalOpps', label: 'Total Posted', icon: Briefcase, color: 'text-slate-800' },
  { key: 'totalApplicants', label: 'Total Applicants', icon: Users, color: 'text-primary' },
  { key: 'totalViews', label: 'Listing Views', icon: Eye, color: 'text-slate-800' },
]

export default function PersonMyListings() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [opportunities, setOpportunities] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [analytics, setAnalytics] = useState(null)
  const [fetchingAnalytics, setFetchingAnalytics] = useState(false)

  const load = () => {
    setLoading(true)
    api.get(`/api/opportunities?poster=${user._id}&limit=100`)
      .then(data => {
        setOpportunities(data.opportunities || [])
      })
      .catch(() => toast.error('Could not load opportunities'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    if (!user || user.role !== 'student') {
      navigate('/login', { replace: true })
      return
    }
    load()
  }, [user, navigate])

  const filtered = opportunities.filter(o => {
    if (filter !== 'all' && o.status !== filter) return false
    if (search && !o.title.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const duplicate = async (opp) => {
    try {
      await api.post(`/api/opportunities/${opp._id}/duplicate`)
      toast.success('Duplicated as draft')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const deletePosting = async (opp) => {
    if (!confirm(`Delete "${opp.title}"? This cannot be undone.`)) return
    try {
      await api.delete(`/api/opportunities/${opp._id}`)
      toast.success('Deleted')
      load()
    } catch (err) { toast.error(err.message) }
  }

  const loadAnalytics = async () => {
    if (fetchingAnalytics) return
    setFetchingAnalytics(true)
    try {
      const data = await api.get('/api/person/analytics')
      setAnalytics(data)
    } catch {} finally {
      setFetchingAnalytics(false)
    }
  }

  const statusIcon = (s) => {
    if (s === 'active') return <CheckCircle className="size-3.5 text-emerald-500" />
    if (s === 'filled') return <CheckCircle className="size-3.5 text-blue-500" />
    if (s === 'closed') return <XCircle className="size-3.5 text-rose-500" />
    if (s === 'expired') return <Clock className="size-3.5 text-amber-500" />
    return <AlertCircle className="size-3.5 text-slate-400" />
  }

  const statusColor = (s) => {
    if (s === 'active') return 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    if (s === 'filled') return 'bg-blue-50 text-blue-700 ring-1 ring-blue-200'
    if (s === 'closed') return 'bg-rose-50 text-rose-700 ring-1 ring-rose-200'
    if (s === 'expired') return 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
    return 'bg-slate-100 text-slate-500 ring-1 ring-slate-200'
  }

  const canPost = user?.isIdVerified

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        {/* Header Banner */}
        <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-white to-white p-6">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10">
                  <Briefcase className="size-5 text-primary" />
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight">My Listings</h1>
              </div>
              <p className="text-sm text-slate-500 max-w-md">
                Manage your posted opportunities, track performance, and discover talent for your projects.
              </p>
            </div>
            <Link 
              to={canPost ? "/post-opportunity" : "/profile?tab=verification"}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-all"
            >
              <Plus className="size-4" /> 
              {canPost ? 'Post New Opportunity' : 'Verify ID to Post'}
            </Link>
          </div>

          {/* Verification Warning */}
          {!canPost && (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 text-amber-600 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-amber-800">ID Verification Required</p>
                  <p className="mt-1 text-xs text-amber-700">
                    Verify your ID to post opportunities and build trust with applicants.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Analytics Dashboard */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Performance Overview</h3>
            <button 
              onClick={loadAnalytics} 
              disabled={fetchingAnalytics}
              className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
            >
              <TrendingUp className="size-3.5" />
              {fetchingAnalytics ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {analytics ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-4 text-center">
                <p className="text-2xl font-extrabold text-slate-800">{analytics.totalOpps || 0}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Total Posted</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-4 text-center">
                <p className="text-2xl font-extrabold text-primary">{analytics.totalApplicants || 0}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Total Applicants</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-slate-50 to-white border border-slate-100 p-4 text-center">
                <p className="text-2xl font-extrabold text-slate-800">{analytics.totalViews || 0}</p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Listing Views</p>
              </div>
              <div className="rounded-xl bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 p-4 text-center">
                <p className="text-2xl font-extrabold text-emerald-600">
                  {analytics.totalViews > 0 
                    ? `${((analytics.totalApplicants || 0) / analytics.totalViews * 100).toFixed(1)}%`
                    : '-'}
                </p>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mt-1">Conversion</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-xs text-slate-400 mb-3">Click to load analytics</p>
              <button 
                onClick={loadAnalytics} 
                className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <TrendingUp className="size-3.5" /> Load Stats
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search opportunities..." 
              className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary" 
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTER_TABS.map(t => (
              <button 
                key={t} 
                onClick={() => setFilter(t)}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors capitalize ${
                  filter === t 
                    ? 'bg-primary text-white' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Listings Grid */}
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <Rocket className="mb-4 size-16 rounded-2xl bg-slate-100 p-3 text-slate-300" />
            <p className="font-semibold text-slate-600 mb-2">No opportunities posted yet</p>
            <p className="text-sm text-slate-400 mb-4">
              {canPost 
                ? 'Start posting to attract applicants and grow your network.'
                : 'Verify your ID to start posting opportunities.'}
            </p>
            {canPost && (
              <Link 
                to="/post-opportunity" 
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
              >
                <Plus className="size-4" /> Post New Opportunity
              </Link>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((opp, idx) => (
              <div key={opp._id} className="group rounded-2xl border border-slate-200 bg-white p-5 transition-all hover:shadow-lg hover:-translate-y-0.5">
                <div className="flex items-start justify-between mb-3">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusColor(opp.status)}`}>
                    {statusIcon(opp.status)} {opp.status}
                  </span>
                  <Link 
                    to={`/opportunity/${opp._id}`}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary transition-colors"
                    title="View"
                  >
                    <Eye className="size-4" />
                  </Link>
                </div>
                <h3 className="font-bold text-sm text-slate-900 line-clamp-2 group-hover:text-primary transition-colors">
                  {opp.title}
                </h3>
                <p className="mt-1 text-xs text-slate-500 capitalize">{opp.opportunityType || 'Project-based'}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400">Applicants:</span>
                    <span className="ml-1 font-bold text-primary">{opp.applicantsCount || 0}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Views:</span>
                    <span className="ml-1 font-medium text-slate-600">{opp.views || 0}</span>
                  </div>
                </div>
                <div className="mt-2 text-xs text-slate-400">
                  ₹{opp.budget ? Number(opp.budget).toLocaleString() : '-'}
                  {opp.budgetType && opp.budget && (
                    <span className="text-slate-300">/{opp.budgetType === 'monthly' ? 'mo' : opp.budgetType === 'hourly' ? 'hr' : ''}</span>
                  )}
                </div>
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button 
                    onClick={() => duplicate(opp)}
                    disabled={!canPost}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 disabled:opacity-50"
                    title="Duplicate"
                  >
                    <Copy className="size-3.5" /> Duplicate
                  </button>
                  {opp.status === 'active' && (
                    <button 
                      onClick={() => deletePosting(opp)}
                      disabled={!canPost}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
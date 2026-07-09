import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Eye, Pencil, Trash2, Copy, Zap, XCircle, ArrowUpDown,
  Search, Filter, MoreHorizontal, Clock, CheckCircle, AlertCircle,
  Ban, Rocket, FileText, Briefcase, TrendingUp
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const FILTER_TABS = ['all', 'active', 'filled', 'closed', 'expired']

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
    if (s === 'active') return 'bg-emerald-50 text-emerald-700'
    if (s === 'filled') return 'bg-blue-50 text-blue-700'
    if (s === 'closed') return 'bg-rose-50 text-rose-700'
    if (s === 'expired') return 'bg-amber-50 text-amber-700'
    return 'bg-slate-100 text-slate-500'
  }

  // Check if user can post (ID verified)
  const canPost = user?.isIdVerified

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">My Opportunities</h2>
            <p className="mt-1 text-sm text-slate-500">Manage all opportunities you've posted.</p>
          </div>
          <div className="flex gap-2">
            <Link 
              to={canPost ? "/post-opportunity" : "/profile?tab=verification"}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="size-4" /> 
              {canPost ? 'Post New Opportunity' : 'Verify ID to Post'}
            </Link>
          </div>
        </div>

        {/* Verification Warning */}
        {!canPost && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
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

        {/* Analytics */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Your Stats</h4>
            <button 
              onClick={loadAnalytics} 
              disabled={fetchingAnalytics}
              className="text-xs font-semibold text-primary hover:underline disabled:opacity-50"
            >
              {fetchingAnalytics ? 'Loading...' : 'Refresh'}
            </button>
          </div>
          {analytics ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{analytics.totalOpps || 0}</p>
                <p className="text-[10px] text-slate-500">Total Posted</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{analytics.totalApplicants || 0}</p>
                <p className="text-[10px] text-slate-500">Total Applicants</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800">{analytics.totalViews || 0}</p>
                <p className="text-[10px] text-slate-500">Listing Views</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 text-center">
                <p className="text-lg font-bold text-slate-800">
                  {analytics.totalViews > 0 
                    ? `${((analytics.totalApplicants || 0) / analytics.totalViews * 100).toFixed(1)}%`
                    : '-'}
                </p>
                <p className="text-[10px] text-slate-500">Conversion</p>
              </div>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-xs text-slate-400">Click to load analytics</p>
              <button 
                onClick={loadAnalytics} 
                className="mt-2 inline-flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20 transition-colors"
              >
                <TrendingUp className="size-3.5" /> Load Stats
              </button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="Search opportunities..." 
              className="w-full rounded-lg border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-primary" 
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTER_TABS.map(t => (
            <button 
              key={t} 
              onClick={() => setFilter(t)}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors capitalize ${
                filter === t 
                  ? 'bg-primary/10 text-primary' 
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Listings Table */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
            <Rocket className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-semibold text-slate-600">No opportunities posted yet</p>
            <p className="mt-1 text-sm">
              {canPost 
                ? 'Click "Post New Opportunity" to create your first listing.'
                : 'Verify your ID first to start posting opportunities.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full min-w-[750px] text-sm">
              <thead className="bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="px-6 py-3">Title</th>
                  <th className="px-6 py-3">Type</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3">Applicants</th>
                  <th className="px-6 py-3">Views</th>
                  <th className="px-6 py-3">Budget</th>
                  <th className="px-6 py-3">Created</th>
                  <th className="px-6 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((opp) => (
                  <tr key={opp._id} className="hover:bg-slate-50">
                    <td className="px-6 py-4 font-semibold">{opp.title}</td>
                    <td className="px-6 py-4 capitalize text-slate-600">
                      {opp.opportunityType || 'Project-based'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${statusColor(opp.status)}`}>
                        {statusIcon(opp.status)} {opp.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-bold text-primary">{opp.applicantsCount || 0}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-500">{opp.views || 0}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {opp.budget 
                        ? `₹${Number(opp.budget).toLocaleString()}${opp.budgetType === 'monthly' ? '/mo' : opp.budgetType === 'hourly' ? '/hr' : ''}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 text-slate-500">
                      {new Date(opp.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Link 
                          to={`/opportunity/${opp._id}`} 
                          className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-primary hover:text-primary" 
                          title="View"
                        >
                          <Eye className="size-3.5" />
                        </Link>
                        <button 
                          onClick={() => duplicate(opp)} 
                          className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600" 
                          title="Duplicate"
                          disabled={!canPost}
                        >
                          <Copy className="size-3.5" />
                        </button>
                        {opp.status === 'active' && (
                          <button 
                            onClick={() => deletePosting(opp)} 
                            className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:border-rose-400 hover:text-rose-600" 
                            title="Delete"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tips Section */}
        {opportunities.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h4 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Quick Tips</h4>
            <ul className="space-y-2 text-xs text-slate-600">
              <li className="flex items-start gap-2">
                <CheckCircle className="size-3.5 shrink-0 text-emerald-500 mt-0.5" />
                Add social links (YouTube, Instagram, LinkedIn) to your profile to build trust with applicants.
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="size-3.5 shrink-0 text-emerald-500 mt-0.5" />
                Keep opportunity descriptions clear and mention payment terms upfront.
              </li>
              <li className="flex items-start gap-2">
                <AlertCircle className="size-3.5 shrink-0 text-amber-500 mt-0.5" />
                Never ask applicants to pay money to apply or get hired — report anyone who does.
              </li>
            </ul>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
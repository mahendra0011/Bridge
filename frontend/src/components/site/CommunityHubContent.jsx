import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import {
  FileText, Bookmark, Users, MessageCircle, Bell, Loader2, Settings,
  Plus, X,
} from 'lucide-react'
import { CommunityPostCard } from '@/components/site/CommunityPostCard'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'

const TABS = [
  { key: 'posts', label: 'My Posts', icon: FileText },
  { key: 'saved', label: 'Saved', icon: Bookmark },
  { key: 'following', label: 'Following', icon: Users },
  { key: 'activity', label: 'Activity', icon: MessageCircle },
  { key: 'alerts', label: 'Alerts', icon: Bell },
  { key: 'prefs', label: 'Settings', icon: Settings },
]

const POST_SUB_TABS = ['active', 'expired', 'draft']

const NOTIF_KEYS = [
  { key: 'followedUserPost', label: 'New post from people I follow' },
  { key: 'followedTagPost', label: 'New post in tags I follow' },
  { key: 'commentReply', label: 'Reply to my comment' },
  { key: 'postComment', label: 'Comment on my post' },
  { key: 'postLike', label: 'Like on my post' },
  { key: 'expiryReminder', label: 'Expiry reminders' },
]

export default function CommunityHubContent() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const tab = searchParams.get('tab') || 'posts'
  const [postSubTab, setPostSubTab] = useState('active')

  const [posts, setPosts] = useState([])
  const [saves, setSaves] = useState([])
  const [follows, setFollows] = useState([])
  const [activity, setActivity] = useState({ posts: [], comments: [] })
  const [alerts, setAlerts] = useState([])
  const [notifPrefs, setNotifPrefs] = useState({})
  const [loading, setLoading] = useState(true)

  // Create alert form
  const [showAlertForm, setShowAlertForm] = useState(false)
  const [alertName, setAlertName] = useState('')
  const [alertQuery, setAlertQuery] = useState('')
  const [alertPostType, setAlertPostType] = useState('')
  const [alertCategory, setAlertCategory] = useState('')
  const [savingAlert, setSavingAlert] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
    setLoading(true)
    const fetches = {}

    if (tab === 'posts') {
      fetches.posts = api.get(`/api/community/my/posts?status=${postSubTab === 'draft' ? 'draft' : postSubTab}`)
        .then(r => setPosts(r.posts || []))
    } else if (tab === 'saved') {
      fetches.saves = api.get('/api/community/my/saves')
        .then(r => setSaves(r.posts || []))
    } else if (tab === 'following') {
      fetches.follows = api.get('/api/community/follows')
        .then(r => setFollows(r.follows || []))
    } else if (tab === 'activity') {
      fetches.activity = api.get('/api/community/my/activity')
        .then(r => setActivity(r))
    } else if (tab === 'alerts') {
      fetches.alerts = api.get('/api/community/alerts')
        .then(r => setAlerts(r.alerts || []))
    } else if (tab === 'prefs') {
      fetches.prefs = api.get('/api/community/notif-prefs')
        .then(r => setNotifPrefs(r.prefs || {}))
    }

    Promise.all(Object.values(fetches)).catch(() => {}).finally(() => setLoading(false))
  }, [user, tab, postSubTab])

  const handleUnfollow = async (followId) => {
    try { await api.delete(`/api/community/follow/${followId}`); setFollows(prev => prev.filter(f => f._id !== followId)); toast.success('Unfollowed') }
    catch { toast.error('Failed') }
  }

  const handleDeleteAlert = async (alertId) => {
    try { await api.delete(`/api/community/alerts/${alertId}`); setAlerts(prev => prev.filter(a => a._id !== alertId)); toast.success('Alert deleted') }
    catch { toast.error('Failed') }
  }

  const handleCreateAlert = async (e) => {
    e.preventDefault()
    if (!alertQuery && !alertPostType && !alertCategory) { toast.error('Add at least one filter'); return }
    setSavingAlert(true)
    try {
      const filters = {}
      if (alertQuery) filters.query = alertQuery
      if (alertPostType) filters.postType = alertPostType
      if (alertCategory) filters.category = alertCategory
      const res = await api.post('/api/community/alerts', { name: alertName || `Alert ${alerts.length + 1}`, filters })
      setAlerts(prev => [res.alert, ...prev])
      setShowAlertForm(false); setAlertName(''); setAlertQuery(''); setAlertPostType(''); setAlertCategory('')
      toast.success('Alert created!')
    } catch { toast.error('Failed') }
    finally { setSavingAlert(false) }
  }

  const togglePref = async (key, value) => {
    try {
      setNotifPrefs(prev => ({ ...prev, [key]: value }))
      await api.patch('/api/community/notif-prefs', { [key]: value })
    } catch { setNotifPrefs(prev => ({ ...prev, [key]: !value })); toast.error('Failed') }
  }

  if (!user) return null

  const tabConfig = {
    posts: { icon: FileText, color: 'text-primary', count: posts.length },
    saved: { icon: Bookmark, color: 'text-amber-500', count: saves.length },
    following: { icon: Users, color: 'text-blue-500', count: follows.length },
    activity: { icon: MessageCircle, color: 'text-violet-500', count: (activity.posts?.length || 0) + (activity.comments?.length || 0) },
    alerts: { icon: Bell, color: 'text-rose-500', count: alerts.length },
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-6">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-primary/5 via-white to-white p-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <MessageCircle className="size-5 text-primary" />
              <h1 className="text-xl font-extrabold tracking-tight">Community Hub</h1>
            </div>
            <p className="text-sm text-slate-500">Connect, share, and discover opportunities.</p>
          </div>
          <Link to="/community" className="text-sm font-semibold text-primary hover:underline">
            ← Back to Feed
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 border-b border-slate-100">
        {TABS.map(t => {
          const config = tabConfig[t.key] || { icon: FileText, color: 'text-slate-500', count: 0 }
          return (
            <button key={t.key} onClick={() => setSearchParams({ tab: t.key })}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-xl px-4 py-2 text-sm font-medium transition-colors ${tab === t.key ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              <t.icon className={`size-4 ${tab === t.key ? 'text-white' : config.color}`} /> 
              {t.label}
              {config.count > 0 && (
                <span className={`ml-1 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tab === t.key ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {config.count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>
      ) : (
        <>
          {/* My Posts */}
          {tab === 'posts' && (
            <div>
              <div className="flex gap-2 mb-4">
                {POST_SUB_TABS.map(st => (
                  <button key={st} onClick={() => setPostSubTab(st)}
                    className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${postSubTab === st ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                  >
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
              {posts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <FileText className="mb-3 size-12 rounded-xl bg-slate-100 p-2.5 text-slate-300" />
                  <p className="font-semibold text-slate-600">No {postSubTab} posts</p>
                  <p className="mt-1 text-sm text-slate-400">Share opportunities to get started</p>
                  <Link to="/community" className="mt-3 text-sm text-primary hover:underline">Browse feed</Link>
                </div>
              ) : (
                <div className="space-y-4">{posts.map(p => <CommunityPostCard key={p._id} post={p} />)}</div>
              )}
            </div>
          )}

          {/* Saved */}
          {tab === 'saved' && (
            <div>
              {saves.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <Bookmark className="mb-3 size-12 rounded-xl bg-slate-100 p-2.5 text-slate-300" />
                  <p className="font-semibold text-slate-600">No saved posts yet</p>
                  <p className="mt-1 text-sm text-slate-400">Bookmark posts you find interesting</p>
                </div>
              ) : (
                <div className="space-y-4">{saves.map(p => <CommunityPostCard key={p._id} post={p} />)}</div>
              )}
            </div>
          )}

          {/* Following */}
          {tab === 'following' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {follows.length === 0 ? (
                <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <Users className="mb-3 size-12 rounded-xl bg-slate-100 p-2.5 text-slate-300" />
                  <p className="font-semibold text-slate-600">Not following anyone yet</p>
                  <p className="mt-1 text-sm text-slate-400">Discover people and tags in the community</p>
                  <Link to="/community" className="mt-3 text-sm text-primary hover:underline">Discover</Link>
                </div>
              ) : follows.map(f => (
                <div key={f._id} className="group rounded-2xl border border-slate-200 bg-white p-4 flex items-start gap-3 transition-all hover:shadow-md">
                  {f.targetType === 'user' && (
                    <Link to={`/person/${f.targetUser?._id}`} className="grid size-12 shrink-0 place-items-center rounded-full bg-primary/10 text-lg font-bold text-primary">
                      {(f.targetUser?.name || '?')[0].toUpperCase()}
                    </Link>
                  )}
                  {f.targetType === 'tag' && (
                    <Link to={`/community/tag/${f.targetTag}`} className="grid size-12 shrink-0 place-items-center rounded-full bg-amber-100 text-lg font-bold text-amber-600">#</Link>
                  )}
                  {f.targetType === 'company' && (
                    <div className="grid size-12 shrink-0 place-items-center rounded-full bg-blue-100 text-lg font-bold text-blue-600">C</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {f.targetType === 'user' ? f.targetUser?.name : f.targetType === 'tag' ? `#${f.targetTag}` : f.targetCompany?.name}
                    </p>
                    <p className="text-xs text-slate-400 capitalize mt-0.5">{f.targetType}</p>
                  </div>
                  <button onClick={() => handleUnfollow(f._id)} className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-colors">
                    Unfollow
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Activity */}
          {tab === 'activity' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <FileText className="size-4 text-primary" /> Recent Posts
                </h3>
                {activity.posts?.length === 0 ? (
                  <p className="text-xs text-slate-400">No posts yet</p>
                ) : (
                  <div className="space-y-2">
                    {activity.posts?.slice(0, 5).map(p => (
                      <Link key={p._id} to={`/community/post/${p._id}`} className="block rounded-xl border border-slate-200 bg-white p-4 hover:bg-slate-50 transition-colors">
                        <p className="text-sm font-semibold text-slate-800 truncate">{p.roleTitle || p.companyName || 'Post'}</p>
                        <p className="text-xs text-slate-400 mt-1">{p.postType} · {new Date(p.createdAt).toLocaleDateString()}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                  <MessageCircle className="size-4 text-violet-500" /> Recent Comments
                </h3>
                {activity.comments?.length === 0 ? (
                  <p className="text-xs text-slate-400">No comments yet</p>
                ) : (
                  <div className="space-y-2">
                    {activity.comments?.slice(0, 5).map(c => (
                      <div key={c._id} className="rounded-xl border border-slate-200 bg-white p-4">
                        <p className="text-sm text-slate-600">{c.text?.slice(0, 120)}{c.text?.length > 120 ? '...' : ''}</p>
                        <p className="text-xs text-slate-400 mt-2">on {c.post?.roleTitle || c.post?.companyName || 'a post'}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Alerts */}
          {tab === 'alerts' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-slate-500">Get notified when matching posts are created</p>
                <button onClick={() => setShowAlertForm(!showAlertForm)}
                  className="flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 transition-colors"
                >
                  <Plus className="size-3.5" /> New Alert
                </button>
              </div>

              {showAlertForm && (
                <form onSubmit={handleCreateAlert} className="mb-4 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-800">Create Alert</h3>
                    <button type="button" onClick={() => setShowAlertForm(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 hover:bg-white transition-colors">
                      <X className="size-4" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input value={alertName} onChange={e => setAlertName(e.target.value)} placeholder="Alert name" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                    <input value={alertQuery} onChange={e => setAlertQuery(e.target.value)} placeholder="Keywords (e.g. Remote + Content Writing)" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-primary focus:outline-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <select value={alertPostType} onChange={e => setAlertPostType(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-primary">
                        <option value="">Any type</option>
                        <option value="Job">Job</option>
                        <option value="Internship">Internship</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Referral">Referral</option>
                      </select>
                      <select value={alertCategory} onChange={e => setAlertCategory(e.target.value)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:outline-none focus:border-primary">
                        <option value="">Any category</option>
                        <option value="IT">IT</option>
                        <option value="Non-IT">Non-IT</option>
                        <option value="Government">Government</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAlertForm(false)} className="rounded-xl border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 hover:bg-white">
                      Cancel
                    </button>
                    <button type="submit" disabled={savingAlert} className="rounded-xl bg-primary px-5 py-1.5 text-xs font-semibold text-white disabled:opacity-50 flex items-center gap-1.5">
                      {savingAlert && <Loader2 className="size-3 animate-spin" />}
                      Create
                    </button>
                  </div>
                </form>
              )}

              {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 p-12 text-center">
                  <Bell className="mb-3 size-12 rounded-xl bg-slate-100 p-2.5 text-slate-300" />
                  <p className="font-semibold text-slate-600">No alerts set up</p>
                  <p className="mt-1 text-sm text-slate-400">Create alerts to get notified about relevant posts</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {alerts.map(a => (
                    <div key={a._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-all">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-slate-800">{a.name}</p>
                        <p className="text-xs text-slate-400 mt-1 truncate">{Object.values(a.filters || {}).filter(Boolean).join(', ')}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={`text-[10px] font-semibold px-3 py-1 rounded-full ${a.isActive ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {a.isActive ? 'Active' : 'Paused'}
                        </span>
                        <button onClick={() => handleDeleteAlert(a._id)} className="text-xs font-medium text-rose-500 hover:underline">
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Notification Preferences */}
          {tab === 'prefs' && (
            <div>
              <h3 className="text-sm font-bold text-slate-700 mb-1">Notification Preferences</h3>
              <p className="text-xs text-slate-500 mb-4">Control what community notifications you receive</p>
              <div className="space-y-3">
                {NOTIF_KEYS.map(nk => (
                  <div key={nk.key} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-sm transition-all">
                    <span className="text-sm text-slate-700">{nk.label}</span>
                    <button
                      onClick={() => togglePref(nk.key, !notifPrefs[nk.key])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${notifPrefs[nk.key] ? 'bg-primary' : 'bg-slate-200'}`}
                    >
                      <span className={`inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform ${notifPrefs[nk.key] ? 'translate-x-[22px]' : 'translate-x-[2px]'}`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

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

  return (
    <div className="mx-auto max-w-4xl px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900">Community Hub</h1>
          <p className="text-sm text-slate-500">Your posts, saves, follows, alerts and settings</p>
        </div>
        <Link to="/community" className="text-sm text-primary hover:underline">← Feed</Link>
      </div>

      <div className="flex gap-1 overflow-x-auto pb-2 mb-6 border-b border-slate-100">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setSearchParams({ tab: t.key })}
            className={`flex items-center gap-1.5 whitespace-nowrap px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === t.key ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="size-4" /> {t.label}
          </button>
        ))}
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
                    className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${postSubTab === st ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-500'}`}>
                    {st.charAt(0).toUpperCase() + st.slice(1)}
                  </button>
                ))}
              </div>
              {posts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <FileText className="mx-auto size-10 mb-2" />
                  <p className="text-sm">No {postSubTab} posts</p>
                  <Link to="/community" className="text-sm text-primary hover:underline mt-2 inline-block">Browse feed</Link>
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
                <div className="text-center py-12 text-slate-400">
                  <Bookmark className="mx-auto size-10 mb-2" /><p className="text-sm">No saved posts yet</p>
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
                <div className="col-span-full text-center py-12 text-slate-400">
                  <Users className="mx-auto size-10 mb-2" /><p className="text-sm">Not following anyone yet</p>
                  <Link to="/community" className="text-sm text-primary hover:underline mt-2 inline-block">Discover people</Link>
                </div>
              ) : follows.map(f => (
                <div key={f._id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center gap-3">
                  {f.targetType === 'user' && (
                    <Link to={`/person/${f.targetUser?._id}`} className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                      {(f.targetUser?.name || '?')[0].toUpperCase()}
                    </Link>
                  )}
                  {f.targetType === 'tag' && (
                    <Link to={`/community/tag/${f.targetTag}`} className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 text-sm font-bold text-amber-600">#</Link>
                  )}
                  {f.targetType === 'company' && (
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-600">C</div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-slate-800 truncate">
                      {f.targetType === 'user' ? f.targetUser?.name : f.targetType === 'tag' ? `#${f.targetTag}` : f.targetCompany?.name}
                    </p>
                    <p className="text-xs text-slate-400 capitalize">{f.targetType}</p>
                  </div>
                  <button onClick={() => handleUnfollow(f._id)} className="shrink-0 rounded-lg border border-slate-200 px-3 py-1 text-xs font-medium text-slate-500 hover:bg-slate-50">Unfollow</button>
                </div>
              ))}
            </div>
          )}

          {/* Activity */}
          {tab === 'activity' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Recent Posts</h3>
                {activity.posts?.length === 0 ? <p className="text-xs text-slate-400">No posts yet</p> : (
                  <div className="space-y-3">{activity.posts?.slice(0, 5).map(p => (
                    <Link key={p._id} to={`/community/post/${p._id}`} className="block rounded-lg border border-slate-100 p-3 hover:bg-slate-50">
                      <p className="text-sm font-medium text-slate-700 truncate">{p.roleTitle || p.companyName || 'Post'}</p>
                      <p className="text-xs text-slate-400">{p.postType} · {new Date(p.createdAt).toLocaleDateString()}</p>
                    </Link>
                  ))}</div>
                )}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-700 mb-3">Recent Comments</h3>
                {activity.comments?.length === 0 ? <p className="text-xs text-slate-400">No comments yet</p> : (
                  <div className="space-y-3">{activity.comments?.slice(0, 5).map(c => (
                    <div key={c._id} className="rounded-lg border border-slate-100 p-3">
                      <p className="text-sm text-slate-600">{c.text?.slice(0, 120)}{c.text?.length > 120 ? '...' : ''}</p>
                      <p className="text-xs text-slate-400 mt-1">on {c.post?.roleTitle || c.post?.companyName || 'a post'}</p>
                    </div>
                  ))}</div>
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
                  className="flex items-center gap-1 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-white">
                  <Plus className="size-3" /> New Alert
                </button>
              </div>

              {showAlertForm && (
                <form onSubmit={handleCreateAlert} className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-bold text-slate-700">Create Alert</h3>
                    <button type="button" onClick={() => setShowAlertForm(false)} className="text-slate-400 hover:text-slate-600"><X className="size-4" /></button>
                  </div>
                  <div className="space-y-2.5">
                    <input value={alertName} onChange={e => setAlertName(e.target.value)} placeholder="Alert name" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                    <input value={alertQuery} onChange={e => setAlertQuery(e.target.value)} placeholder="Keywords (e.g. Remote + Content Writing)" className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                    <div className="grid grid-cols-2 gap-2">
                      <select value={alertPostType} onChange={e => setAlertPostType(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                        <option value="">Any type</option>
                        <option value="Job">Job</option>
                        <option value="Internship">Internship</option>
                        <option value="Walk-in">Walk-in</option>
                        <option value="Referral">Referral</option>
                      </select>
                      <select value={alertCategory} onChange={e => setAlertCategory(e.target.value)} className="rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:border-primary">
                        <option value="">Any category</option>
                        <option value="IT">IT</option>
                        <option value="Non-IT">Non-IT</option>
                        <option value="Government">Government</option>
                        <option value="Remote">Remote</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-end gap-2">
                    <button type="button" onClick={() => setShowAlertForm(false)} className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600">Cancel</button>
                    <button type="submit" disabled={savingAlert} className="rounded-lg bg-primary px-4 py-1.5 text-xs font-medium text-white disabled:opacity-50">
                      {savingAlert ? <Loader2 className="size-3 animate-spin" /> : 'Create'}
                    </button>
                  </div>
                </form>
              )}

              {alerts.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Bell className="mx-auto size-10 mb-2" /><p className="text-sm">No alerts set up</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map(a => (
                    <div key={a._id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-slate-800">{a.name}</p>
                        <p className="text-xs text-slate-400 truncate">{Object.values(a.filters || {}).filter(Boolean).join(', ')}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${a.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                          {a.isActive ? 'Active' : 'Paused'}
                        </span>
                        <button onClick={() => handleDeleteAlert(a._id)} className="text-xs text-rose-500 hover:underline">Delete</button>
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
              <div className="space-y-2">
                {NOTIF_KEYS.map(nk => (
                  <div key={nk.key} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
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

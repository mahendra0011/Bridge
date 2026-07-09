import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, CheckCheck, Briefcase, FileCheck, Calendar, Star, Trash2, X, Filter, Clock } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/hooks/useSocket'
import { toast } from 'sonner'

const iconMap = {
  '📋': { icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Application' },
  '📅': { icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50', label: 'Interview' },
  '⭐': { icon: Star, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Match' },
  '💼': { icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Opportunity' },
}
const defaultIcon = { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-100', label: 'General' }

function timeAgo(date) {
  if (!date) return ''
  const diffMs = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins} min ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
  const days = Math.floor(hours / 24)
  return `${days} day${days > 1 ? 's' : ''} ago`
}

export default function Notifications() {
  const { user } = useAuth()
  const [notifs, setNotifs] = useState([])
  const [loading, setLoading] = useState(true)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [filter, setFilter] = useState('all') // all, unread, read

  const dashboardLink = user?.role === 'company' ? '/company/dashboard' : user?.role === 'admin' ? '/admin' : '/dashboard'

  useEffect(() => {
    let cancelled = false
    api
      .get('/api/student/notifications')
      .then((data) => { if (!cancelled) setNotifs(data.notifications || []) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  useSocket({
    notification: (notif) => {
      setNotifs((prev) => [{ ...notif, read: false }, ...prev])
    },
  })

  const filteredNotifs = notifs.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'read') return n.read
    return true
  })
  const unread = notifs.filter((n) => !n.read).length

  const markAllRead = async () => {
    setNotifs((prev) => prev.map((n) => ({ ...n, read: true })))
    try {
      await api.patch('/api/student/notifications/read-all')
    } catch {
      // best-effort
    }
  }

  const markRead = (id) => {
    setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)))
    api.patch(`/api/student/notifications/${id}/read`).catch(() => {})
  }

  const deleteOne = async (e, id) => {
    e.stopPropagation()
    setNotifs((prev) => prev.filter((n) => n._id !== id))
    try {
      await api.delete(`/api/student/notifications/${id}`)
    } catch {
      // best-effort
    }
  }

  const clearAll = async () => {
    setNotifs([])
    setClearConfirm(false)
    try {
      await api.delete('/api/student/notifications')
      toast.success('All notifications cleared')
    } catch {
      // best-effort
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to={dashboardLink} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Notifications</h2>
            <p className="mt-1 text-sm text-slate-500">
              {unread > 0 ? `${unread} unread notification${unread > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {notifs.length > 0 && (
              <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
                {['all', 'unread', 'read'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      filter === f 
                        ? 'bg-white text-primary shadow-sm' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    {f.charAt(0).toUpperCase() + f.slice(1)}
                  </button>
                ))}
              </div>
            )}
            {notifs.length > 0 && (
              <div className="flex items-center gap-2">
                {unread > 0 && (
                  <Button
                    onClick={markAllRead}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-none hover:border-primary hover:text-primary"
                  >
                    <CheckCheck className="size-4" /> Mark all read
                  </Button>
                )}

                {clearConfirm ? (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2">
                    <span className="text-xs font-semibold text-rose-700">Clear all?</span>
                    <button onClick={clearAll} className="text-xs font-bold text-rose-600 hover:text-rose-800">Yes</button>
                    <button onClick={() => setClearConfirm(false)} className="text-xs font-bold text-slate-500 hover:text-slate-700">Cancel</button>
                  </div>
                ) : (
                  <Button
                    onClick={() => setClearConfirm(true)}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-none hover:border-rose-300 hover:text-rose-600"
                  >
                    <Trash2 className="size-4" /> Clear all
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : filteredNotifs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <div className="mx-auto mb-4 grid size-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/10 to-primary/20 text-primary">
              <Bell className="size-8" />
            </div>
            <p className="font-bold text-slate-700">
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </p>
            <p className="mt-1 text-sm text-slate-400">We'll notify you when something important happens.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifs.map((n) => {
              const { icon: Icon, color, bg, label } = iconMap[n.icon] || defaultIcon
              return (
                <div
                  key={n._id}
                  onClick={() => markRead(n._id)}
                  className={`group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all hover:shadow-md hover:border-primary ${
                    n.read ? 'border-slate-200 bg-white' : 'border-primary/20 bg-gradient-to-r from-primary/5 to-white'
                  }`}
                >
                  <div className={`grid size-12 shrink-0 place-items-center rounded-xl ${bg} ring-1 ring-slate-200/50`}>
                    <Icon className={`size-5 ${color}`} />
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <p className={`text-sm font-bold ${n.read ? 'text-slate-700' : 'text-foreground'}`}>
                          {n.title}
                        </p>
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${bg} ${color}`}>
                          {label}
                        </span>
                      </div>
                      {!n.read && <span className="size-2.5 shrink-0 rounded-full bg-primary animate-pulse" />}
                    </div>
                    <p className="mt-1 text-sm text-slate-500 leading-relaxed">{n.message}</p>
                    <p className="mt-2 text-xs font-medium text-slate-400 flex items-center gap-1">
                      <Clock className="size-3" /> {timeAgo(n.createdAt)}
                    </p>
                  </div>

                  <button
                    onClick={(e) => deleteOne(e, n._id)}
                    className="absolute right-4 top-4 grid size-7 place-items-center rounded-lg text-slate-300 opacity-0 transition-all hover:bg-rose-50 hover:text-rose-500 group-hover:opacity-100"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

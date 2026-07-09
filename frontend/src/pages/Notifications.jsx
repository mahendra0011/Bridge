import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Bell, CheckCheck, Briefcase, FileCheck, Calendar, Star, Trash2, X } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { useSocket } from '@/hooks/useSocket'
import { toast } from 'sonner'

const iconMap = {
  '📋': { icon: FileCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  '📅': { icon: Calendar, color: 'text-violet-600', bg: 'bg-violet-50' },
  '⭐': { icon: Star, color: 'text-amber-600', bg: 'bg-amber-50' },
  '💼': { icon: Briefcase, color: 'text-emerald-600', bg: 'bg-emerald-50' },
}
const defaultIcon = { icon: Bell, color: 'text-slate-600', bg: 'bg-slate-100' }

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

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : notifs.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center">
            <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400">
              <Bell className="size-6" />
            </div>
            <p className="font-semibold text-slate-600">No notifications yet</p>
            <p className="mt-1 text-sm text-slate-400">We'll notify you when something important happens.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifs.map((n) => {
              const { icon: Icon, color, bg } = iconMap[n.icon] || defaultIcon
              return (
                <div
                  key={n._id}
                  onClick={() => markRead(n._id)}
                  className={`group relative flex cursor-pointer items-start gap-4 rounded-2xl border p-5 transition-all hover:border-primary ${
                    n.read ? 'border-slate-200 bg-white' : 'border-primary/20 bg-primary/5'
                  }`}
                >
                  <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${bg}`}>
                    <Icon className={`size-5 ${color}`} />
                  </div>

                  <div className="flex-1 min-w-0 pr-8">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-bold ${n.read ? 'text-slate-700' : 'text-foreground'}`}>
                        {n.title}
                      </p>
                      {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 text-sm text-slate-500">{n.message}</p>
                    <p className="mt-1.5 text-xs text-slate-400">{timeAgo(n.createdAt)}</p>
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

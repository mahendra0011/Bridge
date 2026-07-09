import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ArrowLeft, CheckCheck, Calendar, Users, FileText, AlertTriangle, Megaphone, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

const iconMap = {
  '📋': FileText,
  '📅': Calendar,
  '🔔': Bell,
  '⚠️': AlertTriangle,
  '📢': Megaphone,
  '⏰': Clock,
  '👤': Users,
}

export default function CompanyNotifications() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const load = () => {
    setLoading(true)
    api.get('/api/company/notifications')
      .then(data => setNotifications(data.notifications || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const markRead = async (id) => {
    setNotifications(p => p.map(n => n._id === id ? { ...n, read: true } : n))
    try { await api.patch(`/api/company/notifications/${id}/read`) }
    catch (err) { toast.error(err.message) }
  }

  const markAllRead = async () => {
    setNotifications(p => p.map(n => ({ ...n, read: true })))
    try { await api.patch('/api/company/notifications/read-all') }
    catch (err) { toast.error(err.message) }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-2">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Notifications</h1>
            <p className="text-sm text-slate-500">
              {loading ? 'Loading...' : `${notifications.length} notification${notifications.length !== 1 ? 's' : ''}`}
              {unreadCount > 0 && <span className="ml-2 text-primary font-semibold">({unreadCount} unread)</span>}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:border-primary hover:text-primary transition-colors">
              <CheckCheck className="size-4" /> Mark All Read
            </button>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />)}
          </div>
        ) : notifications.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
            <Bell className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-semibold text-slate-600">No notifications yet</p>
            <p className="mt-1 text-sm">You'll see new application alerts, deadline reminders, and updates here.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(n => {
              const Icon = iconMap[n.icon] || Bell
              return (
                <div key={n._id} onClick={() => !n.read && markRead(n._id)}
                  className={`rounded-2xl border p-4 cursor-pointer transition-colors ${n.read ? 'border-slate-100 bg-white' : 'border-primary/20 bg-primary/5'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${n.read ? 'bg-slate-100 text-slate-400' : 'bg-primary/10 text-primary'}`}>
                      <Icon className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className={`text-sm ${n.read ? 'text-foreground' : 'font-bold text-foreground'}`}>{n.title}</p>
                        {!n.read && <span className="size-2 shrink-0 rounded-full bg-primary mt-1.5" />}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{n.message}</p>
                      <p className="text-[11px] text-slate-400 mt-1">{new Date(n.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                  {n.link && (
                    <a href={n.link} className="mt-2 inline-flex text-xs font-bold text-primary hover:underline ml-13">View details →</a>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

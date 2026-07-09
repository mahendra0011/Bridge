import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Video, MapPin, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function StudentInterviews() {
  const [interviews, setInterviews] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const year = date.getFullYear()
  const month = date.getMonth()

  useEffect(() => {
    api.get('/api/student/applications')
      .then((data) => {
        const apps = data.applications || []
        setInterviews(apps.filter((a) => a.status === 'Interview Scheduled'))
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const dayInterviews = selectedDay
    ? interviews.filter(a => {
        const d = new Date(a.interviewDate || a.updatedAt)
        return d.getDate() === selectedDay.getDate() &&
          d.getMonth() === selectedDay.getMonth() &&
          d.getFullYear() === selectedDay.getFullYear()
      })
    : []

  const renderCalendar = () => {
    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2 text-xs text-slate-300 text-center">{prevMonthDays - firstDay + i + 1}</div>)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d)
      const hasInterview = interviews.some(a => {
        const ad = new Date(a.interviewDate || a.updatedAt)
        return ad.getDate() === d && ad.getMonth() === month && ad.getFullYear() === year
      })
      const isSelected = selectedDay && selectedDay.getDate() === d && selectedDay.getMonth() === month
      const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year
      const isPast = dayDate < new Date(new Date().toDateString())
      cells.push(
        <button key={d} onClick={() => setSelectedDay(dayDate)}
          className={`relative p-2 text-sm rounded-lg transition-colors ${isSelected ? 'bg-primary text-white font-bold' : isToday ? 'border border-primary text-primary font-bold' : isPast ? 'text-slate-300' : 'hover:bg-slate-100'}`}
        >
          {d}
          {hasInterview && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-violet-500" />}
        </button>
      )
    }
    return cells
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">My Interviews</h2>
          <p className="mt-1 text-sm text-slate-500">Track all your scheduled interviews in one place.</p>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
            <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Calendar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold">
                  <Calendar className="inline size-4 mr-1.5 text-primary" />
                  {MONTHS[month]} {year}
                </h3>
                <div className="flex gap-1">
                  <button onClick={() => setDate(new Date(year, month - 1, 1))} className="rounded-lg p-1.5 hover:bg-slate-100"><ChevronLeft className="size-4" /></button>
                  <button onClick={() => setDate(new Date(year, month + 1, 1))} className="rounded-lg p-1.5 hover:bg-slate-100"><ChevronRight className="size-4" /></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {DAYS.map(d => <div key={d} className="text-center text-xs font-bold text-slate-400 py-1">{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-1">{renderCalendar()}</div>
              <div className="mt-3 flex gap-4 text-xs text-slate-500">
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-violet-500" /> Interview</span>
              </div>
            </div>

            {/* Day Detail */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <h3 className="font-bold mb-4">
                <Clock className="inline size-4 mr-1.5 text-primary" />
                {selectedDay ? selectedDay.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Select a date'}
              </h3>
              {!selectedDay ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Calendar className="size-8 mb-2 text-slate-300" />
                  <p className="text-sm">Click a date on the calendar to see interviews.</p>
                </div>
              ) : dayInterviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                  <Calendar className="size-8 mb-2 text-slate-300" />
                  <p className="text-sm">No interviews on this day.</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {dayInterviews.map(a => (
                    <div key={a._id} className="rounded-xl border border-violet-100 bg-violet-50/50 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-sm">{a.posting?.title || 'Position'}</p>
                          <p className="text-xs text-slate-500">{a.posting?.company?.name || 'Company'}</p>
                        </div>
                        <span className="rounded-full bg-violet-100 px-2.5 py-0.5 text-[10px] font-bold text-violet-700">Scheduled</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3.5 text-violet-500" />
                          {a.interviewDate ? new Date(a.interviewDate).toLocaleString('en-IN') : new Date(a.updatedAt).toLocaleDateString()}
                        </span>
                        {a.interviewLink && (
                          <a href={a.interviewLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary font-semibold hover:underline">
                            <Video className="size-3.5" /> Join Meeting
                          </a>
                        )}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Link to={`/interview/${a._id}`} className="flex-1 rounded-lg bg-primary px-3 py-1.5 text-center text-xs font-bold text-white hover:bg-primary/90">
                          View Details
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Upcoming List */}
        {!loading && interviews.length > 0 && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-bold mb-4">All Upcoming Interviews</h3>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Position</th>
                    <th className="px-4 py-3">Company</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Link</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interviews.sort((a, b) => new Date(a.interviewDate || a.updatedAt) - new Date(b.interviewDate || b.updatedAt)).map(a => (
                    <tr key={a._id} className="hover:bg-surface">
                      <td className="px-4 py-3 font-semibold">{a.posting?.title || '—'}</td>
                      <td className="px-4 py-3 text-slate-500">{a.posting?.company?.name || '—'}</td>
                      <td className="px-4 py-3">{a.interviewDate ? new Date(a.interviewDate).toLocaleString('en-IN') : new Date(a.updatedAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {a.interviewLink ? (
                          <a href={a.interviewLink} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline text-xs">Join</a>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/interview/${a._id}`} className="text-xs font-bold text-primary hover:underline">View</Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
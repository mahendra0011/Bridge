import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Calendar as CalendarIcon, Clock, Video, ArrowLeft, ChevronLeft, ChevronRight, CheckCircle, Plus, Trash2, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function Scheduling() {
  const [interviews, setInterviews] = useState([])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [date, setDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [postings, setPostings] = useState([])
  const [showSlotModal, setShowSlotModal] = useState(false)
  const [slotForm, setSlotForm] = useState({ postingId: '', postingModel: 'internship', startTime: '', endTime: '', timezone: 'UTC' })

  const year = date.getFullYear()
  const month = date.getMonth()

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get('/api/company/postings'),
      api.get('/api/company/dashboard'),
      api.get('/api/company/interview-slots'),
    ]).then(([postData, dashData, slotData]) => {
      setPostings([...postData.internships, ...postData.jobs])
      setSlots(slotData.slots || [])
      const ids = [...dashData.internships, ...dashData.jobs].map(p => p._id)
      return Promise.all(ids.map(id =>
        api.get(`/api/company/applicants/${id}`).catch(() => ({ applications: [] }))
      ))
    }).then(results => {
      const all = results.flatMap(r => r.applications || [])
        .filter(a => a.status === 'Interview Scheduled' && a.interviewDate)
        .map(a => ({
          _id: a._id,
          applicantName: a.applicant?.name || 'Unknown',
          applicantEmail: a.applicant?.email || '',
          date: new Date(a.interviewDate),
          link: a.interviewLink || '',
        }))
      setInterviews(all)
    }).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const prevMonthDays = new Date(year, month, 0).getDate()

  const dayInterviews = selectedDay
    ? interviews.filter(i =>
      i.date.getDate() === selectedDay.getDate() &&
      i.date.getMonth() === selectedDay.getMonth() &&
      i.date.getFullYear() === selectedDay.getFullYear()
    )
    : []

  const daySlots = selectedDay
    ? slots.filter(s => {
      const sd = new Date(s.startTime)
      return sd.getDate() === selectedDay.getDate() &&
        sd.getMonth() === selectedDay.getMonth() &&
        sd.getFullYear() === selectedDay.getFullYear()
    })
    : []

  const createSlot = async (e) => {
    e.preventDefault()
    if (!slotForm.postingId || !slotForm.startTime || !slotForm.endTime) {
      return toast.error('Fill all required fields')
    }
    try {
      const data = await api.post('/api/company/interview-slots', slotForm)
      setSlots(prev => [...prev, data.slot])
      toast.success('Slot created')
      setShowSlotModal(false)
      setSlotForm({ postingId: '', postingModel: 'internship', startTime: '', endTime: '', timezone: 'UTC' })
    } catch (err) { toast.error(err.message) }
  }

  const deleteSlot = async (id) => {
    if (!confirm('Delete this slot?')) return
    try {
      await api.delete(`/api/company/interview-slots/${id}`)
      setSlots(prev => prev.filter(s => s._id !== id))
      toast.success('Slot deleted')
    } catch (err) { toast.error(err.message) }
  }

  const renderCalendar = () => {
    const cells = []
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="p-2 text-xs text-slate-300 text-center">{prevMonthDays - firstDay + i + 1}</div>)
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dayDate = new Date(year, month, d)
      const hasInterviews = interviews.some(i =>
        i.date.getDate() === d && i.date.getMonth() === month && i.date.getFullYear() === year
      )
      const hasSlots = slots.some(s => {
        const sd = new Date(s.startTime)
        return sd.getDate() === d && sd.getMonth() === month && sd.getFullYear() === year
      })
      const isSelected = selectedDay && selectedDay.getDate() === d && selectedDay.getMonth() === month
      const isToday = new Date().getDate() === d && new Date().getMonth() === month && new Date().getFullYear() === year
      cells.push(
        <button key={d} onClick={() => setSelectedDay(dayDate)}
          className={`relative p-2 text-sm rounded-lg transition-colors ${isSelected ? 'bg-primary text-white font-bold' : isToday ? 'border border-primary text-primary font-bold' : 'hover:bg-slate-100'}`}
        >
          {d}
          {hasInterviews && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-green-500" />}
          {hasSlots && !hasInterviews && <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-blue-500" />}
        </button>
      )
    }
    return cells
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 space-y-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-2">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold sm:text-3xl">Interview Scheduling</h1>
            <p className="text-sm text-slate-500">Create available slots for candidates to book.</p>
          </div>
          <button onClick={() => setShowSlotModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90">
            <Plus className="size-4" /> Create Slot
          </button>
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
                  <CalendarIcon className="inline size-4 mr-1.5 text-primary" />
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
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-green-500" /> Booked</span>
                <span className="flex items-center gap-1"><span className="size-2 rounded-full bg-blue-500" /> Available</span>
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
                  <CalendarIcon className="size-8 mb-2 text-slate-300" />
                  <p className="text-sm">Click a date on the calendar to see details.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto">
                  {/* Available Slots */}
                  {daySlots.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-blue-600 uppercase tracking-wide mb-2">Available Slots</p>
                      <div className="space-y-2">
                        {daySlots.map(s => (
                          <div key={s._id} className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="size-4 text-blue-500" />
                              {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' — '}
                              {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {s.meetLink && <Video className="size-3.5 text-slate-400 ml-1" />}
                            </div>
                            {!s.isBooked && (
                              <button onClick={() => deleteSlot(s._id)} className="p-1 text-slate-400 hover:text-rose-500">
                                <Trash2 className="size-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Booked Interviews */}
                  {dayInterviews.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-green-600 uppercase tracking-wide mb-2">Scheduled Interviews</p>
                      <div className="space-y-2">
                        {dayInterviews.map(iv => (
                          <div key={iv._id} className="rounded-xl border border-green-100 bg-green-50/50 p-3">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-bold text-sm">{iv.applicantName}</p>
                                <p className="text-xs text-slate-500">{iv.applicantEmail}</p>
                                <p className="text-xs text-slate-400 mt-1">
                                  {iv.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                              {iv.link && (
                                <a href={iv.link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg bg-violet-50 px-2.5 py-1.5 text-xs font-bold text-violet-600 hover:bg-violet-100">
                                  <ExternalLink className="size-3" /> Join
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {daySlots.length === 0 && dayInterviews.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                      <CheckCircle className="size-8 mb-2 text-slate-300" />
                      <p className="text-sm">No activity for this day.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Upcoming */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold mb-4">All Upcoming Interviews</h3>
          {interviews.length === 0 ? (
            <p className="text-sm text-slate-400 py-4 text-center">No interviews scheduled yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px] text-sm">
                <thead className="bg-surface text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Date & Time</th>
                    <th className="px-4 py-3">Link</th>
                    <th className="px-4 py-3">Feedback</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interviews.sort((a, b) => a.date - b.date).map(iv => (
                    <tr key={iv._id} className="hover:bg-surface">
                      <td className="px-4 py-3 font-semibold">{iv.applicantName}</td>
                      <td className="px-4 py-3 text-slate-500">{iv.applicantEmail}</td>
                      <td className="px-4 py-3">{iv.date.toLocaleString('en-IN')}</td>
                      <td className="px-4 py-3">
                        {iv.link ? (
                          <a href={iv.link} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold hover:underline text-xs">Join</a>
                        ) : <span className="text-slate-400">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <Link to={`/company/feedback/${iv._id}`} className="text-xs font-bold text-emerald-600 hover:underline">
                          Give Feedback
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Slot Modal */}
      {showSlotModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold">Create Available Slot</h3>
            <p className="mt-1 text-sm text-slate-500">Candidates can book this time slot.</p>
            <form onSubmit={createSlot} className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Posting</label>
                <select value={slotForm.postingId} onChange={e => {
                  const p = postings.find(p => p._id === e.target.value)
                  setSlotForm(f => ({ ...f, postingId: e.target.value, postingModel: p?.kind === 'job' ? 'Job' : 'Internship' }))
                }} required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                  <option value="">Select posting...</option>
                  {postings.map(p => <option key={p._id} value={p._id}>{p.title} ({p.kind})</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Start</label>
                  <input type="datetime-local" value={slotForm.startTime} onChange={e => setSlotForm(f => ({ ...f, startTime: e.target.value }))} required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">End</label>
                  <input type="datetime-local" value={slotForm.endTime} onChange={e => setSlotForm(f => ({ ...f, endTime: e.target.value }))} required className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Timezone</label>
                <input value={slotForm.timezone} onChange={e => setSlotForm(f => ({ ...f, timezone: e.target.value }))} placeholder="Asia/Kolkata" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <p className="text-xs text-slate-400">A Google Meet link will be auto-generated for each slot.</p>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowSlotModal(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">Create Slot</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

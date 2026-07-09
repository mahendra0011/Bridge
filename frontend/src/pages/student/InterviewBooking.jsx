import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, Video, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { SiteLayout } from '@/components/site/site-layout'
import { api } from '@/lib/api'

export default function InterviewBooking() {
  const { postingId } = useParams()
  const navigate = useNavigate()
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [booking, setBooking] = useState(false)
  const [booked, setBooked] = useState(null)

  useEffect(() => {
    api.get(`/api/student/interview-slots/${postingId}`)
      .then(data => setSlots(data.slots || []))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false))
  }, [postingId])

  const handleBook = async () => {
    if (!selected) return
    setBooking(true)
    try {
      const data = await api.post(`/api/student/interview-slots/${selected}/book`)
      setBooked(data.slot)
      toast.success('Interview booked! Check your email for details.')
    } catch (err) { toast.error(err.message) }
    finally { setBooking(false) }
  }

  if (booked) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <CheckCircle className="size-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-extrabold">Interview Booked!</h1>
          <p className="text-slate-600 mt-2">{new Date(booked.startTime).toLocaleString()}</p>
          <a href={booked.meetLink} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90">
            <Video className="size-4" /> Join Meeting
          </a>
        </div>
      </SiteLayout>
    )
  }

  // Group slots by date
  const grouped = {}
  slots.forEach(s => {
    const date = new Date(s.startTime).toLocaleDateString()
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(s)
  })

  return (
    <SiteLayout>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <button onClick={() => navigate(-1)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back
        </button>

        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Book an Interview</h1>
          <p className="mt-1 text-sm text-slate-500">Select an available time slot</p>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : slots.length === 0 ? (
          <div className="p-12 text-center text-slate-400">No available slots. Check back later.</div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([date, daySlots]) => (
              <div key={date}>
                <h3 className="font-bold text-sm text-slate-600 mb-2 flex items-center gap-1.5">
                  <Calendar className="size-4" /> {date}
                </h3>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {daySlots.map(slot => (
                    <button key={slot._id} onClick={() => setSelected(slot._id)}
                      className={`rounded-xl border p-4 text-left transition-all ${
                        selected === slot._id
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}>
                      <div className="flex items-center gap-2 text-sm font-semibold">
                        <Clock className="size-4 text-slate-400" />
                        {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        {' — '}
                        {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      {slot.meetLink && (
                        <div className="flex items-center gap-1.5 text-xs text-blue-600 mt-1">
                          <Video className="size-3" /> Google Meet
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={handleBook} disabled={!selected || booking}
              className="w-full rounded-lg bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50">
              {booking ? 'Booking...' : 'Confirm Booking'}
            </button>
          </div>
        )}
      </div>
    </SiteLayout>
  )
}

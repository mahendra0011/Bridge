import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { SiteLayout } from '@/components/site/site-layout'
import { Calendar, Video, Building2, Clock, ArrowLeft, ExternalLink } from 'lucide-react'
import { api } from '@/lib/api'

function formatDate(date) {
  if (!date) return 'TBD'
  return new Date(date).toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
}

function formatTime(date) {
  if (!date) return ''
  return new Date(date).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })
}

export default function InterviewDetails() {
  const { id } = useParams()
  const [app, setApp] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    api
      .get(`/api/student/applications/${id}`)
      .then((data) => { if (!cancelled) setApp(data.application) })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [id])

  if (loading) {
    return (
      <SiteLayout>
        <div className="grid min-h-[60vh] place-items-center">
          <div className="size-8 animate-spin rounded-full border-2 border-slate-200 border-t-primary" />
        </div>
      </SiteLayout>
    )
  }

  if (error || !app) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-6 py-24 text-center">
          <h1 className="text-2xl font-bold">Interview not found</h1>
          <Link to="/dashboard" className="mt-4 inline-block text-primary underline">Back to dashboard</Link>
        </div>
      </SiteLayout>
    )
  }

  const role = app.posting?.title || 'this role'
  const company = app.posting?.company?.name || app.posting?.company || 'the company'

  return (
    <SiteLayout>
      <header className="bg-surface px-6 py-10">
        <div className="mx-auto max-w-3xl">
          <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary mb-4">
            <ArrowLeft className="size-4" /> Back to dashboard
          </Link>
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-xl bg-violet-100 text-violet-600">
              <Calendar className="size-5" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">Interview Scheduled</h1>
              <p className="text-slate-600">{role} at {company}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-6 px-6 py-10">
        {/* Key info */}
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            { icon: Calendar, label: 'Date', value: formatDate(app.interviewDate), color: 'bg-violet-50 text-violet-600' },
            { icon: Clock, label: 'Time', value: formatTime(app.interviewDate) || 'TBD', color: 'bg-blue-50 text-blue-600' },
            { icon: Building2, label: 'Company', value: company, color: 'bg-slate-100 text-slate-600' },
            { icon: Video, label: 'Mode', value: app.interviewLink ? 'Online' : 'TBD', color: 'bg-emerald-50 text-emerald-600' },
          ].map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="flex gap-4 rounded-2xl border border-slate-200 bg-white p-5">
              <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${color}`}>
                <Icon className="size-4" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
                <p className="font-semibold">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Join link */}
        {app.interviewLink && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6">
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-500">Meeting Link</p>
            <a
              href={app.interviewLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-bold text-primary-foreground hover:bg-primary/90"
            >
              <Video className="size-4" /> Join Meeting <ExternalLink className="size-3.5" />
            </a>
            <p className="mt-2 text-xs text-slate-400 break-all">{app.interviewLink}</p>
          </div>
        )}

        {/* Notes */}
        {app.notes && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="mb-3 font-bold">Notes from interviewer</h3>
            <p className="text-sm leading-relaxed text-slate-600">{app.notes}</p>
          </div>
        )}
      </main>
    </SiteLayout>
  )
}

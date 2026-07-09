import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Sparkles, Check, Eye, EyeOff, Building2, Plus, X } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const MODES = ['Remote', 'Hybrid', 'On-site']

export default function OpenToWorkSettings() {
  const [openToWork, setOpenToWork] = useState(false)
  const [form, setForm] = useState({
    headline: '',
    currentLocation: '',
    openTo: 'both',
    relocate: false,
    noticePeriod: '',
    expectedCTC: '',
    hideFromCurrentEmployer: false,
    videoUrl: '',
    bio: '',
    preferredMode: '',
    skills: [],
  })
  const [newSkill, setNewSkill] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [preview, setPreview] = useState(false)

  useEffect(() => {
    api.get('/api/student/open-to-work/status')
      .then((data) => {
        setOpenToWork(data.openToWork)
        setForm({
          headline: data.headline || '',
          currentLocation: data.currentLocation || '',
          openTo: data.openTo || 'both',
          relocate: data.relocate ?? false,
          noticePeriod: data.noticePeriod || '',
          expectedCTC: data.expectedCTC || '',
          hideFromCurrentEmployer: data.hideFromCurrentEmployer ?? false,
          videoUrl: data.videoUrl || '',
          bio: data.bio || '',
          preferredMode: data.preferredMode || '',
          skills: data.skills || [],
        })
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const set = (k) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((p) => ({ ...p, [k]: val }))
  }

  const addSkill = () => {
    const s = newSkill.trim()
    if (s && !form.skills.includes(s)) {
      setForm(p => ({ ...p, skills: [...p.skills, s] }))
      setNewSkill('')
    }
  }

  const removeSkill = (skill) => {
    setForm(p => ({ ...p, skills: p.skills.filter(s => s !== skill) }))
  }

  const handleToggle = async () => {
    try {
      const data = await api.post('/api/student/open-to-work/toggle')
      setOpenToWork(data.openToWork)
      toast.success(data.openToWork ? 'You are now Open to Work!' : 'Open to Work disabled')
    } catch (err) {
      toast.error(err.message || 'Failed to toggle')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/api/student/open-to-work/settings', { ...form, openToWork })
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/profile" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Profile
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight flex items-center gap-2">
              <Sparkles className="size-6 text-emerald-500" /> Open to Work
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Let recruiters know you're available. Your profile will appear in company searches.
            </p>
          </div>
          <button
            onClick={handleToggle}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
              openToWork ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block size-5 transform rounded-full bg-white shadow-sm transition-transform ${
                openToWork ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {openToWork && (
          <>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
              <h3 className="font-bold flex items-center gap-2">
                <Sparkles className="size-4 text-emerald-500" /> Your Profile Preview
              </h3>
              <p className="text-xs text-slate-400">
                Companies will see this information when they find you in search results.
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
              <h3 className="font-bold">Job Preferences</h3>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Headline
                </label>
                <input
                  value={form.headline}
                  onChange={set('headline')}
                  placeholder="Frontend Developer | React, Node.js"
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1 text-[11px] text-slate-400">A one-line summary of who you are.</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Bio / About
                </label>
                <textarea
                  rows={3}
                  value={form.bio}
                  onChange={set('bio')}
                  placeholder="Briefly describe your background, skills, and what you're looking for..."
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
                <p className="mt-1 text-[11px] text-slate-400">A short intro that appears on your candidate card.</p>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                  Skills
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.skills.map((s, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
                      {s}
                      <button type="button" onClick={() => removeSkill(s)} className="hover:text-rose-500">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    value={newSkill}
                    onChange={e => setNewSkill(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkill())}
                    placeholder="Add a skill and press Enter"
                    className="flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <Button type="button" onClick={addSkill} size="sm">
                    <Plus className="size-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Current Location
                  </label>
                  <input
                    value={form.currentLocation}
                    onChange={set('currentLocation')}
                    placeholder="Mumbai, India"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Open to
                  </label>
                  <select
                    value={form.openTo}
                    onChange={set('openTo')}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="both">Both Jobs & Internships</option>
                    <option value="job">Jobs Only</option>
                    <option value="internship">Internships Only</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Preferred Work Mode
                  </label>
                  <select
                    value={form.preferredMode}
                    onChange={set('preferredMode')}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Any</option>
                    {MODES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Willing to relocate?
                  </label>
                  <select
                    value={form.relocate ? 'yes' : 'no'}
                    onChange={(e) => setForm((p) => ({ ...p, relocate: e.target.value === 'yes' }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="no">No</option>
                    <option value="yes">Yes</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Notice Period
                  </label>
                  <select
                    value={form.noticePeriod}
                    onChange={set('noticePeriod')}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Select...</option>
                    <option value="Immediate">Immediate</option>
                    <option value="15 days">15 days</option>
                    <option value="30 days">30 days</option>
                    <option value="45 days">45 days</option>
                    <option value="60 days">60 days</option>
                    <option value="Available Immediately">Available Immediately</option>
                    <option value="After 1 month">After 1 month</option>
                    <option value="After 2 months">After 2 months</option>
                    <option value="After 3 months">After 3 months</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Expected CTC / Stipend
                  </label>
                  <input
                    value={form.expectedCTC}
                    onChange={set('expectedCTC')}
                    placeholder="₹6-8 LPA or ₹15-20k/month or Negotiable"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">
                    Video Intro URL <span className="font-normal normal-case text-slate-400">(optional)</span>
                  </label>
                  <input
                    value={form.videoUrl}
                    onChange={set('videoUrl')}
                    placeholder="https://youtube.com/... or https://drive.google.com/..."
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">YouTube, Google Drive, or any video link.</p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl bg-amber-50 p-4">
                <Building2 className="size-5 shrink-0 text-amber-600" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-amber-800">Hide from current employer</p>
                  <p className="text-xs text-amber-600">
                    Your current company won't see your Open to Work status.
                  </p>
                </div>
                <button
                  onClick={() => setForm((p) => ({ ...p, hideFromCurrentEmployer: !p.hideFromCurrentEmployer }))}
                  className={`relative inline-flex h-6 w-10 shrink-0 cursor-pointer items-center rounded-full transition-colors ${
                    form.hideFromCurrentEmployer ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block size-4 transform rounded-full bg-white shadow-sm transition-transform ${
                      form.hideFromCurrentEmployer ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="flex justify-end">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="rounded-xl bg-primary px-8 py-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
              >
                {saving ? 'Saving...' : <><Check className="size-4 mr-1" /> Save Settings</>}
              </Button>
            </div>
          </>
        )}

        {!openToWork && (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-10 text-center">
            <Sparkles className="mx-auto size-10 text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-600">You're not visible to recruiters yet</h3>
            <p className="mt-1 text-sm text-slate-400">
              Toggle the switch above to let companies know you're open to work.
            </p>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
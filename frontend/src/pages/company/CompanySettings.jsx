import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Settings, Save, Trash2, Bell, Globe, Lock, User, Mail, Eye, EyeOff, CreditCard
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function CompanySettings() {
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    newApplicantAlerts: true,
    messageAlerts: true,
    reviewAlerts: true,
    marketingEmails: false,
    profileVisibility: 'public',
    language: 'en',
    timezone: 'Asia/Kolkata',
  })

  useEffect(() => {
    api.get('/api/company/settings').then(data => {
      const s = data.settings || {}
      setSettings(prev => ({ ...prev, ...s }))
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/api/company/settings', settings)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const toggle = (key) => () => setSettings(prev => ({ ...prev, [key]: !prev[key] }))

  const SettingsSection = ({ title, desc, children }) => (
    <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="font-bold">{title}</h3>
        {desc && <p className="text-xs text-slate-500 mt-0.5">{desc}</p>}
      </div>
      <div className="px-6 py-4">{children}</div>
    </div>
  )

  const ToggleRow = ({ label, desc, value, onChange }) => (
    <div className="flex items-center justify-between py-2">
      <div>
        <p className="text-sm font-medium">{label}</p>
        {desc && <p className="text-xs text-slate-500">{desc}</p>}
      </div>
      <button onClick={onChange}
        className={`relative h-6 w-11 rounded-full transition-colors ${value ? 'bg-primary' : 'bg-slate-200'}`}>
        <span className={`absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow-sm transition-transform ${value ? 'translate-x-5' : ''}`} />
      </button>
    </div>
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Settings</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your company account preferences.</p>
          </div>
          <button onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
            <Save className="size-4" /> {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <SettingsSection title="Notifications" desc="Control what notifications you receive.">
          <div className="divide-y divide-slate-100">
            <ToggleRow label="Email Notifications" desc="Receive notifications via email" value={settings.emailNotifications} onChange={toggle('emailNotifications')} />
            <ToggleRow label="Push Notifications" desc="Receive browser push notifications" value={settings.pushNotifications} onChange={toggle('pushNotifications')} />
            <ToggleRow label="New Applicant Alerts" desc="Get notified when someone applies" value={settings.newApplicantAlerts} onChange={toggle('newApplicantAlerts')} />
            <ToggleRow label="Message Alerts" desc="Get notified of new messages" value={settings.messageAlerts} onChange={toggle('messageAlerts')} />
            <ToggleRow label="Review Alerts" desc="Get notified when you receive a review" value={settings.reviewAlerts} onChange={toggle('reviewAlerts')} />
            <ToggleRow label="Marketing Emails" desc="Receive tips & product updates" value={settings.marketingEmails} onChange={toggle('marketingEmails')} />
          </div>
        </SettingsSection>

        <SettingsSection title="Profile & Visibility" desc="Control how your company appears to others.">
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Profile Visibility</label>
              <select value={settings.profileVisibility} onChange={e => setSettings(p => ({ ...p, profileVisibility: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
                <option value="public">Public — Anyone can see your profile</option>
                <option value="registered">Registered Users Only</option>
                <option value="private">Private — Only your team can see</option>
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Language</label>
                <select value={settings.language} onChange={e => setSettings(p => ({ ...p, language: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="en">English</option>
                  <option value="hi">हिन्दी (Hindi)</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Timezone</label>
                <select value={settings.timezone} onChange={e => setSettings(p => ({ ...p, timezone: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                  <option value="UTC">UTC</option>
                </select>
              </div>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Account" desc="Manage your account settings.">
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Email Address</p>
                <p className="text-xs text-slate-500">{user?.email || 'Not set'}</p>
              </div>
              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
                {user?.isEmailVerified ? 'Verified' : 'Unverified'}
              </span>
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="text-sm font-medium">Password</p>
                <p className="text-xs text-slate-500">Manage your password</p>
              </div>
              <button className="text-xs font-bold text-primary hover:underline">Change</button>
            </div>
            <div className="border-t border-slate-100 pt-4">
              <Link
                to="/company/settings/billing"
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                <CreditCard className="size-4" /> Billing & Subscription →
              </Link>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection title="Danger Zone" desc="Irreversible actions.">
          <div>
            <button onClick={() => { if (confirm('Are you sure you want to delete your account?')) logout() }}
              className="flex items-center gap-2 rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-bold text-rose-600 hover:bg-rose-50">
              Delete Account
            </button>
          </div>
        </SettingsSection>
      </div>
    </DashboardLayout>
  )
}
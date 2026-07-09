import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell, Shield, Eye, Trash2, Check, Lock, User, Mail, Phone, Globe } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

function Section({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
          {icon}
        </div>
        <h2 className="text-lg font-bold">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function Toggle({ label, description, checked, onChange }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <div>
        <p className="text-sm font-semibold text-foreground">{label}</p>
        {description && <p className="text-xs text-slate-500">{description}</p>}
      </div>
      <button
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
          checked ? 'bg-primary' : 'bg-slate-200'
        }`}
      >
        <span
          className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  )
}

function RadioGroup({ label, description, options, value, onChange }) {
  return (
    <div className="py-3">
      <p className="text-sm font-semibold text-foreground">{label}</p>
      {description && <p className="mb-3 text-xs text-slate-500">{description}</p>}
      <div className="space-y-2">
        {options.map((opt) => (
          <label key={opt.value} className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-200 p-3 transition-colors hover:border-primary/50">
            <input
              type="radio"
              name={label}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="size-4 accent-primary"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">{opt.label}</p>
              {opt.description && <p className="text-xs text-slate-500">{opt.description}</p>}
            </div>
          </label>
        ))}
      </div>
    </div>
  )
}

export default function Settings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [settings, setSettings] = useState(null)
  const [userInfo, setUserInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Delete account
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    api.get('/api/student/settings')
      .then((data) => {
        setSettings(data.settings || {})
        setUserInfo(data.user || {})
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const updateSetting = (key) => (value) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      await api.put('/api/student/settings', settings)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message || 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    if (!deletePassword) {
      toast.error('Please enter your password')
      return
    }
    setDeleting(true)
    try {
      await api.delete('/api/student/account', { body: { password: deletePassword } })
      toast.success('Account deleted')
      logout()
      navigate('/')
    } catch (err) {
      toast.error(err.message || 'Failed to delete account')
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
          <div className="h-8 w-40 animate-pulse rounded-lg bg-slate-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Settings</h2>
          <p className="mt-1 text-sm text-slate-500">Manage your account, privacy, and notification preferences.</p>
        </div>

        {/* Account Info */}
        <Section title="Account" icon={<User className="size-4" />}>
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <Mail className="size-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email</p>
                <p className="text-sm font-semibold text-foreground">{userInfo?.email || user?.email}</p>
              </div>
              {userInfo?.isEmailVerified && (
                <span className="ml-auto rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700">
                  Verified
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <Phone className="size-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Phone</p>
                <p className="text-sm font-semibold text-foreground">{userInfo?.phone || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <Globe className="size-4 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Role</p>
                <p className="text-sm font-semibold capitalize text-foreground">{user?.role}</p>
              </div>
            </div>
          </div>
        </Section>

        {/* Notification Preferences */}
        <Section title="Notifications" icon={<Bell className="size-4" />}>
          <div className="divide-y divide-slate-100">
            <Toggle
              label="Email notifications"
              description="Receive email updates about your account"
              checked={settings.emailNotifications}
              onChange={updateSetting('emailNotifications')}
            />
            <Toggle
              label="Application updates"
              description="Get notified when your application status changes"
              checked={settings.applicationUpdates}
              onChange={updateSetting('applicationUpdates')}
            />
            <Toggle
              label="New match alerts"
              description="Get notified when new opportunities match your skills"
              checked={settings.newMatchAlerts}
              onChange={updateSetting('newMatchAlerts')}
            />
            <Toggle
              label="Deadline reminders"
              description="Receive reminders before application deadlines"
              checked={settings.deadlineReminders}
              onChange={updateSetting('deadlineReminders')}
            />
            <RadioGroup
              label="Message notifications"
              description="When to send email for new messages when you're offline"
              value={settings.messageDigest || 'instant'}
              onChange={updateSetting('messageDigest')}
              options={[
                { value: 'instant', label: 'Instant', description: 'Email immediately when you get a new message' },
                { value: 'daily', label: 'Daily digest', description: 'Once-a-day summary of new messages' },
                { value: 'weekly', label: 'Weekly digest', description: 'Once-a-week summary of new messages' },
              ]}
            />
          </div>
        </Section>

        {/* Privacy */}
        <Section title="Privacy" icon={<Shield className="size-4" />}>
          <RadioGroup
            label="Profile visibility"
            description="Control who can see your profile"
            value={settings.profileVisibility}
            onChange={updateSetting('profileVisibility')}
            options={[
              { value: 'public', label: 'Public', description: 'Anyone can see your profile' },
              { value: 'companies_only', label: 'Companies only', description: 'Only registered companies can see your profile' },
              { value: 'private', label: 'Private', description: 'Your profile is hidden from everyone' },
            ]}
          />
          <div className="mt-4 divide-y divide-slate-100 border-t border-slate-100 pt-4">
            <Toggle
              label="Show email on profile"
              description="Display your email address on your public profile"
              checked={settings.showEmail}
              onChange={updateSetting('showEmail')}
            />
            <Toggle
              label="Show phone on profile"
              description="Display your phone number on your public profile"
              checked={settings.showPhone}
              onChange={updateSetting('showPhone')}
            />
          </div>
        </Section>

        {/* Security */}
        <Section title="Security" icon={<Lock className="size-4" />}>
          <div className="rounded-xl border border-slate-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">Password</p>
                <p className="text-xs text-slate-500">Change your account password</p>
              </div>
              <Link
                to="/profile"
                className="rounded-lg bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90"
              >
                Change on Profile
              </Link>
            </div>
          </div>
        </Section>

        {/* Danger Zone */}
        <Section title="Danger Zone" icon={<Trash2 className="size-4" />}>
          {!deleteConfirm ? (
            <div>
              <p className="mb-3 text-sm text-slate-600">
                Once you delete your account, there is no going back. Please be certain.
              </p>
              <Button
                onClick={() => setDeleteConfirm(true)}
                className="rounded-xl bg-rose-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-rose-700"
              >
                <Trash2 className="mr-1.5 size-4" /> Delete Account
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
              <p className="mb-3 text-sm font-bold text-rose-800">
                This action is permanent. Enter your password to confirm.
              </p>
              <input
                type="password"
                placeholder="Enter current password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="mb-3 w-full rounded-lg border border-rose-200 px-3 py-2.5 text-sm outline-none focus:border-rose-400"
              />
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleDeleteAccount}
                  disabled={deleting || !deletePassword}
                  className="rounded-xl bg-rose-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-rose-700 disabled:opacity-60"
                >
                  {deleting ? 'Deleting...' : 'Confirm Delete'}
                </Button>
                <Button
                  onClick={() => { setDeleteConfirm(false); setDeletePassword('') }}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </Section>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving}
            className={`rounded-xl px-8 py-5 font-bold transition-all disabled:opacity-60 ${
              saved ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'
            }`}
          >
            {saving ? 'Saving...' : saved ? <><Check className="mr-1 size-4 inline" /> Saved</> : 'Save Changes'}
          </Button>
        </div>
      </div>
    </DashboardLayout>
  )
}

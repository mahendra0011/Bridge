import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Globe, Check, Upload, FileText, X, ShieldCheck, ShieldAlert,
  Trash2, Users2, UserPlus, UserMinus, Edit3, Save, MapPin, Phone, Mail,
  Briefcase, Star, Image
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function CompanyProfile() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState(null)
  const [form, setForm] = useState({})
  const [logoFile, setLogoFile] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [logoError, setLogoError] = useState('')
  const [documents, setDocuments] = useState([])
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [team, setTeam] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('recruiter')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    let cancelled = false
    api.get('/api/company/profile').then(data => {
      if (cancelled) return
      const c = data.company
      setProfile(c)
      setForm({
        name: c.name || '',
        email: c.email || '',
        website: c.website || '',
        location: c.location || '',
        size: c.size || '51-200',
        industry: c.industry || '',
        description: c.description || '',
        linkedin: c.linkedin || '',
        twitter: c.twitter || '',
      })
      setLogoUrl(c.logoUrl || null)
      setDocuments(c.documents || [])
    }).catch(() => toast.error('Failed to load profile'))
    api.get('/api/company/team').then(data => {
      if (!cancelled) setTeam(data.team || [])
    }).catch(() => {})
    setLoading(false)
    return () => { cancelled = true }
  }, [])

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setLogoError('Only image files allowed'); return }
    if (file.size > 2 * 1024 * 1024) { setLogoError('Logo must be under 2MB'); return }
    setLogoError('')
    setLogoFile(file)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (logoFile) {
        const fd = new FormData()
        fd.append('logo', logoFile)
        const res = await api.post('/api/company/logo', fd, { isFormData: true })
        setLogoUrl(res.logoUrl)
        setLogoFile(null)
      }
      await api.put('/api/company/profile', form)
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const uploadDocument = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingDoc(true)
    try {
      const fd = new FormData()
      fd.append('document', file)
      fd.append('name', file.name)
      const res = await api.post('/api/company/documents/upload', fd, { isFormData: true })
      setDocuments(res.documents)
      toast.success('Document uploaded')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploadingDoc(false)
    }
  }

  const deleteDocument = async (docId) => {
    try {
      const res = await api.delete(`/api/company/documents/${docId}`)
      setDocuments(res.documents)
      toast.success('Document removed')
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  const handleInvite = async () => {
    if (!inviteEmail) return toast.error('Enter an email address')
    setInviting(true)
    try {
      const res = await api.post('/api/company/team/invite', { email: inviteEmail, role: inviteRole })
      setTeam(res.team || [])
      setInviteEmail('')
      setShowInvite(false)
      toast.success('Team member invited')
    } catch (err) {
      toast.error(err.message || 'Could not invite')
    } finally {
      setInviting(false)
    }
  }

  const handleRemoveMember = async (userId) => {
    try {
      const res = await api.delete(`/api/company/team/${userId}`)
      setTeam(res.team || [])
      toast.success('Member removed')
    } catch (err) {
      toast.error(err.message || 'Could not remove')
    }
  }

  const handleChangeRole = async (userId, role) => {
    try {
      const res = await api.patch(`/api/company/team/${userId}/role`, { role })
      setTeam(res.team || [])
      toast.success('Role updated')
    } catch (err) {
      toast.error(err.message || 'Could not update')
    }
  }

  const initials = (form.name || 'C').split(' ').map(w => w[0]).slice(0, 2).join('')

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6">
          <div className="h-20 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
          <div className="h-48 animate-pulse rounded-2xl bg-slate-100" />
        </div>
      </DashboardLayout>
    )
  }

  const isVerified = profile?.isVerified
  const activePostings = profile?.activePostings || 0
  const totalApplicants = profile?.totalApplicants || 0

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-primary/10">
              <Building2 className="size-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold sm:text-3xl">Company Profile</h1>
              <p className="mt-1 text-sm text-slate-500">This is what students see when they view your company.</p>
            </div>
          </div>
          <button onClick={handleSave} disabled={saving}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-bold transition-all shadow-sm ${saved ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-60'}`}>
            {saving ? 'Saving...' : saved ? <><Check className="size-4" /> Saved</> : <><Save className="size-4" /> Save</>}
          </button>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="flex items-center gap-4 bg-slate-50/50 px-6 py-5 border-b border-slate-200">
            {logoUrl ? (
              <img src={logoUrl} alt="" className="size-16 shrink-0 rounded-2xl object-cover shadow-sm" />
            ) : (
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-xl font-bold text-white">
                {initials}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold text-slate-900">{profile?.name || 'Your Company'}</h3>
              {profile?.location && <p className="text-sm text-slate-500 flex items-center gap-1 mt-0.5"><MapPin className="size-3.5" />{profile.location}</p>}
            </div>
          </div>
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50/30">
            <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-colors cursor-pointer">
              <Upload className="size-4" /> {logoFile ? logoFile.name : 'Upload Logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
            {logoError && <p className="mt-1 text-xs font-semibold text-rose-600">{logoError}</p>}
          </div>
          <div className="p-6 space-y-5">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {activePostings > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <Briefcase className="mx-auto mb-1 size-5 text-primary" />
                  <p className="text-2xl font-extrabold text-slate-900">{activePostings}</p>
                  <p className="text-xs text-slate-500">Active Postings</p>
                </div>
              )}
              {totalApplicants > 0 && (
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                  <Users className="mx-auto mb-1 size-5 text-primary" />
                  <p className="text-2xl font-extrabold text-slate-900">{totalApplicants}</p>
                  <p className="text-xs text-slate-500">Total Applicants</p>
                </div>
              )}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Company Name</label>
                <input value={form.name} onChange={set('name')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Work Email</label>
                <input value={form.email} onChange={set('email')} type="email" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Website</label>
                <input value={form.website} onChange={set('website')} placeholder="https://" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Location</label>
                <input value={form.location} onChange={set('location')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Company Size</label>
                <select value={form.size} onChange={set('size')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white">
                  {['1-10', '11-50', '51-200', '201-500', '500+'].map(s => <option key={s} value={s}>{s} employees</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-slate-600">Industry</label>
                <input value={form.industry} onChange={set('industry')} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">About the Company</label>
              <textarea value={form.description} onChange={set('description')} rows={4} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Team Members</h3>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-slate-500">Invite colleagues to help manage your hiring.</p>
            <button onClick={() => setShowInvite(true)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90 transition-colors">
              <UserPlus className="size-3.5" /> Invite
            </button>
          </div>
          {team.length === 0 ? (
            <p className="text-sm text-slate-400 py-2">No team members yet. Invite recruiters to help manage postings.</p>
          ) : (
            <div className="space-y-2">
              {team.map((member) => (
                <div key={member._id || member.user?._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="grid size-9 place-items-center rounded-full bg-primary/10 text-xs font-extrabold text-primary">
                      {(member.user?.name || '?')[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{member.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-400">{member.user?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <select value={member.role} onChange={e => handleChangeRole(member.user._id, e.target.value)}
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold bg-white outline-none focus:border-primary">
                      <option value="admin">Admin</option>
                      <option value="recruiter">Recruiter</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button onClick={() => handleRemoveMember(member.user._id)} className="p-1 text-slate-400 hover:text-rose-500 transition-colors">
                      <UserMinus className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary">
              <Globe className="size-4" />
            </div>
            <h3 className="text-lg font-bold text-slate-800">Social Links</h3>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">LinkedIn</label>
              <input value={form.linkedin} onChange={set('linkedin')} placeholder="https://linkedin.com/company/..." className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold text-slate-600">Twitter / X</label>
              <input value={form.twitter} onChange={set('twitter')} placeholder="https://twitter.com/..." className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className={`grid size-9 place-items-center rounded-xl ${isVerified ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
              {isVerified ? <ShieldCheck className="size-4" /> : <ShieldAlert className="size-4" />}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-800">Verification Status</h3>
              <p className="text-sm text-slate-500">{isVerified ? 'Your company is verified on BRIDGE.' : 'Upload documents to request verification.'}</p>
            </div>
          </div>
          {documents.length > 0 && (
            <div className="space-y-2 mb-4">
              {documents.map(doc => (
                <div key={doc._id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <FileText className="size-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-semibold">{doc.name}</p>
                      <p className="text-xs text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button onClick={() => deleteDocument(doc._id)} className="text-slate-400 hover:text-rose-600 transition-colors">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-5 py-4 text-sm font-semibold text-slate-500 hover:border-primary hover:text-primary transition-colors">
            {uploadingDoc ? 'Uploading...' : <><Upload className="size-4" /> Upload Document (PDF, DOC, JPG)</>}
            <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" className="hidden" onChange={uploadDocument} disabled={uploadingDoc} />
          </label>
          <p className="text-xs text-slate-400 mt-2">Upload GST certificate, incorporation document, or other proof for verification.</p>
        </div>

        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-extrabold text-slate-900">Invite Team Member</h3>
              <p className="mt-1 text-sm text-slate-500">Add a recruiter to your company account.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
                  <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com"
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Role</label>
                  <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white">
                    <option value="admin">Admin — full access</option>
                    <option value="recruiter">Recruiter — manage postings & applicants</option>
                    <option value="viewer">Viewer — read-only</option>
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowInvite(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleInvite} disabled={inviting} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-all shadow-sm">
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
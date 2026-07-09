import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Building2, Globe, Check, Upload, FileText, X, ShieldCheck, ShieldAlert, Trash2, Users2, UserPlus, UserMinus, ChevronDown } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

function Field({ label, type = 'text', placeholder, value, onChange }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">{label}</label>
      <input type={type} placeholder={placeholder} value={value} onChange={onChange}
        className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
    </div>
  )
}

const emptyForm = {
  name: '', email: '', website: '', location: '', size: '51-200', industry: '',
  description: '', linkedin: '', twitter: '',
}

export default function CompanyProfile() {
  const [logoFile, setLogoFile] = useState(null)
  const [logoUrl, setLogoUrl] = useState(null)
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState(emptyForm)
  const [company, setCompany] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [team, setTeam] = useState([])
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('recruiter')
  const [inviting, setInviting] = useState(false)

  useEffect(() => {
    let cancelled = false
    Promise.all([
      api.get('/api/company/profile'),
      api.get('/api/company/team'),
    ]).then(([profData, teamData]) => {
      if (cancelled) return
      const c = profData.company
      setCompany(c)
      setForm({
        name: c.name || '', email: c.email || '', website: c.website || '',
        location: c.location || '', size: c.size || '51-200', industry: c.industry || '',
        description: c.description || '', linkedin: c.linkedin || '', twitter: c.twitter || '',
      })
      setLogoUrl(c.logoUrl || null)
      setTeam(teamData.team || [])
    }).catch(() => {}).finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Only image files allowed.'); return }
    if (file.size > 2 * 1024 * 1024) { setError('Logo must be under 2MB.'); return }
    setError('')
    setLogoFile(file)
  }

  const handleSave = async () => {
    setSaving(true); setError('')
    try {
      if (logoFile) {
        const fd = new FormData(); fd.append('logo', logoFile)
        const res = await api.post('/api/company/logo', fd, { isFormData: true })
        setLogoUrl(res.logoUrl); setLogoFile(null)
      }
      await api.put('/api/company/profile', form)
      setSaved(true); setTimeout(() => setSaved(false), 2500)
      toast.success('Profile saved')
    } catch (err) { setError(err.message || 'Could not save profile') }
      finally { setSaving(false) }
  }

  const uploadDocument = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploadingDoc(true)
    try {
      const fd = new FormData(); fd.append('document', file); fd.append('name', file.name)
      const res = await api.post('/api/company/documents/upload', fd, { isFormData: true })
      setCompany(p => ({ ...p, documents: res.documents }))
      toast.success('Document uploaded')
    } catch (err) { toast.error(err.message) }
      finally { setUploadingDoc(false) }
  }

  const deleteDocument = async (docId) => {
    try {
      const res = await api.delete(`/api/company/documents/${docId}`)
      setCompany(p => ({ ...p, documents: res.documents }))
      toast.success('Document removed')
    } catch (err) { toast.error(err.message) }
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
    } catch (err) { toast.error(err.message || 'Could not invite') }
    finally { setInviting(false) }
  }

  const handleRemoveMember = async (userId) => {
    try {
      const res = await api.delete(`/api/company/team/${userId}`)
      setTeam(res.team || [])
      toast.success('Member removed')
    } catch (err) { toast.error(err.message || 'Could not remove') }
  }

  const handleChangeRole = async (userId, role) => {
    try {
      const res = await api.patch(`/api/company/team/${userId}/role`, { role })
      setTeam(res.team || [])
      toast.success('Role updated')
    } catch (err) { toast.error(err.message || 'Could not update role') }
  }

  const initials = (form.name || 'C').split(' ').map((w) => w[0]).slice(0, 2).join('')

  if (loading) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-3xl px-4 py-8 space-y-6">
          {Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-100" />)}
        </div>
      </DashboardLayout>
    )
  }

  const isVerified = company?.isVerified
  const documents = company?.documents || []

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-6 sm:px-6 sm:py-8">
        <div>
          <h1 className="text-2xl font-extrabold sm:text-3xl">Company Profile</h1>
          <p className="mt-1 text-sm text-slate-500">This is what students see when they view your company.</p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-bold mb-3">Verification Status</h2>
          <div className={`flex items-center gap-3 rounded-xl p-4 ${isVerified ? 'bg-emerald-50 border border-emerald-200' : 'bg-amber-50 border border-amber-200'}`}>
            {isVerified ? (
              <><ShieldCheck className="size-8 text-emerald-600" /><div><p className="font-bold text-emerald-800">Verified Company</p><p className="text-sm text-emerald-600">Your company has been verified by BRIDGE.</p></div></>
            ) : (
              <><ShieldAlert className="size-8 text-amber-600" /><div><p className="font-bold text-amber-800">Not Yet Verified</p><p className="text-sm text-amber-600">Upload documents below to request verification.</p></div></>
            )}
          </div>
        </div>

        {error && <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-600">{error}</p>}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-5 font-bold">Company Logo</h2>
          <div className="flex items-center gap-5">
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="size-20 rounded-2xl object-cover" />
            ) : (
              <div className="grid size-20 place-items-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-2xl font-extrabold text-white">{initials}</div>
            )}
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border-2 border-dashed border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-colors">
              <Upload className="size-4" /> {logoFile ? logoFile.name : 'Upload logo'}
              <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
            </label>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Building2 className="size-4" /></div>
            <h2 className="font-bold">Company Information</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Company Name" placeholder="Acme Inc." value={form.name} onChange={set('name')} />
            <Field label="Work Email" type="email" placeholder="hiring@company.com" value={form.email} onChange={set('email')} />
            <Field label="Website" placeholder="https://company.com" value={form.website} onChange={set('website')} />
            <Field label="Location" placeholder="Bangalore, India" value={form.location} onChange={set('location')} />
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Company Size</label>
              <select value={form.size} onChange={set('size')} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                {['1-10', '11-50', '51-200', '201-500', '500+'].map(s => <option key={s} value={s}>{s} employees</option>)}
              </select>
            </div>
            <Field label="Industry" placeholder="Software / Technology" value={form.industry} onChange={set('industry')} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">About the Company</label>
            <textarea rows={4} placeholder="What does your company do?" value={form.description} onChange={set('description')}
              className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
          </div>
        </div>

        {/* Team Members */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Users2 className="size-4" /></div>
              <h2 className="font-bold">Team Members</h2>
            </div>
            <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90">
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
                      className="rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold bg-white outline-none focus:border-primary"
                    >
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

        {/* Social Links */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><Globe className="size-4" /></div>
            <h2 className="font-bold">Social Links</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="LinkedIn" placeholder="https://linkedin.com/company/..." value={form.linkedin} onChange={set('linkedin')} />
            <Field label="Twitter / X" placeholder="https://twitter.com/..." value={form.twitter} onChange={set('twitter')} />
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="grid size-9 place-items-center rounded-xl bg-primary/10 text-primary"><FileText className="size-4" /></div>
            <h2 className="font-bold">Verification Documents</h2>
          </div>
          {documents.length > 0 && (
            <div className="space-y-2">
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
          <p className="text-xs text-slate-400">Upload GST certificate, incorporation document, or other proof for verification.</p>
        </div>

        <div className="flex justify-end">
          <button onClick={handleSave} disabled={saving}
            className={`rounded-xl px-8 py-3 font-bold transition-all disabled:opacity-60 ${saved ? 'bg-emerald-600 text-white' : 'bg-primary text-primary-foreground hover:bg-primary/90'}`}
          >{saving ? 'Saving...' : saved ? <><Check className="size-4 mr-1 inline" /> Saved</> : 'Save changes'}</button>
        </div>
      </div>

      {/* Invite Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <h3 className="text-xl font-bold">Invite Team Member</h3>
            <p className="mt-1 text-sm text-slate-500">Add a recruiter to your company account.</p>
            <div className="mt-5 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
                <input type="email" value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@company.com" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Role</label>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary bg-white">
                  <option value="admin">Admin — full access</option>
                  <option value="recruiter">Recruiter — manage postings & applicants</option>
                  <option value="viewer">Viewer — read-only</option>
                </select>
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowInvite(false)} className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
              <button onClick={handleInvite} disabled={inviting} className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {inviting ? 'Inviting...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

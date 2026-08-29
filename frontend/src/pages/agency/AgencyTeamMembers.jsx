import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, UserPlus, Trash2, Crown, User as UserIcon, X, Check, Shield } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const ROLE_LABELS = { admin: 'Admin', editor: 'Editor', viewer: 'Viewer' }
const ROLE_DESCRIPTIONS = {
  admin: 'Full access — manage jobs, internships, team, and profile settings',
  editor: 'Post jobs and internships, manage own listings',
  viewer: 'Read-only — view agency profile and listings',
}

export default function AgencyTeamMembers() {
  const { user } = useAuth()
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('editor')
  const [inviting, setInviting] = useState(false)
  const [editingRole, setEditingRole] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/api/agency/team').then(data => setTeam(data.team || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const data = await api.post('/api/agency/team/invite', { email: inviteEmail.trim(), role: inviteRole })
      setTeam(data.team || [])
      setShowInvite(false)
      setInviteEmail('')
      toast.success('Team member invited')
    } catch (err) {
      toast.error(err.message || 'Failed to invite')
    } finally {
      setInviting(false)
    }
  }

  const handleRemove = async (memberId) => {
    if (!confirm('Remove this team member?')) return
    try {
      const data = await api.delete(`/api/agency/team/${memberId}`)
      setTeam(data.team || [])
      toast.success('Team member removed')
    } catch (err) {
      toast.error(err.message || 'Failed to remove')
    }
  }

  const handleRoleChange = async (memberId, role) => {
    try {
      const data = await api.patch(`/api/agency/team/${memberId}/role`, { role })
      setTeam(data.team || [])
      setEditingRole(null)
      toast.success('Role updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update role')
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6 sm:py-10">

        <div>
          <Link to="/agency/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-primary mb-3 transition-colors">
            <ArrowLeft className="size-4" /> Dashboard
          </Link>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="grid size-11 place-items-center rounded-xl bg-primary/10">
                <Users className="size-5 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-extrabold sm:text-3xl">Agency Team</h1>
                <p className="mt-1 text-sm text-slate-500">Manage your team members and their permissions.</p>
              </div>
            </div>
            <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
              <UserPlus className="size-4" /> Invite Member
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Shield className="size-3.5" /> Roles & Permissions
          </h3>
          <div className="grid gap-3 sm:grid-cols-3">
            {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
              <div key={role} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                <p className="text-sm font-bold capitalize text-slate-800">{role}</p>
                <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />)}</div>
        ) : team.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-500">
            <Users className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-semibold text-slate-600">No team members yet</p>
            <p className="mt-1 text-sm">Invite your team to collaborate on postings.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {team.map((m) => {
              const isOwner = m.user?._id === user?._id
              return (
                <div key={m._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="grid size-10 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-600 text-sm font-bold">
                      {(m.user?.name || 'U')[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">{m.user?.name || 'Unknown'}</p>
                      <p className="text-xs text-slate-500 truncate">{m.user?.email || ''}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-4">
                    {isOwner ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                        <Crown className="size-3" /> Owner
                      </span>
                    ) : editingRole === m._id ? (
                      <div className="flex items-center gap-1">
                        <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary">
                          {Object.keys(ROLE_LABELS).map(r => (<option key={r} value={r}>{ROLE_LABELS[r]}</option>))}
                        </select>
                        <button onClick={() => handleRoleChange(m.user?._id, inviteRole)} className="rounded-lg bg-primary p-1 text-white hover:bg-primary/90"><Check className="size-3" /></button>
                        <button onClick={() => setEditingRole(null)} className="rounded-lg border border-slate-200 p-1 text-slate-400 hover:bg-slate-50"><X className="size-3" /></button>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingRole(m._id); setInviteRole(m.role) }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200 transition-colors">
                        {ROLE_LABELS[m.role] || m.role}
                      </button>
                    )}
                    {!isOwner && (
                      <button onClick={() => handleRemove(m.user?._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors" title="Remove">
                        <Trash2 className="size-4" />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-extrabold text-slate-900">Invite Team Member</h3>
              <p className="mt-1 text-sm text-slate-500">Enter the email and role for the new team member.</p>
              <p className="mt-2 text-xs text-amber-600">The user must already have an account on Bridge.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Email</label>
                  <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="teammate@example.com" className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-600">Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20">
                    {Object.entries(ROLE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowInvite(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">Cancel</button>
                <button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition-colors shadow-sm">
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

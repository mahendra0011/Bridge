import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Users, UserPlus, Trash2, Shield, Mail, Crown, User as UserIcon, X, Check } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

const ROLE_LABELS = { owner: 'Owner', admin: 'Admin', recruiter: 'Recruiter', interviewer: 'Interviewer', viewer: 'Viewer' }
const ROLE_DESCRIPTIONS = {
  admin: 'Full access — manage jobs, applicants, team, and settings',
  recruiter: 'Post jobs, manage own listings, and message candidates',
  interviewer: 'Schedule interviews and give candidate feedback',
  viewer: 'Read-only — view analytics and applicants',
}

export default function TeamMembers() {
  const { user } = useAuth()
  const [team, setTeam] = useState([])
  const [loading, setLoading] = useState(true)
  const [showInvite, setShowInvite] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteRole, setInviteRole] = useState('recruiter')
  const [inviting, setInviting] = useState(false)
  const [editingRole, setEditingRole] = useState(null)

  const load = () => {
    setLoading(true)
    api.get('/api/company/team').then(data => setTeam(data.team || [])).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return
    setInviting(true)
    try {
      const data = await api.post('/api/company/team/invite', { email: inviteEmail.trim(), role: inviteRole })
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
      const data = await api.delete(`/api/company/team/${memberId}`)
      setTeam(data.team || [])
      toast.success('Team member removed')
    } catch (err) {
      toast.error(err.message || 'Failed to remove')
    }
  }

  const handleRoleChange = async (memberId, role) => {
    try {
      const data = await api.patch(`/api/company/team/${memberId}/role`, { role })
      setTeam(data.team || [])
      setEditingRole(null)
      toast.success('Role updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update role')
    }
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <div className="flex items-center justify-between">
          <div>
            <Link to="/company/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
              <ArrowLeft className="size-4" /> Dashboard
            </Link>
            <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Team Members</h1>
            <p className="mt-1 text-sm text-slate-500">Manage your hiring team and their permissions.</p>
          </div>
          <Button onClick={() => setShowInvite(true)} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90">
            <UserPlus className="size-4" /> Invite Member
          </Button>
        </div>

        {/* Role legend */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Roles & Permissions</h3>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
              <div key={role} className="rounded-xl bg-slate-50 p-3">
                <p className="text-sm font-bold capitalize text-foreground">{role}</p>
                <p className="mt-0.5 text-xs text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team list */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 animate-pulse rounded-2xl bg-slate-100" />)}</div>
        ) : team.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
            <Users className="mx-auto mb-3 size-10 text-slate-300" />
            <p className="font-semibold text-slate-600">No team members yet</p>
            <p className="mt-1 text-sm">Invite your hiring team to collaborate.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {team.map((m) => (
              <div key={m._id} className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-primary">
                    <UserIcon className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{m.user?.name || 'Unknown'}</p>
                    <p className="text-xs text-slate-500 truncate">{m.user?.email || ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  {m.role === 'owner' ? (
                    <span className="flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      <Crown className="size-3" /> Owner
                    </span>
                  ) : editingRole === m._id ? (
                    <div className="flex items-center gap-1">
                      <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="rounded-lg border border-slate-200 px-2 py-1 text-xs outline-none focus:border-primary">
                        {Object.keys(ROLE_LABELS).filter(r => r !== 'owner').map(r => (
                          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
                        ))}
                      </select>
                      <button onClick={() => handleRoleChange(m.user?._id, inviteRole)} className="rounded-lg bg-primary p-1 text-white hover:bg-primary/90"><Check className="size-3" /></button>
                      <button onClick={() => setEditingRole(null)} className="rounded-lg border border-slate-200 p-1 text-slate-400 hover:bg-slate-50"><X className="size-3" /></button>
                    </div>
                  ) : (
                    <button onClick={() => { setEditingRole(m._id); setInviteRole(m.role) }} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600 hover:bg-slate-200">
                      {ROLE_LABELS[m.role] || m.role}
                    </button>
                  )}
                  <button onClick={() => handleRemove(m.user?._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600" title="Remove">
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Invite modal */}
        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={() => setShowInvite(false)}>
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-lg font-extrabold text-foreground">Invite Team Member</h3>
              <p className="mt-1 text-sm text-slate-500">Enter the email and role for the new team member.</p>
              <p className="mt-2 text-xs text-amber-600">The user must already have a company account on Bridge.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Email</label>
                  <input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} type="email" placeholder="colleague@company.com" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Role</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary">
                    {Object.entries(ROLE_LABELS).filter(([k]) => k !== 'owner').map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => setShowInvite(false)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={handleInvite} disabled={!inviteEmail.trim() || inviting} className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
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

import { useEffect, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Building2, Edit3, Plus, Trash2, X, Check, Save,
  Globe, MapPin, Phone, Mail, Image, ExternalLink,
  FolderOpen, Briefcase, Star, Users, Upload
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function AgencyProfile() {
  const { agency, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [services, setServices] = useState([])
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({})
  const [showPortfolioModal, setShowPortfolioModal] = useState(false)
  const [portfolioForm, setPortfolioForm] = useState({ title: '', description: '', imageUrl: '', category: '', link: '' })
  const [editingPortfolioId, setEditingPortfolioId] = useState(null)
  const [newService, setNewService] = useState('')
  const [logoFile, setLogoFile] = useState(null)
  const [logoError, setLogoError] = useState('')
  const [portfolioImageFile, setPortfolioImageFile] = useState(null)
  const [portfolioImagePreview, setPortfolioImagePreview] = useState('')
  const fileInputRef = useRef(null)

  const loadProfile = () => {
    setLoading(true)
    api.get('/api/agency/profile').then(data => {
      const p = data.agency || data.profile || data
      setProfile(p)
      setForm({
        agencyName: p.agencyName || '',
        description: p.description || '',
        city: p.city || '',
        website: p.website || '',
        contactEmail: p.contactEmail || '',
        contactPhone: p.contactPhone || '',
        yearsInBusiness: p.yearsInBusiness || '',
        totalProjects: p.totalProjects || '',
        clientCount: p.clientCount || '',
      })
      setPortfolio(p.portfolio || [])
      setServices(p.services || [])
    }).catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadProfile() }, [])



  const handleAddPortfolio = async () => {
    if (!portfolioForm.title.trim()) return
    try {
      const data = await api.post('/api/agency/portfolio', portfolioForm)
      setPortfolio(data.portfolio || [])
      setShowPortfolioModal(false)
      setPortfolioForm({ title: '', description: '', imageUrl: '', category: '', link: '' })
      toast.success('Portfolio item added')
    } catch (err) {
      toast.error(err.message || 'Failed to add')
    }
  }

  const handleUpdatePortfolio = async () => {
    if (!portfolioForm.title.trim() || !editingPortfolioId) return
    try {
      const data = await api.put(`/api/agency/portfolio/${editingPortfolioId}`, portfolioForm)
      setPortfolio(data.portfolio || [])
      setShowPortfolioModal(false)
      setEditingPortfolioId(null)
      setPortfolioForm({ title: '', description: '', imageUrl: '', category: '', link: '' })
      toast.success('Portfolio item updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update')
    }
  }

  const handleDeletePortfolio = async (id) => {
    if (!confirm('Remove this portfolio item?')) return
    try {
      const data = await api.delete(`/api/agency/portfolio/${id}`)
      setPortfolio(data.portfolio || [])
      toast.success('Portfolio item removed')
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  const openEditPortfolio = (item) => {
    setPortfolioForm({
      title: item.title || '',
      description: item.description || '',
      imageUrl: item.imageUrl || '',
      category: item.category || '',
      link: item.link || '',
    })
    setEditingPortfolioId(item._id)
    setShowPortfolioModal(true)
  }

  const handleAddService = async () => {
    if (!newService.trim()) return
    try {
      const data = await api.post('/api/agency/services', { service: newService.trim() })
      setServices(data.services || [])
      setNewService('')
      toast.success('Service added')
    } catch (err) {
      toast.error(err.message || 'Failed to add service')
    }
  }

  const handleDeleteService = async (service) => {
    try {
      const data = await api.delete(`/api/agency/services/${encodeURIComponent(service)}`)
      setServices(data.services || [])
      toast.success('Service removed')
    } catch (err) {
      toast.error(err.message || 'Failed to remove')
    }
  }

  const set = (key) => (e) => setForm(prev => ({ ...prev, [key]: e.target.value }))

  const handleLogoChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setLogoError('Only image files allowed')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      setLogoError('Logo must be under 2MB')
      return
    }
    setLogoError('')
    setLogoFile(file)
  }

  const handlePortfolioImageChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be under 5MB')
      return
    }
    setPortfolioImageFile(file)
    setPortfolioImagePreview(URL.createObjectURL(file))
  }

  const uploadPortfolioImage = async () => {
    if (!portfolioImageFile) return
    try {
      const fd = new FormData()
      fd.append('image', portfolioImageFile)
      const res = await api.post('/api/agency/portfolio/image', fd, { isFormData: true })
      setPortfolioForm(p => ({ ...p, imageUrl: res.imageUrl }))
      setPortfolioImageFile(null)
      setPortfolioImagePreview('')
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err.message || 'Failed to upload image')
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (logoFile) {
        const fd = new FormData()
        fd.append('logo', logoFile)
        const res = await api.post('/api/agency/logo', fd, { isFormData: true })
        setProfile(p => ({ ...p, logoUrl: res.logoUrl }))
        setLogoFile(null)
      }
      await api.put('/api/agency/profile', form)
      setEditing(false)
      toast.success('Profile updated')
      if (refreshUser) refreshUser()
    } catch (err) {
      toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

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

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="flex items-start justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Agency Profile</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your agency details, portfolio, and services.</p>
          </div>
          {!editing ? (
            <button onClick={() => setEditing(true)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
              <Edit3 className="size-4" /> Edit Profile
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => { setEditing(false); loadProfile() }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saving}
                className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                <Save className="size-4" /> {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>

        {/* Agency Details Card */}
        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="flex items-center gap-4 bg-gradient-to-r from-violet-50 to-fuchsia-50 px-6 py-5 border-b border-slate-200">
            {profile?.logoUrl ? (
              <img src={profile.logoUrl} alt="" className="size-16 shrink-0 rounded-2xl object-cover" />
            ) : (
              <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-2xl font-bold text-white">
                {profile?.agencyName ? profile.agencyName.split(' ').map(w => w[0]).slice(0, 2).join('') : 'AG'}
              </div>
            )}
            <div>
              <h3 className="text-xl font-bold">{profile?.agencyName || 'Your Agency'}</h3>
              {profile?.city && <p className="text-sm text-slate-500 flex items-center gap-1"><MapPin className="size-3.5" />{profile.city}</p>}
            </div>
          </div>
          {editing && (
            <div className="p-4 border-t border-slate-200 bg-slate-50/50">
              <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                <Upload className="size-4" /> {logoFile ? logoFile.name : 'Upload Logo'}
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              </label>
              {logoError && <p className="mt-1 text-xs font-semibold text-rose-600">{logoError}</p>}
            </div>
          )}
          <div className="p-6 space-y-5">
            {editing ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Agency Name</label>
                    <input value={form.agencyName} onChange={set('agencyName')} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">City</label>
                    <input value={form.city} onChange={set('city')} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Website</label>
                    <input value={form.website} onChange={set('website')} placeholder="https://" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Contact Email</label>
                    <input value={form.contactEmail} onChange={set('contactEmail')} type="email" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Contact Phone</label>
                    <input value={form.contactPhone} onChange={set('contactPhone')} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Years in Business</label>
                    <input value={form.yearsInBusiness} onChange={set('yearsInBusiness')} type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Total Projects</label>
                    <input value={form.totalProjects} onChange={set('totalProjects')} type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Client Count</label>
                    <input value={form.clientCount} onChange={set('clientCount')} type="number" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                  <textarea value={form.description} onChange={set('description')} rows={4} className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {profile?.totalProjects && (
                    <div className="rounded-xl bg-slate-50 p-4 text-center">
                      <Briefcase className="mx-auto mb-1 size-5 text-primary" />
                      <p className="text-2xl font-extrabold">{profile.totalProjects}</p>
                      <p className="text-xs text-slate-500">Projects Completed</p>
                    </div>
                  )}
                  {profile?.clientCount && (
                    <div className="rounded-xl bg-slate-50 p-4 text-center">
                      <Users className="mx-auto mb-1 size-5 text-primary" />
                      <p className="text-2xl font-extrabold">{profile.clientCount}</p>
                      <p className="text-xs text-slate-500">Clients Served</p>
                    </div>
                  )}
                  {profile?.yearsInBusiness && (
                    <div className="rounded-xl bg-slate-50 p-4 text-center">
                      <Star className="mx-auto mb-1 size-5 text-primary" />
                      <p className="text-2xl font-extrabold">{profile.yearsInBusiness}</p>
                      <p className="text-xs text-slate-500">Years in Business</p>
                    </div>
                  )}
                </div>
                {profile?.description && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">About</h4>
                    <p className="text-sm text-slate-700 whitespace-pre-wrap">{profile.description}</p>
                  </div>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  {profile?.website && (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-primary hover:underline">
                      <Globe className="size-4" /> {profile.website}
                    </a>
                  )}
                  {profile?.contactEmail && (
                    <span className="flex items-center gap-1.5 text-slate-600"><Mail className="size-4" /> {profile.contactEmail}</span>
                  )}
                  {profile?.contactPhone && (
                    <span className="flex items-center gap-1.5 text-slate-600"><Phone className="size-4" /> {profile.contactPhone}</span>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Services Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="text-lg font-bold mb-4">Service Categories</h3>
          {services.length === 0 ? (
            <p className="text-sm text-slate-400 mb-4">Add services you offer (e.g., Web Development, Graphic Design, Content Writing)</p>
          ) : (
            <div className="flex flex-wrap gap-2 mb-4">
              {services.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                  {s}
                  <button onClick={() => handleDeleteService(s)} className="rounded-full p-0.5 hover:bg-primary/20">
                    <X className="size-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input value={newService} onChange={e => setNewService(e.target.value)}
              placeholder="e.g., Web Development"
              className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
              onKeyDown={e => e.key === 'Enter' && handleAddService()} />
            <button onClick={handleAddService}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
              <Plus className="size-4" />
            </button>
          </div>
        </div>

        {/* Portfolio Section */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold">Portfolio / Work Samples</h3>
              <p className="text-sm text-slate-500">Showcase your best work — this builds trust with clients.</p>
            </div>
            <button onClick={() => { setPortfolioForm({ title: '', description: '', imageUrl: '', category: '', link: '' }); setEditingPortfolioId(null); setShowPortfolioModal(true) }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90">
              <Plus className="size-4" /> Add Work
            </button>
          </div>

          {portfolio.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-200 p-12 text-center text-slate-400">
              <FolderOpen className="mx-auto mb-3 size-10 text-slate-300" />
              <p className="font-semibold text-slate-600">No portfolio items yet</p>
              <p className="mt-1 text-sm">Add your projects, case studies, or work samples to attract clients.</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {portfolio.map((item) => (
                <div key={item._id} className="group relative rounded-xl border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                  {item.imageUrl ? (
                    <div className="aspect-video bg-slate-100 overflow-hidden">
                      <img src={item.imageUrl} alt={item.title} className="size-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  ) : (
                    <div className="aspect-video bg-gradient-to-br from-violet-50 to-fuchsia-50 flex items-center justify-center">
                      <Image className="size-10 text-slate-300" />
                    </div>
                  )}
                  <div className="p-4">
                    <h4 className="font-bold text-sm">{item.title}</h4>
                    {item.category && <span className="text-xs text-primary font-semibold">{item.category}</span>}
                    {item.description && <p className="mt-1 text-xs text-slate-500 line-clamp-2">{item.description}</p>}
                    <div className="mt-3 flex items-center gap-2">
                      {item.link && (
                        <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1">
                          <ExternalLink className="size-3" /> View Project
                        </a>
                      )}
                      <button onClick={() => openEditPortfolio(item)} className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-primary">
                        <Edit3 className="size-3.5" />
                      </button>
                      <button onClick={() => handleDeletePortfolio(item._id)} className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Portfolio Modal */}
        {showPortfolioModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm" onClick={() => { setShowPortfolioModal(false); setEditingPortfolioId(null) }}>
            <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-extrabold">{editingPortfolioId ? 'Edit Portfolio Item' : 'Add Portfolio Item'}</h3>
              <p className="mt-1 text-sm text-slate-500">Showcase your work to build trust with potential clients.</p>
              <div className="mt-4 space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Title *</label>
                  <input value={portfolioForm.title} onChange={e => setPortfolioForm(p => ({ ...p, title: e.target.value }))} placeholder="Project title" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Description</label>
                  <textarea value={portfolioForm.description} onChange={e => setPortfolioForm(p => ({ ...p, description: e.target.value }))} rows={3} placeholder="Brief description of the project" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Image</label>
                    {portfolioImagePreview || portfolioForm.imageUrl ? (
                      <div className="mb-2 relative w-24 h-24 rounded-lg overflow-hidden bg-slate-100">
                        <img src={portfolioImagePreview || portfolioForm.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                        <button onClick={() => { setPortfolioImageFile(null); setPortfolioImagePreview(''); setPortfolioForm(p => ({ ...p, imageUrl: '' })) }}
                          className="absolute top-1 right-1 rounded-full bg-white p-0.5 text-slate-600 hover:text-rose-600">
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : null}
                    <label className="inline-flex items-center gap-2 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-colors cursor-pointer">
                      <Upload className="size-4" /> Upload Image
                      <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handlePortfolioImageChange} />
                    </label>
                    <input value={portfolioForm.imageUrl} onChange={e => setPortfolioForm(p => ({ ...p, imageUrl: e.target.value }))} placeholder="or paste URL" className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Category</label>
                    <input value={portfolioForm.category} onChange={e => setPortfolioForm(p => ({ ...p, category: e.target.value }))} placeholder="e.g., Web Development" className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-slate-500">Project Link</label>
                  <input value={portfolioForm.link} onChange={e => setPortfolioForm(p => ({ ...p, link: e.target.value }))} placeholder="https://..." className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={() => { setShowPortfolioModal(false); setEditingPortfolioId(null) }} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-bold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button onClick={async () => {
                  if (portfolioImageFile) {
                    await uploadPortfolioImage()
                  }
                  editingPortfolioId ? handleUpdatePortfolio() : handleAddPortfolio()
                }} disabled={!portfolioForm.title.trim()}
                  className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                  {editingPortfolioId ? 'Update' : 'Add to Portfolio'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
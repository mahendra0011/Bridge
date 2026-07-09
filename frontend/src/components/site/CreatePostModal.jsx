import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, ImageIcon, Video, FileText, Loader2, Plus, Hash, Users, AlertTriangle } from 'lucide-react'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const POST_TYPES = ['Job', 'Internship', 'Walk-in', 'Referral', 'General Update']
const CATEGORIES = ['IT', 'Non-IT', 'Government', 'Remote', 'General']

export function CreatePostModal({ onClose, onCreated }) {
  const navigate = useNavigate()
  const fileRef = useRef(null)

  const [step, setStep] = useState('type')
  const [postType, setPostType] = useState('')
  const [category, setCategory] = useState('General')
  const [companyName, setCompanyName] = useState('')
  const [roleTitle, setRoleTitle] = useState('')
  const [location, setLocation] = useState('')
  const [applicationLink, setApplicationLink] = useState('')
  const [deadline, setDeadline] = useState('')
  const [description, setDescription] = useState('')
  const [sourceAttribution, setSourceAttribution] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [media, setMedia] = useState([])
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Referral-specific
  const [referralProcess, setReferralProcess] = useState('')
  const [referralSlots, setReferralSlots] = useState('')
  const [referrerWorkEmail, setReferrerWorkEmail] = useState('')

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return
    setUploading(true)
    try {
      const formData = new FormData()
      files.forEach(f => formData.append('media', f))
      const res = await api.postForm('/api/community/upload-media', formData)
      setMedia(prev => [...prev, ...res.files])
      toast.success(`${files.length} file(s) uploaded`)
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const removeMedia = (idx) => setMedia(prev => prev.filter((_, i) => i !== idx))

  const buildPayload = (asDraft = false) => {
    const tags = tagsInput.split(',').map(t => t.trim().replace(/^#/, '')).filter(Boolean)
    return {
      postType,
      category,
      companyName,
      roleTitle,
      location,
      applicationLink: applicationLink || undefined,
      deadline: deadline || undefined,
      description,
      sourceAttribution,
      tags,
      status: asDraft ? 'draft' : undefined,
      referralProcess: postType === 'Referral' ? referralProcess : undefined,
      referralSlots: postType === 'Referral' && referralSlots ? Number(referralSlots) : undefined,
      referrerWorkEmail: postType === 'Referral' ? referrerWorkEmail : undefined,
    }
  }

  const handleSubmit = async (asDraft = false) => {
    if (!postType) { toast.error('Select post type'); return }
    if (!asDraft && !description.trim() && !companyName.trim() && media.length === 0) {
      toast.error('Add some content to your post'); return
    }

    setSaving(true)
    try {
      const res = await api.post('/api/community/posts', buildPayload(asDraft))
      if (res.warning) toast.warning(res.warning.message)
      else toast.success(asDraft ? 'Draft saved!' : 'Post created!')
      onCreated?.(res.post)
      onClose?.()
      navigate(`/community/post/${res.post._id}`)
    } catch (err) {
      toast.error(err.message || 'Failed to create post')
    } finally {
      setSaving(false)
    }
  }

  if (step === 'type') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800">Create a Post</h2>
            <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
              <X className="size-5" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mb-4">What type of post is this?</p>
          <div className="grid grid-cols-1 gap-2">
            {POST_TYPES.map(type => (
              <button
                key={type}
                onClick={() => { setPostType(type); setStep('form') }}
                className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:border-primary/30 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {type === 'Referral' && <Users className="size-4 text-amber-500" />}
                  <span>{type}</span>
                  {type === 'Referral' && <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">Verified only</span>}
                </div>
                <span className="text-xs text-slate-400">→</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-slate-800">New {postType} Post</h2>
            <button onClick={() => setStep('type')} className="text-xs text-primary hover:underline">Change type</button>
          </div>
          <button onClick={onClose} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
            <X className="size-5" />
          </button>
        </div>

        {postType === 'Referral' && (
          <div className="mb-4 flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 p-3">
            <AlertTriangle className="size-4 shrink-0 text-amber-500 mt-0.5" />
            <div className="text-xs text-amber-800">
              <p className="font-semibold">Referral posts require verified identity</p>
              <p className="mt-0.5">Only verified users can post referrals. Payment-for-referral posts are strictly prohibited.</p>
            </div>
          </div>
        )}

        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-medium text-slate-500">Category</label>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${category === c ? 'bg-primary text-white border-primary' : 'border-slate-200 text-slate-600 hover:border-primary/30'}`}>
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Company Name</label>
            <input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="e.g. Microsoft, TCS, or any company"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Role / Position Title</label>
            <input value={roleTitle} onChange={e => setRoleTitle(e.target.value)} placeholder="e.g. Software Engineer, Data Analyst"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Location</label>
            <input value={location} onChange={e => setLocation(e.target.value)} placeholder="City / Remote / Multiple"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-500">Application Link (URL)</label>
              <input value={applicationLink} onChange={e => setApplicationLink(e.target.value)} placeholder="https://..."
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-500">Deadline</label>
              <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)}
                className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Description / Caption</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={4}
              placeholder="Share details about this opportunity..."
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none" />
          </div>

          {/* Referral-specific fields */}
          {postType === 'Referral' && (
            <>
              <div>
                <label className="text-xs font-medium text-slate-500">Referral Process <span className="text-red-500">*</span></label>
                <textarea value={referralProcess} onChange={e => setReferralProcess(e.target.value)} rows={2}
                  placeholder="How should interested people reach you? Resume on DM / Email..."
                  className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-500">Referral Slots</label>
                  <input type="number" min="1" value={referralSlots} onChange={e => setReferralSlots(e.target.value)}
                    placeholder="e.g. 3"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Work Email <span className="text-slate-300">(optional)</span></label>
                  <input type="email" value={referrerWorkEmail} onChange={e => setReferrerWorkEmail(e.target.value)}
                    placeholder="you@company.com"
                    className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="text-xs font-medium text-slate-500">Media</label>
            <div className="mt-1 flex flex-wrap gap-2">
              <input ref={fileRef} type="file" multiple accept="image/*,video/mp4,video/quicktime,video/webm,application/pdf" className="hidden" onChange={handleFileSelect} />
              <button onClick={() => fileRef.current?.click()} disabled={uploading}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-3 py-2 text-xs text-slate-500 hover:border-primary hover:text-primary transition-colors disabled:opacity-50">
                {uploading ? <Loader2 className="size-3.5 animate-spin" /> : <Plus className="size-3.5" />} Add Files
              </button>
              <span className="text-[10px] text-slate-400 self-center">Images, Video, PDF</span>
            </div>
            {media.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {media.map((m, i) => (
                  <div key={i} className="flex items-center gap-1.5 rounded-lg bg-slate-50 px-2.5 py-1.5 text-xs text-slate-600">
                    {m.type === 'image' ? <ImageIcon className="size-3" /> : m.type === 'video' ? <Video className="size-3" /> : <FileText className="size-3" />}
                    <span className="truncate max-w-[100px]">{m.filename || m.type}</span>
                    <button onClick={() => removeMedia(i)} className="text-slate-400 hover:text-rose-500"><X className="size-3" /></button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Source / Attribution <span className="text-slate-300">(optional but recommended)</span></label>
            <input value={sourceAttribution} onChange={e => setSourceAttribution(e.target.value)} placeholder="e.g. LinkedIn post, careers page link"
              className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none" />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-500">Tags / Hashtags</label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 focus-within:border-primary">
              <Hash className="size-4 text-slate-400" />
              <input value={tagsInput} onChange={e => setTagsInput(e.target.value)} placeholder="#MicrosoftJobs, #FresherJobs (comma separated)" className="flex-1 text-sm outline-none" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-3 border-t border-slate-100 pt-4">
          <button onClick={onClose} className="flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50">
            Cancel
          </button>
          <button onClick={() => handleSubmit(true)} disabled={saving || !postType}
            className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-50">
            Save Draft
          </button>
          <button onClick={() => handleSubmit(false)} disabled={saving || !postType}
            className="flex-1 rounded-lg bg-primary py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? <Loader2 className="mx-auto size-4 animate-spin" /> : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  )
}

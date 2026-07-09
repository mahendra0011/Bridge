import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, FileText, Upload, Star, Trash2, Check, File as FileIcon, FileSignature } from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api'

function timeAgo(date) {
  if (!date) return ''
  const diffMs = Date.now() - new Date(date).getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return 'Yesterday'
  return `${days}d ago`
}

const typeIcons = {
  resume: FileText,
  cover_letter: FileSignature,
  other: FileIcon,
}

const typeColors = {
  resume: 'text-blue-600 bg-blue-50',
  cover_letter: 'text-violet-600 bg-violet-50',
  other: 'text-slate-600 bg-slate-100',
}

const typeLabels = {
  resume: 'Resume',
  cover_letter: 'Cover Letter',
  other: 'Document',
}

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState('resume')

  useEffect(() => {
    api.get('/api/student/documents')
      .then((data) => setDocuments(data.documents || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be under 5MB.')
      return
    }
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('resume', file)
      fd.append('name', file.name)
      fd.append('type', selectedType)
      const data = await api.post('/api/student/documents', fd, { isFormData: true })
      setDocuments((prev) => [...prev, data.document])
      toast.success('Document uploaded')
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const setDefault = async (id) => {
    try {
      const data = await api.patch(`/api/student/documents/${id}/default`)
      setDocuments(data.documents)
      toast.success('Default document updated')
    } catch (err) {
      toast.error(err.message || 'Failed to update')
    }
  }

  const deleteDoc = async (id) => {
    try {
      const data = await api.delete(`/api/student/documents/${id}`)
      setDocuments(data.documents)
      toast.success('Document deleted')
    } catch (err) {
      toast.error(err.message || 'Failed to delete')
    }
  }

  const defaultDoc = documents.find((d) => d.isDefault)

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 sm:py-10">
        <Link to="/dashboard" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-600 hover:text-primary">
          <ArrowLeft className="size-4" /> Back to Dashboard
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight">Document Manager</h2>
            <p className="mt-1 text-sm text-slate-500">Manage your resumes, cover letters, and other documents.</p>
          </div>
        </div>

        {/* Upload Card */}
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-6 transition-colors hover:border-primary/50">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
            <div>
              <h3 className="font-bold text-foreground">Upload a new document</h3>
              <p className="text-sm text-slate-500">PDF only, max 5MB per file.</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-primary"
              >
                <option value="resume">Resume</option>
                <option value="cover_letter">Cover Letter</option>
                <option value="other">Other</option>
              </select>
              <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90">
                <Upload className="size-4" />
                {uploading ? 'Uploading...' : 'Upload'}
                <input type="file" accept=".pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
              </label>
            </div>
          </div>
        </div>

        {/* Active Default */}
        {defaultDoc && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center gap-3">
              <Check className="size-5 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">
                Default document: <span className="font-bold">{defaultDoc.name}</span>
              </p>
            </div>
            <p className="mt-1 text-xs text-emerald-600">
              This document is auto-attached when you apply to opportunities.
            </p>
          </div>
        )}

        {/* Document List */}
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-100" />
            ))}
          </div>
        ) : documents.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-16 text-center text-slate-400">
            <FileText className="mx-auto mb-3 size-10 opacity-50" />
            <p className="font-semibold text-slate-600">No documents yet</p>
            <p className="mt-1 text-sm">Upload your first resume or cover letter above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => {
              const Icon = typeIcons[doc.type] || FileIcon
              const colorClass = typeColors[doc.type] || typeColors.other
              return (
                <div
                  key={doc._id}
                  className={`rounded-2xl border bg-white p-5 transition-all hover:shadow-sm ${
                    doc.isDefault ? 'border-primary/30 ring-1 ring-primary/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 min-w-0">
                      <div className={`grid size-10 shrink-0 place-items-center rounded-xl ${colorClass}`}>
                        <Icon className="size-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="truncate text-sm font-bold text-foreground">{doc.name}</h3>
                          {doc.isDefault && (
                            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-slate-500">
                          {typeLabels[doc.type] || 'Document'} &middot; {timeAgo(doc.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {!doc.isDefault && (
                        <button
                          onClick={() => setDefault(doc._id)}
                          title="Set as default"
                          className="rounded-lg p-2 text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                        >
                          <Star className="size-4" />
                        </button>
                      )}
                      <button
                        onClick={() => deleteDoc(doc._id)}
                        title="Delete"
                        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

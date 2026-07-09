import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck, Upload, CheckCircle2, Clock, AlertCircle, FileText,
  BadgeCheck, ArrowRight, Info, X
} from 'lucide-react'
import { toast } from 'sonner'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export default function CompanyVerification() {
  const { company, refreshUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [verification, setVerification] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)

  const loadVerification = () => {
    setLoading(true)
    api.get('/api/company/verification').then(data => {
      setVerification(data.verification || data)
    }).catch(() => {}).finally(() => setLoading(false))
  }

  useEffect(() => { loadVerification() }, [])

  const handleUpload = async () => {
    if (!selectedFile) return
    setUploading(true)
    const formData = new FormData()
    formData.append('document', selectedFile)
    try {
      const data = await api.postForm('/api/company/documents/upload', formData)
      setVerification(prev => ({ ...prev, documents: data.documents }))
      setSelectedFile(null)
      toast.success('Document uploaded for verification')
      if (refreshUser) refreshUser()
    } catch (err) {
      toast.error(err.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const isVerified = company?.isVerified || verification?.isVerified
  const regStatus = verification?.regStatus || company?.regStatus || 'pending'
  const status = isVerified ? 'verified' : regStatus === 'approved' ? 'verified' : regStatus

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 sm:px-6">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight">Verification</h2>
          <p className="mt-1 text-sm text-slate-500">Verify your company to build trust with candidates.</p>
        </div>

        <div className={`rounded-2xl border p-6 ${
          status === 'verified' ? 'border-emerald-200 bg-emerald-50'
            : status === 'pending' ? 'border-amber-200 bg-amber-50'
            : 'border-slate-200 bg-white'
        }`}>
          <div className="flex items-start gap-4">
            <div className={`grid size-14 shrink-0 place-items-center rounded-2xl ${
              status === 'verified' ? 'bg-emerald-100 text-emerald-600'
                : status === 'pending' ? 'bg-amber-100 text-amber-600'
                : 'bg-slate-100 text-slate-400'
            }`}>
              {status === 'verified' ? <BadgeCheck className="size-7" />
                : status === 'pending' ? <Clock className="size-7" />
                : <ShieldCheck className="size-7" />}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg font-bold">
                {status === 'verified' ? 'Verified Company'
                  : status === 'pending' ? 'Verification in Progress'
                  : 'Not Yet Verified'}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {status === 'verified'
                  ? 'Your company is verified. Candidates see a trust badge on your profile.'
                  : status === 'pending'
                  ? 'Your documents are under review. This usually takes 1-2 business days.'
                  : 'Upload business documents to get verified and build trust with candidates.'}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold">Verification Steps</h3>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="flex items-start gap-4 px-6 py-4">
              <div className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>1</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">Complete Company Profile</p>
                <p className="text-xs text-slate-500">Fill in your company details, description, and contact information.</p>
              </div>
              {company?.isProfileComplete ? (
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
              ) : (
                <Link to="/company/profile" className="text-xs font-bold text-primary hover:underline shrink-0">Complete →</Link>
              )}
            </div>
            <div className="flex items-start gap-4 px-6 py-4">
              <div className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                status === 'verified' ? 'bg-emerald-100 text-emerald-700'
                  : status === 'pending' ? 'bg-amber-100 text-amber-700'
                  : 'bg-slate-100 text-slate-500'
              }`}>2</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">Upload Registration Documents</p>
                <p className="text-xs text-slate-500">Upload GST certificate, incorporation document, or other business proof.</p>
              </div>
              {status === 'verified' ? (
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
              ) : (
                <Clock className="size-5 text-amber-500 shrink-0" />
              )}
            </div>
            <div className="flex items-start gap-4 px-6 py-4">
              <div className={`grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold ${
                status === 'verified' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
              }`}>3</div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-sm">Admin Review</p>
                <p className="text-xs text-slate-500">Our team reviews your documents and verifies your company.</p>
              </div>
              {status === 'verified' ? (
                <CheckCircle2 className="size-5 text-emerald-500 shrink-0" />
              ) : (
                <Clock className="size-5 text-slate-300 shrink-0" />
              )}
            </div>
          </div>
        </div>

        {status !== 'verified' && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="font-bold mb-4">Upload Verification Document</h3>
            <p className="text-sm text-slate-500 mb-4">Accepted formats: PDF, JPG, PNG. Max size: 5MB.</p>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-5 py-3 text-sm font-semibold text-slate-600 hover:border-primary hover:text-primary transition-colors">
                <Upload className="size-4" />
                {selectedFile ? selectedFile.name : 'Choose File'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={e => setSelectedFile(e.target.files[0])} className="hidden" />
              </label>
              <button onClick={handleUpload} disabled={!selectedFile || uploading}
                className="rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-60">
                {uploading ? 'Uploading...' : 'Upload & Submit'}
              </button>
            </div>
            {selectedFile && (
              <button onClick={() => setSelectedFile(null)} className="mt-2 text-xs text-slate-400 hover:text-rose-500">Remove file</button>
            )}
            {verification?.documents?.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Uploaded Documents</p>
                {verification.documents.map(doc => (
                  <div key={doc._id} className="flex items-center gap-3 rounded-xl bg-slate-50 px-4 py-3">
                    <FileText className="size-4 text-slate-400" />
                    <span className="text-sm font-medium">{doc.name}</span>
                    <span className="ml-auto text-xs text-slate-400">{new Date(doc.uploadedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h3 className="font-bold mb-4">Benefits of Verification</h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: BadgeCheck, label: 'Verified Badge', desc: 'Get a trust-building verified badge on your company profile' },
              { icon: ShieldCheck, label: 'Candidate Trust', desc: 'Verified companies rank higher in search results' },
              { icon: Upload, label: 'Unlimited Postings', desc: 'Post unlimited jobs and internships' },
            ].map((item, i) => (
              <div key={i} className="rounded-xl bg-slate-50 p-4">
                <div className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary mb-3">
                  <item.icon className="size-5" />
                </div>
                <p className="font-semibold text-sm">{item.label}</p>
                <p className="text-xs text-slate-500 mt-1">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
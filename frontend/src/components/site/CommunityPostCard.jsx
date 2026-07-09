import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Heart, MessageCircle, Share2, Bookmark, MoreHorizontal,
  ChevronLeft, ChevronRight, Play, FileText, ExternalLink, AlertTriangle,
  Clock, ArrowUpCircle, Users,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'

const POST_TYPE_STYLES = {
  'Job': 'bg-blue-100 text-blue-700',
  'Internship': 'bg-emerald-100 text-emerald-700',
  'Walk-in': 'bg-purple-100 text-purple-700',
  'Referral': 'bg-amber-100 text-amber-700',
  'General Update': 'bg-slate-100 text-slate-700',
}

const URGENCY_COLORS = {
  red: 'bg-red-100 text-red-700 border-red-200',
  amber: 'bg-amber-100 text-amber-700 border-amber-200',
  green: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

function getDeadlineUrgency(deadline) {
  if (!deadline) return null
  const days = Math.ceil((new Date(deadline) - Date.now()) / (1000 * 60 * 60 * 24))
  if (days < 0) return { label: 'Expired', color: 'red' }
  if (days <= 3) return { label: `${days}d left`, color: 'red' }
  if (days <= 7) return { label: `${days}d left`, color: 'amber' }
  return { label: `${days}d left`, color: 'green' }
}

function timeAgo(date) {
  const diff = Date.now() - new Date(date)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `${days}d ago`
  return new Date(date).toLocaleDateString()
}

export function CommunityPostCard({ post, onUpdate }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [liked, setLiked] = useState(post?.engagement?.likes?.some(id => String(id) === String(user?._id)))
  const [likeCount, setLikeCount] = useState(post?.engagement?.likes?.length || 0)
  const [saved, setSaved] = useState(post?.engagement?.saves?.some(id => String(id) === String(user?._id)))
  const [showFull, setShowFull] = useState(false)
  const [mediaIdx, setMediaIdx] = useState(0)
  const [menuOpen, setMenuOpen] = useState(false)
  const [reportModal, setReportModal] = useState(false)

  const urgency = getDeadlineUrgency(post.deadline)
  const media = post.media || []
  const hasMultipleMedia = media.length > 1
  const truncate = post.description?.length > 200

  const handleLike = async () => {
    if (!user) { navigate('/login'); return }
    try {
      const res = await api.post(`/api/community/posts/${post._id}/like`)
      setLiked(res.liked)
      setLikeCount(res.likeCount)
    } catch { toast.error('Failed to like') }
  }

  const handleSave = async () => {
    if (!user) { navigate('/login'); return }
    try {
      const res = await api.post(`/api/community/posts/${post._id}/save`)
      setSaved(res.saved)
    } catch { toast.error('Failed to save') }
  }

  const handleShare = async (type) => {
    const url = `${window.location.origin}/community/post/${post._id}`
    if (type === 'copy') {
      await navigator.clipboard.writeText(url)
      toast.success('Link copied!')
    } else if (type === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(url)}`, '_blank')
    }
    api.post(`/api/community/posts/${post._id}/share`).catch(() => {})
  }

  const handleReport = async (reason) => {
    try {
      await api.post(`/api/community/posts/${post._id}/report`, { reason })
      toast.success('Report submitted')
      setReportModal(false)
      setMenuOpen(false)
    } catch { toast.error('Failed to report') }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this post?')) return
    try {
      await api.delete(`/api/community/posts/${post._id}`)
      toast.success('Post deleted')
      onUpdate?.(post._id)
    } catch { toast.error('Failed to delete') }
  }

  const isOwner = user && String(post.postedBy?._id) === String(user._id)

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <Link to={`/person/${post.postedBy?._id}`} className="flex items-center gap-2.5 min-w-0">
          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">
            {(post.postedBy?.name || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-slate-900 truncate">
                {post.postedBy?.name || 'Unknown'}
              </span>
              {post.postedBy?.isIdVerified && (
                <span className="inline-flex size-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white font-bold">✓</span>
              )}
              {post.isVerified && (
                <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">Trusted</span>
              )}
            </div>
            <span className="text-xs text-slate-400">{timeAgo(post.createdAt)}</span>
          </div>
        </Link>

        <div className="relative flex items-center gap-2 shrink-0">
          {post.status === 'expired' && (
            <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">Expired</span>
          )}
          {post.status === 'under-review' && (
            <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-medium text-amber-600">Reviewing</span>
          )}
          {post.isPinned && (
            <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-600">Pinned</span>
          )}
          {post.isEdited && (
            <span className="text-[10px] text-slate-400 italic" title={`Edited ${post.editedAt ? new Date(post.editedAt).toLocaleString() : ''}`}>Edited</span>
          )}
          <div className="relative">
            <button onClick={() => setMenuOpen(!menuOpen)} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600">
              <MoreHorizontal className="size-4" />
            </button>
            {menuOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                <div className="absolute right-0 z-20 w-44 rounded-lg border border-slate-200 bg-white py-1 shadow-lg">
                  <button onClick={() => { setReportModal(true); setMenuOpen(false) }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                    <AlertTriangle className="size-3.5" /> Report
                  </button>
                  <button onClick={() => handleShare('copy')} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                    <Share2 className="size-3.5" /> Copy link
                  </button>
                  {isOwner && (
                    <>
                      <hr className="my-1 border-slate-100" />
                      <Link to={`/community/edit/${post._id}`} className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50">
                        Edit
                      </Link>
                      {post.status === 'active' && (
                        <button onClick={async () => { try { await api.post(`/api/community/posts/${post._id}/bump`); toast.success('Post bumped!'); onUpdate?.(post._id) } catch(e) { toast.error(e.message || 'Failed') } }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                          <ArrowUpCircle className="size-3.5" /> Bump
                        </button>
                      )}
                      {post.status === 'active' && (
                        <button onClick={async () => { try { await api.post(`/api/community/posts/${post._id}/mark-expired`); toast.success('Marked as expired'); onUpdate?.(post._id) } catch { toast.error('Failed') } }} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-slate-600 hover:bg-slate-50">
                          <Clock className="size-3.5" /> Mark Expired
                        </button>
                      )}
                      <button onClick={handleDelete} className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-rose-600 hover:bg-rose-50">
                        Delete
                      </button>
                    </>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Post type + Company */}
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${POST_TYPE_STYLES[post.postType] || 'bg-slate-100 text-slate-700'}`}>
          {post.postType}
        </span>
        {post.companyName && (
          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
            {post.taggedCompanyId?.logoUrl && (
              <img src={post.taggedCompanyId.logoUrl} alt="" className="size-3.5 rounded-full object-cover" />
            )}
            {post.companyName}
          </span>
        )}
        {post.category && post.category !== 'General' && (
          <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">
            {post.category}
          </span>
        )}
      </div>

      {/* Role + Location */}
      {post.roleTitle && (
        <p className="mt-2 text-sm font-semibold text-slate-800">{post.roleTitle}</p>
      )}
      {post.location && (
        <p className="text-xs text-slate-500">{post.location}</p>
      )}
      {post.postType === 'Referral' && post.referralProcess && (
        <div className="mt-2 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2">
          <p className="flex items-center gap-1 text-xs font-semibold text-amber-700 mb-1">
            <Users className="size-3" /> Referral Process
          </p>
          <p className="text-xs text-amber-800 whitespace-pre-line">{post.referralProcess}</p>
          {post.referralSlots && <p className="text-xs text-amber-600 mt-1">Slots: {post.referralSlots}</p>}
        </div>
      )}

      {/* Description */}
      {post.description && (
        <div className="mt-2">
          <p className="text-sm text-slate-700 whitespace-pre-line">
            {showFull || !truncate ? post.description : `${post.description.slice(0, 200)}...`}
          </p>
          {truncate && (
            <button onClick={() => setShowFull(!showFull)} className="mt-1 text-xs font-medium text-primary hover:underline">
              {showFull ? 'Show less' : 'See more'}
            </button>
          )}
        </div>
      )}

      {/* Media Preview */}
      {media.length > 0 && (
        <div className="relative mt-3 overflow-hidden rounded-lg bg-slate-100">
          {media[mediaIdx]?.type === 'image' && (
            <img
              src={media[mediaIdx].url}
              alt=""
              className="max-h-80 w-full object-contain bg-slate-50"
            />
          )}
          {media[mediaIdx]?.type === 'video' && (
            <div className="relative flex items-center justify-center bg-black/5" style={{ minHeight: 200 }}>
              <video
                src={media[mediaIdx].url}
                controls
                className="max-h-80 w-full"
                poster={media[mediaIdx].thumbnail}
              />
            </div>
          )}
          {media[mediaIdx]?.type === 'pdf' && (
            <a
              href={media[mediaIdx].url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 hover:bg-slate-100 transition-colors"
            >
              <FileText className="size-8 shrink-0 text-red-500" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{media[mediaIdx].filename || 'PDF Attachment'}</p>
                {media[mediaIdx].size && (
                  <p className="text-xs text-slate-400">{(media[mediaIdx].size / 1024 / 1024).toFixed(1)} MB</p>
                )}
              </div>
              <ExternalLink className="size-4 shrink-0 text-slate-400 ml-auto" />
            </a>
          )}

          {hasMultipleMedia && (
            <>
              {mediaIdx > 0 && (
                <button
                  onClick={() => setMediaIdx(mediaIdx - 1)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/80 shadow hover:bg-white"
                >
                  <ChevronLeft className="size-4" />
                </button>
              )}
              {mediaIdx < media.length - 1 && (
                <button
                  onClick={() => setMediaIdx(mediaIdx + 1)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 grid size-7 place-items-center rounded-full bg-white/80 shadow hover:bg-white"
                >
                  <ChevronRight className="size-4" />
                </button>
              )}
              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                {media.map((_, i) => (
                  <div key={i} className={`size-1.5 rounded-full ${i === mediaIdx ? 'bg-white' : 'bg-white/50'}`} />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Tags */}
      {post.tags?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {post.tags.map(tag => (
            <Link
              key={tag}
              to={`/community?tag=${encodeURIComponent(tag)}`}
              className="rounded-full bg-slate-50 px-2 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      {/* Source Attribution */}
      {post.sourceAttribution && (
        <p className="mt-1.5 text-xs text-slate-400">
          Source: {post.sourceAttribution}
        </p>
      )}

      {/* CTA + Deadline */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        {post.applicationLink && (
          <a
            href={post.applicationLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-white hover:bg-primary/90 transition-colors"
          >
            Apply Now <ExternalLink className="size-3.5" />
          </a>
        )}
        {urgency && (
          <span className={`rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${URGENCY_COLORS[urgency.color]}`}>
            {urgency.label}
          </span>
        )}
      </div>

      {/* Engagement Bar */}
      <div className="mt-3 flex items-center gap-4 border-t border-slate-100 pt-3">
        <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}>
          <Heart className={`size-4 ${liked ? 'fill-current' : ''}`} />
          <span className="text-xs font-medium">{likeCount}</span>
        </button>

        <Link to={`/community/post/${post._id}`} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary transition-colors">
          <MessageCircle className="size-4" />
          <span className="text-xs font-medium">{post.engagement?.commentCount || 0}</span>
        </Link>

        <div className="relative">
          <button onClick={() => handleShare(post._id ? 'copy' : 'copy')} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary transition-colors">
            <Share2 className="size-4" />
            <span className="text-xs font-medium">{post.engagement?.shareCount || 0}</span>
          </button>
        </div>

        <button onClick={handleSave} className={`ml-auto flex items-center gap-1.5 text-sm transition-colors ${saved ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}>
          <Bookmark className={`size-4 ${saved ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Report Modal */}
      {reportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setReportModal(false)}>
          <div className="w-80 rounded-xl bg-white p-5 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-bold text-slate-800">Report this post</h3>
            <p className="mt-1 text-xs text-slate-500">Why are you reporting this?</p>
            <div className="mt-3 space-y-1">
              {['Fake/Scam', 'Expired', 'Spam', 'Inappropriate', 'Copyright'].map(reason => (
                <button
                  key={reason}
                  onClick={() => handleReport(reason)}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                >
                  {reason}
                </button>
              ))}
            </div>
            <button onClick={() => setReportModal(false)} className="mt-3 w-full rounded-lg border border-slate-200 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Heart, Bookmark, Share2, MessageCircle,
  ExternalLink, FileText, ChevronLeft, ChevronRight,
  Send, Loader2, AlertTriangle, MoreHorizontal, Flag,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { SiteLayout } from '@/components/site/site-layout'
import { toast } from 'sonner'

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

export default function CommunityPostDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [post, setPost] = useState(null)
  const [relatedPosts, setRelatedPosts] = useState([])
  const [posterRecent, setPosterRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [mediaIdx, setMediaIdx] = useState(0)

  // Comments
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [replyTo, setReplyTo] = useState(null)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [likedComments, setLikedComments] = useState({})

  // Engagement
  const [liked, setLiked] = useState(false)
  const [likeCount, setLikeCount] = useState(0)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/api/community/posts/${id}`),
      api.get(`/api/community/posts/${id}/comments`),
    ])
      .then(([postRes, commentsRes]) => {
        setPost(postRes.post)
        setRelatedPosts(postRes.relatedPosts || [])
        setPosterRecent(postRes.posterRecent || [])
        setComments(commentsRes.comments || [])
        setLiked(postRes.post.engagement?.likes?.some(l => String(l) === String(user?._id)))
        setLikeCount(postRes.post.engagement?.likes?.length || 0)
        setSaved(postRes.post.engagement?.saves?.some(s => String(s) === String(user?._id)))
      })
      .catch(() => toast.error('Post not found'))
      .finally(() => setLoading(false))
  }, [id, user])

  const handleLike = async () => {
    if (!user) { navigate('/login'); return }
    try {
      const res = await api.post(`/api/community/posts/${id}/like`)
      setLiked(res.liked)
      setLikeCount(res.likeCount)
    } catch { toast.error('Failed to like') }
  }

  const handleSave = async () => {
    if (!user) { navigate('/login'); return }
    try {
      const res = await api.post(`/api/community/posts/${id}/save`)
      setSaved(res.saved)
    } catch { toast.error('Failed to save') }
  }

  const handleShare = async () => {
    const url = `${window.location.origin}/community/post/${id}`
    await navigator.clipboard.writeText(url)
    toast.success('Link copied!')
    api.post(`/api/community/posts/${id}/share`).catch(() => {})
  }

  const handleSubmitComment = async (e) => {
    e.preventDefault()
    if (!user) { navigate('/login'); return }
    if (!commentText.trim()) return

    setSubmittingComment(true)
    try {
      const res = await api.post(`/api/community/posts/${id}/comments`, {
        text: commentText.trim(),
        parentCommentId: replyTo?._id || null,
      })
      if (replyTo) {
        setComments(prev =>
          prev.map(c =>
            c._id === replyTo._id
              ? { ...c, replies: [...(c.replies || []), res.comment] }
              : c
          )
        )
      } else {
        setComments(prev => [res.comment, ...prev])
      }
      setCommentText('')
      setReplyTo(null)
    } catch (err) {
      toast.error(err.message || 'Failed to comment')
    } finally {
      setSubmittingComment(false)
    }
  }

  const handleLikeComment = async (commentId) => {
    if (!user) { navigate('/login'); return }
    try {
      const res = await api.post(`/api/community/comments/${commentId}/like`)
      setLikedComments(prev => ({ ...prev, [commentId]: res.liked }))
    } catch { toast.error('Failed to like comment') }
  }

  const handleReportComment = async (commentId) => {
    if (!user) { navigate('/login'); return }
    const reason = prompt('Why are you reporting this comment? (Spam, Inappropriate, Harassment, Fake/Scam, Copyright)')
    if (!reason) return
    try {
      await api.post(`/api/community/comments/${commentId}/report`, { reason: reason.trim() })
      toast.success('Comment reported. Our team will review it.')
    } catch (err) { toast.error(err.message || 'Failed to report comment') }
  }

  if (loading) {
    return (
      <SiteLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="size-6 animate-spin text-primary" />
        </div>
      </SiteLayout>
    )
  }

  if (!post) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-2xl px-4 py-16 text-center">
          <p className="text-slate-400">Post not found</p>
          <Link to="/community" className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline">
            <ArrowLeft className="size-3.5" /> Back to Community
          </Link>
        </div>
      </SiteLayout>
    )
  }

  const media = post.media || []
  const hasMultipleMedia = media.length > 1

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-6">
        {/* Back link */}
        <Link to="/community" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4 transition-colors">
          <ArrowLeft className="size-4" /> Community
        </Link>

        <div className="flex gap-8">
          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Post Detail Card */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              {/* Header */}
              <div className="flex items-start gap-3">
                <Link to={`/person/${post.postedBy?._id}`}>
                  <div className="grid size-10 shrink-0 place-items-center rounded-full bg-primary/10 text-sm font-bold text-primary">
                    {(post.postedBy?.name || '?')[0].toUpperCase()}
                  </div>
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Link to={`/person/${post.postedBy?._id}`} className="text-sm font-semibold text-slate-900 hover:text-primary">
                      {post.postedBy?.name || 'Unknown'}
                    </Link>
                    {post.postedBy?.isIdVerified && (
                      <span className="inline-flex size-4 items-center justify-center rounded-full bg-blue-500 text-[10px] text-white font-bold">✓</span>
                    )}
                    {post.isVerified && (
                      <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">Trusted</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400">{timeAgo(post.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {post.status === 'expired' && (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">Expired</span>
                  )}
                  <button onClick={handleShare} className="grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-slate-100">
                    <Share2 className="size-4" />
                  </button>
                </div>
              </div>

              {/* Post type badges */}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">{post.postType}</span>
                {post.companyName && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-600">
                    {post.taggedCompanyId?.logoUrl && (
                      <img src={post.taggedCompanyId.logoUrl} alt="" className="size-3.5 rounded-full" />
                    )}
                    {post.companyName}
                  </span>
                )}
                {post.category && post.category !== 'General' && (
                  <span className="rounded-full border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium text-slate-500">{post.category}</span>
                )}
              </div>

              {/* Role + Location */}
              {post.roleTitle && (
                <h2 className="mt-3 text-lg font-bold text-slate-900">{post.roleTitle}</h2>
              )}
              {post.location && (
                <p className="text-sm text-slate-500 mt-0.5">{post.location}</p>
              )}

              {/* Description */}
              {post.description && (
                <div className="mt-4 whitespace-pre-line text-sm text-slate-700 leading-relaxed">
                  {post.description}
                </div>
              )}

              {/* Media Viewer */}
              {media.length > 0 && (
                <div className="relative mt-4 overflow-hidden rounded-xl bg-slate-100">
                  {media[mediaIdx]?.type === 'image' && (
                    <img
                      src={media[mediaIdx].url}
                      alt=""
                      className="max-h-96 w-full object-contain bg-slate-50"
                    />
                  )}
                  {media[mediaIdx]?.type === 'video' && (
                    <div className="flex items-center justify-center bg-black/5" style={{ minHeight: 300 }}>
                      <video
                        src={media[mediaIdx].url}
                        controls
                        className="max-h-96 w-full"
                        poster={media[mediaIdx].thumbnail}
                      />
                    </div>
                  )}
                  {media[mediaIdx]?.type === 'pdf' && (
                    <div className="p-4">
                      <a
                        href={media[mediaIdx].url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 rounded-lg bg-red-50 p-4 hover:bg-red-100 transition-colors"
                      >
                        <FileText className="size-10 shrink-0 text-red-500" />
                        <div className="min-w-0">
                          <p className="font-medium text-slate-700 truncate">{media[mediaIdx].filename || 'PDF Document'}</p>
                          {media[mediaIdx].size && (
                            <p className="text-xs text-slate-400">{(media[mediaIdx].size / 1024 / 1024).toFixed(1)} MB</p>
                          )}
                        </div>
                        <ExternalLink className="size-5 shrink-0 text-slate-400 ml-auto" />
                      </a>
                      <iframe src={media[mediaIdx].url} className="mt-3 h-[500px] w-full rounded-lg border border-slate-200" title="PDF Viewer" />
                    </div>
                  )}
                  {hasMultipleMedia && (
                    <>
                      {mediaIdx > 0 && (
                        <button onClick={() => setMediaIdx(mediaIdx - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-white/80 shadow hover:bg-white">
                          <ChevronLeft className="size-5" />
                        </button>
                      )}
                      {mediaIdx < media.length - 1 && (
                        <button onClick={() => setMediaIdx(mediaIdx + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 grid size-8 place-items-center rounded-full bg-white/80 shadow hover:bg-white">
                          <ChevronRight className="size-5" />
                        </button>
                      )}
                      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                        {media.map((_, i) => (
                          <div key={i} className={`size-2 rounded-full ${i === mediaIdx ? 'bg-white' : 'bg-white/50'}`} />
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Tags */}
              {post.tags?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {post.tags.map(tag => (
                    <Link key={tag} to={`/community?tag=${encodeURIComponent(tag)}`} className="rounded-full bg-slate-50 px-2.5 py-0.5 text-[11px] font-medium text-primary hover:bg-primary/10">
                      #{tag}
                    </Link>
                  ))}
                </div>
              )}

              {/* Source */}
              {post.sourceAttribution && (
                <p className="mt-2 text-xs text-slate-400">
                  Source: {post.sourceAttribution}
                </p>
              )}

              {/* CTA */}
              {(post.applicationLink || post.deadline) && (
                <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
                  {post.applicationLink && (
                    <a
                      href={post.applicationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-5 py-2 text-sm font-bold text-white hover:bg-primary/90"
                    >
                      Apply Now <ExternalLink className="size-4" />
                    </a>
                  )}
                  {post.deadline && (
                    <span className="text-xs text-slate-500">
                      Deadline: {new Date(post.deadline).toLocaleDateString()}
                    </span>
                  )}
                </div>
              )}

              {/* Engagement */}
              <div className="mt-4 flex items-center gap-6 border-t border-slate-100 pt-4">
                <button onClick={handleLike} className={`flex items-center gap-1.5 text-sm transition-colors ${liked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}>
                  <Heart className={`size-5 ${liked ? 'fill-current' : ''}`} /> {likeCount}
                </button>
                <button className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary transition-colors">
                  <MessageCircle className="size-5" /> {post.engagement?.commentCount || 0}
                </button>
                <button onClick={handleShare} className="flex items-center gap-1.5 text-sm text-slate-400 hover:text-primary transition-colors">
                  <Share2 className="size-5" /> {post.engagement?.shareCount || 0}
                </button>
                <button onClick={handleSave} className={`ml-auto flex items-center gap-1.5 text-sm transition-colors ${saved ? 'text-amber-500' : 'text-slate-400 hover:text-amber-500'}`}>
                  <Bookmark className={`size-5 ${saved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="text-sm font-bold text-slate-800 mb-4">Comments ({post.engagement?.commentCount || 0})</h3>

              {/* Comment Form */}
              <form onSubmit={handleSubmitComment} className="mb-6">
                <div className="flex gap-2">
                  <div className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                    {user ? (user.name || '?')[0].toUpperCase() : '?'}
                  </div>
                  <div className="flex-1">
                    {replyTo && (
                      <div className="mb-1 flex items-center gap-2 text-xs text-slate-500">
                        <span>Replying to <strong className="text-slate-700">{replyTo.author?.name}</strong></span>
                        <button type="button" onClick={() => setReplyTo(null)} className="text-rose-500 hover:underline">Cancel</button>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <input
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder={user ? 'Write a comment...' : 'Log in to comment'}
                        disabled={!user}
                        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-primary focus:outline-none disabled:bg-slate-50 disabled:cursor-not-allowed"
                      />
                      <button
                        type="submit"
                        disabled={!commentText.trim() || submittingComment || !user}
                        className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-white hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {submittingComment ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </form>

              {/* Comments List */}
              {comments.length === 0 ? (
                <p className="text-center text-sm text-slate-400 py-6">No comments yet. Be the first!</p>
              ) : (
                <div className="space-y-4">
                  {comments.map(comment => (
                    <div key={comment._id}>
                      <div className="flex gap-2.5">
                        <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                          {(comment.author?.name || '?')[0].toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="rounded-xl bg-slate-50 px-3 py-2">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-semibold text-slate-700">{comment.author?.name}</span>
                              <span className="text-[10px] text-slate-400">{timeAgo(comment.createdAt)}</span>
                            </div>
                            <p className="mt-0.5 text-sm text-slate-700">{comment.text}</p>
                          </div>
                          <div className="mt-1 flex items-center gap-3 px-1">
                            <button
                              onClick={() => handleLikeComment(comment._id)}
                              className={`text-xs ${likedComments[comment._id] ? 'text-rose-500' : 'text-slate-400'} hover:text-rose-500`}
                            >
                              {comment.likes?.length || 0} {likedComments[comment._id] ? 'Liked' : 'Like'}
                            </button>
                            <button
                              onClick={() => setReplyTo(comment)}
                              className="text-xs text-slate-400 hover:text-primary"
                            >
                              Reply
                            </button>
                            {user && (
                              <button
                                onClick={() => handleReportComment(comment._id)}
                                className="text-xs text-slate-400 hover:text-rose-500"
                              >
                                <Flag className="inline size-3 align-middle mr-0.5" />
                                Report
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Replies */}
                      {comment.replies?.length > 0 && (
                        <div className="ml-9 mt-2 space-y-3 border-l-2 border-slate-100 pl-4">
                          {comment.replies.map(reply => (
                            <div key={reply._id} className="flex gap-2.5">
                              <div className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                                {(reply.author?.name || '?')[0].toUpperCase()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="rounded-xl bg-slate-50 px-3 py-2">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-700">{reply.author?.name}</span>
                                    <span className="text-[10px] text-slate-400">{timeAgo(reply.createdAt)}</span>
                                  </div>
                                  <p className="mt-0.5 text-sm text-slate-700">{reply.text}</p>
                                </div>
                                  <div className="mt-1 flex items-center gap-3 px-1">
                                    <button
                                      onClick={() => handleLikeComment(reply._id)}
                                      className={`text-xs ${likedComments[reply._id] ? 'text-rose-500' : 'text-slate-400'} hover:text-rose-500`}
                                    >
                                      {reply.likes?.length || 0} {likedComments[reply._id] ? 'Liked' : 'Like'}
                                    </button>
                                    {user && (
                                      <button
                                        onClick={() => handleReportComment(reply._id)}
                                        className="text-xs text-slate-400 hover:text-rose-500"
                                      >
                                        <Flag className="inline size-3 align-middle mr-0.5" />
                                        Report
                                      </button>
                                    )}
                                  </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="hidden lg:block w-64 shrink-0 space-y-5">
            {/* Poster's recent posts */}
            {posterRecent.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">More from {post.postedBy?.name}</h3>
                <div className="space-y-2">
                  {posterRecent.map(p => (
                    <Link key={p._id} to={`/community/post/${p._id}`} className="block rounded-lg p-2 hover:bg-slate-50 transition-colors">
                      <p className="text-xs font-medium text-slate-700 truncate">{p.roleTitle || p.companyName || 'Post'}</p>
                      <p className="text-[10px] text-slate-400">{p.postType} · {timeAgo(p.createdAt)}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Related posts */}
            {relatedPosts.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Related Posts</h3>
                <div className="space-y-2">
                  {relatedPosts.map(p => (
                    <Link key={p._id} to={`/community/post/${p._id}`} className="block rounded-lg p-2 hover:bg-slate-50 transition-colors">
                      <p className="text-xs font-medium text-slate-700 truncate">{p.roleTitle || p.companyName || 'Post'}</p>
                      <p className="text-[10px] text-slate-400">{p.postType} · {p.companyName}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </SiteLayout>
  )
}

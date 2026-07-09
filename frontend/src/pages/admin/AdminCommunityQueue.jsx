import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '@/lib/api'
import { toast } from 'sonner'
import { Loader2, AlertTriangle, CheckCircle, XCircle, Eye } from 'lucide-react'

import { DashboardLayout } from '@/components/dashboard/dashboard-layout'

export default function AdminCommunityQueue() {
  const [reportedPosts, setReportedPosts] = useState([])
  const [allPosts, setAllPosts] = useState([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('reported')
  const [statusFilter, setStatusFilter] = useState('')
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  useEffect(() => {
    setLoading(true)
    if (tab === 'reported') {
      api.get('/api/community/admin/reported')
        .then(res => setReportedPosts(res.posts || []))
        .catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false))
    } else {
      const params = new URLSearchParams({ page, limit: '20' })
      if (statusFilter) params.set('status', statusFilter)
      api.get(`/api/community/admin/posts?${params}`)
        .then(res => {
          setAllPosts(res.posts || [])
          setPages(res.pages || 1)
        })
        .catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false))
    }
  }, [tab, page, statusFilter])

  const handleStatusChange = async (postId, status) => {
    try {
      await api.patch(`/api/community/admin/posts/${postId}/status`, { status })
      toast.success(`Post ${status}`)
      setReportedPosts(prev => prev.map(p => p._id === postId ? { ...p, status } : p))
      setAllPosts(prev => prev.map(p => p._id === postId ? { ...p, status } : p))
    } catch {
      toast.error('Failed to update')
    }
  }

  const posts = tab === 'reported' ? reportedPosts : allPosts

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="text-2xl font-extrabold text-slate-900 mb-2">Community Moderation</h1>
        <p className="text-sm text-slate-500 mb-6">Review reported posts and manage community content</p>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'reported', label: 'Reported', icon: AlertTriangle },
            { key: 'all', label: 'All Posts', icon: Eye },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setPage(1) }}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                tab === t.key ? 'bg-primary text-white' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <t.icon className="size-4" /> {t.label}
            </button>
          ))}
        </div>

        {/* Status filter for all posts */}
        {tab === 'all' && (
          <div className="flex flex-wrap gap-2 mb-4">
            {['', 'active', 'under-review', 'flagged', 'expired', 'archived'].map(s => (
              <button
                key={s}
                onClick={() => { setStatusFilter(s); setPage(1) }}
                className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                  statusFilter === s
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : 'border-slate-200 text-slate-500 hover:border-slate-300'
                }`}
              >
                {s || 'All'}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="size-6 animate-spin text-primary" />
          </div>
        ) : posts.length === 0 ? (
          <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
            <CheckCircle className="mx-auto size-12 text-emerald-400 mb-3" />
            <p className="text-sm font-medium text-slate-600">No posts to review</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post._id} className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                        post.status === 'under-review' ? 'bg-amber-100 text-amber-700' :
                        post.status === 'flagged' ? 'bg-red-100 text-red-700' :
                        post.status === 'expired' ? 'bg-slate-100 text-slate-500' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {post.status}
                      </span>
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-semibold text-blue-700">{post.postType}</span>
                      {post.reportCount > 0 && (
                        <span className="text-xs text-red-500">{post.reportCount} report(s)</span>
                      )}
                    </div>
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {post.roleTitle || post.companyName || 'Untitled'}
                    </p>
                    <p className="text-xs text-slate-500">
                      by {post.postedBy?.name || 'Unknown'} · {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                    {post.description && (
                      <p className="mt-1 text-xs text-slate-600 line-clamp-2">{post.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      to={`/community/post/${post._id}`}
                      className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      View
                    </Link>
                    {post.status !== 'active' && (
                      <button
                        onClick={() => handleStatusChange(post._id, 'active')}
                        className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-medium text-emerald-700 hover:bg-emerald-200"
                      >
                        Approve
                      </button>
                    )}
                    {post.status !== 'flagged' && (
                      <button
                        onClick={() => handleStatusChange(post._id, 'flagged')}
                        className="rounded-lg bg-red-100 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-200"
                      >
                        Flag
                      </button>
                    )}
                    {post.status !== 'deleted' && (
                      <button
                        onClick={() => handleStatusChange(post._id, 'deleted')}
                        className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Pagination */}
            {tab === 'all' && pages > 1 && (
              <div className="flex items-center justify-center gap-2 pt-4">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(page - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="text-xs text-slate-500">Page {page} of {pages}</span>
                <button
                  disabled={page >= pages}
                  onClick={() => setPage(page + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}

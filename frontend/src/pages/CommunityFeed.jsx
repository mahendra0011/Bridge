import { useState, useEffect, useCallback, useRef } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import {
  Search, Filter, Plus, TrendingUp, Users, Hash,
  Loader2, ChevronDown, MessageCircle, Heart, Share2,
} from 'lucide-react'
import { CommunityPostCard } from '@/components/site/CommunityPostCard'
import { CreatePostModal } from '@/components/site/CreatePostModal'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { Button } from '@/components/ui/button'
import { SiteLayout } from '@/components/site/site-layout'

const POST_TYPES = ['Job', 'Internship', 'Walk-in', 'Referral', 'General Update']
const CATEGORIES = ['IT', 'Non-IT', 'Government', 'Remote', 'General']
const SORT_OPTIONS = [
  { value: 'latest', label: 'Latest' },
  { value: 'trending', label: 'Trending' },
  { value: 'most-helpful', label: 'Most Helpful' },
]

export default function CommunityFeed() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()

  const [posts, setPosts] = useState([])
  const [trendingCompanies, setTrendingCompanies] = useState([])
  const [topContributors, setTopContributors] = useState([])
  const [trendingTags, setTrendingTags] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [showMobileCreate, setShowMobileCreate] = useState(false)

  const query = searchParams.get('query') || ''
  const postType = searchParams.get('postType') || ''
  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'latest'
  const tag = searchParams.get('tag') || ''
  const company = searchParams.get('company') || ''

  const [searchInput, setSearchInput] = useState(query)
  const observerRef = useRef(null)

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true)
    else setLoadingMore(true)

    try {
      const params = new URLSearchParams()
      if (query) params.set('query', query)
      if (postType) params.set('postType', postType)
      if (category) params.set('category', category)
      if (sort) params.set('sort', sort)
      if (tag) params.set('tag', tag)
      if (company) params.set('companyName', company)
      params.set('page', pageNum)
      params.set('limit', '20')

      const res = await api.get(`/api/community/posts?${params}`)
      if (append) {
        setPosts(prev => [...prev, ...res.posts])
      } else {
        setPosts(res.posts)
        setTrendingCompanies(res.trendingCompanies || [])
      }
      setHasMore(pageNum < res.pages)
      setPage(pageNum)
    } catch (err) {
      console.error('Failed to fetch posts:', err)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [query, postType, category, sort, tag, company])

  useEffect(() => {
    fetchPosts(1)
  }, [fetchPosts])

  useEffect(() => {
    api.get('/api/community/posts/top-contributors')
      .then(res => setTopContributors(res.contributors || []))
      .catch(() => {})
    api.get('/api/community/posts/trending-tags')
      .then(res => setTrendingTags(res.tags || []))
      .catch(() => {})
  }, [])

  // Infinite scroll
  useEffect(() => {
    if (!observerRef.current) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchPosts(page + 1, true)
        }
      },
      { threshold: 0.5 }
    )
    const el = observerRef.current
    if (el) observer.observe(el)
    return () => { if (el) observer.unobserve(el) }
  }, [hasMore, loadingMore, page, fetchPosts])

  const updateFilter = (key, value) => {
    const params = new URLSearchParams(searchParams)
    if (value) params.set(key, value)
    else params.delete(key)
    setSearchParams(params)
  }

  const clearFilters = () => {
    setSearchParams({})
    setSearchInput('')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    updateFilter('query', searchInput)
  }

  const handleRemovePost = (postId) => {
    setPosts(prev => prev.filter(p => p._id !== postId))
  }

  const handleCreate = (post) => {
    setPosts(prev => [post, ...prev])
  }

  const hasActiveFilters = query || postType || category || tag || company

  return (
    <SiteLayout>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 md:text-2xl">Community</h1>
            <p className="text-sm text-slate-500 mt-0.5">Job alerts, internships, and career updates shared by the community</p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="hidden md:inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90"
          >
            <Plus className="size-4" /> Create Post
          </Button>
        </div>

        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)}
                placeholder="Search companies, roles, keywords..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm focus:border-primary focus:outline-none"
              />
            </form>

            {/* Filter Chips */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                  hasActiveFilters
                    ? 'bg-primary text-white border-primary'
                    : 'border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                <Filter className="size-3" /> Filters
              </button>

              {/* Post Type chips */}
              {POST_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => updateFilter('postType', postType === type ? '' : type)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                    postType === type
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'border-slate-200 text-slate-500 hover:border-slate-300'
                  }`}
                >
                  {type}
                </button>
              ))}

              {/* Sort */}
              <div className="relative ml-auto">
                <select
                  value={sort}
                  onChange={e => updateFilter('sort', e.target.value)}
                  className="appearance-none rounded-lg border border-slate-200 bg-white px-3 py-1.5 pr-7 text-xs font-medium text-slate-600 focus:outline-none focus:border-primary"
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 size-3 text-slate-400 pointer-events-none" />
              </div>

              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-rose-500 hover:underline font-medium">
                  Clear all
                </button>
              )}
            </div>

            {/* Expanded Filters */}
            {showFilters && (
              <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold text-slate-500 mb-2">Category</p>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {CATEGORIES.map(c => (
                    <button
                      key={c}
                      onClick={() => updateFilter('category', category === c ? '' : c)}
                      className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
                        category === c
                          ? 'bg-primary text-white border-primary'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Companies Strip */}
            {trendingCompanies.length > 0 && !query && !tag && (
              <div className="mb-4 overflow-x-auto">
                <div className="flex gap-1.5 pb-1">
                  {trendingCompanies.map(name => (
                    <button
                      key={name}
                      onClick={() => updateFilter('company', company === name ? '' : name)}
                      className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium border transition-colors ${
                        company === name
                          ? 'bg-primary/10 text-primary border-primary/30'
                          : 'border-slate-200 text-slate-500 hover:border-slate-300'
                      }`}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Tag Indicator */}
            {tag && (
              <div className="mb-4 flex items-center gap-2 rounded-lg bg-primary/5 px-3 py-2">
                <Hash className="size-4 text-primary" />
                <span className="text-sm font-medium text-primary">#{tag}</span>
                <button onClick={() => setSearchParams({})} className="ml-auto text-xs text-slate-400 hover:text-rose-500">
                  Clear
                </button>
              </div>
            )}

            {/* Posts List */}
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="size-6 animate-spin text-primary" />
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <MessageCircle className="size-12 mb-3" />
                <p className="text-sm font-medium">No posts found</p>
                <p className="text-xs mt-1">Try different filters or be the first to post!</p>
                <Button onClick={() => setShowCreateModal(true)} className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm text-white">
                  Create Post
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map(post => (
                  <CommunityPostCard
                    key={post._id}
                    post={post}
                    onUpdate={handleRemovePost}
                  />
                ))}
              </div>
            )}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerRef} className="flex items-center justify-center py-8">
                {loadingMore ? (
                  <Loader2 className="size-5 animate-spin text-primary" />
                ) : (
                  <p className="text-xs text-slate-400">Scroll for more</p>
                )}
              </div>
            )}
          </div>

          {/* Sidebar (desktop) */}
          <div className="hidden lg:block w-72 shrink-0 space-y-5">
            {/* Top Contributors */}
            {topContributors.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Top Contributors</h3>
                </div>
                <div className="space-y-2">
                  {topContributors.slice(0, 5).map((c, idx) => (
                    <Link key={c._id} to={`/person/${c._id}`} className="flex items-center gap-2.5 group">
                      <span className="text-xs font-bold text-slate-300 w-4">{idx + 1}</span>
                      <div className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {(c.name || '?')[0].toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-slate-700 truncate group-hover:text-primary">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.postCount} posts</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Trending Tags */}
            {trendingTags.length > 0 && (
              <div className="rounded-xl border border-slate-200 bg-white p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Hash className="size-4 text-primary" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Trending Tags</h3>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {trendingTags.map(t => (
                    <Link
                      key={t.tag}
                      to={`/community?tag=${encodeURIComponent(t.tag)}`}
                      className="rounded-full bg-slate-50 px-2.5 py-1 text-[11px] font-medium text-primary hover:bg-primary/10 transition-colors"
                    >
                      #{t.tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Follow Suggestions placeholder */}
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex items-center gap-2 mb-3">
                <Users className="size-4 text-primary" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Follow Suggestions</h3>
              </div>
              <p className="text-xs text-slate-400">Follow active contributors to see their posts in your feed.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile FAB */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-6 right-6 z-30 grid size-14 place-items-center rounded-full bg-primary text-white shadow-lg hover:bg-primary/90 md:hidden"
        aria-label="Create post"
      >
        <Plus className="size-6" />
      </button>

      {/* Create Post Modal */}
      {showCreateModal && (
        <CreatePostModal
          onClose={() => setShowCreateModal(false)}
          onCreated={handleCreate}
        />
      )}
    </SiteLayout>
  )
}

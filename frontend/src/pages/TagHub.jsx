import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Hash, Building2, Users, TrendingUp, ExternalLink, Calendar, Loader2, ArrowLeft } from 'lucide-react'
import { CommunityPostCard } from '@/components/site/CommunityPostCard'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'
import { SiteLayout } from '@/components/site/site-layout'
import { toast } from 'sonner'

export default function TagHub() {
  const { tag } = useParams()
  const { user } = useAuth()
  const [posts, setPosts] = useState([])
  const [company, setCompany] = useState(null)
  const [companyJobs, setCompanyJobs] = useState([])
  const [companyInternships, setCompanyInternships] = useState([])
  const [monthCount, setMonthCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [following, setFollowing] = useState(false)
  const [followId, setFollowId] = useState(null)

  const isCompanyPage = window.location.pathname.startsWith('/community/company/')

  useEffect(() => {
    setLoading(true); setPage(1)

    if (isCompanyPage) {
      api.get(`/api/community/posts/company/${tag}?page=1&limit=20`)
        .then(res => {
          setPosts(res.posts || [])
          setCompany(res.company)
          setCompanyJobs(res.companyJobs || [])
          setCompanyInternships(res.companyInternships || [])
          setMonthCount(res.monthCount || 0)
          setPages(res.pages || 1)
        })
        .catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false))
    } else {
      api.get(`/api/community/posts/tag/${tag}?page=1&limit=20`)
        .then(res => {
          setPosts(res.posts || [])
          setCompany(res.company)
          setMonthCount(res.monthCount || 0)
          setPages(res.pages || 1)
        })
        .catch(() => toast.error('Failed to load'))
        .finally(() => setLoading(false))
    }
  }, [tag, isCompanyPage])

  useEffect(() => {
    if (!user) return
    api.get('/api/community/follows').then(res => {
      const follows = res.follows || []
      const match = follows.find(f =>
        (f.targetType === 'tag' && f.targetTag === tag?.toLowerCase()) ||
        (f.targetType === 'company' && String(f.targetCompany?._id) === tag)
      )
      if (match) { setFollowing(true); setFollowId(match._id) }
    }).catch(() => {})
  }, [user, tag])

  const handleFollow = async () => {
    if (!user) return toast.error('Login required')
    try {
      if (following && followId) {
        await api.delete(`/api/community/follow/${followId}`)
        setFollowing(false); setFollowId(null)
        toast.success('Unfollowed')
      } else {
        const targetType = isCompanyPage ? 'company' : 'tag'
        const body = targetType === 'tag' ? { targetType, targetTag: tag } : { targetType, targetCompany: tag }
        const res = await api.post('/api/community/follow', body)
        setFollowing(true); setFollowId(res.follow._id)
        toast.success('Following!')
      }
    } catch { toast.error('Failed') }
  }

  const loadMore = async () => {
    if (page >= pages) return
    const next = page + 1
    const endpoint = isCompanyPage
      ? `/api/community/posts/company/${tag}?page=${next}&limit=20`
      : `/api/community/posts/tag/${tag}?page=${next}&limit=20`
    try {
      const res = await api.get(endpoint)
      setPosts(prev => [...prev, ...(res.posts || [])])
      setPage(next)
    } catch { toast.error('Failed') }
  }

  const displayName = isCompanyPage ? (company?.name || 'Company') : `#${tag}`
  const displayIcon = isCompanyPage ? <Building2 className="size-5" /> : <Hash className="size-5" />

  return (
    <SiteLayout>
      <div className="mx-auto max-w-4xl px-4 py-6">
        <Link to="/community" className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-primary mb-4">
          <ArrowLeft className="size-4" /> Community
        </Link>

        {/* Hub Header */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 mb-6">
          <div className="flex items-start gap-4">
            <div className="grid size-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              {company?.logoUrl ? (
                <img src={company.logoUrl} alt="" className="size-10 rounded-lg object-cover" />
              ) : displayIcon}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl font-extrabold text-slate-900">{displayName}</h1>
                {monthCount > 0 && (
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                    {monthCount} posts this month
                  </span>
                )}
              </div>
              {company?.description && <p className="text-sm text-slate-500 mt-1">{company.description}</p>}
              <div className="flex items-center gap-4 mt-3">
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <TrendingUp className="size-3.5" /> Trending
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="size-3.5" /> {posts.length}+ posts
                </span>
              </div>
              <div className="flex items-center gap-2 mt-3">
                <button
                  onClick={handleFollow}
                  className={`rounded-lg px-4 py-1.5 text-xs font-bold transition-colors ${
                    following ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-primary text-white hover:bg-primary/90'
                  }`}
                >
                  {following ? 'Following' : 'Follow'}
                </button>
                {company && (
                  <Link to={`/company/${company._id}`} className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50">
                    <Building2 className="size-3" /> View Official Profile <ExternalLink className="size-3" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Company's official openings */}
        {(companyJobs.length > 0 || companyInternships.length > 0) && (
          <div className="mb-6 rounded-xl border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Building2 className="size-4 text-blue-600" />
              <h3 className="text-sm font-bold text-blue-800">Official Verified Openings from {company?.name}</h3>
            </div>
            <div className="space-y-2">
              {companyJobs.map(j => (
                <Link key={j._id} to={`/job/${j._id}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 hover:bg-blue-50/50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{j.title}</p>
                    <p className="text-xs text-slate-400">{j.location} · {j.employmentType}</p>
                  </div>
                  <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">Verified</span>
                </Link>
              ))}
              {companyInternships.map(i => (
                <Link key={i._id} to={`/internship/${i._id}`} className="flex items-center justify-between rounded-lg bg-white px-3 py-2 hover:bg-blue-50/50">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{i.title}</p>
                    <p className="text-xs text-slate-400">{i.location} · {i.stipend}</p>
                  </div>
                  <span className="rounded bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">Verified</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Posts List */}
        {loading ? (
          <div className="flex items-center justify-center py-16"><Loader2 className="size-6 animate-spin text-primary" /></div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <Hash className="mx-auto size-10 mb-2" />
            <p className="text-sm">No posts for {displayName} yet</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(p => <CommunityPostCard key={p._id} post={p} />)}
            {page < pages && (
              <div className="text-center pt-4">
                <button onClick={loadMore} className="rounded-lg border border-slate-200 px-6 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50">
                  Load More
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </SiteLayout>
  )
}

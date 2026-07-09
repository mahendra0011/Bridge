import { useEffect, useState, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, Sparkles, Filter, SlidersHorizontal, X, ArrowUpDown,
  Users, MapPin, Briefcase, Clock, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CandidateCard, CandidateCardSkeleton } from '@/components/site/candidate-card'
import { api } from '@/lib/api'
import { toast } from 'sonner'

const SORT_OPTIONS = [
  { value: '-lastActive', label: 'Most Recent' },
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
]

export default function Candidates() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [candidates, setCandidates] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [loading, setLoading] = useState(true)
  const [dailyInviteCount, setDailyInviteCount] = useState(0)
  const [dailyInviteLimit, setDailyInviteLimit] = useState(50)

  const [filters, setFilters] = useState({
    q: searchParams.get('q') || '',
    skills: searchParams.get('skills') || '',
    location: searchParams.get('location') || '',
    openTo: searchParams.get('openTo') || '',
    relocate: searchParams.get('relocate') || '',
    sort: searchParams.get('sort') || '-lastActive',
  })
  const [showFilters, setShowFilters] = useState(false)
  const page = parseInt(searchParams.get('page')) || 1

  const fetchCandidates = useCallback(async (p = page) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
      params.set('page', p)
      params.set('limit', '20')

      const data = await api.get(`/api/company/candidates?${params.toString()}`)
      setCandidates(data.candidates)
      setTotal(data.total)
      setTotalPages(data.totalPages)
      setDailyInviteCount(data.dailyInviteCount)
      setDailyInviteLimit(data.dailyInviteLimit)
    } catch (err) {
      toast.error(err.message || 'Failed to load candidates')
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => {
    fetchCandidates(page)
  }, [page, fetchCandidates])

  useEffect(() => {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([k, v]) => { if (v) params.set(k, v) })
    if (page > 1) params.set('page', page)
    setSearchParams(params, { replace: true })
  }, [filters, page, setSearchParams])

  const updateFilter = (k, v) => {
    setFilters((p) => ({ ...p, [k]: v }))
  }

  const clearFilters = () => {
    setFilters({ q: '', skills: '', location: '', openTo: '', relocate: '', sort: '-lastActive' })
  }

  const hasFilters = Object.values(filters).some((v) => v && v !== '-lastActive')

  const handleUpdateCandidate = (updated) => {
    setCandidates((prev) => prev.map((c) => (c.user._id === updated.user._id ? updated : c)))
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Bar */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Link to="/company/dashboard" className="text-sm font-semibold text-slate-500 hover:text-primary">
              Dashboard
            </Link>
            <span className="text-slate-300">/</span>
            <h1 className="text-lg font-extrabold tracking-tight flex items-center gap-2">
              <Sparkles className="size-5 text-emerald-500" /> Open to Work
            </h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Clock className="size-4" />
            <span className="font-semibold">{dailyInviteCount}/{dailyInviteLimit}</span>
            <span className="hidden sm:inline">invites today</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mx-auto max-w-7xl px-4 pb-3 sm:px-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
              <input
                value={filters.q}
                onChange={(e) => updateFilter('q', e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchCandidates(1)}
                placeholder="Search by name, skills, college, location..."
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
                showFilters || hasFilters
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-slate-200 text-slate-600 hover:border-slate-300'
              }`}
            >
              <SlidersHorizontal className="size-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold">Filters</span>
                {hasFilters && (
                  <button onClick={clearFilters} className="text-xs font-semibold text-primary hover:underline">
                    Clear all
                  </button>
                )}
              </div>
              <div className="grid gap-3 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Skills</label>
                  <input
                    value={filters.skills}
                    onChange={(e) => updateFilter('skills', e.target.value)}
                    placeholder="React, Node.js"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Location</label>
                  <input
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                    placeholder="Mumbai, Bangalore"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Open to</label>
                  <select
                    value={filters.openTo}
                    onChange={(e) => updateFilter('openTo', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">All</option>
                    <option value="job">Jobs</option>
                    <option value="internship">Internships</option>
                    <option value="both">Both</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Relocate</label>
                  <select
                    value={filters.relocate}
                    onChange={(e) => updateFilter('relocate', e.target.value)}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <ArrowUpDown className="size-3" /> Sort by:
                </div>
                <select
                  value={filters.sort}
                  onChange={(e) => updateFilter('sort', e.target.value)}
                  className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none focus:border-primary"
                >
                  {SORT_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            {loading ? 'Searching...' : <><strong className="text-foreground">{total}</strong> candidates found</>}
          </p>
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <CandidateCardSkeleton key={i} />)}
          </div>
        ) : candidates.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-white p-16 text-center">
            <Users className="mx-auto size-12 text-slate-300" />
            <h3 className="mt-4 text-lg font-bold text-slate-600">No candidates found</h3>
            <p className="mt-1 text-sm text-slate-400">
              {hasFilters ? 'Try adjusting your filters.' : 'No one is currently Open to Work.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {candidates.map((c, i) => (
              <CandidateCard
                key={c._id}
                candidate={c}
                index={i}
                onUpdate={handleUpdateCandidate}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <button
              onClick={() => fetchCandidates(page - 1)}
              disabled={page <= 1}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="size-4" /> Previous
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => fetchCandidates(p)}
                className={`grid size-9 place-items-center rounded-lg text-sm font-bold transition-all ${
                  p === page
                    ? 'bg-primary text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => fetchCandidates(page + 1)}
              disabled={page >= totalPages}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              Next <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

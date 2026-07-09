import { useEffect, useState } from 'react'
import { SiteLayout } from '@/components/site/site-layout'
import { CandidateCard, CandidateCardSkeleton } from '@/components/site/candidate-card'
import { HorizontalFilters } from '@/components/site/horizontal-filters'
import { MobileFilterSheet, SortDropdown } from '@/components/site/filters'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'
import { toast } from 'sonner'

export default function OpenToWorkBrowse() {
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    openTo: '',
    relocate: '',
    skills: [],
    sort: '-lastActive',
  })
  const [page, setPage] = useState(1)
  const [candidates, setCandidates] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.query) params.set('q', filters.query)
    if (filters.location) params.set('location', filters.location)
    if (filters.openTo) params.set('openTo', filters.openTo)
    if (filters.relocate) params.set('relocate', filters.relocate)
    if (filters.skills?.length) params.set('skills', filters.skills.join(','))
    if (filters.sort && filters.sort !== '-lastActive') params.set('sort', filters.sort)
    params.set('page', String(page))
    params.set('limit', '20')

    api
      .get(`/api/company/candidates?${params.toString()}`)
      .then((data) => {
        if (cancelled) return
        setCandidates(data.candidates || [])
        setTotal(data.total || 0)
        setTotalPages(data.totalPages || 1)
        setError('')
      })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filters, page])

  const handleFiltersChange = (next) => {
    setFilters(next)
    setPage(1)
  }

  const handleUpdateCandidate = (updated) => {
    setCandidates((prev) => prev.map((c) => (c.user._id === updated.user._id ? updated : c)))
  }

  const hasFilters = filters.query || filters.location || filters.openTo || filters.relocate || filters.skills?.length

  const sortOptions = [
    { value: '-lastActive', label: 'Most Recent' },
    { value: '-createdAt', label: 'Newest First' },
    { value: 'createdAt', label: 'Oldest First' },
  ]

  return (
    <SiteLayout>
      {/* Horizontal filters at the very top */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <HorizontalFilters value={filters} onChange={handleFiltersChange} showOpenTo={true} />
      </section>

      {/* Header below filters */}
      <header className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Open to Work</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Browse candidates actively seeking new opportunities.</p>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Count + sort + mobile filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold sm:text-xl">
              {loading ? 'Loading…' : `${total} candidates`}
            </h2>
            <div className="flex items-center gap-2">
              <SortDropdown value={filters.sort} onChange={(sort) => handleFiltersChange({ ...filters, sort })} options={sortOptions} />
              <MobileFilterSheet 
                value={filters} 
                onChange={handleFiltersChange}
                renderContent={(value, onChange) => (
                  <>
                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Open to</h3>
                      <div className="flex flex-wrap gap-2">
                        {['', 'Jobs', 'Internships', 'Both'].map((opt) => (
                          <button
                            key={opt || 'any'}
                            onClick={() => onChange({ ...value, openTo: opt.toLowerCase() || '' })}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                              value.openTo === (opt.toLowerCase() || '') 
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {opt || 'Any'}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Relocate</h3>
                      <div className="flex flex-wrap gap-2">
                        {['', 'Yes', 'No'].map((opt) => (
                          <button
                            key={opt || 'any'}
                            onClick={() => onChange({ ...value, relocate: opt.toLowerCase() === 'yes' ? 'true' : opt.toLowerCase() === 'no' ? 'false' : '' })}
                            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                              (opt === '' && !value.relocate) ||
                              (opt.toLowerCase() === 'yes' && value.relocate === 'true') ||
                              (opt.toLowerCase() === 'no' && value.relocate === 'false')
                                ? 'bg-primary/10 text-primary' 
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {opt || 'Any'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-600">
              {error}
            </div>
          )}

          {!error && !loading && candidates.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
              {hasFilters ? 'No candidates match your filters.' : 'No candidates are currently open to work.'}
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <CandidateCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {candidates.map((c, i) => (
                <CandidateCard key={c._id} candidate={c} index={i} onUpdate={handleUpdateCandidate} detailPath="/open-to-work" />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center">
              <Pagination page={page} pages={totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      </main>
    </SiteLayout>
  )
}
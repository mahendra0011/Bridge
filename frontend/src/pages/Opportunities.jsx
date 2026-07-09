import { useEffect, useState } from 'react'
import { SiteLayout } from '@/components/site/site-layout'
import { OpportunityCard, OpportunityCardSkeleton } from '@/components/site/opportunity-card'
import { HorizontalFilters } from '@/components/site/horizontal-filters'
import { MobileFilterSheet, SortDropdown } from '@/components/site/filters'
import { api } from '@/lib/api'

export default function Opportunities() {
  const [filters, setFilters] = useState({
    query: '',
    location: '',
    mode: '',
    skills: [],
    sort: 'newest',
  })
  const [page, setPage] = useState(1)
  const [opportunities, setOpportunities] = useState([])
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = new URLSearchParams()
    if (filters.query) params.set('query', filters.query)
    if (filters.location) params.set('location', filters.location)
    if (filters.mode) params.set('mode', filters.mode)
    if (filters.skills?.length) params.set('skills', filters.skills.join(','))
    if (filters.sort && filters.sort !== 'newest') params.set('sort', filters.sort)
    params.set('page', String(page))
    params.set('limit', '20')

    api
      .get(`/api/opportunities?${params.toString()}`)
      .then((data) => {
        if (cancelled) return
        setOpportunities(data.opportunities || [])
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

  return (
    <SiteLayout>
      {/* Horizontal filters at the very top */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6">
        <HorizontalFilters value={filters} onChange={handleFiltersChange} />
      </section>

      {/* Header below filters */}
      <header className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Opportunities</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Individual projects and short-term gigs posted by people.</p>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Count + sort + mobile filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold sm:text-xl">
              {loading ? 'Loading…' : `${total} opportunities`}
            </h2>
            <div className="flex items-center gap-2">
              <SortDropdown value={filters.sort} onChange={(sort) => handleFiltersChange({ ...filters, sort })} />
              <MobileFilterSheet value={filters} onChange={handleFiltersChange} />
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-600">
              {error}
            </div>
          )}

          {!error && !loading && opportunities.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
              No opportunities match your filters.
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <OpportunityCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {opportunities.map((o, i) => (
                <OpportunityCard key={o._id} item={o} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-2">
              <button 
                onClick={() => setPage(page - 1)} 
                disabled={page <= 1} 
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button 
                  key={p} 
                  onClick={() => setPage(p)} 
                  className={`grid size-9 place-items-center rounded-lg text-sm font-bold transition-all ${
                    p === page ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button 
                onClick={() => setPage(page + 1)} 
                disabled={page >= totalPages} 
                className="flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </main>
    </SiteLayout>
  )
}
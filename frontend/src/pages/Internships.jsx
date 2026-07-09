import { useEffect, useState } from 'react'
import { SiteLayout } from '@/components/site/site-layout'
import { InternshipCard, InternshipCardSkeleton } from '@/components/site/internship-card'
import { HorizontalFilters } from '@/components/site/horizontal-filters'
import { MobileFilterSheet, SortDropdown, defaultFilters, toQueryParams } from '@/components/site/filters'
import { Pagination } from '@/components/site/pagination'
import { api } from '@/lib/api'
import { normalizeList } from '@/lib/normalize'
import { useAuth } from '@/context/AuthContext'

export default function BrowseInternships() {
  const { user } = useAuth()
  const [filters, setFilters] = useState(defaultFilters)
  const [page, setPage] = useState(1)
  const [results, setResults] = useState([])
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [appliedMap, setAppliedMap] = useState({})

  useEffect(() => {
    if (!user) return
    api.get('/api/student/applications')
      .then(data => {
        const map = {}
        ;(data.applications || []).forEach(a => {
          if (a.postingType === 'internship') map[`internship:${a.posting?._id || a.posting}`] = { status: a.status }
        })
        setAppliedMap(map)
      })
      .catch(() => {})
  }, [user])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    const params = toQueryParams(filters, 'internship', { page, limit: 21 })
    api
      .get(`/api/internships?${params.toString()}`)
      .then((data) => {
        if (cancelled) return
        setResults(normalizeList(data.internships, 'internship', appliedMap))
        setPages(data.pages || 1)
        setTotal(data.total || 0)
        setError('')
      })
      .catch((err) => { if (!cancelled) setError(err.message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [filters, page, appliedMap])

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
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Internships</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">Real work. Real teams. Real impact.</p>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* Count + sort + mobile filter */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold sm:text-xl">
              {loading ? 'Loading…' : `${total} internships`}
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

          {!error && !loading && results.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
              No internships match your filters.
            </div>
          )}

          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <InternshipCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((o, i) => <InternshipCard key={o.id} item={o} index={i} />)}
            </div>
          )}

          {pages > 1 && (
            <div className="flex justify-center">
              <Pagination page={page} pages={pages} onChange={setPage} />
            </div>
          )}

        </div>
      </main>
    </SiteLayout>
  )
}
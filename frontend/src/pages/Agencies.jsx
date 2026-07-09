import { useEffect, useState } from 'react'
import { SiteLayout } from '@/components/site/site-layout'
import { AgencyCard, AgencyCardSkeleton } from '@/components/site/agency-card'
import { api } from '@/lib/api'

export default function Agencies() {
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    api.get('/api/agency/listing-feed?limit=24')
      .then(data => {
        setListings(data.listings || [])
        setError('')
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  return (
    <SiteLayout>
      <header className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Agency Opportunities</h1>
        <p className="mt-1 text-sm text-slate-600 sm:text-base">
          Gigs, projects, internships, and jobs posted by creative agencies.
        </p>
      </header>

      <main className="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
        {error && (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <AgencyCardSkeleton key={i} />
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-12 text-center text-slate-500">
            No opportunities posted yet. Check back soon!
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((item, i) => (
              <AgencyCard key={`${item.kind || 'job'}:${item._id}`} item={item} index={i} />
            ))}
          </div>
        )}
      </main>
    </SiteLayout>
  )
}
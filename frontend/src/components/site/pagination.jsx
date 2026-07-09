import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null

  const goTo = (p) => {
    const clamped = Math.max(1, Math.min(pages, p))
    if (clamped !== page) onChange(clamped)
  }

  // On mobile show fewer page numbers
  const windowSize = typeof window !== 'undefined' && window.innerWidth < 640 ? 3 : 5
  let start = Math.max(1, page - Math.floor(windowSize / 2))
  let end = Math.min(pages, start + windowSize - 1)
  start = Math.max(1, end - windowSize + 1)
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i)

  const btnBase = 'grid size-8 place-items-center rounded-lg text-sm font-bold transition-colors sm:size-9'

  return (
    <nav className="mt-6 flex items-center justify-center gap-1 sm:mt-8 sm:gap-1.5" aria-label="Pagination">
      <button
        onClick={() => goTo(page - 1)}
        disabled={page === 1}
        className={`${btnBase} border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500`}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </button>

      {start > 1 && (
        <>
          <button onClick={() => goTo(1)} className={`${btnBase} text-slate-500 hover:bg-slate-100`}>1</button>
          {start > 2 && <span className="px-0.5 text-slate-400 text-xs">…</span>}
        </>
      )}

      {pageNumbers.map((p) => (
        <button
          key={p}
          onClick={() => goTo(p)}
          className={`${btnBase} ${p === page ? 'bg-primary text-primary-foreground' : 'text-slate-600 hover:bg-slate-100'}`}
          aria-current={p === page ? 'page' : undefined}
        >
          {p}
        </button>
      ))}

      {end < pages && (
        <>
          {end < pages - 1 && <span className="px-0.5 text-slate-400 text-xs">…</span>}
          <button onClick={() => goTo(pages)} className={`${btnBase} text-slate-500 hover:bg-slate-100`}>{pages}</button>
        </>
      )}

      <button
        onClick={() => goTo(page + 1)}
        disabled={page === pages}
        className={`${btnBase} border border-slate-200 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-40 disabled:hover:border-slate-200 disabled:hover:text-slate-500`}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  )
}

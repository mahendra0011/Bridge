import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Briefcase, BookOpen, Building2, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'

const TYPE_ICON = {
  internship: BookOpen,
  job: Briefcase,
  company: Building2,
}

const TYPE_LABEL = {
  internship: 'Internship',
  job: 'Job',
  company: 'Company',
}

const TYPE_COLOR = {
  internship: 'text-emerald-600 bg-emerald-50',
  job: 'text-blue-600 bg-blue-50',
  company: 'text-violet-600 bg-violet-50',
}

function resultHref(r) {
  if (r.type === 'company') return `/internships?company=${r.title}`
  return `/${r.type}/${r.id}`
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(-1)
  const inputRef = useRef(null)
  const panelRef = useRef(null)
  const timerRef = useRef(null)
  const navigate = useNavigate()

  // Debounced search
  const doSearch = useCallback((q) => {
    if (!q.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    api.get(`/api/search?q=${encodeURIComponent(q)}&limit=8`)
      .then(data => { setResults(data.results || []); setActive(-1) })
      .catch(() => setResults([]))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => doSearch(query), 320)
    return () => clearTimeout(timerRef.current)
  }, [query, doSearch])

  // Open on Ctrl+K / Cmd+K
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(true)
        setTimeout(() => inputRef.current?.focus(), 50)
      }
      if (e.key === 'Escape') { setOpen(false); setQuery(''); setResults([]) }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false); setQuery(''); setResults([])
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (r) => {
    navigate(resultHref(r))
    setOpen(false); setQuery(''); setResults([])
  }

  const handleKeyDown = (e) => {
    if (!results.length) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, results.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && active >= 0) { handleSelect(results[active]) }
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="hidden md:flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-sm text-slate-400 hover:border-primary hover:text-slate-600 transition-colors w-48 xl:w-64"
      >
        <Search className="size-3.5 shrink-0" />
        <span className="flex-1 text-left">Search...</span>
        <kbd className="hidden xl:inline-flex items-center gap-0.5 rounded bg-slate-200 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">⌘K</kbd>
      </button>

      {/* Mobile icon */}
      <button
        onClick={() => { setOpen(true); setTimeout(() => inputRef.current?.focus(), 50) }}
        className="grid size-9 place-items-center rounded-xl text-slate-600 hover:bg-slate-100 md:hidden"
        aria-label="Search"
      >
        <Search className="size-4" />
      </button>

      {/* Modal overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/30 backdrop-blur-sm">
          <div ref={panelRef} className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white shadow-2xl overflow-hidden">
            {/* Input row */}
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <Search className="size-4 shrink-0 text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Search jobs, internships, companies…"
                className="flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-slate-400"
              />
              {loading && <Loader2 className="size-4 animate-spin text-primary shrink-0" />}
              {query && !loading && (
                <button onClick={() => { setQuery(''); setResults([]); inputRef.current?.focus() }}>
                  <X className="size-4 text-slate-400 hover:text-slate-600" />
                </button>
              )}
              <button
                onClick={() => { setOpen(false); setQuery(''); setResults([]) }}
                className="text-xs text-slate-400 hover:text-slate-600 border border-slate-200 rounded px-1.5 py-0.5"
              >
                ESC
              </button>
            </div>

            {/* Results */}
            {results.length > 0 ? (
              <ul className="max-h-80 overflow-y-auto py-2">
                {results.map((r, i) => {
                  const Icon = TYPE_ICON[r.type] || Briefcase
                  return (
                    <li key={`${r.type}-${r.id}`}>
                      <button
                        onClick={() => handleSelect(r)}
                        onMouseEnter={() => setActive(i)}
                        className={`flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors ${
                          active === i ? 'bg-slate-50' : 'hover:bg-slate-50'
                        }`}
                      >
                        <span className={`grid size-7 shrink-0 place-items-center rounded-lg ${TYPE_COLOR[r.type]}`}>
                          <Icon className="size-3.5" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-foreground">{r.title}</p>
                          {r.sub && <p className="truncate text-xs text-slate-500">{r.sub}</p>}
                        </div>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${TYPE_COLOR[r.type]}`}>
                          {TYPE_LABEL[r.type]}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : query && !loading ? (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-slate-400">
                <Search className="size-8 opacity-40" />
                <p className="text-sm">No results for <span className="font-semibold">"{query}"</span></p>
              </div>
            ) : !query ? (
              <div className="flex flex-col items-center justify-center gap-1.5 py-8 text-slate-400">
                <Search className="size-7 opacity-40" />
                <p className="text-sm">Type to search across the platform</p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </>
  )
}

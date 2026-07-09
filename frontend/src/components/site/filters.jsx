import { useState } from 'react'
import { Search, MapPin, Briefcase, Code, Tag, DollarSign, Calendar, X, BookmarkPlus, RotateCcw, ChevronDown, Bell, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

export const categories = ['Engineering', 'Design', 'Marketing', 'Data', 'Sales', 'Product']

export const defaultFilters = {
  query: '',
  location: '',
  mode: '',
  category: '',
  minPay: 0,
  maxPay: 0,
  skills: [],
  deadlineBefore: '',
  sort: 'newest',
}

export const sortOptions = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'deadline', label: 'Deadline (soonest)' },
  { value: 'payHigh', label: 'Highest pay' },
  { value: 'payLow', label: 'Lowest pay' },
]

function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
        active ? 'bg-primary/10 text-primary' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function SkillsInput({ value, onChange }) {
  const [draft, setDraft] = useState('')

  const addSkill = (raw) => {
    const skill = raw.trim()
    if (!skill) return
    if (value.some((s) => s.toLowerCase() === skill.toLowerCase())) { setDraft(''); return }
    onChange([...value, skill])
    setDraft('')
  }

  const removeSkill = (skill) => onChange(value.filter((s) => s !== skill))

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addSkill(draft)
    } else if (e.key === 'Backspace' && !draft && value.length) {
      removeSkill(value[value.length - 1])
    }
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 rounded-lg border border-slate-200 p-2 focus-within:border-primary">
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary"
          >
            {skill}
            <button
              type="button"
              onClick={() => removeSkill(skill)}
              aria-label={`Remove ${skill}`}
              className="text-primary/70 hover:text-primary"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addSkill(draft)}
          placeholder={value.length ? 'Add another…' : 'e.g. React, Figma'}
          className="min-w-[6rem] flex-1 border-none p-1 text-sm outline-none"
        />
      </div>
      <p className="mt-1 text-[11px] text-slate-400">Press Enter or comma to add a skill</p>
    </div>
  )
}

function FilterContent({ value, onChange, kind }) {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)

  const makePayload = (frequency) => ({
    name: value.query ? `Search: ${value.query}` : value.location ? `Search: ${value.location}` : 'Custom search',
    kind: kind || 'both',
    filters: {
      query: value.query || undefined,
      location: value.location || undefined,
      mode: value.mode || undefined,
      category: value.category || undefined,
      skills: (value.skills?.length || 0) > 0 ? value.skills : undefined,
      ...(kind === 'internship'
        ? { stipendMin: value.minPay || undefined, stipendMax: value.maxPay || undefined }
        : { salaryMin: value.minPay || undefined, salaryMax: value.maxPay || undefined }
      ),
    },
    frequency: frequency || 'instant',
  })

  const saveCurrentSearch = async () => {
    setSaving(true)
    try {
      await api.post('/api/student/saved-searches', makePayload())
      toast.success('Search saved!')
    } catch (err) {
      toast.error(err.message || 'Could not save search')
    } finally {
      setSaving(false)
    }
  }

  const saveSearchWithAlert = async (frequency) => {
    setSaving(true)
    try {
      await api.post('/api/student/saved-searches', makePayload(frequency))
      toast.success(`Alert created! You'll get ${frequency} updates.`)
    } catch (err) {
      toast.error(err.message || 'Could not create alert')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Search</h3>
        <input
          value={value.query}
          onChange={(e) => onChange({ ...value, query: e.target.value })}
          placeholder="Title or company"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Location</h3>
        <input
          value={value.location}
          onChange={(e) => onChange({ ...value, location: e.target.value })}
          placeholder="Anywhere"
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Work mode</h3>
        <div className="flex flex-wrap gap-2">
          {['', 'Remote', 'Hybrid', 'On-site'].map((m) => (
            <Chip key={m || 'any'} active={value.mode === m} onClick={() => onChange({ ...value, mode: m })}>
              {m || 'Any'}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Category</h3>
        <div className="flex flex-wrap gap-2">
          <Chip active={value.category === ''} onClick={() => onChange({ ...value, category: '' })}>All</Chip>
          {categories.map((c) => (
            <Chip key={c} active={value.category === c} onClick={() => onChange({ ...value, category: c })}>
              {c}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Pay range</h3>
        <div className="space-y-3">
          <div>
            <input
              type="range"
              min={0}
              max={100000}
              step={1000}
              value={value.minPay}
              onChange={(e) => {
                const next = Number(e.target.value)
                onChange({ ...value, minPay: next, maxPay: value.maxPay && value.maxPay < next ? next : value.maxPay })
              }}
              className="w-full accent-primary"
            />
            <div className="mt-1 text-xs font-medium text-slate-500">Min ₹{(value.minPay || 0).toLocaleString()}</div>
          </div>
          <div>
            <input
              type="range"
              min={0}
              max={100000}
              step={1000}
              value={value.maxPay || 0}
              onChange={(e) => {
                const next = Number(e.target.value)
                onChange({ ...value, maxPay: next, minPay: value.minPay && value.minPay > next ? next : value.minPay || 0 })
              }}
              className="w-full accent-primary"
            />
            <div className="mt-1 text-xs font-medium text-slate-500">
              Max {value.maxPay ? `₹${value.maxPay.toLocaleString()}` : 'No limit'}
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Skills</h3>
        <SkillsInput value={value.skills || []} onChange={(skills) => onChange({ ...value, skills })} />
      </div>

      <div>
        <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-slate-500">Apply before</h3>
        <input
          type="date"
          value={value.deadlineBefore}
          onChange={(e) => onChange({ ...value, deadlineBefore: e.target.value })}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
        />
      </div>

      {/* Save search + alerts */}
      <div className="flex gap-2">
        <button
          onClick={saveCurrentSearch}
          disabled={saving}
          className="flex-1 rounded-lg border border-primary/30 py-2 text-xs font-bold text-primary hover:bg-primary/5 disabled:opacity-50"
        >
          <BookmarkPlus className="inline size-3.5 mr-1" />
          {saving ? 'Saving...' : 'Save Search'}
        </button>
        {user?.role === 'student' && !saving && (
          <button
            onClick={() => saveSearchWithAlert('instant')}
            className="rounded-lg border border-amber-200 px-3 py-2 text-xs font-bold text-amber-700 hover:bg-amber-50"
          >
            <Bell className="inline size-3.5 mr-1" /> Alert
          </button>
        )}
        {(value.query || value.location || value.mode || value.category || (value.minPay || 0) > 0 || (value.maxPay || 0) > 0 || (value.skills?.length || 0) > 0 || value.deadlineBefore) && (
          <button
            onClick={() => onChange(defaultFilters)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:border-rose-300 hover:text-rose-600"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  )
}

// Desktop sidebar
export function FilterSidebar({ value, onChange, kind }) {
  return (
    <aside className="hidden w-56 shrink-0 lg:block xl:w-64">
      <div className="sticky top-20 rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="mb-5 font-bold">Filters</h2>
        <FilterContent value={value} onChange={onChange} kind={kind} />
      </div>
    </aside>
  )
}

// Mobile filter sheet (bottom drawer on mobile, shown via button)
export function MobileFilterSheet({ value, onChange, renderContent }) {
  const [open, setOpen] = useState(false)
  const activeCount = [
    value.query,
    value.location,
    value.mode,
    value.category,
    (value.minPay || 0) > 0,
    (value.maxPay || 0) > 0,
    (value.skills?.length || 0) > 0,
    value.deadlineBefore,
    value.openTo,
    value.relocate,
  ].filter(Boolean).length

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:border-primary hover:text-primary lg:hidden"
      >
        <SlidersHorizontal className="size-4" />
        Filters
        {activeCount > 0 && (
          <span className="grid size-5 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl border-t border-slate-200 bg-white p-5 shadow-2xl transition-transform duration-300 ease-in-out lg:hidden ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85dvh', overflowY: 'auto' }}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-bold">Filters</h2>
          <button
            onClick={() => setOpen(false)}
            className="grid size-8 place-items-center rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"
          >
            <X className="size-4" />
          </button>
        </div>
        {renderContent ? renderContent(value, onChange) : <FilterContent value={value} onChange={onChange} />}
        <button
          onClick={() => setOpen(false)}
          className="mt-6 w-full rounded-xl bg-primary py-3 text-sm font-bold text-white hover:bg-primary/90"
        >
          Apply filters
        </button>
      </div>
    </>
  )
}

// kind: 'job' | 'internship' — determines backend param names for pay range + sort values
export function toQueryParams(filters, kind, extra = {}) {
  const params = new URLSearchParams()
  if (filters.query) params.set('query', filters.query)
  if (filters.location) params.set('location', filters.location)
  if (filters.mode) params.set('mode', filters.mode)
  if (filters.category) params.set('category', filters.category)

  if (kind === 'internship') {
    if (filters.minPay) params.set('minStipend', String(filters.minPay))
    if (filters.maxPay) params.set('maxStipend', String(filters.maxPay))
  } else {
    if (filters.minPay) params.set('salaryMin', String(filters.minPay))
    if (filters.maxPay) params.set('salaryMax', String(filters.maxPay))
  }

  if (filters.skills && filters.skills.length) params.set('skills', filters.skills.join(','))
  if (filters.deadlineBefore) params.set('deadlineBefore', filters.deadlineBefore)

  if (filters.sort && filters.sort !== 'newest') {
    const sortValue = filters.sort === 'payHigh'
      ? (kind === 'internship' ? 'stipendHigh' : 'salaryHigh')
      : filters.sort === 'payLow'
        ? (kind === 'internship' ? 'stipendLow' : 'salaryLow')
        : filters.sort
    params.set('sort', sortValue)
  }

  Object.entries(extra).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') params.set(k, String(v))
  })
  return params
}

// Sort dropdown shown next to the results count header
export function SortDropdown({ value, onChange, options = sortOptions }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 outline-none focus:border-primary sm:text-sm"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  )
}

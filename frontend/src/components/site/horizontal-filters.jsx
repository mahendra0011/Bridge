import { useState } from 'react'
import { X, Search, MapPin, Briefcase, SlidersHorizontal } from 'lucide-react'
import { categories, defaultFilters } from './filters'

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
    <div className="relative">
      <div className="flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 focus-within:border-primary">
        {value.map((skill) => (
          <span
            key={skill}
            className="inline-flex items-center gap-1 rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary"
          >
            {skill}
            <button type="button" onClick={() => removeSkill(skill)} className="text-primary/70 hover:text-primary">
              <X className="size-2.5" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => addSkill(draft)}
          placeholder={value.length ? 'Add…' : 'e.g. React, Figma'}
          className="min-w-[5rem] flex-1 border-none p-0.5 text-xs outline-none placeholder:text-slate-400"
        />
      </div>
    </div>
  )
}

function ModeChip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
        active ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
      }`}
    >
      {children}
    </button>
  )
}

function CategoryChip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`whitespace-nowrap rounded-md px-2.5 py-1 text-[11px] font-bold transition-colors ${
        active ? 'bg-primary/10 text-primary' : 'text-slate-500 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

export function HorizontalFilters({ value, onChange, showOpenTo = false }) {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const hasAdvancedJobs = value.minPay > 0 || value.maxPay > 0 || value.skills.length > 0 || value.deadlineBefore
  const hasOpenToOptions = value.openTo || value.relocate
  const hasAdvanced = showOpenTo 
    ? (hasAdvancedJobs || value.openTo || value.relocate || value.skills.length > 0)
    : hasAdvancedJobs

  const activeAdvancedCount = showOpenTo
    ? [
        value.minPay > 0,
        value.maxPay > 0,
        value.skills.length > 0,
        value.deadlineBefore,
        value.openTo,
        value.relocate,
      ].filter(Boolean).length
    : [
        value.minPay > 0,
        value.maxPay > 0,
        value.skills.length > 0,
        value.deadlineBefore,
      ].filter(Boolean).length

  return (
    <div className="space-y-3">
      {/* Row 1: Search + Location + Mode + Category */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Search */}
        <div className="relative min-w-[180px] flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={value.query}
            onChange={(e) => onChange({ ...value, query: e.target.value })}
            placeholder="Search title or company…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-primary placeholder:text-slate-400"
          />
        </div>

        {/* Location */}
        <div className="relative min-w-[140px] flex-1">
          <MapPin className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            value={value.location}
            onChange={(e) => onChange({ ...value, location: e.target.value })}
            placeholder="Location…"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-primary placeholder:text-slate-400"
          />
        </div>

        {/* Skills input - for OpenToWork */}
        {showOpenTo && (
          <div className="relative min-w-[180px] flex-1">
            <SkillsInput value={value.skills} onChange={(skills) => onChange({ ...value, skills })} />
          </div>
        )}

        {/* Work mode chips */}
        <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
          <Briefcase className="mr-1 size-3.5 text-slate-400" />
          {['', 'Remote', 'Hybrid', 'On-site'].map((m) => (
            <ModeChip key={m || 'any'} active={value.mode === m} onClick={() => onChange({ ...value, mode: m })}>
              {m || 'Any'}
            </ModeChip>
          ))}
        </div>

        {/* Category chips - hide for OpenToWork */}
        {!showOpenTo && (
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
            {['', ...categories].map((c) => (
              <CategoryChip key={c || 'all'} active={value.category === c} onClick={() => onChange({ ...value, category: c })}>
                {c || 'All'}
              </CategoryChip>
            ))}
          </div>
        )}

        {/* Open to chips - for OpenToWork */}
        {showOpenTo && (
          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
            {['', 'job', 'internship', 'both'].map((c) => (
              <CategoryChip key={c || 'any'} active={value.openTo === c} onClick={() => onChange({ ...value, openTo: c })}>
                {c ? (c === 'job' ? 'Jobs' : c === 'internship' ? 'Internship' : 'Both') : 'Any'}
              </CategoryChip>
            ))}
          </div>
        )}

        {/* Advanced toggle */}
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`flex items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 py-2 text-xs font-bold transition-colors ${
            showAdvanced || hasAdvanced
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <SlidersHorizontal className="size-3.5" />
          {showOpenTo ? 'More Filters' : 'Pay & Skills'}
          {activeAdvancedCount > 0 && (
            <span className="grid size-4 place-items-center rounded-full bg-primary text-[10px] font-bold text-white">
              {activeAdvancedCount}
            </span>
          )}
        </button>
      </div>

      {/* Row 2: Advanced filters (pay range, skills, deadline) */}
      {showAdvanced && (
        <div className="flex flex-wrap items-start gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
          {/* Pay range */}
          {!showOpenTo && (
            <div className="min-w-[180px] flex-1">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Pay range</label>
              <div className="flex items-center gap-2">
                <div className="flex-1">
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
                  <div className="text-[11px] font-medium text-slate-500">Min ₹{value.minPay.toLocaleString()}</div>
                </div>
                <span className="text-xs text-slate-300">—</span>
                <div className="flex-1">
                  <input
                    type="range"
                    min={0}
                    max={100000}
                    step={1000}
                    value={value.maxPay}
                    onChange={(e) => {
                      const next = Number(e.target.value)
                      onChange({ ...value, maxPay: next, minPay: next && value.minPay > next ? next : value.minPay })
                    }}
                    className="w-full accent-primary"
                  />
                  <div className="text-[11px] font-medium text-slate-500">
                    Max {value.maxPay ? `₹${value.maxPay.toLocaleString()}` : 'No limit'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Skills */}
          {!showOpenTo && (
            <div className="min-w-[180px] flex-1">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Skills</label>
              <SkillsInput value={value.skills} onChange={(skills) => onChange({ ...value, skills })} />
            </div>
          )}

          {/* Deadline */}
          {!showOpenTo && (
            <div className="min-w-[140px]">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Apply before</label>
              <input
                type="date"
                value={value.deadlineBefore}
                onChange={(e) => onChange({ ...value, deadlineBefore: e.target.value })}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-primary"
              />
            </div>
          )}

          {/* Relocate filter - for OpenToWork */}
          {showOpenTo && (
            <div className="min-w-[140px]">
              <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">Relocate</label>
              <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5">
                {['', 'true', 'false'].map((opt) => (
                  <CategoryChip 
                    key={opt || 'any'} 
                    active={value.relocate === opt} 
                    onClick={() => onChange({ ...value, relocate: opt })}
                  >
                    {opt === '' ? 'Any' : opt === 'true' ? 'Yes' : 'No'}
                  </CategoryChip>
                ))}
              </div>
            </div>
          )}

          {/* Reset */}
          {hasAdvanced && !showOpenTo && (
            <button
              onClick={() => onChange({ ...value, minPay: 0, maxPay: 0, skills: [], deadlineBefore: '' })}
              className="self-end rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:border-rose-300 hover:text-rose-600"
            >
              Reset
            </button>
          )}

          {/* Reset for OpenToWork */}
          {hasAdvanced && showOpenTo && (
            <button
              onClick={() => onChange({ ...value, skills: [], openTo: '', relocate: '' })}
              className="self-end rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 hover:border-rose-300 hover:text-rose-600"
            >
              Reset
            </button>
          )}
        </div>
      )}

      {/* Active filter count indicator */}
      {hasAdvanced && !showAdvanced && (
        <p className="text-[11px] text-slate-400">
          {activeAdvancedCount} advanced filter{activeAdvancedCount > 1 ? 's' : ''} active — click to adjust
        </p>
      )}
    </div>
  )
}
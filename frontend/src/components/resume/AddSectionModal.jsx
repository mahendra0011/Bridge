import React, { useState, useMemo } from 'react'
import Fuse from 'fuse.js'
import {
  X, Search, Check, Plus, Sparkles, Layers, PenTool, Lightbulb,
  Briefcase, Award, Code, Globe, Heart, Shield, Star, Users
} from 'lucide-react'
import { ALL_SECTIONS, SECTION_CATEGORIES } from '@/data/allSections'
import { CUSTOM_LAYOUT_OPTIONS, AVAILABLE_ICONS, PRESET_IDEAS } from './AddManualSectionModal'

export function AddSectionModal({ isOpen, onClose, sections, onAddSection, onCreateCustomSection }) {
  const [activeTab, setActiveTab] = useState('prebuilt') // 'prebuilt' | 'manual'
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Sections')

  // Manual Custom Section State
  const [manualTitle, setManualTitle] = useState('')
  const [manualLayout, setManualLayout] = useState('experience')
  const [manualIcon, setManualIcon] = useState('Sparkles')
  const [isRepeatable, setIsRepeatable] = useState(true)

  // All sections as array (excluding personal if already added)
  const sectionEntries = useMemo(() => {
    const hasPersonal = sections?.some(s => s.type === 'personal')
    return Object.entries(ALL_SECTIONS)
      .filter(([type]) => type === 'personal' ? !hasPersonal : true)
      .map(([type, config]) => ({ type, config }))
  }, [sections])

  // Fuse.js index on sections list
  const sectionFuse = useMemo(() => new Fuse(sectionEntries, {
    keys: [
      { name: 'config.label', weight: 0.7 },
      { name: 'type',         weight: 0.3 },
    ],
    threshold: 0.4,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }), [sectionEntries])

  const availableSections = useMemo(() => {
    const q = search.trim()

    // Apply fuzzy search or use full list
    const searched = q
      ? sectionFuse.search(q).map(r => [r.item.type, r.item.config])
      : sectionEntries.map(({ type, config }) => [type, config])

    // Category filter on top of search
    return searched.filter(([type]) => {
      if (selectedCategory === 'All Sections') return true
      const cat = SECTION_CATEGORIES.find(c => c.name === selectedCategory)
      return cat ? cat.types.includes(type) : true
    })
  }, [search, selectedCategory, sectionEntries, sectionFuse])

  if (!isOpen) return null

  const handleCreateManual = (e) => {
    e.preventDefault()
    if (!manualTitle.trim()) return

    const sanitizedKey = manualTitle
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    const customType = `custom_${sanitizedKey || 'section'}_${Date.now().toString(36).slice(-4)}`
    const selectedLayoutConfig = CUSTOM_LAYOUT_OPTIONS.find(l => l.id === manualLayout) || CUSTOM_LAYOUT_OPTIONS[0]

    const config = {
      type: customType,
      customSectionHeading: manualTitle.trim(),
      customLayout: manualLayout,
      customIcon: manualIcon,
      repeatable: isRepeatable,
      fields: selectedLayoutConfig.fields
    }

    if (onCreateCustomSection) {
      onCreateCustomSection(config, {})
    }
    onClose()
    setManualTitle('')
  }

  const handleApplyPreset = (p) => {
    setManualTitle(p.title)
    setManualLayout(p.layout)
    setManualIcon(p.icon)
  }

  const selectedLayoutConfig = CUSTOM_LAYOUT_OPTIONS.find(l => l.id === manualLayout) || CUSTOM_LAYOUT_OPTIONS[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shadow-xs">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Add Sections to Your Resume
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose from 35+ pre-built sections or build your own custom section manually.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="size-8 rounded-full grid place-items-center hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 bg-white flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('prebuilt')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'prebuilt'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Layers className="size-3.5" />
            <span>Pre-Built Sections (35+)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
              activeTab === 'manual'
                ? 'bg-primary text-white shadow-xs'
                : 'text-primary bg-primary/10 hover:bg-primary/15'
            }`}
          >
            <PenTool className="size-3.5" />
            <span>+ Add a Section Manually</span>
          </button>
        </div>

        {/* TAB 1: PRE-BUILT CATALOG */}
        {activeTab === 'prebuilt' && (
          <>
            {/* Search & Categories Filter */}
            <div className="p-6 border-b border-slate-100 space-y-3 bg-white">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search sections (e.g. Internships, Publications, Hackathons, Languages...)"
                    className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('manual')}
                  className="px-3 py-2 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 text-xs font-bold flex items-center gap-1.5 shrink-0 transition-colors shadow-xs"
                >
                  <PenTool className="size-3.5" />
                  <span className="hidden sm:inline">Create</span> Manually
                </button>
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {['All Sections', ...SECTION_CATEGORIES.map(c => c.name)].map(category => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      selectedCategory === category
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* Catalog Grid */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {availableSections.map(([type, config]) => {
                  const Icon = config.icon || Sparkles
                  const count = sections.filter(s => s.type === type).length
                  const isAdded = count > 0

                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => onAddSection(type)}
                      disabled={isAdded && !config.repeatable}
                      className={`p-3.5 rounded-2xl border text-left flex items-start justify-between gap-2.5 transition-all ${
                        isAdded && !config.repeatable
                          ? 'border-slate-200 bg-slate-100/80 text-slate-400 cursor-default opacity-70'
                          : 'border-slate-200 bg-white hover:border-primary hover:shadow-md hover:-translate-y-0.5 text-slate-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${config.bgColor || 'bg-slate-100'}`}>
                          <Icon className={`size-4 ${config.color || 'text-slate-600'}`} />
                        </div>
                        <div>
                          <h4 className="font-bold text-xs leading-snug">{config.label}</h4>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            {config.repeatable ? 'Multiple entries' : 'Single entry'}
                          </p>
                        </div>
                      </div>

                      <div>
                        {isAdded ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5 text-[10px] font-bold">
                            <Check className="size-3" /> {count > 1 ? count : 'Added'}
                          </span>
                        ) : (
                          <span className="size-6 rounded-full bg-slate-100 text-slate-600 hover:bg-primary hover:text-white flex items-center justify-center transition-colors">
                            <Plus className="size-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* TAB 2: ADD A SECTION MANUALLY */}
        {activeTab === 'manual' && (
          <form onSubmit={handleCreateManual} className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Quick Inspiration Pills */}
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                ⚡ Quick Presets (Click to autofill):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {PRESET_IDEAS.map(p => (
                  <button
                    key={p.title}
                    type="button"
                    onClick={() => handleApplyPreset(p)}
                    className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                      manualTitle === p.title
                        ? 'bg-primary text-white border-primary font-bold shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    + {p.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Section Title */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800">
                Custom Section Heading / Title *
              </label>
              <input
                type="text"
                required
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                placeholder="e.g. Patents & Inventions, Speaking Engagements, Military Experience..."
                className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
              />
            </div>

            {/* Layout Style Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">
                Choose Format & Field Layout
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CUSTOM_LAYOUT_OPTIONS.map(layout => {
                  const isSelected = layout.id === manualLayout
                  return (
                    <button
                      key={layout.id}
                      type="button"
                      onClick={() => setManualLayout(layout.id)}
                      className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1 ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                          {layout.title}
                        </span>
                        {isSelected && <Check className="size-4 text-primary" />}
                      </div>
                      <p className="text-[11px] text-slate-500">{layout.subtitle}</p>
                      <span className="text-[10px] text-slate-400 font-mono bg-slate-100/70 px-2 py-0.5 rounded mt-1">
                        {layout.preview}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Icon Picker */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800">
                Choose Section Icon
              </label>
              <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
                {AVAILABLE_ICONS.map(({ name, icon: Icon }) => {
                  const isSelected = manualIcon === name
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setManualIcon(name)}
                      className={`size-10 rounded-xl border grid place-items-center transition-all ${
                        isSelected
                          ? 'border-primary bg-primary text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                      }`}
                      title={name}
                    >
                      <Icon className="size-4" />
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Repeatable Toggle */}
            <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-800">Repeatable Section</p>
                <p className="text-[11px] text-slate-500">Allow adding multiple entries under this heading</p>
              </div>
              <input
                type="checkbox"
                checked={isRepeatable}
                onChange={e => setIsRepeatable(e.target.checked)}
                className="size-4 text-primary rounded border-slate-300 focus:ring-primary"
              />
            </div>
          </form>
        )}

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between text-xs text-slate-500">
          {activeTab === 'prebuilt' ? (
            <>
              <span>{availableSections.length} sections available</span>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 shadow-sm"
              >
                Done
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setActiveTab('prebuilt')}
                className="text-xs font-bold text-slate-600 hover:underline"
              >
                ← Back to Pre-Built Sections
              </button>
              <button
                type="button"
                onClick={handleCreateManual}
                disabled={!manualTitle.trim()}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
              >
                <Plus className="size-3.5" /> Create & Add Section
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

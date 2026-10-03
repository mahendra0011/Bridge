import { useState, useMemo, useEffect } from 'react'
import Fuse from 'fuse.js'
import { useNavigate, useLocation } from 'react-router-dom'
import { 
  FileText, Search, Star, ThumbsUp, ArrowRight, Eye, CheckCircle2, 
  Sparkles, ShieldCheck, Filter, ChevronRight, Layers, SlidersHorizontal,
  Plus, Code2, Users
} from 'lucide-react'
import { SiteLayout } from '@/components/site/site-layout'
import { DashboardLayout } from '@/components/dashboard/dashboard-layout'
import { RESUME_TEMPLATES, TEMPLATE_CATEGORIES } from '@/data/resumeTemplates'
import { ResumeCardPreview } from '@/components/resume/ResumeCardPreview'
import { ResumePreviewModal } from '@/components/resume/ResumePreviewModal'
import { useAuth } from '@/context/AuthContext'
import { toast } from 'sonner'
import axios from '@/lib/axios'

export default function ResumeTemplates() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()

  // Detect if user accessed from inside the dashboard
  const isInsideDashboard = location.pathname.startsWith('/dashboard')

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All Templates')
  const [previewTemplate, setPreviewTemplate] = useState(null)
  const [communityTemplates, setCommunityTemplates] = useState([])

  // Load published community templates
  useEffect(() => {
    let isMounted = true
    axios.get('/resume-templates')
      .then(res => {
        if (isMounted && res.data?.templates) {
          // Normalize community templates to match RESUME_TEMPLATES shape
          const normalized = res.data.templates.map(t => ({
            id: t._id,
            name: t.name,
            shortName: t.shortName || t.name,
            category: t.category || 'General & Custom',
            type: t.type || 'visual',
            badges: t.badges || ['Custom', 'Community'],
            primaryColor: t.primaryColor || '2563eb',
            colorHex: t.colorHex || '#2563eb',
            accentBg: t.accentBg || '#eff6ff',
            fontFamily: t.fontFamily || 'sans',
            atsScore: t.atsScore || 95,
            layoutStyle: t.layoutStyle || 'split-sidebar',
            sidebarWidth: t.sidebarWidth || 35,
            sampleUser: t.sampleUser || {
              name: 'Custom Template',
              role: 'Professional Role',
              email: 'user@example.com',
              phone: '+1 555-0199',
              location: 'Remote',
              summary: t.description || 'Custom user created template.',
              skills: ['Leadership', 'Communication', 'Problem Solving'],
              experience: [{
                role: 'Senior Specialist',
                company: 'Global Enterprises',
                duration: '2021 - Present',
                points: ['Delivered key business initiatives on time and within scope.']
              }],
              education: 'University Degree'
            },
            latexCode: t.latexCode,
            author: t.user ? `${t.user.firstName || ''} ${t.user.lastName || ''}`.trim() : null
          }))
          setCommunityTemplates(normalized)
        }
      })
      .catch(() => {
        // Silently fail if offline or empty
      })
    return () => { isMounted = false }
  }, [])

  // Combine standard and community templates
  const allTemplates = useMemo(() => {
    return [...RESUME_TEMPLATES, ...communityTemplates]
  }, [communityTemplates])

  // Build Fuse.js index — only rebuilds when template list changes
  const fuseIndex = useMemo(() => new Fuse(allTemplates, {
    // Fields to search across, with weights
    keys: [
      { name: 'name',                  weight: 0.35 },
      { name: 'shortName',             weight: 0.20 },
      { name: 'category',              weight: 0.20 },
      { name: 'sampleUser.role',       weight: 0.15 },
      { name: 'sampleUser.skills',     weight: 0.07 },
      { name: 'badges',                weight: 0.03 },
    ],
    // Fuzzy search config
    threshold: 0.35,        // 0 = exact, 1 = match anything
    distance: 100,          // how far from start to search
    minMatchCharLength: 2,
    includeScore: true,
    useExtendedSearch: false,
    ignoreLocation: true,   // search anywhere in string
  }), [allTemplates])

  // Category filter helper
  const matchesCategory = (tpl) => {
    if (selectedCategory === 'Popular')    return tpl.badges?.includes('Popular')
    if (selectedCategory === 'Recommended') return tpl.badges?.includes('Recommended')
    if (selectedCategory === 'All Templates') return true
    return tpl.category?.toLowerCase().includes(selectedCategory.toLowerCase())
  }

  // Filter + fuzzy search — memoized
  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim()

    if (!q) {
      // No search — just apply category filter
      return allTemplates.filter(matchesCategory)
    }

    // Fuse.js fuzzy search, then category filter on results
    const fuseResults = fuseIndex.search(q)
    return fuseResults
      .map(r => r.item)
      .filter(matchesCategory)
  }, [allTemplates, fuseIndex, selectedCategory, searchQuery])

  const handleUseTemplate = (template) => {
    if (template.type === 'latex') {
      toast.success(`Selected "${template.name}"! Opening LaTeX Studio...`)
      navigate(`/resume-templates/latex?template=${template.id}`)
      return
    }

    toast.success(`Selected "${template.shortName || template.name}"! Opening visual builder...`)
    const targetUrl = `/resume-builder?template=${template.id}`
    navigate(targetUrl)
  }

  const handleOpenLatexEditor = (template) => {
    toast.success(`Opening "${template.shortName || template.name}" in Bridge LaTeX Editor...`)
    navigate(`/resume-templates/latex?template=${template.id}`)
  }

  const handleStartFromScratch = () => {
    navigate('/resume-templates/create')
  }

  // Category counts for quick visual feedback
  const categoryCounts = useMemo(() => {
    const counts = {}
    TEMPLATE_CATEGORIES.forEach(cat => {
      if (cat === 'All Templates') {
        counts[cat] = allTemplates.length
      } else if (cat === 'Popular') {
        counts[cat] = allTemplates.filter(t => t.badges?.includes('Popular')).length
      } else if (cat === 'Recommended') {
        counts[cat] = allTemplates.filter(t => t.badges?.includes('Recommended')).length
      } else {
        counts[cat] = allTemplates.filter(t => 
          t.category && (
            t.category.toLowerCase() === cat.toLowerCase() ||
            t.category.toLowerCase().includes(cat.toLowerCase())
          )
        ).length
      }
    })
    return counts
  }, [allTemplates])

  const content = (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="mb-8 text-center sm:text-left">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold mb-3">
          <Sparkles className="size-3.5" />
          <span>600+ ATS-Engineered Templates</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-slate-900">
              Professional Resume Templates
            </h1>
            <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl">
              Recruiter-approved, ATS-friendly templates across 20+ career industries designed to pass automated screening algorithms and land interviews.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto text-xs font-semibold text-slate-600 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200/60">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>Showing {filteredTemplates.length} templates (+ Scratch)</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="mb-8 space-y-4">
        {/* Search Input */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search 600+ templates by role, skill, or industry..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-xs"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Clear
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {TEMPLATE_CATEGORIES.map(category => {
            const isActive = selectedCategory === category
            const count = categoryCounts[category] || 0
            return (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80 hover:text-slate-900'
                }`}
              >
                <span>{category}</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-500'
                }`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Templates Grid with "+ Start from scratch" as the FIRST card */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* 1. START FROM SCRATCH CARD (Matches Zety Style) */}
        <div
          onClick={handleStartFromScratch}
          className="group relative flex flex-col rounded-2xl bg-white border-2 border-dashed border-slate-300 p-3 shadow-xs hover:shadow-xl hover:border-blue-500 cursor-pointer transition-all duration-300"
        >
          {/* Card Canvas */}
          <div className="relative w-full aspect-[8.5/11] bg-slate-50/70 rounded-xl overflow-hidden border border-slate-200/60 flex flex-col items-center justify-center p-6 text-center group-hover:bg-blue-50/30 transition-colors">
            {/* Circular Blue Plus Button */}
            <div className="size-20 sm:size-24 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 group-hover:bg-blue-700 transition-all duration-300">
              <Plus className="size-10 sm:size-12 stroke-[2.5]" />
            </div>

            {/* Label Under Button */}
            <h3 className="mt-5 text-base sm:text-lg font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
              Start from scratch
            </h3>
            <p className="mt-1 text-xs text-slate-500 max-w-[210px] leading-relaxed">
              Build a custom template visually or code in LaTeX with live preview
            </p>

            {/* Subtle action indicator */}
            <div className="mt-4 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100/70 text-blue-700 text-[11px] font-bold opacity-0 group-hover:opacity-100 transition-all transform group-hover:translate-y-0 translate-y-1">
              <span>Choose visual or LaTeX</span>
              <ArrowRight className="size-3" />
            </div>
          </div>

          {/* Bottom Card Footer with Button */}
          <div className="pt-3 pb-1 flex-1 flex flex-col justify-between">
            <div>
              <h4 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors">
                Custom Template Designer
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Visual Studio & Overleaf LaTeX Engine
              </p>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation()
                handleStartFromScratch()
              }}
              className="w-full mt-3.5 inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              <Plus className="size-3.5" /> Start from scratch
            </button>
          </div>
        </div>

        {/* 2. ALL TEMPLATE CARDS */}
        {filteredTemplates.map((template) => {
          const hasPopular = template.badges?.includes('Popular')
          const hasRecommended = template.badges?.includes('Recommended')
          const isLatex = template.type === 'latex'
          const isCommunity = template.badges?.includes('Community') || template.badges?.includes('Custom')

          return (
            <div
              key={template.id}
              className="group relative flex flex-col rounded-2xl bg-white border border-slate-200/80 p-3 shadow-xs hover:shadow-xl hover:border-slate-300 transition-all duration-200"
            >
              {/* Template Preview Card Canvas */}
              <div className="relative w-full aspect-[8.5/11] bg-slate-50 rounded-xl overflow-hidden border border-slate-100 shadow-inner">
                {/* Top Badges (Popular / Recommended / LaTeX / Community / Founder) */}
                <div className="absolute top-2.5 right-2.5 z-20 flex flex-wrap items-center gap-1.5 justify-end">
                  {template.badges?.includes("Founder's Choice") && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 px-2 py-0.5 text-[10px] font-extrabold text-slate-950 shadow-md">
                      <Star className="size-2.5 fill-slate-950" />
                      Founder's Choice
                    </span>
                  )}
                  {isLatex && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-2 py-0.5 text-[10px] font-bold text-teal-400 shadow-md border border-slate-700">
                      <Code2 className="size-2.5 text-teal-400" />
                      LaTeX
                    </span>
                  )}
                  {hasPopular && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <Star className="size-2.5 fill-current" />
                      Popular
                    </span>
                  )}
                  {hasRecommended && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-teal-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <ThumbsUp className="size-2.5 fill-current" />
                      Recommended
                    </span>
                  )}
                  {isCommunity && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md">
                      <Users className="size-2.5" />
                      Community
                    </span>
                  )}
                </div>

                {/* Render the miniature template */}
                <div className="w-full h-full p-2 transition-transform duration-300 group-hover:scale-[1.02]">
                  <ResumeCardPreview template={template} />
                </div>

                {/* Hover Overlay with Action Buttons */}
                <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-2 bg-slate-900/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3.5 text-center">
                  <span className="text-[11px] font-semibold text-slate-200 mb-0.5">Choose Editing Mode:</span>
                  
                  {/* Action 1: Visual / Form Builder */}
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="w-full max-w-[210px] py-2 px-3 rounded-xl bg-primary text-white text-xs font-bold shadow-lg hover:bg-primary/95 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    title="Fill info step-by-step with zero coding required"
                  >
                    <span>Use this template</span>
                    <ArrowRight className="size-3.5" />
                  </button>

                  {/* Action 2: Open in Bridge Resume Editor (LaTeX Code) */}
                  <button
                    onClick={() => handleOpenLatexEditor(template)}
                    className="w-full max-w-[210px] py-2 px-3 rounded-xl bg-slate-900 text-teal-300 border border-teal-500/40 text-xs font-bold shadow-lg hover:bg-slate-800 hover:text-teal-200 active:scale-95 transition-all flex items-center justify-center gap-1.5"
                    title="Edit full LaTeX source code with Overleaf-style live preview"
                  >
                    <Code2 className="size-3.5 text-teal-400" />
                    <span>Open in Bridge LaTeX</span>
                  </button>

                  {/* Action 3: Quick Preview */}
                  <button
                    onClick={() => setPreviewTemplate(template)}
                    className="w-full max-w-[210px] py-1.5 px-3 rounded-xl bg-white/90 text-slate-800 text-[11px] font-semibold hover:bg-white transition-all flex items-center justify-center gap-1"
                  >
                    <Eye className="size-3" /> Quick Preview
                  </button>
                </div>
              </div>

              {/* Template Info Below Card */}
              <div className="pt-3 pb-1 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug group-hover:text-primary transition-colors">
                    {template.name}
                  </h3>
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                    <span className="truncate text-slate-600 font-medium">
                      {template.category}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px]">
                      <ShieldCheck className="size-3 text-emerald-600" />
                      ATS {template.atsScore}%
                    </span>
                  </div>
                </div>

                {/* Dual Action Buttons explicitly visible on every card */}
                <div className="mt-3.5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleUseTemplate(template)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-primary px-2.5 py-2.5 text-xs font-bold text-white shadow-xs hover:bg-primary/90 active:scale-[0.98] transition-all text-center"
                    title="Visual / No-Code Form Builder"
                  >
                    <span>Use template</span>
                    <ArrowRight className="size-3 shrink-0" />
                  </button>
                  <button
                    onClick={() => handleOpenLatexEditor(template)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-slate-900 px-2.5 py-2.5 text-xs font-bold text-teal-300 border border-slate-700 hover:bg-slate-800 hover:border-teal-500/50 active:scale-[0.98] transition-all text-center"
                    title="LaTeX Source Code Studio"
                  >
                    <Code2 className="size-3.5 text-teal-400 shrink-0" />
                    <span className="truncate">Bridge LaTeX</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* No-results empty state */}
      {filteredTemplates.length === 0 && searchQuery.trim() && (
        <div className="mt-12 flex flex-col items-center justify-center text-center py-16 px-4">
          <div className="size-16 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
            <Search className="size-7 text-slate-400" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 mb-1">
            No templates found for &ldquo;{searchQuery}&rdquo;
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mb-6">
            Try a different keyword — e.g. <span className="font-semibold text-slate-700">"engineer"</span>, <span className="font-semibold text-slate-700">"marketing"</span>, or <span className="font-semibold text-slate-700">"sales"</span>. Search works with typos too!
          </p>
          <button
            onClick={() => setSearchQuery('')}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-xs font-bold text-white hover:bg-slate-700 transition-all"
          >
            Clear search &rarr; Show all templates
          </button>
        </div>
      )}

      {/* Fullscreen Preview Modal */}
      <ResumePreviewModal
        template={previewTemplate}
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        onUseTemplate={(t) => {
          setPreviewTemplate(null)
          handleUseTemplate(t)
        }}
        onOpenLatex={(t) => {
          setPreviewTemplate(null)
          handleOpenLatexEditor(t)
        }}
      />
    </div>
  )

  if (isInsideDashboard) {
    return <DashboardLayout>{content}</DashboardLayout>
  }

  return <SiteLayout>{content}</SiteLayout>
}

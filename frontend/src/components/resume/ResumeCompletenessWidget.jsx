import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, CheckCircle2, AlertTriangle, Plus, ChevronRight, X,
  ShieldCheck, TrendingUp, ArrowRight, Award, FolderOpen, Briefcase,
  GraduationCap, Code, Globe, Heart, BadgeCheck, FileText, Zap
} from 'lucide-react'

// All key sections with their ATS importance and weights
export const RECOMMENDED_SECTIONS = [
  {
    type: 'personal',
    label: 'Contact Information',
    icon: ShieldCheck,
    required: true,
    weight: 20,
    tip: 'Include email, phone, location, and LinkedIn or portfolio.',
    check: (sections) => {
      const p = sections.find(s => s.type === 'personal')
      return Boolean(p && p.name && p.email && p.phone)
    }
  },
  {
    type: 'summary',
    label: 'Professional Summary',
    icon: FileText,
    required: true,
    weight: 15,
    tip: 'A strong 30-50 word summary gives recruiters an instant elevator pitch.',
    check: (sections) => {
      const s = sections.find(sec => sec.type === 'summary')
      return Boolean(s && s.summary && s.summary.trim().length >= 25)
    }
  },
  {
    type: 'experience',
    label: 'Work Experience',
    icon: Briefcase,
    required: true,
    weight: 25,
    tip: 'Add roles with measurable accomplishments and action verbs.',
    check: (sections) => {
      const exps = sections.filter(s => s.type === 'experience')
      return exps.length > 0 && exps.some(e => Boolean(e.role && e.company))
    }
  },
  {
    type: 'education',
    label: 'Education',
    icon: GraduationCap,
    required: true,
    weight: 15,
    tip: 'Highlight your degree, university, GPA, or relevant coursework.',
    check: (sections) => {
      const edus = sections.filter(s => s.type === 'education')
      return edus.length > 0 && edus.some(e => Boolean(e.institution || e.degree))
    }
  },
  {
    type: 'skills',
    label: 'Core Skills',
    icon: Code,
    required: true,
    weight: 15,
    tip: 'Include 6-10 technical and soft skills targeted to your role.',
    check: (sections) => {
      const sk = sections.find(s => s.type === 'skills')
      return Boolean(sk && (sk.technical || sk.soft))
    }
  },
  {
    type: 'projects',
    label: 'Projects',
    icon: FolderOpen,
    required: false,
    weight: 10,
    tip: 'Projects show real-world execution, tech stack, and initiative.',
    check: (sections) => {
      const projs = sections.filter(s => s.type === 'projects')
      return projs.length > 0 && projs.some(p => Boolean(p.projectName))
    }
  },
  {
    type: 'certifications',
    label: 'Certifications',
    icon: BadgeCheck,
    required: false,
    weight: 8,
    tip: 'Industry certifications validate specialized domain expertise.',
    check: (sections) => {
      const certs = sections.filter(s => s.type === 'certifications')
      return certs.length > 0 && certs.some(c => Boolean(c.certName))
    }
  },
  {
    type: 'languages',
    label: 'Languages',
    icon: Globe,
    required: false,
    weight: 5,
    tip: 'Multi-language fluency gives an edge in global teams.',
    check: (sections) => {
      const langs = sections.filter(s => s.type === 'languages')
      return langs.length > 0
    }
  },
  {
    type: 'awards',
    label: 'Awards & Honors',
    icon: Award,
    required: false,
    weight: 5,
    tip: 'Honors, hackathons, and scholarships prove you stand out.',
    check: (sections) => {
      const awds = sections.filter(s => s.type === 'awards' || s.type === 'hackathons' || s.type === 'scholarships')
      return awds.length > 0
    }
  },
  {
    type: 'internships',
    label: 'Internships',
    icon: Zap,
    required: false,
    weight: 8,
    tip: 'Crucial for students and career switchers to showcase hands-on work.',
    check: (sections) => {
      const ints = sections.filter(s => s.type === 'internships')
      return ints.length > 0
    }
  },
  {
    type: 'volunteer',
    label: 'Volunteer Experience',
    icon: Heart,
    required: false,
    weight: 5,
    tip: 'Demonstrates community leadership, empathy, and teamwork.',
    check: (sections) => {
      const vols = sections.filter(s => s.type === 'volunteer')
      return vols.length > 0
    }
  },
]

export function calculateDetailedCompleteness(sections = []) {
  let score = 0
  const completed = []
  const missing = []

  RECOMMENDED_SECTIONS.forEach(item => {
    const isDone = item.check(sections)
    if (isDone) {
      score += item.weight
      completed.push(item)
    } else {
      missing.push(item)
    }
  })

  // Normalize score between 0 and 100
  const finalScore = Math.min(100, Math.round(score))

  let tier = 'Needs Work'
  let tierColor = 'text-rose-400'
  let tierBadge = 'bg-rose-500/20 text-rose-300 border-rose-500/30'

  if (finalScore >= 90) {
    tier = 'All-Star (ATS Ready)'
    tierColor = 'text-emerald-400'
    tierBadge = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
  } else if (finalScore >= 70) {
    tier = 'Competitive'
    tierColor = 'text-blue-400'
    tierBadge = 'bg-blue-500/20 text-blue-300 border-blue-500/30'
  } else if (finalScore >= 45) {
    tier = 'Good Foundation'
    tierColor = 'text-amber-400'
    tierBadge = 'bg-amber-500/20 text-amber-300 border-amber-500/30'
  }

  return {
    score: finalScore,
    tier,
    tierColor,
    tierBadge,
    completed,
    missing,
  }
}

/**
 * Sidebar Compact Meter with continuous animations
 */
export function ResumeCompletenessSidebar({ sections = [], onAddSection, onOpenDetails }) {
  const { score, tier, tierColor, missing } = calculateDetailedCompleteness(sections)

  return (
    <div className="relative rounded-2xl bg-gradient-to-b from-slate-900/90 to-slate-950/90 border border-slate-800/80 p-4 space-y-3 shadow-lg overflow-hidden group">
      {/* Continuous glowing sheen animation across top border */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent animate-pulse" />

      {/* Header with continuous pulsating radar indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500" />
          </span>
          <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
            Resume Health
          </span>
        </div>

        <button
          type="button"
          onClick={onOpenDetails}
          className="text-[11px] font-bold text-blue-400 hover:text-blue-300 hover:underline flex items-center gap-0.5"
        >
          Checklist <ChevronRight className="size-3" />
        </button>
      </div>

      {/* Score Gauge & Animated Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between">
          <span className={`text-2xl font-black tracking-tight ${tierColor}`}>
            {score}%
          </span>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300">
            {tier}
          </span>
        </div>

        {/* Shimmering Animated Bar */}
        <div className="relative h-2.5 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/60">
          <div
            className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-400 to-emerald-400 transition-all duration-700 relative overflow-hidden"
            style={{ width: `${score}%` }}
          >
            {/* Continuous scanning light animation */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
          </div>
        </div>
      </div>

      {/* Missing Sections Instant Quick Add Alert */}
      {missing.length > 0 && (
        <div className="pt-2 border-t border-slate-800/70 space-y-2">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400 font-medium">Missing sections:</span>
            <span className="text-amber-400 font-bold">{missing.length} to add</span>
          </div>

          {/* Quick Add Pills for Missing Important Sections */}
          <div className="flex flex-wrap gap-1">
            {missing.slice(0, 3).map(item => (
              <button
                key={item.type}
                type="button"
                onClick={() => onAddSection(item.type)}
                className="text-[10px] px-2 py-1 rounded-lg bg-blue-950/60 hover:bg-blue-900 border border-blue-800/70 text-blue-200 hover:text-white flex items-center gap-1 transition-all shadow-xs"
              >
                <Plus className="size-2.5" /> {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Full Detailed Completeness Modal & Missing Section Manager
 */
export function ResumeCompletenessModal({ isOpen, onClose, sections = [], onAddSection }) {
  const { score, tier, tierColor, tierBadge, completed, missing } = calculateDetailedCompleteness(sections)

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[88vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative size-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="size-6" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-black text-slate-900 leading-tight">
                  Resume Completeness & ATS Audit
                </h3>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${tierBadge}`}>
                  {tier}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time analysis to maximize recruiter shortlisting and ATS match score.
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Main Animated Score Banner */}
          <div className="relative p-5 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white overflow-hidden shadow-md">
            {/* Background animated circles */}
            <div className="absolute -right-6 -bottom-6 size-32 rounded-full bg-blue-500/10 blur-2xl" />
            <div className="absolute -left-6 -top-6 size-32 rounded-full bg-purple-500/10 blur-2xl" />

            <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-300">
                  Overall Profile Strength
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-4xl font-black tracking-tight text-white">
                    {score}%
                  </span>
                  <span className="text-xs text-slate-300">
                    {score >= 90
                      ? '• Outstanding! Ready to apply to top tier companies.'
                      : score >= 70
                      ? '• Strong profile. Add 1-2 more sections to achieve 100%.'
                      : '• Needs attention. Add missing key sections below.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-bold text-slate-200">
                    {completed.length} Completed
                  </p>
                  <p className="text-[11px] text-amber-300">
                    {missing.length} Missing
                  </p>
                </div>
              </div>
            </div>

            {/* Glowing animated bar */}
            <div className="mt-4 relative h-3 w-full bg-slate-800/90 rounded-full overflow-hidden p-0.5 border border-slate-700/80">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-purple-400 to-emerald-400 transition-all duration-700 relative overflow-hidden"
                style={{ width: `${score}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </div>
            </div>
          </div>

          {/* Missing Sections Section (Highest Priority) */}
          {missing.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="size-3.5" /> Missing Recommended Sections ({missing.length})
                </h4>
                <span className="text-[11px] text-slate-400">
                  Click "+ Add" to include instantly
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {missing.map(item => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.type}
                      className="p-3.5 rounded-2xl border border-rose-200/80 bg-rose-50/30 hover:bg-rose-50/60 transition-all flex flex-col justify-between gap-2.5 group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="size-8 rounded-xl bg-white border border-rose-200 text-rose-600 flex items-center justify-center shrink-0 shadow-xs">
                            <Icon className="size-4" />
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-slate-900 leading-snug">
                              {item.label}
                            </h5>
                            <span className="text-[10px] font-semibold text-rose-600 bg-rose-100/70 px-1.5 py-0.5 rounded">
                              +{item.weight}% Score Boost
                            </span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            onAddSection(item.type)
                            onClose()
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-primary text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1 shrink-0"
                        >
                          <Plus className="size-3" /> Add
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-600 leading-normal">
                        {item.tip}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Completed Sections Checklist */}
          {completed.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                <CheckCircle2 className="size-3.5 text-emerald-600" /> Completed Sections ({completed.length})
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {completed.map(item => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.type}
                      className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/40 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="size-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                          <Icon className="size-3.5" />
                        </div>
                        <span className="font-bold text-slate-800">{item.label}</span>
                      </div>
                      <span className="text-emerald-700 font-bold flex items-center gap-1 text-[11px]">
                        <CheckCircle2 className="size-3.5" /> Included
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ATS Best Practices Guide */}
          <div className="p-4 rounded-2xl border border-blue-100 bg-blue-50/50 space-y-2 text-xs text-blue-950">
            <h5 className="font-bold flex items-center gap-1.5 text-blue-900">
              <ShieldCheck className="size-4 text-blue-600" /> Pro ATS Guidelines for Maximum Shortlisting:
            </h5>
            <ul className="space-y-1 list-disc list-inside text-blue-900/80 text-[11px]">
              <li>Quantify achievements with real numbers (e.g. <i>"Improved query response time by 42%"</i>).</li>
              <li>Keep job descriptions organized in concise bullet points rather than dense paragraphs.</li>
              <li>Include both hard technical proficiencies and communication/leadership skills.</li>
              <li>Always provide clean links to your GitHub, LinkedIn, or portfolio.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <span className="text-xs text-slate-500 font-medium">
            Completeness updates automatically as you type.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 transition-colors shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

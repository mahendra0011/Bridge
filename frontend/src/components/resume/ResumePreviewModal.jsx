import React from 'react'
import { X, Check, Star, ThumbsUp, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react'
import { ResumeCardPreview } from './ResumeCardPreview'

export function ResumePreviewModal({ template, isOpen, onClose, onUseTemplate, onOpenLatex }) {
  if (!isOpen || !template) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div
              className="size-3.5 rounded-full"
              style={{ backgroundColor: template.colorHex }}
            />
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-none">
                {template.name}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {template.category} • ATS Score: <span className="font-semibold text-emerald-600">{template.atsScore}%</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onUseTemplate(template)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-primary hover:bg-primary/90 shadow-sm transition-all"
            >
              Use this template <ArrowRight className="size-3.5" />
            </button>
            {onOpenLatex && (
              <button
                onClick={() => onOpenLatex(template)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-teal-800 bg-teal-50 border border-teal-300 hover:bg-teal-100 shadow-sm transition-all"
              >
                Bridge LaTeX
              </button>
            )}
            <button
              onClick={onClose}
              className="grid size-8 place-items-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-100/60">
          {/* Large Preview View */}
          <div className="md:col-span-8 flex justify-center">
            <div className="w-full max-w-md aspect-[8.5/11] bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden">
              <ResumeCardPreview template={template} isFull={true} />
            </div>
          </div>

          {/* Details & ATS Specs */}
          <div className="md:col-span-4 space-y-4">
            <div className="rounded-2xl bg-white p-5 border border-slate-200/80 shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Template Highlights
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {template.sampleUser.summary}
              </p>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">ATS Compliance:</span>
                  <span className="font-bold text-emerald-600 flex items-center gap-1">
                    <ShieldCheck className="size-3.5" /> {template.atsScore}% Parsed
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Color Profile:</span>
                  <span className="flex items-center gap-1.5 font-medium text-slate-800">
                    <span className="size-3 rounded-full" style={{ backgroundColor: template.colorHex }} />
                    #{template.primaryColor}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">Typography:</span>
                  <span className="font-medium text-slate-800 capitalize">{template.fontFamily}</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-emerald-50 border border-emerald-200/60 p-4 text-emerald-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs text-emerald-800">
                <Check className="size-4 text-emerald-600" /> Recruiter Approved
              </div>
              <p className="text-[11px] text-emerald-700 leading-normal">
                Formatted specifically to navigate Applicant Tracking Systems like Workday, Greenhouse, Taleo, and Lever without formatting corruption.
              </p>
            </div>

            <div className="space-y-2 pt-1">
              <button
                onClick={() => onUseTemplate(template)}
                className="w-full py-3 rounded-2xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/90 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                <span>Use this template (No-Code Form)</span>
                <ArrowRight className="size-3.5" />
              </button>
              {onOpenLatex && (
                <button
                  onClick={() => onOpenLatex(template)}
                  className="w-full py-2.5 rounded-2xl bg-slate-900 text-teal-300 border border-teal-500/40 font-bold text-xs shadow-md hover:bg-slate-800 hover:text-teal-200 active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                  <span>Open in Bridge Resume Editor (LaTeX Code)</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

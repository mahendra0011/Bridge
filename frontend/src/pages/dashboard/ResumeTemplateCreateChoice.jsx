import { useNavigate, Link } from 'react-router-dom'
import { 
  Palette, Code2, Sparkles, ArrowRight, Layout, Sliders, 
  Terminal, ShieldCheck, FileCode, CheckCircle2, ChevronRight,
  BookOpen, Rocket, ArrowLeft, Layers, PenTool
} from 'lucide-react'

export default function ResumeTemplateCreateChoice() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-3">
          <Link
            to="/resume-templates"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs group"
          >
            <ArrowLeft className="size-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Templates</span>
          </Link>
          <span className="text-slate-300">|</span>
          <Link to="/" className="text-xl font-black tracking-tight text-primary">
            BRIDGE
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/resume-templates"
            className="hidden sm:inline-flex text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Templates Gallery
          </Link>
          <Link
            to="/resume-builder"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 bg-primary/10 border border-primary/20 rounded-xl px-3 py-1.5 transition-colors"
          >
            Open Resume Builder
          </Link>
        </div>
      </header>

      {/* Main Choice Body */}
      <main className="flex-1 flex flex-col justify-center max-w-6xl mx-auto w-full px-4 py-8 sm:px-6 lg:px-8 animate-in fade-in duration-300">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-xs font-bold mb-3 shadow-xs">
            <Sparkles className="size-3.5 text-blue-600" />
            <span>Custom Template Studio</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-slate-900">
            How would you like to build your template?
          </h1>
          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            Choose between our interactive <strong>No-Code Visual Studio</strong> or our code-powered <strong>LaTeX Studio</strong> inspired by Overleaf. Both create 100% ATS-friendly, publication-ready templates.
          </p>
        </div>

        {/* 2 Options Full-Screen Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          {/* Card 1: Visual Template Studio */}
          <div 
            onClick={() => navigate('/resume-templates/builder')}
            className="group relative flex flex-col rounded-3xl bg-white border-2 border-slate-200/90 p-8 shadow-sm hover:shadow-2xl hover:border-blue-500 cursor-pointer transition-all duration-300 overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-blue-100/60 to-transparent rounded-bl-full pointer-events-none -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500" />
            
            <div className="flex items-center justify-between mb-6">
              <div className="size-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                <Palette className="size-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold border border-blue-200/60">
                <Sparkles className="size-3 text-blue-600" />
                No-Code Visual Studio
              </span>
            </div>

            <h2 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
              Build Template From Scratch
            </h2>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">
              Design a custom resume template visually with live WYSIWYG feedback. Select layout architectures, custom color schemes, typography, and section styling.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3 mb-8 flex-1">
              <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>5 Layout Architectures:</strong> Split Sidebar, Right Rail, Header Banner, Minimal Clean & Modern Cards</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Custom Color Palettes & Fonts:</strong> Tailor brand colors, background tints, and font pairings</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>ATS Compliance Score Engine:</strong> Real-time automated auditing for optimal parsing</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
                <span><strong>Publish to Community:</strong> Share your template to the gallery so you and others can build resumes with it</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-sm font-bold text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 group-hover:shadow-lg group-hover:shadow-blue-500/30 active:scale-[0.98] transition-all"
            >
              <span>Launch Visual Studio</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {/* Card 2: LaTeX Code Studio (Overleaf Style) */}
          <div 
            onClick={() => navigate('/resume-templates/latex')}
            className="group relative flex flex-col rounded-3xl bg-slate-900 border-2 border-slate-800 p-8 shadow-sm hover:shadow-2xl hover:border-teal-500 cursor-pointer transition-all duration-300 text-white overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-gradient-to-bl from-teal-500/10 to-transparent rounded-bl-full pointer-events-none -mr-6 -mt-6 group-hover:scale-110 transition-transform duration-500" />

            <div className="flex items-center justify-between mb-6">
              <div className="size-14 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600 text-white flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:scale-105 transition-transform duration-300">
                <Code2 className="size-7" />
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-950/80 text-teal-400 text-xs font-bold border border-teal-800">
                <Terminal className="size-3 text-teal-400" />
                Overleaf Style
              </span>
            </div>

            <h2 className="text-2xl font-black text-white mb-2 group-hover:text-teal-400 transition-colors">
              Build from LaTeX Language
            </h2>
            <p className="text-sm text-slate-300 mb-6 leading-relaxed">
              Dual-pane code IDE for writing pure LaTeX resumes with instant compiled PDF preview. Ideal for researchers, software engineers, and LaTeX enthusiasts.
            </p>

            {/* Feature Highlights */}
            <div className="space-y-3 mb-8 flex-1">
              <div className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                <CheckCircle2 className="size-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Dual-Pane Overleaf Workspace:</strong> Code on the left, instant live PDF compile on the right</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                <CheckCircle2 className="size-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>5 Built-in Starters:</strong> Jake's Resume, Deedy CV, Awesome-CV, ModernCV & Academic CV</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                <CheckCircle2 className="size-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Syntax Shortcut Toolbar:</strong> Insert headings, subheadings, bullet items, and links with 1 click</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                <CheckCircle2 className="size-4 text-teal-400 shrink-0 mt-0.5" />
                <span><strong>Instant Compiler & Export:</strong> Live compilation with error log console, PDF download, and community publishing</span>
              </div>
            </div>

            {/* CTA Button */}
            <button
              type="button"
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-teal-500 px-6 py-3.5 text-sm font-bold text-slate-950 shadow-md shadow-teal-500/20 group-hover:bg-teal-400 group-hover:shadow-lg group-hover:shadow-teal-500/30 active:scale-[0.98] transition-all"
            >
              <span>Launch LaTeX Studio</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>

        {/* Bottom Comparison & Info Banner */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xs">
          <div className="flex items-start gap-4">
            <div className="size-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
              <ShieldCheck className="size-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Which option should I choose?</h3>
              <p className="mt-1 text-xs text-slate-600 max-w-xl">
                Choose <strong>Visual Studio</strong> if you prefer an interactive GUI with color pickers and drag-and-drop ease. Choose <strong>LaTeX Studio</strong> if you love exact typographic precision, custom LaTeX packages, or already have a <code className="text-xs bg-slate-100 px-1.5 py-0.5 rounded font-mono text-slate-800">.tex</code> resume.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/resume-templates')}
            className="whitespace-nowrap px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-bold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-all shrink-0"
          >
            Explore 600+ Pre-made Templates
          </button>
        </div>
      </main>
    </div>
  )
}

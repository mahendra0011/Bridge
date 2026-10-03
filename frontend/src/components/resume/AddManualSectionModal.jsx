import React, { useState } from 'react'
import {
  X, Sparkles, Plus, Check, Briefcase, Award, GraduationCap, Code,
  Globe, Heart, Shield, BookOpen, Microscope, Zap, FolderOpen, Star,
  Users, Lightbulb, FileText, CheckCircle2, Bookmark, Layers, ChevronRight
} from 'lucide-react'

export const CUSTOM_LAYOUT_OPTIONS = [
  {
    id: 'experience',
    title: 'Role & Organization Style',
    subtitle: 'Best for speaking talks, leadership roles, consulting, or clubs',
    preview: 'Role / Title • Organization • Date Range • Bullet Points',
    fields: [
      { key: 'customTitle', label: 'Role / Title', placeholder: 'e.g. Keynote Speaker or Team Lead' },
      { key: 'customSubtitle', label: 'Organization / Context', placeholder: 'e.g. PyCon 2024 or Robotics Club' },
      { key: 'customDate', label: 'Date Range / Year', placeholder: 'e.g. 2023 - Present' },
      { key: 'customLocation', label: 'Location / Venue (optional)', placeholder: 'e.g. San Francisco, CA' },
      { key: 'customContent', label: 'Highlights / Description', type: 'textarea', placeholder: 'Key achievements or points (one per line)...' }
    ]
  },
  {
    id: 'project',
    title: 'Project & Portfolio Showcase',
    subtitle: 'Best for apps, open source repos, creative works, or patents',
    preview: 'Project Name • Tech Stack / Tags • Live Link • Description',
    fields: [
      { key: 'customTitle', label: 'Project / Asset Name', placeholder: 'e.g. Autonomous Drone Controller' },
      { key: 'customSubtitle', label: 'Technologies / Domain', placeholder: 'e.g. ROS, C++, Computer Vision' },
      { key: 'customLink', label: 'URL / Reference Link', placeholder: 'https://github.com/yourname/project' },
      { key: 'customDate', label: 'Date / Duration', placeholder: 'e.g. 6 Months' },
      { key: 'customContent', label: 'Description & Features', type: 'textarea', placeholder: 'Describe what you built and the impact...' }
    ]
  },
  {
    id: 'keyvalue',
    title: 'Award & Credential Style',
    subtitle: 'Best for honors, grants, scholarships, test scores, or licenses',
    preview: 'Honor Title • Issuer / Authority • Date • Details',
    fields: [
      { key: 'customTitle', label: 'Title / Award / Grant', placeholder: 'e.g. National Merit Scholar' },
      { key: 'customSubtitle', label: 'Issuer / Authority', placeholder: 'e.g. National Science Foundation' },
      { key: 'customDate', label: 'Year / Date', placeholder: 'e.g. 2023' },
      { key: 'customContent', label: 'Details / Criteria', type: 'textarea', placeholder: 'Awarded for placing in top 1% nationwide...' }
    ]
  },
  {
    id: 'bullet',
    title: 'Simple Bullets & Free-Form',
    subtitle: 'Best for executive highlights, media mentions, or custom lists',
    preview: 'Heading • Simple bulleted lines or paragraph',
    fields: [
      { key: 'customTitle', label: 'Entry Heading', placeholder: 'e.g. Featured in TechCrunch' },
      { key: 'customContent', label: 'Content / Bullet Points', type: 'textarea', placeholder: 'Write your notes or bullet points here...' }
    ]
  },
  {
    id: 'tags',
    title: 'Tag Cloud & Categorized Badges',
    subtitle: 'Best for custom toolkits, niche competencies, or passions',
    preview: 'Category Name • Comma separated pills',
    fields: [
      { key: 'customTitle', label: 'Category Label', placeholder: 'e.g. Cloud & DevOps Tools' },
      { key: 'customContent', label: 'Items / Badges (comma separated)', type: 'textarea', placeholder: 'Docker, Kubernetes, Terraform, AWS, Helm' }
    ]
  }
]

export const AVAILABLE_ICONS = [
  { name: 'Sparkles', icon: Sparkles },
  { name: 'Award', icon: Award },
  { name: 'Trophy', icon: Star },
  { name: 'Code', icon: Code },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'GraduationCap', icon: GraduationCap },
  { name: 'Globe', icon: Globe },
  { name: 'Heart', icon: Heart },
  { name: 'Shield', icon: Shield },
  { name: 'BookOpen', icon: BookOpen },
  { name: 'Microscope', icon: Microscope },
  { name: 'Zap', icon: Zap },
  { name: 'FolderOpen', icon: FolderOpen },
  { name: 'Lightbulb', icon: Lightbulb },
  { name: 'Users', icon: Users },
  { name: 'Bookmark', icon: Bookmark },
  { name: 'Layers', icon: Layers },
  { name: 'FileText', icon: FileText }
]

export const PRESET_IDEAS = [
  { title: 'Patents & Inventions', layout: 'project', icon: 'Lightbulb' },
  { title: 'Open Source & GitHub', layout: 'project', icon: 'Code' },
  { title: 'Speaking & Conferences', layout: 'experience', icon: 'Users' },
  { title: 'Key Career Milestones', layout: 'bullet', icon: 'Award' },
  { title: 'Media & Press Coverage', layout: 'bullet', icon: 'Globe' },
  { title: 'Clubs & Leadership', layout: 'experience', icon: 'Briefcase' },
  { title: 'Hobbies & Interests', layout: 'tags', icon: 'Heart' },
  { title: 'Military Experience', layout: 'experience', icon: 'Shield' }
]

export function AddManualSectionModal({ isOpen, onClose, onCreateCustomSection }) {
  const [title, setTitle] = useState('')
  const [layoutId, setLayoutId] = useState('experience')
  const [selectedIcon, setSelectedIcon] = useState('Sparkles')
  const [isRepeatable, setIsRepeatable] = useState(true)

  // Initial entry values
  const [initialData, setInitialData] = useState({})

  if (!isOpen) return null

  const selectedLayout = CUSTOM_LAYOUT_OPTIONS.find(l => l.id === layoutId) || CUSTOM_LAYOUT_OPTIONS[0]
  const IconComponent = AVAILABLE_ICONS.find(i => i.name === selectedIcon)?.icon || Sparkles

  const handleApplyPreset = (preset) => {
    setTitle(preset.title)
    setLayoutId(preset.layout)
    setSelectedIcon(preset.icon)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return

    const sanitizedKey = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '')
    const customType = `custom_${sanitizedKey || 'section'}_${Date.now().toString(36).slice(-4)}`

    // Build the custom section definition
    const sectionConfig = {
      type: customType,
      customSectionHeading: title.trim(),
      customLayout: layoutId,
      customIcon: selectedIcon,
      repeatable: isRepeatable,
      fields: selectedLayout.fields
    }

    onCreateCustomSection(sectionConfig, initialData)
    onClose()

    // Reset form
    setTitle('')
    setInitialData({})
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-in fade-in">
      <div
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md">
              <IconComponent className="size-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900 leading-tight">
                Create a Custom Section Manually
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Design any unique resume section with your own title, layout fields, and icon.
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

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Preset Ideas */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
              ⚡ Quick Inspiration Presets (Click to Auto-fill):
            </label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_IDEAS.map(p => (
                <button
                  key={p.title}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`text-xs px-2.5 py-1 rounded-xl border transition-all ${
                    title === p.title
                      ? 'bg-primary text-white border-primary font-bold shadow-xs'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                  }`}
                >
                  + {p.title}
                </button>
              ))}
            </div>
          </div>

          {/* Section Heading Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>Section Heading / Title *</span>
              <span className="text-[10px] text-slate-400 font-normal">Will appear as the section title on your resume & PDF</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="e.g. Patents & Inventions, Open Source Projects, Speaking Engagements..."
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
            />
          </div>

          {/* Layout Format Style Picker */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">
              Choose Layout Format Style
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {CUSTOM_LAYOUT_OPTIONS.map(layout => {
                const isSelected = layout.id === layoutId
                return (
                  <button
                    key={layout.id}
                    type="button"
                    onClick={() => setLayoutId(layout.id)}
                    className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-1.5 ${
                      isSelected
                        ? 'border-primary bg-primary/5 ring-1 ring-primary/30 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold ${isSelected ? 'text-primary' : 'text-slate-900'}`}>
                        {layout.title}
                      </span>
                      {isSelected && <Check className="size-4 text-primary" />}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">{layout.subtitle}</p>
                    <span className="text-[10px] text-slate-400 font-mono bg-slate-100/80 px-2 py-0.5 rounded mt-1">
                      {layout.preview}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Icon Selector Grid */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-800">
              Select Section Icon
            </label>
            <div className="grid grid-cols-6 sm:grid-cols-9 gap-2">
              {AVAILABLE_ICONS.map(({ name, icon: Icon }) => {
                const isSelected = selectedIcon === name
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setSelectedIcon(name)}
                    className={`size-10 rounded-xl border grid place-items-center transition-all ${
                      isSelected
                        ? 'border-primary bg-primary text-white shadow-sm scale-105'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                    title={name}
                  >
                    <Icon className="size-4" />
                  </button>
                )
              })}
            </div>
          </div>

          {/* Multiple Entries Toggle */}
          <div className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Repeatable Section</p>
              <p className="text-[11px] text-slate-500">Allow adding multiple entries under this heading (e.g. 3 patents or 5 talks)</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isRepeatable}
                onChange={e => setIsRepeatable(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          {/* Initial Entry Fields (Optional Preview / Input) */}
          <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">
                First Entry Details (Optional — can edit later):
              </span>
              <span className="text-[10px] text-slate-400">Preview of your fields</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {selectedLayout.fields.map(f => (
                <div key={f.key} className={f.type === 'textarea' ? 'sm:col-span-2' : ''}>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">{f.label}</label>
                  {f.type === 'textarea' ? (
                    <textarea
                      rows={2}
                      value={initialData[f.key] || ''}
                      onChange={e => setInitialData({ ...initialData, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  ) : (
                    <input
                      type="text"
                      value={initialData[f.key] || ''}
                      onChange={e => setInitialData({ ...initialData, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs outline-none focus:border-primary"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-xs hover:bg-primary/95 shadow-md disabled:opacity-50 transition-all flex items-center gap-1.5"
          >
            <Plus className="size-3.5" /> Create & Add Section
          </button>
        </div>
      </div>
    </div>
  )
}

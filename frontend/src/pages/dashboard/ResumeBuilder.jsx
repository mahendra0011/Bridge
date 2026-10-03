import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText, Plus, Trash2, Eye, Download, Save, Loader2, ChevronDown,
  Code, Briefcase, GraduationCap, Award, BookOpen, User, FolderOpen,
  BadgeCheck, Globe, Heart, Copy, Settings, X, Check, AlertCircle,
  FileDown, FileType, ArrowUp, ArrowDown, Users, Wrench, Zap, Shield,
  Github, PlusCircle, DollarSign, Clock, Sparkles, ExternalLink,
  ChevronLeft, ChevronRight, ArrowLeft, ArrowRight, Upload, CheckCircle2,
  TrendingUp, ShieldCheck, Palette, RefreshCw, ZoomIn, Search, Layers, PenTool,
  Microscope
} from 'lucide-react'
import { api } from '@/lib/api'
import Fuse from 'fuse.js'
import { toast } from 'sonner'
import { RESUME_TEMPLATES, getTemplateById } from '@/data/resumeTemplates'
import { ALL_SECTIONS, SECTION_CATEGORIES, createSection } from '@/data/allSections'
import { ResumeLivePreview } from '@/components/resume/ResumeLivePreview'
import { AddSectionModal } from '@/components/resume/AddSectionModal'
import { ResumeCompletenessSidebar, ResumeCompletenessModal, calculateDetailedCompleteness } from '@/components/resume/ResumeCompletenessWidget'
import { AddManualSectionModal, CUSTOM_LAYOUT_OPTIONS, AVAILABLE_ICONS } from '@/components/resume/AddManualSectionModal'
import { useAuth } from '@/context/AuthContext'
import { parseResumeRawText, classifyLinks } from '@/utils/smartResumeParser'

export default function ResumeBuilder() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateParam = searchParams.get('template')

  // Resumes and content state
  const [resumes, setResumes] = useState([])
  const [activeResumeId, setActiveResumeId] = useState(null)
  const [sections, setSections] = useState([])
  const [visibleSections, setVisibleSections] = useState(['personal', 'summary', 'experience', 'education', 'skills', 'projects'])
  const [sectionOrder, setSectionOrder] = useState([])
  const [resumeTitle, setResumeTitle] = useState('My Resume')

  // Template and styling settings
  const [settings, setSettings] = useState({
    templateId: 'classic-professional',
    fontFamily: 'serif',
    fontSize: '11pt',
    paperSize: 'letterpaper',
    primaryColor: '0E5484',
    spacing: 'normal',
    showProfilePhoto: false,
    sectionSpacing: 'normal',
  })

  // UI state
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [autoSaveTimer, setAutoSaveTimer] = useState(null)
  const [showTemplatePicker, setShowTemplatePicker] = useState(false)
  const [tplPickerQuery, setTplPickerQuery] = useState('')
  const [showAddSectionModal, setShowAddSectionModal] = useState(false)
  const [showManualSectionModal, setShowManualSectionModal] = useState(false)
  const [showCompletenessModal, setShowCompletenessModal] = useState(false)
  const [showFullscreenPreview, setShowFullscreenPreview] = useState(false)
  const [viewMode, setViewMode] = useState('guided') // 'guided' | 'all'
  const [targetStepType, setTargetStepType] = useState(null)
  const [catalogSearch, setCatalogSearch] = useState('')
  const [catalogCategory, setCatalogCategory] = useState('All')

  // PDF compiling state
  const [pdfUrl, setPdfUrl] = useState(null)
  const [pdfBlob, setPdfBlob] = useState(null)
  const [compiling, setCompiling] = useState(false)
  const [compileError, setCompileError] = useState(null)
  const [exporting, setExporting] = useState(false)

  // Optional contact fields toggles
  const [showLinkedin, setShowLinkedin] = useState(false)
  const [showGithub, setShowGithub] = useState(false)
  const [showWebsite, setShowWebsite] = useState(false)

  // Smart Auto-Fill & PDF Parse State
  const [showAutoFillModal, setShowAutoFillModal] = useState(false)
  const [autoFillText, setAutoFillText] = useState('')
  const [autoFillTab, setAutoFillTab] = useState('pdf') // 'pdf' | 'paste' | 'sync'
  const [detectedData, setDetectedData] = useState(null)
  const [extractingFile, setExtractingFile] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [loadingSync, setLoadingSync] = useState(false)

  // Core standard sections definition map
  const CORE_STEP_DEFS = useMemo(() => ({
    personal: {
      id: 'heading',
      type: 'personal',
      label: 'Heading',
      icon: User,
      title: "What's the best way for employers to contact you?",
      subtitle: "We suggest including an email, phone number, and location."
    },
    experience: {
      id: 'experience',
      type: 'experience',
      label: 'Work history',
      icon: Briefcase,
      title: "Tell us about your work experience",
      subtitle: "Start with your most recent role and highlight key responsibilities."
    },
    education: {
      id: 'education',
      type: 'education',
      label: 'Education',
      icon: GraduationCap,
      title: "What is your educational background?",
      subtitle: "Add your degrees, institutions, and academic achievements."
    },
    skills: {
      id: 'skills',
      type: 'skills',
      label: 'Skills',
      icon: Code,
      title: "Highlight your top professional skills",
      subtitle: "Add technical competencies, software tools, and interpersonal skills."
    },
    summary: {
      id: 'summary',
      type: 'summary',
      label: 'Summary',
      icon: FileText,
      title: "Write a brief professional summary",
      subtitle: "Recruiters love a 2-3 sentence overview of your career and strengths."
    }
  }), [])

  // Resolve section config for pre-built or manual custom sections
  const getSectionConfig = useCallback((type, sec) => {
    if (ALL_SECTIONS[type]) return ALL_SECTIONS[type]
    const targetSec = sec || sections.find(s => s.type === type)
    const iconObj = AVAILABLE_ICONS.find(i => i.name === targetSec?.customIcon)
    const Icon = iconObj?.icon || Sparkles
    const layout = CUSTOM_LAYOUT_OPTIONS.find(l => l.id === targetSec?.customLayout) || CUSTOM_LAYOUT_OPTIONS[0]
    return {
      label: targetSec?.customSectionHeading || targetSec?.customSectionTitle || 'Custom Section',
      icon: Icon,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      repeatable: targetSec?.repeatable !== false,
      fields: layout.fields
    }
  }, [sections])

  // Compute the ordered active types list based strictly on sections and sectionOrder
  const orderedActiveTypes = useMemo(() => {
    const typesInSections = Array.from(new Set(sections.map(s => s.type)))
    const activeOrder = (sectionOrder && sectionOrder.length > 0) ? sectionOrder : []
    const ordered = activeOrder.filter(t => typesInSections.includes(t))
    typesInSections.forEach(t => {
      if (!ordered.includes(t)) ordered.push(t)
    })
    return ordered
  }, [sections, sectionOrder])

  // Build steps array dynamically respecting shifted order and active sections
  const dynamicSteps = useMemo(() => {
    const contentSteps = orderedActiveTypes.map(type => {
      if (CORE_STEP_DEFS[type]) {
        return {
          ...CORE_STEP_DEFS[type],
          isCore: true,
          isContentSection: true
        }
      }
      const config = getSectionConfig(type)
      return {
        id: `section-${type}`,
        type,
        label: config.label || type,
        icon: config.icon || Sparkles,
        title: config.label || type,
        subtitle: `Add and manage your ${config.label || type} entries.`,
        isCustomSection: true,
        isContentSection: true
      }
    })

    return [
      ...contentSteps,
      { id: 'add-sections', type: 'add-sections', label: 'Add Sections', icon: Plus, title: "Add more sections to your resume", subtitle: "Choose from 35+ professional sections to enrich your resume." },
      { id: 'finalize', type: 'finalize', label: 'Finalize & Export', icon: Download, title: "Review & download your resume", subtitle: "Inspect ATS compatibility, customize formatting, or export in PDF." },
    ]
  }, [orderedActiveTypes, CORE_STEP_DEFS, getSectionConfig])

  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const currentStep = dynamicSteps[currentStepIndex] || dynamicSteps[0] || {
    id: 'add-sections',
    type: 'add-sections',
    label: 'Add Sections',
    icon: Plus,
    title: "Add more sections to your resume",
    subtitle: "Choose from 35+ professional sections to enrich your resume."
  }

  // Ensure currentStepIndex stays within bounds when sections are deleted
  useEffect(() => {
    if (dynamicSteps.length > 0 && currentStepIndex >= dynamicSteps.length) {
      setCurrentStepIndex(Math.max(0, dynamicSteps.length - 1))
    }
  }, [dynamicSteps.length, currentStepIndex])

  // Automatically switch step or scroll to newly added section
  useEffect(() => {
    if (targetStepType) {
      const idx = dynamicSteps.findIndex(st => st.type === targetStepType)
      if (idx !== -1) {
        setCurrentStepIndex(idx)
      }
      setTimeout(() => {
        const anchor = document.getElementById(`section-anchor-${targetStepType}`)
        if (anchor) {
          anchor.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      setTargetStepType(null)
    }
  }, [dynamicSteps, targetStepType])

  // Load resumes on mount / user change
  useEffect(() => {
    loadResumes()
  }, [user])

  // Clean up PDF blob url
  useEffect(() => {
    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
    }
  }, [pdfUrl])

  // Handle template param from URL: when clicked "Use this template", apply that template directly with clean blank fields
  useEffect(() => {
    if (templateParam) {
      initDefaultSections()
    }
  }, [templateParam])

  const loadResumes = async () => {
    // If user explicitly chose a template via "Use this template" URL (?template=...)
    // Initialize clean sections for this specific template!
    if (templateParam) {
      initDefaultSections()
      setLoading(false)
      return
    }

    if (!user) {
      try {
        const localDraft = localStorage.getItem('bridge_resume_draft')
        if (localDraft) {
          const parsed = JSON.parse(localDraft)
          if (parsed.sections?.length) {
            setSections(parsed.sections)
            setVisibleSections(parsed.visibleSections || parsed.sections.map(s => s.type))
            setSectionOrder(parsed.sectionOrder || parsed.sections.map(s => s.id))
            setResumeTitle(parsed.title || 'My Resume')
            if (parsed.settings) {
              setSettings(parsed.settings)
            }
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.error('Error reading local resume draft:', err)
      }
      initDefaultSections()
      setLoading(false)
      return
    }

    try {
      const data = await api.get('/api/student/resume-builder')
      if (data?.resumes?.length) {
        setResumes(data.resumes)
        const latest = data.resumes[0]
        setActiveResumeId(latest._id)
        await loadResume(latest._id)
      } else {
        initDefaultSections()
      }
    } catch {
      initDefaultSections()
    } finally {
      setLoading(false)
    }
  }

  const initDefaultSections = () => {
    const tpl = getTemplateById(templateParam || 'classic-professional')

    // Clean blank sections with no demo dummy info so user can type their own details
    const personalSec = {
      ...createSection('personal'),
      name: '',
      professionalTitle: '',
      email: '',
      phone: '',
      location: '',
      linkedin: '',
      github: '',
      portfolio: '',
      website: '',
    }

    const summarySec = {
      ...createSection('summary'),
      summary: '',
    }

    const expSec = {
      ...createSection('experience'),
      role: '',
      company: '',
      startDate: '',
      endDate: '',
      current: false,
      description: '',
      technologiesUsed: '',
    }

    const eduSec = {
      ...createSection('education'),
      degree: '',
      institution: '',
      startYear: '',
      endYear: '',
      gpa: '',
    }

    const skillsSec = {
      ...createSection('skills'),
      technical: '',
      soft: '',
    }

    const projectSec = {
      ...createSection('projects'),
      projectName: '',
      projectType: '',
      projectDescription: '',
      projectTechnologies: '',
      projectRole: '',
      projectDuration: '',
    }

    setSections([personalSec, summarySec, expSec, eduSec, skillsSec, projectSec])
    setVisibleSections(['personal', 'summary', 'experience', 'education', 'skills', 'projects'])
    setSectionOrder(['personal', 'summary', 'experience', 'education', 'skills', 'projects'])
    setResumeTitle(`Resume - ${tpl.shortName || tpl.name}`)
    setSettings(prev => ({
      ...prev,
      templateId: tpl.id,
      primaryColor: tpl.primaryColor,
      fontFamily: tpl.fontFamily || prev.fontFamily,
    }))
  }

  const loadResume = async (id) => {
    try {
      const data = await api.get(`/api/student/resume-builder/${id}`)
      if (data?.resume) {
        setSections(data.resume.sections || [])
        setVisibleSections(data.resume.visibleSections || ['personal', 'summary', 'experience', 'education', 'skills', 'projects'])
        setSectionOrder(data.resume.sectionOrder || [])
        setResumeTitle(data.resume.title || 'My Resume')
        if (data.resume.settings) {
          const activeTpl = templateParam ? getTemplateById(templateParam) : null
          setSettings(prev => ({
            ...prev,
            ...data.resume.settings,
            ...(activeTpl ? {
              templateId: activeTpl.id,
              primaryColor: activeTpl.primaryColor,
              fontFamily: activeTpl.fontFamily || data.resume.settings.fontFamily
            } : {})
          }))
        }
      }
    } catch {
      toast.error('Failed to load resume')
    }
  }

  // Save handler
  const handleSave = useCallback(async (showToast = true) => {
    setSaving(true)
    try {
      const payload = { resumeId: activeResumeId, title: resumeTitle, sections, visibleSections, sectionOrder, settings }

      // Always save to localStorage as local draft backup
      try {
        localStorage.setItem('bridge_resume_draft', JSON.stringify({
          title: resumeTitle,
          sections,
          visibleSections,
          sectionOrder,
          settings,
          savedAt: new Date().toISOString()
        }))
      } catch (e) {
        console.error('Local backup save error:', e)
      }

      if (!user) {
        setLastSaved(new Date())
        if (showToast) {
          toast.success('Resume draft saved locally on this browser!', {
            description: 'Sign in to sync your resumes securely across all your devices.',
            action: {
              label: 'Sign in',
              onClick: () => navigate('/login')
            }
          })
        }
        return
      }

      const data = await api.post('/api/student/resume-builder', payload)
      if (data?.resume) {
        if (!activeResumeId) {
          setActiveResumeId(data.resume._id)
          setResumes(prev => {
            const exists = prev.find(r => r._id === data.resume._id)
            if (exists) return prev
            return [{ _id: data.resume._id, title: data.resume.title, updatedAt: data.resume.updatedAt }, ...prev]
          })
        } else {
          setResumes(prev => prev.map(r => r._id === data.resume._id ? { ...r, title: data.resume.title, updatedAt: data.resume.updatedAt } : r))
        }
        setLastSaved(new Date())
        if (showToast) toast.success('Resume saved successfully!')
      }
    } catch (err) {
      if (showToast) toast.error(err.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }, [activeResumeId, resumeTitle, sections, visibleSections, sectionOrder, settings, user, navigate])

  // Auto-save timer
  useEffect(() => {
    if (autoSaveTimer) clearTimeout(autoSaveTimer)
    const timer = setTimeout(() => {
      if (activeResumeId) handleSave(false)
    }, 25000)
    setAutoSaveTimer(timer)
    return () => clearTimeout(timer)
  }, [sections, visibleSections, sectionOrder, settings, resumeTitle, activeResumeId, handleSave])

  // Section modification helpers
  const updateSection = (id, data) => setSections(s => s.map(sec => sec.id === id ? { ...sec, ...data } : sec))

  const handleAddSectionType = (type) => {
    let newSection
    if (ALL_SECTIONS[type]) {
      newSection = createSection(type)
    } else {
      const existing = sections.find(s => s.type === type)
      newSection = {
        id: `${type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type,
        customSectionHeading: existing?.customSectionHeading || 'Custom Section',
        customLayout: existing?.customLayout || 'experience',
        customIcon: existing?.customIcon || 'Sparkles',
        repeatable: existing?.repeatable !== false,
      }
    }

    setSections(s => [...s, newSection])
    if (!visibleSections.includes(type)) setVisibleSections(v => [...v, type])
    if (!sectionOrder.includes(type)) setSectionOrder(o => [...o, type])

    const config = CORE_STEP_DEFS[type] || getSectionConfig(type, newSection)
    toast.success(`Added "${config.label || type}" to your resume!`)
    setShowAddSectionModal(false)

    // Trigger immediate switch to the newly created section step
    setTargetStepType(type)
  }

  const handleCreateCustomSection = (config, initialData = {}) => {
    const newEntry = {
      id: `${config.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type: config.type,
      customSectionHeading: config.customSectionHeading,
      customLayout: config.customLayout,
      customIcon: config.customIcon,
      repeatable: config.repeatable !== false,
      isCustomSection: true,
      ...initialData,
    }

    setSections(s => [...s, newEntry])
    if (!visibleSections.includes(config.type)) setVisibleSections(v => [...v, config.type])
    if (!sectionOrder.includes(config.type)) setSectionOrder(o => [...o, config.type])

    toast.success(`Created custom section "${config.customSectionHeading}"!`)
    setTargetStepType(config.type)
  }

  // Remove single entry by id
  const removeSection = (id) => {
    const sec = sections.find(s => s.id === id)
    if (!sec) return
    const remainingOfType = sections.filter(s => s.type === sec.type && s.id !== id)
    setSections(s => s.filter(entry => entry.id !== id))

    if (remainingOfType.length === 0) {
      // Entire section type is now empty and removed
      setSectionOrder(prev => prev.filter(t => t !== sec.type))
      setVisibleSections(prev => prev.filter(t => t !== sec.type))
      const label = CORE_STEP_DEFS[sec.type]?.label || sec.customSectionHeading || ALL_SECTIONS[sec.type]?.label || sec.type
      toast.info(`Removed "${label}" section`)

      // If user was on this step, navigate safely
      const stepIdx = dynamicSteps.findIndex(s => s.type === sec.type)
      if (stepIdx !== -1 && currentStepIndex >= stepIdx) {
        setCurrentStepIndex(prev => Math.max(0, prev - 1))
      }
    } else {
      toast.info('Entry removed')
    }
  }

  // Delete entire section (all entries of this type)
  const deleteWholeSection = (type, label) => {
    const displayLabel = label || CORE_STEP_DEFS[type]?.label || getSectionConfig(type)?.label || type

    setSections(prev => prev.filter(s => s.type !== type))
    setSectionOrder(prev => prev.filter(t => t !== type))
    setVisibleSections(prev => prev.filter(t => t !== type))

    toast.info(`Deleted "${displayLabel}" section`)

    const stepIdx = dynamicSteps.findIndex(s => s.type === type)
    if (stepIdx !== -1 && currentStepIndex >= stepIdx) {
      setCurrentStepIndex(prev => Math.max(0, prev - 1))
    }
  }

  // Shift section up or down in order
  const shiftSection = (type, direction) => {
    const currentIdx = orderedActiveTypes.indexOf(type)
    if (currentIdx === -1) return
    const newIdx = currentIdx + direction
    if (newIdx < 0 || newIdx >= orderedActiveTypes.length) return

    const newOrder = [...orderedActiveTypes]
    const [moved] = newOrder.splice(currentIdx, 1)
    newOrder.splice(newIdx, 0, moved)

    setSectionOrder(newOrder)

    // Reorder sections array by new type order
    const reorderedSections = []
    newOrder.forEach(t => {
      reorderedSections.push(...sections.filter(s => s.type === t))
    })
    const placedIds = new Set(reorderedSections.map(s => s.id))
    sections.forEach(s => {
      if (!placedIds.has(s.id)) reorderedSections.push(s)
    })
    setSections(reorderedSections)

    // Keep current step pointing to the shifted section
    setCurrentStepIndex(newIdx)

    const label = CORE_STEP_DEFS[type]?.label || getSectionConfig(type)?.label || type
    toast.success(`Moved "${label}" ${direction < 0 ? 'up ↑' : 'down ↓'}`)
  }

  const duplicateSection = (id) => {
    const original = sections.find(s => s.id === id)
    if (!original) return
    const copy = {
      ...(ALL_SECTIONS[original.type] ? createSection(original.type) : {}),
      ...original,
      id: `${original.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    }
    setSections(s => [...s, copy])
    toast.success('Entry duplicated!')
  }

  const moveSection = (id, direction) => {
    const idx = sections.findIndex(s => s.id === id)
    if (idx === -1) return
    const newSections = [...sections]
    const newIdx = idx + direction
    if (newIdx < 0 || newIdx >= newSections.length) return
    ;[newSections[idx], newSections[newIdx]] = [newSections[newIdx], newSections[idx]]
    setSections(newSections)
  }

  // Smart Auto-Fill Handlers
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedFileName(file.name)
    setExtractingFile(true)

    try {
      const ext = file.name.split('.').pop().toLowerCase()
      if (ext === 'txt' || ext === 'md' || ext === 'json') {
        const text = await file.text()
        setAutoFillText(text)
        const parsed = parseResumeRawText(text)
        setDetectedData(parsed)
        toast.success(`Extracted text from ${file.name}`)
      } else {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/resume-templates/extract-file', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to extract text from PDF')

        if (data.text) {
          setAutoFillText(data.text)
          const parsed = parseResumeRawText(data.text)
          setDetectedData(parsed)
          toast.success(`Successfully parsed PDF "${file.name}"!`)
        } else {
          toast.warning('PDF has no extractable text. If it is a scanned image, please paste text instead.')
        }
      }
    } catch (err) {
      console.error('PDF upload error:', err)
      toast.error(err.message || 'Failed to read PDF file')
    } finally {
      setExtractingFile(false)
    }
  }

  const handleTextChange = (text) => {
    setAutoFillText(text)
    if (!text || text.trim().length < 15) {
      setDetectedData(null)
      return
    }
    const parsed = parseResumeRawText(text)
    setDetectedData(parsed)
  }

  const handleLoadSampleLinkedIn = () => {
    const sample = `Saanvi Patel
Lead Full Stack Engineer | Cloud Architect
Mumbai, Maharashtra, India · saanvi.patel@example.com · +91 98200 12345
https://linkedin.com/in/saanvipatel
https://github.com/saanvipatel
https://saanvipatel.dev
https://leetcode.com/saanvipatel
https://medium.com/@saanvipatel

Professional Summary
Results-driven software engineer with 5+ years designing scalable cloud architectures, high-performance web applications, and resilient microservices. Adept at cross-functional leadership, clean code architecture, and modern DevOps.

Work Experience
Senior Software Engineer
Zomato Digital · Jun 2022 - Present
• Engineered mission-critical order dispatch engine serving 1.2M daily food deliveries with 99.98% reliability.
• Reduced API response latency by 38% through Redis caching layers and PostgreSQL query optimizations.
• Led sprint planning, code reviews, and mentored 4 junior software engineers across cross-functional squads.

Full Stack Developer
Swiggy Tech Labs · Aug 2020 - May 2022
• Developed interactive customer web portals using React, Redux Toolkit, and Tailwind CSS.
• Automated CI/CD deployment pipelines using GitHub Actions, reducing deployment time from 2 hours to 8 minutes.

Education
Indian Institute of Technology Bombay (IIT Bombay)
B.Tech in Computer Science and Engineering · 2016 - 2020 · 8.9 CGPA

Technical Skills
JavaScript, TypeScript, Python, Go, C++, SQL, HTML, CSS, React, Next.js, Node.js, Express, Docker, Kubernetes, AWS, PostgreSQL, MongoDB, Redis, GraphQL, Git, Agile Leadership, Problem Solving`
    setAutoFillText(sample)
    const parsed = parseResumeRawText(sample)
    setDetectedData(parsed)
    toast.info('Sample profile loaded with 5 links and full work history!')
  }

  const handleSyncStudentProfile = async () => {
    setLoadingSync(true)
    try {
      const res = await api.get('/api/student/profile')
      if (res?.profile) {
        const p = res.profile
        const fullName = `${res.user?.firstName || ''} ${res.user?.lastName || ''}`.trim() || p.fullName || 'Student Candidate'
        const rawContent = `
${fullName}
${p.headline || p.targetRole || 'Software Engineer'}
${p.location || ''} · ${res.user?.email || p.email || ''} · ${p.phone || ''}
${p.linkedin || ''}
${p.github || ''}
${p.portfolio || ''}

Summary
${p.bio || ''}

Experience
${(p.experience || []).map(e => `${e.title || e.role}\n${e.company}\n${e.startDate ? new Date(e.startDate).getFullYear() : ''} - ${e.current ? 'Present' : (e.endDate ? new Date(e.endDate).getFullYear() : '')}\n• ${e.description || ''}`).join('\n\n')}

Education
${(p.education || []).map(ed => `${ed.institution || ed.school}\n${ed.degree || ''}\n${ed.startYear || ''} - ${ed.endYear || ''}`).join('\n\n')}

Skills
${(p.skills || []).join(', ')}
`
        setAutoFillText(rawContent.trim())
        const parsed = parseResumeRawText(rawContent)
        setDetectedData(parsed)
        toast.success('Synced profile from Bridge!')
      }
    } catch (_) {
      toast.warning('Could not load profile. Please paste text or upload a PDF.')
    } finally {
      setLoadingSync(false)
    }
  }

  const handleApplySmartAutoFill = (parsedData) => {
    if (!parsedData) return

    let updatedSections = [...sections]

    // 1. Personal & Contact Placeholders
    const personalIdx = updatedSections.findIndex(s => s.type === 'personal')
    const personalUpdates = {
      name: parsedData.personal.name || 'Candidate',
      professionalTitle: parsedData.personal.professionalTitle || 'Software Engineer',
      email: parsedData.personal.email || '',
      phone: parsedData.personal.phone || '',
      location: parsedData.personal.location || '',
      linkedin: parsedData.personal.linkedin || '',
      github: parsedData.personal.github || '',
      portfolio: parsedData.personal.portfolio || '',
      website: parsedData.personal.website || ''
    }

    if (parsedData.personal.linkedin) setShowLinkedin(true)
    if (parsedData.personal.github) setShowGithub(true)
    if (parsedData.personal.website || parsedData.personal.portfolio) setShowWebsite(true)

    if (personalIdx !== -1) {
      updatedSections[personalIdx] = {
        ...updatedSections[personalIdx],
        ...personalUpdates
      }
    } else {
      updatedSections.unshift({
        ...createSection('personal'),
        ...personalUpdates
      })
    }

    // 2. Summary Placeholder
    if (parsedData.summary) {
      const summaryIdx = updatedSections.findIndex(s => s.type === 'summary')
      if (summaryIdx !== -1) {
        updatedSections[summaryIdx] = {
          ...updatedSections[summaryIdx],
          summary: parsedData.summary
        }
      } else {
        updatedSections.push({
          ...createSection('summary'),
          summary: parsedData.summary
        })
      }
    }

    // 3. Work Experience Placeholders
    if (parsedData.experience && parsedData.experience.length > 0) {
      updatedSections = updatedSections.filter(s => s.type !== 'experience')
      parsedData.experience.forEach(exp => {
        updatedSections.push({
          ...createSection('experience'),
          role: exp.role || 'Software Engineer',
          company: exp.company || 'Company',
          startDate: exp.startDate || '2021',
          endDate: exp.endDate || 'Present',
          current: exp.current,
          description: exp.description || '',
          technologiesUsed: exp.technologiesUsed || ''
        })
      })
    }

    // 4. Education Placeholders
    if (parsedData.education && parsedData.education.length > 0) {
      updatedSections = updatedSections.filter(s => s.type !== 'education')
      parsedData.education.forEach(ed => {
        updatedSections.push({
          ...createSection('education'),
          degree: ed.degree || 'Degree Program',
          institution: ed.institution || 'University',
          startYear: ed.startYear || '2018',
          endYear: ed.endYear || '2022',
          gpa: ed.gpa || ''
        })
      })
    }

    // 5. Skills Placeholders
    if (parsedData.skills) {
      const skillsIdx = updatedSections.findIndex(s => s.type === 'skills')
      const skillsData = {
        technical: parsedData.skills.technical || '',
        frameworks: parsedData.skills.frameworks || '',
        soft: parsedData.skills.soft || ''
      }
      if (skillsIdx !== -1) {
        updatedSections[skillsIdx] = {
          ...updatedSections[skillsIdx],
          ...skillsData
        }
      } else {
        updatedSections.push({
          ...createSection('skills'),
          ...skillsData
        })
      }
    }

    // 6. Projects Placeholders
    if (parsedData.projects && parsedData.projects.length > 0) {
      updatedSections = updatedSections.filter(s => s.type !== 'projects')
      parsedData.projects.forEach(p => {
        updatedSections.push({
          ...createSection('projects'),
          projectName: p.projectName || 'Project Name',
          projectDescription: p.projectDescription || '',
          projectTechnologies: p.projectTechnologies || '',
          projectType: 'Personal'
        })
      })
    }

    // 7. Extra Links Classification: If user pasted 4-5 links, auto-generate custom link placeholders
    if (parsedData.extraLinks && parsedData.extraLinks.length > 0) {
      parsedData.extraLinks.forEach(extra => {
        const customEntry = {
          id: `social-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'social',
          customSectionHeading: 'Online Profiles & Links',
          platform: extra.platform,
          linkUrl: extra.url,
          username: extra.url.replace(/^https?:\/\//, ''),
          isCustomSection: true
        }
        updatedSections.push(customEntry)
      })
    }

    // Update visibleSections and sectionOrder
    const newTypes = Array.from(new Set(updatedSections.map(s => s.type)))
    setSections(updatedSections)
    setVisibleSections(newTypes)
    setSectionOrder(prev => {
      const existing = (prev || []).filter(t => newTypes.includes(t))
      newTypes.forEach(t => {
        if (!existing.includes(t)) existing.push(t)
      })
      return existing
    })

    if (parsedData.personal?.name) {
      setResumeTitle(`${parsedData.personal.name}'s Resume`)
    }

    setShowAutoFillModal(false)
    toast.success('Successfully auto-filled all resume placeholders!')
  }

  // Safe read of primary sections without side effects
  const personalSection = useMemo(() => {
    return sections.find(s => s.type === 'personal') || null
  }, [sections])

  const summarySection = useMemo(() => {
    return sections.find(sec => sec.type === 'summary') || null
  }, [sections])

  const skillsSection = useMemo(() => {
    return sections.find(sec => sec.type === 'skills') || null
  }, [sections])

  const experienceSections = useMemo(() => sections.filter(s => s.type === 'experience'), [sections])
  const educationSections = useMemo(() => sections.filter(s => s.type === 'education'), [sections])

  // Resume Completeness Calculation
  const completeness = useMemo(() => {
    let score = 0
    if (personalSection?.name && personalSection?.email) score += 20
    if (personalSection?.phone && personalSection?.location) score += 10
    if (experienceSections.length > 0 && experienceSections[0]?.role) score += 25
    if (educationSections.length > 0 && educationSections[0]?.institution) score += 15
    if (skillsSection?.technical || skillsSection?.soft) score += 15
    if (summarySection?.summary && summarySection?.summary.length > 25) score += 15
    return Math.min(score, 100)
  }, [personalSection, experienceSections, educationSections, skillsSection, summarySection])

  // PDF compilation
  const compileToPdf = async () => {
    setCompiling(true)
    setCompileError(null)
    try {
      const response = await fetch('/api/student/resume-builder/compile-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          sections,
          visibleSections,
          sectionOrder,
          settings,
          title: resumeTitle,
        }),
      })
      if (!response.ok) {
        const errBody = await response.json().catch(() => null)
        throw new Error(errBody?.message || 'PDF rendering failed')
      }
      const blob = await response.blob()
      if (pdfUrl) URL.revokeObjectURL(pdfUrl)
      const url = URL.createObjectURL(blob)
      setPdfBlob(blob)
      setPdfUrl(url)
      return blob
    } catch (err) {
      setCompileError(err.message || 'Failed to compile PDF')
      toast.error(err.message || 'Failed to render PDF')
      return null
    } finally {
      setCompiling(false)
    }
  }

  const handleDownloadPdf = async () => {
    setExporting(true)
    try {
      const blob = pdfBlob || await compileToPdf()
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resumeTitle.replace(/\s+/g, '_').toLowerCase()}.pdf`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch (err) {
      toast.error('Failed to export PDF')
    } finally {
      setExporting(false)
    }
  }

  const handleDownloadDocx = async () => {
    setExporting(true)
    try {
      const response = await fetch('/api/student/resume-builder/export-docx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ sections, visibleSections, sectionOrder, settings, title: resumeTitle }),
      })
      if (!response.ok) throw new Error('DOCX export failed')
      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resumeTitle.replace(/\s+/g, '_').toLowerCase()}.docx`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success('DOCX downloaded!')
    } catch (err) {
      toast.error('Failed to export DOCX')
    } finally {
      setExporting(false)
    }
  }

  const currentTemplate = getTemplateById(settings.templateId || 'classic-professional')

  // Fuse.js index for in-builder template picker (memoized)
  const pickerFuse = useMemo(() => new Fuse(RESUME_TEMPLATES, {
    keys: [
      { name: 'name',           weight: 0.35 },
      { name: 'shortName',      weight: 0.30 },
      { name: 'category',       weight: 0.25 },
      { name: 'sampleUser.role', weight: 0.10 },
    ],
    threshold: 0.35,
    ignoreLocation: true,
    minMatchCharLength: 2,
  }), [])

  const pickerTemplates = useMemo(() => {
    const q = tplPickerQuery.trim()
    if (!q) return RESUME_TEMPLATES
    return pickerFuse.search(q).map(r => r.item)
  }, [tplPickerQuery, pickerFuse])

  // Step Navigation handlers
  const handleNextStep = () => {
    if (currentStepIndex < dynamicSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  // Field renderer helper
  const renderField = (sec, field) => {
    const value = sec[field.key] ?? ''
    if (field.type === 'textarea') {
      return (
        <textarea
          value={value}
          onChange={e => updateSection(sec.id, { [field.key]: e.target.value })}
          placeholder={field.placeholder}
          rows={3}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
        />
      )
    }
    if (field.type === 'checkbox') {
      return (
        <label className="flex items-center gap-2 text-xs sm:text-sm cursor-pointer mt-1">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => updateSection(sec.id, { [field.key]: e.target.checked })}
            className="rounded border-slate-300 text-primary focus:ring-primary"
          />
          {field.placeholder || field.label}
        </label>
      )
    }
    if (field.type === 'select') {
      return (
        <select
          value={value}
          onChange={e => updateSection(sec.id, { [field.key]: e.target.value })}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
        >
          {field.options?.map(opt => <option key={opt} value={opt}>{opt}</option>)}
        </select>
      )
    }
    if (field.type === 'number') {
      return (
        <input
          type="number"
          value={value}
          onChange={e => updateSection(sec.id, { [field.key]: e.target.value })}
          placeholder={field.placeholder}
          min={field.min ?? 1}
          max={field.max ?? 5}
          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
        />
      )
    }
    return (
      <input
        type={field.type || 'text'}
        value={value}
        onChange={e => updateSection(sec.id, { [field.key]: e.target.value })}
        placeholder={field.placeholder}
        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs sm:text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
      />
    )
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900 text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-10 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-400">Loading Resume Builder...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen max-w-full overflow-x-hidden bg-[#F8FAFC] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur md:px-8">
        <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
          {/* Prominent Exit Button */}
          <Link
            to="/resume-templates"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-2xs group shrink-0"
            title="Exit builder and return to template gallery"
          >
            <ArrowLeft className="size-3.5 text-slate-500 group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Exit to</span> Templates
          </Link>

          <span className="hidden sm:inline-block text-slate-300">|</span>

          <Link to="/" className="text-xl font-black tracking-tight text-primary shrink-0 hover:opacity-90 transition-opacity">
            BRIDGE
          </Link>
          <span className="hidden sm:inline-block text-slate-300">|</span>
          <div className="flex items-center gap-2 min-w-0">
            <input
              value={resumeTitle}
              onChange={e => setResumeTitle(e.target.value)}
              className="text-sm sm:text-base font-bold bg-transparent border-b border-transparent hover:border-slate-300 focus:border-primary outline-none px-1 py-0.5 transition-colors truncate"
              placeholder="Resume Title"
            />
            <span className="text-[11px] text-slate-400 hidden xl:inline shrink-0">
              {lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              {saving && ' • Saving...'}
            </span>
          </div>
        </div>

        {/* Center View Mode Switcher Toggle */}
        <div className="hidden md:flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            type="button"
            onClick={() => setViewMode('guided')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'guided'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="size-3.5 text-blue-600" />
            <span>Guided Wizard</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              viewMode === 'all'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="size-3.5 text-emerald-600" />
            <span>All Sections ({sections.length})</span>
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Smart Auto-Fill Button */}
          <button
            onClick={() => setShowAutoFillModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 transition-all active:scale-95"
            title="Auto-fill resume from LinkedIn export, PDF, or text"
          >
            <Sparkles className="size-3.5 fill-current" />
            <span>Auto-Fill</span>
          </button>

          {/* Add Sections Modal Trigger Button */}
          <button
            onClick={() => setShowAddSectionModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
          >
            <Plus className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Add</span> Section
          </button>

          {/* Template Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowTemplatePicker(!showTemplatePicker)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
            >
              <span className="size-2.5 rounded-full" style={{ backgroundColor: currentTemplate.colorHex }} />
              <span className="hidden sm:inline">Template:</span> {currentTemplate.shortName}
              <ChevronDown className="size-3 text-slate-400" />
            </button>

            {showTemplatePicker && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowTemplatePicker(false)} />
                <div className="absolute right-0 top-full z-50 mt-1.5 w-88 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xl max-h-[500px] overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 shrink-0">
                    <div>
                      <span className="text-xs font-bold text-slate-800">Switch Template ({RESUME_TEMPLATES.length})</span>
                      <p className="text-[10px] text-slate-400">600+ ATS-Approved Styles</p>
                    </div>
                    <Link
                      to="/resume-templates"
                      className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1"
                    >
                      Gallery <ExternalLink className="size-3" />
                    </Link>
                  </div>

                  {/* Search inside 600+ templates */}
                  <div className="mb-2 shrink-0">
                    <input
                      type="text"
                      value={tplPickerQuery}
                      onChange={e => setTplPickerQuery(e.target.value)}
                      placeholder="Search 600+ templates by role/category..."
                      className="w-full text-xs rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 outline-none focus:border-primary focus:bg-white transition-colors"
                    />
                  </div>

                  <div className="space-y-1.5 overflow-y-auto flex-1 pr-1 scrollbar-thin">
                    {pickerTemplates.map((tpl) => {
                        const isCurrent = (settings.templateId || 'classic-professional') === tpl.id
                        return (
                          <button
                            key={tpl.id}
                            onClick={() => {
                              setSettings(prev => ({
                                ...prev,
                                templateId: tpl.id,
                                primaryColor: tpl.primaryColor,
                                fontFamily: tpl.fontFamily || prev.fontFamily
                              }))
                              setShowTemplatePicker(false)
                              toast.success(`Switched to "${tpl.shortName}"`)
                            }}
                            className={`w-full flex items-center justify-between p-2 rounded-xl text-left text-xs transition-colors ${
                              isCurrent
                                ? 'bg-primary/10 border border-primary/20 font-bold text-primary'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span className="size-3 rounded-full shrink-0" style={{ backgroundColor: tpl.colorHex }} />
                              <div className="truncate">
                                <p className="truncate font-semibold">{tpl.shortName}</p>
                                <p className="text-[10px] text-slate-400 truncate">{tpl.category}</p>
                              </div>
                            </div>
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded shrink-0">
                              ATS {tpl.atsScore}%
                            </span>
                          </button>
                        )
                      })}
                  </div>

                  {/* Bottom Gallery Link */}
                  <div className="pt-2 mt-2 border-t border-slate-100 shrink-0">
                    <Link
                      to="/resume-templates"
                      className="w-full py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>Exit & Browse All 600+ in Gallery</span>
                      <ArrowRight className="size-3.5" />
                    </Link>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={() => handleSave()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-primary/90 disabled:opacity-50 transition-all"
          >
            {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            <span className="hidden sm:inline">Save</span>
          </button>

          <button
            onClick={handleDownloadPdf}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 disabled:opacity-50 transition-all"
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Download</span>
          </button>

          {user ? (
            <Link
              to="/dashboard"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
            >
              Dashboard
            </Link>
          ) : (
            <Link
              to="/login"
              className="hidden lg:inline-flex items-center gap-1.5 rounded-xl bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </header>

      {/* Main 3-Column Studio Layout */}
      <div className="flex-1 flex flex-col lg:flex-row min-w-0 max-w-full overflow-hidden">
        {/* Left Dark Sidebar Stepper */}
        <aside className="w-full lg:w-60 xl:w-64 bg-[#0B132B] text-slate-200 flex flex-col justify-between p-4 sm:p-5 shrink-0 border-r border-slate-800/60 lg:h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin">
          <div className="space-y-6">
            {/* Stepper Navigation */}
            <div className="space-y-4">
              {dynamicSteps.map((step, idx) => {
                const isActive = idx === currentStepIndex
                const isCompleted = idx < currentStepIndex
                const StepIcon = step.icon

                return (
                  <div key={step.id} className="relative flex items-center group">
                    {/* Connecting dotted line between steps */}
                    {idx < dynamicSteps.length - 1 && (
                      <div
                        className="absolute left-4 top-7 bottom-[-16px] w-0.5 border-l-2 border-dotted"
                        style={{
                          borderColor: isCompleted ? '#3b82f6' : 'rgba(255, 255, 255, 0.15)'
                        }}
                      />
                    )}

                    {/* Step Row */}
                    <div
                      onClick={() => {
                        if (viewMode === 'all') {
                          const anchor = document.getElementById(`section-anchor-${step.type}`)
                          if (anchor) anchor.scrollIntoView({ behavior: 'smooth' })
                        } else {
                          setCurrentStepIndex(idx)
                        }
                      }}
                      className={`group flex items-center justify-between text-left w-full transition-all py-1.5 px-2 rounded-xl cursor-pointer ${
                        isActive ? 'text-white bg-slate-800/80' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate flex-1 min-w-0">
                        {/* Step Circle Badge */}
                        <div
                          className={`size-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-md shrink-0 ${
                            isActive
                              ? 'bg-blue-600 text-white ring-4 ring-blue-500/20 shadow-blue-500/30'
                              : isCompleted
                              ? 'bg-blue-900/80 text-blue-200 border border-blue-400/40'
                              : 'bg-slate-800 text-slate-400 border border-slate-700/60'
                          }`}
                        >
                          {isCompleted ? <Check className="size-3.5 text-blue-300" /> : idx + 1}
                        </div>

                        <div className="truncate flex-1 min-w-0">
                          <span className={`text-xs tracking-wide block truncate ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                            {step.label}
                          </span>
                          {step.isContentSection && sections.filter(s => s.type === step.type).length > 1 && (
                            <span className="text-[10px] text-blue-400 font-medium">
                              {sections.filter(s => s.type === step.type).length} entries
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Section Action Controls: Shift Up, Shift Down, Delete */}
                      {step.isContentSection && (
                        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1">
                          <button
                            type="button"
                            disabled={orderedActiveTypes.indexOf(step.type) <= 0}
                            onClick={(e) => {
                              e.stopPropagation()
                              shiftSection(step.type, -1)
                            }}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                            title={`Shift ${step.label} up (↑)`}
                          >
                            <ArrowUp className="size-3" />
                          </button>
                          <button
                            type="button"
                            disabled={orderedActiveTypes.indexOf(step.type) >= orderedActiveTypes.length - 1}
                            onClick={(e) => {
                              e.stopPropagation()
                              shiftSection(step.type, 1)
                            }}
                            className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-700/60 disabled:opacity-20 disabled:hover:bg-transparent transition-colors"
                            title={`Shift ${step.label} down (↓)`}
                          >
                            <ArrowDown className="size-3" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteWholeSection(step.type, step.label)
                            }}
                            className="p-1 rounded text-slate-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                            title={`Delete ${step.label} section`}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Auto-Fill & Add Sections in Sidebar */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => setShowAutoFillModal(true)}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-md shadow-indigo-950/40 active:scale-98"
              >
                <Sparkles className="size-3.5 fill-current" />
                <span>⚡ Smart Auto-Fill</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAddSectionModal(true)}
                className="w-full py-2.5 px-3 rounded-xl border border-dashed border-blue-500/50 hover:border-blue-400 bg-blue-950/30 hover:bg-blue-900/40 text-blue-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
              >
                <Plus className="size-3.5" /> Add Section (35+ Options)
              </button>

              <button
                type="button"
                onClick={() => setShowManualSectionModal(true)}
                className="w-full py-2 px-3 rounded-xl border border-dashed border-indigo-500/50 hover:border-indigo-400 bg-indigo-950/30 hover:bg-indigo-900/40 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs"
              >
                <PenTool className="size-3" /> + Add Section Manually
              </button>

              {/* Quick Add Chips in Sidebar */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Quick Add:
                </span>
                <div className="flex flex-wrap gap-1">
                  {[
                    ...(!sections.some(s => s.type === 'personal') ? [{ type: 'personal', label: 'Heading' }] : []),
                    ...(!sections.some(s => s.type === 'experience') ? [{ type: 'experience', label: 'Work history' }] : []),
                    ...(!sections.some(s => s.type === 'education') ? [{ type: 'education', label: 'Education' }] : []),
                    ...(!sections.some(s => s.type === 'skills') ? [{ type: 'skills', label: 'Skills' }] : []),
                    ...(!sections.some(s => s.type === 'summary') ? [{ type: 'summary', label: 'Summary' }] : []),
                    { type: 'projects', label: 'Projects' },
                    { type: 'internships', label: 'Internships' },
                    { type: 'certifications', label: 'Certifications' },
                    { type: 'languages', label: 'Languages' },
                    { type: 'awards', label: 'Awards' },
                    { type: 'volunteer', label: 'Volunteer' },
                    { type: 'custom', label: 'Custom' },
                  ].map(item => {
                    const already = sections.some(s => s.type === item.type)
                    return (
                      <button
                        key={item.type}
                        type="button"
                        onClick={() => handleAddSectionType(item.type)}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition-all ${
                          already
                            ? 'border-emerald-800/60 bg-emerald-950/40 text-emerald-300'
                            : 'border-slate-700/80 bg-slate-800/40 text-slate-300 hover:border-blue-400 hover:text-white'
                        }`}
                      >
                        + {item.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Animated Continuous Completeness Gauge */}
          <div className="pt-6 border-t border-slate-800/80 mt-6">
            <ResumeCompletenessSidebar
              sections={sections}
              onAddSection={handleAddSectionType}
              onOpenDetails={() => setShowCompletenessModal(true)}
            />
          </div>

            {/* Sidebar Terms Links */}
            <div className="pt-3 text-[10px] text-slate-500 space-y-1">
              <div className="flex flex-wrap gap-x-3 gap-y-1">
                <Link to="/terms" className="hover:text-slate-400">Terms</Link>
                <Link to="/privacy" className="hover:text-slate-400">Privacy</Link>
                <Link to="/contact" className="hover:text-slate-400">Support</Link>
              </div>
              <p>© 2026 Bridge. All rights reserved.</p>
            </div>
        </aside>

        {/* Center Main Step Editor */}
        <main className="flex-1 min-w-0 flex flex-col lg:h-[calc(100vh-64px)] overflow-y-auto bg-slate-50/40">
          <div className="max-w-3xl w-full mx-auto p-5 sm:p-8 flex-1 flex flex-col">
            {/* Top Back Action & Mobile Mode Switcher */}
            <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                {currentStepIndex > 0 && viewMode === 'guided' ? (
                  <button
                    onClick={handlePrevStep}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
                  >
                    <ArrowLeft className="size-3.5" /> Go Back
                  </button>
                ) : (
                  <Link
                    to="/resume-templates"
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    <ArrowLeft className="size-3.5" /> Back to Templates
                  </Link>
                )}

                {/* Mobile View Mode Switcher */}
                <div className="flex md:hidden items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setViewMode('guided')}
                    className={`px-2 py-1 rounded text-[11px] font-bold ${viewMode === 'guided' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                  >
                    Wizard
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className={`px-2 py-1 rounded text-[11px] font-bold ${viewMode === 'all' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-500'}`}
                  >
                    All Sections
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowAddSectionModal(true)}
                  className="text-xs font-bold text-primary hover:underline flex items-center gap-1"
                >
                  <Plus className="size-3.5" /> Add Section
                </button>
                {viewMode === 'guided' && (
                  <span className="text-xs font-medium text-slate-400">
                    Step {currentStepIndex + 1} of {dynamicSteps.length}
                  </span>
                )}
              </div>
            </div>

            {/* Quick-Add Section Pills Bar — Clean wrapping, zero horizontal scrollbar */}
            <div className="mb-6 bg-white p-3 rounded-2xl border border-slate-200/90 shadow-xs">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider shrink-0 flex items-center gap-1 pr-2 border-r border-slate-200">
                  <Sparkles className="size-3 text-amber-500" /> Quick Add:
                </span>
                {[
                  ...(!sections.some(s => s.type === 'personal') ? [{ type: 'personal', label: 'Heading', icon: User }] : []),
                  ...(!sections.some(s => s.type === 'experience') ? [{ type: 'experience', label: 'Work history', icon: Briefcase }] : []),
                  ...(!sections.some(s => s.type === 'education') ? [{ type: 'education', label: 'Education', icon: GraduationCap }] : []),
                  ...(!sections.some(s => s.type === 'skills') ? [{ type: 'skills', label: 'Skills', icon: Code }] : []),
                  ...(!sections.some(s => s.type === 'summary') ? [{ type: 'summary', label: 'Summary', icon: FileText }] : []),
                  { type: 'projects', label: 'Projects', icon: FolderOpen },
                  { type: 'internships', label: 'Internships', icon: Briefcase },
                  { type: 'certifications', label: 'Certifications', icon: BadgeCheck },
                  { type: 'languages', label: 'Languages', icon: Globe },
                  { type: 'awards', label: 'Awards', icon: Award },
                  { type: 'volunteer', label: 'Volunteer', icon: Heart },
                  { type: 'hackathons', label: 'Hackathons', icon: Code },
                  { type: 'research', label: 'Research', icon: Microscope },
                ].map(item => {
                  const isAdded = sections.some(s => s.type === item.type)
                  return (
                    <button
                      key={item.type}
                      type="button"
                      onClick={() => handleAddSectionType(item.type)}
                      className={`px-2.5 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isAdded
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold'
                          : 'bg-slate-50 hover:bg-primary/10 text-slate-700 hover:text-primary border border-slate-200 shadow-2xs'
                      }`}
                    >
                      <item.icon className="size-3" />
                      <span>+ {item.label}</span>
                      {isAdded && (
                        <span className="size-1.5 rounded-full bg-emerald-500" />
                      )}
                    </button>
                  )
                })}
                <button
                  type="button"
                  onClick={() => setShowAutoFillModal(true)}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition-all flex items-center gap-1 shadow-2xs ml-auto"
                >
                  <Sparkles className="size-3 fill-current" /> ⚡ Auto-Fill
                </button>
                <button
                  type="button"
                  onClick={() => setShowManualSectionModal(true)}
                  className="px-2.5 py-1 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 transition-all flex items-center gap-1 shadow-2xs"
                >
                  <PenTool className="size-3" /> + Custom Section
                </button>
              </div>
            </div>

            {viewMode === 'all' ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">All Resume Sections ({sections.length})</h2>
                    <p className="text-xs text-slate-500">Edit, reorder, and customize all your resume content in one place.</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAutoFillModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:from-purple-500 hover:to-indigo-500 flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
                    >
                      <Sparkles className="size-3.5 fill-current" /> Auto-Fill
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowManualSectionModal(true)}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 flex items-center gap-1.5 shadow-sm"
                    >
                      <PenTool className="size-3.5" /> + Add Section Manually
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowAddSectionModal(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="size-3.5" /> Add Section
                    </button>
                  </div>
                </div>

                {sections.map((sec, index) => {
                  const config = getSectionConfig(sec.type, sec)
                  if (!config) return null
                  const Icon = config.icon || Sparkles
                  const isRequired = config.required

                  return (
                    <div
                      key={sec.id}
                      id={`section-anchor-${sec.type}`}
                      className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
                        <div className="flex items-center gap-2.5">
                          <div className={`grid size-8 place-items-center rounded-xl ${config.bgColor || 'bg-slate-100'}`}>
                            <Icon className={`size-4 ${config.color || 'text-slate-600'}`} />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-slate-900">
                              {config.label}
                              {config.repeatable && sections.filter(s => s.type === sec.type).length > 1 && (
                                <span className="ml-1.5 text-xs text-slate-400 font-normal">
                                  #{sections.filter(s => s.type === sec.type).findIndex(s => s.id === sec.id) + 1}
                                </span>
                              )}
                            </h3>
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => moveSection(sec.id, -1)}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                            title="Move up"
                          >
                            <ArrowUp className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveSection(sec.id, 1)}
                            disabled={index === sections.length - 1}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 disabled:opacity-30"
                            title="Move down"
                          >
                            <ArrowDown className="size-3.5" />
                          </button>
                          {config.repeatable && (
                            <button
                              type="button"
                              onClick={() => duplicateSection(sec.id)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                              title="Duplicate entry"
                            >
                              <Copy className="size-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeSection(sec.id)}
                            className="p-1.5 rounded-lg text-rose-400 hover:text-rose-600 hover:bg-rose-50"
                            title="Remove section"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </div>
                      </div>

                      <div className="p-5">
                        <div className="grid gap-4 sm:grid-cols-2">
                          {config.fields.map(field => (
                            <div
                              key={field.key}
                              className={field.type === 'textarea' || field.type === 'checkbox' ? 'sm:col-span-2' : ''}
                            >
                              <label className="mb-1.5 block text-xs font-bold text-slate-700">
                                {field.label}
                              </label>
                              {renderField(sec, field)}
                            </div>
                          ))}
                        </div>

                        {config.repeatable && (
                          <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                            <button
                              type="button"
                              onClick={() => handleAddSectionType(sec.type)}
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                            >
                              <Plus className="size-3.5" /> Add Another {config.label} Entry
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}

                {/* Bottom Add Section Catalog Block in All Sections View */}
                <div className="rounded-3xl border-2 border-dashed border-slate-300 bg-white p-6 space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                      <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                        <Sparkles className="size-4 text-primary" /> Add More Sections to Resume
                      </h3>
                      <p className="text-xs text-slate-500">
                        Pick from 35+ professional sections to enhance your profile.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowManualSectionModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm flex items-center gap-1.5"
                      >
                        <PenTool className="size-3.5" /> + Add Section Manually
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowAddSectionModal(true)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 shadow-sm"
                      >
                        Open Full Catalog (35+)
                      </button>
                    </div>
                  </div>

                  {SECTION_CATEGORIES.map(category => (
                    <div key={category.name} className="space-y-2">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                        {category.name}
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {category.types.map(type => {
                          const config = ALL_SECTIONS[type]
                          if (!config || type === 'personal') return null
                          const Icon = config.icon || Sparkles
                          const isAdded = sections.some(s => s.type === type)

                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => handleAddSectionType(type)}
                              className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition-all ${
                                isAdded
                                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                                  : 'border-slate-200 bg-slate-50 hover:bg-primary/5 hover:border-primary text-slate-700 hover:text-primary shadow-xs'
                              }`}
                            >
                              <Icon className="size-3.5" />
                              {config.label}
                              {isAdded ? (
                                <span className="text-[10px] text-emerald-600 font-bold ml-1">
                                  ({sections.filter(s => s.type === type).length})
                                </span>
                              ) : (
                                <Plus className="size-3 ml-0.5 opacity-60" />
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {/* Step Headline & Subtitle with Shift & Delete Controls */}
                <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200/80">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                      <span>{currentStep.title}</span>
                      {currentStep.isCore && (
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          Core Section
                        </span>
                      )}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                      {currentStep.subtitle}
                    </p>
                  </div>

                  {/* Section Controls Toolbar: Shift Up, Shift Down, Delete Section */}
                  {currentStep.isContentSection && (
                    <div className="flex items-center gap-1.5 self-start sm:self-center shrink-0 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                      <button
                        type="button"
                        onClick={() => shiftSection(currentStep.type, -1)}
                        disabled={orderedActiveTypes.indexOf(currentStep.type) <= 0}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Shift section up (↑)"
                      >
                        <ArrowUp className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => shiftSection(currentStep.type, 1)}
                        disabled={orderedActiveTypes.indexOf(currentStep.type) >= orderedActiveTypes.length - 1}
                        className="p-1.5 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                        title="Shift section down (↓)"
                      >
                        <ArrowDown className="size-4" />
                      </button>
                      <div className="h-4 w-px bg-slate-200 mx-0.5" />
                      <button
                        type="button"
                        onClick={() => deleteWholeSection(currentStep.type, currentStep.label)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200/80 flex items-center gap-1 transition-colors"
                        title={`Delete ${currentStep.label} section from resume`}
                      >
                        <Trash2 className="size-3.5" />
                        <span>Delete Section</span>
                      </button>
                    </div>
                  )}
                </div>

            {/* Animated Step Form Body */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* STEP 1: HEADING */}
                {currentStep.id === 'heading' && (
                  !personalSection ? (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="size-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                        <User className="size-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Heading Section has been removed</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Your personal contact details (name, email, phone, location) are currently omitted.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddSectionType('personal')}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90"
                      >
                        + Restore Heading Section
                      </button>
                    </div>
                  ) : (
                  <div className="space-y-6">
                    {/* Smart Auto-Fill Quick Action Banner */}
                    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-r from-purple-50 via-indigo-50/70 to-blue-50/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                      <div className="flex items-start gap-3">
                        <div className="size-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                          <Sparkles className="size-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            Auto-Fill from Resume PDF or LinkedIn Profile
                          </h4>
                          <p className="text-[11px] text-slate-600 mt-0.5">
                            Upload your resume PDF or paste LinkedIn export text. Our algorithm will parse and fill all placeholders automatically!
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAutoFillModal(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0"
                      >
                        <Upload className="size-3.5" />
                        <span>Upload & Auto-Fill</span>
                      </button>
                    </div>

                    <p className="text-xs text-slate-400">* indicates a required field</p>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                      {/* Avatar / Photo Placeholder */}
                      <div className="md:col-span-3 flex flex-col items-center justify-center p-4 rounded-2xl border-2 border-dashed border-slate-200 bg-white text-center hover:border-primary/50 transition-colors cursor-pointer group">
                        <div className="size-20 rounded-full bg-slate-100 flex items-center justify-center mb-2 text-slate-400 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                          <User className="size-9" />
                        </div>
                        <span className="text-xs font-bold text-primary flex items-center gap-1">
                          <Upload className="size-3" /> Upload Photo
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5">Optional (ATS safe)</span>
                      </div>

                      {/* Name & Title Inputs */}
                      <div className="md:col-span-9 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">First Name *</label>
                          <input
                            type="text"
                            value={personalSection.name ? personalSection.name.split(' ')[0] : ''}
                            onChange={e => {
                              const lastName = personalSection.name ? personalSection.name.split(' ').slice(1).join(' ') : ''
                              updateSection(personalSection.id, { name: `${e.target.value} ${lastName}`.trim() })
                            }}
                            placeholder="e.g. Saanvi"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Surname *</label>
                          <input
                            type="text"
                            value={personalSection.name ? personalSection.name.split(' ').slice(1).join(' ') : ''}
                            onChange={e => {
                              const firstName = personalSection.name ? personalSection.name.split(' ')[0] : ''
                              updateSection(personalSection.id, { name: `${firstName} ${e.target.value}`.trim() })
                            }}
                            placeholder="e.g. Patel"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                          />
                        </div>

                        <div className="sm:col-span-2">
                          <label className="block text-xs font-bold text-slate-700 mb-1.5">Profession / Target Job Title *</label>
                          <input
                            type="text"
                            value={personalSection.professionalTitle || ''}
                            onChange={e => updateSection(personalSection.id, { professionalTitle: e.target.value })}
                            placeholder="e.g. Retail Sales Associate / Full Stack Developer"
                            className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Location fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">City</label>
                        <input
                          type="text"
                          value={personalSection.location ? personalSection.location.split(',')[0]?.trim() : ''}
                          onChange={e => {
                            const rest = personalSection.location ? personalSection.location.split(',').slice(1).join(',') : ''
                            updateSection(personalSection.id, { location: `${e.target.value}, ${rest}`.trim().replace(/^,\s*/, '') })
                          }}
                          placeholder="e.g. New Delhi"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Country / State</label>
                        <input
                          type="text"
                          value={personalSection.location ? personalSection.location.split(',')[1]?.trim() || '' : ''}
                          onChange={e => {
                            const city = personalSection.location ? personalSection.location.split(',')[0]?.trim() : ''
                            updateSection(personalSection.id, { location: `${city}, ${e.target.value}`.trim() })
                          }}
                          placeholder="e.g. India"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Pin / Zip Code</label>
                        <input
                          type="text"
                          value={personalSection.zip || ''}
                          onChange={e => updateSection(personalSection.id, { zip: e.target.value })}
                          placeholder="e.g. 110034"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                        />
                      </div>
                    </div>

                    {/* Contact fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number *</label>
                        <input
                          type="tel"
                          value={personalSection.phone || ''}
                          onChange={e => updateSection(personalSection.id, { phone: e.target.value })}
                          placeholder="+91 22 1234 5677"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
                        <input
                          type="email"
                          value={personalSection.email || ''}
                          onChange={e => updateSection(personalSection.id, { email: e.target.value })}
                          placeholder="saanvipatel@sample.in"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 bg-white"
                        />
                      </div>
                    </div>

                    {/* Quick Add Pill Buttons */}
                    <div className="pt-2">
                      <p className="text-xs font-bold text-slate-700 mb-2">
                        Add additional links to your resume (optional):
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setShowLinkedin(!showLinkedin)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            showLinkedin || personalSection.linkedin
                              ? 'bg-blue-50 border-blue-300 text-blue-700'
                              : 'border-slate-300 hover:border-slate-400 bg-white text-slate-700'
                          }`}
                        >
                          LinkedIn +
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowGithub(!showGithub)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            showGithub || personalSection.github
                              ? 'bg-slate-100 border-slate-400 text-slate-900'
                              : 'border-slate-300 hover:border-slate-400 bg-white text-slate-700'
                          }`}
                        >
                          GitHub +
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowWebsite(!showWebsite)}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                            showWebsite || personalSection.website
                              ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                              : 'border-slate-300 hover:border-slate-400 bg-white text-slate-700'
                          }`}
                        >
                          Website +
                        </button>
                      </div>

                      {/* Expandable fields */}
                      <div className="space-y-3 mt-4">
                        {(showLinkedin || personalSection.linkedin) && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 w-24">LinkedIn:</span>
                            <input
                              type="url"
                              value={personalSection.linkedin || ''}
                              onChange={e => updateSection(personalSection.id, { linkedin: e.target.value })}
                              placeholder="https://linkedin.com/in/saanvi-patel"
                              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary bg-white"
                            />
                          </div>
                        )}
                        {(showGithub || personalSection.github) && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 w-24">GitHub:</span>
                            <input
                              type="url"
                              value={personalSection.github || ''}
                              onChange={e => updateSection(personalSection.id, { github: e.target.value })}
                              placeholder="https://github.com/saanvipatel"
                              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary bg-white"
                            />
                          </div>
                        )}
                        {(showWebsite || personalSection.website) && (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-500 w-24">Website:</span>
                            <input
                              type="url"
                              value={personalSection.website || ''}
                              onChange={e => updateSection(personalSection.id, { website: e.target.value })}
                              placeholder="https://saanvipatel.me"
                              className="flex-1 rounded-xl border border-slate-200 px-3.5 py-2 text-sm outline-none focus:border-primary bg-white"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  )
                )}

                {/* STEP 2: WORK EXPERIENCE */}
                {currentStep.id === 'experience' && (
                  experienceSections.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="size-12 rounded-full bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                        <Briefcase className="size-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Work History Section has been removed</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Add past positions, companies, roles, and achievements to your resume.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddSectionType('experience')}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90"
                      >
                        + Add Work Experience Entry
                      </button>
                    </div>
                  ) : (
                  <div className="space-y-6">
                    {experienceSections.map((exp, idx) => (
                      <div key={exp.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="font-bold text-sm text-slate-800">Position #{idx + 1}</h4>
                          <button
                            onClick={() => removeSection(exp.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                          >
                            <Trash2 className="size-3.5" /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Job Title *</label>
                            <input
                              value={exp.role || ''}
                              onChange={e => updateSection(exp.id, { role: e.target.value })}
                              placeholder="e.g. Sales Associate / Software Engineer"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Company / Employer *</label>
                            <input
                              value={exp.company || ''}
                              onChange={e => updateSection(exp.id, { company: e.target.value })}
                              placeholder="e.g. Retail Corp / Google"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Location</label>
                            <input
                              value={exp.expLocation || ''}
                              onChange={e => updateSection(exp.id, { expLocation: e.target.value })}
                              placeholder="e.g. New Delhi, India"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex-1">
                              <label className="block text-xs font-bold text-slate-700 mb-1">Start Date</label>
                              <input
                                value={exp.startDate || ''}
                                onChange={e => updateSection(exp.id, { startDate: e.target.value })}
                                placeholder="e.g. Jan 2021"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                              />
                            </div>
                            <div className="flex-1">
                              <label className="block text-xs font-bold text-slate-700 mb-1">End Date</label>
                              <input
                                value={exp.current ? 'Present' : exp.endDate || ''}
                                disabled={exp.current}
                                onChange={e => updateSection(exp.id, { endDate: e.target.value })}
                                placeholder="e.g. Present"
                                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary disabled:bg-slate-100"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-1">
                          <input
                            type="checkbox"
                            id={`current-${exp.id}`}
                            checked={!!exp.current}
                            onChange={e => updateSection(exp.id, { current: e.target.checked })}
                            className="rounded border-slate-300 text-primary"
                          />
                          <label htmlFor={`current-${exp.id}`} className="text-xs font-medium text-slate-600 cursor-pointer">
                            I currently work here
                          </label>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Key Achievements & Responsibilities (one per line)
                          </label>
                          <textarea
                            rows={3}
                            value={exp.description || ''}
                            onChange={e => updateSection(exp.id, { description: e.target.value })}
                            placeholder="• Exceeded quarterly sales target by 28% through targeted upsells&#10;• Trained 5 incoming associates on store POS operations"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newSec = createSection('experience')
                        setSections(s => [...s, newSec])
                      }}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 text-slate-700 hover:border-primary hover:text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors bg-white/60"
                    >
                      <Plus className="size-4" /> Add Another Position
                    </button>
                  </div>
                  )
                )}

                {/* STEP 3: EDUCATION */}
                {currentStep.id === 'education' && (
                  educationSections.length === 0 ? (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="size-12 rounded-full bg-amber-50 text-amber-600 mx-auto flex items-center justify-center">
                        <GraduationCap className="size-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Education Section has been removed</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Add your degrees, universities, and educational qualifications.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddSectionType('education')}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90"
                      >
                        + Add Education Entry
                      </button>
                    </div>
                  ) : (
                  <div className="space-y-6">
                    {educationSections.map((edu, idx) => (
                      <div key={edu.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <h4 className="font-bold text-sm text-slate-800">Degree #{idx + 1}</h4>
                          <button
                            onClick={() => removeSection(edu.id)}
                            className="text-xs text-rose-500 hover:text-rose-700 flex items-center gap-1 font-semibold"
                          >
                            <Trash2 className="size-3.5" /> Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Degree / Certificate *</label>
                            <input
                              value={edu.degree || ''}
                              onChange={e => updateSection(edu.id, { degree: e.target.value })}
                              placeholder="e.g. Bachelor of Commerce / B.Tech"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">School / College / University *</label>
                            <input
                              value={edu.institution || ''}
                              onChange={e => updateSection(edu.id, { institution: e.target.value })}
                              placeholder="e.g. Delhi University"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Field of Study / Major</label>
                            <input
                              value={edu.course || ''}
                              onChange={e => updateSection(edu.id, { course: e.target.value })}
                              placeholder="e.g. Economics / Marketing"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Graduation Year / CGPA</label>
                            <input
                              value={edu.endYear || ''}
                              onChange={e => updateSection(edu.id, { endYear: e.target.value })}
                              placeholder="e.g. 2022 • 8.4 CGPA"
                              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary"
                            />
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newSec = createSection('education')
                        setSections(s => [...s, newSec])
                      }}
                      className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 text-slate-700 hover:border-primary hover:text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors bg-white/60"
                    >
                      <Plus className="size-4" /> Add Another Education
                    </button>
                  </div>
                  )
                )}

                {/* STEP 4: SKILLS */}
                {currentStep.id === 'skills' && (
                  !skillsSection ? (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="size-12 rounded-full bg-cyan-50 text-cyan-600 mx-auto flex items-center justify-center">
                        <Code className="size-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Skills Section has been removed</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Add technical skills and soft skills to pass employer ATS screenings.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddSectionType('skills')}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90"
                      >
                        + Restore Skills Section
                      </button>
                    </div>
                  ) : (
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Technical Skills & Competencies (comma separated)
                        </label>
                        <textarea
                          rows={3}
                          value={skillsSection.technical || ''}
                          onChange={e => updateSection(skillsSection.id, { technical: e.target.value })}
                          placeholder="e.g. POS Systems, Negotiation, Inventory Control, CRM Software, MS Excel"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1.5">
                          Soft Skills & Leadership (comma separated)
                        </label>
                        <textarea
                          rows={2}
                          value={skillsSection.soft || ''}
                          onChange={e => updateSection(skillsSection.id, { soft: e.target.value })}
                          placeholder="e.g. Communication, Problem Solving, Customer Service, Leadership"
                          className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary"
                        />
                      </div>

                      <div className="pt-2">
                        <p className="text-xs font-semibold text-slate-500 mb-2">💡 Quick Suggestion Pills (Click to add):</p>
                        <div className="flex flex-wrap gap-1.5">
                          {['Customer Relations', 'Active Listening', 'Conflict Resolution', 'Data Analysis', 'Time Management', 'Microsoft Office', 'Team Collaboration'].map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => {
                                const current = skillsSection.technical || ''
                                if (!current.includes(tag)) {
                                  updateSection(skillsSection.id, {
                                    technical: current ? `${current}, ${tag}` : tag
                                  })
                                }
                              }}
                              className="text-xs bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-700 px-2.5 py-1 rounded-full font-medium transition-colors border border-slate-200/60"
                            >
                              + {tag}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                )}

                {/* STEP 5: SUMMARY */}
                {currentStep.id === 'summary' && (
                  !summarySection ? (
                    <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-sm space-y-3">
                      <div className="size-12 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                        <FileText className="size-6" />
                      </div>
                      <h3 className="text-base font-bold text-slate-800">Summary Section has been removed</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        Add a 2-3 sentence overview highlighting your career background and key strengths.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleAddSectionType('summary')}
                        className="px-4 py-2 bg-primary text-white rounded-xl text-xs font-bold shadow-sm hover:bg-primary/90"
                      >
                        + Restore Summary Section
                      </button>
                    </div>
                  ) : (
                  <div className="space-y-6">
                    <div className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Professional Summary / Career Objective
                      </label>
                      <textarea
                        rows={5}
                        value={summarySection.summary || ''}
                        onChange={e => updateSection(summarySection.id, { summary: e.target.value })}
                        placeholder="Dedicated retail sales associate with 4+ years delivering superior customer care, exceeding monthly targets by 15%, and managing store visual merchandising."
                        className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-primary leading-relaxed"
                      />

                      <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start gap-2">
                        <Sparkles className="size-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">ATS Recruiter Tip:</p>
                          <p className="text-blue-800 text-[11px] mt-0.5">
                            Keep your summary between 30 and 60 words. Quantify results with numbers (e.g. "increased revenue by 20%", "managed 10+ employees").
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  )
                )}

                {/* STEP: EDIT USER-ADDED CUSTOM SECTION (e.g. Internships, Projects, Certifications, etc.) */}
                {currentStep.isCustomSection && (
                  <div className="space-y-6">
                    {(() => {
                      const matchingSections = sections.filter(s => s.type === currentStep.type)
                      const config = getSectionConfig(currentStep.type, matchingSections[0])

                      return (
                        <>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-500">
                              {matchingSections.length} {matchingSections.length === 1 ? 'entry' : 'entries'} in {config.label || currentStep.type}
                            </span>
                            {config.repeatable && (
                              <button
                                type="button"
                                onClick={() => handleAddSectionType(currentStep.type)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
                              >
                                <Plus className="size-3.5" /> Add Another {config.label || 'Entry'}
                              </button>
                            )}
                          </div>

                          {matchingSections.map((sec, idx) => (
                            <div key={sec.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-4">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-sm text-slate-800">
                                    {config.label} #{idx + 1}
                                  </span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    onClick={() => moveSection(sec.id, -1)}
                                    disabled={idx === 0}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                    title="Move up"
                                  >
                                    <ArrowUp className="size-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => moveSection(sec.id, 1)}
                                    disabled={idx === matchingSections.length - 1}
                                    className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30"
                                    title="Move down"
                                  >
                                    <ArrowDown className="size-3.5" />
                                  </button>
                                  {config.repeatable && (
                                    <button
                                      type="button"
                                      onClick={() => duplicateSection(sec.id)}
                                      className="p-1 text-slate-400 hover:text-slate-700"
                                      title="Duplicate"
                                    >
                                      <Copy className="size-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => removeSection(sec.id)}
                                    className="p-1 text-rose-500 hover:text-rose-700"
                                    title="Remove"
                                  >
                                    <Trash2 className="size-3.5" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {config.fields?.map(field => (
                                  <div
                                    key={field.key}
                                    className={field.type === 'textarea' || field.type === 'checkbox' ? 'sm:col-span-2' : ''}
                                  >
                                    <label className="mb-1 block text-xs font-bold text-slate-700">
                                      {field.label}
                                    </label>
                                    {renderField(sec, field)}
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          {config.repeatable && (
                            <button
                              type="button"
                              onClick={() => handleAddSectionType(currentStep.type)}
                              className="w-full py-3 rounded-2xl border-2 border-dashed border-slate-300 text-slate-700 hover:border-primary hover:text-primary font-bold text-xs flex items-center justify-center gap-1.5 transition-colors bg-white/60"
                            >
                              <Plus className="size-4" /> Add Another {config.label || 'Entry'}
                            </button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}

                {/* STEP: ADD SECTIONS CATALOG VIEW */}
                {currentStep.id === 'add-sections' && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm space-y-6">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div>
                          <h3 className="font-bold text-base text-slate-900">Add More Sections to Resume</h3>
                          <p className="text-xs text-slate-500">Pick any section below to immediately add it to your resume.</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowManualSectionModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-700"
                          >
                            <PenTool className="size-3.5" /> + Add Section Manually
                          </button>
                          <button
                            type="button"
                            onClick={() => setShowAddSectionModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-primary/90"
                          >
                            <Plus className="size-3.5" /> Full Modal Catalog
                          </button>
                        </div>
                      </div>

                      {/* Search Bar & Category Filter Pills */}
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                          <input
                            type="text"
                            value={catalogSearch}
                            onChange={e => setCatalogSearch(e.target.value)}
                            placeholder="Search sections (e.g. Internships, Publications, Hackathons, Languages...)"
                            className="w-full rounded-2xl border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                          />
                        </div>

                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {['All', ...SECTION_CATEGORIES.map(c => c.name)].map(category => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setCatalogCategory(category)}
                              className={`whitespace-nowrap rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                                catalogCategory === category
                                  ? 'bg-slate-900 text-white shadow-sm'
                                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Sections Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {Object.entries(ALL_SECTIONS).filter(([type, config]) => {
                          if (type === 'personal') return false
                          if (catalogCategory !== 'All') {
                            const cat = SECTION_CATEGORIES.find(c => c.name === catalogCategory)
                            if (cat && !cat.types.includes(type)) return false
                          }
                          if (catalogSearch.trim()) {
                            const q = catalogSearch.toLowerCase()
                            return config.label.toLowerCase().includes(q) || type.toLowerCase().includes(q)
                          }
                          return true
                        }).map(([type, config]) => {
                          const Icon = config.icon || Sparkles
                          const count = sections.filter(s => s.type === type).length
                          const isAdded = count > 0

                          return (
                            <div
                              key={type}
                              className={`p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all ${
                                isAdded
                                  ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900'
                                  : 'border-slate-200 bg-white hover:border-primary hover:shadow-sm'
                              }`}
                            >
                              <div className="flex items-center gap-3 truncate">
                                <div className={`size-9 rounded-xl flex items-center justify-center shrink-0 ${config.bgColor || 'bg-slate-100'}`}>
                                  <Icon className={`size-4 ${config.color || 'text-slate-600'}`} />
                                </div>
                                <div className="truncate">
                                  <h4 className="font-bold text-xs truncate">{config.label}</h4>
                                  <p className="text-[10px] text-slate-400">
                                    {isAdded ? `${count} ${count === 1 ? 'entry' : 'entries'}` : 'Click to add'}
                                  </p>
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleAddSectionType(type)}
                                disabled={isAdded && !config.repeatable}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                                  isAdded
                                    ? config.repeatable
                                      ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                      : 'bg-emerald-100 text-emerald-700 cursor-default'
                                    : 'bg-slate-900 text-white hover:bg-slate-800'
                                }`}
                              >
                                {isAdded ? (config.repeatable ? '+ Add' : 'Added') : '+ Add'}
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP: FINALIZE */}
                {currentStep.id === 'finalize' && (
                  <div className="space-y-6">
                    <div className="p-6 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-5">
                      <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
                        <CheckCircle2 className="size-8 text-emerald-600" />
                        <div>
                          <h3 className="font-bold text-base text-slate-900">Your Resume is Complete & Ready!</h3>
                          <p className="text-xs text-slate-500">Completeness: {completeness}% • Template: {currentTemplate.name}</p>
                        </div>
                      </div>

                      {/* Export action cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <button
                          onClick={handleDownloadPdf}
                          disabled={exporting}
                          className="p-4 rounded-xl bg-primary text-white font-bold text-xs shadow-md hover:bg-primary/95 flex flex-col items-center justify-center gap-1.5 transition-all"
                        >
                          <FileDown className="size-5" />
                          <span>Download PDF</span>
                        </button>

                        <button
                          onClick={handleDownloadDocx}
                          disabled={exporting}
                          className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white font-bold text-xs text-slate-800 shadow-sm flex flex-col items-center justify-center gap-1.5 transition-all"
                        >
                          <FileText className="size-5 text-blue-600" />
                          <span>Download DOCX</span>
                        </button>

                        <button
                          onClick={compileToPdf}
                          disabled={compiling}
                          className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 bg-white font-bold text-xs text-slate-800 shadow-sm flex flex-col items-center justify-center gap-1.5 transition-all"
                        >
                          <RefreshCw className={`size-5 text-emerald-600 ${compiling ? 'animate-spin' : ''}`} />
                          <span>Recompile Preview</span>
                        </button>
                      </div>

                      {/* PDF Preview Iframe if compiled */}
                      {pdfUrl && (
                        <div className="mt-4 border rounded-xl overflow-hidden shadow-inner">
                          <iframe src={pdfUrl} title="Resume PDF" className="w-full h-[500px] border-0" />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </>
        )}
      </div>

      {/* Bottom Step Navigation Bar */}
      <div className="pt-8 border-t border-slate-200/80 mt-10 flex items-center justify-between">
        {viewMode === 'all' ? (
          <>
            <button
              type="button"
              onClick={() => handleSave()}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary/95 transition-all"
            >
              {saving ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
              <span>Save Resume</span>
            </button>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={compileToPdf}
                disabled={compiling}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all shadow-xs"
              >
                <RefreshCw className={`size-3.5 ${compiling ? 'animate-spin' : ''}`} />
                <span>Recompile Preview</span>
              </button>

              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={exporting}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 transition-all"
              >
                <Download className="size-3.5" /> Download Final PDF
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Action Buttons for Guided Step */}
            <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between gap-4 mt-8">
              {currentStepIndex > 0 ? (
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <ArrowLeft className="size-3.5" /> Back
                </button>
              ) : <div />}

              <div className="text-xs font-bold text-slate-500 hidden sm:flex items-center gap-2">
                <span>Step {currentStepIndex + 1} of {dynamicSteps.length}:</span>
                <span className="text-slate-800">{dynamicSteps[currentStepIndex]?.label}</span>
              </div>

              <div className="flex items-center gap-3">
                {currentStepIndex < dynamicSteps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleNextStep}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-7 py-2.5 text-xs font-bold text-white shadow-md hover:bg-primary/95 active:scale-[0.98] transition-all"
                  >
                    <span>Next: {dynamicSteps[currentStepIndex + 1]?.label}</span>
                    <ArrowRight className="size-3.5" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleDownloadPdf}
                    className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-7 py-2.5 text-xs font-bold text-white shadow-md hover:bg-emerald-700 active:scale-[0.98] transition-all"
                  >
                    <Download className="size-3.5" /> Download Final PDF
                  </button>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </main>

        {/* Right Sticky Real-Time Live Preview Pane */}
        <aside className="w-full lg:w-[350px] xl:w-[390px] bg-slate-100/70 p-4 xl:p-5 border-l border-slate-200/80 shrink-0 hidden lg:flex flex-col justify-start lg:h-[calc(100vh-64px)] overflow-y-auto scrollbar-thin">
          <div className="sticky top-20 space-y-4">
            {/* Top Job Probability Badge */}
            <div className="flex items-center justify-between bg-white px-3.5 py-2 rounded-xl border border-slate-200/80 shadow-sm text-xs">
              <span className="font-semibold text-slate-600">Our Resume Builder delivers results</span>
              <span className="font-extrabold text-blue-600 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-lg text-[11px]">
                <TrendingUp className="size-3" /> ↑ 30% Higher Chance
              </span>
            </div>

            {/* Template Switcher Pill & Swatches */}
            <div className="flex items-center justify-between text-xs px-1">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-slate-800 text-[11px] truncate max-w-[170px]">
                  {currentTemplate.name}
                </span>
              </div>

              {/* Color Swatch Options */}
              <div className="flex items-center gap-1">
                {['15803d', 'd97706', 'dc2626', '0f172a', '0284c7', '7c3aed'].map(color => (
                  <button
                    key={color}
                    onClick={() => setSettings(s => ({ ...s, primaryColor: color }))}
                    className={`size-4 rounded-full transition-transform ${
                      settings.primaryColor === color ? 'scale-125 ring-2 ring-slate-400' : 'hover:scale-110'
                    }`}
                    style={{ backgroundColor: `#${color}` }}
                    title={`#${color}`}
                  />
                ))}
              </div>
            </div>

            {/* Live Interactive Resume Canvas */}
            <div className="relative group rounded-xl overflow-hidden shadow-xl border border-slate-200 bg-white">
              <ResumeLivePreview
                sections={sections}
                sectionOrder={sectionOrder}
                settings={settings}
                className="transform scale-100 transition-transform origin-top"
              />

              {/* Hover overlay with zoom button */}
              <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
                <button
                  onClick={() => setShowFullscreenPreview(true)}
                  className="px-4 py-2 rounded-xl bg-white text-slate-900 text-xs font-bold shadow-lg hover:bg-slate-100 flex items-center gap-1.5"
                >
                  <ZoomIn className="size-3.5" /> Fullscreen View
                </button>
              </div>
            </div>

            {/* Template Change CTA */}
            <div className="text-center">
              <Link
                to="/resume-templates"
                className="text-xs text-primary font-bold hover:underline inline-flex items-center gap-1"
              >
                Change to another template <ArrowRight className="size-3" />
              </Link>
            </div>
          </div>
        </aside>
      </div>

      {/* Add Section Catalog Modal */}
      <AddSectionModal
        isOpen={showAddSectionModal}
        onClose={() => setShowAddSectionModal(false)}
        sections={sections}
        onAddSection={handleAddSectionType}
        onCreateCustomSection={handleCreateCustomSection}
      />

      {/* Dedicated Manual Custom Section Modal */}
      <AddManualSectionModal
        isOpen={showManualSectionModal}
        onClose={() => setShowManualSectionModal(false)}
        onCreateCustomSection={handleCreateCustomSection}
      />

      {/* Full Resume Completeness & ATS Audit Modal */}
      <ResumeCompletenessModal
        isOpen={showCompletenessModal}
        onClose={() => setShowCompletenessModal(false)}
        sections={sections}
        onAddSection={handleAddSectionType}
      />

      {/* Fullscreen Preview Modal */}
      {showFullscreenPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-800">
                <FileText className="size-4 text-primary" />
                <span>{resumeTitle} — {currentTemplate.name}</span>
              </div>
              <button
                onClick={() => setShowFullscreenPreview(false)}
                className="size-8 rounded-full grid place-items-center hover:bg-slate-200 text-slate-500"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-slate-100">
              <div className="w-full max-w-2xl bg-white rounded-xl shadow-lg border border-slate-200">
                <ResumeLivePreview sections={sections} sectionOrder={sectionOrder} settings={settings} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Smart Auto-Fill & PDF/LinkedIn Import Modal */}
      {showAutoFillModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-500/20">
                  <Sparkles className="size-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Smart Resume Auto-Fill</h3>
                  <p className="text-xs text-slate-500">
                    Upload your resume PDF, paste LinkedIn export text, or sync from Bridge
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutoFillModal(false)}
                className="size-8 rounded-full grid place-items-center hover:bg-slate-200 text-slate-500 transition-colors"
              >
                <X className="size-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5">
              {/* Mode Tabs */}
              <div className="flex rounded-2xl bg-slate-100 p-1">
                <button
                  type="button"
                  onClick={() => setAutoFillTab('pdf')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    autoFillTab === 'pdf'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Upload className="size-3.5" />
                  <span>Upload PDF / Document</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAutoFillTab('paste')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    autoFillTab === 'paste'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FileText className="size-3.5" />
                  <span>Paste LinkedIn / Text</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAutoFillTab('sync')
                    handleSyncStudentProfile()
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    autoFillTab === 'sync'
                      ? 'bg-white text-indigo-600 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Zap className="size-3.5" />
                  <span>Sync Bridge Profile</span>
                </button>
              </div>

              {/* TAB 1: UPLOAD PDF */}
              {autoFillTab === 'pdf' && (
                <div className="space-y-4">
                  <div className="rounded-2xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 p-6 text-center transition-all cursor-pointer relative group">
                    <input
                      type="file"
                      accept=".pdf,.docx,.txt,.md,.json"
                      onChange={handlePdfUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="size-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                        {extractingFile ? (
                          <Loader2 className="size-6 animate-spin" />
                        ) : (
                          <Upload className="size-6" />
                        )}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800">
                          {extractingFile
                            ? 'Extracting & parsing file contents...'
                            : uploadedFileName
                            ? `Selected: ${uploadedFileName}`
                            : 'Click or drag & drop your resume PDF here'}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Supports LinkedIn PDF exports, existing resume PDFs, and text files (.pdf, .txt, .md)
                        </p>
                      </div>
                    </div>
                  </div>

                  {uploadedFileName && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
                      <div className="flex items-center gap-2 truncate">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span className="font-semibold text-slate-800 truncate">{uploadedFileName}</span>
                      </div>
                      <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md shrink-0">
                        {extractingFile ? 'Parsing...' : 'Ready to Apply'}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: PASTE LINKEDIN / RAW TEXT */}
              {autoFillTab === 'paste' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700">
                      Paste LinkedIn Export, Resume Text, or Profile Links
                    </label>
                    <button
                      type="button"
                      onClick={handleLoadSampleLinkedIn}
                      className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1"
                    >
                      <Sparkles className="size-3" />
                      <span>Load Sample LinkedIn Profile</span>
                    </button>
                  </div>

                  <textarea
                    rows={7}
                    value={autoFillText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    placeholder={`Paste your LinkedIn profile text or resume content here:\n\nSaanvi Patel\nFull Stack Engineer | React & Distributed Systems\nMumbai, India · saanvi@example.com · +91 98200 12345\nhttps://linkedin.com/in/saanvipatel\nhttps://github.com/saanvipatel\nhttps://saanvipatel.dev\nhttps://leetcode.com/saanvipatel\n\nExperience\nSenior Software Engineer\nZomato · Jun 2022 - Present\n• Scaled dispatch engine to 1M+ daily deliveries...`}
                    className="w-full rounded-2xl border border-slate-300 p-3.5 text-xs text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20 focus:outline-hidden font-mono"
                  />
                </div>
              )}

              {/* TAB 3: SYNC BRIDGE PROFILE */}
              {autoFillTab === 'sync' && (
                <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
                  {loadingSync ? (
                    <div className="py-6 flex flex-col items-center gap-2">
                      <Loader2 className="size-6 text-indigo-600 animate-spin" />
                      <span className="text-xs font-semibold text-slate-600">Fetching student profile data...</span>
                    </div>
                  ) : detectedData ? (
                    <div className="text-left space-y-2">
                      <div className="font-bold text-sm text-slate-900">{detectedData.personal.name}</div>
                      <div className="text-xs text-indigo-600 font-semibold">{detectedData.personal.professionalTitle}</div>
                      <div className="text-xs text-slate-600">
                        {detectedData.personal.email} • {detectedData.personal.phone || detectedData.personal.location}
                      </div>
                      <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                        Profile loaded with {detectedData.experience?.length || 0} work experiences and education history.
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 space-y-2">
                      <p className="text-xs text-slate-600">
                        Sync your saved Bridge account profile details directly into this resume.
                      </p>
                      <button
                        type="button"
                        onClick={handleSyncStudentProfile}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 shadow-sm"
                      >
                        <RefreshCw className="size-3.5" />
                        <span>Fetch Student Profile</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* LIVE SMART DETECTION SUMMARY */}
              {detectedData && (
                <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/90 via-blue-50/60 to-purple-50/50 border border-indigo-200 space-y-3">
                  <div className="flex items-center justify-between border-b border-indigo-100 pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-slate-900">
                        Parsed Candidate: <span className="text-indigo-900">{detectedData.personal.name}</span>
                        {detectedData.personal.professionalTitle ? ` (${detectedData.personal.professionalTitle})` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      ✓ Ready to populate
                    </span>
                  </div>

                  {/* Contact Badges */}
                  <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                    {detectedData.personal.email && (
                      <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-lg">
                        📧 {detectedData.personal.email}
                      </span>
                    )}
                    {detectedData.personal.phone && (
                      <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-lg">
                        📞 {detectedData.personal.phone}
                      </span>
                    )}
                    {detectedData.personal.location && (
                      <span className="bg-white/80 border border-slate-200 px-2 py-0.5 rounded-lg">
                        📍 {detectedData.personal.location}
                      </span>
                    )}
                  </div>

                  {/* Smart Links Classification Box */}
                  <div className="rounded-xl bg-white/90 border border-indigo-100 p-2.5 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-indigo-900 flex items-center gap-1">
                        <Globe className="size-3 text-indigo-600" />
                        <span>Smart Links Intelligence:</span>
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {detectedData.extraLinks?.length ? `${detectedData.extraLinks.length + (detectedData.personal.linkedin ? 1 : 0) + (detectedData.personal.github ? 1 : 0)} links classified` : 'Links detected'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {detectedData.personal.linkedin && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                          <Linkedin className="size-2.5" /> LinkedIn Placeholder ✓
                        </span>
                      )}
                      {detectedData.personal.github && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-300">
                          <Github className="size-2.5" /> GitHub Placeholder ✓
                        </span>
                      )}
                      {(detectedData.personal.portfolio || detectedData.personal.website) && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                          <ExternalLink className="size-2.5" /> Portfolio/Web ✓
                        </span>
                      )}
                      {detectedData.extraLinks?.map((ex, i) => (
                        <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                          ⭐ {ex.platform}: auto-fill placeholder
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Section Counts Summary */}
                  <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                    <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                      <div className="text-sm font-black text-indigo-600">{detectedData.experience?.length || 0}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Experiences</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                      <div className="text-sm font-black text-amber-600">{detectedData.education?.length || 0}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Education</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                      <div className="text-sm font-black text-cyan-600">
                        {(detectedData.skills?.technical ? detectedData.skills.technical.split(',').length : 0) + (detectedData.skills?.frameworks ? detectedData.skills.frameworks.split(',').length : 0)}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Skills</div>
                    </div>
                    <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                      <div className="text-sm font-black text-orange-600">{detectedData.projects?.length || 0}</div>
                      <div className="text-[10px] font-bold text-slate-500 uppercase">Projects</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowAutoFillModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200/70 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={!detectedData || extractingFile}
                onClick={() => handleApplySmartAutoFill(detectedData)}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-500/20 hover:from-purple-500 hover:to-blue-500 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="size-3.5 fill-current" />
                <span>Auto-Fill into Resume Placeholders</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
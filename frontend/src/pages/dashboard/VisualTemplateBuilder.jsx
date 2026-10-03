import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Sparkles, Palette, Layout, Type, ShieldCheck, 
  Eye, Save, Share2, Check, RefreshCw, ZoomIn, ZoomOut,
  Sliders, Plus, Trash2, Globe, Lock, ArrowRight, HelpCircle,
  User, Mail, Phone, MapPin, Linkedin, Github, ExternalLink,
  Briefcase, GraduationCap, Award, Code, Layers, SlidersHorizontal,
  FileText, CheckCircle2, MoveUp, MoveDown, Circle, Square,
  Maximize2, Minimize2, Languages, SlidersVertical, Compass,
  Sliders as SlidersIcon, FolderGit2, Upload, X, Loader2, FileUp
} from 'lucide-react'
import { toast } from 'sonner'
import axios from '@/lib/axios'
import { parseResumeRawText, classifyLinks } from '@/utils/smartResumeParser'

// 10 Curated Recruiter-Approved Color Palettes
const COLOR_PRESETS = [
  { name: 'Royal Blue', hex: '#2563eb', bg: '#eff6ff', primary: '2563eb' },
  { name: 'Emerald Pro', hex: '#059669', bg: '#ecfdf5', primary: '059669' },
  { name: 'Slate Executive', hex: '#334155', bg: '#f8fafc', primary: '334155' },
  { name: 'Ruby Crimson', hex: '#dc2626', bg: '#fef2f2', primary: 'dc2626' },
  { name: 'Indigo Modern', hex: '#4f46e5', bg: '#eef2ff', primary: '4f46e5' },
  { name: 'Teal Minimal', hex: '#0d9488', bg: '#f0fdfa', primary: '0d9488' },
  { name: 'Amber Warmth', hex: '#d97706', bg: '#fffbeb', primary: 'd97706' },
  { name: 'Midnight Dark', hex: '#0f172a', bg: '#f1f5f9', primary: '0f172a' },
  { name: 'Rose Gold', hex: '#e11d48', bg: '#fff1f2', primary: 'e11d48' },
  { name: 'Violet Cyber', hex: '#7c3aed', bg: '#f5f3ff', primary: '7c3aed' },
]

// 6 Core Layout Architectures
const LAYOUT_STYLES = [
  { id: 'split-sidebar', name: 'Sidebar Left', desc: 'Modern tech & engineering layout with sidebar skills', icon: 'left' },
  { id: 'split-sidebar-right', name: 'Sidebar Right', desc: 'European executive layout with right-hand rail', icon: 'right' },
  { id: 'top-banner', name: 'Top Banner Header', desc: 'Bold header accent banner with full-width flow', icon: 'top' },
  { id: 'clean-minimal', name: 'Clean Minimal 1-Col', desc: 'Classic single column maximizing ATS scanner parsing', icon: 'minimal' },
  { id: 'modern-cards', name: 'Card Structured', desc: 'Subtle container boxes highlighting achievements', icon: 'cards' },
  { id: 'ivy-league', name: 'Ivy League Academic', desc: 'Prestigious double-rule header for finance & law', icon: 'ivy' }
]

// 8 Professional Font Options
const FONT_OPTIONS = [
  { id: 'sans', name: 'Plus Jakarta Sans', style: 'font-sans', tag: 'Modern Clean' },
  { id: 'inter', name: 'Inter Clean', style: 'font-sans', tag: 'Sleek Tech' },
  { id: 'outfit', name: 'Outfit Modern', style: 'font-sans', tag: 'Geometric' },
  { id: 'serif', name: 'Merriweather Serif', style: 'font-serif', tag: 'Executive' },
  { id: 'playfair', name: 'Playfair Display', style: 'font-serif', tag: 'Editorial' },
  { id: 'mono', name: 'JetBrains Monospace', style: 'font-mono', tag: 'Developer' },
  { id: 'poppins', name: 'Poppins Rounded', style: 'font-sans', tag: 'Creative' },
  { id: 'slab', name: 'Roboto Slab', style: 'font-serif', tag: 'Contemporary' },
]

export default function VisualTemplateBuilder() {
  const navigate = useNavigate()

  // 1. Template Metadata State
  const [templateName, setTemplateName] = useState('My Custom Template')
  const [shortName, setShortName] = useState('Custom Pro')
  const [category, setCategory] = useState('Engineering & Tech')

  // 2. Layout & Page Geometry
  const [layoutStyle, setLayoutStyle] = useState('split-sidebar')
  const [sidebarWidth, setSidebarWidth] = useState(34)
  const [paperBg, setPaperBg] = useState('white') // 'white' | 'ivory' | 'slate' | 'linen'
  const [pagePadding, setPagePadding] = useState('normal') // 'compact' | 'normal' | 'spacious'
  const [sectionSpacing, setSectionSpacing] = useState('normal') // 'tight' | 'normal' | 'relaxed'
  const [leftRibbon, setLeftRibbon] = useState(false) // 4px colored accent ribbon down left border

  // 3. Header & Contact Styling
  const [headerAlign, setHeaderAlign] = useState('left') // 'left' | 'center' | 'split'
  const [nameSize, setNameSize] = useState('large') // 'normal' | 'large' | 'huge'
  const [nameWeight, setNameWeight] = useState('black') // 'bold' | 'extrabold' | 'black'
  const [nameCase, setNameCase] = useState('uppercase') // 'uppercase' | 'capitalize'
  const [roleStyle, setRoleStyle] = useState('subtitle') // 'subtitle' | 'badge' | 'italic'
  const [contactLayout, setContactLayout] = useState('inline') // 'inline' | 'grid' | 'stacked'
  const [contactIcons, setContactIcons] = useState(true)
  const [showPhoto, setShowPhoto] = useState(false)
  const [photoShape, setPhotoShape] = useState('circle') // 'circle' | 'rounded' | 'square'
  const [photoUrl, setPhotoUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&h=160&fit=crop&crop=faces')
  const [showSocials, setShowSocials] = useState(true)

  // 4. Section Headings & Dividers
  const [headingStyle, setHeadingStyle] = useState('bottom-line') // 'bottom-line' | 'left-bar' | 'colored-pill' | 'minimal-caps' | 'double-line' | 'icon-badge'
  const [headingCase, setHeadingCase] = useState('uppercase') // 'uppercase' | 'capitalize'
  const [headingSize, setHeadingSize] = useState('medium') // 'small' | 'medium' | 'large'
  const [showSectionIcons, setShowSectionIcons] = useState(true)

  // 5. Skills Presentation
  const [skillsStyle, setSkillsStyle] = useState('badges-filled') // 'badges-filled' | 'badges-outline' | 'dot-separated' | 'comma-separated' | 'progress-bars'

  // 6. Experience & Education Details
  const [bulletStyle, setBulletStyle] = useState('dot') // 'dot' | 'arrow' | 'check' | 'dash' | 'square'
  const [datePosition, setDatePosition] = useState('right') // 'right' | 'subline'
  const [companyPosition, setCompanyPosition] = useState('below') // 'below' | 'above'

  // 7. Typography & Colors
  const [fontFamily, setFontFamily] = useState('sans')
  const [fontSizeScale, setFontSizeScale] = useState('11pt') // '10pt' | '11pt' | '12pt'
  const [selectedColor, setSelectedColor] = useState(COLOR_PRESETS[0])

  // 8. Active Sections & Ordering
  const [activeSections, setActiveSections] = useState({
    summary: true,
    experience: true,
    education: true,
    skills: true,
    projects: true,
    certifications: true,
    languages: true
  })
  const [sectionOrder, setSectionOrder] = useState([
    'summary',
    'experience',
    'skills',
    'projects',
    'education',
    'certifications',
    'languages'
  ])

  // Sample User Data for Live Preview
  const [sampleUser, setSampleUser] = useState({
    name: 'Alex Morgan',
    role: 'Lead Full Stack Engineer',
    email: 'alex.morgan@example.com',
    phone: '+1 (555) 234-5678',
    location: 'San Francisco, CA',
    linkedin: 'linkedin.com/in/alexmorgan',
    github: 'github.com/alexmorgan-dev',
    portfolio: 'alexmorgan.dev',
    website: 'alexmorgan.dev',
    leetcode: 'leetcode.com/alexmorgan',
    twitter: '',
    medium: '',
    extraLinks: [],
    summary: 'Results-driven software engineer with 6+ years designing scalable cloud architectures, high-performance web applications, and resilient microservices. Adept at cross-functional leadership and modern DevOps.',
    skills: [
      { name: 'React', level: 95 },
      { name: 'TypeScript', level: 90 },
      { name: 'Node.js', level: 92 },
      { name: 'PostgreSQL', level: 85 },
      { name: 'Docker & K8s', level: 88 },
      { name: 'AWS Cloud', level: 86 },
      { name: 'Next.js', level: 90 },
      { name: 'GraphQL', level: 82 }
    ],
    experience: [
      {
        role: 'Senior Software Engineer',
        company: 'CloudScale Technologies',
        duration: '2022 - Present',
        location: 'San Francisco, CA',
        points: [
          'Spearheaded transition of core monolith to containerized microservices, lowering latency by 42%.',
          'Architected real-time analytics pipeline processing 5M+ daily events with 99.99% uptime.',
          'Mentored 6 junior engineers and institutionalized automated CI/CD unit testing across engineering squads.'
        ]
      },
      {
        role: 'Full Stack Developer',
        company: 'Vanguard Digital Solutions',
        duration: '2019 - 2022',
        location: 'San Jose, CA',
        points: [
          'Built responsive customer dashboards with React and Redux, improving user retention by 28%.',
          'Automated deployment pipelines using GitHub Actions, cutting release cycles from 3 days to 15 minutes.'
        ]
      }
    ],
    education: {
      degree: 'B.S. in Computer Science',
      institution: 'Stanford University',
      duration: '2015 - 2019',
      location: 'Stanford, CA',
      gpa: '3.9 / 4.0'
    },
    projects: [
      {
        name: 'Distributed Key-Value Store',
        tech: 'Go, Raft Consensus, Docker',
        desc: 'Implemented distributed consensus engine in Go capable of sub-10ms linearizable writes across 5 nodes.'
      },
      {
        name: 'AI Agent Workflow Orchestrator',
        tech: 'TypeScript, Next.js, OpenAI API',
        desc: 'Built drag-and-drop autonomous workflow builder with 2,400+ GitHub stars and active developer community.'
      }
    ],
    certifications: [
      { title: 'AWS Certified Solutions Architect – Associate', issuer: 'Amazon Web Services', year: '2023' },
      { title: 'Certified Kubernetes Administrator (CKA)', issuer: 'Linux Foundation', year: '2022' }
    ],
    languages: [
      { language: 'English', fluency: 'Native / Bilingual' },
      { language: 'Spanish', fluency: 'Professional Working' }
    ]
  })

  // Active Tab in Editor Sidebar
  const [activeTab, setActiveTab] = useState('layout') 
  // 'layout' | 'header' | 'headings' | 'skills' | 'colors' | 'sections' | 'content' | 'ats'
  
  const [zoom, setZoom] = useState(100)
  const [viewMode, setViewMode] = useState('both') // 'both' | 'editor' | 'preview'
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [publishDescription, setPublishDescription] = useState('An ATS-optimized modern resume template engineered for tech and product roles.')
  const [isPublic, setIsPublic] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Auto-Fill & Profile Import State
  const [isAutoFillModalOpen, setIsAutoFillModalOpen] = useState(false)
  const [autoFillText, setAutoFillText] = useState('')
  const [autoFillTab, setAutoFillTab] = useState('pdf') // 'pdf' | 'paste' | 'sync'
  const [detectedProfile, setDetectedProfile] = useState(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const [extractingPdf, setExtractingPdf] = useState(false)
  const [uploadedPdfName, setUploadedPdfName] = useState('')

  const handleAutoFillParse = (text) => {
    setAutoFillText(text)
    if (!text || text.trim().length < 15) {
      setDetectedProfile(null)
      return
    }
    const parsed = parseResumeRawText(text)
    setDetectedProfile(parsed)
  }

  // Handle PDF / file upload with backend text extraction
  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadedPdfName(file.name)
    setExtractingPdf(true)

    try {
      const ext = file.name.split('.').pop().toLowerCase()
      if (ext === 'txt' || ext === 'md' || ext === 'json' || ext === 'tex') {
        const text = await file.text()
        setAutoFillText(text)
        const parsed = parseResumeRawText(text)
        setDetectedProfile(parsed)
        toast.success(`Extracted text from ${file.name}`)
      } else {
        const formData = new FormData()
        formData.append('file', file)

        const res = await fetch('/api/resume-templates/extract-file', {
          method: 'POST',
          body: formData,
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.message || 'Failed to extract text from file')

        if (data.text) {
          setAutoFillText(data.text)
          const parsed = parseResumeRawText(data.text)
          setDetectedProfile(parsed)
          toast.success(`Successfully parsed PDF "${file.name}"!`)
        } else {
          toast.warning('PDF has no extractable text. If it is a scanned image, please paste text instead.')
        }
      }
    } catch (err) {
      console.error('PDF upload error:', err)
      toast.error(err.message || 'Failed to read PDF file')
    } finally {
      setExtractingPdf(false)
    }
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
• Automated CI/CD deployment pipelines using GitHub Actions, cutting release cycles from 2 hours to 8 minutes.

Education
Indian Institute of Technology Bombay (IIT Bombay)
B.Tech in Computer Science and Engineering · 2016 - 2020 · 8.9 CGPA

Technical Skills
JavaScript, TypeScript, Python, Go, C++, SQL, HTML, CSS, React, Next.js, Node.js, Express, Docker, Kubernetes, AWS, PostgreSQL, MongoDB, Redis, GraphQL, Git, Agile Leadership, Problem Solving`
    handleAutoFillParse(sample)
    toast.info('Sample LinkedIn profile loaded with 5 links and work history!')
  }

  const handleSyncBridgeProfile = async () => {
    setLoadingProfile(true)
    try {
      const localDraft = localStorage.getItem('bridge_resume_draft')
      if (localDraft) {
        const parsed = JSON.parse(localDraft)
        if (parsed.sections?.length) {
          const personal = parsed.sections.find(s => s.type === 'personal') || {}
          const summary = parsed.sections.find(s => s.type === 'summary') || {}
          const exp = parsed.sections.filter(s => s.type === 'experience')
          const edu = parsed.sections.filter(s => s.type === 'education')
          const skills = parsed.sections.find(s => s.type === 'skills') || {}

          const profileObj = {
            name: personal.name || 'Alex Morgan',
            role: personal.professionalTitle || 'Software Engineer',
            email: personal.email || 'alex@example.com',
            phone: personal.phone || '',
            location: personal.location || '',
            linkedin: personal.linkedin || '',
            github: personal.github || '',
            summary: summary.summary || '',
            skills: (skills.technical || '').split(',').map(s => s.trim()).filter(Boolean),
            experience: exp.map(e => ({
              role: e.role || '',
              company: e.company || '',
              duration: `${e.startDate || ''} -- ${e.current ? 'Present' : e.endDate || ''}`,
              location: e.location || '',
              points: (e.description || '').split('\n').map(p => p.trim()).filter(Boolean)
            })),
            education: edu.map(ed => ({
              institution: ed.institution || '',
              degree: ed.degree || '',
              duration: `${ed.startYear || ''} -- ${ed.endYear || ''}`,
              gpa: ed.gpa || ''
            }))
          }
          setDetectedProfile(profileObj)
          return
        }
      }

      const res = await axios.get('/student/profile')
      if (res.data?.profile) {
        const p = res.data.profile
        const profileObj = {
          name: `${res.data.user?.firstName || ''} ${res.data.user?.lastName || ''}`.trim() || p.fullName || 'Student Candidate',
          role: p.headline || p.targetRole || 'Software Engineer',
          email: res.data.user?.email || p.email || '',
          phone: p.phone || '',
          location: p.location || '',
          linkedin: p.linkedin || '',
          github: p.github || '',
          summary: p.bio || '',
          skills: p.skills || [],
          experience: (p.experience || []).map(e => ({
            role: e.title || e.role,
            company: e.company,
            duration: `${e.startDate ? new Date(e.startDate).getFullYear() : ''} -- ${e.current ? 'Present' : (e.endDate ? new Date(e.endDate).getFullYear() : '')}`,
            location: e.location || '',
            points: [e.description || '']
          })),
          education: (p.education || []).map(ed => ({
            institution: ed.institution || ed.school,
            degree: ed.degree,
            duration: `${ed.startYear || ''} -- ${ed.endYear || ''}`,
            gpa: ''
          }))
        }
        setDetectedProfile(profileObj)
      }
    } catch (_) {
      // Offline fallback
    } finally {
      setLoadingProfile(false)
    }
  }

  const handleApplyAutoFill = (parsed) => {
    if (!parsed) return
    const pers = parsed.personal || parsed

    // Parse skills into array of { name, level: 85 }
    let skillItems = []
    if (parsed.skills && typeof parsed.skills === 'object' && !Array.isArray(parsed.skills)) {
      const combined = [parsed.skills.technical, parsed.skills.frameworks, parsed.skills.soft]
        .filter(Boolean)
        .join(', ')
      skillItems = combined.split(',').map(s => s.trim()).filter(Boolean).map(s => ({ name: s, level: 85 }))
    } else if (Array.isArray(parsed.skills)) {
      skillItems = parsed.skills.map(s => (typeof s === 'string' ? { name: s, level: 85 } : s))
    }

    setSampleUser(prev => ({
      name: pers.name || parsed.name || prev.name,
      role: pers.professionalTitle || pers.role || parsed.role || prev.role,
      email: pers.email || parsed.email || prev.email,
      phone: pers.phone || parsed.phone || prev.phone,
      location: pers.location || parsed.location || prev.location,
      linkedin: pers.linkedin || parsed.linkedin || prev.linkedin,
      github: pers.github || parsed.github || prev.github,
      portfolio: pers.portfolio || pers.website || parsed.portfolio || parsed.website || prev.portfolio,
      website: pers.website || pers.portfolio || parsed.website || parsed.portfolio || prev.website,
      leetcode: pers.leetcode || parsed.leetcode || prev.leetcode,
      twitter: pers.twitter || parsed.twitter || prev.twitter,
      medium: pers.medium || parsed.medium || prev.medium,
      extraLinks: parsed.extraLinks || prev.extraLinks,
      summary: parsed.summary || prev.summary,
      skills: skillItems.length > 0 ? skillItems : prev.skills,
      experience: parsed.experience && parsed.experience.length > 0
        ? parsed.experience.map(e => ({
            role: e.role || '',
            company: e.company || '',
            duration: e.duration || (e.startDate ? `${e.startDate} - ${e.current ? 'Present' : (e.endDate || '')}` : ''),
            location: e.location || '',
            points: Array.isArray(e.points) ? e.points : (e.description ? e.description.split('\n').map(p => p.trim()).filter(Boolean) : [])
          }))
        : prev.experience,
      education: parsed.education && parsed.education.length > 0
        ? {
            degree: parsed.education[0].degree || '',
            institution: parsed.education[0].institution || '',
            duration: parsed.education[0].duration || (parsed.education[0].startYear ? `${parsed.education[0].startYear} - ${parsed.education[0].endYear || ''}` : ''),
            location: parsed.education[0].location || '',
            gpa: parsed.education[0].gpa || ''
          }
        : prev.education,
      projects: parsed.projects && parsed.projects.length > 0
        ? parsed.projects.map(p => ({
            name: p.projectName || p.name || 'Project',
            tech: p.projectTechnologies || p.tech || '',
            desc: p.projectDescription || p.desc || ''
          }))
        : prev.projects
    }))
    setIsAutoFillModalOpen(false)
    toast.success('Resume details auto-filled successfully!')
  }

  // Calculate ATS Score Dynamically
  const atsMetrics = useMemo(() => {
    let score = 70
    if (layoutStyle === 'clean-minimal' || layoutStyle === 'ivy-league') score += 18
    else if (layoutStyle === 'split-sidebar' || layoutStyle === 'split-sidebar-right') score += 15
    else score += 14

    if (fontFamily === 'sans' || fontFamily === 'inter') score += 6
    if (sampleUser.email && sampleUser.phone && sampleUser.location) score += 4
    if (skillsStyle === 'comma-separated' || skillsStyle === 'dot-separated' || skillsStyle === 'badges-filled') score += 2
    return Math.min(score, 99)
  }, [layoutStyle, fontFamily, sampleUser, skillsStyle])

  // Move Section Up/Down in Order
  const shiftSection = (secKey, direction) => {
    const currentIndex = sectionOrder.indexOf(secKey)
    if (currentIndex === -1) return
    const targetIndex = currentIndex + direction
    if (targetIndex < 0 || targetIndex >= sectionOrder.length) return
    const newOrder = [...sectionOrder]
    const temp = newOrder[currentIndex]
    newOrder[currentIndex] = newOrder[targetIndex]
    newOrder[targetIndex] = temp
    setSectionOrder(newOrder)
  }

  // Handle Publish Submission
  const handlePublishTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Please enter a template name')
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        name: templateName.trim(),
        shortName: shortName.trim() || templateName.trim().slice(0, 15),
        category,
        type: 'visual',
        badges: ['Custom', 'Visual Studio'],
        primaryColor: selectedColor.primary,
        colorHex: selectedColor.hex,
        accentBg: selectedColor.bg,
        fontFamily,
        atsScore: atsMetrics,
        layoutStyle,
        sidebarWidth,
        description: publishDescription,
        customConfig: {
          paperBg,
          pagePadding,
          sectionSpacing,
          leftRibbon,
          headerAlign,
          nameSize,
          nameWeight,
          nameCase,
          roleStyle,
          contactLayout,
          contactIcons,
          showPhoto,
          photoShape,
          photoUrl,
          showSocials,
          headingStyle,
          headingCase,
          headingSize,
          showSectionIcons,
          skillsStyle,
          bulletStyle,
          datePosition,
          companyPosition,
          fontSizeScale,
          activeSections,
          sectionOrder
        },
        sampleUser,
        isPublic
      }

      const res = await axios.post('/resume-templates', payload)
      toast.success(res.data?.message || 'Template published to community gallery!')
      setIsPublishModalOpen(false)
      navigate('/resume-templates')
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to publish template')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle direct test in builder
  const handleTestInBuilder = () => {
    const customTpl = {
      id: 'custom-visual',
      name: templateName.trim() || 'My Custom Template',
      shortName: shortName.trim() || 'Custom Pro',
      category,
      badges: ['Custom', 'Visual Studio'],
      primaryColor: selectedColor.primary,
      colorHex: selectedColor.hex,
      accentBg: selectedColor.bg,
      fontFamily,
      atsScore: atsMetrics,
      layoutStyle,
      sidebarWidth,
      customConfig: {
        paperBg,
        pagePadding,
        sectionSpacing,
        leftRibbon,
        headerAlign,
        nameSize,
        nameWeight,
        nameCase,
        roleStyle,
        contactLayout,
        contactIcons,
        showPhoto,
        photoShape,
        photoUrl,
        showSocials,
        headingStyle,
        headingCase,
        headingSize,
        showSectionIcons,
        skillsStyle,
        bulletStyle,
        datePosition,
        companyPosition,
        fontSizeScale,
        activeSections,
        sectionOrder
      },
      sampleUser: {
        name: sampleUser.name,
        role: sampleUser.role,
        email: sampleUser.email,
        phone: sampleUser.phone,
        location: sampleUser.location,
        summary: sampleUser.summary,
        skills: sampleUser.skills.map(s => s.name || s),
        experience: sampleUser.experience,
        education: `${sampleUser.education.degree} — ${sampleUser.education.institution} (${sampleUser.education.duration})`
      }
    }
    try {
      localStorage.setItem('bridge_custom_template', JSON.stringify(customTpl))
    } catch (e) {
      console.error('Failed to store custom template', e)
    }
    toast.success('Loading your custom template into Resume Builder...')
    navigate('/resume-builder?template=custom-visual')
  }

  // Paper background color helper
  const paperBgColor = useMemo(() => {
    if (paperBg === 'ivory') return '#fdfbf7'
    if (paperBg === 'slate') return '#f8fafc'
    if (paperBg === 'linen') return '#fafaf9'
    return '#ffffff'
  }, [paperBg])

  // Bullet point symbol helper
  const getBulletSymbol = () => {
    if (bulletStyle === 'arrow') return '▸'
    if (bulletStyle === 'check') return '✓'
    if (bulletStyle === 'dash') return '—'
    if (bulletStyle === 'square') return '▪'
    return '•'
  }

  // Section Heading Component
  const renderHeading = (title, iconKey, isSidebar = false) => {
    const IconComp = iconKey === 'profile' ? User :
                     iconKey === 'experience' ? Briefcase :
                     iconKey === 'skills' ? Code :
                     iconKey === 'education' ? GraduationCap :
                     iconKey === 'projects' ? FolderGit2 :
                     iconKey === 'certifications' ? Award :
                     iconKey === 'languages' ? Languages : Sparkles

    const textTransformClass = headingCase === 'uppercase' ? 'uppercase tracking-wider' : 'capitalize'
    const textSizeClass = headingSize === 'small' ? 'text-[11px]' : headingSize === 'large' ? 'text-[13.5px]' : 'text-[12px]'

    if (headingStyle === 'left-bar') {
      return (
        <div className="flex items-center gap-2 mb-3 pl-2.5 border-l-4" style={{ borderColor: selectedColor.hex }}>
          {showSectionIcons && <IconComp className="size-3.5 shrink-0" style={{ color: selectedColor.hex }} />}
          <h2 className={`font-black text-slate-900 ${textSizeClass} ${textTransformClass}`}>
            {title}
          </h2>
        </div>
      )
    }

    if (headingStyle === 'colored-pill') {
      return (
        <div 
          className="flex items-center gap-2 mb-3 px-3 py-1 rounded-lg text-white font-bold"
          style={{ backgroundColor: selectedColor.hex }}
        >
          {showSectionIcons && <IconComp className="size-3.5 shrink-0 text-white" />}
          <h2 className={`${textSizeClass} ${textTransformClass}`}>
            {title}
          </h2>
        </div>
      )
    }

    if (headingStyle === 'double-line') {
      return (
        <div className="mb-3">
          <div className="flex items-center gap-2 pb-1 border-b" style={{ borderColor: selectedColor.hex }}>
            {showSectionIcons && <IconComp className="size-3.5 shrink-0" style={{ color: selectedColor.hex }} />}
            <h2 className={`font-black text-slate-900 ${textSizeClass} ${textTransformClass}`}>
              {title}
            </h2>
          </div>
          <div className="h-0.5 mt-0.5" style={{ backgroundColor: `${selectedColor.hex}40` }} />
        </div>
      )
    }

    if (headingStyle === 'icon-badge') {
      return (
        <div className="flex items-center gap-2 mb-3 pb-1 border-b" style={{ borderColor: `${selectedColor.hex}30` }}>
          <div 
            className="size-6 rounded-lg flex items-center justify-center text-white shrink-0 shadow-2xs"
            style={{ backgroundColor: selectedColor.hex }}
          >
            <IconComp className="size-3.5" />
          </div>
          <h2 className={`font-black text-slate-900 ${textSizeClass} ${textTransformClass}`}>
            {title}
          </h2>
        </div>
      )
    }

    if (headingStyle === 'minimal-caps') {
      return (
        <div className="flex items-center gap-2 mb-2">
          {showSectionIcons && <IconComp className="size-3.5 shrink-0" style={{ color: selectedColor.hex }} />}
          <h2 className={`font-black ${textSizeClass} ${textTransformClass}`} style={{ color: selectedColor.hex }}>
            {title}
          </h2>
        </div>
      )
    }

    // Default: 'bottom-line'
    return (
      <div 
        className="flex items-center gap-2 pb-1.5 mb-3 border-b-2"
        style={{ borderColor: selectedColor.hex }}
      >
        {showSectionIcons && <IconComp className="size-3.5 shrink-0" style={{ color: selectedColor.hex }} />}
        <h2 
          className={`font-black ${textSizeClass} ${textTransformClass}`}
          style={{ color: isSidebar ? selectedColor.hex : '#0f172a' }}
        >
          {title}
        </h2>
      </div>
    )
  }

  // Skills Content Component
  const renderSkills = (isSidebar = false) => {
    if (!activeSections.skills) return null

    if (skillsStyle === 'progress-bars') {
      return (
        <div className="space-y-2">
          {sampleUser.skills.map((s, idx) => (
            <div key={idx} className="space-y-0.5">
              <div className="flex justify-between text-[10.5px] font-semibold text-slate-700">
                <span>{s.name}</span>
                <span className="text-[10px] text-slate-400">{s.level}%</span>
              </div>
              <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${s.level}%`, backgroundColor: selectedColor.hex }}
                />
              </div>
            </div>
          ))}
        </div>
      )
    }

    if (skillsStyle === 'badges-outline') {
      return (
        <div className="flex flex-wrap gap-1.5">
          {sampleUser.skills.map((s, idx) => (
            <span
              key={idx}
              className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-md border text-slate-800 bg-white"
              style={{ borderColor: `${selectedColor.hex}60` }}
            >
              {s.name}
            </span>
          ))}
        </div>
      )
    }

    if (skillsStyle === 'dot-separated') {
      return (
        <div className="text-[11.5px] text-slate-800 leading-relaxed font-medium">
          {sampleUser.skills.map(s => s.name).join(' • ')}
        </div>
      )
    }

    if (skillsStyle === 'comma-separated') {
      return (
        <div className="text-[11.5px] text-slate-800 leading-relaxed font-normal">
          {sampleUser.skills.map(s => s.name).join(', ')}
        </div>
      )
    }

    // Default: 'badges-filled'
    return (
      <div className="flex flex-wrap gap-1.5">
        {sampleUser.skills.map((s, idx) => (
          <span
            key={idx}
            className="text-[10.5px] font-semibold px-2.5 py-1 rounded-md transition-all shadow-2xs"
            style={{ 
              backgroundColor: isSidebar ? '#ffffff' : selectedColor.bg,
              color: selectedColor.hex,
              border: `1px solid ${selectedColor.hex}30`
            }}
          >
            {s.name}
          </span>
        ))}
      </div>
    )
  }

  // Header Component
  const renderHeader = () => {
    const alignClass = headerAlign === 'center' ? 'text-center items-center' :
                       headerAlign === 'split' ? 'flex flex-row items-center justify-between' :
                       'text-left items-start'

    const nameSizeClass = nameSize === 'normal' ? 'text-xl' : nameSize === 'huge' ? 'text-3xl sm:text-4xl' : 'text-2xl sm:text-3xl'
    const nameWeightClass = nameWeight === 'bold' ? 'font-bold' : nameWeight === 'extrabold' ? 'font-extrabold' : 'font-black'
    const nameCaseClass = nameCase === 'uppercase' ? 'uppercase tracking-tight' : 'capitalize'

    return (
      <div className={`flex flex-col ${alignClass} pb-5 border-b`} style={{ borderColor: `${selectedColor.hex}25` }}>
        <div className="flex items-center gap-4">
          {/* Optional Profile Photo */}
          {showPhoto && (
            <img 
              src={photoUrl} 
              alt={sampleUser.name} 
              className={`size-16 sm:size-20 object-cover border-2 shadow-md shrink-0 ${
                photoShape === 'circle' ? 'rounded-full' : photoShape === 'rounded' ? 'rounded-2xl' : 'rounded-none'
              }`}
              style={{ borderColor: selectedColor.hex }}
            />
          )}

          <div>
            <h1 className={`${nameSizeClass} ${nameWeightClass} ${nameCaseClass} text-slate-900 leading-tight`}>
              {sampleUser.name}
            </h1>

            {/* Role / Subtitle */}
            {roleStyle === 'badge' ? (
              <span 
                className="inline-block text-[11px] font-bold px-3 py-0.5 rounded-full text-white mt-1.5 uppercase tracking-wider"
                style={{ backgroundColor: selectedColor.hex }}
              >
                {sampleUser.role}
              </span>
            ) : roleStyle === 'italic' ? (
              <div className="text-xs italic text-slate-600 mt-0.5 font-medium">
                {sampleUser.role}
              </div>
            ) : (
              <div 
                className="text-xs font-bold mt-1 uppercase tracking-widest"
                style={{ color: selectedColor.hex }}
              >
                {sampleUser.role}
              </div>
            )}
          </div>
        </div>

        {/* Contacts */}
        <div className={`mt-3 ${
          contactLayout === 'grid' ? 'grid grid-cols-2 gap-2 text-left' :
          contactLayout === 'stacked' ? 'flex flex-col gap-1' :
          'flex flex-wrap items-center gap-x-3 gap-y-1 text-center justify-center'
        } text-[11px] text-slate-600 font-medium`}>
          <div className="flex items-center gap-1.5">
            {contactIcons && <Mail className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
            <span>{sampleUser.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {contactIcons && <Phone className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
            <span>{sampleUser.phone}</span>
          </div>
          <div className="flex items-center gap-1.5">
            {contactIcons && <MapPin className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
            <span>{sampleUser.location}</span>
          </div>
          {showSocials && sampleUser.linkedin && (
            <div className="flex items-center gap-1.5">
              {contactIcons && <Linkedin className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
              <span>{sampleUser.linkedin}</span>
            </div>
          )}
          {showSocials && sampleUser.github && (
            <div className="flex items-center gap-1.5">
              {contactIcons && <Github className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
              <span>{sampleUser.github}</span>
            </div>
          )}
          {showSocials && (sampleUser.portfolio || sampleUser.website) && (
            <div className="flex items-center gap-1.5">
              {contactIcons && <ExternalLink className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
              <span>{sampleUser.portfolio || sampleUser.website}</span>
            </div>
          )}
          {showSocials && sampleUser.leetcode && (
            <div className="flex items-center gap-1.5">
              {contactIcons && <Code className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
              <span>{sampleUser.leetcode}</span>
            </div>
          )}
          {showSocials && sampleUser.extraLinks?.map((el, i) => (
            <div key={i} className="flex items-center gap-1.5">
              {contactIcons && <ExternalLink className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
              <span>{el.platform}: {el.url}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Section Body Renderer Helper
  const renderSectionBlock = (secKey, isSidebar = false) => {
    if (!activeSections[secKey]) return null

    if (secKey === 'summary') {
      return (
        <div key="summary" className="space-y-1">
          {renderHeading('Professional Summary', 'profile', isSidebar)}
          <p className="text-[11.5px] text-slate-700 leading-relaxed font-normal">
            {sampleUser.summary}
          </p>
        </div>
      )
    }

    if (secKey === 'experience') {
      return (
        <div key="experience" className="space-y-3">
          {renderHeading('Work Experience', 'experience', isSidebar)}
          <div className="space-y-4">
            {sampleUser.experience.map((exp, idx) => (
              <div key={idx} className="space-y-1">
                {companyPosition === 'above' ? (
                  <>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-900">{exp.company}</span>
                      {datePosition === 'right' && (
                        <span className="text-[10px] text-slate-500 font-semibold">{exp.duration}</span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold" style={{ color: selectedColor.hex }}>
                      {exp.role} {datePosition === 'subline' && `• ${exp.duration}`}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-slate-900">{exp.role}</span>
                      {datePosition === 'right' && (
                        <span className="text-[10px] text-slate-500 font-semibold">{exp.duration}</span>
                      )}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-600">
                      {exp.company} {datePosition === 'subline' && `• ${exp.duration}`}
                    </div>
                  </>
                )}
                <ul className="mt-1.5 space-y-1 text-[11px] text-slate-700">
                  {exp.points.map((pt, pIdx) => (
                    <li key={pIdx} className="flex items-start gap-1.5 leading-relaxed">
                      <span className="font-bold shrink-0 text-slate-400 mt-0.5">{getBulletSymbol()}</span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (secKey === 'skills') {
      return (
        <div key="skills" className="space-y-2">
          {renderHeading('Core Competencies', 'skills', isSidebar)}
          {renderSkills(isSidebar)}
        </div>
      )
    }

    if (secKey === 'projects') {
      return (
        <div key="projects" className="space-y-2">
          {renderHeading('Featured Projects', 'projects', isSidebar)}
          <div className="space-y-3">
            {sampleUser.projects.map((proj, idx) => (
              <div key={idx} className="space-y-0.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-slate-900">{proj.name}</span>
                  <span className="text-[10px] font-medium text-slate-500">{proj.tech}</span>
                </div>
                <p className="text-[11px] text-slate-700 leading-relaxed">
                  {proj.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (secKey === 'education') {
      return (
        <div key="education" className="space-y-2">
          {renderHeading('Education', 'education', isSidebar)}
          <div className="space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-900">{sampleUser.education.degree}</span>
              <span className="text-[10px] text-slate-500 font-semibold">{sampleUser.education.duration}</span>
            </div>
            <div className="text-[11px] text-slate-600 font-medium">
              {sampleUser.education.institution} • GPA {sampleUser.education.gpa}
            </div>
          </div>
        </div>
      )
    }

    if (secKey === 'certifications') {
      return (
        <div key="certifications" className="space-y-2">
          {renderHeading('Certifications & Licenses', 'certifications', isSidebar)}
          <div className="space-y-1.5">
            {sampleUser.certifications.map((c, idx) => (
              <div key={idx} className="flex justify-between items-baseline text-[11px]">
                <span className="font-semibold text-slate-800">{c.title}</span>
                <span className="text-[10px] text-slate-400 font-medium">{c.year}</span>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (secKey === 'languages') {
      return (
        <div key="languages" className="space-y-2">
          {renderHeading('Languages', 'languages', isSidebar)}
          <div className="flex flex-wrap gap-2 text-[11px]">
            {sampleUser.languages.map((l, idx) => (
              <span key={idx} className="font-medium text-slate-700">
                <strong>{l.language}</strong> ({l.fluency}){idx < sampleUser.languages.length - 1 ? ' • ' : ''}
              </span>
            ))}
          </div>
        </div>
      )
    }

    return null
  }

  // Padding class for canvas
  const paddingClass = pagePadding === 'compact' ? 'p-6' : pagePadding === 'spacious' ? 'p-12' : 'p-8'
  const spacingClass = sectionSpacing === 'tight' ? 'space-y-4' : sectionSpacing === 'relaxed' ? 'space-y-7' : 'space-y-5'

  return (
    <div className="flex flex-col h-screen bg-slate-100/70 font-sans overflow-hidden">
      {/* Top Control Bar */}
      <header className="shrink-0 bg-white border-b border-slate-200 px-4 py-3 sm:px-6 shadow-xs z-30">
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Left: Back & Template Title */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/resume-templates/create')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              title="Back to options"
            >
              <ArrowLeft className="size-4" />
            </button>
            <div>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="font-black text-slate-900 text-base sm:text-lg bg-transparent border-b border-dashed border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-hidden px-1 transition-all"
                placeholder="Template Name"
              />
              <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                <span className="font-semibold text-blue-600">Visual Studio Pro</span>
                <span>•</span>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-transparent border-none text-slate-600 font-medium cursor-pointer text-xs focus:ring-0 p-0"
                >
                  <option value="Engineering & Tech">Engineering & Tech</option>
                  <option value="Data Science & AI">Data Science & AI</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                  <option value="Healthcare & Medical">Healthcare & Medical</option>
                  <option value="Management & Executive">Management & Executive</option>
                  <option value="General & Custom">General & Custom</option>
                </select>
              </div>
            </div>
          </div>

          {/* Center: Live ATS Badge */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <ShieldCheck className="size-4 text-emerald-600" />
            <span>ATS Compliance: {atsMetrics}% Optimal</span>
          </div>

          {/* Right: View Mode, Zoom & Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* View Mode Switcher (Edit vs Split vs Preview) */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode('editor')}
                className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                  viewMode === 'editor' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Show only editor controls"
              >
                ⚙️ Edit
              </button>
              <button
                type="button"
                onClick={() => setViewMode('both')}
                className={`hidden md:inline-block px-2.5 py-1 font-bold rounded-lg transition-all ${
                  viewMode === 'both' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Show split view side-by-side"
              >
                Split
              </button>
              <button
                type="button"
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 font-bold rounded-lg transition-all ${
                  viewMode === 'preview' ? 'bg-white text-blue-600 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Show full preview sheet"
              >
                👁️ Preview
              </button>
            </div>

            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-100 rounded-xl p-1 text-slate-600 text-xs">
              <button
                onClick={() => setZoom(Math.max(60, zoom - 10))}
                className="p-1 hover:text-slate-900"
                title="Zoom Out"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="px-2 font-mono font-bold text-[11px]">{zoom}%</span>
              <button
                onClick={() => setZoom(Math.min(140, zoom + 10))}
                className="p-1 hover:text-slate-900"
                title="Zoom In"
              >
                <ZoomIn className="size-3.5" />
              </button>
            </div>

            {/* Auto-Fill Button */}
            <button
              onClick={() => setIsAutoFillModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Sparkles className="size-3.5" />
              <span>Auto-Fill</span>
            </button>

            {/* Test in Builder */}
            <button
              onClick={handleTestInBuilder}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold transition-all shadow-2xs"
            >
              <Eye className="size-3.5 text-blue-600" />
              <span>Test in Builder</span>
            </button>

            {/* Publish Button */}
            <button
              onClick={() => setIsPublishModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 active:scale-95 transition-all"
            >
              <Share2 className="size-3.5" />
              <span>Publish Template</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Studio Split Layout */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0">
        {/* Left Sidebar Controls */}
        <div className={`w-full md:w-[440px] lg:w-[480px] xl:w-[520px] bg-white border-r border-slate-200 flex flex-col shrink-0 h-full overflow-hidden ${
          viewMode === 'preview' ? 'hidden' : 'flex'
        }`}>
          {/* Comprehensive Tabs Navigation */}
          <div className="flex border-b border-slate-200 bg-slate-50/90 p-1 overflow-x-auto scrollbar-none">
            {[
              { id: 'layout', label: 'Layout', icon: Layout },
              { id: 'header', label: 'Header', icon: User },
              { id: 'headings', label: 'Headings', icon: Type },
              { id: 'skills', label: 'Skills', icon: Code },
              { id: 'colors', label: 'Colors & Fonts', icon: Palette },
              { id: 'sections', label: 'Sections', icon: Layers },
              { id: 'content', label: 'Content', icon: FileText },
              { id: 'ats', label: 'ATS', icon: ShieldCheck }
            ].map(tab => {
              const TabIcon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-white text-blue-600 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <TabIcon className="size-3.5" />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          {/* Tab Body Content */}
          <div className="flex-1 overflow-y-auto p-5 space-y-6 scrollbar-thin">
            {/* TAB 1: LAYOUT & PAPER */}
            {activeTab === 'layout' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Architecture Options */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                    Layout Architecture
                  </label>
                  <div className="space-y-2">
                    {LAYOUT_STYLES.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => setLayoutStyle(l.id)}
                        className={`cursor-pointer rounded-xl border p-3 transition-all flex items-start gap-3 ${
                          layoutStyle === l.id
                            ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className={`mt-0.5 size-4 rounded-full border flex items-center justify-center ${
                          layoutStyle === l.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {layoutStyle === l.id && <Check className="size-2.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{l.name}</div>
                          <div className="text-[11px] text-slate-500 leading-relaxed mt-0.5">{l.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Sidebar Width Control */}
                {(layoutStyle === 'split-sidebar' || layoutStyle === 'split-sidebar-right') && (
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                      <span>Sidebar Width Proportion</span>
                      <span className="text-blue-600 font-black">{sidebarWidth}%</span>
                    </div>
                    <input
                      type="range"
                      min="26"
                      max="42"
                      value={sidebarWidth}
                      onChange={(e) => setSidebarWidth(Number(e.target.value))}
                      className="w-full accent-blue-600 cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Slim (26%)</span>
                      <span>Balanced (34%)</span>
                      <span>Wide (42%)</span>
                    </div>
                  </div>
                )}

                {/* Paper Tint */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2.5">
                    Paper Background Tint
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {[
                      { id: 'white', name: 'White', color: '#ffffff' },
                      { id: 'ivory', name: 'Ivory', color: '#fdfbf7' },
                      { id: 'slate', name: 'Slate', color: '#f8fafc' },
                      { id: 'linen', name: 'Linen', color: '#fafaf9' }
                    ].map(p => (
                      <button
                        key={p.id}
                        onClick={() => setPaperBg(p.id)}
                        className={`p-2 rounded-xl border text-center transition-all ${
                          paperBg === p.id ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-xs' : 'border-slate-200'
                        }`}
                        style={{ backgroundColor: p.color }}
                      >
                        <span className="text-[11px] font-bold text-slate-800">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Page Margins & Section Spacing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                      Page Padding
                    </label>
                    <select
                      value={pagePadding}
                      onChange={(e) => setPagePadding(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium text-slate-800 bg-white"
                    >
                      <option value="compact">Compact (20px)</option>
                      <option value="normal">Standard (32px)</option>
                      <option value="spacious">Spacious (44px)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                      Section Gap
                    </label>
                    <select
                      value={sectionSpacing}
                      onChange={(e) => setSectionSpacing(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium text-slate-800 bg-white"
                    >
                      <option value="tight">Tight</option>
                      <option value="normal">Balanced</option>
                      <option value="relaxed">Relaxed</option>
                    </select>
                  </div>
                </div>

                {/* Left Border Accent Ribbon Toggle */}
                <div 
                  onClick={() => setLeftRibbon(!leftRibbon)}
                  className={`cursor-pointer rounded-2xl border p-3.5 flex items-center justify-between transition-all ${
                    leftRibbon ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">Accent Left Edge Ribbon</div>
                    <div className="text-[11px] text-slate-500">Adds 4px primary-color decorative vertical bar down sheet</div>
                  </div>
                  <div className={`size-5 rounded-md border flex items-center justify-center ${
                    leftRibbon ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                  }`}>
                    {leftRibbon && <Check className="size-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: HEADER & CONTACT */}
            {activeTab === 'header' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Header Alignment */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2.5">
                    Header Alignment
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'left', name: 'Left Aligned' },
                      { id: 'center', name: 'Centered' },
                      { id: 'split', name: 'Split / Row' }
                    ].map(a => (
                      <button
                        key={a.id}
                        onClick={() => setHeaderAlign(a.id)}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                          headerAlign === a.id
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {a.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Name Typography Controls */}
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Name Size</label>
                    <select
                      value={nameSize}
                      onChange={(e) => setNameSize(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium bg-white"
                    >
                      <option value="normal">Medium (2xl)</option>
                      <option value="large">Large (3xl)</option>
                      <option value="huge">Extra Large (4xl)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Name Weight</label>
                    <select
                      value={nameWeight}
                      onChange={(e) => setNameWeight(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium bg-white"
                    >
                      <option value="bold">Bold (700)</option>
                      <option value="extrabold">Extra Bold (800)</option>
                      <option value="black">Black (900)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Letter Case</label>
                    <select
                      value={nameCase}
                      onChange={(e) => setNameCase(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium bg-white"
                    >
                      <option value="uppercase">ALL CAPS</option>
                      <option value="capitalize">Title Case</option>
                    </select>
                  </div>
                </div>

                {/* Subtitle / Role Style */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    Professional Role Style
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'subtitle', name: 'Uppercase Accent' },
                      { id: 'badge', name: 'Pill Badge' },
                      { id: 'italic', name: 'Subtle Italic' }
                    ].map(r => (
                      <button
                        key={r.id}
                        onClick={() => setRoleStyle(r.id)}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                          roleStyle === r.id
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Info Presentation */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    Contact Items Layout
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'inline', name: 'Inline Flow' },
                      { id: 'grid', name: '2-Col Grid' },
                      { id: 'stacked', name: 'Stacked' }
                    ].map(c => (
                      <button
                        key={c.id}
                        onClick={() => setContactLayout(c.id)}
                        className={`py-2 px-2 rounded-xl border text-xs font-bold transition-all ${
                          contactLayout === c.id
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Contact Icons Toggle */}
                <div 
                  onClick={() => setContactIcons(!contactIcons)}
                  className={`cursor-pointer rounded-2xl border p-3 flex items-center justify-between transition-all ${
                    contactIcons ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="text-xs font-bold text-slate-900">Show Contact Mini Icons</div>
                  <div className={`size-5 rounded-md border flex items-center justify-center ${
                    contactIcons ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                  }`}>
                    {contactIcons && <Check className="size-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Profile Photo / Avatar Toggle */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <div 
                    onClick={() => setShowPhoto(!showPhoto)}
                    className="cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">Include Profile Avatar Photo</div>
                      <div className="text-[11px] text-slate-500">Popular in UK, EU, UAE & Creative roles</div>
                    </div>
                    <div className={`size-5 rounded-md border flex items-center justify-center ${
                      showPhoto ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                    }`}>
                      {showPhoto && <Check className="size-3.5 stroke-[3]" />}
                    </div>
                  </div>

                  {showPhoto && (
                    <div className="pt-2 border-t border-slate-200 space-y-3 animate-in fade-in duration-150">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">Avatar Shape</label>
                        <div className="grid grid-cols-3 gap-2">
                          {[
                            { id: 'circle', name: 'Circle' },
                            { id: 'rounded', name: 'Rounded' },
                            { id: 'square', name: 'Square' }
                          ].map(s => (
                            <button
                              key={s.id}
                              onClick={() => setPhotoShape(s.id)}
                              className={`py-1.5 px-2 rounded-lg border text-xs font-semibold ${
                                photoShape === s.id ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {s.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: HEADINGS & BULLETS */}
            {activeTab === 'headings' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* Heading Styles System */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                    Section Heading Design
                  </label>
                  <div className="space-y-2">
                    {[
                      { id: 'bottom-line', name: 'Bottom Line Accent', desc: 'Sleek horizontal colored divider line' },
                      { id: 'left-bar', name: 'Left Vertical Bar', desc: 'Thick 4px colored bar on the left edge' },
                      { id: 'colored-pill', name: 'Full Banner Pill', desc: 'Solid colored block with white heading text' },
                      { id: 'double-line', name: 'Ivy League Double Rule', desc: 'Two parallel lines for prestigious academia' },
                      { id: 'icon-badge', name: 'Circle Icon Badge', desc: 'Colored badge box behind section icon' },
                      { id: 'minimal-caps', name: 'Minimalist Clean', desc: 'Pure typography without lines or bars' }
                    ].map(h => (
                      <div
                        key={h.id}
                        onClick={() => setHeadingStyle(h.id)}
                        className={`cursor-pointer rounded-xl border p-3 flex items-start gap-3 transition-all ${
                          headingStyle === h.id
                            ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`mt-0.5 size-4 rounded-full border flex items-center justify-center ${
                          headingStyle === h.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {headingStyle === h.id && <Check className="size-2.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{h.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{h.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Heading Text Transform & Size */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                      Text Transform
                    </label>
                    <select
                      value={headingCase}
                      onChange={(e) => setHeadingCase(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium bg-white"
                    >
                      <option value="uppercase">UPPERCASE</option>
                      <option value="capitalize">Title Case</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                      Heading Size
                    </label>
                    <select
                      value={headingSize}
                      onChange={(e) => setHeadingSize(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 p-2 text-xs font-medium bg-white"
                    >
                      <option value="small">Small (11px)</option>
                      <option value="medium">Medium (12.5px)</option>
                      <option value="large">Large (14px)</option>
                    </select>
                  </div>
                </div>

                {/* Section Icons Toggle */}
                <div 
                  onClick={() => setShowSectionIcons(!showSectionIcons)}
                  className={`cursor-pointer rounded-2xl border p-3 flex items-center justify-between transition-all ${
                    showSectionIcons ? 'border-blue-500 bg-blue-50/50' : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900">Show Section Header Icons</div>
                    <div className="text-[11px] text-slate-500">Briefcase, Graduation cap, Code brackets, etc.</div>
                  </div>
                  <div className={`size-5 rounded-md border flex items-center justify-center ${
                    showSectionIcons ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                  }`}>
                    {showSectionIcons && <Check className="size-3.5 stroke-[3]" />}
                  </div>
                </div>

                {/* Bullet Points Symbol */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    Bullet Point Style
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {[
                      { id: 'dot', label: '• Dot' },
                      { id: 'arrow', label: '▸ Arrow' },
                      { id: 'check', label: '✓ Check' },
                      { id: 'dash', label: '— Dash' },
                      { id: 'square', label: '▪ Square' }
                    ].map(b => (
                      <button
                        key={b.id}
                        onClick={() => setBulletStyle(b.id)}
                        className={`py-2 rounded-xl border text-xs font-bold text-center transition-all ${
                          bulletStyle === b.id
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {b.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: SKILLS & TAGS */}
            {activeTab === 'skills' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                    Skills Presentation Format
                  </label>
                  <div className="space-y-2.5">
                    {[
                      { id: 'badges-filled', name: 'Colored Filled Pills', desc: 'Soft pastel background with accent border and text' },
                      { id: 'badges-outline', name: 'Outlined Badges', desc: 'Clean border with primary brand tint' },
                      { id: 'dot-separated', name: 'Bullet Dot Inline', desc: 'React • TypeScript • Node.js • AWS (Classic ATS)' },
                      { id: 'comma-separated', name: 'Clean Comma Separated', desc: 'Pure text format preferred by rigid enterprise parsers' },
                      { id: 'progress-bars', name: 'Proficiency Progress Bars', desc: 'Visual horizontal percentage bars (Great for design & creative)' }
                    ].map(s => (
                      <div
                        key={s.id}
                        onClick={() => setSkillsStyle(s.id)}
                        className={`cursor-pointer rounded-xl border p-3 flex items-start gap-3 transition-all ${
                          skillsStyle === s.id
                            ? 'border-blue-500 bg-blue-50/60 ring-2 ring-blue-500/20'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      >
                        <div className={`mt-0.5 size-4 rounded-full border flex items-center justify-center ${
                          skillsStyle === s.id ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                        }`}>
                          {skillsStyle === s.id && <Check className="size-2.5 stroke-[3]" />}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-900">{s.name}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{s.desc}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 5: COLORS & FONTS */}
            {activeTab === 'colors' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                {/* 10 Color Presets */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                    Curated Color Presets
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {COLOR_PRESETS.map((preset) => {
                      const isCurrent = selectedColor.hex === preset.hex
                      return (
                        <div
                          key={preset.name}
                          onClick={() => setSelectedColor(preset)}
                          className={`cursor-pointer p-3 rounded-2xl border transition-all ${
                            isCurrent
                              ? 'border-blue-600 bg-blue-50/50 ring-2 ring-blue-500/20'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1.5">
                            <span
                              className="size-4 rounded-full shadow-2xs shrink-0"
                              style={{ backgroundColor: preset.hex }}
                            />
                            <span
                              className="size-3.5 rounded-full border border-slate-200 shrink-0"
                              style={{ backgroundColor: preset.bg }}
                            />
                            {isCurrent && <Check className="size-3 text-blue-600 ml-auto stroke-[3]" />}
                          </div>
                          <div className="text-xs font-bold text-slate-800">{preset.name}</div>
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">{preset.hex}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Custom Hex Color Input */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">
                    Custom Hex Brand Color
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={selectedColor.hex}
                      onChange={(e) => setSelectedColor({
                        name: 'Custom',
                        hex: e.target.value,
                        bg: `${e.target.value}15`,
                        primary: e.target.value.replace('#', '')
                      })}
                      className="size-9 rounded-xl border border-slate-300 cursor-pointer p-0.5 bg-white"
                    />
                    <input
                      type="text"
                      value={selectedColor.hex}
                      onChange={(e) => setSelectedColor({
                        name: 'Custom',
                        hex: e.target.value,
                        bg: `${e.target.value}15`,
                        primary: e.target.value.replace('#', '')
                      })}
                      className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs font-mono uppercase text-slate-800"
                    />
                  </div>
                </div>

                {/* 8 Fonts Selection */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-3">
                    Typography Pairing
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {FONT_OPTIONS.map((f) => (
                      <button
                        key={f.id}
                        onClick={() => setFontFamily(f.id)}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left transition-all ${
                          fontFamily === f.id
                            ? 'border-blue-500 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className={f.style}>{f.name}</div>
                        <div className="text-[10px] font-normal text-slate-400 mt-0.5">{f.tag}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Font Size Scale */}
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-2">
                    Body Font Size Scale
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: '10pt', label: 'Compact (10pt)' },
                      { id: '11pt', label: 'Standard (11pt)' },
                      { id: '12pt', label: 'Spacious (12pt)' }
                    ].map(s => (
                      <button
                        key={s.id}
                        onClick={() => setFontSizeScale(s.id)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all ${
                          fontSizeScale === s.id
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 6: SECTIONS MANAGER */}
            {activeTab === 'sections' && (
              <div className="space-y-6 animate-in fade-in duration-200">
                <div>
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider block mb-1">
                    Manage Template Sections
                  </label>
                  <p className="text-[11px] text-slate-500 mb-3">
                    Toggle visibility and use arrows to rearrange section order.
                  </p>
                  
                  <div className="space-y-2">
                    {sectionOrder.map((secKey, idx) => {
                      const isEnabled = activeSections[secKey]
                      const label = 
                        secKey === 'summary' ? 'Professional Summary' :
                        secKey === 'experience' ? 'Work Experience' :
                        secKey === 'skills' ? 'Core Skills' :
                        secKey === 'projects' ? 'Featured Projects' :
                        secKey === 'education' ? 'Education' :
                        secKey === 'certifications' ? 'Certifications' :
                        secKey === 'languages' ? 'Languages' : secKey

                      return (
                        <div
                          key={secKey}
                          className={`rounded-xl border p-2.5 flex items-center justify-between transition-all ${
                            isEnabled ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5">
                            <input
                              type="checkbox"
                              checked={isEnabled}
                              onChange={(e) => setActiveSections(prev => ({ ...prev, [secKey]: e.target.checked }))}
                              className="size-4 rounded accent-blue-600 cursor-pointer"
                            />
                            <span className="text-xs font-bold text-slate-800">{label}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              disabled={idx === 0}
                              onClick={() => shiftSection(secKey, -1)}
                              className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20"
                              title="Move Up"
                            >
                              <MoveUp className="size-3.5" />
                            </button>
                            <button
                              disabled={idx === sectionOrder.length - 1}
                              onClick={() => shiftSection(secKey, 1)}
                              className="p-1 rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-20"
                              title="Move Down"
                            >
                              <MoveDown className="size-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* TAB 7: SAMPLE CONTENT EDITOR */}
            {activeTab === 'content' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                {/* Auto-Fill Banner */}
                <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50/90 to-indigo-50/90 p-3.5 flex items-center justify-between shadow-2xs">
                  <div>
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="size-3.5 text-blue-600" />
                      <span>Auto-Fill from LinkedIn or Profile</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Paste export text or sync from your Bridge profile in 1 click
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAutoFillModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs active:scale-95 transition-all shrink-0"
                  >
                    Auto-Fill
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Full Name</label>
                  <input
                    type="text"
                    value={sampleUser.name}
                    onChange={(e) => setSampleUser(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Professional Role / Title</label>
                  <input
                    type="text"
                    value={sampleUser.role}
                    onChange={(e) => setSampleUser(prev => ({ ...prev, role: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800 focus:border-blue-600 focus:outline-hidden"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Email</label>
                    <input
                      type="text"
                      value={sampleUser.email}
                      onChange={(e) => setSampleUser(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 block mb-1">Phone</label>
                    <input
                      type="text"
                      value={sampleUser.phone}
                      onChange={(e) => setSampleUser(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full rounded-xl border border-slate-300 px-2.5 py-1.5 text-xs text-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Location</label>
                  <input
                    type="text"
                    value={sampleUser.location}
                    onChange={(e) => setSampleUser(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Professional Summary</label>
                  <textarea
                    rows={4}
                    value={sampleUser.summary}
                    onChange={(e) => setSampleUser(prev => ({ ...prev, summary: e.target.value }))}
                    className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800 leading-relaxed focus:border-blue-600 focus:outline-hidden resize-none"
                  />
                </div>
              </div>
            )}

            {/* TAB 8: ATS AUDIT */}
            {activeTab === 'ats' && (
              <div className="space-y-5 animate-in fade-in duration-200">
                <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-emerald-900">ATS Compliance Score</span>
                    <span className="text-sm font-black text-emerald-700">{atsMetrics}%</span>
                  </div>
                  <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${atsMetrics}%` }}
                    />
                  </div>
                  <p className="mt-2 text-[11px] text-emerald-800 leading-relaxed">
                    This template conforms to Workday, Taleo, Greenhouse, and Lever parsing heuristics.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Semantic Headings:</strong> Clean standard UTF-8 headers ensure ATS parser categorizes sections without confusion.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>Linear Reading Flow:</strong> Hierarchical DOM structure prevents columns from being merged incorrectly.</span>
                  </div>
                  <div className="flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="size-4 text-emerald-600 mt-0.5 shrink-0" />
                    <span><strong>High Contrast Ratio:</strong> Contrast ratio exceeds WCAG AAA standards for OCR scanners.</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Live Canvas Preview Area */}
        <div className={`flex-1 bg-slate-200/80 p-4 sm:p-8 flex items-start justify-center overflow-auto h-full ${
          viewMode === 'editor' ? 'hidden' : 'flex'
        }`}>
          {/* The A4 Canvas Sheet */}
          <div
            className={`shadow-2xl transition-all duration-200 origin-top rounded-xs border border-slate-300 relative shrink-0 my-2 sm:my-4 ${
              fontFamily === 'serif' ? 'font-serif' : 
              fontFamily === 'playfair' ? 'font-serif' : 
              fontFamily === 'slab' ? 'font-serif' : 
              fontFamily === 'mono' ? 'font-mono' : 'font-sans'
            }`}
            style={{
              width: '780px',
              minHeight: '1100px',
              backgroundColor: paperBgColor,
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              fontSize: fontSizeScale === '10pt' ? '0.875rem' : fontSizeScale === '12pt' ? '1.05rem' : '0.95rem'
            }}
          >
            {/* Optional Left Accent Ribbon */}
            {leftRibbon && (
              <div 
                className="absolute left-0 top-0 bottom-0 w-1.5 z-10" 
                style={{ backgroundColor: selectedColor.hex }}
              />
            )}

            {/* LAYOUT 1: SPLIT SIDEBAR LEFT */}
            {layoutStyle === 'split-sidebar' && (
              <div className="flex h-full min-h-[1100px]">
                {/* Left Sidebar */}
                <div
                  className="p-7 flex flex-col justify-between shrink-0"
                  style={{
                    width: `${sidebarWidth}%`,
                    backgroundColor: selectedColor.bg,
                    borderRight: `2px solid ${selectedColor.hex}25`
                  }}
                >
                  <div className="space-y-6">
                    {/* Header in Sidebar */}
                    <div>
                      {showPhoto && (
                        <img 
                          src={photoUrl} 
                          alt={sampleUser.name} 
                          className={`size-20 object-cover border-2 shadow-sm mb-3 ${
                            photoShape === 'circle' ? 'rounded-full' : photoShape === 'rounded' ? 'rounded-2xl' : 'rounded-none'
                          }`}
                          style={{ borderColor: selectedColor.hex }}
                        />
                      )}
                      <h1 className="text-xl font-black text-slate-900 leading-tight">
                        {sampleUser.name}
                      </h1>
                      <div
                        className="text-xs font-bold mt-1 uppercase tracking-wider"
                        style={{ color: selectedColor.hex }}
                      >
                        {sampleUser.role}
                      </div>

                      <div className="mt-5 space-y-2 text-[11px] text-slate-600 font-medium">
                        <div className="flex items-center gap-1.5">
                          {contactIcons && <Mail className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
                          <span className="truncate">{sampleUser.email}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {contactIcons && <Phone className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
                          <span>{sampleUser.phone}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {contactIcons && <MapPin className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
                          <span>{sampleUser.location}</span>
                        </div>
                        {showSocials && sampleUser.linkedin && (
                          <div className="flex items-center gap-1.5">
                            {contactIcons && <Linkedin className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
                            <span className="truncate">{sampleUser.linkedin}</span>
                          </div>
                        )}
                        {showSocials && sampleUser.github && (
                          <div className="flex items-center gap-1.5">
                            {contactIcons && <Github className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
                            <span className="truncate">{sampleUser.github}</span>
                          </div>
                        )}
                        {showSocials && (sampleUser.portfolio || sampleUser.website) && (
                          <div className="flex items-center gap-1.5">
                            {contactIcons && <ExternalLink className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
                            <span className="truncate">{sampleUser.portfolio || sampleUser.website}</span>
                          </div>
                        )}
                        {showSocials && sampleUser.leetcode && (
                          <div className="flex items-center gap-1.5">
                            {contactIcons && <Code className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
                            <span className="truncate">{sampleUser.leetcode}</span>
                          </div>
                        )}
                        {showSocials && sampleUser.extraLinks?.map((el, i) => (
                          <div key={i} className="flex items-center gap-1.5">
                            {contactIcons && <ExternalLink className="size-3 shrink-0" style={{ color: selectedColor.hex }} />}
                            <span className="truncate">{el.platform}: {el.url}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Sidebar Skills */}
                    {activeSections.skills && (
                      <div>
                        {renderHeading('Core Skills', 'skills', true)}
                        {renderSkills(true)}
                      </div>
                    )}

                    {/* Sidebar Education */}
                    {activeSections.education && (
                      <div>
                        {renderHeading('Education', 'education', true)}
                        <div className="text-[11px] text-slate-800 font-semibold">
                          {sampleUser.education.degree}
                        </div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5">
                          {sampleUser.education.institution} • {sampleUser.education.duration}
                        </div>
                      </div>
                    )}

                    {/* Sidebar Languages */}
                    {activeSections.languages && (
                      <div>
                        {renderHeading('Languages', 'languages', true)}
                        <div className="space-y-1 text-[11px] text-slate-700">
                          {sampleUser.languages.map((l, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="font-semibold">{l.language}</span>
                              <span className="text-[10px] text-slate-500">{l.fluency}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-400 pt-6">
                    Generated with Bridge Resume Studio
                  </div>
                </div>

                {/* Right Main Flow */}
                <div className={`flex-1 ${paddingClass} ${spacingClass}`}>
                  {sectionOrder
                    .filter(sec => sec !== 'skills' && sec !== 'education' && sec !== 'languages')
                    .map(sec => renderSectionBlock(sec))}
                </div>
              </div>
            )}

            {/* LAYOUT 2: SPLIT SIDEBAR RIGHT */}
            {layoutStyle === 'split-sidebar-right' && (
              <div className="flex h-full min-h-[1100px]">
                {/* Left Main Flow */}
                <div className={`flex-1 ${paddingClass} ${spacingClass}`}>
                  {renderHeader()}
                  {sectionOrder
                    .filter(sec => sec !== 'skills' && sec !== 'education' && sec !== 'languages')
                    .map(sec => renderSectionBlock(sec))}
                </div>

                {/* Right Sidebar */}
                <div
                  className="p-7 flex flex-col justify-between shrink-0"
                  style={{
                    width: `${sidebarWidth}%`,
                    backgroundColor: selectedColor.bg,
                    borderLeft: `2px solid ${selectedColor.hex}25`
                  }}
                >
                  <div className="space-y-6">
                    {/* Sidebar Skills */}
                    {activeSections.skills && (
                      <div>
                        {renderHeading('Core Competencies', 'skills', true)}
                        {renderSkills(true)}
                      </div>
                    )}

                    {/* Sidebar Education */}
                    {activeSections.education && (
                      <div>
                        {renderHeading('Education', 'education', true)}
                        <div className="text-[11px] text-slate-800 font-semibold">
                          {sampleUser.education.degree}
                        </div>
                        <div className="text-[10.5px] text-slate-500 mt-0.5">
                          {sampleUser.education.institution} • {sampleUser.education.duration}
                        </div>
                      </div>
                    )}

                    {/* Sidebar Certifications */}
                    {activeSections.certifications && (
                      <div>
                        {renderHeading('Certifications', 'certifications', true)}
                        <div className="space-y-1.5 text-[11px] text-slate-700">
                          {sampleUser.certifications.map((c, idx) => (
                            <div key={idx}>
                              <div className="font-semibold text-slate-800">{c.title}</div>
                              <div className="text-[10px] text-slate-500">{c.issuer} • {c.year}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Sidebar Languages */}
                    {activeSections.languages && (
                      <div>
                        {renderHeading('Languages', 'languages', true)}
                        <div className="space-y-1 text-[11px] text-slate-700">
                          {sampleUser.languages.map((l, idx) => (
                            <div key={idx} className="flex justify-between">
                              <span className="font-semibold">{l.language}</span>
                              <span className="text-[10px] text-slate-500">{l.fluency}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="text-[9px] text-slate-400 pt-6">
                    Bridge Studio
                  </div>
                </div>
              </div>
            )}

            {/* LAYOUT 3: TOP BANNER HEADER */}
            {layoutStyle === 'top-banner' && (
              <div className="h-full min-h-[1100px] flex flex-col">
                {/* Banner Header */}
                <div
                  className="p-8 text-white"
                  style={{ backgroundColor: selectedColor.hex }}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{sampleUser.name}</h1>
                      <div className="text-xs font-semibold opacity-95 mt-1 uppercase tracking-widest">
                        {sampleUser.role}
                      </div>
                      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs opacity-90 font-medium">
                        <span>{sampleUser.email}</span>
                        <span>•</span>
                        <span>{sampleUser.phone}</span>
                        <span>•</span>
                        <span>{sampleUser.location}</span>
                      </div>
                    </div>
                    {showPhoto && (
                      <img 
                        src={photoUrl} 
                        alt={sampleUser.name} 
                        className={`size-20 object-cover border-2 border-white/80 shadow-lg shrink-0 ${
                          photoShape === 'circle' ? 'rounded-full' : photoShape === 'rounded' ? 'rounded-2xl' : 'rounded-none'
                        }`}
                      />
                    )}
                  </div>
                </div>

                {/* Banner Body */}
                <div className={`flex-1 ${paddingClass} ${spacingClass}`}>
                  {sectionOrder.map(sec => renderSectionBlock(sec))}
                </div>
              </div>
            )}

            {/* LAYOUT 4, 5, 6: CLEAN MINIMAL / MODERN CARDS / IVY LEAGUE */}
            {(layoutStyle === 'clean-minimal' || layoutStyle === 'modern-cards' || layoutStyle === 'ivy-league') && (
              <div className={`${paddingClass} ${spacingClass} h-full min-h-[1100px]`}>
                {renderHeader()}
                {sectionOrder.map(sec => (
                  <div 
                    key={sec}
                    className={layoutStyle === 'modern-cards' ? 'p-4 rounded-2xl bg-slate-50/80 border border-slate-200 shadow-2xs' : ''}
                  >
                    {renderSectionBlock(sec)}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Publish Template Modal */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-3xl bg-white border border-slate-200 p-6 sm:p-8 shadow-2xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                  <Share2 className="size-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Publish Resume Template</h3>
                  <p className="text-xs text-slate-500">Save and make your custom template accessible</p>
                </div>
              </div>
              <button
                onClick={() => setIsPublishModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Template Display Name</label>
                <input
                  type="text"
                  value={templateName}
                  onChange={(e) => setTemplateName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  placeholder="e.g. Modern Minimalist Tech"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Short Name (Card Tag)</label>
                <input
                  type="text"
                  value={shortName}
                  onChange={(e) => setShortName(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden"
                  placeholder="e.g. Minimalist"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Target Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 px-3.5 py-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden bg-white"
                >
                  <option value="Engineering & Tech">Engineering & Tech</option>
                  <option value="Data Science & AI">Data Science & AI</option>
                  <option value="Product & Design">Product & Design</option>
                  <option value="Sales & Marketing">Sales & Marketing</option>
                  <option value="Finance & Banking">Finance & Banking</option>
                  <option value="Healthcare & Medical">Healthcare & Medical</option>
                  <option value="Management & Executive">Management & Executive</option>
                  <option value="General & Custom">General & Custom</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Short Description</label>
                <textarea
                  rows={2}
                  value={publishDescription}
                  onChange={(e) => setPublishDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden resize-none"
                  placeholder="Describe what makes this template stand out..."
                />
              </div>

              {/* Public vs Private Toggle */}
              <div
                onClick={() => setIsPublic(!isPublic)}
                className={`cursor-pointer rounded-2xl border p-4 flex items-center justify-between transition-all ${
                  isPublic ? 'border-blue-500 bg-blue-50/60' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  {isPublic ? (
                    <Globe className="size-5 text-blue-600 shrink-0" />
                  ) : (
                    <Lock className="size-5 text-slate-500 shrink-0" />
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      {isPublic ? 'Public Template (Community)' : 'Private Template'}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {isPublic ? 'Everyone can discover and build resumes with this template.' : 'Only you will be able to see and use this template.'}
                    </div>
                  </div>
                </div>
                <div className={`size-5 rounded-md border flex items-center justify-center ${
                  isPublic ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'
                }`}>
                  {isPublic && <Check className="size-3.5 stroke-[3]" />}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsPublishModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePublishTemplate}
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="size-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <Share2 className="size-3.5" />
                    <span>Confirm & Publish</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auto-Fill & Profile Import Modal */}
      {isAutoFillModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-3xl bg-white border border-slate-200 p-6 sm:p-7 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Auto-Fill Resume Profile</h3>
                  <p className="text-xs text-slate-500">Paste your LinkedIn export, plaintext resume, or sync from Bridge</p>
                </div>
              </div>
              <button
                onClick={() => setIsAutoFillModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* 3 Mode Tabs */}
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setAutoFillTab('pdf')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  autoFillTab === 'pdf' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📄 Upload PDF / File
              </button>
              <button
                type="button"
                onClick={() => setAutoFillTab('paste')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  autoFillTab === 'paste' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                📋 Paste LinkedIn / Text
              </button>
              <button
                type="button"
                onClick={() => {
                  setAutoFillTab('sync')
                  handleSyncBridgeProfile()
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  autoFillTab === 'sync' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                ⚡ Sync Bridge Profile
              </button>
            </div>

            {/* TAB 0: UPLOAD PDF / FILE */}
            {autoFillTab === 'pdf' && (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-blue-300 hover:border-blue-500 rounded-3xl p-6 text-center bg-blue-50/30 transition-all">
                  <input
                    type="file"
                    id="visual-pdf-upload"
                    accept=".pdf,.txt,.md,.docx,.json"
                    onChange={handlePdfUpload}
                    className="hidden"
                  />
                  <label htmlFor="visual-pdf-upload" className="cursor-pointer flex flex-col items-center gap-3">
                    <div className="size-14 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner">
                      {extractingPdf ? (
                        <Loader2 className="size-7 animate-spin text-blue-600" />
                      ) : (
                        <FileUp className="size-7" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900">
                        {extractingPdf ? 'Extracting Resume Text with Smart Engine...' : 'Click to Upload Resume (PDF / DOCX / TXT)'}
                      </div>
                      <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                        Backend parser extracts full text, links (LinkedIn, GitHub, Portfolio, LeetCode, Medium), work history, and skills automatically into template placeholders.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 text-white font-bold text-xs shadow-md shadow-blue-500/20 hover:bg-blue-700 transition-all mt-1">
                      <Upload className="size-3.5" />
                      <span>Select File</span>
                    </span>
                  </label>

                  {uploadedPdfName && (
                    <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-blue-200 text-xs text-slate-700 shadow-xs">
                      <FileText className="size-3.5 text-blue-600" />
                      <span className="font-semibold">{uploadedPdfName}</span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          setUploadedPdfName('')
                          setAutoFillText('')
                          setDetectedProfile(null)
                        }}
                        className="text-slate-400 hover:text-slate-700 ml-1"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between px-2 pt-1 text-xs">
                  <span className="text-slate-500">Want to test without a file?</span>
                  <button
                    type="button"
                    onClick={handleLoadSampleLinkedIn}
                    className="font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="size-3" />
                    <span>Load Sample LinkedIn Profile (5 Links + Work History)</span>
                  </button>
                </div>

                {/* Live Detection Summary Card */}
                {detectedProfile && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-purple-50/50 border border-blue-200 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900">
                          Candidate: <strong className="text-blue-900">{detectedProfile.name}</strong>
                          {detectedProfile.role ? ` (${detectedProfile.role})` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        ✓ Ready to populate
                      </span>
                    </div>

                    {/* Contact Badges */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                      {detectedProfile.email && (
                        <span className="bg-white/90 border border-slate-200 px-2 py-0.5 rounded-lg">
                          📧 {detectedProfile.email}
                        </span>
                      )}
                      {detectedProfile.phone && (
                        <span className="bg-white/90 border border-slate-200 px-2 py-0.5 rounded-lg">
                          📞 {detectedProfile.phone}
                        </span>
                      )}
                      {detectedProfile.location && (
                        <span className="bg-white/90 border border-slate-200 px-2 py-0.5 rounded-lg">
                          📍 {detectedProfile.location}
                        </span>
                      )}
                    </div>

                    {/* Smart Links Intelligence Box */}
                    <div className="rounded-xl bg-white/90 border border-blue-100 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-900 flex items-center gap-1">
                          <Globe className="size-3 text-blue-600" />
                          <span>Smart Links Intelligence:</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Auto-populates into template contact placeholders
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {detectedProfile.personal?.linkedin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            <Linkedin className="size-2.5" /> LinkedIn Placeholder ✓
                          </span>
                        )}
                        {detectedProfile.personal?.github && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-300">
                            <Github className="size-2.5" /> GitHub Placeholder ✓
                          </span>
                        )}
                        {(detectedProfile.personal?.portfolio || detectedProfile.personal?.website) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            <ExternalLink className="size-2.5" /> Portfolio/Web ✓
                          </span>
                        )}
                        {detectedProfile.personal?.leetcode && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                            ⭐ LeetCode: auto-fill placeholder
                          </span>
                        )}
                        {detectedProfile.personal?.medium && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                            ⭐ Medium: auto-fill placeholder
                          </span>
                        )}
                        {detectedProfile.extraLinks?.map((ex, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                            ⭐ {ex.platform}: auto-fill placeholder
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Section Counts Summary */}
                    <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                        <div className="text-sm font-black text-blue-600">{detectedProfile.experience?.length || 0}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Experiences</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                        <div className="text-sm font-black text-amber-600">{detectedProfile.education?.length || 0}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Education</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                        <div className="text-sm font-black text-cyan-600">
                          {(detectedProfile.skills?.technical ? detectedProfile.skills.technical.split(',').length : 0) + (detectedProfile.skills?.frameworks ? detectedProfile.skills.frameworks.split(',').length : 0) || (Array.isArray(detectedProfile.skills) ? detectedProfile.skills.length : 0)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Skills</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                        <div className="text-sm font-black text-purple-600">{detectedProfile.projects?.length || 0}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Projects</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 1: PASTE */}
            {autoFillTab === 'paste' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Paste LinkedIn Export or Profile Text</label>
                  <button
                    type="button"
                    onClick={handleLoadSampleLinkedIn}
                    className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles className="size-3" />
                    <span>Load Sample LinkedIn Profile (5 Links)</span>
                  </button>
                </div>

                <textarea
                  rows={7}
                  value={autoFillText}
                  onChange={(e) => handleAutoFillParse(e.target.value)}
                  placeholder={`Example from LinkedIn export or profile:\n\nSaanvi Patel\nLead Full Stack Engineer | Cloud Architect\nMumbai, Maharashtra, India · saanvi.patel@example.com · +91 98200 12345\nhttps://linkedin.com/in/saanvipatel\nhttps://github.com/saanvipatel\nhttps://saanvipatel.dev\nhttps://leetcode.com/saanvipatel\n\nExperience\nZomato Digital · Jun 2022 - Present\n• Reduced latency by 38% using containerized microservices...`}
                  className="w-full rounded-2xl border border-slate-300 p-3.5 text-xs text-slate-900 focus:border-blue-600 focus:outline-hidden font-mono"
                />

                {/* Live Detection Summary Card */}
                {detectedProfile && (
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/90 via-indigo-50/60 to-purple-50/50 border border-blue-200 space-y-3 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between border-b border-blue-100 pb-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900">
                          Candidate: <strong className="text-blue-900">{detectedProfile.name}</strong>
                          {detectedProfile.role ? ` (${detectedProfile.role})` : ''}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        ✓ Ready to populate
                      </span>
                    </div>

                    {/* Contact Badges */}
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                      {detectedProfile.email && (
                        <span className="bg-white/90 border border-slate-200 px-2 py-0.5 rounded-lg">
                          📧 {detectedProfile.email}
                        </span>
                      )}
                      {detectedProfile.phone && (
                        <span className="bg-white/90 border border-slate-200 px-2 py-0.5 rounded-lg">
                          📞 {detectedProfile.phone}
                        </span>
                      )}
                      {detectedProfile.location && (
                        <span className="bg-white/90 border border-slate-200 px-2 py-0.5 rounded-lg">
                          📍 {detectedProfile.location}
                        </span>
                      )}
                    </div>

                    {/* Smart Links Intelligence Box */}
                    <div className="rounded-xl bg-white/90 border border-blue-100 p-2.5 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-900 flex items-center gap-1">
                          <Globe className="size-3 text-blue-600" />
                          <span>Smart Links Intelligence:</span>
                        </span>
                        <span className="text-[10px] text-slate-500">
                          Auto-populates into template contact placeholders
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1.5 text-[10px]">
                        {detectedProfile.personal?.linkedin && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                            <Linkedin className="size-2.5" /> LinkedIn Placeholder ✓
                          </span>
                        )}
                        {detectedProfile.personal?.github && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 font-semibold border border-slate-300">
                            <Github className="size-2.5" /> GitHub Placeholder ✓
                          </span>
                        )}
                        {(detectedProfile.personal?.portfolio || detectedProfile.personal?.website) && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                            <ExternalLink className="size-2.5" /> Portfolio/Web ✓
                          </span>
                        )}
                        {detectedProfile.personal?.leetcode && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 font-semibold border border-amber-200">
                            ⭐ LeetCode: auto-fill placeholder
                          </span>
                        )}
                        {detectedProfile.personal?.medium && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 font-semibold border border-rose-200">
                            ⭐ Medium: auto-fill placeholder
                          </span>
                        )}
                        {detectedProfile.extraLinks?.map((ex, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 font-semibold border border-purple-200">
                            ⭐ {ex.platform}: auto-fill placeholder
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Section Counts Summary */}
                    <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                      <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                        <div className="text-sm font-black text-blue-600">{detectedProfile.experience?.length || 0}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Experiences</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                        <div className="text-sm font-black text-amber-600">{detectedProfile.education?.length || 0}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Education</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                        <div className="text-sm font-black text-cyan-600">
                          {(detectedProfile.skills?.technical ? detectedProfile.skills.technical.split(',').length : 0) + (detectedProfile.skills?.frameworks ? detectedProfile.skills.frameworks.split(',').length : 0) || (Array.isArray(detectedProfile.skills) ? detectedProfile.skills.length : 0)}
                        </div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Skills</div>
                      </div>
                      <div className="p-2 rounded-xl bg-white/80 border border-slate-200/80">
                        <div className="text-sm font-black text-purple-600">{detectedProfile.projects?.length || 0}</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Projects</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SYNC */}
            {autoFillTab === 'sync' && (
              <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
                {loadingProfile ? (
                  <div className="py-8 flex flex-col items-center gap-2">
                    <RefreshCw className="size-6 text-blue-600 animate-spin" />
                    <span className="text-xs font-semibold text-slate-600">Fetching profile details...</span>
                  </div>
                ) : detectedProfile ? (
                  <div className="text-left space-y-2">
                    <div className="font-bold text-sm text-slate-900">{detectedProfile.name}</div>
                    <div className="text-xs text-blue-600 font-semibold">{detectedProfile.role}</div>
                    <div className="text-xs text-slate-600">{detectedProfile.email} • {detectedProfile.phone || detectedProfile.location}</div>
                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                      Found {detectedProfile.experience?.length || 0} work experiences, {detectedProfile.skills?.length || 0} skills, and education history ready to apply.
                    </div>
                  </div>
                ) : (
                  <div className="py-6 space-y-2">
                    <p className="text-xs text-slate-600">No saved draft found. You can paste LinkedIn text directly in the other tab.</p>
                    <button
                      type="button"
                      onClick={() => setAutoFillTab('paste')}
                      className="text-xs font-bold text-blue-600 hover:underline"
                    >
                      Switch to Paste LinkedIn
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAutoFillModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!detectedProfile || extractingPdf}
                onClick={() => handleApplyAutoFill(detectedProfile)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold shadow-md shadow-blue-500/20 hover:bg-blue-700 disabled:opacity-40 transition-all active:scale-95 cursor-pointer"
              >
                <Sparkles className="size-3.5 fill-current" />
                <span>Auto-Fill into Template</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

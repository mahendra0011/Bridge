/**
 * structuredToLatex.js
 * Structured builder data (sections[]) -> LaTeX in the "Mahendra / Founder" layout.
 * The same .tex is sent to /compile-pdf, so the builder PDF == Overleaf PDF.
 */
export const esc = (t) => {
  if (t === null || t === undefined || t === false) return ''
  if (Array.isArray(t)) t = t.filter(Boolean).join(', ')
  return String(t).trim()
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/([&%$#_{}])/g, '\\$1')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}

const lines = (v) => String(v || '').split('\n')
  .map(l => l.replace(/^[\s\-*•·–—]+\s*/, '').trim()).filter(Boolean)

const url = (u) => { 
  const s = String(u || '').trim()
  return !s ? '' : /^(https?:|mailto:|tel:)/.test(s) ? s : 'https://' + s 
}

const link = (u, label) => u ? `\\href{${url(u)}}{\\underline{${esc(label)}}}` : esc(label)

const range = (a, b, cur) => [esc(a), cur ? 'Present' : esc(b)].filter(Boolean).join(' -- ')

const bullets = (arr) => arr.length
  ? `\\resumeItemListStart\n${arr.map(b => `  \\resumeItem{\\normalsize{${esc(b)}}}`).join('\n')}\n\\resumeItemListEnd\n` 
  : ''

const TITLES = {
  summary: 'Profile Summary', 
  experience: 'Experience', 
  internships: 'Internship', 
  education: 'Education',
  skills: 'Technical Skills', 
  projects: 'Projects', 
  certifications: 'Certifications',
  achievements: 'Achievements', 
  awards: 'Awards', 
  publications: 'Publications', 
  research: 'Research',
  languages: 'Languages', 
  interests: 'Interests', 
  training: 'Training', 
  volunteer: 'Volunteering',
  leadership: 'Leadership', 
  extracurricular: 'Extracurricular', 
  hackathons: 'Hackathons',
  openSource: 'Open Source', 
  competitiveProgramming: 'Competitive Programming',
  softSkills: 'Soft Skills', 
  strengths: 'Strengths', 
  declaration: 'Declaration', 
  custom: 'Additional Information',
}

const prettify = (k) => String(k)
  .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
  .replace(/[_-]+/g, ' ')
  .replace(/^./, c => c.toUpperCase())

const BODY = new Set([
  'description', 'projectDescription', 'projectKeyFeatures', 
  'achievementDescription', 'scholarshipDescription', 'portfolioDescription'
])

const SKIP = new Set([
  'id', '_id', 'type', 'order', 'createdAt', 'updatedAt', '__v',
  'customSectionHeading', 'customSectionTitle', 'customIcon', 'customLayout',
  'repeatable', 'current', 'visible'
])

const render = {
  summary: (s) => `\\begin{flushleft}\n\\small\n${esc(s.summary)}\n\\end{flushleft}\n`,

  experience: (s) => `\\resumeSubheading{${esc(s.company)}}{${range(s.startDate, s.endDate, s.current === true || s.current === 'Yes')}}` +
    `{${esc(s.role)}${s.employmentType ? ' (' + esc(s.employmentType) + ')' : ''}}{${esc(s.expLocation || s.location || '')}}\n` +
    bullets([...lines(s.description), ...(s.technologiesUsed ? ['Tech: ' + s.technologiesUsed] : [])]),

  internships: (s) => `\\resumeSubheading{${esc(s.internCompany || s.company)}}{${range(s.internStartDate || s.startDate, s.internEndDate || s.endDate, s.internCurrent === true || s.current === true)}}` +
    `{${esc(s.internRole || s.role)}}{${esc(s.internLocation || s.location || '')}}\n` +
    bullets([...lines(s.internDescription || s.description), ...(s.internTechnologies ? ['Tech: ' + s.internTechnologies] : [])]),

  education: (s) => `\\resumeSubheading{${esc(s.institution)}}{${range(s.startYear, s.endYear)}}` +
    `{${esc([s.degree, s.course, s.specialization].filter(Boolean).join(' -- '))}${s.gpa ? ' \\textbf{CGPA/Score:} \\textbf{' + esc(s.gpa) + '}' : ''}}{${esc(s.eduLocation || s.location || '')}}\n`,

  projects: (s) => `\\resumeProjectHeading{${link(s.projectLink, s.projectName || 'Project')}` +
    `${s.projectGithubLink ? ' \\href{' + url(s.projectGithubLink) + '}{\\raisebox{-0.1\\height}{\\faExternalLink*}}' : ''}` +
    `${s.projectTechnologies ? ' $|$ \\underline{' + esc(s.projectTechnologies) + '}' : ''}}{${esc(s.projectDuration || '')}}\n` +
    bullets([...lines(s.projectDescription), ...lines(s.projectKeyFeatures)]),

  skills: (s) => `\\begin{itemize}[leftmargin=0.15in, label={}]\n\\small{\\item{\n` +
    [['Languages', s.technical], ['Technologies/Frameworks', s.frameworks], ['Developer Tools', s.tools || s.developerTools], ['Soft Skills', s.soft]]
      .filter(([, v]) => v && String(v).trim()).map(([k, v]) => `\\textbf{\\normalsize{${k}:}} \\normalsize{${esc(v)}}`).join(' \\\\\n') +
    `\n}}\n\\end{itemize}\n`,

  certifications: (s) => {
    const title = [s.certName, s.certIssuer].filter(Boolean).join(' -- ')
    const desc = lines(s.description)
    return `\\resumeSubheading{${esc(title || 'Certification')}}{${esc(s.certDate || '')}}{${desc[0] ? esc(desc[0]) : ''}}{}\n` +
      (desc.length > 1 ? bullets(desc.slice(1)) : '')
  },

  achievements: (s) => {
    const title = esc(s.achievementTitle || s.title || '')
    const desc = lines(s.achievementDescription || s.description)
    return title ? `\\resumeSubheading{${title}}{${esc(s.achievementDate || s.date || '')}}{}{}\n` + bullets(desc) : bullets(desc)
  },

  awards: (s) => {
    const title = [s.awardName, s.awardOrganization].filter(Boolean).join(' -- ')
    const desc = lines(s.awardDescription || s.description)
    return `\\resumeSubheading{${esc(title || 'Award')}}{${esc(s.awardDate || '')}}{}{}\n` + bullets(desc)
  },

  declaration: (s) => `\\small ${esc(s.declarationText)}\n`,
}

const BULLET_TYPES = new Set([
  'languages', 'interests', 'strengths',
  'softSkills', 'hackathons', 'training', 'publications', 'memberships', 'scholarships'
])

function generic(s, type) {
  const entries = Object.entries(s).filter(([k, v]) => !SKIP.has(k) && String(v ?? '').trim())
  if (!entries.length) return ''
  if (BULLET_TYPES.has(type)) {
    const items = entries.flatMap(([k, v]) => BODY.has(k) || entries.length === 1 ? lines(v) : [String(v).trim()])
    return bullets(entries.length > 1 && !entries.some(([k]) => BODY.has(k))
      ? [entries.map(([, v]) => String(v).trim()).join(' -- ')] : items)
  }
  const body = entries.filter(([k]) => BODY.has(k)).flatMap(([, v]) => lines(v))
  const rest = entries.filter(([k]) => !BODY.has(k))
  const [, head] = rest[0] || ['', '']
  const tail = rest.slice(1).map(([k, v]) => `${prettify(k)}: ${esc(v)}`).join(' \\quad|\\quad ')
  return `\\resumeSubheading{${esc(head)}}{}{${tail}}{}\n` + bullets(body)
}

const LIST_TYPES = new Set(['experience', 'education', 'projects', 'internships', 'certifications', 'achievements', 'awards'])
const HEAD = (t) => `\\section{${esc(t).toUpperCase()}}\n`

export function structuredToLatex({ sections = [], visibleSections, sectionOrder, settings = {} }) {
  const color = (String(settings.primaryColor || '0E5484').replace('#', '').match(/^[0-9a-fA-F]{6}$/) || ['0E5484'])[0]
  const p = sections.find(s => s.type === 'personal') || {}
  const active = visibleSections?.length ? visibleSections : [...new Set(sections.map(s => s.type))]
  const order = [...(sectionOrder || []).filter(t => active.includes(t)), ...active.filter(t => !(sectionOrder || []).includes(t))]

  const contacts = [
    p.phone && `\\href{tel:${esc(p.phone).replace(/[^+\d]/g, '')}}{\\raisebox{-0.01\\height}{\\faPhone}\\ \\underline{${esc(p.phone)}}}`,
    p.email && `\\href{mailto:${p.email}}{\\raisebox{-0.2\\height}{\\faEnvelope}\\ \\underline{${esc(p.email)}}}`,
    p.linkedin && `\\href{${url(p.linkedin)}}{\\raisebox{-0.2\\height}{\\faLinkedin}\\ \\underline{LinkedIn}}`,
    p.github && `\\href{${url(p.github)}}{\\raisebox{-0.2\\height}{\\faGithub}\\ \\underline{GitHub}}`,
    (p.portfolio || p.website) && `\\href{${url(p.portfolio || p.website)}}{\\raisebox{-0.2\\height}{\\faGlobe}\\ \\underline{Portfolio}}`,
  ].filter(Boolean).join(' ~ ')

  let body = ''
  for (const type of order) {
    if (type === 'personal') continue
    const secs = sections.filter(s => s.type === type)
    if (!secs.length) continue
    const title = secs[0].customSectionHeading || (type === 'custom' && secs[0].customSectionTitle) || TITLES[type] || prettify(type)
    const fn = render[type]
    const inner = secs.map(s => fn ? fn(s) : generic(s, type)).join('')
    if (!inner.trim()) continue
    body += HEAD(title) + (LIST_TYPES.has(type) ? `\\resumeSubHeadingListStart\n${inner}\\resumeSubHeadingListEnd\n` : inner) + '\\vspace{-8pt}\n'
  }

  return PREAMBLE(color) + `\\begin{document}\n\\begin{center}\n  {\\Huge \\scshape ${esc(p.name || 'Your Name')}} \\\\ \\vspace{1pt}\n` +
    `  ${p.professionalTitle ? esc(p.professionalTitle) + ' \\\\ \\vspace{1pt}\n  ' : ''}${p.location ? esc(p.location) + ' \\\\ \\vspace{1pt}\n  ' : ''}` +
    `\\small ${contacts}\n  \\vspace{-8pt}\n\\end{center}\n\n${body}\n\\end{document}\n`
}

const PREAMBLE = (hex) => String.raw`\documentclass[letterpaper,11pt]{article}
\usepackage{latexsym}
\usepackage[empty]{fullpage}
\usepackage{titlesec}
\usepackage{marvosym}
\usepackage[usenames,dvipsnames,svgnames]{xcolor}
\usepackage{verbatim}
\usepackage{enumitem}
\usepackage[hidelinks]{hyperref}
\usepackage[english]{babel}
\usepackage{tabularx}
\usepackage{fontawesome5}
\usepackage{graphicx}
\input{glyphtounicode}
\definecolor{accent}{HTML}{${hex}}
\addtolength{\oddsidemargin}{-0.6in}
\addtolength{\evensidemargin}{-0.5in}
\addtolength{\textwidth}{1.19in}
\addtolength{\topmargin}{-.7in}
\addtolength{\textheight}{1.4in}
\urlstyle{same}
\raggedbottom
\raggedright
\setlength{\tabcolsep}{0in}
\titleformat{\section}{\vspace{-4pt}\scshape\raggedright\large\bfseries}{}{0em}{}[\titlerule \vspace{-5pt}]
\pdfgentounicode=1
\newcommand{\resumeItem}[1]{\item\small{{#1 \vspace{-2pt}}}}
\newcommand{\resumeSubheading}[4]{\vspace{-2pt}\item
  \begin{tabular*}{1.0\textwidth}[t]{l@{\extracolsep{\fill}}r}
    \textbf{\large #1} & \textbf{\small #2} \\
    \textit{\large #3} & \textit{\small #4} \\
  \end{tabular*}\vspace{-7pt}}
\newcommand{\resumeProjectHeading}[2]{\item
  \begin{tabular*}{1.001\textwidth}{l@{\extracolsep{\fill}}r}
    \small #1 & \textbf{\small #2}\\
  \end{tabular*}\vspace{-7pt}}
\renewcommand\labelitemi{$\vcenter{\hbox{\tiny$\bullet$}}$}
\renewcommand\labelitemii{$\vcenter{\hbox{\tiny$\bullet$}}$}
\newcommand{\resumeSubHeadingListStart}{\begin{itemize}[leftmargin=0.0in, label={}]}
\newcommand{\resumeSubHeadingListEnd}{\end{itemize}}
\newcommand{\resumeItemListStart}{\begin{itemize}}
\newcommand{\resumeItemListEnd}{\end{itemize}\vspace{-5pt}}
`

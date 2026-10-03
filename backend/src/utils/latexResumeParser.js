/**
 * Lightweight LaTeX Resume Parser
 * Parses standard LaTeX resume code into structured resume sections
 * Used as a zero-dependency fallback when pdflatex binary is not present on the host.
 */

function cleanLatexText(text) {
  if (!text) return ''
  return text
    .replace(/\\href\{[^}]*\}\{([^}]+)\}/g, '$1') // \href{url}{text} -> text
    .replace(/\\textbf\{([^}]+)\}/g, '$1')          // \textbf{text} -> text
    .replace(/\\textit\{([^}]+)\}/g, '$1')          // \textit{text} -> text
    .replace(/\\emph\{([^}]+)\}/g, '$1')            // \emph{text} -> text
    .replace(/\\underline\{([^}]+)\}/g, '$1')       // \underline{text} -> text
    .replace(/\\scshape/g, '')
    .replace(/\\Huge/g, '')
    .replace(/\\huge/g, '')
    .replace(/\\Large/g, '')
    .replace(/\\large/g, '')
    .replace(/\\small/g, '')
    .replace(/\\footnotesize/g, '')
    .replace(/\\bfseries/g, '')
    .replace(/\\itshape/g, '')
    .replace(/\\&/g, '&')
    .replace(/\\%/g, '%')
    .replace(/\\\$/g, '$')
    .replace(/\\#/g, '#')
    .replace(/\\_/g, '_')
    .replace(/[{}\\]/g, '')
    .trim()
}

function parseLatexResume(latexCode) {
  if (!latexCode || typeof latexCode !== 'string') return []

  const sections = []
  const lines = latexCode.split('\n')

  // 1. Extract Personal Info from header / top
  const personal = {
    id: `personal-${Date.now()}`,
    type: 'personal',
    name: 'Your Name',
    professionalTitle: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: ''
  }

  // Look for name
  const nameMatch = latexCode.match(/\\textbf\{(?:\\[a-zA-Z]+\s*)*([A-Za-z\s.'-]+)\}/) ||
                    latexCode.match(/\\Huge\s*\{?([A-Za-z\s.'-]+)\}?/) ||
                    latexCode.match(/\\name\{([A-Za-z]+)\}\{([A-Za-z]+)\}/)

  if (nameMatch) {
    if (nameMatch[2]) {
      personal.name = `${nameMatch[1]} ${nameMatch[2]}`.trim()
    } else {
      personal.name = cleanLatexText(nameMatch[1])
    }
  }

  // Look for email
  const emailMatch = latexCode.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  if (emailMatch) personal.email = emailMatch[1]

  // Look for phone
  const phoneMatch = latexCode.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  if (phoneMatch) personal.phone = phoneMatch[0]

  // Look for links
  const linkedinMatch = latexCode.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/)
  if (linkedinMatch) personal.linkedin = `linkedin.com/in/${linkedinMatch[1]}`

  const githubMatch = latexCode.match(/github\.com\/([a-zA-Z0-9_-]+)/)
  if (githubMatch) personal.github = `github.com/${githubMatch[1]}`

  sections.push(personal)

  // 2. Parse \section{...} blocks
  const sectionRegex = /\\section\{([^}]+)\}/g
  let match
  const sectionPositions = []

  while ((match = sectionRegex.exec(latexCode)) !== null) {
    sectionPositions.push({
      title: cleanLatexText(match[1]),
      startIndex: match.index + match[0].length
    })
  }

  for (let i = 0; i < sectionPositions.length; i++) {
    const current = sectionPositions[i]
    const nextIndex = i < sectionPositions.length - 1 ? sectionPositions[i + 1].startIndex : latexCode.length
    const sectionBody = latexCode.substring(current.startIndex, nextIndex)

    const lowerTitle = current.title.toLowerCase()

    if (lowerTitle.includes('experience') || lowerTitle.includes('work') || lowerTitle.includes('employment')) {
      // Parse experience subheadings
      const subheadings = sectionBody.split(/\\resumeSubheading|\s*\\cventry/)
      subheadings.slice(1).forEach(block => {
        // format: {role}{dates}{company}{location}
        const parts = []
        const partRegex = /\{([^}]*)\}/g
        let p
        while ((p = partRegex.exec(block)) !== null && parts.length < 4) {
          parts.push(cleanLatexText(p[1]))
        }

        // Extract bullets
        const bullets = []
        const bulletRegex = /\\resumeItem\{([^}]+)\}|\\item\s+([^\n\\]+)/g
        let b
        while ((b = bulletRegex.exec(block)) !== null) {
          bullets.push(cleanLatexText(b[1] || b[2]))
        }

        sections.push({
          id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'experience',
          role: parts[0] || 'Software Engineer',
          startDate: parts[1] ? parts[1].split('-')[0]?.trim() || '' : '',
          endDate: parts[1] ? parts[1].split('-')[1]?.trim() || '' : '',
          company: parts[2] || 'Company',
          expLocation: parts[3] || '',
          description: bullets.join('\n')
        })
      })
    } else if (lowerTitle.includes('education') || lowerTitle.includes('academic')) {
      // Parse education subheadings
      const subheadings = sectionBody.split(/\\resumeSubheading|\s*\\cventry/)
      subheadings.slice(1).forEach(block => {
        const parts = []
        const partRegex = /\{([^}]*)\}/g
        let p
        while ((p = partRegex.exec(block)) !== null && parts.length < 4) {
          parts.push(cleanLatexText(p[1]))
        }

        sections.push({
          id: `edu-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'education',
          degree: parts[1] || parts[0] || 'Bachelor of Science',
          institution: parts[0] || parts[2] || 'University',
          startYear: parts[1] && parts[1].includes('-') ? parts[1].split('-')[0].trim() : '',
          endYear: parts[1] && parts[1].includes('-') ? parts[1].split('-')[1].trim() : parts[1] || '2024'
        })
      })
    } else if (lowerTitle.includes('project')) {
      // Parse projects
      const projectBlocks = sectionBody.split(/\\resumeProjectHeading/)
      projectBlocks.slice(1).forEach(block => {
        const parts = []
        const partRegex = /\{([^}]*)\}/g
        let p
        while ((p = partRegex.exec(block)) !== null && parts.length < 2) {
          parts.push(cleanLatexText(p[1]))
        }

        const bullets = []
        const bulletRegex = /\\resumeItem\{([^}]+)\}|\\item\s+([^\n\\]+)/g
        let b
        while ((b = bulletRegex.exec(block)) !== null) {
          bullets.push(cleanLatexText(b[1] || b[2]))
        }

        sections.push({
          id: `proj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'projects',
          projectName: parts[0] || 'Project',
          projectDuration: parts[1] || '',
          projectDescription: bullets.join('\n')
        })
      })
    } else if (lowerTitle.includes('skill')) {
      // Extract skills
      const skillText = cleanLatexText(sectionBody)
        .replace(/Technical Skills|Skills|Languages|Frameworks|Developer Tools/gi, '')
        .trim()

      sections.push({
        id: `skills-${Date.now()}`,
        type: 'skills',
        technical: skillText,
        soft: 'Leadership, Problem Solving, Communication'
      })
    } else {
      // Custom section
      const content = cleanLatexText(sectionBody)
      if (content.length > 5) {
        sections.push({
          id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type: 'custom',
          customSectionHeading: current.title,
          customSectionContent: content
        })
      }
    }
  }

  return sections
}

module.exports = {
  cleanLatexText,
  parseLatexResume
}

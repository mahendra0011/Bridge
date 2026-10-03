/**
 * Smart Resume Parser & Intelligent Field Mapper
 * Automatically extracts and maps unstructured resume text, LinkedIn profile exports,
 * and uploaded PDF content into ResumeBuilder's exact section placeholders.
 */

// Categorized dictionaries for skill separation
const TECH_LANGUAGES = new Set([
  'javascript', 'typescript', 'python', 'java', 'c', 'c++', 'c#', 'golang', 'go',
  'rust', 'ruby', 'php', 'swift', 'kotlin', 'dart', 'scala', 'sql', 'r', 'matlab',
  'html', 'html5', 'css', 'css3', 'sass', 'bash', 'shell', 'powershell', 'solidity'
])

const FRAMEWORKS_TOOLS = new Set([
  'react', 'react.js', 'reactjs', 'next.js', 'nextjs', 'vue', 'vue.js', 'angular',
  'node.js', 'nodejs', 'express', 'express.js', 'nestjs', 'fastapi', 'django', 'flask',
  'spring', 'spring boot', 'laravel', 'graphql', 'rest api', 'rest apis', 'grpc',
  'docker', 'kubernetes', 'k8s', 'aws', 'amazon web services', 'azure', 'gcp', 'google cloud',
  'mongodb', 'postgresql', 'postgres', 'mysql', 'redis', 'elasticsearch', 'firebase',
  'git', 'github', 'gitlab', 'ci/cd', 'github actions', 'jenkins', 'terraform', 'ansible',
  'linux', 'tailwind', 'tailwindcss', 'bootstrap', 'material ui', 'webpack', 'vite', 'figma'
])

const SOFT_SKILLS = new Set([
  'leadership', 'team leadership', 'communication', 'problem solving', 'critical thinking',
  'collaboration', 'teamwork', 'agile', 'scrum', 'time management', 'adaptability',
  'mentorship', 'conflict resolution', 'presentation', 'negotiation', 'analytical skills'
])

/**
 * Classify any URLs in the text into specific platform buckets
 */
export function classifyLinks(rawText) {
  if (!rawText) return { classified: {}, extraLinks: [] }

  const urlRegex = /(?:https?:\/\/|www\.)[^\s<>"'{}|\\^`\[\]]+/gi
  const matches = rawText.match(urlRegex) || []

  // De-duplicate URLs
  const uniqueUrls = Array.from(new Set(matches.map(u => {
    let url = u.trim().replace(/[.,;:)\]]+$/, '')
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    }
    return url
  })))

  const classified = {
    linkedin: '',
    github: '',
    portfolio: '',
    website: '',
    twitter: '',
    leetcode: '',
    hackerrank: '',
    medium: '',
    behance: '',
    youtube: '',
    kaggle: ''
  }

  const extraLinks = []

  uniqueUrls.forEach(url => {
    const lower = url.toLowerCase()

    if (lower.includes('linkedin.com') && !classified.linkedin) {
      classified.linkedin = url
    } else if (lower.includes('github.com') && !classified.github) {
      classified.github = url
    } else if ((lower.includes('twitter.com') || lower.includes('x.com')) && !classified.twitter) {
      classified.twitter = url
      extraLinks.push({ platform: 'Twitter / X', url })
    } else if (lower.includes('leetcode.com') && !classified.leetcode) {
      classified.leetcode = url
      extraLinks.push({ platform: 'LeetCode', url })
    } else if ((lower.includes('hackerrank.com') || lower.includes('codeforces.com') || lower.includes('codechef.com')) && !classified.hackerrank) {
      classified.hackerrank = url
      extraLinks.push({ platform: 'Competitive Programming', url })
    } else if ((lower.includes('medium.com') || lower.includes('dev.to') || lower.includes('hashnode.com')) && !classified.medium) {
      classified.medium = url
      extraLinks.push({ platform: 'Tech Blog', url })
    } else if ((lower.includes('behance.net') || lower.includes('dribbble.com')) && !classified.behance) {
      classified.behance = url
      extraLinks.push({ platform: 'Design Portfolio', url })
    } else if ((lower.includes('youtube.com') || lower.includes('youtu.be')) && !classified.youtube) {
      classified.youtube = url
      extraLinks.push({ platform: 'YouTube', url })
    } else if (lower.includes('kaggle.com') && !classified.kaggle) {
      classified.kaggle = url
      extraLinks.push({ platform: 'Kaggle', url })
    } else if (!classified.portfolio && (lower.includes('portfolio') || lower.includes('.me') || lower.includes('.dev') || lower.includes('.io') || lower.includes('github.io'))) {
      classified.portfolio = url
    } else if (!classified.website) {
      classified.website = url
    } else {
      // Extra custom links beyond standard fields
      let domainLabel = 'Website Link'
      try {
        const parsedUrl = new URL(url)
        domainLabel = parsedUrl.hostname.replace(/^www\./, '')
      } catch (_) {}
      extraLinks.push({ platform: domainLabel, url })
    }
  })

  // If website is filled but portfolio is empty, or vice versa
  if (!classified.website && classified.portfolio) {
    classified.website = classified.portfolio
  } else if (!classified.portfolio && classified.website) {
    classified.portfolio = classified.website
  }

  return { classified, extraLinks, allDetectedCount: uniqueUrls.length }
}

/**
 * Intelligent Text Parser that converts raw text into structured resume fields
 */
export function parseResumeRawText(rawText) {
  if (!rawText || typeof rawText !== 'string') return null

  const lines = rawText
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean)

  if (lines.length === 0) return null

  // 1. Extract Links using intelligent link classifier
  const { classified: linkMap, extraLinks } = classifyLinks(rawText)

  // 2. Extract Contact Essentials
  const emailMatch = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i)
  const email = emailMatch ? emailMatch[1].trim() : ''

  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{4}/)
  const phone = phoneMatch ? phoneMatch[0].trim() : ''

  // 3. Section Segmentation via semantic heading triggers
  const SECTION_PATTERNS = {
    summary: /^(?:professional\s+)?(?:summary|about|about\s+me|profile|executive\s+summary|objective)$/i,
    experience: /^(?:work\s+history|work\s+experience|professional\s+experience|experience|employment|job\s+history)$/i,
    education: /^(?:education|academic\s+background|academics|educational\s+qualifications|degrees)$/i,
    skills: /^(?:skills|technical\s+skills|core\s+competencies|skills\s+&\s+tools|technologies|top\s+skills)$/i,
    projects: /^(?:projects|featured\s+projects|personal\s+projects|key\s+projects|academic\s+projects)$/i,
    certifications: /^(?:certifications|licenses\s+&\s+certifications|certificates|courses)$/i
  }

  const sectionsData = {
    header: [],
    summary: [],
    experience: [],
    education: [],
    skills: [],
    projects: [],
    certifications: []
  }

  let currentSec = 'header'

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    let matchedHeading = null
    for (const [secKey, regex] of Object.entries(SECTION_PATTERNS)) {
      if (regex.test(line) || regex.test(line.replace(/[:\-–—#*]/g, '').trim())) {
        matchedHeading = secKey
        break
      }
    }

    if (matchedHeading) {
      currentSec = matchedHeading
      continue
    }

    sectionsData[currentSec].push(line)
  }

  // 4. Header details (Name, Title, Location)
  let name = ''
  let professionalTitle = ''
  let location = ''

  if (sectionsData.header.length > 0) {
    // First non-link, non-contact line is usually the Candidate's Name
    const nameCandidate = sectionsData.header.find(l => 
      !l.includes('@') && 
      !l.match(/(?:https?:\/\/|\.com|\.org|\.in|\.net)/i) && 
      !l.match(/^\+?\d/) &&
      l.length < 50
    )
    if (nameCandidate) {
      name = nameCandidate.replace(/^(?:Name|Candidate|Curriculum Vitae|Resume|CV)\s*[:\-–]\s*/i, '').trim()
    }

    // Role / Title is usually line 2 or after name
    const roleCandidate = sectionsData.header.find(l => 
      l !== nameCandidate && 
      !l.includes('@') && 
      !l.match(/(?:https?:\/\/|\.com|\.org|\.in|\.net)/i) &&
      !l.match(/^\+?\d/) &&
      (l.includes('|') || l.includes('Engineer') || l.includes('Developer') || l.includes('Manager') || l.includes('Lead') || l.includes('Designer') || l.includes('Analyst') || l.includes('Specialist') || l.includes('Intern'))
    )
    if (roleCandidate) {
      professionalTitle = roleCandidate.split('|')[0].trim()
    }

    // Location detection in header
    const locCandidate = sectionsData.header.find(l => 
      l !== nameCandidate &&
      l !== roleCandidate &&
      !l.includes('@') &&
      !l.match(/(?:https?:\/\/|\.com)/i) &&
      (l.includes(',') || /area|city|delhi|mumbai|bangalore|san francisco|california|new york|london|india|usa|united states|remote/i.test(l))
    )
    if (locCandidate) {
      location = locCandidate.replace(/·.*$/, '').trim()
    }
  }

  // Fallback for role from raw text if not found in header
  if (!professionalTitle) {
    const titleMatch = rawText.match(/(?:Full\s*Stack|Software|Frontend|Backend|DevOps|Data|Mobile|UI\/UX|Product|Cloud)\s*(?:Engineer|Developer|Designer|Architect|Manager|Intern)/i)
    if (titleMatch) professionalTitle = titleMatch[0]
  }

  // 5. Professional Summary
  const summaryText = sectionsData.summary.join(' ').trim()

  // 6. Work Experience Entries Parsing
  const parsedExperiences = []
  let currentExp = null

  sectionsData.experience.forEach(line => {
    const isBullet = /^[•\-\*▪▸►–—]\s*/.test(line) || /^\d+\.\s*/.test(line)
    const isDate = /\b(?:19\d\d|20\d\d|present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line) && /[-–—to]/.test(line)

    if (isBullet && currentExp) {
      const cleanBullet = line.replace(/^[•\-\*▪▸►–—\d.]\s*/, '').trim()
      if (cleanBullet) currentExp.bullets.push(cleanBullet)
    } else if (isDate && currentExp) {
      currentExp.dateRange = line
    } else if (!currentExp || (currentExp.company && currentExp.role && currentExp.bullets.length > 0 && !isBullet)) {
      // Start a new experience block
      if (currentExp && (currentExp.company || currentExp.role)) {
        parsedExperiences.push(currentExp)
      }
      currentExp = {
        role: line,
        company: '',
        dateRange: '',
        location: '',
        bullets: []
      }
    } else if (currentExp && !currentExp.company) {
      // Line after role is usually company
      currentExp.company = line.replace(/·.*$/, '').trim()
    } else if (currentExp && isDate && !currentExp.dateRange) {
      currentExp.dateRange = line
    } else if (currentExp) {
      currentExp.bullets.push(line)
    }
  })
  if (currentExp && (currentExp.company || currentExp.role)) {
    parsedExperiences.push(currentExp)
  }

  // 7. Education Entries Parsing
  const parsedEducation = []
  let currentEdu = null

  sectionsData.education.forEach(line => {
    const isDate = /\b(?:19\d\d|20\d\d)\b/.test(line) && /[-–—to]/.test(line)
    const isGpa = /(?:gpa|cgpa|percentage|%|marks)/i.test(line)

    if (!currentEdu) {
      currentEdu = {
        institution: line,
        degree: '',
        startYear: '',
        endYear: '',
        gpa: ''
      }
    } else if (!currentEdu.degree && !isDate && !isGpa) {
      currentEdu.degree = line
    } else if (isDate) {
      const years = line.match(/\b(19\d\d|20\d\d)\b/g)
      if (years && years.length >= 2) {
        currentEdu.startYear = years[0]
        currentEdu.endYear = years[1]
      } else if (years && years.length === 1) {
        currentEdu.endYear = years[0]
      }
    } else if (isGpa) {
      currentEdu.gpa = line
    } else {
      // Finalize this education block and start next
      parsedEducation.push(currentEdu)
      currentEdu = {
        institution: line,
        degree: '',
        startYear: '',
        endYear: '',
        gpa: ''
      }
    }
  })
  if (currentEdu && (currentEdu.institution || currentEdu.degree)) {
    parsedEducation.push(currentEdu)
  }

  // 8. Skills Parsing and Smart Partitioning
  const rawSkillTokens = []
  sectionsData.skills.forEach(l => {
    const parts = l.split(/[·,•|;]/).map(p => p.trim()).filter(Boolean)
    if (parts.length > 1) {
      rawSkillTokens.push(...parts)
    } else if (l.trim()) {
      rawSkillTokens.push(l.trim())
    }
  })

  const techSkills = []
  const frameworkSkills = []
  const softSkills = []

  rawSkillTokens.forEach(tok => {
    const lower = tok.toLowerCase()
    if (TECH_LANGUAGES.has(lower)) {
      techSkills.push(tok)
    } else if (FRAMEWORKS_TOOLS.has(lower)) {
      frameworkSkills.push(tok)
    } else if (SOFT_SKILLS.has(lower)) {
      softSkills.push(tok)
    } else {
      // Default to technical if not explicitly soft skill
      if (/lead|manage|communicat|problem|team/i.test(lower)) {
        softSkills.push(tok)
      } else {
        techSkills.push(tok)
      }
    }
  })

  // 9. Projects Parsing
  const parsedProjects = []
  let currentProj = null

  sectionsData.projects.forEach(line => {
    const isBullet = /^[•\-\*▪▸►–—]\s*/.test(line)

    if (!currentProj) {
      currentProj = {
        projectName: line.replace(/[:\-–—].*$/, '').trim(),
        projectTechnologies: '',
        projectDescription: '',
        bullets: []
      }
      if (line.includes('|') || line.includes(':')) {
        const parts = line.split(/[:|]/)
        currentProj.projectName = parts[0].trim()
        currentProj.projectTechnologies = parts.slice(1).join(', ').trim()
      }
    } else if (isBullet) {
      currentProj.bullets.push(line.replace(/^[•\-\*▪▸►–—]\s*/, '').trim())
    } else if (!currentProj.projectTechnologies && (line.includes('React') || line.includes('Python') || line.includes('Node') || line.includes('Tech:'))) {
      currentProj.projectTechnologies = line.replace(/^Tech(?:nologies)?\s*[:\-–]\s*/i, '').trim()
    } else {
      if (currentProj.bullets.length > 0) {
        currentProj.projectDescription = currentProj.bullets.join('\n')
        parsedProjects.push(currentProj)
        currentProj = {
          projectName: line,
          projectTechnologies: '',
          projectDescription: '',
          bullets: []
        }
      } else {
        currentProj.bullets.push(line)
      }
    }
  })
  if (currentProj && currentProj.projectName) {
    currentProj.projectDescription = currentProj.bullets.join('\n') || currentProj.projectName
    parsedProjects.push(currentProj)
  }

  return {
    personal: {
      name: name || 'Candidate',
      professionalTitle: professionalTitle || 'Professional',
      email,
      phone,
      location,
      linkedin: linkMap.linkedin,
      github: linkMap.github,
      portfolio: linkMap.portfolio,
      website: linkMap.website
    },
    summary: summaryText,
    experience: parsedExperiences.map(e => {
      let startDate = ''
      let endDate = 'Present'
      let current = true

      if (e.dateRange) {
        const parts = e.dateRange.split(/[-–—to]/i).map(p => p.trim())
        if (parts.length >= 2) {
          startDate = parts[0]
          endDate = parts[1]
          current = /present|current/i.test(endDate)
        } else if (parts.length === 1) {
          startDate = parts[0]
        }
      }

      return {
        role: e.role,
        company: e.company,
        startDate: startDate || '2022',
        endDate: endDate || 'Present',
        current,
        description: e.bullets.join('\n'),
        technologiesUsed: ''
      }
    }),
    education: parsedEducation.map(ed => ({
      institution: ed.institution,
      degree: ed.degree || 'Degree Program',
      startYear: ed.startYear || '2019',
      endYear: ed.endYear || '2023',
      gpa: ed.gpa || ''
    })),
    skills: {
      technical: Array.from(new Set(techSkills)).join(', '),
      frameworks: Array.from(new Set(frameworkSkills)).join(', '),
      soft: Array.from(new Set(softSkills)).join(', ')
    },
    projects: parsedProjects.map(p => ({
      projectName: p.projectName,
      projectTechnologies: p.projectTechnologies,
      projectDescription: p.projectDescription
    })),
    extraLinks
  }
}

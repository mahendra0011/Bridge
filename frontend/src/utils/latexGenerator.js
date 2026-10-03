/**
 * LaTeX Resume Generator & LinkedIn Profile Parser
 * Converts structured user profile data into compiling LaTeX code for all presets.
 */

// Escape LaTeX reserved characters in plain text
export function escapeLatex(text) {
  if (!text) return ''
  return String(text)
    .replace(/\\/g, '\\textbackslash{}')
    .replace(/&/g, '\\&')
    .replace(/%/g, '\\%')
    .replace(/\$/g, '\\$')
    .replace(/#/g, '\\#')
    .replace(/_/g, '\\_')
    .replace(/\{/g, '\\{')
    .replace(/\}/g, '\\}')
    .replace(/~/g, '\\textasciitilde{}')
    .replace(/\^/g, '\\textasciicircum{}')
}

// Safely escape only unescaped characters in already-formatted strings
export function safeEscapeLatex(text) {
  if (!text) return ''
  return String(text)
    .replace(/(?<!\\)&/g, '\\&')
    .replace(/(?<!\\)%/g, '\\%')
    .replace(/(?<!\\)\$/g, '\\$')
    .replace(/(?<!\\)#/g, '\\#')
    .replace(/(?<!\\)_/g, '\\_')
}

/**
 * Intelligent LinkedIn / Plaintext Resume Parser
 * Parses pasted text exported from LinkedIn, PDF copy-pastes, or resume text.
 */
export function parseLinkedInProfileText(rawText) {
  if (!rawText || typeof rawText !== 'string') return null

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean)
  if (lines.length === 0) return null

  const profile = {
    name: '',
    role: '',
    email: '',
    phone: '',
    location: '',
    linkedin: '',
    github: '',
    summary: '',
    skills: [],
    experience: [],
    education: [],
    projects: []
  }

  // 1. Detect Email, Phone, Links in whole text
  const emailMatch = rawText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)
  if (emailMatch) profile.email = emailMatch[1]

  const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/)
  if (phoneMatch) profile.phone = phoneMatch[0]

  const linkedinMatch = rawText.match(/linkedin\.com\/in\/([a-zA-Z0-9_-]+)/)
  if (linkedinMatch) profile.linkedin = `linkedin.com/in/${linkedinMatch[1]}`

  const githubMatch = rawText.match(/github\.com\/([a-zA-Z0-9_-]+)/)
  if (githubMatch) profile.github = `github.com/${githubMatch[1]}`

  // 2. Identify Sections based on standard headings
  let currentSection = 'header'
  let summaryLines = []
  let expBlocks = []
  let currentExp = null
  let eduBlocks = []
  let currentEdu = null
  let skillsLines = []

  const isHeading = (line) => {
    const l = line.toLowerCase()
    if (l === 'summary' || l === 'about' || l === 'about me' || l === 'professional summary') return 'summary'
    if (l === 'experience' || l === 'work experience' || l === 'employment' || l === 'work history') return 'experience'
    if (l === 'education' || l === 'academic background') return 'education'
    if (l === 'skills' || l === 'skills & competencies' || l === 'top skills' || l === 'technical skills') return 'skills'
    if (l === 'projects' || l === 'personal projects' || l === 'featured projects') return 'projects'
    return null
  }

  let headerLines = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const sectionMatch = isHeading(line)

    if (sectionMatch) {
      if (currentExp && currentExp.role) expBlocks.push(currentExp)
      currentExp = null
      if (currentEdu && currentEdu.institution) eduBlocks.push(currentEdu)
      currentEdu = null
      currentSection = sectionMatch
      continue
    }

    if (currentSection === 'header') {
      headerLines.push(line)
    } else if (currentSection === 'summary') {
      summaryLines.push(line)
    } else if (currentSection === 'skills') {
      skillsLines.push(line)
    } else if (currentSection === 'experience') {
      // Check if line looks like a bullet point
      const isBullet = line.startsWith('•') || line.startsWith('-') || line.startsWith('*') || line.startsWith('▪') || line.startsWith('▸')
      
      // Check if line looks like dates (e.g. "Jan 2022 - Present", "2019 -- 2021")
      const isDate = /\b(19\d\d|20\d\d|present|current|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\b/i.test(line) && /[-–—]/.test(line)

      if (isBullet && currentExp) {
        currentExp.points.push(line.replace(/^[•\-\*▪▸]\s*/, '').trim())
      } else if (isDate && currentExp) {
        currentExp.duration = line.replace(/·.*$/, '').trim()
      } else if (!currentExp || (currentExp.role && currentExp.company && currentExp.points.length > 0 && !isBullet)) {
        // Start a new experience block
        if (currentExp && currentExp.role) expBlocks.push(currentExp)
        currentExp = {
          role: line,
          company: '',
          duration: '',
          location: '',
          points: []
        }
      } else if (currentExp && !currentExp.company) {
        currentExp.company = line.replace(/·.*$/, '').trim()
      } else if (currentExp && !currentExp.duration && isDate) {
        currentExp.duration = line
      } else if (currentExp) {
        currentExp.points.push(line)
      }
    } else if (currentSection === 'education') {
      if (!currentEdu) {
        currentEdu = { institution: line, degree: '', duration: '', gpa: '' }
      } else if (!currentEdu.degree) {
        currentEdu.degree = line
      } else if (!currentEdu.duration) {
        currentEdu.duration = line
        eduBlocks.push(currentEdu)
        currentEdu = null
      }
    }
  }

  // Push remaining open blocks
  if (currentExp && currentExp.role) expBlocks.push(currentExp)
  if (currentEdu && currentEdu.institution) eduBlocks.push(currentEdu)

  // Parse header
  if (headerLines.length > 0) {
    profile.name = headerLines[0]
  }
  if (headerLines.length > 1) {
    // Second line is usually role / headline in LinkedIn
    const secondLine = headerLines[1]
    if (!secondLine.includes('@') && !secondLine.includes('http') && !secondLine.includes('.com')) {
      profile.role = secondLine.replace(/ at .*$/, '').trim()
    }
  }
  if (headerLines.length > 2 && !profile.location) {
    const locCandidate = headerLines.find(l => l.includes(',') || l.includes('Area') || l.includes('United States') || l.includes('India'))
    if (locCandidate && !locCandidate.includes('@')) {
      profile.location = locCandidate.replace(/·.*$/, '').trim()
    }
  }

  profile.summary = summaryLines.join(' ').trim()

  // Parse skills
  const allSkillItems = []
  skillsLines.forEach(l => {
    const split = l.split(/[·,•|;]/).map(s => s.trim()).filter(Boolean)
    if (split.length > 1) {
      allSkillItems.push(...split)
    } else if (l.trim()) {
      allSkillItems.push(l.trim())
    }
  })
  profile.skills = Array.from(new Set(allSkillItems))

  profile.experience = expBlocks
  profile.education = eduBlocks

  return profile
}

/**
 * Generate Complete LaTeX Code for any Starter Template from Profile Data
 */
export function generateLatexCode(presetKey, data) {
  const p = data.personal || data
  const name = escapeLatex(p.name || data.name || 'Alex Morgan')
  const role = escapeLatex(p.professionalTitle || p.role || data.role || 'Full Stack Engineer')
  const email = p.email || data.email || 'alex@example.com'
  const phone = escapeLatex(p.phone || data.phone || '123-456-7890')
  const location = escapeLatex(p.location || data.location || 'San Francisco, CA')
  const linkedin = (p.linkedin || data.linkedin) ? escapeLatex((p.linkedin || data.linkedin).replace(/^https?:\/\//, '')) : 'linkedin.com/in/alex'
  const github = (p.github || data.github) ? escapeLatex((p.github || data.github).replace(/^https?:\/\//, '')) : 'github.com/alex'
  const portfolio = (p.portfolio || p.website || data.portfolio || data.website) ? escapeLatex((p.portfolio || p.website || data.portfolio || data.website).replace(/^https?:\/\//, '')) : ''
  const summary = escapeLatex(data.summary || '')

  // Format skills
  let skillList = []
  if (data.skills && typeof data.skills === 'object' && !Array.isArray(data.skills)) {
    const combined = [data.skills.technical, data.skills.frameworks, data.skills.soft].filter(Boolean).join(', ')
    skillList = combined.split(',').map(s => s.trim()).filter(Boolean)
  } else if (Array.isArray(data.skills)) {
    skillList = data.skills.map(s => typeof s === 'string' ? s : s.name).filter(Boolean)
  }
  const skillsStr = escapeLatex(skillList.slice(0, 18).join(', ') || 'React, Node.js, TypeScript, Python, Docker, AWS')

  // Experiences formatting
  const experiences = (data.experience && data.experience.length > 0) ? data.experience.map(e => ({
    role: e.role || 'Software Engineer',
    company: e.company || 'Tech Company',
    location: e.location || location,
    duration: e.duration || (e.startDate ? `${e.startDate} -- ${e.current ? 'Present' : (e.endDate || 'Present')}` : '2022 -- Present'),
    points: e.points || (e.description ? e.description.split('\n').map(pt => pt.trim()).filter(Boolean) : [
      'Architected scalable cloud services reducing latency across core business workflows.',
      'Collaborated in cross-functional team to deploy modern containerized microservices.'
    ])
  })) : [
    {
      role: 'Senior Software Engineer',
      company: 'Tech Solutions Inc.',
      location: 'San Francisco, CA',
      duration: '2022 -- Present',
      points: [
        'Architected high-throughput microservices reducing latency by 35% across 10M daily requests.',
        'Mentored junior engineers and spearheaded automated CI/CD pipeline deployments on AWS.'
      ]
    }
  ]

  // Education formatting
  const educations = (data.education && data.education.length > 0) ? data.education.map(ed => ({
    institution: ed.institution || 'University',
    degree: ed.degree || 'B.S. in Computer Science',
    location: ed.location || ed.eduLocation || location,
    duration: ed.duration || (ed.startYear ? `${ed.startYear} -- ${ed.endYear || ''}` : '2018 -- 2022'),
    gpa: ed.gpa || ''
  })) : [
    {
      institution: 'University of Technology',
      degree: 'B.S. in Computer Science',
      location: 'San Francisco, CA',
      duration: '2018 -- 2022',
      gpa: '3.9 / 4.0'
    }
  ]

  // Projects formatting
  const projects = (data.projects && data.projects.length > 0) ? data.projects.map(pr => ({
    name: pr.projectName || pr.name || 'Cloud Platform',
    tech: pr.projectTechnologies || pr.tech || 'React, Node.js',
    duration: pr.duration || '2023',
    points: pr.points || (pr.projectDescription ? pr.projectDescription.split('\n').map(pt => pt.trim()).filter(Boolean) : ['Designed and implemented full stack architecture with real-time updates.'])
  })) : [
    {
      name: 'Distributed Cloud Engine',
      tech: 'Go, Kubernetes, gRPC',
      duration: '2023',
      points: ['Built resilient distributed scheduler processing thousands of concurrent task allocations.']
    }
  ]

  // 1. JAKE'S RESUME FORMAT
  if (presetKey === 'jakes') {
    return `%-------------------------
% Resume in LaTeX
% Generated with Bridge LaTeX Studio
%------------------------

\\documentclass[letterpaper,11pt]{article}

\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

% Adjust margins
\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}
\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

% Sections formatting
\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\begin{document}

%----------HEADING----------
\\begin{center}
    \\textbf{\\Huge \\scshape ${name}} \\\\ \\vspace{1pt}
    \\small ${phone} $|$ \\href{mailto:${email}}{\\underline{${email}}} $|$ 
    \\href{https://${linkedin}}{\\underline{${linkedin}}} $|$
    \\href{https://${github}}{\\underline{${github}}}${portfolio ? ` $|$ \\href{https://${portfolio}}{\\underline{${portfolio}}}` : ''}
\\end{center}

${summary ? `%-----------SUMMARY-----------
\\section{Summary}
  \\small{${summary}}
` : ''}
%-----------EDUCATION-----------
\\section{Education}
  \\begin{itemize}[leftmargin=0.15in, label={}]
${educations.map(edu => `    \\resumeSubheading
      {${escapeLatex(edu.institution || 'University')}}{${escapeLatex(edu.location || '')}}
      {${escapeLatex(edu.degree || 'Degree')}${edu.gpa ? `, GPA: ${escapeLatex(edu.gpa)}` : ''}}{${escapeLatex(edu.duration || '')}}`).join('\n')}
  \\end{itemize}

%-----------EXPERIENCE-----------
\\section{Experience}
  \\begin{itemize}[leftmargin=0.15in, label={}]
${experiences.map(exp => `    \\resumeSubheading
      {${escapeLatex(exp.role || 'Role')}}{${escapeLatex(exp.duration || '')}}
      {${escapeLatex(exp.company || 'Company')}}{${escapeLatex(exp.location || '')}}
      \\begin{itemize}
${(exp.points || ['Contributed to key business projects.']).map(pt => `        \\resumeItem{${escapeLatex(pt)}}`).join('\n')}
      \\end{itemize}`).join('\n')}
  \\end{itemize}

%-----------PROJECTS-----------
\\section{Projects}
  \\begin{itemize}[leftmargin=0.15in, label={}]
${projects.map(proj => `    \\resumeSubheading
      {${escapeLatex(proj.name || 'Project')}}{${escapeLatex(proj.duration || '')}}
      {${escapeLatex(proj.tech || '')}}{}
      \\begin{itemize}
${(proj.points || [proj.desc || 'Developed and deployed application.']).map(pt => `        \\resumeItem{${escapeLatex(pt)}}`).join('\n')}
      \\end{itemize}`).join('\n')}
  \\end{itemize}

%-----------TECHNICAL SKILLS-----------
\\section{Technical Skills}
 \\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Skills}{: ${skillsStr}}
    }}
 \\end{itemize}

\\end{document}
`
  }

  // 2. AWESOME-CV FORMAT
  if (presetKey === 'awesomecv') {
    return `\\documentclass[letterpaper,11pt]{article}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{enumitem}
\\usepackage{xcolor}

\\definecolor{awesome-teal}{HTML}{0D9488}
\\definecolor{darktext}{HTML}{1E293B}

\\titleformat{\\section}{\\large\\bfseries\\color{awesome-teal}}{}{0em}{}[\\color{awesome-teal}\\titlerule]

\\begin{document}
\\color{darktext}

\\begin{center}
  {\\Huge \\textbf{\\color{awesome-teal} ${name}}} \\\\ \\vspace{2pt}
  \\textbf{\\small ${role}} \\\\ \\vspace{3pt}
  \\small ${location} $|$ \\href{mailto:${email}}{${email}} $|$ ${phone} $|$ \\href{https://${linkedin}}{${linkedin}}${github ? ` $|$ \\href{https://${github}}{${github}}` : ''}${portfolio ? ` $|$ \\href{https://${portfolio}}{${portfolio}}` : ''}
\\end{center}

${summary ? `\\section{Professional Summary}
${summary}
` : ''}
\\section{Work Experience}
${experiences.map(exp => `\\textbf{${escapeLatex(exp.role || 'Role')}} \\hfill \\textbf{${escapeLatex(exp.company || 'Company')}} \\\\
\\textit{${escapeLatex(exp.location || '')}} \\hfill ${escapeLatex(exp.duration || '')}
\\begin{itemize}[leftmargin=0.2in, noitemsep]
${(exp.points || ['Delivered business results.']).map(pt => `  \\item ${escapeLatex(pt)}`).join('\n')}
\\end{itemize}
\\vspace{4pt}`).join('\n')}

\\section{Education}
${educations.map(edu => `\\textbf{${escapeLatex(edu.institution || 'University')}} \\hfill ${escapeLatex(edu.duration || '')} \\\\
${escapeLatex(edu.degree || 'Degree')} \\hfill \\textit{${escapeLatex(edu.location || '')}}`).join('\n\\vspace{2pt}\n')}

\\section{Core Competencies}
\\textbf{Technical Stack:} ${skillsStr}

\\end{document}
`
  }

  // 3. FAANGPATH MINIMALIST (PURE ATS)
  if (presetKey === 'faangpath') {
    return `\\documentclass[letterpaper,10pt]{article}
\\usepackage[margin=0.5in]{geometry}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\pagestyle{empty}
\\raggedbottom
\\raggedright

\\begin{document}

\\begin{center}
  {\\Large \\textbf{${name.toUpperCase()}}} \\\\
  ${location} $|$ ${phone} $|$ ${email} $|$ ${linkedin}${github ? ` $|$ ${github}` : ''}${portfolio ? ` $|$ ${portfolio}` : ''}
\\end{center}

\\vspace{-6pt}
\\hrulefill
\\vspace{4pt}

\\textbf{TECHNICAL SKILLS} \\\\
${skillsStr}

\\vspace{6pt}
\\textbf{WORK EXPERIENCE} \\\\
${experiences.map(exp => `\\textbf{${escapeLatex(exp.role || 'Role')}} \\hfill ${escapeLatex(exp.duration || '')} \\\\
\\textit{${escapeLatex(exp.company || 'Company')}} \\hfill ${escapeLatex(exp.location || '')}
\\begin{itemize}[leftmargin=0.15in, noitemsep, topsep=1pt]
${(exp.points || ['Engineered core components.']).map(pt => `  \\item ${escapeLatex(pt)}`).join('\n')}
\\end{itemize}
\\vspace{4pt}`).join('\n')}

\\vspace{2pt}
\\textbf{EDUCATION} \\\\
${educations.map(edu => `\\textbf{${escapeLatex(edu.institution || 'University')}} \\hfill ${escapeLatex(edu.duration || '')} \\\\
${escapeLatex(edu.degree || 'Degree')}${edu.gpa ? `, GPA: ${escapeLatex(edu.gpa)}` : ''}`).join('\n')}

\\end{document}
`
  }

  // 4. MODERNCV EXECUTIVE FORMAT
  if (presetKey === 'moderncv') {
    return `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=0.6in]{geometry}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0em}{}[\\titlerule]

\\begin{document}

\\begin{center}
  {\\Huge \\textbf{${name}}} \\\\ \\vspace{3pt}
  \\textbf{${role}} \\\\ \\vspace{2pt}
  \\small ${location} $|$ ${phone} $|$ \\href{mailto:${email}}{${email}} $|$ \\href{https://${linkedin}}{${linkedin}}${github ? ` $|$ \\href{https://${github}}{${github}}` : ''}${portfolio ? ` $|$ \\href{https://${portfolio}}{${portfolio}}` : ''}
\\end{center}

${summary ? `\\section{Executive Profile}
${summary}
` : ''}
\\section{Professional Experience}
${experiences.map(exp => `\\textbf{${escapeLatex(exp.company || 'Company')}} \\hfill ${escapeLatex(exp.location || '')} \\\\
\\textit{${escapeLatex(exp.role || 'Role')}} \\hfill ${escapeLatex(exp.duration || '')}
\\begin{itemize}[leftmargin=0.2in, noitemsep]
${(exp.points || ['Delivered key business initiatives.']).map(pt => `  \\item ${escapeLatex(pt)}`).join('\n')}
\\end{itemize}
\\vspace{4pt}`).join('\n')}

\\section{Education}
${educations.map(edu => `\\textbf{${escapeLatex(edu.institution || 'University')}} \\hfill ${escapeLatex(edu.location || '')} \\\\
${escapeLatex(edu.degree || 'Degree')} \\hfill ${escapeLatex(edu.duration || '')}`).join('\n')}

\\section{Core Competencies}
\\textbf{Specialties:} ${skillsStr}

\\end{document}
`
  }

  // 5. DEEDY CV TWO-COLUMN
  if (presetKey === 'deedy') {
    return `\\documentclass[letterpaper]{article}
\\usepackage[top=0.4in, bottom=0.4in, left=0.5in, right=0.5in]{geometry}
\\usepackage{hyperref}
\\usepackage{titlesec}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries\\uppercase}{}{0em}{}[\\titlerule]

\\begin{document}

\\begin{center}
    {\\huge \\textbf{${name}}} \\\\ \\vspace{2pt}
    \\small \\href{mailto:${email}}{${email}} | ${phone} | \\href{https://${linkedin}}{${linkedin}}${github ? ` | \\href{https://${github}}{${github}}` : ''}${portfolio ? ` | \\href{https://${portfolio}}{${portfolio}}` : ''}
\\end{center}

\\section{Education}
${educations.map(edu => `\\textbf{${escapeLatex(edu.institution || 'University')}} \\hfill ${escapeLatex(edu.location || '')} \\\\
${escapeLatex(edu.degree || 'Degree')} \\hfill ${escapeLatex(edu.duration || '')}`).join('\n')}

\\section{Experience}
${experiences.map(exp => `\\textbf{${escapeLatex(exp.company || 'Company')}} \\hfill ${escapeLatex(exp.location || '')} \\\\
\\textit{${escapeLatex(exp.role || 'Role')}} \\hfill ${escapeLatex(exp.duration || '')}
\\begin{itemize}[leftmargin=0.2in, noitemsep, topsep=2pt]
${(exp.points || ['Achieved core milestones.']).map(pt => `  \\item ${escapeLatex(pt)}`).join('\n')}
\\end{itemize}`).join('\n\\vspace{4pt}\n')}

\\section{Skills}
\\textbf{Core Stack:} ${skillsStr}

\\end{document}
`
  }

  // 6. DEFAULT ACADEMIC / RESEARCH CV
  return `\\documentclass[letterpaper,11pt]{article}
\\usepackage[margin=0.7in]{geometry}
\\usepackage{titlesec}
\\usepackage{hyperref}
\\usepackage{enumitem}

\\titleformat{\\section}{\\large\\bfseries\\scshape}{}{0em}{}[\\titlerule]

\\begin{document}

\\begin{center}
  {\\huge \\textbf{${name}}} \\\\ \\vspace{2pt}
  ${role} \\\\
  \\small \\href{mailto:${email}}{${email}} $|$ ${phone} $|$ ${location} $|$ \\href{https://${linkedin}}{${linkedin}}${github ? ` $|$ \\href{https://${github}}{${github}}` : ''}${portfolio ? ` $|$ \\href{https://${portfolio}}{${portfolio}}` : ''}
\\end{center}

${summary ? `\\section{Research \\& Professional Summary}
${summary}
` : ''}
\\section{Education}
${educations.map(edu => `\\textbf{${escapeLatex(edu.institution || 'University')}} \\hfill ${escapeLatex(edu.location || '')} \\\\
${escapeLatex(edu.degree || 'Degree')} \\hfill ${escapeLatex(edu.duration || '')}`).join('\n')}

\\section{Appointments \\& Experience}
${experiences.map(exp => `\\textbf{${escapeLatex(exp.company || 'Institution')}} \\hfill ${escapeLatex(exp.location || '')} \\\\
\\textit{${escapeLatex(exp.role || 'Title')}} \\hfill ${escapeLatex(exp.duration || '')}
\\begin{itemize}[leftmargin=0.2in, noitemsep]
${(exp.points || ['Conducted research and led initiatives.']).map(pt => `  \\item ${escapeLatex(pt)}`).join('\n')}
\\end{itemize}
\\vspace{4pt}`).join('\n')}

\\section{Skills \\& Methodologies}
${skillsStr}

\\end{document}
`
}

const PDFDocument = require('pdfkit')

// ─── Metadata tables ──────────────────────────────────────────────────────────
// Field keys mirror the frontend ResumeBuilder (ALL_SECTIONS) so the exact same
// structured resume can be rendered without a LaTeX/pdflatex toolchain.

const SECTION_TITLES = {
  personal: 'Personal Information',
  summary: 'Professional Summary',
  experience: 'Experience',
  education: 'Education',
  skills: 'Skills',
  projects: 'Projects',
  certifications: 'Certifications',
  internships: 'Internships',
  awards: 'Awards',
  publications: 'Publications',
  research: 'Research',
  languages: 'Languages',
  interests: 'Interests',
  training: 'Training',
  achievements: 'Achievements',
  conferences: 'Conferences',
  workshops: 'Workshops',
  volunteer: 'Volunteering',
  leadership: 'Leadership',
  extracurricular: 'Extracurricular',
  memberships: 'Memberships',
  licenses: 'Licenses',
  patents: 'Patents',
  references: 'References',
  social: 'Social Links',
  strengths: 'Strengths',
  softSkills: 'Soft Skills',
  techCompetencies: 'Technical Competencies',
  careerHighlights: 'Career Highlights',
  careerTimeline: 'Career Timeline',
  portfolio: 'Portfolio',
  openSource: 'Open Source',
  competitiveProgramming: 'Competitive Programming',
  hackathons: 'Hackathons',
  scholarships: 'Scholarships',
  military: 'Military Service',
  availability: 'Availability',
  salary: 'Salary Preference',
  declaration: 'Declaration',
  custom: 'Additional Information',
}

const FIELD_LABELS = {
  name: 'Name', professionalTitle: 'Title', email: 'Email', phone: 'Phone',
  location: 'Location', linkedin: 'LinkedIn', github: 'GitHub', portfolio: 'Portfolio',
  website: 'Website', company: 'Company', role: 'Role', employmentType: 'Type',
  expLocation: 'Location', startDate: 'Start', endDate: 'End',
  description: 'Description', technologiesUsed: 'Technologies', certLink: 'Link',
  degree: 'Degree', course: 'Course', specialization: 'Specialization',
  institution: 'Institution', board: 'Board', gpa: 'GPA', startYear: 'Start',
  endYear: 'End', eduLocation: 'Location', technical: 'Technical',
  frameworks: 'Frameworks', soft: 'Soft Skills', summary: 'Summary',
  yearsOfExperience: 'Experience', keySkills: 'Key Skills', careerGoals: 'Goals',
  projectName: 'Project', projectType: 'Type', projectDescription: 'Description',
  projectTechnologies: 'Technologies', projectRole: 'Role',
  projectDuration: 'Duration', projectLink: 'Live Demo', projectGithubLink: 'GitHub',
  projectKeyFeatures: 'Features', certName: 'Certificate', certIssuer: 'Issuer',
  certDate: 'Issued', certExpiry: 'Expires',
}

const PRETTY_KEY_OVERRIDES = {
  currentCtc: 'Current CTC', expectedCtc: 'Expected CTC',
  projectGithubLink: 'GitHub', projectLink: 'Live Demo',
}

// Section types rendered primarily as bullet lists.
const BULLET_SECTIONS = new Set([
  'skills', 'languages', 'interests', 'strengths', 'softSkills',
  'techCompetencies', 'awards', 'certifications', 'achievements',
  'memberships', 'publications', 'hackathons', 'scholarships',
  'training', 'references',
])

// Keys rendered as "Label: value" rather than bullets.
const LABELLED_KEYS = new Set([
  'email', 'phone', 'location', 'linkedin', 'github', 'portfolio', 'website',
  'gpa', 'board', 'specialization', 'course', 'startYear', 'endYear',
  'noticePeriod', 'preferredLocation', 'workAuthorization', 'currentCtc',
  'expectedCtc', 'currency', 'declarationPlace', 'declarationDate',
])

// Long-form keys rendered as their own bullet lines.
const BODY_KEYS = new Set([
  'description', 'projectDescription', 'projectKeyFeatures',
  'achievementDescription', 'scholarshipDescription', 'portfolioDescription',
])

const PAPER_SIZES = { letterpaper: 'LETTER', a4paper: 'A4', legalpaper: 'LEGAL' }
const FONT_SIZES = { '10pt': 10, '11pt': 11, '12pt': 12 }

function prettifyKey(key) {
  if (PRETTY_KEY_OVERRIDES[key]) return PRETTY_KEY_OVERRIDES[key]
  if (FIELD_LABELS[key]) return FIELD_LABELS[key]
  return String(key)
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .replace(/^./, c => c.toUpperCase())
}

/** Coerce any stored value into trimmed display text ('' when empty). */
function asText(value) {
  if (value === null || value === undefined || value === false) return ''
  if (value === true) return 'Yes'
  if (Array.isArray(value)) return value.filter(Boolean).join(', ')
  return String(value).trim()
}

/** Split a textarea value into clean bullet lines. */
function toLines(value) {
  return asText(value)
    .split('\n')
    .map(l => l.replace(/^[\s\-*•·–—]+\s*/, '').trim())
    .filter(Boolean)
}

function hexToColor(hex) {
  const clean = String(hex || '').replace('#', '').trim()
  if (!/^[0-9a-fA-F]{6}$/.test(clean)) return '#0E5484'
  return `#${clean}`
}
/**
 * Render a structured resume into a PDF Buffer using pdfkit.
 * Pure JavaScript — no LaTeX/pdflatex toolchain required, so it always works.
 */
function renderResumePdf({ sections = [], visibleSections, sectionOrder, settings = {}, title } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const primary = hexToColor(settings.primaryColor || '0E5484')
      const pageSize = PAPER_SIZES[String(settings.paperSize || '').toLowerCase()] || 'LETTER'
      const baseSize = FONT_SIZES[String(settings.fontSize || '')] || 11
      const sans = String(settings.fontFamily || 'default').toLowerCase() !== 'default'

      const doc = new PDFDocument({
        size: pageSize,
        margins: { top: 48, bottom: 48, left: 54, right: 54 },
        bufferPages: true,
      })

      const chunks = []
      doc.on('data', c => chunks.push(c))
      doc.on('end', () => resolve(Buffer.concat(chunks)))
      doc.on('error', reject)

      // pdfkit's built-in standard fonts: Times family uses no suffix for regular
      // and explicit 'Bold'/'Italic'/'BoldItalic' for the variants.
      const startFont = sans ? 'Helvetica' : 'Times-Roman'
      const boldFont = sans ? 'Helvetica-Bold' : 'Times-Bold'
      const italicFont = sans ? 'Helvetica-Oblique' : 'Times-Italic'

      const M = doc.page.margins
      const contentWidth = doc.page.width - M.left - M.right

      /** Ensure vertical room remains before drawing `needed` points. */
      function ensureSpace(needed) {
        if (doc.y + needed > doc.page.height - M.bottom) doc.addPage()
      }

      /** Draw an uppercase section heading with a coloured rule beneath it. */
      function sectionHeading(text) {
        if (!text) return
        ensureSpace(34)
        doc.moveDown(0.7)
        doc.font(boldFont).fontSize(baseSize + 1.5).fillColor(primary)
          .text(String(text).toUpperCase(), { width: contentWidth })
        doc.moveDown(0.15)
        const y = doc.y
        doc.moveTo(M.left, y).lineTo(M.left + contentWidth, y)
          .lineWidth(1).strokeColor(primary).stroke()
        doc.moveDown(0.45)
        doc.fillColor('#222222')
      }

      const templateId = String(settings.templateId || 'classic-professional').toLowerCase()

      /** Draw one bullet line inside the margins. */
      function bullet(text) {
        if (!text) return
        ensureSpace(baseSize + 6)
        doc.font(startFont).fontSize(baseSize).fillColor('#222222')
        if (templateId === 'tech-emerald') {
          doc.rect(M.left + 2, doc.y + baseSize * 0.38, 3, 3).fillColor(primary).fill()
        } else {
          doc.circle(M.left + 3, doc.y + baseSize * 0.42, 1.6).fillColor(primary).fill()
        }
        doc.fillColor('#222222').text(text, M.left + 10, doc.y, { width: contentWidth - 10 })
      }

      // ── Template Specific Header Accents ──
      const personal = sections.find(s => s.type === 'personal') || {}
      const name = asText(personal.name)
      const role = asText(personal.professionalTitle)

      if (templateId === 'corporate-amber') {
        doc.rect(0, 0, doc.page.width, 76).fill(primary)
        doc.font(boldFont).fontSize(baseSize + 8).fillColor('#ffffff')
          .text(name || 'Resume', M.left, 18, { align: 'center', width: contentWidth })
        if (role) {
          doc.font(startFont).fontSize(baseSize + 1).fillColor('#fef3c7')
            .text(role, M.left, doc.y + 2, { align: 'center', width: contentWidth })
        }
        doc.y = 86
      } else if (templateId === 'professional-sales') {
        doc.rect(0, 0, 14, doc.page.height).fill(primary)
        doc.font(boldFont).fontSize(baseSize + 8).fillColor(primary)
          .text(name || 'Resume', { align: 'center', width: contentWidth })
        if (role) {
          doc.font(startFont).fontSize(baseSize + 1).fillColor('#444444')
            .text(role, { align: 'center', width: contentWidth })
        }
      } else if (templateId === 'modern-server') {
        doc.rect(M.left, 36, contentWidth, 3).fill(primary)
        doc.y = 48
        doc.font(boldFont).fontSize(baseSize + 8).fillColor(primary)
          .text(name ? name.toUpperCase() : 'RESUME', { align: 'center', width: contentWidth })
        if (role) {
          doc.font(startFont).fontSize(baseSize + 1).fillColor('#444444')
            .text(role.toUpperCase(), { align: 'center', width: contentWidth })
        }
      } else {
        doc.font(boldFont).fontSize(baseSize + 8).fillColor(primary)
          .text(name || 'Resume', { align: 'center', width: contentWidth })
        if (role) {
          doc.font(startFont).fontSize(baseSize + 1).fillColor('#444444')
            .text(role, { align: 'center', width: contentWidth })
        }
      }

      const contacts = ['email', 'phone', 'location', 'linkedin', 'github', 'website', 'portfolio']
        .map(k => asText(personal[k]))
        .filter(Boolean)
      if (contacts.length) {
        doc.moveDown(0.2)
        doc.font(startFont).fontSize(baseSize - 1).fillColor('#444444')
          .text(contacts.join('  |  '), { align: 'center', width: contentWidth })
      }

      // ── Resolve which sections to render, and in what order ──
      const active = Array.isArray(visibleSections) && visibleSections.length
        ? visibleSections
        : [...new Set(sections.map(s => s.type))]
      const wanted = new Set(active)
      const ordered = (Array.isArray(sectionOrder) && sectionOrder.length)
        ? sectionOrder.filter(t => wanted.has(t))
        : active
      // Append any active type sectionOrder forgot, without duplicates.
      const finalOrder = [...ordered, ...active.filter(t => !ordered.includes(t))]

      // ── Body ──
      for (const type of finalOrder) {
        const matching = sections.filter(s => s.type === type)
        if (!matching.length) continue
        if (type === 'personal') continue // already rendered in the header

        if (type === 'declaration') {
          const text = matching.map(s => asText(s.declarationText)).filter(Boolean).join('\n')
          if (!text) continue
          ensureSpace(40)
          doc.moveDown(0.6)
          doc.font(boldFont).fontSize(baseSize).fillColor(primary)
            .text('DECLARATION', { width: contentWidth })
          doc.moveDown(0.2)
          doc.font(italicFont).fontSize(baseSize).fillColor('#333333')
            .text(text, { width: contentWidth })
          continue
        }

        const sectionHeadingText = matching[0]?.customSectionHeading || (matching[0]?.type === 'custom' && matching[0]?.customSectionTitle) || (typeof SECTION_TITLES !== 'undefined' && SECTION_TITLES[type]) || prettifyKey(type)
        sectionHeading(sectionHeadingText)

        for (const sec of matching) {
          const labelled = []
          const bullets = []

          for (const [key, raw] of Object.entries(sec)) {
            if (key === 'id' || key === 'type') continue
            const value = asText(raw)
            if (!value) continue

            if (BODY_KEYS.has(key)) {
              toLines(value).forEach(l => bullets.push(l))
            } else if (BULLET_SECTIONS.has(type) && !LABELLED_KEYS.has(key)) {
              toLines(value).forEach(l => bullets.push(l))
            } else {
              labelled.push([prettifyKey(key), value])
            }
          }

          if (labelled.length) {
            const [headKey, headVal] = labelled[0]
            const titleish = /name|company|role|degree|institution|event|title|course|position|cert|project/i
              .test(headKey)
            ensureSpace(baseSize * 3)
            doc.font(boldFont).fontSize(baseSize).fillColor('#111111')
              .text(titleish ? headVal : `${headKey}: ${headVal}`, { width: contentWidth })

            const rest = labelled.slice(1).map(([k, v]) => `${k}: ${v}`).filter(Boolean)
            if (rest.length) {
              doc.font(italicFont).fontSize(baseSize - 0.5).fillColor('#555555')
                .text(rest.join('  |  '), { width: contentWidth })
            }
            doc.moveDown(0.15)
          }

          bullets.forEach(bullet)
          if (bullets.length) doc.moveDown(0.25)
        }
      }

      // ── Page numbers ──
      const range = doc.bufferedPageRange()
      for (let i = 0; i < range.count; i++) {
        doc.switchToPage(range.start + i)
        doc.font(startFont).fontSize(8).fillColor('#888888')
          .text(`${i + 1} / ${range.count}`, M.left, doc.page.height - M.bottom + 16, {
            width: contentWidth, align: 'center', lineBreak: false,
          })
      }

      if (title) doc.info.Title = String(title)
      doc.info.Creator = 'Bridge Resume Builder'

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}

const zlib = require('zlib');

// ─── Minimal ZIP writer ───────────────────────────────────────────────────────
// A .docx is just a ZIP archive of XML parts. Writing the archive by hand
// avoids adding a dependency (no archiver/jszip in the project).

const CRC_TABLE = (() => {
  const table = new Int32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  return table
})()

function crc32(buf) {
  let c = 0 ^ -1
  for (let i = 0; i < buf.length; i++) c = (c >>> 8) ^ CRC_TABLE[(c ^ buf[i]) & 0xff]
  return (c ^ -1) >>> 0
}

/**
 * Build a ZIP archive from [{ name, data }] using deflate.
 * Returns a Buffer.
 */
function buildZip(entries) {
  const chunks = []
  const central = []
  let offset = 0

  for (const entry of entries) {
    const nameBuf = Buffer.from(entry.name, 'utf8')
    const raw = Buffer.isBuffer(entry.data) ? entry.data : Buffer.from(entry.data, 'utf8')
    const compressed = zlib.deflateRawSync(raw)
    const crc = crc32(raw)

    const local = Buffer.alloc(30)
    local.writeUInt32LE(0x04034b50, 0)   // local file header signature
    local.writeUInt16LE(20, 4)           // version needed
    local.writeUInt16LE(0, 6)            // flags
    local.writeUInt16LE(8, 8)            // method: deflate
    local.writeUInt16LE(0, 10)           // mod time
    local.writeUInt16LE(0x21, 12)        // mod date (fixed, keeps output deterministic)
    local.writeUInt32LE(crc, 14)
    local.writeUInt32LE(compressed.length, 18)
    local.writeUInt32LE(raw.length, 22)
    local.writeUInt16LE(nameBuf.length, 26)
    local.writeUInt16LE(0, 28)           // extra field length

    chunks.push(local, nameBuf, compressed)

    const centralHeader = Buffer.alloc(46)
    centralHeader.writeUInt32LE(0x02014b50, 0) // central directory signature
    centralHeader.writeUInt16LE(20, 4)        // version made by
    centralHeader.writeUInt16LE(20, 6)        // version needed
    centralHeader.writeUInt16LE(0, 8)
    centralHeader.writeUInt16LE(8, 10)        // method: deflate
    centralHeader.writeUInt16LE(0, 12)
    centralHeader.writeUInt16LE(0x21, 14)
    centralHeader.writeUInt32LE(crc, 16)
    centralHeader.writeUInt32LE(compressed.length, 20)
    centralHeader.writeUInt32LE(raw.length, 24)
    centralHeader.writeUInt16LE(nameBuf.length, 28)
    centralHeader.writeUInt16LE(0, 30)        // extra
    centralHeader.writeUInt16LE(0, 32)        // comment
    centralHeader.writeUInt16LE(0, 34)        // disk number
    centralHeader.writeUInt16LE(0, 36)        // internal attrs
    centralHeader.writeUInt32LE(0, 38)        // external attrs
    centralHeader.writeUInt32LE(offset, 42)   // relative offset

    central.push(centralHeader, nameBuf)
    offset += local.length + nameBuf.length + compressed.length
  }

  const centralBuf = Buffer.concat(central)
  const end = Buffer.alloc(22)
  end.writeUInt32LE(0x06054b50, 0)            // EOCD signature
  end.writeUInt16LE(0, 4)
  end.writeUInt16LE(0, 6)
  end.writeUInt16LE(entries.length, 8)
  end.writeUInt16LE(entries.length, 10)
  end.writeUInt32LE(centralBuf.length, 12)
  end.writeUInt32LE(offset, 16)
  end.writeUInt16LE(0, 20)

  return Buffer.concat([...chunks, centralBuf, end])
}

/** Escape text for inclusion in XML. */
function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    // Strip control characters that are illegal in XML 1.0
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '')
}

/** Word requires this exact hex form (no leading '#', 6 uppercase digits). */
function hexColor(hex) {
  const clean = String(hex || '').replace('#', '').trim()
  return /^[0-9a-fA-F]{6}$/.test(clean) ? clean.toUpperCase() : '0E5484'
}

// ─── DOCX generation ──────────────────────────────────────────────────────────

/** Convert a font size like '11pt' to Word half-points (22 for 11pt). */
function ptToHalfPoints(fontSize) {
  const n = parseFloat(String(fontSize || '')) || 11
  return Math.round(n * 2)
}

function docxParagraph({ text, bold, italic, size, color, align, spacingAfter, border }) {
  const pPr = []
  if (align) pPr.push(`<w:jc w:val="${align}"/>`)
  pPr.push(`<w:spacing${spacingAfter != null ? ` w:after="${spacingAfter}"` : ''}/>`)
  if (border) {
    pPr.push(`<w:pBdr><w:bottom w:val="single" w:sz="8" w:space="2" w:color="${border}"/></w:pBdr>`)
  }

  const rPr = []
  if (bold) rPr.push('<w:b/>')
  if (italic) rPr.push('<w:i/>')
  if (color) rPr.push(`<w:color w:val="${color}"/>`)
  if (size) rPr.push(`<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`)

  return `<w:p><w:pPr>${pPr.join('')}</w:pPr>` +
    `<w:r><w:rPr>${rPr.join('')}</w:rPr>` +
    `<w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`
}

function docxBullet(text, size) {
  const rPr = `<w:sz w:val="${size}"/><w:szCs w:val="${size}"/>`
  return '<w:p><w:pPr><w:numPr><w:ilvl w:val="0"/><w:numId w:val="1"/></w:numPr>' +
    '<w:spacing w:after="20"/></w:pPr>' +
    `<w:r><w:rPr>${rPr}</w:rPr><w:t xml:space="preserve">${xmlEscape(text)}</w:t></w:r></w:p>`
}

/**
 * Split one section object into labelled fields and bullet lines.
 * Shared by the PDF and DOCX renderers so both stay in sync.
 */
function splitSection(sec, type) {
  const labelled = []
  const bullets = []
  for (const [key, raw] of Object.entries(sec)) {
    if (key === 'id' || key === 'type') continue
    const value = asText(raw)
    if (!value) continue
    if (BODY_KEYS.has(key)) {
      toLines(value).forEach(l => bullets.push(l))
    } else if (BULLET_SECTIONS.has(type) && !LABELLED_KEYS.has(key)) {
      toLines(value).forEach(l => bullets.push(l))
    } else {
      labelled.push([prettifyKey(key), value])
    }
  }
  return { labelled, bullets }
}

/** The first labelled value usually reads as the entry title. */
function isTitleish(key) {
  return /name|company|role|degree|institution|event|title|course|position|cert|project/i.test(key)
}

/** Resolve the ordered list of section types to render. */
function resolveOrder(sections, visibleSections, sectionOrder) {
  const active = Array.isArray(visibleSections) && visibleSections.length
    ? visibleSections
    : [...new Set(sections.map(s => s.type))]
  const wanted = new Set(active)
  const ordered = (Array.isArray(sectionOrder) && sectionOrder.length)
    ? sectionOrder.filter(t => wanted.has(t))
    : active
  return [...ordered, ...active.filter(t => !ordered.includes(t))]
}

/**
 * Render the structured resume into a .docx Buffer (Office Open XML).
 * No external library required — the ZIP container is built by buildZip().
 */
function renderResumeDocx({ sections = [], visibleSections, sectionOrder, settings = {} } = {}) {
  const color = hexColor(settings.primaryColor || '0E5484')
  const size = ptToHalfPoints(settings.fontSize)
  const body = []

  // ── Header ──
  const personal = sections.find(s => s.type === 'personal') || {}
  body.push(docxParagraph({
    text: asText(personal.name) || 'Resume', bold: true, size: size + 8, color, align: 'center',
  }))
  const role = asText(personal.professionalTitle)
  if (role) body.push(docxParagraph({ text: role, size: size + 2, color: '444444', align: 'center' }))

  const contacts = ['email', 'phone', 'location', 'linkedin', 'github', 'website', 'portfolio']
    .map(k => asText(personal[k]))
    .filter(Boolean)
  if (contacts.length) {
    body.push(docxParagraph({
      text: contacts.join('  |  '), size: size - 2, color: '444444', align: 'center',
    }))
  }

  // ── Body ──
  for (const type of resolveOrder(sections, visibleSections, sectionOrder)) {
    const matching = sections.filter(s => s.type === type)
    if (!matching.length) continue
    if (type === 'personal') continue

    if (type === 'declaration') {
      const text = matching.map(s => asText(s.declarationText)).filter(Boolean).join(' ')
      if (!text) continue
      body.push(docxParagraph({ text: 'DECLARATION', bold: true, size: size + 3, color, border: color }))
      body.push(docxParagraph({ text, italic: true, size, color: '333333' }))
      continue
    }

    const sectionHeadingText = matching[0]?.customSectionHeading || (matching[0]?.type === 'custom' && matching[0]?.customSectionTitle) || (typeof SECTION_TITLES !== 'undefined' && SECTION_TITLES[type]) || prettifyKey(type)
    body.push(docxParagraph({
      text: String(sectionHeadingText).toUpperCase(),
      bold: true, size: size + 3, color, border: color, spacingAfter: 60,
    }))

    for (const sec of matching) {
      const { labelled, bullets } = splitSection(sec, type)

      if (labelled.length) {
        const [headKey, headVal] = labelled[0]
        body.push(docxParagraph({
          text: isTitleish(headKey) ? headVal : `${headKey}: ${headVal}`,
          bold: true, size, color: '111111', spacingAfter: 0,
        }))
        const rest = labelled.slice(1).map(([k, v]) => `${k}: ${v}`).filter(Boolean)
        if (rest.length) {
          body.push(docxParagraph({
            text: rest.join('  |  '), italic: true, size: size - 1, color: '555555',
          }))
        }
      }

      bullets.forEach(b => body.push(docxBullet(b, size)))
    }
  }

  const documentXml = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    `<w:body>${body.join('')}` +
    '<w:sectPr><w:pgSz w:w="11906" w:h="16838"/>' +
    '<w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="708" w:footer="708"/>' +
    '</w:sectPr></w:body></w:document>'

  const contentTypes = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">' +
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>' +
    '<Default Extension="xml" ContentType="application/xml"/>' +
    '<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>' +
    '<Override PartName="/word/numbering.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.numbering+xml"/>' +
    '</Types>'

  const rootRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>' +
    '</Relationships>'

  const docRels = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' +
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/numbering" Target="numbering.xml"/>' +
    '</Relationships>'

  // Minimal numbering definition so bullets render in Word.
  const numbering = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
    '<w:numbering xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">' +
    '<w:abstractNum w:abstractNumId="0">' +
    '<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="bullet"/><w:lvlText w:val="&#8226;"/>' +
    '<w:lvlJc w:val="left"/><w:pPr><w:ind w:left="720" w:hanging="360"/></w:pPr>' +
    '<w:rPr><w:rFonts w:ascii="Symbol" w:hAnsi="Symbol" w:hint="default"/></w:rPr></w:lvl>' +
    '</w:abstractNum>' +
    '<w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>' +
    '</w:numbering>'

  return buildZip([
    { name: '[Content_Types].xml', data: contentTypes },
    { name: '_rels/.rels', data: rootRels },
    { name: 'word/_rels/document.xml.rels', data: docRels },
    { name: 'word/document.xml', data: documentXml },
    { name: 'word/numbering.xml', data: numbering },
  ])
}

module.exports = {
  renderResumePdf,
  renderResumeDocx,
  buildZip,
  xmlEscape,
  hexColor,
  SECTION_TITLES,
  FIELD_LABELS,
  PRETTY_KEY_OVERRIDES,
  BULLET_SECTIONS,
  LABELLED_KEYS,
  BODY_KEYS,
  prettifyKey,
  asText,
  toLines,
  splitSection,
  isTitleish,
  resolveOrder,
}
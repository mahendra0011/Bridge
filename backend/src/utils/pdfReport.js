const PDFDocument = require('pdfkit')
const axios = require('axios')

/**
 * Helper to fetch external image buffer via Axios for embedding in PDF reports
 */
async function fetchImageBuffer(imageUrl) {
  try {
    const res = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
      timeout: 5000
    })
    return Buffer.from(res.data)
  } catch {
    return null
  }
}

/**
 * Generate a PDF report for company analytics.
 * Resolves with a Buffer.
 */
function companyReport(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const { companyName, metrics, postings } = data
    const title = `${companyName} — Analytics Report`
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

    // Header
    doc.fontSize(20).font('Helvetica-Bold').text(title, { align: 'center' })
    doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Generated on ${date}`, { align: 'center' })
    doc.moveDown(1.5)

    // Separator
    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#ddd').stroke()
    doc.moveDown(1)

    // Metrics
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('Overview', { underline: true })
    doc.moveDown(0.5)

    const metricRows = [
      ['Total Views', String(metrics.totalViews ?? 0)],
      ['Total Applicants', String(metrics.totalApplicants ?? 0)],
      ['Conversion Rate', `${metrics.conversionRate ?? 0}%`],
      ['Avg Time-to-Hire', `${metrics.avgTimeToHire ?? 0}d`],
    ]

    metricRows.forEach(([label, value]) => {
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#333').text(label, { continued: true })
      doc.font('Helvetica').fillColor('#555').text(`  ${value}`, { align: 'right' })
    })

    doc.moveDown(1.5)

    // Postings table
    doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('Per-Posting Breakdown', { underline: true })
    doc.moveDown(0.5)

    if (postings.length === 0) {
      doc.fontSize(11).font('Helvetica').fillColor('#999').text('No postings yet.')
    } else {
      // Table header
      const tableTop = doc.y
      const cols = [
        { x: 40, w: 180, label: 'Title' },
        { x: 220, w: 50, label: 'Type' },
        { x: 270, w: 60, label: 'Views' },
        { x: 330, w: 60, label: 'Applicants' },
        { x: 390, w: 60, label: 'Shortlisted' },
        { x: 450, w: 50, label: 'Hired' },
        { x: 500, w: 50, label: 'Conv%' },
      ]

      doc.fontSize(9).font('Helvetica-Bold').fillColor('#333')
      cols.forEach(({ x, w, label }) => doc.text(label, x, tableTop, { width: w }))

      // Table rows
      doc.moveDown(0.5)
      const headerY = doc.y
      doc.moveTo(40, headerY - 2).lineTo(550, headerY - 2).strokeColor('#ddd').stroke()
      doc.moveDown(0.3)

      postings.forEach((p) => {
        const rowY = doc.y
        doc.fontSize(8.5).font('Helvetica').fillColor('#444')
        doc.text(p.title?.slice(0, 25) || '-', 40, rowY, { width: 180 })
        doc.text(p.kind || '-', 220, rowY, { width: 50 })
        doc.text(String(p.views ?? 0), 270, rowY, { width: 60 })
        doc.text(String(p.applicants ?? 0), 330, rowY, { width: 60 })
        doc.text(String(p.shortlisted ?? 0), 390, rowY, { width: 60 })
        doc.text(String(p.hired ?? 0), 450, rowY, { width: 50 })
        doc.text(`${p.conversion ?? 0}%`, 500, rowY, { width: 50 })

        doc.moveDown(0.8)
        if (doc.y > 750) doc.addPage()
      })
    }

    doc.end()
  })
}

/**
 * Generate a PDF report for admin platform analytics.
 */
function adminReport(data) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    const chunks = []
    doc.on('data', (c) => chunks.push(c))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)

    const { kind, signupsPerDay, applicationsPerDay, topCompanies, popularSkills } = data
    const reportKind = kind === 'all' ? 'Platform' : `Platform — ${kind}`
    const date = new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })

    doc.fontSize(20).font('Helvetica-Bold').text(`${reportKind} Analytics Report`, { align: 'center' })
    doc.fontSize(10).font('Helvetica').fillColor('#666').text(`Generated on ${date}`, { align: 'center' })
    doc.moveDown(1.5)

    doc.moveTo(40, doc.y).lineTo(550, doc.y).strokeColor('#ddd').stroke()
    doc.moveDown(1)

    // Signups
    if (signupsPerDay?.length) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('Signups Per Day (Last 30 Days)', { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(9).font('Helvetica').fillColor('#555')
      const tableTop = doc.y
      doc.font('Helvetica-Bold').text('Date', 40, tableTop, { width: 100 })
      doc.text('Count', 200, tableTop, { width: 60 })
      doc.moveDown(0.5)
      doc.moveTo(40, doc.y).lineTo(300, doc.y).strokeColor('#eee').stroke()
      doc.moveDown(0.3)
      doc.font('Helvetica').fillColor('#444')
      signupsPerDay.forEach((d) => {
        doc.text(d.date || '-', 40, doc.y, { width: 100 })
        doc.text(String(d.count ?? 0), 200, doc.y, { width: 60 })
        doc.moveDown(0.5)
        if (doc.y > 750) doc.addPage()
      })
      doc.moveDown(1)
    }

    // Applications
    if (applicationsPerDay?.length) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('Applications Per Day (Last 30 Days)', { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(9).font('Helvetica').fillColor('#555')
      const appTop = doc.y
      doc.font('Helvetica-Bold').text('Date', 40, appTop, { width: 100 })
      doc.text('Count', 200, appTop, { width: 60 })
      doc.moveDown(0.5)
      doc.moveTo(40, doc.y).lineTo(300, doc.y).strokeColor('#eee').stroke()
      doc.moveDown(0.3)
      doc.font('Helvetica').fillColor('#444')
      applicationsPerDay.forEach((d) => {
        doc.text(d.date || '-', 40, doc.y, { width: 100 })
        doc.text(String(d.count ?? 0), 200, doc.y, { width: 60 })
        doc.moveDown(0.5)
        if (doc.y > 750) doc.addPage()
      })
      doc.moveDown(1)
    }

    // Top Companies
    if (topCompanies?.length) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('Top Companies by Applications', { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(9).font('Helvetica').fillColor('#444')
      topCompanies.forEach((c) => {
        doc.text(`${c.name || 'Unknown'}: ${c.applications ?? 0} applications`)
        doc.moveDown(0.3)
        if (doc.y > 780) doc.addPage()
      })
      doc.moveDown(1)
    }

    // Popular Skills
    if (popularSkills?.length) {
      doc.fontSize(14).font('Helvetica-Bold').fillColor('#333').text('Most Sought-After Skills', { underline: true })
      doc.moveDown(0.5)
      doc.fontSize(9).font('Helvetica').fillColor('#444')
      popularSkills.forEach((s) => {
        doc.text(`${s.skill || 'Unknown'}: ${s.count ?? 0} postings`)
        doc.moveDown(0.3)
        if (doc.y > 780) doc.addPage()
      })
    }

    doc.end()
  })
}

module.exports = { companyReport, adminReport, fetchImageBuffer }

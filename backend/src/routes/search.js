const router = require('express').Router()
const Internship = require('../models/Internship')
const Job = require('../models/Job')
const Company = require('../models/Company')

// GET /api/search?q=react&limit=5
router.get('/', async (req, res) => {
  try {
    const { q = '', limit = 5 } = req.query
    const lim = Math.min(Number(limit) || 5, 15)

    if (!q.trim()) return res.json({ results: [] })

    const { escapeRegex } = require('../utils/sanitize')
    const regex = { $regex: escapeRegex(q), $options: 'i' }
    const status = { status: 'approved' }

    const [internships, jobs, companies] = await Promise.all([
      Internship.find({ ...status, $or: [{ title: regex }, { description: regex }, { category: regex }] })
        .populate('company', 'name logoUrl')
        .select('title location mode company')
        .limit(lim)
        .lean(),
      Job.find({ ...status, $or: [{ title: regex }, { description: regex }, { category: regex }] })
        .populate('company', 'name logoUrl')
        .select('title location mode company')
        .limit(lim)
        .lean(),
      Company.find({ $or: [{ name: regex }, { industry: regex }] })
        .select('name industry location logoUrl')
        .limit(lim)
        .lean(),
    ])

    const results = [
      ...internships.map(i => ({
        type: 'internship',
        id: i._id,
        title: i.title,
        sub: i.company?.name || '',
        meta: `${i.location || ''} · ${i.mode || ''}`,
        logoUrl: i.company?.logoUrl,
      })),
      ...jobs.map(j => ({
        type: 'job',
        id: j._id,
        title: j.title,
        sub: j.company?.name || '',
        meta: `${j.location || ''} · ${j.mode || ''}`,
        logoUrl: j.company?.logoUrl,
      })),
      ...companies.map(c => ({
        type: 'company',
        id: c._id,
        title: c.name,
        sub: c.industry || '',
        meta: c.location || '',
        logoUrl: c.logoUrl,
      })),
    ]

    res.json({ results })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

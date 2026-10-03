const router = require('express').Router()
const Internship = require('../models/Internship')
const Job = require('../models/Job')
const Company = require('../models/Company')
const { atlasSearch } = require('../utils/atlasSearch')
const { escapeRegex } = require('../utils/sanitize')

// GET /api/search/companies?industry=...&limit=4
router.get('/companies', async (req, res) => {
  try {
    const { industry, limit = 4 } = req.query
    const filter = {}
    if (industry) filter.industry = { $regex: escapeRegex(industry), $options: 'i' }
    const companies = await Company.find(filter)
      .select('name industry location logoUrl')
      .limit(Math.min(Number(limit) || 4, 20))
      .lean()
    res.json({ companies })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/search?q=react&limit=5
// Uses Atlas Search when ATLAS_SEARCH_ENABLED=true, falls back to $regex otherwise
router.get('/', async (req, res) => {
  try {
    const { q = '', limit = 5 } = req.query
    const lim = Math.min(Number(limit) || 5, 15)

    if (!q.trim()) return res.json({ results: [] })

    const [internshipIds, jobIds, companies] = await Promise.all([
      // Internships — Atlas Search on title + description + category
      atlasSearch(Internship, q, {
        paths: ['title', 'description', 'category'],
        matchFilter: { status: 'approved' },
        limit: lim,
      }),
      // Jobs — Atlas Search on title + description + category
      atlasSearch(Job, q, {
        paths: ['title', 'description', 'category'],
        matchFilter: { status: 'approved' },
        limit: lim,
      }),
      // Companies — Atlas Search on name + industry
      atlasSearch(Company, q, {
        paths: ['name', 'industry'],
        limit: lim,
      }),
    ])

    // Re-populate company for internships & jobs (aggregation skips populate)
    const [internships, jobs] = await Promise.all([
      Internship.find({ _id: { $in: internshipIds.map(d => d._id) } })
        .populate('company', 'name logoUrl')
        .select('title location mode company')
        .lean(),
      Job.find({ _id: { $in: jobIds.map(d => d._id) } })
        .populate('company', 'name logoUrl')
        .select('title location mode company')
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

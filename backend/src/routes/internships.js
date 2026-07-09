const router = require('express').Router()
const { body } = require('express-validator')
const { protect, restrictTo } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { sanitizeFields } = require('../utils/sanitize')
const { uploadResume, uploadApplyFiles, getFileUrl } = require('../middleware/upload')
const mongoose = require('mongoose')
const Internship = require('../models/Internship')
const Application = require('../models/Application')
const Company = require('../models/Company')
const Agency = require('../models/Agency')
const CompanyReview = require('../models/CompanyReview')
const User = require('../models/User')
const { sendEmail, newApplicantEmail } = require('../utils/email')

const postingValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('mode').isIn(['Remote', 'Hybrid', 'On-site']).withMessage('Invalid work mode'),
  body('stipend').optional().isNumeric().withMessage('Stipend must be a number'),
  body('vacancies').optional().isInt({ min: 1 }).withMessage('Vacancies must be a positive number'),
]

// GET /api/internships
router.get('/', async (req, res) => {
  try {
    const { query, location, mode, category, minStipend, maxStipend, skills, deadlineBefore, sort, page = 1, limit = 12, featured } = req.query
    const filter = { status: 'approved' }
    if (query) filter.$or = [
      { title: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } }
    ]
    if (location) filter.location = { $regex: location, $options: 'i' }
    if (mode) filter.mode = mode
    if (category) filter.category = category
    if (featured === 'true') filter.isFeatured = true
    if (minStipend || maxStipend) {
      filter.stipend = {}
      if (minStipend) filter.stipend.$gte = Number(minStipend)
      if (maxStipend) filter.stipend.$lte = Number(maxStipend)
    }
    if (skills) {
      const skillList = String(skills).split(',').map((s) => s.trim()).filter(Boolean)
      if (skillList.length) filter.skills = { $in: skillList.map((s) => new RegExp(`^${s}$`, 'i')) }
    }
    if (deadlineBefore) filter.deadline = { $lte: new Date(deadlineBefore) }

    const sortMap = {
      newest: '-createdAt',
      oldest: 'createdAt',
      deadline: 'deadline',
      stipendHigh: '-stipend',
      stipendLow: 'stipend',
    }
    const sortBy = sortMap[sort] || '-createdAt'

    const total = await Internship.countDocuments(filter)
    
    // Build query with all required fields for card display
    const internshipsQuery = Internship.find(filter)
      .select('title description location mode stipend duration startDate hasPPO skills deadline status isBoosted applicantsCount createdAt')
      .populate('company', 'name logoUrl location isVerified industry')
      .populate('agency', 'agencyName logoUrl city isVerified')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(Number(limit))
    
    const internships = await internshipsQuery

    // Add user-specific fields if authenticated
    if (req.user) {
      const internshipIds = internships.map(i => i._id)
      const [savedItems, applications] = await Promise.all([
        // Assuming SavedSearch model exists for saved items
        req.user.role === 'student' ? require('../models/SavedSearch').find({ 
          user: req.user._id, 
          itemId: { $in: internshipIds },
          itemType: 'internship'
        }).select('itemId') : [],
        Application.find({ 
          applicant: req.user._id, 
          posting: { $in: internshipIds },
          postingModel: 'Internship'
        }).select('posting')
      ])
      
      const savedIds = new Set(savedItems.map(s => String(s.itemId)))
      const appliedIds = new Set(applications.map(a => String(a.posting)))
      
      internships.forEach(i => {
        i.isSaved = savedIds.has(String(i._id))
        i.hasApplied = appliedIds.has(String(i._id))
      })
    }

    res.json({ internships, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/internships/:id
router.get('/:id', async (req, res) => {
  try {
    const internship = await Internship.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('company')
    if (!internship) return res.status(404).json({ message: 'Not found' })
    res.json({ internship })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/internships (company + agency)
const PERMISSIONS = {
  owner: ['post_jobs'], admin: ['post_jobs'], recruiter: ['post_jobs'],
}
const AGENCY_PERMISSIONS = { admin: ['post_jobs'], editor: ['post_jobs'], viewer: [] }

function canPost(company, userId) {
  if (String(company.user) === String(userId)) return true
  const member = company.teamMembers.find(m => String(m.user) === String(userId))
  return member && PERMISSIONS[member.role]?.includes('post_jobs')
}

function agencyCanPost(agency, userId) {
  if (String(agency.user) === String(userId)) return true
  const member = agency.teamMembers.find(m => String(m.user) === String(userId))
  return member && AGENCY_PERMISSIONS[member.role]?.includes('post_jobs')
}

router.post('/', protect, restrictTo('company', 'agency'), postingValidators, validate, async (req, res) => {
  try {
    sanitizeFields(req.body, ['title', 'description', 'location', 'category', 'skills'])

    if (req.user.role === 'agency') {
      const agency = await Agency.findOne({ user: req.user._id })
      if (!agency) return res.status(404).json({ message: 'Agency profile not found' })
      if (!agency.portfolioUrl) {
        return res.status(403).json({ message: 'Add your portfolio/work samples link before posting internships. This helps clients & candidates trust your work.' })
      }

      // Check team permissions
      if (!agencyCanPost(agency, req.user._id)) {
        return res.status(403).json({ message: 'Your role does not have permission to post internships' })
      }

      // Check monthly post limit for unregistered agencies
      const now = new Date()
      if (!agency.monthlyPostReset || agency.monthlyPostReset < now) {
        agency.monthlyPostCount = 0
        agency.monthlyPostReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
      if (!agency.isRegistered && agency.monthlyPostCount >= (agency.unregisteredLimit || 3)) {
        return res.status(403).json({ message: `You've reached the limit of ${agency.unregisteredLimit || 3} posts/month for unregistered agencies. Register your agency (Udyam/docs) to unlock unlimited posting.`, needsRegistration: true })
      }

      const internship = await Internship.create({ ...req.body, status: 'approved', agency: agency._id, postedBy: req.user._id })

      // Increment post count
      agency.monthlyPostCount += 1
      await agency.save()

      return res.status(201).json({ internship })
    }

    const company = await Company.findOne({ user: req.user._id })
    if (!company) return res.status(404).json({ message: 'Company profile not found' })
    if (!company.isProfileComplete) {
      return res.status(403).json({ message: 'Complete your company profile before posting internships. Redirecting to profile setup...', needsProfileSetup: true })
    }
    if (!canPost(company, req.user._id)) {
      return res.status(403).json({ message: 'Your role does not have permission to post internships' })
    }
    const internship = await Internship.create({ ...req.body, company: company._id, postedBy: req.user._id })
    res.status(201).json({ internship })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/internships/:id
router.put('/:id', protect, restrictTo('company'), async (req, res) => {
  try {
    sanitizeFields(req.body, ['title', 'description', 'location', 'category', 'skills'])
    const internship = await Internship.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user._id },
      req.body, { new: true }
    )
    if (!internship) return res.status(404).json({ message: 'Not found or not authorized' })
    res.json({ internship })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/internships/:id
router.delete('/:id', protect, restrictTo('company', 'agency', 'admin'), async (req, res) => {
  try {
    await Internship.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/internships/:id/apply
router.post('/:id/apply', protect, restrictTo('student'), (req, res) => {
  uploadApplyFiles(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })
    try {
      const internship = await Internship.findById(req.params.id)
      if (!internship) return res.status(404).json({ message: 'Not found' })

      const existing = await Application.findOne({ applicant: req.user._id, posting: internship._id })
      if (existing) return res.status(400).json({ message: 'Already applied' })

      sanitizeFields(req.body, ['coverLetter', 'portfolioUrl', 'linkedinUrl', 'screeningAnswers'])
      const files = req.files || {}
      const resumeFile = files.resume?.[0]
      const testTaskFile = files.testTask?.[0]
      const getUrl = (f, folder) => f ? (f.path || `/uploads/${folder}/${f.filename}`) : null
      const resumeUrl = resumeFile ? getUrl(resumeFile, 'resumes') : req.body.resumeUrl
      const testTaskUrl = testTaskFile ? getUrl(testTaskFile, 'resumes') : undefined
      let screeningAnswers
      try { screeningAnswers = req.body.screeningAnswers ? JSON.parse(req.body.screeningAnswers) : undefined } catch {}
      const app = await Application.create({
        applicant: req.user._id,
        postingType: 'internship',
        posting: internship._id,
        postingModel: 'Internship',
        resumeUrl,
        coverLetter: req.body.coverLetter,
        portfolioUrl: req.body.portfolioUrl,
        linkedinUrl: req.body.linkedinUrl,
        testTaskUrl,
        screeningAnswers,
      })

      await Internship.findByIdAndUpdate(internship._id, { $inc: { applicantsCount: 1 } })

      // Send socket notification
      const io = req.app.get('io')
      if (io) {
        await io.sendNotification(req.user._id, {
          title: 'Application submitted!',
          message: `Your application to ${internship.title} was sent.`,
          icon: '📋',
        })
      }

      res.status(201).json({ application: app })

      // Notify the company — fire-and-forget so a slow/failed email never
      // delays or breaks the student's apply response.
      Company.findById(internship.company)
        .then(async (company) => {
          const contactUser = await User.findById(internship.postedBy).select('name email')
          const to = company?.email || contactUser?.email
          if (!to) return
          const applicantsUrl = process.env.CLIENT_URL
            ? `${process.env.CLIENT_URL}/company/applicants/internship/${internship._id}`
            : undefined
          return sendEmail({
            to,
            ...newApplicantEmail(contactUser?.name || company?.name || 'there', req.user.name, internship.title, 'internship', applicantsUrl)
          })
        })
        .catch(() => { /* email is best-effort, never block or surface to the applicant */ })
    } catch (err) { res.status(500).json({ message: err.message }) }
  })
})

// ─── Public Company Reviews ────────────────────────────────────────────────

router.get('/reviews/:companyId', async (req, res) => {
  try {
    const reviews = await CompanyReview.find({ company: req.params.companyId, status: 'approved' })
      .populate('reviewer', 'name')
      .sort('-createdAt')
    const stats = await CompanyReview.aggregate([
      { $match: { company: new mongoose.Types.ObjectId(req.params.companyId), status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } }
    ])
    res.json({
      reviews,
      stats: stats[0] || { avgRating: 0, count: 0 },
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

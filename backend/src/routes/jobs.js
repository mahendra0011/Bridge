const router = require('express').Router()
const { body } = require('express-validator')
const { protect, restrictTo } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { sanitizeFields, escapeRegex } = require('../utils/sanitize')
const { uploadResume, uploadApplyFiles, getFileUrl } = require('../middleware/upload')
const Job = require('../models/Job')
const Application = require('../models/Application')
const Company = require('../models/Company')
const Agency = require('../models/Agency')
const User = require('../models/User')
const Notification = require('../models/Notification')
const { sendEmail, newApplicantEmail } = require('../utils/email')

const PERMISSIONS = { owner: ['post_jobs'], admin: ['post_jobs'], recruiter: ['post_jobs'] }
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

const resumeUpload = { single: () => uploadResume }
const _resumeUpload = uploadResume

const postingValidators = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('description').trim().notEmpty().withMessage('Description is required'),
  body('location').trim().notEmpty().withMessage('Location is required'),
  body('mode').isIn(['Remote', 'Hybrid', 'On-site']).withMessage('Invalid work mode'),
  body('salaryMin').optional().isNumeric().withMessage('Salary must be a number'),
  body('salaryMax').optional().isNumeric().withMessage('Salary must be a number'),
  body('vacancies').optional().isInt({ min: 1 }).withMessage('Vacancies must be a positive number'),
]

// GET /api/jobs
router.get('/', async (req, res) => {
  try {
    const { query, location, mode, category, employmentType, experience, salaryMin, salaryMax, skills, deadlineBefore, sort, page = 1, limit = 12, featured } = req.query
    const filter = { status: 'approved' }
    if (query) {
      filter.$or = [
        { title: { $regex: escapeRegex(query), $options: 'i' } },
        { description: { $regex: escapeRegex(query), $options: 'i' } }
      ]
    }
    if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' }
    if (mode) filter.mode = mode
    if (category) filter.category = category
    if (featured === 'true') filter.isFeatured = true
    if (employmentType) filter.employmentType = employmentType
    if (experience) filter.experience = experience
    if (salaryMin || salaryMax) {
      filter.salaryMin = {}
      if (salaryMin) filter.salaryMin.$gte = Number(salaryMin)
      if (salaryMax) filter.salaryMin.$lte = Number(salaryMax)
    }
    if (skills) {
      const skillList = String(skills).split(',').map((s) => s.trim()).filter(Boolean)
      if (skillList.length) filter.skills = { $in: skillList.map((s) => new RegExp('^' + escapeRegex(s) + '$', 'i')) }
    }
    if (deadlineBefore) filter.deadline = { $lte: new Date(deadlineBefore) }

    const sortMap = {
      newest: '-createdAt',
      oldest: 'createdAt',
      deadline: 'deadline',
      salaryHigh: '-salaryMin',
      salaryLow: 'salaryMin',
    }
    const sortBy = sortMap[sort] || '-createdAt'

    const total = await Job.countDocuments(filter)

    const jobsQuery = Job.find(filter)
      .select('title description location mode salaryMin salaryMax experienceLevel employmentType vacancies skills deadline status isBoosted applicantsCount createdAt')
      .populate('company', 'name logoUrl location isVerified industry')
      .populate('agency', 'agencyName logoUrl city isVerified')
      .sort(sortBy)
      .skip((page - 1) * limit)
      .limit(Number(limit))

    const jobs = await jobsQuery

    if (req.user) {
      const jobIds = jobs.map(j => j._id)
      const [savedItems, applications] = await Promise.all([
        req.user.role === 'student' ? require('../models/SavedSearch').find({
          user: req.user._id,
          itemId: { $in: jobIds },
          itemType: 'job'
        }).select('itemId') : [],
        Application.find({
          applicant: req.user._id,
          posting: { $in: jobIds },
          postingModel: 'Job'
        }).select('posting')
      ])

      const savedIds = new Set(savedItems.map(s => String(s.itemId)))
      const appliedIds = new Set(applications.map(a => String(a.posting)))

      jobs.forEach(j => {
        j.isSaved = savedIds.has(String(j._id))
        j.hasApplied = appliedIds.has(String(j._id))
      })
    }

    res.json({ jobs, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/jobs/:id
router.get('/:id', async (req, res) => {
  try {
    const job = await Job.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('company').populate('agency', 'agencyName logoUrl city isVerified')
    if (!job) return res.status(404).json({ message: 'Not found' })
    res.json({ job })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/jobs
router.post('/', protect, restrictTo('company', 'agency'), postingValidators, validate, async (req, res) => {
  try {
    sanitizeFields(req.body, ['title', 'description', 'location', 'category', 'skills'])

    if (req.user.role === 'agency') {
      const agency = await Agency.findOne({ user: req.user._id })
      if (!agency) return res.status(404).json({ message: 'Agency profile not found' })
      if (!agency.portfolioUrl) {
        return res.status(403).json({ message: 'Add your portfolio/work samples link before posting jobs.' })
      }
      if (!agencyCanPost(agency, req.user._id)) {
        return res.status(403).json({ message: 'No permission to post jobs' })
      }
      const now = new Date()
      if (!agency.monthlyPostReset || agency.monthlyPostReset < now) {
        agency.monthlyPostCount = 0
        agency.monthlyPostReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      }
      if (!agency.isRegistered && agency.monthlyPostCount >= (agency.unregisteredLimit || 3)) {
        return res.status(403).json({ message: 'Limit reached.', needsRegistration: true })
      }

      const job = await Job.create({ ...req.body, status: 'approved', agency: agency._id, postedBy: req.user._id })
      agency.monthlyPostCount += 1
      await agency.save()
      return res.status(201).json({ job })
    }

    const company = await Company.findById(req.user.profileId)
    if (!company) return res.status(404).json({ message: 'Company not found' })
    if (!canPost(company, req.user._id)) {
      return res.status(403).json({ message: 'No permission to post jobs' })
    }

    const job = await Job.create({ ...req.body, company: company._id, status: 'approved', postedBy: req.user._id })

    try {
      const Bridge = require('../models/Bridge')
      const connectedStudents = await Bridge.find({ company: company._id }).populate('student')
      const io = req.app.get('io')
      if (io && connectedStudents.length) {
        for (const bridge of connectedStudents) {
          if (bridge.student?.user) {
            await io.sendNotification(bridge.student.user, {
              title: 'New job posted!',
              message: company.name + ' posted a new role: ' + job.title,
              icon: '\u{1f4bc}',
              link: '/job/' + job._id
            })
          }
        }
      }
    } catch (e) { console.error('Failed to notify students:', e) }

    res.status(201).json({ job })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/jobs/:id
router.put('/:id', protect, restrictTo('company', 'agency'), postingValidators, validate, async (req, res) => {
  try {
    sanitizeFields(req.body, ['title', 'description', 'location', 'category', 'skills'])
    const job = await Job.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.user._id },
      req.body, { new: true }
    )
    if (!job) return res.status(404).json({ message: 'Not found or not authorized' })
    res.json({ job })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/jobs/:id
router.delete('/:id', protect, restrictTo('company', 'agency', 'admin'), async (req, res) => {
  try {
    await Job.findOneAndDelete({ _id: req.params.id, postedBy: req.user._id })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/jobs/:id/apply
router.post('/:id/apply', protect, restrictTo('student'), (req, res) => {
  uploadApplyFiles(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })
    try {
      const job = await Job.findById(req.params.id)
      if (!job) return res.status(404).json({ message: 'Not found' })
      const existing = await Application.findOne({ applicant: req.user._id, posting: job._id })
      if (existing) return res.status(400).json({ message: 'Already applied' })
      sanitizeFields(req.body, ['coverLetter', 'portfolioUrl', 'linkedinUrl', 'screeningAnswers'])
      const files = req.files || {}
      const resumeFile = files.resume?.[0]
      const testTaskFile = files.testTask?.[0]
      const getUrl = (f, folder) => f ? (f.path || '/uploads/' + folder + '/' + f.filename) : null
      const resumeUrl = resumeFile ? getUrl(resumeFile, 'resumes') : req.body.resumeUrl
      const testTaskUrl = testTaskFile ? getUrl(testTaskFile, 'resumes') : undefined
      let screeningAnswers
      try { screeningAnswers = req.body.screeningAnswers ? JSON.parse(req.body.screeningAnswers) : undefined } catch {}
      const app = await Application.create({
        applicant: req.user._id,
        postingType: 'job',
        posting: job._id,
        postingModel: 'Job',
        resumeUrl,
        coverLetter: req.body.coverLetter,
        portfolioUrl: req.body.portfolioUrl,
        linkedinUrl: req.body.linkedinUrl,
        testTaskUrl,
        screeningAnswers,
      })
      await Job.findByIdAndUpdate(job._id, { $inc: { applicantsCount: 1 } })
      const io = req.app.get('io')
      if (io) {
        await io.sendNotification(req.user._id, { title: 'Application submitted!', message: 'Your application to ' + job.title + ' was sent.', icon: '\u{1f4cb}' })
      }
      res.status(201).json({ application: app })
      Company.findById(job.company).then(async (company) => {
        const contactUser = await User.findById(job.postedBy).select('name email')
        const to = company?.email || contactUser?.email
        if (!to) return
        return sendEmail({ to, ...newApplicantEmail(contactUser?.name || company?.name || 'there', req.user.name, job.title, 'job', undefined) })
      }).catch(() => {})
    } catch (err) { res.status(500).json({ message: err.message }) }
  })
})

module.exports = router
const mongoose = require('mongoose')
const router = require('express').Router()
const { sanitizeFields } = require('../utils/sanitize')
const { protect, restrictTo } = require('../middleware/auth')
const { uploadLogo, uploadDocument, getFileUrl } = require('../middleware/upload')
const Agency = require('../models/Agency')
const AgencyReview = require('../models/AgencyReview')
const User = require('../models/User')
const Job = require('../models/Job')
const Internship = require('../models/Internship')
const Application = require('../models/Application')
const Notification = require('../models/Notification')
const Message = require('../models/Message')
const Conversation = require('../models/Conversation')
const Opportunity = require('../models/Opportunity')
const SupportTicket = require('../models/SupportTicket')
const { sendEmail, newMessageEmail } = require('../utils/email')

const RED_FLAG_PHRASES = [
  'processing fee', 'pay to register', 'bank details', 'deposit',
  'registration fee', 'security deposit', 'joining fee',
]

function notifyViaEmailIfOffline(io, recipientId, senderName, conversationId) {
  try {
    if (!io) return
    const status = io.getOnlineStatus(String(recipientId))
    if (status.online) return
    User.findById(recipientId).select('name email').then(recipient => {
      if (!recipient?.email) return
      const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/messages/${conversationId}`
      return sendEmail({ to: recipient.email, ...newMessageEmail(recipient.name, senderName, link) })
    }).catch(() => {})
  } catch {}
}

// ─── Helper: get agency for current user ─────────────────────────────────
async function getOwnAgency(userId) {
  return await Agency.findOne({ user: userId })
}

// ─── Helper: check if user can post (owner or team member with permission) ──
const AGENCY_PERMISSIONS = {
  admin: ['post_jobs', 'manage_team', 'edit_agency_profile'],
  editor: ['post_jobs'],
  viewer: [],
}

function canPost(agency, userId) {
  if (String(agency.user) === String(userId)) return true
  const member = agency.teamMembers.find(m => String(m.user) === String(userId))
  return member && AGENCY_PERMISSIONS[member.role]?.includes('post_jobs')
}

// ─── Helper: check & increment monthly post limit for unregistered agencies ──
async function checkPostLimit(agency) {
  if (agency.isRegistered) return null

  const now = new Date()
  if (!agency.monthlyPostReset || agency.monthlyPostReset < now) {
    agency.monthlyPostCount = 0
    agency.monthlyPostReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }

  if (agency.monthlyPostCount >= agency.unregisteredLimit) {
    return `You've reached the limit of ${agency.unregisteredLimit} posts/month for unregistered agencies. Register your agency (Udyam/docs) to unlock unlimited posting.`
  }
  return null
}

async function incrementPostCount(agency) {
  const now = new Date()
  if (!agency.monthlyPostReset || agency.monthlyPostReset < now) {
    agency.monthlyPostCount = 0
    agency.monthlyPostReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
  }
  agency.monthlyPostCount += 1
  await agency.save()
}

// ─── Public: List all agencies ─────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, search, city, state } = req.query
    const query = { isProfileComplete: true, isActive: true }

    if (search) {
      query.$or = [
        { agencyName: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } },
        { services: { $in: [new RegExp(search, 'i')] } },
      ]
    }
    if (city) query.city = { $regex: city, $options: 'i' }

    const total = await Agency.countDocuments(query)
    const agencies = await Agency.find(query)
      .select('-documents -idProof')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()

    res.json({
      agencies,
      total,
      pages: Math.ceil(total / limit),
      page: Number(page),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Public: Single agency detail (by id or slug) ──────────────────────
router.get('/:id/public', async (req, res) => {
  try {
    let agency = await Agency.findById(req.params.id).select('-documents -idProof').lean()
    if (!agency) agency = await Agency.findOne({ slug: req.params.id }).select('-documents -idProof').lean()
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    if (!agency.isActive) return res.status(410).json({ message: 'This agency has been deactivated' })

    const [user, jobs, internships, reviewStats] = await Promise.all([
      User.findById(agency.user).select('name email phone createdAt').lean(),
      Job.find({ agency: req.params.id, status: 'approved' })
        .select('title location mode employmentType salaryMin salaryMax createdAt deadline status applicantsCount skills category isClientProject')
        .sort('-createdAt')
        .limit(20)
        .lean(),
      Internship.find({ agency: req.params.id, status: 'approved' })
        .select('title location mode stipend duration startDate createdAt deadline status applicantsCount skills category isClientProject')
        .sort('-createdAt')
        .limit(20)
        .lean(),
      AgencyReview.aggregate([
        { $match: { agency: agency._id, status: 'approved' } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$rating' },
            avgQuality: { $avg: '$qualityRating' },
            avgCommunication: { $avg: '$communicationRating' },
            avgTurnaround: { $avg: '$turnaroundRating' },
            avgPayment: { $avg: '$paymentRating' },
            count: { $sum: 1 },
          },
        },
      ]),
    ])

    const stats = reviewStats[0] || {}
    const activeTeamMembers = (agency.teamMembers || []).filter(m => m.role !== 'viewer').length

    res.json({
      agency: {
        ...agency,
        user: user ? { name: user.name, email: user.email, phone: user.phone } : null,
        teamMemberCount: activeTeamMembers,
        idProof: agency.idProof ? true : false,
      },
      jobs,
      internships,
      reviewStats: {
        avgRating: stats.avgRating ? Math.round(stats.avgRating * 10) / 10 : 0,
        avgQuality: stats.avgQuality ? Math.round(stats.avgQuality * 10) / 10 : 0,
        avgCommunication: stats.avgCommunication ? Math.round(stats.avgCommunication * 10) / 10 : 0,
        avgTurnaround: stats.avgTurnaround ? Math.round(stats.avgTurnaround * 10) / 10 : 0,
        avgPayment: stats.avgPayment ? Math.round(stats.avgPayment * 10) / 10 : 0,
        count: stats.count || 0,
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Public: Listing feed for AgencyListings page ──────────────────────
router.get('/listing-feed', async (req, res) => {
  try {
    const { limit = 24 } = req.query
    const maxLimit = Number(limit) * 4
    const agencyFields = 'agencyName logoUrl services city isVerified isRegistered regCertificate idProof'
    const jobSelect = 'title description location mode employmentType salaryMin salaryMax projectFee hourlyRate createdAt deadline status applicantsCount skills goodToHaveSkills tools category isClientProject clientProjectLabel vacancies'
    const internSelect = 'title description location mode stipend duration startDate projectFee hourlyRate createdAt deadline status applicantsCount skills goodToHaveSkills tools category isClientProject clientProjectLabel vacancies'
    const [jobs, internships] = await Promise.all([
      Job.find({ status: 'approved', agency: { $ne: null } })
        .populate('agency', agencyFields)
        .select(jobSelect)
        .sort('-createdAt')
        .limit(maxLimit)
        .lean(),
      Internship.find({ status: 'approved', agency: { $ne: null } })
        .populate('agency', agencyFields)
        .select(internSelect)
        .sort('-createdAt')
        .limit(maxLimit)
        .lean(),
    ])

    const listings = [
      ...jobs.filter(j => j.agency && typeof j.agency === 'object' && j.agency.agencyName).map(j => ({ ...j, kind: 'job' })),
      ...internships.filter(i => i.agency && typeof i.agency === 'object' && i.agency.agencyName).map(i => ({ ...i, kind: 'internship' })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, Number(limit))

    res.json({ listings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Protected: Get own agency profile ─────────────────────────────────
router.get('/me', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency profile not found. Complete signup first.' })
    res.json({ agency })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Protected: Update own agency profile (Step 2 completion) ──────────
router.put('/me', protect, restrictTo('agency'), async (req, res) => {
  try {
    const allowed = [
      'agencyName', 'description', 'website', 'city', 'foundedYear',
      'teamSize', 'services', 'socialLinks', 'portfolioUrl', 'instagram',
      'linkedin', 'udyamNumber', 'isRegistered',
    ]
    const updates = sanitizeFields(req.body, allowed)
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    Object.assign(agency, updates)
    agency.isProfileComplete = true
    agency.signupStep = 2
    await agency.save()
    res.json({ agency, message: 'Agency profile updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Upload agency logo ────────────────────────────────────────────────
router.post('/logo', protect, restrictTo('agency'), uploadLogo, async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    agency.logoUrl = getFileUrl(req, 'logos')
    await agency.save()
    res.json({ logoUrl: agency.logoUrl })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Upload ID proof ───────────────────────────────────────────────────
router.post('/id-proof', protect, restrictTo('agency'), uploadDocument, async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    agency.idProof = getFileUrl(req, 'documents')
    await agency.save()
    res.json({ message: 'ID proof uploaded' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Upload registration certificate ──────────────────────────────────
router.post('/reg-certificate', protect, restrictTo('agency'), uploadDocument, async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    agency.regCertificate = getFileUrl(req, 'documents')
    await agency.save()
    res.json({ regCertificate: agency.regCertificate })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Get agency jobs (posted by this agency) ──────────────────────────
router.get('/my-jobs', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    const jobs = await Job.find({ agency: agency._id }).sort('-createdAt').lean()
    res.json({ jobs })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Get agency internships ────────────────────────────────────────────
router.get('/my-internships', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    const internships = await Internship.find({ agency: agency._id }).sort('-createdAt').lean()
    res.json({ internships })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Agency team management ────────────────────────────────────────────

// GET /api/agency/team — list team members
router.get('/team', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    await agency.populate('teamMembers.user', 'name email')
    res.json({ team: agency.teamMembers || [] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/agency/team/invite — add a team member (owner only)
router.post('/team/invite', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    if (String(agency.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the agency owner can manage team members' })
    }

    const { email, role = 'editor' } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, editor, or viewer' })
    }

    const user = await User.findOne({ email })
    if (!user) return res.status(404).json({ message: 'No user found with this email' })

    const alreadyMember = agency.teamMembers.some(m => String(m.user) === String(user._id))
    if (alreadyMember) return res.status(400).json({ message: 'User is already a team member' })
    if (String(user._id) === String(agency.user)) {
      return res.status(400).json({ message: 'You cannot add yourself as a team member' })
    }

    agency.teamMembers.push({ user: user._id, role })
    await agency.save()

    await agency.populate('teamMembers.user', 'name email')
    res.status(201).json({ team: agency.teamMembers })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/agency/team/:userId — remove a team member
router.delete('/team/:userId', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    if (String(agency.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the agency owner can manage team members' })
    }

    const memberIdx = agency.teamMembers.findIndex(m => String(m.user) === String(req.params.userId))
    if (memberIdx === -1) return res.status(404).json({ message: 'Team member not found' })

    agency.teamMembers.splice(memberIdx, 1)
    await agency.save()

    res.json({ team: agency.teamMembers })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/agency/team/:userId/role — change role of a team member
router.patch('/team/:userId/role', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    if (String(agency.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the agency owner can manage team members' })
    }

    const { role } = req.body
    if (!['admin', 'editor', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role. Must be admin, editor, or viewer' })
    }

    const member = agency.teamMembers.find(m => String(m.user) === String(req.params.userId))
    if (!member) return res.status(404).json({ message: 'Team member not found' })

    member.role = role
    await agency.save()

    await agency.populate('teamMembers.user', 'name email')
    res.json({ team: agency.teamMembers })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Reviews: Get own agency reviews (must be before :agencyId param route) ──
router.get('/reviews', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    const reviews = await AgencyReview.find({ agency: agency._id })
      .populate('reviewer', 'name role')
      .sort('-createdAt')
      .lean()
    res.json({ reviews })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/reviews/stats', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    const stats = await AgencyReview.aggregate([
      { $match: { agency: agency._id, status: 'approved' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          count: { $sum: 1 },
          distribution: {
            5: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
            4: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
            3: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
            2: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
            1: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
          },
        },
      },
    ])

    const s = stats[0] || {}
    res.json({
      average: s.avgRating || 0,
      total: s.count || 0,
      distribution: s.distribution || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Reviews: Submit a review ─────────────────────────────────────────
router.post('/reviews', protect, async (req, res) => {
  try {
    const { agencyId, rating, qualityRating, communicationRating, turnaroundRating, paymentRating, title, review, isAnonymous } = req.body
    if (!agencyId || !rating) return res.status(400).json({ message: 'agencyId and rating required' })

    const existing = await AgencyReview.findOne({ agency: agencyId, reviewer: req.user._id })
    if (existing) return res.status(400).json({ message: 'You already reviewed this agency' })

    const item = await AgencyReview.create({
      agency: agencyId, reviewer: req.user._id,
      rating, qualityRating, communicationRating, turnaroundRating, paymentRating,
      title, review, isAnonymous,
    })
    res.status(201).json({ review: item })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Reviews: Get public reviews for an agency ─────────────────────────
router.get('/reviews/:agencyId', async (req, res) => {
  try {
    const reviews = await AgencyReview.find({ agency: req.params.agencyId, status: 'approved' })
      .populate('reviewer', 'name')
      .sort('-createdAt')

    const stats = await AgencyReview.aggregate([
      { $match: { agency: new mongoose.Types.ObjectId(req.params.agencyId), status: 'approved' } },
      {
        $group: {
          _id: null,
          avgRating: { $avg: '$rating' },
          avgQuality: { $avg: '$qualityRating' },
          avgCommunication: { $avg: '$communicationRating' },
          avgTurnaround: { $avg: '$turnaroundRating' },
          avgPayment: { $avg: '$paymentRating' },
          count: { $sum: 1 },
        },
      },
    ])

    const s = stats[0] || {}
    res.json({
      reviews,
      stats: {
        avgRating: s.avgRating ? Math.round(s.avgRating * 10) / 10 : 0,
        avgQuality: s.avgQuality ? Math.round(s.avgQuality * 10) / 10 : 0,
        avgCommunication: s.avgCommunication ? Math.round(s.avgCommunication * 10) / 10 : 0,
        avgTurnaround: s.avgTurnaround ? Math.round(s.avgTurnaround * 10) / 10 : 0,
        avgPayment: s.avgPayment ? Math.round(s.avgPayment * 10) / 10 : 0,
        count: s.count || 0,
      },
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Unified listing detail (job, internship, or opportunity by an agency) ──
router.get('/listing/:id', async (req, res) => {
  try {
    let listing = await Job.findById(req.params.id)
      .populate('agency', 'agencyName logoUrl services teamSize description isVerified idProof udyamNumber regCertificate isRegistered')
      .lean()
    let kind = 'job'

    if (!listing) {
      listing = await Internship.findById(req.params.id)
        .populate('agency', 'agencyName logoUrl services teamSize description isVerified idProof udyamNumber regCertificate isRegistered')
        .lean()
      kind = 'internship'
    }

    if (!listing) {
      listing = await Opportunity.findById(req.params.id)
        .populate('poster', 'name isEmailVerified isPhoneVerified isIdVerified')
        .lean()
      kind = 'opportunity'
    }

    if (!listing) return res.status(404).json({ message: 'Listing not found' })

    if (listing.agency) {
      listing.agency.idProof = !!listing.agency.idProof
      listing.agency.udyamNumber = !!listing.agency.udyamNumber
      listing.agency.regCertificate = !!listing.agency.regCertificate
    }

    let reviewStats = { avgRating: 0, count: 0 }
    if (listing.agency) {
      const stats = await AgencyReview.aggregate([
        { $match: { agency: listing.agency._id, status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ])
      if (stats[0]) {
        reviewStats = {
          avgRating: Math.round(stats[0].avgRating * 10) / 10,
          count: stats[0].count,
        }
      }
    }

    res.json({ listing, kind, reviewStats })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Get monthly post limit info ─────────────────────────────────────
router.get('/post-limit', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })

    const now = new Date()
    if (!agency.monthlyPostReset || agency.monthlyPostReset < now) {
      agency.monthlyPostCount = 0
      agency.monthlyPostReset = new Date(now.getFullYear(), now.getMonth() + 1, 1)
      await agency.save()
    }

    res.json({
      isRegistered: agency.isRegistered,
      monthlyPostCount: agency.monthlyPostCount,
      monthlyPostLimit: agency.isRegistered ? -1 : agency.unregisteredLimit,
      monthlyPostReset: agency.monthlyPostReset,
      remainingPosts: agency.isRegistered ? -1 : agency.unregisteredLimit - agency.monthlyPostCount,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Dashboard: Get overview stats and recent postings ─────────────────────
router.get('/dashboard', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })

    const [jobs, internships, viewsAgg, hiresAgg] = await Promise.all([
      Job.find({ agency: agency._id, status: 'approved' }).select('_id title applicantsCount views createdAt').lean(),
      Internship.find({ agency: agency._id, status: 'approved' }).select('_id title applicantsCount views createdAt').lean(),
      Job.aggregate([
        { $match: { agency: agency._id } },
        { $group: { _id: null, views: { $sum: '$views' } } },
      ]),
      Job.aggregate([
        { $match: { agency: agency._id } },
        { $group: { _id: null, count: { $sum: { $cond: [{ $eq: ['$status', 'hired'] }, 1, 0] } } } },
      ]),
    ])

    const allPostings = [...jobs, ...internships]
    const totalApplicants = allPostings.reduce((sum, p) => sum + (p.applicantsCount || 0), 0)
    const totalViews = viewsAgg[0]?.views || 0
    const hired = hiresAgg[0]?.count || 0

    const recentPostings = allPostings
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5)

    res.json({
      activePostings: allPostings.length,
      totalApplicants,
      views: totalViews,
      hired,
      recentPostings: recentPostings.map(p => ({
        ...p,
        kind: p.title ? 'job' : 'internship',
      })),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Profile: Get own agency profile ──────────────────────────────────────
router.get('/profile', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency profile not found' })
    res.json({ agency })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Portfolio: CRUD operations ───────────────────────────────────────────
router.get('/portfolio', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    res.json({ portfolio: agency?.portfolio || [] })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/portfolio', protect, restrictTo('agency'), async (req, res) => {
  try {
    const { title, description, imageUrl, category, link } = req.body
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    agency.portfolio.push({ title, description, imageUrl, category, link })
    await agency.save()
    res.json({ portfolio: agency.portfolio })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/portfolio/:id', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    const idx = agency.portfolio.findIndex(p => p._id.toString() === req.params.id)
    if (idx === -1) return res.status(404).json({ message: 'Portfolio item not found' })
    Object.assign(agency.portfolio[idx], req.body)
    await agency.save()
    res.json({ portfolio: agency.portfolio })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/portfolio/:id', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    agency.portfolio = agency.portfolio.filter(p => p._id.toString() !== req.params.id)
    await agency.save()
    res.json({ portfolio: agency.portfolio })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Services: Add/Remove ─────────────────────────────────────────────────
router.post('/services', protect, restrictTo('agency'), async (req, res) => {
  try {
    const { service } = req.body
    if (!service) return res.status(400).json({ message: 'Service is required' })
    const agency = await getOwnAgency(req.user._id)
    agency.services = agency.services || []
    if (!agency.services.includes(service)) agency.services.push(service)
    await agency.save()
    res.json({ services: agency.services })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/services/:service', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    agency.services = (agency.services || []).filter(s => s !== decodeURIComponent(req.params.service))
    await agency.save()
    res.json({ services: agency.services })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Verification: Get status and upload endpoints ──────────────────────────
router.get('/verification', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    res.json({ verification: { isVerified: agency?.isVerified, status: agency?.isVerified ? 'verified' : 'unverified' } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/verification/upload', protect, restrictTo('agency'), uploadDocument, async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    agency.regCertificate = getFileUrl(req, 'documents')
    agency.isRegistered = true
    await agency.save()
    res.json({ verification: { isVerified: agency.isVerified, status: agency.isVerified ? 'verified' : 'pending' } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Analytics: Get analytics data ─────────────────────────────────────────
router.get('/analytics', protect, restrictTo('agency'), async (req, res) => {
  try {
    const { period = '30d' } = req.query
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })

    const [jobs, internships] = await Promise.all([
      Job.find({ agency: agency._id }).select('title views applicantsCount skills category').lean(),
      Internship.find({ agency: agency._id }).select('title views applicantsCount skills category').lean(),
    ])

    const allPostings = [...jobs, ...internships]
    const totalViews = allPostings.reduce((sum, p) => sum + (p.views || 0), 0)
    const totalApplicants = allPostings.reduce((sum, p) => sum + (p.applicantsCount || 0), 0)
    const totalInquiries = totalApplicants

    const categoryMap = {}
    allPostings.forEach(p => {
      const cat = p.category || 'General'
      categoryMap[cat] = categoryMap[cat] || { name: cat, inquiries: 0, views: 0 }
      categoryMap[cat].inquiries += p.applicantsCount || 0
      categoryMap[cat].views += p.views || 0
    })

    const reviews = await AgencyReview.find({ agency: agency._id, status: 'approved' }).lean()
    const avgRating = reviews.length ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0

    res.json({
      analytics: {
        totalViews,
        viewsChange: 0,
        totalApplicants,
        applicantsChange: 0,
        totalInquiries,
        inquiriesChange: 0,
        avgRating,
        totalReviews: reviews.length,
        categoryBreakdown: Object.values(categoryMap),
        postingPerformance: allPostings.map(p => ({
          title: p.title,
          kind: p.title ? 'job' : 'internship',
          views: p.views || 0,
          applicants: p.applicantsCount || 0,
          inquiries: p.applicantsCount || 0,
        })),
      },
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Messages: Start direct conversation ───────────────────────────────────
router.post('/conversations/direct', protect, restrictTo('agency'), async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ message: 'userId is required' })
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' })
    }

    // Check blocks
    const StudentProfile = require('../models/StudentProfile')
    const studentProfile = await StudentProfile.findOne({ user: userId }).select('blockedUsers')
    const agency = await Agency.findOne({ user: req.user._id }).select('blockedUsers')
    const studentBlocked = studentProfile?.blockedUsers?.some(id => String(id) === String(req.user._id))
    const agencyBlocked = agency?.blockedUsers?.some(id => String(id) === String(userId))
    if (studentBlocked || agencyBlocked) {
      return res.status(403).json({ message: 'Unable to start conversation' })
    }

    // Find existing conversation or create new one
    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
      posting: { $exists: false },
    })
      .populate('participants', 'name email role')

    if (conv) {
      const obj = conv.toObject()
      const io = req.app.get('io')
      if (io) obj.onlineStatus = io.getOnlineStatus(String(userId))
      obj.unreadCount = conv.unreadCount?.get(String(req.user._id)) || 0
      obj.participant = obj.participants.find(p => String(p._id) !== String(req.user._id))
      return res.json({ conversation: obj })
    }

    conv = await Conversation.create({
      participants: [req.user._id, userId],
      initiatedBy: 'agency',
      status: 'active',
    })

    conv = await Conversation.findById(conv._id).populate('participants', 'name email role')
    const obj = conv.toObject()
    const io = req.app.get('io')
    if (io) obj.onlineStatus = io.getOnlineStatus(String(userId))
    obj.unreadCount = 0
    obj.participant = obj.participants.find(p => String(p._id) !== String(req.user._id))

    res.status(201).json({ conversation: obj })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Messages: Get conversations ───────────────────────────────────────────
router.get('/conversations', protect, restrictTo('agency'), async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name email')
      .populate('posting', 'title')
      .populate('application', 'status')
      .sort('-lastMessageAt')
      .lean()

    const io = req.app.get('io')
    const formatted = conversations.map(c => {
const other = c.participants.find(p => String(p._id) !== String(req.user._id))
       return {
         _id: c._id,
         participant: other,
         participants: c.participants,
         lastMessage: c.lastMessage || (c.lastMessage?.content ? c.lastMessage.content : ''),
         lastMessageAt: c.lastMessageAt || c.updatedAt,
         unread: c.unreadCount?.get(String(req.user._id)) || 0,
         unreadCount: c.unreadCount?.get(String(req.user._id)) || 0,
         posting: c.posting,
         application: c.application,
         onlineStatus: other && io ? io.getOnlineStatus(String(other._id)) : { online: false, lastSeen: null },
       }
    })
    res.json({ conversations: formatted })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Messages: Get single conversation messages ────────────────────────────
router.get('/conversations/:id/messages', protect, restrictTo('agency'), async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
    const skip = (page - 1) * limit

    const [messages, total] = await Promise.all([
      Message.find({ conversation: req.params.id })
        .populate('sender', 'name email role')
        .sort('createdAt')
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversation: req.params.id }),
    ])

    // Mark messages as read for this user
    await Message.updateMany(
      { conversation: req.params.id, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    )

    conv.unreadCount.set(String(req.user._id), 0)
    await conv.save()

    const io = req.app.get('io')
    if (io) {
      io.sendUnreadUpdate(String(req.user._id), String(req.params.id), 0)
    }

    res.json({ messages, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Messages: Send a message ──────────────────────────────────────────────
router.post('/conversations/:id/messages', protect, restrictTo('agency'), async (req, res) => {
  try {
    const { text, attachments } = req.body
    if (!text?.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message content or attachment required' })
    }

    const conversation = await Conversation.findById(req.params.id)
    if (!conversation) return res.status(404).json({ message: 'Conversation not found' })
    if (conversation.status === 'blocked') return res.status(403).json({ message: 'Conversation is blocked' })

    // Check blocks
    const StudentProfile = require('../models/StudentProfile')
    const studentProfile = await StudentProfile.findOne({ user: { $in: conversation.participants } }).select('blockedUsers')
    const otherParticipant = conversation.participants.find(p => String(p) !== String(req.user._id))
    if (otherParticipant && studentProfile?.blockedUsers?.some(id => String(id) === String(req.user._id))) {
      return res.status(403).json({ message: 'Unable to send message' })
    }

    const redFlagReasons = RED_FLAG_PHRASES.filter(phrase => text?.toLowerCase().includes(phrase))

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      senderRole: 'agency',
      messageType: attachments?.length > 0 ? 'file' : 'text',
      text: text?.trim(),
      attachments: attachments || [],
      redFlagged: redFlagReasons.length > 0,
      redFlagReasons: redFlagReasons.length > 0 ? redFlagReasons : undefined,
    })

    conversation.lastMessage = text?.trim() || (attachments?.[0]?.name || 'Sent a file')
    conversation.lastMessageAt = new Date()
    conversation.lastSender = req.user._id
    // Update unread count for recipient
    conversation.participants.forEach(pId => {
      if (String(pId) !== String(req.user._id)) {
        const current = conversation.unreadCount.get(String(pId)) || 0
        conversation.unreadCount.set(String(pId), current + 1)
      }
    })
    await conversation.save()

    const populated = await Message.findById(message._id).populate('sender', 'name email role')

    const io = req.app.get('io')
    if (io) {
      io.sendMessage(String(conversation._id), populated.toObject())
      conversation.participants.forEach(pId => {
        if (String(pId) !== String(req.user._id)) {
          const unread = conversation.unreadCount.get(String(pId)) || 0
          io.sendUnreadUpdate(String(pId), String(conversation._id), unread)
          io.sendNotification(String(pId), {
            title: 'New Message',
            message: `${req.user.name} sent you a message`,
            icon: '💬',
            link: `/dashboard/messages/${conversation._id}`,
          })
          notifyViaEmailIfOffline(io, pId, req.user.name, conversation._id)
        }
      })
    }

    res.status(201).json({ message: populated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Support Tickets ─────────────────────────────────────────────────────────
router.get('/tickets', protect, restrictTo('agency'), async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort('-createdAt').lean()
    res.json({ tickets })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/tickets', protect, restrictTo('agency'), async (req, res) => {
  try {
    const { subject, description, priority = 'medium' } = req.body
    const ticket = await SupportTicket.create({
      user: req.user._id,
      subject,
      description,
      priority,
      status: 'open',
    })
    const tickets = await SupportTicket.find({ user: req.user._id }).sort('-createdAt').lean()
    res.json({ tickets })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Applicants: Get agency applicants for pipeline ──────────────────────────
router.get('/applicants', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })

    const [jobs, internships] = await Promise.all([
      Job.find({ agency: agency._id }).select('_id').lean(),
      Internship.find({ agency: agency._id }).select('_id').lean(),
    ])

    const postingIds = [...jobs, ...internships].map(p => p._id)
    const applications = await Application.find({
      $or: [
        { job: { $in: postingIds } },
        { internship: { $in: postingIds } },
      ],
    })
      .populate('applicant', 'name email college skills')
      .sort('-createdAt')
      .lean()

    res.json({ applicants: applications.map(a => ({
      ...a,
      stage: a.status || 'new',
      kind: a.job ? 'job' : 'internship',
    })) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/applicants/:id/stage', protect, restrictTo('agency'), async (req, res) => {
  try {
    const { stage } = req.body
    const app = await Application.findByIdAndUpdate(
      req.params.id,
      { status: stage },
      { new: true }
    ).lean()
    res.json({ success: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Posting Management (duplicate, boost, status) ──────────────────────────
router.post('/posting/:kind/:id/duplicate', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    const Model = req.params.kind === 'job' ? Job : Internship
    const original = await Model.findById(req.params.id)
    if (!original) return res.status(404).json({ message: 'Not found' })
    if (String(original.agency) !== String(agency._id)) {
      return res.status(403).json({ message: 'This posting does not belong to your agency' })
    }

    const copy = new Model({
      ...original.toObject(),
      _id: undefined,
      title: `${original.title} (Copy)`,
      status: 'draft',
      createdAt: undefined,
      updatedAt: undefined,
      views: 0,
      applicantsCount: 0,
      isBoosted: false,
    })
    await copy.save()
    res.json({ posting: copy })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/posting/:kind/:id/boost', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    const Model = req.params.kind === 'job' ? Job : Internship
    const posting = await Model.findById(req.params.id)
    if (!posting) return res.status(404).json({ message: 'Not found' })
    if (String(posting.agency) !== String(agency._id)) {
      return res.status(403).json({ message: 'This posting does not belong to your agency' })
    }

    posting.isBoosted = !posting.isBoosted
    await posting.save()
    res.json({ posting })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/posting/:kind/:id/status', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    const Model = req.params.kind === 'job' ? Job : Internship
    const posting = await Model.findById(req.params.id)
    if (!posting) return res.status(404).json({ message: 'Not found' })
    if (String(posting.agency) !== String(agency._id)) {
      return res.status(403).json({ message: 'This posting does not belong to your agency' })
    }

    posting.status = req.body.status
    await posting.save()
    res.json({ posting })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Settings ────────────────────────────────────────────────────────────────
router.get('/settings', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    res.json({ settings: agency?.settings || {} })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/settings', protect, restrictTo('agency'), async (req, res) => {
  try {
    const agency = await getOwnAgency(req.user._id)
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    agency.settings = { ...agency.settings, ...req.body }
    await agency.save()
    res.json({ settings: agency.settings })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router
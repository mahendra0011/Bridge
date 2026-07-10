const router = require('express').Router()
const { protect, restrictTo } = require('../middleware/auth')
const { escapeRegex } = require('../utils/sanitize')
const StudentProfile = require('../models/StudentProfile')
const User = require('../models/User')
const Company = require('../models/Company')
const CandidateInvite = require('../models/CandidateInvite')
const Shortlist = require('../models/Shortlist')
const RecruiterNote = require('../models/RecruiterNote')
const Job = require('../models/Job')
const Internship = require('../models/Internship')

async function loadCompany(req, res, next) {
  try {
    if (req.user.companyId) {
      req.company = await Company.findById(req.user.companyId)
    } else {
      req.company = await Company.findOne({ user: req.user._id })
    }
    if (!req.company) return res.status(404).json({ message: 'Company not found' })
    next()
  } catch (err) { res.status(500).json({ message: err.message }) }
}

const jwt = require('jsonwebtoken')
async function optionalCompanyAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1]
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'bridge_secret_key_2026')
      const user = await User.findById(decoded.id)
      if (user) {
        req.user = user
        if (user.role === 'company') {
          if (user.companyId) {
            req.company = await Company.findById(user.companyId)
          } else {
            req.company = await Company.findOne({ user: user._id })
          }
        }
      }
    }
  } catch (err) {}
  next()
}

async function getDailyInviteCount(company) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const initDate = company.otwInviteDate
  const isNewDay = !initDate || new Date(initDate) < today
  return isNewDay ? 0 : (company.otwInviteCount || 0)
}

const DAILY_INVITE_LIMIT = 50

// GET /api/company/candidates/shortlists/list — My shortlists
router.get('/shortlists/list', loadCompany, restrictTo('company'), async (req, res) => {
  try {
    const shortlists = await Shortlist.find({ company: req.company._id })
      .populate('candidate', 'name email')
      .populate('recruiter', 'name email')
      .sort('-createdAt')
    const userIds = shortlists.map(s => s.candidate._id)
    const profiles = await StudentProfile.find({ user: { $in: userIds } }).lean()
    const profileMap = new Map(profiles.map(p => [String(p.user), p]))
    const enriched = shortlists.map(s => ({
      ...s.toObject(),
      profile: profileMap.get(String(s.candidate._id)) || null,
    }))
    res.json({ shortlists: enriched })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/company/candidates — Browse open-to-work candidates
router.get('/', optionalCompanyAuth, async (req, res) => {
  try {
    const { q, skills, location, openTo, relocate, page = 1, limit = 20, sort = '-lastActive' } = req.query

    const filter = { openToWork: true }
    if (q) {
      const userRegex = { $regex: escapeRegex(q), $options: 'i' }
      const matchingUsers = await User.find({ $or: [{ name: userRegex }, { email: userRegex }] }).select('_id')
      filter.$or = [
        { user: { $in: matchingUsers.map(u => u._id) } },
        { headline: userRegex },
        { skills: userRegex },
        { college: userRegex },
        { currentLocation: userRegex },
      ]
    }
    if (skills) {
      const skillList = skills.split(',').map(s => s.trim())
      filter.skills = { $in: skillList }
    }
    if (location) filter.currentLocation = { $regex: escapeRegex(location), $options: 'i' }
    if (openTo) {
      const normalized = openTo.toLowerCase().replace(/s$/, '')
      filter.openTo = { $in: [openTo, normalized] }
    }
    if (relocate !== undefined) filter.relocate = relocate === 'true'

    const skip = (Math.max(1, parseInt(page)) - 1) * Math.min(50, Math.max(1, parseInt(limit)))

    let [profiles, total] = await Promise.all([
      StudentProfile.find(filter)
        .populate('user', 'name email isEmailVerified isPhoneVerified isIdVerified')
        .sort(sort)
        .skip(skip)
        .limit(Math.min(50, Math.max(1, parseInt(limit))))
        .lean(),
      StudentProfile.countDocuments(filter),
    ])

    if (req.company) {
      const compName = (req.company.name || '').toLowerCase().trim()
      if (compName) {
        profiles = profiles.filter(p => {
          if (!p.hideFromCurrentEmployer) return true
          const curComp = ((p.experience || []).find(e => e.current)?.company || '').toLowerCase().trim()
          return !curComp.includes(compName)
        })
      }
    }

    const staleDays = 90
    const enriched = profiles.map(p => {
      const currentExp = (p.experience || []).filter(e => e.current)
      const lastActive = p.lastActive || p.updatedAt
      const isStale = lastActive && (Date.now() - new Date(lastActive).getTime() > staleDays * 86400000)
      const totalExpYears = (p.experience || []).reduce((acc, exp) => {
        if (exp.startDate) {
          const start = new Date(exp.startDate)
          const end = exp.current || !exp.endDate ? new Date() : new Date(exp.endDate)
          const yrs = Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 365))
          return acc + yrs
        }
        return acc + 0.5
      }, 0)
      return {
        _id: p._id,
        user: p.user,
        firstName: p.firstName,
        lastName: p.lastName,
        headline: p.headline,
        currentLocation: p.currentLocation,
        openTo: p.openTo,
        relocate: p.relocate,
        noticePeriod: p.noticePeriod,
        expectedCTC: p.expectedCTC,
        skills: p.skills || [],
        college: p.college,
        degree: p.degree,
        year: p.year,
        resumeUrl: p.resumeUrl,
        bio: p.bio,
        experience: p.experience || [],
        education: p.education || [],
        projects: p.projects || [],
        certifications: p.certifications || [],
        achievements: p.achievements || [],
        languages: p.languages || [],
        jobPreferences: p.jobPreferences || {},
        github: p.github,
        linkedin: p.linkedin,
        portfolio: p.portfolio,
        currentRole: currentExp[0]?.role || null,
        currentCompany: currentExp[0]?.company || null,
        totalExpYears: Math.round(totalExpYears * 10) / 10,
        lastActive,
        isStale,
        videoUrl: p.videoUrl,
        linksVerified: p.linksVerified || {},
      }
    })

    let dailyInviteCount = 0
    if (req.company) {
      dailyInviteCount = await getDailyInviteCount(req.company)
    }

    res.json({
      candidates: enriched,
      total,
      page: parseInt(page),
      totalPages: Math.ceil(total / Math.min(50, Math.max(1, parseInt(limit)))),
      dailyInviteCount,
      dailyInviteLimit: DAILY_INVITE_LIMIT,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/company/candidates/:userId — Full profile
router.get('/:userId', optionalCompanyAuth, async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.params.userId })
      .populate('user', 'name email isEmailVerified isPhoneVerified isIdVerified')
      .lean()
    if (!profile || !profile.openToWork) {
      return res.status(404).json({ message: 'Candidate not found or not open to work' })
    }
    const currentExp = (profile.experience || []).filter(e => e.current)
    const staleDays = 90
    const lastActive = profile.lastActive || profile.updatedAt
    const isStale = lastActive && (Date.now() - new Date(lastActive).getTime() > staleDays * 86400000)

    // Company-specific data (invite, shortlist, note, contact reveal)
    let existingInvite = null, existingShortlist = null, existingNote = null
    let contactRevealed = false
    if (req.company && req.user) {
      [existingInvite, existingShortlist, existingNote] = await Promise.all([
        CandidateInvite.findOne({ company: req.company._id, candidate: req.params.userId }).lean(),
        Shortlist.findOne({ company: req.company._id, candidate: req.params.userId }).lean(),
        RecruiterNote.findOne({ recruiter: req.user._id, candidate: req.params.userId }).lean(),
      ])
      contactRevealed = (profile.contactRevealedTo || [])
        .some(id => String(id) === String(req.company._id))
    }

    const result = {
      ...profile,
      phone: contactRevealed ? profile.phone : undefined,
      'user.email': contactRevealed ? profile.user?.email : undefined,
      invite: existingInvite || null,
      shortlisted: !!existingShortlist,
      myNote: existingNote || null,
      currentRole: currentExp[0]?.role || null,
      currentCompany: currentExp[0]?.company || null,
      contactRevealed,
      isStale,
    }
    if (!contactRevealed && result.user) {
      result.user = { ...result.user, email: undefined }
    }

    res.json({ candidate: result })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/company/candidates/:userId/invite — Invite to Apply
router.post('/:userId/invite', loadCompany, restrictTo('company'), async (req, res) => {
  try {
    const { postingId, postingKind, message } = req.body
    if (!postingId || !postingKind) {
      return res.status(400).json({ message: 'postingId and postingKind required' })
    }
    const dailyCount = await getDailyInviteCount(req.company)
    if (dailyCount >= DAILY_INVITE_LIMIT) {
      return res.status(429).json({ message: 'Daily invite limit reached. Try again tomorrow.' })
    }
    const Model = postingKind === 'job' ? Job : Internship
    const posting = await Model.findById(postingId)
    if (!posting || String(posting.company) !== String(req.company._id)) {
      return res.status(400).json({ message: 'Posting not found or not yours' })
    }
    const existing = await CandidateInvite.findOne({
      company: req.company._id, candidate: req.params.userId, posting: postingId,
    })
    if (existing) return res.status(400).json({ message: 'Already invited to this posting' })

    const today = new Date(); today.setHours(0, 0, 0, 0)
    const initDate = req.company.otwInviteDate
    const isNewDay = !initDate || new Date(initDate) < today
    await Company.findByIdAndUpdate(req.company._id, {
      otwInviteCount: isNewDay ? 1 : (req.company.otwInviteCount || 0) + 1,
      otwInviteDate: isNewDay ? new Date() : initDate,
    })

    const invite = await CandidateInvite.create({
      recruiter: req.user._id, company: req.company._id,
      candidate: req.params.userId, posting: postingId,
      postingModel: postingKind === 'job' ? 'Job' : 'Internship',
      message: message || '',
    })
    const populated = await CandidateInvite.findById(invite._id).populate('posting', 'title').lean()
    res.status(201).json({ invite: populated })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/company/candidates/:userId/shortlist — Toggle shortlist
router.post('/:userId/shortlist', loadCompany, restrictTo('company'), async (req, res) => {
  try {
    const existing = await Shortlist.findOne({ company: req.company._id, candidate: req.params.userId })
    if (existing) {
      await existing.deleteOne()
      return res.json({ shortlisted: false })
    }
    await Shortlist.create({
      recruiter: req.user._id, company: req.company._id,
      candidate: req.params.userId, notes: req.body.notes || '',
    })
    res.json({ shortlisted: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/company/candidates/:userId/note — Save recruiter private note
router.put('/:userId/note', loadCompany, restrictTo('company'), async (req, res) => {
  try {
    const { content, tags } = req.body
    const note = await RecruiterNote.findOneAndUpdate(
      { recruiter: req.user._id, candidate: req.params.userId },
      { content: content || '', tags: tags || [], recruiter: req.user._id, candidate: req.params.userId, company: req.company._id },
      { new: true, upsert: true }
    )
    res.json({ note })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/company/candidates/:userId/note
router.delete('/:userId/note', loadCompany, restrictTo('company'), async (req, res) => {
  try {
    await RecruiterNote.findOneAndDelete({ recruiter: req.user._id, candidate: req.params.userId })
    res.json({ message: 'Note deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})



// POST /api/company/candidates/:userId/report — Report profile
router.post('/:userId/report', loadCompany, restrictTo('company'), async (req, res) => {
  try {
    const { reason, description } = req.body
    if (!reason) return res.status(400).json({ message: 'Reason required' })
    const Report = require('../models/Report')
    const report = await Report.create({
      reporter: req.user._id,
      type: 'candidate_profile',
      targetId: req.params.userId,
      reason, description,
    })
    res.status(201).json({ report })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router
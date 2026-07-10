const router = require('express').Router()
const BasePosting = require('../models/BasePosting')
const Job = require('../models/Job')
const Internship = require('../models/Internship')
const Opportunity = require('../models/Opportunity')
const { escapeRegex } = require('../utils/sanitize')

// GET /api/opportunities - List all opportunities
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, query, location, mode, category, skills, sort, poster, status } = req.query

    const filter = {}
    if (status === 'all') { /* no filter */ }
    else if (status) filter.status = status
    if (query) {
      filter.$or = [
        { title: { $regex: escapeRegex(query), $options: 'i' } },
        { role: { $regex: escapeRegex(query), $options: 'i' } },
      ]
    }
    if (location) filter.location = { $regex: escapeRegex(location), $options: 'i' }
    if (mode) filter.mode = mode
    if (poster) filter.poster = poster

    const sortOpt = sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 }
    const total = await Opportunity.countDocuments(filter)
    const pages = Math.ceil(total / limit)
    const opportunities = await Opportunity.find(filter)
      .populate('poster', 'name isEmailVerified isPhoneVerified isIdVerified avatarUrl')
      .sort(sortOpt)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()

    res.json({
      opportunities,
      total,
      pages,
      page: Number(page),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/opportunities/:id - Get single opportunity
router.get('/:id', async (req, res) => {
  try {
    const mongoose = require('mongoose')
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Opportunity not found' })
    }

    // Calculate stats for poster: total opportunities posted and completion rate
    const getPosterStats = async (posterId) => {
      if (!posterId) return { totalOpportunities: 0, completionRate: 0 }
      const totalOpps = await Opportunity.countDocuments({ poster: posterId })
      const completedOpps = await Opportunity.countDocuments({ poster: posterId, status: 'filled' })
      return {
        totalOpportunities: totalOpps,
        completionRate: totalOpps > 0 ? Math.round((completedOpps / totalOpps) * 100) : 0,
      }
    }

    const models = [
      { model: Opportunity, populate: 'poster' },
      { model: Job, populate: 'postedBy' },
      { model: Internship, populate: 'postedBy' },
      { model: BasePosting, populate: 'postedBy' },
    ]
    for (const { model: Model, populate: popField } of models) {
      const doc = await Model.findById(req.params.id).populate(popField, 'name email isEmailVerified isPhoneVerified isIdVerified createdAt avatarUrl bio').lean()
      if (!doc) continue

      // For Opportunity model, shape already matches — just return it
      if (Model === Opportunity) {
        doc.views = (doc.views || 0) + 1
        await Model.findByIdAndUpdate(req.params.id, { views: doc.views })
        // Add poster stats and avatarUrl
        if (doc.poster) {
          const stats = await getPosterStats(doc.poster._id)
          Object.assign(doc.poster, stats)
        }
        return res.json({ opportunity: doc })
      }

      // For Job/Internship/BasePosting — map fields
      const posterStats = doc[popField] ? await getPosterStats(doc[popField]._id) : {}
      const mapped = {
        _id: doc._id,
        title: doc.title,
        description: doc.description,
        opportunityType: doc.employmentType || doc.internshipType || 'Project-based',
        role: doc.role || (doc.roles || [])[0] || '',
        peopleNeeded: doc.vacancies || 1,
        filledCount: 0,
        location: doc.location || 'Remote',
        mode: doc.mode || 'Remote',
        budget: doc.projectFee || doc.salaryMin || 0,
        budgetType: doc.projectFee ? 'fixed' : doc.hourlyRate ? 'hourly' : doc.salaryMin ? 'monthly' : 'fixed',
        duration: doc.duration || '',
        createdAt: doc.createdAt,
        deadline: doc.deadline,
        applicantsCount: doc.applicantsCount || 0,
        views: (doc.views || 0) + 1,
        skills: doc.skills || [],
        goodToHaveSkills: doc.goodToHaveSkills || [],
        experienceLevel: doc.experienceLevel || doc.experience || '',
        portfolioRequired: doc.portfolioRequired,
        weeklyHours: doc.weeklyHours || '',
        ownEquipment: doc.equipmentRequired,
        paymentSchedule: doc.paymentSchedule,
        longTermPossible: doc.longTermCollaboration,
        laptopRequired: doc.equipmentRequired,
        screeningProcess: doc.screeningProcess || (doc.testTask?.title || ''),
        screeningQuestions: doc.screeningQuestions || [],
        tools: doc.tools || [],
        scope: doc.roles || [],
        status: doc.status,
        poster: doc[popField] ? {
          _id: doc[popField]._id,
          name: doc[popField].name,
          avatarUrl: doc[popField].avatarUrl,
          bio: doc[popField].bio,
          isEmailVerified: doc[popField].isEmailVerified,
          isPhoneVerified: doc[popField].isPhoneVerified,
          isIdVerified: doc[popField].isIdVerified,
          createdAt: doc[popField].createdAt,
          ...posterStats,
        } : null,
      }

      await Model.findByIdAndUpdate(req.params.id, { views: mapped.views })
      return res.json({ opportunity: mapped })
    }

    return res.status(404).json({ message: 'Opportunity not found' })
  } catch (err) {
    console.error('❌ Error in GET /api/opportunities/:id:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// POST /api/opportunities — Create an opportunity (80% profile completion check)
const { protect, restrictTo } = require('../middleware/auth')

// Helper: calculate profile completion percentage for a user
function getProfileCompletion(user) {
  const fields = [
    !!user.name,
    !!user.tagline,
    !!user.bio,
    !!user.location,
    !!user.designation,
    !!(user.website || user.linkedin || user.youtube || user.instagram),
    !!user.isEmailVerified,
    !!user.isPhoneVerified,
  ]
  const completed = fields.filter(Boolean).length
  return Math.round((completed / fields.length) * 100)
}

router.post('/', protect, async (req, res) => {
  try {
    const completion = getProfileCompletion(req.user)
    if (completion < 80) {
      return res.status(403).json({
        message: `Complete at least 80% of your profile (currently ${completion}%) to post opportunities. Add your bio, tagline, location, occupation, social links, and verify email/phone.`,
      })
    }

    // Spam cap: max 10 active opportunities per person
    const activeCount = await Opportunity.countDocuments({
      poster: req.user._id,
      status: 'active',
    })
    if (activeCount >= 10) {
      return res.status(429).json({
        message: `You already have ${activeCount} active opportunities. Close some before posting new ones. (Max 10 active)`,
      })
    }

    const {
      title, description, opportunityType, role, peopleNeeded,
      location, mode, budget, budgetType, duration, startDate, deadline,
      skills, goodToHaveSkills, tools, scope, experienceLevel,
      portfolioRequired, weeklyHours, ownEquipment, paymentSchedule,
      longTermPossible, laptopRequired, screeningProcess, screeningQuestions,
      rolesNeeded,
    } = req.body

    if (!title || !description) {
      return res.status(400).json({ message: 'Title and description are required' })
    }

    const opp = await Opportunity.create({
      poster: req.user._id,
      title,
      description,
      opportunityType,
      role,
      peopleNeeded: peopleNeeded || 1,
      location,
      mode,
      budget,
      budgetType,
      duration,
      startDate,
      deadline,
      skills: skills || [],
      goodToHaveSkills: goodToHaveSkills || [],
      tools: tools || [],
      scope: scope || [],
      experienceLevel,
      portfolioRequired,
      weeklyHours,
      ownEquipment,
      paymentSchedule,
      longTermPossible,
      laptopRequired,
      screeningProcess,
      screeningQuestions: screeningQuestions || [],
      rolesNeeded: rolesNeeded || [],
    })

    res.status(201).json({ opportunity: opp })
  } catch (err) {
    console.error('❌ Error in POST /api/opportunities:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// POST /api/opportunities/:id/apply — Apply to an opportunity
const Application = require('../models/Application')
const { uploadApplyFiles } = require('../middleware/upload')
router.post('/:id/apply', protect, restrictTo('student'), (req, res) => {
  uploadApplyFiles(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message || 'File upload error' })
    try {
      const opp = await Opportunity.findById(req.params.id)
      if (!opp) return res.status(404).json({ message: 'Opportunity not found' })
      if (opp.status !== 'active') return res.status(400).json({ message: 'This opportunity is no longer accepting applications' })

      const existing = await Application.findOne({ applicant: req.user._id, posting: opp._id })
      if (existing) return res.status(400).json({ message: 'You already applied to this opportunity' })

      const getUrl = (f) => f ? (f.path || `/uploads/apply/${f.filename}`) : null
      const resumeFile = req.files?.resume?.[0]
      const testTaskFile = req.files?.testTask?.[0]

      const app = await Application.create({
        applicant: req.user._id,
        postingType: 'opportunity',
        posting: opp._id,
        postingModel: 'Opportunity',
        resumeUrl: getUrl(resumeFile) || req.body.resumeUrl || '',
        coverLetter: req.body.coverLetter || '',
        portfolioUrl: req.body.portfolioUrl || '',
        screeningAnswers: req.body.screeningAnswers ? (typeof req.body.screeningAnswers === 'string' ? JSON.parse(req.body.screeningAnswers) : req.body.screeningAnswers) : [],
        testTaskUrl: getUrl(testTaskFile) || '',
      })

      // Create conversation with the poster
      const Conversation = require('../models/Conversation')
      const Message = require('../models/Message')
      let conv = await Conversation.findOne({
        participants: { $all: [req.user._id, opp.poster] },
        posting: opp._id,
        postingModel: 'Opportunity',
      })
      if (!conv) {
        conv = await Conversation.create({
          participants: [req.user._id, opp.poster],
          posting: opp._id,
          postingModel: 'Opportunity',
          initiatedBy: 'candidate',
          status: 'active',
        })
      }
      // Send initial message to poster
      const messageContent = req.body.message || `I'm interested in your opportunity: ${opp.title}`
      const msg = await Message.create({
        conversation: conv._id,
        sender: req.user._id,
        senderRole: req.user.role || 'student',
        messageType: 'text',
        text: messageContent,
        readBy: [req.user._id],
      })
      conv.lastMessage = messageContent
      conv.lastMessageAt = new Date()
      conv.lastSender = req.user._id
      await conv.save()

      // Notify poster
      const Notification = require('../models/Notification')
      await Notification.create({
        user: opp.poster,
        title: 'New interest in your opportunity',
        message: `${req.user.name || 'Someone'} is interested in your opportunity: ${opp.title}`,
        icon: '💼',
        link: `/opportunity/${opp._id}`,
      })

      await Opportunity.findByIdAndUpdate(opp._id, { $inc: { applicantsCount: 1 } })
      res.status(201).json({ application: app, message: 'Application submitted' })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })
})

// POST /api/opportunities/:id/duplicate — Duplicate an opportunity
router.post('/:id/duplicate', protect, async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id)
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' })
    if (String(opp.poster) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the poster can duplicate this opportunity' })
    }

    const dup = await Opportunity.create({
      poster: req.user._id,
      title: opp.title,
      description: opp.description,
      opportunityType: opp.opportunityType,
      role: opp.role,
      peopleNeeded: opp.peopleNeeded,
      location: opp.location,
      mode: opp.mode,
      budget: opp.budget,
      budgetType: opp.budgetType,
      duration: opp.duration,
      deadline: opp.deadline,
      skills: opp.skills,
      goodToHaveSkills: opp.goodToHaveSkills,
      tools: opp.tools,
      scope: opp.scope,
      experienceLevel: opp.experienceLevel,
      portfolioRequired: opp.portfolioRequired,
      weeklyHours: opp.weeklyHours,
      paymentSchedule: opp.paymentSchedule,
      longTermPossible: opp.longTermPossible,
      laptopRequired: opp.laptopRequired,
      screeningProcess: opp.screeningProcess,
      screeningQuestions: opp.screeningQuestions,
      rolesNeeded: opp.rolesNeeded,
    })

    res.status(201).json({ opportunity: dup, message: 'Opportunity duplicated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/opportunities/:id — Close/delete an opportunity
router.delete('/:id', protect, async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id)
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' })
    if (String(opp.poster) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the poster can close this opportunity' })
    }

    opp.status = 'closed'
    await opp.save()
    res.json({ message: 'Opportunity closed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PATCH /api/opportunities/:id/filled — Track filled count
router.patch('/:id/filled', protect, async (req, res) => {
  try {
    const opp = await Opportunity.findById(req.params.id)
    if (!opp) return res.status(404).json({ message: 'Opportunity not found' })
    if (String(opp.poster) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the poster can update filled count' })
    }

    const { filledCount } = req.body
    if (filledCount === undefined || filledCount < 0) {
      return res.status(400).json({ message: 'Valid filledCount required' })
    }

    opp.filledCount = Math.min(filledCount, opp.peopleNeeded)
    if (opp.filledCount >= opp.peopleNeeded) opp.status = 'filled'
    await opp.save()

    res.json({ opportunity: opp, message: 'Filled count updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

const router = require('express').Router()
const path = require('path')
const fs = require('fs')
const { sanitizeFields } = require('../utils/sanitize')
const { protect, restrictTo } = require('../middleware/auth')
const { uploadLogo, uploadDocument, getFileUrl, deleteOldAsset } = require('../middleware/upload')
const Company = require('../models/Company')
const Internship = require('../models/Internship')
const Job = require('../models/Job')
const Application = require('../models/Application')
const StudentProfile = require('../models/StudentProfile')
const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const Notification = require('../models/Notification')
const User = require('../models/User')
const Report = require('../models/Report')
const CompanyReview = require('../models/CompanyReview')
const { sendEmail, applicationStatusEmail, newMessageEmail, teamInviteEmail } = require('../utils/email')
const InterviewSlot = require('../models/InterviewSlot')
const InterviewFeedback = require('../models/InterviewFeedback')
const SupportTicket = require('../models/SupportTicket')

// ─── Public company profile ──────────────────────────────────────────────
// No auth — used by the public Company Detail page.
router.get('/:id/public', async (req, res) => {
  try {
    let company = await Company.findById(req.params.id).lean()
    // Support SEO-friendly slug URLs — if not found by ID, try slug
    if (!company && typeof req.params.id === 'string' && req.params.id.length > 12) {
      company = await Company.findOne({ slug: req.params.id.toLowerCase() }).lean()
    }
    if (!company) return res.status(404).json({ message: 'Company not found' })
    
    // Ban/active check — banned companies show limited public info
    if (!company.isActive) {
      return res.json({
        company: {
          _id: company._id,
          name: company.name,
          isActive: false,
          bannedAt: company.bannedAt,
          banReason: company.banReason,
        },
        jobs: [],
        internships: [],
        reviewStats: { avgRating: 0, count: 0 },
      })
    }

    const [jobs, internships, reviewStats] = await Promise.all([
      Job.find({ company: req.params.id, status: 'approved' })
        .select('title location mode employmentType salaryMin salaryMax createdAt deadline status')
        .sort('-createdAt')
        .limit(20)
        .lean(),
      Internship.find({ company: req.params.id, status: 'approved' })
        .select('title location mode stipend duration startDate createdAt deadline status')
        .sort('-createdAt')
        .limit(20)
        .lean(),
      CompanyReview.aggregate([
        { $match: { company: company._id, status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]),
    ])

    const stats = reviewStats[0] || { avgRating: 0, count: 0 }

    const activeTeamMembers = (company.teamMembers || []).filter(m => m.role !== 'viewer').length

    res.json({
      company: {
        _id: company._id,
        name: company.name,
        email: company.companyEmailDomain,
        website: company.website,
        location: company.location,
        officeLocations: company.officeLocations,
        size: company.size,
        industry: company.industry,
        description: company.description,
        logoUrl: company.logoUrl,
        bannerUrl: company.bannerUrl,
        coverUrl: company.bannerUrl, // alias for frontend compatibility
        linkedin: company.linkedin,
        twitter: company.twitter,
        isVerified: company.isVerified,
        likelyVerified: company.likelyVerified,
        foundedYear: company.foundedYear,
        hqLocation: company.hqLocation,
        isProfileComplete: company.isProfileComplete,
        profileCompletionPercent: company.profileCompletionPercent,
        signupStep: company.signupStep,
        contactPerson: company.contactPerson,
        designation: company.designation,
        companyEmailDomain: company.companyEmailDomain,
        domainVerified: company.domainVerified,
        regNumber: company.regNumber ? true : false,
        regStatus: company.regStatus, // no number exposed
        teamMemberCount: activeTeamMembers,
        isActive: company.isActive,
        culture: company.culture,
        photos: company.photos,
        perks: company.perks,
        feeComplaintCount: company.feeComplaintCount,
        profileViews: company.profileViews,
        totalHires: company.totalHires,
        avgResponseTime: company.avgResponseTime,
        slug: company.slug,
        createdAt: company.createdAt,
      },
      jobs,
      internships,
      reviewStats: { avgRating: Math.round(stats.avgRating * 10) / 10, count: stats.count },
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// Resolve company — owner by `user` field or team member by `companyId` on User
async function resolveCompany(req, res, next) {
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

// ─── Role-based permission system ────────────────────────────────────────────
// Owner  = req.company.user
// Others = req.company.teamMembers
function getUserRole(company, userId) {
  if (String(company.user) === String(userId)) return 'owner'
  const member = company.teamMembers.find(m => String(m.user) === String(userId))
  return member?.role || null
}

const PERMISSIONS = {
  owner:       ['manage_team', 'post_jobs', 'edit_all_jobs', 'edit_own_jobs', 'view_all_applicants', 'view_own_applicants', 'view_assigned_applicants', 'manage_pipeline', 'schedule_interviews', 'give_feedback', 'view_analytics', 'edit_company_profile', 'send_messages', 'view_messages', 'delete_company'],
  admin:       ['post_jobs', 'edit_all_jobs', 'view_all_applicants', 'manage_pipeline', 'schedule_interviews', 'give_feedback', 'view_analytics', 'edit_company_profile', 'send_messages', 'view_messages'],
  recruiter:   ['post_jobs', 'edit_own_jobs', 'view_own_applicants', 'manage_pipeline', 'send_messages', 'view_messages'],
  interviewer: ['view_assigned_applicants', 'schedule_interviews', 'give_feedback', 'send_messages', 'view_messages'],
  viewer:      ['view_all_applicants', 'view_analytics', 'view_messages'],
}

function checkPermission(...permissions) {
  return (req, res, next) => {
    const role = getUserRole(req.company, req.user._id)
    if (!role) return res.status(403).json({ message: 'You are not a member of this company' })
    const has = permissions.some(p => PERMISSIONS[role]?.includes(p))
    if (!has) {
      return res.status(403).json({ message: `Access denied. Your role (${role}) cannot perform this action` })
    }
    next()
  }
}

router.use(protect, restrictTo('company'))
router.use(resolveCompany)

// ─── Profile ────────────────────────────────────────────────────────────────

router.get('/profile', async (req, res) => {
  try {
    res.json({ company: req.company })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/profile', checkPermission('edit_company_profile'), async (req, res) => {
  try {
    sanitizeFields(req.body, ['name', 'description', 'website', 'location', 'industry', 'size'])
    Object.assign(req.company, req.body)
    await req.company.save()
    res.json({ company: req.company })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/logo', checkPermission('edit_company_profile'), (req, res) => {
  uploadLogo(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })
    const logoUrl = getFileUrl(req, 'logos')
    const old = req.company.logoUrl
    await deleteOldAsset(old)
    req.company.logoUrl = logoUrl
    await req.company.save()
    res.json({ logoUrl })
  })
})

router.post('/documents/upload', checkPermission('edit_company_profile'), (req, res) => {
  uploadDocument(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })
    const fileUrl = getFileUrl(req, 'documents')
    const { name } = req.body
    req.company.documents.push({ name: name || req.file.originalname, url: fileUrl })
    await req.company.save()
    res.json({ documents: req.company.documents })
  })
})

router.delete('/documents/:docId', checkPermission('edit_company_profile'), async (req, res) => {
  try {
    req.company.documents = req.company.documents.filter(d => String(d._id) !== req.params.docId)
    await req.company.save()
    res.json({ documents: req.company.documents })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Step 2 — Complete Company Profile ────────────────────────────────────
router.post('/step2', async (req, res) => {
  try {
    const { industry, size, foundedYear, website, hqLocation, description, linkedin } = req.body
    if (!industry || !size || !foundedYear || !website || !hqLocation || !description) {
      return res.status(400).json({ message: 'All required fields must be filled: industry, size, foundedYear, website, hqLocation, description' })
    }

    // Auto domain check — compare email domain with website domain
    const emailDomain = req.company.companyEmailDomain || ''
    let domainVerified = false
    if (website && emailDomain) {
      try {
        const websiteDomain = new URL(website).hostname.replace(/^www\./, '').toLowerCase()
        domainVerified = websiteDomain === emailDomain
      } catch {}
    }

    Object.assign(req.company, {
      industry, size, foundedYear, website,
      hqLocation, description, linkedin,
      domainVerified,
      likelyVerified: domainVerified,
      signupStep: 2,
      isProfileComplete: true,
    })
    await req.company.save()
    res.json({ company: req.company, message: 'Profile completed! You can now post jobs.' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Step 3 — Upload Verification Docs ────────────────────────────────────
router.post('/step3/upload-certificate', (req, res, next) => {
  uploadDocument(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })
    try {
      const fileUrl = getFileUrl(req, 'documents')
      req.company.regCertificate = fileUrl
      req.company.signupStep = 3
      await req.company.save()
      res.json({ regCertificate: fileUrl, company: req.company })
    } catch (err) { res.status(500).json({ message: err.message }) }
  })
})

router.post('/step3/upload-idproof', (req, res, next) => {
  uploadDocument(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })
    try {
      const fileUrl = getFileUrl(req, 'documents')
      req.company.idProof = fileUrl
      req.company.signupStep = 3
      await req.company.save()
      res.json({ idProof: fileUrl, company: req.company })
    } catch (err) { res.status(500).json({ message: err.message }) }
  })
})

router.post('/step3', async (req, res) => {
  try {
    const { regNumber } = req.body
    if (!regNumber) return res.status(400).json({ message: 'Business registration number is required' })

    // Duplicate check — registration number
    const existing = await Company.findOne({ regNumber: regNumber.toUpperCase() })
    if (existing && String(existing._id) !== String(req.company._id)) {
      return res.status(400).json({ message: 'This registration number is already linked to another company.' })
    }

    req.company.regNumber = regNumber.toUpperCase()
    req.company.signupStep = 3
    await req.company.save()

    // Also push to verification documents for admin queue
    if (req.company.regCertificate) {
      const alreadyExists = req.company.documents.some(d => d.name === 'Registration Certificate')
      if (!alreadyExists) {
        req.company.documents.push({
          name: 'Registration Certificate',
          url: req.company.regCertificate,
        })
        await req.company.save()
      }
    }

    res.json({ company: req.company, message: 'Verification docs submitted for review.' })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'This registration number is already in use.' })
    }
    res.status(500).json({ message: err.message }) }
})

// ─── Team Members (owner-only) ────────────────────────────────────────────

router.get('/team', async (req, res) => {
  try {
    const company = await Company.findById(req.company._id).populate('teamMembers.user', 'name email')
    res.json({ team: company?.teamMembers || [] })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/team/invite', async (req, res) => {
  try {
    if (String(req.company.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the company owner can manage team members' })
    }
    const { email, role } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) return res.status(404).json({ message: 'No user found with this email' })
    if (user.role !== 'company') return res.status(400).json({ message: 'User must have a company account' })

    const alreadyMember = req.company.teamMembers.some(m => String(m.user) === String(user._id))
    if (alreadyMember) return res.status(400).json({ message: 'User is already a team member' })
    if (String(user._id) === String(req.company.user)) {
      return res.status(400).json({ message: 'You cannot add yourself as a team member' })
    }

    user.companyId = req.company._id
    await user.save()

    req.company.teamMembers.push({ user: user._id, role: role || 'recruiter' })
    await req.company.save()

    try {
      const { subject, html } = teamInviteEmail(user.name, req.company.name, req.user.name, role || 'recruiter', `${process.env.FRONTEND_URL || ''}/company`)
      await sendEmail({ to: user.email, subject, html })
    } catch (emailErr) {
      console.error('Failed to send team invite email:', emailErr.message)
    }

    const populated = await Company.populate(req.company, { path: 'teamMembers.user', select: 'name email' })
    res.status(201).json({ team: populated.teamMembers })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/team/:userId', async (req, res) => {
  try {
    if (String(req.company.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the company owner can manage team members' })
    }
    const memberIdx = req.company.teamMembers.findIndex(m => String(m.user) === String(req.params.userId))
    if (memberIdx === -1) return res.status(404).json({ message: 'Team member not found' })

    const memberUser = await User.findById(req.params.userId)
    if (memberUser) {
      memberUser.companyId = undefined
      await memberUser.save()
    }

    req.company.teamMembers.splice(memberIdx, 1)
    await req.company.save()

    res.json({ team: req.company.teamMembers })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/team/:userId/role', async (req, res) => {
  try {
    if (String(req.company.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'Only the company owner can manage team members' })
    }
    const { role } = req.body
    if (!['admin', 'recruiter', 'viewer'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' })
    }

    const member = req.company.teamMembers.find(m => String(m.user) === String(req.params.userId))
    if (!member) return res.status(404).json({ message: 'Team member not found' })

    member.role = role
    await req.company.save()

    const populated = await Company.populate(req.company, { path: 'teamMembers.user', select: 'name email' })
    res.json({ team: populated.teamMembers })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Dashboard Stats ────────────────────────────────────────────────────────

router.get('/dashboard', async (req, res) => {
  try {
    const [internships, jobs] = await Promise.all([
      Internship.find({ company: req.company._id }),
      Job.find({ company: req.company._id })
    ])
    const allPostingIds = [
      ...internships.map(i => i._id),
      ...jobs.map(j => j._id)
    ]

    const [appCounts, totalApplicants, shortlisted, interviews, offered, hired, totalViews] = await Promise.all([
      Application.aggregate([
        { $match: { posting: { $in: allPostingIds } } },
        { $group: { _id: '$posting', count: { $sum: 1 } } }
      ]),
      Application.countDocuments({ posting: { $in: allPostingIds } }),
      Application.countDocuments({ posting: { $in: allPostingIds }, status: 'Shortlisted' }),
      Application.countDocuments({ posting: { $in: allPostingIds }, status: 'Interview Scheduled' }),
      Application.countDocuments({ posting: { $in: allPostingIds }, status: 'Offered' }),
      Application.countDocuments({ posting: { $in: allPostingIds }, status: 'Hired' }),
      Internship.aggregate([{ $match: { company: req.company._id } }, { $group: { _id: null, total: { $sum: '$views' } } }])
        .then(r => r[0]?.total || 0)
        .then(async (v) => {
          const jv = await Job.aggregate([{ $match: { company: req.company._id } }, { $group: { _id: null, total: { $sum: '$views' } } }])
          return v + (jv[0]?.total || 0)
        }),
    ])

    const countMap = new Map(appCounts.map(a => [String(a._id), a.count]))
    const internshipsWithCount = internships.map(i => ({ ...i.toObject(), applicantsCount: countMap.get(String(i._id)) || 0 }))
    const jobsWithCount = jobs.map(j => ({ ...j.toObject(), applicantsCount: countMap.get(String(j._id)) || 0 }))

    res.json({
      stats: {
        activePostings: internships.filter(i => i.status === 'approved').length + jobs.filter(j => j.status === 'approved').length,
        totalApplicants, shortlisted, interviews, offered, hired,
        totalViews, newApplicants: shortlisted,
      },
      internships: internshipsWithCount,
      jobs: jobsWithCount
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Postings Management ───────────────────────────────────────────────────

router.get('/postings', async (req, res) => {
  try {
    const [internships, jobs] = await Promise.all([
      Internship.find({ company: req.company._id }).sort('-createdAt'),
      Job.find({ company: req.company._id }).sort('-createdAt')
    ])
    const allIds = [...internships.map(i => i._id), ...jobs.map(j => j._id)]
    const counts = await Application.aggregate([
      { $match: { posting: { $in: allIds } } },
      { $group: { _id: '$posting', count: { $sum: 1 } } }
    ])
    const cm = new Map(counts.map(a => [String(a._id), a.count]))
    res.json({
      internships: internships.map(i => ({ ...i.toObject(), applicantsCount: cm.get(String(i._id)) || 0, kind: 'internship' })),
      jobs: jobs.map(j => ({ ...j.toObject(), applicantsCount: cm.get(String(j._id)) || 0, kind: 'job' }))
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

function postingBelongsToCompany(model) {
  return async (req, res, next) => {
    const Model = req.params.kind === 'job' ? Job : Internship
    const doc = await Model.findById(req.params.id).select('company')
    if (!doc) return res.status(404).json({ message: 'Not found' })
    if (String(doc.company) !== String(req.company._id)) {
      return res.status(403).json({ message: 'This posting does not belong to your company' })
    }
    req.postingDoc = doc
    next()
  }
}

router.post('/posting/:kind/:id/duplicate', checkPermission('post_jobs'), postingBelongsToCompany(), async (req, res) => {
  try {
    const Model = req.params.kind === 'job' ? Job : Internship
    const original = await Model.findById(req.params.id)
    if (!original) return res.status(404).json({ message: 'Not found' })
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

router.patch('/posting/:kind/:id/boost', checkPermission('edit_all_jobs'), postingBelongsToCompany(), async (req, res) => {
  try {
    const Model = req.params.kind === 'job' ? Job : Internship
    const posting = await Model.findById(req.params.id)
    if (!posting) return res.status(404).json({ message: 'Not found' })
    posting.isBoosted = !posting.isBoosted
    await posting.save()
    res.json({ posting })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/posting/:kind/:id/status', checkPermission('manage_pipeline'), postingBelongsToCompany(), async (req, res) => {
  try {
    const Model = req.params.kind === 'job' ? Job : Internship
    const posting = await Model.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true })
    res.json({ posting })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Applicants ─────────────────────────────────────────────────────────────

router.get('/applicants/:postingId', checkPermission('view_all_applicants', 'view_own_applicants', 'view_assigned_applicants'), async (req, res) => {
  try {
    const apps = await Application.find({ posting: req.params.postingId })
      .populate('applicant', 'name email')
      .sort('-createdAt')

    const applicantIds = apps.map((a) => a.applicant?._id).filter(Boolean)
    const profiles = await StudentProfile.find({ user: { $in: applicantIds } })
    const profileByUser = new Map(profiles.map((p) => [String(p.user), p]))

    const enriched = apps.map((a) => {
      const profile = a.applicant ? profileByUser.get(String(a.applicant._id)) : null
      return {
        ...a.toObject(),
        applicant: a.applicant && {
          ...a.applicant.toObject(),
          college: profile?.college,
          cgpa: profile?.cgpa,
          skills: profile?.skills || [],
        },
      }
    })

    res.json({ applications: enriched })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/applications/:appId/status', checkPermission('manage_pipeline'), async (req, res) => {
  try {
    const { status } = req.body
    const existing = await Application.findById(req.params.appId)
    if (!existing) return res.status(404).json({ message: 'Application not found' })

    const previousStatus = existing.status

    const lastEntry = existing.statusHistory?.[existing.statusHistory.length - 1]
    const update = lastEntry?.status === status
      ? { status }
      : { status, $push: { statusHistory: { status, date: new Date() } } }

    const app = await Application.findByIdAndUpdate(req.params.appId, update, { new: true })
      .populate('applicant', 'name email')
      .populate('posting', 'title')

    const io = req.app.get('io')
    if (io) {
      await io.sendNotification(app.applicant._id, {
        title: `Application ${status}`,
        message: `Your application for ${app.posting.title} is now: ${status}`,
        icon: '📋',
      })
      io.sendApplicationUpdate(String(app.applicant._id), {
        status, title: app.posting.title, company: req.user.name,
      })
    }

    // System message for status change
    if (previousStatus !== status) {
      const conv = await Conversation.findOne({ application: req.params.appId })
      if (conv) {
        const systemMessage = await Message.create({
          conversation: conv._id,
          sender: req.user._id,
          senderRole: 'system',
          messageType: 'system',
          text: `Application status changed from ${previousStatus} to ${status}`,
          systemAction: 'status_change',
          systemData: { status, previousStatus },
        })
        const populated = await Message.findById(systemMessage._id).populate('sender', 'name email role')
        if (io) {
          io.sendMessage(String(conv._id), populated.toObject())
        }
      }
    }

    try {
      await sendEmail({
        to: app.applicant.email,
        ...applicationStatusEmail(app.applicant.name, app.posting.title, req.company?.name || 'Company', status)
      })
    } catch (e) { /* email optional */ }

    res.json({ application: app })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/applications/:appId/interview', checkPermission('schedule_interviews'), async (req, res) => {
  try {
    const { interviewDate, interviewLink } = req.body
    const app = await Application.findByIdAndUpdate(
      req.params.appId,
      {
        status: 'Interview Scheduled',
        interviewDate, interviewLink,
        $push: { statusHistory: { status: 'Interview Scheduled', date: new Date() } },
      },
      { new: true }
    ).populate('applicant', 'name email').populate('posting', 'title')

    const io = req.app.get('io')
    if (io) {
      await io.sendNotification(app.applicant._id, {
        title: 'Interview Scheduled!',
        message: `Interview for ${app.posting.title} on ${new Date(interviewDate).toLocaleString()}`,
        icon: '📅', link: interviewLink,
      })
    }

    // System message for interview scheduling
    const conv = await Conversation.findOne({ application: req.params.appId })
    if (conv) {
      const systemMessage = await Message.create({
        conversation: conv._id,
        sender: req.user._id,
        senderRole: 'system',
        messageType: 'system',
        text: 'Interview has been scheduled',
        systemAction: 'interview_scheduled',
        systemData: { interviewDate, interviewLink },
      })
      const populated = await Message.findById(systemMessage._id).populate('sender', 'name email role')
      if (io) {
        io.sendMessage(String(conv._id), populated.toObject())
      }
    }

    res.json({ application: app })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/applications/:appId/resume', async (req, res) => {
  try {
    const app = await Application.findById(req.params.appId)
    if (!app?.resumeUrl) return res.status(404).json({ message: 'No resume' })
    if (app.resumeUrl.startsWith('http')) {
      return res.redirect(app.resumeUrl)
    }
    const filePath = path.join(__dirname, '../../', app.resumeUrl)
    res.download(filePath)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/applications/bulk-status', async (req, res) => {
  try {
    const { applicationIds, status } = req.body
    if (!Array.isArray(applicationIds) || !status) {
      return res.status(400).json({ message: 'applicationIds[] and status required' })
    }
    const result = await Application.updateMany(
      { _id: { $in: applicationIds } },
      { status, $push: { statusHistory: { status, date: new Date() } } }
    )
    res.json({ modifiedCount: result.modifiedCount })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Pipeline (Kanban) ─────────────────────────────────────────────────────

router.get('/pipeline/:postingId', async (req, res) => {
  try {
    const apps = await Application.find({ posting: req.params.postingId })
      .populate('applicant', 'name email')
      .sort('-createdAt')

    const applicantIds = apps.map((a) => a.applicant?._id).filter(Boolean)
    const profiles = await StudentProfile.find({ user: { $in: applicantIds } })
    const profileByUser = new Map(profiles.map((p) => [String(p.user), p]))

    const enriched = apps.map((a) => {
      const profile = a.applicant ? profileByUser.get(String(a.applicant._id)) : null
      return {
        ...a.toObject(),
        applicant: a.applicant && {
          ...a.applicant.toObject(),
          college: profile?.college,
          cgpa: profile?.cgpa,
          skills: profile?.skills || [],
        },
      }
    })

    const stages = ['Applied', 'Under Review', 'Shortlisted', 'Interview Scheduled', 'Offered', 'Hired', 'Rejected']
    const pipeline = stages.map(stage => ({
      stage,
      applications: enriched.filter(a => a.status === stage),
    }))

    res.json({ pipeline })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Profile Views Tracking ──────────────────────────────────────────────────

router.post('/:id/view', async (req, res) => {
  try {
    const company = await Company.findById(req.params.id)
    if (!company) return res.status(404).json({ message: 'Company not found' })
    
    // Don't track views from company owners
    if (req.user && String(company.user) === String(req.user._id)) {
      return res.json({ views: company.profileViews })
    }
    
    company.profileViews = (company.profileViews || 0) + 1
    await company.save()
    res.json({ views: company.profileViews })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Analytics ──────────────────────────────────────────────────────────────

router.get('/analytics', checkPermission('view_analytics'), async (req, res) => {
  try {
    const [internships, jobs] = await Promise.all([
      Internship.find({ company: req.company._id }),
      Job.find({ company: req.company._id })
    ])
    const allPostingIds = [...internships.map(i => i._id), ...jobs.map(j => j._id)]

    const postings = [
      ...internships.map(i => ({ ...i.toObject(), kind: 'internship' })),
      ...jobs.map(j => ({ ...j.toObject(), kind: 'job' })),
    ]

    const totalApps = await Application.countDocuments({ posting: { $in: allPostingIds } })
    const hired = await Application.countDocuments({ posting: { $in: allPostingIds }, status: 'Hired' })
    const totalViews = postings.reduce((s, p) => s + (p.views || 0), 0)
    const conversionRate = totalApps > 0 ? ((hired / totalApps) * 100).toFixed(1) : '0.0'

    // Time-to-hire: average days from Applied -> Hired
    const hiredApps = await Application.find({ posting: { $in: allPostingIds }, status: 'Hired' }).populate('posting', 'title')
    let totalDays = 0
    hiredApps.forEach(a => {
      const applied = a.statusHistory?.find(s => s.status === 'Applied')?.date || a.createdAt
      const hiredDate = a.statusHistory?.find(s => s.status === 'Hired')?.date
      if (applied && hiredDate) totalDays += Math.round((new Date(hiredDate) - new Date(applied)) / 86400000)
    })
    const avgTimeToHire = hiredApps.length > 0 ? Math.round(totalDays / hiredApps.length) : 0

    // Per-posting breakdown
    const postingAnalytics = await Promise.all(postings.map(async (p) => {
      const apps = await Application.find({ posting: p._id })
      return {
        _id: p._id, title: p.title, kind: p.kind, status: p.status,
        views: p.views || 0, applicants: apps.length,
        shortlisted: apps.filter(a => a.status === 'Shortlisted' || a.status === 'Interview Scheduled' || a.status === 'Offered' || a.status === 'Hired').length,
        hired: apps.filter(a => a.status === 'Hired').length,
        conversion: apps.length > 0 ? ((apps.filter(a => a.status === 'Hired').length / apps.length) * 100).toFixed(1) : '0.0',
      }
    }))

    res.json({
      totalViews, totalApplicants: totalApps, hired, conversionRate, avgTimeToHire,
      postings: postingAnalytics,
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Chat / Messages ───────────────────────────────────────────────────────

const RED_FLAG_PHRASES = [
  'processing fee', 'pay to register', 'bank details', 'deposit',
  'registration fee', 'security deposit', 'joining fee',
]

function scanRedFlags(text) {
  if (!text) return []
  const lower = text.toLowerCase()
  return RED_FLAG_PHRASES.filter((phrase) => lower.includes(phrase))
}

async function notifyViaEmailIfOffline(io, recipientId, senderName, conversationId) {
  try {
    const status = io.getOnlineStatus(String(recipientId))
    if (status.online) return

    const recipient = await User.findById(recipientId).select('name email role')
    if (!recipient?.email) return

    if (recipient.role === 'student') {
      const profile = await StudentProfile.findOne({ user: recipientId }).select('settings')
      const digest = profile?.settings?.messageDigest || 'instant'
      if (digest !== 'instant') return
    }

    const path = recipient.role === 'student' ? '/dashboard/messages' : `/${recipient.role}/messages`
    const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/#${path}`
    const content = newMessageEmail(recipient.name, senderName, link)
    await sendEmail({ to: recipient.email, ...content })
  } catch {} // silently fail — email is best-effort
}

// GET /api/company/conversations
router.get('/conversations', checkPermission('view_messages'), async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name email role')
      .populate('posting', 'title')
      .populate('application', 'status')
      .sort('-lastMessageAt -updatedAt')

    const io = req.app.get('io')
    const seenKeys = new Set()
    const enriched = []
    for (const conv of conversations) {
      if (!conv.lastMessage || !conv.lastMessage.trim()) continue
      const other = conv.participants.find((p) => String(p._id) !== String(req.user._id))
      if (!other) continue
      const key = conv.posting
        ? `posting_${conv.posting._id || conv.posting}_${other._id}`
        : `direct_${other._id}`
      if (seenKeys.has(key)) continue
      seenKeys.add(key)

      const obj = conv.toObject()
      if (io) {
        obj.onlineStatus = io.getOnlineStatus(String(other._id))
      }
      obj.unreadCount = conv.unreadCount?.get(String(req.user._id)) || 0
      enriched.push(obj)
    }

    res.json({ conversations: enriched })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/company/conversations/:convId/messages
router.get('/conversations/:convId/messages', checkPermission('view_messages'), async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
    const skip = (page - 1) * limit

    const [messages, total] = await Promise.all([
      Message.find({ conversation: req.params.convId })
        .populate('sender', 'name email role')
        .sort('createdAt')
        .skip(skip)
        .limit(limit),
      Message.countDocuments({ conversation: req.params.convId }),
    ])

    await Message.updateMany(
      { conversation: req.params.convId, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    )

    conv.unreadCount.set(String(req.user._id), 0)
    await conv.save()

    const io = req.app.get('io')
    if (io) {
      io.sendUnreadUpdate(String(req.user._id), String(req.params.convId), 0)
    }

    res.json({ messages, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/company/conversations/:convId/search
router.get('/conversations/:convId/search', checkPermission('view_messages'), async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    const q = req.query.q?.trim()
    if (!q) return res.json({ messages: [], total: 0 })

    const messages = await Message.find({
      conversation: req.params.convId,
      messageType: { $ne: 'system' },
      $or: [
        { text: { $regex: q, $options: 'i' } },
        { 'attachments.name': { $regex: q, $options: 'i' } },
      ],
    })
      .populate('sender', 'name email role')
      .sort('-createdAt')
      .limit(50)

    res.json({ messages, total: messages.length })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/company/conversations/:userId/message
router.post('/conversations/:userId/message', checkPermission('send_messages'), async (req, res) => {
  try {
    const studentUserId = req.params.userId
    const { text, postingId, applicationId } = req.body
    if (!text?.trim()) return res.status(400).json({ message: 'Message text is required' })

    // Check blocks
    const studentProfile = await StudentProfile.findOne({ user: studentUserId }).select('blockedUsers')
    const companyBlocked = req.company.blockedUsers?.some((id) => String(id) === String(studentUserId))
    const studentBlocked = studentProfile?.blockedUsers?.some((id) => String(id) === String(req.user._id))
    if (studentBlocked || companyBlocked) {
      return res.status(403).json({ message: 'Unable to send message' })
    }

    // Find or create conversation
    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, studentUserId], $size: 2 },
    })

    if (!conv) {
      conv = await Conversation.create({
        participants: [req.user._id, studentUserId],
        posting: postingId || undefined,
        postingModel: postingId ? (applicationId ? undefined : 'Job') : undefined,
        application: applicationId || undefined,
        initiatedBy: 'recruiter',
        status: 'active',
      })
    }

    const redFlagReasons = scanRedFlags(text)

    const message = await Message.create({
      conversation: conv._id,
      sender: req.user._id,
      senderRole: 'company',
      messageType: 'text',
      text: text.trim(),
      redFlagged: redFlagReasons.length > 0,
      redFlagReasons: redFlagReasons.length > 0 ? redFlagReasons : undefined,
    })

    conv.lastMessage = text.trim()
    conv.lastSender = req.user._id
    conv.lastMessageAt = new Date()
    const currentUnread = conv.unreadCount.get(String(studentUserId)) || 0
    conv.unreadCount.set(String(studentUserId), currentUnread + 1)
    await conv.save()

    const populated = await Message.findById(message._id).populate('sender', 'name email role')

    const io = req.app.get('io')
    if (io) {
      io.sendMessage(String(conv._id), populated.toObject())
      const unread = conv.unreadCount.get(String(studentUserId)) || 0
      io.sendUnreadUpdate(String(studentUserId), String(conv._id), unread)
      io.sendNotification(String(studentUserId), {
        title: 'New Message',
        message: `${req.user.name} sent you a message`,
        icon: '💬',
        link: `/dashboard/messages/${conv._id}`,
      })
      notifyViaEmailIfOffline(io, studentUserId, req.user.name, conv._id)
    }

    res.status(201).json({ message: populated, conversation: conv })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/company/conversations/direct — Start or find a direct conversation
router.post('/conversations/direct', checkPermission('send_messages'), async (req, res) => {
  try {
    const { userId } = req.body
    if (!userId) return res.status(400).json({ message: 'userId is required' })
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' })
    }

    const StudentProfile = require('../models/StudentProfile')
    const studentProfile = await StudentProfile.findOne({ user: userId }).select('blockedUsers')
    const companyBlocked = req.company.blockedUsers?.some((id) => String(id) === String(userId))
    const studentBlocked = studentProfile?.blockedUsers?.some((id) => String(id) === String(req.user._id))
    if (studentBlocked || companyBlocked) {
      return res.status(403).json({ message: 'Unable to start conversation' })
    }

    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
      $or: [{ posting: { $exists: false } }, { posting: null }],
    })
      .sort('-lastMessageAt -updatedAt')
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
      initiatedBy: 'recruiter',
      status: 'active',
    })

    conv = await Conversation.findById(conv._id).populate('participants', 'name email role')
    const obj = conv.toObject()
    const io = req.app.get('io')
    if (io) obj.onlineStatus = io.getOnlineStatus(String(userId))
    obj.unreadCount = 0
    obj.participant = obj.participants.find(p => String(p._id) !== String(req.user._id))

    res.status(201).json({ conversation: obj })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/company/conversations/:convId/messages
router.post('/conversations/:convId/messages', checkPermission('send_messages'), async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })
    if (conv.status === 'blocked') return res.status(403).json({ message: 'Conversation is blocked' })

    const { text, attachments } = req.body
    if (!text?.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message text or attachment required' })
    }

    const redFlagReasons = scanRedFlags(text)
    const messageType = attachments?.length > 0 ? 'file' : 'text'

    const message = await Message.create({
      conversation: req.params.convId,
      sender: req.user._id,
      senderRole: 'company',
      messageType,
      text: text?.trim(),
      attachments: attachments || [],
      redFlagged: redFlagReasons.length > 0,
      redFlagReasons: redFlagReasons.length > 0 ? redFlagReasons : undefined,
    })

    conv.lastMessage = text?.trim() || (attachments?.[0]?.name || 'Sent a file')
    conv.lastSender = req.user._id
    conv.lastMessageAt = new Date()
    conv.participants.forEach((pId) => {
      if (String(pId) !== String(req.user._id)) {
        const current = conv.unreadCount.get(String(pId)) || 0
        conv.unreadCount.set(String(pId), current + 1)
      }
    })
    await conv.save()

    const populated = await Message.findById(message._id).populate('sender', 'name email role')

    const io = req.app.get('io')
    if (io) {
      io.sendMessage(String(conv._id), populated.toObject())
      const otherId = conv.participants.find(id => String(id) !== String(req.user._id))
      if (otherId) {
        const unread = conv.unreadCount.get(String(otherId)) || 0
        io.sendUnreadUpdate(String(otherId), String(conv._id), unread)
        notifyViaEmailIfOffline(io, String(otherId), req.user.name, conv._id)
      }
    }

    res.status(201).json({ message: populated })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/company/conversations/:convId/read
router.post('/conversations/:convId/read', checkPermission('view_messages'), async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    await Message.updateMany(
      { conversation: req.params.convId, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
      { $addToSet: { readBy: req.user._id } }
    )

    conv.unreadCount.set(String(req.user._id), 0)
    await conv.save()

    const io = req.app.get('io')
    if (io) {
      io.sendUnreadUpdate(String(req.user._id), String(req.params.convId), 0)
    }

    res.json({ message: 'Messages marked as read' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

const { reactToMessage, editMessage, deleteMessage, pinMessage } = require('../controllers/messageActions')
router.post('/conversations/:id/messages/:msgId/react', checkPermission('send_messages'), reactToMessage)
router.patch('/conversations/:id/messages/:msgId', checkPermission('send_messages'), editMessage)
router.delete('/conversations/:id/messages/:msgId', checkPermission('send_messages'), deleteMessage)
router.patch('/conversations/:id/messages/:msgId/pin', checkPermission('send_messages'), pinMessage)

// POST /api/company/conversations/:convId/block
router.post('/conversations/:convId/block', checkPermission('send_messages'), async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    if (conv.blockedBy.some((id) => String(id) === String(req.user._id))) {
      return res.status(400).json({ message: 'Already blocked' })
    }

    conv.blockedBy.push(req.user._id)
    conv.status = 'blocked'
    await conv.save()

    const io = req.app.get('io')
    const otherId = conv.participants.find((p) => String(p) !== String(req.user._id))
    if (io && otherId) {
      io.sendNotification(String(otherId), {
        title: 'Conversation Blocked',
        message: 'The other participant has blocked this conversation',
        icon: '🚫',
      })
    }

    res.json({ message: 'Conversation blocked' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/company/report-conversation
router.post('/report-conversation', async (req, res) => {
  try {
    const { conversationId, reason, description } = req.body
    if (!conversationId || !reason) {
      return res.status(400).json({ message: 'conversationId and reason are required' })
    }

    const conv = await Conversation.findOne({ _id: conversationId, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    const report = await Report.create({
      reporter: req.user._id,
      type: 'message',
      targetId: conversationId,
      reason,
      description,
    })

    const admins = await User.find({ role: 'admin' }).select('_id')
    const io = req.app.get('io')
    if (io && admins.length > 0) {
      admins.forEach((admin) => {
        io.sendNotification(String(admin._id), {
          title: 'Conversation Reported',
          message: `Report: ${reason}`,
          icon: '⚠️',
          link: `/admin/reports/${report._id}`,
        })
      })
    }

    res.status(201).json({ report })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/company/conversations/:convId/online-status
router.get('/conversations/:convId/online-status', checkPermission('view_messages'), async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.convId, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    const otherId = conv.participants.find((p) => String(p) !== String(req.user._id))
    if (!otherId) return res.status(404).json({ message: 'Other participant not found' })

    const io = req.app.get('io')
    const status = io ? io.getOnlineStatus(String(otherId)) : { online: false, lastSeen: null }
    res.json({ userId: otherId, ...status })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/company/canned-replies
router.get('/canned-replies', async (req, res) => {
  try {
    res.json({ cannedReplies: req.company?.cannedReplies || [] })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/company/canned-replies
router.post('/canned-replies', async (req, res) => {
  try {
    const { title, body } = req.body
    if (!title?.trim() || !body?.trim()) {
      return res.status(400).json({ message: 'Title and body are required' })
    }
    req.company.cannedReplies.push({ title: title.trim(), body: body.trim() })
    await req.company.save()
    res.status(201).json({ cannedReplies: req.company.cannedReplies })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/company/canned-replies/:index
router.delete('/canned-replies/:index', async (req, res) => {
  try {
    const index = parseInt(req.params.index)
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ message: 'Invalid index' })
    }
    if (!req.company) return res.status(404).json({ message: 'Company not found' })
    if (index >= req.company.cannedReplies.length) {
      return res.status(404).json({ message: 'Canned reply not found at this index' })
    }
    req.company.cannedReplies.splice(index, 1)
    await req.company.save()
    res.json({ cannedReplies: req.company.cannedReplies })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Notifications ─────────────────────────────────────────────────────────

router.get('/notifications', async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50)
    res.json({ notifications: notifs })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/notifications/:id/read', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Interview Slot Management ──────────────────────────────────────────────

router.get('/interview-slots', checkPermission('schedule_interviews'), async (req, res) => {
  try {
    const { postingId } = req.query
    const filter = { company: req.company._id }
    if (postingId) filter.posting = postingId
    const slots = await InterviewSlot.find(filter).sort('startTime')
    res.json({ slots })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/interview-slots', checkPermission('schedule_interviews'), async (req, res) => {
  try {
    const { postingId, postingModel, startTime, endTime, timezone } = req.body
    if (!postingId || !postingModel || !startTime || !endTime) {
      return res.status(400).json({ message: 'postingId, postingModel, startTime, endTime required' })
    }
    const slot = await InterviewSlot.create({
      company: req.company._id, posting: postingId, postingModel,
      startTime: new Date(startTime), endTime: new Date(endTime),
      timezone: timezone || 'UTC',
      meetLink: `https://meet.google.com/new`,
    })
    res.status(201).json({ slot })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/interview-slots/:id', checkPermission('schedule_interviews'), async (req, res) => {
  try {
    const slot = await InterviewSlot.findOneAndDelete({ _id: req.params.id, company: req.company._id, isBooked: false })
    if (!slot) return res.status(404).json({ message: 'Slot not found or already booked' })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Interview Feedback ────────────────────────────────────────────────────

router.post('/applications/:appId/feedback', checkPermission('give_feedback'), async (req, res) => {
  try {
    const { rating, communication, skills, notes, decision } = req.body
    const existing = await InterviewFeedback.findOne({ application: req.params.appId, interviewer: req.user._id })
    if (existing) return res.status(400).json({ message: 'Feedback already submitted' })
    const feedback = await InterviewFeedback.create({
      application: req.params.appId, interviewer: req.user._id,
      rating, communication, skills, notes, decision,
    })
    const io = req.app.get('io')
    const app = await Application.findById(req.params.appId).populate('applicant', 'name email')
    if (io && app) {
      await io.sendNotification(app.applicant._id, {
        title: 'Interview Feedback Submitted',
        message: `Your interview feedback has been recorded`,
        icon: '📝',
      })
    }
    res.status(201).json({ feedback })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/applications/:appId/feedback', checkPermission('give_feedback'), async (req, res) => {
  try {
    const feedback = await InterviewFeedback.findOne({ application: req.params.appId })
    res.json({ feedback })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Analytics Export ──────────────────────────────────────────────────────

router.get('/analytics/export', async (req, res) => {
  try {
    const [internships, jobs] = await Promise.all([
      Internship.find({ company: req.company._id }),
      Job.find({ company: req.company._id })
    ])
    const allPostingIds = [...internships.map(i => i._id), ...jobs.map(j => j._id)]
    const postings = [
      ...internships.map(i => ({ ...i.toObject(), kind: 'internship' })),
      ...jobs.map(j => ({ ...j.toObject(), kind: 'job' })),
    ]

    const apps = await Application.find({ posting: { $in: allPostingIds } })
      .populate('applicant', 'name email')
      .populate('posting', 'title')

    const rows = [['Posting Title', 'Type', 'Applicant Name', 'Email', 'Status', 'Applied Date', 'Interview Date']]
    apps.forEach(a => {
      rows.push([
        a.posting?.title || '—', a.postingType, a.applicant?.name || '—', a.applicant?.email || '—',
        a.status, a.createdAt?.toISOString() || '', a.interviewDate?.toISOString() || '',
      ])
    })

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${req.company.name?.replace(/\s+/g, '-').toLowerCase() || 'export'}.csv"`)
    res.send(csv)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/company/analytics/export/pdf
router.get('/analytics/export/pdf', async (req, res) => {
  try {
    const { companyReport } = require('../utils/pdfReport')
    const [internships, jobs] = await Promise.all([
      Internship.find({ company: req.company._id }),
      Job.find({ company: req.company._id })
    ])
    const allPostingIds = [...internships.map(i => i._id), ...jobs.map(j => j._id)]
    const postings = [
      ...internships.map(i => ({ ...i.toObject(), kind: 'internship' })),
      ...jobs.map(j => ({ ...j.toObject(), kind: 'job' })),
    ]

    // Compute metrics like the analytics route does
    const totalApps = await Application.countDocuments({ posting: { $in: allPostingIds } })
    const hired = await Application.countDocuments({ posting: { $in: allPostingIds }, status: 'Hired' })
    const totalViews = postings.reduce((s, p) => s + (p.views || 0), 0)
    const conversionRate = totalApps > 0 ? ((hired / totalApps) * 100).toFixed(1) : '0.0'
    const avgTimeToHire = 0

    const postingAnalytics = await Promise.all(postings.map(async (p) => {
      const apps = await Application.find({ posting: p._id })
      return {
        _id: p._id, title: p.title, kind: p.kind, status: p.status,
        views: p.views || 0, applicants: apps.length,
        shortlisted: apps.filter(a => a.status === 'Shortlisted' || a.status === 'Interview Scheduled' || a.status === 'Offered' || a.status === 'Hired').length,
        hired: apps.filter(a => a.status === 'Hired').length,
        conversion: apps.length > 0 ? ((apps.filter(a => a.status === 'Hired').length / apps.length) * 100).toFixed(1) : '0.0',
      }
    }))

    const pdf = await companyReport({
      companyName: req.company?.name || 'Company',
      metrics: { totalViews, totalApplicants: totalApps, conversionRate, avgTimeToHire },
      postings: postingAnalytics,
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="analytics-${req.company.name?.replace(/\s+/g, '-').toLowerCase() || 'export'}.pdf"`)
    res.send(pdf)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Reviews ───────────────────────────────────────────────────────────────
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await CompanyReview.find({ company: req.company._id })
      .populate('user', 'name avatarUrl')
      .sort('-createdAt')
      .lean()
    const stats = await CompanyReview.aggregate([
      { $match: { company: req.company._id } },
      { $group: { _id: null, avgRating: { $avg: '$rating' }, count: { $sum: 1 } } },
    ])
    res.json({
      reviews,
      stats: stats[0] ? { avgRating: Math.round(stats[0].avgRating * 10) / 10, count: stats[0].count } : { avgRating: 0, count: 0 },
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Settings ──────────────────────────────────────────────────────────────
router.get('/settings', async (req, res) => {
  try {
    const company = await Company.findById(req.company._id)
      .select('settings name email')
      .lean()
    const user = await User.findById(req.user._id).select('email emailVerified')
    res.json({
      settings: company?.settings || {},
      companyName: company?.name,
      companyEmail: company?.email,
      userEmail: user?.email,
      emailVerified: user?.emailVerified,
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/settings', async (req, res) => {
  try {
    const company = await Company.findById(req.company._id)
    company.settings = { ...company.settings, ...req.body }
    await company.save()
    res.json({ settings: company.settings, message: 'Settings updated' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Verification Status ───────────────────────────────────────────────────────
router.get('/verification', async (req, res) => {
  try {
    const company = await Company.findById(req.company._id).select('isVerified regStatus documents regCertificate idProof signupStep')
    res.json({ verification: company })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Support Tickets ───────────────────────────────────────────────────────

router.get('/tickets', async (req, res) => {
  try {
    const tickets = await SupportTicket.find({ user: req.user._id }).sort('-createdAt')
    res.json({ tickets })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id })
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    res.json({ ticket })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/tickets', async (req, res) => {
  try {
    const { subject, message, category } = req.body
    if (!subject || !message) return res.status(400).json({ message: 'Subject and message required' })
    const ticket = await SupportTicket.create({
      user: req.user._id, subject, message, category: category || 'other',
      messages: [{ sender: req.user._id, content: message }],
    })
    res.status(201).json({ ticket })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const ticket = await SupportTicket.findOne({ _id: req.params.id, user: req.user._id })
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    if (ticket.status === 'resolved' || ticket.status === 'closed') {
      return res.status(400).json({ message: 'Ticket is already closed' })
    }
    const { content } = req.body
    if (!content?.trim()) return res.status(400).json({ message: 'Content required' })
    ticket.messages.push({ sender: req.user._id, content: content.trim() })
    ticket.status = 'waiting'
    await ticket.save()
    res.json({ ticket })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

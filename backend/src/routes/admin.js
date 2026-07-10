const router = require('express').Router()
const { protect, restrictTo } = require('../middleware/auth')
const { logAudit } = require('../middleware/audit')
const { escapeRegex } = require('../utils/sanitize')
const User = require('../models/User')
const Company = require('../models/Company')
const StudentProfile = require('../models/StudentProfile')
const Internship = require('../models/Internship')
const Job = require('../models/Job')
const Application = require('../models/Application')
const Report = require('../models/Report')
const SupportTicket = require('../models/SupportTicket')
const BillingPlan = require('../models/BillingPlan')
const Invoice = require('../models/Invoice')
const AuditLog = require('../models/AuditLog')
const Announcement = require('../models/Announcement')
const MasterDataItem = require('../models/MasterDataItem')
const Notification = require('../models/Notification')
const CompanyReview = require('../models/CompanyReview')
const AgencyReview = require('../models/AgencyReview')
const Agency = require('../models/Agency')
const Opportunity = require('../models/Opportunity')

router.use(protect, restrictTo('admin'))

/* ─────────────────────────────────────────────
   1. DASHBOARD / OVERVIEW
   ───────────────────────────────────────────── */
router.get('/dashboard', async (req, res) => {
  try {
    const [students, companies, agencies, jobs, internships, opportunities, applications, totalUsers] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'company' }),
      Agency.countDocuments(),
      Job.countDocuments(),
      Internship.countDocuments(),
      require('../models/Opportunity').countDocuments(),
      Application.countDocuments(),
      User.countDocuments(),
    ])

    const totalPostings = jobs + internships
    const totalListings = totalPostings + opportunities
    const hireRate = applications > 0
      ? Math.round((await Application.countDocuments({ status: 'Hired' })) / applications * 100)
      : 0

    // 30-day growth (including agency)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const [prevStudents, prevCompanies, prevAgencies] = await Promise.all([
      User.countDocuments({ role: 'student', createdAt: { $lt: thirtyDaysAgo } }),
      User.countDocuments({ role: 'company', createdAt: { $lt: thirtyDaysAgo } }),
      Agency.countDocuments({ createdAt: { $lt: thirtyDaysAgo } }),
    ])

    // Pending verification counts
    const [pendingCompanies, pendingAgencies] = await Promise.all([
      Company.countDocuments({ regStatus: 'pending' }),
      Agency.countDocuments({ isVerified: false }),
    ])

    // Pending reports
    const pendingReports = await Report.countDocuments({ status: { $in: ['open', 'investigating'] } })

    res.json({
      stats: { students, companies, agencies, jobs, internships, opportunities, applications, totalListings, totalUsers, hireRate },
      pending: { companies: pendingCompanies, agencies: pendingAgencies, reports: pendingReports },
      growth: {
        students: prevStudents ? Math.round((students - prevStudents) / prevStudents * 100) : 100,
        companies: prevCompanies ? Math.round((companies - prevCompanies) / prevCompanies * 100) : 100,
        agencies: prevAgencies ? Math.round((agencies - prevAgencies) / prevAgencies * 100) : 100,
      }
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   2. ANALYTICS
   ───────────────────────────────────────────── */
router.get('/analytics', async (req, res) => {
  try {
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const [signupsRaw, applicationsRaw, topCompaniesRaw] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo }, role: { $in: ['student', 'company'] } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Application.aggregate([
        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]),
      Application.aggregate([
        { $lookup: { from: 'internships', localField: 'posting', foreignField: '_id', as: 'internshipPosting' } },
        { $lookup: { from: 'jobs', localField: 'posting', foreignField: '_id', as: 'jobPosting' } },
        { $addFields: { companyId: { $cond: { if: { $gt: [{ $size: '$internshipPosting' }, 0] }, then: { $arrayElemAt: ['$internshipPosting.company', 0] }, else: { $arrayElemAt: ['$jobPosting.company', 0] } } } } },
        { $match: { companyId: { $ne: null } } },
        { $group: { _id: '$companyId', applications: { $sum: 1 } } },
        { $sort: { applications: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'companies', localField: '_id', foreignField: '_id', as: 'company' } },
        { $unwind: '$company' },
        { $project: { name: '$company.name', applications: 1, _id: 0 } }
      ]),
    ])

    const [internshipSkills, jobSkills] = await Promise.all([
      Internship.aggregate([{ $unwind: '$skills' }, { $group: { _id: '$skills', count: { $sum: 1 } } }]),
      Job.aggregate([{ $unwind: '$skills' }, { $group: { _id: '$skills', count: { $sum: 1 } } }]),
    ])
    const skillMap = {}
    ;[...internshipSkills, ...jobSkills].forEach(s => {
      if (!s._id) return
      const key = s._id.trim()
      skillMap[key] = (skillMap[key] || 0) + s.count
    })
    const popularSkills = Object.entries(skillMap).map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count).slice(0, 8)

    res.json({
      signupsPerDay: signupsRaw.map(d => ({ date: d._id, count: d.count })),
      applicationsPerDay: applicationsRaw.map(d => ({ date: d._id, count: d.count })),
      topCompanies: topCompaniesRaw,
      popularSkills,
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   3. STUDENT / USER MANAGEMENT
   ───────────────────────────────────────────── */
router.get('/students', async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.query
    const filter = { role: 'student' }
    if (search) filter.$or = [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { email: { $regex: escapeRegex(search), $options: 'i' } }
    ]
    const students = await User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
    const total = await User.countDocuments(filter)
    const userIds = students.map(u => u._id)
    const profiles = await StudentProfile.find({ user: { $in: userIds } }).select('user college degree year skills')
    const profileMap = {}
    profiles.forEach(p => { profileMap[String(p.user)] = p })
    const enriched = students.map(u => {
      const obj = u.toObject()
      const p = profileMap[String(u._id)]
      if (p) { obj.college = p.college; obj.degree = p.degree; obj.year = p.year; obj.skills = p.skills }
      return obj
    })
    res.json({ students: enriched, total })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/users/:id/block', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: true }, { new: true })
    await AuditLog.create({ admin: req.user._id, action: 'block_user', target: 'User', targetId: req.params.id })
    res.json({ user })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/users/:id/unblock', async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { isBlocked: false }, { new: true })
    await AuditLog.create({ admin: req.user._id, action: 'unblock_user', target: 'User', targetId: req.params.id })
    res.json({ user })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/users/:id/role', async (req, res) => {
  try {
    const { role } = req.body
    if (!['student', 'company'].includes(role)) return res.status(400).json({ message: 'Invalid role' })
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true })
    await AuditLog.create({ admin: req.user._id, action: 'assign_role', target: 'User', targetId: req.params.id, details: { role } })
    res.json({ user })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   4. COMPANY MANAGEMENT
   ───────────────────────────────────────────── */
router.get('/companies', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, verified } = req.query
    const filter = { role: 'company' }
    if (search) filter.$or = [
      { name: { $regex: escapeRegex(search), $options: 'i' } },
      { email: { $regex: escapeRegex(search), $options: 'i' } }
    ]
    const users = await User.find(filter).sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
    const total = await User.countDocuments(filter)
    const userIds = users.map(u => u._id)
    const profiles = await Company.find({ user: { $in: userIds } }).select('user isVerified name website location size industry description logoUrl')
    const profileMap = {}
    profiles.forEach(p => { profileMap[String(p.user)] = p })
    let companies = users.map(u => {
      const obj = u.toObject()
      const profile = profileMap[String(u._id)]
      obj.isVerified = profile?.isVerified || false
      obj.companyName = profile?.name || u.name
      obj.companyProfile = profile || null
      return obj
    })
    if (verified === 'true') companies = companies.filter(c => c.isVerified)
    if (verified === 'false') companies = companies.filter(c => !c.isVerified)
    res.json({ companies, total })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/companies/:id/verify', async (req, res) => {
  try {
    let company = await Company.findOneAndUpdate({ user: req.params.id }, { isVerified: true }, { new: true })
    if (!company) company = await Company.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true })
    if (!company) return res.status(404).json({ message: 'Company not found' })
    await AuditLog.create({ admin: req.user._id, action: 'verify_company', target: 'Company', targetId: company._id, details: { userId: company.user } })
    res.json({ company })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/companies/:id/unverify', async (req, res) => {
  try {
    let company = await Company.findOneAndUpdate({ user: req.params.id }, { isVerified: false }, { new: true })
    if (!company) company = await Company.findByIdAndUpdate(req.params.id, { isVerified: false }, { new: true })
    if (!company) return res.status(404).json({ message: 'Company not found' })
    await AuditLog.create({ admin: req.user._id, action: 'unverify_company', target: 'Company', targetId: company._id })
    res.json({ company })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/companies/:id/suspend', async (req, res) => {
  try {
    let company = await Company.findById(req.params.id)
    if (!company) company = await Company.findOne({ user: req.params.id })
    if (!company) return res.status(404).json({ message: 'Company not found' })
    const user = await User.findByIdAndUpdate(company.user, { isBlocked: true }, { new: true })
    if (!user) return res.status(404).json({ message: 'Company owner not found' })
    await AuditLog.create({ admin: req.user._id, action: 'block_user', target: 'User', targetId: company.user, details: { companyId: company._id } })
    res.json({ message: 'Company suspended', user })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/companies/:id/profile', async (req, res) => {
  try {
    const allowed = ['name', 'website', 'location', 'size', 'industry', 'description', 'email']
    const updates = {}
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = f === 'name' ? req.body[f] : req.body[f] })
    const company = await Company.findOneAndUpdate({ user: req.params.id }, updates, { new: true })
    if (!company) return res.status(404).json({ message: 'Company profile not found' })
    await AuditLog.create({ admin: req.user._id, action: 'override_company_profile', target: 'Company', targetId: company._id, details: updates })
    res.json({ company })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   5. POSTING MODERATION
   ───────────────────────────────────────────── */
router.get('/internships', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const filter = status ? { status } : {}
    const internships = await Internship.find(filter).populate('company', 'name isVerified').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
    const total = await Internship.countDocuments(filter)
    res.json({ internships, total })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/jobs', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const filter = status ? { status } : {}
    const jobs = await Job.find(filter).populate('company', 'name isVerified').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
    const total = await Job.countDocuments(filter)
    res.json({ jobs, total })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/postings/:id/approve', async (req, res) => {
  try {
    let posting = await Internship.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true })
    let kind = 'Internship'
    if (!posting) { posting = await Job.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true }); kind = 'Job' }
    if (!posting) { posting = await Opportunity.findByIdAndUpdate(req.params.id, { status: 'approved' }, { new: true }); kind = 'Opportunity' }
    if (!posting) return res.status(404).json({ message: 'Not found' })
    await AuditLog.create({ admin: req.user._id, action: 'approve_posting', target: kind, targetId: req.params.id })
    res.json({ posting })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/postings/:id', async (req, res) => {
  try {
    await Internship.findByIdAndDelete(req.params.id)
    await Job.findByIdAndDelete(req.params.id)
    await Opportunity.findByIdAndDelete(req.params.id)
    await AuditLog.create({ admin: req.user._id, action: 'delete_posting', target: 'Posting', targetId: req.params.id })
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   6. REPORTS & COMPLAINTS
   ───────────────────────────────────────────── */
router.get('/reports', async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query
    const filter = status ? { status } : {}
    const reports = await Report.find(filter).populate('reporter', 'name email').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
    const total = await Report.countDocuments(filter)
    res.json({ reports, total })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/reports/:id', async (req, res) => {
  try {
    const report = await Report.findById(req.params.id).populate('reporter', 'name email').populate('resolvedBy', 'name')
    if (!report) return res.status(404).json({ message: 'Report not found' })
    res.json({ report })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/reports/:id/status', async (req, res) => {
  try {
    const { status, resolution } = req.body
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, resolution, resolvedBy: req.user._id, resolvedAt: status === 'resolved' || status === 'dismissed' ? new Date() : undefined },
      { new: true }
    )
    if (!report) return res.status(404).json({ message: 'Report not found' })
    await AuditLog.create({ admin: req.user._id, action: 'update_report_status', target: 'Report', targetId: req.params.id, details: { status } })
    res.json({ report })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/flagged-messages
router.get('/flagged-messages', async (req, res) => {
  try {
    const Message = require('../models/Message')
    const { page = 1, limit = 20 } = req.query
    // Only show unreviewed flagged messages
    const filter = { redFlagged: true, redFlagReviewedBy: { $exists: false } }
    const messages = await Message.find(filter)
      .populate('sender', 'name email')
      .populate('conversation', 'participants')
      .sort('-createdAt')
      .skip((page - 1) * Number(limit))
      .limit(Number(limit))
    const total = await Message.countDocuments(filter)
    res.json({ messages, total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/admin/flagged-messages/:id/review
router.patch('/flagged-messages/:id/review', async (req, res) => {
  try {
    const Message = require('../models/Message')
    const message = await Message.findByIdAndUpdate(
      req.params.id,
      { redFlagReviewedBy: req.user._id },
      { new: true }
    )
    if (!message) return res.status(404).json({ message: 'Message not found' })
    res.json({ message })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   7. SUPPORT TICKETS
   ───────────────────────────────────────────── */
router.get('/tickets', async (req, res) => {
  try {
    const { status, priority, page = 1, limit = 20 } = req.query
    const filter = {}
    if (status) filter.status = status
    if (priority) filter.priority = priority
    const tickets = await SupportTicket.find(filter).populate('user', 'name email role').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
    const total = await SupportTicket.countDocuments(filter)
    res.json({ tickets, total })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/tickets/:id', async (req, res) => {
  try {
    const ticket = await SupportTicket.findById(req.params.id).populate('user', 'name email role').populate('assignedTo', 'name').populate('messages.sender', 'name role')
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    res.json({ ticket })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/tickets/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const update = { status }
    if (status === 'resolved' || status === 'closed') update.resolvedAt = new Date()
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    await AuditLog.create({ admin: req.user._id, action: 'update_ticket_status', target: 'SupportTicket', targetId: req.params.id, details: { status } })
    res.json({ ticket })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/tickets/:id/assign', async (req, res) => {
  try {
    const ticket = await SupportTicket.findByIdAndUpdate(req.params.id, { assignedTo: req.user._id }, { new: true })
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    res.json({ ticket })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/tickets/:id/reply', async (req, res) => {
  try {
    const { content } = req.body
    if (!content) return res.status(400).json({ message: 'Content is required' })
    const ticket = await SupportTicket.findByIdAndUpdate(
      req.params.id,
      { $push: { messages: { sender: req.user._id, content } }, status: 'in_progress' },
      { new: true }
    )
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' })
    res.json({ ticket })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   8. BILLING & PLANS
   ───────────────────────────────────────────── */
router.get('/plans', async (req, res) => {
  try {
    const plans = await BillingPlan.find().sort('price')
    res.json({ plans })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/plans', async (req, res) => {
  try {
    const plan = await BillingPlan.create(req.body)
    await AuditLog.create({ admin: req.user._id, action: 'create_plan', target: 'BillingPlan', details: { name: plan.name } })
    res.status(201).json({ plan })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/plans/:id', async (req, res) => {
  try {
    const plan = await BillingPlan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!plan) return res.status(404).json({ message: 'Plan not found' })
    res.json({ plan })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/plans/:id', async (req, res) => {
  try {
    await BillingPlan.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/invoices', async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = status ? { status } : {}
    const invoices = await Invoice.find(filter).populate('company', 'name').populate('plan', 'name').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
    const total = await Invoice.countDocuments(filter)
    // Revenue stats
    const revenueAgg = await Invoice.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } }
    ])
    const revenue = revenueAgg[0]?.total || 0
    const paidInvoices = revenueAgg[0]?.count || 0
    res.json({ invoices, total, revenue, paidInvoices })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/invoices/:id/status', async (req, res) => {
  try {
    const { status } = req.body
    const update = { status }
    if (status === 'paid') update.paidAt = new Date()
    const invoice = await Invoice.findByIdAndUpdate(req.params.id, update, { new: true })
    if (!invoice) return res.status(404).json({ message: 'Invoice not found' })
    res.json({ invoice })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   9. MASTER DATA
   ───────────────────────────────────────────── */
router.get('/master-data', async (req, res) => {
  try {
    const { type } = req.query
    const filter = type ? { type } : {}
    const items = await MasterDataItem.find(filter).sort('name')
    res.json({ items })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/master-data', async (req, res) => {
  try {
    const { type, name } = req.body
    if (!type || !name) return res.status(400).json({ message: 'type and name required' })
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const item = await MasterDataItem.create({ type, name, slug })
    await AuditLog.create({ admin: req.user._id, action: 'create_master_data', target: 'MasterDataItem', details: { type, name } })
    res.status(201).json({ item })
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ message: 'Item already exists' })
    res.status(500).json({ message: err.message })
  }
})

router.put('/master-data/:id', async (req, res) => {
  try {
    const item = await MasterDataItem.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    if (!item) return res.status(404).json({ message: 'Item not found' })
    res.json({ item })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/master-data/:id', async (req, res) => {
  try {
    await MasterDataItem.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   10. ANNOUNCEMENTS
   ───────────────────────────────────────────── */
router.get('/announcements', async (req, res) => {
  try {
    const announcements = await Announcement.find().populate('createdBy', 'name').sort('-createdAt')
    res.json({ announcements })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/announcements', async (req, res) => {
  try {
    const announcement = await Announcement.create({ ...req.body, createdBy: req.user._id })
    const io = req.app.get('io')
    if (io) {
      const audience = announcement.audience === 'all'
        ? ['student', 'company', 'admin']
        : [announcement.audience === 'students' ? 'student' : announcement.audience === 'companies' ? 'company' : 'admin']
      io.emit('announcement', { announcement, roles: audience })
    }
    await AuditLog.create({ admin: req.user._id, action: 'create_announcement', target: 'Announcement', details: { title: announcement.title } })
    res.status(201).json({ announcement })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/announcements/:id', async (req, res) => {
  try {
    const announcement = await Announcement.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!announcement) return res.status(404).json({ message: 'Announcement not found' })
    res.json({ announcement })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/announcements/:id', async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id)
    res.json({ message: 'Deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   11. AUDIT LOGS
   ───────────────────────────────────────────── */
router.get('/audit-logs', async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query
    const logs = await AuditLog.find().populate('admin', 'name').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit))
    const total = await AuditLog.countDocuments()
    res.json({ logs, total })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   COMPANY + AGENCY VERIFICATION QUEUE
   ───────────────────────────────────────────── */
router.get('/verification-queue', async (req, res) => {
  try {
    const { page = 1, limit = 20, filter, search, entityType = 'company' } = req.query
    const companiesQuery = {}
    const agenciesQuery = {}

    // Company filters
    if (filter === 'pending') companiesQuery.isVerified = false
    if (filter === 'verified') companiesQuery.isVerified = true
    if (search && entityType !== 'agency') {
      companiesQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    // Agency filters
    if (entityType === 'agency' || entityType === 'all') {
      if (filter === 'pending') agenciesQuery.isVerified = false
      if (filter === 'verified') agenciesQuery.isVerified = true
      if (search) {
        agenciesQuery.$or = [
          { agencyName: { $regex: search, $options: 'i' } },
        ]
      }
    }

    // Fetch both based on entityType
    const fetchCompanies = entityType !== 'agency'
    const fetchAgencies = entityType !== 'company'

    const [companies, agencies] = await Promise.all([
      fetchCompanies ? Company.find(companiesQuery).populate('user', 'name email createdAt').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)) : Promise.resolve([]),
      fetchAgencies ? Agency.find(agenciesQuery).populate('user', 'name email createdAt').sort('-createdAt').skip((page - 1) * limit).limit(Number(limit)) : Promise.resolve([]),
    ])

    res.json({
      companies,
      agencies,
      total: fetchCompanies ? await Company.countDocuments(companiesQuery) : 0,
      agenciesTotal: fetchAgencies ? await Agency.countDocuments(agenciesQuery) : 0,
      pendingCount: await Company.countDocuments({ isVerified: false }),
      pendingAgenciesCount: await Agency.countDocuments({ isVerified: false }),
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   REVIEWS MODERATION
   ───────────────────────────────────────────── */
router.get('/reviews', async (req, res) => {
  try {
    const { status, page = 1, limit = 20, type } = req.query
    const filter = status ? { status } : {}

    if (type === 'agency') {
      const reviews = await AgencyReview.find(filter)
        .populate('reviewer', 'name email')
        .populate('agency', 'agencyName')
        .sort('-createdAt')
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .lean()
      const total = await AgencyReview.countDocuments(filter)
      return res.json({ reviews, total, type: 'agency' })
    }

    const reviews = await CompanyReview.find(filter)
      .populate('reviewer', 'name email')
      .populate('company', 'name')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
    const total = await CompanyReview.countDocuments(filter)
    res.json({ reviews, total, type: 'company' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/reviews/:id/status', async (req, res) => {
  try {
    const { status, type } = req.body
    let review
    if (type === 'agency') {
      review = await AgencyReview.findByIdAndUpdate(req.params.id, { status }, { new: true })
    } else {
      review = await CompanyReview.findByIdAndUpdate(req.params.id, { status }, { new: true })
    }
    if (!review) return res.status(404).json({ message: 'Review not found' })
    await AuditLog.create({ admin: req.user._id, action: 'moderate_review', target: type === 'agency' ? 'AgencyReview' : 'CompanyReview', targetId: req.params.id, details: { status } })
    res.json({ review })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   ANALYTICS EXPORT
   ───────────────────────────────────────────── */
router.get('/analytics/export', async (req, res) => {
  try {
    const { kind } = req.query
    let rows = [['Type', 'Title', 'Company', 'Status', 'Applicants', 'Views', 'Created']]

    if (!kind || kind === 'internship') {
      const internships = await Internship.find().populate('company', 'name').sort('-createdAt')
      internships.forEach(i => {
        rows.push(['Internship', i.title, i.company?.name || '—', i.status, i.applicantsCount || 0, i.views || 0, i.createdAt?.toISOString() || ''])
      })
    }
    if (!kind || kind === 'job') {
      const jobs = await Job.find().populate('company', 'name').sort('-createdAt')
      jobs.forEach(j => {
        rows.push(['Job', j.title, j.company?.name || '—', j.status, j.applicantsCount || 0, j.views || 0, j.createdAt?.toISOString() || ''])
      })
    }

    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
    res.setHeader('Content-Type', 'text/csv')
    res.setHeader('Content-Disposition', `attachment; filename="platform-analytics-${new Date().toISOString().slice(0, 10)}.csv"`)
    res.send(csv)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/admin/analytics/export/pdf
router.get('/analytics/export/pdf', async (req, res) => {
  try {
    const { adminReport } = require('../utils/pdfReport')
    const { kind = 'all' } = req.query

    const [signupsPerDay, applicationsPerDay, topCompanies, popularSkills] = await Promise.all([
      // Signups per day (last 30 days)
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', count: 1 } },
      ]),
      // Applications per day (last 30 days)
      Application.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 30 * 86400000) } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, date: '$_id', count: 1 } },
      ]),
      // Top companies
      Application.aggregate([
        { $group: { _id: '$posting', count: { $sum: 1 } } },
        { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
        { $lookup: { from: 'internships', localField: '_id', foreignField: '_id', as: 'internship' } },
        { $lookup: { from: 'companies', localField: { $ifNull: [{ $arrayElemAt: ['$job.company', 0] }, { $arrayElemAt: ['$internship.company', 0] }] }, foreignField: '_id', as: 'company' } },
        { $group: { _id: { $arrayElemAt: ['$company.name', 0] }, applications: { $sum: '$count' } } },
        { $sort: { applications: -1 } },
        { $limit: 10 },
        { $project: { _id: 0, name: '$_id', applications: 1 } },
      ]),
      // Popular skills
      MasterDataItem.aggregate([
        { $match: { type: 'skill', active: true } },
        { $lookup: { from: 'jobs', let: { skill: '$name' }, pipeline: [
          { $match: { $expr: { $in: ['$$skill', '$skills'] } } },
          { $count: 'count' },
        ], as: 'jobCount' } },
        { $lookup: { from: 'internships', let: { skill: '$name' }, pipeline: [
          { $match: { $expr: { $in: ['$$skill', '$skills'] } } },
          { $count: 'count' },
        ], as: 'internshipCount' } },
        { $project: { _id: 0, skill: '$name', count: { $add: [{ $ifNull: [{ $arrayElemAt: ['$jobCount.count', 0] }, 0] }, { $ifNull: [{ $arrayElemAt: ['$internshipCount.count', 0] }, 0] }] } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ])

    const pdf = await adminReport({
      kind,
      signupsPerDay: signupsPerDay || [],
      applicationsPerDay: applicationsPerDay || [],
      topCompanies: topCompanies || [],
      popularSkills: popularSkills || [],
    })

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="platform-analytics-${new Date().toISOString().slice(0, 10)}.pdf"`)
    res.send(pdf)
  } catch (err) { res.status(500).json({ message: err.message }) }
})

/* ─────────────────────────────────────────────
   AGENCY ADMIN
   ───────────────────────────────────────────── */
router.get('/agencies', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query
    const query = {}
    if (search) query.agencyName = { $regex: search, $options: 'i' }
    if (status === 'active') query.isActive = true
    else if (status === 'deactivated') query.isActive = false

    const agencies = await Agency.find(query)
      .populate('user', 'name email createdAt')
      .select('-documents -idProof')
      .sort('-createdAt')
      .skip((page - 1) * limit)
      .limit(Number(limit))
    const total = await Agency.countDocuments(query)
    res.json({ agencies, total })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/agencies/:id/deactivate', async (req, res) => {
  try {
    const agency = await Agency.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true })
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    await AuditLog.create({ admin: req.user._id, action: 'deactivate_agency', target: 'Agency', targetId: req.params.id })
    res.json({ agency })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/agencies/:id/activate', async (req, res) => {
  try {
    const agency = await Agency.findByIdAndUpdate(req.params.id, { isActive: true }, { new: true })
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    await AuditLog.create({ admin: req.user._id, action: 'activate_agency', target: 'Agency', targetId: req.params.id })
    res.json({ agency })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Agency verify/unverify endpoints for verification queue
router.patch('/agencies/:id/verify', async (req, res) => {
  try {
    const agency = await Agency.findByIdAndUpdate(req.params.id, { isVerified: true }, { new: true })
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    await AuditLog.create({ admin: req.user._id, action: 'verify_agency', target: 'Agency', targetId: req.params.id })
    res.json({ agency })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.patch('/agencies/:id/unverify', async (req, res) => {
  try {
    const agency = await Agency.findByIdAndUpdate(req.params.id, { isVerified: false }, { new: true })
    if (!agency) return res.status(404).json({ message: 'Agency not found' })
    await AuditLog.create({ admin: req.user._id, action: 'unverify_agency', target: 'Agency', targetId: req.params.id })
    res.json({ agency })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

module.exports = router

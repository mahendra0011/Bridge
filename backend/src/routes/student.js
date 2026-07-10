const router = require('express').Router()
const axios = require('axios')
const { protect, restrictTo } = require('../middleware/auth')
const { sanitizeFields, escapeRegex } = require('../utils/sanitize')
const { uploadResume, getFileUrl, uploadApplyFiles } = require('../middleware/upload')
const StudentProfile = require('../models/StudentProfile')
const Application = require('../models/Application')
const Notification = require('../models/Notification')
const Message = require('../models/Message')
const Conversation = require('../models/Conversation')
const Job = require('../models/Job')
const Internship = require('../models/Internship')
const User = require('../models/User')
const Report = require('../models/Report')
const Company = require('../models/Company')
const InterviewSlot = require('../models/InterviewSlot')
const CompanyReview = require('../models/CompanyReview')
const SavedSearchAlert = require('../models/SavedSearchAlert')
const SupportTicket = require('../models/SupportTicket')
const { sendEmail, newMessageEmail } = require('../utils/email')
const { getRecommendations } = require('../utils/recommendation')

router.use(protect, restrictTo('student'))

// GET /api/student/profile
router.get('/profile', async (req, res) => {
  try {
    const [profile, currentUser] = await Promise.all([
      StudentProfile.findOne({ user: req.user._id }),
      User.findById(req.user._id).select('tagline designation website youtube instagram linkedin')
    ])
    res.json({ 
      profile,
      user: {
        tagline: currentUser?.tagline,
        occupation: currentUser?.designation,
        website: currentUser?.website,
        youtube: currentUser?.youtube,
        instagram: currentUser?.instagram,
      }
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/student/profile
router.put('/profile', async (req, res) => {
  try {
    sanitizeFields(req.body, ['firstName', 'lastName', 'phone', 'bio', 'college', 'degree', 'year', 'linkedin', 'github', 'portfolio', 'experience', 'education', 'tagline', 'occupation', 'website', 'youtube', 'instagram'])
    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      req.body,
      { new: true, upsert: true, runValidators: true }
    )
    // Also sync poster fields to User model for PersonDetail page
    const posterUpdates = {}
    if (req.body.tagline !== undefined) posterUpdates.tagline = req.body.tagline
    if (req.body.occupation !== undefined) posterUpdates.designation = req.body.occupation
    if (req.body.website !== undefined) posterUpdates.website = req.body.website
    if (req.body.youtube !== undefined) posterUpdates.youtube = req.body.youtube
    if (req.body.instagram !== undefined) posterUpdates.instagram = req.body.instagram
    if (Object.keys(posterUpdates).length > 0) {
      await User.findByIdAndUpdate(req.user._id, { $set: posterUpdates })
    }
    res.json({ profile })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/student/poster-profile — Update poster-specific fields on User model
router.put('/poster-profile', async (req, res) => {
  try {
    const { tagline, occupation, website, youtube, instagram, linkedin } = req.body
    const updates = {}
    if (tagline !== undefined) updates.tagline = tagline
    if (occupation !== undefined) updates.designation = occupation
    if (website !== undefined) updates.website = website
    if (youtube !== undefined) updates.youtube = youtube
    if (instagram !== undefined) updates.instagram = instagram
    if (linkedin !== undefined) updates.linkedin = linkedin
    
    const user = await User.findByIdAndUpdate(req.user._id, { $set: updates }, { new: true }).select('-password')
    res.json({ user })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/resume
router.post('/resume', (req, res) => {
  uploadResume(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })
    const resumeUrl = getFileUrl(req, 'resumes')
    await StudentProfile.findOneAndUpdate({ user: req.user._id }, { resumeUrl })
    res.json({ resumeUrl })
  })
})

// GET /api/student/applications/:id
router.get('/applications/:id', async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, applicant: req.user._id })
      .populate({ path: 'posting', populate: { path: 'company', select: 'name logo' } })
    if (!app) return res.status(404).json({ message: 'Application not found' })
    res.json({ application: app })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/applications
router.get('/applications', async (req, res) => {
  try {
    const apps = await Application.find({ applicant: req.user._id })
      .populate({ path: 'posting', populate: { path: 'company', select: 'name logo' } })
      .sort('-createdAt')
    res.json({ applications: apps })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/notifications
router.get('/notifications', async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id }).sort('-createdAt').limit(50)
    res.json({ notifications: notifs })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/student/notifications/:id/read
router.patch('/notifications/:id/read', async (req, res) => {
  try {
    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { read: true },
      { new: true }
    )
    if (!notif) return res.status(404).json({ message: 'Not found' })
    res.json({ notification: notif })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/student/notifications/read-all
router.patch('/notifications/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ user: req.user._id, read: false }, { read: true })
    res.json({ message: 'All marked read' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/student/notifications/:id
router.delete('/notifications/:id', async (req, res) => {
  try {
    const notif = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!notif) return res.status(404).json({ message: 'Notification not found' })
    res.json({ message: 'Notification deleted' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/student/notifications  (delete all)
router.delete('/notifications', async (req, res) => {
  try {
    await Notification.deleteMany({ user: req.user._id })
    res.json({ message: 'All notifications cleared' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/saved
router.get('/saved', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
      .populate('savedJobs')
      .populate('savedInternships')
    res.json({
      savedJobs: profile?.savedJobs || [],
      savedInternships: profile?.savedInternships || [],
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/saved/:kind/:id  (toggle save)
router.post('/saved/:kind/:id', async (req, res) => {
  try {
    const { kind, id } = req.params
    if (!['job', 'internship'].includes(kind)) return res.status(400).json({ message: 'Invalid kind' })
    const field = kind === 'job' ? 'savedJobs' : 'savedInternships'

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id }, {}, { upsert: true, new: true }
    )
    const already = profile[field].some((x) => String(x) === String(id))
    if (already) {
      profile[field] = profile[field].filter((x) => String(x) !== String(id))
    } else {
      profile[field].push(id)
    }
    await profile.save()
    res.json({ saved: !already, savedJobs: profile.savedJobs, savedInternships: profile.savedInternships })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/student/applications/:id  (withdraw — only if status is "Applied")
router.delete('/applications/:id', async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, applicant: req.user._id })
    if (!app) return res.status(404).json({ message: 'Application not found' })
    if (app.status !== 'Applied') {
      return res.status(400).json({ message: `Cannot withdraw — application is already "${app.status}"` })
    }
    await app.deleteOne()
    res.json({ message: 'Application withdrawn successfully' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── CHAT / MESSAGES ─────────────────────────────────────────────────────────

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
     } else if (recipient.role === 'company') {
       const Company = require('../models/Company')
       const company = await Company.findOne({ user: recipientId }).select('settings')
       const digest = company?.settings?.messageDigest || 'instant'
       if (digest !== 'instant') return
     } else if (recipient.role === 'agency') {
       const Agency = require('../models/Agency')
       const agency = await Agency.findOne({ user: recipientId }).select('settings')
       const digest = agency?.settings?.messageDigest || 'instant'
       if (digest !== 'instant') return
     }

const path = recipient.role === 'student' ? `/dashboard/messages/${conversationId}` : `/${recipient.role}/messages/${conversationId}`
      const link = `${process.env.CLIENT_URL || 'http://localhost:5173'}/#${path}`
     const content = newMessageEmail(recipient.name, senderName, link)
     await sendEmail({ to: recipient.email, ...content })
   } catch {} // silently fail — email is best-effort
 }

// GET /api/student/conversations
router.get('/conversations', protect, async (req, res) => {
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

// POST /api/student/conversations
router.post('/conversations', protect, async (req, res) => {
  try {
    const { applicationId, text } = req.body
    if (!applicationId) return res.status(400).json({ message: 'applicationId is required' })

    const application = await Application.findById(applicationId).populate({
      path: 'posting',
      populate: { path: 'company', select: 'user isVerified chatInitiationCount chatInitiationDate blockedUsers' },
    })
    if (!application) return res.status(404).json({ message: 'Application not found' })

    const company = application.posting?.company
    if (!company) return res.status(404).json({ message: 'Company not found' })

    const recruiterUserId = company.user
    const studentId = req.user._id

    // Check blocks
    const [studentProfile] = await Promise.all([
      StudentProfile.findOne({ user: studentId }).select('blockedUsers'),
    ])
    const studentBlocked = studentProfile?.blockedUsers?.some(
      (id) => String(id) === String(recruiterUserId)
    )
    const companyBlocked = company.blockedUsers?.some(
      (id) => String(id) === String(studentId)
    )
    if (studentBlocked || companyBlocked) {
      return res.status(403).json({ message: 'Unable to start conversation' })
    }

    // Check existing conversation for this application
    const existing = await Conversation.findOne({ application: applicationId })
    if (existing) {
      return res.json({ conversation: existing })
    }

    // Check daily chat limit for unverified companies
    if (!company.isVerified) {
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const initDate = company.chatInitiationDate
      const isNewDay = !initDate || new Date(initDate) < today
      const count = isNewDay ? 0 : (company.chatInitiationCount || 0)
      if (count >= 10) {
        return res.status(429).json({ message: 'Daily chat limit reached. Please try again later.' })
      }
      await Company.findByIdAndUpdate(company._id, {
        chatInitiationCount: count + 1,
        chatInitiationDate: isNewDay ? new Date() : initDate,
      })
    }

    // Create conversation
    let conversation = await Conversation.create({
      participants: [studentId, recruiterUserId],
      application: applicationId,
      posting: application.posting._id,
      postingModel: application.postingModel,
      initiatedBy: 'candidate',
      status: 'active',
    })

    // If text provided, create first message
    if (text?.trim()) {
      const redFlagReasons = scanRedFlags(text)
      const message = await Message.create({
        conversation: conversation._id,
        sender: studentId,
        senderRole: 'student',
        messageType: 'text',
        text: text.trim(),
        redFlagged: redFlagReasons.length > 0,
        redFlagReasons: redFlagReasons.length > 0 ? redFlagReasons : undefined,
      })

      conversation.lastMessage = text.trim()
      conversation.lastSender = studentId
      conversation.lastMessageAt = new Date()
      conversation.unreadCount.set(
        String(recruiterUserId),
        (conversation.unreadCount.get(String(recruiterUserId)) || 0) + 1
      )
      await conversation.save()

      const populated = await Message.findById(message._id).populate('sender', 'name email role')

      const io = req.app.get('io')
      if (io) {
        io.sendMessage(String(conversation._id), populated.toObject())
        const unread = conversation.unreadCount.get(String(recruiterUserId)) || 0
        io.sendUnreadUpdate(String(recruiterUserId), String(conversation._id), unread)
        io.sendNotification(String(recruiterUserId), {
          title: 'New Message',
          message: `${req.user.name} sent you a message`,
          icon: '💬',
          link: `/company/messages/${conversation._id}`,
        })
        notifyViaEmailIfOffline(io, recruiterUserId, req.user.name, conversation._id)
      }
    }

    conversation = await Conversation.findById(conversation._id)
      .populate('participants', 'name email role')
      .populate('posting', 'title')
      .populate('application', 'status')

    res.status(201).json({ conversation })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/conversations/direct — Start or find a direct conversation with another user
router.post('/conversations/direct', protect, async (req, res) => {
  try {
    const { userId, postingId, applicationId } = req.body
    if (!userId) return res.status(400).json({ message: 'userId is required' })
    if (String(userId) === String(req.user._id)) {
      return res.status(400).json({ message: 'Cannot start conversation with yourself' })
    }

    // Check if student has blocked this user
    const StudentProfile = require('../models/StudentProfile')
    const studentProfile = await StudentProfile.findOne({ user: req.user._id })
    const studentBlocked = studentProfile?.blockedUsers?.some(
      (id) => String(id) === String(userId)
    )
    if (studentBlocked) {
      return res.status(403).json({ message: 'Unable to start conversation' })
    }

    // Require valid relationship: student must have applied to company's posting or been invited
    const hasApplication = await Application.findOne({
      student: req.user._id,
      $or: [{ job: { $in: await Job.find({ company: userId }).select('_id') } },
            { internship: { $in: await Internship.find({ company: userId }).select('_id') } }],
    })
    const CompanyModel = require('../models/Company')
    const company = await CompanyModel.findOne({ user: userId }).select('invitedCandidates')
    const hasInvite = company?.invitedCandidates?.some((inv) => String(inv) === String(req.user._id))

    if (!applicationId && !postingId && !hasApplication && !hasInvite) {
      return res.status(403).json({ message: 'You can only message companies you have applied to or been invited by' })
    }

    // Check if conversation already exists between these two users
    let conv = await Conversation.findOne({
      participants: { $all: [req.user._id, userId], $size: 2 },
      $or: [{ posting: { $exists: false } }, { posting: null }],
    })
      .sort('-lastMessageAt -updatedAt')
      .populate('participants', 'name email role')
      .populate('posting', 'title')

    if (conv) {
      const obj = conv.toObject()
      const io = req.app.get('io')
      if (io) {
        obj.onlineStatus = io.getOnlineStatus(String(userId))
      }
      obj.unreadCount = conv.unreadCount?.get(String(req.user._id)) || 0
      obj.participant = obj.participants.find(p => String(p._id) !== String(req.user._id))
      return res.json({ conversation: obj })
    }

    // Create new conversation
    conv = await Conversation.create({
      participants: [req.user._id, userId],
      initiatedBy: 'candidate',
      status: 'active',
    })

    conv = await Conversation.findById(conv._id)
      .populate('participants', 'name email role')
      .populate('posting', 'title')

    const obj = conv.toObject()
    const io = req.app.get('io')
    if (io) {
      obj.onlineStatus = io.getOnlineStatus(String(userId))
    }
    obj.unreadCount = 0
    obj.participant = obj.participants.find(p => String(p._id) !== String(req.user._id))

    res.status(201).json({ conversation: obj })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/conversations/:id/messages
router.get('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    const page = Math.max(1, parseInt(req.query.page) || 1)
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))

    const total = await Message.countDocuments({ conversation: req.params.id })

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name email role')
      .sort('-createdAt')
      .skip((total - page * limit))
      .limit(limit)

    const messageIds = messages.map(m => m._id)
    if (messageIds.length > 0) {
      await Message.updateMany(
        { _id: { $in: messageIds }, sender: { $ne: req.user._id }, readBy: { $ne: req.user._id } },
        { $addToSet: { readBy: req.user._id } }
      )
    }

    conv.unreadCount.set(String(req.user._id), 0)
    await conv.save()

    const io = req.app.get('io')
    if (io) {
      io.sendUnreadUpdate(String(req.user._id), String(req.params.id), 0)
    }

    res.json({ messages, total, page, totalPages: Math.ceil(total / limit) })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/conversations/:id/search
router.get('/conversations/:id/search', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    const q = req.query.q?.trim()
    if (!q) return res.json({ messages: [], total: 0 })

    const messages = await Message.find({
      conversation: req.params.id,
      messageType: { $ne: 'system' },
      $or: [
        { text: { $regex: escapeRegex(q), $options: 'i' } },
        { 'attachments.name': { $regex: escapeRegex(q), $options: 'i' } },
      ],
    })
      .populate('sender', 'name email role')
      .sort('-createdAt')
      .limit(50)

    res.json({ messages, total: messages.length })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/conversations/attachments - Chat file upload
router.post('/conversations/attachments', protect, (req, res) => {
   uploadDocument(req, res, async (err) => {
     if (err) return res.status(400).json({ message: err.message })
     const fileUrl = getFileUrl(req, 'documents')
     res.json({ fileUrl })
   })
 })

// POST /api/student/conversations/:id/messages
router.post('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })
    if (conv.status === 'blocked') return res.status(403).json({ message: 'Conversation is blocked' })

    const { text, attachments } = req.body
    if (!text?.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message text or attachment required' })
    }

    const redFlagReasons = scanRedFlags(text)
    const messageType = attachments?.length > 0 ? 'file' : 'text'

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      senderRole: 'student',
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

    // Contact reveal is ONLY handled via invite-accept flow (see /open-to-work/invites/:id/respond)
    // DO NOT auto-reveal on every reply - this was bypassing consent

    const populated = await Message.findById(message._id).populate('sender', 'name email role')

    const io = req.app.get('io')
    if (io) {
      io.sendMessage(String(req.params.id), populated.toObject())
      conv.participants.forEach((pId) => {
        if (String(pId) !== String(req.user._id)) {
          const count = conv.unreadCount.get(String(pId)) || 0
          io.sendUnreadUpdate(String(pId), String(req.params.id), count)
        }
      })
      const otherId = conv.participants.find((p) => String(p) !== String(req.user._id))
      if (otherId) {
        const otherUser = await User.findById(otherId).select('role')
        const linkPath = otherUser?.role === 'student' ? '/dashboard/messages' : '/company/messages'
        io.sendNotification(String(otherId), {
          title: 'New Message',
          message: `${req.user.name} sent you a message`,
          icon: '💬',
          link: linkPath,
        })
        notifyViaEmailIfOffline(io, otherId, req.user.name, req.params.id)
      }
    }

    res.status(201).json({ message: populated })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/conversations/:id/read
router.post('/conversations/:id/read', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

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

    res.json({ success: true })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

const { reactToMessage, editMessage, deleteMessage, pinMessage } = require('../controllers/messageActions')
router.post('/conversations/:id/messages/:msgId/react', protect, reactToMessage)
router.patch('/conversations/:id/messages/:msgId', protect, editMessage)
router.delete('/conversations/:id/messages/:msgId', protect, deleteMessage)
router.patch('/conversations/:id/messages/:msgId/pin', protect, pinMessage)

// POST /api/student/conversations/:id/block
router.post('/conversations/:id/block', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    if (conv.blockedBy.some((id) => String(id) === String(req.user._id))) {
      return res.status(400).json({ message: 'Already blocked' })
    }

    conv.blockedBy.push(req.user._id)
    conv.status = 'blocked'
    await conv.save()

    // Add blocked user to student's blockedUsers array for account-level blocking
    const otherId = conv.participants.find((p) => String(p) !== String(req.user._id))
    if (otherId) {
      await StudentProfile.updateOne(
        { user: req.user._id, blockedUsers: { $ne: otherId } },
        { $addToSet: { blockedUsers: otherId } }
      )
    }

    const io = req.app.get('io')
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

// POST /api/student/report-conversation
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

// GET /api/student/conversations/:id/online-status
router.get('/conversations/:id/online-status', protect, async (req, res) => {
  try {
    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })

    const otherId = conv.participants.find((p) => String(p) !== String(req.user._id))
    if (!otherId) return res.status(404).json({ message: 'Other participant not found' })

    const io = req.app.get('io')
    const status = io ? io.getOnlineStatus(String(otherId)) : { online: false, lastSeen: null }
    res.json({ userId: otherId, ...status })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/canned-replies
router.get('/canned-replies', (req, res) => {
  res.json({ cannedReplies: [] })
})

// ─── DOCUMENTS ───────────────────────────────────────────────────────────────

// GET /api/student/documents
router.get('/documents', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
    res.json({ documents: profile?.documents || [] })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/documents
router.post('/documents', (req, res) => {
  uploadResume(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })
    const profile = await StudentProfile.findOne({ user: req.user._id })
    const doc = {
      name: req.body.name || req.file.originalname,
      type: req.body.type || 'resume',
      url: getFileUrl(req, 'resumes'),
      isDefault: req.body.isDefault === 'true' || profile.documents.length === 0,
    }
    if (doc.isDefault) {
      profile.documents.forEach((d) => { d.isDefault = false })
      profile.resumeUrl = doc.url
    }
    profile.documents.push(doc)
    await profile.save()
    res.status(201).json({ document: profile.documents[profile.documents.length - 1] })
  })
})

// PATCH /api/student/documents/:id/default
router.patch('/documents/:id/default', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
    if (!profile) return res.status(404).json({ message: 'Profile not found' })
    const doc = profile.documents.id(req.params.id)
    if (!doc) return res.status(404).json({ message: 'Document not found' })
    profile.documents.forEach((d) => { d.isDefault = false })
    doc.isDefault = true
    profile.resumeUrl = doc.url
    await profile.save()
    res.json({ documents: profile.documents })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/student/documents/:id
router.delete('/documents/:id', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
    if (!profile) return res.status(404).json({ message: 'Profile not found' })
    profile.documents = profile.documents.filter((d) => String(d._id) !== req.params.id)
    if (!profile.documents.some((d) => d.isDefault) && profile.documents.length > 0) {
      profile.documents[0].isDefault = true
    }
    await profile.save()
    res.json({ documents: profile.documents })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── SETTINGS ────────────────────────────────────────────────────────────────

// GET /api/student/settings
router.get('/settings', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
    const user = await User.findById(req.user._id).select('name email phone isEmailVerified')
    res.json({
      settings: profile?.settings || {},
      user,
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/student/settings
router.put('/settings', async (req, res) => {
  try {
    const allowed = [
      'emailNotifications', 'applicationUpdates', 'newMatchAlerts',
      'deadlineReminders', 'marketingEmails', 'profileVisibility',
      'showEmail', 'showPhone', 'messageDigest',
    ]
    const updates = {}
    allowed.forEach((k) => {
      if (req.body[k] !== undefined) updates[`settings.${k}`] = req.body[k]
    })
    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, upsert: true }
    )
    res.json({ settings: profile.settings })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// DELETE /api/student/account
router.delete('/account', async (req, res) => {
  try {
    const { password } = req.body
    const user = await User.findById(req.user._id).select('+password')
    if (!user || !(await user.comparePassword(password))) {
      return res.status(400).json({ message: 'Current password is incorrect' })
    }
    await Application.deleteMany({ applicant: req.user._id })
    await Notification.deleteMany({ user: req.user._id })
    await StudentProfile.deleteOne({ user: req.user._id })
    await Message.deleteMany({ sender: req.user._id })
    await Conversation.updateMany(
      { participants: req.user._id },
      { $pull: { participants: req.user._id } }
    )
    await User.findByIdAndDelete(req.user._id)
    res.json({ message: 'Account deleted successfully' })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── OPEN TO WORK ─────────────────────────────────────────────────────────

// POST /api/student/open-to-work/toggle
router.post('/open-to-work/toggle', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
    if (!profile) return res.status(404).json({ message: 'Profile not found' })
    profile.openToWork = !profile.openToWork
    if (profile.openToWork) profile.lastActive = new Date()
    await profile.save()
    res.json({ openToWork: profile.openToWork })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PUT /api/student/open-to-work/settings
router.put('/open-to-work/settings', async (req, res) => {
  try {
    const allowed = ['headline', 'currentLocation', 'openTo', 'relocate', 'noticePeriod', 'expectedCTC', 'hideFromCurrentEmployer', 'videoUrl', 'bio', 'preferredMode', 'skills']
    const updates = {}
    allowed.forEach(k => {
      if (req.body[k] !== undefined) updates[k] = req.body[k]
    })
    if (req.body.openToWork !== undefined) updates.openToWork = req.body.openToWork
    if (updates.openToWork) updates.lastActive = new Date()
    if (req.body.videoUrl !== undefined) updates.videoUrl = req.body.videoUrl
    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      { $set: updates },
      { new: true, upsert: true }
    )
    res.json({ profile })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/open-to-work/status
router.get('/open-to-work/status', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
    if (!profile) return res.json({ openToWork: false })
    res.json({
      openToWork: profile.openToWork,
      headline: profile.headline,
      currentLocation: profile.currentLocation,
      openTo: profile.openTo,
      relocate: profile.relocate,
      noticePeriod: profile.noticePeriod,
      expectedCTC: profile.expectedCTC,
      hideFromCurrentEmployer: profile.hideFromCurrentEmployer,
      videoUrl: profile.videoUrl,
      linksVerified: profile.linksVerified,
      lastActive: profile.lastActive,
      bio: profile.bio || '',
      skills: profile.skills || [],
      preferredMode: profile.preferredMode || profile.jobPreferences?.preferredWorkMode || 'any',
    })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/open-to-work/refresh — bump lastActive timestamp
router.post('/open-to-work/refresh', async (req, res) => {
  try {
    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      { lastActive: new Date() },
      { new: true }
    )
    res.json({ lastActive: profile?.lastActive })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/open-to-work/invites
router.get('/open-to-work/invites', async (req, res) => {
  try {
    const CandidateInvite = require('../models/CandidateInvite')
    const invites = await CandidateInvite.find({ candidate: req.user._id })
      .populate('recruiter', 'name email')
      .populate('company', 'name logoUrl location')
      .populate('posting', 'title')
      .sort('-createdAt')
    res.json({ invites })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// PATCH /api/student/open-to-work/invites/:id/respond
router.patch('/open-to-work/invites/:id/respond', async (req, res) => {
  try {
    const CandidateInvite = require('../models/CandidateInvite')
    const { status } = req.body
    if (!['accepted', 'declined'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' })
    }
    const invite = await CandidateInvite.findOneAndUpdate(
      { _id: req.params.id, candidate: req.user._id },
      { status },
      { new: true }
    )
    if (!invite) return res.status(404).json({ message: 'Invite not found' })

    // If accepted, reveal contact to the company
    if (status === 'accepted' && invite.company) {
      await StudentProfile.findOneAndUpdate(
        { user: req.user._id },
        { $addToSet: { contactRevealedTo: invite.company } }
      )
    }

    res.json({ invite })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// GET /api/student/open-to-work/shortlists
router.get('/open-to-work/shortlists', async (req, res) => {
  try {
    const Shortlist = require('../models/Shortlist')
    const shortlists = await Shortlist.find({ candidate: req.user._id })
      .populate('recruiter', 'name email')
      .populate('company', 'name logoUrl location')
      .sort('-createdAt')
    res.json({ shortlists })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── RECOMMENDED ─────────────────────────────────────────────────────────────

// GET /api/student/recommended
router.get('/recommended', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
    const results = await getRecommendations(req.user._id, profile, 12)
    res.json({ recommended: results })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Interview Slot Booking ────────────────────────────────────────────────

router.get('/interview-slots/:postingId', async (req, res) => {
  try {
    const slots = await InterviewSlot.find({
      posting: req.params.postingId,
      isBooked: false,
      startTime: { $gte: new Date() },
    }).sort('startTime')
    res.json({ slots })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/interview-slots/:slotId/book', async (req, res) => {
  try {
    const slot = await InterviewSlot.findOneAndUpdate(
      { _id: req.params.slotId, isBooked: false },
      { isBooked: true, bookedBy: req.user._id },
      { new: true }
    )
    if (!slot) return res.status(400).json({ message: 'Slot not available' })

    // Update the application
    const app = await Application.findOneAndUpdate(
      { posting: slot.posting, applicant: req.user._id },
      {
        status: 'Interview Scheduled',
        interviewDate: slot.startTime,
        interviewLink: slot.meetLink,
        $push: { statusHistory: { status: 'Interview Scheduled', date: new Date() } },
      },
      { new: true }
    ).populate('posting', 'title')

    const io = req.app.get('io')
    if (io && app) {
      const companyUser = await Company.findById(slot.company).select('user')
      if (companyUser) {
        await io.sendNotification(companyUser.user, {
          title: 'Interview Booked',
          message: `${req.user.name} booked an interview for ${app.posting?.title}`,
          icon: '📅',
        })
      }
      await io.sendNotification(req.user._id, {
        title: 'Interview Scheduled!',
        message: `Interview for ${app.posting?.title} on ${new Date(slot.startTime).toLocaleString()}`,
        icon: '📅', link: slot.meetLink,
      })
    }

    res.json({ slot, application: app })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Company Reviews ──────────────────────────────────────────────────────

router.post('/reviews', async (req, res) => {
  try {
    const { companyId, rating, title, review, pros, cons, salary, interviewExp, interviewDifficulty, isAnonymous } = req.body
    if (!companyId || !rating) return res.status(400).json({ message: 'companyId and rating required' })
    const existing = await CompanyReview.findOne({ company: companyId, reviewer: req.user._id })
    if (existing) return res.status(400).json({ message: 'You already reviewed this company' })
    const item = await CompanyReview.create({
      company: companyId, reviewer: req.user._id,
      rating, title, review, pros, cons, salary, interviewExp, interviewDifficulty, isAnonymous,
    })
    res.status(201).json({ review: item })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.get('/my-reviews', async (req, res) => {
  try {
    const reviews = await CompanyReview.find({ reviewer: req.user._id }).populate('company', 'name logoUrl').sort('-createdAt')
    res.json({ reviews })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Re-apply for rejected applications ────────────────────────────────────

router.post('/applications/:id/reapply', async (req, res) => {
  try {
    const app = await Application.findOne({ _id: req.params.id, applicant: req.user._id }).populate('posting', 'title')
    if (!app) return res.status(404).json({ message: 'Application not found' })
    if (app.status !== 'Rejected') return res.status(400).json({ message: 'Only rejected applications can be reapplied' })

    app.status = 'Applied'
    app.statusHistory.push({ status: 'Applied', date: new Date() })
    await app.save()

    const Model = app.postingModel === 'Internship' ? Internship : Job
    await Model.findByIdAndUpdate(app.posting._id, { $inc: { applicantsCount: 1 } })

    const io = req.app.get('io')
    if (io) {
      const company = await Company.findById(app.posting.company).select('user')
      if (company) {
        io.sendApplicationUpdate(String(company.user), app.toObject())
        io.sendNotification(String(company.user), {
          title: 'Re-application Received',
          message: `${req.user.name} re-applied for ${app.posting.title}`,
          icon: '🔄',
          link: `/company/applicants/${app.posting._id}`,
        })
      }
    }

    res.json({ application: app })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── LINK VERIFICATION ────────────────────────────────────────────────────

// POST /api/student/verify-links
router.post('/verify-links', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id })
    if (!profile) return res.status(404).json({ message: 'Profile not found' })

    const results = { linkedin: false, github: false, portfolio: false }
    const checks = []
    if (profile.linkedin) checks.push({ key: 'linkedin', url: profile.linkedin })
    if (profile.github) checks.push({ key: 'github', url: profile.github })
    if (profile.portfolio) checks.push({ key: 'portfolio', url: profile.portfolio })

    await Promise.all(checks.map(async ({ key, url }) => {
      try {
        const resp = await axios.head(url, {
          timeout: 5000,
          validateStatus: (status) => status >= 200 && status < 400
        })
        results[key] = true
      } catch {
        results[key] = false
      }
    }))

    profile.linksVerified = results
    await profile.save()
    res.json({ linksVerified: results })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── BLOCK COMPANIES ──────────────────────────────────────────────────────

// GET /api/student/blocked-companies
router.get('/blocked-companies', async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).populate('blockedCompanies', 'name logoUrl')
    res.json({ blockedCompanies: profile?.blockedCompanies || [] })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// POST /api/student/blocked-companies/:companyId — Toggle block
router.post('/blocked-companies/:companyId', async (req, res) => {
  try {
    const Company = require('../models/Company')
    const company = await Company.findById(req.params.companyId)
    if (!company) return res.status(404).json({ message: 'Company not found' })
    const profile = await StudentProfile.findOne({ user: req.user._id })
    if (!profile) return res.status(404).json({ message: 'Profile not found' })
    const already = profile.blockedCompanies.some(id => String(id) === String(req.params.companyId))
    if (already) {
      profile.blockedCompanies = profile.blockedCompanies.filter(id => String(id) !== String(req.params.companyId))
    } else {
      profile.blockedCompanies.push(req.params.companyId)
    }
    await profile.save()
    res.json({ blocked: !already, blockedCompanies: profile.blockedCompanies })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

// ─── Saved Search Alerts ───────────────────────────────────────────────────

router.get('/saved-searches', async (req, res) => {
  try {
    const alerts = await SavedSearchAlert.find({ user: req.user._id }).sort('-createdAt')
    const searches = alerts.map(a => ({ ...a.toObject(), notify: a.isActive, isActive: undefined }))
    res.json({ searches })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.post('/saved-searches', async (req, res) => {
  try {
    const { name, kind, filters, notify } = req.body
    if (!filters) return res.status(400).json({ message: 'filters required' })
    const alert = await SavedSearchAlert.create({
      user: req.user._id, name: name || 'Untitled Alert', kind: kind || 'both',
      filters, isActive: notify !== undefined ? notify : true,
    })
    const search = { ...alert.toObject(), notify: alert.isActive, isActive: undefined }
    res.status(201).json({ search })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.put('/saved-searches/:id', async (req, res) => {
  try {
    const { notify, ...rest } = req.body
    const update = { ...rest }
    if (notify !== undefined) update.isActive = notify
    const alert = await SavedSearchAlert.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      update,
      { new: true }
    )
    if (!alert) return res.status(404).json({ message: 'Alert not found' })
    const search = { ...alert.toObject(), notify: alert.isActive, isActive: undefined }
    res.json({ search })
  } catch (err) { res.status(500).json({ message: err.message }) }
})

router.delete('/saved-searches/:id', async (req, res) => {
  try {
    await SavedSearchAlert.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    res.json({ message: 'Deleted' })
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

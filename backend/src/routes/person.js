const router = require('express').Router()
const User = require('../models/User')
const Opportunity = require('../models/Opportunity')
const PersonReview = require('../models/PersonReview')
const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const RED_FLAG_PHRASES = [
  'processing fee', 'pay to register', 'bank details', 'deposit',
  'registration fee', 'security deposit', 'joining fee',
]

function scanRedFlags(text) {
  if (!text) return []
  return RED_FLAG_PHRASES.filter((phrase) => text.toLowerCase().includes(phrase))
}
const { protect } = require('../middleware/auth')
const StudentProfile = require('../models/StudentProfile')

// GET /api/person/analytics — Must come BEFORE /:id to avoid route collision
router.get('/analytics', protect, async (req, res) => {
  try {
    const opps = await Opportunity.find({ poster: req.user._id }).lean()
    const totalViews = opps.reduce((s, o) => s + (o.views || 0), 0)
    const totalApplicants = opps.reduce((s, o) => s + (o.applicantsCount || 0), 0)
    const activeOpps = opps.filter(o => o.status === 'active').length
    res.json({ totalApplicants, totalViews, activeOpps, totalOpps: opps.length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// Mock persons data (in real app, this would come from MongoDB User model)
const mockPersons = [
  {
    _id: 'user1',
    name: 'Rahul Sharma',
    tagline: 'Content Creator — runs 2 YouTube channels',
    bio: 'I create content on YouTube and need freelancers to help with video editing, scripting, and graphics.',
    location: 'Delhi, India',
    occupation: 'Content Creator',
    memberSince: new Date('2023-06-15'),
    isEmailVerified: true,
    isPhoneVerified: true,
    isIdVerified: false,
    pastOpportunities: 5,
    avgRating: 4.5,
    totalHires: 8,
    completionRate: 80,
    totalOpportunities: 5,
    completedOpportunities: 4,
    feeComplaintCount: 0,
    website: 'https://youtube.com/@rahulsharma',
    linkedin: 'https://linkedin.com/in/rahulsharma',
    reviewStats: { avgRating: 4.5, count: 3 },
    youtube: 'https://youtube.com/@rahulsharma',
    instagram: 'https://instagram.com/rahulsharma',
    responseTime: 12,
    profileViews: 340,
  },
  {
    _id: 'user2',
    name: 'Priya Patel',
    tagline: 'Startup founder building fintech app',
    bio: 'Founder of a fintech startup in Bangalore. Looking for talented developers and designers to join our journey.',
    location: 'Bangalore, Karnataka, India',
    occupation: 'Startup Founder',
    memberSince: new Date('2022-03-10'),
    isEmailVerified: true,
    isPhoneVerified: true,
    isIdVerified: true,
    pastOpportunities: 12,
    avgRating: 4.8,
    totalHires: 25,
    completionRate: 92,
    totalOpportunities: 12,
    completedOpportunities: 11,
    feeComplaintCount: 0,
    website: 'https://priyafounder.com',
    linkedin: 'https://linkedin.com/in/priyapatel',
    reviewStats: { avgRating: 4.8, count: 8 },
    youtube: 'https://youtube.com/@priyapatel',
    responseTime: 4,
    profileViews: 1200,
  },
  {
    _id: 'user3',
    name: 'Ankit Verma',
    tagline: 'Small business owner, e-commerce store',
    bio: 'Running an e-commerce business and occasionally need freelancers for product photography, content writing, and social media management.',
    location: 'Mumbai, Maharashtra, India',
    occupation: 'Small Business Owner',
    memberSince: new Date('2024-01-20'),
    isEmailVerified: true,
    isPhoneVerified: false,
    isIdVerified: false,
    pastOpportunities: 3,
    avgRating: 4.2,
    totalHires: 2,
    completionRate: 67,
    totalOpportunities: 3,
    completedOpportunities: 2,
    feeComplaintCount: 0,
    reviewStats: { avgRating: 4.2, count: 1 },
    instagram: 'https://instagram.com/ankitverma',
    responseTime: 24,
    profileViews: 89,
  }
]

// GET /api/person/:id - Get person profile
router.get('/:id', async (req, res) => {
  try {
    console.log('[Person route] Searching for:', req.params.id, typeof req.params.id)
    // Try mock data first (for backward compatibility)
    const mock = mockPersons.find(p => p._id === req.params.id)
    if (mock) { console.log('[Person route] Found in mock'); return res.json(mock) }

    // If not in mock, try MongoDB User model
    const mongoose = require('mongoose')
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      console.log('[Person route] Invalid ObjectId:', req.params.id)
      return res.status(404).json({ message: 'Person not found' })
    }
    const user = await User.findById(req.params.id).lean()
    if (!user) {
      console.log('[Person route] User not found in MongoDB:', req.params.id)
      return res.status(404).json({ message: 'Person not found' })
    }
    console.log('[Person route] Found user:', user.name)

    // Fetch opportunities posted by this user
    const opps = await Opportunity.find({ poster: user._id }).lean()
    const totalOpps = opps.length
    const completedOpps = opps.filter(o => o.status === 'filled' || o.status === 'closed')
    const totalHires = opps.reduce((sum, o) => sum + (o.filledCount || 0), 0)
    const completionRate = totalOpps > 0 ? Math.round((completedOpps.length / totalOpps) * 100) : 0

    // Fetch real review stats
    const reviewDocs = await PersonReview.find({ person: user._id, status: 'approved' }).lean()
    const reviewCount = reviewDocs.length
    const avgRating = reviewCount > 0 ? reviewDocs.reduce((s, r) => s + r.rating, 0) / reviewCount : 0

    // Construct person profile from User model + computed stats
    const person = {
      _id: user._id,
      name: user.name,
      email: user.email,
      avatarUrl: user.avatarUrl || '',
      profilePhoto: user.profilePhoto || '',
      coverUrl: user.coverUrl || '',
      tagline: user.tagline || '',
      bio: user.bio || '',
      location: user.location || '',
      occupation: user.designation || '',
      memberSince: user.createdAt,
      isEmailVerified: user.isEmailVerified || false,
      isPhoneVerified: user.isPhoneVerified || false,
      isIdVerified: user.isIdVerified || false,
      pastOpportunities: totalOpps,
      totalOpportunities: totalOpps,
      totalHires,
      completedOpportunities: completedOpps.length,
      completionRate,
      feeComplaintCount: 0,
      website: user.website || '',
      linkedin: user.linkedin || '',
      youtube: user.youtube || '',
      instagram: user.instagram || '',
      responseTime: null,
      profileViews: 0,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewStats: { avgRating: Math.round(avgRating * 10) / 10, count: reviewCount },
    }

    res.json(person)
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/person/:id/reviews — Real reviews with aggregation
router.get('/:id/reviews', async (req, res) => {
  try {
    const mongoose = require('mongoose')
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Person not found' })
    }
    const reviews = await PersonReview.find({ person: req.params.id, status: 'approved' })
      .populate('reviewer', 'name')
      .sort({ createdAt: -1 })
      .lean()

    const count = reviews.length
    const avgRating = count > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0
    const avgPayment = count > 0 ? reviews.reduce((s, r) => s + (r.paymentRating || r.rating), 0) / count : 0
    const avgComm = count > 0 ? reviews.reduce((s, r) => s + (r.communicationRating || r.rating), 0) / count : 0
    const avgClarity = count > 0 ? reviews.reduce((s, r) => s + (r.clarityRating || r.rating), 0) / count : 0
    const avgTime = count > 0 ? reviews.reduce((s, r) => s + (r.timeRespectRating || r.rating), 0) / count : 0

    res.json({
      reviews,
      reviewStats: { avgRating: Math.round(avgRating * 10) / 10, count },
      breakdown: [
        { key: 'payment', score: Math.round(avgPayment * 10) / 10 },
        { key: 'communication', score: Math.round(avgComm * 10) / 10 },
        { key: 'clarity', score: Math.round(avgClarity * 10) / 10 },
        { key: 'timeRespect', score: Math.round(avgTime * 10) / 10 },
      ],
    })
  } catch (err) {
    console.error('[Person reviews] Error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// POST /api/person/:id/reviews — Submit review (mutual-completion enforced)
router.post('/:id/reviews', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose')
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid person ID' })
    }
    if (!req.user) return res.status(401).json({ message: 'Login required' })
    if (String(req.user._id) === req.params.id) {
      return res.status(400).json({ message: 'Cannot review yourself' })
    }

    const { rating, paymentRating, communicationRating, clarityRating, timeRespectRating, comment, role } = req.body
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating required (1-5)' })
    }

    // Mutual-completion enforcement: check person has at least one filled/completed opportunity
    const completedOpp = await Opportunity.findOne({
      poster: req.params.id,
      status: { $in: ['filled', 'completed'] },
      filledCount: { $gt: 0 },
    }).lean()
    if (!completedOpp) {
      return res.status(403).json({
        message: 'Reviews allowed only after completing work on an opportunity posted by this person',
      })
    }

    // Check duplicate
    const existing = await PersonReview.findOne({ person: req.params.id, reviewer: req.user._id })
    if (existing) {
      return res.status(400).json({ message: 'You have already reviewed this person' })
    }

    const review = await PersonReview.create({
      person: req.params.id,
      reviewer: req.user._id,
      application: null,
      rating,
      paymentRating: paymentRating || rating,
      communicationRating: communicationRating || rating,
      clarityRating: clarityRating || rating,
      timeRespectRating: timeRespectRating || rating,
      comment: comment || '',
      role: role || '',
    })

    res.status(201).json({ review, message: 'Review submitted successfully' })
  } catch (err) {
    console.error('[Person review create] Error:', err.message)
    res.status(500).json({ message: err.message })
  }
})

// POST /api/person/:id/follow — Follow/unfollow a person
router.post('/:id/follow', protect, async (req, res) => {
  try {
    const mongoose = require('mongoose')
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid person ID' })
    }

    const profile = await StudentProfile.findOneAndUpdate(
      { user: req.user._id },
      {},
      { upsert: true, new: true }
    )

    const already = profile.savedPersons.some(p => String(p) === req.params.id)
    if (already) {
      profile.savedPersons = profile.savedPersons.filter(p => String(p) !== req.params.id)
      await profile.save()
      return res.json({ saved: false, message: 'Unfollowed' })
    }

    profile.savedPersons.push(req.params.id)
    await profile.save()
    res.json({ saved: true, message: 'Following this poster' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/person/:id/follow — Check if following
router.get('/:id/follow', protect, async (req, res) => {
  try {
    const profile = await StudentProfile.findOne({ user: req.user._id }).lean()
    const saved = profile?.savedPersons?.some(p => String(p) === req.params.id) || false
    res.json({ saved })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/person/conversations - Get conversations for individual poster (any role)
router.get('/conversations', protect, async (req, res) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name email role')
      .populate('posting', 'title')
      .sort('-lastMessageAt')
      .lean()
    res.json({ conversations })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/person/conversations/:id/messages - Send message
router.post('/conversations/:id/messages', protect, async (req, res) => {
  try {
    const { text, attachments } = req.body
    if (!text?.trim() && (!attachments || attachments.length === 0)) {
      return res.status(400).json({ message: 'Message text or attachment required' })
    }

    const conv = await Conversation.findOne({ _id: req.params.id, participants: req.user._id })
    if (!conv) return res.status(404).json({ message: 'Conversation not found' })
    if (conv.status === 'blocked') return res.status(403).json({ message: 'Conversation is blocked' })

    const redFlagReasons = scanRedFlags(text)
    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user._id,
      senderRole: req.user.role || 'student',
      messageType: attachments?.length > 0 ? 'file' : 'text',
      text: text?.trim(),
      attachments: attachments || [],
      redFlagged: redFlagReasons.length > 0,
      redFlagReasons: redFlagReasons.length > 0 ? redFlagReasons : undefined,
    })

    conv.lastMessage = text?.trim() || (attachments?.[0]?.name || 'Sent a file')
    conv.lastMessageAt = new Date()
    conv.lastSender = req.user._id
    conv.participants.forEach(pId => {
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
      conv.participants.forEach(pId => {
        if (String(pId) !== String(req.user._id)) {
          const unread = conv.unreadCount.get(String(pId)) || 0
          io.sendUnreadUpdate(String(pId), String(conv._id), unread)
        }
      })
    }

    res.status(201).json({ message: populated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/person/conversations/:id/read - Mark messages as read
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

    res.json({ message: 'Messages marked as read' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

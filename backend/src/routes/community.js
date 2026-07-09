const router = require('express').Router()
const CommunityPost = require('../models/CommunityPost')
const Comment = require('../models/Comment')
const CommunityFollow = require('../models/CommunityFollow')
const CommunityAlert = require('../models/CommunityAlert')
const Notification = require('../models/Notification')
const { protect } = require('../middleware/auth')
const { uploadCommunityMedia, getFileUrl } = require('../middleware/upload')

// ─── Helpers ──────────────────────────────────────────────────────────────────
const SUSPICIOUS_KEYWORDS = [
  'registration fee', 'processing charge', 'pay to apply', 'application fee',
  'deposit', 'security fee', 'joining fee', 'registration charge',
  'money', 'payment', 'paytm', 'gpay', 'phonepe', 'upi',
]
const REFERRAL_SCAM_KEYWORDS = [
  'pay for referral', 'referral fee', 'paid referral', 'buy referral',
  'referral charge', 'payment for ref', 'money for ref',
]

function hasSuspiciousKeywords(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return SUSPICIOUS_KEYWORDS.some(kw => lower.includes(kw))
}

function hasReferralScamKeywords(text) {
  if (!text) return false
  const lower = text.toLowerCase()
  return REFERRAL_SCAM_KEYWORDS.some(kw => lower.includes(kw))
}

function calculateTrendingScore(post) {
  const ageHrs = (Date.now() - new Date(post.createdAt)) / (1000 * 60 * 60)
  const likeWeight = (post.engagement?.likes?.length || 0) * 2
  const commentWeight = (post.engagement?.commentCount || 0) * 3
  const shareWeight = (post.engagement?.shareCount || 0) * 2
  const viewWeight = (post.views || 0) * 0.5
  const score = (likeWeight + commentWeight + shareWeight + viewWeight) / Math.max(1, Math.pow(ageHrs + 2, 1.5))
  return Math.round(score * 100) / 100
}

async function checkDuplicatePost(userId, companyName, roleTitle) {
  if (!companyName || !roleTitle) return null
  const recent = await CommunityPost.findOne({
    postedBy: userId,
    companyName: { $regex: `^${companyName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    roleTitle: { $regex: `^${roleTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    status: { $in: ['active', 'under-review'] },
    createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
  }).lean()
  return recent
}

// ─── POST /api/community/upload-media ────────────────────────────────────────
router.post('/upload-media', protect, (req, res) => {
  uploadCommunityMedia(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ message: 'No files uploaded' })
    }
    const files = req.files.map(f => ({
      type: f.mimetype.startsWith('video/') ? 'video' : f.mimetype === 'application/pdf' ? 'pdf' : 'image',
      url: getFileUrl(req, 'community') || `/uploads/community/${f.filename}`,
      filename: f.originalname,
      size: f.size,
    }))
    res.json({ files })
  })
})

// ─── GET /api/community/posts ────────────────────────────────────────────────
router.get('/posts', async (req, res) => {
  try {
    const { page = 1, limit = 20, query, postType, category, sort, companyName, tag, userId } = req.query

    const filter = { status: { $nin: ['deleted', 'flagged', 'draft'] } }

    if (query) {
      filter.$or = [
        { description: { $regex: query, $options: 'i' } },
        { companyName: { $regex: query, $options: 'i' } },
        { roleTitle: { $regex: query, $options: 'i' } },
        { tags: { $regex: query, $options: 'i' } },
      ]
    }
    if (postType) filter.postType = postType
    if (category) filter.category = category
    if (companyName) filter.companyName = { $regex: companyName, $options: 'i' }
    if (tag) filter.tags = tag.toLowerCase()
    if (userId) filter.postedBy = userId

    let sortOpt = { isPinned: -1, createdAt: -1 }
    if (sort === 'trending') sortOpt = { isPinned: -1, 'trending.score': -1, createdAt: -1 }
    if (sort === 'most-helpful') sortOpt = { isPinned: -1, 'engagement.likes': -1, createdAt: -1 }

    const total = await CommunityPost.countDocuments(filter)
    const posts = await CommunityPost.find(filter)
      .populate('postedBy', 'name email isEmailVerified isPhoneVerified isIdVerified')
      .populate('taggedCompanyId', 'name logoUrl')
      .sort(sortOpt)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()

    const now = Date.now()
    for (const post of posts) {
      if (!post.trending?.lastUpdated || (now - new Date(post.trending.lastUpdated)) > 1000 * 60 * 60) {
        const score = calculateTrendingScore(post)
        CommunityPost.findByIdAndUpdate(post._id, { 'trending.score': score, 'trending.lastUpdated': now }).catch(() => {})
        post.trending = { score, lastUpdated: now }
      }
    }

    const trendingCompanies = await CommunityPost.distinct('companyName', {
      status: 'active',
      companyName: { $ne: '', $exists: true },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    })

    res.json({
      posts,
      trendingCompanies: trendingCompanies.slice(0, 15),
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── GET /api/community/posts/top-contributors ──────────────────────────────
router.get('/posts/top-contributors', async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const contributors = await CommunityPost.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: 'active' } },
      { $group: { _id: '$postedBy', postCount: { $sum: 1 }, totalLikes: { $sum: { $size: '$engagement.likes' } } } },
      { $sort: { postCount: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' },
      { $project: { _id: '$user._id', name: '$user.name', isEmailVerified: '$user.isEmailVerified', isPhoneVerified: '$user.isPhoneVerified', isIdVerified: '$user.isIdVerified', postCount: 1, totalLikes: 1 } },
    ])
    res.json({ contributors })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── GET /api/community/posts/trending-tags ────────────────────────────────
router.get('/posts/trending-tags', async (req, res) => {
  try {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const tags = await CommunityPost.aggregate([
      { $match: { createdAt: { $gte: weekAgo }, status: 'active' } },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 },
      { $project: { tag: '$_id', count: 1, _id: 0 } },
    ])
    res.json({ tags })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── GET /api/community/posts/tag/:tag ─────────────────────────────────────
router.get('/posts/tag/:tag', async (req, res) => {
  try {
    const { page = 1, limit = 20, sort } = req.query
    const tag = req.params.tag.toLowerCase()

    const filter = { tags: tag, status: 'active' }
    let sortOpt = { isPinned: -1, createdAt: -1 }
    if (sort === 'trending') sortOpt = { isPinned: -1, 'trending.score': -1, createdAt: -1 }

    const total = await CommunityPost.countDocuments(filter)
    const posts = await CommunityPost.find(filter)
      .populate('postedBy', 'name isEmailVerified isPhoneVerified isIdVerified')
      .populate('taggedCompanyId', 'name logoUrl')
      .sort(sortOpt)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()

    // Month stats
    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const monthCount = await CommunityPost.countDocuments({ tags: tag, createdAt: { $gte: monthAgo }, status: 'active' })

    // Check if tag matches a registered company
    const Company = require('../models/Company')
    const company = await Company.findOne({ name: { $regex: `^${tag}$`, $options: 'i' } }).select('name logoUrl website slug').lean()

    res.json({ posts, total, page: Number(page), pages: Math.ceil(total / limit), monthCount, company })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── GET /api/community/posts/company/:companyId ──────────────────────────
router.get('/posts/company/:companyId', async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const Company = require('../models/Company')
    const company = await Company.findById(req.params.companyId).select('name logoUrl website slug description').lean()
    if (!company) return res.status(404).json({ message: 'Company not found' })

    const filter = {
      $or: [
        { taggedCompanyId: company._id },
        { companyName: { $regex: `^${company.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      ],
      status: 'active',
    }

    const total = await CommunityPost.countDocuments(filter)
    const posts = await CommunityPost.find(filter)
      .populate('postedBy', 'name isEmailVerified isPhoneVerified isIdVerified')
      .populate('taggedCompanyId', 'name logoUrl')
      .sort({ isPinned: -1, createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()

    // Merge company's own verified openings
    const Job = require('../models/Job')
    const Internship = require('../models/Internship')
    const companyJobs = await Job.find({ company: company._id, status: 'approved' }).sort({ createdAt: -1 }).limit(5).lean()
    const companyInternships = await Internship.find({ company: company._id, status: 'approved' }).sort({ createdAt: -1 }).limit(5).lean()

    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    const monthCount = await CommunityPost.countDocuments({ ...filter, createdAt: { $gte: monthAgo } })

    res.json({ posts, company, companyJobs, companyInternships, total, page: Number(page), pages: Math.ceil(total / limit), monthCount })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── GET /api/community/posts/:id ──────────────────────────────────────────
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    )
      .populate('postedBy', 'name email isEmailVerified isPhoneVerified isIdVerified')
      .populate('taggedCompanyId', 'name logoUrl website')
      .lean()

    if (!post || post.status === 'deleted') {
      return res.status(404).json({ message: 'Post not found' })
    }

    const relatedPosts = await CommunityPost.find({
      _id: { $ne: post._id },
      status: 'active',
      $or: [
        { companyName: post.companyName },
        { category: post.category },
      ],
    })
      .populate('postedBy', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    const posterRecent = await CommunityPost.find({
      _id: { $ne: post._id },
      postedBy: post.postedBy?._id,
      status: { $nin: ['deleted', 'draft'] },
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean()

    res.json({ post, relatedPosts, posterRecent })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/posts ─────────────────────────────────────────────
router.post('/posts', protect, (req, res) => {
  uploadCommunityMedia(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })

    try {
      const { postType, category, companyName, taggedCompanyId, roleTitle, location, applicationLink, deadline, description, sourceAttribution, tags, status: reqStatus, referralProcess, referralSlots, referrerWorkEmail } = req.body

      if (!postType) return res.status(400).json({ message: 'Post type is required' })

      const isDraft = reqStatus === 'draft'

      // Referral extra validation
      if (postType === 'Referral' && !isDraft) {
        if (!referralProcess) return res.status(400).json({ message: 'Referral process description is required' })
        if (!req.user.isIdVerified && !req.user.isEmailVerified) {
          return res.status(403).json({ message: 'Referral posts require verified identity. Please verify your email or ID first.' })
        }
        if (referrerWorkEmail && !referrerWorkEmail.includes('@')) {
          return res.status(400).json({ message: 'Invalid work email' })
        }
        if (description && hasReferralScamKeywords(description + ' ' + (roleTitle || ''))) {
          return res.status(403).json({ message: 'Referral post contains prohibited payment keywords' })
        }
      }

      // Duplicate detection
      if (!isDraft) {
        const dup = await checkDuplicatePost(req.user._id, companyName, roleTitle)
        if (dup) {
          // Don't block, but return warning
          // We'll still create the post but frontend can show warning
        }
      }

      let media = []
      if (req.files && req.files.length > 0) {
        media = req.files.map(f => ({
          type: f.mimetype.startsWith('video/') ? 'video' : f.mimetype === 'application/pdf' ? 'pdf' : 'image',
          url: getFileUrl(req, 'community') || `/uploads/community/${f.filename}`,
          filename: f.originalname,
          size: f.size,
        }))
      }

      const parsedTags = tags
        ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase()))
        : []

      let status = 'active'
      if (isDraft) {
        status = 'draft'
      } else if (postType === 'Referral') {
        // Referral posts go to review automatically for extra safety
        status = 'under-review'
      } else if (hasSuspiciousKeywords(description + ' ' + (roleTitle || '') + ' ' + (companyName || ''))) {
        status = 'under-review'
      }

      const postData = {
        postedBy: req.user._id,
        postType,
        category: category || 'General',
        companyName: companyName || '',
        taggedCompanyId: taggedCompanyId || undefined,
        roleTitle: roleTitle || '',
        location: location || '',
        applicationLink: applicationLink || '',
        deadline: deadline || undefined,
        description: description || '',
        media,
        sourceAttribution: sourceAttribution || '',
        tags: parsedTags,
        status,
        lastConfirmedActive: isDraft ? undefined : new Date(),
        referralProcess: referralProcess || '',
        referralSlots: referralSlots || undefined,
        referrerWorkEmail: referrerWorkEmail || undefined,
      }

      const post = await CommunityPost.create(postData)

      // Duplicate warning (not blocking)
      let warning = null
      if (!isDraft) {
        const dup = await checkDuplicatePost(req.user._id, companyName, roleTitle)
        if (dup && String(dup._id) !== String(post._id)) {
          warning = { message: 'Similar post already exists', existingPostId: dup._id }
        }
      }

      // Notify followers about new post
      if (status === 'active') {
        const io = req.app.get('io')
        const followers = await CommunityFollow.find({
          targetType: 'user',
          targetUser: req.user._id,
        }).lean()
        for (const f of followers) {
          const notif = { title: `${req.user.name} posted a new ${postType}`, message: roleTitle || companyName || 'Check it out', icon: '📢', link: `/community/post/${post._id}` }
          if (io) io.sendNotification(f.user, notif).catch(() => {})
          else Notification.create({ user: f.user, ...notif }).catch(() => {})
        }
      }

      const populated = await CommunityPost.findById(post._id)
        .populate('postedBy', 'name email isEmailVerified isPhoneVerified isIdVerified')
        .lean()

      res.status(201).json({ post: populated, warning })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })
})

// ─── PUT /api/community/posts/:id ──────────────────────────────────────────
router.put('/posts/:id', protect, (req, res) => {
  uploadCommunityMedia(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message })

    try {
      const post = await CommunityPost.findById(req.params.id)
      if (!post) return res.status(404).json({ message: 'Post not found' })
      if (String(post.postedBy) !== String(req.user._id) && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Not authorized' })
      }

      const allowedFields = [
        'postType', 'category', 'companyName', 'taggedCompanyId', 'roleTitle',
        'location', 'applicationLink', 'deadline', 'description',
        'sourceAttribution', 'tags', 'referralProcess', 'referralSlots', 'referrerWorkEmail',
      ]

      const changedFields = []
      for (const field of allowedFields) {
        if (req.body[field] !== undefined) {
          if (field === 'tags') {
            const newTags = Array.isArray(req.body.tags)
              ? req.body.tags.map(t => t.replace(/^#/, '').toLowerCase())
              : req.body.tags.split(',').map(t => t.trim().replace(/^#/, '').toLowerCase())
            if (JSON.stringify(post.tags) !== JSON.stringify(newTags)) changedFields.push('tags')
            post.tags = newTags
          } else {
            if (String(post[field] || '') !== String(req.body[field] || '')) changedFields.push(field)
            post[field] = req.body[field]
          }
        }
      }

      if (req.files && req.files.length > 0) {
        const newMedia = req.files.map(f => ({
          type: f.mimetype.startsWith('video/') ? 'video' : f.mimetype === 'application/pdf' ? 'pdf' : 'image',
          url: getFileUrl(req, 'community') || `/uploads/community/${f.filename}`,
          filename: f.originalname,
          size: f.size,
        }))
        post.media = [...post.media, ...newMedia]
        changedFields.push('media')
      }

      if (changedFields.length > 0) {
        post.isEdited = true
        post.editedAt = new Date()
        if (!post.editHistory) post.editHistory = []
        post.editHistory.push({ editedAt: new Date(), changedFields })
        if (hasSuspiciousKeywords(post.description + ' ' + (post.roleTitle || '') + ' ' + (post.companyName || ''))) {
          post.status = 'under-review'
        }
      }

      if (post.status === 'draft' && req.body.status === 'active') {
        post.status = hasSuspiciousKeywords(post.description + ' ' + (post.roleTitle || '')) ? 'under-review' : 'active'
        post.lastConfirmedActive = new Date()
        changedFields.push('status')
      }

      await post.save()

      const populated = await CommunityPost.findById(post._id)
        .populate('postedBy', 'name email isEmailVerified isPhoneVerified isIdVerified')
        .populate('taggedCompanyId', 'name logoUrl')
        .lean()

      res.json({ post: populated })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  })
})

// ─── DELETE /api/community/posts/:id ───────────────────────────────────────
router.delete('/posts/:id', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    if (String(post.postedBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }
    post.status = 'deleted'
    post.isActive = false
    await post.save()
    res.json({ message: 'Post deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/posts/:id/like ──────────────────────────────────
router.post('/posts/:id/like', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    const userId = req.user._id
    const idx = post.engagement.likes.indexOf(userId)
    if (idx > -1) { post.engagement.likes.splice(idx, 1) }
    else { post.engagement.likes.push(userId) }
    await post.save()
    res.json({ liked: idx === -1, likeCount: post.engagement.likes.length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/posts/:id/save ──────────────────────────────────
router.post('/posts/:id/save', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    const userId = req.user._id
    const idx = post.engagement.saves.indexOf(userId)
    if (idx > -1) { post.engagement.saves.splice(idx, 1) }
    else { post.engagement.saves.push(userId) }
    await post.save()
    res.json({ saved: idx === -1, saveCount: post.engagement.saves.length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/posts/:id/share ────────────────────────────────
router.post('/posts/:id/share', async (req, res) => {
  try {
    const post = await CommunityPost.findByIdAndUpdate(req.params.id, { $inc: { 'engagement.shareCount': 1 } }, { new: true })
    if (!post) return res.status(404).json({ message: 'Post not found' })
    res.json({ shareCount: post.engagement.shareCount })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/posts/:id/click ────────────────────────────────
router.post('/posts/:id/click', async (req, res) => {
  try {
    await CommunityPost.findByIdAndUpdate(req.params.id, { $inc: { clickThroughs: 1 } })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/posts/:id/confirm-active ─────────────────────
router.post('/posts/:id/confirm-active', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    if (String(post.postedBy) !== String(req.user._id)) return res.status(403).json({ message: 'Not authorized' })
    post.lastConfirmedActive = new Date()
    if (post.status === 'expired') { post.status = 'active'; post.isActive = true }
    await post.save()
    res.json({ message: 'Post confirmed active', post })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/posts/:id/mark-expired ────────────────────────
router.post('/posts/:id/mark-expired', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    if (String(post.postedBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }
    post.status = 'expired'
    post.isActive = false
    await post.save()
    res.json({ message: 'Post marked as expired' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/posts/:id/bump ────────────────────────────────
router.post('/posts/:id/bump', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    if (String(post.postedBy) !== String(req.user._id)) return res.status(403).json({ message: 'Not authorized' })
    if (post.status !== 'active') return res.status(400).json({ message: 'Only active posts can be bumped' })

    const cooldown = 7 * 24 * 60 * 60 * 1000 // 7 days
    if (post.lastBumpedAt && (Date.now() - new Date(post.lastBumpedAt)) < cooldown) {
      const daysLeft = Math.ceil((cooldown - (Date.now() - new Date(post.lastBumpedAt))) / (24 * 60 * 60 * 1000))
      return res.status(429).json({ message: `Please wait ${daysLeft} day(s) before bumping again` })
    }

    post.lastBumpedAt = new Date()
    post.bumpCount = (post.bumpCount || 0) + 1
    // Set createdAt to now so it appears at top
    post.createdAt = new Date()
    await post.save()

    res.json({ message: 'Post bumped', bumpCount: post.bumpCount })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── GET /api/community/posts/:id/analytics ───────────────────────────
router.get('/posts/:id/analytics', protect, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id).lean()
    if (!post) return res.status(404).json({ message: 'Post not found' })
    if (String(post.postedBy) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' })
    }
    res.json({
      views: post.views || 0,
      clickThroughs: post.clickThroughs || 0,
      likes: post.engagement?.likes?.length || 0,
      saves: post.engagement?.saves?.length || 0,
      shares: post.engagement?.shareCount || 0,
      comments: post.engagement?.commentCount || 0,
      bumpCount: post.bumpCount || 0,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/posts/:id/report ─────────────────────────────
router.post('/posts/:id/report', protect, async (req, res) => {
  try {
    const { reason, description } = req.body
    if (!reason) return res.status(400).json({ message: 'Reason is required' })
    const allowedReasons = ['Fake/Scam', 'Expired', 'Spam', 'Inappropriate', 'Copyright']
    if (!allowedReasons.includes(reason)) return res.status(400).json({ message: 'Invalid reason' })
    const Report = require('../models/Report')
    await Report.create({ reporter: req.user._id, type: 'community_post', targetId: req.params.id, reason, description: description || '' })
    await CommunityPost.findByIdAndUpdate(req.params.id, { $inc: { reportCount: 1 } })
    res.json({ message: 'Report submitted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── GET /api/community/posts/:id/comments ─────────────────────────────
router.get('/posts/:id/comments', async (req, res) => {
  try {
    const comments = await Comment.find({ post: req.params.id, isDeleted: false, parentComment: null })
      .populate('author', 'name isEmailVerified isPhoneVerified isIdVerified')
      .sort({ createdAt: -1 })
      .lean()
    const commentIds = comments.map(c => c._id)
    const replies = await Comment.find({ post: req.params.id, isDeleted: false, parentComment: { $in: commentIds } })
      .populate('author', 'name isEmailVerified isPhoneVerified isIdVerified')
      .sort({ createdAt: 1 })
      .lean()
    const replyMap = {}
    replies.forEach(r => { const pid = String(r.parentComment); if (!replyMap[pid]) replyMap[pid] = []; replyMap[pid].push(r) })
    comments.forEach(c => { c.replies = replyMap[String(c._id)] || [] })
    const total = comments.length + replies.length
    res.json({ comments, total })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/posts/:id/comments ───────────────────────────
router.post('/posts/:id/comments', protect, async (req, res) => {
  try {
    const { text, parentCommentId } = req.body
    if (!text || !text.trim()) return res.status(400).json({ message: 'Comment text is required' })
    const mentionRegex = /@(\w+)/g
    const mentionMatches = text.match(mentionRegex)
    const mentionNames = mentionMatches ? mentionMatches.map(m => m.slice(1).toLowerCase()) : []
    let mentions = []
    if (mentionNames.length > 0) {
      const User = require('../models/User')
      mentions = await User.find({ name: { $in: mentionNames.map(n => new RegExp(`^${n}$`, 'i')) } }).select('_id')
      mentions = mentions.map(u => u._id)
    }
    const comment = await Comment.create({ post: req.params.id, author: req.user._id, text: text.trim(), parentComment: parentCommentId || null, mentions })
    await CommunityPost.findByIdAndUpdate(req.params.id, { $inc: { 'engagement.commentCount': 1 } })

    // Notifications
    const post = await CommunityPost.findById(req.params.id).select('postedBy')
    if (post && String(post.postedBy) !== String(req.user._id)) {
      const io = req.app.get('io')
      const notifData = { title: 'New comment on your post', message: text.trim().slice(0, 100), icon: '💬', link: `/community/post/${req.params.id}` }
      if (io) io.sendNotification(post.postedBy, notifData).catch(() => {})
      else Notification.create({ user: post.postedBy, ...notifData }).catch(() => {})
    }
    if (parentCommentId) {
      const parentComment = await Comment.findById(parentCommentId).select('author')
      if (parentComment && String(parentComment.author) !== String(req.user._id)) {
        Notification.create({ user: parentComment.author, title: 'Reply to your comment', message: text.trim().slice(0, 100), icon: '↩️', link: `/community/post/${req.params.id}` }).catch(() => {})
      }
    }
    const populated = await Comment.findById(comment._id).populate('author', 'name isEmailVerified isPhoneVerified isIdVerified').lean()
    res.status(201).json({ comment: populated })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── DELETE /api/community/comments/:id ───────────────────────────────
router.delete('/comments/:id', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })
    if (String(comment.author) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ message: 'Not authorized' })
    comment.isDeleted = true; await comment.save()
    await CommunityPost.findByIdAndUpdate(comment.post, { $inc: { 'engagement.commentCount': -1 } })
    res.json({ message: 'Comment deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/comments/:id/like ───────────────────────────
router.post('/comments/:id/like', protect, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
    if (!comment) return res.status(404).json({ message: 'Comment not found' })
    const userId = req.user._id
    const idx = comment.likes.indexOf(userId)
    if (idx > -1) comment.likes.splice(idx, 1); else comment.likes.push(userId)
    await comment.save()
    res.json({ liked: idx === -1, likeCount: comment.likes.length })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── POST /api/community/comments/:id/report ──────────────────────────
router.post('/comments/:id/report', protect, async (req, res) => {
  try {
    const { reason } = req.body
    if (!reason) return res.status(400).json({ message: 'Reason is required' })
    const allowedReasons = ['Spam', 'Inappropriate', 'Harassment', 'Fake/Scam', 'Copyright']
    if (!allowedReasons.includes(reason)) return res.status(400).json({ message: 'Invalid reason' })
    const Report = require('../models/Report')
    await Report.create({ reporter: req.user._id, type: 'community_comment', targetId: req.params.id, reason, description: req.body.description || '' })
    await Comment.findByIdAndUpdate(req.params.id, { $inc: { reportCount: 1 } })
    res.json({ message: 'Comment reported' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Follow endpoints ──────────────────────────────────────────────────────
router.post('/follow', protect, async (req, res) => {
  try {
    const { targetType, targetUser, targetTag, targetCompany } = req.body
    if (!['user', 'tag', 'company'].includes(targetType)) return res.status(400).json({ message: 'Invalid target type' })
    if (targetType === 'user' && !targetUser) return res.status(400).json({ message: 'targetUser is required' })
    if (targetType === 'tag' && !targetTag) return res.status(400).json({ message: 'targetTag is required' })
    if (targetType === 'company' && !targetCompany) return res.status(400).json({ message: 'targetCompany is required' })
    const existing = await CommunityFollow.findOne({ user: req.user._id, targetType, ...(targetType === 'user' && { targetUser }), ...(targetType === 'tag' && { targetTag: targetTag.toLowerCase() }), ...(targetType === 'company' && { targetCompany }) })
    if (existing) return res.status(400).json({ message: 'Already following' })
    const follow = await CommunityFollow.create({ user: req.user._id, targetType, targetUser: targetType === 'user' ? targetUser : undefined, targetTag: targetType === 'tag' ? targetTag.toLowerCase() : undefined, targetCompany: targetType === 'company' ? targetCompany : undefined })
    res.status(201).json({ follow })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/follows', protect, async (req, res) => {
  try {
    const follows = await CommunityFollow.find({ user: req.user._id })
      .populate('targetUser', 'name email isEmailVerified isPhoneVerified isIdVerified')
      .populate('targetCompany', 'name logoUrl')
      .lean()
    res.json({ follows })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/follow/:id', protect, async (req, res) => {
  try {
    const follow = await CommunityFollow.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!follow) return res.status(404).json({ message: 'Follow not found' })
    res.json({ message: 'Unfollowed' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── User Hub ──────────────────────────────────────────────────────────────
router.get('/my/posts', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = { postedBy: req.user._id, status: { $ne: 'deleted' } }
    if (status) filter.status = status

    const total = await CommunityPost.countDocuments(filter)
    const posts = await CommunityPost.find(filter)
      .populate('taggedCompanyId', 'name logoUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()

    res.json({ posts, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/my/saves', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const filter = { 'engagement.saves': req.user._id, status: 'active' }
    const total = await CommunityPost.countDocuments(filter)
    const posts = await CommunityPost.find(filter)
      .populate('postedBy', 'name isEmailVerified isPhoneVerified isIdVerified')
      .populate('taggedCompanyId', 'name logoUrl')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean()
    res.json({ posts, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/my/activity', protect, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query
    const posts = await CommunityPost.find({ postedBy: req.user._id, status: { $nin: ['deleted', 'draft'] } })
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean()
    const comments = await Comment.find({ author: req.user._id, isDeleted: false })
      .populate('post', 'roleTitle companyName')
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .lean()
    res.json({ posts, comments, page: Number(page) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Alerts (Saved Search + Notify) ─────────────────────────────────────
router.get('/alerts', protect, async (req, res) => {
  try {
    const alerts = await CommunityAlert.find({ user: req.user._id }).sort({ createdAt: -1 }).lean()
    res.json({ alerts })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.post('/alerts', protect, async (req, res) => {
  try {
    const { name, filters } = req.body
    if (!filters || Object.keys(filters).length === 0) return res.status(400).json({ message: 'At least one filter is required' })
    const alert = await CommunityAlert.create({ user: req.user._id, name: name || 'Untitled Alert', filters })
    res.status(201).json({ alert })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.put('/alerts/:id', protect, async (req, res) => {
  try {
    const alert = await CommunityAlert.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { $set: req.body }, { new: true })
    if (!alert) return res.status(404).json({ message: 'Alert not found' })
    res.json({ alert })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.delete('/alerts/:id', protect, async (req, res) => {
  try {
    const alert = await CommunityAlert.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!alert) return res.status(404).json({ message: 'Alert not found' })
    res.json({ message: 'Alert deleted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Notification Preferences ────────────────────────────────────────────
router.get('/notif-prefs', protect, async (req, res) => {
  try {
    const User = require('../models/User')
    const user = await User.findById(req.user._id).select('communityNotifPrefs').lean()
    res.json({ prefs: user.communityNotifPrefs || {} })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/notif-prefs', protect, async (req, res) => {
  try {
    const allowed = ['followedUserPost', 'followedTagPost', 'commentReply', 'postLike', 'postComment', 'expiryReminder']
    const updates = {}
    for (const key of allowed) {
      if (typeof req.body[key] === 'boolean') updates[`communityNotifPrefs.${key}`] = req.body[key]
    }
    const User = require('../models/User')
    await User.findByIdAndUpdate(req.user._id, { $set: updates })
    res.json({ message: 'Preferences updated' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Admin: GET /api/admin/community/reported ─────────────────────────
router.get('/admin/reported', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' })
    const posts = await CommunityPost.find({ status: { $in: ['flagged', 'under-review'] } })
      .populate('postedBy', 'name email').sort({ reportCount: -1, createdAt: -1 }).lean()
    res.json({ posts })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/admin/posts', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' })
    const { page = 1, limit = 20, status } = req.query
    const filter = {}
    if (status) filter.status = status
    const total = await CommunityPost.countDocuments(filter)
    const posts = await CommunityPost.find(filter).populate('postedBy', 'name email').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean()
    res.json({ posts, total, page: Number(page), pages: Math.ceil(total / limit) })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.patch('/admin/posts/:id/status', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' })
    const { status } = req.body
    const allowedStatuses = ['active', 'expired', 'archived', 'flagged', 'under-review', 'deleted']
    if (!allowedStatuses.includes(status)) return res.status(400).json({ message: 'Invalid status' })
    const post = await CommunityPost.findByIdAndUpdate(req.params.id, { status, isActive: status === 'active' }, { new: true })
    if (!post) return res.status(404).json({ message: 'Post not found' })
    res.json({ post })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Admin: POST /api/admin/community/posts/:id/pin ───────────────────
router.post('/admin/posts/:id/pin', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' })
    const post = await CommunityPost.findById(req.params.id)
    if (!post) return res.status(404).json({ message: 'Post not found' })
    post.isPinned = !post.isPinned
    if (post.isPinned) { post.pinnedBy = req.user._id; post.pinnedAt = new Date() }
    else { post.pinnedBy = undefined; post.pinnedAt = undefined }
    await post.save()
    res.json({ isPinned: post.isPinned, post })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Admin: GET /api/admin/community/analytics ────────────────────────
router.get('/admin/analytics', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' })
    const now = new Date()
    const monthAgo = new Date(now - 30 * 24 * 60 * 60 * 1000)
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000)

    const [totalPosts, postsThisMonth, postsThisWeek, totalUsers, totalReports] = await Promise.all([
      CommunityPost.countDocuments({ status: { $nin: ['deleted'] } }),
      CommunityPost.countDocuments({ createdAt: { $gte: monthAgo } }),
      CommunityPost.countDocuments({ createdAt: { $gte: weekAgo } }),
      CommunityPost.distinct('postedBy', { status: { $nin: ['deleted'] } }).then(u => u.length),
      CommunityPost.aggregate([
        { $match: { reportCount: { $gt: 0 } } },
        { $group: { _id: '$companyName', count: { $sum: '$reportCount' } } },
        { $sort: { count: -1 } },
        { $limit: 10 },
      ]),
    ])

    res.json({ totalPosts, postsThisMonth, postsThisWeek, totalUsers, spamReportHeatmap: totalReports })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

router.get('/admin/comments/reported', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Access denied' })
    const comments = await Comment.find({ reportCount: { $gt: 0 }, isDeleted: false })
      .populate('author', 'name email').populate('post', 'description').sort({ reportCount: -1 }).lean()
    res.json({ comments })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

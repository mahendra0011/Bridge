const router = require('express').Router()
const path = require('path')
const multer = require('multer')
const ResumeTemplate = require('../models/ResumeTemplate')
const { protect } = require('../middleware/auth')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

const fileExtractUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 }
})

// Optional auth helper to check if a user is logged in without rejecting visitors
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization
    const token = (authHeader && authHeader.startsWith('Bearer ')) 
      ? authHeader.split(' ')[1] 
      : req.cookies?.token
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      req.user = await User.findById(decoded.id).select('-password')
    }
  } catch (err) {
    // Ignore invalid tokens for optional auth
  }
  next()
}

// GET /api/resume-templates — list published and user templates
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { type, category, search } = req.query
    const query = { isPublic: true }

    if (req.user) {
      // Show public templates OR user's own templates
      delete query.isPublic
      query.$or = [{ isPublic: true }, { user: req.user._id }]
    }

    if (type) {
      query.type = type
    }
    if (category && category !== 'All Templates') {
      query.category = new RegExp(category, 'i')
    }
    if (search) {
      query.$or = (query.$or || []).concat([
        { name: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { 'sampleUser.role': new RegExp(search, 'i') }
      ])
    }

    const templates = await ResumeTemplate.find(query)
      .populate('user', 'firstName lastName avatar headline')
      .sort({ stars: -1, createdAt: -1 })
      .limit(60)

    res.json({ templates })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/resume-templates/my — list user's own templates
router.get('/my', protect, async (req, res) => {
  try {
    const templates = await ResumeTemplate.find({ user: req.user._id })
      .sort({ updatedAt: -1 })
    res.json({ templates })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// GET /api/resume-templates/:id — get template details
router.get('/:id', optionalAuth, async (req, res) => {
  try {
    const template = await ResumeTemplate.findById(req.params.id)
      .populate('user', 'firstName lastName avatar headline')

    if (!template) {
      return res.status(404).json({ message: 'Template not found' })
    }

    if (!template.isPublic && (!req.user || template.user._id.toString() !== req.user._id.toString())) {
      return res.status(403).json({ message: 'This template is private' })
    }

    res.json({ template })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/resume-templates — create / publish a new template
router.post('/', protect, async (req, res) => {
  try {
    const {
      name,
      shortName,
      category,
      type,
      badges,
      primaryColor,
      colorHex,
      accentBg,
      fontFamily,
      atsScore,
      layoutStyle,
      sidebarWidth,
      description,
      sampleUser,
      latexCode,
      isPublic
    } = req.body

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Template name is required' })
    }

    const template = await ResumeTemplate.create({
      user: req.user._id,
      name: name.trim(),
      shortName: shortName?.trim() || name.trim().slice(0, 15),
      category: category || 'General & Custom',
      type: type || 'visual',
      badges: badges && badges.length ? badges : ['Custom', 'Community'],
      primaryColor: primaryColor || '2563eb',
      colorHex: colorHex || '#2563eb',
      accentBg: accentBg || '#eff6ff',
      fontFamily: fontFamily || 'sans',
      atsScore: atsScore || 95,
      layoutStyle: layoutStyle || 'split-sidebar',
      sidebarWidth: sidebarWidth || 35,
      description: description || '',
      sampleUser: sampleUser || {},
      latexCode: latexCode || '',
      isPublic: isPublic !== undefined ? isPublic : true
    })

    const populated = await ResumeTemplate.findById(template._id)
      .populate('user', 'firstName lastName avatar headline')

    res.status(201).json({ template: populated, message: 'Template published successfully!' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// PUT /api/resume-templates/:id — update user's own template
router.put('/:id', protect, async (req, res) => {
  try {
    const template = await ResumeTemplate.findOne({ _id: req.params.id, user: req.user._id })
    if (!template) {
      return res.status(404).json({ message: 'Template not found or unauthorized' })
    }

    const allowed = [
      'name', 'shortName', 'category', 'primaryColor', 'colorHex', 'accentBg',
      'fontFamily', 'atsScore', 'layoutStyle', 'sidebarWidth', 'description',
      'sampleUser', 'latexCode', 'isPublic', 'badges'
    ]

    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        template[field] = req.body[field]
      }
    })

    await template.save()
    res.json({ template, message: 'Template updated successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// DELETE /api/resume-templates/:id — delete user's template
router.delete('/:id', protect, async (req, res) => {
  try {
    const template = await ResumeTemplate.findOneAndDelete({ _id: req.params.id, user: req.user._id })
    if (!template) {
      return res.status(404).json({ message: 'Template not found or unauthorized' })
    }
    res.json({ message: 'Template deleted successfully' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/resume-templates/:id/star — star a template
router.post('/:id/star', protect, async (req, res) => {
  try {
    const template = await ResumeTemplate.findByIdAndUpdate(
      req.params.id,
      { $inc: { stars: 1 } },
      { new: true }
    )
    if (!template) return res.status(404).json({ message: 'Template not found' })
    res.json({ stars: template.stars })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/resume-templates/extract-file — parse PDF, TXT, MD, or JSON
router.post('/extract-file', fileExtractUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    const filename = req.file.originalname || 'document'
    const ext = path.extname(filename).toLowerCase()

    let text = ''
    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse')
      const data = await pdfParse(req.file.buffer)
      text = data.text || ''
    } else {
      text = req.file.buffer.toString('utf-8')
    }

    res.json({
      text: text.trim(),
      filename,
      size: req.file.size
    })
  } catch (err) {
    console.error('File extraction error:', err)
    res.status(500).json({ message: `Could not extract text: ${err.message}` })
  }
})

module.exports = router

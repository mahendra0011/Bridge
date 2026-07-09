const router = require('express').Router()
const { protect } = require('../middleware/auth')
const Report = require('../models/Report')
const User = require('../models/User')

router.post('/', protect, async (req, res) => {
  try {
    const { targetType, targetId, reason, description } = req.body
    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ message: 'targetType, targetId, and reason are required' })
    }

    const typeMap = { person: 'user', opportunity: 'job', agency: 'company' }
    const report = await Report.create({
      reporter: req.user._id,
      type: typeMap[targetType] || targetType,
      targetId,
      reason,
      description: description || '',
    })

    const admins = await User.find({ role: 'admin' }).select('_id')
    const io = req.app.get('io')
    if (io && admins.length > 0) {
      admins.forEach((admin) => {
        io.sendNotification(String(admin._id), {
          title: 'New Report',
          message: `Report: ${reason}`,
          icon: '⚠️',
          link: `/admin/reports/${report._id}`,
        })
      })
    }

    res.status(201).json({ report, message: 'Report submitted' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

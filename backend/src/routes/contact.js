const express = require('express')
const router = express.Router()

router.post('/', async (req, res) => {
  try {
    const { name, email, subject, message } = req.body
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'All fields are required' })
    }
    console.log(`[Contact] ${name} (${email}): ${subject} — ${message.substring(0, 80)}...`)
    res.json({ message: 'Message received. We will get back to you soon.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

module.exports = router

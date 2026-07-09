// Script to check saved search alerts and notify users of new matches.
// Run via: npm run check-alerts
// Or schedule with cron (e.g., every 6 hours):
//   0 */6 * * * cd /path/to/project && node backend/src/scripts/checkSavedSearchAlerts.js

require('dotenv').config({ path: require('path').join(__dirname, '../../.env') })
const mongoose = require('mongoose')
const SavedSearchAlert = require('../models/SavedSearchAlert')
const Job = require('../models/Job')
const Internship = require('../models/Internship')
const Notification = require('../models/Notification')

async function run() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI)
  console.log('[checkSavedSearchAlerts] Connected to MongoDB')

  const now = new Date()
  const activeAlerts = await SavedSearchAlert.find({ isActive: true }).populate('user', 'name email')

  let matched = 0
  for (const alert of activeAlerts) {
    try {
      const filters = alert.filters || {}
      const query = { status: 'active' }

      // Deadline filter: only show upcoming
      if (alert.kind === 'both' || alert.kind === 'job') {
        query.deadline = { $gte: now }
      }
      if (alert.kind === 'internship') {
        query.applicationDeadline = { $gte: now }
      }

      // Apply saved filters
      if (filters.query) {
        const regex = new RegExp(filters.query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        query.title = regex
      }
      if (filters.location) {
        const locRegex = new RegExp(filters.location.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
        query.location = locRegex
      }
      if (filters.mode) query.mode = filters.mode
      if (filters.category) query.category = filters.category
      if (filters.skills?.length) {
        query.skills = { $in: filters.skills.map(s => new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')) }
      }

      // Only find postings created after last notification
      if (alert.lastNotified) {
        query.createdAt = { $gt: alert.lastNotified }
      }

      let newMatches = []
      if (alert.kind === 'both' || alert.kind === 'job') {
        const jobs = await Job.find(query).limit(10)
        newMatches.push(...jobs.map(j => ({ ...j.toObject(), kind: 'job' })))
      }
      if (alert.kind === 'both' || alert.kind === 'internship') {
        const internships = await Internship.find(query).limit(10)
        newMatches.push(...internships.map(i => ({ ...i.toObject(), kind: 'internship' })))
      }

      if (newMatches.length > 0) {
        // Send notification to user
        await Notification.create({
          user: alert.user._id,
          title: `New ${alert.kind} matches found!`,
          message: `${newMatches.length} new ${alert.kind === 'both' ? 'jobs/internships' : alert.kind + 's'} matching "${alert.name || 'your search'}"`,
          icon: '🔍',
          link: '/saved-searches',
        })

        alert.lastNotified = now
        alert.lastMatchAt = now
        await alert.save()
        matched++
        console.log(`  [✓] Notified ${alert.user?.email || alert.user?._id} about ${newMatches.length} new matches for "${alert.name}"`)
      }
    } catch (err) {
      console.error(`  [✗] Error processing alert ${alert._id}: ${err.message}`)
    }
  }

  console.log(`[checkSavedSearchAlerts] Done — ${matched} users notified`)
  await mongoose.disconnect()
  process.exit(0)
}

run().catch(err => {
  console.error('[checkSavedSearchAlerts] Fatal:', err)
  process.exit(1)
})

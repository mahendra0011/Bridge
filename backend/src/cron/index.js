const cron = require('node-cron')
const axios = require('axios')
const SavedSearchAlert = require('../models/SavedSearchAlert')
const Job = require('../models/Job')
const Internship = require('../models/Internship')
const Notification = require('../models/Notification')
const Conversation = require('../models/Conversation')
const Message = require('../models/Message')
const StudentProfile = require('../models/StudentProfile')
const CommunityPost = require('../models/CommunityPost')
const Opportunity = require('../models/Opportunity')
const { sendEmail } = require('../utils/email')

/**
 * Helper to dispatch scheduled webhook notifications to external services via Axios
 */
async function dispatchWebhookNotification(url, payload) {
  try {
    const res = await axios.post(url, payload, { timeout: 10000 })
    return res.data
  } catch (err) {
    console.error('[cron:webhook] Dispatch failed:', err.message)
    return null
  }
}

function digestEmail(recipientName, summaryLines, link) {
  const rows = summaryLines.map(l => `
    <tr>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#0f172a;font-weight:600">${l.sender}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#475569">${l.preview}</td>
      <td style="padding:10px 16px;border-bottom:1px solid #e2e8f0;color:#94a3b8;font-size:13px">${l.time}</td>
    </tr>`).join('')

  return {
    subject: `New message digest — ${summaryLines.length} unread message${summaryLines.length > 1 ? 's' : ''}`,
    html: `
      <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;border:1px solid #e2e8f0;border-radius:12px">
        <h2 style="margin-top:0;color:#0f172a">Hi ${recipientName},</h2>
        <p style="color:#475569">You have <strong>${summaryLines.length}</strong> unread message${summaryLines.length > 1 ? 's' : ''} since your last visit:</p>
        <table style="width:100%;border-collapse:collapse;margin:24px 0;font-size:14px">${rows}</table>
        ${link ? `<div style="text-align:center;margin:28px 0"><a href="${link}" style="display:inline-block;padding:12px 24px;background:#6366f1;color:#fff;text-decoration:none;border-radius:8px;font-weight:700">Open messages</a></div>` : ''}
        <p style="color:#94a3b8;font-size:13px">Adjust your notification settings anytime from your dashboard.</p>
      </div>`
  }
}

async function checkSavedSearchAlerts() {
  const now = new Date()
  const activeAlerts = await SavedSearchAlert.find({ isActive: true }).populate('user', 'name email')

  let matched = 0
  for (const alert of activeAlerts) {
    try {
      const filters = alert.filters || {}
      const query = { status: 'approved' }

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

      if (alert.lastNotified) {
        query.createdAt = { $gt: alert.lastNotified }
      }

      let newMatches = []
      if (alert.kind === 'both' || alert.kind === 'job') {
        const jobs = await Job.find({ ...query, deadline: { $gte: now } }).limit(10)
        newMatches.push(...jobs.map(j => ({ ...j.toObject(), kind: 'job' })))
      }
      if (alert.kind === 'both' || alert.kind === 'internship') {
        const internships = await Internship.find({ ...query, applicationDeadline: { $gte: now } }).limit(10)
        newMatches.push(...internships.map(i => ({ ...i.toObject(), kind: 'internship' })))
      }

      if (newMatches.length > 0) {
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
      }
    } catch (err) {
      console.error(`[cron:saved-search] Error processing alert ${alert._id}: ${err.message}`)
    }
  }

  console.log(`[cron:saved-search] Done — ${matched} users notified of new matches`)
}

async function sendMessageDigests() {
  const now = new Date()
  const profiles = await StudentProfile.find({
    $or: [
      { 'settings.messageDigest': 'daily' },
      { 'settings.messageDigest': 'weekly' },
    ]
  }).populate('user', 'name email')

  let sent = 0
  for (const profile of profiles) {
    try {
      if (!profile.user?.email) continue
      const digestFreq = profile.settings.messageDigest
      const lastSent = profile.settings.lastDigestSentAt

      if (digestFreq === 'daily' && lastSent && (now - lastSent) < 24 * 60 * 60 * 1000) continue
      if (digestFreq === 'weekly' && lastSent && (now - lastSent) < 7 * 24 * 60 * 60 * 1000) continue

      const conversations = await Conversation.find({ participants: profile.user._id })
        .populate('participants', 'name')
        .lean()

      const summaryLines = []
      for (const conv of conversations) {
        const other = conv.participants.find(p => String(p._id) !== String(profile.user._id))
        if (!other) continue

        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: profile.user._id },
          readBy: { $ne: profile.user._id },
        })
        if (unreadCount === 0) continue

        const lastMsg = await Message.findOne({ conversation: conv._id })
          .sort({ createdAt: -1 })
          .lean()

        summaryLines.push({
          sender: other.name || 'Unknown',
          preview: lastMsg?.text
            ? (lastMsg.text.length > 80 ? lastMsg.text.slice(0, 80) + '...' : lastMsg.text)
            : lastMsg?.messageType === 'file' ? `📎 ${lastMsg.attachments?.[0]?.name || 'File'}` : 'New message',
          time: lastMsg ? new Date(lastMsg.createdAt).toLocaleDateString() : '',
        })
      }

      if (summaryLines.length === 0) continue

      const { subject, html } = digestEmail(
        profile.user.name,
        summaryLines,
        `${process.env.CLIENT_URL || 'http://localhost:5173'}/dashboard/messages`
      )
      await sendEmail({ to: profile.user.email, subject, html })

      profile.settings.lastDigestSentAt = now
      await profile.save()
      sent++
    } catch (err) {
      console.error(`[cron:digest] Error sending digest for ${profile.user?._id}: ${err.message}`)
    }
  }

  console.log(`[cron:digest] Done — ${sent} digest emails sent`)
}

async function checkOpportunityExpiry() {
  const now = new Date()

  // Auto-expire opportunities past deadline
  const expired = await Opportunity.updateMany(
    { status: 'active', deadline: { $lte: now } },
    { status: 'expired' }
  )
  if (expired.modifiedCount > 0) {
    console.log(`[cron:opportunity] Expired ${expired.modifiedCount} opportunities past deadline`)
  }

  // Auto-archive expired opportunities older than 30 days
  const archived = await Opportunity.updateMany(
    { status: 'expired', updatedAt: { $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    { status: 'archived' }
  )
  if (archived.modifiedCount > 0) {
    console.log(`[cron:opportunity] Archived ${archived.modifiedCount} old expired opportunities`)
  }
}

async function checkCommunityExpiry() {
  const now = new Date()

  // Mark posts as expired whose deadline has passed
  const expiredResult = await CommunityPost.updateMany(
    {
      status: 'active',
      deadline: { $lte: now },
    },
    {
      status: 'expired',
      isActive: false,
    }
  )

  if (expiredResult.modifiedCount > 0) {
    console.log(`[cron:community] Expired ${expiredResult.modifiedCount} posts`)
  }

  // Find posts that need confirmation (no activity in 14 days, no deadline)
  const staleThreshold = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
  const stalePosts = await CommunityPost.find({
    status: 'active',
    deadline: { $exists: false },
    $or: [
      { lastConfirmedActive: { $lte: staleThreshold } },
      { lastConfirmedActive: { $exists: false } },
    ],
  }).populate('postedBy', '_id')

  for (const post of stalePosts) {
    await Notification.create({
      user: post.postedBy._id,
      title: 'Is this still active?',
      message: `Your community post "${post.roleTitle || post.companyName || 'update'}" hasn't been confirmed in 14 days. Confirm it's still active.`,
      icon: '⏰',
      link: `/community/post/${post._id}`,
    })
  }

  if (stalePosts.length > 0) {
    console.log(`[cron:community] Sent ${stalePosts.length} stale-post reminders`)
  }

  // Auto-expire posts inactive for 30 days (no deadline, no confirmation)
  const inactivityThreshold = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const autoExpireResult = await CommunityPost.updateMany(
    {
      status: 'active',
      deadline: { $exists: false },
      $or: [
        { lastConfirmedActive: { $lte: inactivityThreshold } },
        { lastConfirmedActive: { $exists: false } },
      ],
    },
    { status: 'expired', isActive: false }
  )

  if (autoExpireResult.modifiedCount > 0) {
    console.log(`[cron:community] Auto-expired ${autoExpireResult.modifiedCount} posts (30d inactivity)`)
    // Notify the posters
    const expiredPosts = await CommunityPost.find({ status: 'expired', isActive: false }).sort({ updatedAt: -1 }).limit(autoExpireResult.modifiedCount).populate('postedBy', '_id')
    for (const post of expiredPosts) {
      await Notification.create({
        user: post.postedBy._id,
        title: 'Post auto-expired',
        message: `Your community post "${post.roleTitle || post.companyName || 'update'}" was auto-expired after 30 days of inactivity.`,
        icon: '⏳',
        link: `/community/post/${post._id}`,
      }).catch(() => {})
    }
  }

  // Auto-archive expired posts older than 30 days
  const archiveResult = await CommunityPost.updateMany(
    {
      status: 'expired',
      updatedAt: { $lte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
    { status: 'archived' }
  )

  if (archiveResult.modifiedCount > 0) {
    console.log(`[cron:community] Archived ${archiveResult.modifiedCount} old expired posts`)
  }
}

function initCronJobs() {
  // Saved search alerts every 6 hours
  cron.schedule('0 */6 * * *', () => {
    console.log('[cron:saved-search] Starting...')
    checkSavedSearchAlerts().catch(err => console.error('[cron:saved-search] Fatal:', err))
  })

  // Message digests every hour
  cron.schedule('0 * * * *', () => {
    console.log('[cron:digest] Starting...')
    sendMessageDigests().catch(err => console.error('[cron:digest] Fatal:', err))
  })

  // Community expiry check every hour
  cron.schedule('0 * * * *', () => {
    console.log('[cron:community] Starting...')
    checkCommunityExpiry().catch(err => console.error('[cron:community] Fatal:', err))
  })

  // Opportunity expiry check every hour
  cron.schedule('0 * * * *', () => {
    console.log('[cron:opportunity] Starting...')
    checkOpportunityExpiry().catch(err => console.error('[cron:opportunity] Fatal:', err))
  })

  console.log('[cron] Jobs initialized (saved-search: every 6h, digest: every hour, community: every hour, opportunity: every hour)')
}

module.exports = { initCronJobs, checkSavedSearchAlerts, sendMessageDigests, checkOpportunityExpiry, checkCommunityExpiry, dispatchWebhookNotification }

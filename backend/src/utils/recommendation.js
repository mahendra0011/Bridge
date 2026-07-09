const Job = require('../models/Job')
const Internship = require('../models/Internship')
const Company = require('../models/Company')
const Application = require('../models/Application')

// ─── Scoring weights ─────────────────────────────────────────────────────────
const WEIGHTS = {
  SKILL_MATCH:       40,
  CATEGORY_MATCH:    15,
  EXPERIENCE_MATCH:  10,
  LOCATION_MATCH:    10,
  MODE_MATCH:         5,
  RECENCY:           10,
  VERIFIED_COMPANY:   5,
  BOOSTED:            5,
  POPULARITY:         5,
}

/**
 * Score a posting against a student's profile data.
 * Returns a 0–100 score (sum of weighted sub-scores).
 */
function scorePosting(posting, { skills = [], preferredCategories = [], preferredLocations = [], year, savedPostingIds = [] }) {
  let score = 0
  const reasons = [] // human-readable breakdown for debugging / UI

  // ── 1. Skill match ──────────────────────────────────────────────────
  if (skills.length > 0 && posting.skills?.length > 0) {
    const postingSkills = posting.skills.map((s) => s.toLowerCase().trim())
    const studentSkills = skills.map((s) => s.toLowerCase().trim())
    const matched = studentSkills.filter((s) => postingSkills.some((ps) => ps.includes(s) || s.includes(ps)))
    if (matched.length > 0) {
      const skillScore = Math.min(WEIGHTS.SKILL_MATCH, (matched.length / postingSkills.length) * WEIGHTS.SKILL_MATCH)
      score += skillScore
      reasons.push(`Skills: +${skillScore.toFixed(1)} (${matched.join(', ')})`)
    }
  }

  // ── 2. Category match ──────────────────────────────────────────────
  if (posting.category && preferredCategories.length > 0) {
    if (preferredCategories.includes(posting.category.toLowerCase())) {
      score += WEIGHTS.CATEGORY_MATCH
      reasons.push(`Category: +${WEIGHTS.CATEGORY_MATCH}`)
    }
  }

  // ── 3. Experience match ─────────────────────────────────────────────
  if (posting.experience && year) {
    const yearNum = parseInt(year, 10)
    const expMap = { 'Fresher': 1, '0-1': 1, '1-2': 2, '2-3': 3, '3-5': 5, '5+': 6 }
    const reqExp = expMap[posting.experience] || 0
    // Student year -> experience approximation
    const studentExp = isNaN(yearNum) ? 0 : Math.min(6, Math.max(1, yearNum - 1))
    const diff = Math.abs(reqExp - studentExp)
    if (diff <= 1) {
      const expScore = Math.max(0, WEIGHTS.EXPERIENCE_MATCH - diff * 4)
      score += expScore
      reasons.push(`Experience: +${expScore.toFixed(1)}`)
    }
  }

  // ── 4. Location match ──────────────────────────────────────────────
  if (posting.location && preferredLocations.length > 0) {
    const postingLoc = posting.location.toLowerCase().trim()
    if (preferredLocations.some((pl) => postingLoc.includes(pl.toLowerCase()))) {
      score += WEIGHTS.LOCATION_MATCH
      reasons.push(`Location: +${WEIGHTS.LOCATION_MATCH}`)
    }
  }

  // ── 5. Mode match ─────────────────────────────────────────────────
  if (posting.mode === 'Remote') {
    score += WEIGHTS.MODE_MATCH
    reasons.push(`Remote: +${WEIGHTS.MODE_MATCH}`)
  }

  // ── 6. Recency ────────────────────────────────────────────────────
  const daysOld = (Date.now() - new Date(posting.createdAt).getTime()) / 86400000
  if (daysOld < 30) {
    const recencyScore = Math.max(0, WEIGHTS.RECENCY * (1 - daysOld / 30))
    score += recencyScore
    reasons.push(`Recency: +${recencyScore.toFixed(1)}`)
  }

  // ── 7. Verified company ───────────────────────────────────────────
  if (posting.company?.isVerified) {
    score += WEIGHTS.VERIFIED_COMPANY
    reasons.push(`Verified: +${WEIGHTS.VERIFIED_COMPANY}`)
  }

  // ── 8. Boosted posting ────────────────────────────────────────────
  if (posting.isBoosted) {
    score += WEIGHTS.BOOSTED
    reasons.push(`Boosted: +${WEIGHTS.BOOSTED}`)
  }

  // ── 9. Popularity ─────────────────────────────────────────────────
  const pop = posting.applicantsCount || 0
  if (pop > 0) {
    const popScore = Math.min(WEIGHTS.POPULARITY, (pop / 50) * WEIGHTS.POPULARITY)
    score += popScore
    reasons.push(`Popularity: +${popScore.toFixed(1)}`)
  }

  // ── 10. Saved bookmarks bonus ──────────────────────────────────────
  if (savedPostingIds.includes(String(posting._id))) {
    score += 5
    reasons.push(`Saved: +5`)
  }

  return { score: Math.round(score * 10) / 10, reasons }
}

/**
 * Get preferred categories by analyzing student's past applications.
 */
async function getPreferredCategories(applications) {
  if (!applications.length) return []
  const postingIds = applications.map((a) => a.posting)
  const [jobs, internships] = await Promise.all([
    Job.find({ _id: { $in: postingIds.filter((_, i) => applications[i].postingType === 'job') } }).select('category'),
    Internship.find({ _id: { $in: postingIds.filter((_, i) => applications[i].postingType === 'internship') } }).select('category'),
  ])
  const categories = [...jobs, ...internships].map((p) => p.category?.toLowerCase()).filter(Boolean)
  // Return most common categories
  const freq = {}
  categories.forEach((c) => { freq[c] = (freq[c] || 0) + 1 })
  return Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c)
}

/**
 * Main recommendation function.
 * Returns up to `limit` scored postings, sorted by score descending.
 */
async function getRecommendations(userId, profile, limit = 12) {
  const skills = profile?.skills || []
  const year = profile?.year || ''
  const savedPostingIds = [...(profile?.savedJobs || []), ...(profile?.savedInternships || [])].map((id) => String(id))

  // Get student's past applications to infer preferences
  const applications = await Application.find({ applicant: userId }).select('posting postingType')
  const preferredCategories = await getPreferredCategories(applications)

  // Preferred locations from profile
  const preferredLocations = profile?.location ? [profile.location] : []

  // Fetch all active, non-expired postings
  const now = new Date()
  const [jobs, internships] = await Promise.all([
    Job.find({
      deadline: { $gte: now },
      status: { $in: ['active', 'approved'] },
    }).populate('company', 'name logoUrl isVerified').lean(),
    Internship.find({
      applicationDeadline: { $gte: now },
      status: { $in: ['active', 'approved'] },
    }).populate('company', 'name logoUrl isVerified').lean(),
  ])

  // Get IDs the student has already applied to
  const appliedIds = new Set(applications.map((a) => String(a.posting)))

  const studentProfile = { skills, preferredCategories, preferredLocations, year, savedPostingIds }

  // Score each posting
  const scored = []

  jobs.forEach((j) => {
    if (!appliedIds.has(String(j._id))) {
      const { score, reasons } = scorePosting(j, studentProfile)
      scored.push({ ...j, kind: 'job', score, scoreReasons: reasons })
    }
  })

  internships.forEach((i) => {
    if (!appliedIds.has(String(i._id))) {
      const { score, reasons } = scorePosting(i, studentProfile)
      scored.push({ ...i, kind: 'internship', score, scoreReasons: reasons })
    }
  })

  // Sort by score descending, return top N
  scored.sort((a, b) => b.score - a.score)
  return scored.slice(0, limit)
}

module.exports = { getRecommendations, scorePosting }

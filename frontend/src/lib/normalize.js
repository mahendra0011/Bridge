const logoBgs = [
  'from-blue-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-violet-500 to-fuchsia-600',
  'from-cyan-500 to-blue-600',
  'from-amber-500 to-orange-600',
]

function logoBgFor(id) {
  const str = String(id || '')
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash + str.charCodeAt(i)) % logoBgs.length
  return logoBgs[hash]
}

function timeAgo(date) {
  if (!date) return ''
  const diffMs = Date.now() - new Date(date).getTime()
  const days = Math.floor(diffMs / 86400000)
  if (days <= 0) return 'Today'
  if (days === 1) return '1d ago'
  return `${days}d ago`
}

function daysLeft(deadline) {
  if (!deadline) return null
  const diffMs = new Date(deadline).getTime() - Date.now()
  const days = Math.ceil(diffMs / 86400000)
  if (days < 0) return { text: 'Closed', urgent: false, closed: true }
  if (days === 0) return { text: 'Last day', urgent: true, closed: false }
  if (days <= 3) return { text: `${days} days left`, urgent: true, closed: false }
  return { text: `${days} days left`, urgent: false, closed: false }
}

function formatDate(d) {
  if (!d) return null
  const date = new Date(d)
  return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatStartDate(d) {
  if (!d) return null
  const now = Date.now()
  const diffMs = new Date(d).getTime() - now
  if (diffMs <= 0) return { label: 'Started', raw: formatDate(d) }
  const days = Math.ceil(diffMs / 86400000)
  if (days <= 1) return { label: 'Starts immediately', raw: formatDate(d) }
  if (days <= 7) return { label: `Starts in ${days} days`, raw: formatDate(d) }
  return { label: `Starts ${formatDate(d)}`, raw: formatDate(d) }
}

export function normalizeOpportunity(doc, kind, overrides = {}) {
  if (!doc) return null
  const isJob = kind === 'job'
  const hasAgency = !!doc.agency
  const companyName = hasAgency
    ? (doc.agency?.agencyName || doc.agency?.name || 'Agency')
    : (doc.company?.name || doc.company?.email || 'Company')
  const salaryMin = doc.salaryMin || 0
  const salaryMax = doc.salaryMax || doc.salaryMin || 0
  const stipend = doc.stipend || 0

  return {
    id: doc._id,
    _id: doc._id,
    kind,
    title: doc.title,
    company: companyName,
    companyId: hasAgency ? (doc.agency?._id || doc.agencyId) : (doc.company?._id || doc.companyId),
    companyLogoUrl: hasAgency ? (doc.agency?.logoUrl || doc.agencyLogoUrl) : (doc.company?.logoUrl || doc.companyLogoUrl),
    companyVerified: hasAgency ? (doc.agency?.isVerified || false) : (doc.company?.isVerified || doc.companyVerified || false),
    agency: doc.agency || null,
    agencyId: doc.agency?._id || null,
    location: doc.location || 'Remote',
    mode: doc.mode || 'Remote',
    category: doc.category || 'General',
    pay: isJob
      ? salaryMin || salaryMax
        ? `₹${Number(salaryMin).toLocaleString()} – ₹${Number(salaryMax).toLocaleString()}`
        : 'Not disclosed'
      : stipend
        ? `₹${Number(stipend).toLocaleString()}/mo`
        : 'Unpaid',
    payValue: isJob ? salaryMin : stipend,
    type: isJob ? doc.employmentType || 'Full-time' : 'Internship',
    experience: isJob ? doc.experience || 'Not specified' : 'Student / Fresher',
    posted: timeAgo(doc.createdAt),
    deadline: daysLeft(doc.deadline),
    deadlineDate: doc.deadline || null,
    description: doc.description || '',
    skills: doc.skills || [],
    goodToHaveSkills: doc.goodToHaveSkills || [],
    benefits: doc.benefits || [],
    roles: doc.roles || [],
    qualifications: doc.qualifications || [],
    minimumEducation: doc.minimumEducation || '',
    certificationsRequired: doc.certificationsRequired || [],
    noticePeriod: doc.noticePeriod || '',
    shiftTiming: doc.shiftTiming || '',
    interviewProcess: doc.interviewProcess || '',
    joiningTimeline: doc.joiningTimeline || '',
    screeningQuestions: doc.screeningQuestions || [],
    vacancies: doc.vacancies || 1,
    status: doc.status,
    applicantsCount: doc.applicantsCount || 0,
    isBoosted: doc.isBoosted || false,
    logoBg: logoBgFor(doc._id),
    duration: doc.duration || null,
    stipend,
    startDate: formatStartDate(doc.startDate),
    hasPPO: doc.hasPPO || false,
    employmentType: doc.employmentType || (isJob ? 'Full-time' : null),
    applied: overrides.applied ?? false,
    applicationStatus: overrides.applicationStatus || null,
    raw: doc,
  }
}

export function normalizeList(docs, kind, appliedMap = {}) {
  return (docs || []).map((d) => {
    const key = `${kind}:${d._id}`
    const app = appliedMap[key]
    return normalizeOpportunity(d, kind, { applied: !!app, applicationStatus: app?.status || null })
  })
}

const mongoose = require('mongoose')

const studentProfileSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  firstName:  { type: String },
  lastName:   { type: String },
  phone:      { type: String },
  bio:        { type: String },
  college:    { type: String },
  degree:     { type: String },
  year:       { type: String },
  cgpa:       { type: String },
  linkedin:   { type: String },
  github:     { type: String },
  portfolio:  { type: String },
  skills:     [{ type: String }],
  resumeUrl:  { type: String },
  // Poster-specific fields
  tagline:    { type: String },
  occupation: { type: String },
  website:    { type: String },
  youtube:    { type: String },
  instagram:  { type: String },
  savedJobs:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
  savedInternships: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Internship' }],
  savedPersons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  experience: [{
    company:    { type: String, required: true },
    role:       { type: String, required: true },
    startDate:  { type: Date, required: true },
    endDate:    { type: Date },
    current:    { type: Boolean, default: false },
    description: { type: String },
    location:   { type: String },
  }],
  education:  [{
    college:      { type: String },
    degree:       { type: String },
    fieldOfStudy: { type: String },
    startYear:    { type: String },
    endYear:      { type: String },
    createdAt:    { type: Date, default: Date.now },
  }],
  documents:  [{
    name:      { type: String, required: true },
    type:      { type: String, enum: ['resume', 'cover_letter', 'other'], default: 'resume' },
    url:       { type: String, required: true },
    isDefault: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now },
  }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Open to Work
  openToWork:      { type: Boolean, default: false },
  headline:        { type: String },
  currentLocation: { type: String },
  openTo:          { type: String, enum: ['job', 'internship', 'both'], default: 'both' },
  relocate:        { type: Boolean },
  noticePeriod:    { type: String },
  expectedCTC:     { type: String },
  hideFromCurrentEmployer: { type: Boolean, default: false },
  preferredMode:   { type: String },
  lastActive:      { type: Date },

  // Projects
  projects: [{
    title:       { type: String, required: true },
    description: { type: String },
    techStack:   [{ type: String }],
    link:        { type: String },
    githubLink:  { type: String },
    startDate:   { type: Date },
    endDate:     { type: Date },
    current:     { type: Boolean, default: false },
  }],

  // Certifications
  certifications: [{
    name:          { type: String, required: true },
    issuingBody:   { type: String },
    date:          { type: Date },
    credentialId:  { type: String },
    credentialLink:{ type: String },
  }],

  // Achievements
  achievements: [{
    title:       { type: String, required: true },
    description: { type: String },
    date:        { type: Date },
    type:        { type: String, enum: ['hackathon', 'academic', 'competition', 'other'], default: 'other' },
  }],

  // Languages
  languages: [{
    language:   { type: String, required: true },
    proficiency:{ type: String, enum: ['Basic', 'Conversational', 'Professional', 'Native'], default: 'Professional' },
  }],

  // Job Preferences
  jobPreferences: {
    preferredRoles:       [{ type: String }],
    preferredLocations:   [{ type: String }],
    preferredCompanyType: { type: String, enum: ['startup', 'mnc', 'both'], default: 'both' },
    preferredEmploymentType: { type: String, enum: ['full-time', 'part-time', 'contract', 'internship', 'any'], default: 'any' },
    preferredWorkMode:   { type: String, enum: ['remote', 'hybrid', 'on-site', 'any'], default: 'any' },
    preferredIndustries: [{ type: String }],
  },

  // Blocked companies (by candidate)
  blockedCompanies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],

  // Contact reveal — companies that earned access to raw phone/email
  contactRevealedTo: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Company' }],

  // Video intro/pitch
  videoUrl: { type: String },

  // Link verification results
  linksVerified: {
    linkedin:  { type: Boolean, default: false },
    github:    { type: Boolean, default: false },
    portfolio: { type: Boolean, default: false },
  },

  settings: {
    emailNotifications:    { type: Boolean, default: true },
    applicationUpdates:   { type: Boolean, default: true },
    newMatchAlerts:       { type: Boolean, default: true },
    deadlineReminders:    { type: Boolean, default: true },
    marketingEmails:      { type: Boolean, default: false },
    profileVisibility:    { type: String, enum: ['public', 'private', 'companies_only'], default: 'public' },
    showEmail:            { type: Boolean, default: false },
    showPhone:            { type: Boolean, default: false },
    messageDigest:        { type: String, enum: ['instant', 'daily', 'weekly'], default: 'instant' },
    lastDigestSentAt:     { type: Date },
  },
}, { timestamps: true })

module.exports = mongoose.model('StudentProfile', studentProfileSchema)

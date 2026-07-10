const mongoose = require('mongoose')
const { slugify } = require('../utils/slugify')

const companySchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  name:        { type: String, required: true },
  email:       { type: String },
  website:     { type: String },
  location:    { type: String },
  size:        { type: String },
  industry:    { type: String },
  description: { type: String },
  logoUrl:     { type: String },
  linkedin:    { type: String },
  twitter:     { type: String },
  isVerified:   { type: Boolean, default: false },
  likelyVerified:{ type: Boolean, default: false },

  // Multi-step signup tracking
  signupStep:       { type: Number, default: 1, enum: [1, 2, 3] },
  isProfileComplete:{ type: Boolean, default: false },

  // Step 1 — Contact person
  contactPerson:    { type: String },
  designation:      { type: String, enum: ['Founder', 'HR Manager', 'Recruiter', 'Talent Acquisition', 'Other'] },

  // Step 2 — Profile
  foundedYear:      { type: Number },
  hqLocation:       { type: String },

  // Step 3 — Verification docs
  regNumber:        { type: String, unique: true, sparse: true },
  regCertificate:   { type: String },
  idProof:          { type: String },

  // Auto domain verification
  companyEmailDomain:{ type: String },
  domainVerified:    { type: Boolean, default: false },

  bannerUrl:     { type: String },
  slug:          { type: String, unique: true, sparse: true, index: true },
  officeLocations: [{ type: String }],
  culture:       { type: String },
  photos:        [{ type: String }],
  perks:         [{ type: String }], // Health insurance, remote-friendly, learning budget, etc.

  isActive:      { type: Boolean, default: true },
  bannedAt:      { type: Date },
  banReason:     { type: String },

  profileViews:  { type: Number, default: 0 },
  totalHires:    { type: Number, default: 0 },
  avgResponseTime: { type: Number, default: 0 }, // in hours

  feeComplaintCount: { type: Number, default: 0 },

  regStatus:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

  isClaimed:     { type: Boolean, default: false },
  claimedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  claimStatus:     { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },

  documents:   [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Anti-spam: daily chat initiation tracking
  chatInitiationCount: { type: Number, default: 0 },
  chatInitiationDate:  { type: Date },

  // Anti-spam: open-to-work invites
  otwInviteCount: { type: Number, default: 0 },
  otwInviteDate:  { type: Date },

  cannedReplies: [{
    _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
    title: { type: String },
    body:  { type: String },
  }],

  settings: { type: mongoose.Schema.Types.Mixed, default: {} },
  teamMembers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'recruiter', 'interviewer', 'viewer'], default: 'recruiter' },
    invitedAt: { type: Date, default: Date.now },
  }],
}, { timestamps: true })

// Auto-generate slug from company name
companySchema.pre('save', function(next) {
  if (!this.slug && this.name) {
    this.slug = slugify(this.name)
  }
  next()
})

// Calculate profile completion percent
companySchema.methods.calculateProfileCompletion = function() {
  const fields = [
    'logoUrl', 'description', 'size', 'industry', 'foundedYear',
    'hqLocation', 'website', 'linkedin', 'bannerUrl', 'photos'
  ]
  const filled = fields.filter(f => this[f]).length
  return Math.round((filled / fields.length) * 100)
}

module.exports = mongoose.model('Company', companySchema)
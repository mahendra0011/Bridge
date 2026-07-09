const mongoose = require('mongoose')

const SERVICE_CATEGORIES = [
  'Video Editing', 'Photo Editing/Photography', 'Graphic Design',
  'Digital Marketing', 'Content Writing', 'Web Development',
  'Social Media Management', 'Animation/VFX', 'SEO', 'Voice Over', 'Other',
]

const TEAM_SIZE_OPTIONS = ['1-5', '6-10', '11-25', '25+']

const agencySchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  agencyName:  { type: String, required: true },
  description: { type: String },
  website:     { type: String },
  city:        { type: String },
  logoUrl:     { type: String },
  coverBanner: { type: String },
  linkedin:    { type: String },
  idProof:     { type: String },
  isVerified:  { type: Boolean, default: false },
  foundedYear: { type: Number },
  teamSize:    { type: String, enum: TEAM_SIZE_OPTIONS },
  services:    [{ type: String, enum: SERVICE_CATEGORIES }],
  instagramsocialLinks:  {
    instagram: { type: String },
  },
  portfolioUrl: { type: String },
  instagram:    { type: String },
  udyamNumber:  { type: String },
  regCertificate: { type: String },
  isRegistered:   { type: Boolean, default: true },

  // Portfolio / Work samples
  portfolio: [{
    title: String,
    description: String,
    imageUrl: String,
    category: String,
    link: String,
  }],

  // Settings
  settings: {
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    newApplicantAlerts: { type: Boolean, default: true },
    messageAlerts: { type: Boolean, default: true },
    reviewAlerts: { type: Boolean, default: true },
    marketingEmails: { type: Boolean, default: false },
    profileVisibility: { type: String, enum: ['public', 'registered', 'private'], default: 'public' },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'Asia/Kolkata' },
  },

  // Signup tracking
  signupStep:       { type: Number, default: 1, enum: [1, 2] },
  isProfileComplete:{ type: Boolean, default: false },

  // Documents
  documents: [{ name: String, url: String, uploadedAt: { type: Date, default: Date.now } }],

  // Team
  teamMembers: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'editor' },
    invitedAt: { type: Date, default: Date.now },
  }],

  // Blocked users (for messaging)
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Post limit for unregistered agencies
  monthlyPostCount:  { type: Number, default: 0 },
  monthlyPostReset:  { type: Date },
  unregisteredLimit: { type: Number, default: 3 }, // max 3 posts/month if not registered

  // Stats
  totalHires:     { type: Number, default: 0 },
  avgResponseTime:{ type: String },
  profileViews:   { type: Number, default: 0 },

  // Slug & Status
  slug:     { type: String, unique: true, sparse: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true })

agencySchema.pre('save', function (next) {
  if (this.agencyName && !this.slug) {
    this.slug = this.agencyName
      .toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '')
  }
  next()
})

module.exports = mongoose.model('Agency', agencySchema)
module.exports.SERVICE_CATEGORIES = SERVICE_CATEGORIES
module.exports.TEAM_SIZE_OPTIONS = TEAM_SIZE_OPTIONS

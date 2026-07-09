const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name:            { type: String, required: true, trim: true },
  email:           { type: String, required: true, unique: true, lowercase: true },
  password:        { type: String, required: true, select: false },
  googleId:        { type: String, sparse: true },
  phone:           { type: String },
  role:            { type: String, enum: ['student', 'company', 'admin', 'agency', 'moderator', 'support'], default: 'student' },
  isBlocked:       { type: Boolean, default: false },
  isEmailVerified: { type: Boolean, default: false },
  isPhoneVerified: { type: Boolean, default: false },
  isIdVerified:    { type: Boolean, default: false },
  adminRoleId:     { type: mongoose.Schema.Types.ObjectId, ref: 'AdminRole' }, // For sub-admins/moderators

  // Person/Profile fields
  avatarUrl:       { type: String },
  profilePhoto:    { type: String },
  coverUrl:        { type: String },
  tagline:         { type: String },
  bio:             { type: String },
  location:        { type: String },
  designation:     { type: String }, // Used for occupation/context for individuals
  website:         { type: String },
  linkedin:        { type: String },
  youtube:         { type: String },
  instagram:       { type: String },
  acceptedTerms:   { type: Boolean, default: false },

  // OTP-based email verification (replaces link-based flow)
  otpCode:         { type: String, select: false },
  otpExpires:      { type: Date },
  otpAttempts:     { type: Number, default: 0 },
  // Legacy link-based token (kept for password reset etc.)
  emailVerifyToken:{ type: String },
  resetToken:      { type: String },
  resetTokenExp:   { type: Date },
  companyId:       { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  communityNotifPrefs: {
    followedUserPost:  { type: Boolean, default: true },
    followedTagPost:   { type: Boolean, default: true },
    commentReply:      { type: Boolean, default: true },
    postLike:          { type: Boolean, default: false },
    postComment:       { type: Boolean, default: true },
    expiryReminder:    { type: Boolean, default: true },
  },
}, { timestamps: true })

userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 12)
  next()
})

userSchema.methods.comparePassword = function(plain) {
  return bcrypt.compare(plain, this.password)
}

module.exports = mongoose.model('User', userSchema)
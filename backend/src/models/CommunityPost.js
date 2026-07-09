const mongoose = require('mongoose')

const mediaSchema = new mongoose.Schema({
  type: { type: String, enum: ['image', 'video', 'pdf'], required: true },
  url: { type: String, required: true },
  filename: String,
  size: Number,
  thumbnail: String,
}, { _id: false })

const communityPostSchema = new mongoose.Schema({
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postType: {
    type: String,
    enum: ['Job', 'Internship', 'Walk-in', 'Referral', 'General Update'],
    required: true,
  },
  category: {
    type: String,
    enum: ['IT', 'Non-IT', 'Government', 'Remote', 'General'],
    default: 'General',
  },
  companyName: { type: String, trim: true },
  taggedCompanyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  roleTitle: { type: String, trim: true },
  location: { type: String, trim: true },
  applicationLink: { type: String, trim: true },
  deadline: Date,
  description: { type: String, default: '' },
  media: [mediaSchema],
  sourceAttribution: { type: String, trim: true },
  tags: [{ type: String, trim: true, lowercase: true }],
  status: {
    type: String,
    enum: ['draft', 'active', 'expired', 'archived', 'flagged', 'under-review', 'deleted'],
    default: 'active',
  },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  isEdited: { type: Boolean, default: false },
  editedAt: Date,
  editHistory: [{
    editedAt: { type: Date, default: Date.now },
    changedFields: [String],
  }],
  isPinned: { type: Boolean, default: false },
  pinnedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  pinnedAt: Date,
  views: { type: Number, default: 0 },
  clickThroughs: { type: Number, default: 0 },
  bumpCount: { type: Number, default: 0 },
  lastBumpedAt: Date,
  engagement: {
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    commentCount: { type: Number, default: 0 },
    shareCount: { type: Number, default: 0 },
    saves: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  trending: {
    score: { type: Number, default: 0 },
    lastUpdated: Date,
  },
  reportCount: { type: Number, default: 0 },
  lastConfirmedActive: Date,
  referralProcess: { type: String, trim: true },
  referralSlots: { type: Number, min: 1 },
  referrerWorkEmail: { type: String, trim: true },
}, { timestamps: true })

communityPostSchema.index({ status: 1, createdAt: -1 })
communityPostSchema.index({ tags: 1 })
communityPostSchema.index({ companyName: 1 })
communityPostSchema.index({ 'engagement.likes': 1 })
communityPostSchema.index({ postType: 1 })
communityPostSchema.index({ category: 1 })
communityPostSchema.index({ deadline: 1 })
communityPostSchema.index({ isPinned: 1, createdAt: -1 })
communityPostSchema.index({ postedBy: 1, status: 1, createdAt: -1 })

module.exports = mongoose.model('CommunityPost', communityPostSchema)

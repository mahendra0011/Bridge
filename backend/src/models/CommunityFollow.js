const mongoose = require('mongoose')

const communityFollowSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetType: { type: String, enum: ['user', 'tag', 'company'], required: true },
  targetUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  targetTag: { type: String, trim: true, lowercase: true },
  targetCompany: { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
}, { timestamps: true })

communityFollowSchema.index({ user: 1, targetType: 1 })
communityFollowSchema.index({ targetUser: 1 })
communityFollowSchema.index({ targetTag: 1 })
communityFollowSchema.index(
  { user: 1, targetType: 1, targetUser: 1 },
  { unique: true, sparse: true }
)
communityFollowSchema.index(
  { user: 1, targetType: 1, targetTag: 1 },
  { unique: true, sparse: true }
)

module.exports = mongoose.model('CommunityFollow', communityFollowSchema)

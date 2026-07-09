const mongoose = require('mongoose')

const communityAlertSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, trim: true },
  filters: {
    query: String,
    postType: String,
    category: String,
    companyName: String,
    tag: String,
    location: String,
  },
  isActive: { type: Boolean, default: true },
  lastNotified: Date,
  lastMatchAt: Date,
}, { timestamps: true })

communityAlertSchema.index({ user: 1, isActive: 1 })

module.exports = mongoose.model('CommunityAlert', communityAlertSchema)

const mongoose = require('mongoose')

const reportSchema = new mongoose.Schema({
  reporter:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:        { type: String, enum: ['job', 'internship', 'company', 'user', 'message', 'conversation', 'community_post', 'community_comment'], required: true },
  targetId:    { type: mongoose.Schema.Types.ObjectId, required: true },
  reason:      { type: String, required: true },
  description: { type: String },
  status:      { type: String, enum: ['open', 'investigating', 'resolved', 'dismissed'], default: 'open' },
  resolvedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolution:  { type: String },
  resolvedAt:  { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('Report', reportSchema)

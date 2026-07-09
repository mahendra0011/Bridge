const mongoose = require('mongoose')

const conversationSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  application:  { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  posting:      { type: mongoose.Schema.Types.ObjectId, refPath: 'postingModel' },
  postingModel: { type: String, enum: ['Job', 'Internship', 'Opportunity'] },
  initiatedBy:  { type: String, enum: ['candidate', 'recruiter', 'agency', 'system'], default: 'recruiter' },
  status:       { type: String, enum: ['active', 'archived', 'blocked'], default: 'active' },
  lastMessage:  { type: String },
  lastSender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastMessageAt: { type: Date, default: Date.now },
  blockedBy:    [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  unreadCount:  { type: Map, of: Number, default: {} },
}, { timestamps: true })

conversationSchema.index({ participants: 1 })
conversationSchema.index({ application: 1 })
conversationSchema.index({ lastMessageAt: -1 })
conversationSchema.index({ 'participants': 1, 'lastMessageAt': -1 })

module.exports = mongoose.model('Conversation', conversationSchema)

const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  conversation: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', required: true, index: true },
  sender:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  senderRole:   { type: String, enum: ['student', 'company', 'admin', 'agency', 'system'], default: 'student' },
  messageType:  { type: String, enum: ['text', 'file', 'system'], default: 'text' },
  text:         { type: String },
  attachments:  [{
    name: { type: String },
    url:  { type: String },
    type: { type: String, enum: ['resume', 'cover_letter', 'offer_letter', 'other'] },
  }],
  readBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  // Red-flag auto-scan
  redFlagged:   { type: Boolean, default: false },
  redFlagReasons: [{ type: String }],
  redFlagReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // For system messages
  systemAction: { type: String },
  systemData:   { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

messageSchema.index({ conversation: 1, createdAt: 1 })

module.exports = mongoose.model('Message', messageSchema)

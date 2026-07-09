const mongoose = require('mongoose')

const ticketSchema = new mongoose.Schema({
  user:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject:    { type: String, required: true },
  message:    { type: String, required: true },
  category:   { type: String, enum: ['account', 'posting', 'application', 'payment', 'technical', 'other'], default: 'other' },
  priority:   { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  status:     { type: String, enum: ['open', 'in_progress', 'waiting', 'resolved', 'closed'], default: 'open' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  messages:   [{
    sender:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    content:  { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
  }],
  resolvedAt: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('SupportTicket', ticketSchema)

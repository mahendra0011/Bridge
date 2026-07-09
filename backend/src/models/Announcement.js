const mongoose = require('mongoose')

const announcementSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  content:   { type: String, required: true },
  type:      { type: String, enum: ['info', 'warning', 'update', 'maintenance'], default: 'info' },
  audience:  { type: String, enum: ['all', 'students', 'companies', 'admins'], default: 'all' },
  priority:  { type: String, enum: ['low', 'normal', 'high'], default: 'normal' },
  isActive:  { type: Boolean, default: true },
  expiresAt: { type: Date },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true })

module.exports = mongoose.model('Announcement', announcementSchema)

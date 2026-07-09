const mongoose = require('mongoose')

const savedSearchSchema = new mongoose.Schema({
  user:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:        { type: String },
  kind:        { type: String, enum: ['internship', 'job', 'both'], default: 'both' },
  filters:     { type: mongoose.Schema.Types.Mixed, required: true },
  frequency:   { type: String, enum: ['instant', 'daily', 'weekly'], default: 'instant' },
  isActive:    { type: Boolean, default: true },
  lastNotified:{ type: Date },
  lastMatchAt: { type: Date },
}, { timestamps: true })

module.exports = mongoose.model('SavedSearchAlert', savedSearchSchema)

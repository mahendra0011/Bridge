const mongoose = require('mongoose')

const bridgeSchema = new mongoose.Schema({
  title:       { type: String, required: true, trim: true },
  description: { type: String, required: true },
  type:        { type: String, enum: ['partnership', 'collaboration', 'integration', 'other'], default: 'other' },
  company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status:      { type: String, enum: ['pending', 'active', 'inactive', 'completed'], default: 'pending' },
  features:    [{ type: String }],
  startDate:   { type: Date },
  endDate:     { type: Date },
  metadata:    { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

module.exports = mongoose.model('Bridge', bridgeSchema)

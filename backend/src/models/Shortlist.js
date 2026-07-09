const mongoose = require('mongoose')

const shortlistSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  notes:     { type: String },
}, { timestamps: true })

shortlistSchema.index({ recruiter: 1, candidate: 1 }, { unique: true })
shortlistSchema.index({ company: 1, candidate: 1 })

module.exports = mongoose.model('Shortlist', shortlistSchema)

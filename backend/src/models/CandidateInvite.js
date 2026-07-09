const mongoose = require('mongoose')

const candidateInviteSchema = new mongoose.Schema({
  recruiter:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company:      { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  candidate:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  posting:      { type: mongoose.Schema.Types.ObjectId, refPath: 'postingModel' },
  postingModel: { type: String, enum: ['Job', 'Internship'] },
  status:       { type: String, enum: ['pending', 'accepted', 'declined', 'withdrawn'], default: 'pending' },
  message:      { type: String },
}, { timestamps: true })

candidateInviteSchema.index({ recruiter: 1, candidate: 1 })
candidateInviteSchema.index({ company: 1, candidate: 1 })

module.exports = mongoose.model('CandidateInvite', candidateInviteSchema)

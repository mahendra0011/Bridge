const mongoose = require('mongoose')

const recruiterNoteSchema = new mongoose.Schema({
  recruiter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  company:   { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  candidate: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content:   { type: String, required: true },
  tags:      [{ type: String }],
}, { timestamps: true })

recruiterNoteSchema.index({ recruiter: 1, candidate: 1 }, { unique: true })

module.exports = mongoose.model('RecruiterNote', recruiterNoteSchema)

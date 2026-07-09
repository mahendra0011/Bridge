const mongoose = require('mongoose')

const feedbackSchema = new mongoose.Schema({
  application:  { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  interviewer:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:       { type: Number, min: 1, max: 5, required: true },
  communication: { type: Number, min: 1, max: 5 },
  skills:       { type: Number, min: 1, max: 5 },
  notes:        { type: String },
  decision:     { type: String, enum: ['strong_hire', 'hire', 'maybe', 'no_hire', 'pending'], default: 'pending' },
  submittedAt:  { type: Date, default: Date.now },
}, { timestamps: true })

module.exports = mongoose.model('InterviewFeedback', feedbackSchema)

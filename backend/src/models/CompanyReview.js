const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  company:           { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  reviewer:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:            { type: Number, min: 1, max: 5, required: true },
  title:             { type: String },
  review:            { type: String },
  pros:              { type: String },
  cons:              { type: String },
  salary:            { type: String },
  salaryCurrency:    { type: String, default: 'INR' },
  interviewExp:      { type: String },
  interviewDifficulty: { type: String, enum: ['easy', 'medium', 'hard'] },
  isAnonymous:       { type: Boolean, default: false },
  isVerified:        { type: Boolean, default: false },
  status:            { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
}, { timestamps: true })

reviewSchema.index({ company: 1, reviewer: 1 }, { unique: true })

module.exports = mongoose.model('CompanyReview', reviewSchema)

const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  person:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reviewer:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  application:      { type: mongoose.Schema.Types.ObjectId, ref: 'Application', required: true },
  rating:           { type: Number, min: 1, max: 5, required: true },
  paymentRating:    { type: Number, min: 1, max: 5 },
  communicationRating: { type: Number, min: 1, max: 5 },
  clarityRating:    { type: Number, min: 1, max: 5 },
  timeRespectRating:{ type: Number, min: 1, max: 5 },
  comment:          { type: String, maxlength: 2000 },
  role:             { type: String },
  status:           { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
}, { timestamps: true })

reviewSchema.index({ person: 1, reviewer: 1 }, { unique: true })

module.exports = mongoose.model('PersonReview', reviewSchema)

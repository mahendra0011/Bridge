const mongoose = require('mongoose')

const reviewSchema = new mongoose.Schema({
  agency:            { type: mongoose.Schema.Types.ObjectId, ref: 'Agency', required: true },
  reviewer:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating:            { type: Number, min: 1, max: 5, required: true },
  qualityRating:     { type: Number, min: 1, max: 5 },
  communicationRating:{ type: Number, min: 1, max: 5 },
  turnaroundRating:  { type: Number, min: 1, max: 5 },
  paymentRating:     { type: Number, min: 1, max: 5 },
  title:             { type: String },
  review:            { type: String },
  isAnonymous:       { type: Boolean, default: false },
  isVerified:        { type: Boolean, default: false },
  status:            { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
}, { timestamps: true })

reviewSchema.index({ agency: 1, reviewer: 1 }, { unique: true })

module.exports = mongoose.model('AgencyReview', reviewSchema)

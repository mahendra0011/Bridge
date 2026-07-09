const mongoose = require('mongoose')

const planSchema = new mongoose.Schema({
  name:           { type: String, required: true },
  description:    { type: String },
  price:          { type: Number, required: true },
  currency:       { type: String, default: 'INR' },
  duration:       { type: String, enum: ['monthly', 'yearly', 'one_time'], required: true },
  jobPostLimit:   { type: Number, default: 0 },
  featuredLimit:  { type: Number, default: 0 },
  hasBadge:       { type: Boolean, default: false },
  hasPriority:    { type: Boolean, default: false },
  isActive:       { type: Boolean, default: true },
  features:       [String],
}, { timestamps: true })

module.exports = mongoose.model('BillingPlan', planSchema)

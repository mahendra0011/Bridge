const mongoose = require('mongoose')

const invoiceSchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  plan:       { type: mongoose.Schema.Types.ObjectId, ref: 'BillingPlan' },
  amount:     { type: Number, required: true },
  currency:   { type: String, default: 'INR' },
  status:     { type: String, enum: ['pending', 'paid', 'failed', 'refunded'], default: 'pending' },
  paidAt:     { type: Date },
  invoiceNo:  { type: String, unique: true },
  description: { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Invoice', invoiceSchema)

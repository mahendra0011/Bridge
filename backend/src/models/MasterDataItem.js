const mongoose = require('mongoose')

const masterDataSchema = new mongoose.Schema({
  type:   { type: String, enum: ['skill', 'category', 'location'], required: true },
  name:   { type: String, required: true },
  slug:   { type: String },
  active: { type: Boolean, default: true },
}, { timestamps: true })

masterDataSchema.index({ type: 1, name: 1 }, { unique: true })

module.exports = mongoose.model('MasterDataItem', masterDataSchema)

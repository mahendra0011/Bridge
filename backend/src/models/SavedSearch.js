const mongoose = require('mongoose')

const savedSearchSchema = new mongoose.Schema({
  user:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:   { type: String, required: true },
  kind:   { type: String, enum: ['job', 'internship', 'both'], default: 'both' },
  filters: {
    query:          { type: String },
    location:       { type: String },
    mode:           { type: String },
    category:       { type: String },
    skills:         [{ type: String }],
    salaryMin:      { type: Number },
    salaryMax:      { type: Number },
    stipendMin:     { type: Number },
    stipendMax:     { type: Number },
    employmentType: { type: String },
    experience:     { type: String },
  },
  notify: { type: Boolean, default: true },
}, { timestamps: true })

savedSearchSchema.index({ user: 1 })

module.exports = mongoose.model('SavedSearch', savedSearchSchema)

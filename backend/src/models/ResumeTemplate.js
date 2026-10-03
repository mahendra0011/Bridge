const mongoose = require('mongoose')

const resumeTemplateSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  name: { type: String, required: true, trim: true },
  shortName: { type: String, trim: true },
  category: { type: String, default: 'General & Custom' },
  type: { type: String, enum: ['visual', 'latex'], default: 'visual' },
  badges: [{ type: String }],
  primaryColor: { type: String, default: '2563eb' },
  colorHex: { type: String, default: '#2563eb' },
  accentBg: { type: String, default: '#eff6ff' },
  fontFamily: { type: String, default: 'sans' },
  atsScore: { type: Number, default: 95 },
  layoutStyle: { type: String, default: 'split-sidebar' },
  sidebarWidth: { type: Number, default: 35 },
  description: { type: String, default: '' },
  sampleUser: {
    name: { type: String, default: 'Alex Morgan' },
    role: { type: String, default: 'Software Engineer' },
    email: { type: String, default: 'alex.morgan@example.com' },
    phone: { type: String, default: '+1 (555) 234-5678' },
    location: { type: String, default: 'San Francisco, CA' },
    summary: { type: String, default: 'Experienced software engineer focused on building robust, scalable web applications.' },
    skills: [{ type: String }],
    experience: [{
      role: String,
      company: String,
      duration: String,
      points: [String]
    }],
    education: { type: String, default: 'B.S. in Computer Science' }
  },
  latexCode: { type: String, default: '' },
  isPublic: { type: Boolean, default: true },
  stars: { type: Number, default: 0 }
}, { timestamps: true })

resumeTemplateSchema.index({ user: 1, createdAt: -1 })
resumeTemplateSchema.index({ type: 1, isPublic: 1 })

module.exports = mongoose.model('ResumeTemplate', resumeTemplateSchema)

const mongoose = require('mongoose')

const basePostingSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  agency:      { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  skills:      [{ type: String }],
  goodToHaveSkills: [{ type: String }],
  location:    { type: String },
  mode:        { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'Remote' },
  category:    { type: String },
  vacancies:   { type: Number, default: 1 },
  deadline:    { type: Date },
  benefits:    [{ type: String }],
  status:      { type: String, enum: ['pending', 'approved', 'closed', 'expired', 'draft'], default: 'pending' },
  applicantsCount: { type: Number, default: 0 },
  views:       { type: Number, default: 0 },
  isBoosted:   { type: Boolean, default: false },

  roles:         [{ type: String }],
  qualifications:   [{ type: String }],
  minimumEducation: { type: String },
  certificationsRequired: [{ type: String }],

  noticePeriod:     { type: String },
  shiftTiming:      { type: String },
  interviewProcess: { type: String },
  joiningTimeline:  { type: String },
  screeningQuestions: [{
    question: { type: String, required: true },
    required: { type: Boolean, default: true },
  }],

  projectFee:          { type: Number },
  hourlyRate:          { type: Number },

  isClientProject:     { type: Boolean, default: false },
  clientProjectLabel:  { type: String },
  tools:               [{ type: String }],
  experienceLevel:     { type: String, enum: ['fresher', 'intermediate', 'expert'] },
  portfolioRequired:   { type: Boolean, default: false },
  portfolioType:       { type: String },
  equipmentRequired:   { type: String },
  longTermCollaboration:{ type: Boolean, default: false },
  portfolioCredit:     { type: Boolean, default: false },
  revisionPolicy:      { type: String },
  paymentSchedule:     { type: String },
  testTask: {
    title:       { type: String },
    description: { type: String },
  },
}, { timestamps: true, discriminatorKey: 'kind' })

module.exports = mongoose.model('BasePosting', basePostingSchema)
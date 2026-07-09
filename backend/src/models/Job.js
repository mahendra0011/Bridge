const mongoose = require('mongoose')

const jobSchema = new mongoose.Schema({
  company:        { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  agency:         { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  postedBy:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:          { type: String, required: true },
  description:    { type: String, required: true },
  skills:         [{ type: String }],
  experience:     { type: String, enum: ['Fresher', '1-3 years', '3-5 years', '5+ years', '10+ years'], default: 'Fresher' },
  salaryMin:      { type: Number },
  salaryMax:      { type: Number },
  location:       { type: String },
  mode:           { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'Remote' },
  employmentType: { type: String, enum: ['Full-time', 'Part-time', 'Contract'], default: 'Full-time' },
  category:       { type: String },
  vacancies:      { type: Number, default: 1 },
  deadline:       { type: Date },
  benefits:       [{ type: String }],
  status:         { type: String, enum: ['pending', 'approved', 'closed', 'expired', 'draft'], default: 'pending' },
  applicantsCount:{ type: Number, default: 0 },
  views:          { type: Number, default: 0 },
  isBoosted:      { type: Boolean, default: false },
  isFeatured:     { type: Boolean, default: false },

  // Job-specific extended fields
  goodToHaveSkills: [{ type: String }],
  roles:            [{ type: String }],
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

  // Pay model fields
  projectFee:          { type: Number },
  hourlyRate:          { type: Number },

  // Agency-specific extended fields
  duration:            { type: String },
  perks:               [{ type: String }],
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
  screeningProcess:    { type: String },
  testTask: {
    title:       { type: String },
    description: { type: String },
    paidAmount:  { type: Number },
  },
  milestoneBreakdown: [{
    milestone:   { type: String },
    percentage:  { type: Number },
    description: { type: String },
  }],
  usageRights: { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Job', jobSchema)

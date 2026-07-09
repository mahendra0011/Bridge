const mongoose = require('mongoose')

const internshipSchema = new mongoose.Schema({
  company:     { type: mongoose.Schema.Types.ObjectId, ref: 'Company' },
  agency:      { type: mongoose.Schema.Types.ObjectId, ref: 'Agency' },
  postedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, required: true },
  description: { type: String, required: true },
  skills:      [{ type: String }],
  goodToHaveSkills: [{ type: String }],
  duration:    { type: String },
  stipend:     { type: Number },
  startDate:   { type: Date },
  hasPPO:      { type: Boolean, default: false },
  location:    { type: String },
  mode:        { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'Remote' },
  category:    { type: String },
  internshipType: { type: String, enum: ['Full-time', 'Part-time'] },
  vacancies:   { type: Number, default: 1 },
  deadline:    { type: Date },
  benefits:    [{ type: String }],
  status:      { type: String, enum: ['pending', 'approved', 'closed', 'expired', 'draft'], default: 'pending' },
  applicantsCount: { type: Number, default: 0 },
  views:       { type: Number, default: 0 },
  isBoosted:   { type: Boolean, default: false },
  isFeatured:  { type: Boolean, default: false },

  // Internship-specific fields
  roles:         [{ type: String }],
  learningOutcomes: [{ type: String }],
  perks:         [{ type: String }],
  eligibility: {
    yearOfStudy: { type: String },
    ageLimit:    { type: String },
    minCGPA:     { type: String },
    noBacklogs:  { type: Boolean, default: false },
  },
  degreeRequired: { type: String },
  laptopRequired: { type: String },
  screeningProcess: { type: String },
  cohortStartDate:  { type: Date },
  weeklyHours:      { type: Number },
  applicationFee:   { type: String, default: 'none' },
  screeningQuestions: [{
    question: { type: String, required: true },
    required: { type: Boolean, default: true },
  }],

  // Pay model fields
  projectFee:          { type: Number },
  hourlyRate:          { type: Number },

  // Agency-specific extended fields
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
    paidAmount:  { type: Number },
  },
  milestoneBreakdown: [{
    milestone:   { type: String },
    percentage:  { type: Number },
    description: { type: String },
  }],
  usageRights: { type: String },
}, { timestamps: true })

module.exports = mongoose.model('Internship', internshipSchema)

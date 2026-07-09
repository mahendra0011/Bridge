const mongoose = require('mongoose')

const opportunitySchema = new mongoose.Schema({
  poster:          { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:           { type: String, required: true },
  description:     { type: String, required: true },
  opportunityType: { type: String, enum: ['Project-based', 'Part-time', 'Full-time'], default: 'Project-based' },
  role:            { type: String },
  peopleNeeded:    { type: Number, default: 1 },
  filledCount:     { type: Number, default: 0 },
  location:        { type: String },
  mode:            { type: String, enum: ['Remote', 'Hybrid', 'On-site'], default: 'Remote' },
  budget:          { type: Number },
  budgetType:      { type: String, enum: ['fixed', 'monthly', 'hourly'], default: 'fixed' },
  duration:        { type: String, enum: ['1 month', '4 months', '6 months', '1 year', 'Long-term'], default: '1 month' },
  startDate:       { type: Date },
  deadline:        { type: Date },
  skills:          [{ type: String }],
  goodToHaveSkills:[{ type: String }],
  tools:           [{ type: String }],
  scope:           [{ type: String }],
  experienceLevel: { type: String, enum: ['Fresher', 'Intermediate', 'Expert'] },
  portfolioRequired:{ type: Boolean, default: false },
  weeklyHours:     { type: String },
  ownEquipment:    { type: String },
  paymentSchedule: { type: String },
  longTermPossible:{ type: Boolean, default: false },
  laptopRequired:  { type: String },
  screeningProcess:{ type: String },
  screeningQuestions: [{
    question: { type: String, required: true },
    required: { type: Boolean, default: true },
  }],
  rolesNeeded:     [{
    title: { type: String, required: true },
    count: { type: Number, required: true },
  }],
  applicantsCount: { type: Number, default: 0 },
  views:           { type: Number, default: 0 },
  status:          { type: String, enum: ['active', 'filled', 'closed', 'expired', 'archived'], default: 'active' },
}, { timestamps: true })

module.exports = mongoose.model('Opportunity', opportunitySchema)

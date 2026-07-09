const mongoose = require('mongoose')

const applicationSchema = new mongoose.Schema({
  applicant:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  postingType:  { type: String, enum: ['internship', 'job', 'opportunity'], required: true },
  posting:      { type: mongoose.Schema.Types.ObjectId, refPath: 'postingModel', required: true },
  postingModel: { type: String, enum: ['Internship', 'Job', 'Opportunity'], required: true },
  resumeUrl:    { type: String },
  coverLetter:  { type: String },
  portfolioUrl: { type: String },
  linkedinUrl:  { type: String },
  status: {
    type: String,
    enum: ['Applied','Under Review','Shortlisted','Interview Scheduled','Rejected','Offered','Hired','Selected'],
    default: 'Applied'
  },
  statusHistory: [{
    status: { type: String },
    date:   { type: Date, default: Date.now },
    _id: false,
  }],
  interviewDate: { type: Date },
  interviewLink: { type: String },
  notes:         { type: String },

  // Agency listing specific fields
  testTaskUrl:     { type: String },
  screeningAnswers:{ type: mongoose.Schema.Types.Mixed },
}, { timestamps: true })

applicationSchema.pre('save', function (next) {
  if (this.isNew) {
    this.statusHistory = [{ status: this.status, date: this.createdAt || new Date() }]
  }
  next()
})

module.exports = mongoose.model('Application', applicationSchema)

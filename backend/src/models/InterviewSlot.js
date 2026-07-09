const mongoose = require('mongoose')

const interviewSlotSchema = new mongoose.Schema({
  company:    { type: mongoose.Schema.Types.ObjectId, ref: 'Company', required: true },
  posting:    { type: mongoose.Schema.Types.ObjectId, refPath: 'postingModel', required: true },
  postingModel: { type: String, enum: ['Internship', 'Job'], required: true },
  startTime:  { type: Date, required: true },
  endTime:    { type: Date, required: true },
  timezone:   { type: String, default: 'UTC' },
  isBooked:   { type: Boolean, default: false },
  meetLink:   { type: String },
  bookedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

module.exports = mongoose.model('InterviewSlot', interviewSlotSchema)

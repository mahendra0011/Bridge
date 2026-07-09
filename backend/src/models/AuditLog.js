const mongoose = require('mongoose')

const auditLogSchema = new mongoose.Schema({
  admin:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action:    { type: String, required: true },
  target:    { type: String },
  targetId:  { type: mongoose.Schema.Types.ObjectId },
  details:   { type: mongoose.Schema.Types.Mixed },
  ip:        { type: String },
}, { timestamps: true })

module.exports = mongoose.model('AuditLog', auditLogSchema)

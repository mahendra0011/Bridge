const AuditLog = require('../models/AuditLog')

exports.logAudit = (action, target = null, details = null) => async (req, res, next) => {
  try {
    await AuditLog.create({
      admin: req.user?._id,
      action,
      target,
      targetId: req.params?.id || req.body?.targetId,
      details,
      ip: req.ip,
    })
  } catch (_) {}
  next()
}

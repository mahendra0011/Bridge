const jwt = require('jsonwebtoken')
const User = require('../models/User')
const { model: AdminRole, PERMISSIONS } = require('../models/AdminRole')
const TokenBlacklist = require('../models/TokenBlacklist')

exports.protect = async (req, res, next) => {
  try {
    let token = null

    if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt
    }

    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) return res.status(401).json({ message: 'Not authenticated' })
    
    // Check if token is blacklisted
    const isBlacklisted = await TokenBlacklist.findOne({ token })
    if (isBlacklisted) return res.status(401).json({ message: 'Token has been invalidated' })
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password').populate('adminRoleId')
    if (!req.user) return res.status(401).json({ message: 'User not found' })
    if (req.user.isBlocked) return res.status(403).json({ message: 'Account blocked' })
    next()
  } catch {
    res.status(401).json({ message: 'Invalid token' })
  }
}

exports.restrictTo = (...roles) => (req, res, next) => {
  if (!roles.includes(req.user.role))
    return res.status(403).json({ message: 'Access denied' })
  next()
}

// Check if user has a specific admin permission (for sub-admins/moderators)
exports.hasPermission = (permission) => async (req, res, next) => {
  // Super admin has all permissions
  if (req.user.role === 'admin') return next()

  // Check if user has the permission via their role
  if (req.user.role === 'moderator' || req.user.role === 'support') {
    const adminRole = req.user.adminRoleId
    if (adminRole && adminRole.permissions && adminRole.permissions.includes(permission)) {
      return next()
    }
  }

  return res.status(403).json({ message: 'Permission denied. Required: ' + permission })
}

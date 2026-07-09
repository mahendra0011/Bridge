const crypto = require('crypto')

const CSRF_HEADER = 'x-csrf-token'
const CSRF_COOKIE = 'csrf-token'

exports.generateCsrfToken = (req, res, next) => {
  const token = crypto.randomBytes(32).toString('hex')
  res.cookie(CSRF_COOKIE, token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24
  })
  res.locals.csrfToken = token
  next()
}

exports.csrfProtection = (req, res, next) => {
  if (process.env.NODE_ENV !== 'production') {
    return next()
  }
  const cookieToken = req.cookies?.[CSRF_COOKIE]
  const headerToken = req.get(CSRF_HEADER)
  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({ message: 'CSRF token invalid or missing' })
  }
  next()
}
const jwt = require('jsonwebtoken')

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

exports.signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

exports.setTokenCookie = (res, token) => {
  res.cookie('jwt', token, COOKIE_OPTIONS)
}

exports.clearTokenCookie = (res) => {
  res.cookie('jwt', 'none', { ...COOKIE_OPTIONS, maxAge: 0 })
}

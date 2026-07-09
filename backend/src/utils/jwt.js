const jwt = require('jsonwebtoken')

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

const REFRESH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
}

exports.signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' })

exports.signRefreshToken = (id) =>
  jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '30d' })

exports.verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET)

exports.setTokenCookie = (res, token) => {
  res.cookie('jwt', token, COOKIE_OPTIONS)
}

exports.setRefreshTokenCookie = (res, token) => {
  res.cookie('refresh-token', token, REFRESH_COOKIE_OPTIONS)
}

exports.clearTokenCookie = (res) => {
  res.cookie('jwt', 'none', { ...COOKIE_OPTIONS, maxAge: 0 })
  res.cookie('refresh-token', 'none', { ...REFRESH_COOKIE_OPTIONS, maxAge: 0 })
}

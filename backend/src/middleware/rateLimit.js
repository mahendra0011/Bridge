const rateLimit = require('express-rate-limit')

// Strict limiter for login — the main brute-force target. Counts failed and
// successful attempts together since an attacker won't know which succeeded.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please try again in 15 minutes.' },
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
})

// Looser limiter for signup — prevents mass account creation / email spam
// without blocking normal sign-up traffic from a shared IP (e.g. campus wifi).
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many accounts created from this network. Please try again later.' },
})

// Forgot-password is an email-sending endpoint — needs its own limiter so it
// can't be used to spam a victim's inbox or enumerate registered emails.
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many password reset requests. Please try again in 15 minutes.' },
  keyGenerator: (req) => `${req.ip}:${(req.body?.email || '').toLowerCase()}`,
})

module.exports = { loginLimiter, signupLimiter, forgotPasswordLimiter }

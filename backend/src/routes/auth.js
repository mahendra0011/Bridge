const router = require('express').Router()
const crypto = require('crypto')
const { body } = require('express-validator')
const User = require('../models/User')
const StudentProfile = require('../models/StudentProfile')
const Company = require('../models/Company')
const Agency = require('../models/Agency')
const { signToken, signRefreshToken, verifyRefreshToken, setTokenCookie, setRefreshTokenCookie, clearTokenCookie } = require('../utils/jwt')
const { sendEmail, resetEmail, otpEmail } = require('../utils/email')
const { protect } = require('../middleware/auth')
const { validate } = require('../middleware/validate')
const { loginLimiter, signupLimiter, forgotPasswordLimiter } = require('../middleware/rateLimit')
const zxcvbn = require('zxcvbn')
const jwt = require('jsonwebtoken')
const TokenBlacklist = require('../models/TokenBlacklist')

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Generate a 6-digit numeric OTP */
function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/** Hash OTP before storing (bcrypt would be overkill; crypto is fine) */
function hashOtp(otp) {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

/** Password strength validation using zxcvbn */
function validatePasswordStrength(value) {
  const result = zxcvbn(value)
  if (result.score < 3) {
    throw new Error('Password is too weak. ' + result.feedback.suggestions?.[0] || 'Use a stronger password.')
  }
  return true
}

// ─── Validators ─────────────────────────────────────────────────────────────

const signupValidators = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .custom(validatePasswordStrength),
  body('role').optional().isIn(['student', 'company']).withMessage('Invalid role'),
  body('companyName').if(body('role').equals('company')).trim().notEmpty().withMessage('Company name is required'),
]

const companySignupValidators = [
  body('companyName').trim().notEmpty().withMessage('Company name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .custom(validatePasswordStrength),
  body('contactPerson').trim().notEmpty().withMessage('Contact person name is required'),
  body('designation').isIn(['Founder', 'HR Manager', 'Recruiter', 'Talent Acquisition', 'Other']).withMessage('Select a valid designation'),
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('acceptedTerms').isBoolean().withMessage('You must accept the terms').custom(v => v === true || v === 'true'),
]

const loginValidators = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required'),
]

const forgotPasswordValidators = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
]

const resetPasswordValidators = [
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .custom(validatePasswordStrength),
]

// ─── Routes ─────────────────────────────────────────────────────────────────

/**
 * POST /api/auth/signup
 * Creates the account, generates OTP, sends email.
 * Does NOT return a session token yet — user must verify OTP first.
 */
router.post('/signup', signupLimiter, signupValidators, validate, async (req, res) => {
  try {
    const { name, email, password, role = 'student', companyName } = req.body

    // Case: Email already registered
    const existing = await User.findOne({ email })
    if (existing) {
      // Case: already verified → just say so, don't leak account info
      if (existing.isEmailVerified) {
        return res.status(400).json({ message: 'Email already registered. Please log in.' })
      }
      // Case: registered but never verified → resend OTP, let them try again
      const otp = generateOtp()
      existing.otpCode    = hashOtp(otp)
      existing.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
      existing.otpAttempts = 0
      await existing.save()
      let resendEmailSent = false
      try {
        await sendEmail({ to: email, ...otpEmail(existing.name, otp) })
        resendEmailSent = true
      } catch (e) {
        console.error('Resend OTP email failed:', e.message)
      }
      if (!resendEmailSent) {
        return res.status(500).json({ message: 'Failed to send OTP. Please try again later.' })
      }
      return res.status(200).json({
        message: 'OTP sent again — check your inbox.',
        pendingEmail: email,
      })
    }

    // Happy path: new user
    const otp = generateOtp()
    const user = await User.create({
      name,
      email,
      password,
      role,
      otpCode:     hashOtp(otp),
      otpExpires:  new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
    })

    // Create role-specific profile
    if (role === 'student') {
      await StudentProfile.create({ user: user._id })
    } else if (role === 'company') {
      await Company.create({ user: user._id, name: companyName || name })
    }

    // Send OTP email (non-blocking — don't fail signup if email fails)
    let signupEmailSent = false
    try {
      await sendEmail({ to: email, ...otpEmail(name, otp) })
      signupEmailSent = true
    } catch (e) {
      console.error('OTP email failed during signup:', e.message)
    }

    // Return pendingEmail so frontend knows where to show the OTP form
    res.status(201).json({
      message: signupEmailSent
        ? 'Account created. Enter the OTP sent to your email.'
        : 'Account created. OTP email delivery failed — please use the resend button.',
      pendingEmail: email,
      emailFailed: !signupEmailSent,
    })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * POST /api/auth/company-signup
 * Step 1 of company signup — creates User + Company with all step-1 fields.
 * OTP is sent to email. After verifying OTP the user can proceed to step 2.
 */
router.post('/company-signup', signupLimiter, companySignupValidators, validate, async (req, res) => {
  try {
    const { companyName, email, password, contactPerson, designation, phone, website, acceptedTerms } = req.body

    // Duplicate check — email
    const existing = await User.findOne({ email })
    if (existing) {
      if (existing.isEmailVerified) {
        return res.status(400).json({ message: 'Email already registered. Please log in.' })
      }
      const otp = generateOtp()
      existing.otpCode    = hashOtp(otp)
      existing.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
      existing.otpAttempts = 0
      await existing.save()
      try {
        await sendEmail({ to: email, ...otpEmail(contactPerson, otp) })
      } catch (e) {
        return res.status(500).json({ message: 'Failed to send OTP. Try again.' })
      }
      return res.status(200).json({
        message: 'OTP sent again — check your inbox.',
        pendingEmail: email,
      })
    }

    // Extract email domain for later domain check
    const emailDomain = email.split('@')[1]?.toLowerCase() || ''

    const otp = generateOtp()
    const user = await User.create({
      name: contactPerson,
      email,
      password,
      phone,
      designation,
      acceptedTerms: acceptedTerms === true || acceptedTerms === 'true',
      role: 'company',
      otpCode: hashOtp(otp),
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
    })

    // Create Company doc with step=1
    const company = await Company.create({
      user: user._id,
      name: companyName,
      email,
      contactPerson,
      designation,
      phone,
      companyEmailDomain: emailDomain,
      signupStep: 1,
      isProfileComplete: false,
    })

    // Link user to company
    user.companyId = company._id
    await user.save()

    try {
      await sendEmail({ to: email, ...otpEmail(contactPerson, otp) })
    } catch (e) {
      console.error('OTP email failed during company signup:', e.message)
    }

    res.status(201).json({
      message: 'Account created. Enter the OTP sent to your email.',
      pendingEmail: email,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists.' })
    }
    res.status(500).json({ message: err.message })
  }
})

/**
 * POST /api/auth/agency-signup
 * Step 1 of agency signup — creates User + Agency with basic info.
 * OTP is sent to email. After verifying OTP the user can proceed to step 2.
 */
router.post('/agency-signup', signupLimiter, async (req, res) => {
  try {
    const { name, email, password, phone, acceptedTerms } = req.body

    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' })
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' })
    }

    // Duplicate check
    const existing = await User.findOne({ email })
    if (existing) {
      if (existing.isEmailVerified) {
        return res.status(400).json({ message: 'Email already registered. Please log in.' })
      }
      const otp = generateOtp()
      existing.otpCode    = hashOtp(otp)
      existing.otpExpires = new Date(Date.now() + 10 * 60 * 1000)
      existing.otpAttempts = 0
      await existing.save()
      try {
        await sendEmail({ to: email, ...otpEmail(name, otp) })
      } catch (e) {
        return res.status(500).json({ message: 'Failed to send OTP. Try again.' })
      }
      return res.status(200).json({
        message: 'OTP sent again — check your inbox.',
        pendingEmail: email,
      })
    }

    const otp = generateOtp()
    const user = await User.create({
      name,
      email,
      password,
      phone,
      acceptedTerms: acceptedTerms === true || acceptedTerms === 'true',
      role: 'agency',
      otpCode: hashOtp(otp),
      otpExpires: new Date(Date.now() + 10 * 60 * 1000),
      otpAttempts: 0,
    })

    // Create Agency doc with step=1
    await Agency.create({
      user: user._id,
      agencyName: name,
      signupStep: 1,
    })

    try {
      await sendEmail({ to: email, ...otpEmail(name, otp) })
    } catch (e) {
      console.error('OTP email failed:', e.message)
    }

    res.status(201).json({
      message: 'Account created. Enter the OTP sent to your email.',
      pendingEmail: email,
    })
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: 'An account with this email already exists.' })
    }
    res.status(500).json({ message: err.message })
  }
})

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * Verifies the OTP. On success sets JWT cookie + returns user data.
 */
router.post('/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' })

    const user = await User.findOne({ email }).select('+otpCode +password')
    if (!user) return res.status(400).json({ message: 'No account found for this email' })

    // Case: already verified (double submit / retry)
    if (user.isEmailVerified) {
      const token = signToken(user._id)
      setTokenCookie(res, token)
      return res.json({
        message: 'Email already verified.',
        user: { _id: user._id, name: user.name, email: user.email, role: user.role },
      })
    }

    // Case: OTP expired
    if (!user.otpCode || !user.otpExpires || user.otpExpires < new Date()) {
      return res.status(400).json({ message: 'OTP expired. Please request a new one.' })
    }

    // Case: too many wrong attempts (max 5)
    if (user.otpAttempts >= 5) {
      return res.status(429).json({ message: 'Too many wrong attempts. Please request a new OTP.' })
    }

    // Case: wrong OTP
    if (user.otpCode !== hashOtp(otp)) {
      user.otpAttempts = (user.otpAttempts || 0) + 1
      await user.save()
      const remaining = 5 - user.otpAttempts
      return res.status(400).json({
        message: remaining > 0
          ? `Wrong OTP. ${remaining} attempt${remaining === 1 ? '' : 's'} remaining.`
          : 'Too many wrong attempts. Please request a new OTP.',
      })
    }

    // ✅ Correct OTP — mark verified, clear OTP fields, issue token
    user.isEmailVerified = true
    user.otpCode         = undefined
    user.otpExpires      = undefined
    user.otpAttempts     = 0
    await user.save()

const token = signToken(user._id)
     const refreshToken = signRefreshToken(user._id)
     setTokenCookie(res, token)
     setRefreshTokenCookie(res, refreshToken)
     res.json({
       message: 'Email verified successfully!',
       user: { _id: user._id, name: user.name, email: user.email, role: user.role },
     })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * POST /api/auth/resend-otp
 * Body: { email }
 * Generates fresh OTP and resends. Rate-limited to prevent abuse.
 */
router.post('/resend-otp', async (req, res) => {
  try {
    const { email } = req.body
    if (!email) return res.status(400).json({ message: 'Email is required' })

    const user = await User.findOne({ email }).select('+otpCode')
    if (!user) return res.status(400).json({ message: 'No account found for this email' })

    // Case: already verified
    if (user.isEmailVerified) {
      return res.status(400).json({ message: 'This email is already verified. Please log in.' })
    }

    // Case: recently sent — don't spam (cooldown: 60 seconds)
    if (user.otpExpires && user.otpExpires > new Date(Date.now() + 9 * 60 * 1000)) {
      return res.status(429).json({ message: 'Please wait before requesting another OTP.' })
    }

    const otp = generateOtp()
    user.otpCode     = hashOtp(otp)
    user.otpExpires  = new Date(Date.now() + 10 * 60 * 1000)
    user.otpAttempts = 0
    await user.save()

    try {
      await sendEmail({ to: email, ...otpEmail(user.name, otp) })
    } catch (e) {
      return res.status(500).json({ message: 'Failed to send OTP email. Try again.' })
    }

    res.json({ message: 'New OTP sent to your email.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * POST /api/auth/login
 * Standard login — blocks unverified users with helpful message.
 * On success sets JWT httpOnly cookie.
 */
router.post('/login', loginLimiter, loginValidators, validate, async (req, res) => {
  try {
    const { email, password } = req.body
    const user = await User.findOne({ email }).select('+password')

    // Case: wrong credentials
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    // Case: blocked
    if (user.isBlocked) {
      return res.status(403).json({ message: 'Your account has been blocked. Contact support.' })
    }

    // Case: email not verified → tell frontend to show OTP screen
    if (!user.isEmailVerified) {
      return res.status(403).json({
        message: 'Please verify your email first.',
        needsVerification: true,
        pendingEmail: email,
      })
    }

const token = signToken(user._id)
     const refreshToken = signRefreshToken(user._id)
     setTokenCookie(res, token)
     setRefreshTokenCookie(res, refreshToken)
     res.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// POST /api/auth/logout
router.post('/logout', protect, async (req, res) => {
  try {
    const token = req.cookies?.jwt
    if (token) {
      const decoded = jwt.decode(token)
      const expiresAt = decoded?.exp ? new Date(decoded.exp * 1000) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      await TokenBlacklist.create({ token, expiresAt })
    }
  } catch (e) {
    console.error('Blacklist error:', e.message)
  }
  clearTokenCookie(res)
  res.clearCookie('csrf-token')
  res.json({ message: 'Logged out' })
})

// GET /api/auth/csrf-token - Get CSRF token for authenticated requests
router.get('/csrf-token', protect, (req, res) => {
  const token = crypto.randomBytes(32).toString('hex')
  res.cookie('csrf-token', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 24
  })
  res.json({ csrfToken: token })
})

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  let company = null
  let agency = null
  if (req.user.role === 'company') {
    company = await Company.findOne({ user: req.user._id }).select('signupStep isProfileComplete name logoUrl isVerified')
  }
  if (req.user.role === 'agency') {
    agency = await Agency.findOne({ user: req.user._id }).select('signupStep isProfileComplete agencyName logoUrl isVerified city services teamSize foundedYear portfolioUrl instagram udyamNumber isRegistered')
  }
  res.json({ user: req.user, company, agency })
})

/**
 * POST /api/auth/change-password  (requires login)
 * Body: { currentPassword, newPassword }
 */
router.post(
  '/change-password',
  protect,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
      .custom(validatePasswordStrength),
  ],
  validate,
  async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body
      const user = await User.findById(req.user._id).select('+password')
      if (!user) return res.status(404).json({ message: 'User not found' })

      // Case: wrong current password
      const match = await user.comparePassword(currentPassword)
      if (!match) return res.status(400).json({ message: 'Current password is incorrect' })

      // Case: same password
      if (currentPassword === newPassword) {
        return res.status(400).json({ message: 'New password must be different from current password' })
      }

      user.password = newPassword
      await user.save()
      res.json({ message: 'Password changed successfully' })
    } catch (err) {
      res.status(500).json({ message: err.message })
    }
  }
)

/**
 * POST /api/auth/forgot-password
 */
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordValidators, validate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.body.email })
    if (!user) return res.json({ message: 'If this email exists, a reset link was sent.' })

    const token = crypto.randomBytes(32).toString('hex')
    user.resetToken    = token
    user.resetTokenExp = Date.now() + 3600000 // 1hr
    await user.save()

    const link = `${process.env.CLIENT_URL}/reset-password/${token}`
    try {
      await sendEmail({ to: user.email, ...resetEmail(user.name, link) })
    } catch (emailErr) {
      console.error('Failed to send reset email:', emailErr.message)
    }
    res.json({ message: 'If this email exists, a reset link was sent.' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

/**
 * POST /api/auth/reset-password/:token
 */
router.post('/reset-password/:token', resetPasswordValidators, validate, async (req, res) => {
  try {
    const user = await User.findOne({
      resetToken:    req.params.token,
      resetTokenExp: { $gt: Date.now() },
    })
    if (!user) return res.status(400).json({ message: 'Invalid or expired token' })

    user.password      = req.body.password
    user.resetToken    = undefined
    user.resetTokenExp = undefined
    await user.save()
    res.json({ message: 'Password reset successful' })
  } catch (err) {
    res.status(500).json({ message: err.message })
  }
})

// ─── Google OAuth ────────────────────────────────────────────────────────────

/**
 * GET /api/auth/google
 * Redirects user to Google consent screen.
 */
router.get('/google', (req, res, next) => {
  const passport = require('passport')
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })(req, res, next)
})

/**
 * GET /api/auth/google/callback
 * Google redirects here after consent. On success, sets JWT cookie
 * and redirects to frontend with user data (no token in URL).
 */
router.get('/google/callback', (req, res, next) => {
    const passport = require('passport')
    passport.authenticate('google', { session: false, failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed` }, (err, data) => {
      if (err || !data) {
        // Preserve redirect if it exists
        const decodedRedirect = req.query.redirect ? decodeURIComponent(req.query.redirect) : ''
        const failRedirect = decodedRedirect ? `&redirect=${encodeURIComponent(decodedRedirect)}` : ''
        return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=google_auth_failed${failRedirect}`)
      }
const { token, user } = data
       const refreshToken = signRefreshToken(user._id)
       setTokenCookie(res, token)
       setRefreshTokenCookie(res, refreshToken)
       const encoded = Buffer.from(JSON.stringify({ user })).toString('base64')
      // Preserve redirect parameter - it's already been decoded once by Express, encode it for the next hop
      const redirectParam = req.query.redirect ? `&redirect=${encodeURIComponent(req.query.redirect)}` : ''
      res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?data=${encoded}${redirectParam}`)
    })(req, res, next)
  })

/**
 * POST /api/auth/refresh
 * Body: { refreshToken } (from cookie)
 * Returns new access token if refresh token is valid.
 */
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.['refresh-token']
    if (!refreshToken) {
      return res.status(401).json({ message: 'No refresh token' })
    }
    const decoded = verifyRefreshToken(refreshToken)
    const user = await User.findById(decoded.id).select('-password')
    if (!user || user.isBlocked) {
      return res.status(401).json({ message: 'Invalid refresh token' })
    }
    const token = signToken(user._id)
    setTokenCookie(res, token)
    res.json({ user: { _id: user._id, name: user.name, email: user.email, role: user.role } })
  } catch (err) {
    res.status(401).json({ message: 'Invalid refresh token' })
  }
})

module.exports = router

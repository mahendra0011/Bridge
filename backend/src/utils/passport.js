const passport = require('passport')

// Only initialize Google OAuth if credentials are provided
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  const GoogleStrategy = require('passport-google-oauth20').Strategy
  const User = require('../models/User')
  const StudentProfile = require('../models/StudentProfile')
  const { signToken } = require('./jwt')

  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
      },
      async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value
        if (!email) {
          return done(null, false, { message: 'No email returned from Google' })
        }

        // Check if user already exists
        let user = await User.findOne({ $or: [{ googleId: profile.id }, { email }] })

        if (user) {
          // Existing user — link Google ID if not already linked
          if (!user.googleId) {
            user.googleId = profile.id
            if (!user.isEmailVerified) user.isEmailVerified = true
            await user.save()
          }
        } else {
          // New user — create account
          user = await User.create({
            name: profile.displayName,
            email,
            password: require('crypto').randomBytes(32).toString('hex'), // random password
            role: 'student',
            googleId: profile.id,
            isEmailVerified: true,
          })
          // Create student profile
          await StudentProfile.create({ user: user._id })
        }

        // Sign JWT
        const token = signToken(user._id)
        done(null, { token, user: { _id: user._id, name: user.name, email: user.email, role: user.role } })
      } catch (err) {
        done(err, false)
      }
    }
  )
)
}

module.exports = passport

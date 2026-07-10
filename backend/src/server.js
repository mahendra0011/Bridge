require('dotenv').config()
const dns = require('dns')
dns.setServers(['1.1.1.1', '8.8.8.8'])
const express = require('express')
const http = require('http')
const path = require('path')
const { Server } = require('socket.io')
const cors = require('cors')
const helmet = require('helmet')
const mongoose = require('mongoose')
const rateLimit = require('express-rate-limit')
const passport = require('passport')
const cookieParser = require('cookie-parser')
const mongoSanitize = require('express-mongo-sanitize')
const hpp = require('hpp')
const { csrfProtection } = require('./middleware/csrf')
require('./utils/passport')
const { resolveMongoUri } = require('./utils/mongoConnection')

const app = express()
const server = http.createServer(app)
// ─── CORS ─────────────────────────────────────────────────────────────────
// CLIENT_URL controls which origin is allowed. In .env:
//   Local dev:   CLIENT_URL=http://localhost:5173
//   Production:  CLIENT_URL=https://yourfrontenddomain.com
//
// Supports comma-separated list for multiple origins:
//   CLIENT_URL=https://bridge.vercel.app,https://www.yourdomain.com
//
// If CLIENT_URL is not set it falls back to '*' (any origin) which is fine
// for local dev but MUST be set in production to prevent CSRF abuse.
// ─────────────────────────────────────────────────────────────────────────
const rawOrigin = process.env.CLIENT_URL
const ALLOWED_ORIGIN = rawOrigin
  ? rawOrigin.includes(',')
    ? rawOrigin.split(',').map((s) => s.trim())
    : rawOrigin
  : '*'

const isProduction = process.env.NODE_ENV === 'production'

// HTTPS redirect in production
if (isProduction) {
  app.enable('trust proxy')
  app.use((req, res, next) => {
    if (req.secure) return next()
    res.redirect(`https://${req.headers.host}${req.url}`)
  })
}

const io = new Server(server, {
  cors: { origin: ALLOWED_ORIGIN, credentials: true }
})

// Security headers — must come before routes
app.use(helmet({
  contentSecurityPolicy: isProduction ? {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  } : false,
  crossOriginEmbedderPolicy: false,
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}))
// HSTS - enforce HTTPS
if (isProduction) {
  app.use((req, res, next) => {
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')
    res.setHeader('X-Frame-Options', 'DENY')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    next()
  })
}
// CORS - strict mode with exact origin matching
// Normalize origins: treat localhost:5173 and 127.0.0.1:5173 as equivalent in dev
const normalizeOrigin = (origin) => origin?.replace('127.0.0.1', 'localhost')

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    if (ALLOWED_ORIGIN === '*') return callback(null, true)
    const normalized = normalizeOrigin(origin)
    const allowed = Array.isArray(ALLOWED_ORIGIN) ? ALLOWED_ORIGIN : [ALLOWED_ORIGIN]
    const isAllowed = allowed.some(o => normalizeOrigin(o) === normalized)
    if (isAllowed) return callback(null, true)
    callback(new Error('Not allowed by CORS'))
  },
  credentials: true
}
app.use(cors(corsOptions))
app.use(express.json())
app.use(mongoSanitize()) // NoSQL injection prevention
app.use(hpp()) // HTTP Parameter Pollution prevention
// XSS sanitization for string inputs in production
if (isProduction) {
  const sanitizeHtml = require('sanitize-html')
  app.use((req, res, next) => {
    if (req.body && typeof req.body === 'object') {
      for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
          req.body[key] = sanitizeHtml(req.body[key], { allowedTags: [], allowedAttributes: {} })
        }
      }
    }
    next()
  })
}
app.use(cookieParser())
// Serve uploaded files. Use an absolute path so the server works correctly
// no matter which directory `node` is invoked from.
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))

// Light global limiter as defense-in-depth. Sensitive endpoints (login,
// signup, forgot-password) have their own stricter limiters in routes/auth.js.
app.use('/api', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
}))

// Health check — used by Render and load balancers
app.get('/api/health', (req, res) => res.json({ status: 'ok' }))

// CSRF token endpoint (public - for unauthenticated forms)
const { generateCsrfToken } = require('./middleware/csrf')
app.get('/api/csrf-token', generateCsrfToken, (req, res) => {
  res.json({ csrfToken: res.locals.csrfToken })
})

// Security status endpoint (admin monitoring)
app.get('/api/security-status', require('./middleware/auth').protect, require('./middleware/auth').restrictTo('admin'), (req, res) => {
  res.json({
    rateLimitActive: true,
    csrfActive: isProduction,
    mongoSanitizeActive: true,
    hppActive: true,
    httpsEnforced: isProduction,
    hstsActive: isProduction,
    cspActive: isProduction
  })
})

// Routes
app.use('/api/auth',        require('./routes/auth'))
app.use('/api/student',     csrfProtection, require('./routes/student'))
app.use('/api/company/candidates', csrfProtection, require('./routes/candidates'))
app.use('/api/company',     csrfProtection, require('./routes/company'))
app.use('/api/internships', csrfProtection, require('./routes/internships'))
app.use('/api/jobs',        csrfProtection, require('./routes/jobs'))
app.use('/api/admin',       csrfProtection, require('./routes/admin'))
app.use('/api/search',      csrfProtection, require('./routes/search'))
app.use('/api/agency',       csrfProtection, require('./routes/agency'))
app.use('/api/opportunities', csrfProtection, require('./routes/opportunities'))
app.use('/api/person',       csrfProtection, require('./routes/person'))
app.use('/api/community',    csrfProtection, require('./routes/community'))
app.use('/api/reports',      csrfProtection, require('./routes/reports'))
app.use('/api/contact',      require('./routes/contact')) // Public endpoint, no CSRF needed

// Socket.io
require('./utils/socket')(io)
app.set('io', io)

;(async () => {
  try {
    const resolvedUri = await resolveMongoUri(process.env.MONGO_URI || 'mongodb://localhost:27017/bridge')
    await mongoose.connect(resolvedUri)
    console.log('MongoDB connected')

    // Start scheduled cron jobs
    const { initCronJobs } = require('./cron')
    initCronJobs()

    server.listen(process.env.PORT || 5000, () =>
      console.log(`Server on port ${process.env.PORT || 5000}`)
    )
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
})()




























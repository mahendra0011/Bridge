// One-off script to create (or update) an admin user.
// Usage:
//   node src/scripts/seedAdmin.js
// Reads credentials from .env (ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME) so no
// secrets are hardcoded here. Safe to run multiple times — it upserts.

require('dotenv').config()
const dns = require('dns')
dns.setServers(['1.1.1.1', '8.8.8.8'])
const mongoose = require('mongoose')
const User = require('../models/User')

async function run() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD
  const name = process.env.ADMIN_NAME || 'Admin'

  if (!email || !password) {
    console.error('Missing ADMIN_EMAIL or ADMIN_PASSWORD in .env')
    console.error('Add these to backend/.env before running this script:')
    console.error('  ADMIN_EMAIL=admin@bridge.io')
    console.error('  ADMIN_PASSWORD=choose_a_strong_password')
    console.error('  ADMIN_NAME=Admin (optional)')
    process.exit(1)
  }

  if (password.length < 8) {
    console.error('ADMIN_PASSWORD must be at least 8 characters.')
    process.exit(1)
  }

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/bridge'
  await mongoose.connect(mongoUri)
  console.log('Connected to MongoDB.')

  let admin = await User.findOne({ email: email.toLowerCase() }).select('+password')

  if (admin) {
    admin.name = name
    admin.role = 'admin'
    admin.isEmailVerified = true
    admin.isBlocked = false
    admin.password = password // pre('save') hook re-hashes this
    await admin.save()
    console.log(`Updated existing user "${email}" to admin role.`)
  } else {
    admin = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: 'admin',
      isEmailVerified: true,
    })
    console.log(`Created new admin user "${email}".`)
  }

  await mongoose.disconnect()
  console.log('Done.')
}

run().catch((err) => {
  console.error('Seed failed:', err.message)
  process.exit(1)
})

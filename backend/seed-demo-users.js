// Demo users seed file - creates admin, student, agency, and company demo accounts
const mongoose = require('mongoose')
const User = require('./src/models/User')
const Company = require('./src/models/Company')
const Agency = require('./src/models/Agency')
const StudentProfile = require('./src/models/StudentProfile')

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bridge'

async function seedDemoUsers() {
  try {
    await mongoose.connect(MONGO_URI)
    console.log('Connected to MongoDB\n')

    // Demo Admin
    let adminUser = await User.findOne({ email: 'admin@demo.com' })
    if (!adminUser) {
      adminUser = await User.create({
        name: 'Demo Admin',
        email: 'admin@demo.com',
        password: 'admin@123',
        role: 'admin',
        isEmailVerified: true,
      })
      console.log('✅ Created admin user: admin@demo.com / admin@123')
    } else {
      console.log('ℹ️  Found existing admin user')
    }

    // Demo Student
    let studentUser = await User.findOne({ email: 'student@demo.com' })
    if (!studentUser) {
      studentUser = await User.create({
        name: 'Demo Student',
        email: 'student@demo.com',
        password: 'student@123',
        role: 'student',
        isEmailVerified: true,
        isPhoneVerified: true,
      })
      await StudentProfile.create({ user: studentUser._id })
      console.log('✅ Created student user: student@demo.com / student@123')
    } else {
      console.log('ℹ️  Found existing student user')
    }

    // Demo Company
    let companyUser = await User.findOne({ email: 'company@demo.com' })
    if (!companyUser) {
      companyUser = await User.create({
        name: 'Demo Company HR',
        email: 'company@demo.com',
        password: 'company@123',
        role: 'company',
        isEmailVerified: true,
      })
      console.log('✅ Created company user: company@demo.com / company@123')
    } else {
      console.log('ℹ️  Found existing company user')
    }

    // Demo Agency
    let agencyUser = await User.findOne({ email: 'agency@demo.com' })
    if (!agencyUser) {
      agencyUser = await User.create({
        name: 'Demo Agency',
        email: 'agency@demo.com',
        password: 'agency@123',
        role: 'agency',
        isEmailVerified: true,
      })
      await Agency.create({
        user: agencyUser._id,
        agencyName: 'Demo Talent Agency',
        services: ['Recruitment', 'HR Consulting'],
        city: 'Mumbai',
        isProfileComplete: true,
        signupStep: 2,
        isActive: true,
      })
      console.log('✅ Created agency user: agency@demo.com / agency@123')
    } else {
      console.log('ℹ️  Found existing agency user')
    }

    console.log('\n✅ Demo users seed completed!')
    console.log('Login with:')
    console.log('  - Admin: admin@demo.com / admin@123')
    console.log('  - Student: student@demo.com / student@123')
    console.log('  - Company: company@demo.com / company@123')
    console.log('  - Agency: agency@demo.com / agency@123')

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('Seed failed:', err)
    process.exit(1)
  }
}

seedDemoUsers()
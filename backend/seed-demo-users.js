// Demo users seed file - creates admin, student, agency, and company demo accounts
const mongoose = require('mongoose')
const axios = require('axios')
const User = require('./src/models/User')
const Company = require('./src/models/Company')
const Agency = require('./src/models/Agency')
const StudentProfile = require('./src/models/StudentProfile')

/**
 * Real image URLs for seed data (Unsplash - professional quality)
 * These are high-quality, relevant images for demo agencies
 */
const CLOUDINARY_AGENCY_LOGO = 'https://images.unsplash.com/photo-1551288043-65d8e8e0e3d4?w=150&h=150&fit=crop&q=80'
const CLOUDINARY_PORTFOLIO_TECH = 'https://images.unsplash.com/photo-1467232014286-a89728073327?w=600&h=400&fit=crop&q=80'
const CLOUDINARY_PORTFOLIO_HR = 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&h=400&fit=crop&q=80'

/**
 * Helper to fetch external demo avatar or user profile enrichment via Axios
 */
async function fetchDemoAvatar(username) {
  try {
    const res = await axios.head(`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`, { timeout: 3000 })
    return res.status === 200 ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` : null
  } catch {
    return null
  }
}

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

    // Demo Agency - with logo and portfolio (Cloudinary URLs)
    let agencyUser = await User.findOne({ email: 'agency@demo.com' })
    if (!agencyUser) {
      agencyUser = await User.create({
        name: 'Demo Talent Agency',
        email: 'agency@demo.com',
        password: 'agency@123',
        role: 'agency',
        isEmailVerified: true,
      })
      const agency = await Agency.create({
        user: agencyUser._id,
        agencyName: 'Demo Talent Agency',
        description: 'Leading recruitment agency specializing in tech talent placement across India. We connect top companies with exceptional candidates.',
        website: 'https://demoTalentAgency.com',
        city: 'Mumbai',
        logoUrl: CLOUDINARY_AGENCY_LOGO,
        foundedYear: 2015,
        teamSize: '11-25',
        services: ['Recruitment', 'HR Consulting', 'Talent Acquisition'],
        portfolioUrl: 'https://behance.net/demo-agency',
        instagram: '@demoTalentAgency',
        isProfileComplete: true,
        signupStep: 2,
        isActive: true,
        portfolio: [
          {
            title: 'Tech Hiring Campaign',
            description: 'Successfully placed 50+ developers at top tech companies',
            imageUrl: CLOUDINARY_PORTFOLIO_TECH,
            category: 'Recruitment',
            link: 'https://demoTalentAgency.com/case-studies/tech-hiring'
          },
          {
            title: 'HR Consulting Project',
            description: 'Improved HR processes for mid-size companies',
            imageUrl: CLOUDINARY_PORTFOLIO_HR,
            category: 'HR Consulting',
          }
        ]
      })
      console.log('✅ Created agency user: agency@demo.com / agency@123')
      console.log('✅ Agency created with Cloudinary logo and portfolio')
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
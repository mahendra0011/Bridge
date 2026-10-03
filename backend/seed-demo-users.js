// Demo users seed file - creates admin, student, agency, and company demo accounts
require('dotenv').config()
const mongoose = require('mongoose')
const axios = require('axios')
const { resolveMongoUri } = require('./src/utils/mongoConnection')
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

const MONGO_URI = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/bridge'

async function seedDemoUsers() {
  try {
    await mongoose.connect(await resolveMongoUri(MONGO_URI))
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
      console.log('✅ Created student user: student@demo.com / student@123')
    } else {
      console.log('ℹ️  Found existing student user')
    }
    await StudentProfile.findOneAndUpdate(
      { user: studentUser._id },
      {
        $set: {
          user: studentUser._id,
          firstName: 'Demo',
          lastName: 'Student',
          phone: '9876543210',
          bio: 'A passionate computer science student looking for internship and job opportunities in software development.',
          college: 'Indian Institute of Technology, Bombay',
          degree: 'B.Tech',
          year: 'Final Year',
          cgpa: '8.5',
          skills: ['JavaScript', 'React', 'Node.js', 'Python', 'MongoDB', 'TypeScript', 'AWS'],
          headline: 'Full Stack Developer | Open for opportunities',
          currentLocation: 'Mumbai, India',
          openToWork: true,
          openTo: 'both',
          relocate: true,
          lastActive: new Date(),
          experience: [{ company: 'TechNova', role: 'Frontend Intern', duration: '6 months', current: true }],
          education: [{ degree: 'B.Tech Computer Science', institution: 'IIT Bombay', year: '2026' }],
          projects: [{ title: 'E-Commerce Platform', description: 'Built a full-stack e-commerce platform using React and Node.js', techStack: ['React', 'Node.js', 'MongoDB'], link: 'https://github.com/demo/ecommerce' }],
          certifications: [{ name: 'AWS Cloud Practitioner', issuer: 'Amazon', date: '2024-01' }],
          achievements: [{ title: 'Hackathon Winner', description: 'Won first place at TechHack 2024' }],
          languages: [{ name: 'English', proficiency: 'Fluent' }, { name: 'Hindi', proficiency: 'Native' }],
          jobPreferences: { preferredLocations: ['Mumbai', 'Remote'], preferredRoles: ['Frontend Developer', 'Full Stack Developer'], preferredCompanyType: 'Startup' },
          github: 'https://github.com/demo-student',
          linkedin: 'https://linkedin.com/in/demo-student',
          portfolio: 'https://demo-student.dev',
          isPhoneVerified: true,
          isIdVerified: true,
        }
      },
      { upsert: true, new: true }
    )
    console.log('✅ StudentProfile upserted with full details')

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
    await Company.findOneAndUpdate(
      { user: companyUser._id },
      {
        $set: {
          user: companyUser._id,
          name: 'Demo Company',
          industry: 'Technology',
          size: '201-500',
          foundedYear: 2016,
          hqLocation: 'Bangalore, India',
          location: 'Bangalore, India',
          website: 'https://democompany.com',
          linkedin: 'https://linkedin.com/company/democompany',
          description: 'Demo Company is a leading technology solutions provider specializing in web development, mobile apps, and cloud infrastructure serving 500+ enterprise clients.',
          culture: 'Collaborative engineering culture with weekly tech talks, open-source contributions, and a strong mentorship programme.',
          perks: ['Health insurance', 'Stock options', 'Remote work', 'Learning budget', 'Free lunch', 'Gym membership'],
          companyEmailDomain: 'democompany.com',
          domainVerified: true,
          isVerified: true,
          likelyVerified: true,
          isProfileComplete: true,
          signupStep: 4,
          contactPerson: 'HR Manager',
          designation: 'HR Manager',
          isActive: true,
          profileViews: 500,
          logoUrl: 'https://images.unsplash.com/photo-1576091160399-1e6e4c37548e?w=150&h=150&fit=crop&q=80',
          bannerUrl: 'https://images.unsplash.com/photo-1576091160554-b32a31c4952d?w=1920&h=400&fit=crop&q=80',
          photos: [
            'https://images.unsplash.com/photo-1556756901-49a78f90b8d1?w=600&h=400&fit=crop&q=80',
            'https://images.unsplash.com/photo-1542744095-fcf47d8b5318?w=600&h=400&fit=crop&q=80',
            'https://images.unsplash.com/photo-1517245386807-bb43f82c8e29?w=600&h=400&fit=crop&q=80',
          ],
        }
      },
      { upsert: true, new: true }
    )
    console.log('✅ Company profile upserted with full details')

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
      console.log('✅ Created agency user: agency@demo.com / agency@123')
    } else {
      console.log('ℹ️  Found existing agency user')
    }
    await Agency.findOneAndUpdate(
      { user: agencyUser._id },
      {
        $set: {
          user: agencyUser._id,
          agencyName: 'Demo Talent Agency',
          description: 'Leading recruitment agency specializing in tech talent placement across India. We connect top companies with exceptional candidates and have placed 500+ professionals.',
          website: 'https://demoTalentAgency.com',
          city: 'Mumbai',
          logoUrl: CLOUDINARY_AGENCY_LOGO,
          coverBanner: 'https://images.unsplash.com/photo-1576091160554-b32a31c4952d?w=1920&h=400&fit=crop&q=80',
          foundedYear: 2015,
          teamSize: '11-25',
          services: ['Recruitment', 'HR Consulting', 'Talent Acquisition'],
          portfolioUrl: 'https://behance.net/demo-agency',
          instagram: '@demoTalentAgency',
          linkedin: 'https://linkedin.com/company/demotalentagency',
          isProfileComplete: true,
          signupStep: 2,
          isActive: true,
          isVerified: true,
          isRegistered: true,
          profileViews: 350,
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
              description: 'Improved HR processes for mid-size companies reducing attrition by 30%',
              imageUrl: CLOUDINARY_PORTFOLIO_HR,
              category: 'HR Consulting',
              link: 'https://demoTalentAgency.com/case-studies/hr-consulting'
            }
          ]
        }
      },
      { upsert: true, new: true }
    )
    console.log('✅ Agency profile upserted with full details')

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